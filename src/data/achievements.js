'use strict';
// Teljesítmények, napi jutalom és a teljesítmény-lista ablak.
(function (TT) {
  const U = TT.U;
  const D = TT.D;

  const maxLvl = (s) => Math.max(0, ...Object.values(s.owned).map((o) => o.lvl));
  const maxStars = (s) => Math.max(0, ...Object.keys(s.owned).map((id) => TT.starsOf(id)));
  const seriesDone = (s, id) => TT.SERIES.find((x) => x.id === id).ids.every((f) => s.owned[f]);
  const mapTrainers = () => TT.WORLD.npcs.filter((n) => n.trainer && n.trainer !== 'tutorial').map((n) => n.trainer);

  const A = (id, name, desc, coins, check) => ({ id, name, desc, coins, check });
  TT.ACHIEVEMENTS = [
    A('win1', 'Első győzelem', 'Nyerj meg egy harcot.', 50, (s) => s.stats.wins >= 1),
    A('win10', 'Rutinos harcos', 'Nyerj meg 10 harcot.', 150, (s) => s.stats.wins >= 10),
    A('win50', 'Aréna-veterán', 'Nyerj meg 50 harcot.', 500, (s) => s.stats.wins >= 50),
    A('win100', 'Élő legenda', 'Nyerj meg 100 harcot.', 1000, (s) => s.stats.wins >= 100),
    A('perfect1', 'Tökéletes időzítés', 'Hajts végre egy tökéletes blokkot.', 50, (s) => s.stats.perfects >= 1),
    A('perfect25', 'Pajzsmester', 'Hajts végre 25 tökéletes blokkot.', 300, (s) => s.stats.perfects >= 25),
    A('perfect100', 'Áttörhetetlen', 'Hajts végre 100 tökéletes blokkot.', 800, (s) => s.stats.perfects >= 100),
    A('ko50', 'Kiütéskirály', 'Üss ki 50 ellenfél figurát.', 300, (s) => s.stats.kos >= 50),
    A('box1', 'Első doboz', 'Bonts ki egy vakdobozt.', 50, (s) => s.stats.boxes >= 1),
    A('box20', 'Dobozbontó', 'Bonts ki 20 vakdobozt.', 400, (s) => s.stats.boxes >= 20),
    A('figs10', 'Gyűjtő', 'Szerezz meg 10 különböző figurát.', 100, (s) => Object.keys(s.owned).length >= 10),
    A('figs25', 'Nagy gyűjtő', 'Szerezz meg 25 különböző figurát.', 400, (s) => Object.keys(s.owned).length >= 25),
    A('figsAll', 'Teljes gyűjtemény', 'Szerezd meg az összes figurát.', 3000, (s) => Object.keys(s.owned).length >= TT.FIG_LIST.length),
    A('legend', 'Legendás!', 'Szerezz egy legendás figurát.', 300, (s) => Object.keys(s.owned).some((id) => TT.FIG[id].rarity === 'legendary')),
    A('lvl10', 'Edzett', 'Fejlessz egy figurát a 10. szintre.', 150, (s) => maxLvl(s) >= 10),
    A('lvl20', 'Profi', 'Fejlessz egy figurát a 20. szintre.', 400, (s) => maxLvl(s) >= 20),
    A('lvl30', 'Csúcsforma', 'Fejlessz egy figurát a 30. szintre.', 1000, (s) => maxLvl(s) >= 30),
    A('star1', 'Duplán jó', 'Szerezz egy csillagot egy duplikátummal.', 80, (s) => maxStars(s) >= 1),
    A('star5', 'Ötcsillagos', 'Fejlessz egy figurát 5 csillagra.', 600, (s) => maxStars(s) >= 5),
    A('combo1', 'Barátság ereje', 'Használj egy kombó szuper támadást.', 150, (s) => !!s.flags.comboUsed),
    A('paint1', 'Művész', 'Fess át egy figurát a Festőműhelyben.', 100, (s) => !!s.flags.painted),
    A('weekly1', 'Heti bajnok', 'Teljesíts egy Heti kihívást a Csatakupolában.', 400, (s) => (s.flags.weeklyWins || 0) >= 1),
    A('survival1', 'Túlélő', 'Nyerd meg a Túlélő Tornát.', 600, (s) => (s.flags.survivalWins || 0) >= 1),
    A('event1', 'Ünnepi gyűjtő', 'Teljesíts egy szezonális eseményt (Halloween vagy Karácsony).', 300, (s) => Object.values(s.events || {}).some((e) => e.done)),
    A('train15', 'Hibátlan edzés', 'Blokk-edzésen mind a 15 támadást tökéletesen blokkold.', 500, (s) => !!s.flags.trainPerfect),
    A('factory', 'Gyárbezáró', 'Ürítsd ki a Menta Gyár mindhárom szintjét.', 600, (s) => !!(s.factory && s.factory.done)),
    A('friend1', 'Barátságos meccs', 'Győzd le egy barátod csapatát csapatkóddal.', 200, (s) => (s.flags.friendWins || 0) >= 1),
    A('syn3', 'Csapatszellem', 'Nyerj egy harcot 3 azonos csapatú figurával.', 150, (s) => !!s.flags.synWin),
    A('cup1', 'Újonc bajnok', 'Nyerd meg az Újonc Kupát.', 100, () => TT.cupDone('rookie')),
    A('cup2', 'Keleti hős', 'Nyerd meg a Kelet Kupát.', 150, () => TT.cupDone('east')),
    A('cup3', 'Gonoszverő', 'Nyerd meg a Gonosz Kupát.', 200, () => TT.cupDone('villain')),
    A('cup4', 'Kibontva!', 'Győzd le Mr. Mintet.', 500, () => TT.cupDone('mint')),
    A('cup5', 'Testvériség-törő', 'Nyerd meg a Testvériség Kupát.', 800, () => TT.cupDone('brotherhood')),
    A('trigon', 'Démonverő', 'Győzd le Trigont a Torony szigetén.', 1500, (s) => !!s.beaten.trigon),
    A('redx', 'X jelöli a helyet', 'Győzd le Red X-et éjjel a kikötőben.', 1000, (s) => !!s.beaten.redx),
    A('endless5', 'Kitartó', 'Juss el az 5. hullámig a Végtelen Arénában.', 500, (s) => (s.endless || 0) >= 5),
    A('endless15', 'Végtelen bajnok', 'Juss el a 15. hullámig a Végtelen Arénában.', 1500, (s) => (s.endless || 0) >= 15),
    A('hidden', 'Kincsvadász', 'Találd meg az összes rejtett figurát és érmét.', 500, (s) => TT.WORLD.hidden.every((h) => s.found[h.id])),
    A('trainers', 'Városi bajnok', 'Győzd le a város összes edzőjét.', 500, (s) => mapTrainers().every((t) => s.beaten[t])),
    A('patrol10', 'Járőrvadász', 'Győzz le 10 Menta-járőrt.', 300, (s) => (s.stats.patrols || 0) >= 10),
    A('silkie', 'Silkie hőse', 'Találd meg Silkie összes elveszett játékát.', 200, (s) => !!s.flags.silkieDone),
    A('rich', 'Tele zseb', 'Legyen egyszerre 5000 érméd.', 200, (s) => s.coins >= 5000),
    A('memory', 'Fényképező memória', 'Rakd ki a Figura-memóriát legfeljebb 14 lépésből.', 300, (s) => !!s.flags.memBest && s.flags.memBest <= (TT.MEMORY_BEST_GOAL || 14)),
    A('quiz', 'Kvízkirály', 'Válaszolj helyesen mind a 8 kérdésre a Titán-kvízben.', 300, (s) => (s.flags.quizBest || 0) >= (TT.QUIZ_COUNT || 8)),
    A('pizza20', 'Pizzabajnok', 'Kapj el 20 pizzát egy Pizzafogó játékban.', 200, (s) => (s.flags.pizzaBest || 0) >= 20),
    A('daily7', 'Hűséges Titán', 'Gyűjtsd be a napi jutalmat 7 napon át egymás után.', 400, (s) => s.daily && s.daily.streak >= 7),
    A('quest10', 'Szorgalmas Titán', 'Teljesíts 10 napi küldetést.', 300, (s) => (s.stats.quests || 0) >= 10),
    A('quest50', 'Küldetésmániás', 'Teljesíts 50 napi küldetést.', 1000, (s) => (s.stats.quests || 0) >= 50),
    A('seriesRetro', 'Vissza a 80-as évekbe', 'Gyűjtsd össze a teljes Retró sorozatot (5 figura).', 600, (s) => seriesDone(s, 'retro')),
    A('seriesRad', 'Totál radikális', 'Gyűjtsd össze a teljes Radikális sorozatot (6 figura).', 1500, (s) => seriesDone(s, 'rad')),
    A('seriesSpecial', 'Különleges kiadás', 'Gyűjtsd össze mind a 6 különleges változatot.', 1200, (s) => seriesDone(s, 'special')),
    A('seriesDC', 'Igazság Ligája', 'Gyűjtsd össze mind a 6 DC vendégfigurát.', 1500, (s) => seriesDone(s, 'dc')),
    A('seriesDCV', 'Igazságtalanság Ligája', 'Gyűjtsd össze mind a 6 DC gonosz figurát.', 1500, (s) => seriesDone(s, 'dcvillains')),
    A('seriesDCH', 'Szuperhős-gyűjtő', 'Gyűjtsd össze mind a 6 DC hős figurát.', 1500, (s) => seriesDone(s, 'dcheroes')),
  ];

  // Új teljesítmények ellenőrzése és jutalmazása
  TT.checkAch = function () {
    const s = TT.save;
    if (!s) return [];
    s.ach = s.ach || {};
    const delay = TT.checkQuests ? TT.checkQuests() * 900 : 0;
    const got = [];
    for (const a of TT.ACHIEVEMENTS) {
      if (s.ach[a.id]) continue;
      let ok = false;
      try {
        ok = a.check(s);
      } catch (e) {
        ok = false;
      }
      if (ok) {
        s.ach[a.id] = Date.now();
        s.coins += a.coins;
        got.push(a);
      }
    }
    if (got.length) {
      TT.store.write();
      got.forEach((a, i) => setTimeout(() => {
        TT.audio.sfx('levelup');
        TT.ui.toast(`Teljesítmény: ${a.name} (+${a.coins})`, { color: '#7bff6b', dur: 3.2 });
      }, 300 + delay + i * 900));
    }
    return got;
  };

  // Napi jutalom: egymást követő napokon egyre több érme
  function dayKey(d) {
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  TT.dailyReward = function () {
    const s = TT.save;
    if (!s || !s.flags.tutorial) return null;
    const now = new Date();
    const today = dayKey(now);
    s.daily = s.daily || { last: null, streak: 0 };
    if (s.daily.last === today) return null;
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    s.daily.streak = s.daily.last === dayKey(y) ? s.daily.streak + 1 : 1;
    s.daily.last = today;
    const coins = 80 + 40 * Math.min(7, s.daily.streak);
    s.coins += coins;
    TT.store.write();
    setTimeout(() => {
      TT.audio.sfx('coin');
      TT.ui.toast(`Napi jutalom: +${coins} érme (${s.daily.streak}. nap egymás után)`, { color: '#ffd23f', dur: 4 });
    }, 900);
    return coins;
  };

  // Profil: statisztikák és rekordok egy helyen
  TT.openProfile = function () {
    const s = TT.save;
    const st = s.stats;
    const x = 60, y = 30, w = TT.W - 120, h = TT.H - 60;
    const owned = Object.keys(s.owned);
    const best = owned.slice().sort((a, b) => s.owned[b].lvl - s.owned[a].lvl || s.owned[b].xp - s.owned[a].xp)[0];
    const games = st.wins + st.losses;
    const cups = TT.CUPS.filter((c) => TT.cupDone(c.id)).length;
    const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
    const rows = [
      ['Játékidő', U.timeStr(s.playTime || 0)],
      ['Figurák', `${owned.length} / ${TT.FIG_LIST.length}`],
      ['Legendás figurák', String(owned.filter((id) => TT.FIG[id] && TT.FIG[id].rarity === 'legendary').length)],
      ['Kupák', `${cups} / ${TT.CUPS.length}`],
      ['Győzelem / vereség', `${st.wins} / ${st.losses} (${pct(st.wins, games)})`],
      ['Kiütött ellenfelek', String(st.kos)],
      ['Tökéletes blokkok', String(st.perfects)],
      ['Szuper támadások', String(st.supers || 0)],
      ['Legyőzött járőrök', String(st.patrols || 0)],
      ['Kibontott dobozok', String(st.boxes)],
      ['Végtelen Aréna rekord', s.endless ? s.endless + '. hullám' : '—'],
      ['Túlélő Torna győzelmek', String(s.flags.survivalWins || 0)],
      ['Pizza / memória', `${s.flags.pizzaBest ? s.flags.pizzaBest + ' pizza' : '—'} / ${s.flags.memBest ? s.flags.memBest + ' lépés' : '—'}`],
      ['Kvíz rekord', s.flags.quizBest ? `${s.flags.quizBest} / ${TT.QUIZ_COUNT || 8}` : '—'],
      ['Napi küldetések', String(st.quests || 0)],
      ['Teljesítmények', `${Object.keys(s.ach || {}).length} / ${TT.ACHIEVEMENTS.length}`],
    ];
    TT.ui.push({
      update() {
        const I = TT.input;
        if (I.hit('back') || I.hit('ok') || I.tapIn(x + w - 54, y + 10, 44, 44)) {
          TT.audio.sfx('back');
          this.close();
        }
      },
      draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(10,5,25,0.6)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.panel(ctx, x, y, w, h, { fill: '#2b1e5c', r: 18, lw: 4 });
        D.text(ctx, 'Profil: ' + (s.playerName || 'Titán'), x + 24, y + 34, { size: 28, color: '#ffd23f' });
        D.button(ctx, x + w - 54, y + 10, 44, 44, '×', { color: '#e84545', size: 26 });
        // legerősebb figura
        D.panel(ctx, x + 20, y + 66, 200, h - 90, { fill: '#3a2a7a', r: 14, lw: 2.5, shadow: false });
        D.text(ctx, 'Legerősebb figurád', x + 120, y + 88, { size: 15, align: 'center', color: '#c8b8f0', lw: 3 });
        if (best) {
          ctx.drawImage(TT.art.figureCanvas(best, 180), x + 30, y + 104, 180, 180);
          D.text(ctx, TT.FIG[best].name, x + 120, y + 302, { size: 19, align: 'center', maxWidth: 186 });
          D.text(ctx, 'Szint ' + s.owned[best].lvl + (TT.starsOf(best) ? `  ·  ${TT.starsOf(best)}★` : ''), x + 120, y + 328, { size: 16, align: 'center', color: '#ffd23f' });
        }
        D.coin(ctx, x + 70, y + h - 52, 13);
        D.text(ctx, U.fmt(s.coins), x + 90, y + h - 51, { size: 20, color: '#ffd23f' });
        // statisztikák két oszlopban
        const cx = x + 240, cw = (w - 270) / 2;
        rows.forEach(([k, v], i) => {
          const col = Math.floor(i / 8), row = i % 8;
          const rx = cx + col * (cw + 10), ry = y + 66 + row * 52;
          D.panel(ctx, rx, ry, cw, 44, { fill: row % 2 ? '#33246a' : '#3a2a7a', r: 10, lw: 2, shadow: false });
          const kw = Math.min(D.measure(ctx, k, 14), cw * 0.6);
          D.text(ctx, k, rx + 12, ry + 22, { size: 14, color: '#c8b8f0', lw: 2.5, maxWidth: cw * 0.6 });
          // az érték a maradék helyre fér: szükség esetén kisebb betűvel
          const avail = cw - 32 - kw;
          let vs = 17;
          while (vs > 11 && D.measure(ctx, v, vs) > avail) vs--;
          D.text(ctx, v, rx + cw - 12, ry + 22, { size: vs, align: 'right', color: '#ffffff', lw: 3, maxWidth: avail });
        });
        ctx.restore();
      },
    });
  };

  // Teljesítmények listája (görgethető ablak)
  TT.openAchievements = function () {
    const s = TT.save;
    s.ach = s.ach || {};
    const list = TT.ACHIEVEMENTS;
    const x = 60, y = 30, w = TT.W - 120, h = TT.H - 60;
    const cw = (w - 48) / 2, ch = 62;
    let scroll = 0, drag = null;
    const done = list.filter((a) => s.ach[a.id]).length;
    TT.ui.push({
      update() {
        const I = TT.input;
        const rows = Math.ceil(list.length / 2);
        const max = Math.max(0, rows * (ch + 10) - (h - 110));
        if (I.hit('back') || I.hit('ok') || I.tapIn(x + w - 54, y + 10, 44, 44)) {
          TT.audio.sfx('back');
          this.close();
          return;
        }
        if (I.wheel) scroll += I.wheel * 0.6;
        if (I.act('down')) scroll += 8;
        if (I.act('up')) scroll -= 8;
        for (const t of I.taps) drag = { id: t.id, y: t.y, s: scroll };
        if (drag) {
          const p = I.pointers.get(drag.id);
          if (!p) drag = null;
          else scroll = drag.s - (p.y - drag.y);
        }
        scroll = U.clamp(scroll, 0, max);
      },
      draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(10,5,25,0.6)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.panel(ctx, x, y, w, h, { fill: '#2b1e5c', r: 18, lw: 4 });
        D.text(ctx, `Teljesítmények  ${done}/${list.length}`, x + 24, y + 34, { size: 28, color: '#ffd23f' });
        D.button(ctx, x + w - 54, y + 10, 44, 44, '×', { color: '#e84545', size: 26 });
        ctx.beginPath();
        ctx.rect(x + 10, y + 64, w - 20, h - 76);
        ctx.clip();
        list.forEach((a, i) => {
          const cx = x + 16 + (i % 2) * (cw + 16), cy = y + 72 + Math.floor(i / 2) * (ch + 10) - scroll;
          if (cy > y + h || cy + ch < y + 60) return;
          const ok = !!s.ach[a.id];
          D.panel(ctx, cx, cy, cw, ch, { fill: ok ? '#2f6a3a' : '#3a2a7a', r: 12, lw: 2.5, shadow: false });
          D.star(ctx, cx + 28, cy + ch / 2, 16, 7, 5);
          ctx.fillStyle = ok ? '#ffd23f' : 'rgba(255,255,255,0.15)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#120a2c';
          ctx.stroke();
          D.text(ctx, a.name, cx + 54, cy + 20, { size: 18, color: ok ? '#ffffff' : '#e8e2ff', maxWidth: cw - 140 });
          D.text(ctx, a.desc, cx + 54, cy + 44, { size: 13, color: '#c8b8f0', lw: 2.5, maxWidth: cw - 70 });
          D.text(ctx, ok ? 'KÉSZ' : '+' + a.coins, cx + cw - 12, cy + 20, { size: 15, align: 'right', color: ok ? '#7bff6b' : '#ffd23f', lw: 3 });
        });
        ctx.restore();
      },
    });
  };
})(window.TT);
