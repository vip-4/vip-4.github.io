const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.setAttribute('tabindex', '0');

canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;
const assetVersion = '20260213g';

const background = new Sprite({
    position: { x: 0, y: 0 },
    imageSrc: `./assets/images/background.png?v=${assetVersion}`,
    scale: 1.5 // Adjust based on image size, assume huge
});

// Configure Fighter 1 (Karate)
const player = new Fighter({
    position: { x: 100, y: 0 },
    velocity: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    imageSrc: `./assets/images/fighter1.png?v=${assetVersion}`,
    framesMax: 7,
    framesRows: 8,
    imageCols: 8,
    scale: 2.5,
    offset: { x: 215, y: 157 },
    sprites: {
        idle: { frameY: 0, framesMax: 4 },
        run: { frameY: 1, framesMax: 7 },
        attack1: { frameY: 2, framesMax: 3 },
        jump: { frameY: 4, framesMax: 3 },
        fall: { frameY: 4, framesMax: 3 },
        takeHit: { frameY: 5, framesMax: 3 },
        death: { frameY: 6, framesMax: 1 }
    },
    attackBox: {
        offset: { x: 100, y: 50 },
        width: 160,
        height: 50
    }
});

// Configure Fighter 2 (Street)
const enemy = new Fighter({
    position: { x: 800, y: 0 },
    velocity: { x: 0, y: 0 },
    color: 'blue',
    offset: { x: -50, y: 0 },
    imageSrc: `./assets/images/fighter2.png?v=${assetVersion}`,
    framesMax: 7,
    framesRows: 8,
    imageCols: 8,
    scale: 2.5,
    offset: { x: 215, y: 167 },
    sprites: {
        idle: { frameY: 0, framesMax: 4 },
        run: { frameY: 1, framesMax: 7 },
        attack1: { frameY: 2, framesMax: 3 },
        jump: { frameY: 4, framesMax: 3 },
        fall: { frameY: 4, framesMax: 3 },
        takeHit: { frameY: 5, framesMax: 3 },
        death: { frameY: 6, framesMax: 1 }
    },
    attackBox: {
        offset: { x: -170, y: 50 },
        width: 170,
        height: 50
    }
});

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowLeft: { pressed: false }
};

let timer = 60;
let timerId;
const startScreen = document.querySelector('#start-screen');
const startButton = document.querySelector('#start-button');
const startError = document.querySelector('#start-error');
const player1Input = document.querySelector('#player1-input');
const player2Input = document.querySelector('#player2-input');
const playerNameLabel = document.querySelector('#player-name-label');
const enemyNameLabel = document.querySelector('#enemy-name-label');
const musicToggle = document.querySelector('#music-toggle');
const playerScoreLabel = document.querySelector('#player-score');
const enemyScoreLabel = document.querySelector('#enemy-score');
const roundIndicator = document.querySelector('#round-indicator');
const comboAnnouncer = document.querySelector('#combo-announcer');
const displayText = document.querySelector('#display-text');
const winnerText = document.querySelector('#winner-text');
const restartButton = document.querySelector('#restart-button');

let audioCtx;
let masterGain;
let sfxGain;
let musicTimerId;
let musicStarted = false;
let musicEnabled = true;
let playerAirborne = false;
let enemyAirborne = false;
let roundResolved = false;
let roundNumber = 1;
let playerRoundsWon = 0;
let enemyRoundsWon = 0;
let playerCombo = 0;
let enemyCombo = 0;
let comboHideTimeout;
let hitStopFrames = 0;
let shakeFrames = 0;
let shakePower = 0;
const hitParticles = [];
const stars = Array.from({ length: 70 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * (canvas.height * 0.75),
    speed: 0.15 + Math.random() * 0.45,
    size: 1 + Math.random() * 2,
    twinkle: Math.random() * Math.PI * 2
}));

function ensureAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        sfxGain = audioCtx.createGain();
        masterGain.gain.value = 0.08;
        sfxGain.gain.value = 0.24;
        masterGain.connect(audioCtx.destination);
        sfxGain.connect(audioCtx.destination);
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSfx({
    frequency = 220,
    duration = 0.12,
    type = 'square',
    volume = 0.12,
    sweepTo,
    noise = false
}) {
    ensureAudioContext();
    const now = audioCtx.currentTime;

    if (noise) {
        const bufferSize = Math.floor(audioCtx.sampleRate * duration);
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const source = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        source.buffer = noiseBuffer;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        source.connect(gain);
        gain.connect(sfxGain);
        source.start(now);
        source.stop(now + duration);
        return;
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (sweepTo) {
        osc.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + duration);
}

function playTone({ frequency, startTime, duration, type, volume }) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
}

