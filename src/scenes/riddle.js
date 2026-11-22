'use strict';
// Rébusz Torony: lépésenkénti, sakkszerű taktikai harc egy 7×5-ös táblán.
//  - a típus- és a ritkaság-kontra számít (ki kit kontráz), a hatótáv a típustól függ
//  - Rébusz pajzsos: addig nem sebezhető, amíg mind a 3 arany kulcs-mezőre rá nem léptél
//  - csapdák (15% sebzés), gyógyító mezők (+20% a kör elején), falak
//  - az ellenfél okosan lép: kulcsot őriz, csapdát kerül, gyógyítóra húzódik, a gyengét támadja
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const COLS = 7, ROWS = 5, TW = 94, TH = 62, X0 = 151, Y0 = 114;
  const ROUNDS = 16;
  const INK = '#1d1433';
  const SC = 0.62; // a figurák mérete a táblán
  const TRAP = 0.15, HEAL = 0.2;
  const ROSTER = ['cinderblock', 'kitten', 'mad_mod', 'dc_penguin', 'plasmus', 'dc_joker'];

  // a pályák: 1-2-3 a te figuráid, a-b-c az ellenséges csapat, R a Rébusz, k kulcs, # fal, t csapda, h gyógyító
  const BOARDS = [
    { name: 'Labirintus', rows: ['1.#.k.a', '.#...t.', '2..h.kR', '.t..#c.', '3.k.#.b'] },
    { name: 'Kristálytermek', rows: ['1h.k..a', '.#.#.#.', '2..t.kR', '.#.#.#c', '3.k..hb'] },
    { name: 'Folyosó', rows: ['1.....a', '.##.#t.', '2.k.hkR', '.t#.##c', '3..k..b'] },
  ];

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const inb = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
  const man = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  const TYPE_RULE = {
    brawn: { name: 'közelharc', mov: 2, range: 1, line: 0, area: 0, note: '+20% sebzés' },
    speed: { name: 'közelharc', mov: 3, range: 1, line: 0, area: 0, note: '3 mező mozgás' },
    tech: { name: 'lövés egyenes vonalban, 3 mezőre', mov: 2, range: 0, line: 3, area: 0, note: 'falon nem lő át' },
    mystic: { name: 'varázslat 2 mezőre, falon át is', mov: 2, range: 0, line: 0, area: 2, note: 'bárhová a körzetben' },
  };
  const rule = (p) => TYPE_RULE[p.fig.type];

  function msave() {
    const s = TT.save;
    s.riddle = s.riddle || { clears: 0, best: 0, plays: 0 };
    return s.riddle;
  }

  const scene = {
    // az egyensúly állítható értékei (ellenfél szintje a te csapatodhoz képest, a Rébusz gyógyítása, sebzés-szorzó)
    cfg: { eLvl: 0, bossLvl: 1, bossMult: 1.1, healFrac: 0.15, healThr: 0.6, dmgK: 0.235, foeDmg: 0.88 },

    enter(p) {
      this.p = p || {};
      // a Beállítások nehézsége szerint (a normál az alapérték; mért nyerési arány egy egyszerű botnak: ~30%)
      const diff = TT.settings.difficulty || 'normal';
      const adj = { easy: { foeDmg: 0.8, eLvl: -1, bossLvl: -1 }, hard: { foeDmg: 1.14, eLvl: 1, bossLvl: 1 } }[diff] || { foeDmg: 1, eLvl: 0, bossLvl: 0 };
      this.k = Object.assign({}, this.cfg, { foeDmg: this.cfg.foeDmg * adj.foeDmg, eLvl: this.cfg.eLvl + adj.eLvl, bossLvl: this.cfg.bossLvl + adj.bossLvl });
      this.t = 0;
      this.over = false;
      this.state = 'intro';
      this.steps = [];
      this.cur = null;
      this.fx = [];
      this.shake = 0;
      this.round = 0;
      this.keys = 0;
      this.sel = null;
      this.info = null;
      this.moveMap = new Map();
      this.targets = [];
      this.msg = '';
      this.msgT = 0;
      this.shieldFlash = 0;
      this.board = BOARDS[(msave().plays || 0) % BOARDS.length];
      this.build();
      this.layoutMenu();
      TT.audio.music('vault');
      msave().plays = (msave().plays || 0) + 1;
      TT.store.write();
      this.showIntro();
    },

    // ---------- felállítás ----------
    build() {
      const s = TT.save;
      const rows = this.board.rows;
      this.tiles = rows.map((row) => row.split('').map((ch) => ({ t: ch === '#' ? 'wall' : ch === 't' ? 'trap' : ch === 'h' ? 'heal' : ch === 'k' ? 'key' : 'floor', got: false })));
      const spots = { p: [], e: [], R: null };
      rows.forEach((row, y) => row.split('').forEach((ch, x) => {
        if ('123'.includes(ch)) spots.p[+ch - 1] = [x, y];
        else if ('abc'.includes(ch)) spots.e['abc'.indexOf(ch)] = [x, y];
        else if (ch === 'R') spots.R = [x, y];
      }));
      const team = s.team.filter((id) => TT.FIG[id]);
      const syn = TT.synergy(team);
      const lv = Object.values(s.owned).map((o) => o.lvl).sort((a, b) => b - a).slice(0, 3);
      const avg = lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length : 8;
      const eLvl = U.clamp(Math.round(avg) + this.k.eLvl, 8, TT.MAX_LVL);
      this.pieces = [];
      team.slice(0, 3).forEach((id, i) => {
        const o = s.owned[id] || { lvl: 1 };
        const mult = syn && TT.FIG[id].team === syn.team ? 1 + syn.bonus : 1;
        this.add(id, 0, spots.p[i][0], spots.p[i][1], o.lvl, TT.starsOf(id), mult, false);
      });
      const roster = U.shuffle(ROSTER.slice()).slice(0, 3);
      roster.forEach((id, i) => this.add(id, 1, spots.e[i][0], spots.e[i][1], eLvl, 0, 1, false));
      this.add('dc_riddler', 1, spots.R[0], spots.R[1], Math.min(TT.MAX_LVL, Math.round(avg) + this.k.bossLvl), 1, this.k.bossMult, true);
    },

    add(id, side, x, y, lvl, stars, mult, boss) {
      const fig = TT.FIG[id];
      const st = TT.statsFor(fig, lvl, stars, mult);
      const pc = {
        id, fig, side, x, y, vx: x, vy: y, lvl, boss: !!boss,
        hp: st.hp, maxHp: st.hp, atk: st.atk, def: st.def, lf: st.lf,
        mov: TYPE_RULE[fig.type].mov, moved: false, acted: false, alive: true, dying: 0,
        flash: 0, anim: null, route: null, idleT: 0.2 + this.pieces.length * 0.37, live: 0, seed: this.pieces.length,
      };
      this.pieces.push(pc);
      return pc;
    },

    // ---------- szabályok ----------
    at(x, y, ignore) {
      return this.pieces.find((p) => p.alive && p !== ignore && p.x === x && p.y === y) || null;
    },
    mine() {
      return this.pieces.filter((p) => p.alive && p.side === 0);
    },
    foes(side) {
      return this.pieces.filter((p) => p.alive && p.side !== side);
    },
    shielded() {
      return this.keys < 3;
    },

    reach(p) {
      const out = new Map();
      const start = p.y * COLS + p.x;
      out.set(start, []);
      let frontier = [[p.x, p.y, []]];
      for (let d = 0; d < p.mov; d++) {
        const next = [];
        for (const [x, y, path] of frontier) {
          for (const [dx, dy] of DIRS) {
            const nx = x + dx, ny = y + dy;
            if (!inb(nx, ny) || this.tiles[ny][nx].t === 'wall' || this.at(nx, ny, p)) continue;
            const k = ny * COLS + nx;
            if (out.has(k)) continue;
            const np = path.concat([[nx, ny]]);
            out.set(k, np);
            next.push([nx, ny, np]);
          }
        }
        frontier = next;
      }
      return out;
    },

    // kiket támadhat p az (x,y) mezőről
    targetsFrom(p, x, y) {
      const r = rule(p);
      const res = [];
      for (const o of this.foes(p.side)) {
        const dx = o.x - x, dy = o.y - y, dist = Math.abs(dx) + Math.abs(dy);
        if (r.range && dist === r.range) res.push(o);
        else if (r.area && dist >= 1 && dist <= r.area) res.push(o);
        else if (r.line && (dx === 0 || dy === 0) && dist >= 1 && dist <= r.line) {
          const sx = Math.sign(dx), sy = Math.sign(dy);
          let clear = true;
          for (let i = 1; i < dist; i++) {
            const cx = x + sx * i, cy = y + sy * i;
            if (this.tiles[cy][cx].t === 'wall' || this.at(cx, cy, p)) clear = false;
          }
          if (clear) res.push(o);
        }
      }
      return res;
    },

    // útvonal-távolság (a falakat kikerülve) a megadott mezőkből; a tervező ezzel közeledik, nem légvonalban
    bfs(sources) {
      const d = new Map();
      const q = [];
      for (const [x, y] of sources) {
        d.set(y * COLS + x, 0);
        q.push([x, y]);
      }
      for (let i = 0; i < q.length; i++) {
        const [x, y] = q[i];
        const dd = d.get(y * COLS + x);
        for (const [dx, dy] of DIRS) {
          const nx = x + dx, ny = y + dy;
          if (!inb(nx, ny) || this.tiles[ny][nx].t === 'wall') continue;
          const k = ny * COLS + nx;
          if (d.has(k)) continue;
          d.set(k, dd + 1);
          q.push([nx, ny]);
        }
      }
      return d;
    },

    // várható sebzés (ugyanez a képlet számol a harcban, csak a szórás nélkül)
    expDmg(att, def) {
      let d = def.maxHp * this.k.dmgK * Math.pow(att.atk / def.def, 0.6) * (att.lf / def.lf) * TT.matchMult(att.fig, def.fig);
      if (att.fig.type === 'brawn') d *= 1.2;
      if (att.boss) d *= 1.25;
      if (att.side === 1) d *= this.k.foeDmg;
      return d;
    },

    reachOf(o) {
      const r = rule(o);
      return o.mov + Math.max(r.range, r.line, r.area);
    },
    threat(p, x, y) {
      let sum = 0;
      for (const f of this.foes(p.side)) {
        if (f.boss && this.shielded()) continue;
        if (Math.abs(f.x - x) + Math.abs(f.y - y) <= this.reachOf(f)) sum += (this.expDmg(f, p) / Math.max(1, p.hp)) * 30;
      }
      return Math.min(60, sum);
    },

    // ---------- lépéssor (animációk) ----------
    push(step) {
      this.steps.push(step);
    },
    insert(list) {
      this.steps.unshift(...list);
    },
    wait(t) {
      let k = 0;
      return { update: (dt) => (k += dt) >= t };
    },
    fn(f) {
      return { start: f, update: () => true };
    },
    stepMove(p, path) {
      return {
        start: () => {
          p.route = path.slice();
          p.live = 1;
        },
        update: (dt) => {
          if (!p.route) return true;
          const [tx, ty] = p.route[0];
          const dx = tx - p.vx, dy = ty - p.vy, d = Math.hypot(dx, dy), sp = 6.2 * dt;
          if (d <= sp) {
            p.vx = tx;
            p.vy = ty;
            p.x = tx;
            p.y = ty;
            p.route.shift();
            TT.audio.sfx('step');
            if (!p.route.length) {
              p.route = null;
              p.live = 0.4;
              this.arrive(p);
              return true;
            }
          } else {
            p.vx += (dx / d) * sp;
            p.vy += (dy / d) * sp;
          }
          return false;
        },
      };
    },
    stepAttack(att, def) {
      let hit = false;
      const ranged = rule(att).line || rule(att).area;
      const impact = ranged ? 0.5 : 0.3;
      return {
        start: () => {
          att.anim = { t: 0, dx: Math.sign(def.x - att.x), dy: Math.sign(def.y - att.y), kind: ranged ? 'cast' : 'melee' };
          att.live = 1;
          TT.audio.voice(att.id, 'attack', 0.6);
          TT.audio.sfx(ranged ? (att.fig.type === 'tech' ? 'zap' : 'magic') : 'whoosh');
        },
        update: (dt) => {
          const a = att.anim;
          a.t += dt;
          if (!hit && a.t >= impact) {
            hit = true;
            this.resolveHit(att, def);
          }
          if (a.t >= 0.8) {
            att.anim = null;
            att.live = 0.4;
            return true;
          }
          return false;
        },
      };
    },
    stepHeal(src, ally) {
      return {
        start: () => {
          const h = Math.round(ally.maxHp * this.k.healFrac);
          ally.hp = Math.min(ally.maxHp, ally.hp + h);
          this.pop(ally, '+' + h, '#7bff6b');
          TT.audio.sfx('heal');
          TT.fx.burst(this.px(ally.x), this.py(ally.y) - 20, 10, { colors: ['#7bff6b', '#ffffff'], shape: 'star', speed: 150, size: 6, life: 0.6, layer: 1 });
          src.live = 1;
        },
        update: () => true,
      };
    },

    px(x) {
      return X0 + (x + 0.5) * TW;
    },
    py(y) {
      return Y0 + (y + 0.5) * TH + 12;
    },
    pop(p, text, color, size) {
      this.fx.push({ x: this.px(p.vx), y: this.py(p.vy) - 60, text, color, size: size || 20, t: 0 });
    },

    arrive(p) {
      const tl = this.tiles[p.y][p.x];
      if (tl.t === 'trap') {
        const d = Math.round(p.maxHp * TRAP);
        p.hp = Math.max(1, p.hp - d);
        p.flash = 0.3;
        this.pop(p, '−' + d, '#ff8a80');
        TT.audio.sfx('burn');
        TT.fx.burst(this.px(p.x), this.py(p.y), 12, { colors: ['#e84545', '#ffb000'], shape: 'square', speed: 200, size: 6, life: 0.5, layer: 1 });
      } else if (tl.t === 'key' && p.side === 0 && !tl.got) {
        tl.got = true;
        this.keys++;
        TT.audio.sfx('found');
        TT.audio.sfx('coin');
        this.pop(p, `KULCS ${this.keys}/3`, '#ffd23f', 22);
        TT.fx.burst(this.px(p.x), this.py(p.y) - 10, 18, { colors: ['#ffd23f', '#ffffff'], shape: 'star', speed: 240, size: 8, life: 0.8, layer: 1 });
        if (this.keys >= 3) {
          const boss = this.pieces.find((o) => o.boss);
          this.insert([
            this.wait(0.35),
            this.fn(() => {
              this.shieldFlash = 1;
              this.shake = 0.5;
              TT.audio.sfx('guardbreak');
              TT.audio.sfx('thunder');
              TT.fx.burst(this.px(boss.x), this.py(boss.y) - 30, 40, { colors: ['#7bff9b', '#ffffff', '#c08cff'], shape: 'star', speed: 380, size: 9, life: 1, layer: 1 });
              this.say('A RÉBUSZ-PAJZS LEESETT! Most megsebezheted!', '#7bff9b', 3.5);
              TT.audio.voice('dc_riddler', 'hurt', 0.8);
            }),
            this.wait(0.8),
          ]);
        }
      }
      this.checkEnd();
    },

    resolveHit(att, def) {
      if (def.boss && this.shielded()) {
        this.pop(def, 'PAJZS!', '#9be7ff', 24);
        this.say('A Rébusz pajzsa véd! Szerezd meg a 3 kulcsot (?)!', '#9be7ff', 3);
        TT.audio.sfx('shield');
        this.shieldFlash = 0.6;
        return;
      }
      const m = TT.matchMult(att.fig, def.fig);
      const dmg = Math.max(1, Math.round(this.expDmg(att, def) * U.rand(0.93, 1.07)));
      def.hp = Math.max(0, def.hp - dmg);
      def.flash = 0.3;
      def.hurt = 0.35;
      this.shake = Math.max(this.shake, dmg > def.maxHp * 0.3 ? 0.35 : 0.15);
      const eff = m > 1.001 ? ' ▲' : m < 0.999 ? ' ▼' : '';
      this.pop(def, '−' + dmg + eff, m > 1.001 ? '#ffb000' : m < 0.999 ? '#b8c2cc' : '#ffffff', m > 1.001 ? 24 : 20);
      TT.audio.sfx(m > 1.001 ? 'crit' : 'hit');
      TT.fx.burst(this.px(def.vx), this.py(def.vy) - 28, 10, { colors: [att.fig.type === 'mystic' ? '#c08cff' : '#ffd23f', '#ffffff'], shape: 'star', speed: 220, size: 6, life: 0.5, layer: 1 });
      if (def.hp <= 0) {
        def.alive = false;
        def.dying = 0.8;
        TT.audio.sfx('ko');
        TT.audio.voice(def.id, 'ko', 0.7);
      } else TT.audio.voice(def.id, 'hurt', 0.55);
      this.checkEnd();
    },

    say(text, color, dur) {
      this.msg = text;
      this.msgColor = color || '#ffffff';
      this.msgT = dur || 3;
    },

    // ---------- játékmenet ----------
    startPlayerTurn() {
      this.round++;
      if (this.round > ROUNDS) {
        this.finish(false, 'time');
        return;
      }
      this.state = 'player';
      for (const p of this.pieces) {
        if (p.side !== 0) continue;
        p.moved = false;
        p.acted = false;
      }
      this.healTiles(0);
      this.sel = null;
      this.moveMap = new Map();
      this.targets = [];
      this.say(`${this.round}. kör: koppints egy figurádra!`, '#c8b8f0', 2.5);
    },
    healTiles(side) {
      for (const p of this.pieces) {
        if (!p.alive || p.side !== side) continue;
        if (this.tiles[p.y][p.x].t === 'heal' && p.hp < p.maxHp) {
          const h = Math.round(p.maxHp * HEAL);
          p.hp = Math.min(p.maxHp, p.hp + h);
          this.pop(p, '+' + h, '#7bff6b');
          TT.audio.sfx('heal');
        }
      }
    },

    select(p) {
      this.sel = p;
      this.info = p;
      this.moveMap = p.moved || p.acted ? new Map() : this.reach(p);
      this.targets = p.acted ? [] : this.targetsFrom(p, p.x, p.y);
    },
    canDo(p) {
      return p.alive && !p.acted && (!p.moved || this.targetsFrom(p, p.x, p.y).length > 0);
    },

    tapTile(tx, ty) {
      const sel = this.sel;
      const o = this.at(tx, ty);
      if (sel && !this.busy()) {
        // támadás
        if (o && o.side === 1 && this.targets.includes(o)) {
          this.doAttack(sel, o);
          return;
        }
        // mozgás
        const k = ty * COLS + tx;
        if (!o && this.moveMap.has(k) && this.moveMap.get(k).length) {
          this.doMove(sel, this.moveMap.get(k));
          return;
        }
        // várakozás: a kiválasztott figura újra megkoppintva befejezi a körét
        if (o === sel && sel.moved) {
          sel.acted = true;
          this.sel = null;
          this.moveMap = new Map();
          this.targets = [];
          TT.audio.sfx('back');
          this.afterAction();
          return;
        }
      }
      if (o) {
        this.info = o;
        if (o.side === 0 && !this.busy()) {
          this.select(o);
          TT.audio.sfx('select');
        } else if (o.side === 1) TT.audio.sfx('move');
        return;
      }
      if (!this.busy()) {
        this.sel = null;
        this.moveMap = new Map();
        this.targets = [];
      }
    },

    busy() {
      return !!this.cur || this.steps.length > 0 || this.state !== 'player';
    },

    doMove(p, path) {
      p.moved = true;
      this.moveMap = new Map();
      this.targets = [];
      this.push(this.stepMove(p, path));
      this.push(this.fn(() => {
        if (p.alive) {
          this.targets = this.targetsFrom(p, p.x, p.y);
          if (!this.canDo(p)) {
            p.acted = true;
            this.sel = null;
          }
        }
        this.afterAction();
      }));
    },
    doAttack(p, o) {
      p.acted = true;
      p.moved = true;
      this.moveMap = new Map();
      this.targets = [];
      this.sel = null;
      this.push(this.stepAttack(p, o));
      this.push(this.wait(0.25));
      this.push(this.fn(() => this.afterAction()));
    },
    afterAction() {
      if (this.over) return;
      const left = this.mine().filter((p) => this.canDo(p));
      if (!left.length) {
        this.state = 'wait';
        this.push(this.wait(0.5));
        this.push(this.fn(() => this.startEnemyTurn()));
      }
    },
    endTurnButton() {
      if (this.state !== 'player' || this.busy()) return;
      for (const p of this.mine()) p.acted = true;
      this.sel = null;
      this.moveMap = new Map();
      this.targets = [];
      TT.audio.sfx('select');
      this.state = 'wait';
      this.push(this.wait(0.2));
      this.push(this.fn(() => this.startEnemyTurn()));
    },

    // ---------- az ellenfél ----------
    startEnemyTurn() {
      if (this.over) return;
      this.state = 'enemy';
      this.sel = null;
      this.say('Az ellenfél köre…', '#ff8a80', 2);
      this.healTiles(1);
      const foes = this.mine();
      const order = this.pieces.filter((p) => p.alive && p.side === 1)
        .sort((a, b) => (a.boss ? 1 : 0) - (b.boss ? 1 : 0) || Math.min(...foes.map((f) => man(a, f))) - Math.min(...foes.map((f) => man(b, f))));
      this.push(this.wait(0.5));
      for (const p of order) {
        this.push(this.fn(() => this.enemyAct(p)));
        this.push(this.wait(0.15));
      }
      this.push(this.fn(() => {
        if (!this.over) this.startPlayerTurn();
      }));
    },

    // legjobb lépés + támadás egy figurának (az ellenfél és a teszt-robot is ezt használja)
    plan(p, mode) {
      const foes = this.foes(p.side);
      if (!foes.length) return null;
      const reach = this.reach(p);
      const shield = p.boss && this.shielded();
      const low = p.hp / p.maxHp < 0.35;
      // a fenyegetettség súlya: kezdetben óvatosabb, a körök előrehaladtával egyre vagányabb (nincs örök pattállás)
      const tw = (low ? 1.2 : mode === 'player' ? 0.1 : mode === 'careful' ? 0.35 : 0.2) * Math.max(0.3, 1 - this.round * 0.07);
      const foeDist = this.bfs(foes.map((f) => [f.x, f.y]));
      const keySrc = [];
      this.tiles.forEach((row, ky) => row.forEach((c, kx) => c.t === 'key' && !c.got && keySrc.push([kx, ky])));
      const keyDist = this.bfs(keySrc);
      let best = null;
      for (const [k, path] of reach) {
        const x = k % COLS, y = Math.floor(k / COLS);
        const tl = this.tiles[y][x];
        let sc = 0, bestT = null, bts = -1;
        const tg = shield ? [] : this.targetsFrom(p, x, y).filter((t) => !(t.boss && this.shielded()));
        for (const t of tg) {
          const d = this.expDmg(p, t);
          const kill = d >= t.hp;
          let ts = (Math.min(d, t.hp) / t.maxHp) * 100 + (kill ? 45 : 0) + (t.boss ? 12 : 0);
          if (TT.matchMult(p.fig, t.fig) > 1.001) ts += 8;
          if (ts > bts) {
            bts = ts;
            bestT = t;
          }
        }
        if (bestT) sc += bts;
        const dn = foeDist.has(k) ? foeDist.get(k) : 20;
        if (shield) {
          // a pajzsos Rébusz hátul marad, a sérült társak közelében
          const allies = this.pieces.filter((o) => o.alive && o.side === p.side && o !== p);
          sc += Math.min(dn, 5) * 6 - this.threat(p, x, y) * 0.3 - (tl.t === 'trap' ? 30 : 0);
          sc += allies.filter((o) => Math.abs(o.x - x) + Math.abs(o.y - y) <= 2).length * 3;
          sc -= Math.abs(x - p.x) + Math.abs(y - p.y);
        } else {
          sc -= this.threat(p, x, y) * tw;
          if (tl.t === 'trap') sc -= 30;
          if (tl.t === 'heal' && p.hp < p.maxHp * 0.8) sc += 22 + (low ? 15 : 0);
          if (mode === 'player' || mode === 'careful') {
            if (tl.t === 'key' && !tl.got) sc += 40;
            if (this.keys < 3) {
              if (keySrc.length && !bestT) sc -= (keyDist.has(k) ? keyDist.get(k) : 20) * 4;
            } else if (!bestT) sc -= dn * 4;
          } else {
            if (tl.t === 'key' && !tl.got && this.keys < 3) sc += 14;
            if (!bestT) sc += low ? dn * 3 : -dn * 4;
          }
        }
        sc += Math.random() * 2.5;
        if (!best || sc > best.sc) best = { sc, x, y, path, target: bestT };
      }
      return best;
    },

    enemyAct(p) {
      if (this.over || !p.alive) return;
      const pl = this.plan(p, 'enemy');
      if (!pl) return;
      const list = [];
      if (pl.path.length) list.push(this.stepMove(p, pl.path));
      if (p.boss && this.shielded()) {
        // pajzsos Rébusz: gyógyítja a legsérültebb társát
        list.push(this.fn(() => {
          const allies = this.pieces.filter((o) => o.alive && o.side === 1 && o !== p && o.hp < o.maxHp * this.k.healThr && man(o, p) <= 2)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
          if (allies[0]) this.insert([this.stepHeal(p, allies[0]), this.wait(0.4)]);
        }));
      } else if (pl.target) {
        list.push(this.fn(() => {
          // a lépés után a célpont még elérhető-e (közben megváltozhatott)
          if (p.alive && this.targetsFrom(p, p.x, p.y).includes(pl.target) && pl.target.alive) this.insert([this.stepAttack(p, pl.target), this.wait(0.25)]);
        }));
      }
      this.insert(list);
    },

    // ---------- vége ----------
    checkEnd() {
      if (this.over) return true;
      const boss = this.pieces.find((o) => o.boss);
      if (!boss.alive) {
        this.finish(true);
        return true;
      }
      if (!this.mine().length) {
        this.finish(false, 'dead');
        return true;
      }
      return false;
    },
    finish(won, why) {
      if (this.over) return;
      this.over = true;
      this.state = 'over';
      this.steps = [];
      const rs = msave();
      const s = TT.save;
      const rounds = Math.min(this.round, ROUNDS);
      const after = () => {
        TT.checkAch();
        TT.ui.choose({
          title: won ? 'Rébusz legyőzve!' : why === 'time' ? 'Lejárt az idő…' : 'Elbuktál…',
          text: won ? `${rounds} kör alatt győztél. Legjobb: ${rs.best} kör. Teljesítések: ${rs.clears}.` : why === 'time' ? 'Rébusz elmenekült, mielőtt elkaptad volna. Siess a kulcsokkal!' : 'Mindhárom figurád elesett. Gondold át a típus-előnyöket és a csapdákat!',
          options: [{ label: 'Újra', value: 'again', color: '#ff6b35' }, { label: 'Vissza a városba', value: null, color: '#6c5ce7' }],
        }, (v) => (v === 'again' ? TT.go('riddle', this.p) : this.leave()));
      };
      if (!won) {
        TT.store.write();
        setTimeout(after, 900);
        return;
      }
      TT.audio.sfx('legend');
      TT.audio.voice(this.mine()[0].id, 'win', 0.8);
      rs.clears = (rs.clears || 0) + 1;
      rs.best = rs.best ? Math.min(rs.best, rounds) : rounds;
      rs.fast = Math.min(rs.fast || 99, rounds);
      const coins = 700 + Math.max(0, ROUNDS - rounds) * 60;
      s.coins += coins;
      setTimeout(() => {
        if (!s.owned.riddle_master) {
          const info = TT.grantFigure('riddle_master');
          s.coins += 2500;
          TT.store.write();
          TT.ui.say([
            { who: 'dc_riddler', text: 'Hmpf! Megfejtettél. Ritka az ilyen. Vidd az aranyruhás mesterfigurámat, megérdemled!' },
            { text: `+${coins + 2500} érme, és megkaptad: Rébusz Nagymester (legendás)!` },
          ], () => TT.ui.reveal('riddle_master', info, after));
          return;
        }
        const id = TT.rollBox(TT.BOXES[1]);
        const info = TT.grantFigure(id);
        TT.store.write();
        TT.ui.say([{ text: `+${coins} érme és egy prémium doboz!` }], () => TT.ui.reveal(id, info, after));
      }, 1000);
    },
    leave() {
      TT.audio.sfx('door');
      TT.go('world', { pos: this.p.back, dir: 'down' });
    },

    // ---------- bevezető és súgó ----------
    showIntro() {
      TT.ui.say([
        { who: 'dc_riddler', text: 'Ha-ha! Üdv a Rébusz Toronyban! Itt nem ütésváltás lesz, hanem ész kell. Mozgasd a figuráidat, mint a sakkban!' },
        { who: 'dc_riddler', text: 'A pajzsom addig véd, amíg mind a három aranykulcson (?) nem álltál. De a csapatom közben vadászik rád…' },
      ], () => this.showHelp(true));
    },
    showHelp(first) {
      TT.ui.choose({
        title: 'Rébusz Torony — szabályok',
        text: 'Koppints egy figurádra, majd egy kék mezőre a lépéshez, és egy piros célpontra a támadáshoz. A figura újra megkoppintva befejezi a körét. ' +
          'Típus-előny +30%, ritkaság-előny +15% (Ki kit kontráz? a Gyűjteményben). Erő: közelharc, Gyorsaság: 3 lépés, Tech: egyenes lövés 3 mezőre, Misztikus: 2 mezős varázslat. ' +
          'A pajzsos Rébusz csak a 3 kulcs (?) megszerzése után sebezhető! Csapda: 15% sebzés. Zöld kereszt: gyógyít. Legfeljebb 16 kör van!',
        width: 640,
        options: [{ label: first ? 'Indulás!' : 'Rendben', value: 'go', color: '#2ecc71' }, ...(first ? [{ label: 'Vissza', value: null, color: '#6c5ce7' }] : [])],
      }, (v) => {
        if (!first) return;
        if (v === 'go') this.startPlayerTurn();
        else this.leave();
      });
    },

    // ---------- felület ----------
    layoutMenu() {
      this.menu = new TT.ui.Menu();
      this.menu.set([
        { id: 'end', x: 806, y: 440, w: 138, h: 54, label: 'Kör vége', size: 21, color: '#2ecc71', onClick: () => this.endTurnButton() },
        { id: 'help', x: 760, y: 12, w: 90, h: 44, label: 'Súgó', size: 17, color: '#4a3a8c', onClick: () => this.showHelp(false) },
        { id: 'quit', x: 858, y: 12, w: 90, h: 44, label: 'Kilép', size: 17, color: '#e84545', onClick: () => TT.ui.confirm('Kilépsz a toronyból? A harc elvész.', (ok) => ok && this.leave(), 'Kilépek', 'Maradok') },
      ]);
    },

    update(dt) {
      this.t += dt;
      this.shake = Math.max(0, this.shake - dt);
      this.shieldFlash = Math.max(0, this.shieldFlash - dt);
      this.msgT = Math.max(0, this.msgT - dt);
      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter((f) => f.t < 0.9);
      for (const p of this.pieces) {
        p.flash = Math.max(0, p.flash - dt);
        p.live = Math.max(0, p.live - dt);
        if (p.hurt) p.hurt = Math.max(0, p.hurt - dt);
        if (!p.alive && p.dying > 0) p.dying -= dt;
      }
      // lépéssor
      if (!TT.ui.overlayActive() || this.state === 'enemy' || this.state === 'wait' || this.state === 'player') {
        if (this.cur) {
          if (this.cur.update(dt)) this.cur = null;
        } else if (this.steps.length) {
          this.cur = this.steps.shift();
          if (this.cur.start) this.cur.start();
        }
      }
      if (TT.ui.overlayActive()) return;
      const I = TT.input;
      if (I.hit('back') && !this.over) {
        TT.ui.confirm('Kilépsz a toronyból? A harc elvész.', (ok) => ok && this.leave(), 'Kilépek', 'Maradok');
        return;
      }
      if (this.over) return;
      this.menu.items.find((b) => b.id === 'end').disabled = this.state !== 'player' || this.busy();
      this.menu.update();
      if (this.state !== 'player') return;
      for (const tp of I.taps) this.tap(tp.x, tp.y);
    },

    tap(x, y) {
      // gombok: a menü kezeli
      for (const b of this.menu.items) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return;
      // oldalsó kártyák
      const cards = this.cardRects();
      for (const c of cards) {
        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h && c.p.alive) {
          this.info = c.p;
          if (c.p.side === 0 && !this.busy()) this.select(c.p);
          TT.audio.sfx('select');
          return;
        }
      }
      if (x < X0 || y < Y0 || x >= X0 + COLS * TW || y >= Y0 + ROWS * TH) return;
      this.tapTile(Math.floor((x - X0) / TW), Math.floor((y - Y0) / TH));
    },

    cardRects() {
      const out = [];
      const mine = this.pieces.filter((p) => p.side === 0);
      const foes = this.pieces.filter((p) => p.side === 1);
      mine.forEach((p, i) => out.push({ p, x: 8, y: 114 + i * 104, w: 135, h: 98 }));
      foes.forEach((p, i) => out.push({ p, x: 817, y: 114 + i * 78, w: 135, h: 72 }));
      return out;
    },

    // ---------- rajz ----------
    drawBg(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, TT.H);
      g.addColorStop(0, '#0f0a26');
      g.addColorStop(0.5, '#1d2a3f');
      g.addColorStop(1, '#0e2a24');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, TT.W, TT.H);
      // lebegő kérdőjelek
      for (let i = 0; i < 16; i++) {
        const x = ((i * 173 + this.t * (10 + (i % 4) * 5)) % (TT.W + 80)) - 40;
        const y = 40 + ((i * 97) % 460) + Math.sin(this.t * 0.7 + i) * 10;
        ctx.save();
        ctx.globalAlpha = 0.12 + (i % 3) * 0.04;
        D.text(ctx, '?', x, y, { size: 30 + (i % 4) * 14, align: 'center', color: i % 2 ? '#7bff9b' : '#c08cff', stroke: false });
        ctx.restore();
      }
    },

    tileColor(c, r) {
      return (c + r) % 2 ? '#24445a' : '#1d3a4d';
    },

    drawTiles(ctx) {
      // tábla-keret neonnal
      ctx.save();
      D.rr(ctx, X0 - 12, Y0 - 12, COLS * TW + 24, ROWS * TH + 24, 16);
      ctx.fillStyle = '#0b1624';
      ctx.fill();
      ctx.shadowColor = '#7bff9b';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#3fd07a';
      ctx.stroke();
      ctx.restore();
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tl = this.tiles[r][c];
          const x = X0 + c * TW, y = Y0 + r * TH;
          if (tl.t === 'wall') {
            // a fal alatti padló
            D.rr(ctx, x + 3, y + 3, TW - 6, TH - 6, 8);
            ctx.fillStyle = '#16303f';
            ctx.fill();
            continue;
          }
          // lábazat + lap
          D.rr(ctx, x + 3, y + 7, TW - 6, TH - 8, 9);
          ctx.fillStyle = '#0f2230';
          ctx.fill();
          D.rr(ctx, x + 3, y + 3, TW - 6, TH - 9, 9);
          const g = ctx.createLinearGradient(0, y, 0, y + TH);
          const base = this.tileColor(c, r);
          g.addColorStop(0, U.shade(base, 0.18));
          g.addColorStop(1, U.shade(base, -0.1));
          ctx.fillStyle = g;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(160,230,255,0.18)';
          ctx.stroke();
          this.drawTileIcon(ctx, tl, x + TW / 2, y + TH / 2);
        }
      }
    },

    drawTileIcon(ctx, tl, cx, cy) {
      if (tl.t === 'key') {
        const b = Math.sin(this.t * 3) * 3;
        ctx.save();
        if (tl.got) ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(cx, cy + b, 19, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(cx - 5, cy + b - 6, 3, cx, cy + b, 20);
        g.addColorStop(0, tl.got ? '#9fffb8' : '#fff6a8');
        g.addColorStop(1, tl.got ? '#2ecc71' : '#ffb81c');
        ctx.fillStyle = g;
        ctx.shadowColor = tl.got ? '#2ecc71' : '#ffd23f';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.stroke();
        D.text(ctx, tl.got ? '✓' : '?', cx, cy + b + 1, { size: 24, align: 'center', color: INK, stroke: false });
        ctx.restore();
      } else if (tl.t === 'trap') {
        ctx.save();
        ctx.fillStyle = '#7a2230';
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * 20 - 9, cy + 12);
          ctx.lineTo(cx + i * 20, cy - 12 - (i === 0 ? 4 : 0));
          ctx.lineTo(cx + i * 20 + 9, cy + 12);
          ctx.closePath();
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = INK;
          ctx.stroke();
        }
        ctx.restore();
      } else if (tl.t === 'heal') {
        ctx.save();
        const k = 0.5 + Math.sin(this.t * 3) * 0.12;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46,204,113,' + (0.35 + k * 0.3) + ')';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#7bff9b';
        ctx.stroke();
        ctx.fillStyle = '#eafff1';
        ctx.fillRect(cx - 4, cy - 12, 8, 24);
        ctx.fillRect(cx - 12, cy - 4, 24, 8);
        ctx.restore();
      }
    },

    drawWall(ctx, c, r) {
      const x = X0 + c * TW, y = Y0 + r * TH;
      const cx = x + TW / 2;
      ctx.save();
      // zöld kristályoszlop
      ctx.beginPath();
      ctx.moveTo(cx - 28, y + TH - 10);
      ctx.lineTo(cx - 22, y + 8);
      ctx.lineTo(cx, y - 24);
      ctx.lineTo(cx + 22, y + 8);
      ctx.lineTo(cx + 28, y + TH - 10);
      ctx.closePath();
      const g = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0);
      g.addColorStop(0, '#2ecc71');
      g.addColorStop(0.5, '#9fffb8');
      g.addColorStop(1, '#1f8f55');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      D.text(ctx, '?', cx, y + TH / 2 - 6, { size: 30, align: 'center', color: '#0d3a22', stroke: false });
      ctx.restore();
    },

    drawHighlights(ctx) {
      const pulse = 0.5 + Math.sin(this.t * 6) * 0.5;
      if (this.sel) {
        const x = X0 + this.sel.x * TW, y = Y0 + this.sel.y * TH;
        D.rr(ctx, x + 2, y + 2, TW - 4, TH - 6, 10);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffd23f';
        ctx.stroke();
      }
      for (const [k, path] of this.moveMap) {
        if (!path.length) continue;
        const x = X0 + (k % COLS) * TW, y = Y0 + Math.floor(k / COLS) * TH;
        D.rr(ctx, x + 5, y + 5, TW - 10, TH - 12, 9);
        ctx.fillStyle = 'rgba(63,167,255,' + (0.22 + pulse * 0.12) + ')';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(120,200,255,0.9)';
        ctx.stroke();
      }
      for (const t of this.targets) {
        const x = X0 + t.x * TW, y = Y0 + t.y * TH;
        D.rr(ctx, x + 3, y + 3, TW - 6, TH - 8, 10);
        ctx.fillStyle = 'rgba(232,69,69,' + (0.2 + pulse * 0.15) + ')';
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#ff5a5a';
        ctx.stroke();
      }
    },

    drawPiece(ctx, p) {
      const x = this.px(p.vx), y = this.py(p.vy);
      let ox = 0, oy = 0;
      const a = p.anim;
      if (a) {
        const k = a.t < 0.2 ? -a.t / 0.2 * 0.25 : a.t < 0.34 ? -0.25 + (a.t - 0.2) / 0.14 * 1.25 : 1 - U.clamp((a.t - 0.34) / 0.4, 0, 1);
        if (a.kind === 'melee') {
          ox = a.dx * 26 * k;
          oy = a.dy * 18 * k;
        } else oy = -6 * Math.sin(U.clamp(a.t / 0.5, 0, 1) * Math.PI);
      }
      const dying = !p.alive;
      const alpha = dying ? U.clamp(p.dying / 0.8, 0, 1) : 1;
      ctx.save();
      ctx.globalAlpha = alpha * (p.side === 0 && p.acted && this.state === 'player' ? 0.72 : 1);
      // árnyék
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 24, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fill();
      let anim3d = { name: 'idle', t: p.idleT };
      if (dying) anim3d = { name: 'ko', t: 0.8 - p.dying };
      else if (a) anim3d = { name: 'ability', slot: 0, p: U.clamp(a.t / 0.8, 0, 1) };
      else if (p.hurt > 0) anim3d = { name: 'hurt', t: 0.35 - p.hurt };
      else if (p.route) anim3d = { name: 'idle', t: this.t + p.seed };
      TT.art.drawFigure(ctx, p.fig, x + ox, y + oy, SC, {
        facing: p.side === 0 ? 1 : -1, pose: 'idle', anim3d, flash: p.flash > 0 ? 1 : 0, t: p.idleT, pedestal: false, live3d: p.live > 0,
        paint: p.side === 0 ? TT.paintOf(p.id) : null,
      });
      ctx.restore();
      if (dying) return;
      // pajzs-buborék a Rébuszon
      if (p.boss && this.shielded()) {
        ctx.save();
        const r = 40 + Math.sin(this.t * 3) * 2;
        ctx.beginPath();
        ctx.arc(x, y - 36, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(155,231,255,' + (0.16 + this.shieldFlash * 0.3) + ')';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(190,240,255,0.85)';
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -this.t * 30;
        ctx.stroke();
        ctx.restore();
      }
      // HP-sáv
      const bw = 48, bx = x - bw / 2, by = y - 72;
      D.panel(ctx, bx - 2, by - 2, bw + 4, 11, { fill: '#120a2c', r: 4, lw: 1.5, shadow: false, inner: false });
      const f = p.hp / p.maxHp;
      D.bar(ctx, bx, by, bw, 7, f, { color: f > 0.5 ? '#4cd964' : f > 0.25 ? '#ffcc00' : '#ff3b30' });
      D.typeIcon(ctx, p.fig.type, bx - 10, by + 3, 6);
      if (p.boss) D.text(ctx, 'RÉBUSZ', x, by - 9, { size: 11, align: 'center', color: '#c08cff', lw: 3 });
      if (p.side === 0 && this.state === 'player') {
        // állapotjelző: mozgott / kész
        if (p.acted) D.text(ctx, '✓', x + 22, by + 4, { size: 14, align: 'center', color: '#7bff6b', lw: 3 });
        else if (p === this.sel) {
          const b = Math.sin(this.t * 7) * 3;
          ctx.beginPath();
          ctx.moveTo(x, by - 6 + b);
          ctx.lineTo(x - 7, by - 16 + b);
          ctx.lineTo(x + 7, by - 16 + b);
          ctx.closePath();
          ctx.fillStyle = '#ffd23f';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = INK;
          ctx.stroke();
        }
      }
    },

    drawCards(ctx) {
      for (const c of this.cardRects()) {
        const p = c.p;
        const sel = p === this.info;
        ctx.save();
        ctx.globalAlpha = p.alive ? 1 : 0.4;
        D.panel(ctx, c.x, c.y, c.w, c.h, { fill: p.side === 0 ? '#1f3a7a' : '#5a2140', r: 12, lw: sel ? 4 : 3, stroke: sel ? '#ffd23f' : '#120a2c', shadow: false });
        ctx.drawImage(TT.art.figureCanvas(p.id, 96, { pedestal: false, paint: p.side === 0 ? undefined : null }), c.x + 2, c.y + (c.h > 90 ? 4 : 0), c.h > 90 ? 60 : 54, c.h > 90 ? 60 : 54);
        D.text(ctx, p.fig.short, c.x + c.w - 8, c.y + 14, { size: 14, align: 'right', maxWidth: c.w - 66, lw: 3 });
        D.typeIcon(ctx, p.fig.type, c.x + c.w - 16, c.y + 36, 9);
        D.text(ctx, 'Sz.' + p.lvl, c.x + c.w - 30, c.y + 36, { size: 12, align: 'right', color: '#ffd23f', lw: 3 });
        const f = Math.max(0, p.hp) / p.maxHp;
        D.bar(ctx, c.x + 8, c.y + c.h - 22, c.w - 16, 11, f, { color: f > 0.5 ? '#4cd964' : f > 0.25 ? '#ffcc00' : '#ff3b30' });
        D.text(ctx, Math.ceil(p.hp) + '/' + p.maxHp, c.x + c.w / 2, c.y + c.h - 16, { size: 10, align: 'center', lw: 2.5 });
        if (!p.alive) D.text(ctx, 'K.O.', c.x + c.w / 2, c.y + 30, { size: 20, align: 'center', color: '#ff4f4f' });
        ctx.restore();
      }
    },

    drawInfo(ctx) {
      D.panel(ctx, 12, 438, 780, 96, { fill: 'rgba(27,17,64,0.92)', r: 14, lw: 3 });
      const p = this.info && this.info.alive ? this.info : this.sel;
      if (p) {
        ctx.drawImage(TT.art.figureCanvas(p.id, 96, { pedestal: false, paint: p.side === 0 ? undefined : null }), 18, 440, 70, 70);
        D.text(ctx, p.fig.name + (p.boss ? ' (a főnök)' : ''), 96, 456, { size: 18, maxWidth: 360 });
        D.typeIcon(ctx, p.fig.type, 104, 480, 9);
        const R = rule(p);
        D.text(ctx, `${TT.TYPES[p.fig.type].name} · ${TT.RARITY[p.fig.rarity].name} · Szint ${p.lvl}`, 120, 480, { size: 13, color: '#e8e2ff', lw: 3, maxWidth: 360 });
        D.text(ctx, `Mozgás ${p.mov} · ${R.name}`, 96, 502, { size: 13, color: '#ffe9a0', lw: 3, maxWidth: 380 });
        // előny/hátrány az ellenfelekkel szemben
        const foes = this.foes(p.side);
        const rows = foes.slice(0, 4);
        rows.forEach((o, i) => {
          const m = TT.matchMult(p.fig, o.fig);
          const mm = TT.matchMult(o.fig, p.fig);
          const tx = 480 + (i % 2) * 150, ty = 456 + Math.floor(i / 2) * 22;
          const txt = `${o.fig.short}: ${m > 1.001 ? '+' : m < 0.999 ? '−' : '±'}${Math.round(Math.abs(m - 1) * 100)}%`;
          D.text(ctx, txt, tx, ty, { size: 12, color: m > 1.001 ? '#7bff6b' : m < 0.999 ? '#ff8a80' : '#ffffff', lw: 3, maxWidth: 146 });
          if (mm > 1.001) D.text(ctx, 'veszélyes', tx, ty + 11, { size: 9, color: '#ff8a80', lw: 2.5 });
        });
        D.text(ctx, p.side === 0 ? 'ellenük (te → ő):' : 'ellened (ő → te):', 480, 438 + 8, { size: 10, color: '#a89cd8', stroke: false });
      } else D.text(ctx, 'Koppints egy figurára a részletekért.', 40, 486, { size: 15, color: '#c8b8f0', stroke: false });
      // felső sáv: kör, kulcsok
      D.panel(ctx, 12, 12, 360, 56, { fill: '#2b1e5c', r: 14, lw: 3 });
      D.text(ctx, 'Rébusz Torony', 24, 30, { size: 19, color: '#ffd23f' });
      D.text(ctx, this.board.name + ' · Kör ' + Math.min(this.round, ROUNDS) + '/' + ROUNDS, 24, 52, { size: 14, color: '#c8b8f0', lw: 3 });
      for (let i = 0; i < 3; i++) {
        const got = i < this.keys;
        const cx = 300 + i * 26, cy = 40;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fillStyle = got ? '#ffd23f' : 'rgba(255,255,255,0.12)';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = got ? INK : 'rgba(255,255,255,0.4)';
        ctx.stroke();
        D.text(ctx, '?', cx, cy + 1, { size: 15, align: 'center', color: got ? INK : 'rgba(255,255,255,0.5)', stroke: false });
      }
      if (this.msgT > 0) {
        // üzenetsáv a fejléc közepén (nem takarja a táblát)
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.msgT);
        D.panel(ctx, 380, 12, 372, 56, { fill: 'rgba(11,22,36,0.92)', grad: false, r: 12, lw: 2.5, shadow: false });
        const lines = D.wrap(ctx, this.msg, 348, 15).slice(0, 2);
        lines.forEach((l, i) => D.text(ctx, l, 566, 40 + (i - (lines.length - 1) / 2) * 20, { size: 15, align: 'center', color: this.msgColor || '#fff', lw: 3 }));
        ctx.restore();
      }
    },

    draw(ctx) {
      ctx.save();
      if (this.shake > 0) ctx.translate(U.rand(-5, 5) * this.shake * 3, U.rand(-5, 5) * this.shake * 3);
      this.drawBg(ctx);
      this.drawTiles(ctx);
      this.drawHighlights(ctx);
      // mélység szerinti sorrend: falak és figurák
      const items = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (this.tiles[r][c].t === 'wall') items.push({ y: r + 0.9, draw: () => this.drawWall(ctx, c, r) });
      for (const p of this.pieces) if (p.alive || p.dying > 0) items.push({ y: p.vy + 0.55, draw: () => this.drawPiece(ctx, p) });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) it.draw();
      // várható sebzés a támadható ellenfeleken
      if (this.sel && this.state === 'player') {
        for (const t of this.targets) {
          const shield = t.boss && this.shielded();
          const d = Math.round(this.expDmg(this.sel, t));
          const m = TT.matchMult(this.sel.fig, t.fig);
          const x = this.px(t.vx), y = this.py(t.vy) + 6;
          D.panel(ctx, x - 30, y - 6, 60, 22, { fill: 'rgba(11,22,36,0.92)', r: 8, lw: 2, shadow: false, stroke: '#ff5a5a' });
          D.text(ctx, shield ? 'PAJZS' : '−' + d + (m > 1.001 ? ' ▲' : m < 0.999 ? ' ▼' : ''), x, y + 5, { size: 13, align: 'center', color: shield ? '#9be7ff' : m > 1.001 ? '#ffb000' : m < 0.999 ? '#b8c2d0' : '#ffffff', lw: 3 });
        }
      }
      for (const f of this.fx) {
        ctx.save();
        ctx.globalAlpha = 1 - f.t / 0.9;
        D.text(ctx, f.text, f.x, f.y - f.t * 36, { size: f.size, align: 'center', color: f.color });
        ctx.restore();
      }
      ctx.restore();
      this.drawCards(ctx);
      this.drawInfo(ctx);
      this.menu.draw(ctx);
      TT.fx.draw(ctx, 1);
    },
  };

  TT.register('riddle', scene);
})(window.TT);
