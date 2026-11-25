import { supabase } from "@/shared/lib/supabase";
import type { PeriodeHunianRingkas } from "@/shared/lib/hunian";
import type { RumahKK, TipeKas } from "@/shared/types/database";
import { hitungTagihan, parseTahunBulan } from "@/features/tagihan/tagihan";
import type { KeanggotaanArisan, TagihanRumah } from "@/features/tagihan/tagihan";

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

// ==================== ARISAN ====================

export interface RondeArisanAktif {
  id: string;
  nomor: number;
  tanggal_mulai: string;
  jumlahAnggota: number;
}

export async function fetchRondeArisanAktif(): Promise<RondeArisanAktif | null> {
  const { data: ronde, error } = await supabase
    .from("arisan_ronde")
    .select("id, nomor, tanggal_mulai")
    .is("tanggal_selesai", null)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!ronde) return null;

  const { data: anggota, error: anggotaError } = await supabase
    .from("v_arisan_anggota_publik")
    .select("rumah_id")
    .eq("ronde_id", ronde.id);
  if (anggotaError) throw anggotaError;

  return {
    id: ronde.id,
    nomor: ronde.nomor,
    tanggal_mulai: ronde.tanggal_mulai,
    jumlahAnggota: new Set(
      ((anggota ?? []) as Array<{ rumah_id: string }>).map((a) => a.rumah_id)
    ).size,
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
