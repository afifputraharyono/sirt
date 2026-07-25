import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@/features/auth/types";
import { useRequireRole } from "@/features/auth/hooks/useRequireRole";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  minRole: Role | "anon";
  children: React.ReactNode;
}

export function AuthGuard({ minRole, children }: AuthGuardProps) {
  const location = useLocation();
  const { user, isLoading, initialized, hasAccess } = useRequireRole(minRole);

  if (!initialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (minRole !== "anon" && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
