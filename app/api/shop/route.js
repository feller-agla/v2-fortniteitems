export const runtime = 'edge';
export const revalidate = 0; // Empêche Next.js de mettre en cache la route elle-même

import { NextResponse } from 'next/server';

// Variables globales de cache très basiques pour le serveur Next.js
let shopCache = null;
let lastUpdate = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  try {
    const now = Date.now();

    // 1. Vérification du cache (TTL = 15 minutes)
    if (shopCache && lastUpdate && (now - lastUpdate < CACHE_TTL_MS)) {
      console.log("[SHOP API] Retour du cache (Temps restant: %ds)", Math.round((CACHE_TTL_MS - (now - lastUpdate)) / 1000));
      return NextResponse.json(shopCache);
    }
    
    console.log("[SHOP API] Cache expiré ou vide. Récupération des données depuis l'API Fortnite...");
    
    // Fonction de calcul du prix "Plein" (Sans réduction, Style Fortnite Officiel)
    const calculateFullPrice = (vbucks) => {
      // Formule prix plein : environ 1000 V-Bucks = 8500 FCFA
      let priceFCFA = (vbucks * 7.3);
      return Math.ceil(priceFCFA / 500) * 500;
    };

    // Fonction de calcul du prix de vente réduit (Partenaire / actuel)
    const calculateCustomPrice = (vbucks, type) => {
      // Coût unitaire = 0,0038608€ par V-Bucks.
      const priceDollar = (vbucks * 5) + 500;
      const tauxDollarFCFA = 610; 
      let priceFCFA = (vbucks * 5.5);
      
      priceFCFA = Math.ceil(priceFCFA / 500) * 500;
      
      const t = (type || '').toLowerCase();
      let bonus = 0;
      if (t.includes('outfit') || t.includes('tenue') || t.includes('skin')) {
        bonus = 1000;
        priceFCFA += bonus;
      } else if (t.includes('emote') || t.includes('danse')) {
        bonus = 500;
        priceFCFA += bonus;
      }
      
      if (priceFCFA < 5001) {
        priceFCFA += 125;
      } else if (priceFCFA >= 5001 && priceFCFA < 10001) {
        priceFCFA += 225;
      }
      return priceFCFA;
    };

    const url = "https://fortnite-api.com/v2/shop?language=fr";
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      // Some providers block requests without a UA
      "User-Agent": "LamaShop/1.0 (Next.js server route)",
      ...(process.env.FORTNITE_API_KEY ? { "Authorization": process.env.FORTNITE_API_KEY } : {}),
    };

    // Sinon, on requête l'API originale (comme le faisait ton scraper Python)
    // Note: certains environnements locaux ont un store de certificats incomplet → UNABLE_TO_VERIFY_LEAF_SIGNATURE.
    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
      });
    } catch (err) {
      // undici/Node wraps TLS failures in a TypeError("fetch failed")
      // with the real error in `err.cause`.
      const code = err?.cause?.code || err?.code;
      const message = String(err?.cause?.message || err?.message || '');
      const isLeafSignatureError =
        code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
        message.toLowerCase().includes('unable to verify the first certificate');

      // Dev workaround: some local/WSL setups have incomplete CA store.
      // Enable automatically in dev; keep disabled in production.
      const allowInsecure =
        process.env.SHOP_TLS_INSECURE === 'true' || process.env.NODE_ENV !== 'production';

      if (allowInsecure && isLeafSignatureError) {
        // Dev-only workaround for local environments with broken CA store.
        // Do NOT enable in production.
        const previous = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        try {
          response = await fetch(url, {
            method: "GET",
            headers,
            cache: "no-store",
          });
        } finally {
          if (previous === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          else process.env.NODE_TLS_REJECT_UNAUTHORIZED = previous;
        }
      } else {
        throw err;
      }
    }

    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      const hint =
        response.status === 403 && !process.env.FORTNITE_API_KEY
          ? " (403: essaie d'ajouter FORTNITE_API_KEY dans .env.local / Vercel)"
          : "";
      throw new Error(`Fortnite API erreur: ${response.status}${hint}${raw ? ` - ${raw.slice(0, 200)}` : ''}`);
    }

    const data = await response.json();
    
    // On doit extraire les "entries" comme le faisait: fortnite_shop_scraper.py
    const entries = data.data.entries || [];
    const parsedItems = [];
    
      // On boucle sur toutes les "entries"
    entries.forEach(entry => {
      const vbucksPrice = entry.finalPrice || 0;
      const regularPrice = entry.regularPrice || 0;
      const brItems = entry.brItems || [];
      const cars = entry.cars || [];
      const section = entry.section?.name || 'Shop';
      
      // 1. Pack / Bundle (S'il y a un bundle ou plusieurs brItems)
      if (entry.bundle || brItems.length > 1) {
        const bundleName = entry.bundle?.name || brItems.map(i => i.name).join(' + ').slice(0, 30) + '...';
        const bundleImage = entry.bundle?.image || entry.newDisplayAsset?.renderImages?.[0]?.image || brItems[0]?.images?.featured || brItems[0]?.images?.icon || '/assets/1000vbucks.png';
        const calcPrice = calculateCustomPrice(vbucksPrice, "Pack");
        const fullPrice = calculateFullPrice(vbucksPrice);

        parsedItems.push({
          section,
          name: bundleName,
          type: "Pack",
          rarity: "Pack",
          vbucks: vbucksPrice,
          price: calcPrice,
          full_price: fullPrice,
          id: entry.offerId || `pack-${bundleName.replace(/\s/g, '-')}`,
          image: bundleImage,
          is_bundle: true
        });
        return; // Fin du traitement pour cette entry
      }
      
      // 2. Objet Individuel
      if (brItems.length === 1) {
        const item = brItems[0];
        const typeStr = item.type?.displayValue || item.type?.value || "Autres";
        const calcPrice = calculateCustomPrice(vbucksPrice, typeStr);
        const fullPrice = calculateFullPrice(vbucksPrice);

        parsedItems.push({
          section,
          name: item.name || item.title || "Objet Fortnite",
          description: item.description || "",
          type: item.type?.displayValue || "Autres",
          rarity: { value: item.rarity?.value || "Common" },
          vbucks: vbucksPrice,
          price: calcPrice,
          full_price: fullPrice,
          id: item.id,
          image: item.images?.featured || item.images?.icon || item.images?.smallIcon
        });
      }

      // 3. Voitures (Cars)
      if (cars.length > 0) {
        cars.forEach(car => {
           const typeStr = car.type?.displayValue || "Voiture";
           const calcPrice = calculateCustomPrice(vbucksPrice, typeStr);
           const fullPrice = calculateFullPrice(vbucksPrice);

           parsedItems.push({
             section,
             name: car.name || "Véhicule Fortnite",
             type: typeStr,
             rarity: { value: car.rarity?.value || "Common" },
             vbucks: vbucksPrice,
             price: calcPrice,
             full_price: fullPrice,
             id: car.id || car.vehicleId,
             image: car.images?.small || car.images?.large
           });
        });
      }
    });
    
    // ——— DÉDUPLICATION ———
    // Certains objets (ex: Roues, Voitures) peuvent apparaître en double avec le même ID
    const seenIds = new Set();
    const uniqueItems = parsedItems.filter(item => {
      if (!item.id || seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    // On prépare notre objet final (Similaire au rendu Python)
    const result = {
      status: "success",
      date: new Date().toISOString(),
      total_items: uniqueItems.length,
      data: uniqueItems
    };

    // Mise en cache
    shopCache = result;
    lastUpdate = now;

    return NextResponse.json(result);

  } catch (error) {
    console.error("Shop API Error:", error);
    
    // Fallback: si l'API est cassée mais qu'on a un cache expiré, renvoyer le cache.
    if (shopCache) {
      return NextResponse.json({ ...shopCache, source: 'cache_nextjs_stale', error: error.message });
    }

    return NextResponse.json({ status: "error", message: "Impossible de générer le shop." }, { status: 500 });
  }
}
