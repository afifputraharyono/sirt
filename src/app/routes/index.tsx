import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Users, Shield, Megaphone } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function BerandaPublik() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SIRT Wonoyoso"
        description="Sistem Informasi RT 005 RW 003 Wonoyoso"
      />

      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Ringkasan Keuangan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Data keuangan akan ditampilkan di sini.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Megaphone className="h-5 w-5 text-cyan-600" />
            <CardTitle className="text-base">Pengumuman</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Belum ada pengumuman aktif.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Jadwal Ronda Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Jadwal ronda akan ditampilkan di sini.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Info Warga</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Statistik warga akan ditampilkan di sini.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
