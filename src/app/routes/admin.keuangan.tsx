import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Printer, Lock, LockOpen, Home, CalendarDays, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import {
  useKasByMonth, useCreateKas, useDeleteKas,
  useJimpitanSummary, useCreateJimpitan, useDeleteJimpitan,
  useLockJimpitan, useUnlockJimpitan,
  usePengeluaran, useCreatePengeluaran, useDeletePengeluaran,
  useGrupPengeluaran, useCreateGrupPengeluaran, useDeleteGrupPengeluaran,
  useKasByRange, useJimpitanByRange, usePengeluaranByRange,
  useSaldoKas,
} from "@/features/keuangan/hooks";
import { useRumahList } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { TipeKas, KategoriPengeluaran, StatusJimpitan, SumberDana } from "@/shared/types/database";
import type { JimpitanWithRumah, PengeluaranWithGrup } from "@/features/keuangan/services";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { cetakLaporanKeuangan } from "@/shared/utils/print";
import { RT_CONFIG } from "@/shared/lib/constants";

const BULAN_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const KATEGORI_PENGELUARAN: KategoriPengeluaran[] = ["Operasional", "Keamanan", "Kebersihan", "Sosial", "Pembangunan", "Kegiatan", "Lainnya"];
const SELECT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";

const METODE_BAYAR = ["Cash", "Transfer"] as const;

type PageMode = "bapak" | "ibu";

interface ModeConfig {
  title: string;
  description: string;
  kasTipe: TipeKas;
  kasNominal: number;
  kasLabel: string;
  secondTabKey: string;
  secondTabLabel: string;
  sumberDana: SumberDana[];
  saldoCards: (saldo: ReturnType<typeof useSaldoKas>["data"]) => { title: string; value: number }[];
}

const MODE_CONFIGS: Record<PageMode, ModeConfig> = {
  bapak: {
    title: "Kas Bapak & Jimpitan",
    description: "Kelola kas bapak, jimpitan, dan pengeluaran",
    kasTipe: "Bapak",
    kasNominal: RT_CONFIG.nominal_kas_bulanan_bapak,
    kasLabel: "Kas Bapak",
    secondTabKey: "jimpitan",
    secondTabLabel: "Jimpitan",
    sumberDana: ["Kas Bapak", "Jimpitan"],
    saldoCards: (saldo) => [
      { title: "Kas Bapak", value: (saldo?.kas_bapak_masuk ?? 0) - (saldo?.pengeluaran_kas_bapak ?? 0) },
      { title: "Jimpitan", value: (saldo?.jimpitan_masuk ?? 0) - (saldo?.pengeluaran_jimpitan ?? 0) },
    ],
  },
  ibu: {
    title: "Kas Ibu & Arisan",
    description: "Kelola kas ibu, arisan, dan pengeluaran",
    kasTipe: "Ibu",
    kasNominal: RT_CONFIG.nominal_kas_bulanan_ibu,
    kasLabel: "Kas Ibu",
    secondTabKey: "arisan",
    secondTabLabel: "Arisan",
    sumberDana: ["Kas Ibu", "Arisan"],
    saldoCards: (saldo) => [
      { title: "Kas Ibu", value: (saldo?.kas_ibu_masuk ?? 0) - (saldo?.pengeluaran_kas_ibu ?? 0) },
      { title: "Arisan", value: (saldo?.arisan_masuk ?? 0) - (saldo?.pengeluaran_arisan ?? 0) },
    ],
  },
};

const now = new Date();

