import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string | null;
  created_by: string | null;
  created_at: string | null;
  expires_at: string | null;
  is_mandatory: boolean;
  read_by: string[];
}

export function useAnnouncements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: announcements, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("announcements-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload) => {
          console.log("Announcement change received:", payload);
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markAsRead = async (announcementId: string) => {
    if (!user) return;
    const { error } = await supabase.rpc("mark_announcement_read", {
      _announcement_id: announcementId,
      _user_id: user.id,
    });
    if (error) {
      console.error("Error marking announcement read:", error);
    } else {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    }
  };

  const unreadMandatory = (announcements || []).filter(
    (a) => a.is_mandatory && !a.read_by?.includes(user?.id || "")
  );

  return {
    announcements: announcements || [],
    unreadMandatory,
    isLoading,
    error,
    markAsRead,
  };
}
