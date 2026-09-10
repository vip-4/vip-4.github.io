import { Enemy } from './enemy.js';
import { ENEMY_COLORS, NES_PALETTE } from './enemy.js';

/**
 * Goomba enemy - basic patrol enemy
 * Walks left, can be stomped, falls into pits
 */
export class Goomba extends Enemy {
  constructor(x, y) {
    super(x, y, 16, 16);
    this.speed = 0.5;
    this.direction = -1; // Start walking left
    this.velX = this.speed * this.direction;
    this.type = 'goomba';
    this.animFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 200; // ms per frame
    this.hp = 1;
  }

  update(dt, level) {
    // Check for edge/wall before moving
    this.checkEdgeDetection(level);

    // Check pit fall
    this.checkPitFall(level);

    // Call parent update for physics
    super.update(dt, level);

    // Update animation
    this.animTimer += dt;
    if (this.animTimer >= this.animSpeed) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  /**
   * Handle being stomped by player
   */
  stomp() {
    this.hp--;
    if (this.hp <= 0) {
      this.squished = true;
      this.dying = true;
      this.dyingTimer = 0;
      this.dyingDuration = 200;
    }
  }

  getSpriteData() {
    // Goomba sprite - brown mushroom-shaped enemy
    // Walk frame 1: feet together, frame 2: feet apart
    if (this.dying || this.squished) {
      return this.getSquishedSprite();
    }
    return this.animFrame === 0
      ? this.getWalkFrame1()
      : this.getWalkFrame2();
  }

  getWalkFrame1() {
    // Goomba walk frame 1 - feet together
    return [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2],
      [2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2],
      [2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2],
      [2, 2, 8, 8, 8, 2, 8, 8, 8, 8, 2, 8, 8, 8, 2, 2],
      [2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2],
      [2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2],
      [2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2],
      [2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2],
      [2, 2, 2, 2, 8, 8, 2, 2, 2, 2, 8, 8, 2, 2, 2, 2],
      [2, 2, 2, 2, 8, 8, 2, 2, 2, 2, 8, 8, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ];
  }

  getWalkFrame2() {
    // Goomba walk frame 2 - feet apart
    return [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2],
      [2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2],
      [2, 2, 8, 8, 8, 2, 8, 8, 8, 8, 2, 8, 8, 8, 2, 2],
      [2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2],
      [2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2],
      [2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2],
      [2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2],
      [2, 2, 2, 2, 8, 8, 2, 2, 2, 2, 8, 8, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ];
  }

  getSquishedSprite() {
    // Squished goomba - flat
    return [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2],
      [2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2],
      [2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
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
        if (colorIndex !== 2) { // Skip transparent (using background color)
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
