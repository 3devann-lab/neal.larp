/* draw — canvas drawing with mouse or touch.
 * config.mode:
 *   'circle'  draw a circle. Answer: { roundness (0–1), coverage (deg), closed, r }
 *   'free'    draw anything. Answer: { ink (px of line), strokes }
 *   'robot'   the robot draws by itself, then the player judges. Answer: { counts }
 */
(function () {
  'use strict';
  const { h, rand } = U;
  const W = 300, H = 240;

  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const g = canvas.getContext('2d');
    g.scale(dpr, dpr);
    g.lineCap = 'round'; g.lineJoin = 'round';
    return g;
  }
  function paper(g) {
    g.fillStyle = '#fffdf7'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(63,127,224,.12)'; g.lineWidth = 1;
    for (let y = 24; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  }

  function analyseCircle(pts) {
    if (pts.length < 12) return { roundness: 0, coverage: 0, closed: false, r: 0 };
    let cx = 0, cy = 0;
    pts.forEach((p) => { cx += p.x; cy += p.y; });
    cx /= pts.length; cy /= pts.length;
    const rs = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const r = rs.reduce((a, b) => a + b, 0) / rs.length;
    const sd = Math.sqrt(rs.reduce((a, b) => a + (b - r) ** 2, 0) / rs.length);
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      let d = Math.atan2(pts[i].y - cy, pts[i].x - cx) - Math.atan2(pts[i - 1].y - cy, pts[i - 1].x - cx);
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      total += d;
    }
    const coverage = Math.abs(total) * 180 / Math.PI;
    const gap = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
    return { roundness: Math.max(0, 1 - sd / (r || 1)), coverage, closed: gap < r * 0.5 || coverage >= 350, r };
  }

  Challenges.draw = {
    analyseCircle,
    render(api) {
      const cfg = api.level.config || {};
      const mode = cfg.mode || 'free';
      const canvas = h('canvas', { class: 'draw-canvas', 'aria-label': 'Drawing area' });
      const clear = h('button', { class: 'link-btn', type: 'button' }, 'Clear');
      const readout = h('span', { class: 'draw-readout' });
      const tools = h('div', { class: 'draw-tools' }, readout, clear);
      api.body.appendChild(h('div', { class: 'draw-wrap' }, canvas, tools));
      const g = setupCanvas(canvas);
      paper(g);

      // ------------------------------------------------ robot draws by itself
      if (mode === 'robot') {
        tools.hidden = true;
        canvas.classList.add('readonly');
        api.showVerify(false);
        const path = [];
        for (let t = 0; t <= Math.PI * 2 + 0.05; t += 0.04) {
          const x = 16 * Math.sin(t) ** 3;
          const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          path.push({ x: W / 2 + x * 6.2 + rand(-2.5, 2.5), y: H / 2 + y * 6.2 - 6 + rand(-2.5, 2.5) });
        }
        // a few extra "robot" strokes: a wobbly line through it, like it's unsure
        let i = 1;
        g.strokeStyle = '#d93025'; g.lineWidth = 4;
        const pen = h('div', { class: 'robot-pen', html: ART.logo() });
        canvas.parentNode.appendChild(pen);
        api.loop(() => {
          for (let k = 0; k < 2 && i < path.length; k++, i++) {
            g.beginPath(); g.moveTo(path[i - 1].x, path[i - 1].y); g.lineTo(path[i].x, path[i].y); g.stroke();
          }
          const p = path[Math.min(i, path.length - 1)];
          pen.style.left = (p.x / W) * 100 + '%';
          pen.style.top = (p.y / H) * 100 + '%';
          if (i % 9 === 0) api.sound.tone(rand(500, 900), 0.03, 'square', 0.02);
          if (i >= path.length) {
            pen.classList.add('done');
            const yes = h('button', { class: 'choice-btn', type: 'button' }, cfg.yes || 'That counts as a feeling');
            const no = h('button', { class: 'choice-btn', type: 'button' }, cfg.no || "That's just lines");
            yes.addEventListener('click', () => api.submit({ counts: true }));
            no.addEventListener('click', () => api.submit({ counts: false }));
            api.body.appendChild(h('div', { class: 'choice-options list' }, yes, no));
            return false;
          }
          return true;
        });
        return;
      }

      // ------------------------------------------------ player draws
      const strokes = [];
      let current = null;
      let ink = 0;
      const toLocal = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
      };
      const sync = () => api.setVerifyEnabled(ink > (mode === 'circle' ? 60 : 30));
      canvas.addEventListener('pointerdown', (e) => {
        if (api.isLocked()) return;
        e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        if (mode === 'circle') { strokes.length = 0; paper(g); ink = 0; readout.textContent = ''; }
        current = [toLocal(e)];
        strokes.push(current);
        api.clearError();
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!current) return;
        const p = toLocal(e);
        const q = current[current.length - 1];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 1.5) return;
        ink += d;
        current.push(p);
        g.strokeStyle = cfg.color || '#2b2f6b';
        g.lineWidth = cfg.width || 5;
        g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(p.x, p.y); g.stroke();
      });
      const end = () => {
        if (!current) return;
        current = null;
        sync();
        if (mode === 'circle') {
          const a = analyseCircle(strokes[0] || []);
          readout.textContent = `Roundness ${Math.round(a.roundness * 100)}%`;
        }
      };
      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', end);
      clear.addEventListener('click', () => { strokes.length = 0; ink = 0; paper(g); readout.textContent = ''; sync(); });
      sync();

      api.setAnswer(() => (mode === 'circle'
        ? analyseCircle(strokes.reduce((a, b) => (b.length > a.length ? b : a), []))
        : { ink, strokes: strokes.length }));
      if (mode === 'circle') api.onFail(() => { strokes.length = 0; ink = 0; paper(g); sync(); });
    },
  };
})();
