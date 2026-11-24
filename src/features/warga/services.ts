import { supabase } from "@/shared/lib/supabase";
import type { Role } from "@/features/auth/types";
import type {
  HubunganKeluarga,
  KasBulanan,
  RumahKK,
  StatusHunian,
  WargaDetail,
} from "@/shared/types/database";

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
  return (data as RumahWithWarga[]).sort((a, b) =>
    a.no_rumah.localeCompare(b.no_rumah, undefined, { numeric: true })
  );
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
  | "no_rumah"
  | "no_kk"
  | "alamat_lengkap"
  | "status_hunian"
  | "mode_jimpitan"
  | "catatan"
  | "ikut_arisan"
  | "mulai_kas_ibu"
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

// ==================== PORTAL WARGA ====================

export interface ProfilSaya {
  id: string;
  nama_tampilan: string;
  no_hp: string | null;
  role: Role;
  is_active: boolean;
  warga_id: string | null;
}

export interface AnggotaSaya {
  id: string;
  nama_lengkap: string;
  hubungan_keluarga: HubunganKeluarga;
}

export interface RumahSaya {
  id: string;
  no_rumah: string;
  status_hunian: StatusHunian;
  ikut_arisan: boolean;
  mulai_kas_ibu: string | null;
}

export interface KonteksWarga {
  profil: ProfilSaya;
  anggota: AnggotaSaya | null;
  rumah: RumahSaya | null;
}

export type KasSaya = Pick<
  KasBulanan,
  | "id"
  | "tipe_kas"
  | "bulan"
  | "tahun"
  | "jumlah"
  | "status_bayar"
  | "tanggal_bayar"
  | "metode_bayar"
  | "keterangan"
>;

export async function fetchKonteksWarga(): Promise<KonteksWarga> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.");

  const { data: profil, error: profilError } = await supabase
    .from("profil_pengguna")
    .select("id, nama_tampilan, no_hp, role, is_active, warga_id")
    .eq("id", user.id)
    .single();
  if (profilError) throw profilError;

  const profilSaya: ProfilSaya = {
    ...profil,
    role: profil.role as Role,
  };

  if (!profil.warga_id) {
    return { profil: profilSaya, anggota: null, rumah: null };
  }

  const { data: anggota, error: anggotaError } = await supabase
    .from("warga_detail")
    .select("id, nama_lengkap, hubungan_keluarga, rumah_id")
    .eq("id", profil.warga_id)
    .maybeSingle();
  if (anggotaError) throw anggotaError;
  if (!anggota) {
    return { profil: profilSaya, anggota: null, rumah: null };
  }

  const { data: rumah, error: rumahError } = await supabase
    .from("rumah_kk")
    .select("id, no_rumah, status_hunian, ikut_arisan, mulai_kas_ibu")
    .eq("id", anggota.rumah_id)
    .maybeSingle();
  if (rumahError) throw rumahError;

  return {
    profil: profilSaya,
    anggota: {
      id: anggota.id,
      nama_lengkap: anggota.nama_lengkap,
      hubungan_keluarga: anggota.hubungan_keluarga,
    },
    rumah: rumah
      ? {
          id: rumah.id,
          no_rumah: rumah.no_rumah,
          status_hunian: rumah.status_hunian,
          ikut_arisan: rumah.ikut_arisan,
          mulai_kas_ibu: rumah.mulai_kas_ibu ?? null,
        }
      : null,
  };
}

export async function fetchKasSaya(
  rumahId: string,
  tahun: number
): Promise<KasSaya[]> {
  const { data, error } = await supabase
    .from("kas_bulanan")
    .select(
      "id, tipe_kas, bulan, tahun, jumlah, status_bayar, tanggal_bayar, metode_bayar, keterangan"
    )
    .eq("rumah_id", rumahId)
    .eq("tahun", tahun)
    .order("bulan", { ascending: true });
  if (error) throw error;
  return (data ?? []) as KasSaya[];
}

export async function updateProfilSaya(
  id: string,
  input: { nama_tampilan: string; no_hp: string | null }
) {
  const { data, error } = await supabase
    .from("profil_pengguna")
    .update(input)
    .eq("id", id)
    .select("id, nama_tampilan, no_hp")
    .single();
  if (error) throw error;
  return data as Pick<ProfilSaya, "id" | "nama_tampilan" | "no_hp">;
}

// ==================== ADMIN: AKUN WARGA ====================

export interface AkunWarga {
  id: string;
  nama_tampilan: string;
  no_hp: string | null;
  is_active: boolean;
  warga_id: string | null;
  created_at: string;
  warga_detail: {
    nama_lengkap: string;
    hubungan_keluarga: HubunganKeluarga;
    rumah_kk: { no_rumah: string } | null;
  } | null;
}

type RelasiAkunWarga = {
  nama_lengkap: string;
  hubungan_keluarga: HubunganKeluarga;
  rumah_kk: { no_rumah: string } | { no_rumah: string }[] | null;
};

type RawAkunWarga = Omit<AkunWarga, "warga_detail"> & {
  warga_detail: RelasiAkunWarga | RelasiAkunWarga[] | null;
};

function relasiSatu<T>(value: T | T[] | null): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function fetchAkunWarga(): Promise<AkunWarga[]> {
  const { data, error } = await supabase
    .from("profil_pengguna")
    .select(
      "id, nama_tampilan, no_hp, is_active, warga_id, created_at, warga_detail(nama_lengkap, hubungan_keluarga, rumah_kk(no_rumah))"
    )
    .eq("role", "warga")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as RawAkunWarga[]).map((row) => {
    const detail = relasiSatu(row.warga_detail);
    const rumah = detail ? relasiSatu(detail.rumah_kk) : null;
    return {
      ...row,
      warga_detail: detail
        ? {
            nama_lengkap: detail.nama_lengkap,
            hubungan_keluarga: detail.hubungan_keluarga,
            rumah_kk: rumah ? { no_rumah: rumah.no_rumah } : null,
          }
        : null,
    };
  });
}

export async function setAkunWargaAnggota(
  akunId: string,
  wargaId: string | null
) {
  const { error } = await supabase
    .from("profil_pengguna")
    .update({ warga_id: wargaId })
    .eq("id", akunId);
  if (error) throw error;
}
