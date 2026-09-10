// sprites/sprites.js — the Sprites registry, populated once by initSprites().
// Builder functions live in humanoid-sprites.js / monster-sprites.js /
// icon-sprites.js; this file just calls them and stores the results so the
// rest of the game can do `Sprites.goblin`, `Sprites.icons.sword`, etc.

const Sprites = {};

function initSprites() {
  Sprites.player = buildHumanoidSheet(PAL_PLAYER, null);
  Sprites.playerSword = buildHumanoidSheet(PAL_PLAYER, drawSword);
  Sprites.elder = buildHumanoidSheet(PAL_ELDER, null);
  Sprites.merchant = buildHumanoidSheet(PAL_MERCH, null);
  Sprites.slimeGreen = buildSlimeSheet('#7bbf5e', '#4a8a35');
  Sprites.slimeBlue = buildSlimeSheet('#5e9ebf', '#356e8a');
  Sprites.slimeRed = buildSlimeSheet('#b93244', '#da2121');
  Sprites.sandScorpion = buildSandScorpionSheet();
  Sprites.slimeJungle = buildSlimeSheet('#6ec95e', '#2a8a3a');
  Sprites.goblin = buildGoblinSheet();
  Sprites.devil = buildDevilSheet();
  Sprites.orcWarlord = buildOrcSheet();
  Sprites.jungleWitch = buildWitchSheet();
  Sprites.spider = buildSpiderSheet();
  Sprites.skeleton = buildSkeletonSheet();
  Sprites.skeletonKing = buildSkeletonKingSheet();
  Sprites.devilLesser = buildDevilLesserSheet();
  Sprites.orcRaider = buildOrcRaiderSheet();
  Sprites.troll = buildTrollSheet();
  Sprites.trollChieftain = buildTrollChieftainSheet();
  Sprites.pitDevil = buildPitDevilSheet();
  Sprites.icons = {
    sword: buildSwordIcon(),
    armor: buildArmorIcon(),
    helmet: buildHelmetIcon(),
    swordLegendary: buildLegendarySwordIcon(),
    armorJungle: buildJungleArmorIcon(),
    boots: buildBootsIcon(),
    potionRed: buildPotionIcon('#c94040'),
    potionBlue: buildPotionIcon('#4070c9'),
    coin: buildCoinIcon(),
    key: buildKeyIcon(),
    shield: buildShieldIcon(),
    shieldBone: buildBoneShieldIcon(),
    crownSkeleton: buildSkeletonCrownIcon(),
    armorObsidian: buildObsidianArmorIcon(),
    swordMolten: buildMoltenSwordIcon(),
    bootsFireproof: buildFireproofBootsIcon(),
  };
}
