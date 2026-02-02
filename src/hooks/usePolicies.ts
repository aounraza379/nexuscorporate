import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Policy {
  id: string;
  title: string;
  content: string;
  category: string | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function usePolicies() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: policies, isLoading, error } = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_policies")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Policy[];
    },
    enabled: !!user,
  });

  const createPolicy = useMutation({
    mutationFn: async (policy: Pick<Policy, "title" | "content" | "category">) => {
      const { data, error } = await supabase
        .from("company_policies")
        .insert({ ...policy, created_by: user?.id, is_active: true })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Policy created successfully");
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
    onError: (error) => {
      toast.error("Failed to create policy: " + error.message);
    },
  });

  const updatePolicy = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Policy> }) => {
      const { data, error } = await supabase
        .from("company_policies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Policy updated successfully");
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
    onError: (error) => {
      toast.error("Failed to update policy: " + error.message);
    },
  });

  const deletePolicy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_policies")
        .update({ is_active: false })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Policy archived");
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
    onError: (error) => {
      toast.error("Failed to archive policy: " + error.message);
    },
  });

  return {
    policies: policies || [],
    isLoading,
    error,
    createPolicy,
    updatePolicy,
    deletePolicy,
    isHR: userRole === "hr",
  };
}
