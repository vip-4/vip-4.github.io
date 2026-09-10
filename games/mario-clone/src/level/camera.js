// Camera system with smooth follow and level bounds clamping
import { SCREEN } from '../levels/levels.js';

/**
 * Camera class - manages viewport position and following
 */
export class Camera {
    constructor(levelWidth, levelHeight) {
        this.x = 0;
        this.y = 0;
        this.width = SCREEN.WIDTH;
        this.height = SCREEN.HEIGHT;
        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;

        // Smooth follow parameters
        this.lerpFactor = 0.1;
        this.targetX = 0;
        this.targetY = 0;

        // Dead zone (player can move within this area without camera moving)
        this.deadZoneX = 64;
        this.deadZoneY = 32;

        // Camera shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    /**
     * Set the level bounds
     */
    setLevelBounds(levelWidth, levelHeight) {
        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;
    }

    /**
     * Follow a target entity with smooth lerp
     */
    follow(target) {
        if (!target) return;

        // Calculate target position (centered on player horizontally)
        this.targetX = target.x + target.width / 2 - this.width / 2;
        this.targetY = target.y + target.height / 2 - this.height / 2;

        // Apply dead zone
        const currentCenterX = this.x + this.width / 2;
        const targetCenterX = this.targetX + this.width / 2;
        const diffX = targetCenterX - currentCenterX;

        if (Math.abs(diffX) > this.deadZoneX) {
            this.targetX = currentCenterX + Math.sign(diffX) * (Math.abs(diffX) - this.deadZoneX) - this.width / 2;
        }

        // Smooth interpolation
        this.x += (this.targetX - this.x) * this.lerpFactor;
        this.y += (this.targetY - this.y) * this.lerpFactor;

        // Clamp to level bounds
        this.clampToBounds();
    }

    /**
     * Instant follow (no smoothing)
     */
    followInstant(target) {
        if (!target) return;

        this.x = target.x + target.width / 2 - this.width / 2;
        this.y = target.y + target.height / 2 - this.height / 2;

        this.clampToBounds();
    }

    /**
     * Clamp camera position to level boundaries
     */
    clampToBounds() {
        // Clamp horizontal
        const maxX = Math.max(0, this.levelWidth - this.width);
        this.x = Math.max(0, Math.min(this.x, maxX));

        // Clamp vertical (for levels shorter than screen height)
        const maxY = Math.max(0, this.levelHeight - this.height);
        this.y = Math.max(0, Math.min(this.y, maxY));
    }

    /**
     * Trigger camera shake
     */
    shake(intensity = 4, duration = 200) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = 0;
    }

    /**
     * Update camera (call each frame)
     */
    update(dt) {
        // Update shake
        if (this.shakeTimer < this.shakeDuration) {
            this.shakeTimer += dt;
            const progress = this.shakeTimer / this.shakeDuration;
            const currentIntensity = this.shakeIntensity * (1 - progress);

            this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentIntensity;
            this.shakeOffsetY = (Math.random() - 0.5) * 2 * currentIntensity;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
    }

    /**
     * Get camera position with shake offset applied
     */
    getPosition() {
        return {
            x: Math.floor(this.x + this.shakeOffsetX),
            y: Math.floor(this.y + this.shakeOffsetY)
        };
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        const pos = this.getPosition();
        return {
            x: worldX - pos.x,
            y: worldY - pos.y
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        const pos = this.getPosition();
        return {
            x: screenX + pos.x,
            y: screenY + pos.y
        };
    }

    /**
     * Check if a rectangle is visible on screen
     */
    isVisible(x, y, width, height) {
        const pos = this.getPosition();
        return (
            x + width > pos.x &&
            x < pos.x + this.width &&
            y + height > pos.y &&
            y < pos.y + this.height
        );
    }

    /**
     * Reset camera to starting position
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.shakeTimer = 0;
    }
}
