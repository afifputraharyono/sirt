import { supabase } from "@/shared/lib/supabase";
import type { JadwalRonda } from "@/shared/types/database";

export type JadwalWithWarga = JadwalRonda & {
  warga_detail: { nama_lengkap: string; rumah_id: string };
};

export async function fetchPeriodeList() {
  const { data, error } = await supabase
    .from("periode_jadwal_ronda")
    .select("*")
    .order("tanggal_mulai", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchActivePeriode() {
  const { data, error } = await supabase
    .from("periode_jadwal_ronda")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPeriode(input: {
  nama_periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  dibuat_oleh: string;
}) {
  const { data, error } = await supabase
    .from("periode_jadwal_ronda")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchJadwalByPeriode(periodeId: string) {
  const { data, error } = await supabase
    .from("jadwal_ronda")
    .select("*, warga_detail(nama_lengkap, rumah_id)")
    .eq("periode_id", periodeId)
    .eq("is_active", true)
    .order("hari")
    .order("urutan");
  if (error) throw error;
  return data as JadwalWithWarga[];
}

export async function createJadwal(
  input: Pick<JadwalRonda, "periode_id" | "hari" | "warga_id" | "urutan">
) {
  const { data, error } = await supabase
    .from("jadwal_ronda")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as JadwalRonda;
}

export async function createJadwalBatch(
  items: Pick<JadwalRonda, "periode_id" | "hari" | "warga_id" | "urutan">[]
) {
  const { data, error } = await supabase
    .from("jadwal_ronda")
    .insert(items)
    .select();
  if (error) throw error;
  return data as JadwalRonda[];
}

export async function deleteJadwal(id: string) {
  const { error } = await supabase
    .from("jadwal_ronda")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}
