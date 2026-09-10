import { Enemy } from './enemy.js';
import { NES_PALETTE } from './enemy.js';

/**
 * Hammer Bros - walks, jumps, and throws hammers
 * Takes 2 stomps to defeat
 */
export class HammerBro extends Enemy {
  constructor(x, y) {
    super(x, y, 16, 32);
    this.speed = 1.2;
    this.direction = -1;
    this.velX = this.speed * this.direction;
    this.type = 'hammerBro';
    this.animFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 200;

    // HP system (2 stomps to kill)
    this.hp = 2;
    this.maxHp = 2;

    // Jump behavior
    this.jumpTimer = 0;
    this.jumpInterval = this.getRandomJumpInterval(); // 2-4 seconds
    this.isJumping = false;
    this.jumpVelocity = -10;
    this.grounded = false;

    // Hammer throw behavior
    this.hammerTimer = 0;
    this.hammerInterval = 1500; // 1.5 seconds
    this.isThrowingHammer = false;
    this.hammerThrowDuration = 500;
    this.hammerThrowTimer = 0;
    this.hammers = []; // Active hammer projectiles

    // Hammer projectile settings
    this.hammerSpeed = 3;
    this.hammerGravity = 0.3;
  }

  getRandomJumpInterval() {
    return 2000 + Math.random() * 2000; // 2-4 seconds
  }

  update(dt, level) {
    // Update hammer projectiles
    this.updateHammers(dt, level);

    if (this.dying) {
      super.update(dt, level);
      return;
    }

    // Jump timer
    if (this.grounded && !this.isThrowingHammer) {
      this.jumpTimer += dt;
      if (this.jumpTimer >= this.jumpInterval) {
        this.jump();
        this.jumpTimer = 0;
        this.jumpInterval = this.getRandomJumpInterval();
      }
    }

    // Hammer throw timer (only on ground)
    if (this.grounded) {
      this.hammerTimer += dt;
      if (this.hammerTimer >= this.hammerInterval) {
        this.throwHammer();
        this.hammerTimer = 0;
      }
    }

    // Handle throw animation
    if (this.isThrowingHammer) {
      this.hammerThrowTimer += dt;
      if (this.hammerThrowTimer >= this.hammerThrowDuration) {
        this.isThrowingHammer = false;
        this.hammerThrowTimer = 0;
      }
    }

    // Patrol AI - check walls and edges
    this.checkEdgeDetection(level);

    // Apply physics
    super.update(dt, level);

    // Update animation
    this.animTimer += dt;
    if (this.animTimer >= this.animSpeed) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    // Check pit fall
    this.checkPitFall(level);
  }

  /**
   * Jump
   */
  jump() {
    if (this.grounded) {
      this.velY = this.jumpVelocity;
      this.grounded = false;
      this.isJumping = true;
    }
  }

  /**
   * Throw a hammer projectile
   */
  throwHammer() {
    this.isThrowingHammer = true;
    this.hammerThrowTimer = 0;

    // Create hammer projectile
    const hammer = {
      x: this.x + (this.direction === 1 ? 16 : -8),
      y: this.y + 8,
      width: 8,
      height: 8,
      velX: this.hammerSpeed * this.direction,
      velY: -2, // Initial upward velocity for arc
      gravity: this.hammerGravity,
      active: true
    };
    this.hammers.push(hammer);
  }

  /**
   * Update all hammer projectiles
   */
  updateHammers(dt, level) {
    for (let i = this.hammers.length - 1; i >= 0; i--) {
      const hammer = this.hammers[i];

      // Apply gravity
      hammer.velY += hammer.gravity;

      // Move
      hammer.x += hammer.velX;
      hammer.y += hammer.velY;

      // Check tile collision
      if (level && level.isSolidTile) {
        const tileSize = 16;
        const tileX = Math.floor(hammer.x / tileSize);
        const tileY = Math.floor(hammer.y / tileSize);
        if (level.isSolidTile(tileX, tileY)) {
          hammer.active = false;
        }
      }

      // Remove if off screen or inactive
      if (!hammer.active || hammer.y > 300 || hammer.x < -50 || hammer.x > 500) {
        this.hammers.splice(i, 1);
      }
    }
  }

