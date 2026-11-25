import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import { Input } from "@/components/ui/input";
import type { WargaDetail } from "@/shared/types/database";
import type { RumahWithWarga } from "@/features/warga/services";
import { AGAMA, HUBUNGAN, JENIS_KELAMIN, SELECT_CLASS, STATUS_KAWIN } from "../constants";
import { FormField, PrimaryButton } from "./form-primitives";

export function WargaFormDrawer({
  open,
  onOpenChange,
  editWarga,
  wargaRumah,
  buatAkunManual,
  onBuatAkunManualChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editWarga: WargaDetail | null;
  wargaRumah: RumahWithWarga | undefined;
  buatAkunManual: boolean;
  onBuatAkunManualChange: (buat: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  return (
    <BottomDrawer open={open} onOpenChange={onOpenChange} title={editWarga ? "Edit Warga" : "Tambah Warga"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <FormField label="Nama Lengkap *">
          <Input name="nama_lengkap" required defaultValue={editWarga?.nama_lengkap} className="rounded-[11px]" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="NIK">
            <Input name="nik" maxLength={16} defaultValue={editWarga?.nik ?? ""} className="rounded-[11px]" />
          </FormField>
          <FormField label="Jenis Kelamin *">
            <select name="jenis_kelamin" defaultValue={editWarga?.jenis_kelamin ?? "L"} className={SELECT_CLASS}>
              {JENIS_KELAMIN.map((j) => <option key={j} value={j}>{j === "L" ? "Laki-laki" : "Perempuan"}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tempat Lahir">
            <Input name="tempat_lahir" defaultValue={editWarga?.tempat_lahir ?? ""} className="rounded-[11px]" />
          </FormField>
          <FormField label="Tanggal Lahir *">
            <Input name="tanggal_lahir" type="date" required defaultValue={editWarga?.tanggal_lahir} className="rounded-[11px]" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Agama *">
            <select name="agama" defaultValue={editWarga?.agama ?? "Islam"} className={SELECT_CLASS}>
              {AGAMA.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </FormField>
          <FormField label="Status Perkawinan *">
            <select name="status_perkawinan" defaultValue={editWarga?.status_perkawinan ?? "Belum Kawin"} className={SELECT_CLASS}>
              {STATUS_KAWIN.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Hubungan Keluarga *">
          <select name="hubungan_keluarga" defaultValue={editWarga?.hubungan_keluarga ?? "Anak"} className={SELECT_CLASS}>
            {HUBUNGAN.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Pendidikan">
            <Input name="pendidikan_terakhir" defaultValue={editWarga?.pendidikan_terakhir ?? ""} className="rounded-[11px]" />
          </FormField>
          <FormField label="Pekerjaan">
            <Input name="pekerjaan" defaultValue={editWarga?.pekerjaan ?? ""} className="rounded-[11px]" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="No. HP">
            <Input name="no_hp" defaultValue={editWarga?.no_hp ?? ""} className="rounded-[11px]" />
          </FormField>
          <FormField label="Gol. Darah">
            <Input name="golongan_darah" maxLength={3} defaultValue={editWarga?.golongan_darah ?? ""} className="rounded-[11px]" />
          </FormField>
        </div>

        {!editWarga && (
          <label className="flex items-start gap-2.5 rounded-[11px] border border-border/60 px-3 py-2.5">
            <input
              type="checkbox"
              checked={buatAkunManual}
              onChange={(e) => onBuatAkunManualChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
            />
            <div>
              <div className="text-[12.5px] font-bold">Buatkan akun login</div>
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                Username: nomor rumah + nama depan (mis. a1-budi). Password awal:
                sirt-rt-{wargaRumah?.no_rumah.toLowerCase() ?? "<no rumah>"}, wajib
                diganti saat login pertama.
              </div>
            </div>
          </label>
        )}

        <PrimaryButton pending={pending} />
      </form>
    </BottomDrawer>
  );
}
