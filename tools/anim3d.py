"""A figurák animált (harci) modelljének kimentése: csontváz, bőrözött háló, arcváltozatok és a Unity
animációk (Mecanim AnimationClip) előre kiszámolt mátrixai.

A játék (src/engine/model3d.js) ezekből CPU-n számolja a csúcsokat: minden „slot” egy 3x4-es mátrix
képkockánként — a bőrözött hálóknál csontonként (csont × kötési póz), a merev részeknél (pl. az
arcváltozatok: szemek, szájak) magáé az objektumé. A rejtett arcváltozatokat a Unity 0-ra skálázza,
így azok maguktól eltűnnek.
"""
import base64
import math
import re
import struct
import zlib

try:
    import numpy as np
except ImportError:
    np = None

FPS = 15
SKIP_RE = re.compile(r'(_shop|_extras|shadow)', re.I)
GENERIC = {'idle', 'hit', 'hit small', 'swap in', 'swap out', 'dizzy', 'death', 'dance', 'straight look', 'heroic pose'}
MAX_ABILITIES = 3


def _b64(arr):
    return base64.b64encode(np.ascontiguousarray(arr).tobytes()).decode('ascii')


class Clip:
    """Egy AnimationClip görbéi (streamed + dense + constant), időpontban kiértékelve."""

    def __init__(self, clip):
        self.name = clip.m_Name
        mc = clip.m_MuscleClip
        self.start, self.stop = mc.m_StartTime, mc.m_StopTime
        cd = mc.m_Clip.data
        data = cd.m_StreamedClip.data
        raw = struct.pack('<%dI' % len(data), *data)
        self.ns = cd.m_StreamedClip.curveCount
        keys = {}
        p = 0
        while p + 8 <= len(raw):
            time, n = struct.unpack_from('<fI', raw, p)
            p += 8
            for _ in range(n):
                idx, a, b, c, d = struct.unpack_from('<I4f', raw, p)
                p += 20
                keys.setdefault(idx, []).append((time, a, b, c, d))
        self.keys = {k: (np.array([x[0] for x in v]), v) for k, v in keys.items()}
        dc = cd.m_DenseClip
        self.nd = dc.m_CurveCount
        self.dense = np.array(dc.m_SampleArray, float).reshape(-1, self.nd) if self.nd else None
        self.dbegin, self.drate = dc.m_BeginTime, dc.m_SampleRate
        self.const = list(cd.m_ConstantClip.data)
        self.bindings = clip.m_ClipBindingConstant.genericBindings

    def value(self, idx, t):
        if idx < self.ns:
            entry = self.keys.get(idx)
            if entry is None:
                return 0.0
            times, ks = entry
            i = max(0, int(np.searchsorted(times, t, side='right')) - 1)
            k = ks[i]
            dt = t - k[0]
            if not math.isfinite(dt):
                dt = 0.0
            return ((k[1] * dt + k[2]) * dt + k[3]) * dt + k[4]
        idx -= self.ns
        if idx < self.nd:
            f = (t - self.dbegin) * self.drate
            i = int(max(0, min(len(self.dense) - 1, math.floor(f))))
            j = min(len(self.dense) - 1, i + 1)
            w = min(1.0, max(0.0, f - i))
            return self.dense[i, idx] * (1 - w) + self.dense[j, idx] * w
        idx -= self.nd
        return self.const[idx] if idx < len(self.const) else 0.0

    def sample(self, t):
        """{útvonal-hash: {attribútum: értékek}} (1 = pozíció, 2 = kvaternió, 3 = méret, 4 = Euler)"""
        out = {}
        ci = 0
        for b in self.bindings:
            n = {1: 3, 2: 4, 3: 3, 4: 3}.get(b.attribute, 1)
            if b.typeID == 4 and b.attribute in (1, 2, 3, 4):
                out.setdefault(b.path, {})[b.attribute] = [self.value(ci + k, t) for k in range(n)]
            ci += n
        return out


def _quat(x, y, z, w):
    n = math.sqrt(x * x + y * y + z * z + w * w) or 1.0
    x, y, z, w = x / n, y / n, z / n, w / n
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])


def _euler(e):
    # Unity Euler-szögek (fok), Z-X-Y sorrend
    x, y, z = [math.radians(a) / 2 for a in e]
    cx, sx, cy, sy, cz, sz = math.cos(x), math.sin(x), math.cos(y), math.sin(y), math.cos(z), math.sin(z)
    return (sx * cy * cz + cx * sy * sz, cx * sy * cz - sx * cy * sz, cx * cy * sz - sx * sy * cz, cx * cy * cz + sx * sy * sz)


