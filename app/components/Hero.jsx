"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section id="home" className="relative min-h-[100svh] flex items-center overflow-hidden bg-fortnite-blue pt-16 sm:pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Subtle geometric background instead of bright yellow stripe */}
        <div className="absolute top-0 right-0 w-[120%] h-[150%] bg-[#0c1a3b] origin-top-right -rotate-6 translate-x-1/2 shadow-[inset_20px_0_50px_rgba(0,0,0,0.5)]"></div>
        
        {/* Ray Patterns - subtler */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,#FFF_40px,#FFF_80px)] mix-blend-overlay"></div>

        {/* Localized glow behind text */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-fortnite-blue-light/50 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12 items-center pb-8 pt-4 lg:pt-0">
        
        {/* Text Content */}
        <div className="flex flex-col gap-3 sm:gap-6 text-center lg:text-left mt-2 lg:mt-0 order-2 lg:order-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center lg:items-start"
          >
            <span className="inline-block py-1.5 px-4 rounded bg-rarity-marvel/90 text-white font-display text-sm sm:text-base tracking-widest shadow-[0_4px_0_rgba(150,0,0,1)] uppercase -skew-x-6 mb-4 sm:mb-6">
              🔥 SAISON ACTUELLE LIVE
            </span>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[90px] xl:text-[110px] font-display font-normal leading-[0.9] text-white text-3d mb-1 relative z-10 mx-auto lg:mx-0">
              BOUTIQUE
              <span className="block text-fortnite-yellow text-3d-yellow transform -rotate-1 origin-center lg:origin-left mt-1 relative">
                FORTNITE
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[17px] sm:text-lg md:text-xl text-white font-sans font-bold max-w-lg mx-auto lg:mx-0 p-2 sm:p-4 bg-black/40 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm"
          >
            Faites des économies sur vos <strong className="text-fortnite-yellow">V-Bucks</strong>. Livraison automatique 24/7.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-row sm:flex-row gap-2 sm:gap-6 justify-center lg:justify-start w-full sm:px-0 mt-1"
          >
            <Link 
              href="#products" 
              className="btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue px-3 sm:px-8 py-2.5 sm:py-5 text-base sm:text-xl w-[48%] sm:w-auto"
            >
              <span className="btn-fortnite-inner leading-none mt-1">V-BUCKS</span>
            </Link>
            
            <Link 
              href="/shop" 
              className="btn-fortnite bg-white/10 hover:bg-white text-white hover:text-fortnite-blue px-3 sm:px-8 py-2.5 sm:py-5 text-base sm:text-xl border-2 border-white/50 w-[48%] sm:w-auto backdrop-blur-sm shadow-[0_4px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_0_rgba(200,200,200,1)]"
            >
              <span className="btn-fortnite-inner leading-none mt-1">BOUTIQUE</span>
            </Link>
          </motion.div>
          
          {/* Trust Indicators - Simplified for mobile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 mt-6 sm:mt-8 mx-auto lg:mx-0"
          >
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-fortnite-yellow text-sm sm:text-base">⭐⭐⭐⭐⭐</span>
              <span className="font-sans font-bold text-white text-xs sm:text-sm tracking-wider uppercase">+10K Clients</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 font-display text-white text-xs sm:text-sm tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#60C11F] shadow-[0_0_8px_#60C11F]"></span>
              SÉCURISÉ
            </div>
          </motion.div>
        </div>

        {/* Visual Content (3D V-Bucks/Skin) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative flex justify-center lg:justify-end items-center h-[180px] sm:h-[400px] lg:h-full pointer-events-none order-1 lg:order-2 mt-2 lg:mt-0"
        >
          {/* Static backdrop instead of animated pulse to reduce noise */}
          <div className="absolute w-[180px] h-[180px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] rounded-full bg-rarity-rare/40 blur-3xl mix-blend-screen" />
          
          {/* Decorative ring */}
          <div className="absolute w-[150px] h-[150px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] border-[6px] border-white/10 rounded-full border-dashed" />
          
          <img 
            src="/assets/13500vbucks.png" 
            alt="13500 V-Bucks Bundle" 
            className="h-full sm:h-auto sm:w-[120%] max-h-[220px] sm:max-h-[450px] lg:max-w-[600px] z-20 drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] relative right-0 lg:-right-4 object-contain"
          />
        </motion.div>

      </div>
    </section>
  );
}
