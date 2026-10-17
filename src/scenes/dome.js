'use strict';
// Csatakupola / Mint Trezor: kupák, meccsek, Végtelen Aréna.
(function (TT) {
  const U = TT.U;
  const D = TT.D;

  function teamAvg() {
    const s = TT.save;
    return s.team.reduce((a, id) => a + (s.owned[id] ? s.owned[id].lvl : 1), 0) / s.team.length;
  }

  // Végtelen Aréna ellenfele
  function endlessEnemy(wave) {
    const rnd = U.rng(wave * 7919 + 13);
    const pool = TT.FIG_LIST.map((f) => f.id);
    const team = [];
    const lvl = Math.min(TT.MAX_LVL, 17 + wave);
    for (let i = 0; i < 3; i++) team.push({ id: pool[Math.floor(rnd() * pool.length)], lvl });
    const boss = wave % 5 === 0;
    if (boss) team[2] = { id: U.pick(['slade', 'trigon', 'mrmint', 'robin_ultra', 'cyborg_3000']), lvl: Math.min(TT.MAX_LVL, lvl + 2) };
    return {
      name: boss ? `Aréna Bajnok – ${wave}. hullám` : `Aréna – ${wave}. hullám`, who: TT.FIG[team[2].id].id,
      team, ai: Math.min(0.9, 0.55 + wave * 0.02), coins: 220 + wave * 30, bg: 'dome', music: boss ? 'boss' : 'battle',
    };
  }

  const scene = {
    enter(p) {
      this.p = p;
      this.venue = p.venue || 'dome';
      this.t = 0;
      this.menu = new TT.ui.Menu();
      const cups = this.cups();
      const firstOpen = cups.findIndex((c) => c.id !== 'endless' && this.unlocked(c) && !TT.cupDone(c.id));
      this.sel = p.sel != null ? p.sel : Math.max(0, firstOpen);
      TT.audio.music(this.venue === 'vault' ? 'hive' : 'shop');
      this.build();
      TT.checkAch();
      if (this.venue === 'vault' && !TT.save.flags.vaultIntro) {
        TT.save.flags.vaultIntro = true;
        setTimeout(() => TT.ui.say([
          { who: 'mrmint', text: 'Üdvözöllek a trezoromban. Nézz körül: minden polc bontatlan kincs.' },
          { who: 'mrmint', text: 'A Menta Kupa szabályai egyszerűek: ha nyersz, a figuráid szabadok. Ha veszítesz… dobozba kerülnek.' },
        ]), 300);
      }
    },

    cups() {
      if (this.venue === 'vault') return [TT.CUP.mint];
      const list = TT.CUPS.filter((c) => c.venue === 'dome');
      if (TT.cupDone('mint')) list.push({ id: 'endless', name: 'Végtelen Aréna', color: '#ff6b35', desc: 'Egyre erősebb csapatok, egyre nagyobb jutalmak. Minden 5. hullám egy bajnok!' });
      return list;
    },
    unlocked(c) {
      if (c.id === 'endless') return true;
      return !c.req || TT.cupDone(c.req);
    },

    build() {
      const cups = this.cups();
      const items = cups.map((c, i) => ({
        id: 'cup' + i, x: 20, y: 76 + i * 92, w: 300, h: 82, cup: c, i,
        onClick: () => {
          this.sel = i;
          this.build();
        },
        draw: (ctx, b, focus) => this.drawCupCard(ctx, b, focus),
      }));
      const c = cups[this.sel];
      const ok = c && this.unlocked(c) && (c.id === 'endless' || !TT.cupDone(c.id));
      items.push({ id: 'fight', x: 600, y: 456, w: 330, h: 64, label: c && TT.cupDone(c.id) && c.id !== 'endless' ? 'Megnyerve!' : 'HARC!', color: '#ff4f4f', size: 30, disabled: !ok,
        onDisabled: () => TT.ui.toast(c && TT.cupDone(c.id) ? 'Ezt a kupát már megnyerted!' : 'Ez a kupa még zárva van.', { color: '#ff8a80' }),
        onClick: () => this.fight(), glow: ok });
      items.push({ id: 'team', x: 350, y: 456, w: 230, h: 64, label: 'Csapat', color: '#3fa7ff', onClick: () => TT.go('collection', { from: 'dome', venue: this.venue, back: this.p.back, sel: this.sel }) });
      items.push({ id: 'back', x: 20, y: 470, w: 160, h: 52, label: 'Vissza', color: '#6c5ce7', sfx: 'back', onClick: () => TT.go('world', { pos: this.p.back, dir: 'down' }) });
      this.menu.set(items);
    },

    nextMatch(c) {
      const s = TT.save;
      if (c.id === 'endless') return { m: endlessEnemy((s.endless || 0) + 1), boss: (s.endless + 1) % 5 === 0, step: s.endless || 0 };
      const step = s.cupStep[c.id] || 0;
      if (step < c.matches.length) return { m: c.matches[step], boss: false, step };
      return { m: c.boss, boss: true, step };
    },

    fight() {
      const s = TT.save;
      const c = this.cups()[this.sel];
      const { m, boss } = this.nextMatch(c);
      const go = () => {
        const sel = this.sel;
        const venue = this.venue;
        const back = this.p.back;
        TT.go('battle', {
          enemy: Object.assign({ bg: venue === 'vault' ? 'vault' : 'dome' }, m),
          rewardFigs: [],
          after: (won) => {
            if (!won) {
              TT.go('dome', { venue, back, sel });
              return;
            }
            if (c.id === 'endless') {
              s.endless = (s.endless || 0) + 1;
              const extra = [];
              if (s.endless === 10 && !s.owned.trigon) extra.push('trigon');
              else if (s.endless % 5 === 0) extra.push(TT.rollBox(TT.BOXES[2]));
              TT.store.write();
              if (extra.length) {
                const info = TT.grantFigure(extra[0]);
                TT.store.write();
                TT.go('dome', { venue, back, sel });
                setTimeout(() => TT.ui.reveal(extra[0], info), 500);
              } else TT.go('dome', { venue, back, sel });
              return;
            }
            s.cupStep[c.id] = (s.cupStep[c.id] || 0) + 1;
            if (boss) {
              s.cups[c.id] = true;
              s.coins += c.reward.coins;
              let info = null;
              if (c.reward.fig) info = TT.grantFigure(c.reward.fig);
              TT.store.write();
              TT.go('world', { pos: back, dir: 'down', event: 'cup_' + c.id });
              setTimeout(() => {
                TT.ui.toast(`${c.name} megnyerve! +${c.reward.coins} érme`, { dur: 4 });
                if (c.reward.fig) TT.ui.reveal(c.reward.fig, info);
              }, 200);
            } else {
              TT.store.write();
              TT.go('dome', { venue, back, sel });
            }
          },
        });
      };
      if (teamAvg() < (c.minLvl || 1) - 1) {
        TT.ui.confirm(`A csapatod átlagszintje ${teamAvg().toFixed(1)}, az ajánlott ${c.minLvl}. Biztos belevágsz?`, (ok) => ok && go(), 'Harc!', 'Inkább edzek');
      } else go();
    },

    update(dt) {
      this.t += dt;
      if (TT.input.hit('back')) {
        TT.audio.sfx('back');
        TT.go('world', { pos: this.p.back, dir: 'down' });
        return;
      }
      const prev = this.sel;
      this.menu.update();
      const f = this.menu.items[this.menu.focus];
      if (f && f.cup && TT.input.lastDevice !== 'touch' && TT.input.lastDevice !== 'mouse' && f.i !== this.sel) {
        this.sel = f.i;
        this.build();
      }
      if (prev !== this.sel) this.build();
    },

    drawCupCard(ctx, b, focus) {
      const c = b.cup;
      const sel = b.i === this.sel;
      const unl = this.unlocked(c);
      const done = c.id !== 'endless' && TT.cupDone(c.id);
      D.panel(ctx, b.x + (sel ? 8 : 0), b.y, b.w, b.h, { fill: unl ? (sel ? U.shade(c.color, -0.25) : '#2b1e5c') : '#3a3450', r: 14, lw: 3, stroke: focus ? '#ffffff' : '#120a2c' });
      const x = b.x + (sel ? 8 : 0);
      // kupa ikon
      ctx.save();
      ctx.translate(x + 40, b.y + 42);
      ctx.beginPath();
      ctx.moveTo(-16, -20);
      ctx.lineTo(16, -20);
      ctx.quadraticCurveTo(16, 6, 0, 8);
      ctx.quadraticCurveTo(-16, 6, -16, -20);
      ctx.closePath();
      ctx.fillStyle = unl ? c.color : '#6a6480';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      ctx.fillRect(-3, 8, 6, 8);
      ctx.fillRect(-11, 15, 22, 6);
      ctx.strokeRect(-11, 15, 22, 6);
      ctx.restore();
      D.text(ctx, c.name, x + 72, b.y + 28, { size: 22 });
      if (!unl) D.text(ctx, 'Zárva', x + 72, b.y + 56, { size: 16, color: '#a89cd8' });
      else if (c.id === 'endless') D.text(ctx, `Legjobb: ${TT.save.endless || 0}. hullám`, x + 72, b.y + 56, { size: 16, color: '#ffe9a0' });
      else {
        const step = TT.save.cupStep[c.id] || 0;
        for (let i = 0; i < 4; i++) {
          const dx = x + 80 + i * 30, dy = b.y + 56;
          ctx.beginPath();
          if (i === 3) D.star(ctx, dx, dy, 10, 4.5, 5);
          else ctx.arc(dx, dy, 8, 0, Math.PI * 2);
          ctx.fillStyle = i < step || done ? '#7bff6b' : i === step ? '#ffd23f' : '#4a3a7a';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#1d1433';
          ctx.stroke();
        }
        if (done) D.text(ctx, 'KÉSZ', x + b.w - 20, b.y + 56, { size: 16, align: 'right', color: '#7bff6b' });
      }
    },

    draw(ctx) {
      TT.backdrop.draw(ctx, this.venue === 'vault' ? 'vault' : 'dome', TT.time);
      ctx.fillStyle = 'rgba(10,5,25,0.55)';
      ctx.fillRect(0, 0, TT.W, TT.H);
      D.text(ctx, this.venue === 'vault' ? 'MINT TREZOR' : 'CSATAKUPOLA', 24, 38, { size: 36, color: '#ffd23f' });
      D.panel(ctx, TT.W - 182, 12, 166, 40, { fill: '#2b1e5c', r: 12, lw: 2.5 });
      D.coin(ctx, TT.W - 160, 32, 12);
      D.text(ctx, U.fmt(TT.save.coins), TT.W - 140, 33, { size: 22, color: '#ffd23f' });

      const cups = this.cups();
      const c = cups[this.sel];
      // részletek
      const px = 350, py = 70, pw = 590, ph = 374;
      D.panel(ctx, px, py, pw, ph, { fill: '#2b1e5c', r: 18, lw: 3 });
      if (c) {
        D.text(ctx, c.name, px + 22, py + 34, { size: 30, color: c.color });
        const dl = D.wrap(ctx, c.desc || '', pw - 44, 16);
        dl.forEach((l, i) => D.text(ctx, l, px + 22, py + 64 + i * 20, { size: 16, color: '#e8e2ff', stroke: false }));
        if (!this.unlocked(c)) {
          D.text(ctx, 'Nyerd meg előbb: ' + TT.CUP[c.req].name, px + pw / 2, py + 200, { size: 22, align: 'center', color: '#ff8a80' });
        } else {
          const nm = this.nextMatch(c);
          const done = c.id !== 'endless' && TT.cupDone(c.id);
          const m = nm.m;
          if (done) {
            D.text(ctx, 'Megnyerted ezt a kupát!', px + pw / 2, py + 170, { size: 28, align: 'center', color: '#7bff6b' });
            TT.art.drawFigure(ctx, TT.FIG.robin, px + pw / 2, py + 330, 1.2, { pose: 'cheer' });
          } else {
            D.text(ctx, nm.boss ? 'FŐELLENSÉG' : c.id === 'endless' ? `${nm.step + 1}. hullám` : `${nm.step + 1}. meccs`, px + 22, py + 112, { size: 20, color: nm.boss ? '#ff4f4f' : '#ffd23f' });
            D.text(ctx, m.name, px + 22, py + 142, { size: 30 });
            // ellenfél csapata
            m.team.forEach((t, i) => {
              const fx = px + 90 + i * 150, fy = py + 330;
              ctx.save();
              ctx.globalAlpha = 0.9;
              TT.art.drawFigure(ctx, TT.FIG[t.id], fx, fy, 0.95, { facing: -1, t: TT.time + i });
              ctx.restore();
              D.text(ctx, TT.FIG[t.id].short, fx, fy + 22, { size: 15, align: 'center', maxWidth: 140 });
              D.text(ctx, 'Szint ' + t.lvl, fx, fy - 140, { size: 15, align: 'center', color: '#ffd23f' });
              D.typeIcon(ctx, TT.FIG[t.id].type, fx + 44, fy - 140, 10);
            });
            // ajánlott szint
            const avg = teamAvg();
            const rec = c.minLvl || Math.round(m.team.reduce((a, t) => a + t.lvl, 0) / 3);
            D.text(ctx, `Csapatod átlagszintje: ${avg.toFixed(1)}  ·  Ajánlott: ${rec}+`, px + pw - 22, py + 112, { size: 15, align: 'right', color: avg + 1 >= rec ? '#7bff6b' : '#ff8a80' });
          }
        }
      }
      // saját csapat kicsiben
      TT.save.team.forEach((id, i) => {
        ctx.drawImage(TT.art.figureCanvas(id, 96), 196 + i * 48, 466, 48, 48);
      });
      this.menu.draw(ctx);
    },
  };

  TT.register('dome', scene);
})(window.TT);
