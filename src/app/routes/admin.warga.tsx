import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminWarga() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Warga"
        description="Kelola data rumah dan warga RT"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Rumah
          </Button>
        }
      />

      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>Tabel data warga akan ditampilkan di sini.</p>
      </div>
    </div>
  );
}
