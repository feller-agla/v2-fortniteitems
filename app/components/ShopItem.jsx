"use client";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

export function ShopItem({ 
  id, 
  name, 
  price, 
  full_price,
  vbucks, 
  image, 
  type,
  rarity 
}) {
  const { addToCart, isDiscounted } = useCart();
  
  const displayPrice = isDiscounted ? price : (full_price || price * 1.5);

  // Basic color mapping based on rarity (can be expanded)
  const getRarityGradient = () => {
    switch(rarity?.toLowerCase()) {
      case 'legendary': return "from-orange-500/20 to-yellow-500/20";
      case 'epic': return "from-purple-500/20 to-pink-500/20";
      case 'rare': return "from-blue-500/20 to-cyan-500/20";
      case 'uncommon': return "from-green-500/20 to-emerald-500/20";
      default: return "from-gray-500/20 to-slate-500/20";
    }
  };

  const handleAdd = () => {
    addToCart({ id, name, price, full_price, vbucks, image, type: 'shop_item' });
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative flex flex-col p-[2px] rounded-xl bg-[#0a1835] border border-white/20 shadow-[0_5px_15px_rgba(0,0,0,0.6),_inset_0_2px_10px_rgba(255,255,255,0.05)] group overflow-visible transition-all duration-300"
    >
      {/* Subtle Background Gradient based on Rarity */}
      <div className={`absolute inset-0 rounded-lg bg-gradient-to-t ${getRarityGradient()} opacity-20 mix-blend-screen transition-opacity duration-300 group-hover:opacity-40 z-0`} />

      {/* Glossy Top Edge - reduced impact */}
      <div className="absolute top-0 left-0 right-0 h-1/4 rounded-t-lg bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10" />

      {/* Image Container - fixed aspect ratio */}
      <div className="relative w-full aspect-square bg-[#0c1a3b]/60 rounded-t-lg mb-0 flex items-center justify-center p-1 sm:p-2 z-10 overflow-visible border-b border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {/* Striped Pattern - made fainter */}
        <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#FFF_5px,#FFF_10px)] pointer-events-none mix-blend-overlay"></div>

        {/* Rarity Glow Behind Image - reduced size and intensity */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-2xl opacity-40 mix-blend-screen transition-all group-hover:scale-110 group-hover:opacity-60 ${
          rarity?.toLowerCase() === 'legendary' ? 'bg-rarity-legendary' 
          : rarity?.toLowerCase() === 'epic' ? 'bg-rarity-epic'
          : rarity?.toLowerCase() === 'rare' ? 'bg-rarity-rare'
          : 'bg-rarity-uncommon'
        }`} />
        
        <img 
          src={image} 
          alt={name} 
          className="w-[110%] h-[110%] sm:w-[120%] sm:h-[120%] object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-300 relative z-20"
          loading="lazy"
        />
        {type && (
          <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/55 text-white/95 text-[8px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 uppercase tracking-wide z-30 shadow-[0_2px_0_rgba(150,0,0,0.75)] border border-white/10 rounded backdrop-blur-sm">
            {type}
          </span>
        )}
      </div>

      <div className="z-10 mt-auto flex flex-col items-center bg-[#051024]/80 p-2 sm:p-3 rounded-b-lg relative overflow-hidden">
        {/* Shine effect on bottom panel hover - kept simple */}
        <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out]"></div>

        <h3 className="text-sm sm:text-lg font-display font-normal text-white mb-1 tracking-wide text-center line-clamp-1 leading-tight text-3d">{name.toUpperCase()}</h3>
        
        <div className="flex flex-col items-center mt-1 w-full relative">
          <span className="text-[10px] sm:text-xs font-display tracking-wide text-[#B0B8C8]/88 mb-1">
             <span className="drop-shadow-md">💰 {vbucks} </span> <span className="hidden sm:inline">V-BUCKS</span>
          </span>
          <div className="flex flex-col items-center w-full gap-1">
            {isDiscounted && (
              <span className="text-[10px] sm:text-xs text-rarity-marvel font-bold line-through opacity-70">
                {(full_price || price * 1.5).toLocaleString('fr-FR')} FCFA
              </span>
            )}
            <span className={`text-sm sm:text-lg font-bold font-sans w-full text-center py-1 sm:py-1.5 rounded shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] border transition-all duration-500 ${
              isDiscounted 
                ? 'text-fortnite-yellow border-fortnite-yellow/40 bg-fortnite-yellow/10 scale-105 shadow-[0_0_15px_rgba(241,241,43,0.2)]' 
                : 'text-white border-white/5 bg-black/35'
            }`}>
              {displayPrice.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleAdd}
          className="btn-fortnite bg-white/10 hover:bg-white text-white hover:text-fortnite-blue w-full py-2 sm:py-2.5 mt-2 shadow-[0_4px_0_rgba(0,0,0,0.4)] transition-colors border border-white/20 hover:border-white"
        >
          <span className="btn-fortnite-inner text-xs sm:text-sm font-semibold leading-none mt-1">AJOUTER</span>
        </button>
      </div>
    </motion.div>
  );
}
