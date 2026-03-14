import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { v4 as uuidv4 } from 'uuid'; // Fallback for uuid generation

export async function POST(request) {
  try {
    const data = await request.json();
    const { amount, items, customer } = data;

    if (!amount || !items || !items.length) {
      return NextResponse.json({ success: false, error: 'Montant et articles requis' }, { status: 400 });
    }

    // 1. Initialiser le paiement Lygos
    const orderId = crypto.randomUUID ? crypto.randomUUID() : uuidv4();
    const itemsSummary = items.map(item => item.name).join(', ');
    const message = `Commande FortniteItems - ${itemsSummary}`;
    
    // Remplacer par l'URL Vercel une fois en ligne
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/orders?status=success&order_id=${orderId}`;
    const failureUrl = `${baseUrl}/cart?status=failed&order_id=${orderId}`;

    const lygosPayload = {
      amount: parseInt(amount),
      shop_name: process.env.SHOP_NAME || 'FortniteItems',
      message: message,
      success_url: successUrl,
      failure_url: failureUrl,
      order_id: orderId
    };

    // --- MOCK MODE HANDLING ---
    if (process.env.LYGOS_MOCK_MODE === 'true') {
      console.log('⚠️ [MOCK MODE] Simulating Lygos payment link');
      
      // Sauvegarder dans Supabase comme d'habitude
      const { error: dbError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          amount: parseInt(amount),
          status: 'pending',
          customer_data: customer || {},
          items_data: items,
          lygos_link: successUrl // En mode test, redirige directement vers le succès
        }]);

      if (dbError) {
        console.error('Supabase Error (Mock):', dbError);
        return NextResponse.json({ success: false, error: 'Erreur sauvegarde BDD' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        payment_link: successUrl,
        order_id: orderId,
        mock: true
      });
    }
    // -------------------------

    console.log('--- Lygos Payment Creation ---');
    console.log('URL:', process.env.LYGOS_API_URL || 'https://api.lygosapp.com/v1/gateway');
    console.log('Payload:', JSON.stringify(lygosPayload, null, 2));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    let lygosResponse;
    try {
      lygosResponse = await fetch(process.env.LYGOS_API_URL || 'https://api.lygosapp.com/v1/gateway', {
        method: 'POST',
        headers: {
          'api-key': process.env.LYGOS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lygosPayload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const msg = fetchErr.name === 'AbortError' ? 'Lygos API timeout (12s)' : `Lygos API connection error: ${fetchErr.message}`;
      console.error('Fetch Failed:', msg);
      return NextResponse.json({ success: false, error: msg }, { status: 504 });
    }
    clearTimeout(timeout);

    const lygosRawText = await lygosResponse.text();
    let lygosData;
    try {
      lygosData = JSON.parse(lygosRawText);
    } catch {
      console.error('Lygos returned non-JSON response:', lygosRawText.slice(0, 500));
      return NextResponse.json({ success: false, error: `Lygos API error: ${lygosResponse.status} - ${lygosRawText.slice(0, 200)}` }, { status: 502 });
    }

    if (!lygosResponse.ok || !lygosData.link) {
      console.error('Lygos Error:', lygosData);
      return NextResponse.json({ success: false, error: lygosData.message || lygosData.error || 'Erreur création paiement Lygos' }, { status: 400 });
    }

    // 2. Sauvegarder dans Supabase
    const { error: dbError } = await supabase
      .from('orders')
      .insert([
        {
          id: orderId,
          amount: parseInt(amount),
          status: 'pending',
          customer_data: customer || {},
          items_data: items,
          lygos_link: lygosData.link
        }
      ]);

    if (dbError) {
      console.error('Supabase Error:', dbError);
      return NextResponse.json({ success: false, error: 'Erreur sauvegarde BDD' }, { status: 500 });
    }

    // 3. Retourner le lien au client
    return NextResponse.json({
      success: true,
      payment_link: lygosData.link,
      order_id: orderId
    });

  } catch (error) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET() {
    // Route ADMIN pour lister toutes les commandes
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: 'Lecture impossible'}, { status: 500 });
    }
}
