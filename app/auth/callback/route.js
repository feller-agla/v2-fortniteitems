export const runtime = 'edge';

import { NextResponse } from 'next/server';

// Le callback OAuth redirige directement vers la homepage.
// La session est gérée côté client par le SDK Supabase.
export async function GET(request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/', url.origin));
}
