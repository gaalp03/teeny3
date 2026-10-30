'use strict';
// 3D figurák: a saját APK-ból kimentett hálók (tools/render3d.py → assets/custom/models) valós idejű
// rajzolása WebGL-lel, rajzfilmes fénnyel és körvonallal. Egy közös vászonra rajzolunk, amit a hívó
// 2D vászonra másol (így a 3D figura ugyanúgy rétegződik, mint a rajzolt figurák).
(function (TT) {
  const SIZE = 512;   // a rajzolóvászon mérete (képpont)
  const SPAN = 2.6;   // a vászon ennyi egység széles és magas (a figura 1 egység magas)
  const FOOT = 0.3;   // a talp ennyi egységgel van a vászon alja fölött
  const OUTLINE = 0.011;

  const M = { SIZE, SPAN, FOOT, ok: null, gl: null, canvas: null, models: {}, pending: 0 };

  const VS = `
    attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUv;
    uniform mat3 uRot; uniform float uGrow; uniform float uFoot; uniform float uHalf;
    varying vec2 vUv; varying vec3 vN;
    void main() {
      vec3 p = uRot * (aPos + aNrm * uGrow);
      vN = uRot * aNrm;
      vUv = aUv;
      // elölnézet: a néző a +Z felől néz, az X tükrözve (mint a Unity kamera)
      gl_Position = vec4(-p.x / uHalf, (p.y + uFoot) / uHalf - 1.0, -p.z * 0.4, 1.0);
    }`;
  const FS = `
    precision mediump float;
    uniform sampler2D uTex; uniform float uHasTex; uniform float uCutout; uniform float uLine;
    uniform vec3 uLight; uniform float uFlash; uniform vec3 uTint;
    varying vec2 vUv; varying vec3 vN;
    void main() {
      if (uLine > 0.5) { gl_FragColor = vec4(0.114, 0.078, 0.2, 1.0); return; }
      vec4 c = uHasTex > 0.5 ? texture2D(uTex, vec2(fract(vUv.x), 1.0 - fract(vUv.y))) : vec4(0.8, 0.8, 0.8, 1.0);
      if (uCutout > 0.5 && c.a < 0.4) discard;
      float d = dot(normalize(vN), uLight);
      // két fokozatú, lágy átmenetű rajzfilmes fény + gyenge peremfény
      float l = 0.74 + 0.26 * smoothstep(-0.15, 0.35, d);
      float rim = smoothstep(0.55, 1.0, 1.0 - abs(normalize(vN).z)) * 0.12;
      vec3 col = c.rgb * l * uTint + rim;
      gl_FragColor = vec4(mix(col, vec3(1.0), uFlash), 1.0);
    }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function init() {
    if (M.ok !== null) return M.ok;
    M.ok = false;
    try {
      const c = document.createElement('canvas');
      c.width = c.height = SIZE;
      const gl = c.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: true });
      if (!gl) return false;
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const loc = {};
      for (const n of ['aPos', 'aNrm', 'aUv']) loc[n] = gl.getAttribLocation(prog, n);
      for (const n of ['uRot', 'uGrow', 'uFoot', 'uHalf', 'uTex', 'uHasTex', 'uCutout', 'uLine', 'uLight', 'uFlash', 'uTint']) loc[n] = gl.getUniformLocation(prog, n);
      M.uint32 = !!gl.getExtension('OES_element_index_uint');
      gl.enable(gl.DEPTH_TEST);
      // a tükrözött X miatt a Unity elülső lapjai itt az óramutató járása szerint körbejártak
      gl.frontFace(gl.CW);
      gl.depthFunc(gl.LEQUAL);
      gl.clearColor(0, 0, 0, 0);
      M.gl = gl;
      M.canvas = c;
      M.loc = loc;
      M.ok = true;
      c.addEventListener('webglcontextlost', (e) => {
        // a rendszer elvette a grafikus környezetet: visszaállunk a 2D képekre
        e.preventDefault();
        M.ok = false;
        if (TT.art) TT.art.clearCache();
      });
    } catch (e) {
      M.ok = false;
    }
    return M.ok;
  }

  function decode(b64, Type) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Type(bytes.buffer);
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Modell betöltése (JSON + textúrák); a GPU-ra csak az első rajzoláskor kerül
  M.load = async function (id, url) {
    M.pending++;
    try {
      const r = await fetch(url);
      if (!r.ok) return false;
      const data = await r.json();
      const base = url.slice(0, url.lastIndexOf('/') + 1);
      const all = data.parts.concat(data.rig ? data.rig.parts : []);
      const names = [...new Set(all.map((p) => p.tex).filter(Boolean))];
      const imgs = {};
      await Promise.all(names.map((n) => loadImage(base + n).then((img) => { imgs[n] = img; })));
      M.models[id] = { data, imgs, src: imgs, gpu: null, width: data.width || 1 };
      return true;
    } catch (e) {
      return false;
    } finally {
      M.pending--;
    }
  };

  // Átszínezett változat egy meglévő modellből (pl. Nindzsa Robin = Robin fekete-piros textúrával).
  // A háló és az animációk közösek, csak a textúra másolata más színű.
  // map: [['#honnan', '#hová', tűrés?], ...] pontos színcserék, vagy { hue: [tól, ig], to: '#hová' } színárnyalat-sáv
  M.derive = function (id, baseId, map) {
    const base = M.models[baseId];
    if (M.models[id] || !base || !base.src) return false;
    const imgs = {};
    const same = new Map(); // azonos tartalmú textúrák (pl. a háló és a rig ugyanazt használja) csak egyszer
    for (const [n, img] of Object.entries(base.src)) imgs[n] = img && recolor(img, map || [], same);
    M.models[id] = { data: base.data, imgs, gpu: null, width: base.width };
    return true;
  };

  // Az átszínezés a háttérben, kis szeletekben fut (telefonon egy-egy modell tíz-ötven ms), hogy ne akassza meg az indítást.
  // Ha a játék közben szükség van egy még le nem gyártott változatra, M.has() azonnal elkészíti.
  M.lazy = {};
  M.deriveLater = function (list, done) {
    for (const [id, base, map] of list) M.lazy[id] = { base, map };
    const queue = list.map((e) => e[0]);
    const step = () => {
      const t0 = performance.now();
      while (queue.length && performance.now() - t0 < 12) makeLazy(queue.shift());
      if (queue.length) setTimeout(step, 30);
      else {
        // a kiinduló képek már nem kellenek: a memória (és a GPU-textúra másolatok) felszabadulnak
        for (const m of Object.values(M.models)) m.src = null;
        if (done) done();
      }
    };
    setTimeout(step, 50);
  };
  function makeLazy(id) {
    const z = M.lazy[id];
    if (!z) return;
    delete M.lazy[id];
    M.derive(id, z.base, z.map);
  }

  function rgbOf(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hsv(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [h, mx ? d / mx : 0, mx / 255];
  }
  function fromHsv(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    const k = Math.floor(h / 60) % 6;
    const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }

  function recolor(img, map, same) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    if (!map.length) return c;
    const id = g.getImageData(0, 0, c.width, c.height);
    const px = new Uint32Array(id.data.buffer); // 0xAABBGGRR (little endian)
    // azonos tartalmú kép? akkor az előző eredményt használjuk
    let h = 2166136261;
    for (let i = 0; i < px.length; i++) h = Math.imul(h ^ px[i], 16777619);
    const sig = c.width + 'x' + c.height + ':' + (h >>> 0);
    if (same && same.has(sig)) return same.get(sig);
    const exact = [], hues = [];
    for (const r of map) {
      if (Array.isArray(r)) exact.push({ f: rgbOf(r[0]), t: rgbOf(r[1]), tol: r[2] || 40 });
      else hues.push({ a: r.hue[0], b: r.hue[1], minS: r.minS != null ? r.minS : 0.18, t: hsv(...rgbOf(r.to)) });
    }
    const memo = new Map();
    let lastIn = -1, lastOut = 0;
    for (let i = 0; i < px.length; i++) {
      const w = px[i];
      if (w === lastIn) {
        px[i] = lastOut; // egymás melletti azonos színű képpontok (a textúrák nagy része egyszínű folt)
        continue;
      }
      const a = w >>> 24;
      lastIn = w;
      if (!a) {
        lastOut = w;
        continue;
      }
      let out = memo.get(w);
      if (out === undefined) {
        out = null;
        const r = w & 255, gg = (w >> 8) & 255, b = (w >> 16) & 255;
        let best = null, bd = 1e9;
        for (const e of exact) {
          const d = Math.hypot(r - e.f[0], gg - e.f[1], b - e.f[2]);
          if (d < e.tol && d < bd) {
            bd = d;
            best = e;
          }
        }
        let rgb = null;
        if (best) {
          // a színfolt árnyalatai (élsimítás, átmenet) megmaradnak: az eltolás ugyanannyi
          rgb = [best.t[0] + r - best.f[0], best.t[1] + gg - best.f[1], best.t[2] + b - best.f[2]];
        } else {
          const [hh, sat, v] = hsv(r, gg, b);
          for (const e of hues) {
            const inside = e.a <= e.b ? hh >= e.a && hh <= e.b : hh >= e.a || hh <= e.b;
            if (inside && sat >= e.minS) {
              rgb = fromHsv(e.t[0], e.t[1], Math.min(1, v * e.t[2]));
              break;
            }
          }
        }
        if (rgb) {
          const cl = (x) => (x < 0 ? 0 : x > 255 ? 255 : Math.round(x));
          out = ((a << 24) | (cl(rgb[2]) << 16) | (cl(rgb[1]) << 8) | cl(rgb[0])) >>> 0;
        }
        memo.set(w, out);
      }
      lastOut = out === null ? w : out;
      px[i] = lastOut;
    }
    g.putImageData(id, 0, 0);
    if (same) same.set(sig, c);
    return c;
  }

  M.has = (id) => {
    if (M.lazy[id]) makeLazy(id);
    return !!(M.models[id] && M.ok !== false && init());
  };

  function upload(model) {
    const gl = M.gl;
    const tex = {};
    for (const [n, img] of Object.entries(model.imgs)) {
      if (!img) continue;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      tex[n] = t;
    }
    const buf = (arr, target, usage) => {
      const b = gl.createBuffer();
      gl.bindBuffer(target || gl.ARRAY_BUFFER, b);
      gl.bufferData(target || gl.ARRAY_BUFFER, arr, usage || gl.STATIC_DRAW);
      return b;
    };
    const parts = [];
    for (const p of model.data.parts) {
      if (p.i32 && !M.uint32) continue;
      const idx = decode(p.idx, p.i32 ? Uint32Array : Uint16Array);
      parts.push({
        pos: buf(decode(p.pos, Float32Array)),
        nrm: buf(decode(p.nrm, Float32Array)),
        uv: p.uv ? buf(decode(p.uv, Float32Array)) : null,
        idx: buf(idx, gl.ELEMENT_ARRAY_BUFFER),
        count: idx.length,
        type: p.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
        tex: p.tex ? tex[p.tex] : null,
        cutout: p.cutout,
      });
    }
    model.gpu = parts;
    // animált (harci) modell: a csúcsokat képkockánként a CPU számolja, ezért dinamikus pufferek
    const rig = model.data.rig;
    if (rig) {
      model.rigGpu = [];
      for (const p of rig.parts) {
        if (p.i32 && !M.uint32) continue;
        const bindPos = decode(p.pos, Float32Array);
        const bindNrm = decode(p.nrm, Float32Array);
        const idx = decode(p.idx, p.i32 ? Uint32Array : Uint16Array);
        model.rigGpu.push({
          bindPos, bindNrm,
          bi: p.bi ? decode(p.bi, Uint16Array) : null,
          bw: p.bw ? decode(p.bw, Uint8Array) : null,
          slot: p.slot,
          outPos: new Float32Array(bindPos.length),
          outNrm: new Float32Array(bindNrm.length),
          pos: buf(bindPos, null, gl.DYNAMIC_DRAW),
          nrm: buf(bindNrm, null, gl.DYNAMIC_DRAW),
          uv: p.uv ? buf(decode(p.uv, Float32Array)) : null,
          idx: buf(idx, gl.ELEMENT_ARRAY_BUFFER),
          count: idx.length,
          type: p.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
          tex: p.tex ? tex[p.tex] : null,
          cutout: p.cutout,
        });
      }
      model.mats = {};
      model.rigKey = null;
    }
    model.imgs = null; // a képek már a GPU-n vannak (az eredetiket a src őrzi, amíg az átszínezett változatok el nem készülnek)
  }

  // félpontos (16 bites) lebegőpontos számok visszaalakítása
  let HALF = null;
  function halfTable() {
    if (HALF) return HALF;
    HALF = new Float32Array(65536);
    for (let h = 0; h < 65536; h++) {
      const sg = h & 0x8000 ? -1 : 1, e = (h >> 10) & 31, f = h & 1023;
      HALF[h] = e === 0 ? sg * Math.pow(2, -14) * (f / 1024) : e === 31 ? (f ? 0 : sg * 65504) : sg * Math.pow(2, e - 15) * (1 + f / 1024);
    }
    return HALF;
  }
  function clipMats(model, name) {
    if (!model.mats[name]) {
      const raw = decode(model.data.rig.clips[name].m, Uint16Array);
      const tab = halfTable();
      const out = new Float32Array(raw.length);
      for (let i = 0; i < raw.length; i++) out[i] = tab[raw[i]];
      model.mats[name] = out;
    }
    return model.mats[name];
  }

  // A játék állapotából (pihen, üt, kap, kiesik…) a modell saját TT2-es animációja
  function pickClip(rig, a) {
    const c = rig.clips;
    const first = (...ns) => ns.find((n) => c[n]) || 'idle';
    const ab = rig.abilities || [];
    switch (a.name) {
      case 'ability': {
        if (!ab.length) return { name: 'idle', t: a.t || 0 };
        const i = a.slot === 'super' ? ab.length - 1 : (a.slot || 0) % ab.length;
        return { name: ab[i], p: a.p };
      }
      case 'hurt': return { name: first('hit small', 'small hit', 'hit'), t: a.t, once: true };
      case 'ko': return { name: first('death'), t: a.t, once: true };
      case 'stun': return { name: first('dizzy'), t: a.t };
      case 'cheer': return { name: first('dance', 'heroic pose'), t: a.t };
      case 'enter': return { name: first('swap in'), t: a.t, once: true };
      default: return { name: 'idle', t: a.t || 0 };
    }
  }

  function skin(model, anim) {
    const rig = model.data.rig;
    const pick = pickClip(rig, anim || {});
    const clip = rig.clips[pick.name] || rig.clips.idle;
    const name = rig.clips[pick.name] ? pick.name : 'idle';
    const n = clip.n;
    let f;
    if (pick.p != null) f = Math.round(Math.min(1, Math.max(0, pick.p)) * (n - 1));
    else {
      f = Math.floor(Math.max(0, pick.t) * rig.fps);
      f = pick.once ? Math.min(n - 1, f) : f % n;
    }
    const key = name + ':' + f;
    if (model.rigKey === key) return;
    model.rigKey = key;
    const M4 = clipMats(model, name);
    const base = f * rig.slots * 12;
    const gl = M.gl;
    const m = new Float32Array(12);
    for (const p of model.rigGpu) {
      const src = p.bindPos, srcN = p.bindNrm, out = p.outPos, outN = p.outNrm;
      const cnt = src.length / 3;
      if (p.slot != null) {
        const o = base + p.slot * 12;
        for (let k = 0; k < 12; k++) m[k] = M4[o + k];
      }
      for (let v = 0; v < cnt; v++) {
        if (p.slot == null) {
          m.fill(0);
          for (let j = 0; j < 4; j++) {
            const w = p.bw[v * 4 + j];
            if (!w) continue;
            const o = base + p.bi[v * 4 + j] * 12, ww = w / 255;
            for (let k = 0; k < 12; k++) m[k] += M4[o + k] * ww;
          }
        }
        const x = src[v * 3], y = src[v * 3 + 1], z = src[v * 3 + 2];
        out[v * 3] = m[0] * x + m[1] * y + m[2] * z + m[3];
        out[v * 3 + 1] = m[4] * x + m[5] * y + m[6] * z + m[7];
        out[v * 3 + 2] = m[8] * x + m[9] * y + m[10] * z + m[11];
        const a = srcN[v * 3], b = srcN[v * 3 + 1], c = srcN[v * 3 + 2];
        const nx = m[0] * a + m[1] * b + m[2] * c, ny = m[4] * a + m[5] * b + m[6] * c, nz = m[8] * a + m[9] * b + m[10] * c;
        const l = Math.hypot(nx, ny, nz) || 1;
        outN[v * 3] = nx / l;
        outN[v * 3 + 1] = ny / l;
        outN[v * 3 + 2] = nz / l;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, p.pos);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, out);
      gl.bindBuffer(gl.ARRAY_BUFFER, p.nrm);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, outN);
    }
  }

  M.animated = (id) => !!(M.models[id] && M.models[id].data.rig);

  // Forgatás: yaw a függőleges tengely körül, pitch előre-hátra, roll oldalra dőlés
  function rotation(yaw, pitch, roll) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    // R = Rx(pitch) * Rz(roll) * Ry(yaw), oszlopfolytonosan
    const ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
    const rz = [cr, sr, 0, -sr, cr, 0, 0, 0, 1];
    const rx = [1, 0, 0, 0, cp, sp, 0, -sp, cp];
    const mul = (a, b) => {
      const o = new Array(9);
      for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) {
        o[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2];
      }
      return o;
    };
    return new Float32Array(mul(rx, mul(rz, ry)));
  }

  // Kész képek tára: egy figurát csak akkor rajzolunk újra, ha a képe tényleg változott (új animációs
  // kocka, fordulás, villanás). A WebGL-vászon visszamásolása drága (főleg emulátoron), a TT2-es
  // animációk pedig csak 15 kockásak, így a legtöbb képkockán elég a tárolt képet kirakni.
  const cache = {};
  let cached = 0;
  // Képkockánkénti újrarajzolási keret: egy képkockán legfeljebb ennyi figura kap új képet, a többi
  // a legutóbbi (egy kockával régebbi) képét mutatja — így 6 animált figura sem fogja vissza az FPS-t.
  // A kis (padon ülő) figurák külön, kisebb keretből és ritkábban frissülnek, hogy ne vegyék el a
  // helyet a harcoló figurák elől.
  const BUDGET = { 512: 1, 256: 1 }, SMALL_EVERY = 0.5;
  const budget = { 512: 0, 256: 0 };
  let budgetT = -1;
  const lastAt = {};
  const r2 = (v) => Math.round((v || 0) * 100);

  // Egy figura kirajzolása; a kész képet (vásznat) adja vissza, vagy null-t.
  // o.res: a kép felbontása (256 a kis, padon ülő figurákhoz, egyébként 512)
  M.render = function (id, o) {
    const model = M.models[id];
    if (!model || !init()) return null;
    const gl = M.gl, L = M.loc;
    if (!model.gpu) upload(model);
    o = o || {};
    const animated = model.rigGpu && model.rigGpu.length && o.anim !== false;
    if (animated) skin(model, o.anim);
    const res = o.res === 256 ? 256 : SIZE;
    const key = [animated ? model.rigKey : '-', r2(o.yaw), r2(o.pitch), r2(o.roll), Math.round((o.flash || 0) * 20), (o.tint || [1, 1, 1]).join(','), res].join('|');
    const list = cache[id] || (cache[id] = []);
    const hit = list.find((e) => e.key === key);
    if (hit) return hit.canvas;
    const now = TT.rtime || 0;
    if (now !== budgetT) {
      budgetT = now;
      budget[512] = BUDGET[512];
      budget[256] = BUDGET[256];
    }
    const prev = list.length && list[list.length - 1];
    if (prev && prev.canvas.width === res && (budget[res] <= 0 || (res === 256 && !o.live && now - (lastAt[id] || 0) < SMALL_EVERY))) return prev.canvas;
    budget[res]--;
    lastAt[id] = now;
    gl.viewport(0, 0, res, res);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix3fv(L.uRot, false, rotation(o.yaw || 0, o.pitch || 0, o.roll || 0));
    gl.uniform1f(L.uFoot, FOOT);
    gl.uniform1f(L.uHalf, SPAN / 2);
    gl.uniform3fv(L.uLight, normalize([-0.45, 0.6, 0.65]));
    gl.uniform1f(L.uFlash, o.flash || 0);
    gl.uniform3fv(L.uTint, o.tint || [1, 1, 1]);
    gl.enable(gl.CULL_FACE);
    for (const line of [true, false]) {
      // 1) körvonal: kifelé tolt hátlapok sötéten, 2) maga a figura (a játék shaderéhez hasonlóan Cull Back)
      gl.uniform1f(L.uLine, line ? 1 : 0);
      gl.uniform1f(L.uGrow, line ? OUTLINE : 0);
      for (const p of animated ? model.rigGpu : model.gpu) {
        if (line && p.cutout) continue;
        if (p.cutout) gl.disable(gl.CULL_FACE);
        else {
          gl.enable(gl.CULL_FACE);
          gl.cullFace(line ? gl.FRONT : gl.BACK);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, p.pos);
        gl.enableVertexAttribArray(L.aPos);
        gl.vertexAttribPointer(L.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, p.nrm);
        gl.enableVertexAttribArray(L.aNrm);
        gl.vertexAttribPointer(L.aNrm, 3, gl.FLOAT, false, 0, 0);
        if (p.uv) {
          gl.bindBuffer(gl.ARRAY_BUFFER, p.uv);
          gl.enableVertexAttribArray(L.aUv);
          gl.vertexAttribPointer(L.aUv, 2, gl.FLOAT, false, 0, 0);
        } else {
          gl.disableVertexAttribArray(L.aUv);
          gl.vertexAttrib2f(L.aUv, 0, 0);
        }
        gl.uniform1f(L.uHasTex, p.tex ? 1 : 0);
        gl.uniform1f(L.uCutout, p.cutout ? 1 : 0);
        if (p.tex) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, p.tex);
          gl.uniform1i(L.uTex, 0);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.idx);
        gl.drawElements(gl.TRIANGLES, p.count, p.type, 0);
      }
    }
    // a kész kép átmásolása a figura saját tárolt vásznára (figuránként legfeljebb 2 változat)
    if (cached > 40) {
      for (const k of Object.keys(cache)) delete cache[k];
      cached = 0;
    }
    let e;
    if (list.length >= 2) e = list.shift();
    else {
      e = { canvas: document.createElement('canvas') };
      cached++;
    }
    if (e.canvas.width !== res) e.canvas.width = e.canvas.height = res;
    const c2 = e.canvas.getContext('2d');
    c2.clearRect(0, 0, res, res);
    // a viewport a vászon bal alsó sarkában van
    c2.drawImage(M.canvas, 0, SIZE - res, res, res, 0, 0, res, res);
    e.key = key;
    list.push(e);
    return e.canvas;
  };

  function normalize(v) {
    const l = Math.hypot(v[0], v[1], v[2]);
    return v.map((x) => x / l);
  }

  TT.model3d = M;
})(window.TT);
