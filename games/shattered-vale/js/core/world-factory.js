// core/world-factory.js — builds the live NPC/WorldItem/Enemy instances from
// the plain data in config/level-layout.js. Called once at boot; enemies are
// rebuilt the same way on restart (see WorldFactory.createEnemies), which is
// what used to require a second, hand-duplicated 86-entry list in game.js.

const WorldFactory = {
  // Returns { npcs, elder, merchant }. `elder`/`merchant` are convenience
  // references into the same `npcs` array (matched by id), since
  // core/combat.js needs to single them out for their one-time quest/gift
  // dialogue callbacks.
  createNpcs() {
    const npcs = NPC_DEFS.map((def) => {
      const npc = new NPC(def.x, def.y, def.name, Sprites[def.spriteKey], def.dialogue, def.opts);
      npc.id = def.id;
      npc.talked = false;
      return npc;
    });
    const byId = (id) => npcs.find((n) => n.id === id);
    return { npcs, elder: byId('elder'), merchant: byId('merchant') };
  },

  createWorldItems() {
    return WORLD_ITEM_PLACEMENTS.map((d) => new WorldItem(d.x, d.y, d.kind, d.opts || {}));
  },

  createEnemies() {
    return ENEMY_PLACEMENTS.map((d) => new Enemy(d.x, d.y, d.type, d.opts || {}));
  },

  // Restart puts existing NPCs/items back to their initial state rather than
  // recreating them (so e.g. `elder`/`merchant` references held elsewhere
  // stay valid) — only the enemy roster is rebuilt from scratch, matching
  // the original game's restart behavior.
  resetNpcsAndItems(npcs, worldItems) {
    npcs.forEach((n) => { n.talked = false; });
    worldItems.forEach((item) => { item.taken = false; });
  },
};
