export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

// ——— Monniz Payment Links fallback (par montant de V-Bucks) ———
const FALLBACK_LINKS = {
  "800": "https://monniz.com/p/S19BibXe",
  "1000": "https://monniz.com/p/MAXD8fo0",
  "1200": "https://monniz.com/p/sHa2qRlq",
  "1500": "https://monniz.com/p/4vmSNBI2",
  "2400": "https://monniz.com/p/WAJUSKmd",
  "4200": "https://monniz.com/p/iRRipfeV",
};

/**
 * Load payment links from Supabase, fallback to hardcoded constants.
 */
async function loadPaymentLinks() {
  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from('payment_links')
      .select('vbucks_amount, url');

    if (error) throw error;
    if (!data || data.length === 0) return FALLBACK_LINKS;

    const links = {};
    data.forEach((row) => {
      links[String(row.vbucks_amount)] = row.url;
    });
    return links;
  } catch {
    return FALLBACK_LINKS;
  }
}

/**
 * Verify JWT via Supabase auth.getUser() — returns userId or null.
 */
async function getVerifiedUserId(request) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  try {
    const admin = supabaseAdmin();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

/** Check if user is admin via profiles table. */
async function isAdmin(adminClient, userId) {
  if (!userId) return false;
  const { data } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  return data?.role === 'admin';
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { amount, items, customer } = data;

    if (!amount || !items || !items.length) {
      return NextResponse.json({ success: false, error: 'Montant et articles requis' }, { status: 400 });
    }

    // Calculate total V-Bucks from items
    const totalVBucks = items.reduce((sum, item) => {
      return sum + ((item.vbucks || 0) * (item.quantity || 1));
    }, 0);

    // Find the Monniz payment link from Supabase
    const allLinks = await loadPaymentLinks();
    const paymentLink = allLinks[String(totalVBucks)] || null;

    if (!paymentLink) {
      return NextResponse.json({
        success: false,
        error: `Aucun lien de paiement disponible pour ${totalVBucks} V-Bucks. Contactez le support.`,
      }, { status: 400 });
    }

    const orderId = crypto.randomUUID();

    // Save order in Supabase
    const admin = supabaseAdmin();
    const { error: dbError } = await admin.from('orders').insert([{
      id: orderId,
      amount: parseInt(amount, 10),
      status: 'pending',
      customer_data: customer || {},
      items_data: items,
      lygos_link: paymentLink, // Monniz payment link (column kept for compatibility)
    }]);

    if (dbError) {
      console.error('Supabase Error:', dbError);
      return NextResponse.json({ success: false, error: 'Erreur sauvegarde BDD' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payment_link: paymentLink,
      order_id: orderId,
      provider: 'monniz',
    });

  } catch (error) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET(request) {
  // Route ADMIN pour lister toutes les commandes — requiert un admin authentifié
  try {
    const userId = await getVerifiedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const adminCheck = await isAdmin(admin, userId);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { data, error } = await admin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('[API orders GET]', err);
    return NextResponse.json({ error: 'Lecture impossible' }, { status: 500 });
  }
}
