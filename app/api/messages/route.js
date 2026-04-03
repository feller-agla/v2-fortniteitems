export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

/** Get user id from Authorization: Bearer <jwt> (decode payload only, no verify). */
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

/** Check if order belongs to user (customer_data.id) or user is admin. */
async function canAccessOrder(adminClient, orderId, userId) {
  const { data: order, error } = await adminClient
    .from('orders')
    .select('customer_data')
    .eq('id', orderId)
    .maybeSingle();
  if (error || !order) return false;
  const customerId = order.customer_data?.id ?? order.customer_data?.user_id;
  if (customerId === userId) return true;
  return await isAdmin(adminClient, userId);
}

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const admin = supabaseAdmin();
    const allowed = await canAccessOrder(admin, orderId, userId);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch messages
    const { data: messagesData, error: fetchError } = await admin
      .from('messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    // Mark admin messages as read if the user is fetching them
    // (Only if the user is not an admin themselves, or we can just mark all as read for this order visibility)
    if (userId) {
      await admin
        .from('messages')
        .update({ is_read: true })
        .eq('order_id', orderId)
        .eq('is_admin_sender', true)
        .eq('is_read', false);
    }

    const list = (messagesData ?? []).map((m) => ({ ...m, text: m.content ?? m.text ?? '' }));
    return NextResponse.json(list, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[API messages GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { orderId, text, isAdmin: isAdminFlag } = body;
    if (!orderId || !text) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const admin = supabaseAdmin();
    const allowed = await canAccessOrder(admin, orderId, userId);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const adminSender = await isAdmin(admin, userId);
    const isFromAdmin = adminSender === true || isAdminFlag === true;
    const payload = {
      order_id: orderId,
      sender_id: userId,
      content: String(text).trim(),
      sender_type: isFromAdmin ? 'admin' : 'user',
      is_admin_sender: isFromAdmin === true,
    };

    const { data, error } = await admin
      .from('messages')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[API messages POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
