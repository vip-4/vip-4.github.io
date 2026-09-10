/**
 * Physics System for Cyber Runner
 * Handles collision detection and physics calculations
 */

class Physics {
    constructor() {
        this.gravity = 0.6;
        this.terminalVelocity = 15;
    }

    /**
     * Apply gravity to an entity
     */
    applyGravity(entity, deltaTime = 1) {
        entity.velocityY += this.gravity * deltaTime;
        if (entity.velocityY > this.terminalVelocity) {
            entity.velocityY = this.terminalVelocity;
        }
    }

    /**
     * Update entity position based on velocity
     */
    updatePosition(entity, deltaTime = 1) {
        entity.x += entity.velocityX * deltaTime;
        entity.y += entity.velocityY * deltaTime;
    }

    /**
     * AABB collision detection
     */
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    /**
     * Check if entity is on top of a platform
     */
    checkPlatformCollision(entity, platform, previousY) {
        // Was above platform before, now overlapping
        const wasAbove = previousY + entity.height <= platform.y + 5;
        const isOverlapping = this.checkCollision(entity, platform);
        const isFalling = entity.velocityY >= 0;
        
        if (wasAbove && isOverlapping && isFalling) {
            return {
                collided: true,
                correctedY: platform.y - entity.height
            };
        }
        
        return { collided: false };
    }

    /**
     * Check collision with obstacle
     * Returns collision info with penetration depth
     */
    checkObstacleCollision(entity, obstacle) {
        // Create slightly smaller hitbox for player (more forgiving)
        const playerHitbox = {
            x: entity.x + 8,
            y: entity.y + 5,
            width: entity.width - 16,
            height: entity.height - 10
        };
        
        return this.checkCollision(playerHitbox, obstacle);
    }

    /**
     * Check if entity is grounded
     */
    isGrounded(entity, groundY) {
        return entity.y + entity.height >= groundY;
    }

    /**
     * Resolve ground collision
     */
    resolveGroundCollision(entity, groundY) {
        if (entity.y + entity.height > groundY) {
            entity.y = groundY - entity.height;
            entity.velocityY = 0;
            entity.grounded = true;
            return true;
        }
        return false;
    }

    /**
     * Calculate jump velocity for desired height
     */
    calculateJumpVelocity(height) {
        return -Math.sqrt(2 * this.gravity * height);
    }

    /**
     * Predict landing position
     */
    predictLanding(x, y, velocityX, velocityY, groundY) {
        let px = x;
        let py = y;
        let vy = velocityY;
        
        while (py < groundY) {
            vy += this.gravity;
            py += vy;
            px += velocityX;
        }
        
        return { x: px, y: groundY };
    }
}

// Singleton instance
const physics = new Physics();
