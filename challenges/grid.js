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

  Challenges.grid = {
    render(api) {
      const cfg = api.level.config || {};
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

      if (cfg.resetOnFail) {
        api.onFail(() => {
          tiles.forEach((t) => { t.sel = false; t.el.classList.remove('sel'); t.el.setAttribute('aria-pressed', 'false'); });
          update();
        });
      }
    },
  };
})();
