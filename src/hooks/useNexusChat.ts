// ============================================================
// Nexus Chat Hook
// Manages AI chat state, context building, and action execution
// Fetches personal data (salary, benefits, claims) for ALL roles
// ============================================================

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "./useTasks";
import { usePolicies } from "./usePolicies";
import { useLeaveRequests } from "./useLeaveRequests";
import { useAnnouncements } from "./useAnnouncements";
import { useAgentActions, parseActionsFromResponse, ActionResult } from "./useAgentActions";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  executedActions?: ActionResult[];
}

interface SalaryInfo {
  basic: number;
  hra: number;
  special_allowance: number;
  pf_deduction: number;
  tax: number;
  insurance: number;
  gross: number;
  net: number;
  currency: string;
}

interface UserContext {
  profile?: {
    id: string;
    full_name: string | null;
    department: string | null;
    bio: string | null;
  };
  salary?: SalaryInfo;
  benefits?: {
    insurance_tier: string;
    total_limit: number;
    amount_spent: number;
    coverage_details: Record<string, any>;
    dependents: Array<Record<string, any>>;
    plan_start_date: string;
    plan_end_date: string | null;
  };
  claims?: Array<{
    id: string;
    claim_date: string;
    category: string;
    description: string;
    amount: number;
    status: string;
    provider: string | null;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string | null;
    priority: string | null;
    due_date: string | null;
  }>;
  leaveRequests?: Array<{
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    reason: string | null;
  }>;
  policies?: Array<{
    id: string;
    title: string;
    content: string;
    category: string | null;
  }>;
  announcements?: Array<{
    id: string;
    title: string;
    content: string;
    priority: string | null;
  }>;
  teamLeaveRequests?: Array<{
    id: string;
    user_id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    reason: string | null;
    employee_name?: string;
  }>;
  allEmployees?: Array<{
    id: string;
    full_name: string | null;
    department: string | null;
  }>;
  teamTasks?: Array<{
    id: string;
    title: string;
    status: string | null;
    priority: string | null;
    assigned_to: string | null;
  }>;
}

