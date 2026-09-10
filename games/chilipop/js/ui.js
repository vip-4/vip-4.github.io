'use strict';

export class UI {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderer = renderer;
  }

  get w() {
    const dpr = window.devicePixelRatio || 1;
    return this.canvas.width / dpr;
  }

  get h() {
    const dpr = window.devicePixelRatio || 1;
    return this.canvas.height / dpr;
  }

  drawScore(score, bestScore) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = '#fffffe';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 12, 24);
    ctx.font = 'bold 22px monospace';
    ctx.fillText(score.toLocaleString(), 12, 48);

    ctx.textAlign = 'right';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#888899';
    ctx.fillText('BEST', this.w - 12, 24);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText(bestScore.toLocaleString(), this.w - 12, 44);
    ctx.restore();
  }

  drawHeatGauge(heat, isFever) {
    const { ctx } = this;
    const gaugeW = this.w - 24;
    const gaugeH = 8;
    const gaugeX = 12;
    const gaugeY = this.h - 20;

    ctx.save();
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);

    if (isFever) {
      const t = Date.now() / 200;
      const r = Math.floor(200 + Math.sin(t) * 55);
      const g = Math.floor(100 + Math.sin(t + 1) * 55);
      ctx.fillStyle = `rgb(${r},${g},50)`;
    } else {
      const gradient = ctx.createLinearGradient(gaugeX, 0, gaugeX + gaugeW, 0);
      gradient.addColorStop(0, '#3344aa');
      gradient.addColorStop(0.5, '#ff8833');
      gradient.addColorStop(1, '#ff3333');
      ctx.fillStyle = gradient;
    }

    const fillW = Math.max(0, (heat / 100) * gaugeW);
    ctx.fillRect(gaugeX, gaugeY, fillW, gaugeH);

    ctx.strokeStyle = '#3a3a5e';
    ctx.lineWidth = 1;
    ctx.strokeRect(gaugeX, gaugeY, gaugeW, gaugeH);

    if (isFever) {
      ctx.fillStyle = '#ffdd33';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('FEVER!', this.w / 2, gaugeY - 4);
    } else {
      ctx.fillStyle = '#667788';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HEAT', this.w / 2, gaugeY - 3);
    }
    ctx.restore();
  }

  drawTitleScreen() {
    const { ctx } = this;
    const w = this.w;
    const h = this.h;

    ctx.save();
    ctx.fillStyle = '#0f0e17';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 30; i++) {
      const x = ((Date.now() / 50 + i * 37) % (w + 20)) - 10;
      const y = ((Date.now() / 80 + i * 53) % (h + 20)) - 10;
      const colors = ['#ff444433', '#44bb4433', '#ff883333', '#aa44ff33', '#ffdd3333'];
      ctx.fillStyle = colors[i % 5];
      ctx.fillRect(x, y, 4, 4);
    }

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('CHILI', w / 2, h / 2 - 50);

    ctx.fillStyle = '#ffdd33';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('POP', w / 2, h / 2 + 5);

    const pulse = 0.6 + Math.sin(Date.now() / 500) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('TAP TO START', w / 2, h / 2 + 70);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#667788';
    ctx.font = '12px monospace';
    ctx.fillText('[R] Restart  [M] Mute  [H] Help', w / 2, h - 30);

    ctx.restore();
  }

  drawGameOver(score, bestScore) {
    const { ctx } = this;
    const w = this.w;
    const h = this.h;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 14, 23, 0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('GAME OVER', w / 2, h / 2 - 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, w / 2, h / 2 - 15);

    if (score >= bestScore && score > 0) {
      ctx.fillStyle = '#ffdd33';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('NEW BEST!', w / 2, h / 2 + 15);
    }

    const pulse = 0.6 + Math.sin(Date.now() / 500) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText('TAP TO PLAY AGAIN', w / 2, h / 2 + 60);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawHelp() {
    const { ctx } = this;
    const w = this.w;
    const h = this.h;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 14, 23, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdd33';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('HOW TO PLAY', w / 2, 60);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ccccee';
    ctx.font = '14px monospace';
    const lines = [
      'Tap peppers to select a group.',
      'Tap again to pop them!',
      '',
      'Bigger groups = more points!',
      'Score = N x (N - 1)',
      '',
      'Fill the HEAT gauge to trigger',
      'FEVER MODE (2x score!)',
      '',
      'Game ends when no groups',
      'of 2+ remain.',
      '',
      'Keyboard: R=Restart M=Mute',
    ];

    let y = 100;
    for (const line of lines) {
      ctx.fillText(line, 30, y);
      y += 22;
    }

    const pulse = 0.6 + Math.sin(Date.now() / 500) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText('TAP ANYWHERE TO CLOSE', w / 2, h - 40);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawRemainingMoves(count) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = '#556677';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Moves: ${count}`, this.w / 2, this.h - 6);
    ctx.restore();
  }
}
