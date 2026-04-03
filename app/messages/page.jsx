"use client";
import { useState, useEffect, useRef, Suspense } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { supabase, getAuthHeaders } from '@/app/lib/supabase';
import { formatLocaleDate, formatLocaleTime } from '@/app/lib/datetime';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UserMessagesContent() {
  const { user, loading: authLoading, isAuthReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get('orderId');
  
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const scrollRef = useRef(null);
  const lastFetchedUserId = useRef(null);

  // Auto-select order from query
  useEffect(() => {
    if (queryOrderId && !selectedOrderId) {
      setSelectedOrderId(queryOrderId);
    }
  }, [queryOrderId]);

  useEffect(() => {
    console.log('[DEBUG] UserMessages State:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authLoading, 
      fetchingOrders, 
      ordersCount: orders.length 
    });
  }, [user, authLoading, fetchingOrders, orders]);

  // Redirect if not logged in
  useEffect(() => {
    if (isAuthReady && !user) {
      router.push('/login');
    }
  }, [user, isAuthReady, router]);

  // Fetch user's orders
  const fetchUserOrders = async () => {
    if (!user?.id) return;
    
    // Prevent redundant fetches if we already fetched for this user and have orders
    if (lastFetchedUserId.current === user.id && orders.length > 0) return;
    
    console.log('[DEBUG] fetchUserOrders triggered for:', user.id);
    setFetchingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .filter('customer_data->>id', 'eq', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('[DEBUG] Orders fetched:', data?.length || 0);
      setOrders(data || []);
      lastFetchedUserId.current = user.id;
      
      if (data && data.length > 0 && !selectedOrderId) {
        setSelectedOrderId(data[0].id);
      }
    } catch (err) {
      console.error('[DEBUG] Fetch orders error:', err);
    } finally {
      setFetchingOrders(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      if (lastFetchedUserId.current !== user.id) {
        fetchUserOrders();
      }
    }
  }, [user?.id]);

  // Fetch messages for selected order
  useEffect(() => {
    if (!selectedOrderId) return;
    
    const fetchMessages = async () => {
      try {
        const headers = await getAuthHeaders();
        // If auth isn't ready yet, don't spam the API with 401s
        if (!headers?.Authorization) return;
        const res = await fetch(`/api/messages?orderId=${selectedOrderId}`, { headers, cache: 'no-store' });
        if (res.status === 401) return;
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      } catch (e) {
        console.warn('[messages] fetchMessages failed', e);
      }
    };

    fetchMessages();
    const poll = setInterval(fetchMessages, 4000);

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`user-chat-${selectedOrderId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `order_id=eq.${selectedOrderId}`
      }, (payload) => {
        setMessages((prev) => {
          const next = payload.new;
          if (!next?.id) return prev;
          if (prev.some((m) => m.id === next.id)) return prev;
          return [...prev, next];
        });
      })
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [selectedOrderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedOrderId) return;

    setLoading(true);
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticText = inputText;
    setInputText('');
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        order_id: selectedOrderId,
        sender_id: user?.id || null,
        content: optimisticText,
        text: optimisticText,
        is_admin_sender: false,
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) throw new Error('Session expirée, reconnectez-vous.');
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ orderId: selectedOrderId, text: optimisticText, isAdmin: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur envoi');
      setMessages((prev) => {
        if (data?.id && prev.some((m) => m.id === data.id)) {
          return prev.filter((m) => m.id !== optimisticId);
        }
        return prev.map((m) =>
          m.id === optimisticId ? { ...data, text: data.content ?? data.text ?? optimisticText } : m
        );
      });
      // Immediate refresh to sync both sides even if realtime is slow
      try {
        const headers = await getAuthHeaders();
        if (headers?.Authorization) {
          const syncRes = await fetch(`/api/messages?orderId=${selectedOrderId}`, { headers, cache: 'no-store' });
          const syncData = await syncRes.json();
          if (Array.isArray(syncData)) setMessages(syncData);
        }
      } catch {}
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <main className="min-h-screen bg-[#091C3E] text-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-10">
        <div className="h-[calc(100vh-200px)] flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Sidebar: List of Orders */}
          <div className="w-full md:w-80 bg-[#051024] border-2 border-[#1A3E7A] rounded-2xl flex flex-col overflow-hidden shadow-xl">
            <div className="p-4 border-b-2 border-white/10 bg-[#080f20]/90 flex justify-between items-center">
              <h2 className="text-xl font-display tracking-widest text-white">VOS COMMANDES</h2>
              <button onClick={fetchUserOrders} className="text-[#9fb0c8] hover:text-fortnite-yellow">
                <ArrowPathIcon className={`w-5 h-5 ${fetchingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {fetchingOrders ? (
                <div className="p-8 text-center text-fortnite-yellow animate-pulse font-semibold text-xs uppercase tracking-wide">Chargement...</div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-[#aab6ca] text-xs font-semibold uppercase tracking-wide">Aucune commande trouvée</div>
              ) : (
                orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full p-4 border-b border-white/5 flex flex-col gap-1 transition-colors text-left hover:bg-white/5 ${
                      selectedOrderId === order.id ? 'bg-white/10 border-l-4 border-l-fortnite-yellow' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm">Commande #{order.id.slice(0, 8)}</span>
                      <span className="text-[9px] text-[#9fb0c8]">{formatLocaleDate(order.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-[#c5cdd9] font-sans truncate">
                      {order.items_data?.map(i => i.name).join(', ') || 'Articles'}
                    </p>
                    <span className={`text-[8px] font-bold uppercase ${
                      order.status === 'delivered' ? 'text-green-500' :
                      order.status === 'cancelled' ? 'text-red-500' :
                      'text-fortnite-yellow'
                    }`}>
                      Statut: {order.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 bg-[#051024] border-2 border-[#1A3E7A] rounded-2xl flex flex-col overflow-hidden shadow-xl relative">
            <div className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none opacity-[0.018] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#FFF_10px,#FFF_20px)] mix-blend-overlay"></div>
            
            {selectedOrderId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-[#080f20]/90 border-b-2 border-white/10 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-fortnite-yellow/20 rounded-full flex items-center justify-center border-2 border-fortnite-yellow/20">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 text-fortnite-yellow" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold leading-none">Support LamaShop</h3>
                      <p className="text-[10px] text-[#aab6ca] font-semibold uppercase tracking-wide mt-1">Chat en direct • Commande #{selectedOrderId.slice(0, 8)}</p>
                    </div>
                  </div>
                  <Link href={`/orders?order_id=${selectedOrderId}`} className="flex items-center gap-2 text-[10px] font-bold text-fortnite-yellow uppercase hover:underline">
                    <ShoppingBagIcon className="w-4 h-4" />
                    Suivre la livraison
                  </Link>
                </div>

                {/* Chat Messages */}
                <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 relative z-10">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-[#9fb0c8]">
                      <InboxIcon className="w-12 h-12 mb-2 text-[#6b7c96]" />
                      <p className="text-xs font-semibold uppercase tracking-wide">Aucun message</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.sender_id && user?.id ? msg.sender_id === user.id : !msg.is_admin_sender;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[75%] p-4 rounded-2xl text-sm font-semibold shadow-lg ${
                          isMine
                            ? 'bg-fortnite-yellow text-fortnite-blue rounded-tr-none border-b-4 border-fortnite-yellow/50'
                            : 'bg-[#1a2f4d]/95 text-[#f0f4fa] border border-white/20 rounded-tl-none'
                        }`}>
                          {msg.text ?? msg.content ?? ''}
                        </div>
                        <span className="text-[9px] text-[#8ea0b8] mt-2 uppercase font-sans">
                          {isMine ? 'Vous' : 'Admin'} • {formatLocaleTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-[#080f20]/95 border-t-2 border-white/15 flex gap-3 relative z-10">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Posez votre question au support..." 
                    className="flex-1 bg-[#0c1628] border-2 border-white/25 rounded-xl px-6 py-4 text-[#f0f4fa] placeholder:text-[#6a7d95] text-sm focus:border-fortnite-yellow focus:outline-none transition-all shadow-inner font-sans"
                  />
                  <button
                    disabled={loading || !inputText.trim()}
                    className="px-6 bg-fortnite-yellow rounded-xl text-fortnite-blue font-bold flex items-center justify-center gap-2 group disabled:opacity-50 transition-all hover:scale-105"
                  >
                    <PaperAirplaneIcon className="w-6 h-6 -rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <InboxIcon className="w-20 h-20 text-[#4a5c78] mb-6" />
                <h3 className="text-2xl font-display text-[#dce3ee] tracking-[0.15em]">SÉLECTIONNEZ UNE COMMANDE</h3>
                <p className="max-w-md text-[#aab6ca] font-medium text-xs uppercase tracking-wide mt-4 leading-relaxed">
                  Choisissez une commande dans la liste pour discuter avec un administrateur en direct de votre livraison.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function UserMessages() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#091C3E] text-white">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <p className="text-fortnite-yellow font-display animate-pulse tracking-widest">Chargement...</p>
        </div>
      </main>
    }>
      <UserMessagesContent />
    </Suspense>
  );
}
