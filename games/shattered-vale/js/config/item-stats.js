// config/item-stats.js — what to SHOW the player about each item: its
// attack/defense/speed bonus and a one-line description. Separate from
// config/item-effects.js (which defines what actually happens on pickup/
// equip) so the inventory UI has one clear place to read "what does this
// item do" without wading through callback logic.
//
// ARMOR_DEFENSE is the one new numeric balance value introduced here —
// armor/helmet/shield pieces previously had no mechanical effect at all.
// Player.takeDamage() now subtracts the equipped total (see entities/
// player.js and Combat.recomputeDefense in core/combat.js).

const ARMOR_DEFENSE = {
  helmet: 3,
  crownSkeleton: 6,
  armor: 4,
  armorJungle: 7,
  armorObsidian: 12,
  shield: 5,
  shieldBone: 8,
};

// Speed bonus shown for boots — both boots kinds set the same absolute
// speed (BOOTS_SPEED), so the "bonus" shown is the delta over base speed.
const BOOTS_SPEED_BONUS = Math.round((BOOTS_SPEED - PLAYER_BASE_STATS.speed) * 10) / 10;

const ITEM_STATS = {
  sword:          { name: 'Iron Sword', atk: WEAPON_ATTACK_BONUS.sword },
  swordLegendary: { name: 'Legendary Sword', atk: WEAPON_ATTACK_BONUS.swordLegendary },
  swordMolten:    { name: 'Molten Blade', atk: WEAPON_ATTACK_BONUS.swordMolten },

  armor:          { name: 'Iron Armor', def: ARMOR_DEFENSE.armor },
  armorJungle:    { name: 'Jungle Armor', def: ARMOR_DEFENSE.armorJungle },
  armorObsidian:  { name: 'Obsidian Armor', def: ARMOR_DEFENSE.armorObsidian },
  helmet:         { name: "Devil's Helmet", def: ARMOR_DEFENSE.helmet },
  crownSkeleton:  { name: 'Skeleton Crown', def: ARMOR_DEFENSE.crownSkeleton },
  shield:         { name: 'Shield', def: ARMOR_DEFENSE.shield },
  shieldBone:     { name: 'Bone Shield', def: ARMOR_DEFENSE.shieldBone },

  boots:          { name: 'Swift Boots', spd: BOOTS_SPEED_BONUS },
  bootsFireproof: { name: 'Fireproof Boots', spd: BOOTS_SPEED_BONUS, extra: 'Immune to lava' },

  potionRed:      { name: 'Health Potion', extra: 'Restores HP fully' },
  potionBlue:     { name: 'Mana Potion', extra: 'Restores Mana fully' },
  coin:           { name: 'Gold Coin' },
  key:            { name: 'Key' },
};
const DEFAULT_ITEM_STATS = { name: 'Item' };

function getItemStats(kind) {
  return ITEM_STATS[kind] || DEFAULT_ITEM_STATS;
}
