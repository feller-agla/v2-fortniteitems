import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Verify OTP code
    const now = new Date().toISOString();
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', now)
      .maybeSingle();

    if (otpError) {
      console.error('OTP query error:', otpError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!otpData) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    const userId = otpData.user_id;

    // 2. Confirm email
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error('Email confirmation error:', confirmError);
      return NextResponse.json(
        { error: 'Failed to confirm email' },
        { status: 400 }
      );
    }

    // 3. Create/update profile with correct name
    const displayName = otpData.user_full_name || 'Joueur';

    console.log('[VERIFY-OTP] Creating profile with name:', displayName);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        name: displayName,
        email,
        role: 'user'
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // 4. Delete used OTP
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('id', otpData.id);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
