// config/level-layout.js — world content: where things are and what NPCs
// say. Pure data (no classes instantiated here) so it can be read top to
// bottom without needing to know how NPC/WorldItem/Enemy work. See
// core/world-factory.js for the code that turns this into live objects.
//
// `spriteKey` values index into the Sprites registry (sprites/sprites.js)
// and are resolved at world-build time, once sprites have been generated.

const NPC_DEFS = [
  {
    id: 'elder',
    x: 10 * TILE, y: 37 * TILE,
    name: 'Elder Rowan',
    spriteKey: 'elder',
    dialogue: [
      "Traveler, thank the stars you've come.",
      "The Goblin King Grimtooth has claimed a castle in the northern lands as his stronghold, sending his forces to terrorize our village.",
      "Legend says an iron sword is hidden in the forest west of the castle — you'll need it to stand a chance.",
      "Find the sword, then seek out the Goblin King Grimtooth. May fortune guide your blade.",
      "The castle gate will open only after you've defeated all the Blue and Green Slimes.",
    ],
    opts: { questGiver: true, hasQuest: true, dir: 'down' },
  },
  {
    id: 'merchant',
    x: 16 * TILE, y: 33 * TILE,
    name: 'Wandering Merchant',
    spriteKey: 'merchant',
    dialogue: [
      "Ah, a new face! I don't have much to sell today, I'm afraid.",
      "But take this health potion, on the house. Safe travels out there.",
    ],
    opts: { dir: 'down' },
  },
];

const WORLD_ITEM_PLACEMENTS = [
  { x: 3 * TILE, y: 16 * TILE, kind: 'sword' },
  { x: 25 * TILE + 6, y: 1 * TILE + 2, kind: 'potionRed' },
  { x: 3 * TILE, y: 19 * TILE, kind: 'coin', opts: { value: 5 } },
  { x: 19 * TILE, y: 3 * TILE, kind: 'coin', opts: { value: 3 } },
  { x: 24 * TILE, y: 2 * TILE, kind: 'coin', opts: { value: 3 } },
];

