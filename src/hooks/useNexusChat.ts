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

interface UserContext {
  profile?: {
    id: string;
    full_name: string | null;
    department: string | null;
    bio: string | null;
  };
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

  // Build comprehensive context based on user role
  const buildContext = useCallback(async (): Promise<UserContext> => {
    const context: UserContext = {
      profile: profile ? {
        id: profile.id,
        full_name: profile.full_name,
        department: profile.department,
        bio: profile.bio,
      } : undefined,
    };

    // Add announcements for all roles
    if (announcements && announcements.length > 0) {
      context.announcements = announcements.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
      }));
    }

    // Employee context - their own data
    if (userRole === "employee") {
      context.tasks = tasks?.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
      }));

      context.leaveRequests = leaveRequests
        ?.filter(l => l.user_id === user?.id)
        .map(l => ({
          id: l.id,
          leave_type: l.leave_type,
          start_date: l.start_date,
          end_date: l.end_date,
          status: l.status,
          reason: l.reason,
        }));

      context.policies = policies?.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category,
      }));
    }

    // Manager context - own data + team data
    if (userRole === "manager") {
      context.tasks = tasks?.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
      }));

      // Fetch employee names for leave requests
      const userIds = [...new Set(leaveRequests?.map(l => l.user_id) || [])];
      let nameMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        try {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);
          
          profiles?.forEach(p => {
            nameMap[p.id] = p.full_name || "Unknown";
          });
        } catch (error) {
          console.error("Error fetching profile names:", error);
        }
      }

      // All leave requests for approval with employee names
      context.teamLeaveRequests = leaveRequests?.map(l => ({
        id: l.id,
        user_id: l.user_id,
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date,
        status: l.status,
        reason: l.reason,
        employee_name: nameMap[l.user_id] || undefined,
      }));

      // All team tasks
      context.teamTasks = tasks?.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assigned_to: t.assigned_to,
      }));

      context.policies = policies?.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category,
      }));
    }

    // HR context - full organization view
    if (userRole === "hr") {
      // Fetch all employees
      let nameMap: Record<string, string> = {};
      try {
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, department");
        
        context.allEmployees = allProfiles?.map(p => ({
          id: p.id,
          full_name: p.full_name,
          department: p.department,
        }));

        allProfiles?.forEach(p => {
          nameMap[p.id] = p.full_name || "Unknown";
        });
      } catch (error) {
        console.error("Error fetching all profiles:", error);
      }

      // All leave requests with employee names
      context.teamLeaveRequests = leaveRequests?.map(l => ({
        id: l.id,
        user_id: l.user_id,
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date,
        status: l.status,
        reason: l.reason,
        employee_name: nameMap[l.user_id] || undefined,
      }));

      // All tasks
      context.teamTasks = tasks?.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assigned_to: t.assigned_to,
      }));

      // Full policies
      context.policies = policies?.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category,
      }));
    }

    return context;
  }, [user, userRole, profile, tasks, policies, leaveRequests, announcements]);

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
      // Build conversation history for the API
      const conversationHistory = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      conversationHistory.push({ role: "user", content: content.trim() });

      // Build comprehensive context
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

      // Parse AI response for structured actions
      const { displayMessage, actions } = parseActionsFromResponse(data.message);
      
      // Execute all actions
      let executedActions: ActionResult[] = [];
      if (actions.length > 0) {
        setIsExecutingActions(true);
        executedActions = await executeActions(actions);
        setIsExecutingActions(false);
      }

      // Create assistant message with cleaned content (no JSON visible)
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

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    isExecutingActions,
    sendMessage,
    clearMessages,
  };
}
