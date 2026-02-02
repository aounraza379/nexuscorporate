import { useCallback } from "react";
import { useAgentToolbox, ToolResult } from "./useAgentToolbox";

/**
 * Action types the AI can emit
 */
interface AgentAction {
  type: "approve_leave" | "reject_leave" | "create_announcement" | "navigate" | "update_task";
  params: Record<string, string>;
}

/**
 * Result of parsing and executing an AI response
 */
export interface ParsedResponse {
  displayMessage: string;
  executedActions: Array<{ action: AgentAction; result: ToolResult }>;
  hadActions: boolean;
}

/**
 * Patterns to detect action intents in AI responses
 */
const ACTION_PATTERNS = [
  // JSON-style action blocks
  {
    regex: /\{[\s\S]*?"action"\s*:\s*"(approve_leave|reject_leave)"[\s\S]*?"id"\s*:\s*"([^"]+)"[\s\S]*?\}/gi,
    parser: (match: RegExpMatchArray): AgentAction | null => {
      const action = match[1]?.toLowerCase();
      const id = match[2];
      if (action === "approve_leave" && id) {
        return { type: "approve_leave", params: { id } };
      }
      if (action === "reject_leave" && id) {
        return { type: "reject_leave", params: { id } };
      }
      return null;
    },
  },
  // Natural language: "I've approved leave ID:abc123" or "Done. Approved."
  {
    regex: /(?:approved?|approving)\s+(?:leave\s+)?(?:ID[:\s]*)?([a-f0-9-]{8,36})/gi,
    parser: (match: RegExpMatchArray): AgentAction | null => {
      const id = match[1];
      if (id && id.length >= 8) {
        return { type: "approve_leave", params: { id } };
      }
      return null;
    },
  },
  // Natural language rejection
  {
    regex: /(?:rejected?|rejecting)\s+(?:leave\s+)?(?:ID[:\s]*)?([a-f0-9-]{8,36})/gi,
    parser: (match: RegExpMatchArray): AgentAction | null => {
      const id = match[1];
      if (id && id.length >= 8) {
        return { type: "reject_leave", params: { id } };
      }
      return null;
    },
  },
  // Navigation: "Opening Analytics..." or "Navigating to tasks"
  {
    regex: /(?:opening|navigating to|going to|showing)\s+(analytics|tasks?|leave|announcements?|team|employees?|settings|policies|dashboard|home|salary|wellness|payroll)/gi,
    parser: (match: RegExpMatchArray): AgentAction | null => {
      const route = match[1]?.toLowerCase();
      if (route) {
        // Normalize route names
        const routeMap: Record<string, string> = {
          task: "tasks",
          announcement: "announcements",
          employee: "employees",
          home: "dashboard",
        };
        return { type: "navigate", params: { route: routeMap[route] || route } };
      }
      return null;
    },
  },
  // Task update: "Task marked as completed" or "Updated task abc123 to in_progress"
  {
    regex: /(?:task|updated?)\s+(?:ID[:\s]*)?([a-f0-9-]{8,36})?\s*(?:to|as|marked as)\s*(completed?|in_progress|pending)/gi,
    parser: (match: RegExpMatchArray): AgentAction | null => {
      const id = match[1];
      const status = match[2]?.toLowerCase();
      if (id && status) {
        const statusMap: Record<string, string> = {
          complete: "completed",
          completed: "completed",
        };
        return { type: "update_task", params: { id, status: statusMap[status] || status } };
      }
      return null;
    },
  },
  // Create announcement JSON
  {
    regex: /\{[\s\S]*?"action"\s*:\s*"create_announcement"[\s\S]*?"title"\s*:\s*"([^"]+)"[\s\S]*?"content"\s*:\s*"([^"]+)"[\s\S]*?\}/gi,
    parser: (match: RegExpMatchArray): AgentAction | null => {
      const title = match[1];
      const content = match[2];
      if (title && content) {
        return { type: "create_announcement", params: { title, content, priority: "normal" } };
      }
      return null;
    },
  },
];

/**
 * Patterns to clean up JSON and action blocks from display
 */
const CLEANUP_PATTERNS = [
  // Remove JSON blocks entirely
  /```json[\s\S]*?```/gi,
  /\{[\s\S]*?"action"[\s\S]*?\}/gi,
  // Remove action prefixes
  /^\s*(?:executing|running|action):\s*/gim,
  // Trim excessive whitespace
  /\n{3,}/g,
];

/**
 * Hook that parses AI responses for actions and executes them
 */
export function useAgentActionParser() {
  const { 
    approveLeave, 
    rejectLeave, 
    createAnnouncement, 
    triggerNavigation, 
    updateTaskStatus 
  } = useAgentToolbox();

  /**
   * Extract actions from AI response text
   */
  const extractActions = useCallback((text: string): AgentAction[] => {
    const actions: AgentAction[] = [];
    const seenIds = new Set<string>();

    for (const { regex, parser } of ACTION_PATTERNS) {
      // Reset regex state
      regex.lastIndex = 0;
      
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        const action = parser(match);
        if (action) {
          // Deduplicate by action type + id
          const key = `${action.type}:${action.params.id || action.params.route || ""}`;
          if (!seenIds.has(key)) {
            seenIds.add(key);
            actions.push(action);
          }
        }
      }
    }

    return actions;
  }, []);

  /**
   * Execute a single action
   */
  const executeAction = useCallback(async (action: AgentAction): Promise<ToolResult> => {
    switch (action.type) {
      case "approve_leave":
        return await approveLeave(action.params.id);
      
      case "reject_leave":
        return await rejectLeave(action.params.id);
      
      case "create_announcement":
        return await createAnnouncement(
          action.params.title,
          action.params.content,
          action.params.priority || "normal"
        );
      
      case "navigate":
        return triggerNavigation(action.params.route);
      
      case "update_task":
        return await updateTaskStatus(action.params.id, action.params.status);
      
      default:
        return { success: false, message: "Unknown action type" };
    }
  }, [approveLeave, rejectLeave, createAnnouncement, triggerNavigation, updateTaskStatus]);

  /**
   * Clean JSON and action blocks from text for display
   */
  const cleanForDisplay = useCallback((text: string): string => {
    let cleaned = text;
    
    for (const pattern of CLEANUP_PATTERNS) {
      cleaned = cleaned.replace(pattern, "");
    }
    
    // Replace multiple newlines with double newline
    cleaned = cleaned.replace(/\n{2,}/g, "\n\n");
    
    return cleaned.trim();
  }, []);

  /**
   * Main function: Parse AI response, execute actions, return clean display text
   */
  const parseAndExecute = useCallback(async (aiResponse: string): Promise<ParsedResponse> => {
    // 1. Extract all actions from the response
    const actions = extractActions(aiResponse);
    
    // 2. Execute all actions in parallel
    const executedActions: Array<{ action: AgentAction; result: ToolResult }> = [];
    
    if (actions.length > 0) {
      const results = await Promise.all(
        actions.map(async (action) => {
          const result = await executeAction(action);
          return { action, result };
        })
      );
      executedActions.push(...results);
    }

    // 3. Clean the response for display
    const displayMessage = cleanForDisplay(aiResponse);

    return {
      displayMessage,
      executedActions,
      hadActions: actions.length > 0,
    };
  }, [extractActions, executeAction, cleanForDisplay]);

  return {
    parseAndExecute,
    extractActions,
    cleanForDisplay,
  };
}
