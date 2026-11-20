/* timed — reflex & timing challenges.
 * config.mode:
 *   'dontClick'  survive config.duration s without clicking the box. Answer: { survived }
 *   'moving'     click the moving target (a frog). Misses make it faster. Answer: { hit }
 *   'light'      click when the light turns green. Answer: { ok }
 *   'catch'      tap falling good items, avoid bad ones. config.goal, config.badRate,
 *                config.good/bad (emoji or 'check'/'cross'), config.maxMissed (lose if
 *                that many good items fall through). Answer: { caught }
 *   'beat'       tap on the beat config.streak times in a row. Answer: { streak }
 *   'wait'       do nothing for config.duration s. Answer: { waited }
 *   'gravity'    a checkbox falls and bounces; catch it. Answer: { caught }
 */
(function () {
  'use strict';
  const { h, rand, pick, clamp } = U;

  const arena = (cls = '') => h('div', { class: 'arena ' + cls });

  const modes = {};

  // ------------------------------------------------------------------ dontClick
  modes.dontClick = (api, cfg) => {
    const dur = cfg.duration || 6;
    const box = h('button', { class: 'cbx big', type: 'button', 'aria-label': 'Do not click this' });
    const bar = h('div', { class: 'countdown-fill' });
    const plea = h('div', { class: 'plea', 'aria-live': 'polite' }, '');
    api.body.appendChild(h('div', { class: 'dont-wrap' },
      h('div', { class: 'anchor-row inset' }, h('div', { class: 'anchor-left' }, box, h('span', { class: 'anchor-label' }, 'Click me')), api.brandBlock()),
      plea, h('div', { class: 'countdown' }, bar)));
    let t0 = performance.now();
    let li = -1;
    const lines = cfg.lines || [];
    api.loop((dt, now) => {
      const el = (now - t0) / 1000;
      bar.style.width = clamp((el / dur) * 100, 0, 100) + '%';
      const idx = Math.min(lines.length - 1, Math.floor((el / dur) * lines.length));
      if (idx !== li && idx >= 0) { li = idx; plea.textContent = lines[idx]; box.classList.remove('wiggle'); void box.offsetWidth; box.classList.add('wiggle'); }
      if (el >= dur) { api.submit({ survived: true }); return false; }
      return true;
    });
    box.addEventListener('click', () => {
      if (api.isLocked()) return;
      api.countCheckboxClick();
      api.fail(pick(['You clicked it. It was RIGHT THERE in the instructions.', 'It asked nicely. You complied. That was the test.', 'Rule one: do not click. You clicked.']));
      t0 = performance.now();
      li = -1;
    });
  };

  // ------------------------------------------------------------------ moving duck
  modes.moving = (api, cfg) => {
    const a = arena('pond');
    const duck = h('button', { class: 'duck', type: 'button', 'aria-label': 'Frog', html: ART.frog() });
    a.appendChild(duck);
    for (let i = 0; i < 5; i++) a.appendChild(h('span', { class: 'ripple', style: { left: rand(5, 90) + '%', top: rand(10, 90) + '%', animationDelay: rand(0, 3) + 's' } }));
    api.body.appendChild(a);
    let x = 40, y = 40, speed = cfg.speed || 26;
    let ang = rand(0, Math.PI * 2);
    const size = 22; // % of width
    api.loop((dt) => {
      if (Math.random() < 0.01) ang += rand(-1, 1);
      x += Math.cos(ang) * speed * dt;
      y += Math.sin(ang) * speed * dt * 1.36;
      if (x < 0) { x = 0; ang = Math.PI - ang; }
      if (x > 100 - size) { x = 100 - size; ang = Math.PI - ang; }
      if (y < 0) { y = 0; ang = -ang; }
      if (y > 100 - size * 1.36) { y = 100 - size * 1.36; ang = -ang; }
      duck.style.left = x + '%';
      duck.style.top = y + '%';
      duck.style.transform = Math.cos(ang) < 0 ? 'scaleX(-1)' : '';
      return true;
    });
    duck.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (api.isLocked()) return; api.sound.tone(700, 0.08, 'square', 0.06); api.sound.tone(560, 0.1, 'square', 0.06, 0.1); api.submit({ hit: true }); });
    a.addEventListener('pointerdown', () => {
      if (api.isLocked()) return;
      speed = Math.min(speed * 1.18, 90);
      ang += rand(-1.5, 1.5);
      api.fail(pick(['Missed. The frog is faster now.', 'Ribbit. (That was mocking.)', 'Missed! It saw you coming.']), { soft: true });
    });
  };

  // ------------------------------------------------------------------ traffic light
  modes.light = (api, cfg) => {
    const lamps = { red: h('i', { class: 'lamp red' }), yellow: h('i', { class: 'lamp yellow' }), green: h('i', { class: 'lamp green' }) };
    const light = h('div', { class: 'traffic' }, lamps.red, lamps.yellow, lamps.green);
    const go = h('button', { class: 'btn-go', type: 'button' }, 'GO');
    api.body.appendChild(h('div', { class: 'light-wrap' }, light, go));
    let phase = 'red';
    const set = (p) => { phase = p; Object.keys(lamps).forEach((k) => lamps[k].classList.toggle('on', k === p)); };
    let timer = null;
    const cycle = () => {
      set('red');
      const fake = Math.random() < 0.55;
      timer = api.after(rand(1200, 2600), () => {
        if (fake) {
          set('yellow');
          timer = api.after(rand(250, 450), () => { set('red'); timer = api.after(rand(700, 1400), green); });
        } else green();
      });
    };
    const green = () => {
      set('green');
      api.sound.tick();
      timer = api.after(cfg.window || 1000, () => { api.flavor('Too slow! It was green for a whole second.'); cycle(); });
    };
    const press = () => {
      if (api.isLocked()) return;
      if (phase === 'green') { clearTimeout(timer); api.submit({ ok: true }); return; }
      clearTimeout(timer);
      api.fail(phase === 'yellow' ? 'That was yellow. Yellow is not green.' : 'Too early! Red means wait.');
      api.after(400, cycle);
    };
    go.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
    go.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(); } });
    light.addEventListener('pointerdown', press);
    cycle();
  };

  // ------------------------------------------------------------------ catch falling items
  modes.catch = (api, cfg) => {
    const a = arena('sky' + (cfg.jar ? ' with-jar' : ''));
    const counter = h('div', { class: 'arena-counter' });
    a.appendChild(counter);
    let jar = null;
    if (cfg.jar) { jar = h('div', { class: 'jar' }, '🫙'); a.appendChild(jar); }
    api.body.appendChild(a);
    const goal = cfg.goal || 5;
    let caught = 0, missed = 0;
    const items = [];
    const updateCounter = () => { counter.textContent = `${cfg.goodLabel || '✓'} ${caught} / ${goal}` + (cfg.maxMissed ? `   ·   ${cfg.missLabel || 'missed'} ${missed} / ${cfg.maxMissed}` : ''); };
    updateCounter();
    const glyph = (k) => (k === 'check' ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#1f9d55"/><path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : k === 'cross' ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#d93025"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>'
        : `<span class="emoji-item">${k}</span>`);
    let spawnT = 0;
    api.loop((dt) => {
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = cfg.spawn || 0.75;
        const bad = Math.random() < (cfg.badRate || 0);
        const el = h('button', { class: 'faller', type: 'button', 'aria-label': bad ? 'bad item' : 'good item', html: glyph(bad ? (cfg.bad || 'cross') : (cfg.good || 'check')) });
        const it = { el, bad, x: rand(4, 82), y: -14, v: rand(cfg.minSpeed || 22, cfg.maxSpeed || 34) };
        el.style.left = it.x + '%';
        el.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (api.isLocked() || it.dead) return;
          it.dead = true;
          el.classList.add('popped');
          setTimeout(() => el.remove(), 200);
          if (it.bad) {
            if (cfg.resetOnBad) caught = 0;
            updateCounter();
            api.fail(cfg.badMsg || 'That was an ✗. Back to zero.');
            return;
          }
          caught++;
          api.sound.tone(600 + caught * 60, 0.08, 'triangle', 0.08);
          updateCounter();
          if (caught >= goal) api.submit({ caught });
        });
        items.push(it);
        a.appendChild(el);
      }
      for (const it of items) {
        if (it.dead) continue;
        it.y += it.v * dt;
        it.el.style.top = it.y + '%';
        if (it.y > 100) {
          it.dead = true;
          it.el.remove();
          if (!it.bad && cfg.maxMissed) {
            missed++;
            if (jar) { jar.classList.remove('gulp'); void jar.offsetWidth; jar.classList.add('gulp'); }
            if (missed >= cfg.maxMissed) {
              api.fail(cfg.lostMsg || 'Too many got through. Starting over.');
              caught = 0; missed = 0;
            }
            updateCounter();
          }
        }
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].dead) items.splice(i, 1);
      return true;
    });
  };

  // ------------------------------------------------------------------ beat
  modes.beat = (api, cfg) => {
    const period = cfg.period || 650;
    const need = cfg.streak || 4;
    const pulse = h('div', { class: 'beat-pulse' });
    const btn = h('button', { class: 'beat-btn', type: 'button', 'aria-label': 'Tap on the beat' }, pulse, h('span', { class: 'cbx-face' }));
    const dots = h('div', { class: 'beat-dots' }, Array.from({ length: need }, () => h('i')));
    api.body.appendChild(h('div', { class: 'beat-wrap' }, btn, dots, h('div', { class: 'beat-caption' }, 'Tap when the ring hits the box.')));
    const t0 = performance.now() + 400;
    let lastBeat = -1;
    let streak = 0;
    let lastTapBeat = -99;
    const paint = () => [...dots.children].forEach((d, i) => d.classList.toggle('on', i < streak));
    api.loop((dt, now) => {
      const b = Math.floor((now - t0) / period);
      if (b > lastBeat && now >= t0) {
        lastBeat = b;
        api.sound.tone(b % 4 === 0 ? 1200 : 900, 0.04, 'square', 0.04);
        pulse.classList.remove('go'); void pulse.offsetWidth; pulse.classList.add('go');
      }
      return true;
    });
    pulse.style.animationDuration = period + 'ms';
    const tap = () => {
      if (api.isLocked()) return;
      const now = performance.now();
      const ph = (((now - t0) % period) + period) % period;
      const dist = Math.min(ph, period - ph);
      const beatIdx = Math.round((now - t0) / period);
      if (dist <= (cfg.tolerance || 140) && beatIdx !== lastTapBeat) {
        lastTapBeat = beatIdx;
        streak++;
        btn.classList.remove('hit'); void btn.offsetWidth; btn.classList.add('hit');
        paint();
        if (streak >= need) api.submit({ streak });
      } else {
        api.fail(dist < 260 ? 'Close! Off by a hair. Streak reset.' : 'Off beat. Streak reset.', { soft: true });
        streak = 0;
        paint();
      }
    };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
    btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); tap(); } });
  };

  // ------------------------------------------------------------------ wait
  modes.wait = (api, cfg) => {
    const dur = cfg.duration || 15;
    const fill = h('div', { class: 'countdown-fill calm' });
    const line = h('div', { class: 'wait-line', 'aria-live': 'polite' });
    api.body.appendChild(h('div', { class: 'wait-wrap' }, h('div', { class: 'wait-orb' }), line, h('div', { class: 'countdown thin' }, fill)));
    let t0 = performance.now();
    const lines = cfg.lines || [];
    api.loop((dt, now) => {
      const el = (now - t0) / 1000;
      fill.style.width = clamp((el / dur) * 100, 0, 100) + '%';
      const l = lines.filter((x) => el >= x[0]).pop();
      line.textContent = l ? l[1] : '';
      if (el >= dur) { api.submit({ waited: el }); return false; }
      return true;
    });
    const reset = (e) => {
      if (api.isLocked()) return;
      if (e.target.closest && e.target.closest('.topbar, .modal-backdrop, .hint-row')) return;
      if (performance.now() - t0 < 300) return;
      t0 = performance.now();
      api.fail(pick(['Patience is very human. Starting over.', 'You moved. The waiting starts again.', 'Shh. From the top.']), { soft: true });
    };
    const onKey = (e) => { if (!['Shift', 'Alt', 'Control', 'Meta', 'Tab'].includes(e.key)) reset(e); };
    api.after(400, () => {
      document.addEventListener('pointerdown', reset, true);
      document.addEventListener('keydown', onKey, true);
    });
    api.onCleanup(() => { document.removeEventListener('pointerdown', reset, true); document.removeEventListener('keydown', onKey, true); });
  };

  // ------------------------------------------------------------------ gravity (secret)
  modes.gravity = (api) => {
    const a = arena('gravity');
    const box = h('button', { class: 'cbx big falling', type: 'button', 'aria-label': 'The falling checkbox' });
    a.appendChild(box);
    api.body.appendChild(a);
    let x = 40, y = 0, vx = rand(-30, 30), vy = 0;
    api.loop((dt) => {
      vy += 160 * dt;
      x += vx * dt; y += vy * dt;
      if (y > 84) { y = 84; vy = -Math.abs(vy) * 0.62; if (Math.abs(vy) < 25) { vy = -rand(110, 150); vx = rand(-45, 45); } }
      if (x < 0) { x = 0; vx = Math.abs(vx); }
      if (x > 88) { x = 88; vx = -Math.abs(vx); }
      box.style.left = x + '%';
      box.style.top = y + '%';
      box.style.transform = `rotate(${x * 7}deg)`;
      return true;
    });
    box.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (api.isLocked()) return;
      api.countCheckboxClick();
      box.classList.add('checked');
      box.innerHTML = '<svg class="ck" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 21 L16 29 L33 10"/></svg>';
      api.submit({ caught: true });
    });
    a.addEventListener('pointerdown', () => { if (!api.isLocked()) api.fail('Gravity wins that round.', { soft: true }); });
  };

  // ------------------------------------------------------------------ stopwatch
  /* config: target (5), tol (0.15), hideAfter (2) */
  modes.stopwatch = (api, cfg) => {
    const target = cfg.target || 5, tol = cfg.tol || 0.15;
    const disp = h('div', { class: 'stopwatch' }, '0.00');
    const btn = h('button', { class: 'btn-go wide', type: 'button' }, 'START');
    api.body.appendChild(h('div', { class: 'sw-wrap' }, disp, btn, h('div', { class: 'muted small center' }, `Stop it at exactly ${target.toFixed(2)} s. The display gets shy after ${cfg.hideAfter || 2} s.`)));
    let t0 = null;
    api.loop(() => {
      if (t0 === null) return true;
      const el = (performance.now() - t0) / 1000;
      disp.textContent = el < (cfg.hideAfter || 2) ? el.toFixed(2) : '?.??';
      return true;
    });
    const press = () => {
      if (api.isLocked()) return;
      if (t0 === null) { t0 = performance.now(); btn.textContent = 'STOP'; api.sound.click(); return; }
      const el = (performance.now() - t0) / 1000;
      t0 = null; btn.textContent = 'START'; disp.textContent = el.toFixed(2);
      api.submit({ t: el, target, tol });
    };
    btn.addEventListener('click', press);
    api.setBot(() => { press(); api.after(target * 1000, press); });
  };

  Challenges.timed = {
    render(api) {
      const cfg = api.level.config || {};
      api.showVerify(false);
      (modes[cfg.mode] || modes.wait)(api, cfg);
    },
  };
})();
