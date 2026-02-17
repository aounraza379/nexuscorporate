// =============================================
// usePresenceTracking — Updates user's last_seen & is_online status
// Runs on mount and periodically to keep presence accurate
// =============================================

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const HEARTBEAT_INTERVAL = 60_000; // Update every 60 seconds

export function usePresenceTracking() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    // ── Mark user as online and update last_seen ──
    const updatePresence = async () => {
      await supabase
        .from("profiles")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("id", user.id);
    };

    // ── Mark user as offline on departure ──
    const markOffline = async () => {
      await supabase
        .from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("id", user.id);
    };

    // Initial presence update
    updatePresence();

    // Periodic heartbeat
    intervalRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // Mark offline when tab closes or navigates away
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability during page unload
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`;
      const body = JSON.stringify({ is_online: false, last_seen: new Date().toISOString() });
      navigator.sendBeacon?.(url); // Best-effort; RLS may block without auth
      markOffline();
    };

    // Mark offline on tab visibility change (user switches away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        markOffline();
      } else {
        updatePresence();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      markOffline();
    };
  }, [user]);
}
