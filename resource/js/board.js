function generateBoard() {
    const rows = gameConfig.rows;
    const cols = gameConfig.cols;

    if (!rows || !cols || rows <= 0 || cols <= 0) {
        debugLog("Invalid board dimensions in config:", 'error', rows, cols);
        gameState.totalPairs = 0;
        return;
    }

    const totalTiles = rows * cols;
    // Ensure even number of tiles for pairs
    if (totalTiles % 2 !== 0) {
        debugLog(`Board must have an even number of tiles (${totalTiles}). Adjust rows/cols.`, 'error');
        gameState.totalPairs = 0;
        return; // Stop generation if odd tiles
    }
    const pairsCount = totalTiles / 2;

    const availableEmojis = gameConfig.emojis;
    if (!availableEmojis || availableEmojis.length === 0) {
         debugLog("No emojis available in config!", 'error');
         gameState.totalPairs = 0;
         return; // Cannot generate without emojis
    }
    const numAvailable = availableEmojis.length;

    if (pairsCount === 0) {
        gameState.totalPairs = 0;
        debugLog("Calculated pairs count is zero.", 'warn');
        return; // Cannot generate board with 0 pairs
    }


    // --- MODIFIED LOGIC: Create pairs, reusing emojis if needed ---
    let pairs = [];
    for (let i = 0; i < pairsCount; i++) {
        // Cycle through available emojis using the modulo operator
        const emojiIndex = i % numAvailable;
        const emoji = availableEmojis[emojiIndex];
        pairs.push(emoji, emoji); // Add the pair (two identical emojis)
    }
    // Now 'pairs' array contains pairsCount * 2 = totalTiles emojis
    // --- END OF MODIFIED LOGIC ---


    // Wash cards (Shuffle)
    pairs = shuffleArray(pairs);

    // Create the game board data structure
    gameState.board = [];
    gameState.totalPairs = pairsCount; // Set total pairs for win condition

    if (!elements.board) {
        debugLog("Board element not found!", 'error');
        return;
    }
    elements.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; // Set grid columns dynamically
    elements.board.innerHTML = ''; // Clear board DOM before generating

    for (let row = 0; row < rows; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < cols; col++) {
            const index = row * cols + col;
            // index should always be < pairs.length due to prior checks
            if (index < pairs.length) {
                const emoji = pairs[index];
                gameState.board[row][col] = {
                    emoji: emoji,
                    matched: false,
                    element: null // Will be assigned in createTile
                };
                createTile(row, col, emoji);
            } else {
                 // This case should theoretically not be reached if totalTiles is even
                 debugLog(`Error generating board: index ${index} out of bounds for pairs array length ${pairs.length}`, 'error');
                 gameState.board[row][col] = { emoji: null, matched: true, element: null };
                 createEmptyTile(row, col); // Create an empty tile visually
            }
        }
    }

    // Check if the initial board has any matches
    if (!hasMatchablePairs()) {
        debugLog("Initial board has no matches. Refreshing...");
        if (elements.refresh) {
             elements.refresh.click(); // Simulate click to reshuffle
        } else {
            debugLog("Refresh button not found for automatic reshuffle.", 'warn');
            // Handle case where auto-refresh isn't possible
        }
    }
}

// Create single tile
function createTile(row, col, emoji) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.row = row;
    tile.dataset.col = col;

    // Create the visible face of the tile
    const front = document.createElement('div');
    front.className = `tile-face tile-front tile-front-${gameConfig.tileFrontColor}-dark`;
    
    // 检查是否是SVG图标（包含<img>标签）
    if (emoji.includes('<img')) {
        front.innerHTML = emoji;
    } else {
        front.textContent = emoji;
    }

    tile.appendChild(front);

    // Add click listener
    tile.addEventListener('click', () => handleTileClick(row, col));

    // Add to the board element and store reference in game state
    if (elements.board) {
        elements.board.appendChild(tile);
    } else {
         debugLog("Board element not found when trying to append tile.", 'error');
         return; // Don't assign element if board doesn't exist
    }

    // Ensure gameState.board[row] exists before assigning
    if (gameState.board[row] && gameState.board[row][col]) {
        gameState.board[row][col].element = tile; // Assign the DOM element back to the state
    } else {
        debugLog(`Game state missing for tile at [${row}, ${col}] during creation.`, 'error');
    }
}

// Create an empty placeholder tile (useful if odd board size was allowed)
function createEmptyTile(row, col) {
    const tile = document.createElement('div');
    tile.className = 'tile'; // Remove 'empty' class and don't add 'matched' class
    tile.dataset.row = row; // Still useful for positioning
    tile.dataset.col = col;
    if (elements.board) {
        elements.board.appendChild(tile);
    }
    // No event listener needed for empty tiles
}