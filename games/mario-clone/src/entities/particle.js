// Particle system for visual effects
import { PALETTE } from '../sprites/sprites.js';
import { COLORS } from '../levels/levels.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'brickFragment', 'sparkle', 'dust'

        // Velocity
        this.velX = 0;
        this.velY = 0;

        // Physics
        this.gravity = 0.25;

        // Lifetime
        this.lifetime = 500; // ms
        this.age = 0;

        // Size
        this.size = 4;

        // Color
        this.color = null;

        // Initialize based on type
        this.init(type);
    }

    /**
     * Initialize particle properties based on type
     */
    init(type) {
        switch (type) {
            case 'brickFragment':
                this.size = 4;
                this.lifetime = 500;
                this.color = COLORS.BROWN_DARK;
                // Random velocity with upward bias
                this.velX = (Math.random() - 0.5) * 6;
                this.velY = -Math.random() * 4 - 2;
                break;

            case 'sparkle':
                this.size = 2;
                this.lifetime = 300;
                this.color = Math.random() > 0.5 ? COLORS.YELLOW : COLORS.WHITE;
                // Random direction
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 1;
                this.velX = Math.cos(angle) * speed;
                this.velY = Math.sin(angle) * speed;
                break;

            case 'dust':
                this.size = 3;
                this.lifetime = 400;
                this.color = COLORS.BROWN_MID;
                // Rise upward
                this.velX = (Math.random() - 0.5) * 1;
                this.velY = -Math.random() * 1.5 - 0.5;
                break;
        }
    }

    /**
     * Update particle
     */
    update(dt) {
        this.age += dt;

        // Apply gravity (not to dust)
        if (this.type === 'brickFragment') {
            this.velY += this.gravity;
            if (this.velY > 8) this.velY = 8;
        }

        // Move
        this.x += this.velX;
        this.y += this.velY;

        // Slow down dust
        if (this.type === 'dust') {
            this.velX *= 0.98;
        }
    }

    /**
     * Check if particle is still alive
     */
    isAlive() {
        return this.age < this.lifetime;
    }

    /**
     * Get opacity based on remaining lifetime
     */
    getOpacity() {
        const remaining = 1 - (this.age / this.lifetime);
        return Math.max(0, remaining);
    }

    /**
     * Render the particle
     */
    render(ctx, cameraX, cameraY) {
        if (!this.isAlive()) return;

        const screenX = Math.floor(this.x - cameraX);
        const screenY = Math.floor(this.y - cameraY);
        const opacity = this.getOpacity();

        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * Emit particles at a position
     */
    emit(x, y, type, count = 1) {
        switch (type) {
            case 'brickFragment':
                // Emit 4 fragments in a cone pattern
                for (let i = 0; i < 4; i++) {
                    const p = new Particle(x, y, type);
                    // Spread in a fan pattern
                    p.velX = -3 + i * 2; // -3, -1, 1, 3
                    p.velY = -4 - Math.random() * 2;
                    this.particles.push(p);
                }
                break;

            case 'sparkle':
                // Emit sparkles in random directions
                for (let i = 0; i < count; i++) {
                    this.particles.push(new Particle(x, y, type));
                }
                break;

            case 'dust':
                // Emit dust rising up
                for (let i = 0; i < count; i++) {
                    const p = new Particle(x + (Math.random() - 0.5) * 8, y, type);
                    this.particles.push(p);
                }
                break;
        }
    }

    /**
     * Update all particles
     */
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);

            // Remove dead particles
            if (!p.isAlive()) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Render all particles
     */
    render(ctx, cameraX, cameraY) {
        for (const p of this.particles) {
            p.render(ctx, cameraX, cameraY);
        }
    }

    /**
     * Get particle count
     */
    getCount() {
        return this.particles.length;
    }
}
