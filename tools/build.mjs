#!/usr/bin/env node
/**
 * Gandash Uniform — static page generator (OPTIONAL).
 *
 * The generated HTML is committed, so the site runs with no build step.
 * Run this only after changing /i18n/*.json, /data/products.json,
 * /site.config.json or the templates in this file:
 *
 *     node tools/build.mjs
 *
 * No dependencies. Node 18+.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, renderProductCard, ARROW_ICON } from '../js/product-card.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (p) => JSON.parse(await readFile(join(ROOT, p), 'utf8'));

const config = await readJson('site.config.json');
const products = await readJson('data/products.json');
const LANGS = config.languages;
const dicts = Object.fromEntries(await Promise.all(LANGS.map(async (l) => [l, await readJson(`i18n/${l}.json`)])));
const BASE = config.baseUrl.replace(/\/$/, '');
const YEAR = new Date().getFullYear();
const LANG_NAMES = { tk: 'Türkmençe', ru: 'Русский', en: 'English' };

/* ---------- URL helpers ---------- */
const homePath = (lang) => (lang === config.defaultLang ? '' : `${lang}/`);
const quotePath = (lang) => `${lang}/quote/`;
const pagePath = (kind, lang) => (kind === 'home' ? homePath(lang) : quotePath(lang));
const abs = (path) => `${BASE}/${path}`;

function makeRel(dir) {
  const depth = dir.split('/').filter(Boolean).length;
  const up = '../'.repeat(depth);
  return (path) => up + path || './';
}

const pad2 = (n) => String(n).padStart(2, '0');
const words = (text) =>
  text
    .split(' ')
    .map((w) => `<span class="w"><span class="wi">${esc(w)}</span></span>`)
    .join(' ');

/* ---------- Shared partials ---------- */
const LOGO_MARK = `<svg class="logo__mark" viewBox="0 0 40 40" width="36" height="36" aria-hidden="true" focusable="false">
  <rect x="1.5" y="1.5" width="37" height="37" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M27.5 14.5a9 9 0 1 0 1.2 9.5H20" fill="none" stroke="currentColor" stroke-width="3"/>
  <path d="M6 34 34 6" fill="none" stroke="#FF5A1F" stroke-width="2" stroke-dasharray="4 3.2"/>
</svg>`;

function head(p) {
  const { d, lang, kind, rel, isRoot } = p;
  const meta = d.meta[kind];
  const canonical = abs(pagePath(kind, lang));
  const alternates = LANGS.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="${abs(pagePath(kind, l))}">`
  ).join('\n  ');
  const fontPreload = lang === 'ru' ? 'unbounded-cyrillic' : 'unbounded-latin';
  const bodyPreload = lang === 'ru' ? 'onest-cyrillic' : 'onest-latin';
  const org = {
    '@type': 'Organization',
    '@id': `${BASE}/#organization`,
    name: config.brand,
    legalName: config.legalName,
    alternateName: config.legalName,
    url: `${BASE}/`,
    logo: abs('assets/img/logo.svg'),
    description: d.jsonld.description,
    memberOf: { '@type': 'Organization', name: d.jsonld.union },
    address: { '@type': 'PostalAddress', addressLocality: 'Türkmenabat', addressRegion: 'Lebap', addressCountry: 'TM' },
  };
  const biz = {
    '@type': 'LocalBusiness',
    '@id': `${BASE}/#localbusiness`,
    name: config.brand,
    legalName: config.legalName,
    url: canonical,
    image: abs('assets/img/og-default.png'),
    description: d.jsonld.description,
    address: org.address,
    areaServed: { '@type': 'Country', name: 'Turkmenistan' },
    knowsLanguage: LANGS,
    parentOrganization: { '@id': org['@id'] },
  };
  const page = {
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: meta.title,
    description: meta.description,
    inLanguage: lang,
    about: { '@id': org['@id'] },
  };
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, biz, page] }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="${lang}" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <link rel="alternate" hreflang="x-default" href="${abs(pagePath(kind, config.defaultLang))}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(config.brand)}">
  <meta property="og:title" content="${esc(meta.title)}">
  <meta property="og:description" content="${esc(meta.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="${d.meta.ogLocale}">
  ${LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${dicts[l].meta.ogLocale}">`).join('\n  ')}
  <meta property="og:image" content="${abs('assets/img/og-default.png')}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#0B1F3A">
  <link rel="icon" href="${rel('assets/img/favicon.svg')}" type="image/svg+xml">
  <link rel="preload" href="${rel(`assets/fonts/${fontPreload}.woff2`)}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${rel(`assets/fonts/${bodyPreload}.woff2`)}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${rel('css/tokens.css')}">
  <link rel="stylesheet" href="${rel('css/base.css')}">
  <link rel="stylesheet" href="${rel('css/components.css')}">
  <link rel="stylesheet" href="${rel('css/pages.css')}">
  <script>
    (function (d, w) {
      var h = d.documentElement;${
        isRoot
          ? `
      try { var l = localStorage.getItem('gu-lang'); if (l === 'ru' || l === 'en') { location.replace(l + '/' + location.hash); return; } } catch (e) {}`
          : ''
      }
      h.classList.remove('no-js'); h.classList.add('js');
      var still = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!still && 'IntersectionObserver' in w) {
        h.classList.add('motion');
        /* Fail-safe: if the module script never runs, reveal everything. */
        setTimeout(function () { if (!w.__guReady) h.classList.remove('motion'); }, 3500);
      }
      var q = location.search;
      if (/[?&]dev=1/.test(q) || (/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname) && !/[?&]dev=0/.test(q))) h.setAttribute('data-dev', '');
    })(document, window);
  </script>
  <script type="module" src="${rel('js/main.js')}"></script>
  <script type="application/ld+json">${jsonld}</script>
