'use strict';
// A TT2-ben nem létező változatok 3D modellje: az alapfigura saját TT2-es modellje átszínezett textúrával,
// így ugyanolyan játékfigurák, mint a többiek (a háló és az animációk az alapfiguráé).
// map: [['#eredeti', '#új', tűrés?], ...] pontos színcserék, vagy { hue: [tól, ig], to: '#új' } árnyalatsáv.
(function (TT) {
  // az alapfigurák textúráinak fő színei
  const ROBIN = { red: '#fb0038', green: '#00c671', dkgreen: '#106041', midgreen: '#108f59', yellow: '#f3d514', cape: '#100c08', gold: '#d49237' };
  const RAVEN = { cloak: '#472678', cloak2: '#4d3ea2', cloak3: '#5d4eb2', suit: '#1c163c', gem: '#f31641', belt: '#d7c371' };
  const STAR = { suit: '#7938aa', suit2: '#7538aa', hair: '#b63820', hair2: '#924a20', skin: '#ff9b5d', skin2: '#eb7834', boots: '#9eafd8', eyes: '#59bb0c' };
  const BB = { skin: '#8ec942', suit: '#8490aa', suit2: '#8390aa', dark: '#545d6d', dark2: '#495469', stripe: '#db24aa', light: '#8e9cba' };
  // a TT2-ben nem szereplő gonoszokhoz hasonló testű TT2-es figura az alap
  const PENGUIN_SKIN = ['#ffe5ff', '#dbc3ff', '#f3d1f3', '#ffe4ff', '#fbbbff'];
  const U = TT.U;
  const skinTo = (from, to) => from.map((c, i) => [c, i ? U.mix(to, '#000000', 0.08 * i) : to, 24]);
  const CY = { metal: '#ebe5eb', metal2: '#cfcbcf', blue: '#61dced', blue2: '#34ddeb', grey: '#a6adba' };

  TT.SKINS3D = {
    robin_ninja: { base: 'robin', map: [[ROBIN.red, '#22222e'], [ROBIN.green, '#2a2a38'], [ROBIN.dkgreen, '#15151d'], [ROBIN.midgreen, '#1d1d28'], [ROBIN.yellow, '#d62828'], [ROBIN.gold, '#a01818']] },
    robin_rock: { base: 'robin', map: [[ROBIN.red, '#2b2b3a'], [ROBIN.green, '#3a3a52'], [ROBIN.dkgreen, '#22222e'], [ROBIN.midgreen, '#2c2c3e'], [ROBIN.yellow, '#ff4fa3'], [ROBIN.gold, '#c0c0c0']] },
    robin_ultra: { base: 'robin', map: [[ROBIN.red, '#ffc93c'], [ROBIN.green, '#e09b00'], [ROBIN.dkgreen, '#8a5a00'], [ROBIN.midgreen, '#b07400'], [ROBIN.yellow, '#fff1b8'], [ROBIN.cape, '#7a4c00']] },
    robin_pirate: { base: 'robin', map: [[ROBIN.red, '#f4f4f8'], [ROBIN.green, '#2a2a36'], [ROBIN.dkgreen, '#1a1a24'], [ROBIN.midgreen, '#22222e'], [ROBIN.yellow, '#d62828']] },
    robin_vamp: { base: 'robin', map: [[ROBIN.red, '#1d1d2b'], [ROBIN.green, '#2a0a14'], [ROBIN.dkgreen, '#1a0610'], [ROBIN.midgreen, '#220812'], [ROBIN.yellow, '#c1121f'], ['#f3a58e', '#e8e4f4']] },
    larry: { base: 'robin', map: [[ROBIN.red, '#00b86a'], [ROBIN.green, '#e8103c'], [ROBIN.dkgreen, '#8c0a26'], [ROBIN.midgreen, '#b80c30']] },
    raven_rage: { base: 'raven', map: [[RAVEN.cloak, '#8e1416'], [RAVEN.cloak2, '#a8181b'], [RAVEN.cloak3, '#c02024'], [RAVEN.suit, '#3a0d10']] },
    raven_white: { base: 'raven', map: [[RAVEN.cloak, '#e8e6f4'], [RAVEN.cloak2, '#f6f5ff'], [RAVEN.cloak3, '#ffffff'], [RAVEN.suit, '#c8c4e0']] },
    raven_azarath: { base: 'raven', map: [[RAVEN.cloak, '#e0a800'], [RAVEN.cloak2, '#ffc93c'], [RAVEN.cloak3, '#ffd966'], [RAVEN.suit, '#4b2e83']] },
    bb_cowboy: { base: 'beastboy', map: [[BB.suit, '#d9a066'], [BB.suit2, '#d9a066'], [BB.light, '#e8b884'], [BB.dark, '#3b5998', 14], [BB.dark2, '#2f4a80', 14], [BB.stripe, '#d62828']] },
    bb_reindeer: { base: 'beastboy', map: [[BB.suit, '#8b5a2b'], [BB.suit2, '#8b5a2b'], [BB.light, '#a06a36'], [BB.dark, '#5a3a1a', 14], [BB.dark2, '#4a2e14', 14], [BB.stripe, '#d62828']] },
    cyborg_mega: { base: 'cyborg', map: [[CY.metal, '#b8c2d0'], [CY.metal2, '#9aa6b6'], [CY.blue, '#ff4f4f'], [CY.blue2, '#ff2a2a']] },
    cyborg_3000: { base: 'cyborg', map: [[CY.metal, '#f8f9fc'], [CY.metal2, '#ffc93c'], [CY.grey, '#e8b020'], [CY.blue, '#9bffef'], [CY.blue2, '#6ff5e0']] },
    star_warrior: { base: 'starfire', map: [[STAR.suit, '#c8d0da'], [STAR.suit2, '#b0bac6'], [STAR.boots, '#7e8a9a']] },
    star_sleepy: { base: 'starfire', map: [[STAR.suit, '#ff9ecd'], [STAR.suit2, '#ff8cc4'], [STAR.boots, '#ffd6ec']] },
    star_chef: { base: 'starfire', map: [[STAR.suit, '#f4f4f8'], [STAR.suit2, '#e6e6ee'], [STAR.boots, '#7b2cbf']] },
    mumbo: { base: 'dc_penguin', map: [...skinTo(PENGUIN_SKIN, '#a8d8ff'), { hue: [240, 300], to: '#2c2c3c', minS: 0.15 }, { hue: [70, 110], to: '#d62828' }] },
    mrmint: { base: 'dc_penguin', map: [...skinTo(PENGUIN_SKIN, '#f6cba8'), { hue: [240, 300], to: '#2a9d8f', minS: 0.15 }, { hue: [70, 110], to: '#7fe0b5' }] },
    kitten: { base: 'jinx', map: [['#ff329a', '#f4d35e'], ['#382241', '#ff7fbf'], ['#5d3a6d', '#ffb0d8'], ['#492c55', '#f090c4'], ['#cfc9cf', '#f6cba8', 20], ['#8e858e', '#c48a6c', 20]] },
    controlfreak: { base: 'mr_chibi', map: [['#1c1624', '#e07a1f', 18], ['#2c2051', '#2a9d8f'], ['#1c1334', '#1f7068'], ['#756e82', '#264653'], ['#ffe549', '#9aa0a8'], ['#ffe34a', '#9aa0a8']] },
    cinderblock: { base: 'dc_bane', map: [{ hue: [10, 50], to: '#a4aab2', minS: 0.25 }, ['#201c28', '#5a5f68'], ['#c8443b', '#ffb300'], ['#005e92', '#6a707a'], ['#1c2c38', '#4a4f58'], ['#556c7d', '#7a808a'], ['#7991a2', '#8a909a'], ['#47ba1d', '#8a909a']] },
    plasmus: { base: 'dc_swamp', map: [{ hue: [30, 110], to: '#d066c0', minS: 0.25 }] },
    brain: { base: 'dc_lex', map: [{ hue: [90, 200], to: '#9aa2ac', minS: 0.15 }, { hue: [270, 335], to: '#5c6270', minS: 0.2 }, ['#f7dfdb', '#f4a6b8'], ['#f3cdc7', '#ec98ac'], ['#e7b5aa', '#d88098']] },
    rouge: { base: 'blackfire', map: [['#8f00c1', '#a01426'], ['#380e49', '#4a0812'], ['#aab5ff', '#2a2230'], ['#a3abdc', '#221a28'], ['#a6abd7', '#221a28'], ['#ffc9a6', '#f2e6e6'], ['#ebb896', '#dccccc']] },
    wykkyd: { base: 'dc_batman', map: [['#ba3e38', '#6a40a0'], ['#ff3230', '#ff4f4f'], ['#9d2121', '#4a2a7a']] },
    thunder: { base: 'wonder_twins', map: [{ hue: [235, 275], to: '#3f6fd8', minS: 0.22 }, ['#bea5c7', '#e8c8a8'], ['#bda4c6', '#e8c8a8'], ['#c1a8cb', '#ecccac']] },
    mad_mod: { base: 'clark_kent', map: [['#716140', '#1d3c8f'], ['#4d4230', '#142a66'], ['#594a45', '#1a3478'], ['#141620', '#e8743b', 14], ['#141624', '#e8743b', 14], ['#8e484d', '#d62828']] },
    shrinkwrap: { base: 'terra', map: [['#ffff6d', '#4fd6a8'], ['#ffffb0', '#9af0d0'], ['#ffc30c', '#2ab88a'], { hue: [300, 340], to: '#8fc7e0', minS: 0.4 }, ['#945a29', '#5aa0c0'], ['#ae7441', '#6ab4d4']] },
    mintguard: { base: 'blood_robot', map: [{ hue: [345, 15], to: '#3fd0a0', minS: 0.5 }, ['#ffcdb2', '#c8f5e0'], ['#ffdec1', '#d8fbe8']] },
    boxbot: { base: 'cyborg', map: [[CY.metal, '#c8a165'], [CY.metal2, '#a8844c'], [CY.grey, '#9a7840'], ['#ad6958', '#b89058'], [CY.blue, '#ff4f4f'], [CY.blue2, '#ff2a2a']] },
    blood_headmaster: { base: 'bloodbrother', map: [['#ff367d', '#e0a800'], ['#ff728e', '#ffc93c'], ['#eb2049', '#b88400'], ['#d360be', '#2a2a3a'], ['#793e7d', '#1d1d2b'], ['#493849', '#15151f']] },
    // városi szereplők (src/data/world.js NPC_LOOKS)
    kid_pete: { base: 'aqualad', map: [['#30bbfb', '#ff6b35'], ['#5092e5', '#ff8c55'], ['#286482', '#3b5998'], ['#144c65', '#2a4478']] },
    kid_ann: { base: 'terra', map: [['#ffff6d', '#ff7b1c'], ['#ffffb0', '#ffa45c'], ['#ffc30c', '#d05800'], { hue: [300, 340], to: '#7bd65b', minS: 0.4 }, ['#945a29', '#e0b030'], ['#ae7441', '#f4d35e']] },
    kid_zoe: { base: 'jinx', map: [['#ff329a', '#2a2a3a'], ['#f35c9e', '#3a3a4a', 12], ['#382241', '#6b2fa0'], ['#5d3a6d', '#8a4cc0'], ['#492c55', '#5a2590'], ['#cfc9cf', '#e8b890', 20], ['#8e858e', '#b0805c', 20]] },
    kid_geza: { base: 'mr_chibi', map: [['#1c1624', '#8b5a2b', 18], ['#2c2051', '#f4f4f8'], ['#1c1334', '#d8d8e0'], ['#756e82', '#5a5a66'], ['#ffe549', '#c8a165'], ['#ffe34a', '#c8a165']] },
    kid_max: { base: 'aqualad', map: [['#30bbfb', '#4fc3f7'], ['#286482', '#ff9ecd'], ['#144c65', '#e07ab0'], ['#5092e5', '#7fd8ff']] },
    kid_hive: { base: 'seemore', map: [['#1cbd69', '#5a4a3a'], ['#248f5d', '#46392c'], ['#347f7f', '#2a2a3a'], ['#348f8e', '#33334a'], ['#8ed545', '#ffd23f'], ['#4d7420', '#c8a020']] },
    kid_hive2: { base: 'speedy', map: [['#f9004f', '#2a2a3a'], ['#fb0038', '#2a2a3a'], ['#be0e49', '#1d1d2b'], ['#910d36', '#15151f'], ['#f3d314', '#ffd23f'], ['#df6e1c', '#e85d04'], ['#ff6000', '#e85d04']] },
    kid_docks: { base: 'aqualad_pirate', map: [['#30bbfb', '#1e3a5f'], ['#5092e5', '#2a4a78'], ['#286482', '#3a3a52'], ['#144c65', '#2a2a3a']] },
    kid_bela: { base: 'clark_kent', map: [['#716140', '#d62828'], ['#4d4230', '#a01c1c'], ['#594a45', '#b82020'], ['#8e484d', '#ffd23f']] },
    kid_granny: { base: 'maeye', map: [['#e71c55', '#9d4edd'], ['#e81c55', '#9d4edd'], ['#e61c55', '#9d4edd'], ['#ee2255', '#a85ae4'], ['#ff1630', '#7a30b8'], ['#f789a6', '#c9a0f0']] },
    kid_pizza: { base: 'santa_claus', map: [['#ae0e10', '#d8d8e0'], ['#df1c1c', '#f4f4f8'], ['#d70a2c', '#e8e8f0'], ['#f38392', '#ffc3aa', 30], ['#fb107d', '#d62828']] },
    kid_tourist: { base: 'george_w', map: [['#0058e3', '#ffd23f'], ['#30507d', '#e8b820'], ['#102851', '#c89810'], ['#dbbf1c', '#3b5998'], ['#b69b20', '#2a4478']] },
    mrmint_npc: { base: 'dc_penguin', map: [...skinTo(PENGUIN_SKIN, '#f6cba8'), { hue: [240, 300], to: '#2a9d8f', minS: 0.15 }, { hue: [70, 110], to: '#7fe0b5' }] },
    silkie_gold: { base: 'silkie', map: [{ hue: [300, 30], to: '#ffc21a', minS: 0.1 }, { hue: [90, 140], to: '#fff1a8', minS: 0.2 }] },
  };
})(window.TT);
