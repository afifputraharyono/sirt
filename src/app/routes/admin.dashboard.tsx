import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Users, Wallet, Shield, FileText } from "lucide-react";
import { useRumahList } from "@/features/warga/hooks";
import { useSaldoKas } from "@/features/keuangan/hooks";
import { useSuratList } from "@/features/surat/hooks";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";

export default function AdminDashboard() {
  const { data: rumahList, isLoading: rumahLoading } = useRumahList();
  const { data: saldo, isLoading: saldoLoading } = useSaldoKas();
  const { data: suratList, isLoading: suratLoading } = useSuratList();

  const totalRumah = rumahList?.length ?? 0;
  const totalWarga = rumahList?.reduce(
    (sum, r) => sum + r.warga_detail.filter((w) => w.is_active).length,
    0
  ) ?? 0;

  const recentSurat = suratList?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Ringkasan data RT Wonoyoso" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Rumah"
          value={rumahLoading ? null : `${totalRumah} rumah`}
          subtitle={`${totalWarga} jiwa`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Saldo Kas Bapak"
          value={saldoLoading ? null : formatRupiah(saldo?.kas_bapak_masuk ?? 0)}
          icon={<Wallet className="h-4 w-4 text-emerald-600" />}
          mono
        />
        <StatCard
          title="Saldo Kas Ibu"
          value={saldoLoading ? null : formatRupiah(saldo?.kas_ibu_masuk ?? 0)}
          icon={<Wallet className="h-4 w-4 text-emerald-600" />}
          mono
        />
        <StatCard
          title="Total Pengeluaran"
          value={saldoLoading ? null : formatRupiah(saldo?.total_pengeluaran ?? 0)}
          icon={<Shield className="h-4 w-4 text-amber-600" />}
          mono
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Surat Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suratLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : recentSurat.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada surat yang diajukan.</p>
            ) : (
              <div className="space-y-3">
                {recentSurat.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{s.warga_detail?.nama_lengkap}</span>
                      <span className="text-muted-foreground ml-2">— {s.jenis_surat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatTanggalPendek(s.tanggal_diajukan)}</span>
                      <Badge variant={s.status === "Selesai" ? "default" : s.status === "Ditolak" ? "destructive" : "outline"} className="text-xs">
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              Ringkasan Keuangan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {saldoLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kas Bapak Masuk</span>
                  <span className="font-mono font-medium text-emerald-600">{formatRupiah(saldo?.kas_bapak_masuk ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kas Ibu Masuk</span>
                  <span className="font-mono font-medium text-emerald-600">{formatRupiah(saldo?.kas_ibu_masuk ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jimpitan Masuk</span>
                  <span className="font-mono font-medium text-emerald-600">{formatRupiah(saldo?.jimpitan_masuk ?? 0)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-muted-foreground">Total Pengeluaran</span>
                  <span className="font-mono font-medium text-destructive">{formatRupiah(saldo?.total_pengeluaran ?? 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title, value, subtitle, icon, mono,
}: {
  title: string;
  value: string | null;
  subtitle?: string;
  icon: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${mono ? "font-mono" : ""}`}>{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
