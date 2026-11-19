/* drag — drag-and-drop with mouse or touch (Pointer Events).
 * config.mode 'pairs': config.items = [{id, art, opts}]. Each item appears
 *   once as a fixed target and once as a loose piece; drop the piece on its
 *   twin. Wrong drops bounce back and count as a mistake.
 * Answer: { done: true } when all pairs are matched.
 */
(function () {
  'use strict';
  const { h, shuffle } = U;

  /** Make `el` draggable; onDrop(x, y) returns true to keep it, false to bounce. */
  function draggable(api, el, onDrop) {
    let sx = 0, sy = 0, active = false;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => {
      if (api.isLocked() || el.dataset.locked) return;
      e.preventDefault();
      active = true;
      sx = e.clientX; sy = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointer */ }
      el.classList.add('dragging');
      el.style.transition = 'none';
      api.sound.pop();
      api.clearError();
    });
    el.addEventListener('pointermove', (e) => {
      if (!active) return;
      el.style.transform = `translate(${e.clientX - sx}px, ${e.clientY - sy}px) rotate(-4deg) scale(1.06)`;
    });
    const end = (e) => {
      if (!active) return;
      active = false;
      el.classList.remove('dragging');
      const keep = onDrop(e.clientX, e.clientY);
      el.style.transition = '';
      if (!keep) el.style.transform = '';
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', (e) => { if (active) { active = false; el.classList.remove('dragging'); el.style.transform = ''; } });
  }

  Challenges.drag = {
    draggable,
    render(api) {
      const cfg = api.level.config || {};
      api.showVerify(false);

      if (cfg.mode === 'pairs') {
        const items = cfg.items;
        const targets = h('div', { class: 'pair-targets' });
        const tray = h('div', { class: 'pair-tray' });
        let matched = 0;
        const slots = [];

        shuffle(items).forEach((it) => {
          const slot = h('div', { class: 'pair-slot', dataset: { id: it.id } },
            h('div', { class: 'pair-fixed', html: ART[it.art](it.opts) }));
          slots.push(slot);
          targets.appendChild(slot);
        });

        shuffle(items).forEach((it) => {
          const piece = h('div', { class: 'pair-piece', dataset: { id: it.id }, html: ART[it.art](it.opts), 'aria-label': 'Draggable item' });
          tray.appendChild(piece);
          draggable(api, piece, (x, y) => {
            const slot = slots.find((s) => U.inRect(x, y, s.getBoundingClientRect(), 6));
            if (!slot || slot.dataset.filled) return false;
            if (slot.dataset.id !== it.id) {
              api.fail(cfg.wrongMsg || "Those two don't match.");
              return false;
            }
            slot.dataset.filled = '1';
            piece.dataset.locked = '1';
            piece.style.transform = '';
            slot.classList.add('filled');
            slot.appendChild(piece);
            api.sound.tick();
            matched++;
            if (matched === items.length) api.after(350, () => api.submit({ done: true }));
            return true;
          });
        });

        api.body.appendChild(h('div', { class: 'drag-pairs' },
          h('div', { class: 'drag-label' }, cfg.targetLabel || 'Lonely'),
          targets,
          h('div', { class: 'drag-label' }, cfg.trayLabel || 'Loose'),
          tray));
      }
    },
  };
})();
