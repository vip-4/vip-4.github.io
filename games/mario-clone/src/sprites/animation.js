// Animation sequencer for sprite state management

export class AnimationController {
    constructor() {
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDuration = 8; // frames per sprite frame
        this.animations = {};
    }

    // Define an animation sequence
    addAnimation(name, frames, fps = 8) {
        this.animations[name] = {
            frames: frames,
            fps: fps,
            frameDuration: Math.floor(60 / fps)
        };
    }

    // Play an animation
    play(name, forceRestart = false) {
        if (this.currentAnimation === name && !forceRestart) return;

        if (this.animations[name]) {
            this.currentAnimation = name;
            this.currentFrame = 0;
            this.frameTimer = 0;
            this.frameDuration = this.animations[name].frameDuration;
        }
    }

    // Update animation (call each frame)
    update() {
        if (!this.currentAnimation) return;

        this.frameTimer++;
        if (this.frameTimer >= this.frameDuration) {
            this.frameTimer = 0;
            this.currentFrame++;

            const anim = this.animations[this.currentAnimation];
            if (this.currentFrame >= anim.frames.length) {
                this.currentFrame = 0;
            }
        }
    }

    // Get current sprite data
    getCurrentFrame() {
        if (!this.currentAnimation) return null;

        const anim = this.animations[this.currentAnimation];
        if (!anim) return null;

        return anim.frames[this.currentFrame];
    }

    // Check if animation is playing
    isPlaying(name) {
        return this.currentAnimation === name;
    }

    // Reset animation
    reset() {
        this.currentFrame = 0;
        this.frameTimer = 0;
    }
}

// Player animation states
export const PLAYER_STATES = {
    IDLE: 'idle',
    WALK: 'walk',
    JUMP: 'jump',
    FALL: 'fall',
    DUCK: 'duck'
};

// Factory function to create player animation controller
export function createPlayerAnimator() {
    const controller = new AnimationController();

    // Small Mario animations
    controller.addAnimation('small_idle', ['idle'], 1);
    controller.addAnimation('small_walk', ['walk1', 'walk2', 'walk3'], 8);
    controller.addAnimation('small_jump', ['jump'], 1);
    controller.addAnimation('small_fall', ['fall'], 1);

    // Big Mario animations
    controller.addAnimation('big_idle', ['idle1', 'idle2'], 4);
    controller.addAnimation('big_walk', ['walk1', 'walk2', 'walk3'], 8);
    controller.addAnimation('big_jump', ['jump'], 1);
    controller.addAnimation('big_fall', ['fall'], 1);
    controller.addAnimation('big_duck', ['duck'], 1);

    return controller;
}

// Determine player animation state based on movement
export function getPlayerAnimationState(player) {
    const state = player.playerState || PLAYER_STATES.IDLE;
    const powerState = player.powerState || 'small';

    const prefix = powerState === 'small' ? 'small_' : 'big_';

    switch (state) {
        case PLAYER_STATES.IDLE:
            return prefix + 'idle';
        case PLAYER_STATES.WALK:
            return prefix + 'walk';
        case PLAYER_STATES.JUMP:
            return prefix + 'jump';
        case PLAYER_STATES.FALL:
            return prefix + 'fall';
        case PLAYER_STATES.DUCK:
            return prefix + 'duck';
        default:
            return prefix + 'idle';
    }
}
