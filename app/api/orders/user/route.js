export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

/**
 * Verify JWT via Supabase auth.getUser() — returns userId or null.
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

export async function GET(request) {
  try {
    const userId = await getVerifiedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = supabaseAdmin();
    
    // Find all orders where user_id matches OR customer_data->>id matches
    const { data, error } = await admin
      .from('orders')
      .select('*')
      .or(`user_id.eq.${userId},customer_data->>id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API user orders GET] error:', error);
      throw error;
    }

    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[API user orders GET] Catch error:', err);
    return NextResponse.json({ error: 'Lecture impossible' }, { status: 500 });
  }
}
