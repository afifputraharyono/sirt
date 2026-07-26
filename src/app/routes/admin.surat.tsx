import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Printer, FileText } from "lucide-react";
import { useSuratList, useCreateSurat, useUpdateSuratStatus, useDeleteSurat } from "@/features/surat/hooks";
import type { SuratWithWarga } from "@/features/surat/services";
import { useRumahList } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { JenisSurat, StatusSurat } from "@/shared/types/database";
import { formatTanggalPendek } from "@/shared/utils/format";
import { cetakSuratPengantar } from "@/shared/utils/print";
import { supabase } from "@/shared/lib/supabase";

const JENIS_SURAT: JenisSurat[] = [
  "Pengantar KTP", "Pengantar KK", "Domisili", "Keterangan Usaha",
  "Keterangan Tidak Mampu", "Pengantar SKCK", "Keterangan Kematian",
  "Keterangan Pindah", "Lainnya",
];
const STATUS_SURAT: StatusSurat[] = ["Diajukan", "Diproses", "Selesai", "Ditolak"];
const SELECT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";
const INPUT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px] outline-none focus:ring-2 focus:ring-primary/30";

const STATUS_COLORS: Record<string, string> = {
  Diajukan: "border border-border/60 text-muted-foreground",
  Diproses: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  Selesai: "bg-primary/15 text-primary",
  Ditolak: "bg-destructive/15 text-destructive",
};

export default function AdminSurat() {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const { data: suratList, isLoading } = useSuratList(filterStatus || undefined);
  const { data: rumahList } = useRumahList();
  const createSurat = useCreateSurat();
  const updateStatus = useUpdateSuratStatus();
  const deleteSurat = useDeleteSurat();
  const user = useAuthStore((s) => s.user);

  const [createDrawer, setCreateDrawer] = useState(false);
  const [statusDrawer, setStatusDrawer] = useState<{ id: string; current: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allWarga = rumahList?.flatMap((r) => r.warga_detail.filter((w) => w.is_active)) ?? [];

  const handlePrint = async (surat: SuratWithWarga) => {
    const { data: warga } = await supabase
      .from("warga_detail")
      .select("nik, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, pekerjaan")
      .eq("id", surat.warga_id)
      .single();

    cetakSuratPengantar({
      nomor_surat: surat.nomor_surat,
      jenis_surat: surat.jenis_surat,
      nama_lengkap: surat.warga_detail?.nama_lengkap ?? "",
      nik: warga?.nik,
      jenis_kelamin: warga?.jenis_kelamin,
      tempat_lahir: warga?.tempat_lahir,
      tanggal_lahir: warga?.tanggal_lahir,
      agama: warga?.agama,
      pekerjaan: warga?.pekerjaan,
      keperluan: surat.keperluan,
      tujuan: surat.tujuan,
    });
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createSurat.mutate({
      nomor_surat: fd.get("nomor_surat") as string,
      jenis_surat: fd.get("jenis_surat") as JenisSurat,
      warga_id: fd.get("warga_id") as string,
      keperluan: fd.get("keperluan") as string,
      tujuan: (fd.get("tujuan") as string) || null,
    }, { onSuccess: () => setCreateDrawer(false) });
  };

  const handleStatusUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!statusDrawer) return;
    const fd = new FormData(e.currentTarget);
    updateStatus.mutate({
      id: statusDrawer.id,
      status: fd.get("status") as string,
      catatan_admin: (fd.get("catatan_admin") as string) || undefined,
      diproses_oleh: user?.id,
    }, { onSuccess: () => setStatusDrawer(null) });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Surat Pengantar"
        description="Proses pengajuan surat pengantar warga"
        actions={
          <button
            onClick={() => setCreateDrawer(true)}
            className="flex items-center gap-1.5 rounded-[11px] bg-primary px-3 py-2 text-[13px] font-bold text-primary-foreground transition-transform active:scale-95"
          >
            <Plus className="h-3.75 w-3.75" strokeWidth={2.3} />
            Buat Surat
          </button>
        }
      />

      {/* Status filter pills */}
      <div className="animate-in fade-in slide-in-from-bottom-1 -mx-4 overflow-x-auto px-4 scrollbar-none">
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterStatus("")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
              filterStatus === "" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"
            }`}
          >
            Semua
          </button>
          {STATUS_SURAT.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
                filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Surat list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : suratList?.length === 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-8 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[13px] text-muted-foreground">Belum ada surat</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {suratList?.map((s, idx) => (
            <div
              key={s.id}
              className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-3.5"
              style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "backwards" }}
            >
              {/* Top row */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold">{s.warga_detail?.nama_lengkap}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{s.jenis_surat}</div>
                </div>
                <button
                  onClick={() => setStatusDrawer({ id: s.id, current: s.status })}
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold transition-transform active:scale-95 ${STATUS_COLORS[s.status] ?? "border border-border/60 text-muted-foreground"}`}
                >
                  {s.status}
                </button>
              </div>

              {/* Detail */}
              <div className="mb-2.5 text-[12.5px] text-muted-foreground">
                <span className="font-mono text-[11px]">{s.nomor_surat}</span>
                <span className="mx-1.5">·</span>
                <span>{s.keperluan}</span>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between border-t border-border/40 pt-2">
                <span className="text-[11px] text-muted-foreground">
                  {formatTanggalPendek(s.tanggal_diajukan)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePrint(s)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    title="Cetak Surat"
                  >
                    <Printer className="h-3.75 w-3.75" strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.75 w-3.75" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Drawer */}
      <BottomDrawer open={createDrawer} onOpenChange={setCreateDrawer} title="Buat Surat Pengantar">
        <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
          <FormField label="No. Surat *">
            <input name="nomor_surat" required placeholder="001/SP-RT/VII/2026" className={INPUT_CLASS} />
          </FormField>
          <FormField label="Jenis Surat *">
            <select name="jenis_surat" required className={SELECT_CLASS}>
              {JENIS_SURAT.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </FormField>
          <FormField label="Pemohon *">
            <select name="warga_id" required className={SELECT_CLASS}>
              <option value="">Pilih warga...</option>
              {allWarga.map((w) => <option key={w.id} value={w.id}>{w.nama_lengkap}</option>)}
            </select>
          </FormField>
          <FormField label="Keperluan *">
            <input name="keperluan" required className={INPUT_CLASS} />
          </FormField>
          <FormField label="Tujuan">
            <input name="tujuan" className={INPUT_CLASS} />
          </FormField>
          <button
            type="submit"
            disabled={createSurat.isPending}
            className="mt-1 w-full rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            {createSurat.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      {/* Status Update Drawer */}
      <BottomDrawer open={!!statusDrawer} onOpenChange={(open) => !open && setStatusDrawer(null)} title="Ubah Status Surat">
        <form onSubmit={handleStatusUpdate} className="flex flex-col gap-3.5">
          <FormField label="Status *">
            <select name="status" defaultValue={statusDrawer?.current} className={SELECT_CLASS}>
              {STATUS_SURAT.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Catatan Admin">
            <input name="catatan_admin" className={INPUT_CLASS} />
          </FormField>
          <button
            type="submit"
            disabled={updateStatus.isPending}
            className="mt-1 w-full rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            {updateStatus.isPending ? "Menyimpan..." : "Update Status"}
          </button>
        </form>
      </BottomDrawer>

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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold">{label}</label>
      {children}
    </div>
  );
}
