import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardInsights } from "@/hooks/useDashboardInsights";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Heart,
  Megaphone,
  CalendarCheck,
  Loader2,
  Zap,
} from "lucide-react";
import { MyBenefitsCard } from "@/components/dashboard/MyBenefitsCard";

const iconMap: Record<string, any> = {
  "Pending Tasks": ListTodo,
  "Completed": CheckCircle2,
  "Leave Requests": CalendarCheck,
  "Total Tasks": ListTodo,
  "Team Tasks": ListTodo,
  "Team Size": Users,
  "Pending Approvals": Clock,
  "Completion Rate": TrendingUp,
  "Total Employees": Users,
  "Pending Leaves": Clock,
  "Active Tasks": ListTodo,
  "Announcements": Megaphone,
};

export default function DashboardHome() {
  const { userRole } = useAuth();
  const { stats, recentActivity, pendingLeaves, highPriorityTasks } = useDashboardStats();
  const { insights, prioritizedTasks, isLoading: insightsLoading, refetch } = useDashboardInsights();

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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = iconMap[stat.label] || ListTodo;
          return (
            <motion.div key={stat.label} variants={itemVariants}>
              <GlassCard hover className="h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1 text-nexus-gradient">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* My Benefits - Employee view */}
      {userRole === "employee" && (
        <motion.div variants={itemVariants}>
          <MyBenefitsCard />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Smart Insights */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard glow>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Smart Insights
              </h3>
              <button
                onClick={() => refetch()}
                className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Refresh
              </button>
            </div>
            {insightsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating insights...</span>
              </div>
            ) : insights ? (
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {insights}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click refresh to generate AI-powered insights based on your data.
              </p>
            )}

            {/* Auto-prioritized tasks */}
            {prioritizedTasks && prioritizedTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <h4 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                  <Zap className="w-4 h-4 text-primary" />
                  Auto-Prioritized Tasks
                </h4>
                <div className="space-y-2">
                  {prioritizedTasks.map((task: any, i: number) => (
                    <div key={task.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-secondary/30">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate">{task.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        task.reason === "Overdue" ? "bg-destructive/20 text-destructive" :
                        task.reason === "High priority" ? "bg-nexus-warning/20 text-nexus-warning" :
                        "bg-primary/20 text-primary"
                      }`}>
                        {task.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.item}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action} • {activity.time}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Manager burnout alert - only show if there are high priority concerns */}
      {userRole === "manager" && (pendingLeaves > 0 || highPriorityTasks > 2) && (
        <motion.div variants={itemVariants}>
          <GlassCard glow>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-nexus-warning" />
                Attention Required
              </h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {pendingLeaves > 0 && (
                <div className="flex-1 min-w-[200px] p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm font-medium">{pendingLeaves} Pending Leave(s)</p>
                  <p className="text-xs text-muted-foreground">
                    Awaiting your review and approval
                  </p>
                </div>
              )}
              {highPriorityTasks > 2 && (
                <div className="flex-1 min-w-[200px] p-3 rounded-lg bg-secondary/50">
                  <p className="text-sm font-medium">{highPriorityTasks} High Priority Tasks</p>
                  <p className="text-xs text-muted-foreground">
                    Consider redistributing workload
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}
