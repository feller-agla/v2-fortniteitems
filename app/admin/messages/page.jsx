"use client";
import { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon,
  ArrowPathIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { supabase, getAuthHeaders } from '@/app/lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function AdminMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingConvs, setFetchingConvs] = useState(true);
  const scrollRef = useRef(null);

  // Fetch unique orders that have messages
  const fetchConversations = async () => {
    setFetchingConvs(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          order_id,
          text,
          created_at,
          orders!inner (
            id,
            customer_data
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by order_id and get latest message
      const groups = {};
      data.forEach(msg => {
        if (!groups[msg.order_id]) {
          groups[msg.order_id] = {
            orderId: msg.order_id,
            customerName: msg.orders.customer_data?.name || 'Joueur',
            lastMessage: msg.text ?? msg.content ?? '',
            time: msg.created_at
          };
        }
      });
      setConversations(Object.values(groups));
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingConvs(false);
    }
  };

  useEffect(() => { fetchConversations(); }, []);

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
        console.warn('[admin messages] fetchMessages failed', e);
      }
    };

    fetchMessages();
    const poll = setInterval(fetchMessages, 4000);

    const channel = supabase
      .channel(`admin-chat-${selectedOrderId}`)
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
        is_admin_sender: true,
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) throw new Error('Session expirée, reconnectez-vous.');
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ orderId: selectedOrderId, text: optimisticText, isAdmin: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur envoi');
      setMessages((prev) => {
        // If realtime already delivered the same message, drop optimistic
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

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sidebar: List of Conversations */}
      <div className="w-full md:w-80 bg-[#051024] border-2 border-[#1A3E7A] rounded-2xl flex flex-col overflow-hidden shadow-xl">
        <div className="p-4 border-b-2 border-white/5 bg-black/40 flex justify-between items-center">
          <h2 className="text-xl font-display tracking-widest text-white">CONVERSATIONS</h2>
          <button onClick={fetchConversations} className="text-gray-400 hover:text-fortnite-yellow">
            <ArrowPathIcon className={`w-5 h-5 ${fetchingConvs ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !fetchingConvs ? (
            <div className="p-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">Aucun message reçu</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.orderId}
                onClick={() => setSelectedOrderId(conv.orderId)}
                className={`w-full p-4 border-b border-white/5 flex flex-col gap-1 transition-colors text-left hover:bg-white/5 ${
                  selectedOrderId === conv.orderId ? 'bg-white/10 border-l-4 border-l-fortnite-yellow' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-sm">{conv.customerName}</span>
                  <span className="text-[9px] text-gray-500">{new Date(conv.time).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-[11px] text-gray-400 truncate font-sans">{conv.lastMessage}</p>
                <span className="text-[8px] text-fortnite-yellow font-bold uppercase">CMD: #{conv.orderId.slice(0, 8)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-[#051024] border-2 border-[#1A3E7A] rounded-2xl flex flex-col overflow-hidden shadow-xl relative">
        <div className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#FFF_10px,#FFF_20px)] mix-blend-overlay"></div>
        
        {selectedOrderId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-black/40 border-b-2 border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fortnite-yellow/20 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-7 h-7 text-fortnite-yellow" />
                </div>
                <div>
                  <h3 className="text-white font-bold leading-none">
                    {conversations.find(c => c.orderId === selectedOrderId)?.customerName}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Chatting about Order #{selectedOrderId.slice(0, 8)}</p>
                </div>
              </div>
              <a href={`/admin/orders?orderId=${selectedOrderId}`} className="flex items-center gap-2 text-[10px] font-bold text-fortnite-yellow uppercase hover:underline">
                <ShoppingBagIcon className="w-4 h-4" />
                Détails commande
              </a>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 relative z-10">
              {messages.map((msg) => {
                const isMine = msg.sender_id && user?.id ? msg.sender_id === user.id : !!msg.is_admin_sender;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm font-bold shadow-lg ${
                      isMine
                        ? 'bg-fortnite-yellow text-fortnite-blue rounded-tr-none border-b-4 border-fortnite-yellow/50'
                        : 'bg-white/10 text-white border border-white/10 rounded-tl-none'
                    }`}>
                      {msg.text ?? msg.content ?? ''}
                    </div>
                    <span className="text-[9px] text-gray-500 mt-2 uppercase font-sans">
                      {new Date(msg.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-black/60 border-t-2 border-white/10 flex gap-3 relative z-10">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tapez votre réponse ici..." 
                className="flex-1 bg-black/60 border-2 border-white/20 rounded-xl px-6 py-4 text-white text-sm focus:border-fortnite-yellow focus:outline-none transition-all shadow-inner font-sans"
              />
              <button 
                disabled={loading || !inputText.trim()}
                className="px-6 bg-fortnite-yellow rounded-xl text-fortnite-blue font-bold flex items-center justify-center gap-2 group disabled:opacity-50 transition-all hover:scale-105"
              >
                <span className="hidden sm:inline">ENVOYER</span>
                <PaperAirplaneIcon className="w-6 h-6 -rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <ChatBubbleLeftRightIcon className="w-20 h-20 text-white/10 mb-6" />
            <h3 className="text-2xl font-display text-white/20 tracking-[0.2em]">SÉLECTIONNEZ UNE CONVERSATION</h3>
            <p className="max-w-md text-gray-500 font-bold text-xs uppercase mt-4 leading-loose">
              Cliquez sur un client dans la liste de gauche pour lire les messages et répondre à ses questions.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
