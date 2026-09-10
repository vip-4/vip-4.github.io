// Game Constants
const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');

// Colors
const COLOR_BLACK = 'rgb(0,0,0)';
const COLOR_PLAYER = '#9A2AFF'; // Purple
const COLOR_PLAYER_PROJECTILE = '#00FFFF'; // Cyan
const COLOR_ENEMY_REGULAR = '#FF00FF'; // Magenta
const COLOR_ENEMY_ELITE = '#FFD700'; // Gold
const COLOR_XP_GEM_REGULAR = '#39FF14'; // Lime
const COLOR_XP_GEM_ELITE = '#FFD700'; // Gold
const COLOR_PARTICLE_NORMAL = '#E0FFFF'; // Pale Cyan
const COLOR_PARTICLE_EXPLOSION_ENEMY = '#FF00FF'; // Magenta
const COLOR_PARTICLE_EXPLOSION_ELITE = '#FFD700'; // Gold
const COLOR_PARTICLE_HIT = 'rgba(255,255,255,0.8)'; // White
const COLOR_UPGRADE_HIGHLIGHT = '#00FFFF'; // Cyan

// Game Settings
const FPS = 60;
const TARGET_FRAME_TIME = 1000 / FPS;
const GAME_PADDING = 50; // Extra padding for enemy spawning/despawning

// Player Settings
const PLAYER_RADIUS = 15;
const PLAYER_SPEED_BASE = 100; // Pixels per second
const PLAYER_FIRE_RATE_BASE = 0.2; // Seconds per shot
const PLAYER_PROJECTILE_SPEED = 300; // Pixels per second
const PLAYER_PROJECTILE_DAMAGE_BASE = 10;
const PLAYER_MAX_HEALTH_BASE = 100;

// Enemy Settings
const ENEMY_SPAWN_INTERVAL_BASE = 3; // Seconds
const ENEMY_SPEED_BASE = 50; // Pixels per second
const ENEMY_HEALTH_BASE = 10;
const ENEMY_RADIUS_BASE = 12;
const ENEMY_XP_VALUE_BASE = 20;
const ELITE_SPAWN_CHANCE = 0.1; // 10%
const ELITE_HEALTH_MULTIPLIER = 3;
const ELITE_XP_MULTIPLIER = 5;
const ELITE_SPEED_MULTIPLIER = 1.2;
const ELITE_RADIUS_MULTIPLIER = 1.3;

// XP Gem Settings
const XP_GEM_RADIUS = 5;
const XP_GEM_VALUE_BASE = 1;
const XP_GEM_ELITE_VALUE = 20; // Specific value for elite gems
let XP_GEM_PULL_SPEED = 300; // Pixels per second towards player

// Particle Settings
const PARTICLE_LIFETIME_BASE = 0.5; // Seconds
const PARTICLE_SPEED_MAX = 150;
const PARTICLE_COUNT_ENEMY_DEATH = 25;
const PARTICLE_COUNT_HIT = 5;
const PARTICLE_COUNT_XP_SPARKLE = 10;
const PARTICLE_RADIUS_MIN = 2;
const PARTICLE_RADIUS_MAX = 4;

// Screen Shake Settings
const SHAKE_DURATION = 0.1; // Seconds
const SHAKE_INTENSITY = 5; // Pixels offset

// Game State Variables
let lastFrameTime = 0;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let gamePaused = false;
let screenShake = {
    active: false,
    duration: 0,
    intensity: 0,
    elapsed: 0
};

// --- Audio Context Setup ---
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, type, duration, volume = 0.1) {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration); // Fade out
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// --- Core Game Classes ---

