import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import TasksPage from "./pages/TasksPage";
import LeavePage from "./pages/LeavePage";
import PoliciesPage from "./pages/PoliciesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import SalaryPage from "./pages/SalaryPage";
import BenefitsPage from "./pages/BenefitsPage";
import PayrollPage from "./pages/PayrollPage";
import TeamPage from "./pages/TeamPage";
import EmployeesPage from "./pages/EmployeesPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <AuthPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthRedirect />} />
      
      {/* Protected dashboard routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="salary" element={<SalaryPage />} />
        <Route path="benefits" element={<BenefitsPage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
