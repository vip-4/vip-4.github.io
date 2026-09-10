'use strict';

export const PEPPER_TYPES = {
  PAPRIKA:   { id: 1, name: 'Paprika',          color: '#ff4444', heat: 1 },
  JALAPENO:  { id: 2, name: 'Jalapeño',          color: '#44bb44', heat: 2 },
  HABANERO:  { id: 3, name: 'Habanero',          color: '#ff8833', heat: 3 },
  GHOST:     { id: 4, name: 'Ghost Pepper',      color: '#aa44ff', heat: 4 },
  REAPER:    { id: 5, name: 'Carolina Reaper',   color: '#ffdd33', heat: 5 },
};

const PEPPER_IDS = Object.values(PEPPER_TYPES).map(p => p.id);

export class Board {
  constructor(cols = 10, rows = 12, typeCount = 5) {
    this.cols = cols;
    this.rows = rows;
    this.typeCount = Math.min(typeCount, PEPPER_IDS.length);
    this.grid = [];
    this.generate();
  }

  generate() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this._randomType());
      }
      this.grid.push(row);
    }
    this._ensurePlayability();
  }

  _randomType() {
    return PEPPER_IDS[Math.floor(Math.random() * this.typeCount)];
  }

  _ensurePlayability() {
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this.findValidMoves().length > 0) return;
      this.generate();
    }
  }

  getCell(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 0;
    return this.grid[row][col];
  }

  setCell(col, row, value) {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      this.grid[row][col] = value;
    }
  }

  findGroup(col, row) {
    const type = this.getCell(col, row);
    if (type === 0) return [];

    const visited = new Set();
    const group = [];
    const queue = [[col, row]];

    while (queue.length > 0) {
      const [c, r] = queue.shift();
      const key = c * 100 + r;
      if (visited.has(key)) continue;
      if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) continue;
      if (this.grid[r][c] !== type) continue;

      visited.add(key);
      group.push({ col: c, row: r });

      queue.push([c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]);
    }

    return group;
  }

  removeGroup(group) {
    for (const { col, row } of group) {
      this.grid[row][col] = 0;
    }
  }

  applyGravity() {
    for (let c = 0; c < this.cols; c++) {
      let writeRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] !== 0) {
          if (writeRow !== r) {
            this.grid[writeRow][c] = this.grid[r][c];
            this.grid[r][c] = 0;
          }
          writeRow--;
        }
      }
      while (writeRow >= 0) {
        this.grid[writeRow][c] = 0;
        writeRow--;
      }
    }
  }

  collapseColumns() {
    let writeCol = 0;
    for (let c = 0; c < this.cols; c++) {
      if (!this._isColumnEmpty(c)) {
        if (writeCol !== c) {
          for (let r = 0; r < this.rows; r++) {
            this.grid[r][writeCol] = this.grid[r][c];
            this.grid[r][c] = 0;
          }
        }
        writeCol++;
      }
    }
  }

  _isColumnEmpty(col) {
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r][col] !== 0) return false;
    }
    return true;
  }

  findValidMoves() {
    const visited = new Set();
    const moves = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === 0) continue;
        const key = c * 100 + r;
        if (visited.has(key)) continue;

        const group = this.findGroup(c, r);
        for (const { col, row } of group) {
          visited.add(col * 100 + row);
        }

        if (group.length >= 2) {
          moves.push(group);
        }
      }
    }

    return moves;
  }

  isGameOver() {
    return this.findValidMoves().length === 0;
  }

  getPepperType(id) {
    return Object.values(PEPPER_TYPES).find(p => p.id === id) || null;
  }

  static calculateScore(groupSize) {
    if (groupSize < 2) return 0;
    return groupSize * (groupSize - 1);
  }
}
