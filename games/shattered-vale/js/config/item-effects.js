// config/item-effects.js — what happens when the player picks up, equips,
// or unequips an item, and what happens when a boss falls.
//
// Each table is keyed by item `kind` (or boss `type`) and holds the toast
// text / screen-flash / state changes for that case. core/combat.js walks
// these tables instead of a long if/else chain; anything not listed here
// falls back to a small generic default so unlisted item kinds still work.
//
// `ctx` objects are built fresh by core/combat.js for each call and expose
// only what a given effect needs (player, inventory, particles, toast(), etc).

const ITEM_PICKUP_EFFECTS = {
  sword: {
    apply: (ctx) => {
      const alreadyHasOne = ctx.inventory.items.sword > 0 || ctx.player.hasSword;
      ctx.inventory.add('sword', 1);
      if (alreadyHasOne) return;
      ctx.player.hasSword = true;
      ctx.advanceQuestTo(2);
    },
    toast: 'Found the Iron Sword! Attack increased.',
    flash: { color: '232,201,60', alpha: 0.35 },
  },
  // Coins are gold directly — they never enter the backpack.
  coin: {
    apply: (ctx) => {
      ctx.player.gold += ctx.item.value;
      ctx.particles.floatText(ctx.item.x, ctx.item.y - 6, '+' + ctx.item.value + 'g', '#e8c93c');
    },
  },
  armor: {
    apply: (ctx) => ctx.inventory.add('armor', 1),
    toast: 'Picked up Iron Armor!',
  },
  helmet: {
    apply: (ctx) => ctx.inventory.add('helmet', 1),
    toast: "Picked up the Devil's Helmet!",
  },
  armorJungle: {
    apply: (ctx) => ctx.inventory.add('armorJungle', 1),
    toast: 'Picked up Jungle Armor!',
  },
  boots: {
    apply: (ctx) => { ctx.inventory.add('boots', 1); ctx.player.speed = BOOTS_SPEED; },
    toast: 'Picked up Swift Boots! Movement speed increased.',
  },
  swordLegendary: {
    apply: (ctx) => {
      ctx.inventory.add('swordLegendary', 1);
      ctx.player.hasSword = true;
      ctx.player.hasLegendarySword = true;
      ctx.player.hasMoltenSword = false;
    },
    toast: 'Equipped the Legendary Sword! Attack greatly increased.',
    flash: { color: '63,212,168', alpha: 0.4 },
  },
  shieldBone: {
    apply: (ctx) => ctx.inventory.add('shieldBone', 1),
    toast: 'Picked up the Bone Shield!',
  },
  crownSkeleton: {
    apply: (ctx) => ctx.inventory.add('crownSkeleton', 1),
    toast: 'Picked up the Skeleton Crown!',
  },
  potionBlue: {
    apply: (ctx) => ctx.inventory.add('potionBlue', 1),
    toast: 'Picked up a Blue Potion! (drink to restore mana)',
  },
  armorObsidian: {
    apply: (ctx) => ctx.inventory.add('armorObsidian', 1),
    toast: 'Picked up Obsidian Armor!',
  },
  swordMolten: {
    apply: (ctx) => {
      ctx.inventory.add('swordMolten', 1);
      ctx.player.hasSword = true;
      ctx.player.hasLegendarySword = false;
      ctx.player.hasMoltenSword = true;
    },
    toast: 'Found the Molten Blade! Attack massively increased.',
    flash: { color: '255,110,40', alpha: 0.45 },
  },
  bootsFireproof: {
    apply: (ctx) => { ctx.inventory.add('bootsFireproof', 1); ctx.player.speed = BOOTS_SPEED; ctx.player.fireproof = true; },
    toast: 'Picked up Fireproof Boots! Lava no longer burns you.',
    flash: { color: '255,140,40', alpha: 0.35 },
  },
};
// Fallback for any world item kind with no entry above (matches the
// original's generic `else` branch — this also covers the world's loose
// potionRed pickup, which never had its own toast in the original either).
const DEFAULT_PICKUP_EFFECT = {
  apply: (ctx) => ctx.inventory.add(ctx.item.kind, 1),
  toast: 'Picked up an item',
};

