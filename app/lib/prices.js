/**
 * Calcule le prix officiel simulé de Fortnite en FCFA en fonction du montant de V-Bucks,
 * en utilisant des paliers (multiplicateurs dégressifs) et un arrondi propre à 500 près.
 */
export function getOfficialPrice(vbucks) {
  if (!vbucks || vbucks <= 0) return 0;
  let rawPrice = 0;
  
  if (vbucks <= 500) {
    rawPrice = vbucks * 10;
  } else if (vbucks === 600) {
    rawPrice = 5000;
  } else if (500 < vbucks && vbucks <= 1000) {
    rawPrice = vbucks * 8;
  } else if (1000 < vbucks && vbucks <= 1500) {
    rawPrice = vbucks * 7.5;
  } else if (1500 < vbucks && vbucks <= 2000) {
    rawPrice = vbucks * 7;
  } else {
    rawPrice = vbucks * 6.5;
  }
  
  return Math.round(rawPrice / 500) * 500;
}

/**
 * Calcule le prix LamaShop réduit en FCFA en fonction du montant de V-Bucks.
 * Cette fonction réplique exactement la logique de calcul du backend.
 */
export function getLamaShopPrice(vbucks) {
  if (!vbucks || vbucks <= 0) return 0;
  let rawPrice = 0;
  
  if (vbucks <= 500) {
    rawPrice = vbucks * 6.5;
  } else if (vbucks === 600) {
    rawPrice = 3500;
  } else if (500 < vbucks && vbucks <= 1000) {
    rawPrice = vbucks * 5;
  } else if (1000 < vbucks && vbucks <= 1500) {
    rawPrice = vbucks * 4.6;
  } else if (1500 < vbucks && vbucks <= 2000) {
    rawPrice = vbucks * 4.25;
  } else {
    rawPrice = vbucks * 4;
  }
  
  return Math.round(rawPrice / 500) * 500;
}
