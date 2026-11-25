import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import { METODE_BAYAR, SELECT_CLASS } from "@/features/keuangan/constants";
import type { RumahKK } from "@/shared/types/database";
import { formatRupiah } from "@/shared/utils/format";

export interface BulkItem {
  rumah: RumahKK;
  perluKas: boolean;
  perluArisan: boolean;
}

export function PenagihanMassalDrawer({
  open, onOpenChange, items, selected, onToggle, onPilihSemua, onKosongkan,
  tanggal, onTanggalChange, metode, onMetodeChange,
  jumlahTerpilih, total, pending, onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BulkItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onPilihSemua: () => void;
  onKosongkan: () => void;
  tanggal: string;
  onTanggalChange: (value: string) => void;
  metode: string;
  onMetodeChange: (value: string) => void;
  jumlahTerpilih: number;
  total: number;
  pending: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <BottomDrawer open={open} onOpenChange={onOpenChange} title="Catat sesi penagihan">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal *</Label>
            <Input type="date" required value={tanggal} onChange={(e) => onTanggalChange(e.target.value)} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Metode</Label>
            <select className={SELECT_CLASS} value={metode} onChange={(e) => onMetodeChange(e.target.value)}>
              <option value="">Pilih metode...</option>
              {METODE_BAYAR.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-[11.5px] text-muted-foreground">
            {items.length} rumah belum lengkap
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={onPilihSemua}
              className="rounded-lg bg-muted px-2 py-1 text-[10.5px] font-bold text-muted-foreground transition-transform active:scale-95"
            >
              Pilih semua
            </button>
            <button
              type="button"
              onClick={onKosongkan}
              className="rounded-lg bg-muted px-2 py-1 text-[10.5px] font-bold text-muted-foreground transition-transform active:scale-95"
            >
              Kosongkan
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {items.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Semua rumah sudah lengkap bulan ini
            </p>
          )}
          {items.map(({ rumah, perluKas, perluArisan }) => (
            <div key={rumah.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2">
              <span className="text-[12.5px] font-bold">Rumah {rumah.no_rumah}</span>
              <div className="flex shrink-0 gap-1.5">
                {perluKas && (
                  <BulkToggle
                    tone="kas"
                    active={selected.has(`${rumah.id}:Ibu`)}
                    onClick={() => onToggle(`${rumah.id}:Ibu`)}
                  >
                    Kas
                  </BulkToggle>
                )}
                {perluArisan && (
                  <BulkToggle
                    tone="arisan"
                    active={selected.has(`${rumah.id}:Arisan`)}
                    onClick={() => onToggle(`${rumah.id}:Arisan`)}
                  >
                    Arisan
                  </BulkToggle>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 -mx-4 mt-1 border-t border-border/60 bg-card px-4 pt-3 pb-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11.5px] text-muted-foreground">{jumlahTerpilih} pembayaran</span>
            <span className="font-mono text-[14px] font-extrabold text-primary">{formatRupiah(total)}</span>
          </div>
          <button
            type="submit"
            disabled={pending || jumlahTerpilih === 0}
            className="w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Menyimpan..." : `Simpan ${jumlahTerpilih} pembayaran`}
          </button>
        </div>
      </form>
    </BottomDrawer>
  );
}

function BulkToggle({ active, tone, onClick, children }: {
  active: boolean;
  tone: "kas" | "arisan";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeClass = tone === "kas"
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : "bg-violet-500/15 text-violet-600 dark:text-violet-400";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-transform active:scale-95 ${
        active ? activeClass : "border border-border/60 text-muted-foreground"
      }`}
    >
      {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
      {children}
    </button>
  );
}
