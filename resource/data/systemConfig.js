
/////////////////////////////////////////////////////////
//////////////////默认游戏配置数据/////////////////////////
///////////////////////////////////////////////////////


const config = {
    // 设备相关的配置
    pc: {
        // PC端游戏棋盘的行数
        rows: 10,
        // PC端游戏棋盘的列数
        cols: 16
    },
    mobile: {
        // 移动端游戏棋盘的行数
        rows: 12,
        // 移动端游戏棋盘的列数
        cols: 5
    },
    // 当前生效的行列数（会在后面根据设备类型设置）
    rows: 0,
    cols: 0,
    // 是否使用SVG图标
    useSvgEmoji: true,
    SvgStyle: 'twEmoji', //可选 'twEmoji', 'openEmoji' 需要提前准备好emojy的svg文件放置到相应路径
    // 当前使用的表情
    emojis: [],

    tileFrontColor: 'gray', //可选的牌色系有 gray,green,blue,purple,red,brown

    // 默认背景音乐状态，是否开启
    musicEnabled: false,
    // 默认动作音效状态，是否开启
    soundEnabled: true,
    // 音频文件路径    
    soundfilePath: 'resource/sound/',
    // 音频文件配置，只需填写主文件名，不需要后缀
    audioFile: {
        bgMusic: ['bgm_1', 'bgm_2', 'bgm_3', 'bgm_4', 'bgm_5', 'bgm_6', 'bgm_7'],
        clickSound: 'click',
        errorSound: 'error',
        hintSound: 'hint',
        matchSound: 'match',
        refreshSound: 'refresh',
        winSound: 'win'
    },
    debugConsoleLog: false,
};




/////////////////////////////////////////////////////////
//////////////////后续处理参数逻辑相关//////////////////////
////////////////////////////////////////////////////////



// 根据设备类型应用相应配置
applyDeviceConfig();



const originalEmojis = ['🐟', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🦔', '🐔', '🐧', '🐚', '🐤', '🐺', '🐗', '🦀', '🦄', '🐝', '🐓', '🦋', '🐌', '🐞', '🐜', '🦢', '🦗', '🦇', '🦩', '🦚', '🦥', '🐳'];
const svgEmojis = generateEmojiSvgPATH(originalEmojis, config.SvgStyle);


// 设置表情数组
config.emojis = config.useSvgEmoji ? svgEmojis : originalEmojis;



const audioPaths = Object.entries(config.audioFile).reduce((acc, [key, value]) => {
    return {
        ...acc,
        [key]: Array.isArray(value) ?
            value.map(file => `${config.soundfilePath}${file}.mp3`) : `${config.soundfilePath}${value}.mp3`
    };
}, {});


// 调用函数获取用户配置
getUserConfig_7ree();


function isMobile(){
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}


function generateEmojiSvgPATH(emojis, style) {
    return emojis.map(emoji => {
        const codePoints = Array.from(emoji)
            .map(char => char.codePointAt(0).toString(16))
            .join('-');
        return `<img src="resource/data/${style}/${codePoints}.svg">`;
    });
}


function getUserConfig_7ree() {
    try {
        // 检查userConfig全局变量是否存在
        if (window.userConfig) {
            debugLog("Loading user configuration from userConfig.js", 'log');
            
            // 处理PC或移动端特定的行列配置
            if (window.userConfig.pc) {
                // 合并PC配置
                if (window.userConfig.pc.rows !== undefined) {
                    config.pc.rows = window.userConfig.pc.rows;
                }
                if (window.userConfig.pc.cols !== undefined) {
                    config.pc.cols = window.userConfig.pc.cols;
                }
            }
            
            if (window.userConfig.mobile) {
                // 合并移动端配置
                if (window.userConfig.mobile.rows !== undefined) {
                    config.mobile.rows = window.userConfig.mobile.rows;
                }
                if (window.userConfig.mobile.cols !== undefined) {
                    config.mobile.cols = window.userConfig.mobile.cols;
                }
            }
            
            // 重新根据设备类型设置行列数
            applyDeviceConfig();
            
            // 处理其他通用配置 - 直接拷贝值
            const configKeys = Object.keys(window.userConfig).filter(key => key !== 'pc' && key !== 'mobile');
            
            // 循环遍历所有用户配置的键
            for (const key of configKeys) {
                // 检查该键是否存在于系统配置中
                if (key in config && window.userConfig[key] !== undefined) {
                    // 更新配置值
                    config[key] = window.userConfig[key];
                } else if (key === 'bgMusic' && config.audioFile && 'bgMusic' in config.audioFile && 
                         window.userConfig[key] !== undefined) {
                    // 特殊处理音乐配置
                    config.audioFile.bgMusic = window.userConfig[key];
                }
            }
            
            // 如果SVG相关配置被修改，需要重新生成SVG表情
            if ('useSvgEmoji' in window.userConfig || 'SvgStyle' in window.userConfig) {
                const svgEmojis = generateEmojiSvgPATH(originalEmojis, config.SvgStyle);
                config.emojis = config.useSvgEmoji ? svgEmojis : originalEmojis;
            }
        } else {
            debugLog("The configuration in userConfig·js was not found, use the default.", 'warn');
        }
        
        // 加载完成后触发游戏初始化
        if (typeof initializeGame === 'function') {
            initializeGame();
        }
    } catch (error) {
        debugLog(`Error processing user configuration: ${error.message}`, 'error');
        
        // 出错时仍然初始化游戏
        if (typeof initializeGame === 'function') {
            initializeGame();
        }
    }
}




function applyDeviceConfig() {
    if (isMobile()) {
        config.rows = config.mobile.rows;
        config.cols = config.mobile.cols;
    } else {
        config.rows = config.pc.rows;
        config.cols = config.pc.cols;
    }
}


// 调试日志函数，根据debugConsoleLog开关控制日志输出
function debugLog(message, level = 'log', ...args) {
    if (config.debugConsoleLog) {
        switch(level) {
            case 'error':
                console.error(message, ...args);
                break;
            case 'warn':
                console.warn(message, ...args);
                break;
            default:
                console.log(message, ...args);
        }
    }
}





// //测试数据，只截取emojis的前2个
// config.emojis = config.emojis.slice(0, 10);
// //测试数据，只绘制2*2的格子
// config.rows = 2;
// config.cols = 2;





// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { config, audioPaths };
} else {
    // 浏览器环境下，将config和audioPaths暴露到全局
    window.gameConfig = config;
    window.audioPaths = audioPaths;
}

