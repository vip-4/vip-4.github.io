// Enemy color palette (NES-authentic)
export const ENEMY_COLORS = {
  SKY_BLUE: 0,    // #5C94FC
  RED: 1,         // #FC0000
  BROWN: 2,       // #A00000
  ORANGE: 3,      // #FC7F00
  YELLOW: 4,      // #F8B800
  YELLOW_LIGHT: 5,// #F8D800
  GREEN_DARK: 6,  // #00A800
  GREEN_LIGHT: 7, // #B8F810
  BLACK: 8,       // #000000
  WHITE: 9,       // #FCFCFC
  PURPLE: 10,     // #503000
  GRAY: 11        // #A0A0A0
};

// NES palette array for sprite rendering
export const NES_PALETTE = [
  '#5C94FC', // 0: sky blue
  '#FC0000', // 1: red
  '#A00000', // 2: brown dark
  '#FC7F00', // 3: orange
  '#F8B800', // 4: yellow
  '#F8D800', // 5: yellow light
  '#00A800', // 6: green dark
  '#B8F810', // 7: green light
  '#000000', // 8: black
  '#FCFCFC', // 9: white
  '#503000', // 10: purple
  '#A0A0A0'  // 11: gray
];

/**
 * Base Enemy class - all enemies inherit from this
 * Provides common functionality: patrol AI, gravity, collision response
 */
export class Enemy {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velX = 0;
    this.velY = 0;
    this.speed = 1;
    this.direction = -1; // -1 = left, 1 = right
    this.gravity = 0.5;
    this.maxFallSpeed = 8;
    this.active = true;
    this.dying = false;
    this.dyingTimer = 0;
    this.dyingDuration = 200; // ms for death animation
    this.grounded = false;
    this.squishTimer = 0;
    this.squished = false;
    this.spawnX = x;
    this.spawnY = y;
    this.flashTimer = 0;
    this.flashInterval = 100;
    this.visible = true;
  }

  /**
   * Apply gravity and update position
   */
  update(dt, level) {
    if (this.dying) {
      this.dyingTimer += dt;
      if (this.dyingTimer >= this.dyingDuration) {
        this.active = false;
      }
      return;
    }

    // Flash timer for damage indication
    this.flashTimer += dt;
    if (this.flashTimer >= this.flashInterval) {
      this.flashTimer = 0;
      this.visible = !this.visible;
    }

    // Apply gravity
    this.velY += this.gravity;
    if (this.velY > this.maxFallSpeed) {
      this.velY = this.maxFallSpeed;
    }

    // Move horizontally
    this.x += this.velX;

    // Check horizontal collision with level tiles
    this.checkHorizontalCollision(level);

    // Move vertically
    this.y += this.velY;

    // Check vertical collision with level tiles
    this.checkVerticalCollision(level);
  }

  /**
   * Check and resolve horizontal tile collisions
   */
  checkHorizontalCollision(level) {
    if (!level || !level.isSolidTile) return;

    const tileSize = 16;
    const left = Math.floor(this.x / tileSize);
    const right = Math.floor((this.x + this.width - 1) / tileSize);
    const top = Math.floor(this.y / tileSize);
    const bottom = Math.floor((this.y + this.height - 1) / tileSize);

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (level.isSolidTile(tx, ty)) {
          if (this.velX > 0) {
            this.x = tx * tileSize - this.width;
            this.reverseDirection();
          } else if (this.velX < 0) {
            this.x = (tx + 1) * tileSize;
            this.reverseDirection();
          }
        }
      }
    }
  }

  /**
   * Check and resolve vertical tile collisions
   */
  checkVerticalCollision(level) {
    if (!level || !level.isSolidTile) return;

    const tileSize = 16;
    const left = Math.floor(this.x / tileSize);
    const right = Math.floor((this.x + this.width - 1) / tileSize);
    const top = Math.floor(this.y / tileSize);
    const bottom = Math.floor((this.y + this.height - 1) / tileSize);

    this.grounded = false;
    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (level.isSolidTile(tx, ty)) {
          if (this.velY > 0) {
            this.y = ty * tileSize - this.height;
            this.velY = 0;
            this.grounded = true;
          } else if (this.velY < 0) {
            this.y = (ty + 1) * tileSize;
            this.velY = 0;
          }
        }
      }
    }
  }

  /**
   * Reverse patrol direction
   */
  reverseDirection() {
    this.direction *= -1;
    this.velX = this.speed * this.direction;
  }

  /**
   * Check if enemy should reverse at edges (no floor ahead)
   */
  checkEdgeDetection(level) {
    if (!level || !level.isSolidTile) return;

    const tileSize = 16;
    const checkX = this.direction === -1
      ? Math.floor(this.x / tileSize)
      : Math.floor((this.x + this.width - 1) / tileSize);
    const checkY = Math.floor((this.y + this.height + 1) / tileSize);

    // No floor ahead - turn around
    if (!level.isSolidTile(checkX, checkY)) {
      this.reverseDirection();
      return;
    }

    // Wall ahead - turn around
    const wallX = checkX + this.direction;
    const wallY = Math.floor(this.y / tileSize);
    if (level.isSolidTile(wallX, wallY)) {
      this.reverseDirection();
    }
  }

  /**
   * Check if enemy fell into a pit (below level bounds)
   */
  checkPitFall(level) {
    if (!level) return false;
    const tileSize = 16;
    const levelHeight = level.height * tileSize || 240;
    if (this.y > levelHeight + 32) {
      this.active = false;
      return true;
    }
    return false;
  }

  /**
   * Begin dying animation
   */
  die() {
    this.dying = true;
    this.dyingTimer = 0;
    this.velX = 0;
    this.velY = 0;
  }

  /**
   * Check if this enemy can be stomped
   * Player must be falling (positive Y velocity) and hitting top half
   */
  canBeStomped(player) {
    if (this.dying || this.squished) return false;
    if (!player || player.velY <= 0) return false;

    const playerBottom = player.y + player.height;
    const enemyTop = this.y;
    const overlapX = player.x < this.x + this.width && player.x + player.width > this.x;

    // Player's bottom must be in upper portion of enemy
    const stompZone = this.height * 0.5;
    return overlapX && playerBottom <= enemyTop + stompZone;
  }

  /**
   * Get bounding box for collision detection
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Check collision with another entity
   */
  collidesWith(other) {
    if (!other) return false;
    const a = this.getBounds();
    const b = other.getBounds ? other.getBounds() : other;
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  /**
   * Render the enemy (override in subclasses)
   */
  render(ctx, cameraX, cameraY) {
    if (!this.visible && !this.dying) return;
  }

  /**
   * Get sprite data for rendering (override in subclasses)
   */
  getSpriteData() {
    return null;
  }

  /**
   * Get current animation frame (override in subclasses)
   */
  getAnimationFrame() {
    return 0;
  }

  /**
   * Reset enemy to spawn position
   */
  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.velX = this.speed * this.direction;
    this.velY = 0;
    this.active = true;
    this.dying = false;
    this.dyingTimer = 0;
    this.grounded = false;
    this.squished = false;
    this.squishTimer = 0;
  }
}
