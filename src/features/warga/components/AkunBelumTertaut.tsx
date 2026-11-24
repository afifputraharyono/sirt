import { Unlink, RotateCw } from "lucide-react";

interface AkunBelumTertautProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function AkunBelumTertaut({
  onRefresh,
  refreshing,
}: AkunBelumTertautProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border/60 px-5 py-10 text-center">
      <Unlink className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.8} />
      <div>
        <p className="text-[14px] font-bold">Akun belum tertaut ke rumah</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          Hubungi pengurus RT untuk menautkan akun ini ke data rumah Anda.
          Setelah tertaut, tagihan dan informasi rumah akan tampil di sini.
        </p>
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="mt-1 flex items-center gap-1.5 rounded-[11px] bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96] disabled:opacity-60"
        >
          <RotateCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            strokeWidth={2.5}
          />
          Muat ulang
        </button>
      )}
    </div>
  );
}
