# Gandash Uniform — website (Phase 1)

B2B website for **Ýörite Geýimler Dünýäsi** (brand: **Gandash Uniform**),
manufacturer of professional uniforms and workwear in Türkmenabat, Turkmenistan.

Static site: semantic HTML, modern CSS, vanilla ES modules. **No framework and
no build step is required to run or deploy it** — the HTML is committed.

Phase 1 contains the Home page and the Request a Quote page in Turkmen
(default), Russian and English.

## File tree

```
/
├── index.html                 Turkmen home at "/" (default language)
├── tk/index.html              Turkmen home (same content; canonical → "/")
├── tk/quote/index.html        Turkmen quote form
├── ru/index.html              Russian home
├── ru/quote/index.html        Russian quote form
├── en/index.html              English home
├── en/quote/index.html        English quote form
├── 404.html
├── styleguide/index.html      Internal design reference (noindex)
├── css/
│   ├── tokens.css             Design tokens + @font-face
│   ├── base.css               Reset, type scale, layout, motion primitives
│   ├── components.css         Header, nav, buttons, cards, forms, footer…
│   └── pages.css              Home sections + quote page
├── js/
│   ├── main.js                Entry point
│   ├── i18n.js                Language engine (dictionary loader, remembered choice)
│   ├── header.js              Sticky/hiding header, mobile menu
│   ├── motion.js              Headline reveal, section reveals, 100+ counter, parallax
│   ├── products.js            Renders cards from /data/products.json
│   ├── product-card.js        Card template shared by browser and build
│   └── form.js                Validation + the single configurable submit handler
├── i18n/tk.json  ru.json  en.json     All copy
├── data/products.json         Categories and products
├── assets/fonts/              Self-hosted Unbounded + Onest (subset, OFL)
├── assets/img/                logo.svg, favicon.svg, og-default.png
├── tools/build.mjs            OPTIONAL page generator (Node 18+, zero dependencies)
├── site.config.json           Domain and language settings
├── sitemap.xml  robots.txt
├── PLACEHOLDERS.md            Everything the client must provide
└── LAUNCH-CHECKLIST.md
```

## Run locally

ES modules and `fetch` need HTTP, so open the site through any static server
(not by double-clicking the file):

```bash
python3 -m http.server 8080      # or: npx serve .
# → http://localhost:8080/
```

On `localhost` the site runs in **dev mode**: every placeholder is outlined in
orange and counted in a badge. Use `?dev=0` to see the production look, or
`?dev=1` to force dev mode on a deployed copy.

## Edit content

1. Text lives in `i18n/tk.json`, `i18n/ru.json`, `i18n/en.json`; products in
   `data/products.json`; the domain in `site.config.json`.
2. Regenerate the pages:

   ```bash
   node tools/build.mjs
   ```

3. Commit the regenerated HTML together with your change.

The generator only stitches the JSON into the templates inside
`tools/build.mjs`, so the content is in the HTML for search engines and for
visitors without JavaScript. The browser also loads the same JSON for anything
rendered by JS (product cards, form messages).

## How to replace placeholders

Full list with file and key: **[PLACEHOLDERS.md](PLACEHOLDERS.md)**.

**Contact details** — replace the `[CLIENT TO PROVIDE: …]` strings under
`contact.*Tag` in all three language files, rebuild.

**Photos** — export WebP (plus a JPEG fallback if needed) into
`assets/img/`. For products, add the file to the product in
`data/products.json`:

```json
"image": { "src": "assets/img/products/medical-set.webp", "width": 800, "height": 1000,
           "ratio": "4/5", "label": { "en": "…", "ru": "…", "tk": "…" } }
```

and set `"placeholder": false`. For the hero and industries photos, replace the
`phImg(...)` call in `tools/build.mjs` with:

```html
<picture>
  <source srcset="…/hero-800.webp 800w, …/hero-1200.webp 1200w" type="image/webp" sizes="(min-width: 62rem) 33vw, 90vw">
  <img src="…/hero-800.jpg" alt="Tailor at a sewing machine" width="800" height="1000" decoding="async">
</picture>
```

Keep `width`/`height` (prevents layout shift). Add `loading="lazy"` to every
image except the hero, and `fetchpriority="high"` to the hero image.

