import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET() {
  try {
    const adminClient = supabaseAdmin();

    // 1. Get Monthly Revenue (current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: monthlyOrders, error: revError } = await adminClient
      .from('orders')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', firstDayOfMonth);

    if (revError) throw revError;
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.amount, 0);

    // 2. Get Active Orders (not completed)
    const { count: activeOrders, error: activeError } = await adminClient
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'completed');

    if (activeError) throw activeError;

    // 3. Get New Clients (unique customers this month)
    // We can count unique user_id or unique customer names in orders
    const { data: uniqueCustomers, error: customerError } = await adminClient
      .from('orders')
      .select('customer_data')
      .gte('created_at', firstDayOfMonth);

    if (customerError) throw customerError;
    
    // Simple unique check based on phone or email in customer_data
    const uniqueIds = new Set(uniqueCustomers.map(c => c.customer_data?.phone || c.customer_data?.email).filter(Boolean));
    const newClients = uniqueIds.size;

    return NextResponse.json({
      success: true,
      stats: {
        monthlyRevenue: `${monthlyRevenue.toLocaleString()} FCFA`,
        activeOrders: activeOrders || 0,
        newClients: newClients || 0,
        conversionRate: "4.8%" // Placeholder until we have visit tracking
      }
    });

  } catch (err) {
    console.error('Stats API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
