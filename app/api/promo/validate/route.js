import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();

    if (!code) {
      return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .select('code, is_active, discount_percentage')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Code invalide ou expiré' });
    }

    return NextResponse.json({ 
      valid: true, 
      code: data.code,
      discount: data.discount_percentage
    });
  } catch (err) {
    console.error('Validation Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