class Entity {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.markedForDeletion = false;
    }

    draw(ctx, shadowColor = this.color) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = shadowColor;
        ctx.fill();
        ctx.restore();
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER_RADIUS, COLOR_PLAYER);
        this.maxHealth = PLAYER_MAX_HEALTH_BASE;
        this.health = this.maxHealth;
        this.speed = PLAYER_SPEED_BASE;
        this.fireRate = PLAYER_FIRE_RATE_BASE; // seconds
        this.lastFireTime = 0;
        this.projectileDamage = PLAYER_PROJECTILE_DAMAGE_BASE;
        this.multiShot = 1; // Number of projectiles fired at once
        this.chainLightningChance = 0; // % chance
        this.novaAvailable = false;
        this.projectilePierce = 0;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.updateHealthBar();
    }

    updateHealthBar() {
        const hpFill = document.getElementById('hp-bar-fill');
        const hpText = document.getElementById('hp-text');
        const vignette = document.getElementById('damage-vignette');

        if (hpFill && hpText) {
            const progress = Math.max(0, (this.health / this.maxHealth) * 100);
            hpFill.style.width = `${progress}%`;
            hpText.textContent = `${Math.floor(this.health)} / ${this.maxHealth}`;

            // Critical health styling
            if (progress <= 30) {
                hpFill.style.background = 'linear-gradient(90deg, #FF0000, #FF3300)';
                hpFill.style.boxShadow = '0 0 15px #FF0000';
                if (vignette) vignette.classList.add('critical-health');
            } else {
                hpFill.style.background = 'linear-gradient(90deg, #FF00FF, #FF1493)';
                hpFill.style.boxShadow = '0 0 15px #FF00FF';
                if (vignette) vignette.classList.remove('critical-health');
            }
        }
    }

    update(deltaTime) {
        // Move towards mouse
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 1) {
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed * deltaTime;
            this.y += Math.sin(angle) * this.speed * deltaTime;

            // Clamp player position to canvas bounds
            this.x = Math.max(this.radius, Math.min(CANVAS.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(CANVAS.height - this.radius, this.y));
        }

        // Auto-fire
        this.lastFireTime += deltaTime;
        if (this.lastFireTime >= this.fireRate) {
            this.fire();
            this.lastFireTime = 0;
        }
    }

    fire() {
        playSound(500 + Math.random() * 200, 'sine', 0.05, 0.05); // Player fire sound
        const spreadAngle = Math.PI / 16; // Small spread for multi-shot

        for (let i = 0; i < this.multiShot; i++) {
            // Generate a completely random angle for each shot or base angle
            const baseAngle = Math.random() * Math.PI * 2;
            let angleOffset = 0;
            if (this.multiShot > 1) {
                angleOffset = (i - (this.multiShot - 1) / 2) * (spreadAngle / (this.multiShot - 1));
            }
            const finalAngle = baseAngle + angleOffset;
            let proj = new Projectile(
                this.x,
                this.y,
                5,
                COLOR_PLAYER_PROJECTILE,
                Math.cos(finalAngle) * PLAYER_PROJECTILE_SPEED,
                Math.sin(finalAngle) * PLAYER_PROJECTILE_SPEED,
                this.projectileDamage
            );
            proj.pierce = this.projectilePierce;
            game.projectiles.push(proj);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        game.addParticles(this.x, this.y, PARTICLE_COUNT_HIT, COLOR_PARTICLE_HIT, 0.1); // White flash on hit

        // Brief white flash on health bar for impact
        const hpFill = document.getElementById('hp-bar-fill');
        if (hpFill) {
            const currentBg = hpFill.style.background;
            hpFill.style.background = '#FFFFFF';
            setTimeout(() => {
                if (this.health > 0) this.updateHealthBar(); // Reset to normal colors
            }, 100);
        }

        playSound(80, 'square', 0.1, 0.2); // Player hit sound
        if (this.health <= 0) {
            // Game Over logic
            console.log("Game Over!");
            game.showGameOver();
        }
    }

    gainXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level++;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.25); // Scaling XP requirement
            game.levelUp();
        }
        document.getElementById('level-text').textContent = `LVL ${this.level}`;
        this.updateXPBar();
    }

    updateXPBar() {
        const xpBarFill = document.getElementById('xp-bar-fill');
        const xpText = document.getElementById('xp-text');
        const progress = Math.min(100, Math.max(0, (this.xp / this.xpToNextLevel) * 100));
        if (xpBarFill) xpBarFill.style.width = `${progress}%`;
        if (xpText) xpText.textContent = `${Math.floor(progress)}%`;
    }
}

class Projectile extends Entity {
    constructor(x, y, radius, color, vx, vy, damage) {
        super(x, y, radius, color);
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.source = 'player'; // or 'enemy'
        this.pierce = 0; // How many enemies it can hit
        this.enemiesHit = []; // To prevent hitting the same enemy multiple times with one pierce
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Mark for deletion if off-screen
        if (this.x < -this.radius || this.x > CANVAS.width + this.radius ||
            this.y < -this.radius || this.y > CANVAS.height + this.radius) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Draw as a rectangle for laser effect
        ctx.save();
        ctx.translate(this.x, this.y);
        const angle = Math.atan2(this.vy, this.vx);
        ctx.rotate(angle);

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(0, -this.radius / 2, this.radius * 3, this.radius); // Short, wide laser

        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y, radius, color, health, speed, xpValue, isElite = false) {
        super(x, y, radius, color);
        this.maxHealth = health;
        this.health = health;
        this.speed = speed;
        this.xpValue = xpValue;
        this.isElite = isElite;
    }

