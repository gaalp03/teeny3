'use strict';
// Bejárható Jump City: séta, NPC-k, edzők, épületek, rejtett figurák, minitérkép.
(function (TT) {
  const U = TT.U;
  const D = TT.D;

  let W; // TT.WORLD
  let solidGrid = null;
  let minimap = null;

  function buildSolid() {
    solidGrid = new Uint8Array(W.MW * W.MH);
    for (let y = 0; y < W.MH; y++) for (let x = 0; x < W.MW; x++) {
      if (W.SOLID.has(W.tile(x, y))) solidGrid[y * W.MW + x] = 1;
    }
    const mark = (x, y, w, h) => {
      for (let j = Math.floor(y); j < Math.ceil(y + h); j++) for (let i = Math.floor(x); i < Math.ceil(x + w); i++) {
        if (i >= 0 && j >= 0 && i < W.MW && j < W.MH) solidGrid[j * W.MW + i] = 1;
      }
    };
    for (const b of W.buildings) mark(b.x, b.y, b.w, b.h);
    for (const p of W.props) {
      if (p.kind === 'lamp' || p.kind === 'sign' || p.kind === 'hydrant' || p.kind === 'umbrella') mark(p.x + 0.25, p.y, 0.5, 0.5);
      else if (p.kind === 'statue') mark(p.x - 0.2, p.y - 0.2, 1.4, 0.8);
      else mark(p.x, p.y, p.w || 1, p.h || 1);
    }
  }

  function buildMinimap() {
    const c = TT.makeCanvas(W.MW * 2, W.MH * 2);
    const g = c.getContext('2d');
    const T = W.T;
    const col = {
      [T.WATER]: '#2f8fd8', [T.POND]: '#3fb2e8', [T.GRASS]: '#5cbf56', [T.FLOWER]: '#6fcf68', [T.TREE]: '#2e7d32',
      [T.ROAD]: '#4b4a5e', [T.CROSS]: '#6b6a7e', [T.WALK]: '#cfc8dc', [T.SAND]: '#f2d98d', [T.PLAZA]: '#e8d9b5',
      [T.BRIDGE]: '#b0763a', [T.DOCK]: '#9a6a3a', [T.HEDGE]: '#2e7d32', [T.ROCK]: '#9aa0a8', [T.DARK]: '#3a3552', [T.MINT]: '#bff0dc',
    };
    for (let y = 0; y < W.MH; y++) for (let x = 0; x < W.MW; x++) {
      g.fillStyle = col[W.tile(x, y)] || '#f0f';
      g.fillRect(x * 2, y * 2, 2, 2);
    }
    for (const b of W.buildings) {
      g.fillStyle = b.kind === 'house' ? '#c97b5a' : '#ff6b35';
      g.fillRect(b.x * 2, b.y * 2, b.w * 2, b.h * 2);
    }
    return c;
  }

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  const HELP = [
    { who: 'robin', text: 'Városban: WASD vagy nyilak (telefonon húzd az ujjad bal oldalt), Shift = futás, E vagy az A gomb = beszéd, belépés.' },
    { who: 'robin', text: 'Harcban a kártyák maguktól töltődnek. 1, 2, 3 (vagy koppintás) = támadás, R = szuper, Szóköz tartva = blokk, Q/E = csere.' },
    { who: 'raven', text: 'Amikor az ellenfél támad, kör zsugorodik a figurád körül. Ha zöld, amikor blokkolni kezdesz: tökéletes blokk, nulla sebzés.' },
    { who: 'cyborg', text: 'Típusok: Erő > Tech > Misztikus > Gyorsaság > Erő. Az erős típus 30%-kal többet sebez.' },
    { who: 'beastboy', text: 'Érmét harcokból, rejtett helyekről és kupákból kapsz. A Játékboltban dobozt vehetsz, a Toronyban és a Gyűjteményben csapatot rendezhetsz.' },
  ];

  const scene = {
    enter(p) {
      W = TT.WORLD;
      if (!solidGrid) buildSolid();
      if (!minimap) minimap = buildMinimap();
      const s = TT.save;
      const TS = W.TS;
      const pos = p.pos || s.pos || W.start;
      this.pl = { x: pos.x * TS, y: pos.y * TS, dir: p.dir || 'down', walk: 0, moving: false };
      this.cam = { x: 0, y: 0 };
      this.snapCam();
      this.t = 0;
      this.showMap = false;
      this.joy = null;
      this.gateMsgT = 0;
      this.prompt = null;
      this.menu = new TT.ui.Menu();
      this.stepT = 0;
      this.npcState = {};
      for (const n of W.npcs) this.npcState[n.id] = { face: n.dir || 'down' };
      TT.audio.music(this.inHive() ? 'hive' : 'town');
      s.pos = { x: this.pl.x / TS, y: this.pl.y / TS };
      this.okCooldown = 0.45;
      if (p.event) this.runEvent(p.event);
    },

    exit() {
      if (TT.save) {
        TT.save.pos = { x: this.pl.x / W.TS, y: this.pl.y / W.TS };
        TT.store.write();
      }
    },

    inHive() {
      const tx = this.pl.x / W.TS, ty = this.pl.y / W.TS;
      return tx > 86 && ty > 47 && ty < 58;
    },

    snapCam() {
      const TS = W.TS;
      this.cam.x = U.clamp(this.pl.x - TT.W / 2, 0, W.MW * TS - TT.W);
      this.cam.y = U.clamp(this.pl.y - TT.H / 2 - 70, -160, W.MH * TS - TT.H);
    },

    // ---------- Ütközés ----------
    gateLocked(g) {
      return !TT.cupDone(g.req);
    },
    blocked(px, py) {
      const TS = W.TS;
      const hw = 9, hh = 5;
      const pts = [[px - hw, py - hh], [px + hw, py - hh], [px - hw, py + hh], [px + hw, py + hh]];
      for (const [x, y] of pts) {
        const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
        if (tx < 0 || ty < 0 || tx >= W.MW || ty >= W.MH) return true;
        if (solidGrid[ty * W.MW + tx]) return true;
        for (const g of W.gates) {
          if (tx >= g.x && tx < g.x + g.w && ty >= g.y && ty < g.y + g.h && this.gateLocked(g)) return g;
        }
      }
      for (const n of W.npcs) {
        if (!this.npcVisible(n)) continue;
        if (Math.abs(px - n.x * TS) < 18 && Math.abs(py - n.y * TS) < 12) return true;
      }
      return false;
    },

    npcVisible(n) {
      const s = TT.save;
      if (n.id === 'cyborg_t' && s.flags.tutorial && false) return false;
      return true;
    },

    // ---------- Interakciók ----------
    interactables() {
      const TS = W.TS;
      const list = [];
      for (const n of W.npcs) {
        if (!this.npcVisible(n)) continue;
        list.push({ kind: 'npc', n, x: n.x * TS, y: n.y * TS, r: 46 });
      }
      for (const b of W.buildings) {
        if (!b.door) continue;
        list.push({ kind: 'door', b, x: b.door[0] * TS, y: b.door[1] * TS + 6, r: 34 });
      }
      for (const h of W.hidden) {
        if (TT.save.found[h.id]) continue;
        list.push({ kind: 'hidden', h, x: h.x * TS, y: h.y * TS, r: 40 });
      }
      return list;
    },

    nearest() {
      const pl = this.pl;
      const [dx, dy] = DIRS[pl.dir];
      const fx = pl.x + dx * 14, fy = pl.y + dy * 14;
      let best = null, bd = Infinity;
      for (const it of this.interactables()) {
        const d = U.dist(fx, fy, it.x, it.y);
        if (d < it.r && d < bd) {
          bd = d;
          best = it;
        }
      }
      return best;
    },

    interact(it) {
      if (!it) return;
      if (it.kind === 'npc') this.talkTo(it.n);
      else if (it.kind === 'door') this.enterBuilding(it.b);
      else if (it.kind === 'hidden') this.collect(it.h);
    },

    talkTo(n) {
      const s = TT.save;
      const TS = W.TS;
      // forduljon a játékos felé
      const dx = this.pl.x - n.x * TS, dy = this.pl.y - n.y * TS;
      this.npcState[n.id].face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      if (n.talk) {
        TT.ui.say(TT.TALKS[n.talk]());
        return;
      }
      if (n.trainer) {
        const tr = TT.TRAINERS[n.trainer];
        const beaten = s.beaten[n.trainer];
        if (n.trainer === 'tutorial') {
          if (!beaten) this.startTrainer(n, tr, true);
          else {
            TT.ui.say([{ who: 'cyborg', text: 'Az edzés megvolt, most irány a Csatakupola! Ha gyakorolnál, szólj, és visszavágunk.' }], () => {
              TT.ui.confirm('Gyakorló meccs Cyborggal?', (ok) => ok && this.startTrainer(n, Object.assign({}, tr, { tutorial: false, team: tr.team.map((t) => ({ id: t.id, lvl: Math.max(t.lvl, this.teamLvl()) })) }), false));
            });
          }
          return;
        }
        if (!beaten) {
          TT.ui.say([{ who: tr.who, text: 'Hé, te ott! Figurás párbaj?' }], () => {
            TT.ui.confirm(`Harc ${tr.name} ellen? (csapatszint: ${tr.team.map((t) => t.lvl).join('/')})`, (ok) => ok && this.startTrainer(n, tr, true), 'Harc!', 'Majd később');
          });
        } else {
          TT.ui.say([{ who: tr.who, text: 'Visszavágó? Most már komolyabban veszem!' }], () => {
            TT.ui.confirm('Visszavágó (erősebb csapat, kevesebb érme)?', (ok) => {
              if (!ok) return;
              const lv = Math.max(...tr.team.map((t) => t.lvl), this.teamLvl());
              const tr2 = Object.assign({}, tr, { coins: Math.round(tr.coins * 0.5), team: tr.team.map((t) => ({ id: t.id, lvl: lv })), intro: null });
              this.startTrainer(n, tr2, false);
            }, 'Harc!', 'Nem');
          });
        }
      }
    },

    teamLvl() {
      const s = TT.save;
      return Math.round(s.team.reduce((a, id) => a + (s.owned[id] ? s.owned[id].lvl : 1), 0) / s.team.length);
    },

    startTrainer(n, tr, first) {
      const s = TT.save;
      const TS = W.TS;
      const back = { x: this.pl.x / TS, y: this.pl.y / TS };
      const dir = this.pl.dir;
      const rewardFigs = first && tr.reward && tr.reward.figs ? tr.reward.figs : [];
      TT.go('battle', {
        enemy: Object.assign({ bg: tr.bg || 'street' }, tr),
        tutorial: !!tr.tutorial && first,
        noForfeit: !!tr.tutorial && first,
        rewardFigs,
        after: (won) => {
          let ev = null;
          if (won && first) {
            s.beaten[n.trainer] = true;
            if (n.trainer === 'tutorial') {
              s.flags.tutorial = true;
              ev = 'after_tutorial';
            }
            if (n.trainer === 'blood') ev = 'after_blood';
          }
          TT.store.write();
          TT.go('world', { pos: back, dir, event: ev });
        },
      });
    },

    enterBuilding(b) {
      const s = TT.save;
      TT.audio.sfx('door');
      const TS = W.TS;
      const back = { x: b.door[0], y: b.door[1] + 1.15 };
      s.pos = back;
      switch (b.id) {
        case 'toyshop':
          TT.go('shop', { back });
          break;
        case 'dome':
          if (!s.flags.tutorial) {
            TT.ui.say([{ who: 'kid_bela', text: 'Hoppá! Előbb fejezd be az edzést Cyborggal a Toronynál!' }]);
            return;
          }
          TT.go('dome', { back, venue: 'dome' });
          break;
        case 'vault':
          TT.go('dome', { back, venue: 'vault' });
          break;
        case 'tower':
          this.towerMenu();
          break;
        case 'pizza':
          this.pizzaMenu();
          break;
        case 'comics':
          this.comicsMenu();
          break;
        case 'hive':
          TT.ui.say(s.beaten.blood ? [{ who: 'kid_hive', text: 'Az Akadémia ma zárva. Az igazgató úr… figurázik.' }] :
            [{ who: 'kid_hive', text: 'Csak az léphet be, aki legyőzi Brother Bloodot. Ott áll az ajtó mellett.' }]);
          break;
        default:
          break;
      }
      void TS;
    },

    towerMenu() {
      TT.ui.choose({
        title: 'Titánok Tornya',
        text: 'Pihenj, rendezd a csapatod, vagy mentsd a játékot.',
        options: [
          { label: 'Csapat és gyűjtemény', value: 'team' },
          { label: 'Mentés', value: 'save' },
          { label: 'Beszélgetés a Titánokkal', value: 'chat' },
          { label: 'Mégse', value: null },
        ],
      }, (v) => {
        if (v === 'team') TT.go('collection', { from: 'world' });
        else if (v === 'save') {
          TT.store.write();
          TT.audio.sfx('select');
          TT.ui.toast('Játék elmentve!');
        } else if (v === 'chat') {
          TT.ui.say(this.towerChat());
        }
      });
    },

    towerChat() {
      const n = TT.cupsDone();
      const lines = [
        [{ who: 'beastboy', text: 'Szerintem az Újonc Kupa simán megy. Kivéve, ha Control Freak megint a hátoldali kódokról magyaráz.' },
          { who: 'raven', text: 'Akkor majd én beszélek. Röviden.' }],
        [{ who: 'cyborg', text: 'A Kelet Kupában Kid Flash nagyon gyors. Blokkolj korán, vagy cserélj!' },
          { who: 'starfire', text: 'És ne feledd: a Misztikus legyőzi a Gyorsaságot! Raven a barátunk!' }],
        [{ who: 'robin', text: 'Slade a Gonosz Kupa végén vár. Erő típus — Gyorsasággal kell nekimenni.' },
          { who: 'beastboy', text: 'Vagy egy NAGYON nagy gorillával.' }],
        [{ who: 'raven', text: 'Mr. Mint trezorja nyitva. Érzem a… bontatlan műanyag szagát.' },
          { who: 'cyborg', text: 'Tech típusú a csapatuk nagy része. Erő figurákkal BOOYAH!' }],
        [{ who: 'starfire', text: 'Megmentettük a figurákat! Most már bármikor játszhatunk velük. Ez a legdicsőségesebb nap!' },
          { who: 'robin', text: 'A Végtelen Arénában még vár ránk néhány kihívás, Titánok.' }],
      ];
      return lines[Math.min(n, lines.length - 1)];
    },

    pizzaMenu() {
      const s = TT.save;
      const price = 120;
      TT.ui.choose({
        title: 'Pizzéria',
        text: `Pizzaparti a csapatnak: mind a 3 figura +80 XP. Ár: ${price} érme. (Neked ${U.fmt(s.coins)} van.)`,
        options: [
          { label: `Pizzaparti! (${price})`, value: 'buy', disabled: s.coins < price },
          { label: 'Csak nézelődöm', value: null },
        ],
      }, (v) => {
        if (v !== 'buy') return;
        s.coins -= price;
        let ups = 0;
        for (const id of s.team) ups += TT.addXp(id, 80);
        TT.store.write();
        TT.audio.sfx('buy');
        TT.ui.say([{ who: 'kid_pizza', text: 'Mamma mia! Egy pizza mindenre jó!' + (ups ? ' Valaki szintet is lépett!' : '') }]);
      });
    },

    comicsMenu() {
      const s = TT.save;
      const have = Object.keys(s.owned).length;
      const goals = [
        { n: 10, coins: 300, id: 'm10' },
        { n: 20, coins: 700, id: 'm20' },
        { n: 30, coins: 1500, id: 'm30' },
        { n: TT.FIG_LIST.length, coins: 5000, id: 'mall' },
      ];
      const lines = [{ who: 'kid_geza', text: `Gyűjtői jutalmak! Neked ${have} / ${TT.FIG_LIST.length} figurád van.` }];
      let got = 0;
      for (const g of goals) {
        if (have >= g.n && !s.flags[g.id]) {
          s.flags[g.id] = true;
          s.coins += g.coins;
          got += g.coins;
          lines.push({ who: 'kid_geza', text: `${g.n} figura összegyűjtve! Jutalom: ${g.coins} érme.` });
        }
      }
      const next = goals.find((g) => have < g.n);
      if (next) lines.push({ who: 'kid_geza', text: `Következő jutalom ${next.n} figuránál: ${next.coins} érme.` });
      else if (!got) lines.push({ who: 'kid_geza', text: 'Minden figurát összegyűjtöttél! Te vagy a Teeny Bajnok!' });
      if (got) {
        TT.audio.sfx('buy');
        TT.store.write();
      }
      TT.ui.say(lines);
    },

    collect(h) {
      const s = TT.save;
      s.found[h.id] = true;
      if (h.fig) {
        const info = TT.grantFigure(h.fig);
        TT.store.write();
        TT.audio.sfx('found');
        TT.ui.reveal(h.fig, info);
      } else {
        s.coins += h.coins;
        TT.store.write();
        TT.audio.sfx('coin');
        TT.ui.toast(`+${h.coins} érme!`);
        TT.fx.burst(h.x * W.TS - this.cam.x, h.y * W.TS - this.cam.y - 10, 12, { color: '#ffd23f', shape: 'star', speed: 180, size: 6, life: 0.6, layer: 1 });
      }
    },

    // ---------- Történet ----------
    runEvent(ev) {
      const s = TT.save;
      if (ev === 'newgame') {
        TT.ui.say([
          { who: 'robin', text: 'Titánok! Megjelent a… TEENY TITANS 3! Új figurák, új liga, új Csatakupola a belvárosban!' },
          { who: 'beastboy', text: 'Duuude! Negyvenhárom új figura! Mindet akarom! Kétszer!' },
          { who: 'cyborg', text: 'És a Teeny Titans 3 Világliga díja egy színarany Ultra Robin figura. BOOYAH!' },
          { who: 'raven', text: 'Remek. Biztos nem lesz belőle semmi baj.' },
          { who: 'mrmint', text: 'Ahem. Jó napot, Jump City. Itt Mr. Mint, a világ legnagyobb gyűjtője.' },
          { who: 'mrmint', text: 'Bejelentem: a város összes figurája az enyém lesz. Bontatlanul. A dobozban. ÖRÖKRE.' },
          { who: 'starfire', text: 'De… a figurák arra valók, hogy játsszunk velük! Ez nagyon nem dicsőséges!' },
          { who: 'robin', text: 'Akkor megnyerjük a ligát, mielőtt ő nyeri meg! Cyborg, kezdjük egy edzéssel!' },
        ]);
      } else if (ev === 'after_tutorial') {
        TT.ui.say([
          { who: 'cyborg', text: 'Na, ez az! A figuráink mostantól a te gyűjteményedben vannak.' },
          { who: 'robin', text: 'Irány a Csatakupola délre a belvárosban! A Játékboltban pedig dobozokat vehetünk.' },
          { who: 'raven', text: 'A Toronyban rendezheted a csapatod. Három figura harcol, okosan válassz.' },
        ]);
      } else if (ev === 'cup_rookie') {
        TT.ui.say([
          { who: 'robin', text: 'Megvan az Újonc Kupa!' },
          { who: 'mrmint', text: 'Gratulálok. Egy szép, csillogó kupa. Kár, hogy nem bontatlan.' },
          { who: 'mrmint', text: 'A H.I.V.E. diákjai épp a figuráimat… izé, a figuráikat tesztelik. Nézzetek be, ha mertek.' },
          { who: 'beastboy', text: 'A H.I.V.E. negyed kinyitott keleten! És a boltban van Prémium doboz!' },
        ]);
      } else if (ev === 'cup_east') {
        TT.ui.say([
          { who: 'bumblebee', text: 'Szép munka, Titánok. A Kelet veletek van. Más y Menos figuráját is vigyétek!' },
          { who: 'cyborg', text: 'A kikötőt is kinyitották. Valaki ott egy nagy, szürke ládát látott…' },
        ]);
      } else if (ev === 'cup_villain') {
        TT.ui.say([
          { who: 'slade', text: 'Lenyűgöző, Robin. De ez még csak a kezdet volt.' },
          { who: 'mrmint', text: 'Elég! Ha a figuráitokat nem tudom megvenni, elnyerem őket. A trezoromban várlak — a Menta Kupán.' },
          { who: 'robin', text: 'A trezor hídja nyitva, északnyugaton. Titánok — HARCRA FEL!' },
        ]);
      } else if (ev === 'cup_mint') {
        TT.ui.say([
          { who: 'mrmint', text: 'A gyűjteményem… szabad. Minden figura kibontva…' },
          { who: 'starfire', text: 'Ne légy szomorú, Mr. Mint! Most már játszhatsz is velük! Az sokkal jobb!' },
          { who: 'mrmint', text: '…Játszani? Hmm. Talán… egyszer kipróbálom.' },
          { who: 'robin', text: 'Megcsináltuk, Titánok! A Teeny Titans 3 Világliga bajnokai!' },
        ], () => TT.go('credits'));
      } else if (ev === 'after_blood') {
        TT.ui.say([{ who: 'raven', text: 'Brother Blood figurája. Nem akarom tudni, mit csinált vele eddig.' }]);
      }
      void s;
    },

    openMenu() {
      TT.audio.sfx('select');
      TT.ui.choose({
        title: 'Menü',
        options: [
          { label: 'Csapat és gyűjtemény', value: 'team' },
          { label: 'Térkép', value: 'map' },
          { label: 'Mentés', value: 'save' },
          { label: 'Beállítások', value: 'settings' },
          { label: 'Súgó', value: 'help' },
          { label: 'Főmenü', value: 'title', color: '#6c5ce7' },
        ],
      }, (v) => {
        if (v === 'team') TT.go('collection', { from: 'world' });
        else if (v === 'map') this.showMap = !this.showMap;
        else if (v === 'save') {
          TT.store.write();
          TT.ui.toast('Játék elmentve!');
        } else if (v === 'settings') TT.openSettings();
        else if (v === 'help') TT.ui.say(HELP);
        else if (v === 'title') {
          TT.store.write();
          TT.go('title');
        }
      });
    },

    // ---------- Frissítés ----------
    touchLayout() {
      return {
        a: { x: TT.W - 120, y: TT.H - 128, r: 48 },
        menu: { x: TT.W - 66, y: 12, w: 54, h: 46 },
        map: { x: TT.W - 128, y: 12, w: 54, h: 46 },
      };
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      const s = TT.save;
      s.playTime += dt;
      const TS = W.TS;
      const pl = this.pl;
      const L = this.touchLayout();

      // menü / térkép
      if (I.hit('menu') || I.tapIn(L.menu.x, L.menu.y, L.menu.w, L.menu.h)) {
        this.openMenu();
        return;
      }
      if (I.hit('map') || I.tapIn(L.map.x, L.map.y, L.map.w, L.map.h)) {
        this.showMap = !this.showMap;
        TT.audio.sfx('select');
      }

      // érintéses joystick
      let jx = 0, jy = 0;
      for (const tp of I.taps) {
        if (tp.x < TT.W * 0.5 && tp.y > 70 && !this.joy) this.joy = { id: tp.id, ox: tp.x, oy: tp.y, x: tp.x, y: tp.y };
      }
      if (this.joy) {
        const ptr = I.pointers.get(this.joy.id);
        if (!ptr) this.joy = null;
        else {
          this.joy.x = ptr.x;
          this.joy.y = ptr.y;
          const dx = ptr.x - this.joy.ox, dy = ptr.y - this.joy.oy;
          const d = Math.hypot(dx, dy);
          if (d > 8) {
            jx = dx / Math.max(d, 50);
            jy = dy / Math.max(d, 50);
          }
          if (d > 60) {
            this.joy.ox = ptr.x - (dx / d) * 60;
            this.joy.oy = ptr.y - (dy / d) * 60;
          }
        }
      }
      let mx = 0, my = 0;
      if (I.act('left')) mx -= 1;
      if (I.act('right')) mx += 1;
      if (I.act('up')) my -= 1;
      if (I.act('down')) my += 1;
      if (I.stick.x || I.stick.y) {
        mx = I.stick.x;
        my = I.stick.y;
      }
      if (jx || jy) {
        mx = jx;
        my = jy;
      }
      const mag = Math.hypot(mx, my);
      pl.moving = mag > 0.1 && !TT.ui.overlayActive() && !TT.isFading();
      if (pl.moving) {
        const run = I.act('run') || mag > 0.95 && (jx || jy);
        const sp = (run ? 230 : 150) * Math.min(1, mag);
        const nx = (mx / Math.max(1, mag)) * sp * dt, ny = (my / Math.max(1, mag)) * sp * dt;
        if (Math.abs(mx) > Math.abs(my)) pl.dir = mx > 0 ? 'right' : 'left';
        else pl.dir = my > 0 ? 'down' : 'up';
        let hitGate = null;
        const bx = this.blocked(pl.x + nx, pl.y);
        if (!bx) pl.x += nx;
        else if (bx !== true) hitGate = bx;
        const by = this.blocked(pl.x, pl.y + ny);
        if (!by) pl.y += ny;
        else if (by !== true) hitGate = by;
        pl.walk += dt * (run ? 15 : 11);
        this.stepT -= dt;
        if (this.stepT <= 0) {
          this.stepT = run ? 0.22 : 0.3;
          TT.audio.sfx('step');
        }
        if (hitGate && this.gateMsgT <= 0) {
          TT.ui.toast(hitGate.text, { color: '#ff8a80' });
          TT.audio.sfx('error');
          this.gateMsgT = 3;
        }
        // ajtóba sétálás
        if (pl.dir === 'up') {
          for (const b of W.buildings) {
            if (!b.door) continue;
            if (Math.abs(pl.x - b.door[0] * TS) < 22 && Math.abs(pl.y - (b.door[1] * TS + 2)) < 12) {
              this.enterBuilding(b);
              pl.y += 6;
              return;
            }
          }
        }
        // rejtett tárgyak automatikus felvétele
        for (const h of W.hidden) {
          if (!s.found[h.id] && U.dist(pl.x, pl.y, h.x * TS, h.y * TS) < 20) {
            this.collect(h);
            break;
          }
        }
      }
      this.gateMsgT -= dt;

      // interakció
      this.prompt = this.nearest();
      const aTap = I.tapIn(L.a.x - L.a.r, L.a.y - L.a.r, L.a.r * 2, L.a.r * 2);
      if (aTap && this.joy && this.joy.id === aTap.id) this.joy = null;
      this.okCooldown = Math.max(0, (this.okCooldown || 0) - dt);
      if ((I.hit('ok') || aTap) && this.prompt && this.okCooldown <= 0) this.interact(this.prompt);

      // zene a negyed szerint
      if (!TT.ui.overlayActive()) TT.audio.music(this.inHive() ? 'hive' : 'town');

      // kamera
      const tx = U.clamp(pl.x - TT.W / 2, 0, W.MW * TS - TT.W);
      const ty = U.clamp(pl.y - TT.H / 2 - 70, -160, W.MH * TS - TT.H);
      const k = 1 - Math.pow(0.001, dt);
      this.cam.x = U.lerp(this.cam.x, tx, k);
      this.cam.y = U.lerp(this.cam.y, ty, k);
      s.pos = { x: pl.x / TS, y: pl.y / TS };
    },

    // ---------- Rajzolás ----------
    draw(ctx) {
      const TS = W.TS;
      const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
      ctx.fillStyle = '#2f8fd8';
      ctx.fillRect(0, 0, TT.W, TT.H);
      TT.tiles.drawGround(ctx, W, cx, cy, TT.W, TT.H);
      TT.tiles.drawWaterFx(ctx, W, cx, cy, TT.W, TT.H, TT.time);

      const items = [];
      const x0 = Math.max(0, Math.floor(cx / TS) - 2), x1 = Math.min(W.MW - 1, Math.ceil((cx + TT.W) / TS) + 2);
      const y0 = Math.max(0, Math.floor(cy / TS) - 1), y1 = Math.min(W.MH - 1, Math.ceil((cy + TT.H) / TS) + 3);
      const T = W.T;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const v = W.tile(x, y);
        if (v === T.TREE) items.push({ y: (y + 1) * TS - 4, draw: () => ctx.drawImage(TT.tiles.tree(TT.tiles.treeVariant(x, y)), x * TS - cx - 16, y * TS - cy - 52) });
        else if (v === T.ROCK) items.push({ y: (y + 1) * TS - 4, draw: () => ctx.drawImage(TT.tiles.rock(), x * TS - cx - 4, y * TS - cy) });
      }
      for (const b of W.buildings) {
        const spr = TT.buildings.sprite(b);
        const bx = b.x * TS - (spr.side || 0) - cx, by = (b.y + b.h) * TS - spr.height - cy;
        if (bx > TT.W || bx + spr.width < 0 || by > TT.H || by + spr.height < 0) continue;
        items.push({ y: (b.y + b.h) * TS, draw: () => ctx.drawImage(spr, bx, by) });
      }
      for (const p of W.props) {
        const px = p.x * TS - cx, py = p.y * TS - cy;
        if (px < -120 || px > TT.W + 60 || py < -100 || py > TT.H + 100) continue;
        items.push({ y: (p.y + (p.h || 1)) * TS, draw: () => TT.buildings.drawProp(ctx, p, px, py, TT.time) });
      }
      for (const g of W.gates) {
        if (!this.gateLocked(g)) continue;
        const gx = g.x * TS - cx, gy = g.y * TS - cy;
        items.push({ y: (g.y + g.h) * TS, draw: () => TT.buildings.drawGate(ctx, g, gx, gy, g.w * TS, g.h * TS, TT.time) });
      }
      for (const h of W.hidden) {
        if (TT.save.found[h.id]) continue;
        const hx = h.x * TS - cx, hy = h.y * TS - cy;
        if (hx < -40 || hx > TT.W + 40 || hy < -40 || hy > TT.H + 40) continue;
        items.push({ y: h.y * TS, draw: () => this.drawHidden(ctx, h, hx, hy) });
      }
      for (const n of W.npcs) {
        if (!this.npcVisible(n)) continue;
        const nx = n.x * TS - cx, ny = n.y * TS - cy;
        if (nx < -60 || nx > TT.W + 60 || ny < -100 || ny > TT.H + 60) continue;
        items.push({ y: n.y * TS, draw: () => this.drawNpc(ctx, n, nx, ny) });
      }
      const pl = this.pl;
      items.push({ y: pl.y, draw: () => this.drawPlayer(ctx, pl.x - cx, pl.y - cy) });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.draw();

      // ajtó feliratok
      for (const b of W.buildings) {
        if (!b.door || !b.name) continue;
        const dx = b.door[0] * TS - cx, dy = b.door[1] * TS - cy;
        if (U.dist(pl.x - cx, pl.y - cy, dx, dy) < 130) {
          const ly = dy - 78;
          D.panel(ctx, dx - D.measure(ctx, b.name, 15) / 2 - 10, ly - 12, D.measure(ctx, b.name, 15) + 20, 24, { fill: '#2b1e5c', r: 8, lw: 2, shadow: false });
          D.text(ctx, b.name, dx, ly, { size: 15, align: 'center', color: '#ffd23f' });
        }
      }
      TT.fx.draw(ctx, 0);
      this.drawPrompt(ctx, cx, cy);
      this.drawHud(ctx);
      TT.fx.draw(ctx, 1);
    },

    drawPlayer(ctx, x, y) {
      const pl = this.pl;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 16, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
      TT.art.drawFigure(ctx, TT.FIG.robin, x, y + 2, 0.6, {
        pedestal: false, pose: pl.moving ? 'walk' : 'idle', walk: pl.walk,
        facing: pl.dir === 'left' ? -1 : 1, back: pl.dir === 'up', noCustom: true,
      });
    },

    drawNpc(ctx, n, x, y) {
      const st = this.npcState[n.id];
      const look = TT.FIG[n.who] || TT.NPC_LOOKS[n.who];
      const fig = TT.FIG[n.who] ? TT.FIG[n.who] : { id: n.who, look: look.look };
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 15, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
      TT.art.drawFigure(ctx, fig, x, y + 2, 0.58, { pedestal: false, facing: st.face === 'left' ? -1 : 1, back: st.face === 'up', t: TT.time + n.x, noCustom: true });
      // jelzés a fej felett
      if (n.trainer && !TT.save.beaten[n.trainer]) {
        const b = Math.sin(TT.time * 5 + n.x) * 3;
        D.panel(ctx, x - 11, y - 96 + b, 22, 26, { fill: '#ff4f4f', r: 8, lw: 2.5, shadow: false });
        D.text(ctx, '!', x, y - 82 + b, { size: 20, align: 'center' });
      }
    },

    drawHidden(ctx, h, x, y) {
      const t = TT.time;
      const b = Math.sin(t * 3 + h.x) * 3;
      ctx.save();
      if (h.fig) {
        ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.3;
        D.star(ctx, x, y - 10 + b, 13, 5, 4, t);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.globalAlpha = 1;
        D.star(ctx, x + 10, y - 22 + b, 5, 2, 4, -t * 2);
        ctx.fillStyle = '#ffd23f';
        ctx.fill();
        D.star(ctx, x - 9, y - 2 + b, 4, 1.6, 4, t * 3);
        ctx.fill();
      } else {
        D.coin(ctx, x, y - 8 + b, 9 * Math.abs(Math.cos(t * 2.5)) + 1);
      }
      ctx.restore();
    },

    drawPrompt(ctx, cx, cy) {
      const p = this.prompt;
      if (!p || TT.ui.overlayActive()) return;
      let x = p.x - cx, y = p.y - cy - 80;
      let label = 'Beszélj';
      if (p.kind === 'door') {
        label = 'Belépés';
        y = p.y - cy - 46;
      } else if (p.kind === 'hidden') {
        label = 'Felvesz';
        y = p.y - cy - 40;
      } else if (p.n.trainer) label = TT.save.beaten[p.n.trainer] ? 'Visszavágó' : 'Harc!';
      const touch = TT.input.isTouch();
      const w = D.measure(ctx, label, 16) + (touch ? 22 : 46);
      const b = Math.sin(TT.time * 6) * 2;
      D.panel(ctx, x - w / 2, y - 16 + b, w, 30, { fill: '#fdf6e3', r: 10, lw: 2.5, shadow: false });
      if (!touch) D.keycap(ctx, 'E', x - w / 2 + 18, y - 1 + b, { size: 12, color: '#ffd23f' });
      D.text(ctx, label, touch ? x : x + 12, y + b, { size: 16, align: 'center', color: '#1b1140', stroke: false });
    },

    drawHud(ctx) {
      const s = TT.save;
      // érme
      D.panel(ctx, 12, 12, 150, 40, { fill: '#2b1e5c', r: 12, lw: 2.5 });
      D.coin(ctx, 34, 32, 12);
      D.text(ctx, U.fmt(s.coins), 54, 33, { size: 22, color: '#ffd23f' });
      // cél
      const obj = TT.objective();
      ctx.save();
      const lines = D.wrap(ctx, obj, 520, 16);
      const ow = Math.min(560, Math.max(...lines.map((l) => D.measure(ctx, l, 16))) + 30);
      D.panel(ctx, TT.W / 2 - ow / 2, 12, ow, 16 + lines.length * 20, { fill: 'rgba(43,30,92,0.88)', grad: false, r: 12, lw: 2.5 });
      lines.forEach((l, i) => D.text(ctx, l, TT.W / 2, 31 + i * 20, { size: 16, align: 'center', color: '#fff8e0', lw: 3 }));
      ctx.restore();
      // gombok
      const L = this.touchLayout();
      D.button(ctx, L.menu.x, L.menu.y, L.menu.w, L.menu.h, '', { color: '#6c5ce7', r: 10 });
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(L.menu.x + 15, L.menu.y + 13 + i * 8, 24, 4);
      }
      D.button(ctx, L.map.x, L.map.y, L.map.w, L.map.h, '', { color: '#3fa7ff', r: 10 });
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(L.map.x + 12, L.map.y + 14);
      ctx.lineTo(L.map.x + 22, L.map.y + 10);
      ctx.lineTo(L.map.x + 32, L.map.y + 14);
      ctx.lineTo(L.map.x + 42, L.map.y + 10);
      ctx.lineTo(L.map.x + 42, L.map.y + 32);
      ctx.lineTo(L.map.x + 32, L.map.y + 36);
      ctx.lineTo(L.map.x + 22, L.map.y + 32);
      ctx.lineTo(L.map.x + 12, L.map.y + 36);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      if (!TT.input.isTouch()) {
        D.keycap(ctx, 'Esc', L.menu.x + L.menu.w / 2, L.menu.y + L.menu.h + 12, { size: 10 });
        D.keycap(ctx, 'M', L.map.x + L.map.w / 2, L.map.y + L.map.h + 12, { size: 10 });
      }
      // csapat kis ikonjai
      s.team.forEach((id, i) => {
        const x = 12 + i * 50, y = TT.H - 62;
        D.panel(ctx, x, y, 46, 50, { fill: '#2b1e5c', r: 10, lw: 2, shadow: false });
        ctx.drawImage(TT.art.figureCanvas(id, 96, { pedestal: false }), x - 3, y - 4, 52, 52);
        D.text(ctx, String(s.owned[id] ? s.owned[id].lvl : 1), x + 40, y + 42, { size: 13, align: 'right', color: '#ffd23f', lw: 3 });
      });
      // érintéses vezérlők
      if (TT.input.isTouch()) {
        const a = L.a;
        ctx.save();
        ctx.globalAlpha = this.prompt ? 0.95 : 0.5;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6b35';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1d1433';
        ctx.stroke();
        ctx.restore();
        D.text(ctx, 'A', a.x, a.y + 2, { size: 36, align: 'center' });
        if (this.joy) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(this.joy.ox, this.joy.oy, 60, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(this.joy.x, this.joy.y, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (this.t < 6) {
          D.text(ctx, 'Húzd az ujjad a bal oldalon a mozgáshoz', 240, TT.H - 90, { size: 15, align: 'center', color: '#fff', alpha: 0.8 });
        }
      } else if (this.t < 8 && TT.save.playTime < 120) {
        D.text(ctx, 'Mozgás: WASD / nyilak · Futás: Shift · Beszéd: E', TT.W / 2, TT.H - 24, { size: 16, align: 'center', alpha: 0.9 });
      }
      if (this.showMap) this.drawMap(ctx);
    },

    drawMap(ctx) {
      const TS = W.TS;
      const sc = 5.7;
      const mw = W.MW * sc, mh = W.MH * sc;
      const x = TT.W / 2 - mw / 2, y = 64;
      D.panel(ctx, x - 10, y - 10, mw + 20, mh + 20, { fill: '#2b1e5c', r: 14, lw: 3 });
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(minimap, x, y, mw, mh);
      ctx.restore();
      const k = mw / (W.MW * TS);
      for (const b of W.buildings) {
        if (!b.name) continue;
        const bx = x + b.door[0] * TS * k, by = y + b.door[1] * TS * k;
        D.text(ctx, b.name, bx, by - 14, { size: 12, align: 'center', color: '#fff', lw: 3 });
      }
      for (const n of W.npcs) {
        if (!n.trainer || TT.save.beaten[n.trainer]) continue;
        ctx.beginPath();
        ctx.arc(x + n.x * TS * k, y + n.y * TS * k, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4f4f';
        ctx.fill();
      }
      const px = x + this.pl.x * k, py = y + this.pl.y * k;
      ctx.beginPath();
      ctx.arc(px, py, 6 + Math.sin(TT.time * 6) * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      D.text(ctx, 'Piros pont: edző · Sárga: te vagy · M: bezár', TT.W / 2, y + mh + 2, { size: 13, align: 'center', color: '#c8b8f0', lw: 3 });
    },
  };

  // Beállítások ablak (bárhonnan hívható)
  TT.openSettings = function () {
    const st = TT.settings;
    const pct = (v) => Math.round(v * 100) + '%';
    const cycle = (v) => {
      const steps = [0, 0.25, 0.5, 0.75, 1];
      const i = steps.findIndex((s) => Math.abs(s - v) < 0.01);
      return steps[(i + 1) % steps.length];
    };
    TT.ui.choose({
      title: 'Beállítások',
      options: [
        { label: 'Zene: ' + pct(st.music), value: 'music' },
        { label: 'Hangeffektek: ' + pct(st.sfx), value: 'sfx' },
        { label: 'Képernyőrázás: ' + (st.shake ? 'Be' : 'Ki'), value: 'shake' },
        { label: 'Teljes képernyő', value: 'fs' },
        { label: 'Mentés exportálása', value: 'export' },
        { label: 'Kész', value: null, color: '#6c5ce7' },
      ],
    }, (v) => {
      if (!v) return;
      if (v === 'music') st.music = cycle(st.music);
      if (v === 'sfx') st.sfx = cycle(st.sfx);
      if (v === 'shake') st.shake = !st.shake;
      if (v === 'fs') {
        try {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
        } catch (e) { /* nem támogatott */ }
      }
      if (v === 'export') {
        const code = TT.store.exportString();
        try {
          navigator.clipboard.writeText(code);
          TT.ui.toast('Mentéskód a vágólapra másolva!');
        } catch (e) {
          window.prompt('Mentéskód (másold ki):', code);
        }
      }
      TT.store.writeSettings();
      TT.audio.sfx('select');
      if (v !== 'export' && v !== 'fs') TT.openSettings();
    });
  };

  TT.register('world', scene);
})(window.TT);
