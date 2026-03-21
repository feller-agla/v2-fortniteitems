"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCartIcon, UserCircleIcon } from "@heroicons/react/24/outline";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { totalItems } = useCart();
  const { user, profile, signOut, loading, avatarUrl, displayName, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 box-border transition-all duration-300 ${isScrolled ? "bg-[#091C3E]/95 border-b-4 border-fortnite-yellow shadow-[0_10px_30px_rgba(0,0,0,0.8)]" : "bg-gradient-to-b from-[#091C3E] to-transparent"}`}>
      <div
        className="mx-auto flex h-20 max-w-full min-w-0 items-center justify-between gap-2 sm:gap-4 md:px-6 lg:px-8
          pl-[max(1rem,env(safe-area-inset-left))]
          pr-[max(1rem,env(safe-area-inset-right))]
          sm:pl-[max(1.25rem,env(safe-area-inset-left))]
          sm:pr-[max(1.25rem,env(safe-area-inset-right))]"
      >
        
        {/* Logo — allow shrink on narrow screens so the right cluster keeps margin */}
        <Link href="/" className="group flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <span className="font-display text-lg font-normal leading-none tracking-wide text-white text-3d transition-colors group-hover:text-fortnite-yellow sm:text-xl sm:tracking-wider md:text-2xl md:tracking-widest lg:text-3xl mt-0.5 sm:mt-1">
            FORTNITE<span className="text-fortnite-yellow transition-colors group-hover:text-white">ITEMS</span>
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

        {/* Right Actions — flex-shrink-0 keeps avatar + cart inside padded area (no edge clipping) */}
        <div className="flex flex-shrink-0 items-center gap-3 md:gap-4">
          {/* Cart */}
          <Link
            href="/cart"
            className="group relative -mr-0.5 p-1.5 text-white transition-colors hover:text-fortnite-yellow sm:p-2"
          >
            <ShoppingCartIcon suppressHydrationWarning className="h-7 w-7 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_15px_rgba(255,241,43,0.8)] sm:h-8 sm:w-8" />
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
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex max-w-[min(148px,calc(100vw-11rem))] items-center gap-1.5 rounded-2xl border-2 border-white/20 bg-white/10 px-2.5 py-2 transition-colors hover:bg-white/20 sm:max-w-[180px] sm:gap-2 sm:px-4 sm:py-3 md:max-w-[220px]"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover sm:h-8 sm:w-8" referrerPolicy="no-referrer" />
                ) : (
                  <UserCircleIcon className="h-7 w-7 flex-shrink-0 text-fortnite-yellow sm:h-8 sm:w-8" />
                )}
                <span className="min-w-0 flex-1 truncate text-left text-sm font-medium tracking-wide text-white/95 sm:text-base">
                  {displayName}
                </span>
              </button>

               {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-[270px] sm:w-[300px] bg-[#051024] border-2 border-[#1A3E7A] rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                  {/* Desktop quick links */}
                  <div className="hidden md:block">
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
                  </div>

                  {/* Mobile full menu */}
                  <div className="md:hidden">
                    <Link
                      href="/#home"
                      className="block px-5 py-3 text-white font-medium text-base uppercase tracking-wider hover:bg-white/5 transition-colors border-b border-white/5 text-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      ACCUEIL
                    </Link>
                    <Link
                      href="/#products"
                      className="block px-5 py-3 text-white font-medium text-base uppercase tracking-wider hover:bg-white/5 transition-colors border-b border-white/5 text-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      V-BUCKS
                    </Link>
                    <Link
                      href="/shop"
                      className="block px-5 py-3 text-white font-medium text-base uppercase tracking-wider hover:bg-white/5 transition-colors border-b border-white/5 text-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      BOUTIQUE
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-5 py-3 text-white font-medium text-base uppercase tracking-wider hover:bg-white/5 transition-colors border-b border-white/5 text-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      SUIVI
                    </Link>
                    {user && (
                      <Link
                        href="/messages"
                        className="block px-5 py-3 text-fortnite-yellow font-medium text-base uppercase tracking-wider hover:bg-white/5 transition-colors border-b border-white/5 text-center"
                        onClick={() => setShowUserMenu(false)}
                      >
                        MESSAGES
                      </Link>
                    )}

                    {(profile?.role === 'admin' || isAdmin) && (
                      <Link
                        href="/admin"
                        className="block px-5 py-3 text-fortnite-yellow font-medium text-base uppercase tracking-wider hover:bg-fortnite-yellow/10 transition-colors border-b border-white/5 bg-white/5 text-center"
                        onClick={() => setShowUserMenu(false)}
                      >
                        🛡️ PANEL ADMIN
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Action */}
                  <button
                    onClick={async () => { 
                      setShowUserMenu(false); 
                      await signOut(); 
                    }}
                    className="w-full flex items-center justify-center text-center px-5 py-4 text-rarity-marvel font-normal text-[15px] uppercase tracking-wider hover:bg-rarity-marvel/10 transition-colors border-t border-white/5"
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" prefetch={false} className="flex btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue px-4 py-2 sm:px-6 sm:py-3 border-2 border-fortnite-yellow/50">
              <span className="btn-fortnite-inner text-sm sm:text-lg font-bold leading-none mt-1">CONNEXION</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
