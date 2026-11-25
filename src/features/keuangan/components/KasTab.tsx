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
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import {
  useCreateKas,
  useDeleteKas,
  useKasByMonth,
  useKasByRange,
} from "@/features/keuangan/hooks";
import { useRumahList } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { TipeKas } from "@/shared/types/database";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { BULAN_NAMES } from "@/shared/lib/labels";
import { toISODate, todayISO } from "@/shared/lib/date";
import { METODE_BAYAR, SELECT_CLASS } from "../constants";
import { AddButton, SectionCard } from "./primitives";

export function KasTab({
  tipe,
  bulan,
  tahun,
  nominal,
}: {
  tipe: TipeKas;
  bulan: number;
  tahun: number;
  nominal: number;
}) {
  const { data: kasList, isLoading } = useKasByMonth(tipe, bulan, tahun);
  const { data: rumahList } = useRumahList();
  const createKas = useCreateKas();
  const deleteKas = useDeleteKas();
  const user = useAuthStore((s) => s.user);

  const [drawer, setDrawer] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showRange, setShowRange] = useState(false);
  const [dari, setDari] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toISODate(d);
  });
  const [sampai, setSampai] = useState(todayISO);
  const { data: kasRange } = useKasByRange(tipe, dari, sampai);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rumahId = fd.get("rumah_id") as string;
    const tanggalBayar = fd.get("tanggal_bayar") as string;
    const metodeBayar = (fd.get("metode_bayar") as string) || null;
    const keterangan = (fd.get("keterangan") as string) || null;

    createKas.mutate({
      rumah_id: rumahId,
      tipe_kas: tipe,
      bulan,
      tahun,
      jumlah: nominal,
      status_bayar: true,
      tanggal_bayar: tanggalBayar,
      metode_bayar: metodeBayar,
      keterangan,
      dicatat_oleh: user?.id ?? "",
    }, { onSuccess: () => setDrawer(false) });
  };

  const activeRumah = rumahList?.filter((r) => r.is_active && r.status_hunian !== "Kosong") ?? [];
  const paidRumahIds = new Set(kasList?.map((k) => k.rumah_id));
  const unpaidRumah = activeRumah.filter((r) => !paidRumahIds.has(r.id));

  const sortedKasList = useMemo(() => {
    if (!kasList) return [];
    return [...kasList].sort((a, b) =>
      (a.rumah_kk?.no_rumah ?? "").localeCompare(b.rumah_kk?.no_rumah ?? "", undefined, { numeric: true })
    );
  }, [kasList]);

  const paidCount = kasList?.length ?? 0;
  const totalCount = activeRumah.length;
  const totalTerkumpul = kasList?.reduce((s, k) => s + k.jumlah, 0) ?? 0;
  const totalExpected = totalCount * nominal;
  const totalKekurangan = totalExpected - totalTerkumpul;

  const rangeTotal = kasRange?.reduce((s, k) => s + k.jumlah, 0) ?? 0;

  const tipeLabel = tipe === "Arisan" ? "Arisan" : `Kas ${tipe}`;

  return (
    <SectionCard>
      {/* Summary bar */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-emerald-500/10 p-2">
          <div className="font-mono text-[14px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {paidCount}/{totalCount}
          </div>
          <div className="text-[10px] text-muted-foreground">Lunas</div>
        </div>
        <div className="rounded-xl bg-primary/10 p-2">
          <div className="font-mono text-[14px] font-extrabold text-primary">{formatRupiah(totalTerkumpul)}</div>
          <div className="text-[10px] text-muted-foreground">Terkumpul</div>
        </div>
        <div className="rounded-xl bg-amber-500/10 p-2">
          <div className="font-mono text-[14px] font-extrabold text-amber-600 dark:text-amber-400">{formatRupiah(totalKekurangan)}</div>
          <div className="text-[10px] text-muted-foreground">Kekurangan</div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12.5px] text-muted-foreground">
          {BULAN_NAMES[bulan]} {tahun} — <span className="font-bold text-foreground">{formatRupiah(nominal)}/rumah</span>
        </div>
        <AddButton label="Catat" onClick={() => setDrawer(true)} />
      </div>

      {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <div className="flex flex-col gap-2">
          {sortedKasList.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
              <div>
                <div className="text-[13px] font-bold">Rumah {k.rumah_kk?.no_rumah ?? "-"}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(k.jumlah)}</span>
                  <span>·</span>
                  <span>{k.tanggal_bayar ? formatTanggalPendek(k.tanggal_bayar) : "-"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">Lunas</span>
                <button onClick={() => setDeleteId(k.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-transform active:scale-90">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          ))}
          {unpaidRumah.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
              <div>
                <div className="text-[13px] font-bold text-amber-700 dark:text-amber-300">Rumah {r.no_rumah}</div>
                <div className="mt-0.5 font-mono text-[11px] text-amber-600 dark:text-amber-400">{formatRupiah(nominal)}</div>
              </div>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">Belum Bayar</span>
            </div>
          ))}
          {sortedKasList.length === 0 && unpaidRumah.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Belum ada data</p>
          )}
        </div>
      )}

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
            <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2.5">
              <div>
                <div className="text-[11px] text-muted-foreground">Total {tipeLabel} terkumpul</div>
                <div className="text-[10.5px] text-muted-foreground">{kasRange?.length ?? 0} pembayaran</div>
              </div>
              <span className="font-mono text-[15px] font-extrabold text-primary">{formatRupiah(rangeTotal)}</span>
            </div>
          </div>
        )}
      </div>

      <BottomDrawer open={drawer} onOpenChange={setDrawer} title={`Catat Pembayaran ${tipeLabel}`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Rumah *</Label>
            <select name="rumah_id" required className={SELECT_CLASS}>
              <option value="">Pilih rumah...</option>
              {unpaidRumah.map((r) => (
                <option key={r.id} value={r.id}>Rumah {r.no_rumah}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal Bayar *</Label>
            <Input name="tanggal_bayar" type="date" required defaultValue={todayISO()} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Metode Bayar</Label>
            <select name="metode_bayar" className={SELECT_CLASS}>
              <option value="">Pilih metode...</option>
              {METODE_BAYAR.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Keterangan</Label>
            <Input name="keterangan" className="rounded-[11px]" />
          </div>
          <button type="submit" disabled={createKas.isPending} className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60">
            {createKas.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>Data pembayaran akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteKas.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
