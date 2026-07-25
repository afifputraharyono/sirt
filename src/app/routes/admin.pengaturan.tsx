import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function AdminPengaturan() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola pengguna, role, dan konfigurasi RT"
      />
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>Halaman pengaturan akan ditampilkan di sini.</p>
      </div>
    </div>
  );
}
