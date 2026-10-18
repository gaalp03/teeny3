'use strict';
// Gyűjtemény és csapatszerkesztő.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const COLS = 6, CW = 86, CH = 98, GX = 18, GY = 176, GH = TT.H - GY - 8;

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      this.scroll = 0;
      this.slot = 0;
      this.filter = 'all';
      this.menu = new TT.ui.Menu();
      this.drag = null;
      const first = TT.save.team[0];
      this.sel = first;
      this.list = this.makeList();
      TT.audio.music('shop');
    },

    makeList() {
      const own = TT.save.owned;
      let l = TT.FIG_LIST.slice();
      if (this.filter === 'own') l = l.filter((f) => own[f.id]);
      const sort = TT.settings.collSort || 'base';
      const idx = new Map(TT.FIG_LIST.map((f, i) => [f.id, i]));
      const by = {
        base: () => 0,
        lvl: (a, b) => (own[b.id] ? own[b.id].lvl : -1) - (own[a.id] ? own[a.id].lvl : -1),
        rarity: (a, b) => TT.RARITY[b.rarity].order - TT.RARITY[a.rarity].order,
        type: (a, b) => Object.keys(TT.TYPES).indexOf(a.type) - Object.keys(TT.TYPES).indexOf(b.type),
        team: (a, b) => Object.keys(TT.TEAM_NAMES).indexOf(a.team) - Object.keys(TT.TEAM_NAMES).indexOf(b.team),
      }[sort];
      l.sort((a, b) => by(a, b) || idx.get(a.id) - idx.get(b.id));
      return l.map((f) => f.id);
    },

    leave() {
      TT.audio.sfx('back');
      const p = this.p;
      if (p.from === 'dome') TT.go('dome', { venue: p.venue, back: p.back, sel: p.sel });
      else if (p.from === 'shop') TT.go('shop', { back: p.back });
      else if (p.from === 'tower') TT.go('tower', { back: p.back });
      else if (p.from === 'training') TT.go('tower', { back: p.back });
      else TT.go('world', { dir: 'down' });
    },

    setTeam(id) {
      const s = TT.save;
      if (!s.owned[id]) return;
      const cur = s.team.indexOf(id);
      if (cur >= 0 && cur !== this.slot) {
        // csere a két hely között
        s.team[cur] = s.team[this.slot];
      }
      s.team[this.slot] = id;
      TT.store.write();
      TT.audio.sfx('swap');
      this.slot = (this.slot + 1) % 3;
    },

    train(id) {
      const s = TT.save;
      const o = s.owned[id];
      if (!o || o.lvl >= TT.MAX_LVL) return;
      const cost = this.trainCost(id);
      if (s.coins < cost) {
        TT.ui.toast('Nincs elég érméd!', { color: '#ff8a80' });
        TT.audio.sfx('error');
        return;
      }
      s.coins -= cost;
      const ups = TT.addXp(id, 100);
      TT.store.write();
      TT.audio.sfx(ups ? 'levelup' : 'buy');
      if (ups) TT.checkAch();
      TT.fx.text(760, 200, ups ? 'SZINTLÉPÉS!' : '+100 XP', { color: ups ? '#7bff6b' : '#c8b8f0', tsize: 26, layer: 1 });
    },
    trainCost(id) {
      const o = TT.save.owned[id];
      return 60 + (o ? o.lvl : 1) * 12;
    },

    buildButtons() {
      const s = TT.save;
      const items = [];
      items.push({ id: 'back', x: 16, y: 10, w: 120, h: 44, label: 'Vissza', color: '#6c5ce7', size: 20, onClick: () => this.leave() });
      items.push({ id: 'f_all', x: 150, y: 10, w: 100, h: 44, label: 'Mind', size: 18, color: this.filter === 'all' ? '#ff6b35' : '#4a3a8c', onClick: () => { this.filter = 'all'; this.list = this.makeList(); this.scroll = 0; } });
      items.push({ id: 'f_own', x: 258, y: 10, w: 120, h: 44, label: 'Megvan', size: 18, color: this.filter === 'own' ? '#ff6b35' : '#4a3a8c', onClick: () => { this.filter = 'own'; this.list = this.makeList(); this.scroll = 0; } });
      const SORTS = [['base', 'Alap'], ['lvl', 'Szint'], ['rarity', 'Ritkaság'], ['type', 'Típus'], ['team', 'Csapat']];
      const cur = SORTS.findIndex((x) => x[0] === (TT.settings.collSort || 'base'));
      items.push({
        id: 'sort', x: 386, y: 10, w: 150, h: 44, size: 16, label: 'Rend: ' + SORTS[cur][1], color: '#4a3a8c',
        onClick: () => {
          TT.settings.collSort = SORTS[(cur + 1) % SORTS.length][0];
          TT.store.writeSettings();
          this.list = this.makeList();
        },
      });
      // csapat helyek
      s.team.forEach((id, i) => {
        items.push({
          id: 'slot' + i, x: 18 + i * 128, y: 70, w: 120, h: 94, silent: false,
          onClick: () => { this.slot = i; this.sel = id; },
          draw: (ctx, b, focus) => this.drawSlot(ctx, b, i, focus),
        });
      });
      // rács
      const own = s.owned;
      const focused = this.menu.items[this.menu.focus];
      const fromGrid = !!(focused && focused.id.startsWith('fig_'));
      this.list.forEach((id, k) => {
        const col = k % COLS, row = Math.floor(k / COLS);
        const x = GX + col * CW, y = GY + row * CH - this.scroll;
        const vis = y > GY - CH + 10 && y < GY + GH - 10;
        // billentyűvel/kontrollerrel a rácson belül a következő (még nem látható) sor is elérhető, odagörget
        const kb = TT.input.lastDevice === 'keyboard' || TT.input.lastDevice === 'pad';
        const nav = vis || (kb && fromGrid && y > GY - 2 * CH + 10 && y < GY + GH + CH - 10);
        items.push({
          id: 'fig_' + id, x, y, w: CW - 6, h: CH - 6, skip: !nav, hidden: !vis, silent: true,
          onClick: () => {
            if (this.sel === id && own[id]) this.setTeam(id);
            else TT.audio.sfx('move');
            this.sel = id;
          },
          draw: (ctx, b, focus) => this.drawCell(ctx, b, id, focus),
        });
      });
      // részletek gombjai
      const sel = this.sel;
      if (sel && own[sel]) {
        const inTeam = s.team.indexOf(sel);
        items.push({ id: 'add', x: 590, y: 476, w: 168, h: 52, size: 18, label: inTeam >= 0 ? `${inTeam + 1}. helyen` : `Csapatba (${this.slot + 1}.)`, color: '#2ecc71', disabled: inTeam === this.slot, onClick: () => this.setTeam(sel) });
        const maxed = own[sel].lvl >= TT.MAX_LVL;
        items.push({ id: 'train', x: 766, y: 476, w: 178, h: 52, size: 17, label: maxed ? 'Max szint' : `Edzés ${this.trainCost(sel)}`, color: '#ffb000', disabled: maxed, onClick: () => this.train(sel) });
        items.push({ id: 'paint', x: 598, y: 262, w: 64, h: 30, size: 13, label: 'Festés', color: '#ff4fa3', onClick: () => TT.openPaintShop(sel) });
        const hasCustom = TT.custom.figures[sel];
        items.push({
          id: 'img', x: 666, y: 262, w: 64, h: 30, size: 13, label: hasCustom ? 'Törlés' : 'Kép', color: '#6c5ce7',
          onClick: () => {
            if (hasCustom) TT.custom.remove('fig', sel).then(() => TT.ui.toast('Saját kép törölve'));
            else TT.custom.pickFor('fig', sel, (ok) => TT.ui.toast(ok ? 'Saját kép beállítva!' : 'Hibás kép', { color: ok ? '#7bff6b' : '#ff8a80' }));
          },
        });
      }
      this.menu.set(items);
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      if (I.hit('back')) {
        this.leave();
        return;
      }
      this.spin3d(dt);
      // görgetés
      const rows = Math.ceil(this.list.length / COLS);
      const maxScroll = Math.max(0, rows * CH - GH + 10);
      if (I.wheel) this.scroll += I.wheel * 0.6;
      for (const tp of I.taps) if (tp.x < GX + COLS * CW && tp.y > GY) this.drag = { id: tp.id, y: tp.y, s: this.scroll, moved: 0 };
      if (this.drag) {
        const ptr = I.pointers.get(this.drag.id);
        if (!ptr) this.drag = null;
        else {
          const dy = ptr.y - this.drag.y;
          this.drag.moved = Math.max(this.drag.moved, Math.abs(dy));
          if (this.drag.moved > 10) this.scroll = this.drag.s - dy;
        }
      }
      this.scroll = U.clamp(this.scroll, 0, maxScroll);
      this.buildButtons();
      // húzás közben ne válasszon
      if (this.drag && this.drag.moved > 10) I.consumeTaps();
      const before = this.menu.focus;
      this.menu.update();
      const f = this.menu.items[this.menu.focus];
      if (before !== this.menu.focus && f && f.id.startsWith('fig_') && (I.lastDevice === 'keyboard' || I.lastDevice === 'pad')) {
        this.sel = f.id.slice(4);
        // fókusz láthatóvá görgetése
        if (f.y < GY) this.scroll -= GY - f.y;
        if (f.y + f.h > GY + GH) this.scroll += f.y + f.h - GY - GH;
      }
    },

    drawSlot(ctx, b, i, focus) {
      const s = TT.save;
      const id = s.team[i];
      const sel = this.slot === i;
      D.panel(ctx, b.x, b.y, b.w, b.h, { fill: sel ? '#ff6b35' : '#2b1e5c', r: 12, lw: 3, stroke: focus ? '#ffffff' : sel ? '#ffd23f' : '#120a2c' });
      ctx.drawImage(TT.art.figureCanvas(id, 96), b.x + 12, b.y - 2, 96, 96);
      D.text(ctx, String(i + 1), b.x + 12, b.y + 16, { size: 18, color: '#ffd23f' });
      D.text(ctx, 'Sz. ' + (s.owned[id] ? s.owned[id].lvl : 1), b.x + b.w - 8, b.y + b.h - 12, { size: 14, align: 'right', color: '#fff' });
    },

    drawCell(ctx, b, id, focus) {
      if (b.y + b.h < GY - 4 || b.y > GY + GH) return;
      const own = TT.save.owned[id];
      const f = TT.FIG[id];
      const sel = this.sel === id;
      const inTeam = TT.save.team.indexOf(id) >= 0;
      D.panel(ctx, b.x, b.y, b.w, b.h, { fill: own ? U.shade(TT.RARITY[f.rarity].ring, -0.45) : '#221a40', r: 10, lw: 2.5, stroke: sel ? '#ffd23f' : focus ? '#ffffff' : '#120a2c', shadow: false });
      ctx.drawImage(TT.art.figureCanvas(id, 96, { silhouette: !own }), b.x - 4, b.y - 4, 88, 88);
      if (own) {
        D.text(ctx, f.short, b.x + b.w / 2, b.y + b.h - 10, { size: 12, align: 'center', maxWidth: b.w - 6, lw: 3 });
        D.text(ctx, String(own.lvl), b.x + 6, b.y + 12, { size: 13, color: '#ffd23f', lw: 3 });
        const st = TT.starsOf(id);
        if (st > 0) D.text(ctx, '★' + st, b.x + b.w - 5, b.y + 30, { size: 12, align: 'right', color: '#ffd23f', lw: 3 });
        if (inTeam) {
          D.star(ctx, b.x + b.w - 11, b.y + 11, 8, 3.5, 5);
          ctx.fillStyle = '#ff6b35';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#120a2c';
          ctx.stroke();
        }
      } else {
        D.text(ctx, '?', b.x + b.w / 2, b.y + 40, { size: 30, align: 'center', color: '#5a4a9a' });
      }
    },

    draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, TT.H);
      g.addColorStop(0, '#3a2a7a');
      g.addColorStop(1, '#1b1140');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, TT.W, TT.H);
      const s = TT.save;
      D.text(ctx, `${Object.keys(s.owned).length}/${TT.FIG_LIST.length}`, 548, 33, { size: 20, color: '#ffd23f' });
      D.panel(ctx, 400 + 6, 66, 170, 40, { fill: '#2b1e5c', r: 12, lw: 2.5, shadow: false });
      D.coin(ctx, 428, 86, 12);
      D.text(ctx, U.fmt(s.coins), 448, 87, { size: 20, color: '#ffd23f' });
      D.text(ctx, 'Válassz helyet, majd figurát.', 404, 124, { size: 14, color: '#c8b8f0', stroke: false });
      const syn = TT.synergy(s.team);
      if (syn) D.text(ctx, `Bónusz: ${TT.TEAM_NAMES[syn.team]} ×${syn.n} +${Math.round(syn.bonus * 100)}%`, 404, 146, { size: 14, color: '#ffe066', lw: 3, maxWidth: 172 });
      else D.text(ctx, 'Azonos csapat: bónusz!', 404, 146, { size: 14, color: '#c8b8f0', stroke: false });
      const combos = [];
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        const n = TT.comboOf(s.team[i], s.team[j]);
        if (n) combos.push(n);
      }
      if (combos.length) D.text(ctx, 'Kombó: ' + combos.join(', '), 404, 166, { size: 13, color: '#ff9ecd', lw: 3, maxWidth: 172 });

      // rács kivágva
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, GY - 6, GX + COLS * CW + 4, GH + 14);
      ctx.clip();
      this.menu.items.forEach((b, i) => {
        if (!b.id.startsWith('fig_')) return;
        const focus = this.menu.showFocus() && i === this.menu.focus;
        b.draw(ctx, b, focus);
      });
      ctx.restore();
      // görgetősáv
      const rows = Math.ceil(this.list.length / COLS);
      const total = rows * CH;
      if (total > GH) {
        const sh = (GH / total) * GH;
        const sy = GY + (this.scroll / (total - GH + 10)) * (GH - sh);
        D.rr(ctx, GX + COLS * CW + 2, sy, 6, sh, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();
      }
      // gombok (rács nélkül)
      // a Festés / Kép gombok a részletek paneljén vannak, ezért azok után rajzolódnak
      const btn = (b, i) => {
        const focus = this.menu.showFocus() && i === this.menu.focus;
        if (b.draw) b.draw(ctx, b, focus);
        else D.button(ctx, b.x, b.y, b.w, b.h, b.label, { color: b.color, disabled: b.disabled, focus, size: b.size });
      };
      const onDetail = (b) => b.id === 'paint' || b.id === 'img';
      this.menu.items.forEach((b, i) => !b.id.startsWith('fig_') && !onDetail(b) && btn(b, i));
      this.drawDetail(ctx);
      this.menu.items.forEach((b, i) => onDetail(b) && btn(b, i));
      TT.fx.draw(ctx, 1);
    },

    // 3D figura az adatlapon: lassan forog, húzással körbe forgatható, koppintásra táncol
    spin3d(dt) {
      const I = TT.input;
      const ax = 594, ay = 76, aw = 140, ah = 180;
      this.yaw = this.yaw == null ? 0.3 : this.yaw;
      this.dance = Math.max(0, (this.dance || 0) - dt);
      this.spinDrag = this.spinDrag || {};
      let held = false;
      for (const p of I.pointers.values()) {
        if (p.sx < ax || p.sx > ax + aw || p.sy < ay || p.sy > ay + ah) continue;
        held = true;
        const last = this.spinDrag[p.id];
        if (last != null) this.yaw += (p.x - last) * 0.03;
        this.spinDrag[p.id] = p.x;
      }
      for (const r of I.releases) {
        delete this.spinDrag[r.id];
        if (r.sx >= ax && r.sx <= ax + aw && r.sy >= ay && r.sy <= ay + ah && Math.hypot(r.x - r.sx, r.y - r.sy) < 8 && TT.model3d && TT.model3d.has(this.sel)) {
          this.dance = 2.6;
          TT.audio.sfx('select');
        }
      }
      if (!held) this.yaw += dt * 0.5;
    },

    drawDetail(ctx) {
      const id = this.sel;
      if (!id) return;
      const f = TT.FIG[id];
      const own = TT.save.owned[id];
      const x = 584, y = 66, w = 366, h = 402;
      D.panel(ctx, x, y, w, h, { fill: '#2b1e5c', r: 16, lw: 3 });
      const R = TT.RARITY[f.rarity];
      // figura
      ctx.save();
      D.rr(ctx, x + 10, y + 10, 140, 180, 12);
      ctx.clip();
      D.sunburst(ctx, x + 80, y + 110, 200, 12, U.shade(R.ring, -0.5), U.shade(R.ring, -0.35), TT.time * 0.2);
      if (own) {
        TT.art.drawFigure(ctx, f, x + 80, y + 172, 1.0, {
          t: TT.time, paint: TT.paintOf(id), yaw3d: this.yaw,
          anim3d: this.dance > 0 ? { name: 'cheer', t: 2.6 - this.dance } : null,
        });
      }
      else ctx.drawImage(TT.art.figureCanvas(id, 160, { silhouette: true }), x, y + 30, 160, 160);
      ctx.restore();
      const tx = x + 162;
      D.text(ctx, own ? f.name : '???', tx, y + 30, { size: 22, maxWidth: w - 172 });
      D.rarityStars(ctx, f.rarity, tx + 8, y + 56, 16);
      D.text(ctx, R.name, tx + 8 + R.stars * 17 + 4, y + 57, { size: 14, color: R.color, lw: 3 });
      D.typeIcon(ctx, f.type, tx + 12, y + 84, 11);
      D.text(ctx, TT.TYPES[f.type].name + ' · ' + (TT.TEAM_NAMES[f.team] || ''), tx + 30, y + 85, { size: 14, color: '#e8e2ff', lw: 3, maxWidth: w - 200 });
      const beats = TT.TYPES[f.type].beats;
      D.text(ctx, 'Erős: ' + TT.TYPES[beats].name + ' ellen', tx, y + 106, { size: 13, color: TT.TYPES[beats].color, lw: 3 });
      if (!own) {
        const lines = D.wrap(ctx, 'Még nincs meg ez a figura. Vegyél dobozt a Játékboltban, győzz le edzőket, vagy keresd a csillogó helyeket a városban!', w - 30, 15);
        lines.forEach((l, i) => D.text(ctx, l, x + 16, y + 216 + i * 20, { size: 15, color: '#c8b8f0', stroke: false }));
        return;
      }
      const lvl = own.lvl;
      const stars = TT.starsOf(id);
      const st = TT.statsFor(f, lvl, stars);
      for (let i = 0; i < TT.MAX_STARS; i++) {
        D.star(ctx, x + 22 + i * 15, y + 24, 6.5, 2.8, 5);
        ctx.fillStyle = i < stars ? '#ffd23f' : 'rgba(255,255,255,0.18)';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#120a2c';
        ctx.stroke();
      }
      D.text(ctx, 'Szint ' + lvl, tx, y + 130, { size: 18, color: '#ffd23f' });
      if (lvl < TT.MAX_LVL) {
        D.bar(ctx, tx + 70, y + 122, w - 242, 14, own.xp / TT.xpToNext(lvl), { color: '#c06bff' });
        D.text(ctx, own.xp + '/' + TT.xpToNext(lvl), tx + 70 + (w - 242) / 2, y + 130, { size: 11, align: 'center', lw: 2.5 });
      }
      const stats = [['HP', st.hp, '#4cd964'], ['Táma.', Math.round(st.atk * st.lf * 10), '#ff6b35'], ['Véd.', Math.round(st.def * st.lf * 10), '#3fa7ff'], ['Gyors.', f.spd * 10, '#ffd23f']];
      stats.forEach(([n, v, c], i) => {
        D.text(ctx, n, tx + (i % 2) * 96, y + 156 + Math.floor(i / 2) * 22, { size: 13, color: c, lw: 3 });
        D.text(ctx, String(v), tx + 48 + (i % 2) * 96, y + 156 + Math.floor(i / 2) * 22, { size: 14, lw: 3 });
      });
      // támadások
      const moves = f.moves.map((m) => TT.MOVES[m]).concat([TT.MOVES[f.sup]]);
      moves.forEach((m, i) => {
        const my = y + 234 + i * 42;
        const isSup = i === 3;
        D.panel(ctx, x + 12, my, w - 24, 38, { fill: isSup ? '#5a3a10' : '#3a2a7a', r: 10, lw: 2, shadow: false });
        D.text(ctx, (isSup ? '★ ' : '') + m.name, x + 22, my + 13, { size: 15, color: isSup ? '#ffd23f' : '#ffffff', lw: 3, maxWidth: 200 });
        if (!isSup) D.text(ctx, m.charge + ' mp', x + w - 22, my + 13, { size: 12, align: 'right', color: '#a89cd8', lw: 2.5 });
        D.text(ctx, m.desc || '', x + 22, my + 28, { size: 12, color: '#c8b8f0', lw: 2.5, maxWidth: w - 48 });
      });
      const pas = TT.PASSIVES[TT.passiveOf(f)];
      const pl = D.wrap(ctx, '• ' + pas.name + ': ' + pas.desc, w - 180, 12).slice(0, 2);
      pl.forEach((l, i) => D.text(ctx, l, x + 162, y + 196 + i * 13, { size: 12, color: '#ffe066', lw: 2.5 }));
      D.text(ctx, f.bio, x + 162, y + 198 + pl.length * 13 + 2, { size: 11, color: '#a89cd8', stroke: false, maxWidth: w - 176 });
    },
  };

  TT.register('collection', scene);
})(window.TT);
