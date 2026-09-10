/**
 * Utility functions for Cyber Runner
 */

const Utils = {
    /**
     * Generate a random number between min and max (inclusive)
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Generate a random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Pick a random element from an array
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Check if two rectangles overlap (AABB collision)
     */
    rectsOverlap(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    },

    /**
     * Get high score from localStorage
     */
    getHighScore() {
        return parseInt(localStorage.getItem('cyberRunnerHighScore') || '0', 10);
    },

    /**
     * Save high score to localStorage
     */
    setHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            localStorage.setItem('cyberRunnerHighScore', score.toString());
            return true;
        }
        return false;
    },

    /**
     * Format score with commas
     */
    formatScore(score) {
        return Math.floor(score).toLocaleString();
    },

    /**
     * Seeded random number generator (simple LCG)
     */
    createSeededRandom(seed) {
        let s = seed;
        return function() {
            s = (s * 1664525 + 1013904223) % 4294967296;
            return s / 4294967296;
        };
    },

    /**
     * Perlin-like noise (simplified)
     */
    noise(x, seed = 0) {
        const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
        return n - Math.floor(n);
    },

    /**
     * Smooth noise using cosine interpolation
     */
    smoothNoise(x, wavelength = 100, seed = 0) {
        const x0 = Math.floor(x / wavelength);
        const x1 = x0 + 1;
        const t = (x / wavelength) - x0;
        
        const v0 = this.noise(x0, seed);
        const v1 = this.noise(x1, seed);
        
        // Cosine interpolation
        const ft = t * Math.PI;
        const f = (1 - Math.cos(ft)) * 0.5;
        
        return v0 * (1 - f) + v1 * f;
    }
};

// Object Pool for efficient memory management
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    get() {
        let obj = this.pool.pop() || this.createFn();
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        while (this.active.length > 0) {
            const obj = this.active.pop();
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    getActive() {
        return this.active;
    }
}
