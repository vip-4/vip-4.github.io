// sprites/humanoid-sprites.js — procedurally draws the player/elder/merchant
// sprite sheets. One draw routine, palette-swapped per character, plus an
// optional weapon-overlay callback (currently just the sword).
// Each sheet has 4 directional rows (down, left, right, up) x 4 walk frames.

// ---------- Palette-swappable humanoid sprite builder ----------
function drawHumanoid(ctx, ox, oy, frame, dir, palette) {
  const bob = (frame === 1 || frame === 3) ? 1 : 0; // walk bounce
  const legOffset = frame % 2 === 0 ? 0 : (frame === 1 ? 2 : -2);
  const y = oy - bob;

  ctx.save();
  ctx.translate(ox, y);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(16, 30, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs (two small rectangles, offset for walk cycle)
  ctx.fillStyle = palette.pants;
  ctx.fillRect(10, 22 + Math.max(0, legOffset), 5, 7 - Math.max(0, legOffset));
  ctx.fillRect(17, 22 + Math.max(0, -legOffset), 5, 7 - Math.max(0, -legOffset));

  // boots
  ctx.fillStyle = palette.boots;
  ctx.fillRect(10, 27 + Math.max(0, legOffset), 5, 3);
  ctx.fillRect(17, 27 + Math.max(0, -legOffset), 5, 3);

  // torso
  ctx.fillStyle = palette.shirt;
  roundRect(ctx, 8, 12, 16, 12, 3);
  ctx.fill();

  // belt
  ctx.fillStyle = palette.belt;
  ctx.fillRect(8, 21, 16, 2);

  // arms (swing based on frame)
  const armSwing = frame === 1 ? -2 : frame === 3 ? 2 : 0;
  ctx.fillStyle = palette.shirt;
  if (dir !== 'left') ctx.fillRect(22, 13 + armSwing, 4, 9);
  if (dir !== 'right') ctx.fillRect(6, 13 - armSwing, 4, 9);
  ctx.fillStyle = palette.skin;
  if (dir !== 'left') ctx.fillRect(22, 20 + armSwing, 4, 3);
  if (dir !== 'right') ctx.fillRect(6, 20 - armSwing, 4, 3);

  // head
  ctx.fillStyle = palette.skin;
  roundRect(ctx, 9, 2, 14, 12, 4);
  ctx.fill();

  // hair
  ctx.fillStyle = palette.hair;
  if (dir === 'up') {
    roundRect(ctx, 9, 1, 14, 8, 4);
    ctx.fill();
  } else {
    roundRect(ctx, 8, 1, 16, 6, 4);
    ctx.fill();
    ctx.fillRect(8, 4, 3, 6);
    ctx.fillRect(21, 4, 3, 6);
  }

  // face (eyes) — only when facing down/left/right
  if (dir === 'down') {
    ctx.fillStyle = palette.eyes;
    ctx.fillRect(12, 8, 2, 2);
    ctx.fillRect(18, 8, 2, 2);
  } else if (dir === 'left') {
    ctx.fillStyle = palette.eyes;
    ctx.fillRect(11, 8, 2, 2);
  } else if (dir === 'right') {
    ctx.fillStyle = palette.eyes;
    ctx.fillRect(19, 8, 2, 2);
  }

  ctx.restore();
}

function buildHumanoidSheet(palette, weapon) {
  const FW = 32, FH = 34;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      drawHumanoid(ctx, 0, 0, frame, dir, palette);
      if (weapon) weapon(ctx, dir, frame);
      ctx.restore();
    }
  });
  return sheet;
}

function drawSword(ctx, dir, frame) {
  ctx.fillStyle = '#d8d4c8';
  ctx.strokeStyle = '#3c3428';
  ctx.lineWidth = 0.5;
  const swing = frame === 2 ? 4 : 0;
  ctx.save();
  if (dir === 'right' || dir === 'down') {
    ctx.translate(24 + swing, 14);
    ctx.rotate(0.5);
  } else if (dir === 'left') {
    ctx.translate(4 - swing, 14);
    ctx.rotate(-0.5);
  } else {
    ctx.translate(20, 6);
    ctx.rotate(-2.4);
  }
  ctx.fillRect(-1, -10, 2, 12);
  ctx.fillStyle = '#a8843c';
  ctx.fillRect(-2, 1, 4, 2);
  ctx.restore();
}

// ---------- Palettes ----------
const PAL_PLAYER = { skin:'#e8c39e', hair:'#5a3a22', shirt:'#3a6ea5', pants:'#2d4a3a', boots:'#4a3626', belt:'#6b4423', eyes:'#2c2c2a' };
const PAL_ELDER  = { skin:'#d9b48f', hair:'#c8c4b8', shirt:'#7a4a8a', pants:'#4a3a52', boots:'#3a2e28', belt:'#5a4438', eyes:'#2c2c2a' };
const PAL_MERCH  = { skin:'#c99a72', hair:'#2a2420', shirt:'#a5622d', pants:'#3a3226', boots:'#2a2420', belt:'#6b4423', eyes:'#2c2c2a' };
