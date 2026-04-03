import { createHash } from 'crypto';

/** Sandbox vs production API base (path /v1/checkout-invoice/create is appended). */
export function getPaydunyaApiRoot() {
  const sandbox =
    process.env.PAYDUNYA_SANDBOX === 'true' ||
    process.env.PAYDUNYA_SANDBOX === '1' ||
    process.env.NODE_ENV !== 'production';
  // Allow forcing production with PAYDUNYA_SANDBOX=false even in dev
  if (process.env.PAYDUNYA_SANDBOX === 'false' || process.env.PAYDUNYA_SANDBOX === '0') {
    return 'https://app.paydunya.com/api';
  }
  return sandbox
    ? 'https://app.paydunya.com/sandbox-api'
    : 'https://app.paydunya.com/api';
}

export function getPaydunyaKeys() {
  const master = process.env.PAYDUNYA_MASTER_KEY;
  const priv = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  if (!master || !priv || !token) {
    throw new Error(
      'PayDunya: PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY et PAYDUNYA_TOKEN sont requis dans .env.local'
    );
  }
  return { master, privateKey: priv, token };
}

export function paydunyaRequestHeaders() {
  const { master, privateKey, token } = getPaydunyaKeys();
  return {
    'Content-Type': 'application/json',
    'PAYDUNYA-MASTER-KEY': master,
    'PAYDUNYA-PRIVATE-KEY': privateKey,
    'PAYDUNYA-TOKEN': token,
  };
}

/**
 * Vérifie le hash SHA-512 du Master Key (doc PayDunya).
 * @param {string} receivedHash
 */
export function verifyPaydunyaHash(receivedHash) {
  if (!receivedHash || typeof receivedHash !== 'string') return false;
  try {
    const { master } = getPaydunyaKeys();
    const expected = createHash('sha512').update(master, 'utf8').digest('hex');
    return expected === receivedHash;
  } catch {
    return false;
  }
}

/**
 * Construit le body JSON pour POST /v1/checkout-invoice/create
 */
export function buildCheckoutInvoiceBody({
  totalAmount,
  description,
  items,
  customer,
  orderId,
  baseUrl,
}) {
  const storeName = process.env.SHOP_NAME || process.env.PAYDUNYA_STORE_NAME || 'LamaShop';
  const itemsNode = {};
  (items || []).forEach((item, i) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unit = Math.round(Number(item.price) || 0);
    const totalPrice = Math.round(unit * qty);
    itemsNode[`item_${i}`] = {
      name: String(item.name || 'Article').slice(0, 200),
      quantity: qty,
      unit_price: String(unit),
      total_price: String(totalPrice),
      description: String(item.type || '').slice(0, 200),
    };
  });

  const fullName = customer
    ? [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() || customer.name
    : '';

  const callbackBase = baseUrl.replace(/\/$/, '');
  const callbackUrl = `${callbackBase}/api/webhooks/paydunya`;
  const returnUrl = `${callbackBase}/orders?status=success&order_id=${encodeURIComponent(orderId)}`;
  const cancelUrl = `${callbackBase}/cart?status=failed&order_id=${encodeURIComponent(orderId)}`;

  return {
    invoice: {
      total_amount: Math.round(Number(totalAmount)),
      description: String(description || 'Commande').slice(0, 500),
      ...(fullName || customer?.email || customer?.phone
        ? {
            customer: {
              ...(fullName ? { name: fullName.slice(0, 120) } : {}),
              ...(customer?.email ? { email: String(customer.email).slice(0, 120) } : {}),
              ...(customer?.phone ? { phone: String(customer.phone).slice(0, 20) } : {}),
            },
          }
        : {}),
      ...(Object.keys(itemsNode).length ? { items: itemsNode } : {}),
    },
    store: {
      name: storeName,
      website_url: callbackBase,
    },
    custom_data: {
      order_id: orderId,
    },
    actions: {
      cancel_url: cancelUrl,
      return_url: returnUrl,
      callback_url: callbackUrl,
    },
  };
}

/**
 * @returns {Promise<{ ok: boolean, paymentUrl?: string, token?: string, raw?: object, error?: string }>}
 */
export async function createPaydunyaCheckoutInvoice(body) {
  const root = getPaydunyaApiRoot();
  const url = `${root}/v1/checkout-invoice/create`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: paydunyaRequestHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        ok: false,
        error: `PayDunya réponse non-JSON (${res.status}): ${text.slice(0, 300)}`,
      };
    }

    if (data.response_code === '00' && data.response_text) {
      return {
        ok: true,
        paymentUrl: data.response_text,
        token: data.token,
        raw: data,
      };
    }

    return {
      ok: false,
      error: data.response_text || data.description || `PayDunya erreur code ${data.response_code}`,
      raw: data,
    };
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'PayDunya timeout (20s)' : e.message;
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}
