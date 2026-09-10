// systems/dialogue.js — styled dialogue box with typewriter text reveal.
// This is purely presentation: it walks whatever `npc.dialogue` array it's
// given. The actual conversation text lives in config/level-layout.js.

class DialogueSystem {
    constructor() {
        this.active = null;
        this.lineIndex = 0;
        this.charIndex = 0;
        this.charTimer = 0;
        this.onComplete = null;
    }

    isOpen() {
        return this.active !== null;
    }

    open(npc, onComplete) {
        this.active = npc;
        this.lineIndex = 0;
        this.charIndex = 0;
        this.charTimer = 0;
        this.onComplete = onComplete || null;
    }

    advance() {
        const lines = this.active.dialogue;
        const currentLine = lines[this.lineIndex];

        if (this.charIndex < currentLine.length) {
            this.charIndex = currentLine.length;
            return;
        }

        this.lineIndex++;
        this.charIndex = 0;
        this.charTimer = 0;

        if (this.lineIndex >= lines.length) {
            const cb = this.onComplete;
            this.active = null;
            this.lineIndex = 0;

            if (cb) cb();
        }
    }

    update() {
        if (!this.active) return;

        const currentLine = this.active.dialogue[this.lineIndex];

        if (this.charIndex < currentLine.length) {
            this.charTimer++;

            if (this.charTimer >= 1) {
                this.charTimer = 0;
                this.charIndex++;
            }
        }
    }

    draw(ctx, canvasW, canvasH) {
        if (!this.active) return;

        const margin = 24;
        const boxW = canvasW - margin * 2;

        const line = this.active.dialogue[this.lineIndex];
        const shown = line.substring(0, Math.floor(this.charIndex));


        // --- calculate text height dynamically ---
        ctx.font = '14px sans-serif';

        const textLines = this._wrapText(
            ctx,
            shown,
            margin + 20,
            0,
            boxW - 40,
            20,
            true
        );

        const textHeight = Math.max(textLines.length * 20, 20);

        const boxH = Math.max(
            92,
            textHeight + 55
        );

        const boxY = canvasH - boxH - 20;


        ctx.save();


        // dialogue background
        ctx.fillStyle = 'rgba(12,14,10,0.88)';
        roundRect(ctx, margin, boxY, boxW, boxH, 10);
        ctx.fill();

        ctx.strokeStyle = 'rgba(232,228,216,0.35)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, margin, boxY, boxW, boxH, 10);
        ctx.stroke();



        // name tag
        ctx.font = 'bold 13px sans-serif';

        const nameWidth = ctx.measureText(this.active.name).width + 28;

        ctx.fillStyle = '#e8c93c';
        roundRect(
            ctx,
            margin + 14,
            boxY - 14,
            nameWidth,
            26,
            6
        );
        ctx.fill();

        ctx.fillStyle = '#2c2418';
        ctx.textBaseline = 'middle';

        ctx.fillText(
            this.active.name,
            margin + 28,
            boxY - 1
        );



        // text
        ctx.fillStyle = '#f1efe8';
        ctx.font = '14px sans-serif';
        ctx.textBaseline = 'alphabetic';

        this._wrapText(
            ctx,
            shown,
            margin + 20,
            boxY + 28,
            boxW - 40,
            20
        );



        // continue indicator
        if (Math.floor(this.charIndex) >= line.length) {

            ctx.fillStyle = 'rgba(232,228,216,0.6)';
            ctx.font = '11px sans-serif';

            const bounce = Math.sin(Date.now() / 200) * 2;

            ctx.fillText(
                '▼ space / E to continue',
                margin + boxW - 150,
                boxY + boxH - 12 + bounce
            );
        }


        ctx.restore();
    }



    _wrapText(ctx, text, x, y, maxWidth, lineHeight, returnLines = false) {

        const words = text.split(' ');
        const lines = [];

        let line = '';

        for (let n = 0; n < words.length; n++) {

            const testLine = line + words[n] + ' ';

            if (
                ctx.measureText(testLine).width > maxWidth &&
                n > 0
            ) {
                lines.push(line.trim());
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }


        if (line.trim()) {
            lines.push(line.trim());
        }



        if (returnLines) {
            return lines;
        }



        lines.forEach((l, i) => {
            ctx.fillText(
                l,
                x,
                y + i * lineHeight
            );
        });

        return lines;
    }
}
