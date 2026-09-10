// Web Audio synthesis for 8-bit sounds
import { MusicPlayer } from './audio/music.js';

let audioContext = null;
let isInitialized = false;
let musicPlayer = null;

export function initAudio() {
    if (isInitialized) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    musicPlayer = new MusicPlayer(audioContext);
    isInitialized = true;
}

export function resumeAudio() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playTone(frequency, duration, type = 'square', volume = 0.15) {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
    if (!audioContext) return;
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    noise.buffer = buffer;
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    noise.connect(gainNode);
    gainNode.connect(audioContext.destination);

    noise.start(audioContext.currentTime);
}

export function playJumpSound() {
    playTone(330, 0.1, 'square', 0.12);
    setTimeout(() => playTone(440, 0.05, 'square', 0.1), 50);
}

export function playStompSound() {
    playTone(200, 0.15, 'square', 0.15);
    playNoise(0.05, 0.08);
}

export function playCoinSound() {
    playTone(988, 0.1, 'square', 0.12);
    setTimeout(() => playTone(1319, 0.15, 'square', 0.1), 80);
}

export function playPowerupSound() {
    playTone(523, 0.1, 'square', 0.12);
    setTimeout(() => playTone(659, 0.1, 'square', 0.12), 100);
    setTimeout(() => playTone(784, 0.1, 'square', 0.12), 200);
    setTimeout(() => playTone(1047, 0.2, 'square', 0.1), 300);
}

export function playBumpSound() {
    playTone(100, 0.1, 'square', 0.15);
}

export function playBreakSound() {
    playNoise(0.1, 0.15);
    playTone(150, 0.15, 'square', 0.12);
}

export function playDeathSound() {
    playTone(523, 0.2, 'square', 0.15);
    setTimeout(() => playTone(415, 0.2, 'square', 0.12), 200);
    setTimeout(() => playTone(330, 0.2, 'square', 0.1), 400);
    setTimeout(() => playTone(262, 0.4, 'square', 0.08), 600);
}

export function playFlagpoleSound() {
    playTone(523, 0.15, 'square', 0.12);
    setTimeout(() => playTone(659, 0.15, 'square', 0.12), 150);
    setTimeout(() => playTone(784, 0.15, 'square', 0.12), 300);
    setTimeout(() => playTone(1047, 0.4, 'square', 0.15), 450);
}

// Music playback functions
export function playMusic(theme) {
    if (!musicPlayer) return;
    switch (theme) {
        case 'overworld':
            musicPlayer.playOverworld();
            break;
        case 'underground':
            musicPlayer.playUnderground();
            break;
        case 'castle':
            musicPlayer.playCastle();
            break;
        case 'underwater':
            musicPlayer.playUnderwater();
            break;
        default:
            musicPlayer.playOverworld();
    }
}

export function stopMusic() {
    if (musicPlayer) {
        musicPlayer.stop();
    }
}
