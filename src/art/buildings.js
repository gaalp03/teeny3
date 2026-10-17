'use strict';
// Épületek és díszítő tárgyak procedurális rajza (gyorsítótárazott vásznakra).
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const B = {};
  const cache = new Map();
  const OUT = '#1d1433';

  function fs(g, fill, lw) {
    g.fillStyle = fill;
    g.fill();
    g.lineWidth = lw || 3;
    g.strokeStyle = OUT;
    g.stroke();
  }
  function box(g, x, y, w, h, fill, r, lw) {
    D.rr(g, x, y, w, h, r || 0);
    fs(g, fill, lw);
  }
  function windowPane(g, x, y, w, h, lit) {
    box(g, x, y, w, h, lit ? '#ffe9a0' : '#8fd3ff', 3, 2.5);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(x + 4, y + 4, 4, h - 8);
    g.strokeStyle = OUT;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + w / 2, y);
    g.lineTo(x + w / 2, y + h);
    g.moveTo(x, y + h / 2);
    g.lineTo(x + w, y + h / 2);
    g.stroke();
  }
  function sign(g, x, y, w, h, text, bg, fg, size) {
    box(g, x, y, w, h, bg, 8, 3);
    D.text(g, text, x + w / 2, y + h / 2 + 1, { size: size || 20, align: 'center', color: fg || '#fff' });
  }
  function awning(g, x, y, w, c1, c2, n) {
    n = n || Math.round(w / 24);
    const sw = w / n;
    for (let i = 0; i < n; i++) {
      g.beginPath();
      g.moveTo(x + i * sw, y);
      g.lineTo(x + (i + 1) * sw, y);
      g.lineTo(x + (i + 1) * sw, y + 22);
      g.arc(x + (i + 0.5) * sw, y + 22, sw / 2, 0, Math.PI);
      g.closePath();
      g.fillStyle = i % 2 ? c2 : c1;
      g.fill();
    }
    g.beginPath();
    g.rect(x, y, w, 22);
    g.lineWidth = 3;
    g.strokeStyle = OUT;
    g.stroke();
  }
  function door(g, x, y, w, h, color) {
    box(g, x, y, w, h, color || '#8b5a2b', 4, 3);
    g.fillStyle = 'rgba(143,211,255,0.8)';
    g.fillRect(x + 5, y + 6, w - 10, h * 0.4);
    g.beginPath();
    g.arc(x + w - 7, y + h * 0.6, 2.5, 0, Math.PI * 2);
    g.fillStyle = '#ffd23f';
    g.fill();
  }

  const PALETTE = [
    ['#ff9e7a', '#c0392b'], ['#ffd27a', '#8e44ad'], ['#9be7c4', '#2a6f97'], ['#b6a4ff', '#d35400'],
    ['#ffb4d8', '#5a4aa0'], ['#a8e6ff', '#c0392b'], ['#ffe9a0', '#16a085'], ['#f4f1ff', '#e67e22'],
  ];

  const DRAW = {
    house(g, W, H, b) {
      const [wall, roof] = PALETTE[b.seed % PALETTE.length];
      const wy = H - 96;
      box(g, 4, wy, W - 8, 92, wall, 4);
      g.fillStyle = 'rgba(0,0,0,0.08)';
      g.fillRect(6, wy + 70, W - 12, 20);
      // tető
      g.beginPath();
      g.moveTo(-2 + 4, wy + 4);
      g.lineTo(18, wy - 46);
      g.lineTo(W - 18, wy - 46);
      g.lineTo(W - 2 - 4, wy + 4);
      g.closePath();
      fs(g, roof);
      g.strokeStyle = U.shade(roof, -0.3);
      g.lineWidth = 1.5;
      for (let i = 1; i < 4; i++) {
        const yy = wy - 46 + i * 12.5;
        g.beginPath();
        g.moveTo(18 - i * 5, yy);
        g.lineTo(W - 18 + i * 5, yy);
        g.stroke();
      }
      box(g, W - 46, wy - 62, 16, 26, '#8d6b65', 2, 2.5);
      windowPane(g, 18, wy + 18, 30, 26, b.seed % 3 === 0);
      windowPane(g, W - 48, wy + 18, 30, 26, b.seed % 4 === 1);
      door(g, W / 2 - 13, wy + 50, 26, 42, U.shade(roof, -0.2));
    },
    shop(g, W, H) {
      const wy = H - 128;
      box(g, 4, wy, W - 8, 124, '#7ad3ff', 6);
      g.fillStyle = '#5ab8e8';
      g.fillRect(6, wy + 100, W - 12, 22);
      // kirakat figurákkal
      for (const [wx, id] of [[18, 'robin'], [W - 98, 'starfire']]) {
        box(g, wx, wy + 40, 80, 62, '#fff7d6', 4, 3);
        TT.art.drawFigure(g, TT.FIG[id], wx + 40, wy + 96, 0.48, { t: 0, sparkle: false });
        g.fillStyle = 'rgba(255,255,255,0.3)';
        g.fillRect(wx + 6, wy + 44, 8, 54);
      }
      awning(g, 6, wy + 14, W - 12, '#ff4f4f', '#ffffff');
      door(g, W / 2 - 18, wy + 58, 36, 64, '#ff6b35');
      // tábla
      box(g, W / 2 - 110, wy - 46, 220, 48, '#ffd23f', 12, 3);
      D.star(g, W / 2 - 92, wy - 22, 13, 6, 5);
      fs(g, '#ff6b35', 2);
      D.star(g, W / 2 + 92, wy - 22, 13, 6, 5);
      fs(g, '#ff6b35', 2);
      D.text(g, 'TEENY JÁTÉKBOLT', W / 2, wy - 21, { size: 21, align: 'center', color: '#fff', strokeColor: '#c0392b' });
    },
    comics(g, W, H) {
      const wy = H - 128;
      box(g, 4, wy, W - 8, 124, '#ffd23f', 6);
      g.fillStyle = '#e0b020';
      g.fillRect(6, wy + 100, W - 12, 22);
      box(g, 14, wy + 34, 60, 70, '#ffffff', 3, 3);
      D.star(g, 44, wy + 64, 26, 14, 10);
      fs(g, '#ff4f4f', 2);
      D.text(g, 'POW!', 44, wy + 65, { size: 15, align: 'center', color: '#fff' });
      box(g, W - 74, wy + 34, 60, 70, '#8fd3ff', 3, 3);
      D.text(g, 'ÚJ!', W - 44, wy + 52, { size: 16, align: 'center', color: '#ffd23f' });
      TT.art.drawFigure(g, TT.FIG.raven, W - 44, wy + 100, 0.34, { t: 0, pedestal: false });
      door(g, W / 2 - 16, wy + 58, 32, 64, '#3f6fd8');
      sign(g, 18, wy - 30, W - 36, 40, 'KÉPREGÉNY', '#3f6fd8', '#ffffff', 22);
    },
    pizza(g, W, H) {
      const wy = H - 128;
      box(g, 4, wy, W - 8, 124, '#f4f1ff', 6);
      g.fillStyle = '#c0392b';
      for (let j = 0; j < 3; j++) for (let i = 0; i < 10; i++) {
        D.rr(g, 8 + i * 22 + (j % 2) * 11, wy + 96 + j * 8, 18, 6, 1);
        g.fill();
      }
      windowPane(g, 16, wy + 40, 50, 40, true);
      windowPane(g, W - 66, wy + 40, 50, 40, true);
      awning(g, 6, wy + 12, W - 12, '#ff4f4f', '#ffffff', 10);
      door(g, W / 2 - 16, wy + 58, 32, 64, '#2e8b3a');
      box(g, W / 2 - 75, wy - 40, 150, 46, '#2e8b3a', 12, 3);
      // szelet
      g.beginPath();
      g.moveTo(W / 2 - 58, wy - 30);
      g.lineTo(W / 2 - 30, wy - 30);
      g.lineTo(W / 2 - 44, wy - 4);
      g.closePath();
      fs(g, '#ffd23f', 2);
      for (const [px, py] of [[-48, -24], [-38, -22], [-44, -14]]) {
        g.beginPath();
        g.arc(W / 2 + px, wy + py, 2.8, 0, Math.PI * 2);
        g.fillStyle = '#c0392b';
        g.fill();
      }
      D.text(g, 'PIZZA', W / 2 + 16, wy - 17, { size: 26, align: 'center', color: '#fff' });
    },
    dome(g, W, H) {
      const by = H - 224;
      // kupola
      g.beginPath();
      g.ellipse(W / 2, by + 30, W / 2 - 20, 150, 0, Math.PI, 0);
      g.closePath();
      const gr = g.createLinearGradient(0, by - 120, 0, by + 30);
      gr.addColorStop(0, '#b26bff');
      gr.addColorStop(1, '#6c3fc8');
      g.fillStyle = gr;
      g.fill();
      g.save();
      g.clip();
      g.strokeStyle = 'rgba(255,255,255,0.25)';
      g.lineWidth = 10;
      for (let i = -6; i <= 6; i++) {
        g.beginPath();
        g.ellipse(W / 2, by + 30, Math.abs(i) * 34, 150, 0, Math.PI, 0);
        g.stroke();
      }
      g.restore();
      g.beginPath();
      g.ellipse(W / 2, by + 30, W / 2 - 20, 150, 0, Math.PI, 0);
      g.lineWidth = 4;
      g.strokeStyle = OUT;
      g.stroke();
      // zászlók
      for (const fx of [W / 2 - 120, W / 2, W / 2 + 120]) {
        const fy = fx === W / 2 ? by - 140 : by - 104;
        g.fillStyle = OUT;
        g.fillRect(fx - 2, fy - 36, 4, 40);
        g.beginPath();
        g.moveTo(fx + 2, fy - 36);
        g.lineTo(fx + 30, fy - 28);
        g.lineTo(fx + 2, fy - 20);
        g.closePath();
        fs(g, fx === W / 2 ? '#ffd23f' : '#ff4f4f', 2);
      }
      // alap
      box(g, 8, by + 24, W - 16, 196, '#ff8c42', 10, 4);
      g.fillStyle = '#e06a20';
      g.fillRect(10, by + 160, W - 20, 58);
      for (let i = 0; i < 7; i++) {
        if (i === 3) continue;
        windowPane(g, 26 + i * 60, by + 74, 36, 50, true);
      }
      // bejárat
      g.beginPath();
      g.moveTo(W / 2 - 56, H - 2);
      g.lineTo(W / 2 - 56, by + 120);
      g.arc(W / 2, by + 120, 56, Math.PI, 0);
      g.lineTo(W / 2 + 56, H - 2);
      g.closePath();
      fs(g, '#2b1e5c', 4);
      g.fillStyle = 'rgba(255,210,63,0.25)';
      g.fillRect(W / 2 - 50, by + 150, 100, 70);
      // felirat
      box(g, W / 2 - 150, by + 30, 300, 40, '#2b1e5c', 10, 3);
      for (let i = 0; i < 14; i++) {
        g.beginPath();
        g.arc(W / 2 - 140 + i * 21.5, by + 36, 2.5, 0, Math.PI * 2);
        g.fillStyle = '#ffe066';
        g.fill();
      }
      D.text(g, 'CSATAKUPOLA', W / 2, by + 54, { size: 24, align: 'center', color: '#ffd23f' });
    },
    tower(g, W, H) {
      // Titánok Tornya — T alakú
      const cx = W / 2;
      const stemW = 104, barW = 236, barH = 72;
      const stemTop = H - 272 + barH;
      const glass = (x, y, w, h) => {
        const gr = g.createLinearGradient(x, y, x + w, y + h);
        gr.addColorStop(0, '#9be7ff');
        gr.addColorStop(1, '#3f8fd8');
        g.fillStyle = gr;
        g.fillRect(x, y, w, h);
      };
      // szár
      box(g, cx - stemW / 2, stemTop, stemW, H - stemTop - 2, '#e8e8f4', 6, 4);
      glass(cx - stemW / 2 + 10, stemTop + 10, stemW - 20, H - stemTop - 70);
      g.strokeStyle = 'rgba(255,255,255,0.6)';
      g.lineWidth = 2;
      for (let y = stemTop + 30; y < H - 70; y += 26) {
        g.beginPath();
        g.moveTo(cx - stemW / 2 + 10, y);
        g.lineTo(cx + stemW / 2 - 10, y);
        g.stroke();
      }
      g.strokeStyle = OUT;
      g.lineWidth = 3;
      g.strokeRect(cx - stemW / 2 + 10, stemTop + 10, stemW - 20, H - stemTop - 70);
      // kereszt-rúd
      const by = H - 272;
      box(g, cx - barW / 2, by, barW, barH, '#e8e8f4', 8, 4);
      glass(cx - barW / 2 + 10, by + 12, barW - 20, barH - 26);
      g.strokeStyle = 'rgba(255,255,255,0.6)';
      g.lineWidth = 2;
      for (let x = cx - barW / 2 + 30; x < cx + barW / 2 - 10; x += 22) {
        g.beginPath();
        g.moveTo(x, by + 12);
        g.lineTo(x, by + barH - 14);
        g.stroke();
      }
      g.strokeStyle = OUT;
      g.lineWidth = 3;
      g.strokeRect(cx - barW / 2 + 10, by + 12, barW - 20, barH - 26);
      // antenna
      g.fillStyle = OUT;
      g.fillRect(cx + 80, by - 34, 4, 36);
      g.beginPath();
      g.arc(cx + 82, by - 36, 5, 0, Math.PI * 2);
      g.fillStyle = '#ff4f4f';
      g.fill();
      // bejárat
      door(g, cx - 22, H - 58, 44, 56, '#5a4aa0');
      box(g, cx - 34, H - 74, 68, 18, '#2b1e5c', 4, 2.5);
      D.text(g, 'T', cx, H - 64, { size: 16, align: 'center', color: '#ffd23f' });
    },
    factory(g, W, H) {
      const wy = H - 96;
      // fűrészfog tető
      g.beginPath();
      g.moveTo(4, wy);
      for (let i = 0; i < 4; i++) {
        const x0 = 4 + i * ((W - 8) / 4);
        g.lineTo(x0, wy - 30);
        g.lineTo(x0 + (W - 8) / 4, wy);
      }
      g.closePath();
      fs(g, '#5a6470');
      g.fillStyle = '#9be7ff';
      for (let i = 0; i < 4; i++) {
        const x0 = 4 + i * ((W - 8) / 4);
        g.beginPath();
        g.moveTo(x0 + 3, wy - 25);
        g.lineTo(x0 + 3, wy - 3);
        g.lineTo(x0 + 20, wy - 3);
        g.closePath();
        g.fill();
      }
      // kémény
      box(g, W - 46, wy - 70, 20, 44, '#8d99a6', 2, 2.5);
      g.fillStyle = '#e84545';
      g.fillRect(W - 46, wy - 62, 20, 6);
      box(g, 4, wy, W - 8, 92, '#9aa5b1', 4);
      g.fillStyle = '#7fe0b5';
      g.fillRect(6, wy + 70, W - 12, 20);
      // garázskapu
      box(g, W / 2 - 34, wy + 30, 68, 62, '#5a6470', 3, 3);
      g.strokeStyle = '#3a4048';
      g.lineWidth = 2;
      for (let i = 1; i < 6; i++) {
        g.beginPath();
        g.moveTo(W / 2 - 32, wy + 30 + i * 10);
        g.lineTo(W / 2 + 32, wy + 30 + i * 10);
        g.stroke();
      }
      windowPane(g, 16, wy + 30, 40, 30, false);
      windowPane(g, W - 56, wy + 30, 40, 30, false);
      sign(g, W / 2 - 80, wy + 4, 160, 24, 'MENTA GYÁR', '#2a9d8f', '#ffffff', 16);
    },
    hive(g, W, H) {
      const wy = H - 128;
      g.beginPath();
      g.moveTo(20, wy - 30);
      g.lineTo(W - 20, wy - 30);
      g.lineTo(W - 4, wy + 30);
      g.lineTo(W - 4, H - 2);
      g.lineTo(4, H - 2);
      g.lineTo(4, wy + 30);
      g.closePath();
      fs(g, '#2a2540', 4);
      g.strokeStyle = '#ffd23f';
      g.lineWidth = 2;
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
        const cx = 26 + i * 30 + (j % 2) * 15, cy = wy - 4 + j * 24;
        if (cx > W - 20) continue;
        g.beginPath();
        for (let k = 0; k <= 6; k++) {
          const a = (k * Math.PI) / 3 + Math.PI / 6;
          const px = cx + Math.cos(a) * 11, py = cy + Math.sin(a) * 11;
          if (k === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.globalAlpha = 0.5;
        g.stroke();
        g.globalAlpha = 1;
      }
      door(g, W / 2 - 18, H - 66, 36, 64, '#ffd23f');
      sign(g, W / 2 - 70, wy - 64, 140, 40, 'H.I.V.E.', '#ffd23f', '#2a2540', 24);
    },
    vault(g, W, H) {
      const wy = H - 128;
      // oromzat
      g.beginPath();
      g.moveTo(0, wy + 2);
      g.lineTo(W / 2, wy - 58);
      g.lineTo(W, wy + 2);
      g.closePath();
      fs(g, '#bff0dc', 4);
      D.text(g, 'MINT', W / 2, wy - 18, { size: 24, align: 'center', color: '#2a9d8f' });
      box(g, 8, wy, W - 16, 124, '#d8f7ea', 4, 4);
      for (let i = 0; i < 6; i++) {
        if (i === 2 || i === 3) continue;
        const x = 22 + i * ((W - 60) / 5);
        box(g, x, wy + 10, 18, 110, '#ffffff', 3, 2.5);
      }
      // trezorajtó
      g.beginPath();
      g.arc(W / 2, wy + 70, 46, 0, Math.PI * 2);
      fs(g, '#9aa5b1', 4);
      g.beginPath();
      g.arc(W / 2, wy + 70, 34, 0, Math.PI * 2);
      fs(g, '#c3ccd6', 3);
      g.strokeStyle = OUT;
      g.lineWidth = 4;
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3;
        g.beginPath();
        g.moveTo(W / 2 + Math.cos(a) * 24, wy + 70 + Math.sin(a) * 24);
        g.lineTo(W / 2 - Math.cos(a) * 24, wy + 70 - Math.sin(a) * 24);
        g.stroke();
      }
      g.beginPath();
      g.arc(W / 2, wy + 70, 8, 0, Math.PI * 2);
      fs(g, '#7fe0b5', 3);
    },
  };

  const EXTRA_TOP = { house: 66, shop: 52, comics: 36, pizza: 46, dome: 150, tower: 180, hive: 70, vault: 62, factory: 80 };
  const EXTRA_SIDE = { tower: 50 };

  B.sprite = function (b) {
    let c = cache.get(b.id);
    if (c) return c;
    const TS = TT.WORLD.TS;
    const side = EXTRA_SIDE[b.kind] || 0;
    const W = b.w * TS + side * 2;
    const H = b.h * TS + (EXTRA_TOP[b.kind] || 40);
    c = TT.makeCanvas(W, H);
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    if (b.kind === 'tower') {
      g.translate(0, 0);
      DRAW.tower(g, W, H);
    } else {
      DRAW[b.kind](g, W, H, b);
    }
    c.side = side;
    cache.set(b.id, c);
    return c;
  };

  // ---------- Díszítő tárgyak (élőben rajzolva) ----------
  B.drawProp = function (ctx, p, x, y, t) {
    switch (p.kind) {
      case 'fountain': {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x + 48, y + 44, 50, 22, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#c3ccd6';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + 48, y + 42, 40, 15, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#4fb8f0';
        ctx.fill();
        D.rr(ctx, x + 42, y + 8, 12, 34, 4);
        ctx.fillStyle = '#c3ccd6';
        ctx.fill();
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const k = (t * 1.5 + i / 6) % 1;
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(x + 48 + Math.cos(a) * 26 * k, y + 8 - Math.sin(k * Math.PI) * 18 + k * 30, 3 * (1 - k * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(200,240,255,0.9)';
          ctx.fill();
        }
        ctx.restore();
        break;
      }
      case 'statue':
        ctx.save();
        D.rr(ctx, x - 6, y - 4, 44, 18, 4);
        ctx.fillStyle = '#9aa5b1';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        TT.art.drawFigure(ctx, TT.FIG.robin_ultra, x + 16, y - 2, 0.55, { pedestal: false, t: 0, sparkle: true });
        ctx.restore();
        break;
      case 'bench':
        ctx.save();
        ctx.fillStyle = OUT;
        ctx.fillRect(x + 6, y + 14, 4, 12);
        ctx.fillRect(x + 54, y + 14, 4, 12);
        D.rr(ctx, x + 2, y + 2, 60, 10, 3);
        ctx.fillStyle = '#b0763a';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        D.rr(ctx, x + 2, y + 12, 60, 6, 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        break;
      case 'lamp':
        ctx.save();
        ctx.fillStyle = '#3a3a52';
        ctx.fillRect(x + 14, y - 40, 4, 56);
        ctx.beginPath();
        ctx.arc(x + 16, y - 44, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe9a0';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.restore();
        break;
      case 'umbrella': {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 15, y - 30, 3, 44);
        ctx.beginPath();
        ctx.arc(x + 16, y - 28, 26, Math.PI, 0);
        ctx.closePath();
        ctx.fillStyle = '#ff6b8a';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x + 16, y - 54);
          ctx.arc(x + 16, y - 28, 26, Math.PI + i * 1.05 + 0.2, Math.PI + i * 1.05 + 0.55);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        break;
      }
      case 'sign':
        ctx.save();
        ctx.fillStyle = '#6b3f1d';
        ctx.fillRect(x + 14, y - 10, 4, 26);
        D.panel(ctx, x - 34, y - 34, 100, 26, { fill: '#b0763a', r: 5, lw: 2.5, shadow: false });
        D.text(ctx, p.text, x + 16, y - 21, { size: 13, align: 'center', color: '#fff8e0' });
        ctx.restore();
        break;
      case 'crate':
        ctx.save();
        D.rr(ctx, x + 2, y - 4, 28, 28, 2);
        ctx.fillStyle = '#b0763a';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, y - 2);
        ctx.lineTo(x + 28, y + 22);
        ctx.moveTo(x + 28, y - 2);
        ctx.lineTo(x + 4, y + 22);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        break;
      case 'hydrant':
        ctx.save();
        D.rr(ctx, x + 9, y - 8, 14, 24, 5);
        ctx.fillStyle = '#e84545';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.fillRect(x + 5, y, 22, 5);
        ctx.strokeRect(x + 5, y, 22, 5);
        ctx.restore();
        break;
      default:
        break;
    }
  };

  // Útzár szalag
  B.drawGate = function (ctx, g, x, y, w, h, t) {
    ctx.save();
    const vertical = h > w;
    const len = vertical ? h : w;
    for (const k of [0, 1]) {
      const px = vertical ? x + 4 + k * (w - 8) : x + k * (len - 8);
      const py = vertical ? y + k * (len - 8) : y + 4;
      void px; void py;
    }
    // bakok
    const posts = vertical ? [[x + w / 2, y + 4], [x + w / 2, y + h - 4]] : [[x + 6, y + h / 2], [x + w - 6, y + h / 2]];
    for (const [px, py] of posts) {
      ctx.fillStyle = '#3a3a52';
      ctx.fillRect(px - 3, py - 22, 6, 26);
      ctx.beginPath();
      ctx.arc(px, py - 24, 5, 0, Math.PI * 2);
      ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ff4f4f' : '#ffb000';
      ctx.fill();
    }
    // csíkos szalag
    ctx.save();
    ctx.translate(posts[0][0], posts[0][1] - 12);
    const dx = posts[1][0] - posts[0][0], dy = posts[1][1] - posts[0][1];
    ctx.rotate(Math.atan2(dy, dx));
    const L = Math.hypot(dx, dy);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(0, -6, L, 12);
    ctx.fillStyle = '#1d1d2b';
    for (let i = 0; i < L; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, -6);
      ctx.lineTo(i + 8, -6);
      ctx.lineTo(Math.min(L, i + 2), 6);
      ctx.lineTo(Math.max(0, i - 6), 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -6, L, 12);
    ctx.restore();
    ctx.restore();
    void g;
  };

  B.clear = () => cache.clear();
  TT.buildings = B;
})(window.TT);
