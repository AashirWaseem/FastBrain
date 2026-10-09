/* Mental Math — addition, subtraction, multiplication, division, mixed. Level "a.b" = digits of each operand. */
(function (FB) {
  'use strict';
  const h = FB.h;
  const TYPES = [
    { value: 'Add', label: '+ Addition' }, { value: 'Sub', label: '- Subtraction' }, { value: 'Mul', label: '* Multiplication' },
    { value: 'Div', label: '/ Division' }, { value: 'Mix', label: '+-*/ Mixed' }
  ];
  const LEVELS = ['1.1', '2.1', '2.2'];
  for (let a = 3; a <= 14; a++) for (let b = a - 2; b <= a; b++) LEVELS.push(a + '.' + b);
  const LENGTHS = { short: 5, standard: 10, long: 20 };

  // Operands go up to 14 digits, and their products overflow doubles, so all
  // arithmetic uses BigInt to keep answers exact. bigRand(d) has exactly d digits.
  function bigRand(d) {
    let s = String(FB.randInt(1, 9));
    for (let i = 1; i < d; i++) s += FB.rand(10);
    return BigInt(s);
  }

  function makeProblem(op, level) {
    const [A, B] = level.split('.').map(Number);
    if (op === 'Mix') op = FB.pick(['Add', 'Sub', 'Mul', 'Div']);
    if (op === 'Add') {
      const a = bigRand(A), b = bigRand(B);
      return { text: a + ' + ' + b, answer: (a + b).toString() };
    }
    if (op === 'Sub') {
      let a = bigRand(A), b = bigRand(B);
      if (b > a) [a, b] = [b, a];
      return { text: a + ' - ' + b, answer: (a - b).toString() };
    }
    if (op === 'Mul') {
      let a = bigRand(A), b = bigRand(B);
      if (A === 1) a = BigInt(FB.randInt(2, 9));
      if (B === 1) b = BigInt(FB.randInt(2, 9));
      return { text: a + ' * ' + b, answer: (a * b).toString() };
    }
    // Division: dividend has A digits, divisor has B digits, answer is a whole number.
    for (let t = 0; t < 200; t++) {
      const dv = B === 1 ? BigInt(FB.randInt(2, 9)) : bigRand(B);
      const minD = A === 1 ? 2n : BigInt('1' + '0'.repeat(A - 1));
      const maxD = BigInt('9'.repeat(A));
      let qmin = (minD + dv - 1n) / dv, qmax = maxD / dv;
      if (qmin < 2n) qmin = 2n;
      if (qmax < qmin) continue;
      const span = qmax - qmin;
      // pick a random quotient in [qmin, qmax]
      let q;
      if (span < 9007199254740991n) q = qmin + BigInt(Math.floor(Math.random() * (Number(span) + 1)));
      else q = qmin + (bigRand(String(span).length) % (span + 1n));
      return { text: (q * dv) + ' / ' + dv, answer: q.toString() };
    }
    return { text: '84 / 7', answer: '12' };
  }

  const game = {
    id: 'mental-math',
    name: 'Mental Math',
    title: 'Mental Math Training',
    icon: () => FB.icons.mmath(),
    cardIcon: () => FB.icons.mmath('#14c2bd', '#f0b44c'),
    blurb: 'Addition, subtraction, multiplication and division drills that step up as you improve.',
    pages: [['training', 'Training'], ['how-to-play', 'How to play'], ['info', 'Info']],
    types: TYPES,
    defaults: { timePerAnswer: 60, hideAfter: 0, setLength: 'standard', problems: 10, feedbackMs: 1300, autoNext: true },
    defaultState: { type: 'Mul', levels: { Add: '2.2', Sub: '2.2', Mul: '2.2', Div: '2.1', Mix: '2.1' } },
    getLevel: st => st.levels[st.type] || '2.2',
    setLevel: (st, v) => { st.levels[st.type] = v; },
    levels: () => LEVELS.map(l => ({ value: l, label: l })),
    nextSet(ctx) {
      const s = ctx.settings;
      return [['Level', ctx.level], ['Number of Trials', s.problems], ['Trial Time', s.timePerAnswer + ' s.']];
    },
    quick: () => [
      { type: 'number', key: 'timePerAnswer', label: 'Time per answer', suffix: 's', min: 2, max: 600 },
      { type: 'number', key: 'hideAfter', label: 'Hide the problem after', suffix: 's', min: 0, max: 600 }
    ],
    tabs: () => [
      {
        title: 'Training', fields: [
          { type: 'number', key: 'timePerAnswer', label: 'Time per answer', suffix: 's', min: 2, max: 600 },
          { type: 'number', key: 'hideAfter', label: 'Hide the problem after', suffix: 's', min: 0, max: 600, help: '0 = never hide it.' },
          { type: 'seg', key: 'setLength', label: 'Set length', options: [{ value: 'short', label: 'Short' }, { value: 'standard', label: 'Standard' }, { value: 'long', label: 'Long' }], help: s => s.problems + ' problems' },
          ...FB.levelRuleFields()
        ]
      },
      {
        title: 'Advanced', fields: [
          { type: 'heading', label: 'Set length' },
          { type: 'number', key: 'problems', label: 'Problems per set', min: 1, max: 200 },
          { type: 'heading', label: 'Flow' },
          { type: 'number', key: 'feedbackMs', label: 'Show the result for', suffix: 'ms', min: 200, max: 10000, step: 100 },
          { type: 'toggle', key: 'autoNext', label: 'Go to the next problem automatically', help: 'Off: press Enter or Next to continue after each answer.' }
        ]
      }
    ],
    onSettings(ctx, key, val) {
      const s = ctx.settings;
      if (key === 'setLength') s.problems = LENGTHS[val];
      if (key === 'problems') s.setLength = Object.keys(LENGTHS).find(k => LENGTHS[k] === val) || 'custom';
    },
    idleCounter: ctx => '0 of ' + ctx.settings.problems,

    mount(area, ctx) {
      let view, input, nextBtn, status, timeEl, submitFn = null;

      function draw() {
        area.innerHTML = '';
        view = h('div.mmath-view-field');
        input = h('input.result-input', { type: 'text', inputMode: 'numeric', autocomplete: 'off', placeholder: 'Type your answer here', disabled: true });
        nextBtn = h('button.btn.btn-secondary.btn-mmath-next', { type: 'button', disabled: true, on: { click: () => submitFn && submitFn() } }, 'Next');
        status = h('div.mmath-status');
        timeEl = h('div.mmath-time-counter');
        area.append(h('div.mmath-area.play-area', view,
          h('div.mmath-response', input, h('span.input-icon.ok', { html: FB.icons.check }), h('span.input-icon.err', { html: FB.icons.err })),
          h('div.mmath-next-wrap', nextBtn), status,
          FB.keypad(input, () => submitFn && submitFn(), ['.', '-'])));
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); submitFn && submitFn(); }
        });
        input.addEventListener('input', () => { input.value = input.value.replace(/[^0-9-]/g, ''); });
      }

      return {
        idle() { draw(); },
        cancel() { submitFn = null; },
        key(e, typing) {
          if (!typing && e.key === 'Enter' && submitFn) { e.preventDefault(); submitFn(); }
        },
        async run(areaEl, clock) {
          const s = ctx.settings, type = ctx.state.type, level = ctx.level;
          draw();
          const total = s.problems;
          let correct = 0, answeredMs = 0, timeouts = 0;
          for (let i = 0; i < total; i++) {
            ctx.setCounter((i + 1) + ' of ' + total);
            const p = makeProblem(type, level);
            view.textContent = p.text;
            input.value = ''; input.disabled = false; input.className = 'result-input';
            status.textContent = '';
            nextBtn.disabled = false;
            input.focus();
            const t0 = performance.now();
            let left = s.timePerAnswer, tickId = null;
            const tick = () => {
              ctx.setMiddle(h('span', 'Answer in: ', h('b', String(left)), ' s.'));
              if (left > 0) tickId = clock.after(1000, () => { left--; tick(); });
            };
            tick();
            let hideT = null;
            if (s.hideAfter > 0) hideT = clock.after(s.hideAfter * 1000, () => { view.textContent = ''; });
            const val = await clock.race(s.timePerAnswer * 1000, res => {
              submitFn = () => { const v = input.value.trim(); if (v !== '' && v !== '-') res(v); else input.focus(); };
            });
            submitFn = null;
            if (hideT) clock.clear(hideT);
            if (tickId) clock.clear(tickId);
            const ms = performance.now() - t0;
            const norm = v => (v || '').replace(/^(-?)0+(?=\d)/, '$1');
            const ok = val !== undefined && norm(val) === p.answer;
            if (val === undefined) timeouts++;
            if (ok) { correct++; answeredMs += ms; }
            input.disabled = true;
            nextBtn.disabled = true;
            view.textContent = p.text;
            input.classList.add(ok ? 'is-valid' : 'is-invalid');
            if (val === undefined) input.value = '';
            status.innerHTML = ok ? '<span class="ok">Correct: ' + p.answer + '</span>' : 'Correct: ' + p.answer + (val === undefined ? ' <span style="color:#f0b44c">(time is up)</span>' : '');
            if (s.autoNext) await clock.wait(s.feedbackMs);
            else {
              nextBtn.disabled = false; nextBtn.focus();
              await clock.race(null, res => { submitFn = res; });
              submitFn = null;
            }
          }
          ctx.setMiddle(null);
          const avg = correct ? answeredMs / correct / 1000 : 0;
          const label = (type === 'Mix' ? 'Mix' : type) + ' ' + level;
          ctx.finish({
            score: correct / total * 100,
            label,
            extra: correct ? avg.toFixed(1) + 's' : '–',
            title: TYPES.find(t => t.value === type).label.replace(/^\S+\s/, '') + ' · level ' + level,
            details: [
              `<b>${correct}</b> of ${total} correct`,
              correct ? `Average time per correct answer: <b>${avg.toFixed(1)} s</b>` : '',
              timeouts ? `${timeouts} ran out of time` : ''
            ].filter(Boolean)
          });
        }
      };
    }
  };

  game.docs = {
    'how-to-play': () => `
      <h2>How to play</h2>
      <p>A problem appears in the box. Work it out in your head, type the answer and press <kbd>Enter</kbd> (or click <b>Next</b>).
      You'll see right away whether you were right, along with the correct answer, and the next problem follows.</p>
      <ul>
        <li>Press <kbd>Space</kbd> or click <b>Start</b> to begin a set, <kbd>Esc</kbd> to cancel.</li>
        <li><b>Type</b> picks the operation: addition, subtraction, multiplication, division or a mix.</li>
        <li><b>Level</b> is written as <i>a.b</i>: the first number has <i>a</i> digits and the second has <i>b</i> digits.
          Level 3.2 multiplication looks like <code>418 * 57</code>.</li>
        <li>Division always comes out to a whole number; subtraction never goes below zero.</li>
      </ul>
      <h3>Levels</h3>
      <p>Each operation keeps its own level. Get 80% or more right and you move up one step; fall below 50% three sets in a
      row and you drop a step. All of this can be changed under <b>All settings</b>.</p>
      <h3>Extra challenge</h3>
      <p>Set <b>Hide the problem after</b> to a few seconds to make yourself hold the numbers in memory while you calculate.</p>`,
    info: () => `
      <h2>About Mental Math</h2>
      <p>Doing arithmetic in your head is a compact workout for several abilities at once: you hold the numbers in working
      memory, keep partial results while you carry on, and stay focused until the answer is done. Speed improves with practice
      as common facts become automatic.</p>
      <h3>Useful tricks</h3>
      <ul>
        <li><b>Left to right:</b> 47 + 38 → 40 + 30 = 70, 7 + 8 = 15, total 85.</li>
        <li><b>Round and adjust:</b> 99 × 23 = 100 × 23 − 23 = 2277.</li>
        <li><b>Split a factor:</b> 36 × 25 = 36 × 100 ÷ 4 = 900.</li>
        <li><b>Check with digit sums</b> (casting out nines) to catch slips.</li>
      </ul>`
  };

  FB.games.register(game);
})(window.FB);
