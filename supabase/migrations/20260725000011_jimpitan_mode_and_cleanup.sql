-- ============================================================
-- Migration 011: Jimpitan – mode per-rumah, tipe record, hapus TAO
-- ============================================================

-- 1. Tambah mode_jimpitan di rumah_kk
ALTER TABLE rumah_kk
  ADD COLUMN IF NOT EXISTS mode_jimpitan TEXT NOT NULL DEFAULT 'Harian'
  CHECK (mode_jimpitan IN ('Harian', 'Bulanan', 'Bebas'));

-- 2. Tambah tipe di jimpitan_harian (harian vs bulanan)
ALTER TABLE jimpitan_harian
  ADD COLUMN IF NOT EXISTS tipe TEXT NOT NULL DEFAULT 'harian'
  CHECK (tipe IN ('harian', 'bulanan'));

-- 3. Hapus status "Tidak Ada Orang" dari enum
--    View v_saldo_kas bergantung pada kolom status, harus di-drop dulu
UPDATE jimpitan_harian SET status = 'Kosong' WHERE status = 'Tidak Ada Orang';

DROP VIEW IF EXISTS v_saldo_kas;

ALTER TABLE jimpitan_harian ALTER COLUMN status TYPE TEXT;
DROP TYPE IF EXISTS status_jimpitan;
CREATE TYPE status_jimpitan AS ENUM ('Belum', 'Diambil', 'Kosong');
ALTER TABLE jimpitan_harian ALTER COLUMN status TYPE status_jimpitan
  USING status::status_jimpitan;

-- 4. Recreate v_saldo_kas
CREATE VIEW v_saldo_kas AS
SELECT
  COALESCE((SELECT SUM(jumlah) FROM kas_bulanan WHERE tipe_kas = 'Bapak' AND status_bayar = true), 0) AS kas_bapak_masuk,
  COALESCE((SELECT SUM(jumlah) FROM kas_bulanan WHERE tipe_kas = 'Ibu' AND status_bayar = true), 0) AS kas_ibu_masuk,
  COALESCE((SELECT SUM(nominal) FROM jimpitan_harian WHERE status = 'Diambil'), 0) AS jimpitan_masuk,
  COALESCE((SELECT SUM(jumlah) FROM iuran_insidental_detail WHERE status_bayar = true), 0) AS iuran_insidental_masuk,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas), 0) AS total_pengeluaran;