</head>`;
}

function langSwitch(p, where) {
  const { lang, kind, rel, d } = p;
  const items = LANGS.map((l) => {
    const current = l === lang ? ' aria-current="true"' : '';
    return `<li><a href="${rel(pagePath(kind, l))}" hreflang="${l}" lang="${l}" data-lang="${l}"${current} aria-label="${l.toUpperCase()} — ${LANG_NAMES[l]}">${l.toUpperCase()}</a></li>`;
  }).join('');
  return `<nav class="lang lang--${where}" aria-label="${esc(d.common.language)}"><ul class="lang__list">${items}</ul></nav>`;
}

function navLinks(p) {
  const { d, kind, rel, lang } = p;
  const prefix = kind === 'home' ? '' : rel(homePath(lang));
  return [
    ['categories', d.nav.products],
    ['industries', d.nav.industries],
    ['why', d.nav.why],
    ['process', d.nav.process],
    ['contact', d.nav.contact],
  ].map(([id, label]) => ({ href: `${prefix}#${id}`, label }));
}

function header(p) {
  const { d, rel, lang } = p;
  const links = navLinks(p)
    .map((l) => `<li><a class="nav__link" href="${l.href}">${esc(l.label)}</a></li>`)
    .join('\n          ');
  return `<body>
  <a class="skip-link" href="#main">${esc(d.common.skip)}</a>
  <header class="site-header" data-header>
    <div class="container site-header__inner">
      <a class="logo" href="${rel(homePath(lang))}" aria-label="${esc(d.common.homeLabel)}" data-placeholder-logo>
        ${LOGO_MARK}
        <span class="logo__word" aria-hidden="true">Gandash <span>Uniform</span></span>
      </a>
      <nav class="nav" id="site-nav" aria-label="${esc(d.common.mainNav)}">
        <ul class="nav__list">
          ${links}
        </ul>
        <a class="btn btn--primary nav__cta" href="${rel(quotePath(lang))}">${esc(d.common.requestQuote)}${ARROW_ICON}</a>
      </nav>
      <div class="site-header__actions">
        ${langSwitch(p, 'header')}
        <a class="btn btn--primary btn--sm site-header__cta" href="${rel(quotePath(lang))}">${esc(d.common.requestQuote)}</a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-menu-toggle data-label-open="${esc(d.common.menu)}" data-label-close="${esc(d.common.closeMenu)}">
          <span class="sr-only" data-menu-label>${esc(d.common.menu)}</span>
          <span class="menu-toggle__bars" aria-hidden="true"><span></span><span></span></span>
        </button>
      </div>
    </div>
  </header>`;
}

