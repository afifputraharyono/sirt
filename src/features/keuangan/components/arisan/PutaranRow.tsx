import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import type { ArisanRekap } from "@/shared/types/database";
import { STATUS_BADGE, labelPeriode, statusOf, type PeriodeRonde } from "@/features/keuangan/arisan";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";

export function PutaranRow({
  periode, row, bisaDiubah, onEdit, onCatat, onSalurkan, onHapus,
}: {
  periode: PeriodeRonde;
  row: ArisanRekap;
  bisaDiubah: boolean;
  onEdit: () => void;
  onCatat: () => void;
  onSalurkan: () => void;
  onHapus: () => void;
}) {
  const kind = statusOf(row);
  const badge = STATUS_BADGE[kind];
  const sisa = row.nominal_terkumpul - (row.nominal_putaran ?? 0);
  const pemenangNama = row.pemenang_no_rumah ? `Rumah ${row.pemenang_no_rumah}` : "Belum diundi";

  return (
    <div className="rounded-xl border border-border/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold">
          {labelPeriode(periode.tahun, periode.bulan)}
        </span>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
        >
          <badge.Icon className="h-3 w-3" strokeWidth={2.5} />
          {badge.label}
        </span>
      </div>
      <div className="mt-1 text-[12px] text-muted-foreground">
        Pemenang:{" "}
        <span className="font-bold text-foreground">
          {pemenangNama}
        </span>
        {row.tanggal_undi && (
          <> · undi {formatTanggalPendek(row.tanggal_undi)}</>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px]">
        <span className="text-emerald-600 dark:text-emerald-400">
          Terkumpul {formatRupiah(row.nominal_terkumpul)}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          Tersalurkan {formatRupiah(row.nominal_putaran ?? 0)}
        </span>
        <span className="text-muted-foreground">·</span>
        <span
          className={
            sisa > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          }
        >
          Sisa {formatRupiah(sisa)}
        </span>
      </div>
      {bisaDiubah && (
        <div className="mt-2 flex gap-1.5">
          {row.putaran_id ? (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[10.5px] font-bold text-muted-foreground transition-transform active:scale-95"
            >
              <Pencil className="h-3 w-3" /> Ubah
            </button>
          ) : (
            <button
              onClick={onCatat}
              className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-[10.5px] font-bold text-primary transition-transform active:scale-95"
            >
              <Plus className="h-3 w-3" /> Catat
            </button>
          )}
          {kind === "belum-disalurkan" && (
            <button
              onClick={onSalurkan}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10.5px] font-bold text-emerald-600 transition-transform active:scale-95 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-3 w-3" /> Salurkan
            </button>
          )}
          {row.putaran_id && (
            <button
              onClick={onHapus}
              className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-[10.5px] font-bold text-destructive transition-transform active:scale-95"
            >
              <Trash2 className="h-3 w-3" /> Hapus
            </button>
          )}
        </div>
      )}
    </div>
  );
}
