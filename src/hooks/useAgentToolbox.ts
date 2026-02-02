import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentNavigator } from "@/contexts/AgentNavigatorContext";
import { useTasks } from "./useTasks";
import { useLeaveRequests } from "./useLeaveRequests";
import { toast } from "sonner";

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export type TableName = "leave_requests" | "tasks" | "announcements" | "profiles" | "company_policies";

/**
 * The Agentic Toolbox - Provides executable functions for the AI agent.
 * All tools validate roles and use React Query for instant UI sync.
 */
export function useAgentToolbox() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const { navigateTo, currentRoute, accessibleRoutes } = useAgentNavigator();
  const { tasks } = useTasks();
  const { leaveRequests } = useLeaveRequests();
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * TOOL: Fetch current dashboard data based on user role
   */
  const fetchCurrentData = useCallback(async (): Promise<ToolResult> => {
    setIsSyncing(true);
    try {
      const data: Record<string, unknown> = {
        currentRoute,
        userRole,
        accessibleRoutes,
      };

      // Add tasks summary
      if (tasks) {
        data.tasks = {
          total: tasks.length,
          pending: tasks.filter((t) => t.status === "pending").length,
          inProgress: tasks.filter((t) => t.status === "in_progress").length,
          completed: tasks.filter((t) => t.status === "completed").length,
          highPriority: tasks.filter((t) => t.priority === "high").length,
        };
      }

      // Add leave requests summary
      if (leaveRequests) {
        data.leaveRequests = {
          total: leaveRequests.length,
          pending: leaveRequests.filter((l) => l.status === "pending").length,
          approved: leaveRequests.filter((l) => l.status === "approved").length,
          rejected: leaveRequests.filter((l) => l.status === "rejected").length,
        };
      }

      return {
        success: true,
        message: "Fetched current dashboard state.",
        data,
      };
    } finally {
      setIsSyncing(false);
    }
  }, [currentRoute, userRole, accessibleRoutes, tasks, leaveRequests]);

  /**
   * TOOL: Update a database record (with role validation)
   */
  const updateDatabaseRecord = useCallback(
    async (
      table: TableName,
      id: string,
      data: Record<string, unknown>
    ): Promise<ToolResult> => {
      // Validate role permissions
      const writePermissions: Record<TableName, string[]> = {
        leave_requests: ["manager", "hr"],
        tasks: ["employee", "manager", "hr"],
        announcements: ["manager", "hr"],
        profiles: ["employee", "manager", "hr"], // Own profile only
        company_policies: ["hr"],
      };

      if (!userRole || !writePermissions[table]?.includes(userRole)) {
        return {
          success: false,
          message: `Unauthorized: ${userRole} cannot update ${table}.`,
        };
      }

      setIsSyncing(true);
      try {
        // Build update data with audit fields
        const updateData: Record<string, unknown> = {
          ...data,
          updated_at: new Date().toISOString(),
        };

        // Special handling for leave_requests
        if (table === "leave_requests" && data.status) {
          updateData.reviewed_by = user?.id;
          updateData.reviewed_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from(table)
          .update(updateData)
          .eq("id", id);

        if (error) throw error;

        // Invalidate relevant queries
        const queryKeyMap: Record<TableName, string> = {
          leave_requests: "leave-requests",
          tasks: "tasks",
          announcements: "announcements",
          profiles: "profiles",
          company_policies: "policies",
        };
        await queryClient.invalidateQueries({ queryKey: [queryKeyMap[table]] });

        toast.success(`Updated ${table.replace("_", " ")}`);

        return {
          success: true,
          message: `Updated ${table} record.`,
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Update failed";
        toast.error(msg);
        return { success: false, message: msg };
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, userRole, queryClient]
  );

  /**
   * TOOL: Navigate to a different page
   */
  const triggerNavigation = useCallback(
    (route: string): ToolResult => {
      setIsSyncing(true);
      try {
        return navigateTo(route);
      } finally {
        setTimeout(() => setIsSyncing(false), 300);
      }
    },
    [navigateTo]
  );

  /**
   * TOOL: Approve a leave request
   */
  const approveLeave = useCallback(
    async (leaveId: string): Promise<ToolResult> => {
      if (userRole !== "manager" && userRole !== "hr") {
        return { success: false, message: "Unauthorized: Only managers and HR can approve leave." };
      }

      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from("leave_requests")
          .update({
            status: "approved",
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", leaveId)
          .eq("status", "pending");

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
        toast.success("✅ Leave approved");
        return { success: true, message: "Leave approved." };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to approve";
        toast.error(msg);
        return { success: false, message: msg };
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, userRole, queryClient]
  );

  /**
   * TOOL: Reject a leave request
   */
  const rejectLeave = useCallback(
    async (leaveId: string): Promise<ToolResult> => {
      if (userRole !== "manager" && userRole !== "hr") {
        return { success: false, message: "Unauthorized: Only managers and HR can reject leave." };
      }

      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from("leave_requests")
          .update({
            status: "rejected",
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", leaveId)
          .eq("status", "pending");

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
        toast.success("Leave rejected");
        return { success: true, message: "Leave rejected." };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to reject";
        toast.error(msg);
        return { success: false, message: msg };
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, userRole, queryClient]
  );

  /**
   * TOOL: Create an announcement
   */
  const createAnnouncement = useCallback(
    async (title: string, content: string, priority = "normal"): Promise<ToolResult> => {
      if (userRole !== "manager" && userRole !== "hr") {
        return { success: false, message: "Unauthorized: Only managers and HR can create announcements." };
      }

      setIsSyncing(true);
      try {
        const { data, error } = await supabase
          .from("announcements")
          .insert({ title, content, priority, created_by: user?.id })
          .select()
          .single();

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: ["announcements"] });
        toast.success("📢 Announcement published");
        return { success: true, message: "Announcement created.", data };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to create";
        toast.error(msg);
        return { success: false, message: msg };
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, userRole, queryClient]
  );

  /**
   * TOOL: Update a task status
   */
  const updateTaskStatus = useCallback(
    async (taskId: string, status: string): Promise<ToolResult> => {
      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", taskId);

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast.success(`Task marked as ${status}`);
        return { success: true, message: `Task updated to ${status}.` };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to update task";
        toast.error(msg);
        return { success: false, message: msg };
      } finally {
        setIsSyncing(false);
      }
    },
    [queryClient]
  );

  return {
    // Tools
    fetchCurrentData,
    updateDatabaseRecord,
    triggerNavigation,
    approveLeave,
    rejectLeave,
    createAnnouncement,
    updateTaskStatus,
    
    // State
    isSyncing,
    canExecuteActions: userRole === "manager" || userRole === "hr",
    currentRoute,
    accessibleRoutes,
  };
}
