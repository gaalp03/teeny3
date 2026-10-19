'use strict';
// Felhasználói felület: gombsorok, párbeszéd, választó ablak, értesítések.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const I = () => TT.input;

  const ui = {};
  const stack = [];
  const toasts = [];

  // ---------- Gombsor billentyűs/érintéses navigációval ----------
  class Menu {
    constructor() {
      this.items = [];
      this.focus = 0;
      this.pressedId = null;
      this.pressT = 0;
    }
    set(items) {
      const prevId = this.items[this.focus] && this.items[this.focus].id;
      this.items = items;
      const idx = items.findIndex((b) => b.id && b.id === prevId);
      if (idx >= 0) this.focus = idx;
      if (this.focus >= items.length) this.focus = Math.max(0, items.length - 1);
      return this;
    }
    showFocus() {
      const d = I().lastDevice;
      return d === 'keyboard' || d === 'pad';
    }
    nav(dx, dy) {
      const cur = this.items[this.focus];
      if (!cur) return;
      const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
      let best = -1, bestScore = Infinity;
      this.items.forEach((b, i) => {
        if (i === this.focus || b.skip) return;
        const bx = b.x + b.w / 2, by = b.y + b.h / 2;
        const ddx = bx - cx, ddy = by - cy;
        const primary = dx !== 0 ? ddx * dx : ddy * dy;
        if (primary <= 2) return;
        const secondary = dx !== 0 ? Math.abs(ddy) : Math.abs(ddx);
        const score = primary + secondary * 2.2;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      });
      if (best >= 0) {
        this.focus = best;
        TT.audio.sfx('move');
      }
    }
    update(opts) {
      opts = opts || {};
      const inp = I();
      let clicked = null;
      // egér fókusz
      this.items.forEach((b, i) => {
        if (inp.hover(b.x, b.y, b.w, b.h) && !b.skip && !b.hidden) this.focus = i;
      });
      if (opts.keys !== false) {
        if (inp.hit('up')) this.nav(0, -1);
        if (inp.hit('down')) this.nav(0, 1);
        if (inp.hit('left')) this.nav(-1, 0);
        if (inp.hit('right')) this.nav(1, 0);
        if (inp.hit('ok') && this.items[this.focus] && !opts.noOk) clicked = this.items[this.focus];
      }
      for (let i = 0; i < this.items.length; i++) {
        const b = this.items[i];
        if (b.skip || b.hidden) continue;
        if (inp.tapIn(b.x, b.y, b.w, b.h)) {
          this.focus = i;
          clicked = b;
        }
      }
      if (clicked) {
        if (clicked.disabled) {
          TT.audio.sfx('error');
          if (clicked.onDisabled) clicked.onDisabled();
          return null;
        }
        this.pressedId = clicked;
        this.pressT = 0.12;
        if (!clicked.silent) TT.audio.sfx(clicked.sfx || 'select');
        if (clicked.onClick) clicked.onClick(clicked);
      }
      return clicked;
    }
    draw(ctx) {
      if (this.pressT > 0) this.pressT -= 1 / 60;
      const sf = this.showFocus();
      this.items.forEach((b, i) => {
        if (b.hidden) return;
        const focus = (sf || I().hover(b.x, b.y, b.w, b.h)) && i === this.focus && !b.skip;
        const pressed = this.pressedId === b && this.pressT > 0;
        if (b.draw) b.draw(ctx, b, focus, pressed);
        else D.button(ctx, b.x, b.y, b.w, b.h, b.label, { color: b.color, disabled: b.disabled, focus, pressed, size: b.size, glow: b.glow });
      });
    }
  }
  ui.Menu = Menu;

  // ---------- Átfedések ----------
  ui.overlayActive = () => stack.length > 0;
  ui.top = () => stack[stack.length - 1];

  ui.updateOverlays = function (dt) {
    for (const t of toasts) t.t += dt;
    while (toasts.length && toasts[0].t > toasts[0].dur) toasts.shift();
    const top = stack[stack.length - 1];
    if (top) {
      // fade-in animáció minden rétegen
      for (const o of stack) o.anim = Math.min(1, (o.anim || 0) + dt * 6);
      top.update(dt);
    }
  };

  ui.drawOverlays = function (ctx) {
    for (const o of stack) o.draw(ctx);
  };

  function close(o) {
    const i = stack.indexOf(o);
    if (i >= 0) stack.splice(i, 1);
  }

  // Szereplő portré-adatok
  function speaker(who) {
    if (!who) return null;
    if (typeof who === 'object') return who;
    const f = TT.FIG && TT.FIG[who];
    if (f) return { name: f.short || f.name, look: f.look, id: who };
    const n = TT.NPC_LOOKS && TT.NPC_LOOKS[who];
    if (n) return { name: n.name, look: n.look, id: who };
    return { name: who };
  }

  // Párbeszéd: lines = ['szöveg' | {who, text}]
  ui.say = function (lines, onDone) {
    if (!Array.isArray(lines)) lines = [lines];
    lines = lines.map((l) => (typeof l === 'string' ? { text: l } : l));
    const o = {
      kind: 'dialog', lines, i: 0, chars: 0, anim: 0, blip: 0,
      update(dt) {
        const line = this.lines[this.i];
        const full = line.text.length;
        if (this.chars < full) {
          this.chars = Math.min(full, this.chars + dt * 48);
          this.blip -= dt;
          if (this.blip <= 0) {
            this.blip = 0.07;
            TT.audio.sfx('talk');
          }
        }
        const inp = I();
        if (inp.hit('ok') || inp.hit('back') || inp.anyTap()) {
          if (this.chars < full) this.chars = full;
          else {
            this.i++;
            this.chars = 0;
            if (this.i >= this.lines.length) {
              close(this);
              if (onDone) onDone();
            } else TT.audio.sfx('next');
          }
        }
      },
      draw(ctx) {
        const line = this.lines[Math.min(this.i, this.lines.length - 1)];
        const sp = speaker(line.who);
        const a = U.ease.outCubic(this.anim);
        const x = 40, w = TT.W - 80, h = 138;
        const y = TT.H - h - 18 + (1 - a) * 40;
        ctx.save();
        ctx.globalAlpha = a;
        D.panel(ctx, x, y, w, h, { fill: '#fdf6e3', stroke: '#120a2c', lw: 4, inner: 'rgba(0,0,0,0.08)' });
        let tx = x + 24;
        if (sp && sp.look) {
          // portré
          ctx.save();
          D.rr(ctx, x + 14, y + 14, 110, 110, 14);
          ctx.fillStyle = '#ffd23f';
          ctx.fill();
          ctx.clip();
          D.sunburst(ctx, x + 69, y + 69, 120, 10, '#ffd23f', '#ffe27a', TT.time * 0.3);
          TT.art.drawFigure(ctx, { look: sp.look }, x + 69, y + 190, 1.55, { pedestal: false, t: TT.time, talk: this.chars < line.text.length });
          ctx.restore();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#120a2c';
          D.rr(ctx, x + 14, y + 14, 110, 110, 14);
          ctx.stroke();
          tx = x + 140;
        }
        if (sp && sp.name) {
          const nw = D.measure(ctx, sp.name, 20) + 30;
          D.panel(ctx, tx - 6, y - 16, nw, 32, { fill: '#ff6b35', r: 10, lw: 3 });
          D.text(ctx, sp.name, tx - 6 + nw / 2, y, { size: 20, align: 'center' });
        }
        const shown = line.text.slice(0, Math.floor(this.chars));
        const lns = D.wrap(ctx, shown, x + w - tx - 24, 22);
        lns.slice(0, 4).forEach((l, i) => D.text(ctx, l, tx, y + 34 + i * 26, { size: 22, color: '#1b1140', stroke: false }));
        if (this.chars >= line.text.length) {
          const bob = Math.sin(TT.time * 8) * 3;
          ctx.fillStyle = '#ff6b35';
          ctx.beginPath();
          ctx.moveTo(x + w - 34, y + h - 26 + bob);
          ctx.lineTo(x + w - 18, y + h - 26 + bob);
          ctx.lineTo(x + w - 26, y + h - 16 + bob);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      },
    };
    stack.push(o);
    return o;
  };

  // Választó ablak
  ui.choose = function (cfg, cb) {
    const menu = new Menu();
    const opts = cfg.options;
    const w = cfg.width || 420;
    const bh = cfg.buttonH || 50;
    const gap = 10;
    const textLines = cfg.text ? D.wrap(TT.ctx, cfg.text, w - 48, 20) : [];
    const headH = (cfg.title ? 56 : 18) + textLines.length * 26 + (textLines.length ? 10 : 0);
    const h = headH + opts.length * (bh + gap) + 14;
    const x = (TT.W - w) / 2, y = Math.max(12, (TT.H - h) / 2);
    const items = opts.map((op, i) => ({
      id: 'o' + i, x: x + 24, y: y + headH + i * (bh + gap), w: w - 48, h: bh,
      label: op.label, color: op.color || (op.value === null ? '#6c5ce7' : '#ff6b35'), disabled: op.disabled, value: op.value,
      size: 22, onDisabled: op.onDisabled,
    }));
    menu.set(items);
    const o = {
      kind: 'choice', anim: 0,
      update() {
        const inp = I();
        if (cfg.cancel !== false && inp.hit('back')) {
          TT.audio.sfx('back');
          close(this);
          if (cb) cb(null);
          return;
        }
        const c = menu.update();
        if (c) {
          close(this);
          if (cb) cb(c.value);
        }
      },
      draw(ctx) {
        const a = U.ease.outBack(Math.min(1, this.anim));
        ctx.save();
        ctx.fillStyle = `rgba(10,5,25,${0.55 * Math.min(1, this.anim)})`;
        ctx.fillRect(0, 0, TT.W, TT.H);
        ctx.translate(TT.W / 2, y + h / 2);
        ctx.scale(0.8 + 0.2 * a, 0.8 + 0.2 * a);
        ctx.translate(-TT.W / 2, -(y + h / 2));
        D.panel(ctx, x, y, w, h, { fill: cfg.fill || '#3a2a7a', lw: 4 });
        if (cfg.title) D.text(ctx, cfg.title, TT.W / 2, y + 32, { size: 30, align: 'center', color: '#ffd23f' });
        textLines.forEach((l, i) => D.text(ctx, l, TT.W / 2, y + (cfg.title ? 66 : 28) + i * 26, { size: 20, align: 'center', color: '#e8e2ff', stroke: false }));
        menu.draw(ctx);
        ctx.restore();
      },
    };
    stack.push(o);
    return o;
  };

  ui.confirm = function (text, cb, yes, no) {
    ui.choose({ text, options: [{ label: yes || 'Igen', value: true }, { label: no || 'Mégse', value: false, color: '#6c5ce7' }] }, (v) => cb(!!v));
  };

  // Egyedi átfedés (pl. beállítások): {update, draw}
  ui.push = function (o) {
    o.anim = 0;
    o.close = () => close(o);
    stack.push(o);
    return o;
  };

  // Figura-felfedés (doboz, rejtett figura, jutalom)
  ui.reveal = function (id, info, cb) {
    const fig = TT.FIG[id];
    const R = TT.RARITY[fig.rarity];
    TT.audio.sfx(fig.rarity === 'legendary' || fig.rarity === 'epic' ? 'legend' : 'reveal');
    const o = {
      kind: 'reveal', t: 0, anim: 0,
      update(dt) {
        if (this.t < 0.55 && this.t + dt >= 0.55) TT.audio.announce(id);
        this.t += dt;
        if (this.t > 0.9 && (I().hit('ok') || I().hit('back') || I().anyTap())) {
          close(this);
          if (cb) cb();
        }
        if (Math.random() < 0.3) {
          TT.fx.spawn(TT.W / 2 + U.rand(-160, 160), 260 + U.rand(-140, 120), { vy: -60, color: R.color, shape: 'star', size: 6, life: 0.8, layer: 1 });
        }
      },
      draw(ctx) {
        const k = U.clamp(this.t / 0.6, 0, 1);
        ctx.save();
        ctx.fillStyle = `rgba(10,5,25,${0.75 * Math.min(1, this.t * 4)})`;
        ctx.fillRect(0, 0, TT.W, TT.H);
        ctx.globalAlpha = Math.min(1, this.t * 3);
        ctx.save();
        ctx.beginPath();
        ctx.arc(TT.W / 2, 250, 230, 0, Math.PI * 2);
        ctx.clip();
        D.sunburst(ctx, TT.W / 2, 250, 260, 16, U.shade(R.color, -0.35), U.shade(R.color, -0.15), this.t * 0.6);
        const g = ctx.createRadialGradient(TT.W / 2, 250, 20, TT.W / 2, 250, 230);
        g.addColorStop(0, 'rgba(255,255,255,0.45)');
        g.addColorStop(1, 'rgba(10,5,25,0.9)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, TT.W, TT.H);
        ctx.restore();
        const sc = U.ease.outBack(k) * 2.2;
        if (sc > 0.01) TT.art.drawFigure(ctx, fig, TT.W / 2, 330, sc, { t: TT.time, pose: this.t > 0.7 ? 'cheer' : 'idle' });
        D.text(ctx, info && info.isNew === false ? 'MÁR MEGVAN!' : 'ÚJ FIGURA!', TT.W / 2, 50, { size: 40, align: 'center', color: info && info.isNew === false ? '#ffe9a0' : '#7bff6b' });
        D.text(ctx, fig.name, TT.W / 2, 400, { size: 40, align: 'center', color: '#ffffff' });
        D.rarityStars(ctx, fig.rarity, TT.W / 2, 438, 22, 'center');
        D.text(ctx, R.name + ' · ' + TT.TYPES[fig.type].name, TT.W / 2, 468, { size: 20, align: 'center', color: R.color });
        if (info && info.isNew === false) {
          D.text(ctx, '+' + info.xp + ' XP' + (info.lvlUps ? '  ·  SZINTLÉPÉS!' : '') + (info.starUp ? `  ·  ★ ${info.stars}. csillag!` : ''), TT.W / 2, 500, { size: 22, align: 'center', color: info.starUp ? '#ffe066' : '#c8b8f0' });
        }
        if (this.t > 0.9) D.text(ctx, 'Koppints a folytatáshoz', TT.W / 2, 528, { size: 16, align: 'center', color: '#a89cd8', alpha: 0.6 + Math.sin(TT.time * 4) * 0.3 });
        ctx.restore();
        TT.fx.draw(ctx, 1);
      },
    };
    stack.push(o);
    return o;
  };

  ui.toast = function (text, o) {
    o = o || {};
    toasts.push({ text, t: 0, dur: o.dur || 2.6, color: o.color || '#ffd23f' });
    if (toasts.length > 4) toasts.shift();
  };

  ui.drawToasts = function (ctx) {
    toasts.forEach((t, i) => {
      const inA = U.clamp(t.t / 0.25, 0, 1), outA = U.clamp((t.dur - t.t) / 0.4, 0, 1);
      const a = Math.min(inA, outA);
      const w = D.measure(ctx, t.text, 20) + 40;
      const y = 62 + i * 46 - (1 - U.ease.outBack(inA)) * 30;
      ctx.save();
      ctx.globalAlpha = a;
      D.panel(ctx, (TT.W - w) / 2, y, w, 38, { fill: '#1b1140', r: 19, stroke: t.color, lw: 3 });
      D.text(ctx, t.text, TT.W / 2, y + 20, { size: 20, align: 'center', color: t.color });
      ctx.restore();
    });
  };

  ui.clear = function () {
    stack.length = 0;
  };

  TT.ui = ui;
})(window.TT);
