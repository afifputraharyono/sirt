import type { Role } from "@/features/auth/types";

export function dashboardPathFor(role: Role | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "ronda":
      return "/ronda";
    case "warga":
      return "/warga";
    default:
      return "/login";
  }
}
