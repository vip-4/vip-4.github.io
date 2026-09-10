// world/tilemap-renderer.js — draws one tile (or one decoration) at a time
// onto the baked static canvas. Split out from tilemap-builder.js (which
// decides *what* tile goes where) so "what does a tile look like" and
// "where do tiles go" can be read independently.

// =========================
// TILE RENDERER
// =========================
function drawGroundTile(ctx, map, x, y) {
  const px = x * TILE;
  const py = y * TILE;

  const t = map.get(x, y);
  const h = hashTile(x, y);

  // =========================
  // GRASS
  // =========================
  if (t === TileType.GRASS || t === TileType.FLOWER || t === TileType.TALLGRASS) {
    ctx.fillStyle = h > 0.5 ? '#3a6b3d' : '#356339';
    ctx.fillRect(px, py, TILE, TILE);

    // small grass texture
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 3; i++) {
      const bx = px + ((hashTile(x * 7 + i, y * 3) * TILE) | 0);
      const by = py + ((hashTile(x * 2, y * 9 + i) * TILE) | 0);
      ctx.fillRect(bx, by, 2, 5);
    }
  }

  // =========================
  // PATH
  // =========================
  else if (t === TileType.PATH) {
    ctx.fillStyle = '#8a7050';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = h > 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(px + ((h * 20) | 0), py + ((hashTile(x, y + 1) * 20) | 0), 6, 4);
    edgeBlend(ctx, map, x, y, px, py, TileType.PATH, '#3a6b3d');
  }

  // =========================
  // JUNGLE GROUND
  // =========================
  else if (t === TileType.JUNGLE) {
    ctx.fillStyle = h > 0.5 ? '#1e4020' : '#193619';
    ctx.fillRect(px, py, TILE, TILE);

    // dense undergrowth texture (darker + denser than plain grass)
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(px + ((h * 20) | 0), py + ((hashTile(x, y + 1) * 20) | 0), 7, 5);

    ctx.fillStyle = 'rgba(120,220,120,0.05)';
    for (let i = 0; i < 3; i++) {
      const bx = px + ((hashTile(x * 5 + i, y * 4) * TILE) | 0);
      const by = py + ((hashTile(x * 3, y * 6 + i) * TILE) | 0);
      ctx.fillRect(bx, by, 2, 5);
    }

    edgeBlend(ctx, map, x, y, px, py, TileType.JUNGLE, '#193619');
  }

  // =========================
  // CRYPT GROUND (Skeleton Dungeon)
  // =========================
  else if (t === TileType.CRYPT) {
    ctx.fillStyle = h > 0.5 ? '#6b5237' : '#5b442d';
    ctx.fillRect(px, py, TILE, TILE);

    // subtle dirt variation
    ctx.fillStyle = 'rgba(80,55,30,0.12)';
    ctx.fillRect(px + ((h * 18) | 0), py + ((hashTile(x, y + 1) * 18) | 0), 8, 6);

    // tiny pebbles
    ctx.fillStyle = 'rgba(150,120,80,0.10)';
    for (let i = 0; i < 3; i++) {
      const bx = px + ((hashTile(x * 7 + i, y * 5) * TILE) | 0);
      const by = py + ((hashTile(x * 4, y * 9 + i) * TILE) | 0);
      ctx.fillRect(bx, by, 2, 2);
    }

    edgeBlend(ctx, map, x, y, px, py, TileType.CRYPT, '#5b442d');

    ctx.fillRect(px, py, TILE, TILE);

    // flagstone seams
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 16);
    ctx.lineTo(px + TILE, py + 16);
    const seamOffset = (x % 2) * 10;
    ctx.moveTo(px + 6 + seamOffset, py);
    ctx.lineTo(px + 6 + seamOffset, py + 16);
    ctx.stroke();

    // faint bone/ash scatter
    ctx.fillStyle = 'rgba(200,195,180,0.06)';
    ctx.fillRect(px + ((h * 20) | 0), py + ((hashTile(x, y + 1) * 20) | 0), 6, 3);

    edgeBlend(ctx, map, x, y, px, py, TileType.CRYPT, '#193619');
  }

  // =========================
  // OBSIDIAN GROUND (Molten Depths)
  // =========================
  else if (t === TileType.OBSIDIAN) {
    ctx.fillStyle = h > 0.5 ? '#241f22' : '#1c181a';
    ctx.fillRect(px, py, TILE, TILE);

    // glassy volcanic-rock fracture lines
    ctx.strokeStyle = 'rgba(80,40,30,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + ((hashTile(x, y) * 20) | 0));
    ctx.lineTo(px + TILE, py + ((hashTile(x + 1, y + 2) * 20) | 0));
    ctx.stroke();

    // faint ember specks
    ctx.fillStyle = 'rgba(255,120,40,0.08)';
    for (let i = 0; i < 2; i++) {
      const bx = px + ((hashTile(x * 6 + i, y * 4) * TILE) | 0);
      const by = py + ((hashTile(x * 3, y * 8 + i) * TILE) | 0);
      ctx.fillRect(bx, by, 2, 2);
    }
  }

  // =========================
  // LAVA (walkable hazard)
  // =========================
  else if (t === TileType.LAVA) {
    ctx.fillStyle = '#4a1608';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#c9430f';
    ctx.fillRect(px, py + ((h * 8) | 0), TILE, 6);
    ctx.fillStyle = 'rgba(255,200,60,0.25)';
    ctx.fillRect(px + 6, py + 12, 9, 3);
    // NOTE: the flickering glow overlay is drawn per-frame in
    // TileMap.drawAnimated, not baked here, so it can pulse.
  }

  // =========================
  // SAND
  // =========================
  else if (t === TileType.SAND) {
    ctx.fillStyle = '#eadeb6';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = 'rgba(150,120,70,0.12)';
    ctx.fillRect(px + 5, py + 7, 5, 3);
    if (h > 0.6) {
      ctx.fillRect(px + ((h * 20) | 0), py + ((h * 15) | 0), 3, 3);
    }
    edgeBlend(ctx, map, x, y, px, py, TileType.SAND, '#3a6b3d');
  }

  // =========================
  // WATER
  // =========================
  else if (t === TileType.WATER) {
    ctx.fillStyle = '#2a5578';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#336490';
    ctx.fillRect(px, py + ((h * 10) | 0), TILE, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(px + 4, py + 10, 10, 2);
    edgeBlend(ctx, map, x, y, px, py, TileType.WATER, '#eadeb6');
  }

  // =========================
  // BRIDGE
  // =========================
  else if (t === TileType.BRIDGE) {
    ctx.fillStyle = '#2a5578';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#8a6438';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(px, py + i * 8, TILE, 5);
    }
    ctx.fillStyle = '#5a4020';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(px, py + i * 8 + 5, TILE, 1);
    }
  }

  // =========================
  // NORMAL GATE
  // =========================
  else if (
    t === TileType.GATE ||
    t === TileType.WORLD_TWO_GATE ||
    t === TileType.JUNGLE_GATE ||
    t === TileType.SKELETON_GATE ||
    t === TileType.LAVA_GATE ||
    t === TileType.PIT_GATE
  ) {
    ctx.fillStyle =
      t === TileType.LAVA_GATE || t === TileType.PIT_GATE ? '#3a1810' :
      t === TileType.SKELETON_GATE ? '#2a2620' :
      t === TileType.JUNGLE_GATE ? '#3a3a1e' :
      '#4a3626';
    ctx.fillRect(px, py, TILE, TILE);

    ctx.fillStyle =
      t === TileType.LAVA_GATE || t === TileType.PIT_GATE ? '#180a06' :
      t === TileType.SKELETON_GATE ? '#141210' :
      t === TileType.JUNGLE_GATE ? '#1e2210' :
      '#2a1e15';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(px + i * 8, py, 4, TILE);
    }

    ctx.fillStyle =
      t === TileType.LAVA_GATE || t === TileType.PIT_GATE ? 'rgba(255,110,40,0.4)' :
      t === TileType.SKELETON_GATE ? 'rgba(232,151,90,0.35)' :
      t === TileType.JUNGLE_GATE ? 'rgba(120,230,140,0.35)' :
      'rgba(255,210,80,0.35)';
    ctx.fillRect(px + 12, py + 12, 8, 8);
  }

  // =========================
  // TREE BASE
  // =========================
  else if (t === TileType.TREE) {
    ctx.fillStyle = h > 0.5 ? '#3a6b3d' : '#356339';
    ctx.fillRect(px, py, TILE, TILE);
  }

  // =========================
  // CASTLE WALL
  // =========================
  else if (t === TileType.WALL) {
    const stone = h > 0.66 ? '#8d8b82' : h > 0.33 ? '#7d7c73' : '#72736b';
    ctx.fillStyle = stone;
    ctx.fillRect(px, py, TILE, TILE);

    ctx.strokeStyle = 'rgba(40,40,35,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 10);
    ctx.lineTo(px + TILE, py + 10);
    ctx.moveTo(px, py + 22);
    ctx.lineTo(px + TILE, py + 22);
    const offset = (y % 2) * 8;
    ctx.moveTo(px + 8 + offset, py);
    ctx.lineTo(px + 8 + offset, py + 10);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(px + 3, py + 3, TILE - 6, 2);
  }

  // =========================
  // JUNGLE WALL (mossy ruin stone)
  // =========================
  else if (t === TileType.JUNGLE_WALL) {
    const stone = h > 0.66 ? '#5a6a52' : h > 0.33 ? '#4e5c47' : '#454f3f';
    ctx.fillStyle = stone;
    ctx.fillRect(px, py, TILE, TILE);

    ctx.strokeStyle = 'rgba(20,30,15,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 10);
    ctx.lineTo(px + TILE, py + 10);
    ctx.moveTo(px, py + 22);
    ctx.lineTo(px + TILE, py + 22);
    const offset = (y % 2) * 8;
    ctx.moveTo(px + 8 + offset, py);
    ctx.lineTo(px + 8 + offset, py + 10);
    ctx.stroke();

    // moss patches
    ctx.fillStyle = 'rgba(70,140,60,0.3)';
    ctx.fillRect(px + 2, py + 12, 8, 5);
    ctx.fillRect(px + 18, py + 24, 9, 4);

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(px + 3, py + 3, TILE - 6, 2);
  }

  // =========================
  // CRYPT WALL (dungeon stone, ash-streaked)
  // =========================
  else if (t === TileType.CRYPT_WALL) {
    const stone = h > 0.66 ? '#3a3630' : h > 0.33 ? '#302c27' : '#282520';
    ctx.fillStyle = stone;
    ctx.fillRect(px, py, TILE, TILE);

    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 10);
    ctx.lineTo(px + TILE, py + 10);
    ctx.moveTo(px, py + 22);
    ctx.lineTo(px + TILE, py + 22);
    const offset = (y % 2) * 8;
    ctx.moveTo(px + 8 + offset, py);
    ctx.lineTo(px + 8 + offset, py + 10);
    ctx.stroke();

    // ash streaks
    ctx.fillStyle = 'rgba(120,110,95,0.15)';
    ctx.fillRect(px + 2, py + 12, 8, 5);
    ctx.fillRect(px + 18, py + 24, 9, 4);

    // faint ember glow crack
    ctx.fillStyle = 'rgba(232,151,90,0.08)';
    ctx.fillRect(px + 3, py + 3, TILE - 6, 2);
  }

  // =========================
  // OBSIDIAN WALL (Molten Depths, glassy volcanic rock)
  // =========================
  else if (t === TileType.OBSIDIAN_WALL) {
    const stone = h > 0.66 ? '#221c1e' : h > 0.33 ? '#1a1516' : '#141112';
    ctx.fillStyle = stone;
    ctx.fillRect(px, py, TILE, TILE);

    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 10);
    ctx.lineTo(px + TILE, py + 10);
    ctx.moveTo(px, py + 22);
    ctx.lineTo(px + TILE, py + 22);
    const offset = (y % 2) * 8;
    ctx.moveTo(px + 8 + offset, py);
    ctx.lineTo(px + 8 + offset, py + 10);
    ctx.stroke();

    // molten cracks running through the rock
    ctx.strokeStyle = 'rgba(255,110,40,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 26);
    ctx.lineTo(px + 12, py + 18);
    ctx.lineTo(px + 20, py + 24);
    ctx.stroke();

    // glassy highlight
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(px + 3, py + 3, TILE - 6, 2);
  }

  // =========================
  // TREE CANOPY OVERLAY
  // =========================
  if (t === TileType.TREE) {
    ctx.save();
    ctx.translate(px + 16, py + 16);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(2, 14, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // trunk
    ctx.fillStyle = '#4a3626';
    ctx.fillRect(-3, 2, 6, 14);

    // main crown
    ctx.fillStyle = h > 0.5 ? '#2d5a2a' : '#255022';
    ctx.beginPath();
    ctx.arc(0, -4, 15, 0, Math.PI * 2);
    ctx.fill();

    // extra leaves
    ctx.fillStyle = h > 0.5 ? '#3a6e34' : '#316232';
    ctx.beginPath();
    ctx.arc(-5, -9, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -6, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// =========================
// TERRAIN EDGE BLENDING
// =========================
function edgeBlend(ctx, map, x, y, px, py, selfType, grassColor) {
  const n = map.get(x, y - 1);
  const s = map.get(x, y + 1);
  const w = map.get(x - 1, y);
  const e = map.get(x + 1, y);

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  if (n === TileType.GRASS) ctx.fillRect(px, py, TILE, 3);
  if (s === TileType.GRASS) ctx.fillRect(px, py + TILE - 3, TILE, 3);
  if (w === TileType.GRASS) ctx.fillRect(px, py, 3, TILE);
  if (e === TileType.GRASS) ctx.fillRect(px + TILE - 3, py, 3, TILE);
}

// =========================
// DECORATION DRAWING
// =========================
function drawDecor(ctx, d) {
  const px = d.x * TILE;
  const py = d.y * TILE;

  if (d.type === 'flower') {
    const colors = ['#e8c93c', '#e85a5a', '#c85ae8'];
    ctx.fillStyle = '#2d5a2a';
    ctx.fillRect(px + 15, py + 18, 2, 8);
    ctx.fillStyle = colors[d.variant];
    [[13, 14], [19, 14], [16, 11], [16, 17]].forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(px + ox, py + oy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#e8c93c';
    ctx.beginPath();
    ctx.arc(px + 16, py + 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.type === 'grasstuft') {
    ctx.fillStyle = '#2d5a2a';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(px + 10 + i * 4, py + 26);
      ctx.quadraticCurveTo(px + 10 + i * 4 + (i % 2 ? 3 : -3), py + 16, px + 12 + i * 4, py + 14);
      ctx.quadraticCurveTo(px + 10 + i * 4, py + 20, px + 10 + i * 4, py + 26);
      ctx.fill();
    }
  } else if (d.type === 'rock') {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 24, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b6558';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 20, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a8578';
    ctx.beginPath();
    ctx.ellipse(px + 14, py + 18, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // BEACH DECORATIONS
  else if (d.type === 'shells') {
    ctx.fillStyle = '#f5ebd0';
    ctx.beginPath();
    ctx.arc(px + 14, py + 18, 3, 0, Math.PI, true);
    ctx.fill();
  } else if (d.type === 'starfish') {
    ctx.fillStyle = '#f28d53';
    ctx.fillRect(px + 14, py + 14, 5, 5);
  } else if (d.type === 'palm') {
    // trunk
    ctx.fillStyle = '#8c613c';
    ctx.fillRect(px + 14, py + 10, 4, 16);
    // leaves
    ctx.fillStyle = '#448c3c';
    ctx.beginPath();
    ctx.arc(px + 16, py + 10, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // JUNGLE DECORATIONS
  else if (d.type === 'fern') {
    ctx.fillStyle = '#245a2a';
    for (let i = 0; i < 5; i++) {
      const ang = -0.6 + i * 0.3;
      ctx.beginPath();
      ctx.moveTo(px + 16, py + 26);
      ctx.quadraticCurveTo(px + 16 + Math.sin(ang) * 8, py + 16, px + 16 + Math.sin(ang) * 11, py + 10);
      ctx.quadraticCurveTo(px + 16 + Math.sin(ang) * 6, py + 18, px + 16, py + 26);
      ctx.fill();
    }
  } else if (d.type === 'vines') {
    ctx.strokeStyle = '#2e6b2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 8, py);
    ctx.quadraticCurveTo(px + 14, py + 14, px + 9, py + 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + 23, py);
    ctx.quadraticCurveTo(px + 18, py + 12, px + 24, py + 28);
    ctx.stroke();
    ctx.fillStyle = '#3a8a34';
    ctx.beginPath();
    ctx.ellipse(px + 9, py + 14, 2.5, 1.8, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + 24, py + 18, 2.5, 1.8, -0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.type === 'jungleflower') {
    const colors = ['#e85a9c', '#f2c53c'];
    ctx.fillStyle = '#245a2a';
    ctx.fillRect(px + 15, py + 18, 2, 8);
    ctx.fillStyle = colors[d.variant];
    [[13, 15], [19, 15], [16, 12], [16, 18]].forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(px + ox, py + oy, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#3fd4a8';
    ctx.beginPath();
    ctx.arc(px + 16, py + 15, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // CRYPT DECORATIONS
  else if (d.type === 'bones') {
    ctx.strokeStyle = '#d8d2c0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px + 11, py + 16);
    ctx.lineTo(px + 21, py + 22);
    ctx.moveTo(px + 21, py + 16);
    ctx.lineTo(px + 11, py + 22);
    ctx.stroke();
    ctx.fillStyle = '#e8e2d0';
    ctx.beginPath();
    ctx.arc(px + 16, py + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(px + 14, py + 11, 1.5, 1.5);
    ctx.fillRect(px + 17, py + 11, 1.5, 1.5);
  } else if (d.type === 'brazier') {
    ctx.fillStyle = '#2a2420';
    ctx.beginPath();
    ctx.moveTo(px + 12, py + 22);
    ctx.lineTo(px + 20, py + 22);
    ctx.lineTo(px + 18, py + 14);
    ctx.lineTo(px + 14, py + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(232,151,90,0.5)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 12, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(244,212,60,0.7)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 11, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.type === 'rubble') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 24, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a463e';
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 22);
    ctx.lineTo(px + 14, py + 16);
    ctx.lineTo(px + 20, py + 20);
    ctx.lineTo(px + 24, py + 15);
    ctx.lineTo(px + 22, py + 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5e5a50';
    ctx.beginPath();
    ctx.moveTo(px + 12, py + 20);
    ctx.lineTo(px + 16, py + 17);
    ctx.lineTo(px + 19, py + 20);
    ctx.closePath();
    ctx.fill();
  }

  // MOLTEN DEPTHS DECORATIONS
  else if (d.type === 'obsidianshard') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 25, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2226';
    ctx.beginPath();
    ctx.moveTo(px + 12, py + 24);
    ctx.lineTo(px + 16, py + 12);
    ctx.lineTo(px + 20, py + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,120,50,0.35)';
    ctx.beginPath();
    ctx.moveTo(px + 15, py + 22);
    ctx.lineTo(px + 16, py + 16);
    ctx.lineTo(px + 17, py + 22);
    ctx.closePath();
    ctx.fill();
  } else if (d.type === 'emberpile') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 23, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e211c';
    ctx.beginPath();
    ctx.arc(px + 16, py + 20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,140,40,0.6)';
    ctx.beginPath();
    ctx.arc(px + 14, py + 19, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 19, py + 21, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.type === 'skullpile') {
    ctx.fillStyle = '#c9c2b0';
    ctx.beginPath();
    ctx.arc(px + 13, py + 20, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 20, py + 22, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(px + 11.5, py + 19, 1.4, 1.4);
    ctx.fillRect(px + 14, py + 19, 1.4, 1.4);
    ctx.fillRect(px + 18.7, py + 21, 1.2, 1.2);
    ctx.fillRect(px + 21, py + 21, 1.2, 1.2);
  }
}
