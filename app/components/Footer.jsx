"use client";
import Link from "next/link";
import { 
  ChatBubbleLeftRightIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  TruckIcon 
} from "@heroicons/react/24/outline";

export default function Footer() {
  return (
    <footer className="bg-[#051024] border-t-4 border-[#1A3E7A] pt-16 pb-8 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="group mb-6 transition-transform hover:scale-110">
              <img 
                src="/assets/LamaShop-removebg-preview.png" 
                alt="LamaShop Logo" 
                className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,241,43,0.2)]"
              />
            </Link>
            <p className="text-gray-400 font-sans font-medium text-sm leading-relaxed text-center md:text-left max-w-xs">
              La boutique n°1 pour vos V-Bucks et packs Fortnite. Sécurisé, rapide et au meilleur prix du marché.
            </p>
            <div className="flex gap-4 mt-8">
              <a href="#" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all border border-white/10 group">
                <span className="text-xl group-hover:scale-110 transition-transform">📱</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all border border-white/10 group">
                <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="font-display text-xl text-white tracking-widest mb-6 uppercase">Navigation</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-gray-400 hover:text-fortnite-yellow font-bold text-sm uppercase tracking-wider transition-colors">Accueil</Link></li>
              <li><Link href="/shop" className="text-gray-400 hover:text-fortnite-yellow font-bold text-sm uppercase tracking-wider transition-colors">Boutique</Link></li>
              <li><Link href="/cart" className="text-gray-400 hover:text-fortnite-yellow font-bold text-sm uppercase tracking-wider transition-colors">Mon Panier</Link></li>
              <li><Link href="/messages" className="text-gray-400 hover:text-fortnite-yellow font-bold text-sm uppercase tracking-wider transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Guarantees */}
          <div className="text-center md:text-left">
            <h4 className="font-display text-xl text-white tracking-widest mb-6 uppercase">Garanties</h4>
            <ul className="space-y-4">
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400 font-bold text-xs uppercase tracking-widest">
                <ShieldCheckIcon className="w-5 h-5 text-rarity-uncommon" />
                Paiement Sécurisé
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400 font-bold text-xs uppercase tracking-widest">
                <TruckIcon className="w-5 h-5 text-rarity-rare" />
                Livraison Rapide
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400 font-bold text-xs uppercase tracking-widest">
                <ClockIcon className="w-5 h-5 text-fortnite-yellow" />
                Support 24/7
              </li>
            </ul>
          </div>

          {/* Newsletter/Action */}
          <div className="bg-[#0c1628] p-6 rounded-2xl border-2 border-[#1A3E7A] shadow-xl">
            <h4 className="font-display text-lg text-fortnite-yellow tracking-widest mb-4 uppercase">Des questions ?</h4>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6 leading-relaxed">
              Besoin d'aide pour votre commande ? Notre équipe est disponible.
            </p>
            <Link href="/messages" className="btn-fortnite bg-white hover:bg-gray-200 text-fortnite-blue w-full py-3 text-sm shadow-[0_4px_0_rgba(200,200,200,1)]">
              <span className="btn-fortnite-inner font-bold">CONTACTER LE SUPPORT</span>
            </Link>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} <span className="text-white">LAMASHOP</span>. TOUS DROITS RÉSERVÉS.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-[9px] text-gray-600 hover:text-white font-bold uppercase tracking-widest transition-colors">CGV</Link>
            <Link href="#" className="text-[9px] text-gray-600 hover:text-white font-bold uppercase tracking-widest transition-colors">Mentions Légales</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
