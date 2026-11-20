/* text — type what you see.
 * config:
 *   render: 'distort' | 'plain'
 *   word:   fixed answer (otherwise random, regenerated on reload/fail)
 *   length: random answer length (default 6)
 *   render: 'none' hides the display
 *   placeholder
 *   mode:   'shift'       every letter you type comes out as the next letter of the alphabet
 *           'autocorrect' typing a space right after the word "not" deletes it; pastes are scrubbed
 *           'possessed'   the field types config.word by itself, whatever keys you press
 *           'free'        anything with at least config.minWords words
 * Answer: { typed, expected }
 */
(function () {
  'use strict';
  const { h, rand, randString } = U;

  function drawDistorted(canvas, text) {
    const W = 300, H = 90;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const g = canvas.getContext('2d');
    g.scale(dpr, dpr);
    // paper
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(0,0,0,${rand(0.03, 0.12)})`;
      g.fillRect(rand(0, W), rand(0, H), 1.4, 1.4);
    }
    // letters along a wave
    const phase = rand(0, Math.PI * 2);
    const step = (W - 60) / text.length;
    for (let i = 0; i < text.length; i++) {
      const x = 34 + i * step + rand(-3, 3);
      const y = H / 2 + 12 + Math.sin(phase + i * 0.9) * 9;
      g.save();
      g.translate(x, y);
      g.rotate(rand(-0.45, 0.45));
      g.transform(1, 0, rand(-0.35, 0.35), 1, 0, 0);
      g.font = `${Math.round(rand(34, 42))}px Georgia, 'Times New Roman', serif`;
      g.fillStyle = `hsl(${rand(200, 260)}, 30%, ${rand(15, 30)}%)`;
      g.textAlign = 'center';
      g.fillText(text[i], 0, 0);
      g.restore();
    }
    // strike-through scribbles
    for (let k = 0; k < 2; k++) {
      g.beginPath();
      g.lineWidth = rand(1.4, 2.4);
      g.strokeStyle = 'rgba(40,40,70,.7)';
      g.moveTo(0, rand(25, 65));
      for (let x = 0; x <= W; x += 20) g.lineTo(x, H / 2 + Math.sin(x / 30 + k * 2 + phase) * 18);
      g.stroke();
    }
  }

  Challenges.text = {
    render(api) {
      const cfg = api.level.config || {};
      let expected = '';
      const wrap = h('div', { class: 'text-challenge' });
      let display;
      if (cfg.render === 'distort') {
        display = h('canvas', { class: 'text-canvas', role: 'img', 'aria-label': 'Distorted text' });
      } else if (cfg.render === 'none') {
        display = h('div', { hidden: true });
      } else {
        display = h('div', { class: 'text-plain' });
      }
      const input = h('input', {
        class: 'text-input', type: 'text', autocomplete: 'off', autocapitalize: 'off',
        autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done',
        placeholder: cfg.placeholder || 'Type the text', 'aria-label': 'Your answer',
      });
      const note = h('div', { class: 'text-note', 'aria-live': 'polite' });
      wrap.append(display, input, note);
      if (cfg.caption) wrap.insertBefore(h('div', { class: 'text-caption' }, cfg.caption), input);
      api.body.appendChild(wrap);
      let prev = '';
      const flashNote = (t) => { note.textContent = t; note.classList.remove('pop'); void note.offsetWidth; note.classList.add('pop'); };

      const gen = () => {
        expected = cfg.word || randString(cfg.length || 6);
        if (cfg.render === 'distort') drawDistorted(display, expected);
        else display.textContent = expected;
        display.setAttribute('aria-label', cfg.render === 'distort' ? 'Distorted text' : expected);
      };
      gen();

      const words = () => input.value.trim().split(/\s+/).filter(Boolean).length;
      const sync = () => api.setVerifyEnabled(cfg.mode === 'free' ? words() >= (cfg.minWords || 1)
        : cfg.mode === 'possessed' ? input.value === cfg.word : input.value.trim().length > 0);

      const onInput = (e) => {
        const v = input.value;
        if (cfg.mode === 'shift') {
          // find the inserted segment by diffing against the previous value
          let a = 0;
          while (a < prev.length && a < v.length && prev[a] === v[a]) a++;
          let b = 0;
          while (b < prev.length - a && b < v.length - a && prev[prev.length - 1 - b] === v[v.length - 1 - b]) b++;
          const ins = v.slice(a, v.length - b);
          if (ins) {
            const shifted = ins.replace(/[a-z]/gi, (c) => {
              const up = c === c.toUpperCase();
              const n = String.fromCharCode(((c.toLowerCase().charCodeAt(0) - 97 + 1) % 26) + 97);
              return up ? n.toUpperCase() : n;
            });
            input.value = v.slice(0, a) + shifted + v.slice(v.length - b);
            input.setSelectionRange(a + shifted.length, a + shifted.length);
          }
        } else if (cfg.mode === 'autocorrect') {
          const caret = input.selectionStart;
          if (e && e.inputType === 'insertFromPaste' && /\bnot\b/i.test(v)) {
            input.value = v.replace(/\bnot\b ?/gi, '');
            flashNote('✨ Autocorrected your paste. I read pastes too.');
          } else if (v.length === prev.length + 1 && v[caret - 1] === ' ' && /(^|\s)not $/i.test(v.slice(0, caret))) {
            input.value = v.slice(0, caret - 4) + v.slice(caret);
            input.setSelectionRange(caret - 4, caret - 4);
            flashNote('✨ Autocorrected "not" → "". You\'re welcome!');
            api.sound.tone(1200, 0.06, 'sine', 0.06);
          }
        } else if (cfg.mode === 'possessed') {
          const n = Math.min(cfg.word.length, prev.length + 1);
          input.value = cfg.word.slice(0, n);
          if (n === cfg.word.length && !note.textContent) flashNote("Hm. Those aren't the keys you pressed.");
        }
        prev = input.value;
        api.clearError();
        sync();
      };
      input.addEventListener('input', onInput);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); api.verify(); } });
      sync();
      if (U.finePointer()) api.after(50, () => input.focus());

      if (!cfg.word) api.onReload(() => { gen(); input.value = ''; sync(); });
      api.setAnswer(() => ({ typed: input.value, expected }));
      api.onFail(() => {
        if (!cfg.word) gen();
        if (cfg.keepOnFail) return;
        input.value = '';
        prev = '';
        sync();
        if (U.finePointer()) input.focus();
      });
    },
  };
})();
