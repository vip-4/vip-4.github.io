// world/tilemap-builder.js — procedural world layout: which tile goes where.
// These are plain functions that take the TileMap instance being built
// (`map`) as their first argument, rather than TileMap methods, so the
// (fairly long) generation logic can live outside tilemap.js. Rendering of
// the tiles this produces lives in world/tilemap-renderer.js.

const TileType = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  TREE: 3,
  WALL: 4,
  FLOWER: 5,
  TALLGRASS: 6,
  BRIDGE: 7,
  SAND: 8,
  GATE: 9,
  WORLD_TWO_GATE: 10,
  JUNGLE: 11,
  JUNGLE_WALL: 12,
  JUNGLE_GATE: 13,
  CRYPT: 14,          // World 4 — Skeleton Dungeon floor
  CRYPT_WALL: 15,     // World 4 — dungeon stone wall
  SKELETON_GATE: 16,  // gate from the jungle into the dungeon
  OBSIDIAN: 17,        // World 5 — Molten Depths floor
  OBSIDIAN_WALL: 18,   // World 5 — volcanic rock wall
  LAVA: 19,            // World 5 — walkable hazard, damages the player over time
  LAVA_GATE: 20,       // gate from the dungeon into the Molten Depths
  PIT_GATE: 21,        // gate guarding the Pit Devil's arena within the Molten Depths
};

const SOLID_TILES = new Set([
  TileType.WATER,
  TileType.TREE,
  TileType.WALL,
  TileType.GATE,
  TileType.WORLD_TWO_GATE,
  TileType.JUNGLE_WALL,
  TileType.JUNGLE_GATE,
  TileType.CRYPT_WALL,
  TileType.SKELETON_GATE,
  TileType.OBSIDIAN_WALL,
  TileType.LAVA_GATE,
  TileType.PIT_GATE,
  // NOTE: LAVA is intentionally NOT solid — it's a walkable hazard (see
  // Combat.checkHazards), not a wall.
]);

// Every gate in the game, described declaratively: which tile type it is,
// and which flag on the TileMap instance tracks whether it's been opened.
// TileMap.openGate()/openWorldTwoGate()/openJungleGate()/openSkeletonGate()
// all delegate to the same _openGateType() using this table.
const GATE_DEFS = {
  boss: { tile: TileType.GATE, flag: 'isGateOpen' },
  worldTwo: { tile: TileType.WORLD_TWO_GATE, flag: 'isWorldTwoGateOpen' },
  jungle: { tile: TileType.JUNGLE_GATE, flag: 'isJungleGateOpen' },
  skeleton: { tile: TileType.SKELETON_GATE, flag: 'isSkeletonGateOpen' },
  lava: { tile: TileType.LAVA_GATE, flag: 'isLavaGateOpen' },
  pit: { tile: TileType.PIT_GATE, flag: 'isPitGateOpen' },
};