function contactList(p, cls = '') {
  const { d } = p;
  const tag = (t) => `<span class="ph-tag" data-placeholder>${esc(t)}</span>`;
  return `<dl class="contact-list ${cls}">
          <div><dt class="label">${esc(d.contact.addressLabel)}</dt><dd>${esc(d.common.location)}<br>${tag(d.contact.streetTag)}</dd></div>
          <div><dt class="label">${esc(d.contact.phoneLabel)}</dt><dd>${tag(d.contact.phoneTag)}</dd></div>
          <div><dt class="label">${esc(d.contact.emailLabel)}</dt><dd>${tag(d.contact.emailTag)}</dd></div>
          <div><dt class="label">${esc(d.contact.hoursLabel)}</dt><dd>${tag(d.contact.hoursTag)}</dd></div>
        </dl>`;
}

function footer(p) {
  const { d, rel, lang } = p;
  const links = navLinks(p)
    .map((l) => `<li><a href="${l.href}">${esc(l.label)}</a></li>`)
    .join('');
  return `
  <footer class="site-footer">
    <div class="container site-footer__grid">
      <div class="site-footer__brand">
        <a class="logo" href="${rel(homePath(lang))}" aria-label="${esc(d.common.homeLabel)}">
          ${LOGO_MARK}
          <span class="logo__word" aria-hidden="true">Gandash <span>Uniform</span></span>
        </a>
        <p class="site-footer__tagline">${esc(d.footer.tagline)}</p>
        <p class="site-footer__member">${esc(d.footer.member)}</p>
      </div>
      <nav class="site-footer__col" aria-label="${esc(d.footer.navTitle)}">
        <h2 class="label">${esc(d.footer.navTitle)}</h2>
        <ul>${links}<li><a href="${rel(quotePath(lang))}">${esc(d.common.requestQuote)}</a></li></ul>
      </nav>
      <div class="site-footer__col">
        <h2 class="label">${esc(d.footer.contactTitle)}</h2>
        <ul>
          <li>${esc(d.common.location)}</li>
          <li><span class="ph-tag" data-placeholder>${esc(d.contact.phoneTag)}</span></li>
          <li><span class="ph-tag" data-placeholder>${esc(d.contact.emailTag)}</span></li>
        </ul>
      </div>
      <div class="site-footer__col">
        <h2 class="label">${esc(d.footer.langTitle)}</h2>
        ${langSwitch(p, 'footer')}
      </div>
    </div>
    <div class="container site-footer__bottom">
      <p>© ${YEAR} <span lang="tk">${esc(config.legalName)}</span>. ${esc(d.footer.rights)}</p>
      <p class="label">${esc(d.common.location)}</p>
    </div>
  </footer>
  <p class="dev-badge" data-dev-badge hidden><strong data-dev-count>0</strong> ${esc(d.common.devBadge)}</p>
</body>
</html>
`;
}

const sectionHead = (s, { light = false, id = '' } = {}) => `<header class="section-head" data-reveal>
          <p class="label${light ? ' label--light' : ''} label--tick">${esc(s.label)}</p>
          <h2 class="h2"${id ? ` id="${id}"` : ''}>${esc(s.title)}</h2>
          ${s.intro ? `<p class="lead">${esc(s.intro)}</p>` : ''}
        </header>`;

const phImg = (label, ratio, extra = '') =>
  `<div class="ph-img ${extra}" style="--ratio:${ratio}" role="img" aria-label="${esc(label)}" data-placeholder><span class="ph-img__label">${esc(label)}</span></div>`;

/* ---------- Form partials ---------- */
function field(f, o) {
  const id = `${o.prefix}-${o.name}`;
  const req = o.required ? ' <span class="req" aria-hidden="true">*</span>' : ` <span class="opt">(${esc(f.optional)})</span>`;
  const describedBy = [`${id}-err`, o.hint ? `${id}-hint` : ''].filter(Boolean).join(' ');
  const common = `id="${id}" name="${o.name}"${o.required ? ' required' : ''} aria-describedby="${describedBy}"`;
  let control;
  if (o.type === 'select') {
    control = `<select ${common}>
              <option value="">${esc(f.select)}</option>
              ${o.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('\n              ')}
            </select>`;
  } else if (o.type === 'textarea') {
    control = `<textarea ${common} rows="${o.rows || 4}" maxlength="2000"></textarea>`;
  } else {
    control = `<input ${common} type="${o.type}"${o.autocomplete ? ` autocomplete="${o.autocomplete}"` : ''}${o.inputmode ? ` inputmode="${o.inputmode}"` : ''}${o.attrs ? ` ${o.attrs}` : ''}>`;
  }
  return `<div class="field${o.wide ? ' field--wide' : ''}" data-field>
            <label for="${id}">${esc(o.label)}${req}</label>
            ${control}
            ${o.hint ? `<p class="field__hint" id="${id}-hint">${esc(o.hint)}</p>` : ''}
            <p class="field__error" id="${id}-err" data-error hidden></p>
          </div>`;
}

