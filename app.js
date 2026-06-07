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
    // update mobile header (if present)
    const mS = document.getElementById('mobileScore');
    const mL = document.getElementById('mobileLines');
    const mV = document.getElementById('mobileLevel');
    if(mS) mS.textContent = score;
    if(mL) mL.textContent = lines;
    if(mV) mV.textContent = level;
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

// --- Mobile touch controls wiring ---
function safeMoveLeft(){
    if(!gameRunning || paused || gameOver) return;
    currentPiece.x--;
    if(collision(currentPiece.shape, currentPiece.x, currentPiece.y)) currentPiece.x++;
}
function safeMoveRight(){
    if(!gameRunning || paused || gameOver) return;
    currentPiece.x++;
    if(collision(currentPiece.shape, currentPiece.x, currentPiece.y)) currentPiece.x--;
}
function safeRotate(){
    if(!gameRunning || paused || gameOver) return;
    rotate();
}
function safeSoft(){
    if(!gameRunning || paused || gameOver) return;
    moveDown();
}
function safeHard(){
    if(!gameRunning || paused || gameOver) return;
    // drop until collision
    while(!collision(currentPiece.shape, currentPiece.x, currentPiece.y+1)){
        currentPiece.y++;
    }
    merge();
}

function addRepeatHold(el, action, interval=120){
    let id = null;
    const start = (e)=>{ e.preventDefault(); action(); id = setInterval(action, interval); };
    const end = ()=>{ if(id) clearInterval(id); id = null; };
    el.addEventListener('pointerdown', start);
    window.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
}

const tcLeft = document.getElementById('tc-left');
const tcRight = document.getElementById('tc-right');
const tcRotate = document.getElementById('tc-rotate');
const tcSoft = document.getElementById('tc-soft');
const tcHard = document.getElementById('tc-hard');
if(tcLeft) addRepeatHold(tcLeft, safeMoveLeft, 120);
if(tcRight) addRepeatHold(tcRight, safeMoveRight, 120);
if(tcRotate) tcRotate.addEventListener('click', safeRotate);
if(tcSoft) addRepeatHold(tcSoft, safeSoft, 120);
if(tcHard) tcHard.addEventListener('click', safeHard);

// THEME: initialize from localStorage and manage button state
function setThemeButton(isLight){
    const btn = document.getElementById('themeBtn');
    if(!btn) return;
    btn.setAttribute('aria-pressed', !!isLight);
    const icon = btn.querySelector('.theme-icon');
    if(icon) icon.textContent = isLight ? '☀️' : '🌙';
}

// (i18n removed — interface uses English only)

(function initTheme(){
    let saved = null;
    try{ saved = localStorage.getItem('tetris-theme'); }catch(e){}
    const preferLight = saved === 'light';
    if(preferLight) document.body.classList.add('light');
    setThemeButton(preferLight);
})();