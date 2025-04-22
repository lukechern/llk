// Handle tile click

function handleTileClick(row, col) {
    // 快速验证 - 提前返回无效点击
    if (!gameState.board ?.[row] ?.[col]) {
        debugLog(`Invalid click target: row ${row}, col ${col}`, 'warn');
        return;
    }

    const tileData = gameState.board[row][col];
    // 忽略已匹配或空瓦片的点击
    if (!tileData || tileData.matched || !tileData.emoji) {
        return;
    }

    // 播放点击音效
    playSound('clickSound');

    const tileElement = tileData.element;
    // 确保元素存在
    if (!tileElement) {
        debugLog(`Missing element for tile at: row ${row}, col ${col}`, 'error');
        // 尝试重新查找元素
        const foundElement = elements.board.querySelector(`.tile[data-row='${row}'][data-col='${col}']`);
        if (foundElement && !foundElement.classList.contains('empty')) {
            tileData.element = foundElement;
            handleTileClick(row, col); // 使用更新后的状态重新调用
        }
        return;
    }

    // 添加按下动画效果
    tileElement.classList.add('pressed');
    // 使用setTimeout确保动画有足够时间完成
    setTimeout(() => {
        // 检查元素是否仍然存在
        if (tileElement.isConnected) {
            tileElement.classList.remove('pressed');
        }
    }, 200); // 与CSS中的动画时间对应
    // 注意：双重requestAnimationFrame大约相当于一帧(16.7ms)后执行，比setTimeout(200)更高效
    // 注意：双重requestAnimationFrame大约相当于一帧(16.7ms)后执行，比setTimeout(200)更高效

    // If clicking already selected tile, deselect it
    if (gameState.selectedTile && gameState.selectedTile.row === row && gameState.selectedTile.col === col) {
        tileElement.classList.remove('selected'); // Remove selected style
        gameState.selectedTile = null; // Clear selection state
        return;
    }

    tileElement.classList.add('selected'); // Highlight the clicked tile visually

    if (!gameState.selectedTile) {
        // This is the first tile selected in a potential pair
        gameState.selectedTile = { row, col, element: tileElement };
    } else {
        // This is the second tile selected
        const firstSelection = gameState.selectedTile;
        const firstTileData = gameState.board[firstSelection.row][firstSelection.col];

        // Deselect previous visually if it wasn't the same tile
        if (!(firstSelection.row === row && firstSelection.col === col) && firstSelection.element) {
            firstSelection.element.classList.remove('selected');
        }


        // Prevent further clicks while processing this pair check
        if (elements.board) elements.board.style.pointerEvents = 'none';

        // --- Check 1: Emojis must match ---
        if (firstTileData.emoji === tileData.emoji) {

            // --- Check 2: Tiles must be connectable using Lianliankan rules ---
            const connectionPath = findConnectionPath(firstSelection.row, firstSelection.col, row, col);
            if (connectionPath) {
                // ---- Match Success ----
                debugLog(`Match found and connectable: (${firstSelection.row},${firstSelection.col}) and (${row},${col})`);

                // Play match success sound
                //delay for a short time
                setTimeout(() => {
                    playSound('matchSound');
                }, 600); // 100ms delay

                // Show connection path
                drawConnectionPath(connectionPath);

                // Use delay to show path before clearing tiles - reduced delay for faster gameplay
                setTimeout(() => {
                    // Ensure tiles haven't been cleared by another process in the meantime
                    if (gameState.board[firstSelection.row] ?.[firstSelection.col] &&
                        gameState.board[row] ?.[col]) {

                        // Update game state
                        gameState.board[firstSelection.row][firstSelection.col].matched = true;
                        gameState.board[row][col].matched = true;

                        // Update visuals (remove selection, add matched class for styling)
                        if (firstSelection.element) {
                            firstSelection.element.classList.remove('selected');
                            firstSelection.element.innerHTML = ''; // Clear inner content
                        }
                        if (tileElement) {
                            tileElement.classList.remove('selected');
                            tileElement.innerHTML = ''; // Clear inner content
                        }

                        // Remove connection path
                        removeConnectionPath();

                        // Calculate combo
                        const currentTime = Date.now();
                        // Combo counts if matches are within 10 seconds
                        if (gameState.lastMatchTime && currentTime - gameState.lastMatchTime < 10000) {
                            gameState.comboCount++; // Current streak combo

                            if (gameState.matchedPairs > 0) { // Don't count first match as a combo start for total
                                gameState.totalComboCount++; // Total combos in the game - Moved here
                            }

                            gameState.score += 5; // Extra points for combo
                        } else {
                            gameState.comboCount = 1; // Start a new combo streak of 1
                            // Removed gameState.totalComboCount++ from here
                        }
                        gameState.lastMatchTime = currentTime;

                        // Update combo display
                        const lianjiElement = document.getElementById('lianji');
                        if (lianjiElement) lianjiElement.textContent = gameState.totalComboCount || 0; // Show total accumulated combos

                        // Update score and pair count
                        gameState.score += 10;
                        if (elements.score) elements.score.textContent = gameState.score;
                        gameState.matchedPairs++;

                        // Test logic: quickly show score card
                        if (gameState.matchedPairs === 3) {
                            // endGame(true); 
                            debugLog(scriptLang.test_mode || "Test mode: show score card after 3 matches");
                        }

                        debugLog('lalal -- b--2');

                        // --- Fill and Check ---
                        // Fill empty spaces (This internally calls renderBoardAfterFill if needed)
                        fillEmptyTiles();
                        debugLog('lalal -- b--1');

                        // Check if the board is stuck AFTER filling
                        setTimeout(() => {
                            // Check if game already ended
                            if (gameState.matchedPairs === gameState.totalPairs) return;

                            if (!hasMatchablePairs()) {
                                debugLog(scriptLang.UTF8SC.js.script.no_pairs_refresh || "没有可消除的牌对，自动刷新棋盘");
                                if (elements.refresh) elements.refresh.click();
                                else debugLog("Refresh button not found for auto-refresh.", 'warn');
                            }
                            // Re-enable clicks AFTER the check/refresh is done
                            if (elements.board) elements.board.style.pointerEvents = 'auto';
                        }, 300); // Delay slightly after fill animation/render

                        // Check for win condition
                        if (gameState.matchedPairs === gameState.totalPairs) {
                            endGame(true); // Pass true for win
                        }
                        // Note: pointerEvents re-enabled in the setTimeout above or in endGame failure

                    } else {
                        debugLog("One or both tiles disappeared before match confirmation.", 'warn');
                        // Re-enable clicks if match failed due to disappearance
                        if (elements.board) elements.board.style.pointerEvents = 'auto';
                    }

                }, 450); // Reduced delay (was 500)

                gameState.selectedTile = null; // Reset selection after successful match processing starts

            } else {
                // ---- Match Failure: Path Blocked ----
                debugLog(`Emojis match but path blocked: (${firstSelection.row},${firstSelection.col}) and (${row},${col})`);

                // Play match failure sound
                if (!audioState.soundMuted) {
                    audioElements.errorSound.src = window.audioPaths.errorSound;
                    audioElements.errorSound.play().catch(e => debugLog('Error sound error:', e));
                }
                if (firstSelection.element) firstSelection.element.classList.add('shake');
                if (tileElement) tileElement.classList.add('shake');

                setTimeout(() => {
                    if (firstSelection.element) firstSelection.element.classList.remove('selected', 'shake');
                    if (tileElement) tileElement.classList.remove('selected', 'shake'); // Keep second tile selection highlighted
                    gameState.selectedTile = null; // Reset selection fully on failure
                    // Re-enable clicks after animation
                    if (elements.board) elements.board.style.pointerEvents = 'auto';
                }, 500); // Delay matches shake animation duration in CSS
            }
        } else {
            // ---- Match Failure: Different Emojis ----
            debugLog(`Emojis don't match: (${firstSelection.row},${firstSelection.col}) and (${row},${col})`);

            // Play match failure sound
            if (!audioState.soundMuted) {
                audioElements.errorSound.src = window.audioPaths.errorSound;
                audioElements.errorSound.play().catch(e => debugLog('Error sound error:', e));
            }
            if (firstSelection.element) firstSelection.element.classList.add('shake');
            if (tileElement) tileElement.classList.add('shake');


            setTimeout(() => {
                if (firstSelection.element) firstSelection.element.classList.remove('selected', 'shake');
                if (tileElement) tileElement.classList.remove('selected', 'shake');
                gameState.selectedTile = null; // Reset selection
                // Re-enable clicks after animation
                if (elements.board) elements.board.style.pointerEvents = 'auto';
            }, 500); // Delay matches shake animation duration
        }
        // Note: gameState.selectedTile is reset/updated inside the specific logic paths
    }
}


