# Saját textúrák

Ide kerülnek a saját képeid. A mappa tartalmát (ezen a fájlon kívül) a `.gitignore` kizárja,
mert az eredeti játékból kinyert képek szerzői jogvédettek — csak a saját gépeden használd őket.

## Két út

**1. Játékon belül (telefonon is):** Gyűjtemény → válassz figurát → *Saját kép* → tallózz egy PNG-t.
A kép a böngésző tárhelyére mentődik, és onnantól azt látod a figura helyett.

**2. APK-ból, tömegesen (gépen):**

```bash
pip install UnityPy                                   # Unity alapú APK-hoz
python3 tools/extract_apk.py extract sajat_jatek.apk  # képek → assets/custom/raw/
# nézd át: assets/custom/raw/index.html
cp assets/custom/map.example.json assets/custom/map.json   # írd be a fájlneveket
python3 tools/extract_apk.py map assets/custom/map.json    # → assets/custom/manifest.json
python3 -m http.server 8000                           # majd http://localhost:8000
```

`manifest.json` formátum:

```json
{
  "figures": { "robin": "figures/robin.png", "raven": "figures/raven.png" },
  "backgrounds": { "dome": "bg/dome.png" }
}
```

Figura azonosítók: lásd `src/data/figures.js` (pl. `robin`, `raven`, `beastboy`, `cyborg`, `starfire`, `slade`, `mrmint`…).
Háttér kulcsok: `dome`, `tower`, `park`, `street`, `beach`, `hive`, `vault`.

A figura képe álló, átlátszó hátterű PNG legyen; a játék a talapzatra állítja és magasságra méretezi.
