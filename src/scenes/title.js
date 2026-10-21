'use strict';
// Címképernyő.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const LINEUP = ['beastboy', 'raven', 'robin', 'starfire', 'cyborg'];

  const scene = {
    enter() {
      this.t = 0;
      this.menu = new TT.ui.Menu();
      this.hasSave = TT.store.load();
      TT.audio.music('title');
      this.build();
    },

    build() {
      const items = [];
      const bw = 300, bx = TT.W / 2 - bw / 2;
      let y = 300;
      if (this.hasSave) {
        items.push({ id: 'cont', x: bx, y, w: bw, h: 54, label: 'Folytatás', color: '#2ecc71', onClick: () => this.cont() });
        y += 64;
      }
      items.push({ id: 'new', x: bx, y, w: bw, h: 54, label: 'Új játék', color: '#ff6b35', onClick: () => this.newGame() });
      y += 64;
      items.push({ id: 'set', x: bx, y, w: 145, h: 46, label: 'Beállítások', size: 17, color: '#6c5ce7', onClick: () => TT.openSettings() });
      items.push({ id: 'imp', x: bx + 155, y, w: 145, h: 46, label: 'Mentés betöltése', size: 15, color: '#6c5ce7', onClick: () => this.importSave() });
      items.push({ id: 'news', x: TT.W - 176, y: 16, w: 160, h: 44, label: 'Újdonságok', size: 17, color: '#ff4fa3', onClick: () => TT.showNews() });
      this.menu.set(items);
    },

    cont() {
      TT.store.load();
      TT.go('world', {});
      // visszatérés Jump Citybe: egy Titán köszönti a várost (TT2-szinkron)
      setTimeout(() => TT.audio.voiceFrom(U.shuffle(TT.save.team.slice()), 'jumpcity', 1), 900);
    },

    newGame() {
      const start = () => {
        TT.store.newGame();
        // új játékosnak nem kell az „újdonságok” összefoglaló
        TT.settings.newsSeen = TT.NEWS_VERSION;
        TT.store.writeSettings();
        TT.go('world', { event: 'newgame', pos: TT.WORLD.start, dir: 'down' });
      };
      if (this.hasSave) TT.ui.confirm('Biztosan új játékot kezdesz? A régi mentés elvész!', (ok) => ok && start(), 'Új játék', 'Mégse');
      else start();
    },

    importSave() {
      const code = window.prompt('Illeszd be a mentéskódot:');
      if (!code) return;
      if (TT.store.importString(code)) {
        TT.ui.toast('Mentés betöltve!');
        this.hasSave = true;
        this.build();
      } else TT.ui.toast('Hibás mentéskód', { color: '#ff8a80' });
    },

    update(dt) {
      this.t += dt;
      this.menu.update();
      // az első érintés után egy Titán bekiáltja a címet (amíg be nem töltődik a hang, újrapróbálja)
      if (!this.shout && TT.audio.unlocked && this.t < 8) {
        this.shout = TT.audio.voiceFrom(U.shuffle(['robin', 'raven', 'starfire', 'beastboy', 'cyborg']), 'title', 1);
      }
    },

    draw(ctx) {
      const t = TT.time;
      D.sunburst(ctx, TT.W / 2, 160, 900, 18, '#2b1e5c', '#33246e', t * 0.08);
      const g = ctx.createRadialGradient(TT.W / 2, 160, 50, TT.W / 2, 200, 640);
      g.addColorStop(0, 'rgba(255,107,53,0.25)');
      g.addColorStop(1, 'rgba(13,8,32,0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, TT.W, TT.H);

      // figura sor
      LINEUP.forEach((id, i) => {
        const x = TT.W / 2 + (i - 2) * 170;
        const y = 268 + Math.abs(i - 2) * -10 + (i === 2 ? 4 : 0);
        const k = U.ease.outBack(U.clamp((this.t - 0.15 * i) / 0.6, 0, 1));
        if (k <= 0) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(k, k);
        TT.art.drawFigure(ctx, TT.FIG[id], 0, 0, i === 2 ? 1.3 : 1.05, { t: t + i, pose: Math.sin(t * 0.8 + i) > 0.85 ? 'cheer' : 'idle', facing: i < 2 ? 1 : i > 2 ? -1 : 1 });
        ctx.restore();
      });
      // a figurák mögé rajzolt gombok elé sötét sáv
      const pulse = 1 + Math.sin(t * 2.4) * 0.02;
      ctx.save();
      ctx.translate(TT.W / 2, 74);
      ctx.scale(pulse, pulse);
      ctx.rotate(-0.025);
      D.text(ctx, 'TEENY TITANS', 0, 0, { size: 78, align: 'center', color: '#ffd23f', lw: 14, shadow: '#c0392b' });
      ctx.restore();
      ctx.save();
      ctx.translate(TT.W / 2 + 250, 108);
      ctx.rotate(0.12 + Math.sin(t * 3) * 0.04);
      D.star(ctx, 0, 0, 52, 30, 8);
      ctx.fillStyle = '#ff4f4f';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#120a2c';
      ctx.stroke();
      D.text(ctx, '3', 0, 4, { size: 64, align: 'center', color: '#ffffff', lw: 10 });
      ctx.restore();
      D.text(ctx, 'A Világliga — rajongói kiadás', TT.W / 2, 132, { size: 22, align: 'center', color: '#ff9ecd' });
      const ev = TT.activeEvent();
      if (ev) {
        const p = 1 + Math.sin(t * 4) * 0.04;
        ctx.save();
        ctx.translate(812, 372);
        ctx.rotate(0.1);
        ctx.scale(p, p);
        D.panel(ctx, -90, -22, 180, 44, { fill: ev.color, r: 14, lw: 3 });
        D.text(ctx, ev.name + ' esemény!', 0, 1, { size: 20, align: 'center' });
        ctx.restore();
      }
      this.menu.draw(ctx);
      D.text(ctx, 'Nem hivatalos rajongói játék. A Teen Titans Go! a Warner Bros. / Cartoon Network védjegye.', TT.W / 2, TT.H - 14, { size: 12, align: 'center', color: '#8a80b8', stroke: false });
      if (TT.custom.count) D.text(ctx, `Saját textúrák betöltve: ${TT.custom.count}`, 12, TT.H - 14, { size: 12, color: '#7bff6b', stroke: false });
    },
  };

  TT.register('title', scene);
})(window.TT);
