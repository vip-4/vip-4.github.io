// entities/animated-sprite.js — walks a 4-frame strip of a sprite sheet and
// blits the current frame. Shared by Player, NPC, and Enemy.

class AnimatedSprite {
  constructor(sheet, frameW, frameH, dirRows = true) {
    this.sheet = sheet;
    this.fw = frameW;
    this.fh = frameH;
    this.dirRows = dirRows; // true = sheet has 4 directional rows, false = single row
    this.frame = 0;
    this.frameTimer = 0;
    this.frameSpeed = 8;
  }

  update(moving) {
    if (!moving) {
      this.frame = 0;
      return;
    }
    this.frameTimer++;
    if (this.frameTimer >= this.frameSpeed) {
      this.frameTimer = 0;
      this.frame = (this.frame + 1) % 4;
    }
  }

  draw(ctx, x, y, dir, flashWhite = false) {
    const dirIndex = { down: 0, left: 1, right: 2, up: 3 };
    const row = this.dirRows ? dirIndex[dir] : 0;
    ctx.drawImage(this.sheet, this.frame * this.fw, row * this.fh, this.fw, this.fh, x, y, this.fw, this.fh);
    if (flashWhite) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(x, y, this.fw, this.fh);
      ctx.restore();
    }
  }
}
