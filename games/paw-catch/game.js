const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

let score = 0;
let gameRunning = false;
let paw = { x: 200, y: 200, size: 30, vx: 3, vy: 3 };

function drawPaw() {
    ctx.fillStyle = '#ff6b6b';
    // Main pad
    ctx.beginPath();
    ctx.ellipse(paw.x, paw.y, paw.size, paw.size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Toes
    for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(paw.x + i * 15, paw.y - 25, 8, 12, i * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function update() {
    if (!gameRunning) return;
    paw.x += paw.vx;
    paw.y += paw.vy;
    
    if (paw.x < paw.size || paw.x > canvas.width - paw.size) paw.vx *= -1;
    if (paw.y < paw.size || paw.y > canvas.height - paw.size) paw.vy *= -1;
    
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stars
    ctx.fillStyle = '#ffd93d';
    for (let i = 0; i < 20; i++) {
        const sx = (i * 73) % canvas.width;
        const sy = (i * 47) % canvas.height;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawPaw();
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const dist = Math.sqrt((mx - paw.x) ** 2 + (my - paw.y) ** 2);
    
    if (!gameRunning) {
        gameRunning = true;
        update();
        document.getElementById('instructions').textContent = 'Click on the paw to score!';
    } else if (dist < paw.size + 10) {
        score += 10;
        scoreEl.textContent = `Score: ${score}`;
        paw.vx *= 1.1;
        paw.vy *= 1.1;
        // Move paw randomly
        paw.x = Math.random() * (canvas.width - 60) + 30;
        paw.y = Math.random() * (canvas.height - 60) + 30;
    }
});

// Initial draw
draw();
