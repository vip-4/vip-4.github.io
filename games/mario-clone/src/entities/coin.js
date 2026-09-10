// Coin entity with spin animation
import { PALETTE, getObjectSprite } from '../sprites/sprites.js';

// Helper to draw a sprite from pixel data
function drawSprite(ctx, sprite, x, y, width = 16, height = 16) {
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

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.animDuration = 200; // ms per frame

        // State
        this.collected = false;
        this.collectTimer = 0;
        this.collecting = false; // True when being collected (floating up)

        // For floating up animation on collection
        this.startY = y;
    }

    /**
     * Update coin animation
     */
    update(dt) {
        if (this.collected && !this.collecting) return;

        if (this.collecting) {
            // Float up and fade out
            this.collectTimer += dt;
            this.y = this.startY - (this.collectTimer / 500) * 24;
            if (this.collectTimer > 500) {
                this.collected = true;
            }
            return;
        }

        // Spin animation
        this.animTimer += dt;
        if (this.animTimer >= this.animDuration) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    /**
     * Collect the coin (starts collection animation)
     */
    collect() {
        if (!this.collected && !this.collecting) {
            this.collecting = true;
            this.startY = this.y;
            this.collectTimer = 0;
        }
    }

    /**
     * Check if coin is fully collected
     */
    isCollected() {
        return this.collected;
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
     * Render the coin with spin animation
     */
    render(ctx, cameraX, cameraY) {
        if (this.collected) return;

        const screenX = Math.floor(this.x - cameraX);
        const screenY = Math.floor(this.y - cameraY);

        // Get the appropriate coin frame
        const sprite = getObjectSprite('coin', this.animFrame);
        if (sprite) {
            drawSprite(ctx, sprite, screenX, screenY, 16, 16);
        }
    }
}
