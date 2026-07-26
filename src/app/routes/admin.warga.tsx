import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, UserPlus, Search, Home } from "lucide-react";
import {
  useRumahList, useCreateRumah, useUpdateRumah, useDeleteRumah,
  useCreateWarga, useUpdateWarga, useDeleteWarga,
} from "@/features/warga/hooks";
import type { RumahWithWarga } from "@/features/warga/services";
import type {
  WargaDetail, StatusHunian, JenisKelamin, HubunganKeluarga,
  Agama, StatusPerkawinan,
} from "@/shared/types/database";
import { hitungUmur } from "@/shared/utils/format";

const STATUS_HUNIAN: StatusHunian[] = ["Tetap", "Kontrak", "Kosong"];
const JENIS_KELAMIN: JenisKelamin[] = ["L", "P"];
const HUBUNGAN: HubunganKeluarga[] = [
  "Kepala Keluarga", "Istri", "Anak", "Orang Tua",
  "Mertua", "Menantu", "Cucu", "Famili Lain", "Lainnya",
];
const AGAMA: Agama[] = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"];
const STATUS_KAWIN: StatusPerkawinan[] = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];
const SELECT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";

const HUNIAN_BADGE: Record<string, string> = {
  Tetap: "bg-primary/15 text-primary",
  Kontrak: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Kosong: "border border-border/60 text-muted-foreground",
};

