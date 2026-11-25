import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Home,
  Lock,
  LockOpen,
  Trash2,
} from "lucide-react";
import {
  useCreateJimpitan,
  useDeleteJimpitan,
  useJimpitanByRange,
  useJimpitanSummary,
  useLockJimpitan,
  useUnlockJimpitan,
} from "@/features/keuangan/hooks";
import { useRumahList } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { StatusJimpitan } from "@/shared/types/database";
import type { JimpitanWithRumah } from "@/features/keuangan/services";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { RT_CONFIG } from "@/shared/lib/constants";
import { SELECT_CLASS } from "../constants";
import { AddButton, SectionCard } from "./primitives";

const JIMPITAN_VIEWS = [
  { key: "tanggal", label: "Per Tanggal", icon: CalendarDays },
  { key: "rumah", label: "Per Rumah", icon: Home },
] as const;

export function JimpitanTab({ bulan, tahun }: { bulan: number; tahun: number }) {
  const [view, setView] = useState<string>("tanggal");
  const [showRange, setShowRange] = useState(false);
  const [dari, setDari] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0]!;
  });
  const [sampai, setSampai] = useState(() => new Date().toISOString().split("T")[0]!);
  const { data: jimpitanRange } = useJimpitanByRange(dari, sampai);
  const rangeTotal = jimpitanRange?.reduce((s, j) => s + j.nominal, 0) ?? 0;

  return (
    <SectionCard>
      <div className="mb-3 flex gap-1 rounded-[10px] bg-muted p-0.5">
        {JIMPITAN_VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
              view === v.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <v.icon className="h-3 w-3" strokeWidth={2.5} />
            {v.label}
          </button>
        ))}
      </div>

      {view === "tanggal" && <JimpitanPerTanggal bulan={bulan} tahun={tahun} />}
      {view === "rumah" && <JimpitanPerRumah bulan={bulan} tahun={tahun} />}

      {/* Date range ringkasan */}
      <div className="mt-4 border-t border-border/40 pt-3">
        <button
          onClick={() => setShowRange(!showRange)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-[12.5px] font-bold">Ringkasan Periode</span>
          {showRange
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </button>
        {showRange && (
          <div className="mt-2 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="flex-1 rounded-[11px] text-[12px]" />
              <span className="text-[11px] text-muted-foreground">s/d</span>
              <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="flex-1 rounded-[11px] text-[12px]" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2.5">
              <div>
                <div className="text-[11px] text-muted-foreground">Total Jimpitan terkumpul</div>
                <div className="text-[10.5px] text-muted-foreground">{jimpitanRange?.length ?? 0} pengambilan</div>
              </div>
              <span className="font-mono text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400">{formatRupiah(rangeTotal)}</span>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function JimpitanPerTanggal({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: jimpitanList, isLoading } = useJimpitanSummary(bulan, tahun);
  const { data: rumahList } = useRumahList();
  const createJimpitan = useCreateJimpitan();
  const deleteJimpitan = useDeleteJimpitan();
  const lockJimpitan = useLockJimpitan();
  const unlockJimpitan = useUnlockJimpitan();
  const user = useAuthStore((s) => s.user);

  const [drawer, setDrawer] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, JimpitanWithRumah[]>();
    jimpitanList?.forEach((j) => {
      const list = map.get(j.tanggal) ?? [];
      list.push(j);
      map.set(j.tanggal, list);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [jimpitanList]);

  const totalJimpitan = jimpitanList?.reduce(
    (sum, j) => sum + (j.status === "Diambil" ? j.nominal : 0),
    0,
  ) ?? 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createJimpitan.mutate({
      rumah_id: fd.get("rumah_id") as string,
      tanggal: fd.get("tanggal") as string,
      nominal: Number(fd.get("nominal")),
      status: "Diambil" as StatusJimpitan,
      tipe: (fd.get("tipe") as "harian" | "bulanan") ?? "harian",
      catatan: (fd.get("catatan") as string) || null,
      dicatat_oleh: user?.id ?? "",
    }, { onSuccess: () => setDrawer(false) });
  };

  const handleLock = (tanggal: string) => {
    if (!user?.id) return;
    lockJimpitan.mutate({ tanggal, userId: user.id });
  };

  const handleUnlock = (tanggal: string) => {
    unlockJimpitan.mutate(tanggal);
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12.5px] text-muted-foreground">
          Total: <span className="font-mono font-bold text-foreground">{formatRupiah(totalJimpitan)}</span>
        </div>
        <AddButton label="Catat" onClick={() => setDrawer(true)} />
      </div>

      {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <div className="flex flex-col gap-3">
          {byDate.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Belum ada data</p>
          )}
          {byDate.map(([tanggal, items]) => {
            const isLocked = items.some((j) => j.is_locked);
            const diambil = items.filter((j) => j.status === "Diambil");
            const totalTanggal = diambil.reduce((s, j) => s + j.nominal, 0);
            return (
              <div key={tanggal} className="rounded-xl border border-border/60">
                <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-bold">{formatTanggalPendek(tanggal)}</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(totalTanggal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isLocked ? (
                      <button
                        onClick={() => handleUnlock(tanggal)}
                        disabled={unlockJimpitan.isPending}
                        className="flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-600 transition-transform active:scale-95 dark:text-amber-400"
                      >
                        <Lock className="h-3 w-3" />
                        Terkunci
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLock(tanggal)}
                        disabled={lockJimpitan.isPending}
                        className="flex items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-[10px] font-bold text-muted-foreground transition-transform active:scale-95"
                      >
                        <LockOpen className="h-3 w-3" />
                        Kunci
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-2">
                  {items.map((j) => (
                    <div key={j.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-2">
                      <div>
                        <span className="text-[12.5px] font-bold">Rumah {j.rumah_kk?.no_rumah ?? "-"}</span>
                        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                          {formatRupiah(j.nominal)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                          j.status === "Diambil"
                            ? "bg-primary/15 text-primary"
                            : j.status === "Kosong"
                              ? "border border-border/60 text-muted-foreground"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}>
                          {j.status}
                        </span>
                        {!isLocked && (
                          <button onClick={() => setDeleteId(j.id)} className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive/10 text-destructive transition-transform active:scale-90">
                            <Trash2 className="h-3 w-3" strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomDrawer open={drawer} onOpenChange={setDrawer} title="Catat Jimpitan">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Rumah *</Label>
            <select name="rumah_id" required className={SELECT_CLASS}>
              <option value="">Pilih rumah...</option>
              {rumahList?.filter((r) => r.is_active).map((r) => <option key={r.id} value={r.id}>Rumah {r.no_rumah}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal *</Label>
            <Input name="tanggal" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="rounded-[11px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Nominal (Rp) *</Label>
              <Input name="nominal" type="number" required defaultValue={RT_CONFIG.nominal_jimpitan_default} min={0} className="rounded-[11px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Tipe</Label>
              <select name="tipe" defaultValue="harian" className={SELECT_CLASS}>
                <option value="harian">Harian</option>
                <option value="bulanan">Bulanan</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Catatan</Label>
            <Input name="catatan" className="rounded-[11px]" />
          </div>
          <button type="submit" disabled={createJimpitan.isPending} className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60">
            {createJimpitan.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data jimpitan?</AlertDialogTitle>
            <AlertDialogDescription>Data jimpitan akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteJimpitan.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function JimpitanPerRumah({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: jimpitanList, isLoading } = useJimpitanSummary(bulan, tahun);
  const { data: rumahList } = useRumahList();

  const daysInMonth = new Date(tahun, bulan, 0).getDate();

  const perRumah = useMemo(() => {
    if (!jimpitanList || !rumahList) return [];
    const map = new Map<string, { noRumah: string; mode: string; diambil: number; kosong: number; belum: number; total: number }>();
    jimpitanList.forEach((j) => {
      const existing = map.get(j.rumah_id) ?? {
        noRumah: j.rumah_kk?.no_rumah ?? "-",
        mode: j.rumah_kk?.mode_jimpitan ?? "Harian",
        diambil: 0,
        kosong: 0,
        belum: 0,
        total: 0,
      };
      if (j.status === "Diambil") {
        existing.diambil++;
        existing.total += j.nominal;
      } else if (j.status === "Kosong") existing.kosong++;
      else existing.belum++;
      map.set(j.rumah_id, existing);
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.noRumah.localeCompare(b.noRumah, undefined, { numeric: true }));
  }, [jimpitanList, rumahList]);

  const grandTotal = perRumah.reduce((s, r) => s + r.total, 0);

  return (
    <>
      <div className="mb-3 text-[12.5px] text-muted-foreground">
        {perRumah.length} rumah · Total: <span className="font-mono font-bold text-foreground">{formatRupiah(grandTotal)}</span>
      </div>

      {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <div className="flex flex-col gap-2">
          {perRumah.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Belum ada data</p>
          )}
          {perRumah.map((r) => {
            const expected = r.mode === "Bulanan" ? 1 : daysInMonth;
            const paidPercent = expected > 0 ? Math.round((r.diambil / expected) * 100) : 0;
            return (
              <div key={r.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold">Rumah {r.noRumah}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] font-bold text-muted-foreground">{r.mode}</span>
                  </div>
                  <span className="font-mono text-[12.5px] font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(r.total)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(paidPercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {r.diambil}/{expected}
                  </span>
                </div>
                {r.belum > 0 && (
                  <div className="mt-1 text-[10.5px] text-amber-600 dark:text-amber-400">
                    {r.belum} belum diambil
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
