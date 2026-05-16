import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PAYMENT_LINKS_FILE = path.join(process.cwd(), 'data', 'payment-links.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(PAYMENT_LINKS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Get default payment links
function getDefaultPaymentLinks() {
  return {
    200: "https://votre-lien-de-paiement.com/prix200",
    250: "https://votre-lien-de-paiement.com/prix250",
    300: "https://votre-lien-de-paiement.com/prix300",
    350: "https://votre-lien-de-paiement.com/prix350",
    400: "https://votre-lien-de-paiement.com/prix400",
    450: "https://votre-lien-de-paiement.com/prix450",
    500: "https://votre-lien-de-paiement.com/prix500",
    600: "https://votre-lien-de-paiement.com/prix600",
    700: "https://votre-lien-de-paiement.com/prix700",
    750: "https://votre-lien-de-paiement.com/prix750",
    800: "https://votre-lien-de-paiement.com/prix800",
    1000: "https://votre-lien-de-paiement.com/prix1000",
    1100: "https://votre-lien-de-paiement.com/prix1100",
    1200: "https://votre-lien-de-paiement.com/prix1200",
    1300: "https://votre-lien-de-paiement.com/prix1300",
    1400: "https://votre-lien-de-paiement.com/prix1400",
    1500: "https://votre-lien-de-paiement.com/prix1500",
    1600: "https://votre-lien-de-paiement.com/prix1600",
    1800: "https://votre-lien-de-paiement.com/prix1800",
    2000: "https://votre-lien-de-paiement.com/prix2000",
    2200: "https://votre-lien-de-paiement.com/prix2200",
    2400: "https://votre-lien-de-paiement.com/prix2400",
    2700: "https://votre-lien-de-paiement.com/prix2700",
    2800: "https://votre-lien-de-paiement.com/prix2800",
    3500: "https://votre-lien-de-paiement.com/prix3500",
    4200: "https://votre-lien-de-paiement.com/prix4200"
  };
}

// Read payment links from file
function readPaymentLinks() {
  try {
    ensureDataDir();
    if (fs.existsSync(PAYMENT_LINKS_FILE)) {
      const data = fs.readFileSync(PAYMENT_LINKS_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return getDefaultPaymentLinks();
  } catch (err) {
    console.error('Error reading payment links:', err);
    return getDefaultPaymentLinks();
  }
}

// Write payment links to file
function writePaymentLinks(links) {
  try {
    ensureDataDir();
    fs.writeFileSync(PAYMENT_LINKS_FILE, JSON.stringify(links, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing payment links:', err);
    return false;
  }
}

export async function GET() {
  try {
    const links = readPaymentLinks();
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

    const success = writePaymentLinks(links);
    if (!success) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to save payment links' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Payment links updated',
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
