export type StatusHunian = "Tetap" | "Kontrak" | "Kosong";
export type JenisKelamin = "L" | "P";
export type HubunganKeluarga =
  | "Kepala Keluarga"
  | "Istri"
  | "Anak"
  | "Orang Tua"
  | "Mertua"
  | "Menantu"
  | "Cucu"
  | "Famili Lain"
  | "Lainnya";
export type StatusPerkawinan =
  | "Belum Kawin"
  | "Kawin"
  | "Cerai Hidup"
  | "Cerai Mati";
export type Agama =
  | "Islam"
  | "Kristen"
  | "Katolik"
  | "Hindu"
  | "Buddha"
  | "Konghucu"
  | "Lainnya";
export type TipeKas = "Bapak" | "Ibu";
export type StatusJimpitan = "Diambil" | "Kosong" | "Tidak Ada Orang";
export type KategoriPengeluaran =
  | "Operasional"
  | "Keamanan"
  | "Kebersihan"
  | "Sosial"
  | "Pembangunan"
  | "Kegiatan"
  | "Lainnya";
export type JenisSurat =
  | "Pengantar KTP"
  | "Pengantar KK"
  | "Domisili"
  | "Keterangan Usaha"
  | "Keterangan Tidak Mampu"
  | "Pengantar SKCK"
  | "Keterangan Kematian"
  | "Keterangan Pindah"
  | "Lainnya";
export type StatusSurat = "Diajukan" | "Diproses" | "Selesai" | "Ditolak";
export type StatusPeminjaman = "Dipinjam" | "Dikembalikan" | "Rusak" | "Hilang";
export type KondisiBarang =
  | "Baik"
  | "Rusak Ringan"
  | "Rusak Berat"
  | "Hilang";
export type AlasanNonaktif = "Pindah" | "Wafat" | "Lainnya";

export interface RumahKK {
  id: string;
  no_rumah: string;
  no_kk: string | null;
  alamat_lengkap: string | null;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  status_hunian: StatusHunian;
  catatan: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WargaDetail {
  id: string;
  rumah_id: string;
  nik: string | null;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tempat_lahir: string | null;
  tanggal_lahir: string;
  agama: Agama;
  status_perkawinan: StatusPerkawinan;
  hubungan_keluarga: HubunganKeluarga;
  pendidikan_terakhir: string | null;
  pekerjaan: string | null;
  no_hp: string | null;
  golongan_darah: string | null;
  is_active: boolean;
  alasan_nonaktif: AlasanNonaktif | null;
  tanggal_nonaktif: string | null;
  keterangan_nonaktif: string | null;
  created_at: string;
  updated_at: string;
}

export interface KasBulanan {
  id: string;
  rumah_id: string;
  tipe_kas: TipeKas;
  bulan: number;
  tahun: number;
  jumlah: number;
  status_bayar: boolean;
  tanggal_bayar: string | null;
  metode_bayar: string | null;
  bukti_bayar_url: string | null;
  dicatat_oleh: string;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface JimpitanHarian {
  id: string;
  rumah_id: string;
  tanggal: string;
  nominal: number;
  status: StatusJimpitan;
  catatan: string | null;
  dicatat_oleh: string;
  created_at: string;
  updated_at: string;
}

export interface PengeluaranKas {
  id: string;
  tanggal: string;
  kategori: KategoriPengeluaran;
  nominal: number;
  keterangan: string;
  bukti_url: string | null;
  disetujui_oleh: string | null;
  dicatat_oleh: string;
  created_at: string;
  updated_at: string;
}

export interface JadwalRonda {
  id: string;
  periode_id: string;
  hari: string;
  warga_id: string;
  urutan: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuratPengantar {
  id: string;
  nomor_surat: string;
  jenis_surat: JenisSurat;
  warga_id: string;
  keperluan: string;
  tujuan: string | null;
  status: StatusSurat;
  catatan_admin: string | null;
  lampiran_url: string[] | null;
  tanggal_diajukan: string;
  tanggal_selesai: string | null;
  diproses_oleh: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  kategori: string | null;
  is_pinned: boolean;
  tanggal_mulai: string;
  tanggal_berakhir: string | null;
  lampiran_url: string[] | null;
  dibuat_oleh: string;
  created_at: string;
  updated_at: string;
}

export interface Inventaris {
  id: string;
  nama_barang: string;
  kategori: string | null;
  jumlah: number;
  kondisi: KondisiBarang;
  lokasi_penyimpanan: string | null;
  tanggal_pengadaan: string | null;
  nilai_perolehan: number | null;
  foto_url: string | null;
  catatan: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
