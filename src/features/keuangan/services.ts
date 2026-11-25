import { supabase } from "@/shared/lib/supabase";
import type {
  KasBulanan,
  JimpitanHarian,
  PengeluaranKas,
  GrupPengeluaran,
  ArisanRonde,
  ArisanPutaran,
  ArisanRekap,
  StatusHunian,
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

export async function upsertKasBatch(items: CreateKasInput[]) {
  const { data, error } = await supabase
    .from("kas_bulanan")
    .upsert(items, { onConflict: "rumah_id,tipe_kas,bulan,tahun" })
    .select();
  if (error) throw error;
  return data as KasBulanan[];
}

export async function deleteKas(id: string) {
  const { error } = await supabase.from("kas_bulanan").delete().eq("id", id);
  if (error) throw error;
}

// ==================== JIMPITAN ====================

export type JimpitanWithRumah = JimpitanHarian & {
  rumah_kk: { no_rumah: string; mode_jimpitan: string };
};

export async function fetchJimpitanByDate(tanggal: string) {
  const { data, error } = await supabase
    .from("jimpitan_harian")
    .select("*, rumah_kk(no_rumah, mode_jimpitan)")
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
    .select("*, rumah_kk(no_rumah, mode_jimpitan)")
    .gte("tanggal", startDate)
    .lt("tanggal", endDate)
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return data as JimpitanWithRumah[];
}

export type CreateJimpitanInput = Pick<
  JimpitanHarian,
  "rumah_id" | "tanggal" | "nominal" | "status" | "tipe" | "catatan" | "dicatat_oleh"
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

export type UpdateJimpitanInput = Partial<
  Pick<JimpitanHarian, "nominal" | "status" | "catatan">
>;

export async function updateJimpitan(id: string, input: UpdateJimpitanInput) {
  const { data, error } = await supabase
    .from("jimpitan_harian")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as JimpitanHarian;
}

export async function upsertJimpitanBatch(
  items: CreateJimpitanInput[]
) {
  const { data, error } = await supabase
    .from("jimpitan_harian")
    .upsert(items, { onConflict: "rumah_id,tanggal" })
    .select("*, rumah_kk(no_rumah, mode_jimpitan)");
  if (error) throw error;
  return data as JimpitanWithRumah[];
}

export async function lockJimpitanByDate(tanggal: string, userId: string) {
  const { error } = await supabase
    .from("jimpitan_harian")
    .update({ is_locked: true, dikunci_oleh: userId, dikunci_at: new Date().toISOString() })
    .eq("tanggal", tanggal);
  if (error) throw error;
}

export async function unlockJimpitanByDate(tanggal: string) {
  const { error } = await supabase
    .from("jimpitan_harian")
    .update({ is_locked: false, dikunci_oleh: null, dikunci_at: null })
    .eq("tanggal", tanggal);
  if (error) throw error;
}

// ==================== PENGELUARAN ====================

export type PengeluaranWithGrup = PengeluaranKas & {
  grup_pengeluaran: { id: string; nama: string } | null;
};

export async function fetchPengeluaran(bulan: number, tahun: number) {
  const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const endMonth = bulan === 12 ? 1 : bulan + 1;
  const endYear = bulan === 12 ? tahun + 1 : tahun;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("pengeluaran_kas")
    .select("*, grup_pengeluaran(id, nama)")
    .gte("tanggal", startDate)
    .lt("tanggal", endDate)
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return data as PengeluaranWithGrup[];
}

export async function fetchPengeluaranByRange(from: string, to: string) {
  const { data, error } = await supabase
    .from("pengeluaran_kas")
    .select("*, grup_pengeluaran(id, nama)")
    .gte("tanggal", from)
    .lte("tanggal", to)
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return data as PengeluaranWithGrup[];
}

export type CreatePengeluaranInput = Pick<
  PengeluaranKas,
  | "tanggal"
  | "kategori"
  | "nominal"
  | "keterangan"
  | "bukti_url"
  | "sumber_dana"
  | "grup_id"
  | "dicatat_oleh"
>;

export async function createPengeluaran(input: CreatePengeluaranInput) {
  const { data, error } = await supabase
    .from("pengeluaran_kas")
    .insert(input)
    .select("*, grup_pengeluaran(id, nama)")
    .single();
  if (error) throw error;
  return data as PengeluaranWithGrup;
}

export async function updatePengeluaran(
  id: string,
  input: Partial<CreatePengeluaranInput>
) {
  const { data, error } = await supabase
    .from("pengeluaran_kas")
    .update(input)
    .eq("id", id)
    .select("*, grup_pengeluaran(id, nama)")
    .single();
  if (error) throw error;
  return data as PengeluaranWithGrup;
}

export async function deletePengeluaran(id: string) {
  const { error } = await supabase
    .from("pengeluaran_kas")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ==================== GRUP PENGELUARAN ====================

export type GrupWithItems = GrupPengeluaran & {
  pengeluaran_kas: PengeluaranKas[];
};

export async function fetchGrupPengeluaran() {
  const { data, error } = await supabase
    .from("grup_pengeluaran")
    .select("*, pengeluaran_kas(*)")
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return data as GrupWithItems[];
}

export type CreateGrupInput = Pick<
  GrupPengeluaran,
  "nama" | "tanggal" | "catatan" | "dibuat_oleh"
>;

export async function createGrupPengeluaran(input: CreateGrupInput) {
  const { data, error } = await supabase
    .from("grup_pengeluaran")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as GrupPengeluaran;
}

export async function updateGrupPengeluaran(
  id: string,
  input: Partial<Pick<GrupPengeluaran, "nama" | "tanggal" | "catatan">>
) {
  const { data, error } = await supabase
    .from("grup_pengeluaran")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as GrupPengeluaran;
}

export async function deleteGrupPengeluaran(id: string) {
  const { error } = await supabase
    .from("grup_pengeluaran")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ==================== KAS BY DATE RANGE ====================

export async function fetchKasByRange(tipe: TipeKas, from: string, to: string) {
  const { data, error } = await supabase
    .from("kas_bulanan")
    .select("*, rumah_kk(no_rumah, no_kk)")
    .eq("tipe_kas", tipe)
    .eq("status_bayar", true)
    .gte("tanggal_bayar", from)
    .lte("tanggal_bayar", to)
    .order("tanggal_bayar", { ascending: false });
  if (error) throw error;
  return data as KasWithRumah[];
}

export async function fetchJimpitanByRange(from: string, to: string) {
  const { data, error } = await supabase
    .from("jimpitan_harian")
    .select("*, rumah_kk(no_rumah, mode_jimpitan)")
    .eq("status", "Diambil")
    .gte("tanggal", from)
    .lte("tanggal", to)
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return data as JimpitanWithRumah[];
}

// ==================== SALDO ====================

export interface SaldoKas {
  kas_bapak_masuk: number;
  kas_ibu_masuk: number;
  arisan_masuk: number;
  jimpitan_masuk: number;
  iuran_insidental_masuk: number;
  total_pengeluaran: number;
  pengeluaran_kas_bapak: number;
  pengeluaran_kas_ibu: number;
  pengeluaran_jimpitan: number;
  pengeluaran_arisan: number;
  total_masuk: number;
  total_pengeluaran_utama: number;
  saldo_utama: number;
  saldo_kas_bapak: number;
  saldo_kas_ibu: number;
  saldo_jimpitan: number;
  arisan_belum_disalurkan: number;
}

export async function fetchSaldoKas(): Promise<SaldoKas> {
  const { data, error } = await supabase
    .from("v_saldo_kas")
    .select("*")
    .single();
  if (error) throw error;

  // Kolom turunan diturunkan ulang di sini bila DB masih memakai versi view
  // lama (10 kolom), supaya deploy frontend tidak bergantung urutan migrasi.
  const row = data as Record<string, number | string | null>;
  const num = (key: keyof SaldoKas) =>
    row[key] == null ? 0 : Number(row[key]);
  const pick = (key: keyof SaldoKas, fallback: number) =>
    row[key] == null ? fallback : Number(row[key]);

  const kasBapakMasuk = num("kas_bapak_masuk");
  const kasIbuMasuk = num("kas_ibu_masuk");
  const arisanMasuk = num("arisan_masuk");
  const jimpitanMasuk = num("jimpitan_masuk");
  const iuranMasuk = num("iuran_insidental_masuk");
  const totalPengeluaran = num("total_pengeluaran");
  const pengeluaranKasBapak = num("pengeluaran_kas_bapak");
  const pengeluaranKasIbu = num("pengeluaran_kas_ibu");
  const pengeluaranJimpitan = num("pengeluaran_jimpitan");
  const pengeluaranArisan = num("pengeluaran_arisan");

  const totalMasuk = kasBapakMasuk + kasIbuMasuk + jimpitanMasuk + iuranMasuk;
  const totalPengeluaranUtama = totalPengeluaran - pengeluaranArisan;

  return {
    kas_bapak_masuk: kasBapakMasuk,
    kas_ibu_masuk: kasIbuMasuk,
    arisan_masuk: arisanMasuk,
    jimpitan_masuk: jimpitanMasuk,
    iuran_insidental_masuk: iuranMasuk,
    total_pengeluaran: totalPengeluaran,
    pengeluaran_kas_bapak: pengeluaranKasBapak,
    pengeluaran_kas_ibu: pengeluaranKasIbu,
    pengeluaran_jimpitan: pengeluaranJimpitan,
    pengeluaran_arisan: pengeluaranArisan,
    total_masuk: pick("total_masuk", totalMasuk),
    total_pengeluaran_utama: pick(
      "total_pengeluaran_utama",
      totalPengeluaranUtama
    ),
    saldo_utama: pick("saldo_utama", totalMasuk - totalPengeluaranUtama),
    saldo_kas_bapak: pick(
      "saldo_kas_bapak",
      kasBapakMasuk - pengeluaranKasBapak
    ),
    saldo_kas_ibu: pick("saldo_kas_ibu", kasIbuMasuk - pengeluaranKasIbu),
    saldo_jimpitan: pick(
      "saldo_jimpitan",
      jimpitanMasuk - pengeluaranJimpitan
    ),
    arisan_belum_disalurkan: pick(
      "arisan_belum_disalurkan",
      arisanMasuk - pengeluaranArisan
    ),
  };
}

// ==================== ARISAN ====================

export type ArisanRondeWithAnggota = ArisanRonde & {
  arisan_anggota: { rumah_id: string }[];
};

export async function fetchArisanRondeList() {
  const { data, error } = await supabase
    .from("arisan_ronde")
    .select("*, arisan_anggota(rumah_id)")
    .order("nomor", { ascending: false });
  if (error) throw error;
  return data as ArisanRondeWithAnggota[];
}

export interface ArisanAnggotaRow {
  id: string;
  rumah_id: string;
  rumah_kk: {
    no_rumah: string;
    status_hunian: StatusHunian;
    is_active: boolean;
  } | null;
}

export async function fetchArisanAnggota(rondeId: string) {
  const { data, error } = await supabase
    .from("arisan_anggota")
    .select("id, rumah_id, rumah_kk(no_rumah, status_hunian, is_active)")
    .eq("ronde_id", rondeId);
  if (error) throw error;
  return ((data ?? []) as unknown as ArisanAnggotaRow[]).map((row) => ({
    ...row,
    rumah_kk: Array.isArray(row.rumah_kk) ? (row.rumah_kk[0] ?? null) : row.rumah_kk,
  }));
}

export interface MulaiArisanRondeInput {
  tanggal_mulai: string;
  anggota: string[];
  catatan: string | null;
}

export async function mulaiArisanRonde(input: MulaiArisanRondeInput) {
  const { data, error } = await supabase.rpc("fn_mulai_arisan_ronde", {
    p_tanggal_mulai: input.tanggal_mulai,
    p_anggota: input.anggota,
    p_catatan: input.catatan,
  });
  if (error) throw error;
  return data as ArisanRonde;
}

export async function tutupArisanRonde(rondeId: string, tanggalSelesai: string) {
  const { data, error } = await supabase.rpc("fn_tutup_arisan_ronde", {
    p_ronde_id: rondeId,
    p_tanggal_selesai: tanggalSelesai,
  });
  if (error) throw error;
  return data as ArisanRonde;
}

export async function fetchArisanRekap(tahun?: number) {
  let query = supabase
    .from("v_arisan_rekap")
    .select("*")
    .order("tahun", { ascending: false })
    .order("bulan", { ascending: false });

  if (tahun) query = query.eq("tahun", tahun);

  const { data, error } = await query;
  if (error) throw error;
  return data as ArisanRekap[];
}

export interface SimpanArisanPutaranInput {
  bulan: number;
  tahun: number;
  pemenang_rumah_id: string;
  nominal: number;
  tanggal_undi: string | null;
  catatan: string | null;
  salurkan: boolean;
  tanggal_salur: string | null;
}

export async function simpanArisanPutaran(input: SimpanArisanPutaranInput) {
  const { data, error } = await supabase.rpc("fn_simpan_arisan_putaran", {
    p_bulan: input.bulan,
    p_tahun: input.tahun,
    p_pemenang_rumah_id: input.pemenang_rumah_id,
    p_nominal: input.nominal,
    p_tanggal_undi: input.tanggal_undi,
    p_catatan: input.catatan,
    p_salurkan: input.salurkan,
    p_tanggal_salur: input.tanggal_salur,
  });
  if (error) throw error;
  return data as ArisanPutaran;
}

export async function salurkanArisanPutaran(id: string, tanggal: string) {
  const { data, error } = await supabase.rpc("fn_salurkan_arisan_putaran", {
    p_id: id,
    p_tanggal: tanggal,
  });
  if (error) throw error;
  return data as ArisanPutaran;
}

export async function deleteArisanPutaran(id: string) {
  const { error } = await supabase.from("arisan_putaran").delete().eq("id", id);
  if (error) throw error;
}
