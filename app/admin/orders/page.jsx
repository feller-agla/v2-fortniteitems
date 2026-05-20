"use client";
import { useState, useEffect, Fragment } from "react";
import { formatLocaleDate } from "@/app/lib/datetime";
import { getCustomerDisplayName } from "@/app/lib/customer-display";
import { getAuthHeaders } from "@/app/lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { CheckCircleIcon, XMarkIcon, EyeIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon, ShoppingBagIcon, UserIcon, TrashIcon } from "@heroicons/react/24/outline";

function getPartnerGainForItem(item) {
  const vbucks = Number(item.vbucks) || 0;
  const lamasPrice = Number(item.price) || 0;
  const quantity = Number(item.quantity) || 1;

  let percentage = 0.05; // Palier 1 : 5%
  if (vbucks >= 1000 && vbucks <= 1499) {
    percentage = 0.07; // Palier 2 : 7%
  } else if (vbucks >= 1500) {
    percentage = 0.10; // Palier 3 : 10%
  }

  return lamasPrice * percentage * quantity;
}

function calculateOrderEarnings(order) {
  const items = order.items_data || [];
  let totalEarnings = 0;
  for (const item of items) {
    totalEarnings += getPartnerGainForItem(item);
  }
  return Math.round(totalEarnings);
}

