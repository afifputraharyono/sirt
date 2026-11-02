import { supabase } from "@/shared/lib/supabase";
import { RT_CONFIG } from "@/shared/lib/constants";
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

export interface TagihanRumah {
  found: boolean;
  wajibBayar: boolean;
  noRumah: string;
  statusHunian: StatusHunian | null;
  tahun: number;
  bulanSekarang: number;
  totalKurang: number;
  totalNominalKurang: number;
  rincian: RincianTagihan[];
  detailPerBulan: DetailTagihanBulan[];
}

const NOMINAL_KAS: Record<TipeTagihan, number> = {
  Bapak: RT_CONFIG.nominal_kas_bulanan_bapak,
  Ibu: RT_CONFIG.nominal_kas_bulanan_ibu,
  Arisan: RT_CONFIG.nominal_arisan,
};

// Bulan mulai kewajiban per jenis, dari RT_CONFIG.mulai_kewajiban.
// null = belum berjalan di sistem → jenis itu tidak dihitung (kewajiban 0).
const MULAI_KEWAJIBAN: Partial<Record<TipeTagihan, number | null>> = {
  Bapak: RT_CONFIG.mulai_kewajiban.kas_bapak,
  Ibu: RT_CONFIG.mulai_kewajiban.kas_ibu,
  Arisan: RT_CONFIG.mulai_kewajiban.arisan,
};

export function hitungTagihan(params: {
  noRumah: string;
  statusHunian: StatusHunian | null;
  tahun: number;
  bulanSekarang: number;
  kasRows: Array<{ tipe_kas: TipeKas; bulan: number; tahun: number }>;
  pesertaArisan: boolean;
}): TagihanRumah {
  const kosong: TagihanRumah = {
    found: true,
    wajibBayar: false,
    noRumah: params.noRumah,
    statusHunian: params.statusHunian,
    tahun: params.tahun,
    bulanSekarang: params.bulanSekarang,
    totalKurang: 0,
    totalNominalKurang: 0,
    rincian: [],
    detailPerBulan: [],
  };
  if (params.statusHunian === "Kosong") return kosong;

  const lunasSet = new Set(
    params.kasRows.map((r) => `${r.tipe_kas}-${r.bulan}-${r.tahun}`)
  );

  // Jenis yang kewajibannya belum dimulai (mulai_kewajiban === null) tidak dihitung.
  const tipeDasar: TipeTagihan[] = params.pesertaArisan
    ? ["Bapak", "Ibu", "Arisan"]
    : ["Bapak", "Ibu"];
  const tipeAktif = tipeDasar.filter(
    (t) => MULAI_KEWAJIBAN[t] != null
  );

  const rincian: RincianTagihan[] = tipeAktif.map((tipe) => {
    const awal = MULAI_KEWAJIBAN[tipe]!; // sudah dijamin non-null oleh filter
    let jumlahLunas = 0;
    for (let b = awal; b <= params.bulanSekarang; b++) {
      if (lunasSet.has(`${tipe}-${b}-${params.tahun}`)) jumlahLunas++;
    }
    const bulanWajib = Math.max(0, params.bulanSekarang - awal + 1);
    const jumlahKurang = bulanWajib - jumlahLunas;
    return {
      tipe,
      nominal: NOMINAL_KAS[tipe],
      bulanWajib,
      jumlahLunas,
      jumlahKurang,
      nominalKurang: jumlahKurang * NOMINAL_KAS[tipe],
    };
  });

  const detailPerBulan: DetailTagihanBulan[] = [];
  for (let b = 1; b <= params.bulanSekarang; b++) {
    detailPerBulan.push({
      bulan: b,
      items: tipeAktif
        .filter((t) => b >= (MULAI_KEWAJIBAN[t] ?? 0))
        .map((t) => ({ tipe: t, lunas: lunasSet.has(`${t}-${b}-${params.tahun}`) })),
    });
  }

  return {
    ...kosong,
    wajibBayar: true,
    rincian,
    detailPerBulan,
    totalKurang: rincian.reduce((s, r) => s + r.jumlahKurang, 0),
    totalNominalKurang: rincian.reduce((s, r) => s + r.nominalKurang, 0),
  };
}

export async function fetchTagihanRumah(noRumah: string): Promise<TagihanRumah> {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulanSekarang = sekarang.getMonth() + 1;

  const { data: rumahRows, error: rumahError } = await supabase
    .from("rumah_kk")
    .select("id, no_rumah, status_hunian, is_active")
    .eq("no_rumah", noRumah.trim())
    .eq("is_active", true)
    .limit(1);
  if (rumahError) throw rumahError;
  const rumah = (
    rumahRows as Pick<RumahKK, "id" | "no_rumah" | "status_hunian">[] | null
  )?.[0];

  if (!rumah) {
    return {
      found: false,
      wajibBayar: false,
      noRumah: noRumah.trim(),
      statusHunian: null,
      tahun,
      bulanSekarang,
      totalKurang: 0,
      totalNominalKurang: 0,
      rincian: [],
      detailPerBulan: [],
    };
  }

  const [{ data: kasRows, error: kasError }, { data: arisanRows, error: arisanError }] =
    await Promise.all([
      supabase
        .from("kas_bulanan")
        .select("tipe_kas, bulan, tahun")
        .eq("rumah_id", rumah.id)
        .eq("tahun", tahun),
      supabase
        .from("kas_bulanan")
        .select("id")
        .eq("rumah_id", rumah.id)
        .eq("tipe_kas", "Arisan")
        .limit(1),
    ]);
  if (kasError) throw kasError;
  if (arisanError) throw arisanError;

  const pesertaArisan = (arisanRows?.length ?? 0) > 0;

  return hitungTagihan({
    noRumah: rumah.no_rumah,
    statusHunian: rumah.status_hunian,
    tahun,
    bulanSekarang,
    kasRows: (kasRows ?? []) as Array<{
      tipe_kas: TipeKas;
      bulan: number;
      tahun: number;
    }>,
    pesertaArisan,
  });
}
