// Check if tiles can be connected (core logic) - keep original function for compatibility
function canConnect(row1, col1, row2, col2) {
    return !!findConnectionPath(row1, col1, row2, col2);
}

// Find connection path - returns path info or null
function findConnectionPath(row1, col1, row2, col2) {
    // Cannot connect to self
    if (row1 === row2 && col1 === col2) return null;

    // Bounds check and existence check
     if (!gameState.board[row1]?.[col1] || !gameState.board[row2]?.[col2]) {
         debugLog(`Path check: Invalid coordinates or tile data missing at [${row1},${col1}] or [${row2},${col2}]`, 'warn');
         return null;
     }
     // Emojis must match (This check is somewhat redundant as handleTileClick already does it, but safer)
    if (gameState.board[row1][col1].emoji !== gameState.board[row2][col2].emoji) return null;

    // Store all possible paths
    const possiblePaths = [];

    // Check all possible path types
    // Rule 1: 0 Turns (Straight Line) - shortest path
    const straightPath = checkStraightLinePath(row1, col1, row2, col2);
    if (straightPath) {
        possiblePaths.push(straightPath);
    }

    // Rule 2: 1 Turn (L-Shape) - medium path
    const oneTurnPath = checkOneTurnPath(row1, col1, row2, col2);
    if (oneTurnPath) {
        possiblePaths.push(oneTurnPath);
    }

    // Rule 3: 2 Turns (Z-Shape or U-Shape) - longest path
    const twoTurnsPath = checkTwoTurnsPath(row1, col1, row2, col2);
    if (twoTurnsPath) {
        possiblePaths.push(twoTurnsPath);
    }

    // If multiple paths exist, return the shortest one
    if (possiblePaths.length > 0) {
        // Sort by length (ascending)
        possiblePaths.sort((a, b) => a.length - b.length);
        return possiblePaths[0];
    }

    return null; // No valid path found
}

// Helper: Check if a specific point on the board is clear for pathing
// A point is clear if it's outside the board OR inside and has no emoji/is matched.
function isClear(row, col) {
    const rows = gameConfig.rows;
    const cols = gameConfig.cols;

    // Check bounds: Points *outside* the grid are considered clear
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
        return true; // Allow paths to route outside the defined grid cells
    }

    // If within bounds, check the tile state
    // It must exist in the board structure first
     if (!gameState.board[row] || !gameState.board[row][col]) {
         // This condition might occur during complex fills if not careful
         debugLog(`isClear check: State for [${row}, ${col}] doesn't exist.`, 'warn');
         return false; // Treat non-existent internal tile as blocked
     }
    const tile = gameState.board[row][col];
    // A tile is clear if it has no emoji or is already matched.
    // Ensure only matched or empty tiles can be part of the path
    return !tile.emoji || tile.matched;
}


// Keep original function for compatibility (Points to new implementation)
function checkStraightLine(r1, c1, r2, c2) {
    // This function now just checks existence, relies on checkStraightLinePath for actual path
    return !!checkStraightLinePath(r1, c1, r2, c2);
}

// Check straight line connection and return path
function checkStraightLinePath(r1, c1, r2, c2) {
    // Horizontal line check
    if (r1 === r2) {
        const startCol = Math.min(c1, c2) + 1; // Start checking from the tile *after* the first one
        const endCol = Math.max(c1, c2);     // Check up to the tile *before* the second one
        for (let col = startCol; col < endCol; col++) {
            if (!isClear(r1, col)) return null; // Path blocked
        }
        // Return path points: start and end
        return {
            type: 'straight',
            points: [ { row: r1, col: c1 }, { row: r2, col: c2 } ],
            length: Math.abs(c2 - c1) // Horizontal distance as path length
        };
    }
    // Vertical line check
    if (c1 === c2) {
        const startRow = Math.min(r1, r2) + 1;
        const endRow = Math.max(r1, r2);
        for (let row = startRow; row < endRow; row++) {
            if (!isClear(row, c1)) return null; // Path blocked
        }
        // 返回路径点：起点和终点
        return {
            type: 'straight',
            points: [ { row: r1, col: c1 }, { row: r2, col: c2 } ],
            length: Math.abs(r2 - r1) // Vertical distance as path length
        };
    }
    return null; // Not a straight line
}

// 保留原函数用于兼容性 (Points to new implementation)
function checkOneTurn(r1, c1, r2, c2) {
     // This function now just checks existence, relies on checkOneTurnPath for actual path
    return !!checkOneTurnPath(r1, c1, r2, c2);
}

