import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentNavigator } from "@/contexts/AgentNavigatorContext";
import { toast } from "sonner";

/**
 * Structured action from AI response
 */
export interface AgentAction {
  function: 
    | "approve_leave" 
    | "reject_leave" 
    | "update_task" 
    | "create_task" 
    | "create_announcement" 
    | "navigate"
    | "submit_leave";
  params: Record<string, string | null>;
}

export interface ActionResult {
  success: boolean;
  message: string;
  function: string;
}

/**
 * Parse AI response to extract structured JSON actions
 */
export function parseActionsFromResponse(response: string): {
  displayMessage: string;
  actions: AgentAction[];
} {
  // Find JSON block in response
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  
  let actions: AgentAction[] = [];
  let displayMessage = response;

  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (parsed.actions && Array.isArray(parsed.actions)) {
        actions = parsed.actions;
      }
      // Remove the JSON block from display message
      displayMessage = response.replace(/```json[\s\S]*?```/g, "").trim();
    } catch (error) {
      console.error("Failed to parse action JSON:", error);
    }
  }

  // Clean up extra whitespace
  displayMessage = displayMessage.replace(/\n{3,}/g, "\n\n").trim();

  return { displayMessage, actions };
}

/**
 * Hook that executes parsed AI actions against the database
 */
export function useAgentActions() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const { navigateTo } = useAgentNavigator();

  /**
   * Execute a single action
   */
  const executeAction = useCallback(async (action: AgentAction): Promise<ActionResult> => {
    console.log("[AgentActions] Executing:", action.function, action.params);

    try {
      switch (action.function) {
        // ========================
        // LEAVE MANAGEMENT
        // ========================
        case "approve_leave": {
          if (userRole !== "manager" && userRole !== "hr") {
            return { success: false, message: "Unauthorized", function: action.function };
          }
          
          const { error } = await supabase
            .from("leave_requests")
            .update({
              status: "approved",
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", action.params.leave_id)
            .eq("status", "pending");

          if (error) throw error;
          
          await queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
          toast.success("✅ Leave approved");
          return { success: true, message: "Leave approved", function: action.function };
        }

        case "reject_leave": {
          if (userRole !== "manager" && userRole !== "hr") {
            return { success: false, message: "Unauthorized", function: action.function };
          }

          const { error } = await supabase
            .from("leave_requests")
            .update({
              status: "rejected",
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", action.params.leave_id)
            .eq("status", "pending");

          if (error) throw error;
          
          await queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
          toast.success("Leave rejected");
          return { success: true, message: "Leave rejected", function: action.function };
        }

        case "submit_leave": {
          const { error } = await supabase
            .from("leave_requests")
            .insert({
              user_id: user?.id,
              leave_type: action.params.leave_type || "annual",
              start_date: action.params.start_date,
              end_date: action.params.end_date,
              reason: action.params.reason || null,
              status: "pending",
            });

          if (error) throw error;
          
          await queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
          toast.success("📝 Leave request submitted");
          return { success: true, message: "Leave submitted", function: action.function };
        }

        // ========================
        // TASK MANAGEMENT
        // ========================
        case "update_task": {
          const { error } = await supabase
            .from("tasks")
            .update({
              status: action.params.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", action.params.task_id);

          if (error) throw error;
          
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success(`Task ${action.params.status === "completed" ? "completed" : "updated"}`);
          return { success: true, message: `Task updated to ${action.params.status}`, function: action.function };
        }

        case "create_task": {
          const { error } = await supabase
            .from("tasks")
            .insert({
              title: action.params.title,
              description: action.params.description || null,
              priority: action.params.priority || "medium",
              assigned_to: action.params.assigned_to || user?.id,
              created_by: user?.id,
              status: "pending",
            });

          if (error) throw error;
          
          await queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success("📋 Task created");
          return { success: true, message: "Task created", function: action.function };
        }

        // ========================
        // ANNOUNCEMENTS
        // ========================
        case "create_announcement": {
          if (userRole !== "manager" && userRole !== "hr") {
            return { success: false, message: "Unauthorized", function: action.function };
          }

          const { error } = await supabase
            .from("announcements")
            .insert({
              title: action.params.title,
              content: action.params.content,
              priority: action.params.priority || "normal",
              created_by: user?.id,
            });

          if (error) throw error;
          
          await queryClient.invalidateQueries({ queryKey: ["announcements"] });
          toast.success("📢 Announcement published");
          return { success: true, message: "Announcement created", function: action.function };
        }

        // ========================
        // NAVIGATION
        // ========================
        case "navigate": {
          const result = navigateTo(action.params.route as string);
          if (result.success) {
            toast.success(`Navigating to ${action.params.route}`);
          }
          return { ...result, function: action.function };
        }

        default:
          return { success: false, message: `Unknown action: ${action.function}`, function: action.function };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Action failed";
      console.error(`[AgentActions] Error executing ${action.function}:`, error);
      toast.error(message);
      return { success: false, message, function: action.function };
    }
  }, [user?.id, userRole, queryClient, navigateTo]);

  /**
   * Execute multiple actions in parallel
   */
  const executeActions = useCallback(async (actions: AgentAction[]): Promise<ActionResult[]> => {
    if (actions.length === 0) return [];
    
    console.log(`[AgentActions] Executing ${actions.length} actions...`);
    
    const results = await Promise.all(
      actions.map(action => executeAction(action))
    );

    // Log results
    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => !r.success).length;
    console.log(`[AgentActions] Complete: ${successes} success, ${failures} failed`);

    return results;
  }, [executeAction]);

  return {
    parseActionsFromResponse,
    executeAction,
    executeActions,
    canExecuteActions: userRole === "manager" || userRole === "hr",
  };
}
