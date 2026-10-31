'use strict';
// A H.I.V.E. Akadémia belseje (Brother Blood legyőzése után nyílik): bejárható folyosó a diákokkal,
// a H.I.V.E. Vizsga (5 óra egymás után, egy vereség és bukás) és a napi Büntetőterem.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const FLOOR = { x0: 60, x1: 900, y0: 330, y1: 512 };
  const INK = '#1d1433';

  // a vizsga órái: k = szinttöbblet a játékos csapatához képest
  const CLASSES = [
    {
      name: 'Tech-óra', teacher: 'gizmo', k: 0, team: ['boxbot', 'cyborg_head', 'gizmo'], coins: 150,
      intro: 'Első óra: Tech! Ha ezt elrontod, örökre ócska műanyag maradsz, Robin!',
    },
    {
      name: 'Átoktan', teacher: 'jinx', k: 1, team: ['kitten', 'wykkyd', 'jinx'], coins: 200,
      intro: 'Pech, hogy ide kerültél. Nálam mindenkinek balszerencséje van.',
    },
    {
      name: 'Tornaóra', teacher: 'mammoth', k: 1, team: ['plasmus', 'cinderblock', 'mammoth'], coins: 250,
      intro: 'TORNAÓRA! Aki elesik, az kiesik!',
    },
    {
      name: 'Megfigyelés', teacher: 'seemore', k: 2, team: ['thunder', 'billy', 'seemore'], coins: 300,
      intro: 'Mindent látok. A gyenge pontjaidat is. Billy, mindannyian, rá!',
    },
    {
      name: 'Igazgatói vizsga', teacher: 'bloodbrother', k: 3, team: ['rouge', 'blood_robot', 'bloodbrother'], coins: 500, boss: true,
      intro: 'Szóval eljutottál idáig. Most kiderül, méltó vagy-e a H.I.V.E. bizonyítványára.',
    },
  ];

  const QUIPS = {
    gizmo: ['A figurád? Ócska műanyag. Az enyém? Szintén. De legalább csillog!', 'Ne nyúlj a laborhoz, te nyálkás csigaagyú!', 'A Tech-órán mindig én vagyok az első. Mert én tanítom.'],
    jinx: ['Átkozott szerencséd van, hogy bejutottál.', 'A Büntetőteremben Kyd vár. Nem beszél, de nagyon ütős.', 'Mindig pechem van a dobozokkal. Csak gyakoriakat húzok.'],
    mammoth: ['ÉHES VAGYOK. Van nálad pizza?', 'A tornaórán tavaly kidobtam a kosárlabdát. A Holdra.', 'Erő ellen gyorsasággal gyere. Ezt nem tőlem tudod.'],
    seemore: ['Látom, hogy van egy legendás figurád a zsebedben. Három, valójában.', 'Az igazgató úr szeretné, ha kitűnőre vizsgáznál. Vagy megbuknál. Mindkettőt élvezi.', 'A vizsgán ha egyszer kikapsz, kezdheted elölről. Én mindent láttam már.'],
    billy: ['Szia! Szia! Szia! Szia! …Bocsi, ez mind én voltam.', 'Billy, Billy és Billy szerint te leszel az év diákja.', 'Ha legyőzöl, csinálok magamból egy figurát. Sokat.'],
    wykkyd: ['…', '……', '*Kyd Wykkyd némán a Büntetőterem felé mutat.*'],
  };

  const today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  };

  // a játékos csapatának szintje (a 3 legerősebb figura átlaga), ehhez igazodik az ellenfél
  function playerLevel() {
    const lv = Object.values(TT.save.owned).map((o) => o.lvl).sort((a, b) => b - a).slice(0, 3);
    const avg = lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length : 5;
    return U.clamp(Math.round(avg), 8, TT.MAX_LVL - 3);
  }

  function hiveSave() {
    const s = TT.save;
    s.hive = s.hive || { best: 0, clears: 0, run: 0, daily: '', detentions: 0 };
    return s.hive;
  }

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      this.pl = { x: 480, y: 500, dir: 'up', walk: 0, moving: false };
      this.joy = null;
      this.okCooldown = 0.5;
      this.npcs = [
        { who: 'gizmo', x: 150, y: 420, face: 1 },
        { who: 'jinx', x: 300, y: 372, face: 1 },
        { who: 'mammoth', x: 640, y: 380, face: -1 },
        { who: 'seemore', x: 820, y: 440, face: -1 },
        { who: 'billy', x: 400, y: 470, face: 1 },
        { who: 'wykkyd', x: 760, y: 356, face: -1, float: true },
      ];
      this.spots = [
        { id: 'exam', x: 480, y: 350, label: 'H.I.V.E. Vizsga' },
        { id: 'board', x: 165, y: 352, label: 'Eredménytábla' },
        { id: 'detention', x: 840, y: 356, label: 'Büntetőterem' },
        { id: 'door', x: 480, y: 516, label: 'Kijárat' },
      ];
      hiveSave();
      TT.audio.music('hive');
      // harc után: a vizsga vagy a büntetőóra eredménye (az első frissítéskor, amikor már aktív a jelenet)
      this.pending = p.res || null;
    },

    exit() {
      TT.audio.sfx('door');
      TT.go('world', { pos: this.p.back, dir: 'down' });
    },

    // ---------- H.I.V.E. Vizsga ----------
    openExam() {
      const h = hiveSave();
      const first = !TT.save.owned.blood_headmaster;
      TT.ui.choose({
        title: 'H.I.V.E. Vizsga',
        text: `5 óra egymás után, egyre erősebb ellenfelekkel (a csapatod szintjéhez igazodnak). Ha egyszer kikapsz, megbuktál, és elölről kezded. ` +
          (first ? 'Első kitűnő vizsgáért: Blood igazgató legendás figura!' : 'Kitűnő vizsgáért: 1500 érme és egy prémium doboz.'),
        width: 560,
        options: [
          { label: h.run > 0 ? `Folytatás: ${h.run + 1}. óra` : 'Vizsga indítása', value: 'go', color: '#2ecc71' },
          ...(h.run > 0 ? [{ label: 'Vizsga feladása (elölről)', value: 'quit' }] : []),
          { label: 'Mégse', value: null, color: '#6c5ce7' },
        ],
      }, (v) => {
        if (v === 'go') this.startClass(h.run);
        if (v === 'quit') {
          h.run = 0;
          TT.store.write();
          TT.ui.toast('A vizsgát feladtad. Bármikor újrakezdheted.');
        }
      });
    },

    startClass(i) {
      const c = CLASSES[i];
      const L = playerLevel();
      const lvl = Math.min(TT.MAX_LVL, L + c.k);
      const back = this.p.back;
      TT.go('battle', {
        enemy: {
          name: `${i + 1}. óra: ${c.name}`, who: c.teacher,
          team: c.team.map((id) => ({ id, lvl })),
          ai: c.boss ? 0.9 : 0.7 + i * 0.04, coins: c.coins, bg: 'hive', music: c.boss ? 'boss' : 'battle',
          intro: [{ who: c.teacher, text: c.intro }],
        },
        noRetry: true,
        after: (won) => TT.go('academy', { back, res: { kind: 'exam', i, won } }),
      });
    },

    examResult(r) {
      const h = hiveSave();
      const s = TT.save;
      if (!r.won) {
        h.run = 0;
        TT.store.write();
        TT.ui.say([
          { who: 'bloodbrother', text: `Megbuktál a(z) ${r.i + 1}. órán. A H.I.V.E. nem ad második esélyt… csak elsőt, újra.` },
          { text: `Legjobb eredményed: ${h.best}/5 óra. Próbáld újra!` },
        ]);
        return;
      }
      h.best = Math.max(h.best, r.i + 1);
      if (r.i + 1 < CLASSES.length) {
        h.run = r.i + 1;
        TT.store.write();
        TT.audio.sfx('levelup');
        TT.ui.choose({
          title: `${r.i + 1}. óra: kész!`,
          text: `Következik: ${r.i + 2}. óra — ${CLASSES[r.i + 1].name}. Ha most kilépsz, később innen folytathatod.`,
          options: [
            { label: 'Tovább a következő órára', value: 'next', color: '#2ecc71' },
            { label: 'Szünet (később folytatom)', value: null, color: '#6c5ce7' },
          ],
        }, (v) => v === 'next' && this.startClass(r.i + 1));
        return;
      }
      // kitűnő vizsga
      h.run = 0;
      h.clears = (h.clears || 0) + 1;
      TT.audio.sfx('reveal');
      TT.fx.burst(TT.W / 2, 200, 40, { colors: ['#ffd23f', '#ffffff', '#1d1d2b'], shape: 'star', speed: 360, size: 9, life: 1, layer: 1 });
      if (!s.owned.blood_headmaster) {
        const info = TT.grantFigure('blood_headmaster');
        s.coins += 2000;
        TT.store.write();
        TT.ui.say([
          { who: 'bloodbrother', text: 'Kitűnő. Senki nem jutott még idáig. Ezt megérdemled: a személyes igazgatói figurám.' },
          { text: '+2000 érme, és megkaptad: Blood igazgató (legendás)!' },
        ], () => TT.ui.reveal('blood_headmaster', info, () => TT.checkAch()));
        return;
      }
      s.coins += 1500;
      const id = TT.rollBox(TT.BOXES[1]);
      const info = TT.grantFigure(id);
      TT.store.write();
      TT.ui.say([
        { who: 'bloodbrother', text: `Újra kitűnő. Ez már a(z) ${h.clears}. bizonyítványod.` },
        { text: '+1500 érme és egy prémium doboz!' },
      ], () => TT.ui.reveal(id, info, () => TT.checkAch()));
    },

    // ---------- Büntetőterem (naponta egyszer) ----------
    openDetention() {
      const h = hiveSave();
      if (h.daily === today()) {
        TT.ui.say([{ who: 'wykkyd', text: '……' }, { text: 'Ma már letöltötted a büntetést. Gyere vissza holnap!' }]);
        return;
      }
      TT.ui.choose({
        title: 'Büntetőterem',
        text: 'Kyd Wykkyd felügyel. Ha legyőzöd a csapatát, kapsz egy prémium dobozt. Naponta egyszer próbálhatod.',
        options: [
          { label: 'Harc!', value: 'go', color: '#ff6b35' },
          { label: 'Mégse', value: null, color: '#6c5ce7' },
        ],
      }, (v) => {
        if (v !== 'go') return;
        const lvl = Math.min(TT.MAX_LVL, playerLevel() + 2);
        const back = this.p.back;
        TT.go('battle', {
          enemy: {
            name: 'Büntetőóra', who: 'wykkyd', team: ['mad_mod', 'rouge', 'wykkyd'].map((id) => ({ id, lvl })),
            ai: 0.8, coins: 200, bg: 'hive', music: 'boss',
            intro: [{ who: 'wykkyd', text: '……!' }],
          },
          noRetry: true,
          after: (won) => TT.go('academy', { back, res: { kind: 'detention', won } }),
        });
      });
    },

    detentionResult(r) {
      const h = hiveSave();
      h.daily = today();
      if (!r.won) {
        TT.store.write();
        TT.ui.say([{ who: 'wykkyd', text: '…' }, { text: 'Kyd győzött. Holnap újra próbálhatod.' }]);
        return;
      }
      h.detentions = (h.detentions || 0) + 1;
      const id = TT.rollBox(TT.BOXES[1]);
      const info = TT.grantFigure(id);
      TT.store.write();
      TT.ui.say([{ who: 'wykkyd', text: '*Kyd Wykkyd elismerően biccent, és átnyújt egy dobozt.*' }], () => TT.ui.reveal(id, info, () => TT.checkAch()));
    },

    openBoard() {
      const h = hiveSave();
      const lines = [
        `Legjobb vizsgaeredmény: ${h.best}/5 óra`,
        `Kitűnő bizonyítványok: ${h.clears || 0}`,
        `Büntetőórák győzelemmel: ${h.detentions || 0}`,
        h.run > 0 ? `Folyamatban: ${h.run + 1}. óra jön (${CLASSES[h.run].name})` : 'Nincs folyamatban vizsga.',
        `Az ellenfelek szintje most: ${playerLevel()}–${Math.min(TT.MAX_LVL, playerLevel() + 3)}`,
      ];
      TT.ui.choose({ title: 'Eredménytábla', text: lines.join(' · '), width: 560, options: [{ label: 'Rendben', value: null, color: '#6c5ce7' }] }, () => {});
    },

    interact(it) {
      if (it.npc) {
        const n = it.npc;
        TT.ui.say([{ who: n.who, text: U.pick(QUIPS[n.who]) }]);
        if (n.who !== 'wykkyd') TT.audio.voice(n.who, 'chat', 0.7);
        return;
      }
      switch (it.id) {
        case 'exam': this.openExam(); break;
        case 'detention': this.openDetention(); break;
        case 'board': this.openBoard(); break;
        case 'door': this.exit(); break;
        default: break;
      }
    },

    nearest() {
      const pl = this.pl;
      let best = null, bd = 70;
      for (const n of this.npcs) {
        const d = U.dist(pl.x, pl.y, n.x, n.y);
        if (d < bd) {
          bd = d;
          best = { npc: n, x: n.x, y: n.y - 76, label: 'Beszélj' };
        }
      }
      for (const sp of this.spots) {
        const d = U.dist(pl.x, pl.y, sp.x, sp.y);
        if (d < bd) {
          bd = d;
          best = { id: sp.id, x: sp.x, y: sp.y - 44, label: sp.label };
        }
      }
      return best;
    },

    update(dt) {
      this.t += dt;
      if (this.pending && !TT.ui.overlayActive()) {
        const r = this.pending;
        this.pending = null;
        if (r.kind === 'exam') this.examResult(r);
        else this.detentionResult(r);
      }
      const I = TT.input;
      const pl = this.pl;
      if (I.hit('back') && !TT.ui.overlayActive()) {
        this.exit();
        return;
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
      const aBtn = { x: TT.W - 110, y: TT.H - 110, r: 46 };
      for (const tp of I.taps) {
        if (tp.x < TT.W * 0.5 && !this.joy) this.joy = { id: tp.id, ox: tp.x, oy: tp.y, x: tp.x, y: tp.y };
      }
      if (this.joy) {
        const ptr = I.pointers.get(this.joy.id);
        if (!ptr) this.joy = null;
        else {
          const dx = ptr.x - this.joy.ox, dy = ptr.y - this.joy.oy, d = Math.hypot(dx, dy);
          if (d > 8) {
            mx = dx / Math.max(d, 50);
            my = dy / Math.max(d, 50);
          }
        }
      }
      const mag = Math.hypot(mx, my);
      pl.moving = mag > 0.1 && !TT.ui.overlayActive();
      if (pl.moving) {
        const sp = 170 * Math.min(1, mag);
        pl.x = U.clamp(pl.x + (mx / Math.max(1, mag)) * sp * dt, FLOOR.x0, FLOOR.x1);
        pl.y = U.clamp(pl.y + (my / Math.max(1, mag)) * sp * dt, FLOOR.y0, FLOOR.y1);
        if (Math.abs(mx) > Math.abs(my)) pl.dir = mx > 0 ? 'right' : 'left';
        else pl.dir = my > 0 ? 'down' : 'up';
        pl.walk += dt * 11;
        if (pl.y >= FLOOR.y1 - 1 && Math.abs(pl.x - 480) < 50 && my > 0.5) {
          this.exit();
          return;
        }
      }
      this.prompt = this.nearest();
      this.okCooldown -= dt;
      const aTap = I.tapIn(aBtn.x - aBtn.r, aBtn.y - aBtn.r, aBtn.r * 2, aBtn.r * 2);
      if (aTap && this.joy && this.joy.id === aTap.id) this.joy = null;
      if ((I.hit('ok') || aTap) && this.prompt && this.okCooldown <= 0 && !TT.ui.overlayActive()) this.interact(this.prompt);
      for (const n of this.npcs) if (U.dist(pl.x, pl.y, n.x, n.y) < 160) n.face = pl.x > n.x ? 1 : -1;
    },

    // ---------- rajz ----------
    hexLogo(ctx, cx, cy, r) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = INK;
      ctx.stroke();
      D.text(ctx, 'H', cx, cy + 2, { size: r * 1.1, align: 'center', color: INK, stroke: false });
    },

    door(ctx, x, y, w, h, sign, color, open) {
      D.rr(ctx, x - 6, y - 6, w + 12, h + 6, 10);
      ctx.fillStyle = '#3a3a4e';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.stroke();
      D.rr(ctx, x, y, w, h, 6);
      ctx.fillStyle = open ? '#120a2c' : color;
      ctx.fill();
      ctx.stroke();
      if (!open) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 8, y + 8, w / 2 - 12, h - 16);
        ctx.beginPath();
        ctx.arc(x + w - 14, y + h / 2, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd23f';
        ctx.fill();
      }
      D.panel(ctx, x + w / 2 - 74, y - 40, 148, 28, { fill: '#ffd23f', r: 8, lw: 3, shadow: false });
      D.text(ctx, sign, x + w / 2, y - 26, { size: 14, align: 'center', color: INK, stroke: false });
    },

    drawRoom(ctx) {
      const W = TT.W, H = TT.H;
      // fal
      const g = ctx.createLinearGradient(0, 0, 0, 320);
      g.addColorStop(0, '#22222e');
      g.addColorStop(1, '#3a3a4e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 320);
      // sárga-fekete csík a fal alján
      for (let x = -40; x < W + 40; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 300);
        ctx.lineTo(x + 20, 300);
        ctx.lineTo(x + 40, 320);
        ctx.lineTo(x + 20, 320);
        ctx.closePath();
        ctx.fillStyle = '#ffd23f';
        ctx.fill();
      }
      ctx.fillStyle = INK;
      ctx.fillRect(0, 296, W, 4);
      // padló: sakktábla
      for (let y = 320; y < H; y += 40) {
        for (let x = 0; x < W; x += 40) {
          ctx.fillStyle = ((x + y) / 40) % 2 ? '#4a4a5e' : '#5a5a70';
          ctx.fillRect(x, y, 40, 40);
        }
      }
      const fl = ctx.createLinearGradient(0, 320, 0, H);
      fl.addColorStop(0, 'rgba(0,0,0,0.35)');
      fl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fl;
      ctx.fillRect(0, 320, W, H - 320);
      // nagy H.I.V.E. jelvény
      this.hexLogo(ctx, W / 2, 92, 54);
      // vizsgaterem ajtó középen, büntetőterem jobbra
      this.door(ctx, W / 2 - 46, 196, 92, 104, 'VIZSGATEREM', '#6a0f14', false);
      this.door(ctx, 790, 214, 80, 86, 'BÜNTETŐTEREM', '#2a2a3a', false);
      // szekrénysor
      for (let i = 0; i < 6; i++) {
        const x = 252 + i * 34;
        if (x > W / 2 - 70) break;
        D.rr(ctx, x, 214, 30, 86, 4);
        ctx.fillStyle = i % 2 ? '#7a8496' : '#8a95a8';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.fillStyle = INK;
        for (let k = 0; k < 3; k++) ctx.fillRect(x + 8, 224 + k * 6, 14, 2);
      }
      for (let i = 0; i < 4; i++) {
        const x = W / 2 + 70 + i * 34;
        D.rr(ctx, x, 214, 30, 86, 4);
        ctx.fillStyle = i % 2 ? '#7a8496' : '#8a95a8';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
      // eredménytábla
      D.rr(ctx, 100, 200, 130, 96, 8);
      ctx.fillStyle = '#1f3a2a';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#8b5a2b';
      ctx.stroke();
      const h = hiveSave();
      D.text(ctx, 'VIZSGA', 165, 222, { size: 15, align: 'center', color: '#e8f0e8', stroke: false });
      for (let i = 0; i < 5; i++) {
        const done = i < Math.max(h.best || 0, h.run || 0);
        D.star(ctx, 120 + i * 22, 254, 9, 4, 5);
        ctx.fillStyle = done ? '#ffd23f' : 'rgba(255,255,255,0.18)';
        ctx.fill();
      }
      D.text(ctx, `Kitűnő: ${h.clears || 0}`, 165, 280, { size: 13, align: 'center', color: '#e8f0e8', stroke: false });
      // falilámpák
      for (const x of [60, 900]) {
        ctx.beginPath();
        ctx.arc(x, 150, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe066';
        ctx.fill();
        const lg = ctx.createRadialGradient(x, 150, 4, x, 150, 90);
        lg.addColorStop(0, 'rgba(255,224,102,0.35)');
        lg.addColorStop(1, 'rgba(255,224,102,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(x - 90, 60, 180, 180);
      }
      // kijárat jelzés lent
      D.panel(ctx, W / 2 - 40, H - 22, 80, 18, { fill: '#2ecc71', r: 6, lw: 2, shadow: false });
      D.text(ctx, 'KIJÁRAT', W / 2, H - 13, { size: 11, align: 'center', color: '#fff', lw: 2 });
    },

    draw(ctx) {
      this.drawRoom(ctx);
      const items = [];
      const shadow = (x, y) => {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 18, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();
      };
      for (const n of this.npcs) {
        items.push({
          y: n.y, draw: () => {
            shadow(n.x, n.y);
            const fy = n.float ? n.y - 14 + Math.sin(this.t * 2) * 5 : n.y;
            TT.art.drawToy(ctx, TT.FIG[n.who], n.x, fy, 0.9, { facing: n.face, t: this.t + n.x });
          },
        });
      }
      const pl = this.pl;
      items.push({
        y: pl.y, draw: () => {
          shadow(pl.x, pl.y);
          TT.art.drawToy(ctx, TT.FIG.robin, pl.x, pl.y, 0.9, { dir: pl.dir, moving: pl.moving, walk: pl.walk, paint: TT.paintOf('robin'), live: true });
        },
      });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.draw();
      D.panel(ctx, 12, 12, 270, 44, { fill: '#2b1e5c', r: 12, lw: 2.5 });
      D.text(ctx, 'H.I.V.E. Akadémia', 147, 35, { size: 22, align: 'center', color: '#ffd23f' });
      const p = this.prompt;
      if (p && !TT.ui.overlayActive()) {
        const touch = TT.input.isTouch();
        const w = D.measure(ctx, p.label, 16) + (touch ? 22 : 46);
        const b = Math.sin(TT.time * 6) * 2;
        D.panel(ctx, p.x - w / 2, p.y - 16 + b, w, 30, { fill: '#fdf6e3', r: 10, lw: 2.5, shadow: false });
        if (!touch) D.keycap(ctx, 'E', p.x - w / 2 + 18, p.y - 1 + b, { size: 12, color: '#ffd23f' });
        D.text(ctx, p.label, touch ? p.x : p.x + 12, p.y + b, { size: 16, align: 'center', color: '#1b1140', stroke: false });
      }
      if (TT.input.isTouch()) {
        D.roundButton(ctx, TT.W - 110, TT.H - 110, 46, 'A', { color: '#ff6b35', alpha: p ? 0.95 : 0.55, size: 34 });
      }
      TT.fx.draw(ctx, 1);
    },
  };

  TT.register('academy', scene);
})(window.TT);
