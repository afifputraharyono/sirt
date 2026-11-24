import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Wallet, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";
import { RT_CONFIG } from "@/shared/lib/constants";

const NAV_ITEMS = [
  { to: "/warga", label: "Beranda", icon: Home },
  { to: "/warga/tagihan", label: "Tagihan", icon: Wallet },
  { to: "/warga/profil", label: "Profil", icon: User },
] as const;

export default function WargaLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Akun dengan password awal buatan admin wajib mengganti password dulu.
  if (user?.must_change_password && pathname !== "/warga/profil") {
    return <Navigate to="/warga/profil" replace />;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-background transition-colors duration-200">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 px-[18px] py-3.5 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary">
              <Home
                className="h-[18px] w-[18px] text-primary-foreground"
                strokeWidth={2.2}
              />
            </div>
            <div>
              <div className="text-[15px] font-extrabold leading-tight tracking-[-0.2px]">
                SIRT Warga
              </div>
              <div className="text-[11px] font-medium text-muted-foreground">
                {user?.nama_tampilan ?? RT_CONFIG.nama_rt}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              aria-label="Keluar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-transform active:scale-90"
            >
              <LogOut className="h-4.5 w-4.5" strokeWidth={2.2} />
            </button>
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
              to === "/warga" ? pathname === "/warga" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-[3px] py-1.5 text-[11px] font-bold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
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
