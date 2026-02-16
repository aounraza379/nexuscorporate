import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface EmployeeBenefit {
  id: string;
  user_id: string;
  insurance_tier: string;
  total_limit: number;
  amount_spent: number;
  coverage_details: Record<string, any>;
  dependents: Array<Record<string, any>>;
  plan_start_date: string;
  plan_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmployeeBenefits() {
  const { user } = useAuth();

  const { data: benefits, isLoading, error } = useQuery({
    queryKey: ["employee-benefits", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("employee_benefits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as EmployeeBenefit | null;
    },
    enabled: !!user?.id,
  });

  const spentPercentage = benefits
    ? Math.min(Math.round((benefits.amount_spent / benefits.total_limit) * 100), 100)
    : 0;

  const remaining = benefits
    ? benefits.total_limit - benefits.amount_spent
    : 0;

  return { benefits, isLoading, error, spentPercentage, remaining };
}
