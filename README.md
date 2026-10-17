# Teeny Titans 3 – rajongói kiadás

Nem hivatalos, rajongói folytatás a Teeny Titans játékokhoz. Böngészőben fut (gépen és
telefonon is), offline is működik, és Android APK is készül belőle.

Gyűjts Teeny figurákat, harcolj 3v3 csapatcsatákban a Csatakupolában, és állítsd meg
**Mr. Mintet**, aki Jump City összes figuráját bontatlanul, dobozban akarja tartani — örökre.

## Mi van benne

- **43 gyűjthető figura** (Titánok, változatok, Titánok Kelet, H.I.V.E., gonoszok és az új Menta-banda),
  mind kódból rajzolva, 4 ritkasággal és 4 típussal (Erő › Tech › Misztikus › Gyorsaság › Erő)
- **Valós idejű harcrendszer**: töltődő támadások, blokk és *tökéletes blokk* (a zöld körnél),
  csere a pihenő figurákra, szuper támadás, állapotok (égés, méreg, kábulat, pajzs, erősítés…)
- **Bejárható Jump City**: Titánok Tornya, Teeny Játékbolt, Csatakupola, Pizzéria, Képregénybolt,
  park, strand, kikötő, H.I.V.E. negyed és Mr. Mint trezorja — edzőkkel, rejtett figurákkal, érmékkel
- **4 kupa + Végtelen Aréna**, történet, stáblista
- **Vakdobozok** a boltban (Alap / Prémium / Legendás), duplikátumokból tapasztalat
- Szintlépés (max. 30), edzés, pizzaparti, gyűjtői jutalmak
- Szintetizált zene és hangok, magyar felület, mentés automatikusan
- Billentyűzet, egér, érintés és kontroller támogatás

## Indítás

Gépen: nyisd meg az `index.html`-t, vagy (ajánlott, így működik a mentés és az offline mód is):

```bash
npm start            # http://localhost:8000
# vagy: python3 -m http.server 8000
```

Telefonon: a GitHub Pages verziót megnyitva Chrome-ban → ⋮ → *Hozzáadás a kezdőképernyőhöz*.
A Pages bekapcsolása: Settings → Pages → Source: *GitHub Actions*, majd Actions → *Web verzió (GitHub Pages)* → Run workflow.

## Android APK

Minden pushnál a GitHub Actions lefordít egy APK-t: **Actions → Android APK → a futás alján
„teeny-titans-3-apk”** letöltés. Telefonon engedélyezd az ismeretlen forrásból telepítést.

Saját gépen (Android SDK + JDK 17 kell):

```bash
npm ci
npm run android
cd android && ./gradlew assembleDebug
```

## Irányítás

| | Billentyűzet | Érintés |
|---|---|---|
| Mozgás | WASD / nyilak, Shift = futás | bal oldalon húzd az ujjad |
| Beszéd / belépés | E / Enter / Szóköz | A gomb |
| Menü / térkép | Esc / M | jobb felső gombok |
| Támadások | 1, 2, 3 (J, K, L) | kártyák alul |
| Szuper | R / 4 | SZUPER gomb |
| Blokk | Szóköz (tartsd) | BLOKK gomb (tartsd) |
| Csere | Q / E | bal felső kis portrék |

Tipp: a bejövő támadásnál zsugorodó kör jelenik meg a figurád körül. Ha akkor kezded a blokkot,
amikor **zöld**, tökéletes blokk lesz: nulla sebzés, a közelharcos támadó pedig megszédül.

## Saját textúrák (pl. a saját Teeny Titans 2 APK-dból)

A játék alapból nem tartalmaz eredeti, szerzői jogvédett képeket — minden kódból rajzolódik.
Ha szeretnéd az eredeti figurák képeit látni, a **saját** APK-dból kinyerheted őket:

```bash
pip install UnityPy
python3 tools/extract_apk.py extract teeny_titans_2.apk
```

Részletek: [assets/custom/README.md](assets/custom/README.md). Telefonon a Gyűjteményben
figuránként is beállíthatsz saját képet (*Saját kép* gomb). A kinyert képek nem kerülnek fel a repóba.

## Felépítés

```
index.html            belépési pont
src/engine/           vászon, bemenet, hang, UI, mentés, saját textúrák
src/data/             típusok, támadások, figurák, kupák/edzők, térkép
src/art/              figura-, csempe-, épület- és háttérrajzolás
src/scenes/           címképernyő, város, harc, bolt, Csatakupola, gyűjtemény, stáblista
tools/extract_apk.py  textúra-kinyerő saját APK-hoz
scripts/              www/ összeállítás és Android beállítás
```

A Teen Titans Go! és a szereplők a Warner Bros. / Cartoon Network tulajdonai. Ez egy nem
kereskedelmi rajongói projekt, nem kapcsolódik hozzájuk.
