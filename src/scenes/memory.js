'use strict';
// Figura-memória: párosítós kártyajáték a Képregényboltban.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const COLS = 5, ROWS = 4, PAIRS = (COLS * ROWS) / 2;
  const CW = 92, CH = 100, GAP = 12;
  const GX = (TT.W - (COLS * CW + (COLS - 1) * GAP)) / 2, GY = 96;
  const DUR = 90;
  const DAILY_PAID = 3;
  const BEST_GOAL = 14;

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  // képregényes pöttyös háttér (egyszer rajzolva)
  let bg = null;
  function background() {
    if (bg) return bg;
    bg = TT.makeCanvas(TT.W, TT.H);
    const g = bg.getContext('2d');
    g.fillStyle = '#3f6fd8';
    g.fillRect(0, 0, TT.W, TT.H);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    for (let y = 0; y < TT.H; y += 18) for (let x = (y / 18) % 2 ? 9 : 0; x < TT.W; x += 18) {
      g.beginPath();
      g.arc(x, y, 4, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(255,210,63,0.9)';
    g.beginPath();
    g.moveTo(0, TT.H);
    g.lineTo(0, TT.H - 70);
    g.lineTo(TT.W, TT.H - 20);
    g.lineTo(TT.W, TT.H);
    g.closePath();
    g.fill();
    return bg;
  }

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      this.state = 'count';
      this.moves = 0;
      this.pairs = 0;
      this.open = [];
      this.wait = 0;
      this.cheer = 0;
      this.menu = new TT.ui.Menu();
      const s = TT.save;
      // inkább a saját figurák, ha kevés van, véletlen továbbiakkal kiegészítve
      const owned = U.shuffle(Object.keys(s.owned).filter((id) => TT.FIG[id]));
      const rest = U.shuffle(TT.FIG_LIST.map((f) => f.id).filter((id) => !s.owned[id]));
      const ids = owned.concat(rest).slice(0, PAIRS);
      const deck = U.shuffle(ids.concat(ids));
      this.cards = deck.map((id, i) => ({
        id, x: GX + (i % COLS) * (CW + GAP), y: GY + Math.floor(i / COLS) * (CH + GAP), up: false, done: false, f: 0, pop: 0,
      }));
      this.menu.set(this.cards.map((c, i) => ({
        id: 'c' + i, x: c.x, y: c.y, w: CW, h: CH, silent: true,
        draw: (ctx, b, focus) => this.drawCard(ctx, c, focus),
        onClick: () => this.pick(c),
      })));
      TT.audio.music('comics');
    },

    closeOpen() {
      for (const c of this.open) c.up = false;
      this.open = [];
      this.wait = 0;
    },

    pick(c) {
      if (this.state !== 'play' || c.done || c.up) return;
      // két rossz lap még nyitva: egy új koppintás azonnal visszafordítja őket
      if (this.open.length >= 2) this.closeOpen();
      c.up = true;
      this.open.push(c);
      TT.audio.sfx('whoosh');
      if (this.open.length < 2) return;
      this.moves++;
      const [a, b] = this.open;
      if (a.id !== b.id) {
        this.wait = 0.9;
        return;
      }
      a.done = b.done = true;
      a.pop = b.pop = 1;
      this.open = [];
      this.pairs++;
      this.cheer = 1;
      const f = TT.FIG[a.id];
      TT.audio.sfx('found');
      TT.fx.text(b.x + CW / 2, b.y + 4, f.short || f.name, { color: '#ffd23f', tsize: 20 });
      for (const k of [a, b]) {
        TT.fx.burst(k.x + CW / 2, k.y + CH / 2, 10, { colors: ['#ffd23f', '#ffffff', '#ff6b35'], shape: 'star', speed: 180, size: 5, life: 0.45 });
      }
      if (this.pairs >= PAIRS) this.finish(true);
    },

    finish(cleared) {
      if (this.state === 'end') return;
      const s = TT.save;
      s.memDay = s.memDay && s.memDay.date === today() ? s.memDay : { date: today(), plays: 0 };
      s.memDay.plays++;
      s.stats.memGames = (s.stats.memGames || 0) + 1;
      const paid = s.memDay.plays <= DAILY_PAID;
      // tökéletes játék (10 lépés) 200 érme, minden fölösleges lépés 4-gyel kevesebb
      const full = cleared ? 100 + Math.max(0, 25 - (this.moves - PAIRS)) * 4 : this.pairs * 8;
      const coins = paid ? full : Math.min(40, Math.round(full / 5));
      s.coins += coins;
      const best = s.flags.memBest || 0;
      this.newBest = cleared && (!best || this.moves < best);
      if (this.newBest) s.flags.memBest = this.moves;
      TT.store.write();
      TT.checkAch();
      this.cleared = cleared;
      this.leftAtEnd = this.state === 'play' ? Math.max(0, DUR - this.t) : DUR;
      this.result = { coins, paid, left: Math.max(0, DAILY_PAID - s.memDay.plays) };
      this.state = 'end';
      this.t = 0;
      this.closeOpen();
      TT.audio.sfx(cleared ? 'levelup' : 'coin');
      this.menu = new TT.ui.Menu();
      this.menu.set([
        { id: 'again', x: TT.W / 2 - 230, y: 400, w: 220, h: 56, label: 'Újra', color: '#ff6b35', onClick: () => TT.go('memory', this.p) },
        { id: 'back', x: TT.W / 2 + 10, y: 400, w: 220, h: 56, label: 'Vissza', color: '#6c5ce7', onClick: () => TT.go('world', { pos: this.p.back, dir: 'down' }) },
      ]);
    },

    update(dt) {
      this.t += dt;
      this.cheer = Math.max(0, this.cheer - dt);
      const I = TT.input;
      const peek = this.state === 'peek';
      for (const c of this.cards) {
        c.f = U.approach(c.f, c.up || c.done || peek ? 1 : 0, dt * 6);
        c.pop = Math.max(0, c.pop - dt * 2.5);
      }
      if (this.state === 'count') {
        if (this.t > 2.2) {
          this.state = 'peek';
          this.t = 0;
          TT.audio.sfx('go');
        }
        return;
      }
      if (this.state === 'peek') {
        if (this.t > 1.8) {
          this.state = 'play';
          this.t = 0;
        }
        return;
      }
      if (this.state === 'end') {
        if (this.t > 0.6) this.menu.update();
        return;
      }
      if (I.hit('back')) {
        this.finish(false);
        return;
      }
      if (this.wait > 0) {
        this.wait -= dt;
        if (this.wait <= 0) this.closeOpen();
      }
      this.menu.update();
      if (this.state === 'play' && this.t >= DUR) this.finish(false);
    },

    drawCard(ctx, c, focus) {
      const sx = Math.max(0.03, Math.abs(Math.cos(c.f * Math.PI)));
      const face = c.f > 0.5;
      const sc = 1 + c.pop * 0.12;
      ctx.save();
      ctx.translate(c.x + CW / 2, c.y + CH / 2);
      ctx.scale(sx * sc, sc);
      if (face) {
        D.panel(ctx, -CW / 2, -CH / 2, CW, CH, { fill: c.done ? '#d8ffd0' : '#fff8e0', r: 10, lw: 3, shadow: false });
        ctx.drawImage(TT.art.figureCanvas(c.id, 96, { pedestal: false }), -48, -52, 96, 96);
        const col = TT.TYPES[TT.FIG[c.id].type].color;
        ctx.fillStyle = col;
        ctx.fillRect(-CW / 2 + 6, CH / 2 - 12, CW - 12, 5);
      } else {
        D.panel(ctx, -CW / 2, -CH / 2, CW, CH, { fill: '#e84545', r: 10, lw: 3, shadow: false });
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        D.rr(ctx, -CW / 2 + 7, -CH / 2 + 7, CW - 14, CH - 14, 6);
        ctx.stroke();
        D.star(ctx, 0, 0, 30, 15, 10);
        ctx.fillStyle = '#ffd23f';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1d1433';
        ctx.stroke();
        D.text(ctx, 'T', 0, 2, { size: 26, align: 'center', color: '#ffffff' });
      }
      ctx.restore();
      if (focus && !c.done) {
        ctx.save();
        D.rr(ctx, c.x - 4, c.y - 4, CW + 8, CH + 8, 13);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffd23f';
        ctx.stroke();
        ctx.restore();
      }
    },

    draw(ctx) {
      ctx.drawImage(background(), 0, 0);
      // nézők a két oldalon
      const happy = this.cheer > 0 || (this.state === 'end' && this.cleared);
      TT.art.drawFigure(ctx, TT.FIG.robin, 110, 500, 1.05, { pedestal: false, pose: happy ? 'cheer' : 'idle', t: this.t, noCustom: true });
      TT.art.drawFigure(ctx, TT.FIG.raven, TT.W - 110, 500, 1.05, { pedestal: false, pose: happy ? 'cheer' : 'cast', t: this.t, facing: -1, noCustom: true });
      if (this.state === 'play') this.menu.draw(ctx);
      else for (const c of this.cards) this.drawCard(ctx, c, false);
      TT.fx.draw(ctx, 0);
      // HUD
      D.panel(ctx, 16, 14, 196, 66, { fill: '#2b1e5c', r: 12, lw: 3 });
      D.text(ctx, 'Lépés: ' + this.moves, 30, 36, { size: 20, color: '#ffffff' });
      D.text(ctx, `Pár: ${this.pairs} / ${PAIRS}`, 30, 62, { size: 20, color: '#ffd23f' });
      const left = this.state === 'play' ? Math.max(0, DUR - this.t) : this.state === 'end' ? this.leftAtEnd : DUR;
      D.bar(ctx, 236, 34, 488, 22, left / DUR, { color: left < 15 ? '#ff4f4f' : '#4cd964' });
      D.text(ctx, Math.ceil(left) + ' mp', TT.W / 2, 45.5, { size: 15, align: 'center', lw: 3 });
      D.panel(ctx, TT.W - 212, 14, 196, 66, { fill: '#2b1e5c', r: 12, lw: 3 });
      D.text(ctx, 'Rekord', TT.W - 198, 36, { size: 16, color: '#c8b8f0', lw: 3 });
      D.text(ctx, TT.save.flags.memBest ? TT.save.flags.memBest + ' lépés' : '—', TT.W - 198, 62, { size: 20, color: '#7bff6b' });

      if (this.state === 'count') {
        ctx.fillStyle = 'rgba(10,5,25,0.55)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.text(ctx, 'FIGURA-MEMÓRIA!', TT.W / 2, 170, { size: 60, align: 'center', color: '#ffd23f' });
        D.text(ctx, 'Találd meg a figurapárokat! Minél kevesebb lépés, annál több érme.', TT.W / 2, 238, { size: 21, align: 'center' });
        D.text(ctx, TT.input.isTouch() ? 'Koppints a kártyákra. Jól figyelj: az elején egy pillanatra mindet látod!' : 'Kattints a kártyákra, vagy nyilak + Enter. Az elején egy pillanatra mindet látod!', TT.W / 2, 274, { size: 17, align: 'center', color: '#e8e2ff' });
        const n = 3 - Math.floor(this.t / 0.75);
        D.text(ctx, n > 0 ? String(n) : 'FIGYELJ!', TT.W / 2, 350, { size: 66, align: 'center', color: '#ffffff' });
      }
      if (this.state === 'end') {
        ctx.fillStyle = 'rgba(10,5,25,0.6)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.panel(ctx, TT.W / 2 - 260, 110, 520, 360, { fill: '#2b1e5c', r: 20, lw: 4 });
        D.text(ctx, this.cleared ? 'KÉSZ!' : 'VÉGE!', TT.W / 2, 160, { size: 48, align: 'center', color: '#ffd23f' });
        const line = this.cleared ? `${this.moves} lépésből${this.newBest ? '  — ÚJ REKORD!' : ''}` : `${this.pairs} pár ${PAIRS}-ből`;
        D.text(ctx, line, TT.W / 2, 220, { size: 30, align: 'center', color: this.newBest ? '#7bff6b' : '#ffffff' });
        D.coin(ctx, TT.W / 2 - 70, 278, 16);
        D.text(ctx, '+' + this.result.coins + ' érme', TT.W / 2 - 46, 279, { size: 28, color: '#ffd23f' });
        const tip = this.cleared && this.moves > BEST_GOAL ? `Tipp: ${BEST_GOAL} lépésen belül teljesítményt kapsz!` : '';
        D.text(ctx, this.result.paid ? `Ma még ${this.result.left} teljes jutalmú játék van hátra.` : 'Mára elfogytak a teljes jutalmak (holnap újra!).', TT.W / 2, 330, { size: 17, align: 'center', color: '#c8b8f0', stroke: false });
        if (tip) D.text(ctx, tip, TT.W / 2, 356, { size: 15, align: 'center', color: '#ffe066', stroke: false });
        if (this.t > 0.6) this.menu.draw(ctx);
      }
      TT.fx.draw(ctx, 1);
    },
  };

  TT.MEMORY_BEST_GOAL = BEST_GOAL;
  TT.register('memory', scene);
})(window.TT);
