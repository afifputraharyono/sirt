import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";
import { useJadwalRondaPublic } from "@/features/public/hooks";
import { RT_CONFIG } from "@/shared/lib/constants";

const HARI_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const HARI_MAP: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  0: "Minggu",
};

export default function JadwalPublik() {
  const { data: jadwal, isLoading } = useJadwalRondaPublic();
  const hariIni = HARI_MAP[new Date().getDay()];
  const namaPeriode = jadwal?.[0]?.nama_periode;

  const jadwalByHari = HARI_LABELS.map((hari) => ({
    hari,
    anggota: jadwal?.filter((j) => j.hari === hari) ?? [],
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-600" />
          Jadwal Ronda
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {namaPeriode
            ? `Periode: ${namaPeriode}`
            : "Jadwal ronda warga RT"
          }
          {" · "}
          {RT_CONFIG.jam_ronda_mulai} – {RT_CONFIG.jam_ronda_selesai}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : jadwal?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Belum ada jadwal ronda untuk periode aktif.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jadwalByHari.map(({ hari, anggota }) => (
            <Card
              key={hari}
              className={
                hari === hariIni
                  ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                  : ""
              }
            >
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  {hari}
                  {hari === hariIni && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      Hari Ini
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                {anggota.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada jadwal</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {anggota.map((j) => (
                      <span
                        key={j.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-sm border"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[9px] font-medium text-amber-700 dark:bg-amber-900/30">
                          {j.urutan}
                        </span>
                        {j.nama_anggota}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
