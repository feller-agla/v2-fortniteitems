"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function AdminProducts() {
  const [products] = useState([
    { id: 1, name: "1000 V-Bucks", price: 5000, type: "vbucks_pack", rarity: "rare" },
    { id: 2, name: "2800 V-Bucks", price: 12500, type: "vbucks_pack", rarity: "epic" },
    { id: 3, name: "Skin Aura", price: 2500, type: "shop_item", rarity: "uncommon" },
    { id: 4, name: "Skin Midas", price: 5000, type: "shop_item", rarity: "legendary" },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-normal text-white text-3d tracking-widest mb-2">
            GESTION DES <span className="text-fortnite-yellow text-3d-yellow">PRODUITS</span>
          </h1>
          <p className="text-[#B0B8C8] font-bold text-sm tracking-wider uppercase">
            AJOUTER, MODIFIER OU SUPPRIMER DES ARTICLES
          </p>
        </div>
        
        <button className="btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue px-6 py-3 shadow-[0_4px_0_rgba(180,160,0,1)] hover:shadow-[0_2px_0_rgba(180,160,0,1)] transition-all shrink-0">
          <span className="btn-fortnite-inner font-bold flex items-center justify-center gap-2 mt-1">
            <PlusIcon className="w-5 h-5 font-bold" />
            NOUVEAU PRODUIT
          </span>
        </button>
      </div>

      <div className="bg-[#051024] rounded-2xl border-2 border-[#1A3E7A] shadow-[0_15px_30px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="p-4 md:p-6 bg-black/40 border-b-2 border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button className="px-4 py-2 bg-fortnite-blue text-white font-bold text-xs tracking-widest uppercase rounded">TOUS</button>
            <button className="px-4 py-2 bg-transparent hover:bg-white/5 text-gray-400 font-bold text-xs tracking-widest uppercase rounded transition-colors whitespace-nowrap">V-BUCKS</button>
            <button className="px-4 py-2 bg-transparent hover:bg-white/5 text-gray-400 font-bold text-xs tracking-widest uppercase rounded transition-colors whitespace-nowrap">BOUTIQUE DU JOUR</button>
          </div>
          <div className="w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full bg-black/60 border-2 border-white/10 rounded-xl px-4 py-2 text-white font-sans focus:border-fortnite-yellow focus:outline-none transition-colors shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-[#091C3E] text-[#B0B8C8] font-bold uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4 min-w-[200px]">Nom</th>
                <th className="p-4">Type</th>
                <th className="p-4">Prix</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-bold">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-gray-400">#{product.id}</td>
                  <td className="p-4 text-white flex items-center gap-3">
                    <div className={`w-10 h-10 rounded bg-[#091C3E] border border-white/10 flex items-center justify-center overflow-hidden relative shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]`}>
                      <div className={`absolute inset-0 opacity-40 mix-blend-screen ${
                        product.rarity === 'legendary' ? 'bg-rarity-legendary' 
                        : product.rarity === 'epic' ? 'bg-rarity-epic'
                        : product.rarity === 'rare' ? 'bg-rarity-rare'
                        : 'bg-rarity-uncommon'
                      }`} />
                    </div>
                    {product.name}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-white/10 text-[10px] tracking-widest uppercase rounded border border-white/10 text-gray-300">
                      {product.type === 'vbucks_pack' ? 'V-Bucks' : 'Boutique'}
                    </span>
                  </td>
                  <td className="p-4 text-fortnite-yellow">{product.price.toLocaleString('fr-FR')} FCFA</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded transition-colors border border-blue-500/30" title="Modifier">
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-colors border border-red-500/30" title="Supprimer">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
