import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminPengumuman() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengumuman"
        description="Kelola pengumuman dan informasi untuk warga"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Pengumuman
          </Button>
        }
      />
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>Daftar pengumuman akan ditampilkan di sini.</p>
      </div>
    </div>
  );
}
