// Canvas setup
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

// Scale for better visibility
const scale = 20;

// Game variables
let score = 0;
let level = 1;
let lines = 0;
let dropCounter = 0;
let dropInterval = 1000; // Milliseconds
let lastTime = 0;
let gameOver = false;
let isPaused = false;

// Game board (10x20 standard tetris)
const board = createMatrix(10, 20);

// Player object
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    next: null,
    score: 0
};

// Colors for tetrominoes
const colors = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF', // Z
];

// Tetromino shapes
const pieces = {
    'I': [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    'J': [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    'L': [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    'O': [
        [4, 4],
        [4, 4]
    ],
    'S': [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    'T': [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    'Z': [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
};

// Create an empty matrix with given width and height
function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

// Get a random tetromino
function getRandomPiece() {
    const pieces = 'IJLOSTZ';
    const piece = pieces[Math.floor(Math.random() * pieces.length)];
    return createPiece(piece);
}

// Create a piece matrix from type
function createPiece(type) {
    // Return a deep copy of the piece to avoid reference issues
    return JSON.parse(JSON.stringify(pieces[type]));
}

// Reset player position and give a new piece
function playerReset() {
    // Get the next piece or a random one if none exists
    player.matrix = player.next || getRandomPiece();
    player.next = getRandomPiece();

    // Position the piece at the top center
    player.pos.y = 0;
    // Ensure precise centering for all piece types
    player.pos.x = Math.floor(board[0].length / 2) - Math.floor(player.matrix[0].length / 2);

    // If we immediately collide, the game is over
    if (checkCollision()) {
        gameOver = true;
        updateScores();
    }

    // Draw the next piece
    drawNext();
}

// Draw the next piece in the preview area
function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!player.next) return;

    // Center the piece in the preview
    const offsetX = (nextCanvas.width / scale - player.next[0].length) / 2;
    const offsetY = (nextCanvas.height / scale - player.next.length) / 2;

    player.next.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                nextCtx.fillStyle = colors[value];
                nextCtx.fillRect(
                    (x + offsetX) * scale,
                    (y + offsetY) * scale,
                    scale,
                    scale
                );
                nextCtx.strokeStyle = '#222';
                nextCtx.strokeRect(
                    (x + offsetX) * scale,
                    (y + offsetY) * scale,
                    scale,
                    scale
                );
            }
        });
    });
}

// Draw the board and current piece
function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the board
    drawMatrix(board, { x: 0, y: 0 });

    // Draw the current piece
    drawMatrix(player.matrix, player.pos);

    // Draw game over message
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, canvas.height / 3, canvas.width, 60);
        ctx.fillStyle = '#FF0000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    }

    // Draw pause message
    if (isPaused && !gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, canvas.height / 3, canvas.width, 60);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

// Draw a matrix at specified position
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(
                    (x + offset.x) * scale,
                    (y + offset.y) * scale,
                    scale,
                    scale
                );
                ctx.strokeStyle = '#222';
                ctx.strokeRect(
                    (x + offset.x) * scale,
                    (y + offset.y) * scale,
                    scale,
                    scale
                );
            }
        });
    });
}

// Check if current piece position collides with the board
function checkCollision() {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            // Only check for collision if the current cell in the piece matrix is filled
            if (m[y][x] !== 0) {
                // Check if position is outside the board or collides with filled cell
                if (board[y + o.y] === undefined ||
                    board[y + o.y][x + o.x] === undefined ||
                    board[y + o.y][x + o.x] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge the current piece into the board
function merge() {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Move the piece down
function playerDrop() {
    player.pos.y++;
    if (checkCollision()) {
        player.pos.y--;
        merge();
        playerReset();
        clearLines();
        updateScores();
    }
    dropCounter = 0;
}

// Hard drop - place the piece immediately at the lowest possible position
function playerHardDrop() {
    while (!checkCollision()) {
        player.pos.y++;
    }
    player.pos.y--;
    merge();
    playerReset();
    clearLines();
    updateScores();
    dropCounter = 0;
}

// Move the piece left or right
function playerMove(dir) {
    player.pos.x += dir;

    // If there's a collision, move back
    if (checkCollision()) {
        player.pos.x -= dir;
    }

    // Debug the position (can be removed after fixing)
    console.log(`Piece position: x=${player.pos.x}, width=${player.matrix[0].length}, board width=${board[0].length}`);
}

// Rotate the piece
function playerRotate() {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);

    // Wall kick - if rotation causes collision, try to adjust position
    while (checkCollision()) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix.length) {
            rotate(player.matrix, -1); // Rotate back if adjustment fails
            player.pos.x = pos;
            return;
        }
    }
}

// Rotate a matrix
function rotate(matrix, dir = 1) {
    // Transpose the matrix
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    // Reverse rows or columns based on direction
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Check and clear completed lines
function clearLines() {
    let linesCleared = 0;

    // Check each row from bottom to top
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer; // Not a full line, skip
            }
        }

        // If we get here, the row is filled
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y; // Check the same row again

        linesCleared++;
    }

    // Update score based on lines cleared
    if (linesCleared > 0) {
        lines += linesCleared;

        // Calculate points based on the number of lines cleared
        const lineScores = [0, 40, 100, 300, 1200]; // 0, 1, 2, 3, 4 lines
        score += lineScores[linesCleared] * level;

        // Level up every 10 lines
        level = Math.floor(lines / 10) + 1;

        // Increase speed with level
        dropInterval = 1000 - (level - 1) * 50;
        if (dropInterval < 100) {
            dropInterval = 100; // Don't go too fast
        }
    }
}

// Update the score display
function updateScores() {
    document.getElementById('score').textContent = score;
    document.getElementById('lines').textContent = lines;
    document.getElementById('level').textContent = level;
}

// Main game loop
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (!isPaused && !gameOver) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    }

    draw();
    requestAnimationFrame(update);
}

// Toggle pause state
function togglePause() {
    if (!gameOver) {
        isPaused = !isPaused;
    }
}

// Reset the game
function resetGame() {
    board.forEach(row => row.fill(0));
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    gameOver = false;
    isPaused = false;
    playerReset();
    updateScores();
}

// Initialize the game
function init() {
    resetGame();
    update();
}

// Keyboard controls
document.addEventListener('keydown', event => {
    if (gameOver) {
        if (event.key === 'Enter') {
            resetGame();
        }
        return;
    }

    if (isPaused && event.key !== 'p') {
        return;
    }

    switch (event.key) {
        case 'ArrowLeft':
            playerMove(-1);
            break;
        case 'ArrowRight':
            playerMove(1);
            break;
        case 'ArrowDown':
            playerDrop();
            break;
        case 'ArrowUp':
            playerRotate();
            break;
        case ' ':
            playerHardDrop();
            break;
        case 'p':
            togglePause();
            break;
    }
});

// Start/pause button
document.getElementById('start-button').addEventListener('click', () => {
    if (gameOver) {
        resetGame();
    } else {
        togglePause();
    }
});

// Start the game when everything is loaded
window.addEventListener('load', init);