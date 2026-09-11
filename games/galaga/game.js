// ============================================================
//  Galaga — HTML5 Canvas Remake
//  Single-file arcade space shooter. No dependencies.
// ============================================================

(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;   // 480
  const H = canvas.height;  // 720

  // ---- HUD elements ----
  const el = {
    score: document.getElementById("score"),
    level: document.getElementById("level"),
    lives: document.getElementById("lives"),
    overlay: document.getElementById("overlay"),
    startBtn: document.getElementById("startBtn"),
    subtitle: document.getElementById("subtitle"),
    overlayText: document.getElementById("overlayText"),
  };

  // ============================================================
  //  Audio (synthesized, no assets needed)
  // ============================================================
  const Sound = (() => {
    let ac = null;
    const ensure = () => {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      return ac;
    };
    function beep(freq, dur, type = "square", vol = 0.12, slideTo = null) {
      try {
        const c = ensure();
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, c.currentTime);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), c.currentTime + dur);
        g.gain.setValueAtTime(vol, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
        o.connect(g).connect(c.destination);
        o.start(); o.stop(c.currentTime + dur);
      } catch (e) {}
    }
    return {
      shoot: () => beep(620, 0.12, "square", 0.08, 240),
      enemyShoot: () => beep(300, 0.15, "sawtooth", 0.05, 120),
      explosion: () => beep(140, 0.35, "sawtooth", 0.12, 40),
      hit: () => beep(900, 0.08, "triangle", 0.06, 400),
      playerDeath: () => { beep(200, 0.5, "sawtooth", 0.18, 50); setTimeout(() => beep(120, 0.6, "square", 0.14, 40), 120); },
      powerup: () => { beep(520, 0.1, "triangle", 0.09, 780); setTimeout(() => beep(780, 0.14, "triangle", 0.09, 1040), 90); },
      stage: () => { beep(440, 0.12, "triangle", 0.1, 660); setTimeout(() => beep(660, 0.18, "triangle", 0.1, 880), 130); },
    };
  })();

  // ============================================================
  //  Input
  // ============================================================
  const keys = {};
  const KEY_MAP = {
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
    ArrowUp: "up", KeyW: "up",
    Space: "fire",
    KeyP: "pause",
  };
  window.addEventListener("keydown", (e) => {
    if (e.code in KEY_MAP) {
      const k = KEY_MAP[e.code];
      if (k === "pause") { togglePause(); e.preventDefault(); return; }
      keys[k] = true;
      if (["Space", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    const k = KEY_MAP[e.code];
    if (k) keys[k] = false;
  });

  function togglePause() {
    if (state === "play") { state = "pause"; showOverlay("PAUSED", "Press P to resume", "RESUME"); }
    else if (state === "pause") { hideOverlay(); state = "play"; }
  }

  // ============================================================
  //  Game State
  // ============================================================
  let state = "menu"; // menu | play | pause | dead | gameover
  let score = 0;
  let lives = 3;
  let level = 1;
  let lastFire = 0;
  const FIRE_COOLDOWN = 150;

  const entities = {
    player: null,
    pbullets: [],
    ebullets: [],
    enemies: [],
    particles: [],
    powerups: [],
    stars: [],
  };

  function resetStars() {
    const stars = [];
    const N = 90;
    for (let i = 0; i < N; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 2 + 0.4, // speed / brightness
        r: Math.random() * 1.4 + 0.3,
      });
    }
    entities.stars = stars;
  }

  // ============================================================
  //  Player
  // ============================================================
  class Player {
    constructor() {
      this.w = 34; this.h = 34;
      this.x = W / 2;
      this.y = H - 80;
      this.speed = 240;
      this.alive = true;
      this.respawnDelay = 0;
      this.fireCap = 1;   // number of simultaneous ships / shots
      this.powerTimer = 0; // weapon timer
    }
    update(dt) {
      if (!this.alive) {
        this.respawnDelay -= dt;
        if (this.respawnDelay <= 0 && lives > 0) this.respawn();
      return;
    }
    if (this.invuln > 0) {
      this.invuln -= dt;
      if (this.invuln < 0) this.invuln = 0;
    }
    let mv = 0;
    if (keys.left) mv -= 1;
    if (keys.right) mv += 1;
      this.x += mv * this.speed * dt;
      this.x = Math.max(this.w / 2, Math.min(W - this.w / 2, this.x));

      // vertical slight control
      let vy = 0;
      if (keys.up) vy -= 1;
      if (keys.down) vy += 1;
      this.y += vy * this.speed * 0.5 * dt;
      this.y = Math.max(H * 0.55, Math.min(H - 46, this.y));

      // fire
      const now = performance.now();
      const ready = now - lastFire > FIRE_COOLDOWN;
      if (keys.fire && ready) this.fire();
    }
    fire() {
      const now = performance.now();
      if (now - lastFire < FIRE_COOLDOWN) return;
      lastFire = now;
      const n = Math.max(1, this.fireCap);
      const spread = n > 1 ? 16 : 0;
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * spread;
        entities.pbullets.push(new Bullet(this.x + off, this.y - this.h / 2, 0, -520, true, 22));
      }
      Sound.shoot();
    }
    respawn() {
      this.alive = true;
      this.x = W / 2;
      this.y = H - 80;
      this.invuln = 1.4;
    }
    hit() {
      if (this.invuln > 0) return;
      lives--;
      Sound.playerDeath();
      spawnExplosion(this.x, this.y, 40, "#39f6ff");
      this.alive = false;
      this.respawnDelay = 1.4;
      updateHUD();
      if (lives <= 0) gameOver();
    }
    draw() {
      if (!this.alive) return;
      if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return; // blink
      const x = this.x, y = this.y;
      // thruster flame
      const flick = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(255,150,40,${0.8 * flick})`;
      ctx.beginPath();
      ctx.moveTo(x - 6, y + this.h / 2 - 4);
      ctx.lineTo(x + 6, y + this.h / 2 - 4);
      ctx.lineTo(x, y + this.h / 2 + 12 * flick);
      ctx.closePath();
      ctx.fill();
      // ship body
      ctx.save();
      ctx.translate(x, y);
      // main hull
      ctx.fillStyle = "#0e2a4a";
      ctx.strokeStyle = "#39f6ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -this.h / 2);
      ctx.lineTo(10, -2);
      ctx.lineTo(8, this.h / 2 - 4);
      ctx.lineTo(-8, this.h / 2 - 4);
      ctx.lineTo(-10, -2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // wings
      ctx.fillStyle = "#123a66";
      ctx.strokeStyle = "#39f6ff";
      ctx.beginPath();
      ctx.moveTo(8, 2); ctx.lineTo(18, 12); ctx.lineTo(6, 12); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, 2); ctx.lineTo(-18, 12); ctx.lineTo(-6, 12); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // cockpit
      ctx.fillStyle = "#39f6ff";
      ctx.beginPath();
      ctx.arc(0, -4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ============================================================
  //  Bullets
  // ============================================================
  class Bullet {
    constructor(x, y, vx, vy, friendly, dmg = 1, color = "#fff") {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.friendly = friendly; this.dmg = dmg;
      this.r = friendly ? 4 : 5;
      this.color = friendly ? "#7ffcff" : "#ff8a5c";
      this.dead = false;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y < -20 || this.y > H + 20 || this.x < -20 || this.x > W + 20) this.dead = true;
    }
    draw() {
      ctx.save();
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r * 0.6, this.r * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ============================================================
  //  Enemies
  // ============================================================
  // Formation grid of possible slots
  const FORM_COLS = 10;
  const FORM_ROWS = 6;
  const FORM_ORIG_X = 70;
  const FORM_ORIG_Y = 120;
  const FORM_STEP_X = 34;
  const FORM_STEP_Y = 30;

  class Enemy {
    constructor(slotX, slotY, kind = "boss") {
      this.slotX = slotX; this.slotY = slotY;
      this.kind = kind; // "boss" (2hp, aggressive) | "minion"
      this.x = slotX; this.y = slotY;
      this.homeX = slotX; this.homeY = slotY;
      this.vx = 0; this.vy = 0;
      this.state = "entering"; // entering | locked | diving | firing | recovering
      this.hp = kind === "boss" ? 2 : 1;
      this.dead = false;
      this.scoreVal = kind === "boss" ? 40 : 20;
      this.w = 26; this.h = 26;
      this.t = Math.random() * 10;
      this.diveBaseX = 0;
      this.enterProgress = 0;
      this.startX = Math.random() * W;
      this.fireCooldown = 2 + Math.random() * 4;
      this.wobble = Math.random() * Math.PI * 2;
      this.eligibleDive = false;
      this.diveTimer = 0;
    }

    // Called once enemy is allowed to leave formation & dive
    startDive() {
      this.state = "diving";
      // pick a target column near bottom for the dive arc
      const targetX = 40 + Math.random() * (W - 80);
      const dx = targetX - this.x;
      const dy = H + 60 - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const spd = 150 + level * 8;
      this.vx = (dx / dist) * spd;
      this.vy = (dy / dist) * spd;
      // add horizontal velocity component for arc
      this.arcVx = (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 60);
      this.active = true;
    }

    lockIn() {
      this.state = "locked";
      this.vx = 0; this.vy = 0;
    }

    update(dt, formationOffsetX, formationOffsetY, formationSway) {
      this.t += dt;
      this.wobble += dt;

      if (this.state === "entering") {
        // swoop from top down to home slot
        this.enterProgress += dt * 0.6;
        const p = Math.min(1, this.enterProgress);
        const ease = p * p;
        this.x = this.startX + (this.slotX - this.startX) * ease;
        this.y = (this.startY || -40) + (this.homeY - (this.startY || -40)) * ease;
        if (p >= 1) { this.lockIn(); this.startY = this.y; }
        return;
      }

      if (this.state === "locked") {
        // gentle sway at home
        this.x = this.homeX + formationOffsetX + Math.sin(this.wobble) * formationSway;
        this.y = this.homeY + Math.cos(this.wobble * 0.8) * (formationSway * 0.5) + formationOffsetY;
        // occasional fire
        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0) {
          this.tryFire();
          this.fireCooldown = 2.5 + Math.random() * 4 - level * 0.15;
        }
        return;
      }

      if (this.state === "diving") {
        // arc movement
        this.x += (this.vx + this.arcVx);
        this.y += this.vy;
        // occasionally fire while diving
        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0 && this.y > 0 && this.y < H * 0.7) {
          this.shootAt(entities.player);
          this.fireCooldown = 1.2 + Math.random() * 2;
        }
        // if went off bottom, recover back up
        if (this.y > H + 60) {
          this.recover();
        }
        // if player passed and near bottom area, start climbing out
        if (this.y > H - 40) this.recover();
        return;
      }

      if (this.state === "recovering") {
        const tx = this.homeX + formationOffsetX;
        const ty = this.homeY;
        const dx = tx - this.x, dy = ty - this.y;
        const d = Math.hypot(dx, dy) || 1;
        const spd = 200;
        this.x += (dx / d) * spd * dt;
        this.y += (dy / d) * spd * dt;
        if (d < 6) { this.lockIn(); this.startY = this.y; }
        return;
      }
    }

    recover() {
      this.state = "recovering";
      this.arcVx = 0;
    }

    tryFire() {
      this.shootAt(entities.player, 0.5);
    }

    shootAt(target, aimBias = 1) {
      if (!target) return;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      const spd = 170 + level * 6;
      let vx = (dx / d) * spd * aimBias + this.vx * 0.2;
      let vy = (dy / d) * spd * aimBias;
      // add some horizontal shots when locked
      if (this.state === "locked") vy = Math.abs(vy) * 0.6 + spd * 0.4;
      entities.ebullets.push(new Bullet(this.x, this.y + this.h / 2, vx, vy, false, 1, "#ff8a5c"));
      Sound.enemyShoot();
    }

    hit(dmg) {
      this.hp -= dmg;
      if (this.hp <= 0) {
        this.dead = true;
        addScore(this.scoreVal * (this.kind === "boss" ? 1 : 1));
        spawnExplosion(this.x, this.y, this.kind === "boss" ? 30 : 20, this.kind === "boss" ? "#ffd23f" : "#ff6b6b");
        Sound.explosion();
        // chance to drop powerup
        if (Math.random() < 0.12) entities.powerups.push(new Powerup(this.x, this.y));
      } else {
        Sound.hit();
      }
    }

    draw() {
      const x = this.x, y = this.y;
      ctx.save();
      ctx.translate(x, y);
      const boss = this.kind === "boss";
      // body
      const bodyColor = boss ? "#b83a2f" : "#3a7b4f";
      const edgeColor = boss ? "#ffd23f" : "#8affb0";
      ctx.fillStyle = bodyColor;
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 2;
      // bug shape
      const bob = Math.sin(this.wobble * 3) * 1.5;
      ctx.beginPath();
      if (boss) {
        // boss: rounder with "eyes"
        ctx.moveTo(-12, -8 + bob);
        ctx.quadraticCurveTo(-6, -16 + bob, 0, -10 + bob);
        ctx.quadraticCurveTo(6, -16 + bob, 12, -8 + bob);
        ctx.quadraticCurveTo(14, 4, 8, 12);
        ctx.quadraticCurveTo(0, 16, -8, 12);
        ctx.quadraticCurveTo(-14, 4, -12, -8 + bob);
      } else {
        ctx.moveTo(-11, -8 + bob);
        ctx.quadraticCurveTo(-4, -14 + bob, 0, -8 + bob);
        ctx.quadraticCurveTo(4, -14 + bob, 11, -8 + bob);
        ctx.quadraticCurveTo(13, 6, 6, 12);
        ctx.quadraticCurveTo(0, 15, -6, 12);
        ctx.quadraticCurveTo(-13, 6, -11, -8 + bob);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // eyes
      ctx.fillStyle = boss ? "#ffd23f" : "#ffd23f";
      ctx.beginPath(); ctx.arc(-5, -2 + bob, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -2 + bob, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#05060d";
      ctx.beginPath(); ctx.arc(-5, -2 + bob, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -2 + bob, 1.2, 0, Math.PI * 2); ctx.fill();
      // wing flaps
      const flap = Math.abs(Math.sin(this.t * 8)) * 6;
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.moveTo(-12, 0 + bob); ctx.lineTo(-18 - flap, 4); ctx.lineTo(-12, 8); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, 0 + bob); ctx.lineTo(18 + flap, 4); ctx.lineTo(12, 8); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // ============================================================
  //  Powerups
  // ============================================================
  class Powerup {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.vy = 70;
      this.r = 12;
      this.dead = false;
      this.t = 0;
    }
    update(dt) {
      this.y += this.vy * dt;
      this.t += dt;
      if (this.y > H + 20) this.dead = true;
    }
    draw() {
      const pulse = 1 + Math.sin(this.t * 8) * 0.12;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#ffd23f";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffd23f";
      ctx.shadowBlur = 12;
      // weapon icon "W"
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#05060d";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("W", 0, 1);
      ctx.restore();
    }
  }

  // ============================================================
  //  Particles
  // ============================================================
  class Particle {
    constructor(x, y, color) {
      this.x = x; this.y = y;
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 180;
      this.vx = Math.cos(a) * s;
      this.vy = Math.sin(a) * s;
      this.life = 0.4 + Math.random() * 0.5;
      this.maxLife = this.life;
      this.color = color;
      this.r = 1 + Math.random() * 2.5;
      this.dead = false;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.94; this.vy *= 0.94;
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    }
    draw() {
      const a = Math.max(0, this.life / this.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function spawnExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) entities.particles.push(new Particle(x, y, color));
  }

  // ============================================================
  //  Score / HUD
  // ============================================================
  function addScore(v) {
    score += v;
    updateHUD();
  }
  function updateHUD() {
    el.score.textContent = score;
    el.level.textContent = level;
    el.lives.textContent = Math.max(0, lives);
  }

  // ============================================================
  //  Overlays
  // ============================================================
  function showOverlay(title, sub, text, btn = "START") {
    el.overlay.querySelector("h1").textContent = title;
    if (sub) { el.overlay.querySelector("h2").textContent = sub; el.overlay.querySelector("h2").style.display = ""; }
    else el.overlay.querySelector("h2").style.display = "none";
    el.overlayText.textContent = text;
    el.startBtn.textContent = btn;
    el.overlay.classList.remove("hidden");
  }
  function hideOverlay() { el.overlay.classList.add("hidden"); }

  el.startBtn.addEventListener("click", () => {
    if (state === "menu" || state === "gameover") startGame();
    else if (state === "pause") togglePause();
  });

  // ============================================================
  //  Level setup
  // ============================================================
  function buildLevel(lvl) {
    const enemies = [];
    for (let r = 0; r < FORM_ROWS; r++) {
      for (let c = 0; c < FORM_COLS; c++) {
        const kind = r === 0 ? "boss" : "minion";
        const slotX = FORM_ORIG_X + c * FORM_STEP_X;
        const slotY = FORM_ORIG_Y + r * FORM_STEP_Y;
        const e = new Enemy(slotX, slotY, kind);
        e.startY = -60 - r * 20;
        enemies.push(e);
      }
    }
    entities.enemies = enemies;
    // staggered entry
    entryQueue = enemies.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(6 + lvl, 12));
    entryTimer = 0;
    formationSwayAmt = 8 + lvl * 2;
  }

  let entryQueue = [];
  let entryTimer = 0;
  let formationOffsetX = 0;
  let formationSway = 0;
  let formationSwayAmt = 10;
  let formationDir = 1;

  function updateFormation(dt) {
    formationSway += dt;
    const sway = Math.sin(formationSway * 0.8) * formationSwayAmt;
    formationOffsetX += formationDir * dt * (22 + level * 3);
    if (formationOffsetX > 40) formationDir = -1;
    if (formationOffsetX < -40) formationDir = 1;
    return { offsetX: formationOffsetX, offsetY: sway };
  }

  // Dive spawn logic
  let diveTimer = 0;
  function handleDives(dt) {
    diveTimer -= dt;
    const pool = entities.enemies.filter(e => !e.dead && e.state === "locked");
    // keep a few locked, spawn dives
    if (diveTimer <= 0 && pool.length > 2) {
      // chance to launch a dive
      const chance = 0.9 - dt * 0.5;
      if (Math.random() < chance) {
        const e = pool[Math.floor(Math.random() * pool.length)];
        e.startDive();
        diveTimer = Math.max(0.6, 2.2 - level * 0.15);
      }
    }
  }

  function checkStageClear() {
    const remaining = entities.enemies.filter(e => !e.dead);
    if (remaining.length === 0) {
      // next level
      level++;
      Sound.stage();
      buildLevel(level);
      updateHUD();
    }
  }

  // ============================================================
  //  Collision
  // ============================================================
  function circleHit(a, ra, b, rb) {
    const dx = a.x - b.x, dy = a.y - b.y;
    const rr = ra + rb;
    return dx * dx + dy * dy <= rr * rr;
  }

  function updateBullets(dt) {
    const pb = entities.pbullets;
    const eb = entities.ebullets;
    for (const b of pb) {
      if (b.dead) continue;
      for (const e of entities.enemies) {
        if (e.dead) continue;
        if (circleHit(b, b.r, e, e.w * 0.4)) {
          e.hit(b.dmg);
          b.dead = true;
          break;
        }
      }
    }
    // enemy bullets vs player
    const p = entities.player;
    for (const b of eb) {
      if (b.dead) continue;
      if (p.alive && circleHit(b, b.r, p, 14)) {
        b.dead = true;
        p.hit();
      }
    }
    // player vs enemies (collision)
    if (p.alive) {
      for (const e of entities.enemies) {
        if (e.dead) continue;
        if (circleHit(p, 13, e, e.w * 0.42)) {
          e.hit(2);
          p.hit();
        }
      }
    }
    // powerups vs player
    for (const pu of entities.powerups) {
      if (pu.dead) continue;
      if (p.alive && circleHit(p, 16, pu, pu.r)) {
        pu.dead = true;
        p.fireCap = Math.min(3, p.fireCap + 1);
        p.powerTimer = 12;
        Sound.powerup();
        addScore(10);
      }
    }
  }

  // ============================================================
  //  Main update
  // ============================================================
  let lastTime = 0;

  function update(dt) {
    // stars always move
    for (const s of entities.stars) {
      s.y += (30 + s.z * 40) * dt;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }

    if (state !== "play") return;

    const p = entities.player;
    p.update(dt);

    // weapon timer
    if (p.powerTimer > 0) {
      p.powerTimer -= dt;
      if (p.powerTimer <= 0 && p.fireCap > 1) p.fireCap = 1;
    }

    const form = updateFormation(dt);
    handleDives(dt);

    for (const e of entities.enemies) e.update(dt, form.offsetX, 0, formationSwayAmt);
    for (const b of entities.pbullets) b.update(dt);
    for (const b of entities.ebullets) b.update(dt);
    for (const pu of entities.powerups) pu.update(dt);
    for (const pt of entities.particles) pt.update(dt);

    updateBullets(dt);

    // cleanup
    entities.pbullets = entities.pbullets.filter(b => !b.dead);
    entities.ebullets = entities.ebullets.filter(b => !b.dead);
    entities.enemies = entities.enemies.filter(e => !e.dead);
    entities.powerups = entities.powerups.filter(p => !p.dead);
    entities.particles = entities.particles.filter(pt => !pt.dead);

    checkStageClear();
  }

  // ============================================================
  //  Render
  // ============================================================
  function drawStars() {
    for (const s of entities.stars) {
      ctx.globalAlpha = 0.4 + s.z * 0.3;
      ctx.fillStyle = "#cfe0ff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawStars();
    for (const pu of entities.powerups) pu.draw();
    for (const e of entities.enemies) e.draw();
    for (const b of entities.pbullets) b.draw();
    for (const b of entities.ebullets) b.draw();
    if (entities.player) entities.player.draw();
    for (const pt of entities.particles) pt.draw();
  }

  // ============================================================
  //  Loop
  // ============================================================
  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastTime) / 1000 || 0);
    lastTime = ts;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // ============================================================
  //  Game control
  // ============================================================
  function startGame() {
    score = 0; lives = 3; level = 1;
    entities.pbullets = []; entities.ebullets = [];
    entities.particles = []; entities.powerups = [];
    entities.player = new Player();
    buildLevel(level);
    updateHUD();
    state = "play";
    hideOverlay();
    Sound.stage();
  }

  function gameOver() {
    state = "gameover";
    showOverlay("GAME OVER", `Reached Level ${level}`, `Final Score: ${score}`, "PLAY AGAIN");
  }

  // init
  resetStars();
  updateHUD();
  state = "menu";
  requestAnimationFrame(frame);

})();
