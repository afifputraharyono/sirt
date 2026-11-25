import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import { Input } from "@/components/ui/input";
import type { StatusHunian } from "@/shared/types/database";
import type { RumahWithWarga } from "@/features/warga/services";
import { MODE_JIMPITAN, SELECT_CLASS, STATUS_HUNIAN } from "../constants";
import { FormField, PrimaryButton } from "./form-primitives";

export function RumahFormDrawer({
  open,
  onOpenChange,
  editRumah,
  formStatus,
  onFormStatusChange,
  tanggalKosong,
  onTanggalKosongChange,
  tanggalMulaiHunian,
  onTanggalMulaiHunianChange,
  tunggakanDialihkan,
  onTunggakanDialihkanChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRumah: RumahWithWarga | null;
  formStatus: StatusHunian;
  onFormStatusChange: (status: StatusHunian) => void;
  tanggalKosong: string;
  onTanggalKosongChange: (tanggal: string) => void;
  tanggalMulaiHunian: string;
  onTanggalMulaiHunianChange: (tanggal: string) => void;
  tunggakanDialihkan: boolean;
  onTunggakanDialihkanChange: (dialihkan: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  const jadiKosong =
    !!editRumah &&
    editRumah.status_hunian !== "Kosong" &&
    formStatus === "Kosong";
  const jadiDihuni =
    formStatus !== "Kosong" &&
    (!editRumah || editRumah.status_hunian === "Kosong");

  return (
    <BottomDrawer open={open} onOpenChange={onOpenChange} title={editRumah ? "Edit Rumah" : "Tambah Rumah"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <FormField label="No. Rumah *">
          <Input name="no_rumah" required defaultValue={editRumah?.no_rumah} className="rounded-[11px]" />
        </FormField>
        <FormField label="No. KK">
          <Input name="no_kk" maxLength={16} defaultValue={editRumah?.no_kk ?? ""} className="rounded-[11px]" />
        </FormField>
        <FormField label="Alamat Lengkap">
          <Input name="alamat_lengkap" defaultValue={editRumah?.alamat_lengkap ?? ""} className="rounded-[11px]" />
        </FormField>
        <FormField label="Status Hunian *">
          <select
            value={formStatus}
            onChange={(e) => onFormStatusChange(e.target.value as StatusHunian)}
            className={SELECT_CLASS}
          >
            {STATUS_HUNIAN.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {jadiKosong && (
            <p className="text-[11px] text-muted-foreground">
              Bulan tanggal kosong tidak ditagih; tagihan berhenti di bulan
              sebelumnya.
            </p>
          )}
          {jadiDihuni && (
            <p className="text-[11px] text-muted-foreground">
              Bulan mulai hunian tetap ditagih penuh.
            </p>
          )}
        </FormField>
        {jadiKosong && (
          <FormField label="Tanggal Kosong *">
            <Input
              type="date"
              required
              value={tanggalKosong}
              onChange={(e) => onTanggalKosongChange(e.target.value)}
              className="rounded-[11px]"
            />
          </FormField>
        )}
        {jadiDihuni && (
          <FormField label="Tanggal Mulai Hunian *">
            <Input
              type="date"
              required
              value={tanggalMulaiHunian}
              onChange={(e) => onTanggalMulaiHunianChange(e.target.value)}
              className="rounded-[11px]"
            />
          </FormField>
        )}
        {jadiDihuni && editRumah && (
          <label className="flex items-start gap-2.5 rounded-[11px] border border-border/60 px-3 py-2.5">
            <input
              type="checkbox"
              checked={tunggakanDialihkan}
              onChange={(e) => onTunggakanDialihkanChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
            />
            <div>
              <div className="text-[12.5px] font-bold">Tunggakan lama dialihkan</div>
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                Jika dicentang, tunggakan dari masa hunian sebelumnya tetap
                ditagihkan ke rumah ini. Jika tidak, tagihan dimulai dari bulan
                mulai hunian.
              </div>
            </div>
          </label>
        )}
        <FormField label="Mode Jimpitan *">
          <select name="mode_jimpitan" defaultValue={editRumah?.mode_jimpitan ?? "Harian"} className={SELECT_CLASS}>
            {MODE_JIMPITAN.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="Status Arisan">
          <div className="rounded-[11px] border border-border/60 px-3 py-2.5">
            <div className="text-[12.5px] font-bold">
              {editRumah?.ikut_arisan ? "Peserta arisan ronde berjalan" : "Bukan peserta arisan"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Keanggotaan arisan diatur lewat Keuangan → Putaran (Mulai ronde).
            </div>
          </div>
        </FormField>
        <FormField label="Mulai Kas Ibu">
          <Input
            name="mulai_kas_ibu"
            type="date"
            defaultValue={editRumah?.mulai_kas_ibu ?? ""}
            className="rounded-[11px]"
          />
          <p className="text-[11px] text-muted-foreground">
            {jadiDihuni
              ? "Kosongkan untuk otomatis memakai awal bulan tanggal mulai hunian."
              : "Kosongkan bila rumah sudah ditempati sebelum kas berjalan (wajib sejak Agustus)."}
          </p>
        </FormField>
        <FormField label="Catatan">
          <Input name="catatan" defaultValue={editRumah?.catatan ?? ""} className="rounded-[11px]" />
        </FormField>
        <PrimaryButton pending={pending} />
      </form>
    </BottomDrawer>
  );
}
