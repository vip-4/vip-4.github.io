/**
 * Mario Clone - All 5 Level Definitions
 * Phase 4: Complete level data for World 1
 * Tile grid format matches levelLoader.js expectations
 */

// =============================================================================
// TILE TYPE CONSTANTS
// Tile type IDs:
// 0 = Air (empty), 1 = Solid ground/brick, 2 = ? block (bumpable),
// 3 = Brick (breakable), 4 = Pipe top, 5 = Pipe body,
// 6 = Coin (floating), 7 = Flagpole, 8 = One-way platform,
// 9 = Lava (instant death), 10 = Water (swimming physics),
// 11 = Castle brick, 12 = Underground brick, 13 = Fortress stone
// =============================================================================
export const TILE_TYPES = {
    AIR: 0,
    SOLID: 1,
    QUESTION: 2,
    BRICK: 3,
    PIPE_TOP: 4,
    PIPE_BODY: 5,
    COIN: 6,
    FLAGPOLE: 7,
    ONE_WAY: 8,
    LAVA: 9,
    WATER: 10,
    CASTLE_BRICK: 11,
    UNDERGROUND_BRICK: 12,
    FORTRESS_STONE: 13,
    USED: 14
};

// Tile size in pixels
export const TILE_SIZE = 16;

// =============================================================================
// NES COLOR PALETTE
// =============================================================================
export const COLORS = {
    SKY_BLUE: '#5C94FC',
    RED: '#FC0000',
    BROWN_DARK: '#A00000',
    BROWN_MID: '#FC7F00',
    ORANGE: '#F8B800',
    YELLOW: '#F8D800',
    GREEN_DARK: '#00A800',
    GREEN_LIGHT: '#B8F810',
    BLACK: '#000000',
    WHITE: '#FCFCFC',
    PURPLE: '#503000',
    GRAY: '#A0A0A0',
    DIRT: '#C84C0C',
    UNDERGROUND_GROUND: '#A06030',
    WATER_BLUE: '#0000A0',
    WATER_LIGHT: '#0078D8'
};

// =============================================================================
// PHYSICS CONSTANTS
// =============================================================================
export const PHYSICS = {
    GRAVITY: 0.5,
    SWIM_GRAVITY: 0.15,
    MAX_SPEED: 4,
    RUN_SPEED: 6,
    JUMP_VELOCITY: -12,
    FULL_JUMP_VELOCITY: -15,
    TERMINAL_VELOCITY: 8,
    FRICTION: 0.15
};

// Screen dimensions (NES standard)
export const SCREEN = {
    WIDTH: 256,
    HEIGHT: 240,
    TILES_X: 16,
    TILES_Y: 15
};