function consentField(f, prefix) {
  const id = `${prefix}-consent`;
  return `<div class="field field--wide field--check" data-field>
            <label class="check" for="${id}">
              <input id="${id}" name="consent" type="checkbox" value="yes" required aria-describedby="${id}-err">
              <span class="check__box" aria-hidden="true"></span>
              <span>${esc(f.consent)} <span class="req" aria-hidden="true">*</span></span>
            </label>
            <p class="field__error" id="${id}-err" data-error hidden></p>
          </div>`;
}

const honeypot = (prefix) => `<div class="hp" aria-hidden="true">
            <label for="${prefix}-website">Website</label>
            <input id="${prefix}-website" name="website" type="text" tabindex="-1" autocomplete="off">
          </div>`;

function formShell(f, kind, inner, submitLabel) {
  const s = f.success;
  return `<div class="form-wrap" data-form-wrap>
        <form class="form" data-form="${kind}" method="post" action="#">
          <p class="form__note">${esc(f.requiredNote)}</p>
          <p class="form__alert" data-form-alert role="alert" tabindex="-1" hidden></p>
          ${inner}
          ${honeypot(kind)}
          <noscript><p class="form__alert">${esc(f.noscript)}</p></noscript>
          <div class="form__actions">
            <button class="btn btn--primary" type="submit" data-submit><span data-submit-label>${esc(submitLabel)}</span>${ARROW_ICON}</button>
          </div>
        </form>
        <div class="form-success" data-form-success tabindex="-1" hidden>
          <svg class="form-success__icon" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 4"/><path d="m14 25 7 7 13-15" fill="none" stroke="#FF5A1F" stroke-width="3.5"/></svg>
          <h3 class="h3" data-success-title>${esc(kind === 'quote' ? s.quoteTitle : s.contactTitle)}</h3>
          <p data-success-text>${esc(kind === 'quote' ? s.quoteText : s.contactText)}</p>
          <button class="btn btn--outline" type="button" data-form-reset>${esc(s.again)}</button>
        </div>
      </div>`;
}

