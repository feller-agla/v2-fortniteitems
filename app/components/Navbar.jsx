"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCartIcon, Bars3Icon, XMarkIcon, UserCircleIcon } from "@heroicons/react/24/outline";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { totalItems } = useCart();
  const { user, profile, signOut, loading, avatarUrl, displayName, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-[#091C3E]/95 border-b-4 border-fortnite-yellow shadow-[0_10px_30px_rgba(0,0,0,0.8)]" : "bg-gradient-to-b from-[#091C3E] to-transparent"}`}>
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl md:text-3xl font-display font-normal text-white tracking-widest leading-none mt-1 text-3d group-hover:text-fortnite-yellow transition-colors">
            FORTNITE<span className="text-fortnite-yellow group-hover:text-white transition-colors">ITEMS</span>
          </span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-10 font-display text-xl tracking-wider">
          <Link href="/#home" className="text-white hover:text-fortnite-yellow transition-colors text-3d hover:translate-y-[-2px] inline-block">ACCUEIL</Link>
          <Link href="/#products" className="text-white hover:text-fortnite-yellow transition-colors text-3d hover:translate-y-[-2px] inline-block">V-BUCKS</Link>
          <Link href="/shop" className="text-white hover:text-fortnite-yellow transition-colors text-3d hover:translate-y-[-2px] inline-block">BOUTIQUE</Link>
          <Link href="/orders" className="text-white hover:text-fortnite-yellow transition-colors text-3d hover:translate-y-[-2px] inline-block">SUIVI</Link>
          {user && (
            <Link href="/messages" className="text-fortnite-yellow hover:text-white transition-colors text-3d hover:translate-y-[-2px] inline-block relative group/msg">
              MESSAGES
              <span className="absolute -top-1 -right-4 w-2 h-2 bg-rarity-marvel rounded-full animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.8)]"></span>
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Cart */}
          <Link href="/cart" className="relative p-2 text-white hover:text-fortnite-yellow transition-colors group">
            <ShoppingCartIcon suppressHydrationWarning className="w-8 h-8 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_15px_rgba(255,241,43,0.8)]" />
            {(totalItems > 0) && (
              <span className="absolute -top-1 -right-1 bg-rarity-marvel text-white text-[12px] font-sans font-bold w-6 h-6 flex items-center justify-center border-2 border-white rounded-full shadow-[0_4px_0_rgba(150,0,0,1)]">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Auth Area - shows immediately once user state is known */}
          {loading ? (
            <div className="w-24 h-11 bg-white/5 animate-pulse rounded-xl border-2 border-white/10" />
          ) : user ? (
            // Logged In: show avatar + dropdown
            <div className="relative flex items-center">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-xl px-3 py-2 transition-colors"
                aria-label="User menu"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserCircleIcon className="w-7 h-7 text-fortnite-yellow" />
                )}
                <span className="text-white font-bold text-sm tracking-wide max-w-[80px] truncate hidden sm:inline-block">{displayName}</span>
              </button>

               {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#051024] border-2 border-[#1A3E7A] rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                  {/* Admin Panel Link */}
                  {(profile?.role === 'admin' || isAdmin) && (
                    <Link 
                      href="/admin" 
                      className="block px-4 py-3 text-fortnite-yellow font-bold text-sm uppercase tracking-wider hover:bg-fortnite-yellow/10 transition-colors border-b border-white/5 bg-white/5" 
                      onClick={() => setShowUserMenu(false)}
                    >
                      🛡️ Panel Admin
                    </Link>
                  )}
                  
                  {/* Regular Links */}
                  <Link 
                    href="/orders" 
                    className="block px-4 py-3 text-white font-bold text-sm uppercase tracking-wider hover:bg-white/5 transition-colors" 
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mes commandes
                  </Link>

                  {/* Sign Out Action */}
                  <button
                    onClick={async () => { 
                      setShowUserMenu(false); 
                      await signOut(); 
                    }}
                    className="w-full text-left px-4 py-3 text-rarity-marvel font-bold text-sm uppercase tracking-wider hover:bg-rarity-marvel/10 transition-colors border-t border-white/5"
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="flex btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue px-4 py-2 sm:px-6 sm:py-3 border-2 border-fortnite-yellow/50">
              <span className="btn-fortnite-inner text-sm sm:text-lg font-bold leading-none mt-1">CONNEXION</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white hover:text-fortnite-yellow p-2 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? (
              <XMarkIcon suppressHydrationWarning className="w-9 h-9" />
            ) : (
              <Bars3Icon suppressHydrationWarning className="w-9 h-9" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-[#091C3E] border-t-4 border-b-4 border-fortnite-yellow shadow-[0_20px_50px_rgba(0,0,0,0.9)] py-8 flex flex-col items-center gap-6 font-display text-3xl tracking-wider">
          <Link href="/#home" className="text-white hover:text-fortnite-yellow text-3d" onClick={() => setIsMobileMenuOpen(false)}>ACCUEIL</Link>
          <Link href="/#products" className="text-white hover:text-fortnite-yellow text-3d" onClick={() => setIsMobileMenuOpen(false)}>V-BUCKS</Link>
          <Link href="/shop" className="text-white hover:text-fortnite-yellow text-3d" onClick={() => setIsMobileMenuOpen(false)}>BOUTIQUE</Link>
          <Link href="/orders" className="text-white hover:text-fortnite-yellow text-3d" onClick={() => setIsMobileMenuOpen(false)}>SUIVI</Link>
          {user && (
            <Link href="/messages" className="text-fortnite-yellow hover:text-white text-3d font-bold" onClick={() => setIsMobileMenuOpen(false)}>MESSAGES</Link>
          )}
          {user ? (
            <>
              {/* Admin Panel (Mobile) */}
              {(profile?.role === 'admin' || isAdmin) && (
                <Link 
                  href="/admin" 
                  className="text-fortnite-yellow text-3d text-2xl font-bold" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🛡️ PANEL ADMIN
                </Link>
              )}
              
              <button
                onClick={async () => { 
                  setIsMobileMenuOpen(false); 
                  await signOut(); 
                }}
                className="btn-fortnite bg-rarity-marvel text-white px-10 py-4 mt-2 w-3/4 text-center"
              >
                <span className="btn-fortnite-inner font-bold text-2xl">DÉCONNEXION</span>
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-fortnite bg-fortnite-yellow text-fortnite-blue px-10 py-4 mt-6 w-3/4 text-center block" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="btn-fortnite-inner font-bold text-2xl">CONNEXION</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
