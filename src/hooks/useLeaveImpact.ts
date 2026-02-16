import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeaveImpact {
  risk: "low" | "medium" | "high";
  absent_count: number;
  total: number;
  available: number;
  percentage: number;
  task_conflicts: { id: string; title: string; due_date: string; priority: string }[];
  ai_summary: string;
}

export function useLeaveImpact() {
  const [impact, setImpact] = useState<LeaveImpact | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImpact = async (params: {
    start_date: string;
    end_date: string;
    department: string;
    request_id?: string;
  }) => {
    if (!params.start_date || !params.end_date || !params.department) return null;
    setIsAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leave-impact-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(params),
        }
      );
      if (!resp.ok) throw new Error("Analysis failed");
      const result = await resp.json();
      setImpact(result);
      return result as LeaveImpact;
    } catch (e) {
      console.error("Impact analysis error:", e);
      setImpact(null);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImpact = () => setImpact(null);

  return { impact, isAnalyzing, analyzeImpact, clearImpact };
}