**Logo** — replace `LOGO_MARK` (inline SVG) in `tools/build.mjs`,
`assets/img/logo.svg`, `assets/img/favicon.svg` and
`assets/img/og-default.png` (1200×630).

**Domain** — set `baseUrl` in `site.config.json`, rebuild. This updates
canonical/hreflang/Open Graph/JSON-LD URLs, `sitemap.xml` and `robots.txt`.

## Connect the forms

Open `js/form.js` and edit `FORM_CONFIG` (no rebuild needed):

| Provider | Setting | Notes |
|---|---|---|
| Formspree | `provider: 'formspree'`, `formspree.endpoint` | Simplest. Requests arrive by email. |
| Telegram | `provider: 'telegram'`, `telegram.proxyUrl` | Recommended form: a small serverless endpoint that holds the bot token and forwards `{ text, fields }` to the Bot API. |
| Telegram (direct) | `telegram.botToken` + `telegram.chatId` | Works without a server but **exposes the token to visitors**. Use only with a bot limited to one private chat. |
| Fallback | `provider: 'fallback'`, `fallback.channel: 'whatsapp' \| 'mailto'` + number/email | No server: opens the visitor's WhatsApp or mail app with the request pre-filled. |

Until one of these is set, submitting a valid form shows an honest "online
submission is not connected yet" message — there is no fake success.

## Languages

- URLs: `/` (Turkmen, default), `/tk/`, `/ru/`, `/en/`, and `/<lang>/quote/`.
- Each page sets `<html lang>`, `hreflang` alternates and `x-default`.
- The switcher (header and footer) stores the choice in `localStorage`
  (`gu-lang`). A returning visitor who chose RU or EN is forwarded from `/` to
  their language; choosing TK clears the forwarding.
- To add a language: add `i18n/<code>.json`, add the code to
  `site.config.json` → `languages` and to `SUPPORTED` in `js/i18n.js`, add its
  characters to the font subset, rebuild.

## Deploy

Upload the repository root as-is to any static host (Netlify, Cloudflare Pages,
Vercel, GitHub Pages, Nginx/Apache). No build command; publish directory `/`.

- All links and assets are **relative**, so the site also works from a
  sub-folder. The only exception is `404.html`, which uses root-absolute paths.
- Enable gzip/Brotli and HTTPS; set `404.html` as the not-found page.
- You may exclude `tools/`, `README.md`, `PLACEHOLDERS.md`,
  `LAUNCH-CHECKLIST.md` and `styleguide/` from the upload.

## Design system — "Precision Made for Work"

- **Colour:** navy `#0B1F3A`, charcoal `#1B1F24`, off-white `#F6F4EF`, warm gray
  `#E4E0D8`, industrial orange `#FF5A1F` (CTAs and key highlights only).
  Orange buttons carry navy text (5.3:1). Orange is never used for text on
  light surfaces — `--orange-ink #B23A0C` is used there instead.
- **Type:** Unbounded (display) + Onest (body), self-hosted variable fonts,
  subset to Basic Latin + Turkmen (ä ž ň ö ü ý ş ç) + Russian Cyrillic; glyph
  coverage verified for both. Scale: see `/styleguide/` and `css/tokens.css`.
- **Motifs (CSS/SVG only):** stitch lines, thread path, measurement ticks,
  12-column pattern grid, woven texture.
- **Motion:** CSS + IntersectionObserver, no libraries. Easing
  `cubic-bezier(.2,.7,.2,1)`, 300–700 ms. Disabled under
  `prefers-reduced-motion`. Content is visible without JavaScript.

Fonts are licensed under the SIL Open Font License 1.1 (texts in
`assets/fonts/`). To regenerate the subsets use `fonttools`
(`pyftsubset`) on the upstream variable fonts.

## Measured results (local, before real photos)

Lighthouse, mobile emulation, uncompressed local server:

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` (tk home) | 98 | 100 | 100 | 100 |
| `/en/` | 100 | 100 | 100 | 100 |
| `/ru/` | 97 | 100 | 100 | 100 |
| `/tk/quote/`, `/ru/quote/` | 100 | 100 | 100 | 100 |

Page weight incl. fonts: about 200 KB (tk/en) to 226 KB (ru), **uncompressed**.
Re-run Lighthouse on the live URL after adding photography.

## Phase 2 (not built yet)

Product catalogue and category pages, About/Production page, privacy page,
real photography, analytics.
