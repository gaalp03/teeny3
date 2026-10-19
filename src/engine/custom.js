'use strict';
// Saját textúrák: a procedurális rajz helyett saját PNG-k a figurákhoz/hátterekhez.
// Két forrás:
//  1) assets/custom/manifest.json (a tools/extract_apk.py készíti a saját APK-dból)
//  2) játékon belüli import (Gyűjtemény → figura → "Saját kép"), IndexedDB-ben tárolva
(function (TT) {
  const C = { figures: {}, bg: {}, music: {}, sfx: {}, moves: {}, voice: {}, ready: false, count: 0 };
  const DB_NAME = 'tt3-custom';
  const STORE = 'tex';

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function openDb() {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      let req;
      try {
        req = indexedDB.open(DB_NAME, 1);
      } catch (e) {
        return resolve(null);
      }
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function fromManifest() {
    if (location.protocol === 'file:') return;
    let man;
    try {
      const r = await fetch('assets/custom/manifest.json', { cache: 'no-cache' });
      if (!r.ok) return;
      man = await r.json();
    } catch (e) {
      return;
    }
    const jobs = [];
    for (const [id, path] of Object.entries(man.figures || {})) {
      jobs.push(loadImage('assets/custom/' + path).then((img) => { if (img) { C.figures[id] = img; C.count++; } }));
    }
    // 3D hálók: a háttérben töltődnek, addig a figura képe látszik
    const models = Object.entries(man.models || {});
    if (models.length && TT.model3d) {
      Promise.all(models.map(([id, path]) => TT.model3d.load(id, 'assets/custom/' + path))).then(() => {
        if (TT.art) TT.art.clearCache();
      });
    }
    // zenék: csak az elérési út kell, a hangmotor tölti be, amikor először szól
    for (const [id, path] of Object.entries(man.music || {})) C.music[id] = 'assets/custom/' + path;
    for (const [id, path] of Object.entries(man.sfx || {})) C.sfx[id] = 'assets/custom/' + path;
    for (const [id, path] of Object.entries(man.moves || {})) C.moves[id] = 'assets/custom/' + path;
    for (const [fig, kinds] of Object.entries(man.voice || {})) {
      C.voice[fig] = {};
      for (const [kind, paths] of Object.entries(kinds)) C.voice[fig][kind] = paths.map((p) => 'assets/custom/' + p);
    }
    for (const [id, path] of Object.entries(man.backgrounds || {})) {
      jobs.push(loadImage('assets/custom/' + path).then((img) => { if (img) { C.bg[id] = img; C.count++; } }));
    }
    await Promise.all(jobs);
  }

  async function fromDb() {
    const db = await openDb();
    if (!db) return;
    await new Promise((resolve) => {
      let tx;
      try {
        tx = db.transaction(STORE, 'readonly');
      } catch (e) {
        return resolve();
      }
      const st = tx.objectStore(STORE);
      const req = st.openCursor();
      const jobs = [];
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) {
          const key = String(cur.key);
          const blob = cur.value;
          const url = URL.createObjectURL(blob);
          jobs.push(loadImage(url).then((img) => {
            if (!img) return;
            const [kind, id] = key.split(':');
            if (kind === 'fig') C.figures[id] = img;
            else if (kind === 'bg') C.bg[id] = img;
            C.count++;
          }));
          cur.continue();
        } else Promise.all(jobs).then(resolve);
      };
      req.onerror = () => resolve();
    });
  }

  C.init = async function () {
    await fromManifest();
    await fromDb();
    C.ready = true;
    // ha a betöltés lassabb volt az indításnál kivárt időnél, a már elkészült figuraképek elavultak
    if (C.count && TT.art) TT.art.clearCache();
  };

  // Fájlválasztó megnyitása és a kép eltárolása egy figurához
  C.pickFor = function (kind, id, done) {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/png,image/webp,image/jpeg,image/gif';
    inp.onchange = async () => {
      const file = inp.files && inp.files[0];
      if (!file) return;
      const img = await loadImage(URL.createObjectURL(file));
      if (!img) {
        if (done) done(false);
        return;
      }
      if (kind === 'fig') C.figures[id] = img;
      else C.bg[id] = img;
      TT.art.clearCache();
      const db = await openDb();
      if (db) {
        try {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(file, kind + ':' + id);
        } catch (e) { /* csak erre a munkamenetre marad meg */ }
      }
      if (done) done(true);
    };
    inp.click();
  };

  C.remove = async function (kind, id) {
    if (kind === 'fig') delete C.figures[id];
    else delete C.bg[id];
    TT.art.clearCache();
    const db = await openDb();
    if (!db) return;
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(kind + ':' + id);
    } catch (e) { /* nem baj */ }
  };

  TT.custom = C;
})(window.TT);
