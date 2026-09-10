import { Enemy } from './enemy.js';
import { NES_PALETTE } from './enemy.js';

/**
 * Blooper - underwater fish enemy
 * Swims in sine wave pattern, swims toward player, cannot be stomped
 */
export class Blooper extends Enemy {
  constructor(x, y) {
    super(x, y, 16, 16);
    this.speed = 0.5;
    this.type = 'blooper';
    this.animFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 300;

    // Swim pattern
    this.swimTimer = 0;
    this.swimPeriod = 2000; // 2 seconds per direction change
    this.baseY = y;
    this.swimAmplitude = 30; // Vertical swim distance
    this.velX = -this.speed; // Start swimming left

    // Direction facing
    this.direction = -1;

    // State
    this.swimUp = true;
  }

  update(dt, level) {
    if (this.dying) {
      super.update(dt, level);
      return;
    }

    // Update swim pattern timer
    this.swimTimer += dt;
    if (this.swimTimer >= this.swimPeriod) {
      this.swimTimer = 0;
      this.swimUp = !this.swimUp;
      // Reverse horizontal direction too
      this.direction *= -1;
      this.velX = this.speed * this.direction;
    }

    // Swim vertically in sine wave pattern
    const swimOffset = Math.sin((this.swimTimer / this.swimPeriod) * Math.PI * 2);
    const targetY = this.baseY + swimOffset * this.swimAmplitude;
    this.y += (targetY - this.y) * 0.05; // Smooth movement toward target

    // Move horizontally
    this.x += this.velX;

    // Swim toward player if reference available
    if (this.playerRef) {
      const dx = this.playerRef.x - this.x;
      if (Math.abs(dx) > 30) {
        this.velX = this.speed * Math.sign(dx);
        this.direction = Math.sign(dx);
      }
    }

    // Update animation
    this.animTimer += dt;
    if (this.animTimer >= this.animSpeed) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  /**
   * Set player reference for tracking
   */
  setPlayerRef(player) {
    this.playerRef = player;
  }

  /**
   * Blooper cannot be stomped (swimming enemy)
   */
  canBeStomped() {
    return false;
  }

  getSpriteData() {
    return this.animFrame === 0
      ? this.getSwimFrame1()
      : this.getSwimFrame2();
  }

  getSwimFrame1() {
    // Blooper swim frame 1 - tail up
    return [
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9],
      [9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
    ];
  }

  getSwimFrame2() {
    // Blooper swim frame 2 - tail down
    return [
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9],
      [9, 9, 9, 8, 8, 9, 9, 9, 9, 9, 9, 8, 8, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
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
        if (colorIndex !== 9) { // Skip white (body color for transparency)
          ctx.fillStyle = NES_PALETTE[colorIndex];
          ctx.fillRect(drawX + col, drawY + row, 1, 1);
        }
      }
    }
  }

  getAnimationFrame() {
    return this.animFrame;
  }
}
