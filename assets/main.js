(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // Footer year
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // Scroll reveal: content stays visible if scripts or motion are unavailable
  if (hasIO && !reduce) {
    root.classList.add('js');
    var els = document.querySelectorAll('.job, .project, .steps li, .skills > div, .metrics, .facts-card, .prose, .contact .narrow > *');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    [].forEach.call(els, function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  // Highlight the nav link for the section in view
  if (hasIO) {
    var links = [].slice.call(document.querySelectorAll('#nav a:not(.nav-cta)'));
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ['about', 'experience', 'projects', 'ai', 'skills'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  // Copy email
  var out = document.getElementById('copied');
  var btn = document.getElementById('copy');
  if (btn) btn.addEventListener('click', function () {
    var addr = document.getElementById('mail');
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
