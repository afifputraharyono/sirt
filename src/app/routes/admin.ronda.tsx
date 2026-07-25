import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminRonda() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Ronda"
        description="Kelola jadwal, periode, dan kehadiran ronda"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Periode Baru
          </Button>
        }
      />
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>Kelola jadwal ronda akan ditampilkan di sini.</p>
      </div>
    </div>
  );
}
