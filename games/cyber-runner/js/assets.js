/**
 * Asset Generation for Cyber Runner
 * Procedurally generates game assets using Canvas
 */

class Assets {
    constructor() {
        this.cache = {};
        this.colors = {
            neonPink: '#ff00ff',
            neonCyan: '#00ffff',
            neonYellow: '#ffff00',
            darkPurple: '#1a0a2e',
            darkBlue: '#0a1628',
            building: '#0d0d1a',
            buildingLight: '#1a1a2e'
        };
    }

    /**
     * Get or create a cached asset
     */
    get(key, generator) {
        if (!this.cache[key]) {
            this.cache[key] = generator();
        }
        return this.cache[key];
    }

    /**
     * Generate player sprite frames
     */
    generatePlayerFrames(width = 32, height = 48) {
        return this.get('player', () => {
            const frames = [];
            
            // Running frames (4 frames)
            for (let i = 0; i < 4; i++) {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // Leg animation offset
                const legPhase = i * Math.PI / 2;
                const legOffset = Math.sin(legPhase) * 4;
                
                // Shadow/glow under character
                ctx.shadowColor = this.colors.neonCyan;
                ctx.shadowBlur = 10;
                
                // Body (dark coat)
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(8, 12, 16, 22);
                
                // Coat highlights
                ctx.fillStyle = this.colors.neonPink;
                ctx.fillRect(8, 12, 2, 18);
                ctx.fillRect(22, 12, 2, 18);
                ctx.shadowBlur = 0;
                
                // Head
                ctx.fillStyle = '#2a2a3e';
                ctx.fillRect(10, 2, 12, 12);
                
                // Visor/cybernetic eyes
                ctx.fillStyle = this.colors.neonCyan;
                ctx.shadowColor = this.colors.neonCyan;
                ctx.shadowBlur = 6;
                ctx.fillRect(10, 5, 12, 3);
                ctx.shadowBlur = 0;
                
                // Hair/helmet top
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(10, 0, 12, 4);
                
                // Legs (animated)
                ctx.fillStyle = '#15152a';
                // Back leg
                ctx.fillRect(10 - legOffset/2, 34, 5, 14);
                // Front leg
                ctx.fillRect(17 + legOffset/2, 34, 5, 14);
                
                // Leg glow strips
                ctx.fillStyle = this.colors.neonPink;
                ctx.shadowColor = this.colors.neonPink;
                ctx.shadowBlur = 4;
                ctx.fillRect(10 - legOffset/2, 36, 1, 10);
                ctx.fillRect(21 + legOffset/2, 36, 1, 10);
                ctx.shadowBlur = 0;
                
                // Arms (animated opposite to legs)
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(5 + legOffset/2, 14, 3, 12);
                ctx.fillRect(24 - legOffset/2, 14, 3, 12);
                
                frames.push(canvas);
            }
            
            // Jumping frame (index 4)
            const jumpCanvas = document.createElement('canvas');
            jumpCanvas.width = width;
            jumpCanvas.height = height;
            const jctx = jumpCanvas.getContext('2d');
            
            // Body
            jctx.fillStyle = '#1a1a2e';
            jctx.fillRect(8, 8, 16, 22);
            
            // Coat highlights
            jctx.fillStyle = this.colors.neonPink;
            jctx.shadowColor = this.colors.neonPink;
            jctx.shadowBlur = 6;
            jctx.fillRect(8, 8, 2, 18);
            jctx.fillRect(22, 8, 2, 18);
            jctx.shadowBlur = 0;
            
            // Head
            jctx.fillStyle = '#2a2a3e';
            jctx.fillRect(10, 0, 12, 10);
            
            // Visor
            jctx.fillStyle = this.colors.neonCyan;
            jctx.shadowColor = this.colors.neonCyan;
            jctx.shadowBlur = 8;
            jctx.fillRect(10, 2, 12, 3);
            jctx.shadowBlur = 0;
            
            // Hair/helmet
            jctx.fillStyle = '#1a1a2e';
            jctx.fillRect(10, -2, 12, 4);
            
            // Legs tucked up
            jctx.fillStyle = '#15152a';
            jctx.fillRect(9, 30, 6, 10);
            jctx.fillRect(17, 30, 6, 10);
            
            // Leg glows
            jctx.fillStyle = this.colors.neonPink;
            jctx.shadowColor = this.colors.neonPink;
            jctx.shadowBlur = 4;
            jctx.fillRect(9, 32, 1, 6);
            jctx.fillRect(22, 32, 1, 6);
            jctx.shadowBlur = 0;
            
            // Arms spread
            jctx.fillStyle = '#1a1a2e';
            jctx.fillRect(3, 10, 4, 10);
            jctx.fillRect(25, 10, 4, 10);
            
            frames.push(jumpCanvas);
            
            return frames;
        });
    }

    /**
     * Generate a building for background layer
     */
    generateBuilding(width, height, style = 0) {
        const key = `building_${width}_${height}_${style}`;
        return this.get(key, () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Building body
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, this.colors.buildingLight);
            gradient.addColorStop(1, this.colors.building);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Windows
            const windowWidth = 5;
            const windowHeight = 7;
            const windowGap = 4;
            const cols = Math.floor((width - 8) / (windowWidth + windowGap));
            const rows = Math.floor((height - 15) / (windowHeight + windowGap));
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = 4 + col * (windowWidth + windowGap);
                    const y = 8 + row * (windowHeight + windowGap);
                    
                    // Random lit windows
                    if (Math.random() > 0.5) {
                        const windowColor = Utils.randomChoice([
                            this.colors.neonCyan,
                            this.colors.neonPink,
                            this.colors.neonYellow,
                            '#1a2a3a'
                        ]);
                        ctx.fillStyle = windowColor;
                        if (windowColor !== '#1a2a3a') {
                            ctx.shadowColor = windowColor;
                            ctx.shadowBlur = 2;
                        }
                    } else {
                        ctx.fillStyle = '#1a2a3a';
                        ctx.shadowBlur = 0;
                    }
                    ctx.fillRect(x, y, windowWidth, windowHeight);
                }
            }
            ctx.shadowBlur = 0;
            
            return canvas;
        });
    }

    /**
     * Generate rain particle
     */
    generateRainDrop() {
        return this.get('raindrop', () => {
            const canvas = document.createElement('canvas');
            canvas.width = 2;
            canvas.height = 20;
            const ctx = canvas.getContext('2d');
            
            const gradient = ctx.createLinearGradient(0, 0, 0, 20);
            gradient.addColorStop(0, 'rgba(100, 150, 200, 0)');
            gradient.addColorStop(1, 'rgba(100, 150, 200, 0.6)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 2, 20);
            
            return canvas;
        });
    }
}
