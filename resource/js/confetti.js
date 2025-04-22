// 礼花动画和成绩单效果的JavaScript实现
let confettiLang;

// 在DOM加载完成后初始化语言包
document.addEventListener('DOMContentLoaded', () => {
    confettiLang = lang.UTF8SC.js.confetti;
});

// 创建礼花元素
function createConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = ''; // 清空容器
    
    // 创建多个礼花元素
    const colors = ['#ffd700', '#ff6b6b', '#48dbfb', '#1dd1a1', '#f368e0', '#ff9f43'];
    const confettiCount = 150; // 礼花数量
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // 随机设置礼花的属性
        const size = Math.random() * 10 + 5; // 5-15px
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100; // 0-100%
        const delay = Math.random() * 3; // 0-3s
        const duration = Math.random() * 5 + 5; // 5-10s
        const startY = -100 - Math.random() * 50; // 从屏幕上方开始
        
        // 设置礼花样式
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.backgroundColor = color;
        confetti.style.left = `${left}%`;
        confetti.style.top = `${startY}px`;
        confetti.style.animationDuration = `${duration}s`;
        confetti.style.animationDelay = `${delay}s`;
        
        // 随机形状
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        } else if (Math.random() > 0.5) {
            confetti.style.transform = 'rotate(45deg)';
        }
        
        container.appendChild(confetti);
    }
}

// 显示结果模态窗口
function showResultModal(win, score, time, combo) {
    const modal = document.getElementById('resultModal');
    const titleElement = modal.querySelector('.result-title');
    const contentElement = modal.querySelector('.result-content');
    const finalScoreElement = document.getElementById('finalScore');
    const finalTimeElement = document.getElementById('finalTime');
    const finalComboElement = document.getElementById('finalCombo');
    
    // 设置模态窗口内容
    if (win) {
        titleElement.textContent = confettiLang.win_title;
        contentElement.textContent = confettiLang.win_content;
        
        // 创建礼花效果
        createConfetti();
    } else {
        titleElement.textContent = confettiLang.game_over;
        contentElement.textContent = confettiLang.no_pairs;
        // 不显示礼花
        document.getElementById('confettiContainer').innerHTML = '';
    }
    
    // 设置分数、时间和连击数
    finalScoreElement.textContent = score;
    finalTimeElement.textContent = time;
    finalComboElement.textContent = combo;
    
    // 显示模态窗口
    modal.classList.add('active');
}

// 停止礼花动画
function stopConfetti() {
    const container = document.getElementById('confettiContainer');
    if (container) {
        // 移除所有礼花元素
        container.innerHTML = '';
    }
}

// 清理画布
function clearCanvas() {
    // 如果有使用canvas元素的礼花效果，这里可以清理它
    // 目前的实现是基于DOM的，所以这个函数主要是为了兼容性
    const canvasElements = document.querySelectorAll('canvas.confetti-canvas');
    canvasElements.forEach(canvas => {
        canvas.remove();
    });
}

// 关闭结果模态窗口
function closeResultModal() {
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    
    // 清理confetti
    stopConfetti();
    clearCanvas();
    
    // 确保在关卡切换前正确处理音频状态
    if (audioLoadState && typeof audioLoadState.isChangingTrack !== 'undefined') {
        audioLoadState.isChangingTrack = true; // 标记正在切换音频，防止播放被中断
        // 延迟初始化游戏，给音频状态切换留出时间
        setTimeout(() => {
            // 重新初始化游戏
            initGame();
            // 游戏初始化完成后重置音频切换状态
            setTimeout(() => {
                audioLoadState.isChangingTrack = false;
            }, 500);
        }, 100);
    } else {
        // 如果音频状态不可用，直接初始化游戏
        initGame();
    }
}

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 关闭按钮点击事件
    document.getElementById('closeModal').addEventListener('click', closeResultModal);
});