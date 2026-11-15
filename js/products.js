/**
 * Renders product cards from /data/products.json.
 * The same cards are pre-rendered in the HTML (no-JS / SEO fallback); when
 * the data loads, the list is re-rendered so the JSON stays the single
 * source of truth. On any failure the fallback simply stays in place.
 */
import { SITE_ROOT, lang, loadDict } from './i18n.js';
import { renderProductCard } from './product-card.js';

export async function initProducts() {
  const lists = document.querySelectorAll('[data-products]');
  if (!lists.length) return;
  try {
    const [dict, data] = await Promise.all([
      loadDict(),
      fetch(new URL('data/products.json', SITE_ROOT)).then((res) => {
        if (!res.ok) throw new Error(`products: ${res.status}`);
        return res.json();
      }),
    ]);
    lists.forEach((list) => {
      const mode = list.dataset.products;
      const items = data.products.filter((p) => (mode === 'featured' ? p.featured : true));
      if (!items.length) return;
      const html = items
        .map((p) =>
          renderProductCard(p, {
            lang,
            dict,
            quoteUrl: list.dataset.quoteUrl || '',
            assetRoot: SITE_ROOT.href,
          })
        )
        .join('');
      if (list.innerHTML.replace(/\s+/g, '') !== html.replace(/\s+/g, '')) list.innerHTML = html;
    });
  } catch (error) {
    console.warn('[products] keeping pre-rendered fallback:', error);
  }
}
