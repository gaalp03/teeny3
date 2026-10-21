'use strict';
// Blokk-edzés: időzítéses minijáték a Toronyban. Tökéletes blokkokért tapasztalat jár.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const ROUNDS = 15;
  const DAILY_FULL = 3;

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      this.state = 'intro';
      // ugyanaz a tökéletes ablak, mint a harcban; a „jó” blokk még negyed másodperccel korábban is jár
      this.pw = TT.perfectWindow();
      this.goodW = this.pw + 0.25;
      this.n = 0;
      this.perfect = 0;
      this.good = 0;
      this.atk = null;
      this.wait = 1.4;
      this.fig = TT.FIG[TT.save.team[0]];
      this.bot = TT.FIG.mintguard;
      this.menu = new TT.ui.Menu();
      this.flash = 0;
      this.pose = 'idle';
      this.poseT = 0;
      TT.audio.music('training');
    },

    newAttack() {
      const wind = U.rand(0.6, 1.15) - this.n * 0.012;
      this.atk = { t: 0, impact: wind, pressed: null, done: false };
      TT.audio.sfx('windup');
    },

    press() {
      const a = this.atk;
      if (!a || a.done || a.pressed != null) return;
      a.pressed = a.t;
      this.pose = 'block';
      this.poseT = 0.35;
      if (a.impact - a.t > this.goodW) this.resolve('early');
    },

    resolve(kind) {
      const a = this.atk;
      if (!a || a.done) return;
      a.done = true;
      const px = 300, py = 330;
      if (!kind) {
        if (a.pressed == null) kind = 'miss';
        else {
          const before = a.impact - a.pressed;
          kind = before <= this.pw ? 'perfect' : before <= this.goodW ? 'good' : 'early';
        }
      }
      if (kind === 'perfect') {
        this.perfect++;
        TT.audio.sfx('perfect');
        TT.fx.text(px, py - 60, 'TÖKÉLETES!', { color: '#7bff6b', tsize: 32 });
        TT.fx.ring(px, py, { color: '#7bff6b', size: 20, size2: 120, life: 0.45, lw: 6 });
        TT.fx.burst(px, py, 12, { colors: ['#7bff6b', '#ffffff'], shape: 'star', speed: 300, size: 7, life: 0.5 });
      } else if (kind === 'good') {
        this.good++;
        TT.audio.sfx('block');
        TT.fx.text(px, py - 60, 'Jó blokk', { color: '#9be7ff', tsize: 26 });
        TT.fx.text(px, py - 140, 'Kicsit korán — várd meg a zöldet', { color: '#ffd23f', tsize: 16, vy: -50 });
      } else {
        TT.audio.sfx('hit');
        TT.fx.text(px, py - 60, kind === 'early' ? 'Túl korai!' : 'Késő!', { color: '#ff8a80', tsize: 26 });
        TT.fx.text(px, py - 140, kind === 'early' ? 'Csak akkor nyomd, amikor zöld a kör' : 'Nyomd, amint zöldre vált a kör', { color: '#ffd23f', tsize: 16, vy: -50 });
        this.flash = 0.15;
        this.pose = 'hurt';
        this.poseT = 0.3;
        TT.shake(5, 0.2);
      }
      this.n++;
      this.wait = U.rand(0.5, 1.1);
      if (this.n >= ROUNDS) setTimeout(() => this.finish(), 600);
    },

    finish() {
      if (this.state === 'end') return;
      const s = TT.save;
      s.trainDay = s.trainDay && s.trainDay.date === today() ? s.trainDay : { date: today(), plays: 0 };
      s.trainDay.plays++;
      s.stats.trains = (s.stats.trains || 0) + 1;
      const full = s.trainDay.plays <= DAILY_FULL;
      const xp = Math.round((this.perfect * 14 + this.good * 5) * (full ? 1 : 0.34));
      let ups = 0;
      for (const id of s.team) ups += TT.addXp(id, xp);
      const coins = full ? this.perfect * 3 : 0;
      s.coins += coins;
      if (this.perfect >= ROUNDS) s.flags.trainPerfect = true;
      s.flags.trainBest = Math.max(s.flags.trainBest || 0, this.perfect);
      TT.store.write();
      TT.checkAch();
      const score = this.perfect * 3 + this.good;
      this.grade = score >= 42 ? 'S' : score >= 33 ? 'A' : score >= 22 ? 'B' : 'C';
      this.result = { xp, coins, ups, full, left: Math.max(0, DAILY_FULL - s.trainDay.plays) };
      this.state = 'end';
      this.t = 0;
      TT.audio.sfx(ups ? 'levelup' : 'coin');
      this.menu.set([
        { id: 'again', x: TT.W / 2 - 230, y: 420, w: 220, h: 56, label: 'Újra', color: '#ff6b35', onClick: () => TT.go('training', this.p) },
        { id: 'back', x: TT.W / 2 + 10, y: 420, w: 220, h: 56, label: 'Vissza', color: '#6c5ce7', onClick: () => TT.go('tower', { back: this.p.back }) },
      ]);
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      this.flash = Math.max(0, this.flash - dt);
      this.poseT -= dt;
      if (this.poseT <= 0) this.pose = 'idle';
      if (this.state === 'intro') {
        if (this.t > 0.5 && (I.hit('ok') || I.hit('block') || I.anyTap())) {
          this.state = 'play';
          this.t = 0;
          TT.audio.sfx('go');
        }
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
      if (I.hit('block') || I.hit('ok') || I.anyTap()) this.press();
      const a = this.atk;
      if (!a || a.done) {
        if (this.n < ROUNDS) {
          this.wait -= dt;
          if (this.wait <= 0) this.newAttack();
        }
      } else {
        a.t += dt;
        if (a.t >= a.impact) this.resolve();
      }
    },

    draw(ctx) {
      TT.backdrop.draw(ctx, 'tower', TT.time);
      const a = this.atk;
      const lunge = a && !a.done ? U.clamp((a.t - a.impact + 0.12) / 0.12, 0, 1) : 0;
      TT.art.drawFigure(ctx, this.bot, 660 - lunge * 230, 400, 1.4, { facing: -1, paint: 'silver', pose: a && !a.done ? (a.t > a.impact - 0.15 ? 'attack' : 'windup') : 'idle' });
      TT.art.drawFigure(ctx, this.fig, 300, 400, 1.55, { pose: this.pose, flash: this.flash > 0 ? 1 : 0, paint: TT.paintOf(this.fig.id) });
      if (this.pose === 'block') {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(348, 325, 62, -Math.PI / 2.4, Math.PI / 2.4);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#9be7ff';
        ctx.stroke();
        ctx.restore();
      }
      // célzó kör
      if (a && !a.done && this.state === 'play') {
        const tt = a.impact - a.t;
        const k = U.clamp(tt / a.impact, 0, 1);
        const inP = tt <= this.pw;
        ctx.save();
        ctx.lineWidth = inP ? 7 : 4;
        ctx.strokeStyle = inP ? '#7bff6b' : tt < this.goodW ? '#ffd23f' : '#ffffff';
        ctx.beginPath();
        ctx.arc(300, 328, 46 + k * 110, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#7bff6b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(300, 328, 46 + Math.min(1, this.pw / a.impact) * 110, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      TT.fx.draw(ctx, 0);
      // HUD
      D.panel(ctx, 16, 14, 330, 56, { fill: '#2b1e5c', r: 12, lw: 3 });
      D.text(ctx, `Blokk-edzés  ${Math.min(this.n + (a && !a.done ? 1 : 0), ROUNDS)}/${ROUNDS}`, 32, 42, { size: 22, color: '#ffd23f' });
      D.panel(ctx, TT.W - 300, 14, 284, 56, { fill: '#2b1e5c', r: 12, lw: 3 });
      D.text(ctx, `Tökéletes: ${this.perfect}   Jó: ${this.good}`, TT.W - 158, 42, { size: 20, align: 'center' });
      if (this.state === 'intro') {
        ctx.fillStyle = 'rgba(10,5,25,0.55)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.panel(ctx, TT.W / 2 - 300, 120, 600, 280, { fill: '#2b1e5c', r: 20, lw: 4 });
        D.text(ctx, 'BLOKK-EDZÉS', TT.W / 2, 165, { size: 40, align: 'center', color: '#ffd23f' });
        const lines = D.wrap(ctx, 'Az edzőrobot 15-ször támad. Nyomd meg a BLOKK-ot (Szóköz vagy koppintás), amikor a kör ZÖLD! Tökéletes blokkért sok tapasztalatot kap a csapatod.', 520, 19);
        lines.forEach((l, i) => D.text(ctx, l, TT.W / 2, 220 + i * 26, { size: 19, align: 'center', color: '#e8e2ff', stroke: false }));
        D.text(ctx, 'Koppints / Szóköz a kezdéshez', TT.W / 2, 360, { size: 20, align: 'center', color: '#7bff6b', alpha: 0.6 + Math.sin(TT.time * 4) * 0.3 });
      }
      if (this.state === 'end') {
        const r = this.result;
        ctx.fillStyle = 'rgba(10,5,25,0.6)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.panel(ctx, TT.W / 2 - 270, 90, 540, 400, { fill: '#2b1e5c', r: 20, lw: 4 });
        D.text(ctx, 'EDZÉS VÉGE', TT.W / 2, 135, { size: 40, align: 'center', color: '#ffd23f' });
        const gc = { S: '#ffd23f', A: '#7bff6b', B: '#3fa7ff', C: '#c8b8f0' }[this.grade];
        const sc = 1 + U.ease.outBack(U.clamp(this.t / 0.5, 0, 1)) * 0.2;
        ctx.save();
        ctx.translate(TT.W / 2, 220);
        ctx.scale(sc, sc);
        D.text(ctx, this.grade, 0, 0, { size: 90, align: 'center', color: gc, lw: 12 });
        ctx.restore();
        D.text(ctx, `${this.perfect} tökéletes · ${this.good} jó blokk`, TT.W / 2, 296, { size: 22, align: 'center' });
        D.text(ctx, `+${r.xp} XP a csapatnak` + (r.coins ? ` · +${r.coins} érme` : '') + (r.ups ? ' · SZINTLÉPÉS!' : ''), TT.W / 2, 334, { size: 20, align: 'center', color: r.ups ? '#7bff6b' : '#c8b8f0' });
        D.text(ctx, r.full ? `Ma még ${r.left} teljes jutalmú edzés van hátra.` : 'Mára elfogytak a teljes jutalmú edzések.', TT.W / 2, 370, { size: 16, align: 'center', color: '#a89cd8', stroke: false });
        if (this.t > 0.6) this.menu.draw(ctx);
      }
      TT.fx.draw(ctx, 1);
    },
  };

  TT.register('training', scene);
})(window.TT);
