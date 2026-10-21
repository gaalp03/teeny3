"""A TT2 harci arénái (3D pályák) perspektívából lerajzolva, a harcok hátteréhez.

Az arénák egyetlen, körbeépített hálóból állnak; a kamerát úgy állítjuk, hogy a középső jel a kép alsó
harmadába, a figurák talapzata mögé essen (960×540, 2× élsimítással)."""
import math

import numpy as np


def look_at(eye, target, up=(0, 1, 0)):
    eye, target, up = map(lambda a: np.array(a, float), (eye, target, up))
    f = target - eye; f /= np.linalg.norm(f)
    r = np.cross(f, up); r /= np.linalg.norm(r)
    u = np.cross(r, f)
    M = np.eye(4); M[0, :3] = r; M[1, :3] = u; M[2, :3] = -f
    M[:3, 3] = -M[:3, :3] @ eye
    return M

def _clip_near(P, UV, near):
    # P: 3x3 kamera-térbeli pontok (z negatív előre), UV: 3x2; a közelsík (z = -near) mögötti részt levágja
    out = []
    n = len(P)
    for i in range(n):
        a, b = i, (i + 1) % n
        ina, inb = P[a][2] <= -near, P[b][2] <= -near
        if ina: out.append((P[a], UV[a]))
        if ina != inb:
            t = (-near - P[a][2]) / (P[b][2] - P[a][2])
            out.append((P[a] + t * (P[b] - P[a]), UV[a] + t * (UV[b] - UV[a])))
    return out

def render(parts, eye, target, fov=50, W=960, H=540, near=0.5, flipx=True, light=(0.3, 0.8, 0.5), bg=(0, 0, 0, 0)):
    V = look_at(eye, target)
    fy = 1 / math.tan(math.radians(fov) / 2); fx = fy * H / W
    img = np.zeros((H, W, 4), np.float32); img[...] = bg
    zb = np.full((H, W), np.inf)
    L = np.array(light, float); L /= np.linalg.norm(L)
    for v, uv, tris, tex, cutout, mirrored in parts:
        if flipx:
            v = v * np.array([-1, 1, 1])  # a Unity bal kezes rendszeréből
        cam = (V[:3, :3] @ v.T).T + V[:3, 3]
        if uv is None: uv = np.zeros((len(v), 2))
        for tri in tris:
            P = cam[tri]
            if (P[:, 2] > -near).all():
                continue
            p0, p1, p2 = v[tri]
            nrm = np.cross(p1 - p0, p2 - p0); nl = np.linalg.norm(nrm)
            shade = 0.82 + 0.18 * abs(float(nrm @ L) / nl) if nl > 0 else 1.0
            poly = _clip_near(P, uv[tri], near) if (P[:, 2] > -near).any() else list(zip(P, uv[tri]))
            for k in range(1, len(poly) - 1):
                _tri(img, zb, [poly[0], poly[k], poly[k + 1]], fx, fy, W, H, tex, cutout, shade)
    return img

def _tri(img, zb, pts, fx, fy, W, H, tex, cutout, shade):
    P = np.array([p for p, _ in pts]); T = np.array([t for _, t in pts])
    iw = 1.0 / -P[:, 2]
    xs = (P[:, 0] * fx * iw * 0.5 + 0.5) * W
    ys = (0.5 - P[:, 1] * fy * iw * 0.5) * H
    x0, x1 = max(0, int(xs.min())), min(W - 1, int(math.ceil(xs.max())))
    y0, y1 = max(0, int(ys.min())), min(H - 1, int(math.ceil(ys.max())))
    if x1 < x0 or y1 < y0: return
    den = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
    if abs(den) < 1e-9: return
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    a = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / den
    b = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / den
    c = 1 - a - b
    inside = (a >= -1e-4) & (b >= -1e-4) & (c >= -1e-4)
    if not inside.any(): return
    wsum = a * iw[0] + b * iw[1] + c * iw[2]
    depth = 1.0 / wsum
    zsub = zb[y0:y1 + 1, x0:x1 + 1]
    inside &= depth < zsub
    if not inside.any(): return
    if tex is not None:
        u = (a * T[0, 0] * iw[0] + b * T[1, 0] * iw[1] + c * T[2, 0] * iw[2]) / wsum
        w = (a * T[0, 1] * iw[0] + b * T[1, 1] * iw[1] + c * T[2, 1] * iw[2]) / wsum
        th, tw = tex.shape[:2]
        px = np.clip(((u % 1.0) * tw).astype(int), 0, tw - 1)
        py = np.clip(((1 - (w % 1.0)) * th).astype(int), 0, th - 1)
        col = tex[py, px].astype(np.float32)
        if cutout:
            inside &= col[..., 3] > 100
            if not inside.any(): return
    else:
        col = np.empty(inside.shape + (4,), np.float32); col[...] = (120, 120, 130, 255)
    col[..., :3] *= shade
    col[..., 3] = 255
    zsub[inside] = depth[inside]
    img[y0:y1 + 1, x0:x1 + 1][inside] = col[inside]


# háttér kulcs → (aréna neve, szem, célpont, látószög)
ARENAS = {
    'tower': ('TopOfTowerArena', (24, 7, 0), (0, 4.5, 0), 50),
    'hive': ('HiveArena', (-14, 5, 0), (0, 3, 0), 50),
    'dome': ('HallofJusticeArena', (24, 7, 0), (0, 4.5, 0), 50),
    'beach': ('Arena_Themyscira', (-24, 7, 0), (0, 4.5, 0), 50),
    'vault': ('BatCaveArena', (-24, 7, 0), (0, 4.5, 0), 50),
    'apokolips': ('Apokolips_Arena', (-38, 11, 0), (0, 9, 0), 50),
    'oa': ('Arena_Oa', (0, 11, 38), (0, 9, 0), 50),
}


def render_arenas(env, save, component, children, mesh_parts):
    """A ismert arénák kirajzolása: save(kulcs, PIL kép) hívódik mindegyikre."""
    from PIL import Image
    want = {name: key for key, (name, *_) in ARENAS.items()}
    n = 0
    for obj in env.objects:
        if obj.type.name != 'GameObject':
            continue
        try:
            name = obj.peek_name() if hasattr(obj, 'peek_name') else None
        except Exception:
            name = None
        if name and name not in want:
            continue
        try:
            go = obj.read()
        except Exception:
            continue
        key = want.get(go.m_Name)
        if not key:
            continue
        tr = component(go, 'Transform')
        if tr is None or (tr.m_Father and tr.m_Father.path_id):
            continue
        try:
            _, eye, target, fov = ARENAS[key]
            img = render(mesh_parts(tr), eye, target, fov, W=1920, H=1080, bg=(40, 30, 70, 255))
            im = Image.fromarray(img.clip(0, 255).astype(np.uint8)).convert('RGB').resize((960, 540), Image.LANCZOS)
        except Exception as e:  # egy hibás aréna ne állítsa meg a többit
            print(f'  ! aréna kihagyva ({go.m_Name}): {e}')
            continue
        save(key, im)
        del want[go.m_Name]
        n += 1
    return n
