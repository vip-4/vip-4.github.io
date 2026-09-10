console.log('🎮 Loading Game class...');

class Game {
    constructor() {
        console.log('🚗 Initializing Speed Racer Game...');
        this.canvas = document.getElementById('gameCanvas');
        console.log('📱 Canvas element:', this.canvas);
        
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        console.log('🎨 Canvas context:', this.ctx);
        
        if (!this.ctx) {
            console.error('❌ Could not get 2D context!');
            return;
        }
        
        console.log('🏁 Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        
        // Game objects
        this.track = new Track(this.canvas.width, this.canvas.height);
        console.log('🛣️ Track created');
        this.car = null;
        
        // Game state
        this.gameState = 'playing'; // playing, paused, finished
        this.currentLap = 1;
        this.totalLaps = 3;
        this.startTime = Date.now();
        this.lapTimes = [];
        this.bestTime = localStorage.getItem('bestTime') || null;
        
        // Controls
        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Performance tracking
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        
        // Sound simulation flags
        this.audioContext = null;
        this.engineSound = null;
        
        // Initialize game
        this.init();
    }
    
    init() {
        console.log('🎮 Initializing game components...');
        this.setupCar();
        console.log('🚗 Car setup complete');
        this.setupEventListeners();
        console.log('⌨️ Event listeners setup complete');
        this.setupAudio();
        console.log('🔊 Audio setup complete');
        this.gameLoop();
        console.log('🔄 Game loop started');
        this.updateUI();
        console.log('✅ Game initialization complete!');
    }
    
    setupCar() {
        const startPos = this.track.getStartPosition();
        this.car = new Car(startPos.x, startPos.y, startPos.angle, 0);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Car selection
        document.querySelectorAll('.car-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCar(e));
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle window blur/focus for pause functionality
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
    }
    
    setupAudio() {
        // Setup Web Audio API for engine sounds (basic implementation)
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    handleKeyDown(e) {
        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.controls.up = true;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.controls.down = true;
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.controls.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.controls.right = true;
                e.preventDefault();
                break;
            case 'Space':
                this.restart();
                e.preventDefault();
                break;
            case 'KeyP':
                this.togglePause();
                e.preventDefault();
                break;
        }
    }
    
    handleKeyUp(e) {
        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.controls.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.controls.down = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.controls.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.controls.right = false;
                break;
        }
    }
    
    selectCar(e) {
        const carType = parseInt(e.target.dataset.car);
        
        // Update UI
        document.querySelectorAll('.car-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update car
        this.car.setCarType(carType);
        this.restart();
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update car
        this.car.update(this.controls);
        
        // Check collisions
        this.car.checkCollision(this.track.boundaries);
        
        // Check lap progress
        const lapProgress = this.track.checkLapProgress(this.car);
        
        if (lapProgress.lapCompleted) {
            this.completeLap();
        }
        
        // Update UI
        this.updateUI();
        
        // Play engine sound based on car speed
        this.updateAudio();
    }
    
    completeLap() {
        const currentTime = Date.now();
        const lapTime = currentTime - this.startTime;
        this.lapTimes.push(lapTime);
        
        this.currentLap++;
        
        if (this.currentLap > this.totalLaps) {
            this.finishRace();
        } else {
            // Reset timer for next lap
            this.startTime = currentTime;
            
            // Show lap completion feedback
            this.showLapFeedback(lapTime);
        }
    }
    
    finishRace() {
        this.gameState = 'finished';
        
        const totalTime = this.lapTimes.reduce((sum, time) => sum + time, 0);
        const avgSpeed = this.calculateAverageSpeed();
        
        // Check for best time
        if (!this.bestTime || totalTime < parseInt(this.bestTime)) {
            this.bestTime = totalTime;
            localStorage.setItem('bestTime', this.bestTime.toString());
            this.showRaceCompleteOverlay(totalTime, avgSpeed, true);
        } else {
            this.showRaceCompleteOverlay(totalTime, avgSpeed, false);
        }
    }
    
    showLapFeedback(lapTime) {
        // Create a temporary lap notification
        const notification = document.createElement('div');
        notification.className = 'lap-notification';
        notification.textContent = `Lap ${this.currentLap - 1} Complete! Time: ${this.formatTime(lapTime)}`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(145deg, #ff6b00, #ff8500);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            font-size: 1.2rem;
            z-index: 1001;
            box-shadow: 0 0 30px rgba(255, 107, 0, 0.7);
            animation: lapNotification 2s ease-out forwards;
        `;
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#lap-animation-style')) {
            const style = document.createElement('style');
            style.id = 'lap-animation-style';
            style.textContent = `
                @keyframes lapNotification {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    showRaceCompleteOverlay(totalTime, avgSpeed, isNewRecord) {
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const finalTime = document.getElementById('finalTime');
        const avgSpeedDisplay = document.getElementById('avgSpeed');
        
        title.textContent = isNewRecord ? 'NEW RECORD! 🏆' : 'Race Complete! 🏁';
        message.textContent = isNewRecord ? 
            'Congratulations! You set a new best time!' : 
            'Great job! Keep practicing to beat your best time!';
        
        finalTime.textContent = this.formatTime(totalTime);
        avgSpeedDisplay.textContent = `${Math.round(avgSpeed)} km/h`;
        
        overlay.classList.add('show');
    }
    
    calculateAverageSpeed() {
        // Estimate based on track length and total time
        const estimatedTrackLength = 2.5; // km (estimated)
        const totalTimeSeconds = this.lapTimes.reduce((sum, time) => sum + time, 0) / 1000;
        const totalDistance = estimatedTrackLength * this.totalLaps;
        return (totalDistance / totalTimeSeconds) * 3600; // km/h
    }
    
    updateAudio() {
        if (!this.audioContext) return;
        
        // Simple engine sound simulation based on car speed
        const enginePitch = this.car.enginePitch;
        
        // This would typically involve more complex audio synthesis
        // For now, we'll just track the engine state for potential future implementation
        if (enginePitch > 0.1 && !this.engineSound) {
            // Engine starting sound
        } else if (enginePitch < 0.1 && this.engineSound) {
            // Engine stopping sound
        }
    }
    
    pause() {
        this.gameState = 'paused';
    }
    
    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            // Adjust start time to account for pause
            this.startTime = Date.now() - (Date.now() - this.startTime);
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.pause();
        } else if (this.gameState === 'paused') {
            this.resume();
        }
    }
    
    restart() {
        // Hide overlay
        document.getElementById('gameOverlay').classList.remove('show');
        
        // Reset game state
        this.gameState = 'playing';
        this.currentLap = 1;
        this.startTime = Date.now();
        this.lapTimes = [];
        
        // Reset car
        const startPos = this.track.getStartPosition();
        this.car.reset(startPos.x, startPos.y, startPos.angle);
        
        // Reset track checkpoints
        this.track.resetCheckpoints();
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        // Update speed display
        document.getElementById('speed-display').textContent = this.car.getSpeedKmh();
        
        // Update lap display
        document.getElementById('lap-display').textContent = Math.min(this.currentLap, this.totalLaps);
        
        // Update time display
        const currentTime = Date.now() - this.startTime;
        document.getElementById('time-display').textContent = this.formatTime(currentTime);
        
        // Update best time display
        if (this.bestTime) {
            document.getElementById('best-time').textContent = this.formatTime(parseInt(this.bestTime));
        }
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    draw() {
        try {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw track
            this.track.draw(this.ctx);
            
            // Draw car
            this.car.draw(this.ctx);
            
            // Draw game state info
            this.drawGameInfo();
            
            // Draw pause overlay if paused
            if (this.gameState === 'paused') {
                this.drawPauseOverlay();
            }
        } catch (error) {
            console.error('❌ Error in draw function:', error);
        }
    }
    
    drawGameInfo() {
        this.ctx.save();
        
        // Performance info (FPS)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px Orbitron';
        this.ctx.fillText(`FPS: ${this.fps}`, this.canvas.width - 60, 20);
        
        // Lap progress indicators
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = 'bold 14px Orbitron';
        this.ctx.fillText('Checkpoints:', 10, this.canvas.height - 40);
        
        const checkpointStatus = this.track.checkpoints.map(cp => cp.passed ? '✓' : '○').join(' ');
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillText(checkpointStatus, 10, this.canvas.height - 20);
        
        this.ctx.restore();
    }
    
    drawPauseOverlay() {
        this.ctx.save();
        
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pause text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '16px Orbitron';
        this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        this.ctx.restore();
    }
    
    gameLoop() {
        const currentTime = performance.now();
        
        // Calculate FPS
        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
        this.frameCount++;
        
        // Update and draw
        this.update();
        this.draw();
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Game class is now initialized by the enhanced loader in index.html
console.log('🏎️ Speed Racer Game class loaded!');
console.log('Controls: WASD or Arrow Keys');
console.log('Press SPACE to restart, P to pause');
console.log('Complete 3 laps as fast as possible!');

console.log('✅ Game class loaded successfully!'); 