function buildWorld(map) {
  // =========================
  // MAP BORDERS
  // =========================
  for (let x = 0; x < map.cols; x++) {
    map.set(x, 0, x >= 28 ? TileType.WATER : TileType.GRASS);
    map.set(x, map.rows - 1, x >= 28 ? TileType.WATER : TileType.GRASS);
  }
  for (let y = 0; y < map.rows; y++) {
    map.set(0, y, TileType.GRASS);
    map.set(map.cols - 1, y, TileType.WATER);
  }

  // =========================
  // WORLD 1 PATH SYSTEM
  // =========================
  for (let x = 14; x < 28; x++) map.set(x, 9, TileType.PATH);
  for (let y = 9; y <= map.oasisSouthEdge - 2; y++) {
    map.set(13, y, TileType.PATH);
  }
  for (let x = 14; x < 17; x++) map.set(x, 33, TileType.PATH);
  for (let x = 10; x < 14; x++) map.set(x, 37, TileType.PATH);

  // =========================
  // FOREST CLUSTERS
  // =========================
  const clusters = [
    [3, 3, 4],
    [20, 3, 3],
    [3, 17, 4],
    [20, 16, 4],
    [2, 11, 3],
  ];
  clusters.forEach(([cx, cy, r]) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (hashTile(x, y) > 0.35 && dist(x, y, cx, cy) <= r) {
          map.set(x, y, TileType.TREE);
        }
      }
    }
  });

  // =========================
  // WORLD TWO BORDER GATE
  // =========================
  for (let y = 0; y <= map.oasisSouthEdge; y++) {
    if (y === 9) {
      map.set(27, y, TileType.WORLD_TWO_GATE);
    } else {
      map.set(27, y, TileType.TREE);
    }
  }

  // =========================
  // BEACH WORLD
  // =========================
  for (let x = 28; x < map.cols - 1; x++) {
    for (let y = 1; y < map.oasisSouthEdge; y++) {
      // road from gate
      if (y === 9) {
        map.set(x, y, TileType.PATH);
      }
    }
  }

  // =========================
  // SOUTHERN JUNGLE (below the oasis)
  // =========================
  buildJungle(map);

  // =========================
  // SKELETON DUNGEON (below the jungle)
  // =========================
  buildCrypt(map);

  // =========================
  // MOLTEN DEPTHS (below the dungeon)
  // =========================
  buildMoltenDepths(map);

  // =========================
  // TROLL CASTLE
  // =========================
  const castle = { left: 17, right: 25, top: 13, bottom: 21 };

  // clear inside
  for (let y = castle.top + 1; y < castle.bottom; y++) {
    for (let x = castle.left + 1; x < castle.right; x++) {
      map.set(x, y, TileType.GRASS);
    }
  }
  // horizontal walls
  for (let x = castle.left; x <= castle.right; x++) {
    map.set(x, castle.top, TileType.WALL);
    map.set(x, castle.bottom, TileType.WALL);
  }
  // vertical walls
  for (let y = castle.top; y <= castle.bottom; y++) {
    map.set(castle.left, y, TileType.WALL);
    map.set(castle.right, y, TileType.WALL);
  }
  // boss gate
  map.set(castle.left, 17, TileType.GATE);
  // road to castle
  for (let x = 3; x < castle.left; x++) {
    map.set(x, 17, TileType.PATH);
  }

  // =========================
  // WATER MOAT
  // =========================
  for (let y = castle.top - 2; y <= castle.bottom + 2; y++) {
    for (let x = castle.left - 2; x <= castle.right + 2; x++) {
      const inside = x >= castle.left && x <= castle.right && y >= castle.top && y <= castle.bottom;
      if (!inside) {
        map.set(x, y, TileType.WATER);
      }
    }
  }
  // wooden bridge
  map.set(castle.left - 1, 17, TileType.BRIDGE);
  map.set(castle.left - 2, 17, TileType.BRIDGE);
  map.set(castle.left, 17, TileType.GATE);

  // =========================
  // DECORATIONS
  // =========================
  for (let y = 1; y < map.rows - 1; y++) {
    for (let x = 1; x < map.cols - 1; x++) {
      const tile = map.get(x, y);
      const h = hashTile(x * 3 + 7, y * 5 + 1);

      // grass decorations
      if (tile === TileType.GRASS) {
        if (h > 0.93) {
          map.decor.push({ x, y, type: 'flower', variant: Math.floor(h * 10) % 3 });
        } else if (h > 0.85) {
          map.decor.push({ x, y, type: 'grasstuft' });
        } else if (h > 0.8) {
          map.decor.push({ x, y, type: 'rock' });
        }
      }
      // beach decorations
      else if (tile === TileType.SAND) {
        if (h > 0.94) {
          map.decor.push({ x, y, type: 'shells' });
        } else if (h > 0.88) {
          map.decor.push({ x, y, type: 'starfish' });
        } else if (h > 0.82) {
          map.decor.push({ x, y, type: 'palm' });
        }
      }
      // jungle decorations
      else if (tile === TileType.JUNGLE) {
        if (h > 0.92) {
          map.decor.push({ x, y, type: 'jungleflower', variant: Math.floor(h * 10) % 2 });
        } else if (h > 0.8) {
          map.decor.push({ x, y, type: 'fern' });
        } else if (h > 0.72) {
          map.decor.push({ x, y, type: 'vines' });
        }
      }
      // crypt decorations (Skeleton Dungeon)
      else if (tile === TileType.CRYPT) {
        if (h > 0.94) {
          map.decor.push({ x, y, type: 'bones' });
        } else if (h > 0.87) {
          map.decor.push({ x, y, type: 'brazier' });
        } else if (h > 0.8) {
          map.decor.push({ x, y, type: 'rubble' });
        }
      }
      // Molten Depths decorations
      else if (tile === TileType.OBSIDIAN) {
        if (h > 0.94) {
          map.decor.push({ x, y, type: 'skullpile' });
        } else if (h > 0.87) {
          map.decor.push({ x, y, type: 'emberpile' });
        } else if (h > 0.8) {
          map.decor.push({ x, y, type: 'obsidianshard' });
        }
      }
    }
  }
}

