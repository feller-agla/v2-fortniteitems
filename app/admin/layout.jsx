"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HomeIcon, ShoppingBagIcon, InboxIcon, UsersIcon, ArrowLeftEndOnRectangleIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout({ children }) {
  const { user, profile, loading, isAuthReady, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthReady) return;

    const noAccess = !user || profile?.role !== 'admin';
    
    if (noAccess) {
      console.log('[ADMIN DEBUG] Access denied. Redirecting in 8s...', { 
        hasUser: !!user, 
        role: profile?.role,
        userId: user?.id 
      });
      
      const timer = setTimeout(() => {
        router.push('/login');
      }, 8000); // 8s wait to avoid race conditions with slow profiles
      return () => clearTimeout(timer);
    } else {
      console.log('[ADMIN DEBUG] Access granted. Role:', profile?.role);
    }
  }, [user, profile, isAuthReady, router]);

  // 1. Initial Loading State
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#091C3E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-display text-fortnite-yellow animate-pulse mb-4">AUTHENTIFICATION...</div>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Récupération de votre profil sécurisé</p>
        </div>
      </div>
    );
  }

  // 2. Denied Access State
  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#091C3E] flex items-center justify-center p-4">
        <div className="bg-[#051024] border-2 border-rarity-marvel rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-rarity-marvel text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-display text-white mb-2 tracking-widest text-3d">ACCÈS REFUSÉ</h1>
          <p className="text-gray-400 font-bold text-sm uppercase mb-6">
            {user ? "Votre compte n'a pas les privilèges administrateur." : "Vous devez être connecté pour accéder à cette zone."}
          </p>
          <div className="space-y-4">
            <Link href="/login" prefetch={false} className="btn-fortnite bg-fortnite-yellow text-fortnite-blue w-full py-3 block text-center">
              <span className="btn-fortnite-inner font-bold">SE CONNECTER</span>
            </Link>
            <Link href="/" className="text-white/50 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors block">
              Retour au site
            </Link>
          </div>
          <p className="text-[10px] text-gray-600 mt-8 uppercase italic">Redirection automatique dans quelques secondes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#091C3E] text-white flex flex-col md:flex-row font-sans">
      
      {/* Sidebar for Desktop / Top Nav for Mobile */}
      <aside className="w-full md:w-64 bg-[#051024] border-r-4 border-b-4 md:border-b-0 border-[#1A3E7A] flex flex-col shrink-0 z-20">
        <div className="p-6 border-b-2 border-white/5 text-center md:text-left">
          <h2 className="text-3xl font-display font-normal text-fortnite-yellow text-3d tracking-widest leading-none">
            ADMIN
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-[#B0B8C8] mt-2">
            GESTION BOUTIQUE
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 flex md:flex-col overflow-x-auto md:overflow-visible overflow-y-hidden md:overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 p-3 text-white hover:bg-white/10 rounded-xl transition-colors whitespace-nowrap group">
            <HomeIcon className="w-6 h-6 text-gray-400 group-hover:text-fortnite-yellow" />
            <span className="font-bold text-sm tracking-widest">DASHBOARD</span>
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 p-3 text-white hover:bg-white/10 rounded-xl transition-colors whitespace-nowrap group">
            <ShoppingBagIcon className="w-6 h-6 text-gray-400 group-hover:text-fortnite-yellow" />
            <span className="font-bold text-sm tracking-widest">PRODUITS</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 p-3 text-white hover:bg-white/10 rounded-xl transition-colors whitespace-nowrap group">
            <InboxIcon className="w-6 h-6 text-gray-400 group-hover:text-fortnite-yellow" />
            <span className="font-bold text-sm tracking-widest">COMMANDES</span>
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 p-3 text-white hover:bg-white/10 rounded-xl transition-colors whitespace-nowrap group">
            <UsersIcon className="w-6 h-6 text-gray-400 group-hover:text-fortnite-yellow" />
            <span className="font-bold text-sm tracking-widest">UTILISATEURS</span>
          </Link>
          <Link href="/admin/messages" className="flex items-center gap-3 p-3 text-white hover:bg-white/10 rounded-xl transition-colors whitespace-nowrap group">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400 group-hover:text-fortnite-yellow" />
            <span className="font-bold text-sm tracking-widest">MESSAGES</span>
          </Link>
        </nav>

        <div className="p-4 border-t-2 border-white/5">
          <Link href="/" className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors group">
            <ArrowLeftEndOnRectangleIcon className="w-6 h-6 group-hover:text-rarity-marvel" />
            <span className="font-bold text-sm tracking-widest uppercase">Retour au site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {/* Background Texture Area */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#FFF_10px,#FFF_20px)] mix-blend-overlay"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-fortnite-blue-light/30 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10 w-full xl:max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      
    </div>
  );
}
