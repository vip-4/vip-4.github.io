import { NES_PALETTE } from './enemy.js';

/**
 * Fire Bar - rotating castle hazard
 * Rotates around a center point, any fire ball touching player = instant death
 */
export class FireBar {
  constructor(x, y, length = 5) {
    // Center point (attached to tile)
    this.centerX = x;
    this.centerY = y;
    this.length = length; // Number of fire balls (5 short, 7 medium, 9 long)

    // Fire ball size
    this.fireBallSize = 8;

    // Rotation
    this.angle = 0; // Current angle in degrees
    this.rotationSpeed = 2; // Degrees per frame
    this.maxAngle = 360;

    // Fire ball positions (calculated from angle)
    this.fireBalls = [];

    // Update fire ball positions
    this.updateFireBallPositions();

    this.active = true;
    this.type = 'fireBar';
  }

  /**
   * Update fire ball positions based on current angle
   */
  updateFireBallPositions() {
    this.fireBalls = [];
    const spacing = 10; // Pixels between fire balls

    for (let i = 0; i < this.length; i++) {
      const ballAngle = this.angle + (i * spacing);
      const rad = (ballAngle * Math.PI) / 180;

      const bx = this.centerX + Math.cos(rad) * (i * spacing);
      const by = this.centerY + Math.sin(rad) * (i * spacing);

      this.fireBalls.push({
        x: bx,
        y: by,
        width: this.fireBallSize,
        height: this.fireBallSize
      });
    }
  }

  /**
   * Update rotation
   */
  update(dt, level) {
    // Rotate
    this.angle += this.rotationSpeed;
    if (this.angle >= this.maxAngle) {
      this.angle = this.angle % this.maxAngle;
    }

    // Update fire ball positions
    this.updateFireBallPositions();
  }

  /**
   * Check collision with player
   */
  collidesWith(player) {
    if (!player) return false;

    const playerBounds = player.getBounds ? player.getBounds() : player;

    for (const ball of this.fireBalls) {
      // AABB collision between fire ball and player
      if (playerBounds.x < ball.x + ball.width &&
          playerBounds.x + playerBounds.width > ball.x &&
          playerBounds.y < ball.y + ball.height &&
          playerBounds.y + playerBounds.height > ball.y) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get bounds for all fire balls
   */
  getBounds() {
    return this.fireBalls.map(ball => ({
      x: ball.x,
      y: ball.y,
      width: ball.width,
      height: ball.height
    }));
  }

  /**
   * Get single fire ball sprite
   */
  getFireBallSprite() {
    // 8x8 fire ball sprite
    return [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 3, 3, 1, 0, 0],
      [0, 1, 3, 4, 4, 3, 1, 0],
      [1, 3, 4, 4, 4, 4, 3, 1],
      [1, 3, 4, 4, 4, 4, 3, 1],
      [0, 1, 3, 4, 4, 3, 1, 0],
      [0, 0, 1, 3, 3, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0]
    ];
  }

  /**
   * Render the fire bar
   */
  render(ctx, cameraX, cameraY) {
    // Draw center point
    const cx = Math.floor(this.centerX - cameraX);
    const cy = Math.floor(this.centerY - cameraY);

    // Draw center attachment
    ctx.fillStyle = NES_PALETTE[2]; // Brown
    ctx.fillRect(cx - 4, cy - 4, 8, 8);

    // Draw each fire ball
    const sprite = this.getFireBallSprite();

    for (const ball of this.fireBalls) {
      const bx = Math.floor(ball.x - cameraX);
      const by = Math.floor(ball.y - cameraY);

      // Draw fire ball sprite
      for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
          const colorIndex = sprite[row][col];
          if (colorIndex !== 0) { // Skip sky blue (transparent)
            ctx.fillStyle = NES_PALETTE[colorIndex];
            ctx.fillRect(bx + col, by + row, 1, 1);
          }
        }
      }
    }
  }
}

/**
 * Fire Ball projectile (thrown by Bowser or other enemies)
 */
export class FireBall {
  constructor(x, y, direction = -1) {
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 8;
    this.velX = 2.5 * direction;
    this.velY = 0;
    this.gravity = 0.25;
    this.maxFallSpeed = 6;
    this.active = true;
    this.type = 'fireball';

    // Bounce behavior
    this.bounceCount = 0;
    this.maxBounces = 3;
  }

  update(dt, level) {
    // Apply gravity
    this.velY += this.gravity;
    if (this.velY > this.maxFallSpeed) {
      this.velY = this.maxFallSpeed;
    }

    // Move
    this.x += this.velX;
    this.y += this.velY;

    // Check tile collision
    if (level && level.isSolidTile) {
      const tileSize = 16;
      const tileX = Math.floor((this.x + this.width / 2) / tileSize);
      const tileY = Math.floor((this.y + this.height) / tileSize);

      if (level.isSolidTile(tileX, tileY)) {
        // Hit ground - bounce
        this.y = tileY * tileSize - this.height;
        this.velY = -4; // Bounce up
        this.bounceCount++;

        if (this.bounceCount >= this.maxBounces) {
          this.active = false;
        }
      }
    }

    // Remove if off screen
    if (this.x < -50 || this.x > 500 || this.y > 300) {
      this.active = false;
    }
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  collidesWith(player) {
    if (!player) return false;
    const a = this.getBounds();
    const b = player.getBounds ? player.getBounds() : player;
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  render(ctx, cameraX, cameraY) {
    const sprite = [
      [0, 0, 1, 3, 3, 1, 0, 0],
      [0, 1, 3, 4, 4, 3, 1, 0],
      [1, 3, 4, 4, 4, 4, 3, 1],
      [1, 3, 4, 4, 4, 4, 3, 1],
      [1, 3, 4, 4, 4, 4, 3, 1],
      [0, 1, 3, 4, 4, 3, 1, 0],
      [0, 0, 1, 3, 3, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0]
    ];

    const bx = Math.floor(this.x - cameraX);
    const by = Math.floor(this.y - cameraY);

    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        const colorIndex = sprite[row][col];
        if (colorIndex !== 0) {
          ctx.fillStyle = NES_PALETTE[colorIndex];
          ctx.fillRect(bx + col, by + row, 1, 1);
        }
      }
    }
  }
}