export default function AdminKeuangan() {
  const location = useLocation();
  const mode: PageMode = location.pathname.includes("/ibu") ? "ibu" : "bapak";
  const config = MODE_CONFIGS[mode];

  const tabs = [
    { key: "kas", label: config.kasLabel },
    { key: config.secondTabKey, label: config.secondTabLabel },
    { key: "pengeluaran", label: "Pengeluaran" },
  ];

  const [tab, setTab] = useState<string>("kas");
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const { data: saldo, isLoading: saldoLoading } = useSaldoKas();
  const { data: kasBapak } = useKasByMonth("Bapak", bulan, tahun);
  const { data: kasIbu } = useKasByMonth("Ibu", bulan, tahun);
  const { data: pengeluaranList } = usePengeluaran(bulan, tahun);

  const handleCetakLaporan = () => {
    if (!saldo) return;
    cetakLaporanKeuangan({
      bulan,
      tahun,
      kasBapak: (kasBapak ?? []).map((k) => ({
        noRumah: k.rumah_kk?.no_rumah ?? "-",
        jumlah: k.jumlah,
        status: k.status_bayar,
      })),
      kasIbu: (kasIbu ?? []).map((k) => ({
        noRumah: k.rumah_kk?.no_rumah ?? "-",
        jumlah: k.jumlah,
        status: k.status_bayar,
      })),
      pengeluaran: (pengeluaranList ?? []).map((p) => ({
        tanggal: p.tanggal,
        kategori: p.kategori,
        keterangan: p.keterangan ?? "",
        nominal: p.nominal,
      })),
      saldo,
    });
  };

  const saldoCards = config.saldoCards(saldo);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <button
            onClick={handleCetakLaporan}
            disabled={!saldo}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-[13px] font-bold transition-transform active:scale-[0.96] disabled:opacity-50"
          >
            <Printer className="h-4 w-4" strokeWidth={2.2} />
            Cetak
          </button>
        }
      />

      {/* Saldo cards */}
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2.5">
          {saldoCards.map((c) => (
            <div key={c.title} className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
              <div className="text-[11.5px] font-semibold text-muted-foreground">{c.title}</div>
              <div className={`mt-0.5 font-mono text-[15px] font-extrabold ${c.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {saldoLoading ? <Skeleton className="h-5 w-20" /> : formatRupiah(c.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month / Year selector */}
      <div className="flex gap-2">
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className="flex-1 rounded-[11px] border border-border/60 bg-card px-3 py-2 text-[13px] font-bold"
        >
          {BULAN_NAMES.slice(1).map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
        </select>
        <input
          type="number"
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="w-20 rounded-[11px] border border-border/60 bg-card px-3 py-2 text-center text-[13px] font-bold"
          min={2020}
          max={2030}
        />
      </div>

      {/* Pill tabs */}
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-1 rounded-[14px] bg-muted p-1" style={{ minWidth: "max-content" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-[10px] px-3 py-2 text-[12px] font-bold transition-all ${
                tab === t.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "kas" && (
        <KasTab tipe={config.kasTipe} bulan={bulan} tahun={tahun} nominal={config.kasNominal} withArisan={mode === "ibu"} />
      )}
      {tab === "jimpitan" && <JimpitanTab bulan={bulan} tahun={tahun} />}
      {tab === "arisan" && (
        <KasTab tipe="Arisan" bulan={bulan} tahun={tahun} nominal={RT_CONFIG.nominal_arisan} optional />
      )}
      {tab === "pengeluaran" && (
        <PengeluaranTab bulan={bulan} tahun={tahun} sumberFilter={config.sumberDana} />
      )}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-border/60 bg-card p-4">
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </button>
  );
}

function KasTab({ tipe, bulan, tahun, nominal, optional, withArisan }: { tipe: TipeKas; bulan: number; tahun: number; nominal: number; optional?: boolean; withArisan?: boolean }) {
  const { data: kasList, isLoading } = useKasByMonth(tipe, bulan, tahun);
  const { data: arisanList } = useKasByMonth("Arisan", bulan, tahun);
  const { data: rumahList } = useRumahList();
  const createKas = useCreateKas();
  const deleteKas = useDeleteKas();
  const user = useAuthStore((s) => s.user);

  const [drawer, setDrawer] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedRumahId, setSelectedRumahId] = useState("");
  const [showRange, setShowRange] = useState(false);
  const [dari, setDari] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0]!;
  });
  const [sampai, setSampai] = useState(() => new Date().toISOString().split("T")[0]!);
  const { data: kasRange } = useKasByRange(tipe, dari, sampai);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rumahId = fd.get("rumah_id") as string;
    const tanggalBayar = fd.get("tanggal_bayar") as string;
    const metodeBayar = (fd.get("metode_bayar") as string) || null;
    const keterangan = (fd.get("keterangan") as string) || null;
    const bayarArisan = withArisan && fd.get("bayar_arisan") === "on";

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
    }, {
      onSuccess: () => {
        if (bayarArisan) {
          createKas.mutate({
            rumah_id: rumahId,
            tipe_kas: "Arisan",
            bulan,
            tahun,
            jumlah: RT_CONFIG.nominal_arisan,
            status_bayar: true,
            tanggal_bayar: tanggalBayar,
            metode_bayar: metodeBayar,
            keterangan,
            dicatat_oleh: user?.id ?? "",
          }, { onSuccess: () => { setDrawer(false); setSelectedRumahId(""); } });
        } else {
          setDrawer(false);
          setSelectedRumahId("");
        }
      },
    });
  };

  const activeRumah = rumahList?.filter((r) => r.is_active && r.status_hunian !== "Kosong") ?? [];
  const paidRumahIds = new Set(kasList?.map((k) => k.rumah_id));
  const paidArisanIds = new Set(arisanList?.map((k) => k.rumah_id));
  const unpaidRumah = activeRumah.filter((r) => !paidRumahIds.has(r.id));

  const sortedKasList = useMemo(() => {
    if (!kasList) return [];
    return [...kasList].sort((a, b) =>
      (a.rumah_kk?.no_rumah ?? "").localeCompare(b.rumah_kk?.no_rumah ?? "", undefined, { numeric: true })
    );
  }, [kasList]);

  const paidCount = kasList?.length ?? 0;
  const totalCount = optional ? paidCount : activeRumah.length;
  const totalTerkumpul = kasList?.reduce((s, k) => s + k.jumlah, 0) ?? 0;
  const totalExpected = optional ? totalTerkumpul : totalCount * nominal;
  const totalKekurangan = totalExpected - totalTerkumpul;

  const rangeTotal = kasRange?.reduce((s, k) => s + k.jumlah, 0) ?? 0;

  const tipeLabel = tipe === "Arisan" ? "Arisan" : `Kas ${tipe}`;

  return (
    <SectionCard>
      {/* Summary bar */}
      <div className={`mb-3 grid gap-2 text-center ${optional ? "grid-cols-2" : "grid-cols-3"}`}>
        <div className="rounded-xl bg-emerald-500/10 p-2">
          <div className="font-mono text-[14px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {optional ? paidCount : `${paidCount}/${totalCount}`}
          </div>
          <div className="text-[10px] text-muted-foreground">{optional ? "Rumah Bayar" : "Lunas"}</div>
        </div>
        <div className="rounded-xl bg-primary/10 p-2">
          <div className="font-mono text-[14px] font-extrabold text-primary">{formatRupiah(totalTerkumpul)}</div>
          <div className="text-[10px] text-muted-foreground">Terkumpul</div>
        </div>
        {!optional && (
          <div className="rounded-xl bg-amber-500/10 p-2">
            <div className="font-mono text-[14px] font-extrabold text-amber-600 dark:text-amber-400">{formatRupiah(totalKekurangan)}</div>
            <div className="text-[10px] text-muted-foreground">Kekurangan</div>
          </div>
        )}
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
          {!optional && unpaidRumah.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
              <div>
                <div className="text-[13px] font-bold text-amber-700 dark:text-amber-300">Rumah {r.no_rumah}</div>
                <div className="mt-0.5 font-mono text-[11px] text-amber-600 dark:text-amber-400">{formatRupiah(nominal)}</div>
              </div>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">Belum Bayar</span>
            </div>
          ))}
          {sortedKasList.length === 0 && (optional || unpaidRumah.length === 0) && (
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
            <select name="rumah_id" required className={SELECT_CLASS} value={selectedRumahId} onChange={(e) => setSelectedRumahId(e.target.value)}>
              <option value="">Pilih rumah...</option>
              {(optional ? activeRumah.filter((r) => !paidRumahIds.has(r.id)) : unpaidRumah).map((r) => (
                <option key={r.id} value={r.id}>Rumah {r.no_rumah}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal Bayar *</Label>
            <Input name="tanggal_bayar" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Metode Bayar</Label>
            <select name="metode_bayar" className={SELECT_CLASS}>
              <option value="">Pilih metode...</option>
              {METODE_BAYAR.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {withArisan && (
            <label className={`flex items-center gap-2.5 rounded-[11px] border border-border/60 px-3 py-2.5 ${
              selectedRumahId && paidArisanIds.has(selectedRumahId) ? "opacity-50" : ""
            }`}>
              <input
                type="checkbox"
                name="bayar_arisan"
                defaultChecked
                disabled={!selectedRumahId || paidArisanIds.has(selectedRumahId)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <div className="text-[12.5px] font-bold">Sekalian bayar Arisan</div>
                <div className="text-[11px] text-muted-foreground">{formatRupiah(RT_CONFIG.nominal_arisan)}/bulan</div>
              </div>
              {selectedRumahId && paidArisanIds.has(selectedRumahId) && (
                <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Sudah Lunas</span>
              )}
            </label>
          )}
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

const JIMPITAN_VIEWS = [
  { key: "tanggal", label: "Per Tanggal", icon: CalendarDays },
  { key: "rumah", label: "Per Rumah", icon: Home },
] as const;

function JimpitanTab({ bulan, tahun }: { bulan: number; tahun: number }) {
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

function PengeluaranTab({ bulan, tahun, sumberFilter }: { bulan: number; tahun: number; sumberFilter: SumberDana[] }) {
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
    return d.toISOString().split("T")[0]!;
  });
  const [sampai, setSampai] = useState(() => new Date().toISOString().split("T")[0]!);
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

  const SUMBER_BADGE: Record<string, string> = {
    "Kas Bapak": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    "Kas Ibu": "bg-pink-500/15 text-pink-600 dark:text-pink-400",
    "Jimpitan": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    "Arisan": "bg-violet-500/15 text-violet-600 dark:text-violet-400",
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
                          sumberBadge={SUMBER_BADGE}
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
              sumberBadge={SUMBER_BADGE}
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
              <Input name="tanggal" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="rounded-[11px]" />
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
            <Input name="tanggal" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="rounded-[11px]" />
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

function PengeluaranRow({ item, sumberBadge, onDelete }: { item: PengeluaranWithGrup; sumberBadge: Record<string, string>; onDelete: () => void }) {
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
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${sumberBadge[item.sumber_dana] ?? ""}`}>
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
