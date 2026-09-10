// sprites/molten-sprites.js — creatures of the Molten Depths (World 5,
// unlocked after the Skeleton King). Kept separate from monster-sprites.js
// so neither file balloons past a comfortable size — same builder pattern
// throughout (4 directional rows x 4 walk frames, ctx.translate per cell).

// ---------- Devil Lesser (grunt) ----------
function buildDevilLesserSheet() {
  const FW = 34, FH = 36;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const legOffset = frame % 2 === 0 ? 0 : (frame === 1 ? 2 : -2);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(17, 32, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      // legs (hooved)
      ctx.fillStyle = '#1a0f0c';
      ctx.fillRect(11, 24 + Math.max(0, legOffset), 5, 7);
      ctx.fillRect(18, 24 + Math.max(0, -legOffset), 5, 7);
      // torso
      ctx.fillStyle = '#8a2e1e';
      roundRect(ctx, 9, 13, 16, 13, 3); ctx.fill();
      ctx.fillStyle = '#5a1c12';
      ctx.fillRect(9, 21, 16, 2);
      // arms + claws
      const armSwing = frame === 1 ? -2 : frame === 3 ? 2 : 0;
      ctx.fillStyle = '#7a2818';
      if (dir !== 'left') ctx.fillRect(23, 14 + armSwing, 4, 9);
      if (dir !== 'right') ctx.fillRect(7, 14 - armSwing, 4, 9);
      ctx.fillStyle = '#2a1410';
      if (dir !== 'left') ctx.fillRect(23, 21 + armSwing, 4, 3);
      if (dir !== 'right') ctx.fillRect(7, 21 - armSwing, 4, 3);
      // small tail
      ctx.strokeStyle = '#5a1c12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(17, 25); ctx.quadraticCurveTo(23, 28, 21, 33);
      ctx.stroke();
      // head
      ctx.fillStyle = '#9c3a26';
      roundRect(ctx, 10, 3, 14, 12, 4); ctx.fill();
      // small horns
      ctx.fillStyle = '#2a2018';
      ctx.beginPath(); ctx.moveTo(11, 5); ctx.lineTo(7, 0); ctx.lineTo(13, 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(23, 5); ctx.lineTo(27, 0); ctx.lineTo(21, 3); ctx.fill();
      // eyes
      ctx.fillStyle = '#ffcf3c';
      if (dir !== 'up') {
        ctx.fillRect(13, 8, 2.5, 2.5);
        ctx.fillRect(19, 8, 2.5, 2.5);
      }
      ctx.restore();
    }
  });
  return sheet;
}

// ---------- Orc Raider (grunt) ----------
function buildOrcRaiderSheet() {
  const FW = 34, FH = 36;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const legOffset = frame % 2 === 0 ? 0 : (frame === 1 ? 2 : -2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(17, 32, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2016';
      ctx.fillRect(11, 24 + Math.max(0, legOffset), 5, 7);
      ctx.fillRect(18, 24 + Math.max(0, -legOffset), 5, 7);
      ctx.fillStyle = '#4a5a2a';
      roundRect(ctx, 9, 13, 16, 13, 3); ctx.fill();
      ctx.fillStyle = '#3a2e1e';
      ctx.fillRect(9, 21, 16, 2);
      const armSwing = frame === 1 ? -2 : frame === 3 ? 2 : 0;
      ctx.fillStyle = '#40502a';
      if (dir !== 'left') ctx.fillRect(23, 14 + armSwing, 4, 9);
      if (dir !== 'right') ctx.fillRect(7, 14 - armSwing, 4, 9);
      // crude hand-axe (right hand only, down/right facing)
      if (dir === 'down' || dir === 'right') {
        ctx.fillStyle = '#5a4a30';
        ctx.fillRect(25, 10 + armSwing, 2, 10);
        ctx.fillStyle = '#8a8578';
        ctx.beginPath();
        ctx.moveTo(27, 8 + armSwing); ctx.lineTo(31, 12 + armSwing); ctx.lineTo(27, 15 + armSwing);
        ctx.closePath(); ctx.fill();
      }
      // head
      ctx.fillStyle = '#5a7038';
      roundRect(ctx, 10, 3, 14, 12, 4); ctx.fill();
      ctx.fillStyle = '#4a6030';
      ctx.beginPath(); ctx.moveTo(10, 7); ctx.lineTo(4, 5); ctx.lineTo(9, 11); ctx.fill();
      ctx.beginPath(); ctx.moveTo(24, 7); ctx.lineTo(30, 5); ctx.lineTo(25, 11); ctx.fill();
      ctx.fillStyle = '#c9403c';
      if (dir !== 'up') {
        ctx.fillRect(13, 8, 2.5, 2.5);
        ctx.fillRect(19, 8, 2.5, 2.5);
      }
      ctx.fillStyle = '#e8e4d8';
      if (dir === 'down') {
        ctx.fillRect(12, 13, 1.6, 3.4);
        ctx.fillRect(21, 13, 1.6, 3.4);
      }
      ctx.restore();
    }
  });
  return sheet;
}