/* ---------- HOME ---------- */
function home(p) {
  const { d, rel, lang } = p;
  const quote = rel(quotePath(lang));
  const f = d.form;

  const catCards = products.categories
    .map((id, i) => {
      const c = d.categories.items[id];
      return `<li>
            <a class="cat-card" href="${quote}?type=${id}">
              <span class="cat-card__num" aria-hidden="true">${pad2(i + 1)}</span>
              <h3 class="cat-card__name">${esc(c.name)}</h3>
              <p class="cat-card__desc">${esc(c.desc)}</p>
              <span class="cat-card__more">${esc(d.categories.cardCta)}${ARROW_ICON}</span>
            </a>
          </li>`;
    })
    .join('\n          ');

  const featured = products.products
    .filter((x) => x.featured)
    .map((x) => renderProductCard(x, { lang, dict: d, quoteUrl: quote, assetRoot: rel('') === './' ? '' : rel('') }))
    .join('\n');

  const contactForm = formShell(
    f,
    'contact',
    `<div class="form__grid">
          ${field(f, { prefix: 'c', name: 'name', label: f.name, type: 'text', required: true, autocomplete: 'name' })}
          ${field(f, { prefix: 'c', name: 'phone', label: f.phone, type: 'tel', required: true, autocomplete: 'tel', inputmode: 'tel' })}
          ${field(f, { prefix: 'c', name: 'email', label: f.email, type: 'email', autocomplete: 'email', wide: true })}
          ${field(f, { prefix: 'c', name: 'message', label: f.message, type: 'textarea', required: true, wide: true, rows: 4 })}
          ${consentField(f, 'c')}
          </div>`,
    f.submitContact
  );

  return `${head(p)}
${header(p)}
  <main id="main">

    <section class="hero" id="top">
      <div class="hero__bg" aria-hidden="true">
        <svg class="hero__thread" viewBox="0 0 1600 900" preserveAspectRatio="none" focusable="false">
          <path d="M-20 700C240 560 380 820 640 690S980 380 1180 470s300 60 460-120" fill="none" stroke="#FF5A1F" stroke-width="2" stroke-dasharray="10 9" vector-effect="non-scaling-stroke"/>
        </svg>
      </div>
      <div class="container hero__grid">
        <div class="hero__copy">
          <p class="label label--light label--tick hero__label">${esc(d.hero.label)}</p>
          <h1 class="hero__title" data-split>${words(d.hero.title)}</h1>
          <p class="hero__sub">${esc(d.hero.sub)}</p>
          <div class="hero__cta">
            <a class="btn btn--primary btn--lg" href="${quote}">${esc(d.hero.cta1)}${ARROW_ICON}</a>
            <a class="btn btn--ghost btn--lg" href="#categories">${esc(d.hero.cta2)}</a>
          </div>
        </div>
        <div class="hero__media">
          <div class="hero__ruler" aria-hidden="true"></div>
          <div class="hero__frame" data-parallax="0.08">
            ${phImg(d.hero.imgLabel, '4/5', 'ph-img--dark')}
          </div>
        </div>
      </div>
      <div class="container hero__foot">
        <p class="label label--light" lang="tk">${esc(d.hero.note)}</p>
        <a class="hero__scroll label label--light" href="#stats">${esc(d.hero.scroll)}<span class="hero__scroll-line" aria-hidden="true"></span></a>
      </div>
    </section>

    <section class="stats" id="stats" aria-label="${esc(d.stats.aria)}">
      <div class="container stats__grid">
        <div class="stat stat--count" data-reveal>
          <p class="stat__num"><span data-countup="100">100</span><span class="stat__plus">+</span></p>
          <p class="stat__text">${esc(d.stats.countLabel)}</p>
        </div>
        ${d.stats.facts
          .map(
            (x, i) => `<div class="stat" data-reveal style="--i:${i + 1}">
          <p class="label label--tick">${pad2(i + 1)}</p>
          <p class="stat__title">${esc(x.title)}</p>
          <p class="stat__text">${esc(x.text)}</p>
        </div>`
          )
          .join('\n        ')}
      </div>
    </section>

    <section class="section" id="categories" aria-labelledby="categories-title">
      <div class="container">
        ${sectionHead(d.categories, { id: 'categories-title' })}
        <ul class="cat-grid" data-reveal>
          ${catCards}
          <li class="cat-grid__tile">
            <div class="cat-tile">
              <h3 class="cat-tile__title">${esc(d.categories.tile.title)}</h3>
              <p>${esc(d.categories.tile.text)}</p>
              <a class="btn btn--primary" href="${quote}">${esc(d.categories.tile.cta)}${ARROW_ICON}</a>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section class="section section--charcoal" id="industries" aria-labelledby="industries-title">
      <div class="container industries">
        <div class="industries__intro">
          ${sectionHead(d.industries, { light: true, id: 'industries-title' })}
          <div class="industries__media" data-reveal>
            ${phImg(d.industries.imgLabel, '3/2', 'ph-img--dark')}
          </div>
        </div>
        <ul class="ind-list" data-reveal>
          ${d.industries.items
            .map(
              (x, i) => `<li class="ind-list__item">
            <span class="ind-list__num" aria-hidden="true">${pad2(i + 1)}</span>
            <h3 class="ind-list__name">${esc(x.name)}</h3>
            <p class="ind-list__desc">${esc(x.desc)}</p>
          </li>`
            )
            .join('\n          ')}
        </ul>
      </div>
    </section>

    <section class="section" id="why" aria-labelledby="why-title">
      <div class="container">
        ${sectionHead(d.why, { id: 'why-title' })}
        <ul class="why-grid" data-reveal>
          ${d.why.items
            .map(
              (x, i) => `<li class="why-card">
            <p class="why-card__num" aria-hidden="true">${pad2(i + 1)}</p>
            <h3 class="h3">${esc(x.title)}</h3>
            <p>${esc(x.text)}</p>
          </li>`
            )
            .join('\n          ')}
        </ul>
      </div>
    </section>

    <section class="section section--sand" id="featured" aria-labelledby="featured-title">
      <div class="container">
        ${sectionHead(d.featured, { id: 'featured-title' })}
        <ul class="prod-grid" data-products="featured" data-quote-url="${quote}" data-reveal>
${featured}
        </ul>
      </div>
    </section>

    <section class="section section--navy" id="process" aria-labelledby="process-title">
      <div class="container">
        ${sectionHead(d.process, { light: true, id: 'process-title' })}
        <ol class="steps" data-reveal>
          ${d.process.steps
            .map(
              (x, i) => `<li class="step">
            <p class="step__num" aria-hidden="true">${pad2(i + 1)}</p>
            <h3 class="h3">${esc(x.title)}</h3>
            <p>${esc(x.text)}</p>
          </li>`
            )
            .join('\n          ')}
        </ol>
      </div>
    </section>

    <section class="section" id="testimonials" aria-labelledby="testimonials-title">
      <div class="container testimonials">
        ${sectionHead(d.testimonials, { id: 'testimonials-title' })}
        <div class="testimonial-ph" data-reveal data-placeholder>
          <svg viewBox="0 0 48 36" width="48" height="36" aria-hidden="true" focusable="false"><path d="M0 36V20C0 8 6 1 18 0v8c-6 1-8 5-8 10h8v18Zm27 0V20C27 8 33 1 45 0v8c-6 1-8 5-8 10h8v18Z" fill="currentColor"/></svg>
          <p class="testimonial-ph__text">${esc(d.testimonials.text)}</p>
          <p class="ph-tag">${esc(d.testimonials.tag)}</p>
        </div>
      </div>
    </section>

    <section class="cta-band" aria-labelledby="cta-title">
      <div class="container cta-band__inner" data-reveal>
        <h2 class="cta-band__title" id="cta-title">${esc(d.cta.title)}</h2>
        <div class="cta-band__side">
          <p class="lead">${esc(d.cta.text)}</p>
          <a class="btn btn--primary btn--lg" href="${quote}">${esc(d.cta.button)}${ARROW_ICON}</a>
        </div>
      </div>
    </section>

    <section class="section" id="contact" aria-labelledby="contact-title">
      <div class="container contact">
        <div class="contact__info">
          ${sectionHead(d.contact, { id: 'contact-title' })}
          ${contactList(p)}
          <a class="link-arrow" href="${quote}">${esc(d.contact.quoteLink)}${ARROW_ICON}</a>
        </div>
        <div class="contact__form panel" data-reveal>
          <h3 class="h3 panel__title">${esc(d.contact.formTitle)}</h3>
          ${contactForm}
        </div>
      </div>
    </section>

  </main>
${footer(p)}`;
}

