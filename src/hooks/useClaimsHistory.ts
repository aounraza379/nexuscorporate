// =============================================
// useClaimsHistory — Fetches the logged-in user's insurance claims
// Returns sorted claim records from the claims_history table
// =============================================

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Claim {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  claim_date: string;
  status: string;
  provider: string | null;
  claim_reference: string | null;
  created_at: string;
  updated_at: string;
}

export function useClaimsHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["claims-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("claims_history")
        .select("*")
        .eq("user_id", user.id)
        .order("claim_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Claim[];
    },
    enabled: !!user?.id,
  });
}
