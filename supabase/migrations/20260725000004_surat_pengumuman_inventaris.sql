-- ============================================================
-- Migration 004: Surat Pengantar, Pengumuman, Inventaris
-- ============================================================

-- ========================
-- TABEL: surat_pengantar
-- ========================

CREATE TABLE surat_pengantar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_surat     VARCHAR(50) NOT NULL UNIQUE,
  jenis_surat     jenis_surat NOT NULL,
  warga_id        UUID NOT NULL REFERENCES warga_detail(id) ON DELETE RESTRICT,
  keperluan       TEXT NOT NULL,
  tujuan          VARCHAR(100),
  status          status_surat NOT NULL DEFAULT 'Diajukan',
  catatan_admin   TEXT,
  lampiran_url    TEXT[],
  tanggal_diajukan DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_selesai DATE,
  diproses_oleh   UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_surat_status ON surat_pengantar(status);
CREATE INDEX idx_surat_warga ON surat_pengantar(warga_id);

CREATE TRIGGER trg_updated_at_surat_pengantar
  BEFORE UPDATE ON surat_pengantar
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: pengumuman
-- ========================

CREATE TABLE pengumuman (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul             VARCHAR(200) NOT NULL,
  isi               TEXT NOT NULL,
  kategori          VARCHAR(30),
  is_pinned         BOOLEAN NOT NULL DEFAULT false,
  tanggal_mulai     DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_berakhir  DATE,
  lampiran_url      TEXT[],
  dibuat_oleh       UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pengumuman_active ON pengumuman(tanggal_mulai, tanggal_berakhir);

CREATE TRIGGER trg_updated_at_pengumuman
  BEFORE UPDATE ON pengumuman
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: inventaris
-- ========================

CREATE TABLE inventaris (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang         VARCHAR(100) NOT NULL,
  kategori            VARCHAR(50),
  jumlah              INT NOT NULL DEFAULT 1,
  kondisi             kondisi_barang NOT NULL DEFAULT 'Baik',
  lokasi_penyimpanan  VARCHAR(100),
  tanggal_pengadaan   DATE,
  nilai_perolehan     NUMERIC(12,2),
  foto_url            TEXT,
  catatan             TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_updated_at_inventaris
  BEFORE UPDATE ON inventaris
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: peminjaman_inventaris
-- ========================

CREATE TABLE peminjaman_inventaris (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventaris_id           UUID NOT NULL REFERENCES inventaris(id) ON DELETE RESTRICT,
  peminjam_id             UUID NOT NULL REFERENCES warga_detail(id) ON DELETE RESTRICT,
  jumlah_pinjam           INT NOT NULL DEFAULT 1,
  tanggal_pinjam          DATE NOT NULL,
  tanggal_kembali_rencana DATE NOT NULL,
  tanggal_kembali_aktual  DATE,
  status                  status_peminjaman NOT NULL DEFAULT 'Dipinjam',
  kondisi_kembali         kondisi_barang,
  catatan                 TEXT,
  dicatat_oleh            UUID NOT NULL REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_peminjaman_status ON peminjaman_inventaris(status) WHERE status = 'Dipinjam';

CREATE TRIGGER trg_updated_at_peminjaman_inventaris
  BEFORE UPDATE ON peminjaman_inventaris
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
