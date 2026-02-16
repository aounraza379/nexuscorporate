import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface PrioritizedTask {
  id: string;
  title: string;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  urgencyScore: number;
  reason: string;
}

export function useDashboardInsights() {
  const { user } = useAuth();

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["dashboard-insights", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("dashboard-insights");
      if (error) throw error;
      return data as { insights: string; taskPrioritization: PrioritizedTask[] };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchOnWindowFocus: false,
  });

  return {
    insights: data?.insights || null,
    prioritizedTasks: data?.taskPrioritization || [],
    isLoading,
    error,
    refetch,
  };
}
