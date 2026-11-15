# Placeholders — everything the client must provide

Nothing on this site is invented. Wherever a fact, photo or contact detail is
not yet known, the page shows a visible `[CLIENT TO PROVIDE …]` tag or a
labelled placeholder image.

**Dev mode** — open any page on `localhost` (or add `?dev=1` to a URL) and every
placeholder gets an orange dashed outline, plus a counter badge in the
bottom-left corner. Add `?dev=0` to switch it off locally.

> The HTML pages (`/index.html`, `/tk/`, `/ru/`, `/en/` and their `/quote/`
> pages) are **generated** from the source files below. Edit the source, then
> run `node tools/build.mjs`. Do not hand-edit the generated HTML.

## 1. Contact details

| # | Placeholder | Source file → key | Where it appears |
|---|---|---|---|
| 1 | Street address | `i18n/{tk,ru,en}.json` → `contact.streetTag` | Home → Contact section; Quote page → "Prefer to talk?" |
| 2 | Phone number | `i18n/{tk,ru,en}.json` → `contact.phoneTag` | Home → Contact; Quote page aside; footer of every page |
| 3 | Email address | `i18n/{tk,ru,en}.json` → `contact.emailTag` | Home → Contact; Quote page aside; footer of every page |
| 4 | Working hours | `i18n/{tk,ru,en}.json` → `contact.hoursTag` | Home → Contact; Quote page aside |

When the real values are known, replace the tag text with the value in all
three language files. To turn phone/email into links and drop the placeholder
styling, edit `contactList()` and `footer()` in `tools/build.mjs`
(replace the `<span class="ph-tag" data-placeholder>` wrapper with
`<a href="tel:…">` / `<a href="mailto:…">`).

## 2. Photography (local placeholder boxes, no external images)

| # | Placeholder | Ratio | Source file → key | Where it appears |
|---|---|---|---|---|
| 5 | Tailor at sewing machine | 4:5 | `i18n/*.json` → `hero.imgLabel`; markup in `tools/build.mjs` → `home()` → `.hero__frame` | Home hero |
| 6 | Staff in uniform at their workplace | 3:2 | `i18n/*.json` → `industries.imgLabel`; markup in `tools/build.mjs` → `home()` → `.industries__media` | Home → Industries |
| 7–12 | Six product photos | 4:5 | `data/products.json` → `products[].image` | Home → Featured products |

## 3. Products

| # | Placeholder | Source file → key | Where it appears |
|---|---|---|---|
| 13 | Six sample products: names, summaries (3 languages) — to be confirmed or replaced with real models | `data/products.json` → `products[].name`, `.summary`, `"placeholder": true` | Home → Featured products ("Sample item" tag) |
| 14 | Article numbers / SKUs | `data/products.json` → `products[].sku` (currently `null`, not displayed) | — |
| 15 | Notice that the items are samples | `i18n/*.json` → `featured.intro`, `featured.sample` | Home → Featured products intro and card tag |

## 4. Testimonials

| # | Placeholder | Source file → key | Where it appears |
|---|---|---|---|
| 16 | Approved client testimonials (text, name, role, company — with written permission) | `i18n/*.json` → `testimonials.text`, `testimonials.tag`; markup in `tools/build.mjs` → `home()` → `.testimonial-ph` | Home → Client feedback |

## 5. Brand assets

| # | Placeholder | Source file | Where it appears |
|---|---|---|---|
| 17 | Logo — the "G + stitch" mark and wordmark are a typographic stand-in | `tools/build.mjs` → `LOGO_MARK` (inline SVG) and `.logo__word`; `assets/img/logo.svg` | Header and footer of every page; JSON-LD `logo` |
| 18 | Favicon (derived from the stand-in mark) | `assets/img/favicon.svg` | Browser tab |
| 19 | Social share image (derived from the stand-in wordmark) | `assets/img/og-default.png` (1200×630) | Open Graph / link previews |

## 6. Technical settings

| # | Placeholder | Source file → key | Affects |
|---|---|---|---|
| 20 | Production domain (currently `https://www.example.com`) | `site.config.json` → `baseUrl` | canonical + hreflang links, Open Graph URLs, JSON-LD, `sitemap.xml`, `robots.txt` |
| 21 | Form delivery channel (Telegram bot, Formspree endpoint, or WhatsApp/email fallback) | `js/form.js` → `FORM_CONFIG` | Both forms. Until set, submitting shows the message in `i18n/*.json` → `form.errors.notConfigured` |
| 22 | Structured-data contact fields (`telephone`, `email`, `streetAddress`, `postalCode`, `openingHours`, `sameAs` social links) — deliberately omitted | `tools/build.mjs` → `head()` → `org` / `biz` objects | JSON-LD on every page |

## 7. Copy that needs confirmation (not placeholders, but not verified facts either)

| # | Item | Source file → key |
|---|---|---|
| 23 | **All Turkmen and Russian text needs native review** (flagged in each file's `_comment`) | `i18n/tk.json`, `i18n/ru.json`, tk/ru strings in `data/products.json` |
| 24 | The eight production-process steps describe a typical custom-uniform workflow — confirm they match the factory's real process (especially the "Sample" and "Approval" steps) | `i18n/*.json` → `process.steps` |
| 25 | Garment examples named in category descriptions (e.g. coats, scrub sets, aprons, headwear) | `i18n/*.json` → `categories.items.*.desc` |
| 26 | Industries list and sub-descriptions | `i18n/*.json` → `industries.items` |
| 27 | Consent sentence under the forms — have it checked against local data-protection requirements; add a privacy-policy page/link if required | `i18n/*.json` → `form.consent` |
| 28 | Hero CTA "Bahalandyrma sorap" was supplied by the client and used verbatim (also in header and CTA band) | `i18n/tk.json` → `hero.cta1`, `common.requestQuote` |

## Facts used on the site (all from the client brief)

100+ types of workwear · started with medical clothing, expanded into
corporate, industrial, service and sportswear · modern sewing equipment ·
member of the Union of Industrialists and Entrepreneurs of Turkmenistan ·
custom production · located in Türkmenabat, Lebap velayat · focus on comfort,
protection, functionality, durability and professional appearance.

No certifications, awards, client names, prices, delivery times, statistics,
addresses, phone numbers or testimonials have been added.