function startMusic() {
    ensureAudioContext();
    if (musicStarted) return;

    musicStarted = true;
    const melody = [261.63, 329.63, 392.0, 329.63, 440.0, 392.0, 329.63, 293.66];
    let step = 0;

    musicTimerId = setInterval(() => {
        if (!musicEnabled) return;

        const now = audioCtx.currentTime;
        const note = melody[step % melody.length];
        const bass = melody[(step + 2) % melody.length] / 2;

        playTone({
            frequency: note,
            startTime: now,
            duration: 0.18,
            type: 'square',
            volume: 0.075
        });

        playTone({
            frequency: bass,
            startTime: now,
            duration: 0.2,
            type: 'triangle',
            volume: 0.05
        });

        step++;
    }, 220);
}

function setMusicEnabled(enabled) {
    musicEnabled = enabled;
    musicToggle.textContent = enabled ? 'Music: ON' : 'Music: OFF';
    if (masterGain) {
        masterGain.gain.value = enabled ? 0.08 : 0;
    }
    if (sfxGain) {
        sfxGain.gain.value = enabled ? 0.24 : 0;
    }
}

function normalizePlayerName(value, fallback) {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    return trimmed.slice(0, 12);
}

function forceResetFighterState(fighter, x, facing, lastKey) {
    fighter.position.x = x;
    fighter.position.y = 0;
    fighter.velocity.x = 0;
    fighter.velocity.y = 0;
    fighter.health = 100;
    fighter.dead = false;
    fighter.isAttacking = false;
    fighter.currentSprite = 'idle';
    fighter.frameY = fighter.sprites.idle.frameY;
    fighter.framesMax = fighter.sprites.idle.framesMax;
    fighter.framesCurrent = 0;
    fighter.framesElapsed = 0;
    fighter.lastKey = lastKey;
    fighter.setFacing(facing);
}

function resolveFighterCollision() {
    const pLeft = player.position.x;
    const pRight = player.position.x + player.width;
    const eLeft = enemy.position.x;
    const eRight = enemy.position.x + enemy.width;

    const verticalOverlap =
        player.position.y < enemy.position.y + enemy.height &&
        player.position.y + player.height > enemy.position.y;

    if (!verticalOverlap) return;
    if (pRight <= eLeft || eRight <= pLeft) return;

    const overlap = Math.min(pRight - eLeft, eRight - pLeft);
    const separation = overlap / 2 + 0.5;

    if (pLeft < eLeft) {
        player.position.x -= separation;
        enemy.position.x += separation;
    } else {
        player.position.x += separation;
        enemy.position.x -= separation;
    }

    player.position.x = Math.max(0, Math.min(canvas.width - player.width, player.position.x));
    enemy.position.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.position.x));
}

function updateHud() {
    playerScoreLabel.textContent = `Rounds: ${playerRoundsWon}`;
    enemyScoreLabel.textContent = `Rounds: ${enemyRoundsWon}`;
    roundIndicator.textContent = `ROUND ${roundNumber}`;
}

function showCombo(ownerName, count) {
    if (count < 2) return;
    comboAnnouncer.textContent = `${ownerName} ${count} HIT COMBO!`;
    if (comboHideTimeout) clearTimeout(comboHideTimeout);
    comboHideTimeout = setTimeout(() => {
        comboAnnouncer.textContent = '';
    }, 700);
}

function spawnHitParticles(target) {
    const originX = target.position.x + target.width / 2;
    const originY = target.position.y + target.height / 2;
    for (let i = 0; i < 14; i++) {
        hitParticles.push({
            x: originX,
            y: originY,
            vx: (Math.random() - 0.5) * 7,
            vy: -1 - Math.random() * 5,
            life: 18 + Math.floor(Math.random() * 10),
            size: 2 + Math.random() * 4,
            color: Math.random() > 0.5 ? '#ffd24a' : '#ff6138'
        });
    }
}

function updateAndDrawParticles() {
    for (let i = hitParticles.length - 1; i >= 0; i--) {
        const p = hitParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.life -= 1;
        c.globalAlpha = Math.max(0, p.life / 24);
        c.fillStyle = p.color;
        c.fillRect(p.x, p.y, p.size, p.size);
        c.globalAlpha = 1;
        if (p.life <= 0) hitParticles.splice(i, 1);
    }
}

