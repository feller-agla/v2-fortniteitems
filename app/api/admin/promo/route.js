import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

// GET all promo codes (Admin)
export async function GET() {
  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('Admin Promo Fetch Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create a new promo code (Admin)
export async function POST(request) {
  try {
    const { code, discount_percentage = 0, is_active = true } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from('promo_codes')
      .insert([{ 
        code: code.toUpperCase(), 
        discount_percentage, 
        is_active 
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('Admin Promo Create Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
