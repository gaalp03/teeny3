'use strict';
// Harcrendszer: valós idejű, töltődő támadások, blokk/tökéletes blokk, csere, szuper.
// A Combat osztály tiszta logika (szimulálható), a jelenet rajzol és kezeli a bemenetet.
(function (TT) {
  const U = TT.U;
  const D = TT.D;
  const PERFECT_WINDOW = 0.28;
  const SWAP_CD = 3.5;

  // ======================= LOGIKA =======================
  function mkFighter(id, lvl, side, idx, stars, mult) {
    const fig = TT.FIG[id];
    const st = TT.statsFor(fig, lvl, stars, mult);
    const passive = TT.passiveOf(fig);
    return {
      id, fig, lvl, st, side, idx, stars: stars || 0, passive,
      maxHp: st.hp, hp: st.hp, ghost: st.hp,
      moves: fig.moves.map((m, i) => ({ m: TT.MOVES[m], c: Math.random() * 0.3 + (i === 0 ? 0.45 : 0.1) })),
      sup: TT.MOVES[fig.sup],
      superM: passive === 'firstwind' ? 40 : 0,
      status: passive === 'shieldstart' ? { shield: { t: 60, v: Math.round(st.hp * 0.12), max: 60 } } : {},
      stun: 0, guard: 100, blocking: false, blockT: 0, blockCd: 0,
      action: null, alive: true, koT: 0,
      // animáció
      x: 0, y: 0, hurtT: 0, flashT: 0,
    };
  }

  class Combat {
    constructor(teamA, teamB, opts, emit) {
      opts = opts || {};
      this.emit = emit || (() => {});
      this.sides = [teamA, teamB].map((team, s) => {
        const syn = TT.synergy(team.map((t) => t.id));
        return {
          idx: s, synergy: syn,
          fighters: team.map((t, i) => mkFighter(t.id, t.lvl, s, i, t.stars, syn && TT.FIG[t.id].team === syn.team ? 1 + syn.bonus : 1)),
          active: 0, swapCd: 0, swapAnim: 0, koWait: 0,
        };
      });
      this.time = 0;
      this.started = false;
      this.winner = null;
      this.ai = [opts.aiA != null ? new AI(opts.aiA) : null, new AI(opts.ai != null ? opts.ai : 0.4)];
      this.aiPaused = false;
    }
    act(s) {
      const side = this.sides[s];
      return side.fighters[side.active];
    }
    opp(s) {
      return this.act(1 - s);
    }
    canAct(f) {
      const side = this.sides[f.side];
      return this.started && this.winner == null && f.alive && !f.action && f.stun <= 0 && side.swapAnim <= 0 && side.fighters[side.active] === f;
    }

    useMove(s, slot) {
      const f = this.act(s);
      if (!this.canAct(f)) return false;
      let move;
      if (slot === 'super') {
        if (f.superM < 100) return false;
        f.superM = 0;
        move = f.sup;
      } else {
        const mv = f.moves[slot];
        if (!mv || mv.c < 1) return false;
        mv.c = 0;
        move = mv.m;
      }
      f.blocking = false;
      this.startAction(f, move, slot === 'super');
      return true;
    }

    startAction(f, move, isSuper) {
      const a = { move, t: 0, windup: move.windup, hits: [], hi: 0, launched: false, isSuper, kind: move.kind };
      const n = move.hits || 1;
      if (move.kind === 'self') a.hits = [move.windup];
      else if (move.kind === 'shot' || (move.kind === 'multi' && !move.melee)) {
        for (let i = 0; i < n; i++) a.hits.push(move.windup + 0.3 + i * 0.11);
      } else if (move.kind === 'beam') {
        for (let i = 0; i < n; i++) a.hits.push(move.windup + 0.08 + i * 0.1);
      } else if (move.kind === 'slam') a.hits = [move.windup + 0.2];
      else for (let i = 0; i < n; i++) a.hits.push(move.windup + 0.12 + i * 0.13);
      a.melee = move.kind === 'melee' || !!move.melee;
      a.end = a.hits[a.hits.length - 1] + (a.melee ? 0.34 : 0.24);
      f.action = a;
      this.emit('windup', { f, move, a });
    }

    setBlock(s, on) {
      const f = this.act(s);
      if (!f) return;
      if (on) {
        if (!f.blocking && f.blockCd <= 0 && f.alive && !f.action && f.stun <= 0 && f.guard > 5 && this.sides[s].swapAnim <= 0 && this.started && this.winner == null) {
          f.blocking = true;
          f.blockT = 0;
        }
      } else if (f.blocking) {
        f.blocking = false;
        f.blockCd = 0.18;
      }
    }

    swap(s, benchSlot) {
      const side = this.sides[s];
      const cur = side.fighters[side.active];
      const bench = side.fighters.map((f, i) => i).filter((i) => i !== side.active);
      const target = bench[benchSlot];
      if (target == null) return false;
      const nf = side.fighters[target];
      if (!nf.alive || side.swapCd > 0 || side.swapAnim > 0 || this.winner != null || !this.started) return false;
      if (cur.alive && (cur.action || cur.stun > 0)) return false;
      this.doSwap(side, target, true);
      return true;
    }

    doSwap(side, target, manual) {
      const cur = side.fighters[side.active];
      cur.blocking = false;
      cur.action = null;
      cur.status = {};
      side.active = target;
      side.swapAnim = 0.4;
      if (manual) side.swapCd = SWAP_CD;
      const nf = side.fighters[target];
      nf.blocking = false;
      nf.stun = 0;
      this.emit('swap', { side: side.idx, from: cur, to: nf });
    }

    applyStatus(f, s, d, v, src) {
      if (!f.alive) return;
      if (s === 'stun') {
        f.stun = Math.max(f.stun, d);
        f.blocking = false;
        if (f.action) f.action = null;
      } else {
        const cur = f.status[s];
        f.status[s] = { t: Math.max(cur ? cur.t : 0, d), v: v != null ? v : cur ? cur.v : 0, max: Math.max(cur ? cur.max : 0, d) };
      }
      this.emit('status', { f, s, src });
    }

    damage(def, amount) {
      const sh = def.status.shield;
      if (sh && sh.v > 0) {
        const ab = Math.min(sh.v, amount);
        sh.v -= ab;
        amount -= ab;
        if (sh.v <= 0) delete def.status.shield;
      }
      def.hp -= amount;
      if (def.hp <= 0 && def.alive) this.ko(def);
      return amount;
    }

    ko(f) {
      f.hp = 0;
      f.alive = false;
      f.action = null;
      f.blocking = false;
      f.status = {};
      f.koT = 0;
      this.sides[f.side].koWait = 1.0;
      this.emit('ko', { f });
    }

    resolveHit(att, a, hitIdx) {
      const move = a.move;
      const def = this.opp(att.side);
      if (!def || !def.alive || !att.alive) return;
      const per = move.power / (move.hits || 1);
      const atkMul = (att.status.atkUp ? 1.3 : 1) * (att.status.weak ? 0.72 : 1);
      const defMul = (def.status.defUp ? 0.65 : 1) * (def.status.mark ? 1.25 : 1);
      const typeM = TT.typeMult(att.fig.type, def.fig.type);
      // szerencse: kitérés
      if (def.passive === 'lucky' && !def.blocking && Math.random() < 0.1) {
        this.emit('dodge', { att, def, move, a, hitIdx });
        return;
      }
      let crit = Math.random() < (move.crit || (att.fig.type === 'speed' ? 0.1 : 0.06)) + (att.passive === 'crit' ? 0.12 : 0);
      let dmg = per * 1.35 * att.st.lf * Math.pow(att.st.atk / def.st.def, 0.6) * typeM * atkMul * defMul * U.rand(0.92, 1.08);
      if (crit) dmg *= 1.5;
      if (att.passive === 'berserk' && att.hp < att.maxHp * 0.35) dmg *= 1.3;
      if (def.passive === 'armor') dmg *= 0.88;
      let perfect = false, blocked = false, broke = false;
      if (def.blocking) {
        if (def.blockT <= PERFECT_WINDOW || def.perfectChain) {
          perfect = true;
          def.perfectChain = true;
          dmg *= a.isSuper ? 0.2 : 0;
          crit = false;
          def.superM = Math.min(100, def.superM + 12);
          if (a.melee && hitIdx === a.hits.length - 1 && !a.isSuper) this.applyStatus(att, 'stun', 0.7, null, 'counter');
        } else {
          blocked = true;
          dmg *= 0.3;
          crit = false;
          def.guard -= per * 1.5;
          if (def.guard <= 0) {
            def.guard = 0;
            broke = true;
            blocked = false;
            dmg /= 0.3;
            def.blocking = false;
            this.applyStatus(def, 'stun', 1.2, null, 'guardbreak');
          }
        }
      }
      dmg = Math.round(dmg);
      const dealt = this.damage(def, dmg);
      if (att.passive === 'vampire' && dmg > 0 && att.alive) att.hp = Math.min(att.maxHp, att.hp + dmg * 0.1);
      if (def.passive === 'thorns' && a.melee && dmg > 0 && !perfect && att.alive) {
        const back = Math.max(1, Math.round(dmg * 0.15));
        this.damage(att, back);
        this.emit('thorns', { f: att, amount: back });
      }
      att.superM = Math.min(100, att.superM + ((dmg / def.maxHp) * 75 + (perfect ? 0 : 1.5)) * (att.passive === 'leader' ? 1.2 : 1));
      def.superM = Math.min(100, def.superM + (dmg / def.maxHp) * 45);
      def.hurtT = perfect ? 0 : 0.28;
      def.flashT = perfect ? 0 : 0.12;
      this.emit('hit', { att, def, dmg, dealt, perfect, blocked, broke, crit, typeM, move, a, hitIdx, last: hitIdx === a.hits.length - 1 });
      if (hitIdx === 0 && def.alive) {
        for (const e of move.eff) {
          if (e.self) continue;
          const p = perfect ? 0 : blocked ? e.p * 0.4 : e.p;
          if (Math.random() < p) this.applyStatus(def, e.s, e.d * (att.passive === 'burnplus' ? 1.4 : 1), e.v, 'hit');
        }
      }
      if (hitIdx === a.hits.length - 1) {
        for (const e of move.eff) if (e.self) this.applyStatus(att, e.s, e.d, e.v, 'self');
      }
    }

    applySelf(f, move) {
      if (move.heal) {
        const h = Math.round(f.maxHp * move.heal);
        f.hp = Math.min(f.maxHp, f.hp + h);
        this.emit('heal', { f, amount: h });
      }
      if (move.shield) this.applyStatus(f, 'shield', 10, Math.round(f.maxHp * move.shield), 'self');
      for (const e of move.eff) if (e.self) this.applyStatus(f, e.s, e.d, e.v, 'self');
    }

    updateAction(f, dt) {
      const a = f.action;
      a.t += dt;
      if (!a.launched && a.t >= a.windup) {
        a.launched = true;
        this.emit('launch', { f, move: a.move, a, target: this.opp(f.side) });
        if (a.kind === 'self') this.applySelf(f, a.move);
      }
      while (f.action === a && a.hi < a.hits.length && a.t >= a.hits[a.hi]) {
        if (a.kind !== 'self') this.resolveHit(f, a, a.hi);
        a.hi++;
      }
      if (f.action === a && a.t >= a.end) f.action = null;
    }

    tickStatus(f, dt, active) {
      for (const k of Object.keys(f.status)) {
        const st = f.status[k];
        st.t -= dt;
        if (st.t <= 0) delete f.status[k];
      }
      if (!active || !f.alive) return;
      if (f.status.burn) this.damage(f, f.maxHp * 0.025 * dt);
      if (f.status.poison) this.damage(f, f.maxHp * 0.035 * dt);
      if (f.status.regen && f.alive) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.02 * dt);
      if (f.passive === 'regen' && f.alive) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.01 * dt);
    }

    update(dt) {
      if (this.winner != null) {
        for (const side of this.sides) for (const f of side.fighters) {
          if (f.action) this.updateAction(f, dt);
          f.koT += dt;
        }
        return;
      }
      this.time += dt;
      for (const side of this.sides) {
        side.swapCd = Math.max(0, side.swapCd - dt);
        side.swapAnim = Math.max(0, side.swapAnim - dt);
        const act = side.fighters[side.active];
        for (const f of side.fighters) {
          f.koT += dt;
          if (!f.alive) continue;
          const isAct = f === act;
          this.tickStatus(f, dt, isAct);
          if (!f.alive) continue;
          f.blockCd = Math.max(0, f.blockCd - dt);
          if (isAct && f.stun > 0) {
            f.stun -= dt;
            continue;
          }
          let rate = 0.85 + (f.st.spd - 10) * 0.015;
          if (!isAct) rate *= 0.6;
          if (f.status.slow) rate *= 0.55;
          if (f.status.haste) rate *= 1.5;
          if (f.passive === 'swift') rate *= 1.1;
          if (f.blocking) rate *= 0.5;
          for (const mv of f.moves) {
            if (mv.c < 1) {
              mv.c = Math.min(1, mv.c + (dt * rate) / mv.m.charge);
              if (mv.c >= 1 && isAct) this.emit('ready', { f, mv });
            }
          }
          if (isAct) {
            const before = f.superM;
            f.superM = Math.min(100, f.superM + dt * 1.2);
            if (before < 100 && f.superM >= 100) this.emit('superReady', { f });
            if (f.blocking) {
              f.blockT += dt;
              if (f.blockT > 0.6) f.perfectChain = false;
            } else {
              f.perfectChain = false;
              f.guard = Math.min(100, f.guard + dt * 22);
            }
          }
        }
        if (act.alive && act.action) this.updateAction(act, dt);
      }
      // kiesett figura cseréje
      for (const side of this.sides) {
        const act = side.fighters[side.active];
        if (!act.alive) {
          side.koWait -= dt;
          if (side.koWait <= 0) {
            const order = [1, 2].map((k) => (side.active + k) % side.fighters.length);
            const next = side.fighters.findIndex((f, i) => f.alive && order.includes(i));
            if (next >= 0) this.doSwap(side, next, false);
          }
        }
      }
      // győztes
      for (const side of this.sides) {
        if (side.fighters.every((f) => !f.alive)) {
          this.winner = 1 - side.idx;
          this.emit('end', { winner: this.winner });
          return;
        }
      }
      if (!this.aiPaused) {
        for (let s = 0; s < 2; s++) if (this.ai[s]) this.ai[s].update(dt, this, s);
      }
    }
  }

  // ======================= MESTERSÉGES INTELLIGENCIA =======================
  class AI {
    constructor(skill) {
      this.k = U.clamp(skill, 0, 1);
      this.think = 0.8;
      this.plan = null;
      this.react = 0.55 - this.k * 0.38;
      this.blockChance = 0.1 + this.k * 0.55;
      this.perfectChance = this.k * 0.4;
      this.aggr = 0.45 + this.k * 0.5;
      this.interval = 0.5 - this.k * 0.28;
    }
    update(dt, c, s) {
      const me = c.act(s);
      const op = c.opp(s);
      if (!me || !me.alive) return;
      const side = c.sides[s];
      const oa = op && op.alive ? op.action : null;
      // blokk tervezése a bejövő támadásra
      if (oa && oa.kind !== 'self' && oa.hi < oa.hits.length) {
        if (this.plan == null || this.plan.a !== oa) {
          const block = Math.random() < this.blockChance * (oa.isSuper ? 1.25 : 1);
          const perfect = Math.random() < this.perfectChance;
          const first = oa.hits[0];
          this.plan = {
            a: oa, block,
            startAt: perfect ? first - U.rand(0.08, 0.22) : Math.min(first - 0.05, oa.t + this.react + U.rand(0, 0.2)),
            until: oa.hits[oa.hits.length - 1] + 0.05,
          };
        }
        const p = this.plan;
        if (p.block) {
          if (oa.t >= p.startAt && oa.t <= p.until) c.setBlock(s, true);
          if (oa.hits[0] - oa.t < 0.9) return;
        }
      } else if (me.blocking) {
        c.setBlock(s, false);
        this.plan = null;
      }
      this.think -= dt;
      if (this.think > 0 || !c.canAct(me)) return;
      this.think = this.interval * U.rand(0.7, 1.4);
      // csere, ha nagy a baj
      if (me.hp / me.maxHp < 0.28 && side.swapCd <= 0 && Math.random() < this.k * 0.35) {
        const bench = side.fighters.map((f, i) => i).filter((i) => i !== side.active);
        const slot = bench.findIndex((i) => side.fighters[i].alive && side.fighters[i].hp / side.fighters[i].maxHp > 0.5);
        if (slot >= 0 && c.swap(s, slot)) return;
      }
      if (me.superM >= 100 && Math.random() < 0.3 + this.k * 0.5) {
        c.useMove(s, 'super');
        return;
      }
      const ready = me.moves.map((mv, i) => ({ mv, i })).filter((o) => o.mv.c >= 1);
      if (!ready.length) return;
      const heal = ready.find((o) => o.mv.m.heal);
      if (heal && me.hp / me.maxHp < 0.5) {
        c.useMove(s, heal.i);
        return;
      }
      const selfs = ready.filter((o) => o.mv.m.kind === 'self' && !o.mv.m.heal);
      if (selfs.length && Math.random() < 0.6) {
        c.useMove(s, selfs[0].i);
        return;
      }
      const atks = ready.filter((o) => o.mv.m.kind !== 'self').sort((x, y) => y.mv.m.power - x.mv.m.power);
      if (atks.length && Math.random() < this.aggr) {
        // néha kivár egy erősebb támadásra
        const pick = Math.random() < 0.75 ? atks[0] : U.pick(atks);
        c.useMove(s, pick.i);
      }
    }
  }

  TT.Combat = Combat;
  TT.AI = AI;

  // ======================= JELENET =======================
  const SLOTS = [
    [{ x: 300, y: 400, s: 1.55 }, { x: 150, y: 355, s: 0.9 }, { x: 62, y: 372, s: 0.9 }],
    [{ x: 660, y: 400, s: 1.55 }, { x: 810, y: 355, s: 0.9 }, { x: 898, y: 372, s: 0.9 }],
  ];
  const STATUS_LBL = { burn: 'ÉG', poison: 'MÉ', slow: 'S-', stun: 'KÁ', weak: 'E-', mark: 'CÉ', shield: 'PA', atkUp: 'E+', defUp: 'V+', regen: 'HP+', haste: 'S+' };

  const scene = {
    enter(p) {
      this.p = p;
      const en = p.enemy;
      this.en = en;
      this.bg = en.bg || 'dome';
      const pteam = (p.playerTeam || TT.save.team).filter((id) => TT.save.owned[id]).map((id) => ({ id, lvl: TT.save.owned[id].lvl, stars: TT.starsOf(id) }));
      this.c = new Combat(pteam, en.team, { ai: en.ai }, (type, d) => this.onEvent(type, d));
      this.t = 0;
      this.state = 'intro';
      this.projectiles = [];
      this.beams = [];
      this.banners = [];
      this.waves = [];
      this.auras = [];
      this.tip = null;
      this.tipsShown = {};
      this.results = null;
      this.menu = new TT.ui.Menu();
      this.flashT = 0;
      this.superCine = null;
      this.blockHeld = false;
      for (let s = 0; s < 2; s++) this.layout(s, true);
      TT.audio.music(en.music || 'battle');
      if (en.intro && en.intro.length) {
        TT.ui.say(en.intro, () => this.startVs());
      } else this.startVs();
      if (p.tutorial) this.c.aiPaused = true;
      this.speed = TT.settings.battleSpeed || 1;
      this.auto = false;
      if (TT.settings.autoBattle && !p.tutorial) this.setAuto(true);
    },
    startVs() {
      this.state = 'vs';
      this.t = 0;
      TT.audio.sfx('crowd');
    },

    // célpozíciók a slotokhoz
    layout(s, instant) {
      const side = this.c.sides[s];
      const order = [side.active].concat(side.fighters.map((f, i) => i).filter((i) => i !== side.active));
      order.forEach((fi, k) => {
        const f = side.fighters[fi];
        const sl = SLOTS[s][k];
        f.tx = sl.x;
        f.ty = sl.y;
        f.ts = sl.s;
        if (instant) {
          f.x = sl.x;
          f.y = sl.y;
          f.s = sl.s;
        }
      });
    },

    onEvent(type, d) {
      const c = this.c;
      switch (type) {
        case 'windup': {
          const f = d.f;
          if (d.a.isSuper) {
            TT.audio.sfx('super');
            this.superCine = { f, t: 0 };
            TT.slowmo(0.35, 0.5);
          } else TT.audio.sfx('windup');
          this.banners.push({ f, text: d.move.name, t: 0, dur: d.a.windup + 0.5, color: d.a.isSuper ? '#ffd23f' : '#ffffff', sup: d.a.isSuper });
          if (this.p.tutorial && f.side === 1 && !this.tipsShown.block) {
            this.tipsShown.block = true;
            this.showTip('VÉDEKEZZ! Tartsd lenyomva a BLOKK gombot (Szóköz). Ha a kör zöld, amikor becsapódik: TÖKÉLETES blokk!', 7);
            TT.slowmo(0.3, 1.2);
          }
          break;
        }
        case 'launch': {
          const { f, move, a } = d;
          const t = d.target;
          const dir = f.side === 0 ? 1 : -1;
          if (move.kind === 'shot' || (move.kind === 'multi' && !move.melee)) {
            for (let i = 0; i < (move.hits || 1); i++) {
              this.projectiles.push({
                fx: move.fx, color: move.color, delay: i * 0.11, t: 0, dur: 0.3,
                x0: f.x + dir * 40, y0: f.y - 80 * f.s / 1.55, x1: t.x - dir * 10, y1: t.y - 70 + U.rand(-14, 14), big: a.isSuper,
              });
            }
            TT.audio.sfx(move.fx === 'magic' || move.fx === 'hex' ? 'magic' : 'whoosh');
          } else if (move.kind === 'beam') {
            const dur = (a.hits[a.hits.length - 1] - a.windup) + 0.22;
            this.beams.push({ f, target: t, color: move.color, fx: move.fx, t: 0, dur, big: a.isSuper });
            TT.audio.sfx(move.fx === 'sonic' ? 'zap' : move.fx === 'fire' ? 'burn' : 'zap');
          } else if (move.kind === 'slam') {
            TT.audio.sfx('whoosh');
          } else if (move.kind === 'self') {
            this.auras.push({ f, color: move.color, t: 0, dur: 0.8 });
            TT.audio.sfx(move.heal ? 'heal' : move.shield ? 'shield' : 'buff');
          } else {
            TT.audio.sfx('whoosh');
          }
          break;
        }
        case 'hit': {
          const { def, dmg, perfect, blocked, broke, crit, typeM, move, a, att } = d;
          const hx = def.x, hy = def.y - 70;
          if (perfect) {
            TT.audio.sfx('perfect');
            TT.fx.text(hx, hy - 50, 'TÖKÉLETES!', { color: '#7bff6b', tsize: 30 });
            TT.fx.ring(hx, hy, { color: '#7bff6b', size: 20, size2: 110, life: 0.45, lw: 6 });
            TT.fx.burst(hx, hy, 14, { colors: ['#7bff6b', '#ffffff'], shape: 'star', speed: 320, size: 8, life: 0.6 });
            TT.slowmo(0.25, 0.25);
            if (def.side === 0) TT.save.stats.perfects++;
            if (this.p.tutorial && !this.tipsShown.perfect) {
              this.tipsShown.perfect = true;
              this.showTip('Tökéletes blokk! Nulla sebzés, és a közelharcos támadó megszédül.', 4);
            }
          } else if (blocked) {
            TT.audio.sfx('block');
            TT.fx.text(hx, hy - 40, 'BLOKK ' + dmg, { color: '#b8c2cc', tsize: 22 });
            TT.fx.burst(hx - (def.side === 0 ? -1 : 1) * 30, hy, 8, { color: '#d8e0ff', shape: 'spark', speed: 220, size: 5, life: 0.3 });
          } else {
            const big = dmg > def.maxHp * 0.12 || crit || a.isSuper;
            TT.audio.sfx(crit ? 'crit' : big ? 'hit2' : 'hit');
            TT.fx.text(hx + U.rand(-16, 16), hy - 40, String(dmg), { color: crit ? '#ffd23f' : '#ffffff', tsize: crit ? 38 : big ? 32 : 26 });
            if (crit) TT.fx.text(hx, hy - 80, 'KRITIKUS!', { color: '#ffd23f', tsize: 20, vy: -80 });
            if (typeM > 1 && d.hitIdx === 0) TT.fx.text(hx, hy - 105, 'Hatásos!', { color: '#ff8c42', tsize: 18, vy: -60 });
            if (typeM < 1 && d.hitIdx === 0) TT.fx.text(hx, hy - 105, 'Nem túl hatásos…', { color: '#b8c2cc', tsize: 16, vy: -60 });
            this.impact(hx, hy, move, big);
            TT.shake(big ? 9 : 4, big ? 0.3 : 0.15);
            if (broke) {
              TT.audio.sfx('guardbreak');
              TT.fx.text(hx, hy - 120, 'BLOKK TÖRVE!', { color: '#ff4f4f', tsize: 26 });
            }
            if (a.isSuper && d.last) {
              this.flashT = 0.25;
              TT.shake(16, 0.5);
            }
          }
          if (att.side === 0 && dmg > 0 && !this.tipsShown.super && att.superM >= 100 && this.p.tutorial) {
            // a szuper tipp a superReady eseménynél jön
          }
          break;
        }
        case 'dodge':
          TT.audio.sfx('whoosh');
          TT.fx.text(d.def.x, d.def.y - 130, 'KITÉRÉS!', { color: '#9be7ff', tsize: 24 });
          break;
        case 'thorns':
          TT.fx.text(d.f.x, d.f.y - 120, 'Tüske ' + d.amount, { color: '#c8a165', tsize: 18 });
          break;
        case 'heal':
          TT.fx.text(d.f.x, d.f.y - 120, '+' + d.amount, { color: '#7bff6b', tsize: 28 });
          TT.fx.burst(d.f.x, d.f.y - 60, 16, { color: '#9bff9b', shape: 'star', speed: 120, size: 6, life: 0.9, g: -120 });
          break;
        case 'status': {
          const st = TT.STATUS[d.s];
          if (d.src === 'counter') {
            TT.fx.text(d.f.x, d.f.y - 150, 'SZÉDÜL!', { color: '#ffe066', tsize: 22 });
            TT.audio.sfx('stun');
          } else if (d.src !== 'guardbreak') {
            TT.fx.text(d.f.x, d.f.y - 160, st.name + (st.good ? '!' : ''), { color: st.color, tsize: 20, vy: -70 });
            if (d.s === 'burn' || d.s === 'poison') TT.audio.sfx('burn');
            else if (d.s === 'slow') TT.audio.sfx('freeze');
            else if (d.s === 'stun') TT.audio.sfx('stun');
            else if (!st.good) TT.audio.sfx('debuff');
          }
          break;
        }
        case 'ko':
          TT.audio.sfx('ko');
          TT.fx.text(d.f.x, d.f.y - 140, 'K.O.!', { color: '#ff4f4f', tsize: 44, vy: -60 });
          TT.fx.burst(d.f.x, d.f.y - 60, 24, { colors: ['#ffd23f', '#ff6b35', '#ffffff'], shape: 'star', speed: 380, size: 9, life: 0.9 });
          TT.slowmo(0.3, 0.6);
          TT.shake(12, 0.4);
          if (d.f.side === 0) {
            // nothing
          } else TT.save.stats.kos++;
          break;
        case 'swap':
          TT.audio.sfx('swap');
          this.layout(d.side);
          TT.fx.burst(d.to.tx, d.to.ty - 50, 12, { color: '#ffffff', shape: 'circle', speed: 160, size: 6, life: 0.4 });
          break;
        case 'ready':
          if (d.f.side === 0) TT.audio.sfx('ready');
          break;
        case 'superReady':
          if (d.f.side === 0) {
            TT.audio.sfx('levelup');
            if (!this.tipsShown.super && (this.p.tutorial || TT.save.stats.wins < 2)) {
              this.tipsShown.super = true;
              this.showTip('A SZUPER mérő megtelt! Nyomd meg a SZUPER gombot (R / 4) egy hatalmas támadásért!', 5);
            }
          }
          break;
        case 'end':
          this.state = 'finish';
          this.t = 0;
          this.tip = null;
          this.banners = [];
          TT.slowmo(0.3, 1.0);
          TT.audio.music(d.winner === 0 ? 'victory' : 'defeat');
          if (d.winner === 0) {
            for (let i = 0; i < 60; i++) {
              TT.fx.spawn(U.rand(0, TT.W), U.rand(-60, -10), {
                vx: U.rand(-40, 40), vy: U.rand(80, 220), g: 60, drag: 0.99, life: 3.5, shape: 'square', size: U.rand(6, 11),
                color: U.pick(['#ffd23f', '#ff4f4f', '#3fa7ff', '#7bd65b', '#c06bff', '#ffffff']), layer: 1,
              });
            }
          }
          break;
        default:
          break;
      }
    },

    impact(x, y, move, big) {
      const n = big ? 18 : 10;
      const c = move.color || '#ffffff';
      TT.fx.burst(x, y, n, { colors: [c, '#ffffff', U.shade(c, -0.2)], shape: 'spark', speed: big ? 420 : 300, size: big ? 7 : 5, life: 0.35 });
      TT.fx.ring(x, y, { color: c, size: 8, size2: big ? 90 : 55, life: 0.3, lw: big ? 7 : 4 });
      if (move.fx === 'fire' || move.fx === 'bomb' || move.fx === 'rocket') {
        TT.fx.burst(x, y, 8, { colors: ['#ff6b35', '#ffd23f'], shape: 'smoke', speed: 90, size: 14, life: 0.6, g: -60 });
      } else if (move.fx === 'rock' || move.fx === 'brick' || move.fx === 'stamp' || move.fx === 'box') {
        TT.fx.burst(x, y + 50, 10, { colors: ['#9aa0a8', '#c8a165'], shape: 'square', speed: 260, size: 8, life: 0.7, g: 600, angle: -Math.PI / 2, spread: 1.1 });
      } else if (move.fx === 'wave' || move.fx === 'blob' || move.fx === 'bubble') {
        TT.fx.burst(x, y, 10, { colors: [c, '#ffffff'], shape: 'circle', speed: 240, size: 6, life: 0.5, g: 500 });
      } else if (move.fx === 'lightning' || move.fx === 'laser' || move.fx === 'sonic') {
        TT.fx.burst(x, y, 10, { colors: ['#ffffff', c], shape: 'spark', speed: 500, size: 4, life: 0.25 });
      } else if (move.fx === 'note') {
        TT.fx.burst(x, y, 5, { color: c, shape: 'note', speed: 120, size: 10, life: 0.8, g: -100 });
      } else if (move.fx === 'heart') {
        TT.fx.burst(x, y, 6, { color: '#ff6b8a', shape: 'star', speed: 140, size: 8, life: 0.7 });
      }
    },

    showTip(text, dur) {
      this.tip = { text, t: 0, dur: dur || 5 };
    },

    // ---------- Bemenet ----------
    controlsLayout() {
      const y = 450, h = 80;
      const f = this.c.act(0);
      const cards = f.moves.map((mv, i) => ({ x: 14 + i * 170, y, w: 162, h, i, mv }));
      return {
        cards,
        sup: { x: 528, y, w: 140, h },
        block: { x: 818, y, w: 128, h },
        bench: [0, 1].map((k) => ({ x: 14 + k * 128, y: this.benchY(0), w: 122, h: 44, k })),
        pause: { x: TT.W / 2 - 26, y: 8, w: 52, h: 40 },
        speed: { x: TT.W / 2 - 112, y: 8, w: 76, h: 40 },
        auto: { x: TT.W / 2 + 36, y: 8, w: 76, h: 40 },
      };
    },

    benchY(s) {
      const f = this.c.act(s);
      return 96 + (f && (Object.keys(f.status).length || f.stun > 0) ? 28 : 0);
    },

    handleInput() {
      const I = TT.input;
      const c = this.c;
      const L = this.controlsLayout();
      if (I.hit('menu') || I.tapIn(L.pause.x, L.pause.y, L.pause.w, L.pause.h)) {
        this.pause();
        return;
      }
      if (!this.p.tutorial && (I.pressed('KeyT') || I.tapIn(L.auto.x, L.auto.y, L.auto.w, L.auto.h))) this.setAuto(!this.auto);
      if (I.pressed('KeyG') || I.tapIn(L.speed.x, L.speed.y, L.speed.w, L.speed.h)) {
        this.speed = this.speed > 1 ? 1 : 1.6;
        TT.settings.battleSpeed = this.speed;
        TT.store.writeSettings();
        TT.audio.sfx('select');
      }
      const used = (slot) => {
        if (c.useMove(0, slot)) {
          if (this.p.tutorial) this.c.aiPaused = false;
          return true;
        }
        TT.audio.sfx('error');
        return false;
      };
      if (I.hit('b1')) used(0);
      if (I.hit('b2')) used(1);
      if (I.hit('b3')) used(2);
      if (I.hit('super')) used('super');
      for (const card of L.cards) if (I.tapIn(card.x, card.y, card.w, card.h)) used(card.i);
      if (I.tapIn(L.sup.x, L.sup.y, L.sup.w, L.sup.h)) used('super');
      // csere
      const doSwap = (k) => {
        if (!c.swap(0, k)) TT.audio.sfx('error');
      };
      if (I.hit('swapL')) doSwap(0);
      if (I.hit('swapR')) doSwap(1);
      for (const b of L.bench) if (I.tapIn(b.x, b.y, b.w, b.h)) doSwap(b.k);
      // blokk (tartás)
      const hold = I.act('block') || I.holdIn(L.block.x, L.block.y, L.block.w, L.block.h);
      if (this.auto && !hold) {
        this.blockHeld = false;
        return;
      }
      if (hold && !this.blockHeld) c.setBlock(0, true);
      if (hold && !c.act(0).blocking) c.setBlock(0, true);
      if (!hold && this.blockHeld) c.setBlock(0, false);
      if (!hold && c.act(0).blocking) c.setBlock(0, false);
      this.blockHeld = hold;
    },

    setAuto(on) {
      this.auto = on;
      this.c.ai[0] = on ? new AI(0.85) : null;
      if (!on) this.c.setBlock(0, false);
      TT.settings.autoBattle = on;
      TT.store.writeSettings();
      TT.audio.sfx('select');
    },

    pause() {
      TT.audio.sfx('select');
      TT.ui.choose({
        title: 'Szünet',
        options: [{ label: 'Folytatás', value: 'go' }, { label: this.p.noForfeit ? 'Feladás (nem lehet)' : 'Feladás', value: 'quit', color: '#e84545', disabled: !!this.p.noForfeit }],
      }, (v) => {
        if (v === 'quit') {
          this.c.winner = 1;
          this.onEvent('end', { winner: 1 });
          this.forfeit = true;
        }
      });
    },

    // ---------- Frissítés ----------
    update(dt) {
      if (this.state === 'fight' || this.state === 'finish') dt *= this.speed;
      this.t += dt;
      const c = this.c;
      const paused = TT.ui.overlayActive();
      if (this.state === 'vs' && this.t > 1.7) {
        this.state = 'count';
        this.t = 0;
        TT.audio.sfx('countdown');
      } else if (this.state === 'count') {
        if (this.t > 1.2 && !c.started) {
          c.started = true;
          this.state = 'fight';
          TT.audio.sfx('go');
          if (this.p.tutorial) this.showTip('TÁMADJ! A kártyák feltöltődnek — koppints rájuk, vagy nyomd az 1, 2, 3 gombot!', 6);
        }
      } else if (this.state === 'fight') {
        if (!paused) {
          this.handleInput();
          c.update(dt);
          if (this.p.tutorial && c.time > 14 && !this.tipsShown.swap) {
            this.tipsShown.swap = true;
            this.showTip('Csere: Q / E, vagy koppints a bal felső kis portrékra. A pihenő figurák támadásai is töltődnek!', 6);
          }
        }
      } else if (this.state === 'finish') {
        c.update(dt);
        if (this.t > 2.4) this.buildResults();
      } else if (this.state === 'results') {
        this.updateResults(dt);
      }

      // animációk
      for (const side of c.sides) for (const f of side.fighters) {
        const k = 1 - Math.pow(0.0005, dt);
        f.x = U.lerp(f.x, f.tx, k);
        f.y = U.lerp(f.y, f.ty, k);
        f.s = U.lerp(f.s, f.ts, k);
        f.hurtT = Math.max(0, f.hurtT - dt);
        f.flashT = Math.max(0, f.flashT - dt);
        f.ghost = f.ghost > f.hp ? Math.max(f.hp, f.ghost - f.maxHp * dt * 0.6) : f.hp;
      }
      for (const p of this.projectiles) {
        if (p.delay > 0) p.delay -= dt;
        else p.t += dt;
      }
      this.projectiles = this.projectiles.filter((p) => p.t < p.dur);
      for (const b of this.beams) b.t += dt;
      this.beams = this.beams.filter((b) => b.t < b.dur);
      for (const b of this.banners) b.t += dt;
      this.banners = this.banners.filter((b) => b.t < b.dur);
      for (const a of this.auras) a.t += dt;
      this.auras = this.auras.filter((a) => a.t < a.dur);
      if (this.tip) {
        this.tip.t += dt;
        if (this.tip.t > this.tip.dur) this.tip = null;
      }
      if (this.superCine) {
        this.superCine.t += dt;
        if (this.superCine.t > 0.9) this.superCine = null;
      }
      this.flashT = Math.max(0, this.flashT - dt);
    },

    // ---------- Eredmények ----------
    buildResults() {
      const c = this.c;
      const won = c.winner === 0;
      const s = TT.save;
      const en = this.en;
      const avgLvl = en.team.reduce((a, t) => a + t.lvl, 0) / en.team.length;
      const xpBase = Math.round(30 + avgLvl * 18);
      const rows = c.sides[0].fighters.map((f) => {
        const xp = won ? (f.alive ? xpBase : Math.round(xpBase * 0.65)) : Math.round(xpBase * 0.3);
        const o = s.owned[f.id];
        const before = { lvl: o.lvl, xp: o.xp };
        const ups = TT.addXp(f.id, xp);
        return { id: f.id, xp, before, after: { lvl: o.lvl, xp: o.xp }, ups };
      });
      let coins = 0;
      const figs = [];
      if (won) {
        coins = en.coins || Math.round(40 + avgLvl * 12);
        s.coins += coins;
        s.stats.wins++;
        for (const id of this.p.rewardFigs || []) figs.push(Object.assign({ id }, TT.grantFigure(id)));
        const syn = c.sides[0].synergy;
        if (syn && syn.n >= 3) s.flags.synWin = true;
      } else s.stats.losses++;
      TT.store.write();
      TT.checkAch();
      this.results = { won, coins, rows, figs, t: 0 };
      this.state = 'results';
      this.t = 0;
      if (rows.some((r) => r.ups > 0)) setTimeout(() => TT.audio.sfx('levelup'), 700);
      if (figs.length) setTimeout(() => TT.audio.sfx('reveal'), 1100);
      const items = [];
      const bw = 220;
      if (won) {
        items.push({ id: 'cont', x: TT.W / 2 - bw / 2, y: 452, w: bw, h: 56, label: 'Tovább', color: '#2ecc71', onClick: () => this.finish(true) });
      } else {
        items.push({ id: 'retry', x: TT.W / 2 - bw - 10, y: 452, w: bw, h: 56, label: 'Újra', color: '#ff6b35', onClick: () => this.retry() });
        items.push({ id: 'back', x: TT.W / 2 + 10, y: 452, w: bw, h: 56, label: 'Vissza', color: '#6c5ce7', onClick: () => this.finish(false) });
      }
      this.menu.set(items);
    },
    updateResults(dt) {
      this.results.t += dt;
      if (this.results.t > 0.6) this.menu.update();
    },
    retry() {
      TT.go('battle', this.p);
    },
    finish(won) {
      if (this.p.after) this.p.after(won, this);
      else TT.go('world');
    },

    // ======================= RAJZOLÁS =======================
    draw(ctx) {
      const c = this.c;
      const sh = TT.shakeOffset();
      ctx.save();
      ctx.translate(sh.x, sh.y);
      TT.backdrop.draw(ctx, this.bg, TT.time);

      // szuper sötétítés
      if (this.superCine) {
        const a = Math.sin(Math.min(1, this.superCine.t / 0.9) * Math.PI) * 0.55;
        ctx.fillStyle = `rgba(10,5,25,${a})`;
        ctx.fillRect(-20, -20, TT.W + 40, TT.H + 40);
      }

      // figurák: előbb a pihenők, aztán az aktívak
      const all = [];
      for (const side of c.sides) side.fighters.forEach((f, i) => all.push({ f, active: i === side.active }));
      all.sort((a, b) => (a.active ? 1 : 0) - (b.active ? 1 : 0) || a.f.y - b.f.y);
      for (const o of all) this.drawFighter(ctx, o.f, o.active);

      // auras
      for (const a of this.auras) {
        const k = a.t / a.dur;
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(a.f.x, a.f.y - 4, 50 + k * 30, 14 + k * 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (Math.random() < 0.5) TT.fx.spawn(a.f.x + U.rand(-40, 40), a.f.y - U.rand(0, 40), { vy: -160, color: a.color, shape: 'star', size: 5, life: 0.6 });
      }
      for (const b of this.beams) this.drawBeam(ctx, b);
      for (const p of this.projectiles) if (p.delay <= 0) this.drawProjectile(ctx, p);
      TT.fx.draw(ctx, 0);
      this.drawTelegraph(ctx);
      for (const b of this.banners) this.drawBanner(ctx, b);
      ctx.restore();

      if (this.flashT > 0) {
        ctx.fillStyle = `rgba(255,255,255,${this.flashT * 2.5})`;
        ctx.fillRect(0, 0, TT.W, TT.H);
      }

      this.drawHud(ctx);
      if (this.state === 'fight' || this.state === 'count' || this.state === 'vs') this.drawControls(ctx);
      if (this.tip) this.drawTip(ctx);
      if (this.state === 'vs') this.drawVs(ctx);
      if (this.state === 'count') {
        const k = this.t / 1.2;
        const txt = k < 0.55 ? 'KÉSZ?' : 'HARC!';
        const kk = k < 0.55 ? k / 0.55 : (k - 0.55) / 0.45;
        const sc = 0.6 + U.ease.outBack(Math.min(1, kk * 2)) * 0.5;
        ctx.save();
        ctx.translate(TT.W / 2, 230);
        ctx.scale(sc, sc);
        D.text(ctx, txt, 0, 0, { size: 84, align: 'center', color: k < 0.55 ? '#ffffff' : '#ffd23f', lw: 12 });
        ctx.restore();
      }
      if (this.state === 'finish') this.drawFinish(ctx);
      TT.fx.draw(ctx, 1);
      if (this.state === 'results') this.drawResults(ctx);
    },

    drawFighter(ctx, f, active) {
      const c = this.c;
      const facing = f.side === 0 ? 1 : -1;
      let x = f.x, y = f.y;
      let pose = 'idle', lean = 0, alpha = 1, rot = 0;
      const a = f.action;
      if (!f.alive) {
        const k = U.clamp(f.koT / 0.6, 0, 1);
        pose = 'ko';
        rot = -facing * U.ease.outBounce(k) * 1.35;
        alpha = active ? 1 - U.clamp((f.koT - 0.7) / 0.5, 0, 1) * 0.6 : 0.45;
      } else if (a) {
        const m = a.move;
        const opp = c.opp(f.side);
        if (a.t < a.windup) {
          pose = m.kind === 'melee' || m.melee || m.kind === 'slam' ? 'windup' : 'cast';
          lean = -0.05;
          if (a.isSuper) {
            TT.fx.spawn(x + U.rand(-30, 30), y - U.rand(20, 120), { vy: -100, color: '#ffd23f', shape: 'star', size: 6, life: 0.5 });
          }
        } else {
          pose = m.kind === 'self' || m.kind === 'beam' || (m.kind === 'shot' || (m.kind === 'multi' && !m.melee)) ? 'cast' : 'attack';
          if (a.melee && opp) {
            const last = a.hits[a.hits.length - 1];
            let k;
            if (a.t < a.windup + 0.12) k = (a.t - a.windup) / 0.12;
            else if (a.t < last + 0.06) k = 1;
            else k = 1 - (a.t - last - 0.06) / Math.max(0.01, a.end - last - 0.06);
            k = U.clamp(k, 0, 1);
            const dist = Math.abs(opp.x - f.x) - 110;
            x += facing * dist * U.ease.outCubic(k);
            if (a.hits.length > 1) lean += Math.sin(a.t * 30) * 0.1;
          }
          if (m.kind === 'slam') {
            const k = U.clamp((a.t - a.windup) / 0.2, 0, 1);
            y -= Math.sin(k * Math.PI) * 70;
            if (k >= 1 && !a._quake) {
              a._quake = true;
              TT.shake(10, 0.35);
              const t = c.opp(f.side);
              TT.fx.ring(f.x, f.y, { color: m.color, size: 20, size2: 140, life: 0.4, lw: 8 });
              if (t) TT.fx.burst(t.x, t.y, 12, { colors: [m.color, '#ffffff'], shape: 'square', speed: 260, size: 8, life: 0.6, g: 700, angle: -Math.PI / 2, spread: 1 });
            }
          }
        }
      } else if (f.stun > 0) pose = 'stun';
      else if (f.blocking) pose = 'block';
      else if (f.hurtT > 0) pose = 'hurt';
      else if (this.state === 'finish' || this.state === 'results') {
        if (c.winner === f.side && active) pose = 'cheer';
      }
      if (!active && f.alive) alpha = 0.92;

      ctx.save();
      ctx.globalAlpha = alpha;
      if (rot) {
        ctx.translate(x, y);
        ctx.rotate(rot * 0.2);
        ctx.translate(-x, -y);
      }
      TT.art.drawFigure(ctx, f.fig, x, y, f.s, {
        facing, pose, lean, flash: f.flashT > 0 ? 1 : 0, t: TT.time + f.idx,
        pedestal: true,
      });
      ctx.restore();
      if (pose === 'ko' && active && f.koT < 1.2) {
        // a figura lebukik a talapzatról — csillagok
        for (let i = 0; i < 3; i++) {
          const ang = TT.time * 4 + i * 2.1;
          D.star(ctx, x + Math.cos(ang) * 30, y - 40 + Math.sin(ang) * 8, 6, 2.5, 5);
          ctx.fillStyle = '#ffd23f';
          ctx.fill();
        }
      }
      // állapot jelzések a figurán
      if (f.alive && active) {
        if (f.stun > 0) {
          for (let i = 0; i < 3; i++) {
            const ang = TT.time * 5 + i * 2.1;
            D.star(ctx, x + Math.cos(ang) * 26, y - 165 * f.s / 1.55 + Math.sin(ang) * 7, 7, 3, 5);
            ctx.fillStyle = '#ffe066';
            ctx.fill();
            ctx.strokeStyle = '#1d1433';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
        if (f.status.shield) {
          ctx.save();
          ctx.globalAlpha = 0.35 + Math.sin(TT.time * 6) * 0.1;
          ctx.beginPath();
          ctx.ellipse(x, y - 75, 70, 95, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#9be7ff';
          ctx.fill();
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
          ctx.restore();
        }
        if (f.blocking) {
          ctx.save();
          const perfect = f.blockT <= PERFECT_WINDOW;
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(x + facing * 48, y - 75, 62, -Math.PI / 2.4, Math.PI / 2.4, facing < 0);
          ctx.lineWidth = 10;
          ctx.strokeStyle = perfect ? '#7bff6b' : '#9be7ff';
          ctx.stroke();
          ctx.restore();
        }
        if (f.status.burn && Math.random() < 0.4) TT.fx.spawn(x + U.rand(-25, 25), y - U.rand(20, 120), { vy: -90, color: '#ff8c42', color2: '#ffd23f', shape: 'circle', size: 6, life: 0.5 });
        if (f.status.poison && Math.random() < 0.3) TT.fx.spawn(x + U.rand(-25, 25), y - U.rand(20, 120), { vy: -60, color: '#7bd65b', shape: 'circle', size: 5, life: 0.6 });
        if (f.status.slow && Math.random() < 0.2) TT.fx.spawn(x + U.rand(-30, 30), y - U.rand(20, 130), { vy: 40, color: '#bfefff', shape: 'star', size: 4, life: 0.6 });
        if (f.status.atkUp && Math.random() < 0.15) TT.fx.spawn(x + U.rand(-30, 30), y - U.rand(0, 30), { vy: -150, color: '#ff8c42', shape: 'spark', size: 4, life: 0.5 });
        if (f.status.regen && Math.random() < 0.15) TT.fx.spawn(x + U.rand(-30, 30), y - U.rand(20, 120), { vy: -80, color: '#7bff6b', shape: 'star', size: 4, life: 0.6 });
      }
    },

    drawProjectile(ctx, p) {
      const k = U.clamp(p.t / p.dur, 0, 1);
      const x = U.lerp(p.x0, p.x1, k);
      const y = U.lerp(p.y0, p.y1, k) - Math.sin(k * Math.PI) * (p.fx === 'banana' || p.fx === 'pie' || p.fx === 'rock' || p.fx === 'brick' || p.fx === 'box' ? 60 : 12);
      const dir = Math.sign(p.x1 - p.x0) || 1;
      const sz = p.big ? 1.6 : 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sz, sz);
      const col = p.color;
      const spin = TT.time * 18;
      const OUT = '#1d1433';
      const blob = (r, c) => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = OUT;
        ctx.stroke();
      };
      // csóva
      if (Math.random() < 0.7) TT.fx.spawn(x, y, { color: col, size: 5 * sz, life: 0.25, shape: 'circle', alpha: 0.6 });
      switch (p.fx) {
        case 'bird':
          ctx.rotate(spin);
          ctx.beginPath();
          ctx.moveTo(-14, 6);
          ctx.quadraticCurveTo(0, -12, 14, 6);
          ctx.quadraticCurveTo(0, -2, -14, 6);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          break;
        case 'star':
        case 'shuriken':
          ctx.rotate(spin);
          D.star(ctx, 0, 0, 12, p.fx === 'shuriken' ? 4 : 5.5, p.fx === 'shuriken' ? 4 : 5);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          break;
        case 'arrow':
          ctx.scale(dir, 1);
          ctx.fillStyle = '#8b5a2b';
          ctx.fillRect(-18, -1.5, 26, 3);
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(6, -6);
          ctx.lineTo(6, 6);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-20, -4, 6, 8);
          break;
        case 'note':
          ctx.fillStyle = col;
          ctx.font = TT.font(30);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 4;
          ctx.strokeStyle = OUT;
          ctx.strokeText('♪', 0, 0);
          ctx.fillText('♪', 0, 0);
          break;
        case 'hex':
          ctx.rotate(spin * 0.5);
          ctx.beginPath();
          for (let i = 0; i <= 6; i++) ctx.lineTo(Math.cos(i * 1.047) * 12, Math.sin(i * 1.047) * 12);
          ctx.fillStyle = U.rgba(col, 0.75);
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
          break;
        case 'rock':
        case 'brick':
          ctx.rotate(spin * 0.4);
          ctx.beginPath();
          ctx.moveTo(-12, -6);
          ctx.lineTo(-4, -13);
          ctx.lineTo(10, -9);
          ctx.lineTo(13, 6);
          ctx.lineTo(0, 12);
          ctx.lineTo(-11, 7);
          ctx.closePath();
          ctx.fillStyle = p.fx === 'brick' ? '#b5523b' : col;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          break;
        case 'banana':
          ctx.rotate(spin * 0.6);
          ctx.beginPath();
          ctx.arc(0, -8, 14, 0.3, Math.PI - 0.3);
          ctx.arc(0, -14, 14, Math.PI - 0.5, 0.5, true);
          ctx.closePath();
          ctx.fillStyle = '#ffe066';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          break;
        case 'rocket':
          ctx.scale(dir, 1);
          D.rr(ctx, -14, -5, 24, 10, 5);
          ctx.fillStyle = '#d8dde6';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(10, -5);
          ctx.lineTo(17, 0);
          ctx.lineTo(10, 5);
          ctx.fillStyle = '#ff4f4f';
          ctx.fill();
          TT.fx.spawn(x - dir * 16, y, { color: '#ffb000', color2: '#ff4f4f', size: 7, life: 0.25, shape: 'circle' });
          break;
        case 'card':
          ctx.rotate(spin * 0.7);
          D.rr(ctx, -8, -11, 16, 22, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          D.star(ctx, 0, 0, 5, 2.4, 4);
          ctx.fillStyle = col;
          ctx.fill();
          break;
        case 'rabbit':
          blob(10, '#ffffff');
          ctx.beginPath();
          ctx.ellipse(-4, -14, 3, 8, -0.2, 0, Math.PI * 2);
          ctx.ellipse(4, -14, 3, 8, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ff6b8a';
          ctx.beginPath();
          ctx.arc(0, 2, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'heart':
          ctx.beginPath();
          ctx.moveTo(0, 10);
          ctx.bezierCurveTo(-16, -2, -8, -14, 0, -5);
          ctx.bezierCurveTo(8, -14, 16, -2, 0, 10);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          break;
        case 'pie':
          ctx.rotate(spin * 0.3);
          ctx.beginPath();
          ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#e0a060';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(0, -2, 12, 4, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          break;
        case 'box':
          ctx.rotate(spin * 0.25);
          D.rr(ctx, -13, -13, 26, 26, 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fillRect(-3, -13, 6, 26);
          break;
        case 'bubble':
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fillStyle = U.rgba(col, 0.45);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-4, -4, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          break;
        case 'tape':
          ctx.rotate(spin * 0.5);
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fillStyle = '#c8a165';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.stroke();
          break;
        case 'peanut':
          ctx.rotate(spin * 0.4);
          ctx.beginPath();
          ctx.ellipse(-4, 0, 6, 5, 0, 0, Math.PI * 2);
          ctx.ellipse(4, 0, 6, 5, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#fffbe6';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          break;
        case 'fish':
          ctx.scale(dir, 1);
          ctx.beginPath();
          ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(-18, -7);
          ctx.lineTo(-18, 7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case 'moth':
          ctx.beginPath();
          ctx.ellipse(-6, 0, 8, 12 * Math.abs(Math.sin(spin)), -0.4, 0, Math.PI * 2);
          ctx.ellipse(6, 0, 8, 12 * Math.abs(Math.sin(spin)), 0.4, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          break;
        case 'lasso':
          ctx.rotate(spin * 0.5);
          ctx.beginPath();
          ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = col;
          ctx.stroke();
          break;
        case 'pillow':
          ctx.rotate(spin * 0.3);
          D.rr(ctx, -14, -9, 28, 18, 7);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = OUT;
          ctx.stroke();
          break;
        case 'bomb':
          blob(10, '#2a2a36');
          ctx.fillStyle = '#ffb000';
          ctx.beginPath();
          ctx.arc(6, -10, 3 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'smoke':
          blob(12, '#9aa5b1');
          break;
        case 'coin':
          D.coin(ctx, 0, 0, 11);
          break;
        default: {
          // gömb (magic, orb, blob…)
          const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
          g.addColorStop(0, '#ffffff');
          g.addColorStop(0.4, col);
          g.addColorStop(1, U.rgba(col, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
      ctx.restore();
    },

    drawBeam(ctx, b) {
      const f = b.f, t = b.target;
      if (!t) return;
      const k = b.t / b.dur;
      const dir = f.side === 0 ? 1 : -1;
      const x0 = f.x + dir * 36, y0 = f.y - 82 * f.s / 1.55;
      const x1 = t.x, y1 = t.y - 70;
      const grow = U.clamp(b.t / 0.08, 0, 1);
      const xe = U.lerp(x0, x1, grow);
      const w = (b.big ? 34 : 18) * (1 - Math.pow(k, 3)) * (0.85 + Math.sin(TT.time * 50) * 0.15);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.strokeStyle = U.rgba(b.color, 0.55);
      ctx.lineWidth = w * 1.8;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      if (b.fx === 'lightning') {
        for (let i = 1; i < 8; i++) ctx.lineTo(U.lerp(x0, xe, i / 8), U.lerp(y0, y1, i / 8) + U.rand(-14, 14));
      }
      ctx.lineTo(xe, y1);
      ctx.stroke();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = w;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = w * 0.35;
      ctx.stroke();
      if (b.fx === 'sonic') {
        for (let i = 0; i < 4; i++) {
          const q = ((TT.time * 3 + i / 4) % 1);
          ctx.beginPath();
          ctx.ellipse(U.lerp(x0, xe, q), U.lerp(y0, y1, q), 8, w * 0.9, 0, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
      }
      ctx.restore();
      if (Math.random() < 0.6) TT.fx.spawn(x1 + U.rand(-10, 10), y1 + U.rand(-10, 10), { color: b.color, shape: 'spark', vx: -dir * U.rand(50, 250), vy: U.rand(-200, 200), size: 4, life: 0.3 });
    },

    // Bejövő támadás jelzése: zsugorodó kör a célpont körül (zöld = tökéletes blokk ablak)
    drawTelegraph(ctx) {
      const c = this.c;
      if (this.state !== 'fight') return;
      const en = c.act(1), me = c.act(0);
      if (!en || !me || !en.alive || !me.alive) return;
      const a = en.action;
      if (!a || a.kind === 'self' || a.hi >= a.hits.length) return;
      const first = a.hits[a.hi];
      const tt = first - a.t;
      if (tt < -0.05) return;
      const total = Math.max(0.3, a.hits[0]);
      const k = U.clamp(tt / total, 0, 1);
      const r = 46 + k * 110;
      const inPerfect = tt <= PERFECT_WINDOW;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = inPerfect ? 7 : 4;
      ctx.strokeStyle = inPerfect ? '#7bff6b' : tt < 0.6 ? '#ffd23f' : '#ffffff';
      ctx.beginPath();
      ctx.arc(me.x, me.y - 72, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#7bff6b';
      ctx.beginPath();
      ctx.arc(me.x, me.y - 72, 46 + (PERFECT_WINDOW / total) * 110, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // felkiáltójel az ellenfél feje felett
      const bob = Math.sin(TT.time * 14) * 3;
      D.text(ctx, '!', en.x, en.y - 190 + bob, { size: 46, align: 'center', color: a.isSuper ? '#ffd23f' : '#ff4f4f', lw: 8 });
    },

    drawBanner(ctx, b) {
      const f = b.f;
      const k = b.t / b.dur;
      const a = Math.min(1, b.t / 0.12) * Math.min(1, (b.dur - b.t) / 0.25);
      const y = f.y - 210 - (b.sup ? 20 : 0) - k * 10;
      ctx.save();
      ctx.globalAlpha = a;
      const sz = b.sup ? 30 : 20;
      const w = D.measure(ctx, b.text, sz) + 30;
      D.panel(ctx, f.x - w / 2, y - sz * 0.8, w, sz * 1.6, { fill: f.side === 0 ? '#3fa7ff' : '#e84545', r: 12, lw: 3 });
      D.text(ctx, b.text, f.x, y + 1, { size: sz, align: 'center', color: b.color });
      ctx.restore();
    },

    drawHud(ctx) {
      const c = this.c;
      for (let s = 0; s < 2; s++) {
        const side = c.sides[s];
        const f = side.fighters[side.active];
        const right = s === 1;
        const x = right ? TT.W - 312 : 12, y = 10, w = 300, h = 80;
        D.panel(ctx, x, y, w, h, { fill: right ? '#5a2140' : '#1f3a7a', r: 14, lw: 3 });
        const ix = right ? x + w - 28 : x + 28;
        D.typeIcon(ctx, f.fig.type, ix, y + 24, 13);
        const nx = right ? x + w - 50 : x + 50;
        D.text(ctx, f.fig.short, nx, y + 24, { size: 21, align: right ? 'right' : 'left', maxWidth: 170 });
        D.text(ctx, 'Szint ' + f.lvl, right ? x + 16 : x + w - 16, y + 24, { size: 16, align: right ? 'left' : 'right', color: '#ffd23f' });
        // HP
        const hpc = f.hp / f.maxHp > 0.5 ? '#4cd964' : f.hp / f.maxHp > 0.25 ? '#ffcc00' : '#ff3b30';
        D.bar(ctx, x + 12, y + 40, w - 24, 18, f.hp / f.maxHp, { color: hpc, ghost: f.ghost / f.maxHp, ghostColor: '#ff8a80' });
        D.text(ctx, Math.ceil(f.hp) + ' / ' + f.maxHp, x + w / 2, y + 49.5, { size: 13, align: 'center', lw: 3 });
        // szuper + blokk
        D.bar(ctx, x + 12, y + 62, w * 0.62 - 12, 10, f.superM / 100, { color: f.superM >= 100 ? '#ffd23f' : '#c06bff' });
        D.bar(ctx, x + w * 0.62 + 6, y + 62, w * 0.38 - 18, 10, f.guard / 100, { color: '#9be7ff' });
        // állapotok
        let sx = right ? x + w - 22 : x + 22;
        for (const k of Object.keys(f.status)) {
          const st = TT.STATUS[k];
          const o = f.status[k];
          ctx.save();
          D.rr(ctx, sx - 18, y + h + 6, 36, 22, 6);
          ctx.fillStyle = st.color;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#1d1433';
          ctx.stroke();
          ctx.restore();
          D.text(ctx, STATUS_LBL[k] || '?', sx, y + h + 17.5, { size: 13, align: 'center', lw: 3 });
          if (o.max) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(sx - 16, y + h + 24, 32 * (1 - o.t / o.max), 3);
          }
          sx += right ? -40 : 40;
        }
        if (f.stun > 0) {
          ctx.save();
          D.rr(ctx, sx - 18, y + h + 6, 36, 22, 6);
          ctx.fillStyle = '#ffe066';
          ctx.fill();
          ctx.restore();
          D.text(ctx, 'KÁ', sx, y + h + 17.5, { size: 13, align: 'center', lw: 3 });
        }
        // pihenők
        const bench = side.fighters.filter((ff, i) => i !== side.active);
        bench.forEach((bf, k) => {
          const bx = right ? TT.W - 12 - 122 - k * 128 : 14 + k * 128, by = this.benchY(s);
          const canSwap = s === 0 && bf.alive && side.swapCd <= 0 && this.state === 'fight';
          ctx.save();
          ctx.globalAlpha = bf.alive ? 1 : 0.45;
          D.panel(ctx, bx, by, 122, 44, { fill: canSwap ? '#2f5aa8' : '#2b1e5c', r: 10, lw: 2.5, shadow: false });
          const img = TT.art.figureCanvas(bf.id, 96, { pedestal: false });
          ctx.save();
          D.rr(ctx, bx + 3, by + 3, 38, 38, 8);
          ctx.clip();
          ctx.drawImage(img, bx - 7, by - 2, 58, 58);
          ctx.restore();
          D.text(ctx, bf.fig.short, bx + 46, by + 14, { size: 13, maxWidth: 72 });
          D.bar(ctx, bx + 46, by + 25, 68, 10, bf.hp / bf.maxHp, { color: '#4cd964' });
          if (!bf.alive) D.text(ctx, 'K.O.', bx + 80, by + 30, { size: 15, align: 'center', color: '#ff4f4f' });
          ctx.restore();
          if (s === 0 && this.state === 'fight') {
            D.keycap(ctx, k === 0 ? 'Q' : 'E', bx + 112, by + 4, { size: 11 });
            if (side.swapCd > 0 && bf.alive) {
              ctx.save();
              ctx.fillStyle = 'rgba(10,5,25,0.55)';
              D.rr(ctx, bx, by, 122 * (side.swapCd / SWAP_CD), 44, 10);
              ctx.fill();
              ctx.restore();
            }
          }
        });
      }
      const L = this.controlsLayout();
      if (this.state === 'fight') {
        D.button(ctx, L.speed.x, L.speed.y, L.speed.w, L.speed.h, this.speed > 1 ? '×1.6' : '×1', { color: this.speed > 1 ? '#ffb000' : '#4a3a8c', size: 17, r: 10 });
        if (!this.p.tutorial) D.button(ctx, L.auto.x, L.auto.y, L.auto.w, L.auto.h, 'AUTO', { color: this.auto ? '#2ecc71' : '#4a3a8c', size: 17, r: 10, glow: this.auto });
      }
      D.panel(ctx, L.pause.x, L.pause.y, L.pause.w, L.pause.h, { fill: '#2b1e5c', r: 10, lw: 2.5 });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(L.pause.x + 18, L.pause.y + 11, 5, 18);
      ctx.fillRect(L.pause.x + 29, L.pause.y + 11, 5, 18);

    },

    drawControls(ctx) {
      const c = this.c;
      const f = c.act(0);
      if (!f) return;
      const L = this.controlsLayout();
      const canAct = c.canAct(f);
      L.cards.forEach((card, i) => {
        const mv = card.mv;
        const m = mv.m;
        const ready = mv.c >= 1;
        const col = TT.TYPES[f.fig.type].color;
        ctx.save();
        D.panel(ctx, card.x, card.y, card.w, card.h, { fill: ready ? U.shade(col, -0.25) : '#2b1e5c', r: 12, lw: 3, stroke: ready && canAct ? '#ffffff' : '#120a2c' });
        // töltés
        ctx.save();
        D.rr(ctx, card.x + 3, card.y + 3, card.w - 6, card.h - 6, 10);
        ctx.clip();
        const fh = (card.h - 6) * mv.c;
        ctx.fillStyle = ready ? 'rgba(255,255,255,0.12)' : U.rgba(col, 0.45);
        ctx.fillRect(card.x + 3, card.y + card.h - 3 - fh, card.w - 6, fh);
        ctx.restore();
        if (ready && canAct) {
          ctx.globalAlpha = 0.25 + Math.sin(TT.time * 7) * 0.15;
          D.rr(ctx, card.x, card.y, card.w, card.h, 12);
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        D.text(ctx, m.name, card.x + 10, card.y + 20, { size: 17, maxWidth: card.w - 40 });
        const info = m.kind === 'self' ? (m.heal ? 'Gyógyít' : m.shield ? 'Pajzs' : 'Erősít') : 'Sebzés ' + m.power + (m.hits > 1 ? ' ×' + m.hits : '');
        D.text(ctx, info, card.x + 10, card.y + 44, { size: 14, color: '#ffe9a0' });
        if (m.eff.length) {
          const e = m.eff[0];
          D.text(ctx, TT.STATUS[e.s].name + (e.p < 1 ? ' ' + Math.round(e.p * 100) + '%' : ''), card.x + 10, card.y + 64, { size: 13, color: TT.STATUS[e.s].color, maxWidth: card.w - 20 });
        }
        D.keycap(ctx, String(i + 1), card.x + card.w - 16, card.y + 16, { size: 12 });
      });
      // szuper
      const sp = L.sup;
      const full = f.superM >= 100;
      D.button(ctx, sp.x, sp.y, sp.w, sp.h, '', { color: full ? '#ffb000' : '#4a3a8c', glow: full && canAct });
      ctx.save();
      D.rr(ctx, sp.x + 4, sp.y + 4, sp.w - 8, sp.h - 8, 10);
      ctx.clip();
      ctx.fillStyle = full ? 'rgba(255,255,255,0.15)' : 'rgba(192,107,255,0.45)';
      ctx.fillRect(sp.x, sp.y + sp.h - sp.h * f.superM / 100, sp.w, sp.h * f.superM / 100);
      ctx.restore();
      D.text(ctx, 'SZUPER', sp.x + sp.w / 2, sp.y + 28, { size: 24, align: 'center', color: full ? '#ffffff' : '#c8b8f0' });
      D.text(ctx, full ? f.sup.name : Math.floor(f.superM) + '%', sp.x + sp.w / 2, sp.y + 56, { size: 13, align: 'center', color: '#ffe9a0', maxWidth: sp.w - 12 });
      D.keycap(ctx, 'R', sp.x + sp.w - 14, sp.y + 14, { size: 11 });
      // blokk
      const bl = L.block;
      const bon = f.blocking;
      D.button(ctx, bl.x, bl.y, bl.w, bl.h, '', { color: bon ? '#2ecc71' : '#3f6fd8', pressed: bon });
      ctx.save();
      const cx = bl.x + bl.w / 2, cy = bl.y + 30 + (bon ? 3 : 0);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 16);
      ctx.lineTo(cx + 15, cy - 10);
      ctx.quadraticCurveTo(cx + 14, cy + 10, cx, cy + 18);
      ctx.quadraticCurveTo(cx - 14, cy + 10, cx - 15, cy - 10);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      ctx.restore();
      D.text(ctx, 'BLOKK', cx, bl.y + 64 + (bon ? 3 : 0), { size: 17, align: 'center' });
      D.bar(ctx, bl.x + 10, bl.y - 12, bl.w - 20, 8, f.guard / 100, { color: '#9be7ff' });
      if (!TT.input.isTouch()) D.text(ctx, 'Szóköz', bl.x + bl.w / 2, bl.y - 24, { size: 12, align: 'center', color: '#c8c0e8', lw: 3 });
    },

    drawTip(ctx) {
      const tp = this.tip;
      const a = Math.min(1, tp.t / 0.2) * Math.min(1, (tp.dur - tp.t) / 0.4);
      ctx.save();
      ctx.globalAlpha = a;
      const lines = D.wrap(ctx, tp.text, 560, 19);
      const h = 24 + lines.length * 24;
      D.panel(ctx, TT.W / 2 - 300, 150, 600, h, { fill: '#fdf6e3', r: 14, lw: 3 });
      lines.forEach((l, i) => D.text(ctx, l, TT.W / 2, 150 + 24 + i * 24, { size: 19, align: 'center', color: '#1b1140', stroke: false }));
      ctx.restore();
    },

    drawVs(ctx) {
      const k = this.t / 1.7;
      const inK = U.ease.outBack(U.clamp(k * 3, 0, 1));
      const outK = U.clamp((k - 0.8) / 0.2, 0, 1);
      ctx.save();
      ctx.globalAlpha = 1 - outK;
      ctx.fillStyle = 'rgba(10,5,25,0.55)';
      ctx.fillRect(0, 0, TT.W, TT.H);
      // két sáv
      ctx.save();
      ctx.translate(-TT.W * (1 - inK), 0);
      ctx.beginPath();
      ctx.moveTo(0, 150);
      ctx.lineTo(TT.W * 0.58, 150);
      ctx.lineTo(TT.W * 0.5, 270);
      ctx.lineTo(0, 270);
      ctx.closePath();
      ctx.fillStyle = '#3fa7ff';
      ctx.fill();
      D.text(ctx, 'TITÁNOK', 60, 210, { size: 54, color: '#ffffff' });
      this.drawSynergy(ctx, 0, 60, 250, 'left');
      ctx.restore();
      ctx.save();
      ctx.translate(TT.W * (1 - inK), 0);
      ctx.beginPath();
      ctx.moveTo(TT.W, 290);
      ctx.lineTo(TT.W * 0.42, 290);
      ctx.lineTo(TT.W * 0.5, 410);
      ctx.lineTo(TT.W, 410);
      ctx.closePath();
      ctx.fillStyle = '#e84545';
      ctx.fill();
      D.text(ctx, this.en.name.toUpperCase(), TT.W - 60, 350, { size: 44, align: 'right', color: '#ffffff', maxWidth: 480 });
      this.drawSynergy(ctx, 1, TT.W - 60, 390, 'right');
      ctx.restore();
      const vs = 0.5 + inK * 0.5 + Math.sin(TT.time * 10) * 0.03;
      ctx.translate(TT.W / 2, 280);
      ctx.scale(vs, vs);
      D.text(ctx, 'VS', 0, 0, { size: 96, align: 'center', color: '#ffd23f', lw: 14 });
      ctx.restore();
    },

    drawSynergy(ctx, s, x, y, align) {
      const syn = this.c.sides[s].synergy;
      if (!syn) return;
      D.text(ctx, `Csapatbónusz: ${TT.TEAM_NAMES[syn.team]} ×${syn.n} (+${Math.round(syn.bonus * 100)}%)`, x, y, { size: 18, align, color: '#ffe066' });
    },

    drawFinish(ctx) {
      const won = this.c.winner === 0;
      const k = U.ease.outBack(U.clamp(this.t / 0.5, 0, 1));
      ctx.save();
      ctx.translate(TT.W / 2, 220);
      ctx.scale(k, k);
      ctx.rotate(Math.sin(TT.time * 3) * 0.03);
      D.text(ctx, won ? 'GYŐZELEM!' : this.forfeit ? 'FELADVA' : 'VERESÉG', 0, 0, { size: 86, align: 'center', color: won ? '#ffd23f' : '#ff6b6b', lw: 14 });
      ctx.restore();
    },

    drawResults(ctx) {
      const r = this.results;
      const a = U.clamp(r.t / 0.3, 0, 1);
      ctx.save();
      ctx.fillStyle = `rgba(10,5,25,${0.6 * a})`;
      ctx.fillRect(0, 0, TT.W, TT.H);
      const x = 150, y = 40, w = 660, h = 400;
      ctx.globalAlpha = a;
      D.panel(ctx, x, y, w, h, { fill: r.won ? '#2b4a9a' : '#4a2a5a', r: 20, lw: 4 });
      D.text(ctx, r.won ? 'GYŐZELEM!' : 'VERESÉG', TT.W / 2, y + 38, { size: 40, align: 'center', color: r.won ? '#ffd23f' : '#ff8a80' });
      if (r.won) {
        D.coin(ctx, TT.W / 2 - 60, y + 82, 14);
        const shown = Math.floor(r.coins * U.clamp((r.t - 0.3) / 0.8, 0, 1));
        D.text(ctx, '+' + shown, TT.W / 2 - 38, y + 83, { size: 26, color: '#ffd23f' });
      } else {
        D.text(ctx, 'A figurák kevés tapasztalatot kaptak. Próbáld újra!', TT.W / 2, y + 82, { size: 18, align: 'center', color: '#e8e2ff' });
      }
      r.rows.forEach((row, i) => {
        const ry = y + 112 + i * 72;
        const fig = TT.FIG[row.id];
        ctx.drawImage(TT.art.figureCanvas(row.id, 96), x + 24, ry - 14, 76, 76);
        D.text(ctx, fig.short, x + 108, ry + 10, { size: 20 });
        const k2 = U.clamp((r.t - 0.4 - i * 0.15) / 0.9, 0, 1);
        const showUp = row.ups > 0 && k2 >= 1;
        D.text(ctx, 'Szint ' + (showUp ? row.after.lvl : row.before.lvl), x + 108, ry + 36, { size: 16, color: '#ffd23f' });
        // XP sáv
        let frac;
        if (row.ups > 0) frac = k2 < 0.6 ? U.lerp(row.before.xp / TT.xpToNext(row.before.lvl), 1, k2 / 0.6) : (row.after.xp / TT.xpToNext(row.after.lvl)) * ((k2 - 0.6) / 0.4);
        else frac = U.lerp(row.before.xp / TT.xpToNext(row.before.lvl), row.after.xp / TT.xpToNext(row.after.lvl), k2);
        D.bar(ctx, x + 240, ry + 18, 260, 16, frac, { color: '#c06bff' });
        D.text(ctx, '+' + row.xp + ' XP', x + 516, ry + 26, { size: 18, color: '#e8e2ff' });
        if (showUp) {
          const p = 1 + Math.sin(TT.time * 8) * 0.06;
          ctx.save();
          ctx.translate(x + 370, ry + 2);
          ctx.scale(p, p);
          D.text(ctx, 'SZINTLÉPÉS!', 0, 0, { size: 18, align: 'center', color: '#7bff6b' });
          ctx.restore();
        }
      });
      if (r.figs.length) {
        const fy = y + 330;
        r.figs.forEach((f, i) => {
          const fx = TT.W / 2 - (r.figs.length - 1) * 130 / 2 + i * 130;
          const k3 = U.ease.outBack(U.clamp((r.t - 1.0 - i * 0.2) / 0.5, 0, 1));
          ctx.save();
          ctx.translate(fx, fy);
          ctx.scale(k3, k3);
          D.sunburst(ctx, 0, 0, 0, 0, 'rgba(0,0,0,0)', 'rgba(0,0,0,0)');
          ctx.drawImage(TT.art.figureCanvas(f.id, 96), -38, -58, 76, 76);
          D.text(ctx, (f.isNew ? 'ÚJ: ' : '+' + f.xp + ' XP: ') + TT.FIG[f.id].short, 0, 30, { size: 16, align: 'center', color: f.isNew ? '#7bff6b' : '#ffe9a0' });
          ctx.restore();
        });
      }
      ctx.restore();
      if (r.t > 0.6) this.menu.draw(ctx);
    },
  };

  TT.register('battle', scene);
})(window.TT);
