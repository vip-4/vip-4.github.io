// ui/screens.js — the canvas-drawn screens that aren't "the game itself":
// the desktop-only block, start menu, how-to-play panel, and the
// game-over/restart screen. Each draw function stores any clickable button
// rects it produced directly onto `state` (e.g. state.startButtons), which
// game.js's click handler then hit-tests with Screens.pointInBtn.

const AUTHOR_URL = 'https://mgodlewskidev.pl/';

const Screens = {
  drawButton(ctx, bx, by, bw, bh, label, fill, textColor) {
    ctx.fillStyle = fill;
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = fill;
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.stroke();
    ctx.fillStyle = textColor || '#f1efe8';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, bx + bw / 2, by + bh / 2 + 5);
    ctx.textAlign = 'left';
    return { x: bx, y: by, w: bw, h: bh };
  },

  pointInBtn(mx, my, btn) {
    return btn && mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
  },

  drawMobileBlock(ctx, viewW, viewH) {
    ctx.save();
    ctx.fillStyle = '#14160f';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.textAlign = 'center';
    ctx.strokeStyle = '#e8c93c';
    ctx.lineWidth = 3;
    const iw = 70, ih = 46;
    const ix = viewW / 2 - iw / 2, iy = viewH / 2 - 160;
    roundRect(ctx, ix, iy, iw, ih, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(viewW / 2, iy + ih);
    ctx.lineTo(viewW / 2, iy + ih + 14);
    ctx.moveTo(viewW / 2 - 18, iy + ih + 14);
    ctx.lineTo(viewW / 2 + 18, iy + ih + 14);
    ctx.stroke();

    ctx.fillStyle = '#e8c93c';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Desktop Only', viewW / 2, viewH / 2 - 50);

    ctx.fillStyle = '#c9c5b8';
    ctx.font = '32px sans-serif';
    const msg = wrapPlainText(ctx, 'This game requires a keyboard and is not playable on mobile devices. Please open it on a desktop or laptop computer.', viewW - 60);
    msg.forEach((line, i) => {
      ctx.fillText(line, viewW / 2, viewH / 2 + 8 + i * 32);
    });

    ctx.textAlign = 'left';
    ctx.restore();
  },

  // Draws the start menu and stores the button rects on state.startButtons.
  drawStart(ctx, state, viewW, viewH) {
    ctx.save();
    const off = state.camera.getOffset();
    const camX = Math.round(off.x), camY = Math.round(off.y);
    state.map.drawGround(ctx, camX, camY, viewW, viewH);
    ctx.fillStyle = 'rgba(8,10,7,0.72)';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.textAlign = 'center';

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('Shattered Vale RPG Game', viewW / 2 + 2, viewH / 2 - 88 + 2);
    ctx.fillStyle = '#e8c93c';
    ctx.fillText('Shattered Vale RPG Game', viewW / 2, viewH / 2 - 88);

    ctx.fillStyle = '#c9c5b8';
    ctx.font = '14px sans-serif';
    ctx.fillText('A tiny village-defense adventure', viewW / 2, viewH / 2 - 58);

    const bw = 190, bh = 42, gap = 14;
    const bx = viewW / 2 - bw / 2;
    let by = viewH / 2 - 10;

    const playLabel = state.hasStarted ? 'Continue' : 'Play';
    const playBtn = this.drawButton(ctx, bx, by, bw, bh, playLabel, '#3a6b3d');
    by += bh + gap;
    const howToBtn = this.drawButton(ctx, bx, by, bw, bh, 'How to Play', '#3a5a7a');
    by += bh + gap;
    let restartBtn = null;
    if (state.hasStarted) {
      restartBtn = this.drawButton(ctx, bx, by, bw, bh, 'Restart Game', '#7a3a3a');
      by += bh + gap;
    }
    const authorBtn = this.drawButton(ctx, bx, by, bw, bh, 'Author', '#5a4a3a');

    ctx.restore();

    state.startButtons = { play: playBtn, howto: howToBtn, restart: restartBtn, author: authorBtn };
  },

  // Draws the how-to-play panel and stores the back button on
  // state.howToBackButton. Assumes drawStart() was already called this
  // frame for the dimmed background (see game.js's draw()).
  drawHowToPlay(ctx, state, viewW, viewH) {
    ctx.save();
    ctx.fillStyle = 'rgba(6,8,5,0.92)';
    ctx.fillRect(0, 0, viewW, viewH);

    const panelW = Math.min(420, viewW - 40);
    const panelH = 400;
    const px = (viewW - panelW) / 2;
    const py = (viewH - panelH) / 2;

    ctx.fillStyle = 'rgba(20,22,16,0.95)';
    roundRect(ctx, px, py, panelW, panelH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,228,216,0.3)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, px, py, panelW, panelH, 10);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c93c';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('How to Play', viewW / 2, py + 34);

    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    const lines = [
      ['Move', 'WASD or Arrow Keys'],
      ['Attack', 'Space'],
      ['Interact / Talk', 'E'],
      ['Inventory', 'I'],
      ['Fire ball', 'F'],
      ['Advance dialogue', 'Space or E'],
    ];
    let ly = py + 68;
    lines.forEach(([label, val]) => {
      ctx.fillStyle = '#e8c93c';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(label, px + 24, ly);
      ctx.fillStyle = '#e8e4d8';
      ctx.font = '13px sans-serif';
      const wrapped = wrapPlainText(ctx, val, panelW - 48);
      wrapped.forEach((wline, i) => {
        ctx.fillText(wline, px + 24, ly + 18 + i * 17);
      });
      ly += 18 + wrapped.length * 17 + 6;
    });

    const bw = 140, bh = 36;
    const bx = viewW / 2 - bw / 2;
    const by = py + panelH - bh - 18;
    state.howToBackButton = this.drawButton(ctx, bx, by, bw, bh, 'Back', '#3a6b3d');

    ctx.restore();
  },

  // Draws the game-over/victory overlay. Stores state.restartButton
  // always; victory also stores state.continueButton (letting the player
  // dismiss the screen and keep exploring instead of forcing a restart).
  drawEnd(ctx, state, viewW, viewH) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.textAlign = 'center';

    const isVictory = state.gameState === 'victory';

    if (state.gameState === 'gameover') {
      ctx.fillStyle = '#f09595';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('You were defeated', viewW / 2, viewH / 2 - 10);
      ctx.fillStyle = '#c9c5b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('Try again and save the village!', viewW / 2, viewH / 2 + 20);
    } else if (isVictory) {
      ctx.fillStyle = '#ffcf3c';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('Victory!', viewW / 2, viewH / 2 - 10);
      ctx.fillStyle = '#e8e4d8';
      ctx.font = '14px sans-serif';
      ctx.fillText('You have conquered the Shattered Vale.', viewW / 2, viewH / 2 + 20);
    }

    const bw = 150, bh = 38;

    if (isVictory) {
      const gap = 16;
      const totalW = bw * 2 + gap;
      const leftX = viewW / 2 - totalW / 2;
      const by = viewH / 2 + 55;
      state.continueButton = this.drawButton(ctx, leftX, by, bw, bh, 'Continue', '#3a5a7a');
      state.restartButton = this.drawButton(ctx, leftX + bw + gap, by, bw, bh, 'Play Again', '#3a6b3d');
    } else {
      const bx = viewW / 2 - bw / 2;
      const by = viewH / 2 + 55;
      state.continueButton = null;
      state.restartButton = this.drawButton(ctx, bx, by, bw, bh, 'Play Again', '#3a6b3d');
    }

    ctx.textAlign = 'left';
    ctx.restore();
  },
};
