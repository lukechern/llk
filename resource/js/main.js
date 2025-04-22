// Import game configuration
// Get config from data.js
// Use window.gameConfig instead of redeclaring config variable
const gameConfig = window.gameConfig || {};

// 使用lang变量中的文本
const scriptLang = window.lang;

// Audio elements and state management
const audioElements = {
    bgMusic: new Audio(),
    clickSound: new Audio(),
    winSound: new Audio(),
    errorSound: new Audio(),
    matchSound: new Audio(),
    hintSound: new Audio(),
    refreshSound: new Audio()
};

// Audio loading state
const audioLoadState = {
    bgMusic: false,
    isPlaying: false,
    currentTrack: null
};

// Global audio state
// Separate states for music and sound effects
let audioState = {
    musicMuted: gameConfig.musicEnabled === false, // Initial state from config - explicit comparison to ensure boolean
    soundMuted: gameConfig.soundEnabled === false // Initial state from config - explicit comparison to ensure boolean
};

// Game state
let gameState = {
    board: [],
    selectedTile: null, // Stores { row, col, element }
    score: 0,
    time: 0,
    totalTime: 0, // Total time since first level
    timer: null,
    matchedPairs: 0,
    totalPairs: 0,
    connectionPath: null, // Store connection path info
    fillMode: 'none', // Fill mode: none/left/right/down/up/split-horizontal/split-vertical/center-horizontal/center-vertical/top-left-bottom-right/top-right-bottom-left/left-up-right-down/left-down-right-up/outward/center
    lastMatchTime: 0, // Record last match time
    comboCount: 0, // Current combo count
    totalComboCount: 0 // Total combo count
};

// DOM elements
const elements = {
    board: document.getElementById('board'),
    score: document.getElementById('score'),
    time: document.getElementById('time'),
    hint: document.getElementById('hint'),
    refresh: document.getElementById('refresh'),
    restart: document.getElementById('restart'),
    connectionLine: null, // Will be created when needed
    fillMode: document.getElementById('fillMode')
};

// Add change event listener for fillMode
if (elements.fillMode) {
    elements.fillMode.addEventListener('change', initGame);
} else {
    debugLog(scriptLang.fillmode_not_found, 'warn');
}


// Start button event listener
const startButton = document.getElementById('startButton');
const welcomeScreen = document.getElementById('welcomeScreen');
const gameContainer = document.querySelector('.game-container');

if (startButton && welcomeScreen && gameContainer) {
    startButton.addEventListener('click', function() {
        welcomeScreen.classList.add('hidden');
        gameContainer.style.display = 'block';
        initGame(); // Initialize game *after* showing the container
    });
} else {
    debugLog(scriptLang.required_elements_not_found, 'error');
    // Fallback or alternative initialization if needed
    // initGame(); // Maybe start immediately if welcome screen missing?
}

// Music toggle button event listener
const musicToggleButton = document.getElementById('musicToggle');
if (musicToggleButton) {
    // 设置初始状态图标
    musicToggleButton.textContent = audioState.musicMuted ? '🔇' : '🔊';

    // Initial mute state for background music
    audioElements.bgMusic.muted = audioState.musicMuted;

    musicToggleButton.addEventListener('click', function() {
        audioState.musicMuted = !audioState.musicMuted;
        audioElements.bgMusic.muted = audioState.musicMuted;

        // 更新按钮图标
        musicToggleButton.textContent = audioState.musicMuted ? '🔇' : '🔊';

        // 更新配置对象中的值（可选，如果需要持久化）
        gameConfig.musicEnabled = !audioState.musicMuted;
    });
} else {
    debugLog("Music toggle button not found.", 'warn');
}

// Sound effects toggle button event listener
const soundToggleButton = document.getElementById('soundToggle');
if (soundToggleButton) {
    // 设置初始状态图标 - 使用函数确保一致性
    updateSoundButtonsState();

    // Initial mute state for sound effects
    for (const key in audioElements) {
        if (key !== 'bgMusic' && audioElements[key] instanceof Audio) {
            audioElements[key].muted = audioState.soundMuted;
        }
    }

    soundToggleButton.addEventListener('click', function() {
        audioState.soundMuted = !audioState.soundMuted;

        // 更新按钮UI
        updateSoundButtonsState();

        // 更新配置对象中的值（可选，如果需要持久化）
        gameConfig.soundEnabled = !audioState.soundMuted;

        // Update all sound effect elements (excluding background music)
        for (const key in audioElements) {
            if (key !== 'bgMusic' && audioElements[key] instanceof Audio) {
                audioElements[key].muted = audioState.soundMuted;
            }
        }
    });
} else {
    debugLog("Sound toggle button not found.", 'warn');
}




