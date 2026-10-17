'use strict';
// Pizzafogó minijáték: Beast Boy elkapja a pizzákat, kerüli Mr. Mint ragasztószalagjait.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const DUR = 30;
  const DAILY_PAID = 3;

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      this.state = 'count';
      this.x = TT.W / 2;
      this.vx = 0;
      this.items = [];
      this.score = 0;
      this.spawnT = 0.6;
      this.stun = 0;
      this.combo = 0;
      this.menu = new TT.ui.Menu();
      TT.audio.music('pizza');
    },

    spawn() {
      const k = this.t / DUR;
      const r = Math.random();
      const kind = r < 0.06 ? 'gold' : r < 0.3 + k * 0.1 ? 'tape' : 'pizza';
      this.items.push({
        kind, x: U.rand(60, TT.W - 60), y: -30, vy: U.rand(170, 240) + k * 160, rot: Math.random() * 6, vr: U.rand(-4, 4),
      });
    },

    finish() {
      const s = TT.save;
      s.pizzaDay = s.pizzaDay && s.pizzaDay.date === today() ? s.pizzaDay : { date: today(), plays: 0 };
      s.pizzaDay.plays++;
      s.stats.pizzaGames = (s.stats.pizzaGames || 0) + 1;
      const paid = s.pizzaDay.plays <= DAILY_PAID;
      const coins = paid ? Math.min(180, this.score * 4) : Math.min(40, this.score);
      s.coins += coins;
      const best = s.flags.pizzaBest || 0;
      this.newBest = this.score > best;
      if (this.newBest) s.flags.pizzaBest = this.score;
      TT.store.write();
      TT.checkAch();
      this.result = { coins, paid, left: Math.max(0, DAILY_PAID - s.pizzaDay.plays) };
      this.state = 'end';
      this.t = 0;
      TT.audio.sfx(this.score > 15 ? 'levelup' : 'coin');
      this.menu.set([
        { id: 'again', x: TT.W / 2 - 230, y: 400, w: 220, h: 56, label: 'Újra', color: '#ff6b35', onClick: () => TT.go('pizzagame', this.p) },
        { id: 'back', x: TT.W / 2 + 10, y: 400, w: 220, h: 56, label: 'Vissza', color: '#6c5ce7', onClick: () => TT.go('world', { pos: this.p.back, dir: 'down' }) },
      ]);
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      if (this.state === 'count') {
        if (this.t > 2.2) {
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
      // mozgás
      let dir = 0;
      if (I.act('left')) dir -= 1;
      if (I.act('right')) dir += 1;
      if (I.stick.x) dir = I.stick.x;
      for (const ptr of I.pointers.values()) {
        const d = ptr.x - this.x;
        dir = Math.abs(d) < 12 ? 0 : Math.sign(d);
      }
      if (this.stun > 0) {
        this.stun -= dt;
        dir = 0;
      }
      this.vx = U.approach(this.vx, dir * 460, dt * 3200);
      this.x = U.clamp(this.x + this.vx * dt, 50, TT.W - 50);
      // tárgyak
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawn();
        this.spawnT = U.lerp(0.5, 0.24, this.t / DUR) * U.rand(0.7, 1.2);
      }
      const cy = 410;
      for (const it of this.items) {
        it.y += it.vy * dt;
        it.rot += it.vr * dt;
        if (!it.done && Math.abs(it.x - this.x) < 50 && Math.abs(it.y - cy) < 34) {
          it.done = true;
          if (it.kind === 'tape') {
            this.score = Math.max(0, this.score - 3);
            this.stun = 0.7;
            this.combo = 0;
            TT.audio.sfx('stun');
            TT.shake(6, 0.25);
            TT.fx.text(it.x, it.y - 30, '-3', { color: '#ff6b6b', tsize: 28 });
          } else {
            const pts = it.kind === 'gold' ? 5 : 1;
            this.combo++;
            const bonus = this.combo > 0 && this.combo % 10 === 0 ? 3 : 0;
            this.score += pts + bonus;
            TT.audio.sfx(it.kind === 'gold' ? 'found' : 'coin');
            TT.fx.text(it.x, it.y - 30, '+' + (pts + bonus) + (bonus ? ' KOMBÓ!' : ''), { color: it.kind === 'gold' ? '#ffd23f' : '#ffffff', tsize: bonus ? 30 : 24 });
            TT.fx.burst(it.x, it.y, 8, { colors: ['#ffd23f', '#ff6b35', '#ffffff'], shape: 'star', speed: 200, size: 5, life: 0.4 });
          }
        }
        if (!it.done && it.y > TT.H + 20) {
          it.done = true;
          if (it.kind !== 'tape') this.combo = 0;
        }
      }
      this.items = this.items.filter((it) => !it.done);
      if (this.t >= DUR) this.finish();
    },

    drawItem(ctx, it) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      if (it.kind === 'tape') {
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#c8a165';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1d1433';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#7fe0b5';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,161,101,0.9)';
        ctx.fillRect(14, -6, 24, 12);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(20, 18);
        ctx.quadraticCurveTo(0, 26, -20, 18);
        ctx.closePath();
        ctx.fillStyle = it.kind === 'gold' ? '#ffd23f' : '#ffcf6b';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1d1433';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-21, 16);
        ctx.quadraticCurveTo(0, 30, 21, 16);
        ctx.lineWidth = 7;
        ctx.strokeStyle = it.kind === 'gold' ? '#e09b00' : '#c8803a';
        ctx.stroke();
        if (it.kind !== 'gold') {
          ctx.fillStyle = '#d62828';
          for (const [px, py] of [[-5, 2], [6, 8], [0, -8]]) {
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          D.star(ctx, 0, 4, 8, 3.5, 5);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }
      ctx.restore();
    },

    draw(ctx) {
      // pizzéria háttér
      ctx.fillStyle = '#fff4e0';
      ctx.fillRect(0, 0, TT.W, TT.H);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 24; i++) {
        if ((i + j) % 2) continue;
        ctx.fillStyle = '#e84545';
        ctx.fillRect(i * 40, 440 + j * 25, 40, 25);
      }
      ctx.fillStyle = '#2e8b3a';
      ctx.fillRect(0, 0, TT.W, 22);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff' : '#e84545';
        ctx.beginPath();
        ctx.moveTo(i * 80, 22);
        ctx.lineTo(i * 80 + 80, 22);
        ctx.lineTo(i * 80 + 80, 44);
        ctx.arc(i * 80 + 40, 44, 40, 0, Math.PI);
        ctx.fill();
      }
      // Beast Boy
      const pose = this.stun > 0 ? 'stun' : this.state === 'end' ? 'cheer' : Math.abs(this.vx) > 40 ? 'walk' : 'cast';
      TT.art.drawFigure(ctx, TT.FIG.beastboy, this.x, 470, 1.15, { pedestal: false, pose, walk: this.t * 14, facing: this.vx < 0 ? -1 : 1, noCustom: true });
      for (const it of this.items) this.drawItem(ctx, it);
      TT.fx.draw(ctx, 0);
      // HUD
      D.panel(ctx, 16, 56, 190, 50, { fill: '#2b1e5c', r: 12, lw: 3 });
      D.text(ctx, 'Pizza: ' + this.score, 30, 82, { size: 26, color: '#ffd23f' });
      const left = this.state === 'play' ? Math.max(0, DUR - this.t) : this.state === 'count' ? DUR : 0;
      D.bar(ctx, 230, 70, 500, 22, left / DUR, { color: left < 8 ? '#ff4f4f' : '#4cd964' });
      D.text(ctx, Math.ceil(left) + ' mp', 480, 81.5, { size: 15, align: 'center', lw: 3 });
      D.text(ctx, 'Rekord: ' + (TT.save.flags.pizzaBest || 0), TT.W - 20, 82, { size: 18, align: 'right', color: '#2b1e5c', stroke: false });
      if (this.combo >= 3) D.text(ctx, 'Kombó ×' + this.combo, TT.W / 2, 130, { size: 22, align: 'center', color: '#ff6b35' });

      if (this.state === 'count') {
        ctx.fillStyle = 'rgba(10,5,25,0.45)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.text(ctx, 'PIZZAFOGÓ!', TT.W / 2, 170, { size: 64, align: 'center', color: '#ffd23f' });
        D.text(ctx, 'Kapd el a pizzákat, kerüld Mr. Mint ragasztószalagjait!', TT.W / 2, 240, { size: 22, align: 'center' });
        D.text(ctx, TT.input.isTouch() ? 'Érintsd meg a képernyőt arra, amerre menni akarsz.' : 'Mozgás: ← → vagy A / D (egérrel is mehet)', TT.W / 2, 276, { size: 18, align: 'center', color: '#e8e2ff' });
        const n = 3 - Math.floor(this.t / 0.75);
        D.text(ctx, n > 0 ? String(n) : 'RAJTA!', TT.W / 2, 350, { size: 70, align: 'center', color: '#ffffff' });
      }
      if (this.state === 'end') {
        ctx.fillStyle = 'rgba(10,5,25,0.6)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.panel(ctx, TT.W / 2 - 260, 110, 520, 360, { fill: '#2b1e5c', r: 20, lw: 4 });
        D.text(ctx, 'VÉGE!', TT.W / 2, 160, { size: 48, align: 'center', color: '#ffd23f' });
        D.text(ctx, `${this.score} pizza${this.newBest ? '  — ÚJ REKORD!' : ''}`, TT.W / 2, 220, { size: 30, align: 'center', color: this.newBest ? '#7bff6b' : '#ffffff' });
        D.coin(ctx, TT.W / 2 - 70, 278, 16);
        D.text(ctx, '+' + this.result.coins + ' érme', TT.W / 2 - 46, 279, { size: 28, color: '#ffd23f' });
        D.text(ctx, this.result.paid ? `Ma még ${this.result.left} teljes jutalmú játék van hátra.` : 'Mára elfogytak a teljes jutalmak (holnap újra!).', TT.W / 2, 334, { size: 17, align: 'center', color: '#c8b8f0', stroke: false });
        if (this.t > 0.6) this.menu.draw(ctx);
      }
      TT.fx.draw(ctx, 1);
    },
  };

  TT.register('pizzagame', scene);
})(window.TT);
