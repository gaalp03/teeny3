#!/usr/bin/env python3
"""Saját APK-ból textúrák kinyerése a Teeny Titans 3 rajongói játékhoz.

A játék alapból minden figurát kódból rajzol. Ha van egy saját, legálisan
megszerzett APK-d (pl. a saját telefonodról lementett Teeny Titans 2), ezzel a
szkripttel kinyerheted belőle a képeket, és a játék a saját gépeden azokat
használja a procedurális rajz helyett.

A kinyert fájlok az assets/custom/ mappába kerülnek, amit a .gitignore kizár —
szerzői jogvédett anyag ne kerüljön fel a repóba.

Használat:
  1) Kinyerés:   python3 tools/extract_apk.py extract teeny_titans_2.apk
  2) Böngészés:  nyisd meg az assets/custom/raw/index.html-t, keresd meg a figurák képeit
  3) Párosítás:  másold a map.example.json-t map.json-ra, írd be a fájlneveket
                 python3 tools/extract_apk.py map assets/custom/map.json
  4) Indítsd a játékot helyi szerverről (pl. python3 -m http.server), a címképernyő
     kiírja, hány saját textúra töltődött be.

Unity alapú APK-hoz kell a UnityPy:  pip install UnityPy
"""
import argparse
import html
import json
import os
import re
import shutil
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUSTOM = os.path.join(ROOT, 'assets', 'custom')
RAW = os.path.join(CUSTOM, 'raw')
IMG_EXT = ('.png', '.jpg', '.jpeg', '.webp')

# Figura azonosítók és a hozzájuk illő kulcsszavak (automatikus javaslathoz)
FIGURE_HINTS = {
    'robin': ['robin'], 'raven': ['raven'], 'beastboy': ['beastboy', 'beast_boy', 'bb'],
    'cyborg': ['cyborg'], 'starfire': ['starfire', 'star_fire'], 'slade': ['slade'],
    'trigon': ['trigon'], 'jinx': ['jinx'], 'gizmo': ['gizmo'], 'mammoth': ['mammoth'],
    'silkie': ['silkie'], 'aqualad': ['aqualad'], 'speedy': ['speedy'], 'bumblebee': ['bumblebee'],
    'kidflash': ['kidflash', 'kid_flash'], 'terra': ['terra'], 'blackfire': ['blackfire'],
    'cinderblock': ['cinderblock'], 'plasmus': ['plasmus'], 'mumbo': ['mumbo'],
    'controlfreak': ['controlfreak', 'control_freak'], 'drlight': ['drlight', 'dr_light'],
    'kitten': ['kitten'], 'billy': ['billy'], 'seemore': ['seemore', 'see_more'],
    'bloodbrother': ['brotherblood', 'brother_blood'], 'maeye': ['maeye', 'mae_eye', 'mother'],
    'masymenos': ['masymenos', 'mas_y_menos', 'menos'],
}


def safe_name(name):
    name = re.sub(r'[^A-Za-z0-9._-]+', '_', name).strip('_')
    return name or 'kep'


def unique_path(folder, name):
    base, ext = os.path.splitext(name)
    path = os.path.join(folder, name)
    i = 1
    while os.path.exists(path):
        path = os.path.join(folder, f'{base}_{i}{ext}')
        i += 1
    return path


def extract_plain_images(apk, out):
    n = 0
    for info in apk.infolist():
        if info.is_dir() or not info.filename.lower().endswith(IMG_EXT):
            continue
        # az Android rendszer-ikonok (mipmap/drawable) is jöhetnek, a játék képei mellett
        data = apk.read(info.filename)
        if len(data) < 2048:
            continue
        name = safe_name(info.filename.replace('/', '__'))
        with open(unique_path(out, name), 'wb') as f:
            f.write(data)
        n += 1
    return n


def extract_unity(apk, out, tmp):
    try:
        import UnityPy  # noqa: F401
    except ImportError:
        print('  ! A UnityPy nincs telepítve, a Unity csomagokat kihagyom (pip install UnityPy).')
        return 0
    import UnityPy
    members = [m for m in apk.namelist() if m.startswith('assets/bin/Data/') or m.endswith(('.bundle', '.assets', '.unity3d'))]
    if not members:
        return 0
    for m in members:
        apk.extract(m, tmp)
    env = UnityPy.load(tmp)
    n = 0
    for obj in env.objects:
        if obj.type.name not in ('Texture2D', 'Sprite'):
            continue
        try:
            data = obj.read()
            img = data.image
            if img is None or img.width < 24 or img.height < 24:
                continue
            name = safe_name(getattr(data, 'm_Name', '') or getattr(data, 'name', '') or f'{obj.type.name}_{obj.path_id}')
            img.save(unique_path(out, f'{obj.type.name.lower()}__{name}.png'))
            n += 1
        except Exception as e:  # egy hibás textúra ne állítsa meg az egészet
            print(f'  ! kihagyva ({obj.type.name} {obj.path_id}): {e}')
    return n


