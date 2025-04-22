// 通用的语言替换函数
function lang_7ree(element, lang) {
    if (!element) return;
    
    if (element.nodeType === Node.ELEMENT_NODE && element.hasAttribute('data-tooltip')) {
        element.setAttribute('data-tooltip', lang || element.getAttribute('data-tooltip'));
    } else {
        element.textContent = lang || element.textContent;
    }
}

// 在DOM加载完成后执行语言包替换
document.addEventListener('DOMContentLoaded', function() {
    // 获取语言包
    const htmlLang = window.lang?.UTF8SC?.html || {};

    // 替换标题
    document.title = htmlLang.title || document.title;

    // 替换欢迎标题
    lang_7ree(document.querySelector('.welcome-title'), htmlLang.welcome_title);

    // 替换开始按钮
    lang_7ree(document.querySelector('.start-button'), htmlLang.start_button);

    // 替换游戏标题
    lang_7ree(document.querySelector('.header h1'), htmlLang.game_title);

    // 替换分数、连击和时长标签
    const scoreLabel = document.querySelector('.score');
    if (scoreLabel) {
        lang_7ree(scoreLabel.childNodes[0], htmlLang.score_label);
    }

    const comboLabel = document.querySelector('.timer');
    if (comboLabel) {
        lang_7ree(comboLabel.childNodes[0], htmlLang.combo_label);
    }

    const timeLabel = document.querySelectorAll('.timer')[1];
    if (timeLabel) {
        lang_7ree(timeLabel.childNodes[0], htmlLang.time_label);
    }

    // 替换填充模式选项
    const fillModeSelect = document.getElementById('fillMode');
    if (fillModeSelect && htmlLang.fill_mode_options) {
        Array.from(fillModeSelect.options).forEach(option => {
            const key = option.value.replace(/-/g, '_');
            if (htmlLang.fill_mode_options[key]) {
                lang_7ree(option, htmlLang.fill_mode_options[key]);
            }
        });
    }

    // 替换按钮提示文本
    lang_7ree(document.getElementById('hint'), htmlLang.hint_tooltip);
    lang_7ree(document.getElementById('refresh'), htmlLang.refresh_tooltip);
    lang_7ree(document.getElementById('restart'), htmlLang.restart_tooltip);
    lang_7ree(document.getElementById('musicToggle'), htmlLang.music_tooltip);
    lang_7ree(document.getElementById('soundToggle'), htmlLang.sound_tooltip);


    // 替换结果模态窗口文本
    lang_7ree(document.querySelector('.result-title'), htmlLang.result_title);
    lang_7ree(document.querySelector('.result-content'), htmlLang.result_content);

    // 替换帮助按钮
    lang_7ree(document.getElementById('help'), htmlLang.help_label);


    // 替换统计标签
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels.length >= 4) {
        lang_7ree(statLabels[0], htmlLang.stat_score);
        lang_7ree(statLabels[1], htmlLang.stat_combo);
        lang_7ree(statLabels[2], htmlLang.stat_time);
        lang_7ree(statLabels[3], htmlLang.stat_total_time);
    }

    // 替换关闭按钮
    lang_7ree(document.getElementById('closeModal'), htmlLang.close_button);
});