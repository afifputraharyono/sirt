import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";

const PublicLayout = lazy(() => import("@/app/routes/_layout.public"));
const AdminLayout = lazy(() => import("@/app/routes/_layout.admin"));
const RondaLayout = lazy(() => import("@/app/routes/_layout.ronda"));

const BerandaPublik = lazy(() => import("@/app/routes/index"));
const LoginPage = lazy(() => import("@/app/routes/login"));
const JadwalPublik = lazy(() => import("@/app/routes/jadwal"));
const PengumumanPublik = lazy(() => import("@/app/routes/pengumuman.public"));
const NotFound = lazy(() => import("@/app/routes/not-found"));

const AdminDashboard = lazy(() => import("@/app/routes/admin.dashboard"));
const AdminWarga = lazy(() => import("@/app/routes/admin.warga"));
const AdminKeuangan = lazy(() => import("@/app/routes/admin.keuangan"));
const AdminRonda = lazy(() => import("@/app/routes/admin.ronda"));
const AdminSurat = lazy(() => import("@/app/routes/admin.surat"));
const AdminPengumuman = lazy(() => import("@/app/routes/admin.pengumuman"));
const AdminInventaris = lazy(() => import("@/app/routes/admin.inventaris"));
const AdminPengaturan = lazy(() => import("@/app/routes/admin.pengaturan"));

const RondaJimpitan = lazy(() => import("@/app/routes/ronda.jimpitan"));
const RondaJadwal = lazy(() => import("@/app/routes/ronda.jadwal"));

function PageLoader() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: (
      <S>
        <PublicLayout />
      </S>
    ),
    children: [
      { index: true, element: <S><BerandaPublik /></S> },
      { path: "login", element: <S><LoginPage /></S> },
      { path: "jadwal", element: <S><JadwalPublik /></S> },
      { path: "pengumuman", element: <S><PengumumanPublik /></S> },
    ],
  },
  {
    path: "admin",
    element: (
      <AuthGuard minRole="admin">
        <S>
          <AdminLayout />
        </S>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <S><AdminDashboard /></S> },
      { path: "warga", element: <S><AdminWarga /></S> },
      { path: "keuangan", element: <S><AdminKeuangan /></S> },
      { path: "ronda", element: <S><AdminRonda /></S> },
      { path: "surat", element: <S><AdminSurat /></S> },
      { path: "pengumuman", element: <S><AdminPengumuman /></S> },
      { path: "inventaris", element: <S><AdminInventaris /></S> },
      { path: "pengaturan", element: <S><AdminPengaturan /></S> },
    ],
  },
  {
    path: "ronda",
    element: (
      <AuthGuard minRole="ronda">
        <S>
          <RondaLayout />
        </S>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <S><RondaJimpitan /></S> },
      { path: "jadwal", element: <S><RondaJadwal /></S> },
    ],
  },
  { path: "*", element: <S><NotFound /></S> },
]);
