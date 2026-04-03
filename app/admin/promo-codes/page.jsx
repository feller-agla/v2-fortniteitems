"use client";
import { useState, useEffect } from "react";
import { TagIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function PromoCodesPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState(0);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/promo");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setCodes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCode = async (e) => {
    e.preventDefault();
    if (!newCode) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode, discount_percentage: newDiscount }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de création");
      }
      setNewCode("");
      setNewDiscount(0);
      fetchCodes();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleCodeStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/admin/promo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!res.ok) throw new Error("Erreur de mise à jour");
      fetchCodes();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCode = async (id) => {
    if (!confirm("Supprimer ce code définitivement ?")) return;
    try {
      const res = await fetch(`/api/admin/promo/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur de suppression");
      fetchCodes();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display text-white tracking-widest text-3d mb-2">CODES PROMO</h1>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Gérez vos partenariats et réductions boutique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire d'ajout */}
        <div className="lg:col-span-1">
          <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-fortnite-yellow opacity-50"></div>
            <h2 className="text-xl font-display text-fortnite-yellow mb-6 uppercase tracking-widest flex items-center gap-2">
              <PlusIcon className="w-5 h-5" /> NOUVEAU CODE
            </h2>
            <form onSubmit={handleAddCode} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#B0B8C8] uppercase tracking-widest mb-2">CODE (EX: LAMA)</label>
                <input 
                  type="text" 
                  value={newCode} 
                  onChange={(e) => setNewCode(e.target.value)} 
                  className="w-full bg-black/40 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-bold uppercase tracking-widest focus:outline-none focus:border-fortnite-yellow transition-all"
                  placeholder="EX: PARTENAIRE"
                />
              </div>
              <button 
                type="submit" 
                disabled={isAdding || !newCode}
                className="btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue w-full py-4 shadow-[0_4px_0_rgba(180,160,0,1)] disabled:opacity-50"
              >
                <span className="btn-fortnite-inner font-bold tracking-widest uppercase">
                  {isAdding ? "CRÉATION..." : "CRÉER LE CODE"}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Liste des codes */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center p-20">
              <div className="w-12 h-12 border-4 border-white/10 border-t-fortnite-yellow rounded-full animate-spin"></div>
            </div>
          ) : codes.length === 0 ? (
            <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-12 text-center">
              <TagIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest">Aucun code promo trouvé</p>
            </div>
          ) : (
            <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b-2 border-white/10 uppercase tracking-[0.2em] text-[10px] font-black text-gray-400">
                    <th className="px-6 py-4">CODE</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4">CRÉÉ LE</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {codes.map((code) => (
                    <tr key={code.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-display text-xl text-white tracking-widest uppercase">{code.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleCodeStatus(code.id, code.is_active)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            code.is_active 
                              ? "bg-rarity-uncommon/20 text-rarity-uncommon border border-rarity-uncommon/30" 
                              : "bg-rarity-marvel/20 text-rarity-marvel border border-rarity-marvel/30"
                          }`}
                        >
                          {code.is_active ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                          {code.is_active ? "ACTIF" : "INACTIF"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                        {new Date(code.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteCode(code.id)}
                          className="p-2 text-gray-500 hover:text-rarity-marvel hover:bg-rarity-marvel/10 rounded-lg transition-all"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