  /**
   * Handle being stomped
   */
  stomp() {
    this.hp--;
    if (this.hp <= 0) {
      this.die();
    }
    // Flash effect handled by base class
  }

  canBeStomped(player) {
    // Only stompable from above when not jumping
    if (this.dying || !player || player.velY <= 0) return false;

    const playerBottom = player.y + player.height;
    const enemyTop = this.y;
    const overlapX = player.x < this.x + this.width && player.x + player.width > this.x;

    // Must be on top half of enemy and falling
    const stompZone = this.height * 0.4;
    return overlapX && playerBottom <= enemyTop + stompZone;
  }

  getSpriteData() {
    if (this.dying) {
      return this.getDeathSprite();
    }
    if (this.isThrowingHammer) {
      return this.getThrowSprite();
    }
    if (!this.grounded) {
      return this.getJumpSprite();
    }
    return this.animFrame === 0
      ? this.getWalkFrame1()
      : this.getWalkFrame2();
  }

  getWalkFrame1() {
    // Hammer Bros walk frame 1
    return [
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 1, 1, 8, 8, 1, 1, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 1, 1, 8, 8, 1, 1, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3],
      [3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3],
      [3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 3, 3, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 3, 3, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3]
    ];
  }

  getWalkFrame2() {
    // Hammer Bros walk frame 2 - feet apart
    return [
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 1, 1, 8, 8, 1, 1, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 1, 1, 8, 8, 1, 1, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3],
      [3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3],
      [3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 3, 3, 3, 3, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 3, 3, 3, 3, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3]
    ];
  }

  getJumpSprite() {
    // Hammer Bros jump frame
    return [
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 1, 1, 8, 8, 1, 1, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 1, 1, 8, 8, 1, 1, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3],
      [3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3],
      [3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 3, 8, 8, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 3, 8, 8, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3]
    ];
  }

  getThrowSprite() {
    // Hammer Bros throwing hammer (arm raised)
    return [
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 1, 1, 8, 8, 1, 1, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 1, 1, 8, 8, 1, 1, 8, 8, 3, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3],
      [3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3],
      [3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
      [11, 11, 11, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [11, 11, 11, 3, 3, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3],
      [3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3],
      [3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 3, 3, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 3, 3, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3],
      [3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3]
    ];
  }

  getDeathSprite() {
    // Death sprite - same as regular but will flash
    return this.getWalkFrame1();
  }

  render(ctx, cameraX, cameraY) {
    const sprite = this.getSpriteData();
    if (!sprite) return;

    const drawX = Math.floor(this.x - cameraX);
    const drawY = Math.floor(this.y - cameraY);

    // Draw sprite pixel by pixel
    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        const colorIndex = sprite[row][col];
        if (colorIndex !== 3) { // Skip orange (body color) for transparency
          ctx.fillStyle = NES_PALETTE[colorIndex];
          ctx.fillRect(drawX + col, drawY + row, 1, 1);
        }
      }
    }

    // Draw hammer projectiles
    this.renderHammers(ctx, cameraX, cameraY);
  }

  renderHammers(ctx, cameraX, cameraY) {
    for (const hammer of this.hammers) {
      if (!hammer.active) continue;

      const hx = Math.floor(hammer.x - cameraX);
      const hy = Math.floor(hammer.y - cameraY);

      // Draw hammer (simple gray square with handle indication)
      ctx.fillStyle = NES_PALETTE[11]; // Gray
      ctx.fillRect(hx, hy, 8, 8);
      ctx.fillStyle = NES_PALETTE[2]; // Brown handle
      ctx.fillRect(hx + 3, hy + 6, 2, 4);
    }
  }

  getAnimationFrame() {
    return this.animFrame;
  }
}
