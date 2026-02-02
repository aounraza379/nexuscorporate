import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
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
} from "lucide-react";

// Mock data for dashboard
const employeeStats = [
  { label: "Pending Tasks", value: 5, icon: ListTodo, trend: "+2 this week" },
  { label: "Completed", value: 12, icon: CheckCircle2, trend: "85% rate" },
  { label: "Wellness Score", value: 78, icon: Heart, trend: "+5 vs last week" },
  { label: "Hours Logged", value: 42, icon: Clock, trend: "On track" },
];

const managerStats = [
  { label: "Team Tasks", value: 23, icon: ListTodo, trend: "4 overdue" },
  { label: "Team Size", value: 8, icon: Users, trend: "1 on leave" },
  { label: "Burnout Risk", value: 2, icon: AlertTriangle, trend: "Needs attention" },
  { label: "Productivity", value: "94%", icon: TrendingUp, trend: "+8% vs target" },
];

const hrStats = [
  { label: "Total Employees", value: 142, icon: Users, trend: "+3 this month" },
  { label: "Open Positions", value: 7, icon: ListTodo, trend: "4 in progress" },
  { label: "Policy Updates", value: 2, icon: Sparkles, trend: "Pending review" },
  { label: "Avg Satisfaction", value: "4.2", icon: Heart, trend: "↑ 0.3" },
];

const recentActivity = [
  { action: "Task completed", item: "Q4 Report Review", time: "2 hours ago" },
  { action: "Policy updated", item: "Remote Work Guidelines", time: "5 hours ago" },
  { action: "New announcement", item: "Holiday Schedule 2024", time: "1 day ago" },
  { action: "Task assigned", item: "Client Presentation", time: "1 day ago" },
];

export default function DashboardHome() {
  const { userRole, profile } = useAuth();

  const stats =
    userRole === "hr"
      ? hrStats
      : userRole === "manager"
      ? managerStats
      : employeeStats;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
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
        {stats.map((stat, index) => (
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
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userRole === "employee" && (
                <>
                  <QuickActionButton label="View Tasks" />
                  <QuickActionButton label="Check Salary" />
                  <QuickActionButton label="Wellness Check" />
                  <QuickActionButton label="Request Leave" />
                  <QuickActionButton label="View Policies" />
                  <QuickActionButton label="Ask Nexus AI" highlight />
                </>
              )}
              {userRole === "manager" && (
                <>
                  <QuickActionButton label="Team Overview" />
                  <QuickActionButton label="Approve Tasks" />
                  <QuickActionButton label="Burnout Alerts" highlight />
                  <QuickActionButton label="Create Task" />
                  <QuickActionButton label="Announcement" />
                  <QuickActionButton label="Analytics" />
                </>
              )}
              {userRole === "hr" && (
                <>
                  <QuickActionButton label="Employee List" />
                  <QuickActionButton label="Edit Policies" />
                  <QuickActionButton label="Payroll" />
                  <QuickActionButton label="Train AI" highlight />
                  <QuickActionButton label="Analytics" />
                  <QuickActionButton label="Announcements" />
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
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
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Role-specific widgets */}
      {userRole === "manager" && (
        <motion.div variants={itemVariants}>
          <GlassCard glow>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-nexus-warning" />
                Burnout Risk Alert
              </h3>
              <span className="px-2 py-1 bg-nexus-warning/20 text-nexus-warning text-xs rounded-full">
                2 Team Members
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              AI sentiment analysis detected potential burnout indicators. Consider
              scheduling 1-on-1 meetings this week.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg bg-secondary/50">
                <p className="text-sm font-medium">Alex Johnson</p>
                <p className="text-xs text-muted-foreground">
                  Working late 5 days • Low engagement score
                </p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-secondary/50">
                <p className="text-sm font-medium">Sarah Chen</p>
                <p className="text-xs text-muted-foreground">
                  Overdue tasks • Wellness score drop
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}

function QuickActionButton({
  label,
  highlight = false,
}: {
  label: string;
  highlight?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-4 rounded-lg text-sm font-medium text-left transition-all flex items-center justify-between group ${
        highlight
          ? "bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 hover:border-primary/50"
          : "bg-secondary/50 hover:bg-secondary border border-transparent"
      }`}
    >
      <span>{label}</span>
      <ArrowUpRight
        className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
          highlight ? "text-primary" : ""
        }`}
      />
    </motion.button>
  );
}
