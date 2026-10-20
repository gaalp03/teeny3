'use strict';
// A gyűjthető Teeny figurák. A "look" mezők a procedurális rajzolót vezérlik
// (src/art/figure.js); saját textúrával felülírhatók (assets/custom).
(function (TT) {
  const SKIN = '#f6cba8';
  const LIST = [];
  function F(id, name, type, rarity, st, moves, sup, look, extra) {
    const f = Object.assign({
      id, name, type, rarity,
      hp: st[0], atk: st[1], def: st[2], spd: st[3],
      moves, sup, look,
      team: 'titans', bio: '',
    }, extra || {});
    LIST.push(f);
    return f;
  }

  // ---------- Titánok ----------
  F('robin', 'Robin', 'brawn', 'common', [100, 11, 10, 11],
    ['bo_staff', 'birdarang', 'flying_kick'], 'titans_go',
    {
      skin: SKIN, top: '#d62828', sleeves: '#2f9e44', gloves: '#2f9e44', bottom: '#2f9e44', boots: '#1d1d2b',
      belt: '#ffd23f', cape: '#1d1d2b', capeIn: '#ffd23f', hair: 'spiky', hairColor: '#1d1d2b',
      mask: '#1d1d2b', eyes: 'lens', mouth: 'grin', chest: { sym: 'R', color: '#ffd23f', ink: '#1d1d2b' },
    }, { bio: 'A Titánok vezére. Minden figurát ismer — és mindet akarja.' });

  F('raven', 'Raven', 'mystic', 'common', [95, 12, 9, 10],
    ['azarath', 'dark_shield', 'metrion'], 'demon_rage',
    {
      skin: '#cfc8ec', top: '#22224a', bottom: '#22224a', boots: '#22224a', gloves: '#cfc8ec', belt: '#e0b040',
      cloak: '#2d3a8c', hood: true, hair: 'bob', hairColor: '#5b3a9a', eyes: 'dot', eyeColor: '#4b2e83',
      mouth: 'flat', gear: ['gem'],
    }, { bio: 'Azarath Metrion Zinthos. Nem rajong a figurákért… titokban mégis.' });

  F('beastboy', 'Beast Boy', 'speed', 'common', [95, 10, 9, 13],
    ['cheetah', 'goat_butt', 'gorilla_slam'], 'trex',
    {
      skin: '#78d66a', top: '#2c1f4a', bottom: '#2c1f4a', boots: '#9aa5b1', gloves: '#9aa5b1', stripe: '#8e5cff',
      hair: 'messy', hairColor: '#2c7a2c', eyes: 'dot', mouth: 'fang', gear: ['ears_pointy'],
    }, { bio: 'Bármilyen állattá változik. Kedvenc figurája: saját maga.' });

  F('cyborg', 'Cyborg', 'tech', 'common', [115, 10, 12, 8],
    ['booyah_punch', 'sonic_cannon', 'cyber_repair'], 'mega_cannon',
    {
      skin: '#7a4a2b', top: '#dfe3ea', bottom: '#dfe3ea', boots: '#9aa5b1', gloves: '#9aa5b1', metal: true,
      hair: 'bald', eyes: 'cyborg', mouth: 'grin', gear: ['halfmetal'], chest: { lights: '#3fa7ff' },
    }, { bio: 'BOOYAH! Félig ember, félig gép, teljesen figura-mániás.' });

  F('starfire', 'Starfire', 'speed', 'common', [100, 11, 9, 12],
    ['starbolt', 'eye_beams', 'tamaran_punch'], 'star_storm',
    {
      skin: '#f0a04b', top: '#7b2cbf', bottom: '#7b2cbf', boots: '#7b2cbf', gloves: '#9aa5b1',
      hair: 'long', hairColor: '#d1153a', eyes: 'big', eyeColor: '#2ecc71', mouth: 'smile', gear: ['collar_gem'], skirt: true,
    }, { bio: 'Tamaran hercegnője. Szerinte minden figura „csodálatosan dicsőséges”.' });

  // ---------- Változatok ----------
  F('robin_ninja', 'Nindzsa Robin', 'speed', 'rare', [95, 12, 9, 14],
    ['shuriken', 'smoke_bomb', 'shadow_cut'], 'thousand_blades',
    {
      skin: SKIN, top: '#1d1d2b', sleeves: '#1d1d2b', gloves: '#1d1d2b', bottom: '#1d1d2b', boots: '#1d1d2b', belt: '#d62828',
      hair: 'spiky', hairColor: '#1d1d2b', mask: '#1d1d2b', eyes: 'lens', mouth: 'flat', gear: ['headband'], bandColor: '#d62828',
      chest: { sym: 'R', color: '#d62828', ink: '#1d1d2b' },
    }, { short: 'N. Robin', bio: 'Csendben üt. Utána nagyon hangosan dicsekszik vele.' });

  F('robin_rock', 'Rocker Robin', 'mystic', 'rare', [100, 12, 9, 11],
    ['riff', 'power_chord', 'stage_dive'], 'night_shine',
    {
      skin: SKIN, top: '#2b2b3a', sleeves: '#2b2b3a', gloves: '#1d1d2b', bottom: '#3a3a52', boots: '#1d1d2b', belt: '#c0c0c0',
      hair: 'spiky', hairColor: '#1d1d2b', mask: '#1d1d2b', eyes: 'lens', mouth: 'open', gear: ['guitar'], accent: '#ff4fa3',
      chest: { sym: 'R', color: '#ff4fa3', ink: '#1d1d2b' },
    }, { short: 'R. Robin', bio: 'Az éjszaka elkezd ragyogni, amikor ő pengeti a gitárt.' });

  F('robin_ultra', 'Ultra Robin', 'brawn', 'legendary', [110, 13, 12, 12],
    ['ultra_staff', 'golden_rang', 'ultra_kick'], 'golden_leader',
    {
      skin: SKIN, top: '#ffc93c', sleeves: '#e09b00', gloves: '#e09b00', bottom: '#e09b00', boots: '#8a5a00',
      belt: '#fff1b8', cape: '#8a5a00', capeIn: '#fff1b8', hair: 'spiky', hairColor: '#5a3a00',
      mask: '#5a3a00', eyes: 'lens', mouth: 'grin', chest: { sym: 'R', color: '#fff1b8', ink: '#8a5a00' }, gold: true,
    }, { short: 'U. Robin', bio: 'Színarany, limitált kiadás. A legendák szerint csak egy létezik.' });

  F('raven_rage', 'Dühös Raven', 'mystic', 'epic', [105, 14, 10, 10],
    ['rage_bolt', 'four_eyes', 'rage_wave'], 'trigon_daughter',
    {
      skin: '#c2b2d6', top: '#3a0d10', bottom: '#3a0d10', boots: '#3a0d10', gloves: '#c2b2d6', belt: '#e0b040',
      cloak: '#8e1416', hood: true, hair: 'bob', hairColor: '#3a0d10', eyes: 'four', eyeColor: '#ff2a2a', mouth: 'frown', gear: ['gem'],
    }, { short: 'D. Raven', bio: 'Ne idegesítsd fel. Komolyan. Négy szemmel néz rád.' });

  F('raven_white', 'Fehér Raven', 'mystic', 'rare', [100, 10, 11, 10],
    ['light_bolt', 'healing_light', 'purify'], 'white_wings',
    {
      skin: '#ece8f8', top: '#d8d4ee', bottom: '#d8d4ee', boots: '#d8d4ee', gloves: '#ece8f8', belt: '#e0b040',
      cloak: '#fbfbff', hood: true, hair: 'bob', hairColor: '#a5a0c8', eyes: 'dot', eyeColor: '#3f6fd8', mouth: 'smile', gear: ['gem'],
    }, { short: 'F. Raven', bio: 'Raven fényes oldala. Gyógyít, és ritkán sóhajt.' });

  F('bb_gorilla', 'Gorilla Beast Boy', 'brawn', 'rare', [125, 12, 12, 7],
    ['chest_pound', 'banana', 'gorilla_smash'], 'king_smash',
    {
      body: 'big', skin: '#5cb85c', top: '#3f7a35', bottom: '#3f7a35', boots: '#2f5a28', gloves: '#2f5a28',
      hair: 'messy', hairColor: '#2c6a2c', eyes: 'dot', mouth: 'fang', gear: ['ears_pointy'], fur: true, scale: 1.12,
    }, { short: 'G. Beast Boy', bio: 'Banánt kér. Most. Azonnal.' });

  F('bb_cowboy', 'Cowboy Beast Boy', 'speed', 'rare', [95, 11, 9, 13],
    ['lasso', 'horse_kick', 'stampede'], 'wild_west',
    {
      skin: '#78d66a', top: '#d9a066', sleeves: '#f0e0c0', gloves: '#8b5a2b', bottom: '#3b5998', boots: '#6b3f1d', belt: '#6b3f1d',
      hair: 'messy', hairColor: '#2c7a2c', eyes: 'dot', mouth: 'fang', gear: ['ears_pointy', 'cowboy_hat', 'bandana'], hatColor: '#8b5a2b', bandColor: '#d62828',
    }, { short: 'C. Beast Boy', bio: 'Jíí-háá! A vadnyugat leggyorsabb zöld cowboya.' });

  F('cyborg_mega', 'Mega Cyborg', 'tech', 'epic', [135, 13, 14, 7],
    ['rocket_fist', 'missile_rain', 'mega_beam'], 'booyah_bomb',
    {
      body: 'big', skin: '#7a4a2b', top: '#b8c2d0', bottom: '#8d99a6', boots: '#5a6470', gloves: '#5a6470', metal: true,
      hair: 'bald', eyes: 'cyborg', mouth: 'grin', gear: ['halfmetal', 'cannon'], chest: { lights: '#ff4f4f' }, scale: 1.12,
    }, { short: 'M. Cyborg', bio: 'Több fém, több ágyú, több BOOYAH.' });

  F('cyborg_3000', 'Cyborg 3000', 'tech', 'legendary', [130, 14, 13, 10],
    ['plasma', 'nano_repair', 'laser_grid'], 'time_cannon',
    {
      skin: '#7a4a2b', top: '#f4f6fa', bottom: '#f4f6fa', boots: '#ffc93c', gloves: '#ffc93c', metal: true, trim: '#ffc93c',
      hair: 'bald', eyes: 'visor', eyeColor: '#9bffef', mouth: 'grin', gear: ['halfmetal'], chest: { lights: '#9bffef' },
    }, { short: 'Cyborg 3K', bio: 'A jövőből jött vissza, hogy megszerezze ezt a figurát. Saját magát.' });

  F('star_warrior', 'Harcos Starfire', 'brawn', 'epic', [115, 14, 12, 10],
    ['war_punch', 'star_shield', 'star_nova'], 'tamaran_warrior',
    {
      skin: '#f0a04b', top: '#9aa5b1', bottom: '#5a2a8a', boots: '#9aa5b1', gloves: '#9aa5b1', armor: '#c8d0da',
      hair: 'long', hairColor: '#d1153a', eyes: 'big', eyeColor: '#2ecc71', mouth: 'grin', gear: ['tiara', 'collar_gem'], skirt: true,
    }, { short: 'H. Starfire', bio: 'Tamaran harcosa teljes páncélban. Dicsőséges!' });

  F('star_sleepy', 'Álmos Starfire', 'mystic', 'rare', [100, 10, 11, 9],
    ['pillow', 'lullaby', 'dream_beam'], 'starry_dream',
    {
      skin: '#f0a04b', top: '#ff9ecd', sleeves: '#ff9ecd', bottom: '#ff9ecd', boots: '#ffd6ec', gloves: '#f0a04b', dots: '#ffffff',
      hair: 'long', hairColor: '#d1153a', eyes: 'sleepy', mouth: 'smile', gear: ['nightcap', 'pillow'], hatColor: '#ff9ecd',
    }, { short: 'Á. Starfire', bio: 'Pizsamaparti-kiadás. Néha harc közben is elalszik.' });

  // ---------- Retró sorozat (a 80-as évek Titánjai) ----------
  const retro = (id, extra) => Object.assign({}, LIST.find((f) => f.id === id).look, extra);
  F('robin_80s', 'Retró Robin', 'speed', 'epic', [100, 12, 10, 13],
    ['bo_staff', 'birdarang', 'flying_kick'], 'titans_go',
    retro('robin', {
      sleeves: SKIN, bottom: '#2f9e44', boots: '#2f9e44', cape: '#ffd23f', capeIn: '#e8b80f', hair: 'flat', mouth: 'smile',
    }), { short: 'Retró Robin', bio: 'Egyenesen a 80-as évekből: rövid nadrág, sárga köpeny, örök optimizmus.' });

  F('raven_80s', 'Retró Raven', 'mystic', 'epic', [95, 13, 9, 11],
    ['azarath', 'dark_shield', 'metrion'], 'demon_rage',
    retro('raven', { hood: false, hair: 'bob', hairColor: '#1d1d2b', boots: '#e8e8f0', mouth: 'smile', gear: ['gem'] }),
    { short: 'Retró Raven', bio: 'Csillag fülbevaló, kapucni nélkül. A 80-as években még mosolygott is.' });

  F('star_80s', 'Retró Starfire', 'speed', 'epic', [100, 12, 9, 13],
    ['starbolt', 'eye_beams', 'tamaran_punch'], 'star_storm',
    retro('starfire', { hairColor: '#ff2e86', top: '#8e44ad', bottom: '#8e44ad', boots: '#8e44ad', mouth: 'grin' }),
    { short: 'Retró Starfire', bio: 'Hatalmas, dauerolt haj és végtelen lelkesedés. Minden dicsőséges!' });

  F('bb_80s', 'Retró Beast Boy', 'brawn', 'epic', [100, 12, 10, 12],
    ['cheetah', 'goat_butt', 'gorilla_slam'], 'trex',
    retro('beastboy', { top: '#f4f4f8', bottom: '#d62828', stripe: '#d62828', boots: '#f4f4f8', gloves: '#f4f4f8', hairColor: '#3b6b2b', mouth: 'grin' }),
    { short: 'Retró Beast Boy', bio: 'Piros-fehér egyenruha a 80-as évekből. A vicceit ugyanúgy senki sem érti.' });

  F('cyborg_80s', 'Retró Cyborg', 'tech', 'epic', [118, 11, 13, 8],
    ['booyah_punch', 'sonic_cannon', 'cyber_repair'], 'mega_cannon',
    retro('cyborg', { top: '#f4f4f8', bottom: '#f4f4f8', boots: '#c9ced8', gloves: '#c9ced8', hair: 'flat', hairColor: '#1d1d2b' }),
    { short: 'Retró Cyborg', bio: 'Csillogó fehér páncél, régi iskola. BOOYAH — 80-as kiadásban.' });

  // ---------- Radikális sorozat (punk Titánok, legendás) ----------
  F('robin_rad', 'Radikális Robin', 'speed', 'legendary', [105, 14, 11, 14],
    ['rad_birdarangs', 'staff_jump', 'flying_kick'], 'eagle_strike',
    retro('robin', { top: '#1d1d2b', sleeves: '#1d1d2b', bottom: '#d62828', cape: '#ff6b35', capeIn: '#1d1d2b', hairColor: '#4a2a6b', mouth: 'smirk' }),
    { short: 'Rad. Robin', bio: 'Taraj, bőrdzseki, dühös gitárriff. A vezér punk korszaka.' });

  F('raven_rad', 'Radikális Raven', 'mystic', 'legendary', [100, 15, 10, 12],
    ['dark_crystals', 'chain_root', 'dark_shield'], 'minion_swarm',
    retro('raven', { top: '#6b2fa0', bottom: '#ff4fd8', boots: '#ff4fd8', mouth: 'frown' }),
    { short: 'Rad. Raven', bio: 'Koponyás kapucni, láncok és démoni csatlósok. Ne kérdezd, milyen zenét hallgat.' });

  F('star_rad', 'Radikális Starfire', 'speed', 'legendary', [105, 14, 10, 14],
    ['multi_blast', 'starbolt', 'healing_guitar'], 'radical_nova',
    retro('starfire', { hairColor: '#ff2e86', top: '#ff9ecd', bottom: '#ff9ecd', boots: '#ff4fd8', mouth: 'grin' }),
    { short: 'Rad. Starfire', bio: 'Rózsaszín sörény és gitárszóló, ami gyógyít. Ez dicsőségesen radikális!' });

  F('bb_rad', 'Radikális Beast Boy', 'brawn', 'legendary', [110, 14, 11, 12],
    ['rad_claws', 'ice_guitar', 'goat_butt'], 'rad_eagle',
    retro('beastboy', { top: '#1d1d2b', bottom: '#1d1d2b', stripe: '#ff2e86', boots: '#1d1d2b', gloves: '#ff2e86', mouth: 'smirk' }),
    { short: 'Rad. Beast Boy', bio: 'Punk karmok, jeges gitár és egy rocksas. A zenekar dobosa akart lenni.' });

  F('cyborg_rad', 'Radikális Cyborg', 'tech', 'legendary', [130, 13, 14, 9],
    ['electric_sword', 'battery_drain', 'rad_shield'], 'overcharge',
    retro('cyborg', { top: '#f4f4f8', bottom: '#ff9ecd', boots: '#c9ced8', gloves: '#ff4fd8', hair: 'flat', hairColor: '#ff4fd8' }),
    { short: 'Rad. Cyborg', bio: 'Neon páncél és villámkard. BOOYAH, punk kiadásban!' });

  // ---------- Titánok Kelet és barátok ----------
  F('aqualad', 'Aqualad', 'mystic', 'rare', [105, 11, 11, 11],
    ['water_whip', 'tidal', 'fish_swarm'], 'atlantis_wave',
    {
      skin: '#e2b088', top: '#0b3d6b', bottom: '#4fc3f7', boots: '#0b3d6b', gloves: '#4fc3f7', belt: '#ffd23f',
      hair: 'swoop', hairColor: '#111', eyes: 'dot', mouth: 'smirk', fins: '#4fc3f7',
    }, { team: 'east', bio: 'A tenger fia. Szerinte a víz alatti figurák a legmenőbbek.' });

  F('speedy', 'Speedy', 'speed', 'rare', [95, 12, 9, 13],
    ['quick_arrow', 'fire_arrow', 'arrow_storm'], 'arrow_rain',
    {
      skin: SKIN, top: '#d62828', sleeves: '#ffd23f', gloves: '#ffd23f', bottom: '#d62828', boots: '#ffd23f', belt: '#ffd23f',
      hair: 'messy', hairColor: '#e85d04', mask: '#1d1d2b', eyes: 'lens', mouth: 'smirk', gear: ['quiver'],
    }, { team: 'east', bio: 'Soha nem hibáz. Kivéve, amikor igen.' });

  F('bumblebee', 'Bumblebee', 'speed', 'rare', [90, 12, 9, 14],
    ['sting', 'mini_size', 'buzz_blast'], 'bee_swarm',
    {
      skin: '#8d5524', top: '#ffd23f', bottom: '#1d1d2b', boots: '#1d1d2b', gloves: '#1d1d2b', stripes: '#1d1d2b',
      hair: 'puffs', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'smile', gear: ['wings_bee'],
    }, { team: 'east', bio: 'Pici, de csíp. A Titánok Kelet főnöke.' });

  F('masymenos', 'Más y Menos', 'speed', 'epic', [95, 12, 9, 16],
    ['touch', 'tornado', 'double_dash'], 'mas_menos',
    { body: 'twins', skin: '#d8a77a', top: '#d62828', top2: '#2f6fd8', bottom: '#ffffff', boots: '#ffffff', gloves: '#ffffff', hair: 'short', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'grin' },
    { team: 'east', short: 'Más/Menos', bio: '¡Más y Menos! Csak együtt szupergyorsak.' });

  F('kidflash', 'Kid Flash', 'speed', 'epic', [100, 12, 10, 16],
    ['quick_jab', 'speed_force', 'lightning_dash'], 'supersonic',
    {
      skin: SKIN, top: '#ffd23f', sleeves: '#ffd23f', gloves: '#d62828', bottom: '#ffd23f', boots: '#d62828', belt: '#d62828',
      hair: 'messy', hairColor: '#e85d04', eyes: 'goggle', eyeColor: '#d62828', mouth: 'grin', gear: ['flash_cowl'],
      chest: { bolt: '#d62828' },
    }, { team: 'east', bio: 'Gyorsabb, mint ahogy kibontasz egy dobozt.' });

  F('terra', 'Terra', 'brawn', 'epic', [115, 13, 13, 9],
    ['rock_toss', 'rock_wall', 'earthquake'], 'landslide',
    {
      skin: SKIN, top: '#1d1d2b', bottom: '#8b5a2b', boots: '#6b3f1d', gloves: '#8b5a2b', belt: '#6b3f1d',
      hair: 'long', hairColor: '#f4d35e', eyes: 'big', eyeColor: '#3f6fd8', mouth: 'smile', gear: ['goggles_up'],
    }, { team: 'east', bio: 'Megmozgatja a földet. És a figurapolcot is.' });

  // ---------- Gonoszok ----------
  F('gizmo', 'Gizmo', 'tech', 'common', [85, 10, 9, 11],
    ['spider_legs', 'gadget_bomb', 'mega_laser'], 'gadget_armada',
    {
      skin: SKIN, top: '#4a5a4a', bottom: '#4a5a4a', boots: '#2a3a2a', gloves: '#2a3a2a', belt: '#ffd23f',
      hair: 'bald', eyes: 'goggle', eyeColor: '#7bff6b', mouth: 'grin', gear: ['spider_legs'], scale: 0.9,
    }, { team: 'hive', bio: 'H.I.V.E. zseni. Szerinte a figurák csak „ócska műanyagok”.' });

  F('mammoth', 'Mammoth', 'brawn', 'common', [130, 12, 11, 7],
    ['mammoth_punch', 'mammoth_charge', 'ground_pound'], 'avalanche',
    {
      body: 'big', skin: SKIN, top: '#5a4a3a', bottom: '#3a3a52', boots: '#2a2a3a', gloves: SKIN, belt: '#ffd23f',
      hair: 'messy', hairColor: '#e85d04', eyes: 'angry', mouth: 'frown', scale: 1.16,
    }, { team: 'hive', bio: 'Nagy. Erős. Éhes. Ebben a sorrendben.' });

  F('seemore', 'See-More', 'tech', 'common', [100, 10, 11, 10],
    ['eye_ray', 'eye_bubble', 'xray'], 'giant_eye',
    {
      skin: SKIN, top: '#5f4b8b', bottom: '#3a2a5a', boots: '#2a1a3a', gloves: '#2a1a3a', belt: '#ffd23f',
      hair: 'bald', eyes: 'none', mouth: 'grin', gear: ['seemore'],
    }, { team: 'hive', bio: 'Egy szeme van, de mindent lát. Főleg a ritka figurákat.' });

  F('jinx', 'Jinx', 'mystic', 'rare', [95, 12, 9, 12],
    ['hex_bolt', 'bad_luck', 'hex_wave'], 'jinx_storm',
    {
      skin: '#dcd8f0', top: '#1d1d2b', bottom: '#6b2fa0', boots: '#1d1d2b', gloves: '#dcd8f0', stripes: '#6b2fa0',
      hair: 'jinx', hairColor: '#ff4fa3', eyes: 'cat', eyeColor: '#ff4fa3', mouth: 'smirk', skirt: true,
    }, { team: 'hive', bio: 'Balszerencsét hoz — leginkább neked.' });

  F('billy', 'Billy Numerous', 'speed', 'rare', [95, 10, 9, 13],
    ['clone_punch', 'clone_pile', 'billy_army'], 'million_billy',
    {
      skin: SKIN, top: '#d62828', bottom: '#d62828', boots: '#1d1d2b', gloves: '#1d1d2b', belt: '#1d1d2b',
      hair: 'bald', eyes: 'dot', mouth: 'grin', gear: ['cowl'], cowlColor: '#d62828', chest: { sym: 'B', color: '#ffffff', ink: '#d62828' },
    }, { team: 'hive', bio: 'Egy Billy jó. Száz Billy? Na az már sok.' });

  F('controlfreak', 'Control Freak', 'tech', 'rare', [95, 11, 10, 10],
    ['remote_zap', 'rewind', 'channel_surf'], 'superfan',
    {
      body: 'big', skin: SKIN, top: '#2a9d8f', bottom: '#264653', boots: '#1d1d2b', gloves: SKIN,
      hair: 'mullet', hairColor: '#e07a1f', eyes: 'dot', mouth: 'grin', gear: ['remote'], scale: 1.04,
    }, { team: 'villain', short: 'C. Freak', bio: 'Szuperrajongó. Minden figurája bontatlan… majdnem.' });

  F('mumbo', 'Mumbo Jumbo', 'mystic', 'rare', [95, 12, 9, 10],
    ['wand_zap', 'rabbit', 'card_storm'], 'mumbo_jumbo',
    {
      skin: '#9fd0ff', top: '#1d1d2b', bottom: '#1d1d2b', boots: '#1d1d2b', gloves: '#ffffff', cape: '#1d1d2b', capeIn: '#d62828',
      hair: 'bald', eyes: 'dot', mouth: 'grin', gear: ['top_hat', 'mustache', 'wand'], hatColor: '#1d1d2b', shirt: '#ffffff',
    }, { team: 'villain', short: 'Mumbo', bio: 'Mumbo Jumbo! És a figurád eltűnt.' });

  F('drlight', 'Dr. Light', 'tech', 'rare', [100, 12, 10, 10],
    ['flash', 'light_beam', 'solar_flare'], 'light_burst',
    {
      skin: SKIN, top: '#1d1d2b', bottom: '#1d1d2b', boots: '#1d1d2b', gloves: '#ffffff', belt: '#ffffff',
      hair: 'bald', eyes: 'goggle', eyeColor: '#fff6a0', mouth: 'smirk', gear: ['light_hood'], chest: { light: '#fff6a0' },
    }, { team: 'villain', bio: 'Fény ellen nincs védelem. Na jó, napszemüveg.' });

  F('kitten', 'Kitten', 'speed', 'rare', [85, 11, 8, 14],
    ['scratch', 'tantrum', 'moth_rush'], 'princess_tantrum',
    {
      skin: SKIN, top: '#ff9ecd', bottom: '#ff9ecd', boots: '#ff4fa3', gloves: SKIN,
      hair: 'long', hairColor: '#f4d35e', eyes: 'big', eyeColor: '#3f6fd8', mouth: 'smirk', gear: ['bow'], bowColor: '#ff4fa3', skirt: true,
    }, { team: 'villain', bio: 'Killer Moth lánya. A hisztije legendás.' });

  F('silkie', 'Silkie', 'brawn', 'rare', [120, 9, 12, 9],
    ['nibble', 'cute_look', 'silk_spit'], 'giant_silkie',
    { body: 'worm', skin: '#f2e8ff', spots: '#b9a3ff', eyes: 'big', eyeColor: '#1d1d2b', mouth: 'smile' },
    { team: 'titans', bio: 'Starfire kis kedvence. Lehetetlen nem szeretni.' });

  F('silkie_rad', 'Radikális Silkie', 'brawn', 'legendary', [125, 12, 13, 10],
    ['beatbox', 'rad_burp', 'nibble'], 'beatbox_bomb',
    Object.assign({}, LIST.find((f) => f.id === 'silkie').look, { skin: '#d8f7f0', spots: '#5fe0c8' }),
    { short: 'Rad. Silkie', bio: 'Robotpáncél, szárnyak és beatbox. A legradikálisabb kukac Jump Cityben.' });

  F('cinderblock', 'Cinderblock', 'brawn', 'epic', [150, 13, 15, 6],
    ['slab_punch', 'brick_rain', 'rubble'], 'concrete_crush',
    { body: 'rock', skin: '#9aa0a8', eyes: 'glow', eyeColor: '#ffb300', mouth: 'none', scale: 1.15 },
    { team: 'villain', bio: '…GRRR. (Ennyit mond. Mindig.)' });

  F('plasmus', 'Plasmus', 'brawn', 'epic', [140, 13, 12, 7],
    ['goo', 'absorb', 'sludge'], 'goo_sea',
    { body: 'blob', skin: '#c45ab3', eyes: 'glow', eyeColor: '#ffe066', mouth: 'open', scale: 1.1 },
    { team: 'villain', bio: 'Ragacsos. Nagyon. Mosd meg a kezed utána.' });

  F('bloodbrother', 'Brother Blood', 'mystic', 'epic', [115, 14, 11, 10],
    ['blood_bolt', 'mind_control', 'chant'], 'hive_judgement',
    {
      skin: SKIN, top: '#6a0f14', bottom: '#2a0a0e', boots: '#1d1d2b', gloves: '#6a0f14', cape: '#3a0a5a', capeIn: '#6a0f14', belt: '#c0c0c0',
      hair: 'flat', hairColor: '#1d1d2b', eyes: 'glow', eyeColor: '#ff2a2a', mouth: 'smirk', gear: ['collar'],
    }, { team: 'hive', short: 'B. Blood', bio: 'A H.I.V.E. Akadémia igazgatója. Mindenkit irányítani akar.' });

  F('slade', 'Slade', 'brawn', 'legendary', [120, 15, 13, 12],
    ['staff_strike', 'smoke_grenade', 'master_combo'], 'true_evil',
    {
      skin: '#1d1d2b', top: '#24242e', sleeves: '#3a3a46', bottom: '#24242e', boots: '#3a3a46', gloves: '#c97b30', belt: '#5a5a66', armor: '#3a3a46',
      hair: 'bald', eyes: 'none', mouth: 'none', gear: ['slade_mask', 'staff'],
    }, { team: 'villain', bio: 'Mindig egy lépéssel előrébb jár. Most épp a figurapolcod felé.', noBox: true });

  F('trigon', 'Trigon', 'mystic', 'legendary', [150, 15, 13, 8],
    ['fire_eyes', 'demon_hand', 'hellfire'], 'four_eyes_wrath',
    {
      body: 'demon', skin: '#c1121f', top: '#2b2d42', bottom: '#2b2d42', boots: '#1d1d2b', gloves: '#c1121f',
      hair: 'bald', eyes: 'four', eyeColor: '#ffd23f', mouth: 'fang', gear: ['horns'], scale: 1.22,
    }, { team: 'villain', bio: 'A legnagyobb, legpirosabb, legmérgesebb apuka.', noBox: true });

  F('maeye', 'Mother Mae-Eye', 'mystic', 'epic', [110, 12, 12, 9],
    ['pie', 'hypnosis', 'wooden_spoon'], 'mothers_love',
    {
      skin: SKIN, top: '#9d4edd', bottom: '#9d4edd', boots: '#1d1d2b', gloves: SKIN, apron: '#ffffff',
      hair: 'bun', hairColor: '#b0b0b8', eyes: 'big', eyeColor: '#9d4edd', mouth: 'smile', skirt: true,
    }, { team: 'villain', short: 'Mae-Eye', bio: 'Pitét süt. Elvarázsolt pitét. Ne edd meg.' });

  F('blackfire', 'Blackfire', 'mystic', 'epic', [105, 14, 10, 12],
    ['dark_star', 'jealousy', 'black_nova'], 'queen_tamaran',
    {
      skin: '#e8954a', top: '#1d1d2b', bottom: '#1d1d2b', boots: '#1d1d2b', gloves: '#9aa5b1', stripe: '#8e3fd6',
      hair: 'long', hairColor: '#2b1b3a', eyes: 'big', eyeColor: '#c06bff', mouth: 'smirk', gear: ['collar_gem'],
    }, { team: 'villain', bio: 'Starfire nővére. Mindig azt akarja, ami a húgáé.' });

  F('silkie_gold', 'Arany Silkie', 'brawn', 'legendary', [120, 11, 13, 10],
    ['golden_nibble', 'cute_look', 'golden_cocoon'], 'golden_giant',
    { body: 'worm', skin: '#ffd23f', spots: '#ff9f1a', eyes: 'big', eyeColor: '#1d1d2b', mouth: 'smile', gold: true },
    { team: 'titans', short: 'A. Silkie', bio: 'Silkie hálája jeléül. Csillog, puha, és meglepően erős.', noBox: true });

  // ---------- Gonosz Testvériség és új változatok ----------
  F('red_x', 'Red X', 'speed', 'legendary', [105, 14, 11, 14],
    ['x_shuriken', 'teleport_strike', 'x_trap'], 'red_x_plosion',
    {
      skin: '#1d1d2b', top: '#1d1d2b', sleeves: '#1d1d2b', bottom: '#1d1d2b', boots: '#2a2a36', gloves: '#2a2a36', belt: '#2a2a36',
      cape: '#1d1d2b', capeIn: '#d62828', hair: 'bald', eyes: 'none', mouth: 'none', gear: ['redx_mask'],
      chest: { sym: 'X', color: '#d62828', ink: '#1d1d2b' },
    }, { team: 'villain', bio: 'Rejtélyes tolvaj. Senki sem tudja, ki van a maszk alatt. (Robin tudja.)', noBox: true });

  F('brain', 'Brain', 'tech', 'epic', [110, 13, 13, 8],
    ['brain_wave', 'mind_blast', 'robot_slam'], 'genius_plan',
    { body: 'jar', skin: '#6c757d', eyes: 'none', mouth: 'none' },
    { team: 'brotherhood', bio: 'A Gonosz Testvériség vezére. Zseni. Üvegben.', noBox: true });

  F('mallah', 'Monsieur Mallah', 'brawn', 'rare', [125, 12, 12, 8],
    ['gorilla_punch', 'beret_toss', 'jungle_rage'], 'french_fury',
    {
      body: 'big', skin: '#5a4a3a', top: '#3a2e24', bottom: '#3a2e24', boots: '#2a2018', gloves: '#5a4a3a', fur: true,
      hair: 'short', hairColor: '#2a2018', eyes: 'angry', mouth: 'frown', gear: ['beret'], hatColor: '#d62828', scale: 1.12,
      chest: { sym: 'M', color: '#d62828', ink: '#ffffff' },
    }, { team: 'brotherhood', short: 'Mallah', bio: 'Francia gorilla, Brain hűséges társa. Oui, oui!' });

  F('rouge', 'Madame Rouge', 'mystic', 'epic', [100, 14, 10, 12],
    ['stretch_whip', 'shape_shift', 'elastic_slam'], 'rubber_chaos',
    {
      skin: '#f2e6e6', top: '#8a1020', bottom: '#5a0a14', boots: '#1d1d2b', gloves: '#8a1020', skirt: true,
      hair: 'bob', hairColor: '#1d1d2b', hairStreak: '#f4f4f8', eyes: 'cat', eyeColor: '#3a2a5a', mouth: 'lips',
    }, { team: 'brotherhood', short: 'M. Rouge', bio: 'Bármilyen alakot felvesz. Kivéve a vesztesét.' });

  F('wykkyd', 'Kyd Wykkyd', 'mystic', 'rare', [95, 12, 9, 13],
    ['shadow_hop', 'dark_cape', 'nightmare'], 'shadow_trap',
    {
      skin: '#f4f4f8', top: '#1d1d2b', bottom: '#1d1d2b', boots: '#1d1d2b', gloves: '#1d1d2b', cape: '#1d1d2b', capeIn: '#5a3a8a',
      hair: 'bald', eyes: 'glow', eyeColor: '#ff4f4f', mouth: 'none', gear: ['cowl', 'ears_bat'], cowlColor: '#1d1d2b',
    }, { team: 'hive', short: 'Wykkyd', bio: 'Soha egy szót sem szólt. Hátborzongató.' });

  F('thunder', 'Thunder & Lightning', 'speed', 'epic', [100, 13, 10, 14],
    ['lightning_bolt', 'thunder_clap', 'storm_front'], 'sky_rumble',
    { body: 'twins', skin: '#e8c8a8', top: '#3f6fd8', top2: '#ffd23f', bottom: '#f4f4f8', boots: '#1d1d2b', gloves: '#f4f4f8', hair: 'messy', hairColor: '#f4f4f8', eyes: 'dot', mouth: 'grin', twinSym: 'T' },
    { team: 'villain', short: 'Thunder&L.', bio: 'Két testvér, egy vihar. Mindig együtt dörögnek.' });

  F('star_chef', 'Szakács Starfire', 'mystic', 'rare', [100, 11, 10, 11],
    ['hot_pudding', 'taste_test', 'pudding_wave'], 'tamaran_feast',
    {
      skin: '#f0a04b', top: '#f4f4f8', sleeves: '#f4f4f8', bottom: '#7b2cbf', boots: '#7b2cbf', gloves: '#f0a04b', apron: '#ffffff',
      hair: 'long', hairColor: '#d1153a', eyes: 'big', eyeColor: '#2ecc71', mouth: 'grin', gear: ['chef_hat'], skirt: true,
    }, { short: 'Sz. Starfire', bio: 'Tamarani puding receptje titkos. Talán jobb is így.' });

  F('robin_pirate', 'Kalóz Robin', 'brawn', 'rare', [105, 12, 10, 11],
    ['cutlass', 'cannonball', 'plank_kick'], 'boarding',
    {
      skin: SKIN, top: '#f4f4f8', sleeves: '#f4f4f8', gloves: '#2f9e44', bottom: '#2a2a36', boots: '#1d1d2b', belt: '#d62828', stripes: '#d62828',
      hair: 'spiky', hairColor: '#1d1d2b', mask: '#1d1d2b', eyes: 'lens', mouth: 'grin', gear: ['pirate_hat', 'staff'],
    }, { short: 'K. Robin', bio: 'Arr! A hét tenger leggyorsabb Teeny kapitánya.' });

  // ---------- Szezonális (eseményjutalom) ----------
  F('robin_vamp', 'Vámpír Robin', 'mystic', 'epic', [100, 13, 10, 12],
    ['bat_swarm', 'blood_moon', 'night_bite'], 'dracula_robin',
    {
      skin: '#e8e4f4', top: '#1d1d2b', sleeves: '#1d1d2b', gloves: '#1d1d2b', bottom: '#2a0a14', boots: '#1d1d2b', belt: '#c1121f',
      cape: '#1d1d2b', capeIn: '#c1121f', hair: 'spiky', hairColor: '#1d1d2b', mask: '#c1121f', eyes: 'lens', mouth: 'fang', gear: ['collar'],
      chest: { sym: 'R', color: '#c1121f', ink: '#1d1d2b' },
    }, { short: 'V. Robin', bio: 'Halloweeni kiadás. Csak éjfél után harap… vagy ha nyerni akar.', noBox: true, passive: 'vampire' });

  F('bb_reindeer', 'Rénszarvas Beast Boy', 'speed', 'epic', [105, 12, 11, 13],
    ['antler_charge', 'snowball', 'sleigh_dash'], 'sleigh_ride',
    {
      skin: '#78d66a', top: '#8b5a2b', sleeves: '#8b5a2b', gloves: '#5a3a1a', bottom: '#8b5a2b', boots: '#5a3a1a', belt: '#d62828',
      hair: 'messy', hairColor: '#2c7a2c', eyes: 'dot', mouth: 'grin', gear: ['ears_pointy', 'antlers', 'red_nose', 'bandana'], bandColor: '#d62828',
    }, { short: 'R. Beast Boy', bio: 'Karácsonyi kiadás. Szánt húz, ajándékot hoz, és harcol.', noBox: true });

  // ---------- Azarath Ravenje (Trigon legyőzéséért) ----------
  F('raven_azarath', 'Azarath Ravenje', 'mystic', 'legendary', [110, 15, 12, 11],
    ['soul_bird', 'azarath_veil', 'azarath_storm'], 'metrion_zinthos',
    {
      skin: '#cfc8ec', top: '#4b2e83', bottom: '#4b2e83', boots: '#ffd23f', gloves: '#cfc8ec', belt: '#ffffff',
      cloak: '#ffd23f', hood: true, hair: 'bob', hairColor: '#5b3a9a', eyes: 'glow', eyeColor: '#ffffff', mouth: 'smile',
      gear: ['gem', 'tiara'], shine: true,
    }, { short: 'A. Raven', bio: 'Azarath fénye Raven minden erejével. Trigon legyőzője.', noBox: true, passive: 'regen' });

  // ---------- Vendégek ----------
  F('mad_mod', 'Mad Mod', 'mystic', 'epic', [105, 13, 11, 10],
    ['mod_cane', 'hypno_spiral', 'swinging_sixties'], 'mod_tv',
    {
      skin: SKIN, top: '#1d3c8f', sleeves: '#1d3c8f', bottom: '#1d3c8f', boots: '#1d1d2b', gloves: '#f4f4f8',
      hair: 'swoop', hairColor: '#e8743b', eyes: 'dot', mouth: 'grin', tie: '#d62828', gear: ['staff', 'monocle'],
    }, { team: 'villain', short: 'Mad Mod', bio: 'A hatvanas évek stílusikonja. Hipnózissal tanít divatot — akarod, nem akarod.', noBox: true });

  F('killer_moth', 'Killer Moth', 'speed', 'rare', [95, 12, 10, 13],
    ['moth_dust', 'wing_gust', 'moth_dive'], 'moth_swarm',
    {
      skin: '#7a4fb8', top: '#5b3fa0', sleeves: '#5b3fa0', bottom: '#4a2f86', boots: '#2a1d4a', gloves: '#c9b6e4',
      cape: '#c9b6e4', capeIn: '#9b7fd6', hair: 'bald', eyes: 'goggle', eyeColor: '#ffd23f', mouth: 'none', gear: ['antenna', 'wings_bee'],
      chest: { sym: 'M', color: '#c9b6e4', ink: '#2a1d4a' },
    }, { team: 'villain', short: 'K. Moth', bio: 'Repül a lámpafény felé. És a figurák felé. Leginkább a figurák felé.' });

  F('larry', 'Larry', 'mystic', 'epic', [90, 12, 10, 12],
    ['tiny_jab', 'larry_laugh', 'mirror_kick'], 'fifth_dimension',
    {
      skin: SKIN, top: '#2f9e44', sleeves: '#d62828', gloves: '#d62828', bottom: '#d62828', boots: '#1d1d2b',
      belt: '#ffd23f', cape: '#ffd23f', capeIn: '#1d1d2b', hair: 'spiky', hairColor: '#1d1d2b',
      mask: '#1d1d2b', eyes: 'lens', mouth: 'grin', chest: { sym: 'L', color: '#ffd23f', ink: '#1d1d2b' }, scale: 0.86,
    }, { team: 'titans', bio: 'Robin legnagyobb rajongója az ötödik dimenzióból. Pici, de varázslatos.' });

  // ---------- Teeny Titans 3: Menta-banda ----------
  F('mintguard', 'Menta Őr', 'tech', 'common', [105, 10, 12, 9],
    ['tape_shot', 'barcode_scan', 'stamp'], 'warehouse_lock',
    { body: 'robot', skin: '#7fe0b5', eyes: 'robot', eyeColor: '#2bd9ff', mouth: 'none', gear: ['antenna'] },
    { team: 'mint', bio: 'Mr. Mint gyári őrrobotja. Mindent becsomagol.' });

  F('boxbot', 'Dobozbot', 'tech', 'rare', [125, 12, 13, 8],
    ['box_punch', 'packing_peanuts', 'box_trap'], 'big_unboxing',
    { body: 'box', skin: '#c8a165', eyes: 'robot', eyeColor: '#ff4f4f', mouth: 'flat' },
    { team: 'mint', bio: 'Kartondoboz, ami visszaüt. Ragasztószalaggal tartja magát egyben.' });

  F('shrinkwrap', 'Shrink Wrap', 'speed', 'epic', [105, 13, 10, 13],
    ['wrap', 'bubble_pop', 'vacuum_pack'], 'factory_sealed',
    {
      skin: SKIN, top: '#b8e0f0', bottom: '#8fc7e0', boots: '#5aa0c0', gloves: '#b8e0f0', shine: true,
      hair: 'ponytail', hairColor: '#4fd6a8', eyes: 'cat', eyeColor: '#2a9d8f', mouth: 'smirk',
    }, { team: 'mint', bio: 'Mr. Mint jobbkeze. Bárkit lefóliáz — örökre.' });

  F('mrmint', 'Mr. Mint', 'tech', 'legendary', [150, 15, 14, 10],
    ['price_tag', 'appraisal', 'mint_box'], 'collectors_edition',
    {
      skin: SKIN, top: '#2a9d8f', bottom: '#1f7a6f', boots: '#1d1d2b', gloves: '#ffffff', shirt: '#ffffff', tie: '#7fe0b5',
      hair: 'flat', hairColor: '#e8e8f0', eyes: 'dot', mouth: 'smirk', gear: ['top_hat', 'mustache', 'monocle'], hatColor: '#2a9d8f', scale: 1.06,
    }, { team: 'mint', bio: 'A világ legnagyobb gyűjtője. Minden figurát bontatlanul akar — örökre a dobozban.', noBox: true });

  // Passzív képességek (ahol eltér a típus alapértelmezésétől)
  const PASSIVE = {
    robin: 'leader', robin_ultra: 'leader', robin_pirate: 'leader', mrmint: 'leader',
    robin_ninja: 'crit', speedy: 'crit', larry: 'lucky', red_x: 'crit', slade: 'crit', seemore: 'crit',
    robin_rock: 'firstwind', starfire: 'firstwind', blackfire: 'firstwind', controlfreak: 'firstwind',
    raven_white: 'regen', star_sleepy: 'regen', star_chef: 'regen', silkie: 'regen', silkie_gold: 'regen', plasmus: 'regen',
    raven_rage: 'berserk',
    bb_cowboy: 'lucky', bumblebee: 'lucky', jinx: 'lucky', billy: 'lucky', kitten: 'lucky', wykkyd: 'lucky',
    star_warrior: 'thorns', terra: 'thorns', mammoth: 'thorns',
    cinderblock: 'armor',
    aqualad: 'shieldstart', mumbo: 'shieldstart', shrinkwrap: 'shieldstart', brain: 'shieldstart',
    drlight: 'burnplus', trigon: 'burnplus',
  };
  for (const f of LIST) if (PASSIVE[f.id]) f.passive = PASSIVE[f.id];

  // ---------- Különleges TT2-változatok ----------
  F('bb_cat', 'Macska Beast Boy', 'speed', 'rare', [95, 11, 9, 13],
    ['cat_scratch', 'waffle_toss', 'cheetah'], 'nine_lives',
    retro('beastboy', { top: '#7bd65b', bottom: '#7bd65b', boots: '#5aa83c', gloves: '#7bd65b', stripe: '#3b6b2b', mouth: 'grin' }),
    { short: 'M. Beast Boy', bio: 'Végleg macskának maradt. Dorombol, karmol és gofrit dobál.' });

  F('bb_martian', 'Marsi Beast Boy', 'mystic', 'epic', [105, 13, 10, 11],
    ['goat_butt', 'martian_beam', 'gorilla_slam'], 'martian_morph',
    retro('beastboy', { top: '#2f9e44', bottom: '#2a3fb0', boots: '#2a3fb0', gloves: '#2f9e44', stripe: '#d62828', cape: '#2a3fb0', capeIn: '#1d2a7a', mouth: 'smirk' }),
    { short: 'Marsi BB', bio: 'Marsi Vadászként öltözött be. Most már a Marson is ő a legviccesebb.' });

  F('aqualad_pirate', 'Kalóz Aqualad', 'brawn', 'epic', [110, 12, 11, 10],
    ['cutlass', 'bubble_trap', 'water_whip'], 'whale_drop',
    retro('aqualad', { hairColor: '#111', gear: ['pirate_hat'], mouth: 'grin' }),
    { short: 'K. Aqualad', bio: 'Kampókéz, falláb és egy papagáj. Atlantisz legvidámabb kalóza.' });

  F('star_terrible', 'Rettenetes Starfire', 'mystic', 'legendary', [105, 15, 10, 13],
    ['dark_bolt', 'eye_beams', 'super_dash'], 'terrible_glare',
    retro('starfire', { top: '#2a1a3a', bottom: '#2a1a3a', boots: '#2a1a3a', hairColor: '#ff2e86', mouth: 'frown' }),
    { short: 'R. Starfire', bio: 'A sötét oldal Tamaranról. Egy pillantással felperzsel bárkit.' });

  F('blood_robot', 'Robot Brother Blood', 'tech', 'epic', [125, 13, 13, 8],
    ['mind_control', 'robo_drain', 'blood_bolt'], 'hive_judgement',
    Object.assign({}, LIST.find((f) => f.id === 'bloodbrother').look, { top: '#c1121f', bottom: '#8a8f9c', boots: '#8a8f9c', gloves: '#c1121f', eyes: 'glow', eyeColor: '#ffb703' }),
    { team: 'hive', short: 'R. B. Blood', bio: 'Félig ember, félig gép, teljesen hipnotikus. A H.I.V.E. 2.0 igazgatója.' });

  F('robin_nightwing', 'Nightwing', 'speed', 'legendary', [108, 15, 11, 15],
    ['staff_strike', 'poison_pellet', 'wing_rangs'], 'night_flight',
    retro('robin', { top: '#1d1d2b', sleeves: '#1d1d2b', bottom: '#1d1d2b', boots: '#1d1d2b', gloves: '#3fa7ff', belt: '#3fa7ff', cape: null, chest: { sym: 'V', color: '#3fa7ff', ink: '#1d1d2b' }, mouth: 'smirk' }),
    { short: 'Nightwing', bio: 'A felnőtt Robin a jövőből. Gyorsabb, menőbb, és még mindig ő a vezér.' });

  // ---------- DC vendégek (Teeny Titans 2) ----------
  F('dc_batman', 'Batman Beyond', 'tech', 'legendary', [115, 15, 12, 13],
    ['counter_strike', 'batarang_volley', 'bat_mine'], 'future_knight',
    {
      skin: SKIN, top: '#1d1d2b', sleeves: '#1d1d2b', gloves: '#1d1d2b', bottom: '#1d1d2b', boots: '#1d1d2b', belt: '#d62828',
      hair: 'bald', mask: '#1d1d2b', eyes: 'lens', mouth: 'frown', gear: ['cowl', 'ears_bat'], chest: { sym: 'B', color: '#d62828', ink: '#1d1d2b' },
    }, { team: 'dc', short: 'Batman B.', bio: 'Gotham jövőbeli őrzője. Hightech páncél, régi iskolás makacsság.' });

  F('dc_batgirl', 'Batgirl', 'speed', 'epic', [100, 13, 10, 14],
    ['staff_strike', 'charged_rang', 'grapple_kick'], 'bat_storm',
    {
      skin: SKIN, top: '#8e44ad', sleeves: '#8e44ad', gloves: '#ffd23f', bottom: '#8e44ad', boots: '#ffd23f', belt: '#ffd23f', cape: '#1d1d2b', capeIn: '#ff9a3c',
      hair: 'long', hairColor: '#ff6b35', mask: '#1d1d2b', eyes: 'lens', mouth: 'grin', gear: ['cowl', 'ears_bat'],
    }, { team: 'dc', bio: 'Gotham legvagányabb hősnője. Gyorsabb a saját batarangjánál.' });

  F('dc_superman', 'Superman', 'brawn', 'legendary', [140, 15, 14, 11],
    ['super_punch', 'heat_vision', 'super_breath'], 'man_of_steel',
    {
      skin: SKIN, top: '#3f6fd8', sleeves: '#3f6fd8', gloves: '#3f6fd8', bottom: '#3f6fd8', boots: '#d62828', belt: '#ffd23f', cape: '#d62828', capeIn: '#a81d1d',
      hair: 'swoop', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'smile', chest: { sym: 'S', color: '#d62828', ink: '#ffd23f' },
    }, { team: 'dc', bio: 'Gyorsabb egy száguldó golyónál, erősebb egy mozdonynál — és most Teeny méretű.' });

  F('dc_wonderwoman', 'Wonder Woman', 'brawn', 'legendary', [130, 15, 13, 12],
    ['amazon_combo', 'lasso_truth', 'bracelet_block'], 'themyscira_fury',
    {
      skin: '#e2b088', top: '#d62828', sleeves: '#e2b088', gloves: '#c0c0c0', bottom: '#2a3fb0', boots: '#d62828', belt: '#ffd23f',
      hair: 'long', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'smirk', gear: ['tiara'],
    }, { team: 'dc', short: 'Wonder W.', bio: 'Themyscira hercegnője. A lasszója elől senki sem titkolózhat.' });

  F('dc_joker', 'Joker', 'mystic', 'legendary', [115, 15, 11, 12],
    ['chatter_teeth', 'joker_laugh', 'joker_hammer'], 'punchline',
    {
      skin: '#f4f4f8', top: '#7a3fb0', sleeves: '#7a3fb0', gloves: '#7a3fb0', bottom: '#7a3fb0', boots: '#2a1a3a', belt: '#4fd36b',
      hair: 'spiky', hairColor: '#4fd36b', eyes: 'dot', mouth: 'grin',
    }, { team: 'villain', bio: 'Gotham bohóc-hercege. A poénjai rosszabbak, mint Beast Boyé — és veszélyesebbek.' });

  F('dc_harley', 'Harley Quinn', 'speed', 'epic', [105, 14, 10, 14],
    ['mallet', 'harley_bomb', 'harley_kiss'], 'mallet_mayhem',
    {
      skin: '#f4f4f8', top: '#d62828', sleeves: '#1d1d2b', gloves: '#1d1d2b', bottom: '#1d1d2b', boots: '#d62828', belt: '#1d1d2b',
      hair: 'puffs', hairColor: '#1d1d2b', mask: '#1d1d2b', eyes: 'lens', mouth: 'grin',
    }, { team: 'villain', short: 'Harley', bio: 'Kalapács, bomba és egy puszi. Kiszámíthatatlanul szórakoztató.' });

  // ---------- DC gonoszok (Teeny Titans 2) ----------
  F('dc_lex', 'Lex Luthor', 'tech', 'legendary', [130, 15, 13, 10],
    ['multi_gun', 'krypto_beam', 'rocket_boots'], 'lexbot_army',
    {
      skin: SKIN, top: '#3fa34d', sleeves: '#3fa34d', gloves: '#6b3fa0', bottom: '#6b3fa0', boots: '#6b3fa0', belt: '#3fa34d',
      hair: 'bald', hairColor: SKIN, eyes: 'dot', mouth: 'smirk', chest: { sym: 'L', color: '#6b3fa0', ink: '#4fd36b' },
    }, { team: 'villain', short: 'Lex', bio: 'Metropolis leggazdagabb zsenije. Szerinte Superman csak egy túlértékelt figura.' });

  F('dc_darkseid', 'Darkseid', 'mystic', 'legendary', [150, 16, 14, 8],
    ['apokolips_punch', 'dark_glare', 'omega_beams'], 'anti_life',
    {
      skin: '#6b6b7a', top: '#2b4a9a', sleeves: '#6b6b7a', gloves: '#2b4a9a', bottom: '#2b4a9a', boots: '#2b4a9a', belt: '#2b4a9a',
      hair: 'bald', hairColor: '#6b6b7a', eyes: 'glow', eyeColor: '#ff3b3b', mouth: 'frown', scale: 1.08,
    }, { team: 'villain', bio: 'Apokolipsz ura. Egyetlen pillantása is elég, hogy a figurád elbújjon a doboza mögött.' });

  F('dc_riddler', 'Rébusz', 'tech', 'epic', [100, 13, 11, 13],
    ['question_cane', 'riddle_hack', 'lucky_guess'], 'riddle_me_this',
    {
      skin: SKIN, top: '#3fa34d', sleeves: '#3fa34d', gloves: '#3fa34d', bottom: '#3fa34d', boots: '#2a1a3a', belt: '#6b3fa0',
      hair: 'short', hairColor: '#ff9a3c', mask: '#6b3fa0', eyes: 'lens', mouth: 'grin', chest: { sym: '?', color: '#3fa34d', ink: '#1d1d2b' }, gear: ['top_hat'], hatColor: '#3fa34d',
    }, { team: 'villain', bio: 'Mi az: kicsi, zöld és mindig nyer? …Nem, nem Beast Boy. Rébusz!' });

  F('dc_penguin', 'Pingvin', 'tech', 'epic', [115, 13, 12, 9],
    ['umbrella_gun', 'fish_toss', 'freeze_umbrella'], 'penguin_army',
    {
      skin: SKIN, top: '#1d1d2b', sleeves: '#1d1d2b', gloves: '#f4f4f8', bottom: '#1d1d2b', boots: '#1d1d2b', shirt: '#f4f4f8', tie: '#6b3fa0',
      hair: 'flat', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'smirk', gear: ['top_hat', 'monocle'], hatColor: '#1d1d2b', scale: 0.95,
    }, { team: 'villain', bio: 'Gotham legelegánsabb gengsztere. Az esernyője többet tud, mint egy svájci bicska.' });

  F('dc_ivy', 'Méregcsók', 'mystic', 'epic', [105, 13, 11, 12],
    ['vine_lash', 'spore_cloud', 'ivy_kiss'], 'jungle_rage',
    {
      skin: '#b8e0a0', top: '#3fa34d', sleeves: '#b8e0a0', gloves: '#3fa34d', bottom: '#3fa34d', boots: '#3fa34d',
      hair: 'long', hairColor: '#d62828', eyes: 'dot', mouth: 'lips',
    }, { team: 'villain', short: 'Méregcsók', bio: 'A növények barátja, a figurák ellensége. Ne szagold meg a virágait.' });

  F('dc_bane', 'Bane', 'brawn', 'epic', [140, 14, 13, 8],
    ['venom_punch', 'back_breaker', 'venom_boost'], 'venom_rampage',
    {
      skin: SKIN, top: '#1d1d2b', sleeves: SKIN, gloves: '#1d1d2b', bottom: '#2a1a3a', boots: '#1d1d2b', belt: '#7bd65b',
      hair: 'bald', hairColor: '#1d1d2b', mask: '#1d1d2b', eyes: 'lens', mouth: 'frown', scale: 1.08,
    }, { team: 'villain', bio: 'Izom, ész és egy zöld csövecske. A Venom-adag után még a talapzata is megremeg.' });

  // ---------- DC hősök (Teeny Titans 2) ----------
  F('dc_flash', 'Flash', 'speed', 'legendary', [110, 15, 11, 16],
    ['speed_punches', 'speed_vortex', 'lightning_dash'], 'speed_force',
    {
      skin: SKIN, top: '#d62828', sleeves: '#d62828', gloves: '#d62828', bottom: '#d62828', boots: '#ffd23f', belt: '#ffd23f',
      hair: 'bald', hairColor: '#d62828', eyes: 'dot', mouth: 'grin', gear: ['flash_cowl'], chest: { sym: 'ϟ', color: '#ffd23f', ink: '#d62828' },
    }, { team: 'dc', bio: 'A leggyorsabb ember a világon. Mire elolvasod ezt, már háromszor körbefutotta Jump Cityt.' });

  F('dc_aquaman', 'Aquaman', 'brawn', 'legendary', [140, 15, 13, 10],
    ['trident_strike', 'bubble_guard', 'tidal_wave'], 'king_of_seas',
    {
      skin: SKIN, top: '#ff9a3c', sleeves: '#ff9a3c', gloves: '#3fa34d', bottom: '#3fa34d', boots: '#3fa34d', belt: '#ffd23f',
      hair: 'long', hairColor: '#ffd23f', eyes: 'dot', mouth: 'smile',
    }, { team: 'dc', bio: 'Atlantisz királya. A halak hallgatnak rá — Aqualad szerint néha túlságosan is.' });

  F('dc_supergirl', 'Supergirl', 'brawn', 'epic', [120, 14, 12, 12],
    ['kara_punch', 'freeze_breath', 'laser_eyes'], 'krypton_comet',
    {
      skin: SKIN, top: '#3f6fd8', sleeves: '#3f6fd8', gloves: '#3f6fd8', bottom: '#d62828', boots: '#d62828', cape: '#d62828', capeIn: '#a81d1d',
      hair: 'long', hairColor: '#ffd23f', eyes: 'dot', mouth: 'smile', chest: { sym: 'S', color: '#d62828', ink: '#ffd23f' },
    }, { team: 'dc', bio: 'Superman unokatestvére Kryptonról. Ugyanolyan erős, csak sokkal jobb a humora.' });

  F('dc_shazam', 'Shazam', 'mystic', 'epic', [125, 14, 12, 11],
    ['thunder_punch', 'magic_lightning', 'bulletproof'], 'shazam_bolt',
    {
      skin: SKIN, top: '#d62828', sleeves: '#d62828', gloves: '#ffd23f', bottom: '#d62828', boots: '#ffd23f', belt: '#ffd23f', cape: '#f4f4f8', capeIn: '#ffd23f',
      hair: 'swoop', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'grin', chest: { sym: 'ϟ', color: '#d62828', ink: '#ffd23f' },
    }, { team: 'dc', bio: 'Egy varázsszó, és a kisfiúból villámló hős lesz. Csak ne mondd ki véletlenül!' });

  F('dc_martian', 'Marsbéli Vadász', 'mystic', 'epic', [125, 14, 12, 10],
    ['phase_punch', 'mind_blast', 'shape_shift'], 'martian_vision',
    {
      skin: '#3fa34d', top: '#1d4a9a', sleeves: '#3fa34d', gloves: '#3fa34d', bottom: '#1d4a9a', boots: '#1d4a9a', belt: '#ffd23f', cape: '#1d4a9a', capeIn: '#d62828',
      hair: 'bald', hairColor: '#3fa34d', eyes: 'glow', eyeColor: '#ff6b35', mouth: 'frown',
    }, { team: 'dc', short: 'Marsbéli', bio: 'A Mars utolsó fia. Gondolatolvasó, alakváltó — és imádja a kekszet.' });

  F('dc_hawkgirl', 'Sólyomlány', 'speed', 'epic', [110, 14, 11, 14],
    ['mace_swing', 'feather_storm', 'electric_mace'], 'nth_metal',
    {
      skin: SKIN, top: '#ffd23f', sleeves: '#ffd23f', gloves: '#c97b30', bottom: '#3fa34d', boots: '#c97b30', belt: '#ffd23f',
      hair: 'long', hairColor: '#d62828', eyes: 'dot', mouth: 'smirk', gear: ['wings_bee'],
    }, { team: 'dc', bio: 'Szárnyakkal és egy villámló buzogánnyal érkezik. Gonoszok, fedezékbe!' });

  // ---------- Liga-Titánok (Teeny Titans 2) ----------
  F('raven_wonder', 'Wonder Raven', 'mystic', 'legendary', [120, 15, 12, 12],
    ['wr_strike', 'wr_lasso', 'wr_bracelets'], 'wr_amazon_magic',
    retro('raven', { top: '#d62828', bottom: '#2a3fb0', cloak: '#2a3fb0', gear: ['tiara'] }),
    { team: 'titans', short: 'W. Raven', bio: 'Raven Wonder Woman jelmezében. A lasszója sötét — de az igazságot így is kiszedi.' });

  F('star_flash', 'Star Flash', 'speed', 'epic', [105, 14, 10, 15],
    ['sf_bolts', 'sf_vortex', 'sf_dash'], 'sf_supernova',
    retro('starfire', { top: '#d62828', sleeves: '#d62828', bottom: '#d62828', boots: '#ffd23f' }),
    { team: 'titans', short: 'Star Flash', bio: 'Starfire felvette Flash ruháját, és azóta senki sem éri utol. Még a saját nyilai sem.' });

  F('robin_bat', 'Bat Robin', 'tech', 'epic', [110, 14, 12, 12],
    ['br_rangs', 'br_smoke', 'br_kick'], 'br_detective',
    retro('robin', { top: '#6b6b7a', sleeves: '#6b6b7a', bottom: '#1d1d2b', cape: '#1d1d2b', capeIn: '#1d1d2b', gear: ['cowl', 'ears_bat'] }),
    { team: 'titans', short: 'Bat Robin', bio: 'Robin álma valóra vált: Batman jelmezében járja Jump City sötét utcáit.' });

  F('cyborg_lantern', 'Lámpás Cyborg', 'tech', 'legendary', [130, 15, 13, 9],
    ['gc_fist', 'gc_beam', 'gc_shield'], 'gc_oath',
    retro('cyborg', { top: '#1d1d2b', bottom: '#3fa34d', chest: { sym: '◎', color: '#1d1d2b', ink: '#4fd36b' } }),
    { team: 'titans', short: 'L. Cyborg', bio: 'Cyborg a Zöld Lámpások gyűrűjét kapta. A legfényesebb nap, a legsötétebb éj… BOOYAH!' });

  F('dc_bwana', 'Bwana Beast', 'brawn', 'epic', [135, 14, 13, 9],
    ['bw_claw', 'bw_roar', 'bw_slam'], 'bw_chimera',
    {
      skin: '#e2b088', top: '#e2b088', sleeves: '#e2b088', gloves: '#e2b088', bottom: '#d62828', boots: '#d62828', belt: '#ffd23f',
      hair: 'short', hairColor: '#1d1d2b', mask: '#d62828', eyes: 'dot', mouth: 'grin', gear: ['horns'],
    }, { team: 'dc', short: 'Bwana', bio: 'Az állatok ura a Liga soraiból. Beast Boy szerint ő a „második legjobb” állatbarát.' });

  F('silkie_super', 'Szuper Silkie', 'brawn', 'epic', [120, 13, 12, 10],
    ['ss_punch', 'ss_burp', 'ss_fly'], 'ss_hero',
    retro('silkie', { cape: '#d62828', capeIn: '#a81d1d' }),
    { team: 'titans', short: 'Sz. Silkie', bio: 'Pelerint kapott, és azt hiszi, tud repülni. (Tud.)' });

  // ---------- DC különcök (Teeny Titans 2) ----------
  F('dc_catwoman', 'Macskanő', 'speed', 'epic', [100, 14, 10, 15],
    ['cw_whip', 'cw_kiss', 'cw_pounce'], 'cw_heist',
    {
      skin: SKIN, top: '#3a2a5a', sleeves: '#3a2a5a', gloves: '#3a2a5a', bottom: '#3a2a5a', boots: '#3a2a5a',
      hair: 'short', hairColor: '#1d1d2b', mask: '#3a2a5a', eyes: 'lens', mouth: 'smirk', gear: ['ears_pointy', 'goggles_up'],
    }, { team: 'villain', bio: 'Gotham legügyesebb tolvaja. Minden csillogó figurát elcsen — főleg a ritkákat.' });

  F('dc_cheetah', 'Gepárdnő', 'speed', 'epic', [100, 14, 10, 15],
    ['ch_swipe', 'ch_hairball', 'ch_airstrike'], 'ch_frenzy',
    {
      skin: '#f2b705', top: '#f2b705', sleeves: '#f2b705', gloves: '#f2b705', bottom: '#f2b705', boots: '#f2b705',
      hair: 'messy', hairColor: '#c97b30', eyes: 'dot', eyeColor: '#3fa34d', mouth: 'fang', gear: ['ears_pointy'],
    }, { team: 'villain', bio: 'Wonder Woman ősellensége. Gyors, morcos, és utálja, ha valaki „cicának” hívja.' });

  F('dc_sinestro', 'Sinestro', 'mystic', 'legendary', [125, 15, 12, 11],
    ['si_axe', 'si_fear', 'si_beam'], 'si_yellow',
    {
      skin: '#e0457a', top: '#1d1d2b', sleeves: '#ffd23f', gloves: '#1d1d2b', bottom: '#1d1d2b', boots: '#1d1d2b', belt: '#ffd23f',
      hair: 'flat', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'smirk', gear: ['mustache'],
    }, { team: 'villain', bio: 'A sárga gyűrű ura. A félelem a fegyvere — de Beast Boy pókjától ő is tart.' });

  F('dc_grodd', 'Grodd gorilla', 'mystic', 'legendary', [145, 15, 13, 8],
    ['gr_smash', 'gr_mind', 'gr_darwin'], 'gr_ape_army',
    {
      skin: '#6b6b7a', top: '#4a4a55', sleeves: '#4a4a55', gloves: '#4a4a55', bottom: '#4a4a55', boots: '#4a4a55',
      hair: 'short', hairColor: '#3a3a44', eyes: 'dot', mouth: 'frown', scale: 1.1,
    }, { team: 'villain', short: 'Grodd', bio: 'Zseniális gorilla, aki gondolatolvasással irányít. A banánt is így szerzi meg.' });

  F('dc_bizarro', 'Bizarro', 'brawn', 'epic', [140, 14, 13, 9],
    ['bz_punch', 'bz_ice', 'bz_fire'], 'bz_backwards',
    {
      skin: '#b8d8e8', top: '#2a3fb0', sleeves: '#2a3fb0', gloves: '#2a3fb0', bottom: '#2a3fb0', boots: '#d62828', cape: '#d62828', capeIn: '#a81d1d',
      hair: 'swoop', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'grin', chest: { sym: 'S', color: '#d62828', ink: '#ffd23f' },
    }, { team: 'villain', bio: 'Bizarro nem gonosz! Bizarro nagyon is nem jó! …Vagy fordítva. Bizarro sem tudja.' });

  F('dc_swamp', 'Mocsárlény', 'mystic', 'epic', [150, 13, 14, 7],
    ['sw_vine', 'sw_mud', 'sw_regrow'], 'sw_green',
    {
      skin: '#6f8a3a', top: '#6f8a3a', sleeves: '#6f8a3a', gloves: '#6f8a3a', bottom: '#5a7030', boots: '#5a7030',
      hair: 'messy', hairColor: '#4a5a28', eyes: 'glow', eyeColor: '#ff3b3b', mouth: 'frown', scale: 1.08,
    }, { team: 'dc', bio: 'A mocsár őrzője. Lassú, csendes, és mindig visszanő — akárcsak a gaz a Torony kertjében.' });

  // ---------- A Liga újoncai (Teeny Titans 2) ----------
  F('dc_johnstewart', 'John Stewart', 'tech', 'legendary', [130, 15, 13, 10],
    ['js_fist', 'js_construct', 'js_shield'], 'js_willpower',
    {
      skin: '#8a5a3a', top: '#1d1d2b', sleeves: '#3fa34d', gloves: '#f4f4f8', bottom: '#1d1d2b', boots: '#3fa34d',
      hair: 'short', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'smile', chest: { sym: '◎', color: '#1d1d2b', ink: '#4fd36b' },
    }, { team: 'dc', short: 'J. Stewart', bio: 'Egykori építész, ma Zöld Lámpás. A gyűrűjével bármit megépít — még egy figurapolcot is.' });

  F('dc_jessica', 'Jessica Cruz', 'mystic', 'epic', [110, 14, 11, 13],
    ['jc_gun', 'jc_beam', 'jc_dive'], 'jc_light',
    {
      skin: '#e2b088', top: '#1d1d2b', sleeves: '#1d1d2b', gloves: '#f4f4f8', bottom: '#1d1d2b', boots: '#f4f4f8',
      hair: 'long', hairColor: '#4a2a1a', mask: '#4fd36b', eyes: 'lens', mouth: 'smile',
    }, { team: 'dc', short: 'J. Cruz', bio: 'A legújabb Zöld Lámpás. Fél, mégis bátor — és ez a legnagyobb erő.' });

  F('dc_bluebeetle', 'Kék Bogár', 'tech', 'epic', [115, 14, 12, 12],
    ['kb_blade', 'kb_cannon', 'kb_shield'], 'kb_scarab',
    {
      skin: '#2a6fd8', top: '#2a6fd8', sleeves: '#1d1d2b', gloves: '#2a6fd8', bottom: '#1d1d2b', boots: '#2a6fd8',
      hair: 'bald', hairColor: '#2a6fd8', eyes: 'glow', eyeColor: '#ffd23f', mouth: 'frown', gear: ['antenna'],
    }, { team: 'dc', bio: 'Egy idegen szkarabeusz páncélja beszél hozzá. Néha túl sokat is.' });

  F('dc_booster', 'Booster Gold', 'brawn', 'epic', [120, 14, 12, 11],
    ['bg_punch', 'bg_blast', 'bg_kiss'], 'bg_future',
    {
      skin: SKIN, top: '#ffd23f', sleeves: '#2a3fb0', gloves: '#ffd23f', bottom: '#2a3fb0', boots: '#ffd23f', belt: '#ffd23f',
      hair: 'swoop', hairColor: '#ffd23f', mask: '#2a3fb0', eyes: 'lens', mouth: 'grin',
    }, { team: 'dc', short: 'Booster', bio: 'A jövőből jött, hogy híres legyen. Az autogramját már előre aláírta.' });

  F('dc_blacklightning', 'Black Lightning', 'mystic', 'legendary', [120, 15, 12, 12],
    ['bl_zap', 'bl_storm', 'bl_bolt'], 'bl_thunder',
    {
      skin: '#8a5a3a', top: '#2a3fb0', sleeves: '#2a3fb0', gloves: '#f4f4f8', bottom: '#2a3fb0', boots: '#f4f4f8', belt: '#ffd23f',
      hair: 'short', hairColor: '#1d1d2b', mask: '#ffd23f', eyes: 'lens', mouth: 'frown',
    }, { team: 'dc', short: 'B. Lightning', bio: 'Tanár nappal, villámhős éjjel. A házi feladat nála szó szerint elektromos.' });

  F('dc_vixen', 'Vixen', 'speed', 'epic', [105, 14, 10, 14],
    ['vx_chicken', 'vx_elephant', 'vx_turtle'], 'vx_tantu',
    {
      skin: '#8a5a3a', top: '#ff9a3c', sleeves: '#ff9a3c', gloves: '#ff9a3c', bottom: '#ff9a3c', boots: '#ff9a3c',
      hair: 'spiky', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'smile',
    }, { team: 'dc', bio: 'A Tantu-totem bármelyik állat erejét kölcsönadja neki. Még a csirkéét is.' });

  // ---------- Vicces változatok (Teeny Titans 2) ----------
  F('dc_bathman', 'Fürdő-Batman', 'brawn', 'epic', [130, 14, 12, 10],
    ['bm_towel', 'bm_soap', 'bm_ducky'], 'bm_bubblebath',
    {
      skin: SKIN, top: SKIN, sleeves: SKIN, gloves: SKIN, bottom: '#f4f4f8', boots: SKIN,
      hair: 'bald', hairColor: '#1d1d2b', mask: '#4a4a55', eyes: 'lens', mouth: 'grin', gear: ['cowl', 'ears_bat'],
    }, { team: 'dc', short: 'Fürdő-Batman', bio: 'Még a Sötét Lovag is megfürdik néha. A gumikacsája a legjobb társa.' });

  F('santa_claus', 'Mikulás', 'mystic', 'legendary', [130, 15, 13, 10],
    ['sc_gift', 'sc_snow', 'sc_cookie'], 'sc_sleigh',
    {
      skin: SKIN, top: '#d62828', sleeves: '#d62828', gloves: '#1d1d2b', bottom: '#d62828', boots: '#1d1d2b', belt: '#1d1d2b',
      hair: 'messy', hairColor: '#f4f4f8', eyes: 'dot', mouth: 'grin', gear: ['nightcap', 'mustache'], hatColor: '#d62828',
    }, { team: 'titans', bio: 'Ho-ho-ho! Idén mindenki figurát kap. A rossz gyerekek dupla Gizmót.' });

  F('george_w', 'George Washington', 'brawn', 'epic', [125, 14, 13, 10],
    ['gw_bat', 'gw_cherry', 'gw_freedom'], 'gw_independence',
    {
      skin: SKIN, top: '#2a3fb0', sleeves: '#2a3fb0', gloves: '#f4f4f8', bottom: '#f4d35e', boots: '#1d1d2b',
      hair: 'puffs', hairColor: '#f4f4f8', eyes: 'dot', mouth: 'grin',
    }, { team: 'titans', short: 'G. Washington', bio: 'Robin legnagyobb hőse. A Titánok szerint biceps-ben is az első elnök.' });

  F('silkie_princess', 'Hercegnő Silkie', 'mystic', 'epic', [120, 13, 12, 11],
    ['sp_nibble', 'sp_tiara', 'sp_royal'], 'sp_party',
    retro('silkie', { skin: '#ffc8e0', gear: ['tiara'] }),
    { team: 'titans', short: 'H. Silkie', bio: 'Starfire koronát tett rá, és Silkie azóta csak hercegnőként hajlandó harcolni.' });

  F('trigon_argyle', 'Pulóveres Trigon', 'mystic', 'legendary', [150, 15, 13, 8],
    ['ta_knit', 'ta_hug', 'ta_glare'], 'ta_holiday',
    {
      skin: '#d62828', top: '#ff9ecd', sleeves: '#ff9ecd', gloves: '#d62828', bottom: '#f4f4f8', boots: '#1d1d2b',
      hair: 'flat', hairColor: '#f4f4f8', eyes: 'glow', eyeColor: '#ffd23f', mouth: 'grin', gear: ['horns'], scale: 1.1,
    }, { team: 'villain', short: 'Puló-Trigon', bio: 'Raven apja kötött pulóverben. Aranyos? Igen. Kevésbé veszélyes? Egyáltalán nem.' });

  F('cyborg_head', 'Cyborg feje', 'tech', 'epic', [95, 14, 10, 14],
    ['chd_roll', 'chd_booyah', 'chd_beam'], 'chd_rocket',
    retro('cyborg', { scale: 0.85 }),
    { team: 'titans', short: 'Cyborg feje', bio: 'Csak a feje. A teste épp szervizben van. A BOOYAH így is megy.' });

  // ---------- Titán-barátok (Teeny Titans 2) ----------
  F('nightwing_dad', 'Apuka Nightwing', 'speed', 'legendary', [115, 15, 12, 14],
    ['nd_kick', 'nd_bottle', 'nd_lullaby'], 'nd_family',
    {
      skin: SKIN, top: '#1d1d2b', sleeves: '#1d1d2b', gloves: '#3fa7ff', bottom: '#1d1d2b', boots: '#1d1d2b',
      hair: 'spiky', hairColor: '#1d1d2b', mask: '#1d1d2b', eyes: 'lens', mouth: 'grin', chest: { sym: 'V', color: '#1d1d2b', ink: '#3fa7ff' },
    }, { team: 'titans', short: 'Apa Nightwing', bio: 'A jövőbeli Nightwing, egy babával a karján. Pelenkázni is akrobatikusan szokott.' });

  F('red_arrow', 'Red Arrow', 'speed', 'epic', [100, 14, 10, 15],
    ['ra_arrow', 'ra_poison', 'ra_volley'], 'ra_bullseye',
    {
      skin: SKIN, top: '#d62828', sleeves: '#1d1d2b', gloves: '#1d1d2b', bottom: '#1d1d2b', boots: '#d62828',
      hair: 'spiky', hairColor: '#ff6b35', mask: '#f4f4f8', eyes: 'lens', mouth: 'smirk', gear: ['quiver'],
    }, { team: 'east', bio: 'Speedy felnőtt. Ugyanaz az íj, csak sokkal komolyabb arccal.' });

  F('rose_wilson', 'Rose Wilson', 'brawn', 'epic', [115, 15, 11, 12],
    ['rw_sword', 'rw_foresight', 'rw_strike'], 'rw_ravager',
    {
      skin: '#f4e8e0', top: '#1d1d2b', sleeves: '#1d1d2b', gloves: '#ff9a3c', bottom: '#1d1d2b', boots: '#ff9a3c',
      hair: 'long', hairColor: '#f4f4f8', eyes: 'dot', mouth: 'frown', gear: ['eyepatch'],
    }, { team: 'villain', short: 'Rose', bio: 'Slade lánya, a Pusztító. Egy szeme van, de az mindent lát — előre.' });

  F('hooded_hood', 'Csuklyás Hood', 'mystic', 'legendary', [130, 15, 13, 10],
    ['hh_spike', 'hh_soul', 'hh_portal'], 'hh_doom',
    {
      skin: '#1d1d2b', top: '#d62828', sleeves: '#d62828', gloves: '#6b6b7a', bottom: '#1d1d2b', boots: '#1d1d2b', cloak: '#d62828',
      hair: 'bald', hairColor: '#1d1d2b', eyes: 'glow', eyeColor: '#f4f4f8', mouth: 'frown', gear: ['light_hood'],
    }, { team: 'villain', short: 'Hood', bio: 'Titokzatos csuklyás vadász, aki portálokon át érkezik. Még a Titánok sem tudják, ki ő.' });

  F('bumblebee_justice', 'Igazság Bumblebee', 'speed', 'epic', [100, 14, 10, 15],
    ['jb_sting', 'jb_blast', 'jb_shrink'], 'jb_swarm',
    {
      skin: '#8a5a3a', top: '#ffd23f', sleeves: '#1d1d2b', gloves: '#1d1d2b', bottom: '#1d1d2b', boots: '#ffd23f',
      hair: 'puffs', hairColor: '#1d1d2b', mask: '#ffd23f', eyes: 'lens', mouth: 'smile', gear: ['wings_bee', 'antenna'],
    }, { team: 'east', short: 'I. Bumblebee', bio: 'Bumblebee az Igazság Ligája egyenruhájában. Kicsi, de az egész Liga rá figyel.' });

  F('raven_legasus', 'Lady Legasus', 'mystic', 'epic', [110, 14, 11, 12],
    ['ll_kick', 'll_spell', 'll_disguise'], 'll_legend',
    retro('raven', { top: '#f4f4f8', bottom: '#f4f4f8', cloak: '#f4f4f8', mask: '#1d1d2b' }),
    { team: 'titans', short: 'L. Legasus', bio: 'Egy titokzatos szuperhősnő, aki semmiképp sem Raven. Tényleg. Ne kérdezz.' });

  // ---------- TT2 ritkaságok ----------
  F('clark_kent', 'Clark Kent', 'brawn', 'epic', [120, 14, 13, 11],
    ['ck_punch', 'ck_glasses', 'ck_dash'], 'ck_reveal',
    {
      skin: SKIN, top: '#6b5a3a', sleeves: '#6b5a3a', gloves: SKIN, bottom: '#6b5a3a', boots: '#1d1d2b', shirt: '#f4f4f8', tie: '#d62828',
      hair: 'swoop', hairColor: '#1d1d2b', eyes: 'lens', mouth: 'smile',
    }, { team: 'dc', short: 'Clark', bio: 'Csak egy szemüveges riporter. Biztosan nem Superman. Biztos.' });

  F('wonder_twins', 'Csodaikrek', 'mystic', 'epic', [110, 14, 11, 13],
    ['wt_eagle', 'wt_water', 'wt_ice'], 'wt_activate',
    {
      skin: '#b8a8e0', top: '#6b3fa0', sleeves: '#6b3fa0', gloves: '#6b3fa0', bottom: '#6b3fa0', boots: '#6b3fa0',
      hair: 'short', hairColor: '#1d1d2b', eyes: 'dot', mouth: 'grin',
    }, { team: 'dc', short: 'Csodaikrek', bio: 'Két testvér, egy kézfogás, végtelen forma. Az egyik sas, a másik… egy vödör víz.' });

  F('sticky_joe', 'Sticky Joe', 'brawn', 'epic', [130, 13, 13, 9],
    ['sj_cane', 'sj_trash', 'sj_stink'], 'sj_dumpster',
    {
      skin: SKIN, top: '#6b5a7a', sleeves: '#6b5a7a', gloves: '#6b6b7a', bottom: '#4a4a55', boots: '#3a2a1a',
      hair: 'messy', hairColor: '#f4f4f8', eyes: 'dot', mouth: 'grin', gear: ['nightcap'], hatColor: '#ff9ecd',
    }, { team: 'villain', bio: 'A Jump City-i kukák királya. Mindent összegyűjt, amit kidobnak — figurákat is.' });

  F('mr_chibi', 'Mr. Chibi', 'tech', 'legendary', [130, 14, 13, 10],
    ['mc_slap', 'mc_money', 'mc_buy'], 'mc_collection',
    {
      skin: SKIN, top: '#2a2a44', sleeves: '#2a2a44', gloves: SKIN, bottom: '#2a2a44', boots: '#1d1d2b', shirt: '#f4f4f8', tie: '#6b3fa0',
      hair: 'flat', hairColor: '#1d1d2b', eyes: 'lens', mouth: 'grin',
    }, { team: 'mint', bio: 'Mr. Mint üzlettársa. Ha egy figura eladó, ő már meg is vette. Kétszer.' });

  F('silkie_og', 'Ős-Silkie', 'brawn', 'rare', [120, 10, 12, 9],
    ['og_bite', 'og_goo', 'og_snooze'], 'og_ancient',
    retro('silkie', { skin: '#c8b89a' }),
    { team: 'titans', short: 'Ős-Silkie', bio: 'Az eredeti, régi Silkie-figura. Kicsit kopott, de ő volt az első.' });

  F('maeeye_other', 'Másik Mae-Eye', 'mystic', 'epic', [110, 14, 11, 12],
    ['me_pie', 'me_spell', 'me_bake'], 'me_pie_rain',
    {
      skin: '#7bd65b', top: '#6b3fa0', sleeves: '#6b3fa0', gloves: '#7bd65b', bottom: '#2a1a3a', boots: '#2a1a3a',
      hair: 'puffs', hairColor: '#6b3fa0', eyes: 'glow', eyeColor: '#ffd23f', mouth: 'grin',
    }, { team: 'villain', short: 'M. Mae-Eye', bio: 'Mother Mae-Eye gonoszabb ikre egy párhuzamos világból. A pitéje még elvarázsoltabb.' });

  // ---------- Multiverzum (Teeny Titans 2) ----------
  F('bwana_multi', 'Multiverzum Bwana Beast', 'brawn', 'legendary', [140, 15, 13, 10],
    ['mvb_claw', 'mvb_pig', 'mvb_rage'], 'mvb_merge',
    {
      skin: '#e2b088', top: '#1d1d2b', sleeves: '#e2b088', gloves: '#5fd3ff', bottom: '#1d1d2b', boots: '#1d1d2b', belt: '#ffd23f',
      hair: 'short', hairColor: '#1d1d2b', mask: '#f4f4f8', eyes: 'lens', mouth: 'grin', gear: ['horns'],
    }, { team: 'dc', short: 'Multi-Bwana', bio: 'Egy másik világ Bwana Beastje — a társa egy méhmalac. Igen, méhmalac.' });

  F('jinx_multi', 'Multiverzum Jinx', 'mystic', 'epic', [100, 14, 10, 14],
    ['mvj_hex', 'mvj_jinx', 'mvj_kick'], 'mvj_chaos',
    {
      skin: '#e8e8f0', top: '#1d1d2b', sleeves: '#1d1d2b', gloves: '#1d1d2b', bottom: '#1d1d2b', boots: '#1d1d2b',
      hair: 'jinx', hairColor: '#5fd3ff', eyes: 'dot', mouth: 'smirk',
    }, { team: 'hive', short: 'Multi-Jinx', bio: 'Jinx egy párhuzamos univerzumból. A balszerencséje itt még kékebb.' });

  F('silkie_multi', 'Multiverzum Silkie', 'mystic', 'epic', [120, 13, 12, 10],
    ['mvs_nibble', 'mvs_goo', 'mvs_bubble'], 'mvs_giant',
    retro('silkie', { skin: '#1d1d2b', spots: '#5fd3ff' }),
    { team: 'titans', short: 'Multi-Silkie', bio: 'Silkie egy sötét másik világból. Ugyanolyan aranyos, csak kicsit ijesztőbb.' });

  // Statisztikák kiegyenlítése: minden figura azonos "kerettel" indul, a különbséget
  // a szerep (HP/támadás/védekezés aránya) és a ritkaság adja.
  // (a lista legvégén, hogy a később felvett sorozatokra is vonatkozzon)
  for (const f of LIST) {
    const budget = f.hp / 10 + f.atk + f.def + (f.spd - 10) * 0.5;
    const k = 44 / budget;
    f.hp = Math.round(f.hp * k);
    f.atk = Math.round(f.atk * k * 10) / 10;
    f.def = Math.round(f.def * k * 10) / 10;
  }

  TT.FIG_LIST = LIST;
  TT.FIG = {};
  for (const f of LIST) {
    TT.FIG[f.id] = f;
    if (!f.short) f.short = f.name;
    for (const m of f.moves.concat([f.sup])) {
      if (!TT.MOVES[m]) console.warn('Hiányzó támadás:', m, f.id);
    }
  }

  // Gyűjthető sorozatok (a teljes sorozat teljesítményt ér)
  TT.SERIES = [
    { id: 'retro', name: 'Retró sorozat', short: 'Retró', ids: ['robin_80s', 'raven_80s', 'star_80s', 'bb_80s', 'cyborg_80s'] },
    { id: 'rad', name: 'Radikális sorozat', short: 'Radikális', ids: ['robin_rad', 'raven_rad', 'star_rad', 'bb_rad', 'cyborg_rad', 'silkie_rad'] },
    { id: 'special', name: 'Különleges változatok', short: 'Különleges', ids: ['bb_cat', 'bb_martian', 'aqualad_pirate', 'star_terrible', 'blood_robot', 'robin_nightwing'] },
    { id: 'dc', name: 'DC vendégek', short: 'DC', ids: ['dc_batman', 'dc_batgirl', 'dc_superman', 'dc_wonderwoman', 'dc_joker', 'dc_harley'] },
    { id: 'dcvillains', name: 'DC gonoszok', short: 'DC gonosz', ids: ['dc_lex', 'dc_darkseid', 'dc_riddler', 'dc_penguin', 'dc_ivy', 'dc_bane'] },
    { id: 'dcheroes', name: 'DC hősök', short: 'DC hős', ids: ['dc_flash', 'dc_aquaman', 'dc_supergirl', 'dc_shazam', 'dc_martian', 'dc_hawkgirl'] },
    { id: 'league', name: 'Liga-Titánok', short: 'Liga', ids: ['raven_wonder', 'star_flash', 'robin_bat', 'cyborg_lantern', 'dc_bwana', 'silkie_super'] },
    { id: 'oddballs', name: 'DC különcök', short: 'Különc', ids: ['dc_catwoman', 'dc_cheetah', 'dc_sinestro', 'dc_grodd', 'dc_bizarro', 'dc_swamp'] },
    { id: 'rookies', name: 'A Liga újoncai', short: 'Újonc', ids: ['dc_johnstewart', 'dc_jessica', 'dc_bluebeetle', 'dc_booster', 'dc_blacklightning', 'dc_vixen'] },
    { id: 'funny', name: 'Vicces változatok', short: 'Vicces', ids: ['dc_bathman', 'santa_claus', 'george_w', 'silkie_princess', 'trigon_argyle', 'cyborg_head'] },
    { id: 'friends', name: 'Titán-barátok', short: 'Barát', ids: ['nightwing_dad', 'red_arrow', 'rose_wilson', 'hooded_hood', 'bumblebee_justice', 'raven_legasus'] },
    { id: 'rarities', name: 'TT2 ritkaságok', short: 'Ritkaság', ids: ['clark_kent', 'wonder_twins', 'sticky_joe', 'mr_chibi', 'silkie_og', 'maeeye_other'] },
    { id: 'multiverse', name: 'Multiverzum', short: 'Multi', ids: ['bwana_multi', 'jinx_multi', 'silkie_multi'] },
  ];
  for (const ser of TT.SERIES) for (const id of ser.ids) TT.FIG[id].series = ser.id;

  // Változatok alapfigurája (kombókhoz)
  TT.baseOf = function (id) {
    if (id.startsWith('robin')) return 'robin';
    if (id.startsWith('raven')) return 'raven';
    if (id.startsWith('bb_') || id === 'beastboy') return 'beastboy';
    if (id.startsWith('cyborg')) return 'cyborg';
    if (id.startsWith('star_') || id === 'starfire') return 'starfire';
    if (id.startsWith('silkie')) return 'silkie';
    return id;
  };

  // Barátság-kombók: ha a társ pihen és él, a szuper támadás +30% sebzést kap, és a társ is beugrik
  TT.COMBOS = [
    ['robin', 'starfire', 'Titán-szívek'], ['cyborg', 'beastboy', 'Legjobb haverok'], ['raven', 'beastboy', 'Sötét és zöld'],
    ['terra', 'beastboy', 'Kőkemény barátság'], ['silkie', 'starfire', 'Silkie és a mamája'], ['robin', 'cyborg', 'Titán-taktika'],
    ['raven', 'starfire', 'Sötét és fény'], ['robin', 'larry', 'Nagy és kis Robin'], ['mad_mod', 'killer_moth', 'Gonosz divatbemutató'], ['jinx', 'kidflash', 'Szerencsés futás'], ['brain', 'mallah', 'Mester és társa'],
    ['rouge', 'brain', 'Testvériség'], ['mrmint', 'shrinkwrap', 'Gyári csomag'], ['speedy', 'aqualad', 'Kelet ereje'],
    ['bumblebee', 'masymenos', 'Kelet csípése'], ['gizmo', 'mammoth', 'H.I.V.E. haverok'], ['jinx', 'gizmo', 'H.I.V.E. Ötök'],
    ['slade', 'red_x', 'Árnyékok'], ['trigon', 'raven', 'Apa és lánya'], ['blackfire', 'starfire', 'Testvérharc'],
    ['boxbot', 'mintguard', 'Raktárcsapat'], ['cinderblock', 'plasmus', 'Nagy és ragacsos'], ['mumbo', 'controlfreak', 'Show-műsor'],
  ];
  TT.comboOf = function (a, b) {
    const x = TT.baseOf(a), y = TT.baseOf(b);
    if (x === y) return null;
    const c = TT.COMBOS.find((k) => (k[0] === x && k[1] === y) || (k[0] === y && k[1] === x));
    return c ? c[2] : null;
  };

  TT.TEAM_NAMES = { titans: 'Titánok', dc: 'Igazság Ligája', east: 'Titánok Kelet', hive: 'H.I.V.E.', villain: 'Gonoszok', mint: 'Menta-banda', brotherhood: 'Testvériség' };
})(window.TT);
