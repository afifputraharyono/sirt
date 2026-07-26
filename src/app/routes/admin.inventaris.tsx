import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import {
  useInventarisList, useCreateInventaris, useUpdateInventaris, useDeleteInventaris,
} from "@/features/inventaris/hooks";
import type { Inventaris, KondisiBarang } from "@/shared/types/database";
import { formatRupiah } from "@/shared/utils/format";

const KONDISI: KondisiBarang[] = ["Baik", "Rusak Ringan", "Rusak Berat", "Hilang"];
const SELECT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";
const INPUT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px] outline-none focus:ring-2 focus:ring-primary/30";

const KONDISI_COLORS: Record<string, string> = {
  Baik: "bg-primary/15 text-primary",
  "Rusak Ringan": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "Rusak Berat": "bg-destructive/15 text-destructive",
  Hilang: "border border-border/60 text-muted-foreground",
};

export default function AdminInventaris() {
  const { data: list, isLoading } = useInventarisList();
  const createInventaris = useCreateInventaris();
  const updateInventaris = useUpdateInventaris();
  const deleteInventaris = useDeleteInventaris();

  const [drawer, setDrawer] = useState(false);
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
      updateInventaris.mutate({ id: editItem.id, ...payload }, { onSuccess: () => { setDrawer(false); setEditItem(null); } });
    } else {
      createInventaris.mutate(payload, { onSuccess: () => setDrawer(false) });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Inventaris"
        description="Kelola aset dan barang inventaris RT"
        actions={
          <button
            onClick={() => { setEditItem(null); setDrawer(true); }}
            className="flex items-center gap-1.5 rounded-[11px] bg-primary px-3 py-2 text-[13px] font-bold text-primary-foreground transition-transform active:scale-95"
          >
            <Plus className="h-3.75 w-3.75" strokeWidth={2.3} />
            Tambah
          </button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : list?.length === 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-8 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[13px] text-muted-foreground">Belum ada data inventaris</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {list?.map((item, idx) => (
            <div
              key={item.id}
              className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-3.5"
              style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "backwards" }}
            >
              {/* Top row */}
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold">{item.nama_barang}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${KONDISI_COLORS[item.kondisi] ?? "bg-muted text-muted-foreground"}`}>
                      {item.kondisi}
                    </span>
                    {item.kategori && (
                      <span className="text-[11px] text-muted-foreground">{item.kategori}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    onClick={() => { setEditItem(item); setDrawer(true); }}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Pencil className="h-3.75 w-3.75" strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.75 w-3.75" strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {/* Detail row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                <span>Jumlah: <strong className="text-foreground">{item.jumlah}</strong></span>
                {item.lokasi_penyimpanan && <span>{item.lokasi_penyimpanan}</span>}
                {item.nilai_perolehan != null && (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(item.nilai_perolehan)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Drawer */}
      <BottomDrawer open={drawer} onOpenChange={(open) => { setDrawer(open); if (!open) setEditItem(null); }} title={editItem ? "Edit Barang" : "Tambah Barang"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <FormField label="Nama Barang *">
            <input name="nama_barang" required defaultValue={editItem?.nama_barang} className={INPUT_CLASS} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kategori">
              <input name="kategori" defaultValue={editItem?.kategori ?? ""} placeholder="Peralatan, Elektronik..." className={INPUT_CLASS} />
            </FormField>
            <FormField label="Jumlah *">
              <input name="jumlah" type="number" required min={0} defaultValue={editItem?.jumlah ?? 1} className={INPUT_CLASS} />
            </FormField>
            <FormField label="Kondisi *">
              <select name="kondisi" defaultValue={editItem?.kondisi ?? "Baik"} className={SELECT_CLASS}>
                {KONDISI.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </FormField>
            <FormField label="Lokasi">
              <input name="lokasi_penyimpanan" defaultValue={editItem?.lokasi_penyimpanan ?? ""} className={INPUT_CLASS} />
            </FormField>
            <FormField label="Tgl Pengadaan">
              <input name="tanggal_pengadaan" type="date" defaultValue={editItem?.tanggal_pengadaan ?? ""} className={INPUT_CLASS} />
            </FormField>
            <FormField label="Nilai (Rp)">
              <input name="nilai_perolehan" type="number" min={0} defaultValue={editItem?.nilai_perolehan ?? ""} className={INPUT_CLASS} />
            </FormField>
          </div>
          <FormField label="Catatan">
            <input name="catatan" defaultValue={editItem?.catatan ?? ""} className={INPUT_CLASS} />
          </FormField>
          <button
            type="submit"
            disabled={createInventaris.isPending || updateInventaris.isPending}
            className="mt-1 w-full rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            {(createInventaris.isPending || updateInventaris.isPending) ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      {/* Delete Confirm */}
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold">{label}</label>
      {children}
    </div>
  );
}
