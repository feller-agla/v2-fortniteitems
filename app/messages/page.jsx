"use client";
import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  InboxIcon,
  ArrowLeftIcon,
  ClockIcon
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
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const scrollRef = useRef(null);
  const lastFetchedUserId = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-select order from query
  useEffect(() => {
    if (queryOrderId && !selectedOrderId) {
      setSelectedOrderId(queryOrderId);
      setShowMobileChat(true);
    }
  }, [queryOrderId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Redirect if not logged in
  useEffect(() => {
    if (isAuthReady && !user) {
      router.push('/login');
    }
  }, [user, isAuthReady, router]);

  // Fetch user's orders (Smart Refresh)
  const fetchUserOrders = async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setFetchingOrders(true);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .filter('customer_data->>id', 'eq', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MESSAGES] Supabase Error Detail:', error.message, error.details, error.hint);
        throw error;
      }
      setOrders(data || []);
      lastFetchedUserId.current = user.id;
      
      if (typeof window !== 'undefined' && window.innerWidth >= 768 && data?.length > 0 && !selectedOrderId) {
        setSelectedOrderId(data[0].id);
      }
    } catch (err) {
      console.error('[MESSAGES] Critical Fetch Error:', err.message || err);
      console.dir(err);
    } finally {
      setFetchingOrders(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchUserOrders();
  }, [user?.id]);

  // Fetch messages for selected order
  useEffect(() => {
    if (!selectedOrderId) return;
    
    const fetchMessages = async () => {
      try {
        const headers = await getAuthHeaders();
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
    const poll = setInterval(fetchMessages, 5000);

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
          if (!next?.id || prev.some((m) => m.id === next.id)) return prev;
          return [...prev, next];
        });
      })
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [selectedOrderId]);

  const handleSelectOrder = (id) => {
    setSelectedOrderId(id);
    setShowMobileChat(true);
  };

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
      if (!authHeaders?.Authorization) throw new Error('Session expirée');
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ orderId: selectedOrderId, text: optimisticText, isAdmin: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((prev) => prev.map((m) =>
          m.id === optimisticId ? { ...data, text: data.content ?? data.text ?? optimisticText } : m
      ));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    messages.forEach((msg) => {
      const date = formatLocaleDate(msg.created_at);
      let lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.date !== date) {
        groups.push({ date, messages: [msg] });
      } else {
        lastGroup.messages.push(msg);
      }
    });
    return groups;
  }, [messages]);

  if (authLoading) return null;

  return (
    <main className="min-h-screen bg-[#091C3E] text-white overflow-hidden flex flex-col relative">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(26,62,122,0.3)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="flex-none relative z-50"><Navbar /></div>

      <div className="flex-1 container mx-auto px-0 md:px-4 pt-24 md:pt-40 pb-4 md:pb-10 flex flex-col md:flex-row gap-0 md:gap-6 overflow-hidden relative z-10">
        
        {/* Sidebar: Orders List */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-[#051024]/95 backdrop-blur-md md:rounded-2xl border-x-0 md:border-2 border-[#1A3E7A] shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 md:p-6 border-b-2 border-white/10 bg-[#080f20]/90 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display tracking-widest text-[#F1F12B]">MES COMMANDES</h2>
              <p className="text-[9px] text-[#B0B8C8] font-bold tracking-widest uppercase mt-1">Discutez avec le support</p>
            </div>
            <button 
              onClick={() => fetchUserOrders(true)} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-fortnite-yellow group"
            >
              <ArrowPathIcon className={`w-5 h-5 ${fetchingOrders ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {fetchingOrders && orders.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-fortnite-yellow border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(241,241,43,0.3)]"></div>
                <div className="text-fortnite-yellow font-display tracking-widest text-sm animate-pulse uppercase">Optimisation...</div>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center opacity-20">
                <InboxIcon className="w-16 h-16 mx-auto mb-4" />
                <div className="text-xs font-bold uppercase tracking-widest">Aucune commande</div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {orders.map((order) => {
                  const firstItem = order.items_data?.[0];
                  const itemImage = firstItem?.image || firstItem?.images?.featured || firstItem?.images?.icon;
                  const isSelected = selectedOrderId === order.id;
                  
                  return (
                    <button
                      key={order.id}
                      onClick={() => handleSelectOrder(order.id)}
                      className={`w-full p-4 flex gap-4 transition-all text-left relative overflow-hidden group border-b border-white/5 ${
                        isSelected 
                          ? 'bg-[#1A3E7A]/60 shadow-[inset_4px_0_0_0_#F1F12B]' 
                          : 'bg-transparent hover:bg-white/2 shadow-[inset_0_0_0_0_transparent]'
                      }`}
                    >
                      <div className={`relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 ${
                        isSelected ? 'border-[#F1F12B] shadow-[0_0_20px_rgba(241,241,43,0.4)]' : 'border-white/10'
                      }`}>
                        {itemImage ? (
                          <img src={itemImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#0c1628] flex items-center justify-center">
                            <ShoppingBagIcon className="w-6 h-6 text-white/20" />
                          </div>
                        )}
                        <div className={`absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-[#051024] ${
                          order.status === 'delivered' ? 'bg-green-500' :
                          order.status === 'cancelled' ? 'bg-red-500' :
                          'bg-fortnite-yellow animate-pulse'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`font-display tracking-wider text-[13px] truncate ${isSelected ? 'text-[#F1F12B]' : 'text-white'}`}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[8px] text-[#B0B8C8] font-bold whitespace-nowrap uppercase tracking-tighter">{formatLocaleDate(order.created_at)}</span>
                        </div>
                        
                        <p className="text-[11px] text-white/70 font-medium truncate leading-tight mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {order.items_data?.map(i => i.name).join(', ') || 'Articles'}
                        </p>
                        
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase transition-all ${
                            order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-fortnite-yellow/20 text-fortnite-yellow'
                          }`}>
                            {order.status}
                          </span>
                          <span className="text-[11px] font-display text-white/90">
                            {Number(order.amount).toLocaleString('fr-FR')} <span className="text-[8px] text-white/40 ml-0.5">FCFA</span>
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area Container */}
        <div className={`flex-1 flex flex-col bg-[#051024]/95 backdrop-blur-md md:rounded-2xl md:border-2 border-[#1A3E7A] shadow-[0_0_50px_rgba(26,62,122,0.4)] relative transition-all duration-300 overflow-hidden ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Inner Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          
          {selectedOrderId ? (
            <>
              {/* Header */}
              <div className="flex-none p-4 md:p-5 bg-[#080f20]/90 border-b-2 border-white/10 flex items-center justify-between gap-4 relative z-20 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowMobileChat(false)} className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-[#F1F12B]" />
                  </button>
                  <div className="w-12 h-12 bg-[#F1F12B] rounded-2xl flex items-center justify-center shrink-0 border-2 border-black/20 shadow-[0_0_15px_rgba(241,241,43,0.3)] group transition-all duration-500 hover:rotate-12">
                    <ChatBubbleLeftRightIcon className="w-7 h-7 text-[#091C3E]" />
                  </div>
                  <div>
                    <h3 className="text-white font-display text-lg tracking-widest uppercase leading-none">SUPPORT LAMASHOP</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_green]" />
                      <p className="text-[10px] text-[#F1F12B] font-black uppercase tracking-[0.1em] leading-none">COMMANDE #{selectedOrderId.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </div>
                
                <Link href={`/orders?order_id=${selectedOrderId}`} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-fortnite-yellow transition-all hover:scale-110 shadow-lg group">
                  <ShoppingBagIcon className="w-6 h-6 group-hover:animate-bounce" />
                </Link>
              </div>

              {/* Messages List Area */}
              <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 custom-scrollbar bg-transparent relative z-10">
                {groupedMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale select-none">
                    <ChatBubbleLeftRightIcon className="w-24 h-24 mb-6" />
                    <p className="text-xs font-display tracking-[0.3em] text-[#B0B8C8] uppercase">Comment pouvons-nous vous aider ?</p>
                  </div>
                )}
                
                {groupedMessages.map((group) => (
                  <div key={group.date} className="space-y-6">
                    <div className="flex items-center justify-center gap-4 py-2">
                       <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                       <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{group.date}</span>
                       <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                    </div>
                    {group.messages.map((msg) => {
                      const isMine = msg.is_admin_sender === false;
                      const status = String(msg.id).startsWith('optimistic') ? 'loading' : 'sent';
                      
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500 group/msg`}>
                          <div className={`relative px-6 py-4 rounded-[2rem] text-sm font-bold shadow-[0_10px_30px_rgba(0,0,0,0.4)] border-2 transition-transform duration-300 hover:scale-[1.02] ${
                            isMine
                              ? 'bg-[#F1F12B] text-[#091C3E] border-black/10 rounded-tr-none ml-12'
                              : 'bg-[#1a2f4d]/90 backdrop-blur-md text-white border-white/10 rounded-tl-none mr-12'
                          }`}>
                            {msg.text ?? msg.content ?? ''}
                            
                            <div className={`absolute top-full mt-2 flex items-center gap-1.5 opacity-40 group-hover/msg:opacity-100 transition-opacity ${isMine ? 'right-0 flex-row-reverse text-right' : 'left-0'}`}>
                               <span className="text-[9px] font-black uppercase tracking-widest">{formatLocaleTime(msg.created_at)}</span>
                               {isMine && status === 'loading' && <ClockIcon className="w-3 h-3 animate-spin" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="flex-none p-4 md:p-6 bg-[#080f20]/90 border-t-2 border-white/10 relative z-20 backdrop-blur-xl">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4">
                  <div className="flex-1 relative group">
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-fortnite-yellow scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 rounded-full" />
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Tapez votre message ici..." 
                      className="w-full bg-[#0c1628]/80 border-2 border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-[#6b7c96] text-sm focus:border-white/20 focus:outline-none transition-all shadow-inner font-bold"
                    />
                  </div>
                  <button
                    disabled={loading || !inputText.trim()}
                    className="aspect-square bg-[#F1F12B] hover:bg-white rounded-2xl text-[#091C3E] font-black flex items-center justify-center p-4 shadow-[0_6px_0_rgba(180,160,0,1)] hover:shadow-[0_2px_0_rgba(180,160,0,1)] hover:translate-y-[4px] active:scale-95 disabled:grayscale disabled:opacity-50 transition-all shrink-0 group"
                  >
                    <PaperAirplaneIcon className="w-8 h-8 -rotate-45 group-hover:scale-110 transition-transform" />
                  </button>
                </form>
                <div className="flex items-center justify-center gap-2 mt-4 opacity-30 select-none">
                  <div className="h-px w-8 bg-white/50" />
                  <p className="text-[8px] font-black uppercase tracking-[0.3em]">Support LamaShop 24/7</p>
                  <div className="h-px w-8 bg-white/50" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-transparent relative z-10">
              <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-white/10 shadow-inner group transition-all duration-700 hover:rotate-[360deg]">
                <InboxIcon className="w-12 h-12 text-fortnite-yellow opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-3xl font-display text-[#F1F12B] tracking-[0.2em] mb-4 text-3d-yellow">VOS MESSAGES</h3>
              <p className="max-w-md text-[#B0B8C8] font-bold text-[10px] uppercase tracking-[0.3em] leading-loose opacity-60">
                Sélectionnez une commande dans la liste pour commencer à échanger avec un expert de notre équipe.
              </p>
            </div>
          )}
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
        <div className="flex flex-col items-center justify-center min-h-screen pt-20">
          <div className="w-16 h-16 border-4 border-fortnite-yellow border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(241,241,43,0.5)]"></div>
          <p className="text-fortnite-yellow font-display mt-8 tracking-[0.5em] text-xl animate-pulse">SYNCHRONISATION...</p>
        </div>
      </main>
    }>
      <UserMessagesContent />
    </Suspense>
  );
}