// Backpack potions are "used" (consumed for an effect), not equipped.
const USABLE_POTIONS = {
  potionRed: {
    use: (ctx) => ctx.inventory.usePotionRed(ctx.player),
    onUsed: (ctx) => {
      ctx.particles.floatText(ctx.player.centerX, ctx.player.y - 10, 'Healed!', '#f09595');
      ctx.toast('Drank a Health Potion — HP restored!');
    },
  },
  potionBlue: {
    use: (ctx) => ctx.inventory.usePotionBlue(ctx.player),
    onUsed: (ctx) => {
      ctx.particles.floatText(ctx.player.centerX, ctx.player.y - 10, 'Mana restored!', '#a878e0');
      ctx.toast('Consumed a Blue Potion — Mana fully restored!');
    },
  },
};

const ITEM_EQUIP_EFFECTS = {
  sword: {
    apply: (ctx) => {
      ctx.inventory.equip('sword');
      ctx.player.hasSword = true;
      ctx.player.hasLegendarySword = false;
      ctx.player.hasMoltenSword = false;
    },
    toast: 'Equipped Iron Sword!',
  },
  swordLegendary: {
    apply: (ctx) => {
      ctx.inventory.equip('swordLegendary');
      ctx.player.hasSword = true;
      ctx.player.hasLegendarySword = true;
      ctx.player.hasMoltenSword = false;
    },
    toast: 'Equipped the Legendary Sword!',
  },
  swordMolten: {
    apply: (ctx) => {
      ctx.inventory.equip('swordMolten');
      ctx.player.hasSword = true;
      ctx.player.hasLegendarySword = false;
      ctx.player.hasMoltenSword = true;
    },
    toast: 'Equipped the Molten Blade!',
  },
  armor: { apply: (ctx) => ctx.inventory.equip('armor'), toast: 'Equipped Iron Armor!' },
  helmet: { apply: (ctx) => ctx.inventory.equip('helmet'), toast: "Equipped the Devil's Helmet!" },
  armorJungle: { apply: (ctx) => ctx.inventory.equip('armorJungle'), toast: 'Equipped Jungle Armor!' },
  armorObsidian: { apply: (ctx) => ctx.inventory.equip('armorObsidian'), toast: 'Equipped Obsidian Armor!' },
  boots: {
    apply: (ctx) => { ctx.inventory.equip('boots'); ctx.player.speed = BOOTS_SPEED; ctx.player.fireproof = false; },
    toast: 'Equipped Swift Boots!',
  },
  bootsFireproof: {
    apply: (ctx) => { ctx.inventory.equip('bootsFireproof'); ctx.player.speed = BOOTS_SPEED; ctx.player.fireproof = true; },
    toast: 'Equipped Fireproof Boots!',
  },
  shieldBone: { apply: (ctx) => ctx.inventory.equip('shieldBone'), toast: 'Equipped the Bone Shield!' },
  crownSkeleton: { apply: (ctx) => ctx.inventory.equip('crownSkeleton'), toast: 'Equipped the Skeleton Crown!' },
};

const ITEM_UNEQUIP_EFFECTS = {
  weapon: (ctx) => {
    ctx.inventory.unequip('weapon');
    ctx.player.hasSword = false;
    ctx.player.hasLegendarySword = false;
    ctx.player.hasMoltenSword = false;
  },
  armor: (ctx) => ctx.inventory.unequip('armor'),
  helmet: (ctx) => ctx.inventory.unequip('helmet'),
  boots: (ctx) => {
    ctx.inventory.unequip('boots');
    ctx.player.speed = PLAYER_BASE_STATS.speed;
    ctx.player.fireproof = false;
  },
  shield: (ctx) => ctx.inventory.unequip('shield'),
};

// Gates that unlock automatically once their guardian enemies are all dead
// (as opposed to BOSS_DEFEAT_EVENTS below, which fire once for a specific
// boss's own death). Checked every frame by Combat.checkGateConditions.
const GATE_UNLOCK_CONDITIONS = [
  {
    isOpenFlag: 'isGateOpen',
    stillGuarded: (enemies) => enemies.some((e) => (e.type === 'slimeGreen' || e.type === 'slimeBlue') && e.alive),
    open: (map) => map.openGate(),
    toast: 'The gate to the goblin boss has opened!',
    flash: { color: '200,200,200', alpha: 0.3 },
  },
  {
    isOpenFlag: 'isSkeletonGateOpen',
    stillGuarded: (enemies) => enemies.some((e) => (e.type === 'orcBoss' || e.type === 'witchBoss') && e.alive),
    open: (map) => map.openSkeletonGate(),
    toast: 'The two Jungle bosses have fallen — the Skeleton Gate creaks open to the south!',
    flash: { color: '232,151,90', alpha: 0.4 },
  },
];

