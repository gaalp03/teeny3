'use strict';
// Napi szerencsekerék: naponta egy ingyenes pörgetés érméért, kellékért vagy (ritkán) új figuráért.
// A pörgés és a megállás hangja a TT2 tofu-ruletté (ha a saját APK-ból megvan).
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const SPIN = 4.6;
  const CX = TT.W / 2, CY = 262, R = 160;

  const SEGS = [
    { label: '50', kind: 'coins', v: 50, color: '#ffd23f', w: 22 },
    { label: 'Pizza', kind: 'item', v: 'pizza', color: '#ff6b35', w: 16 },
    { label: '150', kind: 'coins', v: 150, color: '#7bd65b', w: 18 },
    { label: 'Energia', kind: 'item', v: 'energy', color: '#3fa7ff', w: 12 },
    { label: '300', kind: 'coins', v: 300, color: '#ff4fa3', w: 10 },
    { label: 'Krypto', kind: 'item', v: 'krypto', color: '#9d4edd', w: 9 },
    { label: '600', kind: 'coins', v: 600, color: '#2ecc71', w: 5 },
    { label: 'Figura!', kind: 'fig', color: '#ffc93c', w: 8 },
  ];
  const SEG = (Math.PI * 2) / SEGS.length;

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  TT.wheelReady = () => !!TT.save && TT.save.wheelDay !== today();

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      this.rot = -SEG / 2;
      this.spin = null;
      this.result = null;
      this.menu = new TT.ui.Menu();
      this.build();
      TT.audio.music('shop');
    },

    build() {
      const ready = TT.wheelReady() && !this.spin;
      this.menu.set([
        { id: 'spin', x: TT.W / 2 - 230, y: TT.H - 66, w: 220, h: 52, label: ready ? 'Pörgesd!' : 'Holnap újra!', color: '#ff6b35', disabled: !ready, glow: ready, onClick: () => this.startSpin() },
        { id: 'back', x: TT.W / 2 + 10, y: TT.H - 66, w: 220, h: 52, label: 'Vissza', color: '#6c5ce7', disabled: !!this.spin, onClick: () => this.leave() },
      ]);
    },

    leave() {
      TT.audio.sfx('back');
      TT.go('world', { pos: this.p.back, dir: 'down' });
    },

    startSpin() {
      if (!TT.wheelReady() || this.spin) return;
      const s = TT.save;
      s.wheelDay = today();
      s.stats.spins = (s.stats.spins || 0) + 1;
      TT.store.write();
      const idx = U.weighted(SEGS.map((sg, i) => ({ v: i, w: sg.w })));
      // a mutató felül van (-90°): úgy forgatunk, hogy a nyertes cikk közepe (kis szórással) oda essen
      const want = -Math.PI / 2 - (idx + 0.5) * SEG + U.rand(-0.32, 0.32) * SEG;
      const base = this.rot - (this.rot % (Math.PI * 2));
      const to = base + Math.PI * 2 * 6 + (((want - base) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      this.spin = { t: 0, from: this.rot, to, idx, tick: this.segAt(this.rot) };
      this.result = null;
      this.sound = TT.audio.sfx('wheel');
      this.build();
    },

    // melyik cikk van a mutató alatt az adott elforgatásnál
    segAt(rot) {
      const a = (((-Math.PI / 2 - rot) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      return Math.floor(a / SEG);
    },

    finish() {
      const sp = this.spin;
      this.spin = null;
      if (this.sound && this.sound.stop) {
        try { this.sound.stop(); } catch (e) { /* már leállt */ }
      }
      TT.audio.sfx('wheelstop');
      const sg = SEGS[sp.idx];
      const s = TT.save;
      s.items = s.items || {};
      TT.fx.burst(CX, CY - R, 24, { colors: [sg.color, '#ffffff', '#ffd23f'], shape: 'star', speed: 320, size: 8, life: 0.8, layer: 1 });
      if (sg.kind === 'coins') {
        s.coins += sg.v;
        this.result = `+${sg.v} érme!`;
        setTimeout(() => TT.audio.sfx('coin'), 250);
      } else if (sg.kind === 'item') {
        const it = TT.ITEMS[sg.v];
        if ((s.items[sg.v] || 0) >= TT.ITEM_MAX) {
          s.coins += 100;
          this.result = `${it.name} — tele a hátizsák, helyette +100 érme`;
        } else {
          s.items[sg.v] = (s.items[sg.v] || 0) + 1;
          this.result = `+1 ${it.name}!`;
        }
      } else {
        const id = TT.rollBox(TT.BOXES[0]);
        const info = TT.grantFigure(id);
        s.flags.wheelFig = true;
        this.result = `${TT.FIG[id].name}!`;
        TT.store.write();
        setTimeout(() => TT.scene === this && TT.ui.reveal(id, info, () => TT.checkAch()), 500);
      }
      TT.audio.voiceFrom(U.shuffle(s.team.slice()), sg.kind === 'fig' || sg.v >= 300 ? 'offer' : 'chat', 0.8);
      TT.store.write();
      if (sg.kind !== 'fig') TT.checkAch();
      this.build();
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      if (this.spin) {
        const sp = this.spin;
        sp.t += dt;
        const k = U.clamp(sp.t / SPIN, 0, 1);
        this.rot = U.lerp(sp.from, sp.to, 1 - Math.pow(1 - k, 4));
        const cur = this.segAt(this.rot);
        if (cur !== sp.tick) {
          sp.tick = cur;
          if (k > 0.55) TT.audio.sfx('move');
        }
        if (k >= 1) this.finish();
        return;
      }
      if (I.hit('back')) {
        this.leave();
        return;
      }
      this.menu.update();
    },

    draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, TT.H);
      g.addColorStop(0, '#3a2a7a');
      g.addColorStop(1, '#1b1140');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, TT.W, TT.H);
      D.sunburst(ctx, CX, CY, 640, 18, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)', TT.time * 0.1);
      D.text(ctx, 'Szerencsekerék', CX, 28, { size: 30, align: 'center', color: '#ffd23f' });
      D.text(ctx, 'Naponta egy ingyenes pörgetés!', CX, 54, { size: 16, align: 'center', color: '#c8b8f0', stroke: false });
      // kerék
      ctx.save();
      ctx.translate(CX, CY);
      ctx.beginPath();
      ctx.arc(0, 0, R + 12, 0, Math.PI * 2);
      ctx.fillStyle = '#120a2c';
      ctx.fill();
      ctx.rotate(this.rot);
      SEGS.forEach((sg, i) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, i * SEG, (i + 1) * SEG);
        ctx.closePath();
        ctx.fillStyle = sg.color;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#120a2c';
        ctx.stroke();
        ctx.save();
        ctx.rotate((i + 0.5) * SEG);
        D.text(ctx, sg.label, R * 0.6, 1, { size: sg.kind === 'coins' ? 24 : 18, align: 'center', color: '#ffffff' });
        if (sg.kind === 'coins') D.coin(ctx, R * 0.88, 0, 9);
        ctx.restore();
      });
      // égők a peremen
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (R + 6), Math.sin(a) * (R + 6), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = (i + Math.floor(TT.time * 6)) % 2 ? '#ffd23f' : '#fff6d8';
        ctx.fill();
      }
      ctx.restore();
      // középső agy és mutató
      ctx.beginPath();
      ctx.arc(CX, CY, 34, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#120a2c';
      ctx.stroke();
      D.star(ctx, CX, CY, 18, 8, 5);
      ctx.fillStyle = '#ff6b35';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(CX - 20, CY - R - 26);
      ctx.lineTo(CX + 20, CY - R - 26);
      ctx.lineTo(CX, CY - R + 12);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#120a2c';
      ctx.stroke();
      if (this.result) D.text(ctx, this.result, CX, TT.H - 86, { size: 24, align: 'center', color: '#ffd23f' });
      else if (!this.spin && !TT.wheelReady()) D.text(ctx, 'Ma már pörgettél. Gyere vissza holnap!', CX, TT.H - 86, { size: 18, align: 'center', color: '#c8b8f0' });
      this.menu.draw(ctx);
      TT.fx.draw(ctx, 1);
    },
  };

  TT.register('wheel', scene);
})(window.TT);
