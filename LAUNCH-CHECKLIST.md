# Launch checklist

## Content
- [ ] Every row in `PLACEHOLDERS.md` is resolved; `?dev=1` shows **0 placeholders** on all six pages
- [ ] Turkmen copy reviewed by a native speaker (`i18n/tk.json`, `data/products.json`)
- [ ] Russian copy reviewed by a native speaker (`i18n/ru.json`, `data/products.json`)
- [ ] `_comment` "NEEDS NATIVE REVIEW" notes removed after review
- [ ] Production-process steps confirmed by the factory
- [ ] Real photography in place (hero 4:5, industries 3:2, products 4:5) as WebP with `width`/`height`
- [ ] Final logo, favicon and share image supplied and swapped in
- [ ] Testimonials added only with written client permission — otherwise remove the section

## Configuration
- [ ] `site.config.json` → `baseUrl` set to the real domain, then `node tools/build.mjs`
- [ ] `js/form.js` → `FORM_CONFIG` set; a real test request received from **both** forms in **each** language
- [ ] If Telegram is used: bot token is behind a proxy endpoint, not in the browser
- [ ] Phone / email / address added to JSON-LD in `tools/build.mjs` → `head()`
- [ ] Privacy/consent wording approved; privacy page linked if required

## Technical
- [ ] HTTPS enabled; `http://` and non-canonical host redirect to the canonical URL
- [ ] Server sends gzip or Brotli for HTML/CSS/JS/JSON/SVG
- [ ] Long cache lifetime for `/assets/fonts/*` and images; short for HTML
- [ ] `404.html` wired as the host's not-found page
- [ ] `/styleguide/` removed or left blocked (it is `noindex` and disallowed in `robots.txt`)
- [ ] `sitemap.xml` and `robots.txt` show the real domain; sitemap submitted to Google Search Console and Yandex Webmaster
- [ ] Link preview checked (Telegram, WhatsApp, Facebook debugger)
- [ ] Structured data validated (Google Rich Results Test / validator.schema.org)

## QA
- [ ] 360 / 768 / 1280 / 1920 px checked in tk, ru and en — no horizontal scroll, no clipped text
- [ ] Keyboard only: skip link, menu (open, Esc closes), language switcher, both forms, visible focus everywhere
- [ ] Screen-reader pass on the quote form (labels, error announcements, success message)
- [ ] `prefers-reduced-motion`: no parallax, no reveals, all content visible
- [ ] JavaScript disabled: all content and navigation visible; forms show the notice
- [ ] Language choice remembered: pick RU, open `/` → lands on `/ru/`; pick TK → `/` stays
- [ ] Lighthouse (mobile) on the live URL: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- [ ] Tested in current Chrome, Safari (iOS), Firefox and Samsung Internet
