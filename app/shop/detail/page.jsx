"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ClientItemDetails from "./ClientItemDetails";
import Link from "next/link";

function ItemDetailsContent() {
  const searchParams = useSearchParams();
  const itemIdParam = searchParams.get("id");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemIdParam) {
        setError(true);
        setLoading(false);
        return;
      }
      
      try {
        let itemId = itemIdParam;
        if (itemId.includes('%')) {
          try { itemId = decodeURIComponent(itemId); } catch {}
        }

        const res = await fetch("/api/shop");
        if (!res.ok) throw new Error("Erreur API");

        const json = await res.json();
        const items = json.data || [];

        // Chercher l'item par ID (essai exact puis fallback décodé)
        const found = items.find(i => i.id === itemId)
          || items.find(i => encodeURIComponent(i.id) === itemIdParam)
          || items.find(i => i.id === decodeURIComponent(itemIdParam));

        if (found) {
          setItem(found);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching item:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemIdParam]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-16 h-16 border-8 border-[#0c1a3b] border-t-fortnite-yellow rounded-full animate-spin mb-6"></div>
        <p className="text-fortnite-yellow font-display text-2xl animate-pulse tracking-widest">CHARGEMENT...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="pt-40 text-center pb-40">
        <h1 className="text-4xl font-display mb-4">OBJET INTROUVABLE</h1>
        <Link href="/shop" className="text-[#31BBE6] underline font-semibold">Retour à la boutique</Link>
      </div>
    );
  }

  return <ClientItemDetails item={item} />;
}

export default function ItemDetailsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#091C3E] to-[#122A59] text-white overflow-x-hidden pt-[120px] pb-[60px] relative">
      {/* Animated BG */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#31BBE6] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#A936DA] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-[#FFF12B] rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>
      </div>

      <Navbar />
      
      {/* Enveloppement Suspense obligatoire pour useSearchParams en static export/build */}
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="w-16 h-16 border-8 border-[#0c1a3b] border-t-fortnite-yellow rounded-full animate-spin mb-6"></div>
          <p className="text-fortnite-yellow font-display text-2xl animate-pulse tracking-widest">CHARGEMENT...</p>
        </div>
      }>
        <ItemDetailsContent />
      </Suspense>

      <Footer />
    </main>
  );
}
