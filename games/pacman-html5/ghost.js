class Ghost {
    constructor(x, y, width, height, speed, imageX, imageY, imageWidth, imageHeight, range) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.speed = speed
        this.direction = direction_right
        this.imageX = imageX
        this.imageY = imageY
        this.imageWidth = imageWidth
        this.imageHeight = imageHeight
        this.range = range
        this.randomCornerIndex = Math.floor(Math.random() * 4)
        this.target = randomCornersForGhosts[this.randomCornerIndex];
        setInterval(() => {
            this.changeRandomDirection();
        }, 5000);
    }

    process() {
        if (this.isInRange()) {
            this.target = pacman;
        } else {
            this.target = randomCornersForGhosts[this.randomCornerIndex];
        }
        this.changeDirection();
        this.moveForwards();
        if (this.checkCollision()) {
            this.undoLastMovement();
            return;
        }
    }



    isInRange() {
        let xDistance = Math.abs(pacman.getMapX() - this.getMapX());
        let yDistance = Math.abs(pacman.getMapY() - this.getMapY());
        if (Math.sqrt(xDistance ** 2 + yDistance ** 2) <= this.range) {
            return true;
        }
        return false;
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
                break
            case direction_right:
                this.x += this.speed
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




    changeDirection() {
        let currentDirection = this.direction

        this.direction = this.newDirection(map, Math.floor(this.target.x / oneBlockSize), Math.floor(this.target.y / oneBlockSize)
        );
        if (typeof this.direction === "undefined") {
            this.direction = currentDirection;
            return;
        }

        this.moveForwards();
        if (this.checkCollision()) {
            this.undoLastMovement();
            this.direction = currentDirection;
        } else {
            this.undoLastMovement();
        }
    }


    changeRandomDirection() {
        this.randomCornerIndex = Math.floor(Math.random() * 4);
    }


    newDirection(map, destX, destY) {
        let visited = [];
        for (let i = 0; i < map.length; i++) {
            visited[i] = map[i].slice();
        }

        let queue = [
            {
                x: this.getMapX(),
                y: this.getMapY(),
                moves: []
            }
        ];
        while (queue.length > 0) {
            let current = queue.shift();
            if (current.x == destX && current.y == destY) {
                return current.moves[0];
            }
            visited[current.y][current.x] = 1
            let neighbors = this.addNeighbors(current, visited)
            for (let neighbor of neighbors) {
                queue.push(neighbor);
            }
        }
        return this.direction
    }

    addNeighbors(current, visited) {
        let neighbors = [];
        let numOfRows = visited.length;
        let numOfCols = visited[0].length;

        if (current.x > 0 && visited[current.y][current.x - 1] != 1) {
            let moves = current.moves.slice()
            moves.push(direction_left);
            neighbors.push({ x: current.x - 1, y: current.y, moves: moves })
        }
        if (current.x < numOfCols - 1 && visited[current.y][current.x + 1] != 1) {
            let moves = current.moves.slice()
            moves.push(direction_right);
            neighbors.push({ x: current.x + 1, y: current.y, moves: moves })
        }
        if (current.y > 0 && visited[current.y - 1][current.x] != 1) {
            let moves = current.moves.slice()
            moves.push(direction_up);
            neighbors.push({ x: current.x, y: current.y - 1, moves: moves })
        }
        if (current.y < numOfRows - 1 && visited[current.y + 1][current.x] != 1) {
            let moves = current.moves.slice()
            moves.push(direction_down);
            neighbors.push({ x: current.x, y: current.y + 1, moves: moves })
        }
        return neighbors
    }


    getMapX() {
        return Math.floor(this.x / oneBlockSize);
    }

    getMapY() {
        return Math.floor(this.y / oneBlockSize);
    }

    getMapXRightSide() {
        return Math.floor((this.x + this.width - 1) / oneBlockSize)
    }

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
        canvasContext.drawImage(
            ghostAnimation,
            this.imageX,
            this.imageY,
            this.imageWidth,
            this.imageHeight,
            this.x,
            this.y,
            this.width,
            this.height
        )
        canvasContext.restore()
    }

}