// ---------- Troll (grunt, bigger/tankier) ----------
function buildTrollSheet() {
  const FW = 46, FH = 48;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const bob = (frame === 1 || frame === 3) ? 1 : 0;
      ctx.translate(0, -bob);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(23, 43, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
      // legs
      ctx.fillStyle = '#3a4a34';
      ctx.fillRect(15, 32, 8, 10);
      ctx.fillRect(24, 32, 8, 10);
      // hunched torso
      ctx.fillStyle = '#5a7050';
      roundRect(ctx, 10, 15, 27, 20, 5); ctx.fill();
      ctx.fillStyle = '#4a5e40';
      ctx.fillRect(10, 24, 27, 3);
      // arms + crude club
      ctx.fillStyle = '#4e6444';
      ctx.fillRect(4, 16, 8, 15);
      ctx.fillRect(35, 16, 8, 15);
      ctx.fillStyle = '#4a3620';
      ctx.fillRect(38, 3, 5, 18);
      ctx.fillStyle = '#3a2a18';
      ctx.beginPath(); ctx.ellipse(40, 3, 6, 5, 0.2, 0, Math.PI * 2); ctx.fill();
      // head (small relative to body — classic troll proportions)
      ctx.fillStyle = '#66805a';
      roundRect(ctx, 14, 2, 18, 15, 5); ctx.fill();
      // brow ridge
      ctx.fillStyle = '#546c48';
      ctx.fillRect(14, 7, 18, 4);
      // eyes
      ctx.fillStyle = '#ffe25a';
      if (dir !== 'up') {
        ctx.fillRect(17, 9, 3, 2.5);
        ctx.fillRect(25, 9, 3, 2.5);
      }
      // tusks
      ctx.fillStyle = '#e8e4d8';
      if (dir === 'down') {
        ctx.fillRect(16, 14, 2, 5);
        ctx.fillRect(27, 14, 2, 5);
      }
      ctx.restore();
    }
  });
  return sheet;
}

// ---------- Troll Chieftain (boss) ----------
function buildTrollChieftainSheet() {
  const FW = 58, FH = 60;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const bob = (frame === 1 || frame === 3) ? 1.5 : 0;
      ctx.translate(0, -bob);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(29, 55, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
      // legs
      ctx.fillStyle = '#2e3a28';
      ctx.fillRect(19, 40, 10, 13);
      ctx.fillRect(31, 40, 10, 13);
      // hunched, armored torso
      ctx.fillStyle = '#4a6040';
      roundRect(ctx, 12, 18, 36, 26, 6); ctx.fill();
      ctx.fillStyle = '#5a4a34';
      ctx.fillRect(12, 30, 36, 5); // bone/hide strap
      ctx.fillStyle = '#3a4a32';
      ctx.fillRect(12, 18, 36, 4);
      // shoulder bones (trophies)
      ctx.fillStyle = '#dcd6c4';
      ctx.beginPath(); ctx.moveTo(10, 19); ctx.lineTo(4, 10); ctx.lineTo(14, 17); ctx.fill();
      ctx.beginPath(); ctx.moveTo(48, 19); ctx.lineTo(54, 10); ctx.lineTo(44, 17); ctx.fill();
      // arms + massive spiked club
      ctx.fillStyle = '#425a38';
      ctx.fillRect(4, 19, 10, 20);
      ctx.fillRect(44, 19, 10, 20);
      ctx.fillStyle = '#4a3620';
      ctx.fillRect(48, 2, 6, 22);
      ctx.fillStyle = '#3a2a18';
      ctx.beginPath(); ctx.ellipse(51, 3, 8, 6, 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a8578';
      [[47, -1], [55, -2], [51, -6]].forEach(([sx, sy]) => {
        ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, Math.PI * 2); ctx.fill();
      });
      // head with bone chieftain headdress
      ctx.fillStyle = '#5c7850';
      roundRect(ctx, 18, 3, 22, 18, 6); ctx.fill();
      ctx.fillStyle = '#4a6040';
      ctx.fillRect(18, 9, 22, 5);
      ctx.fillStyle = '#dcd6c4';
      ctx.beginPath();
      ctx.moveTo(18, 4); ctx.lineTo(16, -6); ctx.lineTo(22, 3);
      ctx.lineTo(29, -8); ctx.lineTo(32, 3);
      ctx.lineTo(38, -6); ctx.lineTo(40, 4);
      ctx.closePath(); ctx.fill();
      // eyes
      ctx.fillStyle = '#ffe25a';
      if (dir !== 'up') {
        ctx.fillRect(21, 11, 3.5, 3);
        ctx.fillRect(31, 11, 3.5, 3);
      }
      // tusks
      ctx.fillStyle = '#e8e4d8';
      if (dir === 'down') {
        ctx.fillRect(20, 17, 2.5, 6);
        ctx.fillRect(35, 17, 2.5, 6);
      }
      // war paint
      ctx.fillStyle = '#c94040';
      if (dir === 'down') ctx.fillRect(22, 6, 14, 2.5);
      ctx.restore();
    }
  });
  return sheet;
}

