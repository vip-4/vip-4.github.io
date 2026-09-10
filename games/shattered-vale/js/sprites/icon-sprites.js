// sprites/icon-sprites.js — small 24x24 procedural item icons, used both
// for the bobbing world pickup and the inventory backpack/equip grid.

function buildSwordIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.save();
  ctx.translate(12, 12);
  ctx.rotate(-0.78);
  ctx.fillStyle = '#dcd8cc';
  ctx.fillRect(-2, -10, 4, 16);
  ctx.fillStyle = '#8a8578';
  ctx.fillRect(-2, -10, 4, 3);
  ctx.fillStyle = '#a8843c';
  ctx.fillRect(-5, 5, 10, 3);
  ctx.fillStyle = '#5a4020';
  ctx.fillRect(-1.5, 8, 3, 6);
  ctx.restore();
  return c;
}
function buildPotionIcon(color) {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c8c4b8';
  ctx.fillRect(10, 3, 4, 4);
  ctx.fillStyle = color;
  roundRect(ctx, 6, 8, 12, 12, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(8, 10, 2, 6);
  ctx.strokeStyle = '#5a4020';
  ctx.lineWidth = 1;
  roundRect(ctx, 6, 8, 12, 12, 4); ctx.stroke();
  return c;
}
function buildCoinIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c8931a';
  ctx.beginPath(); ctx.arc(12, 12, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b83c';
  ctx.beginPath(); ctx.arc(11, 11, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c8931a';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$', 12, 15);
  return c;
}
function buildKeyIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.strokeStyle = '#d4b83c';
  ctx.fillStyle = '#d4b83c';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(9, 9, 4, 0, Math.PI * 2); ctx.stroke();
  ctx.fillRect(11, 9, 9, 2.5);
  ctx.fillRect(16, 11, 2.5, 4);
  ctx.fillRect(19, 11, 2.5, 3);
  return c;
}
function buildShieldIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a6a7a';
  ctx.beginPath();
  ctx.moveTo(12, 3); ctx.lineTo(20, 6); ctx.lineTo(20, 13);
  ctx.quadraticCurveTo(20, 19, 12, 22);
  ctx.quadraticCurveTo(4, 19, 4, 13);
  ctx.lineTo(4, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7a8a9a';
  ctx.beginPath();
  ctx.moveTo(12, 6); ctx.lineTo(17, 8); ctx.lineTo(17, 13);
  ctx.quadraticCurveTo(17, 16, 12, 18);
  ctx.quadraticCurveTo(7, 16, 7, 13);
  ctx.lineTo(7, 8); ctx.closePath(); ctx.fill();
  return c;
}
function buildArmorIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');

  // Outer armor
  ctx.fillStyle = '#5a6a7a';
  ctx.beginPath();
  ctx.moveTo(8, 3);
  ctx.lineTo(10, 5);
  ctx.lineTo(14, 5);
  ctx.lineTo(16, 3);
  ctx.lineTo(20, 7);
  ctx.lineTo(18, 20);
  ctx.lineTo(6, 20);
  ctx.lineTo(4, 7);
  ctx.closePath();
  ctx.fill();

  // Inner plate
  ctx.fillStyle = '#7a8a9a';
  ctx.beginPath();
  ctx.moveTo(9, 6);
  ctx.lineTo(11, 7);
  ctx.lineTo(13, 7);
  ctx.lineTo(15, 6);
  ctx.lineTo(17, 8);
  ctx.lineTo(16, 17);
  ctx.lineTo(8, 17);
  ctx.lineTo(7, 8);
  ctx.closePath();
  ctx.fill();

  // Center seam
  ctx.strokeStyle = '#4a5866';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(12, 7);
  ctx.lineTo(12, 17);
  ctx.stroke();

  return c;
}

function buildHelmetIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  // dome
  ctx.fillStyle = '#8a7a5a';
  ctx.beginPath();
  ctx.moveTo(4, 15);
  ctx.quadraticCurveTo(4, 4, 12, 4);
  ctx.quadraticCurveTo(20, 4, 20, 15);
  ctx.closePath();
  ctx.fill();
  // inner shading
  ctx.fillStyle = '#a89a72';
  ctx.beginPath();
  ctx.moveTo(7, 13);
  ctx.quadraticCurveTo(7, 6, 12, 6);
  ctx.quadraticCurveTo(17, 6, 17, 13);
  ctx.closePath();
  ctx.fill();
  // eye slit
  ctx.fillStyle = '#2a2420';
  ctx.fillRect(6, 14, 12, 2.5);
  // brim
  ctx.fillStyle = '#5a4e38';
  ctx.fillRect(3, 15, 18, 3);
  // small plume
  ctx.fillStyle = '#4a8a5a';
  ctx.beginPath();
  ctx.moveTo(12, 4); ctx.lineTo(9, -3); ctx.lineTo(15, -3); ctx.closePath();
  ctx.fill();
  return c;
}
function buildLegendarySwordIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.save();
  ctx.translate(12, 12);
  ctx.rotate(-0.78);
  // glow
  ctx.fillStyle = 'rgba(63,212,168,0.35)';
  ctx.beginPath(); ctx.ellipse(0, -2, 9, 13, 0, 0, Math.PI * 2); ctx.fill();
  // blade
  ctx.fillStyle = '#e8e4d8';
  ctx.fillRect(-2, -11, 4, 17);
  ctx.fillStyle = '#3fd4a8';
  ctx.fillRect(-0.7, -11, 1.4, 17);
  ctx.fillStyle = '#8a8578';
  ctx.fillRect(-2, -11, 4, 3);
  // crossguard
  ctx.fillStyle = '#c8a83c';
  ctx.fillRect(-6, 5, 12, 3);
  // hilt
  ctx.fillStyle = '#4a2e18';
  ctx.fillRect(-1.5, 8, 3, 7);
  ctx.fillStyle = '#3fd4a8';
  ctx.beginPath(); ctx.arc(0, 16, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return c;
}

function buildJungleArmorIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2e5a30';
  ctx.beginPath();
  ctx.moveTo(8, 3); ctx.lineTo(10, 5); ctx.lineTo(14, 5); ctx.lineTo(16, 3);
  ctx.lineTo(20, 7); ctx.lineTo(18, 20); ctx.lineTo(6, 20); ctx.lineTo(4, 7);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#48824a';
  ctx.beginPath();
  ctx.moveTo(9, 6); ctx.lineTo(11, 7); ctx.lineTo(13, 7); ctx.lineTo(15, 6);
  ctx.lineTo(17, 8); ctx.lineTo(16, 17); ctx.lineTo(8, 17); ctx.lineTo(7, 8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1e3a1e';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(12, 7); ctx.lineTo(12, 17); ctx.stroke();
  ctx.fillStyle = '#3fd4a8';
  ctx.fillRect(11, 9, 2, 2);
  return c;
}
function buildBootsIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a3626';
  ctx.fillRect(6, 3, 5, 11);
  ctx.fillRect(13, 3, 5, 11);
  ctx.fillStyle = '#3a2a1c';
  ctx.beginPath();
  ctx.moveTo(6, 14); ctx.lineTo(11, 14); ctx.lineTo(11, 17); ctx.lineTo(3, 17);
  ctx.quadraticCurveTo(3, 15, 6, 14); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(13, 14); ctx.lineTo(18, 14); ctx.lineTo(18, 17); ctx.lineTo(21, 17);
  ctx.quadraticCurveTo(21, 15, 18, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a6438';
  ctx.fillRect(6, 6, 5, 1.5);
  ctx.fillRect(13, 6, 5, 1.5);
  return c;
}

function buildBoneShieldIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#dcd6c4';
  ctx.beginPath();
  ctx.moveTo(12, 3); ctx.lineTo(20, 6); ctx.lineTo(20, 13);
  ctx.quadraticCurveTo(20, 19, 12, 22);
  ctx.quadraticCurveTo(4, 19, 4, 13);
  ctx.lineTo(4, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a8a290';
  ctx.beginPath();
  ctx.moveTo(12, 6); ctx.lineTo(17, 8); ctx.lineTo(17, 13);
  ctx.quadraticCurveTo(17, 16, 12, 18);
  ctx.quadraticCurveTo(7, 16, 7, 13);
  ctx.lineTo(7, 8); ctx.closePath(); ctx.fill();
  // crossed bones motif
  ctx.strokeStyle = '#e8e2d0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(9, 9); ctx.lineTo(15, 16);
  ctx.moveTo(15, 9); ctx.lineTo(9, 16);
  ctx.stroke();
  return c;
}
function buildSkeletonCrownIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c8a83c';
  ctx.beginPath();
  ctx.moveTo(4, 18); ctx.lineTo(4, 10);
  ctx.lineTo(8, 15); ctx.lineTo(12, 6);
  ctx.lineTo(16, 15); ctx.lineTo(20, 10);
  ctx.lineTo(20, 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8d478';
  ctx.fillRect(4, 16, 16, 3);
  ctx.fillStyle = '#8a5ec9';
  ctx.beginPath(); ctx.arc(12, 10, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, 13, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(18, 13, 1.2, 0, Math.PI * 2); ctx.fill();
  return c;
}

function buildObsidianArmorIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1c1618';
  ctx.beginPath();
  ctx.moveTo(8, 3); ctx.lineTo(10, 5); ctx.lineTo(14, 5); ctx.lineTo(16, 3);
  ctx.lineTo(20, 7); ctx.lineTo(18, 20); ctx.lineTo(6, 20); ctx.lineTo(4, 7);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2e2226';
  ctx.beginPath();
  ctx.moveTo(9, 6); ctx.lineTo(11, 7); ctx.lineTo(13, 7); ctx.lineTo(15, 6);
  ctx.lineTo(17, 8); ctx.lineTo(16, 17); ctx.lineTo(8, 17); ctx.lineTo(7, 8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,110,40,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(12, 7); ctx.lineTo(10, 12); ctx.lineTo(13, 15); ctx.lineTo(12, 17);
  ctx.stroke();
  return c;
}

function buildMoltenSwordIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.save();
  ctx.translate(12, 12);
  ctx.rotate(-0.78);
  ctx.fillStyle = 'rgba(255,110,40,0.4)';
  ctx.beginPath(); ctx.ellipse(0, -2, 9, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2020';
  ctx.fillRect(-2, -11, 4, 17);
  ctx.fillStyle = '#ff6a1e';
  ctx.fillRect(-0.7, -11, 1.4, 17);
  ctx.fillStyle = '#1a1414';
  ctx.fillRect(-2, -11, 4, 3);
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(-6, 5, 12, 3);
  ctx.fillStyle = '#241a12';
  ctx.fillRect(-1.5, 8, 3, 7);
  ctx.fillStyle = '#ff6a1e';
  ctx.beginPath(); ctx.arc(0, 16, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return c;
}

function buildFireproofBootsIcon() {
  const c = makeCanvas(24, 24);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a1c14';
  ctx.fillRect(6, 3, 5, 11);
  ctx.fillRect(13, 3, 5, 11);
  ctx.fillStyle = '#1a120c';
  ctx.beginPath();
  ctx.moveTo(6, 14); ctx.lineTo(11, 14); ctx.lineTo(11, 17); ctx.lineTo(3, 17);
  ctx.quadraticCurveTo(3, 15, 6, 14); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(13, 14); ctx.lineTo(18, 14); ctx.lineTo(18, 17); ctx.lineTo(21, 17);
  ctx.quadraticCurveTo(21, 15, 18, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,140,40,0.7)';
  ctx.fillRect(6, 6, 5, 1.5);
  ctx.fillRect(13, 6, 5, 1.5);
  ctx.fillStyle = 'rgba(255,180,60,0.55)';
  ctx.beginPath(); ctx.arc(8.5, 16, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(15.5, 16, 1.6, 0, Math.PI * 2); ctx.fill();
  return c;
}
