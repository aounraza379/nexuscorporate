import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "./useTasks";
import { usePolicies } from "./usePolicies";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useNexusChat() {
  const { user, userRole, profile } = useAuth();
  const { tasks } = useTasks();
  const { policies } = usePolicies();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      // Build context based on the question
      const context: any = { profile };
      
      // Add relevant context based on keywords
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes("task") || lowerContent.includes("work") || lowerContent.includes("assignment")) {
        context.tasks = tasks?.slice(0, 10); // Send top 10 tasks
      }
      if (lowerContent.includes("policy") || lowerContent.includes("policies") || lowerContent.includes("rule")) {
        context.policies = policies?.slice(0, 5); // Send top 5 policies
      }

      const { data, error } = await supabase.functions.invoke("nexus-chat", {
        body: {
          messages: conversationHistory,
          userRole: userRole || "employee",
          userId: user?.id,
          context,
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
