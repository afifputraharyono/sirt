import { createBrowserRouter } from "react-router-dom";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import PublicLayout from "@/app/routes/_layout.public";
import AdminLayout from "@/app/routes/_layout.admin";

import BerandaPublik from "@/app/routes/index";
import LoginPage from "@/app/routes/login";
import NotFound from "@/app/routes/not-found";

import AdminDashboard from "@/app/routes/admin.dashboard";
import AdminWarga from "@/app/routes/admin.warga";
import AdminKeuangan from "@/app/routes/admin.keuangan";
import AdminRonda from "@/app/routes/admin.ronda";
import AdminSurat from "@/app/routes/admin.surat";
import AdminPengumuman from "@/app/routes/admin.pengumuman";
import AdminInventaris from "@/app/routes/admin.inventaris";
import AdminPengaturan from "@/app/routes/admin.pengaturan";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <BerandaPublik /> },
      { path: "login", element: <LoginPage /> },
      { path: "jadwal", element: <BerandaPublik /> },
      { path: "pengumuman", element: <BerandaPublik /> },
    ],
  },
  {
    path: "admin",
    element: (
      <AuthGuard minRole="admin">
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "warga", element: <AdminWarga /> },
      { path: "keuangan", element: <AdminKeuangan /> },
      { path: "ronda", element: <AdminRonda /> },
      { path: "surat", element: <AdminSurat /> },
      { path: "pengumuman", element: <AdminPengumuman /> },
      { path: "inventaris", element: <AdminInventaris /> },
      { path: "pengaturan", element: <AdminPengaturan /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
