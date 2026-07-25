import { Outlet } from "react-router-dom";
import { Navbar } from "@/shared/components/layout/Navbar";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
