"""A Unity csomagban talált 3D figuramodellek lerajzolása elölnézetből, átlátszó háttérrel.

A Teeny Titans 2 figurái 3D modellek; a boltban kiállított változatuk (`*_shop` objektum)
a gyűjthető figura pózában áll. Ezeket rajzoljuk le a saját színtérképükkel egy egyszerű,
szoftveres raszterizálóval (numpy), enyhe megvilágítással és a játék stílusához illő körvonallal.
"""
import base64
import hashlib
import json
import math
import re

try:
    import numpy as np
except ImportError:  # numpy nélkül nincs 3D renderelés
    np = None

SIZE = 384          # a kész kép mérete
SS = 2              # élsimítás: ennyiszer nagyobb belső felbontás
OUTLINE = '#1d1433'
# a talapzatot a játék maga rajzolja: Base, raven_base, gizmo_Base_mesh, ShopBase_v01:Base, bumbleBee_platform_mesh…
BASE_RE = re.compile(r'(^|[_:])(base|platform)(_mesh(_new)?)?$', re.I)
LIGHT = (0.35, 0.55, 0.75)


def _component(go, kind):
    for c in go.m_Component:
        ptr = c.component if hasattr(c, 'component') else c
        try:
            if ptr.type.name == kind:
                return ptr.read()
        except Exception:
            continue
    return None


def _matrix(tr):
    # Unity Transform: T * R * S
    p, q, s = tr.m_LocalPosition, tr.m_LocalRotation, tr.m_LocalScale
    x, y, z, w = q.x, q.y, q.z, q.w
    r = np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])
    m = np.eye(4)
    m[:3, :3] = r * np.array([s.x, s.y, s.z])
    m[:3, 3] = [p.x, p.y, p.z]
    return m


def _children(tr):
    out = []
    for ch in tr.m_Children:
        try:
            out.append(ch.read())
        except Exception:
            pass
    return out


def _shader_name(mat):
    try:
        sh = mat.m_Shader.read()
        form = getattr(sh, 'm_ParsedForm', None)
        return (form.m_Name if form else getattr(sh, 'm_Name', '')) or ''
    except Exception:
        return ''


def _main_texture(renderer, sub):
    """(textúra, átlátszó-e) — a „Cutout/Transparent” shaderű részek (pl. arc-matricák) átlátszó pixelei kimaradnak,
    a többi (Toon/Basic Tint) átlátszatlan, és a játékhoz hasonlóan csak az elülső lapjuk látszik."""
    mats = renderer.m_Materials
    if not mats:
        return None, False
    try:
        mat = mats[min(sub, len(mats) - 1)].read()
    except Exception:
        return None, False
    cutout = bool(re.search(r'cutout|transparent', _shader_name(mat), re.I))
    for key, env in mat.m_SavedProperties.m_TexEnvs:
        if key in ('_MainTex', '_basetexture', '_BaseMap') and env.m_Texture and env.m_Texture.path_id:
            try:
                return np.asarray(env.m_Texture.read().image.convert('RGBA')), cutout
            except Exception:
                return None, cutout
    return None, cutout


def _mesh_parts(root_tr):
    """A *_shop objektum alatti összes látható háló, a gyökérhez viszonyított mátrixszal."""
    from UnityPy.helpers.MeshHelper import MeshHandler
    parts = []
    # a *_shop objektum saját forgatása is számít (pl. Aqualadnál a talapzat ezzel áll vízszintesen)
    root = _matrix(root_tr)
    stack = [(t, root) for t in _children(root_tr)]
    while stack:
        tr, parent = stack.pop()
        m = parent @ _matrix(tr)
        try:
            go = tr.m_GameObject.read()
        except Exception:
            continue
        if not go.m_IsActive or BASE_RE.search(go.m_Name or ''):
            continue
        stack.extend((c, m) for c in _children(tr))
        rend = _component(go, 'MeshRenderer') or _component(go, 'SkinnedMeshRenderer')
        if rend is None or not getattr(rend, 'm_Enabled', True):
            continue
        mesh = None
        if hasattr(rend, 'm_Mesh') and rend.m_Mesh and rend.m_Mesh.path_id:
            mesh = rend.m_Mesh.read()
        else:
            mf = _component(go, 'MeshFilter')
            if mf and mf.m_Mesh and mf.m_Mesh.path_id:
                mesh = mf.m_Mesh.read()
        if mesh is None:
            continue
        h = MeshHandler(mesh)
        h.process()
        if not h.m_Vertices:
            continue
        v = np.array(h.m_Vertices, float)[:, :3]
        v = (np.c_[v, np.ones(len(v))] @ m.T)[:, :3]
        uv = np.array(h.m_UV0, float) if h.m_UV0 else None
        mirrored = np.linalg.det(m[:3, :3]) < 0  # tükrözött transzformnál a körüljárás megfordul
        for sub, tris in enumerate(h.get_triangles()):
            if tris:
                tex, cutout = _main_texture(rend, sub)
                parts.append((v, uv, np.array(tris, int), tex, cutout, mirrored))
    return parts


