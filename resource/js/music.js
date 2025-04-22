// 背景音乐管理
function initBackgroundMusic() {
    const bgMusicList = window.audioPaths.bgMusic;
    if (!Array.isArray(bgMusicList) || bgMusicList.length === 0) {
        debugLog("No background music tracks found.", 'warn');
        return;
    }

    // 初始设置
    audioLoadState.isPlaying = false;
    audioLoadState.isChangingTrack = false; // 添加音频切换状态标记
    let currentTrackIndex = Math.floor(Math.random() * bgMusicList.length);
    const bgAudio = audioElements.bgMusic;

    // 预加载音频资源池 - 限制池大小，避免过多资源占用内存
    const audioPool = new Map();
    const MAX_POOL_SIZE = 3; // 最多同时预加载3个音频文件

    function preloadTrack(url) {
        if (!audioPool.has(url)) {
            // 如果池已满，清理最早加入的音频
            if (audioPool.size >= MAX_POOL_SIZE) {
                const oldestUrl = audioPool.keys().next().value;
                cleanupTrack(oldestUrl);
            }
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = url;
            audioPool.set(url, audio);
        }
        return audioPool.get(url);
    }

    function cleanupTrack(url) {
        const audio = audioPool.get(url);
        if (audio) {
            audio.pause();
            audio.src = '';
            audio.load();
            // 移除任何事件监听器
            audio.onended = null;
            audio.onerror = null;
            audio.oncanplaythrough = null;
            audioPool.delete(url);
        }
    }

    async function playTrack(index) {
        // 标记当前正在进行音频切换，避免多次调用导致中断
        if (audioLoadState.isChangingTrack) {
            debugLog('音频切换中，忽略新的播放请求');
            return;
        }

        audioLoadState.isChangingTrack = true;

        // 如果当前正在播放，先停止并等待资源释放
        if (audioLoadState.isPlaying) {
            audioLoadState.isPlaying = false;
            bgAudio.pause();
            bgAudio.src = '';
            bgAudio.load();
            // 减少延迟到1秒，提高响应速度但仍确保资源释放
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const trackUrl = bgMusicList[index];

        try {
            debugLog('prepare to play:', trackUrl);
            // 使用预加载函数获取音频
            const preloadedAudio = preloadTrack(trackUrl);

            // 提前预加载下一首，提高切换流畅度
            const nextIndex = (index + 1) % bgMusicList.length;
            if (nextIndex !== index) {
                preloadTrack(bgMusicList[nextIndex]);
            }

            // 确保在页面切换或其他操作期间不会中断音频加载
            if (document.hidden) {
                debugLog('页面不可见，延迟播放');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // 清理其他未使用的音频资源，只保留当前和下一首
            bgMusicList.forEach((url, i) => {
                if (i !== index && i !== nextIndex) {
                    cleanupTrack(url);
                }
            });

            // 设置实际播放源 - 直接使用预加载的音频数据
            bgAudio.src = trackUrl;
            bgAudio.loop = false;
            bgAudio.muted = audioState.musicMuted;

            audioLoadState.currentTrack = index;
            audioLoadState.isPlaying = true;

            // 临时静音规避浏览器限制
            const wasMuted = audioState.musicMuted;
            if (!wasMuted) bgAudio.muted = true;

            // 设置错误处理
            let playPromise;
            try {
                // 使用更可靠的播放方式，避免被中断
                playPromise = bgAudio.play();
                await playPromise;
            } catch (playError) {
                if (playError.name === 'AbortError') {
                    debugLog('播放被中断，尝试重新播放');
                    // 如果是中断错误，等待一段时间后重试
                    await new Promise(resolve => setTimeout(resolve, 300));
                    playPromise = bgAudio.play();
                    await playPromise;
                } else {
                    throw playError; // 其他错误继续抛出
                }
            }

            if (!wasMuted) {
                setTimeout(() => {
                    if (audioLoadState.isPlaying) {
                        bgAudio.muted = false;
                    }
                }, 100);
            }
            debugLog(scriptLang.start_playing || "Playing:", trackUrl);
            // 播放成功后重置切换状态
            audioLoadState.isChangingTrack = false;
        } catch (err) {
            debugLog('播放出错，尝试重新加载:', 'warn', err);
            audioLoadState.isPlaying = false;
            bgAudio.muted = true;
            audioLoadState.isChangingTrack = false; // 重置切换状态

            // 限制重试次数，避免无限循环
            const retryCount = bgAudio.retryCount || 0;
            if (retryCount < 3) {
                bgAudio.retryCount = retryCount + 1;
                // 如果播放失败，等待后重试
                setTimeout(() => {
                    if (!audioLoadState.isPlaying) {
                        audioLoadState.isChangingTrack = false; // 重置切换状态
                        playTrack(index);
                    }
                }, 1000);
            } else {
                debugLog('播放失败次数过多，跳到下一曲', 'error');
                bgAudio.retryCount = 0;
                // 跳到下一曲
                const nextIndex = (index + 1) % bgMusicList.length;
                setTimeout(() => {
                    if (!audioLoadState.isPlaying) {
                        audioLoadState.isChangingTrack = false; // 重置切换状态
                        playTrack(nextIndex);
                    }
                }, 1000);
            }
        }
    }

    // 监听结束自动切换
    bgAudio.addEventListener('ended', () => {
        if (!audioLoadState.isPlaying) return;
        currentTrackIndex = (currentTrackIndex + 1) % bgMusicList.length;
        playTrack(currentTrackIndex);
    });

    // 初始化首次播放
    playTrack(currentTrackIndex);

    // 页面卸载时清理所有音频资源
    window.addEventListener('beforeunload', () => {
        bgMusicList.forEach(cleanupTrack);
        audioPool.clear();
        soundEffectPool.forEach((audio, path) => {
            audio.src = '';
            audio.remove();
        });
        soundEffectPool.clear();
    }, { once: true });
}


// Sound effect management
// 音效资源池 - 限制大小并添加自动清理机制
const soundEffectPool = new Map();
const MAX_SOUND_POOL_SIZE = 10; // 最多同时保留10个音效实例

function playSound(soundType) {
    // 检查音效是否被静音
    if (audioState.soundMuted) {
        // 如果音效被静音，直接返回不播放
        return;
    }

    if (!window.audioPaths || !window.audioPaths[soundType]) {
        debugLog(`Sound type ${soundType} not found`, 'warn');
        return;
    }

    const audio = audioElements[soundType];
    if (!audio) {
        debugLog(`Audio element for ${soundType} not initialized`, 'warn');
        return;
    }

    const soundPath = Array.isArray(window.audioPaths[soundType]) ?
        window.audioPaths[soundType][0] :
        window.audioPaths[soundType];

    // 从资源池获取或创建音效实例
    let soundEffect = soundEffectPool.get(soundPath);
    if (!soundEffect) {
        // 如果池已满，清理最早加入的音效
        if (soundEffectPool.size >= MAX_SOUND_POOL_SIZE) {
            const oldestPath = soundEffectPool.keys().next().value;
            const oldSound = soundEffectPool.get(oldestPath);
            if (oldSound) {
                // 清理事件监听器
                oldSound.onended = null;
                oldSound.onerror = null;
                oldSound.oncanplaythrough = null;
                oldSound.src = '';
                oldSound.load();
                soundEffectPool.delete(oldestPath);
            }
        }

        soundEffect = new Audio(soundPath);
        soundEffect.preload = 'auto';
        soundEffectPool.set(soundPath, soundEffect);

        // 使用属性监听器代替addEventListener，更容易清理
        soundEffect.onended = () => {
            soundEffect.currentTime = 0;
        };
    }

    // 不再使用 muted 属性，因为我们已经在函数顶部检查了 soundMuted
    soundEffect.currentTime = 0; // 重置播放位置

    soundEffect.play().catch(e => {
        debugLog(`${soundType} sound error:`, 'warn', e);
    });
}