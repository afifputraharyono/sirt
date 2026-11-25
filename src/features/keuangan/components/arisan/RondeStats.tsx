import { formatRupiah } from "@/shared/utils/format";

export function RondeStats({
  totalTerkumpul, totalTersalur,
}: {
  totalTerkumpul: number;
  totalTersalur: number;
}) {
  return (
    <div className="-mx-4 mt-3 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2.5">
        <div className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
          <div className="text-[11.5px] font-semibold text-muted-foreground">Pot terkumpul</div>
          <div className="mt-0.5 font-mono text-[15px] font-extrabold">
            {formatRupiah(totalTerkumpul)}
          </div>
        </div>
        <div className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
          <div className="text-[11.5px] font-semibold text-muted-foreground">Sudah disalurkan</div>
          <div className="mt-0.5 font-mono text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totalTersalur)}
          </div>
        </div>
        <div className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
          <div className="text-[11.5px] font-semibold text-muted-foreground">Sisa pot</div>
          <div
            className={`mt-0.5 font-mono text-[15px] font-extrabold ${
              totalTerkumpul - totalTersalur > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }`}
          >
            {formatRupiah(totalTerkumpul - totalTersalur)}
          </div>
        </div>
      </div>
    </div>
  );
}
