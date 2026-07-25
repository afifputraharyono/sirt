import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import { useSuratList, useCreateSurat, useUpdateSuratStatus, useDeleteSurat } from "@/features/surat/hooks";
import { useRumahList } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { JenisSurat, StatusSurat } from "@/shared/types/database";
import { formatTanggalPendek } from "@/shared/utils/format";

const JENIS_SURAT: JenisSurat[] = [
  "Pengantar KTP", "Pengantar KK", "Domisili", "Keterangan Usaha",
  "Keterangan Tidak Mampu", "Pengantar SKCK", "Keterangan Kematian",
  "Keterangan Pindah", "Lainnya",
];
const STATUS_SURAT: StatusSurat[] = ["Diajukan", "Diproses", "Selesai", "Ditolak"];
const SELECT_CLASS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Diajukan: "outline",
  Diproses: "secondary",
  Selesai: "default",
  Ditolak: "destructive",
};

export default function AdminSurat() {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const { data: suratList, isLoading } = useSuratList(filterStatus || undefined);
  const { data: rumahList } = useRumahList();
  const createSurat = useCreateSurat();
  const updateStatus = useUpdateSuratStatus();
  const deleteSurat = useDeleteSurat();
  const user = useAuthStore((s) => s.user);

  const [createDialog, setCreateDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ id: string; current: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allWarga = rumahList?.flatMap((r) => r.warga_detail.filter((w) => w.is_active)) ?? [];

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createSurat.mutate({
      nomor_surat: fd.get("nomor_surat") as string,
      jenis_surat: fd.get("jenis_surat") as JenisSurat,
      warga_id: fd.get("warga_id") as string,
      keperluan: fd.get("keperluan") as string,
      tujuan: (fd.get("tujuan") as string) || null,
    }, { onSuccess: () => setCreateDialog(false) });
  };

  const handleStatusUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!statusDialog) return;
    const fd = new FormData(e.currentTarget);
    updateStatus.mutate({
      id: statusDialog.id,
      status: fd.get("status") as string,
      catatan_admin: (fd.get("catatan_admin") as string) || undefined,
      diproses_oleh: user?.id,
    }, { onSuccess: () => setStatusDialog(null) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Pengantar"
        description="Proses pengajuan surat pengantar warga"
        actions={
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Buat Surat
          </Button>
        }
      />

      <div className="flex gap-2">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SELECT_CLASS + " w-40"}>
          <option value="">Semua Status</option>
          {STATUS_SURAT.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Surat</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Keperluan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suratList?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada surat</TableCell>
                </TableRow>
              )}
              {suratList?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.nomor_surat}</TableCell>
                  <TableCell>{s.jenis_surat}</TableCell>
                  <TableCell>{s.warga_detail?.nama_lengkap}</TableCell>
                  <TableCell className="max-w-xs truncate">{s.keperluan}</TableCell>
                  <TableCell>{formatTanggalPendek(s.tanggal_diajukan)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[s.status] ?? "outline"}
                      className="cursor-pointer"
                      onClick={() => setStatusDialog({ id: s.id, current: s.status })}
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Surat Pengantar</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>No. Surat *</Label>
              <Input name="nomor_surat" required placeholder="001/SP-RT/VII/2026" />
            </div>
            <div className="space-y-2">
              <Label>Jenis Surat *</Label>
              <select name="jenis_surat" required className={SELECT_CLASS}>
                {JENIS_SURAT.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pemohon *</Label>
              <select name="warga_id" required className={SELECT_CLASS}>
                <option value="">Pilih warga...</option>
                {allWarga.map((w) => <option key={w.id} value={w.id}>{w.nama_lengkap}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Keperluan *</Label>
              <Input name="keperluan" required />
            </div>
            <div className="space-y-2">
              <Label>Tujuan</Label>
              <Input name="tujuan" />
            </div>
            <Button type="submit" className="w-full" disabled={createSurat.isPending}>
              {createSurat.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={(open) => !open && setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ubah Status Surat</DialogTitle></DialogHeader>
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Status *</Label>
              <select name="status" defaultValue={statusDialog?.current} className={SELECT_CLASS}>
                {STATUS_SURAT.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Catatan Admin</Label>
              <Input name="catatan_admin" />
            </div>
            <Button type="submit" className="w-full" disabled={updateStatus.isPending}>
              {updateStatus.isPending ? "Menyimpan..." : "Update Status"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus surat?</AlertDialogTitle>
            <AlertDialogDescription>Data surat akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteSurat.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
