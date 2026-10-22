'use strict';
// Szezonális események: Halloween (tökvadászat) és Karácsony (ajándékvadászat).
(function (TT) {
  TT.EVENTS = [
    {
      id: 'halloween', name: 'Halloween', from: [10, 15], to: [11, 5], color: '#ff8c1a',
      item: 'tök', itemName: 'Tök', itemAcc: 'tököt', reward: 'robin_vamp', coins: 500,
      spots: [[10, 28], [24, 31], [28, 38], [31, 50], [44, 44], [55, 25], [58, 36], [72, 47], [82, 40], [85, 24]],
      intro: 'Halloween van Jump Cityben! Gyűjts össze 10 tököt a városban egy Vámpír Robin figuráért!',
    },
    {
      id: 'xmas', name: 'Karácsony', from: [12, 10], to: [1, 6], color: '#d62828',
      item: 'ajándék', itemName: 'Ajándék', itemAcc: 'ajándékot', reward: 'bb_reindeer', coins: 500,
      spots: [[14, 31], [20, 44], [31, 24], [40, 47], [48, 28], [55, 50], [58, 22], [66, 31], [78, 44], [85, 52]],
      intro: 'Karácsony van! Mr. Mint becsomagolta a város ajándékait. Szerezz vissza 10-et egy Rénszarvas Beast Boy figuráért!',
    },
  ];

  function inRange(d, from, to) {
    const md = (d.getMonth() + 1) * 100 + d.getDate();
    const a = from[0] * 100 + from[1], b = to[0] * 100 + to[1];
    return a <= b ? md >= a && md <= b : md >= a || md <= b;
  }

  TT.activeEvent = function () {
    const forced = TT.settings && TT.settings.forceEvent;
    if (forced) return TT.EVENTS.find((e) => e.id === forced) || null;
    const d = new Date();
    return TT.EVENTS.find((e) => inRange(d, e.from, e.to)) || null;
  };

  // Időjárás: háromórás blokkonként sorsolva, mindenkinél ugyanaz ('clear' | 'rain' | 'storm')
  TT.weatherNow = function () {
    const st = TT.settings || {};
    if (st.forceWeather) return st.forceWeather;
    if (st.weather === 'off') return 'clear';
    const ev = TT.activeEvent();
    if (ev && ev.id === 'xmas') return 'clear';
    const d = new Date();
    const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ':' + Math.floor(d.getHours() / 3);
    const r = TT.U.rng(TT.U.hash('weather:' + key))();
    return r < 0.07 ? 'storm' : r < 0.24 ? 'rain' : 'clear';
  };

  // Az esemény állapota az aktuális szezonra (évente újraindul)
  TT.eventState = function (ev) {
    const s = TT.save;
    const d = new Date();
    const season = ev.from[0] > ev.to[0] && d.getMonth() + 1 <= ev.to[0] ? d.getFullYear() - 1 : d.getFullYear();
    s.events = s.events || {};
    const key = ev.id + season;
    s.events[key] = s.events[key] || { found: {}, done: false };
    return s.events[key];
  };
})(window.TT);
