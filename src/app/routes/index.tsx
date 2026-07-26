import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Users,
  Shield,
  Megaphone,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
    <div className="flex flex-col gap-3.5">
      <div className="py-1.5 text-center">
        <h1 className="text-[22px] font-extrabold tracking-[-0.3px]">
          Sistem Informasi RT
        </h1>
        <p className="mt-0.5 text-[13.5px] text-muted-foreground">
          Wonoyoso &middot; Kelola dan pantau lingkungan RT Anda
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

  if (isLoading) return <Skeleton className="h-52 w-full rounded-[20px]" />;

  const totalMasuk =
    (saldo?.kas_bapak_masuk ?? 0) +
    (saldo?.kas_ibu_masuk ?? 0) +
    (saldo?.jimpitan_masuk ?? 0) +
    (saldo?.iuran_insidental_masuk ?? 0);
  const totalKeluar = saldo?.total_pengeluaran ?? 0;
  const saldoAkhir = totalMasuk - totalKeluar;

  const kasItems = [
    { label: "Kas Bapak", value: saldo?.kas_bapak_masuk ?? 0 },
    { label: "Kas Ibu", value: saldo?.kas_ibu_masuk ?? 0 },
    { label: "Jimpitan", value: saldo?.jimpitan_masuk ?? 0 },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[20px] bg-linear-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg shadow-primary/30">
      <div className="mb-3.5 flex items-center gap-2">
        <Wallet className="h-4.75 w-4.75" strokeWidth={2.2} />
        <span className="text-[14px] font-bold opacity-95">Keuangan RT</span>
      </div>
      <div className="text-[12.5px] font-medium opacity-85">Saldo Kas</div>
      <div className="mt-0.5 text-[32px] font-extrabold tracking-[-0.5px]">
        {formatRupiah(saldoAkhir)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-[14px] bg-white/15 px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold opacity-85">
            <ArrowUp className="h-3 w-3" strokeWidth={3} />
            Pemasukan
          </div>
          <div className="mt-0.5 text-[17px] font-extrabold">
            {formatRupiah(totalMasuk)}
          </div>
        </div>
        <div className="rounded-[14px] bg-white/15 px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold opacity-85">
            <ArrowDown className="h-3 w-3" strokeWidth={3} />
            Pengeluaran
          </div>
          <div className="mt-0.5 text-[17px] font-extrabold">
            {formatRupiah(totalKeluar)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-white/20 pt-3.5">
        {kasItems.map((item) => (
          <div
            key={item.label}
            className="flex justify-between text-[13px]"
          >
            <span className="font-medium opacity-85">{item.label}</span>
            <span className="font-bold">{formatRupiah(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-2 rounded-[20px] border border-border/60 bg-card p-4.5 shadow-sm ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  action,
}: {
  icon: typeof Megaphone;
  iconBg: string;
  iconColor: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7.5 w-7.5 items-center justify-center rounded-[9px] ${iconBg}`}
        >
          <Icon className={`h-3.75 w-3.75 ${iconColor}`} strokeWidth={2.2} />
        </div>
        <span className="text-[15px] font-bold">{title}</span>
      </div>
      {action}
    </div>
  );
}

function PengumumanSection() {
  const { data: pengumuman, isLoading } = usePengumumanActive();

  if (isLoading) return <Skeleton className="h-32 w-full rounded-[20px]" />;

  const item = pengumuman?.[0];

  return (
    <SectionCard>
      <SectionHeader
        icon={Megaphone}
        iconBg="bg-blue-100 dark:bg-blue-950/40"
        iconColor="text-blue-600 dark:text-blue-400"
        title="Pengumuman"
      />
      {!item ? (
        <p className="text-[13px] text-muted-foreground">
          Tidak ada pengumuman aktif.
        </p>
      ) : (
        <div className="rounded-[14px] bg-muted/50 p-3.5">
          <div className="flex gap-2">
            {item.is_pinned && <span className="mt-0.5 text-[14px]">📌</span>}
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold">{item.judul}</div>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                {item.isi}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11.5px] font-medium text-muted-foreground">
                  {formatTanggalPendek(item.tanggal_mulai)}
                </span>
                {item.kategori && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {item.kategori}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function RondaSection() {
  const { data: jadwal, isLoading } = useJadwalRondaPublic();
  const hariIni = getHariIni();
  const jadwalHariIni = jadwal?.filter((j) => j.hari === hariIni) ?? [];

  if (isLoading) return <Skeleton className="h-32 w-full rounded-[20px]" />;

  return (
    <SectionCard>
      <SectionHeader
        icon={Shield}
        iconBg="bg-amber-100 dark:bg-amber-950/40"
        iconColor="text-amber-600 dark:text-amber-400"
        title="Ronda Malam Ini"
        action={
          <Link
            to="/jadwal"
            className="flex shrink-0 items-center gap-0.5 text-[12.5px] font-bold text-primary transition-colors hover:text-primary/80"
          >
            Lengkap
            <ChevronRight className="h-2.75 w-2.75" strokeWidth={3} />
          </Link>
        }
      />
      {jadwalHariIni.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Belum ada jadwal ronda untuk hari {hariIni}.
        </p>
      ) : (
        <>
          <div className="mb-2.5 text-[13px] font-semibold text-muted-foreground">
            {hariIni} &middot; {RT_CONFIG.jam_ronda_mulai} –{" "}
            {RT_CONFIG.jam_ronda_selesai}
          </div>
          <div className="flex flex-col gap-2.5">
            {jadwalHariIni.map((j) => (
              <div key={j.id} className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[12.5px] font-extrabold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {j.urutan}
                </div>
                <span className="text-[14px] font-semibold">
                  {j.nama_anggota}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}

function StatistikSection() {
  const { data: stats, isLoading } = useStatistikRT();

  if (isLoading) return <Skeleton className="h-28 w-full rounded-[20px]" />;

  return (
    <SectionCard>
      <SectionHeader
        icon={Users}
        iconBg="bg-violet-100 dark:bg-violet-950/40"
        iconColor="text-violet-600 dark:text-violet-400"
        title="Info Warga"
      />
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[14px] bg-muted/50 px-1.5 py-3.5 text-center">
          <div className="text-[22px] font-extrabold tracking-[-0.5px]">
            {stats?.total_rumah ?? 0}
          </div>
          <div className="mt-0.5 text-[11.5px] font-semibold text-muted-foreground">
            Rumah
          </div>
        </div>
        <div className="rounded-[14px] bg-muted/50 px-1.5 py-3.5 text-center">
          <div className="text-[22px] font-extrabold tracking-[-0.5px] text-violet-600 dark:text-violet-400">
            {stats?.total_laki ?? 0}
          </div>
          <div className="mt-0.5 text-[11.5px] font-semibold text-muted-foreground">
            Laki-laki
          </div>
        </div>
        <div className="rounded-[14px] bg-muted/50 px-1.5 py-3.5 text-center">
          <div className="text-[22px] font-extrabold tracking-[-0.5px] text-pink-600 dark:text-pink-400">
            {stats?.total_perempuan ?? 0}
          </div>
          <div className="mt-0.5 text-[11.5px] font-semibold text-muted-foreground">
            Perempuan
          </div>
        </div>
      </div>
      <div className="mt-3 text-center text-[12.5px] font-semibold text-muted-foreground">
        Total {stats?.total_warga ?? 0} jiwa
      </div>
    </SectionCard>
  );
}
