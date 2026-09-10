// 8-bit music synthesis using Web Audio API
// NES Mario music uses: square wave melody, triangle wave bass, noise percussion

// Frequency table (A4 = 440Hz)
const NOTES = {
    'C3': 131, 'D3': 147, 'E3': 165, 'F3': 175, 'G3': 196, 'A3': 220, 'B3': 247,
    'C4': 261, 'D4': 294, 'E4': 329, 'F4': 349, 'G4': 392, 'A4': 440, 'B4': 494,
    'C5': 523, 'D5': 587, 'E5': 659, 'F5': 698, 'G5': 784, 'A5': 880, 'B5': 988,
    'C6': 1047, 'D6': 1175, 'E6': 1319, 'F6': 1397, 'G6': 1568, 'A6': 1760, 'B6': 1976
};

// Overworld theme - classic Mario melody
const OVERWORLD_MELODY = [
    { note: 'E5', dur: 0.15 }, { note: 'E5', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'E5', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'C5', dur: 0.15 },
    { note: 'E5', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G5', dur: 0.15 },
    { note: null, dur: 0.6 }, { note: null, dur: 0.3 },

    { note: 'G4', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'C5', dur: 0.15 },
    { note: null, dur: 0.3 }, { note: 'G4', dur: 0.15 }, { note: null, dur: 0.3 },
    { note: 'E4', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'A4', dur: 0.15 },
    { note: 'B4', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'A#4', dur: 0.15 },
    { note: 'A4', dur: 0.15 }, { note: 'G4', dur: 0.3 },

    { note: 'E5', dur: 0.15 }, { note: 'E5', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'E5', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'C5', dur: 0.15 },
    { note: 'E5', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G5', dur: 0.15 },
    { note: null, dur: 0.6 }, { note: null, dur: 0.3 },

    { note: 'G4', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'C5', dur: 0.15 },
    { note: null, dur: 0.3 }, { note: 'G4', dur: 0.15 }, { note: 'F4', dur: 0.15 },
    { note: 'E4', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'D4', dur: 0.15 },
    { note: 'C5', dur: 0.3 }, { note: null, dur: 0.15 },

    { note: 'C5', dur: 0.15 }, { note: 'C5', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'C5', dur: 0.15 }, { note: null, dur: 0.3 }, { note: null, dur: 0.15 },
    { note: 'G4', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'F4', dur: 0.15 },
    { note: 'E4', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'D4', dur: 0.15 },

    { note: 'C5', dur: 0.3 }, { note: null, dur: 0.15 }, { note: 'C5', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C5', dur: 0.15 }, { note: null, dur: 0.3 },
    { note: 'G4', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'F4', dur: 0.15 },
    { note: 'E4', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'D4', dur: 0.15 },

    { note: 'C5', dur: 0.15 }, { note: 'C5', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'C5', dur: 0.15 }, { note: null, dur: 0.3 }, { note: null, dur: 0.15 },
    { note: 'G4', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'F4', dur: 0.15 },
    { note: 'E4', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'D4', dur: 0.15 },

    { note: 'C5', dur: 0.3 }, { note: null, dur: 0.15 }, { note: 'C5', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C5', dur: 0.15 }, { note: null, dur: 0.3 },
    { note: 'G4', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'F4', dur: 0.15 },
    { note: 'C5', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'G4', dur: 0.15 },

    { note: 'E4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'E4', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C4', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'G3', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G3', dur: 0.15 },

    { note: 'E4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'E4', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C4', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'A3', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G3', dur: 0.3 },

    { note: 'E4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'E4', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C4', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'G3', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G3', dur: 0.15 },

    { note: 'E4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'E4', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C4', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'A3', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G3', dur: 0.3 }
];

// Overworld bass line (triangle wave)
const OVERWORLD_BASS = [
    { note: 'C2', dur: 0.15 }, { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 },
    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.15 },
    { note: null, dur: 0.6 }, { note: null, dur: 0.3 },

    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 }, { note: null, dur: 0.3 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G1', dur: 0.15 },
    { note: 'A1', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'A#1', dur: 0.15 },
    { note: 'A1', dur: 0.15 }, { note: 'G1', dur: 0.3 },

    { note: 'C2', dur: 0.15 }, { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 },
    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.15 },
    { note: null, dur: 0.6 }, { note: null, dur: 0.3 },

    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 }, { note: 'C2', dur: 0.15 },
    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'G1', dur: 0.15 },
    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.15 },

    { note: 'G1', dur: 0.15 }, { note: 'G1', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: null, dur: 0.15 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G1', dur: 0.15 },
    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'G1', dur: 0.15 },

    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.15 }, { note: 'G1', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G1', dur: 0.15 },
    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'G1', dur: 0.15 },

    { note: 'G1', dur: 0.15 }, { note: 'G1', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: null, dur: 0.15 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G1', dur: 0.15 },
    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'G1', dur: 0.15 },

    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.15 }, { note: 'G1', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G1', dur: 0.15 },
    { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 }, { note: 'G1', dur: 0.15 },

    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G1', dur: 0.15 },

    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G1', dur: 0.15 },

    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G1', dur: 0.15 },

    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'C2', dur: 0.15 },
    { note: null, dur: 0.15 }, { note: 'C2', dur: 0.15 }, { note: null, dur: 0.15 },
    { note: 'G1', dur: 0.15 }, { note: null, dur: 0.3 }, { note: 'G1', dur: 0.15 }
];

// Underground theme - lower pitch, minor feel
const UNDERGROUND_MELODY = [
    { note: 'G4', dur: 0.2 }, { note: 'G4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'G4', dur: 0.2 }, { note: null, dur: 0.4 }, { note: 'Eb4', dur: 0.2 },
    { note: 'G4', dur: 0.2 }, { note: null, dur: 0.4 }, { note: 'B4', dur: 0.2 },
    { note: null, dur: 0.6 }, { note: null, dur: 0.4 },

    { note: 'Eb4', dur: 0.2 }, { note: null, dur: 0.4 }, { note: 'F4', dur: 0.2 },
    { note: null, dur: 0.4 }, { note: 'Eb4', dur: 0.2 }, { note: 'D4', dur: 0.2 },
    { note: 'Eb4', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'D4', dur: 0.2 },
    { note: 'C4', dur: 0.4 }, { note: null, dur: 0.2 },

    { note: 'C4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'C4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'C4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'D4', dur: 0.2 }, { note: 'Eb4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'C4', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'D4', dur: 0.2 },

    { note: 'Eb4', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'Eb4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'Eb4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'D4', dur: 0.2 }, { note: 'Eb4', dur: 0.2 }, { note: null, dur: 0.2 },

    { note: 'F4', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'F4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'F4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'F4', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'F4', dur: 0.2 },

    { note: 'Eb4', dur: 0.2 }, { note: 'D4', dur: 0.2 }, { note: 'Eb4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'C4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'C4', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'C4', dur: 0.2 },

    { note: 'Eb4', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'Eb4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'Eb4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'D4', dur: 0.2 }, { note: 'Eb4', dur: 0.2 }, { note: null, dur: 0.2 },

    { note: 'F4', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'F4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'F4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'F4', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'F4', dur: 0.2 },

    { note: 'Eb4', dur: 0.2 }, { note: 'D4', dur: 0.2 }, { note: 'Eb4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'C4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'C4', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'C4', dur: 0.2 },

    { note: 'Eb4', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'Eb4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'Eb4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'D4', dur: 0.2 }, { note: 'Eb4', dur: 0.2 }, { note: null, dur: 0.2 },

    { note: 'F4', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'F4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'F4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'F4', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'F4', dur: 0.2 },

    { note: 'Eb4', dur: 0.2 }, { note: 'D4', dur: 0.2 }, { note: 'Eb4', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'C4', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'C4', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'C4', dur: 0.2 }
];

const UNDERGROUND_BASS = [
    { note: 'C3', dur: 0.2 }, { note: 'C3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'C3', dur: 0.2 }, { note: null, dur: 0.4 }, { note: 'C3', dur: 0.2 },
    { note: 'C3', dur: 0.2 }, { note: null, dur: 0.4 }, { note: 'G2', dur: 0.2 },
    { note: null, dur: 0.6 }, { note: null, dur: 0.4 },

    { note: 'C3', dur: 0.2 }, { note: null, dur: 0.4 }, { note: 'C3', dur: 0.2 },
    { note: null, dur: 0.4 }, { note: 'C3', dur: 0.2 }, { note: 'Bb2', dur: 0.2 },
    { note: 'C3', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'Bb2', dur: 0.2 },
    { note: 'G2', dur: 0.4 }, { note: null, dur: 0.2 },

    { note: 'G2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'G2', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'C3', dur: 0.2 }, { note: 'Eb3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'C3', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'G2', dur: 0.2 },

    { note: 'Bb2', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'Eb3', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'Eb3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'D3', dur: 0.2 }, { note: 'Eb3', dur: 0.2 }, { note: null, dur: 0.2 },

    { note: 'F3', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'F3', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'F3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'F3', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'F3', dur: 0.2 },

    { note: 'Eb3', dur: 0.2 }, { note: 'D3', dur: 0.2 }, { note: 'Eb3', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'C3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'G2', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'G2', dur: 0.2 },

    { note: 'Bb2', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'Eb3', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'Eb3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'D3', dur: 0.2 }, { note: 'Eb3', dur: 0.2 }, { note: null, dur: 0.2 },

    { note: 'F3', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'F3', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'F3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'F3', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'F3', dur: 0.2 },

    { note: 'Eb3', dur: 0.2 }, { note: 'D3', dur: 0.2 }, { note: 'Eb3', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'C3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'G2', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'G2', dur: 0.2 },

    { note: 'Bb2', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'Eb3', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'Eb3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'D3', dur: 0.2 }, { note: 'Eb3', dur: 0.2 }, { note: null, dur: 0.2 },

    { note: 'F3', dur: 0.4 }, { note: null, dur: 0.4 }, { note: 'F3', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'F3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'F3', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'F3', dur: 0.2 },

    { note: 'Eb3', dur: 0.2 }, { note: 'D3', dur: 0.2 }, { note: 'Eb3', dur: 0.2 },
    { note: null, dur: 0.2 }, { note: 'C3', dur: 0.2 }, { note: null, dur: 0.2 },
    { note: 'G2', dur: 0.2 }, { note: null, dur: 0.2 }, { note: 'G2', dur: 0.2 }
];

// Castle theme - ominous, slower
const CASTLE_MELODY = [
    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G4', dur: 0.3 },
    { note: 'C5', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'B4', dur: 0.3 },

    { note: 'A5', dur: 0.3 }, { note: 'G5', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G4', dur: 0.3 },
    { note: 'C5', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'B4', dur: 0.3 },

    { note: 'A5', dur: 0.3 }, { note: 'G5', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'E4', dur: 0.3 }, { note: 'E4', dur: 0.3 },
    { note: 'E4', dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G4', dur: 0.3 },
    { note: 'C5', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'B4', dur: 0.3 },

    { note: 'A5', dur: 0.3 }, { note: 'G5', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G4', dur: 0.3 },
    { note: 'C5', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'B4', dur: 0.3 },

    { note: 'A5', dur: 0.3 }, { note: 'G5', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'E4', dur: 0.3 }, { note: 'E4', dur: 0.3 },
    { note: 'E4', dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G4', dur: 0.3 },
    { note: 'C5', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'B4', dur: 0.3 },

    { note: 'A5', dur: 0.3 }, { note: 'G5', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'F4', dur: 0.3 }, { note: 'F4', dur: 0.3 },
    { note: 'F4', dur: 0.3 }, { note: null, dur: 0.3 }
];

const CASTLE_BASS = [
    { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },

    { note: 'A2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },

    { note: 'A2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'E2', dur: 0.3 }, { note: 'E2', dur: 0.3 }, { note: 'E2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'E2', dur: 0.3 }, { note: 'E2', dur: 0.3 },
    { note: 'E2', dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },

    { note: 'A2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },

    { note: 'A2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'E2', dur: 0.3 }, { note: 'E2', dur: 0.3 }, { note: 'E2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'E2', dur: 0.3 }, { note: 'E2', dur: 0.3 },
    { note: 'E2', dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },

    { note: 'A2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: null, dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: 'C2', dur: 0.3 }, { note: 'C2', dur: 0.3 },
    { note: 'C2', dur: 0.3 }, { note: null, dur: 0.3 }
];

// Underwater theme - bubbly, slower pace
const UNDERWATER_MELODY = [
    { note: 'G5', dur: 0.3 }, { note: 'A5', dur: 0.3 }, { note: 'B5', dur: 0.3 },
    { note: 'A5', dur: 0.3 }, { note: 'G5', dur: 0.3 }, { note: 'E5', dur: 0.3 },
    { note: 'D5', dur: 0.3 }, { note: 'E5', dur: 0.3 }, { note: 'G5', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'E5', dur: 0.3 }, { note: 'D5', dur: 0.3 }, { note: 'C5', dur: 0.3 },
    { note: 'D5', dur: 0.3 }, { note: 'E5', dur: 0.3 }, { note: 'G5', dur: 0.3 },
    { note: 'A5', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G5', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'G5', dur: 0.3 }, { note: 'A5', dur: 0.3 }, { note: 'B5', dur: 0.3 },
    { note: 'A5', dur: 0.3 }, { note: 'G5', dur: 0.3 }, { note: 'E5', dur: 0.3 },
    { note: 'D5', dur: 0.3 }, { note: 'E5', dur: 0.3 }, { note: 'G5', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'E5', dur: 0.3 }, { note: 'D5', dur: 0.3 }, { note: 'C5', dur: 0.3 },
    { note: 'D5', dur: 0.3 }, { note: 'E5', dur: 0.3 }, { note: 'G5', dur: 0.3 },
    { note: 'A5', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'A5', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'C5', dur: 0.3 }, { note: 'D5', dur: 0.3 }, { note: 'E5', dur: 0.3 },
    { note: 'D5', dur: 0.3 }, { note: 'C5', dur: 0.3 }, { note: 'B4', dur: 0.3 },
    { note: 'A4', dur: 0.3 }, { note: 'B4', dur: 0.3 }, { note: 'C5', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'D5', dur: 0.3 }, { note: 'E5', dur: 0.3 }, { note: 'G5', dur: 0.3 },
    { note: 'E5', dur: 0.3 }, { note: 'D5', dur: 0.3 }, { note: 'C5', dur: 0.3 },
    { note: 'B4', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'C5', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'G5', dur: 0.3 }, { note: 'A5', dur: 0.3 }, { note: 'B5', dur: 0.3 },
    { note: 'A5', dur: 0.3 }, { note: 'G5', dur: 0.3 }, { note: 'E5', dur: 0.3 },
    { note: 'D5', dur: 0.3 }, { note: 'E5', dur: 0.3 }, { note: 'G5', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'E5', dur: 0.3 }, { note: 'D5', dur: 0.3 }, { note: 'C5', dur: 0.3 },
    { note: 'D5', dur: 0.3 }, { note: 'E5', dur: 0.3 }, { note: 'G5', dur: 0.3 },
    { note: 'A5', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G5', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 }
];

const UNDERWATER_BASS = [
    { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'G2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'G2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'A2', dur: 0.3 }, { note: 'A2', dur: 0.3 }, { note: 'A2', dur: 0.3 },
    { note: 'A2', dur: 0.3 }, { note: 'A2', dur: 0.3 }, { note: 'A2', dur: 0.3 },
    { note: 'A2', dur: 0.3 }, { note: 'A2', dur: 0.3 }, { note: 'A2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'D3', dur: 0.3 }, { note: 'D3', dur: 0.3 }, { note: 'D3', dur: 0.3 },
    { note: 'D3', dur: 0.3 }, { note: 'D3', dur: 0.3 }, { note: 'D3', dur: 0.3 },
    { note: 'D3', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'D3', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 },
    { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 }, { note: 'C3', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 },

    { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: 'G2', dur: 0.3 }, { note: null, dur: 0.3 }, { note: 'G2', dur: 0.3 },
    { note: null, dur: 0.3 }, { note: null, dur: 0.3 }
];

export class MusicPlayer {
    constructor(audioCtx) {
        this.audioContext = audioCtx;
        this.isPlaying = false;
        this.currentTheme = null;
        this.melodyTimeout = null;
        this.bassTimeout = null;
        this.melodyIndex = 0;
        this.bassIndex = 0;
        this.percIndex = 0;
    }

    getFrequency(note) {
        if (!note) return 0;
        return NOTES[note] || 0;
    }

    playNote(frequency, duration, type = 'square', volume = 0.1) {
        if (!frequency || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playPercussion() {
        if (!this.audioContext) return;

        const bufferSize = this.audioContext.sampleRate * 0.05;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        noise.buffer = buffer;
        gainNode.gain.setValueAtTime(0.06, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        noise.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        noise.start(this.audioContext.currentTime);
    }

    scheduleMelody(melody, bass) {
        if (!this.isPlaying) return;

        const note = melody[this.melodyIndex];
        const duration = note.dur;

        if (note.note) {
            this.playNote(this.getFrequency(note.note), duration * 0.9, 'square', 0.08);
        }

        this.melodyIndex = (this.melodyIndex + 1) % melody.length;

        this.melodyTimeout = setTimeout(() => {
            this.scheduleMelody(melody, bass);
        }, duration * 1000);
    }

    scheduleBass(bass) {
        if (!this.isPlaying) return;

        const note = bass[this.bassIndex];
        const duration = note.dur;

        if (note.note) {
            this.playNote(this.getFrequency(note.note), duration * 0.95, 'triangle', 0.12);
        }

        this.bassIndex = (this.bassIndex + 1) % bass.length;

        this.bassTimeout = setTimeout(() => {
            this.scheduleBass(bass);
        }, duration * 1000);
    }

    schedulePercussion() {
        if (!this.isPlaying) return;

        this.playPercussion();
        this.percIndex = (this.percIndex + 1) % 4;

        this.bassTimeout = setTimeout(() => {
            this.schedulePercussion();
        }, 250);
    }

    playOverworld() {
        this.stop();
        this.isPlaying = true;
        this.currentTheme = 'overworld';
        this.melodyIndex = 0;
        this.bassIndex = 0;

        this.scheduleMelody(OVERWORLD_MELODY, OVERWORLD_BASS);
        this.scheduleBass(OVERWORLD_BASS);
        this.schedulePercussion();
    }

    playUnderground() {
        this.stop();
        this.isPlaying = true;
        this.currentTheme = 'underground';
        this.melodyIndex = 0;
        this.bassIndex = 0;

        this.scheduleMelody(UNDERGROUND_MELODY, UNDERGROUND_BASS);
        this.scheduleBass(UNDERGROUND_BASS);
        this.schedulePercussion();
    }

    playCastle() {
        this.stop();
        this.isPlaying = true;
        this.currentTheme = 'castle';
        this.melodyIndex = 0;
        this.bassIndex = 0;

        this.scheduleMelody(CASTLE_MELODY, CASTLE_BASS);
        this.scheduleBass(CASTLE_BASS);
        this.schedulePercussion();
    }

    playUnderwater() {
        this.stop();
        this.isPlaying = true;
        this.currentTheme = 'underwater';
        this.melodyIndex = 0;
        this.bassIndex = 0;

        this.scheduleMelody(UNDERWATER_MELODY, UNDERWATER_BASS);
        this.scheduleBass(UNDERWATER_BASS);
        this.schedulePercussion();
    }

    stop() {
        this.isPlaying = false;

        if (this.melodyTimeout) {
            clearTimeout(this.melodyTimeout);
            this.melodyTimeout = null;
        }
        if (this.bassTimeout) {
            clearTimeout(this.bassTimeout);
            this.bassTimeout = null;
        }
    }

    getIsPlaying() {
        return this.isPlaying;
    }
}