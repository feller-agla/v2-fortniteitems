import { NextResponse } from 'next/server';

export const runtime = 'edge';

let cosmeticsCache = null;
let lastUpdate = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "new"; // "new" par défaut pour les nouveautés, ou "all"

    const now = Date.now();

    // 1. Vérification du cache
    if (cosmeticsCache && cosmeticsCache.filter === filter && lastUpdate && (now - lastUpdate < CACHE_TTL_MS)) {
      return NextResponse.json(cosmeticsCache.data);
    }
    
    // Le endpoint /new retourne les objets de la dernière mise à jour. 
    // Le endpoint complet sans /new retourne +20 000 objets, on coupe donc si c'est "all"
    const apiUrl = filter === "all" 
        ? "https://fortnite-api.com/v2/cosmetics?language=fr" 
        : "https://fortnite-api.com/v2/cosmetics/new?language=fr";

    const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Fortnite API erreur: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    
    let items = [];
    if (filter === "new") {
        if (data.data && data.data.items) {
            items = Object.values(data.data.items).flat().filter(Boolean);
        }
    } else {
        if (data.data) {
            // L'API globale /v2/cosmetics retourne un objet avec des catégories (br, cars, lego...)
            items = Array.isArray(data.data) ? data.data : Object.values(data.data).flat().filter(Boolean);
        }
    }

    const parsedItems = items.map(item => {
        return {
            id: item.id,
            name: item.name || "Objet inconnu",
            description: item.description || "",
            type: item.type?.displayValue || "Autres",
            rarity: item.rarity?.value || "Common",
            image: item.images?.featured || item.images?.icon || item.images?.smallIcon || '/assets/1000vbucks.png',
            introduction: item.introduction?.text || "",
            set: item.set?.value || ""
        }
    });

    const result = {
        status: "success",
        total_items: parsedItems.length,
        filter: filter,
        data: parsedItems
    };

    cosmeticsCache = { data: result, filter };
    lastUpdate = now;

    return NextResponse.json(result);

  } catch (error) {
    console.error("Cosmetics API Error:", error);
    return NextResponse.json({ status: "error", message: "Impossible de charger les cosmétiques." }, { status: 500 });
  }
}
