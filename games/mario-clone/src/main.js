// Main game entry point, game loop, and state machine
import { createCanvas } from './canvas.js';
import { InputManager } from './input.js';
import { loadLevel } from './level/levelLoader.js';
import { Camera } from './level/camera.js';
import { Player } from './entities/player.js';
import { Goomba } from './entities/goomba.js';
import { Koopa } from './entities/koopa.js';
import { PiranhaPlant } from './entities/piranha.js';
import { Coin } from './entities/coin.js';
import { Powerup } from './entities/powerup.js';
import { aabbCollision } from './level/collision.js';
import { COLORS, SCREEN, TILE_TYPES, LEVEL_1_1, LEVEL_1_2, LEVEL_1_3, LEVEL_1_4, LEVEL_1_C } from './levels/levels.js';
import { getEntitySpawns } from './levels/entitySpawns.js';
import { HUD } from './ui/hud.js';
import { WorldMap } from './ui/worldMap.js';
import { Screen } from './ui/screen.js';
import { initAudio, resumeAudio, playStompSound, playCoinSound, playPowerupSound, playDeathSound, playFlagpoleSound, playMusic, stopMusic } from './audio.js';

// Game states
const GAME_STATES = {
    TITLE: 'title',
    WORLD_MAP: 'worldMap',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete',
    VICTORY: 'victory'
};

// Level definitions
const LEVELS = {
    '1-1': LEVEL_1_1,
    '1-2': LEVEL_1_2,
    '1-3': LEVEL_1_3,
    '1-4': LEVEL_1_4,
    '1-C': LEVEL_1_C
};

// Target frame rate
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

class Game {
    constructor() {
        this.canvasManager = createCanvas('gameCanvas');
        this.ctx = this.canvasManager.getContext();

        this.input = new InputManager();

        // Game state
        this.state = GAME_STATES.TITLE;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.world = '1-1';
        this.totalTime = 0;

        // Timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsTimer = 0;

        // UI
        this.hud = new HUD();
        this.worldMap = new WorldMap();

        // Level
        this.currentLevel = null;
        this.currentLevelId = '1-1';

        // Player
        this.player = null;

        // Camera
        this.camera = new Camera(256, 240);

        // Entities
        this.enemies = [];
        this.coins_entities = [];
        this.powerups = [];

        // Level complete animation timer
        this.levelCompleteTimer = 0;

        // Delta time tracking
        this.deltaTime = 0;

        // Audio initialized flag
        this.audioInitialized = false;

        this.running = true;
    }

    initAudioOnInteraction() {
        if (!this.audioInitialized) {
            initAudio();
            resumeAudio();
            this.audioInitialized = true;
        }
    }

    loop(currentTime) {
        if (!this.running) return;

        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.deltaTime > 250) {
            this.deltaTime = 250;
        }

        this.frameCount++;
        this.fpsTimer += this.deltaTime;
        if (this.fpsTimer >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }

        this.accumulator += this.deltaTime;

        while (this.accumulator >= FRAME_TIME) {
            this.update(FRAME_TIME);
            this.accumulator -= FRAME_TIME;
        }

        this.render();
        this.input.resetTriggers();

        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        this.totalTime += dt;

        switch (this.state) {
            case GAME_STATES.TITLE:
                this.updateTitle(dt);
                break;
            case GAME_STATES.WORLD_MAP:
                this.updateWorldMap(dt);
                break;
            case GAME_STATES.PLAYING:
                this.updatePlaying(dt);
                break;
            case GAME_STATES.PAUSED:
                this.updatePaused(dt);
                break;
            case GAME_STATES.GAME_OVER:
                this.updateGameOver(dt);
                break;
            case GAME_STATES.LEVEL_COMPLETE:
                this.updateLevelComplete(dt);
                break;
            case GAME_STATES.VICTORY:
                this.updateVictory(dt);
                break;
        }