function drawDynamicBackdrop() {
    // Animated stars on top of the stage art for depth.
    for (const star of stars) {
        star.x -= star.speed;
        if (star.x < -2) star.x = canvas.width + 2;
        star.twinkle += 0.08;
        const alpha = 0.35 + ((Math.sin(star.twinkle) + 1) * 0.25);
        c.globalAlpha = alpha;
        c.fillStyle = '#f8f7ff';
        c.fillRect(star.x, star.y, star.size, star.size);
    }
    c.globalAlpha = 1;

    // Neon sweep beam to make the scene feel alive.
    const beamX = ((Date.now() * 0.06) % (canvas.width + 250)) - 250;
    const beamGradient = c.createLinearGradient(beamX, 0, beamX + 220, 0);
    beamGradient.addColorStop(0, 'rgba(255, 120, 80, 0)');
    beamGradient.addColorStop(0.5, 'rgba(255, 120, 80, 0.12)');
    beamGradient.addColorStop(1, 'rgba(255, 120, 80, 0)');
    c.fillStyle = beamGradient;
    c.fillRect(0, 0, canvas.width, canvas.height);
}

function determineWinner({ player, enemy, timerId }) {
    if (roundResolved) return;
    roundResolved = true;
    clearTimeout(timerId);
    playSfx({ frequency: 680, sweepTo: 220, duration: 0.3, type: 'sawtooth', volume: 0.18 });
    displayText.style.display = 'flex';
    document.querySelector('#ui-layer').style.pointerEvents = 'auto';
    gameStarted = false;

    let roundWinner = 'Tie';
    if (player.health === enemy.health) {
        roundWinner = 'Tie';
    } else if (player.health > enemy.health) {
        playerRoundsWon++;
        roundWinner = `${playerNameLabel.textContent} Wins`;
    } else if (player.health < enemy.health) {
        enemyRoundsWon++;
        roundWinner = `${enemyNameLabel.textContent} Wins`;
    }

    updateHud();
    winnerText.innerHTML = roundWinner;

    const isMatchOver = playerRoundsWon === 2 || enemyRoundsWon === 2;
    restartButton.style.display = isMatchOver ? 'inline-block' : 'none';
    restartButton.textContent = isMatchOver ? 'NEW MATCH' : 'RESTART';

    if (!isMatchOver) {
        roundNumber++;
        updateHud();
        setTimeout(() => {
            winnerText.innerHTML = `ROUND ${roundNumber}`;
        }, 900);

        setTimeout(() => {
            displayText.style.display = 'none';
            document.querySelector('#ui-layer').style.pointerEvents = 'none';
            initGame();
        }, 1700);
    } else {
        setTimeout(() => {
            winnerText.innerHTML = playerRoundsWon > enemyRoundsWon
                ? `${playerNameLabel.textContent} WINS THE MATCH`
                : `${enemyNameLabel.textContent} WINS THE MATCH`;
        }, 900);
    }
}

function decreaseTimer() {
    if (timer > 0) {
        timerId = setTimeout(decreaseTimer, 1000);
        timer--;
        document.querySelector('#timer').innerHTML = timer;
    }

    if (timer === 0) {
        determineWinner({ player, enemy, timerId });
    }
}

let gameStarted = false;

function initGame() {
    clearTimeout(timerId); // Prevent multiple timer loops
    forceResetFighterState(player, 100, 'right', 'd');
    forceResetFighterState(enemy, 800, 'left', 'ArrowLeft');
    keys.a.pressed = false;
    keys.d.pressed = false;
    keys.ArrowRight.pressed = false;
    keys.ArrowLeft.pressed = false;
    playerAirborne = false;
    enemyAirborne = false;
    playerCombo = 0;
    enemyCombo = 0;
    roundResolved = false;
    hitStopFrames = 0;
    shakeFrames = 0;
    comboAnnouncer.textContent = '';
    hitParticles.length = 0;

    // Reset Health Bars
    if (typeof gsap !== 'undefined') {
        gsap.to('#player-health-bar', { width: '100%' });
        gsap.to('#enemy-health-bar', { width: '100%' });
    } else {
        document.querySelector('#player-health-bar').style.width = '100%';
        document.querySelector('#enemy-health-bar').style.width = '100%';
    }

    timer = 60;
    document.querySelector('#timer').innerHTML = timer;
    displayText.style.display = 'none';
    document.querySelector('#ui-layer').style.pointerEvents = 'none'; // Re-disable to let game input through

    gameStarted = true;
    decreaseTimer();
    updateHud();
    comboAnnouncer.textContent = `ROUND ${roundNumber} - FIGHT!`;
    setTimeout(() => {
        if (comboAnnouncer.textContent === `ROUND ${roundNumber} - FIGHT!`) {
            comboAnnouncer.textContent = '';
        }
    }, 900);
}

