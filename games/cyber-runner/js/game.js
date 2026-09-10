/**
 * Main Game Class for Cyber Runner
 * Manages game state, loop, and coordination between systems
 */

class Game {
    constructor(canvasId) {
        // Canvas setup
        this.canvas = document.getElementById(canvasId);
        this.resizeCanvas();
        
        // Game state
        this.state = 'menu'; // menu, playing, gameover
        this.score = 0;
        this.highScore = Utils.getHighScore();
        this.paused = false;
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Death animation
        this.deathAnimationProgress = 0;
        this.deathAnimationDuration = 500;
        
        // Initialize systems
        this.assets = new Assets();
        this.audio = new AudioSystem();
        this.renderer = new Renderer(this.canvas);
        this.world = new World(this.canvas.width, this.canvas.height);
        this.player = new Player(100, this.world.groundY - 48);
        
        // Initialize all systems
        this.renderer.init(this.assets);
        this.world.init(this.assets);
        this.player.init(this.assets);
        
        // Input state
        this.keys = {
            jump: false,
            jumpPressed: false
        };
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouch = this.handleTouch.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup UI
        this.setupUI();
        
        // Display high score
        this.updateHighScoreDisplay();
        
        // Start game loop
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Maintain aspect ratio
        const aspectRatio = 800 / 600;
        let width = rect.width;
        let height = rect.height;
        
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }
        
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        // Touch
        this.canvas.addEventListener('touchstart', this.handleTouch, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.canvas.addEventListener('mousedown', this.handleTouch);
        this.canvas.addEventListener('mouseup', this.handleTouchEnd);
        
        // Window
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    /**
     * Setup UI buttons
     */
    setupUI() {
        // Play button
        const playButton = document.getElementById('play-button');
        if (playButton) {
            playButton.addEventListener('click', () => this.startGame());
        }
        
        // Restart button
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => this.startGame());
        }
        
