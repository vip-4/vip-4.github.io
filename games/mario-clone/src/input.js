// Keyboard input state management
export class InputManager {
    constructor() {
        // Track pressed keys
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            action: false,
            pause: false
        };

        // Track if jump was just pressed (for single jump trigger)
        this.jumpPressed = false;
        this.actionPressed = false;
        this.pausePressed = false;

        // Track keys that were just pressed this frame
        this.justPressed = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            action: false,
            pause: false
        };

        // Bind event listeners
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                if (!this.keys.left) this.justPressed.left = true;
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (!this.keys.right) this.justPressed.right = true;
                this.keys.right = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
                if (!this.keys.up) this.justPressed.up = true;
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (!this.keys.down) this.justPressed.down = true;
                this.keys.down = true;
                break;
            case 'Space':
            case 'KeyZ':
                if (!this.keys.jump) {
                    this.jumpPressed = true;
                    this.justPressed.jump = true;
                }
                this.keys.jump = true;
                break;
            case 'KeyX':
            case 'KeyJ':
                if (!this.keys.action) {
                    this.actionPressed = true;
                    this.justPressed.action = true;
                }
                this.keys.action = true;
                break;
            case 'Escape':
            case 'KeyP':
                if (!this.keys.pause) {
                    this.pausePressed = true;
                    this.justPressed.pause = true;
                }
                this.keys.pause = true;
                break;
        }

        // Prevent default for game keys
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'Space':
            case 'KeyZ':
                this.keys.jump = false;
                break;
            case 'KeyX':
            case 'KeyJ':
                this.keys.action = false;
                break;
            case 'Escape':
            case 'KeyP':
                this.keys.pause = false;
                break;
        }
    }

    // Check if jump was just pressed this frame
    isJumpPressed() {
        return this.jumpPressed;
    }

    // Check if action was just pressed this frame
    isActionPressed() {
        return this.actionPressed;
    }

    // Reset single-frame triggers (call at end of each frame)
    resetTriggers() {
        this.jumpPressed = false;
        this.actionPressed = false;
        this.pausePressed = false;
        this.justPressed = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            action: false,
            pause: false
        };
    }

    // Check if a specific key was just pressed this frame
    isJustPressed(key) {
        return this.justPressed[key] === true;
    }

    // Check if any movement key is pressed
    isMoving() {
        return this.keys.left || this.keys.right;
    }

    // Get horizontal direction (-1 left, 1 right, 0 none)
    getHorizontalDirection() {
        if (this.keys.left && !this.keys.right) return -1;
        if (this.keys.right && !this.keys.left) return 1;
        return 0;
    }

    // Check if ducking
    isDucking() {
        return this.keys.down;
    }
}
