'use strict';

import { PEPPER_TYPES } from './board.js';

const PIXEL_SIZE = 2;
const SPRITE_SIZE = 16;

const PEPPER_SPRITES = {
  1: [
    '....1111....',
    '...111111...',
    '..11111111..',
    '..11111111..',
    '.1111111111.',
    '.1111111111.',
    '.1111111111.',
    '.1111111111.',
    '..11111111..',
    '..11111111..',
    '...111111...',
    '....1111....',
    '.....11.....',
    '......1.....',
  ],
  2: [
    '....2222....',
    '...222222...',
    '..22222222..',
    '..22222222..',
    '.2222222222.',
    '.2222222222.',
    '.2222222222.',
    '.2222222222.',
    '..22222222..',
    '..22222222..',
    '...222222...',
    '....2222....',
    '.....22.....',
    '......2.....',
  ],
  3: [
    '....3333....',
    '...333333...',
    '..33333333..',
    '..33333333..',
    '.3333333333.',
    '.3333333333.',
    '.3333333333.',
    '.3333333333.',
    '..33333333..',
    '..33333333..',
    '...333333...',
    '....3333....',
    '.....33.....',
    '......3.....',
  ],
  4: [
    '....4444....',
    '...444444...',
    '..44444444..',
    '..44444444..',
    '.4444444444.',
    '.4444444444.',
    '.4444444444.',
    '.4444444444.',
    '..44444444..',
    '..44444444..',
    '...444444...',
    '....4444....',
    '.....44.....',
    '......4.....',
  ],
  5: [
    '....5555....',
    '...555555...',
    '..55555555..',
    '..55555555..',
    '.5555555555.',
    '.5555555555.',
    '.5555555555.',
    '.5555555555.',
    '..55555555..',
    '..55555555..',
    '...555555...',
    '....5555....',
    '.....55.....',
    '......5.....',
  ],
};

const STEM_SPRITE = [
  '.....SS.....',
  '....SSSS....',
];

const PEPPER_HIGHLIGHT = {
  1: '#ff7777', 2: '#77dd77', 3: '#ffaa66', 4: '#cc88ff', 5: '#ffee77',
};

