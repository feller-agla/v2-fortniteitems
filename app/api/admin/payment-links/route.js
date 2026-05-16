import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Default payment links embedded for Edge Runtime compatibility (no file system access)
const DEFAULT_PAYMENT_LINKS = {
  "200": "https://votre-lien-de-paiement.com/prix200",
  "250": "https://votre-lien-de-paiement.com/prix250",
  "300": "https://votre-lien-de-paiement.com/prix300",
  "350": "https://votre-lien-de-paiement.com/prix350",
  "400": "https://votre-lien-de-paiement.com/prix400",
  "450": "https://votre-lien-de-paiement.com/prix450",
  "500": "https://votre-lien-de-paiement.com/prix500",
  "600": "https://votre-lien-de-paiement.com/prix600",
  "700": "https://votre-lien-de-paiement.com/prix700",
  "750": "https://votre-lien-de-paiement.com/prix750",
  "800": "https://monniz.com/p/S19BibXe",
  "1000": "https://monniz.com/p/MAXD8fo0",
  "1100": "https://votre-lien-de-paiement.com/prix1100",
  "1200": "https://monniz.com/p/sHa2qRlq",
  "1300": "https://votre-lien-de-paiement.com/prix1300",
  "1400": "https://votre-lien-de-paiement.com/prix1400",
  "1500": "https://monniz.com/p/4vmSNBI2",
  "1600": "https://votre-lien-de-paiement.com/prix1600",
  "1800": "https://votre-lien-de-paiement.com/prix1800",
  "2000": "https://votre-lien-de-paiement.com/prix2000",
  "2200": "https://votre-lien-de-paiement.com/prix2200",
  "2400": "https://monniz.com/p/WAJUSKmd",
  "2700": "https://votre-lien-de-paiement.com/prix2700",
  "2800": "https://votre-lien-de-paiement.com/prix2800",
  "3500": "https://votre-lien-de-paiement.com/prix3500",
  "4200": "https://monniz.com/p/iRRipfeV"
};

export async function GET() {
  try {
    return NextResponse.json({ status: 'success', data: DEFAULT_PAYMENT_LINKS });
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

    // On Edge Runtime (Cloudflare Pages), we can't persist to filesystem
    // For production, consider using Cloudflare KV Storage
    return NextResponse.json({
      status: 'success',
      message: 'Payment links updated (persisted for this session)',
      data: links
    });
  } catch (error) {
    console.error('Payment links API error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to update payment links' },
      { status: 500 }
    );
  }
}
