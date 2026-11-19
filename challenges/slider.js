/* slider — drag a handle.
 * config.mode:
 *   'puzzle'  slide a puzzle piece into its gap. Answer: { x, gapX } in scene units (0–300)
 *   'value'   plain 0–100 slider. config.reverse flips the direction. Answer: { value }
 *             config.submit: 'release' (default) or 'verify'
 *             config.inverted: the handle moves opposite to your drag
 *   'shaky'   the robot's hand jitters the handle; holding it steadies it. Reach config.target.
 */
(function () {
  'use strict';
  const { h, clamp, randInt } = U;

  function makeTrack(api, onMove, onRelease, opts = {}) {
    const fill = h('div', { class: 'slider-fill' });
    const handle = h('div', {
      class: 'slider-handle', role: 'slider', tabindex: '0', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0',
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    });
    const track = h('div', { class: 'slider-track' }, fill, h('span', { class: 'slider-hint' }, 'Slide to complete the puzzle'), handle);
    let t = 0, dragging = false, grab = 0, startX = 0, startT = 0;

    const set = (nt) => {
      t = clamp(nt, 0, 1);
      handle.style.left = `calc(${t * 100}% - ${t * 44}px)`;
      fill.style.width = `calc(${t * 100}% - ${t * 44}px + 22px)`;
      handle.setAttribute('aria-valuenow', String(Math.round(t * 100)));
      onMove(t);
    };
    const fromEvent = (e) => {
      const r = track.getBoundingClientRect();
      if (opts.inverted) return startT - (e.clientX - startX) / (r.width - 44);
      return (e.clientX - r.left - grab) / (r.width - 44);
    };
    handle.addEventListener('pointerdown', (e) => {
      if (api.isLocked()) return;
      e.preventDefault();
      dragging = true;
      try { handle.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointer */ }
      grab = e.clientX - handle.getBoundingClientRect().left;
      startX = e.clientX; startT = t;
      track.classList.add('active');
      if (opts.onGrab) opts.onGrab();
      api.clearError();
    });
    handle.addEventListener('pointermove', (e) => { if (dragging) set(fromEvent(e)); });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('active');
      if (opts.onDrop) opts.onDrop();
      onRelease(t);
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', (e) => {
      if (api.isLocked()) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(t + 0.01); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(t - 0.01); e.preventDefault(); }
      if (e.key === 'Enter' || e.key === ' ') { onRelease(t); e.preventDefault(); }
    });
    set(opts.start || 0);
    return { el: track, set, get t() { return t; }, get dragging() { return dragging; }, reset() { track.classList.add('snap'); set(0); setTimeout(() => track.classList.remove('snap'), 300); } };
  }

  Challenges.slider = {
    render(api) {
      const cfg = api.level.config || {};
      api.showVerify(false);

      if (cfg.mode === 'puzzle') {
        const W = 300, H = 170, P = 50;
        let gapX, gapY;
        const scene = ART.puzzleScene();
        const stage = h('div', { class: 'puzzle' });
        const bg = h('div', { class: 'puzzle-bg', html: scene });
        const gap = h('div', { class: 'puzzle-gap' });
        const inner = h('div', { class: 'puzzle-piece-inner', html: scene });
        const piece = h('div', { class: 'puzzle-piece' }, inner);
        stage.append(bg, gap, piece);

        let x = 0;
        const place = () => {
          gapX = randInt(120, 235); gapY = randInt(25, 95);
          const pct = (v, of) => (v / of) * 100 + '%';
          Object.assign(gap.style, { left: pct(gapX, W), top: pct(gapY, H), width: pct(P, W), height: pct(P, H) });
          Object.assign(piece.style, { top: pct(gapY, H), width: pct(P, W), height: pct(P, H) });
          Object.assign(inner.style, { width: (W / P) * 100 + '%', height: (H / P) * 100 + '%', left: -(gapX / P) * 100 + '%', top: -(gapY / P) * 100 + '%' });
        };
        const track = makeTrack(api,
          (t) => { x = t * (W - P); piece.style.left = (x / W) * 100 + '%'; },
          (t) => { if (t > 0.01) api.submit({ x, gapX }); });
        place();
        api.body.append(stage, track.el);
        api.onFail(() => api.after(350, () => track.reset()));
        api.onReload(() => { place(); track.reset(); });
        return;
      }

      // plain value slider (+ inverted / shaky variants)
      const readout = h('div', { class: 'slider-readout' }, '0');
      const fmt = cfg.format || ((v) => v + (cfg.unit || ''));
      let value = 0;
      let holding = false;
      const track = makeTrack(api,
        (t) => { value = Math.round(t * 100); readout.textContent = fmt(value); },
        () => { if (cfg.submit !== 'verify' && cfg.mode !== 'shaky') api.submit({ value }); },
        { inverted: cfg.inverted, start: cfg.start || 0, onGrab: () => { holding = true; }, onDrop: () => { holding = false; } });
      track.el.querySelector('.slider-hint').textContent = cfg.hintText || '';
      const parts = [readout, track.el];
      if (cfg.labels) parts.push(h('div', { class: 'slider-labels' }, cfg.labels.map((l) => h('span', null, l))));
      api.body.append(...parts);
      if (cfg.submit === 'verify') { api.showVerify(true); api.setAnswer(() => ({ value })); }
      if (cfg.inverted) api.onFail(() => api.after(300, () => track.set(cfg.start || 0)));

      if (cfg.mode === 'shaky') {
        const hand = h('div', { class: 'robot-hand' }, '🦾');
        track.el.appendChild(hand);
        const target = cfg.target || 100;
        let held = 0;
        const status = h('div', { class: 'shaky-status' }, cfg.status || "The robot's hand is shaking. Hold the handle to steady it.");
        api.body.appendChild(status);
        let drift = 0;
        api.loop((dt) => {
          if (holding) {
            drift = 0; // your hand steadies it completely
          } else {
            drift += (Math.random() - 0.5) * 0.12;
            drift *= 0.9;
            track.set(track.t + drift - 0.0025); // shaky, and slowly sliding back on its own
          }
          hand.style.left = `calc(${track.t * 100}% - ${track.t * 44}px)`;
          hand.classList.toggle('steady', holding);
          if (value >= target - 1) {
            held += dt;
            status.textContent = held > 0.2 ? 'Steady… steady…' : status.textContent;
            if (held >= (cfg.holdTime || 1.2)) { api.submit({ value }); return false; }
          } else {
            held = 0;
            if (holding) status.textContent = 'Together. Slowly, all the way to the end.';
          }
          return true;
        });
      }
    },
  };
})();
