// core/game.js — boots the game and runs the main loop. This is the one
// file that's still allowed to know about "everything"; it wires together
// the systems (camera/particles/dialogue/inventory), the world (map,
// entities), and the logic modules (Combat/Hud/Screens/WorldFactory)
// without containing much game-specific logic of its own.

(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const VIEW_W = canvas.width, VIEW_H = canvas.height;

  // --- DOM HUD ---
  const dom = {
    hpBar: document.getElementById('hpBarInner'),
    hpText: document.getElementById('hpText'),
    xpBar: document.getElementById('xpBarInner'),
    // NOTE: the original game read/wrote `xpText` in its DOM-sync step but
    // never actually looked it up via getElementById, which threw a
    // ReferenceError the moment that code ran. Fixed here; if your
    // index.html uses a different id for the XP label, update this line.
    xpText: document.getElementById('xpText'),
    lvlText: document.getElementById('lvlText'),
    goldText: document.getElementById('goldText'),
    manaBar: document.getElementById('manaBarInner'),
    manaText: document.getElementById('manaText'),
  };
  const hud = Hud.bindDom(dom);
  hud.setVisible(false); // hidden until Play is pressed

  // --- Mobile / desktop-only gate ---
  let isMobileBlocked = isMobileDevice();
  window.addEventListener('resize', () => { isMobileBlocked = isMobileDevice(); });

  // --- Input ---
  const input = createInputState();
  const { keys, justPressed } = input;

  // --- Sprites & world ---
  initSprites();

  // Map is 109 cols x 236 rows: World 1 (village/forest) + World 2 (beach
  // oasis) side by side, then the Jungle band, the Skeleton Dungeon band,
  // and now the Molten Depths band beneath that (see world/tilemap.js for
  // the exact row breakdown).
  const map = new TileMap(109, 236);
  const camera = new Camera(VIEW_W, VIEW_H);
  const particles = new ParticleSystem();
  const dialogue = new DialogueSystem();
  const inventory = new Inventory();
  const player = new Player(PLAYER_SPAWN.x, PLAYER_SPAWN.y);

  const { npcs, elder, merchant } = WorldFactory.createNpcs();
  const worldItems = WorldFactory.createWorldItems();

  // Shared game state, passed explicitly into Combat/Hud/Screens so none of
  // those modules need to close over this file's local variables (they
  // can't anyway — each lives in its own <script> file).
  const state = {
    map, camera, particles, dialogue, inventory, player,
    npcs, elder, merchant, worldItems,
    enemies: WorldFactory.createEnemies(),
    merchantGaveGift: false,
    questStage: 0, // 0 = not talked, 1 = quest given, 2 = sword found, 3 = boss defeated
    gameState: 'start', // 'start' | 'howtoplay' | 'playing' | 'gameover'
    hasStarted: false, // true once Play has been pressed at least once — flips the start-menu button to "Continue"
    screenFlash: null, // {color, alpha}
    toastMsg: null,
    toastTimer: 0,
    restartButton: null,
    continueButton: null,
    startButtons: {},
    howToBackButton: null,
  };

  function restartGame() {
    player.x = PLAYER_SPAWN.x;
    player.y = PLAYER_SPAWN.y;

    player.maxHp = PLAYER_BASE_STATS.maxHp;
    player.hp = PLAYER_BASE_STATS.hp;
    player.xp = PLAYER_BASE_STATS.xp;
    player.xpNext = PLAYER_BASE_STATS.xpNext;
    player.lvl = PLAYER_BASE_STATS.lvl;
    player.gold = PLAYER_BASE_STATS.gold;
    player.atk = PLAYER_BASE_STATS.atk;
    player.hasSword = false;
    player.hasLegendarySword = false;
    player.hasMoltenSword = false;
    player.fireproof = false;
    player.defense = 0;
    player.speed = PLAYER_BASE_STATS.speed;
    player.attacking = 0;
    player.attackCooldown = 0;
    player.attackCount = 0;
    player.invuln = 0;
    // (mana/fireball cooldown intentionally carry over — matches the
    // original restart behavior, which never reset them either.)

    inventory.reset();

    state.questStage = 0;
    state.gameState = 'playing';
    state.hasStarted = true;
    state.merchantGaveGift = false;

    WorldFactory.resetNpcsAndItems(npcs, worldItems);
    state.enemies = WorldFactory.createEnemies();

    state.toastMsg = null;
    state.toastTimer = 0;
    state.restartButton = null;
    state.continueButton = null;
  }

  function update() {
    if (isMobileBlocked) return;

    if (state.gameState === 'start' || state.gameState === 'howtoplay') {
      input.clearJustPressed();
      return;
    }

    dialogue.update();

    if (state.gameState !== 'playing') return;

    if (dialogue.isOpen()) {
      if (justPressed[' '] || justPressed['e']) dialogue.advance();
    } else if (inventory.open) {
      if (justPressed['i'] || justPressed['escape']) inventory.toggle();
    } else if (justPressed['escape']) {
      state.gameState = 'start';
      hud.setVisible(false);
    } else {
      player.update(keys, map, particles);
      player.fireballs.forEach((f) => f.update(state.enemies, particles));
      player.fireballs = player.fireballs.filter((f) => f.life > 0);

      if (justPressed['e']) Combat.checkInteract(state);
      if (keys[' ']) Combat.handleAttack(state);
      if (justPressed['f']) {
        if (player.castFireball()) {
          Combat.toast(state, `Fireball cast! -${FIREBALL_STATS.manaCost} Mana`);
        } else {
          Combat.toast(state, 'Not enough mana!');
        }
      }
      if (justPressed['i']) inventory.toggle();

      npcs.forEach((n) => n.update());
      state.enemies.forEach((en) => en.update(player, map, particles));

      Combat.checkGateConditions(state);
      Combat.checkHazards(state);
      Combat.processWorldItemPickups(state);

      if (player.hp <= 0) state.gameState = 'gameover';
    }

    particles.update();
    camera.follow(player.centerX, player.centerY, map.cols * TILE, map.rows * TILE);

    if (state.screenFlash) {
      state.screenFlash.alpha -= 0.02;
      if (state.screenFlash.alpha <= 0) state.screenFlash = null;
    }
    if (state.toastTimer > 0) state.toastTimer--;
    else state.toastMsg = null;

    input.clearJustPressed();
  }

  function draw() {
    if (isMobileBlocked) {
      Screens.drawMobileBlock(ctx, VIEW_W, VIEW_H);
      return;
    }

    if (state.gameState === 'start') {
      Screens.drawStart(ctx, state, VIEW_W, VIEW_H);
      return;
    }
    if (state.gameState === 'howtoplay') {
      Screens.drawStart(ctx, state, VIEW_W, VIEW_H);
      Screens.drawHowToPlay(ctx, state, VIEW_W, VIEW_H);
      return;
    }

    const t = Date.now();
    const off = camera.getOffset();
    const camX = Math.round(off.x), camY = Math.round(off.y);

    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    map.drawGround(ctx, camX, camY, VIEW_W, VIEW_H);
    map.drawAnimated(ctx, camX, camY, VIEW_W, VIEW_H, t);

    // Depth-sorted draw: items, NPCs, enemies, player, and fireballs all
    // sorted by y (feet position) so nearer things draw over farther ones.
    const drawables = [];
    worldItems.forEach((it) => {
      if (!it.taken) drawables.push({ y: it.y + it.h, draw: () => it.draw(ctx, camX, camY) });
    });
    npcs.forEach((n) => drawables.push({ y: n.y + n.h, draw: () => n.draw(ctx, camX, camY) }));
    state.enemies.forEach((en) => drawables.push({ y: en.y + en.h, draw: () => en.draw(ctx, camX, camY) }));
    drawables.push({ y: player.y + player.h, draw: () => player.draw(ctx, camX, camY) });
    player.fireballs.forEach((f) => drawables.push({ y: f.y + f.h, draw: () => f.draw(ctx, camX, camY) }));
    drawables.sort((a, b) => a.y - b.y);
    drawables.forEach((d) => d.draw());

    particles.draw(ctx, camX, camY);
    Hud.drawVignette(ctx, VIEW_W, VIEW_H);

    if (state.screenFlash) {
      ctx.fillStyle = `rgba(${state.screenFlash.color},${Math.max(0, state.screenFlash.alpha)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    Hud.draw(ctx, state, VIEW_W, VIEW_H);
    dialogue.draw(ctx, VIEW_W, VIEW_H);
    inventory.draw(ctx, VIEW_W, VIEW_H, player);

    if (state.gameState === 'gameover' || state.gameState === 'victory') Screens.drawEnd(ctx, state, VIEW_W, VIEW_H);
  }

  let domTick = 0;
  function loop() {
    update();
    draw();
    domTick++;
    if (domTick % 4 === 0 && !isMobileBlocked) hud.sync(player);
    requestAnimationFrame(loop);
  }

  // --- Mouse input ---
  canvas.tabIndex = 0;
  canvas.addEventListener('mousemove', (e) => {
    if (isMobileBlocked) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (state.gameState === 'playing' && inventory.open) {
      inventory.updateHover(mx, my, VIEW_W, VIEW_H);
      canvas.style.cursor = 'default';
      return;
    }

    if (state.gameState !== 'start' && state.gameState !== 'howtoplay' && state.gameState !== 'gameover' && state.gameState !== 'victory') {
      canvas.style.cursor = 'default';
      return;
    }
    let over = false;
    if (state.gameState === 'start') {
      over = Screens.pointInBtn(mx, my, state.startButtons.play) ||
        Screens.pointInBtn(mx, my, state.startButtons.howto) ||
        Screens.pointInBtn(mx, my, state.startButtons.restart) ||
        Screens.pointInBtn(mx, my, state.startButtons.author);
    } else if (state.gameState === 'howtoplay') {
      over = Screens.pointInBtn(mx, my, state.howToBackButton);
    } else {
      over = Screens.pointInBtn(mx, my, state.restartButton) || Screens.pointInBtn(mx, my, state.continueButton);
    }
    canvas.style.cursor = over ? 'pointer' : 'default';
  });

  canvas.addEventListener('click', (e) => {
    canvas.focus();
    if (isMobileBlocked) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (state.gameState === 'playing' && inventory.open) {
      const hit = inventory.clickAt(mx, my, VIEW_W, VIEW_H);
      if (hit) Combat.handleInventoryClick(state, hit);
      return;
    }

    if (state.gameState === 'start') {
      if (Screens.pointInBtn(mx, my, state.startButtons.play)) {
        state.gameState = 'playing';
        state.hasStarted = true;
        hud.setVisible(true);
      } else if (Screens.pointInBtn(mx, my, state.startButtons.howto)) {
        state.gameState = 'howtoplay';
      } else if (Screens.pointInBtn(mx, my, state.startButtons.restart)) {
        restartGame();
        hud.setVisible(true);
      } else if (Screens.pointInBtn(mx, my, state.startButtons.author)) {
        window.open(AUTHOR_URL, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (state.gameState === 'howtoplay') {
      if (Screens.pointInBtn(mx, my, state.howToBackButton)) {
        state.gameState = 'start';
      }
      return;
    }

    if ((state.gameState !== 'gameover' && state.gameState !== 'victory') || !state.restartButton) return;
    if (Screens.pointInBtn(mx, my, state.continueButton)) {
      // Dismiss the victory screen and keep playing in the current world —
      // nothing resets, unlike Play Again. Not offered on the gameover
      // screen (state.continueButton is null there), since there's nothing
      // to resume from after the player has died.
      state.gameState = 'playing';
      state.continueButton = null;
      state.restartButton = null;
      return;
    }
    if (Screens.pointInBtn(mx, my, state.restartButton)) restartGame();
  });

  // Small debug hook (harmless in normal play) — lets you inspect live state
  // from the browser console with `__gameDebug.state`, or force a restart
  // with `__gameDebug.restartGame()`.
  window.__gameDebug = { state, restartGame };

  canvas.focus();
  loop();
})();