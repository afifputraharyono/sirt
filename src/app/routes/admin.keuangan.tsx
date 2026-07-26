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
import { Plus, Trash2, Printer } from "lucide-react";
import {
  useKasByMonth, useCreateKas, useDeleteKas,
  useJimpitanSummary, useCreateJimpitan, useDeleteJimpitan,
  usePengeluaran, useCreatePengeluaran, useDeletePengeluaran,
  useSaldoKas,
} from "@/features/keuangan/hooks";
import { useRumahList } from "@/features/warga/hooks";
import { useAuthStore } from "@/features/auth/store";
import type { TipeKas, KategoriPengeluaran } from "@/shared/types/database";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { cetakLaporanKeuangan } from "@/shared/utils/print";
import { RT_CONFIG } from "@/shared/lib/constants";

const BULAN_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const KATEGORI_PENGELUARAN: KategoriPengeluaran[] = ["Operasional", "Keamanan", "Kebersihan", "Sosial", "Pembangunan", "Kegiatan", "Lainnya"];
const SELECT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";

const TABS = [
  { key: "kas-bapak", label: "Kas Bapak" },
  { key: "kas-ibu", label: "Kas Ibu" },
  { key: "jimpitan", label: "Jimpitan" },
  { key: "pengeluaran", label: "Pengeluaran" },
] as const;

const now = new Date();