def _rasterize(parts):
    S2 = SIZE * SS
    allv = np.concatenate([p[0] for p in parts])
    mn, mx = allv.min(0), allv.max(0)
    span = max(mx[0] - mn[0], mx[1] - mn[1])
    if span <= 0:
        return None
    sc = S2 * 0.92 / span
    cx = (mn[0] + mx[0]) / 2
    img = np.zeros((S2, S2, 4), np.float32)
    zb = np.full((S2, S2), -np.inf)
    light = np.array(LIGHT) / np.linalg.norm(LIGHT)
    for v, uv, tris, tex, cutout, mirrored in parts:
        # elölnézet: a néző a +Z felől néz, ezért az X tükrözve kerül a képre
        X = -(v[:, 0] - cx) * sc + S2 / 2
        Y = S2 - ((v[:, 1] - mn[1]) * sc + S2 * 0.04)
        Z = v[:, 2]
        for tri in tris:
            xs, ys, zs = X[tri], Y[tri], Z[tri]
            x0, x1 = max(0, int(xs.min())), min(S2 - 1, int(math.ceil(xs.max())))
            y0, y1 = max(0, int(ys.min())), min(S2 - 1, int(math.ceil(ys.max())))
            if x1 < x0 or y1 < y0:
                continue
            den = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
            if abs(den) < 1e-9:
                continue
            # hátsó lapok elhagyása (Cull Back), mint a játék Toon shaderében; ebben a tükrözött, lefelé
            # növekvő Y-ú vetítésben a pozitív den az elülső lap
            if not cutout and (den < 0) != mirrored:
                continue
            gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
            a = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / den
            b = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / den
            c = 1 - a - b
            inside = (a >= -1e-4) & (b >= -1e-4) & (c >= -1e-4)
            if not inside.any():
                continue
            z = a * zs[0] + b * zs[1] + c * zs[2]
            zsub = zb[y0:y1 + 1, x0:x1 + 1]
            inside &= z > zsub
            if not inside.any():
                continue
            if tex is not None and uv is not None:
                tuv = uv[tri]
                u = a * tuv[0, 0] + b * tuv[1, 0] + c * tuv[2, 0]
                w = a * tuv[0, 1] + b * tuv[1, 1] + c * tuv[2, 1]
                th, tw = tex.shape[:2]
                px = np.clip(((u % 1.0) * tw).astype(int), 0, tw - 1)
                py = np.clip(((1 - (w % 1.0)) * th).astype(int), 0, th - 1)
                col = tex[py, px].astype(np.float32)
                if cutout:
                    inside &= col[..., 3] > 100  # az arc-matricák átlátszó része kimarad
                    if not inside.any():
                        continue
            else:
                col = np.empty(inside.shape + (4,), np.float32)
                col[...] = (200, 200, 200, 255)
            p0, p1, p2 = v[tri]
            n = np.cross(p1 - p0, p2 - p0)
            nl = np.linalg.norm(n)
            shade = 0.8 + 0.2 * abs(float(n @ light) / nl) if nl > 0 else 1.0
            col[..., :3] *= shade
            col[..., 3] = 255
            zsub[inside] = z[inside]
            img[y0:y1 + 1, x0:x1 + 1][inside] = col[inside]
    return img


def render_parts(parts):
    from PIL import Image, ImageFilter
    img = _rasterize(parts)
    if img is None:
        return None
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGBA').resize((SIZE, SIZE), Image.LANCZOS)
    # matricás körvonal a figura körül
    alpha = im.getchannel('A')
    grown = alpha.point(lambda a: 255 if a > 60 else 0).filter(ImageFilter.MaxFilter(5))
    outline = Image.new('RGBA', im.size, OUTLINE)
    outline.putalpha(grown)
    outline.alpha_composite(im)
    return outline


TEX_MAX = 512  # a játékba kerülő modell-textúrák legnagyobb mérete


def _b64(arr):
    return base64.b64encode(np.ascontiguousarray(arr).tobytes()).decode('ascii')


