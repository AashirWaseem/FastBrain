/* PASAT — Paced Auditory Serial Addition Task. Level N = add up the last N numbers heard. */
(function (FB) {
  'use strict';
  const h = FB.h;
  const SPEEDS = { slow: 7000, normal: 5000, fast: 3000 };
  const LENGTHS = { short: 5, standard: 10, long: 20 };
  const stepMs = s => s.speed === 'custom' ? s.stepMs : SPEEDS[s.speed];
  const trialsFor = (s, n) => s.base + n;

  const game = {
    id: 'pasat',
    name: 'PASAT',
    title: 'PASAT Training',
    icon: () => FB.icons.pasat(),
    cardIcon: () => FB.icons.pasat('#14c2bd', '#f0b44c'),
    blurb: 'Numbers are spoken one at a time. Keep adding up the last few as new ones arrive.',
    pages: [['training', 'Training'], ['how-to-play', 'How to play'], ['info', 'Info']],
    defaults: { speed: 'normal', stepMs: 5000, setLength: 'standard', base: 10, volume: 100, showNumbers: false, showMistakes: true, maxNumber: 9 },
    defaultState: { level: 2 },
    levels: () => Array.from({ length: 24 }, (_, i) => ({ value: i + 2, label: String(i + 2) })),
    nextSet(ctx) {
      const s = ctx.settings, n = ctx.state.level;
      return [['Level', n], ['Number of Trials', trialsFor(s, n)], ['Trial Time', FB.fmtSec(stepMs(s)) + ' s.']];
    },
    quick: () => [
      FB.speedSeg([{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }]),
      { type: 'range', key: 'volume', label: 'Volume', min: 0, max: 100 }
    ],
    tabs: (ctx) => [
      {
        title: 'Training', fields: [
          FB.speedSeg([{ value: 'slow', label: 'Slow', sub: '7 s' }, { value: 'normal', label: 'Normal', sub: '5 s' }, { value: 'fast', label: 'Fast', sub: '3 s' }, { value: 'custom', label: 'Custom', sub: 'see Advanced' }]),
          { type: 'note', label: 'Time to answer after each number is read out.' },
          { type: 'seg', key: 'setLength', label: 'Set length', options: [{ value: 'short', label: 'Short' }, { value: 'standard', label: 'Standard' }, { value: 'long', label: 'Long' }], help: s => trialsFor(s, ctx.state.level) + ' numbers at level ' + ctx.state.level },
          { type: 'toggle', key: 'showMistakes', label: 'Show my mistakes', help: 'Shows the right sum after a wrong or missing answer.' },
          ...FB.levelRuleFields()
        ]
      },
      {
        title: 'Sound', fields: [
          { type: 'range', key: 'volume', label: 'Volume', min: 0, max: 100 },
          { type: 'voice' },
          { type: 'toggle', key: 'showNumbers', label: 'Also show numbers on screen', help: 'Turns PASAT into a visual task. Leave off for the classic auditory version.' }
        ]
      },
      {
        title: 'Advanced', fields: [
          { type: 'number', key: 'stepMs', label: 'Time to answer (Custom)', suffix: 'ms', min: 1000, max: 15000, step: 100 },
          { type: 'number', key: 'base', label: 'Base numbers per set', min: 1, max: 200, help: 'Numbers per set = base + level.' },
          { type: 'number', key: 'maxNumber', label: 'Largest number spoken', min: 2, max: 99 }
        ]
      }
    ],
    onSettings(ctx, key, val) {
      const s = ctx.settings;
      if (key === 'setLength') s.base = LENGTHS[val];
      if (key === 'base') s.setLength = Object.keys(LENGTHS).find(k => LENGTHS[k] === val) || 'custom';
    },
    idleCounter: ctx => '0 of ' + trialsFor(ctx.settings, ctx.state.level),

    mount(area, ctx) {
      let view, input, nextBtn, status, fill, submitFn = null;
      function draw() {
        area.innerHTML = '';
        view = h('div.mmath-view-field');
        fill = h('div.cwm-progress-fill');
        input = h('input.result-input', { type: 'text', inputMode: 'numeric', autocomplete: 'off', placeholder: 'Type the sum here', disabled: true });
        nextBtn = h('button.btn.btn-secondary.btn-mmath-next', { type: 'button', disabled: true, on: { click: () => submitFn && submitFn() } }, 'Next');
        status = h('div.mmath-status');
        area.append(h('div.mmath-area.play-area',
          h('div.progress-holder', h('div.cwm-progress', fill)),
          view,
          h('div.mmath-response', input, h('span.input-icon.ok', { html: FB.icons.check }), h('span.input-icon.err', { html: FB.icons.err })),
          h('div.mmath-next-wrap', nextBtn), status,
          h('div.area-hint', 'Enter the Sum of the last ' + ctx.state.level + ' numbers'),
          FB.keypad(input, () => submitFn && submitFn())));
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitFn && submitFn(); } });
        input.addEventListener('input', () => { input.value = input.value.replace(/[^0-9]/g, ''); });
      }
      return {
        idle() { draw(); },
        cancel() { submitFn = null; },
        key(e, typing) {
          if (!typing && e.key === 'Enter' && submitFn) { e.preventDefault(); submitFn(); }
        },
        async run(areaEl, clock) {
          const s = ctx.settings, n = ctx.state.level;
          const total = trialsFor(s, n), T = stepMs(s);
          const visual = s.showNumbers || !FB.speech.supported;
          const nums = [];
          for (let i = 0; i < total; i++) {
            let v; do { v = FB.randInt(1, s.maxNumber); } while (i && v === nums[i - 1] && Math.random() < 0.7);
            nums.push(v);
          }
          draw();
          let correct = 0, missed = 0;
          const answers = total - (n - 1);
          await clock.wait(800);
          for (let k = 0; k < total; k++) {
            // the counter counts every number read out, warm-up ones included
            ctx.setCounter((k + 1) + ' of ' + total);
            if (!visual) FB.speech.say(nums[k], ctx.volume());
            view.style.opacity = '';
            if (visual) { view.textContent = String(nums[k]); clock.after(Math.min(1200, T * 0.5), () => { view.textContent = ''; }); }
            else { view.textContent = '???'; view.style.opacity = '.18'; }
            input.className = 'result-input';
            input.value = '';
            status.textContent = '';
            if (k < n - 1) {
              // not enough numbers yet to add up: the next one follows quickly
              input.disabled = true; nextBtn.disabled = true;
              input.placeholder = 'Listen…';
              clock.progress(fill, 2300);
              await clock.wait(2300);
              continue;
            }
            input.placeholder = 'Type the sum here';
            input.disabled = false; nextBtn.disabled = false;
            input.focus();
            const expected = nums.slice(k - n + 1, k + 1).reduce((x, y) => x + y, 0);
            // answer window = trial time + about a second for the number to be read out
            const windowMs = T + 1000;
            clock.progress(fill, windowMs);
            await clock.race(windowMs, res => {
              submitFn = () => { if (input.value.trim() === '') { input.focus(); return; } res(); };
            });
            submitFn = null;
            const v = input.value.trim();
            const ok = v !== '' && +v === expected;
            if (ok) correct++; else if (v === '') missed++;
            input.disabled = true; nextBtn.disabled = true;
            input.classList.add(ok ? 'is-valid' : 'is-invalid');
            if (!ok && s.showMistakes) status.textContent = 'Correct: ' + expected;
            await clock.wait(1000);
          }
          // BrainScale counts the warm-up number(s) as passed trials:
          // a level-2 set of 12 with no answers scores 1/12 = 8%
          const score = (correct + (n - 1)) / total * 100;
          ctx.finish({
            score,
            label: 'PASAT ' + n,
            title: 'PASAT · level ' + n + ' · Success Rate',
            details: [`<b>${correct}</b> of ${answers} sums correct`, missed ? `${missed} left blank` : '', `Time to answer: ${FB.fmtSec(T)} s (+1 s while the number is read)`].filter(Boolean)
          });
        }
      };
    }
  };

  game.docs = {
    'how-to-play': () => `
      <h2>How to play</h2>
      <p>Numbers from 1 to 9 are read aloud at a steady pace. Each time a new number arrives, type the <b>sum of the
      last N numbers</b> (N = your level) and press <kbd>Enter</kbd> before the next one comes.</p>
      <h3>Example at level 2</h3>
      <table><tr><th>You hear</th><th>You type</th></tr>
        <tr><td>3</td><td>— (wait)</td></tr>
        <tr><td>5</td><td>8 &nbsp;(3 + 5)</td></tr>
        <tr><td>2</td><td>7 &nbsp;(5 + 2)</td></tr>
        <tr><td>9</td><td>11 (2 + 9)</td></tr></table>
      <p>The tricky part: you must add each new number to the <i>previous number</i>, not to your previous answer.</p>
      <ul>
        <li>The blue bar shows how long you have left to answer. Press <kbd>Enter</kbd> (or <b>Next</b> / <b>Go</b>) to submit;
          the right sum is shown for a moment, then the next number comes.</li>
        <li>If time runs out, whatever is in the box counts as your answer.</li>
        <li>The counter counts every number read out. At level N the first N − 1 numbers are just "warm-up" — they count
          as passed, so a level-2 set of 12 numbers has 11 sums to answer.</li>
        <li>Result Score = level + success rate (level 3 at 75% → 3.75).</li>
        <li>On a phone, tablet or narrow window an on-screen number pad appears under the answer box.</li>
        <li>Turn up the volume, or turn on <b>Also show numbers on screen</b> in the settings if you'd rather read them.</li>
        <li>Voices come from your computer; pick a different one under <b>All settings → Sound</b>.</li>
      </ul>`,
    info: () => `
      <h2>About PASAT</h2>
      <p>The Paced Auditory Serial Addition Test was introduced by Gronwall in 1977 to track recovery after concussion.
      It is now used widely in neuropsychology to assess information-processing speed, sustained and divided attention,
      and working memory.</p>
      <p>The classic test uses level 2 (add the last two numbers) at intervals of 3 and 2 seconds. Higher levels here ask you
      to keep a longer running window in mind, which turns it into a demanding updating task similar to n-back.</p>
      <h3>What it trains</h3>
      <ul><li>Processing speed</li><li>Auditory working memory</li><li>Staying focused under time pressure</li></ul>
      <p>PASAT is known to be stressful — that's normal. Short, regular sessions work better than long ones.</p>`
  };

  FB.games.register(game);
})(window.FB);