// =========================
// BUILD SOUTHERN JUNGLE
// =========================
function buildJungle(map) {
  const left = map.jungleLeftEdge;
  const right = map.cols - 2;
  const top = map.oasisSouthEdge + 1;
  const bottom = map.jungleSouthEdge;

  const spawnClearings = [
    [8, 51], [14, 54], [20, 50], [6, 58], [18, 60],
    [32, 52], [40, 55], [46, 51], [36, 60], [44, 62],
    [52, 53], [8, 68], [16, 70], [24, 66], [4, 72],
    [12, 62], [28, 74],
    // west boss arena (Orc Warlord)
    [10, 78],
    // east boss arena (Jungle Witch) — far from the orc, opposite side
    [48, 66],
  ];
  const nearSpawn = (x, y) =>
    spawnClearings.some(([sx, sy]) => Math.abs(x - sx) <= 2 && Math.abs(y - sy) <= 2);

  // Wall ring around the whole jungle
  for (let x = left - 1; x <= right + 1; x++) {
    map.set(x, top - 1, TileType.JUNGLE_WALL);
  }
  for (let y = top - 1; y <= bottom; y++) {
    map.set(left - 1, y, TileType.JUNGLE_WALL);
    map.set(right + 1, y, TileType.JUNGLE_WALL);
  }

  // Single gate connecting the oasis to the jungle
  const gateX = Math.floor((left + right + (right / 2)) / 2); // centered between jungle edges
  map.set(gateX, top - 1, TileType.JUNGLE_GATE);

  // Dense jungle tree clusters spread across the full 3x-wider/taller area
  const jungleClusters = [
    [6, top + 3, 4], [14, top + 5, 3], [22, top + 3, 4],
    [32, top + 4, 4], [45, top + 3, 4], [4, top + 12, 4],
    [38, top + 8, 3], [30, top + 10, 3], [48, top + 9, 4],
    [10, top + 16, 4], [20, top + 14, 3], [42, top + 13, 3],
    [34, top + 15, 4], [50, top + 15, 3], [6, top + 22, 4],
    [16, top + 24, 3], [26, top + 20, 4], [44, top + 20, 4],
    [8, top + 28, 3], [36, top + 26, 4],
  ];
  jungleClusters.forEach(([cx, cy, r]) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (
          x > left && x < right && y > top && y < bottom - 3 &&
          hashTile(x + 11, y + 3) > 0.3 &&
          dist(x, y, cx, cy) <= r &&
          !nearSpawn(x, y)
        ) {
          map.set(x, y, TileType.TREE);
        }
      }
    }
  });

  // West boss arena — Orc Warlord, far side of the jungle from the witch
  clearArena(map, 10, top + 30, 7);
  // East boss arena — Jungle Witch, opposite corner
  clearArena(map, 48, top + 18, 7);
}