def write_gallery(out):
    files = sorted(f for f in os.listdir(out) if f.lower().endswith(IMG_EXT))
    cards = '\n'.join(
        f'<figure><img loading="lazy" src="{html.escape(f)}"><figcaption>{html.escape(f)}</figcaption></figure>' for f in files
    )
    page = f"""<!doctype html><meta charset="utf-8"><title>Kinyert képek</title>
<style>body{{font-family:sans-serif;background:#1b1140;color:#eee;margin:16px}}
main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}}
figure{{margin:0;background:#2b1e5c;padding:8px;border-radius:10px}}
img{{width:100%;height:140px;object-fit:contain;background:repeating-conic-gradient(#3a2a7a 0 25%,#2b1e5c 0 50%) 50%/16px 16px}}
figcaption{{font-size:11px;word-break:break-all;margin-top:6px}}</style>
<h1>{len(files)} kinyert kép</h1><p>Írd a fájlneveket az assets/custom/map.json-ba.</p><main>{cards}</main>"""
    with open(os.path.join(out, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page)
    return files


def suggest(files):
    sug = {}
    for fid, keys in FIGURE_HINTS.items():
        for f in files:
            low = f.lower()
            if any(k in low for k in keys):
                sug.setdefault(fid, f)
    return sug


def cmd_extract(args):
    if not os.path.isfile(args.apk):
        sys.exit(f'Nincs ilyen fájl: {args.apk}')
    os.makedirs(RAW, exist_ok=True)
    tmp = os.path.join(CUSTOM, '_tmp')
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp)
    with zipfile.ZipFile(args.apk) as apk:
        print('Képek keresése az APK-ban…')
        n1 = extract_plain_images(apk, RAW)
        print(f'  {n1} sima kép')
        n2 = extract_unity(apk, RAW, tmp)
        print(f'  {n2} Unity textúra/sprite')
    shutil.rmtree(tmp, ignore_errors=True)
    files = write_gallery(RAW)
    example = {'figures': suggest(files), 'backgrounds': {}}
    with open(os.path.join(CUSTOM, 'map.example.json'), 'w', encoding='utf-8') as f:
        json.dump(example, f, indent=2, ensure_ascii=False)
    print(f'\nKész: {len(files)} kép itt: {RAW}')
    print('Nézd át: assets/custom/raw/index.html')
    print('Javaslatok: assets/custom/map.example.json  →  másold map.json-ra és javítsd ki.')


def cmd_map(args):
    with open(args.map, encoding='utf-8') as f:
        mapping = json.load(f)
    manifest = {'figures': {}, 'backgrounds': {}}
    for kind, folder in (('figures', 'figures'), ('backgrounds', 'bg')):
        dst = os.path.join(CUSTOM, folder)
        os.makedirs(dst, exist_ok=True)
        for key, src in (mapping.get(kind) or {}).items():
            path = src if os.path.isabs(src) else os.path.join(RAW, src)
            if not os.path.isfile(path):
                print(f'  ! nincs meg: {src}')
                continue
            name = safe_name(key) + os.path.splitext(path)[1].lower()
            shutil.copyfile(path, os.path.join(dst, name))
            manifest[kind][key] = f'{folder}/{name}'
    with open(os.path.join(CUSTOM, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"Kész: {len(manifest['figures'])} figura, {len(manifest['backgrounds'])} háttér → assets/custom/manifest.json")
    print('Háttér kulcsok: dome, tower, park, street, beach, hive, vault')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    e = sub.add_parser('extract', help='képek kinyerése egy APK-ból')
    e.add_argument('apk')
    e.set_defaults(func=cmd_extract)
    m = sub.add_parser('map', help='map.json alapján manifest készítése')
    m.add_argument('map')
    m.set_defaults(func=cmd_map)
    args = ap.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
