// =============================================
// TeamPage — Team overview for managers/HR
// Shows employee cards with online status, tasks, and leave info
// =============================================

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTasks } from "@/hooks/useTasks";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  Building2,
  CheckCircle2,
  Calendar,
  Circle,
} from "lucide-react";

export default function TeamPage() {
  const { tasks } = useTasks();
  const { leaveRequests } = useLeaveRequests();

  // ── Fetch team members with online status ──
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, department, bio, avatar_url, is_online, last_seen");

      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000, // Refresh every 30s for live status
  });

  // ── Compute per-member task stats ──
  const getTeamMemberStats = (memberId: string) => {
    const memberTasks = tasks?.filter(t => t.assigned_to === memberId) || [];
    const completedTasks = memberTasks.filter(t => t.status === "completed").length;
    const pendingTasks = memberTasks.filter(t => t.status === "pending").length;
    const onLeave = leaveRequests?.some(
      l => l.user_id === memberId &&
           l.status === "approved" &&
           new Date(l.start_date) <= new Date() &&
           new Date(l.end_date) >= new Date()
    );

    return { completedTasks, pendingTasks, totalTasks: memberTasks.length, onLeave };
  };

  // ── Animation variants ──
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // ── Derived counts ──
  const onlineCount = teamMembers?.filter(m => m.is_online).length || 0;
  const onLeaveCount = teamMembers?.filter(m => getTeamMemberStats(m.id).onLeave).length || 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          Team Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor your team's status and activity
        </p>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Team Size</p>
                <p className="text-xl sm:text-2xl font-bold">{teamMembers?.length || 0}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-green-500/10">
                <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 fill-green-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Online Now</p>
                <p className="text-xl sm:text-2xl font-bold text-green-500">{onlineCount}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-accent/10">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {tasks?.filter(t => t.status !== "completed").length || 0}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-muted">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">On Leave</p>
                <p className="text-xl sm:text-2xl font-bold">{onLeaveCount}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Team Members Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <GlassCard key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers?.map((member) => {
            const stats = getTeamMemberStats(member.id);
            const lastSeenText = member.last_seen
              ? formatDistanceToNow(new Date(member.last_seen), { addSuffix: true })
              : "Never";

            return (
              <motion.div key={member.id} variants={itemVariants}>
                <GlassCard hover className="h-full">
                  {/* ── Member header ── */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                        {member.full_name?.charAt(0) || "?"}
                      </div>
                      {/* Online/Offline dot */}
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                          member.is_online ? "bg-green-500" : "bg-muted-foreground/40"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate text-sm sm:text-base">
                          {member.full_name || "Unknown"}
                        </h3>
                        {stats.onLeave && (
                          <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            On Leave
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {member.department || "No department"}
                      </p>
                      {/* Last seen status */}
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        {member.is_online ? (
                          <span className="text-green-500 font-medium">● Online</span>
                        ) : (
                          <span>Last seen {lastSeenText}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* ── Task Stats ── */}
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-base sm:text-lg font-bold text-primary">{stats.totalTasks}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-bold text-green-500">{stats.completedTasks}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Done</p>
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-bold text-yellow-500">{stats.pendingTasks}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
