/**
 * TETRIS PRO — Dark + Light Mode
 * Clean Modern Style, Fully Responsive
 */

(() => {
    'use strict';

    // ==========================================================================
    // 1. ENGINE CONSTANTS & RENDER CONTEXTS
    // ==========================================================================
    const COLS = 10;
    const ROWS = 20;

    const canvas = document.getElementById("boardCanvas");
    const ctx = canvas.getContext("2d");

    const nextCanvas = document.getElementById("nextCanvas");
    const nextCtx = nextCanvas.getContext("2d");

    const holdCanvas = document.getElementById("holdCanvas");
    const holdCtx = holdCanvas.getContext("2d");

    // Block size setup
    const BLOCK_SIZE = canvas.width / COLS; 
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    
    nextCtx.scale(20, 20);
    holdCtx.scale(20, 20);

    // 🎨 COLORS — same bright blocks for both themes
    const COLORS = [
        null,
        "#00FFFF", // I - Cyan
        "#FFFF00", // O - Yellow
        "#AA00FF", // T - Purple
        "#00FF00", // S - Green
        "#FF0000", // Z - Red
        "#0000FF", // J - Blue
        "#FF8000"  // L - Orange
    ];

    // ==========================================================================
    // 2. TETROMINO DEFINITIONS
    // ==========================================================================
    const PIECES = {
        I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        O: [[2,2],[2,2]],
        T: [[0,3,0],[3,3,3],[0,0,0]],
        S: [[0,4,4],[4,4,0],[0,0,0]],
        Z: [[5,5,0],[0,5,5],[0,0,0]],
        J: [[6,0,0],[6,6,6],[0,0,0]],
        L: [[0,0,7],[7,7,7],[0,0,0]]
    };

    const BLOCK_KEYS = Object.keys(PIECES);

    // ==========================================================================
    // 3. 7-BAG RANDOMIZER
    // ==========================================================================
    let bag = [];

    function generateRandomBag() {
        const tempBag = [...BLOCK_KEYS];
        for (let i = tempBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tempBag[i], tempBag[j]] = [tempBag[j], tempBag[i]];
        }
        return tempBag;
    }

    function pullNextPieceMatrix() {
        if (bag.length === 0) bag = generateRandomBag();
        return PIECES[bag.pop()];
    }

    // ==========================================================================
    // 4. SOUND SYSTEM
    // ==========================================================================
    let audioCtx = null;
    let soundEnabled = true;

    function initAudioContext() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playSoundEffect(type) {
        if (!audioCtx || !soundEnabled) return;
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        switch(type) {
            case 'move':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
                break;
            case 'rotate':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(330, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
                break;
            case 'drop':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(110, now);
                gainNode.gain.setValueAtTime(0.07, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
                break;
            case 'clear':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now); 
                osc.frequency.setValueAtTime(880, now + 0.1); 
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
                break;
            case 'gameover':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(55, now + 0.5);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0.001, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
                break;
        }
    }

    // ==========================================================================
    // 5. GAME STATE
    // ==========================================================================
    const arena = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        nextMatrix: null,
        holdMatrix: null,
        canHold: true,
        score: 0,
        lines: 0,
        level: 1
    };

    let dropCounter = 0;
    let dropInterval = 800; 
    let lastTime = 0;
    let isPaused = true; 
    let animationFrameId = null;
    let highScore = localStorage.getItem('tetrisHighScore') || 0;

    // ==========================================================================
    // 6. COLLISION DETECTION
    // ==========================================================================
    function checkCollision(targetArena, activePlayer) {
        const m = activePlayer.matrix;
        const offset = activePlayer.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                   (targetArena[y + offset.y] &&
                    targetArena[y + offset.y][x + offset.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function mergePieceToArena() {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    // ==========================================================================
    // 7. ROTATION
    // ==========================================================================
    function rotateMatrix(matrix) {
        return matrix.map((_, i) => matrix.map(row => row[i]).reverse());
    }

    function executePlayerRotation() {
        if (isPaused) return;
        const originalX = player.pos.x;
        let kickOffset = 0;
        
        player.matrix = rotateMatrix(player.matrix);

        while (checkCollision(arena, player)) {
            player.pos.x += kickOffset <= 0 ? 1 : -1;
            kickOffset = kickOffset <= 0 ? -kickOffset + 1 : -kickOffset - 1;
            
            if (kickOffset > player.matrix[0].length) {
                player.matrix = rotateMatrix(rotateMatrix(rotateMatrix(player.matrix)));
                player.pos.x = originalX;
                return;
            }
        }
        playSoundEffect('rotate');
    }

    // ==========================================================================
    // 8. DROP & LINE CLEAR
    // ==========================================================================
    function executeTickDrop() {
        if (isPaused) return;
        player.pos.y++;
        if (checkCollision(arena, player)) {
            player.pos.y--;
            lockTetrominoAndAdvance();
        }
        dropCounter = 0;
    }

    function executeInstantHardDrop() {
        if (isPaused) return;
        let pointsDropped = 0;
        while (!checkCollision(arena, player)) {
            player.pos.y++;
            pointsDropped++;
        }
        player.pos.y--;
        player.score += pointsDropped * 2; 
        lockTetrominoAndAdvance();
        playSoundEffect('drop');
    }

    function lockTetrominoAndAdvance() {
        mergePieceToArena();
        processLineClears();
        cycleActivePlayerPieces();
    }

    function processLineClears() {
        let clearedCount = 0;

        outerLoop: for (let y = arena.length - 1; y >= 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) continue outerLoop;
            }
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row); 
            ++y; 
            ++clearedCount;
        }

        if (clearedCount > 0) {
            const rewards = [0, 100, 300, 500, 800];
            player.score += (rewards[clearedCount] || 1200) * player.level;
            player.lines += clearedCount;

            if (player.lines >= player.level * 10) {
                player.level++;
                dropInterval = Math.max(100, 800 - (player.level - 1) * 85);
            }

            if (player.score > highScore) {
                highScore = player.score;
                localStorage.setItem('tetrisHighScore', highScore);
            }

            playSoundEffect('clear');
            updateUserInterfaceDOM();
        }
    }

    function swapHeldPiece() {
        if (!player.canHold || isPaused) return;

        if (!player.holdMatrix) {
            player.holdMatrix = player.matrix;
            cycleActivePlayerPieces();
        } else {
            const temp = player.matrix;
            player.matrix = player.holdMatrix;
            player.holdMatrix = temp;
            
            player.pos.y = 0;
            player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
        }
        player.canHold = false;
        renderAuxiliaryCanvases();
    }

    function cycleActivePlayerPieces() {
        player.matrix = player.nextMatrix ? player.nextMatrix : pullNextPieceMatrix();
        player.nextMatrix = pullNextPieceMatrix();
        
        player.pos.y = 0;
        player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
        player.canHold = true;

        if (checkCollision(arena, player)) {
            executeGameOverSequence();
        }
        renderAuxiliaryCanvases();
    }

    function executeGameOverSequence() {
        playSoundEffect('gameover');
        const overlay = document.getElementById("gameStatus");
        overlay.classList.remove("hidden");
        overlay.querySelector('.overlay-text').innerText = "GAME OVER";
        overlay.querySelector('.overlay-subtext').innerText = `Score: ${player.score}`;
        resetEngineMetrics();
    }

    function resetEngineMetrics() {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        player.lines = 0;
        player.level = 1;
        dropInterval = 800;
        player.holdMatrix = null;
        player.nextMatrix = null;
        isPaused = true;
        updateUserInterfaceDOM();
        renderAuxiliaryCanvases();
        drawCoreFrames();
    }

    // ==========================================================================
    // 9. RENDERING — adapts to theme
    // ==========================================================================
    function getThemeColors() {
        const isDark = document.body.classList.contains('dark-theme');
        return {
            board: isDark ? '#000000' : '#f0f0f0',
            grid: isDark ? '#1a1a1a' : '#e0e0e0',
            ghost: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
        };
    }

    function drawGridBlock(context, matrix, position, isGhost = false) {
        const theme = getThemeColors();
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    if (isGhost) {
                        context.strokeStyle = COLORS[value];
                        context.lineWidth = 0.08;
                        context.setLineDash([0.15, 0.1]);
                        context.strokeRect(x + position.x + 0.05, y + position.y + 0.05, 0.9, 0.9);
                        context.setLineDash([]);
                    } else {
                        context.fillStyle = COLORS[value];
                        context.fillRect(x + position.x, y + position.y, 1, 1);
                        
                        context.strokeStyle = "rgba(0,0,0,0.6)";
                        context.lineWidth = 0.06;
                        context.strokeRect(x + position.x + 0.06, y + position.y + 0.06, 0.88, 0.88);
                        
                        context.fillStyle = "rgba(255,255,255,0.15)";
                        context.fillRect(x + position.x, y + position.y, 1, 0.12);
                    }
                }
            });
        });
    }

    function drawProjectionGhostBlock() {
        const ghost = { pos: { ...player.pos }, matrix: player.matrix };
        while (!checkCollision(arena, ghost)) ghost.pos.y++;
        ghost.pos.y--; 
        if (ghost.pos.y > player.pos.y) drawGridBlock(ctx, ghost.matrix, ghost.pos, true);
    }

    function drawCoreFrames() {
        const theme = getThemeColors();
        
        ctx.fillStyle = theme.board;
        ctx.fillRect(0, 0, COLS, ROWS);
        
        ctx.strokeStyle = theme.grid;
        ctx.lineWidth = 0.02;
        for(let x=0; x<=COLS; x++) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,ROWS); ctx.stroke(); }
        for(let y=0; y<=ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(COLS,y); ctx.stroke(); }

        drawGridBlock(ctx, arena, { x: 0, y: 0 });
        drawProjectionGhostBlock();
        drawGridBlock(ctx, player.matrix, player.pos);
    }

    function renderAuxiliaryCanvases() {
        const theme = getThemeColors();
        
        nextCtx.fillStyle = theme.board;
        nextCtx.clearRect(0, 0, 6, 6);
        if (player.nextMatrix) {
            const x = (5 - player.nextMatrix[0].length) / 2;
            const y = (5 - player.nextMatrix.length) / 2;
            drawGridBlock(nextCtx, player.nextMatrix, { x, y });
        }

        holdCtx.fillStyle = theme.board;
        holdCtx.clearRect(0, 0, 6, 6);
        if (player.holdMatrix) {
            const x = (5 - player.holdMatrix[0].length) / 2;
            const y = (5 - player.holdMatrix.length) / 2;
            drawGridBlock(holdCtx, player.holdMatrix, { x, y });
        }
    }

    function updateUserInterfaceDOM() {
        document.getElementById("scoreDisplay").innerText = player.score.toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: false });
        document.getElementById("linesDisplay").innerText = player.lines;
        document.getElementById("levelDisplay").innerText = player.level;
        document.getElementById("highScoreDisplay").innerText = highScore.toLocaleString();
    }

    // ==========================================================================
    // 10. GAME LOOP
    // ==========================================================================
    function processEngineLoopFrame(timestamp = 0) {
        if (isPaused) return;

        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        dropCounter += deltaTime;

        if (dropCounter >= dropInterval) executeTickDrop();

        drawCoreFrames();
        animationFrameId = requestAnimationFrame(processEngineLoopFrame);
    }

    // ==========================================================================
    // 11. KEYBOARD CONTROLS
    // ==========================================================================
    const keyMapTable = {
        ArrowLeft: () => { 
            player.pos.x--; 
            if (checkCollision(arena, player)) player.pos.x++; 
            else playSoundEffect('move');
            drawCoreFrames();
        },
        ArrowRight: () => { 
            player.pos.x++; 
            if (checkCollision(arena, player)) player.pos.x--; 
            else playSoundEffect('move');
            drawCoreFrames();
        },
        ArrowDown: () => { executeTickDrop(); playSoundEffect('move'); drawCoreFrames(); },
        ArrowUp: () => { executePlayerRotation(); drawCoreFrames(); },
        Space: () => { executeInstantHardDrop(); drawCoreFrames(); },
        KeyC: () => { swapHeldPiece(); drawCoreFrames(); },
        Escape: () => { togglePauseState(); }
    };

    document.addEventListener("keydown", event => {
        const action = keyMapTable[event.code] || keyMapTable[event.key];
        if (action) {
            event.preventDefault(); 
            initAudioContext();
            action();
        }
    });

    // ==========================================================================
    // 12. MOBILE BUTTON CONTROLS
    // ==========================================================================
    document.getElementById("btn-move-left").onclick = () => {
        initAudioContext();
        if (isPaused) return;
        player.pos.x--;
        if (checkCollision(arena, player)) player.pos.x++;
        else playSoundEffect('move');
        drawCoreFrames();
    };

    document.getElementById("btn-move-right").onclick = () => {
        initAudioContext();
        if (isPaused) return;
        player.pos.x++;
        if (checkCollision(arena, player)) player.pos.x--;
        else playSoundEffect('move');
        drawCoreFrames();
    };

    document.getElementById("btn-soft").onclick = () => {
        initAudioContext();
        if (isPaused) return;
        executeTickDrop();
        playSoundEffect('move');
        drawCoreFrames();
    };

    document.getElementById("btn-rotate").onclick = () => {
        initAudioContext();
        executePlayerRotation();
        drawCoreFrames();
    };

    document.getElementById("btn-hard").onclick = () => {
        initAudioContext();
        executeInstantHardDrop();
        drawCoreFrames();
    };

    document.getElementById("btn-hold").onclick = () => {
        initAudioContext();
        swapHeldPiece();
        drawCoreFrames();
    };

    const muteBtn = document.getElementById("muteBtn");
    if(muteBtn) {
        muteBtn.onclick = () => {
            soundEnabled = !soundEnabled;
            muteBtn.innerHTML = soundEnabled 
                ? '<i data-lucide="volume-2"></i>' 
                : '<i data-lucide="volume-x"></i>';
            if(window.lucide) lucide.createIcons();
        };
    }

    // ==========================================================================
    // 13. 🎨 THEME SWITCH
    // ==========================================================================
    const themeToggle = document.getElementById("themeToggle");
    themeToggle.onclick = () => {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        drawCoreFrames();
        renderAuxiliaryCanvases();
    };

    // ==========================================================================
    // 14. STATE CONTROLS
    // ==========================================================================
    function togglePauseState() {
        isPaused = !isPaused;
        const overlay = document.getElementById("gameStatus");
        
        if (isPaused) {
            overlay.classList.remove("hidden");
            overlay.querySelector('.overlay-text').innerText = "PAUSED";
            overlay.querySelector('.overlay-subtext').innerText = "Press PLAY to continue";
            cancelAnimationFrame(animationFrameId);
        } else {
            overlay.classList.add("hidden");
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(processEngineLoopFrame);
        }
    }

    document.getElementById("startBtn").onclick = () => {
        initAudioContext();
        if (isPaused) {
            if (!player.matrix) cycleActivePlayerPieces();
            togglePauseState();
        }
    };

    document.getElementById("pauseBtn").onclick = () => {
        initAudioContext();
        togglePauseState();
    };

    document.getElementById("resetGameBtn").onclick = () => {
        initAudioContext();
        resetEngineMetrics();
        cycleActivePlayerPieces();
        togglePauseState();
    };

    resetEngineMetrics();

})();