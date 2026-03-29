export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Tentative de recherche par UUID complet ou préfixe de 8 caractères
    let query = supabase.from('orders').select('*');
    
    if (id.length === 8) {
      // Recherche floue par préfixe si l'ID fait 8 caractères
      query = query.ilike('id', `${id}%`);
    } else {
      // Recherche exacte si l'ID semble complet
      query = query.eq('id', id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
