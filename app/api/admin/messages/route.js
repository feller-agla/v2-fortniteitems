import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { getCustomerDisplayName } from '@/app/lib/customer-display';

/** Get user id from Authorization: Bearer <jwt> */
function getUserIdFromRequest(request) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    );
    return decoded.sub || null;
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

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = supabaseAdmin();
    const isUserAdmin = await isAdmin(admin, userId);
    if (!isUserAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch all messages (or recent ones) to group them by conversation
    // We select order_id, content, created_at and join with orders for customer name
    const { data: messages, error } = await admin
      .from('messages')
      .select(`
        order_id,
        content,
        text,
        created_at,
        is_read,
        is_admin_sender,
        orders (
          id,
          customer_data
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by order_id to get conversations list
    const groups = {};
    messages.forEach(msg => {
      if (!groups[msg.order_id]) {
        groups[msg.order_id] = {
          orderId: msg.order_id,
          customerName: getCustomerDisplayName(msg.orders?.customer_data),
          lastMessage: msg.content ?? msg.text ?? '',
          time: msg.created_at,
          unreadCount: 0
        };
      }
      if (!msg.is_admin_sender && !msg.is_read) {
        groups[msg.order_id].unreadCount++;
      }
    });

    return NextResponse.json(Object.values(groups), {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (err) {
    console.error('[API admin messages GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
