/**
 * Audio System for Cyber Runner
 * Uses Web Audio API for sound effects and music
 */

class AudioSystem {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.muted = false;
        this.initialized = false;
        this.sounds = {};
        this.currentMusic = null;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterGain);
            
            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);
            
            // Generate procedural sounds
            this.generateSounds();
            
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Generate procedural sound effects
     */
    generateSounds() {
        // Jump sound - quick rising tone
        this.sounds.jump = this.createToneBuffer([
            { freq: 200, duration: 0.05, type: 'square' },
            { freq: 400, duration: 0.05, type: 'square' },
            { freq: 600, duration: 0.05, type: 'sine' }
        ]);

        // Land sound - thump
        this.sounds.land = this.createNoiseBuffer(0.1, 'lowpass', 200);

        // Collision/death sound - harsh noise burst
        this.sounds.death = this.createToneBuffer([
            { freq: 150, duration: 0.1, type: 'sawtooth' },
            { freq: 100, duration: 0.15, type: 'sawtooth' },
            { freq: 50, duration: 0.2, type: 'sawtooth' }
        ]);

        // Power-up sound - ascending arpeggio
        this.sounds.powerup = this.createToneBuffer([
            { freq: 440, duration: 0.08, type: 'sine' },
            { freq: 554, duration: 0.08, type: 'sine' },
            { freq: 659, duration: 0.08, type: 'sine' },
            { freq: 880, duration: 0.15, type: 'sine' }
        ]);

        // Coin/pickup sound
        this.sounds.pickup = this.createToneBuffer([
            { freq: 880, duration: 0.05, type: 'sine' },
            { freq: 1100, duration: 0.1, type: 'sine' }
        ]);
    }

    /**
     * Create a tone buffer from frequency/duration specs
     */
    createToneBuffer(tones) {
        const totalDuration = tones.reduce((sum, t) => sum + t.duration, 0);
        const sampleRate = this.context.sampleRate;
        const length = Math.ceil(sampleRate * totalDuration);
        const buffer = this.context.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        let offset = 0;
        for (const tone of tones) {
            const samples = Math.ceil(sampleRate * tone.duration);
            for (let i = 0; i < samples && (offset + i) < length; i++) {
                const t = i / sampleRate;
                const envelope = 1 - (i / samples); // Linear decay
                let value;
                
                switch (tone.type) {
                    case 'sine':
                        value = Math.sin(2 * Math.PI * tone.freq * t);
                        break;
                    case 'square':
                        value = Math.sin(2 * Math.PI * tone.freq * t) > 0 ? 1 : -1;
                        break;
                    case 'sawtooth':
                        value = 2 * ((tone.freq * t) % 1) - 1;
                        break;
                    default:
                        value = Math.sin(2 * Math.PI * tone.freq * t);
                }
                
                data[offset + i] = value * envelope * 0.3;
            }
            offset += samples;
        }
        
        return buffer;
    }

    /**
     * Create a noise buffer
     */
    createNoiseBuffer(duration, filterType = 'lowpass', filterFreq = 1000) {
        const sampleRate = this.context.sampleRate;
        const length = Math.ceil(sampleRate * duration);
        const buffer = this.context.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const envelope = 1 - (i / length);
            data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
        }
        
        return buffer;
    }

    /**
     * Play a sound effect
     */
    play(soundName) {
        if (!this.initialized || this.muted || !this.sounds[soundName]) return;
        
        const source = this.context.createBufferSource();
        source.buffer = this.sounds[soundName];
        source.connect(this.sfxGain);
        source.start();
    }

    /**
     * Start background music (procedural synthwave loop)
     */
    startMusic() {
        if (!this.initialized || this.currentMusic) return;
        
        this.currentMusic = this.createMusicLoop();
    }

    /**
     * Create an epic chiptune techno banger
     */
    createMusicLoop() {
        const bpm = 140;
        const beatDuration = 60 / bpm;
        const sixteenth = beatDuration / 4;
        
        // All our interval handles
        this.musicIntervals = [];
        this.musicPaused = false;
        
        // === KICK DRUM (Four on the floor) ===
        let kickTime = 0;
        const playKick = () => {
            if (this.muted || !this.initialized) return;
            
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0.4, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.15);
            kickTime++;
        };
        this.musicIntervals.push(setInterval(playKick, beatDuration * 1000));
        playKick();
        
        // === HI-HAT (8th notes with accent) ===
        let hatTime = 0;
        const playHat = () => {
            if (this.muted || !this.initialized) return;
            
            const bufferSize = this.context.sampleRate * 0.05;
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            
            const filter = this.context.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 8000;
            
            const gain = this.context.createGain();
            // Accent on off-beats
            const volume = (hatTime % 2 === 1) ? 0.12 : 0.06;
            gain.gain.setValueAtTime(volume, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
            
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            source.start();
            hatTime++;
        };
        this.musicIntervals.push(setInterval(playHat, (beatDuration / 2) * 1000));
        setTimeout(playHat, 50);
        
        // === SNARE (2 and 4) ===
        let snareTime = 0;
        const playSnare = () => {
            if (this.muted || !this.initialized) return;
            
            // Noise component
            const bufferSize = this.context.sampleRate * 0.1;
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            
            const noise = this.context.createBufferSource();
            noise.buffer = buffer;
            
            const noiseFilter = this.context.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 3000;
            
            const noiseGain = this.context.createGain();
            noiseGain.gain.setValueAtTime(0.15, this.context.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.musicGain);
            noise.start();
            
            // Tone component
            const osc = this.context.createOscillator();
            const oscGain = this.context.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, this.context.currentTime + 0.05);
            oscGain.gain.setValueAtTime(0.15, this.context.currentTime);
            oscGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
            osc.connect(oscGain);
            oscGain.connect(this.musicGain);
            osc.start();
            osc.stop(this.context.currentTime + 0.1);
            
            snareTime++;
        };
        this.musicIntervals.push(setInterval(playSnare, beatDuration * 2 * 1000));
        setTimeout(playSnare, beatDuration * 1000);
        
        // === BASS LINE (Pulsing synth bass) ===
        // Extended 8-bar pattern with variation
        const bassPattern = [
            // Bar 1-2: Am
            55, 0, 55, 0, 55, 0, 82.4, 0,
            55, 0, 55, 82.4, 73.4, 0, 82.4, 0,
            // Bar 3-4: F
            87.3, 0, 87.3, 0, 87.3, 0, 130.8, 0,
            87.3, 0, 87.3, 130.8, 110, 0, 130.8, 0,
            // Bar 5-6: C with variation
            65.4, 0, 65.4, 0, 65.4, 98, 98, 0,
            65.4, 0, 65.4, 98, 82.4, 0, 98, 0,
            // Bar 7-8: G and return to Am
            98, 0, 98, 0, 98, 0, 147, 0,
            98, 82.4, 73.4, 65.4, 55, 0, 82.4, 0
        ];
        let bassIndex = 0;
        
        const playBass = () => {
            if (this.muted || !this.initialized) return;
            
            const note = bassPattern[bassIndex % bassPattern.length];
            bassIndex++;
            
            if (note === 0) return;
            
            const osc = this.context.createOscillator();
            const osc2 = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.value = note;
            osc2.type = 'square';
            osc2.frequency.value = note * 1.002;
            
            // Vary filter cutoff based on position in pattern
            const filterBase = (bassIndex % 16 < 8) ? 400 : 600;
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(filterBase, this.context.currentTime);
            filter.frequency.linearRampToValueAtTime(150, this.context.currentTime + sixteenth * 0.8);
            filter.Q.value = (bassIndex % 32 < 16) ? 5 : 8;
            
            gain.gain.setValueAtTime(0.18, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + sixteenth * 0.9);
            
            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start();
            osc2.start();
            osc.stop(this.context.currentTime + sixteenth);
            osc2.stop(this.context.currentTime + sixteenth);
        };
        this.musicIntervals.push(setInterval(playBass, sixteenth * 1000));
        playBass();
        
        // === LEAD ARPEGGIO (Chiptune style) ===
        // Extended 8-bar Am - F - C - G - Dm - Em - F - G progression
        const arpPatterns = [
            [440, 523, 659, 880, 659, 523],           // Am (A4, C5, E5, A5)
            [349, 440, 523, 698, 523, 440],           // F  (F4, A4, C5, F5)
            [523, 659, 784, 1047, 784, 659],          // C  (C5, E5, G5, C6)
            [392, 494, 587, 784, 587, 494],           // G  (G4, B4, D5, G5)
            [587, 698, 880, 1175, 880, 698],          // Dm (D5, F5, A5, D6)
            [659, 784, 988, 1319, 988, 784],          // Em (E5, G5, B5, E6)
            [349, 440, 523, 698, 880, 698, 523, 440], // F  (extended)
            [392, 494, 587, 784, 988, 784, 587, 494]  // G  (extended)
        ];
        let arpPatternIndex = 0;
        let arpNoteIndex = 0;
        let arpBeat = 0;
        
        const playArp = () => {
            if (this.muted || !this.initialized) return;
            
            const pattern = arpPatterns[arpPatternIndex % arpPatterns.length];
            const note = pattern[arpNoteIndex % pattern.length];
            
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'square';
            osc.frequency.value = note;
            
            // Slightly vary volume based on position for rhythm
            const baseVol = 0.08;
            const vol = (arpNoteIndex % 4 === 0) ? baseVol * 1.2 : baseVol;
            
            gain.gain.setValueAtTime(vol, this.context.currentTime);
            gain.gain.setValueAtTime(vol, this.context.currentTime + sixteenth * 0.5);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + sixteenth * 0.9);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start();
            osc.stop(this.context.currentTime + sixteenth);
            
            arpNoteIndex++;
            arpBeat++;
            
            // Change chord every 2 beats (pattern length varies, so use beat count)
            const beatsPerChord = (arpPatternIndex % 8 >= 6) ? 16 : 12; // Extended patterns last longer
            if (arpBeat >= beatsPerChord) {
                arpBeat = 0;
                arpNoteIndex = 0;
                arpPatternIndex++;
            }
        };
        this.musicIntervals.push(setInterval(playArp, sixteenth * 1000));
        setTimeout(playArp, sixteenth * 500);
        
        // === LEAD MELODY (Expanded with 8-bar phrases) ===
        // Four distinct melodic phrases with variation (bars 1-2, 3-4, 5-6, 7-8)
        const melodyPhrases = [
            // Phrase 1 - Am riff (bars 1-2)
            [880, 988, 1047, 988, 880, 784, 880, 0, 659, 784, 880, 784, 659, 523, 659, 0],
            // Phrase 2 - F riff (bars 3-4)
            [698, 784, 880, 1047, 880, 698, 784, 0, 698, 659, 698, 880, 1047, 880, 698, 0],
            // Phrase 3 - C riff (bars 5-6)
            [1047, 988, 880, 784, 659, 523, 659, 784, 880, 988, 1047, 0, 880, 784, 659, 0],
            // Phrase 4 - G riff with climax (bars 7-8)
            [784, 880, 988, 1175, 988, 880, 784, 659, 784, 988, 1175, 1319, 1175, 988, 880, 784, 659, 587, 523, 440, 523, 659, 784, 0]
        ];
        let melodyPhraseIndex = 0;
        let melodyNoteIndex = 0;
        let melodyBarCount = 0;
        
        const playMelody = () => {
            if (this.muted || !this.initialized) return;
            
            const phrase = melodyPhrases[melodyPhraseIndex % melodyPhrases.length];
            const note = phrase[melodyNoteIndex % phrase.length];
            melodyNoteIndex++;
            
            // Move to next phrase when current phrase completes
            if (melodyNoteIndex >= phrase.length) {
                melodyNoteIndex = 0;
                melodyPhraseIndex++;
                melodyBarCount++;
            }
            
            if (note === 0) return;
            
            const osc = this.context.createOscillator();
            const osc2 = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();
            
            osc.type = 'square';
            osc.frequency.value = note;
            osc2.type = 'sawtooth';
            osc2.frequency.value = note * 0.998;
            
            // Add vibrato for expressiveness
            const lfo = this.context.createOscillator();
            const lfoGain = this.context.createGain();
            lfo.frequency.value = 5;
            lfoGain.gain.value = 3;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();
            lfo.stop(this.context.currentTime + beatDuration);
            
            // Vary filter per phrase for different timbres
            filter.type = 'lowpass';
            filter.frequency.value = 1500 + (melodyPhraseIndex % 4) * 400;
            filter.Q.value = 2 + (melodyPhraseIndex % 4) * 0.5;
            
            // Vary volume per phrase for dynamics
            const baseVol = 0.08 + (melodyPhraseIndex % 2) * 0.03;
            gain.gain.setValueAtTime(baseVol, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(baseVol, this.context.currentTime + beatDuration * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + beatDuration * 0.8);
            
            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start();
            osc2.start();
            osc.stop(this.context.currentTime + beatDuration);
            osc2.stop(this.context.currentTime + beatDuration);
        };
        this.musicIntervals.push(setInterval(playMelody, (beatDuration / 2) * 1000));
        
        return { 
            stop: () => {
                this.musicIntervals.forEach(interval => clearInterval(interval));
                this.musicIntervals = [];
            }
        };
    }

    /**
     * Stop background music
     */
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }

    /**
     * Pause music playback
     */
    pauseMusic() {
        if (this.musicGain && !this.musicPaused) {
            this.musicPaused = true;
            this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, this.context.currentTime);
            this.musicGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);
        }
    }

    /**
     * Resume music playback
     */
    resumeMusic() {
        if (this.musicGain && this.musicPaused) {
            this.musicPaused = false;
            this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, this.context.currentTime);
            this.musicGain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.3);
        }
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 1;
        }
        return this.muted;
    }

    /**
     * Set mute state
     */
    setMuted(muted) {
        this.muted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 1;
        }
    }
}
