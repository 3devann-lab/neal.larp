/* audio — listen and answer.
 * config.mode 'digits': speaks N random digits (speech synthesis) and asks
 * the player to type them. A written fallback is always one tap away, for
 * players without sound or without speech synthesis.
 * Answer: { typed, expected }
 */
(function () {
  'use strict';
  const { h, randInt } = U;
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

  /** Play a chord with WebAudio (ignores the SFX mute: this is the challenge itself). */
  let actx = null;
  function chord(freqs, type = 'triangle') {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    actx = actx || new AC();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime;
    freqs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.09, t + i * 0.12 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      o.connect(g).connect(actx.destination);
      o.start(t + i * 0.12);
      o.stop(t + 1.9);
    });
    return true;
  }

  function chords(api, cfg) {
    api.showVerify(false);
    const wrap = h('div', { class: 'chords' });
    const desc = h('p', { class: 'muted center' }, 'Tap ▶ to listen. Then pick one.');
    cfg.sounds.forEach((snd) => {
      const play = h('button', { class: 'audio-play small', type: 'button', 'aria-label': 'Play ' + snd.name, html: '<span class="audio-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>' });
      const choose = h('button', { class: 'choice-btn', type: 'button' }, snd.name);
      const card = h('div', { class: 'chord-card' }, play, h('div', { class: 'chord-wave', 'aria-hidden': 'true' }, Array.from({ length: 10 }, () => h('i'))), choose);
      play.addEventListener('click', () => {
        if (!chord(snd.freqs, snd.wave)) { desc.textContent = 'Your browser has no audio engine. Go with your gut.'; return; }
        card.classList.remove('playing'); void card.offsetWidth; card.classList.add('playing');
      });
      choose.addEventListener('click', () => { if (!api.isLocked()) api.submit(snd); });
      wrap.appendChild(card);
    });
    api.body.append(desc, wrap);
  }

  Challenges.audio = {
    render(api) {
      const cfg = api.level.config || {};
      if (cfg.mode === 'chords') return chords(api, cfg);
      const n = cfg.length || 5;
      let digits = '';
      const canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

      const playBtn = h('button', { class: 'audio-play', type: 'button', 'aria-label': 'Play audio' },
        h('span', { class: 'audio-icon', html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>' }),
        h('span', null, 'Play'));
      const bars = h('div', { class: 'audio-bars', 'aria-hidden': 'true' },
        Array.from({ length: 16 }, () => h('i')));
      const transcript = h('div', { class: 'audio-transcript', hidden: true });
      const fallbackBtn = h('button', { class: 'link-btn', type: 'button' }, "Can't play audio? Read it instead");
      const input = h('input', {
        class: 'text-input', type: 'text', inputmode: 'numeric', autocomplete: 'off',
        placeholder: 'Enter the digits you hear', 'aria-label': 'Digits you heard', enterkeyhint: 'done',
      });
      api.body.appendChild(h('div', { class: 'audio-challenge' },
        h('div', { class: 'audio-player' }, playBtn, bars), fallbackBtn, transcript, input));

      const gen = () => {
        digits = Array.from({ length: n }, () => randInt(0, 9)).join('');
        transcript.textContent = digits.split('').map((d) => WORDS[d]).join(' · ');
      };
      gen();

      const animate = (ms) => {
        bars.classList.add('playing');
        api.after(ms, () => bars.classList.remove('playing'));
      };

      playBtn.addEventListener('click', () => {
        if (!canSpeak) {
          transcript.hidden = false;
          api.flavor('Your browser has no voice. Neither do I, technically. Here it is in writing.');
          return;
        }
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(digits.split('').join(', '));
        u.rate = 0.75; u.pitch = 0.9 + Math.random() * 0.3;
        window.speechSynthesis.speak(u);
        animate(n * 900);
        if (U.finePointer()) input.focus();
      });
      fallbackBtn.addEventListener('click', () => { transcript.hidden = !transcript.hidden; });
      api.onCleanup(() => { if (canSpeak) window.speechSynthesis.cancel(); });

      const sync = () => api.setVerifyEnabled(input.value.replace(/\D/g, '').length > 0);
      input.addEventListener('input', () => { api.clearError(); sync(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); api.verify(); } });
      sync();

      api.onReload(() => { gen(); input.value = ''; sync(); });
      api.setAnswer(() => ({ typed: input.value, expected: digits }));
      api.onFail(() => { gen(); input.value = ''; sync(); });
    },
  };
})();
