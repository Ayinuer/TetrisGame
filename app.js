const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const holdCanvas = document.getElementById("hold");
const holdCtx = holdCanvas.getContext("2d");
const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const overlay = document.getElementById("overlay");
const BLOCK = 30;
const ROWS = 20;
const COLS = 10;
let board = [];
let currentPiece;
let nextPiece;
let holdPiece = null;
let canHold = true;
let score = 0;
let lines = 0;
let level = 1;
let gameRunning = false;
let paused = false;
let gameOver = false;
let dropInterval = 500;
let lastTime = 0;
let dropCounter = 0;
const PIECES = [
{
shape:[[1,1,1,1]],
color:"#6fffe9"
},
{
shape:[[1,1],[1,1]],
color:"#ffd166"
},
{
shape:[[0,1,0],[1,1,1]],
color:"#ff6b6b"
},
{
shape:[[1,0,0],[1,1,1]],
color:"#c77dff"
},
{
shape:[[0,0,1],[1,1,1]],
color:"#80ed99"
},
{
shape:[[0,1,1],[1,1,0]],
color:"#ff99c8"
},
{
shape:[[1,1,0],[0,1,1]],
color:"#90dbf4"
}
];
function createBoard(){
    board =
    Array.from(
        {length:ROWS},
        ()=>Array(COLS).fill(0)
    );
}
function randomPiece(){
    const p =
    PIECES[
        Math.floor(Math.random()*PIECES.length)
    ];
    return{
        shape:p.shape.map(r=>[...r]),
        color:p.color,
        x:3,
        y:0
    };
}
function drawCell(x,y,color,alpha=1){
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(
        x*BLOCK,
        y*BLOCK,
        BLOCK-1,
        BLOCK-1
    );
    ctx.fillStyle =
    "rgba(255,255,255,0.25)";
    ctx.fillRect(
        x*BLOCK+3,
        y*BLOCK+3,
        BLOCK-7,
        BLOCK-7
    );
    ctx.globalAlpha = 1;
}
function draw(){
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
    for(let y=0;y<ROWS;y++){
        for(let x=0;x<COLS;x++){
            if(board[y][x]){
                drawCell(
                    x,
                    y,
                    board[y][x]
                );
            }else{
                ctx.fillStyle =
                "rgba(255,255,255,0.04)";
                ctx.fillRect(
                    x*BLOCK,
                    y*BLOCK,
                    BLOCK-1,
                    BLOCK-1
                );
            }
        }
    }
    drawGhost();
    drawPiece(currentPiece);
}
function drawPiece(piece){
    piece.shape.forEach((row,y)=>{
        row.forEach((value,x)=>{
            if(value){
                drawCell(
                    piece.x+x,
                    piece.y+y,
                    piece.color
                );
            }
        });
    });
}
function drawGhost(){
    let ghostY = currentPiece.y;
    while(
        !collision(
            currentPiece.shape,
            currentPiece.x,
            ghostY+1
        )
    ){
        ghostY++;
    }
    currentPiece.shape.forEach((row,y)=>{
        row.forEach((value,x)=>{
            if(value){
                drawCell(
                    currentPiece.x+x,
                    ghostY+y,
                    "#ffffff",
                    0.15
                );
            }
        });
    });
}
function collision(shape,x,y){
    for(let r=0;r<shape.length;r++){
        for(let c=0;c<shape[r].length;c++){
            if(shape[r][c]){
                let newX = x+c;
                let newY = y+r;
                if(
                    newX<0 ||
                    newX>=COLS ||
                    newY>=ROWS
                ){
                    return true;
                }
                if(
                    newY>=0 &&
                    board[newY][newX]
                ){
                    return true;
                }
            }
        }
    }
    return false;
}
function merge(){
    currentPiece.shape.forEach((row,y)=>{
        row.forEach((value,x)=>{
            if(value){
                board[
                    currentPiece.y+y
                ][
                    currentPiece.x+x
                ] = currentPiece.color;
            }
        });
    });
    clearLines();
    currentPiece = nextPiece;
    nextPiece = randomPiece();
    drawMini(nextCtx,nextPiece);
    // allow hold again once a new piece is active
    canHold = true;
    if(
        collision(
            currentPiece.shape,
            currentPiece.x,
            currentPiece.y
        )
    ){
        endGame();
    }
}
function clearLines(){
    let cleared = 0;
    board = board.filter(row=>{
        if(row.every(cell=>cell)){
            cleared++;
            return false;
        }
        return true;
    });
    while(board.length<ROWS){
        board.unshift(
            Array(COLS).fill(0)
        );
    }
    if(cleared){
        score += cleared*100;
        lines += cleared;
        level =
        Math.floor(lines/10)+1;
        dropInterval =
        Math.max(
            120,
            500-(level*30)
        );
        updateUI();
    }
}
function updateUI(){
    scoreEl.textContent = score;
    linesEl.textContent = lines;
    levelEl.textContent = level;
}
function moveDown(){
    currentPiece.y++;
    if(
        collision(
            currentPiece.shape,
            currentPiece.x,
            currentPiece.y
        )
    ){
        currentPiece.y--;
        merge();
    }
    dropCounter = 0;
}
function rotate(){
    const rotated =
    currentPiece.shape[0].map(
        (_,i)=>
        currentPiece.shape.map(
            row=>row[i]
        ).reverse()
    );
    if(
        !collision(
            rotated,
            currentPiece.x,
            currentPiece.y
        )
    ){
        currentPiece.shape = rotated;
    }
}
function drawMini(context,piece){
    context.clearRect(0,0,120,120);
    if(!piece) return;
    piece.shape.forEach((row,y)=>{
        row.forEach((value,x)=>{
            if(value){
                context.fillStyle = piece.color;
                context.fillRect(x*25+20,y*25+20,22,22);
            }
        });
    });
}
function update(time=0){
    if(!gameRunning || paused || gameOver){
        requestAnimationFrame(update);
        return;
    }
    const delta = time-lastTime;
    lastTime = time;
    dropCounter += delta;
    if(dropCounter > dropInterval){
        moveDown();
    }
    draw();
    requestAnimationFrame(update);
}
function startGame(){
    createBoard();
    score = 0;
    lines = 0;
    level = 1;
    updateUI();
    gameRunning = true;
    paused = false;
    gameOver = false;
    overlay.classList.add("hidden");
    currentPiece = randomPiece();
    nextPiece = randomPiece();
    drawMini(nextCtx,nextPiece);
    update();
}
function endGame(){
    gameOver = true;
    overlay.classList.remove("hidden");
}
document.addEventListener("keydown",e=>{
    if(!gameRunning || paused || gameOver){
        return;
    }
    switch(e.key){
        case "ArrowLeft":
        currentPiece.x--;
        if(
            collision(
                currentPiece.shape,
                currentPiece.x,
                currentPiece.y
            )
        ){
            currentPiece.x++;
        }
        break;
        case "ArrowRight":
        currentPiece.x++;
        if(
            collision(
                currentPiece.shape,
                currentPiece.x,
                currentPiece.y
            )
        ){
            currentPiece.x--;
        }
        break;
        case "ArrowDown":
        moveDown();
        break;
        case "ArrowUp":
        rotate();
        break;
    }
});
document
.getElementById("startBtn")
.onclick = ()=>{
    startGame();
};
document
.getElementById("pauseBtn")
.onclick = ()=>{
    paused = !paused;
};
document
.getElementById("resetBtn")
.onclick = ()=>{
    startGame();
};
// Hold / Save mood button
const holdBtn = document.getElementById('holdBtn');
if(holdBtn){
    holdBtn.onclick = ()=>{
        if(!gameRunning || paused || gameOver) return;
        if(!canHold) return;
        if(!holdPiece){
            holdPiece = { shape: currentPiece.shape.map(r=>[...r]), color: currentPiece.color };
            currentPiece = nextPiece;
            nextPiece = randomPiece();
        } else {
            const tmp = { shape: currentPiece.shape.map(r=>[...r]), color: currentPiece.color };
            currentPiece = { shape: holdPiece.shape.map(r=>[...r]), color: holdPiece.color, x:3, y:0 };
            holdPiece = tmp;
        }
        drawMini(holdCtx, holdPiece);
        drawMini(nextCtx, nextPiece);
        canHold = false;
    };
}
document
.getElementById("themeBtn")
.onclick = ()=>{
    // toggle theme and persist
    const isLight = document.body.classList.toggle("light");
    setThemeButton(isLight);
    try{ localStorage.setItem('tetris-theme','' + (isLight? 'light' : 'dark')); }catch(e){}
};
document
.getElementById("restartBtn")
.onclick = ()=>{
    startGame();
};
startGame();

