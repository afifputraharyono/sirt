import type { Role } from "@/features/auth/types";
import { useAuthStore } from "@/features/auth/store";

const ROLE_HIERARCHY: Record<Role | "anon", number> = {
  anon: 0,
  warga: 1,
  ronda: 2,
  admin: 3,
};

export function hasMinRole(
  userRole: Role | null,
  required: Role | "anon"
): boolean {
  return ROLE_HIERARCHY[userRole ?? "anon"] >= ROLE_HIERARCHY[required];
}

export function useRequireRole(minRole: Role | "anon") {
  const { user, role, isLoading, initialized } = useAuthStore();
  const hasAccess = hasMinRole(role, minRole);
  return { user, role, isLoading, initialized, hasAccess };
}
