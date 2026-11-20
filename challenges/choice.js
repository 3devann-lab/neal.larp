/* choice — multiple choice in several flavours.
 * config.mode:
 *   (default)     config.options = [{label, icon?, msg?, correct?}], config.question?
 *                 Picking an option submits it. Answer: the option object.
 *   'stroop'      "Click the word written in X ink". Answer: { ink, target }
 *   'interrogate' config.questions = [{q, options:[{label, comment}]}] with a lie-detector needle.
 *                 Answer: { answers: [label…] }
 *   'loop'        config.rounds = [{q, options:[{label, key}]}]. Answer: { keys: [...] }
 *   'dialogue'    config.lines = [string…] revealed one by one, then config.options.
 *                 Answer: the option object.
 * config.layout: 'list' (default) | 'grid' | 'cards'
 */
(function () {
  'use strict';
  const { h, shuffle, pick, rand } = U;

  const INKS = { red: '#d93025', blue: '#1a73e8', green: '#188038', orange: '#e8710a', purple: '#9334e6', black: '#202124' };

  Challenges.choice = {
    render(api) {
      const cfg = api.level.config || {};
      api.showVerify(false);
      const text = h('div', { class: 'choice-text' });
      const extra = h('div', { class: 'choice-extra' });
      const opts = h('div', { class: 'choice-options ' + (cfg.layout || 'list') });
      const note = h('div', { class: 'choice-note', 'aria-live': 'polite' });
      api.body.appendChild(h('div', { class: 'choice' }, extra, text, opts, note));

      const show = (q, options, onPick) => {
        text.textContent = q || '';
        text.hidden = !q;
        opts.innerHTML = '';
        options.forEach((o) => {
          const b = h('button', { class: 'choice-btn', type: 'button' },
            o.icon ? h('span', { class: 'choice-icon' }, o.icon) : null,
            h('span', { class: 'choice-label' }, o.label));
          if (o.style) Object.assign(b.style, o.style);
          b.addEventListener('click', () => {
            if (api.isLocked()) return;
            api.sound.click();
            api.clearError();
            onPick(o, b);
          });
          opts.appendChild(b);
        });
      };

      // ---------------------------------------------------------------- stroop
      if (cfg.mode === 'stroop') {
        const gen = () => {
          const names = Object.keys(INKS);
          const words = shuffle(names);
          let inks;
          do { inks = shuffle(words); } while (inks.some((ink, i) => ink === words[i]));
          const target = pick(names);
          api.setPrompt({ small: 'Click the word written in', big: target.toUpperCase() + ' ink', sub: 'The ink. Not the word. Humans can tell the difference.' });
          show('', words.map((w, i) => ({ label: w.toUpperCase(), ink: inks[i], style: { color: INKS[inks[i]], fontWeight: '700', letterSpacing: '1px' } })),
            (o) => api.submit({ ink: o.ink, target }));
        };
        opts.classList.add('grid');
        gen();
        api.onFail(gen);
        return;
      }

      // ---------------------------------------------------------------- interrogate
      if (cfg.mode === 'interrogate') {
        const needle = h('div', { class: 'needle' });
        extra.appendChild(h('div', { class: 'detector' },
          h('div', { class: 'detector-face' }, h('span', null, 'TRUTH'), h('span', null, '???'), h('span', null, 'LIE')),
          needle));
        let i = 0;
        const answers = [];
        let swing = null;
        const wobble = () => { needle.style.transform = `rotate(${rand(-12, 12)}deg)`; };
        swing = api.every(700, wobble);
        const ask = () => {
          const q = cfg.questions[i];
          show(q.q, q.options, (o) => {
            answers.push(o.label);
            clearInterval(swing);
            const angle = rand(-70, 70);
            needle.style.transform = `rotate(${angle}deg)`;
            note.textContent = o.comment || '';
            api.sound.tone(300 + (angle + 70) * 4, 0.25, 'square', 0.04);
            opts.querySelectorAll('button').forEach((b) => { b.disabled = true; });
            api.after(1500, () => {
              i++;
              note.textContent = '';
              swing = api.every(700, wobble);
              if (i < cfg.questions.length) ask();
              else api.submit({ answers });
            });
          });
        };
        ask();
        return;
      }

      // ---------------------------------------------------------------- loop
      if (cfg.mode === 'loop') {
        const keys = [];
        const round = () => {
          const r = cfg.rounds[keys.length];
          show(r.q, r.options, (o) => {
            keys.push(o.key || o.label);
            if (keys.length >= cfg.rounds.length) api.submit({ keys });
            else {
              opts.classList.add('fade');
              api.after(250, () => { opts.classList.remove('fade'); round(); });
            }
          });
        };
        round();
        return;
      }

      // ---------------------------------------------------------------- dialogue
      if (cfg.mode === 'dialogue') {
        const log = h('div', { class: 'dialogue' });
        extra.appendChild(log);
        let i = 0;
        const step = () => {
          if (i < cfg.lines.length) {
            const line = typeof cfg.lines[i] === 'function' ? cfg.lines[i](api.state) : cfg.lines[i];
            log.appendChild(h('p', { class: 'bubble' }, line));
            api.sound.tick();
            i++;
            show('', [{ label: i < cfg.lines.length ? (cfg.next || '…') : (cfg.lastNext || 'Go on') }], step);
          } else {
            const options = typeof cfg.options === 'function' ? cfg.options(api.state) : cfg.options;
            show(cfg.question || '', options, (o) => api.submit(o));
          }
        };
        step();
        return;
      }

      // ---------------------------------------------------------------- quiz (every round has a right answer)
      if (cfg.mode === 'quiz') {
        let i = 0;
        const round = () => {
          const r = cfg.rounds[i];
          show(`${i + 1}/${cfg.rounds.length} · ${r.q}`, r.options, (o) => {
            if (!o.correct) { api.fail(r.wrong || 'Not quite. Think back…', { soft: true, suspicion: 3 }); return; }
            api.sound.tone(700 + i * 80, 0.08, 'triangle', 0.07);
            if (++i >= cfg.rounds.length) api.submit({ done: true });
            else round();
          });
        };
        round();
        api.setBot(() => { const t = api.every(60, () => { if (api.isLocked()) { clearInterval(t); return; } const r = cfg.rounds[i]; const k = r.options.findIndex((o) => o.correct); opts.children[k].click(); }); });
        return;
      }

      // ---------------------------------------------------------------- default
      if (cfg.image) extra.appendChild(h('div', { class: 'choice-image', html: ART.photo({ src: cfg.image }) }));
      if (cfg.intro) extra.appendChild(h('p', { class: 'choice-intro' }, typeof cfg.intro === 'function' ? cfg.intro(api.state) : cfg.intro));
      const options = typeof cfg.options === 'function' ? cfg.options(api.state) : cfg.options;
      show(cfg.question || '', cfg.shuffle ? shuffle(options) : options, (o) => api.submit(o));
    },
  };
})();