    update(deltaTime, playerX, playerY) {
        // Move towards player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 1) {
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed * deltaTime;
            this.y += Math.sin(angle) * this.speed * deltaTime;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        game.addParticles(this.x, this.y, PARTICLE_COUNT_HIT, COLOR_PARTICLE_HIT, 0.05); // White flash on hit
        if (this.health <= 0) {
            this.markedForDeletion = true;
            game.onEnemyDeath(this);
        }
    }
}

class XPGem extends Entity {
    constructor(x, y, value, isElite = false) {
        super(x, y, XP_GEM_RADIUS + (isElite ? 5 : 0), isElite ? COLOR_XP_GEM_ELITE : COLOR_XP_GEM_REGULAR);
        this.value = value;
        this.isElite = isElite;
        this.lifetime = 10; // Gems disappear after 10 seconds if not collected
        this.elapsed = 0;
    }

    update(deltaTime, playerX, playerY) {
        this.elapsed += deltaTime;
        if (this.elapsed >= this.lifetime) {
            this.markedForDeletion = true;
            return;
        }

        // Move towards player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < game.player.radius * 3) { // Attraction range
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * XP_GEM_PULL_SPEED * deltaTime;
            this.y += Math.sin(angle) * XP_GEM_PULL_SPEED * deltaTime;
        }
    }

    draw(ctx) {
        super.draw(ctx, this.isElite ? COLOR_XP_GEM_ELITE : COLOR_XP_GEM_REGULAR);
    }
}

class Particle extends Entity {
    constructor(x, y, radius, color, vx, vy, lifetime) {
        super(x, y, radius, color);
        this.vx = vx;
        this.vy = vy;
        this.lifetime = lifetime; // seconds
        this.elapsed = 0;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.elapsed += deltaTime;

        // Fade out
        const alpha = 1 - (this.elapsed / this.lifetime);
        this.color = this.color.startsWith('rgba') ?
            this.color.replace(/,\s*\d\.\d+\)$/, `, ${alpha})`) :
            `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(this.color.slice(3, 5), 16)}, ${parseInt(this.color.slice(5, 7), 16)}, ${alpha})`;


        if (this.elapsed >= this.lifetime) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Draw as small circles, potentially with a short trail
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}


