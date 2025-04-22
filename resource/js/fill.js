// 填补空位逻辑 (Revised outward and center for shifting only)
function fillEmptyTiles() {
    // 清理上一次的资源
    cleanupPreviousFill();

    // 创建新的资源跟踪器
    gameState.currentFillResources = {
        elements: new Set(),
        eventListeners: new Map(),
        animations: new Set()
    };

    const { fillMode } = gameState;
    const rows = gameConfig.rows;
    const cols = gameConfig.cols;
    let boardChanged = false; // Flag to track if any tile state actually changed
    
    // 清理不再需要的临时变量和引用
    if (gameState.lastFillMode) delete gameState.lastFillMode;
    if (gameState.tempTiles) {
        // 清理临时瓦片数组中的所有引用
        if (Array.isArray(gameState.tempTiles)) {
            gameState.tempTiles.forEach(tile => {
                if (tile && tile.element) {
                    // 移除所有事件监听器
                    const listeners = gameState.currentFillResources.eventListeners.get(tile.element);
                    if (listeners) {
                        listeners.forEach(({type, handler}) => {
                            tile.element.removeEventListener(type, handler);
                        });
                    }
                    // 停止所有动画
                    tile.element.getAnimations().forEach(animation => {
                        animation.cancel();
                    });
                    // 清空元素引用
                    tile.element = null;
                }
                // 清空其他属性
                tile.emoji = null;
                tile.matched = false;
            });
        }
        gameState.tempTiles = null;
    }

    // 资源清理函数
    function cleanupPreviousFill() {
        if (gameState.currentFillResources) {
            // 清理DOM元素
            gameState.currentFillResources.elements.forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });

            // 清理事件监听器
            gameState.currentFillResources.eventListeners.forEach((listeners, element) => {
                listeners.forEach(({type, handler}) => {
                    element.removeEventListener(type, handler);
                });
            });

            // 取消动画
            gameState.currentFillResources.animations.forEach(animation => {
                animation.cancel();
            });

            // 清空资源跟踪器
            gameState.currentFillResources = null;

            // 手动触发垃圾回收
            if (window.gc) window.gc();
        }
    }

    // Helper function to create an empty tile state - 使用对象池模式
    const emptyStatePool = [];
    const createEmptyState = () => {
        if (emptyStatePool.length > 0) {
            const state = emptyStatePool.pop();
            state.emoji = null;
            state.matched = false;
            state.element = null;
            return state;
        }
        return { emoji: null, matched: false, element: null };
    };
    
    // 回收空状态对象到对象池
    const recycleEmptyState = (state) => {
        if (state && !state.emoji && !state.element) {
            emptyStatePool.push(state);
        }
    };

    // Helper function to check if a tile is empty/matched
    const isEmpty = (r, c) => {
        const tile = gameState.board[r]?.[c];
        return !tile || !tile.emoji || tile.matched;
    }

    // --- Helper: Shift tiles vertically within a column segment ---
    // dir: 1 for down, -1 for up
    const shiftVertical = (c, rStart, rEnd, dir) => {
        const colSegment = [];
        const actualEnd = (dir === 1) ? rEnd : rStart -1; // Adjust end for loop direction
        const actualStart = (dir === 1) ? rStart : rEnd -1;

        // Collect non-empty tiles in the segment
        if (dir === 1) { // Downward shift
            for (let r = actualStart; r < actualEnd; r++) {
                if (!isEmpty(r, c)) colSegment.push({...gameState.board[r][c]});
            }
        } else { // Upward shift
             for (let r = actualStart; r >= actualEnd; r--) { // Iterate downwards to collect
                 if (!isEmpty(r, c)) colSegment.push({...gameState.board[r][c]});
             }
             colSegment.reverse(); // Maintain original top-to-bottom order
        }


        // Place tiles back, aligned according to direction
        if (dir === 1) { // Align bottom
            const offset = rEnd - rStart - colSegment.length;
            for (let r = rStart; r < rEnd; r++) {
                 const targetIndex = r - rStart - offset;
                 const newState = (targetIndex >= 0 && targetIndex < colSegment.length) ? colSegment[targetIndex] : createEmptyState();
                 if (gameState.board[r][c].emoji !== newState.emoji || gameState.board[r][c].matched !== newState.matched) boardChanged = true;
                 gameState.board[r][c] = newState;
            }
        } else { // Align top
             for (let r = rStart; r < rEnd; r++) {
                 const targetIndex = r - rStart;
                 const newState = (targetIndex >= 0 && targetIndex < colSegment.length) ? colSegment[targetIndex] : createEmptyState();
                 if (gameState.board[r][c].emoji !== newState.emoji || gameState.board[r][c].matched !== newState.matched) boardChanged = true;
                 gameState.board[r][c] = newState;
             }
        }
    };

    // --- Helper: Shift tiles horizontally within a row segment ---
    // dir: 1 for right, -1 for left
     const shiftHorizontal = (r, cStart, cEnd, dir) => {
        const rowSegment = [];
        const actualEnd = (dir === 1) ? cEnd : cStart - 1; // Adjust end for loop direction
        const actualStart = (dir === 1) ? cStart : cEnd - 1;

         // Collect non-empty tiles in the segment
         if (dir === 1) { // Rightward shift
            for (let c = actualStart; c < actualEnd; c++) {
                if (!isEmpty(r, c)) rowSegment.push({...gameState.board[r][c]});
            }
        } else { // Leftward shift
             for (let c = actualStart; c >= actualEnd; c--) { // Iterate right-to-left
                 if (!isEmpty(r, c)) rowSegment.push({...gameState.board[r][c]});
             }
             rowSegment.reverse(); // Maintain original left-to-right order
        }

        // Place tiles back, aligned according to direction
        if (dir === 1) { // Align right
            const offset = cEnd - cStart - rowSegment.length;
            for (let c = cStart; c < cEnd; c++) {
                 const targetIndex = c - cStart - offset;
                 const newState = (targetIndex >= 0 && targetIndex < rowSegment.length) ? rowSegment[targetIndex] : createEmptyState();
                 if (gameState.board[r][c].emoji !== newState.emoji || gameState.board[r][c].matched !== newState.matched) boardChanged = true;
                 gameState.board[r][c] = newState;
            }
        } else { // Align left
             for (let c = cStart; c < cEnd; c++) {
                 const targetIndex = c - cStart;
                 const newState = (targetIndex >= 0 && targetIndex < rowSegment.length) ? rowSegment[targetIndex] : createEmptyState();
                 if (gameState.board[r][c].emoji !== newState.emoji || gameState.board[r][c].matched !== newState.matched) boardChanged = true;
                 gameState.board[r][c] = newState;
             }
        }
    };


    // 根据填补模式处理空位
    switch (fillMode) {
        case 'left':
            for (let r = 0; r < rows; r++) { shiftHorizontal(r, 0, cols, -1); }
            break;
        case 'right':
            for (let r = 0; r < rows; r++) { shiftHorizontal(r, 0, cols, 1); }
            break;
        case 'down':
            for (let c = 0; c < cols; c++) { shiftVertical(c, 0, rows, 1); }
            break;
        case 'up':
            for (let c = 0; c < cols; c++) { shiftVertical(c, 0, rows, -1); }
            break;

        // --- SPLIT MODES (Using helpers) ---
        case 'split-horizontal': {
            const midCol = Math.floor(cols / 2);
            for (let r = 0; r < rows; r++) {
                shiftHorizontal(r, 0, midCol, -1); // Left half shifts left
                shiftHorizontal(r, midCol, cols, 1); // Right half shifts right
            }
            break;
        }
        case 'split-vertical': {
            const midRow = Math.floor(rows / 2);
            for (let c = 0; c < cols; c++) {
                shiftVertical(c, 0, midRow, -1); // Top half shifts up
                shiftVertical(c, midRow, rows, 1); // Bottom half shifts down
            }
            break;
        }
        // --- CENTER-ALIGN MODES (Using helpers) ---
        case 'center-horizontal': {
            const midCol = Math.floor(cols / 2);
            // 遍历每一行
            for (let r = 0; r < rows; r++) {
                // 初始化新的行状态
                const newRow = Array(cols).fill(null).map(() => createEmptyState());
                const leftSegment = [];
                const rightSegment = [];
                
                // 收集非空方块并分类
                for (let c = 0; c < cols; c++) {
                    if (!isEmpty(r, c)) {
                        if (c < midCol) {
                            leftSegment.push({...gameState.board[r][c]});
                        } else {
                            rightSegment.push({...gameState.board[r][c]});
                        }
                    }
                }
                
                // 放置左半边方块（靠近中间）
                for (let i = 0; i < leftSegment.length; i++) {
                    const targetCol = midCol - 1 - i;
                    if (targetCol >= 0) {
                        newRow[targetCol] = leftSegment[leftSegment.length - 1 - i];
                    }
                }
                
                // 放置右半边方块（靠近中间）
                for (let i = 0; i < rightSegment.length; i++) {
                    const targetCol = midCol + i;
                    if (targetCol < cols) {
                        newRow[targetCol] = rightSegment[i];
                    }
                }
                
                // 更新整行状态
                for (let c = 0; c < cols; c++) {
                    if (gameState.board[r][c].emoji !== newRow[c].emoji || 
                        gameState.board[r][c].matched !== newRow[c].matched) {
                        boardChanged = true;
                    }
                    gameState.board[r][c] = newRow[c];
                }
            }
            break;
        }
        case 'center-vertical': {
            const midRow = Math.floor(rows / 2);
            // 遍历每一列，对每个非空方块根据其位置决定移动方向
            for (let c = 0; c < cols; c++) {
                const colSegment = [];
                // 收集当前列所有非空方块
                for (let r = 0; r < rows; r++) {
                    if (!isEmpty(r, c)) {
                        colSegment.push({pos: r, tile: {...gameState.board[r][c]}});
                    }
                }
                // 根据方块位置分别移动
                for (const {pos, tile} of colSegment) {
                    if (pos < midRow) { // 上半边向下移动
                        let targetRow = pos;
                        // 找到最下边的空位
                        for (let r = pos + 1; r < midRow; r++) {
                            if (isEmpty(r, c)) targetRow = r;
                        }
                        if (targetRow !== pos) {
                            gameState.board[targetRow][c] = {...tile};
                            gameState.board[pos][c] = createEmptyState();
                            boardChanged = true;
                        }
                    } else { // 下半边向上移动
                        let targetRow = pos;
                        // 找到最上边的空位
                        for (let r = pos - 1; r >= midRow; r--) {
                            if (isEmpty(r, c)) targetRow = r;
                        }
                        if (targetRow !== pos) {
                            gameState.board[targetRow][c] = {...tile};
                            gameState.board[pos][c] = createEmptyState();
                            boardChanged = true;
                        }
                    }
                }
            }
            break;
        }
        // --- MIXED MODES (Using helpers) ---
        case 'top-left-bottom-right': {
            const midRow = Math.floor(rows / 2);
            for (let r = 0; r < midRow; r++) { shiftHorizontal(r, 0, cols, -1); } // Top half shifts left
            for (let r = midRow; r < rows; r++) { shiftHorizontal(r, 0, cols, 1); } // Bottom half shifts right
            break;
        }
        case 'top-right-bottom-left': {
             const midRow = Math.floor(rows / 2);
            for (let r = 0; r < midRow; r++) { shiftHorizontal(r, 0, cols, 1); } // Top half shifts right
            for (let r = midRow; r < rows; r++) { shiftHorizontal(r, 0, cols, -1); } // Bottom half shifts left
            break;
        }
        case 'left-up-right-down': {
            const midCol = Math.floor(cols / 2);
            for (let c = 0; c < midCol; c++) { shiftVertical(c, 0, rows, -1); } // Left half shifts up
            for (let c = midCol; c < cols; c++) { shiftVertical(c, 0, rows, 1); } // Right half shifts down
            break;
        }
        case 'left-down-right-up': {
             const midCol = Math.floor(cols / 2);
            for (let c = 0; c < midCol; c++) { shiftVertical(c, 0, rows, 1); } // Left half shifts down
            for (let c = midCol; c < cols; c++) { shiftVertical(c, 0, rows, -1); } // Right half shifts up
            break;
        }

        // --- START: REVISED 'OUTWARD' SHIFTING LOGIC ---
        case 'outward': {
            const midRow = Math.floor(rows / 2);
            const midCol = Math.floor(cols / 2);

            // Process Top-Left Quadrant (Up then Left)
            for (let c = 0; c < midCol; c++) { shiftVertical(c, 0, midRow, -1); } // Shift Up
            for (let r = 0; r < midRow; r++) { shiftHorizontal(r, 0, midCol, -1); } // Shift Left

            // Process Top-Right Quadrant (Up then Right)
            for (let c = midCol; c < cols; c++) { shiftVertical(c, 0, midRow, -1); } // Shift Up
            for (let r = 0; r < midRow; r++) { shiftHorizontal(r, midCol, cols, 1); } // Shift Right

            // Process Bottom-Left Quadrant (Down then Left)
            for (let c = 0; c < midCol; c++) { shiftVertical(c, midRow, rows, 1); } // Shift Down
            for (let r = midRow; r < rows; r++) { shiftHorizontal(r, 0, midCol, -1); } // Shift Left

             // Process Bottom-Right Quadrant (Down then Right)
            for (let c = midCol; c < cols; c++) { shiftVertical(c, midRow, rows, 1); } // Shift Down
            for (let r = midRow; r < rows; r++) { shiftHorizontal(r, midCol, cols, 1); } // Shift Right

            break;
        }
        // --- END: REVISED 'OUTWARD' SHIFTING LOGIC ---


        // --- START: REVISED 'CENTER' SHIFTING LOGIC ---
        case 'center': {
            // 模拟"吸向中心"的迭代移动算法
            // 计算中心点（允许小数，便于距离比较）
            const centerR = (rows - 1) / 2;
            const centerC = (cols - 1) / 2;
            // 定义四方向（可扩展为八方向）
            const directions = [
                {dr: -1, dc: 0}, // 上
                {dr: 1, dc: 0},  // 下
                {dr: 0, dc: -1}, // 左
                {dr: 0, dc: 1}   // 右
                // 若需八方向可加对角线
                // {dr: -1, dc: -1}, {dr: -1, dc: 1}, {dr: 1, dc: -1}, {dr: 1, dc: 1}
            ];
            let moved;
            do {
                moved = false;
                // 标记本轮所有可移动的牌及目标
                const moveList = [];
                // 记录本轮已被占用的目标，防止冲突
                const targetUsed = Array.from({length: rows}, () => Array(cols).fill(false));
                // 先遍历所有牌，收集可移动的
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const tile = gameState.board[r][c];
                        if (!tile || !tile.emoji || tile.matched) continue;
                        const currDist = Math.abs(r - centerR) + Math.abs(c - centerC);
                        let best = null;
                        for (const dir of directions) {
                            const nr = r + dir.dr, nc = c + dir.dc;
                            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                            if (isEmpty(nr, nc) && !targetUsed[nr][nc]) {
                                const newDist = Math.abs(nr - centerR) + Math.abs(nc - centerC);
                                if (newDist < currDist) {
                                    if (!best || newDist < best.dist) {
                                        best = {nr, nc, dist: newDist};
                                    }
                                }
                            }
                        }
                        if (best) {
                            moveList.push({from: [r, c], to: [best.nr, best.nc], tile: {...tile}});
                            targetUsed[best.nr][best.nc] = true; // 本轮锁定目标
                            gameState.board[r][c] = createEmptyState(); // 立即清空原位置
                        }
                    }
                }
                // 执行本轮所有移动
                if (moveList.length > 0) {
                    moved = true;
                    boardChanged = true;
                    for (const move of moveList) {
                        const [fr, fc] = move.from;
                        const [tr, tc] = move.to;
                        gameState.board[tr][tc] = {...move.tile};
                        gameState.board[fr][fc] = createEmptyState();
                    }
                }
            } while (moved);
            break;
        }
        // --- END: REVISED 'CENTER' SHIFTING LOGIC ---


        default: // Includes 'none'
            // For 'none' mode, we need to ensure matched tiles are properly cleared
            // by setting their state explicitly and forcing a re-render
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (gameState.board[r][c].matched) {
                        gameState.board[r][c] = createEmptyState();
                        boardChanged = true;
                    }
                }
            }
            break;
    }

     // Re-render the board only if the state actually changed.
     if (boardChanged) {
          renderBoardAfterFill();
     }
}


