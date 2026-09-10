// Entity spawn definitions for each level
// Each entity has: type, x, y, and type-specific properties

export const ENTITY_SPAWNS = {
    // ============================================
    // LEVEL 1-1: Grass Land
    // ============================================
    '1-1': [
        // Goombas - basic walking enemies
        { type: 'goomba', x: 50 * 16, y: 13 * 16 },
        { type: 'goomba', x: 80 * 16, y: 13 * 16 },
        { type: 'goomba', x: 130 * 16, y: 13 * 16 },
        { type: 'goomba', x: 150 * 16, y: 13 * 16 },

        // Koopas - turtle enemies
        { type: 'koopa', x: 70 * 16, y: 13 * 16 },
        { type: 'koopa', x: 140 * 16, y: 13 * 16 },

        // Piranha plants in pipes
        { type: 'piranha', x: 40 * 16, y: 10 * 16, pipeHeight: 4 },
        { type: 'piranha', x: 42 * 16, y: 10 * 16, pipeHeight: 4 },

        // Powerup - mushroom from ? block
        { type: 'powerup', x: 45 * 16, y: 5 * 16, powerupType: 'mushroom' },

        // Coins from ? blocks
        { type: 'coin', x: 46 * 16, y: 5 * 16 },
        { type: 'coin', x: 47 * 16, y: 5 * 16 },

        // Hidden coins above bricks
        { type: 'coin', x: 26 * 16, y: 5 * 16 },
        { type: 'coin', x: 27 * 16, y: 5 * 16 },

        // Brick with hidden coin
        { type: 'coin', x: 83 * 16, y: 8 * 16 },

        // Additional coins along the level
        { type: 'coin', x: 100 * 16, y: 10 * 16 },
        { type: 'coin', x: 101 * 16, y: 10 * 16 },
        { type: 'coin', x: 102 * 16, y: 10 * 16 },

        // Flagpole at end
        { type: 'flagpole', x: 190 * 16, y: 3 * 16 },

        // Castle at end
        { type: 'castle', x: 195 * 16, y: 9 * 16 }
    ],

    // ============================================
    // LEVEL 1-2: Underground Cavern
    // ============================================
    '1-2': [
        // Goombas
        { type: 'goomba', x: 40 * 16, y: 12 * 16 },
        { type: 'goomba', x: 90 * 16, y: 12 * 16 },
        { type: 'goomba', x: 130 * 16, y: 12 * 16 },

        // Koopas
        { type: 'koopa', x: 70 * 16, y: 12 * 16 },
        { type: 'koopa', x: 120 * 16, y: 12 * 16 },

        // Powerups from ? blocks
        { type: 'powerup', x: 24 * 16, y: 4 * 16, powerupType: 'mushroom' },
        { type: 'powerup', x: 25 * 16, y: 4 * 16, powerupType: 'mushroom' },
        { type: 'powerup', x: 26 * 16, y: 4 * 16, powerupType: 'mushroom' },

        // Coins from bricks
        { type: 'coin', x: 96 * 16, y: 7 * 16 },
        { type: 'coin', x: 97 * 16, y: 7 * 16 },
        { type: 'coin', x: 98 * 16, y: 7 * 16 },

        // Coin clusters near ceiling gaps
        { type: 'coin', x: 20 * 16, y: 4 * 16 },
        { type: 'coin', x: 21 * 16, y: 4 * 16 },
        { type: 'coin', x: 22 * 16, y: 4 * 16 },
        { type: 'coin', x: 23 * 16, y: 4 * 16 }
    ],

    // ============================================
    // LEVEL 1-3: Fortress Exterior
    // ============================================
    '1-3': [
        // Hammer Bros encounter
        { type: 'hammerBro', x: 85 * 16, y: 13 * 16 },

        // Koopas on elevated platforms
        { type: 'koopa', x: 50 * 16, y: 4 * 16 },
        { type: 'koopa', x: 110 * 16, y: 13 * 16 },
        { type: 'koopa', x: 140 * 16, y: 13 * 16 },

        // Goombas
        { type: 'goomba', x: 30 * 16, y: 13 * 16 },
        { type: 'goomba', x: 75 * 16, y: 13 * 16 },

        // Moving platforms over lava
        { type: 'movingPlatform', x: 30 * 16, y: 9 * 16, patrolStart: 30 * 16, patrolEnd: 40 * 16, speed: 1 },
        { type: 'movingPlatform', x: 80 * 16, y: 9 * 16, patrolStart: 80 * 16, patrolEnd: 90 * 16, speed: 1 },

        // Powerup from ? block
        { type: 'powerup', x: 90 * 16, y: 10 * 16, powerupType: 'mushroom' },

        // Flagpole
        { type: 'flagpole', x: 145 * 16, y: 3 * 16 }
    ],

    // ============================================
    // LEVEL 1-4: Castle Interior
    // ============================================
    '1-4': [
        // Fire bars (rotating hazards)
        { type: 'fireBar', x: 40 * 16, y: 8 * 16, length: 5, speed: 2 },
        { type: 'fireBar', x: 70 * 16, y: 8 * 16, length: 7, speed: 2 },
        { type: 'fireBar', x: 100 * 16, y: 8 * 16, length: 5, speed: 2 },

        // Bowser boss battle
        { type: 'bowser', x: 120 * 16, y: 9 * 16, throwsFireballs: true, jumps: true },

        // Spike hazards (treat as enemy that kills on touch)
        { type: 'spike', x: 30 * 16, y: 13 * 16 },
        { type: 'spike', x: 60 * 16, y: 13 * 16 },
        { type: 'spike', x: 90 * 16, y: 13 * 16 }
    ],

    // ============================================
    // LEVEL 1-C: Underwater Bonus Level
    // ============================================
    '1-C': [
        // Bloopers - swimming fish enemies
        { type: 'blooper', x: 50 * 16, y: 5 * 16, swimPattern: 'vertical' },
        { type: 'blooper', x: 100 * 16, y: 6 * 16, swimPattern: 'vertical' },
        { type: 'blooper', x: 140 * 16, y: 5 * 16, swimPattern: 'vertical' },

        // Coin arcs (swimming collection)
        { type: 'coin', x: 16 * 16, y: 2 * 16 },
        { type: 'coin', x: 17 * 16, y: 3 * 16 },
        { type: 'coin', x: 18 * 16, y: 4 * 16 },
        { type: 'coin', x: 19 * 16, y: 3 * 16 },
        { type: 'coin', x: 20 * 16, y: 2 * 16 },

        // Coin cluster near platform
        { type: 'coin', x: 85 * 16, y: 4 * 16 },
        { type: 'coin', x: 86 * 16, y: 4 * 16 },
        { type: 'coin', x: 87 * 16, y: 4 * 16 },
        { type: 'coin', x: 88 * 16, y: 4 * 16 },

        // Powerup from ? block
        { type: 'powerup', x: 38 * 16, y: 6 * 16, powerupType: 'mushroom' },
        { type: 'powerup', x: 39 * 16, y: 6 * 16, powerupType: 'mushroom' }
    ]
};

// Get entity spawns for a specific level
export function getEntitySpawns(levelId) {
    return ENTITY_SPAWNS[levelId] || [];
}

// Entity type definitions for reference
export const ENTITY_TYPES = {
    // Enemies
    GOOMBA: 'goomba',
    KOOPA: 'koopa',
    PIRANHA: 'piranha',
    HAMMER_BRO: 'hammerBro',
    BLOOPER: 'blooper',
    BOWSER: 'bowser',
    FIRE_BAR: 'fireBar',
    SPIKE: 'spike',

    // Powerups
    MUSHROOM: 'powerup',
    COIN: 'coin',
    STAR: 'star',

    // Level elements
    FLAGPOLE: 'flagpole',
    CASTLE: 'castle',
    MOVING_PLATFORM: 'movingPlatform'
};
