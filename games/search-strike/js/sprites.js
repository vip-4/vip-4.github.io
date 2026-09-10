/* =========================================================================
 * sprites.js — Procedural art. One coherent drawing language, no image assets.
 *
 *   G.Sprites  — canvas drawers used in-raid (player "Clawd", enemy creatures,
 *                loot containers, ground items).
 *   G.Icons    — inline-SVG builders used by the DOM menus (item tiles, the
 *                Claude "spark" brand logo).
 *
 * Visual identity references Claude Code's mascot Clawd: a warm coral/clay body,
 * a cream face, eyes that track the aim direction, and the radiating Claude
 * "spark" emblem. Loaded after data.js (needs G.getItem / G.RARITY_COLOR).
 * ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const TAU = Math.PI * 2;

  /* ----------------------------- Palette -------------------------------- */
  // Clawd / Claude clay-coral family + supporting inks.
  const PAL = {
    clay: '#d97757',     // Clawd body (Anthropic clay)
    clayLt: '#ee9f7c',   // top highlight
    clayDk: '#b15536',   // underside / outline tint
    cream: '#f7ead9',    // face & belly
    creamDk: '#e7d2b8',
    ink: '#2c1f18',      // outline / pupils
    spark: '#ffe1b0',    // emblem
    sparkGlow: '#ff9a52',
    gun: '#1d1f24',      // gunmetal
    gunLt: '#34373f',
    steel: '#5b616c',    // brighter barrel — readable on dark tiles
  };
  G.PAL = PAL;

  /* --------------------------- Color helpers ---------------------------- */
  const _mixCache = {};
  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  // blend hex a->b by t (0..1), cached. t is quantised to 5% steps so the cache
  // stays bounded even when callers pass a continuously-varying t (e.g. the
  // hurt-flash fade) — the colour difference per step is imperceptible.
  function mix(a, b, t) {
    t = Math.round(t * 20) / 20;
    const key = a + b + t;
    if (_mixCache[key]) return _mixCache[key];
    const ca = hexToRgb(a), cb = hexToRgb(b);
    const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
    const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
    const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
    return (_mixCache[key] = 'rgb(' + r + ',' + g + ',' + bl + ')');
  }

  /* --------------------------- Canvas helpers --------------------------- */
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // The radiating Claude spark, centred at the local origin, pointing outward.
  function spark(ctx, r, color, rays, lw) {
    rays = rays || 12;
    ctx.strokeStyle = color; ctx.lineCap = 'round';
    ctx.lineWidth = lw || Math.max(1, r * 0.16);
    ctx.beginPath();
    const inner = r * 0.16;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * TAU;
      const c = Math.cos(a), s = Math.sin(a);
      ctx.moveTo(c * inner, s * inner);
      ctx.lineTo(c * r, s * r);
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  /* =============================== Sprites ============================== */
  const Sprites = {};

  // Weapon held in front, rotated toward the aim angle about a shoulder pivot.
  // The character body stays upright/front-facing — only the gun aims. `paw`
  // (a fill colour) draws two gripping hands; null for enemies.
  function aimGun(ctx, px, py, aim, s, paw) {
    ctx.save();
    ctx.translate(px, py); ctx.rotate(aim);
    ctx.fillStyle = PAL.gun; roundRect(ctx, 0, -s * 0.09, s * 1.15, s * 0.18, s * 0.05); ctx.fill();
    ctx.fillStyle = PAL.gunLt; roundRect(ctx, 0, -s * 0.09, s * 0.5, s * 0.07, s * 0.03); ctx.fill();
    ctx.fillStyle = '#2a2d34'; roundRect(ctx, s * 0.42, s * 0.06, s * 0.16, s * 0.34, s * 0.05); ctx.fill();
    if (paw) {
      ctx.fillStyle = paw; ctx.strokeStyle = mix(paw, '#000000', 0.32); ctx.lineWidth = 1.5;
      circle(ctx, s * 0.3, 0, s * 0.17); ctx.fill(); ctx.stroke();
      circle(ctx, s * 0.62, s * 0.02, s * 0.15); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // small filled spark centred at the current origin (helper translates first)
  function emblem(ctx, ox, oy, r, col, rays, lw) {
    ctx.save(); ctx.translate(ox, oy); spark(ctx, r, col, rays, lw); ctx.restore();
  }

  /**
   * Player — front-facing "Tactical Clawd". The body faces the camera (upright)
   * so it always reads as a character; only the held gun rotates toward `angle`.
   * opts: { hurt(0..1), armor(bool), armorFrac(0..1), glow(bool) }.
   */
  Sprites.player = function (ctx, x, y, r, angle, opts) {
    opts = opts || {};
    const s = r * 1.5;                        // visual size vs. the collider (drawn larger so detail reads)
    const hurt = opts.hurt || 0;
    const body = hurt > 0 ? mix(PAL.clay, '#ff5a4a', Math.min(1, hurt)) : PAL.clay;
    const bodyLt = hurt > 0 ? mix(PAL.clayLt, '#ff8a7a', Math.min(1, hurt)) : PAL.clayLt;

    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.9, s * 0.74, s * 0.24, 0, 0, TAU); ctx.fill();

    ctx.save();
    ctx.translate(x, y);

    // extract glow — Claude spark above the head
    if (opts.glow) {
      ctx.save(); ctx.shadowColor = PAL.sparkGlow; ctx.shadowBlur = 14;
      emblem(ctx, 0, -s * 1.05, s * 0.34, PAL.sparkGlow, 10, s * 0.1);
      ctx.restore();
    }

    // feet
    ctx.fillStyle = PAL.clayDk;
    ctx.beginPath(); ctx.ellipse(-s * 0.34, s * 0.8, s * 0.24, s * 0.15, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.34, s * 0.8, s * 0.24, s * 0.15, 0, 0, TAU); ctx.fill();
    // idle side arm
    ctx.fillStyle = body; ctx.strokeStyle = PAL.clayDk; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(-s * 0.72, s * 0.1, s * 0.16, s * 0.24, 0.3, 0, TAU); ctx.fill(); ctx.stroke();

    // body — a tall egg (not a circle) + shading
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.78, s * 0.9, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, s * 0.78, s * 0.9, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = bodyLt; ctx.beginPath(); ctx.arc(-s * 0.22, -s * 0.4, s * 0.62, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(s * 0.3, s * 0.55, s * 0.62, 0, TAU); ctx.fill();
    ctx.restore();

    // chest vest across the body (brightens + shows durability when armoured)
    const armored = !!opts.armor;
    ctx.fillStyle = armored ? '#4a6076' : '#39424f';
    roundRect(ctx, -s * 0.5, s * 0.06, s * 1.0, s * 0.5, s * 0.12); ctx.fill();
    ctx.strokeStyle = '#222a33'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.06); ctx.lineTo(-s * 0.2, s * 0.56); ctx.moveTo(s * 0.2, s * 0.06); ctx.lineTo(s * 0.2, s * 0.56); ctx.stroke();
    if (armored) {
      ctx.strokeStyle = 'rgba(150,190,225,0.9)'; ctx.lineWidth = 2;
      roundRect(ctx, -s * 0.5, s * 0.06, s * 1.0, s * 0.5, s * 0.12); ctx.stroke();
      const f = opts.armorFrac == null ? 1 : opts.armorFrac;
      if (f < 1) { ctx.fillStyle = 'rgba(20,26,34,0.55)'; roundRect(ctx, -s * 0.5 + s * f, s * 0.06, s * (1 - f), s * 0.5, s * 0.06); ctx.fill(); }
    }
    emblem(ctx, 0, s * 0.3, s * 0.15, PAL.spark, 8, Math.max(1, s * 0.05));

    // body outline
    ctx.lineWidth = 2.4; ctx.strokeStyle = PAL.clayDk; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.78, s * 0.9, 0, 0, TAU); ctx.stroke();

    // face — big eyes (pupils drift toward aim), brows, smile, blush
    const eyY = -s * 0.26;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-s * 0.28, eyY, s * 0.19, s * 0.25, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.28, eyY, s * 0.19, s * 0.25, 0, 0, TAU); ctx.fill();
    const gx = Math.cos(angle) * s * 0.05, gy = Math.sin(angle) * s * 0.05;
    ctx.fillStyle = PAL.ink;
    circle(ctx, -s * 0.28 + gx, eyY + gy, s * 0.11); ctx.fill();
    circle(ctx, s * 0.28 + gx, eyY + gy, s * 0.11); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    circle(ctx, -s * 0.31, eyY - s * 0.05, s * 0.045); ctx.fill();
    circle(ctx, s * 0.25, eyY - s * 0.05, s * 0.045); ctx.fill();
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = Math.max(1, s * 0.06); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.42, eyY - s * 0.33); ctx.lineTo(-s * 0.16, eyY - s * 0.27); ctx.moveTo(s * 0.16, eyY - s * 0.27); ctx.lineTo(s * 0.42, eyY - s * 0.33); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, eyY + s * 0.2, s * 0.14, 0.25, Math.PI - 0.25); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = 'rgba(239,154,134,0.55)';
    circle(ctx, -s * 0.42, eyY + s * 0.16, s * 0.09); ctx.fill();
    circle(ctx, s * 0.42, eyY + s * 0.16, s * 0.09); ctx.fill();

    // cap (dome + brim) + headset earcup
    ctx.fillStyle = '#2b313a';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.5, s * 0.5, s * 0.3, 0, 0, TAU); ctx.fill();
    roundRect(ctx, -s * 0.5, -s * 0.56, s * 1.0, s * 0.22, s * 0.1); ctx.fill();
    ctx.fillStyle = '#222a33'; ctx.beginPath(); ctx.ellipse(-s * 0.5, eyY, s * 0.12, s * 0.18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#39e0c0'; circle(ctx, -s * 0.5, eyY, s * 0.06); ctx.fill();

    // gun, aimed at the cursor
    aimGun(ctx, 0, s * 0.28, angle, s, body);

    ctx.restore();
  };

  /* ------------------------------- Enemies ------------------------------ */
  // Distinct front-facing critters per tier — instantly readable silhouettes.
  const ENEMY_SCALE = { scav: 1.35, raider: 1.5, boss: 1.95 };
  // Screen-space y of the sprite's visual top, where raid.js anchors the hp bar
  // / state icon (clears ears, helmet, horns and the per-tier upscale).
  Sprites.enemyTop = function (e) {
    const s = e.r * (ENEMY_SCALE[e.tier] || 1);
    const ext = e.tier === 'boss' ? 1.6 : e.tier === 'scav' ? 1.15 : 0.95;
    return e.y - s * ext - 4;
  };
  // light chest plate (front view) — shared "has armour" cue
  function chestPlate(ctx, s) {
    ctx.fillStyle = 'rgba(159,182,204,0.78)';
    roundRect(ctx, -s * 0.34, s * 0.12, s * 0.68, s * 0.34, s * 0.08); ctx.fill();
  }

  // scav → gas-mask scavenger: hooded, round goggles + filter canister, scrappy coat
  function drawScav(ctx, s, base, aim, armored) {
    // boots
    ctx.fillStyle = '#3f3a30';
    roundRect(ctx, -s * 0.4, s * 0.66, s * 0.32, s * 0.28, s * 0.06); ctx.fill();
    roundRect(ctx, s * 0.08, s * 0.66, s * 0.32, s * 0.28, s * 0.06); ctx.fill();
    // scrappy coat
    ctx.fillStyle = base; roundRect(ctx, -s * 0.56, -s * 0.18, s * 1.12, s * 0.96, s * 0.22); ctx.fill();
    ctx.fillStyle = mix(base, '#ffffff', 0.12); roundRect(ctx, -s * 0.18, -s * 0.1, s * 0.36, s * 0.8, s * 0.1); ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = mix(base, '#000000', 0.5); roundRect(ctx, -s * 0.56, -s * 0.18, s * 1.12, s * 0.96, s * 0.22); ctx.stroke();
    if (armored) chestPlate(ctx, s);
    ctx.strokeStyle = mix(base, '#000000', 0.5); ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.1); ctx.lineTo(s * 0.3, s * 0.5); ctx.stroke();
    // head + hood
    ctx.fillStyle = mix(base, '#000000', 0.18); ctx.beginPath(); ctx.ellipse(0, -s * 0.42, s * 0.52, s * 0.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = mix(base, '#000000', 0.42);
    ctx.beginPath(); ctx.arc(0, -s * 0.42, s * 0.54, Math.PI * 1.08, Math.PI * 1.92); ctx.lineTo(s * 0.4, -s * 0.42); ctx.arc(0, -s * 0.42, s * 0.2, 0, Math.PI, true); ctx.closePath(); ctx.fill();
    // mask plate
    ctx.fillStyle = '#8a8478'; ctx.beginPath(); ctx.ellipse(0, -s * 0.36, s * 0.4, s * 0.42, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2c2820'; ctx.lineWidth = 2; ctx.stroke();
    // goggle lenses
    ctx.fillStyle = PAL.ink;
    ctx.beginPath(); ctx.ellipse(-s * 0.18, -s * 0.46, s * 0.16, s * 0.16, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.18, -s * 0.46, s * 0.16, s * 0.16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7fe0e0';
    ctx.beginPath(); ctx.ellipse(-s * 0.18, -s * 0.46, s * 0.1, s * 0.1, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.18, -s * 0.46, s * 0.1, s * 0.1, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; circle(ctx, -s * 0.21, -s * 0.49, s * 0.04); ctx.fill(); circle(ctx, s * 0.15, -s * 0.49, s * 0.04); ctx.fill();
    // filter canister
    ctx.fillStyle = '#5b616c'; ctx.beginPath(); ctx.ellipse(0, -s * 0.16, s * 0.16, s * 0.14, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2c2820'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#2a2d34'; ctx.beginPath(); ctx.ellipse(0, -s * 0.16, s * 0.07, s * 0.06, 0, 0, TAU); ctx.fill();
    aimGun(ctx, 0, s * 0.2, aim, s, null);
  }

  // raider → armoured brute: pauldrons, broad torso, helmet w/ glowing visor slit
  function drawBrute(ctx, s, base, aim, armored) {
    ctx.fillStyle = '#222a33'; roundRect(ctx, -s * 0.5, s * 0.76, s * 0.36, s * 0.22, s * 0.05); ctx.fill(); roundRect(ctx, s * 0.14, s * 0.76, s * 0.36, s * 0.22, s * 0.05); ctx.fill();
    ctx.fillStyle = mix(base, '#2b3138', 0.55);
    ctx.beginPath(); ctx.ellipse(-s * 0.78, -s * 0.12, s * 0.34, s * 0.3, 0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.78, -s * 0.12, s * 0.34, s * 0.3, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = base; roundRect(ctx, -s * 0.62, -s * 0.28, s * 1.24, s * 1.06, s * 0.2); ctx.fill();
    ctx.fillStyle = mix(base, '#ffffff', 0.08); roundRect(ctx, -s * 0.5, -s * 0.18, s * 0.5, s * 0.86, s * 0.12); ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = mix(base, '#000000', 0.55); roundRect(ctx, -s * 0.62, -s * 0.28, s * 1.24, s * 1.06, s * 0.2); ctx.stroke();
    if (armored) { ctx.fillStyle = 'rgba(159,182,204,0.5)'; roundRect(ctx, -s * 0.4, s * 0.0, s * 0.8, s * 0.4, s * 0.1); ctx.fill(); }
    ctx.strokeStyle = mix(base, '#000000', 0.55); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.2); ctx.lineTo(0, s * 0.68); ctx.moveTo(-s * 0.5, s * 0.18); ctx.lineTo(s * 0.5, s * 0.18); ctx.stroke();
    ctx.fillStyle = '#2b3138'; roundRect(ctx, -s * 0.5, -s * 0.8, s * 1.0, s * 0.6, s * 0.18); ctx.fill();
    ctx.fillStyle = 'rgba(255,138,58,0.3)'; roundRect(ctx, -s * 0.46, -s * 0.58, s * 0.92, s * 0.2, s * 0.06); ctx.fill();
    ctx.fillStyle = '#ff8a3a'; roundRect(ctx, -s * 0.4, -s * 0.54, s * 0.8, s * 0.1, s * 0.04); ctx.fill();
    aimGun(ctx, 0, s * 0.18, aim, s, null);
  }

  // boss → demon: big curved horns, shoulder spikes, glowing eyes, fanged grin
  function drawDemon(ctx, s, base, aim, armored) {
    ctx.strokeStyle = '#3a1414'; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s * 0.5, s * 0.7); ctx.quadraticCurveTo(s * 1.2, s * 0.4, s * 1.0, -s * 0.3); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#3a1414'; ctx.beginPath(); ctx.moveTo(s * 1.0, -s * 0.3); ctx.lineTo(s * 1.2, -s * 0.45); ctx.lineTo(s * 1.1, -s * 0.12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#240a0a';
    ctx.beginPath(); ctx.ellipse(-s * 0.34, s * 0.88, s * 0.24, s * 0.15, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.34, s * 0.88, s * 0.24, s * 0.15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a0d0d';
    for (const sg of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sg * s * 0.32, -s * 0.58);
      ctx.quadraticCurveTo(sg * s * 0.9, -s * 1.1, sg * s * 0.66, -s * 1.4);
      ctx.quadraticCurveTo(sg * s * 0.58, -s * 1.0, sg * s * 0.18, -s * 0.62);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = base; ctx.beginPath(); ctx.ellipse(0, s * 0.02, s * 0.76, s * 0.9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = mix(base, '#ffffff', 0.13); ctx.beginPath(); ctx.ellipse(-s * 0.22, -s * 0.34, s * 0.5, s * 0.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#240a0a';
    for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sg * s * 0.6, -s * 0.1); ctx.lineTo(sg * s * 1.0, -s * 0.3); ctx.lineTo(sg * s * 0.62, s * 0.15); ctx.closePath(); ctx.fill(); }
    ctx.lineWidth = 2.6; ctx.strokeStyle = '#240a0a'; ctx.beginPath(); ctx.ellipse(0, s * 0.02, s * 0.76, s * 0.9, 0, 0, TAU); ctx.stroke();
    if (armored) chestPlate(ctx, s);
    ctx.fillStyle = 'rgba(255,74,74,0.35)';
    ctx.beginPath(); ctx.ellipse(-s * 0.28, -s * 0.18, s * 0.22, s * 0.16, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.28, -s * 0.18, s * 0.22, s * 0.16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff4a4a';
    ctx.beginPath(); ctx.moveTo(-s * 0.42, -s * 0.26); ctx.lineTo(-s * 0.14, -s * 0.18); ctx.lineTo(-s * 0.4, -s * 0.08); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * 0.42, -s * 0.26); ctx.lineTo(s * 0.14, -s * 0.18); ctx.lineTo(s * 0.4, -s * 0.08); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#240a0a'; roundRect(ctx, -s * 0.28, s * 0.16, s * 0.56, s * 0.18, s * 0.06); ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.12, s * 0.16); ctx.lineTo(i * s * 0.12 + s * 0.05, s * 0.3); ctx.lineTo(i * s * 0.12 - s * 0.05, s * 0.3); ctx.closePath(); ctx.fill(); }
    aimGun(ctx, 0, s * 0.3, aim, s * 1.05, null);
  }

  /** Enemy creature. Reads e.x/e.y/e.angle/e.r/e.color/e.tier/e.armorDur. */
  Sprites.enemy = function (ctx, e) {
    const s = e.r * (ENEMY_SCALE[e.tier] || 1);
    const base = e.color || '#6b6256';
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(e.x, e.y + s * 0.95, s * 0.8, s * 0.24, 0, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.tier === 'boss') drawDemon(ctx, s, base, e.angle, e.armorDur > 0);
    else if (e.tier === 'raider') drawBrute(ctx, s, base, e.angle, e.armorDur > 0);
    else drawScav(ctx, s, base, e.angle, e.armorDur > 0);
    ctx.restore();
  };

  /* ----------------------------- Containers ----------------------------- */
  // Each drawn ~26px around (c.x,c.y). Searched = dimmed + opened.
  const CONT = {
    crate: function (ctx, x, y, s, open) {
      const w = s, h = s * 0.86;
      ctx.fillStyle = open ? '#5b4730' : '#7a5a32';
      roundRect(ctx, x - w / 2, y - h / 2, w, h, 2); ctx.fill();
      ctx.strokeStyle = '#3a2c18'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = open ? '#46361f' : '#9a7142'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x + w / 2, y + h / 2);
      ctx.moveTo(x + w / 2, y - h / 2); ctx.lineTo(x - w / 2, y + h / 2);
      ctx.stroke();
      ctx.strokeRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4);
      if (open) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(ctx, x - w / 2 + 3, y - h / 2 + 3, w - 6, h * 0.4, 1); ctx.fill(); }
    },
    locker: function (ctx, x, y, s, open) {
      const w = s * 0.74, h = s;
      ctx.fillStyle = open ? '#3c4654' : '#566273';
      roundRect(ctx, x - w / 2, y - h / 2, w, h, 2); ctx.fill();
      ctx.strokeStyle = '#222a33'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#384350'; ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) { const vy = y - h / 2 + (h * i) / 4; ctx.beginPath(); ctx.moveTo(x - w / 2 + 3, vy); ctx.lineTo(x + w / 2 - 3, vy); ctx.stroke(); }
      ctx.fillStyle = '#cdd6e0'; roundRect(ctx, x + w / 2 - 5, y - 4, 2.5, 8, 1); ctx.fill();
      if (open) { ctx.strokeStyle = '#222a33'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x, y + h / 2); ctx.stroke(); }
    },
    medbox: function (ctx, x, y, s, open) {
      const w = s, h = s * 0.8;
      ctx.fillStyle = open ? '#9c9c9c' : '#eceff2';
      roundRect(ctx, x - w / 2, y - h / 2, w, h, 3); ctx.fill();
      ctx.strokeStyle = '#7d2222'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = open ? '#7d2222' : '#d63b3b';
      const t = s * 0.16, L = s * 0.42;
      ctx.fillRect(x - t / 2, y - L / 2, t, L);
      ctx.fillRect(x - L / 2, y - t / 2, L, t);
    },
    weaponrack: function (ctx, x, y, s, open) {
      const w = s, h = s * 0.9;
      ctx.fillStyle = open ? '#332c20' : '#4a4030';
      roundRect(ctx, x - w / 2, y - h / 2, w, h, 2); ctx.fill();
      ctx.strokeStyle = '#1f1a12'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = open ? '#564a37' : '#caa15a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const dy of [-s * 0.18, s * 0.18]) {
        ctx.beginPath(); ctx.moveTo(x - w * 0.32, y + dy + s * 0.1); ctx.lineTo(x + w * 0.30, y + dy - s * 0.04); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - w * 0.30, y + dy + s * 0.04); ctx.lineTo(x - w * 0.14, y + dy + s * 0.16); ctx.stroke();
      }
      ctx.lineCap = 'butt';
    },
    safe: function (ctx, x, y, s, open) {
      const w = s, h = s;
      ctx.fillStyle = open ? '#2a2e35' : '#3a3f47';
      roundRect(ctx, x - w / 2, y - h / 2, w, h, 3); ctx.fill();
      ctx.strokeStyle = '#15181d'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#586070'; ctx.lineWidth = 1.5; ctx.strokeRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6);
      ctx.fillStyle = open ? '#586070' : '#aeb8c6';
      circle(ctx, x, y, s * 0.18); ctx.fill();
      ctx.strokeStyle = '#15181d'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.1, y + Math.sin(a) * s * 0.1); ctx.lineTo(x + Math.cos(a) * s * 0.16, y + Math.sin(a) * s * 0.16); ctx.stroke(); }
    },
  };

  /** Loot container: c = {x,y,type,searched}. */
  Sprites.container = function (ctx, c) {
    const fn = CONT[c.type] || CONT.crate;
    ctx.save();
    if (c.searched) ctx.globalAlpha = 0.55;
    fn(ctx, c.x, c.y, 26, c.searched);
    ctx.restore();
    if (!c.searched) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(c.x - 9, c.y - 11, 3, 3);
    }
  };

  /* ----------------------------- Item icons ----------------------------- */
  // Shared vocabulary used both on the ground (canvas) and on DOM tiles (SVG).
  // Canvas version: draw a type/class icon centred at (cx,cy), fitting ~size px.
  function itemIconCanvas(ctx, def, cx, cy, size) {
    const col = def.color || '#cccccc';
    const s = size;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineJoin = 'round';
    switch (def.type) {
      case 'weapon': {
        const long = def.cls !== 'pistol';
        if (long) {
          ctx.fillStyle = PAL.steel; roundRect(ctx, -s * 0.46, -s * 0.09, s * 0.92, s * 0.18, 2); ctx.fill(); // barrel
          ctx.fillStyle = col; roundRect(ctx, -s * 0.46, -s * 0.15, s * 0.16, s * 0.32, 2); ctx.fill();       // stock (weapon colour)
          ctx.fillStyle = mix(col, '#000', 0.18); roundRect(ctx, -s * 0.30, 0.02, s * 0.15, s * 0.34, 1.5); ctx.fill(); // mag
          ctx.fillStyle = mix(col, '#fff', 0.25); roundRect(ctx, s * 0.10, -s * 0.18, s * 0.22, s * 0.09, 1.5); ctx.fill(); // sight rail
        } else {
          ctx.fillStyle = PAL.steel; roundRect(ctx, -s * 0.30, -s * 0.12, s * 0.62, s * 0.18, 2); ctx.fill(); // slide
          ctx.fillStyle = col; roundRect(ctx, -s * 0.22, 0.04, s * 0.16, s * 0.32, 2); ctx.fill();            // grip (weapon colour)
        }
        break;
      }
      case 'ammo': {
        ctx.fillStyle = col;
        for (let i = -1; i <= 1; i++) {
          const bx = i * s * 0.26;
          roundRect(ctx, bx - s * 0.08, -s * 0.26, s * 0.16, s * 0.5, s * 0.05); ctx.fill();
          ctx.fillStyle = mix(col, '#fff', 0.35);
          ctx.beginPath(); ctx.moveTo(bx - s * 0.08, -s * 0.26); ctx.lineTo(bx, -s * 0.4); ctx.lineTo(bx + s * 0.08, -s * 0.26); ctx.closePath(); ctx.fill();
          ctx.fillStyle = col;
        }
        break;
      }
      case 'armor': {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(-s * 0.34, -s * 0.30); ctx.lineTo(-s * 0.12, -s * 0.40); ctx.lineTo(s * 0.12, -s * 0.40); ctx.lineTo(s * 0.34, -s * 0.30);
        ctx.lineTo(s * 0.30, s * 0.26); ctx.lineTo(0, s * 0.42); ctx.lineTo(-s * 0.30, s * 0.26);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = mix(col, '#000', 0.4); ctx.lineWidth = Math.max(1, s * 0.04);
        ctx.beginPath(); ctx.moveTo(0, -s * 0.36); ctx.lineTo(0, s * 0.38); ctx.stroke();
        break;
      }
      case 'med': {
        ctx.fillStyle = '#f3f3f3'; roundRect(ctx, -s * 0.34, -s * 0.30, s * 0.68, s * 0.6, 3); ctx.fill();
        ctx.strokeStyle = mix(col, '#000', 0.1); ctx.lineWidth = Math.max(1, s * 0.05); ctx.stroke();
        ctx.fillStyle = col; const t = s * 0.13, L = s * 0.4;
        ctx.fillRect(-t / 2, -L / 2, t, L); ctx.fillRect(-L / 2, -t / 2, L, t);
        break;
      }
      case 'key': {
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * 0.1);
        circle(ctx, -s * 0.2, -s * 0.2, s * 0.18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.08); ctx.lineTo(s * 0.3, s * 0.3); ctx.lineTo(s * 0.3, s * 0.12); ctx.stroke();
        break;
      }
      default: { // valuable — a faceted gem
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.36); ctx.lineTo(s * 0.34, -s * 0.08); ctx.lineTo(0, s * 0.4); ctx.lineTo(-s * 0.34, -s * 0.08);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = mix(col, '#fff', 0.4);
        ctx.beginPath(); ctx.moveTo(0, -s * 0.36); ctx.lineTo(s * 0.34, -s * 0.08); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = mix(col, '#000', 0.35); ctx.lineWidth = Math.max(1, s * 0.04);
        ctx.beginPath(); ctx.moveTo(0, -s * 0.36); ctx.lineTo(0, s * 0.4); ctx.moveTo(-s * 0.34, -s * 0.08); ctx.lineTo(s * 0.34, -s * 0.08); ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Dropped loot: rounded tile carrying the type icon, tinted by rarity. */
  Sprites.groundItem = function (ctx, def, x, y, size) {
    const rc = (G.RARITY_COLOR && G.RARITY_COLOR[def.rarity]) || '#9aa3ad';
    ctx.fillStyle = 'rgba(14,16,20,0.82)';
    roundRect(ctx, x - size / 2, y - size / 2, size, size, size * 0.22); ctx.fill();
    ctx.strokeStyle = rc; ctx.lineWidth = 2;
    roundRect(ctx, x - size / 2, y - size / 2, size, size, size * 0.22); ctx.stroke();
    itemIconCanvas(ctx, def, x, y, size * 0.92);
  };

  G.Sprites = Sprites;

  /* =============================== Icons (SVG) =========================== */
  // Reuse the canvas vocabulary as SVG paths for crisp DOM tiles.
  function svgWrap(inner, vb) {
    return '<svg viewBox="0 0 ' + (vb || 32) + ' ' + (vb || 32) + '" width="100%" height="100%" ' +
      'preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" ' +
      'fill="none" stroke-linejoin="round" stroke-linecap="round">' + inner + '</svg>';
  }
  function dark(col, t) { const c = hexToRgb(col); const k = 1 - t; return 'rgb(' + (c[0] * k | 0) + ',' + (c[1] * k | 0) + ',' + (c[2] * k | 0) + ')'; }
  function lite(col, t) { const c = hexToRgb(col); return 'rgb(' + (c[0] + (255 - c[0]) * t | 0) + ',' + (c[1] + (255 - c[1]) * t | 0) + ',' + (c[2] + (255 - c[2]) * t | 0) + ')'; }

  const Icons = {
    // item icon as an inline SVG string (32x32 viewBox), tinted by def.color.
    itemSVG(id) {
      const def = G.getItem(id); if (!def) return '';
      const col = def.color || '#cccccc';
      let g = '';
      switch (def.type) {
        case 'weapon':
          if (def.cls === 'pistol') {
            g = '<rect x="6" y="12" width="15" height="5" rx="1.5" fill="' + PAL.steel + '"/>' +
              '<rect x="8" y="16" width="5" height="9" rx="1.5" fill="' + col + '"/>' +
              '<rect x="6" y="11" width="7" height="2" rx="1" fill="' + lite(col, 0.3) + '"/>';
          } else {
            g = '<rect x="3" y="14" width="24" height="4.5" rx="2" fill="' + PAL.steel + '"/>' +
              '<rect x="3" y="12.5" width="6" height="8.5" rx="1.5" fill="' + col + '"/>' +
              '<rect x="11" y="18.5" width="5" height="8" rx="1.5" fill="' + dark(col, 0.18) + '"/>' +
              '<rect x="18" y="10.5" width="7" height="2.6" rx="1" fill="' + lite(col, 0.25) + '"/>';
          }
          break;
        case 'ammo':
          g = [8, 16, 24].map(function (cx) {
            return '<path d="M' + (cx - 2.5) + ' 9 L' + cx + ' 5 L' + (cx + 2.5) + ' 9 Z" fill="' + lite(col, 0.4) + '"/>' +
              '<rect x="' + (cx - 2.5) + '" y="9" width="5" height="16" rx="1" fill="' + col + '"/>' +
              '<rect x="' + (cx - 2.5) + '" y="20" width="5" height="5" rx="1" fill="' + dark(col, 0.25) + '"/>';
          }).join('');
          break;
        case 'armor':
          g = '<path d="M6 8 L12 5 L20 5 L26 8 L24 22 L16 27 L8 22 Z" fill="' + col + '" stroke="' + dark(col, 0.4) + '" stroke-width="1.4"/>' +
            '<path d="M16 5 L16 27" stroke="' + dark(col, 0.4) + '" stroke-width="1.3"/>' +
            '<path d="M9 11 L23 11" stroke="' + dark(col, 0.4) + '" stroke-width="1.1"/>';
          break;
        case 'med':
          g = '<rect x="6" y="7" width="20" height="18" rx="3" fill="#f3f3f3" stroke="' + dark(col, 0.1) + '" stroke-width="1.6"/>' +
            '<rect x="14" y="10" width="4" height="12" rx="1" fill="' + col + '"/>' +
            '<rect x="10" y="14" width="12" height="4" rx="1" fill="' + col + '"/>';
          break;
        case 'key':
          g = '<circle cx="11" cy="11" r="5" stroke="' + col + '" stroke-width="3"/>' +
            '<path d="M14 14 L25 25 M25 20 L25 25 L20 25" stroke="' + col + '" stroke-width="3"/>';
          break;
        default:
          g = '<path d="M16 4 L27 13 L16 29 L5 13 Z" fill="' + col + '" stroke="' + dark(col, 0.35) + '" stroke-width="1.3"/>' +
            '<path d="M16 4 L27 13 L16 16 Z" fill="' + lite(col, 0.45) + '"/>' +
            '<path d="M5 13 L27 13 M16 4 L16 29" stroke="' + dark(col, 0.3) + '" stroke-width="1"/>';
      }
      return svgWrap(g);
    },

    // The Claude radiating spark — used as the brand logo.
    spark(color) {
      color = color || PAL.clay;
      let rays = '';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU, c = Math.cos(a), s = Math.sin(a);
        rays += '<line x1="' + (16 + c * 4).toFixed(2) + '" y1="' + (16 + s * 4).toFixed(2) +
          '" x2="' + (16 + c * 14).toFixed(2) + '" y2="' + (16 + s * 14).toFixed(2) + '" />';
      }
      return svgWrap('<g stroke="' + color + '" stroke-width="2.4">' + rays + '</g>');
    },
  };
  G.Icons = Icons;

})();
