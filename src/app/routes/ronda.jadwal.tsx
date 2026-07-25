import { Shield } from "lucide-react";
import { useJadwalRondaPublic } from "@/features/public/hooks";
import { Skeleton } from "@/components/ui/skeleton";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const HARI_MAP: Record<number, string> = {
  1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis",
  5: "Jumat", 6: "Sabtu", 0: "Minggu",
};

export default function RondaJadwal() {
  const { data: jadwal, isLoading } = useJadwalRondaPublic();
  const today = HARI_MAP[new Date().getDay()];

  const grouped = HARI.reduce<Record<string, string[]>>((acc, hari) => {
    acc[hari] = jadwal
      ?.filter((j) => j.hari === hari)
      .sort((a, b) => a.urutan - b.urutan)
      .map((j) => j.nama_anggota) ?? [];
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold">Jadwal Ronda</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {HARI.map((hari) => {
            const isToday = hari === today;
            const anggota = grouped[hari];

            return (
              <div
                key={hari}
                className={`rounded-xl border p-3 transition-all ${
                  isToday
                    ? "border-primary/50 bg-primary/10"
                    : "bg-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isToday ? "text-primary" : ""}`}>
                    {hari}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Hari Ini
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {anggota && anggota.length > 0 ? (
                    anggota.map((nama, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium"
                      >
                        {nama}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Belum ada anggota
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