// The full monster roster for every area of the Shattered Vale. This used to
// be duplicated verbatim between initial setup and restartGame() — now it's
// defined once and both paths build from it (see WorldFactory.createEnemies).
const ENEMY_PLACEMENTS = [
  // World 1 — starting valley
  { x: 15 * TILE, y: 3 * TILE, type: 'slimeGreen' },
  { x: 18 * TILE, y: 7 * TILE, type: 'slimeGreen' },
  { x: 8 * TILE, y: 15 * TILE, type: 'slimeBlue' },
  { x: 10 * TILE, y: 17 * TILE, type: 'slimeBlue' },
  { x: 12 * TILE, y: 17 * TILE, type: 'slimeBlue' },
  { x: 23 * TILE, y: 4 * TILE, type: 'slimeGreen' },
  { x: 25 * TILE, y: 4 * TILE, type: 'slimeGreen' },
  { x: 21 * TILE, y: 17 * TILE, type: 'goblinBoss', opts: { aggroRange: 170 } },

  // World 2 — beach monsters
  { x: 34 * TILE, y: 6 * TILE, type: 'slimeRed' },
  { x: 38 * TILE, y: 12 * TILE, type: 'slimeRed' },
  { x: 44 * TILE, y: 5 * TILE, type: 'slimeRed' },
  { x: 38 * TILE, y: 15 * TILE, type: 'slimeRed' },
  { x: 36 * TILE, y: 35 * TILE, type: 'slimeRed' },
  { x: 35 * TILE, y: 22 * TILE, type: 'slimeRed' },
  { x: 42 * TILE, y: 36 * TILE, type: 'slimeRed' },

  // World 2 — Sand Scorpions. Much stronger than the beach slimes (see
  // ENEMY_DEFS.sandScorpion in config/balance.js), spread across the full
  // oasis to make the whole zone feel genuinely dangerous, not just its
  // boss arena.
  { x: 38 * TILE, y: 4 * TILE, type: 'sandScorpion' },
  { x: 56 * TILE, y: 4 * TILE, type: 'sandScorpion' },
  { x: 65 * TILE, y: 4 * TILE, type: 'sandScorpion' },
  { x: 74 * TILE, y: 4 * TILE, type: 'sandScorpion' },
  { x: 83 * TILE, y: 4 * TILE, type: 'sandScorpion' },
  { x: 92 * TILE, y: 4 * TILE, type: 'sandScorpion' },
  { x: 101 * TILE, y: 4 * TILE, type: 'sandScorpion' },
  { x: 71 * TILE, y: 9 * TILE, type: 'sandScorpion' },
  { x: 89 * TILE, y: 9 * TILE, type: 'sandScorpion' },
  { x: 104 * TILE, y: 9 * TILE, type: 'sandScorpion' },
  { x: 56 * TILE, y: 14 * TILE, type: 'sandScorpion' },
  { x: 83 * TILE, y: 14 * TILE, type: 'sandScorpion' },
  { x: 101 * TILE, y: 14 * TILE, type: 'sandScorpion' },
  { x: 32 * TILE, y: 19 * TILE, type: 'sandScorpion' },
  { x: 50 * TILE, y: 19 * TILE, type: 'sandScorpion' },
  { x: 77 * TILE, y: 19 * TILE, type: 'sandScorpion' },
  { x: 95 * TILE, y: 19 * TILE, type: 'sandScorpion' },
  { x: 44 * TILE, y: 24 * TILE, type: 'sandScorpion' },
  { x: 62 * TILE, y: 24 * TILE, type: 'sandScorpion' },
  { x: 89 * TILE, y: 24 * TILE, type: 'sandScorpion' },
  { x: 104 * TILE, y: 24 * TILE, type: 'sandScorpion' },
  { x: 47 * TILE, y: 29 * TILE, type: 'sandScorpion' },
  { x: 74 * TILE, y: 29 * TILE, type: 'sandScorpion' },
  { x: 92 * TILE, y: 29 * TILE, type: 'sandScorpion' },
  { x: 104 * TILE, y: 29 * TILE, type: 'sandScorpion' },
  { x: 59 * TILE, y: 34 * TILE, type: 'sandScorpion' },
  { x: 86 * TILE, y: 34 * TILE, type: 'sandScorpion' },
  { x: 104 * TILE, y: 34 * TILE, type: 'sandScorpion' },
  { x: 71 * TILE, y: 39 * TILE, type: 'sandScorpion' },
  { x: 89 * TILE, y: 39 * TILE, type: 'sandScorpion' },

  // World 2 — Devil Boss of the Sand Oasis
  { x: 50 * TILE, y: 40 * TILE, type: 'devilBoss', opts: { aggroRange: 190 } },

  // World 3 — Jungle (south of the oasis, behind the Jungle Gates)
  { x: 8 * TILE, y: 51 * TILE, type: 'slimeJungle' },
  { x: 14 * TILE, y: 54 * TILE, type: 'slimeJungle' },
  { x: 20 * TILE, y: 50 * TILE, type: 'slimeJungle' },
  { x: 6 * TILE, y: 58 * TILE, type: 'slimeJungle' },
  { x: 18 * TILE, y: 60 * TILE, type: 'slimeJungle' },
  { x: 32 * TILE, y: 52 * TILE, type: 'slimeJungle' },
  { x: 40 * TILE, y: 55 * TILE, type: 'slimeJungle' },
  { x: 46 * TILE, y: 51 * TILE, type: 'slimeJungle' },
  { x: 36 * TILE, y: 60 * TILE, type: 'slimeJungle' },
  { x: 44 * TILE, y: 62 * TILE, type: 'slimeJungle' },
  { x: 52 * TILE, y: 53 * TILE, type: 'slimeJungle' },
  { x: 8 * TILE, y: 68 * TILE, type: 'slimeJungle' },
  { x: 16 * TILE, y: 70 * TILE, type: 'slimeJungle' },
  { x: 24 * TILE, y: 66 * TILE, type: 'slimeJungle' },
  { x: 4 * TILE, y: 72 * TILE, type: 'slimeJungle' },

  // World 3 — Jungle Bosses, two arenas on opposite sides of the jungle
  { x: 10 * TILE, y: (48 + 30) * TILE, type: 'orcBoss', opts: { aggroRange: 180 } },
  { x: 48 * TILE, y: (48 + 18) * TILE, type: 'witchBoss', opts: { aggroRange: 200 } },

  // World 4 — Skeleton Dungeon (south of the Jungle Gate)
  { x: 8 * TILE, y: 92 * TILE, type: 'spider' },
  { x: 16 * TILE, y: 95 * TILE, type: 'skeleton' },
  { x: 24 * TILE, y: 91 * TILE, type: 'spider' },
  { x: 34 * TILE, y: 94 * TILE, type: 'skeleton' },
  { x: 44 * TILE, y: 92 * TILE, type: 'spider' },
  { x: 54 * TILE, y: 95 * TILE, type: 'spider' },
  { x: 64 * TILE, y: 91 * TILE, type: 'skeleton' },
  { x: 74 * TILE, y: 94 * TILE, type: 'spider' },
  { x: 84 * TILE, y: 92 * TILE, type: 'skeleton' },
  { x: 94 * TILE, y: 95 * TILE, type: 'spider' },

  { x: 12 * TILE, y: 101 * TILE, type: 'skeleton' },
  { x: 22 * TILE, y: 103 * TILE, type: 'spider' },
  { x: 32 * TILE, y: 100 * TILE, type: 'skeleton' },
  { x: 42 * TILE, y: 104 * TILE, type: 'spider' },
  { x: 52 * TILE, y: 101 * TILE, type: 'skeleton' },
  { x: 62 * TILE, y: 103 * TILE, type: 'spider' },
  { x: 72 * TILE, y: 100 * TILE, type: 'skeleton' },
  { x: 82 * TILE, y: 104 * TILE, type: 'spider' },
  { x: 92 * TILE, y: 101 * TILE, type: 'skeleton' },
  { x: 100 * TILE, y: 103 * TILE, type: 'spider' },

  { x: 6 * TILE, y: 111 * TILE, type: 'spider' },
  { x: 18 * TILE, y: 113 * TILE, type: 'skeleton' },
  { x: 30 * TILE, y: 110 * TILE, type: 'spider' },
  { x: 40 * TILE, y: 114 * TILE, type: 'skeleton' },
  { x: 50 * TILE, y: 111 * TILE, type: 'spider' },
  { x: 60 * TILE, y: 113 * TILE, type: 'skeleton' },
  { x: 70 * TILE, y: 110 * TILE, type: 'spider' },
  { x: 80 * TILE, y: 114 * TILE, type: 'skeleton' },
  { x: 90 * TILE, y: 111 * TILE, type: 'spider' },
  { x: 100 * TILE, y: 113 * TILE, type: 'skeleton' },

  { x: 10 * TILE, y: 121 * TILE, type: 'skeleton' },
  { x: 20 * TILE, y: 123 * TILE, type: 'spider' },
  { x: 30 * TILE, y: 120 * TILE, type: 'skeleton' },
  { x: 40 * TILE, y: 124 * TILE, type: 'spider' },
  { x: 50 * TILE, y: 121 * TILE, type: 'skeleton' },
  { x: 60 * TILE, y: 123 * TILE, type: 'spider' },
  { x: 70 * TILE, y: 120 * TILE, type: 'skeleton' },
  { x: 80 * TILE, y: 124 * TILE, type: 'spider' },
  { x: 90 * TILE, y: 121 * TILE, type: 'skeleton' },

  { x: 14 * TILE, y: 133 * TILE, type: 'spider' },
  { x: 26 * TILE, y: 135 * TILE, type: 'skeleton' },
  { x: 38 * TILE, y: 132 * TILE, type: 'spider' },
  { x: 50 * TILE, y: 136 * TILE, type: 'skeleton' },
  { x: 62 * TILE, y: 133 * TILE, type: 'spider' },
  { x: 74 * TILE, y: 135 * TILE, type: 'skeleton' },
  { x: 86 * TILE, y: 132 * TILE, type: 'spider' },
  { x: 96 * TILE, y: 136 * TILE, type: 'skeleton' },

  { x: 18 * TILE, y: 145 * TILE, type: 'skeleton' },
  { x: 34 * TILE, y: 147 * TILE, type: 'spider' },
  { x: 50 * TILE, y: 144 * TILE, type: 'skeleton' },
  { x: 66 * TILE, y: 147 * TILE, type: 'spider' },
  { x: 82 * TILE, y: 145 * TILE, type: 'skeleton' },

  // World 4 — Skeleton King (throne room, far south of the dungeon)
  { x: 53 * TILE, y: 158 * TILE, type: 'skeletonKing', opts: { aggroRange: 220 } },

  // World 5 — Molten Depths (south of the dungeon, behind the Lava Gate —
  // opens once the Skeleton King is dead). Troll Chieftain's arena comes
  // first, then a lava-flanked corridor (behind the Pit Gate, which opens
  // once the Chieftain is dead) leads to the Pit Devil's arena.
  { x: 47 * TILE, y: 178 * TILE, type: 'devilLesser' },
  { x: 59 * TILE, y: 186 * TILE, type: 'devilLesser' },
  { x: 48 * TILE, y: 191 * TILE, type: 'orcRaider' },
  { x: 58 * TILE, y: 181 * TILE, type: 'orcRaider' },
  { x: 53 * TILE, y: 184 * TILE, type: 'troll' },
  { x: 53 * TILE, y: 202 * TILE, type: 'orcRaider' },
  { x: 44 * TILE, y: 214 * TILE, type: 'devilLesser' },
  { x: 62 * TILE, y: 226 * TILE, type: 'devilLesser' },
  { x: 46 * TILE, y: 228 * TILE, type: 'orcRaider' },
  { x: 53 * TILE, y: 218 * TILE, type: 'troll' },
  { x: 60 * TILE, y: 212 * TILE, type: 'troll' },

  { x: 53 * TILE, y: 186 * TILE, type: 'trollChieftain', opts: { aggroRange: 210 } },
  { x: 53 * TILE, y: 220 * TILE, type: 'pitDevil', opts: { aggroRange: 260 } },
];

const BOSS_NAMES = {
  goblinBoss: 'Goblin King Grimtooth',
  devilBoss: 'Devil of the Oasis',
  orcBoss: 'Orc Warlord Skarn',
  witchBoss: 'Jungle Witch Maera',
  skeletonKing: 'The Skeleton King',
};

// Player spawn point, referenced both at game start and on restart.
const PLAYER_SPAWN = { x: 13 * TILE, y: 44 * TILE + 20 };
