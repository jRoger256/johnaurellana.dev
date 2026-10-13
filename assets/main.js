(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  // Footer year
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  // Theme toggle (remembered per browser)
  var themeBtn = $('#theme');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // Scroll progress bar + timeline fill
  var bar = $('#progress'), jobs = $('#jobs'), rail = $('#rail'), jobEls = $$('.job');
  var ticking = false;
  function onScroll() {
    var h = root.scrollHeight - root.clientHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, root.scrollTop / h) : 0) + ')';
    if (jobs && rail) {
      var r = jobs.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / r.height));
      rail.style.height = (p * 100) + '%';
      var line = vh * 0.6;
      jobEls.forEach(function (j) { j.classList.toggle('lit', j.getBoundingClientRect().top < line); });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Scroll reveal with a small stagger inside each group
  if (hasIO && !reduce) {
    root.classList.add('js');
    var groups = [
      '.prose > *', '.section .eyebrow', '.section h2', '.section-lead', '.job-meta', '.job-body', '.project',
      '.steps li', '.skills > div', '.metrics', '.contact .narrow > *'
    ];
    var seen = [];
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    $$(groups.join(',')).forEach(function (el) {
      if (seen.indexOf(el) > -1 || el.closest('.hero')) return;
      seen.push(el);
      var sibs = el.parentElement ? [].slice.call(el.parentElement.children) : [];
      el.style.setProperty('--rd', Math.min(sibs.indexOf(el), 5) * 90 + 'ms');
      el.classList.add('reveal');
      rio.observe(el);
    });
  }

  // Count-up numbers (final value is already in the markup)
  if (hasIO && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; cio.unobserve(el);
        var to = +el.dataset.to, suf = el.dataset.suffix || '', t0 = performance.now();
        (function tick(now) {
          var p = Math.min(1, (now - t0) / 1300);
          var v = Math.round(to * (1 - Math.pow(1 - p, 3)));
          el.textContent = v.toLocaleString('en-US') + (p === 1 ? suf : '');
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.7 });
    $$('[data-to]').forEach(function (el) { cio.observe(el); });
  }

  // Cursor spotlight on cards
  $$('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Terminal: types the deploy path, pauses, then replays
  var term = $('#term');
  if (term && !reduce) {
    var lines = [];
    try { lines = JSON.parse(term.getAttribute('data-lines')); } catch (e) {}
    if (lines.length) {
      var caret = document.createElement('span'); caret.className = 'caret';
      var alive = true;
      document.addEventListener('visibilitychange', function () { alive = !document.hidden; });
      var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
      var run = async function () {
        while (true) {
          term.textContent = '';
          for (var i = 0; i < lines.length; i++) {
            var span = document.createElement('span');
            span.className = lines[i].c;
            term.appendChild(span); span.after(caret);
            var text = lines[i].t;
            for (var k = 1; k <= text.length; k++) {
              while (!alive) await sleep(300);
              span.textContent = text.slice(0, k);
              await sleep(lines[i].c === 'cmd' ? 45 : 14);
            }
            term.insertBefore(document.createTextNode('\n'), caret);
            await sleep(lines[i].c === 'cmd' ? 500 : 380);
          }
          await sleep(4200);
        }
      };
      run();
    }
  }

  // Ticket flow: highlights each step in turn while on screen
  var flow = $('#flow');
  if (flow && hasIO && !reduce) {
    var steps = $$('li', flow), idx = 0, timer = null;
    function tick() { steps.forEach(function (s, i) { s.classList.toggle('hot', i === idx); }); idx = (idx + 1) % steps.length; }
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!timer) { tick(); timer = setInterval(tick, 1800); } }
      else { clearInterval(timer); timer = null; steps.forEach(function (s) { s.classList.remove('hot'); }); }
    }, { threshold: 0.4 }).observe(flow);
  }

  // Highlight the nav link for the section in view
  if (hasIO) {
    var links = $$('#nav a:not(.nav-cta)');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ['about', 'experience', 'projects', 'ai', 'skills'].forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  // Copy email
  var out = $('#copied'), btn = $('#copy');
  if (btn) btn.addEventListener('click', function () {
    var addr = $('#mail');
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(addr);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      out.textContent = 'Email selected. Press Ctrl+C to copy.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr.textContent).then(function () { out.textContent = 'Email address copied.'; }, fallback);
    } else { fallback(); }
  });
})();
