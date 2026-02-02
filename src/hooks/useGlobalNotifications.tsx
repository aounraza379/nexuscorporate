import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface LeaveRequestPayload {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason?: string;
}

/**
 * Global hook for real-time notifications across the app.
 * Subscribes to Supabase broadcast and shows toast notifications.
 */
export function useGlobalNotifications(onOpenAssistant?: () => void) {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const processedIds = useRef<Set<string>>(new Set());

  const handleLeaveRequestInsert = useCallback(
    async (payload: RealtimePostgresChangesPayload<LeaveRequestPayload>) => {
      const newRequest = payload.new as LeaveRequestPayload;
      
      // Prevent duplicate notifications
      if (processedIds.current.has(newRequest.id)) return;
      processedIds.current.add(newRequest.id);

      // Only notify managers and HR
      if (userRole !== "manager" && userRole !== "hr") return;
      
      // Don't notify about own requests
      if (newRequest.user_id === user?.id) return;

      // Fetch employee name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", newRequest.user_id)
        .single();

      const employeeName = profile?.full_name || "An employee";

      // Show toast with action
      toast.info(`📬 New Leave Request`, {
        description: `${employeeName} requested ${newRequest.leave_type} leave (${newRequest.start_date} to ${newRequest.end_date})`,
        duration: 8000,
        action: onOpenAssistant
          ? {
              label: "Ask Nexus",
              onClick: onOpenAssistant,
            }
          : undefined,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    [user?.id, userRole, queryClient, onOpenAssistant]
  );

  const handleLeaveRequestUpdate = useCallback(
    async (payload: RealtimePostgresChangesPayload<LeaveRequestPayload>) => {
      const updated = payload.new as LeaveRequestPayload;
      const old = payload.old as LeaveRequestPayload;

      // Only notify if status changed and it's the current user's request
      if (updated.status !== old?.status && updated.user_id === user?.id) {
        if (updated.status === "approved") {
          toast.success("🎉 Leave Request Approved!", {
            description: `Your ${updated.leave_type} leave from ${updated.start_date} to ${updated.end_date} has been approved.`,
            duration: 6000,
          });
        } else if (updated.status === "rejected") {
          toast.error("Leave Request Rejected", {
            description: `Your ${updated.leave_type} leave request was not approved.`,
            duration: 6000,
          });
        }
      }

      // Invalidate queries for everyone
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    [user?.id, queryClient]
  );

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to leave_requests changes
    const leaveChannel = supabase
      .channel("global-leave-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leave_requests",
        },
        handleLeaveRequestInsert
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leave_requests",
        },
        handleLeaveRequestUpdate
      )
      .subscribe();

    // Subscribe to announcements
    const announcementChannel = supabase
      .channel("global-announcement-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          const announcement = payload.new as { title: string; priority: string };
          
          if (announcement.priority === "urgent") {
            toast.error("🚨 Urgent Announcement", {
              description: announcement.title,
              duration: 10000,
            });
          } else {
            toast.info("📢 New Announcement", {
              description: announcement.title,
              duration: 6000,
            });
          }

          queryClient.invalidateQueries({ queryKey: ["announcements"] });
        }
      )
      .subscribe();

    // Subscribe to task assignments
    const taskChannel = supabase
      .channel("global-task-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          const task = payload.new as { assigned_to: string; title: string; priority: string };
          
          if (task.assigned_to === user.id) {
            toast.info("📋 New Task Assigned", {
              description: `${task.title} (${task.priority} priority)`,
              duration: 6000,
            });
          }

          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leaveChannel);
      supabase.removeChannel(announcementChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [user?.id, userRole, handleLeaveRequestInsert, handleLeaveRequestUpdate, queryClient]);
}
