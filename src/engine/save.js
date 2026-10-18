'use strict';
// Mentés kezelése (localStorage, hibatűrően).
(function (TT) {
  const KEY = 'teeny-titans-3-save';
  const SKEY = 'teeny-titans-3-settings';

  function defaults() {
    return {
      v: 1,
      coins: 250,
      owned: {},
      team: ['robin', 'raven', 'beastboy'],
      flags: {},
      cups: {},
      cupStep: {},
      found: {},
      beaten: {},
      pos: null,
      stats: { wins: 0, losses: 0, boxes: 0, perfects: 0, kos: 0, supers: 0, swaps: 0, items: 0, trains: 0, pizzaGames: 0, memGames: 0, quizGames: 0, quests: 0 },
      endless: 0,
      items: { pizza: 2, energy: 1, cleanse: 1 },
      playTime: 0,
      created: Date.now(),
    };
  }

  function defaultSettings() {
    return { music: 0.5, sfx: 0.7, muted: false, shake: true, hints: true };
  }

  const S = {};

  S.load = function () {
    let data = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      data = null;
    }
    let settings = defaultSettings();
    try {
      const raw = localStorage.getItem(SKEY);
      if (raw) settings = Object.assign(settings, JSON.parse(raw));
    } catch (e) { /* alapértelmezett */ }
    TT.settings = settings;
    if (data && data.v === 1) {
      TT.save = Object.assign(defaults(), data);
      TT.save.stats = Object.assign(defaults().stats, data.stats || {});
      TT.save.settings = settings;
      return true;
    }
    TT.save = null;
    return false;
  };

  S.hasSave = function () {
    try {
      return !!localStorage.getItem(KEY);
    } catch (e) {
      return false;
    }
  };

  S.newGame = function () {
    TT.save = defaults();
    TT.save.settings = TT.settings || defaultSettings();
    for (const id of TT.save.team) TT.save.owned[id] = { lvl: 1, xp: 0, n: 1 };
    S.write();
  };

  S.write = function () {
    if (!TT.save) return false;
    try {
      const copy = Object.assign({}, TT.save);
      delete copy.settings;
      localStorage.setItem(KEY, JSON.stringify(copy));
      return true;
    } catch (e) {
      return false;
    }
  };

  S.writeSettings = function () {
    try {
      localStorage.setItem(SKEY, JSON.stringify(TT.settings));
    } catch (e) { /* nem baj */ }
    if (TT.save) TT.save.settings = TT.settings;
    TT.audio.applyVolumes();
  };

  S.wipe = function () {
    try {
      localStorage.removeItem(KEY);
    } catch (e) { /* nem baj */ }
    TT.save = null;
  };

  // Mentés exportálása/importálása szövegként (telefonok közötti átvitelhez)
  S.exportString = function () {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(TT.save))));
    } catch (e) {
      return '';
    }
  };
  S.importString = function (str) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
      if (data && data.v === 1) {
        localStorage.setItem(KEY, JSON.stringify(data));
        return S.load();
      }
    } catch (e) { /* hibás kód */ }
    return false;
  };

  TT.store = S;
  TT.settings = defaultSettings();
})(window.TT);
