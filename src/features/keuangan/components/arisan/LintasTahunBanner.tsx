import type { ArisanRekap } from "@/shared/types/database";
import { formatRupiah } from "@/shared/utils/format";

export function LintasTahunBanner({
  lintasTahun, total, onBuka,
}: {
  lintasTahun: ArisanRekap[];
  total: number;
  onBuka?: () => void;
}) {
  if (lintasTahun.length === 0) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-[12.5px] font-bold text-amber-700 dark:text-amber-300">
          {formatRupiah(total)} pot tahun lalu belum disalurkan
        </div>
        <div className="text-[11px] text-muted-foreground">
          {lintasTahun.length} periode ·{" "}
          {[...new Set(lintasTahun.map((r) => r.tahun))].join(", ")}
        </div>
      </div>
      {onBuka && (
        <button
          onClick={onBuka}
          className="shrink-0 rounded-[10px] bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-amber-950 transition-transform active:scale-95"
        >
          Buka
        </button>
      )}
    </div>
  );
}
