// Screen overlays for Title, Pause, Game Over, and Victory
// Pure vanilla JavaScript rendering

export class Screen {
    /**
     * Render the title screen
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} time - Current time for animation (blinking text)
     */
    static renderTitle(ctx, time) {
        const ctx2d = ctx;

        // Dark blue sky background
        ctx2d.fillStyle = '#000000';
        ctx2d.fillRect(0, 0, 256, 240);

        // Ground
        ctx2d.fillStyle = '#00A800';
        ctx2d.fillRect(0, 200, 256, 40);

        // Brown dirt
        ctx2d.fillStyle = '#A0522D';
        ctx2d.fillRect(0, 210, 256, 30);

        // Draw pixel clouds (simple)
        ctx2d.fillStyle = '#FFFFFF';
        ctx2d.fillRect(40, 40, 32, 16);
        ctx2d.fillRect(36, 48, 40, 8);
        ctx2d.fillRect(180, 30, 48, 16);
        ctx2d.fillRect(176, 38, 56, 8);

        // Draw small bushes
        ctx2d.fillStyle = '#00A800';
        ctx2d.fillRect(20, 188, 24, 12);
        ctx2d.fillRect(100, 188, 32, 12);
        ctx2d.fillRect(180, 188, 24, 12);

        // "SUPER MARIO" title (large pixel text effect)
        ctx2d.fillStyle = '#FC0000';
        ctx2d.font = 'bold 24px monospace';
        ctx2d.textAlign = 'center';
        ctx2d.fillText('SUPER', 128, 70);

        ctx2d.fillStyle = '#FFFFFF';
        ctx2d.fillText('MARIO', 128, 95);

        // "WORLD 1" subtitle
        ctx2d.font = '12px monospace';
        ctx2d.fillStyle = '#FFFFFF';
        ctx2d.fillText('WORLD 1', 128, 120);

        // Blinking "PRESS SPACE TO START"
        const blink = Math.floor(time / 500) % 2 === 0;
        if (blink) {
            ctx2d.font = '10px monospace';
            ctx2d.fillStyle = '#FFFFFF';
            ctx2d.fillText('PRESS SPACE TO START', 128, 160);
        }

        // Draw Mario sprite (standing)
        this.drawMarioStanding(ctx2d, 120, 170);

        ctx2d.textAlign = 'left';
    }

    /**
     * Draw Mario standing sprite (simplified)
     */
    static drawMarioStanding(ctx, x, y) {
        // Hat (red)
        ctx.fillStyle = '#FC0000';
        ctx.fillRect(x, y, 16, 4);
        ctx.fillRect(x + 2, y + 4, 12, 4);

        // Face (skin)
        ctx.fillStyle = '#FCB8A0';
        ctx.fillRect(x + 4, y + 8, 8, 6);

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 10, 2, 2);
        ctx.fillRect(x + 10, y + 10, 2, 2);

