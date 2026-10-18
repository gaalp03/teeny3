'use strict';
// Menta Gyár: háromszintes "kazamata" futószalagokkal, gombokkal, ajtókkal, robotokkal és ládákkal.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const TS = 32, OY = 60;
  const EXIT = { x: 416, y: 12, w: 88, h: 36 };

  // # fal · . padló · > < ^ v futószalag · B gomb · D ajtó · C láda · E lépcső · S kezdés
  // H vízszintes robot · V függőleges robot · X gyárvezető
  const FLOORS = [
    {
      name: '1. szint – Csomagoló', lines: [
        '##############################',
        '#S.....#.........#...........#',
        '#......#..>>>>>>.#...H.......#',
        '#..##..#..^....v.#...........#',
        '#..##.....^....v.....####....#',
        '#.........^<<<<v.....#..#....#',
        '#####..#.......v.....#C.#....#',
        '#......#..H....v.....#..#....#',
        '#......#.......>>>>>>D..#....#',
        '#..B...#.............####....#',
        '#......######..###...........#',
        '#.............................#',
        '#....H...........V......##..E#',
        '#.......................##...#',
        '##############################',
      ],
    },
    {
      name: '2. szint – Fóliázó', lines: [
        '##############################',
        '#E..#.......V......#.........#',
        '#...#..............#....C....#',
        '#...D..............#.........#',
        '#####....>>>>>>>v..####D######',
        '#........^......v............#',
        '#..H.....^......v.......H....#',
        '#........^<<<<<<<............#',
        '#............................#',
        '####.#######.....#######.#####',
        '#..........#.....#...........#',
        '#..B.......#..V..#........B..#',
        '#..........#.....#...........#',
        '#S.........v<<<<<<...........#',
        '##############################',
      ],
    },
    {
      name: '3. szint – Gyárvezetés', lines: [
        '##############################',
        '#............................#',
        '#.........#######............#',
        '#.........#..C..#............#',
        '#.........#.....#............#',
        '#.........###D###............#',
        '#..H.........X.............H.#',
        '#.....>>>>>>>>>>>>>>>>v......#',
        '#.....^...............v......#',
        '#.....^..V.........V..v......#',
        '#.....^<<<<<<<<<<<<<<<<......#',
        '#............................#',
        '#..B......................B..#',
        '#S...........................#',
        '##############################',
      ],
    },
  ];
  const CONV = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], 'v': [0, 1] };

  const scene = {
    enter(p) {
      this.p = p;
      this.t = 0;
      const s = TT.save;
      // a gyár naponta újraindul (a robotok és ládák visszatérnek)
      const d = new Date();
      const today = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      const old = s.factory || {};
      if (old.date !== today) s.factory = { floor: 0, chests: {}, buttons: {}, beaten: {}, done: !!old.done, clears: old.clears || 0, date: today };
      this.st = s.factory;
      this.joy = null;
      this.load(p.floor != null ? p.floor : this.st.floor, p.pos);
      TT.audio.music('vault');
      if (!s.flags.factoryIntro) {
        s.flags.factoryIntro = true;
        setTimeout(() => TT.ui.say([
          { who: 'cyborg', text: 'A Menta Gyár! Itt csomagolják be Mr. Mint figuráit. Kerüld a robotokat, vagy verd szét őket!' },
          { who: 'cyborg', text: 'A futószalagok visznek magukkal. A gombok ajtókat nyitnak. A ládákban zsákmány van. BOOYAH!' },
        ]), 400);
      }
    },

    load(fi, pos) {
      this.fi = fi;
      const F = FLOORS[fi];
      this.grid = F.lines.map((l) => l.padEnd(30, '#').slice(0, 30).split(''));
      this.robots = [];
      for (let y = 0; y < 15; y++) for (let x = 0; x < 30; x++) {
        const c = this.grid[y][x];
        if (c === 'S') {
          this.start = { x: (x + 0.5) * TS, y: (y + 0.5) * TS };
          this.grid[y][x] = '.';
        } else if (c === 'H' || c === 'V' || c === 'X') {
          const key = fi + ':' + x + ':' + y;
          this.grid[y][x] = '.';
          if (this.st.beaten[key]) continue;
          this.robots.push({ key, x: (x + 0.5) * TS, y: (y + 0.5) * TS, ox: x, oy: y, dir: 1, axis: c === 'V' ? 'y' : 'x', boss: c === 'X', walk: 0 });
        }
      }
      const sp = pos || this.start;
      this.pl = { x: sp.x, y: sp.y, dir: 'down', walk: 0, moving: false };
      this.grace = 1.2;
    },

    btnKey(x, y) {
      return this.fi + ':' + x + ':' + y;
    },
    doorsOpen() {
      // egy szinten minden gombot meg kell nyomni az ajtókhoz
      const btns = [];
      for (let y = 0; y < 15; y++) for (let x = 0; x < 30; x++) if (this.grid[y][x] === 'B') btns.push(this.btnKey(x, y));
      return btns.every((k) => this.st.buttons[k]);
    },
    solidAt(px, py) {
      const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
      const c = this.grid[ty] && this.grid[ty][tx];
      if (c === undefined || c === '#') return true;
      if (c === 'D' && !this.doorsOpen()) return true;
      if (c === 'C' && !this.st.chests[this.btnKey(tx, ty)]) return true;
      return false;
    },
    blocked(px, py) {
      const hw = 9, hh = 6;
      return this.solidAt(px - hw, py - hh) || this.solidAt(px + hw, py - hh) || this.solidAt(px - hw, py + hh) || this.solidAt(px + hw, py + hh);
    },
    tileAt(px, py) {
      const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
      return { tx, ty, c: this.grid[ty] && this.grid[ty][tx] };
    },

    leave() {
      TT.store.write();
      TT.go('world', { pos: this.p.back, dir: 'down' });
    },

    openChest(tx, ty) {
      const s = TT.save;
      const key = this.btnKey(tx, ty);
      if (this.st.chests[key]) return;
      this.st.chests[key] = true;
      if (this.fi < 2) {
        const coins = this.fi === 0 ? 200 : 350;
        s.coins += coins;
        const item = U.pick(['pizza', 'energy', 'cleanse']);
        s.items = s.items || {};
        s.items[item] = Math.min(TT.ITEM_MAX, (s.items[item] || 0) + 2);
        TT.store.write();
        TT.audio.sfx('found');
        TT.ui.toast(`Láda: +${coins} érme és 2× ${TT.ITEMS[item].name}!`, { dur: 3.5 });
      } else {
        const first = !this.st.done;
        s.coins += first ? 800 : 400;
        this.st.done = true;
        this.st.clears = (this.st.clears || 0) + 1;
        const id = TT.rollBox(TT.BOXES[first ? 2 : 1]);
        const info = TT.grantFigure(id);
        TT.store.write();
        TT.audio.sfx('legend');
        TT.ui.toast(first ? 'A Gyár kincse: +800 érme és egy legendás doboz!' : 'A Gyár kincse: +400 érme és egy prémium doboz! (Holnap újra nyitva.)', { dur: 4 });
        TT.ui.reveal(id, info, () => {
          TT.checkAch();
          TT.ui.say([{ who: 'cyborg', text: 'Kiürítettük a Menta Gyárat! A gépek leálltak… legalábbis holnapig.' }]);
        });
      }
    },

    robotBattle(r) {
      const s = TT.save;
      const lvl = U.clamp(Math.round((s.team.reduce((a, id) => a + (s.owned[id] ? s.owned[id].lvl : 1), 0) / 3)) + this.fi, 3, TT.MAX_LVL);
      const team = r.boss
        ? [{ id: 'boxbot', lvl: lvl + 1 }, { id: 'shrinkwrap', lvl: lvl + 1 }, { id: 'mintguard', lvl: lvl + 2 }]
        : [{ id: 'mintguard', lvl }, { id: U.pick(['boxbot', 'mintguard', 'gizmo']), lvl }, { id: U.pick(['boxbot', 'seemore', 'drlight']), lvl }];
      const back = { x: this.pl.x, y: this.pl.y };
      const fi = this.fi;
      TT.audio.sfx('error');
      TT.go('battle', {
        enemy: {
          name: r.boss ? 'Gyárvezető' : 'Gyári robot', who: 'mintguard', team, bg: 'vault',
          ai: Math.min(0.75, 0.35 + lvl * 0.02 + (r.boss ? 0.1 : 0)), coins: (r.boss ? 400 : 90) + lvl * 8,
          music: r.boss ? 'boss' : 'battle',
          intro: [{ who: 'mintguard', text: r.boss ? 'GYÁRVEZETŐ PROTOKOLL. A LÁDA BONTATLAN MARAD.' : 'BEEP. Gyárlátogatás nem engedélyezett!' }],
        },
        after: (won) => {
          if (won) this.st.beaten[r.key] = true;
          TT.store.write();
          TT.go('factory', { back: this.p.back, floor: fi, pos: won ? back : null });
        },
      });
    },

    update(dt) {
      this.t += dt;
      const I = TT.input;
      const pl = this.pl;
      if (I.hit('back') || I.tapIn(EXIT.x, EXIT.y, EXIT.w, EXIT.h)) {
        TT.ui.confirm('Elhagyod a Menta Gyárat? (A haladásod megmarad.)', (ok) => ok && this.leave(), 'Kilépés', 'Maradok');
        return;
      }
      if (TT.ui.overlayActive() || TT.isFading()) return;
      this.grace -= dt;
      // mozgás
      let mx = 0, my = 0;
      if (I.act('left')) mx -= 1;
      if (I.act('right')) mx += 1;
      if (I.act('up')) my -= 1;
      if (I.act('down')) my += 1;
      if (I.stick.x || I.stick.y) {
        mx = I.stick.x;
        my = I.stick.y;
      }
      for (const tp of I.taps) if (!this.joy && tp.y > OY) this.joy = { id: tp.id, ox: tp.x, oy: tp.y };
      if (this.joy) {
        const ptr = I.pointers.get(this.joy.id);
        if (!ptr) this.joy = null;
        else {
          const dx = ptr.x - this.joy.ox, dy = ptr.y - this.joy.oy, d = Math.hypot(dx, dy);
          if (d > 8) {
            mx = dx / Math.max(d, 50);
            my = dy / Math.max(d, 50);
          }
          this.joy.x = ptr.x;
          this.joy.y = ptr.y;
        }
      }
      const mag = Math.hypot(mx, my);
      pl.moving = mag > 0.1;
      let vx = 0, vy = 0;
      if (pl.moving) {
        const sp = (I.act('run') ? 210 : 150) * Math.min(1, mag);
        vx = (mx / Math.max(1, mag)) * sp;
        vy = (my / Math.max(1, mag)) * sp;
        if (Math.abs(mx) > Math.abs(my)) pl.dir = mx > 0 ? 'right' : 'left';
        else pl.dir = my > 0 ? 'down' : 'up';
        pl.walk += dt * 11;
      }
      // futószalag
      const here = this.tileAt(pl.x, pl.y);
      const cv = CONV[here.c];
      if (cv) {
        vx += cv[0] * 120;
        vy += cv[1] * 120;
      }
      if (!this.blocked(pl.x + vx * dt, pl.y)) pl.x += vx * dt;
      if (!this.blocked(pl.x, pl.y + vy * dt)) pl.y += vy * dt;
      // gombok, ládák, lépcső
      const t2 = this.tileAt(pl.x, pl.y);
      if (t2.c === 'B') {
        const k = this.btnKey(t2.tx, t2.ty);
        if (!this.st.buttons[k]) {
          this.st.buttons[k] = true;
          TT.audio.sfx('door');
          TT.ui.toast(this.doorsOpen() ? 'Kattanás! Az ajtók kinyíltak!' : 'Kattanás! Még van gomb ezen a szinten.', { color: '#7fe0b5' });
          TT.store.write();
        }
      }
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const tx = Math.floor(pl.x / TS) + dx, ty = Math.floor(pl.y / TS) + dy;
        if (this.grid[ty] && this.grid[ty][tx] === 'C' && !this.st.chests[this.btnKey(tx, ty)] && U.dist(pl.x, pl.y, (tx + 0.5) * TS, (ty + 0.5) * TS) < 40) {
          this.openChest(tx, ty);
        }
      }
      if (t2.c === 'E') {
        if (this.fi < FLOORS.length - 1) {
          this.st.floor = this.fi + 1;
          TT.store.write();
          TT.audio.sfx('door');
          TT.go('factory', { back: this.p.back, floor: this.fi + 1 });
          return;
        }
      }
      // robotok
      for (const r of this.robots) {
        if (this.st.beaten[r.key]) continue;
        const d = U.dist(r.x, r.y, pl.x, pl.y);
        r.chase = !r.boss && d < 110 && this.grace <= 0;
        let rx = 0, ry = 0;
        if (r.boss) {
          // a gyárvezető a láda előtt őrködik
          rx = Math.sin(this.t * 1.2) * 0.6;
        } else if (r.chase) {
          rx = (pl.x - r.x) / d;
          ry = (pl.y - r.y) / d;
        } else if (r.axis === 'x') rx = r.dir;
        else ry = r.dir;
        const sp = r.chase ? 95 : 60;
        const nx = r.x + rx * sp * dt, ny = r.y + ry * sp * dt;
        if (!this.blocked(nx, r.y)) r.x = nx;
        else if (!r.chase) r.dir *= -1;
        if (!this.blocked(r.x, ny)) r.y = ny;
        else if (!r.chase) r.dir *= -1;
        if (Math.abs(rx) > 0.05) r.face = rx > 0 ? 1 : -1;
        r.walk += dt * 9;
        if (d < (r.boss ? 40 : 26) && this.grace <= 0) {
          this.robotBattle(r);
          return;
        }
      }
    },

    drawTile(ctx, c, x, y) {
      const px = x * TS, py = OY + y * TS;
      if (c === '#') {
        ctx.fillStyle = '#2a3a3a';
        ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = '#3a5050';
        ctx.fillRect(px + 2, py + 2, TS - 4, 10);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(px + 0.5, py + 0.5, TS - 1, TS - 1);
        return;
      }
      ctx.fillStyle = (x + y) % 2 ? '#c9e8dc' : '#bfe0d2';
      ctx.fillRect(px, py, TS, TS);
      const cv = CONV[c];
      if (cv) {
        ctx.fillStyle = '#4a4e56';
        ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
        ctx.save();
        ctx.beginPath();
        ctx.rect(px + 2, py + 2, TS - 4, TS - 4);
        ctx.clip();
        ctx.translate(px + TS / 2, py + TS / 2);
        ctx.rotate(Math.atan2(cv[1], cv[0]));
        const off = (this.t * 40) % 12;
        ctx.strokeStyle = '#ffd23f';
        ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i++) {
          const ax = i * 12 + off - 6;
          ctx.beginPath();
          ctx.moveTo(ax - 4, -7);
          ctx.lineTo(ax + 3, 0);
          ctx.lineTo(ax - 4, 7);
          ctx.stroke();
        }
        ctx.restore();
      } else if (c === 'B') {
        const on = this.st.buttons[this.btnKey(x, y)];
        ctx.beginPath();
        ctx.ellipse(px + TS / 2, py + TS / 2 + 2, 11, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = on ? '#2ecc71' : '#e84545';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1d1433';
        ctx.stroke();
      } else if (c === 'D') {
        if (!this.doorsOpen()) {
          ctx.fillStyle = '#7fe0b5';
          ctx.fillRect(px + 2, py, TS - 4, TS);
          ctx.strokeStyle = '#1d1433';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 2, py, TS - 4, TS);
          ctx.fillStyle = '#2a9d8f';
          for (let i = 0; i < 3; i++) ctx.fillRect(px + 6 + i * 8, py + 4, 3, TS - 8);
        } else {
          ctx.fillStyle = 'rgba(42,157,143,0.35)';
          ctx.fillRect(px, py, TS, TS);
        }
      } else if (c === 'E') {
        ctx.fillStyle = '#3a2a5a';
        ctx.fillRect(px + 3, py + 3, TS - 6, TS - 6);
        ctx.fillStyle = '#ffd23f';
        for (let i = 0; i < 3; i++) ctx.fillRect(px + 6, py + 7 + i * 7, TS - 12 - i * 5, 3);
      } else if (c === 'C') {
        const open = this.st.chests[this.btnKey(x, y)];
        TT.D.rr(ctx, px + 3, py + 8, TS - 6, TS - 12, 4);
        ctx.fillStyle = open ? '#8b6b45' : '#c8a165';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1d1433';
        ctx.stroke();
        if (!open) {
          ctx.fillStyle = '#ffd23f';
          ctx.fillRect(px + TS / 2 - 3, py + 12, 6, 7);
          if (Math.sin(this.t * 5 + x) > 0.6) {
            D.star(ctx, px + TS - 6, py + 6, 5, 2, 4);
            ctx.fill();
          }
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = '#16262a';
      ctx.fillRect(0, 0, TT.W, TT.H);
      for (let y = 0; y < 15; y++) for (let x = 0; x < 30; x++) this.drawTile(ctx, this.grid[y][x], x, y);
      const items = [];
      for (const r of this.robots) {
        if (this.st.beaten[r.key]) continue;
        items.push({
          y: r.y, draw: () => {
            TT.art.drawFigure(ctx, TT.FIG[r.boss ? 'boxbot' : 'mintguard'], r.x, OY + r.y + 10, r.boss ? 0.75 : 0.5, { pedestal: false, pose: 'walk', walk: r.walk, facing: r.face || 1, noCustom: true, paint: r.boss ? 'gold' : null });
            if (r.chase || r.boss) D.text(ctx, r.boss ? '★' : '!', r.x, OY + r.y - (r.boss ? 76 : 52), { size: 20, align: 'center', color: r.boss ? '#ffd23f' : '#ff4f4f' });
          },
        });
      }
      const pl = this.pl;
      items.push({
        y: pl.y, draw: () => TT.art.drawFigure(ctx, TT.FIG.robin, pl.x, OY + pl.y + 10, 0.5, {
          pedestal: false, pose: pl.moving ? 'walk' : 'idle', walk: pl.walk, facing: pl.dir === 'left' ? -1 : 1, back: pl.dir === 'up', noCustom: true, paint: TT.paintOf('robin'),
        }),
      });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.draw();
      // HUD
      ctx.fillStyle = '#0d1a1c';
      ctx.fillRect(0, 0, TT.W, OY);
      D.text(ctx, 'MENTA GYÁR — ' + FLOORS[this.fi].name, 20, 30, { size: 24, color: '#7fe0b5' });
      D.panel(ctx, TT.W - 180, 10, 166, 40, { fill: '#2b1e5c', r: 12, lw: 2.5, shadow: false });
      D.coin(ctx, TT.W - 158, 30, 12);
      D.text(ctx, U.fmt(TT.save.coins), TT.W - 138, 31, { size: 20, color: '#ffd23f' });
      D.text(ctx, this.doorsOpen() ? 'Ajtók: nyitva' : 'Ajtók: zárva (keresd a piros gombokat)', TT.W - 200, 31, { size: 15, align: 'right', color: this.doorsOpen() ? '#7bff6b' : '#ff8a80' });
      D.button(ctx, EXIT.x, EXIT.y, EXIT.w, EXIT.h, 'Kilépés', { color: '#6c5ce7', size: 15 });
      if (this.joy && this.joy.x != null) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.joy.ox, this.joy.oy, 56, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(this.joy.x, this.joy.y, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      TT.fx.draw(ctx, 0);
      TT.fx.draw(ctx, 1);
    },
  };

  TT.register('factory', scene);
})(window.TT);
