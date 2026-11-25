import { useState } from "react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer } from "lucide-react";
import {
  useKasByMonth,
  usePengeluaran,
  useSaldoKas,
} from "@/features/keuangan/hooks";
import { ArisanPutaranTab } from "@/features/keuangan/components/ArisanPutaranTab";
import { IbuArisanTab } from "@/features/keuangan/components/IbuArisanTab";
import { KasTab } from "@/features/keuangan/components/KasTab";
import { JimpitanTab } from "@/features/keuangan/components/JimpitanTab";
import { PengeluaranTab } from "@/features/keuangan/components/PengeluaranTab";
import { BULAN_NAMES } from "@/shared/lib/labels";
import type { TipeKas, SumberDana } from "@/shared/types/database";
import { formatRupiah } from "@/shared/utils/format";
import { cetakLaporanKeuangan } from "@/shared/utils/print";
import { RT_CONFIG } from "@/shared/lib/constants";

type PageMode = "bapak" | "ibu";

interface ModeConfig {
  title: string;
  description: string;
  kasTipe: TipeKas;
  kasNominal: number;
  kasLabel: string;
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
    sumberDana: ["Kas Bapak", "Jimpitan"],
    saldoCards: (saldo) => [
      { title: "Kas Bapak", value: saldo?.saldo_kas_bapak ?? 0 },
      { title: "Jimpitan", value: saldo?.saldo_jimpitan ?? 0 },
    ],
  },
  ibu: {
    title: "Kas Ibu & Arisan",
    description: "Kelola kas ibu, arisan, dan pengeluaran",
    kasTipe: "Ibu",
    kasNominal: RT_CONFIG.nominal_kas_bulanan_ibu,
    kasLabel: "Kas Ibu",
    sumberDana: ["Kas Ibu", "Arisan"],
    saldoCards: (saldo) => [
      { title: "Kas Ibu", value: saldo?.saldo_kas_ibu ?? 0 },
      { title: "Arisan belum disalurkan", value: saldo?.arisan_belum_disalurkan ?? 0 },
    ],
  },
};

const now = new Date();

export default function AdminKeuangan() {
  const location = useLocation();
  const mode: PageMode = location.pathname.includes("/ibu") ? "ibu" : "bapak";
  const config = MODE_CONFIGS[mode];

  const tabs = mode === "ibu"
    ? [
        { key: "kas", label: "Ibu & Arisan" },
        { key: "putaran", label: "Putaran" },
        { key: "pengeluaran", label: "Pengeluaran" },
      ]
    : [
        { key: "kas", label: config.kasLabel },
        { key: "jimpitan", label: "Jimpitan" },
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
        sumber_dana: p.sumber_dana,
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
      {tab === "kas" && (mode === "ibu"
        ? <IbuArisanTab bulan={bulan} tahun={tahun} />
        : <KasTab tipe={config.kasTipe} bulan={bulan} tahun={tahun} nominal={config.kasNominal} />)}
      {tab === "jimpitan" && mode === "bapak" && <JimpitanTab bulan={bulan} tahun={tahun} />}
      {tab === "putaran" && mode === "ibu" && (
        <ArisanPutaranTab bulan={bulan} tahun={tahun} />
      )}
      {tab === "pengeluaran" && (
        <PengeluaranTab bulan={bulan} tahun={tahun} sumberFilter={config.sumberDana} />
      )}
    </div>
  );
}
