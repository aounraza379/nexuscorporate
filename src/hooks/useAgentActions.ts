import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Hook providing agentic actions the AI can execute.
 * All actions validate user role via JWT before execution.
 */
export function useAgentActions() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  const approveLeave = useCallback(
    async (leaveId: string): Promise<ActionResult> => {
      // Validate role
      if (userRole !== "manager" && userRole !== "hr") {
        return { success: false, message: "Unauthorized: Only managers and HR can approve leave." };
      }

      try {
        const { error } = await supabase
          .from("leave_requests")
          .update({
            status: "approved",
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", leaveId)
          .eq("status", "pending"); // Only approve pending requests

        if (error) throw error;

        // Immediately invalidate to sync UI
        await queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
        
        toast.success("✅ Leave approved successfully");
        return { success: true, message: "Leave request approved." };
      } catch (error: any) {
        const msg = error.message || "Failed to approve leave request";
        toast.error(msg);
        return { success: false, message: msg };
      }
    },
    [user?.id, userRole, queryClient]
  );

  const rejectLeave = useCallback(
    async (leaveId: string): Promise<ActionResult> => {
      if (userRole !== "manager" && userRole !== "hr") {
        return { success: false, message: "Unauthorized: Only managers and HR can reject leave." };
      }

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
        
        toast.success("Leave request rejected");
        return { success: true, message: "Leave request rejected." };
      } catch (error: any) {
        const msg = error.message || "Failed to reject leave request";
        toast.error(msg);
        return { success: false, message: msg };
      }
    },
    [user?.id, userRole, queryClient]
  );

  const createAnnouncement = useCallback(
    async (title: string, content: string, priority: string = "normal"): Promise<ActionResult> => {
      if (userRole !== "manager" && userRole !== "hr") {
        return { success: false, message: "Unauthorized: Only managers and HR can create announcements." };
      }

      try {
        const { data, error } = await supabase
          .from("announcements")
          .insert({
            title,
            content,
            priority,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: ["announcements"] });
        
        toast.success("📢 Announcement created");
        return { success: true, message: "Announcement published.", data };
      } catch (error: any) {
        const msg = error.message || "Failed to create announcement";
        toast.error(msg);
        return { success: false, message: msg };
      }
    },
    [user?.id, userRole, queryClient]
  );

  /**
   * Analyze leave request for conflicts and provide recommendation
   */
  const analyzeLeaveRequest = useCallback(
    async (leaveId: string): Promise<{ 
      conflicts: string[]; 
      recommendation: "approve" | "caution" | "reject";
      reason: string;
    }> => {
      try {
        // Get the leave request details
        const { data: request } = await supabase
          .from("leave_requests")
          .select("*")
          .eq("id", leaveId)
          .single();

        if (!request) {
          return { conflicts: [], recommendation: "caution", reason: "Leave request not found." };
        }

        // Check for overlapping approved leaves (same date range)
        const { data: overlapping } = await supabase
          .from("leave_requests")
          .select("*, profiles!leave_requests_user_id_fkey(full_name)")
          .eq("status", "approved")
          .neq("user_id", request.user_id)
          .or(`and(start_date.lte.${request.end_date},end_date.gte.${request.start_date})`);

        const conflicts: string[] = [];
        
        if (overlapping && overlapping.length > 0) {
          overlapping.forEach((leave: any) => {
            const name = leave.profiles?.full_name || "Another employee";
            conflicts.push(`${name} is off ${leave.start_date} to ${leave.end_date}`);
          });
        }

        // Build recommendation
        if (conflicts.length === 0) {
          return {
            conflicts: [],
            recommendation: "approve",
            reason: "No conflicts found. Recommend approving this request.",
          };
        } else if (conflicts.length <= 2) {
          return {
            conflicts,
            recommendation: "caution",
            reason: `${conflicts.length} team member(s) off during this period. Consider team coverage.`,
          };
        } else {
          return {
            conflicts,
            recommendation: "reject",
            reason: `${conflicts.length} team members already off. May impact productivity.`,
          };
        }
      } catch (error) {
        console.error("Error analyzing leave:", error);
        return { conflicts: [], recommendation: "caution", reason: "Could not analyze conflicts." };
      }
    },
    []
  );

  return {
    approveLeave,
    rejectLeave,
    createAnnouncement,
    analyzeLeaveRequest,
    canExecuteActions: userRole === "manager" || userRole === "hr",
  };
}
