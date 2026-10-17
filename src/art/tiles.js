'use strict';
// A térkép csempéinek procedurális rajzolása, darabokra (chunk) gyorsítótárazva.
(function (TT) {
  const U = TT.U;
  const TL = {};
  const CH = 20; // chunk mérete csempében
  const chunks = new Map();

  function h2(x, y, k) {
    return (U.hash(x + ':' + y + ':' + (k || 0)) % 1000) / 1000;
  }

  function isRoadish(v, T) {
    return v === T.ROAD || v === T.CROSS;
  }
  function isLand(v, T) {
    return v !== T.WATER && v !== T.POND;
  }

  function drawTile(g, W, x, y, px, py) {
    const T = W.T, S = W.TS;
    const v = W.tile(x, y);
    const n = (dx, dy) => W.tile(x + dx, y + dy);
    const r = h2(x, y);
    switch (v) {
      case T.WATER:
      case T.POND: {
        g.fillStyle = v === T.POND ? '#3fb2e8' : '#2f8fd8';
        g.fillRect(px, py, S, S);
        if (r < 0.3) {
          g.strokeStyle = 'rgba(255,255,255,0.18)';
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(px + 6 + r * 20, py + 12 + r * 10);
          g.quadraticCurveTo(px + 12 + r * 20, py + 8 + r * 10, px + 18 + r * 20, py + 12 + r * 10);
          g.stroke();
        }
        // hab a part mentén
        g.fillStyle = 'rgba(255,255,255,0.55)';
        if (isLand(n(0, -1), T)) g.fillRect(px, py, S, 4);
        if (isLand(n(0, 1), T)) g.fillRect(px, py + S - 4, S, 4);
        if (isLand(n(-1, 0), T)) g.fillRect(px, py, 4, S);
        if (isLand(n(1, 0), T)) g.fillRect(px + S - 4, py, 4, S);
        break;
      }
      case T.GRASS:
      case T.FLOWER:
      case T.TREE:
      case T.TALL: {
        g.fillStyle = (x + y) % 2 ? '#62c65c' : '#5cbf56';
        g.fillRect(px, py, S, S);
        g.strokeStyle = '#4aa846';
        g.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const bx = px + h2(x, y, i) * (S - 6) + 3, by = py + h2(x, y, i + 9) * (S - 8) + 6;
          g.beginPath();
          g.moveTo(bx, by);
          g.lineTo(bx - 2, by - 5);
          g.moveTo(bx + 3, by);
          g.lineTo(bx + 4, by - 4);
          g.stroke();
        }
        if (v === T.FLOWER) {
          const cols = ['#ff6b8a', '#ffd23f', '#ffffff', '#c06bff', '#ff8c42'];
          for (let i = 0; i < 4; i++) {
            const fx = px + 5 + h2(x, y, i + 20) * (S - 10), fy = py + 5 + h2(x, y, i + 30) * (S - 10);
            g.fillStyle = cols[Math.floor(h2(x, y, i + 40) * cols.length)];
            for (let k = 0; k < 4; k++) {
              g.beginPath();
              g.arc(fx + Math.cos(k * 1.57) * 2.4, fy + Math.sin(k * 1.57) * 2.4, 2, 0, Math.PI * 2);
              g.fill();
            }
            g.fillStyle = '#ffd23f';
            g.beginPath();
            g.arc(fx, fy, 1.4, 0, Math.PI * 2);
            g.fill();
          }
        }
        if (v === T.TREE) {
          g.fillStyle = 'rgba(0,0,0,0.18)';
          g.beginPath();
          g.ellipse(px + S / 2, py + S - 6, 14, 6, 0, 0, Math.PI * 2);
          g.fill();
        }
        break;
      }
      case T.SAND:
      case T.ROCK: {
        g.fillStyle = '#f2d98d';
        g.fillRect(px, py, S, S);
        g.fillStyle = '#e3c473';
        for (let i = 0; i < 4; i++) g.fillRect(px + h2(x, y, i) * S, py + h2(x, y, i + 5) * S, 2, 2);
        if (n(0, -1) === T.GRASS || n(0, -1) === T.FLOWER || n(0, -1) === T.TREE) {
          g.fillStyle = '#4aa846';
          for (let i = 0; i < S; i += 6) g.fillRect(px + i, py, 4, 3 + h2(x + i, y) * 3);
        }
        if (v === T.ROCK && W.tile(x, y) === T.ROCK) {
          // a szikla objektumként rajzolódik
        }
        break;
      }
      case T.DARK: {
        g.fillStyle = (x + y) % 2 ? '#3a3552' : '#36314c';
        g.fillRect(px, py, S, S);
        g.strokeStyle = 'rgba(255,210,63,0.12)';
        g.lineWidth = 1.5;
        g.beginPath();
        const cx = px + S / 2, cy = py + S / 2;
        for (let i = 0; i <= 6; i++) {
          const a = (i * Math.PI) / 3 + Math.PI / 6;
          const fx = cx + Math.cos(a) * 12, fy = cy + Math.sin(a) * 12;
          if (i === 0) g.moveTo(fx, fy);
          else g.lineTo(fx, fy);
        }
        g.stroke();
        break;
      }
      case T.MINT: {
        g.fillStyle = (x + y) % 2 ? '#c9f2e0' : '#bdeed8';
        g.fillRect(px, py, S, S);
        g.strokeStyle = 'rgba(42,157,143,0.25)';
        g.lineWidth = 1;
        g.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
        break;
      }
      case T.ROAD:
      case T.CROSS: {
        g.fillStyle = '#4b4a5e';
        g.fillRect(px, py, S, S);
        g.fillStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < 5; i++) g.fillRect(px + h2(x, y, i) * S, py + h2(x, y, i + 7) * S, 2, 2);
        const up = isRoadish(n(0, -1), T), dn = isRoadish(n(0, 1), T), lf = isRoadish(n(-1, 0), T), rt = isRoadish(n(1, 0), T);
        if (v === T.CROSS) {
          g.fillStyle = '#f4f1ff';
          if (up && dn) {
            for (let i = 0; i < 4; i++) g.fillRect(px + 2 + i * 8, py + 4, 5, S - 8);
          } else {
            for (let i = 0; i < 4; i++) g.fillRect(px + 4, py + 2 + i * 8, S - 8, 5);
          }
          break;
        }
        // középvonal
        g.fillStyle = '#ffd23f';
        const vertical = up && dn && !(lf && rt);
        const horizontal = lf && rt && !(up && dn);
        if (horizontal && up && !isRoadish(n(0, -2), T)) {
          if (x % 2 === 0) g.fillRect(px + 4, py - 1.5, S - 8, 3);
        }
        if (vertical && lf && !isRoadish(n(-2, 0), T)) {
          if (y % 2 === 0) g.fillRect(px - 1.5, py + 4, 3, S - 8);
        }
        break;
      }
      case T.WALK: {
        g.fillStyle = '#cfc8dc';
        g.fillRect(px, py, S, S);
        g.strokeStyle = '#b5adc6';
        g.lineWidth = 1;
        g.strokeRect(px + 0.5, py + 0.5, S / 2, S / 2);
        g.strokeRect(px + S / 2 + 0.5, py + S / 2 + 0.5, S / 2 - 1, S / 2 - 1);
        g.fillStyle = '#8f87a3';
        if (isRoadish(n(0, 1), T)) g.fillRect(px, py + S - 4, S, 4);
        if (isRoadish(n(0, -1), T)) g.fillRect(px, py, S, 3);
        if (isRoadish(n(1, 0), T)) g.fillRect(px + S - 4, py, 4, S);
        if (isRoadish(n(-1, 0), T)) g.fillRect(px, py, 3, S);
        break;
      }
      case T.PLAZA: {
        g.fillStyle = (x + y) % 2 ? '#e8d9b5' : '#ddcca5';
        g.fillRect(px, py, S, S);
        g.strokeStyle = 'rgba(120,90,50,0.18)';
        g.lineWidth = 1;
        g.strokeRect(px + 0.5, py + 0.5, S - 1, S - 1);
        if (r < 0.15) {
          g.fillStyle = 'rgba(120,90,50,0.15)';
          g.fillRect(px + 8, py + 10, 6, 3);
        }
        break;
      }
      case T.BRIDGE:
      case T.DOCK: {
        g.fillStyle = '#2f8fd8';
        g.fillRect(px, py, S, S);
        const vertical = W.tile(x, y - 1) === v || W.tile(x, y + 1) === v;
        g.fillStyle = v === T.BRIDGE ? '#b0763a' : '#9a6a3a';
        g.fillRect(px, py, S, S);
        g.strokeStyle = 'rgba(60,30,10,0.5)';
        g.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          g.beginPath();
          if (vertical) {
            g.moveTo(px, py + i * 8 + 0.5);
            g.lineTo(px + S, py + i * 8 + 0.5);
          } else {
            g.moveTo(px + i * 8 + 0.5, py);
            g.lineTo(px + i * 8 + 0.5, py + S);
          }
          g.stroke();
        }
        // korlát a víz felőli oldalon
        g.fillStyle = '#6b3f1d';
        const water = (vv) => vv === T.WATER;
        if (water(n(-1, 0))) g.fillRect(px, py, 4, S);
        if (water(n(1, 0))) g.fillRect(px + S - 4, py, 4, S);
        if (!vertical && water(n(0, -1)) && v === T.DOCK && W.tile(x, y - 1) !== T.DOCK) g.fillRect(px, py, S, 4);
        if (!vertical && water(n(0, 1))) g.fillRect(px, py + S - 4, S, 4);
        break;
      }
      case T.HEDGE: {
        const base = W.tile(x, y + 1) === T.DARK || W.tile(x - 1, y) === T.DARK ? '#36314c' : '#5cbf56';
        g.fillStyle = base;
        g.fillRect(px, py, S, S);
        g.fillStyle = '#2e7d32';
        TT.D.rr(g, px + 1, py + 2, S - 2, S - 3, 8);
        g.fill();
        g.fillStyle = '#3f9a44';
        for (let i = 0; i < 4; i++) {
          g.beginPath();
          g.arc(px + 6 + (i % 2) * 18 + h2(x, y, i) * 4, py + 8 + Math.floor(i / 2) * 12, 6, 0, Math.PI * 2);
          g.fill();
        }
        g.strokeStyle = '#1b4d1e';
        g.lineWidth = 1.5;
        TT.D.rr(g, px + 1, py + 2, S - 2, S - 3, 8);
        g.stroke();
        break;
      }
      default:
        g.fillStyle = '#ff00ff';
        g.fillRect(px, py, S, S);
    }
  }

  function renderChunk(W, cx, cy) {
    const S = W.TS;
    const c = TT.makeCanvas(CH * S, CH * S);
    const g = c.getContext('2d');
    for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
      const x = cx * CH + i, y = cy * CH + j;
      if (x >= W.MW || y >= W.MH) continue;
      drawTile(g, W, x, y, i * S, j * S);
    }
    return c;
  }

  TL.drawGround = function (ctx, W, camX, camY, vw, vh) {
    const S = W.TS;
    const x0 = Math.floor(camX / (CH * S)), y0 = Math.floor(camY / (CH * S));
    const x1 = Math.floor((camX + vw) / (CH * S)), y1 = Math.floor((camY + vh) / (CH * S));
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      if (cx < 0 || cy < 0 || cx * CH >= W.MW || cy * CH >= W.MH) continue;
      const key = cx + ',' + cy;
      let c = chunks.get(key);
      if (!c) {
        c = renderChunk(W, cx, cy);
        chunks.set(key, c);
      }
      ctx.drawImage(c, Math.round(cx * CH * S - camX), Math.round(cy * CH * S - camY));
    }
  };

  TL.reset = () => chunks.clear();

  // ---------- Fa és szikla sprite-ok ----------
  const sprites = {};
  function makeTree(variant) {
    const c = TT.makeCanvas(64, 84);
    const g = c.getContext('2d');
    g.fillStyle = '#7a4a2b';
    TT.D.rr(g, 27, 50, 10, 26, 3);
    g.fill();
    g.strokeStyle = '#3a2010';
    g.lineWidth = 2;
    g.stroke();
    const cols = variant === 1 ? ['#2f8f3a', '#3faa48', '#58c45e'] : variant === 2 ? ['#2a7a5a', '#37956c', '#4fb585'] : ['#2e8b3a', '#41a84a', '#6fd36a'];
    const blobs = [[32, 36, 24], [18, 40, 14], [46, 40, 14], [32, 22, 16]];
    g.fillStyle = '#1b4d1e';
    for (const [x, y, r] of blobs) {
      g.beginPath();
      g.arc(x, y, r + 2, 0, Math.PI * 2);
      g.fill();
    }
    cols.forEach((col, k) => {
      g.fillStyle = col;
      for (const [x, y, r] of blobs) {
        g.beginPath();
        g.arc(x - k * 2, y - k * 3, r - k * 4, 0, Math.PI * 2);
        g.fill();
      }
    });
    if (variant === 1) {
      g.fillStyle = '#ff4f4f';
      for (const [x, y] of [[24, 30], [40, 36], [30, 44], [44, 26]]) {
        g.beginPath();
        g.arc(x, y, 3, 0, Math.PI * 2);
        g.fill();
      }
    }
    return c;
  }
  function makeRock() {
    const c = TT.makeCanvas(40, 34);
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.beginPath();
    g.ellipse(20, 28, 16, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(5, 28);
    g.lineTo(9, 12);
    g.lineTo(20, 5);
    g.lineTo(32, 10);
    g.lineTo(36, 28);
    g.closePath();
    g.fillStyle = '#9aa0a8';
    g.fill();
    g.strokeStyle = '#4a4e56';
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = '#c3c8cf';
    g.beginPath();
    g.moveTo(10, 14);
    g.lineTo(20, 7);
    g.lineTo(22, 16);
    g.closePath();
    g.fill();
    return c;
  }
  TL.tree = function (variant) {
    const k = 'tree' + variant;
    if (!sprites[k]) sprites[k] = makeTree(variant);
    return sprites[k];
  };
  TL.rock = function () {
    if (!sprites.rock) sprites.rock = makeRock();
    return sprites.rock;
  };
  TL.treeVariant = (x, y) => Math.floor(h2(x, y, 99) * 3);

  // Csillogó víz animáció a látható részen
  TL.drawWaterFx = function (ctx, W, camX, camY, vw, vh, t) {
    const S = W.TS;
    const x0 = Math.max(0, Math.floor(camX / S)), y0 = Math.max(0, Math.floor(camY / S));
    const x1 = Math.min(W.MW - 1, Math.floor((camX + vw) / S)), y1 = Math.min(W.MH - 1, Math.floor((camY + vh) / S));
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const v = W.tile(x, y);
      if (v !== W.T.WATER) continue;
      const r = h2(x, y, 5);
      if (r > 0.12) continue;
      const ph = (t * 0.8 + r * 20) % 3;
      if (ph > 1) continue;
      const a = Math.sin(ph * Math.PI);
      ctx.globalAlpha = a * 0.7;
      const px = x * S - camX + 6 + r * 120 % 20, py = y * S - camY + 10 + (r * 300) % 14;
      ctx.fillRect(px, py, 8 * a + 2, 2);
    }
    ctx.restore();
  };

  TT.tiles = TL;
})(window.TT);
