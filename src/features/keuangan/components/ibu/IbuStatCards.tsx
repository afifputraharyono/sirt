import { formatRupiah } from "@/shared/utils/format";

export function IbuStatCards({
  kasPaid, kasTotal, arisanPaid, arisanTotal, totalTerkumpul,
}: {
  kasPaid: number;
  kasTotal: number;
  arisanPaid: number;
  arisanTotal: number;
  totalTerkumpul: number;
}) {
  return (
    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-xl bg-emerald-500/10 p-2">
        <div className="font-mono text-[14px] font-extrabold text-emerald-600 dark:text-emerald-400">
          {kasPaid}/{kasTotal}
        </div>
        <div className="text-[10px] text-muted-foreground">Kas Ibu</div>
      </div>
      <div className="rounded-xl bg-violet-500/10 p-2">
        <div className="font-mono text-[14px] font-extrabold text-violet-600 dark:text-violet-400">
          {arisanPaid}/{arisanTotal}
        </div>
        <div className="text-[10px] text-muted-foreground">Arisan</div>
      </div>
      <div className="rounded-xl bg-primary/10 p-2">
        <div className="font-mono text-[12px] font-extrabold leading-tight text-primary">{formatRupiah(totalTerkumpul)}</div>
        <div className="text-[10px] text-muted-foreground">Terkumpul</div>
      </div>
    </div>
  );
}
