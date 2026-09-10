// Player entity with physics, collision, animation, and power state
import { PHYSICS, TILE_SIZE, TILE_TYPES, COLORS } from '../levels/levels.js';
import { PALETTE, getMarioSprites, getObjectSprite } from '../sprites/sprites.js';
import { PLAYER_STATES, createPlayerAnimator, getPlayerAnimationState } from '../sprites/animation.js';
import { playJumpSound, playCoinSound, playBumpSound, playBreakSound } from '../audio.js';

export class Player {
    constructor(x, y) {
        // Position and dimensions
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;

        // Velocity
        this.velX = 0;
        this.velY = 0;

        // Movement parameters
        this.speed = PHYSICS.MAX_SPEED;
        this.jumpVelocity = PHYSICS.JUMP_VELOCITY;
        this.jumpHeld = false;
        this.maxJumpVelocity = PHYSICS.FULL_JUMP_VELOCITY || -15;

        // Physics
        this.gravity = PHYSICS.GRAVITY;
        this.terminalVelocity = PHYSICS.TERMINAL_VELOCITY;
        this.friction = PHYSICS.FRICTION;

        // State
        this.grounded = false;
        this.jumping = false;
        this.facingRight = true;
        this.playerState = PLAYER_STATES.IDLE;

        // Power state (small, super, fire, star)
        this.powerState = 'small';

        // Invincibility
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 10000; // 10 seconds for star

        // Animation
        this.animator = createPlayerAnimator();
        this.animator.play('small_idle');
        this.currentSprite = null;
        this.spriteFlashTimer = 0;
        this.spriteFlashState = false;

        // Level reference
        this.level = null;

        // Jump release flag for variable jump
        this.jumpReleased = true;

        // Tile coin collection tracking
        this.coinsCollectedThisFrame = 0;
    }

    /**
     * Set the level reference
     */
    setLevel(level) {
        this.level = level;
    }

    /**
     * Update player physics and state
     */
    update(dt, input, level) {
        this.level = level;
        this.coinsCollectedThisFrame = 0;

        // Handle invincibility timer
        if (this.invincible) {
            this.invincibleTimer += dt;
            if (this.invincibleTimer >= this.invincibleDuration) {
                this.invincible = false;
                this.invincibleTimer = 0;
                this.powerState = 'super'; // Revert from star to super
            }
            // Flash sprite during invincibility
            this.spriteFlashTimer += dt;
            if (this.spriteFlashTimer > 100) {
                this.spriteFlashTimer = 0;
                this.spriteFlashState = !this.spriteFlashState;
            }
        }

        // Horizontal movement
        const direction = input.getHorizontalDirection();
        if (direction !== 0) {
            this.velX = direction * this.speed;
            this.facingRight = direction > 0;
        } else {
            // Apply friction when not pressing direction
            this.velX *= (1 - this.friction);
            if (Math.abs(this.velX) < 0.1) {
                this.velX = 0;
            }
        }

        // Variable jump - detect jump press and release
        // Use held state (keys.jump) not single-frame trigger, so pressing
        // jump while airborne will fire as soon as the player lands
        if (input.keys.jump && this.grounded && this.jumpReleased) {
            this.velY = this.maxJumpVelocity;
            this.grounded = false;
            this.jumping = true;
            this.jumpReleased = false;
            this.jumpHeld = true;
            playJumpSound();
        }

        // Variable jump height - cut velocity if button released mid-air
        if (!input.keys.jump && this.jumping && this.velY < this.jumpVelocity) {
            this.velY = this.jumpVelocity; // Cut to 40% of max jump
            this.jumpHeld = false;
        }

        // Track if jump was released (for preventing continuous jumping)
        if (!input.keys.jump) {
            this.jumpReleased = true;
        }

        // Apply gravity
        this.velY += this.gravity;
        if (this.velY > this.terminalVelocity) {
            this.velY = this.terminalVelocity;
        }

        // Move horizontally and check collision
        this.x += this.velX;
        this.resolveHorizontalCollision(level);

        // Move vertically and check collision
        this.y += this.velY;
        const bumpResult = this.resolveVerticalCollision(level);

        // Handle bumpable blocks and brick breaking
        if (bumpResult) {
            if (bumpResult.bump) {
                this.bumpBlock(bumpResult.col, bumpResult.row, level);
            }
            if (bumpResult.break) {
                this.breakBrick(bumpResult.col, bumpResult.row, level);
            }
        }

        // Check coin collection
        this.collectCoins(level);

        // Determine animation state
        this.updatePlayerState();

        // Update animation
        const animState = getPlayerAnimationState(this);
        this.animator.play(animState);
        this.animator.update();

        // Get current sprite
        this.currentSprite = this.animator.getCurrentFrame();
    }

