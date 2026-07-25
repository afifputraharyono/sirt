import { supabase } from "@/shared/lib/supabase";

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
