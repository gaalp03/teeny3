'use strict';
// Tükörvilág: új harcmód. Itt nem gombokkal harcolsz, hanem a képernyőn felbukkanó jelekre koppintasz,
// amikor a szűkülő kör pont rájuk ér. Három tükörkép (Dühös Raven, Slade, Trigon), egyre gyorsabban.
//  - kék kard: támadás (pontosan = nagyobb sebzés)
//  - sárga pajzs: védekezés (ha elmulasztod, sebződsz)
//  - piros koponya: NE koppints rá!
//  - lila nagy kör: nyomd és tartsd, amíg a csík megtelik (óriási ütés)
//  - számozott láncok: sorrendben (1 → 2 → 3)
//  - a kombóval nő a sebzés; teli szupermérőnél a SZUPER gombot kell minél gyorsabban püfölni
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const INK = '#1d1433';
  const AREA = { x0: 150, x1: 810, y0: 150, y1: 410 };
  const PERFECT = 0.075, GOOD = 0.17;
  const HOLD_T = 0.7;
  const SUPER_T = 2.6;

  // a három tükörkép; minden szint gyorsabb, több a csapda, és saját trükkje van
  const STAGES = [
    { who: 'raven_rage', name: 'Dühös Raven tükörképe', hp: 100, every: 0.86, approach: 1.15, bomb: 0.14, hold: 0.1, def: 0.3, chain: 0, hit: 9,
      say: 'Ugyanaz vagyok, mint te. Csak dühösebb.' },
    { who: 'slade', name: 'Slade tükörképe', hp: 130, every: 0.66, approach: 0.95, bomb: 0.2, hold: 0.14, def: 0.32, chain: 0.12, hit: 11, mirror: true,
      say: 'A tükörben minden fordítva van. A jeleid is.' },
    { who: 'trigon', name: 'Trigon tükörképe', hp: 170, every: 0.5, approach: 0.82, bomb: 0.26, hold: 0.16, def: 0.34, chain: 0.18, hit: 13, dark: true,
      say: 'A SÖTÉTSÉGBEN NEM LÁTOD, MI JÖN. ÉN IGEN.' },
  ];
  const KIND_COL = { atk: '#3fa7ff', def: '#ffd23f', bomb: '#e84545', hold: '#a35cff' };

  function msave() {
    const s = TT.save;
    s.mirror = s.mirror || { best: 0, clears: 0, bestCombo: 0, hiscore: 0 };
    return s.mirror;
  }

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      const s = TT.save;
      // a csapat sorban harcol: ha egy figura kiesik, jön a következő
      this.team = s.team.filter((id) => TT.FIG[id]).map((id) => ({ id, fig: TT.FIG[id], lvl: s.owned[id] ? s.owned[id].lvl : 1, hp: 100 }));
      this.cur = 0;
      this.stage = 0;
      this.notes = [];
      this.fx = [];
      this.combo = 0;
      this.maxCombo = 0;
      this.score = 0;
      this.superM = 0;
      this.superRun = null;
      this.state = 'intro';
      this.shake = 0;
      this.flash = 0;
      const lv = this.team.map((m) => m.lvl);
      this.bossLvl = Math.min(TT.MAX_LVL, Math.round(lv.reduce((a, b) => a + b, 0) / Math.max(1, lv.length)) + 2);
      msave();
      TT.audio.music('boss');
      this.showIntro();
    },

    // ---------- menet ----------
    showIntro() {
      TT.ui.choose({
        title: 'Tükörvilág',
        text: 'Koppints a jelekre, amikor a szűkülő kör rájuk ér! KÉK kard: támadás. SÁRGA pajzs: védekezés (ha kihagyod, sebződsz). PIROS koponya: NE nyúlj hozzá! LILA: nyomd és tartsd. SZÁMOK: sorrendben. A kombó növeli a sebzést.',
        width: 620,
        options: [
          { label: 'Kezdés!', value: 'go', color: '#2ecc71' },
          { label: 'Vissza', value: null, color: '#6c5ce7' },
        ],
      }, (v) => {
        if (v === 'go') this.startStage(0);
        else this.leave();
      });
    },

    startStage(i) {
      this.stage = i;
      const st = STAGES[i];
      this.boss = { who: st.who, fig: TT.FIG[st.who], hp: st.hp, max: st.hp };
      this.notes = [];
      this.spawnT = 1.2;
      this.chainLeft = 0;
      this.state = 'banner';
      this.bannerT = 0;
      TT.audio.sfx('dramatic');
      TT.ui.say([{ who: st.who, text: st.say }], () => {
        this.state = 'play';
        TT.audio.sfx('go');
      });
    },

    leave() {
      TT.audio.sfx('door');
      TT.go('world', { pos: this.p.back, dir: 'down' });
    },

    me() {
      return this.team[this.cur];
    },

    // a sebzés a figura szintjétől és a típus/ritkaság-előnytől függ (itt is számít, ki kit kontráz)
    myDmg(base) {
      const m = this.me();
      const lvlK = U.clamp(1 + (m.lvl - this.bossLvl) * 0.03, 0.7, 1.3);
      const comboK = 1 + Math.min(this.combo, 30) * 0.05;
      return base * lvlK * comboK * TT.matchMult(m.fig, this.boss.fig);
    },
    hurtMe(base) {
      const st = STAGES[this.stage];
      const m = this.me();
      const d = base * (st.hit / 9) * TT.matchMult(this.boss.fig, m.fig);
      m.hp = Math.max(0, m.hp - d);
      this.combo = 0;
      this.shake = 0.25;
      this.flash = 0.3;
      TT.audio.sfx('hit2');
      if (m.hp <= 0) {
        TT.audio.sfx('ko');
        const next = this.team.findIndex((o, i) => i > this.cur && o.hp > 0);
        if (next < 0) this.lose();
        else {
          this.cur = next;
          this.pop(TT.W / 2, 120, `${this.me().fig.short} lép be!`, '#ffd23f', 22);
          TT.audio.sfx('swap');
        }
      }
    },
    hitBoss(d, x, y, perfect) {
      const b = this.boss;
      b.hp = Math.max(0, b.hp - d);
      this.score += Math.round(d * 10);
      this.pop(x, y - 34, perfect ? 'TÖKÉLETES!' : 'JÓ', perfect ? '#7bff6b' : '#ffffff', perfect ? 20 : 16);
      TT.audio.sfx(perfect ? 'perfect' : 'hit');
      if (b.hp <= 0) this.bossDown();
    },
    good(perfect) {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.superM = Math.min(100, this.superM + (perfect ? 7 : 3));
      if (this.superM >= 100 && !this.superReady) {
        this.superReady = true;
        TT.audio.sfx('superfull');
      }
    },
    pop(x, y, text, color, size) {
      this.fx.push({ x, y, text, color, size: size || 16, t: 0 });
    },

    bossDown() {
      this.notes = [];
      this.superRun = null;
      TT.audio.sfx('ko');
      TT.fx.burst(700, 260, 30, { colors: ['#8e5cff', '#ffffff', '#3fd8ff'], shape: 'star', speed: 340, size: 8, life: 0.9, layer: 1 });
      const ms = msave();
      ms.best = Math.max(ms.best, this.stage + 1);
      if (this.stage + 1 < STAGES.length) {
        this.state = 'between';
        // kis pihenő: minden élő figura 25 HP-t gyógyul
        for (const m of this.team) if (m.hp > 0) m.hp = Math.min(100, m.hp + 25);
        TT.store.write();
        TT.ui.choose({
          title: 'Tükörkép legyőzve!',
          text: `Következik: ${STAGES[this.stage + 1].name}. Gyorsabb és több a csapda. Az élő figuráid +25 HP-t gyógyultak.`,
          options: [{ label: 'Tovább!', value: 'go', color: '#2ecc71' }, { label: 'Feladom', value: null, color: '#6c5ce7' }],
        }, (v) => (v === 'go' ? this.startStage(this.stage + 1) : this.finish(false)));
        return;
      }
      this.finish(true);
    },
    lose() {
      this.state = 'over';
      this.notes = [];
      this.finish(false);
    },
    finish(won) {
      const ms = msave();
      const s = TT.save;
      ms.bestCombo = Math.max(ms.bestCombo || 0, this.maxCombo);
      ms.hiscore = Math.max(ms.hiscore || 0, this.score);
      this.state = 'over';
      const after = () => {
        TT.checkAch();
        TT.ui.choose({
          title: won ? 'Tükörvilág teljesítve!' : 'A tükör összetört…',
          text: `Pontszám: ${this.score} (rekord: ${ms.hiscore}) · Legnagyobb kombó: ${this.maxCombo} · Legjobb: ${ms.best}/3 tükörkép`,
          options: [{ label: 'Újra', value: 'again', color: '#ff6b35' }, { label: 'Vissza a városba', value: null, color: '#6c5ce7' }],
        }, (v) => (v === 'again' ? TT.go('mirror', this.p) : this.leave()));
      };
      if (!won) {
        TT.store.write();
        after();
        return;
      }
      ms.clears = (ms.clears || 0) + 1;
      TT.audio.sfx('legend');
      if (!s.owned.raven_mirror) {
        const info = TT.grantFigure('raven_mirror');
        s.coins += 3000;
        TT.store.write();
        TT.ui.say([
          { who: 'raven', text: 'Átjutottál mindhárom tükörképen. Ezt még senki nem csinálta meg. A tükör egy darabja most a tiéd.' },
          { text: '+3000 érme, és megkaptad: Tükör Raven (legendás)!' },
        ], () => TT.ui.reveal('raven_mirror', info, after));
        return;
      }
      s.coins += 2000;
      const id = TT.rollBox(TT.BOXES[2]);
      const info = TT.grantFigure(id);
      TT.store.write();
      TT.ui.say([{ text: '+2000 érme és egy legendás doboz!' }], () => TT.ui.reveal(id, info, after));
    },

    // ---------- jelek ----------
    spawn() {
      const st = STAGES[this.stage];
      const r = Math.random();
      let kind = 'atk';
      if (r < st.bomb) kind = 'bomb';
      else if (r < st.bomb + st.hold) kind = 'hold';
      else if (r < st.bomb + st.hold + st.def) kind = 'def';
      const place = () => {
        for (let k = 0; k < 12; k++) {
          const x = U.rand(AREA.x0, AREA.x1), y = U.rand(AREA.y0, AREA.y1);
          if (this.notes.every((n) => Math.hypot(n.x - x, n.y - y) > 90)) return [x, y];
        }
        return [U.rand(AREA.x0, AREA.x1), U.rand(AREA.y0, AREA.y1)];
      };
      // lánc: 3 számozott támadás egymás után, rövid távolságra
      if (kind === 'atk' && st.chain && Math.random() < st.chain) {
        const [x0, y0] = place();
        const ang = U.rand(0, Math.PI * 2);
        for (let i = 0; i < 3; i++) {
          const x = U.clamp(x0 + Math.cos(ang) * i * 80, AREA.x0, AREA.x1), y = U.clamp(y0 + Math.sin(ang) * i * 70, AREA.y0, AREA.y1);
          this.notes.push({ kind: 'atk', x, y, t: 0, due: st.approach + i * 0.32, num: i + 1, chain: true });
        }
        return;
      }
      const [x, y] = place();
      const n = { kind, x, y, t: 0, due: st.approach };
      // Slade trükkje: a jel félúton átugrik a tükrözött helyére
      if (st.mirror && Math.random() < 0.35) n.flipAt = st.approach * 0.45;
      this.notes.push(n);
    },

    judge(n) {
      const d = n.t - n.due;
      if (Math.abs(d) <= PERFECT) return 'perfect';
      if (Math.abs(d) <= GOOD) return 'good';
      return d < 0 ? 'early' : 'late';
    },

    tapAt(x, y, id) {
      // szuper: a középső gomb püfölése
      if (this.superRun) {
        const b = this.superBtn();
        if (Math.hypot(x - b.x, y - b.y) < b.r + 20) {
          this.superRun.taps++;
          TT.audio.sfx('hit');
          this.superRun.pulse = 1;
        }
        return;
      }
      if (this.superReady) {
        const b = this.superBtn();
        if (Math.hypot(x - b.x, y - b.y) < b.r) {
          this.superReady = false;
          this.superM = 0;
          this.superRun = { t: 0, taps: 0, pulse: 0 };
          TT.audio.sfx('super');
          return;
        }
      }
      // a legközelebbi, még élő jel a koppintás alatt (lánc: csak a soron következő)
      const nextNum = Math.min(...this.notes.filter((n) => n.chain).map((n) => n.num), 99);
      let best = null, bd = 1e9;
      for (const n of this.notes) {
        if (n.done || n.held) continue;
        const r = n.kind === 'hold' ? 48 : 40;
        const dd = Math.hypot(x - n.x, y - n.y);
        if (dd < r + 14 && Math.abs(n.t - n.due) < bd) {
          bd = Math.abs(n.t - n.due);
          best = n;
        }
      }
      if (!best) return;
      const n = best;
      if (n.kind === 'bomb') {
        n.done = true;
        this.pop(n.x, n.y - 30, 'BUMM!', '#e84545', 20);
        TT.fx.burst(n.x, n.y, 16, { colors: ['#e84545', '#ffb000'], shape: 'square', speed: 260, size: 7, life: 0.5, layer: 1 });
        this.hurtMe(14);
        return;
      }
      if (n.chain && n.num !== nextNum) {
        n.done = true;
        this.pop(n.x, n.y - 30, 'ROSSZ SORREND', '#ff8a80', 15);
        this.combo = 0;
        return;
      }
      const j = this.judge(n);
      if (j === 'early' || j === 'late') {
        n.done = true;
        this.miss(n);
        return;
      }
      const perfect = j === 'perfect';
      if (n.kind === 'hold') {
        n.held = { id, k: 0, perfect };
        TT.audio.sfx('windup');
        return;
      }
      n.done = true;
      this.good(perfect);
      if (n.kind === 'atk') this.hitBoss(this.myDmg(perfect ? 4.2 : 2.8), n.x, n.y, perfect);
      else {
        // védekezés: pontosan = visszavágás is
        this.pop(n.x, n.y - 30, perfect ? 'VISSZAVÁG!' : 'VÉDVE', perfect ? '#7bff6b' : '#ffd23f', 17);
        TT.audio.sfx(perfect ? 'perfect' : 'block');
        if (perfect) this.hitBoss(this.myDmg(1.6), n.x, n.y, true);
      }
    },

    miss(n) {
      this.pop(n.x, n.y - 30, 'HIBA', '#ff8a80', 16);
      if (n.kind === 'def') this.hurtMe(12);
      else if (n.kind === 'hold') this.hurtMe(8);
      else this.combo = 0;
    },

    superBtn() {
      return { x: TT.W / 2, y: 290, r: 70 };
    },

    update(dt) {
      this.t += dt;
      this.shake = Math.max(0, this.shake - dt);
      this.flash = Math.max(0, this.flash - dt);
      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter((f) => f.t < 0.8);
      const I = TT.input;
      if (TT.ui.overlayActive()) return;
      if (I.hit('back')) {
        TT.ui.confirm('Kilépsz a Tükörvilágból? Az eddigi haladás elvész.', (ok) => ok && this.leave(), 'Kilépek', 'Maradok');
        return;
      }
      if (this.state !== 'play') return;
      const st = STAGES[this.stage];
      // szuper püfölés
      if (this.superRun) {
        const sr = this.superRun;
        sr.t += dt;
        sr.pulse = Math.max(0, sr.pulse - dt * 4);
        for (const tp of I.taps) this.tapAt(tp.x, tp.y, tp.id);
        if (I.hit('ok')) {
          sr.taps++;
          sr.pulse = 1;
          TT.audio.sfx('hit');
        }
        if (sr.t >= SUPER_T) {
          this.superRun = null;
          // legfeljebb 30 koppintás számít (ennyit egy ember 2,6 mp alatt reálisan bír)
          const dmg = this.myDmg(1.2) * Math.min(30, sr.taps);
          TT.shake && TT.shake(12, 0.4);
          this.pop(TT.W / 2, 200, `SZUPER ×${sr.taps}!`, '#ffd23f', 28);
          this.hitBoss(dmg, 700, 260, true);
        }
        return;
      }
      // jelek
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawn();
        this.spawnT = st.every * U.rand(0.75, 1.25);
      }
      for (const n of this.notes) {
        if (n.done) continue;
        n.t += dt;
        if (n.flipAt && !n.flipped && n.t >= n.flipAt) {
          n.flipped = true;
          n.x = AREA.x0 + AREA.x1 - n.x;
          n.y = AREA.y0 + AREA.y1 - n.y;
          TT.audio.sfx('teleport');
        }
        if (n.held) {
          const ptr = I.pointers.get(n.held.id);
          const keyHeld = n.held.id === 'key' && I.act('ok');
          if (ptr || keyHeld) {
            n.held.k += dt / HOLD_T;
            if (n.held.k >= 1) {
              n.done = true;
              this.good(n.held.perfect);
              this.hitBoss(this.myDmg(n.held.perfect ? 11 : 8), n.x, n.y, n.held.perfect);
            }
          } else {
            n.done = true;
            this.good(false);
            this.hitBoss(this.myDmg(2.2), n.x, n.y, false);
          }
          continue;
        }
        if (n.t - n.due > GOOD) {
          n.done = true;
          if (n.kind === 'bomb') this.score += 50;
          else this.miss(n);
        }
      }
      this.notes = this.notes.filter((n) => !n.done);
      for (const tp of I.taps) this.tapAt(tp.x, tp.y, tp.id);
      // billentyűzet: Szóköz/Enter a legkorábban esedékes jelre (a bombákat kihagyja)
      if (I.hit('ok')) {
        const live = this.notes.filter((n) => !n.done && !n.held && n.kind !== 'bomb').sort((a, b) => (a.due - a.t) - (b.due - b.t));
        if (live.length) this.tapAt(live[0].x, live[0].y, 'key');
      }
    },

    // ---------- rajz ----------
    drawBg(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, TT.H);
      g.addColorStop(0, '#120a2c');
      g.addColorStop(1, '#2a1460');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, TT.W, TT.H);
      // lebegő kövek és tükörszilánkok
      for (let i = 0; i < 14; i++) {
        const x = (i * 137 + this.t * (8 + (i % 3) * 6)) % (TT.W + 80) - 40;
        const y = 60 + ((i * 89) % 420) + Math.sin(this.t + i) * 8;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.t * 0.2 + i);
        ctx.beginPath();
        ctx.moveTo(0, -10 - (i % 4) * 3);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 10 + (i % 4) * 3);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fillStyle = i % 2 ? 'rgba(200,208,218,0.25)' : 'rgba(142,92,255,0.25)';
        ctx.fill();
        ctx.restore();
      }
      if (STAGES[this.stage] && STAGES[this.stage].dark && this.state === 'play') {
        // Trigon: sötétség, csak a jelek körül világos
        ctx.fillStyle = 'rgba(5,0,15,0.35)';
        ctx.fillRect(0, 0, TT.W, TT.H);
      }
    },

    drawNote(ctx, n) {
      const st = STAGES[this.stage];
      const col = KIND_COL[n.kind];
      const k = U.clamp(n.t / n.due, 0, 1.2);
      let alpha = 1;
      // Trigon trükkje: a jel csak a közeledés második felében látszik
      if (st.dark) alpha = U.clamp((k - 0.45) / 0.25, 0, 1);
      if (n.t > n.due) alpha *= U.clamp(1 - (n.t - n.due) / GOOD, 0, 1);
      const r = n.kind === 'hold' ? 44 : 34;
      ctx.save();
      ctx.globalAlpha = alpha;
      // szűkülő kör
      if (!n.held) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + (1 - Math.min(1, k)) * 70, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = col;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = U.rgba(col, 0.85);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(n.x, n.y, r - 6, 0, Math.PI * 2);
      ctx.stroke();
      const label = n.chain ? String(n.num) : { atk: 'ÜSS', def: 'VÉDD', bomb: 'NE!', hold: 'TARTSD' }[n.kind];
      D.text(ctx, label, n.x, n.y + 1, { size: n.chain ? 30 : n.kind === 'hold' ? 15 : 16, align: 'center', color: '#ffffff' });
      if (n.held) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * n.held.k);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
      ctx.restore();
    },

    draw(ctx) {
      ctx.save();
      if (this.shake > 0) ctx.translate(U.rand(-6, 6) * this.shake * 4, U.rand(-6, 6) * this.shake * 4);
      this.drawBg(ctx);
      const me = this.me();
      // figurák: te balra, a tükörkép jobbra (tükrözve)
      if (me) TT.art.drawFigure(ctx, me.fig, 90, 500, 1.15, { pedestal: false, facing: 1, t: this.t, live3d: true, paint: TT.paintOf(me.id) });
      if (this.boss) {
        TT.art.drawFigure(ctx, this.boss.fig, 880, 500, this.boss.who === 'trigon' ? 1.35 : 1.15, { pedestal: false, facing: -1, t: this.t, live3d: true });
      }
      for (const n of this.notes) this.drawNote(ctx, n);
      // szuper gomb
      if (this.superReady || this.superRun) {
        const b = this.superBtn();
        const pr = this.superRun ? this.superRun.pulse : 0;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * (1 + pr * 0.12 + (this.superRun ? 0 : Math.sin(this.t * 8) * 0.04)), 0, Math.PI * 2);
        ctx.fillStyle = '#ffd23f';
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = INK;
        ctx.stroke();
        D.text(ctx, this.superRun ? String(this.superRun.taps) : 'SZUPER', b.x, b.y - 6, { size: this.superRun ? 40 : 26, align: 'center', color: INK, stroke: false });
        D.text(ctx, this.superRun ? `PÜFÖLD! ${Math.max(0, SUPER_T - this.superRun.t).toFixed(1)} mp` : 'koppints!', b.x, b.y + 30, { size: 14, align: 'center', color: INK, stroke: false });
      }
      // hatások
      for (const f of this.fx) {
        ctx.save();
        ctx.globalAlpha = 1 - f.t / 0.8;
        D.text(ctx, f.text, f.x, f.y - f.t * 40, { size: f.size, align: 'center', color: f.color });
        ctx.restore();
      }
      if (this.flash > 0) {
        ctx.fillStyle = `rgba(232,69,69,${this.flash})`;
        ctx.fillRect(0, 0, TT.W, TT.H);
      }
      ctx.restore();
      this.drawHud(ctx);
    },

    drawHud(ctx) {
      // csapat HP
      D.panel(ctx, 12, 10, 300, 74, { fill: '#1f3a7a', r: 14, lw: 3 });
      this.team.forEach((m, i) => {
        const y = 22 + i * 20;
        D.text(ctx, m.fig.short, 24, y + 6, { size: 13, color: i === this.cur ? '#ffd23f' : m.hp > 0 ? '#ffffff' : '#8a7ab8', maxWidth: 90 });
        D.bar(ctx, 120, y, 180, 12, m.hp / 100, { color: m.hp > 50 ? '#4cd964' : m.hp > 25 ? '#ffcc00' : '#ff3b30' });
      });
      if (this.boss) {
        D.panel(ctx, TT.W - 312, 10, 300, 74, { fill: '#5a2140', r: 14, lw: 3 });
        D.text(ctx, STAGES[this.stage].name, TT.W - 300, 32, { size: 16, maxWidth: 220 });
        D.text(ctx, `${this.stage + 1}/3`, TT.W - 24, 32, { size: 16, align: 'right', color: '#ffd23f' });
        D.bar(ctx, TT.W - 300, 48, 276, 18, this.boss.hp / this.boss.max, { color: '#a35cff' });
      }
      // kombó, pont, szupermérő
      D.panel(ctx, TT.W / 2 - 120, 10, 240, 74, { fill: 'rgba(27,17,64,0.9)', r: 14, lw: 3 });
      D.text(ctx, `Kombó: ${this.combo}`, TT.W / 2, 30, { size: 20, align: 'center', color: this.combo >= 10 ? '#ffd23f' : '#ffffff' });
      D.text(ctx, `Pont: ${this.score}`, TT.W / 2, 52, { size: 14, align: 'center', color: '#c8b8f0' });
      D.bar(ctx, TT.W / 2 - 100, 64, 200, 10, this.superM / 100, { color: this.superM >= 100 ? '#ffd23f' : '#c06bff' });
      if (this.me() && this.boss) {
        const m1 = TT.matchMult(this.me().fig, this.boss.fig);
        if (Math.abs(m1 - 1) > 0.001) D.text(ctx, (m1 > 1 ? 'Előny ' : 'Hátrány ') + (m1 > 1 ? '+' : '−') + Math.round(Math.abs(m1 - 1) * 100) + '%', 162, 100, { size: 14, align: 'center', color: m1 > 1 ? '#7bff6b' : '#ff8a80' });
      }
    },
  };

  TT.register('mirror', scene);
})(window.TT);
