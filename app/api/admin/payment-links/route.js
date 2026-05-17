import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'edge';

// Fallback links si la table n'existe pas encore
const FALLBACK_LINKS = {
  "800": "https://monniz.com/p/S19BibXe",
  "1000": "https://monniz.com/p/MAXD8fo0",
  "1200": "https://monniz.com/p/sHa2qRlq",
  "1500": "https://monniz.com/p/4vmSNBI2",
  "2400": "https://monniz.com/p/WAJUSKmd",
  "4200": "https://monniz.com/p/iRRipfeV",
};

/** Charge les liens depuis Supabase, fallback sur les constantes. */
async function loadLinks() {
  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from('payment_links')
      .select('vbucks_amount, url')
      .order('vbucks_amount', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return FALLBACK_LINKS;

    const links = {};
    data.forEach((row) => {
      links[String(row.vbucks_amount)] = row.url;
    });
    return links;
  } catch (err) {
    console.warn('[admin/payment-links] Fallback to hardcoded links:', err.message);
    return FALLBACK_LINKS;
  }
}

export async function GET() {
  try {
    const links = await loadLinks();
    return NextResponse.json({ status: 'success', data: links });
  } catch (error) {
    console.error('Payment links API error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch payment links' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { links } = body;

    if (!links || typeof links !== 'object') {
      return NextResponse.json(
        { status: 'error', message: 'Invalid links format' },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    // Supprimer tous les liens existants
    const { error: deleteError } = await admin
      .from('payment_links')
      .delete()
      .gte('vbucks_amount', 0); // delete all rows

    if (deleteError) {
      console.error('[admin/payment-links] Delete error:', deleteError);
      throw deleteError;
    }

    // Insérer les nouveaux liens
    const rows = Object.entries(links)
      .filter(([, url]) => url && typeof url === 'string' && url.startsWith('http'))
      .map(([vbucks, url]) => ({
        vbucks_amount: parseInt(vbucks, 10),
        url: url.trim(),
        updated_at: new Date().toISOString(),
      }));

    if (rows.length > 0) {
      const { error: insertError } = await admin
        .from('payment_links')
        .insert(rows);

      if (insertError) {
        console.error('[admin/payment-links] Insert error:', insertError);
        throw insertError;
      }
    }

    return NextResponse.json({
      status: 'success',
      message: `${rows.length} liens de paiement sauvegardés`,
      data: links
    });
  } catch (error) {
    console.error('Payment links API error:', error);
    return NextResponse.json(
      { status: 'error', message: `Erreur: ${error.message}` },
      { status: 500 }
    );
  }
}
