import { Outlet } from "react-router-dom";
import { Navbar } from "@/shared/components/layout/Navbar";
import { PublicNav } from "@/shared/components/layout/PublicNav";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PublicNav />
      <main className="mx-auto max-w-lg px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
