'use strict';
// Csatakupola / Mint Trezor: kupák, meccsek, Végtelen Aréna.
(function (TT) {
  const U = TT.U;
  const D = TT.D;

  function teamAvg() {
    const s = TT.save;
    return s.team.reduce((a, id) => a + (s.owned[id] ? s.owned[id].lvl : 1), 0) / s.team.length;
  }

  // Végtelen Aréna ellenfele
  function endlessEnemy(wave) {
    const rnd = U.rng(wave * 7919 + 13);
    const pool = TT.FIG_LIST.map((f) => f.id);
    const team = [];
    const lvl = Math.min(TT.MAX_LVL, 17 + wave);
    for (let i = 0; i < 3; i++) team.push({ id: pool[Math.floor(rnd() * pool.length)], lvl });
    const boss = wave % 5 === 0;
    const bosses = ['slade', 'trigon', 'mrmint', 'robin_ultra', 'cyborg_3000'];
    if (boss) team[2] = { id: bosses[Math.floor(rnd() * bosses.length)], lvl: Math.min(TT.MAX_LVL, lvl + 2) };
    return {
      name: boss ? `Aréna Bajnok – ${wave}. hullám` : `Aréna – ${wave}. hullám`, who: TT.FIG[team[2].id].id,
      team, ai: Math.min(0.9, 0.55 + wave * 0.02), coins: 220 + wave * 30, bg: 'dome', music: boss ? 'boss' : 'battle',
    };
  }

  // Túlélő Torna: napi 5 harc gyógyulás nélkül
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function survivalState() {
    const s = TT.save;
    if (!s.survival || s.survival.date !== todayKey()) s.survival = { date: todayKey(), round: 0, hp: {}, over: false, won: false };
    return s.survival;
  }
  function survivalEnemy(round) {
    const rnd = U.rng(U.hash(todayKey() + ':' + round));
    const pool = TT.FIG_LIST.filter((f) => f.rarity !== 'legendary').map((f) => f.id);
    // az első kör után a rögzített csapat szintje számít (csapatcserével ne lehessen gyengíteni az ellenfelet)
    const s = TT.save, sv = survivalState();
    const ids = sv.round > 0 && sv.team ? sv.team : s.team;
    const avg = ids.reduce((a, id) => a + (s.owned[id] ? s.owned[id].lvl : 1), 0) / ids.length;
    const lvl = U.clamp(Math.round(avg + round * 0.6), 2, TT.MAX_LVL);
    const team = [0, 1, 2].map(() => ({ id: pool[Math.floor(rnd() * pool.length)], lvl }));
    const boss = round === 4;
    if (boss) {
      const legends = TT.FIG_LIST.filter((f) => f.rarity === 'legendary').map((f) => f.id);
      team[2] = { id: legends[Math.floor(rnd() * legends.length)], lvl: Math.min(TT.MAX_LVL, lvl + 1) };
    }
    return {
      name: boss ? 'Torna-bajnok' : `Túlélő – ${round + 1}. kör`, who: team[2].id, team,
      ai: Math.min(0.85, 0.42 + round * 0.06), coins: 120 + round * 40, bg: 'dome', music: boss ? 'boss' : 'battle',
    };
  }

  // Heti kihívás: hetente más szabály, 3 meccs, a végén prémium doboz
  const WEEKLY_RULES = [
    { id: 'brawn', text: 'Csak Erő típusú figurák', ok: (f) => f.type === 'brawn' },
    { id: 'tech', text: 'Csak Tech típusú figurák', ok: (f) => f.type === 'tech' },
    { id: 'mystic', text: 'Csak Misztikus figurák', ok: (f) => f.type === 'mystic' },
    { id: 'speed', text: 'Csak Gyorsaság típusú figurák', ok: (f) => f.type === 'speed' },
    { id: 'titans', text: 'Csak Titánok és Titánok Kelet', ok: (f) => f.team === 'titans' || f.team === 'east' },
    { id: 'villains', text: 'Csak gonoszok', ok: (f) => f.team !== 'titans' && f.team !== 'east' },
    { id: 'small', text: 'Csak közönséges és ritka figurák', ok: (f) => f.rarity === 'common' || f.rarity === 'rare' },
    { id: 'noitems', text: 'Bármilyen csapat, de kellékek nélkül', ok: () => true, noItems: true },
  ];
  const WEEKLY_PRIZE = 600;
  function weekKey() {
    const d = new Date();
    const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return m.getFullYear() + '-' + (m.getMonth() + 1) + '-' + m.getDate();
  }
  function weeklyRule() {
    return WEEKLY_RULES[Math.floor(U.rng(U.hash('weekly:' + weekKey()))() * WEEKLY_RULES.length)];
  }
  function weeklyState() {
    const s = TT.save;
    if (!s.weekly || s.weekly.week !== weekKey()) s.weekly = { week: weekKey(), step: 0, done: false };
    return s.weekly;
  }
  // a szabálynak megfelelő csapat: előbb a saját csapatból, aztán a legerősebb megfelelő figurák
  function weeklyTeam() {
    const s = TT.save, rule = weeklyRule();
    const fits = (id) => s.owned[id] && TT.FIG[id] && rule.ok(TT.FIG[id]);
    const team = s.team.filter(fits);
    const rest = Object.keys(s.owned).filter((id) => fits(id) && team.indexOf(id) < 0).sort((a, b) => s.owned[b].lvl - s.owned[a].lvl);
    return team.concat(rest).slice(0, 3);
  }
  function weeklyEnemy(step) {
    const rule = weeklyRule();
    const rnd = U.rng(U.hash('weekly:' + weekKey() + ':' + step));
    const team = weeklyTeam();
    const s = TT.save;
    const avg = team.length ? team.reduce((a, id) => a + s.owned[id].lvl, 0) / team.length : teamAvg();
    const lvl = U.clamp(Math.round(avg + step * 0.8), 2, TT.MAX_LVL);
    let pool = TT.FIG_LIST.filter((f) => rule.ok(f) && f.rarity !== 'legendary').map((f) => f.id);
    if (pool.length < 3) pool = TT.FIG_LIST.filter((f) => f.rarity !== 'legendary').map((f) => f.id);
    const boss = step === 2;
    // a főellenség előbb sorsolódik, és nem szerepelhet még egyszer a csapatban (különben kettő kapna 2. fázist)
    let bossId = null;
    if (boss) {
      const top = TT.FIG_LIST.filter((f) => rule.ok(f) && (f.rarity === 'legendary' || f.rarity === 'epic')).map((f) => f.id);
      const from = top.length ? top : pool;
      bossId = from[Math.floor(rnd() * from.length)];
      pool = pool.filter((id) => id !== bossId);
    }
    const ids = [0, 1, 2].map(() => ({ id: pool[Math.floor(rnd() * pool.length)], lvl }));
    if (bossId) ids[2] = { id: bossId, lvl: Math.min(TT.MAX_LVL, lvl + 1) };
    return {
      name: boss ? 'Heti bajnok' : `Heti kihívás – ${step + 1}. meccs`, who: ids[2].id, team: ids,
      ai: Math.min(0.85, 0.45 + step * 0.12), coins: 150 + step * 75, bg: 'dome', music: boss ? 'boss' : 'battle',
    };
  }

  const scene = {
    enter(p) {
      this.p = p;
      this.venue = p.venue || 'dome';
      this.t = 0;
      this.menu = new TT.ui.Menu();
      const cups = this.cups();
      const firstOpen = cups.findIndex((c) => c.id !== 'endless' && this.unlocked(c) && !TT.cupDone(c.id));
      this.sel = p.sel != null ? p.sel : Math.max(0, firstOpen);
      TT.audio.music(this.venue === 'vault' ? 'vault' : 'dome');
      this.build();
      this.menu.focus = this.sel;
      TT.checkAch();
      if (this.venue === 'vault' && !TT.save.flags.vaultIntro) {
        TT.save.flags.vaultIntro = true;
        setTimeout(() => TT.ui.say([
          { who: 'mrmint', text: 'Üdvözöllek a trezoromban. Nézz körül: minden polc bontatlan kincs.' },
          { who: 'mrmint', text: 'A Menta Kupa szabályai egyszerűek: ha nyersz, a figuráid szabadok. Ha veszítesz… dobozba kerülnek.' },
        ]), 300);
      }
    },

    cups() {
      if (this.venue === 'vault') return [TT.CUP.mint];
      const list = TT.CUPS.filter((c) => c.venue === 'dome');
      list.push({ id: 'friend', name: 'Barát kihívása', color: '#ff9ecd', desc: 'Csapatkóddal megküzdhetsz egy barátod csapatával — vagy elküldheted a sajátodat.' });
      if (TT.cupDone('rookie')) list.push({ id: 'weekly', name: 'Heti kihívás', color: '#c06bff', desc: `E heti szabály: ${weeklyRule().text}. 3 meccs; a végén ${WEEKLY_PRIZE} érme és egy prémium doboz figura. Hétfőnként új szabály!` });
      if (TT.cupDone('rookie')) list.push({ id: 'survival', name: 'Túlélő Torna', color: '#2a9d8f', desc: '5 harc egymás után, gyógyulás nélkül — a kiesett figurák kiesve maradnak. Naponta egyszer. Fődíj: 1500 érme + legendás doboz!' });
      if (TT.cupDone('mint')) list.push({ id: 'endless', name: 'Végtelen Aréna', color: '#ff6b35', desc: 'Egyre erősebb csapatok, egyre nagyobb jutalmak. Minden 5. hullám egy bajnok!' });
      return list;
    },
    unlocked(c) {
      if (c.id === 'endless' || c.id === 'survival' || c.id === 'friend' || c.id === 'weekly') return true;
      return !c.req || TT.cupDone(c.req);
    },

    build() {
      const cups = this.cups();
      const step = cups.length > 7 ? 48 : cups.length > 6 ? 55 : cups.length > 5 ? 63 : cups.length > 4 ? 76 : 92;
      const ch = cups.length > 7 ? 44 : cups.length > 6 ? 51 : cups.length > 5 ? 58 : cups.length > 4 ? 70 : 82;
      const items = cups.map((c, i) => ({
        id: 'cup' + i, x: 20, y: 70 + i * step, w: 300, h: ch, cup: c, i,
        onClick: () => {
          this.sel = i;
          this.build();
        },
        draw: (ctx, b, focus) => this.drawCupCard(ctx, b, focus),
      }));
      const c = cups[this.sel];
      const sv = c && c.id === 'survival' ? survivalState() : null;
      const wk = c && c.id === 'weekly' ? weeklyState() : null;
      const ok = c && this.unlocked(c) && (c.id === 'endless' || (sv ? !sv.over : wk ? !wk.done : !TT.cupDone(c.id)));
      const label = sv ? (sv.over ? 'Holnap újra!' : 'HARC!') : wk ? (wk.done ? 'Jövő héten!' : 'HARC!') : c && TT.cupDone(c.id) && c.id !== 'endless' ? 'Megnyerve!' : 'HARC!';
      items.push({ id: 'fight', x: 600, y: 456, w: 330, h: 64, label, color: '#ff4f4f', size: 30, disabled: !ok,
        onDisabled: () => TT.ui.toast(sv ? 'A mai tornának vége. Holnap újra próbálhatod!' : wk ? 'Az e heti kihívást már teljesítetted. Hétfőn új jön!' : c && TT.cupDone(c.id) ? 'Ezt a kupát már megnyerted!' : 'Ez a kupa még zárva van.', { color: '#ff8a80' }),
        onClick: () => this.fight(), glow: ok });
      items.push({ id: 'team', x: 350, y: 456, w: 230, h: 64, label: 'Csapat', color: '#3fa7ff', onClick: () => TT.go('collection', { from: 'dome', venue: this.venue, back: this.p.back, sel: this.sel }) });
      items.push({ id: 'back', x: 20, y: 470, w: 160, h: 52, label: 'Vissza', color: '#6c5ce7', sfx: 'back', onClick: () => TT.go('world', { pos: this.p.back, dir: 'down' }) });
      this.menu.set(items);
    },

    nextMatch(c) {
      const s = TT.save;
      if (c.id === 'endless') return { m: endlessEnemy((s.endless || 0) + 1), boss: (s.endless + 1) % 5 === 0, step: s.endless || 0 };
      if (c.id === 'survival') {
        const sv = survivalState();
        return { m: survivalEnemy(sv.round), boss: sv.round === 4, step: sv.round };
      }
      if (c.id === 'friend') {
        const f = s.lastFriend;
        return { m: f ? this.friendEnemy(f) : { name: 'Nincs még kód', who: 'robin', team: [] }, boss: false, step: 0 };
      }
      if (c.id === 'weekly') {
        const wk = weeklyState();
        const st = Math.min(2, wk.step);
        return { m: weeklyEnemy(st), boss: st === 2, step: st };
      }
      const step = s.cupStep[c.id] || 0;
      if (step < c.matches.length) return { m: c.matches[step], boss: false, step };
      return { m: c.boss, boss: true, step };
    },

    fight() {
      const s = TT.save;
      const c = this.cups()[this.sel];
      const { m, boss } = this.nextMatch(c);
      if (c.id === 'survival') {
        this.fightSurvival(m);
        return;
      }
      if (c.id === 'friend') {
        this.friendMenu();
        return;
      }
      if (c.id === 'weekly') {
        this.fightWeekly(m);
        return;
      }
      const go = () => {
        const sel = this.sel;
        const venue = this.venue;
        const back = this.p.back;
        TT.go('battle', {
          enemy: Object.assign({ bg: venue === 'vault' ? 'vault' : 'dome' }, m),
          rewardFigs: [],
          after: (won) => {
            if (!won) {
              TT.go('dome', { venue, back, sel });
              return;
            }
            if (c.id === 'endless') {
              s.endless = (s.endless || 0) + 1;
              const extra = [];
              if (s.endless === 10 && !s.owned.trigon) extra.push('trigon');
              else if (s.endless % 5 === 0) extra.push(TT.rollBox(TT.BOXES[2]));
              TT.store.write();
              if (extra.length) {
                const info = TT.grantFigure(extra[0]);
                TT.store.write();
                TT.go('dome', { venue, back, sel });
                setTimeout(() => TT.ui.reveal(extra[0], info), 500);
              } else TT.go('dome', { venue, back, sel });
              return;
            }
            s.cupStep[c.id] = (s.cupStep[c.id] || 0) + 1;
            if (boss) {
              s.cups[c.id] = true;
              s.coins += c.reward.coins;
              let info = null;
              if (c.reward.fig) info = TT.grantFigure(c.reward.fig);
              TT.store.write();
              TT.go('world', { pos: back, dir: 'down', event: 'cup_' + c.id });
              setTimeout(() => {
                TT.ui.toast(`${c.name} megnyerve! +${c.reward.coins} érme`, { dur: 4 });
                if (c.reward.fig) TT.ui.reveal(c.reward.fig, info);
              }, 200);
            } else {
              TT.store.write();
              TT.go('dome', { venue, back, sel });
            }
          },
        });
      };
      if (teamAvg() < (c.minLvl || 1) - 1) {
        TT.ui.confirm(`A csapatod átlagszintje ${teamAvg().toFixed(1)}, az ajánlott ${c.minLvl}. Biztos belevágsz?`, (ok) => ok && go(), 'Harc!', 'Inkább edzek');
      } else go();
    },

    friendEnemy(f) {
      return {
        name: f.name + ' csapata', who: f.team[2].id, team: f.team.map((t) => ({ id: t.id, lvl: t.lvl, stars: t.stars })),
        ai: 0.72, coins: 60, bg: 'dome', music: 'battle',
        intro: [{ who: f.team[0].id, text: `${f.name} csapata kihívást küldött! Lássuk, ki a jobb Teeny edző!` }],
      };
    },

    friendMenu() {
      const s = TT.save;
      TT.ui.choose({
        title: 'Barát kihívása',
        text: 'Másold ki a csapatkódod és küldd el, vagy írd be a barátodét!',
        options: [
          { label: 'Barát kódjának beírása', value: 'enter', color: '#ff6b35' },
          { label: s.lastFriend ? `Visszavágó: ${s.lastFriend.name}` : 'Visszavágó (nincs még)', value: 'again', disabled: !s.lastFriend, color: '#ff4f4f' },
          { label: 'Csapatkódom másolása', value: 'copy', color: '#2ecc71' },
          { label: 'Nevem: ' + (s.playerName || 'Titán'), value: 'name', color: '#3fa7ff' },
          { label: 'Mégse', value: null },
        ],
      }, (v) => {
        if (v === 'copy') {
          const code = TT.teamCode();
          try {
            navigator.clipboard.writeText(code).then(() => TT.ui.toast('Csapatkód a vágólapon! Küldd el a barátodnak.'), () => window.prompt('Csapatkódod (másold ki):', code));
          } catch (e) {
            window.prompt('Csapatkódod (másold ki):', code);
          }
        } else if (v === 'name') {
          const n = window.prompt('Hogy hívjanak? (max 16 betű)', s.playerName || '');
          if (n && n.trim()) {
            s.playerName = n.trim().slice(0, 16);
            TT.store.write();
            this.friendMenu();
          }
        } else if (v === 'enter') {
          const code = window.prompt('Írd be / illeszd be a barátod csapatkódját:');
          if (!code) return;
          const f = TT.parseTeamCode(code);
          if (!f) {
            TT.ui.toast('Hibás csapatkód!', { color: '#ff8a80' });
            return;
          }
          s.lastFriend = f;
          TT.store.write();
          this.build();
          this.fightFriend(f);
        } else if (v === 'again' && s.lastFriend) this.fightFriend(s.lastFriend);
      });
    },

    fightFriend(f) {
      const s = TT.save;
      const sel = this.sel, venue = this.venue, back = this.p.back;
      TT.go('battle', {
        enemy: this.friendEnemy(f), rewardFigs: [],
        after: (won) => {
          if (won) s.flags.friendWins = (s.flags.friendWins || 0) + 1;
          TT.store.write();
          TT.go('dome', { venue, back, sel });
          if (won) setTimeout(() => TT.ui.toast(`Legyőzted ${f.name} csapatát!`), 300);
        },
      });
    },

    fightWeekly(m) {
      const s = TT.save;
      const wk = weeklyState();
      const rule = weeklyRule();
      const team = weeklyTeam();
      if (!team.length) {
        TT.ui.toast('Nincs a szabálynak megfelelő figurád. Szerezz egyet a Játékboltban!', { color: '#ff8a80', dur: 3.5 });
        return;
      }
      const sel = this.sel, venue = this.venue, back = this.p.back;
      TT.go('battle', {
        enemy: m, rewardFigs: [], playerTeam: team, noItems: !!rule.noItems,
        after: (won) => {
          if (!won) {
            TT.go('dome', { venue, back, sel });
            return;
          }
          wk.step++;
          if (wk.step >= 3) {
            wk.done = true;
            s.coins += WEEKLY_PRIZE;
            s.flags.weeklyWins = (s.flags.weeklyWins || 0) + 1;
            const id = TT.rollBox(TT.BOXES[1]);
            const info = TT.grantFigure(id);
            TT.store.write();
            TT.go('dome', { venue, back, sel });
            setTimeout(() => {
              TT.ui.toast(`Heti kihívás teljesítve! +${WEEKLY_PRIZE} érme`, { dur: 4 });
              TT.ui.reveal(id, info, () => TT.checkAch());
            }, 300);
            return;
          }
          TT.store.write();
          TT.go('dome', { venue, back, sel });
        },
      });
    },

    fightSurvival(m) {
      const s = TT.save;
      const sv = survivalState();
      const sel = this.sel, venue = this.venue, back = this.p.back;
      const team = s.team.filter((id) => sv.hp[id] == null || sv.hp[id] > 0);
      if (!team.length) {
        sv.over = true;
        this.build();
        return;
      }
      // első kör: a csapat rögzül
      if (sv.round === 0) sv.team = s.team.slice();
      TT.go('battle', {
        enemy: m, rewardFigs: [], playerTeam: sv.team.filter((id) => sv.hp[id] == null || sv.hp[id] > 0), hpFrac: sv.hp, noRetry: true,
        after: (won, sc) => {
          if (!won) {
            sv.over = true;
            TT.store.write();
            TT.go('dome', { venue, back, sel });
            setTimeout(() => TT.ui.toast(`A torna véget ért a(z) ${sv.round + 1}. körben. Holnap újra!`, { color: '#ff8a80', dur: 4 }), 300);
            return;
          }
          for (const f of sc.c.sides[0].fighters) sv.hp[f.id] = f.alive ? f.hp / f.maxHp : 0;
          sv.round++;
          if (sv.round >= 5) {
            sv.over = true;
            sv.won = true;
            s.coins += 1500;
            s.flags.survivalWins = (s.flags.survivalWins || 0) + 1;
            const id = TT.rollBox(TT.BOXES[2]);
            const info = TT.grantFigure(id);
            TT.store.write();
            TT.go('dome', { venue, back, sel });
            setTimeout(() => {
              TT.ui.toast('Túlélő Torna megnyerve! +1500 érme', { dur: 4 });
              TT.ui.reveal(id, info, () => TT.checkAch());
            }, 300);
            return;
          }
          TT.store.write();
          TT.go('dome', { venue, back, sel });
        },
      });
    },

    update(dt) {
      this.t += dt;
      if (TT.input.hit('back')) {
        TT.audio.sfx('back');
        TT.go('world', { pos: this.p.back, dir: 'down' });
        return;
      }
      const prev = this.sel;
      this.menu.update();
      const f = this.menu.items[this.menu.focus];
      if (f && f.cup && TT.input.lastDevice !== 'touch' && TT.input.lastDevice !== 'mouse' && f.i !== this.sel) {
        this.sel = f.i;
        this.build();
      }
      if (prev !== this.sel) this.build();
    },

    drawCupCard(ctx, b, focus) {
      const c = b.cup;
      const sel = b.i === this.sel;
      const unl = this.unlocked(c);
      const done = c.id !== 'endless' && TT.cupDone(c.id);
      D.panel(ctx, b.x + (sel ? 8 : 0), b.y, b.w, b.h, { fill: unl ? (sel ? U.shade(c.color, -0.25) : '#2b1e5c') : '#3a3450', r: 14, lw: 3, stroke: focus ? '#ffffff' : '#120a2c' });
      const x = b.x + (sel ? 8 : 0);
      // kupa ikon
      ctx.save();
      ctx.translate(x + 40, b.y + b.h / 2 + 1);
      if (b.h < 55) ctx.scale(0.78, 0.78);
      ctx.beginPath();
      ctx.moveTo(-16, -20);
      ctx.lineTo(16, -20);
      ctx.quadraticCurveTo(16, 6, 0, 8);
      ctx.quadraticCurveTo(-16, 6, -16, -20);
      ctx.closePath();
      ctx.fillStyle = unl ? c.color : '#6a6480';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1d1433';
      ctx.stroke();
      ctx.fillRect(-3, 8, 6, 8);
      ctx.fillRect(-11, 15, 22, 6);
      ctx.strokeRect(-11, 15, 22, 6);
      ctx.restore();
      const ly = b.h - (b.h < 55 ? 12 : b.h < 80 ? 16 : 26);
      D.text(ctx, c.name, x + 72, b.y + b.h * 0.36, { size: b.h < 55 ? 18 : b.h < 60 ? 20 : 22 });
      if (!unl) D.text(ctx, 'Zárva', x + 72, b.y + ly, { size: 16, color: '#a89cd8' });
      else if (c.id === 'endless') D.text(ctx, `Legjobb: ${TT.save.endless || 0}. hullám`, x + 72, b.y + ly, { size: 16, color: '#ffe9a0' });
      else if (c.id === 'friend') {
        D.text(ctx, TT.save.lastFriend ? 'Utolsó: ' + TT.save.lastFriend.name : 'Csapatkóddal', x + 72, b.y + ly, { size: 16, color: '#ffe9a0', maxWidth: 210 });
      } else if (c.id === 'survival') {
        const sv = survivalState();
        D.text(ctx, sv.won ? 'Ma megnyerted!' : sv.over ? 'Ma véget ért' : `Kör: ${sv.round + 1}/5`, x + 72, b.y + ly, { size: 16, color: sv.won ? '#7bff6b' : sv.over ? '#ff8a80' : '#ffe9a0' });
      } else if (c.id === 'weekly') {
        const wk = weeklyState();
        D.text(ctx, wk.done ? 'E héten kész!' : `Meccs: ${wk.step + 1}/3`, x + 72, b.y + ly, { size: 16, color: wk.done ? '#7bff6b' : '#ffe9a0' });
      }
      else {
        const step = TT.save.cupStep[c.id] || 0;
        for (let i = 0; i < 4; i++) {
          const dx = x + 80 + i * 30, dy = b.y + ly;
          ctx.beginPath();
          if (i === 3) D.star(ctx, dx, dy, 10, 4.5, 5);
          else ctx.arc(dx, dy, 8, 0, Math.PI * 2);
          ctx.fillStyle = i < step || done ? '#7bff6b' : i === step ? '#ffd23f' : '#4a3a7a';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#1d1433';
          ctx.stroke();
        }
        if (done) D.text(ctx, 'KÉSZ', x + b.w - 20, b.y + ly, { size: 16, align: 'right', color: '#7bff6b' });
      }
    },

    draw(ctx) {
      TT.backdrop.draw(ctx, this.venue === 'vault' ? 'vault' : 'dome', TT.time);
      ctx.fillStyle = 'rgba(10,5,25,0.55)';
      ctx.fillRect(0, 0, TT.W, TT.H);
      D.text(ctx, this.venue === 'vault' ? 'MINT TREZOR' : 'CSATAKUPOLA', 24, 38, { size: 36, color: '#ffd23f' });
      D.panel(ctx, TT.W - 182, 12, 166, 40, { fill: '#2b1e5c', r: 12, lw: 2.5 });
      D.coin(ctx, TT.W - 160, 32, 12);
      D.text(ctx, U.fmt(TT.save.coins), TT.W - 140, 33, { size: 22, color: '#ffd23f' });

      const cups = this.cups();
      const c = cups[this.sel];
      // részletek
      const px = 350, py = 70, pw = 590, ph = 374;
      D.panel(ctx, px, py, pw, ph, { fill: '#2b1e5c', r: 18, lw: 3 });
      if (c) {
        D.text(ctx, c.name, px + 22, py + 34, { size: 30, color: c.color });
        const dl = D.wrap(ctx, c.desc || '', pw - 44, 16);
        dl.forEach((l, i) => D.text(ctx, l, px + 22, py + 64 + i * 20, { size: 16, color: '#e8e2ff', stroke: false }));
        if (!this.unlocked(c)) {
          D.text(ctx, 'Nyerd meg előbb: ' + TT.CUP[c.req].name, px + pw / 2, py + 200, { size: 22, align: 'center', color: '#ff8a80' });
        } else {
          const nm = this.nextMatch(c);
          const sv = c.id === 'survival' ? survivalState() : null;
          const wk = c.id === 'weekly' ? weeklyState() : null;
          const done = sv ? sv.over : wk ? wk.done : c.id !== 'endless' && TT.cupDone(c.id);
          const m = nm.m;
          if (done) {
            D.text(ctx, sv ? (sv.won ? 'Ma megnyerted a tornát!' : 'A mai tornának vége — holnap újra!') : wk ? 'E heti kihívás teljesítve!' : 'Megnyerted ezt a kupát!', px + pw / 2, py + 170, { size: 28, align: 'center', color: sv && !sv.won ? '#ff8a80' : '#7bff6b' });
            TT.art.drawFigure(ctx, TT.FIG.robin, px + pw / 2, py + 330, 1.2, { pose: 'cheer' });
          } else {
            if (c.id === 'friend' && !TT.save.lastFriend) {
              D.text(ctx, 'Nyomd meg a HARC! gombot a kódhoz.', px + pw / 2, py + 200, { size: 22, align: 'center', color: '#ffe9a0' });
            } else D.text(ctx, nm.boss ? 'FŐELLENSÉG' : c.id === 'endless' ? `${nm.step + 1}. hullám` : c.id === 'survival' ? `${nm.step + 1}/5. kör` : c.id === 'friend' ? 'Kihívás' : c.id === 'weekly' ? `${nm.step + 1}/3. meccs` : `${nm.step + 1}. meccs`, px + 22, py + 112, { size: 20, color: nm.boss ? '#ff4f4f' : '#ffd23f' });
            D.text(ctx, m.name, px + 22, py + 142, { size: 30 });
            // ellenfél csapata
            m.team.forEach((t, i) => {
              const fx = px + 90 + i * 150, fy = py + 330;
              ctx.save();
              ctx.globalAlpha = 0.9;
              TT.art.drawFigure(ctx, TT.FIG[t.id], fx, fy, 0.95, { facing: -1, t: TT.time + i });
              ctx.restore();
              D.text(ctx, TT.FIG[t.id].short, fx, fy + 22, { size: 15, align: 'center', maxWidth: 140 });
              D.text(ctx, 'Szint ' + t.lvl, fx, fy - 140, { size: 15, align: 'center', color: '#ffd23f' });
              D.typeIcon(ctx, TT.FIG[t.id].type, fx + 44, fy - 140, 10);
            });
            // heti kihívás: ki harcol a szabály szerint
            if (wk) {
              const wt = weeklyTeam();
              D.text(ctx, wt.length ? 'Csapatod ehhez: ' + wt.map((id) => TT.FIG[id].short).join(', ') : 'Nincs a szabálynak megfelelő figurád!', px + 22, py + 370, { size: 15, color: wt.length ? '#9be7ff' : '#ff8a80', lw: 3, maxWidth: pw - 44 });
            }
            // ajánlott szint (a heti kihívásnál a ténylegesen harcoló csapaté)
            const wt = wk ? weeklyTeam() : null;
            const avg = wt && wt.length ? wt.reduce((a, id) => a + TT.save.owned[id].lvl, 0) / wt.length : teamAvg();
            const rec = c.minLvl || Math.round(m.team.reduce((a, t) => a + t.lvl, 0) / 3);
            D.text(ctx, `Csapatod átlagszintje: ${avg.toFixed(1)}  ·  Ajánlott: ${rec}+`, px + pw - 22, py + 112, { size: 15, align: 'right', color: avg + 1 >= rec ? '#7bff6b' : '#ff8a80' });
          }
        }
      }
      // saját csapat kicsiben (heti kihívásnál a szabály szerinti csapat)
      const cur = this.cups()[this.sel];
      const shown = cur && cur.id === 'weekly' && weeklyTeam().length ? weeklyTeam() : TT.save.team;
      shown.forEach((id, i) => {
        ctx.drawImage(TT.art.figureCanvas(id, 96), 196 + i * 48, 466, 48, 48);
      });
      this.menu.draw(ctx);
    },
  };

  TT.register('dome', scene);
})(window.TT);
