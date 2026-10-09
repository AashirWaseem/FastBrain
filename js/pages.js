/* Dashboard, Progress, About and the per-exercise How-to / Info pages. */
(function (FB) {
  'use strict';
  const h = FB.h;
  FB.pages = {};

  function pageHeader(iconSvg, title, sub) {
    return h('div.page-header',
      h('div.header-white-block', { html: iconSvg }),
      h('div', h('div.ph-title', title), sub ? h('div.ph-sub', sub) : null));
  }

  function streak() {
    const days = new Set(FB.db.sessions().map(s => FB.dayKey(s.ts)));
    let n = 0;
    const d = new Date();
    if (!days.has(FB.dayKey(d))) d.setDate(d.getDate() - 1); // today not trained yet — streak still alive from yesterday
    while (days.has(FB.dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function levelText(g) {
    const st = FB.db.state(g.id, Object.assign({ weak: 0 }, g.defaultState));
    const lv = g.getLevel ? g.getLevel(st) : st.level;
    const type = g.getType ? g.getType(st) : (g.types ? (g.types.find(t => t.value === st.type) || {}).label : null);
    return (type ? type.replace(/^[+\-*/]+\s/, '') + ' · ' : '') + (g.levelLabel || 'Level') + ' ' + lv;
  }

  // ---------- Dashboard ----------
  FB.pages.dashboard = function (view) {
    const all = FB.db.sessions();
    const today = FB.db.today();
    const mins = Math.round(today.reduce((a, b) => a + b.dur, 0) / 60000);
    const last = all[all.length - 1];
    const lastGame = last && FB.games.byId[last.game];
    view.append(pageHeader(FB.icons.dashboard(), 'Exercises Dashboard', 'All your brain training in one place'));
    const body = h('div.page-body');
    body.append(h('div.banner',
      h('div', h('h2', today.length ? 'Nice work today' : (all.length ? 'Ready for today\'s session?' : 'Welcome to FastBrain')),
        h('p', all.length ? 'Your progress is saved on this computer. No account, no limits, no waiting.' : 'Pick an exercise below. Everything is free, offline and saved on this computer.')),
      h('div.stats',
        h('div.stat', h('div.n', String(today.length)), h('div.l', 'sets today')),
        h('div.stat', h('div.n', String(mins)), h('div.l', 'minutes today')),
        h('div.stat', h('div.n', String(streak())), h('div.l', 'day streak')),
        lastGame ? h('a.btn.btn-info', { href: '#/' + lastGame.id + '/training', style: { alignSelf: 'center' } }, 'Continue ' + (lastGame.menuName || lastGame.name)) : null)));
    body.append(h('div.section-title', 'Start training'));
    const cards = h('div.cards');
    FB.games.list.forEach((g, i) => {
      const sets = FB.db.sessions(g.id);
      const lastS = sets[sets.length - 1];
      cards.append(h('a.card', { href: '#/' + g.id + '/training', style: { color: 'inherit', textDecoration: 'none' } },
        h('div.c-icon', { html: g.cardIcon() }),
        h('h3', g.name, i === 0 ? h('span.tag', 'Start here') : null),
        h('p', g.blurb),
        h('div.c-meta', levelText(g) + (lastS ? ' · last ' + (FB.dayKey(lastS.ts) === FB.dayKey() ? 'today' : FB.dayKey(lastS.ts)) : '')),
        h('span.c-start', 'Start →')));
    });
    body.append(cards);
    view.append(body);
  };

  // ---------- Progress ----------
  function chart(sessions, g) {
    const W = 420, H = 150, P = { l: 28, r: 34, t: 10, b: 18 };
    const data = sessions.slice(-50);
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'chart');
    svg.setAttribute('preserveAspectRatio', 'none');
    const add = (tag, attrs, text) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; svg.appendChild(e); return e; };
    const iw = W - P.l - P.r, ih = H - P.t - P.b;
    [0, 50, 100].forEach(v => {
      const y = P.t + ih - v / 100 * ih;
      add('line', { x1: P.l, x2: W - P.r, y1: y, y2: y, class: 'axis' });
      add('text', { x: P.l - 4, y: y + 3, 'text-anchor': 'end' }, v + '%');
    });
    if (data.length) {
      const levels = g.levels({ settings: {}, state: {} }).map(l => String(l.value));
      const idx = data.map(s => Math.max(0, levels.indexOf(String(s.level))));
      const lo = Math.min(...idx), hi = Math.max(...idx);
      const x = i => P.l + (data.length === 1 ? iw / 2 : i / (data.length - 1) * iw);
      const yL = v => P.t + ih - (hi === lo ? 0.5 : (v - lo) / (hi - lo)) * ih;
      const yS = v => P.t + ih - v / 100 * ih;
      add('polyline', { class: 'scr', points: data.map((s, i) => x(i) + ',' + yS(s.score)).join(' ') });
      add('polyline', { class: 'lvl', points: idx.map((v, i) => x(i) + ',' + yL(v)).join(' ') });
      idx.forEach((v, i) => add('circle', { cx: x(i), cy: yL(v), r: data.length > 25 ? 1.6 : 2.6, fill: '#14c2bd' }));
      add('text', { x: W - P.r + 4, y: yL(hi) + 3 }, levels[hi]);
      if (hi !== lo) add('text', { x: W - P.r + 4, y: yL(lo) + 3 }, levels[lo]);
      add('text', { x: P.l, y: H - 4 }, FB.dayKey(data[0].ts).slice(5));
      add('text', { x: W - P.r, y: H - 4, 'text-anchor': 'end' }, FB.dayKey(data[data.length - 1].ts).slice(5));
    } else {
      add('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle' }, 'No sets yet');
    }
    return svg;
  }

  FB.pages.progress = function (view) {
    view.append(pageHeader(FB.icons.progress(), 'Progress', 'Every set you play is stored on this computer'));
    const body = h('div.page-body');
    const all = FB.db.sessions();

    // activity calendar: last 16 weeks
    const perDay = {};
    all.forEach(s => { const k = FB.dayKey(s.ts); perDay[k] = (perDay[k] || 0) + s.dur; });
    const cal = h('div.calendar');
    // one column per week, Sunday at the top, ending with the current week
    const d = new Date(); d.setDate(d.getDate() - d.getDay() - 7 * 15);
    const todayKey = FB.dayKey();
    for (let i = 0; i < 7 * 16 && FB.dayKey(d) <= todayKey; i++) {
      const k = FB.dayKey(d);
      const m = (perDay[k] || 0) / 60000;
      cal.append(h('span' + (m === 0 ? '' : m < 10 ? '.l1' : m < 25 ? '.l2' : '.l3'), { title: k + (m ? ' — ' + Math.round(m) + ' min' : '') }));
      d.setDate(d.getDate() + 1);
    }
    const totalMin = Math.round(all.reduce((a, b) => a + b.dur, 0) / 60000);
    const trainedDays = Object.keys(perDay).length;
    body.append(h('div.banner',
      h('div', h('h2', 'Training activity'), h('p', 'Last 16 weeks — darker squares mean longer sessions.'), cal),
      h('div.stats',
        h('div.stat', h('div.n', String(all.length)), h('div.l', 'sets')),
        h('div.stat', h('div.n', totalMin >= 120 ? (totalMin / 60).toFixed(1) + 'h' : totalMin + 'm'), h('div.l', 'total time')),
        h('div.stat', h('div.n', String(trainedDays)), h('div.l', 'days trained')),
        h('div.stat', h('div.n', String(streak())), h('div.l', 'day streak')))));

    const grid = h('div.prog-grid');
    FB.games.list.forEach(g => {
      const ss = FB.db.sessions(g.id);
      const best = ss.length ? Math.max(...ss.map(s => s.score)) : 0;
      const mins = Math.round(ss.reduce((a, b) => a + b.dur, 0) / 60000);
      grid.append(h('div.prog-card',
        h('h3', h('a', { href: '#/' + g.id + '/training' }, g.name), h('small', levelText(g))),
        h('div.kpis',
          h('div', h('b', String(ss.length)), 'sets'),
          h('div', h('b', mins + 'm'), 'time'),
          h('div', h('b', ss.length ? best + '%' : '–'), 'best score'),
          h('div', h('b', ss.length ? Math.round(ss.slice(-10).reduce((a, b) => a + b.score, 0) / Math.min(10, ss.length)) + '%' : '–'), 'avg (last 10)')),
        chart(ss, g),
        h('div.legend', h('span', h('i', { style: { background: '#14c2bd' } }), 'level'), h('span', h('i', { style: { background: '#f0b44c' } }), 'score'))));
    });
    body.append(grid);

    // recent history
    body.append(h('div.section-title', { style: { marginTop: '28px' } }, 'Recent sets'));
    if (!all.length) body.append(h('p.empty-note', 'Nothing here yet — finish a set and it will show up.'));
    else {
      const t = h('table.history-table', h('tr', ['Date', 'Exercise', 'Set', 'Score', 'Level after', 'Time'].map(x => h('th', x))));
      all.slice(-40).reverse().forEach(s => {
        const g = FB.games.byId[s.game];
        const lv = g ? g.levels({ settings: {}, state: {} }) : [];
        const at = v => lv.findIndex(l => String(l.value) === String(v));
        const levelAfter = g ? (lv[at(s.newLevel)] || {}).label : s.newLevel;
        const move = at(s.newLevel) - at(s.level);
        t.append(h('tr',
          h('td', FB.dayKey(s.ts) + ' ' + FB.fmtTime(s.ts)),
          h('td', g ? g.name : s.game),
          h('td', s.label || ''),
          h('td', { style: { color: s.score >= (s.up || 80) ? '#14c2bd' : s.score < (s.down || 50) ? '#ff6b5b' : '' } }, s.score + '%'),
          h('td', (levelAfter || '') + (move > 0 ? ' ▲' : move < 0 ? ' ▼' : '')),
          h('td', FB.fmtDur(s.dur))));
      });
      body.append(t);
    }

    // data management
    body.append(h('div.section-title', { style: { marginTop: '28px' } }, 'Your data'));
    body.append(h('p.empty-note', 'Progress lives in this browser\'s storage for this app. Export a backup now and then, especially before clearing browser data or switching browsers.'));
    const file = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    file.addEventListener('change', () => {
      const f = file.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try { FB.db.importJSON(r.result); FB.toast('Backup restored'); FB.navigate(); }
        catch (e) { alert('Could not import: ' + e.message); }
      };
      r.readAsText(f);
    });
    body.append(h('div.data-actions',
      h('button.btn.btn-info', {
        type: 'button', on: {
          click: () => {
            const blob = new Blob([FB.db.exportJSON()], { type: 'application/json' });
            const a = h('a', { href: URL.createObjectURL(blob), download: 'fastbrain-backup-' + FB.dayKey() + '.json' });
            document.body.append(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          }
        }
      }, 'Export backup'),
      h('button.btn.btn-ghost', { type: 'button', on: { click: () => file.click() } }, 'Import backup'),
      h('button.btn.btn-ghost', {
        type: 'button', style: { color: '#ff8b80', borderColor: 'rgba(255,107,91,.4)' }, on: {
          click: () => {
            if (confirm('Delete ALL training history, levels and settings? This cannot be undone.') && confirm('Really delete everything?')) {
              FB.db.wipe(); FB.toast('All data deleted'); FB.navigate();
            }
          }
        }
      }, 'Delete all data'),
      file));
    view.append(body);
  };

  // ---------- About ----------
  FB.pages.about = function (view) {
    view.append(pageHeader(FB.icons.brand, 'About FastBrain', 'Free, offline brain training'));
    view.append(h('div.page-body', h('div.doc', {
      html: `
      <h2>What this is</h2>
      <p>FastBrain is a private, offline brain-training app with six classic cognitive exercises. There are no accounts, ads,
      paywalls or waiting times — every setting is unlocked, and you can play as many sets as you like.</p>
      <h2>Keyboard</h2>
      <table>
        <tr><td><kbd>Space</kbd></td><td>Start the next set</td></tr>
        <tr><td><kbd>Esc</kbd></td><td>Cancel the running set / close a dialog</td></tr>
        <tr><td><kbd>A</kbd> / <kbd>L</kbd></td><td>N-Back: position / sound match · CWM: yes / no</td></tr>
        <tr><td><kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd></td><td>N-Back: color / shape / number match (Triple and up)</td></tr>
        <tr><td><kbd>Enter</kbd></td><td>Submit an answer (Mental Math, Memory Span, PASAT, CWM recall)</td></tr>
      </table>
      <p>N-Back and CWM keys can be changed in each exercise's <b>All settings</b>.</p>
      <h2>Levels</h2>
      <p>Every exercise adapts to you. By default a score of 80% or more moves you up a level, and three sets in a row under
      50% move you down. Change the limits — or turn automatic levels off — in <b>All settings → Level rules</b>.
      You can also pick any level directly from the header.</p>
      <h2>Spoken audio</h2>
      <p>Dual N-Back and PASAT read letters and numbers aloud using the speech voices built into your computer, so they work
      without internet. If the voice sounds odd or slow to start, choose another voice in the exercise's Sound settings.
      On Windows you can add more voices in <i>Settings → Time &amp; language → Speech</i>.</p>
      <h2>Your data</h2>
      <p>Everything is stored locally in this browser. Use <a href="#/progress">Progress → Export backup</a> to keep a copy.</p>`
    })));
  };

  // ---------- Per-exercise docs ----------
  FB.pages.gameDoc = function (g, sub, view) {
    const label = (g.pages.find(p => p[0] === sub) || [sub, sub])[1];
    view.append(pageHeader(g.icon(), g.name, label));
    const content = g.docs && g.docs[sub] ? g.docs[sub]() : '<p>Nothing here yet.</p>';
    const doc = h('div.doc', { html: content });
    doc.append(h('p', { style: { marginTop: '26px' } }, h('a.btn.btn-info.btn-lg', { href: '#/' + g.id + '/training' }, 'Start Training')));
    view.append(h('div.page-body', doc));
    if (g.docs && g.docs.afterRender) g.docs.afterRender(sub, doc);
  };
})(window.FB);
