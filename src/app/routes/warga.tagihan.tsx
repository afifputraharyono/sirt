import {
  AlertCircle,
  CheckCircle2,
  Info,
  Receipt,
  RotateCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useKonteksWarga, useKasSaya } from "@/features/warga/hooks";
import { AkunBelumTertaut } from "@/features/warga/components/AkunBelumTertaut";
import { useTagihanRumah } from "@/features/public/hooks";
import type { TipeTagihan } from "@/features/public/services";
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

function labelTipe(tipe: TipeTagihan) {
  if (tipe === "Bapak") return "Kas Bapak";
  if (tipe === "Ibu") return "Kas Ibu";
  return "Arisan";
}

export default function WargaTagihan() {
  const tahun = new Date().getFullYear();
  const {
    data: ctx,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useKonteksWarga();
  const { data: tagihan, isLoading: tagihanLoading } = useTagihanRumah(
    ctx?.rumah?.no_rumah ?? ""
  );
  const { data: kas, isLoading: kasLoading } = useKasSaya(
    ctx?.rumah?.id,
    tahun
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3.5">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-44 w-full rounded-[20px]" />
        <Skeleton className="h-32 w-full rounded-[18px]" />
      </div>
    );
  }

  if (isError || !ctx) {
    return (
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
    );
  }

  if (!ctx.rumah) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Tagihan Saya"
          description="Kas Ibu, Arisan, dan riwayat pembayaran"
        />
        <AkunBelumTertaut onRefresh={() => refetch()} refreshing={isFetching} />
      </div>
    );
  }

  const pembayaran = (kas ?? [])
    .filter((k) => k.status_bayar)
    .sort((a, b) => b.bulan - a.bulan);

  return (
    <div className="flex flex-col gap-3.5">
      <PageHeader
        title="Tagihan Saya"
        description={`Rumah ${ctx.rumah.no_rumah} · Tahun ${tahun}`}
      />

      {tagihanLoading ? (
        <Skeleton className="h-44 w-full rounded-[20px]" />
      ) : !tagihan || tagihan.found === false ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border/60 py-10 text-center">
          <AlertCircle className="h-9 w-9 text-muted-foreground/50" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            Data rumah belum lengkap.
          </p>
        </div>
      ) : (
        <>
          {tagihan.statusHunian === "Kosong" && (
            <div className="flex items-start gap-2 rounded-[14px] border border-border/60 bg-muted/40 px-3 py-2.5">
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                strokeWidth={2.2}
              />
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                Rumah {ctx.rumah.no_rumah} sedang kosong. Tagihan di bawah adalah
                sisa tunggakan dari masa hunian sebelumnya; tidak ada tagihan
                baru sampai rumah dihuni lagi.
              </p>
            </div>
          )}
          <div className="rounded-[20px] bg-linear-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg shadow-primary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium opacity-85">
                  Total Belum Dibayar
                </p>
                {tagihan.totalNominalKurang === 0 ? (
                  <p className="mt-1 text-[24px] font-extrabold">Lunas semua</p>
                ) : (
                  <p className="mt-1 text-[30px] font-extrabold tracking-[-0.5px]">
                    {formatRupiah(tagihan.totalNominalKurang)}
                  </p>
                )}
              </div>
              {tagihan.totalNominalKurang === 0 ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-50">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                  Lunas
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-50">
                  {tagihan.totalKurang} tagihan
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[11.5px] opacity-85">
              s/d {BULAN_NAMES[tagihan.bulanSekarang] ?? ""} {tagihan.tahun}
              {tagihan.adaTunggakanTahunLalu
                ? " · termasuk tunggakan tahun sebelumnya"
                : ""}
            </p>
          </div>

          {tagihan.wajibBayar && tagihan.rincian.length > 0 && (
            <div className="rounded-[18px] border border-border/60 bg-card p-4">
              <p className="text-[15px] font-bold">
                Rincian Tagihan {tagihan.tahun}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {tagihan.rincian.map((r) => (
                  <div
                    key={r.tipe}
                    className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[13px] font-bold">{labelTipe(r.tipe)}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {formatRupiah(r.nominal)}/bulan · {r.jumlahLunas} dari{" "}
                        {r.bulanWajib} bulan lunas
                      </p>
                    </div>
                    {r.jumlahKurang === 0 ? (
                      <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Lunas
                      </span>
                    ) : (
                      <span className="shrink-0 font-mono text-[12.5px] font-extrabold text-amber-600 dark:text-amber-400">
                        {formatRupiah(r.nominalKurang)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[18px] border border-border/60 bg-card p-4">
            <p className="text-[15px] font-bold">Riwayat Bulanan</p>
            <div className="mt-3 flex flex-col gap-2.5">
              {[...tagihan.detailPerBulan].reverse().map((b) => (
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
                        {item.tipe === "Bapak"
                          ? "Bapak"
                          : item.tipe === "Ibu"
                            ? "Ibu"
                            : "Arisan"}{" "}
                        {item.lunas ? "Lunas" : "Belum"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2">
              <Receipt
                className="h-4 w-4 text-muted-foreground"
                strokeWidth={2.2}
              />
              <p className="text-[15px] font-bold">Pembayaran Tercatat</p>
            </div>
            {kasLoading ? (
              <Skeleton className="mt-3 h-24 w-full rounded-xl" />
            ) : pembayaran.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                Belum ada pembayaran tercatat tahun ini.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {pembayaran.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[12.5px] font-bold">
                        {labelTipe(k.tipe_kas)} · {BULAN_NAMES[k.bulan]}{" "}
                        {k.tahun}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {k.tanggal_bayar
                          ? formatTanggalPendek(k.tanggal_bayar)
                          : "Tanggal tidak tercatat"}
                        {k.metode_bayar ? ` · ${k.metode_bayar}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[12.5px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(k.jumlah)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Data berasal dari catatan pembayaran pengurus RT. Jika ada selisih,
          silakan hubungi pengurus.
        </p>
        <p className="text-[10.5px] text-muted-foreground">{RT_CONFIG.nama_rt}</p>
      </div>
    </div>
  );
}
