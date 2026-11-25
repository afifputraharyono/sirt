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
} from "lucide-react";
import { useSaldoKas, usePengeluaran } from "@/features/keuangan/hooks";
import { useTagihanRumah } from "@/features/public/hooks";
import type { TipeTagihan } from "@/features/tagihan/tagihan";
import { ArisanFlowCard } from "@/features/public/components/ArisanFlowCard";
import { TagihanPerTahun } from "@/features/public/components/TagihanPerTahun";
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

  // Arisan adalah dana bergulir; view sudah memisahkannya dari saldo utama.
  const totalMasuk = saldo?.total_masuk ?? 0;
  const totalKeluar = saldo?.total_pengeluaran_utama ?? 0;
  const saldoAkhir = saldo?.saldo_utama ?? 0;

  const sumberDana = [
    { label: "Kas Bapak", value: saldo?.saldo_kas_bapak ?? 0 },
    { label: "Kas Ibu", value: saldo?.saldo_kas_ibu ?? 0 },
    { label: "Jimpitan", value: saldo?.saldo_jimpitan ?? 0 },
  ];

  const pengeluaranKas = (pengeluaran ?? []).filter(
    (p) => p.sumber_dana !== "Arisan",
  );

  const totalPengeluaranBulan =
    pengeluaranKas.reduce((s, p) => s + p.nominal, 0) ?? 0;

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

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Saldo tidak termasuk arisan — dana bergulir, langsung disalurkan ke
        pemenang.
      </p>

      <ArisanFlowCard bulan={bulan} tahun={tahun} />

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
        ) : pengeluaranKas.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            Belum ada pengeluaran bulan ini.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {pengeluaranKas.slice(0, 20).map((p) => (
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
            {pengeluaranKas.length > 20 && (
              <p className="text-center text-[11.5px] text-muted-foreground">
                +{pengeluaranKas.length - 20} transaksi lainnya
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

  const belumPerTahun = (data?.tahunList ?? [])
    .map((t) => {
      const map = new Map<TipeTagihan, number[]>();
      t.detailPerBulan.forEach((b) => {
        b.items
          .filter((i) => !i.lunas)
          .forEach((i) => {
            const list = map.get(i.tipe) ?? [];
            list.push(b.bulan);
            map.set(i.tipe, list);
          });
      });
      return { tahun: t.tahun, perTipe: map };
    })
    .filter((t) => t.perTipe.size > 0);

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
      ) : data.statusHunian === "Kosong" && !data.wajibBayar ? (
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
          {data.statusHunian === "Kosong" && (
            <div className="flex items-start gap-2 rounded-[14px] border border-border/60 bg-muted/40 px-3 py-2.5">
              <Home
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                strokeWidth={2.2}
              />
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                Rumah {data.noRumah} sedang kosong. Tagihan di bawah adalah sisa
                tunggakan dari masa hunian sebelumnya; tidak ada tagihan baru
                sampai rumah dihuni lagi.
              </p>
            </div>
          )}
          <div className="rounded-[20px] bg-linear-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg shadow-primary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium opacity-85">
                  Total Belum Dibayar
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
                  Belum Lunas
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[11.5px] opacity-85">
              Rumah {data.noRumah} · s/d{" "}
              {BULAN_NAMES[data.bulanSekarang] ?? ""} {data.tahun}
              {data.adaTunggakanTahunLalu
                ? " · termasuk tunggakan tahun sebelumnya"
                : ""}
            </p>
            <div className="mt-3 rounded-[14px] bg-white/15 px-3.5 py-3">
              <p className="text-[17px] font-extrabold">
                {data.totalKurang} tagihan belum dibayar
              </p>
              <div className="mt-1 flex flex-col gap-1 text-[11.5px] opacity-90">
                {belumPerTahun.map(({ tahun, perTipe }) => (
                  <div key={tahun} className="flex flex-col gap-0.5">
                    {belumPerTahun.length > 1 && (
                      <p className="font-bold">{tahun}</p>
                    )}
                    {[...perTipe.entries()].map(([tipe, bulans]) => (
                      <p key={tipe}>
                        {labelRincian(tipe)}:{" "}
                        <span className="font-semibold">
                          {bulans
                            .map((b) => BULAN_NAMES[b]?.slice(0, 3))
                            .join(", ")}
                        </span>
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {data.wajibBayar && data.tahunList.length > 0 && (
            <TagihanPerTahun
              tahunList={data.tahunList}
              tahunSekarang={data.tahun}
            />
          )}

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
