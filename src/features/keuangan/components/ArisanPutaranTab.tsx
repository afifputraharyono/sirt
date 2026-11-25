import { useMemo, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import {
  CheckCircle2, Circle, Clock, Lock, Pencil, Plus, RotateCw, Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  useArisanAnggota, useArisanRekap, useArisanRondeList,
  useDeleteArisanPutaran, useMulaiArisanRonde, useSalurkanArisanPutaran,
  useSimpanArisanPutaran, useTutupArisanRonde,
} from "@/features/keuangan/hooks";
import { useRumahList } from "@/features/warga/hooks";
import type { SimpanArisanPutaranInput } from "@/features/keuangan/services";
import type { ArisanRekap } from "@/shared/types/database";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";

const BULAN_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const SELECT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";
const TODAY = new Date().toISOString().split("T")[0] ?? "";

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

interface PeriodeRonde {
  urutan: number;
  tahun: number;
  bulan: number;
  key: string;
  rekap: ArisanRekap | null;
}

function kunciPeriode(tahun: number, bulan: number) {
  return `${tahun}-${String(bulan).padStart(2, "0")}`;
}

function labelPeriode(tahun: number, bulan: number) {
  return `${BULAN_NAMES[bulan] ?? ""} ${tahun}`;
}

function indeksPeriode(tahun: number, bulan: number) {
  return tahun * 12 + (bulan - 1);
}

function parsePeriodeKey(key: string) {
  const [tahun = 0, bulan = 1] = key.split("-").map(Number);
  return { tahun, bulan };
}

function buatPeriode(
  tanggalMulai: string,
  jumlahAnggota: number,
  rekapByPeriode: Map<string, ArisanRekap>,
): PeriodeRonde[] {
  if (jumlahAnggota <= 0) return [];
  const { tahun, bulan } = parsePeriodeKey(tanggalMulai.slice(0, 7));
  const awal = indeksPeriode(tahun, bulan);
  return Array.from({ length: jumlahAnggota }, (_, i) => {
    const indeks = awal + i;
    const tahunPeriode = Math.floor(indeks / 12);
    const bulanPeriode = (indeks % 12) + 1;
    const key = kunciPeriode(tahunPeriode, bulanPeriode);
    return {
      urutan: i + 1,
      tahun: tahunPeriode,
      bulan: bulanPeriode,
      key,
      rekap: rekapByPeriode.get(key) ?? null,
    };
  });
}

export function ArisanPutaranTab({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data: rekap, isLoading: rekapLoading, isError, refetch } = useArisanRekap();
  const { data: rondeList, isLoading: rondeLoading } = useArisanRondeList();
  const { data: rumahList } = useRumahList();
  const simpan = useSimpanArisanPutaran();
  const salurkan = useSalurkanArisanPutaran();
  const hapus = useDeleteArisanPutaran();
  const mulai = useMulaiArisanRonde();
  const tutup = useTutupArisanRonde();

  const rounds = useMemo(() => rondeList ?? [], [rondeList]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const activeRonde = useMemo(
    () => rounds.find((r) => !r.tanggal_selesai) ?? null,
    [rounds],
  );
  const selected = useMemo(
    () => rounds.find((r) => r.id === pickedId) ?? activeRonde ?? rounds[0] ?? null,
    [rounds, pickedId, activeRonde],
  );

  const { data: anggotaData, isLoading: anggotaLoading } = useArisanAnggota(selected?.id ?? null);
  const anggota = useMemo(
    () =>
      [...(anggotaData ?? [])].sort((a, b) =>
        (a.rumah_kk?.no_rumah ?? "").localeCompare(
          b.rumah_kk?.no_rumah ?? "",
          undefined,
          { numeric: true },
        ),
      ),
    [anggotaData],
  );
  const jumlahAnggota = anggotaData
    ? anggota.length
    : (selected?.arisan_anggota.length ?? 0);

  const rekapByPeriode = useMemo(() => {
    const map = new Map<string, ArisanRekap>();
    for (const row of rekap ?? []) map.set(kunciPeriode(row.tahun, row.bulan), row);
    return map;
  }, [rekap]);

  const rekapRonde = useMemo(
    () => (rekap ?? []).filter((r) => selected && r.ronde_id === selected.id),
    [rekap, selected],
  );

  const menangPerRonde = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rekap ?? []) {
      if (!row.ronde_id || !row.pemenang_rumah_id) continue;
      map.set(row.ronde_id, (map.get(row.ronde_id) ?? 0) + 1);
    }
    return map;
  }, [rekap]);

  const periodeRonde = useMemo(
    () =>
      selected
        ? buatPeriode(selected.tanggal_mulai, jumlahAnggota, rekapByPeriode)
        : [],
    [selected, jumlahAnggota, rekapByPeriode],
  );

  const pemenangRonde = useMemo(
    () =>
      new Set(
        rekapRonde
          .map((r) => r.pemenang_rumah_id)
          .filter((id): id is string => !!id),
      ),
    [rekapRonde],
  );

  const menangCount = pemenangRonde.size;
  const semuaDisalurkan = rekapRonde.every((r) => r.sudah_disalurkan);
  const bisaDitutup =
    !!selected &&
    !selected.tanggal_selesai &&
    jumlahAnggota > 0 &&
    menangCount === jumlahAnggota &&
    semuaDisalurkan;
  const alasanTutup =
    !selected || selected.tanggal_selesai
      ? null
      : jumlahAnggota === 0
        ? "Ronde belum punya anggota."
        : menangCount < jumlahAnggota
          ? `${jumlahAnggota - menangCount} anggota belum menang.`
          : !semuaDisalurkan
            ? "Masih ada pot yang belum disalurkan."
            : null;
  const progress =
    jumlahAnggota > 0
      ? Math.min(100, Math.round((menangCount / jumlahAnggota) * 100))
      : 0;

  const totalTerkumpul = periodeRonde.reduce(
    (s, p) => s + (p.rekap?.nominal_terkumpul ?? 0),
    0,
  );
  const totalTersalur = rekapRonde.reduce(
    (s, r) => s + (r.sudah_disalurkan ? (r.nominal_putaran ?? 0) : 0),
    0,
  );

  const lintasTahun = useMemo(
    () =>
      (rekap ?? []).filter(
        (r) =>
          r.tahun < tahun &&
          !r.sudah_disalurkan &&
          (r.putaran_id || r.nominal_terkumpul > 0),
      ),
    [rekap, tahun],
  );
  const totalLintasTahun = lintasTahun.reduce(
    (s, r) => s + (r.putaran_id ? (r.nominal_putaran ?? 0) : r.nominal_terkumpul),
    0,
  );
  const rondeLintasTahun =
    lintasTahun.find((r) => r.ronde_id)?.ronde_id ?? null;

  const keyBulanIni = kunciPeriode(tahun, bulan);
  const rekapBulanIni = rekapByPeriode.get(keyBulanIni);
  const periodeAktif = activeRonde
    ? buatPeriode(
        activeRonde.tanggal_mulai,
        activeRonde.arisan_anggota.length,
        rekapByPeriode,
      )
    : [];
  const potBulanIni = rekapBulanIni?.nominal_terkumpul ?? 0;
  const perluDiundi =
    !!activeRonde &&
    !!rekapBulanIni &&
    !rekapBulanIni.putaran_id &&
    potBulanIni > 0 &&
    periodeAktif.some((p) => p.key === keyBulanIni);

  const baris = useMemo(
    () =>
      periodeRonde
        .filter((p) => p.rekap && (p.rekap.putaran_id || p.rekap.nominal_terkumpul > 0))
        .sort((a, b) => b.urutan - a.urutan),
    [periodeRonde],
  );
  const periodeBerikut =
    periodeRonde.find((p) => !p.rekap?.putaran_id) ?? null;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pemenangAwal, setPemenangAwal] = useState<string | null>(null);
  const [formPeriode, setFormPeriode] = useState("");
  const [pemenangId, setPemenangId] = useState("");
  const [nominal, setNominal] = useState("");
  const [tanggalUndi, setTanggalUndi] = useState(TODAY);
  const [salurkanSekarang, setSalurkanSekarang] = useState(true);
  const [tanggalSalur, setTanggalSalur] = useState(TODAY);
  const [catatan, setCatatan] = useState("");
  const [talangan, setTalangan] = useState<SimpanArisanPutaranInput | null>(null);

  const [salurTarget, setSalurTarget] = useState<ArisanRekap | null>(null);
  const [salurTanggal, setSalurTanggal] = useState(TODAY);
  const [deleteTarget, setDeleteTarget] = useState<ArisanRekap | null>(null);

  const [tutupOpen, setTutupOpen] = useState(false);
  const [tutupTanggal, setTutupTanggal] = useState(TODAY);

  const [mulaiOpen, setMulaiOpen] = useState(false);
  const [mulaiBulan, setMulaiBulan] = useState("");
  const [mulaiAnggota, setMulaiAnggota] = useState<Set<string>>(new Set());
  const [mulaiCatatan, setMulaiCatatan] = useState("");

  const kandidat = useMemo(
    () =>
      anggota.filter(
        (a) =>
          a.rumah_kk?.is_active &&
          a.rumah_kk.status_hunian !== "Kosong" &&
          (!pemenangRonde.has(a.rumah_id) || a.rumah_id === pemenangAwal),
      ),
    [anggota, pemenangRonde, pemenangAwal],
  );

  const opsiPeriode = editId
    ? periodeRonde.filter((p) => p.key === formPeriode)
    : periodeRonde.filter((p) => !p.rekap?.putaran_id);

  const formPot = rekapByPeriode.get(formPeriode)?.nominal_terkumpul ?? 0;
  const nilaiNominal = Number(nominal);
  const selisihTalangan =
    nilaiNominal > formPot ? nilaiNominal - formPot : 0;

  const rumahOptions = useMemo(
    () => (rumahList ?? []).filter((r) => r.status_hunian !== "Kosong"),
    [rumahList],
  );

  const openCreate = (tahunTarget: number, bulanTarget: number) => {
    const key = kunciPeriode(tahunTarget, bulanTarget);
    const pot = rekapByPeriode.get(key)?.nominal_terkumpul ?? 0;
    setEditId(null);
    setPemenangAwal(null);
    setFormPeriode(key);
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
    setPemenangAwal(row.pemenang_rumah_id);
    setFormPeriode(kunciPeriode(row.tahun, row.bulan));
    setPemenangId(row.pemenang_rumah_id ?? "");
    setNominal(String(row.nominal_putaran ?? row.nominal_terkumpul));
    setTanggalUndi(row.tanggal_undi ?? TODAY);
    setSalurkanSekarang(false);
    setTanggalSalur(TODAY);
    setCatatan(row.catatan ?? "");
    setSheetOpen(true);
  };

  const openMulai = () => {
    let bulanAwal = new Date().toISOString().slice(0, 7);
    const latest = rounds[0];
    if (latest) {
      const acuan = latest.tanggal_selesai ?? latest.tanggal_mulai;
      const { tahun: tahunAcuan, bulan: bulanAcuan } = parsePeriodeKey(acuan.slice(0, 7));
      const indeks = indeksPeriode(tahunAcuan, bulanAcuan) + 1;
      bulanAwal = `${Math.floor(indeks / 12)}-${String((indeks % 12) + 1).padStart(2, "0")}`;
    }
    const validIds = new Set(rumahOptions.map((r) => r.id));
    const dariFlag = new Set(
      (rumahList ?? [])
        .filter((r) => r.ikut_arisan && validIds.has(r.id))
        .map((r) => r.id),
    );
    const dariRonde = (latest?.arisan_anggota ?? [])
      .map((a) => a.rumah_id)
      .filter((id) => validIds.has(id));
    setMulaiBulan(bulanAwal);
    setMulaiAnggota(dariFlag.size > 0 ? dariFlag : new Set(dariRonde));
    setMulaiCatatan("");
    setMulaiOpen(true);
  };

  const toggleMulaiAnggota = (id: string) => {
    setMulaiAnggota((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pilihSemuaAnggota = () => {
    setMulaiAnggota(new Set(rumahOptions.map((r) => r.id)));
  };

  const buildPayload = (): SimpanArisanPutaranInput | null => {
    const { tahun: tahunPutaran, bulan: bulanPutaran } = parsePeriodeKey(formPeriode);
    if (!pemenangId || !formPeriode || !(nilaiNominal > 0)) return null;
    return {
      bulan: bulanPutaran,
      tahun: tahunPutaran,
      pemenang_rumah_id: pemenangId,
      nominal: nilaiNominal,
      tanggal_undi: tanggalUndi || null,
      catatan: catatan || null,
      salurkan: salurkanSekarang,
      tanggal_salur: salurkanSekarang ? tanggalSalur || TODAY : null,
    };
  };

  const kirimPutaran = (payload: SimpanArisanPutaranInput) => {
    simpan.mutate(payload, { onSuccess: () => setSheetOpen(false) });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    if (payload.nominal > formPot) {
      setTalangan(payload);
      return;
    }
    kirimPutaran(payload);
  };

  const handleTalangan = () => {
    if (!talangan) return;
    simpan.mutate(talangan, {
      onSuccess: () => {
        setTalangan(null);
        setSheetOpen(false);
      },
    });
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

  const handleTutup = () => {
    if (!selected) return;
    tutup.mutate(
      { rondeId: selected.id, tanggal: tutupTanggal || TODAY },
      { onSuccess: () => setTutupOpen(false) },
    );
  };

  const handleMulai = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mulaiBulan || mulaiAnggota.size === 0) return;
    mulai.mutate(
      {
        tanggal_mulai: `${mulaiBulan}-01`,
        anggota: [...mulaiAnggota],
        catatan: mulaiCatatan || null,
      },
      {
        onSuccess: (ronde) => {
          setPickedId(ronde.id);
          setMulaiOpen(false);
        },
      },
    );
  };

  const pemenangNama = (row: ArisanRekap) =>
    row.pemenang_no_rumah ? `Rumah ${row.pemenang_no_rumah}` : "Belum diundi";

  const loadingAwal = (rondeLoading || rekapLoading) && rounds.length === 0;

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
      ) : loadingAwal ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : rounds.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-[13px] text-muted-foreground">
            Belum ada ronde arisan. Tentukan anggota untuk membuka ronde pertama.
          </p>
          <button
            onClick={openMulai}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> Mulai ronde
          </button>
        </div>
      ) : (
        <>
          {/* Pemilih ronde */}
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <div className="text-[12.5px] font-bold">Ronde arisan</div>
              <div className="text-[11px] text-muted-foreground">
                {rounds.length} ronde tercatat
              </div>
            </div>
            {!activeRonde && (
              <button
                onClick={openMulai}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[12px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> Mulai ronde
              </button>
            )}
          </div>
          <div className="-mx-4 mb-3 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-1.5">
              {rounds.map((ronde) => {
                const dipilih = selected?.id === ronde.id;
                const jumlah = ronde.arisan_anggota.length;
                const menang = menangPerRonde.get(ronde.id) ?? 0;
                return (
                  <button
                    key={ronde.id}
                    onClick={() => setPickedId(ronde.id)}
                    className={`shrink-0 rounded-[11px] border px-3 py-2 text-left transition-colors ${
                      dipilih
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-card"
                    }`}
                  >
                    <div className="text-[12px] font-bold">Ronde {ronde.nomor}</div>
                    <div className="text-[10.5px] text-muted-foreground">
                      {ronde.tanggal_selesai ? "ditutup" : "berjalan"} · {menang}/{jumlah}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (
            <>
              {/* Progress ronde */}
              <div className="rounded-[14px] border border-border/60 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold">
                      Ronde {selected.nomor}
                      {!selected.tanggal_selesai && (
                        <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          berjalan
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Mulai {formatTanggalPendek(selected.tanggal_mulai)}
                      {selected.tanggal_selesai
                        ? ` · ditutup ${formatTanggalPendek(selected.tanggal_selesai)}`
                        : ""}
                    </div>
                  </div>
                  {!selected.tanggal_selesai && (
                    <button
                      onClick={() => {
                        setTutupTanggal(TODAY);
                        setTutupOpen(true);
                      }}
                      disabled={!bisaDitutup}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/60 px-2.5 py-2 text-[11.5px] font-bold transition-transform active:scale-[0.96] disabled:opacity-40"
                    >
                      <Lock className="h-3.5 w-3.5" strokeWidth={2.4} /> Tutup ronde
                    </button>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11.5px]">
                  <span className="text-muted-foreground">Anggota sudah menang</span>
                  <span className="font-bold">
                    {menangCount}/{jumlahAnggota}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  {selected.tanggal_selesai
                    ? "Ronde selesai; riwayat putaran tidak bisa diubah."
                    : (alasanTutup ??
                      "Semua anggota sudah menang dan pot tersalurkan. Ronde siap ditutup.")}
                </div>
              </div>

              {/* Statistik ronde */}
              <div className="-mx-4 mt-3 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-2.5">
                  <div className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
                    <div className="text-[11.5px] font-semibold text-muted-foreground">Pot terkumpul</div>
                    <div className="mt-0.5 font-mono text-[15px] font-extrabold">
                      {formatRupiah(totalTerkumpul)}
                    </div>
                  </div>
                  <div className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
                    <div className="text-[11.5px] font-semibold text-muted-foreground">Sudah disalurkan</div>
                    <div className="mt-0.5 font-mono text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(totalTersalur)}
                    </div>
                  </div>
                  <div className="w-35 shrink-0 rounded-[14px] border border-border/60 bg-card p-3">
                    <div className="text-[11.5px] font-semibold text-muted-foreground">Sisa pot</div>
                    <div
                      className={`mt-0.5 font-mono text-[15px] font-extrabold ${
                        totalTerkumpul - totalTersalur > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatRupiah(totalTerkumpul - totalTersalur)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner pot lintas tahun */}
              {lintasTahun.length > 0 && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-bold text-amber-700 dark:text-amber-300">
                      {formatRupiah(totalLintasTahun)} pot tahun lalu belum disalurkan
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {lintasTahun.length} periode ·{" "}
                      {[...new Set(lintasTahun.map((r) => r.tahun))].join(", ")}
                    </div>
                  </div>
                  {rondeLintasTahun && (
                    <button
                      onClick={() => setPickedId(rondeLintasTahun)}
                      className="shrink-0 rounded-[10px] bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-amber-950 transition-transform active:scale-95"
                    >
                      Buka
                    </button>
                  )}
                </div>
              )}

              {/* Banner pot bulan ini */}
              {perluDiundi && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-bold text-amber-700 dark:text-amber-300">
                      Pot {BULAN_NAMES[bulan] ?? ""} {formatRupiah(potBulanIni)} belum diundi
                    </div>
                    <div className="text-[11px] text-muted-foreground">Tetapkan pemenang bulan ini.</div>
                  </div>
                  <button
                    onClick={() => {
                      if (activeRonde) setPickedId(activeRonde.id);
                      openCreate(tahun, bulan);
                    }}
                    className="shrink-0 rounded-[10px] bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-amber-950 transition-transform active:scale-95"
                  >
                    Catat
                  </button>
                </div>
              )}

              <div className="mb-3 mt-4 flex items-center justify-between gap-2">
                <div className="text-[12.5px] text-muted-foreground">Riwayat putaran</div>
                {!selected.tanggal_selesai && (
                  <button
                    onClick={() =>
                      periodeBerikut &&
                      openCreate(periodeBerikut.tahun, periodeBerikut.bulan)
                    }
                    disabled={!periodeBerikut || kandidat.length === 0 || anggotaLoading}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96] disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Catat putaran
                  </button>
                )}
              </div>

              {!selected.tanggal_selesai && anggotaLoading && (
                <p className="mb-3 text-[11px] text-muted-foreground">Memuat anggota ronde...</p>
              )}
              {!selected.tanggal_selesai &&
                !anggotaLoading &&
                kandidat.length === 0 &&
                menangCount < jumlahAnggota && (
                  <p className="mb-3 text-[11px] text-amber-600 dark:text-amber-400">
                    Anggota yang belum menang sudah nonaktif atau Kosong. Periksa data hunian.
                  </p>
                )}

              {baris.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted-foreground">
                  Belum ada setoran arisan pada ronde ini.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {baris.map((periode) => {
                    const row = periode.rekap;
                    if (!row) return null;
                    const kind = statusOf(row);
                    const badge = STATUS_BADGE[kind];
                    const sisa = row.nominal_terkumpul - (row.nominal_putaran ?? 0);
                    const bisaDiubah =
                      !selected.tanggal_selesai && kind !== "sudah-disalurkan";
                    return (
                      <div
                        key={periode.key}
                        className="rounded-xl border border-border/60 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold">
                            {labelPeriode(periode.tahun, periode.bulan)}
                          </span>
                          <span
                            className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                          >
                            <badge.Icon className="h-3 w-3" strokeWidth={2.5} />
                            {badge.label}
                          </span>
                        </div>
                        <div className="mt-1 text-[12px] text-muted-foreground">
                          Pemenang:{" "}
                          <span className="font-bold text-foreground">
                            {pemenangNama(row)}
                          </span>
                          {row.tanggal_undi && (
                            <> · undi {formatTanggalPendek(row.tanggal_undi)}</>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px]">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Terkumpul {formatRupiah(row.nominal_terkumpul)}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">
                            Tersalurkan {formatRupiah(row.nominal_putaran ?? 0)}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span
                            className={
                              sisa > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                            }
                          >
                            Sisa {formatRupiah(sisa)}
                          </span>
                        </div>
                        {bisaDiubah && (
                          <div className="mt-2 flex gap-1.5">
                            {row.putaran_id ? (
                              <button
                                onClick={() => openEdit(row)}
                                className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[10.5px] font-bold text-muted-foreground transition-transform active:scale-95"
                              >
                                <Pencil className="h-3 w-3" /> Ubah
                              </button>
                            ) : (
                              <button
                                onClick={() => openCreate(row.tahun, row.bulan)}
                                className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-[10.5px] font-bold text-primary transition-transform active:scale-95"
                              >
                                <Plus className="h-3 w-3" /> Catat
                              </button>
                            )}
                            {kind === "belum-disalurkan" && (
                              <button
                                onClick={() => {
                                  setSalurTarget(row);
                                  setSalurTanggal(TODAY);
                                }}
                                className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10.5px] font-bold text-emerald-600 transition-transform active:scale-95 dark:text-emerald-400"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Salurkan
                              </button>
                            )}
                            {row.putaran_id && (
                              <button
                                onClick={() => setDeleteTarget(row)}
                                className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-[10.5px] font-bold text-destructive transition-transform active:scale-95"
                              >
                                <Trash2 className="h-3 w-3" /> Hapus
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Dana arisan bergulir: terkumpul lalu disalurkan ke pemenang. Durasi ronde =
                jumlah anggota, satu pemenang per bulan.
              </p>
            </>
          )}
        </>
      )}

      {/* Sheet catat/ubah putaran */}
      <BottomDrawer
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editId ? "Ubah Putaran" : "Catat Putaran"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Periode putaran *</Label>
            <select
              required
              value={formPeriode}
              onChange={(e) => setFormPeriode(e.target.value)}
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
              onChange={(e) => setPemenangId(e.target.value)}
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
              onChange={(e) => setNominal(e.target.value)}
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
              onChange={(e) => setTanggalUndi(e.target.value)}
              className="rounded-[11px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Catatan</Label>
            <Input
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="rounded-[11px]"
            />
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
              <Input
                type="date"
                value={tanggalSalur}
                onChange={(e) => setTanggalSalur(e.target.value)}
                className="rounded-[11px]"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={
              simpan.isPending || !pemenangId || !(nilaiNominal > 0) || !formPeriode
            }
            className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {simpan.isPending ? "Menyimpan..." : "Simpan putaran"}
          </button>
        </form>
      </BottomDrawer>

      {/* Sheet mulai ronde */}
      <BottomDrawer open={mulaiOpen} onOpenChange={setMulaiOpen} title="Mulai Ronde Baru">
        <form onSubmit={handleMulai} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Bulan mulai *</Label>
            <Input
              type="month"
              required
              value={mulaiBulan}
              onChange={(e) => setMulaiBulan(e.target.value)}
              className="rounded-[11px]"
            />
            <p className="text-[11px] text-muted-foreground">
              Ronde dimulai tanggal 1 dan harus setelah ronde sebelumnya ditutup.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-bold">Catatan</Label>
            <Input
              value={mulaiCatatan}
              onChange={(e) => setMulaiCatatan(e.target.value)}
              className="rounded-[11px]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-[12.5px] font-bold">
                Anggota ronde * ({mulaiAnggota.size})
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={pilihSemuaAnggota}
                  className="text-[11px] font-bold text-primary"
                >
                  Pilih semua
                </button>
                <button
                  type="button"
                  onClick={() => setMulaiAnggota(new Set())}
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
                    checked={mulaiAnggota.has(r.id)}
                    onChange={() => toggleMulaiAnggota(r.id)}
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
            disabled={mulai.isPending || !mulaiBulan || mulaiAnggota.size === 0}
            className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {mulai.isPending ? "Memulai..." : "Mulai ronde"}
          </button>
        </form>
      </BottomDrawer>

      {/* Dialog tutup ronde */}
      <AlertDialog open={tutupOpen} onOpenChange={setTutupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup ronde {selected?.nomor}?</AlertDialogTitle>
            <AlertDialogDescription>
              Ronde hanya bisa ditutup setelah semua anggota menang dan seluruh pot
              disalurkan. Putaran pada ronde ini tidak bisa diubah lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5 py-2">
            <Label className="text-[12.5px] font-bold">Tanggal tutup</Label>
            <Input
              type="date"
              value={tutupTanggal}
              onChange={(e) => setTutupTanggal(e.target.value)}
              className="rounded-[11px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTutup}
              disabled={tutup.isPending || !bisaDitutup}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Tutup ronde
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog konfirmasi talangan */}
      <AlertDialog open={!!talangan} onOpenChange={(open) => !open && setTalangan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nominal melebihi pot?</AlertDialogTitle>
            <AlertDialogDescription>
              Nominal {formatRupiah(talangan?.nominal ?? 0)} melebihi pot terkumpul{" "}
              {formatRupiah(formPot)}. Selisih {formatRupiah(selisihTalangan)} akan
              dibayar dari saldo kas sebagai talangan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTalangan}
              disabled={simpan.isPending}
              className="bg-amber-500 text-amber-950 hover:bg-amber-600"
            >
              Simpan dengan talangan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <Input
              type="date"
              value={salurTanggal}
              onChange={(e) => setSalurTanggal(e.target.value)}
              className="rounded-[11px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSalurkan}
              disabled={salurkan.isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
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
            <AlertDialogAction
              onClick={handleHapus}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
