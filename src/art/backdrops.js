'use strict';
// Csatahátterek: statikus réteg gyorsítótárban + élő animáció (közönség, fények).
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const BD = {};
  const cache = {};
  const W = 960, H = 540;

  function sky(g, c1, c2, c3) {
    const gr = g.createLinearGradient(0, 0, 0, H * 0.7);
    gr.addColorStop(0, c1);
    gr.addColorStop(0.6, c2);
    gr.addColorStop(1, c3 || c2);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  function skyline(g, y, color, seed, hmin, hmax, windows) {
    const rnd = U.rng(seed);
    let x = -10;
    while (x < W + 20) {
      const w = 40 + rnd() * 70, h = hmin + rnd() * (hmax - hmin);
      g.fillStyle = color;
      g.fillRect(x, y - h, w, h + 200);
      if (windows) {
        g.fillStyle = windows;
        for (let wy = y - h + 10; wy < y - 10; wy += 16) for (let wx = x + 8; wx < x + w - 10; wx += 14) {
          if (rnd() < 0.55) g.fillRect(wx, wy, 6, 8);
        }
      }
      x += w + 4 + rnd() * 10;
    }
  }
  function stage(g, c1, c2, ring) {
    g.save();
    g.beginPath();
    g.ellipse(W / 2, 405, 430, 78, 0, 0, Math.PI * 2);
    const gr = g.createRadialGradient(W / 2, 390, 30, W / 2, 405, 430);
    gr.addColorStop(0, c1);
    gr.addColorStop(1, c2);
    g.fillStyle = gr;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = '#1d1433';
    g.stroke();
    if (ring) {
      g.beginPath();
      g.ellipse(W / 2, 405, 380, 62, 0, 0, Math.PI * 2);
      g.lineWidth = 4;
      g.strokeStyle = ring;
      g.stroke();
      g.beginPath();
      g.ellipse(W / 2, 405, 70, 14, 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
  }

  const STATIC = {
    dome(g) {
      sky(g, '#1b1140', '#3a2075', '#4a2a8a');
      // lelátók
      for (let r = 0; r < 5; r++) {
        g.fillStyle = r % 2 ? '#2b1e5c' : '#33246a';
        g.fillRect(0, 120 + r * 44, W, 44);
      }
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(0, 330, W, 30);
      // kivetítő
      D.panel(g, W / 2 - 130, 58, 260, 66, { fill: '#120a2c', stroke: '#ffd23f', lw: 4, r: 10 });
      D.text(g, 'TEENY TITANS 3', W / 2, 82, { size: 26, align: 'center', color: '#ffd23f' });
      D.text(g, 'VILÁGLIGA', W / 2, 108, { size: 15, align: 'center', color: '#ff8cd8' });
      g.fillStyle = '#120a2c';
      g.fillRect(0, 352, W, H - 352);
      stage(g, '#5a3fa8', '#2b1e5c', '#ffd23f');
    },
    tower(g) {
      sky(g, '#ff9e7a', '#ffd27a', '#ffe9b8');
      // hatalmas ablak
      g.fillStyle = '#e8e8f4';
      g.fillRect(0, 0, W, 60);
      skyline(g, 330, '#7a5aa8', 12, 60, 180, 'rgba(255,233,160,0.6)');
      g.fillStyle = '#4f8fd8';
      g.fillRect(0, 300, W, 60);
      g.fillStyle = '#d8d4ee';
      for (let i = 0; i <= 6; i++) g.fillRect(i * 160 - 6, 0, 12, 360);
      g.fillRect(0, 50, W, 12);
      // kanapé
      D.rr(g, W / 2 - 220, 290, 440, 70, 20);
      g.fillStyle = '#5a4aa0';
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = '#1d1433';
      g.stroke();
      g.fillStyle = '#7a5aa8';
      g.fillRect(0, 352, W, H - 352);
      stage(g, '#9a7ad8', '#5a4aa0', '#ffd23f');
    },
    park(g) {
      sky(g, '#6ec6ff', '#bfe8ff', '#e8f8ff');
      g.fillStyle = '#7fd36f';
      g.beginPath();
      g.moveTo(0, 300);
      for (let x = 0; x <= W; x += 40) g.lineTo(x, 270 + Math.sin(x * 0.01) * 30);
      g.lineTo(W, H);
      g.lineTo(0, H);
      g.fill();
      const tr = TT.tiles.tree(0), tr2 = TT.tiles.tree(1);
      for (let i = 0; i < 9; i++) g.drawImage(i % 2 ? tr : tr2, i * 112 - 10, 210 + (i % 3) * 14, 90, 118);
      g.fillStyle = '#5cbf56';
      g.fillRect(0, 352, W, H - 352);
      stage(g, '#8ee07c', '#4aa846', '#ffffff');
    },
    street(g) {
      sky(g, '#7ad3ff', '#d8f4ff');
      skyline(g, 330, '#9a9ac8', 4, 120, 260, 'rgba(255,255,255,0.35)');
      skyline(g, 350, '#6c6aa8', 9, 60, 160, 'rgba(255,233,160,0.5)');
      g.fillStyle = '#cfc8dc';
      g.fillRect(0, 340, W, 30);
      g.fillStyle = '#4b4a5e';
      g.fillRect(0, 360, W, H - 360);
      stage(g, '#cfc8dc', '#8f87a3', '#ffd23f');
    },
    beach(g) {
      sky(g, '#ffb3a7', '#ffe0b0', '#fff3d6');
      g.beginPath();
      g.arc(760, 220, 60, 0, Math.PI * 2);
      g.fillStyle = '#ffd23f';
      g.fill();
      g.fillStyle = '#3f9be8';
      g.fillRect(0, 250, W, 110);
      g.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 12; i++) g.fillRect(40 + i * 80, 270 + (i % 3) * 22, 40, 3);
      g.fillStyle = '#f2d98d';
      g.fillRect(0, 340, W, H - 340);
      stage(g, '#ffe9b0', '#e3c473', '#ff8c42');
    },
    hive(g) {
      sky(g, '#120a20', '#2a2540');
      g.strokeStyle = 'rgba(255,210,63,0.18)';
      g.lineWidth = 3;
      for (let j = 0; j < 9; j++) for (let i = 0; i < 18; i++) {
        const cx = i * 58 + (j % 2) * 29, cy = j * 46;
        g.beginPath();
        for (let k = 0; k <= 6; k++) {
          const a = (k * Math.PI) / 3 + Math.PI / 6;
          const px = cx + Math.cos(a) * 28, py = cy + Math.sin(a) * 28;
          if (k === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.stroke();
      }
      D.panel(g, W / 2 - 100, 62, 200, 52, { fill: '#ffd23f', r: 10, lw: 4 });
      D.text(g, 'H.I.V.E.', W / 2, 89, { size: 30, align: 'center', color: '#2a2540', strokeColor: '#ffd23f' });
      g.fillStyle = '#1b1530';
      g.fillRect(0, 352, W, H - 352);
      stage(g, '#4a4060', '#241c38', '#ffd23f');
    },
    vault(g) {
      sky(g, '#0f3a34', '#1f6f5f');
      // polcok bontatlan figurákkal
      const rnd = U.rng(5);
      for (let r = 0; r < 4; r++) {
        g.fillStyle = '#a07a40';
        g.fillRect(0, 70 + r * 72, W, 8);
        for (let i = 0; i < 22; i++) {
          const x = 10 + i * 44, y = 22 + r * 72;
          D.rr(g, x, y, 34, 46, 4);
          g.fillStyle = ['#7fe0b5', '#b8e0f0', '#ffd23f', '#ff9ecd'][Math.floor(rnd() * 4)];
          g.fill();
          g.strokeStyle = '#1d1433';
          g.lineWidth = 2;
          g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.55)';
          g.fillRect(x + 6, y + 8, 22, 28);
          g.fillStyle = 'rgba(29,20,51,0.55)';
          g.beginPath();
          g.arc(x + 17, y + 18, 6, 0, Math.PI * 2);
          g.fill();
          g.fillRect(x + 12, y + 24, 10, 10);
        }
      }
      g.fillStyle = '#0d2e29';
      g.fillRect(0, 352, W, H - 352);
      stage(g, '#9ef0cf', '#2a9d8f', '#ffd23f');
    },
  };

  BD.draw = function (ctx, kind, t) {
    kind = STATIC[kind] ? kind : 'dome';
    const custom = TT.custom && TT.custom.bg[kind];
    if (custom) {
      ctx.drawImage(custom, 0, 0, W, H);
    } else {
      if (!cache[kind]) {
        const c = TT.makeCanvas(W, H);
        const g = c.getContext('2d');
        g.lineJoin = 'round';
        STATIC[kind](g);
        cache[kind] = c;
      }
      ctx.drawImage(cache[kind], 0, 0);
    }
    // élő elemek
    if (kind === 'dome' && !custom) {
      // közönség
      const rnd = U.rng(3);
      for (let r = 0; r < 5; r++) {
        for (let i = 0; i < 30; i++) {
          const x = 10 + i * 32 + (r % 2) * 16 + rnd() * 8;
          if (r < 1 && Math.abs(x - W / 2) < 150) continue;
          const y = 150 + r * 44 + Math.abs(Math.sin(t * (4 + rnd() * 3) + i)) * -5;
          const col = ['#ff9e7a', '#7ad3ff', '#ffd27a', '#b6a4ff', '#9be7c4', '#ff9ecd'][Math.floor(rnd() * 6)];
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(x - 10, y + 7, 20, 14);
        }
      }
      // reflektorok
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [bx, ph] of [[120, 0], [840, 2]]) {
        const a = Math.sin(t * 0.7 + ph) * 0.35;
        ctx.save();
        ctx.translate(bx, -20);
        ctx.rotate(a + (bx < W / 2 ? -0.3 : 0.3));
        const gr = ctx.createLinearGradient(0, 0, 0, 480);
        gr.addColorStop(0, 'rgba(255,240,180,0.28)');
        gr.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.lineTo(110, 480);
        ctx.lineTo(-110, 480);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    } else if (kind === 'park' || kind === 'beach' || kind === 'street') {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 4; i++) {
        const x = ((t * (8 + i * 3) + i * 300) % (W + 200)) - 100;
        const y = 50 + i * 34;
        for (const [dx, dy, r] of [[0, 0, 22], [22, -8, 26], [46, 0, 20]]) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      const wt = TT.weatherNow ? TT.weatherNow() : 'clear';
      if (wt !== 'clear') BD.rain(ctx, t, wt === 'storm');
    } else if (kind === 'hive' || kind === 'vault') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const c = kind === 'hive' ? '255,210,63' : '127,224,181';
      const gr = ctx.createRadialGradient(W / 2, 400, 10, W / 2, 400, 420);
      gr.addColorStop(0, `rgba(${c},${0.12 + Math.sin(t * 2) * 0.04})`);
      gr.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  };

  // Eső állapot nélkül, az időből számolva (város és kültéri harcok); viharban villámlással
  BD.rain = function (ctx, t, heavy) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = heavy ? '#a9afc8' : '#c6ccdd';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(205,222,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const n = heavy ? 150 : 95;
    for (let i = 0; i < n; i++) {
      const sp = 560 + ((i * 37) % 9) * 40;
      const len = 10 + ((i * 13) % 7) * 2;
      const y = ((t * sp + i * 997) % (H + 60)) - 30;
      const x = ((i * 389) % (W + 140)) - y * 0.25 + 40;
      ctx.moveTo(x, y);
      ctx.lineTo(x + len * 0.25, y - len);
    }
    ctx.stroke();
    // csobbanások
    ctx.lineWidth = 1.2;
    const m = heavy ? 18 : 11;
    for (let i = 0; i < m; i++) {
      const cyc = t * 2.2 + i * 0.618;
      const k = cyc - Math.floor(cyc);
      if (k > 0.5) continue;
      const seed = Math.floor(cyc) * 131 + i * 977;
      const sx = (((seed * 7919) % 1000) / 1000) * W;
      const sy = H * 0.35 + (((seed * 104729) % 1000) / 1000) * H * 0.63;
      const r = 2 + k * 14;
      ctx.globalAlpha = 1 - k * 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, r, r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (heavy) {
      const ph = (t + 3) % BD.THUNDER_EVERY;
      if (ph < 0.25) {
        ctx.fillStyle = `rgba(255,255,255,${(0.25 - ph) * 2})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
    ctx.restore();
  };
  BD.THUNDER_EVERY = 9.7;

  TT.backdrop = BD;
})(window.TT);
