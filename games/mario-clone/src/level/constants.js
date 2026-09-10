// Physics constants
export const GRAVITY = 0.5;
export const PLAYER_WALK_SPEED = 4;
export const PLAYER_RUN_SPEED = 6;
export const JUMP_VELOCITY = -12;
export const JUMP_FULL_VELOCITY = -15;
export const FRICTION = 0.15;
export const TERMINAL_VELOCITY = 8;
export const TILE_SIZE = 16;
export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;

// NES color palette
export const COLORS = {
    SKY_BLUE: '#5C94FC',
    RED: '#FC0000',
    BROWN_DARK: '#A00000',
    BROWN_MID: '#FC7F00',
    ORANGE: '#F8B800',
    YELLOW: '#F8D800',
    GREEN_DARK: '#00A800',
    GREEN_LIGHT: '#B8F810',
    BLACK: '#000000',
    WHITE: '#FCFCFC',
    PURPLE: '#503000',
    GRAY: '#A0A0A0'
};

// Tile types
export const TILE_TYPES = {
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION: 3,
    QUESTION_USED: 4,
    COIN: 5,
    PIPE_TOP: 6,
    PIPE_BODY: 7,
    FLAGPOLE: 8,
    FLAG_BALL: 9,
    FLAG_FLAG: 10
};

// Power states
export const POWER_STATES = {
    SMALL: 'small',
    SUPER: 'super',
    FIRE: 'fire',
    STAR: 'star'
};
