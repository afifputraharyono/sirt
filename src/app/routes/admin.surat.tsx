import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function AdminSurat() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Pengantar"
        description="Proses pengajuan surat pengantar warga"
      />
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>Daftar surat pengantar akan ditampilkan di sini.</p>
      </div>
    </div>
  );
}
