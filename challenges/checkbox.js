/* checkbox — the classic "I'm not a robot" anchor widget.
 * config.spin: spinner duration in ms (default 1100)
 * config.impatient: lines shown when the player clicks during the spinner.
 *   Each extra click restarts the spinner (and counts toward Clickaholic).
 * Submits `true` once checked.
 *
 * config.mode 'multi': config.options = [label…], config.answer = the right label.
 *   A list of small checkboxes; tick the right one. Answer: { label }
 * config.mode 'final': the anchor widget with a custom label and a signature line.
 */
(function () {
  'use strict';
  const { h } = U;

  const CHECK_SVG =
    '<svg class="ck" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 21 L16 29 L33 10"/></svg>';

  function multi(api, cfg) {
    api.showVerify(false);
    const list = h('div', { class: 'multi-cbx' });
    U.shuffle(cfg.options).forEach((label) => {
      const box = h('span', { class: 'cbx small', html: CHECK_SVG });
      const row = h('button', { class: 'multi-row', type: 'button', role: 'checkbox', 'aria-checked': 'false' }, box, h('span', null, label));
      row.addEventListener('click', () => {
        if (api.isLocked() || box.classList.contains('spinning')) return;
        api.countCheckboxClick();
        api.sound.click();
        box.classList.add('spinning');
        api.after(700, () => {
          box.classList.remove('spinning');
          if (label === cfg.answer) { box.classList.add('checked'); row.setAttribute('aria-checked', 'true'); }
          else { box.classList.add('nope'); api.after(900, () => box.classList.remove('nope')); }
          api.submit({ label });
        });
      });
      list.appendChild(row);
    });
    api.body.appendChild(list);
  }

  Challenges.checkbox = {
    render(api) {
      const cfg = api.level.config || {};
      if (cfg.mode === 'multi') return multi(api, cfg);
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
      if (cfg.mode === 'final') {
        api.widget.classList.add('final');
        api.body.appendChild(h('div', { class: 'signature' }, cfg.signature || 'Signed: you & stillCAPTCHA'));
      }

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
