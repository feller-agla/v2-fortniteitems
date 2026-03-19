import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

function getUserIdFromAuthorization(request) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  try {
    // Decode payload only (no signature verification)
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.sub || null;
  } catch {
    return null;
  }
}

function toCartItemRow(userId, item) {
  const productId = String(item.productId ?? item.id ?? '');
  if (!productId) throw new Error('Invalid product id');

  return {
    user_id: userId,
    product_id: productId,
    name: item.name ?? '',
    price: Number(item.price ?? 0),
    vbucks: Number(item.vbucks ?? 0),
    image: item.image ?? null,
    type: item.type ?? null,
    quantity: Number(item.quantity ?? 1),
  };
}

function computeTotals(items) {
  const totalItems = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const cartTotal = items.reduce((sum, item) => sum + (Number(item.price ?? 0) * (item.quantity ?? 0)), 0);
  return { totalItems, cartTotal };
}

export async function GET(request) {
  try {
    const userId = getUserIdFromAuthorization(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data ?? []).map((row) => ({
      id: row.product_id,
      productId: row.product_id,
      name: row.name,
      price: row.price,
      vbucks: row.vbucks,
      image: row.image,
      type: row.type,
      quantity: row.quantity,
    }));

    const totals = computeTotals(items);
    return NextResponse.json({ items, ...totals }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    console.error('[API cart GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromAuthorization(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action } = body ?? {};
    if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

    const admin = supabaseAdmin();

    if (action === 'clear') {
      const { error } = await admin.from('cart_items').delete().eq('user_id', userId);
      if (error) throw error;
    } else if (action === 'remove') {
      const { productId } = body;
      if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
      const { error } = await admin.from('cart_items').delete()
        .eq('user_id', userId)
        .eq('product_id', String(productId));
      if (error) throw error;
    } else if (action === 'update') {
      const { productId, quantity } = body;
      if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
      if (!quantity || Number(quantity) < 1) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });

      const { error } = await admin.from('cart_items')
        .update({ quantity: Number(quantity) })
        .eq('user_id', userId)
        .eq('product_id', String(productId));
      if (error) throw error;
    } else if (action === 'add') {
      const { productId, delta, product } = body;
      if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
      const quantityDelta = Number(delta ?? 1);
      if (!Number.isFinite(quantityDelta) || quantityDelta < 1) return NextResponse.json({ error: 'Invalid delta' }, { status: 400 });
      if (!product) return NextResponse.json({ error: 'Missing product' }, { status: 400 });

      const existing = await admin
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', String(productId))
        .maybeSingle();

      if (existing.error) throw existing.error;

      if (existing.data) {
        const newQty = Number(existing.data.quantity ?? 0) + quantityDelta;
        const { error } = await admin.from('cart_items')
          .update({ quantity: newQty })
          .eq('user_id', userId)
          .eq('product_id', String(productId));
        if (error) throw error;
      } else {
        const row = toCartItemRow(userId, { ...product, productId, quantity: quantityDelta });
        const { error } = await admin.from('cart_items').insert([row]);
        if (error) throw error;
      }
    } else if (action === 'replace') {
      const { items } = body;
      if (!Array.isArray(items)) return NextResponse.json({ error: 'Missing items array' }, { status: 400 });

      const { error: delErr } = await admin.from('cart_items').delete().eq('user_id', userId);
      if (delErr) throw delErr;

      const rows = items.map((it) => toCartItemRow(userId, it));
      if (rows.length > 0) {
        const { error: insErr } = await admin.from('cart_items').insert(rows);
        if (insErr) throw insErr;
      }
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Return updated cart
    const { data, error } = await admin
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const items = (data ?? []).map((row) => ({
      id: row.product_id,
      productId: row.product_id,
      name: row.name,
      price: row.price,
      vbucks: row.vbucks,
      image: row.image,
      type: row.type,
      quantity: row.quantity,
    }));

    const totals = computeTotals(items);
    return NextResponse.json({ items, ...totals }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    console.error('[API cart POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

