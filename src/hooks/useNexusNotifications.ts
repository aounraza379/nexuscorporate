import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface NexusNotification {
  id: string;
  type: "leave_request" | "task_assigned" | "announcement" | "task_completed";
  title: string;
  message: string;
  actionable: boolean;
  actionType?: "approve_reject" | "view" | "acknowledge";
  entityId?: string;
  entityType?: string;
  timestamp: Date;
  read: boolean;
}

interface LeaveRequestPayload {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason?: string;
}

interface TaskPayload {
  id: string;
  title: string;
  assigned_to: string;
  status: string;
  priority: string;
}

export function useNexusNotifications() {
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState<NexusNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<NexusNotification, "id" | "timestamp" | "read">) => {
    const newNotification: NexusNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20
    setUnreadCount(prev => prev + 1);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Execute action on leave request
  const executeLeaveAction = useCallback(async (leaveId: string, action: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ 
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", leaveId);

      if (error) throw error;
      return { success: true, message: `Leave request ${action} successfully` };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to update leave request" };
    }
  }, [user?.id]);

  // Subscribe to real-time updates based on role
  useEffect(() => {
    if (!user?.id || !userRole) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Managers and HR get leave request notifications
    if (userRole === "manager" || userRole === "hr") {
      const leaveChannel = supabase
        .channel("leave-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "leave_requests",
          },
          async (payload: RealtimePostgresChangesPayload<LeaveRequestPayload>) => {
            const newRequest = payload.new as LeaveRequestPayload;
            
            // Don't notify about own requests
            if (newRequest.user_id === user.id) return;

            // Get employee name
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newRequest.user_id)
              .single();

            addNotification({
              type: "leave_request",
              title: "New Leave Request",
              message: `${profile?.full_name || "An employee"} has requested ${newRequest.leave_type} leave from ${newRequest.start_date} to ${newRequest.end_date}`,
              actionable: true,
              actionType: "approve_reject",
              entityId: newRequest.id,
              entityType: "leave_request",
            });
          }
        )
        .subscribe();

      channels.push(leaveChannel);
    }

    // All users get task assignment notifications
    const taskChannel = supabase
      .channel("task-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
        },
        (payload: RealtimePostgresChangesPayload<TaskPayload>) => {
          const newTask = payload.new as TaskPayload;
          
          // Only notify if assigned to current user
          if (newTask.assigned_to === user.id) {
            addNotification({
              type: "task_assigned",
              title: "New Task Assigned",
              message: `You have been assigned a new ${newTask.priority} priority task: "${newTask.title}"`,
              actionable: true,
              actionType: "view",
              entityId: newTask.id,
              entityType: "task",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `status=eq.completed`,
        },
        (payload: RealtimePostgresChangesPayload<TaskPayload>) => {
          const task = payload.new as TaskPayload;
          
          // Notify managers about completed tasks
          if (userRole === "manager" || userRole === "hr") {
            addNotification({
              type: "task_completed",
              title: "Task Completed",
              message: `Task "${task.title}" has been marked as completed`,
              actionable: false,
            });
          }
        }
      )
      .subscribe();

    channels.push(taskChannel);

    // All users get announcement notifications
    const announcementChannel = supabase
      .channel("announcement-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
        },
        (payload: RealtimePostgresChangesPayload<{ id: string; title: string; priority: string }>) => {
          const announcement = payload.new as { id: string; title: string; priority: string };
          
          addNotification({
            type: "announcement",
            title: announcement.priority === "urgent" ? "🚨 Urgent Announcement" : "New Announcement",
            message: announcement.title,
            actionable: true,
            actionType: "view",
            entityId: announcement.id,
            entityType: "announcement",
          });
        }
      )
      .subscribe();

    channels.push(announcementChannel);

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.id, userRole, addNotification]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    executeLeaveAction,
    addNotification,
  };
}
