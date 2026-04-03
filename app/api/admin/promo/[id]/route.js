import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

// PATCH update promo code
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { code, discount_percentage, is_active } = await request.json();
    
    const admin = supabaseAdmin();
    const updateData = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await admin
      .from('promo_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('Admin Promo Update Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE promo code
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const admin = supabaseAdmin();
    const { error } = await admin
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin Promo Delete Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