// 提示功能：高亮显示一对可消除的牌
function showHint() {
    // 先清除之前的提示高亮
    clearHint();

    // 播放提示音效
    if (!audioState.soundMuted) {
        audioElements.hintSound.src = window.audioPaths.hintSound;
        audioElements.hintSound.play().catch(e => debugLog('Hint sound play prevented:', e));
    }

    // 查找一对可消除的牌
    const matchablePair = findMatchablePair();

    if (matchablePair) {
        const { tile1, tile2 } = matchablePair;

        // 获取对应的DOM元素 (Safely)
        const element1 = gameState.board[tile1.row] ?.[tile1.col] ?.element;
        const element2 = gameState.board[tile2.row] ?.[tile2.col] ?.element;

        // 添加提示高亮样式 if elements exist
        if (element1 && element2) {
            element1.classList.add('hint');
            element2.classList.add('hint');

            // Optional: Scroll hint into view if needed
            // element1.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // 5秒后自动清除提示高亮
            setTimeout(clearHint, 5000);
        } else {
            debugLog("Hint elements not found for pair:", 'warn', tile1, tile2);
            // Optionally try finding pair again or notify user
        }

    } else {
        // 如果没有找到可消除的牌对，给用户一个提示
        // 使用更优雅的提示替代alert
        showToast(scriptLang.UTF8SC.js.script.no_hint || "无提示！请尝试刷新棋盘", "warning", 3000);
        const hintButton = elements.hint;
        if (hintButton) {
            const originalText = hintButton.textContent;
            hintButton.textContent = scriptLang.UTF8SC.js.script.no_hint_text || "无提示!";
            hintButton.disabled = true;
            setTimeout(() => {
                hintButton.textContent = originalText;
                hintButton.disabled = false;
            }, 1500);
        }
    }
}

// 清除提示高亮
function clearHint() {
    // 移除所有牌的提示高亮样式
    document.querySelectorAll('.tile.hint').forEach(tile => {
        tile.classList.remove('hint');
    });
}

// --- Event Listeners Setup ---
if (elements.hint) {
    elements.hint.addEventListener('click', showHint);
} else {
    debugLog("Hint button element not found.", 'warn');
}