/* Complex Working Memory (complex span) — Verbal, Spatial and Combined. */
(function (FB) {
  'use strict';
  const h = FB.h;
  const SPEEDS = { slow: 4500, normal: 3500, fast: 2500 };
  // 16 consonants, laid out 4×4 in this order on the recall screen
  const LETTERS = 'PSTVXZBCDFGJKLMN'.split('');
  const TYPES = [{ value: 'verbal', label: 'Verbal' }, { value: 'spatial', label: 'Spatial' }, { value: 'combined', label: 'Combined' }];
  const decMs = s => s.speed === 'custom' ? s.decisionMs : SPEEDS[s.speed];
  // the item to remember stays up as long as one decision (3.5 s at Normal)
  const itemMs = s => s.itemMs > 0 ? s.itemMs : decMs(s);

  // 8x8 figure, symmetric on the vertical axis or not
  function makeFigure(symmetric) {
    const g = [];
    for (let r = 0; r < 8; r++) {
      const left = [];
      for (let c = 0; c < 4; c++) left.push(Math.random() < 0.5);
      g.push(left.concat(left.slice().reverse()));
    }
    if (!symmetric) {
      const flips = FB.randInt(1, 3);
      for (let k = 0; k < flips; k++) {
        const r = FB.rand(8), c = FB.rand(8);
        g[r][c] = !g[r][c];
      }
      // a later flip can undo an earlier one, so make sure it really is asymmetric
      const sym = g.every(row => row.every((v, c) => v === row[7 - c]));
      if (sym) { const r = FB.rand(8); g[r][0] = !g[r][0]; }
    }
    return g;
  }
  FB.figureEl = function (g) {
    const el = h('div.sym-figure');
    g.forEach(row => row.forEach(on => el.append(h('div' + (on ? '.on' : '')))));
    return el;
  };

  function uniqueSeq(pool, n) {
    const out = [];
    let bag = FB.shuffle(pool);
    while (out.length < n) {
      if (!bag.length) bag = FB.shuffle(pool);
      const v = bag.pop();
      if (out.length && out[out.length - 1] === v) { bag.unshift(v); if (bag.length === 1) bag = FB.shuffle(pool); continue; }
      out.push(v);
    }
    return out;
  }

  const game = {
    id: 'cwm',
    name: 'Complex Working Memory',
    menuName: 'CWM',
    title: 'Complex Working Memory Training',
    settingsTitle: 'CWM',
    icon: () => FB.icons.cwm(),
    cardIcon: () => FB.icons.cwm('#14c2bd', '#f0b44c'),
    blurb: 'Judge a word or a figure, then remember a letter or a square. Recall them all in order at the end.',
    pages: [['training', 'Training'], ['how-to-play', 'Tutorial'], ['info', 'Info']],
    types: TYPES,
    defaults: {
      speed: 'normal', decisionMs: 3500, decisions: 4, itemMs: 0,
      showMistakes: true, keys: { yes: 'a', no: 'l' }, advanceOnAnswer: true
    },
    defaultState: { level: 2, type: 'verbal' },
    levels: () => Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    nextSet(ctx) {
      // same figures BrainScale's panel shows: 2 trials per level
      const s = ctx.settings, L = ctx.state.level, t = decMs(s);
      return [['Level', L], ['Number of Trials', 2 * L], ['Trial Time', FB.fmtSec(t) + ' s.'], ['Duration', Math.round(2 * L * t / 1000) + ' s.']];
    },
    quick: () => [
      FB.speedSeg([{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }]),
      { type: 'toggle', key: 'showMistakes', label: 'Show my mistakes' }
    ],
    tabs: () => [
      {
        title: 'Training', fields: [
          FB.speedSeg([{ value: 'slow', label: 'Slow', sub: '4.5 s' }, { value: 'normal', label: 'Normal', sub: '3.5 s' }, { value: 'fast', label: 'Fast', sub: '2.5 s' }, { value: 'custom', label: 'Custom', sub: 'see Advanced' }]),
          { type: 'note', label: 'Time you get for each yes/no decision.' },
          { type: 'number', key: 'decisions', label: 'Decisions per round', min: 1, max: 10 },
          { type: 'toggle', key: 'showMistakes', label: 'Show my mistakes', help: 'The Yes/No button turns green or red after each decision.' },
          ...FB.levelRuleFields()
        ]
      },
      {
        title: 'Keys', fields: [
          { type: 'note', label: 'Click a box, then press the key you want.' },
          { type: 'keys', key: 'keys', items: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }] }
        ]
      },
      {
        title: 'Advanced', fields: [
          { type: 'number', key: 'decisionMs', label: 'Decision time (Custom speed)', suffix: 'ms', min: 800, max: 15000, step: 100 },
          { type: 'number', key: 'itemMs', label: 'Item to remember shown for', suffix: 'ms', min: 0, max: 8000, step: 100, help: '0 = same as the decision time.' },
          { type: 'toggle', key: 'advanceOnAnswer', label: 'Next decision right after I answer', help: 'Off: always wait for the full decision time.' }
        ]
      }
    ],
    idleCounter: () => '',
    hint: ctx => h('span', h('span.bulb', '💡'), 'Answer ', h('b', FB.keyName(ctx.settings.keys.yes)), ' = Yes, ', h('b', FB.keyName(ctx.settings.keys.no)), ' = No. Remember the items in order.'),

    mount(area, ctx) {
      let onYesNo = null;  // set while a decision is pending
      let onRecallKey = null;

      function frame() {
        area.innerHTML = '';
        const box = h('div.cwm-area.play-area');
        area.append(box);
        return box;
      }

      async function decision(clock, kind) {
        const s = ctx.settings;
        const box = frame();
        let truth, stim;
        if (kind === 'verbal') {
          const w = FB.words.next();
          truth = w.correct;
          box.append(h('div.cwm-question', 'Is the word below correct?'));
          stim = h('div.cwm-word', w.text);
        } else {
          truth = Math.random() < 0.5;
          box.append(h('div.cwm-question', 'Is the figure symmetric?'));
          stim = FB.figureEl(makeFigure(truth));
        }
        const yes = h('button.btn.btn-outline', { type: 'button' }, 'YES: ' + FB.keyName(s.keys.yes));
        const no = h('button.btn.btn-outline', { type: 'button' }, 'NO: ' + FB.keyName(s.keys.no));
        const fill = h('div.cwm-progress-fill');
        box.append(stim, h('div.cwm-yesno', yes, no), h('div.progress-holder', h('div.cwm-progress', fill)));
        const ms = decMs(s);
        const t0 = performance.now();
        clock.progress(fill, ms);
        const answer = await clock.race(ms, res => {
          onYesNo = res;
          yes.addEventListener('click', () => res(true));
          no.addEventListener('click', () => res(false));
        });
        onYesNo = null;
        const ok = answer === truth;
        yes.disabled = no.disabled = true;
        if (s.showMistakes && answer !== undefined) {
          (answer ? yes : no).classList.add(ok ? 'right' : 'wrong');
          await clock.wait(300);
        }
        if (answer !== undefined && !s.advanceOnAnswer) await clock.wait(Math.max(0, ms - (performance.now() - t0)));
        return { ok, answered: answer !== undefined };
      }

      async function showItem(clock, kind, item) {
        const box = frame();
        if (kind === 'verbal') {
          box.append(h('div.cwm-question', 'Remember the Letter below'), h('div.cwm-letter', item));
        } else {
          box.append(h('div.cwm-question', 'Remember the square position'));
          const g = h('div.cwm-grid4');
          for (let i = 0; i < 16; i++) g.append(h('div' + (i === item ? '.on' : '')));
          box.append(g);
        }
        await clock.wait(itemMs(ctx.settings));
      }

      function slotsEl(n) {
        const el = h('div.cwm-slots');
        for (let i = 0; i < n; i++) el.append(h('span'));
        return el;
      }

      // recall finishes on its own once every slot is filled
      async function recallVerbal(clock, items) {
        const box = frame();
        const picked = [];
        box.append(h('div.cwm-recall-title', 'Select the letters in order they appeared.'),
          h('div.cwm-recall-sub', 'You may click the letters or just type in the letters on your keyboard.'));
        const grid = h('div.cwm-grid4.letters.recall');
        const slots = slotsEl(items.length);
        const draw = () => FB.$$('span', slots).forEach((sp, i) => { sp.textContent = picked[i] || ''; });
        await clock.race(null, res => {
          const add = L => {
            if (picked.length >= items.length) return;
            picked.push(L); draw();
            if (picked.length === items.length) setTimeout(res, 250);
          };
          LETTERS.forEach(L => grid.append(h('div', { on: { click: () => add(L) } }, L)));
          box.append(grid, slots);
          onRecallKey = (e) => {
            const k = e.key.toUpperCase();
            if (LETTERS.includes(k)) add(k);
            else if (e.key === 'Backspace') { picked.pop(); draw(); }
            else return;
            e.preventDefault();
          };
        });
        onRecallKey = null;
        return picked;
      }

      async function recallSpatial(clock, items) {
        const box = frame();
        const picked = [];
        box.append(h('div.cwm-recall-title', 'Select the blocks in order they appeared.'),
          h('div.cwm-recall-sub', 'You may click the square or select it with the arrow keys and press enter.'));
        const grid = h('div.cwm-grid4.recall');
        const slots = slotsEl(items.length);
        const cells = [];
        let cursor = -1;
        const draw = () => {
          FB.$$('span', slots).forEach((sp, i) => { sp.textContent = picked[i] != null ? String(picked[i] + 1) : ''; });
          cells.forEach((c, i) => { c.classList.toggle('picked', picked.includes(i)); c.classList.toggle('cursor', i === cursor); });
        };
        await clock.race(null, res => {
          const add = i => {
            if (picked.length >= items.length) return;
            picked.push(i); draw();
            if (picked.length === items.length) setTimeout(res, 250);
          };
          for (let i = 0; i < 16; i++) { const c = h('div', { on: { click: () => add(i) } }); cells.push(c); grid.append(c); }
          box.append(grid, slots);
          onRecallKey = (e) => {
            const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
            if (moves[e.key] != null) {
              if (cursor < 0) cursor = 0;
              else {
                const n = cursor + moves[e.key];
                const sameRow = Math.floor(n / 4) === Math.floor(cursor / 4);
                if (n >= 0 && n < 16 && (Math.abs(moves[e.key]) === 4 || sameRow)) cursor = n;
              }
              draw();
            } else if (e.key === 'Enter' && cursor >= 0) add(cursor);
            else if (e.key === 'Backspace') { picked.pop(); draw(); }
            else return;
            e.preventDefault();
          };
        });
        onRecallKey = null;
        return picked;
      }

      return {
        idle() {
          const box = frame();
          box.style.justifyContent = 'center';
          const t = ctx.state.type;
          box.append(h('div', { style: { textAlign: 'center', color: '#cfd6d6', fontSize: '14.4px', maxWidth: '340px' } },
            t === 'spatial' ? 'Judge whether each figure is symmetric, and remember the square shown after each round.'
              : t === 'combined' ? 'Rounds alternate between word and symmetry decisions. Remember each letter and square position.'
                : 'Judge whether each word is a real, correctly spelled word, and remember the letter shown after each round.'));
        },
        cancel() { onYesNo = null; onRecallKey = null; },
        key(e) {
          if (e.repeat) return;
          if (onRecallKey) { onRecallKey(e); return; }
          if (!onYesNo) return;
          const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
          if (k === ctx.settings.keys.yes) { e.preventDefault(); onYesNo(true); }
          else if (k === ctx.settings.keys.no) { e.preventDefault(); onYesNo(false); }
        },
        async run(areaEl, clock) {
          const s = ctx.settings, L = ctx.state.level, type = ctx.state.type;
          // Combined: verbal round first, then they alternate
          const kinds = type === 'combined' ? Array.from({ length: L }, (_, i) => (i % 2 === 0 ? 'verbal' : 'spatial')) : Array(L).fill(type);
          const nV = kinds.filter(k => k === 'verbal').length, nS = L - nV;
          const letters = uniqueSeq(LETTERS, nV);
          const squares = uniqueSeq(Array.from({ length: 16 }, (_, i) => i), nS);
          const vItems = [], sItems = [];
          const dec = { verbal: { ok: 0, n: 0 }, spatial: { ok: 0, n: 0 } };
          frame();
          await clock.wait(800);
          for (let r = 0; r < L; r++) {
            ctx.setCounter('Round ' + (r + 1) + ' of ' + L);
            for (let d = 0; d < s.decisions; d++) {
              const res = await decision(clock, kinds[r]);
              dec[kinds[r]].n++; if (res.ok) dec[kinds[r]].ok++;
            }
            if (kinds[r] === 'verbal') { const it = letters[vItems.length]; vItems.push(it); await showItem(clock, 'verbal', it); }
            else { const it = squares[sItems.length]; sItems.push(it); await showItem(clock, 'spatial', it); }
          }
          ctx.setCounter('Recall');
          let rec = 0;
          const details = [];
          const decN = dec.verbal.n + dec.spatial.n, decOk = dec.verbal.ok + dec.spatial.ok;
          if (vItems.length) {
            const got = await recallVerbal(clock, vItems);
            vItems.forEach((it, i) => { if (got[i] === it) rec++; });
            details.push(`Decision Errors Verbal: <b>${dec.verbal.n - dec.verbal.ok} / ${dec.verbal.n}</b>`,
              `Memory Tasks Verbal: <b>${vItems.join(' ')}</b>`,
              `Recall Verbal: ${vItems.map((it, i) => `<span style="color:${got[i] === it ? '#7fe0b0' : '#ff8b80'}">${got[i] || '–'}</span>`).join(' ')}`);
          }
          if (sItems.length) {
            const got = await recallSpatial(clock, sItems);
            sItems.forEach((it, i) => { if (got[i] === it) rec++; });
            details.push(`Decision Errors Spatial: <b>${dec.spatial.n - dec.spatial.ok} / ${dec.spatial.n}</b>`,
              `Memory Tasks Spatial: <b>${sItems.map(x => x + 1).join(' ')}</b>`,
              `Recall Spatial: ${sItems.map((it, i) => `<span style="color:${got[i] === it ? '#7fe0b0' : '#ff8b80'}">${got[i] != null ? got[i] + 1 : '–'}</span>`).join(' ')}`);
          }
          // BrainScale's Total Rate is the average of the decision and recall rates
          const recallPct = rec / L * 100;
          const decPct = decN ? decOk / decN * 100 : 100;
          details.push(`Decisions Rate: <b>${Math.round(decPct)}%</b> · Recall Rate: <b>${Math.round(recallPct)}%</b>`);
          ctx.finish({
            score: (decPct + recallPct) / 2,
            label: TYPES.find(t => t.value === type).label + ' ' + L,
            title: 'Set Statistics · Total Rate',
            details
          });
        }
      };
    }
  };

  game.docs = {
    'how-to-play': () => `
      <h2>Complex Working Memory — tutorial</h2>
      <p>A set is made of <b>rounds</b>; the number of rounds equals your level. Each round has two parts:</p>
      <ol>
        <li><b>Decide</b> — answer 4 quick yes/no questions. A blue bar shows the time left for each one.</li>
        <li><b>Remember</b> — one item is shown. Keep it in mind while you carry on with the next round.</li>
      </ol>
      <p>After the last round comes the <b>recall</b> stage: enter every remembered item in the order it was shown.
      At level 5 you hold 5 items while making 20 decisions.</p>
      <h3>Verbal</h3>
      <p><b>Decide:</b> is the word a real, correctly spelled word, or a jumble of letters? Press <kbd>A</kbd> for Yes or <kbd>L</kbd> for No.<br>
      <b>Remember:</b> a single letter.<br>
      <b>Recall:</b> click the letters in the 4×4 grid (or type them) in order. The set ends once every slot is filled;
      <kbd>Backspace</kbd> takes back the last one.</p>
      <h3>Spatial</h3>
      <p><b>Decide:</b> is the 8×8 figure symmetric around its vertical middle line — is the left half a mirror image of the right half?</p>
      <div class="figs" id="cwmFigs"></div>
      <p><b>Remember:</b> the position of the filled square in a 4×4 grid.<br>
      <b>Recall:</b> click the squares in order, or move with the arrow keys and press <kbd>Enter</kbd>.</p>
      <h3>Combined</h3>
      <p>Rounds alternate: a verbal round, then a spatial round, and so on. At recall you enter the letters first, then the squares.</p>
      <h3>Scoring</h3>
      <p>Your <b>Total Rate</b> is the average of two numbers: the share of decisions you got right (a decision you don't answer
      in time counts as wrong) and the share of items you recalled in the right position. So both parts matter equally.</p>`,
    info: () => `
      <h2>About complex span tasks</h2>
      <p>Complex span tasks (such as operation span, reading span and symmetry span) were developed in the 1980s to measure
      working memory capacity: how much you can hold in mind <i>while</i> processing something else. That mix of storage
      and processing is what separates them from simple span tasks like Memory Span.</p>
      <p>This exercise follows the design used in a well-known 2010 training study by Chein and Morrison, which combined
      a lexical (word) decision with letter storage and a symmetry decision with spatial storage, and found improvements
      in working memory, attention control and reading comprehension after training.</p>
      <h3>What it trains</h3>
      <ul><li>Working memory capacity</li><li>Resisting interference from a secondary task</li><li>Attention control</li></ul>`,
    afterRender: (sub, el) => {
      if (sub !== 'how-to-play') return;
      const f = el.querySelector('#cwmFigs');
      if (!f) return;
      f.append(h('div', h('div', 'Symmetric'), FB.figureEl(makeFigure(true))), h('div', h('div', 'Not symmetric'), FB.figureEl(makeFigure(false))));
    }
  };

  FB.games.register(game);
})(window.FB);
