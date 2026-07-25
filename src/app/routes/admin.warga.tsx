import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, UserPlus } from "lucide-react";
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
const SELECT_CLASS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export default function AdminWarga() {
  const { data: rumahList, isLoading } = useRumahList();
  const createRumah = useCreateRumah();
  const updateRumah = useUpdateRumah();
  const deleteRumah = useDeleteRumah();
  const createWarga = useCreateWarga();
  const updateWarga = useUpdateWarga();
  const deleteWarga = useDeleteWarga();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rumahDialog, setRumahDialog] = useState(false);
  const [wargaDialog, setWargaDialog] = useState(false);
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
        { onSuccess: () => setRumahDialog(false) }
      );
    } else {
      createRumah.mutate(payload, {
        onSuccess: () => setRumahDialog(false),
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
        { onSuccess: () => setWargaDialog(false) }
      );
    } else {
      createWarga.mutate(payload, {
        onSuccess: () => setWargaDialog(false),
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
    <div className="space-y-6">
      <PageHeader
        title="Data Warga"
        description="Kelola data rumah dan anggota keluarga"
        actions={
          <Button onClick={() => { setEditRumah(null); setRumahDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Rumah
          </Button>
        }
      />

      <Input
        placeholder="Cari no. rumah, no. KK, atau nama warga..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>No. Rumah</TableHead>
                <TableHead>No. KK</TableHead>
                <TableHead>Kepala Keluarga</TableHead>
                <TableHead>Anggota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada data rumah
                  </TableCell>
                </TableRow>
              )}
              {filteredList?.map((rumah) => {
                const kk = rumah.warga_detail.find(
                  (w) => w.hubungan_keluarga === "Kepala Keluarga" && w.is_active
                );
                const isOpen = expandedRows.has(rumah.id);
                const activeWarga = rumah.warga_detail.filter((w) => w.is_active);
                return (
                  <RumahExpandableRow
                    key={rumah.id}
                    rumah={rumah}
                    kk={kk}
                    isOpen={isOpen}
                    activeWarga={activeWarga}
                    onToggle={() => toggleRow(rumah.id)}
                    onEditRumah={() => { setEditRumah(rumah); setRumahDialog(true); }}
                    onDeleteRumah={() => setDeleteTarget({ type: "rumah", id: rumah.id })}
                    onAddWarga={() => { setEditWarga(null); setWargaRumahId(rumah.id); setWargaDialog(true); }}
                    onEditWarga={(w) => { setEditWarga(w); setWargaRumahId(rumah.id); setWargaDialog(true); }}
                    onDeleteWarga={(id) => setDeleteTarget({ type: "warga", id })}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog Rumah */}
      <Dialog open={rumahDialog} onOpenChange={setRumahDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRumah ? "Edit Rumah" : "Tambah Rumah"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRumahSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="r_no">No. Rumah *</Label>
              <Input id="r_no" name="no_rumah" required defaultValue={editRumah?.no_rumah} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r_kk">No. KK</Label>
              <Input id="r_kk" name="no_kk" maxLength={16} defaultValue={editRumah?.no_kk ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r_alamat">Alamat Lengkap</Label>
              <Input id="r_alamat" name="alamat_lengkap" defaultValue={editRumah?.alamat_lengkap ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Status Hunian *</Label>
              <select name="status_hunian" defaultValue={editRumah?.status_hunian ?? "Tetap"} className={SELECT_CLASS}>
                {STATUS_HUNIAN.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="r_catatan">Catatan</Label>
              <Input id="r_catatan" name="catatan" defaultValue={editRumah?.catatan ?? ""} />
            </div>
            <Button type="submit" className="w-full" disabled={createRumah.isPending || updateRumah.isPending}>
              {(createRumah.isPending || updateRumah.isPending) ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Warga */}
      <Dialog open={wargaDialog} onOpenChange={setWargaDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editWarga ? "Edit Warga" : "Tambah Warga"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWargaSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="w_nama">Nama Lengkap *</Label>
                <Input id="w_nama" name="nama_lengkap" required defaultValue={editWarga?.nama_lengkap} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w_nik">NIK</Label>
                <Input id="w_nik" name="nik" maxLength={16} defaultValue={editWarga?.nik ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin *</Label>
                <select name="jenis_kelamin" defaultValue={editWarga?.jenis_kelamin ?? "L"} className={SELECT_CLASS}>
                  {JENIS_KELAMIN.map((j) => <option key={j} value={j}>{j === "L" ? "Laki-laki" : "Perempuan"}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="w_tempat">Tempat Lahir</Label>
                <Input id="w_tempat" name="tempat_lahir" defaultValue={editWarga?.tempat_lahir ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w_tgl">Tanggal Lahir *</Label>
                <Input id="w_tgl" name="tanggal_lahir" type="date" required defaultValue={editWarga?.tanggal_lahir} />
              </div>
              <div className="space-y-2">
                <Label>Agama *</Label>
                <select name="agama" defaultValue={editWarga?.agama ?? "Islam"} className={SELECT_CLASS}>
                  {AGAMA.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status Perkawinan *</Label>
                <select name="status_perkawinan" defaultValue={editWarga?.status_perkawinan ?? "Belum Kawin"} className={SELECT_CLASS}>
                  {STATUS_KAWIN.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Hubungan Keluarga *</Label>
                <select name="hubungan_keluarga" defaultValue={editWarga?.hubungan_keluarga ?? "Anak"} className={SELECT_CLASS}>
                  {HUBUNGAN.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="w_didik">Pendidikan</Label>
                <Input id="w_didik" name="pendidikan_terakhir" defaultValue={editWarga?.pendidikan_terakhir ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w_kerja">Pekerjaan</Label>
                <Input id="w_kerja" name="pekerjaan" defaultValue={editWarga?.pekerjaan ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w_hp">No. HP</Label>
                <Input id="w_hp" name="no_hp" defaultValue={editWarga?.no_hp ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w_darah">Gol. Darah</Label>
                <Input id="w_darah" name="golongan_darah" maxLength={3} defaultValue={editWarga?.golongan_darah ?? ""} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createWarga.isPending || updateWarga.isPending}>
              {(createWarga.isPending || updateWarga.isPending) ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

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

function RumahExpandableRow({
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
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell className="font-medium">{rumah.no_rumah}</TableCell>
        <TableCell className="font-mono text-xs">{rumah.no_kk ?? "-"}</TableCell>
        <TableCell>{kk?.nama_lengkap ?? "-"}</TableCell>
        <TableCell>{activeWarga.length} orang</TableCell>
        <TableCell>
          <Badge variant={rumah.status_hunian === "Tetap" ? "default" : rumah.status_hunian === "Kontrak" ? "secondary" : "outline"}>
            {rumah.status_hunian}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={onEditRumah}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onDeleteRumah}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </TableCell>
      </TableRow>
      {isOpen && (
        <>
          {activeWarga.map((w) => (
            <TableRow key={w.id} className="bg-muted/30">
              <TableCell />
              <TableCell />
              <TableCell className="font-mono text-xs">{w.nik ?? "-"}</TableCell>
              <TableCell>
                {w.nama_lengkap}
                <span className="ml-2 text-xs text-muted-foreground">({w.hubungan_keluarga})</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {w.jenis_kelamin === "L" ? "L" : "P"}, {hitungUmur(w.tanggal_lahir)} thn
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{w.pekerjaan ?? "-"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEditWarga(w)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteWarga(w.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/30">
            <TableCell colSpan={7}>
              <Button variant="ghost" size="sm" onClick={onAddWarga}>
                <UserPlus className="mr-2 h-3 w-3" /> Tambah Anggota
              </Button>
            </TableCell>
          </TableRow>
        </>
      )}
    </>
  );
}
