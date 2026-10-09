/* Core helpers: DOM builder, random, storage, timers, speech and sound. */
window.FB = window.FB || {};

(function (FB) {
  'use strict';

  // ---------- DOM ----------
  FB.$ = (sel, root) => (root || document).querySelector(sel);
  FB.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // h('div.cls#id', {attrs, on: {click}}, children...)
  FB.h = function (spec, attrs, ...children) {
    const m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(spec) || [];
    const el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (_, t, v) => {
      if (t === '.') el.classList.add(v); else el.id = v;
    });
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
      children.unshift(attrs);
      attrs = null;
    }
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k in el && k !== 'list' && k !== 'type') { try { el[k] = v; } catch (e) { el.setAttribute(k, v); } }
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    FB.append(el, children);
    return el;
  };
  FB.append = function (el, children) {
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  };
  FB.html = function (str) {
    const t = document.createElement('template');
    t.innerHTML = str.trim();
    return t.content.childElementCount === 1 ? t.content.firstElementChild : t.content;
  };
  FB.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  FB.toast = function (msg, ms) {
    const t = FB.h('div.toast', msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms || 2200);
  };

  // ---------- Random ----------
  FB.rand = n => Math.floor(Math.random() * n);
  FB.randInt = (a, b) => a + FB.rand(b - a + 1);
  FB.pick = arr => arr[FB.rand(arr.length)];
  FB.shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = FB.rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  FB.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---------- Time / format ----------
  FB.pad2 = n => String(n).padStart(2, '0');
  FB.dayKey = (d) => {
    d = d ? new Date(d) : new Date();
    return d.getFullYear() + '-' + FB.pad2(d.getMonth() + 1) + '-' + FB.pad2(d.getDate());
  };
  FB.fmtDur = function (ms) {
    const s = Math.round(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    if (h) return h + 'h. ' + m + 'm.';
    if (m) return m + 'm. ' + r + 's.';
    return r + 's.';
  };
  FB.fmtDurLong = function (ms) {
    const s = Math.round(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    if (h) return h + ' h. ' + m + ' m.';
    return m + ' m. ' + r + ' s.';
  };
  FB.fmtTime = ts => { const d = new Date(ts); return FB.pad2(d.getHours()) + ':' + FB.pad2(d.getMinutes()); };
  FB.fmtSec = ms => {
    const s = ms / 1000;
    return (Math.round(s * 10) / 10).toString().replace(/\.0$/, '');
  };

  // ---------- Storage ----------
  const KEY = 'fastbrain.v1';
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        d.settings = d.settings || {}; d.state = d.state || {}; d.sessions = d.sessions || []; d.global = d.global || {};
        return d;
      }
    } catch (e) { console.warn('Could not read saved data', e); }
    return { version: 1, settings: {}, state: {}, sessions: [], global: {} };
  }
  const clone = o => JSON.parse(JSON.stringify(o));
  function mergeDefaults(saved, defaults) {
    const out = clone(defaults);
    if (!saved) return out;
    for (const k of Object.keys(saved)) {
      const dv = defaults[k], sv = saved[k];
      if (dv && typeof dv === 'object' && !Array.isArray(dv) && sv && typeof sv === 'object' && !Array.isArray(sv)) {
        out[k] = Object.assign({}, dv, sv);
      } else out[k] = sv;
    }
    return out;
  }

  // One-time upgrade: speech volume used to default to 40, which was too quiet.
  // Second upgrade: defaults re-measured against BrainScale (N-Back 25% matches,
  // Memory Span 50/50 timing, no per-round feedback in Span / Corsi, CWM item time).
  function migrate(d) {
    if (!d.global.brainscaleV2) {
      const set = (id, key, from, to) => { const s = d.settings[id]; if (s && s[key] === from) s[key] = to; };
      set('dual-n-back', 'matchRate', 30, 25);
      set('memory-span', 'showRatio', 60, 50);
      set('memory-span', 'showMistakes', true, false);
      set('corsi-block-tapping', 'showMistakes', true, false);
      set('cwm', 'itemMs', 1000, 0);
      d.global.brainscaleV2 = true;
    }
    // Third upgrade: N-Back gives no feedback during a set (results only at the end)
    if (!d.global.nbackQuiet) {
      const s = d.settings['dual-n-back'];
      if (s) { s.showMistakes = false; s.showPresses = false; }
      d.global.nbackQuiet = true;
    }
    if (!d.global.nbackPressOn) {
      const s = d.settings['dual-n-back'];
      if (s) s.showPresses = true;
      d.global.nbackPressOn = true;
    }
    if (!d.global.loudSpeech) {
      for (const id of ['dual-n-back', 'pasat']) {
        const s = d.settings[id];
        if (s && s.volume === 40) s.volume = 100;
      }
      d.global.loudSpeech = true;
    }
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* saved on next change */ }
    return d;
  }

  FB.db = {
    data: migrate(load()),
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); }
      catch (e) { console.warn('Could not save', e); FB.toast('Could not save progress (storage blocked?)'); }
    },
    settings(id, defaults) {
      const s = mergeDefaults(this.data.settings[id], defaults);
      this.data.settings[id] = s;
      return s;
    },
    resetSettings(id, defaults) {
      this.data.settings[id] = clone(defaults);
      this.save();
      return this.data.settings[id];
    },
    state(id, defaults) {
      const s = mergeDefaults(this.data.state[id], defaults);
      this.data.state[id] = s;
      return s;
    },
    get global() { return this.data.global; },
    addSession(sess) { this.data.sessions.push(sess); this.save(); },
    sessions(game) { return game ? this.data.sessions.filter(s => s.game === game) : this.data.sessions; },
    today(game) { const k = FB.dayKey(); return this.sessions(game).filter(s => FB.dayKey(s.ts) === k); },
    exportJSON() { return JSON.stringify(this.data, null, 2); },
    importJSON(text) {
      const d = JSON.parse(text);
      if (!d || typeof d !== 'object' || !Array.isArray(d.sessions)) throw new Error('Not a FastBrain backup file');
      d.settings = d.settings || {}; d.state = d.state || {}; d.global = d.global || {};
      this.data = d; this.save();
    },
    wipe() { this.data = { version: 1, settings: {}, state: {}, sessions: [], global: {} }; this.save(); }
  };

  // ---------- Cancellable run clock ----------
  // Every pending timer belongs to a Clock; stop() kills them all, so any
  // `await clock.wait()` in a cancelled set simply never resumes.
  FB.Clock = class {
    constructor() { this.timers = new Set(); this.frames = new Set(); this.alive = true; }
    after(ms, fn) {
      if (!this.alive) return null;
      const id = setTimeout(() => { this.timers.delete(id); if (this.alive) fn(); }, ms);
      this.timers.add(id);
      return id;
    }
    clear(id) { clearTimeout(id); this.timers.delete(id); }
    wait(ms) { return new Promise(res => this.after(ms, res)); }
    // resolves when `register(resolve)` calls resolve, or after `ms` (resolves with undefined)
    race(ms, register) {
      return new Promise(res => {
        let done = false;
        const finish = v => { if (done || !this.alive) return; done = true; if (t) this.clear(t); res(v); };
        const t = ms != null ? this.after(ms, () => finish(undefined)) : null;
        register(finish);
      });
    }
    // animate a progress element over ms
    progress(fillEl, ms) {
      const start = performance.now();
      const step = (now) => {
        if (!this.alive) return;
        const p = Math.min(1, (now - start) / ms);
        fillEl.style.width = (p * 100) + '%';
        if (p < 1) { const id = requestAnimationFrame(step); this.frames.add(id); }
      };
      fillEl.style.width = '0%';
      const id = requestAnimationFrame(step); this.frames.add(id);
    }
    stop() {
      this.alive = false;
      this.timers.forEach(clearTimeout); this.timers.clear();
      this.frames.forEach(cancelAnimationFrame); this.frames.clear();
    }
  };

  // ---------- Speech (spoken letters / numbers) ----------
  FB.speech = {
    supported: 'speechSynthesis' in window,
    voices: [],
    init() {
      if (!this.supported) return;
      const load = () => {
        this.voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
        if (!this.voices.length) this.voices = speechSynthesis.getVoices();
      };
      load();
      speechSynthesis.addEventListener ? speechSynthesis.addEventListener('voiceschanged', load) : (speechSynthesis.onvoiceschanged = load);
    },
    voice() {
      const name = FB.db.global.voice;
      return this.voices.find(v => v.name === name) ||
        this.voices.find(v => /en[-_]US/i.test(v.lang) && v.localService) ||
        this.voices.find(v => v.localService) || this.voices[0] || null;
    },
    say(text, volume, rate) {
      if (!this.supported) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        const v = this.voice();
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
        u.volume = volume == null ? 1 : FB.clamp(volume, 0, 1);
        u.rate = rate || FB.db.global.speechRate || 1.1;
        speechSynthesis.speak(u);
      } catch (e) { console.warn(e); }
    },
    stop() { if (this.supported) try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  };

  // ---------- Simple tones ----------
  FB.sound = {
    ctx: null,
    beep(freq, ms, vol, type) {
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        const c = this.ctx, o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine'; o.frequency.value = freq || 660;
        const v = vol == null ? 0.15 : vol;
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(v, c.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (ms || 120) / 1000);
        o.connect(g).connect(c.destination);
        o.start(); o.stop(c.currentTime + (ms || 120) / 1000 + 0.02);
      } catch (e) { /* audio unavailable */ }
    },
    tick(vol) { this.beep(880, 90, vol == null ? 0.12 : vol, 'triangle'); },
    good(vol) { this.beep(1046, 110, vol == null ? 0.1 : vol, 'sine'); },
    bad(vol) { this.beep(220, 180, vol == null ? 0.1 : vol, 'square'); }
  };
})(window.FB);