def export_model(parts):
    """A háló a játék saját 3D rajzolójának (src/engine/model3d.js): JSON + PNG textúrák.
    Méretarány: a figura 1 egység magas, a talpa y=0-n, vízszintesen középen."""
    from PIL import Image
    allv = np.concatenate([p[0] for p in parts])
    mn, mx = allv.min(0), allv.max(0)
    height = mx[1] - mn[1]
    if height <= 0:
        return None, {}
    center = np.array([(mn[0] + mx[0]) / 2, mn[1], (mn[2] + mx[2]) / 2])
    textures, out = {}, []
    for v, uv, tris, tex, cutout, mirrored in parts:
        used = np.unique(tris)
        remap = np.full(len(v), -1, int)
        remap[used] = np.arange(len(used))
        t = remap[tris]
        if mirrored:
            t = t[:, [0, 2, 1]]  # tükrözött résznél a körüljárás visszafordítva
        pos = ((v[used] - center) / height).astype(np.float32)
        # simított csúcsnormálisok (a körvonalhoz és a fényhez)
        nrm = np.zeros_like(pos)
        fn = np.cross(pos[t[:, 1]] - pos[t[:, 0]], pos[t[:, 2]] - pos[t[:, 0]])
        for k in range(3):
            np.add.at(nrm, t[:, k], fn)
        ln = np.linalg.norm(nrm, axis=1, keepdims=True)
        nrm = (nrm / np.where(ln > 0, ln, 1)).astype(np.float32)
        part = {'cutout': bool(cutout), 'pos': _b64(pos), 'nrm': _b64(nrm)}
        if uv is not None and len(uv) == len(v):
            part['uv'] = _b64(uv[used].astype(np.float32))
        if tex is not None:
            key = hashlib.md5(tex.tobytes()).hexdigest()[:12] + '.png'
            if key not in textures:
                im = Image.fromarray(tex, 'RGBA')
                if max(im.size) > TEX_MAX:
                    im.thumbnail((TEX_MAX, TEX_MAX), Image.LANCZOS)
                textures[key] = im
            part['tex'] = key
        big = len(used) > 65535
        part['idx'] = _b64(t.astype(np.uint32 if big else np.uint16).ravel())
        part['i32'] = big
        out.append(part)
    model = {'v': 1, 'width': float((mx[0] - mn[0]) / height), 'depth': float((mx[2] - mn[2]) / height), 'parts': out}
    return model, textures


def render_shop_models(env, save, only=None, save_model=None):
    """Minden *_shop objektum lerajzolása; save(név, kép) menti, save_model(név, json, textúrák)
    a 3D hálót. A sikeres renderek számát adja."""
    if np is None:
        print('  ! numpy nélkül a 3D figurák kimaradnak (pip install numpy)')
        return 0
    shops = []
    seen = set()
    for obj in env.objects:
        if obj.type.name != 'GameObject':
            continue
        try:
            go = obj.read()
        except Exception:
            continue
        name = go.m_Name or ''
        if not re.search(r'_shop$', name, re.I) or name.lower() in seen:
            continue
        if only and name.lower() not in only:
            continue
        tr = _component(go, 'Transform')
        if tr is None or not tr.m_Children:
            continue
        seen.add(name.lower())
        father = None
        try:
            if tr.m_Father and tr.m_Father.path_id:
                father = tr.m_Father.read()
        except Exception:
            father = None
        shops.append((name, tr, father))
    # a harci (animált) figurák: a bolti modell szülőjével azonos nevű, külön prefab
    rigs = {}
    if save_model:
        try:
            import anim3d
            names = set()
            for _, _, f in shops:
                if f is not None:
                    names.add(f.m_GameObject.read().m_Name)
            rigs = anim3d.find_rig_roots(env, names, _component)
        except Exception as e:
            print(f'  ! animált modellek keresése nem sikerült: {e}')
            rigs = {}
    n = 0
    for name, tr, father in shops:
        try:
            parts = _mesh_parts(tr)
            im = render_parts(parts) if parts else None
        except Exception as e:  # egy hibás modell ne állítsa meg a többit
            print(f'  ! 3D modell kihagyva ({name}): {e}')
            continue
        if im is None:
            continue
        save(name, im)
        if save_model:
            try:
                data, textures = export_model(parts)
                if data:
                    rig = _export_rig(rigs, father)
                    if rig:
                        data['rig'], rig_tex = rig
                        textures.update(rig_tex)
                    save_model(name, json.dumps(data, separators=(',', ':')), textures)
            except Exception as e:
                print(f'  ! 3D háló kimentése nem sikerült ({name}): {e}')
        n += 1
    return n


def _export_rig(rigs, father):
    if father is None:
        return None
    import anim3d
    try:
        fname = father.m_GameObject.read().m_Name
    except Exception:
        return None
    for root in rigs.get(anim3d.rig_key(fname), []):
        if root.object_reader.path_id == father.object_reader.path_id:
            continue
        try:
            rig, tex = anim3d.export_rig(root, _component, _children, _main_texture)
        except Exception as e:
            print(f'  ! animáció kihagyva ({fname}): {e}')
            continue
        if rig:
            return rig, tex
    return None
