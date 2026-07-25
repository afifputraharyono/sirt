import { supabase } from "@/shared/lib/supabase";
import type {
  KasBulanan,
  JimpitanHarian,
  PengeluaranKas,
  TipeKas,
} from "@/shared/types/database";

// ==================== KAS BULANAN ====================

export type KasWithRumah = KasBulanan & {
  rumah_kk: { no_rumah: string; no_kk: string | null };
};

export async function fetchKasByMonth(
  tipe: TipeKas,
  bulan: number,
  tahun: number
) {
  const { data, error } = await supabase
    .from("kas_bulanan")
    .select("*, rumah_kk(no_rumah, no_kk)")
    .eq("tipe_kas", tipe)
    .eq("bulan", bulan)
    .eq("tahun", tahun)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as KasWithRumah[];
}

export type CreateKasInput = Pick<
  KasBulanan,
  | "rumah_id"
  | "tipe_kas"
  | "bulan"
  | "tahun"
  | "jumlah"
  | "status_bayar"
  | "tanggal_bayar"
  | "metode_bayar"
  | "keterangan"
  | "dicatat_oleh"
>;

export async function createKas(input: CreateKasInput) {
  const { data, error } = await supabase
    .from("kas_bulanan")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as KasBulanan;
}

export async function updateKas(id: string, input: Partial<CreateKasInput>) {
  const { data, error } = await supabase
    .from("kas_bulanan")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as KasBulanan;
}

export async function deleteKas(id: string) {
  const { error } = await supabase.from("kas_bulanan").delete().eq("id", id);
  if (error) throw error;
}

// ==================== JIMPITAN ====================

export type JimpitanWithRumah = JimpitanHarian & {
  rumah_kk: { no_rumah: string };
};

export async function fetchJimpitanByDate(tanggal: string) {
  const { data, error } = await supabase
    .from("jimpitan_harian")
    .select("*, rumah_kk(no_rumah)")
    .eq("tanggal", tanggal)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as JimpitanWithRumah[];
}

export async function fetchJimpitanSummary(bulan: number, tahun: number) {
  const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const endMonth = bulan === 12 ? 1 : bulan + 1;
  const endYear = bulan === 12 ? tahun + 1 : tahun;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("jimpitan_harian")
    .select("*, rumah_kk(no_rumah)")
    .gte("tanggal", startDate)
    .lt("tanggal", endDate)
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return data as JimpitanWithRumah[];
}

export type CreateJimpitanInput = Pick<
  JimpitanHarian,
  "rumah_id" | "tanggal" | "nominal" | "status" | "catatan" | "dicatat_oleh"
>;

export async function createJimpitan(input: CreateJimpitanInput) {
  const { data, error } = await supabase
    .from("jimpitan_harian")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as JimpitanHarian;
}

export async function deleteJimpitan(id: string) {
  const { error } = await supabase
    .from("jimpitan_harian")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ==================== PENGELUARAN ====================

export async function fetchPengeluaran(bulan: number, tahun: number) {
  const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const endMonth = bulan === 12 ? 1 : bulan + 1;
  const endYear = bulan === 12 ? tahun + 1 : tahun;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("pengeluaran_kas")
    .select("*")
    .gte("tanggal", startDate)
    .lt("tanggal", endDate)
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return data as PengeluaranKas[];
}

export type CreatePengeluaranInput = Pick<
  PengeluaranKas,
  | "tanggal"
  | "kategori"
  | "nominal"
  | "keterangan"
  | "bukti_url"
  | "dicatat_oleh"
>;

export async function createPengeluaran(input: CreatePengeluaranInput) {
  const { data, error } = await supabase
    .from("pengeluaran_kas")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as PengeluaranKas;
}

export async function updatePengeluaran(
  id: string,
  input: Partial<CreatePengeluaranInput>
) {
  const { data, error } = await supabase
    .from("pengeluaran_kas")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as PengeluaranKas;
}

export async function deletePengeluaran(id: string) {
  const { error } = await supabase
    .from("pengeluaran_kas")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ==================== SALDO ====================

export async function fetchSaldoKas() {
  const { data, error } = await supabase
    .from("v_saldo_kas")
    .select("*")
    .single();
  if (error) throw error;
  return data as {
    kas_bapak_masuk: number;
    kas_ibu_masuk: number;
    jimpitan_masuk: number;
    iuran_insidental_masuk: number;
    total_pengeluaran: number;
  };
}
