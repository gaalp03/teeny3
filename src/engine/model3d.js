'use strict';
// 3D figurák: a saját APK-ból kimentett hálók (tools/render3d.py → assets/custom/models) valós idejű
// rajzolása WebGL-lel, rajzfilmes fénnyel és körvonallal. Egy közös vászonra rajzolunk, amit a hívó
// 2D vászonra másol (így a 3D figura ugyanúgy rétegződik, mint a rajzolt figurák).
(function (TT) {
  const SIZE = 384;   // a rajzolóvászon mérete (képpont)
  const SPAN = 2;     // a vászon ennyi egység széles és magas (a figura 1 egység magas)
  const FOOT = 0.15;  // a talp ennyi egységgel van a vászon alja fölött
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
      const names = [...new Set(data.parts.map((p) => p.tex).filter(Boolean))];
      const imgs = {};
      await Promise.all(names.map((n) => loadImage(base + n).then((img) => { imgs[n] = img; })));
      M.models[id] = { data, imgs, gpu: null, width: data.width || 1 };
      return true;
    } catch (e) {
      return false;
    } finally {
      M.pending--;
    }
  };

  M.has = (id) => !!(M.models[id] && M.ok !== false && init());

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
    const parts = [];
    for (const p of model.data.parts) {
      if (p.i32 && !M.uint32) continue;
      const buf = (arr, target) => {
        const b = gl.createBuffer();
        gl.bindBuffer(target || gl.ARRAY_BUFFER, b);
        gl.bufferData(target || gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
        return b;
      };
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
    model.imgs = null; // a képek már a GPU-n vannak
  }

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

  // Egy figura kirajzolása a közös vászonra; a vásznat adja vissza (vagy null-t)
  M.render = function (id, o) {
    const model = M.models[id];
    if (!model || !init()) return null;
    const gl = M.gl, L = M.loc;
    if (!model.gpu) upload(model);
    o = o || {};
    gl.viewport(0, 0, SIZE, SIZE);
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
      for (const p of model.gpu) {
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
    return M.canvas;
  };

  function normalize(v) {
    const l = Math.hypot(v[0], v[1], v[2]);
    return v.map((x) => x / l);
  }

  TT.model3d = M;
})(window.TT);
