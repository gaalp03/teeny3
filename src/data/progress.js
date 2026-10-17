'use strict';
// Kupák, edzők, történet és jutalmak.
(function (TT) {
  const T = (id, lvl) => ({ id, lvl });

  // ---------- Csatakupola kupák ----------
  TT.CUPS = [
    {
      id: 'rookie', name: 'Újonc Kupa', color: '#3fa7ff', venue: 'dome', minLvl: 2,
      desc: 'Az első lépés a Teeny Titans 3 Világligában.',
      matches: [
        { name: 'Gizmo', who: 'gizmo', team: [T('gizmo', 2), T('mammoth', 1), T('seemore', 2)], ai: 0.18, coins: 90,
          intro: [{ who: 'gizmo', text: 'Ezek a ti figuráitok? Ócska műanyag! Az enyémek legalább kütyüsek!' }],
          outro: [{ who: 'gizmo', text: 'Ez nem ér! A kütyüim túlmelegedtek!' }] },
        { name: 'Mammoth', who: 'mammoth', team: [T('mammoth', 3), T('gizmo', 3), T('billy', 2)], ai: 0.24, coins: 100,
          intro: [{ who: 'mammoth', text: 'Mammoth ÖSSZETÖR! …Mármint a figurákkal. Szabályosan.' }],
          outro: [{ who: 'mammoth', text: 'Éhes vagyok. Megyek pizzázni.' }] },
        { name: 'Jinx', who: 'jinx', team: [T('jinx', 4), T('seemore', 3), T('kitten', 3)], ai: 0.3, coins: 120,
          intro: [{ who: 'jinx', text: 'Remélem, nem vagy babonás, Madárfiú. Mert ma balszerencsés napod lesz!' }],
          outro: [{ who: 'jinx', text: 'Hmpf. Szerencséd volt. Ez az én dolgom lenne!' }] },
      ],
      boss: { name: 'Control Freak', who: 'controlfreak', team: [T('controlfreak', 5), T('mumbo', 4), T('gizmo', 5)], ai: 0.38, coins: 250, music: 'boss',
        intro: [{ who: 'controlfreak', text: 'A Teeny Titans 3 minden figuráját ismerem! A hátoldali kódokat is! Te nem nyerhetsz!' }],
        outro: [{ who: 'controlfreak', text: 'Nem! A rajongói elméletem megdőlt!' }] },
      reward: { coins: 300, text: 'Megnyílt a Prémium doboz a Játékboltban és a H.I.V.E. negyed!' },
    },
    {
      id: 'east', name: 'Kelet Kupa', color: '#ffd23f', venue: 'dome', minLvl: 6, req: 'rookie',
      desc: 'A Titánok Kelet kihívása. Barátok, de nem kímélnek!',
      matches: [
        { name: 'Speedy', who: 'speedy', team: [T('speedy', 6), T('aqualad', 5), T('bumblebee', 5)], ai: 0.36, coins: 160,
          intro: [{ who: 'speedy', text: 'Egy nyíl, egy találat. Készen állsz, Robin?' }],
          outro: [{ who: 'speedy', text: 'Oké, ez most nem talált. Legközelebb!' }] },
        { name: 'Aqualad', who: 'aqualad', team: [T('aqualad', 7), T('silkie', 6), T('speedy', 6)], ai: 0.4, coins: 170,
          intro: [{ who: 'aqualad', text: 'A tenger ereje velem van. És néhány nagyon mérges hal.' }],
          outro: [{ who: 'aqualad', text: 'Szép volt. Úgy siklottál át rajtam, mint a hullám.' }] },
        { name: 'Bumblebee', who: 'bumblebee', team: [T('bumblebee', 8), T('masymenos', 7), T('kidflash', 7)], ai: 0.44, coins: 180,
          intro: [{ who: 'bumblebee', text: 'Kicsi vagyok, de csípős. Ezt most a saját bőrödön tanulod meg!' }],
          outro: [{ who: 'bumblebee', text: 'Rendben, Titánok. Ezt a kört ti nyertétek.' }] },
      ],
      boss: { name: 'Kid Flash', who: 'kidflash', team: [T('kidflash', 9), T('masymenos', 8), T('terra', 8)], ai: 0.48, coins: 400, music: 'boss',
        intro: [{ who: 'kidflash', text: 'Mire pislogsz, már vége is! Kid Flash, a leggyorsabb bajnok!' }],
        outro: [{ who: 'kidflash', text: 'Wow. Ezt nem láttam jönni. Pedig én mindent gyorsan látok!' }] },
      reward: { coins: 500, fig: 'masymenos', text: 'Megkaptad Más y Menos figuráját! A kikötő is megnyílt.' },
    },
    {
      id: 'villain', name: 'Gonosz Kupa', color: '#ff4f4f', venue: 'dome', minLvl: 10, req: 'east',
      desc: 'Jump City legrosszabb gonoszai — és a legjobb figuráik.',
      matches: [
        { name: 'Dr. Light', who: 'drlight', team: [T('drlight', 11), T('cinderblock', 10), T('plasmus', 10)], ai: 0.5, coins: 240,
          intro: [{ who: 'drlight', text: 'Készülj a… VAKUZÁSRA! Ha-ha! Értitek? Fény!' }],
          outro: [{ who: 'drlight', text: 'Elsötétült minden… szó szerint.' }] },
        { name: 'Mother Mae-Eye', who: 'maeye', team: [T('maeye', 12), T('kitten', 11), T('mumbo', 12)], ai: 0.54, coins: 260,
          intro: [{ who: 'maeye', text: 'Gyere ide, kicsikém! Mami sütött neked egy kis vereséget!' }],
          outro: [{ who: 'maeye', text: 'Ó, de neveletlen gyerekek! Szobafogság!' }] },
        { name: 'Blackfire', who: 'blackfire', team: [T('blackfire', 13), T('bloodbrother', 12), T('jinx', 13)], ai: 0.58, coins: 280,
          intro: [{ who: 'blackfire', text: 'Ha a húgocskám figuráit gyűjtöd, akkor az enyéimtől fogsz rettegni.' }],
          outro: [{ who: 'blackfire', text: 'Ezt még Starfire-nek se mondd el. Soha.' }] },
      ],
      boss: { name: 'Slade', who: 'slade', team: [T('slade', 14), T('cinderblock', 13), T('bloodbrother', 14)], ai: 0.64, coins: 600, music: 'boss',
        intro: [{ who: 'slade', text: 'Robin. Tudtam, hogy eljutsz idáig. Minden lépésedet előre láttam.' },
          { who: 'robin', text: 'Akkor azt is láttad, hogy most elverlek?' }],
        outro: [{ who: 'slade', text: 'Ügyes. De Mr. Mint már a következő lépésén dolgozik. Ő nem játszik… ő gyűjt.' }] },
      reward: { coins: 800, fig: 'slade', text: 'Megkaptad Slade legendás figuráját! Mr. Mint trezorja megnyílt északnyugaton. Kapható a Legendás doboz is!' },
    },
    {
      id: 'mint', name: 'Menta Kupa', color: '#7fe0b5', venue: 'vault', minLvl: 16, req: 'villain',
      desc: 'Mr. Mint saját bajnoksága a trezorban. Itt dől el minden.',
      matches: [
        { name: 'Menta Őrök', who: 'mintguard', team: [T('mintguard', 16), T('mintguard', 16), T('mintguard', 17)], ai: 0.6, coins: 320,
          intro: [{ who: 'mintguard', text: 'BEEP. Nem engedélyezett figura észlelve. Becsomagolás indul.' }],
          outro: [{ who: 'mintguard', text: 'HIBA. CSOMAGOLÓ MODUL… LEÁLLT. BOOP.' }] },
        { name: 'Dobozbot', who: 'boxbot', team: [T('boxbot', 17), T('mintguard', 17), T('boxbot', 18)], ai: 0.64, coins: 340,
          intro: [{ who: 'boxbot', text: 'KARTON. ERŐ. MAXIMUM. RAGASZTÓSZALAG.' }],
          outro: [{ who: 'boxbot', text: 'Szét… vagyok… nyitva…' }] },
        { name: 'Shrink Wrap', who: 'shrinkwrap', team: [T('shrinkwrap', 18), T('boxbot', 18), T('cinderblock', 18)], ai: 0.68, coins: 380,
          intro: [{ who: 'shrinkwrap', text: 'Mi lenne, ha szépen lefóliáználak? Örökre friss maradnál. Örökre mozdulatlan.' }],
          outro: [{ who: 'shrinkwrap', text: 'A fólia… kiszakadt! Mr. Mint ezt nem fogja szeretni.' }] },
      ],
      boss: { name: 'Mr. Mint', who: 'mrmint', team: [T('shrinkwrap', 19), T('trigon', 19), T('mrmint', 20)], ai: 0.72, coins: 1500, music: 'boss',
        intro: [{ who: 'mrmint', text: 'Ah, a Titánok. Tudjátok, mi a különbség köztünk? Ti JÁTSZOTOK a figurákkal.' },
          { who: 'mrmint', text: 'Én megőrzöm őket. Bontatlanul. Örökre. És most a ti figuráitok következnek.' },
          { who: 'robin', text: 'A figurák arra valók, hogy játsszanak velük! Titánok… HARCRA FEL!' }],
        outro: [{ who: 'mrmint', text: 'Nem… a gyűjteményem… KIBONTOTTÁK!' }] },
      reward: { coins: 2000, fig: 'mrmint', text: 'Legyőzted Mr. Mintet! A figurák szabadok! Megkaptad Mr. Mint figuráját.' },
    },
  ];
  TT.CUP = {};
  TT.CUPS.forEach((c, i) => { c.index = i; TT.CUP[c.id] = c; });

  // ---------- Térképen lévő edzők ----------
  TT.TRAINERS = {
    tutorial: { name: 'Cyborg (edzés)', who: 'cyborg', team: [T('cyborg', 1), T('starfire', 1)], ai: 0.1, coins: 60, bg: 'tower', tutorial: true,
      intro: [{ who: 'cyborg', text: 'Na lássuk, Robin! Mielőtt a Világligába mész, egy gyors edzés. Ne kímélj!' }],
      outro: [{ who: 'cyborg', text: 'BOOYAH! Ez az! Fogd, itt a figuránk — mostantól a csapatod része vagyunk!' }],
      reward: { figs: ['cyborg', 'starfire'] } },
    pete: { name: 'Pizzás Peti', who: 'kid_pete', team: [T('gizmo', 2), T('billy', 2)], ai: 0.18, coins: 80, bg: 'street',
      intro: [{ who: 'kid_pete', text: 'Hé! Pizzára fogadok, hogy nem versz meg!' }],
      outro: [{ who: 'kid_pete', text: 'Jó, jó… a pizza a tiéd. Szimbolikusan.' }] },
    ann: { name: 'Park Panni', who: 'kid_ann', team: [T('silkie', 3), T('kitten', 3)], ai: 0.22, coins: 100, bg: 'park', reward: { figs: ['silkie'] },
      intro: [{ who: 'kid_ann', text: 'A Silkie-m a legcukibb figura a világon! Gyere, harcolj vele!' }],
      outro: [{ who: 'kid_ann', text: 'Silkie szerint megérdemled. Itt egy példány neked is!' }] },
    zoe: { name: 'Zoé', who: 'kid_zoe', team: [T('jinx', 4), T('seemore', 5), T('mumbo', 4)], ai: 0.3, coins: 120, bg: 'street',
      intro: [{ who: 'kid_zoe', text: 'A gonosz figurák a legjobbak. Bebizonyítom!' }],
      outro: [{ who: 'kid_zoe', text: 'Oké, a hősök is menők. Néha.' }] },
    geza: { name: 'Gyűjtő Géza', who: 'kid_geza', team: [T('robin_ninja', 6), T('bb_cowboy', 6), T('star_sleepy', 6)], ai: 0.36, coins: 160, bg: 'street',
      intro: [{ who: 'kid_geza', text: 'Ritka változatok, kizárólag! Az átlagos figurák alattam vannak.' }],
      outro: [{ who: 'kid_geza', text: 'Hát… ritka vereség volt. Legalább gyűjthető.' }] },
    max: { name: 'Strand Max', who: 'kid_max', team: [T('aqualad', 5), T('bumblebee', 4), T('speedy', 4)], ai: 0.32, coins: 130, bg: 'beach',
      intro: [{ who: 'kid_max', text: 'Strandszezon, csataszezon! Gyerünk!' }],
      outro: [{ who: 'kid_max', text: 'Hullámvölgy. Megyek, csobbanok egyet.' }] },
    hive1: { name: 'H.I.V.E. kadét', who: 'kid_hive', team: [T('gizmo', 7), T('mammoth', 7), T('jinx', 7)], ai: 0.4, coins: 200, bg: 'hive',
      intro: [{ who: 'kid_hive', text: 'Behatoló! A H.I.V.E. Akadémia területén vagy!' }],
      outro: [{ who: 'kid_hive', text: 'Jelentenem kell Brother Bloodnak…' }] },
    hive2: { name: 'H.I.V.E. prefektus', who: 'kid_hive2', team: [T('billy', 9), T('kitten', 8), T('seemore', 9)], ai: 0.45, coins: 220, bg: 'hive',
      intro: [{ who: 'kid_hive2', text: 'Ezen a folyosón nem jutsz át! …Mármint ezen a járdán.' }],
      outro: [{ who: 'kid_hive2', text: 'Az igazgató úr nem lesz boldog.' }] },
    blood: { name: 'Brother Blood', who: 'bloodbrother', team: [T('bloodbrother', 11), T('jinx', 10), T('mammoth', 11)], ai: 0.52, coins: 400, bg: 'hive', music: 'boss',
      reward: { figs: ['bloodbrother'] },
      intro: [{ who: 'bloodbrother', text: 'Üdvözöllek az Akadémiámon, Robin. Itt minden figura nekem engedelmeskedik.' }],
      outro: [{ who: 'bloodbrother', text: 'Lenyűgöző… Vidd a figurámat. Úgyis Mr. Mint vinné el.' }] },
    docks: { name: 'Kikötői Kázmér', who: 'kid_docks', team: [T('plasmus', 11), T('cinderblock', 10), T('aqualad', 11)], ai: 0.5, coins: 300, bg: 'beach',
      intro: [{ who: 'kid_docks', text: 'A kikötő az én terepem. A nagy figurák itt laknak!' }],
      outro: [{ who: 'kid_docks', text: 'Elsüllyedtem. Mint egy horgony.' }] },
    scout: { name: 'Menta felderítő', who: 'mintguard', team: [T('mintguard', 13), T('boxbot', 13), T('mintguard', 14)], ai: 0.55, coins: 320, bg: 'vault',
      intro: [{ who: 'mintguard', text: 'BEEP. A trezor zárva. Belépés csak a Gonosz Kupa győztesének.' }],
      outro: [{ who: 'mintguard', text: 'BOOP. Továbbengedés… nem jóváhagyva… de nem tudok mit tenni.' }] },
  };

  // ---------- Dobozok a boltban ----------
  TT.BOXES = [
    { id: 'basic', name: 'Alap doboz', price: 150, color: '#3fa7ff', odds: { common: 66, rare: 28, epic: 6 }, desc: 'Gyakori és ritka figurák, kis eséllyel epikus.' },
    { id: 'premium', name: 'Prémium doboz', price: 450, color: '#c06bff', odds: { rare: 62, epic: 32, legendary: 6 }, req: 'rookie', desc: 'Ritka vagy jobb! Esély legendásra.' },
    { id: 'legend', name: 'Legendás doboz', price: 1200, color: '#ffc93c', odds: { epic: 72, legendary: 28 }, req: 'villain', desc: 'Csak epikus és legendás figurák.' },
  ];

  // Egy doboz kinyitása: visszaadja a figura azonosítóját
  TT.rollBox = function (box) {
    const rar = TT.U.weighted(box.odds);
    let pool = TT.FIG_LIST.filter((f) => f.rarity === rar && !f.noBox);
    if (!pool.length) pool = TT.FIG_LIST.filter((f) => !f.noBox);
    // enyhe előny a még nem birtokolt figuráknak
    const owned = TT.save.owned;
    const weighted = pool.map((f) => ({ v: f.id, w: owned[f.id] ? 1 : 1.8 }));
    return TT.U.weighted(weighted);
  };

  // ---------- Szint és figura kezelés ----------
  // Figura hozzáadása; ha már megvan, XP-t ad. Visszaad: {isNew, xp, lvlUps}
  TT.grantFigure = function (id) {
    const own = TT.save.owned;
    if (!own[id]) {
      const top = Math.max(1, ...Object.values(own).map((o) => o.lvl));
      own[id] = { lvl: Math.max(1, Math.round(top * 0.75)), xp: 0, n: 1 };
      return { isNew: true, xp: 0, lvlUps: 0 };
    }
    const before = TT.starsOf(id);
    own[id].n = (own[id].n || 1) + 1;
    const xp = TT.RARITY[TT.FIG[id].rarity].dupeXp;
    const lv = TT.addXp(id, xp);
    const stars = TT.starsOf(id);
    return { isNew: false, xp, lvlUps: lv, stars, starUp: stars > before };
  };

  TT.addXp = function (id, amount) {
    const o = TT.save.owned[id];
    if (!o) return 0;
    let ups = 0;
    o.xp += amount;
    while (o.lvl < TT.MAX_LVL && o.xp >= TT.xpToNext(o.lvl)) {
      o.xp -= TT.xpToNext(o.lvl);
      o.lvl++;
      ups++;
    }
    if (o.lvl >= TT.MAX_LVL) o.xp = 0;
    return ups;
  };

  TT.cupDone = (id) => !!(TT.save && TT.save.cups[id]);
  TT.cupsDone = () => TT.CUPS.filter((c) => TT.cupDone(c.id)).length;

  // Aktuális cél szövege a HUD-hoz
  TT.objective = function () {
    const s = TT.save;
    if (!s) return '';
    if (!s.flags.tutorial) return 'Beszélj Cyborggal a Titánok Tornya előtt az edzéshez!';
    if (!TT.cupDone('rookie')) return 'Menj a Csatakupolába, és nyerd meg az Újonc Kupát!';
    if (!TT.cupDone('east')) return 'Nyerd meg a Kelet Kupát! (Tipp: nézz be a H.I.V.E. negyedbe is.)';
    if (!TT.cupDone('villain')) return 'Nyerd meg a Gonosz Kupát a Csatakupolában!';
    if (!TT.cupDone('mint')) return 'Irány Mr. Mint trezorja északnyugaton! Nyerd meg a Menta Kupát!';
    return 'Győztél! Próbáld ki a Végtelen Arénát, és gyűjtsd össze mind a ' + TT.FIG_LIST.length + ' figurát!';
  };
})(window.TT);
