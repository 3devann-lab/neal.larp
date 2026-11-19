/* text — type what you see.
 * config:
 *   render: 'distort' | 'plain'
 *   word:   fixed answer (otherwise random, regenerated on reload/fail)
 *   length: random answer length (default 6)
 *   placeholder
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
      } else {
        display = h('div', { class: 'text-plain' });
      }
      const input = h('input', {
        class: 'text-input', type: 'text', autocomplete: 'off', autocapitalize: 'off',
        autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done',
        placeholder: cfg.placeholder || 'Type the text', 'aria-label': 'Your answer',
      });
      wrap.append(display, input);
      api.body.appendChild(wrap);

      const gen = () => {
        expected = cfg.word || randString(cfg.length || 6);
        if (cfg.render === 'distort') drawDistorted(display, expected);
        else display.textContent = expected;
        display.setAttribute('aria-label', cfg.render === 'distort' ? 'Distorted text' : expected);
      };
      gen();

      const sync = () => api.setVerifyEnabled(input.value.trim().length > 0);
      input.addEventListener('input', () => { api.clearError(); sync(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); api.verify(); } });
      sync();
      if (U.finePointer()) api.after(50, () => input.focus());

      if (!cfg.word) api.onReload(() => { gen(); input.value = ''; sync(); });
      api.setAnswer(() => ({ typed: input.value, expected }));
      api.onFail(() => {
        if (!cfg.word) gen();
        input.value = '';
        sync();
        if (U.finePointer()) input.focus();
      });
    },
  };
})();