// What happens when each boss falls: drops (positioned relative to the
// boss's own death location via ctx.dropItem(dx, dy, kind)), quest/gate
// progression, and the little "System" dialogue cutscene.
const BOSS_DEFEAT_EVENTS = {
  goblinBoss: (ctx) => {
    ctx.dropItem(10, 6, 'armor');
    ctx.advanceQuestTo(3);
    ctx.map.openWorldTwoGate();
    ctx.toast('The Goblin King dropped Iron Armor!');
    ctx.setScreenFlash({ color: '232,201,60', alpha: 0.5 });
    ctx.openSystemDialogue([
      'The Goblin Boss has been vanquished!',
      'The Gate to the East has opened. Welcome to the Sand Oasis!',
    ]);
  },
  orcBoss: (ctx) => {
    ctx.dropItem(10, 6, 'armorJungle');
    ctx.toast('The Orc Warlord dropped Jungle Armor!');
    ctx.setScreenFlash({ color: '72,140,74', alpha: 0.5 });
  },
  witchBoss: (ctx) => {
    ctx.dropItem(10, 6, 'boots');
    ctx.toast('The Jungle Witch dropped Swift Boots!');
    ctx.setScreenFlash({ color: '63,212,168', alpha: 0.5 });
  },
  skeletonKing: (ctx) => {
    ctx.dropItem(14, 10, 'shieldBone');
    ctx.dropItem(-10, 10, 'crownSkeleton');
    ctx.dropItem(2, -8, 'potionBlue');
    ctx.toast('The Skeleton King has fallen! Dropped a Bone Shield, Skeleton Crown, and Blue Potion!');
    ctx.setScreenFlash({ color: '232,226,208', alpha: 0.6 });
    ctx.map.openLavaGate();
    ctx.openSystemDialogue([
      "The Skeleton King's throne crumbles to dust!",
      'The Skeleton Dungeon falls silent at last.',
      'But the floor cracks beneath it — a Lava Gate has opened to the south, into the Molten Depths.',
    ]);
  },
  devilBoss: (ctx) => {
    ctx.dropItem(10, 6, 'helmet');
    ctx.dropItem(-6, 6, 'swordLegendary');
    ctx.map.openJungleGate();
    ctx.toast('The Devil dropped a Helmet and a legendary blade!');
    ctx.setScreenFlash({ color: '244,212,60', alpha: 0.55 });
    ctx.openSystemDialogue([
      'The Devil of the Sand Oasis has been vanquished!',
      'Its dark hold over the dunes is broken at last.',
      'A Jungle Gate has creaked open to the south — but something ancient stirs within.',
    ]);
  },
  trollChieftain: (ctx) => {
    ctx.dropItem(10, 8, 'armorObsidian');
    ctx.map.openPitGate();
    ctx.toast('The Troll Chieftain dropped Obsidian Armor!');
    ctx.setScreenFlash({ color: '143,174,90', alpha: 0.5 });
    ctx.openSystemDialogue([
      'The Troll Chieftain crashes to the molten rock!',
      'Deeper in the pit, the Pit Gate grinds open — something far worse waits below.',
    ]);
  },
  pitDevil: (ctx) => {
    ctx.dropItem(10, 8, 'swordMolten');
    ctx.dropItem(-10, 8, 'bootsFireproof');
    ctx.toast('The Pit Devil has fallen! Dropped the Molten Blade and Fireproof Boots!');
    ctx.setScreenFlash({ color: '255,106,30', alpha: 0.65 });
    ctx.setVictory();
    ctx.openSystemDialogue([
      'The Pit Devil lets out a final, earth-shaking roar before collapsing into ash.',
      'The Molten Depths fall still. Every corner of the Shattered Vale is finally at peace.',
      'You have conquered the Shattered Vale.',
    ]);
  },
};
