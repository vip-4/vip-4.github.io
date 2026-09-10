/* =========================================================================
 * main.js — Bootstrap, game state machine, render loop, host wiring.
 * ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const U = G.Utils;

  const Game = {
    canvas: null, ctx: null,
    w: 0, h: 0,
    state: 'menu',          // 'menu' (DOM screens) | 'raid'
    raid: null,
    carriedValue: 0,
    lastT: 0,
    _bgT: 0,

    init() {
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas.getContext('2d');
      G.Input.init(this.canvas);
      try { G.Profile.load(); } catch (e) { console.error('[save load failed — resetting]', e); G.Profile.resetAll(); }
      G.UI.init(this);
      this.resize();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));

      // unlock audio on first interaction
      const unlock = () => { G.Audio.ensure(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); window.removeEventListener('touchstart', unlock); };
      window.addEventListener('pointerdown', unlock);
      window.addEventListener('keydown', unlock);
      window.addEventListener('touchstart', unlock);

      // auto-pause on tab hide; resume the audio context on return
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.state === 'raid' && this.raid && !this.raid.paused && !this.raid.result) {
            this.raid.paused = true; this.raid.onPause();
          }
          if (G.Audio.ctx && G.Audio.ctx.suspend) G.Audio.ctx.suspend();
        } else {
          this.lastT = performance.now();
          G.Audio.ensure();
        }
      });
      window.addEventListener('focus', () => G.Audio.ensure());

      // last-resort recovery: never leave the player on a frozen black screen
      window.addEventListener('error', (e) => {
        console.error('[game error]', (e && (e.error || e.message)) || e);
        if (this.state === 'raid') { try { G.Audio.stopAmbient(true); this.raid = null; this.state = 'menu'; G.UI.show(); G.UI.showHub(); } catch (_) {} }
      });
      window.addEventListener('unhandledrejection', (e) => console.error('[unhandled rejection]', e && e.reason));

      if (G.Profile.data.seenIntro) G.UI.showHub(); else G.UI.showIntro();
      this.lastT = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    },

    resize() {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      // render at device-pixel resolution for crisp output on retina / mobile, while
      // keeping logical (CSS-pixel) w/h for all game math, HUD and input.
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.canvas.style.width = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); // must follow width/height (which reset it)
      this._readSafeArea();
    },

    _readSafeArea() {
      const el = document.getElementById('safe-probe');
      if (!el) return;
      const cs = getComputedStyle(el);
      G.safe = {
        t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0,
        b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0,
      };
    },

    /* ---- host API used by UI ---- */
    startRaid(loc, carried) {
      this.carriedValue = computeCarriedValue(carried);
      this.raid = new G.Raid(loc, carried);
      this.raid.onPause = () => G.UI.openPause(this.raid);
      this.raid.onInventory = () => G.UI.openRaidInventory(this.raid);
      this.raid.onFinish = (res) => this.finishRaid(res);
      G.UI.hideAll();
      this.state = 'raid';
      G.Audio.startAmbient(loc && loc.id);   // per-scene background ambience
    },

    finishRaid(res) {
      G.Audio.stopAmbient();
      const p = this.raid.player;
      let ex = null;
      if (res.outcome === 'extract') { ex = G.Profile.commitExtract(p, this.raid.scav); G.Profile.recordRaid(res); }
      else G.Profile.commitDeath(p);
      this.state = 'menu';
      G.UI.show();
      G.UI.showResults(res, { carriedValue: this.carriedValue, extract: ex });
    },

    toHub() { G.Audio.stopAmbient(); this.raid = null; this.state = 'menu'; G.UI.showHub(); },

    /* ---- main loop ---- */
    loop(t) {
      try {
        let dt = (t - this.lastT) / 1000;
        this.lastT = t;
        if (dt > 0.1) dt = 0.1;     // avoid huge jumps after tab-out
        const ctx = this.ctx, w = this.w, h = this.h;
        // re-establish the clean DPR base each frame (also recovers from any
        // unbalanced save/restore left by a previously thrown draw)
        ctx.setTransform(this.dpr || 1, 0, 0, this.dpr || 1, 0, 0);

        if (this.state === 'raid' && this.raid) {
          this.raid.update(dt, w, h);
          if (this.state === 'raid' && this.raid) this.raid.draw(ctx, w, h);
          else this.drawMenuBg(dt);
        } else {
          this.drawMenuBg(dt);
        }
        G.Input.lateUpdate();
      } catch (e) {
        // a thrown frame must never kill the rAF chain — recover to the hub
        console.error('[loop error]', e);
        if (this.state === 'raid') { try { G.Audio.stopAmbient(true); this.raid = null; this.state = 'menu'; G.UI.show(); G.UI.showHub(); } catch (_) {} }
        try {
          const ctx = this.ctx;
          ctx.setTransform(this.dpr || 1, 0, 0, this.dpr || 1, 0, 0);
          ctx.fillStyle = '#0a0c0f'; ctx.fillRect(0, 0, this.w, this.h);
        } catch (_) {}
      } finally {
        requestAnimationFrame((tt) => this.loop(tt));
      }
    },

    drawMenuBg(dt) {
      const ctx = this.ctx, w = this.w, h = this.h;
      this._bgT += dt;
      ctx.fillStyle = '#0a0c0f';
      ctx.fillRect(0, 0, w, h);
      // drifting grid
      ctx.strokeStyle = 'rgba(60,80,70,0.12)';
      ctx.lineWidth = 1;
      const gs = 48, off = (this._bgT * 12) % gs;
      ctx.beginPath();
      for (let x = -off; x < w; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = -off; y < h; y += gs) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
      // vignette
      const grd = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
      grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
    },
  };

  function computeCarriedValue(carried) {
    let v = 0;
    if (carried.weapons) carried.weapons.forEach(w => { if (w) v += G.getItem(w.id).value; });
    if (carried.armorId) v += G.getItem(carried.armorId).value;
    if (carried.reserve) for (const cal in carried.reserve) { const id = G.AMMO_ITEM[cal]; if (id) v += G.getItem(id).value * carried.reserve[cal]; }
    if (carried.backpack) carried.backpack.forEach(s => v += G.getItem(s.id).value * s.n);
    return v;
  }

  window.addEventListener('DOMContentLoaded', () => Game.init());
  G.Game = Game;

})();
