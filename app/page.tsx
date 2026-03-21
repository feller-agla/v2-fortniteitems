import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import { ProductCard } from "./components/ProductCard";

export default function Home() {
  // Vos données (qui remplaceront product.js)
  const products = [
    {
      id: 4,
      name: "PACK 12500 V-BUCKS",
      price: 39000,
      vbucks: 12500,
      image: "/assets/13500vbucks.png",
      badge: "LE PLUS POPULAIRE 🔥",
      isPopular: true
    },
    {
      id: 3,
      name: "PACK 4500 V-BUCKS",
      price: 17000,
      vbucks: 4500,
      image: "/assets/5000vbucks.png"
    },
    {
      id: 2,
      name: "PACK 2400 V-BUCKS",
      price: 9000,
      vbucks: 2400,
      image: "/assets/2800vbucks.png"
    },
    {
      id: 1,
      name: "PACK 800 V-BUCKS",
      price: 4000,
      vbucks: 800,
      image: "/assets/1000vbucks.png"
    }
  ];

  return (
    <main className="min-h-screen bg-[#091C3E] text-white/95 selection:bg-fortnite-yellow/30 font-sans relative overflow-hidden">
      
      {/* Texture globale rayée */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#FFF_10px,#FFF_20px)] mix-blend-overlay z-0"></div>

      <Navbar />
      <Hero />
      
      <section id="products" className="py-20 lg:py-32 relative z-10 w-full overflow-hidden">
        {/* Lueur de section modérée */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fortnite-blue-light/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

        <div className="container mx-auto px-4 z-10 relative">
          
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="inline-block py-1.5 px-4 mb-4 sm:mb-6 bg-fortnite-yellow/90 text-[#0c1a3b] font-display text-sm sm:text-base tracking-widest shadow-[0_4px_0_rgba(0,0,0,1)] uppercase -skew-x-6 border-2 border-fortnite-yellow/20">
              ⚡ SÉLECTION V-BUCKS
            </h2>
            <h3 className="text-4xl sm:text-5xl md:text-7xl font-display font-normal text-white mb-4 tracking-wider text-3d relative">
              PACKS <span className="text-fortnite-yellow text-3d-yellow relative z-10">DISPONIBLES</span>
            </h3>
            <p className="text-gray-300/90 font-sans text-base sm:text-xl max-w-2xl mx-auto font-medium tracking-wide">
              SÉCURISEZ VOS V-BUCKS AU MEILLEUR PRIX. LIVRAISON INSTANTANÉE SUR VOTRE COMPTE.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 max-w-[1400px] mx-auto">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                vbucks={product.vbucks}
                image={product.image}
                badge={product.badge}
                isPopular={product.isPopular}
              />
            ))}
          </div>
          
        </div>
      </section>
    </main>
  );
}
