'use strict';
// Szintetizált hangeffektek és chiptune zene — nincs szükség hangfájlokra.
(function (TT) {
  const A = {
    ctx: null, master: null, musicGain: null, sfxGain: null,
    unlocked: false, wanted: null, current: null, noiseBuf: null,
    musicVol: 0.5, sfxVol: 0.7, muted: false,
  };

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function noteFreq(n) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    if (!m) return 0;
    let semi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const oct = parseInt(m[3], 10);
    const midi = (oct + 1) * 12 + semi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  A.noteFreq = noteFreq;

  A.unlock = function () {
    if (A.unlocked && A.ctx && A.ctx.state === 'running') return;
    try {
      if (!A.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        A.ctx = new AC();
        A.master = A.ctx.createGain();
        A.master.connect(A.ctx.destination);
        const comp = A.ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 4;
        comp.connect(A.master);
        A.musicGain = A.ctx.createGain();
        A.sfxGain = A.ctx.createGain();
        // a szinkronhangok (Titánok, gonoszok, bemondó) külön hangerőn
        A.voiceGain = A.ctx.createGain();
        A.musicGain.connect(comp);
        A.sfxGain.connect(comp);
        A.voiceGain.connect(comp);
        const len = A.ctx.sampleRate;
        A.noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
        const d = A.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        A.applyVolumes();
        setInterval(tick, 25);
      }
      if (A.ctx.state !== 'running') A.ctx.resume();
      A.unlocked = true;
      A.preloadSfx();
      A.preloadVoices();
      if (A.wanted && !A.current) A.music(A.wanted, true);
    } catch (e) {
      // Hang nélkül is megy a játék
    }
  };

  A.applyVolumes = function () {
    const s = TT.settings || {};
    A.musicVol = s.music != null ? s.music : 0.5;
    A.sfxVol = s.sfx != null ? s.sfx : 0.7;
    A.voiceVol = s.voice != null ? s.voice : A.sfxVol;
    A.muted = !!s.muted;
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    A.master.gain.setTargetAtTime(A.muted ? 0 : 1, t, 0.02);
    A.musicGain.gain.setTargetAtTime(A.musicVol * 0.85, t, 0.05);
    A.sfxGain.gain.setTargetAtTime(A.sfxVol * 0.9, t, 0.02);
    A.voiceGain.gain.setTargetAtTime(A.voiceVol * 0.9, t, 0.02);
  };

  A.setHidden = function (hidden) {
    if (!A.ctx) return;
    if (hidden) A.ctx.suspend();
    else if (A.unlocked) A.ctx.resume();
  };

  // ---------- Alap hangszerek ----------
  function tone(freq, dur, o) {
    o = o || {};
    const c = A.ctx;
    const t0 = (o.at != null ? o.at : c.currentTime) + (o.delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
    if (o.detune) osc.detune.value = o.detune;
    const vol = o.vol != null ? o.vol : 0.2;
    const atk = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + atk);
    if (o.sustain) {
      g.gain.setValueAtTime(vol, t0 + Math.max(atk, dur - (o.release || 0.04)));
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    }
    if (o.vibrato) {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = o.vibrato;
      lg.gain.value = freq * 0.012;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.05);
    }
    osc.connect(g);
    g.connect(o.dest || A.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, o) {
    o = o || {};
    const c = A.ctx;
    const t0 = (o.at != null ? o.at : c.currentTime) + (o.delay || 0);
    const src = c.createBufferSource();
    src.buffer = A.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 2000, t0);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t0 + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain();
    const vol = o.vol != null ? o.vol : 0.2;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.dest || A.sfxGain);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  }

  function arp(notes, step, o) {
    notes.forEach((n, i) => tone(typeof n === 'number' ? n : noteFreq(n), (o && o.len) || step * 1.6, Object.assign({}, o, { delay: i * step })));
  }

  const SFX = {
    select: () => { tone(880, 0.06, { vol: 0.12 }); tone(1320, 0.08, { vol: 0.1, delay: 0.05 }); },
    move: () => tone(660, 0.04, { vol: 0.06 }),
    back: () => tone(440, 0.09, { vol: 0.1, slide: 300 }),
    talk: () => tone(480 + Math.random() * 220, 0.035, { vol: 0.035 }),
    next: () => {}, // új buborék: csak az eredeti TT2-hang szól, a beépített csendes
    step: () => noise(0.04, { vol: 0.025, freq: 900 }),
    hit: () => { noise(0.12, { vol: 0.3, freq: 1800, slide: 400 }); tone(160, 0.12, { type: 'sine', vol: 0.35, slide: 60 }); },
    hit2: () => { noise(0.28, { vol: 0.4, freq: 1400, slide: 200 }); tone(120, 0.3, { type: 'sine', vol: 0.5, slide: 35 }); tone(80, 0.25, { type: 'square', vol: 0.08, slide: 40 }); },
    crit: () => { SFX.hit2(); tone(1400, 0.12, { vol: 0.1, slide: 2200, type: 'triangle' }); },
    block: () => { tone(320, 0.06, { vol: 0.14 }); noise(0.07, { vol: 0.2, filter: 'bandpass', freq: 3200, q: 4 }); },
    perfect: () => { arp(['C6', 'E6', 'G6', 'C7'], 0.045, { type: 'triangle', vol: 0.16 }); noise(0.3, { vol: 0.08, filter: 'highpass', freq: 6000 }); },
    guardbreak: () => { noise(0.35, { vol: 0.35, filter: 'bandpass', freq: 900, q: 2 }); tone(500, 0.35, { type: 'sawtooth', vol: 0.12, slide: 90 }); },
    thunder: () => { noise(1.6, { vol: 0.32, freq: 420, slide: 60 }); noise(0.45, { vol: 0.22, freq: 1500, slide: 200, delay: 0.04 }); tone(55, 1.3, { type: 'sine', vol: 0.22, slide: 30 }); },
    ko: () => { tone(620, 0.7, { type: 'sawtooth', vol: 0.14, slide: 70 }); noise(0.5, { vol: 0.15, freq: 800, slide: 100 }); },
    coin: () => { tone(988, 0.07, { vol: 0.1 }); tone(1319, 0.18, { vol: 0.1, delay: 0.07 }); },
    box: () => { noise(0.08, { vol: 0.12, freq: 1200 }); tone(200 + Math.random() * 80, 0.05, { vol: 0.06, type: 'triangle' }); },
    reveal: () => { arp(['G5', 'C6', 'E6', 'G6', 'C7'], 0.06, { type: 'square', vol: 0.09 }); noise(0.6, { vol: 0.07, filter: 'highpass', freq: 7000 }); },
    legend: () => { arp(['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7', 'E7'], 0.07, { type: 'triangle', vol: 0.14 }); tone(130.8, 1.2, { type: 'sine', vol: 0.25 }); },
    heal: () => { tone(523, 0.35, { type: 'sine', vol: 0.15, slide: 1046 }); arp(['E6', 'G6', 'C7'], 0.07, { type: 'triangle', vol: 0.06, delay: 0.1 }); },
    shield: () => { tone(300, 0.3, { type: 'triangle', vol: 0.15, slide: 600, vibrato: 18 }); },
    buff: () => { arp(['C5', 'G5', 'C6'], 0.05, { type: 'square', vol: 0.07 }); },
    debuff: () => { arp(['C5', 'Gb4', 'C4'], 0.06, { type: 'sawtooth', vol: 0.06 }); },
    ready: () => tone(1568, 0.06, { type: 'triangle', vol: 0.05 }),
    windup: () => tone(260, 0.18, { type: 'triangle', vol: 0.08, slide: 520 }),
    super: () => { tone(180, 0.7, { type: 'sawtooth', vol: 0.12, slide: 1800 }); noise(0.7, { vol: 0.12, filter: 'bandpass', freq: 600, slide: 5000, q: 2 }); },
    swap: () => { tone(380, 0.12, { type: 'triangle', vol: 0.13, slide: 800 }); },
    whoosh: () => noise(0.18, { vol: 0.12, filter: 'bandpass', freq: 800, slide: 3000, q: 1.5 }),
    zap: () => { tone(900, 0.25, { type: 'sawtooth', vol: 0.08, slide: 200 }); noise(0.2, { vol: 0.08, filter: 'highpass', freq: 3000 }); },
    magic: () => { tone(700, 0.3, { type: 'triangle', vol: 0.1, vibrato: 12, slide: 1100 }); },
    burn: () => noise(0.25, { vol: 0.1, filter: 'bandpass', freq: 1500, slide: 400, q: 1 }),
    freeze: () => { arp(['E7', 'B6', 'G6'], 0.04, { type: 'triangle', vol: 0.06 }); },
    stun: () => { arp(['A6', 'E6', 'A6', 'E6'], 0.05, { type: 'square', vol: 0.04 }); },
    buy: () => { SFX.coin(); tone(1760, 0.12, { vol: 0.07, delay: 0.16, type: 'triangle' }); },
    levelup: () => arp(['C5', 'E5', 'G5', 'C6', 'G5', 'C6'], 0.07, { type: 'square', vol: 0.08 }),
    door: () => { tone(300, 0.08, { type: 'triangle', vol: 0.1 }); tone(450, 0.1, { type: 'triangle', vol: 0.1, delay: 0.08 }); },
    countdown: () => tone(660, 0.12, { vol: 0.12 }),
    go: () => { tone(1320, 0.3, { vol: 0.12 }); tone(660, 0.3, { vol: 0.08, type: 'triangle' }); },
    crowd: () => noise(1.1, { vol: 0.08, filter: 'bandpass', freq: 1100, q: 0.6 }),
    found: () => arp(['G5', 'B5', 'D6', 'G6'], 0.08, { type: 'triangle', vol: 0.12 }),
    // TT2-hanggal felülírhatók: NPC megszólítása, teljesített küldetés
    npc: () => tone(740, 0.07, { type: 'triangle', vol: 0.1 }),
    mission: () => arp(['E5', 'G5', 'C6'], 0.07, { type: 'triangle', vol: 0.11 }),
    cue: () => tone(1046, 0.09, { type: 'sine', vol: 0.12 }),
    land: () => { noise(0.08, { vol: 0.08, filter: 'lowpass', freq: 500 }); tone(196, 0.08, { type: 'triangle', vol: 0.08 }); },
    dlgopen: () => tone(660, 0.07, { type: 'triangle', vol: 0.07 }),
    dlgclose: () => tone(495, 0.07, { type: 'triangle', vol: 0.06 }),
    dramatic: () => { tone(147, 0.3, { type: 'square', vol: 0.06 }); tone(139, 0.3, { type: 'square', vol: 0.06, delay: 0.4 }); tone(110, 0.8, { type: 'square', vol: 0.07, delay: 0.8 }); },
    teleport: () => arp(['C5', 'G5', 'C6', 'G6'], 0.05, { type: 'sine', vol: 0.1 }),
    pause: () => tone(523, 0.1, { type: 'triangle', vol: 0.1 }),
    krypto: () => { noise(0.12, { vol: 0.12, filter: 'bandpass', freq: 700, q: 2 }); noise(0.12, { vol: 0.12, filter: 'bandpass', freq: 800, q: 2, delay: 0.18 }); },
    penguin: () => { tone(620, 0.08, { type: 'square', vol: 0.06 }); tone(520, 0.12, { type: 'square', vol: 0.06, delay: 0.09 }); },
    lantern: () => arp(['G4', 'D5', 'G5', 'D6'], 0.06, { type: 'sine', vol: 0.1 }),
    wheel: () => arp(['C5', 'D5', 'E5', 'G5'], 0.09, { type: 'triangle', vol: 0.08 }),
    wheelstop: () => { tone(880, 0.08, { vol: 0.12 }); tone(1320, 0.16, { vol: 0.1, delay: 0.08 }); },
    superfull: () => arp(['C5', 'E5', 'G5', 'C6', 'G5', 'C6'], 0.07, { type: 'square', vol: 0.08 }),
    honk: () => { tone(392, 0.16, { type: 'square', vol: 0.05 }); tone(466, 0.16, { type: 'square', vol: 0.05 }); tone(392, 0.2, { type: 'square', vol: 0.05, delay: 0.22 }); tone(466, 0.2, { type: 'square', vol: 0.05, delay: 0.22 }); },
  };

  // Saját (eredeti) hangeffektek: ha be van töltve, az szól; az első hívás csak elindítja a betöltést
  const sfxBuf = {};
  function customSfx(name) {
    const url = TT.custom && TT.custom.sfx && TT.custom.sfx[name];
    if (!url) return false;
    if (sfxBuf[name] === undefined) {
      sfxBuf[name] = null;
      loadBuffer(url).then((b) => { sfxBuf[name] = b || false; });
      return false;
    }
    const buf = sfxBuf[name];
    if (!buf) return false;
    const src = A.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(A.sfxGain);
    src.start();
    return src;
  }
  A.preloadSfx = function () {
    if (!A.ctx || !TT.custom || !TT.custom.sfx) return;
    for (const name of Object.keys(TT.custom.sfx)) {
      if (sfxBuf[name] === undefined) {
        sfxBuf[name] = null;
        loadBuffer(TT.custom.sfx[name]).then((b) => { sfxBuf[name] = b || false; });
      }
    }
    for (const url of Object.values(TT.custom.moves || {})) {
      if (moveBuf[url] === undefined) {
        moveBuf[url] = null;
        loadBuffer(url).then((b) => { moveBuf[url] = b || false; });
      }
    }
  };

  // Eredeti TT2 képességhang a támadáshoz (előbb a támadás saját hangja, aztán a fajtájáé);
  // false, ha nincs vagy még töltődik — ilyenkor a beépített hang szól
  const moveBuf = {};
  A.move = function (move) {
    if (!A.ctx || !A.unlocked || A.muted || !TT.custom || !TT.custom.moves || !move) return false;
    const url = TT.custom.moves[move.id] || TT.custom.moves[move.fx];
    if (!url) return false;
    if (moveBuf[url] === undefined) {
      moveBuf[url] = null;
      loadBuffer(url).then((b) => { moveBuf[url] = b || false; });
      return false;
    }
    const buf = moveBuf[url];
    if (!buf) return false;
    const src = A.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(A.sfxGain);
    src.start();
    return true;
  };

  // Szinkronhangok (a saját APK-ból): figura és helyzet szerint, egyszerre csak egy, sűrűn nem
  const voiceBuf = {};
  let voiceUntil = 0;
  A.voice = function (figId, kind, chance) {
    if (!A.ctx || !A.unlocked || A.muted || !TT.custom || !TT.custom.voice) return;
    const base = TT.baseOf ? TT.baseOf(figId) : figId;
    const list = TT.custom.voice[base] && TT.custom.voice[base][kind];
    if (!list || !list.length || Math.random() > (chance == null ? 1 : chance)) return;
    const now = A.ctx.currentTime;
    if (now < voiceUntil) return;
    const url = list[Math.floor(Math.random() * list.length)];
    if (voiceBuf[url] === undefined) {
      voiceBuf[url] = null;
      loadBuffer(url).then((b) => { voiceBuf[url] = b || false; });
    }
    const buf = voiceBuf[url];
    if (!buf) return false;
    const src = A.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(A.voiceGain);
    src.start();
    voiceUntil = now + buf.duration + 0.4;
    return true;
  };
  // A TT2 bemondója kimondja a figura nevét (csak a pontosan egyező figuráknál, a változatoknál nem)
  A.announce = function (figId) {
    if (!A.ctx || !A.unlocked || A.muted || !TT.custom || !TT.custom.voice) return;
    const list = TT.custom.voice[figId] && TT.custom.voice[figId].name;
    if (!list) return;
    if (voiceBuf[list[0]] === undefined) {
      voiceBuf[list[0]] = null;
      loadBuffer(list[0]).then((b) => { voiceBuf[list[0]] = b || false; });
    }
    const buf = voiceBuf[list[0]];
    if (!buf) return;
    const src = A.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(A.voiceGain);
    src.start();
    voiceUntil = A.ctx.currentTime + buf.duration + 0.4;
  };
  // az első figura a listából, akinek van ilyen szinkronja (pl. a csapatból az, aki kimondja a „Rajta!”-t)
  A.voiceFrom = function (ids, kind, chance) {
    if (!TT.custom || !TT.custom.voice) return;
    const id = ids.find((x) => {
      const v = TT.custom.voice[TT.baseOf ? TT.baseOf(x) : x];
      return v && v[kind] && v[kind].length;
    });
    return id ? A.voice(id, kind, chance) : false;
  };
  A.preloadVoices = function () {
    if (!A.ctx || !TT.custom || !TT.custom.voice) return;
    for (const kinds of Object.values(TT.custom.voice)) {
      for (const list of Object.values(kinds)) {
        for (const url of list) {
          if (voiceBuf[url] === undefined) {
            voiceBuf[url] = null;
            loadBuffer(url).then((b) => { voiceBuf[url] = b || false; });
          }
        }
      }
    }
  };

  A.sfx = function (name) {
    // a hibahang (nem töltött támadás, rossz kvízválasz stb.) zavaró volt, ezért sehol nem szól
    if (name === 'error') return;
    if (!A.ctx || !A.unlocked || A.muted) return;
    // a saját (TT2) hangnál a lejátszót adja vissza, így egy hosszú hang leállítható (pl. a szerencsekerék pörgése)
    const src = customSfx(name);
    if (src) return src;
    const f = SFX[name];
    if (f) {
      try { f(); } catch (e) { /* hang hiba nem állítja meg a játékot */ }
    }
  };

  // ---------- Zene ----------
  const CHORD = {
    '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus: [0, 5, 7],
  };
  function chordNotes(name, oct) {
    const m = /^([A-G][#b]?)(m7|maj7|m|7|sus)?$/.exec(name);
    const root = noteFreq(m[1] + oct);
    const q = CHORD[m[2] || ''];
    return q.map((s) => root * Math.pow(2, s / 12));
  }

  function parseSeq(str) {
    const out = [];
    for (const tok of str.trim().split(/\s+/)) {
      const [n, d] = tok.split(':');
      out.push({ f: n === 'r' ? 0 : noteFreq(n), d: d ? parseFloat(d) : 1 });
    }
    return out;
  }

  // Dalszerkesztő: akkordokból basszus + arpeggio, kézzel írt dallam
  function song(o) {
    const ch = [];
    if (o.lead) ch.push({ seq: parseSeq(o.lead), type: o.leadType || 'square', vol: o.leadVol || 0.12, len: 0.9, vibrato: o.vibrato || 5 });
    if (o.lead2) ch.push({ seq: parseSeq(o.lead2), type: 'triangle', vol: 0.08, len: 0.9 });
    if (o.chords) {
      const bass = [], arpS = [];
      for (const c of o.chords) {
        const notes = chordNotes(c, 2);
        const r = notes[0];
        const style = o.bass || 'oct';
        if (style === 'oct') for (let i = 0; i < 8; i++) bass.push({ f: i % 2 ? r * 2 : r, d: 2 });
        else if (style === 'pump') for (let i = 0; i < 8; i++) bass.push({ f: r, d: 2 });
        else if (style === 'walk') [r, notes[2], r * 2, notes[2]].forEach((f) => bass.push({ f, d: 4 }));
        else if (style === 'half') [r, r * 2].forEach((f) => bass.push({ f, d: 8 }));
        if (o.arp !== false) {
          const an = chordNotes(c, 4);
          const pat = [0, 1, 2, 1];
          for (let i = 0; i < 16; i++) arpS.push({ f: an[pat[i % 4] % an.length] * (i % 8 >= 4 ? 2 : 1), d: 1 });
        }
      }
      ch.push({ seq: bass, type: o.bassType || 'triangle', vol: o.bassVol || 0.22, len: 0.85 });
      if (arpS.length) ch.push({ seq: arpS, type: 'square', vol: o.arpVol || 0.035, len: 0.6 });
    }
    if (o.drums) {
      const bars = o.chords ? o.chords.length : 8;
      let s = '';
      for (let i = 0; i < bars; i++) s += Array.isArray(o.drums) ? o.drums[i % o.drums.length] : o.drums;
      ch.push({ drums: s });
    }
    return { bpm: o.bpm, ch, loop: o.loop !== false };
  }

  const SONGS = {
    title: song({
      bpm: 116, chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'], bass: 'oct',
      lead: 'E5:4 G5:4 C6:6 B5:2 B5:2 A5:2 G5:4 D5:4 G5:4 A5:4 E5:4 C6:6 B5:2 A5:4 C6:4 F6:4 E6:2 D6:2 ' +
        'E6:4 C6:4 G5:6 E5:2 D5:2 G5:2 B5:4 D6:4 B5:4 C6:2 A5:2 F5:4 A5:2 C6:2 F6:4 G5:4 B5:4 D6:4 G6:4',
      drums: 'k...s...k.k.s..h',
    }),
    town: song({
      bpm: 126, chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'], bass: 'walk',
      lead: 'G4:2 C5:2 E5:2 G5:2 E5:4 C5:2 D5:2 E5:2 C5:2 A4:4 C5:2 E5:2 A5:4 ' +
        'A5:2 G5:2 F5:2 A5:2 C6:4 A5:2 F5:2 G5:6 F5:2 E5:2 D5:2 B4:4 ' +
        'G4:2 C5:2 E5:2 G5:2 C6:4 B5:2 A5:2 G5:2 E5:2 C5:4 E5:2 A5:2 G5:4 ' +
        'F5:2 E5:2 D5:2 F5:2 A5:4 G5:2 F5:2 D5:4 G5:4 B5:4 r:4',
      drums: 'k.h.s.h.k.hks.h.',
      leadType: 'square', leadVol: 0.1,
    }),
    battle: song({
      bpm: 152, chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'], bass: 'oct', bassType: 'sawtooth', bassVol: 0.12,
      lead: 'A4:2 C5:2 E5:2 A5:2 G5:2 E5:2 C5:2 E5:2 F5:3 E5:1 F5:2 A5:2 C6:4 A5:4 ' +
        'G5:2 E5:2 C5:2 E5:2 G5:2 C6:2 B5:2 G5:2 B5:4 A5:2 G5:2 D5:4 G5:4 ' +
        'A5:2 E5:2 A5:2 B5:2 C6:4 B5:2 A5:2 A5:2 F5:2 C5:2 F5:2 A5:4 C6:4 ' +
        'B5:2 G5:2 D5:2 G5:2 B5:2 D6:2 B5:2 G5:2 G#5:4 E5:4 B4:4 E5:4',
      drums: 'k.hks.hkk.hks.hs',
    }),
    boss: song({
      bpm: 164, chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A'], bass: 'oct', bassType: 'sawtooth', bassVol: 0.14,
      lead: 'D5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:2 A5:2 Bb5:4 A5:2 F5:2 D5:4 F5:4 ' +
        'E5:2 G5:2 C6:2 G5:2 E5:2 G5:2 C6:2 E6:2 C#6:4 A5:4 E5:4 C#5:4 ' +
        'D6:4 C6:2 A5:2 F5:4 A5:4 D6:2 C6:2 Bb5:2 F5:2 D5:4 F5:4 ' +
        'G5:2 Bb5:2 D6:2 Bb5:2 G5:2 D5:2 G5:4 E5:2 A5:2 C#6:2 E6:2 C#6:4 A5:4',
      drums: 'kkhsk.hskkhsk.hs', leadType: 'sawtooth', leadVol: 0.07,
    }),
    shop: song({
      bpm: 108, chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C'], bass: 'walk', arpVol: 0.03,
      lead: 'C5:3 A4:1 C5:2 F5:4 E5:2 F5:4 D5:3 F5:1 A5:4 G5:2 F5:2 D5:4 D5:2 F5:2 Bb5:4 A5:2 G5:2 F5:4 E5:4 G5:4 C6:4 r:4 ' +
        'A5:3 F5:1 A5:2 C6:4 Bb5:2 A5:4 F5:3 A5:1 D6:4 C6:2 A5:2 F5:4 D5:2 F5:2 Bb5:4 A5:2 G5:2 D5:4 E5:4 G5:4 F5:8',
      drums: 'k..hs.h.k.khs.h.', leadType: 'triangle', leadVol: 0.16,
    }),
    comics: song({
      bpm: 126, chords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D'], bass: 'walk', arpVol: 0.03,
      lead: 'G5:2 B5:2 D6:2 B5:2 G5:4 D5:4 E5:2 G5:2 B5:2 G5:2 E6:4 B5:4 C6:2 B5:2 A5:2 G5:2 E5:4 G5:4 F#5:2 A5:2 D6:4 C6:2 B5:2 A5:4 ' +
        'B5:2 D6:2 G6:4 F#6:2 E6:2 D6:4 E6:2 D6:2 B5:2 G5:2 E5:4 G5:4 A5:2 C6:2 E6:4 D6:2 C6:2 A5:4 D6:4 C6:2 A5:2 F#5:4 r:4',
      drums: 'k.h.s.hkk.h.s.h.', leadType: 'triangle', leadVol: 0.15,
    }),
    hive: song({
      bpm: 120, chords: ['Em', 'C', 'Am', 'B', 'Em', 'C', 'D', 'B'], bass: 'oct', bassType: 'square', bassVol: 0.09,
      lead: 'E5:4 G5:2 B5:2 A5:4 G5:2 F#5:2 E5:4 G5:4 C6:4 B5:4 A5:4 C6:2 B5:2 A5:4 E5:4 D#5:4 F#5:4 B5:8 ' +
        'E5:2 F#5:2 G5:2 B5:2 E6:4 D6:4 C6:4 B5:2 A5:2 G5:4 E5:4 D5:4 F#5:4 A5:4 D6:4 B5:8 F#5:8',
      drums: 'k.h.skh.k.h.s.hh', leadType: 'square', leadVol: 0.08,
    }),
    tower: song({
      bpm: 100, chords: ['C', 'Em', 'F', 'G', 'Am', 'Em', 'F', 'G'], bass: 'half', arpVol: 0.04,
      lead: 'E5:6 D5:2 C5:4 G4:4 B4:6 C5:2 D5:4 G5:4 A5:6 G5:2 F5:4 C5:4 D5:8 G4:8 ' +
        'C5:4 E5:4 A5:6 G5:2 G5:4 E5:4 B4:8 A4:4 C5:4 F5:6 E5:2 D5:4 B4:4 G4:8',
      drums: 'k.......s.......', leadType: 'triangle', leadVol: 0.15,
    }),
    pizza: song({
      bpm: 172, chords: ['C', 'G', 'C', 'G', 'F', 'C', 'G', 'C'], bass: 'pump', bassType: 'square', bassVol: 0.08, arp: false,
      lead: 'C5:2 E5:2 G5:2 E5:2 C6:4 G5:4 B4:2 D5:2 G5:2 D5:2 B5:4 G5:4 C5:2 E5:2 G5:2 C6:2 E6:4 C6:4 D6:2 B5:2 G5:2 B5:2 D6:4 r:4 ' +
        'A5:2 F5:2 C5:2 F5:2 A5:4 C6:4 G5:2 E5:2 C5:2 E5:2 G5:4 C6:4 B5:2 A5:2 G5:2 F5:2 E5:2 D5:2 B4:4 C5:4 G4:4 C5:8',
      drums: 'k.s.k.s.k.s.kks.', leadType: 'square', leadVol: 0.08,
    }),
    vault: song({
      bpm: 112, chords: ['Am', 'Dm', 'E', 'Am', 'F', 'Dm', 'E7', 'E'], bass: 'oct', bassType: 'triangle', bassVol: 0.2, arpVol: 0.025,
      lead: 'A4:2 r:2 C5:2 r:2 E5:2 r:2 D5:4 F5:2 r:2 A5:2 r:2 G5:2 F5:2 E5:4 G#5:2 r:2 B5:2 r:2 E6:4 D6:2 C6:2 B5:2 A5:6 r:8 ' +
        'C6:2 r:2 A5:2 r:2 F5:4 E5:4 D5:2 F5:2 A5:2 D6:2 C6:4 A5:4 B5:2 G#5:2 E5:2 D5:2 B4:4 E5:4 G#5:8 B5:8',
      drums: 'k...h.s.k.h.s..h', leadType: 'triangle', leadVol: 0.14,
    }),
    victory: song({
      bpm: 150, loop: false, chords: ['C', 'G', 'C', 'C'], bass: 'half', arp: false,
      lead: 'C5:2 E5:2 G5:2 C6:6 B5:2 C6:2 D6:2 E6:6 D6:2 E6:2 G6:12 r:16',
      drums: ['k.h.k.h.k.h.s.s.', 'k.h.k.h.k.h.s.s.', 'k...s...k...s...', 'k...............'],
    }),
    defeat: song({
      bpm: 90, loop: false, chords: ['Am', 'F', 'Dm', 'E'], bass: 'half', arp: false,
      lead: 'E5:4 D5:4 C5:4 B4:4 A4:4 G4:4 F4:8 F4:4 E4:4 D4:8 E4:16',
    }),
  };

  // Ha nincs saját zene és szintetizált dal sincs ilyen néven, ezek helyettesítik
  // saját TT2-zene nélkül ezek a (szintetizált) dalok szólnak helyettük
  const ALIAS = {
    town_night: 'town', dome: 'shop', collection: 'shop', credits: 'title', training: 'battle',
    hood: 'boss', lod: 'boss', gotham_night: 'boss', gotham_day: 'boss', metropolis_night: 'boss', metropolis_day: 'boss',
  };
  A.isBossTune = (name) => name === 'boss' || ALIAS[name] === 'boss';
  // A TT2 harci számai: minden harc elején ezekből választ (nem ismétli kétszer ugyanazt egymás után).
  // Az edzők saját zenéje (pl. Slade: lod, Joker: gotham_night) marad, csak az általános harci és főellenség-zene vált.
  // (a 'credits' a TT2 „Night Begins To Shine” száma, a stáblistán kívül itt is szól)
  // A városok (Gotham, Metropolis, Jump City) háttérzenéi nem harci számok, azok itt nem szerepelnek.
  const BATTLE_MIX = {
    battle: ['battle', 'credits', 'dome'],
    boss: ['boss', 'credits', 'lod', 'hood'],
  };
  const MIX_NAMES = new Set([].concat(...Object.values(BATTLE_MIX)));
  A.pickBattle = function (name) {
    const key = name || 'battle';
    const own = TT.custom && TT.custom.userMusic && TT.custom.userMusic.battle;
    // „mindig Night Begins To Shine” (az általános harci és főellenség-zene helyett)
    if (!own && TT.settings.battleMix === 'nbts' && BATTLE_MIX[key] && sampledUrl('credits')) return 'credits';
    const pool = !own && TT.settings.battleMix !== false && TT.settings.battleMix !== 'nbts' && BATTLE_MIX[key] ? BATTLE_MIX[key].filter((n) => sampledUrl(n)) : null;
    if (!pool || pool.length < 2) return key;
    const last = A.lastBattle && A.lastBattle[key];
    const choices = pool.filter((n) => n !== last);
    const n = choices[Math.floor(Math.random() * choices.length)];
    A.lastBattle = A.lastBattle || {};
    A.lastBattle[key] = n;
    return n;
  };
  // van-e hozzá saját (TT2-es) zene — ami csak akkor szól, ha megvan (pl. a harc előtti zene)
  A.hasSampled = (name) => !!sampledUrl(name);
  const ONE_SHOT = new Set(['victory', 'defeat']);

  // Saját zenék (assets/custom/music, a saját APK-ból): ha van, az szól a szintetizált dal helyett
  const buffers = {};
  function sampledUrl(name) {
    // a játékos saját harci zenéje (Beállítások) minden harcban, a főellenségeknél is
    const own = TT.custom && TT.custom.userMusic && TT.custom.userMusic.battle;
    if (own && (name === 'battle' || A.isBossTune(name))) return own;
    const m = TT.custom && TT.custom.music;
    return m && m[name];
  }
  function loadBuffer(url) {
    if (!buffers[url]) {
      buffers[url] = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('HTTP ' + r.status))))
        .then((ab) => new Promise((resolve, reject) => A.ctx.decodeAudioData(ab, resolve, reject)))
        .catch(() => null);
    }
    return buffers[url];
  }
  function startSampled(name, url) {
    const g = A.ctx.createGain();
    g.gain.value = 1.45;
    g.connect(A.musicGain);
    const cur = { name, sampled: true, gain: g, done: false, src: null };
    loadBuffer(url).then((buf) => {
      if (cur.done || A.current !== cur) return;
      if (!buf) {
        // nem sikerült betölteni: marad a szintetizált dal
        cur.done = true;
        g.disconnect();
        A.current = startSong(SONGS[name] ? name : ALIAS[name]);
        return;
      }
      if (MIX_NAMES.has(name)) {
        // egyforma hangosság: a számok között akár háromszoros a különbség
        const ch = buf.getChannelData(0);
        let sum = 0, n = 0;
        for (let i = 0; i < ch.length; i += 16) {
          sum += ch[i] * ch[i];
          n++;
        }
        const rms = Math.sqrt(sum / Math.max(1, n));
        if (rms > 0.005) g.gain.value = Math.min(3.2, Math.max(0.8, 0.19 / rms));
      }
      const src = A.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = !ONE_SHOT.has(name);
      src.connect(g);
      src.start();
      cur.src = src;
    });
    return cur;
  }

  // Ütemező: előre beütemezett hangok (lookahead)
  function startSong(name) {
    const s = SONGS[name];
    if (!s) return null;
    const stepDur = 60 / s.bpm / 4;
    const t0 = A.ctx.currentTime + 0.08;
    const g = A.ctx.createGain();
    g.gain.value = 1;
    g.connect(A.musicGain);
    return {
      name, song: s, stepDur, gain: g, done: false,
      chans: s.ch.map((c) => ({ c, i: 0, t: t0 })),
    };
  }

  function drum(ch, at, dest) {
    if (ch === 'k') tone(150, 0.16, { type: 'sine', vol: 0.5, slide: 40, at, dest });
    else if (ch === 's') { noise(0.13, { vol: 0.22, filter: 'highpass', freq: 1500, at, dest }); tone(210, 0.07, { type: 'triangle', vol: 0.12, at, dest }); }
    else if (ch === 'h') noise(0.035, { vol: 0.09, filter: 'highpass', freq: 8000, at, dest });
  }

  function tick() {
    const cur = A.current;
    if (!cur || cur.done || cur.sampled || !A.ctx || A.ctx.state !== 'running') return;
    const horizon = A.ctx.currentTime + 0.15;
    let allDone = true;
    for (const st of cur.chans) {
      const c = st.c;
      const len = c.drums ? c.drums.length : c.seq.length;
      while (st.t < horizon) {
        if (st.i >= len) {
          if (!cur.song.loop) break;
          st.i = 0;
        }
        if (c.drums) {
          drum(c.drums[st.i], st.t, cur.gain);
          st.t += cur.stepDur;
        } else {
          const n = c.seq[st.i];
          const dur = n.d * cur.stepDur;
          if (n.f > 0) tone(n.f, dur * c.len, { type: c.type, vol: c.vol, at: st.t, dest: cur.gain, sustain: true, release: 0.03, vibrato: dur > 0.3 ? c.vibrato : 0 });
          st.t += dur;
        }
        st.i++;
      }
      if (st.i < len || cur.song.loop) allDone = false;
    }
    if (allDone) cur.done = true;
  }

  A.music = function (name, force) {
    if (!force && A.wanted === name && A.current && !A.current.done) return;
    A.wanted = name;
    if (!A.ctx || !A.unlocked) return;
    if (A.current) {
      const old = A.current;
      old.done = true;
      try {
        old.gain.gain.setTargetAtTime(0, A.ctx.currentTime, 0.08);
        setTimeout(() => {
          old.gain.disconnect();
          if (old.src) old.src.stop();
        }, 800);
      } catch (e) { /* már leállt */ }
    }
    const url = name && sampledUrl(name);
    A.current = !name ? null : url ? startSampled(name, url) : startSong(SONGS[name] ? name : ALIAS[name]);
  };

  A.stopMusic = function () {
    A.music(null, true);
  };

  TT.audio = A;
})(window.TT);