// ---------- Pit Devil (final boss) ----------
function buildPitDevilSheet() {
  const FW = 66, FH = 68;
  const sheet = makeCanvas(FW * 4, FH * 4);
  const ctx = sheet.getContext('2d');
  const dirs = ['down', 'left', 'right', 'up'];
  dirs.forEach((dir, row) => {
    for (let frame = 0; frame < 4; frame++) {
      ctx.save();
      ctx.translate(frame * FW, row * FH);
      const bob = (frame === 1 || frame === 3) ? 1.5 : 0;
      ctx.translate(0, -bob);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(33, 62, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
      // wings (behind body)
      ctx.fillStyle = 'rgba(40,10,10,0.85)';
      ctx.beginPath();
      ctx.moveTo(14, 24); ctx.quadraticCurveTo(-8, 20, -4, 44); ctx.quadraticCurveTo(6, 34, 16, 34);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(52, 24); ctx.quadraticCurveTo(74, 20, 70, 44); ctx.quadraticCurveTo(60, 34, 50, 34);
      ctx.closePath(); ctx.fill();
      // legs (hooved, powerful)
      ctx.fillStyle = '#160604';
      ctx.fillRect(21, 46, 10, 15);
      ctx.fillRect(35, 46, 10, 15);
      // tail
      ctx.strokeStyle = '#5c0f0f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(33, 48); ctx.quadraticCurveTo(46, 56, 42, 66);
      ctx.stroke();
      ctx.fillStyle = '#5c0f0f';
      ctx.beginPath(); ctx.moveTo(42, 66); ctx.lineTo(48, 63); ctx.lineTo(43, 70); ctx.closePath(); ctx.fill();
      // molten-cracked torso
      ctx.fillStyle = '#3a0a0a';
      roundRect(ctx, 14, 20, 38, 28, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,110,30,0.55)';
      ctx.fillRect(20, 26, 3, 18);
      ctx.fillRect(30, 30, 3, 14);
      ctx.fillRect(40, 24, 3, 20);
      ctx.fillStyle = '#1e0505';
      ctx.fillRect(14, 33, 38, 5);
      // arms + claws
      ctx.fillStyle = '#340808';
      ctx.fillRect(5, 21, 10, 22);
      ctx.fillRect(51, 21, 10, 22);
      ctx.fillStyle = '#eee8d8';
      [[6, 43], [10, 45], [14, 43]].forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 2, cy + 5); ctx.lineTo(cx - 1, cy + 5); ctx.closePath(); ctx.fill();
      });
      [[52, 43], [56, 45], [60, 43]].forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 2, cy + 5); ctx.lineTo(cx - 1, cy + 5); ctx.closePath(); ctx.fill();
      });
      // head
      ctx.fillStyle = '#4a0f0f';
      roundRect(ctx, 20, 4, 26, 20, 6); ctx.fill();
      // massive horns
      ctx.fillStyle = '#1a1210';
      ctx.beginPath(); ctx.moveTo(20, 6); ctx.lineTo(8, -10); ctx.lineTo(24, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(46, 6); ctx.lineTo(58, -10); ctx.lineTo(42, 4); ctx.closePath(); ctx.fill();
      // eyes (burning)
      ctx.fillStyle = '#ffcf3c';
      if (dir !== 'up') {
        ctx.fillRect(25, 13, 4, 3.5);
        ctx.fillRect(37, 13, 4, 3.5);
      }
      ctx.fillStyle = 'rgba(255,207,60,0.4)';
      if (dir !== 'up') {
        ctx.beginPath(); ctx.arc(27, 15, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(39, 15, 4, 0, Math.PI * 2); ctx.fill();
      }
      // fangs
      ctx.fillStyle = '#e8e4d8';
      if (dir === 'down') {
        ctx.fillRect(24, 21, 2.5, 6);
        ctx.fillRect(39, 21, 2.5, 6);
      }
      ctx.restore();
    }
  });
  return sheet;
}
