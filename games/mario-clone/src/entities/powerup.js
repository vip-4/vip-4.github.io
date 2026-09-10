// Powerup entities - Mushroom, Fire Flower, Star
import { PALETTE, getObjectSprite } from '../sprites/sprites.js';
import { TILE_SIZE } from '../levels/levels.js';

// Helper to draw a sprite from pixel data
function drawSprite(ctx, sprite, x, y, width = 16, height = 16, flipped = false) {
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const colorIndex = sprite[row][col];
            if (colorIndex !== 0) {
                ctx.fillStyle = PALETTE[colorIndex];
                const drawX = flipped ? x + width - 1 - col : x + col;
                ctx.fillRect(drawX, y + row, 1, 1);
            }
        }
    }
}

export class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.type = type; // 'mushroom', 'fireFlower', 'star'

        // Physics
        this.velX = 0;
        this.velY = 0;
        this.gravity = 0.3;
        this.terminalVelocity = 4;

        // State: hidden, bouncing, active
        this.state = 'hidden';

        // For bouncing animation
        this.bounceTimer = 0;
        this.bounceHeight = 0;
        this.startY = y;

        // For star flashing
        this.flashTimer = 0;
        this.flashIndex = 0;
        this.flashColors = [2, 4, 5, 8]; // red, orange, yellow, green

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;

        // Movement
        this.speed = 2;
        this.active = false;
    }

    /**
     * Spawn the powerup from a ? block
     */
    spawn() {
        if (this.state === 'hidden') {
            this.state = 'bouncing';
            this.startY = this.y;
        }
    }

    /**
     * Update powerup state
     */
    update(dt, level) {
        // Update animation timers
        this.animTimer += dt;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        // Flash timer for star
        this.flashTimer += dt;

        if (this.state === 'hidden') {
            return;
        }

        if (this.state === 'bouncing') {
            // Pop up from block and start falling
            this.bounceTimer += dt;
            // Bounce up for about 300ms then start falling
            if (this.bounceTimer < 300) {
                this.y = this.startY - Math.sin((this.bounceTimer / 300) * Math.PI) * 16;
            } else {
                this.state = 'active';
                this.active = true;
                this.velX = this.speed;
            }
        }

        if (this.state === 'active') {
            // Apply gravity
            this.velY += this.gravity;
            if (this.velY > this.terminalVelocity) {
                this.velY = this.terminalVelocity;
            }

            // Move
            this.x += this.velX;
            this.y += this.velY;

            // Horizontal collision with level
            this.resolveHorizontalCollision(level);

            // Vertical collision
            this.resolveVerticalCollision(level);
        }
    }

    /**
     * Resolve horizontal collision
     */
    resolveHorizontalCollision(level) {
        if (!level) return;

        const tileSize = TILE_SIZE;
        const left = Math.floor(this.x / tileSize);
        const right = Math.floor((this.x + this.width - 1) / tileSize);
        const top = Math.floor(this.y / tileSize);
        const bottom = Math.floor((this.y + this.height - 1) / tileSize);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (level.isSolidTile(tx, ty)) {
                    if (this.velX > 0) {
                        this.x = tx * tileSize - this.width;
                        this.velX = -this.speed; // Reverse direction
                    } else if (this.velX < 0) {
                        this.x = (tx + 1) * tileSize;
                        this.velX = this.speed; // Reverse direction
                    }
                }
            }
        }
    }

    /**
     * Resolve vertical collision
     */
    resolveVerticalCollision(level) {
        if (!level) return;

        const tileSize = TILE_SIZE;
        const left = Math.floor(this.x / tileSize);
        const right = Math.floor((this.x + this.width - 1) / tileSize);
        const top = Math.floor(this.y / tileSize);
        const bottom = Math.floor((this.y + this.height - 1) / tileSize);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (level.isSolidTile(tx, ty)) {
                    if (this.velY > 0) {
                        this.y = ty * tileSize - this.height;
                        this.velY = 0;
                    } else if (this.velY < 0) {
                        this.y = (ty + 1) * tileSize;
                        this.velY = 0;
                    }
                }
            }
        }
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
     * Render the powerup
     */
    render(ctx, cameraX, cameraY) {
        if (this.state === 'hidden') return;

        const screenX = Math.floor(this.x - cameraX);
        const screenY = Math.floor(this.y - cameraY);

        if (this.type === 'mushroom') {
            // Red mushroom cap
            const sprite = getObjectSprite('mushroom', 0);
            drawSprite(ctx, sprite, screenX, screenY, 16, 16);
        } else if (this.type === 'fireFlower') {
            // Fire flower
            const sprite = getObjectSprite('fireFlower', 0);
            drawSprite(ctx, sprite, screenX, screenY, 16, 16);
        } else if (this.type === 'star') {
            // Star with flashing colors
            const sprite = getObjectSprite('star', 0);
            drawSprite(ctx, sprite, screenX, screenY, 16, 16);
        }
    }
}
