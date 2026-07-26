import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Shield, Megaphone, LogIn } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";
import { RT_CONFIG } from "@/shared/lib/constants";

const NAV_ITEMS = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/jadwal", label: "Jadwal", icon: Shield },
  { to: "/pengumuman", label: "Pengumuman", icon: Megaphone },
] as const;

function getDashboardPath(role: string) {
  if (role === "admin") return "/admin";
  if (role === "ronda") return "/ronda";
  return "/";
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-background transition-colors duration-200">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 px-[18px] pb-0 pt-3.5 backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary">
              <Home className="h-[18px] w-[18px] text-primary-foreground" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold leading-tight tracking-[-0.2px]">
                SIRT Wonoyoso
              </div>
              <div className="text-[11px] font-medium text-muted-foreground">
                {RT_CONFIG.nama_rt}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link to={getDashboardPath(user.role)}>
                <Avatar className="h-[34px] w-[34px]">
                  <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                    {user.nama_tampilan
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex shrink-0 items-center gap-1.5 rounded-[10px] bg-primary px-4 py-[9px] text-[13px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
              >
                <LogIn className="h-[15px] w-[15px]" strokeWidth={2.3} />
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-5">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border/60 bg-background/80 backdrop-blur-2xl safe-area-pb">
        <div className="grid grid-cols-3 px-2.5 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active =
              to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-[3px] py-1.5 text-[11px] font-bold transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={2.3} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
