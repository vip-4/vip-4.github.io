/* =========================================================================
 * data.js — Item database, balance config, loot & enemy tables.
 * Everything tunable lives here. Items are drawn procedurally (no art assets).
 * ========================================================================= */
(function () {
  'use strict';
  const G = window.G;

  /* ----------------------------- Config --------------------------------- */
  const Config = {
    TILE: 40,
    PLAYER_SPEED: 165,
    PLAYER_SPRINT: 1.7,
    PLAYER_RADIUS: 13,
    PLAYER_MAX_HP: 120,
    STAMINA_RECOVER: 25,    // sprint locks out until stamina recovers past this
    STAMINA_MAX: 100,
    STAMINA_DRAIN: 28,      // per sec sprinting
    STAMINA_REGEN: 18,      // per sec
    ENEMY_RADIUS: 13,
    BULLET_RADIUS: 3,
    SEARCH_TIME: 1.6,       // base seconds to search a container
    HEAL_MOVE_MULT: 0.55,   // movement speed multiplier while healing (no sprint)
    HELP_TIME: 9,           // seconds the in-raid controls overlay stays up (fades over last 2s)
    LOOT_PICK_RADIUS: 26,
    RAID_TIME: 360,         // seconds per raid
    EXTRACT_TIME: 6,        // seconds standing in zone
    VISION_RANGE: 430,      // enemy sight distance
    VISION_FOV: 1.15,       // half-angle radians (~66deg each side)
    HEAR_RANGE: 360,        // gunshot hearing radius
    BACKPACK_SLOTS: 24,
    STASH_SLOTS: 60,
    SCAV_LOOT_KEEP: 0.5,    // fraction of valuables kept when extracting on a free scav run

    SAVE_KEY: 'searchstrike_save_v1',
  };
  G.Config = Config;

  /* ------------------------- Item database ------------------------------ */
  // type: weapon | ammo | armor | med | valuable | key
  // rarity: common | uncommon | rare | epic  (affects color/glow)
  // value: base sell price
  const ITEMS = {};
  function def(o) { ITEMS[o.id] = o; return o; }

  // -- Ammo --
  def({ id: 'ammo_9', name: '9mm', type: 'ammo', ammoType: '9mm', value: 3, stack: 120, rarity: 'common', color: '#caa15a', dmgMod: 1 });
  def({ id: 'ammo_45', name: '.45 ACP', type: 'ammo', ammoType: '45', value: 4, stack: 90, rarity: 'common', color: '#b8893f', dmgMod: 1 });
  def({ id: 'ammo_545', name: '5.45x39', type: 'ammo', ammoType: '545', value: 5, stack: 90, rarity: 'uncommon', color: '#c0b46a', dmgMod: 1 });
  def({ id: 'ammo_762', name: '7.62x39', type: 'ammo', ammoType: '762', value: 6, stack: 90, rarity: 'uncommon', color: '#d0a050', dmgMod: 1 });
  def({ id: 'ammo_12g', name: '12 Gauge', type: 'ammo', ammoType: '12g', value: 6, stack: 40, rarity: 'common', color: '#c23b3b', dmgMod: 1 });

  // -- Weapons -- (instance carries ammoInMag)
  def({
    id: 'w_pistol', name: 'PM Pistol', type: 'weapon', cls: 'pistol', ammoType: '9mm',
    damage: 17, fireRate: 230, mag: 8, spread: 0.06, bulletSpeed: 720, range: 460,
    reloadTime: 1.3, auto: false, recoil: 0.05, value: 90, rarity: 'common', color: '#8a8f99',
  });
  def({
    id: 'w_tt', name: 'TT-33', type: 'weapon', cls: 'pistol', ammoType: '9mm',
    damage: 22, fireRate: 200, mag: 8, spread: 0.05, bulletSpeed: 800, range: 500,
    reloadTime: 1.4, auto: false, recoil: 0.06, value: 160, rarity: 'uncommon', color: '#9b8f7a',
  });
  def({
    id: 'w_smg', name: 'MP5 SMG', type: 'weapon', cls: 'smg', ammoType: '9mm',
    damage: 16, fireRate: 90, mag: 30, spread: 0.075, bulletSpeed: 760, range: 520,
    reloadTime: 1.9, auto: true, recoil: 0.04, value: 420, rarity: 'uncommon', color: '#5f6470',
  });
  def({
    id: 'w_vector', name: 'Vector .45', type: 'weapon', cls: 'smg', ammoType: '45',
    damage: 21, fireRate: 65, mag: 25, spread: 0.08, bulletSpeed: 720, range: 500,
    reloadTime: 2.0, auto: true, recoil: 0.045, value: 760, rarity: 'rare', color: '#4a4f59',
  });
  def({
    id: 'w_ak', name: 'AK-74', type: 'weapon', cls: 'rifle', ammoType: '545',
    damage: 33, fireRate: 110, mag: 30, spread: 0.06, bulletSpeed: 1000, range: 720,
    reloadTime: 2.3, auto: true, recoil: 0.07, value: 900, rarity: 'rare', color: '#7a5c33',
  });
  def({
    id: 'w_akm', name: 'AKM', type: 'weapon', cls: 'rifle', ammoType: '762',
    damage: 42, fireRate: 120, mag: 30, spread: 0.07, bulletSpeed: 980, range: 740,
    reloadTime: 2.4, auto: true, recoil: 0.085, value: 1250, rarity: 'epic', color: '#6b4a28',
  });
  def({
    id: 'w_m4', name: 'M4A1', type: 'weapon', cls: 'rifle', ammoType: '545',
    damage: 31, fireRate: 85, mag: 30, spread: 0.045, bulletSpeed: 1050, range: 780,
    reloadTime: 2.1, auto: true, recoil: 0.05, value: 1600, rarity: 'epic', color: '#3f4651',
  });
  def({
    id: 'w_shotgun', name: 'Pump Shotgun', type: 'weapon', cls: 'shotgun', ammoType: '12g',
    damage: 13, fireRate: 850, mag: 6, spread: 0.16, bulletSpeed: 640, range: 360,
    reloadTime: 2.6, auto: false, recoil: 0.18, value: 540, rarity: 'uncommon', color: '#5a4632', pellets: 7,
  });

  // -- Armor -- (instance carries durability)
  def({ id: 'a_vest1', name: 'PACA Vest', type: 'armor', armorClass: 2, defPct: 0.30, durability: 40, value: 220, rarity: 'common', color: '#5b6b4a' });
  def({ id: 'a_vest2', name: '6B23 Armor', type: 'armor', armorClass: 4, defPct: 0.48, durability: 60, value: 620, rarity: 'rare', color: '#46563a' });
  def({ id: 'a_vest3', name: 'Slick Plate', type: 'armor', armorClass: 5, defPct: 0.55, durability: 80, value: 1400, rarity: 'epic', color: '#2f3a2a' });

  // -- Meds --
  def({ id: 'm_bandage', name: 'Bandage', type: 'med', heal: 35, useTime: 1.8, value: 30, rarity: 'common', color: '#e0e0e0', stack: 8 });
  def({ id: 'm_medkit', name: 'Medkit', type: 'med', heal: 75, useTime: 3.2, value: 110, rarity: 'uncommon', color: '#d63b3b', stack: 4 });
  def({ id: 'm_surgical', name: 'Surgical Kit', type: 'med', heal: 100, useTime: 4.5, value: 300, rarity: 'rare', color: '#e85555', stack: 3 });

  // -- Valuables (loot to sell) --
  def({ id: 'v_watch', name: 'Gold Watch', type: 'valuable', value: 240, rarity: 'rare', color: '#f0c44a', stack: 5 });
  def({ id: 'v_chain', name: 'Gold Chain', type: 'valuable', value: 180, rarity: 'uncommon', color: '#e8c24a', stack: 5 });
  def({ id: 'v_gpu', name: 'Graphics Card', type: 'valuable', value: 520, rarity: 'epic', color: '#3fd07a', stack: 3 });
  def({ id: 'v_cash', name: 'Cash Stack', type: 'valuable', value: 150, rarity: 'uncommon', color: '#6fbf6f', stack: 20 });
  def({ id: 'v_phone', name: 'Smartphone', type: 'valuable', value: 95, rarity: 'common', color: '#3a8fd0', stack: 10 });
  def({ id: 'v_meds', name: 'Drug Vials', type: 'valuable', value: 130, rarity: 'uncommon', color: '#c060d0', stack: 10 });
  def({ id: 'v_tools', name: 'Tool Set', type: 'valuable', value: 75, rarity: 'common', color: '#c08040', stack: 8 });
  def({ id: 'v_doc', name: 'Secure Docs', type: 'valuable', value: 320, rarity: 'rare', color: '#d0d040', stack: 6 });
  def({ id: 'v_bitcoin', name: 'Physical Bitcoin', type: 'valuable', value: 900, rarity: 'epic', color: '#f7931a', stack: 2 });
  def({ id: 'v_canned', name: 'Canned Food', type: 'valuable', value: 35, rarity: 'common', color: '#9aa055', stack: 12 });
  def({ id: 'v_water', name: 'Water Bottle', type: 'valuable', value: 28, rarity: 'common', color: '#5ab0d0', stack: 12 });

  G.Items = ITEMS;
  G.getItem = (id) => ITEMS[id];

  G.RARITY_COLOR = {
    common: '#9aa3ad', uncommon: '#4fb04f', rare: '#3d7fd0', epic: '#b056d0',
  };

  /* --------------------------- Loot tables ------------------------------ */
  // Each container type has a table of {id, w, qty:[min,max]} entries and a roll count.
  const LootTables = {
    crate: {
      rolls: [1, 2],
      table: [
        { id: 'v_canned', w: 10, qty: [1, 3] },
        { id: 'v_water', w: 10, qty: [1, 2] },
        { id: 'v_tools', w: 6, qty: [1, 2] },
        { id: 'ammo_9', w: 8, qty: [10, 30] },
        { id: 'ammo_12g', w: 4, qty: [4, 12] },
        { id: 'm_bandage', w: 6, qty: [1, 2] },
        { id: 'v_phone', w: 4, qty: [1, 1] },
        { id: 'w_pistol', w: 2, qty: [1, 1] },
      ],
    },
    locker: {
      rolls: [1, 2],
      table: [
        { id: 'v_phone', w: 8, qty: [1, 2] },
        { id: 'v_chain', w: 5, qty: [1, 1] },
        { id: 'v_cash', w: 7, qty: [1, 3] },
        { id: 'ammo_545', w: 5, qty: [10, 30] },
        { id: 'ammo_762', w: 4, qty: [10, 30] },
        { id: 'm_bandage', w: 6, qty: [1, 3] },
        { id: 'a_vest1', w: 3, qty: [1, 1] },
        { id: 'w_smg', w: 2, qty: [1, 1] },
        { id: 'v_doc', w: 2, qty: [1, 1] },
      ],
    },
    medbox: {
      rolls: [1, 3],
      table: [
        { id: 'm_bandage', w: 10, qty: [1, 3] },
        { id: 'm_medkit', w: 6, qty: [1, 2] },
        { id: 'm_surgical', w: 2, qty: [1, 1] },
        { id: 'v_meds', w: 6, qty: [1, 3] },
      ],
    },
    weaponrack: {
      rolls: [1, 2],
      table: [
        { id: 'w_pistol', w: 5, qty: [1, 1] },
        { id: 'w_tt', w: 4, qty: [1, 1] },
        { id: 'w_smg', w: 4, qty: [1, 1] },
        { id: 'w_shotgun', w: 3, qty: [1, 1] },
        { id: 'w_ak', w: 2, qty: [1, 1] },
        { id: 'w_m4', w: 1, qty: [1, 1] },
        { id: 'a_vest2', w: 2, qty: [1, 1] },
        { id: 'ammo_545', w: 6, qty: [20, 40] },
        { id: 'ammo_762', w: 5, qty: [20, 40] },
      ],
    },
    safe: {
      rolls: [2, 3],
      table: [
        { id: 'v_watch', w: 6, qty: [1, 1] },
        { id: 'v_gpu', w: 4, qty: [1, 1] },
        { id: 'v_cash', w: 8, qty: [2, 5] },
        { id: 'v_doc', w: 5, qty: [1, 2] },
        { id: 'v_bitcoin', w: 1, qty: [1, 1] },
        { id: 'a_vest3', w: 1, qty: [1, 1] },
        { id: 'w_akm', w: 2, qty: [1, 1] },
        { id: 'w_m4', w: 1, qty: [1, 1] },
      ],
    },
  };
  G.LootTables = LootTables;

  // container visual/labels
  G.ContainerInfo = {
    crate: { label: 'Wooden Crate', color: '#7a5a32', icon: '#9a7142' },
    locker: { label: 'Locker', color: '#566273', icon: '#6d7c90' },
    medbox: { label: 'Medical Box', color: '#b03b3b', icon: '#d65555' },
    weaponrack: { label: 'Weapon Rack', color: '#4a4030', icon: '#6a5a40' },
    safe: { label: 'Safe', color: '#3a3f47', icon: '#586070' },
  };

  /* ------------------------- Enemy loadouts ----------------------------- */
  // tier scales with difficulty; drop = chance-weighted extra loot on death.
  G.EnemyTiers = {
    scav: {
      label: 'Scav', hp: 65, weapons: ['w_pistol', 'w_pistol', 'w_smg', 'w_shotgun'],
      armorChance: 0.18, armor: ['a_vest1'], accuracy: 0.55, color: '#6b6256',
      reactTime: 0.55, drops: [
        { id: 'v_phone', w: 5, qty: [1, 1] }, { id: 'v_cash', w: 4, qty: [1, 2] },
        { id: 'm_bandage', w: 4, qty: [1, 1] }, { id: 'v_canned', w: 5, qty: [1, 2] },
        { id: 'v_chain', w: 2, qty: [1, 1] },
      ], dropRolls: [0, 2],
    },
    raider: {
      label: 'Raider', hp: 95, weapons: ['w_smg', 'w_ak', 'w_shotgun'],
      armorChance: 0.6, armor: ['a_vest1', 'a_vest2'], accuracy: 0.62, color: '#55503f',
      reactTime: 0.45, drops: [
        { id: 'v_cash', w: 5, qty: [2, 4] }, { id: 'v_watch', w: 2, qty: [1, 1] },
        { id: 'm_medkit', w: 3, qty: [1, 1] }, { id: 'ammo_545', w: 4, qty: [15, 30] },
        { id: 'v_doc', w: 2, qty: [1, 1] },
      ], dropRolls: [1, 2],
    },
    boss: {
      label: 'Warlord', hp: 200, weapons: ['w_akm', 'w_m4'],
      armorChance: 1, armor: ['a_vest3'], accuracy: 0.74, color: '#7a2f2f',
      reactTime: 0.4, drops: [
        { id: 'v_bitcoin', w: 3, qty: [1, 1] }, { id: 'v_gpu', w: 4, qty: [1, 1] },
        { id: 'v_watch', w: 5, qty: [1, 2] }, { id: 'm_surgical', w: 3, qty: [1, 1] },
        { id: 'v_doc', w: 4, qty: [2, 3] },
      ], dropRolls: [3, 4],
    },
  };

  /* ------------------------- Map / difficulty --------------------------- */
  // Each location = a raid map preset.
  G.Locations = [
    {
      id: 'depot', name: 'Storage Depot', desc: 'Abandoned warehouses. Low risk, modest loot. Good for new operators.',
      gridW: 46, gridH: 46, rooms: [14, 18], enemies: { scav: [4, 6], raider: [0, 1], boss: 0 },
      lootMul: 1, color: '#3a4a3a', difficulty: 1,
    },
    {
      id: 'factory', name: 'Old Factory', desc: 'Industrial maze. Moderate danger, solid returns and weapons.',
      gridW: 56, gridH: 56, rooms: [20, 26], enemies: { scav: [6, 9], raider: [2, 3], boss: 0 },
      lootMul: 1.35, color: '#4a4030', difficulty: 2,
    },
    {
      id: 'labs', name: 'Underground Labs', desc: 'High-value research site. Heavily guarded — a Warlord roams here.',
      gridW: 64, gridH: 64, rooms: [26, 34], enemies: { scav: [7, 10], raider: [3, 5], boss: 1 },
      lootMul: 1.9, color: '#2f3640', difficulty: 3,
    },
  ];

  /* ---------------------------- Shop stock ------------------------------ */
  // Buy prices = value * markup. Sell = value * sellRate (in profile).
  G.SHOP_MARKUP = 1.6;
  G.SELL_RATE = 0.55;
  G.ShopStock = [
    'w_pistol', 'w_tt', 'w_smg', 'w_shotgun', 'w_vector', 'w_ak', 'w_akm', 'w_m4',
    'a_vest1', 'a_vest2', 'a_vest3',
    'm_bandage', 'm_medkit', 'm_surgical',
    'ammo_9', 'ammo_45', 'ammo_545', 'ammo_762', 'ammo_12g',
  ];

  // Starting profile (new player)
  G.STARTING = {
    money: 1200,
    stash: [
      { id: 'w_pistol', n: 1 },
      { id: 'ammo_9', n: 64 },
      { id: 'm_bandage', n: 3 },
    ],
  };

  /* ----------------------------- Contracts ------------------------------ */
  // The Conch's questline — a linear arc that teaches the loop, pushes the
  // player through all three dive sites, and ends on the boss. One contract is
  // active at a time (Profile.data.contracts.stage). Goal kinds, all checked by
  // meta.js against lifetime counters baselined at the moment a contract opens:
  //   surface {n}          — surface (extract) n times since taking the contract
  //   loc {loc, n}         — surface from a specific dive site n times
  //   kill {tier, n}       — kill n enemies of a tier (only counts on a surface)
  //   deliver {item, n}    — hand the Conch n of an item (consumed on claim)
  // reward: { money, items?: [{id, n}] } — paid out on claim.
  G.Contracts = [
    { id: 'c1_first_ebb', goal: { kind: 'surface', n: 1 }, reward: { money: 300, items: [{ id: 'm_bandage', n: 2 }] } },
    { id: 'c2_salvage', goal: { kind: 'deliver', item: 'v_tools', n: 2 }, reward: { money: 350 } },
    { id: 'c3_dressing', goal: { kind: 'deliver', item: 'v_meds', n: 3 }, reward: { money: 400, items: [{ id: 'm_medkit', n: 1 }] } },
    { id: 'c4_works', goal: { kind: 'loc', loc: 'factory', n: 1 }, reward: { money: 550 } },
    { id: 'c5_docs', goal: { kind: 'deliver', item: 'v_doc', n: 1 }, reward: { money: 750 } },
    { id: 'c6_reavers', goal: { kind: 'kill', tier: 'raider', n: 8 }, reward: { money: 850, items: [{ id: 'a_vest2', n: 1 }] } },
    { id: 'c7_crown', goal: { kind: 'kill', tier: 'boss', n: 1 }, reward: { money: 2000, items: [{ id: 'a_vest3', n: 1 }] } },
  ];

})();
