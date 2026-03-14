import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { orderId, text, isAdmin } = await request.json();
    if (!orderId || !text) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    // Try to get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const senderId = session?.user?.id;

    if (!senderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = {
      order_id: orderId,
      sender_id: senderId,
      text,
      is_admin_sender: !!isAdmin
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
