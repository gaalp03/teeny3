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
        else D.button(ctx, b.x, b.y, b.w, b.h, b.label, { color: b.color, disabled: b.disabled, focus, pressed, size: b.size, glow: b.glow, sub: b.desc });
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
  // a 3D portré kivágása: a TT2 figuráknak nagy a fejük, így a felsőtest is belefér
  const PORTRAIT3D = { y: 182, s: 1.5 };

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
        if (!this.opened) {
          this.opened = true;
          TT.audio.sfx('dlgopen');
        }
        if (this.voiced !== this.i) {
          // a TT2-höz hasonlóan a beszélő Titán rövid csevegőhangot ad (csak ha új szereplő szólal meg)
          const prev = this.lines[this.i - 1];
          if (typeof line.who === 'string' && (!prev || prev.who !== line.who)) TT.audio.voice(line.who, 'chat', 0.7);
          this.voiced = this.i;
        }
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
              TT.audio.sfx('dlgclose');
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
          const talking = this.chars < line.text.length;
          if (sp.id && TT.FIG[sp.id] && TT.model3d && TT.settings.fig3d !== false && TT.model3d.has(sp.id)) {
            // TT2-es 3D figura közelije (egyszer rajzolódik), beszéd közben enyhén billeg
            const bob = talking ? Math.abs(Math.sin(TT.time * 9)) * 3 : 0;
            TT.art.drawFigure(ctx, TT.FIG[sp.id], x + 69, y + PORTRAIT3D.y - bob, PORTRAIT3D.s, {
              pedestal: false, pose: 'idle', yaw3d: 0.2, anim3d: { name: 'idle', t: 0 }, lean: talking ? Math.sin(TT.time * 6) * 0.03 : 0,
            });
          } else TT.art.drawFigure(ctx, { look: sp.look }, x + 69, y + 190, 1.55, { pedestal: false, t: TT.time, talk: talking });
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
    // több oszlop (cfg.columns): a választások rácsban, a „Mégse” (value: null) teljes szélességben alul
    const cols = cfg.columns || 1;
    const grid = cols > 1 ? opts.filter((op) => op.value !== null) : opts;
    const rows = Math.ceil(grid.length / cols) + (cols > 1 && grid.length < opts.length ? 1 : 0);
    const h = headH + rows * (bh + gap) + 14;
    const x = (TT.W - w) / 2, y = Math.max(12, (TT.H - h) / 2);
    const cw = (w - 48 - gap * (cols - 1)) / cols;
    const place = (op) => {
      const k = grid.indexOf(op);
      if (k < 0) return { x: x + 24, y: y + headH + (rows - 1) * (bh + gap), w: w - 48 };
      return { x: x + 24 + (k % cols) * (cw + gap), y: y + headH + Math.floor(k / cols) * (bh + gap), w: cw };
    };
    const items = opts.map((op, i) => ({
      id: 'o' + i, ...place(op), h: bh,
      label: op.label, color: op.color || (op.value === null ? '#6c5ce7' : '#ff6b35'), disabled: op.disabled, value: op.value,
      size: cfg.size || 22, onDisabled: op.onDisabled, desc: op.desc,
    }));
    menu.set(items);
    const o = {
      kind: 'choice', anim: 0, box: { y, h },
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
        // sötét háttér, rajta a ritkaság színű, a szélek felé elhalványuló fénysugarak (nincs éles körlap)
        ctx.fillStyle = `rgba(8,4,20,${0.92 * Math.min(1, this.t * 4)})`;
        ctx.fillRect(0, 0, TT.W, TT.H);
        ctx.globalAlpha = Math.min(1, this.t * 3);
        const big = fig.rarity === 'legendary' || fig.rarity === 'epic';
        ctx.save();
        ctx.globalAlpha *= 0.75;
        D.sunburst(ctx, TT.W / 2, 250, 760, big ? 20 : 14, U.shade(R.color, -0.25), U.shade(R.color, -0.55), this.t * (big ? 0.45 : 0.3));
        ctx.restore();
        const g = ctx.createRadialGradient(TT.W / 2, 250, 10, TT.W / 2, 250, 520);
        g.addColorStop(0, 'rgba(255,255,255,0.5)');
        g.addColorStop(0.18, U.shade(R.color, 0.2) + '66');
        g.addColorStop(0.45, 'rgba(8,4,20,0.25)');
        g.addColorStop(1, 'rgba(8,4,20,0.97)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, TT.W, TT.H);
        // fényudvar a talapzat alatt
        ctx.save();
        ctx.globalAlpha *= 0.55 + Math.sin(TT.time * 3) * 0.1;
        const pg = ctx.createRadialGradient(TT.W / 2, 330, 4, TT.W / 2, 330, 150);
        pg.addColorStop(0, R.color);
        pg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.ellipse(TT.W / 2, 330, 150, 46, 0, 0, Math.PI * 2);
        ctx.fill();
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
        // a doboz kinyílásának villanása
        if (this.t < 0.3) {
          ctx.save();
          ctx.globalAlpha = (1 - this.t / 0.3) * 0.85;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, TT.W, TT.H);
          ctx.restore();
        }
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
    // nyitott választóablaknál az üzenet ne takarja a címét: az ablak alá vagy fölé kerül, ahol van hely;
    // ha egyik sem fér el, csak a legutóbbi látszik kicsiben a képernyő alján
    const top = stack[stack.length - 1];
    // egy jelenet lejjebb kérheti az üzeneteket (pl. a harc eredménye a „GYŐZELEM!” szalag alá)
    let list = toasts, y0 = (TT.scene && TT.scene.toastY) || 62, dir = 1, size = 20, th = 38;
    // a méret nélküli egyedi panelek (profil, teljesítmények, küldetések…) szinte az egész képernyőt kitöltik
    const box = top && (top.box || (top.kind !== 'dialog' ? { y: 12, h: TT.H - 40 } : null));
    if (box && box.y < 62 + toasts.length * 46) {
      const below = box.y + box.h + 8;
      if (below + toasts.length * 46 <= TT.H) y0 = below;
      else if (box.y - toasts.length * 46 >= 0) {
        y0 = box.y - 46;
        dir = -1;
      } else {
        list = toasts.slice(-1);
        y0 = TT.H - 32;
        size = 15;
        th = 28;
      }
    }
    list.forEach((t, i) => {
      const inA = U.clamp(t.t / 0.25, 0, 1), outA = U.clamp((t.dur - t.t) / 0.4, 0, 1);
      const a = Math.min(inA, outA);
      const w = D.measure(ctx, t.text, size) + 40;
      const y = y0 + dir * i * 46 - (1 - U.ease.outBack(inA)) * 30;
      ctx.save();
      ctx.globalAlpha = a;
      D.panel(ctx, (TT.W - w) / 2, y, w, th, { fill: '#1b1140', r: th / 2, stroke: t.color, lw: 3 });
      D.text(ctx, t.text, TT.W / 2, y + th / 2 + 1, { size, align: 'center', color: t.color });
      ctx.restore();
    });
  };

  ui.clear = function () {
    stack.length = 0;
  };

  // „Ki kit kontráz?” — a típusok és a ritkaságok erősségi köre nyilakkal.
  // o.a / o.b: két figura (pl. a harcban álló kettő), ekkor alul a mostani párosítás is látszik.
  ui.counterChart = function (o) {
    o = o || {};
    const T = TT.TYPES, R = TT.RARITY;
    const TYPE_ORDER = ['brawn', 'tech', 'mystic', 'speed'];
    const RAR_ORDER = ['common', 'legendary', 'epic', 'rare'];
    const pct = (m) => (m > 1.001 ? '+' : m < 0.999 ? '−' : '±') + Math.round(Math.abs(m - 1) * 100) + '%';
    function arrow(ctx, x0, y0, x1, y1, col, r) {
      const a = Math.atan2(y1 - y0, x1 - x0);
      const sx = x0 + Math.cos(a) * r, sy = y0 + Math.sin(a) * r;
      const ex = x1 - Math.cos(a) * (r + 6), ey = y1 - Math.sin(a) * (r + 6);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.lineWidth = 6;
      ctx.strokeStyle = col;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(a) * 12, ey + Math.sin(a) * 12);
      ctx.lineTo(ex + Math.cos(a + 2.4) * 14, ey + Math.sin(a + 2.4) * 14);
      ctx.lineTo(ex + Math.cos(a - 2.4) * 14, ey + Math.sin(a - 2.4) * 14);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    }
    function cycle(ctx, cx, cy, keys, node, label, hi) {
      const pos = keys.map((k, i) => {
        const ang = -Math.PI * 3 / 4 + (i * Math.PI) / 2;
        return [cx + Math.cos(ang) * 98, cy + Math.sin(ang) * 82];
      });
      keys.forEach((k, i) => {
        const [x0, y0] = pos[i], [x1, y1] = pos[(i + 1) % keys.length];
        arrow(ctx, x0, y0, x1, y1, hi && hi.from === k ? '#7bff6b' : 'rgba(255,255,255,0.75)', 34);
        D.text(ctx, label, (x0 + x1) / 2 + (y1 - y0) * 0.12, (y0 + y1) / 2 - (x1 - x0) * 0.12, { size: 14, align: 'center', color: '#7bff6b' });
      });
      keys.forEach((k, i) => node(ctx, k, pos[i][0], pos[i][1], hi && (hi.a === k || hi.b === k)));
    }
    TT.audio.sfx('select');
    return ui.push({
      update() {
        const I = TT.input;
        if (I.hit('back') || I.hit('ok') || I.taps.length) {
          TT.audio.sfx('back');
          this.close();
        }
      },
      draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(13,8,32,0.94)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.text(ctx, 'Ki kit kontráz?', TT.W / 2, 38, { size: 30, align: 'center', color: '#ffd23f' });
        D.text(ctx, 'A nyíl attól indul, aki erős, és arra mutat, aki ellen erős.', TT.W / 2, 70, { size: 15, align: 'center', color: '#c8b8f0', stroke: false });
        const A = o.a, B = o.b;
        // típusok
        D.text(ctx, 'Típus (+30% / −20%)', 250, 108, { size: 19, align: 'center', color: '#ffffff' });
        cycle(ctx, 250, 268, TYPE_ORDER, (c, k, x, y, on) => {
          c.beginPath();
          c.arc(x, y, 34, 0, Math.PI * 2);
          c.fillStyle = on ? T[k].color : '#2b1e5c';
          c.fill();
          c.lineWidth = 4;
          c.strokeStyle = T[k].color;
          c.stroke();
          D.typeIcon(c, k, x, y - 6, 12);
          D.text(c, T[k].name, x, y + 18, { size: 12, align: 'center' });
        }, '+30%', A && B ? { a: A.type, b: B.type, from: TT.typeMult(A.type, B.type) > 1 ? A.type : TT.typeMult(B.type, A.type) > 1 ? B.type : null } : null);
        // ritkaság
        D.text(ctx, 'Ritkaság (+15% / −10%)', 710, 108, { size: 19, align: 'center', color: '#ffffff' });
        cycle(ctx, 710, 268, RAR_ORDER, (c, k, x, y, on) => {
          c.beginPath();
          c.arc(x, y, 34, 0, Math.PI * 2);
          c.fillStyle = on ? R[k].ring : '#2b1e5c';
          c.fill();
          c.lineWidth = 4;
          c.strokeStyle = R[k].color;
          c.stroke();
          D.rarityStars(c, k, x, y - 8, 9, 'center');
          D.text(c, R[k].name, x, y + 14, { size: 12, align: 'center', color: R[k].color });
        }, '+15%', A && B ? { a: A.rarity, b: B.rarity, from: TT.rarityMult(A.rarity, B.rarity) > 1 ? A.rarity : TT.rarityMult(B.rarity, A.rarity) > 1 ? B.rarity : null } : null);
        // a mostani párosítás
        if (A && B) {
          const m1 = TT.matchMult(A, B), m2 = TT.matchMult(B, A);
          D.panel(ctx, 110, 400, 740, 74, { fill: '#2b1e5c', r: 14, lw: 3 });
          D.text(ctx, `${A.short} → ${B.short}:  ${pct(m1)} sebzés`, 480, 424, { size: 19, align: 'center', color: m1 > 1.001 ? '#7bff6b' : m1 < 0.999 ? '#ff8a80' : '#ffffff' });
          D.text(ctx, `${B.short} → ${A.short}:  ${pct(m2)} sebzés`, 480, 454, { size: 19, align: 'center', color: m2 > 1.001 ? '#ff8a80' : m2 < 0.999 ? '#7bff6b' : '#ffffff' });
        } else {
          D.text(ctx, 'A kettő összeadódik: Erő-típusú Gyakori figura egy Tech Legendás ellen +30% és +15%.', TT.W / 2, 430, { size: 15, align: 'center', color: '#e8e2ff', maxWidth: 880 });
        }
        D.text(ctx, 'Koppints bárhova a bezáráshoz', TT.W / 2, 510, { size: 14, align: 'center', color: '#a89cd8', stroke: false });
        ctx.restore();
      },
    });
  };

  // Szövegdoboz hosszú szövegekhez (pl. mentéskód): a gombok fent vannak, így a hosszú szöveg sosem takarja el őket,
  // a szöveg egy külön görgethető dobozban van. A telefon beépített bevitelablaka (prompt) ilyenkor kilóg a képernyőről.
  // o: { title, hint, text, readonly, actions: [{ label, primary, keepOpen, run(box) }], onClose }
  ui.codeBox = function (o) {
    if (typeof document === 'undefined') return null;
    const back = document.createElement('div');
    back.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(13,8,32,0.88);display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box;touch-action:auto;-webkit-user-select:text;user-select:text;font-family:"TT3 Display",system-ui,sans-serif';
    const card = document.createElement('div');
    card.style.cssText = 'width:min(640px,100%);max-height:100%;display:flex;flex-direction:column;gap:8px;background:#2b1e5c;border:4px solid #1d1433;border-radius:16px;padding:12px;box-sizing:border-box;color:#fff;overflow:hidden';
    const title = document.createElement('div');
    title.textContent = o.title || '';
    title.style.cssText = 'font-size:22px;color:#ffd23f;text-align:center;flex:none';
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;flex:none';
    const hint = document.createElement('div');
    hint.textContent = o.hint || '';
    hint.style.cssText = 'font-size:14px;color:#c8b8f0;text-align:center;flex:none;min-height:18px';
    const ta = document.createElement('textarea');
    ta.value = o.text || '';
    ta.readOnly = !!o.readonly;
    ta.spellcheck = false;
    ta.autocapitalize = 'off';
    ta.setAttribute('autocomplete', 'off');
    // legfeljebb a képernyő harmada: a gombok és a felirat mindig látszanak, a kód a dobozban görgethető
    ta.style.cssText = 'width:100%;box-sizing:border-box;height:min(30vh,150px);min-height:64px;resize:none;overflow:auto;word-break:break-all;font:13px/1.3 monospace;background:#120a2c;color:#e8e2ff;border:3px solid #6c5ce7;border-radius:10px;padding:8px;-webkit-user-select:text;user-select:text;touch-action:pan-y';
    // a játék gombjai (WASD, nyilak, szóköz) ne zavarják a szövegbevitelt
    for (const ev of ['keydown', 'keyup', 'keypress']) ta.addEventListener(ev, (e) => e.stopPropagation());
    const box = {
      el: back, ta,
      get text() { return ta.value; },
      set text(v) { ta.value = v; },
      say(msg, bad) {
        hint.textContent = msg;
        hint.style.color = bad ? '#ff8a80' : '#7bff6b';
      },
      close() {
        if (back.parentNode) back.parentNode.removeChild(back);
        if (o.onClose) o.onClose();
      },
    };
    const mk = (label, primary, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = `flex:1 1 130px;min-height:48px;font:inherit;font-size:17px;color:#fff;background:${primary ? '#2ecc71' : '#6c5ce7'};border:3px solid #1d1433;border-radius:12px;padding:6px 10px;touch-action:manipulation`;
      b.addEventListener('click', fn);
      bar.appendChild(b);
    };
    for (const a of o.actions || []) mk(a.label, a.primary, () => { a.run(box); if (!a.keepOpen) box.close(); });
    mk('Mégse', false, () => box.close());
    card.append(title, bar, hint, ta);
    back.appendChild(card);
    document.body.appendChild(back);
    if (!o.readonly) setTimeout(() => ta.focus(), 50);
    else ta.select();
    return box;
  };

  TT.ui = ui;
})(window.TT);
