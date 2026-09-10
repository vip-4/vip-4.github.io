// systems/inventory.js — item pickups in the world + toggleable inventory panel

class WorldItem {
  constructor(x, y, kind, opts = {}) {
    this.x = x; this.y = y;
    this.w = 20; this.h = 20;
    this.kind = kind; // 'sword' | 'potionRed' | 'coin' | 'key' | 'shield' | 'armor'
    this.taken = false;
    this.bobT = Math.random() * 10;
    this.value = opts.value || 1;
    this.pickupText = opts.pickupText || null;
  }
  update() { this.bobT += 0.06; }
  draw(ctx, camX, camY) {
    if (this.taken) return;
    const icon = Sprites.icons[this.kind];
    const bob = Math.sin(this.bobT) * 3;
    const px = this.x - camX, py = this.y - camY + bob;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#e8c93c';
    ctx.beginPath();
    ctx.ellipse(px + this.w/2, py + this.h/2, 12, 12, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'rgba(232,201,60,0.6)';
    ctx.shadowBlur = 8;
    ctx.drawImage(icon, px - 2, py - 2, this.w + 4, this.h + 4);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// Equipment slot definitions: slotId -> { label, accepts(kind) }
// accepts() decides which backpack item kinds are droppable into that slot.
const EQUIP_SLOTS = [
  { id: 'helmet', label: 'Helmet', accepts: k => k === 'helmet' || k === 'crownSkeleton' },
  { id: 'weapon', label: 'Weapon', accepts: k => k === 'sword' || k === 'weapon' || k === 'swordLegendary' || k === 'swordMolten' },
  { id: 'armor',  label: 'Armor',  accepts: k => k === 'armor' || k === 'armorJungle' || k === 'armorObsidian' },
  { id: 'shield', label: 'Shield', accepts: k => k === 'shield' || k === 'shieldBone' },
  { id: 'boots',  label: 'Boots',  accepts: k => k === 'boots' || k === 'bootsFireproof' },
];

class Inventory {
  constructor() {
    this.equipped = {}; // slotId -> kind | null
    this.reset();
  }

  // Back to a fresh, empty inventory — used at construction and on restart.
  reset() {
    this.items = {}; // kind -> count (backpack, non-equipped items)
    EQUIP_SLOTS.forEach(s => { this.equipped[s.id] = null; });
    this.open = false;
    this.hoveredKind = null;   // backpack kind currently hovered
    this.hoveredSlot = null;   // equip slotId currently hovered
  }

  add(kind, count = 1) {
    this.items[kind] = (this.items[kind] || 0) + count;
  }
  toggle() { this.open = !this.open; }

  // Equip one unit of `kind` from the backpack into the first accepting empty
  // slot (or the matching occupied slot, swapping the old item back to the
  // backpack). Returns true if equip happened.
  equip(kind) {
    if (!this.items[kind] || this.items[kind] <= 0) return false;
    const slot = EQUIP_SLOTS.find(s => s.accepts(kind));
    if (!slot) return false;

    const prev = this.equipped[slot.id];
    this.equipped[slot.id] = kind;
    this.items[kind] -= 1;
    if (this.items[kind] <= 0) delete this.items[kind];
    if (prev) this.add(prev, 1);
    return true;
  }

  // Move whatever is in a slot back into the backpack.
  unequip(slotId) {
    const kind = this.equipped[slotId];
    if (!kind) return false;
    this.equipped[slotId] = null;
    this.add(kind, 1);
    return true;
  }

  // Attempt to use/drink a red potion. Returns true if one was consumed.
  usePotionRed(player) {
    if (!this.items.potionRed || this.items.potionRed <= 0) return false;
    this.items.potionRed -= 1;
    if (this.items.potionRed <= 0) delete this.items.potionRed;
    if (player) player.hp = player.maxHp;
    return true;
  }

  // Attempt to use/drink a blue potion. Returns true if one was consumed.
  usePotionBlue(player) {
    if (!this.items.potionBlue || this.items.potionBlue <= 0) return false;
    this.items.potionBlue -= 1;
    if (this.items.potionBlue <= 0) delete this.items.potionBlue;
    if (player) player.mana = player.maxMana;
    return true;
  }

  // Call from mousemove with canvas-space coordinates to drive the hover effect.
  updateHover(mx, my, canvasW, canvasH) {
    this.hoveredKind = null;
    this.hoveredSlot = null;
    if (!this.open) return;
    const layout = this._layout(canvasW, canvasH);

    for (const slot of layout.equipSlots) {
      if (mx >= slot.ix && mx <= slot.ix + 44 && my >= slot.iy && my <= slot.iy + 44) {
        this.hoveredSlot = slot.id;
        return;
      }
    }
    for (const item of layout.backpackItems) {
      if (mx >= item.ix && mx <= item.ix + 44 && my >= item.iy && my <= item.iy + 44) {
        this.hoveredKind = item.kind;
        return;
      }
    }
  }

  // Attempt to click at canvas-space coordinates.
  // Returns { region: 'equip', slotId } or { region: 'backpack', kind }, or null.
  clickAt(mx, my, canvasW, canvasH) {
    if (!this.open) return null;
    const layout = this._layout(canvasW, canvasH);

    for (const slot of layout.equipSlots) {
      if (mx >= slot.ix && mx <= slot.ix + 44 && my >= slot.iy && my <= slot.iy + 44) {
        return { region: 'equip', slotId: slot.id };
      }
    }
    for (const item of layout.backpackItems) {
      if (mx >= item.ix && mx <= item.ix + 44 && my >= item.iy && my <= item.iy + 44) {
        if (!item.kind) return null; // Ignore clicks on empty base slots
        return { region: 'backpack', kind: item.kind };
      }
    }
    return null;
  }

  // Shared geometry for the panel: equip-slot column on the left (character
  // gear), backpack grid in the middle (found items), character/item stats
  // column on the right. Computed once per call so hit-testing and drawing
  // can never drift apart.
  _layout(canvasW, canvasH) {
    const w = 800, h = 280;
    const x = (canvasW - w) / 2, y = (canvasH - h) / 2;

    const equipX = x + 18, equipY = y + 74; 
    const CELL = 56;
    const slotGridPos = {
      helmet: { col: 1, row: 0 },
      weapon: { col: 0, row: 1 },
      armor:  { col: 1, row: 1 },
      shield: { col: 2, row: 1 },
      boots:  { col: 1, row: 2 },
    };
    const equipSlots = EQUIP_SLOTS.map(s => {
      const pos = slotGridPos[s.id];
      return {
        id: s.id,
        label: s.label,
        ix: equipX + pos.col * CELL,
        iy: equipY + pos.row * CELL,
      };
    });

    const bpX = x + 18 + 3 * CELL + 24, bpY = y + 74;
    const kinds = Object.keys(this.items);
    
    // Generate a structural layout for a fixed 18-slot inventory display (6x3 grid)
    const MAX_BACKPACK_SLOTS = 18;
    const backpackItems = [];
    for (let i = 0; i < MAX_BACKPACK_SLOTS; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      backpackItems.push({
        kind: kinds[i] || null, // Contains item kind identifier or null if empty layout slot
        ix: bpX + col * 56,
        iy: bpY + row * 56
      });
    }

    const statsX = bpX + 6 * CELL + 24, statsY = y + 74;

    return { w, h, x, y, equipX, equipY, bpX, bpY, statsX, statsY, equipSlots, backpackItems };
  }

  // Resolves whatever's currently hovered (a backpack item or an equip
  // slot) down to a single item kind, for the tooltip in the stats column.
  // Returns null if nothing's hovered, or an equip slot is hovered but empty.
  _hoveredItemKind() {
    if (this.hoveredKind) return this.hoveredKind;
    if (this.hoveredSlot) return this.equipped[this.hoveredSlot] || null;
    return null;
  }

  draw(ctx, canvasW, canvasH, player) {
    if (!this.open) return;
    const { w, h, x, y, equipX, equipY, bpX, bpY, statsX, statsY, equipSlots, backpackItems } =
      this._layout(canvasW, canvasH);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.fillStyle = 'rgba(20,22,16,0.95)';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,228,216,0.3)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();

    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Inventory', x + 18, y + 28);
    ctx.strokeStyle = 'rgba(232,228,216,0.2)';
    ctx.beginPath(); ctx.moveTo(x + 18, y + 38); ctx.lineTo(x + w - 18, y + 38); ctx.stroke();

    // --- Left column: equipped gear (character slots) ---
    ctx.fillStyle = 'rgba(232,228,216,0.6)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('EQUIPPED', equipX, equipY - 16);

    equipSlots.forEach(slot => {
      const kind = this.equipped[slot.id];
      const isHovered = this.hoveredSlot === slot.id;

      ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, slot.ix, slot.iy, 44, 44, 6);
      ctx.fill();

      ctx.strokeStyle = isHovered ? 'rgba(232,201,60,0.85)' : 'rgba(232,228,216,0.18)';
      ctx.lineWidth = isHovered ? 2 : 1;
      roundRect(ctx, slot.ix, slot.iy, 44, 44, 6);
      ctx.stroke();

      if (kind) {
        const icon = Sprites.icons[kind];
        if (icon) ctx.drawImage(icon, slot.ix + 10, slot.iy + 10, 24, 24);
      } else {
        ctx.fillStyle = 'rgba(232,228,216,0.28)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slot.label, slot.ix + 22, slot.iy + 25);
        ctx.textAlign = 'left';
      }
    });

    // --- Middle: backpack grid (found items) ---
    ctx.fillStyle = 'rgba(232,228,216,0.6)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('BACKPACK', bpX, bpY - 16);

    backpackItems.forEach(item => {
      const isHovered = item.kind && this.hoveredKind === item.kind;

      // Every slot renders a light grey transparent square background box
      ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, item.ix, item.iy, 44, 44, 6);
      ctx.fill();

      // Handle custom structural border stylings
      if (isHovered) {
        ctx.strokeStyle = 'rgba(232,201,60,0.85)';
        ctx.lineWidth = 2;
        roundRect(ctx, item.ix, item.iy, 44, 44, 6);
        ctx.stroke();
      } else if (item.kind) {
        // Light borders applied dynamically to slots holding active items
        ctx.strokeStyle = 'rgba(232,228,216,0.20)';
        ctx.lineWidth = 1;
        roundRect(ctx, item.ix, item.iy, 44, 44, 6);
        ctx.stroke();
      }

      // Render assets and text details for items present in a box sequence
      if (item.kind) {
        const icon = Sprites.icons[item.kind];
        if (icon) ctx.drawImage(icon, item.ix + 10, item.iy + 10, 24, 24);
        ctx.fillStyle = '#e8e4d8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('x' + this.items[item.kind], item.ix + 40, item.iy + 40);
        ctx.textAlign = 'left';
      }
    });

    // --- Right column: character sheet + hovered-item tooltip ---
    if (player) this._drawStatsColumn(ctx, statsX, statsY, player);

    // Divider between equip column and backpack.
    ctx.strokeStyle = 'rgba(232,228,216,0.15)';
    ctx.beginPath();
    ctx.moveTo(bpX - 16, y + 46);
    ctx.lineTo(bpX - 16, y + h - 36);
    ctx.stroke();

    // Divider between backpack and the stats column.
    ctx.beginPath();
    ctx.moveTo(statsX - 16, y + 46);
    ctx.lineTo(statsX - 16, y + h - 36);
    ctx.stroke();

    ctx.fillStyle = 'rgba(232,228,216,0.4)';
    ctx.font = '11px sans-serif';
    ctx.fillText('[Esc to close] · click a backpack item to use/equip it', x + 18, y + h - 14);
    ctx.restore();
  }

