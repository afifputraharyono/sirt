import { supabase } from "@/shared/lib/supabase";
import { RT_CONFIG } from "@/shared/lib/constants";
import {
  batasBawahTunggakan,
  terhuniPada,
  type PeriodeHunianRingkas,
} from "@/shared/lib/hunian";
import type { RumahKK, StatusHunian, TipeKas } from "@/shared/types/database";

export interface JadwalRondaPublic {
  id: string;
  hari: string;
  urutan: number;
  periode_id: string;
  nama_anggota: string;
  nama_periode: string;
  periode_aktif: boolean;
}

export interface StatistikRT {
  total_rumah: number;
  total_warga: number;
  total_laki: number;
  total_perempuan: number;
}

export async function fetchJadwalRondaPublic(periodeId?: string) {
  let query = supabase
    .from("v_jadwal_ronda_public")
    .select("*")
    .order("hari")
    .order("urutan");

  if (periodeId) {
    query = query.eq("periode_id", periodeId);
  } else {
    query = query.eq("periode_aktif", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as JadwalRondaPublic[];
}

export async function fetchStatistikRT() {
  const { data, error } = await supabase
    .from("v_statistik_rt")
    .select("*")
    .single();
  if (error) throw error;
  return data as StatistikRT;
}

// ==================== TAGIHAN KAS ====================

export type TipeTagihan = TipeKas;

export interface RincianTagihan {
  tipe: TipeTagihan;
  nominal: number;
  bulanWajib: number;
  jumlahLunas: number;
  jumlahKurang: number;
  nominalKurang: number;
}

export interface DetailTagihanBulan {
  bulan: number;
  items: Array<{ tipe: TipeTagihan; lunas: boolean }>;
}

export interface TagihanTahun {
  tahun: number;
  rincian: RincianTagihan[];
  detailPerBulan: DetailTagihanBulan[];
  totalKurang: number;
  totalNominalKurang: number;
}

export interface KeanggotaanArisan {
  mulaiTahun: number;
  mulaiBulan: number;
  /** Durasi kewajiban ronde = jumlah anggota ronde (bulan). */
  jumlahAnggota: number;
}

export interface TagihanRumah {
  found: boolean;
  wajibBayar: boolean;
  noRumah: string;
  statusHunian: StatusHunian | null;
  tahun: number;
  bulanSekarang: number;
  /** Rincian & detail tahun berjalan (dipakai UI ringkas). */
  rincian: RincianTagihan[];
  detailPerBulan: DetailTagihanBulan[];
  /** Semua tahun yang punya kewajiban, terbaru dulu. */
  tahunList: TagihanTahun[];
  /** Total seluruh tahun (termasuk tunggakan tahun sebelumnya). */
  totalKurang: number;
  totalNominalKurang: number;
  adaTunggakanTahunLalu: boolean;
  nominalTunggakanTahunLalu: number;
}

const NOMINAL_KAS: Record<TipeTagihan, number> = {
  Bapak: RT_CONFIG.nominal_kas_bulanan_bapak,
  Ibu: RT_CONFIG.nominal_kas_bulanan_ibu,
  Arisan: RT_CONFIG.nominal_arisan,
};

// Tanggal mulai program per jenis (YYYY-MM, absolut lintas tahun).
// null = belum berjalan di sistem → jenis itu tidak dihitung (kewajiban 0).
const MULAI_PROGRAM: Partial<Record<TipeTagihan, string | null>> = {
  Bapak: RT_CONFIG.mulai_program.kas_bapak,
  Ibu: RT_CONFIG.mulai_program.kas_ibu,
  Arisan: RT_CONFIG.mulai_program.arisan,
};

interface TahunBulan {
  tahun: number;
  bulan: number;
}

function parseTahunBulan(value: string | null): TahunBulan | null {
  if (!value) return null;
  const [tahun, bulan] = value.split("-").map(Number);
  if (!tahun || !bulan || bulan < 1 || bulan > 12) return null;
  return { tahun, bulan };
}

function indeksBulan(tahun: number, bulan: number): number {
  return tahun * 12 + (bulan - 1);
}

// Kas Ibu untuk rumah yang baru ditempati bisa lebih lambat dari program.
function awalKewajiban(
  tipe: TipeTagihan,
  mulaiKasIbu: string | null
): TahunBulan | null {
  const program = parseTahunBulan(MULAI_PROGRAM[tipe] ?? null);
  if (!program) return null;
  if (tipe !== "Ibu") return program;
  const mulaiRumah = parseTahunBulan(mulaiKasIbu);
  if (!mulaiRumah) return program;
  return indeksBulan(mulaiRumah.tahun, mulaiRumah.bulan) >
    indeksBulan(program.tahun, program.bulan)
    ? mulaiRumah
    : program;
}

interface Kewajiban {
  tipe: TipeTagihan;
  /** Indeks bulan absolut kewajiban pertama. */
  awal: number;
  wajib: (indeks: number) => boolean;
}

function kewajibanBulanan(
  tipe: TipeTagihan,
  mulaiKasIbu: string | null
): Kewajiban | null {
  const awal = awalKewajiban(tipe, mulaiKasIbu);
  if (!awal) return null;
  const awalIndeks = indeksBulan(awal.tahun, awal.bulan);
  return { tipe, awal: awalIndeks, wajib: (indeks) => indeks >= awalIndeks };
}

// Kewajiban arisan mengikuti ronde: N bulan sejak ronde mulai, dengan
// N = jumlah anggota ronde. Bulan dari semua ronde digabung (union), jadi
// ronde berikutnya melanjutkan bulan setelah ronde sebelumnya selesai.
function kewajibanArisan(keanggotaan: KeanggotaanArisan[]): Kewajiban | null {
  const program = parseTahunBulan(MULAI_PROGRAM.Arisan ?? null);
  if (!program) return null;
  const programIndeks = indeksBulan(program.tahun, program.bulan);
  const bulan = new Set<number>();
  for (const k of keanggotaan) {
    if (k.jumlahAnggota <= 0) continue;
    const mulai = Math.max(
      indeksBulan(k.mulaiTahun, k.mulaiBulan),
      programIndeks
    );
    for (let i = 0; i < k.jumlahAnggota; i++) bulan.add(mulai + i);
  }
  if (bulan.size === 0) return null;
  return {
    tipe: "Arisan",
    awal: Math.min(...bulan),
    wajib: (indeks) => bulan.has(indeks),
  };
}

export function hitungTagihan(params: {
  noRumah: string;
  statusHunian: StatusHunian | null;
  tahun: number;
  bulanSekarang: number;
  kasRows: Array<{
    tipe_kas: TipeKas;
    bulan: number;
    tahun: number;
    status_bayar?: boolean;
  }>;
  keanggotaanArisan: KeanggotaanArisan[];
  mulaiKasIbu: string | null;
  /** Riwayat masa hunian; kosong = data lama, anggap selalu dihuni. */
  periodeHunian: PeriodeHunianRingkas[];
}): TagihanRumah {
  const kosong: TagihanRumah = {
    found: true,
    wajibBayar: false,
    noRumah: params.noRumah,
    statusHunian: params.statusHunian,
    tahun: params.tahun,
    bulanSekarang: params.bulanSekarang,
    rincian: [],
    detailPerBulan: [],
    tahunList: [],
    totalKurang: 0,
    totalNominalKurang: 0,
    adaTunggakanTahunLalu: false,
    nominalTunggakanTahunLalu: 0,
  };
  // Rumah kosong tanpa riwayat periode: tidak ada yang bisa ditagih.
  if (
    params.statusHunian === "Kosong" &&
    params.periodeHunian.length === 0
  ) {
    return kosong;
  }

  const lunasSet = new Set(
    params.kasRows
      .filter((r) => r.status_bayar !== false)
      .map((r) => `${r.tipe_kas}-${r.tahun}-${r.bulan}`)
  );

  // Jenis yang kewajibannya belum dimulai (null) tidak dihitung.
  const kewajibanList = [
    kewajibanBulanan("Bapak", params.mulaiKasIbu),
    kewajibanBulanan("Ibu", params.mulaiKasIbu),
    kewajibanArisan(params.keanggotaanArisan),
  ].filter((k): k is Kewajiban => k !== null);
  if (kewajibanList.length === 0) return { ...kosong, wajibBayar: true };

  // Bulan tanpa penghuni tidak ditagih (Kas Ibu & Arisan berhenti).
  const periode = params.periodeHunian;
  const dihuni = (indeks: number) =>
    periode.length === 0 ||
    terhuniPada(periode, Math.floor(indeks / 12), (indeks % 12) + 1);
  // Bila periode terbuka tidak mengalihkan tunggakan, bulan sebelum masa
  // hunian berjalan tidak ditagih lagi.
  const batasTunggakan = batasBawahTunggakan(periode);
  const wajibBayarBulan = (kewajiban: Kewajiban, indeks: number) =>
    kewajiban.wajib(indeks) &&
    (batasTunggakan === null || indeks >= batasTunggakan) &&
    dihuni(indeks);

  const tahunSekarang = params.tahun;
  const indeksSekarang = indeksBulan(tahunSekarang, params.bulanSekarang);
  const tahunAwal = Math.floor(
    Math.min(...kewajibanList.map(({ awal }) => awal)) / 12
  );

  const tahunList: TagihanTahun[] = [];
  for (let tahun = tahunAwal; tahun <= tahunSekarang; tahun++) {
    const bulanAkhir = tahun === tahunSekarang ? params.bulanSekarang : 12;
    const awalTahun = indeksBulan(tahun, 1);
    const akhirTahun = indeksBulan(tahun, bulanAkhir);

    const rincian: RincianTagihan[] = [];
    for (const kewajiban of kewajibanList) {
      const { tipe, awal } = kewajiban;
      const dari = Math.max(awal, awalTahun);
      const sampai = Math.min(akhirTahun, indeksSekarang);
      if (dari > sampai) continue;

      let bulanWajib = 0;
      let jumlahLunas = 0;
      for (let idx = dari; idx <= sampai; idx++) {
        if (!wajibBayarBulan(kewajiban, idx)) continue;
        bulanWajib++;
        const y = Math.floor(idx / 12);
        const m = (idx % 12) + 1;
        if (lunasSet.has(`${tipe}-${y}-${m}`)) jumlahLunas++;
      }
      if (bulanWajib === 0) continue;

      const jumlahKurang = bulanWajib - jumlahLunas;
      rincian.push({
        tipe,
        nominal: NOMINAL_KAS[tipe],
        bulanWajib,
        jumlahLunas,
        jumlahKurang,
        nominalKurang: jumlahKurang * NOMINAL_KAS[tipe],
      });
    }

    const detailPerBulan: DetailTagihanBulan[] = [];
    for (let b = 1; b <= bulanAkhir; b++) {
      const indeks = indeksBulan(tahun, b);
      const items = kewajibanList
        .filter((kewajiban) => wajibBayarBulan(kewajiban, indeks))
        .map(({ tipe }) => ({
          tipe,
          lunas: lunasSet.has(`${tipe}-${tahun}-${b}`),
        }));
      if (items.length > 0) detailPerBulan.push({ bulan: b, items });
    }

    if (rincian.length === 0) continue;
    tahunList.push({
      tahun,
      rincian,
      detailPerBulan,
      totalKurang: rincian.reduce((s, r) => s + r.jumlahKurang, 0),
      totalNominalKurang: rincian.reduce((s, r) => s + r.nominalKurang, 0),
    });
  }

  tahunList.sort((a, b) => b.tahun - a.tahun);
  const tahunIni = tahunList.find((t) => t.tahun === tahunSekarang);
  const nominalTunggakanTahunLalu = tahunList
    .filter((t) => t.tahun < tahunSekarang)
    .reduce((s, t) => s + t.totalNominalKurang, 0);

  return {
    ...kosong,
    wajibBayar: tahunList.length > 0,
    rincian: tahunIni?.rincian ?? [],
    detailPerBulan: tahunIni?.detailPerBulan ?? [],
    tahunList,
    totalKurang: tahunList.reduce((s, t) => s + t.totalKurang, 0),
    totalNominalKurang: tahunList.reduce(
      (s, t) => s + t.totalNominalKurang,
      0
    ),
    adaTunggakanTahunLalu: nominalTunggakanTahunLalu > 0,
    nominalTunggakanTahunLalu,
  };
}

export async function fetchTagihanRumah(noRumah: string): Promise<TagihanRumah> {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulanSekarang = sekarang.getMonth() + 1;

  const { data: rumahRows, error: rumahError } = await supabase
    .from("rumah_kk")
    .select("id, no_rumah, status_hunian, is_active, mulai_kas_ibu")
    .eq("no_rumah", noRumah.trim())
    .eq("is_active", true)
    .limit(1);
  if (rumahError) throw rumahError;
  const rumah = (
    rumahRows as
      | Pick<
          RumahKK,
          "id" | "no_rumah" | "status_hunian" | "mulai_kas_ibu"
        >[]
      | null
  )?.[0];

  if (!rumah) {
    return {
      found: false,
      wajibBayar: false,
      noRumah: noRumah.trim(),
      statusHunian: null,
      tahun,
      bulanSekarang,
      rincian: [],
      detailPerBulan: [],
      tahunList: [],
      totalKurang: 0,
      totalNominalKurang: 0,
      adaTunggakanTahunLalu: false,
      nominalTunggakanTahunLalu: 0,
    };
  }

  const { data: kasRows, error: kasError } = await supabase
    .from("kas_bulanan")
    .select("tipe_kas, bulan, tahun, status_bayar")
    .eq("rumah_id", rumah.id)
    .eq("status_bayar", true);
  if (kasError) throw kasError;

  const { data: anggotaRows, error: anggotaError } = await supabase
    .from("v_arisan_anggota_publik")
    .select("tanggal_mulai, jumlah_anggota")
    .eq("rumah_id", rumah.id);
  if (anggotaError) throw anggotaError;

  const keanggotaanArisan: KeanggotaanArisan[] = [];
  for (const row of anggotaRows ?? []) {
    const mulai = parseTahunBulan(String(row.tanggal_mulai).slice(0, 7));
    const jumlahAnggota = Number(row.jumlah_anggota) || 0;
    if (!mulai || jumlahAnggota <= 0) continue;
    keanggotaanArisan.push({
      mulaiTahun: mulai.tahun,
      mulaiBulan: mulai.bulan,
      jumlahAnggota,
    });
  }

  const { data: periodeRows, error: periodeError } = await supabase
    .from("v_rumah_hunian_publik")
    .select("tanggal_mulai, tanggal_selesai, tunggakan_dialihkan")
    .eq("rumah_id", rumah.id);
  if (periodeError) throw periodeError;

  return hitungTagihan({
    noRumah: rumah.no_rumah,
    statusHunian: rumah.status_hunian,
    tahun,
    bulanSekarang,
    kasRows: (kasRows ?? []) as Array<{
      tipe_kas: TipeKas;
      bulan: number;
      tahun: number;
      status_bayar: boolean;
    }>,
    keanggotaanArisan,
    mulaiKasIbu: rumah.mulai_kas_ibu ?? null,
    periodeHunian: (periodeRows ?? []) as PeriodeHunianRingkas[],
  });
}
