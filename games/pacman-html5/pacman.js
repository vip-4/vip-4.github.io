class Pacman {
    constructor(x, y, width, height, speed) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.speed = speed
        this.direction = direction_right
        this.nextDirection = this.direction
        this.currentFrame = 1
        this.frameCount = 7

        setInterval(() => {
            this.changeAnimation()
        }, 100)
    }

    process() {
        this.changeDirection()
        this.moveForwards()
        if (this.checkCollision()) {
            this.undoLastMovement()
            return
        }

    }

    eat() {
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[0].length; j++) {
                if (map[i][j] === 2 && this.getMapX() === j && this.getMapY() === i) {
                    map[i][j] = 0;
                    score++
                }
            }
        }

    }

    moveForwards() {
        switch (this.direction) {
            case direction_up:
                this.y -= this.speed
                break
            case direction_down:
                this.y += this.speed
                break
            case direction_left:
                this.x -= this.speed
                if (this.x < 0) {
                    this.x = (map[0].length - 1) * oneBlockSize
                }
                break
            case direction_right:
                this.x += this.speed
                if (this.x > (map[0].length - 1) * oneBlockSize) {
                    this.x = 0
                }
                break
        }

    }

    undoLastMovement() {
        switch (this.direction) {
            case direction_up:
                this.y += this.speed;
                break;
            case direction_down:
                this.y -= this.speed;
                break;
            case direction_left:
                this.x += this.speed;
                break;
            case direction_right:
                this.x -= this.speed;
                break;
        }
    }

    checkCollision() {
        let isCollided = false
        if (
            map[this.getMapY()][this.getMapX()] === 1 ||
            map[this.getMapY()][this.getMapXRightSide()] === 1 ||
            map[this.getMapYRightSide()][this.getMapXRightSide()] === 1 ||
            map[this.getMapYRightSide()][this.getMapX()] === 1
        ) {
            isCollided = true;
        }

        return isCollided

    }

    checkGhostCollision() {
        for (let i = 0; i < ghosts.length; i++) {
            let ghost = ghosts[i];
            if (ghost.getMapX() == this.getMapX() && ghost.getMapY() == this.getMapY()) {
                return true;
            }
        }
        return false;
    }




    changeDirection() {
        if (this.direction === this.nextDirection) return

        let currentDirection = this.direction
        this.direction = this.nextDirection
        this.moveForwards()
        if (this.checkCollision()) {
            this.undoLastMovement()
            this.direction = currentDirection
        } else {
            this.undoLastMovement();
        }

    }

    //Returns pac mans current x posision in the map grid.
    getMapX() {
        return Math.floor(this.x / oneBlockSize);
    }

    //Returns pac mans current y posision in the map grid.
    getMapY() {
        return Math.floor(this.y / oneBlockSize);
    }

    // Returns the X position of pacmans right edge in the map grid
    getMapXRightSide() {
        return Math.floor((this.x + this.width - 1) / oneBlockSize)
    }

    // Returns the Y position of pacmans bottom edge in the map grid
    getMapYRightSide() {
        return Math.floor((this.y + this.height - 1) / oneBlockSize);

    }

    changeAnimation() {
        if (this.currentFrame < this.frameCount) {
            this.currentFrame += 1;
        } else {
            this.currentFrame = 1;
        }
    }

    draw() {
        canvasContext.save()
        canvasContext.translate(this.x + oneBlockSize / 2, this.y + oneBlockSize / 2)
        canvasContext.rotate((this.direction * 90 * Math.PI) / 180)
        canvasContext.translate(-this.x - oneBlockSize / 2, -this.y - oneBlockSize / 2)
        canvasContext.drawImage(
            pacmanAnimation,
            (this.currentFrame - 1) * oneBlockSize,
            0,
            oneBlockSize,
            oneBlockSize,
            this.x,
            this.y,
            this.width,
            this.height
        )
        canvasContext.restore()
    }

}