'use strict';
// Vászon, skálázás, jelenetkezelő és a fő ciklus.
(function (TT) {
  const U = TT.U;

  TT.W = 960;
  TT.H = 540;
  TT.time = 0;
  TT.scenes = {};
  TT.scene = null;
  TT.sceneName = '';
  TT.view = { k: 1, left: 0, top: 0, cssW: TT.W, cssH: TT.H };

  const FONT = "'TT3 Display', 'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif";
  TT.FONT = FONT;

  let canvas, ctx;
  let fade = { a: 1, state: 'in', next: null, params: null, speed: 3 };
  let shake = { t: 0, dur: 0, amp: 0 };
  let last = 0;

  TT.resize = function () {
    const ww = window.innerWidth, wh = window.innerHeight;
    const scale = Math.min(ww / TT.W, wh / TT.H);
    const cssW = Math.floor(TT.W * scale), cssH = Math.floor(TT.H * scale);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const r = canvas.getBoundingClientRect();
    TT.view = { k: (cssW * dpr) / TT.W, left: r.left, top: r.top, cssW, cssH };
  };

  // Képernyő-koordináta → logikai koordináta
  TT.toLogical = function (clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * TT.W,
      y: ((clientY - r.top) / r.height) * TT.H,
    };
  };

  TT.register = function (name, scene) {
    TT.scenes[name] = scene;
  };

  // Jelenetváltás áttűnéssel
  TT.go = function (name, params, opts) {
    opts = opts || {};
    if (!TT.scenes[name]) throw new Error('Nincs ilyen jelenet: ' + name);
    if (opts.instant || !TT.scene) {
      switchScene(name, params);
      fade.state = 'in';
      fade.a = opts.instant ? 0 : 1;
      return;
    }
    fade.state = 'out';
    fade.next = name;
    fade.params = params;
    fade.speed = opts.speed || 3.2;
  };

  function switchScene(name, params) {
    if (TT.scene && TT.scene.exit) TT.scene.exit();
    TT.fx.clear();
    TT.scene = TT.scenes[name];
    TT.sceneName = name;
    if (TT.scene.enter) TT.scene.enter(params || {});
  }

  TT.isFading = () => fade.state === 'out';

  TT.shake = function (amp, dur) {
    if (TT.settings && TT.settings.shake === false) return;
    if (amp >= shake.amp * (shake.t / Math.max(shake.dur, 0.001))) {
      shake.amp = amp;
      shake.dur = dur || 0.3;
      shake.t = shake.dur;
    }
  };
  TT.shakeOffset = function () {
    if (shake.t <= 0) return { x: 0, y: 0 };
    const p = shake.t / shake.dur;
    const a = shake.amp * p;
    return { x: (Math.random() * 2 - 1) * a, y: (Math.random() * 2 - 1) * a };
  };

  // Időlassítás (pl. tökéletes blokknál)
  let slowmo = { t: 0, f: 1 };
  TT.slowmo = function (factor, dur) {
    slowmo.f = factor;
    slowmo.t = dur;
  };

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    let rdt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    if (rdt <= 0) return;

    let dt = rdt;
    if (slowmo.t > 0) {
      slowmo.t -= rdt;
      dt = rdt * slowmo.f;
    }
    TT.time += dt;
    TT.rtime = (TT.rtime || 0) + rdt;
    if (shake.t > 0) shake.t -= rdt;

    TT.input.poll();

    // Átfedések (párbeszéd, választó) elnyelik a bemenetet
    if (fade.state === 'out') TT.input.swallow();
    if (TT.ui.overlayActive()) {
      TT.ui.updateOverlays(rdt);
      TT.input.swallow();
    } else {
      TT.ui.updateOverlays(rdt);
    }

    if (TT.scene && TT.scene.update) TT.scene.update(dt);
    // játékidő minden jelenetben (a címképernyőn kívül), valós időben
    if (TT.save && TT.sceneName && TT.sceneName !== 'title') TT.save.playTime = (TT.save.playTime || 0) + rdt;
    TT.fx.update(dt);

    if (fade.state === 'out') {
      fade.a += rdt * fade.speed;
      if (fade.a >= 1) {
        fade.a = 1;
        switchScene(fade.next, fade.params);
        fade.state = 'in';
      }
    } else if (fade.state === 'in') {
      fade.a -= rdt * fade.speed;
      if (fade.a <= 0) {
        fade.a = 0;
        fade.state = 'none';
      }
    }

    // Rajzolás
    const k = TT.view.k;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = '#0d0820';
    ctx.fillRect(0, 0, TT.W, TT.H);
    if (TT.scene && TT.scene.draw) TT.scene.draw(ctx);
    TT.ui.drawOverlays(ctx);

    if (fade.a > 0) {
      ctx.fillStyle = `rgba(13,8,32,${fade.a})`;
      ctx.fillRect(0, 0, TT.W, TT.H);
    }
    TT.ui.drawToasts(ctx);
    if (window.innerHeight > window.innerWidth * 1.15) {
      ctx.fillStyle = 'rgba(13,8,32,0.8)';
      ctx.fillRect(0, TT.H - 60, TT.W, 60);
      TT.D.text(ctx, 'Fordítsd el a telefont fekvő helyzetbe a nagyobb képhez!', TT.W / 2, TT.H - 30, { size: 26, align: 'center', color: '#ffd23f' });
    }

    TT.input.endFrame();
  }

  TT.start = function (firstScene) {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    TT.canvas = canvas;
    TT.ctx = ctx;
    TT.resize();
    window.addEventListener('resize', TT.resize);
    window.addEventListener('orientationchange', () => setTimeout(TT.resize, 200));
    TT.input.init(canvas);
    const ld = document.getElementById('loading');
    if (ld) ld.remove();
    canvas.focus();
    TT.go(firstScene, {}, { instant: true });
    fade.a = 1;
    fade.state = 'in';
    requestAnimationFrame(frame);
  };

  // Offscreen vászon létrehozása
  TT.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };

  TT.font = function (size) {
    return `${size}px ${FONT}`;
  };

  document.addEventListener('visibilitychange', () => {
    if (TT.audio) TT.audio.setHidden(document.hidden);
    last = 0;
  });

  void U;
})(window.TT);
