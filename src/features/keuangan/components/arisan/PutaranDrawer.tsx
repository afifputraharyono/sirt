import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import { SELECT_CLASS } from "@/features/keuangan/constants";
import { labelPeriode, parsePeriodeKey, type PeriodeRonde } from "@/features/keuangan/arisan";
import type { ArisanAnggotaRow } from "@/features/keuangan/services";
import { formatRupiah } from "@/shared/utils/format";

export function PutaranDrawer({
  open, onOpenChange, editId,
  formPeriode, onFormPeriodeChange, opsiPeriode,
  pemenangId, onPemenangIdChange, kandidat,
  nominal, onNominalChange, tanggalUndi, onTanggalUndiChange,
  catatan, onCatatanChange, salurkanSekarang, onSalurkanSekarangChange,
  tanggalSalur, onTanggalSalurChange, formPot, selisihTalangan,
  pending, onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId: string | null;
  formPeriode: string;
  onFormPeriodeChange: (value: string) => void;
  opsiPeriode: PeriodeRonde[];
  pemenangId: string;
  onPemenangIdChange: (value: string) => void;
  kandidat: ArisanAnggotaRow[];
  nominal: string;
  onNominalChange: (value: string) => void;
  tanggalUndi: string;
  onTanggalUndiChange: (value: string) => void;
  catatan: string;
  onCatatanChange: (value: string) => void;
  salurkanSekarang: boolean;
  onSalurkanSekarangChange: (value: boolean) => void;
  tanggalSalur: string;
  onTanggalSalurChange: (value: string) => void;
  formPot: number;
  selisihTalangan: number;
  pending: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const nilaiNominal = Number(nominal);

  return (
    <BottomDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editId ? "Ubah Putaran" : "Catat Putaran"}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Periode putaran *</Label>
          <select
            required
            value={formPeriode}
            onChange={(e) => onFormPeriodeChange(e.target.value)}
            disabled={!!editId}
            className={SELECT_CLASS}
          >
            {opsiPeriode.length === 0 && (
              <option value={formPeriode}>
                {labelPeriode(
                  parsePeriodeKey(formPeriode).tahun,
                  parsePeriodeKey(formPeriode).bulan,
                )}
              </option>
            )}
            {opsiPeriode.map((p) => (
              <option key={p.key} value={p.key}>
                Putaran ke-{p.urutan} · {labelPeriode(p.tahun, p.bulan)}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Periode mengikuti urutan ronde; satu putaran per bulan.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Pemenang *</Label>
          <select
            required
            value={pemenangId}
            onChange={(e) => onPemenangIdChange(e.target.value)}
            disabled={kandidat.length === 0}
            className={SELECT_CLASS}
          >
            <option value="">Pilih rumah anggota ronde...</option>
            {kandidat.map((a) => (
              <option key={a.rumah_id} value={a.rumah_id}>
                Rumah {a.rumah_kk?.no_rumah ?? "?"}
              </option>
            ))}
          </select>
          {kandidat.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Tidak ada anggota yang belum menang.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Nominal pot (Rp) *</Label>
          <Input
            type="number"
            required
            min={1}
            value={nominal}
            onChange={(e) => onNominalChange(e.target.value)}
            className="rounded-[11px]"
          />
          <p className="text-[11px] text-muted-foreground">
            Pot terkumpul {labelPeriode(
              parsePeriodeKey(formPeriode).tahun,
              parsePeriodeKey(formPeriode).bulan,
            )}: {formatRupiah(formPot)}.
          </p>
          {selisihTalangan > 0 && (
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Nominal melebihi pot {formatRupiah(selisihTalangan)}; akan dikonfirmasi
              sebagai talangan dari saldo kas.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Tanggal undi</Label>
          <Input
            type="date"
            value={tanggalUndi}
            onChange={(e) => onTanggalUndiChange(e.target.value)}
            className="rounded-[11px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-bold">Catatan</Label>
          <Input
            value={catatan}
            onChange={(e) => onCatatanChange(e.target.value)}
            className="rounded-[11px]"
          />
        </div>
        <label className="flex items-center gap-2.5 rounded-[11px] border border-border/60 px-3 py-2.5">
          <input
            type="checkbox"
            checked={salurkanSekarang}
            onChange={(e) => onSalurkanSekarangChange(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <div>
            <div className="text-[12.5px] font-bold">Sekaligus catat penyaluran</div>
            <div className="text-[11px] text-muted-foreground">Membuat pengeluaran dana Arisan</div>
          </div>
        </label>
        {salurkanSekarang && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal salur</Label>
            <Input
              type="date"
              value={tanggalSalur}
              onChange={(e) => onTanggalSalurChange(e.target.value)}
              className="rounded-[11px]"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={
            pending || !pemenangId || !(nilaiNominal > 0) || !formPeriode
          }
          className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Simpan putaran"}
        </button>
      </form>
    </BottomDrawer>
  );
}