// =============================================================================
// LEVEL 1-1: GRASS LAND - The Classic Introduction
// 200 tiles wide, overworld theme with pipes, platforms, enemies
// Features: flat intro, ? blocks, pipe with piranha, staircase terrain, flagpole
// =============================================================================
export const LEVEL_1_1 = {
    id: '1-1',
    name: 'Grass Land',
    theme: 'overworld',
    width: 200,
    height: 15,
    tileSize: 16,
    backgroundColor: COLORS.SKY_BLUE,
    gravity: PHYSICS.GRAVITY,
    scrollSpeed: 1,

    parallaxLayers: [
        { color: '#56A82C', speed: 0.1, shapes: [] },  // Far hills
        { color: COLORS.WHITE, speed: 0.3, shapes: [] },  // Mid clouds
        { color: COLORS.GREEN_DARK, speed: 0.5, shapes: [] }  // Near bushes
    ],

    // 15 rows of 200 tiles - generated tile map
    tiles: [
        // Row 0-4: Empty sky
        Array(200).fill(TILE_TYPES.AIR),
        Array(200).fill(TILE_TYPES.AIR),
        Array(200).fill(TILE_TYPES.AIR),
        Array(200).fill(TILE_TYPES.AIR),
        Array(200).fill(TILE_TYPES.AIR),
        // Row 5: Question block with mushroom (tile 16)
        (() => { const r = Array(200).fill(TILE_TYPES.AIR); r[16] = TILE_TYPES.QUESTION; return r; })(),
        // Row 6: Brick platform (tiles 25-27)
        (() => { const r = Array(200).fill(TILE_TYPES.AIR); r[25]=TILE_TYPES.BRICK; r[26]=TILE_TYPES.BRICK; r[27]=TILE_TYPES.BRICK; return r; })(),
        // Row 7-8: Empty
        Array(200).fill(TILE_TYPES.AIR),
        Array(200).fill(TILE_TYPES.AIR),
        // Row 9: Brick staircase (tiles 80-85), pipe area (tile 40)
        (() => {
            const r = Array(200).fill(TILE_TYPES.AIR);
            for(let i=80;i<=85;i++) r[i]=TILE_TYPES.BRICK;
            r[40]=TILE_TYPES.PIPE_TOP; r[41]=TILE_TYPES.PIPE_TOP; r[42]=TILE_TYPES.PIPE_TOP;
            return r;
        })(),
        // Row 10: Pipe body
        (() => { const r = Array(200).fill(TILE_TYPES.AIR); r[40]=TILE_TYPES.PIPE_BODY; r[41]=TILE_TYPES.PIPE_BODY; r[42]=TILE_TYPES.PIPE_BODY; return r; })(),
        // Row 11: Pipe body
        (() => { const r = Array(200).fill(TILE_TYPES.AIR); r[40]=TILE_TYPES.PIPE_BODY; r[41]=TILE_TYPES.PIPE_BODY; r[42]=TILE_TYPES.PIPE_BODY; return r; })(),
        // Row 12: Pipe body
        (() => { const r = Array(200).fill(TILE_TYPES.AIR); r[40]=TILE_TYPES.PIPE_BODY; r[41]=TILE_TYPES.PIPE_BODY; r[42]=TILE_TYPES.PIPE_BODY; return r; })(),
        // Row 13: Ground with gap (tiles 105-110)
        (() => { const r = Array(200).fill(TILE_TYPES.SOLID); for(let i=105;i<=110;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 14: Bottom ground with gap
        (() => { const r = Array(200).fill(TILE_TYPES.SOLID); for(let i=105;i<=110;i++) r[i]=TILE_TYPES.AIR; return r; })()
    ],

    // Entity spawn points
    entities: [
        // Intro section - flat ground with goombas (tiles 5-15)
        { type: 'goomba', x: 80, y: 208 },
        { type: 'goomba', x: 176, y: 208 },

        // First ? block with mushroom (tile 16)
        { type: 'questionBlock', x: 256, y: 80, contents: 'mushroom', hit: false },

        // Pipe with piranha (tile 40-42)
        { type: 'piranha', x: 656, y: 80, pipeHeight: 4 },

        // Brick platform area (tiles 25-27)
        { type: 'brick', x: 400, y: 96 },
        { type: 'brick', x: 416, y: 96 },
        { type: 'brick', x: 432, y: 96 },

        // Koopa on flat ground (tile 30)
        { type: 'koopa', x: 480, y: 208 },

        // Stairs up section with enemies (tiles 50-58)
        { type: 'goomba', x: 880, y: 208 },
        { type: 'goomba', x: 912, y: 208 },
        { type: 'questionBlock', x: 848, y: 80, contents: 'mushroom', hit: false },

        // Lower ground with more enemies (tiles 60-80)
        { type: 'koopa', x: 1040, y: 208 },
        { type: 'goomba', x: 1152, y: 208 },
        { type: 'goomba', x: 1184, y: 208 },
        { type: 'goomba', x: 1216, y: 208 },

        // Brick staircase terrain (tiles 80-95)
        { type: 'brick', x: 1280, y: 144 },
        { type: 'brick', x: 1296, y: 144 },
        { type: 'brick', x: 1312, y: 144 },
        { type: 'brick', x: 1328, y: 144 },
        { type: 'brick', x: 1344, y: 144 },
        { type: 'brick', x: 1360, y: 160 },
        { type: 'brick', x: 1376, y: 160 },
        { type: 'brick', x: 1392, y: 176 },
        { type: 'brick', x: 1408, y: 176 },
        { type: 'brick', x: 1424, y: 176 },

        // Question block over stairs
        { type: 'questionBlock', x: 1312, y: 80, contents: 'mushroom', hit: false },

        // Platform section with koopa
        { type: 'brick', x: 1520, y: 128 },
        { type: 'brick', x: 1536, y: 128 },
        { type: 'brick', x: 1552, y: 128 },
        { type: 'koopa', x: 1536, y: 96, onPlatform: true },

        // Ground enemies
        { type: 'goomba', x: 1680, y: 208 },
        { type: 'goomba', x: 1712, y: 208 },

        // Final brick platforms (tiles 110-117)
        { type: 'brick', x: 1760, y: 144 },
        { type: 'brick', x: 1776, y: 144 },
        { type: 'questionBlock', x: 1792, y: 144, contents: 'fireFlower', hit: false },
        { type: 'brick', x: 1808, y: 144 },
        { type: 'brick', x: 1824, y: 144 },

        // Final staircase to flagpole (tiles 120-130)
        { type: 'brick', x: 1920, y: 176 },
        { type: 'brick', x: 1936, y: 176 },
        { type: 'brick', x: 1952, y: 176 },
        { type: 'brick', x: 1968, y: 160 },
        { type: 'brick', x: 1984, y: 160 },
        { type: 'brick', x: 2000, y: 144 },
        { type: 'brick', x: 2016, y: 144 },
        { type: 'brick', x: 2032, y: 128 },
        { type: 'brick', x: 2048, y: 128 },

        // Flagpole (tile 130)
        { type: 'flagpole', x: 2080, y: 64, height: 144 },

        // Coins along flagpole
        { type: 'coin', x: 2080, y: 80 },
        { type: 'coin', x: 2080, y: 112 },
        { type: 'coin', x: 2080, y: 144 },

        // End castle
        { type: 'castle', x: 2160, y: 128 }
    ],

    solidTiles: [TILE_TYPES.SOLID, TILE_TYPES.QUESTION, TILE_TYPES.BRICK, TILE_TYPES.PIPE_TOP, TILE_TYPES.PIPE_BODY, TILE_TYPES.USED],
    playerSpawn: { x: 32, y: 176 }
};

// =============================================================================
// LEVEL 1-2: UNDERGROUND - Dark Caverns
// 180 tiles wide, underground theme with brick ceilings, coin rooms, lava pits
// Features: low ceilings, brick platforms, lava gaps, no piranhas
// =============================================================================
export const LEVEL_1_2 = {
    id: '1-2',
    name: 'Underground',
    theme: 'underground',
    width: 180,
    height: 15,
    tileSize: 16,
    backgroundColor: COLORS.BLACK,
    gravity: PHYSICS.GRAVITY,
    scrollSpeed: 1,

    parallaxLayers: [
        { color: '#1A0A00', speed: 0.1, shapes: [] }
    ],

    tiles: [
        // Row 0-1: Brick ceiling
        Array(180).fill(TILE_TYPES.UNDERGROUND_BRICK),
        Array(180).fill(TILE_TYPES.UNDERGROUND_BRICK),
        // Row 2: Brick ceiling with gaps
        (() => { const r = Array(180).fill(TILE_TYPES.UNDERGROUND_BRICK); for(let i=15;i<=30;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 3: Brick ceiling with gaps
        (() => { const r = Array(180).fill(TILE_TYPES.UNDERGROUND_BRICK); for(let i=15;i<=30;i++) r[i]=TILE_TYPES.AIR; for(let i=40;i<=60;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 4: Question blocks
        (() => { const r = Array(180).fill(TILE_TYPES.AIR); r[24]=TILE_TYPES.QUESTION; r[25]=TILE_TYPES.QUESTION; r[26]=TILE_TYPES.QUESTION; return r; })(),
        // Row 5: Brick ceiling sections
        (() => { const r = Array(180).fill(TILE_TYPES.UNDERGROUND_BRICK); for(let i=70;i<=85;i++) r[i]=TILE_TYPES.AIR; for(let i=100;i<=130;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 6: Brick ceiling continuation
        (() => { const r = Array(180).fill(TILE_TYPES.UNDERGROUND_BRICK); for(let i=70;i<=85;i++) r[i]=TILE_TYPES.AIR; for(let i=100;i<=130;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 7: Brick platforms
        (() => { const r = Array(180).fill(TILE_TYPES.AIR); r[95]=TILE_TYPES.UNDERGROUND_BRICK; r[96]=TILE_TYPES.UNDERGROUND_BRICK; r[97]=TILE_TYPES.UNDERGROUND_BRICK; return r; })(),
        // Row 8-12: Empty mid-section
        Array(180).fill(TILE_TYPES.AIR),
        Array(180).fill(TILE_TYPES.AIR),
        Array(180).fill(TILE_TYPES.AIR),
        Array(180).fill(TILE_TYPES.AIR),
        Array(180).fill(TILE_TYPES.AIR),
        // Row 13: Ground with lava pits
        (() => {
            const r = Array(180).fill(TILE_TYPES.SOLID);
            for(let i=25;i<=30;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=55;i<=60;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=85;i<=90;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=115;i<=120;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=145;i<=150;i++) r[i]=TILE_TYPES.LAVA;
            return r;
        })(),
        // Row 14: Bottom ground with lava
        (() => {
            const r = Array(180).fill(TILE_TYPES.SOLID);
            for(let i=25;i<=30;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=55;i<=60;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=85;i<=90;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=115;i<=120;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=145;i<=150;i++) r[i]=TILE_TYPES.LAVA;
            return r;
        })()
    ],

    entities: [
        // Entrance area with low ceiling bricks
        { type: 'brick', x: 80, y: 160 },
        { type: 'brick', x: 96, y: 160 },
        { type: 'brick', x: 112, y: 160 },

        // First mushroom ? block
        { type: 'questionBlock', x: 160, y: 64, contents: 'mushroom', hit: false },

        // Brick platform with coins above
        { type: 'brick', x: 224, y: 176 },
        { type: 'brick', x: 240, y: 176 },
        { type: 'coin', x: 224, y: 128 },
        { type: 'coin', x: 240, y: 128 },

        // Goombas in tight space
        { type: 'goomba', x: 288, y: 208 },
        { type: 'goomba', x: 320, y: 208 },

        // Rising ceiling section
        { type: 'brick', x: 448, y: 160 },
        { type: 'brick', x: 464, y: 160 },
        { type: 'brick', x: 480, y: 160 },
        { type: 'brick', x: 448, y: 144 },
        { type: 'brick', x: 464, y: 144 },

        // Question blocks over pit
        { type: 'questionBlock', x: 512, y: 64, contents: 'mushroom', hit: false },
        { type: 'questionBlock', x: 528, y: 64, contents: 'coin', hit: false },

        // Koopa in confined space
        { type: 'koopa', x: 608, y: 208 },

        // Coin room - hidden above (tiles 42-45)
        { type: 'coin', x: 672, y: 96 },
        { type: 'coin', x: 688, y: 96 },
        { type: 'coin', x: 704, y: 96 },
        { type: 'coin', x: 720, y: 96 },
        { type: 'coin', x: 672, y: 112 },
        { type: 'coin', x: 688, y: 112 },
        { type: 'coin', x: 704, y: 112 },
        { type: 'coin', x: 720, y: 112 },

        // Brick ceiling for coin room
        { type: 'brick', x: 704, y: 144 },
        { type: 'brick', x: 720, y: 144 },

        // More goombas
        { type: 'goomba', x: 800, y: 208 },
        { type: 'goomba', x: 832, y: 208 },
        { type: 'goomba', x: 864, y: 208 },

        // Staircase with enemies
        { type: 'brick', x: 992, y: 192 },
        { type: 'brick', x: 1008, y: 192 },
        { type: 'brick', x: 1024, y: 176 },
        { type: 'brick', x: 1040, y: 176 },
        { type: 'questionBlock', x: 1056, y: 160, contents: 'mushroom', hit: false },
        { type: 'brick', x: 1072, y: 160 },
        { type: 'brick', x: 1088, y: 144 },
        { type: 'brick', x: 1104, y: 144 },

        // Koopa on platform
        { type: 'koopa', x: 1152, y: 144, onPlatform: true },

        // Brick platforms
        { type: 'brick', x: 1248, y: 176 },
        { type: 'brick', x: 1264, y: 176 },
        { type: 'goomba', x: 1280, y: 176 },
        { type: 'goomba', x: 1312, y: 176 },

        // Final stretch
        { type: 'questionBlock', x: 1472, y: 64, contents: 'fireFlower', hit: false },
        { type: 'brick', x: 1488, y: 144 },
        { type: 'brick', x: 1504, y: 144 },

        // Ascending stairs
        { type: 'brick', x: 1600, y: 192 },
        { type: 'brick', x: 1616, y: 192 },
        { type: 'brick', x: 1632, y: 176 },
        { type: 'brick', x: 1648, y: 176 },
        { type: 'brick', x: 1664, y: 160 },
        { type: 'brick', x: 1680, y: 160 },
        { type: 'questionBlock', x: 1696, y: 144, contents: 'mushroom', hit: false },

        // End warp pipe
        { type: 'warp', x: 1792, y: 144 }
    ],

    solidTiles: [TILE_TYPES.SOLID, TILE_TYPES.QUESTION, TILE_TYPES.BRICK, TILE_TYPES.UNDERGROUND_BRICK, TILE_TYPES.LAVA, TILE_TYPES.USED],
    playerSpawn: { x: 32, y: 128 }
};

// =============================================================================
// LEVEL 1-3: FORTRESS - Stone Fortress Exterior
// 160 tiles wide, fortress theme with moving platforms, hammer bros
// Features: moving platforms over gaps, rising platforms, hammer bros encounter
// =============================================================================
export const LEVEL_1_3 = {
    id: '1-3',
    name: 'Fortress',
    theme: 'fortress',
    width: 160,
    height: 15,
    tileSize: 16,
    backgroundColor: COLORS.SKY_BLUE,
    gravity: PHYSICS.GRAVITY,
    scrollSpeed: 1,

    parallaxLayers: [
        { color: COLORS.GRAY, speed: 0.2, shapes: [] },  // Stone walls
        { color: COLORS.RED, speed: 0.4, shapes: [] }   // Banners
    ],

    tiles: [
        // Row 0-1: Empty sky
        Array(160).fill(TILE_TYPES.AIR),
        Array(160).fill(TILE_TYPES.AIR),
        // Row 2-3: Fortress wall top with gaps
        (() => { const r = Array(160).fill(TILE_TYPES.FORTRESS_STONE); for(let i=0;i<20;i++) r[i]=TILE_TYPES.AIR; for(let i=50;i<70;i++) r[i]=TILE_TYPES.AIR; for(let i=100;i<120;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        (() => { const r = Array(160).fill(TILE_TYPES.FORTRESS_STONE); for(let i=0;i<20;i++) r[i]=TILE_TYPES.AIR; for(let i=50;i<70;i++) r[i]=TILE_TYPES.AIR; for(let i=100;i<120;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 4: Brick platforms
        (() => { const r = Array(160).fill(TILE_TYPES.AIR); r[25]=TILE_TYPES.BRICK; r[26]=TILE_TYPES.BRICK; r[27]=TILE_TYPES.BRICK; r[55]=TILE_TYPES.BRICK; r[56]=TILE_TYPES.BRICK; r[57]=TILE_TYPES.BRICK; return r; })(),
        // Row 5-6: Empty
        Array(160).fill(TILE_TYPES.AIR),
        Array(160).fill(TILE_TYPES.AIR),
        // Row 7: Brick platform
        (() => { const r = Array(160).fill(TILE_TYPES.AIR); r[75]=TILE_TYPES.BRICK; r[76]=TILE_TYPES.BRICK; r[77]=TILE_TYPES.BRICK; return r; })(),
        // Row 8-9: Empty
        Array(160).fill(TILE_TYPES.AIR),
        Array(160).fill(TILE_TYPES.AIR),
        // Row 10: Question block
        (() => { const r = Array(160).fill(TILE_TYPES.AIR); r[90]=TILE_TYPES.QUESTION; return r; })(),
        // Row 11-12: Empty
        Array(160).fill(TILE_TYPES.AIR),
        (() => { const r = Array(160).fill(TILE_TYPES.SOLID); for(let i=60;i<75;i++) r[i]=TILE_TYPES.BRICK; return r; })(),
        // Row 13: Ground with gaps over lava
        (() => { const r = Array(160).fill(TILE_TYPES.FORTRESS_STONE); for(let i=30;i<=40;i++) r[i]=TILE_TYPES.AIR; for(let i=80;i<=90;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 14: Bottom ground with lava
        (() => { const r = Array(160).fill(TILE_TYPES.FORTRESS_STONE); for(let i=30;i<=40;i++) r[i]=TILE_TYPES.LAVA; for(let i=80;i<=90;i++) r[i]=TILE_TYPES.LAVA; return r; })()
    ],

    entities: [
        // Opening gap with moving platform
        { type: 'movingPlatform', x: 128, y: 176, width: 48, patrol: { start: 128, end: 256, speed: 1 } },

        // Goombas on ground
        { type: 'goomba', x: 192, y: 208 },
        { type: 'goomba', x: 224, y: 208 },

        // Rising platform over gap
        { type: 'movingPlatform', x: 320, y: 160, width: 48, patrol: { start: 320, end: 416, speed: 1.5 }, type: 'rising' },

        // Koopa on stone
        { type: 'koopa', x: 448, y: 208 },

        // Brick fortress entrance
        { type: 'brick', x: 512, y: 160 },
        { type: 'brick', x: 528, y: 160 },
        { type: 'brick', x: 544, y: 160 },
        { type: 'brick', x: 560, y: 160 },

        // Moving platform section
        { type: 'movingPlatform', x: 608, y: 144, width: 48, patrol: { start: 608, end: 736, speed: 1.2 } },

        // Hammer Bros encounter
        { type: 'hammerBro', x: 704, y: 144 },
        { type: 'hammerBro', x: 736, y: 144 },

        // Stone platforms
        { type: 'brick', x: 800, y: 176 },
        { type: 'brick', x: 816, y: 176 },
        { type: 'brick', x: 832, y: 176 },

        // Koopa on platform
        { type: 'koopa', x: 816, y: 144, onPlatform: true },

        // Moving platform over lava
        { type: 'movingPlatform', x: 896, y: 160, width: 48, patrol: { start: 896, end: 1024, speed: 0.8 } },

        // Stairs up
        { type: 'brick', x: 1088, y: 192 },
        { type: 'brick', x: 1104, y: 192 },
        { type: 'brick', x: 1120, y: 176 },
        { type: 'brick', x: 1136, y: 176 },
        { type: 'brick', x: 1152, y: 160 },
        { type: 'brick', x: 1168, y: 160 },

        // High platform with powerup
        { type: 'questionBlock', x: 1184, y: 144, contents: 'mushroom', hit: false },
        { type: 'brick', x: 1200, y: 144 },

        // Descent with enemies
        { type: 'goomba', x: 1248, y: 208 },
        { type: 'koopa', x: 1312, y: 208 },

        // Stone bridge
        { type: 'brick', x: 1376, y: 208 },
        { type: 'brick', x: 1392, y: 208 },
        { type: 'brick', x: 1408, y: 208 },
        { type: 'brick', x: 1424, y: 208 },

        // Final moving platform
        { type: 'movingPlatform', x: 1472, y: 176, width: 48, patrol: { start: 1472, end: 1600, speed: 1.3 } },

        // Flagpole at end
        { type: 'flagpole', x: 1680, y: 64, height: 144 },

        // Castle end zone
        { type: 'castle', x: 1760, y: 128 }
    ],

    solidTiles: [TILE_TYPES.SOLID, TILE_TYPES.QUESTION, TILE_TYPES.FORTRESS_STONE, TILE_TYPES.BRICK, TILE_TYPES.LAVA, TILE_TYPES.USED],
    playerSpawn: { x: 32, y: 176 }
};

// =============================================================================
// LEVEL 1-4: CASTLE - Bowser's Fortress Interior
// 150 tiles wide, castle theme with fire bars, Bowser battle
// Features: fire bars, lava pits, staircase climbing, Bowser boss fight
// =============================================================================
export const LEVEL_1_4 = {
    id: '1-4',
    name: 'Castle',
    theme: 'castle',
    width: 150,
    height: 15,
    tileSize: 16,
    backgroundColor: COLORS.BLACK,
    gravity: PHYSICS.GRAVITY,
    scrollSpeed: 1,

    parallaxLayers: [
        { color: '#281800', speed: 0.1, shapes: [] }  // Torch-lit walls
    ],

    tiles: [
        // Row 0-1: Empty
        Array(150).fill(TILE_TYPES.AIR),
        Array(150).fill(TILE_TYPES.AIR),
        // Row 2-5: Brick ceiling with torch gaps
        (() => { const r = Array(150).fill(TILE_TYPES.CASTLE_BRICK); for(let i=35;i<=40;i++) r[i]=TILE_TYPES.AIR; for(let i=65;i<=70;i++) r[i]=TILE_TYPES.AIR; for(let i=95;i<=100;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        (() => { const r = Array(150).fill(TILE_TYPES.CASTLE_BRICK); for(let i=35;i<=40;i++) r[i]=TILE_TYPES.AIR; for(let i=65;i<=70;i++) r[i]=TILE_TYPES.AIR; for(let i=95;i<=100;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        (() => { const r = Array(150).fill(TILE_TYPES.CASTLE_BRICK); for(let i=35;i<=40;i++) r[i]=TILE_TYPES.AIR; for(let i=65;i<=70;i++) r[i]=TILE_TYPES.AIR; for(let i=95;i<=100;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        (() => { const r = Array(150).fill(TILE_TYPES.CASTLE_BRICK); for(let i=35;i<=40;i++) r[i]=TILE_TYPES.AIR; for(let i=65;i<=70;i++) r[i]=TILE_TYPES.AIR; for(let i=95;i<=100;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 6-11: Empty (fire bar area)
        Array(150).fill(TILE_TYPES.AIR),
        Array(150).fill(TILE_TYPES.AIR),
        Array(150).fill(TILE_TYPES.AIR),
        Array(150).fill(TILE_TYPES.AIR),
        Array(150).fill(TILE_TYPES.AIR),
        Array(150).fill(TILE_TYPES.AIR),
        // Row 12: Staircase section
        (() => { const r = Array(150).fill(TILE_TYPES.SOLID); for(let i=105;i<=115;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 13: Ground with lava pits and bridge
        (() => {
            const r = Array(150).fill(TILE_TYPES.CASTLE_BRICK);
            for(let i=20;i<=25;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=50;i<=55;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=80;i<=85;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=105;i<=115;i++) r[i]=TILE_TYPES.AIR;  // Bowser's bridge
            return r;
        })(),
        // Row 14: Bottom ground
        (() => {
            const r = Array(150).fill(TILE_TYPES.SOLID);
            for(let i=20;i<=25;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=50;i<=55;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=80;i<=85;i++) r[i]=TILE_TYPES.LAVA;
            for(let i=105;i<=115;i++) r[i]=TILE_TYPES.LAVA;  // Lava under bridge
            return r;
        })()
    ],

    entities: [
        // Castle entrance stairs
        { type: 'brick', x: 80, y: 208 },
        { type: 'brick', x: 96, y: 208 },
        { type: 'brick', x: 112, y: 208 },

        // Fire bar entrance
        { type: 'fireBar', x: 160, y: 176, length: 6 },

        // Stairs with fire bar
        { type: 'brick', x: 288, y: 208 },
        { type: 'brick', x: 304, y: 208 },
        { type: 'brick', x: 320, y: 192 },
        { type: 'brick', x: 336, y: 192 },

        // Fire bar over pit
        { type: 'fireBar', x: 352, y: 176, length: 5 },

        // Platforming section
        { type: 'brick', x: 416, y: 176 },
        { type: 'brick', x: 432, y: 176 },
        { type: 'brick', x: 448, y: 176 },

        // Rising stairs
        { type: 'brick', x: 576, y: 208 },
        { type: 'brick', x: 592, y: 208 },
        { type: 'brick', x: 608, y: 192 },
        { type: 'brick', x: 624, y: 192 },
        { type: 'brick', x: 640, y: 176 },
        { type: 'brick', x: 656, y: 176 },
        { type: 'brick', x: 672, y: 160 },
        { type: 'brick', x: 688, y: 160 },

        // Fire bar on platform
        { type: 'fireBar', x: 720, y: 128, length: 7 },

        // Boss platform approach
        { type: 'brick', x: 880, y: 208 },
        { type: 'brick', x: 896, y: 208 },
        { type: 'brick', x: 912, y: 208 },
        { type: 'brick', x: 928, y: 208 },
        { type: 'brick', x: 944, y: 208 },

        // Descending to boss
        { type: 'brick', x: 992, y: 192 },
        { type: 'brick', x: 1008, y: 192 },
        { type: 'brick', x: 1024, y: 176 },
        { type: 'brick', x: 1040, y: 176 },
        { type: 'brick', x: 1056, y: 160 },
        { type: 'brick', x: 1072, y: 160 },

        // Bowser's arena - bridge over lava (tiles 105-115)
        { type: 'brick', x: 1120, y: 208 },
        { type: 'brick', x: 1136, y: 208 },
        { type: 'brick', x: 1152, y: 208 },
        { type: 'brick', x: 1168, y: 208 },
        { type: 'brick', x: 1184, y: 208 },
        { type: 'brick', x: 1200, y: 208 },
        { type: 'brick', x: 1216, y: 208 },
        { type: 'brick', x: 1232, y: 208 },
        { type: 'brick', x: 1248, y: 208 },
        { type: 'brick', x: 1264, y: 208 },
        { type: 'brick', x: 1280, y: 208 },

        // Bowser battle (x ~ 1250, on bridge)
        { type: 'bowser', x: 1248, y: 144 },

        // Axe and bridge collapse area
        { type: 'axe', x: 1440, y: 128 },
        { type: 'brick', x: 1440, y: 144 },
        { type: 'brick', x: 1440, y: 160 },

        // Fall pit
        { type: 'lava', x: 1472, y: 224, width: 8 },

        // Victory walk (after bowser falls)
        { type: 'brick', x: 1632, y: 208 },
        { type: 'brick', x: 1648, y: 208 },
        { type: 'brick', x: 1664, y: 208 },

        // End zone
        { type: 'flagpole', x: 1728, y: 80, height: 128 },
        { type: 'castle', x: 1840, y: 128 }
    ],

    solidTiles: [TILE_TYPES.SOLID, TILE_TYPES.QUESTION, TILE_TYPES.CASTLE_BRICK, TILE_TYPES.LAVA, TILE_TYPES.USED],
    playerSpawn: { x: 32, y: 176 }
};

// =============================================================================
// LEVEL 1-C: UNDERWATER - Swimming Bonus Level
// 170 tiles wide, underwater theme with swimming physics, bloopers
// Features: underwater swimming, blooper enemies, coin clusters, swim-up sections
// =============================================================================
export const LEVEL_1_C = {
    id: '1-C',
    name: 'Underwater',
    theme: 'underwater',
    width: 170,
    height: 15,
    tileSize: 16,
    backgroundColor: COLORS.WATER_BLUE,
    gravity: PHYSICS.SWIM_GRAVITY,
    swimPhysics: true,
    scrollSpeed: 0.8,

    parallaxLayers: [
        { color: COLORS.WATER_LIGHT, speed: 0.2, shapes: [] },  // Water caustics
        { color: '#00D8FC', speed: 0.5, shapes: [] }   // Bubbles
    ],

    tiles: [
        // Row 0: Ceiling with alcoves
        (() => { const r = Array(170).fill(TILE_TYPES.SOLID); for(let i=10;i<=30;i++) r[i]=TILE_TYPES.AIR; for(let i=50;i<=70;i++) r[i]=TILE_TYPES.AIR; for(let i=90;i<=110;i++) r[i]=TILE_TYPES.AIR; for(let i=130;i<=150;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 1: Ceiling continuation
        (() => { const r = Array(170).fill(TILE_TYPES.SOLID); for(let i=10;i<=30;i++) r[i]=TILE_TYPES.AIR; for(let i=50;i<=70;i++) r[i]=TILE_TYPES.AIR; for(let i=90;i<=110;i++) r[i]=TILE_TYPES.AIR; for(let i=130;i<=150;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 2: Water starts
        (() => { const r = Array(170).fill(TILE_TYPES.WATER); for(let i=10;i<=30;i++) r[i]=TILE_TYPES.AIR; for(let i=50;i<=70;i++) r[i]=TILE_TYPES.AIR; for(let i=90;i<=110;i++) r[i]=TILE_TYPES.AIR; for(let i=130;i<=150;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 3: Water with coin alcove
        (() => { const r = Array(170).fill(TILE_TYPES.WATER); for(let i=15;i<=20;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 4: Water
        (() => { const r = Array(170).fill(TILE_TYPES.WATER); for(let i=15;i<=20;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 5: Swim-up tunnel and platforms
        (() => { const r = Array(170).fill(TILE_TYPES.WATER); for(let i=40;i<=45;i++) r[i]=TILE_TYPES.AIR; for(let i=60;i<=70;i++) r[i]=TILE_TYPES.AIR; return r; })(),
        // Row 6: Question blocks
        (() => { const r = Array(170).fill(TILE_TYPES.AIR); r[38]=TILE_TYPES.QUESTION; r[39]=TILE_TYPES.QUESTION; return r; })(),
        // Row 7-10: Water
        Array(170).fill(TILE_TYPES.WATER),
        Array(170).fill(TILE_TYPES.WATER),
        Array(170).fill(TILE_TYPES.WATER),
        Array(170).fill(TILE_TYPES.WATER),
        // Row 11: Ground with water tunnels
        (() => { const r = Array(170).fill(TILE_TYPES.SOLID); for(let i=35;i<=45;i++) r[i]=TILE_TYPES.WATER; for(let i=80;i<=100;i++) r[i]=TILE_TYPES.WATER; for(let i=120;i<=140;i++) r[i]=TILE_TYPES.WATER; return r; })(),
        // Row 12-14: Ground with water
        (() => { const r = Array(170).fill(TILE_TYPES.SOLID); for(let i=35;i<=45;i++) r[i]=TILE_TYPES.WATER; for(let i=80;i<=100;i++) r[i]=TILE_TYPES.WATER; for(let i=120;i<=140;i++) r[i]=TILE_TYPES.WATER; return r; })(),
        (() => { const r = Array(170).fill(TILE_TYPES.SOLID); for(let i=35;i<=45;i++) r[i]=TILE_TYPES.WATER; for(let i=80;i<=100;i++) r[i]=TILE_TYPES.WATER; for(let i=120;i<=140;i++) r[i]=TILE_TYPES.WATER; return r; })(),
        (() => { const r = Array(170).fill(TILE_TYPES.SOLID); for(let i=35;i<=45;i++) r[i]=TILE_TYPES.WATER; for(let i=80;i<=100;i++) r[i]=TILE_TYPES.WATER; for(let i=120;i<=140;i++) r[i]=TILE_TYPES.WATER; return r; })()
    ],

    entities: [
        // Starting area - coin cluster
        { type: 'coin', x: 128, y: 160 },
        { type: 'coin', x: 144, y: 160 },
        { type: 'coin', x: 160, y: 160 },

        // First blooper
        { type: 'blooper', x: 192, y: 128, pattern: 'sine' },

        // Swim-up section - coins going up
        { type: 'coin', x: 256, y: 144 },
        { type: 'coin', x: 256, y: 128 },
        { type: 'coin', x: 256, y: 112 },
        { type: 'coin', x: 256, y: 96 },

        // Blooper patrol
        { type: 'blooper', x: 320, y: 80, pattern: 'vertical' },

        // Coin cluster
        { type: 'coin', x: 384, y: 128 },
        { type: 'coin', x: 400, y: 128 },
        { type: 'coin', x: 416, y: 128 },
        { type: 'coin', x: 384, y: 144 },
        { type: 'coin', x: 400, y: 144 },
        { type: 'coin', x: 416, y: 144 },

        // Moving blooper
        { type: 'blooper', x: 480, y: 96, pattern: 'horizontal' },

        // Swim down section
        { type: 'coin', x: 560, y: 160 },
        { type: 'coin', x: 560, y: 176 },
        { type: 'coin', x: 560, y: 192 },

        // Blooper trio
        { type: 'blooper', x: 640, y: 176, pattern: 'sine' },
        { type: 'blooper', x: 704, y: 160, pattern: 'sine' },

        // Powerup area
        { type: 'questionBlock', x: 768, y: 128, contents: 'star', hit: false },
        { type: 'coin', x: 800, y: 128 },
        { type: 'coin', x: 816, y: 128 },
        { type: 'coin', x: 832, y: 128 },

        // Deep section with blooper
        { type: 'blooper', x: 880, y: 192, pattern: 'vertical' },

        // Long swim with scattered coins
        { type: 'coin', x: 960, y: 160 },
        { type: 'coin', x: 1024, y: 144 },
        { type: 'coin', x: 1088, y: 128 },

        // Blooper patrol
        { type: 'blooper', x: 1120, y: 112, pattern: 'horizontal' },

        // Coin canyon - vertical line
        { type: 'coin', x: 1216, y: 96 },
        { type: 'coin', x: 1216, y: 112 },
        { type: 'coin', x: 1216, y: 128 },
        { type: 'coin', x: 1216, y: 144 },
        { type: 'coin', x: 1216, y: 160 },
        { type: 'coin', x: 1216, y: 176 },

        // Final stretch with bloopers
        { type: 'blooper', x: 1312, y: 128, pattern: 'sine' },
        { type: 'blooper', x: 1376, y: 144, pattern: 'vertical' },

        // Exit area - coin run
        { type: 'coin', x: 1472, y: 160 },
        { type: 'coin', x: 1488, y: 160 },
        { type: 'coin', x: 1504, y: 160 },
        { type: 'coin', x: 1520, y: 160 },

        // End zone
        { type: 'flagpole', x: 1600, y: 80, height: 128 },
        { type: 'castle', x: 1680, y: 128 }
    ],

    solidTiles: [TILE_TYPES.SOLID, TILE_TYPES.QUESTION, TILE_TYPES.WATER, TILE_TYPES.USED],
    playerSpawn: { x: 32, y: 80 },
    physics: {
        gravity: PHYSICS.SWIM_GRAVITY,
        maxSpeed: 2.5
    }
};

// =============================================================================
// ALL LEVELS EXPORT
// =============================================================================
export const LEVELS = [LEVEL_1_1, LEVEL_1_2, LEVEL_1_3, LEVEL_1_4, LEVEL_1_C];

// =============================================================================
// LEVEL HELPER FUNCTIONS
// =============================================================================

// Get level by ID
export function getLevelById(id) {
    return LEVELS.find(level => level.id === id);
}

// Load level data (for levelLoader.js integration)
export function loadLevel(id) {
    const level = getLevelById(id);
    if (!level) {
        console.error(`Level ${id} not found`);
        return null;
    }
    return { ...level };
}

// Get tile at world position
export function getTileAt(level, x, y) {
    const tileX = Math.floor(x / level.tileSize);
    const tileY = Math.floor(y / level.tileSize);

    if (tileX < 0 || tileX >= level.width || tileY < 0 || tileY >= level.height) {
        return TILE_TYPES.AIR;
    }

    return level.tiles[tileY]?.[tileX] ?? TILE_TYPES.AIR;
}

// Check if tile is solid
export function isSolidTile(level, tileType) {
    return level.solidTiles.includes(tileType);
}

// Test level (backwards compatibility)
export const testLevel = LEVEL_1_1;
