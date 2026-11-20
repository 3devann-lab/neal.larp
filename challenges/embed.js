/* embed — plays another web game inside the CAPTCHA (in an iframe).
 * config:
 *   src      page to load (it reports back with window.parent.postMessage)
 *   source   expected message `source` field (e.g. 'isnar-library')
 *   title    accessible title for the frame
 *   aspect   CSS aspect-ratio of the frame (default '16 / 10')
 * Messages understood: { source, type: 'started' | 'died' | 'complete' }.
 * Answer: { done: true } when the embedded game reports 'complete'.
 */
(function () {
  'use strict';
  const { h, pick } = U;

  Challenges.embed = {
    render(api) {
      const cfg = api.level.config || {};
      api.showVerify(false);
      const frame = h('iframe', {
        class: 'embed-frame', src: cfg.src, title: cfg.title || 'Embedded game',
        allow: 'fullscreen; autoplay',
        style: { aspectRatio: cfg.aspect || '16 / 10' },
      });
      const status = h('span', { class: 'embed-status', 'aria-live': 'polite' }, 'Press START GAME inside the window.');
      const fs = h('button', { class: 'choice-btn small', type: 'button' }, '⛶ Full screen');
      fs.addEventListener('click', () => {
        const f = frame.requestFullscreen || frame.webkitRequestFullscreen;
        if (f) { try { const r = f.call(frame); if (r && r.catch) r.catch(() => {}); } catch (e) { /* ignore */ } }
      });
      api.body.appendChild(h('div', { class: 'embed' }, frame, h('div', { class: 'embed-bar' }, status, fs)));

      let deaths = 0;
      const onMsg = (e) => {
        if (e.source !== frame.contentWindow || !e.data || e.data.source !== cfg.source) return;
        if (api.isLocked()) return;
        const t = e.data.type;
        if (t === 'started') status.textContent = deaths ? `Attempt ${deaths + 1}. You know where the books are now.` : 'Good luck. Stay quiet.';
        if (t === 'died') {
          deaths++;
          status.textContent = `Caught ${deaths} time${deaths === 1 ? '' : 's'}. Try again from inside the window.`;
          api.fail(pick(['Mrs. C caught you. Shhh… and try again.', 'Too loud! The library claims another visitor.', 'Caught! Crouch next time.']), { soft: true, suspicion: 1 });
        }
        if (t === 'complete') {
          status.textContent = 'You escaped!';
          try { if (document.fullscreenElement) document.exitFullscreen(); } catch (er) { /* ignore */ }
          api.submit({ done: true, deaths });
        }
      };
      window.addEventListener('message', onMsg);
      api.onCleanup(() => { window.removeEventListener('message', onMsg); frame.src = 'about:blank'; });
    },
  };
})();
