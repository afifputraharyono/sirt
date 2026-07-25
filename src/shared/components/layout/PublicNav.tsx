import { Link, useLocation } from "react-router-dom";
import { Home, Shield, Megaphone } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/jadwal", label: "Jadwal Ronda", icon: Shield },
  { to: "/pengumuman", label: "Pengumuman", icon: Megaphone },
] as const;

export function PublicNav() {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-14 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-lg items-center gap-1 overflow-x-auto px-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
