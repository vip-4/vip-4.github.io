// Level loading and tile grid management
import { TILE_SIZE, TILE_TYPES, COLORS, testLevel } from '../levels/levels.js';

/**
 * Level class - manages tile grid and level data
 */
export class Level {
    constructor(levelData) {
        this.name = levelData.name || 'Unknown';
        this.width = levelData.width;
        this.height = levelData.height;
        this.tileSize = levelData.tileSize || TILE_SIZE;
        this.backgroundColor = levelData.backgroundColor || COLORS.SKY_BLUE;
        this.tiles = levelData.tiles || [];
        this.solidTiles = levelData.solidTiles || [TILE_TYPES.SOLID, TILE_TYPES.QUESTION, TILE_TYPES.BRICK, TILE_TYPES.PIPE_TOP, TILE_TYPES.PIPE_BODY, TILE_TYPES.USED];
        this.playerSpawn = levelData.playerSpawn || { x: 32, y: 176 };

        // Cache tile colors for rendering
        this.tileColors = this.createTileColorMap();
    }

    /**
     * Create a color map for tile types
     */
    createTileColorMap() {
        return {
            [TILE_TYPES.AIR]: null,
            [TILE_TYPES.SOLID]: COLORS.BROWN_DARK,
            [TILE_TYPES.QUESTION]: COLORS.YELLOW,
            [TILE_TYPES.BRICK]: COLORS.BROWN_MID,
            [TILE_TYPES.PIPE_TOP]: COLORS.GREEN_DARK,
            [TILE_TYPES.PIPE_BODY]: COLORS.GREEN_DARK,
            [TILE_TYPES.COIN]: COLORS.YELLOW,
            [TILE_TYPES.FLAGPOLE]: COLORS.GRAY,
            [TILE_TYPES.ONE_WAY]: COLORS.GRAY,
            [TILE_TYPES.LAVA]: COLORS.RED,
            [TILE_TYPES.WATER]: COLORS.WATER_LIGHT,
            [TILE_TYPES.CASTLE_BRICK]: COLORS.GRAY,
            [TILE_TYPES.UNDERGROUND_BRICK]: COLORS.UNDERGROUND_GROUND,
            [TILE_TYPES.FORTRESS_STONE]: COLORS.GRAY,
            [TILE_TYPES.USED]: COLORS.GRAY
        };
    }

    /**
     * Get tile type at grid coordinates
     */
    getTileAt(gridX, gridY) {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            // Out of bounds - treat as solid for bottom, air for sides
            if (gridY >= this.height) return 1;
            return 0;
        }
        return this.tiles[gridY] ? this.tiles[gridY][gridX] : 0;
    }

    /**
     * Set tile type at grid coordinates
     */
    setTileAt(gridX, gridY, tileType) {
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return;
        }
        if (this.tiles[gridY]) {
            this.tiles[gridY][gridX] = tileType;
        }
    }

    /**
     * Check if a tile at grid coordinates is solid
     */
    isSolidTile(gridX, gridY) {
        const tile = this.getTileAt(gridX, gridY);
        return this.solidTiles.includes(tile);
    }

    /**
     * Get world position from grid coordinates
     */
    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.tileSize,
            y: gridY * this.tileSize
        };
    }

    /**
     * Get grid coordinates from world position
     */
    worldToGrid(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }

    /**
     * Render all tiles in the level
     */
    render(ctx, cameraX, cameraY) {
        const startCol = Math.floor(cameraX / this.tileSize);
        const endCol = startCol + Math.ceil(ctx.canvas.width / this.tileSize) + 1;
        const startRow = 0;
        const endRow = this.height;

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const tileType = this.getTileAt(col, row);
                if (tileType !== 0) {
                    const screenX = col * this.tileSize - cameraX;
                    const screenY = row * this.tileSize - cameraY;
                    const color = this.tileColors[tileType];

                    if (color) {
                        ctx.fillStyle = color;
                        ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                        // Add simple border for visibility
                        ctx.strokeStyle = COLORS.BLACK;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                    }
                }
            }
        }
    }

    /**
     * Get level width in pixels
     */
    getPixelWidth() {
        return this.width * this.tileSize;
    }

    /**
     * Get level height in pixels
     */
    getPixelHeight() {
        return this.height * this.tileSize;
    }
}

/**
 * Load a level from data
 */
export function loadLevel(levelData) {
    return new Level(levelData);
}

/**
 * Load the test level
 */
export function loadTestLevel() {
    return loadLevel(testLevel);
}
