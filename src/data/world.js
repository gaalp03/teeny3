'use strict';
// Jump City térképe (kódból generálva), épületek, NPC-k, rejtett figurák.
(function (TT) {
  const U = TT.U;
  const TS = 32;
  const MW = 100, MH = 72;

  const T = {
    WATER: 0, GRASS: 1, ROAD: 2, WALK: 3, SAND: 4, PLAZA: 5, BRIDGE: 6, TREE: 7, FLOWER: 8,
    HEDGE: 9, FENCE: 10, ROCK: 11, DARK: 12, MINT: 13, DOCK: 14, CROSS: 15, POND: 16, TALL: 17,
  };
  const SOLID = new Set([T.WATER, T.TREE, T.HEDGE, T.FENCE, T.ROCK, T.POND]);

  function build() {
    const map = new Uint8Array(MW * MH);
    const idx = (x, y) => y * MW + x;
    const get = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH ? T.WATER : map[idx(x, y)]);
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MW && y < MH) map[idx(x, y)] = v; };
    const rect = (x, y, w, h, v, only) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (!only || only.includes(get(i, j))) set(i, j, v);
    };
    const disc = (cx, cy, r, v) => {
      for (let j = Math.floor(cy - r - 1); j <= cy + r + 1; j++) for (let i = Math.floor(cx - r - 1); i <= cx + r + 1; i++) {
        if (Math.hypot(i + 0.5 - cx, j + 0.5 - cy) <= r) set(i, j, v);
      }
    };

    map.fill(T.WATER);
    // fősziget hullámos parttal
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const dx = Math.max(0, Math.abs(x + 0.5 - 50) - 43);
      const dy = Math.max(0, Math.abs(y + 0.5 - 40) - 18.5);
      const d = Math.hypot(dx, dy);
      const margin = 2.6 + Math.sin(x * 0.45) * 0.7 + Math.cos(y * 0.6 + 1) * 0.6;
      if (d < margin) set(x, y, T.GRASS);
    }
    // part menti homok
    const copy = map.slice();
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (copy[idx(x, y)] !== T.GRASS) continue;
      let near = false;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const v = x + i < 0 || y + j < 0 || x + i >= MW || y + j >= MH ? T.WATER : copy[idx(x + i, y + j)];
        if (v === T.WATER) near = true;
      }
      if (near || y >= 56) set(x, y, T.SAND);
    }
    // torony sziget és trezor sziget
    disc(84.5, 10, 5.8, T.GRASS);
    disc(84.5, 10.5, 3.9, T.PLAZA);
    disc(15.5, 8, 6.6, T.MINT);
    rect(83, 15, 2, 5, T.BRIDGE, [T.WATER, T.SAND, T.GRASS]);
    rect(15, 13, 2, 7, T.BRIDGE, [T.WATER, T.SAND]);
    rect(15, 15, 2, 4, T.BRIDGE);

    // utak + járdák
    const roads = [
      [5, 29, 91, 2], [5, 45, 91, 2],
      [29, 20, 2, 36], [56, 20, 2, 36], [83, 19, 2, 37], [15, 19, 2, 10],
    ];
    for (const [x, y, w, h] of roads) rect(x - 1, y - 1, w + 2, h + 2, T.WALK, [T.GRASS, T.SAND]);
    for (const [x, y, w, h] of roads) rect(x, y, w, h, T.ROAD);
    // zebrák a kereszteződéseknél
    for (const vx of [29, 56, 83]) for (const hy of [29, 45]) {
      rect(vx, hy - 2, 2, 1, T.CROSS);
      rect(vx, hy + 2, 2, 1, T.CROSS);
      rect(vx - 2, hy, 1, 2, T.CROSS);
      rect(vx + 2, hy, 1, 2, T.CROSS);
    }
    // terek
    rect(32, 20, 23, 8, T.PLAZA, [T.GRASS]);
    rect(32, 32, 23, 12, T.PLAZA, [T.GRASS]);
    rect(59, 32, 23, 12, T.PLAZA, [T.GRASS]);
    // park
    rect(5, 32, 23, 12, T.GRASS, [T.GRASS, T.SAND]);
    disc(14, 37.5, 2.6, T.POND);
    rect(5, 37, 23, 1, T.PLAZA, [T.GRASS]);
    rect(21, 32, 1, 12, T.PLAZA, [T.GRASS]);
    // H.I.V.E. negyed
    rect(86, 47, 10, 11, T.HEDGE, [T.GRASS, T.SAND, T.WALK]);
    rect(87, 48, 8, 9, T.DARK);
    rect(86, 51, 1, 2, T.DARK);
    // kikötő
    rect(40, 57, 3, 12, T.DOCK, [T.WATER, T.SAND]);
    rect(36, 66, 11, 2, T.DOCK, [T.WATER]);

    return { map, get, set };
  }

  // Épületek: tx,ty,w,h csempében; door: belépési pont
  const BUILDINGS = [
    { id: 'tower', kind: 'tower', x: 82, y: 6, w: 5, h: 4, door: [84.5, 10.6], name: 'Titánok Tornya' },
    { id: 'toyshop', kind: 'shop', x: 37, y: 21, w: 8, h: 4, door: [41, 25.6], name: 'Teeny Játékbolt' },
    { id: 'dome', kind: 'dome', x: 62, y: 33, w: 14, h: 7, door: [69, 40.6], name: 'Csatakupola' },
    { id: 'pizza', kind: 'pizza', x: 36, y: 33, w: 7, h: 4, door: [39.5, 37.6], name: 'Pizzéria' },
    { id: 'hive', kind: 'hive', x: 88, y: 48, w: 6, h: 4, door: [91, 52.6], name: 'H.I.V.E. Akadémia' },
    { id: 'vault', kind: 'vault', x: 11, y: 3, w: 9, h: 4, door: [15.5, 7.6], name: 'Mint Trezor' },
    { id: 'comics', kind: 'comics', x: 46, y: 21, w: 6, h: 4, door: [49, 25.6], name: 'Képregénybolt' },
    { id: 'factory', kind: 'factory', x: 73, y: 48, w: 7, h: 3, door: [76.5, 51.6], name: 'Menta Gyár' },
  ];
  const HOUSES = [
    [6, 21], [13, 21], [20, 21], [60, 21], [67, 21], [74, 21],
    [6, 48], [13, 48], [20, 48], [33, 48], [40, 48], [47, 48], [60, 48], [67, 48],
  ];
  HOUSES.forEach(([x, y], i) => BUILDINGS.push({ id: 'house' + i, kind: 'house', x, y, w: 5, h: 3, seed: i }));

  // Díszítő tárgyak (szilárdak)
  const PROPS = [
    { kind: 'fountain', x: 47, y: 39, w: 3, h: 2 },
    { kind: 'statue', x: 74, y: 42.3, w: 1, h: 1 },
    { kind: 'bench', x: 9, y: 34, w: 2, h: 1 },
    { kind: 'bench', x: 17, y: 41, w: 2, h: 1 },
    { kind: 'bench', x: 34, y: 41, w: 2, h: 1 },
    { kind: 'lamp', x: 33, y: 31.2 }, { kind: 'lamp', x: 54, y: 31.2 }, { kind: 'lamp', x: 60, y: 31.2 },
    { kind: 'lamp', x: 81, y: 31.2 }, { kind: 'lamp', x: 33, y: 44 }, { kind: 'lamp', x: 81, y: 44 },
    { kind: 'umbrella', x: 47, y: 58 }, { kind: 'umbrella', x: 58, y: 59 }, { kind: 'umbrella', x: 24, y: 58 },
    { kind: 'umbrella', x: 70, y: 58 },
    { kind: 'sign', x: 86.5, y: 13.4, text: 'Titánok Tornya' },
    { kind: 'sign', x: 17, y: 21.2, text: 'Mint Trezor' },
    { kind: 'crate', x: 43, y: 64 }, { kind: 'crate', x: 44, y: 64 }, { kind: 'crate', x: 37, y: 66 },
    { kind: 'hydrant', x: 28, y: 33 }, { kind: 'hydrant', x: 58, y: 27 },
  ];

  // Útzárak — feloldódnak a kupák után
  const GATES = [
    { id: 'hivegate', x: 86, y: 51, w: 1, h: 2, req: 'rookie', text: 'Zárva! Előbb nyerd meg az Újonc Kupát.' },
    { id: 'dockgate', x: 40, y: 62, w: 3, h: 1, req: 'east', text: 'A kikötő zárva. Nyerd meg a Kelet Kupát!' },
    { id: 'vaultgate', x: 15, y: 17, w: 2, h: 1, req: 'villain', text: 'A trezor hídja zárva. Nyerd meg a Gonosz Kupát!' },
  ];

  // NPC-k: talk = párbeszéd, trainer = edző azonosító
  const NPCS = [
    { id: 'cyborg_t', who: 'cyborg', x: 87.2, y: 12, trainer: 'tutorial', dir: 'left' },
    { id: 'star_t', who: 'starfire', x: 81.6, y: 12.3, talk: 'starfire' },
    { id: 'bb_t', who: 'beastboy', x: 44, y: 27, talk: 'beastboy' },
    { id: 'raven_t', who: 'raven', x: 9, y: 35.5, talk: 'raven' },
    { id: 'silkie_t', who: 'silkie', x: 81, y: 14, talk: 'silkie' },
    { id: 'announcer', who: 'kid_bela', x: 66, y: 42, talk: 'announcer' },
    { id: 'pete', who: 'kid_pete', x: 35, y: 39, trainer: 'pete' },
    { id: 'ann', who: 'kid_ann', x: 24, y: 40, trainer: 'ann' },
    { id: 'zoe', who: 'kid_zoe', x: 52, y: 35, trainer: 'zoe' },
    { id: 'geza', who: 'kid_geza', x: 52, y: 26, trainer: 'geza' },
    { id: 'max', who: 'kid_max', x: 52, y: 58, trainer: 'max' },
    { id: 'hive1', who: 'kid_hive', x: 89, y: 55, trainer: 'hive1' },
    { id: 'hive2', who: 'kid_hive2', x: 93.5, y: 55, trainer: 'hive2' },
    { id: 'blood', who: 'bloodbrother', x: 94, y: 52.5, trainer: 'blood' },
    { id: 'docks', who: 'kid_docks', x: 41, y: 65, trainer: 'docks' },
    { id: 'scout', who: 'mintguard', x: 17.5, y: 19.5, trainer: 'scout' },
    { id: 'granny', who: 'kid_granny', x: 25, y: 26, talk: 'granny' },
    { id: 'pizzaguy', who: 'kid_pizza', x: 42.5, y: 38.5, talk: 'pizzaguy' },
    { id: 'tourist', who: 'kid_tourist', x: 64, y: 57, talk: 'tourist' },
    { id: 'redx', who: 'red_x', x: 38, y: 66.6, trainer: 'redx', dir: 'right' },
    { id: 'madmod', who: 'mad_mod', x: 47.5, y: 33, trainer: 'madmod', dir: 'down' },
    { id: 'trigon', who: 'trigon', x: 80.5, y: 7.6, trainer: 'trigon', dir: 'right' },
    { id: 'league', who: 'dc_wonderwoman', x: 70, y: 44, trainer: 'league', dir: 'left' },
    { id: 'joker', who: 'dc_joker', x: 38, y: 43.5, trainer: 'joker', dir: 'down' },
    { id: 'lex', who: 'dc_lex', x: 18.5, y: 9.2, trainer: 'lex', dir: 'left' },
    { id: 'bizarro', who: 'dc_bizarro', x: 74, y: 59.5, trainer: 'bizarro', dir: 'left' },
    { id: 'hood', who: 'hooded_hood', x: 18.5, y: 36, trainer: 'hood', dir: 'left' },
  ];

  // Rejtett figurák és érmék
  const HIDDEN = [
    { id: 'h_gorilla', x: 6, y: 33, fig: 'bb_gorilla' },
    { id: 'h_whiteraven', x: 8, y: 59, fig: 'raven_white' },
    { id: 'h_rockrobin', x: 55, y: 22, fig: 'robin_rock' },
    { id: 'h_sleepy', x: 88.6, y: 8.2, fig: 'star_sleepy' },
    { id: 'h_rage', x: 87.5, y: 49.2, fig: 'raven_rage' },
    { id: 'h_mega', x: 46, y: 67, fig: 'cyborg_mega' },
    { id: 'h_ultra', x: 10, y: 9, fig: 'robin_ultra' },
    { id: 'h_cowboy', x: 93, y: 43, fig: 'bb_cowboy' },
    { id: 'h_larry', x: 93.5, y: 36.5, fig: 'larry' },
    { id: 'c1', x: 26, y: 42, coins: 60 }, { id: 'c2', x: 3.5, y: 40, coins: 80 }, { id: 'c3', x: 61, y: 26, coins: 70 },
    { id: 'c4', x: 78, y: 26, coins: 90 }, { id: 'c5', x: 30, y: 60, coins: 120 }, { id: 'c6', x: 90, y: 30, coins: 100 },
    { id: 'c7', x: 79, y: 52, coins: 110 }, { id: 'c8', x: 20, y: 11, coins: 250 }, { id: 'c9', x: 8, y: 52, coins: 90 },
    { id: 'c10', x: 72, y: 60, coins: 150 },
  ];

  // Silkie elveszett játékai (mellékküldetés)
  const TOYS = [
    { id: 't_duck', x: 11, y: 41.5, name: 'gumikacsa' },
    { id: 't_ball', x: 62, y: 59, name: 'labda' },
    { id: 't_sock', x: 53.5, y: 21.5, name: 'zokni' },
    { id: 't_bone', x: 92, y: 56, name: 'rágócsont' },
    { id: 't_bear', x: 45, y: 67, name: 'plüssmaci' },
    { id: 't_yarn', x: 24, y: 53, name: 'gombolyag' },
  ];

  // Menta-járőrök útvonalai (az Újonc Kupa után jelennek meg)
  const PATROLS = [
    { id: 'p1', path: [[8, 29.5], [52, 29.5]] },
    { id: 'p2', path: [[60, 45.5], [92, 45.5]] },
    { id: 'p3', path: [[56.5, 22], [56.5, 54]] },
    { id: 'p4', path: [[29.5, 33], [29.5, 54]] },
    { id: 'p5', path: [[12, 59.5], [36, 59.5]] },
  ];

  // NPC kinézetek (nem gyűjthető karakterek)
  const kid = (top, bottom, hair, hairColor, skin, extra) => Object.assign({
    skin: skin || '#f6cba8', top, bottom, boots: '#3a3a52', hair, hairColor, eyes: 'dot', mouth: 'smile',
  }, extra || {});
  TT.NPC_LOOKS = {
    kid_pete: { name: 'Pizzás Peti', look: kid('#ff6b35', '#3b5998', 'messy', '#6b3f1d', null, { gear: ['cap'] }) },
    kid_ann: { name: 'Park Panni', look: kid('#7bd65b', '#f4d35e', 'puffs', '#e85d04') },
    kid_zoe: { name: 'Zoé', look: kid('#6b2fa0', '#1d1d2b', 'bob', '#1d1d2b', '#e2b088', { mouth: 'smirk' }) },
    kid_geza: { name: 'Gyűjtő Géza', look: kid('#f4f4f8', '#5a5a66', 'flat', '#8b5a2b', null, { gear: ['goggles_up'], mouth: 'smirk' }) },
    kid_max: { name: 'Strand Max', look: kid('#4fc3f7', '#ff9ecd', 'swoop', '#f4d35e', '#e2b088', { mouth: 'grin' }) },
    kid_hive: { name: 'H.I.V.E. kadét', look: kid('#5a4a3a', '#2a2a3a', 'short', '#1d1d2b', null, { stripe: '#ffd23f', mouth: 'frown' }) },
    kid_hive2: { name: 'H.I.V.E. prefektus', look: kid('#2a2a3a', '#2a2a3a', 'flat', '#e85d04', null, { stripe: '#ffd23f', mouth: 'smirk', gear: ['goggles_up'] }) },
    kid_docks: { name: 'Kikötői Kázmér', look: kid('#1e3a5f', '#3a3a52', 'bald', null, '#c68a5a', { stripes: '#f4f4f8', gear: ['cowboy_hat'], hatColor: '#1d1d2b', mouth: 'grin' }) },
    kid_bela: { name: 'Bemondó Béla', look: kid('#d62828', '#1d1d2b', 'flat', '#1d1d2b', null, { shirt: '#ffffff', tie: '#ffd23f', mouth: 'grin' }) },
    kid_granny: { name: 'Mama', look: kid('#9d4edd', '#9d4edd', 'bun', '#d0d0d8', null, { skirt: true, apron: '#f4f4f8' }) },
    kid_pizza: { name: 'Pizzaszakács', look: kid('#f4f4f8', '#3a3a52', 'short', '#1d1d2b', null, { apron: '#ffffff', gear: ['mustache'], mouth: 'grin' }) },
    kid_tourist: { name: 'Turista', look: kid('#ffd23f', '#3b5998', 'short', '#8b5a2b', null, { dots: '#ff4f81', gear: ['cowboy_hat'], hatColor: '#f4d35e' }) },
    mrmint_npc: { name: 'Mr. Mint', look: null },
  };

  // Párbeszédek
  TT.TALKS = {
    starfire: () => TT.save.flags.tutorial ? [
      { who: 'starfire', text: 'Robin! Tudtad, hogy a figurák TÍPUSAI számítanak? Erő legyőzi a Techet, a Tech a Misztikust, a Misztikus a Gyorsaságot, a Gyorsaság az Erőt!' },
      { who: 'starfire', text: 'Ha erős típussal támadsz, 30%-kal nagyobbat ütsz — gyenge ellen pedig kisebbet. Ez dicsőséges!' },
      { who: 'starfire', text: 'És a ritkaság is számít: Gyakori > Legendás > Epikus > Ritka > Gyakori. Ez +15% sebzés! Még a kis figurák is legyőzhetik a nagyokat!' },
    ] : [{ who: 'starfire', text: 'Cyborg vár rád az edzésre! Utána mehetsz a Csatakupolába, az nagyon dicsőséges!' }],
    beastboy: () => [
      { who: 'beastboy', text: 'Dude! A Játékboltban dobozokat lehet venni, bennük véletlenszerű figurákkal!' },
      { who: 'beastboy', text: 'Ha duplát kapsz, az se baj: a figura tapasztalatot kap tőle. A rejtett figurákat meg csillogás jelzi a térképen!' },
    ],
    raven: () => {
      const s = TT.save;
      if (s.beaten.trigon) {
        return [{ who: 'raven', text: 'Apa elment. Azarath fénye most már velem van… és veletek. Köszönöm, Titánok.' }];
      }
      if (s.beaten.redx && TT.cupDone('brotherhood')) {
        return [
          { who: 'raven', text: 'Érzem… valami szörnyű közeleg. Apám, Trigon. A Torony szigetén nyílik meg a kapuja.' },
          { who: 'raven', text: 'Ő a legerősebb ellenfél, akivel valaha harcoltunk. Csak a legerősebb csapattal menj!' },
        ];
      }
      return [
        { who: 'raven', text: 'A blokkolás nem gyávaság. Ha pont a találat előtt tartod a pajzsot, TÖKÉLETES blokk lesz.' },
        { who: 'raven', text: 'Akkor nulla sebzést kapsz, és a támadó egy pillanatra megszédül. …Ne nézz így rám. Olvastam róla.' },
      ];
    },
    silkie: () => {
      const s = TT.save;
      s.toys = s.toys || {};
      const n = TOYS.filter((t) => s.toys[t.id]).length;
      if (!s.flags.tutorial) return [{ who: 'silkie', text: '*álmos Silkie hangok*' }];
      if (!s.flags.silkieQuest) {
        s.flags.silkieQuest = true;
        TT.store.write();
        return [
          { who: 'silkie', text: '*szomorú Silkie hangok*' },
          { who: 'starfire', text: 'Ó, nem! Silkie elveszítette hat kedvenc játékát a városban!' },
          { who: 'starfire', text: 'Rózsaszín szívecskék jelzik, hol vannak. Megkeresed őket? Silkie nagyon hálás lesz!' },
        ];
      }
      if (s.flags.silkieDone) return [{ who: 'silkie', text: '*boldog Silkie hangok*' }, { who: 'starfire', text: 'Silkie azóta is a gumikacsájával alszik. Köszönjük!' }];
      if (n < TOYS.length) return [{ who: 'silkie', text: '*reménykedő Silkie hangok*' }, { who: 'starfire', text: `Még ${TOYS.length - n} játék hiányzik! A térképen (M) is keresd a rózsaszín pontokat.` }];
      return null; // a jutalmat a világ jelenet adja
    },
    announcer: () => [
      { who: 'kid_bela', text: 'Üdv a Csatakupolában! Itt zajlik a Teeny Titans 3 Világliga!' },
      { who: 'kid_bela', text: 'Minden kupában három meccs és egy főellenség vár. Nyerj, és a város új részei nyílnak meg!' },
    ],
    granny: () => [
      { who: 'kid_granny', text: 'Az én időmben még ólomkatonákkal játszottunk, fiam.' },
      { who: 'kid_granny', text: 'Na de ha már itt vagy: a park bokraiban láttam valami zöldet csillogni. Lehet, hogy gorilla.' },
    ],
    pizzaguy: () => [
      { who: 'kid_pizza', text: 'Pizza? Figurák? A Titánok kedvenc kettőse!' },
      { who: 'kid_pizza', text: 'A Toronyban a csapatodat is rendezheted, és ott mentheted a játékot. Mamma mia!' },
    ],
    tourist: () => [
      { who: 'kid_tourist', text: 'Jump City gyönyörű! Bár valaki egy szürke ládát hagyott a kikötő végén…' },
      { who: 'kid_tourist', text: 'Ja, és a keleti parton egy pici, Robinra hasonlító alak kuncogott a homokban. Furcsa egy város ez!' },
    ],
  };

  const W = build();

  // Fák és virágok szórása — a foglalt helyek (épületek, NPC-k, ajtók) kihagyásával
  (function decorate() {
    const rnd = U.rng(777);
    const reserved = new Set();
    const res = (x, y) => reserved.add(Math.floor(x) + ',' + Math.floor(y));
    for (const b of BUILDINGS) {
      for (let j = b.y - 1; j <= b.y + b.h + 1; j++) for (let i = b.x - 1; i <= b.x + b.w; i++) res(i, j);
    }
    for (const p of PROPS) for (let j = -1; j <= (p.h || 1); j++) for (let i = -1; i <= (p.w || 1); i++) res(p.x + i, p.y + j);
    for (const n of NPCS) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) res(n.x + i, n.y + j);
    for (const h of HIDDEN.concat(TOYS)) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) res(h.x + i, h.y + j);
    for (const g of GATES) for (let j = -1; j <= g.h; j++) for (let i = -1; i <= g.w; i++) res(g.x + i, g.y + j);
    for (let j = 5; j <= 16; j++) for (let i = 79; i <= 90; i++) res(i, j);
    const nearRoad = (x, y) => {
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const v = W.get(x + i, y + j);
        if (v === T.WALK || v === T.ROAD || v === T.CROSS || v === T.PLAZA || v === T.BRIDGE) return true;
      }
      return false;
    };
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const v = W.get(x, y);
      if (reserved.has(x + ',' + y)) continue;
      if (v === T.GRASS) {
        if (nearRoad(x, y)) {
          if (rnd() < 0.08) W.set(x, y, T.FLOWER);
          continue;
        }
        const park = x >= 5 && x <= 27 && y >= 32 && y <= 43;
        const edge = park && (x <= 6 || x >= 26 || y <= 32 || y >= 43);
        const island = y < 16;
        const p = edge ? 0.5 : park ? 0.08 : island ? 0.12 : 0.1;
        const r = rnd();
        if (r < p) W.set(x, y, T.TREE);
        else if (r < p + 0.1) W.set(x, y, T.FLOWER);
      } else if (v === T.SAND && y < 56 && rnd() < 0.03 && !nearRoad(x, y)) {
        W.set(x, y, T.ROCK);
      } else if (v === T.DARK && rnd() < 0.04 && !nearRoad(x, y)) {
        W.set(x, y, T.ROCK);
      } else if (v === T.MINT && Math.abs(x + 0.5 - 15.5) > 2.6 && rnd() < 0.08) {
        W.set(x, y, T.HEDGE);
      }
    }
  })();

  TT.WORLD = {
    TS, MW, MH, T, SOLID,
    map: W.map,
    tile: W.get,
    buildings: BUILDINGS, props: PROPS, gates: GATES, npcs: NPCS, hidden: HIDDEN, toys: TOYS, patrols: PATROLS,
    start: { x: 84.5, y: 12 },
  };
})(window.TT);
