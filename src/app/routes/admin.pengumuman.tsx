import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Pin, Megaphone } from "lucide-react";
import {
  usePengumumanList, useCreatePengumuman, useUpdatePengumuman, useDeletePengumuman,
} from "@/features/pengumuman/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { Pengumuman } from "@/shared/types/database";
import { formatTanggal } from "@/shared/utils/format";

const INPUT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px] outline-none focus:ring-2 focus:ring-primary/30";
const TEXTAREA_CLASS = "flex w-full rounded-[11px] border border-input bg-background px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 focus:ring-primary/30 resize-y";

export default function AdminPengumuman() {
  const { data: pengumumanList, isLoading } = usePengumumanList();
  const createPengumuman = useCreatePengumuman();
  const updatePengumuman = useUpdatePengumuman();
  const deletePengumuman = useDeletePengumuman();
  const user = useAuthStore((s) => s.user);

  const [drawer, setDrawer] = useState(false);
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
      updatePengumuman.mutate({ id: editItem.id, ...payload }, { onSuccess: () => { setDrawer(false); setEditItem(null); } });
    } else {
      createPengumuman.mutate(payload, { onSuccess: () => setDrawer(false) });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Pengumuman"
        description="Kelola pengumuman dan informasi untuk warga"
        actions={
          <button
            onClick={() => { setEditItem(null); setDrawer(true); }}
            className="flex items-center gap-1.5 rounded-[11px] bg-primary px-3 py-2 text-[13px] font-bold text-primary-foreground transition-transform active:scale-95"
          >
            <Plus className="h-3.75 w-3.75" strokeWidth={2.3} />
            Buat
          </button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : pengumumanList?.length === 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-8 text-center">
          <Megaphone className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[13px] text-muted-foreground">Belum ada pengumuman.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pengumumanList?.map((p, idx) => (
            <div
              key={p.id}
              className={`animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border bg-card p-3.5 ${
                p.is_pinned ? "border-amber-300/60 dark:border-amber-700/40" : "border-border/60"
              }`}
              style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "backwards" }}
            >
              {/* Header */}
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {p.is_pinned && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/40">
                        <Pin className="h-3 w-3 text-amber-600 dark:text-amber-400" strokeWidth={2.3} />
                      </div>
                    )}
                    <span className="text-[14px] font-bold leading-snug">{p.judul}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {p.kategori && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">
                        {p.kategori}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">{formatTanggal(p.tanggal_mulai)}</span>
                    {p.tanggal_berakhir && (
                      <span className="text-[11px] text-muted-foreground">s/d {formatTanggal(p.tanggal_berakhir)}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    onClick={() => { setEditItem(p); setDrawer(true); }}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Pencil className="h-3.75 w-3.75" strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.75 w-3.75" strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <p className="text-[12.5px] leading-relaxed text-muted-foreground line-clamp-3 whitespace-pre-wrap">{p.isi}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Drawer */}
      <BottomDrawer open={drawer} onOpenChange={(open) => { setDrawer(open); if (!open) setEditItem(null); }} title={editItem ? "Edit Pengumuman" : "Buat Pengumuman"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <FormField label="Judul *">
            <input name="judul" required defaultValue={editItem?.judul} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Isi *">
            <textarea
              name="isi"
              required
              rows={4}
              defaultValue={editItem?.isi}
              className={TEXTAREA_CLASS}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kategori">
              <input name="kategori" defaultValue={editItem?.kategori ?? ""} placeholder="Umum, Kegiatan..." className={INPUT_CLASS} />
            </FormField>
            <div className="flex items-end gap-2 pb-0.5">
              <input type="checkbox" name="is_pinned" id="is_pinned" defaultChecked={editItem?.is_pinned} className="h-4.5 w-4.5 rounded accent-primary" />
              <label htmlFor="is_pinned" className="text-[13px] font-semibold">Sematkan</label>
            </div>
            <FormField label="Mulai *">
              <input name="tanggal_mulai" type="date" required defaultValue={editItem?.tanggal_mulai ?? new Date().toISOString().split("T")[0]} className={INPUT_CLASS} />
            </FormField>
            <FormField label="Berakhir">
              <input name="tanggal_berakhir" type="date" defaultValue={editItem?.tanggal_berakhir ?? ""} className={INPUT_CLASS} />
            </FormField>
          </div>
          <button
            type="submit"
            disabled={createPengumuman.isPending || updatePengumuman.isPending}
            className="mt-1 w-full rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            {(createPengumuman.isPending || updatePengumuman.isPending) ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      {/* Delete Confirm */}
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold">{label}</label>
      {children}
    </div>
  );
}
