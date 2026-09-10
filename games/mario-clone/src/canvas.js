// Canvas setup and rendering utilities
export class GameCanvas {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.width = 256;
        this.height = 240;
    }

    getContext() {
        return this.ctx;
    }

    clear(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
    }

    drawPixel(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }

    drawSprite(spriteData, screenX, screenY, palette) {
        if (!spriteData) return;
        const colors = palette || [
            '#5C94FC', '#FC0000', '#A00000', '#FC7F00',
            '#F8B800', '#F8D800', '#00A800', '#B8F810',
            '#000000', '#FCFCFC', '#503000', '#A0A0A0'
        ];
        for (let row = 0; row < spriteData.length; row++) {
            for (let col = 0; col < spriteData[row].length; col++) {
                const colorIndex = spriteData[row][col];
                if (colorIndex !== 0 && colorIndex !== -1) {
                    const color = colors[colorIndex] || colors[0];
                    this.drawPixel(screenX + col, screenY + row, color);
                }
            }
        }
    }
}

export function createCanvas(id) {
    return new GameCanvas();
}
