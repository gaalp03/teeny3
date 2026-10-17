'use strict';
// Indítás: mentés és beállítások betöltése, saját textúrák, betűtípus, majd a címképernyő.
(function (TT) {
  async function boot() {
    TT.store.load();
    try {
      await Promise.race([
        document.fonts.load(TT.font(20), 'aőű'),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch (e) { /* tartalék betűtípus */ }
    try {
      await Promise.race([TT.custom.init(), new Promise((r) => setTimeout(r, 2500))]);
    } catch (e) { /* saját textúrák nélkül */ }
    TT.audio.applyVolumes();
    TT.start('title');
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  window.addEventListener('load', boot);
})(window.TT);
