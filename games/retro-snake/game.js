// === RETRO SNAKE - Game Engine ===
(function () {
  "use strict";

  // --- Configuration ---
  const CELL = 20;
  const GRID_W = 25;
  const GRID_H = 25;
  const BASE_SPEED = 130; // ms per tick at level 1
  const SPEED_DECREASE = 8; // ms faster per level
  const MIN_SPEED = 50;
  const POINTS_PER_FOOD = 10;
  const POINTS_PER_BONUS = 30;
  const LEVEL_UP_SCORE = 50;
  const BONUS_CHANCE = 0.15;
  const BONUS_LIFETIME = 80; // ticks
  const PARTICLE_COUNT = 12;

  // --- Colors ---
  const COLORS = {
    bg: "#0a0a0a",
    grid: "#0d1a0d",
    snakeHead: "#39ff14",
    snakeBody: "#2ecc0e",
    snakeBodyAlt: "#25a30b",
    snakeOutline: "#0a3d0a",
    food: "#ff3939",
    foodGlow: "rgba(255, 57, 57, 0.3)",
    bonus: "#ffcc00",
    bonusGlow: "rgba(255, 204, 0, 0.3)",
    particle: "#39ff14",
    eyes: "#000",
    wall: "#1a3a1a",
  };

  // --- Audio (procedural, no files needed) ---
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new AudioCtx();
      } catch (e) {
        // Audio not supported
      }
    }
  }

  function playSound(type) {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === "eat") {
        osc.type = "square";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "bonus") {
        osc.type = "square";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "die") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "levelup") {
        osc.type = "square";
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Graceful fail
    }
  }

  // --- DOM ---
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlaySubtitle = document.getElementById("overlay-subtitle");
  const overlayMobile = document.getElementById("overlay-mobile");
  const startBtn = document.getElementById("start-btn");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const levelEl = document.getElementById("level");
  const finalScore = document.getElementById("final-score");
  const finalScoreValue = document.getElementById("final-score-value");

  // --- Sizing ---
  function resize() {
    const maxW = Math.min(window.innerWidth - 40, 500);
    const maxH = Math.min(window.innerHeight - 260, 500);
    const size = Math.min(maxW, maxH);
    const cellSize = Math.floor(size / GRID_W);
    canvas.width = cellSize * GRID_W;
    canvas.height = cellSize * GRID_H;
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    return cellSize;
  }

  let cellPx = resize();
  window.addEventListener("resize", function () {
    cellPx = resize();
    if (!running) draw();
  });

  // --- Game State ---
  let snake, dir, nextDir, food, bonus, bonusTimer;
  let score, level, highScore, speed;
  let running, gameOver, tickTimer;
  let particles, floatingTexts;
  let tick;

  highScore = parseInt(localStorage.getItem("retroSnakeHigh") || "0", 10);
  highScoreEl.textContent = highScore;

  function init() {
    const cx = Math.floor(GRID_W / 2);
    const cy = Math.floor(GRID_H / 2);
    snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    level = 1;
    speed = BASE_SPEED;
    food = null;
    bonus = null;
    bonusTimer = 0;
    particles = [];
    floatingTexts = [];
    tick = 0;
    running = false;
    gameOver = false;
    scoreEl.textContent = "0";
    levelEl.textContent = "1";
    spawnFood();
  }

  // --- Spawning ---
  function getOccupied() {
    const set = new Set();
    for (const s of snake) set.add(s.x + "," + s.y);
    if (food) set.add(food.x + "," + food.y);
    if (bonus) set.add(bonus.x + "," + bonus.y);
    return set;
  }

  function spawnFood() {
    const occ = getOccupied();
    let tries = 0;
    do {
      food = {
        x: Math.floor(Math.random() * GRID_W),
        y: Math.floor(Math.random() * GRID_H),
      };
      tries++;
    } while (occ.has(food.x + "," + food.y) && tries < 500);
  }

  function spawnBonus() {
    if (bonus) return;
    const occ = getOccupied();
    let tries = 0;
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_W),
        y: Math.floor(Math.random() * GRID_H),
      };
      tries++;
    } while (occ.has(pos.x + "," + pos.y) && tries < 500);
    bonus = pos;
    bonusTimer = BONUS_LIFETIME;
  }

  // --- Particles ---
  function emitParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      particles.push({
        x: (x + 0.5) * cellPx,
        y: (y + 0.5) * cellPx,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        color: color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  function addFloatingText(x, y, text, color) {
    floatingTexts.push({
      x: (x + 0.5) * cellPx,
      y: (y + 0.5) * cellPx,
      text: text,
      color: color,
      life: 1,
      decay: 0.025,
    });
  }

  // --- Update ---
  function update() {
    tick++;
    dir = { ...nextDir };

    // Move
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision
    if (head.x < 0 || head.x >= GRID_W || head.y < 0 || head.y >= GRID_H) {
      die();
      return;
    }

    // Self collision
    for (const seg of snake) {
      if (seg.x === head.x && seg.y === head.y) {
        die();
        return;
      }
    }

    snake.unshift(head);

    // Eat food
    let ate = false;
    if (food && head.x === food.x && head.y === food.y) {
      score += POINTS_PER_FOOD;
      ate = true;
      playSound("eat");
      emitParticles(food.x, food.y, COLORS.food, PARTICLE_COUNT);
      addFloatingText(food.x, food.y, "+" + POINTS_PER_FOOD, COLORS.food);
      spawnFood();

      // Maybe spawn bonus
      if (!bonus && Math.random() < BONUS_CHANCE) {
        spawnBonus();
      }

      // Level up
      const newLevel = Math.floor(score / LEVEL_UP_SCORE) + 1;
      if (newLevel > level) {
        level = newLevel;
        levelEl.textContent = level;
        speed = Math.max(MIN_SPEED, BASE_SPEED - (level - 1) * SPEED_DECREASE);
        playSound("levelup");
      }
    }

    // Eat bonus
    if (bonus && head.x === bonus.x && head.y === bonus.y) {
      score += POINTS_PER_BONUS;
      ate = true;
      playSound("bonus");
      emitParticles(bonus.x, bonus.y, COLORS.bonus, PARTICLE_COUNT * 2);
      addFloatingText(bonus.x, bonus.y, "+" + POINTS_PER_BONUS, COLORS.bonus);
      bonus = null;
      bonusTimer = 0;
    }

    if (!ate) {
      snake.pop();
    }

    // Bonus timer
    if (bonus) {
      bonusTimer--;
      if (bonusTimer <= 0) {
        bonus = null;
      }
    }

    scoreEl.textContent = score;

    // Update particles
    particles = particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= p.decay;
      return p.life > 0;
    });

    // Update floating texts
    floatingTexts = floatingTexts.filter((ft) => {
      ft.y -= 0.8;
      ft.life -= ft.decay;
      return ft.life > 0;
    });
  }

  function die() {
    running = false;
    gameOver = true;
    playSound("die");
    emitParticles(snake[0].x, snake[0].y, COLORS.snakeHead, 30);

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("retroSnakeHigh", highScore.toString());
      highScoreEl.textContent = highScore;
    }

    // Show game over after a short delay
    setTimeout(function () {
      overlayTitle.textContent = "GAME OVER";
      overlaySubtitle.textContent = "Press any key or tap to restart";
      overlayMobile.textContent = "";
      startBtn.textContent = "PLAY AGAIN";
      finalScore.classList.remove("hidden");
      finalScoreValue.textContent = score;
      overlay.classList.add("visible");
    }, 600);
  }

  // --- Drawing ---
  function draw() {
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Grid dots
    ctx.fillStyle = COLORS.grid;
    for (let x = 0; x < GRID_W; x++) {
      for (let y = 0; y < GRID_H; y++) {
        ctx.fillRect(x * cellPx + cellPx / 2, y * cellPx + cellPx / 2, 1, 1);
      }
    }

    // Bonus (draw before snake)
    if (bonus) {
      const bx = bonus.x * cellPx;
      const by = bonus.y * cellPx;
      const pulse = 0.8 + Math.sin(tick * 0.2) * 0.2;

      // Glow
      ctx.save();
      ctx.shadowColor = COLORS.bonusGlow;
      ctx.shadowBlur = 15;
      ctx.fillStyle = COLORS.bonus;
      ctx.globalAlpha = pulse;

      // Star shape
      drawStar(bx + cellPx / 2, by + cellPx / 2, cellPx * 0.4, 5);
      ctx.restore();

      // Timer bar
      if (bonusTimer > 0) {
        const pct = bonusTimer / BONUS_LIFETIME;
        ctx.fillStyle =
          pct > 0.3 ? COLORS.bonus : "rgba(255, 57, 57, 0.8)";
        ctx.fillRect(bx + 2, by + cellPx - 3, (cellPx - 4) * pct, 2);
      }
    }

    // Food
    if (food) {
      const fx = food.x * cellPx;
      const fy = food.y * cellPx;
      const pulse = 0.85 + Math.sin(tick * 0.15) * 0.15;

      // Glow
      ctx.save();
      ctx.shadowColor = COLORS.foodGlow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = COLORS.food;
      ctx.globalAlpha = pulse;
      const r = cellPx * 0.35;
      ctx.beginPath();
      ctx.arc(fx + cellPx / 2, fy + cellPx / 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner highlight
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.arc(fx + cellPx * 0.42, fy + cellPx * 0.38, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snake
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const sx = seg.x * cellPx;
      const sy = seg.y * cellPx;
      const isHead = i === 0;
      const pad = 1;

      if (isHead) {
        // Head - brighter, with glow
        ctx.save();
        ctx.shadowColor = COLORS.snakeHead;
        ctx.shadowBlur = 8;
        ctx.fillStyle = COLORS.snakeHead;
        roundRect(ctx, sx + pad, sy + pad, cellPx - pad * 2, cellPx - pad * 2, 4);
        ctx.fill();
        ctx.restore();

        // Eyes
        const eyeSize = Math.max(2, cellPx * 0.15);
        const eyeOff = cellPx * 0.25;
        ctx.fillStyle = COLORS.eyes;

        let ex1, ey1, ex2, ey2;
        if (dir.x === 1) {
          ex1 = sx + cellPx * 0.65; ey1 = sy + cellPx * 0.3;
          ex2 = sx + cellPx * 0.65; ey2 = sy + cellPx * 0.7;
        } else if (dir.x === -1) {
          ex1 = sx + cellPx * 0.35; ey1 = sy + cellPx * 0.3;
          ex2 = sx + cellPx * 0.35; ey2 = sy + cellPx * 0.7;
        } else if (dir.y === -1) {
          ex1 = sx + cellPx * 0.3; ey1 = sy + cellPx * 0.35;
          ex2 = sx + cellPx * 0.7; ey2 = sy + cellPx * 0.35;
        } else {
          ex1 = sx + cellPx * 0.3; ey1 = sy + cellPx * 0.65;
          ex2 = sx + cellPx * 0.7; ey2 = sy + cellPx * 0.65;
        }

        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body segments - alternate colors
        const t = i / snake.length;
        ctx.fillStyle = i % 2 === 0 ? COLORS.snakeBody : COLORS.snakeBodyAlt;
        ctx.globalAlpha = 1 - t * 0.3;
        roundRect(ctx, sx + pad, sy + pad, cellPx - pad * 2, cellPx - pad * 2, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Particles
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Floating texts
    for (const ft of floatingTexts) {
      ctx.globalAlpha = ft.life;
      ctx.fillStyle = ft.color;
      ctx.font = Math.max(8, cellPx * 0.6) + "px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // Border flash on level up
    if (tick > 0 && score > 0 && score % LEVEL_UP_SCORE === 0) {
      ctx.save();
      ctx.strokeStyle = COLORS.snakeHead;
      ctx.lineWidth = 3;
      ctx.shadowColor = COLORS.snakeHead;
      ctx.shadowBlur = 15;
      ctx.strokeRect(1, 1, w - 2, h - 2);
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawStar(cx, cy, r, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI * i) / points - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const x = cx + Math.cos(angle) * rad;
      const y = cy + Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // --- Game Loop ---
  function gameLoop() {
    if (!running) return;
    update();
    draw();
    tickTimer = setTimeout(gameLoop, speed);
  }

  function startGame() {
    initAudio();
    init();
    overlay.classList.remove("visible");
    finalScore.classList.add("hidden");
    running = true;
    gameLoop();
  }

  // --- Input ---
  function setDirection(nx, ny) {
    // Prevent 180 degree turns
    if (dir.x === -nx && dir.y === -ny) return;
    if (nx !== 0 || ny !== 0) {
      nextDir = { x: nx, y: ny };
    }
  }

  document.addEventListener("keydown", function (e) {
    if (gameOver && !running) {
      if (overlay.classList.contains("visible")) {
        startGame();
        return;
      }
    }

    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        e.preventDefault();
        setDirection(0, -1);
        break;
      case "ArrowDown":
      case "s":
      case "S":
        e.preventDefault();
        setDirection(0, 1);
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        e.preventDefault();
        setDirection(-1, 0);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        e.preventDefault();
        setDirection(1, 0);
        break;
    }
  });

  // Start button
  startBtn.addEventListener("click", function () {
    startGame();
  });

  // Mobile buttons
  document.getElementById("btn-up").addEventListener("click", function () {
    setDirection(0, -1);
  });
  document.getElementById("btn-down").addEventListener("click", function () {
    setDirection(0, 1);
  });
  document.getElementById("btn-left").addEventListener("click", function () {
    setDirection(-1, 0);
  });
  document.getElementById("btn-right").addEventListener("click", function () {
    setDirection(1, 0);
  });

  // Touch swipe
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener("touchstart", function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener("touchend", function (e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 20) return; // Too small

    if (absDx > absDy) {
      setDirection(dx > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, dy > 0 ? 1 : -1);
    }
  }, { passive: true });

  // --- Initial Draw ---
  init();
  draw();
})();