// THEME: initialize from localStorage and manage button state
function setThemeButton(isLight){
    const btn = document.getElementById('themeBtn');
    if(!btn) return;
    btn.setAttribute('aria-pressed', !!isLight);
    const icon = btn.querySelector('.theme-icon');
    if(icon) icon.textContent = isLight ? '☀️' : '🌙';
}

// SIMPLE I18N
const i18n = {
        en: {
                holdBtn: '🤗 Hold',
                themeText: 'Theme',
                howtoSummary: 'How to play ▸',
                howtoBody: `
<p>Welcome! Stack shapes to clear rows and keep the board tidy.</p>
<h4>Controls</h4>
<ul>
    <li><strong>← / →</strong> — Move piece left / right</li>
    <li><strong>↑</strong> — Rotate piece</li>
    <li><strong>↓</strong> — Soft drop</li>
    <li><strong>Space</strong> / Hard drop — Drop piece fast</li>
    <li><strong>Hold</strong> — Save the current piece for later</li>
    <li><strong>Start / Pause / Reset</strong> — Control the game</li>
</ul>
<h4>Scoring & Tips</h4>
<ul>
    <li>Clear rows to score points — multi-row clears give bigger bonuses.</li>
    <li>Use Hold to save a helpful piece for a tricky gap.</li>
    <li>Watch the <em>Next</em> preview to plan ahead.</li>
</ul>
<p class="micro-copy">Tip: Keep your stack even and avoid tall spires.</p>
                `
        },
        es: {
                holdBtn: '🤗 Guardar',
                themeText: 'Tema',
                howtoSummary: 'Cómo jugar ▸',
                howtoBody: `
<p>¡Bienvenido! Apila las piezas para borrar filas y mantener el tablero limpio.</p>
<h4>Controles</h4>
<ul>
    <li><strong>← / →</strong> — Mover pieza izquierda / derecha</li>
    <li><strong>↑</strong> — Rotar pieza</li>
    <li><strong>↓</strong> — Caída suave</li>
    <li><strong>Space</strong> / Caída rápida — Soltar pieza rápidamente</li>
    <li><strong>Hold</strong> — Guarda la pieza actual para después</li>
    <li><strong>Start / Pause / Reset</strong> — Controla el juego</li>
</ul>
<h4>Puntuación & Consejos</h4>
<ul>
    <li>Borra filas para puntuar — borrar varias filas a la vez da más bonificación.</li>
    <li>Usa Hold para reservar una pieza útil.</li>
    <li>Mira la vista previa <em>Next</em> para planificar.</li>
</ul>
<p class="micro-copy">Consejo: Mantén la pila pareja y evita picos altos.</p>
                `
        }
};

function applyTranslations(lang){
        const dict = i18n[lang] || i18n.en;
        document.querySelectorAll('[data-i18n-key]').forEach(el=>{
                const key = el.getAttribute('data-i18n-key');
                if(!key) return;
                if(key in dict) el.innerHTML = dict[key];
        });
}

// language selector
const langSelect = document.getElementById('langSelect');
if(langSelect){
        // init
        let savedLang = 'en';
        try{ const s = localStorage.getItem('tetris-lang'); if(s) savedLang = s }catch(e){}
        langSelect.value = savedLang;
        applyTranslations(savedLang);
        langSelect.addEventListener('change', ()=>{
                const v = langSelect.value || 'en';
                try{ localStorage.setItem('tetris-lang', v) }catch(e){}
                applyTranslations(v);
        });
}

(function initTheme(){
    let saved = null;
    try{ saved = localStorage.getItem('tetris-theme'); }catch(e){}
    const preferLight = saved === 'light';
    if(preferLight) document.body.classList.add('light');
    setThemeButton(preferLight);
})();