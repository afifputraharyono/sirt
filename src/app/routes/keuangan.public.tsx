import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Search,
  ArrowUp,
  ArrowDown,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Home,
  RotateCw,
  Info,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useSaldoKas, usePengeluaran } from "@/features/keuangan/hooks";
import { useTagihanRumah } from "@/features/public/hooks";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { RT_CONFIG } from "@/shared/lib/constants";

const BULAN_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

type TabKey = "transparansi" | "tagihan";

function labelRincian(tipe: "Bapak" | "Ibu" | "Arisan") {
  if (tipe === "Bapak") return "Kas Bapak";
  if (tipe === "Ibu") return "Kas Ibu";
  return "Arisan";
}

function labelPill(tipe: "Bapak" | "Ibu" | "Arisan") {
  if (tipe === "Bapak") return "Bapak";
  if (tipe === "Ibu") return "Ibu";
  return "Arisan";
}

export default function KeuanganPublik() {
  const [tab, setTab] = useState<TabKey>("transparansi");
  const [noRumahInput, setNoRumahInput] = useState("");
  const [noRumahCek, setNoRumahCek] = useState("");
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[9px] bg-emerald-100 dark:bg-emerald-950/40">
          <Wallet
            className="h-3.75 w-3.75 text-emerald-600 dark:text-emerald-400"
            strokeWidth={2.2}
          />
        </div>
        <div>
          <h1 className="text-[17px] font-extrabold tracking-[-0.2px]">
            Keuangan RT
          </h1>
          <p className="text-[12px] font-medium text-muted-foreground">
            Transparansi kas &amp; cek tagihan warga
          </p>
        </div>
      </div>

      <div className="flex rounded-[14px] bg-muted p-1">
        <button
          type="button"
          onClick={() => setTab("transparansi")}
          className={`flex-1 rounded-[10px] px-3 py-2 text-[12px] font-bold ${
            tab === "transparansi"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Laporan
        </button>
        <button
          type="button"
          onClick={() => setTab("tagihan")}
          className={`flex-1 rounded-[10px] px-3 py-2 text-[12px] font-bold ${
            tab === "tagihan"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Cek Tagihan
        </button>
      </div>

      {tab === "transparansi" ? (
        <TransparansiTab
          bulan={bulan}
          tahun={tahun}
          setBulan={setBulan}
          setTahun={setTahun}
        />
      ) : (
        <TagihanTab
          noRumahInput={noRumahInput}
          setNoRumahInput={setNoRumahInput}
          noRumahCek={noRumahCek}
          setNoRumahCek={setNoRumahCek}
        />
      )}
    </div>
  );
}

function TransparansiTab({
  bulan,
  tahun,
  setBulan,
  setTahun,
}: {
  bulan: number;
  tahun: number;
  setBulan: (n: number) => void;
  setTahun: (n: number) => void;
}) {
  const { data: saldo, isLoading: saldoLoading } = useSaldoKas();
  const { data: pengeluaran, isLoading: keluarLoading } = usePengeluaran(
    bulan,
    tahun,
  );

  const totalMasuk =
    (saldo?.kas_bapak_masuk ?? 0) +
    (saldo?.kas_ibu_masuk ?? 0) +
    (saldo?.arisan_masuk ?? 0) +
    (saldo?.jimpitan_masuk ?? 0) +
    (saldo?.iuran_insidental_masuk ?? 0);
  const totalKeluar = saldo?.total_pengeluaran ?? 0;
  const saldoAkhir = totalMasuk - totalKeluar;

  const sumberDana = [
    {
      label: "Kas Bapak",
      value:
        (saldo?.kas_bapak_masuk ?? 0) - (saldo?.pengeluaran_kas_bapak ?? 0),
    },
    {
      label: "Kas Ibu",
      value: (saldo?.kas_ibu_masuk ?? 0) - (saldo?.pengeluaran_kas_ibu ?? 0),
    },
    {
      label: "Arisan",
      value: (saldo?.arisan_masuk ?? 0) - (saldo?.pengeluaran_arisan ?? 0),
    },
    {
      label: "Jimpitan",
      value: (saldo?.jimpitan_masuk ?? 0) - (saldo?.pengeluaran_jimpitan ?? 0),
    },
  ];

  const totalPengeluaranBulan =
    pengeluaran?.reduce((s, p) => s + p.nominal, 0) ?? 0;

  return (
    <div className="flex flex-col gap-3">
      {saldoLoading ? (
        <Skeleton className="h-52 w-full rounded-[20px]" />
      ) : (
        <div className="rounded-[20px] bg-linear-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg shadow-primary/30">
          <p className="text-[12.5px] font-medium opacity-85">Saldo Kas</p>
          <p className="mt-1 text-[32px] font-extrabold tracking-[-0.5px]">
            {formatRupiah(saldoAkhir)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium opacity-85">
                <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                Pemasukan
              </p>
              <p className="mt-0.5 font-mono text-[13.5px] font-extrabold">
                {formatRupiah(totalMasuk)}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium opacity-85">
                <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
                Pengeluaran
              </p>
              <p className="mt-0.5 font-mono text-[13.5px] font-extrabold">
                {formatRupiah(totalKeluar)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {sumberDana.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[14px] border border-border/60 bg-card p-3"
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {label}
            </p>
            <p
              className={`mt-0.5 font-mono text-[15px] font-extrabold ${
                value >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }`}
            >
              {formatRupiah(value)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className="rounded-[11px] border border-border/60 bg-card px-3 py-2 text-[13px] font-bold"
        >
          {BULAN_NAMES.slice(1).map((b, i) => (
            <option key={i + 1} value={i + 1}>
              {b}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={2020}
          max={2030}
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="w-20 rounded-[11px] border border-border/60 bg-card px-3 py-2 text-center text-[13px] font-bold"
        />
      </div>

      <div className="rounded-[18px] border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={2.2}
            />
            <span className="text-[15px] font-bold">Pengeluaran</span>
          </div>
          <span className="font-mono text-[13px] font-extrabold text-destructive">
            {formatRupiah(totalPengeluaranBulan)}
          </span>
        </div>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          {BULAN_NAMES[bulan] ?? ""} {tahun}
        </p>

        {keluarLoading ? (
          <Skeleton className="mt-3 h-32 w-full rounded-xl" />
        ) : !pengeluaran || pengeluaran.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            Belum ada pengeluaran bulan ini.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {pengeluaran.slice(0, 20).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-[12.5px] font-bold">
                    {p.keterangan || p.kategori}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {p.kategori} · {formatTanggalPendek(p.tanggal)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[12.5px] font-bold text-destructive">
                  {formatRupiah(p.nominal)}
                </span>
              </div>
            ))}
            {pengeluaran.length > 20 && (
              <p className="text-center text-[11.5px] text-muted-foreground">
                +{pengeluaran.length - 20} transaksi lainnya
              </p>
            )}
          </div>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Data diperbarui otomatis dari catatan pengurus RT.
      </p>
    </div>
  );
}

function TagihanTab({
  noRumahInput,
  setNoRumahInput,
  noRumahCek,
  setNoRumahCek,
}: {
  noRumahInput: string;
  setNoRumahInput: (v: string) => void;
  noRumahCek: string;
  setNoRumahCek: (v: string) => void;
}) {
  const { data, isLoading, isFetching, isError, refetch } =
    useTagihanRumah(noRumahCek);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setNoRumahCek(noRumahInput.trim());
        }}
        className="flex gap-2"
      >
        <Input
          value={noRumahInput}
          onChange={(e) => setNoRumahInput(e.target.value)}
          placeholder="Contoh: A01"
          autoComplete="off"
          className="flex-1 rounded-[11px]"
        />
        <button
          type="submit"
          disabled={noRumahInput.trim().length === 0}
          className="flex items-center gap-1.5 rounded-[11px] bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96] disabled:opacity-50"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={2.5} /> Cek
        </button>
      </form>

      {noRumahCek === "" ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border/60 py-10 text-center">
          <Home className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            Masukkan nomor rumah untuk melihat tagihan kas.
          </p>
        </div>
      ) : isLoading || (isFetching && !data) ? (
        <Skeleton className="h-44 w-full rounded-[20px]" />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-destructive/40 bg-destructive/5 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            Gagal memuat data tagihan.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-[11px] bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
          >
            <RotateCw className="h-3.5 w-3.5" strokeWidth={2.5} /> Coba lagi
          </button>
        </div>
      ) : !data ? null : data.found === false ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border/60 py-10 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            Nomor rumah {noRumahCek} tidak ditemukan
          </p>
          <p className="text-[11.5px] text-muted-foreground">
            Periksa kembali nomor rumah atau hubungi pengurus RT.
          </p>
        </div>
      ) : !data.wajibBayar ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border/60 py-10 text-center">
          <Home className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            Rumah {data.noRumah} tercatat kosong
          </p>
          <p className="text-[11.5px] text-muted-foreground">
            Tidak ada tagihan kas bulanan untuk rumah ini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-[20px] bg-linear-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg shadow-primary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium opacity-85">
                  Total Tunggakan
                </p>
                {data.totalNominalKurang === 0 ? (
                  <p className="mt-1 text-[24px] font-extrabold">Lunas semua</p>
                ) : (
                  <p className="mt-1 text-[30px] font-extrabold tracking-[-0.5px]">
                    {formatRupiah(data.totalNominalKurang)}
                  </p>
                )}
              </div>
              {data.totalNominalKurang === 0 ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-50">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                  Lunas
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-50">
                  Ada Tunggakan
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[11.5px] opacity-85">
              Rumah {data.noRumah} · {data.tahun} · s/d{" "}
              {BULAN_NAMES[data.bulanSekarang] ?? ""}
            </p>
            <div className="mt-3 rounded-[14px] bg-white/15 px-3.5 py-3">
              <p className="text-[17px] font-extrabold">
                {data.totalKurang} bulan tertunggak
              </p>
              <p className="text-[11.5px] opacity-85">
                dari total {data.rincian.reduce((s, r) => s + r.bulanWajib, 0)}{" "}
                kewajiban bulan
              </p>
            </div>
          </div>

          <div className="rounded-[18px] border border-border/60 bg-card p-4">
            <p className="text-[15px] font-bold">Rincian Tagihan</p>
            <div className="mt-3 flex flex-col gap-2">
              {data.rincian.map((r) => (
                <div
                  key={r.tipe}
                  className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[13px] font-bold">
                      {labelRincian(r.tipe)}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {formatRupiah(r.nominal)}/bulan · {r.jumlahLunas}/
                      {r.bulanWajib} lunas
                    </p>
                  </div>
                  {r.jumlahKurang === 0 ? (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Lunas
                    </span>
                  ) : (
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[12.5px] font-extrabold text-amber-600 dark:text-amber-400">
                        {formatRupiah(r.nominalKurang)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.jumlahKurang} bulan
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-border/60 bg-card p-4">
            <button
              type="button"
              onClick={() => setShowDetail((v) => !v)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-[15px] font-bold">Riwayat Bulanan</span>
              {showDetail ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showDetail && (
              <div className="mt-3 flex flex-col gap-2.5">
                {[...data.detailPerBulan].reverse().map((b) => (
                  <div
                    key={b.bulan}
                    className="flex items-start justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2.5"
                  >
                    <p className="text-[12.5px] font-bold">
                      {BULAN_NAMES[b.bulan] ?? ""}
                    </p>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {b.items.map((item) => (
                        <span
                          key={`${b.bulan}-${item.tipe}`}
                          className={
                            item.lunas
                              ? "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary"
                              : "rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400"
                          }
                        >
                          {labelPill(item.tipe)}{" "}
                          {item.lunas ? "Lunas" : "Belum"}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Data ini berasal dari catatan pembayaran pengurus RT. Jika
              terdapat selisih, silakan hubungi pengurus.
            </p>
            <p className="text-[10.5px] text-muted-foreground">
              {RT_CONFIG.nama_rt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
