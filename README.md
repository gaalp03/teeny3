# Teeny Titans 3 – rajongói kiadás

Nem hivatalos, rajongói folytatás a Teeny Titans játékokhoz. Böngészőben fut (gépen és
telefonon is), offline is működik, és Android APK is készül belőle.

Gyűjts Teeny figurákat, harcolj 3v3 csapatcsatákban a Csatakupolában, és állítsd meg
**Mr. Mintet**, aki Jump City összes figuráját bontatlanul, dobozban akarja tartani — örökre.

## Mi van benne

- **93 gyűjthető figura** (Titánok, változatok, a Retró és a Radikális sorozat, különleges TT2-változatok (pl. Nightwing), DC vendégek (Superman, Wonder Woman, Joker…), DC gonoszok (Lex Luthor, Darkseid, Rébusz…), DC hősök (Flash, Aquaman, Shazam…), Titánok Kelet, H.I.V.E., gonoszok, Gonosz Testvériség, az új
  Menta-banda, valamint Mad Mod, Killer Moth és Larry), mind kódból rajzolva, 4 ritkasággal és 4 típussal (Erő › Tech › Misztikus › Gyorsaság › Erő)
- **Csillagszint** a dupla figurákból, **csapatbónusz** azonos csapatú figurákkal, **barátság-kombók**
  (pl. Robin + Starfire szuper támadásnál a társ is beugrik), **passzív képességek**
- **Valós idejű harcrendszer**: töltődő támadások, blokk és *tökéletes blokk* (a zöld körnél),
  csere a pihenő figurákra, szuper támadás, állapotok (égés, méreg, kábulat, pajzs, erősítés…)
- **Bejárható Jump City**: Titánok Tornya, Teeny Játékbolt, Csatakupola, Pizzéria, Képregénybolt,
  park, strand, kikötő, H.I.V.E. negyed és Mr. Mint trezorja — edzőkkel, rejtett figurákkal, érmékkel
- **4 kupa + utójáték (Testvériség Kupa, Végtelen Aréna, éjszakai Red X, végső főellenség: Trigon)**, történet, stáblista
- **Túlélő Torna** (naponta 5 harc gyógyulás nélkül), **Heti kihívás** (hetente új szabály, pl. csak Misztikus
  figurák vagy kellékek nélkül), főellenségek **2. fázissal**
- **Harci kellékek** (pizzaszelet, energiaital, tisztító spray), **Festőműhely** (arany, neon… figurák)
- **Menta Gyár**: háromszintes kazamata futószalagokkal, gombokkal, robotokkal és kincsesládákkal
- **Blokk-edzés** minijáték a Toronyban, **szezonális események** (Halloween, Karácsony)
- **Bejárható Titánok Tornya** figuravitrinnel, **Pizzafogó**, **Figura-memória** és **Titán-kvíz** minijáték, **Silkie-mellékküldetés**
- **Menta-járőrök** és autók a városban, **valós napszak** (este besötétedik) és **időjárás** (eső, vihar villámlással)
- **54 teljesítmény** (köztük a teljes sorozatokért járók), **profil és rekordok**, **napi küldetések** (3 feladat naponta, bónusszal), napi jutalom, automatikus harc és gyorsítás (×1.6) gyakorláshoz
- **Vakdobozok** a boltban (Alap / Prémium / Legendás), duplikátumokból tapasztalat
- Szintlépés (max. 30), edzés, pizzaparti, gyűjtői jutalmak
- Szintetizált zene és hangok, magyar felület, mentés automatikusan, 3 nehézségi szint
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

Minden pushnál a GitHub Actions lefordít egy APK-t, és feltölti a **Releases → „legujabb”** kiadásba
(`TeenyTitans3.apk`). Telefonon: nyisd meg a repót a böngészőben, Releases, töltsd le és telepítsd
(engedélyezd az ismeretlen forrásból való telepítést). Az új verzió frissítésként települ, a mentés megmarad.

Saját textúrákkal: a saját APK-dat (vagy `.xapk`/`.apks` fájlodat) 25 MB alatt töltsd fel az `apk-forras` ág
`apk/` mappájába, nagyobbat csatolj egy `apk-forras` címkéjű kiadáshoz (Releases → Draft a new release).
A build kinyeri a képeket, előnézetet tesz az `apk-forras` ágra (`apk/kepek`), és az `apk/map.json` szerinti
párosítás után az APK már ezekkel a képekkel készül. Részletek: az `apk-forras` ág `apk/README.md` fájlja.

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
| Napi küldetések | Q (városban) | bal felső „Napi” gomb |
| Gyors utazás | térkép (M), kattintás a kék épületnévre | térkép gomb, koppintás a kék épületnévre |
| Támadások | 1, 2, 3 (J, K, L) | kártyák alul |
| Szuper | R / 4 | SZUPER gomb |
| Blokk | Szóköz (tartsd) | BLOKK gomb (tartsd) |
| Csere | Q / E | bal felső kis portrék |
| Auto harc / gyorsítás | T / G | AUTO és ×1 gombok fent |
| Figura-adatlap (harcban) | C | koppintás a felső névpanelre |

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
