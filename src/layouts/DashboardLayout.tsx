import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AgentNavigatorProvider } from "@/contexts/AgentNavigatorContext";
import { NexusLogo } from "@/components/NexusLogo";
import { NexusAssistant } from "@/components/NexusAssistant";
import { LiveSyncIndicator } from "@/components/LiveSyncIndicator";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ListTodo,
  FileText,
  Megaphone,
  Users,
  Settings,
  LogOut,
  Bot,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Heart,
  BarChart3,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";

const navItems = {
  employee: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: ListTodo, label: "My Tasks", path: "/dashboard/tasks" },
    { icon: CalendarCheck, label: "Leave", path: "/dashboard/leave" },
    { icon: Wallet, label: "Salary", path: "/dashboard/salary" },
    { icon: Heart, label: "Wellness", path: "/dashboard/wellness" },
    { icon: FileText, label: "Policies", path: "/dashboard/policies" },
    { icon: Megaphone, label: "Announcements", path: "/dashboard/announcements" },
  ],
  manager: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Team", path: "/dashboard/team" },
    { icon: ListTodo, label: "Tasks", path: "/dashboard/tasks" },
    { icon: CalendarCheck, label: "Leave Requests", path: "/dashboard/leave" },
    { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
    { icon: Megaphone, label: "Announcements", path: "/dashboard/announcements" },
  ],
  hr: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Employees", path: "/dashboard/employees" },
    { icon: CalendarCheck, label: "Leave Requests", path: "/dashboard/leave" },
    { icon: FileText, label: "Policies", path: "/dashboard/policies" },
    { icon: Wallet, label: "Payroll", path: "/dashboard/payroll" },
    { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
    { icon: Megaphone, label: "Announcements", path: "/dashboard/announcements" },
  ],
};

function DashboardContent() {
  const { user, profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Open assistant callback for notifications
  const openAssistant = useCallback(() => setAssistantOpen(true), []);

  // Global real-time notifications
  useGlobalNotifications(openAssistant);

  // Real-time sync for announcements, leave_requests, tasks
  const { isConnected } = useRealtimeSync({
    showToasts: true,
    onSync: (table, event) => {
      // Brief syncing indicator
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 500);
    },
  });

  const currentNav = navItems[userRole || "employee"];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen gradient-mesh flex">
      {/* Live Sync Indicator */}
      <LiveSyncIndicator isSyncing={isSyncing} isConnected={isConnected} />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border z-40 flex flex-col"
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && <NexusLogo size="sm" animate={false} />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-auto"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {currentNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 ${sidebarCollapsed ? "px-2.5" : ""}`}
            onClick={() => navigate("/dashboard/settings")}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 text-destructive hover:text-destructive ${sidebarCollapsed ? "px-2.5" : ""}`}
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </Button>
        </div>

        {/* User info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-[280px]"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold">
              Welcome back, {profile?.full_name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* AI Assistant toggle */}
          <Button
            variant="glow"
            onClick={() => setAssistantOpen(true)}
            className="gap-2"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Nexus Agent</span>
          </Button>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Nexus AI Assistant */}
      <NexusAssistant isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />

      {/* Overlay when assistant is open on mobile */}
      {assistantOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAssistantOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
        />
      )}
    </div>
  );
}

// Wrap with AgentNavigatorProvider
export default function DashboardLayout() {
  return (
    <AgentNavigatorProvider>
      <DashboardContent />
    </AgentNavigatorProvider>
  );
}
