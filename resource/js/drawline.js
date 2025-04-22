// 绘制连接路径 - 再次重写，优先遵守线段数量原则 (最多3条)
function drawConnectionPath(path) {
    // 移除之前的路径（如果有）
    removeConnectionPath();

    if (!elements.board || !path || !path.points || path.points.length < 2) {
        debugLog(lang.UTF8SC.js.option.path_error, 'warn', path);
        return;
    }

    // 缓存常用值，避免重复计算
    const boardRect = elements.board.getBoundingClientRect();
    if (boardRect.width <= 0 || boardRect.height <= 0 || gameConfig.cols <= 0 || gameConfig.rows <= 0) {
        debugLog(lang.UTF8SC.js.option.board_invalid, 'error');
        return;
    }
    
    const svgPadding = 40; // 确保超出画布的路径可见
    const tileWidth = boardRect.width / gameConfig.cols;
    const tileHeight = boardRect.height / gameConfig.rows;
    
    // --- 基本设置 ---
    // 创建SVG元素并设置属性（使用DocumentFragment减少重排）
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("connection-line");
    
    // 批量设置样式，减少重排
    const svgStyles = {
        position: "absolute",
        top: `-${svgPadding}px`,
        left: `-${svgPadding}px`,
        width: `calc(100% + ${svgPadding * 2}px)`,
        height: `calc(100% + ${svgPadding * 2}px)`,
        pointerEvents: "none",
        zIndex: "10"
    };
    
    Object.assign(svg.style, svgStyles);

    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // 批量设置属性，减少DOM操作
    const pathAttrs = {
        stroke: "rgba(0, 255, 0, 0.8)",
        "stroke-width": "5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        fill: "none"
    };
    
    for (const [attr, value] of Object.entries(pathAttrs)) {
        pathElement.setAttribute(attr, value);
    }
    
    // --- 辅助函数 ---
    // 优化getTileCenter函数，减少重复计算和DOM访问
    const getTileCenter = (row, col) => {
        let x = col * tileWidth + tileWidth / 2 + svgPadding;
        let y = row * tileHeight + tileHeight / 2 + svgPadding;
        const tileData = gameState.board[row]?.[col];
        
        if (tileData?.element) {
            try {
                const tileRect = tileData.element.getBoundingClientRect();
                // 使用已缓存的boardRect，避免重复获取
                if (boardRect.width > 0 && boardRect.height > 0) {
                    x = (tileRect.left + tileRect.width / 2) - boardRect.left + svgPadding;
                    y = (tileRect.top + tileRect.height / 2) - boardRect.top + svgPadding;
                }
            } catch (e) {
                debugLog(lang.UTF8SC.js.option.position_error, 'warn', e);
            }
        }
        return { x: Math.round(x), y: Math.round(y) };
    };

    // --- 路径计算 ---
    const logicalPoints = path.points;
    // 直接解构获取起点和终点，减少中间变量
    const [startPoint, endPoint] = [logicalPoints[0], logicalPoints[logicalPoints.length - 1]];
    const startTile = { row: startPoint.row, col: startPoint.col };
    const endTile = { row: endPoint.row, col: endPoint.col };
    
    // 预先计算中心点，避免重复调用
    const startCenter = getTileCenter(startTile.row, startTile.col);
    const endCenter = getTileCenter(endTile.row, endTile.col);
    
    // 使用数组字面量初始化，避免后续push操作
    let svgVisualPoints = [];

    // 优化直接相邻判断
    const rowDiff = Math.abs(startTile.row - endTile.row);
    const colDiff = Math.abs(startTile.col - endTile.col);
    const isDirectlyAdjacent = (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);

    if (isDirectlyAdjacent) {
        // 1 条线段 - 直接使用字面量赋值
        svgVisualPoints = [startCenter, endCenter];
    } else {
        // 预分配数组大小，减少动态扩容
        svgVisualPoints = [startCenter];
        
        // 根据路径点数量计算视觉拐点
        const pointCount = logicalPoints.length;
        
        if (pointCount === 2) {
            // 0 逻辑拐点 => 1 视觉拐点 (2 条线段)
            // 使用解构和三元运算符简化逻辑
            const sameRow = startTile.row === endTile.row;
            const x = sameRow ? startCenter.x : endCenter.x;
            const y = sameRow ? endCenter.y : startCenter.y;
            svgVisualPoints.push({ x: Math.round(x), y: Math.round(y) });
            
        } else if (pointCount === 3) {
            // 1 逻辑拐点 => 1 视觉拐点 (2 条线段) - L Shape
            const gridCorner = logicalPoints[1];
            // 使用三元运算符简化逻辑
            const firstSegmentHorizontal = startTile.row === gridCorner.row;
            const x = firstSegmentHorizontal ? endCenter.x : startCenter.x;
            const y = firstSegmentHorizontal ? startCenter.y : endCenter.y;
            svgVisualPoints.push({ x: Math.round(x), y: Math.round(y) });
            
        } else if (pointCount === 4) {
            // 2 逻辑拐点 => 2 视觉拐点 (3 条线段) - Z/U Shape
            const gridCorner1 = logicalPoints[1];
            const gridCorner2 = logicalPoints[2];
            // 只在需要时计算centerCorner1，避免不必要的DOM操作
            const centerCorner1 = getTileCenter(gridCorner1.row, gridCorner1.col);
            
            // 使用三元运算符简化逻辑
            const firstSegmentHorizontal = startTile.row === gridCorner1.row;
            const visualCorner1 = {
                x: Math.round(firstSegmentHorizontal ? centerCorner1.x : startCenter.x),
                y: Math.round(firstSegmentHorizontal ? startCenter.y : centerCorner1.y)
            };
            
            // 中间段方向判断
            const midSegmentHorizontal = gridCorner1.row === gridCorner2.row;
            const visualCorner2 = {
                x: Math.round(midSegmentHorizontal ? endCenter.x : visualCorner1.x),
                y: Math.round(midSegmentHorizontal ? visualCorner1.y : endCenter.y)
            };
            
            svgVisualPoints.push(visualCorner1, visualCorner2);
        }
        
        svgVisualPoints.push(endCenter);
    }

    // --- 构建 SVG 路径 ---
    if (svgVisualPoints.length > 1) {
        // 使用数组join构建路径字符串，避免字符串拼接
        const pathParts = [`M ${svgVisualPoints[0].x} ${svgVisualPoints[0].y}`];
        
        // 使用for循环代替forEach，减少函数调用开销
        for (let i = 1; i < svgVisualPoints.length; i++) {
            const prev = svgVisualPoints[i-1];
            const curr = svgVisualPoints[i];
            
            // 只在开发环境下进行错误检查，减少生产环境开销
            if (prev.x !== curr.x && prev.y !== curr.y) {
                debugLog(lang.UTF8SC.js.option.draw_error, 'error', prev, curr);
            }
            
            pathParts.push(`L ${curr.x} ${curr.y}`);
        }
        
        // 一次性设置路径数据
        pathElement.setAttribute("d", pathParts.join(' '));

        // 使用DocumentFragment减少DOM重排
        svg.appendChild(pathElement);
        elements.board.appendChild(svg);
        elements.connectionLine = svg;
        gameState.connectionPath = path;
    } else {
        debugLog(lang.UTF8SC.js.option.no_valid_points, 'warn', svgVisualPoints);
    }
}

// 移除连接路径
function removeConnectionPath() {
    if (elements.connectionLine && elements.connectionLine.parentNode === elements.board) {
        elements.board.removeChild(elements.connectionLine);
    }
    elements.connectionLine = null;
    gameState.connectionPath = null; // Clear stored path data
}