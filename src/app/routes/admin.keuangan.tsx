import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2, Wallet, Printer } from "lucide-react";
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
const SELECT_CLASS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const now = new Date();

export default function AdminKeuangan() {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keuangan"
        description="Kelola kas bulanan, jimpitan, dan pengeluaran"
        actions={
          <Button variant="outline" onClick={handleCetakLaporan} disabled={!saldo}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak Laporan
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SaldoCard title="Saldo Kas Bapak" value={saldo?.kas_bapak_masuk} loading={saldoLoading} />
        <SaldoCard title="Saldo Kas Ibu" value={saldo?.kas_ibu_masuk} loading={saldoLoading} />
        <SaldoCard title="Total Jimpitan" value={saldo?.jimpitan_masuk} loading={saldoLoading} />
      </div>

      <div className="flex gap-2 items-center">
        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className={SELECT_CLASS + " w-40"}>
          {BULAN_NAMES.slice(1).map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
        </select>
        <Input type="number" value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="w-24" min={2020} max={2030} />
      </div>

      <Tabs defaultValue="kas-bapak">
        <TabsList>
          <TabsTrigger value="kas-bapak"><Wallet className="mr-2 h-4 w-4" />Kas Bapak</TabsTrigger>
          <TabsTrigger value="kas-ibu"><Wallet className="mr-2 h-4 w-4" />Kas Ibu</TabsTrigger>
          <TabsTrigger value="jimpitan">Jimpitan</TabsTrigger>
          <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
        </TabsList>

        <TabsContent value="kas-bapak">
          <KasTab tipe="Bapak" bulan={bulan} tahun={tahun} nominal={RT_CONFIG.nominal_kas_bulanan_bapak} />
        </TabsContent>
        <TabsContent value="kas-ibu">
          <KasTab tipe="Ibu" bulan={bulan} tahun={tahun} nominal={RT_CONFIG.nominal_kas_bulanan_ibu} />
        </TabsContent>
        <TabsContent value="jimpitan">
          <JimpitanTab bulan={bulan} tahun={tahun} />
        </TabsContent>
        <TabsContent value="pengeluaran">
          <PengeluaranTab bulan={bulan} tahun={tahun} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SaldoCard({ title, value, loading }: { title: string; value?: number; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono text-emerald-600">
          {loading ? <Skeleton className="h-8 w-32" /> : formatRupiah(value ?? 0)}
        </div>
      </CardContent>
    </Card>
  );
}

function KasTab({ tipe, bulan, tahun, nominal }: { tipe: TipeKas; bulan: number; tahun: number; nominal: number }) {
  const { data: kasList, isLoading } = useKasByMonth(tipe, bulan, tahun);
  const { data: rumahList } = useRumahList();
  const createKas = useCreateKas();
  const deleteKas = useDeleteKas();
  const user = useAuthStore((s) => s.user);

  const [dialog, setDialog] = useState(false);
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
    }, { onSuccess: () => setDialog(false) });
  };

  const paidRumahIds = new Set(kasList?.map((k) => k.rumah_id));
  const unpaidRumah = rumahList?.filter((r) => r.is_active && r.status_hunian !== "Kosong" && !paidRumahIds.has(r.id));

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {BULAN_NAMES[bulan]} {tahun} — {formatRupiah(nominal)}/rumah
          </p>
          <Button size="sm" onClick={() => setDialog(true)}><Plus className="mr-2 h-4 w-4" />Catat Pembayaran</Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Rumah</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Tanggal Bayar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kasList?.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.rumah_kk?.no_rumah ?? "-"}</TableCell>
                  <TableCell className="font-mono">{formatRupiah(k.jumlah)}</TableCell>
                  <TableCell>{k.tanggal_bayar ? formatTanggalPendek(k.tanggal_bayar) : "-"}</TableCell>
                  <TableCell><Badge variant="default">{k.status_bayar ? "Lunas" : "Belum"}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(k.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {unpaidRumah?.map((r) => (
                <TableRow key={r.id} className="text-muted-foreground">
                  <TableCell>{r.no_rumah}</TableCell>
                  <TableCell className="font-mono">{formatRupiah(nominal)}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell><Badge variant="outline">Belum Bayar</Badge></TableCell>
                  <TableCell />
                </TableRow>
              ))}
              {kasList?.length === 0 && unpaidRumah?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Catat Pembayaran Kas {tipe}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Rumah *</Label>
                <select name="rumah_id" required className={SELECT_CLASS}>
                  <option value="">Pilih rumah...</option>
                  {unpaidRumah?.map((r) => <option key={r.id} value={r.id}>Rumah {r.no_rumah}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Bayar *</Label>
                <Input name="tanggal_bayar" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Metode Bayar</Label>
                <Input name="metode_bayar" placeholder="Tunai / Transfer" />
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input name="keterangan" />
              </div>
              <Button type="submit" className="w-full" disabled={createKas.isPending}>
                {createKas.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

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
      </CardContent>
    </Card>
  );
}

function JimpitanTab({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: jimpitanList, isLoading } = useJimpitanSummary(bulan, tahun);
  const { data: rumahList } = useRumahList();
  const createJimpitan = useCreateJimpitan();
  const deleteJimpitan = useDeleteJimpitan();
  const user = useAuthStore((s) => s.user);

  const [dialog, setDialog] = useState(false);
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
    }, { onSuccess: () => setDialog(false) });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Total {BULAN_NAMES[bulan]} {tahun}: <strong className="text-foreground">{formatRupiah(totalJimpitan)}</strong>
          </p>
          <Button size="sm" onClick={() => setDialog(true)}><Plus className="mr-2 h-4 w-4" />Catat Jimpitan</Button>
        </div>

        {isLoading ? <Skeleton className="h-48 w-full" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Rumah</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jimpitanList?.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
              )}
              {jimpitanList?.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{formatTanggalPendek(j.tanggal)}</TableCell>
                  <TableCell className="font-medium">{j.rumah_kk?.no_rumah ?? "-"}</TableCell>
                  <TableCell className="font-mono">{formatRupiah(j.nominal)}</TableCell>
                  <TableCell><Badge variant="default">{j.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(j.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Catat Jimpitan</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Rumah *</Label>
                <select name="rumah_id" required className={SELECT_CLASS}>
                  <option value="">Pilih rumah...</option>
                  {rumahList?.filter((r) => r.is_active).map((r) => <option key={r.id} value={r.id}>Rumah {r.no_rumah}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal *</Label>
                <Input name="tanggal" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Nominal (Rp) *</Label>
                <Input name="nominal" type="number" required defaultValue={RT_CONFIG.nominal_jimpitan_default} min={0} />
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Input name="catatan" />
              </div>
              <Button type="submit" className="w-full" disabled={createJimpitan.isPending}>
                {createJimpitan.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

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
      </CardContent>
    </Card>
  );
}

function PengeluaranTab({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: list, isLoading } = usePengeluaran(bulan, tahun);
  const createPengeluaran = useCreatePengeluaran();
  const deletePengeluaran = useDeletePengeluaran();
  const user = useAuthStore((s) => s.user);

  const [dialog, setDialog] = useState(false);
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
    }, { onSuccess: () => setDialog(false) });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Total {BULAN_NAMES[bulan]} {tahun}: <strong className="text-foreground">{formatRupiah(totalPengeluaran)}</strong>
          </p>
          <Button size="sm" onClick={() => setDialog(true)}><Plus className="mr-2 h-4 w-4" />Catat Pengeluaran</Button>
        </div>

        {isLoading ? <Skeleton className="h-48 w-full" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="w-16">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list?.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
              )}
              {list?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatTanggalPendek(p.tanggal)}</TableCell>
                  <TableCell><Badge variant="secondary">{p.kategori}</Badge></TableCell>
                  <TableCell className="font-mono text-destructive">{formatRupiah(p.nominal)}</TableCell>
                  <TableCell className="max-w-xs truncate">{p.keterangan ?? "-"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Catat Pengeluaran</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tanggal *</Label>
                <Input name="tanggal" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <select name="kategori" required className={SELECT_CLASS}>
                  {KATEGORI_PENGELUARAN.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nominal (Rp) *</Label>
                <Input name="nominal" type="number" required min={0} />
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input name="keterangan" />
              </div>
              <Button type="submit" className="w-full" disabled={createPengeluaran.isPending}>
                {createPengeluaran.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

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
      </CardContent>
    </Card>
  );
}
