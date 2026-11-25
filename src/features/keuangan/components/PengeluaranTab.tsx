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
import { ChevronDown, ChevronRight, FolderOpen, Trash2 } from "lucide-react";
import {
  useCreateGrupPengeluaran,
  useCreatePengeluaran,
  useDeleteGrupPengeluaran,
  useDeletePengeluaran,
  useGrupPengeluaran,
  usePengeluaran,
  usePengeluaranByRange,
} from "@/features/keuangan/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { KategoriPengeluaran, SumberDana } from "@/shared/types/database";
import type { PengeluaranWithGrup } from "@/features/keuangan/services";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { toISODate, todayISO } from "@/shared/lib/date";
import { KATEGORI_PENGELUARAN, SELECT_CLASS } from "../constants";
import { AddButton, SectionCard } from "./primitives";

const SUMBER_BADGE: Record<string, string> = {
  "Kas Bapak": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "Kas Ibu": "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  "Jimpitan": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "Arisan": "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

export function PengeluaranTab({
  bulan,
  tahun,
  sumberFilter,
}: {
  bulan: number;
  tahun: number;
  sumberFilter: SumberDana[];
}) {
  const { data: rawList, isLoading } = usePengeluaran(bulan, tahun);
  const { data: grupList } = useGrupPengeluaran();
  const createPengeluaran = useCreatePengeluaran();
  const deletePengeluaran = useDeletePengeluaran();
  const createGrup = useCreateGrupPengeluaran();
  const deleteGrup = useDeleteGrupPengeluaran();
  const user = useAuthStore((s) => s.user);

  const list = useMemo(
    () => rawList?.filter((p) => sumberFilter.includes(p.sumber_dana as SumberDana)) ?? [],
    [rawList, sumberFilter],
  );

  const [drawer, setDrawer] = useState(false);
  const [grupDrawer, setGrupDrawer] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteGrupId, setDeleteGrupId] = useState<string | null>(null);
  const [expandedGrups, setExpandedGrups] = useState<Set<string>>(new Set());
  const [showRange, setShowRange] = useState(false);
  const [dari, setDari] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toISODate(d);
  });
  const [sampai, setSampai] = useState(todayISO);
  const { data: pengeluaranRangeRaw } = usePengeluaranByRange(dari, sampai);
  const pengeluaranRange = useMemo(
    () => pengeluaranRangeRaw?.filter((p) => sumberFilter.includes(p.sumber_dana as SumberDana)) ?? [],
    [pengeluaranRangeRaw, sumberFilter],
  );

  const toggleGrup = (id: string) => {
    const next = new Set(expandedGrups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedGrups(next);
  };

  const { grouped, ungrouped, totalPengeluaran } = useMemo(() => {
    const gMap = new Map<string, { nama: string; items: PengeluaranWithGrup[]; total: number }>();
    const ung: PengeluaranWithGrup[] = [];
    let total = 0;
    list.forEach((p) => {
      total += p.nominal;
      if (p.grup_id && p.grup_pengeluaran) {
        const existing = gMap.get(p.grup_id) ?? { nama: p.grup_pengeluaran.nama, items: [], total: 0 };
        existing.items.push(p);
        existing.total += p.nominal;
        gMap.set(p.grup_id, existing);
      } else {
        ung.push(p);
      }
    });
    return { grouped: gMap, ungrouped: ung, totalPengeluaran: total };
  }, [list]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const grupId = fd.get("grup_id") as string;
    createPengeluaran.mutate({
      tanggal: fd.get("tanggal") as string,
      kategori: fd.get("kategori") as KategoriPengeluaran,
      nominal: Number(fd.get("nominal")),
      keterangan: (fd.get("keterangan") as string) || "",
      sumber_dana: fd.get("sumber_dana") as SumberDana,
      grup_id: grupId || null,
      bukti_url: null,
      dicatat_oleh: user?.id ?? "",
    }, { onSuccess: () => setDrawer(false) });
  };

  const handleGrupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createGrup.mutate({
      nama: fd.get("nama") as string,
      tanggal: fd.get("tanggal") as string,
      catatan: (fd.get("catatan") as string) || null,
      dibuat_oleh: user?.id ?? "",
    }, { onSuccess: () => setGrupDrawer(false) });
  };

  return (
    <SectionCard>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12.5px] text-muted-foreground">
          Total: <span className="font-mono font-bold text-destructive">{formatRupiah(totalPengeluaran)}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setGrupDrawer(true)}
            className="flex items-center gap-1 rounded-xl border border-border/60 px-2.5 py-2 text-[12px] font-bold text-muted-foreground transition-transform active:scale-[0.96]"
          >
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={2.2} />
            Grup
          </button>
          <AddButton label="Catat" onClick={() => setDrawer(true)} />
        </div>
      </div>

      {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <div className="flex flex-col gap-2.5">
          {Array.from(grouped.entries()).map(([grupId, g]) => {
            const isOpen = expandedGrups.has(grupId);
            return (
              <div key={grupId} className="rounded-xl border border-border/60">
                <button
                  onClick={() => toggleGrup(grupId)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors active:bg-muted/50"
                >
                  {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2.5} />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2.5} />
                  }
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold">{g.nama}</span>
                      <span className="text-[10px] text-muted-foreground">{g.items.length} item</span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[12.5px] font-bold text-destructive">
                    {formatRupiah(g.total)}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-border/40 px-2 py-1.5">
                    <div className="flex flex-col gap-1">
                      {g.items.map((p) => (
                        <PengeluaranRow
                          key={p.id}
                          item={p}
                          onDelete={() => setDeleteId(p.id)}
                        />
                      ))}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteGrupId(grupId); }}
                      className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[10.5px] font-bold text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Hapus Grup
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {ungrouped.map((p) => (
            <PengeluaranRow
              key={p.id}
              item={p}
              onDelete={() => setDeleteId(p.id)}
            />
          ))}

          {list.length === 0 && (
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
        {showRange && (() => {
          const rangeTotal = pengeluaranRange.reduce((s, p) => s + p.nominal, 0);
          const bySumber: Record<string, number> = {};
          sumberFilter.forEach((s) => { bySumber[s] = 0; });
          pengeluaranRange.forEach((p) => {
            if (p.sumber_dana in bySumber) bySumber[p.sumber_dana] = (bySumber[p.sumber_dana] ?? 0) + p.nominal;
          });
          return (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="flex-1 rounded-[11px] text-[12px]" />
                <span className="text-[11px] text-muted-foreground">s/d</span>
                <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="flex-1 rounded-[11px] text-[12px]" />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-destructive/10 px-3 py-2.5">
                <div>
                  <div className="text-[11px] text-muted-foreground">Total Pengeluaran</div>
                  <div className="text-[10.5px] text-muted-foreground">{pengeluaranRange.length} transaksi</div>
                </div>
                <span className="font-mono text-[15px] font-extrabold text-destructive">{formatRupiah(rangeTotal)}</span>
              </div>
              <div className="flex flex-col gap-1">
                {sumberFilter.map((src) => (
                  <div key={src} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5">
                    <span className="text-[11.5px] text-muted-foreground">Dari {src}</span>
                    <span className="font-mono text-[11.5px] font-bold text-destructive">{formatRupiah(bySumber[src] ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Drawer: Catat Pengeluaran */}
      <BottomDrawer open={drawer} onOpenChange={setDrawer} title="Catat Pengeluaran">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Tanggal *</Label>
              <Input name="tanggal" type="date" required defaultValue={todayISO()} className="rounded-[11px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Sumber Dana *</Label>
              <select name="sumber_dana" required defaultValue={sumberFilter[0]} className={SELECT_CLASS}>
                {sumberFilter.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Kategori *</Label>
              <select name="kategori" required className={SELECT_CLASS}>
                {KATEGORI_PENGELUARAN.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Nominal (Rp) *</Label>
              <Input name="nominal" type="number" required min={0} className="rounded-[11px]" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Grup Pengeluaran</Label>
            <select name="grup_id" className={SELECT_CLASS}>
              <option value="">Tanpa Grup</option>
              {grupList?.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Keterangan</Label>
            <Input name="keterangan" className="rounded-[11px]" />
          </div>
          <button type="submit" disabled={createPengeluaran.isPending} className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60">
            {createPengeluaran.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      {/* Drawer: Buat Grup */}
      <BottomDrawer open={grupDrawer} onOpenChange={setGrupDrawer} title="Buat Grup Pengeluaran">
        <form onSubmit={handleGrupSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Nama Grup *</Label>
            <Input name="nama" required placeholder="cth: Kegiatan 17 Agustus" className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal *</Label>
            <Input name="tanggal" type="date" required defaultValue={todayISO()} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Catatan</Label>
            <Input name="catatan" className="rounded-[11px]" />
          </div>
          <button type="submit" disabled={createGrup.isPending} className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60">
            {createGrup.isPending ? "Menyimpan..." : "Buat Grup"}
          </button>
        </form>
      </BottomDrawer>

      {/* Delete pengeluaran */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>Data pengeluaran akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deletePengeluaran.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete grup */}
      <AlertDialog open={!!deleteGrupId} onOpenChange={(open) => !open && setDeleteGrupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus grup pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>Grup akan dihapus. Item pengeluaran di dalamnya tetap ada tapi menjadi tanpa grup.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGrupId && deleteGrup.mutate(deleteGrupId, { onSuccess: () => setDeleteGrupId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

function PengeluaranRow({ item, onDelete }: { item: PengeluaranWithGrup; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold">{item.keterangan || item.kategori}</span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{item.kategori}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono font-bold text-destructive">{formatRupiah(item.nominal)}</span>
          <span>·</span>
          <span>{formatTanggalPendek(item.tanggal)}</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${SUMBER_BADGE[item.sumber_dana] ?? ""}`}>
            {item.sumber_dana}
          </span>
        </div>
      </div>
      <button onClick={onDelete} className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-transform active:scale-90">
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
    </div>
  );
}
