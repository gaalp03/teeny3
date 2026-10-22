'use strict';
// Bejárható Jump City: séta, NPC-k, edzők, épületek, rejtett figurák, minitérkép.
(function (TT) {
  const U = TT.U;
  const D = TT.D;

  let W; // TT.WORLD
  // a kiskedvenc: a TT2 Krypto kiegészítő modellje; elforgatás a figurákéhoz hasonlóan (0 = a néző felé)
  // kiskedvencek: a TT2 kiegészítőinek 3D modelljei; elforgatás a figurákéhoz hasonlóan (0 = a néző felé)
  const PETS = {
    krypto: { id: 'acc_krypto', name: 'Krypto', scale: 0.42, sfx: 'krypto', hop: 7, unlocked: (s) => !!s.flags.kryptoPet },
    penguin: { id: 'acc_penguin', name: 'Kis pingvin', scale: 0.5, sfx: 'penguin', hop: 4, unlocked: (s) => !!s.beaten.lex },
  };
  TT.PETS = PETS;
  // a kiválasztott kiskedvenc (ha még nem választott, az első megszerzett); 'none' = nincs
  TT.petOf = (s) => {
    if (s.pet === 'none') return null;
    if (s.pet && PETS[s.pet] && PETS[s.pet].unlocked(s)) return s.pet;
    return Object.keys(PETS).find((k) => PETS[k].unlocked(s)) || null;
  };
  const PET_YAW = { down: 0, right: -Math.PI / 2, left: Math.PI / 2, up: Math.PI };
  const PET_SNIFF = 90;
  // a kiskedvenc követi a játékost (k: méretarány, a Toronyban nagyobbak a figurák)
  TT.petStep = function (p, pl, dt, k) {
    k = k || 1;
    const back = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[pl.dir] || [0, -1];
    const tx = pl.x + (back[0] * 34 + 18) * k, ty = pl.y + (back[1] * 26 + 4) * k;
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d > 300 * k) {
      p.x = tx;
      p.y = ty;
    } else if (d > 3) {
      const step = Math.min(d, (pl.moving ? 230 : 140) * k * dt * Math.min(2, d / (30 * k)));
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
      if (Math.abs(dx) > Math.abs(dy) * 1.2) p.dir = dx > 0 ? 'right' : 'left';
      else if (Math.abs(dy) > 2) p.dir = dy > 0 ? 'down' : 'up';
    }
    p.moving = d > 6 * k;
    if (p.moving) p.walk += dt * 14;
  };
  TT.drawPet = function (ctx, p, x, y, k) {
    k = k || 1;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 13 * k, 5 * k, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();
    const pet = PETS[p.key];
    const hop = p.moving ? Math.abs(Math.sin(p.walk)) * pet.hop * k : 0;
    TT.art.drawFigure(ctx, pet, x, y + 2 - hop, pet.scale * k, {
      pedestal: false, yaw3d: PET_YAW[p.dir] || 0, anim3d: { name: 'idle', t: TT.time }, live3d: true,
    });
  };
  let solidGrid = null;
  let minimap = null;

  function buildSolid() {
    solidGrid = new Uint8Array(W.MW * W.MH);
    for (let y = 0; y < W.MH; y++) for (let x = 0; x < W.MW; x++) {
      if (W.SOLID.has(W.tile(x, y))) solidGrid[y * W.MW + x] = 1;
    }
    const mark = (x, y, w, h) => {
      for (let j = Math.floor(y); j < Math.ceil(y + h); j++) for (let i = Math.floor(x); i < Math.ceil(x + w); i++) {
        if (i >= 0 && j >= 0 && i < W.MW && j < W.MH) solidGrid[j * W.MW + i] = 1;
      }
    };
    for (const b of W.buildings) mark(b.x, b.y, b.w, b.h);
    for (const p of W.props) {
      if (p.kind === 'lamp' || p.kind === 'sign' || p.kind === 'hydrant' || p.kind === 'umbrella') mark(p.x + 0.25, p.y, 0.5, 0.5);
      else if (p.kind === 'statue') mark(p.x - 0.2, p.y - 0.2, 1.4, 0.8);
      else mark(p.x, p.y, p.w || 1, p.h || 1);
    }
  }

  function buildMinimap() {
    const c = TT.makeCanvas(W.MW * 2, W.MH * 2);
    const g = c.getContext('2d');
    const T = W.T;
    const col = {
      [T.WATER]: '#2f8fd8', [T.POND]: '#3fb2e8', [T.GRASS]: '#5cbf56', [T.FLOWER]: '#6fcf68', [T.TREE]: '#2e7d32',
      [T.ROAD]: '#4b4a5e', [T.CROSS]: '#6b6a7e', [T.WALK]: '#cfc8dc', [T.SAND]: '#f2d98d', [T.PLAZA]: '#e8d9b5',
      [T.BRIDGE]: '#b0763a', [T.DOCK]: '#9a6a3a', [T.HEDGE]: '#2e7d32', [T.ROCK]: '#9aa0a8', [T.DARK]: '#3a3552', [T.MINT]: '#bff0dc',
    };
    for (let y = 0; y < W.MH; y++) for (let x = 0; x < W.MW; x++) {
      g.fillStyle = col[W.tile(x, y)] || '#f0f';
      g.fillRect(x * 2, y * 2, 2, 2);
    }
    for (const b of W.buildings) {
      g.fillStyle = b.kind === 'house' ? '#c97b5a' : '#ff6b35';
      g.fillRect(b.x * 2, b.y * 2, b.w * 2, b.h * 2);
    }
    return c;
  }

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  const HELP = [
    { who: 'robin', text: 'Városban: WASD vagy nyilak (telefonon húzd az ujjad bal oldalt), Shift = futás, E vagy az A gomb = beszéd, belépés.' },
    { who: 'robin', text: 'Harcban a kártyák maguktól töltődnek. 1, 2, 3 (vagy koppintás) = támadás, R = szuper, Szóköz tartva = blokk, Q/E = csere.' },
    { who: 'raven', text: 'Amikor az ellenfél támad, kör zsugorodik a figurád körül. Ha zöld, amikor blokkolni kezdesz: tökéletes blokk, nulla sebzés.' },
    { who: 'cyborg', text: 'Típusok: Erő > Tech > Misztikus > Gyorsaság > Erő. Az erős típus 30%-kal többet sebez.' },
    { who: 'cyborg', text: 'Harc közben koppints a felső névpanelre (vagy nyomd meg a C-t): megmutatja a figura típusát, passzív képességét, támadásait és állapotait.' },
    { who: 'beastboy', text: 'Érmét harcokból, rejtett helyekről és kupákból kapsz. A Játékboltban dobozt vehetsz, a Toronyban és a Gyűjteményben csapatot rendezhetsz.' },
    { who: 'starfire', text: 'Minden nap 3 napi küldetést kapsz (bal felső sarok, vagy a Q gomb). Ha mindhármat teljesíted, bónusz jár!' },
  ];

  const scene = {
    enter(p) {
      W = TT.WORLD;
      if (!solidGrid) buildSolid();
      if (!minimap) minimap = buildMinimap();
      const s = TT.save;
      const TS = W.TS;
      const pos = p.pos || s.pos || W.start;
      this.pl = { x: pos.x * TS, y: pos.y * TS, dir: p.dir || 'down', walk: 0, moving: false };
      this.unstick();
      // régi mentés a kikötőben, a (megkerülhető) régi kapu mögött: vissza a kapu elé
      const dg = W.gates.find((g) => g.id === 'dockgate');
      if (dg && this.gateLocked(dg) && this.pl.y / TS >= dg.y + dg.h && Math.abs(this.pl.x / TS - (dg.x + dg.w / 2)) < 10) {
        this.pl.x = (dg.x + dg.w / 2) * TS;
        this.pl.y = (dg.y - 1.5) * TS;
      }
      this.cam = { x: 0, y: 0 };
      this.snapCam();
      this.t = 0;
      this.showMap = false;
      this.joy = null;
      this.gateMsgT = 0;
      this.prompt = null;
      this.menu = new TT.ui.Menu();
      this.stepT = 0;
      this.npcState = {};
      for (const n of W.npcs) this.npcState[n.id] = { face: n.dir || 'down' };
      TT.audio.music(this.musicKey());
      s.pos = { x: this.pl.x / TS, y: this.pl.y / TS };
      this.okCooldown = 0.45;
      this.thunderK = null;
      this.initPatrols();
      this.initCars();
      this.ev = TT.activeEvent();
      this.flakes = [];
      if (this.ev && s.flags.tutorial) {
        const st = TT.eventState(this.ev);
        if (!st.intro) {
          st.intro = true;
          TT.store.write();
          setTimeout(() => TT.ui.say([{ who: this.ev.id === 'xmas' ? 'beastboy' : 'raven', text: this.ev.intro }]), 600);
        }
      }
      if (p.event) this.runEvent(p.event);
      else if (TT.newsPending()) setTimeout(() => TT.scene === this && TT.newsPending() && TT.showNews(), 1200);
      TT.dailyReward();
      TT.checkAch();
    },

    // Ha a mentett hely azóta tömör lett (pl. új épület vagy fa), keressük a legközelebbi szabad mezőt
    unstick() {
      const TS = W.TS, pl = this.pl;
      if (!this.blocked(pl.x, pl.y)) return;
      const tx = Math.floor(pl.x / TS), ty = Math.floor(pl.y / TS);
      for (let r = 1; r <= 12; r++) {
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
          if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
          const x = (tx + i + 0.5) * TS, y = (ty + j + 0.5) * TS;
          if (!this.blocked(x, y)) {
            pl.x = x;
            pl.y = y;
            return;
          }
        }
      }
      pl.x = W.start.x * TS;
      pl.y = W.start.y * TS;
    },

    exit() {
      if (TT.save) {
        TT.save.pos = { x: this.pl.x / W.TS, y: this.pl.y / W.TS };
        TT.store.write();
      }
    },

    // ---------- Forgalom ----------
    initCars() {
      const TS = W.TS;
      const lanes = [];
      const H = (row, x0, x1, dir) => lanes.push({ axis: 'x', c: (row + 0.5) * TS, min: x0 * TS, max: x1 * TS, dir });
      const V = (col, y0, y1, dir) => lanes.push({ axis: 'y', c: (col + 0.5) * TS, min: y0 * TS, max: y1 * TS, dir });
      H(29, 5, 96, -1); H(30, 5, 96, 1); H(45, 5, 96, -1); H(46, 5, 96, 1);
      V(29, 20, 56, 1); V(30, 20, 56, -1); V(56, 20, 56, 1); V(57, 20, 56, -1); V(83, 21, 56, 1); V(84, 21, 56, -1);
      const cols = ['#e84545', '#3fa7ff', '#ffd23f', '#7bd65b', '#ff8c42', '#c06bff', '#f4f4f8', '#2a2a36'];
      const rnd = U.rng(Math.floor(TT.rtime || 1) + 7);
      this.cars = [];
      lanes.forEach((ln, li) => {
        const n = ln.axis === 'x' ? 3 : 2;
        for (let i = 0; i < n; i++) {
          this.cars.push({
            lane: ln, pos: ln.min + ((i + rnd()) / n) * (ln.max - ln.min), base: 95 + rnd() * 60, speed: 0,
            color: cols[(li * 3 + i) % cols.length], kind: rnd() < 0.18 ? 'van' : 'car', honk: 0,
          });
        }
      });
    },

    carXY(car) {
      const ln = car.lane;
      return ln.axis === 'x' ? { x: car.pos, y: ln.c } : { x: ln.c, y: car.pos };
    },

    updateCars(dt) {
      const pl = this.pl;
      for (const car of this.cars) {
        const ln = car.lane;
        let target = car.base;
        // gyalogos (a játékos) előtte
        const along = ln.axis === 'x' ? pl.x - car.pos : pl.y - car.pos;
        const perp = ln.axis === 'x' ? pl.y - 6 - ln.c : pl.x - ln.c;
        if (Math.abs(perp) < 26 && along * ln.dir > 0 && Math.abs(along) < 74) {
          target = 0;
          car.honk -= dt;
          if (car.honk <= 0 && Math.abs(along) < 60) {
            car.honk = 4;
            TT.audio.sfx('honk');
          }
        }
        // másik autó előtte
        for (const o of this.cars) {
          if (o === car || o.lane !== ln) continue;
          const d = (o.pos - car.pos) * ln.dir;
          if (d > 0 && d < 64) target = Math.min(target, o.speed * 0.9);
        }
        car.speed = U.approach(car.speed, target, dt * 220);
        car.pos += car.speed * ln.dir * dt;
        if (car.pos > ln.max + 40) car.pos = ln.min - 40;
        if (car.pos < ln.min - 40) car.pos = ln.max + 40;
      }
    },

    drawCar(ctx, car, x, y) {
      const horiz = car.lane.axis === 'x';
      const L = car.kind === 'van' ? 60 : 50, Wd = 26;
      ctx.save();
      ctx.translate(x, y);
      if (!horiz) ctx.rotate(Math.PI / 2);
      if (car.lane.dir < 0) ctx.scale(-1, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      TT.D.rr(ctx, -L / 2 + 2, -Wd / 2 + 5, L, Wd, 8);
      ctx.fill();
      ctx.fillStyle = '#1d1433';
      for (const wx of [-L / 2 + 10, L / 2 - 12]) for (const wy of [-Wd / 2 - 2, Wd / 2 - 3]) ctx.fillRect(wx, wy, 9, 5);
      TT.D.rr(ctx, -L / 2, -Wd / 2, L, Wd, 8);
      ctx.fillStyle = car.color;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      const rl = car.kind === 'van' ? L * 0.62 : L * 0.5;
      TT.D.rr(ctx, -rl / 2 - 3, -Wd / 2 + 4, rl, Wd - 8, 5);
      ctx.fillStyle = TT.U.shade(car.color, 0.2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#9be7ff';
      ctx.fillRect(rl / 2 - 6, -Wd / 2 + 6, 5, Wd - 12);
      ctx.fillStyle = '#ffe9a0';
      ctx.fillRect(L / 2 - 3, -Wd / 2 + 3, 3, 5);
      ctx.fillRect(L / 2 - 3, Wd / 2 - 8, 3, 5);
      ctx.restore();
    },

    // Napszak: 0 = nappal, 1 = éjszaka (valós idő szerint)
    darkness() {
      if (TT.settings.dayNight === 'day') return 0;
      const d = new Date();
      const h = d.getHours() + d.getMinutes() / 60;
      if (h >= 8 && h < 18) return 0;
      if (h >= 21 || h < 5.5) return 1;
      if (h < 8) return U.clamp((8 - h) / 2.5, 0, 1);
      return U.clamp((h - 18) / 3, 0, 1);
    },

    drawNight(ctx, cx, cy) {
      const d = this.darkness();
      if (d <= 0.01) return;
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = U.mix('#ffffff', '#40449a', d * 0.8);
      ctx.fillRect(0, 0, TT.W, TT.H);
      ctx.globalCompositeOperation = 'lighter';
      const glow = (x, y, r, c) => {
        if (x < -r || x > TT.W + r || y < -r || y > TT.H + r) return;
        const g = ctx.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, `rgba(${c},${0.45 * d})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      const TS = W.TS;
      for (const p of W.props) if (p.kind === 'lamp') glow(p.x * TS - cx + 16, p.y * TS - cy - 40, 110, '255,220,140');
      for (const b of W.buildings) if (b.door) glow(b.door[0] * TS - cx, b.door[1] * TS - cy - 20, 90, '255,200,120');
      for (const car of this.cars) {
        const p = this.carXY(car);
        const ln = car.lane;
        const fx = ln.axis === 'x' ? ln.dir * 46 : 0, fy = ln.axis === 'y' ? ln.dir * 46 : 0;
        glow(p.x - cx + fx, p.y - cy + fy, 50, '255,240,180');
      }
      glow(this.pl.x - cx, this.pl.y - cy - 30, 70, '120,120,190');
      ctx.restore();
    },

    // ---------- Menta-járőrök ----------
    initPatrols() {
      const TS = W.TS;
      TT.patrolState = TT.patrolState || {};
      this.patrols = W.patrols.map((p) => {
        let st = TT.patrolState[p.id];
        if (!st) {
          st = TT.patrolState[p.id] = { x: p.path[0][0] * TS, y: p.path[0][1] * TS, wp: 1, walk: 0, face: 1, cdUntil: 0 };
        }
        st.def = p;
        st.chase = false;
        st.stuck = 0;
        return st;
      });
      this.patrolGrace = 2.5;
    },

    updatePatrols(dt) {
      const TS = W.TS;
      const pl = this.pl;
      const active = TT.cupDone('rookie');
      const busy = TT.ui.overlayActive() || TT.isFading();
      this.patrolGrace -= dt;
      for (const pt of this.patrols) {
        pt.visible = active && TT.rtime > (pt.cdUntil || 0);
        if (!pt.visible || busy) continue;
        const d = U.dist(pt.x, pt.y, pl.x, pl.y);
        pt.chase = d < 150 && this.patrolGrace <= 0;
        let tx, ty, sp;
        if (pt.chase) {
          tx = pl.x;
          ty = pl.y;
          sp = 118;
        } else {
          const w = pt.def.path[pt.wp];
          tx = w[0] * TS;
          ty = w[1] * TS;
          sp = 70;
          if (U.dist(pt.x, pt.y, tx, ty) < 4) pt.wp = (pt.wp + 1) % pt.def.path.length;
        }
        const dx = tx - pt.x, dy = ty - pt.y, dd = Math.hypot(dx, dy) || 1;
        const mx = (dx / dd) * sp * dt, my = (dy / dd) * sp * dt;
        const ox = pt.x, oy = pt.y;
        if (!this.blocked(pt.x + mx, pt.y)) pt.x += mx;
        if (!this.blocked(pt.x, pt.y + my)) pt.y += my;
        const moved = Math.hypot(pt.x - ox, pt.y - oy);
        pt.stuck = moved < sp * dt * 0.3 ? pt.stuck + dt : 0;
        if (pt.stuck > 1.5 && !pt.chase) {
          // beragadt: vissza az útvonalra
          const w = pt.def.path[pt.wp];
          pt.x = w[0] * TS;
          pt.y = w[1] * TS;
          pt.stuck = 0;
        }
        if (Math.abs(dx) > 1) pt.face = dx > 0 ? 1 : -1;
        pt.walk += dt * 9;
        if (d < 26 && this.patrolGrace <= 0) {
          this.patrolBattle(pt);
          return;
        }
      }
    },

    patrolBattle(pt) {
      const s = TT.save;
      const TS = W.TS;
      const lvl = U.clamp(this.teamLvl() - 1, 2, TT.MAX_LVL);
      const team = [
        { id: 'mintguard', lvl },
        { id: U.pick(['boxbot', 'mintguard', 'gizmo']), lvl },
        { id: U.pick(['boxbot', 'seemore', 'mammoth', 'billy', 'drlight']), lvl },
      ];
      const lines = [
        'BEEP. Bontott figura észlelve. Azonnali becsomagolás!',
        'MR. MINT PARANCSA: MINDEN FIGURÁT A DOBOZBA.',
        'ÁLLJ! Ellenőrzés. Ez a figura… KI VAN BONTVA!',
        'BOOP. Járőrözés közben ellenfél. Harc protokoll indul.',
      ];
      pt.cdUntil = TT.rtime + 150;
      pt.chase = false;
      const back = { x: this.pl.x / TS, y: this.pl.y / TS };
      const dir = this.pl.dir;
      TT.audio.sfx('error');
      TT.go('battle', {
        night: this.darkness() > 0.5,
        enemy: {
          name: 'Menta-járőr', who: 'mintguard', team, bg: U.pick(['street', 'park']),
          ai: Math.min(0.66, 0.28 + lvl * 0.02), coins: 50 + lvl * 10,
          intro: [{ who: 'mintguard', text: U.pick(lines) }],
        },
        after: (won) => {
          if (won) s.stats.patrols = (s.stats.patrols || 0) + 1;
          else pt.cdUntil = TT.rtime + 40;
          TT.store.write();
          if (won) TT.checkAch();
          TT.go('world', { pos: back, dir });
        },
      });
    },

    inHive() {
      const tx = this.pl.x / W.TS, ty = this.pl.y / W.TS;
      return tx > 86 && ty > 47 && ty < 58;
    },

    snapCam() {
      const TS = W.TS;
      this.cam.x = U.clamp(this.pl.x - TT.W / 2, 0, W.MW * TS - TT.W);
      this.cam.y = U.clamp(this.pl.y - TT.H / 2 - 70, -160, W.MH * TS - TT.H);
    },

    // ---------- Ütközés ----------
    gateLocked(g) {
      return !TT.cupDone(g.req);
    },
    blocked(px, py) {
      const TS = W.TS;
      const hw = 9, hh = 5;
      const pts = [[px - hw, py - hh], [px + hw, py - hh], [px - hw, py + hh], [px + hw, py + hh]];
      for (const [x, y] of pts) {
        const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
        if (tx < 0 || ty < 0 || tx >= W.MW || ty >= W.MH) return true;
        if (solidGrid[ty * W.MW + tx]) return true;
        for (const g of W.gates) {
          if (tx >= g.x && tx < g.x + g.w && ty >= g.y && ty < g.y + g.h && this.gateLocked(g)) return g;
        }
      }
      for (const n of W.npcs) {
        if (!this.npcVisible(n)) continue;
        if (Math.abs(px - n.x * TS) < 18 && Math.abs(py - n.y * TS) < 12) return true;
      }
      return false;
    },

    npcVisible(n) {
      if (n.id === 'redx') return TT.cupDone('brotherhood');
      // a DC vendégek: Wonder Woman a Gonosz Kupa után, Joker a Kelet Kupa után jelenik meg
      if (n.id === 'league') return TT.cupDone('villain');
      if (n.id === 'joker') return TT.cupDone('east');
      // Lex Luthor a Menta Kupa után költözik be Mr. Mint trezorához
      if (n.id === 'lex') return TT.cupDone('mint');
      // Bizarro a Gonosz Kupa után napozik a strandon
      if (n.id === 'bizarro') return TT.cupDone('villain');
      // Csuklyás Hood a Testvériség Kupa után vadászik a parkban (csak éjjel harcol)
      if (n.id === 'hood') return TT.cupDone('brotherhood');
      // legyőzése után Trigon eltűnik (a történet szerint bezárult a kapuja)
      if (n.id === 'trigon') return TT.cupDone('brotherhood') && !!TT.save.beaten.redx && !TT.save.beaten.trigon;
      return true;
    },

    // éjjel (ha van saját zene hozzá) más szól a városban
    musicKey() {
      return this.inHive() ? 'hive' : this.darkness() > 0.6 ? 'town_night' : 'town';
    },

    isNight() {
      return TT.settings.dayNight === 'day' || this.darkness() > 0.5;
    },

    // ---------- Interakciók ----------
    interactables() {
      const TS = W.TS;
      const list = [];
      for (const n of W.npcs) {
        if (!this.npcVisible(n)) continue;
        list.push({ kind: 'npc', n, x: n.x * TS, y: n.y * TS, r: 46 });
      }
      for (const b of W.buildings) {
        if (!b.door) continue;
        list.push({ kind: 'door', b, x: b.door[0] * TS, y: b.door[1] * TS + 6, r: 34 });
      }
      for (const h of W.hidden) {
        if (TT.save.found[h.id]) continue;
        list.push({ kind: 'hidden', h, x: h.x * TS, y: h.y * TS, r: 40 });
      }
      return list;
    },

    nearest() {
      const pl = this.pl;
      const [dx, dy] = DIRS[pl.dir];
      const fx = pl.x + dx * 14, fy = pl.y + dy * 14;
      let best = null, bd = Infinity;
      for (const it of this.interactables()) {
        const d = U.dist(fx, fy, it.x, it.y);
        if (d < it.r && d < bd) {
          bd = d;
          best = it;
        }
      }
      return best;
    },

    interact(it) {
      if (!it) return;
      if (it.kind === 'npc') this.talkTo(it.n);
      else if (it.kind === 'door') this.enterBuilding(it.b);
      else if (it.kind === 'hidden') this.collect(it.h);
    },

    talkTo(n) {
      const s = TT.save;
      TT.audio.sfx('npc');
      const TS = W.TS;
      // forduljon a játékos felé
      const dx = this.pl.x - n.x * TS, dy = this.pl.y - n.y * TS;
      this.npcState[n.id].face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      if (n.talk) {
        const lines = TT.TALKS[n.talk]();
        if (lines) TT.ui.say(lines);
        else if (n.talk === 'silkie') this.silkieReward();
        return;
      }
      if (n.trainer) {
        const tr = TT.TRAINERS[n.trainer];
        const beaten = s.beaten[n.trainer];
        if (n.trainer === 'tutorial') {
          if (!beaten) this.startTrainer(n, tr, true);
          else {
            TT.ui.say([{ who: 'cyborg', text: 'Az edzés megvolt, most irány a Csatakupola! Ha gyakorolnál, szólj, és visszavágunk.' }], () => {
              TT.ui.confirm('Gyakorló meccs Cyborggal?', (ok) => ok && this.startTrainer(n, Object.assign({}, tr, { tutorial: false, team: tr.team.map((t) => ({ id: t.id, lvl: Math.max(t.lvl, this.teamLvl()) })) }), false));
            });
          }
          return;
        }
        if (tr.night && !this.isNight()) {
          TT.ui.say([{ who: tr.who, text: tr.dayText || 'Nappal nem harcolok, Madárfiú. Gyere vissza, ha besötétedik.' }]);
          return;
        }
        if (!beaten) {
          TT.ui.say([{ who: tr.who, text: 'Hé, te ott! Figurás párbaj?' }], () => {
            TT.ui.confirm(`Harc ${tr.name} ellen? (csapatszint: ${tr.team.map((t) => t.lvl).join('/')})`, (ok) => ok && this.startTrainer(n, tr, true), 'Harc!', 'Majd később');
          });
        } else {
          TT.ui.say([{ who: tr.who, text: 'Visszavágó? Most már komolyabban veszem!' }], () => {
            TT.ui.confirm('Visszavágó (erősebb csapat, kevesebb érme)?', (ok) => {
              if (!ok) return;
              const lv = Math.max(...tr.team.map((t) => t.lvl), this.teamLvl());
              const tr2 = Object.assign({}, tr, { coins: Math.round(tr.coins * 0.5), team: tr.team.map((t) => ({ id: t.id, lvl: lv })), intro: null });
              this.startTrainer(n, tr2, false);
            }, 'Harc!', 'Nem');
          });
        }
      }
    },

    teamLvl() {
      const s = TT.save;
      return Math.round(s.team.reduce((a, id) => a + (s.owned[id] ? s.owned[id].lvl : 1), 0) / s.team.length);
    },

    startTrainer(n, tr, first) {
      const s = TT.save;
      const TS = W.TS;
      const back = { x: this.pl.x / TS, y: this.pl.y / TS };
      const dir = this.pl.dir;
      const rewardFigs = first && tr.reward && tr.reward.figs ? tr.reward.figs : [];
      TT.go('battle', {
        night: this.darkness() > 0.5,
        // a búcsúszöveg (pl. „itt a figurám”) csak az első győzelemhez illik
        enemy: Object.assign({ bg: tr.bg || 'street' }, tr, first ? {} : { outro: null }),
        tutorial: !!tr.tutorial && first,
        noForfeit: !!tr.tutorial && first,
        rewardFigs,
        // a haladás a jutalommal együtt mentődik (ha az eredményképernyőn bezárják a játékot)
        onResult: (won) => {
          if (!won || !first) return;
          s.beaten[n.trainer] = true;
          if (n.trainer === 'tutorial') s.flags.tutorial = true;
          // a Pingvin itt hagyja a kis pingvinjét
          if (n.trainer === 'lex') {
            s.flags.penguinPetNew = true;
            s.pet = 'penguin';
          }
        },
        after: (won) => {
          let ev = null;
          if (won && first) {
            if (n.trainer === 'tutorial') ev = 'after_tutorial';
            if (n.trainer === 'blood') ev = 'after_blood';
            if (n.trainer === 'trigon') ev = 'after_trigon';
          }
          TT.store.write();
          TT.go('world', { pos: back, dir, event: ev });
        },
      });
    },

    enterBuilding(b) {
      const s = TT.save;
      TT.audio.sfx('door');
      const TS = W.TS;
      const back = { x: b.door[0], y: b.door[1] + 1.15 };
      s.pos = back;
      switch (b.id) {
        case 'toyshop':
          TT.go('shop', { back });
          break;
        case 'dome':
          if (!s.flags.tutorial) {
            TT.ui.say([{ who: 'kid_bela', text: 'Hoppá! Előbb fejezd be az edzést Cyborggal a Toronynál!' }]);
            return;
          }
          TT.go('dome', { back, venue: 'dome' });
          break;
        case 'vault':
          TT.go('dome', { back, venue: 'vault' });
          break;
        case 'tower':
          TT.go('tower', { back });
          break;
        case 'pizza':
          this.pizzaMenu();
          break;
        case 'comics':
          this.comicsMenu(back);
          break;
        case 'factory':
          if (!TT.cupDone('east')) {
            TT.ui.say([{ who: 'mintguard', text: 'BEEP. A Menta Gyár zárva. Belépés csak a Kelet Kupa győztesének.' }]);
            return;
          }
          TT.go('factory', { back });
          break;
        case 'hive':
          TT.ui.say(s.beaten.blood ? [{ who: 'kid_hive', text: 'Az Akadémia ma zárva. Az igazgató úr… figurázik.' }] :
            [{ who: 'kid_hive', text: 'Csak az léphet be, aki legyőzi Brother Bloodot. Ott áll az ajtó mellett.' }]);
          break;
        default:
          break;
      }
      void TS;
    },

    pizzaMenu() {
      const s = TT.save;
      const price = 120;
      TT.ui.choose({
        title: 'Pizzéria',
        text: `Pizzaparti: mind a 3 csapattag +80 XP (${price} érme). Vagy próbáld ki a Pizzafogót érméért! (Neked ${U.fmt(s.coins)} van.)`,
        options: [
          { label: 'Pizzafogó játék', value: 'game', color: '#2ecc71' },
          { label: 'Büfé: harci kellékek', value: 'shop', color: '#2a9d8f' },
          { label: `Pizzaparti! (${price})`, value: 'buy', disabled: s.coins < price },
          { label: 'Csak nézelődöm', value: null },
        ],
      }, (v) => {
        if (v === 'shop') {
          this.itemShop();
          return;
        }
        if (v === 'game') {
          const b = W.buildings.find((x) => x.id === 'pizza');
          TT.go('pizzagame', { back: { x: b.door[0], y: b.door[1] + 1.15 } });
          return;
        }
        if (v !== 'buy') return;
        s.coins -= price;
        let ups = 0;
        for (const id of s.team) ups += TT.addXp(id, 80);
        TT.store.write();
        TT.audio.sfx('buy');
        if (ups) TT.checkAch();
        TT.ui.say([{ who: 'kid_pizza', text: 'Mamma mia! Egy pizza mindenre jó!' + (ups ? ' Valaki szintet is lépett!' : '') }]);
      });
    },

    itemShop() {
      const s = TT.save;
      s.items = s.items || {};
      TT.ui.choose({
        title: 'Büfé',
        text: `Harcban a KELLÉK gombbal (F) használhatod, harconként kettőt. Érméd: ${U.fmt(s.coins)}`,
        buttonH: 52, width: 600, size: 19,
        options: Object.entries(TT.ITEMS).map(([id, it]) => ({
          label: `${it.name} — ${it.price} érme (${s.items[id] || 0}/${TT.ITEM_MAX})`, value: id, desc: it.desc,
          disabled: s.coins < it.price || (s.items[id] || 0) >= TT.ITEM_MAX,
          onDisabled: () => TT.ui.toast((s.items[id] || 0) >= TT.ITEM_MAX ? 'Ebből már tele a hátizsák.' : 'Nincs elég érméd!', { color: '#ff8a80' }),
        })).concat([{ label: 'Kész', value: null, color: '#6c5ce7' }]),
      }, (v) => {
        if (!v) return;
        const it = TT.ITEMS[v];
        if (s.coins < it.price) return;
        s.coins -= it.price;
        s.items[v] = (s.items[v] || 0) + 1;
        TT.store.write();
        TT.audio.sfx('buy');
        TT.ui.toast(`${it.name}: ${it.desc}`);
        this.itemShop();
      });
    },

    comicsMenu(back) {
      TT.ui.choose({
        title: 'Képregénybolt',
        text: 'Gyűjtő Géza boltja: képregények, figurák, memóriajáték a pult mellett, hátul pedig Control Freak kvízműsora.',
        options: [
          { label: 'Figura-memória (minijáték)', value: 'memory', color: '#ff6b35' },
          { label: 'Titán-kvíz (Control Freak műsora)', value: 'quiz', color: '#c06bff' },
          { label: 'Gyűjtői jutalmak', value: 'rewards', color: '#3f6fd8' },
          { label: 'Mégse', value: null },
        ],
      }, (v) => {
        if (v === 'memory') TT.go('memory', { back });
        else if (v === 'quiz') TT.go('quiz', { back });
        else if (v === 'rewards') this.collectorRewards();
      });
    },

    collectorRewards() {
      const s = TT.save;
      const have = Object.keys(s.owned).length;
      const goals = [
        { n: 10, coins: 300, id: 'm10' },
        { n: 20, coins: 700, id: 'm20' },
        { n: 30, coins: 1500, id: 'm30' },
        { n: TT.FIG_LIST.length, coins: 5000, id: 'mall' },
      ];
      const lines = [{ who: 'kid_geza', text: `Gyűjtői jutalmak! Neked ${have} / ${TT.FIG_LIST.length} figurád van.` }];
      let got = 0;
      for (const g of goals) {
        if (have >= g.n && !s.flags[g.id]) {
          s.flags[g.id] = true;
          s.coins += g.coins;
          got += g.coins;
          lines.push({ who: 'kid_geza', text: `${g.n} figura összegyűjtve! Jutalom: ${g.coins} érme.` });
        }
      }
      const next = goals.find((g) => have < g.n);
      if (next) lines.push({ who: 'kid_geza', text: `Következő jutalom ${next.n} figuránál: ${next.coins} érme.` });
      else if (!got) lines.push({ who: 'kid_geza', text: 'Minden figurát összegyűjtöttél! Te vagy a Teeny Bajnok!' });
      if (got) {
        TT.audio.sfx('buy');
        TT.store.write();
      }
      TT.ui.say(lines);
    },

    silkieReward() {
      const s = TT.save;
      s.flags.silkieDone = true;
      s.coins += 400;
      const info = TT.grantFigure('silkie_gold');
      TT.store.write();
      TT.ui.say([
        { who: 'silkie', text: '*NAGYON boldog Silkie hangok*' },
        { who: 'starfire', text: 'Megvan mind a hat! Silkie annyira hálás, hogy neked adja a legféltettebb kincsét…' },
        { who: 'starfire', text: '…egy színarany Silkie figurát! És 400 érmét a mosolyáért!' },
      ], () => TT.ui.reveal('silkie_gold', info, () => TT.checkAch()));
    },

    collectToy(t) {
      const s = TT.save;
      s.toys = s.toys || {};
      s.toys[t.id] = true;
      TT.store.write();
      const n = W.toys.filter((x) => s.toys[x.id]).length;
      TT.audio.sfx('found');
      TT.ui.toast(`Silkie játéka: ${t.name} (${n}/${W.toys.length})`, { color: '#ff9ecd' });
      TT.fx.burst(t.x * W.TS - this.cam.x, t.y * W.TS - this.cam.y - 10, 14, { color: '#ff9ecd', shape: 'star', speed: 180, size: 6, life: 0.6, layer: 1 });
      if (n === W.toys.length) setTimeout(() => TT.ui.toast('Mind megvan! Vidd vissza Silkie-nek a Toronyhoz!', { color: '#ff9ecd', dur: 4 }), 900);
    },

    // ---------- Szezonális esemény ----------
    eventItems() {
      if (!this.ev || !TT.save.flags.tutorial) return [];
      const st = TT.eventState(this.ev);
      if (st.done) return [];
      return this.ev.spots.map((p, i) => ({ i, x: p[0], y: p[1] })).filter((p) => !st.found[p.i]);
    },

    collectEventItem(it) {
      const s = TT.save;
      const ev = this.ev;
      const st = TT.eventState(ev);
      st.found[it.i] = true;
      const n = Object.keys(st.found).length;
      TT.audio.sfx('found');
      TT.ui.toast(`${ev.itemName}: ${n}/${ev.spots.length}`, { color: ev.color });
      TT.fx.burst(it.x * W.TS - this.cam.x, it.y * W.TS - this.cam.y - 10, 14, { color: ev.color, shape: 'star', speed: 180, size: 6, life: 0.6, layer: 1 });
      if (n >= ev.spots.length) {
        st.done = true;
        s.coins += ev.coins;
        const info = TT.grantFigure(ev.reward);
        TT.store.write();
        setTimeout(() => {
          TT.ui.toast(`${ev.name} esemény teljesítve! +${ev.coins} érme`, { color: ev.color, dur: 4 });
          TT.ui.reveal(ev.reward, info, () => TT.checkAch());
        }, 500);
      } else TT.store.write();
    },

    drawEventItem(ctx, it, x, y) {
      const b = Math.sin(TT.time * 3 + it.i) * 3;
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(TT.time * 5 + it.i) * 0.12;
      ctx.beginPath();
      ctx.arc(x, y - 6, 18, 0, Math.PI * 2);
      ctx.fillStyle = this.ev.color;
      ctx.fill();
      ctx.restore();
      if (this.ev.id === 'halloween') this.drawPumpkin(ctx, x, y - 6 + b, 1);
      else this.drawGift(ctx, x, y - 6 + b);
    },

    drawPumpkin(ctx, x, y, s) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.fillStyle = '#ff8c1a';
      ctx.strokeStyle = '#1d1433';
      ctx.lineWidth = 2;
      for (const [ox, rx] of [[-6, 8], [6, 8], [0, 9]]) {
        ctx.beginPath();
        ctx.ellipse(ox, 0, rx, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(-1.5, -14, 3, 5);
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.moveTo(-6, -3); ctx.lineTo(-3, -6); ctx.lineTo(-1, -2); ctx.closePath();
      ctx.moveTo(6, -3); ctx.lineTo(3, -6); ctx.lineTo(1, -2); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, 3); ctx.lineTo(-3, 6); ctx.lineTo(0, 3); ctx.lineTo(3, 6); ctx.lineTo(6, 3); ctx.lineTo(0, 8); ctx.closePath();
      ctx.fill();
      ctx.restore();
    },

    drawGift(ctx, x, y) {
      ctx.save();
      TT.D.rr(ctx, x - 11, y - 10, 22, 20, 3);
      ctx.fillStyle = '#d62828';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x - 2.5, y - 10, 5, 20);
      ctx.fillRect(x - 11, y - 2.5, 22, 5);
      ctx.beginPath();
      ctx.ellipse(x - 5, y - 13, 5, 3, -0.4, 0, Math.PI * 2);
      ctx.ellipse(x + 5, y - 13, 5, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },

    drawSeason(ctx) {
      if (!this.ev) return;
      if (this.ev.id === 'xmas') {
        if (this.flakes.length < 90) this.flakes.push({ x: Math.random() * TT.W, y: -10, v: 30 + Math.random() * 50, s: 1.5 + Math.random() * 2.5, ph: Math.random() * 6 });
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for (const f of this.flakes) {
          f.y += f.v / 60;
          f.x += Math.sin(TT.time + f.ph) * 0.4;
          if (f.y > TT.H + 10) {
            f.y = -10;
            f.x = Math.random() * TT.W;
          }
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    },

    toyActive(t) {
      const s = TT.save;
      return s.flags.silkieQuest && !s.flags.silkieDone && !(s.toys && s.toys[t.id]);
    },

    collect(h) {
      const s = TT.save;
      s.found[h.id] = true;
      if (h.fig) {
        const info = TT.grantFigure(h.fig);
        TT.store.write();
        TT.audio.sfx('found');
        TT.ui.reveal(h.fig, info, () => TT.checkAch());
      } else {
        s.coins += h.coins;
        TT.store.write();
        TT.audio.sfx('coin');
        TT.ui.toast(`+${h.coins} érme!`);
        TT.checkAch();
        TT.fx.burst(h.x * W.TS - this.cam.x, h.y * W.TS - this.cam.y - 10, 12, { color: '#ffd23f', shape: 'star', speed: 180, size: 6, life: 0.6, layer: 1 });
      }
    },

    // ---------- Történet ----------
    runEvent(ev) {
      const s = TT.save;
      if (ev === 'newgame') {
        TT.ui.say([
          { who: 'robin', text: 'Titánok! Megjelent a… TEENY TITANS 3! Új figurák, új liga, új Csatakupola a belvárosban!' },
          { who: 'beastboy', text: `Duuude! ${TT.FIG_LIST.length} figura! Mindet akarom! Kétszer!` },
          { who: 'cyborg', text: 'És a Teeny Titans 3 Világliga díja egy színarany Ultra Robin figura. BOOYAH!' },
          { who: 'raven', text: 'Remek. Biztos nem lesz belőle semmi baj.' },
          { who: 'mrmint', text: 'Ahem. Jó napot, Jump City. Itt Mr. Mint, a világ legnagyobb gyűjtője.' },
          { who: 'mrmint', text: 'Bejelentem: a város összes figurája az enyém lesz. Bontatlanul. A dobozban. ÖRÖKRE.' },
          { who: 'starfire', text: 'De… a figurák arra valók, hogy játsszunk velük! Ez nagyon nem dicsőséges!' },
          { who: 'robin', text: 'Akkor megnyerjük a ligát, mielőtt ő nyeri meg! Cyborg, kezdjük egy edzéssel!' },
        ]);
      } else if (ev === 'after_tutorial') {
        TT.ui.say([
          { who: 'cyborg', text: 'Na, ez az! A figuráink mostantól a te gyűjteményedben vannak.' },
          { who: 'robin', text: 'Irány a Csatakupola délre a belvárosban! A Játékboltban pedig dobozokat vehetünk.' },
          { who: 'raven', text: 'A Toronyban rendezheted a csapatod. Három figura harcol, okosan válassz.' },
        ]);
      } else if (ev === 'cup_rookie') {
        TT.ui.say([
          { who: 'robin', text: 'Megvan az Újonc Kupa!' },
          { who: 'mrmint', text: 'Gratulálok. Egy szép, csillogó kupa. Kár, hogy nem bontatlan.' },
          { who: 'mrmint', text: 'A H.I.V.E. diákjai épp a figuráimat… izé, a figuráikat tesztelik. Nézzetek be, ha mertek.' },
          { who: 'beastboy', text: 'A H.I.V.E. negyed kinyitott keleten! És a boltban van Prémium doboz!' },
        ]);
      } else if (ev === 'cup_east') {
        TT.ui.say([
          { who: 'bumblebee', text: 'Szép munka, Titánok. A Kelet veletek van. Más y Menos figuráját is vigyétek!' },
          { who: 'cyborg', text: 'A kikötőt is kinyitották. Valaki ott egy nagy, szürke ládát látott…' },
        ]);
      } else if (ev === 'cup_villain') {
        TT.ui.say([
          { who: 'slade', text: 'Lenyűgöző, Robin. De ez még csak a kezdet volt.' },
          { who: 'mrmint', text: 'Elég! Ha a figuráitokat nem tudom megvenni, elnyerem őket. A trezoromban várlak — a Menta Kupán.' },
          { who: 'robin', text: 'A trezor hídja nyitva, északnyugaton. Titánok — HARCRA FEL!' },
        ]);
      } else if (ev === 'cup_mint') {
        TT.ui.say([
          { who: 'mrmint', text: 'A gyűjteményem… szabad. Minden figura kibontva…' },
          { who: 'starfire', text: 'Ne légy szomorú, Mr. Mint! Most már játszhatsz is velük! Az sokkal jobb!' },
          { who: 'mrmint', text: '…Játszani? Hmm. Talán… egyszer kipróbálom.' },
          { who: 'robin', text: 'Megcsináltuk, Titánok! A Teeny Titans 3 Világliga bajnokai!' },
        ], () => TT.go('credits'));
      } else if (ev === 'cup_brotherhood') {
        TT.ui.say([
          { who: 'cyborg', text: 'A Gonosz Testvériség is kiütve! Brain figurája a miénk. BOOYAH!' },
          { who: 'raven', text: 'Hallottam valamit. Éjjelente egy Red X nevű alak ólálkodik a kikötőben, és figurákat lop.' },
          { who: 'robin', text: 'Red X… Ezt el kell intéznem. Személyesen.' },
        ]);
      } else if (ev === 'after_blood') {
        TT.ui.say([{ who: 'raven', text: 'Brother Blood figurája. Nem akarom tudni, mit csinált vele eddig.' }]);
      } else if (ev === 'after_trigon') {
        TT.ui.say([
          { who: 'raven', text: 'Vége. Apa kapuja bezárult… és a figurám fénye mostantól a tiétek is.' },
          { who: 'starfire', text: 'Raven, te ragyogsz! Szó szerint! Ez a legszebb figura a gyűjteményünkben!' },
          { who: 'beastboy', text: 'Trigont legyőzni egy figurás csatában… ezt senki nem fogja elhinni nekünk.' },
          { who: 'robin', text: 'Titánok, ma nemcsak egy kupát nyertünk. Megvédtük Jump City összes figuráját!' },
        ]);
      }
      void s;
    },

    openMenu() {
      TT.audio.sfx('select');
      TT.ui.choose({
        title: 'Menü',
        buttonH: 46, width: 600, columns: 2, size: 19,
        options: [
          { label: 'Csapat és gyűjtemény', value: 'team' },
          { label: TT.wheelReady() ? 'Szerencsekerék!' : 'Szerencsekerék', value: 'wheel', color: TT.wheelReady() ? '#ffb000' : undefined },
          { label: 'Térkép', value: 'map' },
          ...(TT.petOf(TT.save) || TT.save.pet === 'none' ? [{ label: 'Kiskedvenc', value: 'pet' }] : []),
          { label: 'Napi küldetések', value: 'quests' },
          { label: 'Teljesítmények', value: 'ach' },
          { label: 'Profil és rekordok', value: 'profile' },
          { label: 'Mentés', value: 'save' },
          { label: 'Beállítások', value: 'settings' },
          { label: 'Súgó', value: 'help' },
          { label: 'Főmenü', value: 'title', color: '#6c5ce7' },
        ],
      }, (v) => {
        if (v === 'team') TT.go('collection', { from: 'world' });
        else if (v === 'wheel') TT.go('wheel', { back: { x: this.pl.x / W.TS, y: this.pl.y / W.TS } });
        else if (v === 'map') this.toggleMap();
        else if (v === 'pet') this.choosePet();
        else if (v === 'save') {
          TT.store.write();
          TT.ui.toast('Játék elmentve!');
        } else if (v === 'settings') TT.openSettings();
        else if (v === 'help') TT.ui.say(HELP);
        else if (v === 'ach') TT.openAchievements();
        else if (v === 'quests') TT.openQuests();
        else if (v === 'profile') TT.openProfile();
        else if (v === 'title') {
          TT.store.write();
          TT.go('title');
        }
      });
    },

    // ---------- Frissítés ----------
    touchLayout() {
      return {
        a: { x: TT.W - 120, y: TT.H - 128, r: 48 },
        menu: { x: TT.W - 66, y: 12, w: 54, h: 46 },
        map: { x: TT.W - 128, y: 12, w: 54, h: 46 },
        quest: { x: 12, y: 58, w: 150, h: 32 },
      };
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      const s = TT.save;
      const TS = W.TS;
      // napszakváltáskor (valós idő) egy Titán a csapatból köszönti az éjszakát / a reggelt
      const dark = this.darkness() > 0.5;
      if (this.wasDark != null && dark !== this.wasDark) TT.audio.voiceFrom(s.team.slice(), dark ? 'night' : 'day', 1);
      this.wasDark = dark;
      // vihar: mennydörgés kicsivel a villám után
      if (TT.weatherNow() === 'storm') {
        const k = Math.floor((TT.time + 3) / TT.backdrop.THUNDER_EVERY);
        if (this.thunderK != null && k !== this.thunderK) setTimeout(() => TT.scene === this && TT.audio.sfx('thunder'), 350);
        this.thunderK = k;
      } else this.thunderK = null;
      const pl = this.pl;
      const L = this.touchLayout();

      // menü / térkép
      if (I.hit('menu') || I.tapIn(L.menu.x, L.menu.y, L.menu.w, L.menu.h)) {
        this.openMenu();
        return;
      }
      if (I.hit('map') || I.tapIn(L.map.x, L.map.y, L.map.w, L.map.h)) {
        this.toggleMap();
        TT.audio.sfx('select');
      }
      // gyors utazás: épületnévre koppintás a térképen
      if (this.showMap) {
        for (const tp of I.taps) {
          const lab = (this.mapLabels || []).find((r) => tp.x >= r.x - 6 && tp.x <= r.x + r.w + 6 && tp.y >= r.y - 6 && tp.y <= r.y + r.h + 6);
          if (!lab) continue;
          if (lab.ok) {
            TT.audio.sfx('select');
            TT.ui.confirm(`Gyors utazás ide: ${lab.b.name}?`, (ok) => ok && this.fastTravel(lab.b), 'Utazás', 'Mégse');
          } else TT.ui.toast('Oda még nem jutsz el gyalog sem.', { color: '#ff8a80' });
          I.consumeTaps();
          return;
        }
        I.consumeTaps();
      }
      if (TT.questSummary() && (I.pressed('KeyQ') || I.tapIn(L.quest.x, L.quest.y, L.quest.w, L.quest.h))) {
        TT.audio.sfx('select');
        TT.openQuests();
        return;
      }

      // érintéses joystick
      let jx = 0, jy = 0;
      for (const tp of I.taps) {
        const onQuest = tp.x < L.quest.x + L.quest.w && tp.y < L.quest.y + L.quest.h;
        if (tp.x < TT.W * 0.5 && tp.y > 70 && !onQuest && !this.joy) this.joy = { id: tp.id, ox: tp.x, oy: tp.y, x: tp.x, y: tp.y };
      }
      if (this.joy) {
        const ptr = I.pointers.get(this.joy.id);
        if (!ptr) this.joy = null;
        else {
          this.joy.x = ptr.x;
          this.joy.y = ptr.y;
          const dx = ptr.x - this.joy.ox, dy = ptr.y - this.joy.oy;
          const d = Math.hypot(dx, dy);
          if (d > 8) {
            jx = dx / Math.max(d, 50);
            jy = dy / Math.max(d, 50);
          }
          if (d > 60) {
            this.joy.ox = ptr.x - (dx / d) * 60;
            this.joy.oy = ptr.y - (dy / d) * 60;
          }
        }
      }
      let mx = 0, my = 0;
      if (I.act('left')) mx -= 1;
      if (I.act('right')) mx += 1;
      if (I.act('up')) my -= 1;
      if (I.act('down')) my += 1;
      if (I.stick.x || I.stick.y) {
        mx = I.stick.x;
        my = I.stick.y;
      }
      if (jx || jy) {
        mx = jx;
        my = jy;
      }
      const mag = Math.hypot(mx, my);
      pl.moving = mag > 0.1 && !TT.ui.overlayActive() && !TT.isFading();
      // ha a játékos egy ideig áll, a csapatból valaki beszól (eredeti TT2-szinkron)
      if (pl.moving || TT.ui.overlayActive()) this.idleT = 0;
      else if ((this.idleT = (this.idleT || 0) + dt) > (this.idleWait || 25)) {
        this.idleT = 0;
        this.idleWait = U.rand(35, 60);
        TT.audio.voiceFrom(U.shuffle(TT.save.team.slice()), 'idle', 1);
      }
      if (pl.moving) {
        const run = I.act('run') || mag > 0.95 && (jx || jy);
        const sp = (run ? 230 : 150) * Math.min(1, mag);
        const nx = (mx / Math.max(1, mag)) * sp * dt, ny = (my / Math.max(1, mag)) * sp * dt;
        if (Math.abs(mx) > Math.abs(my)) pl.dir = mx > 0 ? 'right' : 'left';
        else pl.dir = my > 0 ? 'down' : 'up';
        let hitGate = null;
        const bx = this.blocked(pl.x + nx, pl.y);
        if (!bx) pl.x += nx;
        else if (bx !== true) hitGate = bx;
        const by = this.blocked(pl.x, pl.y + ny);
        if (!by) pl.y += ny;
        else if (by !== true) hitGate = by;
        pl.walk += dt * (run ? 15 : 11);
        this.stepT -= dt;
        if (this.stepT <= 0) {
          this.stepT = run ? 0.22 : 0.3;
          TT.audio.sfx('step');
        }
        if (hitGate && this.gateMsgT <= 0) {
          TT.ui.toast(hitGate.text, { color: '#ff8a80' });
          TT.audio.sfx('error');
          this.gateMsgT = 3;
        }
        // ajtóba sétálás
        if (pl.dir === 'up') {
          for (const b of W.buildings) {
            if (!b.door) continue;
            if (Math.abs(pl.x - b.door[0] * TS) < 22 && Math.abs(pl.y - (b.door[1] * TS + 2)) < 12) {
              this.enterBuilding(b);
              pl.y += 6;
              return;
            }
          }
        }
        for (const t of W.toys) {
          if (this.toyActive(t) && U.dist(pl.x, pl.y, t.x * TS, t.y * TS) < 22) this.collectToy(t);
        }
        for (const it of this.eventItems()) {
          if (U.dist(pl.x, pl.y, (it.x + 0.5) * TS, (it.y + 0.5) * TS) < 24) this.collectEventItem(it);
        }
        // rejtett tárgyak automatikus felvétele
        for (const h of W.hidden) {
          if (!s.found[h.id] && U.dist(pl.x, pl.y, h.x * TS, h.y * TS) < 20) {
            this.collect(h);
            break;
          }
        }
      }
      this.gateMsgT -= dt;
      this.updatePatrols(dt);
      this.updateCars(dt);
      this.updateNpcs(dt);
      this.updatePet(dt);
      if (TT.isFading()) return;

      // interakció
      this.prompt = this.nearest();
      const aTap = I.tapIn(L.a.x - L.a.r, L.a.y - L.a.r, L.a.r * 2, L.a.r * 2);
      if (aTap && this.joy && this.joy.id === aTap.id) this.joy = null;
      this.okCooldown = Math.max(0, (this.okCooldown || 0) - dt);
      if ((I.hit('ok') || aTap) && this.prompt && this.okCooldown <= 0) this.interact(this.prompt);

      // zene a negyed szerint
      if (!TT.ui.overlayActive()) TT.audio.music(this.musicKey());

      // kamera
      const tx = U.clamp(pl.x - TT.W / 2, 0, W.MW * TS - TT.W);
      const ty = U.clamp(pl.y - TT.H / 2 - 70, -160, W.MH * TS - TT.H);
      const k = 1 - Math.pow(0.001, dt);
      this.cam.x = U.lerp(this.cam.x, tx, k);
      this.cam.y = U.lerp(this.cam.y, ty, k);
      s.pos = { x: pl.x / TS, y: pl.y / TS };
    },

    // ---------- Rajzolás ----------
    draw(ctx) {
      const TS = W.TS;
      const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
      ctx.fillStyle = '#2f8fd8';
      ctx.fillRect(0, 0, TT.W, TT.H);
      TT.tiles.drawGround(ctx, W, cx, cy, TT.W, TT.H);
      TT.tiles.drawWaterFx(ctx, W, cx, cy, TT.W, TT.H, TT.time);

      const items = [];
      const x0 = Math.max(0, Math.floor(cx / TS) - 2), x1 = Math.min(W.MW - 1, Math.ceil((cx + TT.W) / TS) + 2);
      const y0 = Math.max(0, Math.floor(cy / TS) - 1), y1 = Math.min(W.MH - 1, Math.ceil((cy + TT.H) / TS) + 3);
      const T = W.T;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const v = W.tile(x, y);
        if (v === T.TREE) items.push({ y: (y + 1) * TS - 4, draw: () => ctx.drawImage(TT.tiles.tree(TT.tiles.treeVariant(x, y)), x * TS - cx - 16, y * TS - cy - 52) });
        else if (v === T.ROCK) items.push({ y: (y + 1) * TS - 4, draw: () => ctx.drawImage(TT.tiles.rock(), x * TS - cx - 4, y * TS - cy) });
      }
      for (const b of W.buildings) {
        const spr = TT.buildings.sprite(b);
        const bx = b.x * TS - (spr.side || 0) - cx, by = (b.y + b.h) * TS - spr.height - cy;
        if (bx > TT.W || bx + spr.width < 0 || by > TT.H || by + spr.height < 0) continue;
        items.push({ y: (b.y + b.h) * TS, draw: () => ctx.drawImage(spr, bx, by) });
      }
      for (const p of W.props) {
        const px = p.x * TS - cx, py = p.y * TS - cy;
        if (px < -120 || px > TT.W + 60 || py < -100 || py > TT.H + 100) continue;
        items.push({ y: (p.y + (p.h || 1)) * TS, draw: () => TT.buildings.drawProp(ctx, p, px, py, TT.time) });
      }
      for (const g of W.gates) {
        if (!this.gateLocked(g)) continue;
        const gx = g.x * TS - cx, gy = g.y * TS - cy;
        items.push({ y: (g.y + g.h) * TS, draw: () => TT.buildings.drawGate(ctx, g, gx, gy, g.w * TS, g.h * TS, TT.time) });
      }
      for (const h of W.hidden) {
        if (TT.save.found[h.id]) continue;
        const hx = h.x * TS - cx, hy = h.y * TS - cy;
        if (hx < -40 || hx > TT.W + 40 || hy < -40 || hy > TT.H + 40) continue;
        items.push({ y: h.y * TS, draw: () => this.drawHidden(ctx, h, hx, hy) });
      }
      for (const t of W.toys) {
        if (!this.toyActive(t)) continue;
        const tx = t.x * TS - cx, ty = t.y * TS - cy;
        if (tx < -40 || tx > TT.W + 40 || ty < -40 || ty > TT.H + 40) continue;
        items.push({ y: t.y * TS, draw: () => this.drawToy(ctx, t, tx, ty) });
      }
      for (const it of this.eventItems()) {
        const ex = (it.x + 0.5) * TS - cx, ey = (it.y + 0.5) * TS - cy;
        if (ex < -40 || ex > TT.W + 40 || ey < -40 || ey > TT.H + 40) continue;
        items.push({ y: (it.y + 0.5) * TS, draw: () => this.drawEventItem(ctx, it, ex, ey) });
      }
      if (this.ev && this.ev.id === 'halloween') {
        for (const b of W.buildings) {
          if (!b.door) continue;
          for (const sd of [-1, 1]) {
            const px = (b.door[0] + sd * 1.4) * TS - cx, py = b.door[1] * TS - cy + 4;
            if (px < -30 || px > TT.W + 30 || py < -30 || py > TT.H + 30) continue;
            items.push({ y: b.door[1] * TS + 4, draw: () => this.drawPumpkin(ctx, px, py - 8, 0.9) });
          }
        }
      }
      for (const pt of this.patrols) {
        if (!pt.visible) continue;
        const px = pt.x - cx, py = pt.y - cy;
        if (px < -60 || px > TT.W + 60 || py < -100 || py > TT.H + 60) continue;
        items.push({ y: pt.y, draw: () => this.drawPatrol(ctx, pt, px, py) });
      }
      for (const n of W.npcs) {
        if (!this.npcVisible(n)) continue;
        const nx = n.x * TS - cx, ny = n.y * TS - cy;
        if (nx < -60 || nx > TT.W + 60 || ny < -100 || ny > TT.H + 60) continue;
        items.push({ y: n.y * TS, draw: () => this.drawNpc(ctx, n, nx, ny) });
      }
      for (const car of this.cars) {
        const p = this.carXY(car);
        const x = p.x - cx, y = p.y - cy;
        if (x < -70 || x > TT.W + 70 || y < -70 || y > TT.H + 70) continue;
        items.push({ y: p.y + 10, draw: () => this.drawCar(ctx, car, x, y) });
      }
      const pl = this.pl;
      items.push({ y: pl.y, draw: () => this.drawPlayer(ctx, pl.x - cx, pl.y - cy) });
      if (this.pet) items.push({ y: this.pet.y, draw: () => this.drawPet(ctx, this.pet.x - cx, this.pet.y - cy) });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.draw();

      this.drawNight(ctx, cx, cy);
      const weather = TT.weatherNow();
      if (weather !== 'clear') TT.backdrop.rain(ctx, TT.time, weather === 'storm');
      this.drawSeason(ctx);

      // ajtó feliratok
      for (const b of W.buildings) {
        if (!b.door || !b.name) continue;
        const dx = b.door[0] * TS - cx, dy = b.door[1] * TS - cy;
        if (U.dist(pl.x - cx, pl.y - cy, dx, dy) < 130) {
          const ly = dy - 78;
          D.panel(ctx, dx - D.measure(ctx, b.name, 15) / 2 - 10, ly - 12, D.measure(ctx, b.name, 15) + 20, 24, { fill: '#2b1e5c', r: 8, lw: 2, shadow: false });
          D.text(ctx, b.name, dx, ly, { size: 15, align: 'center', color: '#ffd23f' });
        }
      }
      TT.fx.draw(ctx, 0);
      this.drawPrompt(ctx, cx, cy);
      this.drawHud(ctx);
      TT.fx.draw(ctx, 1);
    },

    drawPlayer(ctx, x, y) {
      const pl = this.pl;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 16, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
      TT.art.drawToy(ctx, TT.FIG.robin, x, y + 2, 0.6, { dir: pl.dir, moving: pl.moving, walk: pl.walk, paint: TT.paintOf('robin'), live: true });
    },

    // A kiskedvenc követi a játékost a városban (Krypto az első bevetett Krypto kellék után,
    // a kis pingvin Lex legyőzése után), ha megvan a TT2-es modellje
    updatePet(dt) {
      const s = TT.save;
      const key = TT.petOf(s);
      if (!key || !TT.art.has3d(PETS[key].id)) {
        this.pet = null;
        return;
      }
      const pl = this.pl;
      if (!this.pet || this.pet.key !== key) {
        this.pet = { key, x: pl.x + 18, y: pl.y - 22, dir: pl.dir, walk: 0, moving: false };
        const fresh = key === 'krypto' ? 'kryptoPetNew' : key === 'penguin' ? 'penguinPetNew' : null;
        if (fresh && s.flags[fresh]) {
          s.flags[fresh] = false;
          TT.ui.toast(`${PETS[key].name} mostantól elkísér a városban!`, { color: '#3fa7ff', dur: 3.4 });
          TT.audio.sfx(PETS[key].sfx);
        }
      }
      const p = this.pet;
      TT.petStep(p, pl, dt);
      // séta közben Krypto néha kiszimatol pár érmét (kb. másfél percnyi gyaloglásonként)
      if (pl.moving) p.sniff = (p.sniff || 0) + dt;
      if (p.sniff > PET_SNIFF) {
        p.sniff = U.rand(-20, 0);
        const coins = U.pick([5, 10, 10, 15, 25]);
        TT.save.coins += coins;
        TT.store.write();
        TT.audio.sfx(PETS[key].sfx);
        setTimeout(() => TT.audio.sfx('coin'), 350);
        const sx = p.x - this.cam.x, sy = p.y - this.cam.y;
        TT.fx.text(sx, sy - 50, `${PETS[key].name} talált +${coins}`, { color: '#ffd23f', tsize: 18, vy: -50, layer: 1 });
        TT.fx.burst(sx, sy - 20, 10, { colors: ['#ffd23f', '#fff6d8'], shape: 'star', speed: 140, size: 5, life: 0.6, layer: 1 });
      }
    },

    choosePet() {
      const s = TT.save;
      const cur = TT.petOf(s) || 'none';
      TT.ui.choose({
        title: 'Kiskedvenc',
        text: 'Ki kísérjen a városban?',
        options: Object.keys(PETS).filter((k) => PETS[k].unlocked(s)).map((k) => ({ label: PETS[k].name + (cur === k ? ' (most)' : ''), value: k, color: '#3fa7ff' }))
          .concat([{ label: 'Senki' + (cur === 'none' ? ' (most)' : ''), value: 'none', color: '#6c5ce7' }, { label: 'Mégse', value: null }]),
      }, (v) => {
        if (!v) return;
        s.pet = v;
        TT.store.write();
        if (v !== 'none') TT.audio.sfx(PETS[v].sfx);
      });
    },

    drawPet(ctx, x, y) {
      TT.drawPet(ctx, this.pet, x, y);
    },

    toggleMap() {
      this.showMap = !this.showMap;
      if (this.showMap) this.mapReach = this.reachable();
    },

    // gyalog elérhető mezők (zárt kapuk és NPC-k akadályként), a gyors utazáshoz
    reachable() {
      const TS = W.TS;
      const seen = new Uint8Array(W.MW * W.MH);
      const sx = Math.floor(this.pl.x / TS), sy = Math.floor(this.pl.y / TS);
      const q = [sy * W.MW + sx];
      seen[q[0]] = 1;
      for (let qi = 0; qi < q.length; qi++) {
        const x = q[qi] % W.MW, y = Math.floor(q[qi] / W.MW);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W.MW || ny >= W.MH) continue;
          const k = ny * W.MW + nx;
          if (seen[k] || this.blocked((nx + 0.5) * TS, (ny + 0.5) * TS)) continue;
          seen[k] = 1;
          q.push(k);
        }
      }
      return seen;
    },

    canTravel(b) {
      if (!this.mapReach || !b.door) return false;
      const x = Math.floor(b.door[0]), y = Math.floor(b.door[1] + 1.15);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (this.mapReach[(y + j) * W.MW + x + i]) return true;
      return false;
    },

    fastTravel(b) {
      this.showMap = false;
      TT.audio.sfx('teleport');
      TT.go('world', { pos: { x: b.door[0], y: b.door[1] + 1.15 }, dir: 'down' });
    },

    // NPC-k: körülnéznek, a közeli játékos felé fordulnak, néha gondolatbuborékot mutatnak
    updateNpcs(dt) {
      const TS = W.TS, pl = this.pl;
      const night = this.darkness() > 0.6;
      for (const n of W.npcs) {
        const st = this.npcState[n.id];
        if (st.t == null) st.t = U.rand(1, 6);
        st.t -= dt;
        const dx = pl.x - n.x * TS, dy = pl.y - n.y * TS;
        if (Math.hypot(dx, dy) < 110) {
          st.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        } else if (st.t <= 0) {
          st.t = U.rand(3, 7);
          st.face = n.dir || U.pick(['left', 'right', 'down', 'down']);
          // ne legyen buborék, ha közvetlenül fölötte áll egy másik NPC (a buborék az ő arcára kerülne)
          const crowded = W.npcs.some((o) => o !== n && this.npcVisible(o) && Math.abs(o.x - n.x) < 1.2 && n.y - o.y > 0 && n.y - o.y < 3);
          if (!crowded && !(n.trainer && !TT.save.beaten[n.trainer]) && Math.random() < 0.4) {
            st.emote = { e: night && Math.random() < 0.5 ? 'zzZ' : U.pick(['♪', '…', '?', '♥', '♪']), t: 0 };
          }
        }
        if (st.emote && (st.emote.t += dt) > 2.4) st.emote = null;
      }
    },

    drawNpc(ctx, n, x, y) {
      const st = this.npcState[n.id];
      const look = TT.FIG[n.who] || TT.NPC_LOOKS[n.who];
      const fig = TT.FIG[n.who] ? TT.FIG[n.who] : { id: n.who, look: look.look };
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 15, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
      TT.art.drawToy(ctx, fig, x, y + 2, 0.58, { dir: st.face, t: TT.time + n.x });
      // jelzés a fej felett
      if (n.trainer && !TT.save.beaten[n.trainer]) {
        const b = Math.sin(TT.time * 5 + n.x) * 3;
        D.panel(ctx, x - 11, y - 96 + b, 22, 26, { fill: '#ff4f4f', r: 8, lw: 2.5, shadow: false });
        D.text(ctx, '!', x, y - 82 + b, { size: 20, align: 'center' });
      } else if (st.emote) {
        const t = st.emote.t;
        const a = Math.min(1, t / 0.2, (2.4 - t) / 0.3);
        const bw = Math.max(26, D.measure(ctx, st.emote.e, 16) + 14);
        const by = y + 2 - TT.art.heightOf(fig, 0.58) - 30 - t * 3;
        ctx.save();
        ctx.globalAlpha = U.clamp(a, 0, 1);
        D.panel(ctx, x - bw / 2 + 8, by, bw, 24, { fill: '#ffffff', r: 10, lw: 2, shadow: false });
        D.text(ctx, st.emote.e, x + 8, by + 13, { size: 16, align: 'center', color: '#2b1e5c', stroke: false });
        ctx.restore();
      }
    },

    drawToy(ctx, t, x, y) {
      const b = Math.sin(TT.time * 4 + t.x) * 3;
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(TT.time * 5) * 0.15;
      ctx.beginPath();
      ctx.arc(x, y - 8, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#ff9ecd';
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.translate(x, y - 10 + b);
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-13, -1, -7, -12, 0, -4);
      ctx.bezierCurveTo(7, -12, 13, -1, 0, 8);
      ctx.fillStyle = '#ff4fa3';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      ctx.restore();
    },

    drawPatrol(ctx, pt, x, y) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 15, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
      TT.art.drawToy(ctx, TT.FIG.mintguard, x, y + 2, 0.6, { facing: pt.face, moving: true, walk: pt.walk });
      if (pt.chase) {
        const b = Math.sin(TT.time * 12) * 2;
        D.panel(ctx, x - 11, y - 92 + b, 22, 26, { fill: '#ff4f4f', r: 8, lw: 2.5, shadow: false });
        D.text(ctx, '!', x, y - 78 + b, { size: 20, align: 'center' });
      }
    },

    drawHidden(ctx, h, x, y) {
      const t = TT.time;
      const b = Math.sin(t * 3 + h.x) * 3;
      ctx.save();
      if (h.fig) {
        ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.3;
        D.star(ctx, x, y - 10 + b, 13, 5, 4, t);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.globalAlpha = 1;
        D.star(ctx, x + 10, y - 22 + b, 5, 2, 4, -t * 2);
        ctx.fillStyle = '#ffd23f';
        ctx.fill();
        D.star(ctx, x - 9, y - 2 + b, 4, 1.6, 4, t * 3);
        ctx.fill();
      } else {
        D.coin(ctx, x, y - 8 + b, 9 * Math.abs(Math.cos(t * 2.5)) + 1);
      }
      ctx.restore();
    },

    drawPrompt(ctx, cx, cy) {
      const p = this.prompt;
      if (!p || TT.ui.overlayActive()) return;
      let x = p.x - cx, y = p.y - cy - 80;
      let label = 'Beszélj';
      if (p.kind === 'door') {
        label = 'Belépés';
        y = p.y - cy - 46;
      } else if (p.kind === 'hidden') {
        label = 'Felvesz';
        y = p.y - cy - 40;
      } else if (p.n.trainer) label = TT.save.beaten[p.n.trainer] ? 'Visszavágó' : 'Harc!';
      const touch = TT.input.isTouch();
      const w = D.measure(ctx, label, 16) + (touch ? 22 : 46);
      const b = Math.sin(TT.time * 6) * 2;
      D.panel(ctx, x - w / 2, y - 16 + b, w, 30, { fill: '#fdf6e3', r: 10, lw: 2.5, shadow: false });
      if (!touch) D.keycap(ctx, 'E', x - w / 2 + 18, y - 1 + b, { size: 12, color: '#ffd23f' });
      D.text(ctx, label, touch ? x : x + 12, y + b, { size: 16, align: 'center', color: '#1b1140', stroke: false });
    },

    drawHud(ctx) {
      const s = TT.save;
      // érme
      D.panel(ctx, 12, 12, 150, 40, { fill: '#2b1e5c', r: 12, lw: 2.5 });
      D.coin(ctx, 34, 32, 12);
      D.text(ctx, U.fmt(s.coins), 54, 33, { size: 22, color: '#ffd23f' });
      // napi küldetések
      const qs = TT.questSummary();
      if (qs) {
        const all = qs.done >= qs.total;
        const Lq = this.touchLayout().quest;
        D.panel(ctx, Lq.x, Lq.y, Lq.w, Lq.h, { fill: all ? '#2f6a3a' : '#2b1e5c', r: 10, lw: 2.5 });
        D.star(ctx, Lq.x + 18, Lq.y + 16, 10, 4.5, 5);
        ctx.fillStyle = all ? '#ffd23f' : '#9be7ff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#120a2c';
        ctx.stroke();
        D.text(ctx, `Napi ${qs.done}/${qs.total}`, Lq.x + 34, Lq.y + 17, { size: 16, color: all ? '#7bff6b' : '#ffffff', lw: 3 });
        if (!TT.input.isTouch()) D.keycap(ctx, 'Q', Lq.x + Lq.w - 16, Lq.y + 16, { size: 10 });
      }
      // cél
      const obj = TT.objective();
      ctx.save();
      const lines = D.wrap(ctx, obj, 520, 16);
      const ow = Math.min(560, Math.max(...lines.map((l) => D.measure(ctx, l, 16))) + 30);
      D.panel(ctx, TT.W / 2 - ow / 2, 12, ow, 16 + lines.length * 20, { fill: 'rgba(43,30,92,0.88)', grad: false, r: 12, lw: 2.5 });
      lines.forEach((l, i) => D.text(ctx, l, TT.W / 2, 31 + i * 20, { size: 16, align: 'center', color: '#fff8e0', lw: 3 }));
      ctx.restore();
      // gombok
      const L = this.touchLayout();
      D.button(ctx, L.menu.x, L.menu.y, L.menu.w, L.menu.h, '', { color: '#6c5ce7', r: 10 });
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(L.menu.x + 15, L.menu.y + 13 + i * 8, 24, 4);
      }
      if (TT.wheelReady && TT.wheelReady() && s.flags.tutorial) {
        // a Menüben ma még pörgethető a szerencsekerék
        const bx = L.menu.x + L.menu.w - 2, by = L.menu.y + 2 + Math.sin(TT.time * 5) * 2;
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4f4f';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#120a2c';
        ctx.stroke();
        D.text(ctx, '!', bx, by + 1, { size: 15, align: 'center', color: '#ffffff', lw: 3 });
      }
      D.button(ctx, L.map.x, L.map.y, L.map.w, L.map.h, '', { color: '#3fa7ff', r: 10 });
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(L.map.x + 12, L.map.y + 14);
      ctx.lineTo(L.map.x + 22, L.map.y + 10);
      ctx.lineTo(L.map.x + 32, L.map.y + 14);
      ctx.lineTo(L.map.x + 42, L.map.y + 10);
      ctx.lineTo(L.map.x + 42, L.map.y + 32);
      ctx.lineTo(L.map.x + 32, L.map.y + 36);
      ctx.lineTo(L.map.x + 22, L.map.y + 32);
      ctx.lineTo(L.map.x + 12, L.map.y + 36);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      if (!TT.input.isTouch()) {
        D.keycap(ctx, 'Esc', L.menu.x + L.menu.w / 2, L.menu.y + L.menu.h + 12, { size: 10 });
        D.keycap(ctx, 'M', L.map.x + L.map.w / 2, L.map.y + L.map.h + 12, { size: 10 });
      }
      // csapat kis ikonjai
      s.team.forEach((id, i) => {
        const x = 12 + i * 50, y = TT.H - 62;
        D.panel(ctx, x, y, 46, 50, { fill: '#2b1e5c', r: 10, lw: 2, shadow: false });
        ctx.drawImage(TT.art.figureCanvas(id, 96, { pedestal: false }), x - 3, y - 4, 52, 52);
        D.text(ctx, String(s.owned[id] ? s.owned[id].lvl : 1), x + 40, y + 42, { size: 13, align: 'right', color: '#ffd23f', lw: 3 });
      });
      // érintéses vezérlők
      if (TT.input.isTouch()) {
        const a = L.a;
        ctx.save();
        ctx.globalAlpha = this.prompt ? 0.95 : 0.5;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6b35';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1d1433';
        ctx.stroke();
        ctx.restore();
        D.text(ctx, 'A', a.x, a.y + 2, { size: 36, align: 'center' });
        if (this.joy) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(this.joy.ox, this.joy.oy, 60, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(this.joy.x, this.joy.y, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (this.t < 6) {
          D.text(ctx, 'Húzd az ujjad a bal oldalon a mozgáshoz', 240, TT.H - 90, { size: 15, align: 'center', color: '#fff', alpha: 0.8 });
        }
      } else if (this.t < 8 && TT.save.playTime < 120) {
        D.text(ctx, 'Mozgás: WASD / nyilak · Futás: Shift · Beszéd: E', TT.W / 2, TT.H - 24, { size: 16, align: 'center', alpha: 0.9 });
      }
      if (this.showMap) this.drawMap(ctx);
    },

    drawMap(ctx) {
      const TS = W.TS;
      const sc = 5.7;
      const mw = W.MW * sc, mh = W.MH * sc;
      const x = TT.W / 2 - mw / 2, y = 64;
      D.panel(ctx, x - 10, y - 10, mw + 20, mh + 20, { fill: '#2b1e5c', r: 14, lw: 3 });
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(minimap, x, y, mw, mh);
      ctx.restore();
      const k = mw / (W.MW * TS);
      const placed = [];
      this.mapLabels = [];
      for (const b of W.buildings) {
        if (!b.name) continue;
        const bx = x + b.door[0] * TS * k, by = y + b.door[1] * TS * k;
        const lw = D.measure(ctx, b.name, 12) + 6;
        const hit = (ly) => placed.some((r) => Math.abs(r.x - bx) < (r.w + lw) / 2 && Math.abs(r.y - ly) < 14);
        const ly = !hit(by - 14) ? by - 14 : by + 10;
        placed.push({ x: bx, y: ly, w: lw });
        const ok = this.canTravel(b);
        this.mapLabels.push({ b, ok, x: bx - lw / 2, y: ly - 9, w: lw, h: 18 });
        if (ok) D.panel(ctx, bx - lw / 2, ly - 9, lw, 18, { fill: 'rgba(63,111,216,0.85)', r: 6, lw: 1.5, shadow: false });
        D.text(ctx, b.name, bx, ly, { size: 12, align: 'center', color: ok ? '#fff' : '#b8b0d0', lw: 3 });
      }
      for (const n of W.npcs) {
        if (!n.trainer || TT.save.beaten[n.trainer] || !this.npcVisible(n)) continue;
        ctx.beginPath();
        ctx.arc(x + n.x * TS * k, y + n.y * TS * k, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4f4f';
        ctx.fill();
      }
      for (const it of this.eventItems()) {
        ctx.beginPath();
        ctx.arc(x + (it.x + 0.5) * TS * k, y + (it.y + 0.5) * TS * k, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = this.ev.color;
        ctx.fill();
      }
      for (const t of W.toys) {
        if (!this.toyActive(t)) continue;
        ctx.beginPath();
        ctx.arc(x + t.x * TS * k, y + t.y * TS * k, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff9ecd';
        ctx.fill();
      }
      const px = x + this.pl.x * k, py = y + this.pl.y * k;
      ctx.beginPath();
      ctx.arc(px, py, 6 + Math.sin(TT.time * 6) * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      D.text(ctx, 'Piros: edző · Rózsaszín: Silkie játéka · Sárga: te · Kék névre koppintva: gyors utazás · M: bezár', TT.W / 2, y + mh + 2, { size: 13, align: 'center', color: '#c8b8f0', lw: 3 });
    },
  };

  // Beállítások ablak (bárhonnan hívható)
  TT.openSettings = function () {
    const st = TT.settings;
    const pct = (v) => Math.round(v * 100) + '%';
    const cycle = (v) => {
      const steps = [0, 0.25, 0.5, 0.75, 1];
      const i = steps.findIndex((s) => Math.abs(s - v) < 0.01);
      return steps[(i + 1) % steps.length];
    };
    const has3d = !!(TT.model3d && Object.keys(TT.model3d.models).length);
    TT.ui.choose({
      title: 'Beállítások',
      buttonH: 40, width: 680, columns: 2, size: 17,
      options: [
        { label: 'Zene: ' + pct(st.music), value: 'music' },
        { label: 'Hangeffektek: ' + pct(st.sfx), value: 'sfx' },
        { label: 'Szinkron (beszéd): ' + pct(st.voice != null ? st.voice : st.sfx), value: 'voice' },
        { label: 'Képernyőrázás: ' + (st.shake ? 'Be' : 'Ki'), value: 'shake' },
        { label: 'Nehézség: ' + ({ easy: 'Könnyű', normal: 'Normál', hard: 'Nehéz' }[st.difficulty || 'normal']), value: 'diff' },
        { label: 'Napszak: ' + (st.dayNight === 'day' ? 'mindig nappal' : 'valós idő'), value: 'daynight' },
        { label: 'Időjárás: ' + (st.weather === 'off' ? 'mindig derült' : 'változó (eső, vihar)'), value: 'weather' },
        ...(has3d ? [{ label: '3D figurák: ' + (st.fig3d === false ? 'Ki (képek)' : 'Be'), value: 'fig3d' }] : []),
        { label: 'Takarékos mód (gyenge gépre): ' + (st.lite ? 'Be' : 'Ki'), value: 'lite' },
        { label: 'Teljes képernyő', value: 'fs' },
        { label: 'Mentés exportálása', value: 'export' },
        { label: 'Kész', value: null, color: '#6c5ce7' },
      ],
    }, (v) => {
      if (!v) return;
      if (v === 'music') st.music = cycle(st.music);
      if (v === 'sfx') st.sfx = cycle(st.sfx);
      if (v === 'voice') st.voice = cycle(st.voice != null ? st.voice : st.sfx);
      if (v === 'shake') st.shake = !st.shake;
      if (v === 'fig3d') {
        st.fig3d = st.fig3d === false;
        TT.art.clearCache();
      }
      if (v === 'lite') {
        st.lite = !st.lite;
        TT.resize();
      }
      if (v === 'daynight') st.dayNight = st.dayNight === 'day' ? 'real' : 'day';
      if (v === 'weather') st.weather = st.weather === 'off' ? 'auto' : 'off';
      if (v === 'diff') st.difficulty = { easy: 'normal', normal: 'hard', hard: 'easy' }[st.difficulty || 'normal'];
      if (v === 'fs') {
        try {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
        } catch (e) { /* nem támogatott */ }
      }
      if (v === 'export') {
        const code = TT.store.exportString();
        const manual = () => window.prompt('Mentéskód (másold ki):', code);
        try {
          navigator.clipboard.writeText(code).then(() => TT.ui.toast('Mentéskód a vágólapra másolva!'), manual);
        } catch (e) {
          manual();
        }
      }
      TT.store.writeSettings();
      TT.audio.sfx('select');
      if (v !== 'export' && v !== 'fs') TT.openSettings();
    });
  };

  TT.register('world', scene);
})(window.TT);
