/* grid — select squares.
 * config:
 *   cols, rows            grid size (default 3×3)
 *   tiles: [{art, opts, tag}]   one illustration per tile (shuffled unless shuffle:false)
 *   split: 'hydrantScene' one big illustration cut across all tiles
 *   splitTags: {index: tag}     tags for split tiles (others get tag 'none')
 *   resetOnFail: true     clear the selection after a wrong answer
 * Answer: { tiles: [{tag, selected}], selected: [tag, …] }
 */
(function () {
  'use strict';
  const { h, shuffle } = U;

  const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5 L10.2 16.5 L18 8" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /** Simon says: watch the squares light up, then repeat the order. Answer: { ok } */
  function simon(api, cfg) {
    api.showVerify(false);
    const n = 9;
    const colors = ['#ef5350', '#ffa726', '#ffee58', '#66bb6a', '#26c6da', '#42a5f5', '#7e57c2', '#ec407a', '#8d6e63'];
    const notes = [262, 294, 330, 349, 392, 440, 494, 523, 587];
    const grid = h('div', { class: 'grid simon', style: { gridTemplateColumns: 'repeat(3, 1fr)' } });
    const status = h('div', { class: 'simon-status', 'aria-live': 'polite' }, 'Watch…');
    const cells = Array.from({ length: n }, (_, i) => {
      const c = h('button', { class: 'tile simon-cell', type: 'button', 'aria-label': 'Square ' + (i + 1) });
      c.style.setProperty('--c', colors[i]);
      grid.appendChild(c);
      return c;
    });
    api.body.append(status, grid);
    let seq = [], pos = 0, input = false;
    const flash = (i, ms = 420) => {
      cells[i].classList.add('lit');
      api.sound.tone(notes[i], ms / 1000, 'triangle', 0.1);
      api.after(ms, () => cells[i].classList.remove('lit'));
    };
    const play = () => {
      input = false;
      pos = 0;
      status.textContent = 'Watch…';
      seq = [];
      while (seq.length < (cfg.length || 5)) { const r = Math.floor(Math.random() * n); if (r !== seq[seq.length - 1]) seq.push(r); }
      seq.forEach((v, k) => api.after(700 + k * 650, () => flash(v)));
      api.after(700 + seq.length * 650, () => { input = true; status.textContent = 'Your turn. Repeat the order.'; });
    };
    cells.forEach((c, i) => c.addEventListener('click', () => {
      if (!input || api.isLocked()) return;
      flash(i, 220);
      if (seq[pos] !== i) { input = false; api.fail(`Square ${pos + 1} was wrong. Watch again.`); return; }
      pos++;
      status.textContent = `${pos} / ${seq.length}`;
      if (pos >= seq.length) { input = false; api.submit({ ok: true }); }
    }));
    api.onFail(() => api.after(600, play));
    api.onReload(play);
    play();
  }

  Challenges.grid = {
    render(api, override) {
      const cfg = override || api.level.config || {};
      if (cfg.mode === 'simon') return simon(api, cfg);
      const cols = cfg.cols || 3;
      const rows = cfg.rows || cols;
      const n = cols * rows;

      let tiles;
      if (cfg.split) {
        const art = ART[cfg.split]();
        tiles = Array.from({ length: n }, (_, i) => ({
          i, tag: (cfg.splitTags && cfg.splitTags[i]) || 'none', html: art,
        }));
      } else {
        const list = cfg.shuffle === false ? cfg.tiles : shuffle(cfg.tiles);
        tiles = list.slice(0, n).map((t, i) => ({
          i, tag: t.tag || 'none', html: ART[t.art](Object.assign({ v: i }, t.opts || {})),
        }));
      }

      const grid = h('div', {
        class: 'grid' + (cfg.split ? ' split' : ''),
        style: { gridTemplateColumns: `repeat(${cols}, 1fr)` },
        role: 'group', 'aria-label': 'Image grid',
      });

      const update = () => {
        const any = tiles.some((t) => t.sel);
        api.setVerifyLabel(any || cfg.noSkip ? 'Verify' : 'Skip');
      };

      tiles.forEach((t) => {
        let img;
        if (cfg.split) {
          const r = Math.floor(t.i / cols), c = t.i % cols;
          img = h('div', { class: 'tile-img' },
            h('div', {
              class: 'split-inner', html: t.html,
              style: { width: cols * 100 + '%', height: rows * 100 + '%', left: -c * 100 + '%', top: -r * 100 + '%' },
            }));
        } else {
          img = h('div', { class: 'tile-img', html: t.html });
        }
        const el = h('button', { class: 'tile', type: 'button', 'aria-pressed': 'false', 'aria-label': 'Tile ' + (t.i + 1) },
          img, h('span', { class: 'tile-check', html: TICK }));
        el.addEventListener('click', () => {
          if (api.isLocked()) return;
          t.sel = !t.sel;
          el.classList.toggle('sel', t.sel);
          el.setAttribute('aria-pressed', String(t.sel));
          api.sound.click();
          api.clearError();
          update();
        });
        t.el = el;
        grid.appendChild(el);
      });

      api.body.appendChild(grid);
      update();

      api.setAnswer(() => ({
        tiles: tiles.map((t) => ({ tag: t.tag, selected: !!t.sel })),
        selected: tiles.filter((t) => t.sel).map((t) => t.tag),
      }));

      if (cfg.shuffleEvery) {
        api.every(cfg.shuffleEvery, () => {
          grid.classList.add('shuffling');
          api.after(160, () => {
            shuffle(tiles).forEach((t) => grid.appendChild(t.el));
            grid.classList.remove('shuffling');
          });
        });
      }

      if (cfg.resetOnFail) {
        api.onFail(() => {
          tiles.forEach((t) => { t.sel = false; t.el.classList.remove('sel'); t.el.setAttribute('aria-pressed', 'false'); });
          update();
        });
      }
    },
  };
})();
