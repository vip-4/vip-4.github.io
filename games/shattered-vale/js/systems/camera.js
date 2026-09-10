// systems/camera.js — smoothly follows the player and clamps to map bounds

class Camera {
  constructor(viewW, viewH) {
    this.x = 0; this.y = 0;
    this.viewW = viewW; this.viewH = viewH;
    this.shakeTime = 0;
    this.shakeMag = 0;
  }

  follow(targetX, targetY, mapW, mapH) {
    const desiredX = targetX - this.viewW / 2;
    const desiredY = targetY - this.viewH / 2;
    this.x = lerp(this.x, desiredX, 0.12);
    this.y = lerp(this.y, desiredY, 0.12);
    this.x = clamp(this.x, 0, Math.max(0, mapW - this.viewW));
    this.y = clamp(this.y, 0, Math.max(0, mapH - this.viewH));
  }

  shake(mag, time) { this.shakeMag = mag; this.shakeTime = time; }

  getOffset() {
    if (this.shakeTime > 0) {
      this.shakeTime--;
      return {
        x: this.x + randRange(-this.shakeMag, this.shakeMag),
        y: this.y + randRange(-this.shakeMag, this.shakeMag)
      };
    }
    return { x: this.x, y: this.y };
  }
}
