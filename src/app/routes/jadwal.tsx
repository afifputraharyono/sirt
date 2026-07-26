import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Calendar } from "lucide-react";
import { useJadwalRondaPublic } from "@/features/public/hooks";
import { RT_CONFIG } from "@/shared/lib/constants";

const HARI_LABELS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

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
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[9px] bg-amber-100 dark:bg-amber-950/40">
          <Shield className="h-3.75 w-3.75 text-amber-600 dark:text-amber-400" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-[17px] font-extrabold tracking-[-0.2px]">
            Jadwal Ronda
          </h1>
          <p className="text-[12px] font-medium text-muted-foreground">
            {namaPeriode ? `${namaPeriode} · ` : ""}
            {RT_CONFIG.jam_ronda_mulai} – {RT_CONFIG.jam_ronda_selesai}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : jadwal?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border/60 py-10 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            Belum ada jadwal ronda untuk periode aktif.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {jadwalByHari.map(({ hari, anggota }, idx) => {
            const isToday = hari === hariIni;
            return (
              <div
                key={hari}
                className={`animate-in fade-in slide-in-from-bottom-1 rounded-2xl border p-3.5 transition-all ${
                  isToday
                    ? "border-amber-400/70 bg-amber-50/60 shadow-sm shadow-amber-200/30 dark:border-amber-500/30 dark:bg-amber-950/20 dark:shadow-amber-900/10"
                    : "border-border/60 bg-card"
                }`}
                style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "backwards" }}
              >
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-[14px] font-bold">{hari}</span>
                  {isToday && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      Hari Ini
                    </span>
                  )}
                </div>

                {anggota.length === 0 ? (
                  <p className="text-[12.5px] text-muted-foreground">
                    Belum ada jadwal
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {anggota.map((j) => (
                      <span
                        key={j.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-[13px] font-semibold transition-transform active:scale-95"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-extrabold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {j.urutan}
                        </span>
                        {j.nama_anggota}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
