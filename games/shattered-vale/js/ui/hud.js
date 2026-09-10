// ui/hud.js — the always-visible in-game HUD: the DOM hp/xp/mana bars
// (hidden until Play is pressed) and the canvas-drawn boss banner / toast /
// quest tracker that sit on top of the world.

const Hud = {
  // Wires up the DOM HUD elements once at boot. Returns { setVisible, sync }
  // rather than exposing the raw elements, so game.js doesn't need to know
  // about the (slightly fiddly) shared-container grouping below.
  bindDom(dom) {
    function nearestCommonAncestor(a, b) {
      if (!a && !b) return null;
      if (!a) return b;
      if (!b) return a;
      const chainA = [];
      for (let el = a; el; el = el.parentElement) chainA.push(el);
      for (let el = b; el; el = el.parentElement) {
        if (chainA.includes(el)) return el;
      }
      return document.body;
    }
    function group(el1, el2) {
      const anc = nearestCommonAncestor(el1, el2);
      if (!anc || anc === document.body || anc === document.documentElement) {
        return [el1, el2].filter(Boolean);
      }
      return [anc];
    }

    const targets = [
      ...group(dom.hpBar, dom.hpText),
      ...group(dom.xpBar, dom.lvlText),
      ...group(dom.manaBar, dom.manaText),
      ...(dom.goldText && dom.goldText.parentElement && dom.goldText.parentElement !== document.body
        ? [dom.goldText.parentElement]
        : [dom.goldText]),
    ].filter(Boolean);
    const uniqueTargets = [...new Set(targets)];
    const originalDisplay = new Map();
    uniqueTargets.forEach((el) => originalDisplay.set(el, el.style.display));

    return {
      setVisible(visible) {
        uniqueTargets.forEach((el) => {
          el.style.display = visible ? (originalDisplay.get(el) || '') : 'none';
        });
      },
      sync(player) {
        dom.hpBar.style.width = (player.hp / player.maxHp * 100) + '%';
        dom.hpText.textContent = `${player.hp}/${player.maxHp}`;
        dom.xpBar.style.width = (player.xp / player.xpNext * 100) + '%';
        dom.xpText.textContent = `${player.xp} / ${player.xpNext} Exp`;
        dom.lvlText.textContent = player.lvl;
        dom.goldText.textContent = player.gold;
        dom.manaBar.style.width = (player.mana / player.maxMana * 100) + '%';
        dom.manaText.textContent = `${Math.floor(player.mana)}/${player.maxMana}`;
      },
    };
  },

  // Prefers a boss the player is actively engaged with (in its aggro
  // range), falling back to the nearest living boss if simply nearby.
  _getActiveBoss(state, viewW, viewH) {
    const { player, enemies } = state;
    let engaged = null, engagedDist = Infinity;
    let nearest = null, nearestDist = Infinity;
    enemies.forEach((en) => {
      if (!en.isBoss || !en.alive) return;
      const d = dist(player.centerX, player.centerY, en.centerX, en.centerY);
      if (d < en.aggroRange && d < engagedDist) {
        engaged = en;
        engagedDist = d;
      }
      if (d < nearestDist) {
        nearest = en;
        nearestDist = d;
      }
    });
    if (engaged) return engaged;
    if (nearest && nearestDist < Math.max(viewW, viewH) * 0.2) return nearest;
    return null;
  },

  drawBossBanner(ctx, state, viewW, viewH) {
    const boss = this._getActiveBoss(state, viewW, viewH);
    if (!boss) return;

    const name = BOSS_NAMES[boss.type] || 'Boss';
    const pct = clamp(boss.hp / boss.maxHp, 0, 1);
    const low = pct <= 0.25;

    const barW = Math.min(340, viewW - 80);
    const barH = 16;
    const x = (viewW - barW) / 2;
    const nameY = 22;
    const barY = nameY + 10;

    ctx.save();
    ctx.textAlign = 'center';

    // Name/bar color: keeps the original amber-for-devil / orange-for-others
    // scheme for existing bosses exactly as before, and gives the two new
    // Molten Depths bosses their own distinct colors.
    const bannerColor = boss.type === 'pitDevil' ? '#ff6a1e'
      : boss.type === 'trollChieftain' ? '#8fae5a'
      : boss.isDevil ? '#f4a13c' : '#e8975a';

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(name, viewW / 2 + 2, nameY + 2);
    ctx.fillStyle = bannerColor;
    ctx.fillText(name, viewW / 2, nameY);

    ctx.fillStyle = 'rgba(10,12,8,0.75)';
    roundRect(ctx, x - 3, barY - 3, barW + 6, barH + 6, 6);
    ctx.fill();
    ctx.strokeStyle = low && Math.floor(Date.now() / 250) % 2 === 0 ? '#da1f1f' : 'rgba(232,228,216,0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x - 3, barY - 3, barW + 6, barH + 6, 6);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, x, barY, barW, barH, 4);
    ctx.fill();

    const fillColor = low ? '#da1f1f' : bannerColor;
    ctx.fillStyle = fillColor;
    roundRect(ctx, x, barY, Math.max(0, barW * pct), barH, 4);
    ctx.fill();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#f1efe8';
    ctx.fillText(`${Math.max(0, boss.hp)} / ${boss.maxHp}`, viewW / 2, barY + barH - 4);

    ctx.textAlign = 'left';
    ctx.restore();
  },

  drawToast(ctx, state, viewW) {
    if (!state.toastMsg) return;
    ctx.save();
    const w = ctx.measureText(state.toastMsg).width + 40;
    const x = (viewW - w) / 2;
    ctx.globalAlpha = clamp(state.toastTimer / 30, 0, 1);
    ctx.fillStyle = 'rgba(10,12,8,0.85)';
    roundRect(ctx, x, 16, w, 32, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,201,60,0.5)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, 16, w, 32, 8);
    ctx.stroke();
    ctx.fillStyle = '#f1efe8';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.toastMsg, viewW / 2, 37);
    ctx.textAlign = 'left';
    ctx.restore();
  },

  drawQuestTracker(ctx, state, viewH) {
    if (!(state.questStage > 0 && state.questStage < 3)) return;
    const label = state.questStage === 1
      ? 'Quest: Find the iron sword near the pond'
      : 'Quest: Defeat the goblin chief in the forest clearing';
    ctx.save();
    ctx.fillStyle = 'rgba(10,12,8,0.7)';
    const w = ctx.measureText(label).width + 24;
    roundRect(ctx, 12, viewH - 40, w, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#e8c93c';
    ctx.font = '12px sans-serif';
    ctx.fillText(label, 24, viewH - 22);
    ctx.restore();
  },

  drawVignette(ctx, viewW, viewH) {
    const grad = ctx.createRadialGradient(viewW / 2, viewH / 2, viewH * 0.35, viewW / 2, viewH / 2, viewH * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewW, viewH);
  },

  // The full in-game overlay (everything except the vignette, which is
  // drawn earlier in game.js's draw() so it sits under the dialogue/inventory
  // panels — see the ordering note there).
  draw(ctx, state, viewW, viewH) {
    this.drawBossBanner(ctx, state, viewW, viewH);
    this.drawToast(ctx, state, viewW);
    this.drawQuestTracker(ctx, state, viewH);
  },
};
