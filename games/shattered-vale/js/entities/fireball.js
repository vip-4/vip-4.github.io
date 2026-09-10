// entities/fireball.js — the player's ranged spell projectile.

class Fireball {
  constructor(x, y, dirX, dirY) {
    this.x = x;
    this.y = y;
    this.w = 18;
    this.h = 18;

    this.speed = FIREBALL_STATS.speed;
    this.damage = FIREBALL_STATS.damage;

    this.dirX = dirX;
    this.dirY = dirY;

    this.life = FIREBALL_STATS.life;
  }

  update(enemies, particles) {
    this.x += this.dirX * this.speed;
    this.y += this.dirY * this.speed;

    this.life--;

    enemies.forEach(en => {
      if (en.alive && rectsOverlap(this, en)) {
        en.takeDamage(this.damage, particles);
        particles.floatText(en.x, en.y - 10, '-' + this.damage, '#ff6b2c');
        this.life = 0;
      }
    });
  }

  draw(ctx, camX, camY) {
    ctx.save();

    ctx.fillStyle = '#ff7b22';
    ctx.beginPath();
    ctx.arc(this.x - camX + this.w / 2, this.y - camY + this.h / 2, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd35a';
    ctx.beginPath();
    ctx.arc(this.x - camX + this.w / 2, this.y - camY + this.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
