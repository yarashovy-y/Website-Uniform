/**
 * i18n engine.
 * - Page HTML is pre-rendered per language (/tk/, /ru/, /en/), so content never
 *   depends on JS. This module loads the same /i18n/<lang>.json dictionary at
 *   runtime for anything rendered or announced by JS (products, form messages).
 * - Remembers the visitor's explicit language choice in localStorage; the root
 *   page ("/", Turkmen) forwards returning visitors to /ru/ or /en/.
 */
export const SUPPORTED = ['tk', 'ru', 'en'];
export const DEFAULT_LANG = 'tk';
export const STORAGE_KEY = 'gu-lang';

/** Site root, resolved from this module's URL — works from any sub-path. */
export const SITE_ROOT = new URL('../', import.meta.url);

const htmlLang = document.documentElement.lang;
export const lang = SUPPORTED.includes(htmlLang) ? htmlLang : DEFAULT_LANG;

let dictPromise;

/** Load (once) and return the dictionary for the current page language. */
export function loadDict() {
  dictPromise ??= fetch(new URL(`i18n/${lang}.json`, SITE_ROOT)).then((res) => {
    if (!res.ok) throw new Error(`i18n: cannot load ${lang}.json (${res.status})`);
    return res.json();
  });
  return dictPromise;
}

/** Resolve "a.b.c" in a dictionary; returns the key itself when missing. */
export function t(dict, key, vars) {
  let value = key.split('.').reduce((obj, part) => (obj == null ? obj : obj[part]), dict);
  if (typeof value !== 'string') return key;
  if (vars) value = value.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? vars[name] : m));
  return value;
}

/** Persist the language when a switcher link (header or footer) is used. */
export function initLangSwitch() {
  document.querySelectorAll('a[data-lang]').forEach((link) => {
    link.addEventListener('click', () => {
      try {
        localStorage.setItem(STORAGE_KEY, link.dataset.lang);
      } catch {
        /* storage unavailable — the link still works */
      }
    });
  });
}