// =========================
// BUILD SKELETON DUNGEON (crypt, south of the jungle)
// =========================
function buildCrypt(map) {
  const left = map.dungeonLeftEdge;
  // 2x the jungle's own width (jungle right edge was 54, left edge 1,
  // giving a 53-wide span; doubled here to 106-wide).
  const right = 107;
  const top = map.jungleSouthEdge + 1;
  // Fixed at the dungeon's own south edge (not tied to map.rows) so growing
  // the map to fit the Molten Depths below doesn't also grow the crypt.
  const bottom = map.dungeonSouthEdge;

  // Tile coordinates for the many spider/skeleton spawns, plus the
  // Skeleton King's throne room. Kept in sync with ENEMY_PLACEMENTS in
  // config/level-layout.js. Pillar/rubble clusters below always leave a
  // small clear radius around each so no spawn can land solid.
  const spawnClearings = [
    [8, top + 5], [16, top + 8], [24, top + 4], [34, top + 7], [44, top + 5],
    [54, top + 8], [64, top + 4], [74, top + 7], [84, top + 5], [94, top + 8],
    [12, top + 14], [22, top + 16], [32, top + 13], [42, top + 17], [52, top + 14],
    [62, top + 16], [72, top + 13], [82, top + 17], [92, top + 14], [100, top + 16],
    [6, top + 24], [18, top + 26], [30, top + 23], [40, top + 27], [50, top + 24],
    [60, top + 26], [70, top + 23], [80, top + 27], [90, top + 24], [100, top + 26],
    [10, top + 34], [20, top + 36], [30, top + 33], [40, top + 37], [50, top + 34],
    [60, top + 36], [70, top + 33], [80, top + 37], [90, top + 34],
    [14, top + 46], [26, top + 48], [38, top + 45], [50, top + 49], [62, top + 46],
    [74, top + 48], [86, top + 45], [96, top + 49],
    [18, top + 58], [34, top + 60], [50, top + 57], [66, top + 60], [82, top + 58],
    // Skeleton King throne room — far south, centered
    [53, top + 71],
  ];
  const nearSpawn = (x, y) =>
    spawnClearings.some(([sx, sy]) => Math.abs(x - sx) <= 2 && Math.abs(y - sy) <= 2);

  // Dense crypt pillar/rubble clusters spread across the full dungeon area
  const cryptClusters = [
    [6, top + 3, 3], [16, top + 4, 4], [26, top + 3, 3], [36, top + 4, 4],
    [46, top + 3, 3], [56, top + 4, 4], [66, top + 3, 3], [76, top + 4, 4],
    [86, top + 3, 3], [96, top + 4, 3],
    [10, top + 11, 4], [22, top + 12, 3], [32, top + 10, 4], [44, top + 12, 3],
    [56, top + 11, 4], [68, top + 12, 3], [80, top + 10, 4], [92, top + 12, 3],
    [4, top + 20, 3], [18, top + 21, 4], [28, top + 19, 3], [40, top + 21, 4],
    [54, top + 20, 3], [66, top + 21, 4], [78, top + 19, 3], [90, top + 21, 4],
    [100, top + 20, 3],
    [8, top + 30, 4], [24, top + 31, 3], [36, top + 29, 4], [48, top + 31, 3],
    [64, top + 30, 4], [76, top + 31, 3], [88, top + 29, 4], [98, top + 31, 3],
    [14, top + 41, 3], [30, top + 42, 4], [46, top + 40, 3], [58, top + 42, 4],
    [74, top + 41, 3], [90, top + 42, 4],
    [10, top + 52, 4], [26, top + 53, 3], [42, top + 51, 4], [58, top + 53, 3],
    [70, top + 51, 4], [86, top + 53, 3],
    [16, top + 63, 3], [36, top + 64, 4], [56, top + 62, 3], [76, top + 64, 4],
    [94, top + 63, 3],
  ];
  cryptClusters.forEach(([cx, cy, r]) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (
          x > left && x < right && y > top && y < bottom - 3 &&
          hashTile(x + 17, y + 5) > 0.32 &&
          dist(x, y, cx, cy) <= r &&
          !nearSpawn(x, y)
        ) {
          map.set(x, y, TileType.CRYPT_WALL);
        }
      }
    }
  });

  // Skeleton King throne room — a large cleared arena at the dungeon's far
  // south end. Its radius (10) reaches 3 tiles past `bottom` toward the
  // south wall row — the wall ring and both gates are built AFTER this on
  // purpose (see below), so that reach can never carve a hole in the
  // boundary the way it used to.
  clearArena(map, 53, top + 71, 10, TileType.CRYPT);

  // Wall ring around the whole dungeon, built last so nothing generated
  // above (clusters, the throne room's clearArena) can ever punch a hole
  // in it — this was the actual bug: the throne room used to run before
  // the wall existed at all, then got walled over eventually, but the
  // wall itself used to be built *before* the throne room clearArena wiped
  // out a stretch of it.
  for (let x = left - 1; x <= right + 1; x++) {
    map.set(x, top - 1, TileType.CRYPT_WALL);
    map.set(x, bottom + 1, TileType.CRYPT_WALL);
  }
  for (let y = top - 1; y <= bottom + 1; y++) {
    map.set(left - 1, y, TileType.CRYPT_WALL);
    map.set(right + 1, y, TileType.CRYPT_WALL);
  }

  // Single gate connecting the jungle to the dungeon, centered
  const gateX = Math.floor((left + right) / 2);
  map.set(gateX, top - 1, TileType.SKELETON_GATE);

  // Lava Gate — the dungeon's south wall used to be a solid cap (this was
  // the end of the map); now it opens into the Molten Depths once the
  // Skeleton King is dead (see BOSS_DEFEAT_EVENTS.skeletonKing).
  map.set(53, bottom + 1, TileType.LAVA_GATE);
}

