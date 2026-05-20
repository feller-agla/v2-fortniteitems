export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getOtpEmailTemplate = (otp) => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #051024;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #ffffff;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 30px;
    background-color: #091C3E;
    text-align: center;
    border-top: 6px solid #FDE101;
  }
  .logo {
    font-size: 28px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 2px;
    margin-bottom: 30px;
    text-transform: uppercase;
  }
  .highlight {
    color: #FDE101;
  }
  .title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #ffffff;
  }
  .text {
    font-size: 16px;
    color: #a0aec0;
    line-height: 1.6;
    margin-bottom: 30px;
  }
  .otp-box {
    background-color: #051024;
    border: 2px dashed #00D4FF;
    border-radius: 12px;
    padding: 25px;
    margin: 30px auto;
    width: fit-content;
  }
  .otp-desc {
    color: #00D4FF;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 0;
    margin-bottom: 10px;
    font-weight: bold;
  }
  .otp-code {
    font-size: 46px;
    font-weight: bold;
    color: #ffffff;
    letter-spacing: 10px;
    margin: 0;
  }
  .footer {
    font-size: 12px;
    color: #4A5568;
    margin-top: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 20px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="logo">LAMA<span class="highlight">SHOP</span></div>

    <div class="title">Bienvenue dans la Team !</div>

    <div class="text">
      Salut joueur ! 💪<br><br>
      Plus qu'une seule étape pour activer ton compte et accéder aux meilleures offres V-Bucks.
    </div>

    <div class="otp-box">
      <p class="otp-desc">TON CODE SECRET</p>
      <p class="otp-code">${otp}</p>
    </div>

    <div class="text">
      Copie ce code à 6 chiffres dans la fenêtre de vérification sur notre site. Attention, il expire bientôt ! ⏳
    </div>

    <div class="footer">
      Si tu n'as pas créé de compte sur LamaShop, ignore simplement cet e-mail.<br>
      © 2026 LamaShop. Tous droits réservés.
    </div>
  </div>
</body>
</html>`;

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('[SIGNUP] Request body:', { email: body.email, name: body.name, password: '***' });

    const { email, password, name } = body;

    if (!email || !password || !name) {
      console.log('[SIGNUP] Missing fields');
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Check if user exists with unconfirmed email
    console.log('[SIGNUP] Checking existing users...');
    const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('[SIGNUP] ListUsers error:', listError);
      return NextResponse.json(
        { error: 'Failed to check existing users: ' + listError.message },
        { status: 500 }
      );
    }

    const existingUser = allUsers?.users?.find(u => u.email === email);
    console.log('[SIGNUP] Existing user:', existingUser?.id, 'confirmed:', existingUser?.email_confirmed_at);

    if (existingUser) {
      // Check if profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', existingUser.id)
        .maybeSingle();

      if (existingProfile) {
        // Profile exists - user already has full account
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      }

      // User exists but no profile - don't create profile yet, just send OTP
      console.log('[SIGNUP] User exists but no profile, sending OTP...');

      // Generate OTP for email confirmation
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await supabaseAdmin
        .from('otp_codes')
        .insert({
          email,
          code: otp,
          user_id: existingUser.id,
          user_full_name: name,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });

      // Send OTP email
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@lamashop.fr',
            to: email,
            subject: 'Votre code de vérification LamaShop - ' + otp,
            html: getOtpEmailTemplate(otp)
          })
        });
      } catch (emailErr) {
        console.error('[SIGNUP] Email error:', emailErr);
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent to email'
      });
    }

    // 3. Create user IMMEDIATELY (non-confirmed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Key: NOT confirmed yet
      user_metadata: { full_name: name }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 4. Generate OTP (6-digit code)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Store OTP (temp, 10 min expiry)
    const { error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        email,
        code: otp,
        user_id: userId,
        user_full_name: name,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

    if (otpError) {
      console.error('OTP storage error:', otpError);
    }

    // 6. Send OTP via email
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@lamashop.fr',
          to: email,
          subject: 'Votre code de vérification LamaShop - ' + otp,
          html: getOtpEmailTemplate(otp)
        })
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to email'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
