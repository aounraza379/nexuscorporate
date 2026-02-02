import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTasks } from "@/hooks/useTasks";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import {
  Users,
  Mail,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";

export default function TeamPage() {
  const { tasks } = useTasks();
  const { leaveRequests } = useLeaveRequests();

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, department, bio, avatar_url");

      if (error) throw error;
      return data;
    },
  });

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Team Overview
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor your team members
          </p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Size</p>
                <p className="text-2xl font-bold">{teamMembers?.length || 0}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <CheckCircle2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold">
                  {tasks?.filter(t => t.status !== "completed").length || 0}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On Leave Today</p>
                <p className="text-2xl font-bold">
                  {teamMembers?.filter(m => getTeamMemberStats(m.id).onLeave).length || 0}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Team Members Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers?.map((member) => {
            const stats = getTeamMemberStats(member.id);

            return (
              <motion.div key={member.id} variants={itemVariants}>
                <GlassCard hover className="h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {member.full_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {member.full_name || "Unknown"}
                        </h3>
                        {stats.onLeave && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-500 rounded-full">
                            On Leave
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {member.department || "No department"}
                      </p>
                      {member.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{stats.totalTasks}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-500">{stats.completedTasks}</p>
                      <p className="text-xs text-muted-foreground">Done</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-yellow-500">{stats.pendingTasks}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
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
