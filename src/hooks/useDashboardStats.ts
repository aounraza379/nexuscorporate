import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "./useTasks";
import { useLeaveRequests } from "./useLeaveRequests";
import { useAnnouncements } from "./useAnnouncements";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  const { user, userRole } = useAuth();
  const { tasks } = useTasks();
  const { leaveRequests } = useLeaveRequests();
  const { announcements } = useAnnouncements();

  // Fetch employee count for HR
  const { data: employeeCount } = useQuery({
    queryKey: ["employee-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    enabled: userRole === "hr",
  });

  // Fetch team size for managers
  const { data: teamProfiles } = useQuery({
    queryKey: ["team-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, department");
      if (error) throw error;
      return data;
    },
    enabled: userRole === "manager" || userRole === "hr",
  });

  const pendingTasks = tasks?.filter(t => t.status === "pending").length || 0;
  const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress").length || 0;
  const totalTasks = tasks?.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highPriorityTasks = tasks?.filter(t => t.priority === "high" && t.status !== "completed").length || 0;

  const pendingLeaves = leaveRequests?.filter(l => l.status === "pending").length || 0;
  const approvedLeaves = leaveRequests?.filter(l => l.status === "approved").length || 0;

  const onLeaveToday = leaveRequests?.filter(l => {
    if (l.status !== "approved") return false;
    const now = new Date();
    return new Date(l.start_date) <= now && new Date(l.end_date) >= now;
  }).length || 0;

  // Recent activity from real data
  const recentActivity = [
    ...tasks?.slice(0, 3).map(t => ({
      action: t.status === "completed" ? "Task completed" : t.status === "in_progress" ? "Task started" : "Task created",
      item: t.title,
      time: getRelativeTime(t.updated_at || t.created_at || ""),
    })) || [],
    ...announcements?.slice(0, 2).map(a => ({
      action: "Announcement",
      item: a.title,
      time: getRelativeTime(a.created_at || ""),
    })) || [],
    ...leaveRequests?.slice(0, 2).map(l => ({
      action: `Leave ${l.status}`,
      item: `${l.leave_type} leave (${l.start_date})`,
      time: getRelativeTime(l.updated_at || l.created_at),
    })) || [],
  ].sort((a, b) => 0).slice(0, 5);

  const getEmployeeStats = () => [
    { label: "Pending Tasks", value: pendingTasks, trend: `${inProgressTasks} in progress` },
    { label: "Completed", value: completedTasks, trend: `${completionRate}% rate` },
    { label: "Leave Requests", value: leaveRequests?.filter(l => l.user_id === user?.id).length || 0, trend: `${pendingLeaves} pending` },
    { label: "Total Tasks", value: totalTasks, trend: `${highPriorityTasks} high priority` },
  ];

  const getManagerStats = () => [
    { label: "Team Tasks", value: totalTasks, trend: `${highPriorityTasks} high priority` },
    { label: "Team Size", value: teamProfiles?.length || 0, trend: `${onLeaveToday} on leave` },
    { label: "Pending Approvals", value: pendingLeaves, trend: pendingLeaves > 0 ? "Needs attention" : "All clear" },
    { label: "Completion Rate", value: `${completionRate}%`, trend: `${completedTasks} completed` },
  ];

  const getHRStats = () => [
    { label: "Total Employees", value: employeeCount || 0, trend: `${teamProfiles?.length || 0} profiles` },
    { label: "Pending Leaves", value: pendingLeaves, trend: `${approvedLeaves} approved` },
    { label: "Active Tasks", value: totalTasks - completedTasks, trend: `${completedTasks} completed` },
    { label: "Announcements", value: announcements?.length || 0, trend: "Active" },
  ];

  const stats = userRole === "hr" ? getHRStats() : userRole === "manager" ? getManagerStats() : getEmployeeStats();

  return {
    stats,
    recentActivity,
    pendingLeaves,
    highPriorityTasks,
    onLeaveToday,
    completionRate,
  };
}

function getRelativeTime(dateStr: string): string {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
