import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  useRumahList, useCreateRumah, useUpdateRumah, useDeleteRumah,
  useCreateWarga, useUpdateWarga, useDeleteWarga, useImportWarga,
  useBuatAkunWarga, useKosongkanRumah, useHuniRumah,
} from "@/features/warga/hooks";
import {
  buildWargaImportPreview, CSV_TEMPLATE,
  type ImportPreview,
} from "@/features/warga/csv";
import {
  saranUsername,
  type BuatAkunResult,
  type RumahWithWarga,
} from "@/features/warga/services";
import type {
  WargaDetail, StatusHunian, JenisKelamin, HubunganKeluarga,
  Agama, StatusPerkawinan, ModeJimpitan,
} from "@/shared/types/database";
import { RumahCard } from "@/features/warga/components/RumahCard";
import { RumahFormDrawer } from "@/features/warga/components/RumahFormDrawer";
import { WargaFormDrawer } from "@/features/warga/components/WargaFormDrawer";
import { ImportWargaDrawer } from "@/features/warga/components/ImportWargaDrawer";
import { AkunHasilDialog } from "@/features/warga/components/AkunHasilDialog";
import { TODAY } from "@/features/warga/constants";

export default function AdminWarga() {
  const { data: rumahList, isLoading } = useRumahList();
  const createRumah = useCreateRumah();
  const updateRumah = useUpdateRumah();
  const deleteRumah = useDeleteRumah();
  const createWarga = useCreateWarga();
  const updateWarga = useUpdateWarga();
  const deleteWarga = useDeleteWarga();
  const importWarga = useImportWarga();
  const buatAkun = useBuatAkunWarga();
  const kosongkanRumah = useKosongkanRumah();
  const huniRumah = useHuniRumah();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rumahDrawer, setRumahDrawer] = useState(false);
  const [wargaDrawer, setWargaDrawer] = useState(false);
  const [editRumah, setEditRumah] = useState<RumahWithWarga | null>(null);
  const [formStatus, setFormStatus] = useState<StatusHunian>("Tetap");
  const [tanggalKosong, setTanggalKosong] = useState(TODAY);
  const [tanggalMulaiHunian, setTanggalMulaiHunian] = useState(TODAY);
  const [tunggakanDialihkan, setTunggakanDialihkan] = useState(true);
  const [editWarga, setEditWarga] = useState<WargaDetail | null>(null);
  const [wargaRumahId, setWargaRumahId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "rumah" | "warga";
    id: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const [akunLines, setAkunLines] = useState<Set<number>>(new Set());
  const [akunHasil, setAkunHasil] = useState<BuatAkunResult[] | null>(null);
  const [buatAkunManual, setBuatAkunManual] = useState(false);

  const resetImport = () => {
    setImportPreview(null);
    setImportFileName("");
    setAkunLines(new Set());
  };

  const wargaRumah = rumahList?.find((r) => r.id === wargaRumahId);

  const toggleAkunLine = (line: number) => {
    setAkunLines((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  };

  const handleImportFile = async (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Pilih file berekstensi .csv");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2 MB");
      return;
    }
    if (!rumahList) {
      toast.error("Data rumah belum selesai dimuat");
      return;
    }
    setReadingFile(true);
    try {
      const preview = buildWargaImportPreview(await file.text(), rumahList);
      setImportPreview(preview);
      setImportFileName(file.name);
      setAkunLines(new Set());
    } catch {
      toast.error("File tidak bisa dibaca sebagai CSV");
    } finally {
      setReadingFile(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob(["\uFEFF" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-impor-warga.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = async () => {
    const rows = importPreview?.rows ?? [];
    const payloads = rows
      .map((row) => row.payload)
      .filter((payload): payload is NonNullable<typeof payload> => Boolean(payload));
    if (payloads.length === 0) return;

    let inserted: Awaited<ReturnType<typeof importWarga.mutateAsync>>;
    try {
      inserted = await importWarga.mutateAsync(payloads);
    } catch {
      return; // toast error sudah ditangani mutation; drawer tetap terbuka
    }

    const terpilih = rows.filter(
      (row) => row.status === "ok" && row.payload && akunLines.has(row.line)
    );
    if (terpilih.length > 0) {
      const idByNama = new Map(
        inserted.map((w) => [
          `${w.rumah_id}|${w.nama_lengkap.trim().toLowerCase()}`,
          w.id,
        ])
      );
      const items = terpilih.flatMap((row) => {
        const wargaId = idByNama.get(
          `${row.payload!.rumah_id}|${row.nama.trim().toLowerCase()}`
        );
        return wargaId
          ? [{ warga_id: wargaId, username: saranUsername(row.noRumah, row.nama) }]
          : [];
      });
      if (items.length > 0) {
        try {
          setAkunHasil(await buatAkun.mutateAsync(items));
        } catch {
          toast.error(
            "Data warga tersimpan, tetapi pembuatan akun gagal. Coba lagi lewat menu Akun Warga."
          );
        }
      }
    }

    setImportOpen(false);
    resetImport();
  };

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

  const openRumahDrawer = (rumah: RumahWithWarga | null) => {
    setEditRumah(rumah);
    setFormStatus(rumah?.status_hunian ?? "Tetap");
    setTanggalKosong(TODAY);
    setTanggalMulaiHunian(
      rumah?.status_hunian === "Kosong" ? TODAY : (rumah?.mulai_kas_ibu ?? TODAY)
    );
    setTunggakanDialihkan(true);
    setRumahDrawer(true);
  };

  const handleRumahSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dasar = {
      no_rumah: fd.get("no_rumah") as string,
      no_kk: (fd.get("no_kk") as string) || null,
      alamat_lengkap: (fd.get("alamat_lengkap") as string) || null,
      mode_jimpitan: fd.get("mode_jimpitan") as ModeJimpitan,
      catatan: (fd.get("catatan") as string) || null,
      mulai_kas_ibu: (fd.get("mulai_kas_ibu") as string) || null,
    };

    try {
      if (!editRumah) {
        // Dibuat kosong dulu agar tidak ada rumah dihuni tanpa periode.
        const rumah = await createRumah.mutateAsync({
          ...dasar,
          status_hunian: "Kosong",
        });
        if (formStatus !== "Kosong") {
          await huniRumah.mutateAsync({
            rumahId: rumah.id,
            tanggalMulai: tanggalMulaiHunian,
            statusHunian: formStatus,
            mulaiKasIbu: dasar.mulai_kas_ibu,
          });
        }
      } else if (formStatus === editRumah.status_hunian) {
        await updateRumah.mutateAsync({
          id: editRumah.id,
          ...dasar,
          status_hunian: formStatus,
        });
      } else if (formStatus === "Kosong") {
        await updateRumah.mutateAsync({ id: editRumah.id, ...dasar });
        await kosongkanRumah.mutateAsync({
          rumahId: editRumah.id,
          tanggalKosong,
        });
      } else if (editRumah.status_hunian === "Kosong") {
        await updateRumah.mutateAsync({ id: editRumah.id, ...dasar });
        await huniRumah.mutateAsync({
          rumahId: editRumah.id,
          tanggalMulai: tanggalMulaiHunian,
          statusHunian: formStatus,
          tunggakanDialihkan,
          mulaiKasIbu: dasar.mulai_kas_ibu,
        });
      } else {
        await updateRumah.mutateAsync({
          id: editRumah.id,
          ...dasar,
          status_hunian: formStatus,
        });
      }
      setRumahDrawer(false);
    } catch {
      // toast error sudah ditangani mutation; drawer tetap terbuka
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
        onSuccess: async (warga) => {
          setWargaDrawer(false);
          setBuatAkunManual(false);
          if (buatAkunManual && wargaRumah) {
            try {
              setAkunHasil(
                await buatAkun.mutateAsync([
                  {
                    warga_id: warga.id,
                    username: saranUsername(wargaRumah.no_rumah, payload.nama_lengkap),
                  },
                ])
              );
            } catch {
              toast.error(
                "Data warga tersimpan, tetapi pembuatan akun gagal. Coba lagi lewat menu Akun Warga."
              );
            }
          }
        },
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
          <>
            <button
              onClick={() => { resetImport(); setImportOpen(true); }}
              className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-[13px] font-bold transition-transform active:scale-[0.96]"
            >
              <Upload className="h-4 w-4" strokeWidth={2.4} />
              Impor
            </button>
            <button
              onClick={() => openRumahDrawer(null)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-[13px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Tambah
            </button>
          </>
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
                onEditRumah={() => openRumahDrawer(rumah)}
                onDeleteRumah={() => setDeleteTarget({ type: "rumah", id: rumah.id })}
                onAddWarga={() => { setEditWarga(null); setWargaRumahId(rumah.id); setBuatAkunManual(false); setWargaDrawer(true); }}
                onEditWarga={(w) => { setEditWarga(w); setWargaRumahId(rumah.id); setWargaDrawer(true); }}
                onDeleteWarga={(id) => setDeleteTarget({ type: "warga", id })}
              />
            );
          })}
        </div>
      )}

      <RumahFormDrawer
        open={rumahDrawer}
        onOpenChange={setRumahDrawer}
        editRumah={editRumah}
        formStatus={formStatus}
        onFormStatusChange={setFormStatus}
        tanggalKosong={tanggalKosong}
        onTanggalKosongChange={setTanggalKosong}
        tanggalMulaiHunian={tanggalMulaiHunian}
        onTanggalMulaiHunianChange={setTanggalMulaiHunian}
        tunggakanDialihkan={tunggakanDialihkan}
        onTunggakanDialihkanChange={setTunggakanDialihkan}
        onSubmit={handleRumahSubmit}
        pending={
          createRumah.isPending ||
          updateRumah.isPending ||
          kosongkanRumah.isPending ||
          huniRumah.isPending
        }
      />

      <WargaFormDrawer
        open={wargaDrawer}
        onOpenChange={setWargaDrawer}
        editWarga={editWarga}
        wargaRumah={wargaRumah}
        buatAkunManual={buatAkunManual}
        onBuatAkunManualChange={setBuatAkunManual}
        onSubmit={handleWargaSubmit}
        pending={createWarga.isPending || updateWarga.isPending}
      />

      <ImportWargaDrawer
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) resetImport();
        }}
        preview={importPreview}
        fileName={importFileName}
        readingFile={readingFile}
        akunLines={akunLines}
        onFileChange={handleImportFile}
        onToggleAkun={toggleAkunLine}
        onDownloadTemplate={handleDownloadTemplate}
        onSubmit={handleImportSubmit}
        submitting={importWarga.isPending || buatAkun.isPending}
      />

      <AkunHasilDialog hasil={akunHasil} onClose={() => setAkunHasil(null)} />

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
