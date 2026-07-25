import { supabase } from "@/shared/lib/supabase";
import type { SuratPengantar } from "@/shared/types/database";

export type SuratWithWarga = SuratPengantar & {
  warga_detail: { nama_lengkap: string };
};

export async function fetchSuratList(status?: string) {
  let query = supabase
    .from("surat_pengantar")
    .select("*, warga_detail(nama_lengkap)")
    .order("tanggal_diajukan", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data as SuratWithWarga[];
}

export type CreateSuratInput = Pick<
  SuratPengantar,
  "nomor_surat" | "jenis_surat" | "warga_id" | "keperluan" | "tujuan"
>;

export async function createSurat(input: CreateSuratInput) {
  const { data, error } = await supabase
    .from("surat_pengantar")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as SuratPengantar;
}

export async function updateSuratStatus(
  id: string,
  input: { status: string; catatan_admin?: string; diproses_oleh?: string }
) {
  const update: Record<string, unknown> = { status: input.status };
  if (input.catatan_admin) update.catatan_admin = input.catatan_admin;
  if (input.diproses_oleh) update.diproses_oleh = input.diproses_oleh;
  if (input.status === "Selesai")
    update.tanggal_selesai = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("surat_pengantar")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as SuratPengantar;
}

export async function deleteSurat(id: string) {
  const { error } = await supabase
    .from("surat_pengantar")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
