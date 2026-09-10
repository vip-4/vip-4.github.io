/* =========================================================================
 * raid.js — In-raid controller. Owns the map, player, enemies, bullets,
 * loot, particles, camera. Handles input, simulation, rendering and the HUD.
 * Calls host callbacks (onPause / onInventory / onFinish) for DOM overlays.
 * ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const U = G.Utils;
  const C = G.Config;
  const Input = G.Input;
  // constant key→action map, hoisted out of the per-frame path.
  // Quick-slots 1·2 select weapons, 3 equips armor, 4 heals; E/Space tap to loot.
  const KEY_ACTIONS = {
    r: 'reload', h: 'heal', q: 'swap', tab: 'inv', escape: 'pause',
    '1': 'slot0', '2': 'slot1', '3': 'slot2', '4': 'slot3',
    e: 'interact', ' ': 'interact',
  };

  function Raid(location, carried) {
    this.location = location;
    this.map = G.MapGen.generate(location);
    this.cam = new G.Camera();
    this.particles = new G.Particles();
    this.bullets = [];
    this.enemies = [];
    this.groundItems = [];
    this.toasts = [];
    this.floats = [];
    this.time = 0;
    this.timeLeft = C.RAID_TIME;
    this.kills = 0;
    this.killsByTier = { scav: 0, raider: 0, boss: 0 };   // fed to contract counters on extract
    this.paused = false;
    this.result = null;
    this.extracting = null;       // {zone, t}
    this.invOpen = false;
    this.scav = !!carried.scav;
    this.visited = new Uint8Array(this.map.w * this.map.h);
    this._footT = 0;
    this.sprintOn = false;        // touch sprint toggle
    this._nearestCont = null;
    this._actionRowY = null;      // set by _layoutButtons on touch; read by panel/quickbar geometry

    // callbacks (wired by host)
    this.onPause = function () {};
    this.onInventory = function () {};
    this.onFinish = function () {};

    this._buildPlayer(carried);
    this._spawnEnemies();
    this._buildCaches();
    this.cam.x = this.player.x; this.cam.y = this.player.y;
  }

  Raid.prototype = {
    _buildPlayer(carried) {
      const sp = this.map.playerSpawn;
      const p = new G.Player(sp.x, sp.y);
      p.weapons = carried.weapons.map(w => w ? { id: w.id, mag: w.mag } : null);
      p.slot = p.weapons[0] ? 0 : (p.weapons[1] ? 1 : 0);
      p.armor = carried.armorId ? { id: carried.armorId, durability: G.getItem(carried.armorId).durability } : null;
      p.reserve = Object.assign({}, carried.reserve);
      p.backpack = (carried.backpack || []).map(s => ({ id: s.id, n: s.n }));
      // top off the equipped magazine from reserve
      for (const w of p.weapons) {
        if (!w) continue;
        const def = G.getItem(w.id);
        const need = def.mag - w.mag;
        const cal = def.ammoType;
        if (need > 0 && p.reserve[cal]) {
          const take = Math.min(need, p.reserve[cal]); w.mag += take; p.reserve[cal] -= take;
        }
      }
      this.player = p;
    },

    _spawnEnemies() {
      for (const s of this.map.enemySpawns) this.enemies.push(new G.Enemy(s));
    },

    // Pre-render the static world (floor/walls/grid) and prepare the incremental
    // fog-of-war minimap texture — both are blitted each frame instead of redrawn.
    _buildCaches() {
      const map = this.map;
      try {
        this._world = document.createElement('canvas');
        this._world.width = map.pxW; this._world.height = map.pxH;
        this._renderWorldCache(this._world.getContext('2d'));
      } catch (e) { this._world = null; }
      try {
        this._mini = document.createElement('canvas');
        this._mini.width = map.w; this._mini.height = map.h;
        this._miniCtx = this._mini.getContext('2d');
      } catch (e) { this._mini = null; }
    },

    _renderWorldCache(ctx) {
      const map = this.map, T = map.tile, base = map.color;
      for (let ty = 0; ty < map.h; ty++) {
        for (let tx = 0; tx < map.w; tx++) {
          const i = ty * map.w + tx, px = tx * T, py = ty * T;
          if (map.grid[i] === 1) {
            ctx.fillStyle = '#15171b'; ctx.fillRect(px, py, T, T);
            ctx.fillStyle = '#23262d'; ctx.fillRect(px, py, T, 4);
            ctx.fillStyle = '#0e0f12'; ctx.fillRect(px, py + T - 3, T, 3);
          } else {
            ctx.fillStyle = shadeColor(base, map.shade[i]);
            ctx.fillRect(px, py, T, T);
          }
        }
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let tx = 0; tx <= map.w; tx++) { ctx.moveTo(tx * T, 0); ctx.lineTo(tx * T, map.pxH); }
      for (let ty = 0; ty <= map.h; ty++) { ctx.moveTo(0, ty * T); ctx.lineTo(map.pxW, ty * T); }
      ctx.stroke();
    },

    /* ----------------------------- Update ----------------------------- */
    update(dt, w, h) {
      this.cam.setViewport(w, h);
      this.screenW = w; this.screenH = h;
      Input.screenW = w; Input.screenH = h;
      if (this.result) return;
      this._layoutButtons(w, h);
      Input.update();
      if (this.paused) return;

      dt = Math.min(dt, 0.05);
      this.time += dt;
      this.timeLeft -= dt;

      this._nearestCont = this._nearestContainer();
      this._handleInput(dt);
      this.player.updateActions(dt, this);

      for (const e of this.enemies) e.update(dt, this);
      this._updateBullets(dt);
      this._updateGround(dt);
      this._updateExtract(dt);
      this.particles.update(dt);
      this._reveal();
      this._updateFloats(dt);
      this._updateToasts(dt);

      this.cam.follow(this.player.x, this.player.y, dt, { w: this.map.pxW, h: this.map.pxH });
      // aim & shoot last, against the now-settled camera, so shots match the
      // crosshair. Skip on the frame a menu just opened so it can't fire a stray shot.
      if (!this.paused) this._aimAndFire(dt);

      // win / lose conditions
      if (this.player.dead) this._finish('death');
      else if (this.timeLeft <= 0) this._finish('mia');
    },

    _handleInput(dt) {
      const p = this.player, map = this.map;
      // discrete actions from keys + buttons
      Input.queueKeyActions(KEY_ACTIONS);
      if (Input.consumeAction('reload')) p.reload();
      if (Input.consumeAction('heal')) p.useMed(this);
      if (Input.consumeAction('swap')) p.swapWeapon(this);
      if (Input.consumeAction('sprint')) this.sprintOn = !this.sprintOn;
      // quick-slots: 1 primary, 2 secondary, 3 armor, 4 heal
      if (Input.consumeAction('slot0')) p.selectWeapon(0, this);
      if (Input.consumeAction('slot1')) p.selectWeapon(1, this);
      if (Input.consumeAction('slot2')) p.equipArmor(this);
      if (Input.consumeAction('slot3')) p.useMed(this);
      if (Input.consumeAction('inv')) { this.paused = true; this.invOpen = true; Input.resetTouch(); this.onInventory(); return; }
      if (Input.consumeAction('pause')) { this.paused = true; Input.resetTouch(); this.onPause(); return; }

      const mv = Input.moveVec();
      const wantMove = Math.hypot(mv.x, mv.y) > 0.05;
      const sprint = Input.touchEnabled ? this.sprintOn : Input.isDown('shift');
      const cont = this._nearestCont;

      // interact: a single TAP of E / Space (or the SEARCH button) starts looting
      // the nearest container; tapping again cancels it. Drain both sources.
      const tapInteract = Input.consumeAction('interact');
      const tapSearch = Input.consumeAction('search');
      if (tapInteract || tapSearch) {
        if (p.searching) {
          p.searching = null;
        } else if (cont && !cont.searched && cont.items.length) {
          p.searching = { t: 0, total: C.SEARCH_TIME, container: cont };
          G.Audio.play('click', { vol: 0.4 });
        } else if (cont) {
          this.toast(G.t('raid.toast.alreadyLooted'));
        }
      }

      // movement is always allowed now (healing slows you; searching range-cancels)
      if (wantMove) {
        p.move(dt, mv.x, mv.y, sprint, map);
        if (p.moving) { this._footT -= dt; if (this._footT <= 0) { G.Audio.play('footstep', { vol: sprint ? 0.5 : 0.3 }); this._footT = sprint ? 0.28 : 0.4; } }
      } else {
        p.moving = false;
      }

      // advance the active search; interrupt when the container leaves range
      if (p.searching) {
        const c = p.searching.container;
        if (c.searched || !c.items.length) {
          p.searching = null;
        } else if (U.dist(p.x, p.y, c.x, c.y) > C.LOOT_PICK_RADIUS + 16) {
          p.searching = null;
          this.toast(G.t('raid.toast.searchMoved'));
        } else {
          p.searching.t += dt;
          if (U.chance(dt * 7)) G.Audio.play('search', { vol: 0.4 });
          if (p.searching.t >= p.searching.total) { this._collect(c); p.searching = null; }
        }
      }

      // opening fire interrupts an active search ("开枪也中断"). The actual aim &
      // shot are resolved in _aimAndFire, AFTER the camera settles this frame, so
      // the bullet lines up with the on-screen crosshair.
      if (Input.firing() && p.searching) { p.searching = null; this.toast(G.t('raid.toast.searchInterrupted')); }
    },

    // Aim + fire, run after cam.follow() so the shot uses the SAME camera state
    // the crosshair is drawn with — bullets track the reticle instead of drifting
    // off it when the camera is moving or shaking.
    _aimAndFire(dt) {
      const p = this.player;
      const aim = Input.aimDir();
      let ang = p.angle;
      if (aim.mode === 'dir') ang = Math.atan2(aim.dy, aim.dx);
      else { const wpt = this.cam.screenToWorld(Input.mouse.x, Input.mouse.y); ang = U.angle(p.x, p.y, wpt.x, wpt.y); }
      p.aimAt(ang);
      const before = p.lastShotAt;
      if (Input.firing() && !p.searching) p.tryShoot(this);
      if (p.lastShotAt !== before) this._alertEnemies(p.x, p.y);
    },

    _collect(cont) {
      const taken = [];
      let full = false;
      for (let i = cont.items.length - 1; i >= 0; i--) {
        const it = cont.items[i];
        const leftover = this.player.addLoot(it.id, it.n);
        const got = it.n - leftover;
        if (got > 0) taken.push({ id: it.id, n: got });
        it.n = leftover;
        if (it.n <= 0) cont.items.splice(i, 1);
        if (leftover > 0) full = true;
      }
      if (!cont.items.length) cont.searched = true;
      if (taken.length) {
        G.Audio.play('pickup', { vol: 0.7 });
        const names = taken.map(t => G.I18n.itemName(t.id) + (t.n > 1 ? ' ' + G.t('ui.item.qty', { n: t.n }) : '')).join(', ');
        this.toast(G.t('raid.toast.looted', { items: names }));
      }
      // any weapon/armor that auto-equipped on pickup announces itself
      this._flushEquipMsgs();
      if (full) this.toast(G.t('raid.toast.bagFull'));
    },

    _nearestContainer() {
      const p = this.player; let best = null;
      const r = C.LOOT_PICK_RADIUS + 16; let bd = r * r;
      for (const c of this.map.containers) {
        if (c.searched) continue;
        const dx = p.x - c.x, dy = p.y - c.y, d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; best = c; }
      }
      return best;
    },

    _alertEnemies(x, y) { for (const e of this.enemies) e.hearShot(x, y); },
    onEnemyShot(x, y) { for (const e of this.enemies) e.hearShot(x, y); },

    _updateBullets(dt) {
      const map = this.map, b = this.bullets;
      for (let i = b.length - 1; i >= 0; i--) {
        const bu = b[i];
        const wallHit = G.updateBullet(bu, dt, map);
        if (wallHit) {
          this.particles.burst(bu.x, bu.y, 3, { color: '#cfcfcf', life: 0.18, spdMax: 90, size: 2 });
          b.splice(i, 1); continue;
        }
        let hit = false;
        if (bu.owner === 'player') {
          for (const e of this.enemies) {
            if (e.dead) continue;
            if (segCircle(bu.px, bu.py, bu.x, bu.y, e.x, e.y, e.r + C.BULLET_RADIUS)) {
              e.takeDamage(bu.damage, this, bu.px, bu.py); hit = true; break;
            }
          }
        } else {
          const p = this.player;
          if (!p.dead && segCircle(bu.px, bu.py, bu.x, bu.y, p.x, p.y, p.r + C.BULLET_RADIUS)) {
            p.takeDamage(bu.damage, this, bu.px, bu.py); hit = true;
          }
        }
        if (hit) b.splice(i, 1);
      }
    },

    _updateGround(dt) {
      const p = this.player;
      for (let i = this.groundItems.length - 1; i >= 0; i--) {
        const g = this.groundItems[i];
        g.pop = Math.max(0, (g.pop || 0) - dt);
        if (g.delay > 0) { g.delay -= dt; continue; }
        if (U.dist(p.x, p.y, g.x, g.y) < C.LOOT_PICK_RADIUS) {
          const leftover = p.addLoot(g.id, g.n);
          const got = g.n - leftover;
          if (got > 0) {
            G.Audio.play('pickup', { vol: 0.6 });
            const d = G.getItem(g.id);
            const nm = G.I18n.itemName(g.id);
            const txt = d.type === 'ammo' ? G.t('raid.float.pickupAmmo', { n: g.n, ammo: nm }) : G.t('raid.float.pickup', { name: nm });
            this.floatText(g.x, g.y - 10, txt, G.RARITY_COLOR[d.rarity] || '#fff');
          }
          this._flushEquipMsgs();
          g.n = leftover;
          if (g.n <= 0) this.groundItems.splice(i, 1);
          else if (got > 0) this.toast(G.t('raid.toast.bagFull'));
        }
      }
    },

    // Drain any auto-equip notifications queued by Player.addLoot during a pickup.
    _flushEquipMsgs() {
      const m = this.player._equipMsgs;
      if (m && m.length) {
        for (const nm of m) this.toast(G.t('toast.equipped', { name: nm }));
        this.player._equipMsgs = null;
      }
    },

    _updateExtract(dt) {
      const p = this.player;
      let inZone = null;
      for (const z of this.map.extracts) {
        if (U.dist(p.x, p.y, z.x, z.y) < z.r) { inZone = z; break; }
      }
      if (inZone) {
        if (!this.extracting || this.extracting.zone !== inZone) this.extracting = { zone: inZone, t: 0 };
        this.extracting.t += dt;
        if (this.extracting.t >= C.EXTRACT_TIME) { G.Audio.play('extract', { vol: 0.9 }); this._finish('extract'); }
      } else if (this.extracting) {
        this.extracting = null;
      }
    },

    _reveal() {
      const p = this.player, map = this.map, R = 7;
      const ct = map.worldToTile(p.x, p.y);
      const mctx = this._miniCtx;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy > R * R) continue;
          const tx = ct.tx + dx, ty = ct.ty + dy;
          if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) continue;
          const i = ty * map.w + tx;
          if (this.visited[i]) continue;
          this.visited[i] = 1;
          if (mctx) { mctx.fillStyle = map.grid[i] === 1 ? '#2a2d34' : '#4a5448'; mctx.fillRect(tx, ty, 1, 1); }
        }
      }
    },

    /* ---------------------------- Events ------------------------------- */
    onEnemyKilled(e) {
      this.kills++; this.player.kills++;
      this.killsByTier[e.tier] = (this.killsByTier[e.tier] || 0) + 1;
      this.floatText(e.x, e.y - 20, G.t('raid.float.eliminated'), '#ff5a5a');
      const scatter = () => U.rand(-14, 14);
      const drop = (id, n) => this.groundItems.push({ x: e.x + scatter(), y: e.y + scatter(), id, n, pop: 0.3, delay: 0.25, bob: Math.random() * 6 });
      // weapon drop
      if (U.chance(0.5)) drop(e.weaponId, 1);
      // armor drop
      if (e.armorId && U.chance(0.4)) drop(e.armorId, 1);
      // some ammo of its caliber
      const cal = G.getItem(e.weaponId).ammoType;
      if (G.AMMO_ITEM[cal] && U.chance(0.7)) drop(G.AMMO_ITEM[cal], U.randInt(8, 24));
      // tier drop table
      const tier = e.def;
      let rolls = U.randInt(tier.dropRolls[0], tier.dropRolls[1]);
      for (let i = 0; i < rolls; i++) {
        const pick = U.weighted(tier.drops);
        drop(pick.id, U.randInt(pick.qty[0], pick.qty[1]));
      }
    },

    /* ----------------------------- Finish ------------------------------ */
    _finish(outcome) {
      if (this.result) return;
      if (outcome === 'death') G.Audio.play('death', { vol: 0.9 });
      this.result = {
        outcome, kills: this.kills,
        lootValue: this.player.lootValue(),
        items: this.player.backpack.reduce((a, s) => a + s.n, 0),
        time: Math.round(this.time), scav: this.scav,
        locId: this.location && this.location.id,   // for contract counters
        killsByTier: this.killsByTier,
      };
      this.onFinish(this.result);
    },
    abandon() { this._finish('abandoned'); },

    /* ------------------------- Toasts / floats ------------------------- */
    toast(msg) { this.toasts.push({ msg, t: 2.6 }); if (this.toasts.length > 5) this.toasts.shift(); },
    _updateToasts(dt) { for (let i = this.toasts.length - 1; i >= 0; i--) { this.toasts[i].t -= dt; if (this.toasts[i].t <= 0) this.toasts.splice(i, 1); } },
    floatText(x, y, text, color) { this.floats.push({ x, y, text, color, t: 1.1, vy: -26 }); },
    _updateFloats(dt) { for (let i = this.floats.length - 1; i >= 0; i--) { const f = this.floats[i]; f.t -= dt; f.y += f.vy * dt; if (f.t <= 0) this.floats.splice(i, 1); } },

    /* --------------------------- Button layout ------------------------- */
    // Action buttons live in a bottom-CENTRE row (between the two floating sticks,
    // out of the aim thumb's bottom-right territory). All geometry respects the
    // notch / home-indicator safe-area insets.
    _layoutButtons(w, h) {
      if (!Input.touchEnabled) { Input.clearButtons(); return; }
      const S = G.safe;
      const pad = 12;
      const names = ['sprint', 'search', 'reload', 'heal', 'swap'];
      // size the row to fit the available width between safe insets
      const avail = w - S.l - S.r - pad * 2;
      const gap = 8;
      let s = Math.min(66, Math.max(42, h * 0.1));
      if (names.length * s + (names.length - 1) * gap > avail) s = Math.max(36, (avail - (names.length - 1) * gap) / names.length);
      const total = names.length * s + (names.length - 1) * gap;
      const startX = S.l + (w - S.l - S.r - total) / 2;
      const rowY = h - S.b - pad - s;
      names.forEach((n, i) => Input.setButton(n, startX + i * (s + gap), rowY, s, s));
      // top corners
      const bagW = s * 1.0, bagH = s * 0.6;
      Input.setButton('inv', w - S.r - pad - bagW, S.t + pad, bagW, bagH);
      Input.setButton('pause', S.l + pad, S.t + pad, s * 0.8, s * 0.55);
      this._btnSize = s;
      this._actionRowY = rowY;
      this._invBottom = S.t + pad + bagH;
    },

    /* ----------------------------- Render ------------------------------ */
    draw(ctx, w, h) {
      ctx.save();
      this.cam.apply(ctx);
      this._drawWorld(ctx);
      this._drawGround(ctx);
      this._drawAttackRange(ctx);
      this._drawExtracts(ctx);
      this._drawEnemies(ctx);
      this._drawPlayer(ctx);
      this._drawBullets(ctx);
      this.particles.draw(ctx);
      this._drawFloats(ctx);
      ctx.restore();

      this._drawHUD(ctx, w, h);
    },

    _drawWorld(ctx) {
      const map = this.map, T = map.tile, cam = this.cam;
      const hw = this.screenW / (2 * cam.zoom), hh = this.screenH / (2 * cam.zoom);
      // static world: one blit from the pre-rendered cache (browser clips to view)
      if (this._world) {
        ctx.drawImage(this._world, 0, 0);
      } else {
        // fallback: per-frame tile draw (cache unavailable)
        const minX = Math.max(0, Math.floor((cam.x - hw) / T) - 1);
        const maxX = Math.min(map.w - 1, Math.ceil((cam.x + hw) / T) + 1);
        const minY = Math.max(0, Math.floor((cam.y - hh) / T) - 1);
        const maxY = Math.min(map.h - 1, Math.ceil((cam.y + hh) / T) + 1);
        for (let ty = minY; ty <= maxY; ty++) {
          for (let tx = minX; tx <= maxX; tx++) {
            const i = ty * map.w + tx, px = tx * T, py = ty * T;
            if (map.grid[i] === 1) {
              ctx.fillStyle = '#15171b'; ctx.fillRect(px, py, T, T);
              ctx.fillStyle = '#23262d'; ctx.fillRect(px, py, T, 4);
              ctx.fillStyle = '#0e0f12'; ctx.fillRect(px, py + T - 3, T, 3);
            } else { ctx.fillStyle = shadeColor(map.color, map.shade[i]); ctx.fillRect(px, py, T, T); }
          }
        }
      }

      // containers (dynamic — searched state changes)
      for (const c of this.map.containers) {
        if (c.x < cam.x - hw - T || c.x > cam.x + hw + T || c.y < cam.y - hh - T || c.y > cam.y + hh + T) continue;
        G.Sprites.container(ctx, c);
      }
    },

    _drawGround(ctx) {
      for (const g of this.groundItems) {
        if (g.delay > 0) continue;
        const d = G.getItem(g.id);
        const bob = Math.sin(this.time * 4 + (g.bob || 0)) * 2;
        const s = 17 + (g.pop > 0 ? g.pop * 20 : 0);
        if (d.rarity === 'rare' || d.rarity === 'epic') { ctx.shadowColor = G.RARITY_COLOR[d.rarity]; ctx.shadowBlur = 10; }
        G.Sprites.groundItem(ctx, d, g.x, g.y + bob, s);
        ctx.shadowBlur = 0;
      }
    },

    // Dashed ring at the equipped weapon's effective range — shows how far your
    // shots reach. Faint so it never competes with the action.
    _drawAttackRange(ctx) {
      const p = this.player;
      const wdef = p.weaponDef();
      if (!wdef || !wdef.range) return;
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 9]);
      ctx.lineDashOffset = -this.time * 22;
      ctx.strokeStyle = 'rgba(255,225,140,0.13)';
      ctx.beginPath(); ctx.arc(p.x, p.y, wdef.range, 0, U.TAU); ctx.stroke();
      // a brighter forward arc centred on the aim so the reach reads at a glance
      ctx.strokeStyle = 'rgba(255,210,90,0.30)';
      ctx.beginPath(); ctx.arc(p.x, p.y, wdef.range, p.angle - 0.5, p.angle + 0.5); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    },

    _drawExtracts(ctx) {
      for (const z of this.map.extracts) {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 3);
        const active = this.extracting && this.extracting.zone === z;
        ctx.save();
        ctx.globalAlpha = 0.25 + pulse * 0.2;
        ctx.fillStyle = active ? '#5ad06a' : '#3aa14a';
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = active ? '#9affb0' : '#5ad06a';
        ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -this.time * 30;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, U.TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#cffcd6'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
        ctx.fillText('▲ ' + G.I18n.extractName(z.name), z.x, z.y - z.r - 8);
        ctx.restore();
      }
    },

    _drawEnemies(ctx) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        // vision hint when in combat
        if (e.state === 'combat' || e.state === 'alert') {
          ctx.fillStyle = e.state === 'combat' ? 'rgba(214,60,60,0.10)' : 'rgba(214,180,60,0.07)';
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.arc(e.x, e.y, 150, e.angle - C.VISION_FOV, e.angle + C.VISION_FOV);
          ctx.closePath(); ctx.fill();
        }
        // creature body (procedural). Sprites owns the per-tier visual scale;
        // ask it where the sprite's top is so overlays clear ears/horns/plates.
        G.Sprites.enemy(ctx, e);
        const top = G.Sprites.enemyTop(e);
        // hp bar if hurt
        if (e.hp < e.maxHp) {
          const wb = 28;
          ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - wb / 2, top, wb, 4);
          ctx.fillStyle = '#d63b3b'; ctx.fillRect(e.x - wb / 2, top, wb * (e.hp / e.maxHp), 4);
        }
        // state icon
        if (e.state === 'alert' || e.state === 'search') {
          ctx.fillStyle = '#ffd24a'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
          ctx.fillText('?', e.x, top - 6);
        } else if (e.state === 'combat') {
          ctx.fillStyle = '#ff5a5a'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
          ctx.fillText('!', e.x, top - 6);
        }
      }
    },

    _drawPlayer(ctx) {
      const p = this.player;
      // Clawd — top-down mascot body
      let armorFrac = 1;
      if (p.armor && p.armor.durability > 0) { const ad = G.getItem(p.armor.id); armorFrac = ad ? p.armor.durability / ad.durability : 1; }
      G.Sprites.player(ctx, p.x, p.y, p.r, p.angle, {
        hurt: p.hurtFlash,
        armor: !!(p.armor && p.armor.durability > 0),
        armorFrac,
        glow: !!this.extracting,
      });
      // search/heal/reload progress ring (drawn on top so it stays readable)
      const act = p.searching || p.healing || p.reloading;
      if (act) {
        const frac = act.t / act.total;
        ctx.strokeStyle = p.healing ? '#5ad06a' : p.searching ? '#ffd24a' : '#5aa0ff';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 13, -Math.PI / 2, -Math.PI / 2 + U.TAU * frac); ctx.stroke();
      }
    },

    _drawBullets(ctx) {
      if (!this.bullets.length) return;
      // group by color so shadow/stroke state is set at most once per color
      const byColor = this._bulletGroups || (this._bulletGroups = new Map());
      byColor.clear();
      for (const b of this.bullets) { let a = byColor.get(b.color); if (!a) byColor.set(b.color, a = []); a.push(b); }
      ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      byColor.forEach((arr, color) => {
        ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 6;
        ctx.beginPath();
        for (const b of arr) {
          const tx = b.x - b.vx * 0.012, ty = b.y - b.vy * 0.012;
          ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();
      });
      ctx.shadowBlur = 0; ctx.lineCap = 'butt';
    },

    _drawFloats(ctx) {
      ctx.textAlign = 'center';
      for (const f of this.floats) {
        ctx.globalAlpha = U.clamp(f.t, 0, 1);
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(f.text, f.x + 1, f.y + 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
    },

    /* ------------------------------ HUD -------------------------------- */
    _drawHUD(ctx, w, h) {
      const p = this.player;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

      // low-hp vignette
      const hpFrac = p.hp / p.maxHp;
      if (hpFrac < 0.4) {
        const a = (0.4 - hpFrac) / 0.4 * 0.5 * (0.7 + 0.3 * Math.sin(this.time * 6));
        const grd = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
        grd.addColorStop(0, 'rgba(180,0,0,0)'); grd.addColorStop(1, 'rgba(180,0,0,' + a.toFixed(3) + ')');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      }

      const S = G.safe;
      // ---- top bars (HP / armor / stamina) ----
      const bx = 14 + S.l, bw = Math.min(240, w * 0.32);
      let by = 14 + S.t;
      // HP
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, bw, 16);
      ctx.fillStyle = hpFrac > 0.5 ? '#3fbf5a' : hpFrac > 0.25 ? '#d6a23b' : '#d63b3b';
      ctx.fillRect(bx, by, bw * hpFrac, 16);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, 16);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
      ctx.fillText(G.t('raid.hud.hp', { n: Math.ceil(p.hp) }), bx + 6, by + 12);
      by += 20;
      // armor
      if (p.armor) {
        const ad = G.getItem(p.armor.id); const af = p.armor.durability / ad.durability;
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, bw, 10);
        ctx.fillStyle = '#5a9fd6'; ctx.fillRect(bx, by, bw * af, 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(bx, by, bw, 10);
        ctx.fillStyle = '#cfe6ff'; ctx.font = '9px monospace'; ctx.fillText(G.t('raid.hud.armor'), bx + 5, by + 8);
        by += 14;
      }
      // stamina
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(bx, by, bw, 6);
      ctx.fillStyle = '#d8d24a'; ctx.fillRect(bx, by, bw * (p.stamina / C.STAMINA_MAX), 6);
      by += 14;

      // ---- timer (top center) ----
      const mm = Math.floor(Math.max(0, this.timeLeft) / 60), ss = Math.floor(Math.max(0, this.timeLeft) % 60);
      const tstr = mm + ':' + (ss < 10 ? '0' : '') + ss;
      ctx.textAlign = 'center'; ctx.font = 'bold 22px monospace';
      ctx.fillStyle = this.timeLeft < 30 ? '#ff5a5a' : 'rgba(255,255,255,0.9)';
      ctx.fillText(tstr, w / 2, 30 + S.t);
      ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(G.I18n.locName(this.location).toUpperCase(), w / 2, 44 + S.t);

      // ---- top right: kills / value (stacked below the BAG button on touch) ----
      ctx.textAlign = 'right'; ctx.font = 'bold 13px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const rightX = w - 14 - S.r;
      const topY = Input.touchEnabled ? (this._invBottom || 60) + 16 : 18 + S.t;
      ctx.fillText('☠ ' + this.kills, rightX, topY);
      ctx.fillStyle = '#f0c44a';
      ctx.fillText('₵ ' + U.formatNum(p.lootValue()), rightX, topY + 18);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px monospace';
      ctx.fillText(G.t('raid.hud.bag', { n: p.backpackCount(), max: C.BACKPACK_SLOTS }), rightX, topY + 34);

      // ---- weapon panel + carried-item quick bar (bottom center-left) ----
      this._drawWeaponPanel(ctx, w, h);
      this._drawQuickbar(ctx, w, h);

      // ---- minimap (top right under stats / or top-left on mobile) ----
      this._drawMinimap(ctx, w, h);

      // ---- context prompt ----
      const cont = this._nearestCont;
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = 'bold 13px monospace';
      if (this.extracting) {
        const frac = this.extracting.t / C.EXTRACT_TIME;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(w / 2 - 110, h * 0.7, 220, 30);
        ctx.fillStyle = '#3aa14a'; ctx.fillRect(w / 2 - 110, h * 0.7, 220 * frac, 30);
        ctx.strokeStyle = '#9affb0'; ctx.strokeRect(w / 2 - 110, h * 0.7, 220, 30);
        ctx.fillStyle = '#fff'; ctx.fillText(G.t('raid.prompt.extracting'), w / 2, h * 0.7 + 20);
      } else if (p.searching) {
        // in-progress search bar
        const frac = p.searching.t / p.searching.total;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(w / 2 - 110, h * 0.78, 220, 26);
        ctx.fillStyle = '#ffd24a'; ctx.fillRect(w / 2 - 110, h * 0.78, 220 * frac, 26);
        ctx.strokeStyle = '#ffe9a8'; ctx.strokeRect(w / 2 - 110, h * 0.78, 220, 26);
        ctx.fillStyle = '#1a1206'; ctx.fillText(G.t('raid.prompt.searching'), w / 2, h * 0.78 + 18);
      } else if (cont && !cont.searched && cont.items.length) {
        const label = G.I18n.containerLabel(cont.type);
        const key = Input.touchEnabled ? G.t('raid.prompt.tapKey.touch') : G.t('raid.prompt.tapKey.desktop');
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(w / 2 - 130, h * 0.78, 260, 26);
        ctx.fillStyle = '#ffd24a';
        ctx.fillText(G.t('raid.prompt.loot', { key: key, label: label }), w / 2, h * 0.78 + 18);
      }

      // ---- extract direction arrow ----
      this._drawExtractArrow(ctx, w, h);

      // ---- toasts ----
      ctx.textAlign = 'center'; ctx.font = '12px monospace';
      for (let i = 0; i < this.toasts.length; i++) {
        const t = this.toasts[i];
        ctx.globalAlpha = U.clamp(t.t, 0, 1);
        const ty = h * 0.6 - i * 20;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        const tw = ctx.measureText(t.msg).width + 16;
        ctx.fillRect(w / 2 - tw / 2, ty - 13, tw, 18);
        ctx.fillStyle = '#e8e8e8';
        ctx.fillText(t.msg, w / 2, ty);
      }
      ctx.globalAlpha = 1;

      // ---- controls help (auto-fades early in the raid) ----
      this._drawHelp(ctx, w, h);

      // ---- mobile controls ----
      if (Input.touchEnabled) this._drawTouchControls(ctx, w, h);

      // crosshair (desktop) — a crisp reticle (four gapped ticks + thin ring +
      // dot) tinted by attack range: green within the weapon's reach, amber
      // beyond. A dark backing keeps it readable over any tile.
      if (!Input.touchEnabled) {
        const m = Input.mouse;
        const wdef = p.weaponDef();
        const wpt = this.cam.screenToWorld(m.x, m.y);
        const inRange = wdef ? U.dist(p.x, p.y, wpt.x, wpt.y) <= wdef.range : true;
        const col = !wdef ? 'rgba(236,240,245,0.95)' : inRange ? 'rgba(120,230,150,0.95)' : 'rgba(255,150,90,0.95)';
        ctx.save();
        ctx.lineCap = 'round';
        reticlePath(ctx, m.x, m.y, 4, 8, 11);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 3.5; ctx.stroke();
        reticlePath(ctx, m.x, m.y, 4, 8, 11);
        ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(m.x, m.y, 1.6, 0, U.TAU); ctx.fill();
        ctx.restore();
      }
    },

    // Shared geometry for the bottom-left weapon panel — the quick-slot bar
    // stacks directly above it using the same x/width.
    _panelGeom(w, h) {
      const S = G.safe;
      const panelW = Math.min(220, w * 0.5), panelH = 44;
      const panelX = 14 + S.l;
      // sit above the bottom-centre action row on touch so they never overlap
      const panelY = (Input.touchEnabled && this._actionRowY ? this._actionRowY - panelH - 8 : h - 58 - S.b);
      return { panelX, panelY, panelW, panelH };
    },

    // Four quick-slot tiles (1 primary · 2 secondary · 3 armor · 4 heal) — the
    // carried-item bar. Desktop drives it with number keys; touch uses SWAP/HEAL
    // and the BAG (tap armor to equip). Returns the tile rects.
    _quickbarGeom(w, h) {
      const g = this._panelGeom(w, h);
      const qh = 30, gap = 4;
      const tw = (g.panelW - gap * 3) / 4;
      const qy = g.panelY - qh - 6;
      const rects = [];
      for (let i = 0; i < 4; i++) rects.push({ x: g.panelX + i * (tw + gap), y: qy, w: tw, h: qh });
      return rects;
    },

    _drawQuickbar(ctx, w, h) {
      const p = this.player;
      const r = this._quickbarGeom(w, h);
      // representative med (smallest icon) + total med count for slot 4
      let medId = null, medN = 0;
      for (const s of p.backpack) { if (G.getItem(s.id).type === 'med') { medN += s.n; if (!medId) medId = s.id; } }
      const armorId = (p.armor && p.armor.durability > 0) ? p.armor.id : null;
      const slots = [
        { id: p.weapons[0] ? p.weapons[0].id : null, key: '1', active: p.slot === 0, cat: 'raid.quick.cat.primary' },
        { id: p.weapons[1] ? p.weapons[1].id : null, key: '2', active: p.slot === 1, cat: 'raid.quick.cat.secondary' },
        { id: armorId, key: '3', cat: 'raid.quick.cat.armor' },
        { id: medId, n: medN, key: '4', cat: 'raid.quick.cat.heal' },
      ];
      for (let i = 0; i < 4; i++) {
        const s = slots[i], b = r[i];
        ctx.fillStyle = s.active ? 'rgba(38,52,48,0.85)' : 'rgba(0,0,0,0.5)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = s.active ? '#39e0c0' : 'rgba(255,255,255,0.18)';
        ctx.lineWidth = s.active ? 2 : 1; ctx.strokeRect(b.x, b.y, b.w, b.h);
        if (s.id) {
          const def = G.getItem(s.id);
          const ic = Math.min(b.h * 0.78, b.w * 0.6);
          G.Sprites.groundItem(ctx, def, b.x + b.w * 0.5, b.y + b.h * 0.5 + 1, ic);
          if (s.n > 1) {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
            ctx.fillText('x' + s.n, b.x + b.w - 3, b.y + b.h - 3);
          }
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '8px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(G.t(s.cat), b.x + b.w / 2, b.y + b.h / 2 + 2);
          ctx.textBaseline = 'alphabetic';
        }
        // key number badge (top-left)
        ctx.fillStyle = s.active ? '#39e0c0' : 'rgba(255,255,255,0.55)';
        ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(s.key, b.x + 3, b.y + 10);
      }
    },

    _drawWeaponPanel(ctx, w, h) {
      const p = this.player;
      const wdef = p.weaponDef();
      const g = this._panelGeom(w, h);
      const panelX = g.panelX, panelY = g.panelY, panelW = g.panelW, panelH = g.panelH;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(panelX, panelY, panelW, panelH);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      if (wdef) {
        const w0 = p.weapons[p.slot];
        ctx.fillStyle = G.RARITY_COLOR[wdef.rarity] || '#fff'; ctx.font = 'bold 13px monospace';
        ctx.fillText(G.I18n.itemName(w0.id), panelX + 10, panelY + 18);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace';
        const reserve = p.reserve[wdef.ammoType] || 0;
        ctx.fillText(w0.mag + ' / ' + reserve, panelX + 10, panelY + 38);
        // reload progress
        if (p.reloading) {
          const frac = p.reloading.t / p.reloading.total;
          ctx.fillStyle = '#5aa0ff'; ctx.fillRect(panelX, panelY + panelH - 3, panelW * frac, 3);
        }
        // slot indicator
        ctx.textAlign = 'right'; ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('[' + (p.slot + 1) + ']', panelX + panelW - 8, panelY + 16);
      } else {
        ctx.fillStyle = '#999'; ctx.font = '13px monospace';
        ctx.fillText(G.t('raid.weapon.unarmed'), panelX + 10, panelY + 26);
      }
    },

    _drawMinimap(ctx, w, h) {
      const map = this.map;
      const S = G.safe;
      const size = Input.touchEnabled ? 104 : 150;
      const mx = w - size - 14 - S.r;
      const my = (Input.touchEnabled ? (this._invBottom || 60) + 56 : 64 + S.t);
      const sc = size / Math.max(map.pxW, map.pxH);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(mx - 2, my - 2, size + 4, size + 4);
      // explored tiles (cached fog texture, scaled up; nearest-neighbour)
      if (this._mini) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this._mini, mx, my, map.pxW * sc, map.pxH * sc);
        ctx.imageSmoothingEnabled = true;
      }
      // extracts
      for (const z of map.extracts) {
        ctx.fillStyle = '#5ad06a';
        ctx.fillRect(mx + z.x * sc - 2, my + z.y * sc - 2, 4, 4);
      }
      // enemies (only if alert/combat — represents "known" threats)
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (e.state === 'combat' || e.state === 'alert') {
          ctx.fillStyle = '#ff5a5a';
          ctx.fillRect(mx + e.x * sc - 1.5, my + e.y * sc - 1.5, 3, 3);
        }
      }
      // player
      const p = this.player;
      ctx.fillStyle = '#39e0c0';
      ctx.beginPath();
      const pmx = mx + p.x * sc, pmy = my + p.y * sc;
      ctx.moveTo(pmx + Math.cos(p.angle) * 5, pmy + Math.sin(p.angle) * 5);
      ctx.lineTo(pmx + Math.cos(p.angle + 2.5) * 4, pmy + Math.sin(p.angle + 2.5) * 4);
      ctx.lineTo(pmx + Math.cos(p.angle - 2.5) * 4, pmy + Math.sin(p.angle - 2.5) * 4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(mx, my, size, size);
      ctx.restore();
    },

    _drawExtractArrow(ctx, w, h) {
      const p = this.player;
      let best = null, bd = Infinity;
      for (const z of this.map.extracts) { const d = U.dist2(p.x, p.y, z.x, z.y); if (d < bd) { bd = d; best = z; } }
      if (!best) return;
      const ang = U.angle(p.x, p.y, best.x, best.y);
      const cx = w / 2, cy = h / 2, rad = Math.min(w, h) * 0.34;
      const ax = cx + Math.cos(ang) * rad, ay = cy + Math.sin(ang) * rad;
      ctx.save();
      ctx.translate(ax, ay); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(90,208,106,0.5)';
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
      ctx.restore();
    },

    // Brief operating instructions shown at the top of the screen for the first
    // few seconds of a raid (fades out over the last 2s). Desktop and touch get
    // their own line sets. Helps a new player read the controls without leaving.
    _drawHelp(ctx, w, h) {
      const T = C.HELP_TIME;
      if (this.time >= T) return;
      const fade = this.time > T - 2 ? (T - this.time) / 2 : 1;
      const touch = Input.touchEnabled;
      const lines = touch
        ? [G.t('raid.help.touch.move'), G.t('raid.help.touch.aim'), G.t('raid.help.touch.loot'), G.t('raid.help.touch.items'), G.t('raid.help.extract')]
        : [G.t('raid.help.move'), G.t('raid.help.aim'), G.t('raid.help.loot'), G.t('raid.help.items'), G.t('raid.help.extract')];
      const title = G.t('raid.help.title');
      ctx.save();
      ctx.globalAlpha = U.clamp(fade, 0, 1);
      ctx.font = '12px monospace';
      let maxw = ctx.measureText(title).width;
      for (const l of lines) maxw = Math.max(maxw, ctx.measureText(l).width);
      const pad = 12, lh = 18;
      const bw = maxw + pad * 2;
      const bh = pad * 2 + 18 + lines.length * lh;
      const bx = w / 2 - bw / 2;
      const by = G.safe.t + 54;
      ctx.fillStyle = 'rgba(8,10,14,0.82)'; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = 'rgba(255,225,140,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, bw, bh);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#ffe1a8'; ctx.font = 'bold 13px monospace';
      ctx.fillText(title, w / 2, by + pad + 11);
      ctx.fillStyle = '#d7dde4'; ctx.font = '12px monospace';
      for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], w / 2, by + pad + 18 + 12 + i * lh);
      ctx.restore();
    },

    _drawTouchControls(ctx, w, h) {
      const S = G.safe;
      // faint hint rings show where each thumb belongs when its stick is idle
      const hint = (active, hx, hy, label) => {
        if (active) return;
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(hx, hy, 46, 0, U.TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.font = '10px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, hx, hy); ctx.textBaseline = 'alphabetic';
      };
      const hy = h - S.b - 130;
      hint(Input.leftStick.active, S.l + w * 0.14, hy, G.t('raid.touch.move'));
      hint(Input.rightStick.active, w - S.r - w * 0.14, hy, G.t('raid.touch.aimFire'));
      // sticks
      const drawStick = (s, color) => {
        if (!s.active) return;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(s.ox, s.oy, 70, 0, U.TAU); ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(s.ox + s.dx * s.mag * 70, s.oy + s.dy * s.mag * 70, 28, 0, U.TAU); ctx.fill();
      };
      drawStick(Input.leftStick, 'rgba(57,224,192,0.4)');
      drawStick(Input.rightStick, 'rgba(255,90,90,0.4)');
      // buttons
      const btn = (name, label, col, active) => {
        const b = Input.buttons[name]; if (!b || b.x === undefined) return;
        const lit = b.down || (active && active());
        ctx.fillStyle = lit ? (col || 'rgba(255,255,255,0.35)') : 'rgba(0,0,0,0.4)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = lit ? '#fff' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
        ctx.textBaseline = 'alphabetic';
      };
      btn('sprint', G.t('raid.btn.sprint'), 'rgba(216,210,74,0.6)', () => this.sprintOn);
      btn('search', G.t('raid.btn.search'), 'rgba(255,210,74,0.5)');
      btn('reload', G.t('raid.btn.reload'), 'rgba(90,160,255,0.5)');
      btn('heal', G.t('raid.btn.heal'), 'rgba(90,208,106,0.5)');
      btn('swap', G.t('raid.btn.swap'), 'rgba(200,200,200,0.4)');
      btn('inv', G.t('raid.btn.bag'), 'rgba(255,255,255,0.3)');
      btn('pause', '❚❚', 'rgba(255,255,255,0.3)');
    },
  };

  // crosshair reticle path: four gapped ticks (N/E/S/W) + a thin ring, built so
  // it can be stroked twice (dark backing, then colour) without re-listing points.
  function reticlePath(ctx, x, y, gap, len, rad) {
    ctx.beginPath();
    ctx.moveTo(x - gap - len, y); ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y); ctx.lineTo(x + gap + len, y);
    ctx.moveTo(x, y - gap - len); ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap); ctx.lineTo(x, y + gap + len);
    ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, Math.PI * 2);
  }

  // segment vs circle test
  function segCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
    t = U.clamp(t, 0, 1);
    const px = x1 + dx * t, py = y1 + dy * t;
    const ddx = cx - px, ddy = cy - py;
    return ddx * ddx + ddy * ddy <= r * r;
  }

  // tint a hex color by a small shade index (floor variation)
  const _shadeCache = {};
  function shadeColor(hex, idx) {
    const key = hex + '_' + idx;
    if (_shadeCache[key]) return _shadeCache[key];
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const add = (idx - 1.5) * 7;
    r = U.clamp(r + add + 18, 0, 255); g = U.clamp(g + add + 18, 0, 255); b = U.clamp(b + add + 18, 0, 255);
    const out = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
    _shadeCache[key] = out;
    return out;
  }

  G.Raid = Raid;

})();
