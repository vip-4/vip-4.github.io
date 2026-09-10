// Bowser boss entity
import { PALETTE } from '../sprites/sprites.js';
import { TILE_SIZE, COLORS } from '../levels/levels.js';

// Bowser sprite data - 32x32 (two 16x16 rows stacked)
const BOWSER_SPRITES = {
    idle: [
        // Top 16 rows (head area)
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        // Bottom 16 rows (shell/body)
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    hurt: [],
    dying: []
};

// Fireball sprite (8x8)
const FIREBALL_SPRITE = [
    [0,0,0,4,4,0,0,0],
    [0,0,4,5,5,4,0,0],
    [0,4,5,5,5,5,4,0],
    [4,5,5,4,4,5,5,4],
    [4,5,4,0,0,4,5,4],
    [0,4,4,0,0,4,4,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0]
];

// Helper to draw a sprite
function drawSprite(ctx, sprite, x, y, width, height) {
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const colorIndex = sprite[row][col];
            if (colorIndex !== 0) {
                ctx.fillStyle = PALETTE[colorIndex];
                ctx.fillRect(x + col, y + row, 1, 1);
            }
        }
    }
}

// Fireball class for Bowser's attacks
class Fireball {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.velX = direction * 3;
        this.velY = 0;
        this.gravity = 0.15;
        this.active = true;
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(dt, level) {
        if (!this.active) return;

        // Animate
        this.animTimer += dt;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        // Apply gravity
        this.velY += this.gravity;
        if (this.velY > 4) this.velY = 4;

        // Move
        this.x += this.velX;
        this.y += this.velY;

        // Check collision with level
        const tileSize = TILE_SIZE;
        const tileX = Math.floor((this.x + this.width / 2) / tileSize);
        const tileY = Math.floor((this.y + this.height / 2) / tileSize);

        if (level && level.isSolidTile(tileX, tileY)) {
            this.active = false;
        }

        // Off screen check
        if (this.x < -32 || this.x > level.width * tileSize + 32) {
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

    render(ctx, cameraX, cameraY) {
        if (!this.active) return;

        const screenX = Math.floor(this.x - cameraX);
        const screenY = Math.floor(this.y - cameraY);
        drawSprite(ctx, FIREBALL_SPRITE, screenX, screenY, 8, 8);
    }
}

export class Bowser {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;

        // Physics
        this.velX = 0;
        this.velY = 0;
        this.gravity = 0.4;
        this.jumpVelocity = -10;

        // State machine: idle, jumping, throwing, hurt, dying
        this.state = 'idle';

        // Health
        this.health = 5;
        this.hurtTimer = 0;
        this.hurtDuration = 500;

        // Facing
        this.facingRight = false;

        // Timers
        this.throwTimer = 0;
        this.throwInterval = 3000; // 3 seconds
        this.jumpTimer = 0;
        this.jumpInterval = 5000; // 5 seconds

        // Fireballs
        this.fireballs = [];

        // Ground check
        this.grounded = false;

        // Death animation
        this.deathTimer = 0;
        this.deathFlipping = false;
    }

    /**
     * Update Bowser
     */
    update(dt, level, playerX) {
        // Update fireballs
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            this.fireballs[i].update(dt, level);
            if (!this.fireballs[i].active) {
                this.fireballs.splice(i, 1);
            }
        }

        // Face player
        if (playerX !== undefined) {
            this.facingRight = playerX > this.x;
        }

        switch (this.state) {
            case 'idle':
                this.updateIdle(dt);
                break;
            case 'jumping':
                this.updateJumping(dt, level);
                break;
            case 'throwing':
                this.updateThrowing(dt);
                break;
            case 'hurt':
                this.updateHurt(dt);
                break;
            case 'dying':
                this.updateDying(dt);
                break;
        }
    }

    /**
     * Idle state - occasionally throw fireballs or jump
     */
    updateIdle(dt) {
        this.throwTimer += dt;
        this.jumpTimer += dt;

        // Throw fireball every 3 seconds
        if (this.throwTimer >= this.throwInterval) {
            this.throwTimer = 0;
            this.throwFireball();
        }

        // Jump every 5 seconds
        if (this.jumpTimer >= this.jumpInterval) {
            this.jumpTimer = 0;
            this.jump();
        }
    }

