import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  ChevronLeft,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  icon: LucideIcon;
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

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    NAV_ITEMS.forEach((item) => {
      if (item.children?.some((c) => location.pathname.startsWith(c.href))) {
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

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link to="/admin" className="text-lg font-bold text-sidebar-primary">
            SIRT Admin
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              const isParentActive = item.children.some((c) =>
                location.pathname.startsWith(c.href)
              );
              const isOpen = expanded.has(item.label);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isParentActive
                        ? "font-medium text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border/50 pl-3">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={onClose}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                              isChildActive
                                ? "bg-sidebar-accent font-medium text-sidebar-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              location.pathname === item.href ||
              (item.href !== "/admin" &&
                location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3">
          <Separator className="mb-3" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sm text-sidebar-foreground"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </aside>
    </>
  );
}