/* ---------- QUOTE ---------- */
function quote(p) {
  const { d, rel, lang } = p;
  const f = d.form;
  const q = d.quote;
  const industryOpts = Object.entries(f.industryOptions);
  const typeOpts = [...products.categories.map((id) => [id, d.categories.items[id].name]), ['other', f.typeOther]];
  const logoOpts = Object.entries(f.logoOptions)
    .map(
      ([v, l], i) => `<label class="radio" for="quote-logo-${v}">
                <input id="quote-logo-${v}" name="logo" type="radio" value="${v}"${i === 0 ? ' checked' : ''}>
                <span class="radio__dot" aria-hidden="true"></span>
                <span>${esc(l)}</span>
              </label>`
    )
    .join('\n              ');

  const inner = `<fieldset class="form__set">
            <legend class="form__legend"><span aria-hidden="true">01</span> ${esc(f.legends.company)}</legend>
            <div class="form__grid">
          ${field(f, { prefix: 'quote', name: 'company', label: f.company, type: 'text', required: true, autocomplete: 'organization' })}
          ${field(f, { prefix: 'quote', name: 'person', label: f.person, type: 'text', required: true, autocomplete: 'name' })}
          ${field(f, { prefix: 'quote', name: 'phone', label: f.phone, type: 'tel', required: true, autocomplete: 'tel', inputmode: 'tel' })}
          ${field(f, { prefix: 'quote', name: 'email', label: f.email, type: 'email', required: true, autocomplete: 'email' })}
            </div>
          </fieldset>
          <fieldset class="form__set">
            <legend class="form__legend"><span aria-hidden="true">02</span> ${esc(f.legends.order)}</legend>
            <div class="form__grid">
          ${field(f, { prefix: 'quote', name: 'industry', label: f.industry, type: 'select', required: true, options: industryOpts })}
          ${field(f, { prefix: 'quote', name: 'type', label: f.type, type: 'select', required: true, options: typeOpts })}
          ${field(f, { prefix: 'quote', name: 'quantity', label: f.quantity, type: 'number', required: true, inputmode: 'numeric', attrs: 'min="1" step="1"' })}
          ${field(f, { prefix: 'quote', name: 'date', label: f.date, type: 'date' })}
            </div>
          </fieldset>
          <fieldset class="form__set">
            <legend class="form__legend"><span aria-hidden="true">03</span> ${esc(f.legends.extra)}</legend>
            <div class="form__grid">
          <fieldset class="field field--wide radio-group">
            <legend>${esc(f.logo)}</legend>
            <div class="radio-group__items">
              ${logoOpts}
            </div>
          </fieldset>
          ${field(f, { prefix: 'quote', name: 'message', label: f.message, type: 'textarea', wide: true, rows: 5, hint: f.messageHint })}
          ${consentField(f, 'quote')}
            </div>
          </fieldset>`;

  return `${head(p)}
${header(p)}
  <main id="main">
    <section class="page-hero">
      <div class="container page-hero__inner">
        <p class="label label--light label--tick">${esc(q.label)}</p>
        <h1 class="h1" data-split>${words(q.title)}</h1>
        <p class="lead">${esc(q.intro)}</p>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container quote">
        <div class="quote__form panel">
          ${formShell(f, 'quote', inner, f.submitQuote)}
        </div>
        <aside class="quote__aside">
          <div class="aside-block">
            <h2 class="label label--tick">${esc(q.asideTitle)}</h2>
            <ol class="aside-steps">
              ${q.asideSteps.map((s, i) => `<li><span aria-hidden="true">${pad2(i + 1)}</span><p>${esc(s)}</p></li>`).join('\n              ')}
            </ol>
          </div>
          <div class="aside-block">
            <h2 class="label label--tick">${esc(q.prepTitle)}</h2>
            <ul class="aside-list">
              ${q.prepItems.map((s) => `<li>${esc(s)}</li>`).join('\n              ')}
            </ul>
          </div>
          <div class="aside-block">
            <h2 class="label label--tick">${esc(q.directTitle)}</h2>
            ${contactList(p, 'contact-list--compact')}
          </div>
          <a class="link-arrow link-arrow--back" href="${rel(homePath(lang))}">${ARROW_ICON}${esc(q.back)}</a>
        </aside>
      </div>
    </section>
  </main>
${footer(p)}`;
}

