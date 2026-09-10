/**
 * Player Class for Cyber Runner
 * Handles player state, input, and animations
 */

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        
        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.grounded = false;
        
        // Jump mechanics
        this.jumpPower = -12;
        this.jumpHoldPower = -0.3;
        this.maxJumpHoldTime = 150; // ms
        this.jumpHoldTimer = 0;
        this.isJumping = false;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 80; // ms per frame
        this.frames = null;
        
        // State
        this.alive = true;
        
        // Trail effect
        this.trail = [];
        this.maxTrailLength = 6;
    }

    /**
     * Initialize player sprites
     */
    init(assets) {
        this.frames = assets.generatePlayerFrames(this.width, this.height);
    }

    /**
     * Handle jump input
     */
    jump(audioSystem) {
        if (this.grounded) {
            this.velocityY = this.jumpPower;
            this.grounded = false;
            this.isJumping = true;
            this.jumpHoldTimer = 0;
            if (audioSystem) audioSystem.play('jump');
        }
    }

    /**
     * Handle jump hold (variable height)
     */
    holdJump(deltaTime) {
        if (this.isJumping && this.jumpHoldTimer < this.maxJumpHoldTime && this.velocityY < 0) {
            this.velocityY += this.jumpHoldPower;
            this.jumpHoldTimer += deltaTime;
        }
    }

    /**
     * Release jump
     */
    releaseJump() {
        this.isJumping = false;
    }

    /**
     * Update player state
     */
    update(deltaTime, groundY) {
        const previousY = this.y;
        
        // Apply gravity
        physics.applyGravity(this, deltaTime / 16.67);
        
        // Update position
        this.y += this.velocityY * (deltaTime / 16.67);
        
        // Ground collision
        if (physics.resolveGroundCollision(this, groundY)) {
            this.grounded = true;
            this.isJumping = false;
        } else {
            this.grounded = false;
        }
        
        // Update animation (faster when running)
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % 4;
        }
        
        // Update trail
        this.trail.unshift({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }
        
        // Fade trail
        for (let i = 0; i < this.trail.length; i++) {
            this.trail[i].alpha = 1 - (i / this.maxTrailLength);
        }
        
        return previousY;
    }

    /**
     * Handle landing on a building
     */
    landOnBuilding(rooftopY, audioSystem) {
        this.y = rooftopY - this.height;
        this.velocityY = 0;
        this.grounded = true;
        this.isJumping = false;
        if (audioSystem) audioSystem.play('land');
    }

    /**
     * Kill the player
     */
    die() {
        this.alive = false;
        return true;
    }

    /**
     * Reset player state
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.grounded = false;
        this.alive = true;
        this.isJumping = false;
        this.trail = [];
        this.animationFrame = 0;
    }

    /**
     * Get current sprite frame
     */
    getCurrentFrame() {
        if (!this.frames) return null;
        
        if (!this.grounded) {
            return this.frames[4]; // Jump frame
        }
        return this.frames[this.animationFrame];
    }

    /**
     * Get hitbox for collision
     */
    getHitbox() {
        return {
            x: this.x + 4,
            y: this.y + 4,
            width: this.width - 8,
            height: this.height - 8
        };
    }
}