if (elements.refresh) {
    elements.refresh.addEventListener('click', () => {
        // Prevent refresh if game not running or board is empty
        if (!gameState.timer || gameState.matchedPairs === gameState.totalPairs || gameState.totalPairs === 0) return;

        debugLog("Refreshing board...");
        // 播放刷新音效
        playSound('refreshSound');
        // 刷新时清除提示和选中状态
        clearHint();
        if (gameState.selectedTile && gameState.selectedTile.element) {
            gameState.selectedTile.element.classList.remove('selected');
        }

        // 添加刷新动画效果
        if (elements.board) {
            elements.board.classList.add('refreshing');
            setTimeout(() => {
                elements.board.classList.remove('refreshing');
            }, 2000);
        }

        gameState.selectedTile = null;
        removeConnectionPath(); // Clear any lingering path line

        let unmatchedTilesData = [];
        // 1. Collect data (position and emoji) of all currently unmatched tiles
        for (let r = 0; r < gameConfig.rows; r++) {
            for (let c = 0; c < gameConfig.cols; c++) {
                if (gameState.board[r] ?.[c] && !gameState.board[r][c].matched && gameState.board[r][c].emoji) {
                    // Store original position along with emoji
                    unmatchedTilesData.push({ row: r, col: c, emoji: gameState.board[r][c].emoji });
                }
            }
        }

        // 2. Extract just the emojis
        const emojisToShuffle = unmatchedTilesData.map(tile => tile.emoji);

        // 3. Shuffle these emojis
        const shuffledEmojis = shuffleArray(emojisToShuffle);

        // 4. Redistribute shuffled emojis back to the *original positions* of the unmatched tiles
        unmatchedTilesData.forEach((tileInfo, index) => {
            const newEmoji = shuffledEmojis[index];
            // Update the emoji in the game state at its original position
            if (gameState.board[tileInfo.row] ?.[tileInfo.col]) {
                gameState.board[tileInfo.row][tileInfo.col].emoji = newEmoji;
                // Keep matched=false, element might need update after render
            } else {
                debugLog(`State missing for tile at [${tileInfo.row}, ${tileInfo.col}] during refresh distribution.`, 'warn');
            }
        });

        // 5. Re-render the board with the new emoji assignments
        renderBoardAfterFill();

        // 6. Check if the refreshed board is solvable
        if (!hasMatchablePairs()) {
            debugLog("Board is still stuck after refresh! Consider a different refresh strategy or game design.", 'warn');
            // 替换alert为自定义的漂亮提示信息
            showToast(scriptLang.UTF8SC.js.script.no_pairs_text, "info", 5000);
        }

        // Re-enable clicks (should be enabled unless game ended, renderBoardAfterFill might reset)
        if (elements.board) elements.board.style.pointerEvents = 'auto';
    });
} else {
    debugLog("Refresh button element not found.", 'warn');
}


if (elements.restart) {
    elements.restart.addEventListener('click', initGame);
} else {
    debugLog("Restart button element not found.", 'warn');
}

// --- Initial Game Setup ---
// Don't call initGame here if using the welcome screen.
// initGame(); // Called by startButton listener or directly if no welcome screen needed.

// --- END OF FILE script.js ---
// --- END OF FILE script.js ---

// Add event listeners for game controls
document.addEventListener('DOMContentLoaded', function() {
    
    // Update button references
    const restartButton = document.getElementById('restart');

    // Add event listeners if elements exist
    if (restartButton) {
        restartButton.addEventListener('click', function() {
            initGame();
            // Ensure audio state is preserved
            // Update based on new separated states
            audioElements.bgMusic.muted = audioState.musicMuted;
            for (const key in audioElements) {
                if (key !== 'bgMusic' && audioElements[key] instanceof Audio) {
                    audioElements[key].muted = audioState.soundMuted;
                }
            }
        });
    }

    // ... other event listeners
});

// 确保声音按钮与实际状态一致的函数
function updateSoundButtonsState() {
    // 更新背景音乐按钮状态
    const musicBtn = document.getElementById('musicToggle');
    if (musicBtn) {
        musicBtn.textContent = audioState.musicMuted ? '🔇' : '🔊';
    }

    // 更新音效按钮状态
    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) {
        soundBtn.textContent = audioState.soundMuted ? '🔕' : '🔔';
        if (audioState.soundMuted) {
            soundBtn.classList.add('muted');
        } else {
            soundBtn.classList.remove('muted');
        }
    }
}

// // 初始化帮助按钮
// function initHelpButton() {
//     // 查找.help-icon元素
//     const helpIcons = document.querySelectorAll('.help-icon');
    
//     // 为每个帮助图标添加点击事件
//     helpIcons.forEach(helpIcon => {
//         // 设置工具提示文本
//         const tooltipText = lang.UTF8SC.html.help_label || '帮助';
//         helpIcon.setAttribute('data-tooltip', tooltipText);
        
//         // 添加点击事件
//         if (!helpIcon.dataset.initialized) {
//             helpIcon.addEventListener('click', function() {
//                 // 显示帮助弹窗
//                 GameHelp.showGameHelp();
//             });
//             helpIcon.dataset.initialized = 'true';
//         }
//     });
// }