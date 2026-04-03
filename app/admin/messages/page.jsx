"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  ClockIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { supabase, getAuthHeaders } from '@/app/lib/supabase';
import { formatLocaleDate, formatLocaleTime } from '@/app/lib/datetime';
import { getCustomerDisplayName } from '@/app/lib/customer-display';
import { useAuth } from '../../context/AuthContext';

export default function AdminMessages() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(urlOrderId || null);
  const [showMobileChat, setShowMobileChat] = useState(!!urlOrderId);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingConvs, setFetchingConvs] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch unique orders that have messages via the secure admin API
  const fetchConversations = async (silent = false) => {
    if (!silent) setFetchingConvs(true);
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) return;

      const res = await fetch('/api/admin/messages', { 
        headers: { ...authHeaders },
        cache: 'no-store' 
      });
      if (!res.ok) throw new Error("Erreur de chargement des conversations");
      const data = await res.json();
      setConversations(data || []);
    } catch (err) {
      console.error('[ADMIN MESSAGES] Fetch Error:', err.message);
    } finally {
      if (!silent) setFetchingConvs(false);
    }
  };

  useEffect(() => { 
    fetchConversations();
    const poll = setInterval(() => fetchConversations(true), 15000); // Silent refresh conversations list
    return () => clearInterval(poll);
  }, []);

  // Sync mobile view with urlOrderId if it changes
  useEffect(() => {
    if (urlOrderId) {
      setSelectedOrderId(urlOrderId);
      setShowMobileChat(true);
    }
  }, [urlOrderId]);

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
    const poll = setInterval(fetchMessages, 5000);

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
    
    // Add optimistic message
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
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ orderId: selectedOrderId, text: optimisticText, isAdmin: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Replace optimistic message with real message
      setMessages((prev) => prev.map((m) =>
          String(m.id) === String(optimisticId) ? { ...data, text: data.content ?? data.text ?? optimisticText } : m
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

  return (
    <main className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-0 md:gap-6 relative z-10 transition-all duration-500">
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(241,241,43,0.03)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Sidebar: Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-[#051024]/95 backdrop-blur-md md:rounded-2xl md:border-2 border-[#1A3E7A] shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-6 border-b-2 border-white/10 bg-[#080f20]/90 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-display tracking-widest text-[#F1F12B]">CONVERSATIONS</h2>
            <p className="text-[9px] text-[#B0B8C8] font-bold tracking-widest uppercase mt-1">Support Clients</p>
          </div>
          <button 
            onClick={() => fetchConversations()} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-fortnite-yellow group"
          >
            <ArrowPathIcon className={`w-5 h-5 ${fetchingConvs ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {fetchingConvs && conversations.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-fortnite-yellow border-t-transparent rounded-full animate-spin"></div>
              <div className="text-fortnite-yellow font-display tracking-widest text-xs animate-pulse">SYNCHRO...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center opacity-20">
              <InboxIcon className="w-16 h-16 mx-auto mb-4 text-[#B0B8C8]" />
              <div className="text-[10px] font-bold uppercase tracking-widest">Aucun message</div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {conversations.map((conv) => {
                const isSelected = selectedOrderId === conv.orderId;
                return (
                  <button
                    key={conv.orderId}
                    onClick={() => handleSelectOrder(conv.orderId)}
                    className={`w-full p-4 flex flex-col gap-1 transition-all text-left relative overflow-hidden group border-b border-white/5 ${
                      isSelected 
                        ? 'bg-[#1A3E7A]/60 shadow-[inset_4px_0_0_0_#F1F12B]' 
                        : 'bg-transparent hover:bg-white/2 shadow-[inset_0_0_0_0_transparent]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <span className={`font-display tracking-wider text-[13px] truncate block ${isSelected ? 'text-[#F1F12B]' : 'text-white'}`}>
                          {conv.customerName || 'Client Inconnu'}
                        </span>
                        <span className="text-[9px] text-[#B0B8C8] font-bold uppercase tracking-tighter mt-0.5">CMD: #{conv.orderId.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[8px] text-[#B0B8C8] font-bold whitespace-nowrap uppercase tracking-tighter">{formatLocaleDate(conv.time)}</span>
                        {conv.unreadCount > 0 && (
                          <span className="min-w-5 h-5 px-1 bg-fortnite-yellow text-fortnite-blue rounded-full flex items-center justify-center text-[9px] font-black shadow-[0_0_10px_rgba(241,241,43,0.45)]">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-[11px] truncate leading-tight mt-1 transition-opacity ${conv.unreadCount > 0 ? 'text-white font-bold' : 'text-white/60 font-medium'}`}>
                      {conv.lastMessage}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
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
                <div className="w-12 h-12 bg-fortnite-yellow/10 rounded-2xl flex items-center justify-center shrink-0 border-2 border-fortnite-yellow/20 shadow-[0_0_15px_rgba(241,241,43,0.1)] transition-all duration-500 hover:rotate-12">
                  <UserCircleIcon className="w-7 h-7 text-[#F1F12B]" />
                </div>
                <div>
                  <h3 className="text-white font-display text-lg tracking-widest uppercase leading-none">
                    {conversations.find(c => c.orderId === selectedOrderId)?.customerName || 'CLIENT'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 grayscale opacity-50">
                    <p className="text-[10px] text-[#F1F12B] font-black uppercase tracking-[0.1em] leading-none">COMMANDE #{selectedOrderId.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>
              
              <a href={`/admin/orders?orderId=${selectedOrderId}`} className="p-3 bg-fortnite-yellow/10 hover:bg-fortnite-yellow/20 border border-fortnite-yellow/30 rounded-2xl text-fortnite-yellow transition-all hover:scale-110 shadow-lg group">
                <ShoppingBagIcon className="w-6 h-6 group-hover:animate-bounce" />
              </a>
            </div>

            {/* Messages List Area */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 custom-scrollbar bg-transparent relative z-10">
              {groupedMessages.map((group) => (
                <div key={group.date} className="space-y-6">
                  <div className="flex items-center justify-center gap-4 py-2">
                     <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                     <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{group.date}</span>
                     <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                  {group.messages.map((msg) => {
                    const isMine = !!msg.is_admin_sender;
                    const status = String(msg.id).startsWith('optimistic') ? 'loading' : 'sent';
                    
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500 group/msg`}>
                        <div className={`relative px-6 py-4 rounded-[2rem] text-sm font-bold shadow-[0_10px_30px_rgba(0,0,0,0.4)] border-2 transition-transform duration-300 hover:scale-[1.02] ${
                          isMine
                            ? 'bg-[#F1F12B] text-[#091C3E] border-black/10 rounded-tr-none ml-12'
                            : 'bg-[#1a2f4d]/90 backdrop-blur-md text-white border-white/10 rounded-tl-none mr-12'
                        }`}>
                          {msg.text ?? msg.content ?? ''}
                          
                          <div className={`absolute top-full mt-2 flex items-center gap-1.5 opacity-40 group-hover/msg:opacity-100 transition-opacity ${isMine ? 'right-0 shadow-none' : 'left-0'}`}>
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
                    placeholder="Tapez votre réponse en tant qu'administrateur..." 
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
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-transparent relative z-10">
            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-white/10 shadow-inner group transition-all duration-700 hover:rotate-[360deg]">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-fortnite-yellow opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-3xl font-display text-[#F1F12B] tracking-[0.2em] mb-4 text-3d-yellow uppercase">AIDE AU SUPPORT</h3>
            <p className="max-w-md text-[#B0B8C8] font-bold text-[10px] uppercase tracking-[0.3em] leading-loose opacity-60">
              Sélectionnez un client à gauche pour lire les messages et apporter une réponse rapide.
            </p>
          </div>
        )}
      </div>

    </main>
  );
}