// Check one turn (L-shape) and return path
function checkOneTurnPath(r1, c1, r2, c2) {
    // Store all possible L-shape paths
    const validPaths = [];
    
    // Potential corner points for the L-shape
    const corners = [
        { row: r1, col: c2 }, // Horizontal then vertical
        { row: r2, col: c1 }  // Vertical then horizontal
    ];

    // Check each possible corner
    for (const corner of corners) {
        // Corner must be clear
        if (isClear(corner.row, corner.col)) {
            // Check if both straight line segments are clear
            if (checkStraightLinePath(r1, c1, corner.row, corner.col) &&
                checkStraightLinePath(corner.row, corner.col, r2, c2)) {
                
                // Calculate path length (Manhattan distance)
                const pathLength = Math.abs(r1 - corner.row) + Math.abs(c1 - corner.col) + 
                                  Math.abs(corner.row - r2) + Math.abs(corner.col - c2);
                
                validPaths.push({
                    type: 'oneTurn',
                    points: [
                        { row: r1, col: c1 },
                        corner,
                        { row: r2, col: c2 }
                    ],
                    length: pathLength
                });
            }
        }
    }

    // If valid paths found, return the shortest
    if (validPaths.length > 0) {
        // Sort by path length ascending
        validPaths.sort((a, b) => a.length - b.length);
        return validPaths[0];
    }

    return null; // No valid L-shape path found
}

// 保留原函数用于兼容性 (Points to new implementation)
function checkTwoTurns(r1, c1, r2, c2) {
    // This function now just checks existence, relies on checkTwoTurnsPath for actual path
    return !!checkTwoTurnsPath(r1, c1, r2, c2);
}

// 检查两次转弯（Z形或回折）并返回路径
function checkTwoTurnsPath(r1, c1, r2, c2) {
    const rows = gameConfig.rows;
    const cols = gameConfig.cols;
    
    // 存储所有可能的有效两拐点路径
    const validPaths = [];
    
    // 计算曼哈顿距离以确定搜索范围
    const manhattanDist = Math.abs(r2 - r1) + Math.abs(c2 - c1);
    
    // 横向优先搜索 - 水平、垂直、水平
    // 在棋盘可能的范围内寻找中间列，包括外围虚拟格点
    const colStart = Math.min(-1, Math.min(c1, c2) - 2);
    const colEnd = Math.max(cols, Math.max(c1, c2) + 2);
    
    for (let i = colStart; i <= colEnd; i++) {
        // 检查中间列的两个交点是否畅通
        if (isClear(r1, i) && isClear(r2, i)) {
            // 检查三条路径段是否都畅通
            if (checkStraightLinePath(r1, c1, r1, i) &&
                checkStraightLinePath(r1, i, r2, i) &&
                checkStraightLinePath(r2, i, r2, c2))
            {
                // 计算路径长度（曼哈顿距离）
                const pathLength = Math.abs(r1 - r1) + Math.abs(c1 - i) + 
                                  Math.abs(r1 - r2) + Math.abs(i - i) + 
                                  Math.abs(r2 - r2) + Math.abs(i - c2);
                
                validPaths.push({
                    type: 'twoTurns',
                    points: [
                        { row: r1, col: c1 },
                        { row: r1, col: i },
                        { row: r2, col: i },
                        { row: r2, col: c2 }
                    ],
                    length: pathLength
                });
            }
        }
    }

    // 纵向优先搜索 - 垂直、水平、垂直
    const rowStart = Math.min(-1, Math.min(r1, r2) - 2);
    const rowEnd = Math.max(rows, Math.max(r1, r2) + 2);
    
    for (let i = rowStart; i <= rowEnd; i++) {
        if (isClear(i, c1) && isClear(i, c2)) {
            if (checkStraightLinePath(r1, c1, i, c1) &&
                checkStraightLinePath(i, c1, i, c2) &&
                checkStraightLinePath(i, c2, r2, c2))
            {
                // 计算路径长度（曼哈顿距离）
                const pathLength = Math.abs(r1 - i) + Math.abs(c1 - c1) + 
                                  Math.abs(i - i) + Math.abs(c1 - c2) + 
                                  Math.abs(i - r2) + Math.abs(c2 - c2);
                
                validPaths.push({
                    type: 'twoTurns',
                    points: [
                        { row: r1, col: c1 },
                        { row: i, col: c1 },
                        { row: i, col: c2 },
                        { row: r2, col: c2 }
                    ],
                    length: pathLength
                });
            }
        }
    }

    // 如果找到了有效路径，返回最短的
    if (validPaths.length > 0) {
        // 按路径长度升序排序
        validPaths.sort((a, b) => a.length - b.length);
        return validPaths[0];
    }

    return null; // 没有找到有效的两拐点路径
}



// 辅助函数：洗牌算法 (Fisher-Yates Shuffle)
function shuffleArray(array) {
    const newArray = [...array]; // Create a shallow copy
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap
    }
    return newArray;
}
