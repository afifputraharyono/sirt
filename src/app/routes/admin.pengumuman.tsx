import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Pin } from "lucide-react";
import {
  usePengumumanList, useCreatePengumuman, useUpdatePengumuman, useDeletePengumuman,
} from "@/features/pengumuman/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { Pengumuman } from "@/shared/types/database";
import { formatTanggal } from "@/shared/utils/format";

export default function AdminPengumuman() {
  const { data: pengumumanList, isLoading } = usePengumumanList();
  const createPengumuman = useCreatePengumuman();
  const updatePengumuman = useUpdatePengumuman();
  const deletePengumuman = useDeletePengumuman();
  const user = useAuthStore((s) => s.user);

  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<Pengumuman | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      judul: fd.get("judul") as string,
      isi: fd.get("isi") as string,
      kategori: (fd.get("kategori") as string) || null,
      is_pinned: fd.get("is_pinned") === "on",
      tanggal_mulai: fd.get("tanggal_mulai") as string,
      tanggal_berakhir: (fd.get("tanggal_berakhir") as string) || null,
      dibuat_oleh: user?.id ?? "",
    };
    if (editItem) {
      updatePengumuman.mutate({ id: editItem.id, ...payload }, { onSuccess: () => { setDialog(false); setEditItem(null); } });
    } else {
      createPengumuman.mutate(payload, { onSuccess: () => setDialog(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengumuman"
        description="Kelola pengumuman dan informasi untuk warga"
        actions={
          <Button onClick={() => { setEditItem(null); setDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Buat Pengumuman
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : pengumumanList?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Belum ada pengumuman.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pengumumanList?.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {p.is_pinned && <Pin className="h-4 w-4 text-amber-500" />}
                      {p.judul}
                    </CardTitle>
                    <div className="flex gap-2 mt-1">
                      {p.kategori && <Badge variant="secondary">{p.kategori}</Badge>}
                      <span className="text-xs text-muted-foreground">{formatTanggal(p.tanggal_mulai)}</span>
                      {p.tanggal_berakhir && (
                        <span className="text-xs text-muted-foreground">s/d {formatTanggal(p.tanggal_berakhir)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditItem(p); setDialog(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{p.isi}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Pengumuman" : "Buat Pengumuman"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input name="judul" required defaultValue={editItem?.judul} />
            </div>
            <div className="space-y-2">
              <Label>Isi *</Label>
              <textarea
                name="isi"
                required
                rows={5}
                defaultValue={editItem?.isi}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input name="kategori" defaultValue={editItem?.kategori ?? ""} placeholder="Umum, Kegiatan, dll" />
              </div>
              <div className="space-y-2 flex items-end gap-2">
                <input type="checkbox" name="is_pinned" id="is_pinned" defaultChecked={editItem?.is_pinned} className="h-4 w-4" />
                <Label htmlFor="is_pinned">Sematkan</Label>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Mulai *</Label>
                <Input name="tanggal_mulai" type="date" required defaultValue={editItem?.tanggal_mulai ?? new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Berakhir</Label>
                <Input name="tanggal_berakhir" type="date" defaultValue={editItem?.tanggal_berakhir ?? ""} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createPengumuman.isPending || updatePengumuman.isPending}>
              {(createPengumuman.isPending || updatePengumuman.isPending) ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengumuman?</AlertDialogTitle>
            <AlertDialogDescription>Pengumuman akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deletePengumuman.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
