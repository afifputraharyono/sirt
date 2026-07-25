import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminInventaris() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventaris"
        description="Kelola aset dan peminjaman inventaris RT"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Barang
          </Button>
        }
      />
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>Daftar inventaris akan ditampilkan di sini.</p>
      </div>
    </div>
  );
}
