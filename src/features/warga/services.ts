import { supabase } from "@/shared/lib/supabase";
import type { RumahKK, WargaDetail } from "@/shared/types/database";

export type RumahWithWarga = RumahKK & {
  warga_detail: WargaDetail[];
};

export async function fetchRumahList() {
  const { data, error } = await supabase
    .from("rumah_kk")
    .select("*, warga_detail(*)")
    .eq("is_active", true)
    .order("no_rumah");
  if (error) throw error;
  return data as RumahWithWarga[];
}

export async function fetchRumahDetail(id: string) {
  const { data, error } = await supabase
    .from("rumah_kk")
    .select("*, warga_detail(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as RumahWithWarga;
}

export type CreateRumahInput = Pick<
  RumahKK,
  "no_rumah" | "no_kk" | "alamat_lengkap" | "status_hunian" | "catatan"
>;

export async function createRumah(input: CreateRumahInput) {
  const { data, error } = await supabase
    .from("rumah_kk")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as RumahKK;
}

export async function updateRumah(
  id: string,
  input: Partial<CreateRumahInput>
) {
  const { data, error } = await supabase
    .from("rumah_kk")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as RumahKK;
}

export async function deleteRumah(id: string) {
  const { error } = await supabase
    .from("rumah_kk")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export type CreateWargaInput = Pick<
  WargaDetail,
  | "rumah_id"
  | "nik"
  | "nama_lengkap"
  | "jenis_kelamin"
  | "tempat_lahir"
  | "tanggal_lahir"
  | "agama"
  | "status_perkawinan"
  | "hubungan_keluarga"
  | "pendidikan_terakhir"
  | "pekerjaan"
  | "no_hp"
  | "golongan_darah"
>;

export async function createWarga(input: CreateWargaInput) {
  const { data, error } = await supabase
    .from("warga_detail")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as WargaDetail;
}

export async function updateWarga(
  id: string,
  input: Partial<CreateWargaInput>
) {
  const { data, error } = await supabase
    .from("warga_detail")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as WargaDetail;
}

export async function deleteWarga(id: string) {
  const { error } = await supabase
    .from("warga_detail")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}
