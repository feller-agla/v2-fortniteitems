export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { notifyClientNewMessage, notifyAdminNewMessage } from '@/app/lib/email-notifications';

/**
 * Verify JWT via Supabase auth.getUser() — returns userId or null.
 * This actually validates the token signature server-side (not just decode).
 */
async function getVerifiedUserId(request) {
  const auth = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!auth) {
    console.warn('[getVerifiedUserId] Missing Authorization header');
    return null;
  }
  if (!auth.startsWith('Bearer ')) {
    console.warn('[getVerifiedUserId] Authorization header does not start with Bearer');
    return null;
  }
  const token = auth.slice(7).trim();
  if (!token) {
    console.warn('[getVerifiedUserId] Empty token in Authorization header');
    return null;
  }

  try {
    const admin = supabaseAdmin();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error) {
      console.error('[getVerifiedUserId] admin.auth.getUser error:', error);
      return null;
    }
    if (!user) {
      console.warn('[getVerifiedUserId] No user returned by admin.auth.getUser');
      return null;
    }
    return user.id;
  } catch (err) {
    console.error('[getVerifiedUserId] Exception caught during validation:', err);
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

/** Check if order belongs to user or user is admin. */
async function canAccessOrder(adminClient, orderId, userId) {
  const { data: order, error } = await adminClient
    .from('orders')
    .select('customer_data, user_id')
    .eq('id', orderId)
    .maybeSingle();
  if (error || !order) return false;
  const customerId = order.user_id ?? order.customer_data?.id ?? order.customer_data?.user_id;
  if (customerId === userId) return true;
  return await isAdmin(adminClient, userId);
}

export async function GET(request) {
  try {
    const userId = await getVerifiedUserId(request);
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
    const userId = await getVerifiedUserId(request);
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

    // ── Email notification (fire-and-forget, never blocks the response) ──
    try {
      // Fetch order info to get the customer email / name
      const { data: order } = await admin
        .from('orders')
        .select('customer_data, user_id')
        .eq('id', orderId)
        .maybeSingle();

      const customerEmail = order?.customer_data?.email || null;
      const customerName  = order?.customer_data?.firstName
        ? `${order.customer_data.firstName} ${order.customer_data.lastName || ''}`.trim()
        : order?.customer_data?.epicUsername || 'Joueur';
      const messageText = String(text).trim();

      if (isFromAdmin && customerEmail) {
        // Admin wrote → notify the client
        notifyClientNewMessage({ customerEmail, customerName, orderId, messageText });
      } else if (!isFromAdmin) {
        // Client wrote → notify the admin
        notifyAdminNewMessage({ customerName, customerEmail: customerEmail || '', orderId, messageText });
      }
    } catch (notifErr) {
      // Non-blocking: never fail the request because of email
      console.warn('[API messages POST] Email notification error (non-blocking):', notifErr);
    }

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
