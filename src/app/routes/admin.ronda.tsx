import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import {
  usePeriodeList, useActivePeriode, useCreatePeriode,
  useJadwalByPeriode, useCreateJadwal, useDeleteJadwal,
} from "@/features/ronda/hooks";
import { useRumahList } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const HARI_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const SELECT_CLASS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export default function AdminRonda() {
  const { data: periodeList, isLoading: periodeLoading } = usePeriodeList();
  const { data: activePeriode } = useActivePeriode();
  const createPeriode = useCreatePeriode();
  const user = useAuthStore((s) => s.user);

  const [periodeDialog, setPeriodeDialog] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState<string>("");

  const currentPeriodeId = selectedPeriode || activePeriode?.id || "";

  const handleCreatePeriode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createPeriode.mutate({
      nama_periode: fd.get("nama_periode") as string,
      tanggal_mulai: fd.get("tanggal_mulai") as string,
      tanggal_selesai: fd.get("tanggal_selesai") as string,
      dibuat_oleh: user?.id ?? "",
    }, { onSuccess: () => setPeriodeDialog(false) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Ronda"
        description="Kelola jadwal, periode, dan kehadiran ronda"
        actions={
          <Button onClick={() => setPeriodeDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Buat Periode Baru
          </Button>
        }
      />

      <div className="flex gap-2 items-center">
        <Label className="text-sm whitespace-nowrap">Periode:</Label>
        {periodeLoading ? <Skeleton className="h-10 w-48" /> : (
          <select
            value={currentPeriodeId}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className={SELECT_CLASS + " max-w-xs"}
          >
            <option value="">Pilih periode...</option>
            {periodeList?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama_periode} {p.is_active ? "(Aktif)" : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {currentPeriodeId ? (
        <JadwalRondaTable periodeId={currentPeriodeId} />
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Pilih atau buat periode ronda untuk melihat jadwal.
          </CardContent>
        </Card>
      )}

      <Dialog open={periodeDialog} onOpenChange={setPeriodeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Periode Ronda Baru</DialogTitle></DialogHeader>
          <form onSubmit={handleCreatePeriode} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Periode *</Label>
              <Input name="nama_periode" required placeholder="contoh: Agustus 2026" />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Mulai *</Label>
              <Input name="tanggal_mulai" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Selesai *</Label>
              <Input name="tanggal_selesai" type="date" required />
            </div>
            <Button type="submit" className="w-full" disabled={createPeriode.isPending}>
              {createPeriode.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JadwalRondaTable({ periodeId }: { periodeId: string }) {
  const { data: jadwalList, isLoading } = useJadwalByPeriode(periodeId);
  const { data: rumahList } = useRumahList();
  const createJadwal = useCreateJadwal();
  const deleteJadwal = useDeleteJadwal();

  const [dialog, setDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const wargaLaki = rumahList?.flatMap((r) =>
    r.warga_detail.filter((w) => w.is_active && w.jenis_kelamin === "L")
  ) ?? [];

  const jadwalByHari = HARI_LABELS.map((hari) => ({
    hari,
    anggota: jadwalList?.filter((j) => j.hari === hari) ?? [],
  }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const existingCount = jadwalList?.filter((j) => j.hari === fd.get("hari")).length ?? 0;
    createJadwal.mutate({
      periode_id: periodeId,
      hari: fd.get("hari") as string,
      warga_id: fd.get("warga_id") as string,
      urutan: existingCount + 1,
    }, { onSuccess: () => setDialog(false) });
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {jadwalByHari.map(({ hari, anggota }) => (
          <Card key={hari}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{hari}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {anggota.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada jadwal</p>
              ) : (
                anggota.map((j) => (
                  <div key={j.id} className="flex items-center justify-between text-sm">
                    <span>{j.warga_detail?.nama_lengkap}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteId(j.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Jadwal Ronda</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Hari *</Label>
              <select name="hari" required className={SELECT_CLASS}>
                {HARI_LABELS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Anggota *</Label>
              <select name="warga_id" required className={SELECT_CLASS}>
                <option value="">Pilih warga...</option>
                {wargaLaki.map((w) => <option key={w.id} value={w.id}>{w.nama_lengkap}</option>)}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={createJadwal.isPending}>
              {createJadwal.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus jadwal ronda?</AlertDialogTitle>
            <AlertDialogDescription>Anggota ini akan dihapus dari jadwal.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteJadwal.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
