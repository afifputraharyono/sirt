import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Wallet,
  Shield,
  FileText,
  Megaphone,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { useTheme } from "@/shared/hooks/useTheme";

type NavItem = {
  label: string;
  icon: typeof Home;
} & (
  | { href: string; children?: never }
  | { href?: never; children: { label: string; href: string }[] }
);

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: Home },
  { label: "Warga", href: "/admin/warga", icon: Users },
  {
    label: "Keuangan",
    icon: Wallet,
    children: [
      { label: "Kas Bapak & Jimpitan", href: "/admin/keuangan/bapak" },
      { label: "Kas Ibu & Arisan", href: "/admin/keuangan/ibu" },
    ],
  },
  { label: "Ronda", href: "/admin/ronda", icon: Shield },
  { label: "Surat", href: "/admin/surat", icon: FileText },
  { label: "Pengumuman", href: "/admin/pengumuman", icon: Megaphone },
  { label: "Inventaris", href: "/admin/inventaris", icon: Package },
  { label: "Pengaturan", href: "/admin/pengaturan", icon: Settings },
];

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useTheme();
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    NAV_ITEMS.forEach((item) => {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        initial.add(item.label);
      }
    });
    return initial;
  });

  const toggleExpand = (label: string) => {
    const next = new Set(expanded);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setExpanded(next);
  };

  const initials = user?.nama_tampilan
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isDark = theme === "dark";

  return (
    <div className="mx-auto min-h-dvh max-w-120 bg-background transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform active:scale-90"
          >
            <Menu className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <span className="text-[15px] font-extrabold tracking-[-0.2px]">
            SIRT Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform active:scale-90"
          >
            {isDark ? (
              <Sun className="h-4.5 w-4.5" strokeWidth={2.2} />
            ) : (
              <Moon className="h-4.5 w-4.5" strokeWidth={2.2} />
            )}
          </button>
          {user && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {initials}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 pb-10 pt-4.5">
        <Outlet />
      </main>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-xs"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[78%] max-w-[320px] flex-col bg-card shadow-[8px_0_30px_-8px_oklch(0.15_0.01_150/0.3)] transition-transform duration-250 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary">
              <Home className="h-4 w-4 text-primary-foreground" strokeWidth={2.3} />
            </div>
            <div>
              <div className="text-[14.5px] font-extrabold leading-tight">SIRT Admin</div>
              <div className="text-[11px] font-medium text-muted-foreground">Wonoyoso</div>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform active:scale-90"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-bold">{user.nama_tampilan}</div>
              <div className="truncate text-[11.5px] text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2.5">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.children) {
                const isParentActive = item.children.some((c) =>
                  pathname.startsWith(c.href)
                );
                const isOpen = expanded.has(item.label);
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={`flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2.75 text-[14px] font-bold transition-colors ${
                        isParentActive
                          ? "text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4.75 w-4.75" strokeWidth={2.2} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                        strokeWidth={2.5}
                      />
                    </button>
                    <div
                      className="grid transition-[grid-template-rows] duration-200 ease-out"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-5 mt-0.5 flex flex-col gap-0.5 border-l border-border/50 pl-3 pb-0.5">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <Link
                                key={child.href}
                                to={child.href}
                                onClick={() => setDrawerOpen(false)}
                                className={`rounded-[9px] px-3 py-2 text-[13px] font-bold transition-colors ${
                                  isChildActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => { setExpanded(new Set()); setDrawerOpen(false); }}
                  className={`flex items-center gap-2.5 rounded-[11px] px-3 py-2.75 text-[14px] font-bold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4.75 w-4.75" strokeWidth={2.2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-border/60 px-3 py-3">
          <button
            onClick={() => {
              setDrawerOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2.75 text-[14px] font-bold text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4.75 w-4.75" strokeWidth={2.2} />
            Keluar
          </button>
        </div>
      </aside>
    </div>
  );
}
