import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Users, Wallet, Shield, FileText, CreditCard } from "lucide-react";
import { useRumahList } from "@/features/warga/hooks";
import { useSaldoKas } from "@/features/keuangan/hooks";
import { useSuratList } from "@/features/surat/hooks";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";

const STATUS_COLORS: Record<string, string> = {
  Selesai: "bg-primary/15 text-primary",
  Ditolak: "bg-destructive/15 text-destructive",
};

export default function AdminDashboard() {
  const { data: rumahList, isLoading: rumahLoading } = useRumahList();
  const { data: saldo, isLoading: saldoLoading } = useSaldoKas();
  const { data: suratList, isLoading: suratLoading } = useSuratList();

  const totalRumah = rumahList?.length ?? 0;
  const totalWarga =
    rumahList?.reduce(
      (sum, r) => sum + r.warga_detail.filter((w) => w.is_active).length,
      0,
    ) ?? 0;

  const recentSurat = suratList?.slice(0, 5) ?? [];

  const isLoading = rumahLoading || saldoLoading;

  const statCards = [
    {
      title: "Total Rumah",
      value: `${totalRumah} rumah`,
      sub: `${totalWarga} jiwa`,
      icon: Users,
      iconBg: "bg-blue-100 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Saldo Kas Bapak",
      value: formatRupiah(saldo?.kas_bapak_masuk ?? 0),
      icon: Wallet,
      iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      mono: true,
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Saldo Kas Ibu",
      value: formatRupiah(saldo?.kas_ibu_masuk ?? 0),
      icon: CreditCard,
      iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      mono: true,
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Pengeluaran",
      value: formatRupiah(saldo?.total_pengeluaran ?? 0),
      icon: Shield,
      iconBg: "bg-orange-100 dark:bg-orange-950/40",
      iconColor: "text-orange-600 dark:text-orange-400",
      mono: true,
      valueColor: "text-destructive",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Dashboard" description="Ringkasan data RT Wonoyoso" />

      {/* Horizontal scroll stat cards */}
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2.5" style={{ scrollSnapType: "x mandatory" }}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-25 w-40 shrink-0 rounded-2xl"
                />
              ))
            : statCards.map((card) => (
                <div
                  key={card.title}
                  className="w-40 shrink-0 rounded-2xl border border-border/60 bg-card p-3.75"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <div
                    className={`mb-2.5 flex h-7.5 w-7.5 items-center justify-center rounded-[10px] ${card.iconBg}`}
                  >
                    <card.icon
                      className={`h-3.75 w-3.75 ${card.iconColor}`}
                      strokeWidth={2.2}
                    />
                  </div>
                  <div className="text-[12px] font-semibold text-muted-foreground">
                    {card.title}
                  </div>
                  <div
                    className={`mt-0.5 text-[16px] font-extrabold tracking-[-0.5px] ${card.mono ? "font-mono" : ""} ${card.valueColor ?? ""}`}
                  >
                    {card.value}
                  </div>
                  {card.sub && (
                    <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                      {card.sub}
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>

      {/* Surat Terbaru */}
      <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] bg-violet-100 dark:bg-violet-950/40">
            <FileText
              className="h-3.75 w-3.75 text-violet-600 dark:text-violet-400"
              strokeWidth={2.2}
            />
          </div>
          <span className="text-[14.5px] font-bold">Surat Terbaru</span>
        </div>

        {suratLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : recentSurat.length === 0 ? (
          <p className="py-3 text-center text-[13px] text-muted-foreground">
            Belum ada surat yang diajukan.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentSurat.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 text-[13px]"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-bold">
                    {s.warga_detail?.nama_lengkap}
                  </span>
                  <span className="ml-1.5 text-muted-foreground">
                    — {s.jenis_surat}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    {formatTanggalPendek(s.tanggal_diajukan)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${STATUS_COLORS[s.status] ?? "border border-border/60 text-muted-foreground"}`}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ringkasan Keuangan */}
      <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] bg-emerald-100 dark:bg-emerald-950/40">
            <Wallet
              className="h-3.75 w-3.75 text-emerald-600 dark:text-emerald-400"
              strokeWidth={2.2}
            />
          </div>
          <span className="text-[14.5px] font-bold">Ringkasan Keuangan</span>
        </div>

        {saldoLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 text-[13px]">
            {[
              {
                label: "Kas Bapak Masuk",
                value: saldo?.kas_bapak_masuk ?? 0,
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Kas Ibu Masuk",
                value: saldo?.kas_ibu_masuk ?? 0,
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Jimpitan Masuk",
                value: saldo?.jimpitan_masuk ?? 0,
                color: "text-emerald-600 dark:text-emerald-400",
              },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={`font-mono font-bold ${item.color}`}>
                  {formatRupiah(item.value)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border/60 pt-2.5">
              <span className="text-muted-foreground">Total Pengeluaran</span>
              <span className="font-mono font-bold text-destructive">
                {formatRupiah(saldo?.total_pengeluaran ?? 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
