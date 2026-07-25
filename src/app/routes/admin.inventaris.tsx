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
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useInventarisList, useCreateInventaris, useUpdateInventaris, useDeleteInventaris,
} from "@/features/inventaris/hooks";
import type { Inventaris, KondisiBarang } from "@/shared/types/database";
import { formatRupiah } from "@/shared/utils/format";

const KONDISI: KondisiBarang[] = ["Baik", "Rusak Ringan", "Rusak Berat", "Hilang"];
const SELECT_CLASS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const kondisiVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Baik: "default",
  "Rusak Ringan": "secondary",
  "Rusak Berat": "destructive",
  Hilang: "outline",
};

export default function AdminInventaris() {
  const { data: list, isLoading } = useInventarisList();
  const createInventaris = useCreateInventaris();
  const updateInventaris = useUpdateInventaris();
  const deleteInventaris = useDeleteInventaris();

  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<Inventaris | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nama_barang: fd.get("nama_barang") as string,
      kategori: (fd.get("kategori") as string) || null,
      jumlah: Number(fd.get("jumlah")),
      kondisi: fd.get("kondisi") as KondisiBarang,
      lokasi_penyimpanan: (fd.get("lokasi_penyimpanan") as string) || null,
      tanggal_pengadaan: (fd.get("tanggal_pengadaan") as string) || null,
      nilai_perolehan: fd.get("nilai_perolehan") ? Number(fd.get("nilai_perolehan")) : null,
      catatan: (fd.get("catatan") as string) || null,
    };
    if (editItem) {
      updateInventaris.mutate({ id: editItem.id, ...payload }, { onSuccess: () => { setDialog(false); setEditItem(null); } });
    } else {
      createInventaris.mutate(payload, { onSuccess: () => setDialog(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventaris"
        description="Kelola aset dan barang inventaris RT"
        actions={
          <Button onClick={() => { setEditItem(null); setDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Barang
          </Button>
        }
      />

      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Jumlah</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada data inventaris</TableCell>
                </TableRow>
              )}
              {list?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nama_barang}</TableCell>
                  <TableCell>{item.kategori ?? "-"}</TableCell>
                  <TableCell className="text-center">{item.jumlah}</TableCell>
                  <TableCell>
                    <Badge variant={kondisiVariant[item.kondisi] ?? "outline"}>{item.kondisi}</Badge>
                  </TableCell>
                  <TableCell>{item.lokasi_penyimpanan ?? "-"}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.nilai_perolehan ? formatRupiah(item.nilai_perolehan) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setDialog(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Barang" : "Tambah Barang"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Barang *</Label>
              <Input name="nama_barang" required defaultValue={editItem?.nama_barang} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input name="kategori" defaultValue={editItem?.kategori ?? ""} placeholder="Peralatan, Elektronik..." />
              </div>
              <div className="space-y-2">
                <Label>Jumlah *</Label>
                <Input name="jumlah" type="number" required min={0} defaultValue={editItem?.jumlah ?? 1} />
              </div>
              <div className="space-y-2">
                <Label>Kondisi *</Label>
                <select name="kondisi" defaultValue={editItem?.kondisi ?? "Baik"} className={SELECT_CLASS}>
                  {KONDISI.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Lokasi Penyimpanan</Label>
                <Input name="lokasi_penyimpanan" defaultValue={editItem?.lokasi_penyimpanan ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Pengadaan</Label>
                <Input name="tanggal_pengadaan" type="date" defaultValue={editItem?.tanggal_pengadaan ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Nilai Perolehan (Rp)</Label>
                <Input name="nilai_perolehan" type="number" min={0} defaultValue={editItem?.nilai_perolehan ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input name="catatan" defaultValue={editItem?.catatan ?? ""} />
            </div>
            <Button type="submit" className="w-full" disabled={createInventaris.isPending || updateInventaris.isPending}>
              {(createInventaris.isPending || updateInventaris.isPending) ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus barang?</AlertDialogTitle>
            <AlertDialogDescription>Data barang akan dinonaktifkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteInventaris.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
