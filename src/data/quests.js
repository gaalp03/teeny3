'use strict';
// Napi küldetések: minden nap 3 új feladat, a haladás a statisztikák napi növekedéséből jön.
(function (TT) {
  const U = TT.U;
  const D = TT.D;

  // stat: melyik TT.save.stats mezőt figyeli, goal: mennyit kell növelni rajta
  const Q = (id, text, stat, goal, coins) => ({ id, text, stat, goal, coins });
  TT.QUESTS = [
    Q('wins', 'Nyerj meg 3 harcot', 'wins', 3, 150),
    Q('perfects', 'Hajts végre 6 tökéletes blokkot', 'perfects', 6, 150),
    Q('kos', 'Üss ki 10 ellenfél figurát', 'kos', 10, 120),
    Q('patrols', 'Győzz le 2 Menta-járőrt', 'patrols', 2, 140),
    Q('supers', 'Használj 4 szuper támadást', 'supers', 4, 120),
    Q('swaps', 'Cserélj figurát harc közben 5-ször', 'swaps', 5, 100),
    Q('items', 'Használj 2 harci kelléket', 'items', 2, 100),
    Q('boxes', 'Bonts ki 1 vakdobozt', 'boxes', 1, 120),
    Q('trains', 'Végezz el 1 Blokk-edzést a Toronyban', 'trains', 1, 100),
    Q('pizza', 'Játssz 1 Pizzafogót a Pizzériában', 'pizzaGames', 1, 100),
  ];
  const BONUS_COINS = 250;
  const PER_DAY = 3;

  function dayKey(d) {
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  const statOf = (s, k) => s.stats[k] || 0;

  // A mai küldetések (szükség esetén újak sorsolása)
  TT.questsToday = function () {
    const s = TT.save;
    if (!s || !s.flags.tutorial) return null;
    const today = dayKey(new Date());
    if (s.quests && s.quests.date === today) return s.quests;
    const rnd = U.rng(U.hash(today + ':' + (s.created || 0)));
    const ids = U.shuffle(TT.QUESTS.map((q) => q.id), rnd).slice(0, PER_DAY);
    s.quests = {
      date: today,
      bonus: false,
      list: ids.map((id) => {
        const q = TT.QUESTS.find((x) => x.id === id);
        return { id, base: statOf(s, q.stat), done: false };
      }),
    };
    TT.store.write();
    return s.quests;
  };

  TT.questProgress = function (e) {
    const q = TT.QUESTS.find((x) => x.id === e.id);
    if (!q) return { q: { text: '?', goal: 1, coins: 0 }, n: 0 };
    return { q, n: e.done ? q.goal : U.clamp(statOf(TT.save, q.stat) - e.base, 0, q.goal) };
  };

  // Teljesített küldetések jutalmazása; a megjelenített értesítések számát adja vissza
  TT.checkQuests = function () {
    const s = TT.save;
    const qs = TT.questsToday();
    if (!qs) return 0;
    const msgs = [];
    for (const e of qs.list) {
      if (e.done) continue;
      const { q, n } = TT.questProgress(e);
      if (n < q.goal) continue;
      e.done = true;
      s.coins += q.coins;
      s.stats.quests = (s.stats.quests || 0) + 1;
      msgs.push(`Napi küldetés kész: ${q.text} (+${q.coins})`);
    }
    if (!qs.bonus && qs.list.every((e) => e.done)) {
      qs.bonus = true;
      s.coins += BONUS_COINS;
      const item = U.pick(Object.keys(TT.ITEMS));
      let extra = '';
      if ((s.items[item] || 0) < TT.ITEM_MAX) {
        s.items[item] = (s.items[item] || 0) + 1;
        extra = ' és 1 ' + TT.ITEMS[item].name;
      }
      qs.bonusItem = extra ? item : null;
      msgs.push(`Minden napi küldetés kész! +${BONUS_COINS}${extra}`);
    }
    if (!msgs.length) return 0;
    TT.store.write();
    msgs.forEach((m, i) => setTimeout(() => {
      TT.audio.sfx('coin');
      TT.ui.toast(m, { color: '#9be7ff', dur: 3.4 });
    }, 300 + i * 900));
    return msgs.length;
  };

  TT.questSummary = function () {
    const qs = TT.questsToday();
    if (!qs) return null;
    return { done: qs.list.filter((e) => e.done).length, total: qs.list.length };
  };

  // Napi küldetések ablak
  TT.openQuests = function () {
    const qs = TT.questsToday();
    if (!qs) {
      TT.ui.toast('A napi küldetések az oktatóharc után nyílnak meg.', { color: '#ff8a80' });
      return;
    }
    const w = 620, h = 400, x = (TT.W - w) / 2, y = (TT.H - h) / 2;
    TT.ui.push({
      update() {
        const I = TT.input;
        if (I.hit('back') || I.hit('ok') || I.tapIn(x + w - 54, y + 10, 44, 44) || I.tapIn(x + w / 2 - 90, y + h - 62, 180, 48)) {
          TT.audio.sfx('back');
          this.close();
        }
      },
      draw(ctx) {
        const now = new Date();
        const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        ctx.save();
        ctx.fillStyle = 'rgba(10,5,25,0.6)';
        ctx.fillRect(0, 0, TT.W, TT.H);
        D.panel(ctx, x, y, w, h, { fill: '#2b1e5c', r: 18, lw: 4 });
        D.text(ctx, 'Napi küldetések', x + 24, y + 34, { size: 28, color: '#9be7ff' });
        D.text(ctx, 'Új feladatok: ' + U.timeStr((mid - now) / 1000) + ' múlva', x + 26, y + 62, { size: 14, color: '#c8b8f0', lw: 2.5 });
        D.button(ctx, x + w - 54, y + 10, 44, 44, '×', { color: '#e84545', size: 26 });
        qs.list.forEach((e, i) => {
          const { q, n } = TT.questProgress(e);
          const ry = y + 80 + i * 68;
          D.panel(ctx, x + 18, ry, w - 36, 58, { fill: e.done ? '#2f6a3a' : '#3a2a7a', r: 12, lw: 2.5, shadow: false });
          D.star(ctx, x + 46, ry + 29, 16, 7, 5);
          ctx.fillStyle = e.done ? '#ffd23f' : 'rgba(255,255,255,0.15)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#120a2c';
          ctx.stroke();
          D.text(ctx, q.text, x + 72, ry + 19, { size: 17, color: '#ffffff', maxWidth: w - 230 });
          D.bar(ctx, x + 72, ry + 34, w - 250, 14, n / q.goal, { color: e.done ? '#7bff6b' : '#3fa7ff' });
          D.text(ctx, `${n}/${q.goal}`, x + w - 168, ry + 42, { size: 14, color: '#fff8e0', lw: 2.5 });
          if (e.done) D.text(ctx, 'KÉSZ', x + w - 32, ry + 30, { size: 18, align: 'right', color: '#7bff6b', lw: 3 });
          else {
            D.coin(ctx, x + w - 92, ry + 30, 10);
            D.text(ctx, '+' + q.coins, x + w - 32, ry + 31, { size: 18, align: 'right', color: '#ffd23f', lw: 3 });
          }
        });
        const by = y + 288;
        const bonusTxt = qs.bonus
          ? 'Bónusz begyűjtve: +' + BONUS_COINS + ' érme' + (qs.bonusItem ? ' és 1 ' + TT.ITEMS[qs.bonusItem].name : '')
          : 'Mind a 3 kész: +' + BONUS_COINS + ' érme és egy meglepetés kellék';
        D.text(ctx, bonusTxt, TT.W / 2, by + 12, { size: 16, align: 'center', color: qs.bonus ? '#7bff6b' : '#ffd23f', lw: 3 });
        D.button(ctx, x + w / 2 - 90, y + h - 62, 180, 48, 'Rendben', { color: '#6c5ce7', size: 20 });
        ctx.restore();
      },
    });
  };
})(window.TT);
