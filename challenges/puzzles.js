/* puzzle — DOM puzzles and UI gags. config.game picks one; each documents its config.
 * Like the arcade games, every puzzle registers a bot (api.setBot) that solves it with
 * the same actions a player has, so automated tests can prove it is solvable.
 */
(function () {
  'use strict';
  const { h, clamp, rand, randInt, pick, shuffle } = U;
  const P = {};
  const photo = (src) => ART.photo({ src });

  // ------------------------------------------------------------------ rotate the photo upright
  /* config: src (photo) */
  P.rotate = (api, cfg) => {
    let angle = pick([60, 90, 120, 150, 180, 210, 240, 270, 300]);
    const img = h('div', { class: 'rot-img', html: photo(cfg.src) });
    const ring = h('div', { class: 'rot-ring' }, img);
    const left = h('button', { class: 'choice-btn rot-btn', type: 'button', 'aria-label': 'Rotate left' }, '↺');
    const right = h('button', { class: 'choice-btn rot-btn', type: 'button', 'aria-label': 'Rotate right' }, '↻');
    const turn = (d) => { angle = (angle + d + 360) % 360; img.style.transform = `rotate(${angle}deg)`; api.sound.click(); api.clearError(); };
    left.addEventListener('click', () => turn(-30)); right.addEventListener('click', () => turn(30));
    img.style.transform = `rotate(${angle}deg)`;
    api.body.appendChild(h('div', { class: 'rot-wrap' }, ring, h('div', { class: 'rot-ctrls' }, left, right)));
    api.setAnswer(() => ({ angle }));
    api.setBot(() => { while (angle !== 0) turn(30); api.verify(); });
  };

  // ------------------------------------------------------------------ count things
  /* config: target emoji, others [emoji], min, max, drift (bool) */
  P.count = (api, cfg) => {
    const n = randInt(cfg.min || 5, cfg.max || 9);
    const field = h('div', { class: 'count-field' + (cfg.drift ? ' drift' : '') });
    const items = shuffle([...Array(n).fill(cfg.target), ...Array(cfg.noise || 14).fill(0).map(() => pick(cfg.others))]);
    const cells = shuffle(Array.from({ length: 48 }, (_, i) => i)).slice(0, items.length);
    items.forEach((e, i) => {
      const c = cells[i];
      field.appendChild(h('span', { class: 'count-item', style: { left: (c % 8) * 12.2 + rand(1, 4) + '%', top: Math.floor(c / 8) * 16 + rand(1, 5) + '%', animationDelay: rand(0, 3) + 's', fontSize: rand(22, 30) + 'px' } }, e));
    });
    const opts = shuffle([n - 1, n, n + 1, n + 2].filter((x) => x > 0));
    const row = h('div', { class: 'choice-options grid count-opts' });
    opts.forEach((v) => { const b = h('button', { class: 'choice-btn', type: 'button' }, String(v)); b.addEventListener('click', () => api.submit({ n, pick: v })); row.appendChild(b); });
    api.showVerify(false);
    api.body.append(field, row);
    api.setBot(() => api.submit({ n, pick: n }));
  };

  // ------------------------------------------------------------------ connect the dots
  /* config: points [[x,y] in 0–100] (drawn in order) */
  P.dots = (api, cfg) => {
    api.showVerify(false);
    const pts = cfg.points;
    const svg = h('div', { class: 'dots-svg' });
    const field = h('div', { class: 'dots-field' }, svg);
    let next = 0;
    const lines = [];
    const draw = () => { svg.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${lines.map(([x, y]) => x + ',' + y).join(' ')}" fill="none" stroke="#3f7fe0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`; };
    const btns = pts.map(([x, y], i) => {
      const b = h('button', { class: 'dot', type: 'button', style: { left: x + '%', top: y + '%' }, 'aria-label': 'Dot ' + (i + 1) }, String(i + 1));
      b.addEventListener('click', () => {
        if (api.isLocked()) return;
        if (i !== next) { api.fail(`That's dot ${i + 1}. Looking for ${next + 1}.`, { soft: true, suspicion: 2 }); next = 0; lines.length = 0; btns.forEach((q) => q.classList.remove('done')); draw(); return; }
        b.classList.add('done'); lines.push([x, y]); next++; draw(); api.sound.tone(500 + next * 30, 0.05, 'triangle', 0.06);
        if (next === pts.length) { lines.push(pts[0]); draw(); field.classList.add('complete'); api.after(400, () => api.submit({ done: true })); }
      });
      field.appendChild(b);
      return b;
    });
    api.body.appendChild(field);
    api.setBot(() => btns.forEach((b) => b.click()));
  };

  // ------------------------------------------------------------------ swap jigsaw (tap two pieces to swap)
  /* config: src (photo), n (3) */
  P.swap = (api, cfg) => {
    api.showVerify(false);
    const n = cfg.n || 3, N = n * n;
    let order;
    do { order = shuffle(Array.from({ length: N }, (_, i) => i)); } while (order.every((v, i) => v === i));
    const grid = h('div', { class: 'grid swap-grid', style: { gridTemplateColumns: `repeat(${n}, 1fr)` } });
    let sel = null;
    const tiles = Array.from({ length: N }, (_, pos) => {
      const t = h('button', { class: 'tile swap-tile', type: 'button', 'aria-label': 'Piece ' + (pos + 1) });
      t.addEventListener('click', () => {
        if (api.isLocked()) return;
        if (sel === null) { sel = pos; t.classList.add('picked'); api.sound.click(); return; }
        tiles[sel].classList.remove('picked');
        if (sel !== pos) { [order[sel], order[pos]] = [order[pos], order[sel]]; paint(); api.sound.pop(); }
        sel = null;
        if (order.every((v, i) => v === i)) { grid.classList.add('solved'); api.after(350, () => api.submit({ done: true })); }
      });
      grid.appendChild(t);
      return t;
    });
    const paint = () => tiles.forEach((t, pos) => {
      const v = order[pos], r = Math.floor(v / n), c = v % n;
      t.innerHTML = `<div class="tile-img"><div class="split-inner" style="width:${n * 100}%;height:${n * 100}%;left:${-c * 100}%;top:${-r * 100}%">${photo(cfg.src)}</div></div>`;
    });
    paint();
    api.body.append(h('p', { class: 'muted center small' }, 'Tap one piece, then another, to swap them.'), grid);
    api.setBot(() => { for (let i = 0; i < N; i++) if (order[i] !== i) { const j = order.indexOf(i); tiles[i].click(); tiles[j].click(); } });
  };

  // ------------------------------------------------------------------ memory pairs
  /* config: items [photo src | emoji], kind: 'photo'|'emoji' */
  P.pairs = (api, cfg) => {
    api.showVerify(false);
    const deck = shuffle([...cfg.items, ...cfg.items]);
    const cols = deck.length > 12 ? 4 : deck.length > 8 ? 4 : 3;
    const grid = h('div', { class: 'grid pairs-grid', style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } });
    let open = [], matched = 0, moves = 0, busy = false;
    const cards = deck.map((it, i) => {
      const face = cfg.kind === 'photo' ? photo(it) : `<span class="pair-emoji">${it}</span>`;
      const c = h('button', { class: 'tile pair-card', type: 'button', 'aria-label': 'Card ' + (i + 1), html: `<div class="pc-back">?</div><div class="pc-face">${face}</div>` });
      c.addEventListener('click', () => {
        if (busy || api.isLocked() || c.classList.contains('up')) return;
        c.classList.add('up'); open.push(i); api.sound.click();
        if (open.length === 2) {
          moves++;
          const [a, b] = open;
          if (deck[a] === deck[b]) { cards[a].classList.add('matched'); cards[b].classList.add('matched'); open = []; matched++; api.sound.tone(700, 0.08, 'triangle', 0.07); if (matched === cfg.items.length) api.after(400, () => api.submit({ moves })); }
          else { busy = true; api.after(750, () => { cards[a].classList.remove('up'); cards[b].classList.remove('up'); open = []; busy = false; }); }
        }
      });
      grid.appendChild(c);
      return c;
    });
    api.body.appendChild(grid);
    api.setBot(() => {
      const done = new Set();
      deck.forEach((v, i) => { if (done.has(i)) return; const j = deck.findIndex((w, k) => k !== i && w === v && !done.has(k)); done.add(i); done.add(j); cards[i].click(); cards[j].click(); });
    });
  };

  // ------------------------------------------------------------------ shell game
  /* config: swaps (7), speed (ms per swap, 420) */
  P.cups = (api, cfg) => {
    api.showVerify(false);
    const stage = h('div', { class: 'cups' });
    const status = h('div', { class: 'cups-status' }, 'Watch the checkmark…');
    api.body.append(status, stage);
    const slots = [16.6, 50, 83.3];
    let cups, ballCup, ready = false;
    const build = () => {
      stage.innerHTML = '';
      ballCup = randInt(0, 2);
      cups = [0, 1, 2].map((i) => {
        const el = h('button', { class: 'cup', type: 'button', 'aria-label': 'Cup', style: { left: slots[i] + '%' } }, h('span', { class: 'cup-shape' }));
        el.addEventListener('click', () => choose(i));
        stage.appendChild(el);
        return { el, slot: i };
      });
      const ball = h('span', { class: 'cup-ball' }, '✓');
      cups[ballCup].el.appendChild(ball);
      cups.forEach((c) => c.el.classList.add('lifted'));
      ready = false;
      status.textContent = 'Watch the checkmark…';
      api.after(1100, () => {
        cups.forEach((c) => c.el.classList.remove('lifted'));
        let k = 0;
        const sp = cfg.speed || 420;
        const doSwap = () => {
          if (k++ >= (cfg.swaps || 7)) { ready = true; status.textContent = 'Which cup has the checkmark?'; return; }
          const [a, b] = shuffle([0, 1, 2]).slice(0, 2);
          [cups[a].slot, cups[b].slot] = [cups[b].slot, cups[a].slot];
          cups[a].el.style.left = slots[cups[a].slot] + '%'; cups[b].el.style.left = slots[cups[b].slot] + '%';
          api.sound.tick();
          api.after(sp, doSwap);
        };
        api.after(400, doSwap);
      });
    };
    const choose = (i) => {
      if (!ready || api.isLocked()) return;
      ready = false;
      cups.forEach((c) => c.el.classList.add('lifted'));
      if (i === ballCup) api.after(500, () => api.submit({ right: true }));
      else { api.fail('Empty! The checkmark was somewhere else.', { soft: true, suspicion: 2 }); api.after(1300, build); }
    };
    cups && cups.forEach((c) => c.el.style.setProperty('--sp', (cfg.speed || 420) + 'ms'));
    build();
    stage.style.setProperty('--sp', (cfg.speed || 420) + 'ms');
    api.setBot(() => { const t = api.every(100, () => { if (ready) { clearInterval(t); choose(ballCup); } }); });
  };

  // ------------------------------------------------------------------ colour mixer
  /* config: target [r,g,b] (random if absent), any (every colour passes), tolerance (40) */
  P.mixer = (api, cfg) => {
    const target = cfg.any ? null : cfg.target || [randInt(30, 230), randInt(30, 230), randInt(30, 230)];
    const val = [128, 128, 128];
    const mine = h('div', { class: 'swatch-big' });
    const tgt = target ? h('div', { class: 'swatch-big', style: { background: `rgb(${target})` } }) : null;
    const rows = ['R', 'G', 'B'].map((ch, i) => {
      const inp = h('input', { type: 'range', min: '0', max: '255', value: '128', class: 'mix-range mix-' + ch, 'aria-label': ch });
      inp.addEventListener('input', () => { val[i] = Number(inp.value); paint(); api.clearError(); });
      return { inp, el: h('label', { class: 'mix-row' }, h('b', null, ch), inp) };
    });
    const paint = () => { mine.style.background = `rgb(${val})`; };
    paint();
    api.body.appendChild(h('div', { class: 'mixer' },
      h('div', { class: 'mix-swatches' }, tgt ? h('div', null, tgt, h('small', null, 'Target')) : null, h('div', null, mine, h('small', null, target ? 'Yours' : 'Your mood'))),
      rows.map((r) => r.el)));
    api.setAnswer(() => ({ rgb: val.slice(), dist: target ? Math.hypot(val[0] - target[0], val[1] - target[1], val[2] - target[2]) : 0 }));
    api.setBot(() => { rows.forEach((r, i) => { r.inp.value = target ? target[i] : 200; r.inp.dispatchEvent(new Event('input')); }); api.verify(); });
  };

  // ------------------------------------------------------------------ set the clock
  /* config: time 'h:mm' */
  P.clock = (api, cfg) => {
    const [th, tm] = cfg.time.split(':').map(Number);
    const target = ((th % 12) * 60 + tm) % 720;
    let mins = (target + pick([95, 200, 315, 430, 505])) % 720;
    const face = h('div', { class: 'clock-face' });
    const hourH = h('div', { class: 'hand hour' }), minH = h('div', { class: 'hand minute' });
    for (let i = 1; i <= 12; i++) face.appendChild(h('span', { class: 'clock-num', style: { transform: `rotate(${i * 30}deg) translate(0, -78px) rotate(${-i * 30}deg)` } }, String(i)));
    face.append(hourH, minH, h('div', { class: 'clock-pin' }));
    const readout = h('div', { class: 'clock-readout' });
    const paint = () => {
      minH.style.transform = `rotate(${(mins % 60) * 6}deg)`; hourH.style.transform = `rotate(${(mins / 60) * 30}deg)`;
      const hh = Math.floor(mins / 60) || 12; readout.textContent = `${hh}:${String(mins % 60).padStart(2, '0')}`;
    };
    const add = (d) => { mins = ((mins + d) % 720 + 720) % 720; paint(); api.sound.tick(); api.clearError(); };
    let drag = false, lastA = null;
    face.addEventListener('pointerdown', (e) => { drag = true; lastA = null; try { face.setPointerCapture(e.pointerId); } catch (_) { /* */ } e.preventDefault(); });
    face.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = face.getBoundingClientRect();
      const a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
      if (lastA !== null) { let d = a - lastA; if (d > 180) d -= 360; if (d < -180) d += 360; mins = ((mins + d / 6) % 720 + 720) % 720; paint(); }
      lastA = a;
    });
    face.addEventListener('pointerup', () => { drag = false; mins = Math.round(mins / 5) * 5 % 720; paint(); });
    face.style.touchAction = 'none';
    const btn = (label, d) => { const b = h('button', { class: 'choice-btn small', type: 'button' }, label); b.addEventListener('click', () => add(d)); return b; };
    api.body.appendChild(h('div', { class: 'clock-wrap' }, face, readout, h('div', { class: 'clock-btns' }, btn('−1 h', -60), btn('−5 min', -5), btn('+5 min', 5), btn('+1 h', 60)), h('p', { class: 'muted center small' }, 'Drag around the clock to turn the hands, or use the buttons.')));
    paint();
    api.setAnswer(() => ({ mins: Math.round(mins) % 720, target }));
    api.setBot(() => { let guard = 0; while (Math.round(mins) % 720 !== target && guard++ < 300) add(Math.abs(target - mins) >= 60 ? 60 : 5); api.verify(); });
  };

  // ------------------------------------------------------------------ lights out
  /* config: n (3–5), presses (scramble count), goal 'off'|'on', icon */
  P.lights = (api, cfg) => {
    api.showVerify(false);
    const n = cfg.n || 4, goalOn = cfg.goal === 'on';
    const on = Array(n * n).fill(goalOn);
    const solution = new Set();
    const toggle = (i) => { const x = i % n, y = Math.floor(i / n); [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < n && ny < n) on[ny * n + nx] = !on[ny * n + nx]; }); };
    while (solution.size < (cfg.presses || n + 1)) solution.add(randInt(0, n * n - 1));
    solution.forEach(toggle);
    const grid = h('div', { class: 'grid lights-grid', style: { gridTemplateColumns: `repeat(${n}, 1fr)` } });
    const cells = on.map((_, i) => {
      const c = h('button', { class: 'tile light', type: 'button', 'aria-label': 'Light ' + (i + 1) }, h('span', null, cfg.icon || '💡'));
      c.addEventListener('click', () => {
        if (api.isLocked()) return;
        toggle(i); if (solution.has(i)) solution.delete(i); else solution.add(i);
        paint(); api.sound.click();
        if (on.every((v) => v === goalOn)) api.after(300, () => api.submit({ done: true }));
      });
      grid.appendChild(c);
      return c;
    });
    const paint = () => cells.forEach((c, i) => c.classList.toggle('on', on[i]));
    paint();
    api.body.append(h('p', { class: 'muted center small' }, `Tapping one also flips its neighbours. Turn them all ${goalOn ? 'ON' : 'OFF'}.`), grid);
    api.setBot(() => [...solution].forEach((i) => cells[i].click()));
  };

  // ------------------------------------------------------------------ pipes
  /* config: cols (5), rows (4), theme: 'pipe'|'wire'|'heart' */
  P.pipes = (api, cfg) => {
    api.showVerify(false);
    const cols = cfg.cols || 5, rows = cfg.rows || 4;
    const N = 1, E = 2, S = 4, W = 8;
    const DIRS = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
    const startY = Math.floor(rows / 2), endY = randInt(0, rows - 1);
    // random self-avoiding path from (0,startY) to (cols-1,endY)
    let path;
    for (let tries = 0; tries < 400; tries++) {
      const seen = new Set(['0,' + startY]); path = [[0, startY]];
      let ok = false;
      for (let k = 0; k < 60; k++) {
        const [x, y] = path[path.length - 1];
        if (x === cols - 1 && y === endY) { ok = true; break; }
        const opts = DIRS.map(([, dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen.has(nx + ',' + ny));
        if (!opts.length) break;
        const fwd = opts.filter(([nx]) => nx > x);
        const [nx, ny] = Math.random() < 0.45 && fwd.length ? pick(fwd) : pick(opts);
        seen.add(nx + ',' + ny); path.push([nx, ny]);
      }
      if (ok) break;
    }
    const conn = Array(cols * rows).fill(0);
    const idx = (x, y) => y * cols + x;
    path.forEach(([x, y], i) => {
      const prev = i === 0 ? [-1, startY] : path[i - 1];
      const next = i === path.length - 1 ? [cols, endY] : path[i + 1];
      for (const [px, py] of [prev, next]) for (const [bit, dx, dy] of DIRS) if (px === x + dx && py === y + dy) conn[idx(x, y)] |= bit;
    });
    const pieces = [N | S, E | W, N | E, E | S, S | W, W | N, N | E | S];
    for (let i = 0; i < conn.length; i++) if (!conn[i]) conn[i] = pick(pieces);
    const rot = (m, k) => { let r = m; for (let i = 0; i < k; i++) r = ((r << 1) | (r >> 3)) & 15; return r; };
    const solved = conn.slice();
    const turns = conn.map(() => randInt(0, 3));
    const cur = (i) => rot(solved[i], turns[i]);
    const onPath = new Set(path.map(([x, y]) => idx(x, y)));
    const grid = h('div', { class: 'grid pipes-grid', style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } });
    const color = cfg.theme === 'heart' ? '#e53950' : cfg.theme === 'wire' ? '#f2b632' : '#3f7fe0';
    const cells = conn.map((_, i) => {
      const c = h('button', { class: 'tile pipe', type: 'button', 'aria-label': 'Pipe piece' });
      c.addEventListener('click', () => { if (api.isLocked()) return; turns[i] = (turns[i] + 1) % 4; api.sound.click(); paint(); });
      grid.appendChild(c);
      return c;
    });
    const flow = () => {
      const lit = new Set();
      const q = [];
      if (cur(idx(0, startY)) & W) { q.push([0, startY]); lit.add(idx(0, startY)); }
      while (q.length) {
        const [x, y] = q.shift(), m = cur(idx(x, y));
        for (const [bit, dx, dy, opp] of DIRS) {
          if (!(m & bit)) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const j = idx(nx, ny);
          if (!lit.has(j) && cur(j) & opp) { lit.add(j); q.push([nx, ny]); }
        }
      }
      return { lit, done: lit.has(idx(cols - 1, endY)) && (cur(idx(cols - 1, endY)) & E) };
    };
    let finished = false;
    const paint = () => {
      const { lit, done } = flow();
      cells.forEach((c, i) => {
        const m = cur(i), col = lit.has(i) ? color : '#b0b8c4';
        const seg = (bit, x2, y2) => (m & bit ? `<line x1="50" y1="50" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="18" stroke-linecap="round"/>` : '');
        c.innerHTML = `<svg viewBox="0 0 100 100">${seg(N, 50, 0)}${seg(E, 100, 50)}${seg(S, 50, 100)}${seg(W, 0, 50)}<circle cx="50" cy="50" r="9" fill="${col}"/></svg>`;
      });
      if (done && !finished) { finished = true; api.after(400, () => api.submit({ done: true })); }
    };
    paint();
    const icons = { pipe: ['🚰', '🪣'], wire: ['🔌', '🌐'], heart: ['🫀', '🤖'] }[cfg.theme || 'pipe'];
    api.body.appendChild(h('div', { class: 'pipes-wrap' },
      h('div', { class: 'pipe-end', style: { top: ((startY + 0.5) / rows) * 100 + '%' } }, icons[0]),
      grid,
      h('div', { class: 'pipe-end right', style: { top: ((endY + 0.5) / rows) * 100 + '%' } }, icons[1])));
    api.setBot(() => onPath.forEach((i) => { let g = 0; while (cur(i) !== solved[i] && g++ < 4) cells[i].click(); }));
  };

  // ------------------------------------------------------------------ code breaker
  /* config: kind 'color'|'digit', length (4), guesses (8) */
  P.mastermind = (api, cfg) => {
    api.showVerify(false);
    const L = cfg.length || 4, MAXG = cfg.guesses || 8;
    const SYMS = cfg.kind === 'digit' ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] : ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'];
    let code, history, cur;
    const board = h('div', { class: 'mm-board' });
    const curRow = h('div', { class: 'mm-row current' });
    const pal = h('div', { class: 'mm-palette' });
    const back = h('button', { class: 'choice-btn small', type: 'button' }, '⌫');
    const go = h('button', { class: 'btn-verify', type: 'button' }, 'Guess');
    const score = (g, c) => { let ex = 0; const a = {}, b = {}; for (let i = 0; i < L; i++) { if (g[i] === c[i]) ex++; else { a[g[i]] = (a[g[i]] || 0) + 1; b[c[i]] = (b[c[i]] || 0) + 1; } } let mis = 0; for (const k in a) mis += Math.min(a[k], b[k] || 0); return [ex, mis]; };
    const reset = () => { code = Array.from({ length: L }, () => pick(SYMS)); history = []; cur = []; board.innerHTML = ''; paint(); };
    const paint = () => {
      curRow.innerHTML = '';
      for (let i = 0; i < L; i++) curRow.appendChild(h('span', { class: 'mm-slot' }, cur[i] || ''));
      go.disabled = cur.length < L;
    };
    SYMS.forEach((s) => { const b = h('button', { class: 'mm-sym', type: 'button' }, s); b.addEventListener('click', () => { if (cur.length < L) { cur.push(s); paint(); api.sound.click(); } }); pal.appendChild(b); });
    back.addEventListener('click', () => { cur.pop(); paint(); });
    go.addEventListener('click', () => {
      if (cur.length < L || api.isLocked()) return;
      const [ex, mis] = score(cur, code);
      history.push({ g: cur.slice(), ex, mis });
      board.appendChild(h('div', { class: 'mm-row' }, cur.map((s) => h('span', { class: 'mm-slot' }, s)), h('span', { class: 'mm-fb' }, `✅ ${ex}  🔁 ${mis}`)));
      cur = []; paint();
      if (ex === L) { api.submit({ guesses: history.length }); return; }
      if (history.length >= MAXG) { api.fail(`Out of guesses. It was ${code.join(' ')}. New code!`, { soft: true, suspicion: 3 }); api.after(900, reset); }
    });
    api.body.appendChild(h('div', { class: 'mm' },
      h('p', { class: 'muted small center' }, `✅ = right symbol, right place · 🔁 = right symbol, wrong place · ${MAXG} guesses`),
      board, curRow, pal, h('div', { class: 'mm-actions' }, back, go)));
    reset();
    api.setBot(() => {
      let cands = null;
      const all = () => { const out = []; const rec = (p) => { if (p.length === L) { out.push(p.slice()); return; } for (const s of SYMS) { p.push(s); rec(p); p.pop(); } }; rec([]); return out; };
      const stepBot = () => {
        if (api.isLocked()) return;
        cands = cands || all();
        cands = cands.filter((c) => history.every((hh) => { const [e, m] = score(hh.g, c); return e === hh.ex && m === hh.mis; }));
        const g = cands[0];
        cur = g.slice(); paint(); go.click();
        if (!api.isLocked()) api.after(60, stepBot);
      };
      stepBot();
    });
  };

  // ------------------------------------------------------------------ tower of Hanoi
  /* config: disks (3) */
  P.hanoi = (api, cfg) => {
    api.showVerify(false);
    const n = cfg.disks || 3;
    const pegs = [Array.from({ length: n }, (_, i) => n - i), [], []];
    let sel = null, moves = 0;
    const wrap = h('div', { class: 'hanoi' });
    const status = h('div', { class: 'muted center small' }, `Move the whole stack to the right peg. Bigger never goes on smaller. Moves: 0`);
    const pegEls = pegs.map((_, i) => { const p = h('button', { class: 'peg', type: 'button', 'aria-label': 'Peg ' + (i + 1) }); p.addEventListener('click', () => tap(i)); wrap.appendChild(p); return p; });
    const paint = () => pegEls.forEach((el, i) => {
      el.innerHTML = '<span class="peg-pole"></span>';
      pegs[i].forEach((d, k) => el.appendChild(h('span', { class: 'disk' + (sel === i && k === pegs[i].length - 1 ? ' lifted' : ''), style: { width: 30 + d * 18 + '%', bottom: 10 + k * 22 + 'px', background: `hsl(${200 + d * 30}, 70%, 55%)` } })));
      el.classList.toggle('sel', sel === i);
    });
    const tap = (i) => {
      if (api.isLocked()) return;
      if (sel === null) { if (pegs[i].length) { sel = i; api.sound.click(); } paint(); return; }
      if (sel !== i) {
        const d = pegs[sel][pegs[sel].length - 1], top = pegs[i][pegs[i].length - 1];
        if (top && top < d) { api.flavor('A bigger disk can’t go on a smaller one.'); api.widget.classList.remove('shake'); void api.widget.offsetWidth; api.widget.classList.add('shake'); }
        else { pegs[i].push(pegs[sel].pop()); moves++; api.sound.pop(); }
      }
      sel = null; paint();
      status.textContent = `Move the whole stack to the right peg. Bigger never goes on smaller. Moves: ${moves}`;
      if (pegs[2].length === n) api.after(300, () => api.submit({ moves }));
    };
    paint();
    api.body.append(status, wrap);
    api.setBot(() => { const ms = []; const solve = (k, a, b, c) => { if (!k) return; solve(k - 1, a, c, b); ms.push([a, c]); solve(k - 1, b, a, c); }; solve(n, 0, 1, 2); ms.forEach(([a, c]) => { tap(a); tap(c); }); });
  };

  // ------------------------------------------------------------------ typing defence
  /* config: words [..], goal (10), maxMissed (3), speed (% per s) */
  P.typing = (api, cfg) => {
    api.showVerify(false);
    const box = h('div', { class: 'type-box' });
    const input = h('input', { class: 'text-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Type a falling word…', 'aria-label': 'Type the falling words' });
    const hud = h('div', { class: 'arcade-hud' });
    api.body.append(hud, box, input);
    const goal = cfg.goal || 10, maxMissed = cfg.maxMissed || 3;
    let words = [], killed = 0, missed = 0, spawn = 0, started = false;
    const reset = () => { words.forEach((w) => w.el.remove()); words = []; killed = 0; missed = 0; spawn = 0; };
    const check = () => {
      const v = input.value.trim().toLowerCase();
      const w = words.find((q) => q.text === v);
      if (w) { w.el.classList.add('zap'); setTimeout(() => w.el.remove(), 200); words = words.filter((q) => q !== w); killed++; input.value = ''; api.sound.tone(600 + killed * 30, 0.05, 'triangle', 0.06); if (killed >= goal) api.submit({ killed }); }
    };
    input.addEventListener('input', () => { started = true; check(); });
    input.addEventListener('focus', () => { started = true; });
    api.loop((dt) => {
      hud.textContent = `Zapped ${killed} / ${goal} · Landed ${missed} / ${maxMissed}`;
      if (!started) return true;
      spawn -= dt;
      if (spawn <= 0) { spawn = Math.max(1.1, 2.2 - killed * 0.08); const text = pick(cfg.words.filter((t) => !words.some((w) => w.text === t))); const el = h('span', { class: 'type-word', style: { left: rand(4, 70) + '%' } }, text); box.appendChild(el); words.push({ text, el, y: -8 }); }
      for (const w of words) { w.y += (cfg.speed || 9) * dt; w.el.style.top = w.y + '%'; }
      const landed = words.filter((w) => w.y > 92);
      landed.forEach((w) => w.el.remove());
      if (landed.length) { words = words.filter((w) => w.y <= 92); missed += landed.length; api.sound.error(); if (missed >= maxMissed) { api.fail('Too many words landed. Starting over.', { soft: true, suspicion: 2 }); reset(); } }
      return true;
    });
    if (U.finePointer()) api.after(80, () => input.focus());
    api.setBot(() => { started = true; api.every(250, () => { const w = words.slice().sort((a, b) => b.y - a.y)[0]; if (w) { input.value = w.text; check(); } }); });
  };

  // ------------------------------------------------------------------ program the robot
  /* config: map (rows of 'S' start, 'G' goal, '#' wall, '.' floor), max (commands, 14) */
  P.program = (api, cfg) => {
    api.showVerify(false);
    const map = cfg.map, R = map.length, Cc = map[0].length;
    let sx, sy, gx, gy;
    map.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'S') { sx = x; sy = y; } if (ch === 'G') { gx = x; gy = y; } }));
    const grid = h('div', { class: 'grid prog-grid', style: { gridTemplateColumns: `repeat(${Cc}, 1fr)` } });
    const cells = [];
    map.forEach((row, y) => [...row].forEach((ch, x) => { const c = h('div', { class: 'tile prog-cell' + (ch === '#' ? ' wall' : '') }, ch === 'G' ? '🔋' : ''); grid.appendChild(c); cells.push(c); }));
    const bot = h('span', { class: 'prog-bot' }, '🤖');
    const placeBot = (x, y) => { cells[y * Cc + x].appendChild(bot); };
    placeBot(sx, sy);
    const prog = [];
    const list = h('div', { class: 'prog-list' });
    const D = { '↑': [0, -1], '↓': [0, 1], '←': [-1, 0], '→': [1, 0] };
    const paintList = () => { list.innerHTML = ''; prog.forEach((c) => list.appendChild(h('span', { class: 'prog-cmd' }, c))); if (!prog.length) list.appendChild(h('em', { class: 'muted small' }, 'Add moves, then Run')); };
    paintList();
    let running = false;
    const cmdBtns = Object.keys(D).map((k) => { const b = h('button', { class: 'mm-sym', type: 'button', 'aria-label': 'Move ' + k }, k); b.addEventListener('click', () => { if (!running && prog.length < (cfg.max || 14)) { prog.push(k); paintList(); api.sound.click(); } }); return b; });
    const undo = h('button', { class: 'choice-btn small', type: 'button' }, '⌫');
    const runB = h('button', { class: 'btn-verify', type: 'button' }, 'Run ▶');
    undo.addEventListener('click', () => { if (!running) { prog.pop(); paintList(); } });
    const exec = () => {
      if (running || api.isLocked()) return;
      running = true;
      let x = sx, y = sy, i = 0;
      const stepOnce = () => {
        if (i >= prog.length) { running = false; if (x === gx && y === gy) api.submit({ moves: prog.length }); else { api.fail('The robot stopped short of the battery.', { soft: true, suspicion: 2 }); placeBot(sx, sy); } return; }
        const [dx, dy] = D[prog[i]]; const nx = x + dx, ny = y + dy;
        list.children[i] && list.children[i].classList.add('run');
        if (nx < 0 || ny < 0 || nx >= Cc || ny >= R || map[ny][nx] === '#') { running = false; api.fail('Bonk! The robot walked into a wall.', { soft: true, suspicion: 2 }); placeBot(sx, sy); paintList(); return; }
        x = nx; y = ny; placeBot(x, y); api.sound.tick(); i++;
        if (x === gx && y === gy) { running = false; api.after(300, () => api.submit({ moves: i })); return; }
        api.after(260, stepOnce);
      };
      stepOnce();
    };
    runB.addEventListener('click', exec);
    api.body.appendChild(h('div', { class: 'prog' }, grid, list, h('div', { class: 'mm-palette' }, cmdBtns), h('div', { class: 'mm-actions' }, undo, runB)));
    api.setBot(() => {
      const prev = { [sx + ',' + sy]: null }, q = [[sx, sy]];
      while (q.length) { const [x, y] = q.shift(); if (x === gx && y === gy) break; for (const k of Object.keys(D)) { const nx = x + D[k][0], ny = y + D[k][1], key = nx + ',' + ny; if (nx >= 0 && ny >= 0 && nx < Cc && ny < R && map[ny][nx] !== '#' && !(key in prev)) { prev[key] = [x, y, k]; q.push([nx, ny]); } } }
      const path = []; let key = gx + ',' + gy; while (prev[key]) { const [x, y, k] = prev[key]; path.unshift(k); key = x + ',' + y; }
      path.forEach((k) => cmdBtns[Object.keys(D).indexOf(k)].click()); exec();
    });
  };

  // ------------------------------------------------------------------ constellation
  /* config: need (4) */
  P.stars = (api, cfg) => {
    const field = h('div', { class: 'star-field' });
    const svg = h('div', { class: 'dots-svg' });
    field.appendChild(svg);
    const chosen = [];
    const pts = Array.from({ length: 12 }, () => [rand(8, 92), rand(10, 88)]);
    pts.forEach(([x, y], i) => {
      const s = h('button', { class: 'star', type: 'button', style: { left: x + '%', top: y + '%' }, 'aria-label': 'Star' }, '✦');
      s.addEventListener('click', () => { if (chosen.includes(i)) return; chosen.push(i); s.classList.add('on'); api.sound.tone(800 + chosen.length * 60, 0.1, 'sine', 0.06); paint(); });
      field.appendChild(s);
    });
    const name = h('input', { class: 'text-input', type: 'text', placeholder: 'Name your constellation (optional)', 'aria-label': 'Constellation name' });
    const paint = () => { svg.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${chosen.map((i) => pts[i].join(',')).join(' ')}" fill="none" stroke="#ffe08a" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`; api.setVerifyEnabled(chosen.length >= (cfg.need || 4)); };
    paint();
    api.body.append(field, name);
    api.setAnswer(() => ({ stars: chosen.length, name: name.value.trim() }));
    api.setBot(() => { field.querySelectorAll('.star').forEach((s, i) => { if (i < 4) s.click(); }); api.verify(); });
  };

  // ------------------------------------------------------------------ let go of worries
  /* config: need (3) */
  P.worries = (api, cfg) => {
    api.showVerify(false);
    const sky = h('div', { class: 'lantern-sky' });
    const input = h('input', { class: 'text-input', type: 'text', maxlength: '40', placeholder: 'A small worry…', 'aria-label': 'A worry' });
    const btn = h('button', { class: 'btn-verify', type: 'button' }, 'Let it go');
    let n = 0;
    const need = cfg.need || 3;
    const release = () => {
      const t = input.value.trim();
      if (!t || api.isLocked()) return;
      input.value = '';
      n++;
      const l = h('div', { class: 'lantern', style: { left: rand(10, 70) + '%' } }, h('span', null, '🏮'), h('small', null, t));
      sky.appendChild(l);
      api.sound.tone(500 + n * 80, 0.4, 'sine', 0.06);
      if (n >= need) api.after(1500, () => api.submit({ n }));
      else api.flavor(n === 1 ? 'There it goes. One more?' : 'Lighter already.');
    };
    btn.addEventListener('click', release);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') release(); });
    api.body.append(sky, h('div', { class: 'worry-row' }, input, btn));
    api.setBot(() => ['deadlines', 'that email', 'socks'].forEach((w) => { input.value = w; release(); }));
  };

  // ------------------------------------------------------------------ teach the robot what a cat is
  /* config: train [[src, isCat]], test [[src, isCat]] */
  P.teach = (api, cfg) => {
    api.showVerify(false);
    const pic = h('div', { class: 'teach-pic' });
    const q = h('div', { class: 'choice-text' });
    const yes = h('button', { class: 'choice-btn primary', type: 'button' }, '🐱 Cat');
    const no = h('button', { class: 'choice-btn', type: 'button' }, '❌ Not a cat');
    const log = h('div', { class: 'teach-log' });
    api.body.append(q, pic, h('div', { class: 'choice-options grid' }, yes, no), log);
    let i = 0, wrong = [];
    const show = () => { const [src] = cfg.train[i]; pic.innerHTML = photo(src); q.textContent = `Lesson ${i + 1} of ${cfg.train.length}: is this a cat?`; };
    const answer = (cat) => {
      if (api.isLocked() || i >= cfg.train.length) return;
      const [src, truth] = cfg.train[i];
      if (cat !== truth) wrong.push(src);
      api.sound.click();
      i++;
      if (i < cfg.train.length) { show(); return; }
      yes.disabled = no.disabled = true;
      q.textContent = 'The robot is learning…';
      pic.innerHTML = '<div class="load-spinner" style="margin:40px auto"></div>';
      api.after(1000, () => {
        q.textContent = 'Final exam (the robot answers):';
        pic.innerHTML = '';
        const row = h('div', { class: 'teach-test' });
        cfg.test.forEach(([src, truth], k) => {
          const robotRight = wrong.length === 0 || k > 0;
          const says = robotRight ? truth : !truth;
          row.appendChild(h('div', { class: 'teach-card' + (robotRight ? '' : ' bad') }, h('div', { class: 'tile-img', html: photo(src) }), h('small', null, `🤖 “${says ? 'cat' : 'not a cat'}” ${robotRight ? '✔' : '✘'}`)));
        });
        pic.appendChild(row);
        api.after(900, () => {
          if (!wrong.length) api.submit({ ok: true });
          else { api.fail('You taught me something wrong, so I got one wrong. Let’s redo the lessons.', { soft: true, suspicion: 2 }); i = 0; wrong = []; yes.disabled = no.disabled = false; api.after(1200, show); }
        });
      });
    };
    yes.addEventListener('click', () => answer(true));
    no.addEventListener('click', () => answer(false));
    show();
    api.setBot(() => cfg.train.forEach(([, truth]) => answer(truth)));
  };

  // ------------------------------------------------------------------ clicks per second
  /* config: need (25), time (6) */
  P.cps = (api, cfg) => {
    api.showVerify(false);
    const need = cfg.need || 25, time = cfg.time || 6;
    const btn = h('button', { class: 'cps-btn', type: 'button' }, 'CLICK');
    const info = h('div', { class: 'cps-info' }, `Click ${need} times in ${time} seconds. Starts on the first click.`);
    api.body.append(info, btn);
    let n = 0, t0 = null, timer = null;
    btn.addEventListener('click', () => {
      if (api.isLocked()) return;
      if (t0 === null) { t0 = performance.now(); timer = api.every(100, tick); }
      n++;
      btn.textContent = String(n);
      btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
      api.sound.tone(400 + n * 12, 0.03, 'square', 0.03);
      if (n >= need) { clearInterval(timer); api.submit({ n, t: (performance.now() - t0) / 1000 }); }
    });
    const tick = () => {
      const el = (performance.now() - t0) / 1000;
      info.textContent = `${n} / ${need} · ${Math.max(0, time - el).toFixed(1)} s left`;
      if (el >= time && n < need) { clearInterval(timer); api.fail(`${n} clicks. Robots click faster. Humans click… more. Try again!`, { soft: true, suspicion: 2 }); n = 0; t0 = null; btn.textContent = 'CLICK'; info.textContent = `Click ${need} times in ${time} seconds.`; }
    };
    api.setBot(() => { for (let k = 0; k < need; k++) btn.click(); });
  };

  // ------------------------------------------------------------------ pop-up cascade
  /* config: popups [{title, body, yes, close: 'x'|'link'|'button', fake}] (top-most first) */
  P.popups = (api, cfg) => {
    api.showVerify(false);
    const desk = h('div', { class: 'desk' }, h('div', { class: 'desk-under' }, '✓ The actual CAPTCHA is under here somewhere.'));
    api.body.appendChild(desk);
    let list = cfg.popups.slice();
    let spawned = 0;
    const render = () => {
      desk.querySelectorAll('.popup').forEach((p) => p.remove());
      list.slice().reverse().forEach((p, idx, arr) => {
        const depth = arr.length - 1 - idx;
        const yes = h('button', { class: 'pop-yes', type: 'button' }, p.yes || 'YES!');
        const realClose = p.close === 'link' ? h('button', { class: 'pop-link', type: 'button' }, p.closeText || 'No thanks, I prefer being unverified') : p.close === 'button' ? h('button', { class: 'pop-no', type: 'button' }, p.closeText || 'Close') : h('button', { class: 'pop-x', type: 'button', 'aria-label': 'Close' }, '×');
        const fakeX = p.fake ? h('button', { class: 'pop-x fake', type: 'button', 'aria-label': 'Close' }, '×') : null;
        const el = h('div', { class: 'popup' + (depth === 0 ? ' top' : ''), style: { transform: `translate(${depth * 9}px, ${depth * 11}px)`, zIndex: String(10 - depth) } },
          h('div', { class: 'pop-title' }, h('span', null, p.title), p.close === 'x' ? realClose : fakeX),
          h('div', { class: 'pop-body' }, p.body), h('div', { class: 'pop-actions' }, yes, p.close !== 'x' ? realClose : null));
        yes.addEventListener('click', () => { api.fail(p.yesMsg || 'That subscribed you to something. Unsubscribed for you. Try again.', { soft: true, suspicion: 2 }); });
        realClose.addEventListener('click', () => { if (depth !== 0) return; list.shift(); api.sound.pop(); render(); if (!list.length) api.after(300, () => api.submit({ closed: true })); });
        if (fakeX) fakeX.addEventListener('click', () => { if (spawned < 2) { spawned++; list.splice(1, 0, { title: 'You clicked the fake ×', body: 'Congratulations! That opened another pop-up.', close: 'button', closeText: 'Ugh, close' }); } api.flavor('That × was decorative.'); render(); });
        desk.appendChild(el);
      });
    };
    render();
    api.setBot(() => { const t = api.every(120, () => { const top = desk.querySelector('.popup.top'); if (!top) { clearInterval(t); return; } const real = top.querySelector('.pop-x:not(.fake), .pop-link, .pop-no'); real && real.click(); }); });
  };

  // ------------------------------------------------------------------ close the other tabs
  P.tabs = (api, cfg) => {
    api.showVerify(false);
    const defs = cfg.tabs || [
      { t: 'stillCAPTCHA', me: true }, { t: 'Cat videos (14)' }, { t: 'You WON a prize!!!', sticky: 1 }, { t: 'Inbox (3)' },
      { t: 'Free robot toolbar', sticky: 1 }, { t: 'Untitled' },
    ];
    let tabs = defs.map((d) => Object.assign({}, d));
    const strip = h('div', { class: 'tab-strip' });
    const page = h('div', { class: 'tab-page' });
    api.body.appendChild(h('div', { class: 'browser' }, strip, page));
    let active = 0;
    const render = () => {
      strip.innerHTML = '';
      tabs.forEach((tb, i) => {
        const x = h('button', { class: 'tab-x', type: 'button', 'aria-label': 'Close tab ' + tb.t }, '×');
        const el = h('div', { class: 'btab' + (i === active ? ' active' : '') + (tb.me ? ' me' : '') }, h('span', { class: 'btab-t' }, tb.t), x);
        el.addEventListener('click', () => { active = i; render(); });
        x.addEventListener('click', (e) => {
          e.stopPropagation();
          if (api.isLocked()) return;
          if (tb.me) { api.fail('You closed the CAPTCHA. It reopened itself, slightly hurt.', { soft: true, suspicion: 2 }); return; }
          if (tb.sticky) { tb.sticky--; tb.t = tb.t + ' (it’s back)'; api.flavor('Some tabs come back. Close it again.'); render(); return; }
          tabs.splice(i, 1); active = Math.max(0, tabs.findIndex((q) => q.me)); api.sound.pop(); render();
          if (tabs.length === 1) api.after(300, () => api.submit({ done: true }));
        });
        strip.appendChild(el);
      });
      const cur = tabs[active] || tabs[0];
      page.textContent = cur.me ? 'This is the CAPTCHA. Close every other tab.' : `${cur.t}: definitely not helping.`;
    };
    render();
    api.setBot(() => { let g = 0; const t = api.every(80, () => { const xs = [...strip.querySelectorAll('.btab:not(.me) .tab-x')]; if (!xs.length || g++ > 40) { clearInterval(t); return; } xs[0].click(); }); });
  };

  // ------------------------------------------------------------------ sneaky installer
  P.installer = (api) => {
    api.showVerify(false);
    const box = h('div', { class: 'installer' });
    api.body.appendChild(box);
    let step = 0;
    const st = { accept: false, toolbar: true, homepage: true };
    const nav = (canNext, swapped) => {
      const back = h('button', { class: 'dlg-btn', type: 'button' }, '< Back');
      const next = h('button', { class: 'dlg-btn primary', type: 'button', disabled: !canNext }, step === 3 ? 'Finish' : 'Next >');
      back.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
      next.addEventListener('click', () => {
        if (step < 3) { step++; render(); return; }
        api.submit({ toolbar: st.toolbar, homepage: st.homepage });
      });
      return h('div', { class: 'inst-nav' }, swapped ? [next, back] : [back, next]);
    };
    const render = () => {
      box.innerHTML = '';
      box.appendChild(h('div', { class: 'inst-title' }, `stillCAPTCHA Update Wizard · Step ${step + 1} of 4`));
      if (step === 0) box.append(h('p', null, 'Welcome! This wizard will update stillCAPTCHA to version 2.0 (now with more robots).'), nav(true));
      if (step === 1) {
        const dec = h('input', { type: 'radio', name: 'lic', checked: !st.accept }), acc = h('input', { type: 'radio', name: 'lic', checked: st.accept });
        dec.addEventListener('change', () => { st.accept = false; render(); }); acc.addEventListener('change', () => { st.accept = true; render(); });
        box.append(h('div', { class: 'inst-license' }, 'By installing you agree that robots may, from time to time, be friendly. The CAPTCHA may ask about buses. Socks may go missing.'),
          h('label', { class: 'inst-opt' }, dec, ' I decline'), h('label', { class: 'inst-opt' }, acc, ' I accept the agreement'), nav(st.accept));
      }
      if (step === 2) {
        const mk = (key, label) => { const c = h('input', { type: 'checkbox', checked: st[key] }); c.addEventListener('change', () => { st[key] = c.checked; }); return h('label', { class: 'inst-opt' }, c, ' ' + label); };
        const core = h('input', { type: 'checkbox', checked: true, disabled: true });
        box.append(h('p', null, 'Choose components:'), h('label', { class: 'inst-opt' }, core, ' stillCAPTCHA core (required)'), mk('toolbar', 'Install the Robot Toolbar (recommended!!)'), mk('homepage', 'Make robots.example my homepage'), nav(true, true));
      }
      if (step === 3) box.append(h('p', null, 'Ready to install. Press Finish to apply your choices.'), nav(true));
    };
    render();
    api.onFail(() => { step = 0; st.accept = false; st.toolbar = true; st.homepage = true; api.after(600, render); });
    api.setBot(() => {
      const clickNext = () => [...box.querySelectorAll('.dlg-btn')].find((b) => /Next|Finish/.test(b.textContent)).click();
      clickNext();
      box.querySelectorAll('input[type=radio]')[1].click();
      clickNext();
      box.querySelectorAll('input[type=checkbox]:not([disabled])').forEach((c) => { if (c.checked) c.click(); });
      clickNext();
      clickNext();
    });
  };

  // ------------------------------------------------------------------ a CAPTCHA inside a CAPTCHA inside a CAPTCHA
  P.nested = (api) => {
    api.showVerify(false);
    const innerBox = h('button', { class: 'cbx', type: 'button', 'aria-label': 'Innermost checkbox', html: '<svg class="ck" viewBox="0 0 40 40"><path d="M8 21 L16 29 L33 10"/></svg>' });
    const midInput = h('input', { class: 'text-input', type: 'text', placeholder: 'Type OK', disabled: true, 'aria-label': 'Type OK' });
    const midBtn = h('button', { class: 'btn-verify small', type: 'button', disabled: true }, 'Verify');
    const outBtn = h('button', { class: 'btn-verify', type: 'button', disabled: true }, 'Verify everything');
    const inner = h('div', { class: 'nest n3' }, h('div', { class: 'nest-head' }, 'Level 3: tick this'), h('div', { class: 'anchor-left' }, innerBox, h('span', { class: 'anchor-label' }, "I'm not a robot")));
    const mid = h('div', { class: 'nest n2' }, h('div', { class: 'nest-head' }, 'Level 2: verify the CAPTCHA below'), inner, midInput, midBtn);
    const outer = h('div', { class: 'nest n1' }, h('div', { class: 'nest-head' }, 'Level 1: verify the CAPTCHA below'), mid, outBtn);
    api.body.appendChild(outer);
    innerBox.addEventListener('click', () => { if (innerBox.classList.contains('checked')) return; api.countCheckboxClick(); innerBox.classList.add('checked'); inner.classList.add('ok'); midInput.disabled = false; midInput.focus(); api.sound.tick(); });
    midInput.addEventListener('input', () => { midBtn.disabled = midInput.value.trim().toLowerCase() !== 'ok'; });
    midBtn.addEventListener('click', () => { mid.classList.add('ok'); midBtn.disabled = true; midInput.disabled = true; outBtn.disabled = false; api.sound.tick(); });
    outBtn.addEventListener('click', () => api.submit({ done: true }));
    api.setBot(() => { innerBox.click(); midInput.value = 'OK'; midInput.dispatchEvent(new Event('input')); midBtn.click(); outBtn.click(); });
  };

  // ------------------------------------------------------------------ which cursor is yours?
  P.cursor = (api) => {
    api.showVerify(false);
    const arena = h('div', { class: 'cursor-arena' });
    const target = h('div', { class: 'cursor-target cbx' });
    arena.appendChild(target);
    api.body.appendChild(arena);
    const tx = rand(15, 80), ty = rand(20, 75);
    Object.assign(target.style, { left: tx + '%', top: ty + '%' });
    const offs = shuffle([[0, 0], [-70, 30], [60, -40], [90, 50], [-50, -60], [30, 70]]);
    const curs = offs.map(() => { const c = h('div', { class: 'fake-cursor', html: '<svg viewBox="0 0 24 24"><path d="M3 2 L3 19 L8 14 L11 21 L14 20 L11 13 L18 13 Z" fill="#fff" stroke="#111" stroke-width="1.5"/></svg>' }); arena.appendChild(c); return c; });
    arena.addEventListener('pointermove', (e) => {
      const r = arena.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      curs.forEach((c, i) => { c.style.left = x + offs[i][0] + 'px'; c.style.top = y + offs[i][1] + 'px'; c.style.display = 'block'; });
    });
    arena.addEventListener('click', (e) => {
      if (api.isLocked()) return;
      const r = target.getBoundingClientRect();
      if (U.inRect(e.clientX, e.clientY, r, 4)) { target.classList.add('checked'); target.innerHTML = '<svg class="ck" viewBox="0 0 40 40"><path d="M8 21 L16 29 L33 10"/></svg>'; api.countCheckboxClick(); api.after(300, () => api.submit({ found: true })); }
      else api.fail('That one wasn’t you. One of them is.', { soft: true, suspicion: 2 });
    });
    api.setBot(() => { const r = target.getBoundingClientRect(); arena.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true })); });
  };

  // ------------------------------------------------------------------ the volume knob
  /* config: target (37) */
  P.volume = (api, cfg) => {
    const target = cfg.target || 37;
    let v = 0, lastA = null, drag = false;
    const knob = h('div', { class: 'knob', role: 'slider', 'aria-label': 'Volume knob', tabindex: '0' }, h('span', { class: 'knob-mark' }));
    const out = h('div', { class: 'vol-out' }, '0');
    const set = (nv) => { v = clamp(nv, 0, 100); out.textContent = String(Math.round(v)); knob.style.transform = `rotate(${v * 36}deg)`; api.clearError(); };
    knob.addEventListener('pointerdown', (e) => { drag = true; lastA = null; try { knob.setPointerCapture(e.pointerId); } catch (_) { /* */ } e.preventDefault(); });
    knob.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = knob.getBoundingClientRect();
      const a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
      if (lastA !== null) { let d = a - lastA; if (d > 180) d -= 360; if (d < -180) d += 360; set(v + d / 36); }
      lastA = a;
    });
    knob.addEventListener('pointerup', () => { drag = false; set(Math.round(v)); });
    knob.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(Math.round(v) + 1); if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(Math.round(v) - 1); });
    knob.style.touchAction = 'none';
    const plus7 = h('button', { class: 'choice-btn small', type: 'button' }, '+7'), minus3 = h('button', { class: 'choice-btn small', type: 'button' }, '−3');
    plus7.addEventListener('click', () => set(Math.round(v) + 7)); minus3.addEventListener('click', () => set(Math.round(v) - 3));
    api.body.appendChild(h('div', { class: 'volume' }, knob, out, h('p', { class: 'muted small center' }, 'One full turn = 10. Or use the (very helpful) buttons.'), h('div', { class: 'clock-btns' }, minus3, plus7)));
    set(0);
    api.setAnswer(() => ({ v: Math.round(v), target }));
    api.setBot(() => { set(target); api.verify(); });
  };

  Challenges.puzzle = {
    render(api) {
      const cfg = api.level.config || {};
      const fn = P[cfg.game];
      if (!fn) throw new Error('Unknown puzzle ' + cfg.game);
      fn(api, cfg);
    },
  };
})();
