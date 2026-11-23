import { useMemo, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import { CheckCircle2, Circle, Clock, Pencil, Plus, RotateCw, Trash2, type LucideIcon } from "lucide-react";
import { useArisanRekap, useDeleteArisanPutaran, useSalurkanArisanPutaran, useSimpanArisanPutaran } from "@/features/keuangan/hooks";
import { useRumahList } from "@/features/warga/hooks";
import type { ArisanRekap } from "@/shared/types/database";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";

const BULAN_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const SELECT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";
const TODAY = new Date().toISOString().split("T")[0]!;

type StatusKind = "belum-diundi" | "belum-disalurkan" | "sudah-disalurkan";

function statusOf(row: ArisanRekap): StatusKind {
  if (!row.putaran_id) return "belum-diundi";
  if (!row.pengeluaran_id) return "belum-disalurkan";
  return "sudah-disalurkan";
}

const STATUS_BADGE: Record<StatusKind, { label: string; className: string; Icon: LucideIcon }> = {
  "belum-diundi": { label: "Belum diundi", className: "bg-muted text-muted-foreground", Icon: Circle },
  "belum-disalurkan": { label: "Belum disalurkan", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400", Icon: Clock },
  "sudah-disalurkan": { label: "Sudah disalurkan", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", Icon: CheckCircle2 },
};

export function ArisanPutaranTab({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: rekap, isLoading, isError, refetch } = useArisanRekap(tahun);
  const { data: rumahList } = useRumahList();
  const simpan = useSimpanArisanPutaran();
  const salurkan = useSalurkanArisanPutaran();
  const hapus = useDeleteArisanPutaran();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formBulan, setFormBulan] = useState(bulan);
  const [formTahun, setFormTahun] = useState(tahun);
  const [pemenangId, setPemenangId] = useState("");
  const [nominal, setNominal] = useState("");
  const [tanggalUndi, setTanggalUndi] = useState(TODAY);
  const [salurkanSekarang, setSalurkanSekarang] = useState(true);
  const [tanggalSalur, setTanggalSalur] = useState(TODAY);
  const [catatan, setCatatan] = useState("");

  const [salurTarget, setSalurTarget] = useState<ArisanRekap | null>(null);
  const [salurTanggal, setSalurTanggal] = useState(TODAY);
  const [deleteTarget, setDeleteTarget] = useState<ArisanRekap | null>(null);

  const rows = useMemo(
    () => [...(rekap ?? [])].sort((a, b) => b.bulan - a.bulan),
    [rekap],
  );

  const peserta = useMemo(
    () => rumahList?.filter((r) => r.is_active && r.ikut_arisan) ?? [],
    [rumahList],
  );

  const riwayatMenang = useMemo(() => {
    const map = new Map<string, string[]>();
    rekap?.forEach((r) => {
      if (!r.pemenang_rumah_id) return;
      const list = map.get(r.pemenang_rumah_id) ?? [];
      list.push(`${BULAN_NAMES[r.bulan]?.slice(0, 3)} ${r.tahun}`);
      map.set(r.pemenang_rumah_id, list);
    });
    return map;
  }, [rekap]);

  const totalBelum = (rekap ?? []).reduce(
    (s, r) => s + Math.max(0, r.nominal_terkumpul - (r.nominal_putaran ?? 0)),
    0,
  );
  const totalSudah = (rekap ?? []).reduce(
    (s, r) => s + (r.sudah_disalurkan ? (r.nominal_putaran ?? 0) : 0),
    0,
  );
  const pemenangUnik = new Set(
    (rekap ?? []).map((r) => r.pemenang_rumah_id).filter(Boolean),
  ).size;
  const progress = peserta.length > 0 ? Math.min(100, Math.round((pemenangUnik / peserta.length) * 100)) : 0;

  const potBulanIni = rekap?.find((r) => r.bulan === bulan)?.nominal_terkumpul ?? 0;
  const rowBulanIni = rekap?.find((r) => r.bulan === bulan);
  const perluDiundi = !!rowBulanIni && !rowBulanIni.putaran_id && rowBulanIni.nominal_terkumpul > 0;
  const formPot = rekap?.find((r) => r.bulan === formBulan)?.nominal_terkumpul ?? 0;

  const openCreate = (b: number, t: number, pot: number) => {
    setEditId(null);
    setFormBulan(b);
    setFormTahun(t);
    setPemenangId("");
    setNominal(pot > 0 ? String(pot) : "");
    setTanggalUndi(TODAY);
    setSalurkanSekarang(true);
    setTanggalSalur(TODAY);
    setCatatan("");
    setSheetOpen(true);
  };

  const openEdit = (row: ArisanRekap) => {
    setEditId(row.putaran_id);
    setFormBulan(row.bulan);
    setFormTahun(row.tahun);
    setPemenangId(row.pemenang_rumah_id ?? "");
    setNominal(String(row.nominal_putaran ?? row.nominal_terkumpul));
    setTanggalUndi(row.tanggal_undi ?? TODAY);
    setSalurkanSekarang(false);
    setTanggalSalur(TODAY);
    setCatatan(row.catatan ?? "");
    setSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nilai = Number(nominal);
    if (!pemenangId || !(nilai > 0)) return;
    simpan.mutate(
      {
        bulan: formBulan,
        tahun: formTahun,
        pemenang_rumah_id: pemenangId,
        nominal: nilai,
        tanggal_undi: tanggalUndi || null,
        catatan: catatan || null,
        salurkan: salurkanSekarang,
        tanggal_salur: salurkanSekarang ? tanggalSalur || TODAY : null,
      },
      { onSuccess: () => setSheetOpen(false) },
    );
  };

  const handleSalurkan = () => {
    if (!salurTarget) return;
    salurkan.mutate(
      { id: salurTarget.putaran_id ?? "", tanggal: salurTanggal },
      { onSuccess: () => setSalurTarget(null) },
    );
  };

  const handleHapus = () => {
    if (!deleteTarget) return;
    hapus.mutate(deleteTarget.putaran_id ?? "", {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const pemenangNama = (row: ArisanRekap) =>
    row.pemenang_no_rumah ? `Rumah ${row.pemenang_no_rumah}` : "Belum diundi";

  return (
    <div className="rounded-[18px] border border-border/60 bg-card p-4">
      {isError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">Gagal memuat data arisan.</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-[11px] bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
          >
            <RotateCw className="h-3.5 w-3.5" strokeWidth={2.5} /> Coba lagi
          </button>
        </div>
      ) : (
        <>
          {/* Stat scroll */}
          <div className="-mx-4 mb-3 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2.5">
              <div className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
                <div className="text-[11.5px] font-semibold text-muted-foreground">Pot belum disalurkan</div>
                <div className="mt-0.5 font-mono text-[15px] font-extrabold text-amber-600 dark:text-amber-400">
                  {isLoading ? <Skeleton className="h-5 w-20" /> : formatRupiah(totalBelum)}
                </div>
              </div>
              <div className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
                <div className="text-[11.5px] font-semibold text-muted-foreground">Sudah disalurkan</div>
                <div className="mt-0.5 font-mono text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  {isLoading ? <Skeleton className="h-5 w-20" /> : formatRupiah(totalSudah)}
                </div>
              </div>
              <div className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
                <div className="text-[11.5px] font-semibold text-muted-foreground">Giliran {tahun}</div>
                <div className="mt-0.5 font-mono text-[15px] font-extrabold">
                  {isLoading ? <Skeleton className="h-5 w-16" /> : `${pemenangUnik}/${peserta.length}`}
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Banner pot belum diundi */}
          {perluDiundi && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-amber-700 dark:text-amber-300">
                  Pot {BULAN_NAMES[bulan]} {formatRupiah(potBulanIni)} belum diundi
                </div>
                <div className="text-[11px] text-muted-foreground">Tetapkan pemenang bulan ini.</div>
              </div>
              <button
                onClick={() => openCreate(bulan, tahun, potBulanIni)}
                className="shrink-0 rounded-[10px] bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-amber-950 transition-transform active:scale-95"
              >
                Catat
              </button>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12.5px] text-muted-foreground">
              Putaran <span className="font-bold text-foreground">{tahun}</span>
            </div>
            <button
              onClick={() => openCreate(bulan, tahun, potBulanIni)}
              disabled={potBulanIni <= 0}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96] disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Catat putaran
            </button>
          </div>
          {potBulanIni <= 0 && (
            <p className="mb-3 text-[11px] text-muted-foreground">
              Catat setoran Arisan bulan ini dulu sebelum menetapkan pemenang.
            </p>
          )}

          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Belum ada putaran. Mulai dari pot bulan ini.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((row) => {
                const kind = statusOf(row);
                const badge = STATUS_BADGE[kind];
                const sisa = row.nominal_terkumpul - (row.nominal_putaran ?? 0);
                return (
                  <div key={`${row.tahun}-${row.bulan}`} className="rounded-xl border border-border/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold">{BULAN_NAMES[row.bulan]} {row.tahun}</span>
                      <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}>
                        <badge.Icon className="h-3 w-3" strokeWidth={2.5} />
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] text-muted-foreground">
                      Pemenang: <span className="font-bold text-foreground">{pemenangNama(row)}</span>
                      {row.tanggal_undi && <> · undi {formatTanggalPendek(row.tanggal_undi)}</>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400">Terkumpul {formatRupiah(row.nominal_terkumpul)}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">Tersalurkan {formatRupiah(row.nominal_putaran ?? 0)}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className={sisa > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>Sisa {formatRupiah(sisa)}</span>
                    </div>
                    {kind !== "sudah-disalurkan" && (
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => openEdit(row)}
                          className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[10.5px] font-bold text-muted-foreground transition-transform active:scale-95"
                        >
                          <Pencil className="h-3 w-3" /> {kind === "belum-diundi" ? "Catat" : "Ubah"}
                        </button>
                        {kind === "belum-disalurkan" && (
                          <button
                            onClick={() => { setSalurTarget(row); setSalurTanggal(TODAY); }}
                            className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10.5px] font-bold text-emerald-600 transition-transform active:scale-95 dark:text-emerald-400"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Salurkan
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(row)}
                          className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-[10.5px] font-bold text-destructive transition-transform active:scale-95"
                        >
                          <Trash2 className="h-3 w-3" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Dana arisan bergulir: terkumpul lalu langsung disalurkan ke pemenang.
          </p>
        </>
      )}

      {/* Sheet catat/ubah putaran */}
      <BottomDrawer open={sheetOpen} onOpenChange={setSheetOpen} title={editId ? "Ubah Putaran" : "Catat Putaran"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Bulan *</Label>
              <select value={formBulan} onChange={(e) => setFormBulan(Number(e.target.value))} disabled={!!editId} className={SELECT_CLASS}>
                {BULAN_NAMES.slice(1).map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-bold">Tahun *</Label>
              <Input type="number" value={formTahun} onChange={(e) => setFormTahun(Number(e.target.value))} disabled={!!editId} min={2020} max={2030} className="rounded-[11px]" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Pemenang *</Label>
            <select required value={pemenangId} onChange={(e) => setPemenangId(e.target.value)} className={SELECT_CLASS}>
              <option value="">Pilih rumah peserta...</option>
              {peserta.map((r) => {
                const riwayat = riwayatMenang.get(r.id);
                return (
                  <option key={r.id} value={r.id}>
                    Rumah {r.no_rumah}{riwayat ? ` · pernah menang ${riwayat.join(", ")}` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Nominal pot (Rp) *</Label>
            <Input type="number" required min={1} value={nominal} onChange={(e) => setNominal(e.target.value)} className="rounded-[11px]" />
            <p className="text-[11px] text-muted-foreground">
              Pot = setoran arisan yang sudah masuk. {BULAN_NAMES[formBulan]} {formTahun}: {formatRupiah(formPot)}.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Tanggal undi</Label>
            <Input type="date" value={tanggalUndi} onChange={(e) => setTanggalUndi(e.target.value)} className="rounded-[11px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Catatan</Label>
            <Input value={catatan} onChange={(e) => setCatatan(e.target.value)} className="rounded-[11px]" />
          </div>
          <label className="flex items-center gap-2.5 rounded-[11px] border border-border/60 px-3 py-2.5">
            <input
              type="checkbox"
              checked={salurkanSekarang}
              onChange={(e) => setSalurkanSekarang(e.target.checked)}
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
              <Input type="date" value={tanggalSalur} onChange={(e) => setTanggalSalur(e.target.value)} className="rounded-[11px]" />
            </div>
          )}
          <button
            type="submit"
            disabled={simpan.isPending || !pemenangId || !(Number(nominal) > 0)}
            className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {simpan.isPending ? "Menyimpan..." : "Simpan putaran"}
          </button>
        </form>
      </BottomDrawer>

      {/* Dialog salurkan */}
      <AlertDialog open={!!salurTarget} onOpenChange={(open) => !open && setSalurTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salurkan pot arisan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengeluaran dana Arisan akan dibuat sebesar pot putaran ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5 py-2">
            <Label className="text-[12.5px] font-bold">Tanggal salur</Label>
            <Input type="date" value={salurTanggal} onChange={(e) => setSalurTanggal(e.target.value)} className="rounded-[11px]" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSalurkan} disabled={salurkan.isPending} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Salurkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog hapus */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus putaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Hanya putaran yang belum disalurkan yang bisa dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleHapus} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
