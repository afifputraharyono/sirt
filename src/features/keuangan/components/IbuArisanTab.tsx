import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks, Plus } from "lucide-react";
import {
  useKasByMonth, useCreateKas, useDeleteKas, useKasByRange, useUpsertKasBatch,
} from "@/features/keuangan/hooks";
import { useRumahList, usePeriodeHunian } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { RumahKK } from "@/shared/types/database";
import type { PeriodeHunian } from "@/features/warga/services";
import { terhuniPada } from "@/shared/lib/hunian";
import { formatRupiah } from "@/shared/utils/format";
import { RT_CONFIG } from "@/shared/lib/constants";
import { BULAN_NAMES } from "@/shared/lib/labels";
import { IbuStatCards } from "@/features/keuangan/components/ibu/IbuStatCards";
import { IbuRumahRow } from "@/features/keuangan/components/ibu/IbuRumahRow";
import { CatatPembayaranDrawer } from "@/features/keuangan/components/ibu/CatatPembayaranDrawer";
import { PenagihanMassalDrawer } from "@/features/keuangan/components/ibu/PenagihanMassalDrawer";
import { RingkasanPeriode } from "@/features/keuangan/components/ibu/RingkasanPeriode";
import { HapusPembayaranDialog } from "@/features/keuangan/components/ibu/HapusPembayaranDialog";
import { toISODate, todayISO } from "@/shared/lib/date";

export function IbuArisanTab({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: kasList, isLoading: kasLoading } = useKasByMonth("Ibu", bulan, tahun);
  const { data: arisanList } = useKasByMonth("Arisan", bulan, tahun);
  const { data: rumahList, isLoading: rumahLoading } = useRumahList();
  const { data: periodeList, isLoading: periodeLoading } = usePeriodeHunian();
  const createKas = useCreateKas();
  const deleteKas = useDeleteKas();
  const upsertBatch = useUpsertKasBatch();
  const user = useAuthStore((s) => s.user);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rumahId, setRumahId] = useState("");
  const [bayarKas, setBayarKas] = useState(true);
  const [bayarArisan, setBayarArisan] = useState(false);
  const [tanggal, setTanggal] = useState(todayISO);
  const [metode, setMetode] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTanggal, setBulkTanggal] = useState(todayISO);
  const [bulkMetode, setBulkMetode] = useState("");
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  const [showRange, setShowRange] = useState(false);
  const [dari, setDari] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toISODate(d);
  });
  const [sampai, setSampai] = useState(todayISO);
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

  const periodeByRumah = useMemo(() => {
    const map = new Map<string, PeriodeHunian[]>();
    for (const p of periodeList ?? []) {
      const list = map.get(p.rumah_id);
      if (list) list.push(p);
      else map.set(p.rumah_id, [p]);
    }
    return map;
  }, [periodeList]);

  // Rumah kosong tidak ditagih; hanya tampil untuk bulan saat masih dihuni.
  const houses = useMemo(
    () => (rumahList ?? [])
      .filter((r) => {
        if (!r.is_active) return false;
        const periode = periodeByRumah.get(r.id);
        if (!periode || periode.length === 0) return r.status_hunian !== "Kosong";
        return terhuniPada(periode, tahun, bulan);
      })
      .sort((a, b) => a.no_rumah.localeCompare(b.no_rumah, undefined, { numeric: true })),
    [rumahList, periodeByRumah, tahun, bulan],
  );
  const peserta = houses.filter((r) => r.ikut_arisan);

  const kasPaid = houses.filter((r) => kasMap.has(r.id)).length;
  const arisanPaid = peserta.filter((r) => arisanMap.has(r.id)).length;
  const isLoading = kasLoading || rumahLoading || periodeLoading;
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
    setTanggal(todayISO());
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
      tanggal_bayar: tanggal || todayISO(),
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

  const bulkItems = useMemo(
    () => bulkRows.map((r) => ({
      rumah: r,
      perluKas: !kasMap.has(r.id),
      perluArisan: r.ikut_arisan && !arisanMap.has(r.id),
    })),
    [bulkRows, kasMap, arisanMap],
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
    setBulkTanggal(todayISO());
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
      tanggal_bayar: bulkTanggal || todayISO(),
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
      <IbuStatCards
        kasPaid={kasPaid}
        kasTotal={houses.length}
        arisanPaid={arisanPaid}
        arisanTotal={peserta.length}
        totalTerkumpul={totalTerkumpul}
      />

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
            <p className="py-6 text-center text-[13px] text-muted-foreground">Tidak ada rumah yang dihuni bulan ini</p>
          )}
          {houses.map((rumah) => (
            <IbuRumahRow
              key={rumah.id}
              rumah={rumah}
              kas={kasMap.get(rumah.id)}
              arisan={arisanMap.get(rumah.id)}
              onCatat={() => openFor(rumah)}
              onHapus={setDeleteTarget}
            />
          ))}
          {houses.length > 0 && (
            <p className="text-[10.5px] text-muted-foreground">
              Ketuk chip <span className="font-bold text-emerald-600 dark:text-emerald-400">hijau</span> atau{" "}
              <span className="font-bold text-violet-600 dark:text-violet-400">ungu</span> untuk menghapus pembayaran.
            </p>
          )}
        </div>
      )}

      <RingkasanPeriode
        show={showRange}
        onToggle={() => setShowRange(!showRange)}
        dari={dari}
        onDariChange={setDari}
        sampai={sampai}
        onSampaiChange={setSampai}
        kasCount={kasRange?.length ?? 0}
        kasTotal={kasRangeTotal}
        arisanCount={arisanRange?.length ?? 0}
        arisanTotal={arisanRangeTotal}
      />

      <CatatPembayaranDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        houses={houses}
        rumahId={rumahId}
        onRumahChange={handleRumahChange}
        bayarKas={bayarKas}
        onBayarKasChange={setBayarKas}
        bayarArisan={bayarArisan}
        onBayarArisanChange={setBayarArisan}
        selected={selected}
        selectedKas={selectedKas}
        selectedArisan={selectedArisan}
        tanggal={tanggal}
        onTanggalChange={setTanggal}
        metode={metode}
        onMetodeChange={setMetode}
        keterangan={keterangan}
        onKeteranganChange={setKeterangan}
        bisaSimpan={bisaSimpan}
        pending={createKas.isPending}
        onSubmit={handleSubmit}
      />

      <PenagihanMassalDrawer
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        items={bulkItems}
        selected={bulkSelected}
        onToggle={toggleBulk}
        onPilihSemua={selectAllBulk}
        onKosongkan={() => setBulkSelected(new Set())}
        tanggal={bulkTanggal}
        onTanggalChange={setBulkTanggal}
        metode={bulkMetode}
        onMetodeChange={setBulkMetode}
        jumlahTerpilih={bulkSelection.length}
        total={bulkTotal}
        pending={upsertBatch.isPending}
        onSubmit={handleBulkSubmit}
      />

      <HapusPembayaranDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteKas.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }
      />
    </div>
  );
}
