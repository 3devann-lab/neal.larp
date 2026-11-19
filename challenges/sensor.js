/* sensor — optional webcam challenge with two ways out.
 * Nothing touches the camera until the player presses "Enable camera".
 *   Enable camera        → wave at the camera (frame-difference motion detection)
 *   I don't have a webcam → wave your cursor / finger across the widget instead
 *   I'd rather not       → skip (passes, with a comment)
 * If no camera exists or permission is denied, it switches to the cursor wave.
 * Answer: { method: 'camera' | 'cursor' | 'skip' }
 */
(function () {
  'use strict';
  const { h } = U;

  Challenges.sensor = {
    render(api) {
      const cfg = api.level.config || {};
      api.showVerify(false);
      const wrap = h('div', { class: 'sensor' });
      api.body.appendChild(wrap);
      let stream = null;
      const stop = () => { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } };
      api.onCleanup(stop);

      const progress = () => {
        const fill = h('div', { class: 'countdown-fill' });
        const label = h('div', { class: 'sensor-label' }, 'Waves detected: 0%');
        return { el: h('div', null, label, h('div', { class: 'countdown' }, fill)), set(f) { fill.style.width = Math.min(100, f * 100) + '%'; label.textContent = `Waves detected: ${Math.min(100, Math.round(f * 100))}%`; } };
      };

      const menu = () => {
        wrap.innerHTML = '';
        api.setPrompt(api.level.prompt);
        const cam = h('button', { class: 'choice-btn primary', type: 'button' }, '📷 Enable camera');
        const none = h('button', { class: 'choice-btn', type: 'button' }, "🚫 I don't have a webcam");
        const skip = h('button', { class: 'choice-btn subtle', type: 'button' }, "I'd rather not");
        wrap.append(
          h('p', { class: 'sensor-note' }, 'Your camera is only used in this tab to detect movement. Nothing is recorded or sent anywhere.'),
          h('div', { class: 'choice-options list' }, cam, none, skip));
        cam.addEventListener('click', camera);
        none.addEventListener('click', () => cursor("No webcam? No problem."));
        skip.addEventListener('click', () => { api.unlock('camerashy'); api.submit({ method: 'skip' }); });
      };

      const camera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          cursor("This browser can't reach a camera here, so let's do it another way.");
          return;
        }
        wrap.innerHTML = '';
        wrap.appendChild(h('p', { class: 'sensor-note' }, 'Waiting for camera permission…'));
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false });
        } catch (e) {
          stop();
          cursor(e && e.name === 'NotAllowedError' ? 'Permission denied. Respect. Wave your cursor instead.' : 'No camera found. Wave your cursor instead.');
          return;
        }
        if (api.isLocked()) { stop(); return; }
        wrap.innerHTML = '';
        const video = h('video', { class: 'sensor-video', autoplay: true, muted: true, playsinline: true });
        video.srcObject = stream;
        const p = progress();
        const fallback = h('button', { class: 'link-btn', type: 'button' }, 'Camera not cooperating? Wave your cursor instead');
        fallback.addEventListener('click', () => { stop(); cursor(''); });
        wrap.append(video, p.el, fallback);
        api.setPrompt({ small: 'Prove you are human:', big: 'wave at the camera', sub: 'Big, friendly waves. Robots never wave.' });
        try { await video.play(); } catch (_) { /* autoplay may need a gesture; we already had one */ }
        const c = document.createElement('canvas');
        c.width = 64; c.height = 48;
        const g = c.getContext('2d', { willReadFrequently: true });
        let prev = null;
        let score = 0;
        api.loop(() => {
          if (!stream) return false;
          if (video.readyState < 2) return true;
          g.drawImage(video, 0, 0, 64, 48);
          const d = g.getImageData(0, 0, 64, 48).data;
          if (prev) {
            let diff = 0;
            for (let i = 0; i < d.length; i += 4) diff += Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]);
            const motion = diff / (64 * 48 * 2 * 255);
            if (motion > 0.06) score += motion * 0.6;
            p.set(score);
            if (score >= 1) { stop(); api.submit({ method: 'camera' }); return false; }
          }
          prev = d.slice();
          return true;
        });
      };

      const cursor = (why) => {
        stop();
        wrap.innerHTML = '';
        api.setPrompt({ small: why || 'Alternative verification:', big: 'wave your cursor', sub: 'Move back and forth across the box below. Big waves, at least 5 of them.' });
        const zone = h('div', { class: 'wave-zone' }, h('span', { class: 'wave-hand' }, '👋'), h('span', { class: 'wave-hint' }, '← wave here →'));
        const p = progress();
        wrap.append(zone, p.el);
        const hand = zone.querySelector('.wave-hand');
        let dir = 0, lastX = null, extreme = null, reversals = 0;
        const need = (cfg.waves || 5) * 2;
        zone.addEventListener('pointermove', (e) => {
          if (api.isLocked()) return;
          const r = zone.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          hand.style.left = (x * 100) + '%';
          hand.style.top = ((e.clientY - r.top) / r.height) * 100 + '%';
          if (lastX === null) { lastX = x; extreme = x; return; }
          const d = Math.sign(x - lastX);
          if (d && dir && d !== dir && Math.abs(lastX - extreme) > 0.3) {
            reversals++;
            extreme = lastX;
            api.sound.tone(500 + reversals * 40, 0.05, 'sine', 0.06);
            p.set(reversals / need);
            if (reversals >= need) api.submit({ method: 'cursor' });
          }
          if (d) dir = d;
          lastX = x;
        });
        zone.style.touchAction = 'none';
      };

      menu();
    },
  };
})();
