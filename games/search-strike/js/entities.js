/* =========================================================================
 * entities.js — Player and Enemy (AI) classes.
 * Entities receive the `raid` controller to spawn bullets/particles/sounds
 * and query the map & player.
 * ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const U = G.Utils;
  const C = G.Config;

  /* ============================== Player =============================== */
  function Player(x, y) {
    this.x = x; this.y = y;
    this.r = C.PLAYER_RADIUS;
    this.angle = -Math.PI / 2;
    this.hp = C.PLAYER_MAX_HP;
    this.maxHp = C.PLAYER_MAX_HP;
    this.stamina = C.STAMINA_MAX;
    this.exhausted = false;            // sprint lockout until stamina recovers
    this.armor = null;                 // {id, durability}
    this.weapons = [null, null];       // [{id, mag}, ...]
    this.slot = 0;
    this.reserve = {};                 // ammoType -> count
    this.backpack = [];                // [{id, n}]
    this.dead = false;
    this.kills = 0;
    // action states
    this.fireCd = 0;
    this.recoil = 0;
    this.reloading = null;             // {t, total}
    this.healing = null;               // {t, total, id, heal}
    this.searching = null;             // {t, total, container}
    this.moving = false;
    this.hurtFlash = 0;
    this.lastShotAt = -999;
  }
  Player.prototype = {
    weapon() { return this.weapons[this.slot]; },
    weaponDef() { const w = this.weapons[this.slot]; return w ? G.getItem(w.id) : null; },

    cancelActions() {
      this.reloading = null; this.searching = null; this.healing = null;
    },

    move(dt, mvx, mvy, sprint, map) {
      let speed = C.PLAYER_SPEED;
      // Healing no longer roots you: you may reposition while patching up (but
      // cannot shoot — see tryShoot). It slows you and disables sprint so it is
      // still a committed, risky action. Searching allows movement too, but the
      // raid cancels it once you leave the container's range.
      if (this.healing) { speed *= C.HEAL_MOVE_MULT; sprint = false; }
      // hysteresis: once drained to 0 you must recover past STAMINA_RECOVER before sprinting again
      if (this.stamina <= 0) this.exhausted = true;
      if (this.stamina > C.STAMINA_RECOVER) this.exhausted = false;
      const wantSprint = sprint && !this.exhausted && (mvx || mvy);
      if (wantSprint) { speed *= C.PLAYER_SPRINT; this.stamina = Math.max(0, this.stamina - C.STAMINA_DRAIN * dt); }
      else this.stamina = Math.min(C.STAMINA_MAX, this.stamina + C.STAMINA_REGEN * dt);
      const dx = mvx * speed * dt, dy = mvy * speed * dt;
      if (dx || dy) {
        const ox = this.x, oy = this.y;
        const np = map.move(this.x, this.y, this.r, dx, dy);
        this.x = np.x; this.y = np.y;
        this.moving = Math.abs(np.x - ox) > 0.05 || Math.abs(np.y - oy) > 0.05;
      } else this.moving = false;
    },

    aimAt(angle) { this.angle = angle; },

    tryShoot(raid) {
      if (this.reloading || this.healing || this.searching) return;
      const w = this.weapon();
      if (!w) return;
      const def = G.getItem(w.id);
      if (this.fireCd > 0) return;
      if (w.mag <= 0) {
        this.fireCd = 0.25;     // rate-limit empty clicks; reload() plays 'reload' or a single 'empty'
        this.reload();
        return;
      }
      this.fireCd = def.fireRate / 1000;
      w.mag--;
      this.lastShotAt = raid.time;
      const mx = this.x + Math.cos(this.angle) * (this.r + 6);
      const my = this.y + Math.sin(this.angle) * (this.r + 6);
      // recoil contributes only partially to bullet spread so shots still track
      // the crosshair under sustained fire (it remains a visible bloom, not a spray)
      const spread = def.spread + this.recoil * 0.55;
      const pellets = def.pellets || 1;
      for (let i = 0; i < pellets; i++) {
        const a = this.angle + U.rand(-spread, spread);
        raid.bullets.push(G.makeBullet(mx, my, a, def.bulletSpeed, def.damage, 'player', { range: def.range, color: '#ffe08a' }));
      }
      this.recoil = Math.min(0.24, this.recoil + def.recoil);
      raid.particles.muzzle(mx, my, this.angle);
      // a gentler muzzle kick — heavy shake made the world jitter under the static crosshair
      raid.cam.shake(pellets > 1 ? 3 : 1.1, 0.08);
      const snd = def.cls === 'shotgun' ? 'shoot_shotgun' : def.cls === 'rifle' ? 'shoot_rifle' : def.cls === 'smg' ? 'shoot_smg' : 'shoot';
      G.Audio.play(snd, { vol: 0.85 });
    },

    reload() {
      if (this.reloading || this.healing) return;
      const w = this.weapon(); if (!w) return;
      const def = G.getItem(w.id);
      if (w.mag >= def.mag) return;
      const have = this.reserve[def.ammoType] || 0;
      if (have <= 0) { G.Audio.play('empty', { vol: 0.5 }); return; }
      this.searching = null;
      this.reloading = { t: 0, total: def.reloadTime };
      G.Audio.play('reload', { vol: 0.7 });
    },

    useMed(raid) {
      if (this.healing || this.reloading || this.searching) return;
      if (this.hp >= this.maxHp) { raid.toast(G.t('toast.health_full')); return; }
      // pick the smallest sufficient med, else largest available
      let best = null;
      for (const s of this.backpack) {
        const d = G.getItem(s.id);
        if (d.type !== 'med') continue;
        if (!best) best = s;
        const bd = G.getItem(best.id);
        const need = this.maxHp - this.hp;
        if (d.heal >= need && (bd.heal < need || d.heal < bd.heal)) best = s;
        else if (bd.heal < need && d.heal > bd.heal) best = s;
      }
      if (!best) { raid.toast(G.t('toast.no_meds')); return; }
      const d = G.getItem(best.id);
      this.healing = { t: 0, total: d.useTime, id: best.id, heal: d.heal };
      G.Audio.play('heal', { vol: 0.7 });
    },

    swapWeapon(raid) {
      if (this.reloading || this.healing) return;
      const other = this.slot === 0 ? 1 : 0;
      if (!this.weapons[other]) { if (raid) raid.toast(G.t('toast.no_secondary')); return; }
      this.slot = other;
      this.fireCd = 0.2;
      G.Audio.play('click', { vol: 0.5 });
      if (raid) raid.toast(G.I18n.itemName(this.weapons[this.slot].id));
    },

    // Direct quick-slot select (keys 1 / 2) — switch to a specific weapon slot.
    selectWeapon(idx, raid) {
      if (this.reloading || this.healing) return;
      if (idx === this.slot) return;
      if (!this.weapons[idx]) { if (raid) raid.toast(G.t(idx === 1 ? 'toast.no_secondary' : 'toast.no_weapon')); return; }
      this.slot = idx;
      this.fireCd = 0.2;
      G.Audio.play('click', { vol: 0.5 });
      if (raid) raid.toast(G.I18n.itemName(this.weapons[idx].id));
    },

    // Equip a specific armor held in the backpack; the worn plate returns to the bag.
    equipArmorById(id, raid) {
      if (this.reloading || this.healing) return false;
      const idx = this.backpack.findIndex(s => s.id === id && G.getItem(s.id).type === 'armor');
      if (idx < 0) return false;
      this.backpack[idx].n -= 1;
      if (this.backpack[idx].n <= 0) this.backpack.splice(idx, 1);
      const old = this.armor;
      this.armor = { id, durability: G.getItem(id).durability };
      if (old) this.addLoot(old.id, 1);
      G.Audio.play('reload', { vol: 0.5 });
      if (raid) raid.toast(G.t('toast.equipped', { name: G.I18n.itemName(id) }));
      return true;
    },

    // Quick-slot armor (key 3) — equip the strongest plate in the backpack.
    equipArmor(raid) {
      if (this.reloading || this.healing) return;
      let bestId = null, bestPct = (this.armor && this.armor.durability > 0) ? G.getItem(this.armor.id).defPct : -1;
      for (const s of this.backpack) {
        const d = G.getItem(s.id);
        if (d.type === 'armor' && d.defPct > bestPct) { bestPct = d.defPct; bestId = s.id; }
      }
      if (!bestId) { if (raid) raid.toast(G.t(this.armor ? 'toast.armor_best' : 'toast.no_armor')); return; }
      this.equipArmorById(bestId, raid);
    },

    updateActions(dt, raid) {
      this.fireCd = Math.max(0, this.fireCd - dt);
      this.recoil = Math.max(0, this.recoil - dt * 0.55);
      if (this.reloading) {
        this.reloading.t += dt;
        if (this.reloading.t >= this.reloading.total) {
          const w = this.weapon();
          if (w) {
            const def = G.getItem(w.id);
            const need = def.mag - w.mag;
            const have = this.reserve[def.ammoType] || 0;
            const take = Math.min(need, have);
            w.mag += take; this.reserve[def.ammoType] = have - take;
          }
          this.reloading = null;
        }
      }
      if (this.healing) {
        this.healing.t += dt;
        if (this.healing.t >= this.healing.total) {
          this.hp = Math.min(this.maxHp, this.hp + this.healing.heal);
          this.removeFromBackpack(this.healing.id, 1);
          raid.toast(G.t('toast.heal_amount', { n: this.healing.heal }));
          this.healing = null;
        }
      }
      this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.5);
    },

    takeDamage(dmg, raid, fromX, fromY) {
      if (this.dead) return;
      let dmgLeft = dmg;
      if (this.armor && this.armor.durability > 0) {
        const def = G.getItem(this.armor.id);
        const absorbed = dmg * def.defPct;
        dmgLeft = dmg - absorbed;
        this.armor.durability = Math.max(0, this.armor.durability - absorbed * 0.30);
      }
      this.hp -= dmgLeft;
      this.hurtFlash = 1;
      const ang = (fromX !== undefined) ? U.angle(fromX, fromY, this.x, this.y) : Math.random() * U.TAU;
      raid.particles.blood(this.x, this.y, ang);
      raid.cam.shake(6, 0.25);
      G.Audio.play('hurt', { vol: 0.7 });
      // healing interrupted when hit
      this.healing = null;
      if (this.hp <= 0) { this.hp = 0; this.dead = true; }
    },

    // ---- inventory ----
    backpackCount() { return this.backpack.length; },
    addLoot(id, n) {
      const def = G.getItem(id);
      if (!def) return n;
      // ammo goes to reserve directly
      if (def.type === 'ammo') {
        this.reserve[def.ammoType] = (this.reserve[def.ammoType] || 0) + n;
        return 0;
      }
      // A found weapon auto-equips into the first empty weapon slot so it is
      // immediately usable; anything beyond two weapons falls through to the bag.
      if (def.type === 'weapon') {
        for (let i = 0; i < this.weapons.length; i++) {
          if (!this.weapons[i]) {
            this.weapons[i] = { id, mag: def.mag };
            (this._equipMsgs || (this._equipMsgs = [])).push(G.I18n.itemName(id));
            n -= 1;
            return n > 0 ? this.addLoot(id, n) : 0;
          }
        }
      }
      // Found armor auto-equips when it protects better than what you wear. The
      // displaced plate must be stowed FIRST — if the backpack can't hold it we
      // skip the swap entirely (the new plate falls through to the bag) so gear
      // is never silently lost.
      if (def.type === 'armor') {
        const curPct = (this.armor && this.armor.durability > 0) ? G.getItem(this.armor.id).defPct : -1;
        if (def.defPct > curPct) {
          const old = this.armor;
          if (!(old && this.addLoot(old.id, 1) > 0)) {
            this.armor = { id, durability: def.durability };
            (this._equipMsgs || (this._equipMsgs = [])).push(G.I18n.itemName(id));
            n -= 1;
            return n > 0 ? this.addLoot(id, n) : 0;
          }
        }
      }
      const max = def.stack || 1;
      let left = n;
      if (max > 1) {
        for (const s of this.backpack) {
          if (s.id === id && s.n < max) { const add = Math.min(max - s.n, left); s.n += add; left -= add; if (left <= 0) return 0; }
        }
      }
      while (left > 0 && this.backpack.length < C.BACKPACK_SLOTS) {
        const add = Math.min(max, left);
        this.backpack.push({ id, n: add }); left -= add;
      }
      return left; // leftover that didn't fit
    },
    removeFromBackpack(id, n) {
      for (let i = this.backpack.length - 1; i >= 0; i--) {
        if (this.backpack[i].id === id) {
          const take = Math.min(this.backpack[i].n, n);
          this.backpack[i].n -= take; n -= take;
          if (this.backpack[i].n <= 0) this.backpack.splice(i, 1);
          if (n <= 0) break;
        }
      }
    },
    lootValue() {
      let v = 0;
      for (const s of this.backpack) v += (G.getItem(s.id).value || 0) * s.n;
      return v;
    },
  };
  G.Player = Player;

  /* =============================== Enemy =============================== */
  function Enemy(spawn) {
    const tier = G.EnemyTiers[spawn.tier];
    this.tier = spawn.tier; this.def = tier;
    this.x = spawn.x; this.y = spawn.y;
    this.r = C.ENEMY_RADIUS;
    this.hp = tier.hp; this.maxHp = tier.hp;
    this.angle = Math.random() * U.TAU;
    this.color = tier.color;
    this.accuracy = tier.accuracy;
    this.room = spawn.room;
    this.dead = false;

    const wId = U.choice(tier.weapons);
    const wdef = G.getItem(wId);
    this.weaponId = wId;
    this.mag = wdef.mag;
    this.wdef = wdef;
    this.hasArmor = Math.random() < tier.armorChance;
    this.armorId = this.hasArmor ? U.choice(tier.armor) : null;
    this.armorDur = this.hasArmor ? G.getItem(this.armorId).durability : 0;

    // AI
    this.state = 'patrol';
    this.stateT = 0;
    this.target = null;          // patrol waypoint {x,y}
    this.lastKnown = null;       // {x,y}
    this.path = null; this.pathIdx = 0; this.pathTimer = 0;
    this.fireCd = U.rand(0, 0.4);
    this.reactT = 0;
    this.strafeDir = U.chance(0.5) ? 1 : -1;
    this.strafeT = 0;
    this.reloadT = 0;
    this.preferred = wdef.cls === 'shotgun' ? 130 : wdef.cls === 'pistol' ? 220 :
      wdef.cls === 'smg' ? 200 : 280;
    this.visTimer = 0;
    this.canSee = false;
    // throttled line-of-sight cache for navigation (separate from perception)
    this.navLosTimer = 0; this.navLos = false; this.navLosTx = 0; this.navLosTy = 0;
  }
  Enemy.prototype = {
    update(dt, raid) {
      if (this.dead) return;
      this.stateT += dt;
      this.fireCd = Math.max(0, this.fireCd - dt);
      this.strafeT -= dt;
      if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) this.mag = this.wdef.mag; }

      const player = raid.player;
      const map = raid.map;

      // perception (throttled)
      this.visTimer -= dt;
      if (this.visTimer <= 0) {
        this.visTimer = 0.08;
        this.canSee = !player.dead && this._sees(player, map);
      }
      if (this.canSee) {
        this.lastKnown = { x: player.x, y: player.y };
        if (this.state !== 'combat') { this.state = 'combat'; this.stateT = 0; this.reactT = this.def.reactTime; }
      }

      switch (this.state) {
        case 'patrol': this._patrol(dt, raid); break;
        case 'alert': this._alert(dt, raid); break;
        case 'combat': this._combat(dt, raid); break;
        case 'search': this._search(dt, raid); break;
      }
    },

    _sees(player, map) {
      const d = U.dist(this.x, this.y, player.x, player.y);
      if (d > C.VISION_RANGE) return false;
      if (d > 46) {
        const a = U.angle(this.x, this.y, player.x, player.y);
        if (Math.abs(U.angleDiff(this.angle, a)) > C.VISION_FOV) return false;
      }
      return map.los(this.x, this.y, player.x, player.y);
    },

    // called by raid when a gunshot happens nearby
    hearShot(x, y) {
      if (this.dead) return;
      const d = U.dist(this.x, this.y, x, y);
      if (d > C.HEAR_RANGE) return;
      if (this.state === 'combat') return;
      this.lastKnown = { x, y };
      if (this.state === 'patrol' || this.state === 'idle') {
        this.state = 'alert'; this.stateT = 0; this.path = null;
      }
    },

    // cached LOS to a (slowly-moving) nav goal — refresh on a timer or if the goal jumps
    _losTo(map, tx, ty, dt) {
      this.navLosTimer -= dt;
      if (this.navLosTimer <= 0 || U.dist(tx, ty, this.navLosTx, this.navLosTy) > 20) {
        this.navLosTimer = 0.1;
        this.navLosTx = tx; this.navLosTy = ty;
        this.navLos = map.los(this.x, this.y, tx, ty);
      }
      return this.navLos;
    },

    _moveToward(tx, ty, speed, dt, map, slow) {
      const a = U.angle(this.x, this.y, tx, ty);
      const dx = Math.cos(a) * speed * dt, dy = Math.sin(a) * speed * dt;
      const np = map.move(this.x, this.y, this.r, dx, dy);
      const moved = Math.hypot(np.x - this.x, np.y - this.y);
      this.x = np.x; this.y = np.y;
      return moved;
    },

    _followPath(dt, raid, speed) {
      const map = raid.map;
      if (!this.path || this.pathIdx >= this.path.length) return false;
      let wp = this.path[this.pathIdx];
      // skip ahead at most one visible waypoint per frame (advances over multiple frames)
      if (this.pathIdx < this.path.length - 1 && map.los(this.x, this.y, this.path[this.pathIdx + 1].x, this.path[this.pathIdx + 1].y)) {
        this.pathIdx++; wp = this.path[this.pathIdx];
      }
      if (U.dist(this.x, this.y, wp.x, wp.y) < 14) { this.pathIdx++; if (this.pathIdx >= this.path.length) return false; wp = this.path[this.pathIdx]; }
      this.angle = U.angle(this.x, this.y, wp.x, wp.y);
      this._moveToward(wp.x, wp.y, speed, dt, map);
      return true;
    },

    _repath(raid, gx, gy) {
      this.pathTimer = 0.5 + Math.random() * 0.3;
      this.path = raid.map.findPath(this.x, this.y, gx, gy);
      this.pathIdx = 0;
    },

    _patrol(dt, raid) {
      const map = raid.map;
      if (!this.target || U.dist(this.x, this.y, this.target.x, this.target.y) < 16 || this.stateT > 4) {
        // pick a new wander point inside home room
        const r = this.room;
        const tx = U.randInt(r.x + 1, r.x + r.w - 2);
        const ty = U.randInt(r.y + 1, r.y + r.h - 2);
        const c = map.tileCenter(tx, ty);
        this.target = c; this.stateT = 0;
      }
      // move directly if visible, else just idle-rotate
      if (this._losTo(map, this.target.x, this.target.y, dt)) {
        this.angle = U.angle(this.x, this.y, this.target.x, this.target.y);
        this._moveToward(this.target.x, this.target.y, 55, dt, map);
      } else {
        this.angle += dt * 0.6;
      }
    },

    _alert(dt, raid) {
      const map = raid.map;
      if (!this.lastKnown) { this.state = 'patrol'; return; }
      this.pathTimer -= dt;
      if (this.pathTimer <= 0 || !this.path) this._repath(raid, this.lastKnown.x, this.lastKnown.y);
      const moving = this._losTo(map, this.lastKnown.x, this.lastKnown.y, dt)
        ? (this.angle = U.angle(this.x, this.y, this.lastKnown.x, this.lastKnown.y), this._moveToward(this.lastKnown.x, this.lastKnown.y, 95, dt, map), true)
        : this._followPath(dt, raid, 95);
      if (U.dist(this.x, this.y, this.lastKnown.x, this.lastKnown.y) < 24 || !moving) {
        this.state = 'search'; this.stateT = 0;
      }
    },

    _combat(dt, raid) {
      const map = raid.map, player = raid.player;
      this.reactT = Math.max(0, this.reactT - dt);
      if (!this.canSee) {
        // lost sight: go investigate last known
        this.state = 'search'; this.stateT = 0; this.path = null; return;
      }
      const d = U.dist(this.x, this.y, player.x, player.y);
      this.angle = U.angle(this.x, this.y, player.x, player.y);

      // movement: keep preferred range + strafe
      let mvx = 0, mvy = 0;
      const toA = this.angle;
      if (d > this.preferred + 40) { mvx += Math.cos(toA); mvy += Math.sin(toA); }
      else if (d < this.preferred - 40) { mvx -= Math.cos(toA); mvy -= Math.sin(toA); }
      if (this.strafeT <= 0) { this.strafeDir *= -1; this.strafeT = U.rand(0.7, 1.5); }
      mvx += Math.cos(toA + Math.PI / 2) * this.strafeDir * 0.6;
      mvy += Math.sin(toA + Math.PI / 2) * this.strafeDir * 0.6;
      const m = Math.hypot(mvx, mvy);
      if (m > 0) { mvx /= m; mvy /= m; }
      const spd = this.tier === 'boss' ? 105 : 90;
      this._moveToward(this.x + mvx * 100, this.y + mvy * 100, spd, dt, map);

      // shooting
      if (this.reactT <= 0 && this.fireCd <= 0 && this.reloadT <= 0) {
        if (this.mag <= 0) { this.reloadT = this.wdef.reloadTime; return; }
        this._shoot(raid, player, d);
      }
    },

    _search(dt, raid) {
      const map = raid.map;
      if (this.lastKnown && U.dist(this.x, this.y, this.lastKnown.x, this.lastKnown.y) > 24) {
        this.pathTimer -= dt;
        if (this.pathTimer <= 0 || !this.path) this._repath(raid, this.lastKnown.x, this.lastKnown.y);
        if (!this._followPath(dt, raid, 80)) this.lastKnown = null;
      } else {
        // look around for a while then give up
        this.angle += dt * 1.4 * this.strafeDir;
        if (this.stateT > 3.5) { this.state = 'patrol'; this.stateT = 0; this.lastKnown = null; this.path = null; }
      }
    },

    _shoot(raid, player, d) {
      const def = this.wdef;
      this.fireCd = def.fireRate / 1000 * (this.tier === 'boss' ? 1.15 : 1.25);
      this.mag--;
      const mx = this.x + Math.cos(this.angle) * (this.r + 5);
      const my = this.y + Math.sin(this.angle) * (this.r + 5);
      // accuracy: spread grows with distance and lower accuracy
      const distFactor = U.clamp(d / 400, 0.2, 1.6);
      // floor keeps enemies from being point-blank lasers (~5° min half-angle)
      const spread = Math.max(0.09, (1 - this.accuracy) * 0.5 * distFactor + def.spread * 0.5);
      const pellets = def.pellets || 1;
      for (let i = 0; i < pellets; i++) {
        const a = this.angle + U.rand(-spread, spread);
        raid.bullets.push(G.makeBullet(mx, my, a, def.bulletSpeed * 0.85, def.damage, 'enemy', { range: def.range, color: '#ff7b5a' }));
      }
      raid.particles.muzzle(mx, my, this.angle);
      G.Audio.play('enemy_shoot', { vol: U.clamp(1 - d / 900, 0.15, 0.6) });
      raid.onEnemyShot(this.x, this.y);
    },

    takeDamage(dmg, raid, fromX, fromY) {
      if (this.dead) return;
      let dmgLeft = dmg;
      if (this.armorDur > 0) {
        const def = G.getItem(this.armorId);
        const absorbed = dmg * def.defPct;
        dmgLeft = dmg - absorbed;
        this.armorDur = Math.max(0, this.armorDur - absorbed * 0.30);
      }
      this.hp -= dmgLeft;
      raid.particles.blood(this.x, this.y, fromX !== undefined ? U.angle(fromX, fromY, this.x, this.y) : 0);
      // become aware when shot from behind
      if (this.state === 'patrol' || this.state === 'idle' || this.state === 'search') {
        this.lastKnown = { x: fromX, y: fromY };
        this.state = 'alert'; this.stateT = 0; this.path = null;
      }
      if (this.hp <= 0) { this.die(raid); }
      else raid.floatText(this.x, this.y - 14, Math.round(dmgLeft), '#ffd86b');
    },

    die(raid) {
      this.dead = true;
      raid.particles.blood(this.x, this.y, Math.random() * U.TAU);
      raid.particles.burst(this.x, this.y, 10, { color: '#8e0e0e', life: 0.6, spdMax: 120 });
      G.Audio.play('hit_flesh', { vol: 0.6 });
      raid.onEnemyKilled(this);
    },
  };
  G.Enemy = Enemy;

})();
