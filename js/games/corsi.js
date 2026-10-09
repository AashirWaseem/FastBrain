/* Corsi Block Tapping — Classic, Reverse, Sticky Classic, Sticky Reverse. */
(function (FB) {
  'use strict';
  const h = FB.h;
  const TYPES = [
    { value: 'classic', label: 'Classic', short: 'Classic' }, { value: 'reverse', label: 'Reverse', short: 'Reverse' },
    { value: 'sticky', label: 'Sticky Classic', short: 'S.Classic' }, { value: 'stickyReverse', label: 'Sticky Reverse', short: 'S.Reverse' }
  ];
  const SPEEDS = { slow: 2000, normal: 1500, fast: 1000 };
  const stepMs = s => s.speed === 'custom' ? s.stepMs : SPEEDS[s.speed];
  const isReverse = t => t === 'reverse' || t === 'stickyReverse';
  const isSticky = t => t === 'sticky' || t === 'stickyReverse';

  // Random, never-overlapping block positions. Blocks shrink a little when many
  // have to fit on a small (phone) board; if random placement can't fit them,
  // fall back to one block per cell of a jittered grid, which can't overlap.
  function layout(n, size) {
    const pad = 12, inner = size - 2 * pad;
    const cols = Math.ceil(Math.sqrt(n * 1.6));
    const cell = inner / cols;
    const block = Math.max(26, Math.min(50, Math.floor(cell * 0.82)));
    const max = size - block - pad;
    const minDist = block * 1.5;  // > block × √2, so squares can never touch
    const pts = [];
    for (let tries = 0; pts.length < n && tries < 4000; tries++) {
      const p = { x: FB.randInt(pad, max), y: FB.randInt(pad, max) };
      if (pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) >= minDist)) pts.push(p);
    }
    if (pts.length < n) {
      pts.length = 0;
      const cells = FB.shuffle(Array.from({ length: cols * cols }, (_, i) => i)).slice(0, n);
      cells.forEach(c => pts.push({
        x: Math.round(pad + (c % cols) * cell + Math.random() * Math.max(0, cell - block)),
        y: Math.round(pad + Math.floor(c / cols) * cell + Math.random() * Math.max(0, cell - block))
      }));
    }
    return { pts, block };
  }

  const game = {
    id: 'corsi-block-tapping',
    name: 'Corsi Block Tapping',
    title: 'Corsi Block Tapping Training',
    settingsTitle: 'Corsi',
    icon: () => FB.icons.corsi(),
    cardIcon: () => FB.icons.corsi('#14c2bd', '#f0b44c'),
    blurb: 'Watch blocks appear one after another, then tap them back in the same (or reverse) order.',
    pages: [['training', 'Training'], ['how-to-play', 'How to play'], ['info', 'Info']],
    types: TYPES,
    defaults: { speed: 'normal', stepMs: 1500, rounds: 4, sounds: true, volume: 50, showMistakes: false },
    defaultState: { level: 5, type: 'classic' },
    levels: () => Array.from({ length: 20 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    nextSet(ctx) {
      const s = ctx.settings;
      return [['Level', ctx.state.level], ['Number of Rounds', s.rounds], ['Trial Time', FB.fmtSec(stepMs(s)) + ' s.']];
    },
    quick: () => [
      FB.speedSeg([{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }]),
      { type: 'toggle', key: 'sounds', label: 'Sounds' }
    ],
    tabs: () => [
      {
        title: 'Training', fields: [
          FB.speedSeg([{ value: 'slow', label: 'Slow', sub: '2 s' }, { value: 'normal', label: 'Normal', sub: '1.5 s' }, { value: 'fast', label: 'Fast', sub: '1 s' }, { value: 'custom', label: 'Custom', sub: 'see Advanced' }]),
          { type: 'note', label: 'Time per block while the sequence is shown.' },
          { type: 'number', key: 'rounds', label: 'Rounds per set', min: 1, max: 30 },
          ...FB.levelRuleFields()
        ]
      },
      {
        title: 'Sound & look', fields: [
          { type: 'toggle', key: 'sounds', label: 'Sounds' },
          { type: 'range', key: 'volume', label: 'Volume', min: 0, max: 100 },
          { type: 'toggle', key: 'showMistakes', label: 'Show my mistakes', help: 'A block flashes red when you tap the wrong one.' }
        ]
      },
      {
        title: 'Advanced', fields: [
          { type: 'number', key: 'stepMs', label: 'Time per block (Custom speed)', suffix: 'ms', min: 300, max: 6000, step: 50 }
        ]
      }
    ],
    idleCounter: ctx => 'Round 0 of ' + ctx.settings.rounds,

    mount(area, ctx) {
      let board, msg, clickFn = null;
      const vol = () => ctx.settings.volume / 100 * 0.25;

      function draw(text) {
        area.innerHTML = '';
        board = h('div.corsi-area');
        msg = h('div.corsi-msg');
        board.append(msg);
        area.append(h('div.prompt-line', text || ''), board);
      }
      const prompt = t => { area.querySelector('.prompt-line').textContent = t; };
      const block = (p, size) => {
        const b = h('div.corsi-block', { style: { left: p.x + 'px', top: p.y + 'px', width: (size || 50) + 'px', height: (size || 50) + 'px' } });
        board.append(b);
        return b;
      };

      return {
        idle() {
          draw('');
          // a single demo block like an empty board waiting to start
          block({ x: 40, y: 40 });
        },
        cancel() { clickFn = null; },
        async run(areaEl, clock) {
          const s = ctx.settings, L = ctx.state.level, type = ctx.state.type, R = s.rounds;
          const rev = isReverse(type), sticky = isSticky(type);
          const T = stepMs(s);
          let errors = 0;
          draw('');
          for (let r = 0; r < R; r++) {
            ctx.setCounter('Round ' + (r + 1) + ' of ' + R);
            board.innerHTML = ''; board.append(msg); msg.textContent = '';
            board.classList.remove('recall');
            prompt('Remember the order of the blocks as they appear');
            const size = board.clientWidth || 480;
            const { pts, block: bsize } = layout(L, size);
            // blocks join the board one per step and all stay visible
            const blocks = [];
            for (let i = 0; i < L; i++) {
              await clock.wait(T);
              const b = block(pts[i], bsize);
              if (s.sounds) FB.sound.tick(vol());
              blocks.push(b);
            }
            await clock.wait(Math.min(400, T * 0.25));
            board.classList.add('recall');
            prompt(rev ? 'Select the boxes in reverse order' : 'Select the boxes in the order they appeared');
            // Tap until the whole sequence is done. A wrong tap is ignored and counts
            // as an error; a right tap removes the block (Classic) or leaves it (Sticky).
            const target = rev ? blocks.slice().reverse() : blocks.slice();
            let pos = 0;
            await clock.race(null, res => {
              clickFn = (b) => {
                if (s.sounds) FB.sound.tick(vol());
                if (b === target[pos]) {
                  pos++;
                  if (sticky) { b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 220); }
                  else b.remove();
                  if (pos >= L) { clickFn = null; res(); }
                } else {
                  errors++;
                  if (s.showMistakes) { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 350); }
                }
              };
              blocks.forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); if (clickFn) clickFn(b); }));
            });
            board.classList.remove('recall');
          }
          const shownTotal = L * R;
          const rate = Math.max(0, (shownTotal - errors) / shownTotal * 100);
          const t = TYPES.find(x => x.value === type);
          ctx.finish({
            score: rate,
            label: t.short + ' ' + L,
            title: 'Last Set · ' + t.label + ' · Success Rate',
            details: [`Rounds: <b>${R}</b> · Blocks Shown: <b>${shownTotal}</b> · Errors: <b>${errors}</b>`,
              `Result Score: <b>${(L + rate / 100).toFixed(2)}</b>`]
          });
        }
      };
    }
  };

  game.docs = {
    'how-to-play': () => `
      <h2>How to play</h2>
      <p>Wooden blocks appear on the board one at a time, a new one every step, and they all stay on the board.
      Watch which one is new each time. When the sequence is complete, tap the blocks in the order they appeared.</p>
      <ul>
        <li><b>Level</b> = how many blocks are in the sequence. A set has 4 rounds.</li>
        <li>Tapping the wrong block does nothing except count as an <b>error</b> — keep going until you find the right one.</li>
        <li>Success Rate = (blocks shown − errors) ÷ blocks shown. Result Score = level + success rate (level 5 at 90% → 5.90).</li>
        <li>Press <kbd>Space</kbd> or <b>Start</b> to begin, <kbd>Esc</kbd> to cancel.</li>
      </ul>
      <h3>Types</h3>
      <table>
        <tr><td><b>Classic</b></td><td>Tap the blocks in the order they appeared. Each block you get right disappears.</td></tr>
        <tr><td><b>Reverse</b></td><td>Same, but tap them from last to first.</td></tr>
        <tr><td><b>Sticky Classic</b></td><td>Like Classic, but the blocks you got right stay on the board, so you can't use the gaps to keep your place.</td></tr>
        <tr><td><b>Sticky Reverse</b></td><td>Sticky, recalled from last to first.</td></tr>
      </table>
      <h3>Tip</h3>
      <p>Trace an imaginary path between the blocks as they appear; remembering a shape is easier than remembering points.</p>`,
    info: () => `
      <h2>About the Corsi block-tapping test</h2>
      <p>The Corsi test was devised by Philip Corsi in the early 1970s as a visual-spatial counterpart to the digit span test.
      In the original version an examiner tapped a sequence on wooden blocks fixed to a board and the participant repeated it.
      It is still one of the standard measures of visuo-spatial short-term memory.</p>
      <p>Most adults reach a forward span of about 5 to 6 blocks. The backward (reverse) version adds a manipulation step and
      relies more on working memory.</p>
      <h3>What it trains</h3>
      <ul><li>Visuo-spatial short-term memory</li><li>Sequence memory</li><li>Spatial attention</li></ul>`
  };

  FB.games.register(game);
})(window.FB);
