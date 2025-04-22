// 键盘快捷键处理

document.addEventListener('keydown', function(event) {
    // 空格键触发提示功能
    if (event.key === ' ') {
        event.preventDefault(); // 防止空格键滚动页面
        if (elements.hint) {
            elements.hint.click(); // 模拟点击提示按钮
        }
    }

    // R 刷新牌面
    if (event.key === 'r' || event.key === 'R') {
        event.preventDefault(); // 防止默认行为
        if (elements.refresh) {
            elements.refresh.click(); // 模拟点击刷新按钮
        }
    }

    // H 显示帮助
    if (event.key === 'h' || event.key === 'H') {
        event.preventDefault(); // 防止默认行为
        const help = document.getElementById('help');
        if (help) {
            help.click(); // 模拟点击帮助按钮
        }
    }
    
    // 回车键处理
    if (event.key === 'Enter') {
        event.preventDefault();
        const welcomeScreen = document.getElementById('welcomeScreen');
        const resultModal = document.getElementById('resultModal');
        
        if (welcomeScreen && !welcomeScreen.classList.contains('hidden')) {
            // 欢迎界面可见时，点击开始按钮
            debugLog('开始游戏');
            const startButton = document.getElementById('startButton');
            if (startButton) startButton.click();
        } else if (resultModal && resultModal.style.display !== 'none') {
            // 结果弹窗可见时，先关闭弹窗再重新开始游戏
            debugLog('开启下一关');
            const closeButton = document.getElementById('closeModal');
            if (closeButton) closeButton.click();
        } else {
            // 其他情况重新开始游戏
            debugLog('重新开始游戏');
            initGame();
        }
    }
    
    // M 切换静音状态
    if (event.key === 'm' || event.key === 'M') {
        event.preventDefault(); // 防止默认行为
        const soundToggleButton = document.getElementById('soundToggle');
        if (soundToggleButton) {
            soundToggleButton.click(); // 模拟点击静音按钮
        }
    }
});