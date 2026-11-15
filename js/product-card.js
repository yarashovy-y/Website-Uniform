/**
 * Pure product-card renderer. Shared by the browser (js/products.js)
 * and by the static build (tools/build.mjs) so both produce identical markup.
 */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

export const ARROW_ICON =
  '<svg class="icon-arrow" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

/**
 * @param {object} product  item from /data/products.json
 * @param {object} ctx      { lang, dict, quoteUrl, assetRoot }
 */
export function renderProductCard(product, ctx) {
  const { lang, dict, quoteUrl, assetRoot = '' } = ctx;
  const name = product.name[lang] ?? product.name.en;
  const summary = product.summary[lang] ?? product.summary.en;
  const category = dict.categories.items[product.category]?.name ?? '';
  const imgLabel = `${dict.featured.imgPrefix} ${product.image.label[lang] ?? product.image.label.en}`;
  const href = `${quoteUrl}?type=${encodeURIComponent(product.category)}`;

  const media = product.image.src
    ? `<img class="prod-card__img" src="${esc(assetRoot + product.image.src)}" alt="${esc(name)}" width="${esc(product.image.width)}" height="${esc(product.image.height)}" loading="lazy" decoding="async">`
    : `<div class="ph-img" style="--ratio:${esc(product.image.ratio)}" role="img" aria-label="${esc(imgLabel)}" data-placeholder><span class="ph-img__label">${esc(imgLabel)}</span></div>`;

  const sample = product.placeholder
    ? `<span class="tag" data-placeholder>${esc(dict.featured.sample)}</span>`
    : '';

  return `<li class="prod-card">
  <article class="prod-card__inner">
    <div class="prod-card__media">${media}</div>
    <div class="prod-card__body">
      <p class="label prod-card__meta"><span>${esc(category)}</span>${sample}</p>
      <h3 class="prod-card__name">${esc(name)}</h3>
      <p class="prod-card__sum">${esc(summary)}</p>
      <a class="link-arrow prod-card__link" href="${esc(href)}">${esc(dict.featured.enquire)}${ARROW_ICON}</a>
    </div>
  </article>
</li>`;
}
