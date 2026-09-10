// AABB collision detection and tile query utilities
import { TILE_SIZE } from '../levels/levels.js';

/**
 * AABB collision detection between two rectangles
 */
export function aabbCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(point, rect) {
    return (
        point.x >= rect.x &&
        point.x < rect.x + rect.width &&
        point.y >= rect.y &&
        point.y < rect.y + rect.height
    );
}

/**
 * Get the overlap amount between two colliding rectangles
 */
export function getOverlap(a, b) {
    if (!aabbCollision(a, b)) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

    return {
        x: Math.max(a.x, b.x),
        y: Math.max(a.y, b.y),
        width: overlapX,
        height: overlapY
    };
}

/**
 * Determine which side of a collision occurred
 */
export function getCollisionSide(moving, stationary) {
    const overlap = getOverlap(moving, stationary);

    if (overlap.width <= 0 || overlap.height <= 0) {
        return null;
    }

    const movingCenterX = moving.x + moving.width / 2;
    const movingCenterY = moving.y + moving.height / 2;
    const stationaryCenterX = stationary.x + stationary.width / 2;
    const stationaryCenterY = stationary.y + stationary.height / 2;

    const dx = movingCenterX - stationaryCenterX;
    const dy = movingCenterY - stationaryCenterY;

    const overlapHalfWidth = overlap.width / 2;
    const overlapHalfHeight = overlap.height / 2;

    if (Math.abs(dx / overlapHalfWidth) > Math.abs(dy / overlapHalfHeight)) {
        return dx > 0 ? 'right' : 'left';
    } else {
        return dy > 0 ? 'bottom' : 'top';
    }
}

/**
 * Query tiles that intersect with a bounding box
 */
export function queryTiles(level, bounds) {
    const tiles = [];

    const startCol = Math.floor(bounds.x / TILE_SIZE);
    const endCol = Math.floor((bounds.x + bounds.width - 1) / TILE_SIZE);
    const startRow = Math.floor(bounds.y / TILE_SIZE);
    const endRow = Math.floor((bounds.y + bounds.height - 1) / TILE_SIZE);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const tileType = level.getTileAt(col, row);
            if (tileType !== 0) {
                tiles.push({
                    x: col * TILE_SIZE,
                    y: row * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    type: tileType,
                    col: col,
                    row: row,
                    solid: level.isSolidTile(col, row)
                });
            }
        }
    }

    return tiles;
}

/**
 * Find the closest solid tile in a direction from a point
 */
export function findNearestSolidTile(level, x, y, directionX, directionY, maxDistance = 256) {
    const step = TILE_SIZE;
    let checkX = x;
    let checkY = y;
    let distance = 0;

    while (distance < maxDistance) {
        checkX += directionX * step;
        checkY += directionY * step;
        distance += step;

        const col = Math.floor(checkX / TILE_SIZE);
        const row = Math.floor(checkY / TILE_SIZE);

        if (level.isSolidTile(col, row)) {
            return {
                x: col * TILE_SIZE,
                y: row * TILE_SIZE,
                col: col,
                row: row,
                distance: distance
            };
        }
    }

    return null;
}

/**
 * Check if a bounding box would collide with any solid tile
 */
export function wouldCollideWithSolid(level, bounds) {
    const tiles = queryTiles(level, bounds);
    return tiles.some(tile => tile.solid);
}
