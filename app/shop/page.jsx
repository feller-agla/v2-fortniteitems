"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ShopItem } from "../components/ShopItem";

export default function ShopPage() {
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterRarity, setFilterRarity] = useState("ALL");
  const [filterVBucks, setFilterVBucks] = useState("ALL");
  
  const VBUCK_RANGES = [
    { label: "TOUS LES PRIX", value: "ALL" },
    { label: "0 - 500 V-BUCKS", value: "0-500" },
    { label: "501 - 1000 V-BUCKS", value: "501-1000" },
    { label: "1001 - 2000 V-BUCKS", value: "1001-2000" },
    { label: "2001+ V-BUCKS", value: "2001-99999" }
  ];

  // Logic to check if item is in range
  const isInVBucksRange = (vbucks, range) => {
    if (range === "ALL") return true;
    const [min, max] = range.split("-").map(Number);
    return vbucks >= min && vbucks <= max;
  };

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await fetch("/api/shop");
        if (!response.ok) throw new Error("Erreur réseau API");
        
        const data = await response.json();
        const items = data.data || [];
        
        // Data mapping
        const formattedItems = items.map(item => ({
          id: item.id || `shop-${Math.random()}`,
          name: item.name || "Objet Inconnu",
          price: item.price || 0,
          full_price: item.full_price || (item.price * 1.5),
          vbucks: item.vbucks || 0,
          image: item.image || "/assets/1000vbucks.png",
          type: item.type || "Cosmetic",
          rarity: item.rarity?.value || "Common"
        }));

        setShopItems(formattedItems);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger la boutique actuelle.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchShop();
  }, []);

  // Filter Logic
  const types = ["ALL", ...new Set(shopItems.map(item => item.type).filter(Boolean))];
  const rarities = ["ALL", ...new Set(shopItems.map(item => item.rarity).filter(Boolean))];

  const filteredItems = shopItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || item.type === filterType;
    const matchesRarity = filterRarity === "ALL" || item.rarity === filterRarity;
    const matchesVBucks = isInVBucksRange(item.vbucks, filterVBucks);
    return matchesSearch && matchesType && matchesRarity && matchesVBucks;
  });

  return (
    <main className="min-h-screen bg-[#091C3E] text-white/95 selection:bg-fortnite-yellow/30 relative overflow-hidden">
      <Navbar />
      
      {/* Texture de fond rayée style menu Fortnite */}
      <div className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#FFF_10px,#FFF_20px)] mix-blend-overlay z-0"></div>

      <section className="pt-32 pb-32 relative z-10 w-full overflow-hidden">
        {/* Lueur de fond bleue concentrée en haut */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-fortnite-blue-light/40 blur-[150px] pointer-events-none mix-blend-screen" />

        <div className="container mx-auto px-4 z-10 relative">
          
          <div className="text-center mb-12 sm:mb-20 relative">
            <h1 className="inline-block py-1.5 px-4 mb-6 sm:mb-8 bg-rarity-marvel/90 border-2 border-rarity-marvel text-white font-display text-sm sm:text-base tracking-widest shadow-[0_4px_0_rgba(150,0,0,1)] uppercase -skew-x-6 transform">
              <span className="block skew-x-6">
                ⏱️ MISE À JOUR QUOTIDIENNE
              </span>
            </h1>
            <h2 className="text-5xl sm:text-6xl md:text-[80px] font-display font-normal text-white mb-4 sm:mb-6 tracking-wider text-3d relative inline-block mx-auto z-10">
              BOUTIQUE DU <br className="block md:hidden" />
              <span className="text-fortnite-yellow relative z-10 text-3d-yellow inline-block transform -rotate-1 ml-0 md:ml-4">
                JOUR
              </span>
            </h2>
            <p className="text-white/88 font-sans text-base sm:text-xl max-w-3xl mx-auto font-semibold tracking-wide uppercase bg-black/35 p-3 sm:p-4 rounded-xl border border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.45)]">
              RETROUVEZ TOUS LES SKINS, PIOCHES ET ÉMOTES ACTUELLEMENT DISPONIBLES DANS FORTNITE.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col flex-wrap justify-center items-center h-[40vh]">
              <div className="w-16 h-16 sm:w-24 sm:h-24 border-8 sm:border-[12px] border-[#0c1a3b] border-t-fortnite-yellow rounded-full animate-spin shadow-[0_0_20px_rgba(255,241,43,0.3)]"></div>
              <p className="text-fortnite-yellow text-xl sm:text-2xl font-display tracking-widest mt-6 sm:mt-8 animate-pulse text-3d-yellow text-center">RECHERCHE DU MATÉRIEL...</p>
            </div>
          ) : error ? (
            <div className="bg-[#051024] border-2 sm:border-4 border-rarity-marvel text-white rounded-2xl p-6 sm:p-10 text-center max-w-xl mx-auto shadow-[0_15px_30px_rgba(224,38,38,0.4),_inset_0_2px_10px_rgba(224,38,38,0.2)]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rarity-marvel rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[0_0_20px_rgba(224,38,38,0.8)]">
                <span className="text-3xl sm:text-4xl font-display">!</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-display tracking-wider mb-2 sm:mb-4 text-3d">ERREUR DE CONNEXION</h3>
              <p className="font-sans text-lg sm:text-xl font-bold text-gray-300">{error}</p>
            </div>
          ) : (
            <>
              {/* Filtres */}
              <div className="bg-[#0c1a3b]/80 backdrop-blur-md border-2 border-white/10 rounded-xl p-4 sm:p-6 mb-8 flex flex-col items-stretch shadow-[0_10px_20px_rgba(0,0,0,0.4)] max-w-[1800px] mx-auto gap-6">
                {/* Ligne de recherche */}
                <div className="w-full relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input 
                    type="text" 
                    placeholder="RECHERCHER UN OBJET..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/10 rounded-lg py-3 pl-10 pr-4 text-white/90 font-sans font-medium tracking-wide placeholder-gray-500 focus:outline-none focus:border-fortnite-yellow transition-colors"
                  />
                </div>
                
                {/* Ligne des menus déroulants */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/10 rounded-lg py-3 px-4 text-white font-sans font-bold tracking-widest focus:outline-none focus:border-fortnite-yellow cursor-pointer appearance-none text-xs sm:text-sm lg:text-base"
                  >
                    {types.map(t => (
                      <option key={t} value={t} className="bg-[#0c1a3b]">{t === "ALL" ? "TOUS LES TYPES" : t.toUpperCase()}</option>
                    ))}
                  </select>

                  <select 
                    value={filterVBucks}
                    onChange={(e) => setFilterVBucks(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/10 rounded-lg py-3 px-4 text-white font-sans font-bold tracking-widest focus:outline-none focus:border-fortnite-yellow cursor-pointer appearance-none text-xs sm:text-sm lg:text-base"
                  >
                    {VBUCK_RANGES.map(range => (
                      <option key={range.value} value={range.value} className="bg-[#0c1a3b]">{range.label}</option>
                    ))}
                  </select>

                  <select 
                    value={filterRarity}
                    onChange={(e) => setFilterRarity(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/10 rounded-lg py-3 px-4 text-white font-sans font-bold tracking-widest focus:outline-none focus:border-fortnite-yellow cursor-pointer appearance-none text-xs sm:text-sm lg:text-base"
                  >
                    {rarities.map(r => (
                      <option key={r} value={r} className="bg-[#0c1a3b]">{r === "ALL" ? "TOUTES LES RARETÉS" : r.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grille */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-black/20 rounded-xl border border-white/5 max-w-[1800px] mx-auto">
                  <p className="text-2xl font-display text-gray-400 tracking-widest">AUCUN RÉSULTAT 😢</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 max-w-[1800px] mx-auto">
                  {filteredItems.map((item) => (
                    <ShopItem 
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      vbucks={item.vbucks}
                      price={item.price}
                      full_price={item.full_price}
                      image={item.image}
                      type={item.type}
                      rarity={item.rarity}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </section>

      <Footer />
    </main>
  );
}
