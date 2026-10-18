# Ide jön a saját APK-d

Ez az ág csak a **saját** Teeny Titans 2 APK-dnak (vagy `.xapk` / `.apks` fájlodnak) való,
hogy a Teeny Titans 3 Android verziója az eredeti figuraképeket használhassa.
A repó privát, a képek csak a te APK buildedbe kerülnek, a kódágra és a webes verzióba nem.

## Ha a fájl 25 MB-nál kisebb

GitHub → ez az ág (**apk-forras**) → `apk` mappa → **Add file → Upload files** → húzd be a fájlt → **Commit changes**.

## Ha nagyobb (a játékok APK-ja általában ilyen)

A böngészős feltöltés 25 MB-ig megy, ezért nagy fájlnál kiadáshoz csatold:

1. GitHub → a repó főoldalán jobb oldalt **Releases** → **Draft a new release**
2. **Choose a tag** → írd be: `apk-forras` → **Create new tag**
3. Lent az **Attach binaries** részhez húzd be az APK-t (2 GB-ig jó)
4. Pipáld be a **Set as a pre-release**-t → **Publish release**

## Utána nincs dolgod

A következő build kinyeri a képeket, és ide, az `apk/kepek` mappába feltölt egy kicsinyített előnézetet.
Ebből párosítom a figurákat (`apk/map.json`), és a következő APK már az eredeti képekkel készül.
