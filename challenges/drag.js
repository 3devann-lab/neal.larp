/* drag — drag-and-drop with mouse or touch (Pointer Events).
 * config.mode 'pairs': config.items = [{id, art, opts}]. Each item appears
 *   once as a fixed target and once as a loose piece; drop the piece on its
 *   twin. Wrong drops bounce back and count as a mistake.
 * Answer: { done: true } when all pairs are matched.
 *
 * config.mode 'spell': config.tiles = [{ch, rot}], config.word. Drag tiles into
 *   the slots; tap a tile to rotate it 90°. Answer: { slots: [{ch, rot}|null] }
 * config.mode 'rank': config.items = [label…]. Reorder by dragging. Answer: { order }
 * config.mode 'builder': paint a 3×3 grid with emoji from config.palette and pick
 *   a target. Answer: { cells, target }
 */
(function () {
  'use strict';
  const { h, shuffle } = U;

  /** Make `el` draggable; onDrop(x, y) returns true to keep it, false to bounce.
   *  opts.onTap() fires instead when the pointer barely moved. */
  function draggable(api, el, onDrop, opts = {}) {
    let sx = 0, sy = 0, active = false, moved = false;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => {
      if (api.isLocked() || el.dataset.locked) return;
      e.preventDefault();
      active = true;
      moved = false;
      sx = e.clientX; sy = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointer */ }
      el.classList.add('dragging');
      el.style.transition = 'none';
      api.sound.pop();
      api.clearError();
    });
    el.addEventListener('pointermove', (e) => {
      if (!active) return;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) moved = true;
      if (!moved) return;
      el.style.transform = `translate(${e.clientX - sx}px, ${e.clientY - sy}px)${opts.keepRotation ? ' ' + opts.keepRotation() : ' rotate(-4deg)'} scale(1.06)`;
    });
    const end = (e) => {
      if (!active) return;
      active = false;
      el.classList.remove('dragging');
      el.style.transition = '';
      if (!moved && opts.onTap) { el.style.transform = opts.keepRotation ? opts.keepRotation() : ''; opts.onTap(); return; }
      const keep = onDrop(e.clientX, e.clientY);
      if (!keep) el.style.transform = opts.keepRotation ? opts.keepRotation() : '';
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
        return;
      }

      // -------------------------------------------------- spell with rotatable tiles
      if (cfg.mode === 'spell') {
        api.showVerify(true);
        const slots = Array.from({ length: cfg.word.length }, () => h('div', { class: 'letter-slot' }));
        const tray = h('div', { class: 'letter-tray' });
        const tiles = shuffle(cfg.tiles).map((t) => {
          const el = h('div', { class: 'letter-tile', 'aria-label': 'Letter tile' }, h('span', null, t.ch));
          const tile = { ch: t.ch, rot: t.rot || 0, el, slot: null };
          const rotCss = () => `rotate(${tile.rot}deg)`;
          el.firstChild.style.transform = rotCss();
          tray.appendChild(el);
          draggable(api, el, (x, y) => {
            const target = slots.find((s) => U.inRect(x, y, s.getBoundingClientRect(), 8));
            if (target && target.firstChild && target.firstChild !== el) {
              const other = tiles.find((o) => o.el === target.firstChild);
              tray.appendChild(other.el); other.slot = null;
            }
            if (target) { target.appendChild(el); tile.slot = target; }
            else { tray.appendChild(el); tile.slot = null; }
            el.style.transform = '';
            api.sound.tick();
            api.clearError();
            return true;
          }, {
            onTap: () => { tile.rot = (tile.rot + 90) % 360; el.firstChild.style.transform = rotCss(); api.sound.click(); },
          });
          return tile;
        });
        api.body.appendChild(h('div', { class: 'spell' },
          h('div', { class: 'letter-slots' }, slots),
          h('div', { class: 'drag-label' }, 'Tiles (tap to rotate, drag to place)'),
          tray));
        api.setAnswer(() => ({ slots: slots.map((s) => { const t = tiles.find((x) => x.el === s.firstChild); return t ? { ch: t.ch, rot: t.rot } : null; }) }));
        return;
      }

      // -------------------------------------------------- rank (sortable list)
      if (cfg.mode === 'rank') {
        api.showVerify(true);
        const list = h('ol', { class: 'rank-list' });
        (cfg.shuffle === false ? cfg.items : shuffle(cfg.items)).forEach((label) => {
          const li = h('li', { class: 'rank-item', dataset: { label } }, h('span', { class: 'rank-grip', 'aria-hidden': 'true' }, '⋮⋮'), h('span', null, label));
          list.appendChild(li);
          let active = false, grab = 0, dy = 0;
          li.style.touchAction = 'none';
          const follow = (clientY) => {
            const natural = li.getBoundingClientRect().top - dy;
            dy = (clientY - grab) - natural;
            li.style.transform = `translateY(${dy}px)`;
          };
          li.addEventListener('pointerdown', (e) => {
            if (api.isLocked()) return;
            e.preventDefault();
            active = true;
            try { li.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
            li.classList.add('dragging');
            dy = 0;
            grab = e.clientY - li.getBoundingClientRect().top;
            api.sound.pop();
          });
          li.addEventListener('pointermove', (e) => {
            if (!active) return;
            follow(e.clientY);
            const mid = e.clientY - grab + li.offsetHeight / 2;
            let before = null;
            for (const c of list.children) {
              if (c === li) continue;
              const r = c.getBoundingClientRect();
              if (mid < r.top + r.height / 2) { before = c; break; }
            }
            if (before !== li.nextSibling && before !== li) {
              list.insertBefore(li, before);
              follow(e.clientY);
              api.sound.tick();
            }
          });
          const end = () => { if (!active) return; active = false; li.classList.remove('dragging'); li.style.transform = ''; };
          li.addEventListener('pointerup', end);
          li.addEventListener('pointercancel', end);
          li.tabIndex = 0;
          li.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' && li.previousSibling) { list.insertBefore(li, li.previousSibling); li.focus(); e.preventDefault(); }
            if (e.key === 'ArrowDown' && li.nextSibling) { list.insertBefore(li.nextSibling, li); li.focus(); e.preventDefault(); }
          });
        });
        api.body.appendChild(h('div', { class: 'rank' }, h('div', { class: 'drag-label' }, cfg.topLabel || 'Most important'), list, h('div', { class: 'drag-label' }, cfg.bottomLabel || 'Least important')));
        api.setAnswer(() => ({ order: [...list.children].map((c) => c.dataset.label) }));
        return;
      }

      // -------------------------------------------------- builder (design a CAPTCHA)
      if (cfg.mode === 'builder') {
        api.showVerify(true);
        const palette = cfg.palette;
        let brush = palette[0];
        let target = null;
        const cells = Array(9).fill(null);
        const swatches = palette.map((e) => {
          const b = h('button', { class: 'swatch', type: 'button', 'aria-label': 'Brush ' + e }, e);
          b.addEventListener('click', () => { brush = e; swatches.forEach((s) => s.classList.toggle('on', s === b)); api.sound.click(); });
          return b;
        });
        swatches[0].classList.add('on');
        const grid = h('div', { class: 'grid builder', style: { gridTemplateColumns: 'repeat(3, 1fr)' } });
        const cellEls = cells.map((_, i) => {
          const c = h('button', { class: 'tile build-cell', type: 'button', 'aria-label': 'Cell ' + (i + 1) }, '+');
          c.addEventListener('click', () => { cells[i] = brush; c.textContent = brush; c.classList.add('filled'); api.sound.pop(); api.clearError(); refreshTargets(); });
          grid.appendChild(c);
          return c;
        });
        const targetRow = h('div', { class: 'target-row' });
        const refreshTargets = () => {
          targetRow.innerHTML = '';
          targetRow.appendChild(h('span', null, 'Select all squares with: '));
          [...new Set(cells.filter(Boolean))].forEach((e) => {
            const b = h('button', { class: 'swatch small' + (e === target ? ' on' : ''), type: 'button' }, e);
            b.addEventListener('click', () => { target = e; refreshTargets(); api.sound.click(); });
            targetRow.appendChild(b);
          });
          if (!cells.some(Boolean)) targetRow.appendChild(h('em', { class: 'muted' }, 'paint some squares first'));
        };
        const random = h('button', { class: 'link-btn', type: 'button' }, '🎲 Fill randomly');
        random.addEventListener('click', () => {
          cells.forEach((_, i) => { cells[i] = palette[Math.floor(Math.random() * 3)]; cellEls[i].textContent = cells[i]; cellEls[i].classList.add('filled'); });
          target = cells[0];
          refreshTargets();
        });
        refreshTargets();
        api.body.appendChild(h('div', { class: 'builder-wrap' },
          h('div', { class: 'drag-label' }, '1. Pick a brush, tap squares to paint'),
          h('div', { class: 'swatches' }, swatches), grid, random,
          h('div', { class: 'drag-label' }, '2. Choose what the robot must find'), targetRow));
        api.setAnswer(() => ({ cells: cells.slice(), target }));
      }
    },
  };
})();
