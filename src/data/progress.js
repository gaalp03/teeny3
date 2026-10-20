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
      boss: { name: 'Control Freak', who: 'controlfreak', team: [T('controlfreak', 5), T('mumbo', 4), T('gizmo', 5)], ai: 0.32, coins: 250, music: 'boss',
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
        { name: 'Dr. Light', who: 'drlight', team: [T('drlight', 11), T('cinderblock', 10), T('plasmus', 10)], ai: 0.42, coins: 240,
          intro: [{ who: 'drlight', text: 'Készülj a… VAKUZÁSRA! Ha-ha! Értitek? Fény!' }],
          outro: [{ who: 'drlight', text: 'Elsötétült minden… szó szerint.' }] },
        { name: 'Mother Mae-Eye', who: 'maeye', team: [T('maeye', 12), T('kitten', 11), T('mumbo', 12)], ai: 0.46, coins: 260,
          intro: [{ who: 'maeye', text: 'Gyere ide, kicsikém! Mami sütött neked egy kis vereséget!' }],
          outro: [{ who: 'maeye', text: 'Ó, de neveletlen gyerekek! Szobafogság!' }] },
        { name: 'Blackfire', who: 'blackfire', team: [T('blackfire', 13), T('bloodbrother', 12), T('jinx', 13)], ai: 0.5, coins: 280,
          intro: [{ who: 'blackfire', text: 'Ha a húgocskám figuráit gyűjtöd, akkor az enyéimtől fogsz rettegni.' }],
          outro: [{ who: 'blackfire', text: 'Ezt még Starfire-nek se mondd el. Soha.' }] },
      ],
      boss: { name: 'Slade', who: 'slade', team: [T('slade', 14), T('cinderblock', 13), T('bloodbrother', 14)], ai: 0.56, coins: 600, music: 'boss',
        intro: [{ who: 'slade', text: 'Robin. Tudtam, hogy eljutsz idáig. Minden lépésedet előre láttam.' },
          { who: 'robin', text: 'Akkor azt is láttad, hogy most elverlek?' }],
        outro: [{ who: 'slade', text: 'Ügyes. De Mr. Mint már a következő lépésén dolgozik. Ő nem játszik… ő gyűjt.' }] },
      reward: { coins: 800, fig: 'slade', text: 'Megkaptad Slade legendás figuráját! Mr. Mint trezorja megnyílt északnyugaton. Kapható a Legendás doboz is!' },
    },
    {
      id: 'mint', name: 'Menta Kupa', color: '#7fe0b5', venue: 'vault', minLvl: 16, req: 'villain',
      desc: 'Mr. Mint saját bajnoksága a trezorban. Itt dől el minden.',
      matches: [
        { name: 'Menta Őrök', who: 'mintguard', team: [T('mintguard', 16), T('mintguard', 16), T('mintguard', 17)], ai: 0.52, coins: 320,
          intro: [{ who: 'mintguard', text: 'BEEP. Nem engedélyezett figura észlelve. Becsomagolás indul.' }],
          outro: [{ who: 'mintguard', text: 'HIBA. CSOMAGOLÓ MODUL… LEÁLLT. BOOP.' }] },
        { name: 'Dobozbot', who: 'boxbot', team: [T('boxbot', 17), T('mintguard', 17), T('boxbot', 18)], ai: 0.56, coins: 340,
          intro: [{ who: 'boxbot', text: 'KARTON. ERŐ. MAXIMUM. RAGASZTÓSZALAG.' }],
          outro: [{ who: 'boxbot', text: 'Szét… vagyok… nyitva…' }] },
        { name: 'Shrink Wrap', who: 'shrinkwrap', team: [T('shrinkwrap', 18), T('boxbot', 18), T('cinderblock', 18)], ai: 0.6, coins: 380,
          intro: [{ who: 'shrinkwrap', text: 'Mi lenne, ha szépen lefóliáználak? Örökre friss maradnál. Örökre mozdulatlan.' }],
          outro: [{ who: 'shrinkwrap', text: 'A fólia… kiszakadt! Mr. Mint ezt nem fogja szeretni.' }] },
      ],
      boss: { name: 'Mr. Mint', who: 'mrmint', team: [T('shrinkwrap', 19), T('trigon', 19), T('mrmint', 20)], ai: 0.64, coins: 1500, music: 'boss',
        intro: [{ who: 'mrmint', text: 'Ah, a Titánok. Tudjátok, mi a különbség köztünk? Ti JÁTSZOTOK a figurákkal.' },
          { who: 'mrmint', text: 'Én megőrzöm őket. Bontatlanul. Örökre. És most a ti figuráitok következnek.' },
          { who: 'robin', text: 'A figurák arra valók, hogy játsszanak velük! Titánok… HARCRA FEL!' }],
        outro: [{ who: 'mrmint', text: 'Nem… a gyűjteményem… KIBONTOTTÁK!' }] },
      reward: { coins: 2000, fig: 'mrmint', text: 'Legyőzted Mr. Mintet! A figurák szabadok! Megkaptad Mr. Mint figuráját.' },
    },
    {
      id: 'brotherhood', name: 'Testvériség Kupa', color: '#c1121f', venue: 'dome', minLvl: 21, req: 'mint',
      desc: 'Utójáték: a Gonosz Testvériség kihívja a bajnokokat.',
      matches: [
        { name: 'Kyd Wykkyd', who: 'wykkyd', team: [T('wykkyd', 21), T('kitten', 20), T('billy', 21)], ai: 0.62, coins: 500,
          intro: [{ who: 'wykkyd', text: '…' }, { who: 'raven', text: 'Ő sosem beszél. Ez még nálam is ijesztőbb.' }],
          outro: [{ who: 'wykkyd', text: '…!' }] },
        { name: 'Monsieur Mallah', who: 'mallah', team: [T('mallah', 22), T('cinderblock', 21), T('plasmus', 22)], ai: 0.64, coins: 550,
          intro: [{ who: 'mallah', text: 'Bonjour, Titánok! A Mester üdvözletét küldi — egy jó nagy pofonnal.' }],
          outro: [{ who: 'mallah', text: 'Sacrebleu! A Mester nem lesz boldog.' }] },
        { name: 'Madame Rouge', who: 'rouge', team: [T('rouge', 23), T('blackfire', 22), T('maeye', 23)], ai: 0.66, coins: 600,
          intro: [{ who: 'rouge', text: 'Ó, kis Robin. Bármilyen alakot felveszek… akár a te legrosszabb rémálmodét is.' }],
          outro: [{ who: 'rouge', text: 'Hmm. Rugalmasabb vagy, mint gondoltam.' }] },
      ],
      boss: { name: 'Brain', who: 'brain', team: [T('mallah', 24), T('rouge', 24), T('brain', 26)], ai: 0.7, coins: 2500, music: 'boss',
        intro: [{ who: 'brain', text: 'Titánok. Mr. Mint amatőr volt. A Gonosz Testvériség minden figurát irányítani fog — és minden játékost is.' },
          { who: 'robin', text: 'Ezt már hallottuk. Titánok… HARCRA FEL!' }],
        outro: [{ who: 'brain', text: 'Lehetetlen… a számításaim… Mallah! Visszavonulás!' }] },
      reward: { coins: 3000, fig: 'brain', text: 'Legyőzted a Gonosz Testvériséget! Megkaptad Brain figuráját.' },
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
    redx: { name: 'Red X', who: 'red_x', team: [T('thunder', 26), T('slade', 26), T('red_x', 28)], ai: 0.82, coins: 2000, bg: 'street', music: 'boss', night: true,
      reward: { figs: ['red_x'] },
      intro: [{ who: 'red_x', text: 'Szép kis figuragyűjtemény. Kár lenne, ha… eltűnne.' }],
      outro: [{ who: 'red_x', text: 'Nem rossz, Madárfiú. Tartsd meg a figurámat. Úgyis van még egy.' }] },
    trigon: { name: 'Trigon', who: 'trigon', team: [T('raven_rage', 28), T('slade', 29), T('trigon', 30)], ai: 0.88, coins: 3000, bg: 'tower', music: 'boss',
      reward: { figs: ['raven_azarath'] },
      intro: [
        { who: 'trigon', text: 'HALANDÓK! A lányom ereje az enyém, és vele a világ összes figurája!' },
        { who: 'raven', text: 'Apa… ezúttal nem egyedül állok előtted. Titánok, most!' },
      ],
      outro: [{ who: 'trigon', text: 'NEM! Ez a fény… Azarath fénye… ELÉG!' }] },
    league: { name: 'Wonder Woman', who: 'dc_wonderwoman', team: [T('dc_batgirl', 16), T('dc_batman', 17), T('dc_superman', 18)], ai: 0.6, coins: 900, bg: 'dome', music: 'boss',
      reward: { figs: ['dc_wonderwoman'] },
      intro: [{ who: 'dc_wonderwoman', text: 'Hallottam, hogy megnyertétek a Gonosz Kupát. Az Igazság Ligája szeretné látni, mit tudtok — tisztességes harc lesz!' }],
      outro: [{ who: 'dc_wonderwoman', text: 'Igazi hősök vagytok. Fogadjátok el a figurámat Themyscira nevében!' }] },
    joker: { name: 'Joker', who: 'dc_joker', team: [T('dc_harley', 12), T('killer_moth', 12), T('dc_joker', 13)], ai: 0.54, coins: 600, bg: 'street', music: 'boss', night: true,
      dayText: 'Nappal? Fényes nappal semmi sem vicces. Gyere vissza sötétedés után… HAHAHA!',
      reward: { figs: ['dc_harley'] },
      intro: [{ who: 'dc_joker', text: 'HAHAHA! Jump City éjszakái sokkal viccesebbek, mint Gothamé. Játsszunk egyet, kis hősök!' }],
      outro: [{ who: 'dc_joker', text: 'Na tessék, elrontottátok a poént. Harley, add oda nekik a figurádat… úgyis van még egy.' }] },
    madmod: { name: 'Mad Mod', who: 'mad_mod', team: [T('killer_moth', 14), T('mumbo', 14), T('mad_mod', 15)], ai: 0.5, coins: 450, bg: 'street', music: 'boss',
      reward: { figs: ['mad_mod'] },
      intro: [{ who: 'mad_mod', text: 'Üdvözletem, kis divatmajmok! Mad Mod vagyok, a stílus mestere. Lássuk, a figuráitok is ilyen menők-e!' }],
      outro: [{ who: 'mad_mod', text: 'Jó ég, ez stílusos volt! Vidd a figurámat — és viseld büszkén!' }] },
    blood: { name: 'Brother Blood', who: 'bloodbrother', team: [T('bloodbrother', 11), T('jinx', 10), T('mammoth', 11)], ai: 0.46, coins: 400, bg: 'hive', music: 'boss',
      reward: { figs: ['bloodbrother'] },
      intro: [{ who: 'bloodbrother', text: 'Üdvözöllek az Akadémiámon, Robin. Itt minden figura nekem engedelmeskedik.' }],
      outro: [{ who: 'bloodbrother', text: 'Lenyűgöző… Vidd a figurámat. Úgyis Mr. Mint vinné el.' }] },
    docks: { name: 'Kikötői Kázmér', who: 'kid_docks', team: [T('plasmus', 11), T('cinderblock', 10), T('aqualad', 11)], ai: 0.44, coins: 300, bg: 'beach',
      intro: [{ who: 'kid_docks', text: 'A kikötő az én terepem. A nagy figurák itt laknak!' }],
      outro: [{ who: 'kid_docks', text: 'Elsüllyedtem. Mint egy horgony.' }] },
    scout: { name: 'Menta felderítő', who: 'mintguard', team: [T('mintguard', 13), T('boxbot', 13), T('mintguard', 14)], ai: 0.49, coins: 320, bg: 'vault',
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

  // Harci kellékek (harconként legfeljebb 2 használható)
  TT.ITEMS = {
    pizza: { name: 'Pizzaszelet', desc: 'Az aktív figura 30% HP-t gyógyul.', price: 80, color: '#ffcf6b' },
    energy: { name: 'Energiaital', desc: '+50% szupermérő.', price: 120, color: '#7bd65b' },
    cleanse: { name: 'Tisztító spray', desc: 'Leveszi a rossz állapotokat és a kábulatot.', price: 60, color: '#9be7ff' },
  };
  TT.ITEM_MAX = 9;
  TT.ITEMS_PER_BATTLE = 2;

  // Csapatkód: a csapat megosztása barátokkal (szerver nélkül)
  TT.teamCode = function () {
    const s = TT.save;
    const data = {
      n: (s.playerName || 'Titán').slice(0, 16),
      t: s.team.map((id) => [id, s.owned[id] ? s.owned[id].lvl : 1, TT.starsOf(id), TT.paintOf(id) || '']),
    };
    return 'TT3-' + btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/=+$/, '');
  };
  TT.parseTeamCode = function (code) {
    try {
      const raw = String(code).trim().replace(/^TT3-/, '');
      const data = JSON.parse(decodeURIComponent(escape(atob(raw))));
      const team = (data.t || []).slice(0, 3).filter((x) => Array.isArray(x) && Object.prototype.hasOwnProperty.call(TT.FIG, x[0])).map((x) => ({
        id: x[0], lvl: TT.U.clamp(parseInt(x[1], 10) || 1, 1, TT.MAX_LVL), stars: TT.U.clamp(parseInt(x[2], 10) || 0, 0, TT.MAX_STARS),
        paint: TT.PAINTS.some((p) => p.id === x[3]) ? x[3] : null,
      }));
      if (team.length !== 3) return null;
      return { name: String(data.n || 'Barát').slice(0, 16), team };
    } catch (e) {
      return null;
    }
  };

  // Festőműhely: figurák átfestése
  TT.PAINTS = [
    { id: 'gold', name: 'Arany', price: 900 },
    { id: 'silver', name: 'Ezüst', price: 600 },
    { id: 'neon', name: 'Neon', price: 700 },
    { id: 'shadow', name: 'Árnyék', price: 500 },
    { id: 'ice', name: 'Jég', price: 500 },
    { id: 'candy', name: 'Cukorka', price: 400 },
  ];
  TT.paintOf = function (id) {
    const p = TT.save && TT.save.paints && TT.save.paints[id];
    return p && p.cur ? p.cur : null;
  };
  TT.openPaintShop = function (id, done) {
    const s = TT.save;
    s.paints = s.paints || {};
    const p = s.paints[id] || { owned: [], cur: null };
    const opts = TT.PAINTS.map((pt) => {
      const has = p.owned.includes(pt.id);
      return {
        label: `${pt.name} — ${p.cur === pt.id ? 'aktív' : has ? 'felvesz' : TT.U.fmt(pt.price) + ' érme'}`,
        value: pt.id, disabled: !has && s.coins < pt.price, color: has ? '#2ecc71' : '#ff6b35',
        onDisabled: () => TT.ui.toast('Nincs elég érméd!', { color: '#ff8a80' }),
      };
    });
    opts.push({ label: 'Eredeti szín' + (p.cur ? '' : ' (aktív)'), value: 'none', color: '#3fa7ff' });
    opts.push({ label: 'Mégse', value: null, color: '#6c5ce7' });
    TT.ui.choose({ title: 'Festőműhely', text: TT.FIG[id].name + ' új színekben! A megvett festés bármikor újra felvehető.', buttonH: 40, options: opts }, (v) => {
      if (!v) return;
      if (v === 'none') p.cur = null;
      else {
        const pt = TT.PAINTS.find((x) => x.id === v);
        if (!p.owned.includes(v)) {
          if (s.coins < pt.price) return;
          s.coins -= pt.price;
          p.owned.push(v);
          s.flags.painted = true;
          TT.audio.sfx('buy');
        }
        p.cur = v;
      }
      s.paints[id] = p;
      TT.store.write();
      TT.audio.sfx('select');
      TT.checkAch();
      if (done) done();
    });
  };

  // Napi ajánlat: minden nap egy konkrét (nem gyakori) figura megvehető a boltban
  TT.dailyOffer = function () {
    const d = new Date();
    const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    const pool = TT.FIG_LIST.filter((f) => !f.noBox && f.rarity !== 'common');
    const fig = pool[TT.U.hash('ajanlat:' + key) % pool.length];
    const price = { rare: 600, epic: 1400, legendary: 3200 }[fig.rarity];
    return { key, id: fig.id, price, bought: TT.save && TT.save.offerBought === key };
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
    if (!TT.cupDone('brotherhood')) return 'Utójáték: nyerd meg a Testvériség Kupát a Csatakupolában!';
    if (!s.beaten.redx) return 'Pletykák szerint éjjelente Red X ólálkodik a kikötőben…';
    if (!s.beaten.trigon) return 'Raven nyugtalan… Trigon kapuja a Torony szigetén nyílik. Állítsd meg!';
    return 'Győztél! Próbáld ki a Végtelen Arénát, és gyűjtsd össze mind a ' + TT.FIG_LIST.length + ' figurát!';
  };
})(window.TT);
