"use client";
import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/app/lib/supabase';

export default function ChatWidget({ orderId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!orderId || !isOpen) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      const res = await fetch(`/api/messages?orderId=${orderId}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    };

    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `order_id=eq.${orderId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
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
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, text: inputText, isAdmin: false })
      });
      if (!res.ok) throw new Error("Erreur envoi");
      setInputText('');
    } catch (err) {
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
              <p className="text-[10px] text-gray-400 font-bold uppercase">Commande: #{orderId.slice(0, 8)}</p>
            </div>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] text-green-500 font-bold uppercase">Support en ligne</span>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]"
          >
            {messages.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Aucun message pour le moment. Des questions sur votre livraison ? Discutons !</p>
              </div>
            )}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.is_admin_sender ? 'items-start' : 'items-end'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-xl text-sm font-bold shadow-md ${
                  msg.is_admin_sender 
                    ? 'bg-white/10 text-white border border-white/10' 
                    : 'bg-fortnite-yellow text-fortnite-blue rounded-tr-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-gray-500 mt-1 uppercase">
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t-2 border-white/10 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrivez votre message..." 
              className="flex-1 bg-black/60 border-2 border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-fortnite-yellow focus:outline-none transition-colors"
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
