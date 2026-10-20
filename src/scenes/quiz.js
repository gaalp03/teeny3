'use strict';
// Titán-kvíz: Control Freak kvízműsora a Képregényboltban. A kérdések a játék saját adataiból készülnek.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const COUNT = 8;
  const TIME = 12;
  const DAILY_PAID = 3;
  const BW = 330, BH = 58, BGAP = 14;
  const BX = (TT.W - (BW * 2 + BGAP)) / 2, BY = 362;

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  // 4 válaszlehetőség: a helyes + 3 különböző rossz, összekeverve
  function options(right, wrongPool) {
    const wrong = U.shuffle(wrongPool.filter((w) => w !== right)).filter((w, i, a) => a.indexOf(w) === i).slice(0, 3);
    const opts = U.shuffle([right].concat(wrong));
    return { opts, answer: opts.indexOf(right) };
  }

  // Sziluettek összehasonlítása: a két körvonal eltérő pixeleinek aránya az együttes területhez
  const SIL = 64, SIL_MIN = 0.08;
  const masks = {};
  function mask(id) {
    if (masks[id]) return masks[id];
    const m = new Uint8Array(SIL * SIL);
    try {
      const d = TT.art.figureCanvas(id, SIL, { pedestal: false, silhouette: true, paint: null }).getContext('2d').getImageData(0, 0, SIL, SIL).data;
      for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 128 ? 1 : 0;
    } catch (e) {
      m.fill(2); // nem olvasható kép: mindenki „különbözőnek” számít
    }
    masks[id] = m;
    return m;
  }
  function silDiff(a, b) {
    const x = mask(a), y = mask(b);
    if (x[0] === 2 || y[0] === 2) return 1;
    let diff = 0, union = 0;
    for (let i = 0; i < x.length; i++) {
      if (x[i] !== y[i]) diff++;
      if (x[i] || y[i]) union++;
    }
    return union ? diff / union : 0;
  }

  const article = (w) => (/^[aáeéiíoóöőuúüű]/i.test(w) ? 'az' : 'a');

  // Kérdéstípusok: mindegyik egy kérdést ad vissza, vagy null-t, ha épp nem tud jót csinálni
  const figs = () => TT.FIG_LIST.filter((f) => f.look);
  const names = (list) => list.map((f) => f.name);
  const GEN = {
    who() {
      const f = U.pick(figs());
      // a rossz válaszok közt ne legyen a változata, se szinte ugyanolyan körvonalú figura
      const same = figs().filter((x) => x.id !== f.id && TT.baseOf(x.id) !== TT.baseOf(f.id) && silDiff(f.id, x.id) > SIL_MIN);
      return Object.assign({ text: 'Ki ez a figura?', fig: f.id, sil: true }, options(f.name, names(U.shuffle(same))));
    },
    type() {
      const f = U.pick(figs());
      return Object.assign({ text: `Milyen típusú ${f.name}?`, fig: f.id }, options(TT.TYPES[f.type].name, Object.values(TT.TYPES).map((t) => t.name)));
    },
    rarity() {
      const f = U.pick(figs());
      return Object.assign({ text: `Milyen ritka ${f.name}?`, fig: f.id }, options(TT.RARITY[f.rarity].name, Object.values(TT.RARITY).map((r) => r.name)));
    },
    beats() {
      const k = U.pick(Object.keys(TT.TYPES));
      const t = TT.TYPES[k];
      return Object.assign({ text: `Melyik típust győzi le ${article(t.name)} ${t.name} típus?` }, options(TT.TYPES[t.beats].name, Object.values(TT.TYPES).map((x) => x.name)));
    },
    sup() {
      const f = U.pick(figs());
      const m = TT.MOVES[f.sup];
      // több figura is használhatja ugyanazt a szupert: a rossz válaszok közt ne legyen ilyen
      const others = figs().filter((x) => x.sup !== f.sup);
      return Object.assign({ text: `Kinek a szuper támadása: „${m.name}”?` }, options(f.name, names(U.shuffle(others))));
    },
    passive() {
      const f = U.pick(figs());
      const p = TT.passiveOf(f);
      return Object.assign({ text: `Mi ${f.name} passzív képessége?`, fig: f.id }, options(TT.PASSIVES[p].name, Object.values(TT.PASSIVES).map((x) => x.name)));
    },
    combo() {
      const c = U.pick(TT.COMBOS);
      const a = TT.FIG[c[0]], b = TT.FIG[c[1]];
      if (!a || !b) return null;
      const partners = new Set(TT.COMBOS.filter((k) => k[0] === c[0] || k[1] === c[0]).map((k) => (k[0] === c[0] ? k[1] : k[0])));
      // a társ változatai is kombót adnának, és a saját változatai is félrevezetők lennének
      const wrong = figs().filter((x) => TT.baseOf(x.id) !== TT.baseOf(a.id) && !partners.has(TT.baseOf(x.id)) && !partners.has(x.id));
      return Object.assign({ text: `Kivel alkot barátság-kombót ${a.name}? („${c[2]}”)`, fig: a.id }, options(b.name, names(U.shuffle(wrong))));
    },
    strongest() {
      const four = U.shuffle(figs().filter((f) => !f.noBox)).slice(0, 4);
      const key = U.pick(['hp', 'atk', 'spd']);
      // 1. szinten, csillagok nélkül, a ritkasággal együtt (a Gyűjtemény egy 1. szintű figuránál ugyanezt mutatja)
      const val = (f) => Math.round(TT.statsFor(f, 1)[key] * 10);
      const top = four.slice().sort((x, y) => val(y) - val(x));
      if (val(top[0]) === val(top[1])) return null;
      const opts = four.map((f) => f.name);
      const text = {
        hp: 'Melyik figurának van a legtöbb életereje (HP) 1. szinten?',
        atk: 'Melyik figurának a legnagyobb a támadóereje 1. szinten?',
        spd: 'Melyik figura a leggyorsabb?',
      }[key];
      return { text, opts, answer: opts.indexOf(top[0].name) };
    },
  };
  const ORDER = ['who', 'type', 'sup', 'beats', 'who', 'rarity', 'combo', 'passive', 'strongest', 'who'];

  function makeQuestions() {
    const out = [];
    const used = new Set();
    let guard = 0;
    // két „Ki ez?” kérdés mindig lesz, a többi vegyes
    const kinds = ['who', 'who'].concat(U.shuffle(ORDER.filter((k) => k !== 'who')));
    while (out.length < COUNT && guard++ < 200) {
      const kind = kinds[out.length % kinds.length] || U.pick(ORDER);
      const q = GEN[kind]();
      if (!q || q.opts.length < 4 || q.answer < 0) continue;
      const sig = q.text + '|' + (q.fig || '');
      if (used.has(sig)) continue;
      used.add(sig);
      q.kind = kind;
      out.push(q);
    }
    return U.shuffle(out);
  }

  // stúdió háttér (egyszer rajzolva)
  let bg = null;
  function background() {
    if (bg) return bg;
    bg = TT.makeCanvas(TT.W, TT.H);
    const g = bg.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, TT.H);
    grd.addColorStop(0, '#2a1060');
    grd.addColorStop(1, '#5a1f8a');
    g.fillStyle = grd;
    g.fillRect(0, 0, TT.W, TT.H);
    D.sunburst(g, TT.W / 2, 150, 700, 18, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)', 0);
    // színpad
    g.fillStyle = '#1d0f40';
    g.fillRect(0, TT.H - 40, TT.W, 40);
    g.fillStyle = 'rgba(255,210,63,0.85)';
    for (let x = 12; x < TT.W; x += 34) {
      g.beginPath();
      g.arc(x, TT.H - 40, 5, 0, Math.PI * 2);
      g.fill();
    }
    return bg;
  }

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      this.state = 'count';
      this.qs = makeQuestions();
      this.i = 0;
      this.right = 0;
      this.answered = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.score = 0;
      this.picked = -1;
      this.left = TIME;
      this.host = 'Üdv a Titán-kvízben! Én vagyok Control Freak, a műsorvezető. Lássuk, mennyire ismered a figurákat!';
      this.menu = new TT.ui.Menu();
      TT.audio.music('comics');
    },

    setAnswers() {
      const q = this.qs[this.i];
      this.menu = new TT.ui.Menu();
      this.menu.set(q.opts.map((label, k) => ({
        id: 'a' + k, x: BX + (k % 2) * (BW + BGAP), y: BY + Math.floor(k / 2) * (BH + BGAP), w: BW, h: BH, silent: true,
        draw: (ctx, b, focus, pressed) => this.drawAnswer(ctx, b, k, label, focus, pressed),
        onClick: () => this.answer(k),
      })));
    },

    ask() {
      this.state = 'ask';
      this.t = 0;
      this.left = TIME;
      this.picked = -1;
      this.setAnswers();
      TT.audio.sfx('whoosh');
    },

    answer(k) {
      if (this.state !== 'ask') return;
      const q = this.qs[this.i];
      this.picked = k;
      this.answered++;
      this.state = 'reveal';
      this.t = 0;
      if (k === q.answer) {
        this.right++;
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        const pts = 100 + Math.ceil(this.left) * 10 + (this.streak >= 3 ? 50 : 0);
        this.score += pts;
        TT.audio.sfx('found');
        const b = this.menu.items[k];
        TT.fx.text(b.x + b.w / 2, b.y - 6, '+' + pts, { color: '#7bff6b', tsize: 22 });
        TT.fx.burst(b.x + b.w / 2, b.y + b.h / 2, 12, { colors: ['#7bff6b', '#ffd23f', '#ffffff'], shape: 'star', speed: 200, size: 5, life: 0.5 });
        this.host = U.pick(['Helyes! Ezt a figurák nagykönyve is így írja!', 'Pontosan! A közönség tombol!', 'Telitalálat! Ez igazi rajongói tudás!', 'Így van! Még a távirányítóm is tapsol!'])
          + (this.streak >= 3 ? ` ${this.streak} jó válasz egymás után!` : '');
      } else {
        this.streak = 0;
        TT.audio.sfx('error');
        this.host = k < 0
          ? `Lejárt az idő! A helyes válasz: ${q.opts[q.answer]}.`
          : U.pick(['Áááá, nem talált!', 'Ó, ez nem nyert!', 'Hibás válasz, kedves néző!']) + ` A helyes: ${q.opts[q.answer]}.`;
      }
    },

    next() {
      this.i++;
      if (this.i >= this.qs.length) this.finish();
      else this.ask();
    },

    finish() {
      if (this.state === 'end') return;
      const s = TT.save;
      s.quizDay = s.quizDay && s.quizDay.date === today() ? s.quizDay : { date: today(), plays: 0 };
      // válasz nélküli kilépés nem számít játéknak
      if (this.answered > 0) {
        s.quizDay.plays++;
        s.stats.quizGames = (s.stats.quizGames || 0) + 1;
      }
      const paid = s.quizDay.plays <= DAILY_PAID;
      const full = this.right * 20 + (this.right >= COUNT ? 100 : 0);
      const coins = paid ? full : Math.min(30, Math.round(full / 5));
      s.coins += coins;
      const best = s.flags.quizBest || 0;
      this.newBest = this.answered > 0 && this.right > best;
      if (this.newBest) s.flags.quizBest = this.right;
      TT.store.write();
      TT.checkAch();
      this.result = { coins, paid, left: Math.max(0, DAILY_PAID - s.quizDay.plays) };
      this.state = 'end';
      this.t = 0;
      this.host = this.right >= COUNT ? 'HIBÁTLAN! Te vagy a Titán-kvíz bajnoka!' : this.right >= 5 ? 'Szép teljesítmény! Gyere vissza holnap is!' : 'Gyakorolj még! A Gyűjteményben minden adat ott van.';
      TT.audio.sfx(this.right >= 5 ? 'levelup' : 'coin');
      this.menu = new TT.ui.Menu();
      this.menu.set([
        { id: 'again', x: TT.W / 2 - 230, y: 410, w: 220, h: 56, label: 'Újra', color: '#ff6b35', onClick: () => TT.go('quiz', this.p) },
        { id: 'back', x: TT.W / 2 + 10, y: 410, w: 220, h: 56, label: 'Vissza', color: '#6c5ce7', onClick: () => TT.go('world', { pos: this.p.back, dir: 'down' }) },
      ]);
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      if (this.state === 'count') {
        if (this.t > 2.6 || (this.t > 0.6 && I.hit('ok'))) this.ask();
        return;
      }
      if (this.state === 'end') {
        if (this.t > 0.6) this.menu.update();
        return;
      }
      if (I.hit('back')) {
        this.finish();
        return;
      }
      if (this.state === 'reveal') {
        if (this.t > 2.2 || (this.t > 0.5 && I.hit('ok'))) this.next();
        return;
      }
      this.left = Math.max(0, TIME - this.t);
      this.menu.update();
      if (this.state === 'ask' && this.left <= 0) this.answer(-1);
    },

    drawAnswer(ctx, b, k, label, focus, pressed) {
      const q = this.qs[this.i];
      let color = ['#ff6b35', '#3f6fd8', '#2ecc71', '#c06bff'][k];
      if (this.state === 'reveal') {
        if (k === q.answer) color = '#2f9e44';
        else if (k === this.picked) color = '#e84545';
        else color = '#5a5470';
      }
      D.button(ctx, b.x, b.y, b.w, b.h, '', { color, focus: focus && this.state === 'ask', pressed });
      D.text(ctx, 'ABCD'[k], b.x + 26, b.y + b.h / 2 + 1, { size: 24, align: 'center', color: '#ffd23f' });
      let size = 21;
      while (size > 13 && D.measure(ctx, label, size) > b.w - 66) size--;
      D.text(ctx, label, b.x + 48, b.y + b.h / 2 + 1, { size, maxWidth: b.w - 60 });
      if (this.state === 'reveal' && k === q.answer) D.text(ctx, '✔', b.x + b.w - 22, b.y + b.h / 2, { size: 24, align: 'center', color: '#ffffff' });
    },

    drawHost(ctx) {
      const hostTalk = this.state !== 'ask';
      TT.art.drawToy(ctx, TT.FIG.controlfreak, 96, 300, 1.05, { pose: hostTalk ? 'cheer' : 'idle', t: this.t, yaw3d: -0.4, live: true });
      // beszédbuborék
      const lines = D.wrap(ctx, this.host, 520, 17).slice(0, 3);
      const h = 22 + lines.length * 22;
      const x = 176, y = 230 - h / 2;
      D.panel(ctx, x, y, 560, h, { fill: '#fff8e0', r: 14, lw: 3, shadow: false });
      ctx.fillStyle = '#fff8e0';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + h / 2 - 9);
      ctx.lineTo(x - 16, y + h / 2 + 4);
      ctx.lineTo(x + 2, y + h / 2 + 9);
      ctx.fill();
      lines.forEach((l, i) => D.text(ctx, l, x + 18, y + 22 + i * 22, { size: 17, color: '#1d1433', stroke: false }));
    },

    draw(ctx) {
      ctx.drawImage(background(), 0, 0);
      // HUD
      D.panel(ctx, 16, 14, 196, 66, { fill: '#2b1e5c', r: 12, lw: 3 });
      D.text(ctx, `Kérdés: ${Math.min(this.i + 1, COUNT)} / ${COUNT}`, 30, 36, { size: 19, color: '#ffffff' });
      D.text(ctx, `Jó válasz: ${this.right}`, 30, 62, { size: 19, color: '#7bff6b' });
      D.panel(ctx, TT.W - 212, 14, 196, 66, { fill: '#2b1e5c', r: 12, lw: 3 });
      D.text(ctx, 'Pontszám', TT.W - 198, 36, { size: 16, color: '#c8b8f0', lw: 3 });
      D.text(ctx, U.fmt(this.score), TT.W - 198, 62, { size: 21, color: '#ffd23f' });

      if (this.state === 'count') {
        D.text(ctx, 'TITÁN-KVÍZ!', TT.W / 2, 140, { size: 64, align: 'center', color: '#ffd23f' });
        D.text(ctx, `${COUNT} kérdés, kérdésenként ${TIME} másodperc. A gyors válasz több pontot ér!`, TT.W / 2, 400, { size: 18, align: 'center', color: '#e8e2ff' });
        D.text(ctx, TT.input.isTouch() ? 'Koppints a válaszra.' : 'Kattints a válaszra, vagy nyilak + Enter.', TT.W / 2, 430, { size: 16, align: 'center', color: '#c8b8f0' });
        this.drawHost(ctx);
        TT.fx.draw(ctx, 1);
        return;
      }

      if (this.state === 'end') {
        this.drawHost(ctx);
        ctx.fillStyle = 'rgba(10,5,25,0.55)';
        ctx.fillRect(0, 290, TT.W, TT.H - 290);
        D.panel(ctx, TT.W / 2 - 260, 296, 520, 190, { fill: '#2b1e5c', r: 20, lw: 4 });
        D.text(ctx, `${this.right} / ${COUNT} jó válasz${this.newBest ? '  — ÚJ REKORD!' : ''}`, TT.W / 2, 326, { size: 26, align: 'center', color: this.newBest ? '#7bff6b' : '#ffffff' });
        D.coin(ctx, TT.W / 2 - 70, 362, 14);
        D.text(ctx, '+' + this.result.coins + ' érme', TT.W / 2 - 48, 363, { size: 24, color: '#ffd23f' });
        D.text(ctx, this.result.paid ? `Ma még ${this.result.left} teljes jutalmú játék van hátra.` : 'Mára elfogytak a teljes jutalmak (holnap újra!).', TT.W / 2, 388, { size: 14, align: 'center', color: '#c8b8f0', stroke: false });
        if (this.t > 0.6) this.menu.draw(ctx);
        TT.fx.draw(ctx, 1);
        return;
      }

      const q = this.qs[this.i];
      // kérdés kártya
      const qx = q.fig ? 300 : 170, qw = TT.W - qx - 40;
      D.panel(ctx, qx, 100, qw, 120, { fill: '#2b1e5c', r: 16, lw: 3 });
      const lines = D.wrap(ctx, q.text, qw - 40, 24).slice(0, 3);
      lines.forEach((l, k) => D.text(ctx, l, qx + qw / 2, 160 + (k - (lines.length - 1) / 2) * 30, { size: 24, align: 'center', color: '#ffffff' }));
      if (q.fig) {
        D.panel(ctx, 150, 92, 136, 136, { fill: '#fff8e0', r: 16, lw: 3 });
        const reveal = this.state === 'reveal';
        ctx.drawImage(TT.art.figureCanvas(q.fig, 128, { pedestal: false, silhouette: q.sil && !reveal, paint: null }), 154, 96, 128, 128);
        if (q.sil && !reveal) D.text(ctx, '?', 218, 160, { size: 44, align: 'center', color: '#ffd23f' });
      }
      // időzítő
      D.bar(ctx, BX, 250, BW * 2 + BGAP, 18, this.left / TIME, { color: this.left < 4 ? '#ff4f4f' : '#4cd964' });
      D.text(ctx, Math.ceil(this.left) + ' mp', TT.W / 2, 259.5, { size: 13, align: 'center', lw: 3 });
      // a műsorvezető csak értékeléskor szól közbe
      TT.art.drawToy(ctx, TT.FIG.controlfreak, 76, 300, 0.85, { pose: this.state === 'reveal' ? 'cheer' : 'idle', t: this.t, yaw3d: -0.4, live: true });
      if (this.state === 'reveal') {
        D.panel(ctx, BX, 284, BW * 2 + BGAP, 60, { fill: '#fff8e0', r: 12, lw: 3, shadow: false });
        const hl = D.wrap(ctx, this.host, BW * 2 - 20, 17).slice(0, 2);
        hl.forEach((l, k) => D.text(ctx, l, TT.W / 2, 314 + (k - (hl.length - 1) / 2) * 21, { size: 17, align: 'center', color: '#1d1433', stroke: false }));
      } else if (this.streak >= 2) {
        D.text(ctx, `Sorozat: ${this.streak} jó válasz`, TT.W / 2, 314, { size: 18, align: 'center', color: '#ffd23f' });
      }
      this.menu.draw(ctx);
      TT.fx.draw(ctx, 0);
      TT.fx.draw(ctx, 1);
    },
  };

  TT.QUIZ_COUNT = COUNT;
  TT.register('quiz', scene);
})(window.TT);
