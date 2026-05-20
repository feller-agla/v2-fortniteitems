/**
 * Email notification helpers for the LamaShop messaging system.
 * Uses Resend (https://resend.com) to deliver transactional emails.
 *
 * All send functions are non-blocking (fire-and-forget) to avoid
 * delaying the chat message POST response.
 */

const RESEND_API = 'https://api.resend.com/emails';

/**
 * Low-level send via Resend REST API (edge-runtime compatible).
 */
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'no-reply@lamashop.store';

  if (!apiKey) {
    console.warn('[email-notifications] RESEND_API_KEY missing – skipping email');
    return;
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[email-notifications] Resend error:', res.status, body);
    }
  } catch (err) {
    console.error('[email-notifications] Fetch error:', err);
  }
}

// ─── HTML templates ──────────────────────────────────────────────────────────

function baseLayout(content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#051024; font-family:'Segoe UI',Arial,sans-serif; color:#fff; }
  .wrap { max-width:600px; margin:0 auto; padding:40px 30px; background:#091C3E; border-top:6px solid #FDE101; }
  .logo { font-size:28px; font-weight:900; letter-spacing:2px; text-transform:uppercase; margin-bottom:30px; text-align:center; color:#fff; }
  .logo span { color:#FDE101; }
  .title { font-size:22px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px; color:#fff; }
  .text  { font-size:15px; color:#a0aec0; line-height:1.7; margin-bottom:24px; }
  .msg-box { background:#051024; border:2px solid #1A3E7A; border-radius:12px; padding:20px 24px; margin:24px 0; }
  .msg-label { color:#00D4FF; font-size:11px; text-transform:uppercase; letter-spacing:2px; font-weight:bold; margin:0 0 8px; }
  .msg-text  { color:#fff; font-size:16px; line-height:1.6; margin:0; word-break:break-word; }
  .btn { display:inline-block; background:#FDE101; color:#091C3E; font-weight:900; font-size:14px; text-transform:uppercase; letter-spacing:1px; padding:14px 32px; border-radius:10px; text-decoration:none; margin-top:16px; }
  .footer { font-size:11px; color:#4A5568; margin-top:40px; border-top:1px solid rgba(255,255,255,.05); padding-top:20px; text-align:center; }
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">LAMA<span>SHOP</span></div>
  ${content}
  <div class="footer">
    Cet e-mail est envoyé automatiquement par LamaShop. Ne répondez pas directement à ce message.<br>
    &copy; 2026 LamaShop. Tous droits réservés.
  </div>
</div>
</body>
</html>`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Notify the **client** that the admin replied to their order chat.
 * @param {{ customerEmail: string, customerName: string, orderId: string, messageText: string, siteUrl?: string }} opts
 */
export function notifyClientNewMessage({ customerEmail, customerName, orderId, messageText, siteUrl }) {
  if (!customerEmail) return; // No email → nothing to do

  const base = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://lamashop.store';
  const orderLink = `${base}/messages`;

  const html = baseLayout(`
    <div class="title">Nouveau message sur votre commande 💬</div>
    <div class="text">
      Bonjour <strong>${escapeHtml(customerName || 'joueur')}</strong>,<br><br>
      L'équipe LamaShop vient de vous répondre concernant votre commande&nbsp;<strong>#${escapeHtml(orderId.slice(0, 8).toUpperCase())}</strong>.
    </div>
    <div class="msg-box">
      <p class="msg-label">Message de l'admin</p>
      <p class="msg-text">${escapeHtml(messageText)}</p>
    </div>
    <div style="text-align:center">
      <a class="btn" href="${escapeHtml(orderLink)}">VOIR LA CONVERSATION</a>
    </div>
  `);

  // Fire-and-forget
  sendEmail({
    to: customerEmail,
    subject: `💬 Nouveau message – Commande #${orderId.slice(0, 8).toUpperCase()} | LamaShop`,
    html,
  }).catch(() => {});
}

/**
 * Notify the **admin** that a client sent a new message.
 * @param {{ customerName: string, customerEmail: string, orderId: string, messageText: string, siteUrl?: string }} opts
 */
export function notifyAdminNewMessage({ customerName, customerEmail, orderId, messageText, siteUrl }) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.warn('[email-notifications] ADMIN_NOTIFICATION_EMAIL missing – skipping admin notification');
    return;
  }

  const base = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://lamashop.store';
  const chatLink = `${base}/admin/messages?orderId=${orderId}`;

  const html = baseLayout(`
    <div class="title">Nouveau message client 📩</div>
    <div class="text">
      <strong>${escapeHtml(customerName || 'Un client')}</strong>
      ${customerEmail ? `(<span style="color:#00D4FF">${escapeHtml(customerEmail)}</span>)` : ''}
      a envoyé un message concernant la commande&nbsp;<strong>#${escapeHtml(orderId.slice(0, 8).toUpperCase())}</strong>.
    </div>
    <div class="msg-box">
      <p class="msg-label">Message du client</p>
      <p class="msg-text">${escapeHtml(messageText)}</p>
    </div>
    <div style="text-align:center">
      <a class="btn" href="${escapeHtml(chatLink)}">RÉPONDRE DANS LE PANEL</a>
    </div>
  `);

  // Fire-and-forget
  sendEmail({
    to: adminEmail,
    subject: `📩 Message de ${customerName || 'un client'} – Commande #${orderId.slice(0, 8).toUpperCase()}`,
    html,
  }).catch(() => {});
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
