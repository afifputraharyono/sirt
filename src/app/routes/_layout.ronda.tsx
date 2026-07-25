import { Outlet, Link, useLocation } from "react-router-dom";
import { ClipboardList, Shield, LogOut } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";

const NAV_ITEMS = [
  { label: "Jimpitan", href: "/ronda", icon: ClipboardList },
  { label: "Jadwal", href: "/ronda/jadwal", icon: Shield },
];

export default function RondaLayout() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-primary">Mode Ronda</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {user?.nama_tampilan}
          </span>
          <ThemeToggle />
          <button
            onClick={logout}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background safe-area-pb">
        <div className="mx-auto flex max-w-md">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/ronda"
                ? pathname === "/ronda"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                to={href}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