export function useNexusChat() {
  const { user, userRole, profile } = useAuth();
  const { tasks } = useTasks();
  const { policies } = usePolicies();
  const { leaveRequests } = useLeaveRequests();
  const { announcements } = useAnnouncements();
  const { executeActions } = useAgentActions();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingActions, setIsExecutingActions] = useState(false);

  // Build context with personal data for ALL roles + role-specific team data
  const buildContext = useCallback(async (): Promise<UserContext> => {
    const context: UserContext = {
      profile: profile ? {
        id: profile.id,
        full_name: profile.full_name,
        department: profile.department,
        bio: profile.bio,
      } : undefined,
    };

    if (!user?.id) return context;

    // --- Fetch personal data (ALL roles get their own data) ---

    // Salary from profile
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("salary_info")
        .eq("id", user.id)
        .single();
      if (profileData?.salary_info && typeof profileData.salary_info === "object") {
        const s = profileData.salary_info as Record<string, any>;
        if (s.basic) {
          context.salary = {
            basic: Number(s.basic),
            hra: Number(s.hra || 0),
            special_allowance: Number(s.special_allowance || 0),
            pf_deduction: Number(s.pf_deduction || 0),
            tax: Number(s.tax || 0),
            insurance: Number(s.insurance || 0),
            gross: Number(s.gross || 0),
            net: Number(s.net || 0),
            currency: String(s.currency || "INR"),
          };
        }
      }
    } catch (e) {
      console.error("Error fetching salary:", e);
    }

    // Benefits
    try {
      const { data: benefitsData } = await supabase
        .from("employee_benefits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (benefitsData) {
        context.benefits = {
          insurance_tier: benefitsData.insurance_tier,
          total_limit: Number(benefitsData.total_limit),
          amount_spent: Number(benefitsData.amount_spent),
          coverage_details: benefitsData.coverage_details as Record<string, any>,
          dependents: benefitsData.dependents as Array<Record<string, any>>,
          plan_start_date: benefitsData.plan_start_date,
          plan_end_date: benefitsData.plan_end_date,
        };
      }
    } catch (e) {
      console.error("Error fetching benefits:", e);
    }

    // Claims history
    try {
      const { data: claimsData } = await supabase
        .from("claims_history")
        .select("id, claim_date, category, description, amount, status, provider")
        .eq("user_id", user.id)
        .order("claim_date", { ascending: false })
        .limit(20);
      if (claimsData && claimsData.length > 0) {
        context.claims = claimsData.map((c) => ({
          id: c.id,
          claim_date: c.claim_date,
          category: c.category,
          description: c.description,
          amount: Number(c.amount),
          status: c.status,
          provider: c.provider,
        }));
      }
    } catch (e) {
      console.error("Error fetching claims:", e);
    }

    // Announcements (all roles)
    if (announcements && announcements.length > 0) {
      context.announcements = announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
      }));
    }

    // Policies (all roles)
    if (policies) {
      context.policies = policies.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category,
      }));
    }

    // --- Role-specific personal tasks & leave ---

    // Personal tasks
    context.tasks = tasks?.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
    }));

    // Personal leave requests
    context.leaveRequests = leaveRequests
      ?.filter((l) => l.user_id === user.id)
      .map((l) => ({
        id: l.id,
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date,
        status: l.status,
        reason: l.reason,
      }));

    // --- Manager: add team data ---
    if (userRole === "manager" || userRole === "hr") {
      // Name map for leave requests
      const userIds = [...new Set(leaveRequests?.map((l) => l.user_id) || [])];
      let nameMap: Record<string, string> = {};

      if (userIds.length > 0) {
        try {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);
          profiles?.forEach((p) => {
            nameMap[p.id] = p.full_name || "Unknown";
          });
        } catch (error) {
          console.error("Error fetching profile names:", error);
        }
      }

      // Team leave requests
      context.teamLeaveRequests = leaveRequests?.map((l) => ({
        id: l.id,
        user_id: l.user_id,
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date,
        status: l.status,
        reason: l.reason,
        employee_name: nameMap[l.user_id] || undefined,
      }));

      // Team tasks
      context.teamTasks = tasks?.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assigned_to: t.assigned_to,
      }));
    }

    // --- HR: add org-wide data ---
    if (userRole === "hr") {
      try {
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, department");
        context.allEmployees = allProfiles?.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          department: p.department,
        }));
      } catch (error) {
        console.error("Error fetching all profiles:", error);
      }
    }

    return context;
  }, [user, userRole, profile, tasks, policies, leaveRequests, announcements]);

  // Send a message to the AI
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      conversationHistory.push({ role: "user", content: content.trim() });

      // Build context with all personal + role data
      const context = await buildContext();

      const { data, error } = await supabase.functions.invoke("nexus-chat", {
        body: {
          messages: conversationHistory,
          userRole: userRole || "employee",
          userId: user?.id,
          context,
        },
      });

      if (error) throw error;

      // Parse actions from AI response
      const { displayMessage, actions } = parseActionsFromResponse(data.message);

      // Execute structured actions
      let executedActions: ActionResult[] = [];
      if (actions.length > 0) {
        setIsExecutingActions(true);
        executedActions = await executeActions(actions);
        setIsExecutingActions(false);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: displayMessage || "Done.",
        timestamp: new Date(),
        executedActions: executedActions.length > 0 ? executedActions : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      console.error("Chat error:", error);

      let errorContent = "I apologize, but I encountered an error. Please try again in a moment.";
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
        errorContent = "I'm receiving too many requests right now. Please wait a moment and try again.";
      } else if (errorMessage.includes("402")) {
        errorContent = "The AI service is temporarily unavailable. Please try again later.";
      }

      const errorMessageObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
      setIsExecutingActions(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return {
    messages,
    isLoading,
    isExecutingActions,
    sendMessage,
    clearMessages,
  };
}
