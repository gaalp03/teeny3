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

  // Android (Capacitor): a hardveres vissza gomb a játék "Vissza/Menü" gombjaként működik
  function setupNativeBack() {
    const cap = window.Capacitor;
    const App = cap && cap.Plugins && cap.Plugins.App;
    if (!App || !App.addListener) return;
    App.addListener('backButton', () => {
      if (TT.sceneName === 'title' && !TT.ui.overlayActive()) {
        App.exitApp();
        return;
      }
      const opts = { code: 'Escape', key: 'Escape', bubbles: true };
      window.dispatchEvent(new KeyboardEvent('keydown', opts));
      setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', opts)), 60);
    });
    App.addListener('pause', () => TT.store.write());
  }
  window.addEventListener('load', setupNativeBack);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  window.addEventListener('load', boot);
})(window.TT);