const PEPPER_SHADOW = {
  1: '#cc2222', 2: '#228822', 3: '#cc6622', 4: '#7733bb', 5: '#ccaa22',
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.cellSize = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.spriteCache = {};
    this._buildSpriteCache();
  }

  _buildSpriteCache() {
    for (const id of [1, 2, 3, 4, 5]) {
      const pepper = PEPPER_TYPES[Object.keys(PEPPER_TYPES).find(k => PEPPER_TYPES[k].id === id)];
      const offscreen = document.createElement('canvas');
      offscreen.width = SPRITE_SIZE * PIXEL_SIZE;
      offscreen.height = (SPRITE_SIZE + 2) * PIXEL_SIZE;
      const octx = offscreen.getContext('2d');
      octx.imageSmoothingEnabled = false;

      const stemColor = '#44aa44';
      const stemDark = '#338833';

      for (let y = 0; y < STEM_SPRITE.length; y++) {
        for (let x = 0; x < STEM_SPRITE[y].length; x++) {
          if (STEM_SPRITE[y][x] === 'S') {
            const isEdge = (y === 0 || x === 0 || x === STEM_SPRITE[y].length - 1);
            octx.fillStyle = isEdge ? stemDark : stemColor;
            octx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
      }

      const sprite = PEPPER_SPRITES[id];
      const spriteOffset = STEM_SPRITE.length * PIXEL_SIZE;
      for (let y = 0; y < sprite.length; y++) {
        for (let x = 0; x < sprite[y].length; x++) {
          const ch = sprite[y][x];
          if (ch !== '.') {
            const isEdge = (y === 0 || y === sprite.length - 1 || x === 0 || x === sprite[y].length - 1);
            octx.fillStyle = isEdge ? PEPPER_SHADOW[id] : pepper.color;
            octx.fillRect(x * PIXEL_SIZE, spriteOffset + y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
      }

      const faceY = spriteOffset + 4 * PIXEL_SIZE;
      const faceX = 5 * PIXEL_SIZE;
      octx.fillStyle = '#222222';
      octx.fillRect(faceX, faceY, PIXEL_SIZE, PIXEL_SIZE);
      octx.fillRect(faceX + PIXEL_SIZE, faceY, PIXEL_SIZE, PIXEL_SIZE);
      octx.fillRect(faceX + 4 * PIXEL_SIZE, faceY, PIXEL_SIZE, PIXEL_SIZE);
      octx.fillRect(faceX + 5 * PIXEL_SIZE, faceY, PIXEL_SIZE, PIXEL_SIZE);
      const smileY = faceY + 3 * PIXEL_SIZE;
      octx.fillRect(faceX + PIXEL_SIZE, smileY, PIXEL_SIZE, PIXEL_SIZE);
      octx.fillRect(faceX + 4 * PIXEL_SIZE, smileY, PIXEL_SIZE, PIXEL_SIZE);
      octx.fillRect(faceX + 2 * PIXEL_SIZE, smileY + PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      octx.fillRect(faceX + 3 * PIXEL_SIZE, smileY + PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);

      this.spriteCache[id] = offscreen;
    }
  }

  layout(cols, rows, canvasWidth, canvasHeight) {
    const maxCellW = Math.floor((canvasWidth - 20) / cols);
    const maxCellH = Math.floor((canvasHeight - 100) / rows);
    this.cellSize = Math.min(maxCellW, maxCellH, 48);
    const gridW = cols * this.cellSize;
    const gridH = rows * this.cellSize;
    this.offsetX = Math.floor((canvasWidth - gridW) / 2);
    this.offsetY = Math.floor((canvasHeight - gridH) / 2) + 30;
  }

  clear(bgColor = '#0f0e17') {
    const { ctx, canvas } = this;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawGrid(board) {
    const { ctx, cellSize, offsetX, offsetY } = this;
    const gridW = board.cols * cellSize;
    const gridH = board.rows * cellSize;

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    this._roundRect(ctx, offsetX - 4, offsetY - 4, gridW + 8, gridH + 8, 8);
    ctx.fill();

    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this._roundRect(ctx, offsetX - 4, offsetY - 4, gridW + 8, gridH + 8, 8);
    ctx.stroke();

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1e1e38' : '#222244';
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  drawPeppers(board, animatingPeppers = null) {
    const { ctx, cellSize, offsetX, offsetY } = this;
    const spriteScale = cellSize / (SPRITE_SIZE * PIXEL_SIZE);

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const type = board.getCell(c, r);
        if (type === 0) continue;

        let x = offsetX + c * cellSize;
        let y = offsetY + r * cellSize;
        let scale = 1;
        let alpha = 1;

        if (animatingPeppers) {
          const anim = animatingPeppers.get(`${c},${r}`);
          if (anim) {
            scale = anim.scale;
            alpha = anim.alpha;
          }
        }

        const sprite = this.spriteCache[type];
        if (sprite) {
          ctx.save();
          ctx.globalAlpha = alpha;
          const w = sprite.width * spriteScale * scale;
          const h = sprite.height * spriteScale * scale;
          const dx = x + (cellSize - w) / 2;
          const dy = y + (cellSize - h) / 2;
          ctx.drawImage(sprite, dx, dy, w, h);
          ctx.restore();
        }
      }
    }
  }

  drawHighlight(group, cellSize, offsetX, offsetY) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 0.3;
    for (const { col, row } of group) {
      const x = offsetX + col * cellSize;
      const y = offsetY + row * cellSize;
      const type = 1;
      ctx.fillStyle = PEPPER_HIGHLIGHT[Object.keys(PEPPER_HIGHLIGHT).find(k => {
        const pepper = Object.values(PEPPER_TYPES).find(p => p.id === parseInt(Object.keys(PEPPER_HIGHLIGHT).find(k2 => k2 === String(col)))) ;
        return true;
      })] || '#ffffff';

      const firstPepper = group[0] ? this.canvas._board?.getCell(group[0].col, group[0].row) : 1;
      ctx.fillStyle = PEPPER_HIGHLIGHT[firstPepper] || '#ffffff';
      ctx.fillRect(x, y, cellSize, cellSize);
    }
    ctx.restore();
  }

  drawHighlightGroup(group, board) {
    if (!group || group.length === 0) return;
    const { ctx, cellSize, offsetX, offsetY } = this;
    const typeId = board.getCell(group[0].col, group[0].row);
    const highlightColor = PEPPER_HIGHLIGHT[typeId] || '#ffffff';

    ctx.save();
    ctx.globalAlpha = 0.35;
    for (const { col, row } of group) {
      const x = offsetX + col * cellSize;
      const y = offsetY + row * cellSize;
      ctx.fillStyle = highlightColor;
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    for (const { col, row } of group) {
      const x = offsetX + col * cellSize;
      const y = offsetY + row * cellSize;
      ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    }
    ctx.restore();
  }

  spawnParticles(group, board) {
    const { cellSize, offsetX, offsetY } = this;
    for (const { col, row } of group) {
      const typeId = board.getCell(col, row);
      const pepper = Object.values(PEPPER_TYPES).find(p => p.id === typeId);
      const color = pepper ? pepper.color : '#ffffff';
      const cx = offsetX + col * cellSize + cellSize / 2;
      const cy = offsetY + row * cellSize + cellSize / 2;

      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 3;
        this.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          decay: 0.02 + Math.random() * 0.02,
          color: color,
          size: 2 + Math.random() * 3,
        });
      }
    }
  }

  spawnFeverParticles(canvasWidth, canvasHeight) {
    const colors = ['#ff4444', '#ff8833', '#ffdd33', '#aa44ff', '#44bb44'];
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: canvasHeight + 5,
        vx: (Math.random() - 0.5) * 1,
        vy: -(1 + Math.random() * 2),
        life: 1.0,
        decay: 0.008 + Math.random() * 0.008,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2,
      });
    }
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x, y, text, color,
      life: 1.0,
      decay: 0.015,
      vy: -1.5,
    });
  }

  updateParticles() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= p.decay;
      return p.life > 0;
    });

    this.floatingTexts = this.floatingTexts.filter(ft => {
      ft.y += ft.vy;
      ft.life -= ft.decay;
      return ft.life > 0;
    });

    if (this.shakeIntensity > 0.1) {
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }
  }

  drawParticles() {
    const { ctx } = this;
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  drawFloatingTexts() {
    const { ctx } = this;
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.life;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  triggerShake(intensity) {
    this.shakeIntensity = intensity;
  }

  applyShake() {
    if (this.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
    }
  }

  drawBackgroundGradient(heatPercent) {
    const { ctx } = this;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    const warmR = Math.floor(15 + heatPercent * 0.2);
    const warmG = Math.floor(14 - heatPercent * 0.05);
    const warmB = Math.floor(23 - heatPercent * 0.1);
    gradient.addColorStop(0, `rgb(${warmR},${warmG},${warmB})`);
    gradient.addColorStop(1, '#0a0a14');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
  }

  getGridPosition(canvasX, canvasY, board) {
    const col = Math.floor((canvasX - this.offsetX) / this.cellSize);
    const row = Math.floor((canvasY - this.offsetY) / this.cellSize);
    if (col >= 0 && col < board.cols && row >= 0 && row < board.rows) {
      return { col, row };
    }
    return null;
  }
}
