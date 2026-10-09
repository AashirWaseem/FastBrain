/* App shell: icons, menu, router, settings fields, modal and the shared exercise page. */
(function (FB) {
  'use strict';
  const h = FB.h;

  // ---------- Icons (original artwork) ----------
  const DK = '#1f1f1f', OR = '#f39c32';
  FB.icons = {
    brand: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10.5" stroke="#14c2bd" stroke-width="1.6"/><path d="M13.2 4.8 7.6 13h4l-1 6.2L16.4 11h-4z" fill="#f0b44c"/></svg>`,
    nback: (c1 = DK, c2 = OR) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c1}" stroke-width="1.6"><rect x="2.5" y="2.5" width="19" height="19" rx="1.5"/><path d="M8.8 2.5v19M15.2 2.5v19M2.5 8.8h19M2.5 15.2h19"/><rect x="16.2" y="16.2" width="4.3" height="4.3" fill="${c2}" stroke="none"/><rect x="3.5" y="9.8" width="4.3" height="4.3" fill="${c2}" stroke="none" opacity=".55"/></svg>`,
    cwm: (c1 = DK, c2 = OR) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c1}" stroke-width="1.6"><path d="M3 5h9M3 9.5h6M3 14h8"/><rect x="13.5" y="12.5" width="8" height="8" rx="1"/><path d="M17.5 12.5v8M13.5 16.5h8"/><rect x="13.9" y="12.9" width="3.2" height="3.2" fill="${c2}" stroke="none"/><path d="M4 19.5l2-2 2 2" stroke="${c2}"/></svg>`,
    mmath: (c1 = DK, c2 = OR) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c1}" stroke-width="1.8" stroke-linecap="round"><path d="M6.5 3.5v6M3.5 6.5h6"/><path d="M14.5 6.5h6" stroke="${c2}"/><path d="M4.3 15.3l4.4 4.4M8.7 15.3l-4.4 4.4" stroke="${c2}"/><path d="M14.5 15.5h6M14.5 19h6"/></svg>`,
    corsi: (c1 = DK, c2 = OR) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c1}" stroke-width="1.6"><rect x="2.5" y="3" width="6" height="6" rx="1"/><rect x="14.5" y="6.5" width="6" height="6" rx="1" fill="${c2}" stroke="${c2}"/><rect x="6.5" y="15" width="6" height="6" rx="1"/><path d="M9 7.5l4.5 1.5M16 13.5l-4 2.5" stroke-dasharray="1.6 1.6"/></svg>`,
    span: (c1 = DK, c2 = OR) => `<svg viewBox="0 0 24 24"><text x="1" y="16.5" font-family="Arial, sans-serif" font-weight="700" font-size="10.5" fill="${c1}">1</text><text x="8" y="16.5" font-family="Arial, sans-serif" font-weight="700" font-size="10.5" fill="${c2}">2</text><text x="15" y="16.5" font-family="Arial, sans-serif" font-weight="700" font-size="10.5" fill="${c1}">3</text><path d="M2 20h20" stroke="${c1}" stroke-width="1.4"/></svg>`,
    pasat: (c1 = DK, c2 = OR) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c1}" stroke-width="1.6" stroke-linejoin="round"><path d="M3 9.5h3.5L11 5.5v13l-4.5-4H3z"/><path d="M14.5 9.2a4 4 0 0 1 0 5.6" /><path d="M19 9v6M16 12h6" stroke="${c2}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    dashboard: (c1 = DK, c2 = OR) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c1}" stroke-width="1.6"><rect x="3" y="3" width="7.5" height="7.5" rx="1"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1" stroke="${c2}"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1" stroke="${c2}"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1"/></svg>`,
    progress: (c1 = DK, c2 = OR) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c1}" stroke-width="1.6" stroke-linecap="round"><path d="M3 20.5h18"/><path d="M4 16l5-5 4 3 7-8" stroke="${c2}" stroke-width="1.9"/></svg>`,
    sliders: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 4h7M12 4h2M2 12h2M7 12h7"/><circle cx="10.5" cy="4" r="1.5"/><circle cx="5.5" cy="12" r="1.5"/></svg>`,
    check: `<svg viewBox="0 0 16 16" fill="none" stroke="#2fbf71" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8.5l3.5 3.5 7.5-8"/></svg>`,
    err: `<svg viewBox="0 0 16 16" fill="none" stroke="#dc3545" stroke-width="1.4"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4.5" stroke-width="1.6"/><circle cx="8" cy="11.3" r=".6" fill="#dc3545"/></svg>`
  };

  // ---------- Game registry ----------
  FB.games = {
    list: [],
    byId: {},
    register(g) {
      g.pages = g.pages || [['training', 'Training'], ['how-to-play', 'How to play'], ['info', 'Info']];
      this.list.push(g); this.byId[g.id] = g;
    }
  };

  // ---------- Settings fields ----------
  // spec: {type, key, label, help, options, min, max, step, suffix, ...}
  FB.field = function (spec, settings, onChange, opts) {
    opts = opts || {};
    const help = typeof spec.help === 'function' ? spec.help(settings) : spec.help;
    const set = (v) => { settings[spec.key] = v; onChange(spec.key, v); };
    const helpEl = help ? h('div.sf-help', help) : null;

    switch (spec.type) {
      case 'heading': return h('div.sf-heading', spec.label);
      case 'note': return h('div.sf-help', { style: { marginBottom: '14px' } }, typeof spec.label === 'function' ? spec.label(settings) : spec.label);
      case 'seg': {
        const seg = h('div.sf-seg');
        spec.options.forEach(o => {
          const b = h('button.sf-seg-btn', { type: 'button', on: { click: () => set(o.value) } }, o.label, o.sub ? h('small', o.sub) : null);
          if (settings[spec.key] === o.value) b.classList.add('is-selected');
          seg.appendChild(b);
        });
        return h('div.sf', h('div.sf-head', spec.label), h('div.sf-control', seg), helpEl);
      }
      case 'toggle': {
        const inp = h('input', { type: 'checkbox', checked: !!settings[spec.key], on: { change: e => set(e.target.checked) } });
        return h('div.sf', h('div.sf-row', h('div.sf-head', spec.label), h('label.sf-switch', inp, h('span.knob'))), helpEl);
      }
      case 'range': {
        const val = h('span.sf-val', String(settings[spec.key]));
        const inp = h('input.sf-range', {
          type: 'range', min: spec.min, max: spec.max, step: spec.step || 1, value: settings[spec.key],
          on: { input: e => { val.textContent = e.target.value; if (spec.live) { settings[spec.key] = +e.target.value; } }, change: e => set(+e.target.value) }
        });
        return h('div.sf', h('div.sf-head', spec.label, val), h('div.sf-control', inp), helpEl);
      }
      case 'number': {
        const inp = h('input.sf-input', {
          type: 'number', min: spec.min, max: spec.max, step: spec.step || 1, value: settings[spec.key],
          on: {
            change: e => {
              let v = parseFloat(e.target.value);
              if (isNaN(v)) v = settings[spec.key];
              const st = spec.step || 1;
              v = Math.round(Math.round(v / st) * st * 1e6) / 1e6;
              if (spec.min != null) v = Math.max(spec.min, v);
              if (spec.max != null) v = Math.min(spec.max, v);
              e.target.value = v; set(v);
            }
          }
        });
        return h('div.sf', h('div.sf-row', h('div.sf-head', spec.label), h('div.sf-num-wrap', inp, h('span.sf-suffix', spec.suffix || ''))), helpEl);
      }
      case 'select': {
        const sel = h('select.sf-input.sf-select', { on: { change: e => set(spec.numeric ? +e.target.value : e.target.value) } },
          spec.options.map(o => h('option', { value: o.value, selected: String(settings[spec.key]) === String(o.value) }, o.label)));
        return h('div.sf', h('div.sf-row', h('div.sf-head', spec.label), sel), helpEl);
      }
      case 'keys': {
        const map = settings[spec.key];
        const grid = h('div.sf-keys');
        spec.items.forEach(it => {
          const btn = h('button.sf-key-btn', { type: 'button' }, keyName(map[it.id]));
          btn.addEventListener('click', () => {
            FB.stopKeyCapture();
            btn.classList.add('listening'); btn.textContent = '…';
            const handler = (e) => {
              e.preventDefault(); e.stopPropagation();
              FB.stopKeyCapture();
              btn.classList.remove('listening');
              if (e.key !== 'Escape' && e.key !== ' ' && e.key.length === 1 || /^(Arrow|Enter$)/.test(e.key)) {
                const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
                // free this key from any other action so a key never does two things
                for (const id of Object.keys(map)) if (map[id] === k && id !== it.id) map[id] = '';
                map[it.id] = k;
                set(map);
              } else btn.textContent = keyName(map[it.id]);
            };
            window.addEventListener('keydown', handler, true);
            FB.keyCapture = { handler, reset: () => { btn.classList.remove('listening'); btn.textContent = keyName(map[it.id]); } };
          });
          grid.append(h('div', it.label), btn);
        });
        return h('div.sf', grid, helpEl);
      }
      case 'colors': {
        const arr = settings[spec.key];
        const wrap = h('div.sf-colors');
        arr.forEach((c, i) => wrap.appendChild(h('input', {
          type: 'color', value: c, on: { change: e => { arr[i] = e.target.value; set(arr); } }
        })));
        return h('div.sf', h('div.sf-head', spec.label), h('div.sf-control', wrap), helpEl);
      }
      case 'voice': {
        const g = FB.db.global;
        if (!FB.speech.supported) return h('div.sf', h('div.sf-head', 'Voice'), h('div.sf-help', 'Speech is not available in this browser.'));
        const cur = FB.speech.voice();
        const sel = h('select.sf-input.sf-select', { style: { maxWidth: '230px' }, on: { change: e => { g.voice = e.target.value; FB.db.save(); } } },
          FB.speech.voices.map(v => h('option', { value: v.name, selected: cur && v.name === cur.name }, v.name.replace(/^Microsoft /, '') + (v.localService ? '' : ' (online)'))));
        const rate = h('input.sf-range', {
          type: 'range', min: 0.7, max: 1.6, step: 0.05, value: g.speechRate || 1.1,
          on: { change: e => { g.speechRate = +e.target.value; FB.db.save(); } }
        });
        const test = h('button.btn.btn-ghost', { type: 'button', style: { padding: '3px 10px', fontSize: '12px' }, on: { click: () => FB.speech.say('C, 7, H', (settings.volume || 60) / 100) } }, 'Test');
        return h('div.sf',
          h('div.sf-row', h('div.sf-head', 'Voice'), sel),
          h('div.sf-head', { style: { marginTop: '10px' } }, 'Speech rate', test),
          h('div.sf-control', rate),
          h('div.sf-help', 'Uses the voices installed on this computer, so it works offline.'));
      }
      case 'custom': return spec.render(settings, set);
    }
    return h('div');
  };
  FB.stopKeyCapture = function () {
    if (!FB.keyCapture) return;
    window.removeEventListener('keydown', FB.keyCapture.handler, true);
    FB.keyCapture.reset();
    FB.keyCapture = null;
  };
  function keyName(k) {
    if (!k) return '—';
    if (k === 'Enter') return '⏎';
    if (k.startsWith('Arrow')) return { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }[k];
    return k.toUpperCase();
  }
  FB.keyName = keyName;

  // standard level-rule fields shared by every exercise
  FB.levelRuleFields = (unit) => [
    { type: 'heading', label: 'Level rules' },
    { type: 'number', key: 'levelUp', label: 'Level up at', suffix: '%', min: 1, max: 100 },
    { type: 'number', key: 'levelDown', label: 'Level down below', suffix: '%', min: 0, max: 100 },
    { type: 'number', key: 'downAfter', label: 'Level down after', suffix: unit || 'sets', min: 1, max: 20, help: 'Counts weak sets in a row.' },
    { type: 'toggle', key: 'autoLevel', label: 'Change level automatically', help: 'Turn off to stay on the level you pick.' }
  ];
  FB.levelRuleDefaults = { levelUp: 80, levelDown: 50, downAfter: 3, autoLevel: true };

  // ---------- Modal ----------
  FB.openModals = new Set();
  FB.modal = function ({ title, tabs, body, foot, classic, onClose, width }) {
    const back = h('div.modal-backdrop');
    const m = h('div.modal' + (classic ? '.classic' : ''));
    if (width) m.style.width = width + 'px';
    const close = () => { FB.stopKeyCapture(); FB.openModals.delete(m); back.remove(); FB.modalOpen = Math.max(0, (FB.modalOpen || 1) - 1); document.removeEventListener('keydown', esc, true); onClose && onClose(); };
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); } };
    document.addEventListener('keydown', esc, true);
    back.addEventListener('mousedown', e => { if (e.target === back) close(); });
    m.append(h('div.modal-head', h('h3', title), classic ? null : h('button.modal-x', { type: 'button', title: 'Close', on: { click: close } }, '×')));
    const bodyEl = h('div.modal-body');
    if (tabs) {
      const tabBar = h('div.modal-tabs');
      let active = 0;
      const show = (i) => {
        active = i;
        FB.$$('.modal-tab', tabBar).forEach((t, j) => t.classList.toggle('active', j === i));
        bodyEl.innerHTML = ''; bodyEl.append(tabs[i].render());
      };
      tabs.forEach((t, i) => tabBar.append(h('button.modal-tab', { type: 'button', on: { click: () => show(i) } }, t.title)));
      m.append(tabBar);
      // re-draw after a change without losing the scroll position or keyboard focus
      m.rerender = () => {
        const st = bodyEl.scrollTop;
        const focusables = () => FB.$$('input, select, button', bodyEl);
        const fi = focusables().indexOf(document.activeElement);
        show(active);
        bodyEl.scrollTop = st;
        if (fi >= 0 && focusables()[fi]) focusables()[fi].focus({ preventScroll: true });
      };
      show(0);
    } else if (body) bodyEl.append(body);
    m.append(bodyEl);
    if (foot) m.append(foot(close));
    back.append(m);
    document.body.append(back);
    FB.modalOpen = (FB.modalOpen || 0) + 1;
    m.close = close;
    FB.openModals.add(m);
    return m;
  };

  // ---------- Layout ----------
  FB.buildShell = function () {
    const app = FB.$('#app');
    app.innerHTML = '';
    const head = h('div.app-head',
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
        h('button.menu-toggle', { type: 'button', title: 'Menu', on: { click: () => document.body.classList.toggle('menu-open') } }, '☰'),
        h('a.brand', { href: '#/dashboard', html: FB.icons.brand + '<span>FastBrain</span>' })),
      h('div.head-right', h('a', { href: '#/progress' }, 'Progress'), h('a.accent', { href: '#/dashboard' }, 'Train')));
    const menu = h('nav.main-menu#mainMenu');
    const content = h('main.main-content#view');
    const scrim = h('div.menu-scrim', { on: { click: () => document.body.classList.remove('menu-open') } });
    menu.addEventListener('click', e => { if (e.target.closest('a')) document.body.classList.remove('menu-open'); });
    app.append(head, h('div.app-body', menu, scrim, content));
  };

  FB.renderMenu = function (route) {
    const menu = FB.$('#mainMenu');
    menu.innerHTML = '';
    const link = (href, text, cls, cur) => h('a.mi' + (cls ? '.' + cls : '') + (cur ? '.current' : ''), { href }, text);
    menu.append(h('div.menu-section', 'Menu'),
      link('#/dashboard', 'Dashboard', '', route.page === 'dashboard'),
      link('#/progress', 'Progress', '', route.page === 'progress'));
    menu.append(h('div.menu-section', 'Exercises'));
    FB.games.list.forEach(g => {
      const active = route.game === g.id;
      const grp = h('div.menu-group');
      const main = link('#/' + g.id + '/training', g.menuName || g.name, active ? 'active' : '', false);
      grp.append(main);
      if (active) g.pages.forEach(([p, label]) => grp.append(link('#/' + g.id + '/' + p, label, 'sub', route.sub === p)));
      menu.append(grp);
    });
    menu.append(h('div.menu-section', 'Help & more'),
      link('#/about', 'About & keyboard', '', route.page === 'about'));
    menu.append(h('div.menu-foot', 'Version 1.0 · works offline · no account needed'));
  };

  // ---------- Router ----------
  FB.parseRoute = function () {
    const parts = (location.hash || '#/dashboard').replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!parts.length) return { page: 'dashboard' };
    const g = FB.games.byId[parts[0]];
    if (g) {
      const sub = g.pages.some(p => p[0] === parts[1]) ? parts[1] : 'training';
      return { page: 'game', game: parts[0], sub };
    }
    return { page: FB.pages[parts[0]] && parts[0] !== 'gameDoc' ? parts[0] : 'dashboard' };
  };
  FB.navigate = function () {
    FB.openModals.forEach(m => m.close());
    if (FB.currentPage && FB.currentPage.destroy) FB.currentPage.destroy();
    FB.currentPage = null;
    document.body.classList.remove('in-game', 'menu-open');
    const route = FB.parseRoute();
    FB.renderMenu(route);
    const view = FB.$('#view');
    view.innerHTML = '';
    window.scrollTo(0, 0);
    let title = 'FastBrain';
    if (route.page === 'game') {
      const g = FB.games.byId[route.game];
      if (route.sub === 'training') { FB.currentPage = new FB.ExercisePage(g, view); title = g.name + ' · FastBrain'; }
      else { FB.pages.gameDoc(g, route.sub, view); title = g.name + ' · ' + g.pages.find(p => p[0] === route.sub)[1]; }
    } else {
      FB.pages[route.page](view);
      title = { progress: 'Progress', about: 'About' }[route.page] ? { progress: 'Progress', about: 'About' }[route.page] + ' · FastBrain' : 'FastBrain';
    }
    document.title = title;
  };

  // ---------- Exercise page ----------
  FB.ExercisePage = class {
    constructor(game, view) {
      this.game = game;
      this.view = view;
      this.settings = FB.db.settings(game.id, Object.assign({}, FB.levelRuleDefaults, game.defaults));
      this.state = FB.db.state(game.id, Object.assign({ weak: 0 }, game.defaultState));
      this.running = false;
      this.ctx = this.makeCtx();
      this.build();
      this.onKeyBound = (e) => this.onKey(e);
      document.addEventListener('keydown', this.onKeyBound);
    }

    makeCtx() {
      const self = this;
      return {
        game: this.game,
        get settings() { return self.settings; },
        get state() { return self.state; },
        get running() { return self.running; },
        get clock() { return self.clock; },
        save: () => FB.db.save(),
        setCounter: (t) => { self.counterEl.textContent = t == null ? '' : t; },
        setMiddle: (c) => { self.middleEl.innerHTML = ''; if (c != null) FB.append(self.middleEl, [c]); },
        setHint: (c) => { self.hintEl.innerHTML = ''; if (c) FB.append(self.hintEl, [c]); },
        finish: (r) => self.finish(r),
        refresh: () => self.refresh(),
        get level() { return self.getLevel(); },
        get type() { return self.getType(); },
        volume: () => (self.settings.volume == null ? 60 : self.settings.volume) / 100
      };
    }

    getLevel() { return this.game.getLevel ? this.game.getLevel(this.state) : this.state.level; }
    setLevel(v) { if (this.game.setLevel) this.game.setLevel(this.state, v); else this.state.level = v; this.state.weak = 0; }
    getType() { return this.game.getType ? this.game.getType(this.state) : this.state.type; }

    build() {
      const g = this.game;
      const v = this.view;
      v.innerHTML = '';
      this.headerRight = h('div.eh-right');
      const header = h('div.exercise-header',
        h('div.eh-left',
          h('div.header-white-block', { html: g.icon() }),
          h('div', h('span.eh-title', g.title || (g.name + ' Training')),
            h('a.eh-link', { href: '#/' + g.id + '/how-to-play' }, 'How to play'))),
        this.headerRight);

      this.counterEl = h('div.ct-counter');
      this.middleEl = h('div.ct-middle');
      this.btnEl = h('div.ct-btn');
      this.areaEl = h('div.game-area');
      this.hintEl = h('div.area-hint');
      const box = h('div.exercise-box',
        h('div.controls-top', this.counterEl, this.middleEl, this.btnEl),
        this.areaEl, this.hintEl);

      this.sideEl = h('div.game-side-pane');
      v.append(h('div.game-row', h('div.game-main', header, box), this.sideEl));

      this.controller = g.mount(this.areaEl, this.ctx);
      this.renderHeader();
      this.renderSide();
      this.showIdle();
    }

    renderHeader() {
      const g = this.game, r = this.headerRight, dis = this.running;
      r.innerHTML = '';
      if (g.typeButton) {
        r.append(h('label', 'Type:', h('button.eh-type-link', { type: 'button', disabled: dis, on: { click: () => g.typeButton.open(this.ctx) } }, g.typeButton.label(this.ctx))));
      } else if (g.types) {
        const cur = this.getType();
        r.append(h('label', 'Type:', h('select.eh-select', {
          disabled: dis,
          on: { change: e => { this.state.type = e.target.value; this.state.weak = 0; FB.db.save(); this.refresh(); this.showIdle(); e.target.blur(); } }
        }, g.types.map(t => h('option', { value: t.value, selected: t.value === cur }, t.label)))));
      }
      const levels = g.levels(this.ctx);
      const lv = this.getLevel();
      r.append(h('label', (g.levelLabel || 'Level') + ':', h('select.eh-select', {
        disabled: dis,
        on: { change: e => { const val = levels.find(l => String(l.value) === e.target.value).value; this.setLevel(val); FB.db.save(); this.refresh(); this.showIdle(); e.target.blur(); } }
      }, levels.map(l => h('option', { value: l.value, selected: String(l.value) === String(lv) }, l.label)))));
    }

    renderSide() {
      const g = this.game, s = this.sideEl, ctx = this.ctx;
      s.innerHTML = '';
      const rows = h('div.sp-rows');
      g.nextSet(ctx).forEach(([k, val]) => rows.append(h('div', k), h('div.v', String(val))));
      s.append(h('div.sp-title', 'Next Set'), rows, h('hr.sp-divider'));

      s.append(h('div.qs-title', 'Quick settings'));
      const onChange = (key, val) => this.settingChanged(key, val);
      (g.quick ? g.quick(ctx) : []).forEach(f => s.append(FB.field(f, this.settings, onChange)));
      s.append(h('button.qs-all', { type: 'button', html: FB.icons.sliders + ' All settings', on: { click: () => this.openSettings() } }));
      s.append(h('hr.sp-divider'));

      // today's sets
      const today = FB.db.today(g.id);
      s.append(h('div.sp-title', "Today's Sets"));
      const list = h('div.today-sets');
      if (!today.length) list.append(h('div.empty', 'No sets yet today.'));
      today.forEach((ss, i) => {
        const cls = ss.score >= (ss.up ?? 80) ? 'good' : ss.score < (ss.down ?? 50) ? 'bad' : 'mid';
        list.append(h('div.ts-row.' + cls, h('span', (i + 1) + '.'), h('span', ss.label), h('span', ss.score + '%'),
          h('span', ss.extra != null ? ss.extra : ''), h('span', FB.fmtDur(ss.dur))));
      });
      s.append(list);

      if (today.length) {
        const dur = today.reduce((a, b) => a + b.dur, 0);
        // Max / Avg track each set's result score (level + success rate, or N for
        // N-Back), the way BrainScale's daily statistics do
        const stats = today.map(t => (t.stat != null ? t.stat : t.score));
        const fmt = v => String(Math.round(v * 100) / 100);
        const st = h('div.sp-rows');
        [['Started:', FB.fmtTime(today[0].ts)], ['Duration:', FB.fmtDurLong(dur)], ['Sets:', today.length],
          ['Max:', fmt(Math.max(...stats))], ['Avg:', fmt(stats.reduce((a, b) => a + b, 0) / stats.length)]]
          .forEach(([k, val], i) => st.append(h('div', k), h('div.v', { style: i > 2 ? { color: i === 3 ? '#f0b44c' : '#14c2bd' } : null }, String(val))));
        s.append(h('div.today-stats', h('div.sp-title', "Today's Statistics"), st));
      }
    }

    settingChanged(key, val) {
      if (this.game.onSettings) this.game.onSettings(this.ctx, key, val);
      FB.db.save();
      this.refresh();
      if (!this.running) this.showIdle(true);
      if (this.settingsModal && this.settingsModal.rerender) this.settingsModal.rerender();
    }

    openSettings() {
      const g = this.game;
      const onChange = (k, v) => this.settingChanged(k, v);
      const tabs = g.tabs(this.ctx).map(t => ({
        title: t.title,
        render: () => FB.append(h('div'), [t.fields.map(f => FB.field(f, this.settings, onChange))])
      }));
      this.settingsModal = FB.modal({
        title: (g.settingsTitle || g.name) + ' settings',
        tabs,
        onClose: () => { this.settingsModal = null; },
        foot: (close) => h('div.modal-foot',
          h('button.link', {
            type: 'button', on: {
              click: () => {
                if (!confirm('Reset all ' + g.name + ' settings to their defaults?')) return;
                this.settings = FB.db.resetSettings(g.id, Object.assign({}, FB.levelRuleDefaults, g.defaults));
                this.settingChanged();
              }
            }
          }, 'Reset to default'),
          h('button.btn-done', { type: 'button', on: { click: close } }, 'Done'))
      });
    }

    refresh() {
      this.renderHeader();
      this.renderSide();
    }

    showIdle(keepResult) {
      if (this.running) return;
      if (keepResult && this.resultShown) return;
      this.resultShown = false;
      this.btnEl.innerHTML = '';
      this.btnEl.append(h('button.btn.btn-info.btn-sm', { type: 'button', title: 'Start Exercise [Space bar]', style: { padding: '4px 16px' }, on: { click: () => this.start() } }, 'Start'));
      this.ctx.setMiddle(null);
      this.ctx.setCounter(this.game.idleCounter ? this.game.idleCounter(this.ctx) : '');
      this.ctx.setHint(this.game.hint ? this.game.hint(this.ctx) : null);
      this.areaEl.innerHTML = '';
      this.controller.idle(this.areaEl);
    }

    start() {
      if (this.running || FB.modalOpen) return;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      FB.speech.stop();
      this.running = true;
      this.resultShown = false;
      this.clock = new FB.Clock();
      this.startTs = Date.now();
      document.body.classList.add('in-game');
      FB.wake.on();
      document.body.classList.remove('menu-open');
      this.btnEl.innerHTML = '';
      this.btnEl.append(h('button.btn.btn-warning.btn-sm', { type: 'button', title: 'Cancel Exercise [Esc]', on: { click: () => this.cancel() } }, 'Cancel'));
      this.renderHeader();
      this.areaEl.innerHTML = '';
      this.ctx.setMiddle(null);
      this.ctx.setHint(this.game.hint ? this.game.hint(this.ctx) : null);
      // unlock audio on the user's gesture
      if (FB.sound.ctx && FB.sound.ctx.state === 'suspended') FB.sound.ctx.resume();
      try {
        const p = this.controller.run(this.areaEl, this.clock);
        if (p && p.catch) p.catch(err => { console.error(err); this.cancel(); FB.toast('Something went wrong: ' + err.message); });
      } catch (err) { console.error(err); this.cancel(); }
    }

    stopRun() {
      if (this.clock) this.clock.stop();
      FB.speech.stop();
      this.running = false;
      document.body.classList.remove('in-game');
      FB.wake.off();
    }

    cancel() {
      if (!this.running) return;
      this.stopRun();
      if (this.controller.cancel) this.controller.cancel();
      this.refresh();
      this.showIdle();
    }

    finish(r) {
      if (!this.running) return;
      const end = Date.now();
      this.stopRun();
      const g = this.game, st = this.state, se = this.settings;
      const levels = g.levels(this.ctx).map(l => l.value);
      const lvl = this.getLevel();
      const idx = levels.findIndex(l => String(l) === String(lvl));
      const score = Math.round(r.score);
      let change = 0;
      if (se.autoLevel !== false && !r.noLevelChange) {
        if (score >= se.levelUp) { if (idx < levels.length - 1) change = 1; st.weak = 0; }
        else if (score < se.levelDown) { st.weak = (st.weak || 0) + 1; if (st.weak >= se.downAfter) { if (idx > 0) change = -1; st.weak = 0; } }
        else st.weak = 0;
      }
      const newLevel = change ? levels[idx + change] : lvl;
      if (change) { if (g.setLevel) g.setLevel(st, newLevel); else st.level = newLevel; }
      const levelLabel = (v) => { const L = g.levels(this.ctx).find(l => String(l.value) === String(v)); return L ? L.label : v; };
      const sess = {
        game: g.id, ts: this.startTs, dur: end - this.startTs,
        type: this.getType ? this.getType() : null, level: lvl, levelLabel: levelLabel(lvl), newLevel,
        score, label: r.label, details: r.details || [], up: se.levelUp, down: se.levelDown, data: r.data,
        // result score = level + success rate (e.g. level 4 at 81% → 4.81)
        stat: r.stat != null ? r.stat : (typeof lvl === 'number' ? Math.round((lvl + score / 100) * 100) / 100 : null),
        extra: r.extra != null ? r.extra : (typeof lvl === 'number' ? (Math.round((lvl + score / 100) * 100) / 100).toFixed(2) : null)
      };
      FB.db.addSession(sess);
      FB.db.save();

      // result card
      this.refresh();
      this.btnEl.innerHTML = '';
      this.btnEl.append(h('button.btn.btn-info.btn-sm', { type: 'button', title: 'Start Exercise [Space bar]', style: { padding: '4px 16px' }, on: { click: () => this.start() } }, 'Start'));
      this.ctx.setCounter(this.game.idleCounter ? this.game.idleCounter(this.ctx) : '');
      this.ctx.setMiddle(null);
      const good = score >= se.levelUp, bad = score < se.levelDown;
      let lvlMsg = null;
      if (change > 0) lvlMsg = h('div.rc-level.up', '▲ Level up! Next set: ' + (g.levelWord || 'level') + ' ' + levelLabel(newLevel));
      else if (change < 0) lvlMsg = h('div.rc-level.down', '▼ Level down. Next set: ' + (g.levelWord || 'level') + ' ' + levelLabel(newLevel));
      else if (bad && se.autoLevel !== false && idx === 0) lvlMsg = h('div.rc-level.down', 'You are on the lowest level — keep practising');
      else if (bad && se.autoLevel !== false) lvlMsg = h('div.rc-level.down', 'Weak set ' + st.weak + ' of ' + se.downAfter + ' before the level drops');
      else lvlMsg = h('div.rc-level', 'Next set: ' + (g.levelWord || 'level') + ' ' + levelLabel(newLevel));
      this.areaEl.innerHTML = '';
      this.areaEl.append(h('div.result-card',
        h('div.rc-label', r.title || 'Set result'),
        h('div.rc-score' + (good ? '.good' : bad ? '.bad' : ''), score + '%'),
        lvlMsg,
        h('div.rc-details', (r.details || []).map(d => h('div', { html: d }))),
        h('div.rc-next', 'Press Space or Start for the next set · ' + FB.fmtDur(end - this.startTs))));
      this.resultShown = true;
      if (g.afterFinish) g.afterFinish(this.ctx, r);
    }

    onKey(e) {
      if (FB.modalOpen) return;
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'Escape' && this.running) { e.preventDefault(); this.cancel(); return; }
      if (!this.running) {
        if ((e.key === ' ' || e.code === 'Space') && !typing) { e.preventDefault(); this.start(); }
        return;
      }
      if (this.controller.key) this.controller.key(e, typing);
    }

    destroy() {
      document.removeEventListener('keydown', this.onKeyBound);
      if (this.running) this.stopRun();
      if (this.controller && this.controller.cancel) this.controller.cancel();
      if (this.settingsModal) this.settingsModal.close();
    }
  };

  // On-screen number pad (shown on narrow / touch screens via CSS), laid out like
  // 1 2 3 ⌫ / 4 5 6 Go / 7 8 9 · / extra 0 extra2
  FB.keypad = function (input, onGo, extras) {
    extras = extras || [];
    const press = (k) => {
      if (input.disabled) return;
      if (k === 'back') input.value = input.value.slice(0, -1);
      else if (k === 'go') { onGo(); return; }
      else input.value += k;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const key = (label, k, cls) => h('button.kp-key' + (cls ? '.' + cls : ''), {
      type: 'button', tabIndex: -1, disabled: k == null,
      on: { pointerdown: e => { e.preventDefault(); if (k != null) press(k); } }
    }, label);
    return h('div.keypad',
      key('1', '1'), key('2', '2'), key('3', '3'), key('⌫', 'back'),
      key('4', '4'), key('5', '5'), key('6', '6'), key('Go', 'go', 'go'),
      key('7', '7'), key('8', '8'), key('9', '9'), key('', null),
      extras[0] ? key(extras[0], extras[0]) : key('', null), key('0', '0'), extras[1] ? key(extras[1], extras[1]) : key('', null), key('', null));
  };

  // Keep the screen on while a set runs (phones dim after ~30 s otherwise)
  FB.wake = {
    lock: null,
    wanted: false,
    async on() {
      this.wanted = true;
      if (!('wakeLock' in navigator) || this.lock) return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (!this.wanted) { lock.release().catch(() => {}); return; }
        this.lock = lock;
        lock.addEventListener('release', () => { if (this.lock === lock) this.lock = null; });
      } catch (e) { /* not allowed here */ }
    },
    off() { this.wanted = false; if (this.lock) { this.lock.release().catch(() => {}); this.lock = null; } }
  };
  // the browser drops the lock when the app is hidden; take it back when you return mid-set
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && FB.wake.wanted && !FB.wake.lock) FB.wake.on(); });

  // standard speed control used by several exercises
  FB.speedSeg = (opts) => ({ type: 'seg', key: 'speed', label: 'Speed', options: opts });
})(window.FB);
