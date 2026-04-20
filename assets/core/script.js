(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => el?.addEventListener(ev, fn, opts);
  const off = (el, ev, fn) => el?.removeEventListener(ev, fn);
  const qs = (k) => new URLSearchParams(location.search).get(k);

  function debounce(fn, ms = 100) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  function throttle(fn, ms = 100) {
    let last = 0;
    return (...a) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...a); } };
  }

  function deepMerge(target, source) {
    for (const k in source) {
      if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
        target[k] = deepMerge(target[k] || {}, source[k]);
      } else { target[k] = source[k]; }
    }
    return target;
  }

  function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }

  function formatBytes(b) {
    if (b === 0) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(2) + ' ' + s[i];
  }

  function formatMs(ms) {
    if (ms < 1000) return ms.toFixed(1) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  }

  function initTabs() {
    $$('.tabs').forEach(tabs => {
      const btns = $$('.tab', tabs);
      const panels = $$('.tab-content', tabs.closest('.tab-wrapper') || document);
      btns.forEach((btn, i) => {
        on(btn, 'click', () => {
          btns.forEach(b => b.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          if (panels[i]) panels[i].classList.add('active');
        });
      });
      if (!btns.some(b => b.classList.contains('active'))) {
        btns[0]?.classList.add('active');
        if (panels[0]) panels[0].classList.add('active');
      }
    });
  }

  function initAccordions() {
    $$('.accordion-trigger').forEach(trigger => {
      on(trigger, 'click', () => {
        const item = trigger.closest('.accordion-item');
        const isOpen = item.classList.contains('open');
        $$('.accordion-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  function initToggles() {
    $$('.toggle input[type="checkbox"]').forEach(inp => {
      on(inp, 'change', () => {
        inp.closest('.toggle')?.dispatchEvent(new CustomEvent('toggle:change', { detail: { checked: inp.checked }, bubbles: true }));
      });
    });
  }

  function initDropdowns() {
    $$('.dropdown').forEach(dd => {
      const trigger = $('[data-dropdown-trigger]', dd) || dd.firstElementChild;
      const menu = $('.dropdown-menu', dd);
      if (!menu) return;
      on(trigger, 'click', (e) => {
        e.stopPropagation();
        const open = menu.classList.toggle('open');
        menu.style.display = open ? 'block' : 'none';
      });
    });
    on(document, 'click', () => {
      $$('.dropdown-menu.open').forEach(m => { m.classList.remove('open'); m.style.display = 'none'; });
    });
  }

  function initCollapsibles() {
    $$('.collapsible-trigger').forEach(t => {
      on(t, 'click', () => {
        const body = t.nextElementSibling;
        const open = t.classList.toggle('open');
        if (body?.classList.contains('collapsible-body')) body.classList.toggle('open', open);
      });
    });
  }

  const toastContainer = (() => {
    let c = $('.toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  })();

  window.showToast = function(msg, opts = {}) {
    const { type = 'info', duration = 3500, icon = '' } = opts;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `${icon ? `<span style="flex-shrink:0">${icon}</span>` : ''}<span>${msg}</span>`;
    toastContainer.appendChild(t);
    setTimeout(() => {
      t.classList.add('exiting');
      setTimeout(() => t.remove(), 320);
    }, duration);
    return t;
  };

  window.openDialog = function(id) { $(id)?.showModal?.(); };
  window.closeDialog = function(id) { $(id)?.close?.(); };

  $$('dialog').forEach(d => {
    on(d, 'click', e => { if (e.target === d) d.close(); });
  });

  on(document, 'click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = $(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });

  if ('IntersectionObserver' in window) {
    const imgObs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const img = en.target;
          if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
          imgObs.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    $$('img[data-src]').forEach(img => imgObs.observe(img));
  }

  function initCarousels() {
    $$('.carousel').forEach(car => {
      const track = $('.carousel-track', car);
      const slides = $$('.carousel-slide', car);
      const dots = $$('.carousel-dot', car);
      let current = 0;

      function goTo(n) {
        current = (n + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
      }

      $('.carousel-btn.prev', car)?.addEventListener('click', () => goTo(current - 1));
      $('.carousel-btn.next', car)?.addEventListener('click', () => goTo(current + 1));
      dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
      goTo(0);
    });
  }

  function initKanban() {
    let dragging = null;
    $$('.kanban-card').forEach(card => {
      card.draggable = true;
      on(card, 'dragstart', () => { dragging = card; card.style.opacity = '0.4'; });
      on(card, 'dragend', () => { card.style.opacity = ''; dragging = null; });
    });
    $$('.kanban-cards').forEach(col => {
      on(col, 'dragover', e => { e.preventDefault(); col.style.outline = '2px dashed var(--color-accent, #7f77dd)'; });
      on(col, 'dragleave', () => { col.style.outline = ''; });
      on(col, 'drop', e => {
        e.preventDefault(); col.style.outline = '';
        if (dragging) col.appendChild(dragging);
      });
    });
  }

  function initRanges() {
    $$('input[type="range"][data-output]').forEach(r => {
      const out = $(r.dataset.output);
      if (out) { out.textContent = r.value; on(r, 'input', () => out.textContent = r.value); }
    });
  }

  function initCharCounters() {
    $$('textarea[maxlength], input[maxlength]').forEach(el => {
      const counter = document.createElement('small');
      counter.className = 'form-hint';
      counter.style.textAlign = 'right';
      el.parentNode.insertBefore(counter, el.nextSibling);
      const update = () => counter.textContent = `${el.value.length} / ${el.maxLength}`;
      on(el, 'input', update);
      update();
    });
  }

  $$('[data-copy]').forEach(btn => {
    on(btn, 'click', async () => {
      const text = btn.dataset.copy || $('code', btn.closest('.code-block'))?.textContent;
      if (text) {
        await navigator.clipboard.writeText(text).catch(() => {});
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      }
    });
  });

  $$('.code-copy').forEach(btn => {
    on(btn, 'click', async () => {
      const code = btn.closest('.code-block');
      const text = $('code', code)?.textContent || $('pre', code)?.textContent;
      if (text) {
        await navigator.clipboard.writeText(text).catch(() => {});
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Copied';
        setTimeout(() => btn.innerHTML = orig, 2000);
      }
    });
  });

  $$('.search-bar').forEach(bar => {
    const input = $('input', bar);
    const clear = $('.search-clear', bar);
    if (!input || !clear) return;
    on(input, 'input', () => clear.style.display = input.value ? 'flex' : 'none');
    on(clear, 'click', () => { input.value = ''; input.focus(); clear.style.display = 'none'; });
    clear.style.display = 'none';
  });

  const navbarToggle = $('.navbar-toggle');
  const navbarLinks = $('.navbar-links');
  if (navbarToggle && navbarLinks) {
    on(navbarToggle, 'click', () => navbarLinks.classList.toggle('open'));
  }

  const Analytics = (() => {
    const session = { id: uuid(), start: Date.now(), clicks: 0, keystrokes: 0, scrollDepth: 0, pageViews: 1, errors: [] };
    const events = [];
    const netLog = [];
    const perfEntries = [];

    on(document, 'click', () => session.clicks++);
    on(document, 'keydown', () => session.keystrokes++);
    on(window, 'scroll', throttle(() => {
      const depth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
      if (depth > session.scrollDepth) session.scrollDepth = depth;
    }, 200));
    on(window, 'error', e => session.errors.push({ msg: e.message, file: e.filename, line: e.lineno, col: e.colno, time: Date.now() }));
    on(window, 'unhandledrejection', e => session.errors.push({ msg: 'UnhandledRejection: ' + e.reason, time: Date.now() }));

    const _fetch = window.fetch;
    window.fetch = async function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      const method = args[1]?.method?.toUpperCase() || 'GET';
      const t0 = performance.now();
      try {
        const res = await _fetch.apply(this, args);
        netLog.push({ url, method, status: res.status, duration: performance.now() - t0, time: Date.now(), type: 'fetch', size: res.headers.get('content-length') || '?' });
        return res;
      } catch (err) {
        netLog.push({ url, method, status: 'ERR', duration: performance.now() - t0, time: Date.now(), type: 'fetch', error: err.message });
        throw err;
      }
    };

    const _XHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new _XHR();
      const meta = { method: 'GET', url: '', t0: 0 };
      const origOpen = xhr.open.bind(xhr);
      const origSend = xhr.send.bind(xhr);
      xhr.open = function(method, url, ...rest) { meta.method = method; meta.url = url; return origOpen(method, url, ...rest); };
      xhr.send = function(...rest) {
        meta.t0 = performance.now();
        xhr.addEventListener('loadend', () => {
          netLog.push({ url: meta.url, method: meta.method, status: xhr.status, duration: performance.now() - meta.t0, time: Date.now(), type: 'xhr', size: xhr.getResponseHeader?.('content-length') || '?' });
        });
        return origSend(...rest);
      };
      return xhr;
    };

    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver(list => {
          list.getEntries().forEach(e => perfEntries.push({ name: e.name, type: e.entryType, duration: e.duration, start: e.startTime, size: e.transferSize }));
        }).observe({ type: 'resource', buffered: true });
      } catch (e) {}
      try {
        new PerformanceObserver(list => {
          list.getEntries().forEach(e => perfEntries.push({ name: e.name, type: e.entryType, duration: e.processingEnd - e.startTime, start: e.startTime }));
        }).observe({ type: 'event', buffered: true });
      } catch (e) {}
    }

    return { session, events, netLog, perfEntries };
  })();

  const isMobile = () => ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth < 1024;

  function buildDebugPanel() {
    if (isMobile()) return;

    const style = document.createElement('style');
    style.textContent = `
      :root {
        --dbg-bg:       #1a1a1f;
        --dbg-surface:  #22222a;
        --dbg-surface2: #2a2a35;
        --dbg-border:   #35353f;
        --dbg-text:     #d4d4e0;
        --dbg-muted:    #6e6e88;
        --dbg-accent:   #9d7fe8;
        --dbg-accent2:  #c4a8ff;
        --dbg-green:    #4dd88a;
        --dbg-red:      #f07070;
        --dbg-amber:    #f0c060;
        --dbg-blue:     #6ab4f5;
        --dbg-radius:   10px;
        --dbg-radius-sm:6px;
        --dbg-font:     'JetBrains Mono', 'Fira Mono', 'Consolas', monospace;
        --dbg-sans:     'DM Mono', 'Syne', system-ui, sans-serif;
      }

      #dbg-overlay {
        position: fixed; inset: 0; z-index: 999990;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        animation: dbgFadeIn 180ms ease;
      }
      @keyframes dbgFadeIn { from { opacity:0 } to { opacity:1 } }

      #dbg-panel {
        width: min(1100px, 96vw);
        height: min(780px, 92vh);
        background: var(--dbg-bg);
        border-radius: var(--dbg-radius);
        border: 1px solid var(--dbg-border);
        display: flex; flex-direction: column;
        overflow: hidden;
        box-shadow: 0 32px 80px rgba(0,0,0,0.7);
        animation: dbgSlideIn 220ms cubic-bezier(0.34,1.56,0.64,1);
        font-family: var(--dbg-font);
        font-size: 12px;
        color: var(--dbg-text);
        position: relative;
      }
      @keyframes dbgSlideIn { from { transform:scale(0.93) translateY(16px); opacity:0 } to { transform:scale(1) translateY(0); opacity:1 } }

      #dbg-header {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 14px;
        background: var(--dbg-surface);
        border-bottom: 1px solid var(--dbg-border);
        flex-shrink: 0;
        user-select: none;
      }
      #dbg-logo {
        width: 22px; height: 22px; flex-shrink: 0;
        background: var(--dbg-accent);
        border-radius: 5px;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; color: #fff; font-weight: 700;
      }
      #dbg-title { font-family: var(--dbg-sans); font-weight: 700; font-size: 13px; color: var(--dbg-text); letter-spacing: 0.02em; }
      #dbg-version { font-size: 10px; color: var(--dbg-muted); margin-left: 2px; }
      #dbg-tabs {
        display: flex; gap: 2px;
        margin-left: 16px;
        flex: 1;
      }
      .dbg-tab {
        padding: 5px 12px;
        border-radius: var(--dbg-radius-sm);
        border: none; background: transparent;
        color: var(--dbg-muted);
        font-family: var(--dbg-font); font-size: 11px;
        cursor: pointer; transition: all 140ms;
        white-space: nowrap;
      }
      .dbg-tab:hover { color: var(--dbg-text); background: var(--dbg-surface2); }
      .dbg-tab.active { color: var(--dbg-accent2); background: rgba(157,127,232,0.14); }
      #dbg-close {
        margin-left: auto; flex-shrink: 0;
        width: 28px; height: 28px; border-radius: 6px;
        border: 1px solid var(--dbg-border);
        background: transparent; color: var(--dbg-muted);
        cursor: pointer; font-size: 14px;
        display: flex; align-items: center; justify-content: center;
        transition: all 140ms;
      }
      #dbg-close:hover { background: var(--dbg-red); color: #fff; border-color: var(--dbg-red); }

      #dbg-body { flex: 1; overflow: hidden; display: flex; }

      .dbg-panel-content { flex: 1; overflow-y: auto; padding: 14px; display: none; }
      .dbg-panel-content.active { display: flex; flex-direction: column; gap: 12px; }
      .dbg-panel-content::-webkit-scrollbar { width: 5px; }
      .dbg-panel-content::-webkit-scrollbar-track { background: transparent; }
      .dbg-panel-content::-webkit-scrollbar-thumb { background: var(--dbg-border); border-radius: 99px; }

      .dbg-card {
        background: var(--dbg-surface);
        border: 1px solid var(--dbg-border);
        border-radius: var(--dbg-radius-sm);
        padding: 12px 14px;
      }
      .dbg-card-title {
        font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--dbg-accent); font-weight: 700; margin-bottom: 10px;
      }
      .dbg-grid { display: grid; gap: 10px; }
      .dbg-grid-2 { grid-template-columns: 1fr 1fr; }
      .dbg-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
      .dbg-grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
      .dbg-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 0; border-bottom: 1px solid var(--dbg-border); }
      .dbg-row:last-child { border-bottom: none; padding-bottom: 0; }
      .dbg-key { color: var(--dbg-muted); font-size: 11px; flex-shrink: 0; }
      .dbg-val { color: var(--dbg-text); font-size: 11px; text-align: right; word-break: break-all; }
      .dbg-val.accent { color: var(--dbg-accent2); }
      .dbg-val.green { color: var(--dbg-green); }
      .dbg-val.red { color: var(--dbg-red); }
      .dbg-val.amber { color: var(--dbg-amber); }
      .dbg-stat { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; background: var(--dbg-surface2); border-radius: var(--dbg-radius-sm); }
      .dbg-stat-label { font-size: 10px; color: var(--dbg-muted); letter-spacing: 0.06em; text-transform: uppercase; }
      .dbg-stat-value { font-size: 18px; color: var(--dbg-accent2); font-weight: 700; letter-spacing: -0.02em; }
      .dbg-stat-sub { font-size: 10px; color: var(--dbg-muted); }

      .dbg-table { width: 100%; border-collapse: collapse; font-size: 11px; }
      .dbg-table th { text-align: left; color: var(--dbg-muted); font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase; padding: 6px 8px; border-bottom: 1px solid var(--dbg-border); font-weight: 600; }
      .dbg-table td { padding: 6px 8px; border-bottom: 1px solid rgba(53,53,63,0.5); vertical-align: top; }
      .dbg-table tr:last-child td { border-bottom: none; }
      .dbg-table tr:hover td { background: rgba(157,127,232,0.06); }
      .dbg-table .mono { font-family: var(--dbg-font); }

      .dbg-badge {
        display: inline-flex; align-items: center;
        padding: 2px 7px; border-radius: 99px;
        font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
      }
      .dbg-badge.green { background: rgba(77,216,138,0.15); color: var(--dbg-green); }
      .dbg-badge.red { background: rgba(240,112,112,0.15); color: var(--dbg-red); }
      .dbg-badge.amber { background: rgba(240,192,96,0.15); color: var(--dbg-amber); }
      .dbg-badge.blue { background: rgba(106,180,245,0.15); color: var(--dbg-blue); }
      .dbg-badge.purple { background: rgba(157,127,232,0.15); color: var(--dbg-accent2); }

      .dbg-bar-wrap { background: var(--dbg-surface2); border-radius: 99px; height: 5px; overflow: hidden; }
      .dbg-bar { height: 100%; background: var(--dbg-accent); border-radius: 99px; transition: width 0.3s; }
      .dbg-bar.green { background: var(--dbg-green); }
      .dbg-bar.red { background: var(--dbg-red); }
      .dbg-bar.amber { background: var(--dbg-amber); }

      #dbg-inspector-wrap { display: flex; flex: 1; gap: 0; overflow: hidden; }
      #dbg-inspector-left { width: 220px; flex-shrink: 0; border-right: 1px solid var(--dbg-border); overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
      #dbg-inspector-right { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
      .dbg-tree-node { cursor: pointer; padding: 3px 6px; border-radius: 4px; font-size: 11px; color: var(--dbg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: all 100ms; }
      .dbg-tree-node:hover { background: var(--dbg-surface2); color: var(--dbg-text); }
      .dbg-tree-node.selected { background: rgba(157,127,232,0.18); color: var(--dbg-accent2); }
      .dbg-tree-node .tag { color: var(--dbg-accent); }
      .dbg-tree-node .cls { color: var(--dbg-green); }
      .dbg-tree-node .id { color: var(--dbg-amber); }
      #dbg-inspector-toolbar { display: flex; gap: 6px; align-items: center; padding: 8px 10px; border-bottom: 1px solid var(--dbg-border); flex-shrink: 0; }
      .dbg-search-input {
        flex: 1; background: var(--dbg-surface2); border: 1px solid var(--dbg-border);
        border-radius: var(--dbg-radius-sm); color: var(--dbg-text);
        padding: 5px 10px; font-family: var(--dbg-font); font-size: 11px;
        outline: none;
      }
      .dbg-search-input:focus { border-color: var(--dbg-accent); }
      .dbg-icon-btn {
        width: 28px; height: 28px; flex-shrink: 0;
        background: var(--dbg-surface2); border: 1px solid var(--dbg-border);
        border-radius: var(--dbg-radius-sm); cursor: pointer;
        color: var(--dbg-muted); font-size: 12px;
        display: flex; align-items: center; justify-content: center;
        transition: all 120ms;
      }
      .dbg-icon-btn:hover { color: var(--dbg-accent2); border-color: var(--dbg-accent); }
      .dbg-icon-btn.active { color: var(--dbg-accent2); background: rgba(157,127,232,0.14); border-color: var(--dbg-accent); }

      .dbg-prop-section { display: flex; flex-direction: column; gap: 6px; }
      .dbg-prop-title { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dbg-accent); font-weight: 700; }
      .dbg-prop-row { display: flex; gap: 8px; align-items: flex-start; }
      .dbg-prop-key { width: 120px; flex-shrink: 0; font-size: 10px; color: var(--dbg-muted); padding-top: 5px; }
      .dbg-prop-val { flex: 1; }
      .dbg-prop-input {
        width: 100%; background: var(--dbg-surface2); border: 1px solid var(--dbg-border);
        border-radius: 4px; color: var(--dbg-text);
        padding: 4px 8px; font-family: var(--dbg-font); font-size: 11px;
        outline: none; resize: vertical; min-height: 26px;
      }
      .dbg-prop-input:focus { border-color: var(--dbg-accent); }

      #dbg-console-output {
        flex: 1; overflow-y: auto; background: var(--dbg-surface);
        border: 1px solid var(--dbg-border); border-radius: var(--dbg-radius-sm);
        padding: 8px; font-family: var(--dbg-font); font-size: 11px;
        min-height: 200px; max-height: 400px;
        display: flex; flex-direction: column; gap: 2px;
      }
      .dbg-console-line { padding: 3px 6px; border-radius: 3px; word-break: break-all; line-height: 1.6; }
      .dbg-console-line.log { color: var(--dbg-text); }
      .dbg-console-line.warn { color: var(--dbg-amber); background: rgba(240,192,96,0.07); }
      .dbg-console-line.error { color: var(--dbg-red); background: rgba(240,112,112,0.07); }
      .dbg-console-line.info { color: var(--dbg-blue); }
      .dbg-console-line.success { color: var(--dbg-green); }
      #dbg-console-input-row { display: flex; gap: 8px; margin-top: 6px; }
      #dbg-console-input {
        flex: 1; background: var(--dbg-surface2); border: 1px solid var(--dbg-border);
        border-radius: var(--dbg-radius-sm); color: var(--dbg-text);
        padding: 7px 12px; font-family: var(--dbg-font); font-size: 11px; outline: none;
      }
      #dbg-console-input:focus { border-color: var(--dbg-accent); }
      #dbg-console-run {
        padding: 7px 14px; background: rgba(157,127,232,0.18);
        border: 1px solid var(--dbg-accent); border-radius: var(--dbg-radius-sm);
        color: var(--dbg-accent2); cursor: pointer; font-family: var(--dbg-font); font-size: 11px;
        transition: all 120ms;
      }
      #dbg-console-run:hover { background: var(--dbg-accent); color: #fff; }

      .dbg-timeline-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 11px; }
      .dbg-timeline-bar-wrap { flex: 1; background: var(--dbg-surface2); border-radius: 99px; height: 8px; overflow: hidden; }
      .dbg-timeline-bar { height: 100%; border-radius: 99px; background: var(--dbg-accent); min-width: 2px; }
      .dbg-timeline-name { width: 180px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dbg-muted); }
      .dbg-timeline-ms { width: 60px; text-align: right; flex-shrink: 0; color: var(--dbg-amber); }

      #dbg-statusbar {
        display: flex; align-items: center; gap: 12px;
        padding: 6px 14px;
        background: var(--dbg-surface);
        border-top: 1px solid var(--dbg-border);
        font-size: 10px; color: var(--dbg-muted);
        flex-shrink: 0;
        letter-spacing: 0.04em;
      }
      #dbg-statusbar .sep { opacity: 0.3; }
      #dbg-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dbg-green); flex-shrink: 0; animation: dbgPulse 2s ease-in-out infinite; }
      @keyframes dbgPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      #dbg-pick-cursor { position: fixed; width: 14px; height: 14px; pointer-events: none; z-index: 999999; transform: translate(-50%,-50%); }
      #dbg-pick-cursor::before, #dbg-pick-cursor::after { content:''; position:absolute; background:var(--dbg-accent); }
      #dbg-pick-cursor::before { width:2px; height:100%; left:50%; top:0; transform:translateX(-50%); }
      #dbg-pick-cursor::after { width:100%; height:2px; top:50%; left:0; transform:translateY(-50%); }
      #dbg-pick-highlight { position:fixed; z-index:999988; pointer-events:none; border:2px solid var(--dbg-accent); background:rgba(157,127,232,0.1); border-radius:4px; transition:all 60ms; }
      .dbg-net-url { max-width: 340px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dbg-blue); }
      .dbg-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .dbg-clear-btn { padding: 3px 8px; background: transparent; border: 1px solid var(--dbg-border); border-radius: 4px; color: var(--dbg-muted); cursor: pointer; font-size: 10px; font-family: var(--dbg-font); }
      .dbg-clear-btn:hover { border-color: var(--dbg-red); color: var(--dbg-red); }
      .dbg-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--dbg-border); }
      .dbg-toggle-row:last-child { border-bottom: none; }
      .dbg-mini-toggle { position:relative; width:32px; height:18px; cursor:pointer; }
      .dbg-mini-toggle input { opacity:0; width:0; height:0; position:absolute; }
      .dbg-mini-toggle-track { position:absolute; inset:0; border-radius:99px; background:var(--dbg-surface2); border:1px solid var(--dbg-border); transition:background 200ms; }
      .dbg-mini-toggle input:checked ~ .dbg-mini-toggle-track { background:var(--dbg-accent); border-color:var(--dbg-accent); }
      .dbg-mini-toggle-thumb { position:absolute; top:2px; left:2px; width:12px; height:12px; border-radius:50%; background:#fff; transition:transform 200ms; }
      .dbg-mini-toggle input:checked ~ .dbg-mini-toggle-track ~ .dbg-mini-toggle-thumb,
      .dbg-mini-toggle input:checked + .dbg-mini-toggle-track + .dbg-mini-toggle-thumb { transform:translateX(14px); }
      .dbg-color-swatch { width: 14px; height: 14px; border-radius: 3px; display: inline-block; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); }
      .dbg-copy-btn { padding: 2px 8px; background: transparent; border: 1px solid var(--dbg-border); border-radius: 4px; color: var(--dbg-muted); cursor: pointer; font-size: 10px; font-family: var(--dbg-font); margin-left: 6px; transition: all 120ms; }
      .dbg-copy-btn:hover { border-color: var(--dbg-accent); color: var(--dbg-accent2); }

      @media (max-width: 1023px) { #dbg-overlay { display: none !important; } }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'dbg-overlay';
    overlay.innerHTML = `
      <div id="dbg-panel">
        <div id="dbg-header">
          <div id="dbg-logo">D</div>
          <span id="dbg-title">DevPanel</span>
          <span id="dbg-version">v1.0</span>
          <div id="dbg-tabs">
            <button class="dbg-tab active" data-tab="overview">Overview</button>
            <button class="dbg-tab" data-tab="inspector">Inspector</button>
            <button class="dbg-tab" data-tab="network">Network</button>
            <button class="dbg-tab" data-tab="performance">Performance</button>
            <button class="dbg-tab" data-tab="storage">Storage</button>
            <button class="dbg-tab" data-tab="console">Console</button>
            <button class="dbg-tab" data-tab="settings">Settings</button>
          </div>
          <button id="dbg-close" title="Close (Esc)">✕</button>
        </div>
        <div id="dbg-body">

          <div class="dbg-panel-content active" data-panel="overview">
            <div class="dbg-grid dbg-grid-4" id="dbg-stats-row"></div>
            <div class="dbg-grid dbg-grid-2">
              <div class="dbg-card" id="dbg-device-card">
                <div class="dbg-card-title">Device & Browser</div>
                <div id="dbg-device-rows"></div>
              </div>
              <div class="dbg-card" id="dbg-page-card">
                <div class="dbg-card-title">Page Info</div>
                <div id="dbg-page-rows"></div>
              </div>
            </div>
            <div class="dbg-grid dbg-grid-2">
              <div class="dbg-card">
                <div class="dbg-card-title">Session Analytics</div>
                <div id="dbg-session-rows"></div>
              </div>
              <div class="dbg-card">
                <div class="dbg-card-title">Errors <span id="dbg-err-badge" class="dbg-badge red" style="margin-left:6px;display:none"></span></div>
                <div id="dbg-error-rows" style="max-height:140px;overflow-y:auto;"></div>
              </div>
            </div>
            <div class="dbg-card">
              <div class="dbg-card-title">CSS Variables (computed from :root)</div>
              <div id="dbg-cssvar-rows" style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px;"></div>
            </div>
          </div>

          <div class="dbg-panel-content" data-panel="inspector" style="padding:0;flex-direction:row;">
            <div style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
              <div id="dbg-inspector-toolbar">
                <button class="dbg-icon-btn" id="dbg-pick-btn" title="Pick element from page">⊕</button>
                <input class="dbg-search-input" id="dbg-el-search" placeholder="Filter elements by tag / class / id…" />
                <button class="dbg-icon-btn" id="dbg-refresh-tree" title="Refresh tree">↺</button>
              </div>
              <div id="dbg-inspector-wrap">
                <div id="dbg-inspector-left"></div>
                <div id="dbg-inspector-right">
                  <div style="color:var(--dbg-muted);font-size:11px;margin-top:40px;text-align:center;">← Select an element to inspect</div>
                </div>
              </div>
            </div>
          </div>

          <div class="dbg-panel-content" data-panel="network">
            <div class="dbg-section-header">
              <div class="dbg-card-title" style="margin-bottom:0;">Request Log</div>
              <button class="dbg-clear-btn" id="dbg-net-clear">Clear</button>
            </div>
            <div class="dbg-card" style="padding:0;overflow:hidden;">
              <div style="overflow-x:auto;">
                <table class="dbg-table" id="dbg-net-table">
                  <thead><tr>
                    <th>Method</th><th>URL</th><th>Type</th><th>Status</th><th>Duration</th><th>Size</th><th>Time</th>
                  </tr></thead>
                  <tbody id="dbg-net-body"></tbody>
                </table>
              </div>
            </div>
            <div class="dbg-card" id="dbg-page-resources-card">
              <div class="dbg-card-title">Page Resources</div>
              <div id="dbg-resources-rows"></div>
            </div>
          </div>

          <div class="dbg-panel-content" data-panel="performance">
            <div class="dbg-grid dbg-grid-4" id="dbg-perf-stats"></div>
            <div class="dbg-grid dbg-grid-2">
              <div class="dbg-card">
                <div class="dbg-card-title">Core Web Vitals</div>
                <div id="dbg-cwv-rows"></div>
              </div>
              <div class="dbg-card">
                <div class="dbg-card-title">Memory</div>
                <div id="dbg-memory-rows"></div>
              </div>
            </div>
            <div class="dbg-card">
              <div class="dbg-card-title">Resource Timeline (top 20 by duration)</div>
              <div id="dbg-timeline"></div>
            </div>
          </div>

          <div class="dbg-panel-content" data-panel="storage">
            <div class="dbg-grid dbg-grid-2">
              <div class="dbg-card">
                <div class="dbg-section-header">
                  <div class="dbg-card-title" style="margin-bottom:0;">LocalStorage</div>
                  <button class="dbg-clear-btn" id="dbg-ls-clear">Clear all</button>
                </div>
                <div id="dbg-ls-rows" style="max-height:260px;overflow-y:auto;"></div>
              </div>
              <div class="dbg-card">
                <div class="dbg-section-header">
                  <div class="dbg-card-title" style="margin-bottom:0;">SessionStorage</div>
                  <button class="dbg-clear-btn" id="dbg-ss-clear">Clear all</button>
                </div>
                <div id="dbg-ss-rows" style="max-height:260px;overflow-y:auto;"></div>
              </div>
            </div>
            <div class="dbg-card">
              <div class="dbg-section-header">
                <div class="dbg-card-title" style="margin-bottom:0;">Cookies</div>
                <button class="dbg-clear-btn" id="dbg-cookie-clear">Clear all</button>
              </div>
              <div id="dbg-cookie-rows" style="max-height:200px;overflow-y:auto;"></div>
            </div>
            <div class="dbg-card">
              <div class="dbg-card-title">IndexedDB Databases</div>
              <div id="dbg-idb-rows"></div>
            </div>
          </div>

          <div class="dbg-panel-content" data-panel="console">
            <div class="dbg-section-header">
              <div class="dbg-card-title" style="margin-bottom:0;">Console Output</div>
              <button class="dbg-clear-btn" id="dbg-con-clear">Clear</button>
            </div>
            <div id="dbg-console-output"></div>
            <div id="dbg-console-input-row">
              <input id="dbg-console-input" placeholder="JavaScript expression… (Enter to run)" spellcheck="false" />
              <button id="dbg-console-run">▶ Run</button>
            </div>
          </div>

          <div class="dbg-panel-content" data-panel="settings">
            <div class="dbg-grid dbg-grid-2">
              <div class="dbg-card">
                <div class="dbg-card-title">Display</div>
                <div id="dbg-settings-display"></div>
              </div>
              <div class="dbg-card">
                <div class="dbg-card-title">Accessibility Audit</div>
                <div id="dbg-a11y-rows"></div>
              </div>
            </div>
            <div class="dbg-card">
              <div class="dbg-card-title">Installed Service Workers</div>
              <div id="dbg-sw-rows"></div>
            </div>
            <div class="dbg-card">
              <div class="dbg-card-title">Feature Detection</div>
              <div id="dbg-features-grid" class="dbg-grid dbg-grid-4"></div>
            </div>
            <div class="dbg-card">
              <div class="dbg-card-title">Keyboard Shortcuts</div>
              <div id="dbg-shortcuts-rows"></div>
            </div>
          </div>

        </div>
        <div id="dbg-statusbar">
          <div id="dbg-live-dot"></div>
          <span id="dbg-status-url" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px;"></span>
          <span class="sep">|</span>
          <span id="dbg-status-time"></span>
          <span class="sep">|</span>
          <span id="dbg-status-elements"></span>
          <span class="sep">|</span>
          <span id="dbg-status-net"></span>
          <span class="sep">|</span>
          <span id="dbg-status-errors" style="color:var(--dbg-red)"></span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cursor = document.createElement('div'); cursor.id = 'dbg-pick-cursor';
    const highlight = document.createElement('div'); highlight.id = 'dbg-pick-highlight';
    document.body.appendChild(cursor);
    document.body.appendChild(highlight);

    let pickerActive = false;
    let pickerCallback = null;

    function startPicker(cb) {
      pickerActive = true;
      pickerCallback = cb;
      cursor.style.display = 'block';
      highlight.style.display = 'block';
      document.body.style.cursor = 'crosshair';
    }

    function stopPicker() {
      pickerActive = false;
      pickerCallback = null;
      cursor.style.display = 'none';
      highlight.style.display = 'none';
      document.body.style.cursor = '';
    }

    on(document, 'mousemove', (e) => {
      if (!pickerActive) return;
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el !== overlay && !overlay.contains(el)) {
        const r = el.getBoundingClientRect();
        highlight.style.left = r.left + window.scrollX + 'px';
        highlight.style.top = r.top + window.scrollY + 'px';
        highlight.style.width = r.width + 'px';
        highlight.style.height = r.height + 'px';
      }
    });

    on(document, 'click', (e) => {
      if (!pickerActive) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el !== overlay && !overlay.contains(el)) {
        e.preventDefault(); e.stopPropagation();
        stopPicker();
        $('[data-tab="inspector"]', overlay)?.click();
        if (pickerCallback) pickerCallback(el);
      }
    }, true);

    $$('.dbg-tab', overlay).forEach(t => {
      on(t, 'click', () => {
        $$('.dbg-tab', overlay).forEach(b => b.classList.remove('active'));
        $$('.dbg-panel-content', overlay).forEach(p => p.classList.remove('active'));
        t.classList.add('active');
        const panel = $(`[data-panel="${t.dataset.tab}"]`, overlay);
        if (panel) {
          panel.classList.add('active');
          fillPanel(t.dataset.tab);
        }
      });
    });

    $('#dbg-close', overlay).onclick = hidePanel;
    overlay.addEventListener('click', e => { if (e.target === overlay) hidePanel(); });

    const conOut = $('#dbg-console-output', overlay);
    const origConsole = {};
    ['log','warn','error','info','debug'].forEach(method => {
      origConsole[method] = console[method].bind(console);
      console[method] = function(...args) {
        origConsole[method](...args);
        addConsoleLine(method, args.map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); } catch { return String(a); }
        }).join(' '));
      };
    });

    function addConsoleLine(type, text) {
      const line = document.createElement('div');
      line.className = `dbg-console-line ${type === 'debug' ? 'log' : type}`;
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
      line.textContent = `[${time}] ${text}`;
      conOut?.appendChild(line);
      conOut?.scrollTo(0, conOut.scrollHeight);
    }

    const consoleInput = $('#dbg-console-input', overlay);
    const consoleRun = $('#dbg-console-run', overlay);

    function runConsole() {
      const code = consoleInput.value.trim();
      if (!code) return;
      addConsoleLine('info', '> ' + code);
      try {
        const result = (new Function(`with(window){return (${code})}`)());
        if (result !== undefined) addConsoleLine('success', '← ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)));
      } catch (err) {
        addConsoleLine('error', '⚠ ' + err.message);
      }
      consoleInput.value = '';
    }

    on(consoleInput, 'keydown', e => { if (e.key === 'Enter') runConsole(); });
    on(consoleRun, 'click', runConsole);
    on($('#dbg-con-clear', overlay), 'click', () => conOut.innerHTML = '');

    on($('#dbg-net-clear', overlay), 'click', () => { Analytics.netLog.splice(0); fillPanel('network'); });

    on($('#dbg-ls-clear', overlay), 'click', () => { try { localStorage.clear(); } catch(e){} fillPanel('storage'); });
    on($('#dbg-ss-clear', overlay), 'click', () => { try { sessionStorage.clear(); } catch(e){} fillPanel('storage'); });
    on($('#dbg-cookie-clear', overlay), 'click', () => {
      document.cookie.split(';').forEach(c => { document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'; });
      fillPanel('storage');
    });

    let selectedEl = null;

    function buildTree(filter = '') {
      const container = $('#dbg-inspector-left', overlay);
      container.innerHTML = '';
      const elements = $$('*', document).filter(el =>
        el !== overlay && !overlay.contains(el) &&
        (!filter || el.tagName.toLowerCase().includes(filter) || (el.className && String(el.className).includes(filter)) || (el.id && el.id.includes(filter)))
      );

      elements.slice(0, 400).forEach(el => {
        const node = document.createElement('div');
        node.className = 'dbg-tree-node';
        if (el === selectedEl) node.classList.add('selected');
        const tag = `<span class="tag">&lt;${el.tagName.toLowerCase()}&gt;</span>`;
        const cls = el.className ? ` <span class="cls">.${String(el.className).trim().split(/\s+/).slice(0,2).join('.')}</span>` : '';
        const id = el.id ? ` <span class="id">#${el.id}</span>` : '';
        node.innerHTML = tag + id + cls;
        on(node, 'click', () => {
          $$('.dbg-tree-node.selected', overlay).forEach(n => n.classList.remove('selected'));
          node.classList.add('selected');
          selectedEl = el;
          inspectElement(el);
        });
        container.appendChild(node);
      });

      if (elements.length > 400) {
        const more = document.createElement('div');
        more.style.cssText = 'padding:6px;color:var(--dbg-muted);font-size:10px;text-align:center;';
        more.textContent = `+${elements.length - 400} more — use filter to narrow`;
        container.appendChild(more);
      }
    }

    function inspectElement(el) {
      const right = $('#dbg-inspector-right', overlay);
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const attrs = [...el.attributes].map(a => `<div class="dbg-row"><span class="dbg-key">${a.name}</span><span class="dbg-val" style="font-size:10px;word-break:break-all;">${a.value || '""'}</span></div>`).join('');

      const propList = ['display','position','width','height','margin','padding','font-size','color','background-color','border','border-radius','opacity','z-index','overflow','flex-direction','gap','box-shadow'];
      const computedRows = propList.map(p => {
        const val = cs.getPropertyValue(p);
        return `<div class="dbg-prop-row">
          <span class="dbg-prop-key">${p}</span>
          <div class="dbg-prop-val">
            <input class="dbg-prop-input" data-prop="${p}" value="${val}" style="width:100%" />
          </div>
        </div>`;
      }).join('');

      const colorProps = ['color','background-color','border-color','outline-color'].map(p => {
        const v = cs.getPropertyValue(p);
        return `<div class="dbg-row"><span class="dbg-key">${p}</span><span class="dbg-val" style="display:flex;align-items:center;gap:6px;"><span class="dbg-color-swatch" style="background:${v}"></span>${v}</span></div>`;
      }).join('');

      right.innerHTML = `
        <div class="dbg-prop-section">
          <div class="dbg-prop-title">Element</div>
          <div class="dbg-card" style="padding:10px 12px;">
            <div class="dbg-row"><span class="dbg-key">Tag</span><span class="dbg-val accent">&lt;${el.tagName.toLowerCase()}&gt;</span></div>
            <div class="dbg-row"><span class="dbg-key">ID</span><span class="dbg-val">${el.id || '—'}</span></div>
            <div class="dbg-row"><span class="dbg-key">Classes</span><span class="dbg-val" style="word-break:break-all;">${String(el.className) || '—'}</span></div>
            <div class="dbg-row"><span class="dbg-key">Children</span><span class="dbg-val">${el.children.length}</span></div>
            <div class="dbg-row"><span class="dbg-key">Text</span><span class="dbg-val" style="opacity:0.6;font-size:10px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${el.textContent?.trim().slice(0,80) || '—'}</span></div>
          </div>
        </div>
        <div class="dbg-prop-section">
          <div class="dbg-prop-title">Box Model (px)</div>
          <div class="dbg-card" style="padding:10px 12px;">
            <div class="dbg-row"><span class="dbg-key">width × height</span><span class="dbg-val green">${rect.width.toFixed(1)} × ${rect.height.toFixed(1)}</span></div>
            <div class="dbg-row"><span class="dbg-key">top / left</span><span class="dbg-val">${rect.top.toFixed(1)} / ${rect.left.toFixed(1)}</span></div>
            <div class="dbg-row"><span class="dbg-key">margin</span><span class="dbg-val">${cs.margin}</span></div>
            <div class="dbg-row"><span class="dbg-key">padding</span><span class="dbg-val">${cs.padding}</span></div>
            <div class="dbg-row"><span class="dbg-key">border</span><span class="dbg-val">${cs.border}</span></div>
          </div>
        </div>
        <div class="dbg-prop-section">
          <div class="dbg-prop-title">Attributes</div>
          <div class="dbg-card" style="padding:10px 12px;">${attrs || '<span style="color:var(--dbg-muted)">none</span>'}</div>
        </div>
        <div class="dbg-prop-section">
          <div class="dbg-prop-title">Colors</div>
          <div class="dbg-card" style="padding:10px 12px;">${colorProps}</div>
        </div>
        <div class="dbg-prop-section">
          <div class="dbg-prop-title">Computed Styles (editable)</div>
          <div class="dbg-card" style="padding:10px 12px;">
            <div style="display:flex;flex-direction:column;gap:5px;">${computedRows}</div>
          </div>
        </div>
        <div class="dbg-prop-section">
          <div class="dbg-prop-title">innerHTML</div>
          <div class="dbg-card" style="padding:10px 12px;">
            <textarea class="dbg-prop-input" id="dbg-html-editor" style="height:80px;font-size:10px;">${el.innerHTML.slice(0,500)}</textarea>
          </div>
        </div>
      `;

      $$('.dbg-prop-input[data-prop]', right).forEach(inp => {
        on(inp, 'input', () => { el.style.setProperty(inp.dataset.prop, inp.value); });
      });

      const htmlEditor = $('#dbg-html-editor', right);
      on(htmlEditor, 'input', debounce(() => { try { el.innerHTML = htmlEditor.value; } catch(e){} }, 300));
    }

    on($('#dbg-pick-btn', overlay), 'click', () => {
      const btn = $('#dbg-pick-btn', overlay);
      if (pickerActive) { stopPicker(); btn.classList.remove('active'); }
      else { startPicker(el => { buildTree(''); inspectElement(el); }); btn.classList.add('active'); }
    });

    on($('#dbg-refresh-tree', overlay), 'click', () => buildTree($('#dbg-el-search', overlay).value));

    on($('#dbg-el-search', overlay), 'input', debounce(() => {
      buildTree($('#dbg-el-search', overlay).value.toLowerCase());
    }, 200));

    function fillPanel(tab) {
      if (tab === 'overview') fillOverview();
      else if (tab === 'inspector') { buildTree(''); }
      else if (tab === 'network') fillNetwork();
      else if (tab === 'performance') fillPerformance();
      else if (tab === 'storage') fillStorage();
      else if (tab === 'settings') fillSettings();
    }

    function row(k, v, cls = '') {
      return `<div class="dbg-row"><span class="dbg-key">${k}</span><span class="dbg-val ${cls}">${v}</span></div>`;
    }

    function stat(label, value, sub = '', color = '') {
      return `<div class="dbg-stat"><span class="dbg-stat-label">${label}</span><span class="dbg-stat-value" style="${color ? `color:${color}` : ''}">${value}</span>${sub ? `<span class="dbg-stat-sub">${sub}</span>` : ''}</div>`;
    }

    function fillOverview() {
      const nav = performance.getEntriesByType('navigation')[0];
      const loadTime = nav ? nav.loadEventEnd - nav.fetchStart : 0;
      const elemCount = document.getElementsByTagName('*').length;
      const scriptCount = document.scripts.length;
      const styleCount = document.styleSheets.length;
      const imgCount = document.images.length;

      $('#dbg-stats-row', overlay).innerHTML =
        stat('DOM Elements', elemCount, 'on page') +
        stat('Load Time', formatMs(loadTime), 'incl. resources', loadTime < 1000 ? 'var(--dbg-green)' : loadTime < 3000 ? 'var(--dbg-amber)' : 'var(--dbg-red)') +
        stat('Network Req.', Analytics.netLog.length, 'intercepted') +
        stat('JS Errors', Analytics.session.errors.length, 'this session', Analytics.session.errors.length > 0 ? 'var(--dbg-red)' : '');

      const ua = navigator.userAgent;
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      $('#dbg-device-rows', overlay).innerHTML =
        row('Platform', navigator.platform) +
        row('Browser', getBrowserName()) +
        row('User Agent', `<span style="font-size:9px;word-break:break-all;color:var(--dbg-muted)">${ua.slice(0,80)}…</span>`) +
        row('Screen', `${screen.width}×${screen.height} @ ${window.devicePixelRatio}x`) +
        row('Viewport', `${window.innerWidth}×${window.innerHeight}`) +
        row('Language', navigator.language) +
        row('Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone) +
        row('Online', navigator.onLine ? '<span class="dbg-badge green">Online</span>' : '<span class="dbg-badge red">Offline</span>') +
        row('Connection', conn ? `${conn.effectiveType || '?'} (${conn.downlink || '?'} Mbps, RTT ${conn.rtt || '?'}ms)` : 'unavailable') +
        row('Touch Points', navigator.maxTouchPoints) +
        row('Cookies', navigator.cookieEnabled ? 'enabled' : 'disabled') +
        row('DoNotTrack', navigator.doNotTrack || '—');

      $('#dbg-page-rows', overlay).innerHTML =
        row('URL', `<a href="${location.href}" target="_blank" style="color:var(--dbg-blue);text-decoration:none;font-size:10px;word-break:break-all;">${location.href.slice(0,60)}…</a>`) +
        row('Title', document.title || '—') +
        row('Meta desc.', $('meta[name="description"]')?.content?.slice(0,50) || '—') +
        row('Charset', document.characterSet) +
        row('DocType', document.doctype?.name || '—') +
        row('Referrer', document.referrer || '—') +
        row('Scripts', scriptCount) +
        row('Stylesheets', styleCount) +
        row('Images', imgCount) +
        row('Links', document.links.length) +
        row('Forms', document.forms.length) +
        row('Last modified', document.lastModified);

      const elapsed = Math.round((Date.now() - Analytics.session.start) / 1000);
      const minutes = Math.floor(elapsed / 60), secs = elapsed % 60;
      $('#dbg-session-rows', overlay).innerHTML =
        row('Session ID', `<code style="font-size:9px;">${Analytics.session.id}</code>`) +
        row('Duration', `${minutes}m ${secs}s`) +
        row('Clicks', Analytics.session.clicks) +
        row('Keystrokes', Analytics.session.keystrokes) +
        row('Scroll Depth', Analytics.session.scrollDepth + '%') +
        row('Page Views', Analytics.session.pageViews) +
        row('Referrer', document.referrer || 'direct');

      const errBadge = $('#dbg-err-badge', overlay);
      if (Analytics.session.errors.length > 0) {
        errBadge.style.display = 'inline-flex';
        errBadge.textContent = Analytics.session.errors.length;
        $('#dbg-error-rows', overlay).innerHTML = Analytics.session.errors.slice(-10).map(e =>
          `<div style="padding:5px 0;border-bottom:1px solid var(--dbg-border);font-size:10px;line-height:1.5;color:var(--dbg-red);">${e.msg}${e.file ? `<br><span style="color:var(--dbg-muted)">${e.file}:${e.line}</span>` : ''}</div>`
        ).join('');
      } else {
        errBadge.style.display = 'none';
        $('#dbg-error-rows', overlay).innerHTML = `<span style="color:var(--dbg-green);font-size:11px;">✓ No errors detected</span>`;
      }

      const csVarContainer = $('#dbg-cssvar-rows', overlay);
      const rootStyles = getComputedStyle(document.documentElement);
      const cssVarNames = ['--space','--radius','--font-size-base','--font-size-sm','--font-size-lg','--font-weight-normal','--font-weight-bold','--transition-base','--shadow-md','--page-width'];
      csVarContainer.innerHTML = cssVarNames.map(v => {
        const val = rootStyles.getPropertyValue(v).trim();
        return `<div class="dbg-row"><span class="dbg-key" style="font-size:9px;">${v}</span><span class="dbg-val" style="font-size:9px;">${val || '—'}</span></div>`;
      }).join('');
    }

    function fillNetwork() {
      const tbody = $('#dbg-net-body', overlay);
      tbody.innerHTML = Analytics.netLog.length === 0
        ? `<tr><td colspan="7" style="text-align:center;color:var(--dbg-muted);padding:20px;">No requests intercepted yet</td></tr>`
        : Analytics.netLog.slice(-100).reverse().map(req => {
            const statusClass = req.status >= 200 && req.status < 300 ? 'green' : req.status >= 400 ? 'red' : 'amber';
            const time = new Date(req.time).toLocaleTimeString('en-GB', { hour12: false });
            return `<tr>
              <td><span class="dbg-badge blue">${req.method}</span></td>
              <td class="dbg-net-url mono">${req.url}</td>
              <td><span class="dbg-badge purple">${req.type}</span></td>
              <td><span class="dbg-badge ${statusClass}">${req.status}</span></td>
              <td class="${req.duration > 1000 ? 'dbg-val red' : req.duration > 300 ? 'dbg-val amber' : 'dbg-val green'}">${formatMs(req.duration)}</td>
              <td class="dbg-val">${req.size === '?' ? '—' : formatBytes(+req.size || 0)}</td>
              <td class="dbg-val" style="font-size:10px;color:var(--dbg-muted);">${time}</td>
            </tr>`;
          }).join('');

      const resources = performance.getEntriesByType('resource');
      const resEl = $('#dbg-resources-rows', overlay);
      resEl.innerHTML = resources.slice(0, 20).map(r => {
        const type = r.initiatorType;
        const badgeColor = type === 'script' ? 'amber' : type === 'css' ? 'purple' : type === 'img' ? 'blue' : 'green';
        return `<div class="dbg-row">
          <span class="dbg-key" style="max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.name.split('/').pop() || r.name}</span>
          <span class="dbg-val" style="display:flex;align-items:center;gap:6px;">
            <span class="dbg-badge ${badgeColor}">${type}</span>
            <span class="${r.duration > 500 ? 'dbg-val amber' : 'dbg-val'}">${formatMs(r.duration)}</span>
            ${r.transferSize ? `<span class="dbg-val" style="color:var(--dbg-muted)">${formatBytes(r.transferSize)}</span>` : ''}
          </span>
        </div>`;
      }).join('') || '<span style="color:var(--dbg-muted)">No resources loaded yet</span>';
    }

    function fillPerformance() {
      const nav = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      const totalTransfer = resources.reduce((a, r) => a + (r.transferSize || 0), 0);
      const avgLoad = resources.length ? resources.reduce((a,r) => a + r.duration, 0) / resources.length : 0;

      $('#dbg-perf-stats', overlay).innerHTML =
        stat('DOM Load', nav ? formatMs(nav.domContentLoadedEventEnd - nav.fetchStart) : '—', 'DOMContentLoaded') +
        stat('Full Load', nav ? formatMs(nav.loadEventEnd - nav.fetchStart) : '—', 'window.onload') +
        stat('TTFB', nav ? formatMs(nav.responseStart - nav.requestStart) : '—', 'Time to first byte') +
        stat('Page Size', formatBytes(totalTransfer), `${resources.length} resources`);

      const cwvEl = $('#dbg-cwv-rows', overlay);
      const timing = performance.timing || {};
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
      cwvEl.innerHTML =
        row('FCP', fcp ? `<span class="${fcp.startTime < 1800 ? 'green' : fcp.startTime < 3000 ? 'amber' : 'red'}">${formatMs(fcp.startTime)}</span>` : '—') +
        row('TTFB', nav ? `<span class="${(nav.responseStart-nav.requestStart) < 200 ? 'green' : 'amber'}">${formatMs(nav.responseStart - nav.requestStart)}</span>` : '—') +
        row('DOM Interactive', nav ? formatMs(nav.domInteractive - nav.fetchStart) : '—') +
        row('DOM Complete', nav ? formatMs(nav.domComplete - nav.fetchStart) : '—') +
        row('Redirects', nav ? nav.redirectCount : '—') +
        row('Protocol', nav ? nav.nextHopProtocol || '—' : '—');

      const memEl = $('#dbg-memory-rows', overlay);
      const mem = performance.memory;
      if (mem) {
        const pct = Math.round(mem.usedJSHeapSize / mem.jsHeapSizeLimit * 100);
        memEl.innerHTML =
          `<div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:11px;">
              <span style="color:var(--dbg-muted)">Heap used</span>
              <span class="${pct > 80 ? 'dbg-val red' : pct > 50 ? 'dbg-val amber' : 'dbg-val green'}">${pct}%</span>
            </div>
            <div class="dbg-bar-wrap"><div class="dbg-bar ${pct > 80 ? 'red' : pct > 50 ? 'amber' : ''}" style="width:${pct}%"></div></div>
          </div>` +
          row('Used Heap', formatBytes(mem.usedJSHeapSize), 'green') +
          row('Total Heap', formatBytes(mem.totalJSHeapSize)) +
          row('Heap Limit', formatBytes(mem.jsHeapSizeLimit));
      } else {
        memEl.innerHTML = '<span style="color:var(--dbg-muted);font-size:11px;">Memory API not available in this browser</span>';
      }

      const timeEl = $('#dbg-timeline', overlay);
      const sorted = resources.sort((a,b) => b.duration - a.duration).slice(0,20);
      const maxDur = sorted[0]?.duration || 1;
      timeEl.innerHTML = sorted.map(r => `
        <div class="dbg-timeline-item">
          <span class="dbg-timeline-name">${r.name.split('/').pop().slice(0,30) || r.name}</span>
          <div class="dbg-timeline-bar-wrap"><div class="dbg-timeline-bar" style="width:${(r.duration/maxDur*100).toFixed(1)}%"></div></div>
          <span class="dbg-timeline-ms">${formatMs(r.duration)}</span>
        </div>
      `).join('') || '<span style="color:var(--dbg-muted)">No resource entries</span>';
    }

    function fillStorage() {
      function storageRows(store) {
        try {
          if (!store.length) return '<span style="color:var(--dbg-muted);font-size:11px;">Empty</span>';
          let html = '';
          for (let i = 0; i < store.length; i++) {
            const key = store.key(i);
            const val = store.getItem(key);
            html += `<div class="dbg-row">
              <span class="dbg-key" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${key}</span>
              <span class="dbg-val" style="font-size:10px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${val?.slice(0,60) || '""'}</span>
            </div>`;
          }
          return html;
        } catch(e) { return `<span style="color:var(--dbg-red)">Access denied</span>`; }
      }
      $('#dbg-ls-rows', overlay).innerHTML = storageRows(localStorage);
      $('#dbg-ss-rows', overlay).innerHTML = storageRows(sessionStorage);

      const cookies = document.cookie.split(';').filter(c => c.trim());
      $('#dbg-cookie-rows', overlay).innerHTML = cookies.length
        ? cookies.map(c => {
            const [k, ...v] = c.trim().split('=');
            return `<div class="dbg-row"><span class="dbg-key">${k?.trim()}</span><span class="dbg-val" style="font-size:10px;">${v.join('=')?.slice(0,60) || '—'}</span></div>`;
          }).join('')
        : '<span style="color:var(--dbg-muted);font-size:11px;">No cookies</span>';

      const idbEl = $('#dbg-idb-rows', overlay);
      if (indexedDB.databases) {
        indexedDB.databases().then(dbs => {
          idbEl.innerHTML = dbs.length
            ? dbs.map(d => row(d.name, `v${d.version}`)).join('')
            : '<span style="color:var(--dbg-muted);font-size:11px;">No IndexedDB databases</span>';
        }).catch(() => { idbEl.innerHTML = '<span style="color:var(--dbg-muted)">Not available</span>'; });
      } else {
        idbEl.innerHTML = '<span style="color:var(--dbg-muted);font-size:11px;">indexedDB.databases() not supported</span>';
      }
    }

    function fillSettings() {
      const displayEl = $('#dbg-settings-display', overlay);
      const settings = [
        { label: 'Show grid overlay', key: 'dbg-grid' },
        { label: 'Show outline all elements', key: 'dbg-outline' },
        { label: 'Show layout spacing', key: 'dbg-spacing' },
        { label: 'Disable CSS transitions', key: 'dbg-notransition' },
      ];
      displayEl.innerHTML = settings.map(s => `
        <div class="dbg-toggle-row">
          <span style="font-size:11px;color:var(--dbg-text);">${s.label}</span>
          <label class="dbg-mini-toggle">
            <input type="checkbox" data-setting="${s.key}" ${sessionStorage.getItem(s.key) === '1' ? 'checked' : ''} />
            <div class="dbg-mini-toggle-track"></div>
            <div class="dbg-mini-toggle-thumb"></div>
          </label>
        </div>
      `).join('');

      $$('[data-setting]', displayEl).forEach(inp => {
        on(inp, 'change', () => {
          sessionStorage.setItem(inp.dataset.setting, inp.checked ? '1' : '0');
          applySettings();
        });
      });

      const a11yEl = $('#dbg-a11y-rows', overlay);
      const issues = [];
      $$('img:not([alt])', document).forEach(() => issues.push('Image missing alt attribute'));
      $$('input:not([id]):not([aria-label])', document).filter(el => !overlay.contains(el)).forEach(() => issues.push('Input missing label'));
      $$('a[href="#"]', document).filter(el => !el.textContent.trim()).forEach(() => issues.push('Empty anchor link'));
      if (!$('main', document)) issues.push('<main> landmark missing');
      if (!$('[role="navigation"], nav', document)) issues.push('No navigation landmark');
      if (!$('h1', document)) issues.push('No <h1> on page');
      const colorContrast = document.documentElement.style.getPropertyValue('--color-contrast') ? 'pass' : null;

      a11yEl.innerHTML = issues.length === 0
        ? `<span style="color:var(--dbg-green)">✓ No obvious accessibility issues found</span>`
        : issues.map(i => `<div style="padding:4px 0;color:var(--dbg-amber);font-size:11px;">⚠ ${i}</div>`).join('');

      const swEl = $('#dbg-sw-rows', overlay);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          swEl.innerHTML = regs.length
            ? regs.map(r => row(r.scope, r.active ? '<span class="dbg-badge green">active</span>' : '<span class="dbg-badge amber">installing</span>')).join('')
            : '<span style="color:var(--dbg-muted);font-size:11px;">No service workers registered</span>';
        });
      } else { swEl.innerHTML = '<span style="color:var(--dbg-muted)">Not supported</span>'; }

      const features = {
        'WebGL': !!document.createElement('canvas').getContext('webgl'),
        'WebGL2': !!document.createElement('canvas').getContext('webgl2'),
        'WebWorker': !!window.Worker,
        'WebSocket': !!window.WebSocket,
        'SharedWorker': !!window.SharedWorker,
        'Clipboard': !!navigator.clipboard,
        'Geolocation': !!navigator.geolocation,
        'Notifications': !!window.Notification,
        'Bluetooth': !!navigator.bluetooth,
        'USB': !!navigator.usb,
        'Camera': !!(navigator.mediaDevices?.getUserMedia),
        'PWA/Install': !!window.BeforeInstallPromptEvent,
        'IndexedDB': !!window.indexedDB,
        'CacheAPI': !!window.caches,
        'ServiceWorker': !!navigator.serviceWorker,
        'WASM': !!window.WebAssembly,
      };
      $('#dbg-features-grid', overlay).innerHTML = Object.entries(features).map(([k, v]) =>
        `<div class="dbg-stat" style="padding:8px 10px;">
          <span class="dbg-stat-label">${k}</span>
          <span class="${v ? 'dbg-badge green' : 'dbg-badge red'}">${v ? '✓ Yes' : '✗ No'}</span>
        </div>`
      ).join('');

      $('#dbg-shortcuts-rows', overlay).innerHTML = [
        ['Shift + Ctrl + D', 'Toggle DevPanel'],
        ['Esc', 'Close DevPanel'],
        ['⊕ Pick tool', 'Click element to inspect'],
      ].map(([k, v]) => `<div class="dbg-row"><span class="dbg-key"><code style="background:var(--dbg-surface2);padding:2px 6px;border-radius:3px;font-size:10px;">${k}</code></span><span class="dbg-val">${v}</span></div>`).join('');
    }

    function applySettings() {
      let styleTag = $('#dbg-settings-css');
      if (!styleTag) { styleTag = document.createElement('style'); styleTag.id = 'dbg-settings-css'; document.head.appendChild(styleTag); }
      let css = '';
      if (sessionStorage.getItem('dbg-grid') === '1') {
        css += `body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(90deg,rgba(157,127,232,0.08) 0 1px,transparent 1px 8.333%);pointer-events:none;z-index:999900;}`;
      }
      if (sessionStorage.getItem('dbg-outline') === '1') {
        css += `*:not(#dbg-overlay):not(#dbg-overlay *){outline:1px solid rgba(157,127,232,0.35)!important;}`;
      }
      if (sessionStorage.getItem('dbg-spacing') === '1') {
        css += `*:not(#dbg-overlay):not(#dbg-overlay *){background-color:rgba(106,180,245,0.03)!important;}`;
      }
      if (sessionStorage.getItem('dbg-notransition') === '1') {
        css += `*:not(#dbg-overlay):not(#dbg-overlay *){transition:none!important;animation:none!important;}`;
      }
      styleTag.textContent = css;
    }

    applySettings();

    function updateStatus() {
      $('#dbg-status-url', overlay).textContent = location.hostname || location.href.slice(0,40);
      $('#dbg-status-time', overlay).textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
      $('#dbg-status-elements', overlay).textContent = document.getElementsByTagName('*').length + ' elements';
      $('#dbg-status-net', overlay).textContent = Analytics.netLog.length + ' requests';
      const errCount = Analytics.session.errors.length;
      const errEl = $('#dbg-status-errors', overlay);
      errEl.textContent = errCount > 0 ? `${errCount} error${errCount > 1 ? 's' : ''}` : '';
    }

    setInterval(updateStatus, 1000);
    updateStatus();

    fillOverview();

    return overlay;
  }

  function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Unknown';
  }

  let panelEl = null;
  let panelOpen = false;

  function showPanel() {
    if (isMobile()) return;
    if (!panelEl) panelEl = buildDebugPanel();
    panelEl.style.display = 'flex';
    panelOpen = true;
    const activeTab = panelEl.querySelector('.dbg-tab.active');
    if (activeTab) {
      const active = panelEl.querySelector('.dbg-panel-content.active');
      if (active?.dataset.panel === 'overview') {
        const fn = { overview: () => panelEl.querySelector('[data-panel="overview"]') && fillOverview() };
      }
    }
  }

  function hidePanel() {
    if (!panelEl) return;
    panelEl.style.display = 'none';
    panelOpen = false;
  }

  function fillOverview() {
  }

  on(document, 'keydown', e => {
    if (e.shiftKey && e.ctrlKey && e.key === 'D') {
      e.preventDefault();
      if (isMobile()) return;
      panelOpen ? hidePanel() : showPanel();
    }
    if (e.key === 'Escape' && panelOpen) hidePanel();
  });

  function init() {
    initTabs();
    initAccordions();
    initToggles();
    initDropdowns();
    initCollapsibles();
    initCarousels();
    initKanban();
    initRanges();
    initCharCounters();
    console.info('[core.js] Initialised — Press Shift+Ctrl+D to open DevPanel (desktop only)');
  }

  if (document.readyState === 'loading') {
    on(document, 'DOMContentLoaded', init);
  } else {
    init();
  }

  window.CoreJS = {
    openDevPanel: showPanel,
    closeDevPanel: hidePanel,
    toast: window.showToast,
    openDialog: window.openDialog,
    closeDialog: window.closeDialog,
    analytics: Analytics,
    utils: { $, $$, on, off, debounce, throttle, uuid, formatBytes, formatMs }
  };

})();