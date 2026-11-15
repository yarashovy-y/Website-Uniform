/**
 * Entry point. Each feature is isolated so one failure cannot break the rest;
 * the page is fully readable without any of this.
 */
import { initLangSwitch } from './i18n.js';
import { initHeader } from './header.js';
import { initMotion } from './motion.js';
import { initProducts } from './products.js';
import { initForms } from './form.js';

function safely(name, fn) {
  try {
    const result = fn();
    if (result?.catch) result.catch((error) => console.warn(`[${name}]`, error));
  } catch (error) {
    console.warn(`[${name}]`, error);
  }
}

/** Dev mode (localhost or ?dev=1): count the placeholders on the page. */
function initDevBadge() {
  if (!document.documentElement.hasAttribute('data-dev')) return;
  const badge = document.querySelector('[data-dev-badge]');
  if (!badge) return;
  const refresh = () => {
    badge.querySelector('[data-dev-count]').textContent = String(document.querySelectorAll('[data-placeholder]').length);
  };
  refresh();
  badge.hidden = false;
  setTimeout(refresh, 1500);
}

window.__guReady = true; // tells the inline fail-safe that modules are running

safely('lang', initLangSwitch);
safely('header', initHeader);
safely('motion', initMotion);
safely('products', initProducts);
safely('forms', initForms);
safely('dev', initDevBadge);
