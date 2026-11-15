/**
 * Forms: client-side validation + ONE configurable submit handler.
 * There is no fake backend — until a channel is configured below, the form
 * tells the visitor honestly that online submission is not connected.
 */
import { lang, loadDict, t } from './i18n.js';

/* ==========================================================================
   CONFIG — choose how requests are delivered.  [CLIENT TO PROVIDE]
   --------------------------------------------------------------------------
   provider: 'formspree' | 'telegram' | 'fallback'

   formspree  Create a form at https://formspree.io and paste its endpoint,
              e.g. 'https://formspree.io/f/abcdwxyz'.

   telegram   RECOMMENDED: set `proxyUrl` to your own small endpoint (Cloudflare
              Worker, Netlify/Vercel function…) that keeps the bot token secret
              and forwards { text, fields } to the Telegram Bot API.
              Direct mode (`botToken` + `chatId`, no proxyUrl) also works but
              exposes the token to every visitor — use it only with a bot that
              can do nothing except post into one private chat.

   fallback   No server at all: opens the visitor's own app with the request
              pre-filled. `channel: 'whatsapp'` needs `whatsapp` (international
              number, digits only); `channel: 'mailto'` needs `email`.
   ========================================================================== */
export const FORM_CONFIG = {
  provider: 'fallback',
  formspree: { endpoint: '' },
  telegram: { proxyUrl: '', botToken: '', chatId: '' },
  fallback: { channel: 'mailto', email: '', whatsapp: '' },
};

class NotConfiguredError extends Error {}

/* ---------- Validation ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,24}$/;

function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Returns an error key (form.errors.*) or '' when the control is valid. */
function validateControl(el) {
  const value = el.type === 'checkbox' ? '' : el.value.trim();
  if (el.type === 'checkbox') return el.required && !el.checked ? 'consent' : '';
  if (!value) {
    if (!el.required) return '';
    return el.tagName === 'SELECT' ? 'select' : 'required';
  }
  switch (el.type) {
    case 'email':
      return EMAIL_RE.test(value) ? '' : 'email';
    case 'tel':
      return PHONE_RE.test(value) && value.replace(/\D/g, '').length >= 7 ? '' : 'phone';
    case 'number':
      return /^\d+$/.test(value) && Number(value) >= 1 ? '' : 'quantity';
    case 'date':
      return value >= todayISO() ? '' : 'date';
    default:
      return '';
  }
}

function showError(el, message) {
  const field = el.closest('[data-field]');
  const box = field?.querySelector('[data-error]');
  if (!box) return;
  if (message) {
    el.setAttribute('aria-invalid', 'true');
    box.textContent = message;
    box.hidden = false;
  } else {
    el.removeAttribute('aria-invalid');
    box.textContent = '';
    box.hidden = true;
  }
}

/* ---------- Payload ---------- */
function controlLabel(form, el) {
  if (el.type === 'radio') return form.querySelector('.radio-group > legend')?.textContent.trim() ?? el.name;
  if (el.type === 'checkbox') return el.name;
  const label = form.querySelector(`label[for="${el.id}"]`);
  return (label?.firstChild?.textContent ?? el.name).trim();
}

function displayValue(el) {
  if (el.tagName === 'SELECT') return el.selectedOptions[0]?.textContent.trim() ?? '';
  if (el.type === 'radio') return el.closest('label')?.textContent.trim() ?? el.value;
  if (el.type === 'checkbox') return el.checked ? '✓' : '';
  return el.value.trim();
}

/** Collect { fields: {name: value}, lines: ["Label: value"] } from a form. */
function collect(form) {
  const fields = {};
  const lines = [];
  [...form.elements].forEach((el) => {
    if (!el.name || el.name === 'website' || el.type === 'submit') return;
    if (el.type === 'radio' && !el.checked) return;
    const value = displayValue(el);
    fields[el.name] = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' || el.type === 'radio' ? el.value : value;
    if (value && el.type !== 'checkbox') lines.push(`${controlLabel(form, el)}: ${value}`);
  });
  fields.language = lang;
  fields.page = location.href;
  return { fields, lines };
}

/* ---------- The single submit handler ---------- */
/**
 * @returns {Promise<'sent'|'handoff'>} 'sent' = delivered to a server,
 *          'handoff' = opened the visitor's mail/WhatsApp app with the text.
 */