        // Mustache
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x + 5, y + 13, 7, 2);

        // Overalls (blue)
        ctx.fillStyle = '#0000FC';
        ctx.fillRect(x + 2, y + 14, 12, 6);

        // Shirt (red)
        ctx.fillStyle = '#FC0000';
        ctx.fillRect(x + 4, y + 14, 8, 4);

        // Hands (skin)
        ctx.fillStyle = '#FCB8A0';
        ctx.fillRect(x, y + 14, 2, 4);
        ctx.fillRect(x + 14, y + 14, 2, 4);

        // Legs (brown)
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x + 4, y + 20, 3, 4);
        ctx.fillRect(x + 9, y + 20, 3, 4);

        // Shoes (red)
        ctx.fillStyle = '#FC0000';
        ctx.fillRect(x + 2, y + 24, 4, 2);
        ctx.fillRect(x + 10, y + 24, 4, 2);
    }

    /**
     * Render the pause screen overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    static renderPause(ctx) {
        const ctx2d = ctx;

        // Semi-transparent overlay
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx2d.fillRect(0, 0, 256, 240);

        // "PAUSED" text
        ctx2d.font = 'bold 20px monospace';
        ctx2d.textAlign = 'center';
        ctx2d.fillStyle = '#FFFFFF';
        ctx2d.fillText('PAUSED', 128, 115);

        ctx2d.font = '10px monospace';
        ctx2d.fillText('PRESS ESC TO RESUME', 128, 145);

        ctx2d.textAlign = 'left';
    }

    /**
     * Render the game over screen
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} time - Current time for animation (blinking text)
     */
    static renderGameOver(ctx, time) {
        const ctx2d = ctx;

        // Darken background
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx2d.fillRect(0, 0, 256, 240);

        // "GAME OVER" text in red
        ctx2d.font = 'bold 20px monospace';
        ctx2d.textAlign = 'center';
        ctx2d.fillStyle = '#FC0000';
        ctx2d.fillText('GAME OVER', 128, 100);

        // "PRESS SPACE TO RETRY" blinking
        const blink = Math.floor(time / 500) % 2 === 0;
        if (blink) {
            ctx2d.font = '10px monospace';
            ctx2d.fillStyle = '#FFFFFF';
            ctx2d.fillText('PRESS SPACE TO RETRY', 128, 140);
        }

        ctx2d.textAlign = 'left';
    }

    /**
     * Render the victory screen
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} score - Final score
     * @param {number} time - Current time for animation
     */
    static renderVictory(ctx, score, time) {
        const ctx2d = ctx;

        // Dark blue sky background
        ctx2d.fillStyle = '#000000';
        ctx2d.fillRect(0, 0, 256, 240);

        // Stars background
        ctx2d.fillStyle = '#FFFFFF';
        for (let i = 0; i < 50; i++) {
            const sx = (i * 37 + Math.floor(time / 100)) % 256;
            const sy = (i * 23) % 180;
            ctx2d.fillRect(sx, sy, 2, 2);
        }

        // "YOU WIN!" text in yellow
        ctx2d.font = 'bold 24px monospace';
        ctx2d.textAlign = 'center';
        ctx2d.fillStyle = '#F8D800';
        ctx2d.fillText('YOU WIN!', 128, 60);

        // Score tally
        ctx2d.font = '12px monospace';
        ctx2d.fillStyle = '#FFFFFF';
        ctx2d.fillText('FINAL SCORE', 128, 100);

        ctx2d.font = '16px monospace';
        ctx2d.fillStyle = '#F8D800';
        ctx2d.fillText(String(Math.floor(score)).padStart(6, '0'), 128, 120);

        // Score animation (counting up effect)
        const displayScore = Math.min(score, Math.floor(time / 50));

        // Congratulations text
        ctx2d.font = '10px monospace';
        ctx2d.fillStyle = '#00A800';
        ctx2d.fillText('CONGRATULATIONS!', 128, 155);

        // "PRESS SPACE TO PLAY AGAIN" blinking
        const blink = Math.floor(time / 500) % 2 === 0;
        if (blink) {
            ctx2d.fillStyle = '#FFFFFF';
            ctx2d.fillText('PRESS SPACE TO PLAY AGAIN', 128, 180);
        }

        // Draw trophy/flag
        this.drawTrophy(ctx2d, 120, 195);

        ctx2d.textAlign = 'left';
    }

    /**
     * Draw a simple trophy icon
     */
    static drawTrophy(ctx, x, y) {
        // Cup body
        ctx.fillStyle = '#F8D800';
        ctx.fillRect(x, y, 16, 10);
        ctx.fillRect(x + 2, y + 10, 12, 4);

        // Handles
        ctx.fillStyle = '#F8D800';
        ctx.fillRect(x - 2, y + 2, 4, 6);
        ctx.fillRect(x + 14, y + 2, 4, 6);

        // Base
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x + 4, y + 14, 8, 4);
        ctx.fillRect(x + 2, y + 18, 12, 2);
    }
}
