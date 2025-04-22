// 结束游戏
function endGame(win) {
    clearInterval(gameState.timer); // Stop the timer
    gameState.timer = null; // 释放定时器引用
    if (elements.board) elements.board.style.pointerEvents = 'none'; // Disable further board clicks
    if (elements.hint) elements.hint.disabled = true; // 禁用提示按钮

    // 清理连接路径和选中状态
    if (gameState.connectionPath) {
        removeConnectionPath();
        gameState.connectionPath = null;
    }

    // 清理选中状态
    if (gameState.selectedTile) {
        if (gameState.selectedTile.element) {
            gameState.selectedTile.element.classList.remove('selected');
        }
        gameState.selectedTile = null;
    }

    // Use setTimeout to allow the last match animation/visual update to potentially finish
    setTimeout(() => {
        // Use new result modal instead of alert
        const timeStr = elements.time ? elements.time.textContent : "N/A";
        showResultModal(win, gameState.score, timeStr, gameState.totalComboCount);
    }, 500); // Slightly longer delay to ensure visual clear completes
}

// --- Result Modal Function ---
function showResultModal(win, score, time, combos) {
    // 安全暂停背景音乐
    if (audioLoadState.isPlaying) {
        audioLoadState.isPlaying = false;
        audioElements.bgMusic.pause();
    }

    // 播放胜利音效
    if (win) {
        // 避免重复设置src，减少内存占用
        if (!audioElements.winSound.src || !audioElements.winSound.src.includes(window.audioPaths.winSound)) {
            audioElements.winSound.src = window.audioPaths.winSound;
        }
        // 使用音效的静音状态而不是旧的统一静音状态
        audioElements.winSound.muted = audioState.soundMuted;
        // 如果音效静音，则不播放胜利音效
        if (!audioState.soundMuted) {
            audioElements.winSound.play().catch(e => debugLog('Win sound error:', e));
        }
    }
    const modal = document.getElementById('resultModal');
    const resultTitle = modal.querySelector('.result-title');
    const resultContent = modal.querySelector('.result-content');
    const finalScore = document.getElementById('finalScore');
    const finalTime = document.getElementById('finalTime');
    const finalCombo = document.getElementById('finalCombo');
    const finalTotalTime = document.getElementById('finalTotalTime');
    const confettiContainer = document.getElementById('confettiContainer');
    const closeButton = document.getElementById('closeModal');

    // 确保模态框居中
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.display = 'block';
    modal.style.opacity = '1';
    modal.classList.add('show');

    if (!modal || !resultTitle || !resultContent || !finalScore || !finalTime || !finalCombo || !finalTotalTime || !confettiContainer || !closeButton) {
        debugLog('Result modal elements not found!', 'error');
        debugLog('error,Some variables was missed, Debug info:', {
            modal: modal,
            resultTitle: resultTitle,
            resultContent: resultContent,
            finalScore: finalScore,
            finalTime: finalTime,
            finalCombo: finalCombo,
            finalTotalTime: finalTotalTime,
            confettiContainer: confettiContainer,
            closeButton: closeButton
        });
        showToast(`${win ? '游戏胜利！' : '游戏结束！'} 分数: ${score}, 时间: ${time}, 总时间: ${formatTime(gameState.totalTime)}, 连击: ${combos}`, win ? 'success' : 'error', 5000);
        return;
    }

    if (finalScore) finalScore.textContent = score;
    if (finalTime) finalTime.textContent = time;
    if (finalCombo) finalCombo.textContent = combos;
    if (finalTotalTime) finalTotalTime.textContent = formatTime(gameState.totalTime);

    // 从语言包获取正确的文本
    const htmlLang = window.lang ?.UTF8SC ?.html || {};

    // 设置标题和内容
    resultTitle.textContent = win ? htmlLang.result_title || "恭喜你赢了！" : htmlLang.game_over || "游戏结束";

    // 获取下一关名称
    if (win && elements.fillMode) {
        const options = elements.fillMode.options;
        const currentIndex = elements.fillMode.selectedIndex;
        const nextIndex = (currentIndex + 1) % options.length;
        const nextLevelName = options[nextIndex].text;
        const isLastLevel = options[nextIndex].value === 'none';

        if (isLastLevel) {
            resultTitle.textContent = htmlLang.result_title || "恭喜你完成所有关卡！";
            resultContent.textContent = '';
            closeButton.textContent = htmlLang.close_button || "再来一局";

            //总分、总时长、总连击全部清零
            gameState.score = 0;
            gameState.time = 0;
            gameState.totalTime = 0;
            gameState.totalComboCount = 0;
            gameState.comboCount = 0;

        } else {
            resultContent.textContent = `${htmlLang.next_level || "接下来："}${nextLevelName}`;
            closeButton.textContent = htmlLang.next_level_button || "下一关";
        }
    } else {
        resultContent.textContent = win ? htmlLang.result_content || "你成功完成了所有配对！" : htmlLang.fail_content || "很遗憾，未能完成全部配对。";
        closeButton.textContent = htmlLang.close_button || "再来一局";
    }

    // 显示 confetti 动画（如有）
    confettiContainer.innerHTML = '';
    if (win) {
        confettiContainer.style.display = 'block';
        // 调用礼花函数
        if (typeof createConfetti === 'function') {
            createConfetti(); // 调用 confetti.js 中的函数
        } else {
            debugLog('createConfetti function not found.', 'warn');
        }
    } else {
        confettiContainer.style.display = 'none';
    }

    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.style.opacity = '1';
        overlay.classList.add('active'); // 添加 active 类以启用 pointer-events
    }

    // 关闭按钮绑定 - 使用一次性事件监听器，避免多次绑定
    // 先移除可能存在的旧事件处理程序
    if (closeButton._clickHandler) {
        closeButton.removeEventListener('click', closeButton._clickHandler);
    }

    // 创建新的事件处理程序并保存引用
    closeButton._clickHandler = function() {
        const overlay = document.querySelector('.modal-overlay'); // Re-select overlay
        if (overlay) {
            overlay.classList.remove('active'); // 移除 active 类
        }
        modal.style.display = 'none';
        modal.classList.remove('show');

        // 清理confetti容器
        if (confettiContainer) {
            confettiContainer.innerHTML = '';
            confettiContainer.style.display = 'none';
        }

        // 如果是胜利且有下一关，则设置下一关
        if (win && elements.fillMode) {
            const options = elements.fillMode.options;
            const currentIndex = elements.fillMode.selectedIndex;
            const nextIndex = (currentIndex + 1) % options.length;
            // 设置下一关索引
            elements.fillMode.selectedIndex = nextIndex;
            // 触发 change 事件，确保fillMode更新生效
            const event = new Event('change');
            elements.fillMode.dispatchEvent(event);
        }

        // 清理模态框资源
        cleanupModalResources();

        // 调用重新开始游戏逻辑
        initGame();
    };

    // 绑定新的事件处理程序
    closeButton.addEventListener('click', closeButton._clickHandler);

    debugLog("end of confetti point. showResultModal called with win:", win);
}

// 清理模态框相关资源
function cleanupModalResources() {
    // 清理DOM引用
    const modal = document.getElementById('resultModal');
    if (modal) {
        const elements = modal.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            // 移除所有事件监听器
            const oldElement = element.cloneNode(true);
            element.parentNode.replaceChild(oldElement, element);
        }
    }

    // 清理音频资源
    if (audioElements.winSound) {
        audioElements.winSound.pause();
        audioElements.winSound.currentTime = 0;
        // 避免内存泄漏
        audioElements.winSound.src = '';
    }

    // 重置游戏状态中的临时变量
    if (gameState) {
        // 保留需要的统计数据
        const { score, totalTime, totalComboCount } = gameState;
        // 清理其他临时状态
        Object.keys(gameState).forEach(key => {
            if (!['score', 'totalTime', 'totalComboCount'].includes(key)) {
                if (typeof gameState[key] === 'object' && gameState[key] !== null) {
                    // 清理对象类型的属性
                    gameState[key] = Array.isArray(gameState[key]) ? [] : {};
                } else {
                    // 重置基本类型的属性
                    gameState[key] = null;
                }
            }
        });
        // 恢复需要保留的统计数据
        Object.assign(gameState, { score, totalTime, totalComboCount });
    }
}