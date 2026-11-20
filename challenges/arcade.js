/* arcade — canvas minigames.
 * config.game picks one of the games below; each documents its own config.
 * Every game:
 *   - works with mouse, touch and keyboard,
 *   - waits for the first input before starting ("tap to start"),
 *   - registers a bot via api.setBot() that plays using only the same inputs a
 *     player has (used by the automated tests to prove each level is winnable),
 *   - calls api.submit(answer) when won; dying/resetting uses soft fails.
 */
(function () {
  'use strict';
  const { h, clamp, rand, pick, shuffle } = U;

  const C = {
    bg: '#f4f7fb', grid: '#e6ecf5', ink: '#202124', muted: '#5f6368', blue: '#3f7fe0', blueD: '#2f68c4',
    red: '#d93025', green: '#1f9d55', yellow: '#f2b632', purple: '#8e44ad', white: '#fff', line: '#c9d3e1',
  };
  const FONT = 'Roboto, system-ui, -apple-system, "Segoe UI", Arial, sans-serif';

  // ------------------------------------------------------------------ stage: canvas + input
  function stage(api, opts = {}) {
    const W = opts.w || 320, H = opts.h || 220;
    const canvas = h('canvas', { class: 'arcade-canvas', style: { aspectRatio: `${W} / ${H}` }, 'aria-label': opts.label || 'Minigame' });
    const hudL = h('span'), hudR = h('span');
    const hud = h('div', { class: 'arcade-hud' }, hudL, hudR);
    const wrap = h('div', { class: 'arcade' }, hud, canvas);
    api.body.appendChild(wrap);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const g = canvas.getContext('2d');
    g.scale(dpr, dpr);
    const input = { down: false, pressed: false, x: W / 2, y: H / 2, keys: {}, swipe: null, tap: null, moved: false, any: false };
    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    };
    let start = null;
    const onDown = (e) => {
      if (api.isLocked()) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* synthetic */ }
      const p = toLocal(e);
      Object.assign(input, { down: true, pressed: true, x: p.x, y: p.y, tap: p, any: true });
      start = p;
    };
    const onMove = (e) => { const p = toLocal(e); input.x = p.x; input.y = p.y; input.moved = true; };
    const onUp = (e) => {
      input.down = false;
      if (start) {
        const p = toLocal(e);
        const dx = p.x - start.x, dy = p.y - start.y;
        if (Math.hypot(dx, dy) > 22) input.swipe = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      }
      start = null;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.style.touchAction = 'none';
    const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
    const isTyping = (e) => e.target && /input|textarea|select/i.test(e.target.tagName);
    const onKey = (e) => {
      if (isTyping(e) || api.isLocked()) return;
      const down = e.type === 'keydown';
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (down && !e.repeat) { input.pressed = true; input.any = true; }
        input.down = down;
      }
      const k = KEYMAP[e.key];
      if (k) {
        e.preventDefault();
        if (down && !input.keys[k]) { input.swipe = k; input.any = true; }
        input.keys[k] = down;
      }
      if (opts.onKey) opts.onKey(e, down);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKey);
    api.onCleanup(() => { document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKey); });
    return {
      W, H, g, canvas, wrap, input,
      hud(l, r) { hudL.textContent = l || ''; hudR.textContent = r || ''; },
      consume() { input.pressed = false; input.swipe = null; input.tap = null; },
    };
  }

  /** Fixed-step loop. step(dt) runs at `hz`; draw() once per frame. */
  function run(api, S, step, draw, hz = 120) {
    let acc = 0;
    api.loop((dt) => {
      acc += dt;
      let n = 0;
      while (acc >= 1 / hz && n < 12) { step(1 / hz); acc -= 1 / hz; n++; if (n === 1) S.consume(); }
      draw();
      return true;
    });
  }

  // drawing helpers
  function rr(g, x, y, w, hh, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, hh, r) : g.rect(x, y, w, hh); }
  function text(g, s, x, y, size = 14, color = C.ink, align = 'center', weight = 500) {
    g.font = `${weight} ${size}px ${FONT}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y);
  }
  function emoji(g, s, x, y, size) { g.font = `${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function checkbox(g, x, y, s, rot = 0, checked = true, color = C.blue) {
    g.save(); g.translate(x + s / 2, y + s / 2); g.rotate(rot);
    rr(g, -s / 2, -s / 2, s, s, 3); g.fillStyle = C.white; g.fill(); g.lineWidth = 2.5; g.strokeStyle = color; g.stroke();
    if (checked) { g.beginPath(); g.moveTo(-s * 0.28, 0); g.lineTo(-s * 0.06, s * 0.22); g.lineTo(s * 0.3, -s * 0.24); g.strokeStyle = C.green; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
    g.restore();
  }
  function bgGrid(g, W, H, off = 0, size = 24) {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = C.grid; g.lineWidth = 1;
    for (let x = -((off % size) + size) % size; x < W; x += size) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
    for (let y = 0; y < H; y += size) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
  }
  function overlay(g, W, H, title, sub) {
    g.fillStyle = 'rgba(255,255,255,.78)'; g.fillRect(0, 0, W, H);
    text(g, title, W / 2, H / 2 - 10, 17, C.ink, 'center', 700);
    if (sub) text(g, sub, W / 2, H / 2 + 14, 12, C.muted);
  }
  const TAP = matchMedia && matchMedia('(pointer: coarse)').matches ? 'Tap' : 'Click or press Space';

  const G = {};

  // ================================================================== CHECKBOX DASH (auto-runner)
  /* config:
   *   floor: course string, one char per 20px column
   *     '.' ground  '^' spike  'A' tall spike  '#' block  '=' tall block  '_' pit
   *     'o' jump orb (tap in mid-air)  '*' star (calm mode)  'C' checkpoint
   *     'G' flip gravity  'F' fly mode (hold to rise)  'R' back to running
   *   ceil:  optional ceiling string: '.' ceiling  'v' hanging spike  'V' tall hanging spike  '#' hanging block  '_' no ceiling
   *   speed (tiles/s, default 8), mirror (draw right-to-left), calm (no death, collect stars),
   *   lanes: [{floor, ceil, label}] two-lane duo mode (left half / F key = lane 1, right half / J key = lane 2)
   * Answer: { done, attempts, stars }
   */
  G.runner = (api, cfg) => {
    const duo = Array.isArray(cfg.lanes);
    const W = 360, H = duo ? 240 : 200;
    const S = stage(api, { w: W, h: H, label: 'Checkbox Dash', onKey: (e, down) => {
      if (!duo) return;
      if (e.key === 'f' || e.key === 'F') { if (down && !e.repeat) laneIn[0].pressed = true; laneIn[0].down = down; }
      if (e.key === 'j' || e.key === 'J') { if (down && !e.repeat) laneIn[1].pressed = true; laneIn[1].down = down; }
    } });
    const T = 20, P = 18, PX = 92;
    const speed = (cfg.speed || 8) * T;
    const JV = 560, GRAV = 2000;
    const laneDefs = duo ? cfg.lanes : [{ floor: cfg.floor, ceil: cfg.ceil }];
    const laneH = H / laneDefs.length;
    const lanes = laneDefs.map((d, i) => {
      const N = d.floor.length;
      return {
        N, floor: d.floor, ceil: (d.ceil || '').padEnd(N, '.'), label: d.label,
        oy: i * laneH, FLOOR: i * laneH + laneH - (duo ? 16 : 30), CEIL: i * laneH + (duo ? 8 : 30),
      };
    });
    const laneIn = lanes.map(() => ({ down: false, pressed: false }));
    const N = Math.max(...lanes.map((l) => l.N));

    const fc = (L, c) => (c < 0 || c >= L.N ? '.' : L.floor[c]);
    const cc = (L, c) => (c < 0 || c >= L.N ? '.' : L.ceil[c]);
    const floorTop = (L, c) => { const ch = fc(L, c); return ch === '_' ? Infinity : ch === '#' ? L.FLOOR - T : ch === '=' ? L.FLOOR - 2 * T : L.FLOOR; };
    const ceilBot = (L, c) => { const ch = cc(L, c); return ch === '_' ? -Infinity : ch === '#' ? L.CEIL + T : L.CEIL; };
    const spikeHit = (L, s) => {
      const c0 = Math.floor(s.x / T), c1 = Math.floor((s.x + P) / T);
      for (let c = c0; c <= c1; c++) {
        const x0 = c * T, f = fc(L, c), k = cc(L, c);
        const boxes = [];
        if (f === '^') boxes.push([x0 + 5, x0 + T - 5, L.FLOOR - T + 8, L.FLOOR]);
        if (f === 'A') boxes.push([x0 + 4, x0 + T - 4, L.FLOOR - 2 * T + 9, L.FLOOR]);
        if (k === 'v') boxes.push([x0 + 5, x0 + T - 5, L.CEIL, L.CEIL + T - 8]);
        if (k === 'V') boxes.push([x0 + 4, x0 + T - 4, L.CEIL, L.CEIL + 2 * T - 9]);
        for (const b of boxes) if (s.x + P - 2 > b[0] && s.x + 2 < b[1] && s.y + P - 2 > b[2] && s.y + 2 < b[3]) return true;
      }
      return false;
    };
    const fresh = (L) => ({ x: 0, y: L.FLOOR - P, vy: 0, g: 1, mode: 'run', ground: true, dead: false, won: false, lastCol: -1, stars: 0, got: {} });

    /** Pure-ish physics step (also used by the bot's look-ahead). */
    function step(L, s, hold, press, dt, real) {
      if (s.dead || s.won) return;
      const prevY = s.y;
      s.x += speed * dt;
      const col = Math.floor((s.x + P / 2) / T);
      if (col !== s.lastCol) {
        s.lastCol = col;
        const ch = fc(L, col);
        if (ch === 'G') { s.g = -s.g; s.ground = false; }
        if (ch === 'F') s.mode = 'fly';
        if (ch === 'R') s.mode = 'run';
        if (ch === 'C' && real) real.checkpoint(s);
        if (ch === '*' && !s.got[col]) { s.got[col] = 1; s.stars++; if (real) real.star(); }
      }
      if (s.mode === 'run') {
        if (s.ground && hold) { s.vy = -JV * s.g; s.ground = false; }
        else if (press && !s.ground) {
          const c0 = Math.floor(s.x / T), c1 = Math.floor((s.x + P) / T);
          for (let c = c0; c <= c1; c++) {
            if (fc(L, c) !== 'o') continue;
            const oy = s.g > 0 ? L.FLOOR - 2.6 * T : L.CEIL + 2.6 * T;
            if (Math.abs(s.y + P / 2 - oy) < 26) { s.vy = -JV * 0.92 * s.g; break; }
          }
        }
        s.vy += GRAV * s.g * dt;
      } else {
        s.vy = clamp(s.vy + (hold ? -1 : 1) * 1500 * dt, -260, 260);
      }
      s.y += s.vy * dt;
      const c0 = Math.floor((s.x + 2) / T), c1 = Math.floor((s.x + P - 2) / T);
      let top = Infinity, bot = -Infinity;
      for (let c = c0; c <= c1; c++) { top = Math.min(top, floorTop(L, c)); bot = Math.max(bot, ceilBot(L, c)); }
      s.ground = false;
      if (s.mode === 'fly') {
        if (s.y + P > top) { if (prevY + P <= top + 2) { s.y = top - P; s.vy = 0; } else s.dead = true; }
        if (s.y < bot) { if (prevY >= bot - 2) { s.y = bot; s.vy = 0; } else s.dead = true; }
      } else if (s.g > 0) {
        if (s.y + P >= top && prevY + P <= top + 3) { s.y = top - P; s.vy = 0; s.ground = true; }
        if (s.y < bot && prevY >= bot - 3) { s.y = bot; s.vy = Math.max(0, s.vy); }
      } else {
        if (s.y <= bot && prevY >= bot - 3) { s.y = bot; s.vy = 0; s.ground = true; }
        if (s.y + P > top && prevY + P <= top + 3) { s.y = top - P; s.vy = Math.min(0, s.vy); }
      }
      for (let c = c0; c <= c1; c++) {
        const ft = floorTop(L, c), cb = ceilBot(L, c);
        if (ft !== Infinity && ft < s.y + P - 4) s.dead = true;
        if (cb !== -Infinity && cb > s.y + 4) s.dead = true;
      }
      if (s.y > L.oy + laneH + 30 || s.y < L.oy - 40) s.dead = true;
      if (!cfg.calm && spikeHit(L, s)) s.dead = true;
      if (cfg.calm) s.dead = s.dead && false;
      if (s.x > L.N * T) s.won = true;
    }

    // ---- bot: depth-first look-ahead with memo of dead-end states
    function botAct(L, s) {
      const DT = 1 / 120, HZN = s.mode === 'fly' ? 84 : 110, K = s.mode === 'fly' ? 6 : 3;
      const bad = new Set();
      const orbNear = (q) => { const c = Math.floor((q.x + P / 2) / T); return fc(L, c) === 'o' || fc(L, c + 1) === 'o'; };
      const rec = (q, t, prev) => {
        if (q.dead) return false;
        if (q.won || t >= HZN) return true;
        const key = `${t}|${q.x | 0}|${q.y | 0}|${(q.vy / 20) | 0}|${q.g}|${q.mode}|${q.ground}`;
        if (bad.has(key)) return false;
        const acts = q.mode === 'run' && !q.ground && !orbNear(q) ? [false] : [false, true];
        for (const a of acts) {
          const n = Object.assign({}, q); let p = prev;
          for (let k = 0; k < K && !n.dead && !n.won; k++) { step(L, n, a, a && !p, DT); p = a; }
          if (rec(n, t + K, a)) return true;
        }
        bad.add(key);
        return false;
      };
      for (const a of (s.mode === 'fly' ? [false, true] : [false, true])) {
        const n = Object.assign({}, s);
        let p = s.prevAct;
        for (let k = 0; k < K && !n.dead && !n.won; k++) { step(L, n, a, a && !p, DT); p = a; }
        if (rec(n, K, a)) return a;
      }
      return true;
    }

    let st = lanes.map(fresh);
    let cps = lanes.map(() => null);
    let started = false, bot = false, attempts = 1, deadT = 0, beatT = 0, botCount = 0;
    const parts = [];
    const real = lanes.map((L, i) => ({
      checkpoint: (s) => { cps[i] = Object.assign({}, s, { got: Object.assign({}, s.got) }); if (!cfg.calm) api.sound.tone(880, 0.08, 'triangle', 0.06); },
      star: () => api.sound.tone(990 + rand(0, 200), 0.08, 'triangle', 0.07),
    }));
    const reset = () => {
      st = lanes.map((L, i) => (cps[i] ? Object.assign({}, cps[i], { got: Object.assign({}, cps[i].got), dead: false, vy: 0 }) : fresh(L)));
      if (duo) { const minX = Math.min(...st.map((s) => s.x)); st.forEach((s, i) => { if (!cps[i] || s.x !== minX) { /* keep lanes in sync */ } }); }
    };
    api.setBot(() => { bot = true; started = true; });

    run(api, S, (dt) => {
      const inp = S.input;
      if (!started) { if (inp.pressed || laneIn.some((l) => l.pressed)) { started = true; } else return; }
      if (deadT > 0) { deadT -= dt; if (deadT <= 0) { reset(); attempts++; } return; }
      beatT += dt;
      if (beatT >= 0.5) { beatT -= 0.5; api.sound.tone(90, 0.09, 'sine', 0.12); }
      lanes.forEach((L, i) => {
        const s = st[i];
        let hold, press;
        if (duo) {
          const tap = inp.tap;
          if (tap && ((i === 0 && tap.x < W / 2) || (i === 1 && tap.x >= W / 2))) laneIn[i].pressed = true;
          hold = laneIn[i].down || laneIn[i].pressed || (inp.down && ((i === 0) === (inp.x < W / 2)));
          press = laneIn[i].pressed;
          laneIn[i].pressed = false;
        } else { hold = inp.down || inp.pressed; press = inp.pressed; }
        if (bot) {
          if (botCount++ % 2 === 0 || s.botA === undefined) s.botA = botAct(L, s);
          hold = s.botA; press = s.botA && !s.prevAct;
        }
        s.prevAct = hold;
        step(L, s, hold, press, dt, real[i]);
      });
      if (st.some((s) => s.dead)) {
        deadT = 0.55;
        api.sound.tone(160, 0.2, 'sawtooth', 0.06, 0, 70);
        st.forEach((s, i) => { if (s.dead) for (let k = 0; k < 14; k++) parts.push({ x: PX + 9, y: s.y + 9, vx: rand(-160, 160), vy: rand(-200, 60), t: 0.6, lane: i }); });
        api.fail(pick(['Spiked. Again!', 'Checkbox down. Respawning…', 'So close. Probably.', 'The spike was not a checkbox.']), { soft: true, suspicion: 1 });
      }
      if (st.every((s) => s.won)) { api.submit({ done: true, attempts, stars: st.reduce((a, s) => a + s.stars, 0) }); }
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.t -= dt; }
      for (let k = parts.length - 1; k >= 0; k--) if (parts[k].t <= 0) parts.splice(k, 1);
    }, () => {
      const g = S.g;
      g.save();
      if (cfg.mirror) { g.translate(W, 0); g.scale(-1, 1); }
      lanes.forEach((L, i) => {
        const s = st[i];
        const off = s.x - PX;
        g.save();
        g.beginPath(); g.rect(0, L.oy, W, laneH); g.clip();
        g.fillStyle = cfg.calm ? '#fff3e0' : C.bg; g.fillRect(0, L.oy, W, laneH);
        if (cfg.calm) { const gr = g.createLinearGradient(0, L.oy, 0, L.oy + laneH); gr.addColorStop(0, '#ffb88c'); gr.addColorStop(1, '#ffe8c9'); g.fillStyle = gr; g.fillRect(0, L.oy, W, laneH); g.fillStyle = '#ffd36e'; g.beginPath(); g.arc(W - 70, L.oy + 70, 26, 0, 7); g.fill(); }
        g.strokeStyle = cfg.calm ? 'rgba(255,255,255,.35)' : C.grid; g.lineWidth = 1;
        for (let x = -((off * 0.4) % 24); x < W; x += 24) { g.beginPath(); g.moveTo(x, L.oy); g.lineTo(x, L.oy + laneH); g.stroke(); }
        const c0 = Math.floor(off / T) - 1, c1 = c0 + Math.ceil(W / T) + 2;
        for (let c = c0; c <= c1; c++) {
          const x = c * T - off, f = fc(L, c), k = cc(L, c);
          if (c >= L.N) { g.fillStyle = 'rgba(31,157,85,.12)'; g.fillRect(x, L.oy, T, laneH); }
          if (f !== '_') { g.fillStyle = cfg.calm ? '#8d6e63' : '#dfe8f7'; g.fillRect(x, L.FLOOR, T + 0.5, L.oy + laneH - L.FLOOR); g.fillStyle = cfg.calm ? '#6d4c41' : C.blue; g.fillRect(x, L.FLOOR, T + 0.5, 2); }
          if (k !== '_' && !duo) { g.fillStyle = cfg.calm ? 'rgba(0,0,0,0)' : C.blue; g.fillRect(x, L.oy, T + 0.5, L.CEIL - L.oy); }
          if (f === '#' || f === '=') { const hh = f === '#' ? T : 2 * T; rr(g, x + 1, L.FLOOR - hh + 1, T - 2, hh - 2, 2); g.fillStyle = C.white; g.fill(); g.strokeStyle = '#b8c2d0'; g.lineWidth = 1.5; g.stroke(); }
          if (k === '#') { rr(g, x + 1, L.CEIL + 1, T - 2, T - 2, 2); g.fillStyle = C.white; g.fill(); g.strokeStyle = '#b8c2d0'; g.stroke(); }
          const spike = (bx, by, hh, down) => { g.beginPath(); g.moveTo(bx + 2, by); g.lineTo(bx + T / 2, down ? by + hh : by - hh); g.lineTo(bx + T - 2, by); g.closePath(); g.fillStyle = C.red; g.fill(); g.strokeStyle = '#8c1d18'; g.lineWidth = 1; g.stroke(); };
          if (f === '^') spike(x, L.FLOOR, T, false);
          if (f === 'A') spike(x, L.FLOOR, 2 * T, false);
          if (k === 'v') spike(x, L.CEIL, T, true);
          if (k === 'V') spike(x, L.CEIL, 2 * T, true);
          if (f === 'o') { const oy = s.g > 0 ? L.FLOOR - 2.6 * T : L.CEIL + 2.6 * T; g.beginPath(); g.arc(x + T / 2, oy, 7, 0, 7); g.fillStyle = C.yellow; g.fill(); g.strokeStyle = '#b07d00'; g.lineWidth = 2; g.stroke(); }
          if (f === '*' && !s.got[c]) emoji(g, '⭐', x + T / 2, L.FLOOR - 2.4 * T, 16);
          if ('GFR'.includes(f) && f !== '.') { const col = f === 'G' ? C.purple : f === 'F' ? C.green : C.blue; g.fillStyle = col; g.globalAlpha = 0.35; rr(g, x + 3, L.CEIL + 4, T - 6, L.FLOOR - L.CEIL - 8, 8); g.fill(); g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 2; g.stroke(); }
          if (f === 'C') { g.fillStyle = C.ink; g.fillRect(x + 8, L.FLOOR - 26, 2, 26); g.fillStyle = C.green; g.beginPath(); g.moveTo(x + 10, L.FLOOR - 26); g.lineTo(x + 20, L.FLOOR - 21); g.lineTo(x + 10, L.FLOOR - 16); g.fill(); }
        }
        if (!s.dead) {
          const rot = s.mode === 'run' ? (s.ground ? 0 : (s.x / 40) % (Math.PI * 2)) * s.g : clamp(s.vy / 500, -0.5, 0.5);
          checkbox(g, PX, s.y, P, rot, true, duo && i === 1 ? C.purple : C.blue);
          if (duo && i === 1) emoji(g, '🤖', PX + 9, s.y - 10, 11);
        }
        g.restore();
        if (duo) { text(g, L.label || (i === 0 ? 'You (F / left half)' : 'Robot (J / right half)'), 8, L.oy + 14, 11, C.muted, 'left'); if (i === 0) { g.fillStyle = C.line; g.fillRect(0, laneH - 1, W, 2); } }
      });
      for (const p of parts) { g.fillStyle = p.t > 0.3 ? C.blue : C.green; g.globalAlpha = clamp(p.t * 2, 0, 1); g.fillRect(p.x, p.y + lanes[p.lane].oy * 0, 4, 4); g.globalAlpha = 1; }
      g.restore();
      const prog = clamp(Math.min(...st.map((s) => s.x)) / (N * T), 0, 1);
      g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(60, 6, W - 120, 5); g.fillStyle = C.green; g.fillRect(60, 6, (W - 120) * prog, 5);
      S.hud(`Attempt ${attempts}`, cfg.calm ? `⭐ ${st.reduce((a, s) => a + s.stars, 0)}` : `${Math.round(prog * 100)}%`);
      if (!started) overlay(g, W, H, duo ? 'Tap the left half for you, right half for the robot' : `${TAP} to jump`, cfg.hintText || (cfg.floor && cfg.floor.includes('F') ? 'In fly mode, hold to rise' : 'Avoid the red spikes'));
      if (deadT > 0) { g.fillStyle = 'rgba(217,48,37,.12)'; g.fillRect(0, 0, W, H); }
    });
  };

  // ================================================================== SNAKE
  /* config: goal (food to eat, default 8), speed (s per step, 0.13), walls: 'banners' for cookie-banner obstacles */
  G.snake = (api, cfg) => {
    const COLS = 15, ROWS = 11, CELL = 20, W = COLS * CELL, H = ROWS * CELL;
    const S = stage(api, { w: W, h: H, label: 'Snake' });
    const pad = dpad(api, S);
    const goal = cfg.goal || 8;
    let walls = new Set();
    if (cfg.walls === 'banners') [[3, 2], [4, 2], [5, 2], [6, 2], [9, 8], [10, 8], [11, 8], [12, 8], [2, 6], [3, 6], [4, 6], [10, 4], [11, 4], [12, 4]].forEach(([x, y]) => walls.add(x + ',' + y));
    let body, dir, next, food, eaten, acc, started = false, bot = false, deadT = 0;
    const free = (x, y, ignoreTail) => x >= 0 && y >= 0 && x < COLS && y < ROWS && !walls.has(x + ',' + y) && !body.slice(0, ignoreTail ? -1 : undefined).some((b) => b[0] === x && b[1] === y);
    const placeFood = () => { let f; do { f = [Math.floor(rand(0, COLS)), Math.floor(rand(0, ROWS))]; } while (!free(f[0], f[1]) || (f[0] === body[0][0] && f[1] === body[0][1])); food = f; };
    const reset = () => { body = [[4, 5], [3, 5], [2, 5]]; dir = 'right'; next = 'right'; eaten = 0; acc = 0; placeFood(); };
    reset();
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
    const botDir = () => {
      const [hx, hy] = body[0];
      const q = [[hx, hy]], prev = { [hx + ',' + hy]: null };
      while (q.length) {
        const [x, y] = q.shift();
        if (x === food[0] && y === food[1]) break;
        for (const k of ['up', 'down', 'left', 'right']) { const nx = x + D[k][0], ny = y + D[k][1], key = nx + ',' + ny; if (!(key in prev) && free(nx, ny, true)) { prev[key] = [x, y, k]; q.push([nx, ny]); } }
      }
      let key = food[0] + ',' + food[1];
      if (!(key in prev)) { for (const k of ['up', 'down', 'left', 'right']) if (k !== OPP[dir] && free(hx + D[k][0], hy + D[k][1], true)) return k; return dir; }
      let first = null;
      while (prev[key]) { const [x, y, k] = prev[key]; first = k; key = x + ',' + y; }
      return first || dir;
    };
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      const sw = S.input.swipe || pad.take();
      if (sw && D[sw]) { started = true; if (sw !== OPP[dir]) next = sw; }
      if (!started) return;
      if (deadT > 0) { deadT -= dt; if (deadT <= 0) reset(); return; }
      acc += dt;
      if (acc < (cfg.speed || 0.13)) return;
      acc = 0;
      if (bot) next = botDir();
      dir = next;
      const nx = body[0][0] + D[dir][0], ny = body[0][1] + D[dir][1];
      if (!free(nx, ny, true)) { deadT = 0.6; api.sound.error(); api.fail(cfg.walls ? 'You hit a cookie banner. Classic internet.' : 'Ouch. Snakes should not eat walls (or themselves).', { soft: true, suspicion: 2 }); return; }
      body.unshift([nx, ny]);
      if (nx === food[0] && ny === food[1]) { eaten++; api.sound.tone(600 + eaten * 50, 0.07, 'triangle', 0.08); if (eaten >= goal) { api.submit({ eaten }); return; } placeFood(); } else body.pop();
    }, () => {
      const g = S.g;
      bgGrid(g, W, H, 0, CELL);
      walls.forEach((k) => { const [x, y] = k.split(',').map(Number); g.fillStyle = '#ffe0b2'; g.fillRect(x * CELL, y * CELL, CELL, CELL); emoji(g, '🍪', x * CELL + 10, y * CELL + 11, 13); });
      g.fillStyle = C.green; g.beginPath(); g.arc(food[0] * CELL + 10, food[1] * CELL + 10, 8, 0, 7); g.fill();
      g.strokeStyle = C.white; g.lineWidth = 2.4; g.beginPath(); g.moveTo(food[0] * CELL + 6, food[1] * CELL + 10); g.lineTo(food[0] * CELL + 9, food[1] * CELL + 13); g.lineTo(food[0] * CELL + 14, food[1] * CELL + 7); g.stroke();
      body.forEach((b, i) => { rr(g, b[0] * CELL + 1, b[1] * CELL + 1, CELL - 2, CELL - 2, 4); g.fillStyle = i === 0 ? C.blueD : C.blue; g.fill(); });
      const hb = body[0]; g.fillStyle = C.white; g.fillRect(hb[0] * CELL + 6, hb[1] * CELL + 6, 3, 3); g.fillRect(hb[0] * CELL + 11, hb[1] * CELL + 6, 3, 3);
      S.hud(`Eaten ${eaten} / ${goal}`, cfg.walls ? '🍪 = cookie banner' : '');
      if (!started) overlay(g, W, H, 'Arrow keys, swipe, or the buttons', 'Eat the green checkmarks');
      if (deadT > 0) { g.fillStyle = 'rgba(217,48,37,.15)'; g.fillRect(0, 0, W, H); }
    }, 60);
  };

  /** On-screen d-pad for touch (snake, crossing). */
  function dpad(api, S) {
    let queued = null;
    const mk = (d, label) => { const b = h('button', { class: 'dpad-btn', type: 'button', 'aria-label': d }, label); b.addEventListener('pointerdown', (e) => { e.preventDefault(); queued = d; S.input.any = true; }); return b; };
    S.wrap.appendChild(h('div', { class: 'dpad' }, mk('up', '▲'), h('div', { class: 'dpad-row' }, mk('left', '◀'), mk('down', '▼'), mk('right', '▶'))));
    return { take() { const q = queued; queued = null; return q; } };
  }

  // ================================================================== BREAKOUT
  /* config: bricks: array of rows, each row an array of labels (or a number of plain bricks); lives (3) */
  G.breakout = (api, cfg) => {
    const W = 300, H = 230;
    const S = stage(api, { w: W, h: H, label: 'Breakout' });
    const rows = cfg.bricks || [6, 6, 6, 6];
    let bricks = [];
    const build = () => {
      bricks = [];
      rows.forEach((row, r) => {
        const labels = Array.isArray(row) ? row : Array(row).fill('');
        const bw = (W - 20) / labels.length;
        labels.forEach((l, i) => bricks.push({ x: 10 + i * bw + 2, y: 34 + r * 20, w: bw - 4, h: 16, label: l, alive: true, color: ['#3f7fe0', '#5c8ee6', '#7aa2e8', '#9db7e6', '#b8c9ea'][r % 5] }));
      });
    };
    build();
    const pw = 64;
    let px = W / 2, ball, lives = cfg.lives || 3, started = false, bot = false, launched = false;
    const resetBall = () => { ball = { x: px, y: H - 26, vx: 0, vy: 0, r: 5, sp: 210 }; launched = false; };
    resetBall();
    const launch = () => { if (launched) return; launched = true; const a = rand(-0.6, 0.6); ball.vx = Math.sin(a) * ball.sp; ball.vy = -Math.cos(a) * ball.sp; };
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      const inp = S.input;
      if (inp.pressed) { started = true; launch(); }
      if (!started) return;
      if (bot) {
        let tx = ball.x;
        if (ball.vy > 0) { let x = ball.x, y = ball.y, vx = ball.vx; const t = (H - 20 - y) / ball.vy; x += vx * t; while (x < 0 || x > W) x = x < 0 ? -x : 2 * W - x; tx = x; }
        const target = bricks.find((b) => b.alive);
        if (target && ball.vy > 0 && ball.y > H * 0.55) tx += clamp((tx - (target.x + target.w / 2)) * 0.15, -22, 22);
        px += clamp(tx - px, -420 * dt, 420 * dt);
        if (!launched) launch();
      } else if (inp.keys.left || inp.keys.right) px += (inp.keys.right ? 1 : -1) * 320 * dt;
      else if (inp.moved || inp.down) px += clamp(inp.x - px, -600 * dt, 600 * dt);
      px = clamp(px, pw / 2, W - pw / 2);
      if (!launched) { ball.x = px; return; }
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
      if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < 24 + ball.r) { ball.y = 24 + ball.r; ball.vy = Math.abs(ball.vy); }
      if (ball.vy > 0 && ball.y + ball.r >= H - 20 && ball.y < H - 10 && Math.abs(ball.x - px) < pw / 2 + ball.r) {
        const off = (ball.x - px) / (pw / 2);
        ball.sp = Math.min(ball.sp * 1.03, 330);
        ball.vx = off * ball.sp * 0.8; ball.vy = -Math.sqrt(Math.max(ball.sp * ball.sp - ball.vx * ball.vx, 900));
        api.sound.tone(520, 0.04, 'square', 0.04);
      }
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.alive = false;
          const overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
          const overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
          if (overlapX < overlapY) ball.vx = -ball.vx; else ball.vy = -ball.vy;
          api.sound.tone(700 + rand(0, 200), 0.05, 'triangle', 0.06);
          break;
        }
      }
      if (bricks.every((b) => !b.alive)) { api.submit({ cleared: true }); return; }
      if (ball.y > H + 10) {
        lives--;
        api.fail(lives > 0 ? `Ball lost. ${lives} ${lives === 1 ? 'life' : 'lives'} left.` : 'Out of lives. The CAPTCHA rebuilt itself.', { soft: true, suspicion: 2 });
        if (lives <= 0) { lives = cfg.lives || 3; build(); }
        resetBall();
      }
    }, () => {
      const g = S.g;
      bgGrid(g, W, H);
      g.fillStyle = C.blue; g.fillRect(0, 0, W, 22);
      text(g, cfg.title || 'stillCAPTCHA', W / 2, 11, 11, C.white, 'center', 600);
      for (const b of bricks) if (b.alive) { rr(g, b.x, b.y, b.w, b.h, 3); g.fillStyle = b.color; g.fill(); if (b.label) text(g, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, 9, C.white, 'center', 600); }
      rr(g, px - pw / 2, H - 20, pw, 8, 4); g.fillStyle = C.ink; g.fill();
      g.beginPath(); g.arc(ball.x, ball.y, ball.r, 0, 7); g.fillStyle = C.green; g.fill();
      S.hud(`Lives ${'♥'.repeat(lives)}`, `${bricks.filter((b) => !b.alive).length} / ${bricks.length}`);
      if (!started) overlay(g, W, H, `Move to steer · ${TAP} to launch`, 'Break every brick');
    });
  };

  // ================================================================== FLAP (glider through gaps / kite)
  /* config: goal (gates to pass, 6), gap (78), kite (no gates; survive config.duration s), sprite: 'plane'|'verify'|'kite' */
  G.flap = (api, cfg) => {
    const W = 300, H = 220;
    const S = stage(api, { w: W, h: H, label: 'Glider' });
    const goal = cfg.goal || 6, gapH = cfg.gap || 80;
    let p, gates, passed, t, started = false, bot = false, deadT = 0;
    const reset = () => { p = { x: 70, y: H / 2, vy: 0 }; gates = []; passed = 0; t = 0; if (!cfg.kite) for (let i = 0; i < 3; i++) gates.push({ x: 260 + i * 150, gy: rand(50, H - 50 - gapH), done: false }); };
    reset();
    api.setBot(() => { bot = true; started = true; });
    let gust = 0;
    run(api, S, (dt) => {
      let flap = S.input.pressed;
      if (flap) started = true;
      if (!started) return;
      if (deadT > 0) { deadT -= dt; if (deadT <= 0) reset(); return; }
      t += dt;
      if (bot) {
        const nextG = gates.find((gg) => gg.x + 36 > p.x - 10);
        const target = nextG ? nextG.gy + gapH * 0.62 : H * 0.55;
        flap = p.y + p.vy * 0.1 > target && p.vy > -40;
      }
      if (flap) { p.vy = -250; api.sound.tone(500, 0.04, 'triangle', 0.04); }
      if (cfg.kite) { if (Math.random() < dt * 0.8) gust = rand(-260, 260); gust *= 0.98; p.vy += gust * dt; }
      p.vy += 820 * dt; p.y += p.vy * dt;
      for (const gg of gates) {
        gg.x -= 115 * dt;
        if (!gg.done && gg.x + 36 < p.x) { gg.done = true; passed++; api.sound.tone(800, 0.06, 'triangle', 0.06); }
        if (p.x + 12 > gg.x && p.x - 12 < gg.x + 36 && (p.y - 8 < gg.gy || p.y + 8 > gg.gy + gapH)) die();
      }
      if (gates.length && gates[0].x < -40) { gates.shift(); gates.push({ x: gates[gates.length - 1].x + 150, gy: clamp(gates[gates.length - 1].gy + rand(-60, 60), 40, H - 40 - gapH), done: false }); }
      if (p.y > H - 8 || p.y < 6) die();
      if (!deadT && ((!cfg.kite && passed >= goal) || (cfg.kite && t >= (cfg.duration || 12)))) api.submit({ passed, t });
      function die() { if (deadT) return; deadT = 0.6; api.sound.error(); api.fail(cfg.kite ? 'The kite came down. Up it goes again.' : 'Bonk. Try again.', { soft: true, suspicion: 1 }); }
    }, () => {
      const g = S.g;
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#cfe6ff'); gr.addColorStop(1, '#f4f9ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 4; i++) { const cx = ((i * 97 - t * 20) % (W + 60) + W + 60) % (W + 60) - 30; g.beginPath(); g.ellipse(cx, 30 + i * 40, 26, 9, 0, 0, 7); g.fill(); }
      for (const gg of gates) {
        g.fillStyle = C.blue; g.fillRect(gg.x, 0, 36, gg.gy); g.fillRect(gg.x, gg.gy + gapH, 36, H - gg.gy - gapH);
        g.fillStyle = C.blueD; g.fillRect(gg.x - 3, gg.gy - 10, 42, 10); g.fillRect(gg.x - 3, gg.gy + gapH, 42, 10);
      }
      g.fillStyle = '#93c572'; g.fillRect(0, H - 8, W, 8);
      g.save(); g.translate(p.x, p.y); g.rotate(clamp(p.vy / 600, -0.5, 0.6));
      if (cfg.sprite === 'verify') { rr(g, -26, -10, 52, 20, 2); g.fillStyle = C.blue; g.fill(); text(g, 'VERIFY', 0, 1, 10, C.white, 'center', 700); }
      else if (cfg.kite) { g.beginPath(); g.moveTo(0, -14); g.lineTo(11, 0); g.lineTo(0, 14); g.lineTo(-11, 0); g.closePath(); g.fillStyle = '#ff7043'; g.fill(); g.strokeStyle = '#bf360c'; g.stroke(); g.beginPath(); g.moveTo(0, 14); g.quadraticCurveTo(-10, 40, -40, H); g.strokeStyle = '#777'; g.stroke(); }
      else { g.beginPath(); g.moveTo(14, 0); g.lineTo(-12, -9); g.lineTo(-6, 0); g.lineTo(-12, 9); g.closePath(); g.fillStyle = C.white; g.fill(); g.strokeStyle = C.blueD; g.lineWidth = 1.5; g.stroke(); }
      g.restore();
      S.hud(cfg.kite ? `Keep it up: ${Math.max(0, Math.ceil((cfg.duration || 12) - t))}s` : `Gates ${passed} / ${goal}`, '');
      if (!started) overlay(g, W, H, `${TAP} to flap`, cfg.kite ? 'Keep the kite in the sky' : 'Glide through the gaps');
    });
  };

  // ================================================================== DODGE
  /* config: duration (15), item: emoji or 'popup' */
  G.dodge = (api, cfg) => {
    const W = 300, H = 230;
    const S = stage(api, { w: W, h: H, label: 'Dodge' });
    const dur = cfg.duration || 15;
    let px, items, t, spawn, started = false, bot = false, deadT = 0;
    const reset = () => { px = W / 2; items = []; t = 0; spawn = 0; };
    reset();
    const PW = 26, PY = H - 22;
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      const inp = S.input;
      if (inp.pressed || inp.moved || inp.keys.left || inp.keys.right) started = true;
      if (!started) return;
      if (deadT > 0) { deadT -= dt; if (deadT <= 0) reset(); return; }
      t += dt; spawn -= dt;
      if (spawn <= 0) { spawn = Math.max(0.28, 0.75 - t * 0.03); items.push({ x: rand(10, W - 44), y: -26, w: 34, h: 24, v: rand(95, 135) + t * 4 }); }
      for (const it of items) it.y += it.v * dt;
      items = items.filter((it) => it.y < H + 30);
      let target = px;
      if (bot) {
        let best = px, bestScore = -1e9;
        for (let x = PW / 2; x <= W - PW / 2; x += 8) {
          let danger = 0;
          for (const it of items) {
            const tHit = (PY - 10 - (it.y + it.h)) / it.v;
            if (tHit < -0.15 || tHit > 0.9) continue;
            if (x + PW / 2 + 6 > it.x && x - PW / 2 - 6 < it.x + it.w) danger += 1 / (Math.max(tHit, 0.02) + 0.05);
          }
          const score = -danger * 100 - Math.abs(x - px) * 0.2 - Math.abs(x - W / 2) * 0.05;
          if (score > bestScore) { bestScore = score; best = x; }
        }
        target = best;
      } else if (inp.keys.left || inp.keys.right) target = px + (inp.keys.right ? 1 : -1) * 40;
      else target = inp.x;
      px = clamp(px + clamp(target - px, -330 * dt, 330 * dt), PW / 2, W - PW / 2);
      for (const it of items) {
        if (px + PW / 2 - 3 > it.x && px - PW / 2 + 3 < it.x + it.w && PY + 7 > it.y && PY - 7 < it.y + it.h) {
          deadT = 0.6; api.sound.error();
          api.fail('A pop-up got you. Timer reset.', { soft: true, suspicion: 2 });
          break;
        }
      }
      if (!deadT && t >= dur) api.submit({ survived: t });
    }, () => {
      const g = S.g;
      bgGrid(g, W, H);
      for (const it of items) {
        rr(g, it.x, it.y, it.w, it.h, 3); g.fillStyle = C.white; g.fill(); g.strokeStyle = '#9aa0a6'; g.lineWidth = 1; g.stroke();
        g.fillStyle = cfg.item === 'ad' ? '#ffcc80' : '#e8eaed'; g.fillRect(it.x, it.y, it.w, 7);
        text(g, '✕', it.x + it.w - 5, it.y + 4, 7, C.ink);
        text(g, cfg.item === 'ad' ? 'AD' : '!!!', it.x + it.w / 2, it.y + 15, 8, C.red, 'center', 700);
      }
      checkbox(g, px - 9, PY - 9, 18);
      S.hud(`Survive: ${Math.max(0, Math.ceil(dur - t))}s`, '');
      if (!started) overlay(g, W, H, 'Move left and right', 'Dodge the falling pop-ups');
    });
  };

  // ================================================================== PONG
  /* config: mode 'vs' (first to config.to, 3) | 'coop' (keep a rally of config.rally hits); robotSpeed */
  G.pong = (api, cfg) => {
    const W = 300, H = 210;
    const S = stage(api, { w: W, h: H, label: 'Pong' });
    const coop = cfg.mode === 'coop';
    const PH = 46;
    let py = H / 2, ry = H / 2, ball, you = 0, robot = 0, rally = 0, started = false, bot = false, wait = 0.6;
    const serve = (dirX) => { const a = rand(-0.5, 0.5); ball = { x: W / 2, y: H / 2, vx: Math.cos(a) * 170 * dirX, vy: Math.sin(a) * 170 }; wait = 0.6; };
    serve(-1);
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      const inp = S.input;
      if (inp.pressed || inp.moved || inp.keys.up || inp.keys.down) started = true;
      if (!started) return;
      const predict = (xTarget) => { if ((xTarget - ball.x) / ball.vx < 0) return H / 2; let t = (xTarget - ball.x) / ball.vx, y = ball.y + ball.vy * t; while (y < 0 || y > H) y = y < 0 ? -y : 2 * H - y; return y; };
      if (bot) py += clamp(predict(16) - py, -380 * dt, 380 * dt);
      else if (inp.keys.up || inp.keys.down) py += (inp.keys.down ? 1 : -1) * 300 * dt;
      else py += clamp(inp.y - py, -700 * dt, 700 * dt);
      py = clamp(py, PH / 2, H - PH / 2);
      const rs = cfg.robotSpeed || (coop ? 360 : 150);
      const rt = ball.vx > 0 ? predict(W - 16) + (coop ? 0 : Math.sin(Date.now() / 300) * 18) : H / 2;
      ry = clamp(ry + clamp(rt - ry, -rs * dt, rs * dt), PH / 2, H - PH / 2);
      if (wait > 0) { wait -= dt; return; }
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.y < 5 || ball.y > H - 5) { ball.vy = -ball.vy; ball.y = clamp(ball.y, 5, H - 5); }
      const hit = (padY, side) => {
        const off = clamp((ball.y - padY) / (PH / 2), -1, 1);
        const sp = Math.min(Math.hypot(ball.vx, ball.vy) * 1.05, 330);
        ball.vx = side * Math.cos(off * 0.9) * sp; ball.vy = Math.sin(off * 0.9) * sp;
        if (coop) { rally++; api.sound.tone(500 + rally * 30, 0.05, 'square', 0.04); if (rally >= (cfg.rally || 10)) api.submit({ rally }); }
        else api.sound.tone(520, 0.05, 'square', 0.04);
      };
      if (ball.vx < 0 && ball.x < 18 && ball.x > 6 && Math.abs(ball.y - py) < PH / 2 + 5) { ball.x = 18; hit(py, 1); }
      if (ball.vx > 0 && ball.x > W - 18 && ball.x < W - 6 && Math.abs(ball.y - ry) < PH / 2 + 5) { ball.x = W - 18; hit(ry, -1); }
      if (ball.x < -10 || ball.x > W + 10) {
        if (coop) { rally = 0; api.fail('The rally dropped. Start again, together.', { soft: true, suspicion: 1 }); serve(-1); return; }
        if (ball.x > W) { you++; api.sound.success(); } else { robot++; api.sound.error(); }
        if (you >= (cfg.to || 3)) { api.submit({ you, robot }); return; }
        if (robot >= (cfg.to || 3)) { api.fail('The robot won this round. Rematch!', { soft: true, suspicion: 2 }); you = 0; robot = 0; }
        serve(ball.x > W ? 1 : -1);
      }
    }, () => {
      const g = S.g;
      g.fillStyle = '#20242c'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.2)'; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); g.setLineDash([]);
      rr(g, 8, py - PH / 2, 8, PH, 3); g.fillStyle = '#7cff9b'; g.fill();
      rr(g, W - 16, ry - PH / 2, 8, PH, 3); g.fillStyle = '#9db7e6'; g.fill();
      g.beginPath(); g.arc(ball.x, ball.y, 5, 0, 7); g.fillStyle = C.white; g.fill();
      if (coop) text(g, `Rally ${rally} / ${cfg.rally || 10}`, W / 2, 18, 14, C.white, 'center', 700);
      else { text(g, String(you), W / 2 - 30, 22, 22, '#7cff9b', 'center', 700); text(g, String(robot), W / 2 + 30, 22, 22, '#9db7e6', 'center', 700); }
      emoji(g, '🤖', W - 22, H - 14, 14);
      S.hud(coop ? 'Keep it going, together' : `First to ${cfg.to || 3}`, 'You ← · → Robot');
      if (!started) overlay(g, W, H, 'Move up and down to play', coop ? 'Co-op: keep the ball alive' : 'Beat the robot');
    });
  };

  // ================================================================== ROAD CROSSING
  /* config: lanes: array of rows top→bottom between goal and start: speed in cells/s (+right / -left) or 0 for a safe row */
  G.crossy = (api, cfg) => {
    const COLS = 9, CELL = 26;
    const lanesDef = cfg.lanes || [0, 2.2, -3, 0, 2.6, -1.8, 3.4, 0];
    const ROWS = lanesDef.length + 2, W = COLS * CELL, H = ROWS * CELL;
    const S = stage(api, { w: W, h: H, label: 'Road crossing' });
    const pad = dpad(api, S);
    const lanes = lanesDef.map((sp, i) => ({ sp, row: i + 1, cars: sp ? Array.from({ length: Math.abs(sp) > 2.8 ? 2 : 3 }, (_, k) => ({ x: (k * COLS) / (Math.abs(sp) > 2.8 ? 2 : 3) + rand(0, 1.2), len: Math.abs(sp) > 3 ? 1 : pick([1, 2]) })) : [] }));
    let px = 4, prow = ROWS - 1, started = false, bot = false, hopT = 0, deadT = 0;
    const carAt = (lane, x, dtAhead = 0) => lane.cars.some((c) => { const cx = ((c.x + lane.sp * dtAhead) % COLS + COLS) % COLS; for (const off of [0, COLS, -COLS]) if (x + 0.85 > cx + off && x + 0.15 < cx + off + c.len) return true; return false; });
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      let mv = S.input.swipe || pad.take();
      if (mv) started = true;
      if (!started) return;
      for (const l of lanes) for (const c of l.cars) c.x = ((c.x + l.sp * dt) % COLS + COLS) % COLS;
      if (deadT > 0) { deadT -= dt; if (deadT <= 0) { px = 4; prow = ROWS - 1; } return; }
      hopT -= dt;
      if (bot && hopT <= 0) {
        const up = lanes[prow - 2];
        const here = lanes[prow - 1];
        const safeUp = !up || !up.sp || (!carAt(up, px, 0) && !carAt(up, px, 0.35));
        const safeHere = !here || !here.sp || !carAt(here, px, 0.3);
        if (safeUp) mv = 'up';
        else if (!safeHere) { for (const d of ['left', 'right', 'down']) { const nx = px + (d === 'left' ? -1 : d === 'right' ? 1 : 0), nr = prow + (d === 'down' ? 1 : 0); const L = lanes[nr - 1]; if (nx >= 0 && nx < COLS && (!L || !L.sp || !carAt(L, nx, 0.3))) { mv = d; break; } } }
        hopT = 0.12;
      }
      if (mv) {
        if (mv === 'up') prow--; if (mv === 'down') prow = Math.min(ROWS - 1, prow + 1);
        if (mv === 'left') px = Math.max(0, px - 1); if (mv === 'right') px = Math.min(COLS - 1, px + 1);
        api.sound.tick();
      }
      if (prow <= 0) { api.submit({ crossed: true }); return; }
      const lane = lanes[prow - 1];
      if (lane && lane.sp && carAt(lane, px)) { deadT = 0.6; api.sound.error(); api.fail('Beep beep! Back to the start.', { soft: true, suspicion: 2 }); }
    }, () => {
      const g = S.g;
      for (let r = 0; r < ROWS; r++) {
        const L = lanes[r - 1];
        g.fillStyle = r === 0 ? '#a5d6a7' : r === ROWS - 1 ? '#c5e1a5' : L && L.sp ? '#5f6368' : '#d7ccc8';
        g.fillRect(0, r * CELL, W, CELL);
        if (L && L.sp) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(0, r * CELL + CELL - 1); g.lineTo(W, r * CELL + CELL - 1); g.stroke(); g.setLineDash([]); }
      }
      text(g, 'VERIFIED ZONE', W / 2, CELL / 2, 11, '#1b5e20', 'center', 700);
      for (const L of lanes) for (const c of L.cars) for (const off of [0, -COLS]) {
        const x = (c.x + off) * CELL; rr(g, x + 2, L.row * CELL + 4, c.len * CELL - 4, CELL - 8, 4);
        g.fillStyle = ['#ef5350', '#42a5f5', '#ffca28', '#ab47bc'][L.row % 4]; g.fill();
      }
      checkbox(g, px * CELL + 4, prow * CELL + 4, CELL - 8);
      S.hud('Reach the top', '');
      if (!started) overlay(g, W, H, 'Arrows, swipe, or the buttons', 'Cross the road to the verified zone');
      if (deadT > 0) { g.fillStyle = 'rgba(217,48,37,.2)'; g.fillRect(0, 0, W, H); }
    }, 60);
  };

  // ================================================================== STACK
  /* config: goal (layers, 8), label: 'block'|'widget' */
  G.stack = (api, cfg) => {
    const W = 240, H = 280;
    const S = stage(api, { w: W, h: H, label: 'Stack' });
    const goal = cfg.goal || 8, BH = 18;
    let layers, mover, dir, sp, started = false, bot = false, dropped = 0, deadT = 0;
    const reset = () => { layers = [{ x: 60, w: 120 }]; mover = { x: 0, w: 120 }; dir = 1; sp = 110; dropped = 0; };
    reset();
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      let drop = S.input.pressed;
      if (drop && !started) { started = true; drop = false; }
      if (!started) return;
      if (deadT > 0) { deadT -= dt; if (deadT <= 0) reset(); return; }
      mover.x += dir * sp * dt;
      if (mover.x < -mover.w * 0.5) { mover.x = -mover.w * 0.5; dir = 1; }
      if (mover.x + mover.w > W + mover.w * 0.5) { mover.x = W + mover.w * 0.5 - mover.w; dir = -1; }
      const top = layers[layers.length - 1];
      if (bot) drop = Math.abs(mover.x - top.x) < 2.5;
      if (drop) {
        const l = Math.max(mover.x, top.x), r = Math.min(mover.x + mover.w, top.x + top.w);
        if (r - l <= 4) { deadT = 0.7; api.sound.error(); api.fail('Missed the stack entirely. Rebuilding…', { soft: true, suspicion: 2 }); return; }
        layers.push({ x: l, w: r - l }); dropped++;
        api.sound.tone(400 + dropped * 50, 0.07, 'triangle', 0.08);
        if (dropped >= goal) { api.submit({ layers: dropped }); return; }
        mover = { x: dir > 0 ? -r + l : W, w: r - l }; sp += 12;
        if (dir > 0) mover.x = -mover.w * 0.4; else mover.x = W - mover.w * 0.6;
      }
    }, () => {
      const g = S.g;
      bgGrid(g, W, H);
      const camY = Math.max(0, layers.length - 9) * BH;
      const yOf = (i) => H - 20 - (i + 1) * BH + camY;
      layers.forEach((L, i) => { rr(g, L.x, yOf(i), L.w, BH - 2, 2); g.fillStyle = i === 0 ? '#9aa0a6' : `hsl(${215 + i * 6}, 70%, ${58 - i * 2}%)`; g.fill(); if (cfg.label === 'widget' && i > 0) text(g, '☑ verified', L.x + L.w / 2, yOf(i) + BH / 2, 8, C.white); });
      rr(g, mover.x, yOf(layers.length), mover.w, BH - 2, 2); g.fillStyle = C.green; g.fill();
      S.hud(`Stacked ${dropped} / ${goal}`, '');
      if (!started) overlay(g, W, H, `${TAP} to drop`, 'Stack them as straight as you can');
    });
  };

  // ================================================================== MAZE (drag the ball, don't touch the walls)
  /* config: cols (9), rows (7), lag (seconds of input delay), seed */
  G.maze = (api, cfg) => {
    const cols = cfg.cols || 9, rows = cfg.rows || 7, CELL = 32, W = cols * CELL, H = rows * CELL;
    const S = stage(api, { w: W, h: H, label: 'Maze' });
    // generate with DFS (walls: right & bottom per cell)
    const cell = Array.from({ length: cols * rows }, () => ({ r: true, b: true, v: false }));
    const id = (x, y) => y * cols + x;
    const stack = [[0, 0]]; cell[0].v = true;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < cols && ny < rows && !cell[id(nx, ny)].v);
      if (!nb.length) { stack.pop(); continue; }
      const [nx, ny] = pick(nb);
      if (nx > x) cell[id(x, y)].r = false; if (nx < x) cell[id(nx, ny)].r = false;
      if (ny > y) cell[id(x, y)].b = false; if (ny < y) cell[id(nx, ny)].b = false;
      cell[id(nx, ny)].v = true; stack.push([nx, ny]);
    }
    const segs = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const c = cell[id(x, y)];
      if (c.r && x < cols - 1) segs.push([(x + 1) * CELL, y * CELL, (x + 1) * CELL, (y + 1) * CELL]);
      if (c.b && y < rows - 1) segs.push([x * CELL, (y + 1) * CELL, (x + 1) * CELL, (y + 1) * CELL]);
    }
    segs.push([0, 0, W, 0], [0, H, W, H], [0, 0, 0, H], [W, 0, W, H]);
    const R = 6.5;
    const hitWall = (x, y) => segs.some(([x1, y1, x2, y2]) => {
      const dx = x2 - x1, dy = y2 - y1, t = clamp(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy), 0, 1);
      return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) < R + 1.5;
    });
    let ball = { x: CELL / 2, y: CELL / 2 }, dragging = false, started = false, bot = false, path = null, pi = 0, flash = 0;
    const queue = [];
    const reset = () => { ball = { x: CELL / 2, y: CELL / 2 }; dragging = false; queue.length = 0; };
    const solve = () => {
      const prev = { 0: -1 }, q = [0];
      while (q.length) {
        const i = q.shift(), x = i % cols, y = (i / cols) | 0;
        const moves = [];
        if (x < cols - 1 && !cell[i].r) moves.push(i + 1); if (x > 0 && !cell[i - 1].r) moves.push(i - 1);
        if (y < rows - 1 && !cell[i].b) moves.push(i + cols); if (y > 0 && !cell[i - cols].b) moves.push(i - cols);
        for (const m of moves) if (!(m in prev)) { prev[m] = i; q.push(m); }
      }
      const out = []; for (let i = cols * rows - 1; i !== -1; i = prev[i]) out.unshift(i);
      return out.map((i) => ({ x: (i % cols) * CELL + CELL / 2, y: ((i / cols) | 0) * CELL + CELL / 2 }));
    };
    api.setBot(() => { bot = true; started = true; path = solve(); pi = 0; });
    const lag = cfg.lag || 0;
    let clock = 0;
    run(api, S, (dt) => {
      const inp = S.input;
      clock += dt;
      if (flash > 0) flash -= dt;
      let target = null;
      if (bot) { if (path && pi < path.length) { target = path[pi]; if (Math.hypot(ball.x - target.x, ball.y - target.y) < 1) pi++; } }
      else {
        if (inp.pressed && Math.hypot(inp.x - ball.x, inp.y - ball.y) < 26) { dragging = true; started = true; }
        if (!inp.down) dragging = false;
        const kx = (inp.keys.right ? 1 : 0) - (inp.keys.left ? 1 : 0), ky = (inp.keys.down ? 1 : 0) - (inp.keys.up ? 1 : 0);
        if (kx || ky) { started = true; target = { x: ball.x + kx * 30, y: ball.y + ky * 30 }; }
        else if (dragging) target = { x: inp.x, y: inp.y };
      }
      if (lag && target && !bot) { queue.push({ t: clock, x: target.x, y: target.y }); while (queue.length > 1 && queue[1].t <= clock - lag) queue.shift(); target = queue[0].t <= clock - lag ? queue[0] : null; }
      if (!target) return;
      const sp = (inp.keys.left || inp.keys.right || inp.keys.up || inp.keys.down) && !bot ? 120 : 260;
      const dx = target.x - ball.x, dy = target.y - ball.y, d = Math.hypot(dx, dy);
      const stepLen = Math.min(d, sp * dt);
      if (stepLen < 0.01) return;
      const nx = ball.x + (dx / d) * stepLen, ny = ball.y + (dy / d) * stepLen;
      if (hitWall(nx, ny)) {
        flash = 0.4; api.sound.error(); reset();
        if (bot) pi = 0;
        api.fail(lag ? 'Lag got you. Back to the start.' : "You touched a wall. Mazes don't like that.", { soft: true, suspicion: 1 });
        return;
      }
      ball.x = nx; ball.y = ny;
      if (ball.x > W - CELL && ball.y > H - CELL) api.submit({ done: true });
    }, () => {
      const g = S.g;
      g.fillStyle = '#fbfcfe'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(31,157,85,.18)'; g.fillRect(W - CELL, H - CELL, CELL, CELL);
      text(g, '✓', W - CELL / 2, H - CELL / 2, 18, C.green, 'center', 700);
      g.strokeStyle = cfg.lag ? '#8e44ad' : C.ink; g.lineWidth = 3; g.lineCap = 'round';
      for (const [x1, y1, x2, y2] of segs) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
      g.beginPath(); g.arc(ball.x, ball.y, R, 0, 7); g.fillStyle = C.blue; g.fill();
      if (flash > 0) { g.fillStyle = `rgba(217,48,37,${flash})`; g.fillRect(0, 0, W, H); }
      S.hud(lag ? `Connection: ${Math.round(lag * 1000)} ms lag` : 'Drag the blue dot to ✓', 'Walls are off-limits');
      if (!started) overlay(g, W, H, 'Drag the blue dot (or use arrow keys)', 'Reach ✓ without touching a wall');
    });
  };

  // ================================================================== DARTS
  /* config: hits needed (2) out of throws (3), sway (amplitude) */
  G.darts = (api, cfg) => {
    const W = 260, H = 220;
    const S = stage(api, { w: W, h: H, label: 'Darts' });
    const need = cfg.hits || 2, throws = cfg.throws || 3, amp = cfg.sway || 70;
    let t = rand(0, 10), thrown = [], started = false, bot = false;
    const cx = W / 2, cy = H / 2;
    const cross = () => ({ x: cx + Math.sin(t * 1.7) * amp + Math.sin(t * 4.1) * 8, y: cy + Math.sin(t * 2.3 + 1) * amp * 0.75 });
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      let fire = S.input.pressed;
      if (fire && !started) { started = true; fire = false; }
      if (!started) return;
      t += dt;
      const c = cross();
      if (bot) fire = Math.hypot(c.x - cx, c.y - cy) < 6;
      if (fire && thrown.length < throws) {
        const d = Math.hypot(c.x - cx, c.y - cy);
        thrown.push({ x: c.x, y: c.y, hit: d < 15 });
        api.sound.tone(d < 15 ? 900 : 300, 0.08, 'triangle', 0.08);
        const hits = thrown.filter((q) => q.hit).length;
        if (hits >= need) { setTimeout(() => api.submit({ hits }), 300); return; }
        if (thrown.length >= throws) { setTimeout(() => { if (!api.isLocked()) { thrown = []; api.fail(`Only ${hits} bullseye${hits === 1 ? '' : 's'}. New darts!`, { soft: true, suspicion: 2 }); } }, 500); }
      }
    }, () => {
      const g = S.g;
      bgGrid(g, W, H);
      [[70, '#f4f6f8'], [52, C.blue], [34, '#f4f6f8'], [15, C.red]].forEach(([r, col]) => { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fillStyle = col; g.fill(); });
      thrown.forEach((q) => { g.beginPath(); g.arc(q.x, q.y, 3.5, 0, 7); g.fillStyle = q.hit ? C.green : C.ink; g.fill(); });
      const c = cross();
      g.strokeStyle = C.ink; g.lineWidth = 1.5; g.beginPath(); g.arc(c.x, c.y, 9, 0, 7); g.moveTo(c.x - 14, c.y); g.lineTo(c.x + 14, c.y); g.moveTo(c.x, c.y - 14); g.lineTo(c.x, c.y + 14); g.stroke();
      S.hud(`Bullseyes ${thrown.filter((q) => q.hit).length} / ${need}`, `Darts left ${throws - thrown.length}`);
      if (!started) overlay(g, W, H, `${TAP} to throw`, 'The crosshair sways. Time it.');
    });
  };

  // ================================================================== MINI GOLF
  /* config: hole {x,y}, ball {x,y}, walls: [[x,y,w,h]], par (strokes allowed, 3) */
  G.golf = (api, cfg) => {
    const W = 300, H = 220;
    const S = stage(api, { w: W, h: H, label: 'Mini golf' });
    const hole = cfg.hole || { x: 250, y: 60 }, start = cfg.ball || { x: 50, y: 170 }, walls = cfg.walls || [[140, 40, 16, 120]];
    const par = cfg.par || 3;
    let b, strokes = 0, aiming = false, aim = null, started = false, bot = false, botWait = 0;
    const reset = () => { b = { x: start.x, y: start.y, vx: 0, vy: 0, moving: false, sunk: false }; strokes = 0; };
    reset();
    const physics = (s, dt) => {
      s.x += s.vx * dt; s.y += s.vy * dt;
      const k = Math.pow(0.32, dt); s.vx *= k; s.vy *= k;
      if (s.x < 6) { s.x = 6; s.vx = Math.abs(s.vx); } if (s.x > W - 6) { s.x = W - 6; s.vx = -Math.abs(s.vx); }
      if (s.y < 6) { s.y = 6; s.vy = Math.abs(s.vy); } if (s.y > H - 6) { s.y = H - 6; s.vy = -Math.abs(s.vy); }
      for (const [x, y, w, hh] of walls) {
        if (s.x + 5 > x && s.x - 5 < x + w && s.y + 5 > y && s.y - 5 < y + hh) {
          const ox = Math.min(s.x + 5 - x, x + w - s.x + 5), oy = Math.min(s.y + 5 - y, y + hh - s.y + 5);
          if (ox < oy) { s.vx = -s.vx; s.x += s.x < x + w / 2 ? -ox : ox; } else { s.vy = -s.vy; s.y += s.y < y + hh / 2 ? -oy : oy; }
        }
      }
      const sp = Math.hypot(s.vx, s.vy);
      if (Math.hypot(s.x - hole.x, s.y - hole.y) < 8 && sp < 260) { s.sunk = true; s.vx = s.vy = 0; }
      if (sp < 6) { s.vx = s.vy = 0; s.moving = false; }
    };
    const shoot = (vx, vy) => { b.vx = vx; b.vy = vy; b.moving = true; strokes++; api.sound.tone(300, 0.06, 'triangle', 0.08); };
    const botShot = () => {
      let best = null;
      for (let a = 0; a < 360; a += 1.5) for (let p = 80; p <= 520; p += 30) {
        const s = { x: b.x, y: b.y, vx: Math.cos(a * Math.PI / 180) * p, vy: Math.sin(a * Math.PI / 180) * p, moving: true, sunk: false };
        for (let k = 0; k < 600 && s.moving && !s.sunk; k++) physics(s, 1 / 120);
        const d = s.sunk ? -1 : Math.hypot(s.x - hole.x, s.y - hole.y);
        if (!best || d < best.d) best = { d, vx: s.vx, a, p };
        if (d < 0) return [Math.cos(a * Math.PI / 180) * p, Math.sin(a * Math.PI / 180) * p];
      }
      return [Math.cos(best.a * Math.PI / 180) * best.p, Math.sin(best.a * Math.PI / 180) * best.p];
    };
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      const inp = S.input;
      if (b.moving) {
        physics(b, dt);
        if (b.sunk) { api.sound.success(); api.submit({ strokes }); return; }
        if (!b.moving && strokes >= par) { api.fail(`Out of strokes (par ${par}). Back to the tee.`, { soft: true, suspicion: 2 }); reset(); }
        return;
      }
      if (bot) { botWait -= dt; if (botWait <= 0) { botWait = 0.4; const [vx, vy] = botShot(); shoot(vx, vy); } return; }
      if (inp.pressed && Math.hypot(inp.x - b.x, inp.y - b.y) < 40) { aiming = true; started = true; }
      if (aiming) aim = { x: inp.x, y: inp.y };
      if (aiming && !inp.down) {
        aiming = false;
        const dx = b.x - aim.x, dy = b.y - aim.y, d = Math.min(Math.hypot(dx, dy), 110);
        if (d > 6) shoot((dx / Math.hypot(dx, dy)) * d * 4.8, (dy / Math.hypot(dx, dy)) * d * 4.8);
        aim = null;
      }
    }, () => {
      const g = S.g;
      g.fillStyle = '#7cb342'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < W; i += 30) g.fillRect(i, 0, 15, H);
      for (const [x, y, w, hh] of walls) { g.fillStyle = '#8d6e63'; g.fillRect(x, y, w, hh); g.fillStyle = '#6d4c41'; g.fillRect(x, y + hh - 3, w, 3); }
      g.beginPath(); g.arc(hole.x, hole.y, 8, 0, 7); g.fillStyle = '#1b1b1b'; g.fill();
      g.fillStyle = C.ink; g.fillRect(hole.x, hole.y - 28, 2, 28); g.fillStyle = C.red; g.beginPath(); g.moveTo(hole.x + 2, hole.y - 28); g.lineTo(hole.x + 16, hole.y - 23); g.lineTo(hole.x + 2, hole.y - 18); g.fill();
      if (aim) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + (b.x - aim.x), b.y + (b.y - aim.y)); g.stroke(); g.setLineDash([]); }
      if (!b.sunk) { g.beginPath(); g.arc(b.x, b.y, 5, 0, 7); g.fillStyle = C.white; g.fill(); g.strokeStyle = '#999'; g.stroke(); }
      S.hud(`Strokes ${strokes} / ${par}`, 'Drag back from the ball, release to putt');
      if (!started && !b.moving) overlay(g, W, H, 'Drag back from the ball and let go', 'Sink it within par');
    });
  };

  // ================================================================== LANDER
  /* config: gravity (70), fuel (100) */
  G.lander = (api, cfg) => {
    const W = 220, H = 270, PAD = H - 30;
    const S = stage(api, { w: W, h: H, label: 'Lander' });
    let s, started = false, bot = false, deadT = 0;
    const reset = () => { s = { y: 30, vy: 0, fuel: cfg.fuel || 100, thrust: false }; };
    reset();
    const grav = cfg.gravity || 70, TH = 170;
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      const inp = S.input;
      if (inp.pressed) started = true;
      if (!started) return;
      if (deadT > 0) { deadT -= dt; if (deadT <= 0) reset(); return; }
      let thrust = inp.down || inp.keys.up;
      if (bot) { const dist = PAD - (s.y + 16); const safeV = Math.sqrt(Math.max(0, 2 * (TH - grav) * dist * 0.75)) + 12; thrust = s.vy > Math.min(safeV, 140) || (dist < 20 && s.vy > 25); }
      s.thrust = thrust && s.fuel > 0;
      if (s.thrust) { s.vy -= TH * dt; s.fuel -= 24 * dt; }
      s.vy += grav * dt; s.y += s.vy * dt;
      if (s.y < 0) { s.y = 0; s.vy = 0; }
      if (s.y + 16 >= PAD) {
        if (s.vy < 45) { api.sound.success(); api.submit({ vy: s.vy }); }
        else { deadT = 0.8; api.sound.error(); api.fail(`Touchdown at ${Math.round(s.vy)} px/s. Too fast! (under 45 is safe)`, { soft: true, suspicion: 2 }); s.vy = 0; s.y = PAD - 16; }
      }
    }, () => {
      const g = S.g;
      g.fillStyle = '#10141c'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 30; i++) g.fillRect((i * 73) % W, (i * 41) % (H - 50), 1.5, 1.5);
      g.fillStyle = '#9e9e9e'; g.fillRect(0, PAD, W, H - PAD); g.fillStyle = C.green; g.fillRect(W / 2 - 34, PAD - 3, 68, 4);
      checkbox(g, W / 2 - 8, s.y, 16, 0, deadT <= 0);
      if (s.thrust) { g.fillStyle = '#ffab40'; g.beginPath(); g.moveTo(W / 2 - 5, s.y + 17); g.lineTo(W / 2, s.y + 26 + Math.random() * 8); g.lineTo(W / 2 + 5, s.y + 17); g.fill(); }
      g.fillStyle = '#333'; g.fillRect(10, 10, 60, 6); g.fillStyle = s.fuel > 25 ? C.green : C.red; g.fillRect(10, 10, 60 * Math.max(0, s.fuel) / (cfg.fuel || 100), 6);
      text(g, 'fuel', 76, 13, 9, '#bbb', 'left');
      text(g, `${Math.round(s.vy)} px/s`, W - 10, 13, 10, s.vy < 45 ? '#7cff9b' : '#ff8a80', 'right');
      S.hud('Hold to thrust', 'Land slower than 45');
      if (!started) overlay(g, W, H, 'Hold to fire the thruster', 'Land gently on the green pad');
    });
  };

  // ================================================================== RHYTHM (3 lanes)
  /* config: bpm (100), pattern: [[beat, lane]...], need (fraction, 0.8) */
  G.rhythm = (api, cfg) => {
    const W = 240, H = 270, LINE = H - 46;
    const S = stage(api, { w: W, h: H, label: 'Rhythm', onKey: (e, down) => {
      if (!down || e.repeat) return;
      const map = { a: 0, s: 1, d: 2, j: 0, k: 1, l: 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 };
      const k = map[e.key] ?? map[e.key && e.key.toLowerCase()];
      if (k !== undefined) { keyLane = k; started = true; }
    } });
    const spb = 60 / (cfg.bpm || 100), TRAVEL = 1.4;
    const pattern = cfg.pattern || [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0], [5, 0], [6, 2], [7, 1], [8, 0], [9, 1], [10, 2], [10.5, 2], [11, 1], [12, 0], [13, 2], [14, 1], [15, 0], [16, 1]];
    const NOTES = [392, 523, 659];
    let notes, t, started = false, bot = false, keyLane = null, hits = 0, miss = 0, flashL = [0, 0, 0], ended = false;
    const reset = () => { notes = pattern.map(([b, l]) => ({ time: 2 + b * spb, lane: l, state: 0 })); t = 0; hits = 0; miss = 0; ended = false; };
    reset();
    api.setBot(() => { bot = true; started = true; });
    let beatT = 0;
    run(api, S, (dt) => {
      const inp = S.input;
      let lane = keyLane; keyLane = null;
      if (inp.tap) { lane = Math.min(2, Math.floor(inp.tap.x / (W / 3))); started = true; }
      if (!started) return;
      t += dt; beatT += dt;
      if (beatT >= spb) { beatT -= spb; api.sound.tone(1200, 0.02, 'square', 0.02); }
      if (bot) { const n = notes.find((q) => q.state === 0 && Math.abs(q.time - t) < 0.015); if (n) lane = n.lane; }
      if (lane !== null && lane !== undefined) {
        flashL[lane] = 0.15;
        const n = notes.filter((q) => q.state === 0 && q.lane === lane && Math.abs(q.time - t) < 0.14).sort((a, b) => Math.abs(a.time - t) - Math.abs(b.time - t))[0];
        if (n) { n.state = 1; hits++; api.sound.tone(NOTES[lane], 0.18, 'triangle', 0.12); } else api.sound.tone(150, 0.05, 'square', 0.03);
      }
      for (const n of notes) if (n.state === 0 && t > n.time + 0.16) { n.state = 2; miss++; }
      flashL = flashL.map((f) => Math.max(0, f - dt));
      if (!ended && t > notes[notes.length - 1].time + 0.6) {
        ended = true;
        const acc = hits / notes.length;
        if (acc >= (cfg.need || 0.8)) api.submit({ acc });
        else { api.fail(`Accuracy ${Math.round(acc * 100)}%. You need ${Math.round((cfg.need || 0.8) * 100)}%. From the top!`, { soft: true, suspicion: 2 }); reset(); }
      }
    }, () => {
      const g = S.g;
      g.fillStyle = '#1d2230'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) { g.fillStyle = flashL[i] > 0 ? 'rgba(124,255,155,.18)' : i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)'; g.fillRect(i * W / 3, 0, W / 3, H); }
      g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(0, LINE, W, 3);
      for (const n of notes) {
        if (n.state === 1) continue;
        const y = LINE - ((n.time - t) / TRAVEL) * LINE;
        if (y < -20 || y > H + 20) continue;
        const x = n.lane * W / 3 + W / 6;
        g.beginPath(); g.arc(x, y, 14, 0, 7); g.fillStyle = n.state === 2 ? '#555' : ['#ff6b81', '#7cff9b', '#6bb6ff'][n.lane]; g.fill();
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.stroke();
      }
      ['A / J / ←', 'S / K / ↓', 'D / L / →'].forEach((k, i) => text(g, k, i * W / 3 + W / 6, H - 20, 10, 'rgba(255,255,255,.6)'));
      S.hud(`Hits ${hits} / ${notes.length}`, `Missed ${miss}`);
      if (!started) overlay(g, W, H, 'Tap a lane as each note hits the line', 'Keys: A S D (or J K L, or arrows)');
    });
  };

  // ================================================================== SHOOTER (spam filter)
  /* config: goal (15), maxMissed (3), enemy emoji, guard (draw the robot at the bottom) */
  G.shooter = (api, cfg) => {
    const W = 260, H = 270;
    const S = stage(api, { w: W, h: H, label: 'Spam filter' });
    const goal = cfg.goal || 15, maxMissed = cfg.maxMissed || 3;
    let px, bullets, enemies, shotT, spawnT, kills, missed, started = false, bot = false;
    const reset = () => { px = W / 2; bullets = []; enemies = []; shotT = 0; spawnT = 0.4; kills = 0; missed = 0; };
    reset();
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      const inp = S.input;
      if (inp.pressed || inp.moved || inp.keys.left || inp.keys.right) started = true;
      if (!started) return;
      let target = px;
      if (bot) { const e = enemies.slice().sort((a, b) => b.y - a.y)[0]; if (e) target = e.x + (e.vx || 0) * 0.3; }
      else if (inp.keys.left || inp.keys.right) target = px + (inp.keys.right ? 1 : -1) * 40;
      else target = inp.x;
      px = clamp(px + clamp(target - px, -300 * dt, 300 * dt), 14, W - 14);
      shotT -= dt;
      if (shotT <= 0) { shotT = 0.24; bullets.push({ x: px, y: H - 40 }); }
      spawnT -= dt;
      if (spawnT <= 0) { spawnT = Math.max(0.55, 1.1 - kills * 0.03); enemies.push({ x: rand(16, W - 16), y: -14, v: rand(38, 58) + kills * 1.5, vx: rand(-20, 20) }); }
      for (const b of bullets) b.y -= 380 * dt;
      for (const e of enemies) { e.y += e.v * dt; e.x = clamp(e.x + e.vx * dt, 12, W - 12); if (e.x <= 12 || e.x >= W - 12) e.vx = -e.vx; }
      for (const e of enemies) for (const b of bullets) if (!e.dead && !b.dead && Math.abs(b.x - e.x) < 13 && Math.abs(b.y - e.y) < 13) { e.dead = b.dead = true; kills++; api.sound.tone(700 + rand(0, 300), 0.05, 'square', 0.04); }
      for (const e of enemies) if (!e.dead && e.y > H - 30) { e.dead = true; missed++; api.sound.error(); if (missed >= maxMissed) { api.fail(cfg.guard ? 'Too much spam reached the robot. Again!' : 'Your inbox is overflowing. Starting over.', { soft: true, suspicion: 2 }); reset(); return; } }
      bullets = bullets.filter((b) => !b.dead && b.y > -10);
      enemies = enemies.filter((e) => !e.dead);
      if (kills >= goal) api.submit({ kills });
    }, () => {
      const g = S.g;
      g.fillStyle = '#0f1724'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 25; i++) g.fillRect((i * 53) % W, (i * 37 + Date.now() / 30) % H, 1, 2);
      for (const e of enemies) emoji(g, cfg.enemy || '📧', e.x, e.y, 20);
      g.fillStyle = '#7cff9b'; for (const b of bullets) g.fillRect(b.x - 1.5, b.y - 6, 3, 8);
      if (cfg.guard) emoji(g, '🤖', W / 2, H - 12, 18);
      g.fillStyle = C.white; g.beginPath(); g.moveTo(px, H - 50); g.lineTo(px + 12, H - 32); g.lineTo(px - 12, H - 32); g.closePath(); g.fill();
      S.hud(`Filtered ${kills} / ${goal}`, `Got through ${missed} / ${maxMissed}`);
      if (!started) overlay(g, W, H, 'Move to aim. It fires by itself.', cfg.guard ? 'Protect the robot from the spam' : 'Filter the spam before it lands');
    });
  };

  // ================================================================== WHACK
  /* config: goal (10), good (emoji to whack), bad (emoji to spare), up (seconds visible) */
  G.whack = (api, cfg) => {
    const W = 270, H = 230;
    const S = stage(api, { w: W, h: H, label: 'Whack' });
    const goal = cfg.goal || 10, good = cfg.good || '🤖', bad = cfg.bad || '🙂';
    const holes = Array.from({ length: 9 }, (_, i) => ({ x: 45 + (i % 3) * 90, y: 50 + Math.floor(i / 3) * 70, who: null, t: 0, hit: 0 }));
    let score = 0, spawn = 0.3, started = false, bot = false;
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      const inp = S.input;
      let tap = inp.tap;
      if (tap && !started) { started = true; tap = null; }
      if (!started) return;
      spawn -= dt;
      if (spawn <= 0) {
        spawn = rand(0.35, 0.65);
        const free = holes.filter((q) => !q.who);
        if (free.length) { const q = pick(free); q.who = Math.random() < 0.7 ? 'good' : 'bad'; q.t = cfg.up || rand(0.75, 1.05); }
      }
      for (const q of holes) { if (q.who) { q.t -= dt; if (q.t <= 0) q.who = null; } q.hit = Math.max(0, q.hit - dt); }
      if (bot) { const q = holes.find((x) => x.who === 'good' && x.t < 0.6); if (q) tap = { x: q.x, y: q.y }; }
      if (tap) {
        const q = holes.find((x) => Math.hypot(tap.x - x.x, tap.y - x.y) < 34);
        if (q && q.who) {
          q.hit = 0.25;
          if (q.who === 'good') { score++; api.sound.tone(600 + score * 40, 0.06, 'square', 0.05); }
          else { score = Math.max(0, score - 3); api.fail(cfg.badMsg || "That was a human! Don't whack humans. (−3)", { soft: true, suspicion: 2 }); }
          q.who = null;
          if (score >= goal) api.submit({ score });
        }
      }
    }, () => {
      const g = S.g;
      g.fillStyle = '#e8f5e9'; g.fillRect(0, 0, W, H);
      for (const q of holes) {
        g.fillStyle = '#5d4037'; g.beginPath(); g.ellipse(q.x, q.y + 18, 30, 10, 0, 0, 7); g.fill();
        if (q.who) emoji(g, q.who === 'good' ? good : bad, q.x, q.y + 2, 34);
        if (q.hit > 0) text(g, '💥', q.x, q.y, 28);
      }
      S.hud(`Whacked ${score} / ${goal}`, `Spare the ${bad}`);
      if (!started) overlay(g, W, H, `${TAP === 'Tap' ? 'Tap' : 'Click'} the ${good} only`, `Leave the ${bad} alone`);
    });
  };

  // ================================================================== BALANCE
  /* config: duration (12) */
  G.balance = (api, cfg) => {
    const W = 300, H = 200;
    const S = stage(api, { w: W, h: H, label: 'Balance' });
    const dur = cfg.duration || 12, HALF = 110;
    let s, v, ang, t, started = false, bot = false, deadT = 0;
    const reset = () => { s = rand(-10, 10); v = 0; ang = 0; t = 0; };
    reset();
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      const inp = S.input;
      if (inp.pressed || inp.moved || inp.keys.left || inp.keys.right) started = true;
      if (!started) return;
      if (deadT > 0) { deadT -= dt; if (deadT <= 0) reset(); return; }
      t += dt;
      let targetAng;
      if (bot) targetAng = clamp(-(s * 0.006 + v * 0.012), -0.35, 0.35);
      else if (inp.keys.left || inp.keys.right) targetAng = ang + ((inp.keys.right ? 1 : 0) - (inp.keys.left ? 1 : 0)) * 0.05;
      else targetAng = clamp(((inp.x - W / 2) / (W / 2)) * 0.35, -0.35, 0.35);
      ang += clamp(targetAng - ang, -2 * dt, 2 * dt);
      ang = clamp(ang, -0.35, 0.35);
      if (Math.random() < dt * 0.9) v += rand(-35, 35);
      v += 380 * Math.sin(ang) * dt; v *= Math.pow(0.85, dt); s += v * dt;
      if (Math.abs(s) > HALF) { deadT = 0.7; api.sound.error(); api.fail('It rolled off. Steady does it.', { soft: true, suspicion: 1 }); }
      else if (t >= dur) api.submit({ t });
    }, () => {
      const g = S.g;
      bgGrid(g, W, H);
      const cx = W / 2, cy = 130;
      g.fillStyle = '#9aa0a6'; g.beginPath(); g.moveTo(cx - 14, cy + 50); g.lineTo(cx + 14, cy + 50); g.lineTo(cx, cy + 4); g.fill();
      g.save(); g.translate(cx, cy); g.rotate(ang);
      rr(g, -HALF - 6, -4, (HALF + 6) * 2, 8, 3); g.fillStyle = C.ink; g.fill();
      g.beginPath(); g.arc(clamp(s, -HALF - 20, HALF + 20), -13, 9, 0, 7); g.fillStyle = C.blue; g.fill();
      g.restore();
      S.hud(`Stay balanced: ${Math.max(0, Math.ceil(dur - t))}s`, 'Move left / right to tilt');
      if (!started) overlay(g, W, H, 'Move your pointer (or ← →) to tilt', 'Keep the ball on the beam');
    });
  };

  // ================================================================== TIMING METER (fishing, stone skipping, watering)
  /* config: need (successes in a row, 3), theme: 'fish'|'stone'|'water', speed */
  G.meter = (api, cfg) => {
    const W = 300, H = 170;
    const S = stage(api, { w: W, h: H, label: 'Timing' });
    const need = cfg.need || 3;
    const TH = { fish: ['🎣', '🐟', 'Reel in when the marker is in the green'], stone: ['🪨', '💦', 'Throw when the marker is in the green'], water: ['🚿', '🌱', 'Water when the marker is in the green'] }[cfg.theme || 'fish'];
    let t = 0, ok = 0, zoneW = 0.26, zoneC = rand(0.3, 0.7), started = false, bot = false, pop = 0;
    api.setBot(() => { bot = true; started = true; });
    run(api, S, (dt) => {
      let act = S.input.pressed;
      if (act && !started) { started = true; act = false; }
      if (!started) return;
      t += dt * (cfg.speed || 1) * (1 + ok * 0.25);
      pop = Math.max(0, pop - dt);
      const m = (Math.sin(t * 2.6) + 1) / 2;
      if (bot) act = Math.abs(m - zoneC) < zoneW * 0.15;
      if (act) {
        if (Math.abs(m - zoneC) <= zoneW / 2) { ok++; pop = 0.5; api.sound.tone(600 + ok * 120, 0.1, 'triangle', 0.1); zoneW *= 0.8; zoneC = rand(0.2, 0.8); if (ok >= need) api.submit({ ok }); }
        else { ok = 0; zoneW = 0.26; api.fail(cfg.theme === 'water' ? 'Oops, too much (or too little) water. Again!' : cfg.theme === 'stone' ? 'Plop. It sank. Try again.' : 'It got away! Try again.', { soft: true, suspicion: 1 }); }
      }
    }, () => {
      const g = S.g;
      g.fillStyle = cfg.theme === 'water' ? '#f1f8e9' : '#e3f2fd'; g.fillRect(0, 0, W, H);
      if (cfg.theme !== 'water') { g.fillStyle = '#90caf9'; g.fillRect(0, 70, W, H - 70); }
      emoji(g, TH[0], 50, 50, 34);
      for (let i = 0; i < need; i++) emoji(g, i < ok ? TH[1] : '·', 130 + i * 36, 52, i < ok ? 26 : 22);
      const bx = 20, bw = W - 40, by = 120;
      rr(g, bx, by, bw, 18, 9); g.fillStyle = '#eceff1'; g.fill();
      g.fillStyle = 'rgba(31,157,85,.7)'; g.fillRect(bx + (zoneC - zoneW / 2) * bw, by, zoneW * bw, 18);
      const m = (Math.sin(t * 2.6) + 1) / 2;
      g.fillStyle = C.ink; g.fillRect(bx + m * bw - 2, by - 6, 4, 30);
      if (pop > 0) text(g, 'Nice!', W / 2, 95, 16, C.green, 'center', 700);
      S.hud(`${ok} / ${need} in a row`, '');
      if (!started) overlay(g, W, H, `${TAP} at the right moment`, TH[2]);
    });
  };

  Challenges.arcade = {
    games: G,
    render(api) {
      const cfg = api.level.config || {};
      api.showVerify(false);
      const game = G[cfg.game];
      if (!game) throw new Error('Unknown arcade game ' + cfg.game);
      game(api, cfg);
    },
  };
})();
