/**
 * Sticky header: shrinks after the first scroll, hides on scroll down,
 * returns on scroll up. Also drives the mobile menu.
 */
export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const root = document.documentElement;
  const toggle = header.querySelector('[data-menu-toggle]');
  const nav = header.querySelector('#site-nav');
  const label = header.querySelector('[data-menu-label]');
  const desktop = window.matchMedia('(min-width: 68.75rem)');

  /* ----- scroll behaviour ----- */
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = Math.max(0, window.scrollY);
    const menuOpen = root.classList.contains('nav-open');
    header.classList.toggle('is-scrolled', y > 24);
    if (!menuOpen && Math.abs(y - lastY) > 6) {
      const hide = y > lastY && y > 240 && !header.contains(document.activeElement);
      header.classList.toggle('is-hidden', hide);
      lastY = y;
    }
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  update();

  /* ----- mobile menu ----- */
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? toggle.dataset.labelClose : toggle.dataset.labelOpen;
    if (open) header.classList.remove('is-hidden');
  };
  const syncInert = () => {
    /* Keep the closed panel out of the tab order on small screens only. */
    const closedMobile = !desktop.matches && !root.classList.contains('nav-open');
    nav.inert = closedMobile;
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    syncInert();
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setOpen(false);
      syncInert();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('nav-open')) {
      setOpen(false);
      syncInert();
      toggle.focus();
    }
  });
  desktop.addEventListener('change', () => {
    setOpen(false);
    syncInert();
  });
  syncInert();
}
