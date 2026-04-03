// Switch to Node.js runtime for more stability in admin tasks
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET() {
  try {
    const adminClient = supabaseAdmin();

    // 1. Get all profiles from public schema
    const { data: profiles, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    // 2. Get user metadata from auth schema (requires service role)
    const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers();
    
    if (authError) {
      console.warn('Auth users list error (might be permissions):', authError);
      // Fallback: return just profiles
      return NextResponse.json(profiles.map(p => ({
        ...p,
        email: '---',
        last_sign_in_at: null
      })));
    }

    // 3. Merge data
    const mergedUsers = profiles.map(profile => {
      const authUser = users.find(u => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || '---',
        last_sign_in_at: authUser?.last_sign_in_at || null,
        created_at: profile.created_at || authUser?.created_at
      };
    });

    return NextResponse.json(mergedUsers);
  } catch (err) {
    console.error('Users API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { userId, role } = await request.json();
    if (!userId || !role) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const adminClient = supabaseAdmin();
    const { error } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const adminClient = supabaseAdmin();
    
    // Delete from auth (cascades to profiles if FK set correctly)
    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