/* ---------- Write files ---------- */
async function out(path, content) {
  const file = join(ROOT, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
  console.log('  wrote', path, `(${(Buffer.byteLength(content) / 1024).toFixed(1)} KB)`);
}

const page = (kind, lang, dir, isRoot = false) => ({ kind, lang, d: dicts[lang], rel: makeRel(dir), isRoot });

console.log('Building pages…');
await out('index.html', home(page('home', config.defaultLang, '', true)));
for (const lang of LANGS) {
  await out(`${lang}/index.html`, home(page('home', lang, `${lang}/`)));
  await out(`${lang}/quote/index.html`, quote(page('quote', lang, `${lang}/quote/`)));
}

/* sitemap + robots */
const today = new Date().toISOString().slice(0, 10);
const sm = ['home', 'quote']
  .flatMap((kind) =>
    LANGS.map(
      (lang) => `  <url>
    <loc>${abs(pagePath(kind, lang))}</loc>
    <lastmod>${today}</lastmod>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(pagePath(kind, l))}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(pagePath(kind, config.defaultLang))}"/>
  </url>`
    )
  )
  .join('\n');
await out(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sm}
</urlset>
`
);
await out('robots.txt', `User-agent: *\nAllow: /\nDisallow: /styleguide/\nDisallow: /tools/\n\nSitemap: ${BASE}/sitemap.xml\n`);
console.log('Done.');