export default function AdminOrders() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchOrders = async () => {
    if (!user || profile?.role !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/orders", { headers });
      if (!res.ok) throw new Error("Erreur lors de la récupération des commandes");
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchOrders();
    }
  }, [user, profile]);

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

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

  const handleDeleteOrder = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette commande ? Cette action est irréversible.")) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setOrders(prev => prev.filter(o => o.id !== id));
      if (expandedOrderId === id) setExpandedOrderId(null);
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
                onClick={() => { setFilter(val); setExpandedOrderId(null); }}
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
            <table className="w-full text-left font-sans text-sm border-separate border-spacing-0">
              <thead className="bg-[#091C3E] text-[#B0B8C8] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                  <th className="p-4 w-10"></th>
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
                  const isExpanded = expandedOrderId === order.id;

                  const promoCode = order.customer_data?.promoCode || null;
                  const sonGain = promoCode ? calculateOrderEarnings(order) : 0;
                  const monGain = promoCode ? Math.max(0, Number(order.amount) - sonGain) : Number(order.amount);

                  return (
                    <Fragment key={order.id}>
                      <tr className={`hover:bg-white/5 transition-colors group cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`} onClick={() => toggleExpand(order.id)}>
                        <td className="p-4 text-center">
                          {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-fortnite-yellow" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                        </td>
                        <td className="p-4 text-white font-display tracking-wider text-xs">{order.id?.slice(0, 8)}...</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="text-white group-hover:text-fortnite-yellow transition-colors font-sans">{getCustomerDisplayName(order.customer_data)}</div>
                            {order.customer_data?.promoCode && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 uppercase tracking-wider">
                                {order.customer_data.promoCode}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 font-normal">{order.customer_data?.email || "-"}</div>
                        </td>
                        <td className="p-4 text-fortnite-yellow">
                          <div>{Number(order.amount).toLocaleString("fr-FR")} FCFA</div>
                          {promoCode && (
                            <div className="text-[10px] text-gray-400 font-normal mt-1 flex flex-col gap-1">
                              <span className="inline-block bg-[#020813] text-gray-300 font-bold px-2 py-0.5 rounded border border-white/5 w-fit">
                                Moi: <span className="text-rarity-uncommon font-extrabold">{monGain.toLocaleString("fr-FR")} FCFA</span> | Part: <span className="text-fortnite-yellow font-extrabold">{sonGain.toLocaleString("fr-FR")} FCFA</span>
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded text-[10px] tracking-widest uppercase border inline-flex items-center justify-center min-w-[100px] ${cls}`}>
                            {label}
                          </span>
                        </td>
                        <td className="p-4 text-[#B0B8C8] font-normal">
                          {order.created_at ? formatLocaleDate(order.created_at, { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                            {order.status === "pending" && (
                              <>
                                <button 
                                  onClick={() => handleStatusChange(order.id, 'processing')}
                                  className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded transition-colors border border-blue-500/30" 
                                  title="Passer en cours"
                                >
                                  <ArrowPathIcon className="w-5 h-5" />
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
                            
                            {/* Bouton Annuler */}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <button 
                                onClick={() => handleStatusChange(order.id, 'cancelled')}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors border border-red-500/20" 
                                title="Annuler la commande"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            )}
                            
                            {/* Bouton Supprimer */}
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 bg-rarity-marvel/10 hover:bg-rarity-marvel/30 text-rarity-marvel rounded transition-colors border border-rarity-marvel/20" 
                              title="Supprimer définitivement"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>

                            <button 
                                onClick={() => toggleExpand(order.id)}
                                className={`p-2 rounded transition-colors border ${isExpanded ? 'bg-fortnite-yellow text-fortnite-blue border-fortnite-yellow' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}
                                title="Voir détails"
                            >
                                <EyeIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                          <td colSpan="7" className="p-0">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-l-4 border-fortnite-yellow">
                              {/* Left: Customer Data */}
                              <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-fortnite-yellow font-display tracking-widest text-sm bg-fortnite-yellow/10 p-2 rounded-lg inline-block px-4">
                                  <UserIcon className="w-4 h-4" />
                                  INFORMATIONS CLIENT
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Pseudo Epic</p>
                                    <p className="text-white text-lg font-display tracking-widest">{order.customer_data?.epicUsername || "Non défini"}</p>
                                  </div>
                                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Plateforme</p>
                                    <p className="text-white text-lg font-display tracking-widest">{order.customer_data?.device || "Inconnue"}</p>
                                  </div>
                                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Nom complet</p>
                                    <p className="text-white font-sans">{order.customer_data?.firstName} {order.customer_data?.lastName}</p>
                                  </div>
                                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">ID Order</p>
                                    <p className="text-[10px] text-gray-400 break-all">{order.id}</p>
                                  </div>
                                  {order.customer_data?.promoCode && (
                                    <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20 col-span-2 flex justify-between items-center">
                                      <div>
                                        <p className="text-[10px] text-green-400 uppercase tracking-widest mb-0.5">Code Créateur Utilisé</p>
                                        <p className="text-white font-display tracking-widest text-base">{order.customer_data.promoCode}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] text-green-400 uppercase tracking-widest mb-0.5">Réduction</p>
                                        <p className="text-white font-bold text-base">-{order.customer_data.promoDiscount || 20}%</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <a
                                      href={`/admin/messages?orderId=${order.id}`}
                                      className="flex items-center gap-2 px-4 py-2 bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue rounded-xl font-bold text-xs transition-colors shadow-lg"
                                    >
                                      💬 OUVRIR LE CHAT
                                    </a>
                                    <a
                                      href={order.lygos_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-colors shadow-lg"
                                    >
                                      🔗 LIEN DE PAIEMENT
                                    </a>
                                </div>
                              </div>

                              {/* Right: Items Data */}
                              <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-fortnite-yellow font-display tracking-widest text-sm bg-fortnite-yellow/10 p-2 rounded-lg inline-block px-4">
                                  <ShoppingBagIcon className="w-4 h-4" />
                                  ARTICLES COMMANDÉS
                                </h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {order.items_data?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10 group/item hover:bg-white/10 transition-colors">
                                      <div className="w-14 h-14 bg-black/40 rounded-lg flex items-center justify-center p-1 border border-white/10 shrink-0">
                                        <img src={item.image || "/assets/1000vbucks.png"} alt="" className="max-w-full max-h-full object-contain drop-shadow-lg" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate uppercase tracking-wide">{item.name}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-[11px] text-gray-400">Qté: <span className="text-white">{item.quantity}</span></p>
                                            <p className="text-fortnite-yellow font-bold text-xs">{Number(item.price * item.quantity).toLocaleString("fr-FR")} FCFA</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="bg-fortnite-blue/40 border-2 border-white/10 p-3 rounded-xl flex justify-between items-center mt-auto">
                                    <span className="text-white font-display tracking-widest text-sm">TOTAL PAYÉ</span>
                                    <span className="text-xl text-fortnite-yellow font-display text-3d-yellow">{Number(order.amount).toLocaleString("fr-FR")} FCFA</span>
                                </div>
                                {promoCode && (
                                  <div className="bg-black/60 border border-white/5 p-4 rounded-xl flex flex-col gap-2 mt-3">
                                    <span className="text-gray-400 font-display tracking-widest text-[10px] uppercase">RÉPARTITION DES GAINS</span>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-gray-400">Ma part (Admin) :</span>
                                      <span className="text-rarity-uncommon font-bold">{monGain.toLocaleString("fr-FR")} FCFA</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                                      <span className="text-gray-400">Part du partenaire ({promoCode}) :</span>
                                      <span className="text-fortnite-yellow font-bold">{sonGain.toLocaleString("fr-FR")} FCFA</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
