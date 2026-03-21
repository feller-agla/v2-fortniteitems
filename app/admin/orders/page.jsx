"use client";
import { useState, useEffect } from "react";
import { formatLocaleDate } from "@/app/lib/datetime";
import { getCustomerDisplayName } from "@/app/lib/customer-display";
import { CheckCircleIcon, XMarkIcon, EyeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Erreur lors de la récupération des commandes");
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      
      // Update local state for immediate feedback
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e) {
      alert(e.message);
    }
  };
  const statusLabel = (s) => {
    switch (s) {
      case "pending": return { label: "À confirmer", cls: "bg-fortnite-yellow/20 text-fortnite-yellow border-fortnite-yellow/50" };
      case "processing": return { label: "En cours", cls: "bg-rarity-rare/20 text-rarity-rare border-rarity-rare/50" };
      case "shipping": return { label: "En livraison", cls: "bg-blue-500/20 text-blue-400 border-blue-500/50" };
      case "delivered": return { label: "Livrée", cls: "bg-rarity-uncommon/20 text-rarity-uncommon border-rarity-uncommon/50" };
      case "cancelled": return { label: "Annulée", cls: "bg-rarity-marvel/20 text-rarity-marvel border-rarity-marvel/50" };
      default: return { label: s, cls: "bg-white/10 text-white border-white/20" };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-normal text-white text-3d tracking-widest mb-2">
            SUIVI DES <span className="text-fortnite-yellow text-3d-yellow">COMMANDES</span>
          </h1>
          <p className="text-[#B0B8C8] font-bold text-sm tracking-wider uppercase">
            {orders.length} COMMANDES AU TOTAL
          </p>
        </div>
        <button 
          onClick={fetchOrders} 
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-xl transition-colors"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-rarity-marvel/20 border border-rarity-marvel/50 rounded-xl p-4 text-red-300 font-bold text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-[#051024] rounded-2xl border-2 border-[#1A3E7A] shadow-[0_15px_30px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Filters */}
        <div className="p-4 md:p-6 bg-black/40 border-b-2 border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            {[[ "all", "TOUTES" ], [ "pending", "À CONFIRMER" ], [ "processing", "EN COURS" ], [ "shipping", "LIVRAISON" ], [ "delivered", "LIVRÉES" ], [ "cancelled", "ANNULÉES" ]].map(([ val, label ]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-4 py-2 font-bold text-xs tracking-widest uppercase rounded whitespace-nowrap transition-colors ${filter === val ? "bg-fortnite-blue text-white" : "bg-transparent hover:bg-white/5 text-gray-400"}`}
              >
                {label}
                {val !== "all" && orders.filter(o => o.status === val).length > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${val === 'pending' ? 'bg-fortnite-yellow text-black' : 'bg-white/20 text-white'}`}>
                    {orders.filter(o => o.status === val).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-16 text-center">
            <div className="text-2xl font-display text-fortnite-yellow animate-pulse tracking-widest">CHARGEMENT...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-2xl font-display text-gray-500 tracking-widest">AUCUNE COMMANDE</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-[#091C3E] text-[#B0B8C8] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4 min-w-[150px]">Client</th>
                  <th className="p-4">Montant</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-bold">
                {filteredOrders.map((order) => {
                  const { label, cls } = statusLabel(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-white font-display tracking-wider text-xs">{order.id?.slice(0, 8)}...</td>
                      <td className="p-4">
                        <div className="text-white group-hover:text-fortnite-yellow transition-colors">{getCustomerDisplayName(order.customer_data)}</div>
                        <div className="text-[10px] text-gray-500 font-normal">{order.customer_data?.email || "-"}</div>
                      </td>
                      <td className="p-4 text-fortnite-yellow">{Number(order.amount).toLocaleString("fr-FR")} FCFA</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded text-[10px] tracking-widest uppercase border inline-flex items-center justify-center min-w-[100px] ${cls}`}>
                          {label}
                        </span>
                      </td>
                      <td className="p-4 text-[#B0B8C8]">
                        {order.created_at ? formatLocaleDate(order.created_at, { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="p-4 flex gap-2 justify-end">
                        {order.status === "pending" && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(order.id, 'processing')}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded transition-colors border border-blue-500/30" 
                              title="Passer en cours"
                            >
                              <ArrowPathIcon className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-colors border border-red-500/30" 
                              title="Annuler"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {order.status === "processing" && (
                          <button 
                            onClick={() => handleStatusChange(order.id, 'shipping')}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded transition-colors border border-blue-500/30" 
                            title="Passer en livraison"
                          >
                            <ArrowPathIcon className="w-5 h-5" />
                          </button>
                        )}
                        {order.status === "shipping" && (
                          <button 
                            onClick={() => handleStatusChange(order.id, 'delivered')}
                            className="p-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded transition-colors border border-green-500/30" 
                            title="Marquer comme livré"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                        <a
                          href={`/messages?orderId=${order.id}`}
                          className="p-2 bg-fortnite-yellow/20 hover:bg-fortnite-yellow/40 text-fortnite-yellow rounded transition-colors border border-fortnite-yellow/30"
                          title="Ouvrir Chat"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.777-.332 48.29 48.29 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                          </svg>
                        </a>
                        <a
                          href={order.lygos_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded transition-colors border border-blue-500/30"
                          title="Voir lien paiement"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
