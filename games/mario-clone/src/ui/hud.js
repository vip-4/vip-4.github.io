// Heads-up Display for Mario game
// Renders score, coins, world, lives, and time at top of screen

export class HUD {
    constructor() {
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.world = '1-1';
        this.time = 0;
        this.timeLimit = 0; // 0 means no time limit
    }

    /**
     * Update HUD with game state
     */
    update(gameState) {
        if (gameState.score !== undefined) this.score = gameState.score;
        if (gameState.coins !== undefined) this.coins = gameState.coins;
        if (gameState.lives !== undefined) this.lives = gameState.lives;
        if (gameState.world !== undefined) this.world = gameState.world;
        if (gameState.time !== undefined) this.time = gameState.time;
        if (gameState.timeLimit !== undefined) this.timeLimit = gameState.timeLimit;
    }

    /**
     * Render HUD at top of screen
     */
    render(ctx, gameState) {
        // Update from game state
        this.update(gameState);

        const ctx2d = ctx;

        // HUD background (semi-transparent black bar)
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx2d.fillRect(0, 0, 256, 24);

        // Set text properties
        ctx2d.font = '8px monospace';
        ctx2d.textBaseline = 'top';

        // Score section (top-left)
        ctx2d.fillStyle = '#FFFFFF';
        ctx2d.fillText('MARIO', 4, 4);

        ctx2d.fillStyle = '#FFFFFF';
        ctx2d.fillText(this.formatScore(this.score), 4, 14);

        // Coins section (center-left)
        this.drawCoinIcon(ctx2d, 86, 14);
        ctx2d.fillStyle = '#FFFFFF';
        ctx2d.fillText(`×${this.coins}`, 94, 14);

        // World section (center)
        ctx2d.fillStyle = '#FFFFFF';
        ctx2d.textAlign = 'center';
        ctx2d.fillText(`WORLD ${this.world}`, 128, 4);

        // Lives section (top-right)
        ctx2d.textAlign = 'right';
        ctx2d.fillText('MARIO', 232, 4);

        // Draw mini Mario head icons for lives
        for (let i = 0; i < this.lives; i++) {
            this.drawMiniMario(ctx2d, 232 - (this.lives - 1 - i) * 10, 14);
        }

        // Time section (right of coins if there's a time limit)
        if (this.timeLimit > 0) {
            ctx2d.textAlign = 'left';
            ctx2d.fillStyle = this.time <= 100 ? '#FC0000' : '#FFFFFF';
            ctx2d.fillText(`TIME`, 140, 14);
            ctx2d.fillText(`${Math.ceil(this.time / 1000)}`, 166, 14);
        }

        ctx2d.textAlign = 'left';
    }

    /**
     * Draw a coin icon (small yellow circle)
     */
    drawCoinIcon(ctx, x, y) {
        ctx.fillStyle = '#F8D800';
        ctx.beginPath();
        ctx.arc(x + 4, y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F8B800';
        ctx.beginPath();
        ctx.arc(x + 4, y + 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw mini Mario head icon
     */
    drawMiniMario(ctx, x, y) {
        // Simple Mario head representation
        // Red cap
        ctx.fillStyle = '#FC0000';
        ctx.fillRect(x, y, 8, 3);
        ctx.fillRect(x + 1, y + 3, 6, 2);

        // Skin face
        ctx.fillStyle = '#FCB8A0';
        ctx.fillRect(x + 2, y + 5, 4, 3);

        // Blue overalls hint
        ctx.fillStyle = '#0000FC';
        ctx.fillRect(x + 2, y + 8, 4, 2);
    }

    /**
     * Format score with leading zeros (6 digits)
     */
    formatScore(score) {
        return String(Math.floor(score)).padStart(6, '0');
    }
}
