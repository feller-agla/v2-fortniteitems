// Node.js runtime for heavy analytics
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

const DELIVERED_STATUSES = ['delivered', 'completed'];
const ACTIVE_STATUSES = ['pending', 'processing', 'shipping'];

function startOfCurrentMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function getPartnerGainForItem(item) {
  const vbucks = Number(item.vbucks) || 0;
  const lamasPrice = Number(item.price) || 0;
  const quantity = Number(item.quantity) || 1;

  let percentage = 0.05; // Palier 1 : 5%
  if (vbucks >= 1000 && vbucks <= 1499) {
    percentage = 0.07; // Palier 2 : 7%
  } else if (vbucks >= 1500) {
    percentage = 0.10; // Palier 3 : 10%
  }

  return lamasPrice * percentage * quantity;
}

function calculateOrderEarnings(order) {
  const items = order.items_data || [];
  let totalEarnings = 0;
  for (const item of items) {
    totalEarnings += getPartnerGainForItem(item);
  }
  return Math.round(totalEarnings);
}

export async function GET() {
  try {
    const adminClient = supabaseAdmin();
    const firstDayOfMonth = startOfCurrentMonthIso();

    const [
      { data: monthOrders, error: monthErr },
      { count: activeOrders, error: activeErr },
      { count: newProfilesCount, error: profilesErr },
    ] = await Promise.all([
      adminClient
        .from('orders')
        .select('amount, status, customer_data, items_data')
        .gte('created_at', firstDayOfMonth),
      adminClient
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ACTIVE_STATUSES),
      adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth),
    ]);

    if (monthErr) throw monthErr;
    if (activeErr) throw activeErr;

    const orders = monthOrders ?? [];
    const deliveredSet = new Set(DELIVERED_STATUSES);

    const monthlyRevenue = orders
      .filter((o) => deliveredSet.has(o.status))
      .reduce((sum, o) => {
        const promoCode = o.customer_data?.promoCode;
        const sonGain = promoCode ? calculateOrderEarnings(o) : 0;
        const monGain = Math.max(0, Number(o.amount || 0) - sonGain);
        return sum + monGain;
      }, 0);

    // Nouveaux comptes (profils) ce mois ; repli si la table profiles n’est pas dispo
    let newClients = typeof newProfilesCount === 'number' ? newProfilesCount : 0;
    if (profilesErr) {
      console.warn('[admin/stats] profiles count:', profilesErr.message);
      const fallbackIds = new Set(
        orders
          .map((o) => o.customer_data?.id || o.customer_data?.email)
          .filter(Boolean)
      );
      newClients = fallbackIds.size;
    }

    // Taux de « finalisation » du mois : livrées / commandes non annulées (pas de tracking visiteurs)
    const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
    const deliveredCount = orders.filter((o) => deliveredSet.has(o.status)).length;
    let conversionPct = 0;
    if (nonCancelled.length > 0) {
      conversionPct = Math.round((deliveredCount / nonCancelled.length) * 1000) / 10;
    }

    return NextResponse.json({
      success: true,
      stats: {
        monthlyRevenue: `${Math.round(monthlyRevenue).toLocaleString('fr-FR')} FCFA`,
        activeOrders: activeOrders ?? 0,
        newClients,
        conversionRate: `${conversionPct}%`,
      },
    });
  } catch (err) {
    console.error('Stats API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