        this.camera.update(dt);
    }

    updateTitle(dt) {
        if (this.input.isJumpPressed() || this.input.isJustPressed('jump')) {
            this.initAudioOnInteraction();
            this.state = GAME_STATES.WORLD_MAP;
        }
    }

    updateWorldMap(dt) {
        if (this.input.isJustPressed('pause')) {
            this.state = GAME_STATES.PAUSED;
            return;
        }

        const levelSelected = this.worldMap.update(this.input);

        if (levelSelected) {
            const selectedLevel = this.worldMap.getSelectedLevel();
            if (selectedLevel && selectedLevel.unlocked) {
                this.loadLevel(selectedLevel.id);
                this.state = GAME_STATES.PLAYING;
            }
        }
    }

    updatePlaying(dt) {
        if (this.input.isJustPressed('pause')) {
            this.state = GAME_STATES.PAUSED;
            stopMusic();
            return;
        }

        // Update player
        this.player.update(dt, this.input, this.currentLevel);

        // Update enemies
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            if (enemy.type === 'piranha') {
                enemy.setPlayerRef(this.player);
            }
            enemy.update(dt, this.currentLevel);
        }

        // Update coin entities
        for (const coin of this.coins_entities) {
            coin.update(dt);
        }

        // Update powerups
        for (const powerup of this.powerups) {
            if (powerup.state !== 'hidden') {
                powerup.update(dt, this.currentLevel);
            }
        }

        // Check player-enemy collisions
        this.checkEnemyCollisions();

        // Check player-powerup collisions
        this.checkPowerupCollisions();

        // Check player-coin entity collisions
        this.checkCoinEntityCollisions();

        // Check tile coin collection (coins from player.collectCoins)
        this.checkTileCoinCollection();

        // Check for pit death
        if (this.player.isInPit(this.currentLevel)) {
            this.handleDeath();
            return;
        }

        // Check for level completion
        if (this.player.x >= this.currentLevel.getPixelWidth() - 48) {
            this.handleLevelComplete();
            return;
        }

        this.camera.follow(this.player);
    }

    checkEnemyCollisions() {
        const playerBounds = this.player.getBounds();

        for (const enemy of this.enemies) {
            if (!enemy.active || enemy.dying) continue;

            // Skip piranhas that are hidden
            if (enemy.type === 'piranha' && !enemy.isVisible()) continue;

            const enemyBounds = enemy.getBounds();

            if (!aabbCollision(playerBounds, enemyBounds)) continue;

            // Check if player is stomping (falling onto enemy from above)
            if (this.player.velY > 0 && playerBounds.y + playerBounds.height <= enemyBounds.y + enemyBounds.height * 0.5) {
                // Stomp the enemy
                if (enemy.stomp) {
                    enemy.stomp();
                }
                // Bounce player up
                this.player.velY = -8;
                this.player.jumping = true;
                this.score += 100;
                playStompSound();
            } else if (enemy.type === 'koopa' && enemy.canBeKicked && enemy.canBeKicked()) {
                // Kick a stationary shell
                const kickDir = this.player.x < enemy.x ? 1 : -1;
                enemy.kick(kickDir);
                this.score += 100;
                playStompSound();
            } else {
                // Player takes damage
                if (this.player.invincible) {
                    // Star power - kill enemy
                    if (enemy.die) enemy.die();
                    this.score += 200;
                } else if (this.player.powerState !== 'small') {
                    // Shrink to small
                    this.player.powerState = 'small';
                    this.player.height = 16;
                    this.player.invincible = true;
                    this.player.invincibleDuration = 2000;
                    this.player.invincibleTimer = 0;
                } else {
                    // Die
                    this.handleDeath();
                    return;
                }
            }
        }
    }

    checkPowerupCollisions() {
        const playerBounds = this.player.getBounds();

        for (const powerup of this.powerups) {
            if (!powerup.active || powerup.state === 'hidden') continue;

            const powerupBounds = powerup.getBounds();
            if (!aabbCollision(playerBounds, powerupBounds)) continue;

            // Collect the powerup
            powerup.active = false;
            powerup.state = 'hidden';
            this.score += 1000;

            if (powerup.type === 'mushroom') {
                this.player.grow();
            } else if (powerup.type === 'star') {
                this.player.invincible = true;
                this.player.invincibleTimer = 0;
                this.player.invincibleDuration = 10000;
                this.player.powerState = 'star';
            }

            playPowerupSound();
        }
    }

    checkCoinEntityCollisions() {
        const playerBounds = this.player.getBounds();

        for (const coin of this.coins_entities) {
            if (coin.collected || coin.collecting) continue;

            const coinBounds = coin.getBounds();
            if (!aabbCollision(playerBounds, coinBounds)) continue;

            coin.collect();
            this.coins++;
            this.score += 200;
            playCoinSound();

            // Extra life every 100 coins
            if (this.coins % 100 === 0) {
                this.lives++;
            }
        }
    }

    checkTileCoinCollection() {
        if (this.player.coinsCollectedThisFrame > 0) {
            this.coins += this.player.coinsCollectedThisFrame;
            this.score += this.player.coinsCollectedThisFrame * 200;
            if (this.coins % 100 < this.player.coinsCollectedThisFrame) {
                this.lives++;
            }
            this.player.coinsCollectedThisFrame = 0;
        }
    }

    updatePaused(dt) {
        if (this.input.isJustPressed('pause')) {
            this.state = GAME_STATES.PLAYING;
            this.initAudioOnInteraction();
        }
    }

    updateGameOver(dt) {
        if (this.input.isJumpPressed()) {
            this.initAudioOnInteraction();
            this.restartGame();
        }
    }

    updateLevelComplete(dt) {
        this.levelCompleteTimer += dt;

        if (this.levelCompleteTimer >= 2000) {
            this.worldMap.completeLevel(this.currentLevelId);
            stopMusic();

            if (this.worldMap.getCompletedCount() >= this.worldMap.levels.length) {
                this.state = GAME_STATES.VICTORY;
            } else {
                this.state = GAME_STATES.WORLD_MAP;
            }

            this.levelCompleteTimer = 0;
        }
    }

    updateVictory(dt) {
        if (this.input.isJumpPressed()) {
            this.restartGame();
        }
    }

    loadLevel(levelId) {
        const levelData = LEVELS[levelId] || LEVEL_1_1;
        this.currentLevel = loadLevel(levelData);
        this.currentLevelId = levelId;
        this.world = levelId;

        // Reset/create player
        if (this.player) {
            this.player.reset(
                this.currentLevel.playerSpawn.x,
                this.currentLevel.playerSpawn.y
            );
        } else {
            this.player = new Player(
                this.currentLevel.playerSpawn.x,
                this.currentLevel.playerSpawn.y
            );
        }

        // Spawn entities from entitySpawns data
        this.spawnEntities(levelId);

        // Reset camera
        this.camera.setLevelBounds(
            this.currentLevel.getPixelWidth(),
            this.currentLevel.getPixelHeight()
        );
        this.camera.followInstant(this.player);

        // Play level music
        if (this.audioInitialized && levelData.theme) {
            playMusic(levelData.theme);
        }
    }

    spawnEntities(levelId) {
        this.enemies = [];
        this.coins_entities = [];
        this.powerups = [];

        const spawns = getEntitySpawns(levelId);

        for (const spawn of spawns) {
            switch (spawn.type) {
                case 'goomba': {
                    const goomba = new Goomba(spawn.x, spawn.y);
                    this.enemies.push(goomba);
                    break;
                }
                case 'koopa': {
                    const koopa = new Koopa(spawn.x, spawn.y);
                    this.enemies.push(koopa);
                    break;
                }
                case 'piranha': {
                    const piranha = new PiranhaPlant(spawn.x, spawn.y, spawn.pipeHeight || 3);
                    this.enemies.push(piranha);
                    break;
                }
                case 'coin': {
                    const coin = new Coin(spawn.x, spawn.y);
                    this.coins_entities.push(coin);
                    break;
                }
                case 'powerup': {
                    const powerup = new Powerup(spawn.x, spawn.y, spawn.powerupType || 'mushroom');
                    powerup.spawn(); // Make them visible immediately
                    this.powerups.push(powerup);
                    break;
                }
                // Skip unimplemented types (hammerBro, fireBar, bowser, blooper, etc.)
                default:
                    break;
            }
        }
    }

    render() {
        const ctx = this.ctx;

        switch (this.state) {
            case GAME_STATES.TITLE:
                this.renderTitle();
                break;
            case GAME_STATES.WORLD_MAP:
                this.renderWorldMap();
                break;
            case GAME_STATES.PLAYING:
            case GAME_STATES.PAUSED:
                this.renderGameplay();
                if (this.state === GAME_STATES.PAUSED) {
                    Screen.renderPause(ctx);
                }
                break;
            case GAME_STATES.GAME_OVER:
                this.renderGameplay();
                Screen.renderGameOver(ctx, this.totalTime);
                break;
            case GAME_STATES.LEVEL_COMPLETE:
                this.renderGameplay();
                this.renderLevelComplete();
                break;
            case GAME_STATES.VICTORY:
                Screen.renderVictory(ctx, this.score, this.totalTime);
                break;
        }
    }

    renderTitle() {
        Screen.renderTitle(this.ctx, this.totalTime);
    }

    renderWorldMap() {
        this.worldMap.render(this.ctx);
    }

    renderGameplay() {
        const ctx = this.ctx;
        const cameraPos = this.camera.getPosition();

        // Clear with sky color
        this.canvasManager.clear(this.currentLevel.backgroundColor);

        // Render level tiles
        this.currentLevel.render(ctx, cameraPos.x, cameraPos.y);

        // Render coin entities
        for (const coin of this.coins_entities) {
            coin.render(ctx, cameraPos.x, cameraPos.y);
        }

        // Render powerups
        for (const powerup of this.powerups) {
            powerup.render(ctx, cameraPos.x, cameraPos.y);
        }

        // Render enemies
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.render(ctx, cameraPos.x, cameraPos.y);
            }
        }

        // Render player
        this.player.render(ctx, cameraPos.x, cameraPos.y);

        // Render HUD
        const gameState = {
            score: this.score,
            coins: this.coins,
            lives: this.lives,
            world: this.world
        };
        this.hud.render(ctx, gameState);
    }

    renderLevelComplete() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, 256, 240);

        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('LEVEL CLEAR!', 128, 100);

        ctx.font = '10px monospace';
        ctx.fillText(`+1000 POINTS`, 128, 130);
        ctx.textAlign = 'left';
    }

    handleDeath() {
        this.lives--;
        playDeathSound();
        stopMusic();

        if (this.lives <= 0) {
            this.state = GAME_STATES.GAME_OVER;
        } else {
            // Respawn player
            this.player.reset(
                this.currentLevel.playerSpawn.x,
                this.currentLevel.playerSpawn.y
            );
            this.camera.followInstant(this.player);

            // Re-spawn entities
            this.spawnEntities(this.currentLevelId);

            // Resume music
            const levelData = LEVELS[this.currentLevelId];
            if (this.audioInitialized && levelData && levelData.theme) {
                setTimeout(() => playMusic(levelData.theme), 1000);
            }
        }
    }

    handleLevelComplete() {
        this.score += 1000;
        this.state = GAME_STATES.LEVEL_COMPLETE;
        this.levelCompleteTimer = 0;
        playFlagpoleSound();
        stopMusic();
    }

    restartGame() {
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.world = '1-1';
        this.state = GAME_STATES.WORLD_MAP;
        this.totalTime = 0;

        this.worldMap = new WorldMap();
        this.enemies = [];
        this.coins_entities = [];
        this.powerups = [];

        this.loadLevel('1-1');
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    stop() {
        this.running = false;
    }
}

// Initialize and start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
});
