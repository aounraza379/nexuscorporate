import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmployeeOption {
  id: string;
  full_name: string | null;
  department: string | null;
}

/**
 * Fetches a lightweight list of employees for dropdowns / selectors.
 */
export function useEmployeeList() {
  return useQuery({
    queryKey: ["employee-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, department")
        .order("full_name");

      if (error) throw error;
      return data as EmployeeOption[];
    },
  });
}
