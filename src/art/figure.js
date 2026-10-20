'use strict';
// Procedurális chibi figura-rajzoló. Minden figura kódból rajzolódik ki a "look"
// paraméterek alapján (nincs szükség képfájlokra). Ha van saját textúra
// (TT.custom.figures[id]), akkor azt rajzolja helyette.
(function (TT) {
  const U = TT.U;
  const OUT = '#1d1433';
  const LW = 2.2;
  const A = {};

  function fs(ctx, fill, lw) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.lineWidth = lw || LW;
    ctx.strokeStyle = OUT;
    ctx.stroke();
  }
  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  }
  function ellipse(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
  }
  function rr(ctx, x, y, w, h, r) {
    TT.D.rr(ctx, x, y, w, h, r);
  }
  function capsule(ctx, x1, y1, x2, y2, w, fill) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = OUT;
    ctx.lineWidth = w + LW * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = fill;
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.restore();
  }
  const has = (L, g) => L.gear && L.gear.indexOf(g) >= 0;

  // ---------- Talapzat ----------
  A.drawPedestal = function (ctx, x, y, s, rarity, o) {
    o = o || {};
    const R = TT.RARITY[rarity || 'common'];
    const rx = 34 * s, ry = 10 * s, h = 8 * s;
    ctx.save();
    ctx.globalAlpha *= 0.35;
    ellipse(ctx, x, y + h + 3 * s, rx * 1.15, ry * 1.2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();
    ctx.save();
    // oldal
    ctx.beginPath();
    ctx.ellipse(x, y + h, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(x - rx, y);
    ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    const g = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
    g.addColorStop(0, U.shade(R.ring, -0.45));
    g.addColorStop(0.5, U.shade(R.ring, -0.1));
    g.addColorStop(1, U.shade(R.ring, -0.5));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.strokeStyle = OUT;
    ctx.stroke();
    // teteje
    ellipse(ctx, x, y, rx, ry);
    const g2 = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 1, x, y, rx);
    g2.addColorStop(0, o.top2 || '#5a4aa0');
    g2.addColorStop(1, o.top || '#2b1e5c');
    ctx.fillStyle = g2;
    ctx.fill();
    ctx.stroke();
    ellipse(ctx, x, y, rx * 0.86, ry * 0.8);
    ctx.lineWidth = Math.max(1, 1.6 * s);
    ctx.strokeStyle = R.color;
    ctx.stroke();
    ctx.restore();
  };

  // ---------- Fej ----------
  function hairCap(ctx, hx, hy, r, color, low) {
    const hl = low || 0;
    ctx.save();
    circle(ctx, hx, hy, r * 1.07);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(hx - r * 1.3, hy + r * 0.15 + hl);
    ctx.lineTo(hx - r * 1.3, hy - r * 1.4);
    ctx.lineTo(hx + r * 1.3, hy - r * 1.4);
    ctx.lineTo(hx + r * 1.3, hy + r * 0.15 + hl);
    ctx.quadraticCurveTo(hx + r * 0.75, hy - r * 0.62 + hl, hx + r * 0.05, hy - r * 0.48 + hl);
    ctx.quadraticCurveTo(hx - r * 0.75, hy - r * 0.62 + hl, hx - r * 1.3, hy + r * 0.15 + hl);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    // körvonal a fej tetején
    ctx.beginPath();
    ctx.arc(hx, hy, r * 1.07, Math.PI * 0.97, Math.PI * 2.03);
    ctx.lineWidth = LW;
    ctx.strokeStyle = OUT;
    ctx.stroke();
  }

  function drawHairBack(ctx, L, hx, hy, r) {
    const c = L.hairColor || '#333';
    switch (L.hair) {
      case 'long':
        ctx.beginPath();
        ctx.moveTo(hx - r * 1.02, hy - r * 0.3);
        ctx.quadraticCurveTo(hx - r * 1.35, hy + r * 1.1, hx - r * 1.05, hy + r * 1.95);
        ctx.quadraticCurveTo(hx, hy + r * 2.15, hx + r * 1.05, hy + r * 1.95);
        ctx.quadraticCurveTo(hx + r * 1.35, hy + r * 1.1, hx + r * 1.02, hy - r * 0.3);
        ctx.arc(hx, hy, r * 1.06, 0, Math.PI, true);
        ctx.closePath();
        fs(ctx, c);
        break;
      case 'ponytail':
        ctx.beginPath();
        ctx.moveTo(hx - r * 0.7, hy - r * 0.8);
        ctx.quadraticCurveTo(hx - r * 1.9, hy - r * 0.6, hx - r * 1.5, hy + r * 1.3);
        ctx.quadraticCurveTo(hx - r * 1.1, hy + r * 0.4, hx - r * 0.5, hy - r * 0.2);
        ctx.closePath();
        fs(ctx, c);
        break;
      case 'mullet':
        rr(ctx, hx - r * 0.95, hy - r * 0.2, r * 1.9, r * 1.35, r * 0.4);
        fs(ctx, c);
        break;
      case 'bob':
        if (!L.hood) {
          rr(ctx, hx - r * 1.08, hy - r * 0.5, r * 2.16, r * 1.4, r * 0.5);
          fs(ctx, c);
        }
        break;
      default:
        break;
    }
  }

  function drawHairFront(ctx, L, hx, hy, r, P) {
    const c = L.hairColor || '#333';
    const h = L.hair;
    if (!h || h === 'bald') return;
    if (P.back) {
      // hátulnézet: a haj az egész fejet takarja
      ctx.save();
      circle(ctx, hx, hy, r * 1.05);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.restore();
      circle(ctx, hx, hy, r * 1.05);
      fs(ctx, null);
    }
    switch (h) {
      case 'spiky': {
        const spikes = [-200, -172, -146, -120, -94, -68, -42, -16];
        ctx.beginPath();
        for (const deg of spikes) {
          const a = (deg * Math.PI) / 180;
          const a1 = a - 0.24, a2 = a + 0.24;
          const tip = a - 0.32;
          ctx.moveTo(hx + Math.cos(a1) * r * 0.92, hy + Math.sin(a1) * r * 0.92);
          ctx.lineTo(hx + Math.cos(tip) * r * 1.55, hy + Math.sin(tip) * r * 1.5);
          ctx.lineTo(hx + Math.cos(a2) * r * 0.92, hy + Math.sin(a2) * r * 0.92);
        }
        fs(ctx, c);
        if (!P.back) hairCap(ctx, hx, hy, r, c, -r * 0.05);
        break;
      }
      case 'messy': {
        if (!P.back) hairCap(ctx, hx, hy, r, c, -r * 0.02);
        const tufts = [[-0.75, -0.75], [-0.35, -1.0], [0.1, -1.08], [0.52, -0.92], [0.85, -0.6]];
        for (const [tx, ty] of tufts) {
          circle(ctx, hx + tx * r, hy + ty * r, r * 0.3);
          fs(ctx, c);
        }
        ctx.save();
        circle(ctx, hx, hy, r * 1.07);
        ctx.clip();
        hairCap(ctx, hx, hy, r * 0.98, c, -r * 0.04);
        ctx.restore();
        break;
      }
      case 'long': {
        if (P.back) break;
        hairCap(ctx, hx, hy, r, c, -r * 0.12);
        // oldalsó tincsek
        for (const sd of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx + sd * r * 0.98, hy - r * 0.35);
          ctx.quadraticCurveTo(hx + sd * r * 1.12, hy + r * 0.5, hx + sd * r * 0.88, hy + r * 1.05);
          ctx.lineTo(hx + sd * r * 0.72, hy + r * 0.2);
          ctx.closePath();
          fs(ctx, c);
        }
        break;
      }
      case 'bob':
        if (P.back) break;
        if (L.hood) {
          ctx.save();
          circle(ctx, hx, hy, r);
          ctx.clip();
          hairCap(ctx, hx, hy, r, c, -r * 0.1);
          ctx.restore();
        } else hairCap(ctx, hx, hy, r, c, -r * 0.1);
        break;
      case 'jinx':
        for (const sd of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx + sd * r * 0.35, hy - r * 0.85);
          ctx.quadraticCurveTo(hx + sd * r * 1.1, hy - r * 1.0, hx + sd * r * 1.45, hy - r * 1.75);
          ctx.quadraticCurveTo(hx + sd * r * 1.25, hy - r * 0.7, hx + sd * r * 0.95, hy - r * 0.25);
          ctx.closePath();
          fs(ctx, c);
        }
        if (!P.back) hairCap(ctx, hx, hy, r, c, -r * 0.08);
        break;
      case 'flat':
        if (!P.back) hairCap(ctx, hx, hy, r, c, -r * 0.12);
        ctx.beginPath();
        ctx.moveTo(hx - r * 0.2, hy - r * 1.04);
        ctx.quadraticCurveTo(hx + r * 0.2, hy - r * 0.8, hx + r * 0.75, hy - r * 0.78);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = U.shade(c, -0.35);
        ctx.stroke();
        break;
      case 'bun':
        circle(ctx, hx, hy - r * 1.05, r * 0.4);
        fs(ctx, c);
        if (!P.back) hairCap(ctx, hx, hy, r, c, -r * 0.1);
        break;
      case 'ponytail':
        if (!P.back) hairCap(ctx, hx, hy, r, c, -r * 0.06);
        break;
      case 'puffs':
        for (const sd of [-1, 1]) {
          circle(ctx, hx + sd * r * 0.78, hy - r * 0.86, r * 0.44);
          fs(ctx, c);
        }
        if (!P.back) hairCap(ctx, hx, hy, r, c, -r * 0.08);
        break;
      case 'swoop':
        if (!P.back) {
          hairCap(ctx, hx, hy, r, c, -r * 0.05);
          ctx.beginPath();
          ctx.moveTo(hx - r * 0.9, hy - r * 0.5);
          ctx.quadraticCurveTo(hx + r * 0.2, hy - r * 0.95, hx + r * 0.95, hy - r * 0.15);
          ctx.quadraticCurveTo(hx + r * 0.3, hy - r * 0.55, hx - r * 0.6, hy - r * 0.35);
          ctx.closePath();
          fs(ctx, c);
        }
        break;
      case 'mullet':
        if (!P.back) hairCap(ctx, hx, hy, r, c, -r * 0.05);
        break;
      case 'short':
        if (!P.back) hairCap(ctx, hx, hy, r, c, -r * 0.2);
        break;
      default:
        break;
    }
  }

  function drawEyes(ctx, L, fx, fy, fr, P) {
    const style = P.ko ? 'ko' : L.eyes || 'dot';
    const ex = fr * 0.37;
    const ey = fy + fr * 0.02;
    const ec = L.eyeColor || '#1d1d2b';
    const blink = !P.ko && (Math.sin(P.t * 1.3 + (P.seed || 0)) > 0.985);
    const pts = [fx - ex, fx + ex];
    ctx.save();
    switch (style) {
      case 'dot':
      case 'angry':
        for (const x of pts) {
          if (blink) {
            ctx.beginPath();
            ctx.moveTo(x - fr * 0.11, ey);
            ctx.lineTo(x + fr * 0.11, ey);
            ctx.lineWidth = 2;
            ctx.strokeStyle = OUT;
            ctx.stroke();
          } else {
            ellipse(ctx, x, ey, fr * 0.11, fr * 0.16);
            ctx.fillStyle = ec;
            ctx.fill();
            circle(ctx, x + fr * 0.04, ey - fr * 0.06, fr * 0.045);
            ctx.fillStyle = '#fff';
            ctx.fill();
          }
        }
        if (style === 'angry') {
          for (const sd of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(fx + sd * ex + sd * fr * 0.16, ey - fr * 0.3);
            ctx.lineTo(fx + sd * ex - sd * fr * 0.14, ey - fr * 0.18);
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = OUT;
            ctx.stroke();
          }
        }
        break;
      case 'big':
        for (const x of pts) {
          ellipse(ctx, x, ey, fr * 0.17, fr * 0.22);
          fs(ctx, '#fff', 1.5);
          if (blink) break;
          circle(ctx, x + fr * 0.03, ey + fr * 0.02, fr * 0.13);
          ctx.fillStyle = ec;
          ctx.fill();
          circle(ctx, x + fr * 0.03, ey + fr * 0.02, fr * 0.065);
          ctx.fillStyle = '#111';
          ctx.fill();
          circle(ctx, x + fr * 0.08, ey - fr * 0.06, fr * 0.045);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
        break;
      case 'lens': {
        // dominómaszk fehér lencsékkel (Robin)
        const mc = L.mask || '#1d1d2b';
        ctx.beginPath();
        ctx.moveTo(fx - ex - fr * 0.3, ey - fr * 0.05);
        ctx.quadraticCurveTo(fx - ex, ey - fr * 0.32, fx, ey - fr * 0.12);
        ctx.quadraticCurveTo(fx + ex, ey - fr * 0.32, fx + ex + fr * 0.3, ey - fr * 0.05);
        ctx.quadraticCurveTo(fx + ex + fr * 0.1, ey + fr * 0.24, fx, ey + fr * 0.1);
        ctx.quadraticCurveTo(fx - ex - fr * 0.1, ey + fr * 0.24, fx - ex - fr * 0.3, ey - fr * 0.05);
        ctx.closePath();
        fs(ctx, mc, 1.5);
        for (const x of pts) {
          const sd = x < fx ? -1 : 1;
          ellipse(ctx, x + sd * fr * 0.02, ey, fr * 0.15, blink ? fr * 0.02 : fr * 0.1, sd * -0.15);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
        break;
      }
      case 'goggle':
        ctx.beginPath();
        ctx.moveTo(fx - fr * 1.02, ey);
        ctx.lineTo(fx + fr * 1.02, ey);
        ctx.lineWidth = fr * 0.16;
        ctx.strokeStyle = '#2a2a36';
        ctx.stroke();
        for (const x of pts) {
          circle(ctx, x, ey, fr * 0.2);
          fs(ctx, '#3a3a46', 1.5);
          circle(ctx, x, ey, fr * 0.14);
          ctx.fillStyle = ec;
          ctx.fill();
          circle(ctx, x + fr * 0.05, ey - fr * 0.05, fr * 0.04);
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fill();
        }
        break;
      case 'glow':
        ctx.shadowColor = ec;
        ctx.shadowBlur = 8;
        for (const x of pts) {
          ellipse(ctx, x, ey, fr * 0.14, fr * 0.09, x < fx ? 0.25 : -0.25);
          ctx.fillStyle = ec;
          ctx.fill();
        }
        break;
      case 'four':
        ctx.shadowColor = ec;
        ctx.shadowBlur = 6;
        for (const x of pts) {
          for (const dy of [-0.15, 0.12]) {
            ellipse(ctx, x, ey + dy * fr, fr * 0.11, fr * 0.06, x < fx ? 0.2 : -0.2);
            ctx.fillStyle = ec;
            ctx.fill();
          }
        }
        break;
      case 'cat':
        for (const x of pts) {
          ctx.beginPath();
          ctx.moveTo(x - fr * 0.17, ey + fr * 0.02);
          ctx.quadraticCurveTo(x, ey - fr * 0.22, x + fr * 0.17, ey - fr * 0.06);
          ctx.quadraticCurveTo(x, ey + fr * 0.2, x - fr * 0.17, ey + fr * 0.02);
          ctx.closePath();
          fs(ctx, ec, 1.4);
          ellipse(ctx, x, ey - fr * 0.02, fr * 0.03, fr * 0.09);
          ctx.fillStyle = '#111';
          ctx.fill();
        }
        break;
      case 'sleepy':
        for (const x of pts) {
          ctx.beginPath();
          ctx.arc(x, ey - fr * 0.05, fr * 0.12, 0.15 * Math.PI, 0.85 * Math.PI);
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
        }
        break;
      case 'cyborg': {
        ellipse(ctx, fx - ex, ey, fr * 0.11, fr * 0.16);
        ctx.fillStyle = '#1d1d2b';
        ctx.fill();
        circle(ctx, fx - ex + fr * 0.04, ey - fr * 0.06, fr * 0.04);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowColor = '#ff2a2a';
        ctx.shadowBlur = 8;
        circle(ctx, fx + ex, ey, fr * 0.15);
        ctx.fillStyle = '#ff2a2a';
        ctx.fill();
        circle(ctx, fx + ex, ey, fr * 0.06);
        ctx.fillStyle = '#ffd0d0';
        ctx.fill();
        break;
      }
      case 'visor':
        ctx.shadowColor = ec;
        ctx.shadowBlur = 8;
        rr(ctx, fx - fr * 0.7, ey - fr * 0.1, fr * 1.4, fr * 0.2, fr * 0.1);
        ctx.fillStyle = ec;
        ctx.fill();
        break;
      case 'robot':
        ctx.shadowColor = ec;
        ctx.shadowBlur = 8;
        for (const x of pts) {
          rr(ctx, x - fr * 0.14, ey - fr * 0.1, fr * 0.28, fr * 0.2, fr * 0.06);
          ctx.fillStyle = ec;
          ctx.fill();
        }
        break;
      case 'ko':
        for (const x of pts) {
          ctx.beginPath();
          ctx.moveTo(x - fr * 0.1, ey - fr * 0.1);
          ctx.lineTo(x + fr * 0.1, ey + fr * 0.1);
          ctx.moveTo(x + fr * 0.1, ey - fr * 0.1);
          ctx.lineTo(x - fr * 0.1, ey + fr * 0.1);
          ctx.lineWidth = 2.4;
          ctx.strokeStyle = OUT;
          ctx.stroke();
        }
        break;
      default:
        break;
    }
    ctx.restore();
  }

  function drawMouth(ctx, L, fx, fy, fr, P) {
    let m = L.mouth || 'smile';
    if (m === 'none') return;
    if (P.ko) m = 'frown';
    if (P.hurt) m = 'open';
    if (P.talk && Math.floor(P.t * 9) % 2 === 0) m = 'open';
    if (P.cheer) m = 'grin';
    const mx = fx + fr * 0.06, my = fy + fr * 0.45;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = OUT;
    switch (m) {
      case 'smile':
        ctx.beginPath();
        ctx.arc(mx, my - fr * 0.12, fr * 0.16, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        break;
      case 'grin':
        ctx.beginPath();
        ctx.moveTo(mx - fr * 0.22, my - fr * 0.06);
        ctx.quadraticCurveTo(mx, my - fr * 0.1, mx + fr * 0.22, my - fr * 0.06);
        ctx.quadraticCurveTo(mx, my + fr * 0.3, mx - fr * 0.22, my - fr * 0.06);
        ctx.closePath();
        fs(ctx, '#7a1a2a', 1.6);
        ctx.beginPath();
        ctx.moveTo(mx - fr * 0.18, my - fr * 0.06);
        ctx.quadraticCurveTo(mx, my - fr * 0.09, mx + fr * 0.18, my - fr * 0.06);
        ctx.lineTo(mx + fr * 0.15, my + fr * 0.02);
        ctx.quadraticCurveTo(mx, my, mx - fr * 0.15, my + fr * 0.02);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        break;
      case 'flat':
        ctx.beginPath();
        ctx.moveTo(mx - fr * 0.1, my);
        ctx.lineTo(mx + fr * 0.1, my);
        ctx.stroke();
        break;
      case 'frown':
        ctx.beginPath();
        ctx.arc(mx, my + fr * 0.12, fr * 0.13, 1.2 * Math.PI, 1.8 * Math.PI);
        ctx.stroke();
        break;
      case 'open':
        ellipse(ctx, mx, my, fr * 0.11, fr * 0.13);
        fs(ctx, '#7a1a2a', 1.5);
        break;
      case 'smirk':
        ctx.beginPath();
        ctx.moveTo(mx - fr * 0.14, my);
        ctx.quadraticCurveTo(mx + fr * 0.05, my + fr * 0.06, mx + fr * 0.18, my - fr * 0.08);
        ctx.stroke();
        break;
      case 'lips':
        ctx.beginPath();
        ctx.moveTo(mx - fr * 0.16, my);
        ctx.quadraticCurveTo(mx - fr * 0.06, my - fr * 0.08, mx, my - fr * 0.02);
        ctx.quadraticCurveTo(mx + fr * 0.06, my - fr * 0.08, mx + fr * 0.16, my);
        ctx.quadraticCurveTo(mx, my + fr * 0.12, mx - fr * 0.16, my);
        ctx.closePath();
        fs(ctx, '#d1153a', 1.2);
        break;
      case 'fang':
        ctx.beginPath();
        ctx.arc(mx, my - fr * 0.12, fr * 0.17, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + fr * 0.02, my + fr * 0.03);
        ctx.lineTo(mx + fr * 0.1, my + fr * 0.03);
        ctx.lineTo(mx + fr * 0.06, my + fr * 0.14);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      default:
        break;
    }
    ctx.restore();
  }

  function drawHead(ctx, L, hx, hy, r, P, layer) {
    const skin = L.skin || '#f6cba8';
    // ---- hátsó rétegek ----
    if (layer !== 'front') drawHeadBack(ctx, L, hx, hy, r, skin);
    if (layer === 'back') return;
    drawHeadMain(ctx, L, hx, hy, r, P, skin);
  }

  function drawHeadBack(ctx, L, hx, hy, r, skin) {
    if (has(L, 'collar')) {
      ctx.beginPath();
      ctx.moveTo(hx - r * 0.95, hy + r * 0.85);
      ctx.lineTo(hx - r * 1.15, hy - r * 0.1);
      ctx.lineTo(hx - r * 0.4, hy + r * 0.6);
      ctx.lineTo(hx + r * 0.4, hy + r * 0.6);
      ctx.lineTo(hx + r * 1.15, hy - r * 0.1);
      ctx.lineTo(hx + r * 0.95, hy + r * 0.85);
      ctx.closePath();
      fs(ctx, '#2a0a3a');
    }
    if (L.hood) {
      ctx.beginPath();
      ctx.arc(hx, hy - r * 0.05, r * 1.22, 0, Math.PI * 2);
      fs(ctx, L.cloak);
    }
    drawHairBack(ctx, L, hx, hy, r);
    if (has(L, 'ears_pointy')) {
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(hx + sd * r * 0.8, hy - r * 0.25);
        ctx.lineTo(hx + sd * r * 1.55, hy - r * 0.55);
        ctx.lineTo(hx + sd * r * 0.85, hy + r * 0.28);
        ctx.closePath();
        fs(ctx, skin);
      }
    }
    if (has(L, 'horns')) {
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(hx + sd * r * 0.45, hy - r * 0.78);
        ctx.quadraticCurveTo(hx + sd * r * 1.5, hy - r * 1.0, hx + sd * r * 1.25, hy - r * 2.0);
        ctx.quadraticCurveTo(hx + sd * r * 1.05, hy - r * 1.15, hx + sd * r * 0.82, hy - r * 0.45);
        ctx.closePath();
        fs(ctx, '#3a2a2a');
      }
    }
  }

  function drawHeadMain(ctx, L, hx, hy, r, P, skin) {
    if (has(L, 'cowl') || has(L, 'flash_cowl') || has(L, 'light_hood')) {
      const cc = has(L, 'light_hood') ? '#1d1d2b' : has(L, 'flash_cowl') ? L.top : L.cowlColor;
      if (has(L, 'flash_cowl')) {
        for (const sd of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(hx + sd * r * 0.9, hy - r * 0.35);
          ctx.lineTo(hx + sd * r * 1.55, hy - r * 0.75);
          ctx.lineTo(hx + sd * r * 1.2, hy - r * 0.2);
          ctx.lineTo(hx + sd * r * 1.6, hy - r * 0.05);
          ctx.lineTo(hx + sd * r * 0.92, hy + r * 0.15);
          ctx.closePath();
          fs(ctx, L.gloves || '#d62828');
        }
      }
      circle(ctx, hx, hy, r);
      fs(ctx, cc);
      if (!P.back) {
        ellipse(ctx, hx + r * 0.06, hy + r * 0.2, r * 0.74, r * 0.62);
        fs(ctx, skin, 1.6);
      }
    } else if (has(L, 'seemore')) {
      circle(ctx, hx, hy, r);
      fs(ctx, skin);
    } else if (has(L, 'slade_mask')) {
      ctx.save();
      circle(ctx, hx, hy, r);
      ctx.clip();
      ctx.fillStyle = '#1d1d2b';
      ctx.fillRect(hx - r * 1.2, hy - r * 1.2, r * 2.4, r * 2.4);
      ctx.fillStyle = '#d4752a';
      ctx.fillRect(hx + r * 0.02, hy - r * 1.2, r * 1.3, r * 2.4);
      ctx.restore();
      circle(ctx, hx, hy, r);
      fs(ctx, null);
      if (!P.back) {
        ellipse(ctx, hx + r * 0.42, hy - r * 0.02, r * 0.16, r * 0.11);
        ctx.fillStyle = '#111';
        ctx.fill();
        circle(ctx, hx + r * 0.44, hy - r * 0.03, r * 0.04);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(hx - r * 0.45 + i * r * 0.14, hy + r * 0.45);
          ctx.lineTo(hx - r * 0.45 + i * r * 0.14, hy + r * 0.65);
          ctx.stroke();
        }
      }
      return;
    } else if (has(L, 'redx_mask')) {
      circle(ctx, hx, hy, r);
      fs(ctx, '#1d1d2b');
      if (!P.back) {
        ctx.beginPath();
        ctx.moveTo(hx - r * 0.62, hy - r * 0.35);
        ctx.quadraticCurveTo(hx + r * 0.05, hy - r * 0.62, hx + r * 0.72, hy - r * 0.35);
        ctx.quadraticCurveTo(hx + r * 0.8, hy + r * 0.45, hx + r * 0.05, hy + r * 0.82);
        ctx.quadraticCurveTo(hx - r * 0.7, hy + r * 0.45, hx - r * 0.62, hy - r * 0.35);
        ctx.closePath();
        fs(ctx, '#f4f4f8', 1.6);
        for (const sd of [-1, 1]) {
          ellipse(ctx, hx + r * 0.05 + sd * r * 0.3, hy - r * 0.02, r * 0.15, r * 0.1, sd * 0.3);
          ctx.fillStyle = '#1d1d2b';
          ctx.fill();
        }
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineWidth = r * 0.18;
        ctx.strokeStyle = '#d62828';
        ctx.beginPath();
        ctx.moveTo(hx - r * 0.42, hy - r * 0.38);
        ctx.lineTo(hx + r * 0.5, hy + r * 0.55);
        ctx.moveTo(hx + r * 0.52, hy - r * 0.38);
        ctx.lineTo(hx - r * 0.4, hy + r * 0.55);
        ctx.stroke();
        ctx.restore();
      }
      return;
    } else {
      circle(ctx, hx, hy, L.hood ? r * 0.88 : r);
      fs(ctx, skin);
    }

    if (has(L, 'halfmetal')) {
      ctx.save();
      circle(ctx, hx, hy, r);
      ctx.clip();
      ctx.fillStyle = L.top || '#dfe3ea';
      ctx.fillRect(hx - r * 1.2, hy - r * 1.2, r * 2.4, r * 2.4);
      if (!P.back) {
        ellipse(ctx, hx - r * 0.35, hy + r * 0.22, r * 0.58, r * 0.7);
        ctx.fillStyle = skin;
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = OUT;
        ctx.stroke();
      }
      ctx.strokeStyle = U.shade(L.top || '#dfe3ea', -0.35);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx + r * 0.1, hy - r * 1.0);
      ctx.lineTo(hx + r * 0.1, hy - r * 0.55);
      ctx.moveTo(hx + r * 0.6, hy + r * 0.5);
      ctx.lineTo(hx + r * 0.95, hy + r * 0.5);
      ctx.stroke();
      ctx.restore();
      circle(ctx, hx, hy, r);
      fs(ctx, null);
      if (L.trim) {
        ctx.beginPath();
        ctx.arc(hx, hy, r * 0.8, Math.PI * 1.15, Math.PI * 1.85);
        ctx.lineWidth = 2;
        ctx.strokeStyle = L.trim;
        ctx.stroke();
      }
    }

    // arc
    let fx = hx + r * 0.06, fy = hy + r * 0.12, fr = r;
    if (L.hood) {
      fy = hy + r * 0.12;
      fr = r * 0.85;
    }
    if (has(L, 'cowl') || has(L, 'flash_cowl') || has(L, 'light_hood')) {
      fy = hy + r * 0.18;
      fr = r * 0.82;
    }

    if (!P.back) {
      if (has(L, 'seemore')) {
        ctx.save();
        circle(ctx, hx, hy, r * 1.12);
        ctx.clip();
        ctx.beginPath();
        ctx.rect(hx - r * 1.3, hy - r * 1.3, r * 2.6, r * 1.62);
        ctx.fillStyle = '#4a4a5a';
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(hx, hy, r * 1.12, Math.PI * 0.92, Math.PI * 2.08);
        ctx.lineWidth = LW;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        circle(ctx, hx + r * 0.05, hy - r * 0.2, r * 0.62);
        fs(ctx, '#ffffff');
        circle(ctx, hx + r * 0.1, hy - r * 0.18, r * 0.36);
        ctx.fillStyle = P.ko ? '#888' : '#d62828';
        ctx.fill();
        circle(ctx, hx + r * 0.12, hy - r * 0.18, r * 0.16);
        ctx.fillStyle = '#111';
        ctx.fill();
        circle(ctx, hx + r * 0.22, hy - r * 0.3, r * 0.08);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      // pír
      if (!L.metal && L.eyes !== 'robot' && !has(L, 'seemore')) {
        ctx.save();
        ctx.globalAlpha *= 0.28;
        for (const sd of [-1, 1]) {
          ellipse(ctx, fx + sd * fr * 0.55, fy + fr * 0.3, fr * 0.13, fr * 0.08);
          ctx.fillStyle = '#ff6b8a';
          ctx.fill();
        }
        ctx.restore();
      }
      drawEyes(ctx, L, fx, fy, fr, P);
      drawMouth(ctx, L, fx, fy, fr, P);
      if (has(L, 'mustache')) {
        ctx.beginPath();
        const my = fy + fr * 0.3;
        ctx.moveTo(fx, my);
        ctx.quadraticCurveTo(fx - fr * 0.25, my - fr * 0.12, fx - fr * 0.45, my + fr * 0.02);
        ctx.quadraticCurveTo(fx - fr * 0.25, my + fr * 0.14, fx, my + fr * 0.06);
        ctx.quadraticCurveTo(fx + fr * 0.25, my + fr * 0.14, fx + fr * 0.45, my + fr * 0.02);
        ctx.quadraticCurveTo(fx + fr * 0.25, my - fr * 0.12, fx, my);
        fs(ctx, L.hairColor && L.hairColor !== '#e8e8f0' ? L.hairColor : '#f4f4f8', 1.4);
      }
      if (has(L, 'eyepatch')) {
        ctx.beginPath();
        ctx.moveTo(fx - fr * 0.95, fy - fr * 0.35);
        ctx.lineTo(fx + fr * 0.9, fy + fr * 0.15);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#1d1d2b';
        ctx.stroke();
        ellipse(ctx, fx + fr * 0.37, fy + fr * 0.02, fr * 0.2, fr * 0.17);
        fs(ctx, '#1d1d2b', 1.2);
      }
      if (has(L, 'monocle')) {
        circle(ctx, fx + fr * 0.37, fy + fr * 0.02, fr * 0.2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffd23f';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx + fr * 0.5, fy + fr * 0.16);
        ctx.quadraticCurveTo(fx + fr * 0.7, fy + fr * 0.6, fx + fr * 0.55, fy + fr * 0.95);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // ---- elülső rétegek ----
    if (has(L, 'flash_cowl')) {
      // vörös tincs kilóg a csuklya tetején
      ctx.beginPath();
      ctx.moveTo(hx - r * 0.25, hy - r * 0.92);
      ctx.lineTo(hx - r * 0.05, hy - r * 1.3);
      ctx.lineTo(hx + r * 0.1, hy - r * 0.95);
      ctx.lineTo(hx + r * 0.35, hy - r * 1.22);
      ctx.lineTo(hx + r * 0.4, hy - r * 0.88);
      ctx.closePath();
      fs(ctx, L.hairColor);
    } else if (!has(L, 'cowl') && !has(L, 'light_hood') && !has(L, 'seemore')) {
      drawHairFront(ctx, L, hx, hy, L.hood ? r * 0.88 : r, P);
    }
    if (L.hood && !P.back) {
      // csuklya pereme
      ctx.beginPath();
      ctx.arc(hx, hy + r * 0.05, r * 0.98, Math.PI * 1.02, Math.PI * 1.98);
      ctx.lineWidth = r * 0.14;
      ctx.strokeStyle = U.shade(L.cloak, -0.25);
      ctx.stroke();
    }
    if (has(L, 'gem')) {
      ctx.beginPath();
      const gy = L.hood ? hy - r * 0.4 : hy - r * 0.45;
      ctx.moveTo(hx + r * 0.06, gy - r * 0.1);
      ctx.lineTo(hx + r * 0.14, gy);
      ctx.lineTo(hx + r * 0.06, gy + r * 0.1);
      ctx.lineTo(hx - r * 0.02, gy);
      ctx.closePath();
      fs(ctx, '#e0103a', 1.1);
    }
    if (has(L, 'headband')) {
      const by = hy - r * 0.42;
      ctx.save();
      circle(ctx, hx, hy, r * 1.06);
      ctx.clip();
      ctx.fillStyle = L.bandColor || '#d62828';
      ctx.fillRect(hx - r * 1.2, by - r * 0.12, r * 2.4, r * 0.24);
      ctx.restore();
      const sw = Math.sin(P.t * 7) * r * 0.12;
      ctx.beginPath();
      ctx.moveTo(hx - r * 0.95, by);
      ctx.lineTo(hx - r * 1.65, by + r * 0.15 + sw);
      ctx.lineTo(hx - r * 1.55, by + r * 0.38 + sw);
      ctx.closePath();
      fs(ctx, L.bandColor || '#d62828', 1.4);
    }
    if (has(L, 'goggles_up')) {
      const gy = hy - r * 0.62;
      ctx.beginPath();
      ctx.moveTo(hx - r * 1.0, gy + r * 0.12);
      ctx.quadraticCurveTo(hx, gy - r * 0.15, hx + r * 1.0, gy + r * 0.12);
      ctx.lineWidth = r * 0.14;
      ctx.strokeStyle = '#6b3f1d';
      ctx.stroke();
      for (const sd of [-1, 1]) {
        circle(ctx, hx + sd * r * 0.32, gy, r * 0.2);
        fs(ctx, '#8fd3ff', 1.5);
      }
    }
    if (has(L, 'tiara')) {
      ctx.beginPath();
      ctx.arc(hx, hy + r * 0.3, r * 0.98, Math.PI * 1.25, Math.PI * 1.75);
      ctx.lineWidth = r * 0.12;
      ctx.strokeStyle = '#ffd23f';
      ctx.stroke();
      circle(ctx, hx + r * 0.05, hy - r * 0.68, r * 0.1);
      fs(ctx, '#2ecc71', 1.2);
    }
    if (has(L, 'bow')) {
      const bx = hx + r * 0.55, by = hy - r * 0.9;
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + sd * r * 0.45, by - r * 0.28);
        ctx.lineTo(bx + sd * r * 0.45, by + r * 0.28);
        ctx.closePath();
        fs(ctx, L.bowColor || '#ff4fa3', 1.4);
      }
      circle(ctx, bx, by, r * 0.1);
      fs(ctx, L.bowColor || '#ff4fa3', 1.2);
    }
    if (has(L, 'antenna')) {
      ctx.beginPath();
      ctx.moveTo(hx, hy - r);
      ctx.lineTo(hx + r * 0.1, hy - r * 1.55);
      ctx.lineWidth = 2;
      ctx.strokeStyle = OUT;
      ctx.stroke();
      circle(ctx, hx + r * 0.1, hy - r * 1.6, r * 0.14);
      fs(ctx, Math.sin(P.t * 6) > 0 ? '#ff4f4f' : '#ffb0b0', 1.2);
    }
    if (L.hairStreak && !P.back) {
      ctx.beginPath();
      ctx.moveTo(hx - r * 0.25, hy - r * 1.0);
      ctx.quadraticCurveTo(hx - r * 0.45, hy - r * 0.6, hx - r * 0.75, hy - r * 0.2);
      ctx.lineWidth = r * 0.14;
      ctx.strokeStyle = L.hairStreak;
      ctx.stroke();
    }
    if (has(L, 'ears_bat')) {
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(hx + sd * r * 0.3, hy - r * 0.9);
        ctx.lineTo(hx + sd * r * 0.62, hy - r * 1.55);
        ctx.lineTo(hx + sd * r * 0.8, hy - r * 0.62);
        ctx.closePath();
        fs(ctx, L.cowlColor || '#1d1d2b');
      }
    }
    if (has(L, 'antlers')) {
      ctx.save();
      ctx.lineCap = 'round';
      for (const sd of [-1, 1]) {
        ctx.strokeStyle = OUT;
        ctx.lineWidth = r * 0.2;
        ctx.beginPath();
        ctx.moveTo(hx + sd * r * 0.45, hy - r * 0.85);
        ctx.lineTo(hx + sd * r * 0.75, hy - r * 1.6);
        ctx.moveTo(hx + sd * r * 0.62, hy - r * 1.28);
        ctx.lineTo(hx + sd * r * 1.05, hy - r * 1.4);
        ctx.moveTo(hx + sd * r * 0.72, hy - r * 1.52);
        ctx.lineTo(hx + sd * r * 0.55, hy - r * 1.85);
        ctx.stroke();
        ctx.strokeStyle = '#a0703a';
        ctx.lineWidth = r * 0.12;
        ctx.stroke();
      }
      ctx.restore();
    }
    if (has(L, 'red_nose') && !P.back) {
      circle(ctx, hx + r * 0.08, hy + r * 0.3, r * 0.14);
      fs(ctx, '#ff2a2a', 1.4);
      circle(ctx, hx + r * 0.04, hy + r * 0.26, r * 0.04);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
    if (has(L, 'beret')) {
      ellipse(ctx, hx - r * 0.1, hy - r * 0.86, r * 0.95, r * 0.34, -0.2);
      fs(ctx, L.hatColor || '#d62828');
      circle(ctx, hx - r * 0.1, hy - r * 1.2, r * 0.08);
      fs(ctx, L.hatColor || '#d62828', 1.2);
    }
    if (has(L, 'chef_hat')) {
      rr(ctx, hx - r * 0.7, hy - r * 1.12, r * 1.4, r * 0.38, r * 0.08);
      fs(ctx, '#ffffff');
      for (const [ox, oy, rad] of [[-0.45, -1.35, 0.38], [0.45, -1.35, 0.38], [0, -1.55, 0.45]]) {
        circle(ctx, hx + ox * r, hy + oy * r, rad * r);
        fs(ctx, '#ffffff');
      }
      rr(ctx, hx - r * 0.66, hy - r * 1.1, r * 1.32, r * 0.3, r * 0.06);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    if (has(L, 'pirate_hat')) {
      ctx.beginPath();
      ctx.moveTo(hx - r * 1.35, hy - r * 0.62);
      ctx.quadraticCurveTo(hx - r * 0.8, hy - r * 1.65, hx, hy - r * 1.25);
      ctx.quadraticCurveTo(hx + r * 0.8, hy - r * 1.65, hx + r * 1.35, hy - r * 0.62);
      ctx.quadraticCurveTo(hx, hy - r * 0.95, hx - r * 1.35, hy - r * 0.62);
      ctx.closePath();
      fs(ctx, '#1d1d2b');
      circle(ctx, hx, hy - r * 1.05, r * 0.14);
      fs(ctx, '#f4f4f8', 1.2);
    }
    if (has(L, 'cap')) {
      const c = L.hatColor || '#d62828';
      ctx.beginPath();
      ctx.arc(hx, hy - r * 0.1, r * 1.04, Math.PI * 1.05, Math.PI * 1.95);
      ctx.quadraticCurveTo(hx, hy - r * 0.62, hx - r * 1.0, hy - r * 0.4);
      ctx.closePath();
      fs(ctx, c);
      ellipse(ctx, hx + r * 0.85, hy - r * 0.42, r * 0.55, r * 0.14, 0.1);
      fs(ctx, U.shade(c, -0.2), 1.6);
    }
    if (has(L, 'cowboy_hat')) {
      const c = L.hatColor || '#8b5a2b';
      ellipse(ctx, hx, hy - r * 0.72, r * 1.45, r * 0.3, -0.06);
      fs(ctx, c);
      ctx.beginPath();
      ctx.moveTo(hx - r * 0.62, hy - r * 0.78);
      ctx.quadraticCurveTo(hx - r * 0.7, hy - r * 1.5, hx - r * 0.2, hy - r * 1.42);
      ctx.quadraticCurveTo(hx, hy - r * 1.25, hx + r * 0.2, hy - r * 1.42);
      ctx.quadraticCurveTo(hx + r * 0.7, hy - r * 1.5, hx + r * 0.62, hy - r * 0.78);
      ctx.closePath();
      fs(ctx, c);
      ctx.fillStyle = U.shade(c, -0.35);
      ctx.fillRect(hx - r * 0.6, hy - r * 0.95, r * 1.2, r * 0.13);
    }
    if (has(L, 'top_hat')) {
      const c = L.hatColor || '#1d1d2b';
      const top = hy - r * 0.8;
      ellipse(ctx, hx, top, r * 1.05, r * 0.22);
      fs(ctx, c);
      rr(ctx, hx - r * 0.62, top - r * 1.05, r * 1.24, r * 1.05, r * 0.08);
      fs(ctx, c);
      ctx.fillStyle = L.hatColor === '#1d1d2b' ? '#d62828' : '#7fe0b5';
      ctx.fillRect(hx - r * 0.62, top - r * 0.32, r * 1.24, r * 0.2);
      ellipse(ctx, hx, top - r * 1.05, r * 0.62, r * 0.12);
      fs(ctx, U.shade(c, 0.15), 1.4);
    }
    if (has(L, 'nightcap')) {
      const c = L.hatColor || '#ff9ecd';
      ctx.beginPath();
      ctx.moveTo(hx - r * 0.95, hy - r * 0.45);
      ctx.quadraticCurveTo(hx - r * 0.2, hy - r * 1.6, hx + r * 1.4, hy - r * 0.9);
      ctx.quadraticCurveTo(hx + r * 0.6, hy - r * 1.0, hx + r * 0.98, hy - r * 0.4);
      ctx.quadraticCurveTo(hx, hy - r * 0.75, hx - r * 0.95, hy - r * 0.45);
      ctx.closePath();
      fs(ctx, c);
      circle(ctx, hx + r * 1.45, hy - r * 0.85, r * 0.18);
      fs(ctx, '#ffffff', 1.3);
    }
  }

  // ---------- Kar ----------
  function arm(ctx, sx, sy, side, a, len, w, sleeve, hand, L) {
    const dx = side * Math.sin(a), dy = Math.cos(a);
    const ex = sx + dx * len, ey = sy + dy * len;
    capsule(ctx, sx, sy, ex, ey, w, sleeve);
    if (L.fins) {
      ctx.beginPath();
      const mx = sx + dx * len * 0.55, my = sy + dy * len * 0.55;
      ctx.moveTo(mx, my);
      ctx.lineTo(mx - dy * side * 7 + dx * 4, my + dx * side * 7 + dy * 4);
      ctx.lineTo(mx + dx * 7, my + dy * 7);
      ctx.closePath();
      fs(ctx, L.fins, 1.2);
    }
    circle(ctx, ex, ey, w * 0.62);
    fs(ctx, hand, 1.8);
    return { x: ex, y: ey };
  }

  // ---------- Kiegészítők a kézben ----------
  function heldItem(ctx, L, hand, P) {
    if (has(L, 'staff')) {
      ctx.save();
      ctx.translate(hand.x, hand.y);
      ctx.rotate(-0.35 + (P.attack ? 1.2 : 0));
      capsule(ctx, 0, -34, 0, 22, 3.4, '#8a8a96');
      ctx.restore();
    }
    if (has(L, 'wand')) {
      ctx.save();
      ctx.translate(hand.x, hand.y);
      ctx.rotate(-0.6 + (P.attack ? 1.3 : 0));
      capsule(ctx, 0, -16, 0, 4, 2.4, '#1d1d2b');
      TT.D.star(ctx, 0, -19, 4.5, 2, 5);
      fs(ctx, '#ffd23f', 1);
      ctx.restore();
    }
    if (has(L, 'remote')) {
      ctx.save();
      ctx.translate(hand.x, hand.y);
      ctx.rotate(0.3);
      rr(ctx, -3.5, -12, 7, 14, 2);
      fs(ctx, '#2a2a36', 1.4);
      circle(ctx, 0, -8, 1.6);
      ctx.fillStyle = '#ff4f4f';
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Humanoid test ----------
  function human(ctx, L, P) {
    const big = L.body === 'big' || L.body === 'demon';
    const tw = big ? 40 : 30;
    const th = big ? 32 : 27;
    const top = big ? -47 : -40;
    const headR = big ? 25 : 27;
    const headY = top - headR + 4 + (big ? 2 : 0);
    const legW = big ? 12 : 9.5;
    const armW = big ? 11 : 8;
    const armLen = big ? 22 : 19;
    const bob = P.bob || 0;
    const skin = L.skin || '#f6cba8';
    const sleeve = L.sleeves || L.top || '#888';
    const hand = L.gloves || skin;

    // ---- hátul ----
    drawHead(ctx, L, 0, headY + bob * 1.3, headR, P, 'back');
    if (has(L, 'wings_bee')) {
      ctx.save();
      ctx.globalAlpha *= 0.75;
      const fl = Math.sin(P.t * 30) * 0.2;
      for (const sd of [-1, 1]) {
        ellipse(ctx, sd * 18, top - 4 + bob, 16, 9, sd * (-0.6 + fl));
        fs(ctx, '#e6f7ff', 1.5);
      }
      ctx.restore();
    }
    if (has(L, 'spider_legs')) {
      for (const sd of [-1, 1]) {
        for (const k of [0, 1]) {
          const ang = -0.9 + k * 0.6 + Math.sin(P.t * 4 + k) * 0.08;
          const kx = sd * (18 + Math.cos(ang) * 14), ky = top + 6 + Math.sin(ang) * 14 + bob;
          capsule(ctx, sd * 6, top + 10 + bob, kx, ky, 3, '#9aa5b1');
          capsule(ctx, kx, ky, sd * (30 + k * 6), -2, 2.6, '#9aa5b1');
        }
      }
    }
    if (has(L, 'quiver')) {
      ctx.save();
      ctx.translate(-12, top + 10 + bob);
      ctx.rotate(-0.4);
      rr(ctx, -5, -18, 10, 26, 3);
      fs(ctx, '#8b5a2b');
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-3 + i * 3, -18);
        ctx.lineTo(-3 + i * 3, -26);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = OUT;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5 + i * 3, -26);
        ctx.lineTo(-3 + i * 3, -30);
        ctx.lineTo(-1 + i * 3, -26);
        ctx.fillStyle = '#d62828';
        ctx.fill();
      }
      ctx.restore();
    }
    const sway = Math.sin(P.t * 2.2) * 1.8 + (P.lean || 0) * -14;
    if (L.cape && !P.back) {
      ctx.beginPath();
      ctx.moveTo(-tw / 2 + 3, top + 4 + bob);
      ctx.lineTo(tw / 2 - 3, top + 4 + bob);
      ctx.quadraticCurveTo(tw / 2 + 10, -18, tw / 2 + 8 + sway, -3);
      ctx.lineTo(-tw / 2 - 8 + sway, -3);
      ctx.quadraticCurveTo(-tw / 2 - 10, -18, -tw / 2 + 3, top + 4 + bob);
      ctx.closePath();
      fs(ctx, L.cape);
      ctx.beginPath();
      ctx.moveTo(tw / 2 - 3, top + 6 + bob);
      ctx.quadraticCurveTo(tw / 2 + 8, -18, tw / 2 + 6 + sway, -4);
      ctx.lineTo(tw / 2 + 1 + sway, -4);
      ctx.quadraticCurveTo(tw / 2 + 2, -20, tw / 2 - 3, top + 6 + bob);
      ctx.closePath();
      ctx.fillStyle = L.capeIn || L.cape;
      ctx.fill();
    }
    if (L.cloak) {
      ctx.beginPath();
      ctx.moveTo(-10, top + bob);
      ctx.quadraticCurveTo(-tw / 2 - 18, -14, -tw / 2 - 12 + sway * 0.5, 0);
      ctx.lineTo(tw / 2 + 12 + sway * 0.5, 0);
      ctx.quadraticCurveTo(tw / 2 + 18, -14, 10, top + bob);
      ctx.closePath();
      fs(ctx, L.cloak);
    }

    // ---- lábak ----
    const lp = P.legPhase || 0;
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, Math.sin(lp + (sd > 0 ? Math.PI : 0))) * 4;
      const lx = sd * (big ? 9 : 6.5);
      capsule(ctx, lx, -16, lx, -4 - lift, legW, L.bottom || '#444');
      rr(ctx, lx - legW / 2 - 1.5 + 1.5, -7 - lift, legW + 3, 8, 3);
      fs(ctx, L.boots || '#222', 1.8);
    }

    // ---- törzs ----
    ctx.save();
    ctx.translate(0, bob);
    rr(ctx, -tw / 2, top, tw, th, big ? 12 : 9);
    fs(ctx, L.top || '#888');
    // nadrág alsó része
    ctx.save();
    rr(ctx, -tw / 2, top, tw, th, big ? 12 : 9);
    ctx.clip();
    ctx.fillStyle = L.bottom || '#444';
    ctx.fillRect(-tw / 2, top + th - 7, tw, 8);
    if (L.stripes) {
      ctx.fillStyle = L.stripes;
      for (let i = 0; i < 3; i++) ctx.fillRect(-tw / 2, top + 5 + i * 7, tw, 3.2);
    }
    if (L.stripe) {
      ctx.fillStyle = L.stripe;
      ctx.fillRect(-3, top, 6, th);
    }
    if (L.dots) {
      ctx.fillStyle = L.dots;
      for (let i = 0; i < 6; i++) {
        circle(ctx, -tw / 2 + 6 + (i % 3) * 9, top + 6 + Math.floor(i / 3) * 9, 1.8);
        ctx.fill();
      }
    }
    if (L.fur) {
      ellipse(ctx, 0, top + th * 0.45, tw * 0.3, th * 0.3);
      ctx.fillStyle = U.shade(L.top, 0.25);
      ctx.fill();
    }
    if (L.shirt) {
      ctx.beginPath();
      ctx.moveTo(-7, top);
      ctx.lineTo(0, top + 13);
      ctx.lineTo(7, top);
      ctx.closePath();
      ctx.fillStyle = L.shirt;
      ctx.fill();
    }
    if (L.tie) {
      ctx.beginPath();
      ctx.moveTo(-2.2, top + 1);
      ctx.lineTo(2.2, top + 1);
      ctx.lineTo(3.5, top + 13);
      ctx.lineTo(0, top + 16);
      ctx.lineTo(-3.5, top + 13);
      ctx.closePath();
      ctx.fillStyle = L.tie;
      ctx.fill();
    }
    if (L.apron) {
      rr(ctx, -tw / 2 + 5, top + 8, tw - 10, th, 4);
      fs(ctx, L.apron, 1.4);
    }
    if (L.shine) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(-tw / 2 + 4, top + 3, 3, th - 8);
      ctx.fillRect(-tw / 2 + 9, top + 3, 1.5, th - 12);
    }
    if (L.metal) {
      ctx.strokeStyle = U.shade(L.top, -0.3);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-tw / 2, top + th * 0.55);
      ctx.lineTo(tw / 2, top + th * 0.55);
      ctx.moveTo(0, top + th * 0.55);
      ctx.lineTo(0, top + th);
      ctx.stroke();
      if (L.trim) {
        ctx.strokeStyle = L.trim;
        ctx.lineWidth = 2;
        ctx.strokeRect(-tw / 2 + 3, top + 3, tw - 6, th - 10);
      }
    }
    ctx.restore();
    if (L.belt) {
      ctx.save();
      rr(ctx, -tw / 2, top, tw, th, big ? 12 : 9);
      ctx.clip();
      ctx.fillStyle = L.belt;
      ctx.fillRect(-tw / 2, top + th - 9, tw, 3.6);
      ctx.restore();
    }
    if (L.skirt) {
      ctx.beginPath();
      ctx.moveTo(-tw / 2 + 1, top + th - 8);
      ctx.lineTo(tw / 2 - 1, top + th - 8);
      ctx.lineTo(tw / 2 + 5, top + th + 4);
      ctx.lineTo(-tw / 2 - 5, top + th + 4);
      ctx.closePath();
      fs(ctx, L.bottom || L.top);
    }
    if (L.body === 'demon') {
      ctx.beginPath();
      ctx.moveTo(-tw / 2 + 1, top + th - 10);
      ctx.lineTo(tw / 2 - 1, top + th - 10);
      ctx.lineTo(tw / 2 + 8, -2);
      ctx.lineTo(-tw / 2 - 8, -2);
      ctx.closePath();
      fs(ctx, L.bottom);
    }
    if (L.armor) {
      for (const sd of [-1, 1]) {
        ellipse(ctx, sd * (tw / 2 - 1), top + 4, 8, 6);
        fs(ctx, L.armor);
      }
      rr(ctx, -tw / 2 + 5, top + 4, tw - 10, 12, 4);
      fs(ctx, L.armor, 1.6);
    }
    if (L.chest && !P.back) {
      const c = L.chest;
      if (c.sym) {
        const cx = -tw * 0.2, cy = top + 9;
        circle(ctx, cx, cy, 5.6);
        fs(ctx, c.color, 1.4);
        ctx.save();
        ctx.translate(cx, cy + 0.5);
        ctx.scale(P.facing || 1, 1);
        ctx.fillStyle = c.ink;
        ctx.font = TT.font(8);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.sym, 0, 0.5);
        ctx.restore();
      }
      if (c.lights) {
        ctx.save();
        ctx.shadowColor = c.lights;
        ctx.shadowBlur = 6;
        circle(ctx, 0, top + 10, 4.5);
        ctx.fillStyle = c.lights;
        ctx.fill();
        ctx.restore();
        circle(ctx, 0, top + 10, 4.5);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = OUT;
        ctx.stroke();
      }
      if (c.light) {
        ctx.save();
        ctx.shadowColor = c.light;
        ctx.shadowBlur = 10;
        TT.D.star(ctx, 0, top + 11, 7, 3, 8);
        ctx.fillStyle = c.light;
        ctx.fill();
        ctx.restore();
      }
      if (c.bolt) {
        ctx.beginPath();
        ctx.moveTo(2, top + 3);
        ctx.lineTo(-4, top + 12);
        ctx.lineTo(0, top + 12);
        ctx.lineTo(-2, top + 20);
        ctx.lineTo(5, top + 9);
        ctx.lineTo(1, top + 9);
        ctx.closePath();
        fs(ctx, c.bolt, 1.2);
      }
    }
    if (has(L, 'bandana')) {
      ctx.beginPath();
      ctx.moveTo(-10, top + 1);
      ctx.lineTo(10, top + 1);
      ctx.lineTo(0, top + 11);
      ctx.closePath();
      fs(ctx, L.bandColor || '#d62828', 1.4);
    }
    if (has(L, 'collar_gem')) {
      circle(ctx, 0, top + 3, 3.4);
      fs(ctx, '#2ecc71', 1.2);
    }
    if (L.cloak && !P.back) {
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sd * 5, top - 1);
        ctx.quadraticCurveTo(sd * (tw / 2 + 4), top + 2, sd * (tw / 2 + 6), top + 22);
        ctx.lineTo(sd * (tw / 2 - 4), top + 20);
        ctx.quadraticCurveTo(sd * (tw / 2 - 6), top + 6, sd * 5, top - 1);
        ctx.closePath();
        fs(ctx, L.cloak, 1.6);
      }
    }
    if (L.cape && P.back) {
      ctx.beginPath();
      ctx.moveTo(-tw / 2 + 2, top + 2);
      ctx.lineTo(tw / 2 - 2, top + 2);
      ctx.lineTo(tw / 2 + 7 + sway * 0.3, -3 - bob);
      ctx.lineTo(-tw / 2 - 7 + sway * 0.3, -3 - bob);
      ctx.closePath();
      fs(ctx, L.cape);
    }
    if (has(L, 'guitar') && !P.back) {
      ctx.save();
      ctx.translate(2, top + 18);
      ctx.rotate(-0.55);
      capsule(ctx, 0, 0, 0, -26, 3.5, '#3a2a1a');
      ellipse(ctx, 0, 6, 9, 11);
      fs(ctx, L.accent || '#d62828');
      circle(ctx, 0, 4, 2.8);
      ctx.fillStyle = OUT;
      ctx.fill();
      ctx.restore();
    }

    // ---- karok ----
    const shY = top + 6;
    let handFront, handBack;
    if (P.block) {
      capsule(ctx, -tw / 2 + 2, shY, 8, shY + 10, armW, sleeve);
      capsule(ctx, tw / 2 - 2, shY, -6, shY + 12, armW, sleeve);
      circle(ctx, 9, shY + 10, armW * 0.62);
      fs(ctx, hand, 1.8);
      circle(ctx, -7, shY + 12, armW * 0.62);
      fs(ctx, hand, 1.8);
      handFront = { x: 9, y: shY + 10 };
      handBack = { x: -7, y: shY + 12 };
    } else {
      const aF = P.armF != null ? P.armF : 0.22;
      const aB = P.armB != null ? P.armB : 0.22;
      handBack = arm(ctx, -tw / 2 + 2, shY, -1, aB, armLen, armW, sleeve, hand, L);
      if (has(L, 'cannon')) {
        const a = aF;
        const dx = Math.sin(a), dy = Math.cos(a);
        ctx.save();
        ctx.translate(tw / 2 - 2, shY);
        ctx.rotate(-a);
        rr(ctx, -armW * 0.8, 0, armW * 1.6, armLen + 6, 5);
        fs(ctx, '#8d99a6');
        ellipse(ctx, 0, armLen + 6, armW * 0.8, 3.5);
        fs(ctx, '#2a2a36', 1.4);
        ctx.restore();
        handFront = { x: tw / 2 - 2 + dx * (armLen + 6), y: shY + dy * (armLen + 6) };
      } else {
        handFront = arm(ctx, tw / 2 - 2, shY, 1, aF, armLen, armW, sleeve, hand, L);
      }
    }
    heldItem(ctx, L, handFront, P);
    if (has(L, 'pillow')) {
      rr(ctx, handBack.x - 9, handBack.y - 6, 18, 13, 5);
      fs(ctx, '#fff6fb', 1.6);
    }
    ctx.restore();

    // ---- fej ----
    drawHead(ctx, L, 0, headY + bob * 1.3, headR, P, 'front');
  }

  // ---------- Különleges testek ----------
  function rock(ctx, L, P) {
    const c = L.skin;
    const bob = P.bob || 0;
    for (const sd of [-1, 1]) {
      rr(ctx, sd * 11 - 7, -18, 14, 18, 3);
      fs(ctx, U.shade(c, -0.15));
    }
    ctx.save();
    ctx.translate(0, bob);
    ctx.beginPath();
    ctx.moveTo(-24, -58);
    ctx.lineTo(24, -58);
    ctx.lineTo(19, -15);
    ctx.lineTo(-19, -15);
    ctx.closePath();
    fs(ctx, c);
    ctx.strokeStyle = U.shade(c, -0.35);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-12, -50); ctx.lineTo(-6, -42); ctx.lineTo(-10, -32);
    ctx.moveTo(10, -46); ctx.lineTo(4, -36); ctx.lineTo(9, -26);
    ctx.moveTo(-20, -30); ctx.lineTo(18, -30);
    ctx.stroke();
    const aF = P.armF != null ? P.armF : 0.2, aB = P.armB != null ? P.armB : 0.2;
    for (const [sd, a] of [[-1, aB], [1, aF]]) {
      ctx.save();
      ctx.translate(sd * 24, -54);
      ctx.rotate(-sd * a);
      rr(ctx, -7, 0, 14, 28, 4);
      fs(ctx, U.shade(c, -0.08));
      rr(ctx, -9, 24, 18, 13, 4);
      fs(ctx, U.shade(c, -0.2));
      ctx.restore();
    }
    rr(ctx, -15, -80, 30, 24, 6);
    fs(ctx, c);
    drawEyes(ctx, L, 2, -70, 15, P);
    ctx.restore();
  }

  function blob(ctx, L, P) {
    const c = L.skin;
    const t = P.t;
    const bob = P.bob || 0;
    ctx.beginPath();
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (i / n) * Math.PI;
      const wob = Math.sin(t * 3 + i * 1.3) * 3;
      const r = 38 + wob + (i === 5 || i === 13 ? 8 : 0);
      const x = Math.cos(a) * r * 1.0;
      const y = -36 + Math.sin(a) * (44 + wob) + bob;
      if (i === 0) ctx.moveTo(x, -2);
      ctx.lineTo(x, Math.min(-2, y));
    }
    ctx.quadraticCurveTo(30, 4, 0, 2);
    ctx.quadraticCurveTo(-30, 4, -38, -2);
    ctx.closePath();
    fs(ctx, c);
    for (const [bx, by, br] of [[-14, -28, 7], [12, -16, 5], [18, -40, 4], [-20, -10, 4]]) {
      circle(ctx, bx, by + bob, br);
      ctx.fillStyle = U.shade(c, 0.25);
      ctx.fill();
    }
    const aF = P.armF != null ? P.armF : 0.3;
    ctx.save();
    ctx.translate(34, -40 + bob);
    ctx.rotate(-aF);
    ellipse(ctx, 0, 14, 9, 16);
    fs(ctx, c);
    ctx.restore();
    drawEyes(ctx, L, 4, -58 + bob, 20, P);
    drawMouth(ctx, L, 4, -54 + bob, 20, P);
  }

  function worm(ctx, L, P) {
    const c = L.skin;
    const bob = P.bob || 0;
    const segs = [[0, -9, 20, 12], [2, -24, 18, 11], [3, -38, 17, 10]];
    segs.forEach(([x, y, rx, ry], i) => {
      ellipse(ctx, x + Math.sin(P.t * 3 + i) * 1.2, y + bob * (i / 3), rx, ry);
      fs(ctx, c);
      circle(ctx, x - rx * 0.4, y + bob * (i / 3), 2.5);
      ctx.fillStyle = L.spots;
      ctx.fill();
      circle(ctx, x + rx * 0.45, y + bob * (i / 3) - 2, 2);
      ctx.fill();
    });
    for (const sd of [-1, 1]) {
      circle(ctx, sd * 14, -2, 3.5);
      fs(ctx, U.shade(c, -0.1), 1.4);
    }
    const hy = -60 + bob;
    circle(ctx, 4, hy, 23);
    fs(ctx, c);
    ellipse(ctx, 4, hy - 16, 10, 5);
    ctx.fillStyle = U.shade(L.spots, 0.3);
    ctx.fill();
    drawEyes(ctx, L, 6, hy, 22, P);
    drawMouth(ctx, L, 6, hy, 22, P);
    ctx.save();
    ctx.globalAlpha *= 0.3;
    for (const sd of [-1, 1]) {
      ellipse(ctx, 6 + sd * 12, hy + 7, 3.5, 2.2);
      ctx.fillStyle = '#ff6b8a';
      ctx.fill();
    }
    ctx.restore();
  }

  function robot(ctx, L, P) {
    const c = L.skin;
    const bob = P.bob || 0;
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, Math.sin((P.legPhase || 0) + (sd > 0 ? Math.PI : 0))) * 4;
      capsule(ctx, sd * 7, -18, sd * 7, -5 - lift, 7, '#9aa5b1');
      rr(ctx, sd * 7 - 7, -8 - lift, 14, 8, 3);
      fs(ctx, U.shade(c, -0.3), 1.6);
    }
    ctx.save();
    ctx.translate(0, bob);
    rr(ctx, -17, -46, 34, 30, 7);
    fs(ctx, c);
    rr(ctx, -10, -40, 20, 12, 3);
    fs(ctx, '#ffffff', 1.4);
    ctx.fillStyle = OUT;
    for (let i = 0; i < 8; i++) ctx.fillRect(-8 + i * 2.2, -38, i % 3 === 0 ? 1.4 : 0.8, 8);
    const aF = P.armF != null ? P.armF : 0.25, aB = P.armB != null ? P.armB : 0.25;
    const hb = arm(ctx, -15, -40, -1, aB, 18, 6, '#9aa5b1', U.shade(c, -0.2), L);
    const hf = arm(ctx, 15, -40, 1, aF, 18, 6, '#9aa5b1', U.shade(c, -0.2), L);
    void hb; void hf;
    ctx.restore();
    const hy = -66 + bob * 1.3;
    rr(ctx, -21, hy - 18, 42, 34, 10);
    fs(ctx, c);
    rr(ctx, -16, hy - 9, 32, 16, 6);
    fs(ctx, '#1d2a3a', 1.6);
    drawEyes(ctx, L, 0, hy - 1, 20, P);
    if (has(L, 'antenna')) {
      ctx.beginPath();
      ctx.moveTo(0, hy - 18);
      ctx.lineTo(2, hy - 30);
      ctx.lineWidth = 2;
      ctx.strokeStyle = OUT;
      ctx.stroke();
      circle(ctx, 2, hy - 32, 3.2);
      fs(ctx, Math.sin(P.t * 6) > 0 ? '#ff4f4f' : '#ffb0b0', 1.2);
    }
  }

  function box(ctx, L, P) {
    const c = L.skin;
    const bob = P.bob || 0;
    for (const sd of [-1, 1]) {
      capsule(ctx, sd * 9, -14, sd * 9, -4, 7, '#8d6b45');
      rr(ctx, sd * 9 - 7, -7, 14, 7, 3);
      fs(ctx, '#5a4028', 1.6);
    }
    ctx.save();
    ctx.translate(0, bob);
    const x = -24, y = -72, w = 44, h = 56, d = 10;
    // oldal
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + d, y - d);
    ctx.lineTo(x + w + d, y + h - d);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    fs(ctx, U.shade(c, -0.25));
    // teteje
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + d, y - d);
    ctx.lineTo(x + w + d, y - d);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    fs(ctx, U.shade(c, 0.15));
    // fülek
    const flap = Math.sin(P.t * 4) * 0.15;
    ctx.save();
    ctx.translate(x + 2, y - 2);
    ctx.rotate(-0.5 - flap);
    ctx.fillStyle = U.shade(c, 0.05);
    ctx.fillRect(-14, -3, 16, 6);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-14, -3, 16, 6);
    ctx.restore();
    // eleje
    rr(ctx, x, y, w, h, 2);
    fs(ctx, c);
    ctx.fillStyle = 'rgba(230,210,170,0.8)';
    ctx.fillRect(x + w / 2 - 4, y, 8, h);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + 4, y + h - 14, 12, 8);
    const aF = P.armF != null ? P.armF : 0.3, aB = P.armB != null ? P.armB : 0.3;
    arm(ctx, x, y + 26, -1, aB, 16, 6, '#8d6b45', '#5a4028', L);
    arm(ctx, x + w + 4, y + 22, 1, aF, 16, 6, '#8d6b45', '#5a4028', L);
    rr(ctx, x + 7, y + 10, w - 14, 18, 5);
    fs(ctx, '#1d2a3a', 1.6);
    drawEyes(ctx, L, x + w / 2, y + 19, 18, P);
    drawMouth(ctx, L, x + w / 2, y + 26, 16, P);
    ctx.restore();
  }

  function jar(ctx, L, P) {
    const c = L.skin;
    const bob = P.bob || 0;
    // lánctalp/kerekek
    rr(ctx, -24, -14, 48, 14, 7);
    fs(ctx, '#3a3a46');
    for (let i = 0; i < 4; i++) {
      circle(ctx, -16 + i * 10.7, -7, 4);
      fs(ctx, '#9aa5b1', 1.2);
    }
    ctx.save();
    ctx.translate(0, bob);
    rr(ctx, -20, -46, 40, 34, 6);
    fs(ctx, c);
    rr(ctx, -13, -40, 26, 10, 3);
    fs(ctx, '#1d2a3a', 1.4);
    ctx.save();
    ctx.shadowColor = '#ff4f4f';
    ctx.shadowBlur = 6;
    ctx.fillStyle = Math.sin(P.t * 4) > 0 ? '#ff4f4f' : '#ff9e9e';
    ctx.fillRect(-9, -37, 18, 4);
    ctx.restore();
    const aF = P.armF != null ? P.armF : 0.25, aB = P.armB != null ? P.armB : 0.25;
    arm(ctx, -19, -40, -1, aB, 18, 5, '#9aa5b1', U.shade(c, -0.2), L);
    arm(ctx, 19, -40, 1, aF, 18, 5, '#9aa5b1', U.shade(c, -0.2), L);
    // üvegbura az aggyal
    circle(ctx, 0, -66, 23);
    ctx.fillStyle = 'rgba(190,240,255,0.35)';
    ctx.fill();
    ellipse(ctx, 0, -64, 16, 13);
    fs(ctx, '#ff9ecd', 1.6);
    ctx.strokeStyle = '#d65a9a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, -76);
    ctx.lineTo(0, -52);
    ctx.moveTo(-10, -70);
    ctx.quadraticCurveTo(-4, -66, -10, -60);
    ctx.moveTo(10, -70);
    ctx.quadraticCurveTo(4, -66, 10, -60);
    ctx.stroke();
    circle(ctx, 0, -66, 23);
    ctx.lineWidth = LW;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(-9, -76, 4, 7, 0.5, 0, Math.PI * 2);
    ctx.fill();
    rr(ctx, -16, -46, 32, 6, 2);
    fs(ctx, '#9aa5b1', 1.6);
    ctx.restore();
  }

  function twins(ctx, L, P) {
    for (const [ox, col, ph] of [[-13, L.top, 0], [13, L.top2, 1.7]]) {
      ctx.save();
      ctx.translate(ox, 0);
      ctx.scale(0.66, 0.66);
      const P2 = Object.assign({}, P, { bob: Math.sin(P.t * 9 + ph) * 1.6, legPhase: (P.legPhase || 0) + ph, seed: ph * 3 });
      human(ctx, Object.assign({}, L, { body: 'human', top: col, sleeves: col, chest: { sym: L.twinSym || 'M', color: '#ffffff', ink: col } }), P2);
      ctx.restore();
    }
  }

  // ---------- Festések (Festőműhely) ----------
  const PAINT_FX = {
    gold: (c) => U.mix(U.mix(c, '#ffc93c', 0.62), '#ffffff', 0.05),
    silver: (c) => {
      const [r, g, b] = U.hexToRgb(c);
      const l = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
      return U.mix(U.rgbToHex(l * 255, l * 255, l * 255), '#dfe6ef', 0.35);
    },
    shadow: (c) => U.mix(c, '#241a3a', 0.62),
    neon: (c) => {
      const [r, g, b] = U.hexToRgb(c);
      const l = (r + g + b) / 765;
      return l > 0.5 ? U.mix(c, '#3dfff2', 0.55) : U.mix(c, '#ff2fd2', 0.5);
    },
    candy: (c) => U.mix(c, '#ffb4d8', 0.42),
    ice: (c) => U.mix(c, '#bfefff', 0.55),
  };
  const HEX = /^#[0-9a-fA-F]{3,6}$/;
  function paintValue(v, fx) {
    if (typeof v === 'string' && HEX.test(v)) return fx(v);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o = {};
      for (const k of Object.keys(v)) o[k] = paintValue(v[k], fx);
      return o;
    }
    return v;
  }
  const paintCache = new Map();
  A.paintedLook = function (fig, paint) {
    if (!paint || !PAINT_FX[paint]) return fig.look;
    const key = fig.id + '|' + paint;
    let L = paintCache.get(key);
    if (!L) {
      L = paintValue(fig.look, PAINT_FX[paint]);
      if (paint === 'gold' || paint === 'silver') L.gold = true;
      paintCache.set(key, L);
    }
    return L;
  };

  // ---------- Fő belépési pont ----------
  // fig: figura vagy {look}, x/y: talppont, s: méret, o: beállítások
  A.drawFigure = function (ctx, fig, x, y, s, o) {
    o = o || {};
    const L = o.paint ? A.paintedLook(fig, o.paint) : fig.look || {};
    const t = o.t != null ? o.t : TT.time;
    const facing = o.facing || 1;
    const scale = s * (L.scale || 1);
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.translate(x, y);
    if (o.pedestal !== false) A.drawPedestal(ctx, 0, 0, s, fig.rarity || o.rarity, o);
    const pedLift = o.pedestal !== false ? -2 * s : 0;
    ctx.translate(0, pedLift);

    // póz
    const pose = o.pose || 'idle';
    const pt = o.poseT || 0;
    const P = { t, facing, seed: (U.hash(fig.id || 'x') % 100) / 10, talk: o.talk };
    let lean = 0, sx = 1, sy = 1, jump = 0;
    P.bob = Math.sin(t * 3.2 + P.seed) * 1.2;
    P.armF = 0.22 + Math.sin(t * 3.2 + P.seed) * 0.05;
    P.armB = 0.22 - Math.sin(t * 3.2 + P.seed) * 0.05;
    switch (pose) {
      case 'walk':
        P.legPhase = o.walk || 0;
        P.armF = 0.25 + Math.sin(o.walk || 0) * 0.5;
        P.armB = 0.25 - Math.sin(o.walk || 0) * 0.5;
        P.bob = -Math.abs(Math.sin(o.walk || 0)) * 1.5;
        break;
      case 'windup':
        lean = -0.1;
        P.armF = -0.5;
        P.armB = 0.6;
        break;
      case 'attack':
        lean = 0.16;
        P.armF = 1.55;
        P.armB = 0.5;
        P.attack = true;
        break;
      case 'cast':
        lean = 0.05;
        P.armF = 1.9;
        P.armB = 1.9;
        P.attack = true;
        break;
      case 'hurt':
        lean = -0.22;
        P.armF = 0.9;
        P.armB = 0.9;
        P.hurt = true;
        sx = 1.06;
        sy = 0.94;
        break;
      case 'block':
        P.block = true;
        sy = 0.96;
        break;
      case 'cheer':
        P.armF = 2.7 + Math.sin(t * 10) * 0.2;
        P.armB = 2.7 - Math.sin(t * 10) * 0.2;
        P.cheer = true;
        jump = Math.abs(Math.sin(t * 6)) * 6;
        break;
      case 'ko':
        P.ko = true;
        P.armF = 1.2;
        P.armB = 1.2;
        break;
      case 'stun':
        lean = Math.sin(t * 5) * 0.08;
        P.armF = 0.5;
        P.armB = 0.5;
        P.ko = Math.sin(t * 2) > 0.6;
        break;
      default:
        break;
    }
    if (o.lean) lean += o.lean;
    void pt;
    P.lean = lean;
    P.back = !!o.back;

    ctx.scale(facing * scale * sx, scale * sy);
    ctx.translate(0, -jump);
    if (lean) ctx.rotate(lean);
    if (o.flash > 0 && 'filter' in ctx) ctx.filter = `brightness(${1 + o.flash * 2.2})`;

    const img = TT.custom && fig.id && TT.custom.figures[fig.id];
    const m3 = !o.noCustom && fig.id && TT.model3d && TT.settings.fig3d !== false && TT.model3d.has(fig.id);
    let r3 = m3 && A.pose3d(pose, t, P.seed, o);
    if (r3 && TT.model3d.animated(fig.id)) {
      // saját TT2-es animáció: a mozdulatot az szolgáltatja, a figura csak oldalra fordul
      // (a TT2 harci modelljei alapból 45°-kal el vannak fordítva a kamerától)
      const turn = (o.facing != null ? 0.55 : 0.3) * (facing < 0 ? -1 : 1);
      r3 = { yaw: (o.yaw3d != null ? o.yaw3d : -turn) - Math.PI / 4, pitch: 0.14, anim: o.anim3d || A.anim3dOf(pose, t) };
    } else if (r3 && o.yaw3d != null) r3.yaw = o.yaw3d;
    else if (r3 && facing < 0) r3.yaw = -r3.yaw;
    // a kicsiben rajzolt (pl. padon ülő) figurákhoz elég a fele felbontás
    if (r3) {
      r3.res = Math.abs(scale) < 1.2 ? 256 : 512;
      // élő (folyamatosan animált) kis figura, pl. a városban sétáló játékos: nem ritkítjuk a frissítését
      r3.live = !!o.live3d;
    }
    const c3 = r3 && TT.model3d.render(fig.id, r3);
    if (c3) {
      // valódi 3D figura: a közös WebGL vászonról másolva (a figura 1 egység = 104 képpont magas)
      const M3 = TT.model3d;
      const u = 104;
      ctx.translate(0, P.bob);
      // a 3D figura valóban megfordul, nem tükröződik (pl. Slade maszkja a helyén marad)
      if (facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(c3, (-u * M3.SPAN) / 2, -u * (M3.SPAN - M3.FOOT), u * M3.SPAN, u * M3.SPAN);
    } else if (img && !o.noCustom) {
      const h = 104;
      const w = (img.width / img.height) * h;
      ctx.translate(0, P.bob);
      ctx.drawImage(img, -w / 2, -h, w, h);
    } else {
      switch (L.body) {
        case 'rock': rock(ctx, L, P); break;
        case 'blob': blob(ctx, L, P); break;
        case 'worm': worm(ctx, L, P); break;
        case 'robot': robot(ctx, L, P); break;
        case 'box': box(ctx, L, P); break;
        case 'twins': twins(ctx, L, P); break;
        case 'jar': jar(ctx, L, P); break;
        default: human(ctx, L, P); break;
      }
      if (L.gold && o.sparkle !== false) {
        const k = (t * 0.7) % 1;
        ctx.save();
        ctx.globalAlpha *= 0.85 * Math.sin(k * Math.PI);
        TT.D.star(ctx, -18 + k * 36, -95 + k * 60, 5, 1.6, 4);
        ctx.fillStyle = '#fffbe0';
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  };

  // A 3D figura elfordítása pózonként (a 2D tükrözés a bal oldaliakat a másik irányba fordítja)
  A.pose3d = function (pose, t, seed, o) {
    const sway = Math.sin(t * 1.3 + seed) * 0.1;
    const side = o.facing != null ? 0.55 : 0.3;
    const pitch = 0.14;
    switch (pose) {
      case 'windup': return { yaw: side - 0.35, pitch: pitch - 0.08 };
      case 'attack': return { yaw: side + 0.45, pitch: pitch + 0.1 };
      case 'cast': return { yaw: 0.05 + sway, pitch };
      case 'hurt': return { yaw: side - 0.6, pitch: pitch - 0.12, roll: -0.12 };
      case 'block': return { yaw: side + 0.25, pitch: pitch + 0.05 };
      case 'cheer': return { yaw: (t * 5) % (Math.PI * 2), pitch };
      case 'stun': return { yaw: side + Math.sin(t * 5) * 0.35, pitch, roll: Math.sin(t * 5) * 0.08 };
      case 'ko': return { yaw: side, pitch: pitch + 0.2 };
      case 'walk': return { yaw: side + Math.sin((o.walk || 0)) * 0.08, pitch };
      default: return { yaw: side + sway, pitch };
    }
  };

  // Póz → animáció, ha a hívó (pl. a harc) nem ad pontosabbat
  A.anim3dOf = function (pose, t) {
    switch (pose) {
      case 'cheer': return { name: 'cheer', t };
      case 'stun': return { name: 'stun', t };
      case 'ko': return { name: 'ko', t: 99 };
      case 'hurt': return { name: 'hurt', t: 0.15 };
      default: return { name: 'idle', t };
    }
  };

  // Figura magassága (talptól a fejtetőig) képpontban adott méretnél
  A.heightOf = function (fig, s) {
    const L = fig.look || {};
    return 104 * s * (L.scale || 1);
  };

  // ---------- Gyorsítótárazott statikus kép (gyűjtemény, bolt) ----------
  const cache = new Map();
  A.clearCache = () => cache.clear();
  A.figureCanvas = function (id, size, o) {
    o = o || {};
    const paint = o.paint === undefined ? TT.paintOf(id) : o.paint;
    const key = id + '|' + size + '|' + (o.silhouette ? 1 : 0) + '|' + (o.pedestal === false ? 0 : 1) + '|' + (paint || '');
    let c = cache.get(key);
    if (c) return c;
    const fig = TT.FIG[id];
    const s = size / 130;
    c = TT.makeCanvas(size, size);
    const g = c.getContext('2d');
    A.drawFigure(g, fig, size / 2, size * 0.88, s, { t: 0.4, pedestal: o.pedestal, sparkle: false, paint: o.silhouette ? null : paint });
    if (o.silhouette) {
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = '#2a1f55';
      g.fillRect(0, 0, size, size);
      g.globalCompositeOperation = 'source-over';
    }
    cache.set(key, c);
    return c;
  };

  TT.art = A;
})(window.TT);
