import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";

export function MulaiRondeDrawer({
  open, onOpenChange, bulan, onBulanChange, catatan, onCatatanChange,
  anggota, onToggleAnggota, onPilihSemua, onKosongkan, rumahOptions,
  pending, onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulan: string;
  onBulanChange: (value: string) => void;
  catatan: string;
  onCatatanChange: (value: string) => void;
  anggota: Set<string>;
  onToggleAnggota: (id: string) => void;
  onPilihSemua: () => void;
  onKosongkan: () => void;
  rumahOptions: { id: string; no_rumah: string }[];
  pending: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <BottomDrawer open={open} onOpenChange={onOpenChange} title="Mulai Ronde Baru">
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Bulan mulai *</Label>
          <Input
            type="month"
            required
            value={bulan}
            onChange={(e) => onBulanChange(e.target.value)}
            className="rounded-[11px]"
          />
          <p className="text-[11px] text-muted-foreground">
            Ronde dimulai tanggal 1 dan harus setelah ronde sebelumnya ditutup.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Catatan</Label>
          <Input
            value={catatan}
            onChange={(e) => onCatatanChange(e.target.value)}
            className="rounded-[11px]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-[12.5px] font-bold">
              Anggota ronde * ({anggota.size})
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPilihSemua}
                className="text-[11px] font-bold text-primary"
              >
                Pilih semua
              </button>
              <button
                type="button"
                onClick={onKosongkan}
                className="text-[11px] font-bold text-muted-foreground"
              >
                Kosongkan
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-[11px] border border-border/60">
            {rumahOptions.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-2.5 border-b border-border/40 px-3 py-2 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={anggota.has(r.id)}
                  onChange={() => onToggleAnggota(r.id)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-[12.5px] font-medium">Rumah {r.no_rumah}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Keanggotaan dibekukan setelah ronde dimulai. Rumah Kosong tidak bisa dipilih;
            susunan ini juga menentukan peserta pembayaran arisan.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending || !bulan || anggota.size === 0}
          className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Memulai..." : "Mulai ronde"}
        </button>
      </form>
    </BottomDrawer>
  );
}