// =========================
// BUILD MOLTEN DEPTHS (World 5, south of the Skeleton Dungeon)
// =========================
function buildMoltenDepths(map) {
  const left = map.dungeonLeftEdge;
  const right = map.cols - 2;
  // One row past the shared wall/gate row buildCrypt already drew at
  // dungeonSouthEdge + 1 — this zone's own floor starts right after it.
  const top = map.dungeonSouthEdge + 2;
  const bottom = map.rows - 2;

  // Side walls for the full height of the zone, plus a south cap.
  for (let y = top - 1; y <= bottom + 1; y++) {
    map.set(left - 1, y, TileType.OBSIDIAN_WALL);
    map.set(right + 1, y, TileType.OBSIDIAN_WALL);
  }
  for (let x = left - 1; x <= right + 1; x++) {
    map.set(x, bottom + 1, TileType.OBSIDIAN_WALL);
  }

  // A wide clear band runs the full height of the zone. Both boss arenas
  // and every grunt spawn in ENEMY_PLACEMENTS (config/level-layout.js) sit
  // inside it, so they're guaranteed to be on open ground regardless of
  // how the hazard/rubble scattering below shakes out; lava and rubble stay
  // confined to the outer flanks.
  const bandLeft = 38, bandRight = 68;
  for (let y = top; y <= bottom; y++) {
    for (let x = bandLeft; x <= bandRight; x++) {
      map.set(x, y, TileType.OBSIDIAN);
    }
  }

  // Pit Gate — a full-width wall partway down the band, guarding the Pit
  // Devil's arena until the Troll Chieftain (guarding the approach) is dead.
  const gateRow = top + 27;
  for (let x = bandLeft; x <= bandRight; x++) {
    map.set(x, gateRow, TileType.OBSIDIAN_WALL);
  }
  for (let x = 51; x <= 55; x++) {
    map.set(x, gateRow, TileType.PIT_GATE);
  }

  // Obsidian rubble clusters, kept clear of the central band so there's
  // always a safe route through.
  const clusters = [
    [15, top + 8, 4], [92, top + 8, 4], [20, top + 24, 3], [86, top + 24, 3],
    [12, top + 40, 4], [95, top + 40, 4], [22, top + 54, 3], [84, top + 54, 3],
    [16, top + 62, 4], [90, top + 62, 4],
  ];
  clusters.forEach(([cx, cy, r]) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (
          x > left && x < right && y > top - 1 && y < bottom &&
          (x < bandLeft - 1 || x > bandRight + 1) &&
          hashTile(x + 29, y + 13) > 0.32 && dist(x, y, cx, cy) <= r
        ) {
          map.set(x, y, TileType.OBSIDIAN_WALL);
        }
      }
    }
  });

  // Lava hazard patches — also kept out of the central band.
  const lavaPatches = [
    [24, top + 16, 3], [82, top + 16, 3], [28, top + 34, 3], [78, top + 34, 3],
    [24, top + 48, 3], [82, top + 48, 3], [30, top + 60, 3], [76, top + 60, 3],
  ];
  lavaPatches.forEach(([cx, cy, r]) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (
          x > left && x < right && y > top - 1 && y < bottom &&
          (x < bandLeft - 1 || x > bandRight + 1) &&
          dist(x, y, cx, cy) <= r
        ) {
          map.set(x, y, TileType.LAVA);
        }
      }
    }
  });
}

function clearArena(map, cx, cy, r, tileType = TileType.JUNGLE) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (map.inBounds(x, y) && dist(x, y, cx, cy) <= r) {
        map.set(x, y, tileType);
      }
    }
  }
}
