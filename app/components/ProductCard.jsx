"use client";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

export function ProductCard({ 
  id, 
  name, 
  price, 
  vbucks, 
  image, 
  badge, 
  isPopular 
}) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({ id, name, price, vbucks, image, type: 'vbucks_pack' });
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative flex flex-col p-[3px] rounded-2xl bg-[#0a1835] border-2 border-[#1A3E7A] shadow-[0_8px_20px_rgba(0,0,0,0.6),_inset_0_2px_10px_rgba(255,255,255,0.1)] overflow-visible group transition-all duration-300"
    >
      {/* Subtle Background radial glow - reduced intensity */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-t opacity-20 mix-blend-screen transition-opacity duration-300 group-hover:opacity-40 ${
        isPopular ? "from-rarity-legendary to-transparent" : "from-rarity-rare to-transparent"
      }`} />

      {/* Rarity Glow Behind Image - reduced blur and opacity */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-2xl opacity-40 mix-blend-screen transition-all group-hover:opacity-60 ${
        isPopular ? "bg-rarity-legendary" : "bg-rarity-rare"
      }`} />

      {badge && (
        <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 z-30 transform -rotate-3 transition-transform">
          <span className="inline-block bg-rarity-marvel border-2 sm:border-4 border-white text-white px-2 sm:px-4 py-1 sm:py-2 shadow-[0_4px_0_rgba(150,0,0,1)] rounded-lg">
            <span className="font-display text-[10px] sm:text-sm font-semibold tracking-wide leading-none drop-shadow-md">{badge}</span>
          </span>
        </div>
      )}

      {/* Image Container - fixed aspect ratio for responsiveness */}
      <div className="relative w-full aspect-square sm:aspect-[4/3] flex justify-center items-center p-2 sm:p-4 z-20 mt-4 sm:mt-6">
        <img 
          src={image} 
          alt={name} 
          className="w-[110%] sm:w-[120%] h-[110%] sm:h-[120%] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300 relative z-20 -top-2"
        />
      </div>

      <div className="z-10 mt-auto flex flex-col pt-3 sm:pt-4 relative bg-[#0c1a3b] rounded-xl border-t border-white/10 shadow-inner overflow-hidden">
        {/* Title area */}
        <div className="p-2 sm:p-3 text-center relative z-10">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-normal text-white leading-none tracking-wider text-3d">{name.toUpperCase()}</h3>
        </div>
        
        {/* Price area - reduced text size slightly for mobile */}
        <div className="bg-black/60 p-3 sm:p-4 text-center flex flex-col items-center justify-center border-t-2 border-[#1A3E7A] relative z-10 shadow-[inset_0_5px_15px_rgba(0,0,0,0.5)]">
          <p className="text-2xl sm:text-3xl font-display font-normal text-fortnite-yellow leading-none flex items-center justify-center gap-2 text-3d-yellow">
            {price.toLocaleString('fr-FR')} <span className="text-lg sm:text-xl">FCFA</span>
          </p>
        </div>
        
        <div className="p-2 sm:p-3 relative z-10">
          <button 
            onClick={handleAddToCart}
            className="btn-fortnite bg-white hover:bg-gray-200 text-fortnite-blue w-full py-3 sm:py-4 text-lg sm:text-xl md:text-2xl"
          >
            <span className="btn-fortnite-inner font-semibold leading-none mt-1">ACHETER</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
