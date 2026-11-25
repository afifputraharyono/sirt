import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RotateCw,
  User,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useKonteksWarga } from "@/features/warga/hooks";
import { AkunBelumTertaut } from "@/features/warga/components/AkunBelumTertaut";
import { useTagihanRumah } from "@/features/public/hooks";
import { formatRupiah } from "@/shared/utils/format";
import { labelTipeKas } from "@/shared/lib/labels";

export default function WargaDashboard() {
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3.5">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-[20px]" />
        <Skeleton className="h-28 w-full rounded-[18px]" />
      </div>
    );
  }

  if (isError || !ctx) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[20px] border border-destructive/40 bg-destructive/5 py-10 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-[13.5px] font-medium text-muted-foreground">
          Gagal memuat data akun.
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

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <p className="text-[12px] font-medium text-muted-foreground">
          Selamat datang
        </p>
        <h1 className="text-[21px] font-extrabold tracking-[-0.3px]">
          Halo, {ctx.profil.nama_tampilan}
        </h1>
        {ctx.rumah && (
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Rumah {ctx.rumah.no_rumah}
            {ctx.anggota ? ` · ${ctx.anggota.nama_lengkap}` : ""}
            {ctx.rumah.ikut_arisan ? " · Peserta Arisan" : ""}
          </p>
        )}
      </div>

      {!ctx.rumah ? (
        <AkunBelumTertaut onRefresh={() => refetch()} refreshing={isFetching} />
      ) : tagihanLoading ? (
        <Skeleton className="h-48 w-full rounded-[20px]" />
      ) : !tagihan || tagihan.found === false ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border/60 py-10 text-center">
          <AlertCircle className="h-9 w-9 text-muted-foreground/50" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            Data rumah {ctx.rumah.no_rumah} belum lengkap.
          </p>
        </div>
      ) : (
        <>
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
              Tahun {tagihan.tahun}
              {tagihan.adaTunggakanTahunLalu
                ? " · termasuk tunggakan tahun sebelumnya"
                : ""}
            </p>
          </div>

          {tagihan.wajibBayar && tagihan.rincian.length > 0 && (
            <div className="rounded-[18px] border border-border/60 bg-card p-4">
              <p className="text-[15px] font-bold">Rincian Tagihan</p>
              <div className="mt-3 flex flex-col gap-2">
                {tagihan.rincian.map((r) => (
                  <div
                    key={r.tipe}
                    className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[13px] font-bold">{labelTipeKas(r.tipe)}</p>
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
        </>
      )}

      <div className="grid grid-cols-1 gap-2.5">
        <Link
          to="/warga/tagihan"
          className="flex items-center gap-3 rounded-[16px] border border-border/60 bg-card px-4 py-3.5 transition-colors active:bg-muted/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-100 dark:bg-emerald-950/40">
            <Wallet
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              strokeWidth={2.2}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold">Tagihan Saya</p>
            <p className="text-[11.5px] text-muted-foreground">
              Riwayat bulanan Kas Ibu &amp; Arisan
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          to="/warga/profil"
          className="flex items-center gap-3 rounded-[16px] border border-border/60 bg-card px-4 py-3.5 transition-colors active:bg-muted/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-100 dark:bg-blue-950/40">
            <User
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
              strokeWidth={2.2}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold">Profil Saya</p>
            <p className="text-[11.5px] text-muted-foreground">
              Nama tampilan dan nomor HP
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
