/* slider — drag a handle.
 * config.mode:
 *   'puzzle'  slide a puzzle piece into its gap. Answer: { x, gapX } in scene units (0–300)
 *   'value'   plain 0–100 slider. config.reverse flips the direction. Answer: { value }
 *             config.submit: 'release' (default) or 'verify'
 */
(function () {
  'use strict';
  const { h, clamp, randInt } = U;

  function makeTrack(api, onMove, onRelease) {
    const fill = h('div', { class: 'slider-fill' });
    const handle = h('div', {
      class: 'slider-handle', role: 'slider', tabindex: '0', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0',
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    });
    const track = h('div', { class: 'slider-track' }, fill, h('span', { class: 'slider-hint' }, 'Slide to complete the puzzle'), handle);
    let t = 0, dragging = false, grab = 0;

    const set = (nt) => {
      t = clamp(nt, 0, 1);
      handle.style.left = `calc(${t * 100}% - ${t * 44}px)`;
      fill.style.width = `calc(${t * 100}% - ${t * 44}px + 22px)`;
      handle.setAttribute('aria-valuenow', String(Math.round(t * 100)));
      onMove(t);
    };
    const fromEvent = (e) => {
      const r = track.getBoundingClientRect();
      return (e.clientX - r.left - grab) / (r.width - 44);
    };
    handle.addEventListener('pointerdown', (e) => {
      if (api.isLocked()) return;
      e.preventDefault();
      dragging = true;
      try { handle.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointer */ }
      grab = e.clientX - handle.getBoundingClientRect().left;
      track.classList.add('active');
      api.clearError();
    });
    handle.addEventListener('pointermove', (e) => { if (dragging) set(fromEvent(e)); });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('active');
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
    set(0);
    return { el: track, set, reset() { track.classList.add('snap'); set(0); setTimeout(() => track.classList.remove('snap'), 300); } };
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

      // plain value slider
      const readout = h('div', { class: 'slider-readout' }, '0');
      let value = 0;
      const track = makeTrack(api,
        (t) => { value = Math.round((cfg.reverse ? 1 - t : t) * 100); readout.textContent = (cfg.format || ((v) => v))(value); },
        () => { if (cfg.submit !== 'verify') api.submit({ value }); });
      track.el.querySelector('.slider-hint').textContent = cfg.hintText || '';
      api.body.append(readout, track.el);
      if (cfg.submit === 'verify') { api.showVerify(true); api.setAnswer(() => ({ value })); }
    },
  };
})();
