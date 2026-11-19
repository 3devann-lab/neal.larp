/* checkbox — the classic "I'm not a robot" anchor widget.
 * config.spin: spinner duration in ms (default 1100)
 * config.impatient: lines shown when the player clicks during the spinner.
 *   Each extra click restarts the spinner (and counts toward Clickaholic).
 * Submits `true` once checked.
 */
(function () {
  'use strict';
  const { h } = U;

  const CHECK_SVG =
    '<svg class="ck" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 21 L16 29 L33 10"/></svg>';

  Challenges.checkbox = {
    render(api) {
      const cfg = api.level.config || {};
      api.setMode('anchor');

      const box = h('button', {
        class: 'cbx', type: 'button', role: 'checkbox', 'aria-checked': 'false',
        'aria-label': typeof api.level.prompt === 'string' ? api.level.prompt : "I'm not a robot",
        html: CHECK_SVG,
      });
      const label = h('span', { class: 'anchor-label' }, api.level.prompt);
      const row = h('div', { class: 'anchor-row' },
        h('div', { class: 'anchor-left' }, box, label),
        api.brandBlock());
      api.body.appendChild(row);

      let phase = 'idle';
      let timer = null;
      let extra = 0;
      const lines = cfg.impatient || [];

      const finish = () => {
        phase = 'done';
        box.classList.remove('spinning');
        box.classList.add('checked');
        box.setAttribute('aria-checked', 'true');
        api.after(380, () => api.submit(true));
      };

      const onClick = () => {
        if (api.isLocked()) return;
        api.countCheckboxClick();
        if (phase === 'done') return;
        if (phase === 'spinning') {
          extra++;
          api.sound.tick();
          if (lines.length) api.flavor(lines[Math.min(extra - 1, lines.length - 1)]);
          box.classList.remove('spinning');
          void box.offsetWidth; // restart animation
        } else {
          api.sound.click();
        }
        phase = 'spinning';
        box.classList.add('spinning');
        clearTimeout(timer);
        timer = api.after(cfg.spin || 1100, finish);
      };
      box.addEventListener('click', onClick);
    },
  };
})();
