"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      // Supabase RLS handles the order access
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_admin_sender", true)
        .eq("is_read", false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (e) {
      console.warn("[useUnreadMessages] fetch error:", e);
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Listen for new messages from admin
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // If a new message is inserted OR updated (e.g. is_read changes)
          // We just re-fetch the count to be safe and accurate
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount, refresh: fetchUnreadCount };
}
