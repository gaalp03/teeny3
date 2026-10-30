'use strict';
// Típusok, ritkaságok, állapotok és a szintlépés képletei.
(function (TT) {
  // Erő > Tech > Misztikus > Gyorsaság > Erő
  TT.TYPES = {
    brawn: { name: 'Erő', color: '#e84545', beats: 'tech' },
    tech: { name: 'Tech', color: '#3fa7ff', beats: 'mystic' },
    mystic: { name: 'Misztikus', color: '#a35cff', beats: 'speed' },
    speed: { name: 'Gyorsaság', color: '#f2b705', beats: 'brawn' },
  };
  // egy csapat fő típusa és az, ami ellene hatásos ({main, counter}, vagy null)
  TT.counterType = function (team) {
    const count = {};
    for (const t of team) {
      const f = TT.FIG[t.id || t];
      if (f) count[f.type] = (count[f.type] || 0) + 1;
    }
    const main = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
    const counter = main && Object.keys(TT.TYPES).find((k) => TT.TYPES[k].beats === main);
    return counter ? { main, counter } : null;
  };

  TT.typeMult = function (atk, def) {
    if (!atk || !def) return 1;
    if (TT.TYPES[atk].beats === def) return 1.3;
    if (TT.TYPES[def].beats === atk) return 0.8;
    return 1;
  };

  // Ritkasági kör: Gyakori > Legendás > Epikus > Ritka > Gyakori (a kicsik is be tudnak húzni a nagyoknak)
  TT.RARITY = {
    common: { name: 'Gyakori', color: '#c3ccd6', stars: 1, mult: 1.0, dupeXp: 90, ring: '#8d99a6', order: 0, beats: 'legendary' },
    rare: { name: 'Ritka', color: '#3fa7ff', stars: 2, mult: 1.06, dupeXp: 180, ring: '#2f7fd1', order: 1, beats: 'common' },
    epic: { name: 'Epikus', color: '#c06bff', stars: 3, mult: 1.12, dupeXp: 360, ring: '#8e3fd6', order: 2, beats: 'rare' },
    legendary: { name: 'Legendás', color: '#ffc93c', stars: 4, mult: 1.18, dupeXp: 720, ring: '#e09b00', order: 3, beats: 'epic' },
  };
  TT.rarityMult = function (atk, def) {
    if (!atk || !def || !TT.RARITY[atk] || !TT.RARITY[def]) return 1;
    if (TT.RARITY[atk].beats === def) return 1.15;
    if (TT.RARITY[def].beats === atk) return 0.9;
    return 1;
  };
  // típus és ritkaság együtt (a harc sebzése és a tippek ezt használják)
  TT.matchMult = (a, b) => TT.typeMult(a.type, b.type) * TT.rarityMult(a.rarity, b.rarity);

  TT.STATUS = {
    burn: { name: 'Égés', color: '#ff6b35', good: false, desc: 'Másodpercenként sebez.' },
    poison: { name: 'Méreg', color: '#7bd65b', good: false, desc: 'Másodpercenként sebez, erősebben.' },
    slow: { name: 'Lassítás', color: '#7fd3ff', good: false, desc: 'A támadások lassabban töltődnek.' },
    stun: { name: 'Kábulat', color: '#ffe066', good: false, desc: 'Nem tud cselekedni.' },
    weak: { name: 'Gyengítés', color: '#b07cff', good: false, desc: 'Kevesebbet sebez.' },
    mark: { name: 'Célpont', color: '#ff4f81', good: false, desc: 'Több sebzést kap.' },
    shield: { name: 'Pajzs', color: '#9be7ff', good: true, desc: 'Elnyeli a sebzést.' },
    atkUp: { name: 'Erő+', color: '#ff8c42', good: true, desc: 'Többet sebez.' },
    defUp: { name: 'Védelem+', color: '#5ab0ff', good: true, desc: 'Kevesebb sebzést kap.' },
    regen: { name: 'Gyógyulás', color: '#6ee06e', good: true, desc: 'Folyamatosan gyógyul.' },
    haste: { name: 'Gyorsítás', color: '#ffd23f', good: true, desc: 'A támadások gyorsabban töltődnek.' },
  };

  // Passzív képességek (minden figurának van egy)
  TT.PASSIVES = {
    leader: { name: 'Vezér', desc: '+20% szupermérő-töltődés.' },
    armor: { name: 'Páncél', desc: '12%-kal kevesebb sebzést kap.' },
    regen: { name: 'Regeneráció', desc: 'Harcban másodpercenként 0,6% HP-t gyógyul.' },
    swift: { name: 'Fürgeség', desc: 'A támadások 10%-kal gyorsabban töltődnek.' },
    crit: { name: 'Gyenge pont', desc: '+12% esély kritikus találatra.' },
    thorns: { name: 'Tüskék', desc: 'A közelharci sebzés 15%-át visszaadja.' },
    burnplus: { name: 'Átok', desc: 'Az okozott rossz állapotok 40%-kal tovább tartanak.' },
    berserk: { name: 'Düh', desc: '+30% sebzés, ha a HP 35% alatt van.' },
    lucky: { name: 'Szerencse', desc: '10% esély, hogy kitér egy találat elől.' },
    firstwind: { name: 'Lendület', desc: '40%-os szupermérővel kezdi a harcot.' },
    vampire: { name: 'Életszívás', desc: 'Az okozott sebzés 10%-át visszagyógyítja.' },
    shieldstart: { name: 'Előpajzs', desc: 'Harc elején 12%-os pajzsot kap.' },
  };
  const DEFAULT_PASSIVE = { brawn: 'berserk', tech: 'armor', mystic: 'vampire', speed: 'swift' };
  TT.passiveOf = (fig) => fig.passive || DEFAULT_PASSIVE[fig.type];

  TT.MAX_LVL = 30;
  TT.xpToNext = (lvl) => Math.round(40 + lvl * 20 + lvl * lvl * 1.6);
  TT.lvlFactor = (lvl) => 1 + (lvl - 1) * 0.07;

  // Végső értékek egy figurára adott szinten.
  // A sebzés a támadó szintjével skálázódik (lvlFactor), a HP a védekezőével.
  // stars: duplikátumokból szerzett csillagszint (0–5), mult: egyéb szorzó (pl. csapatbónusz)
  TT.statsFor = function (fig, lvl, stars, mult) {
    const r = TT.RARITY[fig.rarity].mult * (1 + (stars || 0) * TT.STAR_BONUS) * (mult || 1);
    const lf = TT.lvlFactor(lvl);
    return {
      hp: Math.round(fig.hp * 2.5 * r * lf),
      atk: fig.atk * r,
      def: fig.def * TT.RARITY[fig.rarity].mult,
      spd: fig.spd,
      lf,
    };
  };

  TT.MAX_STARS = 5;
  TT.STAR_BONUS = 0.04;
  TT.starsOf = function (id) {
    const o = TT.save && TT.save.owned[id];
    return o ? Math.min(TT.MAX_STARS, (o.n || 1) - 1) : 0;
  };

  // Csapatbónusz: azonos csapatból 2 figura +6%, 3 figura +12% (HP és támadás)
  TT.synergy = function (ids) {
    const count = {};
    for (const id of ids) {
      const t = TT.FIG[id] && TT.FIG[id].team;
      if (t) count[t] = (count[t] || 0) + 1;
    }
    let best = null;
    for (const [team, n] of Object.entries(count)) {
      if (n >= 2 && (!best || n > best.n)) best = { team, n, bonus: n >= 3 ? 0.12 : 0.06 };
    }
    return best;
  };

  // Összesített "erő" pontszám a gyűjtemény rendezéséhez
  TT.power = function (fig, lvl) {
    const s = TT.statsFor(fig, lvl);
    return Math.round((s.hp * 0.5 + (s.atk * 10 + s.def * 8) * s.lf + s.spd * 5));
  };
})(window.TT);
