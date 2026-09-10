/* =========================================================================
 * world.js — Map generation, tile collision, line-of-sight, A* pathfinding,
 * loot containers, ground items, bullets.
 * ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const U = G.Utils;
  const Config = G.Config;

  /* --------------------------- Map helpers ------------------------------ */
  function attachMapMethods(map) {
    const W = map.w, H = map.h, T = map.tile, grid = map.grid;

    map.isSolidTile = function (tx, ty) {
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
      return grid[ty * W + tx] === 1;
    };
    map.solidAtPx = function (px, py) {
      return map.isSolidTile(Math.floor(px / T), Math.floor(py / T));
    };
    map.worldToTile = function (px, py) {
      return { tx: Math.floor(px / T), ty: Math.floor(py / T) };
    };
    map.tileCenter = function (tx, ty) {
      return { x: tx * T + T / 2, y: ty * T + T / 2 };
    };
    // circle vs solid tiles
    map.circleHits = function (x, y, r) {
      const minx = Math.floor((x - r) / T), maxx = Math.floor((x + r) / T);
      const miny = Math.floor((y - r) / T), maxy = Math.floor((y + r) / T);
      for (let ty = miny; ty <= maxy; ty++) {
        for (let tx = minx; tx <= maxx; tx++) {
          if (map.isSolidTile(tx, ty)) {
            const rx = tx * T, ry = ty * T;
            const cx = U.clamp(x, rx, rx + T), cy = U.clamp(y, ry, ry + T);
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy < r * r) return true;
          }
        }
      }
      return false;
    };
    // move circle with axis-separated wall sliding
    map.move = function (x, y, r, dx, dy) {
      let nx = x + dx;
      if (map.circleHits(nx, y, r)) nx = x;
      let ny = y + dy;
      if (map.circleHits(nx, ny, r)) ny = y;
      return { x: nx, y: ny };
    };
    // line-of-sight: true if no solid tile blocks the segment (DDA)
    map.los = function (x0, y0, x1, y1) {
      let tx = Math.floor(x0 / T), ty = Math.floor(y0 / T);
      const tx1 = Math.floor(x1 / T), ty1 = Math.floor(y1 / T);
      const dx = x1 - x0, dy = y1 - y0;
      const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
      const tDeltaX = dx === 0 ? Infinity : Math.abs(T / dx);
      const tDeltaY = dy === 0 ? Infinity : Math.abs(T / dy);
      let tMaxX = dx === 0 ? Infinity :
        ((dx > 0 ? (tx + 1) * T - x0 : x0 - tx * T) / Math.abs(dx));
      let tMaxY = dy === 0 ? Infinity :
        ((dy > 0 ? (ty + 1) * T - y0 : y0 - ty * T) / Math.abs(dy));
      let guard = 0;
      while (guard++ < 4096) {
        if (map.isSolidTile(tx, ty)) return false;
        if (tx === tx1 && ty === ty1) return true;
        if (tMaxX < tMaxY) { tMaxX += tDeltaX; tx += stepX; }
        else { tMaxY += tDeltaY; ty += stepY; }
      }
      return true;
    };

    // A* pathfinding on the tile grid (8-dir, no corner cutting).
    map.findPath = function (sx, sy, gx, gy) {
      const s = map.worldToTile(sx, sy);
      let g = map.worldToTile(gx, gy);
      if (map.isSolidTile(s.tx, s.ty)) return null;
      if (map.isSolidTile(g.tx, g.ty)) {
        const near = nearestOpen(map, g.tx, g.ty);
        if (!near) return null; g = near;
      }
      const start = s.ty * W + s.tx, goal = g.ty * W + g.tx;
      if (start === goal) return [];
      const open = new MinHeap();
      const came = new Map();
      const gScore = new Map();
      gScore.set(start, 0);
      open.push(start, heur(s.tx, s.ty, g.tx, g.ty));
      const closed = new Set();
      let iter = 0;
      while (open.size() && iter++ < 6000) {
        const cur = open.pop();
        if (cur === goal) return reconstruct(came, cur);
        if (closed.has(cur)) continue;
        closed.add(cur);
        const cx = cur % W, cy = (cur / W) | 0;
        const cg = gScore.get(cur);
        for (let d = 0; d < 8; d++) {
          const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
          if (map.isSolidTile(nx, ny)) continue;
          if (d >= 4) { // diagonal: forbid corner cut
            if (map.isSolidTile(cx + DIRS[d][0], cy) || map.isSolidTile(cx, cy + DIRS[d][1])) continue;
          }
          const ni = ny * W + nx;
          if (closed.has(ni)) continue;
          const step = d >= 4 ? 1.414 : 1;
          const tentative = cg + step;
          if (tentative < (gScore.get(ni) === undefined ? Infinity : gScore.get(ni))) {
            came.set(ni, cur);
            gScore.set(ni, tentative);
            open.push(ni, tentative + heur(nx, ny, g.tx, g.ty));
          }
        }
      }
      return null;

      function heur(ax, ay, bx, by) {
        const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
        return (dx + dy) + (1.414 - 2) * Math.min(dx, dy);
      }
      function reconstruct(came, cur) {
        const path = [];
        while (came.has(cur)) {
          const tx = cur % W, ty = (cur / W) | 0;
          path.push(map.tileCenter(tx, ty));
          cur = came.get(cur);
        }
        path.reverse();
        return path;
      }
    };
  }

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  function nearestOpen(map, tx, ty) {
    for (let r = 1; r < 8; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          if (!map.isSolidTile(tx + dx, ty + dy)) return { tx: tx + dx, ty: ty + dy };
        }
      }
    }
    return null;
  }

  // Minimal binary min-heap keyed by priority.
  function MinHeap() { this.items = []; this.prio = []; }
  MinHeap.prototype = {
    size() { return this.items.length; },
    push(item, p) {
      this.items.push(item); this.prio.push(p);
      let i = this.items.length - 1;
      while (i > 0) {
        const par = (i - 1) >> 1;
        if (this.prio[par] <= this.prio[i]) break;
        this._swap(i, par); i = par;
      }
    },
    pop() {
      const top = this.items[0];
      const last = this.items.length - 1;
      this._swap(0, last);
      this.items.pop(); this.prio.pop();
      let i = 0; const n = this.items.length;
      while (true) {
        let l = i * 2 + 1, r = l + 1, sm = i;
        if (l < n && this.prio[l] < this.prio[sm]) sm = l;
        if (r < n && this.prio[r] < this.prio[sm]) sm = r;
        if (sm === i) break;
        this._swap(i, sm); i = sm;
      }
      return top;
    },
    _swap(a, b) {
      const ti = this.items[a]; this.items[a] = this.items[b]; this.items[b] = ti;
      const tp = this.prio[a]; this.prio[a] = this.prio[b]; this.prio[b] = tp;
    },
  };

  /* --------------------------- Generation ------------------------------- */
  const MapGen = {
    generate(loc) {
      const seed = (Math.random() * 1e9) | 0;
      const rng = G.RNG(seed);
      const W = loc.gridW, H = loc.gridH, T = Config.TILE;
      const grid = new Uint8Array(W * H).fill(1);
      const shade = new Uint8Array(W * H);
      const idx = (x, y) => y * W + x;
      const rooms = [];

      const carveRect = (x, y, w, h) => {
        for (let j = y; j < y + h; j++)
          for (let i = x; i < x + w; i++)
            if (i > 0 && j > 0 && i < W - 1 && j < H - 1) grid[idx(i, j)] = 0;
      };

      const [rmin, rmax] = loc.rooms;
      const targetRooms = rng.int(rmin, rmax);
      let attempts = 0;
      while (rooms.length < targetRooms && attempts < targetRooms * 14) {
        attempts++;
        const rw = rng.int(5, 12), rh = rng.int(5, 12);
        const rx = rng.int(2, W - rw - 2), ry = rng.int(2, H - rh - 2);
        let ok = true;
        for (const r of rooms) {
          if (rx < r.x + r.w + 2 && rx + rw + 2 > r.x && ry < r.y + r.h + 2 && ry + rh + 2 > r.y) { ok = false; break; }
        }
        if (!ok) continue;
        carveRect(rx, ry, rw, rh);
        rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: (rx + rw / 2) | 0, cy: (ry + rh / 2) | 0 });
      }

      const carveCorridor = (x0, y0, x1, y1) => {
        let x = x0, y = y0;
        const step = () => {
          for (let dy = 0; dy < 2; dy++)
            for (let dx = 0; dx < 2; dx++) {
              const i = x + dx, j = y + dy;
              if (i > 0 && j > 0 && i < W - 1 && j < H - 1) grid[idx(i, j)] = 0;
            }
        };
        if (rng.chance(0.5)) {
          while (x !== x1) { x += x < x1 ? 1 : -1; step(); }
          while (y !== y1) { y += y < y1 ? 1 : -1; step(); }
        } else {
          while (y !== y1) { y += y < y1 ? 1 : -1; step(); }
          while (x !== x1) { x += x < x1 ? 1 : -1; step(); }
        }
      };
      for (let i = 1; i < rooms.length; i++) carveCorridor(rooms[i].cx, rooms[i].cy, rooms[i - 1].cx, rooms[i - 1].cy);
      const extra = Math.floor(rooms.length * 0.3);
      for (let i = 0; i < extra; i++) {
        const a = rng.choice(rooms), b = rng.choice(rooms);
        if (a !== b) carveCorridor(a.cx, a.cy, b.cx, b.cy);
      }

      // interior cover pillars in larger rooms
      for (const r of rooms) {
        if (r.w >= 7 && r.h >= 7) {
          const pillars = rng.int(1, 3);
          for (let p = 0; p < pillars; p++) {
            const px = rng.int(r.x + 2, r.x + r.w - 3);
            const py = rng.int(r.y + 2, r.y + r.h - 3);
            grid[idx(px, py)] = 1;
            if (rng.chance(0.5)) grid[idx(px + 1, py)] = 1;
            else if (rng.chance(0.5)) grid[idx(px, py + 1)] = 1;
          }
        }
      }

      // floor shade variation for texture
      for (let i = 0; i < grid.length; i++) if (grid[i] === 0) shade[i] = (rng() * 4) | 0;

      // sort rooms by distance from a chosen corner for spawn/extract logic
      const spawnRoom = rooms.reduce((best, r) =>
        (r.cx + r.cy < best.cx + best.cy ? r : best), rooms[0]);
      const playerCenter = map_tileCenter(spawnRoom.cx, spawnRoom.cy, T);

      // extracts: farthest 2-3 rooms from spawn
      const byFar = rooms.slice().sort((a, b) =>
        U.dist2(b.cx, b.cy, spawnRoom.cx, spawnRoom.cy) - U.dist2(a.cx, a.cy, spawnRoom.cx, spawnRoom.cy));
      const extractCount = Math.min(3, Math.max(2, Math.floor(rooms.length / 8)));
      const extractNames = ['North Vent', 'Drain Mouth', 'The Float', 'Tide Tunnel', 'The Wreck'];
      const extracts = [];
      const usedExtractRooms = [];
      for (let i = 0; i < extractCount && i < byFar.length; i++) {
        const r = byFar[i];
        usedExtractRooms.push(r);
        const c = map_tileCenter(r.cx, r.cy, T);
        extracts.push({ x: c.x, y: c.y, r: T * 1.4, name: extractNames[i % extractNames.length], tx: r.cx, ty: r.cy });
      }

      // Guarantee the player spawn and every extract zone sit on open floor —
      // the interior-pillar pass may otherwise have dropped a wall on a center.
      const clearArea = (tx, ty, rad) => {
        for (let dy = -rad; dy <= rad; dy++)
          for (let dx = -rad; dx <= rad; dx++) {
            const i = tx + dx, j = ty + dy;
            if (i > 0 && j > 0 && i < W - 1 && j < H - 1) grid[idx(i, j)] = 0;
          }
      };
      clearArea(spawnRoom.cx, spawnRoom.cy, 1);
      for (const ex of extracts) clearArea(ex.tx, ex.ty, 1);

      // build map object
      const map = {
        seed, w: W, h: H, tile: T, pxW: W * T, pxH: H * T,
        grid, shade, rooms, extracts, playerSpawn: playerCenter,
        color: loc.color, location: loc,
        containers: [], enemySpawns: [],
      };
      attachMapMethods(map);

      // ---- containers ----
      const containerTypes = [
        { type: 'crate', w: 5 }, { type: 'locker', w: 4 }, { type: 'medbox', w: 2 },
        { type: 'weaponrack', w: 2 }, { type: 'safe', w: 1.4 },
      ];
      const occupied = new Set();
      const placeAtRoom = (r, type) => {
        for (let tries = 0; tries < 12; tries++) {
          const tx = rng.int(r.x + 1, r.x + r.w - 2);
          const ty = rng.int(r.y + 1, r.y + r.h - 2);
          if (grid[idx(tx, ty)] !== 0) continue;
          if (occupied.has(ty * W + tx)) continue;
          occupied.add(ty * W + tx);
          const c = map_tileCenter(tx, ty, T);
          map.containers.push({
            id: U.uuid(), x: c.x, y: c.y, tx, ty, type,
            items: rollLoot(rng, type, loc.lootMul), searched: false, progress: 0,
          });
          return true;
        }
        return false;
      };
      for (const r of rooms) {
        if (usedExtractRooms.indexOf(r) >= 0 && rng.chance(0.5)) continue;
        const area = r.w * r.h;
        let count = U.clamp(Math.round(area / 26), 0, 4);
        if (r === spawnRoom) count = Math.min(count, 1);
        for (let c = 0; c < count; c++) {
          const t = U.weighted(containerTypes).type;
          placeAtRoom(r, t);
        }
      }

      // ---- enemy spawns ----
      const farRooms = rooms.filter(r => r !== spawnRoom);
      const tierCounts = loc.enemies;
      const addSpawns = (tier, n) => {
        for (let i = 0; i < n; i++) {
          const r = rng.choice(farRooms.length ? farRooms : rooms);
          for (let tries = 0; tries < 8; tries++) {
            const tx = rng.int(r.x + 1, r.x + r.w - 2);
            const ty = rng.int(r.y + 1, r.y + r.h - 2);
            if (grid[idx(tx, ty)] !== 0) continue;
            const c = map_tileCenter(tx, ty, T);
            // keep enemies away from immediate player spawn
            if (U.dist(c.x, c.y, playerCenter.x, playerCenter.y) < T * 8) continue;
            // keep extraction zones clear so extracting isn't a death trap
            let nearExtract = false;
            for (const ex of extracts) if (U.dist(c.x, c.y, ex.x, ex.y) < T * 4.5) { nearExtract = true; break; }
            if (nearExtract) continue;
            map.enemySpawns.push({ x: c.x, y: c.y, tier, room: r });
            break;
          }
        }
      };
      const rngCount = (range) => Array.isArray(range) ? rng.int(range[0], range[1]) : range;
      addSpawns('scav', rngCount(tierCounts.scav));
      addSpawns('raider', rngCount(tierCounts.raider));
      if (tierCounts.boss) {
        // boss in the biggest far room that isn't on top of the player spawn or an extract
        const sorted = farRooms.slice().sort((a, b) => b.w * b.h - a.w * a.h);
        const bossSafe = (r) => {
          const c = map_tileCenter(r.cx, r.cy, T);
          if (U.dist(c.x, c.y, playerCenter.x, playerCenter.y) < T * 8) return false;
          for (const ex of extracts) if (U.dist(c.x, c.y, ex.x, ex.y) < T * 4.5) return false;
          return true;
        };
        const bossRoom = sorted.find(bossSafe) || sorted[0];
        if (bossRoom) {
          const c = map_tileCenter(bossRoom.cx, bossRoom.cy, T);
          map.enemySpawns.push({ x: c.x, y: c.y, tier: 'boss', room: bossRoom });
        }
      }

      return map;
    },
  };

  function map_tileCenter(tx, ty, T) { return { x: tx * T + T / 2, y: ty * T + T / 2 }; }

  // Seeded loot roll
  function rollLoot(rng, key, mul) {
    const tb = G.LootTables[key];
    if (!tb) return [];
    const acc = {};
    let rolls = rng.int(tb.rolls[0], tb.rolls[1]);
    if (mul > 1 && rng.chance(Math.min(0.9, mul - 1))) rolls++;
    const wpick = (arr) => {
      let tot = 0; for (const e of arr) tot += e.w;
      let r = rng() * tot;
      for (const e of arr) { r -= e.w; if (r <= 0) return e; }
      return arr[arr.length - 1];
    };
    for (let i = 0; i < rolls; i++) {
      const e = wpick(tb.table);
      let n = rng.int(e.qty[0], e.qty[1]);
      const def = G.getItem(e.id);
      if (def && (def.type === 'valuable' || def.type === 'ammo') && mul > 1) {
        n = Math.max(1, Math.round(n * (0.8 + mul * 0.3)));
        if (def.stack) n = Math.min(n, def.stack);
      }
      acc[e.id] = (acc[e.id] || 0) + n;
    }
    return Object.keys(acc).map(id => ({ id, n: acc[id] }));
  }

  /* ---------------------------- Bullets --------------------------------- */
  function makeBullet(x, y, angle, speed, damage, owner, opts) {
    opts = opts || {};
    return {
      x, y, px: x, py: y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      damage, owner, // 'player' | 'enemy'
      life: opts.life || 1.2, range: opts.range || 600, traveled: 0,
      color: opts.color || (owner === 'player' ? '#ffe08a' : '#ff7b5a'),
      dead: false,
    };
  }
  // returns true if bullet should be removed (hit wall or expired). Entity hits handled by raid.
  function updateBullet(b, dt, map) {
    b.px = b.x; b.py = b.y;
    const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    const stepDist = Math.hypot(nx - b.x, ny - b.y);
    b.traveled += stepDist;
    b.x = nx; b.y = ny;
    b.life -= dt;
    if (b.life <= 0 || b.traveled > b.range) return true;
    if (map.solidAtPx(b.x, b.y)) return true;
    if (b.x < 0 || b.y < 0 || b.x > map.pxW || b.y > map.pxH) return true;
    return false;
  }

  G.MapGen = MapGen;
  G.makeBullet = makeBullet;
  G.updateBullet = updateBullet;

})();
