'use strict';
// Stáblista a Menta Kupa után.
(function (TT) {
  const D = TT.D;
  const LINES = [
    ['GRATULÁLUNK!', 48, '#ffd23f'],
    ['A Teeny Titans 3 Világliga bajnokai vagytok!', 24, '#ffffff'],
    ['', 20],
    ['Mr. Mint gyűjteménye kibontva.', 22, '#7fe0b5'],
    ['A figurák újra szabadok — és játszhatók.', 22, '#7fe0b5'],
    ['', 20],
    ['TEENY TITANS 3', 36, '#ff9ecd'],
    ['rajongói kiadás', 20, '#ff9ecd'],
    ['', 20],
    ['Minden figura, pálya, zene és hang kódból készült.', 18, '#c8b8f0'],
    ['Saját textúrákat a Gyűjteményben adhatsz meg.', 18, '#c8b8f0'],
    ['', 20],
    ['Utójáték: Végtelen Aréna a Csatakupolában', 22, '#ffffff'],
    ['Gyűjtsd össze mind a ' + TT.FIG_LIST.length + ' figurát!', 22, '#ffffff'],
    ['', 20],
    ['Titánok… HARCRA FEL!', 34, '#ffd23f'],
  ];

  const scene = {
    enter() {
      this.t = 0;
      this.leaving = false;
      TT.audio.music('credits');
      this.parade = TT.FIG_LIST.map((f) => f.id);
    },
    update(dt) {
      this.t += dt;
      if (this.t > 2 && (TT.input.hit('ok') || TT.input.hit('back') || TT.input.anyTap())) this.done();
      if (this.t > 34) this.done();
    },
    done() {
      if (this.leaving) return;
      this.leaving = true;
      TT.go('world', { dir: 'down' });
    },
    draw(ctx) {
      D.sunburst(ctx, TT.W / 2, TT.H / 2, 800, 20, '#1b1140', '#241858', TT.time * 0.05);
      // figura parádé
      const n = this.parade.length;
      for (let i = 0; i < n; i++) {
        const x = ((i * 110 - this.t * 70) % (n * 110) + n * 110) % (n * 110) - 60;
        if (x < -80 || x > TT.W + 80) continue;
        TT.art.drawFigure(ctx, TT.FIG[this.parade[i]], x, TT.H - 30, 0.75, { pose: 'walk', walk: TT.time * 10 + i, facing: -1, t: TT.time + i });
      }
      let y = 330 - this.t * 36;
      for (const [txt, size, color] of LINES) {
        const a = Math.min(1, (TT.H - 120 - y) / 40, (y + 20) / 40);
        if (txt && a > 0) D.text(ctx, txt, TT.W / 2, y, { size, align: 'center', color, alpha: a });
        y += size + 22;
      }
      D.text(ctx, 'Koppints a folytatáshoz', TT.W - 16, 20, { size: 14, align: 'right', color: '#8a80b8', stroke: false });
    },
  };

  TT.register('credits', scene);
})(window.TT);
