'use strict';
// Billentyűzet, egér/érintés és kontroller bemenet.
(function (TT) {
  const keysDown = new Set();
  const keysPressed = new Set();
  const keysReleased = new Set();
  const padDown = new Set();
  const padPressed = new Set();
  let prevPad = new Set();

  const ACTIONS = {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    ok: ['Enter', 'Space', 'KeyE', 'NumpadEnter'],
    back: ['Escape', 'Backspace', 'KeyX'],
    menu: ['Escape', 'Tab', 'KeyI'],
    run: ['ShiftLeft', 'ShiftRight'],
    b1: ['Digit1', 'KeyJ', 'Numpad1'],
    b2: ['Digit2', 'KeyK', 'Numpad2'],
    b3: ['Digit3', 'KeyL', 'Numpad3'],
    super: ['Digit4', 'KeyR', 'KeyU', 'Numpad4'],
    block: ['Space', 'ShiftLeft', 'ShiftRight'],
    swapL: ['KeyQ'],
    swapR: ['KeyE'],
    map: ['KeyM'],
    mute: ['KeyN'],
  };

  // Kontroller gombok → akciók
  const PAD = {
    0: ['ok', 'b1'], 1: ['back', 'b2'], 2: ['b3'], 3: ['super'],
    4: ['swapL'], 5: ['swapR'], 6: ['block'], 7: ['block'],
    8: ['map'], 9: ['menu'],
    12: ['up'], 13: ['down'], 14: ['left'], 15: ['right'],
  };

  const input = {
    pointers: new Map(),
    taps: [],
    releases: [],
    mouse: { x: -100, y: -100, active: false },
    wheel: 0,
    swallowed: false,
    lastDevice: 'keyboard',
    stick: { x: 0, y: 0 },
    anyPressed: false,
  };

  input.init = function (canvas) {
    window.addEventListener('keydown', (e) => {
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.code)) e.preventDefault();
      TT.audio.unlock();
      input.lastDevice = 'keyboard';
      if (!keysDown.has(e.code)) {
        keysPressed.add(e.code);
        input.anyPressed = true;
      }
      keysDown.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      keysDown.delete(e.code);
      keysReleased.add(e.code);
    });
    window.addEventListener('blur', () => {
      keysDown.clear();
      input.pointers.clear();
    });

    const onDown = (e) => {
      e.preventDefault();
      TT.audio.unlock();
      canvas.focus();
      input.lastDevice = e.pointerType === 'touch' ? 'touch' : 'mouse';
      const p = TT.toLogical(e.clientX, e.clientY);
      input.pointers.set(e.pointerId, { x: p.x, y: p.y, sx: p.x, sy: p.y, t: TT.rtime || 0, id: e.pointerId });
      input.taps.push({ x: p.x, y: p.y, id: e.pointerId });
      input.anyPressed = true;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* nem baj */ }
      }
    };
    const onMove = (e) => {
      const p = TT.toLogical(e.clientX, e.clientY);
      if (e.pointerType === 'mouse') {
        input.mouse.x = p.x;
        input.mouse.y = p.y;
        input.mouse.active = true;
      }
      const ptr = input.pointers.get(e.pointerId);
      if (ptr) {
        ptr.x = p.x;
        ptr.y = p.y;
      }
    };
    const onUp = (e) => {
      const p = TT.toLogical(e.clientX, e.clientY);
      const ptr = input.pointers.get(e.pointerId);
      input.releases.push({ x: p.x, y: p.y, id: e.pointerId, sx: ptr ? ptr.sx : p.x, sy: ptr ? ptr.sy : p.y, dt: ptr ? (TT.rtime || 0) - ptr.t : 0 });
      input.pointers.delete(e.pointerId);
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') input.mouse.active = false;
    });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      input.wheel += e.deltaY;
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  // Kontroller lekérdezése minden képkocka elején
  input.poll = function () {
    padDown.clear();
    input.stick.x = 0;
    input.stick.y = 0;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      gp.buttons.forEach((b, i) => {
        if (b.pressed && PAD[i]) PAD[i].forEach((a) => padDown.add(a));
      });
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (Math.abs(ax) > 0.3 || Math.abs(ay) > 0.3) {
        input.stick.x = ax;
        input.stick.y = ay;
        if (ax < -0.5) padDown.add('left');
        if (ax > 0.5) padDown.add('right');
        if (ay < -0.5) padDown.add('up');
        if (ay > 0.5) padDown.add('down');
      }
    }
    padPressed.clear();
    for (const a of padDown) {
      if (!prevPad.has(a)) {
        padPressed.add(a);
        input.anyPressed = true;
        input.lastDevice = 'pad';
      }
    }
    prevPad = new Set(padDown);
  };

  input.down = (code) => !input.swallowed && keysDown.has(code);
  input.pressed = (code) => !input.swallowed && keysPressed.has(code);

  input.act = function (name) {
    if (input.swallowed) return false;
    if (padDown.has(name)) return true;
    const list = ACTIONS[name];
    for (const c of list) if (keysDown.has(c)) return true;
    return false;
  };
  input.hit = function (name) {
    if (input.swallowed) return false;
    if (padPressed.has(name)) return true;
    const list = ACTIONS[name];
    for (const c of list) if (keysPressed.has(c)) return true;
    return false;
  };
  input.released = function (name) {
    if (input.swallowed) return false;
    const list = ACTIONS[name];
    for (const c of list) if (keysReleased.has(c)) return true;
    return false;
  };

  input.tapIn = function (x, y, w, h) {
    if (input.swallowed) return null;
    for (const t of input.taps) {
      if (t.x >= x && t.x <= x + w && t.y >= y && t.y <= y + h) return t;
    }
    return null;
  };
  input.releaseIn = function (x, y, w, h) {
    if (input.swallowed) return null;
    for (const t of input.releases) {
      if (t.x >= x && t.x <= x + w && t.y >= y && t.y <= y + h) return t;
    }
    return null;
  };
  input.holdIn = function (x, y, w, h) {
    if (input.swallowed) return false;
    for (const p of input.pointers.values()) {
      if (p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h) return true;
    }
    return false;
  };
  input.hover = function (x, y, w, h) {
    const m = input.mouse;
    return m.active && m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;
  };
  input.anyTap = function () {
    return !input.swallowed && input.taps.length > 0;
  };
  input.anyKey = function () {
    return !input.swallowed && input.anyPressed;
  };

  // Az aktuális képkocka maradékára elnyeli a bemenetet
  input.swallow = function () {
    input.swallowed = true;
  };

  input.consumeTaps = function () {
    input.taps.length = 0;
  };

  input.endFrame = function () {
    keysPressed.clear();
    keysReleased.clear();
    input.taps.length = 0;
    input.releases.length = 0;
    input.wheel = 0;
    input.swallowed = false;
    input.anyPressed = false;
  };

  input.isTouch = function () {
    return input.lastDevice === 'touch' || ('ontouchstart' in window && input.lastDevice !== 'keyboard' && input.lastDevice !== 'pad');
  };

  TT.input = input;
})(window.TT);
