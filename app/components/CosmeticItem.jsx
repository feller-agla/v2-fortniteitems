"use client";

import { motion } from "framer-motion";

export function CosmeticItem({ 
  id, 
  name, 
  description,
  introduction,
  image, 
  type,
  rarity,
  setName
}) {

  const getRarityGradient = () => {
    switch(rarity?.toLowerCase()) {
      case 'legendary': return "from-orange-500/20 to-yellow-500/20";
      case 'epic': return "from-purple-500/20 to-pink-500/20";
      case 'rare': return "from-blue-500/20 to-cyan-500/20";
      case 'uncommon': return "from-green-500/20 to-emerald-500/20";
      default: return "from-gray-500/20 to-slate-500/20";
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative flex flex-col p-[2px] rounded-xl bg-[#0a1835] border border-white/20 shadow-[0_5px_15px_rgba(0,0,0,0.6),_inset_0_2px_10px_rgba(255,255,255,0.05)] group overflow-visible transition-all duration-300 h-full"
    >
      <div className={`absolute inset-0 rounded-lg bg-gradient-to-t ${getRarityGradient()} opacity-20 mix-blend-screen transition-opacity duration-300 group-hover:opacity-40 z-0`} />
      <div className="absolute top-0 left-0 right-0 h-1/4 rounded-t-lg bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10" />

      <div className="relative w-full aspect-square bg-[#0c1a3b]/60 rounded-t-lg mb-0 flex items-center justify-center p-1 sm:p-2 z-10 overflow-visible border-b border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#FFF_5px,#FFF_10px)] pointer-events-none mix-blend-overlay"></div>

        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-2xl opacity-40 mix-blend-screen transition-all group-hover:scale-110 group-hover:opacity-60 ${
          rarity?.toLowerCase() === 'legendary' ? 'bg-rarity-legendary' : rarity?.toLowerCase() === 'epic' ? 'bg-rarity-epic' : rarity?.toLowerCase() === 'rare' ? 'bg-rarity-rare' : 'bg-rarity-uncommon'
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

      <div className="z-10 flex-1 flex flex-col justify-start items-center bg-[#051024]/80 p-2 sm:p-3 rounded-b-lg relative overflow-hidden">
        <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out]"></div>

        <h3 className="text-sm sm:text-lg font-display font-normal text-white mb-1 tracking-wide text-center leading-tight text-3d">{name.toUpperCase()}</h3>
        
        {description && (
            <p className="text-[10px] sm:text-xs text-gray-400 font-sans text-center mb-2 italic line-clamp-2">
                "{description}"
            </p>
        )}

        <div className="mt-auto w-full flex flex-col items-center border-t border-white/10 pt-2 gap-1">
            {introduction && (
                <span className="text-[9px] sm:text-[10px] text-fortnite-yellow/80 font-display uppercase tracking-widest text-center">
                    {introduction}
                </span>
            )}
            {setName && (
                <span className="text-[9px] sm:text-[10px] text-white/60 font-display uppercase tracking-widest text-center bg-black/40 px-2 py-0.5 rounded">
                    Ensemble : {setName}
                </span>
            )}
        </div>
      </div>
    </motion.div>
  );
}
