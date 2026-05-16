"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ClientItemDetails({ item }) {
  const [paymentUrl, setPaymentUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // Load payment link dynamically
  useEffect(() => {
    const fetchPaymentLink = async () => {
      try {
        const res = await fetch(`/api/payment-links?vbucks=${item.vbucks}`);
        const data = await res.json();
        if (data.status === 'success' && data.link) {
          setPaymentUrl(data.link);
        } else {
          // Fallback to default
          setPaymentUrl(`https://votre-lien-de-paiement.com/default?vbucks=${item.vbucks}`);
        }
      } catch (err) {
        console.error('Error fetching payment link:', err);
        // Fallback to default
        setPaymentUrl(`https://votre-lien-de-paiement.com/default?vbucks=${item.vbucks}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentLink();
  }, [item.vbucks]);
  // Combine all items in case of a bundle to allow selection
  let allItems = [];
  
  if (item.is_bundle && item.bundle_items && item.bundle_items.length > 0) {
    allItems = item.bundle_items.map((bItem, idx) => ({
      ...bItem,
      id: bItem.id || `bundle-item-${idx}`
    }));
  } else if (item.related_items && item.related_items.length > 0) {
    allItems = [
      {
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        rarity: item.rarity,
        image: item.image
      },
      ...item.related_items
    ];
  } else {
    allItems = [item];
  }

  const [activeItem, setActiveItem] = useState(allItems[0]);

  const mainImageUrl = activeItem.image || activeItem.images?.icon || activeItem.images?.smallIcon || activeItem.images?.featured || '/assets/icon.png';
  
  // Extract video if available
  let videoUrl = null;
  if (activeItem.showcaseVideo) {
    videoUrl = `https://www.youtube.com/watch?v=${activeItem.showcaseVideo}`;
  } else if (activeItem.video) {
    videoUrl = activeItem.video;
  } else if (item.showcaseVideo) {
    videoUrl = `https://www.youtube.com/watch?v=${item.showcaseVideo}`;
  }

  return (
    <div className="container mx-auto px-4 w-full max-w-6xl relative z-10">
      <Link href="/shop" className="inline-flex items-center text-[#31BBE6] hover:-translate-x-1 transition-transform font-semibold mb-8 text-sm md:text-base">
        &larr; Retour à la boutique
      </Link>
      
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Visual section */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative">
          <div className="relative w-full max-w-[400px] aspect-square rounded-2xl flex justify-center items-center mb-6">
            {/* Glow effect based on rarity */}
            <div className="absolute inset-0 blur-3xl opacity-30 mix-blend-screen rounded-full" 
                 style={{ backgroundColor: 'var(--color-rarity-epic)' }}></div>
            
            <img 
              src={mainImageUrl} 
              alt={activeItem.name} 
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
            />
          </div>
          
          {videoUrl && (
            <Link 
              href={videoUrl}
              target="_blank"
              className="mt-4 px-6 py-3 bg-red-600/90 hover:bg-red-500 text-white font-display uppercase tracking-widest rounded-lg transition-transform hover:-translate-y-1 shadow-[0_4px_15px_rgba(220,38,38,0.4)] flex items-center gap-2"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Voir l'aperçu vidéo
            </Link>
          )}
        </div>

        {/* Info section */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-display text-white mb-2 uppercase tracking-wide">
            {activeItem.name}
          </h1>
          
          <p className="text-gray-300 text-lg mb-8 italic">
            {activeItem.description || "Aucune description."}
          </p>
          
          <div className="flex flex-col gap-4 mb-8 bg-[#091C3E]/50 p-6 rounded-xl border border-white/5 shadow-inner">
            <div className="flex bg-[#0c1a3b]/80 backdrop-blur-md rounded-lg p-4 border border-white/5 justify-between">
              <span className="text-gray-400 font-semibold">Type:</span>
              <span className="text-white capitalize">{activeItem.type?.value || activeItem.type || "Inconnu"}</span>
            </div>
            <div className="flex bg-[#0c1a3b]/80 backdrop-blur-md rounded-lg p-4 border border-white/5 justify-between">
              <span className="text-gray-400 font-semibold">Rareté:</span>
              <span className="text-white capitalize font-display tracking-widest">{activeItem.rarity?.value || activeItem.rarity?.displayValue || "Commune"}</span>
            </div>
          </div>

          {/* Bundle / Related items */}
          {allItems.length > 1 && (
            <div className="mb-8 p-6 bg-[#0c1a3b]/60 rounded-xl border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Contenu inclus:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allItems.map((relItem, idx) => {
                  const relImg = relItem.image || relItem.images?.icon || relItem.images?.smallIcon || '/assets/icon.png';
                  const isActive = activeItem.id === relItem.id;
                  
                  return (
                    <button 
                      key={relItem.id || idx}
                      onClick={() => setActiveItem(relItem)}
                      className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        isActive 
                        ? 'bg-[#1A3E7A] border border-[#31BBE6] shadow-[0_0_15px_rgba(49,187,230,0.3)]' 
                        : 'bg-[#091C3E] border border-white/5 hover:border-white/20'
                      }`}
                    >
                      <img src={relImg} alt={relItem.name} className="w-12 h-12 object-contain" />
                      <div className="flex-col">
                        <div className="text-white font-semibold text-sm line-clamp-1">{relItem.name}</div>
                        <div className="text-gray-400 text-xs capitalize">{relItem.type?.value || relItem.type}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-[#1A3E7A]/40 p-6 rounded-2xl border border-white/10 mt-auto">
            <div className="flex items-center gap-4 mb-6">
              <img src="https://fortnite-api.com/images/vbuck.png" alt="V-Bucks" className="w-10 h-10 object-contain drop-shadow-lg" />
              <span className="text-4xl font-display text-white tracking-widest">{item.vbucks}</span>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <span className="text-2xl font-bold text-[#FFF12B] uppercase tracking-wide">
                Prix: {(item.price).toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <Link 
              href={paymentUrl} 
              target="_blank" 
              className="group block w-full bg-[#FFF12B] hover:bg-white text-[#091C3E] text-center py-4 rounded font-display text-xl uppercase tracking-widest transition-all duration-300 transform hover:-translate-y-1 shadow-[0_4px_15px_rgba(255,241,43,0.3)]"
            >
              Préparer ma commande
            </Link>

            <div className="mt-6 p-4 bg-[rgba(123,104,238,0.1)] border-l-4 border-[#31BBE6] rounded text-sm text-white/80 leading-relaxed">
              <strong>NB:</strong> Le skin n'est pas reçu immédiatement. Tu devras ajouter un compte en ami, attendre 48h , et le compte t'offrira le skin selon les règles de Fortnite.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
