import { Enemy } from './enemy.js';
import { NES_PALETTE } from './enemy.js';

/**
 * Koopa (Turtle) enemy - patrol AI with shell transformation
 * Can be stomped to become a shell, shell can be kicked
 */
export class Koopa extends Enemy {
  constructor(x, y) {
    super(x, y, 16, 32); // Walking: 16x32
    this.speed = 0.8;
    this.direction = -1;
    this.velX = this.speed * this.direction;
    this.type = 'koopa';
    this.animFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 250;
    this.hp = 1;

    // Shell state
    this.shell = false;
    this.shellMode = false; // True when in shell form (16x16)
    this.shellWidth = 16;
    this.shellHeight = 16;
    this.kicked = false; // Shell has been kicked
    this.kickSpeed = 5;
    this.shellBounceSpeed = 3;
    this.shellTransitionTimer = 0;
    this.shellTransitionDuration = 100;

    // Store original dimensions for shell mode
    this.originalWidth = 16;
    this.originalHeight = 32;
  }

  update(dt, level) {
    if (this.dying) {
      super.update(dt, level);
      return;
    }

    if (this.shellMode) {
      this.updateShell(dt, level);
    } else {
      // Normal patrol behavior
      this.checkEdgeDetection(level);
      super.update(dt, level);

      // Update animation
      this.animTimer += dt;
      if (this.animTimer >= this.animSpeed) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    }

    // Check pit fall
    this.checkPitFall(level);
  }

  /**
   * Update shell behavior (stationary until kicked)
   */
  updateShell(dt, level) {
    if (this.kicked) {
      // Shell is sliding
      this.velY += this.gravity;
      if (this.velY > this.maxFallSpeed) {
        this.velY = this.maxFallSpeed;
      }

      this.x += this.velX;
      this.y += this.velY;

      this.checkHorizontalCollision(level);
      this.checkVerticalCollision(level);

      // Check pit
      this.checkPitFall(level);

      // Shell bounces off walls - reverse direction
      // (handled in checkHorizontalCollision by reversing)
    } else {
      // Shell is stationary, apply gravity
      this.velY += this.gravity;
      if (this.velY > this.maxFallSpeed) {
        this.velY = this.maxFallSpeed;
      }
      this.y += this.velY;
      this.checkVerticalCollision(level);
    }
  }

  /**
   * Handle being stomped - transform to shell
   */
  stomp() {
    if (!this.shellMode) {
      this.shellMode = true;
      this.shell = true;
      this.width = this.shellWidth;
      this.height = this.shellHeight;
      this.velX = 0;
      this.direction = 0;
      return true;
    }
    return false;
  }

  /**
   * Kick the shell (called when player slides into shell)
   */
  kick(direction) {
    if (!this.shellMode) return false;

    this.kicked = true;
    this.velX = this.kickSpeed * direction;
    return true;
  }

  /**
   * Check if shell can be kicked
   */
  canBeKicked() {
    return this.shellMode && !this.kicked;
  }

  /**
   * Shell hitting enemy from side
   */
  shellHitEnemy(enemy) {
    if (enemy && enemy.die) {
      enemy.die();
      // Bounce shell back
      this.velX = this.shellBounceSpeed * -this.direction;
    }
  }

  getSpriteData() {
    if (this.shellMode) {
      return this.getShellSprite();
    }
    return this.animFrame === 0
      ? this.getWalkFrame1()
      : this.getWalkFrame2();
  }

  getWalkFrame1() {
    // Koopa walk frame 1 - feet together
    return [
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6, 6],
      [6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6],
      [6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6],
      [6, 6, 8, 8, 8, 6, 6, 8, 8, 6, 6, 8, 8, 6, 6, 6],
      [6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6],
      [6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6, 6],
      [6, 6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 8, 8, 8, 8, 8, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 8, 8, 8, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6],
      [6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6],
      [6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 6],
      [6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 6],
      [6, 6, 6, 6, 6, 4, 4, 8, 8, 4, 4, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 4, 4, 8, 8, 4, 4, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
    ];
  }

  getWalkFrame2() {
    // Koopa walk frame 2 - feet apart
    return [
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6, 6],
      [6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6],
      [6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6],
      [6, 6, 8, 8, 8, 6, 6, 8, 8, 6, 6, 8, 8, 6, 6, 6],
      [6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6],
      [6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6, 6],
      [6, 6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 8, 8, 8, 8, 8, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 8, 8, 8, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6],
      [6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6],
      [6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6, 6],
      [6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6],
      [6, 6, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6],
      [6, 6, 6, 6, 6, 4, 4, 8, 8, 4, 4, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 4, 4, 8, 8, 4, 4, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
    ];
  }

  getShellSprite() {
    // Koopa shell - 16x16
    return [
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6, 6],
      [6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6],
      [6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6],
      [6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6],
      [6, 8, 8, 6, 6, 8, 8, 8, 8, 8, 6, 6, 8, 8, 6, 6],
      [6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6],
      [6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6],
      [6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6],
      [6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6],
      [6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6],
      [6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6],
      [6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 8, 8, 8, 8, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
    ];
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
        if (colorIndex !== 6) { // Skip transparent (green)
          ctx.fillStyle = NES_PALETTE[colorIndex];
          ctx.fillRect(drawX + col, drawY + row, 1, 1);
        }
      }
    }
  }

  getAnimationFrame() {
    return this.animFrame;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}