    /**
     * Jumping state
     */
    updateJumping(dt, level) {
        // Apply gravity
        this.velY += this.gravity;
        if (this.velY > 8) this.velY = 8;

        // Move
        this.y += this.velY;

        // Check ground collision
        const tileSize = TILE_SIZE;
        const bottomTile = Math.floor((this.y + this.height) / tileSize);
        const leftTile = Math.floor(this.x / tileSize);
        const rightTile = Math.floor((this.x + this.width - 1) / tileSize);

        if (this.velY > 0) {
            for (let tx = leftTile; tx <= rightTile; tx++) {
                if (level && level.isSolidTile(tx, bottomTile)) {
                    this.y = bottomTile * tileSize - this.height;
                    this.velY = 0;
                    this.grounded = true;
                    this.state = 'idle';
                    break;
                }
            }
        }
    }

    /**
     * Throwing state (brief state during fireball throw)
     */
    updateThrowing(dt) {
        // Transition back to idle after throw
        this.state = 'idle';
    }

    /**
     * Hurt state
     */
    updateHurt(dt) {
        this.hurtTimer += dt;
        if (this.hurtTimer >= this.hurtDuration) {
            this.hurtTimer = 0;
            if (this.health <= 0) {
                this.state = 'dying';
            } else {
                this.state = 'idle';
            }
        }
    }

    /**
     * Dying state - flip shell and fall
     */
    updateDying(dt) {
        this.deathTimer += dt;

        // Simple death: just sink into ground
        if (this.deathTimer > 1000) {
            this.y += 1;
        }
    }

    /**
     * Throw a fireball
     */
    throwFireball() {
        const direction = this.facingRight ? 1 : -1;
        const fireballX = this.facingRight ? this.x + this.width : this.x - 8;
        const fireballY = this.y + 10;

        this.fireballs.push(new Fireball(fireballX, fireballY, direction));
        this.state = 'throwing';
    }

    /**
     * Jump
     */
    jump() {
        if (this.grounded) {
            this.velY = this.jumpVelocity;
            this.grounded = false;
            this.state = 'jumping';
        }
    }

    /**
     * Take damage (stomped)
     */
    takeDamage() {
        this.health--;
        this.state = 'hurt';
        this.hurtTimer = 0;

        // Bounce
        this.velY = -6;
        this.grounded = false;
    }

    /**
     * Check if defeated
     */
    isDefeated() {
        return this.health <= 0 && this.deathTimer > 2000;
    }

    /**
     * Get bounding box
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
     * Render Bowser
     */
    render(ctx, cameraX, cameraY) {
        const screenX = Math.floor(this.x - cameraX);
        const screenY = Math.floor(this.y - cameraY);

        // Draw Bowser as a large red/orange character
        // Shell (bottom half)
        ctx.fillStyle = COLORS.RED;
        ctx.fillRect(screenX + 4, screenY + 16, 24, 16);

        // Shell pattern
        ctx.fillStyle = '#A00000';
        ctx.fillRect(screenX + 8, screenY + 20, 6, 8);
        ctx.fillRect(screenX + 18, screenY + 20, 6, 8);

        // Head (top half)
        ctx.fillStyle = COLORS.RED;
        ctx.fillRect(screenX + 6, screenY + 4, 20, 14);

        // Face details
        ctx.fillStyle = COLORS.WHITE;
        // Eyes
        const eyeOffset = this.facingRight ? 4 : 0;
        ctx.fillRect(screenX + 8 + eyeOffset, screenY + 8, 4, 4);
        ctx.fillRect(screenX + 18 + eyeOffset, screenY + 8, 4, 4);
        // Mouth
        ctx.fillStyle = '#A00000';
        ctx.fillRect(screenX + 10, screenY + 14, 10, 3);

        // Hair (top)
        ctx.fillStyle = '#A00000';
        ctx.fillRect(screenX + 4, screenY + 2, 4, 6);
        ctx.fillRect(screenX + 10, screenY + 0, 4, 4);
        ctx.fillRect(screenX + 18, screenY + 2, 4, 4);

        // Show hurt state
        if (this.state === 'hurt') {
            ctx.globalAlpha = Math.sin(this.hurtTimer * 0.05) * 0.5 + 0.5;
        }

        // Show dying state - flip/shell
        if (this.state === 'dying') {
            ctx.globalAlpha = 1 - (this.deathTimer / 2000);
        }

        ctx.globalAlpha = 1;

        // Render fireballs
        for (const fireball of this.fireballs) {
            fireball.render(ctx, cameraX, cameraY);
        }
    }
}
