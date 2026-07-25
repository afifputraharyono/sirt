import { Link } from "react-router-dom";
import { Menu, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

function getDashboardPath(role: string) {
  if (role === "admin") return "/admin";
  if (role === "ronda") return "/ronda";
  return "/";
}

export function Navbar({ onMenuClick, showMenu }: NavbarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        {showMenu && (
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link to="/" className="text-lg font-bold text-primary">
          SIRT Wonoyoso
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {user ? (
          <Link to={getDashboardPath(user.role)}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
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
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Masuk
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
