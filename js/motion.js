/**
 * Purposeful motion only: headline line grouping, section reveals,
 * the single "100+" count-up, and subtle desktop parallax.
 * Everything is skipped under prefers-reduced-motion; content is visible
 * by default and only hidden while <html class="motion"> is present.
 */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Give each word its visual line index so the CSS reveal runs line by line. */
function groupLines() {
  document.querySelectorAll('[data-split]').forEach((el) => {
    let line = -1;
    let top = null;
    el.querySelectorAll('.w').forEach((word) => {
      if (word.offsetTop !== top) {
        top = word.offsetTop;
        line += 1;
      }
      word.firstElementChild.style.setProperty('--l', line);
    });
  });
}

function initReveals() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
  );
  items.forEach((el) => io.observe(el));
}

/** Count-up — used for the "100+" figure only. */
function initCountUp() {
  const el = document.querySelector('[data-countup]');
  if (!el || reduced || !('IntersectionObserver' in window)) return;
  const target = Number(el.dataset.countup);
  const duration = 1400;
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    },
    { threshold: 0.6 }
  );
  io.observe(el);
}

/** Subtle parallax on [data-parallax] — desktop pointers only. */
function initParallax() {
  const items = [...document.querySelectorAll('[data-parallax]')];
  const desktop = window.matchMedia('(min-width: 62rem) and (hover: hover)');
  if (!items.length || reduced) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    items.forEach((el) => {
      if (!desktop.matches) {
        el.style.transform = '';
        return;
      }
      const rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = window.scrollY * Number(el.dataset.parallax || 0.08);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  desktop.addEventListener('change', update);
}

export function initMotion() {
  groupLines();
  initReveals();
  initCountUp();
  initParallax();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(groupLines, 200);
  });
  if (document.fonts?.ready) document.fonts.ready.then(groupLines);
}
