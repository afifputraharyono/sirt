import { BULAN_NAMES } from "@/features/keuangan/constants";
import { formatRupiah } from "@/shared/utils/format";

export function PotBulanIniBanner({
  bulan, pot, onCatat,
}: {
  bulan: number;
  pot: number;
  onCatat: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-[12.5px] font-bold text-amber-700 dark:text-amber-300">
          Pot {BULAN_NAMES[bulan] ?? ""} {formatRupiah(pot)} belum diundi
        </div>
        <div className="text-[11px] text-muted-foreground">Tetapkan pemenang bulan ini.</div>
      </div>
      <button
        onClick={onCatat}
        className="shrink-0 rounded-[10px] bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-amber-950 transition-transform active:scale-95"
      >
        Catat
      </button>
    </div>
  );
}
