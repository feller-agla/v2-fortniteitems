export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyPaydunyaHash } from '@/app/lib/paydunya';

/**
 * IPN PayDunya — application/x-www-form-urlencoded, clé "data" (JSON).
 * @see https://developers.paydunya.com/doc/EN/http_json
 */
async function parseIpnPayload(request) {
  const ct = request.headers.get('content-type') || '';

  if (ct.includes('application/json')) {
    const j = await request.json();
    return j.data ?? j;
  }

  const text = await request.text();
  if (!text) return null;

  try {
    const params = new URLSearchParams(text);
    const dataParam = params.get('data');
    if (dataParam) {
      const outer = JSON.parse(dataParam);
      return outer.data ?? outer;
    }
  } catch {
    // ignore
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const payload = await parseIpnPayload(request);
    if (!payload) {
      console.warn('[PayDunya IPN] Corps invalide ou vide');
      return new NextResponse('INVALID', { status: 400 });
    }

    const hash = payload.hash;
    const skipHash = process.env.PAYDUNYA_SKIP_IPN_HASH === 'true';
    if (hash && !skipHash && !verifyPaydunyaHash(hash)) {
      console.error('[PayDunya IPN] Hash invalide (mettre PAYDUNYA_SKIP_IPN_HASH=true uniquement en debug)');
      return new NextResponse('FORBIDDEN', { status: 403 });
    }
    if (!hash) {
      console.warn('[PayDunya IPN] Pas de hash dans la charge utile');
    }

    const status = (payload.status || '').toLowerCase();
    const custom = payload.custom_data || {};
    const orderId = custom.order_id;

    if (!orderId) {
      console.warn('[PayDunya IPN] Pas de order_id dans custom_data', payload);
      return new NextResponse('OK', { status: 200 });
    }

    if (status === 'completed') {
      const admin = supabaseAdmin();
      const { error } = await admin.from('orders').update({ status: 'processing' }).eq('id', orderId);

      if (error) {
        console.error('[PayDunya IPN] Mise à jour commande:', error);
        return new NextResponse('DB_ERROR', { status: 500 });
      }
      console.log('[PayDunya IPN] Commande', orderId, '→ processing');
    }

    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('[PayDunya IPN]', err);
    return new NextResponse('ERROR', { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook PayDunya (POST uniquement)',
    doc: 'https://developers.paydunya.com/doc/EN/http_json',
  });
}
