import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface RealtimeSyncOptions {
  /** Show toast notifications for changes */
  showToasts?: boolean;
  /** Callback when any synced table changes */
  onSync?: (table: string, event: string) => void;
}

/**
 * Hook for real-time synchronization of announcements and leave_requests.
 * Automatically invalidates React Query cache on database changes.
 */
export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { showToasts = true, onSync } = options;

  useEffect(() => {
    if (!user) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("realtime-sync")
      // Listen to announcements changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
          console.log("[Realtime] Announcements changed:", payload.eventType);
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
          
          // Show toast for new announcements
          if (showToasts && payload.eventType === "INSERT") {
            const newRecord = payload.new as { title?: string; priority?: string };
            toast.info(`📢 New announcement: ${newRecord.title || "Update"}`, {
              duration: 4000,
            });
          }
          
          onSync?.("announcements", payload.eventType);
        }
      )
      // Listen to leave_requests changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leave_requests",
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
          console.log("[Realtime] Leave requests changed:", payload.eventType);
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
          
          // Role-specific notifications
          if (showToasts) {
            if (payload.eventType === "INSERT" && (userRole === "manager" || userRole === "hr")) {
              toast.info("🆕 New leave request submitted", { duration: 3000 });
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new as { status?: string; user_id?: string };
              if (updated.user_id === user.id) {
                if (updated.status === "approved") {
                  toast.success("✅ Your leave request was approved!");
                } else if (updated.status === "rejected") {
                  toast.error("❌ Your leave request was rejected");
                }
              }
            }
          }
          
          onSync?.("leave_requests", payload.eventType);
        }
      )
      // Listen to tasks changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
          console.log("[Realtime] Tasks changed:", payload.eventType);
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          
          // Notify on task assignment
          if (showToasts && payload.eventType === "INSERT") {
            const newTask = payload.new as { assigned_to?: string; title?: string };
            if (newTask.assigned_to === user.id) {
              toast.info(`📋 New task assigned: ${newTask.title || "Task"}`);
            }
          }
          
          onSync?.("tasks", payload.eventType);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Subscribed to sync channels");
        } else if (status === "CHANNEL_ERROR") {
          console.error("[Realtime] Channel error");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, userRole, queryClient, showToasts, onSync]);

  return {
    isConnected: !!channelRef.current,
  };
}
