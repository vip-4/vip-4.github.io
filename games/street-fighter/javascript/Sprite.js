class Sprite {
    constructor({
        position,
        imageSrc,
        scale = 1,
        framesMax = 1,
        framesRows = 1,
        imageCols,
        offset = { x: 0, y: 0 }
    }) {
        this.position = position;
        this.width = 50;
        this.height = 150;
        this.image = new Image();
        this.image.src = imageSrc;
        this.scale = scale;
        this.framesMax = framesMax;
        this.framesRows = framesRows;
        this.frameY = 0;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 15;
        this.offset = offset;
        this.imageCols = imageCols || framesMax;
        this.shouldFlip = false;
    }

    draw() {
        if (!this.image.width) return;

        const frameWidth = this.image.width / this.imageCols;
        const frameHeight = this.image.height / this.framesRows;

        c.save();

        let x = this.position.x - this.offset.x;
        let y = this.position.y - this.offset.y;
        let w = frameWidth * this.scale;
        let h = frameHeight * this.scale;

        if (this.shouldFlip) {
            c.translate(x + w, y);
            c.scale(-1, 1);
            x = 0;
            y = 0;
        }

        c.drawImage(
            this.image,
            Math.floor(this.framesCurrent) * frameWidth,
            Math.floor(this.frameY) * frameHeight,
            frameWidth,
            frameHeight,
            Math.round(x),
            Math.round(y),
            Math.round(w),
            Math.round(h)
        );

        c.restore();
    }



    animateFrames() {
        this.framesElapsed++;

        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++;
            } else {
                this.framesCurrent = 0;
            }
        }
    }

    update() {
        this.draw();
        this.animateFrames();
    }
}
