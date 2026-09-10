/**
 * World Generator for Cyber Runner
 * Procedural generation of building rooftops - Canabalt style
 */

class World {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // World configuration
        this.groundY = canvasHeight - 100; // Base rooftop level
        this.scrollSpeed = 6;
        this.baseSpeed = 6;
        this.maxSpeed = 14;
        this.speedIncreaseRate = 0.0003;
        
        // Buildings (platforms the player runs on)
        this.buildings = [];
        
        // Object pool for buildings
        this.buildingPool = new ObjectPool(
            () => ({ x: 0, y: 0, width: 0, height: 0, active: false, style: 0 }),
            (obj) => { obj.active = false; },
            15
        );
        
        // Generation state
        this.worldOffset = 0;
        this.lastBuildingEnd = 0;
        this.distanceTraveled = 0;
        this.difficulty = 1;
        
        // Building generation params
        this.minBuildingWidth = 200;
        this.maxBuildingWidth = 500;
        this.minGap = 80;
        this.maxGap = 200;
        this.heightVariation = 80; // Max height difference between buildings
        
        // Parallax layers
        this.backgroundLayers = [];
        
        // Rain particles
        this.raindrops = [];
        this.maxRaindrops = 100;
        
        // Assets reference
        this.assets = null;
    }

    /**
     * Initialize world with assets
     */
    init(assets) {
        this.assets = assets;
        this.initRain();
        this.initBackgroundLayers();
        this.generateInitialBuildings();
    }

    /**
     * Initialize parallax background layers
     */
    initBackgroundLayers() {
        // Far background (slow moving city silhouette)
        this.backgroundLayers = [
            { buildings: this.generateCityLayer(0.1, 8), speed: 0.1, y: this.canvasHeight - 150 },
            { buildings: this.generateCityLayer(0.25, 6), speed: 0.25, y: this.canvasHeight - 100 },
            { buildings: this.generateCityLayer(0.4, 5), speed: 0.4, y: this.canvasHeight - 50 }
        ];
    }

    /**
     * Generate a city layer with buildings for parallax
     */
    generateCityLayer(depth, count) {
        const buildings = [];
        const totalWidth = this.canvasWidth * 3;
        
        for (let i = 0; i < count; i++) {
            const width = Utils.randomInt(80, 200);
            const height = Utils.randomInt(100, 300) * depth + 80;
            buildings.push({
                x: (i / count) * totalWidth - 100,
                width: width,
                height: height,
                style: Utils.randomInt(0, 2),
                image: null
            });
        }
        return buildings;
    }

    /**
     * Initialize rain particles
     */
    initRain() {
        for (let i = 0; i < this.maxRaindrops; i++) {
            this.raindrops.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                speed: Utils.random(10, 18),
                length: Utils.random(15, 30)
            });
        }
    }

    /**
     * Generate initial buildings
     */
    generateInitialBuildings() {
        // Start with a long safe building
        this.addBuilding(0, this.groundY, 400);
        this.lastBuildingEnd = 400;
        
        // Generate more buildings ahead
        while (this.lastBuildingEnd < this.canvasWidth + 800) {
            this.generateNextBuilding();
        }
    }

    /**
     * Generate the next building with a gap
     */
    generateNextBuilding() {
        // Calculate gap based on difficulty
        const difficultyMultiplier = Math.min(this.difficulty, 2);
        const gap = Utils.random(
            this.minGap * difficultyMultiplier,
            this.maxGap * difficultyMultiplier
        );
        
        // Building width decreases slightly with difficulty
        const widthReduction = Math.min(this.difficulty * 20, 150);
        const width = Utils.random(
            Math.max(this.minBuildingWidth - widthReduction, 120),
            Math.max(this.maxBuildingWidth - widthReduction, 250)
        );
        
        // Height variation - buildings can be higher or lower
        const lastBuilding = this.buildings[this.buildings.length - 1];
        const baseY = lastBuilding ? lastBuilding.y : this.groundY;
        const heightChange = Utils.random(-this.heightVariation, this.heightVariation);
        const newY = Utils.clamp(baseY + heightChange, this.groundY - 100, this.groundY + 60);
        
        const x = this.lastBuildingEnd + gap;
        this.addBuilding(x, newY, width);
        this.lastBuildingEnd = x + width;
    }

    /**
     * Add a building to the world
     */
    addBuilding(x, y, width) {
        const building = this.buildingPool.get();
        building.x = x;
        building.y = y;
        building.width = width;
        building.height = this.canvasHeight - y + 200; // Extends below screen
        building.active = true;
        building.style = Utils.randomInt(0, 2);
        building.image = null; // Generated lazily by renderer
        this.buildings.push(building);
    }

    /**
     * Update world state
     */
    update(deltaTime) {
        const scrollAmount = this.scrollSpeed * (deltaTime / 16.67);
        
        this.worldOffset += scrollAmount;
        this.distanceTraveled += scrollAmount;
        
        // Increase speed over time
        this.scrollSpeed = Math.min(
            this.maxSpeed,
            this.baseSpeed + this.distanceTraveled * this.speedIncreaseRate
        );
        
        // Increase difficulty
        this.difficulty = 1 + (this.distanceTraveled / 3000);
        
        // Update buildings
        for (let i = this.buildings.length - 1; i >= 0; i--) {
            const building = this.buildings[i];
            building.x -= scrollAmount;
            
            // Remove off-screen buildings
            if (building.x + building.width < -50) {
                this.buildings.splice(i, 1);
                this.buildingPool.release(building);
            }
        }
        
        // Generate new buildings
        while (this.lastBuildingEnd - this.worldOffset < this.canvasWidth + 600) {
            this.generateNextBuilding();
        }
        
        // Adjust lastBuildingEnd for scroll
        this.lastBuildingEnd -= scrollAmount;
        
        // Update rain
        this.updateRain(deltaTime);
        
        // Update background layers
        this.updateBackgroundLayers(scrollAmount);
    }

    /**
     * Update rain particles
     */
    updateRain(deltaTime) {
        for (const drop of this.raindrops) {
            drop.y += drop.speed * (deltaTime / 16.67);
            drop.x -= 3 * (deltaTime / 16.67);
            
            if (drop.y > this.canvasHeight) {
                drop.y = -drop.length;
                drop.x = Math.random() * (this.canvasWidth + 100);
            }
            if (drop.x < -10) {
                drop.x = this.canvasWidth + Math.random() * 50;
            }
        }
    }

    /**
     * Update parallax background layers
     */
    updateBackgroundLayers(scrollAmount) {
        for (const layer of this.backgroundLayers) {
            for (const building of layer.buildings) {
                building.x -= scrollAmount * layer.speed;
                
                // Wrap around
                if (building.x + building.width < -100) {
                    building.x += this.canvasWidth * 3 + building.width + 100;
                    building.height = Utils.randomInt(100, 300) * layer.speed + 80;
                    building.style = Utils.randomInt(0, 2);
                    building.image = null;
                }
            }
        }
    }

    /**
     * Get the building (platform) at a given x position
     * Uses a single point check for precise edge detection
     */
    getBuildingAt(x, width) {
        for (const building of this.buildings) {
            if (building.active && x >= building.x && x <= building.x + building.width) {
                return building;
            }
        }
        return null;
    }

    /**
     * Check if player is over a gap (no building beneath)
     */
    isOverGap(x, width) {
        return this.getBuildingAt(x, width) === null;
    }

    /**
     * Get the rooftop Y level at position (or fall level if gap)
     */
    getRooftopY(x, width) {
        const building = this.getBuildingAt(x, width);
        if (building) {
            return building.y;
        }
        return this.canvasHeight + 200; // Fall through
    }

    /**
     * Reset world state
     */
    reset() {
        // Clear all buildings
        this.buildings.forEach(b => this.buildingPool.release(b));
        this.buildings = [];
        
        // Reset state
        this.worldOffset = 0;
        this.lastBuildingEnd = 0;
        this.difficulty = 1;
        this.distanceTraveled = 0;
        this.scrollSpeed = this.baseSpeed;
        
        // Regenerate
        this.initBackgroundLayers();
        this.generateInitialBuildings();
    }

    /**
     * Get current speed multiplier for display
     */
    getSpeedMultiplier() {
        return this.scrollSpeed / this.baseSpeed;
    }
}