export default function AdminKeuangan() {
  const [tab, setTab] = useState<string>("kas-bapak");
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const { data: saldo, isLoading: saldoLoading } = useSaldoKas();
  const { data: kasBapak } = useKasByMonth("Bapak", bulan, tahun);
  const { data: kasIbu } = useKasByMonth("Ibu", bulan, tahun);
  const { data: pengeluaranList } = usePengeluaran(bulan, tahun);

  const handleCetakLaporan = () => {
    if (!saldo) return;
    cetakLaporanKeuangan({
      bulan,
      tahun,
      kasBapak: (kasBapak ?? []).map((k) => ({
        noRumah: k.rumah_kk?.no_rumah ?? "-",
        jumlah: k.jumlah,
        status: k.status_bayar,
      })),
      kasIbu: (kasIbu ?? []).map((k) => ({
        noRumah: k.rumah_kk?.no_rumah ?? "-",
        jumlah: k.jumlah,
        status: k.status_bayar,
      })),
      pengeluaran: (pengeluaranList ?? []).map((p) => ({
        tanggal: p.tanggal,
        kategori: p.kategori,
        keterangan: p.keterangan ?? "",
        nominal: p.nominal,
      })),
      saldo,
    });
  };

  const saldoCards = [
    { title: "Kas Bapak", value: saldo?.kas_bapak_masuk ?? 0 },
    { title: "Kas Ibu", value: saldo?.kas_ibu_masuk ?? 0 },
    { title: "Jimpitan", value: saldo?.jimpitan_masuk ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Keuangan"
        description="Kelola kas bulanan, jimpitan, dan pengeluaran"
        actions={
          <button
            onClick={handleCetakLaporan}
            disabled={!saldo}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-[13px] font-bold transition-transform active:scale-[0.96] disabled:opacity-50"
          >
            <Printer className="h-4 w-4" strokeWidth={2.2} />
            Cetak
          </button>
        }
      />

      {/* Saldo cards */}
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2.5">
          {saldoCards.map((c) => (
            <div key={c.title} className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
              <div className="text-[11.5px] font-semibold text-muted-foreground">{c.title}</div>
              <div className="mt-0.5 font-mono text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400">
                {saldoLoading ? <Skeleton className="h-5 w-20" /> : formatRupiah(c.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month / Year selector */}
      <div className="flex gap-2">
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className="flex-1 rounded-[11px] border border-border/60 bg-card px-3 py-2 text-[13px] font-bold"
        >
          {BULAN_NAMES.slice(1).map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
        </select>
        <input
          type="number"
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="w-20 rounded-[11px] border border-border/60 bg-card px-3 py-2 text-center text-[13px] font-bold"
          min={2020}
          max={2030}
        />
      </div>

      {/* Pill tabs */}
      <div className="flex gap-1 rounded-[14px] bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-[10px] py-2 text-[12px] font-bold transition-all ${
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "kas-bapak" && <KasTab tipe="Bapak" bulan={bulan} tahun={tahun} nominal={RT_CONFIG.nominal_kas_bulanan_bapak} />}
      {tab === "kas-ibu" && <KasTab tipe="Ibu" bulan={bulan} tahun={tahun} nominal={RT_CONFIG.nominal_kas_bulanan_ibu} />}
      {tab === "jimpitan" && <JimpitanTab bulan={bulan} tahun={tahun} />}
      {tab === "pengeluaran" && <PengeluaranTab bulan={bulan} tahun={tahun} />}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-border/60 bg-card p-4">
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </button>
  );
}

function KasTab({ tipe, bulan, tahun, nominal }: { tipe: TipeKas; bulan: number; tahun: number; nominal: number }) {
  const { data: kasList, isLoading } = useKasByMonth(tipe, bulan, tahun);
  const { data: rumahList } = useRumahList();
  const createKas = useCreateKas();
  const deleteKas = useDeleteKas();
  const user = useAuthStore((s) => s.user);

  const [drawer, setDrawer] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createKas.mutate({
      rumah_id: fd.get("rumah_id") as string,
      tipe_kas: tipe,
      bulan,
      tahun,
      jumlah: nominal,
      status_bayar: true,
      tanggal_bayar: fd.get("tanggal_bayar") as string,
      metode_bayar: (fd.get("metode_bayar") as string) || null,
      keterangan: (fd.get("keterangan") as string) || null,
      dicatat_oleh: user?.id ?? "",
    }, { onSuccess: () => setDrawer(false) });
  };

  const paidRumahIds = new Set(kasList?.map((k) => k.rumah_id));
  const unpaidRumah = rumahList?.filter((r) => r.is_active && r.status_hunian !== "Kosong" && !paidRumahIds.has(r.id));

  return (
    <SectionCard>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12.5px] text-muted-foreground">
          {BULAN_NAMES[bulan]} {tahun} — <span className="font-bold text-foreground">{formatRupiah(nominal)}/rumah</span>
        </div>
        <AddButton label="Catat" onClick={() => setDrawer(true)} />
      </div>

      {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <div className="flex flex-col gap-2">
          {kasList?.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
              <div>
                <div className="text-[13px] font-bold">Rumah {k.rumah_kk?.no_rumah ?? "-"}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(k.jumlah)}</span>
                  <span>·</span>
                  <span>{k.tanggal_bayar ? formatTanggalPendek(k.tanggal_bayar) : "-"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">Lunas</span>
                <button onClick={() => setDeleteId(k.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-transform active:scale-90">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          ))}
          {unpaidRumah?.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-dashed border-border/60 px-3 py-2.5 text-muted-foreground">
              <div>
                <div className="text-[13px] font-bold">Rumah {r.no_rumah}</div>
                <div className="mt-0.5 font-mono text-[11px]">{formatRupiah(nominal)}</div>
              </div>
              <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-bold">Belum Bayar</span>
            </div>
          ))}
          {kasList?.length === 0 && unpaidRumah?.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Belum ada data</p>
          )}
        </div>
      )}

      <BottomDrawer open={drawer} onOpenChange={setDrawer} title={`Catat Pembayaran Kas ${tipe}`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Rumah *</Label>
            <select name="rumah_id" required className={SELECT_CLASS}>
              <option value="">Pilih rumah...</option>
              {unpaidRumah?.map((r) => <option key={r.id} value={r.id}>Rumah {r.no_rumah}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal Bayar *</Label>
            <Input name="tanggal_bayar" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Metode Bayar</Label>
            <Input name="metode_bayar" placeholder="Tunai / Transfer" className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Keterangan</Label>
            <Input name="keterangan" className="rounded-[11px]" />
          </div>
          <button type="submit" disabled={createKas.isPending} className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60">
            {createKas.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>Data pembayaran kas akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteKas.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

function JimpitanTab({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: jimpitanList, isLoading } = useJimpitanSummary(bulan, tahun);
  const { data: rumahList } = useRumahList();
  const createJimpitan = useCreateJimpitan();
  const deleteJimpitan = useDeleteJimpitan();
  const user = useAuthStore((s) => s.user);

  const [drawer, setDrawer] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalJimpitan = jimpitanList?.reduce((sum, j) => sum + j.nominal, 0) ?? 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createJimpitan.mutate({
      rumah_id: fd.get("rumah_id") as string,
      tanggal: fd.get("tanggal") as string,
      nominal: Number(fd.get("nominal")),
      status: "Diambil",
      catatan: (fd.get("catatan") as string) || null,
      dicatat_oleh: user?.id ?? "",
    }, { onSuccess: () => setDrawer(false) });
  };

  return (
    <SectionCard>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12.5px] text-muted-foreground">
          Total: <span className="font-mono font-bold text-foreground">{formatRupiah(totalJimpitan)}</span>
        </div>
        <AddButton label="Catat" onClick={() => setDrawer(true)} />
      </div>

      {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <div className="flex flex-col gap-2">
          {jimpitanList?.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Belum ada data</p>
          )}
          {jimpitanList?.map((j) => (
            <div key={j.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
              <div>
                <div className="text-[13px] font-bold">Rumah {j.rumah_kk?.no_rumah ?? "-"}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(j.nominal)}</span>
                  <span>·</span>
                  <span>{formatTanggalPendek(j.tanggal)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{j.status}</span>
                <button onClick={() => setDeleteId(j.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-transform active:scale-90">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomDrawer open={drawer} onOpenChange={setDrawer} title="Catat Jimpitan">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Rumah *</Label>
            <select name="rumah_id" required className={SELECT_CLASS}>
              <option value="">Pilih rumah...</option>
              {rumahList?.filter((r) => r.is_active).map((r) => <option key={r.id} value={r.id}>Rumah {r.no_rumah}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal *</Label>
            <Input name="tanggal" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Nominal (Rp) *</Label>
            <Input name="nominal" type="number" required defaultValue={RT_CONFIG.nominal_jimpitan_default} min={0} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Catatan</Label>
            <Input name="catatan" className="rounded-[11px]" />
          </div>
          <button type="submit" disabled={createJimpitan.isPending} className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60">
            {createJimpitan.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data jimpitan?</AlertDialogTitle>
            <AlertDialogDescription>Data jimpitan akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteJimpitan.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

function PengeluaranTab({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: list, isLoading } = usePengeluaran(bulan, tahun);
  const createPengeluaran = useCreatePengeluaran();
  const deletePengeluaran = useDeletePengeluaran();
  const user = useAuthStore((s) => s.user);

  const [drawer, setDrawer] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalPengeluaran = list?.reduce((sum, p) => sum + p.nominal, 0) ?? 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createPengeluaran.mutate({
      tanggal: fd.get("tanggal") as string,
      kategori: fd.get("kategori") as KategoriPengeluaran,
      nominal: Number(fd.get("nominal")),
      keterangan: (fd.get("keterangan") as string) || "",
      bukti_url: null,
      dicatat_oleh: user?.id ?? "",
    }, { onSuccess: () => setDrawer(false) });
  };

  return (
    <SectionCard>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12.5px] text-muted-foreground">
          Total: <span className="font-mono font-bold text-destructive">{formatRupiah(totalPengeluaran)}</span>
        </div>
        <AddButton label="Catat" onClick={() => setDrawer(true)} />
      </div>

      {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <div className="flex flex-col gap-2">
          {list?.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Belum ada data</p>
          )}
          {list?.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold">{p.keterangan || p.kategori}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{p.kategori}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-mono font-bold text-destructive">{formatRupiah(p.nominal)}</span>
                  <span>·</span>
                  <span>{formatTanggalPendek(p.tanggal)}</span>
                </div>
              </div>
              <button onClick={() => setDeleteId(p.id)} className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-transform active:scale-90">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomDrawer open={drawer} onOpenChange={setDrawer} title="Catat Pengeluaran">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal *</Label>
            <Input name="tanggal" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Kategori *</Label>
            <select name="kategori" required className={SELECT_CLASS}>
              {KATEGORI_PENGELUARAN.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Nominal (Rp) *</Label>
            <Input name="nominal" type="number" required min={0} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Keterangan</Label>
            <Input name="keterangan" className="rounded-[11px]" />
          </div>
          <button type="submit" disabled={createPengeluaran.isPending} className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60">
            {createPengeluaran.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </BottomDrawer>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>Data pengeluaran akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deletePengeluaran.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
