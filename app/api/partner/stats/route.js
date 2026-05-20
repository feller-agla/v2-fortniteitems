export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

/**
 * Verify JWT via Supabase auth.getUser() — returns user or null.
 */
async function getVerifiedUser(request) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  try {
    const admin = supabaseAdmin();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/** Check role from profiles table. */
async function getUserRole(adminClient, userId) {
  if (!userId) return 'user';
  const { data } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  return data?.role || 'user';
}

function getPartnerGainForItem(item) {
  const vbucks = Number(item.vbucks) || 0;
  const lamasPrice = Number(item.price) || 0;
  const quantity = Number(item.quantity) || 1;

  let percentage = 0.05; // Palier 1 : 0 - 999 V-Bucks -> 5%
  if (vbucks >= 1000 && vbucks <= 1499) {
    percentage = 0.07; // Palier 2 : 1000 - 1499 V-Bucks -> 7%
  } else if (vbucks >= 1500) {
    percentage = 0.10; // Palier 3 : 1500+ V-Bucks -> 10%
  }

  return lamasPrice * percentage * quantity;
}

function calculateOrderEarnings(order) {
  // Les gains ne sont comptabilisés que si la commande est validée (status === 'delivered')
  if (order.status !== 'delivered') return 0;

  const items = order.items_data || [];
  let totalEarnings = 0;
  for (const item of items) {
    totalEarnings += getPartnerGainForItem(item);
  }
  return Math.round(totalEarnings);
}

export async function GET(request) {
  try {
    // 1. Vérifier l'authentification
    const user = await getVerifiedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const role = await getUserRole(admin, user.id);

    // 2. Vérifier le rôle (partner ou admin)
    if (role !== 'partner' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — partner only' }, { status: 403 });
    }

    // 3. Récupérer les codes du partenaire
    let codesQuery = admin
      .from('promo_codes')
      .select('id, code, is_active, discount_percentage, created_at, partner_user_id');

    // Si c'est un partenaire, filtrer par son ID. Un admin voit tout.
    if (role === 'partner') {
      codesQuery = codesQuery.eq('partner_user_id', user.id);
    }

    const { data: codes, error: codesError } = await codesQuery;
    if (codesError) throw codesError;

    if (!codes || codes.length === 0) {
      return NextResponse.json({
        codes: [],
        stats: { totalUses: 0, totalRevenue: 0, activeCodesCount: 0 },
        recentOrders: [],
      });
    }

    // 4. Récupérer toutes les commandes
    const { data: allOrders, error: ordersError } = await admin
      .from('orders')
      .select('id, amount, status, created_at, customer_data, items_data')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // 5. Filtrer les commandes qui utilisent un des codes du partenaire
    const partnerCodeNames = codes.map(c => c.code.toUpperCase());
    const matchingOrders = (allOrders || []).filter(order => {
      const usedCode = order.customer_data?.promoCode;
      return usedCode && partnerCodeNames.includes(usedCode.toUpperCase());
    });

    // 6. Calculer les stats par code
    const codeStats = codes.map(code => {
      const ordersForCode = matchingOrders.filter(
        o => o.customer_data?.promoCode?.toUpperCase() === code.code.toUpperCase()
      );
      return {
        ...code,
        uses: ordersForCode.length,
        revenue: ordersForCode.reduce((sum, o) => sum + calculateOrderEarnings(o), 0),
      };
    });

    // 7. Stats globales
    const totalUses = codeStats.reduce((sum, c) => sum + c.uses, 0);
    const totalRevenue = codeStats.reduce((sum, c) => sum + c.revenue, 0);
    const activeCodesCount = codes.filter(c => c.is_active).length;

    // 8. Les 20 dernières commandes — SANS données personnelles du client
    const recentOrders = matchingOrders.slice(0, 20).map(o => ({
      id: o.id,
      amount: o.amount,
      status: o.status,
      created_at: o.created_at,
      promoCode: o.customer_data?.promoCode || '',
      itemsCount: o.items_data?.length || 0,
    }));

    return NextResponse.json({
      codes: codeStats,
      stats: { totalUses, totalRevenue, activeCodesCount },
      recentOrders,
    });
  } catch (err) {
    console.error('[Partner Stats Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
