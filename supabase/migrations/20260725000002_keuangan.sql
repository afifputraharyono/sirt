-- ============================================================
-- Migration 002: Tabel Keuangan
-- ============================================================

-- ========================
-- TABEL: kas_bulanan
-- ========================

CREATE TABLE kas_bulanan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rumah_id        UUID NOT NULL REFERENCES rumah_kk(id) ON DELETE RESTRICT,
  tipe_kas        tipe_kas NOT NULL DEFAULT 'Bapak',
  bulan           INT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun           INT NOT NULL CHECK (tahun >= 2020),
  jumlah          NUMERIC(12,2) NOT NULL,
  status_bayar    BOOLEAN NOT NULL DEFAULT false,
  tanggal_bayar   DATE,
  metode_bayar    VARCHAR(20),
  bukti_bayar_url TEXT,
  dicatat_oleh    UUID NOT NULL REFERENCES auth.users(id),
  keterangan      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (rumah_id, tipe_kas, bulan, tahun)
);

CREATE INDEX idx_kas_tipe_tahun ON kas_bulanan(tipe_kas, tahun, bulan);
CREATE INDEX idx_kas_rumah ON kas_bulanan(rumah_id);

CREATE TRIGGER trg_updated_at_kas_bulanan
  BEFORE UPDATE ON kas_bulanan
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: iuran_insidental
-- ========================

CREATE TABLE iuran_insidental (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_iuran      VARCHAR(100) NOT NULL,
  deskripsi       TEXT,
  nominal_target  NUMERIC(12,2),
  tanggal_mulai   DATE NOT NULL,
  tanggal_selesai DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  dibuat_oleh     UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_updated_at_iuran_insidental
  BEFORE UPDATE ON iuran_insidental
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: iuran_insidental_detail
-- ========================

CREATE TABLE iuran_insidental_detail (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iuran_id      UUID NOT NULL REFERENCES iuran_insidental(id) ON DELETE CASCADE,
  rumah_id      UUID NOT NULL REFERENCES rumah_kk(id) ON DELETE RESTRICT,
  jumlah        NUMERIC(12,2) NOT NULL,
  status_bayar  BOOLEAN NOT NULL DEFAULT false,
  tanggal_bayar DATE,
  dicatat_oleh  UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (iuran_id, rumah_id)
);

CREATE TRIGGER trg_updated_at_iuran_insidental_detail
  BEFORE UPDATE ON iuran_insidental_detail
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: jimpitan_harian
-- ========================

CREATE TABLE jimpitan_harian (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rumah_id      UUID NOT NULL REFERENCES rumah_kk(id) ON DELETE RESTRICT,
  tanggal       DATE NOT NULL,
  nominal       NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        status_jimpitan NOT NULL,
  catatan       TEXT,
  dicatat_oleh  UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (rumah_id, tanggal)
);

CREATE INDEX idx_jimpitan_tanggal ON jimpitan_harian(tanggal);

CREATE TRIGGER trg_updated_at_jimpitan_harian
  BEFORE UPDATE ON jimpitan_harian
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: pengeluaran_kas
-- ========================

CREATE TABLE pengeluaran_kas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal         DATE NOT NULL,
  kategori        kategori_pengeluaran NOT NULL,
  nominal         NUMERIC(12,2) NOT NULL,
  keterangan      TEXT NOT NULL,
  bukti_url       TEXT,
  disetujui_oleh  UUID REFERENCES auth.users(id),
  dicatat_oleh    UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pengeluaran_tanggal ON pengeluaran_kas(tanggal);

CREATE TRIGGER trg_updated_at_pengeluaran_kas
  BEFORE UPDATE ON pengeluaran_kas
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- VIEW: v_saldo_kas
-- ========================

CREATE MATERIALIZED VIEW v_saldo_kas AS
SELECT 'kas_bapak_masuk' AS tipe,
       COALESCE(SUM(jumlah) FILTER (WHERE status_bayar = true), 0) AS total
FROM kas_bulanan WHERE tipe_kas = 'Bapak'
UNION ALL
SELECT 'kas_ibu_masuk' AS tipe,
       COALESCE(SUM(jumlah) FILTER (WHERE status_bayar = true), 0) AS total
FROM kas_bulanan WHERE tipe_kas = 'Ibu'
UNION ALL
SELECT 'jimpitan_masuk' AS tipe,
       COALESCE(SUM(nominal) FILTER (WHERE status = 'Diambil'), 0) AS total
FROM jimpitan_harian
UNION ALL
SELECT 'iuran_insidental_masuk' AS tipe,
       COALESCE(SUM(jumlah) FILTER (WHERE status_bayar = true), 0) AS total
FROM iuran_insidental_detail
UNION ALL
SELECT 'pengeluaran' AS tipe,
       COALESCE(SUM(nominal), 0) AS total
FROM pengeluaran_kas;

CREATE UNIQUE INDEX idx_v_saldo_kas_tipe ON v_saldo_kas(tipe);