function startGameFromLogin() {
    const playerOneName = normalizePlayerName(player1Input.value, 'Player 1');
    const playerTwoName = normalizePlayerName(player2Input.value, 'Player 2');

    if (playerOneName.toLowerCase() === playerTwoName.toLowerCase()) {
        startError.textContent = 'Choose different player names.';
        return;
    }

    startError.textContent = '';
    playSfx({ frequency: 760, sweepTo: 420, duration: 0.07, type: 'square', volume: 0.13 });
    playerNameLabel.textContent = playerOneName;
    enemyNameLabel.textContent = playerTwoName;
    startScreen.style.display = 'none';
    canvas.focus();
    startMusic();
    roundNumber = 1;
    playerRoundsWon = 0;
    enemyRoundsWon = 0;
    updateHud();
    initGame();
}

startButton.addEventListener('click', startGameFromLogin);

player1Input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') startGameFromLogin();
});

player2Input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') startGameFromLogin();
});

restartButton.addEventListener('click', () => {
    playSfx({ frequency: 600, sweepTo: 300, duration: 0.08, type: 'triangle', volume: 0.12 });
    roundNumber = 1;
    playerRoundsWon = 0;
    enemyRoundsWon = 0;
    updateHud();
    canvas.focus();
    initGame();
});

musicToggle.addEventListener('click', () => {
    ensureAudioContext();
    playSfx({ frequency: 480, sweepTo: 380, duration: 0.06, type: 'square', volume: 0.08 });
    setMusicEnabled(!musicEnabled);
    canvas.focus();
});

canvas.addEventListener('click', () => {
    canvas.focus();
});

