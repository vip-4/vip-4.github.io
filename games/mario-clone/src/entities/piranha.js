import { Enemy } from './enemy.js';
import { NES_PALETTE } from './enemy.js';

/**
 * Piranha Plant - emerges from pipes periodically
 * Hides in pipe, emerges when safe, retreats when player approaches
 */
export class PiranhaPlant extends Enemy {
  constructor(x, y, pipeHeight = 3) {
    // Piranha plant is 16x32 when fully emerged
    super(x, y - 32, 16, 32);
    this.type = 'piranha';
    this.animFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 500;

    // Pipe info
    this.pipeX = x;
    this.pipeY = y;
    this.pipeHeight = pipeHeight; // Height of pipe in tiles
    this.pipeTopY = y - pipeHeight * 16; // Top of pipe where piranha emerges

    // State machine
    this.state = 'hidden'; // 'hidden', 'emerging', 'emerged', 'retreating'
    this.hiddenDuration = 3000; // 3 seconds hidden
    this.emergedDuration = 2000; // 2 seconds emerged
    this.emergeSpeed = 1; // pixels per frame
    this.stateTimer = 0;

    // Player proximity detection
    this.playerDetectDistance = 80; // 5 tiles in pixels

    // Current emergence level (0 = fully hidden, 1 = fully emerged)
    this.emergenceLevel = 0;

    // Starting position (hidden)
    this.hiddenY = this.pipeTopY;
    this.emergeY = this.pipeTopY - 32; // Fully emerged position
    this.y = this.hiddenY;
  }

  update(dt, level) {
    const player = this.getPlayerRef();

    this.stateTimer += dt;

    switch (this.state) {
      case 'hidden':
        this.updateHidden(player);
        break;
      case 'emerging':
        this.updateEmerging();
        break;
      case 'emerged':
        this.updateEmerged(player);
        break;
      case 'retreating':
        this.updateRetreating();
        break;
    }

    // Update animation
    this.animTimer += dt;
    if (this.animTimer >= this.animSpeed) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    // Update position based on emergence level
    this.y = this.hiddenY + (this.emergeY - this.hiddenY) * this.emergenceLevel;
  }

  updateHidden(player) {
    if (this.stateTimer >= this.hiddenDuration) {
      this.state = 'emerging';
      this.stateTimer = 0;
    }
  }

  updateEmerging() {
    // Emerge upward
    this.emergenceLevel += 0.05;
    if (this.emergenceLevel >= 1) {
      this.emergenceLevel = 1;
      this.state = 'emerged';
      this.stateTimer = 0;
    }
  }

  updateEmerged(player) {
    // Check if player is nearby
    if (player) {
      const distance = Math.abs(player.x - this.pipeX);
      if (distance < this.playerDetectDistance) {
        this.state = 'retreating';
        this.stateTimer = 0;
        return;
      }
    }

    if (this.stateTimer >= this.emergedDuration) {
      this.state = 'retreating';
      this.stateTimer = 0;
    }
  }

  updateRetreating() {
    // Retract downward
    this.emergenceLevel -= 0.05;
    if (this.emergenceLevel <= 0) {
      this.emergenceLevel = 0;
      this.state = 'hidden';
      this.stateTimer = 0;
    }
  }

  /**
   * Check if piranha is visible/hittable (not fully hidden)
   */
  isVisible() {
    return this.emergenceLevel > 0.3;
  }

  /**
   * Check if player is colliding with piranha
   */
  collidesWith(player) {
    if (!player || !this.isVisible()) return false;

    const bounds = this.getBounds();
    const playerBounds = player.getBounds ? player.getBounds() : player;

    return bounds.x < playerBounds.x + playerBounds.width &&
           bounds.x + bounds.width > playerBounds.x &&
           bounds.y < playerBounds.y + playerBounds.height &&
           bounds.y + bounds.height > playerBounds.y;
  }

  /**
   * Set player reference for proximity detection
   */
  getPlayerRef() {
    // This will be set by the game/level
    return this._playerRef;
  }

  setPlayerRef(player) {
    this._playerRef = player;
  }

  getSpriteData() {
    if (this.emergenceLevel < 0.3) {
      return null; // Hidden in pipe
    }
    return this.animFrame === 0
      ? this.getEmergeFrame1()
      : this.getEmergeFrame2();
  }

  getEmergeFrame1() {
    // Piranha plant frame 1 - head sway
    return [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1, 1, 1],
      [1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1, 1, 1],
      [1, 1, 1, 8, 8, 8, 1, 1, 1, 1, 8, 8, 8, 1, 1, 1],
      [1, 1, 1, 8, 8, 8, 1, 1, 1, 1, 8, 8, 8, 1, 1, 1],
      [1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1, 1],
      [1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1, 1],
      [1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 8, 8, 8, 8, 1, 1, 1, 1, 1, 1],
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

  getEmergeFrame2() {
    // Piranha plant frame 2 - head sway opposite direction
    return [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1, 1],
      [1, 1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1, 1],
      [1, 1, 1, 1, 8, 8, 8, 1, 1, 1, 1, 8, 8, 8, 1, 1],
      [1, 1, 1, 1, 8, 8, 8, 1, 1, 1, 1, 8, 8, 8, 1, 1],
      [1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1],
      [1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1],
      [1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 8, 1, 1, 1],
      [1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 8, 8, 8, 8, 8, 1, 1, 1, 1, 1, 1],
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

  render(ctx, cameraX, cameraY) {
    const sprite = this.getSpriteData();
    if (!sprite) return;

    const drawX = Math.floor(this.x - cameraX);
    const drawY = Math.floor(this.y - cameraY);

    // Draw sprite pixel by pixel
    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        const colorIndex = sprite[row][col];
        // Skip green (pipe stem) pixels - they would be covered by pipe tile
        if (colorIndex !== 6) {
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
