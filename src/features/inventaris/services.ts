import { supabase } from "@/shared/lib/supabase";
import type { Inventaris } from "@/shared/types/database";

export async function fetchInventarisList() {
  const { data, error } = await supabase
    .from("inventaris")
    .select("*")
    .eq("is_active", true)
    .order("nama_barang");
  if (error) throw error;
  return data as Inventaris[];
}

export type CreateInventarisInput = Pick<
  Inventaris,
  | "nama_barang"
  | "kategori"
  | "jumlah"
  | "kondisi"
  | "lokasi_penyimpanan"
  | "tanggal_pengadaan"
  | "nilai_perolehan"
  | "catatan"
>;

export async function createInventaris(input: CreateInventarisInput) {
  const { data, error } = await supabase
    .from("inventaris")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Inventaris;
}

export async function updateInventaris(
  id: string,
  input: Partial<CreateInventarisInput>
) {
  const { data, error } = await supabase
    .from("inventaris")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Inventaris;
}

export async function deleteInventaris(id: string) {
  const { error } = await supabase
    .from("inventaris")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}
