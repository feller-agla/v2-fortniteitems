"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getAuthHeaders } from "../lib/supabase";
import {
  UsersIcon,
  CurrencyDollarIcon,
  TagIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const fetchStats = async (showLoader = true) => {
    if (showLoader && !data) setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/partner/stats", { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors du chargement");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchStats(true);
    }
  }, [user]);

  // Premier chargement uniquement
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-8 border-[#0c1a3b] border-t-fortnite-yellow rounded-full animate-spin mb-6"></div>
        <p className="text-fortnite-yellow font-display text-2xl animate-pulse tracking-widest">CHARGEMENT...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-[#051024] border-4 border-rarity-marvel rounded-2xl p-10 text-center max-w-xl mx-auto mt-20">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-2xl font-display text-white mb-3 tracking-widest">ERREUR</h2>
        <p className="text-red-300 font-medium mb-6">{error}</p>
        <button onClick={() => fetchStats(true)} className="btn-fortnite bg-fortnite-yellow text-fortnite-blue px-8 py-3">
          <span className="btn-fortnite-inner font-bold">RÉESSAYER</span>
        </button>
      </div>
    );
  }

  const { codes = [], stats = {} } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-normal text-white text-3d tracking-widest mb-2">
            MES <span className="text-fortnite-yellow text-3d-yellow">STATS</span>
          </h1>
          <p className="text-[#B0B8C8] font-bold text-sm tracking-wider uppercase">
            Bienvenue dans votre espace partenaire
          </p>
        </div>
        <button
          onClick={() => fetchStats(false)}
          disabled={loading}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-fortnite-yellow/50 transition-colors">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-fortnite-yellow/10 rounded-full blur-2xl group-hover:bg-fortnite-yellow/20 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-fortnite-yellow/20 rounded-xl">
              <UsersIcon className="w-6 h-6 text-fortnite-yellow" />
            </div>
            <p className="text-[10px] font-black text-[#B0B8C8] uppercase tracking-widest">UTILISATIONS</p>
          </div>
          <p className="text-4xl sm:text-5xl font-display text-white text-3d">{stats.totalUses || 0}</p>
          <p className="text-xs text-gray-500 mt-2 font-bold uppercase">Commandes avec ton code</p>
        </div>

        <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-fortnite-yellow/50 transition-colors">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-[10px] font-black text-[#B0B8C8] uppercase tracking-widest">REVENUS GÉNÉRÉS</p>
          </div>
          <p className="text-4xl sm:text-5xl font-display text-green-400">{(stats.totalRevenue || 0).toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500 mt-2 font-bold uppercase">FCFA au total</p>
        </div>

        <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-fortnite-yellow/50 transition-colors">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <TagIcon className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-[10px] font-black text-[#B0B8C8] uppercase tracking-widest">CODES ACTIFS</p>
          </div>
          <p className="text-4xl sm:text-5xl font-display text-blue-400">{stats.activeCodesCount || 0}</p>
          <p className="text-xs text-gray-500 mt-2 font-bold uppercase">Codes de parrainage</p>
        </div>
      </div>

      {/* Codes Detail */}
      {codes.length > 0 && (
        <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b-2 border-white/5 bg-black/30">
            <h2 className="text-xl font-display text-fortnite-yellow tracking-widest flex items-center gap-2">
              <TagIcon className="w-5 h-5" /> MES CODES
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-[#091C3E] text-[#B0B8C8] font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Commission</th>
                  <th className="p-4">Utilisations</th>
                  <th className="p-4">Revenus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <span className="font-display text-xl text-white tracking-widest">{code.code}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        code.is_active
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}>
                        {code.is_active ? "ACTIF" : "INACTIF"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-[10px] font-bold text-fortnite-yellow space-y-0.5">
                        <p>≤ 1000 VB → <span className="text-white">5%</span></p>
                        <p>1000–1499 VB → <span className="text-white">7%</span></p>
                        <p>1500+ VB → <span className="text-white">10%</span></p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-display text-lg">{code.uses}</span>
                    </td>
                    <td className="p-4 text-green-400 font-bold">{(code.revenue || 0).toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