// 重新渲染填补后的棋盘 (Corrected version)
function renderBoardAfterFill() {
    if (!elements.board) {
        debugLog("Board element missing for render.", 'error');
        return;
    }
    
    // 清理渲染相关的临时变量
    if (gameState.renderTimeout) {
        clearTimeout(gameState.renderTimeout);
        gameState.renderTimeout = null;
    }

    // Store current scroll position to prevent page jump
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Clear existing tile elements efficiently
    while (elements.board.firstChild) {
        elements.board.removeChild(elements.board.lastChild);
    }

    // Recreate only the necessary tiles based on updated gameState.board
    for (let row = 0; row < gameConfig.rows; row++) {
        for (let col = 0; col < gameConfig.cols; col++) {
            // Check if row/col exists in the board state first
             if (!gameState.board[row] || !gameState.board[row][col]) {
                 debugLog(`Missing board state for [${row}, ${col}] during render.`, 'warn');
                 gameState.board[row] = gameState.board[row] || [];
                 gameState.board[row][col] = { emoji: null, matched: true, element: null };
                 createEmptyTile(row, col); // Render empty placeholder
                 continue;
             }

            const tileData = gameState.board[row][col];

            // Only create elements for tiles that have an emoji and are not matched
            if (tileData.emoji && !tileData.matched) {
                // Use createTile: it adds element to DOM and updates tileData.element
                createTile(row, col, tileData.emoji);
            } else {
                 // Create an empty placeholder visually and ensure state is correct
                 gameState.board[row][col] = { emoji: null, matched: true, element: null };
                 createEmptyTile(row, col);
            }
        }
    }

    // Restore scroll position
    window.scrollTo(scrollX, scrollY);
}