export default function AdminWarga() {
  const { data: rumahList, isLoading } = useRumahList();
  const createRumah = useCreateRumah();
  const updateRumah = useUpdateRumah();
  const deleteRumah = useDeleteRumah();
  const createWarga = useCreateWarga();
  const updateWarga = useUpdateWarga();
  const deleteWarga = useDeleteWarga();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rumahDrawer, setRumahDrawer] = useState(false);
  const [wargaDrawer, setWargaDrawer] = useState(false);
  const [editRumah, setEditRumah] = useState<RumahWithWarga | null>(null);
  const [editWarga, setEditWarga] = useState<WargaDetail | null>(null);
  const [wargaRumahId, setWargaRumahId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "rumah" | "warga";
    id: string;
  } | null>(null);
  const [search, setSearch] = useState("");

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const filteredList = rumahList?.filter(
    (r) =>
      r.no_rumah.includes(search) ||
      r.no_kk?.includes(search) ||
      r.warga_detail.some((w) =>
        w.nama_lengkap.toLowerCase().includes(search.toLowerCase())
      )
  );

  const handleRumahSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      no_rumah: fd.get("no_rumah") as string,
      no_kk: (fd.get("no_kk") as string) || null,
      alamat_lengkap: (fd.get("alamat_lengkap") as string) || null,
      status_hunian: fd.get("status_hunian") as StatusHunian,
      catatan: (fd.get("catatan") as string) || null,
    };
    if (editRumah) {
      updateRumah.mutate(
        { id: editRumah.id, ...payload },
        { onSuccess: () => setRumahDrawer(false) }
      );
    } else {
      createRumah.mutate(payload, {
        onSuccess: () => setRumahDrawer(false),
      });
    }
  };

  const handleWargaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      rumah_id: wargaRumahId,
      nik: (fd.get("nik") as string) || null,
      nama_lengkap: fd.get("nama_lengkap") as string,
      jenis_kelamin: fd.get("jenis_kelamin") as JenisKelamin,
      tempat_lahir: (fd.get("tempat_lahir") as string) || null,
      tanggal_lahir: fd.get("tanggal_lahir") as string,
      agama: fd.get("agama") as Agama,
      status_perkawinan: fd.get("status_perkawinan") as StatusPerkawinan,
      hubungan_keluarga: fd.get("hubungan_keluarga") as HubunganKeluarga,
      pendidikan_terakhir: (fd.get("pendidikan_terakhir") as string) || null,
      pekerjaan: (fd.get("pekerjaan") as string) || null,
      no_hp: (fd.get("no_hp") as string) || null,
      golongan_darah: (fd.get("golongan_darah") as string) || null,
    };
    if (editWarga) {
      updateWarga.mutate(
        { id: editWarga.id, ...payload },
        { onSuccess: () => setWargaDrawer(false) }
      );
    } else {
      createWarga.mutate(payload, {
        onSuccess: () => setWargaDrawer(false),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "rumah") {
      deleteRumah.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    } else {
      deleteWarga.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Data Warga"
        description="Kelola data rumah dan anggota keluarga"
        actions={
          <button
            onClick={() => { setEditRumah(null); setRumahDrawer(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-[13px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Tambah
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2.2} />
        <input
          placeholder="Cari no. rumah, KK, atau nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[11px] border border-border/60 bg-card py-2.75 pl-9 pr-3 text-[13.5px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Rumah cards */}
      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[14px]" />
          ))}
        </div>
      ) : filteredList?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-border/60 py-10 text-center">
          <Home className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            Belum ada data rumah
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredList?.map((rumah) => {
            const kk = rumah.warga_detail.find(
              (w) => w.hubungan_keluarga === "Kepala Keluarga" && w.is_active
            );
            const isOpen = expandedRows.has(rumah.id);
            const activeWarga = rumah.warga_detail.filter((w) => w.is_active);
            return (
              <RumahCard
                key={rumah.id}
                rumah={rumah}
                kk={kk}
                isOpen={isOpen}
                activeWarga={activeWarga}
                onToggle={() => toggleRow(rumah.id)}
                onEditRumah={() => { setEditRumah(rumah); setRumahDrawer(true); }}
                onDeleteRumah={() => setDeleteTarget({ type: "rumah", id: rumah.id })}
                onAddWarga={() => { setEditWarga(null); setWargaRumahId(rumah.id); setWargaDrawer(true); }}
                onEditWarga={(w) => { setEditWarga(w); setWargaRumahId(rumah.id); setWargaDrawer(true); }}
                onDeleteWarga={(id) => setDeleteTarget({ type: "warga", id })}
              />
            );
          })}
        </div>
      )}

      {/* Drawer Rumah */}
      <BottomDrawer open={rumahDrawer} onOpenChange={setRumahDrawer} title={editRumah ? "Edit Rumah" : "Tambah Rumah"}>
        <form onSubmit={handleRumahSubmit} className="flex flex-col gap-3.5">
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
            <select name="status_hunian" defaultValue={editRumah?.status_hunian ?? "Tetap"} className={SELECT_CLASS}>
              {STATUS_HUNIAN.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Catatan">
            <Input name="catatan" defaultValue={editRumah?.catatan ?? ""} className="rounded-[11px]" />
          </FormField>
          <PrimaryButton pending={createRumah.isPending || updateRumah.isPending} />
        </form>
      </BottomDrawer>

      {/* Drawer Warga */}
      <BottomDrawer open={wargaDrawer} onOpenChange={setWargaDrawer} title={editWarga ? "Edit Warga" : "Tambah Warga"}>
        <form onSubmit={handleWargaSubmit} className="flex flex-col gap-3.5">
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
          <PrimaryButton pending={createWarga.isPending || updateWarga.isPending} />
        </form>
      </BottomDrawer>

      {/* Confirm Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "rumah"
                ? "Data rumah dan seluruh anggotanya akan dinonaktifkan."
                : "Data warga ini akan dinonaktifkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12.5px] font-bold">{label}</Label>
      {children}
    </div>
  );
}

function PrimaryButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan"}
    </button>
  );
}

function IconBtn({ icon: Icon, danger, onClick }: { icon: typeof Pencil; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-transform active:scale-90 ${
        danger ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
    </button>
  );
}

function RumahCard({
  rumah, kk, isOpen, activeWarga,
  onToggle, onEditRumah, onDeleteRumah, onAddWarga, onEditWarga, onDeleteWarga,
}: {
  rumah: RumahWithWarga;
  kk: WargaDetail | undefined;
  isOpen: boolean;
  activeWarga: WargaDetail[];
  onToggle: () => void;
  onEditRumah: () => void;
  onDeleteRumah: () => void;
  onAddWarga: () => void;
  onEditWarga: (w: WargaDetail) => void;
  onDeleteWarga: (id: string) => void;
}) {
  return (
    <div className="animate-in fade-in rounded-[14px] border border-border/60 bg-card transition-all">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors active:bg-muted/50"
      >
        {isOpen
          ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2.5} />
          : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2.5} />
        }
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold">Rumah {rumah.no_rumah}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${HUNIAN_BADGE[rumah.status_hunian] ?? ""}`}>
              {rumah.status_hunian}
            </span>
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {kk?.nama_lengkap ?? "Belum ada KK"} · {activeWarga.length} anggota
          </div>
        </div>
        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
          <IconBtn icon={Pencil} onClick={onEditRumah} />
          <IconBtn icon={Trash2} danger onClick={onDeleteRumah} />
        </div>
      </button>

      {/* Expanded warga list */}
      {isOpen && (
        <div className="border-t border-border/60 px-3.5 py-2.5">
          {activeWarga.length === 0 ? (
            <p className="py-2 text-center text-[12.5px] text-muted-foreground">
              Belum ada anggota
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeWarga.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-2.5 rounded-[10px] bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold">{w.nama_lengkap}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                      <span>{w.hubungan_keluarga}</span>
                      <span>·</span>
                      <span>{w.jenis_kelamin === "L" ? "L" : "P"}, {hitungUmur(w.tanggal_lahir)} thn</span>
                      {w.pekerjaan && <><span>·</span><span>{w.pekerjaan}</span></>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconBtn icon={Pencil} onClick={() => onEditWarga(w)} />
                    <IconBtn icon={Trash2} danger onClick={() => onDeleteWarga(w.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={onAddWarga}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-border/60 py-2 text-[12.5px] font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <UserPlus className="h-3.5 w-3.5" strokeWidth={2.2} />
            Tambah Anggota
          </button>
        </div>
      )}
    </div>
  );
}