function animate() {
    window.requestAnimationFrame(animate);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    let shakeX = 0;
    let shakeY = 0;
    if (shakeFrames > 0) {
        shakeX = (Math.random() - 0.5) * shakePower;
        shakeY = (Math.random() - 0.5) * shakePower;
        shakeFrames--;
    }

    c.save();
    c.translate(shakeX, shakeY);
    background.update();
    drawDynamicBackdrop();

    if (hitStopFrames > 0) {
        player.draw();
        enemy.draw();
        updateAndDrawParticles();
        hitStopFrames--;
        c.restore();
        return;
    }

    player.update();
    enemy.update();
    resolveFighterCollision();

    // Player Movement
    player.velocity.x = 0;
    if (keys.a.pressed && player.lastKey === 'a') {
        player.setFacing('left');
        player.switchSprite('run');
        player.velocity.x = -5;
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.setFacing('right');
        player.switchSprite('run');
        player.velocity.x = 5;
    } else {
        player.switchSprite('idle');
    }

    if (player.velocity.y < 0) {
        playerAirborne = true;
        player.switchSprite('jump');
    } else if (player.velocity.y > 0) {
        playerAirborne = true;
        player.switchSprite('fall');
    } else if (playerAirborne) {
        playSfx({ frequency: 120, sweepTo: 80, duration: 0.09, type: 'triangle', volume: 0.11 });
        playerAirborne = false;
    }

    // Enemy Movement
    enemy.velocity.x = 0;
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
        enemy.setFacing('left');
        enemy.switchSprite('run');
        enemy.velocity.x = -5;
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
        enemy.setFacing('right');
        enemy.switchSprite('run');
        enemy.velocity.x = 5;
    } else {
        enemy.switchSprite('idle');
    }

    if (enemy.velocity.y < 0) {
        enemyAirborne = true;
        enemy.switchSprite('jump');
    } else if (enemy.velocity.y > 0) {
        enemyAirborne = true;
        enemy.switchSprite('fall');
    } else if (enemyAirborne) {
        playSfx({ frequency: 120, sweepTo: 80, duration: 0.09, type: 'triangle', volume: 0.11 });
        enemyAirborne = false;
    }

    // Detect Collision & Enemy gets hit
    if (
        rectangularCollision({ rectangle1: player, rectangle2: enemy }) &&
        player.isAttacking &&
        player.framesCurrent === 0 // Hit on specific frame? Let's say frame 1
    ) {
        enemy.takeHit();
        playSfx({ noise: true, duration: 0.09, volume: 0.11 });
        playSfx({ frequency: 180, sweepTo: 90, duration: 0.07, type: 'sawtooth', volume: 0.09 });
        spawnHitParticles(enemy);
        hitStopFrames = 4;
        shakeFrames = 8;
        shakePower = 9;
        playerCombo += 1;
        enemyCombo = 0;
        showCombo(playerNameLabel.textContent, playerCombo);
        player.isAttacking = false;

        // CSS Update
        if (typeof gsap !== 'undefined') {
            gsap.to('#enemy-health-bar', {
                width: enemy.health + '%'
            });
        } else {
            document.querySelector('#enemy-health-bar').style.width = enemy.health + '%';
        }
    }

    // If player misses
    if (player.isAttacking && player.framesCurrent === 2) { // Reset at end of animation if not hit? No, just flag
        player.isAttacking = false;
        playerCombo = 0;
    }

    // Detect Collision & Player gets hit
    if (
        rectangularCollision({ rectangle1: enemy, rectangle2: player }) &&
        enemy.isAttacking &&
        enemy.framesCurrent === 0
    ) {
        player.takeHit();
        playSfx({ noise: true, duration: 0.09, volume: 0.11 });
        playSfx({ frequency: 180, sweepTo: 90, duration: 0.07, type: 'sawtooth', volume: 0.09 });
        spawnHitParticles(player);
        hitStopFrames = 4;
        shakeFrames = 8;
        shakePower = 9;
        enemyCombo += 1;
        playerCombo = 0;
        showCombo(enemyNameLabel.textContent, enemyCombo);
        enemy.isAttacking = false;

        if (typeof gsap !== 'undefined') {
            gsap.to('#player-health-bar', {
                width: player.health + '%'
            });
        } else {
            document.querySelector('#player-health-bar').style.width = player.health + '%';
        }
    }

    if (enemy.isAttacking && enemy.framesCurrent === 2) {
        enemy.isAttacking = false;
        enemyCombo = 0;
    }

    updateAndDrawParticles();

    // End Game Logic
    if (enemy.health <= 0 || player.health <= 0) {
        determineWinner({ player, enemy, timerId });
    }

    c.restore();
}

animate();

window.addEventListener('keydown', (event) => {
    if (gameStarted && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
    }

    if (!gameStarted) return;
    ensureAudioContext();

    if (!player.dead) {
        switch (event.code) {
            case 'KeyD':
                keys.d.pressed = true;
                player.lastKey = 'd';
                player.setFacing('right');
                break;
            case 'KeyA':
                keys.a.pressed = true;
                player.lastKey = 'a';
                player.setFacing('left');
                break;
            case 'KeyW':
                player.velocity.y = -20;
                playSfx({ frequency: 220, sweepTo: 460, duration: 0.1, type: 'square', volume: 0.09 });
                break;
            case 'Space':
                player.attack();
                playSfx({ frequency: 520, sweepTo: 180, duration: 0.08, type: 'square', volume: 0.08 });
                break;
        }
    }

    if (!enemy.dead) {
        switch (event.code) {
            case 'ArrowRight':
                keys.ArrowRight.pressed = true;
                enemy.lastKey = 'ArrowRight';
                enemy.setFacing('right');
                break;
            case 'ArrowLeft':
                keys.ArrowLeft.pressed = true;
                enemy.lastKey = 'ArrowLeft';
                enemy.setFacing('left');
                break;
            case 'ArrowUp':
                enemy.velocity.y = -20;
                playSfx({ frequency: 220, sweepTo: 460, duration: 0.1, type: 'square', volume: 0.09 });
                break;
            case 'ArrowDown':
                enemy.attack();
                playSfx({ frequency: 520, sweepTo: 180, duration: 0.08, type: 'square', volume: 0.08 });
                break;
        }
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyD':
            keys.d.pressed = false;
            break;
        case 'KeyA':
            keys.a.pressed = false;
            break;
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
    }
});

window.addEventListener('blur', () => {
    keys.a.pressed = false;
    keys.d.pressed = false;
    keys.ArrowRight.pressed = false;
    keys.ArrowLeft.pressed = false;
});
