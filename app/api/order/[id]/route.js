export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Si l'ID est invalide
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Tentative de recherche par UUID complet ou préfixe
    let query = supabase.from('orders').select('*');
    
    if (id.length === 8) {
      query = query.ilike('id', `${id}%`);
    } else {
      query = query.eq('id', id);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      console.log('Order error:', error);
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    return NextResponse.json(order);
    
  } catch (err) {
    console.error('API Error /api/order/[id]:', err);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}
