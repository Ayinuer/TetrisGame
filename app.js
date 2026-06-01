/**
 * TETRIS PRO — Ultimate Arcade Engine Core Implementation
 * Updated: More Interactive, Animated & Feature-Rich
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

    // Dynamic Context Normalization (Grid Blocks Mapping)
    const BLOCK_SIZE = canvas.width / COLS; 
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    
    // Preview Blocks mapping normalized to smaller container
    nextCtx.scale(22, 22);
    holdCtx.scale(22, 22);

    // Premium Color System Matrix Matching Style Layout CSS Theme
    const COLORS = [
        null,
        "#00f5ff", // 1: I - Cyan
        "#ff00d4", // 2: O - Pink/Magenta
        "#ffe600", // 3: T - Yellow
        "#00ff88", // 4: S - Neon Green
        "#ff6b00", // 5: Z - Vivid Orange
        "#a855f7", // 6: J - Electric Purple
        "#ef4444"  // 7: L - Crimson Red
    ];

    // Glow versions for effects
    const GLOW_COLORS = [
        null,
        "rgba(0, 245, 255, 0.5)",
        "rgba(255, 0, 212, 0.5)",
        "rgba(255, 230, 0, 0.5)",
        "rgba(0, 255, 136, 0.5)",
        "rgba(255, 107, 0, 0.5)",
        "rgba(168, 85, 247, 0.5)",
        "rgba(239, 68, 68, 0.5)"
    ];

    // ==========================================================================
    // 2. TETROMINO MATRIX DEFINITIONS (Standard SRS Layout)
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
    // 3. ARCHETYPE RANDOMIZER: 7-BAG GENERATOR SYSTEM
    // ==========================================================================
    let bag = [];

    function generateRandomBag() {
        const tempBag = [...BLOCK_KEYS];
        // Fisher-Yates Shuffle Implementation
        for (let i = tempBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tempBag[i], tempBag[j]] = [tempBag[j], tempBag[i]];
        }
        return tempBag;
    }

    function pullNextPieceMatrix() {
        if (bag.length === 0) {
            bag = generateRandomBag();
        }
        return PIECES[bag.pop()];
    }

    // ==========================================================================
    // 4. RETRO FX SYNTHESIZER + SOUND TOGGLE
    // ==========================================================================
    let audioCtx = null;
    let soundEnabled = true; // NEW: Sound toggle state

    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSoundEffect(type) {
        if (!audioCtx || !soundEnabled) return; // Only play if sound is ON
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        switch(type) {
            case 'move':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(160, now);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'rotate':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(240, now);
                osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'drop':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(90, now);
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'clear':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); 
                osc.frequency.setValueAtTime(659.25, now + 0.08); 
                osc.frequency.setValueAtTime(783.99, now + 0.16); 
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'gameover':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.6);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.linearRampToValueAtTime(0.001, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
            case 'levelup': // NEW: Level up sound
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(880, now + 0.1);
                osc.frequency.setValueAtTime(1320, now + 0.2);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
        }
    }

    // ==========================================================================
    // 5. MEMORY MATRIX & ENGINE INSTANCE STATE + NEW FEATURE STATES
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
    let highScore = localStorage.getItem('tetrisHighScore') || 0; // NEW: High score
    let particles = []; // NEW: Particle system for effects

    // ==========================================================================
    // 6. GEOMETRIC COLLISION ENGINE
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
                    createParticles(x + player.pos.x, y + player.pos.y, value); // NEW: Spawn particles
                }
            });
        });
    }

    // ==========================================================================
    // 7. PIECE RE-POSITIONING & ROTATION MATRIX ENGINE
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
        addButtonFeedback('btn-rotate'); // NEW: Visual button feedback
    }

    // ==========================================================================
    // 8. VELOCITY DROP LOGIC & LINE CRUSH SECTIONS
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
        addButtonFeedback('btn-hard'); // NEW: Visual button feedback
    }

    function lockTetrominoAndAdvance() {
        mergePieceToArena();
        processLineClears();
        cycleActivePlayerPieces();
        shakeScreen(3); // NEW: Screen shake on lock
    }

    function processLineClears() {
        let clearedCount = 0;

        outerLoop: for (let y = arena.length - 1; y >= 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    continue outerLoop;
                }
            }
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row); 
            ++y; 
            ++clearedCount;
            flashLine(y); // NEW: Flash effect on cleared line
        }

        if (clearedCount > 0) {
            const baseScoringRowRewards = [0, 100, 300, 500, 800];
            const earnedPoints = (baseScoringRowRewards[clearedCount] || 1200) * player.level;
            
            player.score += earnedPoints;
            player.lines += clearedCount;

            if (player.lines >= player.level * 10) {
                player.level++;
                dropInterval = Math.max(100, 800 - (player.level - 1) * 85);
                playSoundEffect('levelup');
                showLevelUpNotification(); // NEW: Level up message
            }

            // Update high score
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
        playSoundEffect('move');
        renderAuxiliaryCanvases();
        addButtonFeedback('btn-hold'); // NEW: Visual button feedback
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
        showGameOverOverlay(); // NEW: Better game over UI
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
        
        document.getElementById("gameStatus").classList.remove("hidden");
        document.getElementById("gameStatus").querySelector('.overlay-text').innerText = "GAME OVER";
        
        updateUserInterfaceDOM();
        renderAuxiliaryCanvases();
        drawCoreFrames();
    }

    // ==========================================================================
    // 9. NEW: VISUAL EFFECTS SYSTEM
    // ==========================================================================

    // Create small particles when pieces lock
    function createParticles(x, y, colorIndex) {
        for (let i = 0; i < 4; i++) {
            particles.push({
                x: x + 0.5,
                y: y + 0.5,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                alpha: 1,
                color: COLORS[colorIndex],
                size: Math.random() * 0.2 + 0.1
            });
        }
    }

    // Update and draw particles
    function updateParticles() {
        particles = particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            return p.alpha > 0;
        });
        
        particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    // Screen shake effect
    let shakeTime = 0;
    function shakeScreen(duration) {
        shakeTime = duration;
    }

    // Flash cleared lines
    let flashLines = [];
    function flashLine(y) {
        flashLines.push({ y: y, time: 10 });
    }

    // Visual feedback for buttons
    function addButtonFeedback(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.transform = 'scale(0.95)';
        setTimeout(() => el.style.transform = '', 100);
    }

    // Show temporary notifications
    function showNotification(text, color = '#fff') {
        const overlay = document.getElementById("gameStatus");
        const textEl = overlay.querySelector('.overlay-text');
        const subEl = overlay.querySelector('.overlay-subtext');
        
        const originalText = textEl.innerText;
        const originalSub = subEl.innerText;
        
        textEl.innerText = text;
        textEl.style.color = color;
        overlay.classList.remove('hidden');
        
        setTimeout(() => {
            textEl.innerText = originalText;
            textEl.style.color = '';
            if (isPaused) overlay.classList.remove('hidden');
            else overlay.classList.add('hidden');
        }, 1200);
    }

    function showLevelUpNotification() {
        showNotification(`LEVEL ${player.level}`, '#ffe600');
    }

    function showGameOverOverlay() {
        const overlay = document.getElementById("gameStatus");
        overlay.classList.remove('hidden');
        overlay.querySelector('.overlay-text').innerText = "GAME OVER";
        overlay.querySelector('.overlay-subtext').innerHTML = 
            `Score: ${player.score.toLocaleString()}<br>High Score: ${highScore.toLocaleString()}`;
    }

    // ==========================================================================
    // 10. PREMIUM ENGINE GRAPHICS & COMPONENT BLITTING
    // ==========================================================================
    function drawGridBlock(context, matrix, position, isGhost = false) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = COLORS[value];
                    
                    if (isGhost) {
                        context.strokeStyle = COLORS[value];
                        context.lineWidth = 0.08;
                        context.setLineDash([0.2, 0.1]); // NEW: Dashed ghost piece
                        context.strokeRect(x + position.x + 0.04, y + position.y + 0.04, 0.92, 0.92);
                        context.setLineDash([]);
                    } else {
                        // NEW: Gradient blocks for depth
                        const grad = context.createLinearGradient(
                            x + position.x, y + position.y, 
                            x + position.x, y + position.y + 1
                        );
                        grad.addColorStop(0, GLOW_COLORS[value]);
                        grad.addColorStop(0.3, COLORS[value]);
                        grad.addColorStop(1, COLORS[value]);
                        
                        context.fillStyle = grad;
                        context.fillRect(x + position.x, y + position.y, 1, 1);
                        
                        // Highlight
                        context.fillStyle = "rgba(255, 255, 255, 0.2)";
                        context.fillRect(x + position.x, y + position.y, 1, 0.15);
                        
                        // Inner glow
                        context.strokeStyle = "rgba(255, 255, 255, 0.1)";
                        context.lineWidth = 0.05;
                        context.strokeRect(x + position.x + 0.05, y + position.y + 0.05, 0.9, 0.9);
                    }
                }
            });
        });
    }

    function drawProjectionGhostBlock() {
        const ghost = { pos: { ...player.pos }, matrix: player.matrix };
        while (!checkCollision(arena, ghost)) {
            ghost.pos.y++;
        }
        ghost.pos.y--; 
        
        if (ghost.pos.y > player.pos.y) {
            drawGridBlock(ctx, ghost.matrix, ghost.pos, true);
        }
    }

    function drawCoreFrames() {
        // Apply screen shake
        ctx.save();
        if (shakeTime > 0) {
            const dx = (Math.random() - 0.5) * shakeTime;
            const dy = (Math.random() - 0.5) * shakeTime;
            ctx.translate(dx, dy);
            shakeTime -= 0.5;
        }

        // Background with grid lines
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, COLS, ROWS);
        
        // NEW: Subtle grid
        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.lineWidth = 0.02;
        for(let x=0; x<=COLS; x++) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,ROWS); ctx.stroke(); }
        for(let y=0; y<=ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(COLS,y); ctx.stroke(); }

        // Draw flash effect for cleared lines
        flashLines = flashLines.filter(l => {
            if(l.time > 0) {
                ctx.fillStyle = `rgba(255,255,255,${l.time/20})`;
                ctx.fillRect(0, l.y, COLS, 1);
                l.time--;
                return true;
            }
            return false;
        });

        drawGridBlock(ctx, arena, { x: 0, y: 0 });
        drawProjectionGhostBlock();
        drawGridBlock(ctx, player.matrix, player.pos);
        updateParticles(); // Draw particles

        ctx.restore();
    }

    function renderAuxiliaryCanvases() {
        nextCtx.fillStyle = "rgba(0, 0, 0, 0)";
        nextCtx.clearRect(0, 0, 6, 6);
        if (player.nextMatrix) {
            const xOffset = (5 - player.nextMatrix[0].length) / 2;
            const yOffset = (5 - player.nextMatrix.length) / 2;
            drawGridBlock(nextCtx, player.nextMatrix, { x: xOffset, y: yOffset });
        }

        holdCtx.fillStyle = "rgba(0, 0, 0, 0)";
        holdCtx.clearRect(0, 0, 6, 6);
        if (player.holdMatrix) {
            const xOffset = (5 - player.holdMatrix[0].length) / 2;
            const yOffset = (5 - player.holdMatrix.length) / 2;
            drawGridBlock(holdCtx, player.holdMatrix, { x: xOffset, y: yOffset });
        }
    }

    function updateUserInterfaceDOM() {
        document.getElementById("scoreDisplay").innerText = player.score.toLocaleString('en-US', { minimumIntegerDigits: 6, useGrouping: false });
        document.getElementById("linesDisplay").innerText = player.lines;
        document.getElementById("levelDisplay").innerText = player.level;
        
        // NEW: Update high score display if exists
        const highEl = document.getElementById("highScoreDisplay");
        if(highEl) highEl.innerText = highScore.toLocaleString();
    }

    // ==========================================================================
    // 11. REFRESH RATE CONTROLLER LOOP
    // ==========================================================================
    function processEngineLoopFrame(timestamp = 0) {
        if (isPaused) return;

        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        dropCounter += deltaTime;

        if (dropCounter >= dropInterval) {
            executeTickDrop();
        }

        drawCoreFrames();
        animationFrameId = requestAnimationFrame(processEngineLoopFrame);
    }

    // ==========================================================================
    // 12. HARDWARE KEYBOARD INPUT MAPS
    // ==========================================================================
    const keyMapTable = {
        ArrowLeft: () => { 
            player.pos.x--; 
            if (checkCollision(arena, player)) player.pos.x++; 
            else { playSoundEffect('move'); addButtonFeedback('btn-move-left'); }
        },
        ArrowRight: () => { 
            player.pos.x++; 
            if (checkCollision(arena, player)) player.pos.x--; 
            else { playSoundEffect('move'); addButtonFeedback('btn-move-right'); }
        },
        ArrowDown: () => { executeTickDrop(); playSoundEffect('move'); addButtonFeedback('btn-soft'); },
        ArrowUp: () => { executePlayerRotation(); },
        Space: () => { executeInstantHardDrop(); },
        KeyC: () => { swapHeldPiece(); },
        Escape: () => { togglePauseState(); }
    };

    document.addEventListener("keydown", event => {
        const action = keyMapTable[event.code] || keyMapTable[event.key];
        if (action) {
            event.preventDefault(); 
            initAudioContext();
            action();
            drawCoreFrames();
        }
    });

    // ==========================================================================
    // 13. ON-SCREEN CLICK/TOUCH INPUT CONTROLS HOOKS
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

    // NEW: Sound toggle button
    const muteBtn = document.getElementById("muteBtn");
    if(muteBtn) {
        muteBtn.onclick = () => {
            soundEnabled = !soundEnabled;
            muteBtn.innerHTML = soundEnabled 
                ? '<i data-lucide="volume-2" aria-hidden="true"></i> SOUND' 
                : '<i data-lucide="volume-x" aria-hidden="true"></i> MUTED';
            if(window.lucide) lucide.createIcons();
        };
    }

    // ==========================================================================
    // 14. STATE CONTROLS & INITIALIZATION
    // ==========================================================================
    function togglePauseState() {
        isPaused = !isPaused;
        const statusOverlay = document.getElementById("gameStatus");
        
        if (isPaused) {
            statusOverlay.classList.remove("hidden");
            statusOverlay.querySelector('.overlay-text').innerText = "PAUSED";
            cancelAnimationFrame(animationFrameId);
        } else {
            statusOverlay.classList.add("hidden");
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(processEngineLoopFrame);
        }
    }

    document.getElementById("startBtn").onclick = () => {
        initAudioContext();
        if (isPaused) {
            if (!player.matrix) {
                cycleActivePlayerPieces();
            }
            togglePauseState();
        }
    };

    document.getElementById("pauseBtn").onclick = () => {
        initAudioContext();
        if (!isPaused || document.getElementById("gameStatus").querySelector('.overlay-text').innerText === "PAUSED") {
            togglePauseState();
        }
    };

    document.getElementById("resetGameBtn").onclick = () => {
        initAudioContext();
        resetEngineMetrics();
        cycleActivePlayerPieces();
        togglePauseState();
    };

    resetEngineMetrics();

})();