// --- Game Manager Class ---
class Game {
    constructor() {
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.xpGems = [];
        this.lastSpawnTime = 0;
        this.enemySpawnInterval = ENEMY_SPAWN_INTERVAL_BASE;
        this.isRunning = false;
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        CANVAS.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                playSound(600, 'sine', 0.3, 0.3); // Start game sound
                document.getElementById('start-screen').classList.remove('visible');
                this.startGame();
            });
        }

        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                playSound(600, 'sine', 0.3, 0.3); // Click sound
                document.getElementById('game-over-screen').classList.remove('visible');
                this.resetGame();
            });
        }
    }

    startGame() {
        if (this.isRunning) return;
        this.player = new Player(CANVAS.width / 2, CANVAS.height / 2);
        this.player.updateXPBar(); // Initialize XP bar display
        this.isRunning = true;

        // Use requestAnimationFrame to get a valid starting timestamp
        requestAnimationFrame((t) => {
            lastFrameTime = t;
            this.gameLoop(t);
        });
    }

    resizeCanvas() {
        CANVAS.width = window.innerWidth;
        CANVAS.height = window.innerHeight;
        // Keep player centered if it's the first init, otherwise clamp
        if (this.player) {
            this.player.x = Math.max(this.player.radius, Math.min(CANVAS.width - this.player.radius, this.player.x));
            this.player.y = Math.max(this.player.radius, Math.min(CANVAS.height - this.player.radius, this.player.y));
        }
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
        lastFrameTime = currentTime;

        if (!gamePaused) {
            this.update(deltaTime);
        }
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Update screen shake
        if (screenShake.active) {
            screenShake.elapsed += deltaTime;
            if (screenShake.elapsed >= screenShake.duration) {
                screenShake.active = false;
                screenShake.elapsed = 0;
            }
        }

        this.player.update(deltaTime);

        // Update and spawn enemies
        this.lastSpawnTime += deltaTime;
        if (this.lastSpawnTime >= this.enemySpawnInterval) {
            this.spawnEnemy();
            this.lastSpawnTime = 0;
            // Gradually decrease spawn interval to increase difficulty
            this.enemySpawnInterval = Math.max(0.5, this.enemySpawnInterval * 0.99);
        }
        this.enemies.forEach(enemy => enemy.update(deltaTime, this.player.x, this.player.y));

        // Update projectiles
        this.projectiles.forEach(proj => proj.update(deltaTime));

        // Update XP gems
        this.xpGems.forEach(gem => gem.update(deltaTime, this.player.x, this.player.y));

        // Update particles
        this.particles.forEach(p => p.update(deltaTime));

        // Collision detection
        this.handleCollisions();

        // Clean up marked entities
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        this.xpGems = this.xpGems.filter(g => !g.markedForDeletion);
        this.particles = this.particles.filter(p => !p.markedForDeletion);
    }

    draw() {
        CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);

        CTX.save(); // Save context state before applying shake

        // Apply screen shake transform
        if (screenShake.active) {
            const shakeX = (Math.random() - 0.5) * screenShake.intensity * (1 - screenShake.elapsed / screenShake.duration);
            const shakeY = (Math.random() - 0.5) * screenShake.intensity * (1 - screenShake.elapsed / screenShake.duration);
            CTX.translate(shakeX, shakeY);
        }

        // Draw all entities
        this.xpGems.forEach(gem => gem.draw(CTX));
        this.player.draw(CTX);
        this.enemies.forEach(enemy => enemy.draw(CTX));
        this.projectiles.forEach(proj => proj.draw(CTX));
        this.particles.forEach(p => p.draw(CTX));

        CTX.restore(); // Restore context state
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        const radius = ENEMY_RADIUS_BASE * (1 + Math.random() * 0.5); // Vary size slightly
        const padding = GAME_PADDING + radius;

        switch (side) {
            case 0: // Top
                x = Math.random() * CANVAS.width;
                y = -padding;
                break;
            case 1: // Right
                x = CANVAS.width + padding;
                y = Math.random() * CANVAS.height;
                break;
            case 2: // Bottom
                x = Math.random() * CANVAS.width;
                y = CANVAS.height + padding;
                break;
            case 3: // Left
                x = -padding;
                y = Math.random() * CANVAS.height;
                break;
        }

        const isElite = Math.random() < ELITE_SPAWN_CHANCE;
        let enemy;
        if (isElite) {
            enemy = new Enemy(
                x, y,
                radius * ELITE_RADIUS_MULTIPLIER,
                COLOR_ENEMY_ELITE,
                ENEMY_HEALTH_BASE * ELITE_HEALTH_MULTIPLIER * this.player.level, // Scale health with player level
                ENEMY_SPEED_BASE * ELITE_SPEED_MULTIPLIER,
                ENEMY_XP_VALUE_BASE * ELITE_XP_MULTIPLIER,
                true
            );
        } else {
            enemy = new Enemy(
                x, y,
                radius,
                COLOR_ENEMY_REGULAR,
                ENEMY_HEALTH_BASE * this.player.level, // Scale health with player level
                ENEMY_SPEED_BASE,
                ENEMY_XP_VALUE_BASE
            );
        }
        this.enemies.push(enemy);
    }

    handleCollisions() {
        // Player Projectile <-> Enemy collisions
        this.projectiles.forEach(proj => {
            if (proj.source === 'player' && !proj.markedForDeletion) {
                this.enemies.forEach(enemy => {
                    if (!enemy.markedForDeletion && !proj.enemiesHit.includes(enemy)) {
                        const distance = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
                        if (distance < proj.radius + enemy.radius) {
                            enemy.takeDamage(proj.damage);
                            proj.enemiesHit.push(enemy); // Mark enemy as hit by this projectile

                            if (proj.pierce <= 0) {
                                proj.markedForDeletion = true;
                            } else {
                                proj.pierce--;
                            }

                            // Chain Lightning check
                            if (this.player.chainLightningChance > 0 && Math.random() * 100 < this.player.chainLightningChance) {
                                this.triggerChainLightning(enemy);
                            }
                        }
                    }
                });
            }
        });

        // Enemy <-> Player collisions
        this.enemies.forEach(enemy => {
            if (!enemy.markedForDeletion) {
                const distance = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
                if (distance < this.player.radius + enemy.radius) {
                    this.player.takeDamage(10); // Placeholder damage
                    enemy.markedForDeletion = true; // Enemy is "destroyed" on collision with player
                    this.onEnemyDeath(enemy, true); // Trigger death effects without XP
                }
            }
        });

        // XP Gem <-> Player collisions
        this.xpGems.forEach(gem => {
            if (!gem.markedForDeletion) {
                const distance = Math.hypot(this.player.x - gem.x, this.player.y - gem.y);
                if (distance < this.player.radius + gem.radius) {
                    this.player.gainXP(gem.value);
                    gem.markedForDeletion = true;
                    this.addParticles(gem.x, gem.y, PARTICLE_COUNT_XP_SPARKLE, gem.isElite ? COLOR_XP_GEM_ELITE : COLOR_XP_GEM_REGULAR, 0.3); // Sparkle effect
                    playSound(1000 + Math.random() * 500, 'triangle', 0.1, 0.1); // XP collect sound
                }
            }
        });
    }

    onEnemyDeath(enemy, noXp = false) {
        this.triggerScreenShake(SHAKE_DURATION, SHAKE_INTENSITY);
        this.addParticles(
            enemy.x, enemy.y,
            PARTICLE_COUNT_ENEMY_DEATH,
            enemy.isElite ? COLOR_PARTICLE_EXPLOSION_ELITE : COLOR_PARTICLE_EXPLOSION_ENEMY
        );
        playSound(300 - Math.random() * 100, 'sawtooth', 0.2, 0.15); // Enemy death sound

        if (!noXp) {
            // Drop XP gem
            this.xpGems.push(new XPGem(
                enemy.x,
                enemy.y,
                enemy.xpValue,
                enemy.isElite
            ));
            if (enemy.isElite) {
                playSound(1200 + Math.random() * 300, 'sine', 0.1, 0.1); // Distinct sound for elite kill
            }
        }
    }

    addParticles(x, y, count, color, lifetime = PARTICLE_LIFETIME_BASE) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * PARTICLE_SPEED_MAX;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const radius = Math.random() * (PARTICLE_RADIUS_MAX - PARTICLE_RADIUS_MIN) + PARTICLE_RADIUS_MIN;
            this.particles.push(new Particle(x, y, radius, color, vx, vy, lifetime));
        }
    }

    triggerScreenShake(duration, intensity) {
        screenShake.active = true;
        screenShake.duration = duration;
        screenShake.intensity = intensity;
        screenShake.elapsed = 0;
    }

    levelUp() {
        gamePaused = true;
        playSound(600, 'sine', 0.3, 0.3); // Level up sound
        document.getElementById('level-up-overlay').classList.add('visible');
        this.displayUpgradeChoices();
    }

    displayUpgradeChoices() {
        const upgradeChoicesDiv = document.getElementById('upgrade-choices');
        upgradeChoicesDiv.innerHTML = ''; // Clear previous choices

        const availableUpgrades = [
            { name: 'Multi-Shot +1', description: 'Fire an additional projectile.', apply: () => this.player.multiShot++ },
            { name: 'Attack Speed +20%', description: 'Increase firing rate.', apply: () => this.player.fireRate *= 0.8 },
            { name: 'Projectile Damage +15%', description: 'Increase projectile damage.', apply: () => this.player.projectileDamage = Math.floor(this.player.projectileDamage * 1.15) },
            { name: 'Movement Speed +15%', description: 'Increase player movement speed.', apply: () => this.player.speed = Math.floor(this.player.speed * 1.15) },
            { name: 'Max Health +25', description: 'Increase maximum health.', apply: () => { this.player.maxHealth += 25; this.player.health += 25; this.player.updateHealthBar(); } },
            { name: 'Projectile Pierce +1', description: 'Projectiles hit an additional enemy.', apply: () => this.player.projectilePierce++ },
            { name: 'Chain Lightning (5%)', description: 'Projectiles have a 5% chance to chain to a nearby enemy.', apply: () => this.player.chainLightningChance += 5 },
            { name: 'Giant Nova', description: 'Unleash a massive burst of energy around you (one time use).', apply: () => this.player.novaAvailable = true },
            { name: 'XP Gem Magnetism', description: 'Increase the range at which XP gems are pulled towards you.', apply: () => XP_GEM_PULL_SPEED *= 1.25 }
        ];

        // Shuffle and pick 3 unique upgrades
        const shuffled = availableUpgrades.sort(() => 0.5 - Math.random());
        const chosenUpgrades = shuffled.slice(0, 3);

        chosenUpgrades.forEach(upgrade => {
            const card = document.createElement('div');
            card.classList.add('upgrade-card');
            card.innerHTML = `<h3>${upgrade.name}</h3><p>${upgrade.description}</p>`;
            card.addEventListener('click', () => {
                upgrade.apply();
                this.resumeGame();
            });
            upgradeChoicesDiv.appendChild(card);
        });
    }

    resumeGame() {
        gamePaused = false;
        document.getElementById('level-up-overlay').classList.remove('visible');
    }

    triggerChainLightning(targetEnemy) {
        const chainCount = 2; // How many times it can chain
        let currentTarget = targetEnemy;
        for (let i = 0; i < chainCount; i++) {
            const potentialTargets = this.enemies.filter(e =>
                !e.markedForDeletion && e !== currentTarget && Math.hypot(currentTarget.x - e.x, currentTarget.y - e.y) < 200 // Chain radius
            );

            if (potentialTargets.length > 0) {
                const nextTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                nextTarget.takeDamage(this.player.projectileDamage * 0.7); // Reduced damage for chain
                this.drawLightningEffect(currentTarget.x, currentTarget.y, nextTarget.x, nextTarget.y);
                currentTarget = nextTarget;
            } else {
                break;
            }
        }
    }

    drawLightningEffect(x1, y1, x2, y2) {
        // Simple line particle effect for lightning
        const segments = 10;
        let prevX = x1;
        let prevY = y1;
        for (let i = 0; i <= segments; i++) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const segmentX = x1 + (dx / segments) * i;
            const segmentY = y1 + (dy / segments) * i;

            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            this.particles.push(new Particle(
                prevX, prevY,
                1,
                COLOR_UPGRADE_HIGHLIGHT,
                (segmentX + offsetX - prevX) * 5, (segmentY + offsetY - prevY) * 5, // Fast moving
                0.1 // Short lifetime
            ));
            prevX = segmentX + offsetX;
            prevY = segmentY + offsetY;
        }
    }

    resetGame() {
        // Reset all game state
        this.isRunning = false;
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.xpGems = [];
        this.lastSpawnTime = 0;
        this.enemySpawnInterval = ENEMY_SPAWN_INTERVAL_BASE;
        gamePaused = false;
        screenShake.active = false;

        document.getElementById('level-up-overlay').classList.remove('visible');
        document.getElementById('game-over-screen').classList.remove('visible');
        document.getElementById('start-screen').classList.add('visible');
        document.getElementById('level-text').textContent = `LVL 1`;
        const xpBarFill = document.getElementById('xp-bar-fill');
        if (xpBarFill) xpBarFill.style.width = '0%';
        const xpText = document.getElementById('xp-text');
        if (xpText) xpText.textContent = `0%`;

        const vignette = document.getElementById('damage-vignette');
        if (vignette) vignette.classList.remove('critical-health');

        // Draw one clear frame to remove end-game clutter from menu background
        CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);

        console.log("Game Reset!");
    }

    showGameOver() {
        this.isRunning = false;
        gamePaused = true;
        
        playSound(200, 'sawtooth', 0.5, 0.3); // Simple game over sound
        
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            document.getElementById('final-level').textContent = `LEVEL ${this.player.level}`;
            gameOverScreen.classList.add('visible');
        }
    }
}

const game = new Game();
game.init();

// Prevent right-click context menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Event listener for Nova ability (e.g., Spacebar)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && game.player.novaAvailable && !gamePaused) {
        game.player.novaAvailable = false; // Use up the Nova
        playSound(200, 'sawtooth', 0.8, 0.4); // Deep, powerful sound for nova

        // Create a large explosion of particles
        game.addParticles(game.player.x, game.player.y, 100, COLOR_UPGRADE_HIGHLIGHT, 0.8);
        game.triggerScreenShake(0.3, 15);

        // Damage all enemies on screen
        game.enemies.forEach(enemy => {
            enemy.takeDamage(game.player.projectileDamage * 10); // Massive damage
        });

        // Clear projectiles? Maybe not, it's player's ability
    }
});
