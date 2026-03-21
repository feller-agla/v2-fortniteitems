"use client";
import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { supabase, getAuthHeaders } from '@/app/lib/supabase';
import { formatLocaleTime } from '@/app/lib/datetime';
import { useAuth } from '../context/AuthContext';

export default function ChatWidget({ orderId }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!orderId || !isOpen) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers?.Authorization) return;
        const res = await fetch(`/api/messages?orderId=${orderId}`, { headers, cache: 'no-store' });
        if (res.status === 401) return;
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      } catch (e) {
        console.warn('[chat widget] fetchMessages failed', e);
      }
    };

    fetchMessages();
    const poll = setInterval(fetchMessages, 4000);

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `order_id=eq.${orderId}`
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
  }, [orderId, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticText = inputText;
    setInputText('');
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        order_id: orderId,
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
        body: JSON.stringify({ orderId, text: optimisticText, isAdmin: false })
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
      // Immediate refresh to sync even if realtime is slow
      try {
        const headers = await getAuthHeaders();
        if (headers?.Authorization) {
          const syncRes = await fetch(`/api/messages?orderId=${orderId}`, { headers, cache: 'no-store' });
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

  if (!orderId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 transform hover:scale-110 ${
          isOpen ? 'bg-rarity-marvel rotate-90' : 'bg-fortnite-yellow'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-8 h-8 text-white" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-fortnite-blue" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-[#051024] border-2 border-[#1A3E7A] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[#091C3E] p-4 border-b-2 border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-fortnite-yellow font-display text-lg tracking-widest text-3d-yellow">MESSAGERIE</h3>
              <p className="text-[10px] text-[#aab6ca] font-semibold uppercase tracking-wide">Commande: #{orderId.slice(0, 8)}</p>
            </div>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] text-green-500 font-bold uppercase">Support en ligne</span>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.04)_10px,rgba(255,255,255,0.04)_20px)]"
          >
            {messages.length === 0 && (
              <div className="text-center py-10">
                <p className="text-[#aab6ca] text-xs font-medium uppercase tracking-wide leading-relaxed px-2">Aucun message pour le moment. Des questions sur votre livraison ? Discutons !</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMine = msg.sender_id && user?.id ? msg.sender_id === user.id : !msg.is_admin_sender;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm font-semibold shadow-md ${
                    isMine
                      ? 'bg-fortnite-yellow text-fortnite-blue rounded-tr-none'
                      : 'bg-[#1a2f4d]/95 text-[#f0f4fa] border border-white/20'
                  }`}>
                    {msg.text ?? msg.content ?? ''}
                  </div>
                  <span className="text-[8px] text-[#8ea0b8] mt-1 uppercase">
                    {formatLocaleTime(msg.created_at)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#080f20]/95 border-t-2 border-white/15 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrivez votre message..." 
              className="flex-1 bg-[#0c1628] border-2 border-white/25 rounded-xl px-4 py-2 text-[#f0f4fa] placeholder:text-[#6a7d95] text-sm focus:border-fortnite-yellow focus:outline-none transition-colors"
            />
            <button 
              disabled={loading}
              className="p-3 bg-fortnite-yellow rounded-xl text-fortnite-blue disabled:opacity-50 hover:scale-105 transition-transform"
            >
              <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
