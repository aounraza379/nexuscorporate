import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { useTasks } from "@/hooks/useTasks";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PieChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--destructive))"];

export default function AnalyticsPage() {
  const { userRole } = useAuth();
  const { tasks } = useTasks();
  const { leaveRequests } = useLeaveRequests();

  // Task status breakdown
  const taskStatusData = [
    { name: "Pending", value: tasks?.filter(t => t.status === "pending").length || 0 },
    { name: "In Progress", value: tasks?.filter(t => t.status === "in_progress").length || 0 },
    { name: "Completed", value: tasks?.filter(t => t.status === "completed").length || 0 },
  ];

  // Task priority breakdown
  const taskPriorityData = [
    { name: "High", value: tasks?.filter(t => t.priority === "high").length || 0 },
    { name: "Medium", value: tasks?.filter(t => t.priority === "medium").length || 0 },
    { name: "Low", value: tasks?.filter(t => t.priority === "low").length || 0 },
  ];

  // Leave requests breakdown
  const leaveStatusData = [
    { name: "Pending", value: leaveRequests?.filter(l => l.status === "pending").length || 0 },
    { name: "Approved", value: leaveRequests?.filter(l => l.status === "approved").length || 0 },
    { name: "Rejected", value: leaveRequests?.filter(l => l.status === "rejected").length || 0 },
  ];

  // Weekly productivity mock data
  const weeklyData = [
    { day: "Mon", tasks: 4, completed: 3 },
    { day: "Tue", tasks: 6, completed: 5 },
    { day: "Wed", tasks: 3, completed: 3 },
    { day: "Thu", tasks: 8, completed: 6 },
    { day: "Fri", tasks: 5, completed: 4 },
  ];

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
            <BarChart3 className="w-6 h-6 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            {userRole === "hr" 
              ? "Organization-wide performance metrics"
              : "Team performance and productivity insights"}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {tasks?.length ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks?.length || 0}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Leaves</p>
                <p className="text-2xl font-bold">
                  {leaveRequests?.filter(l => l.status === "pending").length || 0}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">
                  {tasks?.filter(t => t.priority === "high" && t.status !== "completed").length || 0}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Chart */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-[350px]">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Task Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <RechartsPie>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Weekly Productivity */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-[350px]">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Weekly Productivity
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="tasks" fill="hsl(var(--primary))" name="Assigned" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="hsl(var(--accent))" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Leave Requests Chart */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-[350px]">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Leave Requests Overview
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={leaveStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-[350px]">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Task Priority Distribution
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <RechartsPie>
                <Pie
                  data={taskPriorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="hsl(var(--destructive))" />
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