        // Mute button
        const muteButton = document.getElementById('mute-button');
        if (muteButton) {
            muteButton.addEventListener('click', () => {
                const muted = this.audio.toggleMute();
                muteButton.textContent = muted ? '🔇' : '🔊';
            });
        }
    }

    /**
     * Handle keyboard down
     */
    handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            
            if (this.state === 'menu') {
                this.startGame();
            } else if (this.state === 'gameover' && this.deathAnimationProgress >= 1) {
                // Only allow restart after death animation completes
                this.startGame();
            } else if (this.state === 'playing') {
                if (!this.keys.jumpPressed) {
                    this.keys.jumpPressed = true;
                    this.player.jump(this.audio);
                }
                this.keys.jump = true;
            }
        }
    }

    /**
     * Handle keyboard up
     */
    handleKeyUp(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            this.keys.jump = false;
            this.keys.jumpPressed = false;
            this.player.releaseJump();
        }
    }

    /**
     * Handle touch/click
     */
    handleTouch(e) {
        e.preventDefault();
        
        if (this.state === 'playing') {
            if (!this.keys.jumpPressed) {
                this.keys.jumpPressed = true;
                this.player.jump(this.audio);
            }
            this.keys.jump = true;
        }
    }

    /**
     * Handle touch/click end
     */
    handleTouchEnd(e) {
        this.keys.jump = false;
        this.keys.jumpPressed = false;
        this.player.releaseJump();
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.resizeCanvas();
        if (this.renderer) {
            this.renderer.resize(this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Handle tab visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.paused = true;
        } else {
            this.paused = false;
            this.lastTime = performance.now();
        }
    }

    /**
     * Start/restart game
     */
    startGame() {
        // Initialize audio on first interaction
        this.audio.init();
        this.audio.startMusic();
        
        // Reset game state
        this.state = 'playing';
        this.score = 0;
        this.deathAnimationProgress = 0;
        
        // Reset world and player
        this.world.reset();
        this.player.reset(100, this.world.groundY - 48);
        
        // Hide menus, show HUD
        this.showElement('start-menu', false);
        this.showElement('game-over', false);
        this.showElement('hud', true);
        this.showElement('mute-button', true);
        
        // Resume music if paused
        this.audio.resumeMusic();
        
        // Update displays
        this.updateScoreDisplay();
    }

    /**
     * End game
     */
    gameOver() {
        this.state = 'gameover';
        this.audio.play('death');
        this.audio.pauseMusic();
        
        // Update high score
        Utils.setHighScore(Math.floor(this.score));
        this.highScore = Utils.getHighScore();
        
        // Start death animation
        this.deathAnimationProgress = 0;
        
        // Show game over after animation
        setTimeout(() => {
            this.showElement('hud', false);
            this.showElement('mute-button', false);
            this.showElement('game-over', true);
            
            document.getElementById('final-score').textContent = Utils.formatScore(this.score);
            document.getElementById('game-over-high-score').textContent = Utils.formatScore(this.highScore);
        }, this.deathAnimationDuration);
    }

    /**
     * Main game loop
     */
    gameLoop(timestamp) {
        // Calculate delta time
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Cap delta time to prevent huge jumps
        if (this.deltaTime > 100) this.deltaTime = 16.67;
        
        // Update and render based on state
        if (!this.paused) {
            if (this.state === 'playing') {
                this.update();
            } else if (this.state === 'gameover' && this.deathAnimationProgress < 1) {
                this.deathAnimationProgress += this.deltaTime / this.deathAnimationDuration;
            }
            
            this.render();
        }
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Update game state
     */
    update() {
        // Handle variable jump height
        if (this.keys.jump) {
            this.player.holdJump(this.deltaTime);
        }
        
        const previousY = this.player.y;
        const wasGrounded = this.player.grounded;
        
        // Update world
        this.world.update(this.deltaTime);
        
        // Check if player is currently over a building (using feet position)
        const playerFeetX = this.player.x + this.player.width / 2;
        const currentBuilding = this.world.getBuildingAt(playerFeetX, 1);
        
        // Determine ground level
        let groundY;
        if (currentBuilding) {
            groundY = currentBuilding.y;
        } else {
            // No building under player - they should fall
            groundY = this.canvas.height + 500;
        }
        
        // If player was grounded but walked off edge, start falling
        if (wasGrounded && !currentBuilding) {
            this.player.grounded = false;
        }
        
        // Update player physics
        this.player.update(this.deltaTime, groundY);
        
        // Check landing on buildings (when falling)
        if (!wasGrounded && this.player.velocityY > 0 && currentBuilding) {
            // Check if player just crossed the rooftop level (landing on top)
            if (previousY + this.player.height <= currentBuilding.y + 5 && 
                this.player.y + this.player.height >= currentBuilding.y) {
                // Only land if player was falling from above - not coming from the side
                // Check if player's center was above the building when they started falling
                if (previousY < currentBuilding.y) {
                    this.player.landOnBuilding(currentBuilding.y, this.audio);
                } else {
                    // Coming from below or side - should die
                    this.player.die();
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Check for side collision with buildings (hitting the wall)
        // Look for buildings ahead that the player might be colliding with from the side
        for (const building of this.world.buildings) {
            if (!building.active) continue;
            
            // Check if player is to the left of the building and overlapping vertically
            const playerRight = this.player.x + this.player.width;
            const playerBottom = this.player.y + this.player.height;
            
            // Player hitting left side of building
            if (playerRight > building.x && 
                this.player.x < building.x &&
                playerBottom > building.y + 10 &&  // Below rooftop level (with small tolerance)
                this.player.y < this.canvas.height) {
                // Hit the side of a building - die!
                this.player.die();
                this.gameOver();
                return;
            }
        }
        
        // Check if fell off screen
        if (this.player.y > this.canvas.height + 50) {
            this.player.die();
            this.gameOver();
            return;
        }
        
        // Update score (distance-based)
        this.score += (this.world.scrollSpeed / 10) * (this.deltaTime / 16.67);
        
        // Update HUD
        this.updateScoreDisplay();
        this.updateSpeedDisplay();
    }

    /**
     * Render game
     */
    render() {
        this.renderer.render(this);
    }

    /**
     * Update score display
     */
    updateScoreDisplay() {
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = Utils.formatScore(this.score);
        }
    }

    /**
     * Update speed display
     */
    updateSpeedDisplay() {
        const speedDisplay = document.getElementById('speed-display');
        if (speedDisplay) {
            speedDisplay.textContent = this.world.getSpeedMultiplier().toFixed(1) + 'x';
        }
    }

    /**
     * Update high score display
     */
    updateHighScoreDisplay() {
        const displays = ['high-score-display', 'game-over-high-score'];
        for (const id of displays) {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = Utils.formatScore(this.highScore);
            }
        }
    }

    /**
     * Show/hide element
     */
    showElement(id, show) {
        const el = document.getElementById(id);
        if (el) {
            if (show) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    }
}
