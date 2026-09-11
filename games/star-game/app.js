/* ============================================================
   STAR GAME — script.js  (COMPLETE FIXED VERSION)
   سارا کوڈ DOMContentLoaded کے اندر ہے تاکہ null errors نہ آئیں
   ============================================================ */
"use strict";

/* ============================================================
   CONFIGURATION
   ============================================================ */
const DIFFICULTY = {
  easy:   { timerStart:35, starCount:3, bombCount:1, starSpeed:1.5, bombSpeed:1.2, spawnRate:3500, livesStart:5 },
  medium: { timerStart:30, starCount:4, bombCount:2, starSpeed:2.5, bombSpeed:2.0, spawnRate:2800, livesStart:3 },
  hard:   { timerStart:25, starCount:5, bombCount:3, starSpeed:3.8, bombSpeed:3.0, spawnRate:2000, livesStart:2 },
};

const POWERUPS = [
  { id:"freeze", emoji:"🧊", label:"⏸ TIME FROZEN",  color:"#4ff7c1", duration:5000 },
  { id:"double", emoji:"✨", label:"✨ DOUBLE SCORE", color:"#f7c948", duration:7000 },
  { id:"slow",   emoji:"🐌", label:"🐌 SLOW MOTION",  color:"#c084fc", duration:6000 },
  { id:"life",   emoji:"💖", label:"💖 EXTRA LIFE",   color:"#ff4fa3", duration:0    },
];

const LB_KEY = "starGameLeaderboard";
const HS_KEY = "starGameHighScore";

/* ============================================================
   STATE
   ============================================================ */
let state = {
  running: false, paused: false, difficulty: "easy",
  score: 0, level: 1, lives: 3, timeLeft: 30,
  activePowerup: null, musicOn: false,
  objects: [], objIdCounter: 0,
};

let loopId = null, timerIntId = null, spawnIntId = null, lastTs = null;

/* ============================================================
   LOCAL STORAGE
   ============================================================ */
