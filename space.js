/* ==========================================================
   🚀 우주 탐험 (Space Adventure) - 소원함 미니게임
   남극탐험 스타일 유사 3D 레이싱 · 도트 그래픽 · 8비트 사운드
   사용법: <script src="space.js"></script> 후 SpaceAdventure.open()
   ========================================================== */
(function () {
  'use strict';

  // ---------------------------------------------------------
  // 상수
  // ---------------------------------------------------------
  const W = 256, H = 240, HUD_H = 32, HORIZON = 100, FLOOR_H = H - HORIZON;
  const XS = 150;        // d=1 에서 월드 1단위당 픽셀
  const DP = 1.1;        // 플레이어가 서 있는 깊이
  const VIEW = 34;       // 보이는 최대 거리
  const VMAX = 8.4, ACCEL = 0.92, STEER = 1.35;
  const JUMP_T = 0.62, JUMP_H = 0.9;
  const KM = 6;          // 1km = 6 월드 단위
  const ROCKET_T = 5;

  const PLANETS = [
    { ko: '수성', en: 'MERCURY', emoji: '🪨', km: 50,
      bands: ['#c2bab2', '#aaa198', '#958c84', '#aaa198', '#c2bab2'],
      spots: [[-0.3, -0.2, 0.22, '#7d756e'], [0.35, 0.3, 0.16, '#7d756e'], [0.05, 0.55, 0.12, '#857c74']] },
    { ko: '금성', en: 'VENUS', emoji: '🟡', km: 60,
      bands: ['#f6dfa8', '#e8c27a', '#f0cf8c', '#d9a85b', '#ecc882', '#f6dfa8'] },
    { ko: '지구', en: 'EARTH', emoji: '🌍', km: 70,
      bands: ['#3a7ae6', '#2f6fdc', '#2f6fdc', '#3a7ae6'],
      spots: [[-0.35, -0.25, 0.35, '#3fae4a'], [0.3, 0.2, 0.3, '#3fae4a'], [-0.1, 0.55, 0.22, '#4cbf55'],
              [0.0, -0.92, 0.35, '#ffffff'], [0.15, 0.95, 0.3, '#ffffff']] },
    { ko: '화성', en: 'MARS', emoji: '🔴', km: 80,
      bands: ['#e06a3e', '#c9572f', '#d9653b', '#c9572f'],
      spots: [[-0.3, 0.1, 0.25, '#8e3a20'], [0.35, 0.35, 0.15, '#9b4224'], [0.0, -0.98, 0.4, '#ffffff']] },
    { ko: '목성', en: 'JUPITER', emoji: '🟠', km: 90,
      bands: ['#ead6b6', '#c99a6b', '#f2e2c8', '#b77b4f', '#ead6b6', '#c99a6b', '#f2e2c8', '#b77b4f'],
      spots: [[0.3, 0.25, 0.17, '#c0392b']] },
    { ko: '토성', en: 'SATURN', emoji: '🪐', km: 100, ring: '#d8c48f',
      bands: ['#f2dfa7', '#e0c47e', '#f2dfa7', '#d4b26a', '#f2dfa7'] },
    { ko: '천왕성', en: 'URANUS', emoji: '🔵', km: 110,
      bands: ['#a8eef4', '#8adbe5', '#9be7ef', '#8adbe5'] },
    { ko: '해왕성', en: 'NEPTUNE', emoji: '🔷', km: 120,
      bands: ['#4a6ff0', '#2f4fc8', '#3d5fe0', '#2f4fc8'],
      spots: [[-0.25, 0.1, 0.18, '#1c2f8a']] },
  ];

  // ---------------------------------------------------------
  // 유틸
  // ---------------------------------------------------------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const pad = (n, len) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mix = (a, b, f) => `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;

  // ---------------------------------------------------------
  // 5x7 픽셀 폰트 (HUD용)
  // ---------------------------------------------------------
  const FONT = {
    '0': [14, 17, 19, 21, 25, 17, 14], '1': [4, 12, 4, 4, 4, 4, 14], '2': [14, 17, 1, 2, 4, 8, 31],
    '3': [31, 2, 4, 2, 1, 17, 14], '4': [2, 6, 10, 18, 31, 2, 2], '5': [31, 16, 30, 1, 1, 17, 14],
    '6': [6, 8, 16, 30, 17, 17, 14], '7': [31, 1, 2, 4, 8, 8, 8], '8': [14, 17, 17, 14, 17, 17, 14],
    '9': [14, 17, 17, 15, 1, 2, 12],
    A: [14, 17, 17, 17, 31, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14],
    D: [28, 18, 17, 17, 17, 18, 28], E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
    G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14],
    J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
    M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
    P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
    S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4], U: [17, 17, 17, 17, 17, 17, 14],
    V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
    Y: [17, 17, 17, 10, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
    k: [16, 16, 18, 20, 24, 20, 18], m: [0, 0, 26, 21, 21, 17, 17],
    '-': [0, 0, 0, 31, 0, 0, 0], '.': [0, 0, 0, 0, 0, 12, 12], '!': [4, 4, 4, 4, 4, 0, 4],
    ':': [0, 12, 12, 0, 12, 12, 0], '+': [0, 4, 4, 31, 4, 4, 0], '/': [0, 1, 2, 4, 8, 16, 0],
    ' ': [0, 0, 0, 0, 0, 0, 0],
  };
  const glyphCache = {};
  function glyph(ch, color) {
    const key = ch + color;
    if (glyphCache[key]) return glyphCache[key];
    const rows = FONT[ch] || FONT[ch.toUpperCase()] || FONT[' '];
    const c = document.createElement('canvas');
    c.width = 5; c.height = 7;
    const g = c.getContext('2d');
    g.fillStyle = color;
    rows.forEach((bits, y) => { for (let x = 0; x < 5; x++) if (bits & (1 << (4 - x))) g.fillRect(x, y, 1, 1); });
    glyphCache[key] = c;
    return c;
  }

  // ---------------------------------------------------------
  // 도트 스프라이트 (코드로 픽셀 직접 찍기)
  // ---------------------------------------------------------
  function makeSprite(rows, pal, mirror, outline) {
    const full = mirror ? rows.map((r) => r + r.split('').reverse().join('')) : rows;
    const padPx = outline ? 1 : 0;
    const w = full[0].length + padPx * 2, h = full.length + padPx * 2;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    if (outline) {
      g.fillStyle = outline;
      full.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          if (ch !== '.' && pal[ch]) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx !== 0 || dy !== 0) g.fillRect(x + padPx + dx, y + padPx + dy, 1, 1);
              }
            }
          }
        }
      });
    }
    full.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x + padPx, y + padPx, 1, 1); }
      }
    });
    return c;
  }

  const FROG_PAL = { k: '#0d3b12', g: '#43b649', l: '#9be86f', d: '#2e8a36' };
  const SPR = {};
  function buildSprites() {
    // 개구리 뒷모습 (좌우 대칭, 24x15)
    SPR.frog = makeSprite([
      '......kkk...',
      '.....kgggk..',
      '.....kglgkkk',
      '....kggggggg',
      '...kgggggggg',
      '..kggglggggg',
      '..kggggggggg',
      '.kgggggggggd',
      '.kggglgggggd',
      '.kgggggggggd',
      '.kgggggggggd',
      '..kggggggggd',
      '..kkgggggggg',
      '...kkkkkgggg',
      '......kkkkkk',
    ], FROG_PAL, true);
    SPR.foot = makeSprite([
      '.kkkkk.',
      'kgggggk',
      'kglgggk',
      '.k.k.k.',
    ], FROG_PAL, false);
    SPR.arm = makeSprite([
      '.kk.',
      'kggk',
      'kglk',
      '.kgk',
      '.kgk',
      '.kk.',
    ], FROG_PAL, false);

    // 인공위성 (장애물: 선명한 밝은 외곽선 + 붉은 경고등 + 파란 태양전지판, 28x14 -> 30x16)
    const satRows = [
      '............rr',
      '............rr',
      '.............n',
      '...........nnn',
      'wwwwwwww..kyyy',
      'wbcbcbcw..kyoy',
      'wcbcbcbwnnkyry',
      'wwwwwwwwnnkyoy',
      'wbcbcbcw..kyyy',
      'wcbcbcbw..kooo',
      'wwwwwwww...nnn',
      '............n.',
    ];
    SPR.sat = makeSprite(satRows, {
      k: '#14142b', w: '#e8f4ff', b: '#0284c7', c: '#38bdf8',
      n: '#cbd5e1', y: '#ffe14d', o: '#f59e0b', r: '#ff2a55',
    }, true, '#ffffff');
    SPR.satBlink = makeSprite(satRows, {
      k: '#14142b', w: '#ffffff', b: '#2563eb', c: '#7dd3fc',
      n: '#e2e8f0', y: '#fff3a0', o: '#ff9f1c', r: '#ffbe0b',
    }, true, '#ff4d6d');

    // 우주쓰레기 (장애물: 밝은 은색/주황 파편 + 붉은 경고 코어, 18x13 -> 20x15)
    const debrisRows = [
      '.....kkkkkk.......',
      '...kkllllllkk.....',
      '..kllnnnnnnllk....',
      '.klnnoooonnnnkk...',
      '.klnorrrronnmmlk..',
      'klnnorrrroonmmmlk.',
      'kllnnoooonnmmnnlk.',
      'knmmnnnnnnmmoorlk.',
      '.knmmmmmmmmooorlk.',
      '.kknnmmnnnnnnllk..',
      '...kkllllnnnnkk...',
      '.....kkkkkkkk.....',
    ];
    SPR.debris = makeSprite(debrisRows, {
      k: '#1e293b', l: '#f1f5f9', n: '#94a3b8', m: '#64748b', o: '#ff9f1c', r: '#ff2a55',
    }, false, '#ffffff');
    SPR.debrisWarn = makeSprite(debrisRows, {
      k: '#1e293b', l: '#ffffff', n: '#cbd5e1', m: '#64748b', o: '#ffe14d', r: '#ffbe0b',
    }, false, '#ff6b6b');

    // 별 (아이템: 큼직한 황금빛 별 + 흰색 후광 테두리, 15x15 -> 17x17)
    const starRows = [
      '.......y.......',
      '......yyy......',
      '......ywy......',
      '.....yywyy.....',
      'yyyyyywwwyyyyyy',
      '.yyyywwwwwyyyy.',
      '..yyywwwwwyyy..',
      '...yyyywyyyy...',
      '...yyyyyyyyy...',
      '..yyyyo.oyyyy..',
      '..yyyo...oyyy..',
      '.yyyo.....oyyy.',
      '.yy.........yy.',
    ];
    SPR.star = makeSprite(starRows, { y: '#ffe14d', w: '#ffffff', o: '#ffae00' }, false, '#ffffff');
    SPR.starGlow = makeSprite(starRows, { y: '#fff6a8', w: '#ffffff', o: '#ffe14d' }, false, '#ffe14d');

    // 외계인 (아이템: 형광 연두/민트 외계인 + 노란 안테나 + 흰색 외곽선, 16x14 -> 18x16)
    const alienRows = [
      '..aa....',
      '..aa....',
      '...p....',
      '...ppppp',
      '..pplllp',
      '.ppwwwwp',
      '.ppweewp',
      '.ppweewp',
      '.ppppppp',
      '..ppppmm',
      '...ppppp',
      '..pp.pp.',
      '.pp..pp.',
      '.pp..pp.',
    ];
    SPR.alien = makeSprite(alienRows, {
      p: '#52ff7c', l: '#b8ffcb', m: '#1dd1a1', e: '#101020', w: '#ffffff', a: '#ffe14d',
    }, true, '#ffffff');
    SPR.alienGlow = makeSprite(alienRows, {
      p: '#7dff9e', l: '#ffffff', m: '#2ee5b5', e: '#101020', w: '#ffffff', a: '#ff6b9a',
    }, true, '#fff6a8');

    // 로켓 (특별 아이템: 11x14 -> 13x16)
    const rocketRows = [
      '.....r.....',
      '....rrr....',
      '...rrrrr...',
      '...wwwww...',
      '..wwwbwww..',
      '..wwbbbww..',
      '..wwwbwww..',
      '..wwwwwww..',
      '..wwwwwww..',
      '.rrwwwwwrr.',
      'rrrwwwwwrrr',
      'rrr.ooo.rrr',
      '....yyy....',
      '.....y.....',
    ];
    SPR.rocket = makeSprite(rocketRows, { r: '#ff4d6d', w: '#eef1ff', b: '#38bdf8', o: '#ff9f1c', y: '#ffe14d' }, false, '#ffffff');
    SPR.rocketGlow = makeSprite(rocketRows, { r: '#ffbe0b', w: '#ffffff', b: '#7dd3fc', o: '#ffe14d', y: '#ffffff' }, false, '#ffe14d');
  }

  // ---------------------------------------------------------
  // 사운드 (Web Audio 8비트)
  // ---------------------------------------------------------
  const MELODY = [
    [[76, 2], [79, 1]], [[84, 2], [83, 1]], [[81, 1], [79, 1], [77, 1]], [[74, 2], [77, 1]],
    [[77, 2], [81, 1]], [[86, 2], [84, 1]], [[83, 1], [81, 1], [79, 1]], [[76, 3]],
    [[81, 2], [84, 1]], [[89, 2], [88, 1]], [[88, 1], [86, 1], [84, 1]], [[81, 2], [84, 1]],
    [[83, 2], [86, 1]], [[79, 2], [81, 1]], [[83, 1], [86, 1], [83, 1]], [[84, 3]],
  ];
  const CHORD_SEQ = ['C', 'C', 'G7', 'G7', 'G7', 'G7', 'C', 'C', 'F', 'F', 'C', 'Am', 'G7', 'G7', 'G7', 'C'];
  const CHORDS = { C: [48, 64, 67], G7: [43, 65, 71], F: [41, 65, 69], Am: [45, 64, 69] };
  const MUSIC_EVENTS = (() => {
    const ev = [];
    MELODY.forEach((bar, bi) => {
      let t = bi * 3;
      bar.forEach(([n, d]) => { ev.push({ t, n, d, k: 'lead' }); t += d; });
      const ch = CHORDS[CHORD_SEQ[bi]];
      ev.push({ t: bi * 3, n: ch[0], d: 0.9, k: 'bass' });
      ev.push({ t: bi * 3 + 1, n: ch[1], d: 0.3, k: 'chord' }, { t: bi * 3 + 1, n: ch[2], d: 0.3, k: 'chord' });
      ev.push({ t: bi * 3 + 2, n: ch[1], d: 0.3, k: 'chord' }, { t: bi * 3 + 2, n: ch[2], d: 0.3, k: 'chord' });
    });
    return ev.sort((a, b) => a.t - b.t);
  })();
  const MUSIC_BEATS = MELODY.length * 3;
  const SPB = 60 / 168;
  const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  const Sound = {
    ctx: null, master: null, music: null, sfx: null, noiseBuf: null,
    muted: localStorage.getItem('space_adventure_muted') === '1',
    musicOn: false, mStart: 0, mIdx: 0, mLoop: 0,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    },
    setMuted(m) {
      this.muted = m;
      localStorage.setItem('space_adventure_muted', m ? '1' : '0');
      if (this.master) this.master.gain.value = m ? 0 : 0.8;
    },
    tone(freq, dur, type = 'square', vol = 0.15, slideTo = null, delay = 0, dest = null) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(dest || this.sfx);
      o.start(t); o.stop(t + dur + 0.02);
    },
    noise(dur, vol = 0.2, delay = 0) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const s = this.ctx.createBufferSource(), g = this.ctx.createGain();
      s.buffer = this.noiseBuf;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(g); g.connect(this.sfx);
      s.start(t); s.stop(t + dur + 0.02);
    },
    play(name) {
      if (!this.ctx) return;
      switch (name) {
        case 'jump': this.tone(280, 0.16, 'square', 0.12, 760); break;
        case 'star': this.tone(988, 0.07, 'square', 0.1); this.tone(1480, 0.12, 'square', 0.1, null, 0.07); break;
        case 'alien': [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, 0.07, 'square', 0.1, null, i * 0.06)); break;
        case 'bump': this.noise(0.15, 0.25); this.tone(160, 0.18, 'square', 0.12, 60); break;
        case 'fall': this.tone(700, 0.7, 'square', 0.12, 70); break;
        case 'crash': this.noise(0.35, 0.3); this.tone(220, 0.4, 'sawtooth', 0.12, 40); break;
        case 'rocket': this.tone(180, 0.6, 'sawtooth', 0.1, 1200); this.noise(0.5, 0.08); break;
        case 'tick': this.tone(1500, 0.03, 'square', 0.06); break;
        case 'arrive': [72, 76, 79, 84, 79, 84].forEach((m, i) => this.tone(midiHz(m), i === 5 ? 0.5 : 0.12, 'square', 0.12, null, i * 0.12)); break;
        case 'gameover': [67, 64, 60, 55].forEach((m, i) => this.tone(midiHz(m), 0.3, 'triangle', 0.25, null, i * 0.25)); break;
        case 'start': [60, 64, 67, 72].forEach((m, i) => this.tone(midiHz(m), 0.1, 'square', 0.1, null, i * 0.08)); break;
      }
    },
    startMusic() {
      if (!this.ctx) return;
      this.musicOn = true;
      this.mStart = this.ctx.currentTime + 0.1;
      this.mIdx = 0; this.mLoop = 0;
    },
    stopMusic() { this.musicOn = false; },
    tickMusic() {
      if (!this.ctx || !this.musicOn) return;
      const now = this.ctx.currentTime;
      for (let guard = 0; guard < 64; guard++) {
        const ev = MUSIC_EVENTS[this.mIdx];
        const t = this.mStart + (this.mLoop * MUSIC_BEATS + ev.t) * SPB;
        if (t > now + 0.25) break;
        if (t >= now - 0.05) {
          const dur = ev.d * SPB * 0.92;
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          const vol = ev.k === 'lead' ? 0.07 : ev.k === 'bass' ? 0.2 : 0.03;
          o.type = ev.k === 'bass' ? 'triangle' : 'square';
          o.frequency.setValueAtTime(midiHz(ev.n), t);
          g.gain.setValueAtTime(vol, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          o.connect(g); g.connect(this.music);
          o.start(t); o.stop(t + dur + 0.02);
        }
        this.mIdx++;
        if (this.mIdx >= MUSIC_EVENTS.length) { this.mIdx = 0; this.mLoop++; }
      }
    },
  };

  // ---------------------------------------------------------
  // 최고기록 저장소 (기본: localStorage / 추후 Supabase 어댑터로 교체 가능)
  //   인터페이스: load() -> {user1:{score,stage}, user2:{...}}, submit(pid, score, stage) -> isNewRecord
  // ---------------------------------------------------------
  const LocalScoreStore = {
    key: 'space_adventure_scores',
    async load() {
      try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; }
    },
    async submit(pid, score, stage) {
      const all = await this.load();
      const cur = all[pid] || { score: 0, stage: 0 };
      if (score > cur.score) {
        all[pid] = { score, stage, at: new Date().toISOString() };
        localStorage.setItem(this.key, JSON.stringify(all));
        return true;
      }
      return false;
    },
  };
  let scoreStore = LocalScoreStore;

  function getProfiles() {
    const def = { user1: { name: 'R', avatar: '🐰' }, user2: { name: 'D', avatar: '🐻' } };
    try {
      const p = JSON.parse(localStorage.getItem('two_wishes_profiles'));
      if (p && p.user1 && p.user2) {
        return {
          user1: { name: p.user1.name || 'R', avatar: p.user1.avatar === 'avatar_r.png' ? '🐰' : (p.user1.avatar || '🐰') },
          user2: { name: p.user2.name || 'D', avatar: p.user2.avatar === 'avatar_d.png' ? '🐻' : (p.user2.avatar || '🐻') },
        };
      }
    } catch (e) { /* ignore */ }
    return def;
  }
  function avatarHtml(av, name) {
    if (av && (av.startsWith('data:image/') || /\.(png|jpe?g|webp)$/i.test(av))) {
      return `<img src="${escapeHtml(av)}" alt="${escapeHtml(name)}">`;
    }
    return escapeHtml(av || '✨');
  }
  function stageLabel(n) {
    if (!n) return '출발 전';
    const p = PLANETS[(n - 1) % PLANETS.length];
    const lap = Math.floor((n - 1) / PLANETS.length) + 1;
    return `${p.ko}${lap > 1 ? ` (${lap}바퀴)` : ''}`;
  }

  // ---------------------------------------------------------
  // DOM & CSS
  // ---------------------------------------------------------
  const CSS = `
  .sa-root{position:fixed;inset:0;z-index:9999;background:#05030f;display:flex;flex-direction:column;
    font-family:'Galmuri11','Pretendard',monospace;color:#fff;user-select:none;-webkit-user-select:none;
    -webkit-touch-callout:none;touch-action:none;-webkit-tap-highlight-color:transparent;
    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);box-sizing:border-box}
  .sa-root *{box-sizing:border-box}
  .sa-root.sa-hidden{display:none}
  .sa-topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;gap:8px;flex:0 0 auto}
  .sa-topbar-title{font-size:15px;letter-spacing:1px;color:#ffe14d;text-shadow:2px 2px 0 #7a2d8c}
  .sa-topbar-right{display:flex;gap:8px}
  .sa-icon-btn{width:40px;height:40px;border-radius:10px;border:2px solid #3b2a6e;background:#160e33;color:#fff;
    font-size:17px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;padding:0}
  .sa-icon-btn:active{transform:translateY(2px)}
  .sa-stage{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;position:relative}
  .sa-screen{position:relative;width:min(100vw, calc((100vh - 210px) * 1.0667), 768px);
    width:min(100vw, calc((100dvh - 210px) * 1.0667), 768px);aspect-ratio:256/240}
  .sa-screen canvas{width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges;background:#000}
  .sa-overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;pointer-events:none;padding:10px}
  .sa-overlay.sa-interactive{pointer-events:auto;background:rgba(5,3,15,.55)}
  .sa-panel{background:#120b2c;border:3px solid #6b4fd8;box-shadow:0 0 0 3px #05030f,0 0 30px rgba(140,90,255,.35);
    border-radius:6px;padding:18px 16px;width:min(92vw,380px);max-height:100%;overflow:auto;text-align:center}
  .sa-logo{font-family:'Galmuri14','Galmuri11',monospace;font-size:34px;color:#ffe14d;text-shadow:3px 3px 0 #c2410c,6px 6px 0 #4c1d95;letter-spacing:2px}
  .sa-sub{font-size:11px;color:#a78bfa;letter-spacing:4px;margin:6px 0 12px}
  .sa-desc{font-size:12px;line-height:1.6;color:#d6ccff;margin:0 0 14px}
  .sa-label{font-size:12px;color:#ffe14d;margin-bottom:8px}
  .sa-players{display:flex;gap:10px;margin-bottom:14px}
  .sa-player{flex:1;background:#1c1342;border:3px solid #33266a;border-radius:6px;padding:10px 6px;color:#fff;cursor:pointer;font-family:inherit;position:relative}
  .sa-player.sa-selected{border-color:#5ff2d0;background:#163b46;box-shadow:0 0 12px rgba(95,242,208,.4)}
  .sa-avatar{width:44px;height:44px;margin:0 auto 6px;border-radius:50%;background:#2a1d5c;display:flex;align-items:center;justify-content:center;font-size:26px;overflow:hidden}
  .sa-avatar img{width:100%;height:100%;object-fit:cover}
  .sa-pname{font-size:14px;margin-bottom:6px}
  .sa-pbest{font-size:11px;color:#ffe14d}
  .sa-pstage{font-size:10px;color:#a78bfa;margin-top:3px}
  .sa-crown{position:absolute;top:-12px;left:50%;transform:translateX(-50%);font-size:18px}
  .sa-btn{display:block;width:100%;padding:13px;border:3px solid #ffb3cf;border-radius:6px;background:#e84a85;color:#fff;
    font-family:inherit;font-size:16px;cursor:pointer;box-shadow:0 4px 0 #7a1f45;margin-top:8px}
  .sa-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #7a1f45}
  .sa-btn.sa-secondary{background:#2a1d5c;border-color:#6b4fd8;box-shadow:0 4px 0 #120b2c}
  .sa-help{font-size:10px;color:#9d8fd6;line-height:1.7;margin-top:12px}
  .sa-banner{background:rgba(5,3,15,.82);border:3px solid #ffe14d;border-radius:6px;padding:12px 18px;text-align:center;animation:sa-pop .35s ease-out}
  .sa-banner .sa-b1{font-size:12px;color:#a78bfa;letter-spacing:3px}
  .sa-banner .sa-b2{font-size:22px;color:#ffe14d;margin:6px 0;text-shadow:2px 2px 0 #7a2d8c}
  .sa-banner .sa-b3{font-size:12px;color:#fff}
  .sa-big{font-family:'Galmuri14','Galmuri11',monospace;font-size:30px;color:#ff6b9a;text-shadow:3px 3px 0 #4c1d95;margin-bottom:8px;animation:sa-pop .4s ease-out}
  .sa-result{font-size:13px;line-height:1.9;color:#e9e3ff;margin-bottom:6px}
  .sa-result b{color:#ffe14d}
  .sa-new{color:#5ff2d0;font-size:15px;animation:sa-blink .6s steps(2) infinite;margin-bottom:6px}
  .sa-vs{display:flex;justify-content:space-around;background:#1c1342;border-radius:6px;padding:8px;margin:8px 0 6px;font-size:11px}
  .sa-vs div{line-height:1.6}
  .sa-controls{display:flex;gap:12px;padding:10px 14px 16px;justify-content:center;flex:0 0 auto}
  .sa-ctrl{flex:1;max-width:150px;height:84px;border-radius:18px;border:3px solid #4b3a8e;background:linear-gradient(#2a1d5c,#1a1240);
    color:#fff;font-family:inherit;font-size:28px;box-shadow:0 5px 0 #0c0820;touch-action:none;cursor:pointer;padding:0}
  .sa-ctrl.sa-active{transform:translateY(3px);box-shadow:0 2px 0 #0c0820;filter:brightness(1.35)}
  .sa-ctrl.sa-jump{background:linear-gradient(#ff6b9a,#d9437a);border-color:#ff9cc0;font-size:19px}
  @keyframes sa-pop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
  @keyframes sa-blink{50%{opacity:.2}}
  `;

  let root, canvas, ctx, overlay, btnPause, btnMute, ctrlLeft, ctrlRight, ctrlJump;
  let built = false, running = false, rafId = 0, lastTs = 0, openOpts = {};

  function buildDom() {
    if (built) return;
    built = true;
    if (!document.querySelector('link[data-sa-font]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css';
      l.setAttribute('data-sa-font', '1');
      document.head.appendChild(l);
    }
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    root = document.createElement('div');
    root.className = 'sa-root sa-hidden';
    root.innerHTML = `
      <div class="sa-topbar">
        <button class="sa-icon-btn" data-sa="close" title="닫기">✕</button>
        <div class="sa-topbar-title">🚀 우주 탐험</div>
        <div class="sa-topbar-right">
          <button class="sa-icon-btn" data-sa="pause" title="일시정지">⏸</button>
          <button class="sa-icon-btn" data-sa="mute" title="소리">🔊</button>
        </div>
      </div>
      <div class="sa-stage">
        <div class="sa-screen"><canvas width="${W}" height="${H}"></canvas></div>
        <div class="sa-overlay"></div>
      </div>
      <div class="sa-controls">
        <button class="sa-ctrl" data-sa="left" aria-label="왼쪽">◀</button>
        <button class="sa-ctrl sa-jump" data-sa="jump" aria-label="점프">점프</button>
        <button class="sa-ctrl" data-sa="right" aria-label="오른쪽">▶</button>
      </div>`;
    document.body.appendChild(root);

    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    overlay = root.querySelector('.sa-overlay');
    btnPause = root.querySelector('[data-sa="pause"]');
    btnMute = root.querySelector('[data-sa="mute"]');
    ctrlLeft = root.querySelector('[data-sa="left"]');
    ctrlRight = root.querySelector('[data-sa="right"]');
    ctrlJump = root.querySelector('[data-sa="jump"]');

    root.querySelector('[data-sa="close"]').addEventListener('click', () => api.close());
    btnPause.addEventListener('click', () => togglePause());
    btnMute.addEventListener('click', () => { Sound.init(); Sound.setMuted(!Sound.muted); updateMuteBtn(); });
    root.addEventListener('contextmenu', (e) => e.preventDefault());

    const holdBtn = (el, key) => {
      const on = (e) => { e.preventDefault(); input[key] = true; el.classList.add('sa-active'); };
      const off = (e) => { e.preventDefault(); input[key] = false; el.classList.remove('sa-active'); };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('pointerleave', off);
    };
    holdBtn(ctrlLeft, 'left');
    holdBtn(ctrlRight, 'right');
    ctrlJump.addEventListener('pointerdown', (e) => { e.preventDefault(); ctrlJump.classList.add('sa-active'); tryJump(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => ctrlJump.addEventListener(ev, () => ctrlJump.classList.remove('sa-active')));

    buildSprites();
    buildScenery();
    updateMuteBtn();
  }

  function updateMuteBtn() { if (btnMute) btnMute.textContent = Sound.muted ? '🔇' : '🔊'; }

  function setOverlay(html, interactive) {
    overlay.innerHTML = html || '';
    overlay.classList.toggle('sa-interactive', !!interactive);
    overlay.style.display = html ? 'flex' : 'none';
  }

  // ---------------------------------------------------------
  // 배경 데이터 (하늘 별, 지평선 소행성 띠, 바닥 색 팔레트)
  // ---------------------------------------------------------
  const ROW_D = [];
  const SKY = [];
  let STARS = [], RIDGE = [];
  const FOG_L = 6;
  const PAL = { road0: [], road1: [], out0: [], out1: [], edge: [] };
  function buildScenery() {
    for (let y = HORIZON; y < H; y++) ROW_D.push(FLOOR_H / (y - HORIZON + 0.5));
    for (let i = 0; i < 9; i++) SKY.push(mix([2, 1, 12], [36, 22, 92], i / 8));
    STARS = [];
    for (let i = 0; i < 90; i++) {
      STARS.push({ x: Math.random() * 512, y: HUD_H + 2 + Math.random() * (HORIZON - HUD_H - 10),
        c: pick(['#ffffff', '#ffffff', '#fff3b0', '#b8d4ff', '#ffc4f0']), tw: Math.random() * 10, big: Math.random() < 0.12 });
    }
    RIDGE = [];
    let h = 3;
    for (let i = 0; i < 128; i++) { h = clamp(h + ((Math.random() * 5) | 0) - 2, 0, 8); RIDGE.push(h); }
    for (let i = 0; i < FOG_L; i++) {
      const f = (i / (FOG_L - 1)) * 0.85;
      PAL.road0.push(mix([92, 42, 156], [128, 100, 200], f));
      PAL.road1.push(mix([72, 30, 126], [128, 100, 200], f));
      PAL.out0.push(mix([22, 12, 52], [52, 40, 100], f));
      PAL.out1.push(mix([15, 8, 38], [52, 40, 100], f));
      PAL.edge.push(mix([236, 150, 255], [170, 150, 230], f));
    }
  }

  // ---------------------------------------------------------
  // 게임 상태
  // ---------------------------------------------------------
  const input = { left: false, right: false };
  const G = {
    state: 'title', paused: false, t: 0, stateT: 0, phase: '',
    stageIdx: 0, lap: 0, arrivals: 0, score: 0, best: 0, time: 0, player: 'user1',
    traveled: 0, v: 0, px: 0, h: 0, jumpT: -1,
    status: 'run', statusT: 0, holeRef: null, rocketT: 0,
    objects: [], sparkles: [], nextSpawn: 0, rocketAt: 0, rocketSpawned: false,
    curve: 0, curveTarget: 0, nextCurveAt: 0, skyOffset: 0, kmScored: 0, bonusAcc: 0,
    popups: [],
  };
  const planet = () => PLANETS[G.stageIdx];
  const stageLen = () => planet().km * KM;
  const level = () => G.stageIdx + G.lap * PLANETS.length;
  const stageVMax = () => Math.min(9.6, 6.8 + G.stageIdx * 0.23 + G.lap * 0.8);
  const timeLimit = () => Math.round(stageLen() / (stageVMax() * (0.70 + 0.04 * Math.min(G.lap, 4)))) + 9;

  const proj = (d) => HORIZON + FLOOR_H / d;
  const camX = () => G.px * 0.5;
  const sxAt = (wx, d) => W / 2 + (wx - camX()) * XS / d + G.curve * 1.8 * d;

  function resetRun() {
    G.traveled = 0; G.v = 0.8; G.px = 0; G.h = 0; G.jumpT = -1;
    G.status = 'run'; G.statusT = 0; G.holeRef = null; G.rocketT = 0;
    G.objects = []; G.nextSpawn = 18; G.kmScored = 0; G.popups = [];
    G.curve = 0; G.curveTarget = 0; G.nextCurveAt = 30;
    G.rocketAt = stageLen() * rand(0.3, 0.65); G.rocketSpawned = false;
    G.sparkles = [];
    for (let i = 0; i < 46; i++) G.sparkles.push(newSparkle(rand(1, VIEW)));
  }
  function newSparkle(dz) {
    return { x: rand(-1.4, 1.4), z: G.traveled + dz, c: pick(['#ffffff', '#ffd6ff', '#9ff0ff', '#fff3a0']) };
  }

  // ---------------------------------------------------------
  // 스폰
  // ---------------------------------------------------------
  function addHole(z, x, extras) {
    const lvl = level();
    const r = rand(0.22, 0.28 + 0.012 * Math.min(lvl, 10));
    const o = { type: 'hole', z, x: clamp(x, -0.8, 0.8), r, hd: 0.45 };
    G.objects.push(o);
    if (!extras) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    const roll = Math.random();
    if (roll < 0.32) {
      G.objects.push({
        type: 'alien', z, x: o.x, ax: o.x, side, hd: 0.48,
        launched: true, phase: Math.random() * 10, ah: 0.45,
      });
    } else if (roll < 0.32 + 0.12 + 0.035 * Math.min(lvl, 12)) {
      G.objects.push({
        type: 'sat', z, x: clamp(o.x + side * (o.r + 0.14), -0.92, 0.92),
        hd: 0.14, popped: true, risen: false, popT: 0, ph: 0.05,
      });
    }
  }
  function spawnPattern(z) {
    const lvl = level();
    const r = Math.random();
    const rx = () => rand(-0.75, 0.75);
    if (r < 0.34) {
      addHole(z, rx(), true);
    } else if (r < 0.58) {
      const x1 = rx();
      G.objects.push({ type: 'debris', z, x: x1, hd: 0.12 });
      if (lvl >= 3 && Math.random() < 0.45) {
        const x2 = x1 > 0 ? x1 - rand(0.5, 0.9) : x1 + rand(0.5, 0.9);
        G.objects.push({ type: 'debris', z: z + rand(-0.5, 0.5), x: clamp(x2, -0.9, 0.9), hd: 0.12 });
      }
    } else if (r < 0.82) {
      const x = rx();
      const n = 1 + (Math.random() < 0.45 ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0);
      for (let i = 0; i < n; i++) G.objects.push({ type: 'star', z: z + i * 1.6, x, hd: 0.15 });
    } else if (lvl >= 2) {
      const gap = rand(-0.45, 0.45);
      addHole(z, gap - 0.62, false);
      addHole(z, gap + 0.62, false);
    } else {
      addHole(z, rx(), true);
    }
  }
  function spawnAhead() {
    const len = stageLen();
    const dens = 0.8 + 0.08 * G.stageIdx + 0.3 * G.lap;
    while (G.nextSpawn < G.traveled + VIEW && G.nextSpawn < len - 14) {
      if (!G.rocketSpawned && G.nextSpawn >= G.rocketAt) {
        G.rocketSpawned = true;
        G.objects.push({ type: 'rocket', z: G.nextSpawn, x: rand(-0.6, 0.6), hd: 0.15 });
        G.nextSpawn += 4;
        continue;
      }
      spawnPattern(G.nextSpawn);
      G.nextSpawn += rand(4.5, 8.5) / dens;
    }
  }

  // ---------------------------------------------------------
  // 게임 흐름
  // ---------------------------------------------------------
  function startGame() {
    Sound.init();
    Sound.play('start');
    G.stageIdx = 0; G.lap = 0; G.arrivals = 0; G.score = 0;
    G.paused = false;
    G.best = 0;
    scoreStore.load().then((s) => { G.best = ((s[G.player] || {}).score) || 0; });
    startIntro();
  }

  function startIntro() {
    resetRun();
    G.state = 'intro'; G.stateT = 0;
    G.time = timeLimit();
    const p = planet();
    const num = level() + 1;
    const lapMsg = G.lap > 0 && G.stageIdx === 0
      ? `<div class="sa-b3" style="color:#5ff2d0;margin-bottom:6px">🎉 태양계 일주 성공! ${G.lap + 1}바퀴째 출발!</div>` : '';
    setOverlay(`<div class="sa-banner">${lapMsg}
      <div class="sa-b1">STAGE ${pad(num, 2)}</div>
      <div class="sa-b2">${p.emoji} ${p.ko} ${p.en}</div>
      <div class="sa-b3">거리 ${p.km}km · 제한시간 ${G.time}초</div></div>`, false);
    if (!Sound.musicOn) Sound.startMusic();
  }

  function startPlay() {
    G.state = 'play'; G.stateT = 0;
    setOverlay('', false);
  }

  function startArrive() {
    G.state = 'arrive'; G.stateT = 0; G.phase = 'slow'; G.bonusAcc = 0;
    G.status = G.status === 'rocket' ? 'run' : G.status;
    G.rocketT = 0;
    G.arrivals++;
    Sound.play('arrive');
    const p = planet();
    setOverlay(`<div class="sa-banner"><div class="sa-b1">ARRIVED!</div>
      <div class="sa-b2">${p.emoji} ${p.ko} 도착!</div>
      <div class="sa-b3">남은 시간 보너스 +${Math.ceil(G.time) * 100}</div></div>`, false);
  }

  function nextStage() {
    G.stageIdx++;
    if (G.stageIdx >= PLANETS.length) { G.stageIdx = 0; G.lap++; }
    startIntro();
  }

  async function gameOver() {
    G.state = 'gameover'; G.stateT = 0;
    G.time = 0; G.v = 0;
    Sound.stopMusic();
    Sound.play('gameover');
    const isNew = await scoreStore.submit(G.player, G.score, G.arrivals);
    const scores = await scoreStore.load();
    const profiles = getProfiles();
    const me = profiles[G.player];
    const vs = ['user1', 'user2'].map((pid) => {
      const s = scores[pid] || { score: 0, stage: 0 };
      return `<div>${escapeHtml(profiles[pid].name)}<br><b style="color:#ffe14d">${pad(s.score, 6)}</b><br><span style="color:#a78bfa">${stageLabel(s.stage)}</span></div>`;
    }).join('<div style="align-self:center;color:#ff6b9a">VS</div>');
    setOverlay(`<div class="sa-panel">
      <div class="sa-big">TIME UP!</div>
      ${isNew ? '<div class="sa-new">★ NEW RECORD ★</div>' : ''}
      <div class="sa-result">${escapeHtml(me.name)} 대원의 탐험 결과<br>
        점수 <b>${pad(G.score, 6)}</b><br>
        도착한 행성 <b>${G.arrivals ? stageLabel(G.arrivals) : '없음'}</b> (${G.arrivals}개)</div>
      <div class="sa-label" style="margin-top:6px">🏆 최고기록 대결</div>
      <div class="sa-vs">${vs}</div>
      <button class="sa-btn" data-sa-act="retry">다시 도전 ▶</button>
      <button class="sa-btn sa-secondary" data-sa-act="title">처음으로</button>
    </div>`, true);
    overlay.querySelector('[data-sa-act="retry"]').onclick = () => startGame();
    overlay.querySelector('[data-sa-act="title"]').onclick = () => showTitle();
  }

  async function showTitle() {
    G.state = 'title'; G.stateT = 0; G.paused = false;
    G.stageIdx = 0; G.lap = 0; G.score = 0;
    resetRun();
    G.v = 4;
    Sound.stopMusic();
    const scores = await scoreStore.load();
    const profiles = getProfiles();
    const s1 = (scores.user1 || {}).score || 0, s2 = (scores.user2 || {}).score || 0;
    const leader = s1 === s2 ? null : s1 > s2 ? 'user1' : 'user2';
    const card = (pid) => {
      const p = profiles[pid], s = scores[pid] || { score: 0, stage: 0 };
      return `<button class="sa-player ${G.player === pid ? 'sa-selected' : ''}" data-pid="${pid}">
        ${leader === pid ? '<span class="sa-crown">👑</span>' : ''}
        <div class="sa-avatar">${avatarHtml(p.avatar, p.name)}</div>
        <div class="sa-pname">${escapeHtml(p.name)}</div>
        <div class="sa-pbest">최고 ${pad(s.score, 6)}</div>
        <div class="sa-pstage">${stageLabel(s.stage)}</div></button>`;
    };
    setOverlay(`<div class="sa-panel">
      <div class="sa-logo">우주 탐험</div>
      <div class="sa-sub">SPACE ADVENTURE</div>
      <p class="sa-desc">개구리 대원을 정해진 시간 안에<br>태양계 행성까지 데려다 주세요! 🐸🪐</p>
      <div class="sa-label">누가 탐험할까요?</div>
      <div class="sa-players">${card('user1')}${card('user2')}</div>
      <button class="sa-btn" data-sa-act="start">출발! ▶</button>
      <div class="sa-help">◀ ▶ 좌우 이동 · 점프 버튼으로 블랙홀·쓰레기 넘기<br>
        ⭐ 별 +500 · 👽 외계인 점프로 잡기 +1000<br>🚀 로켓을 먹으면 블랙홀 위를 날아가요<br>
        <span style="opacity:.7">PC: ← → 이동 · 스페이스 점프 · P 일시정지</span></div>
    </div>`, true);
    overlay.querySelectorAll('.sa-player').forEach((b) => {
      b.onclick = () => {
        G.player = b.dataset.pid;
        overlay.querySelectorAll('.sa-player').forEach((x) => x.classList.toggle('sa-selected', x === b));
      };
    });
    overlay.querySelector('[data-sa-act="start"]').onclick = () => startGame();
    btnPause.style.visibility = 'hidden';
  }

  function togglePause(force) {
    if (!['intro', 'play', 'arrive'].includes(G.state)) return;
    const want = typeof force === 'boolean' ? force : !G.paused;
    if (want === G.paused) return;
    G.paused = want;
    if (G.paused) {
      Sound.stopMusic();
      setOverlay(`<div class="sa-panel"><div class="sa-big" style="color:#ffe14d">일시정지</div>
        <button class="sa-btn" data-sa-act="resume">계속하기 ▶</button>
        <button class="sa-btn sa-secondary" data-sa-act="title">처음으로</button></div>`, true);
      overlay.querySelector('[data-sa-act="resume"]').onclick = () => togglePause(false);
      overlay.querySelector('[data-sa-act="title"]').onclick = () => showTitle();
    } else {
      setOverlay('', false);
      Sound.init();
      Sound.startMusic();
    }
  }

  function tryJump() {
    if (G.paused) return;
    if (G.state !== 'play') return;
    if (G.jumpT >= 0 || G.status !== 'run' || G.h > 0) return;
    G.jumpT = 0;
    Sound.play('jump');
  }

  function addPopup(text, color) { G.popups.push({ text, color, t: 0 }); }

  // ---------------------------------------------------------
  // 충돌 처리
  // ---------------------------------------------------------
  function stumble() {
    if (G.status !== 'run') return;
    G.status = 'stumble'; G.statusT = 0.55; G.v *= 0.45;
    Sound.play('bump');
  }
  function crash() {
    G.status = 'crash'; G.statusT = 1.2; G.v = 0; G.jumpT = -1; G.h = 0;
    Sound.play('crash');
  }
  function fallInHole(o) {
    G.status = 'hole'; G.statusT = 1.6; G.holeRef = o; G.v = 0; G.jumpT = -1; G.h = 0;
    G.traveled = o.z - DP;
    o.done = true;
    Sound.play('fall');
  }

  function checkCollisions(prevT) {
    const a = prevT + DP, b = G.traveled + DP;
    const invul = G.status === 'rocket';
    for (const o of G.objects) {
      if (o.done) continue;
      if (!(a <= o.z + o.hd && b >= o.z - o.hd)) continue;
      const dx = Math.abs(o.x - G.px);
      switch (o.type) {
        case 'hole':
          if (invul || G.h > 0.05 || G.status === 'hole' || G.status === 'crash') break;
          if (dx < o.r * 0.6) { fallInHole(o); return; }
          if (dx < o.r + 0.06) { o.done = true; stumble(); }
          break;
        case 'debris':
          if (invul || G.h > 0.28 || G.status === 'hole' || G.status === 'crash') break;
          if (dx < 0.15) {
            o.done = true; o.hit = true; o.flyT = 0; o.vx = o.x >= G.px ? 1 : -1;
            stumble();
          }
          break;
        case 'sat':
          if (invul || !o.popped || G.status === 'hole' || G.status === 'crash') break;
          if (o.ph > -0.25 && G.h < o.ph + 0.4 && dx < 0.18) { o.done = true; crash(); return; }
          break;
        case 'star':
          if (dx < 0.16 && (G.h < 0.7 || invul)) {
            o.done = true; o.gone = true; G.score += 500; addPopup('+500', '#ffe14d'); Sound.play('star');
          }
          break;
        case 'alien':
          if (!o.gone) {
            const ax = o.ax !== undefined ? o.ax : o.x;
            if (Math.abs(ax - G.px) < 0.25 && (G.h > 0.12 || invul)) {
              o.done = true; o.gone = true; G.score += 1000; addPopup('+1000', '#5ff2d0'); Sound.play('alien');
            }
          }
          break;
        case 'rocket':
          if (dx < 0.17 && G.h < 0.7 && G.status !== 'hole' && G.status !== 'crash') {
            o.done = true; o.gone = true;
            G.status = 'rocket'; G.rocketT = ROCKET_T; G.jumpT = -1;
            G.score += 1000; addPopup('ROCKET!', '#ff6b9a'); Sound.play('rocket');
          }
          break;
      }
    }
  }

  // ---------------------------------------------------------
  // 업데이트
  // ---------------------------------------------------------
  function updateObjects(dt) {
    const satTrig = Math.max(9.0, G.v * 1.35);
    for (const o of G.objects) {
      const d = o.z - G.traveled;
      if (o.type === 'sat') {
        if (!o.risen && d < satTrig) { o.risen = true; o.popT = 0; }
        if (o.risen) {
          o.popT += dt;
          o.ph = Math.min(0.24, 0.05 + o.popT * 1.1) + Math.sin(G.t * 6 + o.z) * 0.04;
        } else {
          // 멀리 있을 때도 블랙홀 옆에서 고개를 내밀고 흔들거림
          o.ph = 0.05 + Math.sin(G.t * 4 + o.z) * 0.02;
        }
      } else if (o.type === 'alien') {
        if (!o.gone) {
          // 멀리서부터 블랙홀 위를 통통 반복해서 점프
          const T = 1.15;
          const cyc = (G.t + (o.phase || 0)) / T;
          const k = cyc - Math.floor(cyc);
          o.ah = 0.08 + 0.92 * 4 * k * (1 - k);
          o.ax = o.x + Math.sin((G.t + (o.phase || 0)) * 2.4) * 0.22;
        }
      } else if (o.type === 'debris' && o.hit) {
        o.flyT += dt;
      }
    }
    G.objects = G.objects.filter((o) => o.z - G.traveled > 0.25 || (o.type === 'hole' && o.z + o.hd - G.traveled > 0.25));
  }

  function updateCurve(dt) {
    if (G.traveled > G.nextCurveAt) {
      const strength = Math.min(1, 0.5 + 0.05 * level());
      G.curveTarget = pick([-1, -0.6, 0, 0, 0.6, 1]) * strength;
      G.nextCurveAt += rand(40, 85);
    }
    G.curve += (G.curveTarget - G.curve) * Math.min(1, dt * 0.8);
  }

  function updateSparkles() {
    for (let i = 0; i < G.sparkles.length; i++) {
      if (G.sparkles[i].z - G.traveled < 0.6) G.sparkles[i] = newSparkle(rand(VIEW * 0.6, VIEW));
    }
  }

  function updatePlay(dt) {
    G.time -= dt;
    if (G.time <= 0) { G.time = 0; gameOver(); return; }

    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const vmax = stageVMax();
    const spdF = Math.min(1, G.v / vmax);

    // 상태별 속도/조작
    switch (G.status) {
      case 'run':
        G.v = Math.min(vmax, G.v + ACCEL * dt * (1.05 - 0.45 * spdF));
        G.px += dir * STEER * dt * (G.h > 0 ? 0.78 : 0.65 + 0.35 * spdF);
        break;
      case 'stumble':
        G.v = Math.max(1.4, G.v - 5.5 * dt);
        G.px += dir * STEER * dt * 0.35;
        G.statusT -= dt;
        if (G.statusT <= 0) G.status = 'run';
        break;
      case 'hole':
        G.v = 0;
        G.statusT -= dt;
        if (G.holeRef) G.px += (G.holeRef.x - G.px) * Math.min(1, dt * 6);
        if (G.statusT <= 0) {
          const o = G.holeRef;
          G.traveled = o.z + o.hd + 0.08 - DP;
          G.status = 'run'; G.v = 1.2; G.holeRef = null;
        }
        break;
      case 'crash':
        G.v = 0;
        G.statusT -= dt;
        if (G.statusT <= 0) { G.status = 'run'; G.v = 0.8; }
        break;
      case 'rocket':
        G.v += (vmax * 1.3 - G.v) * Math.min(1, dt * 3);
        G.px += dir * STEER * 1.1 * dt;
        G.rocketT -= dt;
        if (G.rocketT <= 0) { G.status = 'run'; G.v = vmax; }
        break;
    }

    // 점프 / 높이
    if (G.status === 'rocket') {
      G.h += (0.85 - G.h) * Math.min(1, dt * 4);
    } else if (G.jumpT >= 0) {
      G.jumpT += dt;
      const k = G.jumpT / JUMP_T;
      if (k >= 1) { G.jumpT = -1; G.h = 0; } else G.h = JUMP_H * 4 * k * (1 - k);
    } else if (G.h > 0) {
      G.h = Math.max(0, G.h - dt * 2.5); // 로켓 착륙
    }

    // 커브 원심력 & 가장자리
    if (G.status !== 'hole') G.px -= G.curve * spdF * 0.42 * dt;
    if (Math.abs(G.px) > 1) {
      G.px = Math.sign(G.px);
      if (G.status === 'run') G.v = Math.max(2.5, G.v - 5 * dt);
    }

    const prevT = G.traveled;
    G.traveled += G.v * dt;
    checkCollisions(prevT);
    updateObjects(dt);
    updateCurve(dt);
    spawnAhead();

    const km = Math.floor(G.traveled / KM);
    if (km > G.kmScored) { G.score += (km - G.kmScored) * 10; G.kmScored = km; }

    if (G.traveled >= stageLen()) startArrive();
  }

  function updateArrive(dt) {
    G.stateT += dt;
    if (G.h > 0) G.h = Math.max(0, G.h - dt * 2.5);
    G.jumpT = -1;
    if (G.phase === 'slow') {
      G.v = Math.max(0, G.v - 8 * dt);
      G.traveled += G.v * dt;
      G.curve *= Math.max(0, 1 - dt * 2);
      if (G.v === 0 && G.stateT > 1.0) { G.phase = 'bonus'; G.stateT = 0; }
    } else if (G.phase === 'bonus') {
      G.bonusAcc += dt;
      while (G.bonusAcc > 0.03) {
        G.bonusAcc -= 0.03;
        if (G.time >= 1) { G.time -= 1; G.score += 100; Sound.play('tick'); }
        else { G.time = 0; G.phase = 'wait'; G.stateT = 0; break; }
      }
    } else if (G.stateT > 1.6) {
      nextStage();
    }
  }

  function update(dt) {
    G.t += dt;
    for (const p of G.popups) p.t += dt;
    G.popups = G.popups.filter((p) => p.t < 0.9);

    if (G.state === 'title') {
      G.v = 2.6;
      G.traveled += G.v * dt;
      G.curve = Math.sin(G.t * 0.25) * 0.6;
    } else if (G.state === 'intro') {
      G.stateT += dt;
      if (G.stateT > 2.4) startPlay();
    } else if (G.state === 'play') {
      updatePlay(dt);
    } else if (G.state === 'arrive') {
      updateArrive(dt);
    }
    if (G.state !== 'gameover') G.skyOffset += G.curve * G.v * dt * 1.6;
    updateSparkles();
  }

  // ---------------------------------------------------------
  // 렌더링
  // ---------------------------------------------------------
  function text(str, x, y, color) {
    for (let i = 0; i < str.length; i++) ctx.drawImage(glyph(str[i], color), x + i * 6, y);
  }

  function drawSky() {
    const bandH = (HORIZON - HUD_H) / SKY.length;
    for (let i = 0; i < SKY.length; i++) {
      ctx.fillStyle = SKY[i];
      ctx.fillRect(0, Math.floor(HUD_H + i * bandH), W, Math.ceil(bandH) + 1);
    }
    for (const s of STARS) {
      let x = (s.x - G.skyOffset * 0.4) % 512;
      if (x < 0) x += 512;
      if (x >= W) continue;
      if (((G.t * 2 + s.tw) | 0) % 5 === 0) continue;
      ctx.fillStyle = s.c;
      ctx.fillRect(x | 0, s.y | 0, 1, 1);
      if (s.big) { ctx.fillRect((x | 0) - 1, s.y | 0, 3, 1); ctx.fillRect(x | 0, (s.y | 0) - 1, 1, 3); }
    }
  }

  function drawRing(p, cx, cy, r, back) {
    const rx = r * 2.0, ry = Math.max(1, r * 0.42), irx = r * 1.35, iry = ry * 0.62;
    ctx.fillStyle = p.ring;
    for (let dy = Math.round(-ry); dy <= Math.round(ry); dy++) {
      if (back ? dy >= 0 : dy < 0) continue;
      const ox = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) * (dy / ry))));
      if (Math.abs(dy) < iry) {
        const ix = Math.round(irx * Math.sqrt(1 - (dy / iry) * (dy / iry)));
        if (ox > ix) { ctx.fillRect(cx - ox, cy + dy, ox - ix, 1); ctx.fillRect(cx + ix + 1, cy + dy, ox - ix, 1); }
      } else {
        ctx.fillRect(cx - ox, cy + dy, ox * 2 + 1, 1);
      }
    }
  }

  function drawPlanet(p, cx, cy, r) {
    cx = Math.round(cx); cy = Math.round(cy); r = Math.max(2, Math.round(r));
    if (p.ring) drawRing(p, cx, cy, r, true);
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.floor(Math.sqrt(r * r - dy * dy));
      const bi = Math.min(p.bands.length - 1, Math.floor(((dy + r) / (2 * r + 1)) * p.bands.length));
      ctx.fillStyle = p.bands[bi];
      ctx.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
      if (p.spots) {
        for (const s of p.spots) {
          const sr = s[2] * r, ddy = dy - s[1] * r;
          if (Math.abs(ddy) > sr) continue;
          const sh = Math.sqrt(sr * sr - ddy * ddy);
          const a = Math.max(Math.round(cx + s[0] * r - sh), cx - half);
          const b = Math.min(Math.round(cx + s[0] * r + sh), cx + half);
          if (b >= a) { ctx.fillStyle = s[3]; ctx.fillRect(a, cy + dy, b - a + 1, 1); }
        }
      }
      const shW = Math.round(half * 0.55);
      if (shW > 0) { ctx.fillStyle = 'rgba(5,0,25,0.38)'; ctx.fillRect(cx + half - shW + 1, cy + dy, shW, 1); }
      if (dy < -r * 0.3 && half > 2) { ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(cx - half, cy + dy, Math.max(1, Math.round(half * 0.35)), 1); }
    }
    if (p.ring) drawRing(p, cx, cy, r, false);
  }

  function drawHorizonPlanet() {
    let prog = G.state === 'title' ? 0.15 : Math.min(1, G.traveled / stageLen());
    if (G.state === 'arrive') prog = 1;
    const r = 5 + 52 * Math.pow(prog, 2.2);
    const cx = W / 2 + G.curve * 45;
    drawPlanet(planet(), cx, HORIZON - r * 0.45, r);
  }

  function drawRidge() {
    for (let i = 0; i < RIDGE.length; i++) {
      let x = (i * 4 - G.skyOffset) % 512;
      if (x < 0) x += 512;
      if (x >= W) continue;
      const h = RIDGE[i];
      if (!h) continue;
      ctx.fillStyle = '#2b1d5e';
      ctx.fillRect(x | 0, HORIZON - h, 4, h);
      ctx.fillStyle = '#4a3a8a';
      ctx.fillRect(x | 0, HORIZON - h, 4, 1);
    }
  }

  function drawFloor() {
    for (let y = HORIZON; y < H; y++) {
      const d = ROW_D[y - HORIZON];
      const lv = Math.min(FOG_L - 1, Math.floor(clamp((d - 5) / 35, 0, 0.999) * FOG_L));
      const stripe = Math.floor((d + G.traveled) * 0.5) & 1;
      ctx.fillStyle = stripe ? PAL.out1[lv] : PAL.out0[lv];
      ctx.fillRect(0, y, W, 1);
      const cx = sxAt(0, d), hw = XS / d;
      const ew = Math.max(1, Math.round(hw * 0.05));
      const l = Math.round(cx - hw), rw = Math.round(hw * 2);
      ctx.fillStyle = stripe ? PAL.road1[lv] : PAL.road0[lv];
      ctx.fillRect(l, y, rw, 1);
      ctx.fillStyle = PAL.edge[lv];
      ctx.fillRect(l, y, ew, 1);
      ctx.fillRect(l + rw - ew, y, ew, 1);
    }
    for (const s of G.sparkles) {
      const d = s.z - G.traveled;
      if (d < 0.6 || d > VIEW) continue;
      const x = sxAt(s.x, d), y = proj(d);
      if (y >= H) continue;
      const sz = d < 3 ? 2 : 1;
      ctx.fillStyle = s.c;
      ctx.fillRect(Math.round(x), Math.round(y), sz, sz);
    }
  }

  function drawHole(o) {
    const zc = o.z - G.traveled;
    // 시각적 세로 두께를 넓혀서 뚜렷하게 보이게 하되, 멀리 있을 때는 원근에 맞춰 자연스럽게 작아지게 함
    const visHd = o.hd * 1.85;
    const df = zc + visHd, dn = Math.max(0.05, zc - visHd);
    if (df <= 0.3 || zc - visHd > VIEW) return;
    let y0 = Math.max(HORIZON, Math.ceil(proj(df)));
    let y1 = Math.min(H - 1, Math.floor(proj(dn)));
    if (y1 < y0) y1 = y0;
    const pulse = ((G.t * 8) | 0) & 1;
    const cyanOuter = pulse ? '#00f5ff' : '#38ffff';

    for (let y = y0; y <= y1; y++) {
      const d = ROW_D[y - HORIZON];
      const tz = clamp((d - zc) / visHd, -0.98, 0.98);
      const absTz = Math.abs(tz);
      const hwWorld = o.r * 1.12 * Math.sqrt(Math.max(0.08, 1 - tz * tz));
      const cx = sxAt(o.x, d), hp = hwWorld * XS / d;
      if (hp < 0.8) continue;

      const xL = Math.round(cx - hp);
      const wTotal = Math.max(2, Math.round(hp * 2));
      const cyanW = Math.max(1, Math.round(hp * 0.16));
      const whiteW = Math.max(1, Math.round(hp * 0.11));

      // 1) 바깥 네온 시안(형광 하늘색) 테두리
      ctx.fillStyle = cyanOuter;
      ctx.fillRect(xL, y, wTotal, 1);

      // 위·아래 끝단 스캔라인은 시안 테두리로 마감
      if (absTz > 0.86 || (y1 - y0 >= 3 && (y === y0 || y === y1))) continue;

      // 2) 안쪽 흰색 이중 테두리
      const wWhite = wTotal - cyanW * 2;
      if (wWhite > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(xL + cyanW, y, wWhite, 1);
      }

      // 위·아래 두 번째 스캔라인은 흰색 테두리로 마감
      if (absTz > 0.72 || (y1 - y0 >= 5 && (y === y0 + 1 || y === y1 - 1))) continue;

      // 3) 중심 칠흑색(#000000) 코어
      const wBlack = wWhite - whiteW * 2;
      if (wBlack > 0) {
        const xCore = xL + cyanW + whiteW;
        ctx.fillStyle = '#000000';
        ctx.fillRect(xCore, y, wBlack, 1);

        // 4) 레트로 도트 소용돌이(시안/화이트 픽셀 링)
        if (wBlack >= 6) {
          const phase = G.t * 5 + y * 0.65;
          const sw1 = Math.sin(phase) * (wBlack * 0.34);
          const sw2 = Math.cos(phase * 0.85) * (wBlack * 0.18);
          if (((y + ((G.t * 10) | 0)) & 1) === 0) {
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(Math.round(cx + sw1), y, Math.max(1, Math.round(cyanW * 0.8)), 1);
          }
          if (wBlack >= 12 && ((y + ((G.t * 14) | 0)) % 3 === 0)) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(cx + sw2), y, 1, 1);
          }
        }
      }
    }
  }

  function drawObjMarker(wx, d, color) {
    if (d > 16) return;
    const x = Math.round(sxAt(wx, d)), gy = Math.round(proj(d));
    if (gy < HORIZON || gy >= H) return;
    const s = DP / Math.max(0.65, d);
    const mw = Math.max(2, Math.round(18 * s));
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - mw / 2), gy, mw, Math.max(1, Math.round(2 * s)));
  }

  function drawSpriteAt(spr, wx, d, hWorld, clipGround, scaleMul = 1.45, minH = 2) {
    // 지평선 멀리에서는 길 폭에 맞춰 2~3px의 작은 점으로 시작하고, 다가올수록 자연스러운 원근 비율로 커져 개구리 근처에서 큼직하게 보이게 함
    const persp = (DP / Math.max(0.65, d)) * scaleMul;
    let h = Math.max(minH, Math.round(spr.height * persp));
    let w = Math.max(minH, Math.round(spr.width * persp));
    const x = sxAt(wx, d), gy = proj(d);
    const lift = hWorld * (XS / Math.max(0.7, d)) * 0.38;
    if (clipGround) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, Math.round(gy)); ctx.clip(); }
    ctx.drawImage(spr, Math.round(x - w / 2), Math.round(gy - h - lift), w, h);
    if (clipGround) ctx.restore();
    return { x: Math.round(x), y: Math.round(gy - h / 2 - lift), w, h };
  }

  function drawSparkleRing(cx, cy, r, color1, color2, d) {
    const sz = d < 5 ? 2 : 1;
    for (let i = 0; i < 4; i++) {
      const a = G.t * 4.5 + i * 1.57;
      const px = Math.round(cx + Math.cos(a) * r);
      const py = Math.round(cy + Math.sin(a) * (r * 0.65));
      ctx.fillStyle = (i & 1) ? color1 : color2;
      ctx.fillRect(px, py, sz, sz);
    }
  }

  function drawObject(o) {
    const d = o.z - G.traveled;
    if (d < 0.3 || d > VIEW) return;
    const blink = ((G.t * 6 + o.z) | 0) % 2 === 0;
    switch (o.type) {
      case 'debris':
        if (o.hit) {
          const k = o.flyT;
          drawSpriteAt(SPR.debrisWarn, o.x + o.vx * k * 1.5, d, 0.5 + k * 1.2 - k * k * 1.5, false, 1.45, 2);
        } else {
          drawObjMarker(o.x, d, 'rgba(255,60,90,0.55)');
          drawSpriteAt(blink ? SPR.debris : SPR.debrisWarn, o.x, d, 0.02, false, 1.5, 2);
        }
        break;
      case 'star':
        if (!o.gone) {
          drawObjMarker(o.x, d, 'rgba(255,225,77,0.55)');
          const info = drawSpriteAt(blink ? SPR.star : SPR.starGlow, o.x, d, 0.14 + Math.sin(G.t * 4.5 + o.z) * 0.06, false, 1.55, 2);
          if (d < 10) drawSparkleRing(info.x, info.y, Math.max(4, info.w * 0.62), '#ffffff', '#ffe14d', d);
        }
        break;
      case 'sat':
        if (o.popped) {
          drawObjMarker(o.x, d, 'rgba(255,60,90,0.65)');
          drawSpriteAt(blink ? SPR.sat : SPR.satBlink, o.x, d, o.ph, false, 1.45, 2);
        }
        break;
      case 'alien':
        if (!o.gone) {
          const ax = o.ax !== undefined ? o.ax : o.x;
          const info = drawSpriteAt(blink ? SPR.alien : SPR.alienGlow, ax, d, o.ah, false, 1.55, 2);
          if (d < 10) drawSparkleRing(info.x, info.y, Math.max(4, info.w * 0.6), '#7dff9e', '#ffe14d', d);
        }
        break;
      case 'rocket':
        if (!o.gone) {
          drawObjMarker(o.x, d, 'rgba(255,107,154,0.65)');
          const glow = ((G.t * 8) | 0) % 2 === 0;
          const info = drawSpriteAt(glow ? SPR.rocketGlow : SPR.rocket, o.x, d, 0.16 + Math.sin(G.t * 5) * 0.06, false, 1.6, 3);
          if (d < 12) drawSparkleRing(info.x, info.y, Math.max(5, info.w * 0.7), '#fff6a8', '#ff6b9a', d);
        }
        break;
    }
  }

  function drawShadow(sx, gy, h) {
    const w = Math.round(22 * (1 - Math.min(h, 1) * 0.45));
    ctx.fillStyle = 'rgba(8,0,28,0.55)';
    ctx.fillRect(Math.round(sx - w * 0.35), gy - 1, Math.round(w * 0.7), 1);
    ctx.fillRect(Math.round(sx - w / 2), gy, w, 2);
    ctx.fillRect(Math.round(sx - w * 0.35), gy + 2, Math.round(w * 0.7), 1);
  }

  function drawFrog() {
    const sx = Math.round(sxAt(G.px, DP));
    const gy = Math.round(proj(DP));
    const hpx = Math.round(G.h * (XS / DP) * 0.35);
    let x0 = sx - 12;
    const by = gy - hpx;

    if (G.status === 'hole' && G.state === 'play') {
      // 블랙홀에서 허우적
      const bob = Math.round(Math.sin(G.t * 14) * 2);
      const alt = ((G.t * 8) | 0) % 2;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, gy - 2); ctx.clip();
      ctx.drawImage(SPR.frog, x0, gy - 15 + 6 + bob);
      ctx.restore();
      ctx.drawImage(SPR.arm, x0 - 3, gy - 18 + (alt ? 0 : 4) + bob);
      ctx.drawImage(SPR.arm, x0 + 23, gy - 18 + (alt ? 4 : 0) + bob);
      return;
    }
    drawShadow(sx, gy, G.h);

    if (G.status === 'crash') {
      ctx.drawImage(SPR.foot, x0 - 5, by - 4);
      ctx.drawImage(SPR.foot, x0 + 22, by - 4);
      ctx.drawImage(SPR.frog, x0, by - 9, 24, 8);
      for (let i = 0; i < 3; i++) {
        const a = G.t * 7 + i * 2.09;
        ctx.fillStyle = '#ffe14d';
        ctx.fillRect(Math.round(sx + Math.cos(a) * 11), Math.round(by - 15 + Math.sin(a) * 3), 2, 2);
      }
      return;
    }

    if (G.status === 'rocket' || (G.state === 'arrive' && G.h > 0.05)) {
      const rw = 18, rh = 24;
      const flick = ((G.t * 20) | 0) % 2;
      ctx.fillStyle = flick ? '#ff9f1c' : '#ffe14d';
      ctx.fillRect(sx - 3, by - 2, 6, 4 + flick * 3);
      ctx.fillStyle = '#fff6a8';
      ctx.fillRect(sx - 1, by - 2, 2, 3 + flick * 2);
      ctx.drawImage(SPR.rocket, sx - rw / 2, by - rh, rw, rh);
      ctx.drawImage(SPR.foot, x0 - 1, by - 22);
      ctx.drawImage(SPR.foot, x0 + 18, by - 22);
      ctx.drawImage(SPR.frog, x0, by - 34);
      return;
    }

    if (G.status === 'stumble') x0 += Math.round(Math.sin(G.t * 45) * 2);

    let frame;
    if (G.h > 0.02) frame = 'jump';
    else if (G.v < 0.3 && G.state !== 'title') frame = 'idle';
    else frame = (Math.floor(G.traveled * (G.status === 'stumble' ? 3 : 1.4)) % 2) ? 'run1' : 'run0';

    if (frame === 'jump') {
      ctx.drawImage(SPR.foot, x0 - 4, by - 9);
      ctx.drawImage(SPR.foot, x0 + 21, by - 9);
    } else if (frame === 'run0') {
      ctx.drawImage(SPR.foot, x0 - 1, by - 4);
      ctx.drawImage(SPR.foot, x0 + 18, by - 8);
    } else if (frame === 'run1') {
      ctx.drawImage(SPR.foot, x0 - 1, by - 8);
      ctx.drawImage(SPR.foot, x0 + 18, by - 4);
    } else {
      ctx.drawImage(SPR.foot, x0 - 1, by - 4);
      ctx.drawImage(SPR.foot, x0 + 18, by - 4);
    }
    ctx.drawImage(SPR.frog, x0, by - 17);

    if (G.state === 'arrive' && G.phase !== 'slow') {
      // 도착 만세
      const alt = ((G.t * 4) | 0) % 2;
      ctx.drawImage(SPR.arm, x0 - 3, by - 22 - alt * 2);
      ctx.drawImage(SPR.arm, x0 + 23, by - 22 - (1 - alt) * 2);
    }
  }

  function drawHud() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, HUD_H);
    const best = Math.max(G.best, G.score);
    text('1P-' + pad(G.score, 6), 8, 6, '#ffffff');
    text('HI-' + pad(best, 6), 90, 6, '#ffffff');
    text('STAGE-' + pad(level() + 1, 2), 180, 6, '#ffffff');
    const tCol = G.time <= 10 && G.state === 'play' && ((G.t * 4) | 0) % 2 ? '#ff4d6d' : '#ffffff';
    text('TIME-' + pad(Math.ceil(G.time), 4), 8, 19, tCol);
    const rest = G.state === 'title' ? planet().km : Math.max(0, Math.ceil((stageLen() - G.traveled) / KM));
    text('REST' + pad(rest, 4), 90, 19, '#ffffff');
    text('km', 138, 19, '#ffffff');
    text('SPEED', 180, 19, '#ffffff');
    const bars = G.status === 'rocket' ? 10 : Math.round(Math.min(1, G.v / stageVMax()) * 10);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i < bars ? (G.status === 'rocket' ? (((G.t * 10) | 0) % 2 ? '#ff6b9a' : '#ffe14d') : '#ffffff') : '#333';
      ctx.fillRect(212 + i * 4, 19, 3, 7);
    }
  }

  function drawPopups() {
    for (const p of G.popups) {
      const y = Math.round(proj(DP) - 50 - p.t * 30);
      const x = Math.round(sxAt(G.px, DP) - p.text.length * 3);
      if (((p.t * 10) | 0) % 3 === 2) continue;
      text(p.text, x, y, p.color);
    }
  }

  function render() {
    ctx.imageSmoothingEnabled = false;
    drawSky();
    drawHorizonPlanet();
    drawRidge();
    drawFloor();

    const objs = G.objects.slice().sort((a, b) => b.z - a.z);
    for (const o of objs) if (o.type === 'hole') drawHole(o);
    const playerZ = G.traveled + DP;
    for (const o of objs) if (o.type !== 'hole' && o.z >= playerZ) drawObject(o);
    drawFrog();
    for (const o of objs) if (o.type !== 'hole' && o.z < playerZ) drawObject(o);

    drawPopups();
    drawHud();
    if (G.state === 'play' && G.status === 'rocket' && G.rocketT < 1.5 && ((G.t * 8) | 0) % 2) {
      text('ROCKET', W / 2 - 18, HUD_H + 6, '#ff6b9a');
    }
  }

  // ---------------------------------------------------------
  // 루프 & 입력
  // ---------------------------------------------------------
  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000);
    lastTs = ts;
    if (!G.paused) update(dt);
    Sound.tickMusic();
    render();
    btnPause.style.visibility = ['intro', 'play', 'arrive'].includes(G.state) ? 'visible' : 'hidden';
    rafId = requestAnimationFrame(loop);
  }

  function onKeyDown(e) {
    if (!running) return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { input.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { input.right = true; e.preventDefault(); }
    else if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
      e.preventDefault();
      if (!e.repeat) {
        if (G.state === 'title') startGame();
        else tryJump();
      }
    } else if (k === 'p' || k === 'P' || k === 'Escape') { togglePause(); }
    else if (k === 'Enter' && G.state === 'title') startGame();
  }
  function onKeyUp(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') input.left = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') input.right = false;
  }
  function onVisibility() { if (document.hidden) togglePause(true); }

  // ---------------------------------------------------------
  // 공개 API
  // ---------------------------------------------------------
  const api = {
    open(opts) {
      openOpts = opts || {};
      buildDom();
      root.classList.remove('sa-hidden');
      if (!running) {
        running = true;
        lastTs = 0;
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        document.addEventListener('visibilitychange', onVisibility);
        rafId = requestAnimationFrame(loop);
      }
      scoreStore.load().then((s) => { G.best = ((s[G.player] || {}).score) || 0; });
      showTitle();
    },
    close() {
      if (!built) return;
      running = false;
      cancelAnimationFrame(rafId);
      Sound.stopMusic();
      input.left = input.right = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVisibility);
      root.classList.add('sa-hidden');
      if (typeof openOpts.onClose === 'function') openOpts.onClose();
    },
    setScoreStore(store) { scoreStore = store || LocalScoreStore; },
  };

  window.SpaceAdventure = api;
})();
