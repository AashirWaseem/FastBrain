/* Memory Span — digits or letters, forward / reverse / sorted. */
(function (FB) {
  'use strict';
  const h = FB.h;
  const TYPES = [
    { value: 'Digit', label: 'Digit', short: 'Digit' }, { value: 'DigitReverse', label: 'Digit Reverse', short: 'DigitReverse' },
    { value: 'Letter', label: 'Letter', short: 'Letter' }, { value: 'LetterReverse', label: 'Letter Reverse', short: 'LetterReverse' },
    { value: 'DigitSorted', label: 'Digit Sorted', short: 'DigitSorted' }, { value: 'LetterSorted', label: 'Letter Sorted', short: 'LetterSorted' }
  ];
  const SPEEDS = { slow: 3300, normal: 2500, fast: 2000 };
  const stepMs = s => s.speed === 'custom' ? s.stepMs : SPEEDS[s.speed];
  const DIGITS = '0123456789'.split('');
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  function makeSeq(type, n, settings) {
    const pool = type.startsWith('Digit') ? DIGITS : (settings.consonantsOnly ? LETTERS.filter(c => !'AEIOU'.includes(c)) : LETTERS);
    // every symbol is drawn independently, so repeats (even back to back) can happen
    return Array.from({ length: n }, () => FB.pick(pool));
  }
  function expected(type, seq) {
    if (type.endsWith('Reverse')) return seq.slice().reverse();
    if (type.endsWith('Sorted')) return seq.slice().sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    return seq.slice();
  }

  const game = {
    id: 'memory-span',
    name: 'Memory Span',
    title: 'Memory Span Training',
    icon: () => FB.icons.span(),
    cardIcon: () => FB.icons.span('#14c2bd', '#f0b44c'),
    blurb: 'Recall growing sequences of digits or letters — forward, backward or sorted.',
    pages: [['training', 'Training'], ['how-to-play', 'How to play'], ['info', 'Info']],
    types: TYPES,
    defaults: { speed: 'normal', stepMs: 2500, showRatio: 50, rounds: 4, showMistakes: false, speak: false, volume: 60, consonantsOnly: false },
    defaultState: { level: 5, type: 'Digit' },
    levels: () => Array.from({ length: 100 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    nextSet(ctx) {
      const s = ctx.settings;
      return [['Level', ctx.state.level], ['Number of Rounds', s.rounds], ['Trial Time', FB.fmtSec(stepMs(s)) + ' s.']];
    },
    quick: () => [
      FB.speedSeg([{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }])
    ],
    tabs: () => [
      {
        title: 'Training', fields: [
          FB.speedSeg([{ value: 'slow', label: 'Slow', sub: '3.3 s' }, { value: 'normal', label: 'Normal', sub: '2.5 s' }, { value: 'fast', label: 'Fast', sub: '2 s' }, { value: 'custom', label: 'Custom', sub: 'see Advanced' }]),
          { type: 'note', label: 'Time per symbol.' },
          { type: 'number', key: 'rounds', label: 'Rounds per set', min: 1, max: 30 },
          { type: 'toggle', key: 'showMistakes', label: 'Show my mistakes', help: 'After each round, see the right answer before the next round starts. (The full list is always shown at the end.)' },
          ...FB.levelRuleFields()
        ]
      },
      {
        title: 'Sound', fields: [
          { type: 'toggle', key: 'speak', label: 'Also speak each symbol', help: 'Reads every digit or letter aloud as it appears.' },
          { type: 'range', key: 'volume', label: 'Volume', min: 0, max: 100 },
          { type: 'voice' }
        ]
      },
      {
        title: 'Advanced', fields: [
          { type: 'number', key: 'stepMs', label: 'Time per symbol (Custom speed)', suffix: 'ms', min: 300, max: 8000, step: 50 },
          { type: 'number', key: 'showRatio', label: 'Symbol visible for', suffix: '% of step', min: 20, max: 100 },
          { type: 'toggle', key: 'consonantsOnly', label: 'Letters: consonants only', help: 'Stops letters from forming easy-to-remember syllables.' }
        ]
      }
    ],
    idleCounter: ctx => 'Round 0 of ' + ctx.settings.rounds,

    mount(area, ctx) {
      let box, promptEl, submitFn = null;
      function draw() {
        area.innerHTML = '';
        promptEl = h('div.prompt-line', '');
        box = h('div.span-area.play-area');
        area.append(promptEl, box);
      }
      return {
        idle() { draw(); },
        cancel() { submitFn = null; },
        key(e, typing) {
          if (!typing && e.key === 'Enter' && submitFn) { e.preventDefault(); submitFn(); }
        },
        async run(areaEl, clock) {
          const s = ctx.settings, L = ctx.state.level, type = ctx.state.type, R = s.rounds;
          const T = stepMs(s), vis = Math.round(T * s.showRatio / 100);
          let correct = 0;
          const rounds = [];
          draw();
          for (let r = 0; r < R; r++) {
            ctx.setCounter('Round ' + (r + 1) + ' of ' + R);
            promptEl.textContent = 'Remember the symbols in the order they appear';
            box.innerHTML = '';
            const sym = h('div.span-symbol');
            box.append(sym);
            const seq = makeSeq(type, L, s);
            // one empty step before the first symbol
            await clock.wait(T);
            for (let i = 0; i < L; i++) {
              sym.textContent = seq[i];
              if (s.speak) FB.speech.say(seq[i], ctx.volume());
              await clock.wait(vis);
              sym.textContent = '';
              await clock.wait(T - vis);
            }
            // recall
            const how = type.endsWith('Reverse') ? 'in REVERSE order' : type.endsWith('Sorted') ? 'SORTED from lowest to highest' : 'in the order they appeared';
            promptEl.textContent = 'Enter symbols ' + how;
            box.innerHTML = '';
            const input = h('input.span-input', { type: 'text', autocomplete: 'off', spellcheck: false, inputMode: type.startsWith('Digit') ? 'numeric' : 'text' });
            const btn = h('button.btn.btn-info.btn-sm', { type: 'button', style: { marginTop: '10px' } }, 'Finish Round');
            box.append(h('div.span-recall',
              h('div.rlabel', 'Round ' + (r + 1) + ' (symbols from 1 to ' + L + '):'), input, btn));
            input.focus();
            const ans = await clock.race(null, res => {
              submitFn = () => res(input.value);
              btn.addEventListener('click', () => res(input.value));
              input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); res(input.value); } });
            });
            submitFn = null;
            const given = ans.toUpperCase().replace(/[^0-9A-Z]/g, '').split('');
            const exp = expected(type, seq);
            let ok = 0;
            exp.forEach((c, i) => { if (given[i] === c) ok++; });
            correct += ok;
            rounds.push({ given, exp });
            if (s.showMistakes) {
              box.innerHTML = '';
              const mine = h('div.span-answer');
              given.forEach((c, i) => mine.append(h('span.' + (exp[i] === c ? 'right' : 'wrong'), c)));
              if (!given.length) mine.append(h('span.wrong', '(nothing)'));
              box.append(h('div.span-recall',
                h('div.span-feedback-label', ok === L ? 'Perfect!' : 'You entered (' + ok + ' of ' + L + ' right)'), mine,
                ok === L ? null : h('div', { style: { marginTop: '14px' } }, h('div.span-feedback-label', 'Correct answer'), h('div.span-answer', exp.join('')))));
              await clock.wait(ok === L ? 900 : Math.min(5000, 1800 + L * 120));
            }
          }
          const t = TYPES.find(x => x.value === type);
          // every round: what was typed, wrong symbols in red with the right one after them
          const roundRows = rounds.map((rd, i) => 'Round ' + (i + 1) + ': ' + rd.exp.map((c, j) => rd.given[j] === c
            ? `<span style="color:#7fe0b0">${c}</span>`
            : `<span style="color:#ff8b80;text-decoration:line-through">${FB.esc(rd.given[j] || '_')}</span><span style="color:#cfd6d6">${c}</span>`).join(''));
          const total = L * R;
          ctx.finish({
            score: correct / total * 100,
            label: t.short + ' ' + L,
            title: 'Exercise Statistics · ' + t.label + ' · Success Rate',
            details: roundRows.concat([`Total Items: <b>${total}</b> · Correct Answers: <b>${correct}</b> · Errors: <b>${total - correct}</b>`])
          });
        }
      };
    }
  };

  game.docs = {
    'how-to-play': () => `
      <h2>How to play</h2>
      <p>Symbols (digits or letters) appear one at a time in the middle of the box. When the sequence ends, type them into the
      answer field and press <kbd>Enter</kbd> or <b>Finish Round</b>.</p>
      <ul>
        <li><b>Level</b> = number of symbols per round (1 to 100).</li>
        <li>Spaces and commas in your answer are ignored; letters are not case-sensitive.</li>
        <li>Symbols are picked at random, so the same one can appear twice, even back to back.</li>
        <li>Success Rate = symbols typed in the correct position ÷ all symbols in the set. Result Score = level + success rate (level 4 at 81% → 4.81).</li>
        <li>The next round starts right after you submit; every round's answer is listed in the results at the end.</li>
      </ul>
      <h3>Types</h3>
      <table>
        <tr><td><b>Digit / Letter</b></td><td>Type the sequence exactly as shown.</td></tr>
        <tr><td><b>… Reverse</b></td><td>Type it from last to first.</td></tr>
        <tr><td><b>… Sorted</b></td><td>Type the symbols in ascending order (0→9 or A→Z), keeping duplicates.</td></tr>
      </table>
      <p>Example: you see <b>7 2 9 4</b>. Digit → <code>7294</code>, Digit Reverse → <code>4927</code>, Digit Sorted → <code>2479</code>.</p>
      <h3>Tip</h3>
      <p>Group symbols into chunks of three or four, and rehearse them silently as they arrive.</p>`,
    info: () => `
      <h2>About memory span</h2>
      <p>The digit span test is one of the oldest measures in psychology, going back to the 1880s, and is part of most
      standard intelligence and memory batteries today. George Miller's 1956 paper famously put typical span at
      "seven, plus or minus two" items.</p>
      <p>Forward span mainly reflects short-term storage. Backward and sorted versions require you to rearrange the items
      in your head, so they lean much more on working memory.</p>
      <h3>What it trains</h3>
      <ul><li>Short-term memory capacity</li><li>Rehearsal and chunking strategies</li><li>Mental manipulation (reverse / sorted)</li></ul>`
  };

  FB.games.register(game);
})(window.FB);
