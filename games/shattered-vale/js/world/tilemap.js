// world/tilemap.js — the TileMap class: owns the tile grid, gate state, and
// the baked static render. Actual world-generation lives in
// tilemap-builder.js and per-tile drawing lives in tilemap-renderer.js; this
// file is the (much smaller) glue between them.

class TileMap {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;

    this.tiles = [];
    this.decor = [];

    this.isGateOpen = false;
    this.isWorldTwoGateOpen = false;
    this.isJungleGateOpen = false;
    this.isSkeletonGateOpen = false;
    this.isLavaGateOpen = false;
    this.isPitGateOpen = false;

    this.trollSpawn = { x: 21, y: 17 };

    // Row at which the original World 1/World 2 area ends and the new
    // southern Jungle band begins (original map was 48 rows tall).
    this.oasisSouthEdge = 47;
    // Jungle now spans the full map width (not just x>=28) and much deeper
    // south — roughly 3x the tile area of the original single-column jungle.
    this.jungleLeftEdge = 1;
    // Row at which the Jungle band ends and the new Skeleton Dungeon begins.
    // The jungle keeps exactly the height it always had (rows 48-86, i.e.
    // 39 rows, from the original 88-row map) — this dungeon is purely an
    // addition below it, not a resize of the jungle itself.
    this.jungleSouthEdge = 86;
    // Dungeon band: from jungleSouthEdge+1 (row 87) down to dungeonSouthEdge
    // (row 164) — 78 rows, matching the map's original total height (166
    // rows) exactly. Fixed rather than derived from `rows` so growing the
    // map further south for the Molten Depths doesn't also grow the crypt.
    this.dungeonLeftEdge = 1;
    this.dungeonSouthEdge = 164;

    // World 1 = grass
    // World 2 = beach
    // World 3 = jungle
    // World 4 = skeleton dungeon (crypt)
    // World 5 (new, southernmost band) = Molten Depths
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        if (y > this.dungeonSouthEdge + 1) row.push(TileType.OBSIDIAN);
        else if (y > this.jungleSouthEdge) row.push(TileType.CRYPT);
        else if (y > this.oasisSouthEdge) row.push(TileType.JUNGLE);
        else if (x >= 28) row.push(TileType.SAND);
        else row.push(TileType.GRASS);
      }
      this.tiles.push(row);
    }

    buildWorld(this);

    this._offscreen = null;
    this._bakeStatic();
  }

  set(x, y, t) {
    if (this.inBounds(x, y)) this.tiles[y][x] = t;
  }

  get(x, y) {
    return this.inBounds(x, y) ? this.tiles[y][x] : TileType.WALL;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  isSolid(x, y) {
    return !this.inBounds(x, y) || SOLID_TILES.has(this.get(x, y));
  }

  // Every gate (openGate/openWorldTwoGate/openJungleGate/openSkeletonGate)
  // replaces every tile of its type with PATH and flips its "open" flag.
  // They all funnel through this one method — see GATE_DEFS in
  // tilemap-builder.js for the tile type <-> flag mapping.
  _openGateType(gateDef) {
    let opened = false;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.get(x, y) === gateDef.tile) {
          this.set(x, y, TileType.PATH);
          opened = true;
        }
      }
    }
    if (opened) {
      this[gateDef.flag] = true;
      this._bakeStatic();
    }
  }

  openGate() { this._openGateType(GATE_DEFS.boss); }
  openWorldTwoGate() { this._openGateType(GATE_DEFS.worldTwo); }
  openJungleGate() { this._openGateType(GATE_DEFS.jungle); }
  openSkeletonGate() { this._openGateType(GATE_DEFS.skeleton); }
  openLavaGate() { this._openGateType(GATE_DEFS.lava); }
  openPitGate() { this._openGateType(GATE_DEFS.pit); }

  // =========================
  // BAKE STATIC LAYER
  // =========================
  _bakeStatic() {
    const off = makeCanvas(this.cols * TILE, this.rows * TILE);
    const ctx = off.getContext('2d');

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        drawGroundTile(ctx, this, x, y);
      }
    }
    this.decor.forEach((d) => drawDecor(ctx, d));

    this._offscreen = off;
  }

  // =========================
  // DRAW STATIC WORLD
  // =========================
  drawGround(ctx, camX, camY, viewW, viewH) {
    ctx.drawImage(this._offscreen, camX, camY, viewW, viewH, 0, 0, viewW, viewH);
  }

  // =========================
  // ANIMATED EFFECTS
  // =========================
  drawAnimated(ctx, camX, camY, viewW, viewH, t) {
    const startX = Math.max(0, Math.floor(camX / TILE));
    const endX = Math.min(this.cols, Math.ceil((camX + viewW) / TILE));
    const startY = Math.max(0, Math.floor(camY / TILE));
    const endY = Math.min(this.rows, Math.ceil((camY + viewH) / TILE));

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.get(x, y);
        if (tile === TileType.WATER) {
          const shimmer = Math.sin(t / 500 + x * 0.5 + y * 0.5) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255,255,255,${0.05 + shimmer * 0.06})`;
          ctx.fillRect(x * TILE - camX + 6, y * TILE - camY + 8, 14, 2);
        } else if (tile === TileType.LAVA) {
          const glow = Math.sin(t / 260 + x * 0.7 + y * 0.9) * 0.5 + 0.5;
          const px = x * TILE - camX, py = y * TILE - camY;
          ctx.fillStyle = `rgba(255,140,20,${0.15 + glow * 0.2})`;
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = `rgba(255,220,90,${0.1 + glow * 0.18})`;
          ctx.beginPath();
          ctx.arc(px + 10 + glow * 4, py + 20 - glow * 6, 2 + glow * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}
