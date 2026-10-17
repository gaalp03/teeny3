'use strict';
// Rajzoló segédfüggvények: lekerekített dobozok, szöveg, ikonok.
(function (TT) {
  const U = TT.U;
  const D = {};

  D.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  D.panel = function (ctx, x, y, w, h, o) {
    o = o || {};
    const r = o.r != null ? o.r : 14;
    ctx.save();
    if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      D.rr(ctx, x + 3, y + 5, w, h, r);
      ctx.fill();
    }
    D.rr(ctx, x, y, w, h, r);
    if (o.grad !== false) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      const c = o.fill || '#2b1e5c';
      g.addColorStop(0, U.shade(c, 0.12));
      g.addColorStop(1, U.shade(c, -0.15));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = o.fill || '#2b1e5c';
    }
    ctx.fill();
    if (o.stroke !== false) {
      ctx.lineWidth = o.lw || 3;
      ctx.strokeStyle = o.stroke || '#120a2c';
      ctx.stroke();
      if (o.inner !== false) {
        D.rr(ctx, x + 3, y + 3, w - 6, h - 6, Math.max(2, r - 3));
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = o.inner || 'rgba(255,255,255,0.14)';
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  // Szöveg körvonallal (a játék "matricás" stílusa)
  D.text = function (ctx, str, x, y, o) {
    o = o || {};
    const size = o.size || 20;
    ctx.save();
    ctx.font = TT.font(size);
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'middle';
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    let s = String(str);
    if (o.maxWidth) {
      while (s.length > 1 && ctx.measureText(s).width > o.maxWidth) s = s.slice(0, -2) + '…';
    }
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.lw || Math.max(3, size * 0.22);
      ctx.strokeStyle = o.strokeColor || '#120a2c';
      ctx.strokeText(s, x, y);
    }
    if (o.shadow) {
      ctx.fillStyle = o.shadow;
      ctx.fillText(s, x, y + Math.max(2, size * 0.08));
    }
    ctx.fillStyle = o.color || '#ffffff';
    ctx.fillText(s, x, y);
    ctx.restore();
  };

  D.measure = function (ctx, str, size) {
    ctx.save();
    ctx.font = TT.font(size);
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  };

  D.wrap = function (ctx, str, maxW, size) {
    ctx.save();
    ctx.font = TT.font(size);
    const out = [];
    for (const para of String(str).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) {
          out.push(line);
          line = w;
        } else line = test;
      }
      out.push(line);
    }
    ctx.restore();
    return out;
  };

  D.bar = function (ctx, x, y, w, h, frac, o) {
    o = o || {};
    frac = U.clamp(frac, 0, 1);
    ctx.save();
    D.rr(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = o.bg || '#140b30';
    ctx.fill();
    if (o.ghost != null && o.ghost > frac) {
      D.rr(ctx, x + 2, y + 2, Math.max(0, (w - 4) * U.clamp(o.ghost, 0, 1)), h - 4, (h - 4) / 2);
      ctx.fillStyle = o.ghostColor || '#ffffff';
      ctx.fill();
    }
    if (frac > 0) {
      const fw = Math.max(h - 4, (w - 4) * frac);
      D.rr(ctx, x + 2, y + 2, fw, h - 4, (h - 4) / 2);
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      const c = o.color || '#4cd964';
      g.addColorStop(0, U.shade(c, 0.35));
      g.addColorStop(0.5, c);
      g.addColorStop(1, U.shade(c, -0.25));
      ctx.fillStyle = g;
      ctx.fill();
    }
    D.rr(ctx, x, y, w, h, h / 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = o.stroke || '#120a2c';
    ctx.stroke();
    ctx.restore();
  };

  D.star = function (ctx, x, y, r1, r2, n, rot) {
    n = n || 5;
    rot = rot || -Math.PI / 2;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 === 0 ? r1 : r2;
      const a = rot + (i * Math.PI) / n;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  };

  D.coin = function (ctx, x, y, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#e8a317';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7a4a00';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    ctx.fillStyle = '#b87300';
    ctx.font = TT.font(Math.round(r * 1.1));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', x, y + r * 0.06);
    ctx.restore();
  };

  // Teeny típus ikonok
  D.typeIcon = function (ctx, type, x, y, r) {
    const T = TT.TYPES[type];
    if (!T) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = T.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#120a2c';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = r * 0.18;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const s = r * 0.55;
    if (type === 'brawn') {
      // ököl
      D.rr(ctx, x - s * 0.8, y - s * 0.55, s * 1.6, s * 1.15, s * 0.3);
      ctx.fill();
      ctx.strokeStyle = T.color;
      ctx.lineWidth = r * 0.1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x - s * 0.8 + (s * 1.6 * i) / 4, y - s * 0.55);
        ctx.lineTo(x - s * 0.8 + (s * 1.6 * i) / 4, y - s * 0.1);
        ctx.stroke();
      }
    } else if (type === 'speed') {
      ctx.beginPath();
      ctx.moveTo(x + s * 0.2, y - s * 1.1);
      ctx.lineTo(x - s * 0.6, y + s * 0.15);
      ctx.lineTo(x - s * 0.05, y + s * 0.15);
      ctx.lineTo(x - s * 0.25, y + s * 1.1);
      ctx.lineTo(x + s * 0.65, y - s * 0.2);
      ctx.lineTo(x + s * 0.08, y - s * 0.2);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'mystic') {
      D.star(ctx, x, y, s * 1.05, s * 0.45, 4);
      ctx.fill();
    } else if (type === 'tech') {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.moveTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5);
        ctx.lineTo(x + Math.cos(a) * s * 1.0, y + Math.sin(a) * s * 1.0);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, s * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, s * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = T.color;
      ctx.fill();
    }
    ctx.restore();
  };

  // Ritkaság csillagok
  D.rarityStars = function (ctx, rarity, x, y, size, align) {
    const R = TT.RARITY[rarity];
    const n = R.stars;
    const gap = size * 1.05;
    let sx = align === 'center' ? x - ((n - 1) * gap) / 2 : x;
    ctx.save();
    for (let i = 0; i < n; i++) {
      D.star(ctx, sx + i * gap, y, size / 2, size / 4.4, 5);
      ctx.fillStyle = R.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#120a2c';
      ctx.stroke();
    }
    ctx.restore();
  };

  // Gomb rajzolása (állapotokkal)
  D.button = function (ctx, x, y, w, h, label, o) {
    o = o || {};
    const press = o.pressed ? 3 : 0;
    const base = o.disabled ? '#5a5470' : o.color || '#ff6b35';
    ctx.save();
    if (o.glow) {
      ctx.shadowColor = o.glowColor || base;
      ctx.shadowBlur = 18 + Math.sin(TT.time * 6) * 6;
    }
    D.rr(ctx, x, y + 4, w, h, o.r || 12);
    ctx.fillStyle = U.shade(base, -0.45);
    ctx.fill();
    ctx.shadowBlur = 0;
    D.rr(ctx, x, y + press, w, h, o.r || 12);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, U.shade(base, o.focus ? 0.4 : 0.22));
    g.addColorStop(1, U.shade(base, o.focus ? 0.05 : -0.08));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = o.focus ? '#ffffff' : '#120a2c';
    ctx.stroke();
    // fényes csík
    D.rr(ctx, x + 6, y + press + 4, w - 12, h * 0.32, Math.min(8, h * 0.16));
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.restore();
    if (label) {
      D.text(ctx, label, x + w / 2 + (o.icon ? 10 : 0), y + h / 2 + press + 1, {
        size: o.size || Math.min(24, h * 0.45), align: 'center', color: o.disabled ? '#bbb' : o.textColor || '#fff', maxWidth: w - 12,
      });
    }
  };

  // Billentyű jelvény (pl. [Q])
  D.keycap = function (ctx, label, x, y, o) {
    o = o || {};
    const size = o.size || 14;
    const w = Math.max(size * 1.6, D.measure(ctx, label, size) + 10);
    const h = size * 1.6;
    ctx.save();
    D.rr(ctx, x - w / 2, y - h / 2 + 2, w, h, 5);
    ctx.fillStyle = '#0c0620';
    ctx.fill();
    D.rr(ctx, x - w / 2, y - h / 2, w, h, 5);
    ctx.fillStyle = o.color || '#f4f1ff';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#120a2c';
    ctx.stroke();
    ctx.restore();
    D.text(ctx, label, x, y + 1, { size, align: 'center', color: '#1b1140', stroke: false });
    return w;
  };

  // Háttér "napsugár"
  D.sunburst = function (ctx, cx, cy, r, n, c1, c2, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot || 0);
    ctx.fillStyle = c1;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.fillStyle = c2;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = a0 + Math.PI / n;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a0, a1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  TT.D = D;
})(window.TT);
