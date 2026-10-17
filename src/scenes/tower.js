'use strict';
// A Titánok Tornya belseje: bejárható nappali, Titánok, figuravitrin, tévé, kanapé.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const FLOOR = { x0: 60, x1: 900, y0: 318, y1: 512 };

  const QUIPS = {
    cyborg: [
      'BOOYAH! Új rekord a Teeny Titans játékban! …Várj, ez mi vagyunk.',
      'Tipp: a Tech figurák keményen ütnek a Misztikusokra. Mr. Mint csapata is tele van Tech-kel — Erővel törd át!',
      'Az AUTO gomb a harcban jól jön gyakorláshoz. De a tökéletes blokkot a gép nem csinálja olyan jól, mint te.',
      'Láttad a járőröző Menta-őröket? Gyakorlásnak tökéletesek. Ráadásul érmét is hoznak!',
    ],
    beastboy: [
      'Dude, a dupla figurák csillagot adnak! Öt csillag = szuper erős figura!',
      'Ha három azonos csapatú figurát viszel harcba, kapsz +12% bónuszt. Titánok ×3 a legjobb, naná.',
      'A pizzériában van egy pizzafogó játék. Én mindig nyerek. Mert megeszem a pizzát.',
      'Szerinted ha gorillává változom, a figurám is gorillává változik? …Megvan: van Gorilla Beast Boy figura!',
    ],
    raven: [
      'Csend. Meditálok. …Jó, mondd gyorsan.',
      'A zöld kör a lényeg. Akkor blokkolj, amikor zöld. Nem korábban. Nem később.',
      'A pihenő figurák támadásai is töltődnek. Cserélj, mielőtt elfogy a HP.',
      'Mr. Mint szerint a figurák a dobozban a legszebbek. Szerintem ez szomorú. Ne mondd el senkinek, hogy ezt mondtam.',
    ],
    starfire: [
      'Sütöttem nektek tamarani pudingot! Miért fut el mindenki?',
      'Silkie nagyon szereti a játékait. Ha elveszít egyet, segítünk megkeresni, igaz?',
      'A napi jutalom minden nap egyre nagyobb, ha egymás után gyűjtöd! Ez glorious!',
      'A vitrinben láthatod az összes figuránkat. Még nem teljes! Gyűjtsünk még!',
    ],
  };

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      this.pl = { x: 480, y: 500, dir: 'up', walk: 0, moving: false };
      this.joy = null;
      this.okCooldown = 0.4;
      this.npcs = [
        { who: 'cyborg', x: 170, y: 420, face: -1, pose: 'idle' },
        { who: 'beastboy', x: 470, y: 372, face: 1, pose: 'idle' },
        { who: 'raven', x: 690, y: 360, face: -1, float: true },
        { who: 'starfire', x: 830, y: 430, face: -1, pose: 'idle' },
        { who: 'silkie', x: 560, y: 470, face: -1 },
      ];
      this.spots = [
        { id: 'tv', x: 110, y: 380, label: 'Csapat' },
        { id: 'couch', x: 380, y: 360, label: 'Mentés' },
        { id: 'vitrin', x: 280, y: 330, label: 'Vitrin' },
        { id: 'door', x: 480, y: 516, label: 'Kijárat' },
      ];
      TT.audio.music('tower');
    },

    exitTower() {
      TT.audio.sfx('door');
      TT.go('world', { pos: this.p.back, dir: 'down' });
    },

    interact(it) {
      if (it.npc) {
        const n = it.npc;
        if (n.who === 'silkie') {
          TT.ui.say([{ who: 'silkie', text: U.pick(['*boldog Silkie hangok*', '*Silkie hempereg*', '*Silkie rágcsál valamit… remélhetőleg nem egy figurát*']) }]);
          return;
        }
        TT.ui.say([{ who: n.who, text: U.pick(QUIPS[n.who]) }]);
        return;
      }
      switch (it.id) {
        case 'tv':
          TT.go('collection', { from: 'tower', back: this.p.back });
          break;
        case 'couch':
          TT.store.write();
          TT.audio.sfx('heal');
          TT.ui.toast('Kipihented magad. Játék elmentve!');
          this.okCooldown = 1.5;
          break;
        case 'vitrin':
          this.openVitrin();
          break;
        case 'door':
          this.exitTower();
          break;
        default:
          break;
      }
    },

    openVitrin() {
      const own = TT.save.owned;
      const list = TT.FIG_LIST;
      let scroll = 0, drag = null;
      const cols = 9, cw = 96, chh = 112;
      const x0 = (TT.W - cols * cw) / 2, y0 = 92;
      TT.audio.sfx('select');
      TT.ui.push({
        update() {
          const I = TT.input;
          const rows = Math.ceil(list.length / cols);
          const max = Math.max(0, rows * chh - (TT.H - y0 - 20));
          if (I.hit('back') || I.hit('ok') || I.tapIn(TT.W - 70, 16, 54, 54)) {
            TT.audio.sfx('back');
            this.close();
            return;
          }
          if (I.wheel) scroll += I.wheel * 0.6;
          if (I.act('down')) scroll += 8;
          if (I.act('up')) scroll -= 8;
          for (const t of I.taps) drag = { id: t.id, y: t.y, s: scroll };
          if (drag) {
            const pp = I.pointers.get(drag.id);
            if (!pp) drag = null;
            else scroll = drag.s - (pp.y - drag.y);
          }
          scroll = U.clamp(scroll, 0, max);
        },
        draw(ctx) {
          ctx.save();
          const g = ctx.createLinearGradient(0, 0, 0, TT.H);
          g.addColorStop(0, '#3a2414');
          g.addColorStop(1, '#1e120a');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, TT.W, TT.H);
          D.text(ctx, `Figuravitrin — ${Object.keys(own).length}/${list.length}`, 24, 44, { size: 32, color: '#ffd23f' });
          D.button(ctx, TT.W - 70, 16, 54, 54, '×', { color: '#e84545', size: 30 });
          ctx.beginPath();
          ctx.rect(0, y0 - 10, TT.W, TT.H - y0 + 10);
          ctx.clip();
          list.forEach((f, i) => {
            const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * chh - scroll;
            if (y > TT.H || y + chh < y0 - 20) return;
            if (i % cols === 0) {
              ctx.fillStyle = '#7a4a2b';
              ctx.fillRect(0, y + 92, TT.W, 12);
              ctx.fillStyle = '#5a3418';
              ctx.fillRect(0, y + 104, TT.W, 5);
            }
            const has = own[f.id];
            ctx.drawImage(TT.art.figureCanvas(f.id, 96, { silhouette: !has }), x, y, 96, 96);
            if (has) {
              D.text(ctx, f.short, x + 48, y + 98, { size: 11, align: 'center', lw: 2.5, maxWidth: 92, color: TT.RARITY[f.rarity].color });
            } else D.text(ctx, '?', x + 48, y + 50, { size: 26, align: 'center', color: '#8a6a4a' });
          });
          ctx.restore();
        },
      });
    },

    nearest() {
      const pl = this.pl;
      let best = null, bd = 70;
      for (const n of this.npcs) {
        const d = U.dist(pl.x, pl.y, n.x, n.y);
        if (d < bd) {
          bd = d;
          best = { npc: n, x: n.x, y: n.y - 70, label: 'Beszélj' };
        }
      }
      for (const s of this.spots) {
        const d = U.dist(pl.x, pl.y, s.x, s.y);
        if (d < bd) {
          bd = d;
          best = { id: s.id, x: s.x, y: s.y - 40, label: s.label };
        }
      }
      return best;
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      const pl = this.pl;
      if (I.hit('back')) {
        this.exitTower();
        return;
      }
      // mozgás (billentyű + érintéses joystick)
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
          this.joy.x = ptr.x;
          this.joy.y = ptr.y;
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
          this.exitTower();
          return;
        }
      }
      this.prompt = this.nearest();
      this.okCooldown -= dt;
      const aTap = I.tapIn(aBtn.x - aBtn.r, aBtn.y - aBtn.r, aBtn.r * 2, aBtn.r * 2);
      if (aTap && this.joy && this.joy.id === aTap.id) this.joy = null;
      if ((I.hit('ok') || aTap) && this.prompt && this.okCooldown <= 0) this.interact(this.prompt);
      // a Titánok a játékos felé fordulnak
      for (const n of this.npcs) if (U.dist(pl.x, pl.y, n.x, n.y) < 160) n.face = pl.x > n.x ? 1 : -1;
    },

    drawRoom(ctx) {
      // hátsó fal
      ctx.fillStyle = '#e8e4f4';
      ctx.fillRect(0, 0, TT.W, 300);
      // ablak a városra (napszak szerint)
      const dark = TT.scenes.world.darkness ? TT.scenes.world.darkness() : 0;
      const g = ctx.createLinearGradient(0, 30, 0, 250);
      g.addColorStop(0, U.mix('#ff9e7a', '#141040', dark));
      g.addColorStop(1, U.mix('#ffe2a8', '#3a2a7a', dark));
      ctx.fillStyle = g;
      ctx.fillRect(520, 30, 410, 220);
      const rnd = U.rng(42);
      for (let x = 524; x < 926;) {
        const w = 24 + rnd() * 36, h = 40 + rnd() * 110;
        ctx.fillStyle = U.mix('#7a5aa8', '#241a50', dark);
        ctx.fillRect(x, 250 - h, w, h);
        ctx.fillStyle = dark > 0.4 ? 'rgba(255,233,160,0.8)' : 'rgba(255,255,255,0.3)';
        for (let wy = 250 - h + 8; wy < 244; wy += 14) for (let wx = x + 5; wx < x + w - 6; wx += 10) if (rnd() < 0.5) ctx.fillRect(wx, wy, 4, 6);
        x += w + 3;
      }
      ctx.strokeStyle = '#c8c4dc';
      ctx.lineWidth = 8;
      ctx.strokeRect(520, 30, 410, 220);
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        ctx.moveTo(520 + i * 102.5, 30);
        ctx.lineTo(520 + i * 102.5, 250);
      }
      ctx.stroke();
      // vitrin a falon
      ctx.fillStyle = '#7a4a2b';
      D.rr(ctx, 186, 40, 300, 220, 8);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      ctx.fillStyle = '#f4ead8';
      ctx.fillRect(198, 52, 276, 196);
      const owned = TT.FIG_LIST.filter((f) => TT.save.owned[f.id]);
      for (let r = 0; r < 3; r++) {
        ctx.fillStyle = '#a07a50';
        ctx.fillRect(198, 112 + r * 64, 276, 8);
        for (let i = 0; i < 6; i++) {
          const f = owned[r * 6 + i];
          if (!f) continue;
          ctx.drawImage(TT.art.figureCanvas(f.id, 96), 202 + i * 45, 66 + r * 64, 48, 48);
        }
      }
      D.text(ctx, 'VITRIN', 336, 28, { size: 18, align: 'center', color: '#7a4a2b', stroke: false });
      // tévé
      ctx.fillStyle = '#1d1433';
      D.rr(ctx, 20, 120, 150, 96, 8);
      ctx.fill();
      const tg = ctx.createLinearGradient(28, 128, 162, 208);
      tg.addColorStop(0, '#3fa7ff');
      tg.addColorStop(1, '#c06bff');
      ctx.fillStyle = tg;
      ctx.fillRect(28, 128, 134, 80);
      D.text(ctx, 'TT3', 95, 168, { size: 26 + Math.sin(this.t * 3) * 2, align: 'center', color: '#ffd23f' });
      ctx.fillStyle = '#5a5470';
      ctx.fillRect(80, 216, 30, 14);
      // padló
      const fg = ctx.createLinearGradient(0, 290, 0, TT.H);
      fg.addColorStop(0, '#8a6ab8');
      fg.addColorStop(1, '#5a4a8a');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 290, TT.W, TT.H - 290);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 12; i++) ctx.fillRect(i * 84, 290, 2, TT.H);
      ctx.fillStyle = '#1d1433';
      ctx.fillRect(0, 286, TT.W, 6);
      // szőnyeg
      ctx.beginPath();
      ctx.ellipse(470, 430, 230, 60, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff9e7a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      // kanapé
      D.rr(ctx, 300, 300, 330, 70, 18);
      ctx.fillStyle = '#5a4aa0';
      ctx.fill();
      ctx.stroke();
      D.rr(ctx, 312, 330, 306, 40, 12);
      ctx.fillStyle = '#7a6ac8';
      ctx.fill();
      ctx.stroke();
      // konyhapult
      D.rr(ctx, 760, 300, 180, 70, 6);
      ctx.fillStyle = '#d8d4ee';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.arc(820, 298, 14, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      // ajtó (alul)
      ctx.fillStyle = '#2b1e5c';
      ctx.fillRect(420, TT.H - 14, 120, 14);
      D.text(ctx, '▼ KIJÁRAT', 480, TT.H - 22, { size: 13, align: 'center', color: '#ffd23f', lw: 3 });
    },

    draw(ctx) {
      this.drawRoom(ctx);
      const items = [];
      for (const n of this.npcs) {
        items.push({
          y: n.y, draw: () => {
            const fy = n.float ? n.y - 18 + Math.sin(this.t * 2) * 6 : n.y;
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.ellipse(n.x, n.y + 2, 18, 6, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();
            TT.art.drawFigure(ctx, TT.FIG[n.who], n.x, fy, 0.9, { pedestal: false, facing: n.face, t: this.t + n.x, noCustom: true });
          },
        });
      }
      const pl = this.pl;
      items.push({
        y: pl.y, draw: () => {
          ctx.save();
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.ellipse(pl.x, pl.y + 2, 18, 6, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#000';
          ctx.fill();
          ctx.restore();
          TT.art.drawFigure(ctx, TT.FIG.robin, pl.x, pl.y, 0.9, { pedestal: false, pose: pl.moving ? 'walk' : 'idle', walk: pl.walk, facing: pl.dir === 'left' ? -1 : 1, back: pl.dir === 'up', noCustom: true });
        },
      });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.draw();
      // felirat
      D.panel(ctx, 12, 12, 250, 44, { fill: '#2b1e5c', r: 12, lw: 2.5 });
      D.text(ctx, 'Titánok Tornya', 137, 35, { size: 22, align: 'center', color: '#ffd23f' });
      // interakció jelzés
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
        ctx.save();
        ctx.globalAlpha = p ? 0.95 : 0.5;
        ctx.beginPath();
        ctx.arc(TT.W - 110, TT.H - 110, 46, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6b35';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1d1433';
        ctx.stroke();
        ctx.restore();
        D.text(ctx, 'A', TT.W - 110, TT.H - 108, { size: 34, align: 'center' });
      }
    },
  };

  TT.register('tower', scene);
})(window.TT);
