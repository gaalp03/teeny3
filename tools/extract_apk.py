#!/usr/bin/env python3
"""Saját APK-ból textúrák kinyerése a Teeny Titans 3 rajongói játékhoz.

A játék alapból minden figurát kódból rajzol. Ha van egy saját, legálisan
megszerzett APK-d (pl. a saját telefonodról lementett Teeny Titans 2), ezzel a
szkripttel kinyerheted belőle a képeket, és a játék a saját gépeden azokat
használja a procedurális rajz helyett.

A kinyert fájlok az assets/custom/ mappába kerülnek, amit a .gitignore kizár —
szerzői jogvédett anyag ne kerüljön fel a repóba.

Használat:
  1) Kinyerés:   python3 tools/extract_apk.py extract teeny_titans_2.apk   (.xapk / .apks / .obb / .zip is jó)
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
import subprocess
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


UNITY_MAGIC = (b'UnityFS', b'UnityWeb', b'UnityRaw', b'UnityArchive')


def is_unity_member(z, m):
    # név alapján (APK/OBB) vagy tartalom alapján (pl. a játék letöltési gyorsítótárában __data nevű fájlok)
    if m.endswith('/'):
        return False
    if m.startswith('assets/bin/Data/') or m.endswith(('.bundle', '.assets', '.unity3d', '.ab')):
        return True
    try:
        with z.open(m) as f:
            return f.read(16).startswith(UNITY_MAGIC)
    except Exception:
        return False


def export_music(obj, out):
    # a játék zenéi (music_*) tömörítve (Opus) a raw/hang mappába; a hangeffektek kimaradnak
    try:
        name = obj.peek_name() if hasattr(obj, 'peek_name') else obj.read().m_Name
    except Exception:
        return 0
    low = (name or '').lower()
    # zenék, a menü-/harci hangok, a képességek hangjai, az öt Titán harci szinkronja és a bemondott
    # figuranevek; a többi szinkronhang kimarad
    voice = re.match(r'^sfx_vo_(robin|raven|starfire|beastboy|cyborg)_battle_|^sfx_menus_newfigreveal_names_', low)
    if not voice and not low.startswith('music_') and not (low.startswith('sfx_') and not low.startswith('sfx_vo_')):
        return 0
    if not shutil.which('ffmpeg'):
        print(f'  ! ffmpeg nélkül a zene kimarad: {name}')
        return 0
    folder = os.path.join(out, 'hang')
    os.makedirs(folder, exist_ok=True)
    dst = os.path.join(folder, safe_name(name) + '.ogg')
    if os.path.exists(dst):
        return 0
    try:
        samples = obj.read().samples
    except Exception as e:
        print(f'  ! zene kihagyva ({name}): {e}')
        return 0
    for data in samples.values():
        wav = dst[:-4] + '.wav'
        with open(wav, 'wb') as f:
            f.write(data)
        ok = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-c:a', 'libopus', '-b:a', '96k', dst]).returncode == 0
        os.remove(wav)
        if ok:
            return 1
        print(f'  ! zene átalakítása nem sikerült: {name}')
        return 0
    return 0


def extract_unity(apk, out, tmp):
    try:
        import UnityPy  # noqa: F401
    except ImportError:
        print('  ! A UnityPy nincs telepítve, a Unity csomagokat kihagyom (pip install UnityPy).')
        return 0
    import UnityPy
    members = [m for m in apk.namelist() if is_unity_member(apk, m)]
    if not members:
        return 0
    for m in members:
        apk.extract(m, tmp)
    # a nagy .assets fájlok darabolva (.split0, .split1, ...) vannak a csomagban: összefűzzük őket
    parts = {}
    for dirpath, _, names in os.walk(tmp):
        for nm in names:
            mt = re.match(r'(.+)\.split(\d+)$', nm)
            if mt:
                parts.setdefault(os.path.join(dirpath, mt.group(1)), []).append((int(mt.group(2)), os.path.join(dirpath, nm)))
    for whole, lst in parts.items():
        with open(whole, 'wb') as out_f:
            for _, part in sorted(lst):
                with open(part, 'rb') as in_f:
                    shutil.copyfileobj(in_f, out_f)
                os.remove(part)
    files = [os.path.join(d, nm) for d, _, names in os.walk(tmp) for nm in names]
    env = UnityPy.load(*files)
    n = 0
    for obj in env.objects:
        if obj.type.name == 'AudioClip':
            n += export_music(obj, out)
            continue
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
    # a 3D figurák (a boltban kiállított *_shop modellek) elölnézetből lerajzolva
    try:
        import render3d
    except ImportError:
        render3d = None
    if render3d:
        def save_model(name, data, textures):
            folder = os.path.join(out, 'modell', safe_name(name))
            os.makedirs(folder, exist_ok=True)
            with open(os.path.join(folder, 'model.json'), 'w', encoding='utf-8') as f:
                f.write(data)
            for fname, im in textures.items():
                im.save(os.path.join(folder, fname), optimize=True)
        r = render3d.render_shop_models(env, lambda name, im: im.save(unique_path(out, f'render__{safe_name(name)}.png')), save_model=save_model)
        if r:
            print(f'  {r} 3D figura lerajzolva')
        n += r
        # a harci arénák háttérképnek (arena__tower.png stb.)
        try:
            import arena3d
            a = arena3d.render_arenas(env, lambda key, im: im.save(os.path.join(out, f'arena__{key}.png'), optimize=True),
                                      render3d._component, render3d._children, render3d._mesh_parts)
            if a:
                print(f'  {a} aréna lerajzolva')
            n += a
        except Exception as e:
            print(f'  ! az arénák kirajzolása nem sikerült: {e}')
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


def process_archive(path, tmp, depth=0):
    # Az .xapk / .apks csomag több APK-t (és .obb-t) tartalmaz: azokat is bejárjuk
    n1 = n2 = 0
    with zipfile.ZipFile(path) as z:
        n1 += extract_plain_images(z, RAW)
        work = os.path.join(tmp, f'unity{depth}_{len(os.listdir(tmp))}')
        os.makedirs(work)
        n2 += extract_unity(z, RAW, work)
        inner = [m for m in z.namelist() if m.lower().endswith(('.apk', '.obb', '.zip'))] if depth < 2 else []
        for m in inner:
            print(f'  belső csomag: {m}')
            p = z.extract(m, os.path.join(tmp, f'inner{depth}'))
            try:
                a, b = process_archive(p, tmp, depth + 1)
            except zipfile.BadZipFile:
                print(f'  ! nem zip, kihagyva: {m}')
                continue
            n1 += a
            n2 += b
    return n1, n2


def cmd_extract(args):
    if not os.path.isfile(args.apk):
        sys.exit(f'Nincs ilyen fájl: {args.apk}')
    os.makedirs(RAW, exist_ok=True)
    tmp = os.path.join(CUSTOM, '_tmp')
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp)
    print(f'Képek keresése: {args.apk}')
    n1, n2 = process_archive(args.apk, tmp)
    print(f'  {n1} sima kép, {n2} Unity textúra/sprite')
    shutil.rmtree(tmp, ignore_errors=True)
    files = write_gallery(RAW)
    example = {'figures': suggest(files), 'backgrounds': {}}
    with open(os.path.join(CUSTOM, 'map.example.json'), 'w', encoding='utf-8') as f:
        json.dump(example, f, indent=2, ensure_ascii=False)
    print(f'\nKész: {len(files)} kép itt: {RAW}')
    print('Nézd át: assets/custom/raw/index.html')
    print('Javaslatok: assets/custom/map.example.json  →  másold map.json-ra és javítsd ki.')


def trim_copy(src, dst):
    # a figura a talpán áll a játékban (alulra igazítva), ezért az átlátszó szegélyt levágjuk
    try:
        from PIL import Image
    except ImportError:
        shutil.copyfile(src, dst)
        return
    im = Image.open(src).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if box:
        im = im.crop(box)
    im.save(dst, optimize=True)


def trim_impact(src, dst, length=1.2):
    # A TT2 képességhangjai a teljes, több másodperces animációt kísérik (felhúzás, várakozás, csapás);
    # nálunk egy támadás kb. egy másodperc, ezért a leghangosabb szakaszt vágjuk ki, a csapás elejétől.
    import array
    rate, blk = 8000, 400
    try:
        pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', str(rate), '-f', 's16le', '-'],
                             capture_output=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return False
    a = array.array('h', pcm[:len(pcm) // 2 * 2])
    rms = [(sum(x * x for x in a[i:i + blk]) / blk) ** 0.5 for i in range(0, len(a) - blk + 1, blk)]
    n = int(length * rate / blk)
    if len(rms) <= n:
        return False
    best = max(range(len(rms) - n + 1), key=lambda i: sum(rms[i:i + n]))
    peak = max(rms[best:best + n])
    start = next(i for i in range(best, best + n) if rms[i] >= peak * 0.35)
    t0 = max(0.0, start * blk / rate - 0.05)
    fade = f'afade=t=out:st={length - 0.3:.2f}:d=0.3'
    return subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{t0:.2f}', '-t', f'{length:.2f}', '-i', src,
                           '-af', fade, '-c:a', 'libopus', '-b:a', '96k', dst]).returncode == 0


def merge_map(base, extra):
    # a kiegészítő párosítás felülírja/bővíti az alapot (a beágyazott szótárakat is, pl. voice → figura → fajta)
    for key, val in extra.items():
        if isinstance(val, dict) and isinstance(base.get(key), dict):
            merge_map(base[key], val)
        else:
            base[key] = val
    return base


def cmd_map(args):
    with open(args.map, encoding='utf-8') as f:
        mapping = json.load(f)
    # kiegészítők a map.json mellett (map.valami.json), betűrendben: így egy új sorozathoz elég egy kis fájl
    folder = os.path.dirname(os.path.abspath(args.map))
    for name in sorted(os.listdir(folder)):
        if re.match(r'^map\.(?!example\.).+\.json$', name):
            with open(os.path.join(folder, name), encoding='utf-8') as f:
                merge_map(mapping, json.load(f))
            print(f'  + {name}')
    manifest = {'figures': {}, 'backgrounds': {}, 'music': {}, 'models': {}}
    # 3D hálók: a render__X.png figurákhoz tartozó modell (raw/modell/X) automatikusan jön
    for key, src in (mapping.get('figures') or {}).items():
        m = re.match(r'render__(.+)\.png$', src)
        folder = m and os.path.join(RAW, 'modell', m.group(1))
        if folder and os.path.isfile(os.path.join(folder, 'model.json')):
            dst = os.path.join(CUSTOM, 'models', safe_name(key))
            shutil.rmtree(dst, ignore_errors=True)
            shutil.copytree(folder, dst)
            manifest['models'][key] = f'models/{safe_name(key)}/model.json'
    # zenék és hangeffektek: {"town": "music_cityloop1", ...}, {"select": "sfx_gui_buttonconfirm", ...}
    manifest['sfx'] = {}
    # szinkronhangok: {"robin": {"hurt": ["sfx_vo_robin_battle_hurt1", ...], ...}}
    manifest['voice'] = {}
    for fig, kinds in (mapping.get('voice') or {}).items():
        for kind, srcs in kinds.items():
            for i, src in enumerate(srcs):
                path = os.path.join(RAW, 'hang', safe_name(src) + '.ogg')
                if not os.path.isfile(path):
                    continue
                dst = os.path.join(CUSTOM, 'voice')
                os.makedirs(dst, exist_ok=True)
                name = f'{safe_name(fig)}_{safe_name(kind)}_{i}.ogg'
                shutil.copyfile(path, os.path.join(dst, name))
                manifest['voice'].setdefault(fig, {}).setdefault(kind, []).append('voice/' + name)
    # támadáshangok: {"staff": "sfx_abilities_staffslam", "gorilla_punch": ...} (fx vagy támadás szerint)
    manifest['moves'] = {}
    for kind in ('music', 'sfx', 'moves'):
        dst = os.path.join(CUSTOM, kind)
        for key, src in (mapping.get(kind) or {}).items():
            path = os.path.join(RAW, 'hang', safe_name(src) + '.ogg')
            if not os.path.isfile(path):
                print(f'  ! nincs meg a hang: {src}')
                continue
            os.makedirs(dst, exist_ok=True)
            out = os.path.join(dst, safe_name(key) + '.ogg')
            if kind != 'moves' or not trim_impact(path, out):
                shutil.copyfile(path, out)
            manifest[kind][key] = f'{kind}/{safe_name(key)}.ogg'
    for kind, folder in (('figures', 'figures'), ('backgrounds', 'bg')):
        dst = os.path.join(CUSTOM, folder)
        os.makedirs(dst, exist_ok=True)
        for key, src in (mapping.get(kind) or {}).items():
            path = src if os.path.isabs(src) else os.path.join(RAW, src)
            if not os.path.isfile(path):
                print(f'  ! nincs meg: {src}')
                continue
            name = safe_name(key) + os.path.splitext(path)[1].lower()
            if kind == 'figures':
                name = safe_name(key) + '.png'
                trim_copy(path, os.path.join(dst, name))
            else:
                shutil.copyfile(path, os.path.join(dst, name))
            manifest[kind][key] = f'{folder}/{name}'
    with open(os.path.join(CUSTOM, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"Kész: {len(manifest['figures'])} figura, {len(manifest['backgrounds'])} háttér, {len(manifest['music'])} zene, {len(manifest['sfx'])} hangeffekt, {len(manifest['models'])} 3D modell → assets/custom/manifest.json")
    print('Háttér kulcsok: dome, tower, park, street, beach, hive, vault')


def cmd_thumbs(args):
    # Kicsinyített előnézet a kinyert képekből (a párosításhoz, gyorsan átnézhető)
    try:
        from PIL import Image
    except ImportError:
        Image = None
    os.makedirs(args.out, exist_ok=True)
    names = []
    for f in sorted(os.listdir(RAW)):
        if not f.lower().endswith(IMG_EXT):
            continue
        src = os.path.join(RAW, f)
        if Image is None:
            shutil.copyfile(src, os.path.join(args.out, f))
            names.append(f)
            continue
        try:
            im = Image.open(src)
            w, h = im.size
            if min(w, h) < 48:
                continue
            im.thumbnail((256, 256))
            im.save(os.path.join(args.out, os.path.splitext(f)[0] + '.png'), optimize=True)
            names.append(f'{f}  ({w}x{h})')
        except Exception as e:
            print(f'  ! kihagyva: {f}: {e}')
    write_gallery(args.out)
    with open(os.path.join(args.out, 'nevek.txt'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(names) + '\n')
    print(f'Előnézet: {len(names)} kép → {args.out}')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    e = sub.add_parser('extract', help='képek kinyerése egy APK-ból')
    e.add_argument('apk')
    e.set_defaults(func=cmd_extract)
    m = sub.add_parser('map', help='map.json alapján manifest készítése')
    m.add_argument('map')
    m.set_defaults(func=cmd_map)
    t = sub.add_parser('thumbs', help='kicsinyített előnézet a kinyert képekből')
    t.add_argument('out')
    t.set_defaults(func=cmd_thumbs)
    args = ap.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
