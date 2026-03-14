"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import ChatWidget from "../components/ChatWidget";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/app/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronDownIcon, 
  MagnifyingGlassIcon, 
  ShoppingBagIcon, 
  ClockIcon,
  CheckBadgeIcon,
  TruckIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function OrdersPage() {
  const { user, isAuthReady } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (isAuthReady && !user) {
      router.push("/login?redirect=/orders");
    }
  }, [user, isAuthReady, router]);

  // Fetch all orders for the user
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      setError("");
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .filter('customer_data->>id', 'eq', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setOrders(data || []);
        setFilteredOrders(data || []);
        
        // Auto-expand if orderId in URL
        const urlOrderId = searchParams.get('orderId') || searchParams.get('order_id');
        if (urlOrderId) {
            // Finding the order either by exact ID or short ID (8 chars)
            const matchedOrder = data.find(o => o.id === urlOrderId || o.id.startsWith(urlOrderId));
            if (matchedOrder) {
                setExpandedOrderId(matchedOrder.id);
            }
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
        setError("Erreur lors de la récupération de vos commandes.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchUserOrders();
    }
  }, [user?.id, searchParams]);

  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = orders.filter(o => 
        o.id.toLowerCase().includes(query) || 
        (o.customer_data?.name && o.customer_data.name.toLowerCase().includes(query)) ||
        o.status.toLowerCase().includes(query)
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const getStatusInfo = (status) => {
    switch (status) {
      case "pending": return { label: "À confirmer", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30", icon: <ClockIcon className="w-4 h-4" /> };
      case "processing": return { label: "En préparation", color: "text-electric-blue", bg: "bg-electric-blue/10", border: "border-electric-blue/30", icon: <ArrowPathIcon className="w-4 h-4 animate-spin" /> };
      case "shipping": return { label: "En livraison", color: "text-purple-400", bg: "bg-purple-900/20", border: "border-purple-500/30", icon: <TruckIcon className="w-4 h-4 animate-pulse" /> };
      case "delivered": return { label: "Livrée", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", icon: <CheckBadgeIcon className="w-4 h-4" /> };
      case "cancelled": return { label: "Annulée", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: <ExclamationCircleIcon className="w-4 h-4" /> };
      default: return { label: status, color: "text-gray-400", bg: "bg-white/10", border: "border-white/20", icon: null };
    }
  };

  const toggleAccordion = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (!isAuthReady || isLoading) {
    return (
      <main className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-2xl font-display text-electric-blue animate-pulse tracking-widest uppercase">Chargement...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-dark-bg text-white selection:bg-neon-pink/30 pb-20">
      <Navbar />
      
      <section className="pt-32 relative">
        <div className="container mx-auto px-4 z-10 relative max-w-5xl">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
              MES <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-purple-500 uppercase">Commandes</span>
            </h1>
            <p className="text-gray-400 font-sans text-lg max-w-2xl mx-auto">
              Suivez l'état de vos achats et accédez à vos contenus numériques en temps réel.
            </p>
          </div>

          <div className="bg-card-bg/50 border border-white/10 rounded-2xl p-4 md:p-6 mb-12 shadow-deep backdrop-blur-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher par ID, status ou article..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-4 text-white font-sans focus:outline-none focus:border-electric-blue transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-500 text-center mb-8">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-card-bg/20 border border-dashed border-white/10 rounded-2xl">
                <ShoppingBagIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest">Aucune commande trouvée</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderAccordionItem 
                  key={order.id} 
                  order={order} 
                  isExpanded={expandedOrderId === order.id}
                  onToggle={() => toggleAccordion(order.id)}
                  getStatusInfo={getStatusInfo}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <ChatWidget />
    </main>
  );
}

function OrderAccordionItem({ order, isExpanded, onToggle, getStatusInfo }) {
  const statusInfo = getStatusInfo(order.status);
  
  return (
    <div 
      className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-electric-blue/50 bg-[#0A1628]' : 'border-white/5 bg-card-bg/40 hover:border-white/20'}`}
    >
      {/* Header */}
      <button 
        onClick={onToggle}
        className="w-full text-left p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
            <ShoppingBagIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">ID:</span>
              <span className="font-display font-bold text-white tracking-widest">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
              {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 flex-1 w-full md:w-auto">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-gray-500 uppercase">Montant</div>
            <div className="text-lg font-black text-white">{Number(order.amount).toLocaleString('fr-FR')} FCFA</div>
          </div>

          <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </div>

          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
             <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-8 border-t border-white/5 pt-8">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Timeline Section */}
                 <div className="lg:col-span-2">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <ArrowPathIcon className="w-4 h-4" /> État de la livraison
                    </h4>
                    <OrderTimeline status={order.status} />
                 </div>

                 {/* Actions & Summary Section */}
                 <div className="space-y-6">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Résumé des articles</h4>
                        <div className="space-y-3">
                            {order.items_data?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-gray-400">{item.name}</span>
                                    <span>{item.price} V-Bucks</span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-white">Total</span>
                                <span className="text-lg font-black text-electric-blue">{Number(order.amount).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <a 
                            href={`/messages?orderId=${order.id}`}
                            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-electric-blue hover:bg-cyan-400 text-white rounded-xl font-display font-bold text-sm transition-all shadow-lg shadow-electric-blue/20"
                        >
                            <ChatBubbleLeftRightIcon className="w-5 h-5" /> Contacter le Support
                        </a>
                        <button 
                            onClick={onToggle}
                            className="w-full py-3 px-6 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-display font-medium text-sm transition-all text-center"
                        >
                            Fermer les détails
                        </button>
                    </div>
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderTimeline({ status }) {
  const steps = [
    { id: 'pending', label: 'Paiement', icon: '💳', desc: 'En attente / Reçu' },
    { id: 'processing', label: 'Préparation', icon: '⚙️', desc: 'Accès au compte' },
    { id: 'shipping', label: 'Livraison', icon: '🚀', desc: 'Transfert V-Bucks' },
    { id: 'delivered', label: 'Terminé', icon: '✅', desc: 'Livraison réussie' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === status);
  const activeIndex = status === 'cancelled' ? -1 : (currentStepIndex === -1 && status === 'delivered' ? 3 : currentStepIndex);

  return (
    <div className="relative">
      {/* Connector Line */}
      <div className="absolute left-6 md:left-[50%] md:-translate-x-1/2 top-4 bottom-4 w-1 bg-white/5 rounded-full hidden sm:block"></div>
      
      <div className="space-y-8 relative">
        {steps.map((step, idx) => {
          const isCompleted = activeIndex >= idx;
          const isActive = activeIndex === idx;
          
          return (
            <div key={step.id} className="relative flex items-start gap-6 md:justify-center md:text-center">
              {/* Desktop Left Spacer */}
              <div className="hidden md:block w-[40%] text-right pr-6 self-center">
                  {idx % 2 === 0 && (
                      <div className={`transition-all duration-500 ${isCompleted ? 'opacity-100' : 'opacity-20'}`}>
                          <h5 className="font-display font-bold text-white text-sm uppercase">{step.label}</h5>
                          <p className="text-[10px] text-gray-500 mt-0.5">{step.desc}</p>
                      </div>
                  )}
              </div>

              {/* Icon / Circle */}
              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${
                isCompleted 
                ? 'border-electric-blue bg-dark-bg text-electric-blue shadow-[0_0_15px_rgba(0,212,255,0.3)]' 
                : 'border-white/10 bg-dark-bg text-white/10'
              }`}>
                <span className={`text-xl ${isActive ? 'animate-pulse' : ''}`}>{step.icon}</span>
              </div>

              {/* Desktop Right Spacer / Mobile Content */}
              <div className="md:w-[40%] text-left md:pl-6 self-center">
                  <div className={`transition-all duration-500 md:block ${isCompleted ? 'opacity-100' : 'opacity-20'}`}>
                      {(idx % 2 !== 0 || typeof window !== 'undefined' && window.innerWidth < 768) && (
                          <>
                              <h5 className="font-display font-bold text-white text-sm uppercase">{step.label}</h5>
                              <p className="text-[10px] text-gray-500 mt-0.5">{step.desc}</p>
                          </>
                      )}
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ArrowPathIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);
