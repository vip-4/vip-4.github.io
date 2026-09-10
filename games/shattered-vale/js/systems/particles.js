// systems/particles.js — lightweight particle & floating-text system

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
  }

  burst(x, y, color, count = 6, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(0.6, 2.2);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: randRange(16, 28),
        maxLife: 28,
        size: randRange(2, 4),
        color,
        gravity: opts.gravity !== undefined ? opts.gravity : 0.08
      });
    }
  }

  sparkle(x, y, color) {
    this.particles.push({
      x: x + randRange(-6, 6), y: y + randRange(-6, 6),
      vx: 0, vy: -0.4, life: 24, maxLife: 24, size: 2, color, gravity: 0, glow: true
    });
  }

  floatText(x, y, text, color, size = 13) {
    this.texts.push({ x, y, text, color, life: 40, maxLife: 40, size });
  }

  update() {
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
    });
    this.particles = this.particles.filter(p => p.life > 0);
    this.texts.forEach(t => { t.y -= 0.6; t.life--; });
    this.texts = this.texts.filter(t => t.life > 0);
  }

  draw(ctx, camX, camY) {
    this.particles.forEach(p => {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
      }
      ctx.fillRect(p.x - camX - p.size / 2, p.y - camY - p.size / 2, p.size, p.size);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
    this.texts.forEach(t => {
      const a = clamp(t.life / t.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = `bold ${t.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(t.text, t.x - camX + 1, t.y - camY + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x - camX, t.y - camY);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}
