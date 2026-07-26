import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Shield, Calendar } from "lucide-react";
import {
  usePeriodeList, useActivePeriode, useCreatePeriode,
  useJadwalByPeriode, useCreateJadwal, useDeleteJadwal,
} from "@/features/ronda/hooks";
import { useRumahList } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";

const HARI_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const SELECT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";
const INPUT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px] outline-none focus:ring-2 focus:ring-primary/30";

const HARI_COLORS: Record<string, string> = {
  Senin: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  Selasa: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  Rabu: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  Kamis: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  Jumat: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  Sabtu: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400",
  Minggu: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
};

export default function AdminRonda() {
  const { data: periodeList, isLoading: periodeLoading } = usePeriodeList();
  const { data: activePeriode } = useActivePeriode();
  const createPeriode = useCreatePeriode();
  const user = useAuthStore((s) => s.user);

  const [periodeDrawer, setPeriodeDrawer] = useState(false);
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
    }, { onSuccess: () => setPeriodeDrawer(false) });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Jadwal Ronda"
        description="Kelola jadwal, periode, dan kehadiran ronda"
        actions={
          <button
            onClick={() => setPeriodeDrawer(true)}
            className="flex items-center gap-1.5 rounded-[11px] bg-primary px-3 py-2 text-[13px] font-bold text-primary-foreground transition-transform active:scale-95"
          >
            <Plus className="h-3.75 w-3.75" strokeWidth={2.3} />
            Periode Baru
          </button>
        }
      />

      {/* Periode selector */}
      <div className="animate-in fade-in slide-in-from-bottom-1 flex items-center gap-2.5">
        <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-[10px] bg-indigo-100 dark:bg-indigo-950/40">
          <Calendar className="h-3.75 w-3.75 text-indigo-600 dark:text-indigo-400" strokeWidth={2.2} />
        </div>
        {periodeLoading ? <Skeleton className="h-10 flex-1 rounded-[11px]" /> : (
          <select
            value={currentPeriodeId}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className={SELECT_CLASS + " flex-1"}
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
        <JadwalRondaCards periodeId={currentPeriodeId} />
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-8 text-center">
          <Shield className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[13px] text-muted-foreground">Pilih atau buat periode ronda untuk melihat jadwal.</p>
        </div>
      )}

      {/* Create Periode Drawer */}
      <BottomDrawer open={periodeDrawer} onOpenChange={setPeriodeDrawer} title="Buat Periode Ronda Baru">
        <form onSubmit={handleCreatePeriode} className="flex flex-col gap-3.5">
          <FormField label="Nama Periode *">
            <input name="nama_periode" required placeholder="contoh: Agustus 2026" className={INPUT_CLASS} />
          </FormField>
          <FormField label="Tanggal Mulai *">
            <input name="tanggal_mulai" type="date" required className={INPUT_CLASS} />
          </FormField>
          <FormField label="Tanggal Selesai *">
            <input name="tanggal_selesai" type="date" required className={INPUT_CLASS} />
          </FormField>
          <button
            type="submit"
            disabled={createPeriode.isPending}
            className="mt-1 w-full rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            {createPeriode.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>
    </div>
  );
}

function JadwalRondaCards({ periodeId }: { periodeId: string }) {
  const { data: jadwalList, isLoading } = useJadwalByPeriode(periodeId);
  const { data: rumahList } = useRumahList();
  const createJadwal = useCreateJadwal();
  const deleteJadwal = useDeleteJadwal();

  const [drawer, setDrawer] = useState(false);
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
    }, { onSuccess: () => setDrawer(false) });
  };

  if (isLoading) return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Add jadwal button */}
      <button
        onClick={() => setDrawer(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed border-border/80 py-2.5 text-[13px] font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-3.75 w-3.75" strokeWidth={2.3} />
        Tambah Jadwal
      </button>

      {/* Day cards */}
      {jadwalByHari.map(({ hari, anggota }, idx) => (
        <div
          key={hari}
          className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-3.5"
          style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "backwards" }}
        >
          <div className="mb-2.5 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${HARI_COLORS[hari] ?? "bg-muted text-muted-foreground"}`}>
              {hari}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {anggota.length} anggota
            </span>
          </div>

          {anggota.length === 0 ? (
            <p className="py-1 text-[12px] text-muted-foreground/60">Belum ada jadwal</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {anggota.map((j, i) => (
                <div
                  key={j.id}
                  className="flex items-center gap-1.5 rounded-full bg-muted/50 py-1 pl-1 pr-2 text-[12.5px]"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="font-medium">{j.warga_detail?.nama_lengkap}</span>
                  <button
                    onClick={() => setDeleteId(j.id)}
                    className="ml-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="h-2.75 w-2.75" strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Create jadwal drawer */}
      <BottomDrawer open={drawer} onOpenChange={setDrawer} title="Tambah Jadwal Ronda">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <FormField label="Hari *">
            <select name="hari" required className={SELECT_CLASS}>
              {HARI_LABELS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </FormField>
          <FormField label="Anggota *">
            <select name="warga_id" required className={SELECT_CLASS}>
              <option value="">Pilih warga...</option>
              {wargaLaki.map((w) => <option key={w.id} value={w.id}>{w.nama_lengkap}</option>)}
            </select>
          </FormField>
          <button
            type="submit"
            disabled={createJadwal.isPending}
            className="mt-1 w-full rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            {createJadwal.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      {/* Delete confirm */}
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold">{label}</label>
      {children}
    </div>
  );
}
