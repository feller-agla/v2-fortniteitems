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
    console.warn('[payment-links] Fallback to hardcoded links:', err.message);
    return FALLBACK_LINKS;
  }
}

export async function GET(request) {
  try {
    const links = await loadLinks();
    const { searchParams } = new URL(request.url);
    const vbucks = searchParams.get('vbucks');

    if (vbucks) {
      const link = links[vbucks];
      if (link) {
        return NextResponse.json({ status: 'success', link });
      }
      return NextResponse.json({ status: 'error', message: 'No link found for this amount' }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', data: links });
  } catch (error) {
    console.error('Payment links API error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch payment links' },
      { status: 500 }
    );
  }
}
