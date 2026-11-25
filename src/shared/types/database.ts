import type { Database } from "./database.generated";

export type { Database };

type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];
type Enums = Database["public"]["Enums"];

// Kolom teks berpola (CHECK) tetap dipersempit agar aman di UI.
export type ModeJimpitan = "Harian" | "Bulanan" | "Bebas";
export type TipeJimpitan = "harian" | "bulanan";
export type SumberDana = "Kas Bapak" | "Kas Ibu" | "Jimpitan" | "Arisan";

export type StatusHunian = Enums["status_hunian"];
export type JenisKelamin = Enums["jenis_kelamin"];
export type HubunganKeluarga = Enums["hubungan_keluarga"];
export type StatusPerkawinan = Enums["status_perkawinan"];
export type Agama = Enums["agama"];
export type TipeKas = Enums["tipe_kas"];
export type StatusJimpitan = Enums["status_jimpitan"];
export type KategoriPengeluaran = Enums["kategori_pengeluaran"];
export type JenisSurat = Enums["jenis_surat"];
export type StatusSurat = Enums["status_surat"];
export type StatusPeminjaman = Enums["status_peminjaman"];
export type KondisiBarang = Enums["kondisi_barang"];
export type AlasanNonaktif = Enums["alasan_nonaktif"];

export type RumahKK = Tables["rumah_kk"]["Row"] & { mode_jimpitan: ModeJimpitan };
export type RumahHunian = Tables["rumah_hunian"]["Row"];
export type WargaDetail = Tables["warga_detail"]["Row"];
export type KasBulanan = Tables["kas_bulanan"]["Row"];
export type JimpitanHarian = Tables["jimpitan_harian"]["Row"] & { tipe: TipeJimpitan };
export type PengeluaranKas = Tables["pengeluaran_kas"]["Row"] & { sumber_dana: SumberDana };
export type GrupPengeluaran = Tables["grup_pengeluaran"]["Row"];
export type ArisanRonde = Tables["arisan_ronde"]["Row"];
export type ArisanPutaran = Tables["arisan_putaran"]["Row"];
export type JadwalRonda = Tables["jadwal_ronda"]["Row"];
export type SuratPengantar = Tables["surat_pengantar"]["Row"];
export type Pengumuman = Tables["pengumuman"]["Row"];
export type Inventaris = Tables["inventaris"]["Row"];

// View mengembalikan kolom nullable; periode dan status selalu terisi.
export type ArisanRekap = Views["v_arisan_rekap"]["Row"] & {
  tahun: number;
  bulan: number;
  nominal_terkumpul: number;
  jumlah_pembayar: number;
  sudah_disalurkan: boolean;
};
