import { useMemo, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import { Check, ChevronDown, ChevronRight, ListChecks, Plus } from "lucide-react";
import {
  useKasByMonth, useCreateKas, useDeleteKas, useKasByRange, useUpsertKasBatch,
} from "@/features/keuangan/hooks";
import { useRumahList } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { RumahKK } from "@/shared/types/database";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { RT_CONFIG } from "@/shared/lib/constants";

const BULAN_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const SELECT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";
const METODE_BAYAR = ["Cash", "Transfer"] as const;
const TODAY = new Date().toISOString().split("T")[0]!;

const CHIP_PAID_KAS = "flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10.5px] font-bold text-emerald-600 transition-transform active:scale-95 dark:text-emerald-400";
const CHIP_PAID_ARISAN = "flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-1 text-[10.5px] font-bold text-violet-600 transition-transform active:scale-95 dark:text-violet-400";
const CHIP_UNPAID = "flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/5 px-2 py-1 text-[10.5px] font-bold text-amber-600 transition-transform active:scale-95 dark:text-amber-400";
const CHIP_MUTED = "flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10.5px] font-semibold text-muted-foreground";

export function IbuArisanTab({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: kasList, isLoading: kasLoading } = useKasByMonth("Ibu", bulan, tahun);
  const { data: arisanList } = useKasByMonth("Arisan", bulan, tahun);
  const { data: rumahList, isLoading: rumahLoading } = useRumahList();
  const createKas = useCreateKas();
  const deleteKas = useDeleteKas();
  const upsertBatch = useUpsertKasBatch();
  const user = useAuthStore((s) => s.user);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rumahId, setRumahId] = useState("");
  const [bayarKas, setBayarKas] = useState(true);
  const [bayarArisan, setBayarArisan] = useState(false);
  const [tanggal, setTanggal] = useState(TODAY);
  const [metode, setMetode] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTanggal, setBulkTanggal] = useState(TODAY);
  const [bulkMetode, setBulkMetode] = useState("");
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  const [showRange, setShowRange] = useState(false);
  const [dari, setDari] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0]!;
  });
  const [sampai, setSampai] = useState(TODAY);
  const { data: kasRange } = useKasByRange("Ibu", dari, sampai);
  const { data: arisanRange } = useKasByRange("Arisan", dari, sampai);

  const kasMap = useMemo(
    () => new Map((kasList ?? []).map((k) => [k.rumah_id, k])),
    [kasList],
  );
  const arisanMap = useMemo(
    () => new Map((arisanList ?? []).map((k) => [k.rumah_id, k])),
    [arisanList],
  );

  const houses = useMemo(
    () => (rumahList ?? [])
      .filter((r) => r.is_active && r.status_hunian !== "Kosong")
      .sort((a, b) => a.no_rumah.localeCompare(b.no_rumah, undefined, { numeric: true })),
    [rumahList],
  );
  const peserta = houses.filter((r) => r.ikut_arisan);

  const kasPaid = houses.filter((r) => kasMap.has(r.id)).length;
  const arisanPaid = peserta.filter((r) => arisanMap.has(r.id)).length;
  const isLoading = kasLoading || rumahLoading;
  const totalKas = kasList?.reduce((s, k) => s + k.jumlah, 0) ?? 0;
  const totalArisan = arisanList?.reduce((s, k) => s + k.jumlah, 0) ?? 0;
  const totalTerkumpul = totalKas + totalArisan;

  const selected = houses.find((r) => r.id === rumahId);
  const selectedKas = rumahId ? kasMap.get(rumahId) : undefined;
  const selectedArisan = rumahId ? arisanMap.get(rumahId) : undefined;

  const openFor = (rumah: RumahKK | null) => {
    setRumahId(rumah?.id ?? "");
    setBayarKas(rumah ? !kasMap.has(rumah.id) : true);
    setBayarArisan(rumah ? rumah.ikut_arisan && !arisanMap.has(rumah.id) : false);
    setTanggal(TODAY);
    setMetode("");
    setKeterangan("");
    setDrawerOpen(true);
  };

  const handleRumahChange = (id: string) => {
    const rumah = houses.find((r) => r.id === id);
    setRumahId(id);
    if (!rumah) {
      setBayarKas(true);
      setBayarArisan(false);
      return;
    }
    setBayarKas(!kasMap.has(id));
    setBayarArisan(rumah.ikut_arisan && !arisanMap.has(id));
  };

  const bayarKasAktif = bayarKas && !selectedKas;
  const bayarArisanAktif = bayarArisan && !!selected?.ikut_arisan && !selectedArisan;
  const bisaSimpan = !!selected && (bayarKasAktif || bayarArisanAktif);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected || !bisaSimpan) return;
    const base = {
      rumah_id: selected.id,
      bulan,
      tahun,
      status_bayar: true,
      tanggal_bayar: tanggal || TODAY,
      metode_bayar: metode || null,
      keterangan: keterangan || null,
      dicatat_oleh: user?.id ?? "",
    };
    try {
      if (bayarKasAktif) {
        await createKas.mutateAsync({
          ...base,
          tipe_kas: "Ibu",
          jumlah: RT_CONFIG.nominal_kas_bulanan_ibu,
        });
      }
      if (bayarArisanAktif) {
        await createKas.mutateAsync({
          ...base,
          tipe_kas: "Arisan",
          jumlah: RT_CONFIG.nominal_arisan,
        });
      }
      setDrawerOpen(false);
    } catch {
      // toast error sudah ditangani hook
    }
  };

  const bulkRows = useMemo(
    () => houses.filter((r) => !kasMap.has(r.id) || (r.ikut_arisan && !arisanMap.has(r.id))),
    [houses, kasMap, arisanMap],
  );

  const bulkSelection = useMemo(() => {
    const items: { rumah: RumahKK; tipe: "Ibu" | "Arisan"; jumlah: number }[] = [];
    bulkRows.forEach((r) => {
      if (bulkSelected.has(`${r.id}:Ibu`)) {
        items.push({ rumah: r, tipe: "Ibu", jumlah: RT_CONFIG.nominal_kas_bulanan_ibu });
      }
      if (r.ikut_arisan && bulkSelected.has(`${r.id}:Arisan`)) {
        items.push({ rumah: r, tipe: "Arisan", jumlah: RT_CONFIG.nominal_arisan });
      }
    });
    return items;
  }, [bulkRows, bulkSelected]);

  const bulkTotal = bulkSelection.reduce((s, i) => s + i.jumlah, 0);

  const openBulk = () => {
    const initial = new Set<string>();
    houses.forEach((r) => {
      if (!kasMap.has(r.id)) initial.add(`${r.id}:Ibu`);
      if (r.ikut_arisan && !arisanMap.has(r.id)) initial.add(`${r.id}:Arisan`);
    });
    setBulkSelected(initial);
    setBulkTanggal(TODAY);
    setBulkMetode("");
    setBulkOpen(true);
  };

  const toggleBulk = (key: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllBulk = () => {
    const next = new Set<string>();
    bulkRows.forEach((r) => {
      if (!kasMap.has(r.id)) next.add(`${r.id}:Ibu`);
      if (r.ikut_arisan && !arisanMap.has(r.id)) next.add(`${r.id}:Arisan`);
    });
    setBulkSelected(next);
  };

  const handleBulkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (bulkSelection.length === 0) return;
    const base = {
      bulan,
      tahun,
      status_bayar: true,
      tanggal_bayar: bulkTanggal || TODAY,
      metode_bayar: bulkMetode || null,
      keterangan: null,
      dicatat_oleh: user?.id ?? "",
    };
    try {
      await upsertBatch.mutateAsync(bulkSelection.map((i) => ({
        ...base,
        rumah_id: i.rumah.id,
        tipe_kas: i.tipe,
        jumlah: i.jumlah,
      })));
      setBulkOpen(false);
    } catch {
      // toast error sudah ditangani hook
    }
  };

  const kasRangeTotal = kasRange?.reduce((s, k) => s + k.jumlah, 0) ?? 0;
  const arisanRangeTotal = arisanRange?.reduce((s, k) => s + k.jumlah, 0) ?? 0;

  return (
    <div className="rounded-[18px] border border-border/60 bg-card p-4">
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-emerald-500/10 p-2">
          <div className="font-mono text-[14px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {kasPaid}/{houses.length}
          </div>
          <div className="text-[10px] text-muted-foreground">Kas Ibu</div>
        </div>
        <div className="rounded-xl bg-violet-500/10 p-2">
          <div className="font-mono text-[14px] font-extrabold text-violet-600 dark:text-violet-400">
            {arisanPaid}/{peserta.length}
          </div>
          <div className="text-[10px] text-muted-foreground">Arisan</div>
        </div>
        <div className="rounded-xl bg-primary/10 p-2">
          <div className="font-mono text-[12px] font-extrabold leading-tight text-primary">{formatRupiah(totalTerkumpul)}</div>
          <div className="text-[10px] text-muted-foreground">Terkumpul</div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[12.5px] text-muted-foreground">
          {BULAN_NAMES[bulan]} {tahun} — <span className="font-bold text-foreground">Kas {formatRupiah(RT_CONFIG.nominal_kas_bulanan_ibu)}</span>
          {" · "}
          <span className="font-bold text-foreground">Arisan {formatRupiah(RT_CONFIG.nominal_arisan)}</span>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={openBulk}
            className="flex items-center gap-1 rounded-xl border border-border/60 px-2.5 py-2 text-[12px] font-bold text-muted-foreground transition-transform active:scale-[0.96]"
          >
            <ListChecks className="h-3.5 w-3.5" strokeWidth={2.2} />
            Massal
          </button>
          <button
            onClick={() => openFor(null)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Catat
          </button>
        </div>
      </div>

      {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <div className="flex flex-col gap-2">
          {houses.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Belum ada rumah aktif</p>
          )}
          {houses.map((rumah) => {
            const kas = kasMap.get(rumah.id);
            const arisan = arisanMap.get(rumah.id);
            const isPeserta = rumah.ikut_arisan;
            const lengkap = !!kas && (!isPeserta || !!arisan);
            return (
              <div key={rumah.id} className={`rounded-xl border px-3 py-2.5 ${lengkap ? "border-border/60" : "border-amber-500/25 bg-amber-500/[0.03]"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold">Rumah {rumah.no_rumah}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {kas ? (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: kas.id, label: `Kas Ibu Rumah ${rumah.no_rumah}` })}
                          className={CHIP_PAID_KAS}
                        >
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                          Kas
                        </button>
                      ) : (
                        <button type="button" onClick={() => openFor(rumah)} className={CHIP_UNPAID}>
                          Kas belum
                        </button>
                      )}
                      {isPeserta ? (
                        arisan ? (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: arisan.id, label: `Arisan Rumah ${rumah.no_rumah}` })}
                            className={CHIP_PAID_ARISAN}
                          >
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                            Arisan
                          </button>
                        ) : (
                          <button type="button" onClick={() => openFor(rumah)} className={CHIP_UNPAID}>
                            Arisan belum
                          </button>
                        )
                      ) : (
                        <span className={CHIP_MUTED}>Non-peserta</span>
                      )}
                    </div>
                    {(kas || arisan) && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10.5px] text-muted-foreground">
                        {kas && <span>Kas {kas.tanggal_bayar ? formatTanggalPendek(kas.tanggal_bayar) : "-"}</span>}
                        {kas && arisan && <span>·</span>}
                        {arisan && <span>Arisan {arisan.tanggal_bayar ? formatTanggalPendek(arisan.tanggal_bayar) : "-"}</span>}
                      </div>
                    )}
                  </div>
                  {lengkap ? (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Lengkap
                    </span>
                  ) : (
                    <button
                      onClick={() => openFor(rumah)}
                      className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground transition-transform active:scale-95"
                    >
                      Catat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {houses.length > 0 && (
            <p className="text-[10.5px] text-muted-foreground">
              Ketuk chip <span className="font-bold text-emerald-600 dark:text-emerald-400">hijau</span> atau{" "}
              <span className="font-bold text-violet-600 dark:text-violet-400">ungu</span> untuk menghapus pembayaran.
            </p>
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
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
              <div>
                <div className="text-[11px] text-muted-foreground">Kas Ibu terkumpul</div>
                <div className="text-[10px] text-muted-foreground">{kasRange?.length ?? 0} pembayaran</div>
              </div>
              <span className="font-mono text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400">{formatRupiah(kasRangeTotal)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-violet-500/10 px-3 py-2">
              <div>
                <div className="text-[11px] text-muted-foreground">Arisan terkumpul</div>
                <div className="text-[10px] text-muted-foreground">{arisanRange?.length ?? 0} pembayaran</div>
              </div>
              <span className="font-mono text-[13px] font-extrabold text-violet-600 dark:text-violet-400">{formatRupiah(arisanRangeTotal)}</span>
            </div>
          </div>
        )}
      </div>

      <BottomDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Catat Ibu & Arisan">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Rumah *</Label>
            <select
              required
              className={SELECT_CLASS}
              value={rumahId}
              onChange={(e) => handleRumahChange(e.target.value)}
            >
              <option value="">Pilih rumah...</option>
              {houses.map((r) => (
                <option key={r.id} value={r.id}>
                  Rumah {r.no_rumah}{r.ikut_arisan ? "" : " (non-peserta arisan)"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`flex items-center gap-2.5 rounded-[11px] border border-border/60 px-3 py-2.5 ${selectedKas ? "opacity-50" : ""}`}>
              <input
                type="checkbox"
                checked={bayarKas}
                disabled={!selected || !!selectedKas}
                onChange={(e) => setBayarKas(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <div className="text-[12.5px] font-bold">Kas Ibu</div>
                <div className="text-[11px] text-muted-foreground">{formatRupiah(RT_CONFIG.nominal_kas_bulanan_ibu)}/bulan</div>
              </div>
              {selectedKas && (
                <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Sudah Lunas</span>
              )}
            </label>

            {selected?.ikut_arisan && (
              <label className={`flex items-center gap-2.5 rounded-[11px] border border-border/60 px-3 py-2.5 ${selectedArisan ? "opacity-50" : ""}`}>
                <input
                  type="checkbox"
                  checked={bayarArisan}
                  disabled={!!selectedArisan}
                  onChange={(e) => setBayarArisan(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div>
                  <div className="text-[12.5px] font-bold">Arisan</div>
                  <div className="text-[11px] text-muted-foreground">{formatRupiah(RT_CONFIG.nominal_arisan)}/bulan</div>
                </div>
                {selectedArisan && (
                  <span className="ml-auto rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">Sudah Lunas</span>
                )}
              </label>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal Bayar *</Label>
            <Input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Metode Bayar</Label>
            <select className={SELECT_CLASS} value={metode} onChange={(e) => setMetode(e.target.value)}>
              <option value="">Pilih metode...</option>
              {METODE_BAYAR.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Keterangan</Label>
            <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="rounded-[11px]" />
          </div>

          <button
            type="submit"
            disabled={createKas.isPending || !bisaSimpan}
            className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {createKas.isPending
              ? "Menyimpan..."
              : bayarKasAktif && bayarArisanAktif
                ? "Simpan 2 pembayaran"
                : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      <BottomDrawer open={bulkOpen} onOpenChange={setBulkOpen} title="Catat sesi penagihan">
        <form onSubmit={handleBulkSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Tanggal *</Label>
              <Input type="date" required value={bulkTanggal} onChange={(e) => setBulkTanggal(e.target.value)} className="rounded-[11px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Metode</Label>
              <select className={SELECT_CLASS} value={bulkMetode} onChange={(e) => setBulkMetode(e.target.value)}>
                <option value="">Pilih metode...</option>
                {METODE_BAYAR.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-[11.5px] text-muted-foreground">
              {bulkRows.length} rumah belum lengkap
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={selectAllBulk}
                className="rounded-lg bg-muted px-2 py-1 text-[10.5px] font-bold text-muted-foreground transition-transform active:scale-95"
              >
                Pilih semua
              </button>
              <button
                type="button"
                onClick={() => setBulkSelected(new Set())}
                className="rounded-lg bg-muted px-2 py-1 text-[10.5px] font-bold text-muted-foreground transition-transform active:scale-95"
              >
                Kosongkan
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {bulkRows.length === 0 && (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                Semua rumah sudah lengkap bulan ini
              </p>
            )}
            {bulkRows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2">
                <span className="text-[12.5px] font-bold">Rumah {r.no_rumah}</span>
                <div className="flex shrink-0 gap-1.5">
                  {!kasMap.has(r.id) && (
                    <BulkToggle
                      tone="kas"
                      active={bulkSelected.has(`${r.id}:Ibu`)}
                      onClick={() => toggleBulk(`${r.id}:Ibu`)}
                    >
                      Kas
                    </BulkToggle>
                  )}
                  {r.ikut_arisan && !arisanMap.has(r.id) && (
                    <BulkToggle
                      tone="arisan"
                      active={bulkSelected.has(`${r.id}:Arisan`)}
                      onClick={() => toggleBulk(`${r.id}:Arisan`)}
                    >
                      Arisan
                    </BulkToggle>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 -mx-4 mt-1 border-t border-border/60 bg-card px-4 pt-3 pb-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11.5px] text-muted-foreground">{bulkSelection.length} pembayaran</span>
              <span className="font-mono text-[14px] font-extrabold text-primary">{formatRupiah(bulkTotal)}</span>
            </div>
            <button
              type="submit"
              disabled={upsertBatch.isPending || bulkSelection.length === 0}
              className="w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {upsertBatch.isPending ? "Menyimpan..." : `Simpan ${bulkSelection.length} pembayaran`}
            </button>
          </div>
        </form>
      </BottomDrawer>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `${deleteTarget.label} akan dihapus permanen.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteKas.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BulkToggle({ active, tone, onClick, children }: {
  active: boolean;
  tone: "kas" | "arisan";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeClass = tone === "kas"
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : "bg-violet-500/15 text-violet-600 dark:text-violet-400";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-transform active:scale-95 ${
        active ? activeClass : "border border-border/60 text-muted-foreground"
      }`}
    >
      {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
      {children}
    </button>
  );
}
