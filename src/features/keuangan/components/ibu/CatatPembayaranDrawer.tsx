import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import { METODE_BAYAR, SELECT_CLASS } from "@/features/keuangan/constants";
import type { KasWithRumah } from "@/features/keuangan/services";
import type { RumahKK } from "@/shared/types/database";
import { formatRupiah } from "@/shared/utils/format";
import { RT_CONFIG } from "@/shared/lib/constants";

export function CatatPembayaranDrawer({
  open, onOpenChange, houses, rumahId, onRumahChange,
  bayarKas, onBayarKasChange, bayarArisan, onBayarArisanChange,
  selected, selectedKas, selectedArisan,
  tanggal, onTanggalChange, metode, onMetodeChange,
  keterangan, onKeteranganChange, bisaSimpan, pending, onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houses: RumahKK[];
  rumahId: string;
  onRumahChange: (id: string) => void;
  bayarKas: boolean;
  onBayarKasChange: (value: boolean) => void;
  bayarArisan: boolean;
  onBayarArisanChange: (value: boolean) => void;
  selected: RumahKK | undefined;
  selectedKas: KasWithRumah | undefined;
  selectedArisan: KasWithRumah | undefined;
  tanggal: string;
  onTanggalChange: (value: string) => void;
  metode: string;
  onMetodeChange: (value: string) => void;
  keterangan: string;
  onKeteranganChange: (value: string) => void;
  bisaSimpan: boolean;
  pending: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const bayarKasAktif = bayarKas && !selectedKas;
  const bayarArisanAktif = bayarArisan && !!selected?.ikut_arisan && !selectedArisan;

  return (
    <BottomDrawer open={open} onOpenChange={onOpenChange} title="Catat Ibu & Arisan">
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Rumah *</Label>
          <select
            required
            className={SELECT_CLASS}
            value={rumahId}
            onChange={(e) => onRumahChange(e.target.value)}
          >
            <option value="">Pilih rumah...</option>
            {houses.map((r) => (
              <option key={r.id} value={r.id}>
                Rumah {r.no_rumah}{r.ikut_arisan ? "" : " (non-peserta arisan)"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={`flex items-center gap-2.5 rounded-[11px] border border-border/60 px-3 py-2.5 ${selectedKas ? "opacity-50" : ""}`}>
            <input
              type="checkbox"
              checked={bayarKas}
              disabled={!selected || !!selectedKas}
              onChange={(e) => onBayarKasChange(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <div>
              <div className="text-[12.5px] font-bold">Kas Ibu</div>
              <div className="text-[11px] text-muted-foreground">{formatRupiah(RT_CONFIG.nominal_kas_bulanan_ibu)}/bulan</div>
            </div>
            {selectedKas && (
              <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Sudah Lunas</span>
            )}
          </label>

          {selected?.ikut_arisan && (
            <label className={`flex items-center gap-2.5 rounded-[11px] border border-border/60 px-3 py-2.5 ${selectedArisan ? "opacity-50" : ""}`}>
              <input
                type="checkbox"
                checked={bayarArisan}
                disabled={!!selectedArisan}
                onChange={(e) => onBayarArisanChange(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <div className="text-[12.5px] font-bold">Arisan</div>
                <div className="text-[11px] text-muted-foreground">{formatRupiah(RT_CONFIG.nominal_arisan)}/bulan</div>
              </div>
              {selectedArisan && (
                <span className="ml-auto rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">Sudah Lunas</span>
              )}
            </label>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Tanggal Bayar *</Label>
          <Input type="date" required value={tanggal} onChange={(e) => onTanggalChange(e.target.value)} className="rounded-[11px]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Metode Bayar</Label>
          <select className={SELECT_CLASS} value={metode} onChange={(e) => onMetodeChange(e.target.value)}>
            <option value="">Pilih metode...</option>
            {METODE_BAYAR.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Keterangan</Label>
          <Input value={keterangan} onChange={(e) => onKeteranganChange(e.target.value)} className="rounded-[11px]" />
        </div>

        <button
          type="submit"
          disabled={pending || !bisaSimpan}
          className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending
            ? "Menyimpan..."
            : bayarKasAktif && bayarArisanAktif
              ? "Simpan 2 pembayaran"
              : "Simpan"}
        </button>
      </form>
    </BottomDrawer>
  );
}
