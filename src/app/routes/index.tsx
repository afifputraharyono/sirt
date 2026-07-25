import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Users, Shield, Megaphone, Pin, ChevronRight, Home } from "lucide-react";
import { useSaldoKas } from "@/features/keuangan/hooks";
import { usePengumumanActive } from "@/features/pengumuman/hooks";
import { useJadwalRondaPublic, useStatistikRT } from "@/features/public/hooks";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { RT_CONFIG } from "@/shared/lib/constants";

const HARI_MAP: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  0: "Minggu",
};

function getHariIni() {
  return HARI_MAP[new Date().getDay()];
}

export default function BerandaPublik() {
  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <h1 className="text-xl font-bold text-primary">SIRT Wonoyoso</h1>
        <p className="text-sm text-muted-foreground">
          Sistem Informasi {RT_CONFIG.nama_rt} {RT_CONFIG.nama_desa}
        </p>
      </div>

      <SaldoSection />
      <PengumumanSection />
      <RondaSection />
      <StatistikSection />
    </div>
  );
}

function SaldoSection() {
  const { data: saldo, isLoading } = useSaldoKas();

  if (isLoading) return <Skeleton className="h-36 w-full rounded-lg" />;

  const totalMasuk =
    (saldo?.kas_bapak_masuk ?? 0) +
    (saldo?.kas_ibu_masuk ?? 0) +
    (saldo?.jimpitan_masuk ?? 0) +
    (saldo?.iuran_insidental_masuk ?? 0);
  const totalKeluar = saldo?.total_pengeluaran ?? 0;
  const saldoAkhir = totalMasuk - totalKeluar;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Wallet className="h-5 w-5 text-emerald-600" />
        <CardTitle className="text-base">Keuangan RT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Saldo Kas</span>
          <span className="text-lg font-bold text-emerald-700">
            {formatRupiah(saldoAkhir)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-emerald-50 p-2 dark:bg-emerald-950/30">
            <p className="text-xs text-muted-foreground">Pemasukan</p>
            <p className="font-semibold text-emerald-700">{formatRupiah(totalMasuk)}</p>
          </div>
          <div className="rounded-md bg-red-50 p-2 dark:bg-red-950/30">
            <p className="text-xs text-muted-foreground">Pengeluaran</p>
            <p className="font-semibold text-red-600">{formatRupiah(totalKeluar)}</p>
          </div>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Kas Bapak</span>
            <span>{formatRupiah(saldo?.kas_bapak_masuk ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kas Ibu</span>
            <span>{formatRupiah(saldo?.kas_ibu_masuk ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Jimpitan</span>
            <span>{formatRupiah(saldo?.jimpitan_masuk ?? 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PengumumanSection() {
  const { data: pengumuman, isLoading } = usePengumumanActive();

  if (isLoading) return <Skeleton className="h-28 w-full rounded-lg" />;

  const items = pengumuman?.slice(0, 3) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-cyan-600" />
          <CardTitle className="text-base">Pengumuman</CardTitle>
        </div>
        {(pengumuman?.length ?? 0) > 3 && (
          <Link
            to="/pengumuman"
            className="flex items-center text-xs text-primary hover:underline"
          >
            Semua <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tidak ada pengumuman aktif saat ini.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="flex items-start gap-2">
                  {p.is_pinned && (
                    <Pin className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{p.judul}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {p.isi}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {formatTanggalPendek(p.tanggal_mulai)}
                      {p.kategori && (
                        <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                          {p.kategori}
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RondaSection() {
  const { data: jadwal, isLoading } = useJadwalRondaPublic();
  const hariIni = getHariIni();
  const jadwalHariIni = jadwal?.filter((j) => j.hari === hariIni) ?? [];

  if (isLoading) return <Skeleton className="h-28 w-full rounded-lg" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-base">Ronda Malam Ini</CardTitle>
        </div>
        <Link
          to="/jadwal"
          className="flex items-center text-xs text-primary hover:underline"
        >
          Jadwal Lengkap <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {jadwalHariIni.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada jadwal ronda untuk hari {hariIni}.
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground mb-2">
              {hariIni} &middot; {RT_CONFIG.jam_ronda_mulai} – {RT_CONFIG.jam_ronda_selesai}
            </p>
            {jadwalHariIni.map((j) => (
              <div key={j.id} className="flex items-center gap-2 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30">
                  {j.urutan}
                </span>
                <span>{j.nama_anggota}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatistikSection() {
  const { data: stats, isLoading } = useStatistikRT();

  if (isLoading) return <Skeleton className="h-20 w-full rounded-lg" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Users className="h-5 w-5 text-blue-600" />
        <CardTitle className="text-base">Info Warga</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <Home className="h-3.5 w-3.5" />
            </div>
            <p className="text-xl font-bold">{stats?.total_rumah ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Rumah</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blue-600">{stats?.total_laki ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Laki-laki</p>
          </div>
          <div>
            <p className="text-xl font-bold text-pink-600">{stats?.total_perempuan ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Perempuan</p>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Total {stats?.total_warga ?? 0} jiwa
        </p>
      </CardContent>
    </Card>
  );
}