def _trs(p, q, s):
    m = np.eye(4)
    m[:3, :3] = _quat(*q) * np.array(s)
    m[:3, 3] = p
    return m


def _crc(path):
    return zlib.crc32(path.encode('utf-8')) & 0xffffffff


def _bindpose(m):
    return np.array([[m.e00, m.e01, m.e02, m.e03], [m.e10, m.e11, m.e12, m.e13],
                     [m.e20, m.e21, m.e22, m.e23], [m.e30, m.e31, m.e32, m.e33]])


def find_rig_roots(env, names, component):
    """A megadott nevű, szülő nélküli objektumok (a harci figura-prefabok) név szerint."""
    out = {}
    for obj in env.objects:
        if obj.type.name != 'GameObject':
            continue
        try:
            name = obj.peek_name() if hasattr(obj, 'peek_name') else None
        except Exception:
            name = None
        if name is not None and name not in names:
            continue
        try:
            go = obj.read()
        except Exception:
            continue
        if go.m_Name not in names:
            continue
        tr = component(go, 'Transform')
        if tr is None or (tr.m_Father and tr.m_Father.path_id):
            continue
        out.setdefault(go.m_Name, []).append(tr)
    return out


def export_rig(root_tr, component, children, main_texture):
    """A gyökér alatti animált modell kimentése; (rig szótár, textúrák) vagy (None, {})."""
    from UnityPy.helpers.MeshHelper import MeshHandler
    from PIL import Image

    nodes = {}

    def walk(tr, parent):
        key = tr.object_reader.path_id
        go = tr.m_GameObject.read()
        lp, lq, ls = tr.m_LocalPosition, tr.m_LocalRotation, tr.m_LocalScale
        nodes[key] = {'tr': tr, 'go': go, 'parent': parent, 'p': (lp.x, lp.y, lp.z),
                      'q': (lq.x, lq.y, lq.z, lq.w), 's': (ls.x, ls.y, ls.z)}
        for ch in children(tr):
            try:
                name = ch.m_GameObject.read().m_Name or ''
            except Exception:
                continue
            if SKIP_RE.search(name):
                continue
            walk(ch, key)

    walk(root_tr, None)

    # animátorok és az útvonal-hash → objektum táblájuk
    animators = []
    for key, n in nodes.items():
        an = component(n['go'], 'Animator')
        if not an or not an.m_Controller or not an.m_Controller.path_id:
            continue
        try:
            ctrl = an.m_Controller.read()
            clips = {}
            for c in ctrl.m_AnimationClips:
                clip = c.read()
                clips.setdefault(clip.m_Name, clip)
        except Exception:
            continue
        table = {}
        stack = [(key, '')]
        while stack:
            k, path = stack.pop()
            if path:
                table[_crc(path)] = k
            for ck, cn in nodes.items():
                if cn['parent'] == k:
                    stack.append((ck, (path + '/' if path else '') + (cn['go'].m_Name or '')))
        animators.append({'clips': clips, 'table': table})
    if not animators:
        return None, {}
    body = max(animators, key=lambda a: len(a['table']))
    names = list(body['clips'].keys())
    if 'idle' not in names:
        return None, {}
    # támadások: előbb az önálló mozdulatok (nem „intro/loop/outro” töredékek), azon belül a hosszabbak;
    # a legutolsó (a játékban a szuper) a leghosszabb önálló mozdulat
    def clip_len(name):
        m = body['clips'][name].m_MuscleClip
        return m.m_StopTime - m.m_StartTime
    cands = [c for c in names if c not in GENERIC and c != 'small hit' and clip_len(c) > 0.3]
    taunt = re.compile(r'raspberry|laugh|nuh uh|dance|cute', re.I)
    whole = [c for c in cands if not re.search(r'intro|loop|outro|activate', c, re.I) and not taunt.search(c)]
    parts = [c for c in cands if c not in whole and not taunt.search(c)]
    picked = sorted(whole, key=clip_len)[:MAX_ABILITIES]
    if len(picked) < MAX_ABILITIES:
        picked += sorted(parts, key=clip_len, reverse=True)[:MAX_ABILITIES - len(picked)]
    if not picked:
        # ha csak gúnyolódás van, az is jobb a semminél
        picked = sorted(cands, key=clip_len)[:MAX_ABILITIES]
    abilities = sorted(picked, key=clip_len)
    wanted = [c for c in ['idle', 'hit small', 'small hit', 'hit', 'death', 'dizzy', 'dance', 'swap in'] if c in names] + abilities

    # renderelők
    skins, rigids = [], []
    for key, n in nodes.items():
        go = n['go']
        if not go.m_IsActive:
            continue
        smr = component(go, 'SkinnedMeshRenderer')
        if smr and getattr(smr, 'm_Enabled', True) and smr.m_Mesh and smr.m_Mesh.path_id:
            mesh = smr.m_Mesh.read()
            bones = []
            for b in smr.m_Bones:
                bones.append(b.path_id if b.path_id in nodes else None)
            if bones and all(b is not None for b in bones):
                skins.append((key, smr, mesh, bones))
            continue
        mr = component(go, 'MeshRenderer')
        mf = component(go, 'MeshFilter')
        if mr and getattr(mr, 'm_Enabled', True) and mf and mf.m_Mesh and mf.m_Mesh.path_id:
            rigids.append((key, mr, mf.m_Mesh.read()))
    if not skins:
        return None, {}

    # minden animátor (test, arc…) a saját, azonos nevű klipjét játssza
    clip_objs = {}
    for name in wanted:
        clip_objs[name] = [(Clip(a['clips'][name]), a['table']) for a in animators if name in a['clips']]

    def world_at(name, t):
        over = {}
        for c, table in clip_objs[name]:
            for h, attrs in c.sample(min(c.stop, max(c.start, t))).items():
                k = table.get(h)
                if k is not None:
                    over.setdefault(k, {}).update(attrs)
        W = {}

        def get(k):
            if k in W:
                return W[k]
            n = nodes[k]
            p, q, s = n['p'], n['q'], n['s']
            a = over.get(k, {})
            if 1 in a:
                p = a[1]
            if 2 in a:
                q = a[2]
            if 4 in a:
                q = _euler(a[4])
            if 3 in a:
                s = a[3]
            m = _trs(p, q, s)
            if n['parent'] is not None:
                m = get(n['parent']) @ m
            W[k] = m
            return m

        for k in nodes:
            get(k)
        return W

    # hálók előkészítése
    meshes = []
    for key, smr, mesh, bones in skins:
        h = MeshHandler(mesh)
        h.process()
        if not h.m_Vertices or not h.m_BoneWeights:
            continue
        bp = [_bindpose(m) for m in mesh.m_BindPose]
        if len(bp) != len(bones):
            continue
        meshes.append(('skin', key, smr, h, bones, bp))
    for key, mr, mesh in rigids:
        h = MeshHandler(mesh)
        h.process()
        if h.m_Vertices:
            meshes.append(('rigid', key, mr, h, None, None))
    if not any(m[0] == 'skin' for m in meshes):
        return None, {}

    # slotok: (bőr, csont) vagy merev objektum
    slots = []
    for kind, key, rend, h, bones, bp in meshes:
        if kind == 'skin':
            for j, b in enumerate(bones):
                slots.append(('skin', b, bp[j]))
        else:
            slots.append(('rigid', key, None))

    def slot_mats(W):
        out = np.empty((len(slots), 4, 4))
        for i, (kind, k, b) in enumerate(slots):
            out[i] = W[k] @ b if kind == 'skin' else W[k]
        return out

    # méretarány a nyugalmi (idle, 0. képkocka) póz alapján
    W0 = world_at('idle', clip_objs['idle'][0][0].start)
    M0 = slot_mats(W0)
    pts = []
    si = 0
    for kind, key, rend, h, bones, bp in meshes:
        v = np.c_[np.array(h.m_Vertices, float)[:, :3], np.ones(len(h.m_Vertices))]
        if kind == 'skin':
            bi = np.array(h.m_BoneIndices, int)
            bw = np.array(h.m_BoneWeights, float)
            acc = np.zeros((len(v), 4))
            for c in range(4):
                acc += bw[:, c:c + 1] * np.einsum('nij,nj->ni', M0[si + bi[:, c]], v)
            # a 0-ra skálázott (elrejtett) csontokhoz tartozó csúcsok nem számítanak a méretbe
            dets = np.abs(np.linalg.det(M0[si:si + len(bones), :3, :3]))
            main = bi[np.arange(len(bi)), np.argmax(bw, axis=1)]
            si += len(bones)
            pts.append(acc[dets[main] > 1e-6, :3])
        else:
            m = M0[si]
            si += 1
            if abs(np.linalg.det(m[:3, :3])) > 1e-9:
                pts.append((v @ m.T)[:, :3])
    allp = np.concatenate(pts)
    mn, mx = allp.min(0), allp.max(0)
    height = mx[1] - mn[1]
    if height <= 0:
        return None, {}
    N = np.eye(4)
    N[:3, :3] /= height
    N[:3, 3] = -np.array([(mn[0] + mx[0]) / 2, mn[1], (mn[2] + mx[2]) / 2]) / height

    # a mozgás „gyökere”: a legfelső, pozícióban animált csont a testanimátor alatt
    root_key = None
    depth = {}
    for k, n in nodes.items():
        d, p = 0, n['parent']
        while p is not None:
            d += 1
            p = nodes[p]['parent']
        depth[k] = d
    # a test középpontja: a bőr csontjai közül a COM/hip/pelvis nevű (vagy a legfelső) csont
    bone_keys = {b for m in meshes if m[0] == 'skin' for b in m[4]}
    named = [k for k in bone_keys if re.search(r'com|hip|pelvis|root', nodes[k]['go'].m_Name or '', re.I)]
    pool = named or list(bone_keys)
    if pool:
        root_key = min(pool, key=lambda k: depth[k])
    root0 = W0[root_key][:3, 3].copy() if root_key is not None else None

    # animációk mintavételezése
    clips_out = {}
    for name in wanted:
        cs = clip_objs[name]
        if not cs:
            continue
        start, stop = cs[0][0].start, max(c.stop for c, _ in cs)
        dur = max(1e-3, stop - start)
        frames = max(2, int(math.ceil(dur * FPS)) + 1)
        data = np.empty((frames, len(slots), 3, 4), np.float32)
        for f in range(frames):
            t = start + min(dur, f / FPS)
            W = world_at(name, t)
            O = np.eye(4)
            if root_key is not None:
                # a TT2 a támadásoknál a pályán is mozgatja a figurát; ezt nálunk a harc intézi,
                # ezért a vízszintes elmozdulás kimarad, a túl magas ugrás pedig levágódik
                d = W[root_key][:3, 3] - root0
                O[0, 3], O[2, 3] = -d[0], -d[2]
                O[1, 3] = -max(0.0, d[1] - 0.5 * height)
            data[f] = (N @ O @ slot_mats(W))[:, :3, :]
        # félpontos lebegőpontos számok (a játék visszaalakítja): fele akkora, és bőven elég pontos
        clips_out[name] = {'n': frames, 'dur': float(dur), 'm': _b64(data.astype(np.float16))}

    # részek
    textures, parts = {}, []
    si = 0
    for kind, key, rend, h, bones, bp in meshes:
        pos = np.array(h.m_Vertices, float)[:, :3].astype(np.float32)
        uv = np.array(h.m_UV0, float).astype(np.float32) if h.m_UV0 else None
        for sub, tris in enumerate(h.get_triangles()):
            if not tris:
                continue
            t = np.array(tris, int)
            tex, cutout = main_texture(rend, sub)
            nrm = np.zeros_like(pos)
            fn = np.cross(pos[t[:, 1]] - pos[t[:, 0]], pos[t[:, 2]] - pos[t[:, 0]])
            for c in range(3):
                np.add.at(nrm, t[:, c], fn)
            ln = np.linalg.norm(nrm, axis=1, keepdims=True)
            nrm = (nrm / np.where(ln > 0, ln, 1)).astype(np.float32)
            part = {'cutout': bool(cutout), 'pos': _b64(pos), 'nrm': _b64(nrm), 'i32': len(pos) > 65535,
                    'idx': _b64(t.astype(np.uint32 if len(pos) > 65535 else np.uint16).ravel())}
            if uv is not None and len(uv) == len(pos):
                part['uv'] = _b64(uv)
            if kind == 'skin':
                bi = np.array(h.m_BoneIndices, int) + si
                bw = np.array(h.m_BoneWeights, float)
                bw = bw / np.maximum(bw.sum(1, keepdims=True), 1e-6)
                part['bi'] = _b64(bi.astype(np.uint16))
                part['bw'] = _b64(np.round(bw * 255).astype(np.uint8))
            else:
                part['slot'] = si
            if tex is not None:
                k = '%08x.png' % (zlib.crc32(tex.tobytes()) & 0xffffffff)
                if k not in textures:
                    im = Image.fromarray(tex, 'RGBA')
                    if max(im.size) > 512:
                        im.thumbnail((512, 512), Image.LANCZOS)
                    textures[k] = im
                part['tex'] = k
            parts.append(part)
        si += len(bones) if kind == 'skin' else 1
    rig = {'fps': FPS, 'slots': len(slots), 'parts': parts, 'clips': clips_out,
           'abilities': [a for a in abilities if a in clips_out]}
    return rig, textures
