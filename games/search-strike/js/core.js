/* =========================================================================
 * core.js — Engine layer
 * Namespace, math utils, seeded RNG, input (keyboard/mouse/touch),
 * synthesized audio, particle system, camera.
 * No external dependencies. Loaded as a classic <script> before everything.
 * ========================================================================= */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  const TAU = Math.PI * 2;
  // Safe-area insets (notch / home indicator), populated from CSS env() at runtime.
  G.safe = { t: 0, r: 0, b: 0, l: 0 };

  /* ----------------------------- Utils ---------------------------------- */
  const Utils = {
    TAU,
    clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp(a, b, t) { return a + (b - a) * t; },
    approach(a, b, d) { return a < b ? Math.min(a + d, b) : Math.max(a - d, b); },
    dist2(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; },
    dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); },
    angle(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); },
    angleDiff(a, b) { let d = (b - a) % TAU; if (d < -Math.PI) d += TAU; if (d > Math.PI) d -= TAU; return d; },
    rand(a, b) { return b === undefined ? Math.random() * a : a + Math.random() * (b - a); },
    randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    chance(p) { return Math.random() < p; },
    choice(arr) { return arr[(Math.random() * arr.length) | 0]; },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    },
    // weighted pick: items = [{w, ...}], returns one item
    weighted(items) {
      let total = 0;
      for (const it of items) total += it.w || 1;
      let r = Math.random() * total;
      for (const it of items) { r -= it.w || 1; if (r <= 0) return it; }
      return items[items.length - 1];
    },
    uuid() { return 'x' + (Date.now().toString(36)) + Math.floor(Math.random() * 1e9).toString(36); },
    formatNum(n) {
      n = Math.round(n);
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    aabb(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },
    // smooth easing
    easeOut(t) { return 1 - (1 - t) * (1 - t); },
  };
  G.Utils = Utils;

  /* ------------------------ Seeded RNG (mulberry32) --------------------- */
  G.RNG = function (seed) {
    let s = (seed >>> 0) || 1;
    const fn = function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    fn.range = (a, b) => a + fn() * (b - a);
    fn.int = (a, b) => Math.floor(a + fn() * (b - a + 1));
    fn.chance = (p) => fn() < p;
    fn.choice = (arr) => arr[(fn() * arr.length) | 0];
    fn.shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = (fn() * (i + 1)) | 0; const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    };
    return fn;
  };

  /* ----------------------------- Input ---------------------------------- */
  // Unified input for keyboard + mouse + touch. The raid reads high-level
  // queries (moveVec, firing, pointer, action edges). Canvas HUD buttons are
  // registered as rectangular hit regions and can be triggered by touch.
  const Input = {
    canvas: null,
    keys: new Set(),
    _pressed: new Set(),     // keys pressed this frame (edge)
    mouse: { x: 0, y: 0, down: false, right: false },
    _mouseEdge: false,
    // Virtual sticks (mobile)
    leftStick: { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0, mag: 0 },
    rightStick: { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0, mag: 0 },
    touchEnabled: false,
    buttons: {},             // name -> {x,y,w,h, down, pressed, _wasDown}
    _actionQueue: new Set(), // discrete actions fired this frame (from keys+buttons)
    screenW: 0, screenH: 0,

    init(canvas) {
      this.canvas = canvas;
      const self = this;

      window.addEventListener('keydown', (e) => {
        const k = self._normKey(e);
        if (!self.keys.has(k)) self._pressed.add(k);
        self.keys.add(k);
        // map key -> action edges handled in update()
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) e.preventDefault();
      });
      window.addEventListener('keyup', (e) => { self.keys.delete(self._normKey(e)); });
      window.addEventListener('blur', () => { self.keys.clear(); });

      canvas.addEventListener('mousemove', (e) => {
        // genuine mouse activity returns us to desktop mode (ignore synthetic moves during a touch drag)
        if (!self.leftStick.active && !self.rightStick.active) self.touchEnabled = false;
        const r = canvas.getBoundingClientRect();
        self.mouse.x = e.clientX - r.left;
        self.mouse.y = e.clientY - r.top;
      });
      canvas.addEventListener('mousedown', (e) => {
        self.touchEnabled = false;
        if (e.button === 0) { self.mouse.down = true; self._mouseEdge = true; }
        if (e.button === 2) self.mouse.right = true;
      });
      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) self.mouse.down = false;
        if (e.button === 2) self.mouse.right = false;
      });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      // ---- Touch ----
      const onTouch = (e) => {
        e.preventDefault();
        self.touchEnabled = true;
        const r = canvas.getBoundingClientRect();
        // sync currently active touches
        const active = new Map();
        for (let i = 0; i < e.touches.length; i++) {
          const t = e.touches[i];
          active.set(t.identifier, { x: t.clientX - r.left, y: t.clientY - r.top });
        }
        self._processTouches(active);
      };
      canvas.addEventListener('touchstart', onTouch, { passive: false });
      canvas.addEventListener('touchmove', onTouch, { passive: false });
      canvas.addEventListener('touchend', onTouch, { passive: false });
      canvas.addEventListener('touchcancel', onTouch, { passive: false });

      // block multi-finger pinch-zoom anywhere (incl. over DOM menus) without
      // breaking single-finger menu scrolling
      document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
      document.addEventListener('gesturestart', (e) => e.preventDefault());
    },

    _normKey(e) {
      let k = e.key.toLowerCase();
      if (k === 'spacebar') k = ' ';
      return k;
    },

    _processTouches(active) {
      const half = this.screenW / 2;
      // Track which touches belong to sticks/buttons; rebuild each event.
      const ls = this.leftStick, rs = this.rightStick;

      // release sticks whose touch ended
      if (ls.active && !active.has(ls.id)) { ls.active = false; ls.dx = ls.dy = ls.mag = 0; }
      if (rs.active && !active.has(rs.id)) { rs.active = false; rs.dx = rs.dy = rs.mag = 0; }

      // button down map (rebuilt)
      const btnDown = {};

      active.forEach((p, id) => {
        // a touch already steering a stick keeps it — even if it sweeps over a
        // button — so dragging the aim thumb across the action row can't freeze
        // aim or fire a spurious action
        if (ls.active && ls.id === id) { this._updateStick(ls, p); return; }
        if (rs.active && rs.id === id) { this._updateStick(rs, p); return; }

        // un-owned touch: a HUD button takes priority over starting a new stick
        let onBtn = null;
        for (const name in this.buttons) {
          const b = this.buttons[name];
          if (b.x !== undefined && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
            onBtn = name; break;
          }
        }
        if (onBtn) { btnDown[onBtn] = true; return; }

        // otherwise assign to a free stick by screen side
        if (p.x < half && !ls.active) { ls.active = true; ls.id = id; ls.ox = p.x; ls.oy = p.y; this._updateStick(ls, p); }
        else if (p.x >= half && !rs.active) { rs.active = true; rs.id = id; rs.ox = p.x; rs.oy = p.y; this._updateStick(rs, p); }
      });

      // apply button states
      for (const name in this.buttons) {
        const b = this.buttons[name];
        b.down = !!btnDown[name];
      }
    },

    _updateStick(s, p) {
      const dx = p.x - s.ox, dy = p.y - s.oy;
      const max = 70;
      let mag = Math.hypot(dx, dy);
      if (mag > max) { const k = max / mag; s.ox = p.x - dx * k; s.oy = p.y - dy * k; }
      mag = Math.min(mag, max);
      s.dx = mag > 0.001 ? dx / Math.max(Math.hypot(dx, dy), 0.001) : 0;
      s.dy = mag > 0.001 ? dy / Math.max(Math.hypot(dx, dy), 0.001) : 0;
      s.mag = mag / max;
    },

    // Register a HUD button rect (called by raid each frame as layout changes)
    setButton(name, x, y, w, h) {
      let b = this.buttons[name];
      if (!b) b = this.buttons[name] = { down: false, _wasDown: false, pressed: false };
      b.x = x; b.y = y; b.w = w; b.h = h;
    },
    clearButtons() { this.buttons = {}; },

    // Force-release all touch state. Called when a DOM overlay opens/closes so a
    // finger held at that moment can't leak a frozen stick / latched button on resume.
    resetTouch() {
      const ls = this.leftStick, rs = this.rightStick;
      ls.active = false; ls.id = -1; ls.dx = ls.dy = ls.mag = 0;
      rs.active = false; rs.id = -1; rs.dx = rs.dy = rs.mag = 0;
      for (const name in this.buttons) { const b = this.buttons[name]; b.down = false; b._wasDown = false; b.pressed = false; }
      this._actionQueue.clear();
    },

    // Called once per frame AFTER reading inputs to compute edges.
    update() {
      // button edges
      for (const name in this.buttons) {
        const b = this.buttons[name];
        b.pressed = b.down && !b._wasDown;
        b._wasDown = b.down;
        if (b.pressed) this._actionQueue.add(name);
      }
    },
    // Called at very end of frame to clear per-frame state.
    lateUpdate() {
      this._pressed.clear();
      this._mouseEdge = false;
      this._actionQueue.clear();
    },

    isDown(k) { return this.keys.has(k); },
    wasPressed(k) { return this._pressed.has(k); },
    mousePressed() { return this._mouseEdge; },

    // High-level movement vector from WASD or left stick. Returns {x,y} (not normalized beyond 1).
    moveVec() {
      if (this.leftStick.active && this.leftStick.mag > 0.12) {
        return { x: this.leftStick.dx * this.leftStick.mag, y: this.leftStick.dy * this.leftStick.mag };
      }
      let x = 0, y = 0;
      if (this.isDown('w') || this.isDown('arrowup')) y -= 1;
      if (this.isDown('s') || this.isDown('arrowdown')) y += 1;
      if (this.isDown('a') || this.isDown('arrowleft')) x -= 1;
      if (this.isDown('d') || this.isDown('arrowright')) x += 1;
      const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
      return { x, y };
    },

    // True if the player should fire this frame.
    firing() {
      if (this.touchEnabled) return this.rightStick.active && this.rightStick.mag > 0.55;
      return this.mouse.down;
    },
    // Aim: returns either {mode:'point', x, y} (mouse world pos handled by raid)
    // or {mode:'dir', dx, dy}. Raid resolves to an angle.
    aimDir() {
      if (this.touchEnabled && this.rightStick.active && this.rightStick.mag > 0.2) {
        return { mode: 'dir', dx: this.rightStick.dx, dy: this.rightStick.dy };
      }
      return { mode: 'point' };
    },

    // discrete action: name from key mapping or button press.
    consumeAction(name) {
      if (this._actionQueue.has(name)) { this._actionQueue.delete(name); return true; }
      return false;
    },
    // map a key to an action queue entry (called by raid for desktop keys)
    queueKeyActions(map) {
      for (const k in map) { if (this.wasPressed(k)) this._actionQueue.add(map[k]); }
    },
  };
  G.Input = Input;

  /* ----------------------------- Audio ---------------------------------- */
  // Per-scene ambient beds — a low drone (oscillators) plus a slowly-swelling
  // filtered-noise layer. All synthesized; keyed by location id.
  const AMBIENCE = {
    depot: { vol: 0.15, osc: [{ type: 'sine', freq: 55, gain: 0.5 }, { type: 'sine', freq: 82.5, gain: 0.16 }], noise: { filter: 'lowpass', freq: 360, q: 0.6, gain: 0.10, lfo: 0.07 } },
    factory: { vol: 0.17, osc: [{ type: 'sawtooth', freq: 41, gain: 0.20 }, { type: 'square', freq: 62, gain: 0.05, vib: { rate: 0.6, depth: 3 } }], noise: { filter: 'bandpass', freq: 520, q: 0.8, gain: 0.12, lfo: 0.5 } },
    labs: { vol: 0.14, osc: [{ type: 'sine', freq: 70, gain: 0.35 }, { type: 'sine', freq: 208, gain: 0.05, vib: { rate: 0.18, depth: 4 } }], noise: { filter: 'bandpass', freq: 1600, q: 1.4, gain: 0.05, lfo: 0.13 } },
    _default: { vol: 0.14, osc: [{ type: 'sine', freq: 60, gain: 0.4 }], noise: { filter: 'lowpass', freq: 400, q: 0.6, gain: 0.08, lfo: 0.1 } },
  };

  // Lightweight WebAudio synth — no asset files. All sounds generated.
  const Audio = {
    ctx: null,
    master: null,
    enabled: true,
    volume: 0.6,
    _noiseBuf: null,
    _lastFootstep: 0,
    _ambient: null,

    ensure() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
        // noise buffer
        const len = this.ctx.sampleRate * 1;
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this._noiseBuf = buf;
      } catch (e) { this.enabled = false; }
    },
    setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; },
    setEnabled(b) { this.enabled = b; },

    _osc(type, freq, t0, dur, gain, slideTo) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.02);
    },
    _noise(t0, dur, gain, filterFreq, q) {
      const c = this.ctx, src = c.createBufferSource(), g = c.createGain();
      src.buffer = this._noiseBuf;
      const f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = filterFreq || 1200; f.Q.value = q || 1;
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t0); src.stop(t0 + dur + 0.02);
    },

    play(name, opts) {
      if (!this.enabled) return;
      this.ensure();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      opts = opts || {};
      const vol = opts.vol === undefined ? 1 : opts.vol;
      switch (name) {
        case 'shoot':
          this._noise(t, 0.08, 0.5 * vol, 1800, 0.6);
          this._osc('sawtooth', 320, t, 0.07, 0.18 * vol, 80);
          break;
        case 'shoot_smg':
          this._noise(t, 0.05, 0.35 * vol, 2400, 0.8);
          this._osc('square', 420, t, 0.05, 0.12 * vol, 120);
          break;
        case 'shoot_rifle':
          this._noise(t, 0.11, 0.6 * vol, 1400, 0.5);
          this._osc('sawtooth', 220, t, 0.1, 0.25 * vol, 60);
          break;
        case 'shoot_shotgun':
          this._noise(t, 0.16, 0.7 * vol, 900, 0.4);
          this._osc('sawtooth', 140, t, 0.14, 0.3 * vol, 50);
          break;
        case 'enemy_shoot':
          this._noise(t, 0.07, 0.22 * vol, 1000, 0.7);
          this._osc('sawtooth', 200, t, 0.06, 0.1 * vol, 70);
          break;
        case 'hit_flesh':
          this._noise(t, 0.12, 0.45 * vol, 350, 1.2);
          this._osc('sine', 120, t, 0.1, 0.2 * vol, 40);
          break;
        case 'hit_wall':
          this._noise(t, 0.04, 0.25 * vol, 3000, 2);
          break;
        case 'hurt':
          this._osc('triangle', 300, t, 0.18, 0.25 * vol, 120);
          this._noise(t, 0.1, 0.2 * vol, 500, 1);
          break;
        case 'reload':
          this._noise(t, 0.03, 0.3 * vol, 2500, 3);
          this._noise(t + 0.16, 0.04, 0.35 * vol, 1800, 3);
          break;
        case 'empty':
          this._noise(t, 0.02, 0.25 * vol, 4000, 4);
          break;
        case 'pickup':
          this._osc('square', 600, t, 0.06, 0.18 * vol, 900);
          this._osc('square', 900, t + 0.06, 0.07, 0.16 * vol, 1300);
          break;
        case 'heal':
          this._osc('sine', 500, t, 0.12, 0.2 * vol, 760);
          this._osc('sine', 760, t + 0.1, 0.16, 0.18 * vol, 1000);
          break;
        case 'footstep': {
          if (t - this._lastFootstep < 0.18) return;
          this._lastFootstep = t;
          this._noise(t, 0.05, 0.12 * vol, 280, 1.4);
          break;
        }
        case 'death':
          this._osc('sawtooth', 300, t, 0.5, 0.3 * vol, 60);
          this._noise(t, 0.4, 0.25 * vol, 400, 0.8);
          break;
        case 'click':
          this._osc('square', 700, t, 0.04, 0.12 * vol, 700);
          break;
        case 'search':
          this._noise(t, 0.04, 0.12 * vol, 1500, 2);
          break;
        case 'extract':
          [523, 659, 784, 1046].forEach((f, i) => this._osc('triangle', f, t + i * 0.09, 0.18, 0.2 * vol, f));
          break;
        case 'alarm':
          this._osc('square', 440, t, 0.2, 0.15 * vol, 440);
          this._osc('square', 330, t + 0.22, 0.2, 0.15 * vol, 330);
          break;
        case 'cash':
          [660, 880].forEach((f, i) => this._osc('square', f, t + i * 0.05, 0.1, 0.16 * vol, f * 1.2));
          break;
      }
    },

    // Start a looping scene ambience for a location id (e.g. 'depot'/'factory'/'labs').
    // Safe to call repeatedly — replaces any current bed. No-op when muted.
    startAmbient(type) {
      if (!this.enabled) return;
      this.ensure();
      if (!this.ctx) return;
      this.stopAmbient(true);
      const c = this.ctx, t = c.currentTime;
      const cfg = AMBIENCE[type] || AMBIENCE._default;
      const sources = [];
      let out = null;
      // Build every node inside a guard: if any step throws, the partially-built
      // graph is torn down so orphaned oscillators can't run (and leak) forever.
      try {
        out = c.createGain();
        out.gain.setValueAtTime(0.0001, t);
        out.connect(this.master);
        for (const o of cfg.osc) {
          const osc = c.createOscillator(); osc.type = o.type; osc.frequency.value = o.freq;
          const g = c.createGain(); g.gain.value = o.gain;
          osc.connect(g); g.connect(out); osc.start(t); sources.push(osc);
          if (o.vib) {
            const lfo = c.createOscillator(); lfo.frequency.value = o.vib.rate;
            const lg = c.createGain(); lg.gain.value = o.vib.depth;
            lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); sources.push(lfo);
          }
        }
        if (cfg.noise && this._noiseBuf) {
          const src = c.createBufferSource(); src.buffer = this._noiseBuf; src.loop = true;
          const f = c.createBiquadFilter(); f.type = cfg.noise.filter || 'bandpass';
          f.frequency.value = cfg.noise.freq; f.Q.value = cfg.noise.q || 0.7;
          const g = c.createGain(); g.gain.value = cfg.noise.gain;
          src.connect(f); f.connect(g); g.connect(out); src.start(t); sources.push(src);
          // slow swell so the bed breathes instead of sitting flat
          const lfo = c.createOscillator(); lfo.frequency.value = cfg.noise.lfo || 0.1;
          const lg = c.createGain(); lg.gain.value = cfg.noise.gain * 0.7;
          lfo.connect(lg); lg.connect(g.gain); lfo.start(t); sources.push(lfo);
        }
        out.gain.exponentialRampToValueAtTime(cfg.vol, t + 2.5);
        this._ambient = { out, sources };
      } catch (e) {
        for (const s of sources) { try { s.stop(t + 0.05); } catch (_) {} }
        try { if (out) out.disconnect(); } catch (_) {}
        this._ambient = null;
      }
    },

    stopAmbient(immediate) {
      const a = this._ambient;
      if (!a) return;
      this._ambient = null;
      const c = this.ctx; if (!c) return;
      let end;
      try {
        const t = c.currentTime;
        end = immediate ? t + 0.05 : t + 0.6;
        a.out.gain.cancelScheduledValues(t);
        a.out.gain.setValueAtTime(Math.max(0.0001, a.out.gain.value || 0.0001), t);
        a.out.gain.exponentialRampToValueAtTime(0.0001, end);
      } catch (e) {}
      // stop sources regardless of whether the ramp scheduling above succeeded
      for (const s of a.sources) { try { end !== undefined ? s.stop(end + 0.05) : s.stop(); } catch (e) {} }
    },
  };
  G.Audio = Audio;

  /* --------------------------- Particles -------------------------------- */
  function Particles() {
    this.list = [];
  }
  Particles.prototype = {
    clear() { this.list.length = 0; },
    spawn(x, y, opts) {
      this.list.push({
        x, y,
        vx: opts.vx || 0, vy: opts.vy || 0,
        life: opts.life || 0.5, max: opts.life || 0.5,
        size: opts.size || 3, color: opts.color || '#fff',
        drag: opts.drag === undefined ? 0.9 : opts.drag,
        grav: opts.grav || 0,
        shrink: opts.shrink !== false,
        glow: !!opts.glow,
      });
    },
    burst(x, y, n, opts) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const sp = Utils.rand(opts.spdMin || 30, opts.spdMax || 160);
        this.spawn(x, y, Object.assign({}, opts, {
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: Utils.rand((opts.life || 0.5) * 0.6, opts.life || 0.5),
          size: Utils.rand((opts.size || 3) * 0.6, opts.size || 3),
        }));
      }
    },
    blood(x, y, dir) {
      for (let i = 0; i < 8; i++) {
        const a = (dir || Math.random() * TAU) + Utils.rand(-0.7, 0.7);
        const sp = Utils.rand(40, 220);
        this.spawn(x, y, {
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: Utils.rand(0.3, 0.7), size: Utils.rand(2, 5),
          color: Utils.choice(['#b81414', '#8e0e0e', '#d12020']), drag: 0.86,
        });
      }
    },
    muzzle(x, y, ang) {
      for (let i = 0; i < 5; i++) {
        const a = ang + Utils.rand(-0.25, 0.25);
        const sp = Utils.rand(120, 300);
        this.spawn(x, y, {
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: Utils.rand(0.05, 0.13), size: Utils.rand(2, 5),
          color: Utils.choice(['#ffd86b', '#ffae3c', '#fff1c2']), drag: 0.8, glow: true,
        });
      }
    },
    update(dt) {
      const l = this.list;
      for (let i = l.length - 1; i >= 0; i--) {
        const p = l[i];
        p.life -= dt;
        if (p.life <= 0) { l.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += p.grav * dt;
        const d = Math.pow(p.drag, dt * 60);
        p.vx *= d; p.vy *= d;
      }
    },
    draw(ctx) {
      const l = this.list;
      // non-glow first, then glow particles in a single additive ('lighter') pass —
      // avoids toggling the expensive shadowBlur per primitive.
      for (let pass = 0; pass < 2; pass++) {
        const glowPass = pass === 1;
        let opened = false;
        for (let i = 0; i < l.length; i++) {
          const p = l[i];
          if (!!p.glow !== glowPass) continue;
          if (glowPass && !opened) { ctx.globalCompositeOperation = 'lighter'; opened = true; }
          const a = Utils.clamp(p.life / p.max, 0, 1);
          const s = p.shrink ? p.size * a : p.size;
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        }
        if (glowPass && opened) ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    },
  };
  G.Particles = Particles;

  /* ----------------------------- Camera --------------------------------- */
  function Camera() {
    this.x = 0; this.y = 0; this.shakeAmt = 0; this.shakeT = 0;
    this.ox = 0; this.oy = 0; // current shake offset
    this.vw = 0; this.vh = 0; this.zoom = 1;
  }
  Camera.prototype = {
    setViewport(w, h) { this.vw = w; this.vh = h; },
    follow(tx, ty, dt, bounds) {
      const lead = 0.12;
      this.x = Utils.lerp(this.x, tx, 1 - Math.pow(1 - lead, dt * 60 * 0.5 + 0.5));
      this.y = Utils.lerp(this.y, ty, 1 - Math.pow(1 - lead, dt * 60 * 0.5 + 0.5));
      if (bounds) {
        const hw = this.vw / (2 * this.zoom), hh = this.vh / (2 * this.zoom);
        if (bounds.w > this.vw / this.zoom) this.x = Utils.clamp(this.x, hw, bounds.w - hw);
        else this.x = bounds.w / 2;
        if (bounds.h > this.vh / this.zoom) this.y = Utils.clamp(this.y, hh, bounds.h - hh);
        else this.y = bounds.h / 2;
      }
      // shake
      if (this.shakeT > 0) {
        this.shakeT -= dt;
        const k = this.shakeAmt * (this.shakeT > 0 ? this.shakeT / this.shakeMax : 0);
        this.ox = Utils.rand(-k, k); this.oy = Utils.rand(-k, k);
      } else { this.ox = 0; this.oy = 0; }
    },
    shake(amt, dur) {
      if (amt > this.shakeAmt || this.shakeT <= 0) { this.shakeAmt = amt; this.shakeMax = dur || 0.3; this.shakeT = dur || 0.3; }
    },
    apply(ctx) {
      ctx.translate(this.vw / 2, this.vh / 2);
      ctx.scale(this.zoom, this.zoom);
      ctx.translate(-this.x + this.ox, -this.y + this.oy);
    },
    screenToWorld(sx, sy) {
      return {
        x: (sx - this.vw / 2) / this.zoom + this.x - this.ox,
        y: (sy - this.vh / 2) / this.zoom + this.y - this.oy,
      };
    },
  };
  G.Camera = Camera;

})();
