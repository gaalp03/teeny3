'use strict';
// Teeny Játékbolt: vakdobozok vásárlása és kibontása.
(function (TT) {
  const U = TT.U;
  const D = TT.D;

  // Vakdoboz rajza
  function drawBox(ctx, x, y, s, color, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (o.rot) ctx.rotate(o.rot);
    const w = 70, h = 84, d = 16;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1d1433';
    // oldal
    ctx.beginPath();
    ctx.moveTo(w / 2, -h);
    ctx.lineTo(w / 2 + d, -h - d * 0.6);
    ctx.lineTo(w / 2 + d, -d * 0.6);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fillStyle = U.shade(color, -0.3);
    ctx.fill();
    ctx.stroke();
    // teteje (nyitáskor felpattan)
    ctx.save();
    if (o.lid) {
      ctx.translate(0, -h - o.lid * 60);
      ctx.rotate(-o.lid * 0.8);
      ctx.translate(0, h);
    }
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h);
    ctx.lineTo(-w / 2 + d, -h - d * 0.6);
    ctx.lineTo(w / 2 + d, -h - d * 0.6);
    ctx.lineTo(w / 2, -h);
    ctx.closePath();
    ctx.fillStyle = U.shade(color, 0.25);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // eleje
    D.rr(ctx, -w / 2, -h, w, h, 4);
    const g = ctx.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, U.shade(color, 0.15));
    g.addColorStop(1, U.shade(color, -0.12));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.stroke();
    D.star(ctx, 0, -h * 0.58, 22, 10, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    D.text(ctx, '?', x, y - h * 0.58 * s + 2 * s, { size: 30 * s, align: 'center', color: color });
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    D.text(ctx, 'TT3', 0, -14, { size: 14, align: 'center', color: '#fff' });
    ctx.restore();
  }
  TT.drawBlindBox = drawBox;

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      this.menu = new TT.ui.Menu();
      this.opening = null;
      TT.audio.music('shop');
      // a csapatból egy Titán köszön a boltban (ha van hozzá eredeti szinkron)
      setTimeout(() => TT.scene === this && TT.audio.voiceFrom(TT.save.team.slice(), 'shop', 1), 500);
      this.build();
      if (!TT.save.flags.shopVisited) {
        TT.save.flags.shopVisited = true;
        setTimeout(() => TT.ui.say([
          { who: 'kid_geza', text: 'Üdv a Teeny Játékboltban! Itt vakdobozokat vehetsz: sosem tudod, melyik figura van benne!' },
          { who: 'kid_geza', text: 'Ha duplát kapsz, a figurád tapasztalatot kap tőle. Szóval minden doboz megéri!' },
        ]), 300);
      }
    },

    build() {
      const s = TT.save;
      const items = TT.BOXES.map((b, i) => {
        const locked = b.req && !TT.cupDone(b.req);
        return {
          id: b.id, x: 90 + i * 270, y: 380, w: 240, h: 56,
          label: locked ? 'Zárva' : `${b.price} érme`, color: locked ? '#5a5470' : b.color,
          disabled: locked || s.coins < b.price,
          onDisabled: () => TT.ui.toast(locked ? `Előbb nyerd meg: ${TT.CUP[b.req].name}` : 'Nincs elég érméd!', { color: '#ff8a80' }),
          onClick: () => this.buy(b),
          box: b, locked,
        };
      });
      items.push({ id: 'back', x: 20, y: 470, w: 160, h: 52, label: 'Vissza', color: '#6c5ce7', sfx: 'back', onClick: () => TT.go('world', { pos: this.p.back, dir: 'down' }) });
      const off = TT.dailyOffer();
      this.offer = off;
      items.push({
        id: 'offer', x: 584, y: 464, w: 128, h: 50, size: 17,
        label: off.bought ? 'Megvetted' : `${U.fmt(off.price)} érme`, color: '#ffb000',
        disabled: off.bought || s.coins < off.price,
        onDisabled: () => TT.ui.toast(off.bought ? 'A mai ajánlatot már megvetted. Holnap új jön!' : 'Nincs elég érméd!', { color: '#ff8a80' }),
        onClick: () => this.buyOffer(off),
      });
      items.push({ id: 'team', x: TT.W - 220, y: 470, w: 200, h: 52, label: 'Gyűjtemény', color: '#3fa7ff', onClick: () => TT.go('collection', { from: 'shop', back: this.p.back }) });
      this.menu.set(items);
    },

    buyOffer(off) {
      const s = TT.save;
      if (off.bought || s.coins < off.price) return;
      s.coins -= off.price;
      s.offerBought = off.key;
      const info = TT.grantFigure(off.id);
      TT.store.write();
      TT.audio.sfx('buy');
      TT.ui.reveal(off.id, info, () => {
        this.build();
        TT.checkAch();
      });
    },

    buy(b) {
      const s = TT.save;
      if (s.coins < b.price) return;
      s.coins -= b.price;
      s.stats.boxes++;
      const id = TT.rollBox(b);
      const info = TT.grantFigure(id);
      TT.store.write();
      TT.audio.sfx('buy');
      this.opening = { box: b, id, info, t: 0, taps: 0, shake: 0, done: false };
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      const op = this.opening;
      if (op) {
        op.t += dt;
        op.shake = Math.max(0, op.shake - dt * 4);
        if (op.t > 0.4 && (I.hit('ok') || I.anyTap())) {
          op.taps++;
          op.shake = 1;
          TT.audio.sfx('box');
          TT.shake(4 + op.taps * 2, 0.15);
        }
        if ((op.taps >= 3 || op.t > 4) && !op.done) {
          op.done = true;
          op.burstT = 0;
          TT.fx.burst(TT.W / 2, 300, 40, { colors: ['#ffffff', op.box.color, '#ffd23f'], shape: 'star', speed: 520, size: 10, life: 0.9, layer: 1 });
          TT.fx.ring(TT.W / 2, 290, { color: '#ffffff', size: 20, size2: 300, life: 0.5, lw: 10, layer: 1 });
          TT.shake(10, 0.3);
          setTimeout(() => {
            TT.ui.reveal(op.id, op.info, () => {
              this.opening = null;
              this.build();
              TT.checkAch();
            });
          }, 380);
        }
        return;
      }
      if (I.hit('back')) {
        TT.audio.sfx('back');
        TT.go('world', { pos: this.p.back, dir: 'down' });
        return;
      }
      this.menu.update();
    },

    draw(ctx) {
      // bolt belső
      const g = ctx.createLinearGradient(0, 0, 0, TT.H);
      g.addColorStop(0, '#7ad3ff');
      g.addColorStop(1, '#bfe8ff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, TT.W, TT.H);
      // polcok
      for (let r = 0; r < 2; r++) {
        ctx.fillStyle = '#b0763a';
        ctx.fillRect(0, 118 + r * 90, TT.W, 10);
        for (let i = 0; i < 14; i++) {
          const col = ['#3fa7ff', '#c06bff', '#ffc93c', '#ff6b8a', '#7bd65b'][(i + r * 3) % 5];
          ctx.save();
          ctx.globalAlpha = 0.85;
          drawBox(ctx, 40 + i * 68 + r * 20, 118 + r * 90, 0.62, col);
          ctx.restore();
        }
      }
      ctx.fillStyle = '#e8d9b5';
      ctx.fillRect(0, 300, TT.W, TT.H - 300);
      ctx.fillStyle = 'rgba(120,90,50,0.15)';
      for (let i = 0; i < 12; i++) ctx.fillRect(i * 80, 300, 2, TT.H);
      // fejléc
      D.panel(ctx, TT.W / 2 - 200, 8, 400, 48, { fill: '#ffd23f', r: 14, lw: 3 });
      D.text(ctx, 'TEENY JÁTÉKBOLT', TT.W / 2, 33, { size: 30, align: 'center', color: '#fff', strokeColor: '#c0392b' });
      D.panel(ctx, TT.W - 182, 12, 166, 40, { fill: '#2b1e5c', r: 12, lw: 2.5 });
      D.coin(ctx, TT.W - 160, 32, 12);
      D.text(ctx, U.fmt(TT.save.coins), TT.W - 140, 33, { size: 22, color: '#ffd23f' });
      D.text(ctx, 'Figurák: ' + Object.keys(TT.save.owned).length + ' / ' + TT.FIG_LIST.length, 24, 33, { size: 20, color: '#fff' });

      if (!this.opening) {
        // dobozok
        this.menu.items.forEach((it) => {
          if (!it.box) return;
          const b = it.box;
          const cx = it.x + it.w / 2;
          D.panel(ctx, it.x, 134, it.w, 310, { fill: it.locked ? '#4a4460' : '#fdf6e3', r: 16, lw: 3 });
          const bob = Math.sin(TT.time * 2 + it.x) * 4;
          ctx.save();
          if (it.locked) ctx.globalAlpha = 0.45;
          drawBox(ctx, cx - 6, 242 + bob, 1.05, b.color);
          ctx.restore();
          if (it.locked) {
            // lakat
            ctx.save();
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#1d1433';
            ctx.beginPath();
            ctx.arc(cx, 186, 13, Math.PI, 0);
            ctx.stroke();
            D.rr(ctx, cx - 18, 186, 36, 28, 5);
            ctx.fillStyle = '#ffd23f';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
          }
          D.text(ctx, b.name, cx, 268, { size: 22, align: 'center', color: it.locked ? '#c8c0e8' : '#1b1140', stroke: false });
          const lines = D.wrap(ctx, b.desc, it.w - 24, 14);
          lines.forEach((l, i) => D.text(ctx, l, cx, 292 + i * 17, { size: 14, align: 'center', color: it.locked ? '#a89cd8' : '#4a3a7a', stroke: false }));
          // esélyek
          const odds = Object.entries(b.odds);
          const tot = odds.reduce((a, [, w]) => a + w, 0);
          let ox = it.x + 16;
          const bw = it.w - 32;
          odds.forEach(([r, w]) => {
            const ww = (bw * w) / tot;
            ctx.fillStyle = TT.RARITY[r].color;
            ctx.fillRect(ox, 336, ww, 10);
            if (ww > 34) D.text(ctx, Math.round((w / tot) * 100) + '%', ox + ww / 2, 356, { size: 12, align: 'center', color: TT.RARITY[r].color, lw: 3 });
            ox += ww;
          });
          ctx.strokeStyle = '#1d1433';
          ctx.lineWidth = 2;
          ctx.strokeRect(it.x + 16, 336, bw, 10);
        });
        // napi ajánlat
        const off = this.offer;
        if (off) {
          const f = TT.FIG[off.id];
          D.panel(ctx, 196, 456, 528, 66, { fill: '#2b1e5c', r: 14, lw: 3, stroke: TT.RARITY[f.rarity].color });
          ctx.save();
          D.rr(ctx, 204, 460, 58, 58, 10);
          ctx.clip();
          ctx.fillStyle = U.shade(TT.RARITY[f.rarity].ring, -0.4);
          ctx.fillRect(204, 460, 58, 58);
          ctx.drawImage(TT.art.figureCanvas(off.id, 96), 199, 458, 68, 68);
          ctx.restore();
          D.text(ctx, 'NAPI AJÁNLAT', 274, 474, { size: 14, color: '#ffd23f', lw: 3 });
          D.text(ctx, f.name, 274, 497, { size: 20, maxWidth: 210 });
          D.rarityStars(ctx, f.rarity, 280, 513, 10);
          if (TT.save.owned[off.id]) D.text(ctx, 'megvan: +csillag', 340, 513, { size: 11, color: '#c8b8f0', lw: 2.5 });
        }
        this.menu.draw(ctx);
      } else {
        const op = this.opening;
        ctx.fillStyle = 'rgba(10,5,25,0.6)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.sunburst(ctx, TT.W / 2, 290, 0, 0, 'rgba(0,0,0,0)', 'rgba(0,0,0,0)');
        const drop = U.ease.outBounce(U.clamp(op.t / 0.5, 0, 1));
        const sh = op.shake * Math.sin(op.t * 60) * 0.12;
        const y = -100 + drop * 440;
        if (!op.done) {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.ellipse(TT.W / 2, 344, 90, 18, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#000';
          ctx.fill();
          ctx.restore();
          drawBox(ctx, TT.W / 2, y, 2.4 + op.taps * 0.15, op.box.color, { rot: sh, lid: 0 });
          D.text(ctx, op.taps === 0 ? 'Koppints a doboz kinyitásához!' : ['', 'Még!', 'Még egyszer!'][op.taps] || '', TT.W / 2, 420, { size: 26, align: 'center', color: '#ffd23f' });
        }
      }
      TT.fx.draw(ctx, 0);
      TT.fx.draw(ctx, 1);
    },
  };

  TT.register('shop', scene);
})(window.TT);
