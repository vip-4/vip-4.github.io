(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreElement = document.querySelector("#score");
  const highScoreElement = document.querySelector("#highScore");
  const livesElement = document.querySelector("#lives");
  const overlay = document.querySelector("#overlay");
  const overlayTitle = document.querySelector("#overlayTitle");
  const overlayText = document.querySelector("#overlayText");
  const startButton = document.querySelector("#startButton");
  const soundButton = document.querySelector("#soundButton");
  const statusElement = document.querySelector("#status");
  const joystick = document.querySelector("#joystick");
  const joystickKnob = document.querySelector("#joystickKnob");

  const TILE = 24;
  const TAU = Math.PI * 2;
  const BASE_MAZE = [
    "#####################",
    "#o........#........o#",
    "#.###.###.#.###.###.#",
    "#.....#...#...#.....#",
    "###.#.#.#####.#.#.###",
    "#...#.#...#...#.#...#",
    "#.###.###.#.###.###.#",
    "#.........#.........#",
    "#.###.#.#####.#.###.#",
    "#.....#...#...#.....#",
    "#####.###...###.#####",
    "#####.#.......#.#####",
    "#####.#.##G##.#.#####",
    "#.......#...#.......#",
    "#####.#.#####.#.#####",
    "#####.#.......#.#####",
    "#####.#.#####.#.#####",
    "#.........#.........#",
    "#.###.###.#.###.###.#",
    "#o..#.....K.....#..o#",
    "##.#.#.#######.#.#.##",
    "#....#....#....#....#",
    "#.######.#.#.######.#",
    "#...................#",
    "#####################"
  ];

  const ROWS = BASE_MAZE.length;
  const COLS = BASE_MAZE[0].length;
  const WIDTH = COLS * TILE;
  const HEIGHT = ROWS * TILE;

  const DIRECTIONS = {
    up: { x: 0, y: -1, angle: -Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI / 2 },
    left: { x: -1, y: 0, angle: Math.PI },
    right: { x: 1, y: 0, angle: 0 }
  };
  const DIRECTION_NAMES = Object.keys(DIRECTIONS);

  const GHOST_SPECS = [
    { name: "Byte", color: "#ff466d", col: 10, row: 12, delay: 0.2, personality: "chase" },
    { name: "Patch", color: "#ff7ce8", col: 9, row: 11, delay: 1.7, personality: "ambush" },
    { name: "Cache", color: "#42e9ff", col: 11, row: 11, delay: 3.2, personality: "corner" },
    { name: "Null", color: "#ff9f35", col: 10, row: 13, delay: 4.6, personality: "shy" }
  ];

  let maze = [];
  let player;
  let ghosts = [];
  let pelletsLeft = 0;
  let score = 0;
  let lives = 3;
  let highScore = Number(localStorage.getItem("kuga-man-high-score") || 0);
  let state = "ready";
  let queuedDirection = null;
  let frightenedTimer = 0;
  let ghostCombo = 0;
  let invulnerableTimer = 0;
  let gameTime = 0;
  let lastTimestamp = 0;
  let chompPitch = false;
  let audioContext = null;
  let muted = false;
  let swipeStart = null;
  let joystickPointerId = null;
  let joystickDirection = null;

  function prepareCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(WIDTH * ratio);
    canvas.height = Math.round(HEIGHT * ratio);
    canvas.style.aspectRatio = `${WIDTH} / ${HEIGHT}`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  function parseMaze() {
    let playerStart = { col: 10, row: 19 };
    maze = BASE_MAZE.map((line, row) => [...line].map((cell, col) => {
      if (cell === "K") {
        playerStart = { col, row };
        return " ";
      }
      if (cell === "G") return " ";
      return cell;
    }));
    pelletsLeft = maze.flat().filter((cell) => cell === "." || cell === "o").length;
    return playerStart;
  }

  function createEntity(col, row, speed) {
    return { col, row, startCol: col, startRow: row, speed, direction: null, progress: 0 };
  }

  function resetPositions() {
    player.col = player.startCol;
    player.row = player.startRow;
    player.direction = null;
    player.progress = 0;
    queuedDirection = null;

    ghosts.forEach((ghost) => {
      ghost.col = ghost.startCol;
      ghost.row = ghost.startRow;
      ghost.direction = null;
      ghost.progress = 0;
    });
    invulnerableTimer = 1.8;
  }

  function resetGame() {
    const start = parseMaze();
    player = createEntity(start.col, start.row, 7.2);
    ghosts = GHOST_SPECS.map((spec) => ({
      ...createEntity(spec.col, spec.row, 4.2),
      ...spec,
      releaseAt: spec.delay
    }));
    score = 0;
    lives = 3;
    frightenedTimer = 0;
    ghostCombo = 0;
    invulnerableTimer = 0;
    gameTime = 0;
    updateHud();
  }

  function isWall(col, row) {
    return row < 0 || row >= ROWS || col < 0 || col >= COLS || maze[row][col] === "#";
  }

  function canMove(entity, directionName) {
    if (!directionName) return false;
    const direction = DIRECTIONS[directionName];
    return !isWall(entity.col + direction.x, entity.row + direction.y);
  }

  function opposite(directionName) {
    return { up: "down", down: "up", left: "right", right: "left" }[directionName] || null;
  }

  function entityPosition(entity) {
    const direction = DIRECTIONS[entity.direction] || { x: 0, y: 0 };
    return {
      x: entity.col + 0.5 + direction.x * entity.progress,
      y: entity.row + 0.5 + direction.y * entity.progress
    };
  }

  function choosePlayerDirection(entity) {
    if (queuedDirection && canMove(entity, queuedDirection)) {
      entity.direction = queuedDirection;
      queuedDirection = null;
    }
    if (canMove(entity, entity.direction)) return entity.direction;
    entity.direction = null;
    return null;
  }

  function ghostTarget(ghost) {
    const position = entityPosition(player);
    const playerDirection = DIRECTIONS[player.direction] || DIRECTIONS.left;

    if (ghost.personality === "ambush") {
      return { x: position.x + playerDirection.x * 4, y: position.y + playerDirection.y * 4 };
    }
    if (ghost.personality === "corner") {
      const phase = Math.floor(gameTime / 7) % 2;
      return phase ? { x: COLS - 2, y: ROWS - 2 } : position;
    }
    if (ghost.personality === "shy") {
      const distance = Math.hypot(ghost.col - position.x, ghost.row - position.y);
      return distance < 6 ? { x: 1, y: ROWS - 2 } : position;
    }
    return position;
  }

  function chooseGhostDirection(ghost) {
    let choices = DIRECTION_NAMES.filter((name) => canMove(ghost, name));
    const reverse = opposite(ghost.direction);
    if (choices.length > 1) choices = choices.filter((name) => name !== reverse);
    if (!choices.length) return reverse;

    if (frightenedTimer > 0) {
      const choice = choices[Math.floor(Math.random() * choices.length)];
      ghost.direction = choice;
      return choice;
    }

    const target = ghostTarget(ghost);
    choices.sort((a, b) => {
      const aDirection = DIRECTIONS[a];
      const bDirection = DIRECTIONS[b];
      const aDistance = Math.hypot(ghost.col + aDirection.x - target.x, ghost.row + aDirection.y - target.y);
      const bDistance = Math.hypot(ghost.col + bDirection.x - target.x, ghost.row + bDirection.y - target.y);
      return aDistance - bDistance;
    });

    const choice = Math.random() < 0.12 && choices.length > 1 ? choices[1] : choices[0];
    ghost.direction = choice;
    return choice;
  }

  function advanceEntity(entity, distance, directionPicker, onArrival) {
    let remaining = distance;
    let safety = 0;

    while (remaining > 0 && safety++ < 12) {
      if (entity.progress === 0) {
        const pickedDirection = directionPicker(entity);
        if (!pickedDirection || !canMove(entity, pickedDirection)) {
          entity.direction = null;
          return;
        }
        entity.direction = pickedDirection;
      }

      const step = Math.min(remaining, 1 - entity.progress);
      entity.progress += step;
      remaining -= step;

      if (entity.progress >= 0.999999) {
        const direction = DIRECTIONS[entity.direction];
        entity.col += direction.x;
        entity.row += direction.y;
        entity.progress = 0;
        if (onArrival) onArrival(entity);
      }
    }
  }

  function collectCell() {
    const cell = maze[player.row][player.col];
    if (cell !== "." && cell !== "o") return;

    maze[player.row][player.col] = " ";
    pelletsLeft -= 1;

    if (cell === "o") {
      addScore(50);
      frightenedTimer = 8;
      ghostCombo = 0;
      playPowerSound();
      announce("Power core collected. Glitch Guards are vulnerable.");
    } else {
      addScore(10);
      chompPitch = !chompPitch;
      tone(chompPitch ? 360 : 430, 0.035, "square", 0.018);
    }

    if (pelletsLeft === 0) finishGame(true);
  }

  function checkGhostCollisions() {
    if (invulnerableTimer > 0) return;
    const playerPosition = entityPosition(player);

    for (const ghost of ghosts) {
      const ghostPosition = entityPosition(ghost);
      if (Math.hypot(playerPosition.x - ghostPosition.x, playerPosition.y - ghostPosition.y) >= 0.64) continue;

      if (frightenedTimer > 0) {
        ghostCombo += 1;
        const points = 200 * (2 ** (ghostCombo - 1));
        addScore(points);
        ghost.col = ghost.startCol;
        ghost.row = ghost.startRow;
        ghost.direction = null;
        ghost.progress = 0;
        ghost.releaseAt = gameTime + 1.1;
        tone(760 + ghostCombo * 90, 0.15, "sawtooth", 0.035);
        announce(`${ghost.name} debugged. ${points} points.`);
      } else {
        loseLife();
      }
      break;
    }
  }

  function loseLife() {
    lives -= 1;
    updateHud();
    playCrashSound();

    if (lives <= 0) {
      finishGame(false);
      return;
    }

    frightenedTimer = 0;
    ghostCombo = 0;
    resetPositions();
    ghosts.forEach((ghost, index) => { ghost.releaseAt = gameTime + 0.5 + index * 0.7; });
    announce(`Signal lost. ${lives} ${lives === 1 ? "life" : "lives"} remaining.`);
  }

  function update(delta) {
    gameTime += delta;
    frightenedTimer = Math.max(0, frightenedTimer - delta);
    invulnerableTimer = Math.max(0, invulnerableTimer - delta);
    if (frightenedTimer === 0) ghostCombo = 0;

    advanceEntity(player, player.speed * delta, choosePlayerDirection, collectCell);

    ghosts.forEach((ghost) => {
      if (gameTime < ghost.releaseAt) return;
      const speedFactor = frightenedTimer > 0 ? 0.72 : 1;
      advanceEntity(ghost, ghost.speed * speedFactor * delta, chooseGhostDirection);
    });

    checkGhostCollisions();
  }

  function addScore(points) {
    score += points;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("kuga-man-high-score", String(highScore));
    }
    updateHud();
  }

  function updateHud() {
    scoreElement.textContent = String(score).padStart(6, "0");
    highScoreElement.textContent = String(highScore).padStart(6, "0");
    livesElement.textContent = Array(Math.max(0, lives)).fill("●").join(" ") || "—";
    livesElement.setAttribute("aria-label", `${lives} ${lives === 1 ? "life" : "lives"}`);
  }

  function announce(message) {
    statusElement.textContent = message;
  }

  function showOverlay(title, text, buttonText) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startButton.textContent = buttonText;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startGame() {
    ensureAudio();
    if (state === "won" || state === "lost") resetGame();
    state = "running";
    hideOverlay();
    announce("Game running.");
  }

  function togglePause() {
    if (state === "running") {
      state = "paused";
      showOverlay("Paused", "The grid is holding your place.", "Resume");
      announce("Game paused.");
    } else if (state === "paused") {
      startGame();
    }
  }

  function finishGame(won) {
    state = won ? "won" : "lost";
    player.direction = null;
    if (won) {
      showOverlay("Grid cleared!", `Final score: ${score}. Kuga owns the maze.`, "Play again");
      playWinSound();
      announce(`You won with ${score} points.`);
    } else {
      showOverlay("System crash", `Final score: ${score}. Reboot and take back the grid.`, "Try again");
      announce(`Game over. Final score: ${score}.`);
    }
  }

  function queueMove(directionName) {
    ensureAudio();
    if (state === "ready") startGame();
    if (state !== "running") return;
    queuedDirection = directionName;
  }

  function ensureAudio() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioContext = new AudioContextClass();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
  }

  function tone(frequency, duration, type = "sine", volume = 0.03, delay = 0) {
    if (muted || !audioContext) return;
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  function playPowerSound() {
    [180, 260, 390, 520].forEach((frequency, index) => tone(frequency, 0.18, "square", 0.028, index * 0.055));
  }

  function playCrashSound() {
    [260, 190, 125].forEach((frequency, index) => tone(frequency, 0.22, "sawtooth", 0.035, index * 0.09));
  }

  function playWinSound() {
    [330, 440, 554, 660, 880].forEach((frequency, index) => tone(frequency, 0.28, "triangle", 0.04, index * 0.1));
  }

  function roundedRectPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawMaze(timestamp) {
    ctx.fillStyle = "#030612";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 10, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.68);
    glow.addColorStop(0, "rgba(31, 54, 137, 0.13)");
    glow.addColorStop(1, "rgba(2, 5, 16, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cell = maze[row][col];
        const x = col * TILE;
        const y = row * TILE;

        if (cell === "#") {
          roundedRectPath(ctx, x + 1.5, y + 1.5, TILE - 3, TILE - 3, 5);
          ctx.fillStyle = "#102b82";
          ctx.fill();
          ctx.strokeStyle = "rgba(84, 130, 255, 0.88)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (cell === ".") {
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, 2.2, 0, TAU);
          ctx.fillStyle = "#d8e8ff";
          ctx.fill();
        } else if (cell === "o") {
          const pulse = 4.4 + Math.sin(timestamp * 0.007) * 1.2;
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, pulse, 0, TAU);
          ctx.fillStyle = "#37e8ff";
          ctx.shadowColor = "#37e8ff";
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  function drawPlayer(timestamp) {
    if (invulnerableTimer > 0 && Math.floor(invulnerableTimer * 10) % 2 === 0) return;
    const position = entityPosition(player);
    const x = position.x * TILE;
    const y = position.y * TILE;
    const direction = DIRECTIONS[player.direction] || DIRECTIONS.right;
    const mouth = 0.13 + Math.abs(Math.sin(timestamp * 0.011)) * 0.29;

    ctx.save();
    ctx.shadowColor = "rgba(255, 217, 40, 0.75)";
    ctx.shadowBlur = frightenedTimer > 0 ? 17 : 10;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, TILE * 0.41, direction.angle + mouth, direction.angle + TAU - mouth);
    ctx.closePath();
    ctx.fillStyle = "#ffd928";
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#141722";
    ctx.font = `900 ${TILE * 0.43}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("K", x - direction.x * 1.2, y + 0.6);
    ctx.restore();
  }

  function drawGhost(ghost, timestamp) {
    const position = entityPosition(ghost);
    const x = position.x * TILE;
    const y = position.y * TILE;
    const vulnerable = frightenedTimer > 0;
    const flashing = vulnerable && frightenedTimer < 2 && Math.floor(timestamp / 130) % 2 === 0;
    const bodyColor = flashing ? "#f6f7ff" : vulnerable ? "#3158e8" : ghost.color;
    const size = TILE * 0.72;

    ctx.save();
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = vulnerable ? 5 : 9;
    roundedRectPath(ctx, x - size / 2, y - size / 2, size, size, 5);
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = vulnerable ? "#c9d3ff" : "#17203d";
    ctx.fillRect(x - size * 0.34, y + size * 0.17, size * 0.68, 2);

    const look = DIRECTIONS[ghost.direction] || { x: 0, y: 0 };
    [-1, 1].forEach((side) => {
      const eyeX = x + side * size * 0.19;
      const eyeY = y - size * 0.13;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, size * 0.13, 0, TAU);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeX + look.x * 1.5, eyeY + look.y * 1.5, size * 0.06, 0, TAU);
      ctx.fillStyle = "#10162f";
      ctx.fill();
    });

    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x, y - size * 0.72);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - size * 0.78, 1.8, 0, TAU);
    ctx.fillStyle = "#f6f7ff";
    ctx.fill();
    ctx.restore();
  }

  function draw(timestamp) {
    drawMaze(timestamp);
    ghosts.forEach((ghost) => drawGhost(ghost, timestamp));
    drawPlayer(timestamp);

    if (frightenedTimer > 0 && state === "running") {
      ctx.save();
      ctx.fillStyle = "rgba(55, 232, 255, 0.9)";
      ctx.font = "800 11px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`POWER ${frightenedTimer.toFixed(1)}`, WIDTH - 10, 15);
      ctx.restore();
    }
  }

  function loop(timestamp) {
    const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
    lastTimestamp = timestamp;
    if (state === "running") update(delta);
    draw(timestamp);
    requestAnimationFrame(loop);
  }

  const keyDirections = {
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right"
  };

  window.addEventListener("keydown", (event) => {
    const direction = keyDirections[event.code];
    if (direction) {
      event.preventDefault();
      queueMove(direction);
      return;
    }

    if (event.code === "KeyP" || event.code === "Escape") {
      event.preventDefault();
      togglePause();
      return;
    }

    if ((event.code === "Enter" || event.code === "Space") && state !== "running") {
      event.preventDefault();
      startGame();
    }
  });

  function steerWithJoystick(event) {
    const bounds = joystick.getBoundingClientRect();
    const deltaX = event.clientX - (bounds.left + bounds.width / 2);
    const deltaY = event.clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(deltaX, deltaY);
    const maximum = bounds.width * 0.28;
    const scale = distance > maximum ? maximum / distance : 1;
    const knobX = deltaX * scale;
    const knobY = deltaY * scale;

    joystickKnob.style.setProperty("--stick-x", `${knobX}px`);
    joystickKnob.style.setProperty("--stick-y", `${knobY}px`);

    const deadZone = bounds.width * 0.09;
    let nextDirection = null;
    if (distance >= deadZone) {
      nextDirection = Math.abs(deltaX) > Math.abs(deltaY)
        ? (deltaX > 0 ? "right" : "left")
        : (deltaY > 0 ? "down" : "up");
    }

    if (nextDirection && nextDirection !== joystickDirection) {
      joystickDirection = nextDirection;
      joystick.dataset.direction = nextDirection;
      queueMove(nextDirection);
    } else if (!nextDirection) {
      joystickDirection = null;
      delete joystick.dataset.direction;
    }
  }

  function releaseJoystick(event) {
    if (joystickPointerId !== null && event.pointerId !== joystickPointerId) return;
    if (joystick.hasPointerCapture?.(event.pointerId)) joystick.releasePointerCapture(event.pointerId);
    joystickPointerId = null;
    joystickDirection = null;
    delete joystick.dataset.direction;
    joystick.classList.remove("active");
    joystickKnob.style.setProperty("--stick-x", "0px");
    joystickKnob.style.setProperty("--stick-y", "0px");
  }

  joystick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    joystickPointerId = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    joystick.classList.add("active");
    steerWithJoystick(event);
  });

  joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId !== joystickPointerId) return;
    event.preventDefault();
    steerWithJoystick(event);
  });

  joystick.addEventListener("pointerup", releaseJoystick);
  joystick.addEventListener("pointercancel", releaseJoystick);

  canvas.addEventListener("pointerdown", (event) => {
    swipeStart = { x: event.clientX, y: event.clientY };
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!swipeStart) return;
    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.hypot(deltaX, deltaY) < 18) return;
    queueMove(Math.abs(deltaX) > Math.abs(deltaY)
      ? (deltaX > 0 ? "right" : "left")
      : (deltaY > 0 ? "down" : "up"));
  });

  startButton.addEventListener("click", startGame);
  soundButton.addEventListener("click", () => {
    ensureAudio();
    muted = !muted;
    soundButton.textContent = `Sound: ${muted ? "off" : "on"}`;
    soundButton.setAttribute("aria-pressed", String(muted));
    soundButton.setAttribute("aria-label", muted ? "Enable sound" : "Mute sound");
    if (!muted) tone(520, 0.08, "sine", 0.025);
  });

  window.addEventListener("blur", () => {
    if (state === "running") togglePause();
  });
  window.addEventListener("resize", prepareCanvas);

  prepareCanvas();
  resetGame();
  showOverlay("Kuga Man", "Collect every data dot. Power up and outsmart the Glitch Guards.", "Start game");
  requestAnimationFrame(loop);
})();
