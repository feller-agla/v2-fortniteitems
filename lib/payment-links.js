export const PAYMENT_LINKS = {
  // Petits cosmétiques
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
  
  // Skins et Pioches (Atypiques à Epiques)
  800: "https://votre-lien-de-paiement.com/prix800",
  1000: "https://votre-lien-de-paiement.com/prix1000",
  1100: "https://votre-lien-de-paiement.com/prix1100",
  1200: "https://votre-lien-de-paiement.com/prix1200",
  1300: "https://votre-lien-de-paiement.com/prix1300",
  1400: "https://votre-lien-de-paiement.com/prix1400",
  1500: "https://votre-lien-de-paiement.com/prix1500",
  1600: "https://votre-lien-de-paiement.com/prix1600",
  
  // Skins Légendaires et Packs moyens
  1800: "https://votre-lien-de-paiement.com/prix1800",
  2000: "https://votre-lien-de-paiement.com/prix2000",
  2200: "https://votre-lien-de-paiement.com/prix2200",
  2400: "https://votre-lien-de-paiement.com/prix2400",
  
  // Gros Bundles et Mega Packs
  2700: "https://votre-lien-de-paiement.com/prix2700",
  2800: "https://votre-lien-de-paiement.com/prix2800",
  3500: "https://votre-lien-de-paiement.com/prix3500",
  4200: "https://votre-lien-de-paiement.com/prix4200"
};

export const getPaymentLink = (vbucks) => {
    return PAYMENT_LINKS[vbucks] || `https://votre-lien-de-paiement.com/default?vbucks=${vbucks}`;
};
