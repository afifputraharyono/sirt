-- ============================================================
-- Migration 001: Enum types & Tabel Kependudukan
-- ============================================================

-- ========================
-- ENUM TYPES
-- ========================

CREATE TYPE status_hunian AS ENUM ('Tetap', 'Kontrak', 'Kosong');
CREATE TYPE jenis_kelamin AS ENUM ('L', 'P');
CREATE TYPE hubungan_keluarga AS ENUM (
  'Kepala Keluarga', 'Istri', 'Anak', 'Orang Tua',
  'Mertua', 'Menantu', 'Cucu', 'Famili Lain', 'Lainnya'
);
CREATE TYPE status_perkawinan AS ENUM ('Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati');
CREATE TYPE agama AS ENUM ('Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya');
CREATE TYPE tipe_kas AS ENUM ('Bapak', 'Ibu');
CREATE TYPE status_jimpitan AS ENUM ('Diambil', 'Kosong', 'Tidak Ada Orang');
CREATE TYPE kategori_pengeluaran AS ENUM (
  'Operasional', 'Keamanan', 'Kebersihan', 'Sosial',
  'Pembangunan', 'Kegiatan', 'Lainnya'
);
CREATE TYPE jenis_surat AS ENUM (
  'Pengantar KTP', 'Pengantar KK', 'Domisili', 'Keterangan Usaha',
  'Keterangan Tidak Mampu', 'Pengantar SKCK', 'Keterangan Kematian',
  'Keterangan Pindah', 'Lainnya'
);
CREATE TYPE status_surat AS ENUM ('Diajukan', 'Diproses', 'Selesai', 'Ditolak');
CREATE TYPE role_pengguna AS ENUM ('admin', 'ronda', 'warga');
CREATE TYPE status_peminjaman AS ENUM ('Dipinjam', 'Dikembalikan', 'Rusak', 'Hilang');
CREATE TYPE kondisi_barang AS ENUM ('Baik', 'Rusak Ringan', 'Rusak Berat', 'Hilang');
CREATE TYPE alasan_nonaktif AS ENUM ('Pindah', 'Wafat', 'Lainnya');
CREATE TYPE tipe_audit AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- ========================
-- HELPER: updated_at trigger
-- ========================

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- TABEL: profil_pengguna
-- ========================

CREATE TABLE profil_pengguna (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_tampilan VARCHAR(100) NOT NULL,
  role        role_pengguna NOT NULL DEFAULT 'warga',
  warga_id    UUID,
  avatar_url  TEXT,
  no_hp       VARCHAR(15),
  pin_ronda   VARCHAR(255),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_updated_at_profil_pengguna
  BEFORE UPDATE ON profil_pengguna
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: rumah_kk
-- ========================

CREATE TABLE rumah_kk (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_rumah      VARCHAR(10) NOT NULL UNIQUE,
  no_kk         VARCHAR(16),
  alamat_lengkap TEXT,
  rt            VARCHAR(3) NOT NULL DEFAULT '005',
  rw            VARCHAR(3) NOT NULL DEFAULT '003',
  kelurahan     VARCHAR(50) NOT NULL DEFAULT 'Wonoyoso',
  kecamatan     VARCHAR(50) NOT NULL DEFAULT 'Pringapus',
  status_hunian status_hunian NOT NULL DEFAULT 'Tetap',
  catatan       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_updated_at_rumah_kk
  BEFORE UPDATE ON rumah_kk
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: warga_detail
-- ========================

CREATE TABLE warga_detail (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rumah_id            UUID NOT NULL REFERENCES rumah_kk(id) ON DELETE RESTRICT,
  nik                 VARCHAR(16) UNIQUE,
  nama_lengkap        VARCHAR(100) NOT NULL,
  jenis_kelamin       jenis_kelamin NOT NULL,
  tempat_lahir        VARCHAR(50),
  tanggal_lahir       DATE NOT NULL,
  agama               agama NOT NULL DEFAULT 'Islam',
  status_perkawinan   status_perkawinan NOT NULL DEFAULT 'Belum Kawin',
  hubungan_keluarga   hubungan_keluarga NOT NULL,
  pendidikan_terakhir VARCHAR(30),
  pekerjaan           VARCHAR(50),
  no_hp               VARCHAR(15),
  golongan_darah      VARCHAR(3),
  is_active           BOOLEAN NOT NULL DEFAULT true,
  alasan_nonaktif     alasan_nonaktif,
  tanggal_nonaktif    DATE,
  keterangan_nonaktif TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warga_rumah ON warga_detail(rumah_id);
CREATE INDEX idx_warga_active ON warga_detail(is_active) WHERE is_active = true;

CREATE TRIGGER trg_updated_at_warga_detail
  BEFORE UPDATE ON warga_detail
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- FK dari profil_pengguna ke warga_detail (deferred)
ALTER TABLE profil_pengguna
  ADD CONSTRAINT fk_profil_warga
  FOREIGN KEY (warga_id) REFERENCES warga_detail(id) ON DELETE SET NULL;
