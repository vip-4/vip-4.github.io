(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const COLOR = '#535353';
  const COLOR_LIGHT = '#a0a0a0';
  const PIXEL = 2;
  const GROUND_Y = 240;

  // ------------ Pixel sprites ------------
  // 'X' = заполненный пиксель, '.' = пустой
  // Размер 1 «пикселя» спрайта в реальных пикселях = PIXEL (2)

  // Лошадь — 21 строка × 26 столбцов → 42×52 px на канве
  // Кадр A (бег, передняя нога вперёд, задняя назад)
  const HORSE_RUN_A = [
    '..........................',
    '.......................XXX',
    '......................XXXX',
    '.......................XXX',
    '.X.....................XXXX',
    '.XX...................XXXXX',
    '.XXX................XXXXX..',
    '.XXXX..............XXXXX...',
    '..XXXX.........XXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXX.....',
    '....XXXXXXXXXXXXXXXXX......',
    '....XXXXXXXXXXXXXXXXX......',
    '.....XX..XX....XX..XX......',
    '.....XX..XX....XX..XX......',
    '......X..X......X..XX......',
    '......X..X......X..X.......',
    '......X..X......X..X.......',
    '......X..X......X..X.......',
    '.....XX..X......X..X.......',
    '....XXX..XX....XX..XXX.....',
  ];

  // Кадр B (бег, ноги по-другому)
  const HORSE_RUN_B = [
    '..........................',
    '.......................XXX',
    '......................XXXX',
    '.......................XXX',
    '.X.....................XXXX',
    '.XX...................XXXXX',
    '.XXX................XXXXX..',
    '.XXXX..............XXXXX...',
    '..XXXX.........XXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXX.....',
    '....XXXXXXXXXXXXXXXXX......',
    '....XXXXXXXXXXXXXXXXX......',
    '.....XX..X......X..XX......',
    '......X..X......X..XX......',
    '......X..XX....XX..X.......',
    '......X..XX....XX..X.......',
    '.....XX...X....X...X.......',
    '....XXX...X....X...XX......',
    '...XXX....X....X...XXX.....',
    '...XX.....XX..XX....XX.....',
  ];

  // Прыжок — ноги поджаты, тело вытянуто
  const HORSE_JUMP = [
    '..........................',
    '.......................XXX',
    '......................XXXX',
    '.......................XXX',
    '.X.....................XXXX',
    '.XX...................XXXXX',
    '.XXX................XXXXX..',
    '.XXXX..............XXXXX...',
    '..XXXX.........XXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXX.....',
    '....XXXXXXXXXXXXXXXXX......',
    '....XXXXXXXXXXXXXXXXX......',
    '.....XXXX...XX...XXXX......',
    '......XXX..XXXX..XXX.......',
    '.......XXXXX..XXXXX........',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
  ];

  // Лошадь упала — X в глазу
  const HORSE_DEAD = [
    '..........................',
    '.......................XXX',
    '......................X.XX',
    '.......................X.X',
    '.X.....................XXXX',
    '.XX...................XXXXX',
    '.XXX................XXXXX..',
    '.XXXX..............XXXXX...',
    '..XXXX.........XXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXX.....',
    '....XXXXXXXXXXXXXXXXX......',
    '....XXXXXXXXXXXXXXXXX......',
    '.....XX..XX....XX..XX......',
    '.....XX..XX....XX..XX......',
    '......X..X......X..XX......',
    '......X..X......X..X.......',
    '......X..X......X..X.......',
    '......X..X......X..X.......',
    '.....XX..X......X..X.......',
    '....XXX..XX....XX..XXX.....',
  ];

  // Приседающая лошадь — корпус низкий, голова и шея вытянуты вперёд
  // Та же ширина 26 столбцов, но «контент» в нижней части
  const HORSE_DUCK_A = [
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '.X.....................XXX',
    '.XX...................XXXX',
    '.XXX.................XXXX.',
    '.XXXX..............XXXXX..',
    '..XXXXXXXXXXXXXXXXXXXXX...',
    '..XXXXXXXXXXXXXXXXXXXXX...',
    '...XXXXXXXXXXXXXXXXXXX....',
    '....XX..XX....XX..XX......',
    '....X...X......X...X......',
    '....X...X......X...X......',
    '...XX...X......X...XX.....',
    '...XX...XX....XX...XX.....',
  ];

  const HORSE_DUCK_B = [
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '.X.....................XXX',
    '.XX...................XXXX',
    '.XXX.................XXXX.',
    '.XXXX..............XXXXX..',
    '..XXXXXXXXXXXXXXXXXXXXX...',
    '..XXXXXXXXXXXXXXXXXXXXX...',
    '...XXXXXXXXXXXXXXXXXXX....',
    '....X...X......X...X......',
    '....X...XX....XX...X......',
    '...XX...XX....XX...XX.....',
    '..XXX....X....X....XXX....',
    '..XX.....XX..XX.....XX....',
  ];

  // Барьер маленький — стойка + 2 перекладины (12×14 px на маске → 24×28 px)
  const BARRIER_S = [
    '..XX....XX..',
    '..XX....XX..',
    '..XX....XX..',
    'XXXXXXXXXXXX',
    'XXXXXXXXXXXX',
    '..XX....XX..',
    '..XX....XX..',
    '..XX....XX..',
    'XXXXXXXXXXXX',
    'XXXXXXXXXXXX',
    '..XX....XX..',
    '..XX....XX..',
    '..XX....XX..',
    '..XX....XX..',
  ];

  // Барьер большой — выше, 3 перекладины (14×18 px → 28×36 px)
  const BARRIER_L = [
    '..XX......XX..',
    '..XX......XX..',
    'XXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXX',
    '..XX......XX..',
    '..XX......XX..',
    'XXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXX',
    '..XX......XX..',
    '..XX......XX..',
    '..XX......XX..',
    'XXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXX',
    '..XX......XX..',
    '..XX......XX..',
    '..XX......XX..',
    '..XX......XX..',
    '..XX......XX..',
  ];

  // Птица — два кадра, 18×10 на маске → 36×20 px
  const BIRD_A = [ // крылья вверх
    '...X..............',
    '...XX.............',
    '...XXX............',
    '...XXXX..XXXXX....',
    'XXXXXXXXXXXXXXXX..',
    '.XXXXXXXXXXXXX....',
    '...XXXXXXXX.......',
    '.....XXXX.........',
    '......X...........',
    '..................',
  ];

  const BIRD_B = [ // крылья вниз
    '..................',
    '..................',
    '........XXXX......',
    '.....XXXXXXXXX....',
    'XXXXXXXXXXXXXXXX..',
    'XXXXXXXXXXXXX.....',
    '..XXXXXXXXX.......',
    '..XXXXXXX.........',
    '...XXXX...........',
    '.....X............',
  ];

  // Облако — 14×6
  const CLOUD = [
    '....XXXXX.....',
    '..XXXXXXXXXX..',
    '.XXXXXXXXXXXX.',
    'XXXXXXXXXXXXXX',
    '.XXXXXXXXXXXX.',
    '...XXXXXXXX...',
  ];

  function drawPixels(mask, x, y, scale = PIXEL) {
    for (let r = 0; r < mask.length; r++) {
      const row = mask[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === 'X') {
          ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
        }
      }
    }
  }

  // ------------ Game state ------------
  const STATE = { INTRO: 0, PLAY: 1, OVER: 2 };
  let state = STATE.INTRO;

  let score = 0;
  let hi = parseInt(localStorage.getItem('horseRunnerHi') || '0', 10);
  let isNewRecord = false;

  let speed = 6;
  const SPEED_START = 6;
  const SPEED_MAX = 13;
  const SPEED_ACCEL = 0.0012;

  const GRAVITY = 0.62;
  const JUMP_V = -11.5;
  const JUMP_HOLD_BONUS = -0.35;

  // Размеры лошади в px (стоящей) — берём из маски HORSE_RUN_A
  const HORSE_W = 26 * PIXEL; // 52
  const HORSE_H = 21 * PIXEL; // 42

  const horse = {
    x: 60,
    y: GROUND_Y - HORSE_H,
    vy: 0,
    grounded: true,
    ducking: false,
    frame: 0,
    holdingJump: false,
  };

  let obstacles = [];
  let clouds = [];
  let groundDecor = []; // случайные «штрихи» земли
  let groundOffset = 0;
  let frameCounter = 0;
  let spawnTimer = 80;
  let scoreSubcounter = 0;
  let flashTimer = 0;

  // Декорации земли — генерируем массив случайных штрихов
  for (let i = 0; i < 100; i++) {
    groundDecor.push({
      x: Math.random() * W * 2,
      offsetY: Math.random() < 0.5 ? 6 : 12,
      width: 4 + Math.floor(Math.random() * 8),
    });
  }

  // Облака — стартовая россыпь
  for (let i = 0; i < 3; i++) {
    clouds.push({
      x: Math.random() * W,
      y: 30 + Math.random() * 80,
      speed: 0.5 + Math.random() * 0.6,
    });
  }

  // ------------ Spawning ------------
  function spawnObstacle() {
    const r = Math.random();
    let o;
    if (r < 0.50) {
      // Маленький барьер
      const w = BARRIER_S[0].length * PIXEL;
      const h = BARRIER_S.length * PIXEL;
      o = { type: 'barrier_s', x: W + 10, y: GROUND_Y - h, w, h };
    } else if (r < 0.72) {
      // Большой барьер
      const w = BARRIER_L[0].length * PIXEL;
      const h = BARRIER_L.length * PIXEL;
      o = { type: 'barrier_l', x: W + 10, y: GROUND_Y - h, w, h };
    } else if (r < 0.88) {
      // Низкая птица (на уровне корпуса — перепрыгивать)
      const w = BIRD_A[0].length * PIXEL;
      const h = BIRD_A.length * PIXEL;
      o = { type: 'bird_low', x: W + 10, y: GROUND_Y - 28, w, h, frame: 0 };
    } else {
      // Высокая птица (на уровне головы — присесть)
      const w = BIRD_A[0].length * PIXEL;
      const h = BIRD_A.length * PIXEL;
      o = { type: 'bird_high', x: W + 10, y: GROUND_Y - HORSE_H + 2, w, h, frame: 0 };
    }
    obstacles.push(o);
  }

  function spawnCloud() {
    clouds.push({
      x: W + 20,
      y: 20 + Math.random() * 100,
      speed: 0.5 + Math.random() * 0.6,
    });
  }

  // ------------ Input ------------
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;

    if (state === STATE.INTRO) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        startGame();
      }
      return;
    }
    if (state === STATE.OVER) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        reset();
        startGame();
      }
      return;
    }
    // PLAY
    if ((e.code === 'Space' || e.code === 'ArrowUp') && horse.grounded) {
      horse.vy = JUMP_V;
      horse.grounded = false;
      horse.holdingJump = true;
      horse.ducking = false;
    }
    if (e.code === 'ArrowDown') {
      horse.ducking = true;
      if (!horse.grounded) {
        horse.vy = Math.max(horse.vy + 4, 6);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      horse.holdingJump = false;
    }
    if (e.code === 'ArrowDown') {
      horse.ducking = false;
    }
  });

  function startGame() {
    state = STATE.PLAY;
  }

  function reset() {
    score = 0;
    speed = SPEED_START;
    obstacles = [];
    horse.y = GROUND_Y - HORSE_H;
    horse.vy = 0;
    horse.grounded = true;
    horse.ducking = false;
    horse.frame = 0;
    frameCounter = 0;
    spawnTimer = 80;
    flashTimer = 0;
    isNewRecord = false;
  }

  // ------------ Update ------------
  function update() {
    if (state !== STATE.PLAY) return;

    frameCounter++;

    // Скорость мира растёт
    speed = Math.min(SPEED_MAX, SPEED_START + frameCounter * SPEED_ACCEL);

    // Счёт
    scoreSubcounter++;
    if (scoreSubcounter >= 6) {
      scoreSubcounter = 0;
      score++;
      if (score > 0 && score % 100 === 0) {
        flashTimer = 24;
      }
    }
    if (flashTimer > 0) flashTimer--;

    // Физика лошади
    if (horse.holdingJump && horse.vy < 0 && horse.vy > -14) {
      horse.vy += JUMP_HOLD_BONUS;
    }
    horse.vy += GRAVITY;
    horse.y += horse.vy;
    if (horse.y >= GROUND_Y - HORSE_H) {
      horse.y = GROUND_Y - HORSE_H;
      horse.vy = 0;
      horse.grounded = true;
    }

    // Анимация бега
    if (horse.grounded && frameCounter % 6 === 0) {
      horse.frame = 1 - horse.frame;
    }

    // Скролл земли
    groundOffset = (groundOffset + speed) % (W * 2);

    // Спавн препятствий
    spawnTimer--;
    if (spawnTimer <= 0) {
      const last = obstacles[obstacles.length - 1];
      const minGap = 220 + Math.random() * 120;
      if (!last || (W - last.x) > minGap) {
        spawnObstacle();
      }
      // Интервал уменьшается с ростом скорости
      const base = 80 * (SPEED_START / speed);
      spawnTimer = Math.floor(base + Math.random() * 60);
    }

    // Облака
    if (Math.random() < 0.004 && clouds.length < 4) {
      spawnCloud();
    }

    // Двигаем препятствия
    for (const o of obstacles) {
      o.x -= speed;
      if (o.type.startsWith('bird') && frameCounter % 8 === 0) {
        o.frame = 1 - o.frame;
      }
    }
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // Двигаем облака
    for (const c of clouds) c.x -= c.speed;
    clouds = clouds.filter(c => c.x + 14 * PIXEL > 0);

    // Коллизии
    const hb = horseHitbox();
    for (const o of obstacles) {
      const ob = obstacleHitbox(o);
      if (aabb(hb, ob)) {
        gameOver();
        break;
      }
    }
  }

  function gameOver() {
    state = STATE.OVER;
    if (score > hi) {
      hi = score;
      localStorage.setItem('horseRunnerHi', hi.toString());
      isNewRecord = true;
    }
  }

  function horseHitbox() {
    if (horse.ducking && horse.grounded) {
      // присев — узкий hitbox в нижней части
      return {
        x: horse.x + 8,
        y: horse.y + 18 * PIXEL,
        w: HORSE_W - 16,
        h: 3 * PIXEL,
      };
    }
    // обычный — корпус и шея, с inset
    return {
      x: horse.x + 6,
      y: horse.y + 4 * PIXEL,
      w: HORSE_W - 14,
      h: HORSE_H - 6 * PIXEL,
    };
  }

  function obstacleHitbox(o) {
    // Маленький inset для всех — иначе кажется нечестным
    const inset = 4;
    return {
      x: o.x + inset,
      y: o.y + inset,
      w: o.w - inset * 2,
      h: o.h - inset * 2,
    };
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ------------ Render ------------
  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLOR;

    // Облака (светло-серые)
    ctx.fillStyle = COLOR_LIGHT;
    for (const c of clouds) {
      drawPixels(CLOUD, c.x, c.y);
    }

    // Земля — основная линия
    ctx.fillStyle = COLOR;
    ctx.fillRect(0, GROUND_Y, W, 2);

    // Земля — декорации, движутся со скоростью мира
    for (const d of groundDecor) {
      const x = ((d.x - groundOffset) % (W * 2) + W * 2) % (W * 2);
      if (x < W) {
        ctx.fillRect(x, GROUND_Y + d.offsetY, d.width, 2);
      }
    }

    // Препятствия
    for (const o of obstacles) {
      if (o.type === 'barrier_s') {
        drawPixels(BARRIER_S, o.x, o.y);
      } else if (o.type === 'barrier_l') {
        drawPixels(BARRIER_L, o.x, o.y);
      } else {
        const mask = (o.frame === 0) ? BIRD_A : BIRD_B;
        drawPixels(mask, o.x, o.y);
      }
    }

    // Лошадь
    let horseMask;
    if (state === STATE.OVER) {
      horseMask = HORSE_DEAD;
    } else if (!horse.grounded) {
      horseMask = HORSE_JUMP;
    } else if (horse.ducking && state === STATE.PLAY) {
      horseMask = (horse.frame === 0) ? HORSE_DUCK_A : HORSE_DUCK_B;
    } else if (state === STATE.PLAY) {
      horseMask = (horse.frame === 0) ? HORSE_RUN_A : HORSE_RUN_B;
    } else {
      horseMask = HORSE_RUN_A;
    }
    drawPixels(horseMask, horse.x, horse.y);

    // Счёт
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = COLOR;
    ctx.textAlign = 'right';
    const scoreStr = String(score).padStart(5, '0');
    const hiStr = 'HI ' + String(hi).padStart(5, '0');
    // HI мигает на каждой круглой сотне
    const blink = flashTimer > 0 && Math.floor(flashTimer / 4) % 2 === 0;
    if (!blink && hi > 0) ctx.fillText(hiStr, W - 110, 36);
    ctx.fillText(scoreStr, W - 20, 36);
    ctx.textAlign = 'left';

    // Оверлеи
    if (state === STATE.INTRO) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillText('PRESS  SPACE  TO  START', W / 2, 130);
      ctx.textAlign = 'left';
    }
    if (state === STATE.OVER) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 26px "Courier New", monospace';
      ctx.fillText('G A M E   O V E R', W / 2, 110);
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText('Press SPACE to restart', W / 2, 140);
      if (isNewRecord) {
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillText('★ NEW RECORD ★', W / 2, 166);
      }
      ctx.textAlign = 'left';
    }
  }

  // ------------ Main loop ------------
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }
  loop();
})();
