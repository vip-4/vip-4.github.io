'use strict';

import { Board, PEPPER_TYPES } from './board.js';
import { Renderer } from './renderer.js';
import { Audio } from './audio.js';
import { UI } from './ui.js';

const STATES = { TITLE: 'title', PLAYING: 'playing', GAME_OVER: 'game_over', HELP: 'help' };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.board = null;
    this.renderer = new Renderer(canvas);
    this.audio = new Audio();
    this.ui = new UI(canvas, this.renderer);
    this.state = STATES.TITLE;
    this.score = 0;
    this.bestScore = this._loadBest();
    this.heat = 0;
    this.isFever = false;
    this.feverTimer = 0;
    this.feverDuration = 600;
    this.selectedGroup = null;
    this.comboCount = 0;
    this.clearAnimations = new Map();
    this.animating = false;

    this._resize();
    window.addEventListener('resize', () => this._resize());

    canvas.addEventListener('click', (e) => this._handleClick(e));
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      this._handleTap(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });

    document.addEventListener('keydown', (e) => this._handleKey(e));
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.min(window.innerWidth, 520);
    const h = Math.min(window.innerHeight, 800);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.renderer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._cssW = w;
    this._cssH = h;
    if (this.board) {
      this.renderer.layout(this.board.cols, this.board.rows, w, h);
    }
  }

  _loadBest() {
    try { return parseInt(localStorage.getItem('chilipop_best') || '0', 10); }
    catch { return 0; }
  }

  _saveBest(score) {
    try { localStorage.setItem('chilipop_best', String(score)); } catch {}
  }

  start() {
    this.board = new Board(10, 12, 5);
    this.score = 0;
    this.heat = 0;
    this.isFever = false;
    this.feverTimer = 0;
    this.selectedGroup = null;
    this.comboCount = 0;
    this.clearAnimations.clear();
    this.animating = false;
    this._resize();
    this.state = STATES.PLAYING;
  }

  _handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    this._handleTap(e.clientX - rect.left, e.clientY - rect.top);
  }

  _handleTap(x, y) {
    this.audio.init();
    this.audio.resume();

    if (this.state === STATES.TITLE) {
      this.audio.playSelect();
      this.start();
      return;
    }

    if (this.state === STATES.HELP) {
      this.audio.playSelect();
      this.state = STATES.PLAYING;
      return;
    }

    if (this.state === STATES.GAME_OVER) {
      this.audio.playSelect();
      this.start();
      return;
    }

    if (this.state !== STATES.PLAYING || this.animating) return;

    const pos = this.renderer.getGridPosition(x, y, this.board);
    if (!pos) {
      this.selectedGroup = null;
      return;
    }

    const { col, row } = pos;
    const type = this.board.getCell(col, row);
    if (type === 0) {
      this.selectedGroup = null;
      return;
    }

    const group = this.board.findGroup(col, row);

    if (this.selectedGroup && this._sameGroup(this.selectedGroup, group)) {
      if (group.length >= 2) {
        this._clearGroup(group);
      }
      this.selectedGroup = null;
    } else {
      if (group.length < 2) {
        this.audio.playInvalid();
        this.selectedGroup = null;
      } else {
        this.audio.playSelect();
        this.selectedGroup = group;
      }
    }
  }

  _sameGroup(a, b) {
    if (a.length !== b.length) return false;
    const key = (g) => g.map(c => `${c.col},${c.row}`).sort().join('|');
    return key(a) === key(b);
  }

  _clearGroup(group) {
    this.animating = true;
    const groupSize = group.length;
    const typeId = this.board.getCell(group[0].col, group[0].row);
    const pepper = Object.values(PEPPER_TYPES).find(p => p.id === typeId);
    const baseScore = Board.calculateScore(groupSize);
    const multiplier = this.isFever ? 2 : 1;
    const finalScore = baseScore * multiplier;
    this.score += finalScore;

    this.comboCount++;
    if (this.comboCount > 1) {
      this.audio.playCombo(this.comboCount);
    } else {
      this.audio.playPop(groupSize);
    }

    this.renderer.spawnParticles(group, this.board);

    const cx = this.renderer.offsetX + group[0].col * this.renderer.cellSize + this.renderer.cellSize / 2;
    const cy = this.renderer.offsetY + group[0].row * this.renderer.cellSize + this.renderer.cellSize / 2;
    this.renderer.addFloatingText(cx, cy, `+${finalScore}`, pepper ? pepper.color : '#ffffff');
    if (this.comboCount > 1) {
      this.renderer.addFloatingText(cx, cy + 20, `${this.comboCount}x COMBO`, '#ffdd33');
    }

    if (groupSize >= 5) {
      this.renderer.triggerShake(groupSize * 1.5);
    }

    if (!this.isFever) {
      this.heat = Math.min(100, this.heat + groupSize * 3);
      if (this.heat >= 100) {
        this.isFever = true;
        this.feverTimer = this.feverDuration;
        this.audio.playFever();
      }
    }

    for (const { col, row } of group) {
      this.clearAnimations.set(`${col},${row}`, { scale: 1.2, alpha: 1.0 });
    }

    setTimeout(() => {
      this.board.removeGroup(group);
      this.board.applyGravity();
      this.board.collapseColumns();
      this.clearAnimations.clear();

      setTimeout(() => {
        this.animating = false;
        this.comboCount = 0;

        if (this.board.isGameOver()) {
          this.state = STATES.GAME_OVER;
          this.audio.playGameOver();
          if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this._saveBest(this.bestScore);
          }
        }
      }, 80);
    }, 200);
  }

  _handleKey(e) {
    if (e.key === 'r' || e.key === 'R') {
      this.audio.init();
      this.audio.playSelect();
      this.start();
    } else if (e.key === 'm' || e.key === 'M') {
      this.audio.init();
      this.audio.toggleMute();
    } else if (e.key === 'h' || e.key === 'H') {
      if (this.state === STATES.PLAYING) {
        this.state = STATES.HELP;
      } else if (this.state === STATES.HELP) {
        this.state = STATES.PLAYING;
      }
    }
  }

  update() {
    this.renderer.updateParticles();

    if (this.isFever) {
      this.feverTimer--;
      if (this.feverTimer <= 0) {
        this.isFever = false;
        this.heat = 0;
      }
      this.renderer.spawnFeverParticles(this._cssW, this._cssH);
    }

    for (const [key, anim] of this.clearAnimations) {
      anim.scale *= 0.92;
      anim.alpha -= 0.05;
      if (anim.alpha <= 0) this.clearAnimations.delete(key);
    }
  }

  render() {
    if (this.state === STATES.TITLE) {
      this.ui.drawTitleScreen();
      return;
    }

    if (this.state === STATES.HELP) {
      this.renderer.drawBackgroundGradient(0);
      this.renderer.drawGrid(this.board);
      this.renderer.drawPeppers(this.board);
      this.ui.drawHelp();
      return;
    }

    this.renderer.ctx.save();
    this.renderer.drawBackgroundGradient(this.heat);
    this.renderer.applyShake();

    this.renderer.drawGrid(this.board);
    this.renderer.drawPeppers(this.board, this.clearAnimations);

    if (this.selectedGroup && this.state === STATES.PLAYING) {
      this.renderer.drawHighlightGroup(this.selectedGroup, this.board);
    }

    this.renderer.drawParticles();
    this.renderer.drawFloatingTexts();

    this.ui.drawScore(this.score, this.bestScore);
    this.ui.drawHeatGauge(this.heat, this.isFever);

    const moves = this.board ? this.board.findValidMoves().length : 0;
    this.ui.drawRemainingMoves(moves);

    this.renderer.ctx.restore();

    if (this.state === STATES.GAME_OVER) {
      this.ui.drawGameOver(this.score, this.bestScore);
    }
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }
}
