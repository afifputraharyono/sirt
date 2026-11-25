import { ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/shared/utils/format";

export function RingkasanPeriode({
  show, onToggle, dari, onDariChange, sampai, onSampaiChange,
  kasCount, kasTotal, arisanCount, arisanTotal,
}: {
  show: boolean;
  onToggle: () => void;
  dari: string;
  onDariChange: (value: string) => void;
  sampai: string;
  onSampaiChange: (value: string) => void;
  kasCount: number;
  kasTotal: number;
  arisanCount: number;
  arisanTotal: number;
}) {
  return (
    <div className="mt-4 border-t border-border/40 pt-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[12.5px] font-bold">Ringkasan Periode</span>
        {show
          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        }
      </button>
      {show && (
        <div className="mt-2 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Input type="date" value={dari} onChange={(e) => onDariChange(e.target.value)} className="flex-1 rounded-[11px] text-[12px]" />
            <span className="text-[11px] text-muted-foreground">s/d</span>
            <Input type="date" value={sampai} onChange={(e) => onSampaiChange(e.target.value)} className="flex-1 rounded-[11px] text-[12px]" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
            <div>
              <div className="text-[11px] text-muted-foreground">Kas Ibu terkumpul</div>
              <div className="text-[10px] text-muted-foreground">{kasCount} pembayaran</div>
            </div>
            <span className="font-mono text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400">{formatRupiah(kasTotal)}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-violet-500/10 px-3 py-2">
            <div>
              <div className="text-[11px] text-muted-foreground">Arisan terkumpul</div>
              <div className="text-[10px] text-muted-foreground">{arisanCount} pembayaran</div>
            </div>
            <span className="font-mono text-[13px] font-extrabold text-violet-600 dark:text-violet-400">{formatRupiah(arisanTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
