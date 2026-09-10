/* =========================================================================
 * ui.js — DOM-based menus & overlays: hideout hub, stash, trader, loadout,
 * results, settings, pause, in-raid inventory. Talks to Profile + host.
 * All user-facing text goes through G.t() / G.I18n helpers (en / zh).
 * ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const U = G.Utils;
  const t = (k, p) => G.t(k, p);
  const iname = (id) => G.I18n.itemName(id);

  // tiny DOM helper
  function h(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'style') e.setAttribute('style', attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (children) (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  // subtle tinted plate behind an item's icon, derived from its colour
  function iconBg(hex) {
    const n = parseInt((hex || '#888888').slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'radial-gradient(circle at 50% 38%, rgba(' + r + ',' + g + ',' + b + ',0.30), rgba(' + r + ',' + g + ',' + b + ',0.06))';
  }

  function itemTile(id, n, opts) {
    opts = opts || {};
    const def = G.getItem(id);
    const rc = G.RARITY_COLOR[def.rarity] || '#888';
    const tile = h('div', { class: 'item' + (opts.selected ? ' sel' : ''), style: 'border-color:' + rc });
    tile.appendChild(h('div', { class: 'item-ico', style: 'background:' + iconBg(def.color), html: G.Icons.itemSVG(id) }));
    tile.appendChild(h('div', { class: 'item-name', text: iname(id) }));
    if (n > 1 || opts.alwaysQty) tile.appendChild(h('div', { class: 'item-qty', text: t('ui.item.qty', { n }) }));
    if (opts.tag) tile.appendChild(h('div', { class: 'item-tag', text: opts.tag }));
    if (opts.onclick) tile.addEventListener('click', opts.onclick);
    return tile;
  }

  // caliber code ('545') -> localized ammo display name ('5.45x39' / '12 号霰弹')
  function ammoName(cal) { const id = G.AMMO_ITEM[cal]; return id ? iname(id) : cal; }

  // "₵350" or "₵400 + Medkit ×1" — a contract reward as one human line.
  function rewardText(rw) {
    rw = rw || {};
    let s = '₵' + U.formatNum(rw.money || 0);
    if (rw.items) for (const it of rw.items) s += ' + ' + iname(it.id) + (it.n > 1 ? (' ×' + it.n) : '');
    return s;
  }

  function itemDesc(def) {
    if (def.type === 'weapon') {
      const dps = (def.damage * (1000 / def.fireRate) * (def.pellets || 1)).toFixed(0);
      const dmg = def.pellets ? t('ui.itemdesc.weapon.damagePellets', { damage: def.damage, pellets: def.pellets }) : String(def.damage);
      return t('ui.itemdesc.weapon', { cls: G.I18n.wclass(def.cls), ammoType: ammoName(def.ammoType), damage: dmg, mag: def.mag, dps });
    }
    if (def.type === 'ammo') return t('ui.itemdesc.ammo', { ammoType: iname(def.id) });
    if (def.type === 'armor') return t('ui.itemdesc.armor', { class: def.armorClass, pct: Math.round(def.defPct * 100), dura: def.durability });
    if (def.type === 'med') return t('ui.itemdesc.med', { hp: def.heal, time: def.useTime });
    if (def.type === 'valuable') return t('ui.itemdesc.valuable');
    return '';
  }

  const UI = {
    root: null,
    host: null,
    screen: 'hub',
    selectedLocation: null,

    init(host) {
      this.host = host;
      this.root = document.getElementById('ui-root');
    },

    clear() { this.root.innerHTML = ''; },
    hideAll() { this.root.style.display = 'none'; },
    show() { this.root.style.display = ''; },

    // re-render the current menu screen (used after a language switch)
    _rerender() {
      switch (this.screen) {
        case 'intro': return this.showIntro();
        case 'hub': return this.showHub();
        case 'deploy': return this.showDeploy();
        case 'loadout': return this.selectedLocation ? this.showLoadout() : this.showHub();
        case 'stash': return this.showStash();
        case 'trader': return this.showTrader(this._traderTab);
        case 'contracts': return this.showContracts();
        case 'settings': return this.showSettings();
        case 'results': return this._results ? this.showResults(this._results.result, this._results.extra) : this.showHub();
        default: return this.showHub();
      }
    },

    header(title, sub) {
      const p = G.Profile.data;
      return h('div', { class: 'topbar' }, [
        h('div', { class: 'brand' }, [
          h('div', { class: 'logo', html: G.Icons.spark() }),
          h('div', {}, [h('div', { class: 'title', text: title || t('ui.brand.title') }),
          sub ? h('div', { class: 'subtitle', text: sub }) : null]),
        ]),
        h('div', { class: 'topright' }, [
          langToggle(this),
          h('div', { class: 'money', html: '₵ <b>' + U.formatNum(p.money) + '</b>' }),
        ]),
      ]);
    },

    /* ------------------------------ INTRO ------------------------------ */
    showIntro() {
      this.screen = 'intro'; this.show(); this.clear();
      const wrap = h('div', { class: 'screen intro' });
      wrap.appendChild(h('div', { class: 'intro-langbar' }, [langToggle(this)]));
      wrap.appendChild(h('div', { class: 'intro-logo', html: G.Icons.spark() }));
      wrap.appendChild(h('div', { class: 'intro-title', text: t('ui.intro.title') }));
      wrap.appendChild(h('div', { class: 'intro-tag', text: t('ui.intro.tagline') }));
      wrap.appendChild(h('div', { class: 'intro-story', text: t('ui.intro.story') }));
      const steps = [
        [t('ui.intro.search.title'), t('ui.intro.search.desc')],
        [t('ui.intro.strike.title'), t('ui.intro.strike.desc')],
        [t('ui.intro.extract.title'), t('ui.intro.extract.desc')],
      ];
      const list = h('div', { class: 'intro-steps' });
      for (const [ti, d] of steps) list.appendChild(h('div', { class: 'intro-step' }, [
        h('div', { class: 'is-title', text: ti }), h('div', { class: 'is-desc', text: d }),
      ]));
      wrap.appendChild(list);
      wrap.appendChild(h('div', { class: 'warn', text: t('ui.intro.warn') }));
      wrap.appendChild(navBtns([[t('ui.intro.enter'), () => { G.Profile.markIntroSeen(); this.showHub(); }, 'primary']]));
      this.root.appendChild(wrap);
    },

    /* ------------------------------- HUB ------------------------------- */
    showHub() {
      this.screen = 'hub'; this.show(); this.clear();
      const p = G.Profile.data, st = p.stats;
      const sr = st.raids ? Math.round(st.survived / st.raids * 100) : 0;
      const wrap = h('div', { class: 'screen hub' });
      wrap.appendChild(this.header(t('ui.brand.title'), t('ui.hub.subtitle')));

      const stats = h('div', { class: 'statstrip' }, [
        statBox(t('ui.hub.stat.raids'), st.raids), statBox(t('ui.hub.stat.survived'), st.survived + ' (' + sr + '%)'),
        statBox(t('ui.hub.stat.kills'), st.kills), statBox(t('ui.hub.stat.bestExtract'), '₵' + U.formatNum(st.bestExtract)),
      ]);
      wrap.appendChild(stats);

      const menu = h('div', { class: 'mainmenu' }, [
        bigBtn(t('ui.hub.menu.deploy.title'), t('ui.hub.menu.deploy.sub'), 'primary', () => this.showDeploy()),
        bigBtn(t('ui.hub.menu.stash.title'), t('ui.hub.menu.stash.sub', { used: G.Profile.stashUsed(), total: G.Config.STASH_SLOTS }), '', () => this.showStash()),
        bigBtn(t('ui.hub.menu.trader.title'), t('ui.hub.menu.trader.sub'), '', () => this.showTrader()),
        bigBtn(t('ui.hub.menu.contracts.title'), contractsSub(), contractsReady() ? 'ready' : '', () => this.showContracts()),
        bigBtn(t('ui.hub.menu.settings.title'), t('ui.hub.menu.settings.sub'), '', () => this.showSettings()),
      ]);
      wrap.appendChild(menu);
      wrap.appendChild(h('div', { class: 'hint', text: t('ui.hub.tip') }));
      this.root.appendChild(wrap);
    },

    /* ----------------------------- DEPLOY ------------------------------ */
    showDeploy() {
      this.screen = 'deploy'; this.clear();
      const wrap = h('div', { class: 'screen' });
      wrap.appendChild(this.header(t('ui.deploy.header')));
      const riskKeys = ['', 'ui.deploy.risk.low', 'ui.deploy.risk.medium', 'ui.deploy.risk.high'];
      const grid = h('div', { class: 'loc-grid' });
      for (const loc of G.Locations) {
        const risk = t(riskKeys[loc.difficulty] || 'ui.deploy.risk.high');
        const card = h('div', { class: 'loc-card risk-' + loc.difficulty, onclick: () => { this.selectedLocation = loc; this.showLoadout(); } }, [
          h('div', { class: 'loc-name', text: G.I18n.locName(loc) }),
          h('div', { class: 'loc-risk', text: t('ui.deploy.risk.label', { risk }) }),
          h('div', { class: 'loc-desc', text: G.I18n.locDesc(loc) }),
          h('div', { class: 'loc-meta', text: t('ui.deploy.lootMul', { mul: loc.lootMul.toFixed(2) }) }),
        ]);
        grid.appendChild(card);
      }
      wrap.appendChild(grid);
      wrap.appendChild(navBtns([[t('ui.nav.back'), () => this.showHub()]]));
      this.root.appendChild(wrap);
    },

    /* ----------------------------- LOADOUT ----------------------------- */
    showLoadout() {
      this.screen = 'loadout'; this.clear();
      const p = G.Profile, ld = p.data.loadout;
      const loc = this.selectedLocation;
      const wrap = h('div', { class: 'screen' });
      wrap.appendChild(this.header(t('ui.loadout.header'), t('ui.loadout.subtitle', { location: G.I18n.locName(loc) })));

      const owned = (type) => {
        const ids = []; const seen = {};
        for (const s of p.data.stash) { const d = G.getItem(s.id); if (d.type === type && !seen[s.id]) { seen[s.id] = true; ids.push(s.id); } }
        return ids;
      };

      const mkSelect = (label, type, key, allowNone) => {
        const sel = h('select', { class: 'ld-select' });
        if (allowNone) sel.appendChild(h('option', { value: '' }, t('ui.loadout.none')));
        for (const id of owned(type)) {
          sel.appendChild(h('option', { value: id }, t('ui.loadout.optionLabel', { name: iname(id), count: p.countItem(id) })));
        }
        sel.value = ld[key] || '';
        if (sel.value !== (ld[key] || '')) { ld[key] = sel.value || null; }
        sel.addEventListener('change', () => { ld[key] = sel.value || null; p.save(); this._refreshLoadoutInfo(); });
        return h('div', { class: 'ld-row' }, [h('label', { text: label }), sel]);
      };

      const body = h('div', { class: 'loadout-body' });
      body.appendChild(mkSelect(t('ui.loadout.label.primary'), 'weapon', 'primary', true));
      body.appendChild(mkSelect(t('ui.loadout.label.secondary'), 'weapon', 'secondary', true));
      body.appendChild(mkSelect(t('ui.loadout.label.armor'), 'armor', 'armor', true));

      // meds
      const medSel = h('select', { class: 'ld-select' });
      medSel.appendChild(h('option', { value: '' }, t('ui.loadout.none')));
      for (const id of owned('med')) medSel.appendChild(h('option', { value: id }, t('ui.loadout.optionLabel', { name: iname(id), count: p.countItem(id) })));
      medSel.value = ld.medId || '';
      medSel.addEventListener('change', () => { ld.medId = medSel.value || null; p.save(); this._refreshLoadoutInfo(); });
      const medCount = h('input', { class: 'ld-count', type: 'number', min: '0', max: '6', value: String(ld.medCount || 0) });
      medCount.addEventListener('change', () => { ld.medCount = U.clamp(parseInt(medCount.value) || 0, 0, 6); medCount.value = ld.medCount; p.save(); this._refreshLoadoutInfo(); });
      body.appendChild(h('div', { class: 'ld-row' }, [h('label', { text: t('ui.loadout.label.meds') }), medSel, medCount]));

      wrap.appendChild(body);
      wrap.appendChild(h('div', { class: 'loadout-info', id: 'loadout-info' }));

      wrap.appendChild(h('div', { class: 'warn', text: t('ui.loadout.warn') }));
      wrap.appendChild(navBtns([
        [t('ui.nav.back'), () => this.showDeploy()],
        [t('ui.loadout.scavRun'), () => this.host.startRaid(loc, G.Profile.scavKit()), 'scav'],
        [t('ui.loadout.deploy'), () => this._deploy(loc), 'primary'],
      ]));
      this.root.appendChild(wrap);
      this._refreshLoadoutInfo();
    },

    _refreshLoadoutInfo() {
      const info = document.getElementById('loadout-info'); if (!info) return;
      const p = G.Profile, ld = p.data.loadout;
      info.innerHTML = '';
      const calibers = {};
      [ld.primary, ld.secondary].forEach(id => { if (id) calibers[G.getItem(id).ammoType] = true; });
      const rows = [];
      for (const cal in calibers) {
        const have = p.countItem(G.AMMO_ITEM[cal]);
        const calName = ammoName(cal);
        rows.push(h('div', { class: 'li-line' + (have <= 0 ? ' bad' : ''),
          text: have <= 0 ? t('ui.loadout.info.ammoNone', { cal: calName, count: have }) : t('ui.loadout.info.ammoHave', { cal: calName, count: have }) }));
      }
      if (!rows.length) rows.push(h('div', { class: 'li-line', text: t('ui.loadout.info.noWeapon') }));
      let val = 0;
      [ld.primary, ld.secondary, ld.armor].forEach(id => { if (id && p.countItem(id) > 0) val += G.getItem(id).value; });
      info.appendChild(h('div', { class: 'li-title', text: t('ui.loadout.info.autoLoadedTitle') }));
      rows.forEach(r => info.appendChild(r));
      info.appendChild(h('div', { class: 'li-risk', text: t('ui.loadout.info.valueAtRisk', { value: U.formatNum(val) }) }));
    },

    _deploy(loc) {
      const carried = G.Profile.commitRaidStart();
      if (carried.error) { this.toast(carried.error); return; }
      this.host.startRaid(loc, carried);
    },

    /* ------------------------------ STASH ------------------------------ */
    showStash() {
      this.screen = 'stash'; this.clear();
      const p = G.Profile;
      const wrap = h('div', { class: 'screen' });
      wrap.appendChild(this.header(t('ui.stash.header'), t('ui.stash.slots', { used: p.stashUsed(), total: G.Config.STASH_SLOTS })));
      const grid = h('div', { class: 'item-grid' });
      const sorted = p.data.stash.slice().sort((a, b) => typeRank(a.id) - typeRank(b.id) || G.getItem(b.id).value - G.getItem(a.id).value);
      if (!sorted.length) grid.appendChild(h('div', { class: 'empty', text: t('ui.stash.empty') }));
      for (const s of sorted) grid.appendChild(itemTile(s.id, s.n, { onclick: () => this._showItemInfo(s.id) }));
      wrap.appendChild(grid);
      wrap.appendChild(h('div', { class: 'detail', id: 'item-detail' }));
      wrap.appendChild(navBtns([[t('ui.nav.back'), () => this.showHub()], [t('ui.stash.sellAtTrader'), () => this.showTrader('sell')]]));
      this.root.appendChild(wrap);
    },

    _showItemInfo(id) {
      const d = document.getElementById('item-detail'); if (!d) return;
      const def = G.getItem(id);
      d.innerHTML = '';
      d.appendChild(h('div', { class: 'd-name', style: 'color:' + (G.RARITY_COLOR[def.rarity] || '#fff'), text: iname(id) }));
      d.appendChild(h('div', { class: 'd-desc', text: itemDesc(def) }));
      d.appendChild(h('div', { class: 'd-val', text: t('ui.item.value', { value: def.value, owned: G.Profile.countItem(id) }) }));
    },

    /* ------------------------------ TRADER ----------------------------- */
    // tab = 'buy' | 'sell'; cat = item type ('weapon'|'armor'|'med'|'ammo'|'valuable'|'key')
    showTrader(tab, cat) {
      this.screen = 'trader'; this.clear();
      this._traderTab = tab || this._traderTab || 'buy';
      const wrap = h('div', { class: 'screen' });
      wrap.appendChild(this.header(t('ui.trader.header')));
      wrap.appendChild(h('div', { class: 'trader-greet', text: t('ui.trader.greeting') }));
      const tabs = h('div', { class: 'tabs' }, [
        h('div', { class: 'tab' + (this._traderTab === 'buy' ? ' active' : ''), text: t('ui.trader.tab.buy'), onclick: () => this.showTrader('buy') }),
        h('div', { class: 'tab' + (this._traderTab === 'sell' ? ' active' : ''), text: t('ui.trader.tab.sell'), onclick: () => this.showTrader('sell') }),
      ]);
      wrap.appendChild(tabs);

      // unique ids available in the active tab, then the categories they span
      const sourceIds = this._traderTab === 'buy' ? G.ShopStock.slice() : uniqueStashIds();
      const cats = CAT_ORDER.filter(c => sourceIds.some(id => G.getItem(id).type === c));
      // resolve the active category (carry the user's pick across tabs when valid)
      this._traderCat = cat || this._traderCat;
      if (cats.indexOf(this._traderCat) < 0) this._traderCat = cats[0] || null;

      if (cats.length > 1) {
        wrap.appendChild(h('div', { class: 'subtabs' }, cats.map(c =>
          h('div', { class: 'subtab' + (this._traderCat === c ? ' active' : ''), text: t('ui.trader.cat.' + c),
            onclick: () => this.showTrader(this._traderTab, c) }))));
      }

      // items in the active category, cheapest-first when buying, priciest-first when selling
      const byValue = this._traderTab === 'buy'
        ? (a, b) => G.getItem(a).value - G.getItem(b).value
        : (a, b) => G.getItem(b).value - G.getItem(a).value;
      const ids = sourceIds.filter(id => G.getItem(id).type === this._traderCat).sort(byValue);

      const list = h('div', { class: 'trade-list' });
      if (this._traderTab === 'buy') this._buildBuy(list, ids); else this._buildSell(list, ids);
      wrap.appendChild(list);
      wrap.appendChild(navBtns([[t('ui.nav.back'), () => this.showHub()]]));
      this.root.appendChild(wrap);
    },

    _buildBuy(list, ids) {
      const p = G.Profile;
      if (!ids.length) { list.appendChild(h('div', { class: 'empty', text: t('ui.trader.empty') })); return; }
      for (const id of ids) {
        const def = G.getItem(id);
        const row = h('div', { class: 'trade-row' }, [
          itemTile(id, 1, {}),
          h('div', { class: 'tr-info' }, [
            h('div', { class: 'tr-name', text: iname(id) }),
            h('div', { class: 'tr-desc', text: itemDesc(def) }),
          ]),
          h('div', { class: 'tr-price', text: '₵' + U.formatNum(p.buyPrice(id)) }),
          h('div', { class: 'tr-actions' }, [
            h('button', { class: 'mini', text: t('ui.trader.buyBtn'), onclick: () => this._afterTrade(p.buy(id, 1)) }),
            (def.stack && def.stack >= 5) ? h('button', { class: 'mini', text: t('ui.trader.buyX10'), onclick: () => this._afterTrade(p.buy(id, 10)) }) : null,
          ]),
        ]);
        list.appendChild(row);
      }
    },

    _buildSell(list, ids) {
      const p = G.Profile;
      if (!ids.length) { list.appendChild(h('div', { class: 'empty', text: t('ui.trader.empty') })); return; }
      for (const id of ids) {
        const owned = p.countItem(id);
        const row = h('div', { class: 'trade-row' }, [
          itemTile(id, owned, { alwaysQty: owned > 1 }),
          h('div', { class: 'tr-info' }, [
            h('div', { class: 'tr-name', text: t('ui.trader.sellName', { name: iname(id), owned }) }),
            h('div', { class: 'tr-desc', text: itemDesc(G.getItem(id)) }),
          ]),
          h('div', { class: 'tr-price', text: '₵' + U.formatNum(p.sellPrice(id)) }),
          h('div', { class: 'tr-actions' }, [
            h('button', { class: 'mini', text: t('ui.trader.sellBtn'), onclick: () => { p.sell(id, 1); this.showTrader('sell'); } }),
            owned > 1 ? h('button', { class: 'mini', text: t('ui.trader.sellAll'), onclick: () => { p.sell(id, owned); this.showTrader('sell'); } }) : null,
          ]),
        ]);
        list.appendChild(row);
      }
    },

    _afterTrade(r) {
      if (!r.ok) { this.toast(r.msg || t('ui.trader.toast.cannotBuy')); return; }
      this.showTrader('buy');
    },

    /* ---------------------------- CONTRACTS ---------------------------- */
    // The Conch's questline. One contract is active; earlier ones show as done,
    // later ones as locked. The active card shows progress and a Claim button
    // that lights up once the goal is met.
    showContracts() {
      this.screen = 'contracts'; this.show(); this.clear();
      const p = G.Profile;
      const wrap = h('div', { class: 'screen' });
      wrap.appendChild(this.header(t('contracts.header'), t('contracts.subtitle')));

      const stage = p.data.contracts.stage;
      const list = h('div', { class: 'contracts-list' });
      const allDone = stage >= G.Contracts.length;
      if (allDone) list.appendChild(h('div', { class: 'hint', text: t('contracts.allDone') }));

      G.Contracts.forEach((c, i) => {
        const state = i < stage ? 'done' : i === stage ? 'active' : 'locked';
        const title = t('contract.' + c.id + '.title');
        const card = h('div', { class: 'contract-card ' + state });
        const head = h('div', { class: 'cc-head' }, [
          h('div', { class: 'cc-title', text: (state === 'done' ? '✓ ' : state === 'locked' ? '🔒 ' : '✦ ') + title }),
          h('div', { class: 'cc-badge ' + state, text: t('contracts.' + state) }),
        ]);
        card.appendChild(head);
        if (state === 'active') {
          const pr = p.contractProgress(c);
          card.appendChild(h('div', { class: 'cc-desc', text: t('contract.' + c.id + '.desc') }));
          // progress bar
          const bar = h('div', { class: 'cc-bar' }, [h('div', { class: 'cc-bar-fill', style: 'width:' + Math.round((pr.cur / pr.total) * 100) + '%' })]);
          card.appendChild(bar);
          card.appendChild(h('div', { class: 'cc-prog', text: t('contracts.progress', { cur: pr.cur, total: pr.total }) }));
          card.appendChild(h('div', { class: 'cc-reward', text: t('contracts.reward', { reward: rewardText(c.reward) }) }));
          const claim = h('button', { class: 'nav primary cc-claim' + (pr.done ? '' : ' disabled'), text: t('contracts.claim') });
          claim.addEventListener('click', () => {
            const r = p.claimContract();
            if (r.ok) { this.toast(t('contracts.toast.claimed', { reward: rewardText(r.reward) })); this.showContracts(); }
            else this.toast(t('contracts.toast.notReady'));
          });
          card.appendChild(claim);
        } else if (state === 'done') {
          card.appendChild(h('div', { class: 'cc-reward', text: t('contracts.reward', { reward: rewardText(c.reward) }) }));
        }
        list.appendChild(card);
      });
      wrap.appendChild(list);
      wrap.appendChild(navBtns([[t('ui.nav.back'), () => this.showHub()]]));
      this.root.appendChild(wrap);
    },

    /* ----------------------------- SETTINGS ---------------------------- */
    showSettings() {
      this.screen = 'settings'; this.clear();
      const p = G.Profile;
      const wrap = h('div', { class: 'screen' });
      wrap.appendChild(this.header(t('ui.settings.header')));
      const body = h('div', { class: 'settings-body' });

      // language
      body.appendChild(h('div', { class: 'set-row' }, [h('label', { text: '语言 / Language' }), langToggle(this)]));

      const sfxToggle = h('button', { class: 'toggle ' + (p.data.settings.sfx ? 'on' : 'off'), text: p.data.settings.sfx ? t('ui.settings.toggle.on') : t('ui.settings.toggle.off') });
      sfxToggle.addEventListener('click', () => { const on = !p.data.settings.sfx; p.setSfx(on); sfxToggle.textContent = on ? t('ui.settings.toggle.on') : t('ui.settings.toggle.off'); sfxToggle.className = 'toggle ' + (on ? 'on' : 'off'); });
      body.appendChild(h('div', { class: 'set-row' }, [h('label', { text: t('ui.settings.sfx') }), sfxToggle]));

      const vol = h('input', { type: 'range', min: '0', max: '100', value: String(Math.round((p.data.settings.volume ?? 0.6) * 100)) });
      vol.addEventListener('input', () => p.setVolume(parseInt(vol.value) / 100));
      body.appendChild(h('div', { class: 'set-row' }, [h('label', { text: t('ui.settings.volume') }), vol]));

      body.appendChild(h('div', { class: 'controls-help' }, [
        h('div', { class: 'ch-title', text: t('ui.settings.controls.title') }),
        h('div', { class: 'ch', html: t('ui.settings.controls.desktop') }),
        h('div', { class: 'ch', html: t('ui.settings.controls.touch') }),
      ]));

      const reset = h('button', { class: 'danger', text: t('ui.settings.reset') });
      reset.addEventListener('click', () => {
        if (reset.dataset.confirm) { G.Profile.resetAll(); this.showHub(); }
        else { reset.dataset.confirm = '1'; reset.textContent = t('ui.settings.resetConfirm'); }
      });
      body.appendChild(h('div', { class: 'set-row' }, [h('label', { text: t('ui.settings.dangerZone') }), reset]));

      wrap.appendChild(body);
      wrap.appendChild(navBtns([[t('ui.nav.back'), () => this.showHub()]]));
      this.root.appendChild(wrap);
    },

    /* ----------------------------- RESULTS ----------------------------- */
    showResults(result, extra) {
      this.screen = 'results'; this.show(); this.clear();
      this._results = { result, extra };
      const win = result.outcome === 'extract';
      const wrap = h('div', { class: 'screen results ' + (win ? 'win' : 'lose') });
      const titleKey = { extract: 'ui.results.title.extract', death: 'ui.results.title.death', mia: 'ui.results.title.mia', abandoned: 'ui.results.title.abandoned' }[result.outcome] || 'ui.results.title.fallback';
      wrap.appendChild(h('div', { class: 'res-banner', text: t(titleKey) }));
      const flavorKey = 'ui.results.flavor.' + result.outcome;
      if (G.I18n.has(flavorKey)) wrap.appendChild(h('div', { class: 'res-flavor', text: t(flavorKey) }));
      const lines = [
        [t('ui.results.eliminations'), result.kills],
        [t('ui.results.timeInRaid'), t('ui.results.timeValue', { m: Math.floor(result.time / 60), s: result.time % 60 })],
      ];
      if (win) {
        lines.push([t('ui.results.lootExtracted'), t('ui.results.lootValue', { value: U.formatNum(result.lootValue), items: result.items })]);
        const ex = extra && extra.extract;
        if (ex && ex.sold > 0) lines.push([t('ui.results.stashFull'), t('ui.results.overflowSold', { value: U.formatNum(ex.sold) })]);
        if (ex && ex.scav) lines.push([t('ui.results.scavTax'), t('ui.results.scavTaxValue')]);
        lines.push([t('ui.results.status'), t('ui.results.statusSecured')]);
      } else {
        lines.push([t('ui.results.lootLost'), t('ui.results.lootValue', { value: U.formatNum(result.lootValue), items: result.items })]);
        if (extra && extra.carriedValue) lines.push([t('ui.results.gearLost'), result.scav ? t('ui.results.gearLostScav') : t('ui.results.gearLostValue', { value: U.formatNum(extra.carriedValue) })]);
      }
      const tbl = h('div', { class: 'res-table' });
      for (const [k, v] of lines) tbl.appendChild(h('div', { class: 'res-line' }, [h('span', { text: k }), h('b', { text: String(v) })]));
      wrap.appendChild(tbl);
      wrap.appendChild(navBtns([[t('ui.results.return'), () => this.host.toHub(), 'primary']]));
      this.root.appendChild(wrap);
    },

    /* ----------------------------- PAUSE ------------------------------- */
    openPause(raid) {
      this.show(); this.clear();
      const wrap = h('div', { class: 'screen overlay-screen' });
      wrap.appendChild(h('div', { class: 'pause-title', text: t('ui.pause.title') }));
      const abandon = h('button', { class: 'big danger', text: t('ui.pause.abandon') });
      abandon.addEventListener('click', () => {
        if (abandon.dataset.c) { this.hideAll(); raid.abandon(); }
        else { abandon.dataset.c = '1'; abandon.textContent = t('ui.pause.abandonConfirm'); }
      });
      wrap.appendChild(h('div', { class: 'pause-menu' }, [
        h('button', { class: 'big primary', text: t('ui.pause.resume'), onclick: () => { this.hideAll(); G.Input.resetTouch(); raid.paused = false; } }),
        abandon,
      ]));
      this.root.appendChild(wrap);
    },

    /* ------------------------ RAID INVENTORY --------------------------- */
    openRaidInventory(raid) {
      this.show(); this.clear();
      const p = raid.player;
      const wrap = h('div', { class: 'screen overlay-screen' });
      wrap.appendChild(h('div', { class: 'inv-head' }, [
        h('div', { class: 'pause-title', text: t('ui.inv.title') }),
        h('div', { class: 'inv-val', text: t('ui.inv.lootValue', { value: U.formatNum(p.lootValue()), count: p.backpackCount(), total: G.Config.BACKPACK_SLOTS }) }),
      ]));
      const grid = h('div', { class: 'item-grid' });
      if (!p.backpack.length) grid.appendChild(h('div', { class: 'empty', text: t('ui.inv.empty') }));
      p.backpack.forEach((s, i) => {
        const def = G.getItem(s.id);
        if (def.type === 'med') {
          grid.appendChild(itemTile(s.id, s.n, {
            tag: t('ui.inv.tag.use'),
            onclick: () => { p.useMed(raid); this.openRaidInventory(raid); },
          }));
        } else if (def.type === 'armor') {
          grid.appendChild(itemTile(s.id, s.n, {
            tag: t('ui.inv.tag.equip'),
            onclick: () => { p.equipArmorById(s.id, raid); this.openRaidInventory(raid); },
          }));
        } else {
          grid.appendChild(itemTile(s.id, s.n, {
            tag: t('ui.inv.tag.drop'),
            onclick: (e) => {
              const tile = e.currentTarget;
              if (tile.dataset.c) {
                raid.groundItems.push({ x: p.x + U.rand(-12, 12), y: p.y + U.rand(-12, 12), id: s.id, n: s.n, pop: 0.3, delay: 0.6, bob: Math.random() * 6 });
                p.backpack.splice(i, 1);
                this.openRaidInventory(raid);
              } else {
                tile.dataset.c = '1';
                const tg = tile.querySelector('.item-tag'); if (tg) tg.textContent = t('ui.inv.tag.confirm');
              }
            },
          }));
        }
      });
      wrap.appendChild(grid);
      const eq = h('div', { class: 'equip-row' });
      p.weapons.forEach((w, i) => { if (w) eq.appendChild(h('div', { class: 'eq', text: t('ui.inv.equip.weapon', { slot: i + 1, name: iname(w.id) }) })); });
      if (p.armor) eq.appendChild(h('div', { class: 'eq', text: t('ui.inv.equip.armor', { durability: Math.round(p.armor.durability) }) }));
      wrap.appendChild(eq);
      wrap.appendChild(navBtns([[t('ui.inv.resume'), () => { this.hideAll(); G.Input.resetTouch(); raid.paused = false; raid.invOpen = false; }, 'primary']]));
      this.root.appendChild(wrap);
    },

    /* ------------------------------ toast ------------------------------ */
    toast(msg) {
      let el = document.getElementById('ui-toast');
      if (!el) { el = h('div', { id: 'ui-toast' }); document.body.appendChild(el); }
      el.textContent = msg; el.className = 'show';
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => { el.className = ''; }, 2200);
    },
  };

  // ---- small builders ----
  function statBox(label, val) { return h('div', { class: 'statbox' }, [h('div', { class: 'sb-val', text: String(val) }), h('div', { class: 'sb-label', text: label })]); }
  function bigBtn(title, sub, cls, onclick) {
    return h('button', { class: 'menu-btn ' + (cls || ''), onclick }, [h('div', { class: 'mb-title', text: title }), h('div', { class: 'mb-sub', text: sub })]);
  }
  function navBtns(arr) {
    return h('div', { class: 'navbtns' }, arr.map(([label, fn, cls]) => h('button', { class: 'nav ' + (cls || ''), text: label, onclick: fn })));
  }
  // true when the active contract's goal is met and the reward is waiting to be claimed
  function contractsReady() {
    const pr = G.Profile.contractProgress();
    return !!(pr && pr.done);
  }
  // hub sub-label: "✦ Ready to claim", the active favor's title, or "all done"
  function contractsSub() {
    const c = G.Profile.contractCurrent();
    if (!c) return t('contracts.allDone');
    if (contractsReady()) return '✦ ' + t('contracts.claim').replace('✦ ', '');
    const pr = G.Profile.contractProgress(c);
    return t('contract.' + c.id + '.title') + ' · ' + pr.cur + '/' + pr.total;
  }
  function typeRank(id) { return { weapon: 0, armor: 1, ammo: 2, med: 3, valuable: 4, key: 5 }[G.getItem(id).type] ?? 9; }
  // trader category order (also the type → subtab ordering)
  const CAT_ORDER = ['weapon', 'armor', 'med', 'ammo', 'valuable', 'key'];
  function uniqueStashIds() {
    const seen = {}, ids = [];
    for (const s of G.Profile.data.stash) if (!seen[s.id]) { seen[s.id] = true; ids.push(s.id); }
    return ids;
  }

  // EN / 中 language switch — persists and re-renders the current screen
  function langToggle(ui) {
    const cur = G.I18n.lang;
    const mk = (code, label) => h('button', {
      class: 'lang-btn' + (cur === code ? ' active' : ''), text: label,
      onclick: () => { if (G.I18n.lang !== code) { G.Profile.setLang(code); ui._rerender(); } },
    });
    return h('div', { class: 'lang-toggle' }, [mk('en', 'EN'), mk('zh', '中')]);
  }

  G.UI = UI;

})();
