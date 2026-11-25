import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RotateCw } from "lucide-react";
import {
  useArisanAnggota, useArisanRekap, useArisanRondeList,
  useDeleteArisanPutaran, useMulaiArisanRonde, useSalurkanArisanPutaran,
  useSimpanArisanPutaran, useTutupArisanRonde,
} from "@/features/keuangan/hooks";
import { useRumahList } from "@/features/warga/hooks";
import type { SimpanArisanPutaranInput } from "@/features/keuangan/services";
import type { ArisanRekap } from "@/shared/types/database";
import {
  buatPeriode, indeksPeriode, kunciPeriode, parsePeriodeKey, statusOf,
} from "@/features/keuangan/arisan";
import { RondePicker } from "@/features/keuangan/components/arisan/RondePicker";
import { RondeProgressCard } from "@/features/keuangan/components/arisan/RondeProgressCard";
import { RondeStats } from "@/features/keuangan/components/arisan/RondeStats";
import { LintasTahunBanner } from "@/features/keuangan/components/arisan/LintasTahunBanner";
import { PotBulanIniBanner } from "@/features/keuangan/components/arisan/PotBulanIniBanner";
import { PutaranRow } from "@/features/keuangan/components/arisan/PutaranRow";
import { PutaranDrawer } from "@/features/keuangan/components/arisan/PutaranDrawer";
import { MulaiRondeDrawer } from "@/features/keuangan/components/arisan/MulaiRondeDrawer";
import { TutupRondeDialog } from "@/features/keuangan/components/arisan/TutupRondeDialog";
import { TalanganDialog } from "@/features/keuangan/components/arisan/TalanganDialog";
import { SalurkanDialog } from "@/features/keuangan/components/arisan/SalurkanDialog";
import { HapusPutaranDialog } from "@/features/keuangan/components/arisan/HapusPutaranDialog";
import { todayISO } from "@/shared/lib/date";

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
  const [tanggalUndi, setTanggalUndi] = useState(todayISO);
  const [salurkanSekarang, setSalurkanSekarang] = useState(true);
  const [tanggalSalur, setTanggalSalur] = useState(todayISO);
  const [catatan, setCatatan] = useState("");
  const [talangan, setTalangan] = useState<SimpanArisanPutaranInput | null>(null);

  const [salurTarget, setSalurTarget] = useState<ArisanRekap | null>(null);
  const [salurTanggal, setSalurTanggal] = useState(todayISO);
  const [deleteTarget, setDeleteTarget] = useState<ArisanRekap | null>(null);

  const [tutupOpen, setTutupOpen] = useState(false);
  const [tutupTanggal, setTutupTanggal] = useState(todayISO);

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
    setTanggalUndi(todayISO());
    setSalurkanSekarang(true);
    setTanggalSalur(todayISO());
    setCatatan("");
    setSheetOpen(true);
  };

  const openEdit = (row: ArisanRekap) => {
    setEditId(row.putaran_id);
    setPemenangAwal(row.pemenang_rumah_id);
    setFormPeriode(kunciPeriode(row.tahun, row.bulan));
    setPemenangId(row.pemenang_rumah_id ?? "");
    setNominal(String(row.nominal_putaran ?? row.nominal_terkumpul));
    setTanggalUndi(row.tanggal_undi ?? todayISO());
    setSalurkanSekarang(false);
    setTanggalSalur(todayISO());
    setCatatan(row.catatan ?? "");
    setSheetOpen(true);
  };

  const openMulai = () => {
    let bulanAwal = todayISO().slice(0, 7);
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
      tanggal_salur: salurkanSekarang ? tanggalSalur || todayISO() : null,
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
      { rondeId: selected.id, tanggal: tutupTanggal || todayISO() },
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
          <RondePicker
            rounds={rounds}
            selectedId={selected?.id}
            menangPerRonde={menangPerRonde}
            onPick={setPickedId}
          />

          {selected && (
            <>
              <RondeProgressCard
                ronde={selected}
                menangCount={menangCount}
                jumlahAnggota={jumlahAnggota}
                progress={progress}
                bisaDitutup={bisaDitutup}
                alasanTutup={alasanTutup}
                onTutup={() => {
                  setTutupTanggal(todayISO());
                  setTutupOpen(true);
                }}
              />

              <RondeStats
                totalTerkumpul={totalTerkumpul}
                totalTersalur={totalTersalur}
              />

              <LintasTahunBanner
                lintasTahun={lintasTahun}
                total={totalLintasTahun}
                onBuka={
                  rondeLintasTahun
                    ? () => setPickedId(rondeLintasTahun)
                    : undefined
                }
              />

              {perluDiundi && (
                <PotBulanIniBanner
                  bulan={bulan}
                  pot={potBulanIni}
                  onCatat={() => {
                    if (activeRonde) setPickedId(activeRonde.id);
                    openCreate(tahun, bulan);
                  }}
                />
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
                    return (
                      <PutaranRow
                        key={periode.key}
                        periode={periode}
                        row={row}
                        bisaDiubah={
                          !selected.tanggal_selesai && statusOf(row) !== "sudah-disalurkan"
                        }
                        onEdit={() => openEdit(row)}
                        onCatat={() => openCreate(row.tahun, row.bulan)}
                        onSalurkan={() => {
                          setSalurTarget(row);
                          setSalurTanggal(todayISO());
                        }}
                        onHapus={() => setDeleteTarget(row)}
                      />
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

      <PutaranDrawer
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editId={editId}
        formPeriode={formPeriode}
        onFormPeriodeChange={setFormPeriode}
        opsiPeriode={opsiPeriode}
        pemenangId={pemenangId}
        onPemenangIdChange={setPemenangId}
        kandidat={kandidat}
        nominal={nominal}
        onNominalChange={setNominal}
        tanggalUndi={tanggalUndi}
        onTanggalUndiChange={setTanggalUndi}
        catatan={catatan}
        onCatatanChange={setCatatan}
        salurkanSekarang={salurkanSekarang}
        onSalurkanSekarangChange={setSalurkanSekarang}
        tanggalSalur={tanggalSalur}
        onTanggalSalurChange={setTanggalSalur}
        formPot={formPot}
        selisihTalangan={selisihTalangan}
        pending={simpan.isPending}
        onSubmit={handleSubmit}
      />

      <MulaiRondeDrawer
        open={mulaiOpen}
        onOpenChange={setMulaiOpen}
        bulan={mulaiBulan}
        onBulanChange={setMulaiBulan}
        catatan={mulaiCatatan}
        onCatatanChange={setMulaiCatatan}
        anggota={mulaiAnggota}
        onToggleAnggota={toggleMulaiAnggota}
        onPilihSemua={pilihSemuaAnggota}
        onKosongkan={() => setMulaiAnggota(new Set())}
        rumahOptions={rumahOptions}
        pending={mulai.isPending}
        onSubmit={handleMulai}
      />

      <TutupRondeDialog
        open={tutupOpen}
        onOpenChange={setTutupOpen}
        nomor={selected?.nomor}
        tanggal={tutupTanggal}
        onTanggalChange={setTutupTanggal}
        onConfirm={handleTutup}
        pending={tutup.isPending}
        bisaDitutup={bisaDitutup}
      />

      <TalanganDialog
        payload={talangan}
        formPot={formPot}
        selisih={selisihTalangan}
        onClose={() => setTalangan(null)}
        onConfirm={handleTalangan}
        pending={simpan.isPending}
      />

      <SalurkanDialog
        target={salurTarget}
        tanggal={salurTanggal}
        onTanggalChange={setSalurTanggal}
        onClose={() => setSalurTarget(null)}
        onConfirm={handleSalurkan}
        pending={salurkan.isPending}
      />

      <HapusPutaranDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleHapus}
      />
    </div>
  );
}