    /**
     * Update player state (idle, walk, jump, fall, duck)
     */
    updatePlayerState() {
        if (this.grounded) {
            if (Math.abs(this.velX) > 0.5) {
                this.playerState = PLAYER_STATES.WALK;
            } else {
                this.playerState = PLAYER_STATES.IDLE;
            }
        } else {
            if (this.velY < 0) {
                this.playerState = PLAYER_STATES.JUMP;
            } else {
                this.playerState = PLAYER_STATES.FALL;
            }
        }
    }

    /**
     * Resolve horizontal collision with level tiles
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
                        // Moving right, hit left side of tile
                        this.x = tx * tileSize - this.width;
                        this.velX = 0;
                    } else if (this.velX < 0) {
                        // Moving left, hit right side of tile
                        this.x = (tx + 1) * tileSize;
                        this.velX = 0;
                    }
                }
            }
        }
    }

    /**
     * Resolve vertical collision with level tiles
     */
    resolveVerticalCollision(level) {
        if (!level) return null;

        this.grounded = false;
        const tileSize = TILE_SIZE;
        const left = Math.floor(this.x / tileSize);
        const right = Math.floor((this.x + this.width - 1) / tileSize);
        const top = Math.floor(this.y / tileSize);
        const bottom = Math.floor((this.y + this.height - 1) / tileSize);

        let bumpResult = null;

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (level.isSolidTile(tx, ty)) {
                    if (this.velY > 0) {
                        // Falling, hit top of tile
                        this.y = ty * tileSize - this.height;
                        this.velY = 0;
                        this.grounded = true;
                        this.jumping = false;
                        this.jumpHeld = false;
                    } else if (this.velY < 0) {
                        // Rising, hit bottom of tile - check for question block or brick
                        this.y = (ty + 1) * tileSize;
                        this.velY = 0;

                        // Check if it's a question block or breakable brick
                        const tileType = level.getTileAt(tx, ty);
                        if (tileType === TILE_TYPES.QUESTION) {
                            bumpResult = { bump: true, col: tx, row: ty };
                        } else if (tileType === TILE_TYPES.BRICK && this.powerState !== 'small') {
                            bumpResult = { break: true, col: tx, row: ty };
                        }
                    }
                }
            }
        }

        return bumpResult;
    }

    /**
     * Bump a question block
     */
    bumpBlock(col, row, level) {
        playBumpSound();

        // Convert used block (would emit coin/powerup in full implementation)
        level.setTileAt(col, row, TILE_TYPES.USED);
    }

    /**
     * Break a brick block
     */
    breakBrick(col, row, level) {
        playBreakSound();

        // Set tile to air
        level.setTileAt(col, row, TILE_TYPES.AIR);

        // Create 4 particle fragments
        // This would be handled by particle system
    }

    /**
     * Collect coins
     */
    collectCoins(level) {
        if (!level) return;

        const tileSize = TILE_SIZE;
        const playerLeft = Math.floor(this.x / tileSize);
        const playerRight = Math.floor((this.x + this.width - 1) / tileSize);
        const playerTop = Math.floor(this.y / tileSize);
        const playerBottom = Math.floor((this.y + this.height - 1) / tileSize);

        for (let ty = playerTop; ty <= playerBottom; ty++) {
            for (let tx = playerLeft; tx <= playerRight; tx++) {
                if (level.getTileAt(tx, ty) === TILE_TYPES.COIN) {
                    level.setTileAt(tx, ty, TILE_TYPES.AIR);
                    playCoinSound();
                    this.coinsCollectedThisFrame++;
                }
            }
        }
    }

    /**
     * Grow to super Mario
     */
    grow() {
        if (this.powerState === 'small') {
            this.powerState = 'super';
            this.height = 32;
            this.y -= 16; // Move up since we're taller now
        }
    }

    /**
     * Get power state for rendering
     */
    getPowerState() {
        return this.powerState;
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
     * Get position for rendering
     */
    getRenderPosition(cameraX, cameraY) {
        return {
            x: Math.floor(this.x - cameraX),
            y: Math.floor(this.y - cameraY)
        };
    }

    /**
     * Render the player with sprite
     */
    render(ctx, cameraX, cameraY) {
        const pos = this.getRenderPosition(cameraX, cameraY);

        // Get Mario sprites based on power state
        const sprites = getMarioSprites(this.powerState);

        // Get current animation frame sprite
        let spriteData = null;
        const animState = getPlayerAnimationState(this);

        if (sprites[animState]) {
            spriteData = sprites[animState];
        } else if (sprites.idle) {
            spriteData = sprites.idle;
        } else if (sprites.idle1) {
            spriteData = sprites.idle1;
        }

        if (spriteData) {
            // Handle star Mario flashing
            if (this.powerState === 'star' && this.spriteFlashState) {
                // Skip rendering every other frame for flashing effect
                return;
            }

            // Draw the sprite
            if (this.facingRight) {
                this.drawSpriteNormal(ctx, spriteData, pos.x, pos.y);
            } else {
                this.drawSpriteFlipped(ctx, spriteData, pos.x, pos.y);
            }
        } else {
            // Fallback: draw colored rectangle
            ctx.fillStyle = COLORS.RED;
            ctx.fillRect(pos.x, pos.y, this.width, this.height);
        }
    }

    /**
     * Draw sprite normally
     */
    drawSpriteNormal(ctx, spriteData, screenX, screenY) {
        const colors = PALETTE;
        for (let row = 0; row < spriteData.length; row++) {
            for (let col = 0; col < spriteData[row].length; col++) {
                const colorIndex = spriteData[row][col];
                if (colorIndex !== 0 && colorIndex !== null) {
                    const color = colors[colorIndex];
                    if (color) {
                        ctx.fillStyle = color;
                        ctx.fillRect(screenX + col, screenY + row, 1, 1);
                    }
                }
            }
        }
    }

    /**
     * Draw sprite flipped horizontally
     */
    drawSpriteFlipped(ctx, spriteData, screenX, screenY) {
        const colors = PALETTE;
        for (let row = 0; row < spriteData.length; row++) {
            for (let col = 0; col < spriteData[row].length; col++) {
                const colorIndex = spriteData[row][spriteData[row].length - 1 - col];
                if (colorIndex !== 0 && colorIndex !== null) {
                    const color = colors[colorIndex];
                    if (color) {
                        ctx.fillStyle = color;
                        ctx.fillRect(screenX + col, screenY + row, 1, 1);
                    }
                }
            }
        }
    }

    /**
     * Check if player is falling into a pit
     */
    isInPit(level) {
        if (!level) return false;
        const tileSize = TILE_SIZE;
        const levelHeight = level.height * tileSize;
        if (this.y > levelHeight + 32) return true;

        // Check if standing on lava
        const bottomRow = Math.floor((this.y + this.height) / tileSize);
        const leftCol = Math.floor(this.x / tileSize);
        const rightCol = Math.floor((this.x + this.width - 1) / tileSize);
        for (let tx = leftCol; tx <= rightCol; tx++) {
            if (level.getTileAt(tx, bottomRow) === TILE_TYPES.LAVA) {
                return true;
            }
        }
        return false;
    }

    /**
     * Reset player to spawn position
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
        this.grounded = false;
        this.jumping = false;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.jumpReleased = true;
        this.jumpHeld = false;

        // Reset to small Mario
        if (this.powerState !== 'small') {
            this.powerState = 'small';
            this.height = 16;
        }
    }
}
