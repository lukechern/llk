/**
 * 显示漂亮的提示信息
 * @param {string} message - 提示信息内容
 * @param {string} type - 提示类型 'success', 'error', 'warning', 'info'
 * @param {number} duration - 持续时间，默认5000毫秒
 */
function showToast(message, type = 'info', duration = 5000) {
    // 确保CSS已加载
    ensureStylesLoaded();
    
    // 如果已存在toast容器则使用，否则创建新的
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // 创建新的toast元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-appear`;
    
    // 设置图标
    let icon = '';
    switch (type) {
        case 'success':
            icon = '✅';
            break;
        case 'error':
            icon = '🚨';
            break;
        case 'warning':
            icon = '⚠️';
            break;
        case 'info':
        default:
            icon = '✉️';
            break;
    }
    
    // 添加内容
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
    `;
    
    // 将toast添加到容器
    toastContainer.appendChild(toast);
    
    // 添加动画并设置自动消失
    setTimeout(() => {
        toast.classList.remove('toast-appear');
        toast.classList.add('toast-disappear');
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            // 如果没有更多toast，移除容器
            if (toastContainer && toastContainer.children.length === 0) {
                document.body.removeChild(toastContainer);
            }
        }, 300); // 消失动画持续时间
    }, duration);
    
    return toast;
}

// 确保样式已加载
function ensureStylesLoaded() {
    if (!document.getElementById('toast-styles-link')) {
        const link = document.createElement('link');
        link.id = 'toast-styles-link';
        link.rel = 'stylesheet';
        link.href = 'resource/css/toast.css';
        document.head.appendChild(link);
    }
}

/**
 * 显示帮助信息弹窗
 * @param {string} title - 弹窗标题
 * @param {string} content - 帮助内容
 * @param {string} buttonText - 确认按钮文本
 * @param {string} theme - 主题风格，'dark'或'light'，默认为'dark'
 * @returns {HTMLElement} 帮助模态框元素
 */
function showInfoModal(title, content, buttonText = '确定', theme = 'dark') {
    // 确保CSS已加载
    ensureStylesLoaded();
    
    // 检查是否已存在帮助模态框
    let helpModal = document.getElementById('help-modal-container');
    if (helpModal) {
        document.body.removeChild(helpModal);
    }
    
    // 创建模态框容器
    helpModal = document.createElement('div');
    helpModal.id = 'help-modal-container';
    helpModal.className = 'help-modal-container';
    
    // 格式化内容文本，将\n转换为<br>
    const formattedContent = content.replace(/\n/g, '<br>');
    
    // 创建模态框内容
    helpModal.innerHTML = `
        <div class="help-modal-overlay"></div>
        <div class="help-modal ${theme === 'light' ? 'light-theme' : ''}">
            <div class="help-modal-header">
                <h2>${title}</h2>
            </div>
            <div class="help-modal-content">
                <p>${formattedContent}</p>
            </div>
            <div class="help-modal-footer">
                <button id="help-modal-button" class="help-button">${buttonText}</button>
            </div>
        </div>
    `;
    
    // 添加到DOM
    document.body.appendChild(helpModal);
    
    // 绑定按钮点击事件
    const closeButton = document.getElementById('help-modal-button');
    closeButton.addEventListener('click', () => {
        // 添加淡出动画
        helpModal.style.animation = 'fadeOut 0.3s ease';
        
        // 等待动画完成后移除
        setTimeout(() => {
            document.body.removeChild(helpModal);
        }, 300);
    });
    
    // 点击背景关闭
    const overlay = helpModal.querySelector('.help-modal-overlay');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeButton.click();
        }
    });
    
    return helpModal;
}

/**
 * 游戏帮助模块 - 提供显示帮助信息的API
 */
const GameHelp = {
    /**
     * 显示游戏帮助
     * @param {string} theme - 主题风格，'dark'或'light'，默认为'dark'
     */
    showGameHelp: function(theme = 'dark') {
        const helpTitle = lang.UTF8SC.html.help_label || '游戏帮助';
        const helpContent = lang.UTF8SC.html.help_content || '帮助内容不可用';
        const okButtonText = lang.UTF8SC.html.help_ok || '确定';
        
        return showInfoModal(helpTitle, helpContent, okButtonText, theme);
    },
    
    /**
     * 初始化帮助图标点击事件
     */
    initHelpIcons: function() {
        document.querySelectorAll('#help').forEach(icon => {
            if (!icon.dataset.initialized) {
                icon.addEventListener('click', () => this.showGameHelp());
                icon.dataset.initialized = 'true';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    GameHelp.initHelpIcons();
}); 