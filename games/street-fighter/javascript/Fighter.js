class Fighter extends Sprite {
    constructor({
        position,
        velocity,
        color = 'red',
        imageSrc,
        scale = 1,
        framesMax = 1,
        framesRows = 1,
        imageCols,
        offset = { x: 0, y: 0 },
        sprites,
        attackBox = { offset: {}, width: undefined, height: undefined }
    }) {
        super({
            position,
            imageSrc,
            scale,
            framesMax,
            framesRows,
            imageCols,
            offset
        });

        this.velocity = velocity;
        this.width = 50; // Hitbox width
        this.height = 150; // Hitbox height
        this.lastKey;
        this.attackBox = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            offset: attackBox.offset,
            width: attackBox.width,
            height: attackBox.height
        };
        this.color = color;
        this.isAttacking;
        this.health = 100;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 10;
        this.sprites = sprites;
        this.dead = false;
        this.baseAttackOffset = {
            x: attackBox.offset.x || 0,
            y: attackBox.offset.y || 0
        };
        this.facing = this.baseAttackOffset.x >= 0 ? 'right' : 'left';
        this.updateAttackDirection();

        // Ensure all sprites have the image object shared if same
        // But here we rely on the main image and just switch properties
        this.currentSprite = 'idle';
    }

    setFacing(direction) {
        if (direction !== 'left' && direction !== 'right') return;
        this.facing = direction;
        this.updateAttackDirection();
    }

    updateAttackDirection() {
        const horizontalOffset = Math.abs(this.baseAttackOffset.x);
        this.attackBox.offset.x = this.facing === 'right' ? horizontalOffset : -horizontalOffset;
        this.attackBox.offset.y = this.baseAttackOffset.y;
        this.shouldFlip = this.facing === 'left';
    }

    update() {
        this.draw();
        if (!this.dead) this.animateFrames();

        // Attack box follows the player
        this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

        // Debug hitboxes
        // c.fillStyle = 'rgba(0, 255, 0, 0.2)';
        // c.fillRect(this.position.x, this.position.y, this.width, this.height);
        // if (this.isAttacking) {
        //    c.fillStyle = 'rgba(255, 0, 0, 0.2)';
        //    c.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
        // }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Gravity
        const groundLevel = canvas.height - 96;
        if (this.position.y + this.height + this.velocity.y >= groundLevel) {
            this.velocity.y = 0;
            this.position.y = groundLevel - this.height;
        } else {
            this.velocity.y += gravity;
        }
    }

    attack() {
        this.switchSprite('attack1');
        this.isAttacking = true;
    }

    takeHit() {
        this.health -= 20;

        if (this.health <= 0) {
            this.switchSprite('death');
        } else {
            this.switchSprite('takeHit');
        }
    }

    switchSprite(sprite) {
        // Overrides
        if (this.currentSprite === 'death') {
            if (this.framesCurrent === this.sprites.death.framesMax - 1)
                this.dead = true;
            return;
        }

        if (
            this.currentSprite === 'attack1' &&
            this.framesCurrent < this.sprites.attack1.framesMax - 1
        )
            return;

        if (
            this.currentSprite === 'takeHit' &&
            this.framesCurrent < this.sprites.takeHit.framesMax - 1
        )
            return;

        // Switch logic
        if (this.currentSprite !== sprite) {
            this.currentSprite = sprite;
            const spriteConfig = this.sprites[sprite];

            this.framesMax = spriteConfig.framesMax;
            this.frameY = spriteConfig.frameY; // Switch row
            this.framesCurrent = 0;
        }
    }
}
