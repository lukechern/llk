// 初始化游戏
function initGame() {
    // 确保声音状态设置正确
    audioElements.bgMusic.muted = audioState.musicMuted;

    // 遍历所有音效元素，应用静音状态
    for (const key in audioElements) {
        if (key !== 'bgMusic' && audioElements[key] instanceof Audio) {
            audioElements[key].muted = audioState.soundMuted;
        }
    }

    // 初始化并播放背景音乐
    initBackgroundMusic();

    // 更新音频按钮状态
    if (typeof updateSoundButtonsState === 'function') {
        updateSoundButtonsState();
    }

    clearInterval(gameState.timer);
    // 保存需要累计的数据
    const previousTotalTime = gameState.totalTime || 0;
    const previousTotalComboCount = gameState.totalComboCount || 0;
    const previousTotalScore = gameState.score || 0;

    gameState = {
        board: [],
        selectedTile: null,
        score: previousTotalScore, // Keep total score
        time: 0,
        totalTime: previousTotalTime, // Keep total time
        timer: null,
        matchedPairs: 0,
        totalPairs: 0,
        fillMode: elements.fillMode ? elements.fillMode.value : 'none', // Default if element missing
        connectionPath: null,
        lastMatchTime: 0,
        comboCount: 0,
        totalComboCount: previousTotalComboCount // Keep total combo count
    };

    // Reset result modal state
    var resultModal = document.getElementById('resultModal');
    if (resultModal) {
        resultModal.style.display = 'none';
        resultModal.classList.remove('show', 'active');
    }
    var overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }

    if (elements.score) elements.score.textContent = gameState.score;
    if (elements.time) elements.time.textContent = '0:00:00'; // Initialize time format
    if (elements.board) elements.board.innerHTML = ''; // Clear previous board
    const lianjiElement = document.getElementById('lianji');
    if (lianjiElement) lianjiElement.textContent = gameState.totalComboCount; // Keep combo count

    // Clear hint highlight
    clearHint();
    // Deselect any visually selected tile from previous state
    if (gameState.selectedTile && gameState.selectedTile.element) {
        gameState.selectedTile.element.classList.remove('selected');
    }
    gameState.selectedTile = null;

    // Ensure board clicks are enabled at start
    if (elements.board) elements.board.style.pointerEvents = 'auto';
    // Ensure hint button is enabled
    if (elements.hint) elements.hint.disabled = false;

    generateBoard(); // This will now set gameState.totalPairs

    // Start timer only if board generation was successful and pairs exist
    if (gameState.totalPairs > 0) {
        startTimer();
    } else {
        debugLog("No pairs generated for the board or board dimensions are invalid.", 'warn');
        // Optionally display a message to the user
        if (elements.board) elements.board.innerHTML = `<p style="text-align:center; padding: 20px;">${scriptLang.board_error}</p>`;
    }
}

// 格式化时间显示
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 开始计时器
function startTimer() {
    // Clear existing timer if any, reset time
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    gameState.time = 0;
    if (elements.time) elements.time.textContent = '0:00:00'; // Reset display immediately

    // Start new interval timer
    gameState.timer = setInterval(() => {
        gameState.time++;
        gameState.totalTime++;
        const hours = Math.floor(gameState.time / 3600);
        const minutes = Math.floor((gameState.time % 3600) / 60);
        const seconds = gameState.time % 60;
        // Update time display, padding minutes and seconds with leading zeros
        if (elements.time) {
            elements.time.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            clearInterval(gameState.timer); // Stop timer if display element lost
        }
    }, 1000); // Update every second
}

// 检查棋盘上是否还有可消除的牌对
function hasMatchablePairs() {
    return findMatchablePair() !== null;
}

// 查找一对可消除的牌，返回牌的位置信息或null
function findMatchablePair() {
    // Get all *unmatched* tiles with their positions and emojis
    const unmatchedTiles = [];
    for (let r = 0; r < gameConfig.rows; r++) {
        for (let c = 0; c < gameConfig.cols; c++) {
            // Ensure tile exists and is not matched
            if (gameState.board[r] ?.[c] && !gameState.board[r][c].matched && gameState.board[r][c].emoji) {
                unmatchedTiles.push({ row: r, col: c, emoji: gameState.board[r][c].emoji });
            }
        }
    }

    // Check every pair combination
    for (let i = 0; i < unmatchedTiles.length; i++) {
        for (let j = i + 1; j < unmatchedTiles.length; j++) {
            const tile1 = unmatchedTiles[i];
            const tile2 = unmatchedTiles[j];

            // Check 1: Emojis must match
            if (tile1.emoji === tile2.emoji) {
                // Check 2: Must be connectable
                if (findConnectionPath(tile1.row, tile1.col, tile2.row, tile2.col)) {
                    // Return the first matchable pair found
                    return {
                        tile1: { row: tile1.row, col: tile1.col },
                        tile2: { row: tile2.row, col: tile2.col }
                    };
                }
            }
        }
    }

    return null; // No matchable pair found
}



// 导出给其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        initGame, 
        formatTime, 
        startTimer, 
        hasMatchablePairs, 
        findMatchablePair,
        debugLog 
    };
} else {
    // 浏览器环境下，将函数暴露到全局
    window.debugLog = debugLog;
}