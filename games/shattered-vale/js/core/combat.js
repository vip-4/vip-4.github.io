// core/combat.js — everything that happens as a *result* of player action:
// talking to an NPC, landing a hit, picking up a dropped item, or clicking
// something in the inventory panel. Reads its data from config/balance.js
// (numbers) and config/item-effects.js (what-happens-when tables) rather
// than hardcoding any of it here.
//
// Every function takes the shared game `state` object (see core/game.js)
// so this file never needs to close over game.js's internals.

const Combat = {
  toast(state, msg) {
    state.toastMsg = msg;
    state.toastTimer = 150;
  },

  // Talk to whichever NPC is within reach, if any.
  checkInteract(state) {
    const { player, npcs, dialogue } = state;
    const reach = { x: player.x - 10, y: player.y - 10, w: player.w + 20, h: player.h + 20 };

    for (const npc of npcs) {
      if (!rectsOverlap(reach, npc)) continue;

      dialogue.open(npc, () => {
        npc.talked = true; // hide the "Talk with me" bubble after first completed talk

        if (npc === state.elder && state.questStage === 0) {
          state.questStage = 1;
          state.elder.hasQuest = false;
        }
        if (npc === state.merchant && !state.merchantGaveGift) {
          state.merchantGaveGift = true;
          state.inventory.add('potionRed', 1);
          this.toast(state, 'Received: Health Potion');
        }
      });
      return;
    }
  },

  // Player's melee swing: damages every living enemy caught in the attack
  // hitbox, then resolves rewards/drops for any that died from it. Every
  // KNOCKBACK_EVERY_NTH_ATTACK-th swing also knocks back anything it hits
  // and doesn't kill.
  handleAttack(state) {
    const { player, enemies, particles, camera } = state;
    if (!player.startAttack()) return;

    const isKnockbackSwing = player.attackCount % KNOCKBACK_EVERY_NTH_ATTACK === 0;
    const hb = player.attackHitbox();
    enemies.forEach((en) => {
      if (!en.alive || !rectsOverlap(hb, en)) return;
      en.takeDamage(player.attackDamage, particles);
      camera.shake(isKnockbackSwing ? 4 : 2, isKnockbackSwing ? 6 : 4);
      if (!en.alive) {
        this._onEnemyDefeated(state, en);
        return;
      }
      if (isKnockbackSwing) en.applyKnockback(player.centerX, player.centerY);
    });
  },

  _onEnemyDefeated(state, en) {
    const { player, particles } = state;
    const reward = getCombatReward(en.type);
    player.gold += reward.gold;

    const leveled = player.gainXP(reward.xp, particles);
    if (leveled) {
      this.toast(state, 'Level up! Now level ' + player.lvl);
      state.screenFlash = { color: '255,255,255', alpha: 0.3 };
    }

    const bossEvent = BOSS_DEFEAT_EVENTS[en.type];
    if (bossEvent) bossEvent(this._bossEventCtx(state, en));
  },

  // Small facade passed into config/item-effects.js's BOSS_DEFEAT_EVENTS
  // callbacks so they can drop loot, flash the screen, advance the quest,
  // open a gate, or queue a "System" cutscene without touching game.js state
  // directly.
  _bossEventCtx(state, en) {
    return {
      map: state.map,
      dropItem: (dx, dy, kind) => state.worldItems.push(new WorldItem(en.x + dx, en.y + dy, kind)),
      advanceQuestTo: (stage) => { state.questStage = Math.max(state.questStage, stage); },
      toast: (msg) => this.toast(state, msg),
      setScreenFlash: (flash) => { state.screenFlash = flash; },
      setVictory: () => { state.gameState = 'victory'; },
      openSystemDialogue: (lines) => {
        const systemNPC = new NPC(state.player.x, state.player.y, 'System', null, lines);
        state.dialogue.open(systemNPC, () => {});
      },
    };
  },

  // Gates that open once their guardian enemies are all dead (checked every
  // frame — see GATE_UNLOCK_CONDITIONS in config/item-effects.js).
  checkGateConditions(state) {
    const { enemies, map } = state;
    GATE_UNLOCK_CONDITIONS.forEach((gate) => {
      if (map[gate.isOpenFlag] || gate.stillGuarded(enemies)) return;
      gate.open(map);
      this.toast(state, gate.toast);
      state.screenFlash = gate.flash;
    });
  },

  // Standing on lava (Molten Depths) burns the player unless Fireproof
  // Boots are equipped. Reuses player.invuln as the damage cooldown — the
  // same brief flicker of immunity a melee hit grants — so this is one
  // tick roughly every 45 frames, not every single frame.
  checkHazards(state) {
    const { player, map, particles } = state;
    if (player.fireproof) return;
    const tileX = Math.floor(player.centerX / TILE);
    const tileY = Math.floor(player.centerY / TILE);
    if (map.get(tileX, tileY) === TileType.LAVA) {
      player.takeDamage(LAVA_DAMAGE_PER_TICK, particles);
    }
  },

  // Walking over an un-taken world item picks it up.
  processWorldItemPickups(state) {
    const { player, worldItems, inventory, particles } = state;
    worldItems.forEach((item) => {
      item.update();
      if (item.taken || !rectsOverlap(player, item)) return;
      item.taken = true;

      const effect = ITEM_PICKUP_EFFECTS[item.kind] || DEFAULT_PICKUP_EFFECT;
      effect.apply({
        player,
        inventory,
        particles,
        item,
        advanceQuestTo: (stage) => { state.questStage = Math.max(state.questStage, stage); },
      });
      if (effect.toast) this.toast(state, effect.toast);
      if (effect.flash) state.screenFlash = effect.flash;
    });
  },

  // A click inside the open inventory panel: using a potion, equipping a
  // backpack item, or unequipping whatever's worn in a gear slot.
  // `hit` is whatever Inventory.clickAt(...) returned.
  handleInventoryClick(state, hit) {
    const { player, inventory, particles } = state;

    if (hit.region === 'backpack') {
      const potion = USABLE_POTIONS[hit.kind];
      if (potion) {
        const used = potion.use({ inventory, player });
        if (used) potion.onUsed({ player, particles, toast: (msg) => this.toast(state, msg) });
        return;
      }
      const effect = ITEM_EQUIP_EFFECTS[hit.kind];
      if (effect) {
        effect.apply({ inventory, player });
        if (effect.toast) this.toast(state, effect.toast);
        this.recomputeDefense(state);
      }
    } else if (hit.region === 'equip') {
      const unequip = ITEM_UNEQUIP_EFFECTS[hit.slotId];
      if (unequip) {
        unequip({ inventory, player });
        this.recomputeDefense(state);
      }
    }
  },

  // Sums the defense value (see ARMOR_DEFENSE in config/item-stats.js) of
  // everything currently in inventory.equipped and stores the total on
  // player.defense. Recomputed from scratch rather than incrementally
  // adjusted, so slot-swaps (equipping over an already-occupied slot) can
  // never drift out of sync with what's actually worn.
  recomputeDefense(state) {
    const { player, inventory } = state;
    let total = 0;
    for (const slotId in inventory.equipped) {
      const kind = inventory.equipped[slotId];
      const stats = kind && ITEM_STATS[kind];
      if (stats && stats.def) total += stats.def;
    }
    player.defense = total;
  },
};