  // Character stats (top) + whichever item is currently hovered, if any
  // (bottom). Shown together so the player can see both their current
  // totals and exactly what a candidate item would add before equipping it.
  _drawStatsColumn(ctx, sx, sy, player) {
    ctx.fillStyle = 'rgba(232,228,216,0.6)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('CHARACTER', sx, sy - 16);

    const rowH = 20;
    let ry = sy + 4;
    const statRow = (label, value, color) => {
      ctx.fillStyle = 'rgba(232,228,216,0.55)';
      ctx.font = '11px sans-serif';
      ctx.fillText(label, sx, ry);
      ctx.fillStyle = color || '#e8e4d8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value, sx + 168, ry);
      ctx.textAlign = 'left';
      ry += rowH;
    };

    statRow('HP', `${player.hp}/${player.maxHp}`, '#e88a8a');
    const weaponKind = this.equipped.weapon;
    const weaponStats = weaponKind && getItemStats(weaponKind);
    statRow('ATK', String(player.attackDamage), '#e8c93c');
    statRow('DEF', String(player.defense), '#85b7eb');
    statRow('SPD', player.speed.toFixed(1), '#78e0a8');
    statRow('MANA', `${Math.floor(player.mana)}/${player.maxMana}`, '#a878e0');

    // --- Hovered item tooltip ---
    const ty = sy + rowH * 5 + 20;
    ctx.strokeStyle = 'rgba(232,228,216,0.15)';
    ctx.beginPath(); ctx.moveTo(sx, ty - 12); ctx.lineTo(sx + 190, ty - 12); ctx.stroke();

    ctx.fillStyle = 'rgba(232,228,216,0.6)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('ITEM', sx, ty);

    const hoveredKind = this._hoveredItemKind();
    let iy = ty + 20;
    if (!hoveredKind) {
      ctx.fillStyle = 'rgba(232,228,216,0.4)';
      ctx.font = '11px sans-serif';
      const lines = wrapPlainText(ctx, 'Hover an item to see what it does.', 180);
      lines.forEach(line => { ctx.fillText(line, sx, iy); iy += 15; });
      return;
    }

    const stats = getItemStats(hoveredKind);
    ctx.fillStyle = '#f1efe8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(stats.name, sx, iy);
    iy += 20;

    if (stats.atk) {
      ctx.fillStyle = '#e8c93c';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Attack  +${stats.atk}`, sx, iy);
      iy += 17;
    }
    if (stats.def) {
      ctx.fillStyle = '#85b7eb';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Defense  +${stats.def}`, sx, iy);
      iy += 17;
    }
    if (stats.spd) {
      ctx.fillStyle = '#78e0a8';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Speed  +${stats.spd}`, sx, iy);
      iy += 17;
    }
    if (stats.extra) {
      ctx.fillStyle = 'rgba(232,228,216,0.7)';
      ctx.font = 'italic 11px sans-serif';
      const lines = wrapPlainText(ctx, stats.extra, 180);
      lines.forEach(line => { ctx.fillText(line, sx, iy); iy += 14; });
    }
    if (!stats.atk && !stats.def && !stats.spd && !stats.extra) {
      ctx.fillStyle = 'rgba(232,228,216,0.4)';
      ctx.font = '11px sans-serif';
      ctx.fillText('No combat effect.', sx, iy);
    }
  }
}
