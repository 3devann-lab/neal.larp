/* hold — press and hold (mouse, touch, or Space/Enter).
 * config.mode:
 *   'exact'      hold for config.target seconds (± config.tol). The counter fades
 *                out after config.fadeAfter seconds. Answer: { held }
 *   'free'       hold as long as you like (min 1 s). config.lines = [[seconds, text]…]
 *                Answer: { held }
 *   'heartbeat'  hold for config.duration seconds without letting go. Answer: { held }
 * config.label: button text
 */
(function () {
  'use strict';
  const { h } = U;

  /** Breathe in (hold) while the circle grows, out (release) while it shrinks. */
  function breathe(api, cfg) {
    api.showVerify(false);
    const IN = cfg.inhale || 4, OUT = cfg.exhale || 4, cycles = cfg.cycles || 3;
    const orb = h('div', { class: 'breath-orb' });
    const label = h('div', { class: 'breath-label' }, 'Press and hold to breathe in');
    const meter = h('div', { class: 'countdown thin' }, h('div', { class: 'countdown-fill calm' }));
    const zone = h('button', { class: 'breath-zone', type: 'button', 'aria-label': 'Hold to breathe in' }, orb);
    api.body.appendChild(h('div', { class: 'breath' }, zone, label, meter));
    let holding = false, started = false, t = 0, inSync = 0, total = 0, bot = false;
    const down = (e) => { if (e && e.cancelable) e.preventDefault(); holding = true; started = true; };
    const up = () => { holding = false; };
    zone.addEventListener('pointerdown', down); zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up);
    zone.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); down(); } });
    zone.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(); });
    api.setBot(() => { bot = true; started = true; });
    api.loop((dt) => {
      if (!started) return true;
      t += dt;
      const per = IN + OUT, ph = t % per, inhale = ph < IN;
      if (bot) holding = inhale;
      const f = inhale ? ph / IN : 1 - (ph - IN) / OUT;
      orb.style.transform = `scale(${0.45 + f * 0.55})`;
      label.textContent = inhale ? 'Breathe in… (hold)' : 'Breathe out… (let go)';
      total += dt; if (holding === inhale) inSync += dt;
      meter.firstChild.style.width = Math.min(100, (t / (per * cycles)) * 100) + '%';
      if (t >= per * cycles) { api.submit({ sync: inSync / total }); return false; }
      return true;
    });
    api.onFail(() => { t = 0; inSync = 0; total = 0; started = false; label.textContent = 'Press and hold to breathe in'; });
  }

  Challenges.hold = {
    render(api) {
      const cfg = api.level.config || {};
      if (cfg.mode === 'breathe') { breathe(api, cfg); return; }
      const mode = cfg.mode || 'exact';
      api.showVerify(false);

      const C = 2 * Math.PI * 54;
      const ring = h('div', { class: 'hold-ring', html:
        `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="track"/><circle cx="60" cy="60" r="54" class="bar" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>` });
      const btn = h('button', { class: 'hold-btn' + (mode === 'heartbeat' ? ' heart' : ''), type: 'button' }, ring, h('span', { class: 'hold-label' }, cfg.label || 'Hold'));
      const readout = h('div', { class: 'hold-readout', 'aria-live': 'off' }, mode === 'exact' ? '0.00 s' : '');
      const caption = h('div', { class: 'hold-caption', 'aria-live': 'polite' }, cfg.caption || '');
      api.body.appendChild(h('div', { class: 'hold-wrap' }, btn, readout, caption));
      const bar = ring.querySelector('.bar');

      let t0 = null;
      let done = false;
      let lastBeat = 0;
      const setRing = (f) => { bar.style.strokeDashoffset = String(C * (1 - Math.max(0, Math.min(1, f)))); };

      const start = (e) => {
        if (api.isLocked() || t0 !== null) return;
        if (e && e.cancelable) e.preventDefault();
        if (e && e.pointerId !== undefined) { try { btn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } }
        t0 = performance.now();
        done = false;
        lastBeat = 0;
        btn.classList.add('holding');
        api.clearError();
        api.sound.pop();
        api.loop((dt, now) => {
          if (t0 === null) return false;
          const el = (now - t0) / 1000;
          if (mode === 'exact') {
            readout.textContent = el.toFixed(2) + ' s';
            const fa = cfg.fadeAfter == null ? 1 : cfg.fadeAfter;
            readout.style.opacity = String(Math.max(0, 1 - (el - fa) / 0.5));
            setRing((el % 1));
          } else if (mode === 'free') {
            setRing(el / 60);
            const line = (cfg.lines || []).filter((l) => el >= l[0]).pop();
            if (line && caption.textContent !== line[1]) caption.textContent = line[1];
            readout.textContent = el >= 5 ? Math.floor(el) + ' s' : '';
            if (el >= 60) api.unlock('patience');
          } else if (mode === 'heartbeat') {
            const d = cfg.duration || 4;
            setRing(el / d);
            if (el - lastBeat >= 0.75) {
              lastBeat = el;
              api.sound.tone(70, 0.12, 'sine', 0.3); api.sound.tone(60, 0.12, 'sine', 0.25, 0.16);
              btn.classList.remove('beat'); void btn.offsetWidth; btn.classList.add('beat');
            }
            if (el >= d && !done) {
              done = true;
              t0 = null;
              btn.classList.remove('holding');
              api.submit({ held: el });
              return false;
            }
          }
          return true;
        });
      };

      const release = () => {
        if (t0 === null) return;
        const el = (performance.now() - t0) / 1000;
        t0 = null;
        btn.classList.remove('holding');
        if (mode === 'exact') {
          readout.style.opacity = '1';
          readout.textContent = el.toFixed(2) + ' s';
          setRing(0);
          api.submit({ held: el });
        } else if (mode === 'free') {
          if (el < 1) { api.flavor('That was a tap. This is a hold. Take your time.'); setRing(0); return; }
          api.submit({ held: el });
        } else if (mode === 'heartbeat' && !done) {
          setRing(0);
          api.fail(cfg.letGoMsg || "You let go. Hold on a little longer.", { soft: true });
        }
      };

      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
      btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } });
      btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(); } });
      api.onCleanup(() => { t0 = null; });
    },
  };
})();
