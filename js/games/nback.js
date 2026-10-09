/* Dual N-Back (and Single / Triple / Quad / Penta variants). */
(function (FB) {
  'use strict';
  const h = FB.h;

  const MODS = {
    position: { label: 'Position', count: 9 },
    audio: { label: 'Audio', count: 8 },
    color: { label: 'Color', count: 8 },
    shape: { label: 'Shape', count: 8 },
    number: { label: 'Number', count: 9 }
  };
  const MOD_ORDER = ['audio', 'position', 'color', 'shape', 'number'];
  const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
  const COLOR_WORDS = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'white', 'pink'];
  const TYPE_NAMES = ['', 'Single', 'Dual', 'Triple', 'Quad', 'Penta'];
  const SPEEDS = { slow: 4000, normal: 3000, fast: 2500 };
  const LENGTHS = { short: 10, standard: 20, long: 30 };

  // shapes drawn in a 100x100 box
  const SHAPES = [
    'M8 8h84v84H8z',
    'M50 6a44 44 0 1 0 0.01 0z',
    'M50 6 95 90H5z',
    'M50 3 97 50 50 97 3 50z',
    'M50 4l12.6 30.5 32.9 2.6-25 21.5 7.7 32.1L50 73.4 21.8 90.7l7.7-32.1-25-21.5 32.9-2.6z',
    'M36 6h28v30h30v28H64v30H36V64H6V36h30z',
    'M27 8h46l23 42-23 42H27L4 50z',
    'M50 92 12 54C-2 40 4 12 27 12c11 0 18 7 23 15 5-8 12-15 23-15 23 0 29 28 15 42z'
  ];

  const ROW_KEYS = ['1234567890', 'qwertyuiop', 'asdfghjkl;', 'zxcvbnm,.'];
  const keyCol = k => { for (const r of ROW_KEYS) { const i = r.indexOf(k); if (i >= 0) return i; } return 50; };

  const typeName = mods => {
    const n = mods.length;
    if (n === 1) return MODS[mods[0]].label;
    return TYPE_NAMES[n] || (n + '-modal');
  };
  const trialsFor = (s, n) => Math.max(n + 1, Math.round(s.base + Math.pow(n * s.factor, s.exponent)));
  const stepFor = (s, n) => (s.speed === 'custom' ? s.stepMs : SPEEDS[s.speed]) + (s.slowerAtHigher ? s.perLevelMs * (n - 1) : 0);

  const game = {
    id: 'dual-n-back',
    name: 'Dual N-Back',
    title: 'Dual N-Back Training',
    settingsTitle: 'N-Back',
    levelLabel: 'N-Back',
    levelWord: 'N =',
    icon: () => FB.icons.nback(),
    cardIcon: () => FB.icons.nback('#14c2bd', '#f0b44c'),
    blurb: 'Track positions and spoken letters from N steps back. The classic working-memory trainer.',
    pages: [['training', 'Training'], ['how-to-play', 'How to play'], ['info', 'Info']],
    defaults: {
      speed: 'normal', stepMs: 3000, slowerAtHigher: false, perLevelMs: 150,
      setLength: 'standard', base: 20, factor: 1, exponent: 2,
      matchRate: 25, stimMs: 500, distract: false,
      volume: 100, sounds: 'letters', showMistakes: false, showPresses: false, showCounter: true,
      keys: { position: 'a', audio: 'l', color: 'f', shape: 'j', number: 'k' },
      colors: ['#d13b3b', '#2f9e44', '#1c7ed6', '#f2c200', '#9c36b5', '#f76707', '#e8e8e8', '#0ca678']
    },
    defaultState: { level: 1, mods: ['audio', 'position'], async: { audio: false, position: false } },

    levels: () => Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    getType: st => typeName(st.mods),

    typeButton: {
      label: ctx => typeName(ctx.state.mods),
      open: ctx => openTypeDialog(ctx)
    },

    nextSet(ctx) {
      const s = ctx.settings, n = ctx.state.level;
      const t = trialsFor(s, n), step = stepFor(s, n);
      return [['Level', n], ['Type', typeName(ctx.state.mods)], ['Number of Trials', t], ['Trial Time', FB.fmtSec(step) + ' s.'], ['Set Duration', Math.round(t * step / 1000) + ' s.']];
    },
    quick: () => [
      FB.speedSeg([{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }]),
      { type: 'range', key: 'volume', label: 'Volume', min: 0, max: 100 },
      { type: 'toggle', key: 'showMistakes', label: 'Show my mistakes' }
    ],
    tabs: (ctx) => [
      {
        title: 'Training', fields: [
          FB.speedSeg([{ value: 'slow', label: 'Slow', sub: '4 s' }, { value: 'normal', label: 'Normal', sub: '3 s' }, { value: 'fast', label: 'Fast', sub: '2.5 s' }, { value: 'custom', label: 'Custom', sub: 'see Advanced' }]),
          { type: 'note', label: 'Time per step. Slow is easier.' },
          {
            type: 'seg', key: 'setLength', label: 'Set length',
            options: [{ value: 'short', label: 'Short' }, { value: 'standard', label: 'Standard' }, { value: 'long', label: 'Long' }],
            help: s => trialsFor(s, ctx.state.level) + ' trials at ' + ctx.state.level + '-back'
          },
          ...FB.levelRuleFields()
        ]
      },
      {
        title: 'Sound & keys', fields: [
          { type: 'range', key: 'volume', label: 'Volume', min: 0, max: 100 },
          { type: 'select', key: 'sounds', label: 'Sounds', options: [{ value: 'letters', label: 'Letters' }, { value: 'colors', label: 'Colors' }] },
          { type: 'voice' },
          { type: 'heading', label: 'Keys' },
          { type: 'note', label: 'Click a box, then press the key you want.' },
          { type: 'keys', key: 'keys', items: [{ id: 'position', label: 'Position match' }, { id: 'audio', label: 'Sound match' }, { id: 'color', label: 'Color match' }, { id: 'shape', label: 'Shape match' }, { id: 'number', label: 'Number match' }], help: 'Color, shape and number are for Triple N-Back and up.' }
        ]
      },
      {
        title: 'Look', fields: [
          { type: 'toggle', key: 'showMistakes', label: 'Show my mistakes', help: 'Off (default): no feedback during the set, only the results at the end. On: after each step a button turns green if you were right, red if not.' },
          { type: 'toggle', key: 'showPresses', label: 'Highlight the button I press', help: 'Off (default): pressing a key or button gives no visual sign during the set.' },
          { type: 'toggle', key: 'showCounter', label: 'Show trial counter' },
          { type: 'colors', key: 'colors', label: 'Colors', help: 'Used by the Color modality. Change them if two look alike to you.' }
        ]
      },
      {
        title: 'Advanced', fields: [
          { type: 'heading', label: 'Speed' },
          { type: 'number', key: 'stepMs', label: 'Time per step (Custom speed)', suffix: 'ms', min: 800, max: 10000, step: 50 },
          { type: 'number', key: 'stimMs', label: 'Stimulus shown for', suffix: 'ms', min: 100, max: 3000, step: 50 },
          { type: 'toggle', key: 'slowerAtHigher', label: 'Slower at higher levels', help: 'Each level above 1 adds the time below to every step.' },
          { type: 'number', key: 'perLevelMs', label: 'Extra time per level', suffix: 'ms', min: 0, max: 2000, step: 50 },
          { type: 'heading', label: 'Trials per set' },
          { type: 'number', key: 'base', label: 'Base trials', min: 1, max: 200 },
          { type: 'number', key: 'factor', label: 'Level factor', min: 0, max: 10, step: 0.1 },
          { type: 'number', key: 'exponent', label: 'Exponent', min: 0, max: 3, step: 0.1, help: s => 'Trials = base + (level × factor) ^ exponent: ' + trialsFor(s, ctx.state.level) + ' trials at ' + ctx.state.level + '-back.' },
          { type: 'heading', label: 'Other' },
          { type: 'number', key: 'matchRate', label: 'Matches per set', suffix: '%', min: 5, max: 80 },
          { type: 'toggle', key: 'distract', label: 'Distracting background', help: 'Flashes random background colors during a set.' }
        ]
      }
    ],
    onSettings(ctx, key, val) {
      const s = ctx.settings;
      if (key === 'setLength') s.base = LENGTHS[val];
      if (key === 'base') s.setLength = Object.keys(LENGTHS).find(k => LENGTHS[k] === val) || 'custom';
    },
    idleCounter: ctx => '0 of ' + trialsFor(ctx.settings, ctx.state.level),
    hint: ctx => {
      const n = ctx.state.level;
      return h('span', h('span.bulb', '💡'), n === 1 ? 'Match signals with those shown on the previous trial.' : 'Match signals with those shown ' + n + ' trials back.');
    },

    mount(area, ctx) {
      let grid, cells, buttons, responses, feedbackTimer;
      const activeMods = () => MOD_ORDER.filter(m => ctx.state.mods.includes(m));
      const buttonMods = () => activeMods().slice().sort((a, b) => keyCol(ctx.settings.keys[a]) - keyCol(ctx.settings.keys[b]));

      function draw(withButtonsEnabled) {
        area.innerHTML = '';
        grid = h('div.nback-grid');
        cells = [];
        for (let i = 0; i < 9; i++) { const c = h('div.nback-cell'); cells.push(c); grid.append(c); }
        buttons = {};
        const bar = h('div.nback-buttons');
        buttonMods().forEach(m => {
          const k = ctx.settings.keys[m];
          const b = h('button.nback-button', { type: 'button', disabled: !withButtonsEnabled, on: { pointerdown: e => { e.preventDefault(); respond(m); } } },
            (k ? FB.keyName(k) + ': ' : '') + MODS[m].label);
          buttons[m] = b; bar.append(b);
        });
        area.append(grid, bar);
      }

      function respond(m) {
        if (!ctx.running || !responses || responses[m]) return;
        responses[m] = true;
        if (ctx.settings.showPresses) buttons[m].classList.add('pressed');
      }

      function clearMarker() { cells.forEach(c => { c.innerHTML = ''; }); }

      function showMarker(cellIdx, vals) {
        const s = ctx.settings;
        const color = vals.color != null ? s.colors[vals.color] : getComputedStyle(document.documentElement).getPropertyValue('--marker').trim() || '#aa2a2a';
        const mk = h('div.nback-marker');
        if (vals.shape != null) {
          mk.classList.add('shape');
          mk.innerHTML = `<svg viewBox="0 0 100 100"><path d="${SHAPES[vals.shape]}" fill="${color}"/></svg>`;
        } else mk.style.background = color;
        if (vals.number != null) mk.append(h('span.num', String(vals.number + 1)));
        cells[cellIdx].innerHTML = '';
        cells[cellIdx].append(mk);
      }

      function speak(val) {
        const word = ctx.settings.sounds === 'colors' ? COLOR_WORDS[val] : LETTERS[val];
        FB.speech.say(word, ctx.volume());
      }

      // Exactly round(scorable × rate) matches per signal, like BrainScale's
      // fixed 5 matches in a 20-step 1-back set; every other step is a non-match.
      function makeSeq(count, n, total, rate) {
        const scorable = total - n;
        const want = Math.max(1, Math.round(scorable * rate / 100));
        const matchAt = new Set(FB.shuffle(Array.from({ length: scorable }, (_, i) => i + n)).slice(0, want));
        const seq = [];
        for (let i = 0; i < total; i++) {
          if (matchAt.has(i)) seq.push(seq[i - n]);
          else {
            let v;
            do { v = FB.rand(count); } while (i >= n && v === seq[i - n]);
            seq.push(v);
          }
        }
        return seq;
      }

      return {
        idle() { draw(false); },
        cancel() { clearTimeout(feedbackTimer); },
        key(e) {
          if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
          const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
          for (const m of activeMods()) if (ctx.settings.keys[m] === k) { e.preventDefault(); respond(m); }
        },
        async run(areaEl, clock) {
          const s = ctx.settings, n = ctx.state.level, mods = activeMods();
          const total = trialsFor(s, n), step = stepFor(s, n);
          const stim = Math.min(s.stimMs, step - 150);
          draw(true);
          const seqs = {};
          mods.forEach(m => { seqs[m] = makeSeq(MODS[m].count, n, total, s.matchRate); });
          const tally = {};
          mods.forEach(m => { tally[m] = { tp: 0, fp: 0, fn: 0, tn: 0 }; });
          const isAsync = m => !!(ctx.state.async && ctx.state.async[m]);

          await clock.wait(600);
          for (let i = 0; i < total; i++) {
            ctx.setCounter(s.showCounter ? (i + 1) + ' of ' + total : '');
            responses = {};
            if (s.distract) grid.style.backgroundColor = `hsl(${FB.rand(360)}, ${FB.randInt(20, 55)}%, ${FB.randInt(22, 34)}%)`;
            const visual = mods.filter(m => m !== 'audio');
            const present = (asyncPhase) => {
              const visNow = visual.length && (isAsync('position') === asyncPhase);
              if (visNow) {
                const vals = {};
                ['color', 'shape', 'number'].forEach(m => { if (mods.includes(m)) vals[m] = seqs[m][i]; });
                showMarker(mods.includes('position') ? seqs.position[i] : 4, vals);
                clock.after(stim, clearMarker);
              }
              if (mods.includes('audio') && isAsync('audio') === asyncPhase) speak(seqs.audio[i]);
            };
            present(false);
            if (mods.some(isAsync)) clock.after(Math.round(step / 2), () => present(true));
            await clock.wait(step);

            // score this step
            const fb = {};
            mods.forEach(m => {
              if (i < n) { if (responses[m]) { tally[m].fp++; fb[m] = 'wrong'; } return; }
              const match = seqs[m][i] === seqs[m][i - n];
              const pressed = !!responses[m];
              if (match && pressed) { tally[m].tp++; fb[m] = 'right'; }
              else if (match) { tally[m].fn++; fb[m] = 'wrong'; }
              else if (pressed) { tally[m].fp++; fb[m] = 'wrong'; }
              else tally[m].tn++;
            });
            Object.values(buttons).forEach(b => b.classList.remove('pressed', 'right', 'wrong'));
            if (s.showMistakes) {
              Object.entries(fb).forEach(([m, c]) => buttons[m] && buttons[m].classList.add(c));
              clearTimeout(feedbackTimer);
              feedbackTimer = setTimeout(() => Object.values(buttons).forEach(b => b.classList.remove('right', 'wrong')), Math.min(700, step * 0.4));
            }
          }
          responses = null;
          grid.style.backgroundColor = '';

          // BrainScale scoring: per signal, Total = number of matches,
          // Errors = misses + false alarms, Rate = (Total − Errors) / Total
          // (can go negative). The set's Success Rate is the same over all
          // signals, floored at 0%.
          let TOT = 0, ERR = 0;
          const details = mods.map(m => {
            const t = tally[m];
            const total_ = t.tp + t.fn, errors = t.fn + t.fp;
            TOT += total_; ERR += errors;
            const rate = total_ ? Math.round((total_ - errors) / total_ * 100) : 0;
            return `<b>${MODS[m].label}</b> — Total: ${total_} · Errors: ${errors} · Rate: ${rate}%`;
          });
          const score = TOT ? Math.max(0, (TOT - ERR) / TOT * 100) : 0;
          ctx.finish({
            score, details,
            label: typeName(mods)[0] + n + 'B',
            title: 'Last Set · ' + typeName(mods) + ' ' + n + '-Back · Success Rate',
            extra: String(n),
            stat: n
          });
        }
      };
    }
  };

  function openTypeDialog(ctx) {
    const st = ctx.state;
    const sel = new Set(st.mods);
    const asyncSel = Object.assign({ audio: false, position: false }, st.async);
    const label = h('b');
    const upd = () => { label.textContent = sel.size ? typeName(MOD_ORDER.filter(m => sel.has(m))) : '—'; };
    const grid = h('div.type-grid');
    MOD_ORDER.forEach(m => {
      grid.append(h('label', h('input', { type: 'checkbox', checked: sel.has(m), on: { change: e => { e.target.checked ? sel.add(m) : sel.delete(m); upd(); } } }), MODS[m].label));
      if (m === 'audio' || m === 'position') {
        grid.append(h('label.async', { title: 'Show this signal half a step later than the others' },
          h('input', { type: 'checkbox', checked: !!asyncSel[m], on: { change: e => { asyncSel[m] = e.target.checked; } } }), 'async'));
      } else grid.append(h('span'));
    });
    upd();
    FB.modal({
      title: 'Change N-Back Type', classic: true,
      body: h('div', grid, h('div.type-selected', 'Selected Type: ', label)),
      foot: close => h('div.modal-foot',
        h('button.btn', { type: 'button', style: { background: '#fff', color: '#333' }, on: { click: close } }, 'Cancel'),
        h('button.btn.btn-info', {
          type: 'button', on: {
            click: () => {
              if (!sel.size) { FB.toast('Pick at least one signal'); return; }
              st.mods = MOD_ORDER.filter(m => sel.has(m));
              st.async = asyncSel; st.weak = 0;
              FB.db.save(); close(); ctx.refresh();
              if (FB.currentPage) FB.currentPage.showIdle();
            }
          }
        }, 'Save'))
    });
  }

  game.docs = {
    'how-to-play': () => `
      <h2>How to play</h2>
      <p>Every step, a red square lights up in one of the nine cells and a letter is spoken at the same time.
      Your job is to notice when the current signal is the same as the one from <b>N steps ago</b>.</p>
      <ul>
        <li>Press <kbd>A</kbd> (or click <b>Position</b>) when the square is in the same cell as N steps back.</li>
        <li>Press <kbd>L</kbd> (or click <b>Audio</b>) when the letter is the same as N steps back.</li>
        <li>Both can match at once — then press both keys.</li>
        <li>If nothing matches, do nothing.</li>
      </ul>
      <h3>Example at 2-back</h3>
      <table><tr><th>Step</th><th>Cell</th><th>Letter</th><th>Press</th></tr>
        <tr><td>1</td><td>top-left</td><td>K</td><td>—</td></tr>
        <tr><td>2</td><td>center</td><td>R</td><td>—</td></tr>
        <tr><td>3</td><td>top-left</td><td>T</td><td><kbd>A</kbd> (same cell as step 1)</td></tr>
        <tr><td>4</td><td>bottom</td><td>R</td><td><kbd>L</kbd> (same letter as step 2)</td></tr>
        <tr><td>5</td><td>top-left</td><td>T</td><td><kbd>A</kbd> + <kbd>L</kbd></td></tr>
      </table>
      <h3>Scoring and levels</h3>
      <p>Each signal is scored as hits ÷ (hits + misses + false alarms). Score 80% or more and N goes up by one.
      Score under 50% three sets in a row and N goes down. You can change these limits under <b>All settings</b>.</p>
      <h3>More signals</h3>
      <p>Click the <b>Type</b> link in the header to train Single (one signal), Triple, Quad or Penta N-Back by adding
      color, shape and number signals. Each has its own key, which you can change in <b>All settings → Sound &amp; keys</b>.</p>
      <h3>Tips</h3>
      <ul><li>Start at 1-back and let the level climb on its own.</li>
      <li>Say the last N items quietly to yourself as a running list.</li>
      <li>About 20 minutes a day is a common training dose.</li></ul>`,
    info: () => `
      <h2>About Dual N-Back</h2>
      <p>The n-back task was introduced by Wayne Kirchner in 1958 as a way to measure short-term memory. The dual
      version, which tracks a visual and an auditory stream at the same time, became popular after a 2008 study by
      Jaeggi and colleagues reported gains in fluid intelligence after several weeks of training.</p>
      <p>Later studies have argued over how far those gains transfer, but the task is still one of the most demanding
      and widely used working-memory exercises: you must keep updating a moving window of items while ignoring the ones
      that are no longer relevant.</p>
      <h3>What it trains</h3>
      <ul><li>Working memory updating</li><li>Sustained attention</li><li>Handling two streams of information at once</li></ul>`
  };

  FB.games.register(game);
})(window.FB);
