/**
 * Renderer for Cyber Runner
 * Handles all canvas drawing with parallax and effects
 */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Colors
        this.colors = {
            sky: '#0a0a1a',
            skyBottom: '#1a0a2e',
            building: '#0d0d1a',
            buildingLight: '#1a1a2e',
            rooftop: '#252535',
            neonPink: '#ff00ff',
            neonCyan: '#00ffff',
            window: '#00ffff',
            windowOff: '#1a2a3a'
        };
        
        // Assets reference
        this.assets = null;
    }

    /**
     * Initialize renderer with assets
     */
    init(assets) {
        this.assets = assets;
    }

    /**
     * Resize canvas
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }

    /**
     * Clear the canvas with gradient sky
     */
    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#05050f');
        gradient.addColorStop(0.4, '#0a0a1a');
        gradient.addColorStop(0.7, '#0f0a20');
        gradient.addColorStop(1, '#1a0a2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Render parallax background layers
     */
    renderBackground(world) {
        for (let i = 0; i < world.backgroundLayers.length; i++) {
            const layer = world.backgroundLayers[i];
            const alpha = 0.4 + i * 0.2;
            
            for (const building of layer.buildings) {
                if (building.x > this.width + 50 || building.x + building.width < -50) continue;
                
                // Generate stable window pattern for background buildings
                if (!building.windowPattern) {
                    building.windowPattern = [];
                    const cols = Math.floor((building.width - 10) / 12);
                    const rows = Math.floor(building.height / 12);
                    for (let j = 0; j < rows * cols; j++) {
                        building.windowPattern.push(Math.random() > 0.7 ? (Math.random() > 0.5 ? '#00ffff' : '#ff00ff') : null);
                    }
                }
                
                // Draw building silhouette
                this.ctx.globalAlpha = alpha;
                
                const gradient = this.ctx.createLinearGradient(
                    building.x, layer.y - building.height,
                    building.x, layer.y + 100
                );
                gradient.addColorStop(0, '#2a2a4e');
                gradient.addColorStop(1, '#151525');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(
                    building.x,
                    layer.y - building.height,
                    building.width,
                    building.height + 100
                );
                
                // Windows (stable pattern)
                const windowSize = 4;
                const windowGap = 8;
                const cols = Math.floor((building.width - 10) / (windowSize + windowGap));
                const rows = Math.floor(building.height / (windowSize + windowGap));
                
                let idx = 0;
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        const color = building.windowPattern[idx % building.windowPattern.length];
                        if (color) {
                            const wx = building.x + 5 + col * (windowSize + windowGap);
                            const wy = layer.y - building.height + 10 + row * (windowSize + windowGap);
                            this.ctx.fillStyle = color;
                            this.ctx.globalAlpha = alpha * 0.6;
                            this.ctx.fillRect(wx, wy, windowSize, windowSize);
                        }
                        idx++;
                    }
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }

    /**
     * Render rain effect
     */
    renderRain(raindrops) {
        this.ctx.strokeStyle = 'rgba(150, 180, 220, 0.4)';
        this.ctx.lineWidth = 1;
        
        for (const drop of raindrops) {
            this.ctx.beginPath();
            this.ctx.moveTo(drop.x, drop.y);
            this.ctx.lineTo(drop.x - 4, drop.y + drop.length);
            this.ctx.stroke();
        }
    }

    /**
     * Render foreground buildings (the ones player runs on)
     */
    renderBuildings(buildings) {
        for (const building of buildings) {
            if (!building.active) continue;
            if (building.x > this.width + 50 || building.x + building.width < -50) continue;
            
            // Building body
            const gradient = this.ctx.createLinearGradient(
                building.x, building.y,
                building.x, this.height
            );
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.1, '#12121f');
            gradient.addColorStop(1, '#0a0a12');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Rooftop surface
            this.ctx.fillStyle = '#252535';
            this.ctx.fillRect(building.x, building.y, building.width, 8);
            
            // Rooftop edge glow
            this.ctx.strokeStyle = this.colors.neonCyan;
            this.ctx.shadowColor = this.colors.neonCyan;
            this.ctx.shadowBlur = 8;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(building.x, building.y + 1);
            this.ctx.lineTo(building.x + building.width, building.y + 1);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            
            // Building windows
            this.renderBuildingWindows(building);
            
            // Rooftop details
            this.renderRooftopDetails(building);
        }
    }

    /**
     * Render windows on a building
     */
    renderBuildingWindows(building) {
        // Generate stable window pattern based on building position
        if (!building.windowPattern) {
            building.windowPattern = [];
            const cols = Math.floor((building.width - 20) / 15);
            const rows = 15;
            for (let i = 0; i < rows * cols; i++) {
                const rand = Math.random();
                if (rand > 0.5) {
                    const colors = ['#00ffff', '#ff00ff', '#ffff00', '#1a2a3a'];
                    building.windowPattern.push(colors[Math.floor(Math.random() * colors.length)]);
                } else {
                    building.windowPattern.push('#1a2a3a');
                }
            }
        }
        
        const windowWidth = 8;
        const windowHeight = 12;
        const windowGapX = 15;
        const windowGapY = 20;
        
        const cols = Math.floor((building.width - 20) / windowGapX);
        const rows = Math.min(Math.floor((this.height - building.y - 30) / windowGapY), 15);
        
        let idx = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = building.x + 10 + col * windowGapX;
                const y = building.y + 20 + row * windowGapY;
                
                const windowColor = building.windowPattern[idx % building.windowPattern.length];
                this.ctx.fillStyle = windowColor;
                
                if (windowColor !== '#1a2a3a') {
                    this.ctx.shadowColor = windowColor;
                    this.ctx.shadowBlur = 3;
                } else {
                    this.ctx.shadowBlur = 0;
                }
                
                this.ctx.fillRect(x, y, windowWidth, windowHeight);
                idx++;
            }
        }
        this.ctx.shadowBlur = 0;
    }

    /**
     * Render rooftop details (AC units, antennas, etc)
     */
    renderRooftopDetails(building) {
        // Only add details to wider buildings
        if (building.width < 150) return;
        
        // AC units
        if (building.style === 0 || building.style === 2) {
            this.ctx.fillStyle = '#1a1a25';
            const acWidth = 25;
            const acHeight = 15;
            this.ctx.fillRect(building.x + 15, building.y - acHeight + 2, acWidth, acHeight);
            
            if (building.width > 200) {
                this.ctx.fillRect(building.x + building.width - 40, building.y - acHeight + 4, acWidth, acHeight - 2);
            }
        }
        
        // Antenna
        if (building.style === 1 || building.style === 2) {
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(building.x + building.width / 2 - 1, building.y - 30, 2, 30);
            
            // Blinking light
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 8;
                this.ctx.beginPath();
                this.ctx.arc(building.x + building.width / 2, building.y - 30, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }
    }

    /**
     * Render player
     */
    renderPlayer(player) {
        if (!player.alive) return;
        
        // Render trail
        for (let i = player.trail.length - 1; i >= 0; i--) {
            const trail = player.trail[i];
            this.ctx.globalAlpha = trail.alpha * 0.3;
            this.ctx.fillStyle = this.colors.neonCyan;
            this.ctx.fillRect(
                trail.x + player.width * 0.25,
                trail.y + player.height * 0.25,
                player.width * 0.5,
                player.height * 0.5
            );
        }
        this.ctx.globalAlpha = 1;
        
        // Draw player sprite
        const frame = player.getCurrentFrame();
        if (frame) {
            this.ctx.drawImage(frame, player.x, player.y);
        } else {
            // Fallback rectangle
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }

    /**
     * Render atmospheric effects
     */
    renderAtmosphere() {
        // Bottom fog
        const fogGradient = this.ctx.createLinearGradient(0, this.height - 80, 0, this.height);
        fogGradient.addColorStop(0, 'rgba(10, 10, 30, 0)');
        fogGradient.addColorStop(1, 'rgba(10, 10, 30, 0.7)');
        this.ctx.fillStyle = fogGradient;
        this.ctx.fillRect(0, this.height - 80, this.width, 80);
        
        // Top vignette
        const vignetteGradient = this.ctx.createLinearGradient(0, 0, 0, 80);
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = vignetteGradient;
        this.ctx.fillRect(0, 0, this.width, 80);
    }

    /**
     * Render death effect
     */
    renderDeathEffect(player, progress) {
        // Screen flash
        this.ctx.fillStyle = `rgba(255, 50, 100, ${0.4 * (1 - progress)})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Explosion particles
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = progress * 80;
            const x = player.x + player.width/2 + Math.cos(angle) * distance;
            const y = player.y + player.height/2 + Math.sin(angle) * distance;
            const size = (1 - progress) * 8;
            
            this.ctx.fillStyle = i % 2 === 0 ? this.colors.neonPink : this.colors.neonCyan;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(x - size/2, y - size/2, size, size);
        }
        this.ctx.shadowBlur = 0;
    }

    /**
     * Main render function
     */
    render(game) {
        this.clear();
        
        // Background city
        this.renderBackground(game.world);
        
        // Rain
        this.renderRain(game.world.raindrops);
        
        // Foreground buildings
        this.renderBuildings(game.world.buildings);
        
        // Player
        this.renderPlayer(game.player);
        
        // Atmosphere
        this.renderAtmosphere();
        
        // Death effect
        if (!game.player.alive && game.deathAnimationProgress < 1) {
            this.renderDeathEffect(game.player, game.deathAnimationProgress);
        }
    }
}
