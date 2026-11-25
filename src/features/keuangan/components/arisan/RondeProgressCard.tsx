import { Lock } from "lucide-react";
import type { ArisanRonde } from "@/shared/types/database";
import { formatTanggalPendek } from "@/shared/utils/format";

export function RondeProgressCard({
  ronde, menangCount, jumlahAnggota, progress, bisaDitutup, alasanTutup, onTutup,
}: {
  ronde: ArisanRonde;
  menangCount: number;
  jumlahAnggota: number;
  progress: number;
  bisaDitutup: boolean;
  alasanTutup: string | null;
  onTutup: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-border/60 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-bold">
            Ronde {ronde.nomor}
            {!ronde.tanggal_selesai && (
              <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                berjalan
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Mulai {formatTanggalPendek(ronde.tanggal_mulai)}
            {ronde.tanggal_selesai
              ? ` · ditutup ${formatTanggalPendek(ronde.tanggal_selesai)}`
              : ""}
          </div>
        </div>
        {!ronde.tanggal_selesai && (
          <button
            onClick={onTutup}
            disabled={!bisaDitutup}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/60 px-2.5 py-2 text-[11.5px] font-bold transition-transform active:scale-[0.96] disabled:opacity-40"
          >
            <Lock className="h-3.5 w-3.5" strokeWidth={2.4} /> Tutup ronde
          </button>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11.5px]">
        <span className="text-muted-foreground">Anggota sudah menang</span>
        <span className="font-bold">
          {menangCount}/{jumlahAnggota}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground">
        {ronde.tanggal_selesai
          ? "Ronde selesai; riwayat putaran tidak bisa diubah."
          : (alasanTutup ??
            "Semua anggota sudah menang dan pot tersalurkan. Ronde siap ditutup.")}
      </div>
    </div>
  );
}
