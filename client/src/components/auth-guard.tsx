import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { getAuthState, hasRole } from "@/lib/auth";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles = ["admin", "manager", "worker"] }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const { user } = getAuthState();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      setLocation("/login");
      return;
    }

    // Redirect to dashboard if not authorized for this page
    if (!hasRole(user, allowedRoles)) {
      setLocation("/");
    }
  }, [user, allowedRoles, setLocation]);

  // If no user or not authorized, don't render children
  if (!user || !hasRole(user, allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
