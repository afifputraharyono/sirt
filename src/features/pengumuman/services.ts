import { supabase } from "@/shared/lib/supabase";
import type { Pengumuman } from "@/shared/types/database";

export async function fetchPengumumanList() {
  const { data, error } = await supabase
    .from("pengumuman")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Pengumuman[];
}

export async function fetchPengumumanActive() {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("pengumuman")
    .select("*")
    .lte("tanggal_mulai", today)
    .or(`tanggal_berakhir.is.null,tanggal_berakhir.gte.${today}`)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Pengumuman[];
}

export type CreatePengumumanInput = Pick<
  Pengumuman,
  | "judul"
  | "isi"
  | "kategori"
  | "is_pinned"
  | "tanggal_mulai"
  | "tanggal_berakhir"
  | "dibuat_oleh"
>;

export async function createPengumuman(input: CreatePengumumanInput) {
  const { data, error } = await supabase
    .from("pengumuman")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Pengumuman;
}

export async function updatePengumuman(
  id: string,
  input: Partial<CreatePengumumanInput>
) {
  const { data, error } = await supabase
    .from("pengumuman")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Pengumuman;
}

export async function deletePengumuman(id: string) {
  const { error } = await supabase.from("pengumuman").delete().eq("id", id);
  if (error) throw error;
}
