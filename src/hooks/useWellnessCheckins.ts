import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WellnessCheckin {
  id: string;
  user_id: string;
  mood: number;
  energy: number;
  stress: number;
  notes: string | null;
  created_at: string;
}

export function useWellnessCheckins() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: checkins, isLoading } = useQuery({
    queryKey: ["wellness-checkins", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wellness_checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as WellnessCheckin[];
    },
    enabled: !!user,
  });

  // Check if user already checked in today
  const todayCheckin = checkins?.find((c) => {
    const checkinDate = new Date(c.created_at).toDateString();
    return checkinDate === new Date().toDateString();
  });

  const submitCheckin = useMutation({
    mutationFn: async (data: { mood: number; energy: number; stress: number; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: result, error } = await supabase
        .from("wellness_checkins")
        .insert({
          user_id: user.id,
          mood: data.mood,
          energy: data.energy,
          stress: data.stress,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Wellness check-in submitted!");
      queryClient.invalidateQueries({ queryKey: ["wellness-checkins"] });
    },
    onError: (error) => {
      toast.error("Failed to submit check-in: " + error.message);
    },
  });

  return {
    checkins: checkins || [],
    todayCheckin,
    isLoading,
    submitCheckin,
    hasCheckedInToday: !!todayCheckin,
  };
}
