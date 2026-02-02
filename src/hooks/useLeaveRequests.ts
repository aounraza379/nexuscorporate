import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeaveRequests() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: leaveRequests, isLoading, error } = useQuery({
    queryKey: ["leave-requests", user?.id, userRole],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LeaveRequest[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("leave-requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests" },
        (payload) => {
          console.log("Leave request change received:", payload);
          queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const createLeaveRequest = useMutation({
    mutationFn: async (request: Pick<LeaveRequest, "leave_type" | "start_date" | "end_date" | "reason">) => {
      const { data, error } = await supabase
        .from("leave_requests")
        .insert({ ...request, user_id: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Leave request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (error) => {
      toast.error("Failed to submit leave request: " + error.message);
    },
  });

  const updateLeaveRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { data, error } = await supabase
        .from("leave_requests")
        .update({ 
          status, 
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Leave request ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (error) => {
      toast.error("Failed to update leave request: " + error.message);
    },
  });

  return {
    leaveRequests: leaveRequests || [],
    isLoading,
    error,
    createLeaveRequest,
    updateLeaveRequest,
  };
}
