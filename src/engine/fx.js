'use strict';
// Részecskék, felugró szövegek, gyűrűk.
(function (TT) {
  const U = TT.U;
  const D = () => TT.D;
  let parts = [];

  const fx = {};

  fx.spawn = function (x, y, o) {
    o = o || {};
    const p = {
      x, y,
      vx: o.vx || 0, vy: o.vy || 0,
      life: o.life || 0.6, max: o.life || 0.6,
      size: o.size || 6, size2: o.size2 != null ? o.size2 : 0,
      color: o.color || '#fff', color2: o.color2,
      shape: o.shape || 'circle',
      g: o.g || 0, drag: o.drag != null ? o.drag : 0.9,
      rot: o.rot != null ? o.rot : Math.random() * Math.PI * 2, vr: o.vr != null ? o.vr : U.rand(-6, 6),
      text: o.text, tsize: o.tsize || 26,
      layer: o.layer || 0, alpha: o.alpha != null ? o.alpha : 1,
      add: !!o.add, lw: o.lw || 4, strokeColor: o.strokeColor,
    };
    parts.push(p);
    return p;
  };

  fx.burst = function (x, y, n, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + U.rand(-(o.spread || Math.PI), o.spread || Math.PI) : Math.random() * Math.PI * 2;
      const sp = U.rand(o.speedMin || 80, o.speed || 260);
      fx.spawn(x + U.rand(-(o.jitter || 0), o.jitter || 0), y + U.rand(-(o.jitter || 0), o.jitter || 0), Object.assign({}, o, {
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: U.rand((o.life || 0.6) * 0.6, o.life || 0.6),
        size: U.rand((o.size || 6) * 0.6, o.size || 6),
        color: Array.isArray(o.colors) ? U.pick(o.colors) : o.color,
      }));
    }
  };

  fx.text = function (x, y, str, o) {
    o = o || {};
    return fx.spawn(x, y, Object.assign({
      shape: 'text', text: str, vy: -120, vx: U.rand(-20, 20), g: 260, drag: 0.98, life: 1.0, vr: 0, rot: 0,
    }, o));
  };

  fx.ring = function (x, y, o) {
    o = o || {};
    return fx.spawn(x, y, Object.assign({ shape: 'ring', size: 10, size2: 90, life: 0.4, vr: 0 }, o));
  };

  fx.update = function (dt) {
    for (const p of parts) {
      p.life -= dt;
      p.vy += p.g * dt;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    parts = parts.filter((p) => p.life > 0);
  };

  fx.draw = function (ctx, layer) {
    layer = layer || 0;
    for (const p of parts) {
      if (p.layer !== layer) continue;
      const t = 1 - p.life / p.max; // 0 → 1
      const a = p.alpha * (p.shape === 'text' ? U.clamp(p.life / 0.3, 0, 1) : U.clamp(1 - t, 0, 1));
      ctx.save();
      ctx.globalAlpha = a;
      if (p.add) ctx.globalCompositeOperation = 'lighter';
      ctx.translate(p.x, p.y);
      const s = p.size2 ? U.lerp(p.size, p.size2, U.ease.outCubic(t)) : p.size * (1 - t * 0.5);
      ctx.fillStyle = p.color2 ? U.mix(p.color, p.color2, t) : p.color;
      switch (p.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(0.1, s), 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'square':
          ctx.rotate(p.rot);
          ctx.fillRect(-s / 2, -s / 2, s, s);
          break;
        case 'star':
          ctx.rotate(p.rot);
          D().star(ctx, 0, 0, s, s * 0.45, 5);
          ctx.fill();
          break;
        case 'spark':
          ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.fillRect(-s * 1.8, -s * 0.25, s * 3.6, s * 0.5);
          break;
        case 'ring':
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(0.1, s), 0, Math.PI * 2);
          ctx.lineWidth = p.lw * (1 - t) + 0.5;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.stroke();
          break;
        case 'smoke':
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(0.1, p.size * (0.6 + t)), 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'note':
          ctx.rotate(p.rot * 0.1);
          ctx.font = TT.font(s * 2);
          ctx.textAlign = 'center';
          ctx.fillText('♪', 0, 0);
          break;
        case 'text': {
          const pop = t < 0.15 ? U.ease.outBack(t / 0.15) : 1;
          ctx.scale(pop, pop);
          ctx.rotate(p.rot);
          D().text(ctx, p.text, 0, 0, { size: p.tsize, align: 'center', color: p.color, strokeColor: p.strokeColor || '#120a2c' });
          break;
        }
        default:
          break;
      }
      ctx.restore();
    }
  };

  fx.clear = function () {
    parts = [];
  };

  fx.count = () => parts.length;

  TT.fx = fx;
})(window.TT);
