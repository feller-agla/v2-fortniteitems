import { NextResponse } from 'next/server';

// Variables globales de cache très basiques pour le serveur Next.js
let shopCache = null;
let lastUpdate = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  try {
    const now = Date.now();
    
    // Si on a un cache et qu'il n'est pas expiré
    if (shopCache && lastUpdate && (now - lastUpdate < CACHE_TTL_MS)) {
      return NextResponse.json({ ...shopCache, source: 'cache_nextjs' });
    }

    // Sinon, on requête l'API originale (comme le faisait ton scraper Python)
    const response = await fetch("https://fortnite-api.com/v2/shop?language=fr", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // L'API key serait à rajouter si le client possède une clé autorisée (API V2)
        ...(process.env.FORTNITE_API_KEY ? { "Authorization": process.env.FORTNITE_API_KEY } : {})
      },
      // Pas de cache à ce niveau pour récupérer des données fraiches si notre TTL est passé
      cache: "no-store" 
    });

    if (!response.ok) {
      throw new Error(`Fortnite API erreur: ${response.status}`);
    }

    const data = await response.json();
    
    // On doit extraire les "entries" comme le faisait: fortnite_shop_scraper.py
    const entries = data.data.entries || [];
    const parsedItems = [];
    
    // On boucle sur toutes les "entries"
    entries.forEach(entry => {
      const finalPrice = entry.finalPrice || 0;
      const regularPrice = entry.regularPrice || 0;
      const brItems = entry.brItems || [];
      const cars = entry.cars || [];
      const section = entry.section?.name || 'Shop';
      
      // 1. Pack / Bundle (S'il y a un bundle ou plusieurs brItems)
      if (entry.bundle || brItems.length > 1) {
        const bundleName = entry.bundle?.name || brItems.map(i => i.name).join(' + ').slice(0, 30) + '...';
        const bundleImage = entry.bundle?.image || entry.newDisplayAsset?.renderImages?.[0]?.image || brItems[0]?.images?.featured || brItems[0]?.images?.icon || '/assets/1000vbucks.png';
        
        parsedItems.push({
          section,
          name: bundleName,
          type: "Pack",
          rarity: "Pack",
          vbucks: finalPrice,
          regular_price: regularPrice,
          id: entry.offerId || `pack-${bundleName.replace(/\s/g, '-')}`,
          image: bundleImage,
          is_bundle: true
        });
        return; // Fin du traitement pour cette entry
      }
      
      // 2. Objet Individuel
      if (brItems.length === 1) {
        const item = brItems[0];
        parsedItems.push({
          section,
          name: item.name || item.title || "Objet Fortnite",
          description: item.description || "",
          type: item.type?.displayValue || "Autres",
          rarity: { value: item.rarity?.value || "Common" },
          vbucks: finalPrice,
          regular_price: regularPrice,
          id: item.id,
          image: item.images?.featured || item.images?.icon || item.images?.smallIcon
        });
      }

      // 3. Voitures (Cars)
      if (cars.length > 0) {
        cars.forEach(car => {
           parsedItems.push({
             section,
             name: car.name || "Véhicule Fortnite",
             type: car.type?.displayValue || "Autres",
             rarity: { value: car.rarity?.value || "Common" },
             vbucks: finalPrice,
             regular_price: regularPrice,
             id: car.id || car.vehicleId,
             image: car.images?.small || car.images?.large
           });
        });
      }
    });

    // On prépare notre objet final (Similaire au rendu Python)
    const result = {
      status: "success",
      date: new Date().toISOString(),
      total_items: parsedItems.length,
      data: parsedItems
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
