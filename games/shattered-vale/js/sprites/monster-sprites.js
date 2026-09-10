// sprites/monster-sprites.js — procedural sprite-sheet builders for every
// enemy type. Slimes and the spider are single-row (no facing direction);
// everything else follows the 4-directional-row convention.

// ---------- Slime (blob monster) ----------
function buildSlimeSheet(baseColor, darkColor) {
  const FW = 32, FH = 28;
  const sheet = makeCanvas(FW * 4, FH * 1); // slimes don't need directions, just squash frames
  const ctx = sheet.getContext('2d');
  for (let f = 0; f < 4; f++) {
    ctx.save();
    ctx.translate(f * FW, 0);
    const squash = [0, 0.15, 0.3, 0.15][f];
    const w = 20 + squash * 10, h = 16 - squash * 8;
    const cx = 16, cy = 24 - h / 2;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(16, 25, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
    // body gradient-ish (two-tone flat, no actual gradient per style rules -> use two shapes)
    ctx.fillStyle = darkColor;
    ctx.beginPath(); ctx.ellipse(cx, cy + 1, w / 2, h / 2 + 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = baseColor;
    ctx.beginPath(); ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(cx - w / 5, cy - h / 4, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    // eyes
    ctx.fillStyle = '#1a1a18';
    ctx.fillRect(cx - 5, cy - 1, 3, 3);
    ctx.fillRect(cx + 2, cy - 1, 3, 3);
    ctx.restore();
  }
  return sheet;
}

// ---------- Goblin Boss ----------
function buildGoblinSheet() {
  const FW = 40, FH = 42;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const bob = (frame === 1 || frame === 3) ? 1 : 0;
      ctx.translate(0, -bob);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(20, 38, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      // legs
      ctx.fillStyle = '#3a2e1a';
      ctx.fillRect(12, 28, 7, 9);
      ctx.fillRect(21, 28, 7, 9);
      // body (armored)
      ctx.fillStyle = '#4a6b2f';
      roundRect(ctx, 8, 12, 24, 18, 4); ctx.fill();
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(8, 20, 24, 4); // armor strap
      // arms + crude axe
      ctx.fillStyle = '#3d5a26';
      ctx.fillRect(4, 14, 6, 12);
      ctx.fillRect(30, 14, 6, 12);
      ctx.fillStyle = '#8a8578';
      ctx.fillRect(33, 6, 3, 16);
      ctx.fillStyle = '#5a5648';
      ctx.beginPath();
      ctx.moveTo(36, 4); ctx.lineTo(44, 10); ctx.lineTo(36, 16); ctx.closePath();
      ctx.fill();
      // head
      ctx.fillStyle = '#5a7a3a';
      roundRect(ctx, 10, 0, 20, 16, 5); ctx.fill();
      // ears
      ctx.fillStyle = '#4a6b2f';
      ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(3, 4); ctx.lineTo(9, 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(30, 6); ctx.lineTo(37, 4); ctx.lineTo(31, 12); ctx.fill();
      // eyes
      ctx.fillStyle = '#e24b4a';
      if (dir !== 'up') {
        ctx.fillRect(14, 6, 3, 3);
        ctx.fillRect(23, 6, 3, 3);
      }
      // tusks
      ctx.fillStyle = '#e8e4d8';
      if (dir === 'down') {
        ctx.fillRect(13, 12, 2, 4);
        ctx.fillRect(25, 12, 2, 4);
      }
      ctx.restore();
    }
  });
  return sheet;
}

// ---------- Devil Boss ----------
function buildDevilSheet() {
  const FW = 40, FH = 42;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const bob = (frame === 1 || frame === 3) ? 1 : 0;
      ctx.translate(0, -bob);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(20, 38, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      // legs (dark hooved)
      ctx.fillStyle = '#1a1210';
      ctx.fillRect(12, 28, 7, 9);
      ctx.fillRect(21, 28, 7, 9);
      // tail
      ctx.strokeStyle = '#6b1414';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(20, 30);
      ctx.quadraticCurveTo(28, 34, 26, 40);
      ctx.stroke();
      ctx.fillStyle = '#6b1414';
      ctx.beginPath();
      ctx.moveTo(26, 40); ctx.lineTo(30, 38); ctx.lineTo(27, 43); ctx.closePath();
      ctx.fill();
      // body (dark red hide)
      ctx.fillStyle = '#7a1c1c';
      roundRect(ctx, 8, 12, 24, 18, 4); ctx.fill();
      ctx.fillStyle = '#2a1414';
      ctx.fillRect(8, 20, 24, 4); // chest strap
      // arms + trident
      ctx.fillStyle = '#671717';
      ctx.fillRect(4, 14, 6, 12);
      ctx.fillRect(30, 14, 6, 12);
      ctx.fillStyle = '#8a8578';
      ctx.fillRect(33, 2, 3, 20);
      ctx.beginPath();
      ctx.moveTo(31, 2); ctx.lineTo(33, -4); ctx.lineTo(35, 2); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(34.5, 2); ctx.lineTo(36.5, -5); ctx.lineTo(38.5, 2); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(38, 2); ctx.lineTo(40, -4); ctx.lineTo(42, 2); ctx.closePath(); ctx.fill();
      // head
      ctx.fillStyle = '#8a1f1f';
      roundRect(ctx, 10, 0, 20, 16, 5); ctx.fill();
      // horns
      ctx.fillStyle = '#2a2420';
      ctx.beginPath(); ctx.moveTo(11, 3); ctx.lineTo(4, -6); ctx.lineTo(13, 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(29, 3); ctx.lineTo(36, -6); ctx.lineTo(27, 2); ctx.closePath(); ctx.fill();
      // eyes (glowing)
      ctx.fillStyle = '#f4d43c';
      if (dir !== 'up') {
        ctx.fillRect(14, 6, 3, 3);
        ctx.fillRect(23, 6, 3, 3);
      }
      // fangs
      ctx.fillStyle = '#e8e4d8';
      if (dir === 'down') {
        ctx.fillRect(13, 12, 2, 4);
        ctx.fillRect(25, 12, 2, 4);
      }
      ctx.restore();
    }
  });
  return sheet;
}

// ---------- Orc Warlord Boss (Jungle) ----------
function buildOrcSheet() {
  const FW = 40, FH = 42;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const bob = (frame === 1 || frame === 3) ? 1 : 0;
      ctx.translate(0, -bob);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(20, 38, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      // legs
      ctx.fillStyle = '#241a10';
      ctx.fillRect(12, 28, 7, 9);
      ctx.fillRect(21, 28, 7, 9);
      // body (mossy hide armor)
      ctx.fillStyle = '#3a5a2a';
      roundRect(ctx, 8, 12, 24, 18, 4); ctx.fill();
      ctx.fillStyle = '#5a4a2e';
      ctx.fillRect(8, 20, 24, 4); // strap
      // vine wraps
      ctx.strokeStyle = '#2e6b2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(9, 14); ctx.quadraticCurveTo(20, 18, 31, 14);
      ctx.stroke();
      // arms + club
      ctx.fillStyle = '#33502a';
      ctx.fillRect(4, 14, 6, 12);
      ctx.fillRect(30, 14, 6, 12);
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(33, 8, 4, 15);
      ctx.fillStyle = '#4a3818';
      ctx.beginPath();
      ctx.ellipse(35, 6, 6, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a8578';
      ctx.beginPath(); ctx.arc(32, 4, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(37, 8, 1.6, 0, Math.PI * 2); ctx.fill();
      // head
      ctx.fillStyle = '#4a6b38';
      roundRect(ctx, 10, 0, 20, 16, 5); ctx.fill();
      // ears
      ctx.fillStyle = '#3a5a2a';
      ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(2, 3); ctx.lineTo(9, 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(30, 6); ctx.lineTo(38, 3); ctx.lineTo(31, 12); ctx.fill();
      // eyes
      ctx.fillStyle = '#e8d43c';
      if (dir !== 'up') {
        ctx.fillRect(14, 6, 3, 3);
        ctx.fillRect(23, 6, 3, 3);
      }
      // tusks
      ctx.fillStyle = '#e8e4d8';
      if (dir === 'down') {
        ctx.fillRect(13, 12, 2, 4);
        ctx.fillRect(25, 12, 2, 4);
      }
      // war paint stripe
      ctx.fillStyle = '#c94040';
      if (dir === 'down') ctx.fillRect(15, 4, 10, 2);
      ctx.restore();
    }
  });
  return sheet;
}

// ---------- Jungle Witch Boss ----------
function buildWitchSheet() {
  const FW = 40, FH = 42;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const bob = (frame === 1 || frame === 3) ? 1 : 0;
      ctx.translate(0, -bob);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(20, 38, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
      // robe (flares at bottom, no separate legs)
      ctx.fillStyle = '#3a2a4a';
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(26, 14);
      ctx.lineTo(32, 38);
      ctx.lineTo(8, 38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4a3560';
      ctx.beginPath();
      ctx.moveTo(16, 20);
      ctx.lineTo(24, 20);
      ctx.lineTo(27, 34);
      ctx.lineTo(13, 34);
      ctx.closePath();
      ctx.fill();
      // trim glow
      ctx.strokeStyle = '#8a5ec9';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(9, 37); ctx.lineTo(31, 37); ctx.stroke();
      // arms + staff
      ctx.fillStyle = '#332246';
      ctx.fillRect(4, 15, 6, 11);
      ctx.fillRect(30, 15, 6, 11);
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(33, 4, 3, 20);
      ctx.fillStyle = '#3fd4a8';
      ctx.beginPath(); ctx.arc(34, 3, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(63,212,168,0.4)';
      ctx.beginPath(); ctx.arc(34, 3, 7, 0, Math.PI * 2); ctx.fill();
      // head
      ctx.fillStyle = '#c9a882';
      roundRect(ctx, 11, 1, 18, 14, 5); ctx.fill();
      // hood
      ctx.fillStyle = '#2e2040';
      ctx.beginPath();
      ctx.moveTo(9, 6);
      ctx.quadraticCurveTo(20, -6, 31, 6);
      ctx.quadraticCurveTo(31, 14, 26, 15);
      ctx.lineTo(14, 15);
      ctx.quadraticCurveTo(9, 14, 9, 6);
      ctx.closePath();
      ctx.fill();
      // eyes (glowing)
      ctx.fillStyle = '#3fd4a8';
      if (dir !== 'up') {
        ctx.fillRect(15, 8, 3, 3);
        ctx.fillRect(22, 8, 3, 3);
      }
      ctx.restore();
    }
  });
  return sheet;
}

// ---------- Spider (crypt crawler) ----------
function buildSpiderSheet() {
  const FW = 32, FH = 28;
  const sheet = makeCanvas(FW * 4, FH * 1); // no directions, just leg-scuttle frames
  const ctx = sheet.getContext('2d');
  for (let f = 0; f < 4; f++) {
    ctx.save();
    ctx.translate(f * FW, 0);
    const legSpread = [0, 2, 0, -2][f];
    const cx = 16, cy = 16;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, 25, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
    // legs (4 per side, scuttle animated)
    ctx.strokeStyle = '#1a1410';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      const ly = cy - 5 + i * 3.5;
      ctx.beginPath();
      ctx.moveTo(cx - 6, ly);
      ctx.lineTo(cx - 14 - legSpread, ly - 3 + i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 6, ly);
      ctx.lineTo(cx + 14 + legSpread, ly - 3 + i);
      ctx.stroke();
    }
    // abdomen
    ctx.fillStyle = '#2a1f18';
    ctx.beginPath(); ctx.ellipse(cx + 3, cy + 3, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a2e1e';
    ctx.beginPath(); ctx.ellipse(cx + 2, cy + 1, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    // head/thorax
    ctx.fillStyle = '#241a14';
    ctx.beginPath(); ctx.ellipse(cx - 5, cy, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    // eyes (glowing cluster)
    ctx.fillStyle = '#c9403c';
    ctx.beginPath(); ctx.arc(cx - 8, cy - 1, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 8, cy + 2, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 6, cy - 3, 1, 0, Math.PI * 2); ctx.fill();
    // fangs
    ctx.fillStyle = '#e8e4d8';
    ctx.fillRect(cx - 10, cy + 2, 1.5, 3);
    ctx.fillRect(cx - 9, cy + 3, 1.5, 3);
    ctx.restore();
  }
  return sheet;
}

// ---------- Sand Scorpion (World 2 oasis, strong grunt) ----------
function buildSandScorpionSheet() {
  const FW = 36, FH = 30;
  const sheet = makeCanvas(FW * 4, FH * 1); // no directions, just leg-scuttle + tail-curl frames
  const ctx = sheet.getContext('2d');
  for (let f = 0; f < 4; f++) {
    ctx.save();
    ctx.translate(f * FW, 0);
    const legSpread = [0, 2, 0, -2][f];
    const tailCurl = [0, 1, 2, 1][f];
    const cx = 16, cy = 17;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx + 2, 27, 13, 3, 0, 0, Math.PI * 2); ctx.fill();
    // legs (4 per side, wider stance than the spider)
    ctx.strokeStyle = '#5a3a1e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const ly = cy - 4 + i * 3;
      ctx.beginPath();
      ctx.moveTo(cx - 5, ly);
      ctx.lineTo(cx - 15 - legSpread, ly - 2 + i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 5, ly);
      ctx.lineTo(cx + 15 + legSpread, ly - 2 + i);
      ctx.stroke();
    }
    // curled tail with stinger (rises up over the back)
    ctx.strokeStyle = '#a8763c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy);
    ctx.quadraticCurveTo(cx + 16, cy - 6 - tailCurl, cx + 14, cy - 14 - tailCurl);
    ctx.stroke();
    ctx.fillStyle = '#3a2412';
    ctx.beginPath();
    ctx.moveTo(cx + 14, cy - 14 - tailCurl);
    ctx.lineTo(cx + 17, cy - 19 - tailCurl);
    ctx.lineTo(cx + 12, cy - 16 - tailCurl);
    ctx.closePath();
    ctx.fill();
    // abdomen (segmented)
    ctx.fillStyle = '#c9985a';
    ctx.beginPath(); ctx.ellipse(cx + 2, cy + 2, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(90,58,30,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 3, cy + 2); ctx.lineTo(cx + 7, cy + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 2, cy - 2); ctx.lineTo(cx + 6, cy - 2); ctx.stroke();
    // head/thorax
    ctx.fillStyle = '#a8763c';
    ctx.beginPath(); ctx.ellipse(cx - 6, cy, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    // pincers (front claws)
    ctx.fillStyle = '#c9985a';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 3); ctx.lineTo(cx - 17, cy - 7); ctx.lineTo(cx - 15, cy - 2);
    ctx.lineTo(cx - 18, cy - 1); ctx.lineTo(cx - 11, cy + 1);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 3); ctx.lineTo(cx - 17, cy + 7); ctx.lineTo(cx - 15, cy + 2);
    ctx.lineTo(cx - 18, cy + 1); ctx.lineTo(cx - 11, cy - 1);
    ctx.closePath(); ctx.fill();
    // eyes
    ctx.fillStyle = '#e8975a';
    ctx.beginPath(); ctx.arc(cx - 8, cy - 2, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 8, cy + 2, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  return sheet;
}

// ---------- Skeleton (crypt warrior) ----------
function buildSkeletonSheet() {
  const FW = 32, FH = 34;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const legOffset = frame % 2 === 0 ? 0 : (frame === 1 ? 2 : -2);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(16, 30, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
      // leg bones
      ctx.strokeStyle = '#d8d2c0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, 22 + Math.max(0, legOffset)); ctx.lineTo(12, 29);
      ctx.moveTo(20, 22 + Math.max(0, -legOffset)); ctx.lineTo(20, 29);
      ctx.stroke();
      // ribcage / torso
      ctx.fillStyle = '#e8e2d0';
      roundRect(ctx, 9, 11, 14, 11, 3); ctx.fill();
      ctx.strokeStyle = '#a8a290';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(9, 14 + i * 3); ctx.lineTo(23, 14 + i * 3);
        ctx.stroke();
      }
      // arm bones (swing)
      const armSwing = frame === 1 ? -2 : frame === 3 ? 2 : 0;
      ctx.strokeStyle = '#d8d2c0';
      ctx.lineWidth = 2.5;
      if (dir !== 'left') { ctx.beginPath(); ctx.moveTo(23, 13 + armSwing); ctx.lineTo(26, 21 + armSwing); ctx.stroke(); }
      if (dir !== 'right') { ctx.beginPath(); ctx.moveTo(9, 13 - armSwing); ctx.lineTo(6, 21 - armSwing); ctx.stroke(); }
      // rusty short-sword prop (down/right facing)
      if (dir === 'down' || dir === 'right') {
        ctx.fillStyle = '#8a8072';
        ctx.fillRect(25, 8 + armSwing, 2, 12);
      }
      // skull
      ctx.fillStyle = '#eee8d8';
      roundRect(ctx, 9, 1, 14, 11, 4); ctx.fill();
      // eye sockets (glowing embers)
      ctx.fillStyle = '#1a1410';
      if (dir !== 'up') {
        ctx.fillRect(11, 6, 3, 3);
        ctx.fillRect(18, 6, 3, 3);
      }
      ctx.fillStyle = '#e8975a';
      if (dir !== 'up') {
        ctx.fillRect(11.5, 6.5, 2, 2);
        ctx.fillRect(18.5, 6.5, 2, 2);
      }
      // jaw
      if (dir === 'down') {
        ctx.strokeStyle = '#a8a290';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(11, 11); ctx.lineTo(21, 11); ctx.stroke();
      }
      ctx.restore();
    }
  });
  return sheet;
}

// ---------- Skeleton King Boss (2x size, crypt throne room) ----------
function buildSkeletonKingSheet() {
  // Double the standard boss frame size (goblin/orc/witch/devil are 40x42)
  const FW = 80, FH = 84;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      ctx.scale(2, 2); // reuse the 40x42 layout logic, doubled on canvas
      const bob = (frame === 1 || frame === 3) ? 1 : 0;
      ctx.translate(0, -bob);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(20, 38, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      // leg bones (thick)
      ctx.strokeStyle = '#e8e2d0';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(14, 26); ctx.lineTo(14, 37);
      ctx.moveTo(26, 26); ctx.lineTo(26, 37);
      ctx.stroke();
      // tattered royal cloak
      ctx.fillStyle = '#3a1830';
      ctx.beginPath();
      ctx.moveTo(9, 13); ctx.lineTo(31, 13);
      ctx.lineTo(34, 36); ctx.lineTo(28, 30);
      ctx.lineTo(24, 37); ctx.lineTo(20, 29);
      ctx.lineTo(16, 37); ctx.lineTo(12, 30);
      ctx.lineTo(6, 36);
      ctx.closePath();
      ctx.fill();
      // ribcage / torso armor
      ctx.fillStyle = '#eee8d8';
      roundRect(ctx, 9, 11, 22, 17, 4); ctx.fill();
      ctx.strokeStyle = '#a8a290';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(9, 14 + i * 3.4); ctx.lineTo(31, 14 + i * 3.4);
        ctx.stroke();
      }
      // arm bones + massive bone greatsword
      const armSwing = frame === 1 ? -2 : frame === 3 ? 2 : 0;
      ctx.strokeStyle = '#e8e2d0';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(31, 14 + armSwing); ctx.lineTo(36, 26 + armSwing); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, 14 - armSwing); ctx.lineTo(4, 26 - armSwing); ctx.stroke();
      ctx.fillStyle = '#cfc8b4';
      ctx.fillRect(35, 2, 4, 26);
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(32, 25, 10, 3);
      // skull
      ctx.fillStyle = '#f2ecd8';
      roundRect(ctx, 11, -1, 18, 15, 5); ctx.fill();
      // crown
      ctx.fillStyle = '#c8a83c';
      ctx.beginPath();
      ctx.moveTo(11, 0); ctx.lineTo(13, -6); ctx.lineTo(16, 0);
      ctx.lineTo(18, -7); ctx.lineTo(20, 0);
      ctx.lineTo(22, -7); ctx.lineTo(24, 0);
      ctx.lineTo(27, -6); ctx.lineTo(29, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8a5ec9';
      ctx.beginPath(); ctx.arc(20, -5, 1.6, 0, Math.PI * 2); ctx.fill();
      // eye sockets (burning)
      ctx.fillStyle = '#1a1410';
      if (dir !== 'up') {
        ctx.fillRect(13.5, 5, 4, 4);
        ctx.fillRect(22.5, 5, 4, 4);
      }
      ctx.fillStyle = '#f4d43c';
      if (dir !== 'up') {
        ctx.fillRect(14.2, 5.7, 2.6, 2.6);
        ctx.fillRect(23.2, 5.7, 2.6, 2.6);
      }
      // jaw
      if (dir === 'down') {
        ctx.strokeStyle = '#a8a290';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(13, 11); ctx.lineTo(27, 11); ctx.stroke();
      }
      ctx.restore();
    }
  });
  return sheet;
}