function loadHighScore() { return parseInt(localStorage.getItem(HS_KEY) || "0", 10); }
function saveHighScore(s) { if (s > loadHighScore()) localStorage.setItem(HS_KEY, s); }
function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem(LB_KEY) || "[]"); }
  catch (e) { return []; }
}
function saveToLeaderboard(name, score, level) {
  const lb = loadLeaderboard();
  lb.push({ name: name || "Anonymous", score, level });
  lb.sort((a, b) => b.score - a.score);
  lb.splice(10);
  localStorage.setItem(LB_KEY, JSON.stringify(lb));
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/* ============================================================
   AUDIO (Web Audio API)
   ============================================================ */
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function beep({ freq = 440, type = "sine", dur = 0.15, vol = 0.3 } = {}) {
  if (!state.musicOn) return;
  try {
    const ac = getAudio(), osc = ac.createOscillator(), g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = type; osc.frequency.value = freq; g.gain.value = vol;
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.stop(ac.currentTime + dur);
  } catch (e) {}
}
const sounds = {
  star: () => beep({ freq: 880, type: "triangle", dur: 0.12, vol: 0.4 }),
  bomb: () => beep({ freq: 120, type: "sawtooth", dur: 0.3,  vol: 0.5 }),
  lvl:  () => [523,659,784,1047].forEach((f,i) => setTimeout(() => beep({ freq:f, dur:0.15, vol:0.35 }), i*100)),
  over: () => [440,350,280,220].forEach((f,i) => setTimeout(() => beep({ freq:f, type:"sawtooth", dur:0.25, vol:0.4 }), i*120)),
  pu:   () => [660,770,880].forEach((f,i) => setTimeout(() => beep({ freq:f, type:"triangle", dur:0.12, vol:0.3 }), i*80)),
  btn:  () => beep({ freq: 600, type: "square", dur: 0.07, vol: 0.2 }),
  miss: () => beep({ freq: 200, type: "sawtooth", dur: 0.1, vol: 0.25 }),
};

let bgMusicNode = null;
let bgAudioEl = null;
// Default background track URL (change to your preferred royalty-free loop)
const BG_TRACK_URL = 'https://actions.google.com/sounds/v1/ambiences/space_ambience.ogg';

function initBgAudio(url = BG_TRACK_URL) {
  if (bgAudioEl) return Promise.resolve(bgAudioEl);
  return new Promise((resolve, reject) => {
    try {
      const a = new Audio();
      a.src = url;
      a.crossOrigin = 'anonymous';
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0.06;
      const onCan = () => { a.removeEventListener('canplaythrough', onCan); console.debug('[audio] canplaythrough — bg track ready'); resolve(a); };
      const onErr = (e) => { a.removeEventListener('error', onErr); console.error('[audio] bg track load error', e); reject(e); };
      a.addEventListener('canplaythrough', onCan);
      a.addEventListener('error', onErr);
      a.load();
      bgAudioEl = a;
    } catch (err) { reject(err); }
  });
}

function startBgMusic() {
  if (!state.musicOn) return;
  // Prefer file-based audio if available
  if (bgAudioEl) {
    bgAudioEl.play().then(() => console.debug('[audio] bgAudioEl playing'))
      .catch(err => {
        console.warn('[audio] bgAudioEl play blocked — attempting AudioContext resume', err);
        try { const ac = getAudio(); if (ac && ac.state === 'suspended' && ac.resume) ac.resume().then(() => bgAudioEl.play()).then(()=>console.debug('[audio] resumed and playing')).catch(e=>console.error('[audio] resume/play failed', e)); } catch(e) { console.error('[audio] resume attempt failed', e); }
      });
    return;
  }
  if (bgMusicNode) return;
  try {
    const ac = getAudio();
    if (ac && ac.state === 'suspended' && ac.resume) ac.resume();
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'sine'; osc.frequency.value = 110; g.gain.value = 0.04;
    osc.start(); bgMusicNode = { osc, g };
    console.debug('[audio] oscillator fallback started');
  } catch (e) {}
}

function stopBgMusic() {
  if (bgAudioEl) {
    try { bgAudioEl.pause(); bgAudioEl.currentTime = 0; } catch (e) {}
  }
  if (!bgMusicNode) { bgMusicNode = null; return; }
  try { bgMusicNode.osc.stop(); } catch (e) {}
  bgMusicNode = null;
  console.debug('[audio] background music stopped');
}

/* ============================================================
   BACKGROUND CANVAS PARTICLES
   ============================================================ */
let bgParticles = [];

function resizeBg(canvas) {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
function initParticles(canvas, count = 120) {
  bgParticles = [];
  for (let i = 0; i < count; i++) {
    bgParticles.push({
      x: Math.random() * canvas.width,  y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25,
      a: Math.random(), da: (Math.random() - 0.5) * 0.005,
    });
  }
}
function animateBg(canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bgParticles.forEach(p => {
    p.x = (p.x + p.dx + canvas.width)  % canvas.width;
    p.y = (p.y + p.dy + canvas.height) % canvas.height;
    p.a += p.da;
    if (p.a < 0) p.da =  Math.abs(p.da);
    if (p.a > 1) p.da = -Math.abs(p.da);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(247,201,72,${p.a * 0.6})`;
    ctx.fill();
  });
  requestAnimationFrame(() => animateBg(canvas, ctx));
}

/* ============================================================
   VISUAL FX
   ============================================================ */
function spawnFloat(text, x, y, color, area) {
  const el = document.createElement("div");
  el.className = "float-score";
  el.textContent = text; el.style.color = color;
  el.style.left = x + "px"; el.style.top = y + "px";
  area.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
function spawnBurst(x, y, isBomb, area) {
  const el = document.createElement("div");
  el.className = "click-burst" + (isBomb ? " bomb-burst" : "");
  el.style.left = x + "px"; el.style.top = y + "px";
  area.appendChild(el);
  setTimeout(() => el.remove(), 400);
}
function flashDamage() {
  const f = document.createElement("div");
  f.className = "damage-flash";
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 400);
}

/* ============================================================
   MAIN INIT — سب کچھ DOMContentLoaded کے اندر
   ============================================================ */
window.addEventListener("DOMContentLoaded", () => {

  /* ---- DOM refs ---- */
  const bgCanvas       = document.getElementById("bgCanvas");
  const bgCtx          = bgCanvas.getContext("2d");
  const gameArea       = document.getElementById("gameArea");

  const scrStart       = document.getElementById("startScreen");
  const scrGame        = document.getElementById("gameScreen");
  const scrPause       = document.getElementById("pauseScreen");
  const scrOver        = document.getElementById("gameOverScreen");
  const scrLb          = document.getElementById("leaderboardModal");

  const hudScore       = document.getElementById("scoreDisplay");
  const hudLevel       = document.getElementById("levelDisplay");
  const hudTimer       = document.getElementById("timerDisplay");
  const hudLives       = document.getElementById("livesDisplay");
  const hudHS          = document.getElementById("highScoreDisplay");

  const startBtn       = document.getElementById("startBtn");
  const leaderboardBtn = document.getElementById("leaderboardBtn");
  const pauseBtn       = document.getElementById("pauseBtn");
  const musicBtn       = document.getElementById("musicBtn");
  const resumeBtn      = document.getElementById("resumeBtn");
  const pauseRestartBtn= document.getElementById("pauseRestartBtn");
  const pauseMenuBtn   = document.getElementById("pauseMenuBtn");
  const saveScoreBtn   = document.getElementById("saveScoreBtn");
  const restartBtn     = document.getElementById("restartBtn");
  const menuBtn        = document.getElementById("menuBtn");
  const closeLbBtn     = document.getElementById("closeLbBtn");
  const diffBadge      = document.getElementById("diffBadge");
  const puIndicator    = document.getElementById("powerupIndicator");
  const lvlUpOverlay   = document.getElementById("levelUpOverlay");
  const cdOverlay      = document.getElementById("countdownOverlay");
  const cdNum          = document.getElementById("countdownNum");
  const startHS        = document.getElementById("startHighScore");
  const finalScore     = document.getElementById("finalScore");
  const finalLevel     = document.getElementById("finalLevel");
  const newRecord      = document.getElementById("newRecordBadge");
  const nameInput      = document.getElementById("playerNameInput");
  const goTitle        = document.getElementById("gameOverTitle");
  const lbList         = document.getElementById("leaderboardList");

  /* ---- background particles ---- */
  resizeBg(bgCanvas);
  initParticles(bgCanvas);
  animateBg(bgCanvas, bgCtx);
  window.addEventListener("resize", () => { resizeBg(bgCanvas); initParticles(bgCanvas); });

  /* ---- show start screen ---- */
  startHS.textContent = loadHighScore();
  showScreen("start");

  /* ============================================================
     SCREEN MANAGER
     ============================================================ */
  function showScreen(name) {
    [scrStart, scrGame, scrPause, scrOver, scrLb].forEach(el => {
      el.style.display = "none";
      el.classList.remove("active");
    });
    const map = { start: scrStart, game: scrGame, pause: scrPause, gameover: scrOver, leaderboard: scrLb };
    const s = map[name];
    if (s) { s.style.display = "flex"; s.classList.add("active"); }
  }

  /* ============================================================
     HUD UPDATE
     ============================================================ */
  function hudUp() {
    hudScore.textContent = state.score;
    hudLevel.textContent = state.level;
    hudTimer.textContent = state.timeLeft;
    hudTimer.classList.toggle("danger", state.timeLeft <= 8);
    hudHS.textContent    = Math.max(state.score, loadHighScore());
    hudLives.textContent = "❤️".repeat(Math.max(0, state.lives)) || "💔";
  }

  /* ============================================================
     OBJECT MANAGEMENT
     ============================================================ */
  function makeObject(type, extra = {}) {
    const areaW = gameArea.clientWidth;
    const areaH = gameArea.clientHeight;
    const conf  = DIFFICULTY[state.difficulty];
    const id    = ++state.objIdCounter;
    const size  = (type === "powerup") ? 44 : 48;

    const x = Math.random() * (areaW - size - 10) + 5;
    const y = Math.random() * (areaH - size - 10) + 5;

    const lvlF  = 1 + (state.level - 1) * 0.12;
    const spd   = (type === "bomb") ? conf.bombSpeed * lvlF : conf.starSpeed * lvlF;
    const angle = Math.random() * Math.PI * 2;
    const dx    = Math.cos(angle) * spd;
    const dy    = Math.sin(angle) * spd;

    const el = document.createElement("div");
    el.classList.add("game-obj");

    if (type === "star") {
      el.classList.add("star-obj");
      el.textContent = "⭐";
    } else if (type === "bomb") {
      el.classList.add("bomb-obj");
      el.textContent = "💣";
    } else if (type === "powerup") {
      el.classList.add("powerup-obj");
      const pu = POWERUPS[extra.puIdx];
      el.textContent = pu.emoji;
      el.style.borderColor = pu.color;
      setTimeout(() => removeObj(id), 7000);
    }

    el.style.left = x + "px";
    el.style.top  = y + "px";

    el.addEventListener("pointerdown", e => {
      e.stopPropagation();
      handleClick(id, type, extra, el);
    });

    gameArea.appendChild(el);
    const obj = { id, type, x, y, dx, dy, el, puIdx: extra.puIdx };
    state.objects.push(obj);
    return obj;
  }

  function removeObj(id) {
    const idx = state.objects.findIndex(o => o.id === id);
    if (idx === -1) return;
    state.objects[idx].el.remove();
    state.objects.splice(idx, 1);
  }

  function clearAll() {
    state.objects.forEach(o => o.el.remove());
    state.objects = [];
  }

  /* ============================================================
     CLICK HANDLER
     ============================================================ */
  function handleClick(id, type, extra, el) {
    if (!state.running || state.paused) return;
    const rect = el.getBoundingClientRect();
    const ar   = gameArea.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2 - ar.left;
    const cy   = rect.top  + rect.height / 2 - ar.top;

    if (type === "star") {
      const pts = (state.activePowerup?.id === "double") ? 2 : 1;
      state.score += pts;
      sounds.star();
      spawnFloat("+" + pts, cx, cy, "#f7c948", gameArea);
      spawnBurst(cx, cy, false, gameArea);
      removeObj(id);
      checkLevelUp();
      hudUp();
    } else if (type === "bomb") {
      sounds.bomb();
      spawnBurst(cx, cy, true, gameArea);
      spawnFloat("💥", cx, cy, "#ff3c3c", gameArea);
      removeObj(id);
      loseLife();
    } else if (type === "powerup") {
      sounds.pu();
      const pu = POWERUPS[extra.puIdx];
      spawnFloat(pu.emoji, cx, cy, pu.color, gameArea);
      spawnBurst(cx, cy, false, gameArea);
      removeObj(id);
      applyPowerup(extra.puIdx);
    }
  }

  /* miss click on empty area */
  gameArea.addEventListener("pointerdown", e => {
    if (!state.running || state.paused) return;
    if (e.target !== gameArea) return;
    if (state.difficulty !== "easy") {
      sounds.miss();
      loseLife();
    }
  });

  /* ============================================================
     GAME LOOP
     ============================================================ */
  function gameLoop(ts) {
    if (!state.running || state.paused) return;
    loopId = requestAnimationFrame(gameLoop);
    const dt = lastTs ? Math.min((ts - lastTs) / 16.67, 3) : 1;
    lastTs = ts;
    const areaW = gameArea.clientWidth;
    const areaH = gameArea.clientHeight;

    state.objects.forEach(obj => {
      const sf = (state.activePowerup?.id === "slow") ? 0.45 : 1;
      if (state.activePowerup?.id === "freeze" && obj.type !== "powerup") return;

      obj.x += obj.dx * dt * sf;
      obj.y += obj.dy * dt * sf;

      const sz = (obj.type === "powerup") ? 44 : 48;
      if (obj.x <= 0)           { obj.x = 0;           obj.dx =  Math.abs(obj.dx); }
      if (obj.y <= 0)           { obj.y = 0;            obj.dy =  Math.abs(obj.dy); }
      if (obj.x + sz >= areaW)  { obj.x = areaW - sz;  obj.dx = -Math.abs(obj.dx); }
      if (obj.y + sz >= areaH)  { obj.y = areaH - sz;  obj.dy = -Math.abs(obj.dy); }

      obj.el.style.left = obj.x + "px";
      obj.el.style.top  = obj.y + "px";
    });
  }

  /* ============================================================
     TIMER
     ============================================================ */
  function startTimer() {
    clearInterval(timerIntId);
    timerIntId = setInterval(() => {
      if (state.paused || state.activePowerup?.id === "freeze") return;
      state.timeLeft--;
      hudUp();
      if (state.timeLeft <= 0) endGame("time");
    }, 1000);
  }

  /* ============================================================
     SPAWNING
     ============================================================ */
  function startSpawning() {
    clearInterval(spawnIntId);
    const conf = DIFFICULTY[state.difficulty];
    spawnIntId = setInterval(() => {
      if (state.paused || !state.running) return;
      const roll = Math.random();
      if (roll < 0.55) {
        makeObject("star");
      } else if (roll < 0.85) {
        const bombs = state.objects.filter(o => o.type === "bomb").length;
        if (bombs < conf.bombCount + state.level) makeObject("bomb");
      } else {
        if (!state.activePowerup) {
          makeObject("powerup", { puIdx: Math.floor(Math.random() * POWERUPS.length) });
        }
      }
    }, conf.spawnRate);
  }

  /* ============================================================
     POWER-UPS
     ============================================================ */
  function applyPowerup(puIdx) {
    const pu = POWERUPS[puIdx];
    if (state.activePowerup?.timeoutId) clearTimeout(state.activePowerup.timeoutId);

    if (pu.id === "life") {
      state.lives = Math.min(state.lives + 1, 5);
      hudUp();
      showPuIndicator("💖 +1 LIFE", pu.color);
      setTimeout(() => puIndicator.classList.add("hidden"), 2000);
      state.activePowerup = null;
      return;
    }

    state.activePowerup = { id: pu.id };
    showPuIndicator(pu.label, pu.color);
    const tid = setTimeout(() => {
      state.activePowerup = null;
      puIndicator.classList.add("hidden");
    }, pu.duration);
    state.activePowerup.timeoutId = tid;
  }

  function showPuIndicator(label, color) {
    puIndicator.textContent  = label;
    puIndicator.style.color  = color;
    puIndicator.style.borderColor = color;
    puIndicator.style.boxShadow   = `0 0 18px ${color}aa, 0 0 40px ${color}40`;
    puIndicator.classList.remove("hidden");
  }

  /* ============================================================
     LIVES
     ============================================================ */
  function loseLife() {
    state.lives--;
    hudUp();
    gameArea.classList.remove("shake");
    void gameArea.offsetWidth;
    gameArea.classList.add("shake");
    flashDamage();
    if (state.lives <= 0) endGame("lives");
  }

  /* ============================================================
     LEVEL UP
     ============================================================ */
  function checkLevelUp() {
    const nl = Math.floor(state.score / 10) + 1;
    if (nl > state.level) {
      state.level = nl;
      sounds.lvl();
      lvlUpOverlay.classList.remove("hidden");
      lvlUpOverlay.querySelector("span").textContent = "LEVEL " + state.level + "!";
      setTimeout(() => lvlUpOverlay.classList.add("hidden"), 1200);
      const boost = 1 + state.level * 0.05;
      state.objects.forEach(o => { o.dx *= boost; o.dy *= boost; });
      if (state.level % 3 === 0) makeObject("bomb");
    }
  }

  /* ============================================================
     COUNTDOWN
     ============================================================ */
  function startCountdown(cb) {
    cdOverlay.style.display = "flex";
    cdOverlay.classList.remove("hidden");
    const steps = ["3", "2", "1", "GO!"];
    let i = 0;
    function tick() {
      cdNum.textContent = steps[i];
      cdNum.style.animation = "none";
      void cdNum.offsetWidth;
      cdNum.style.animation = "";
      i++;
      if (i < steps.length) {
        setTimeout(tick, 900);
      } else {
        setTimeout(() => {
          cdOverlay.style.display = "none";
          cdOverlay.classList.add("hidden");
          cb();
        }, 700);
      }
    }
    tick();
  }

  /* ============================================================
     GAME FLOW
     ============================================================ */
  function stopTimers() {
    cancelAnimationFrame(loopId);
    clearInterval(timerIntId);
    clearInterval(spawnIntId);
  }

  function startGame() {
    sounds.btn();
    const conf = DIFFICULTY[state.difficulty];
    state.score       = 0;
    state.level       = 1;
    state.lives       = conf.livesStart;
    state.timeLeft    = conf.timerStart;
    state.running     = false;
    state.paused      = false;
    state.activePowerup = null;
    lastTs            = null;

    showScreen("game");
    diffBadge.textContent = state.difficulty.toUpperCase();
    clearAll();
    hudUp();
    puIndicator.classList.add("hidden");
    lvlUpOverlay.classList.add("hidden");
    saveScoreBtn.textContent = "💾 SAVE SCORE";
    saveScoreBtn.disabled    = false;

    startCountdown(() => {
      state.running = true;
      const c = DIFFICULTY[state.difficulty];
      for (let i = 0; i < c.starCount; i++) makeObject("star");
      for (let i = 0; i < c.bombCount; i++) makeObject("bomb");
      startTimer();
      startSpawning();
      loopId = requestAnimationFrame(gameLoop);
      if (state.musicOn) startBgMusic();
    });
  }

  function pauseGame() {
    if (!state.running) return;
    state.paused = true;
    sounds.btn();
    showScreen("pause");
  }

  function resumeGame() {
    state.paused = false;
    sounds.btn();
    showScreen("game");
    lastTs = null;
    loopId = requestAnimationFrame(gameLoop);
  }

  function endGame(reason) {
    state.running = false;
    stopTimers();
    stopBgMusic();
    sounds.over();
    saveHighScore(state.score);
    finalScore.textContent = state.score;
    finalLevel.textContent = state.level;
    goTitle.textContent    = (reason === "lives") ? "💔 OUT OF LIVES" : "⏰ TIME'S UP";
    newRecord.style.display = (state.score > 0 && state.score >= loadHighScore()) ? "flex" : "none";
    nameInput.value = "";
    setTimeout(() => showScreen("gameover"), 400);
  }

  function restartGame() {
    clearAll();
    stopTimers();
    startGame();
  }

  function renderLeaderboard() {
    const lb = loadLeaderboard();
    lbList.innerHTML = "";
    if (!lb.length) {
      lbList.innerHTML = "<li style='justify-content:center;color:var(--text-dim)'>No scores yet — play first!</li>";
      return;
    }
    const medals = ["🥇","🥈","🥉"];
    lb.forEach((e, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="lb-rank">${medals[i] || (i + 1)}</span>
        <span class="lb-name">${escapeHtml(e.name)}</span>
        <span class="lb-score">${e.score}</span>
        <span style="font-size:.7rem;color:var(--text-dim);margin-left:8px">Lv${e.level}</span>
      `;
      lbList.appendChild(li);
    });
  }

  /* ============================================================
     EVENT LISTENERS
     ============================================================ */

  // Difficulty buttons
  document.querySelectorAll(".diff-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.difficulty = btn.dataset.diff;
      sounds.btn();
    });
  });

  startBtn.addEventListener("click", async () => {
    try { const ac = getAudio(); if (ac && ac.state === 'suspended' && ac.resume) await ac.resume(); } catch (e) {}
    startGame();
  });

  leaderboardBtn.addEventListener("click", () => {
    sounds.btn();
    renderLeaderboard();
    showScreen("leaderboard");
  });

  pauseBtn.addEventListener("click", pauseGame);

  musicBtn.addEventListener("click", async () => {
    state.musicOn = !state.musicOn;
    musicBtn.textContent = state.musicOn ? "🔊 MUSIC" : "🔇 MUTED";
    sounds.btn();
    if (state.musicOn) {
      try { const ac = getAudio(); if (ac && ac.state === 'suspended' && ac.resume) await ac.resume(); } catch (e) {}
      try {
        await initBgAudio();
        if (state.running && !state.paused) startBgMusic();
      } catch (e) {
        if (state.running && !state.paused) startBgMusic();
      }
    } else {
      stopBgMusic();
    }
  });

  resumeBtn.addEventListener("click", resumeGame);

  pauseRestartBtn.addEventListener("click", restartGame);

  pauseMenuBtn.addEventListener("click", () => {
    sounds.btn();
    clearAll();
    stopTimers();
    state.running = false;
    showScreen("start");
    startHS.textContent = loadHighScore();
  });

  saveScoreBtn.addEventListener("click", () => {
    saveToLeaderboard(nameInput.value.trim(), state.score, state.level);
    sounds.btn();
    saveScoreBtn.textContent = "✅ SAVED!";
    saveScoreBtn.disabled    = true;
  });

  restartBtn.addEventListener("click", restartGame);

  menuBtn.addEventListener("click", () => {
    sounds.btn();
    clearAll();
    stopTimers();
    showScreen("start");
    startHS.textContent = loadHighScore();
  });

  closeLbBtn.addEventListener("click", () => { sounds.btn(); showScreen("start"); });

  // Keyboard shortcuts
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" || e.key === "p" || e.key === "P") {
      if (state.running && !state.paused) pauseGame();
      else if (state.paused) resumeGame();
    }
  });

}); // end DOMContentLoaded