export async function submitRequest({ subject, fields, lines }, config = FORM_CONFIG) {
  const text = `${subject}\n\n${lines.join('\n')}\n\n${fields.page}`;

  if (config.provider === 'formspree') {
    const { endpoint } = config.formspree;
    if (!endpoint) throw new NotConfiguredError('formspree.endpoint');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: subject, ...fields }),
    });
    if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
    return 'sent';
  }

  if (config.provider === 'telegram') {
    const { proxyUrl, botToken, chatId } = config.telegram;
    let res;
    if (proxyUrl) {
      res = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, subject, fields }),
      });
    } else if (botToken && chatId) {
      res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      });
    } else {
      throw new NotConfiguredError('telegram');
    }
    if (!res.ok) throw new Error(`Telegram responded ${res.status}`);
    return 'sent';
  }

  /* fallback: WhatsApp or mailto */
  const { channel, email, whatsapp } = config.fallback;
  if (channel === 'whatsapp' && whatsapp) {
    const url = `https://wa.me/${String(whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
    return 'handoff';
  }
  if (channel === 'mailto' && email) {
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    return 'handoff';
  }
  throw new NotConfiguredError('fallback');
}

/* ---------- Wiring ---------- */
function initForm(form, dict) {
  const kind = form.dataset.form; // 'quote' | 'contact'
  const wrap = form.closest('[data-form-wrap]');
  const alertBox = form.querySelector('[data-form-alert]');
  const success = wrap.querySelector('[data-form-success]');
  const submitBtn = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const idleLabel = submitLabel.textContent;
  const err = (key) => t(dict, `form.errors.${key}`);
  const controls = () => [...form.elements].filter((el) => el.closest('[data-field]') && el.name);

  form.noValidate = true; // we provide accessible, translated messages instead

  const dateInput = form.querySelector('input[type="date"]');
  if (dateInput) dateInput.min = todayISO();

  /* Pre-select the uniform type from ?type=… (links from category/product cards). */
  const typeSelect = form.querySelector('select[name="type"]');
  const wanted = new URLSearchParams(location.search).get('type');
  if (typeSelect && wanted && [...typeSelect.options].some((o) => o.value === wanted)) typeSelect.value = wanted;

  const check = (el) => {
    const key = validateControl(el);
    showError(el, key ? err(key) : '');
    return !key;
  };

  form.addEventListener('focusout', (event) => {
    if (event.target.closest?.('[data-field]') && event.target.name) check(event.target);
  });
  form.addEventListener('input', (event) => {
    if (event.target.getAttribute?.('aria-invalid') === 'true') check(event.target);
  });
  form.addEventListener('change', (event) => {
    if (event.target.getAttribute?.('aria-invalid') === 'true') check(event.target);
  });

  const setAlert = (message) => {
    alertBox.textContent = message;
    alertBox.hidden = !message;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setAlert('');

    const invalid = controls().filter((el) => !check(el));
    if (invalid.length) {
      setAlert(err('summary'));
      invalid[0].focus();
      return;
    }
    if (form.elements.website?.value) return; // honeypot: silently drop bots

    submitBtn.disabled = true;
    submitLabel.textContent = t(dict, 'form.sending');
    try {
      const subject = t(dict, kind === 'quote' ? 'form.subjectQuote' : 'form.subjectContact');
      const result = await submitRequest({ subject, ...collect(form) });
      const s = dict.form.success;
      success.querySelector('[data-success-title]').textContent =
        result === 'handoff' ? s.handoffTitle : kind === 'quote' ? s.quoteTitle : s.contactTitle;
      success.querySelector('[data-success-text]').textContent =
        result === 'handoff' ? s.handoffText : kind === 'quote' ? s.quoteText : s.contactText;
      form.hidden = true;
      success.hidden = false;
      success.focus();
      success.scrollIntoView({ block: 'nearest' });
    } catch (error) {
      console.warn('[form]', error);
      setAlert(err(error instanceof NotConfiguredError ? 'notConfigured' : 'send'));
      alertBox.focus();
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = idleLabel;
    }
  });

  wrap.querySelector('[data-form-reset]')?.addEventListener('click', () => {
    form.reset();
    controls().forEach((el) => showError(el, ''));
    success.hidden = true;
    form.hidden = false;
    form.querySelector('input:not([type="hidden"]), select, textarea')?.focus();
  });
}

export async function initForms() {
  const forms = document.querySelectorAll('form[data-form]');
  if (!forms.length) return;
  const dict = await loadDict();
  forms.forEach((form) => initForm(form, dict));
}
