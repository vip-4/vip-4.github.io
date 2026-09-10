// utils.js — shared math/canvas helper functions used across the whole game
const TILE = 32;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
function randRange(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Rounded rect helper (used for panels/UI drawn on canvas)
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Simple seeded-ish noise for grass/foliage variation (deterministic per tile)
function hashTile(x, y) {
  let h = (x * 374761393 + y * 668265263) % 2147483647;
  h = (h ^ (h >> 13)) * 1274126177 % 2147483647;
  return Math.abs(h) / 2147483647;
}

// Off-screen canvas helper — used by sprite-sheet builders and by the
// tilemap's baked static layer.
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Word-wraps plain text to a max pixel width using the ctx's current font.
// Shared by the dialogue box and the canvas UI screens.
function wrapPlainText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const out = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}
