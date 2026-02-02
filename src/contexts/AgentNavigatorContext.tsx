import React, { createContext, useContext, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Route configuration with role-based access control
 */
type UserRole = "employee" | "manager" | "hr";

interface RouteConfig {
  path: string;
  roles: UserRole[];
}

const ROUTES: Record<string, RouteConfig> = {
  dashboard: { path: "/dashboard", roles: ["employee", "manager", "hr"] },
  tasks: { path: "/dashboard/tasks", roles: ["employee", "manager", "hr"] },
  leave: { path: "/dashboard/leave", roles: ["employee", "manager", "hr"] },
  policies: { path: "/dashboard/policies", roles: ["employee", "hr"] },
  team: { path: "/dashboard/team", roles: ["manager"] },
  employees: { path: "/dashboard/employees", roles: ["hr"] },
  salary: { path: "/dashboard/salary", roles: ["employee"] },
  payroll: { path: "/dashboard/payroll", roles: ["hr"] },
  wellness: { path: "/dashboard/wellness", roles: ["employee"] },
  analytics: { path: "/dashboard/analytics", roles: ["manager", "hr"] },
  announcements: { path: "/dashboard/announcements", roles: ["employee", "manager", "hr"] },
  settings: { path: "/dashboard/settings", roles: ["employee", "manager", "hr"] },
};

type RouteName = string;

interface NavigationResult {
  success: boolean;
  message: string;
  navigatedTo?: string;
}

interface AgentNavigatorContextType {
  /** Navigate to a route by name or path */
  navigateTo: (route: string) => NavigationResult;
  /** Check if user can access a route */
  canAccessRoute: (route: string) => boolean;
  /** Get current route name */
  currentRoute: string;
  /** Get all accessible routes for current user */
  accessibleRoutes: string[];
  /** Is navigation in progress */
  isNavigating: boolean;
}

const AgentNavigatorContext = createContext<AgentNavigatorContextType | null>(null);

export function AgentNavigatorProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  const getCurrentRouteName = useCallback((): string => {
    const path = location.pathname;
    for (const [name, config] of Object.entries(ROUTES)) {
      if (config.path === path) return name;
    }
    return path;
  }, [location.pathname]);

  const canAccessRoute = useCallback((route: string): boolean => {
    if (!userRole) return false;
    
    // Check by route name
    const routeConfig = ROUTES[route.toLowerCase() as RouteName];
    if (routeConfig) {
      return routeConfig.roles.includes(userRole);
    }
    
    // Check by path
    for (const config of Object.values(ROUTES)) {
      if (config.path === route || config.path === `/dashboard/${route}`) {
        return config.roles.includes(userRole);
      }
    }
    
    return false;
  }, [userRole]);

  const getAccessibleRoutes = useCallback((): string[] => {
    if (!userRole) return [];
    return Object.entries(ROUTES)
      .filter(([_, config]) => config.roles.includes(userRole))
      .map(([name]) => name);
  }, [userRole]);

  const navigateTo = useCallback((route: string): NavigationResult => {
    // Normalize route name
    const normalizedRoute = route.toLowerCase().replace(/\s+/g, "");
    
    // Find matching route
    let targetPath: string | null = null;
    let routeName: string = route;
    
    // Check direct route name match
    const routeConfig = ROUTES[normalizedRoute as RouteName];
    if (routeConfig) {
      targetPath = routeConfig.path;
      routeName = normalizedRoute;
    } else {
      // Try to match by partial name or common aliases
      const aliases: Record<string, RouteName> = {
        home: "dashboard",
        main: "dashboard",
        overview: "dashboard",
        mytasks: "tasks",
        task: "tasks",
        leaverequests: "leave",
        leavemanagement: "leave",
        policy: "policies",
        companypolicies: "policies",
        myteam: "team",
        teamview: "team",
        staff: "employees",
        worker: "employees",
        pay: "salary",
        mysalary: "salary",
        compensation: "payroll",
        health: "wellness",
        wellbeing: "wellness",
        reports: "analytics",
        stats: "analytics",
        news: "announcements",
        updates: "announcements",
        config: "settings",
        preferences: "settings",
      };
      
      const mappedRoute = aliases[normalizedRoute];
      if (mappedRoute && ROUTES[mappedRoute]) {
        targetPath = ROUTES[mappedRoute].path;
        routeName = mappedRoute;
      }
    }
    
    // If still no match, try path-based matching
    if (!targetPath) {
      const possiblePath = `/dashboard/${normalizedRoute}`;
      for (const config of Object.values(ROUTES)) {
        if (config.path === possiblePath) {
          targetPath = config.path;
          break;
        }
      }
    }
    
    if (!targetPath) {
      return {
        success: false,
        message: `Route "${route}" not found. Available: ${getAccessibleRoutes().join(", ")}.`,
      };
    }
    
    // Check authorization
    if (!canAccessRoute(routeName)) {
      return {
        success: false,
        message: `Access denied to ${routeName}. Your role (${userRole}) doesn't have permission.`,
      };
    }
    
    // Perform navigation
    setIsNavigating(true);
    navigate(targetPath);
    
    // Brief delay to show navigation state
    setTimeout(() => setIsNavigating(false), 300);
    
    toast.success(`Navigated to ${routeName}`, { duration: 1500 });
    
    return {
      success: true,
      message: `Navigated to ${routeName}.`,
      navigatedTo: targetPath,
    };
  }, [navigate, canAccessRoute, userRole, getAccessibleRoutes]);

  return (
    <AgentNavigatorContext.Provider
      value={{
        navigateTo,
        canAccessRoute,
        currentRoute: getCurrentRouteName(),
        accessibleRoutes: getAccessibleRoutes(),
        isNavigating,
      }}
    >
      {children}
    </AgentNavigatorContext.Provider>
  );
}

export function useAgentNavigator(): AgentNavigatorContextType {
  const context = useContext(AgentNavigatorContext);
  if (!context) {
    throw new Error("useAgentNavigator must be used within AgentNavigatorProvider");
  }
  return context;
}
