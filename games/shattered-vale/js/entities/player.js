// entities/player.js — the player character: movement, melee/fireball
// combat, leveling. Starting numbers and growth curve live in
// config/balance.js (PLAYER_BASE_STATS / PLAYER_LEVEL_UP / FIREBALL_STATS)
// so tuning the game doesn't mean hunting through this file.

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 22;
    this.h = 26;
    this.drawW = 32;
    this.drawH = 34;

    this.speed = PLAYER_BASE_STATS.speed;
    this.dir = 'down';
    this.moving = false;

    this.hp = PLAYER_BASE_STATS.hp;
    this.maxHp = PLAYER_BASE_STATS.maxHp;
    this.atk = PLAYER_BASE_STATS.atk;
    this.lvl = PLAYER_BASE_STATS.lvl;
    this.xp = PLAYER_BASE_STATS.xp;
    this.xpNext = PLAYER_BASE_STATS.xpNext;
    this.gold = PLAYER_BASE_STATS.gold;

    this.hasSword = false;
    this.hasLegendarySword = false;
    this.hasMoltenSword = false;
    this.fireproof = false; // true while Fireproof Boots are equipped — negates lava damage
    this.defense = 0; // sum of equipped armor/helmet/shield (see Combat.recomputeDefense)
    this.attacking = 0;
    this.attackCooldown = 0;
    this.attackCount = 0; // total swings landed — every KNOCKBACK_EVERY_NTH_ATTACK triggers a knockback (see Combat.handleAttack)
    this.invuln = 0;

    this.anim = new AnimatedSprite(Sprites.player, 32, 34);
    this.animSword = new AnimatedSprite(Sprites.playerSword, 32, 34);
    this.footstepTimer = 0;
    this.bob = 0;
    this.hitFlash = 0;

    this.mana = PLAYER_BASE_STATS.mana;
    this.maxMana = PLAYER_BASE_STATS.maxMana;
    this.manaRegen = PLAYER_BASE_STATS.manaRegen;
    this.fireballCooldown = 0;
    this.fireballs = [];
  }

  get centerX() { return this.x + this.w / 2; }
  get centerY() { return this.y + this.h / 2; }

  // Total melee damage per swing, including the equipped weapon's bonus.
  get attackDamage() {
    if (this.hasMoltenSword) return this.atk + WEAPON_ATTACK_BONUS.swordMolten;
    if (this.hasLegendarySword) return this.atk + WEAPON_ATTACK_BONUS.swordLegendary;
    if (this.hasSword) return this.atk + WEAPON_ATTACK_BONUS.sword;
    return this.atk + WEAPON_ATTACK_BONUS.none;
  }

  tryMove(dx, dy, map) {
    if (dx !== 0) {
      const nx = this.x + dx;
      const corners = [
        [nx + 4, this.y + 10],
        [nx + this.w - 4, this.y + 10],
        [nx + 4, this.y + this.h],
        [nx + this.w - 4, this.y + this.h],
      ];
      if (!corners.some(([cx, cy]) => map.isSolid(Math.floor(cx / TILE), Math.floor(cy / TILE)))) {
        this.x = nx;
      }
    }
    if (dy !== 0) {
      const ny = this.y + dy;
      const corners = [
        [this.x + 4, ny + 10],
        [this.x + this.w - 4, ny + 10],
        [this.x + 4, ny + this.h],
        [this.x + this.w - 4, ny + this.h],
      ];
      if (!corners.some(([cx, cy]) => map.isSolid(Math.floor(cx / TILE), Math.floor(cy / TILE)))) {
        this.y = ny;
      }
    }
  }

  update(keys, map, particles) {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) {
      dy = -this.speed;
      this.dir = 'up';
    } else if (keys['s'] || keys['arrowdown']) {
      dy = this.speed;
      this.dir = 'down';
    }
    if (keys['a'] || keys['arrowleft']) {
      dx = -this.speed;
      this.dir = 'left';
    } else if (keys['d'] || keys['arrowright']) {
      dx = this.speed;
      this.dir = 'right';
    }

    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      // normalize diagonal speed
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }
      this.tryMove(dx, dy, map);
      this.footstepTimer++;
      if (this.footstepTimer > 14) {
        this.footstepTimer = 0;
        const tile = map.get(Math.floor(this.centerX / TILE), Math.floor((this.y + this.h) / TILE));
        if (tile === TileType.GRASS) particles.sparkle(this.centerX, this.y + this.h, 'rgba(255,255,255,0.5)');
      }
    }

    this.anim.update(this.moving);
    this.animSword.update(this.moving);
    if (this.attacking > 0) this.attacking--;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invuln > 0) this.invuln--;
    if (this.hitFlash > 0) this.hitFlash--;

    if (this.fireballCooldown > 0) this.fireballCooldown--;

    if (this.mana < this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + this.manaRegen);
    }
    this.bob = this.moving ? Math.sin(Date.now() / 90) * 1.5 : 0;
  }

  attackHitbox() {
    const range = 24;
    let ax = this.x, ay = this.y;
    if (this.dir === 'up') ay -= range;
    if (this.dir === 'down') ay += range;
    if (this.dir === 'left') ax -= range;
    if (this.dir === 'right') ax += range;
    return { x: ax, y: ay, w: this.w, h: this.h };
  }

  startAttack() {
    if (this.attackCooldown > 0) return false;
    this.attacking = 14;
    this.attackCooldown = 20;
    this.attackCount++;
    return true;
  }

  takeDamage(amount, particles) {
    if (this.invuln > 0) return;
    const reduced = Math.max(1, Math.round(amount - this.defense));
    this.hp = clamp(this.hp - reduced, 0, this.maxHp);
    this.invuln = 45;
    this.hitFlash = 12;
    particles.burst(this.centerX, this.centerY, '#e24b4a', 8);
    particles.floatText(this.centerX, this.y - 4, '-' + reduced, '#f09595');
  }

  gainXP(amount, particles) {
    this.xp += amount;
    particles.floatText(this.centerX, this.y - 10, '+' + amount + ' XP', '#85b7eb');
    let leveled = false;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.lvl++;
      this.xpNext = Math.floor(this.xpNext * PLAYER_LEVEL_UP.xpNextMultiplier) + PLAYER_LEVEL_UP.xpNextFlatBonus;
      this.maxHp += PLAYER_LEVEL_UP.hpGain;
      this.hp = this.maxHp;
      this.atk += PLAYER_LEVEL_UP.atkGain;
      leveled = true;
    }
    return leveled;
  }

  draw(ctx, camX, camY) {
    const sprite = this.hasSword ? this.animSword : this.anim;
    const drawX = this.x - camX - (this.drawW - this.w) / 2;
    const drawY = this.y - camY - (this.drawH - this.h) + 4 + this.bob;
    const flash = this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0;
    ctx.save();
    if (this.invuln > 0) ctx.globalAlpha = 0.55;
    sprite.draw(ctx, drawX, drawY, this.dir, flash);
    ctx.restore();

    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = (this.hitFlash / 12) * 0.55;
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = '#e24b4a';
      ctx.fillRect(drawX, drawY, this.drawW, this.drawH);
      ctx.restore();
    }

    if (this.attacking > 0) {
      const hb = this.attackHitbox();
      ctx.save();
      ctx.globalAlpha = this.attacking / 14 * 0.5;
      ctx.fillStyle = '#f1efe8';
      ctx.beginPath();
      ctx.ellipse(hb.x - camX + hb.w / 2, hb.y - camY + hb.h / 2, 20, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  castFireball() {
    if (this.mana < FIREBALL_STATS.manaCost) return false;
    if (this.fireballCooldown > 0) return false;

    this.mana -= FIREBALL_STATS.manaCost;
    this.fireballCooldown = FIREBALL_STATS.cooldown;

    let dx = 0, dy = 1;
    if (this.dir === 'up') dy = -1;
    if (this.dir === 'down') dy = 1;
    if (this.dir === 'left') { dx = -1; dy = 0; }
    if (this.dir === 'right') { dx = 1; dy = 0; }

    this.fireballs.push(new Fireball(this.centerX, this.centerY, dx, dy));
    return true;
  }
}
