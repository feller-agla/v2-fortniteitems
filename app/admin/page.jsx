"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  UsersIcon, 
  ArrowTrendingUpIcon 
} from "@heroicons/react/24/outline";

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    { name: "REVENUS DU MOIS", value: "---", icon: CurrencyDollarIcon, color: "text-fortnite-yellow", bg: "bg-fortnite-yellow/10", border: "border-fortnite-yellow/50" },
    { name: "COMMANDES ACTIVES", value: "---", icon: ShoppingBagIcon, color: "text-rarity-rare", bg: "bg-rarity-rare/10", border: "border-rarity-rare/50" },
    { name: "NOUVEAUX CLIENTS", value: "---", icon: UsersIcon, color: "text-rarity-epic", bg: "bg-rarity-epic/10", border: "border-rarity-epic/50" },
    { name: "TAUX DE CONVERSION", value: "4.8%", icon: ArrowTrendingUpIcon, color: "text-rarity-uncommon", bg: "bg-rarity-uncommon/10", border: "border-rarity-uncommon/50" },
  ]);

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Stats
        const statsRes = await fetch('/api/admin/stats');
        const statsData = await statsRes.json();
        
        if (statsData.success) {
          setStats(prev => [
            { ...prev[0], value: statsData.stats.monthlyRevenue },
            { ...prev[1], value: statsData.stats.activeOrders.toString() },
            { ...prev[2], value: statsData.stats.newClients.toString() },
            { ...prev[3], value: statsData.stats.conversionRate },
          ]);
        }

        // Fetch Recent Orders
        const ordersRes = await fetch('/api/orders');
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) {
          setRecentOrders(ordersData.slice(0, 5).map(o => ({
            id: `#${o.id.slice(0, 8)}`,
            customer: o.customer_data?.name || "Joueur",
            amount: `${o.amount.toLocaleString()} FCFA`,
            status: o.status === 'pending' ? 'En attente' : 'Complétée',
            date: new Date(o.created_at).toLocaleDateString('fr-FR')
          })));
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-4xl md:text-5xl font-display font-normal text-white text-3d tracking-widest mb-2">
          VUE <span className="text-fortnite-yellow text-3d-yellow">D'ENSEMBLE</span>
        </h1>
        <p className="text-[#B0B8C8] font-bold text-sm tracking-wider uppercase">
          RÉSUMÉ DES ACTIVITÉS DE LA BOUTIQUE
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-[#051024] p-6 rounded-2xl border-2 ${stat.border} shadow-[0_10px_20px_rgba(0,0,0,0.5),_inset_0_2px_10px_rgba(255,255,255,0.05)] relative overflow-hidden group`}
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-20 ${stat.bg} pointer-events-none transition-opacity group-hover:opacity-40`}></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[#B0B8C8] font-bold text-[10px] md:text-xs tracking-widest uppercase mb-1">{stat.name}</p>
                <p className={`text-2xl md:text-3xl font-display font-normal ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-black/40 border border-white/5 shadow-inner`}>
                <stat.icon className={`w-8 h-8 ${stat.color} drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-[#051024] rounded-2xl border-2 border-[#1A3E7A] shadow-[0_15px_30px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="p-6 border-b-2 border-white/5 flex justify-between items-center bg-black/40">
            <h2 className="text-2xl font-display tracking-widest text-white text-3d">COMMANDES RÉCENTES</h2>
            <button className="text-xs font-bold text-fortnite-yellow tracking-widest uppercase hover:underline">Voir tout</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-[#091C3E] text-[#B0B8C8] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Montant</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-bold">
                {recentOrders.map((order, i) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-white">{order.id}</td>
                    <td className="p-4 text-white group-hover:text-fortnite-yellow transition-colors">{order.customer}</td>
                    <td className="p-4 text-fortnite-yellow">{order.amount}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded text-[10px] tracking-widest uppercase border ${
                        order.status === 'En attente' 
                          ? 'bg-fortnite-yellow/20 text-fortnite-yellow border-fortnite-yellow/50' 
                          : 'bg-rarity-uncommon/20 text-rarity-uncommon border-rarity-uncommon/50'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-[#B0B8C8]">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#051024] rounded-2xl border-2 border-[#1A3E7A] shadow-[0_15px_30px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="p-6 border-b-2 border-white/5 bg-black/40">
            <h2 className="text-2xl font-display tracking-widest text-white text-3d">ACTIONS RAPIDES</h2>
          </div>
          <div className="p-6 space-y-4">
            <button className="btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue w-full py-4 text-sm shadow-[0_4px_0_rgba(180,160,0,1)] hover:shadow-[0_2px_0_rgba(180,160,0,1)] transition-all">
              <span className="btn-fortnite-inner font-bold flex items-center justify-center gap-2">
                AJOUTER UN PRODUIT
              </span>
            </button>
            <button className="btn-fortnite bg-white/10 hover:bg-white text-white hover:text-fortnite-blue w-full py-4 text-sm border-2 border-white/20 hover:border-white transition-all shadow-[0_4px_0_rgba(255,255,255,0.2)] hover:shadow-[0_2px_0_rgba(255,255,255,1)]">
              <span className="btn-fortnite-inner font-bold">
                METTRE À JOUR LA BOUTIQUE
              </span>
            </button>
            <button className="btn-fortnite bg-white/10 hover:bg-white text-white hover:text-fortnite-blue w-full py-4 text-sm border-2 border-white/20 hover:border-white transition-all shadow-[0_4px_0_rgba(255,255,255,0.2)] hover:shadow-[0_2px_0_rgba(255,255,255,1)]">
              <span className="btn-fortnite-inner font-bold">
                EXPORTER LES COMMANDES
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
