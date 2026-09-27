-- ============================================================
-- Migration 013: Arisan (reuse kas_bulanan with tipe 'Arisan')
-- ============================================================

-- 1. Tambah nilai enum tipe_kas
ALTER TYPE tipe_kas ADD VALUE IF NOT EXISTS 'Arisan';

-- 2. Update CHECK constraint sumber_dana di pengeluaran_kas
ALTER TABLE pengeluaran_kas DROP CONSTRAINT IF EXISTS pengeluaran_kas_sumber_dana_check;
ALTER TABLE pengeluaran_kas ADD CONSTRAINT pengeluaran_kas_sumber_dana_check
  CHECK (sumber_dana IN ('Kas Bapak', 'Kas Ibu', 'Jimpitan', 'Arisan'));

-- 3. Recreate v_saldo_kas dengan arisan
DROP VIEW IF EXISTS v_saldo_kas;
CREATE VIEW v_saldo_kas AS
SELECT
  COALESCE((SELECT SUM(jumlah) FROM kas_bulanan WHERE tipe_kas = 'Bapak' AND status_bayar = true), 0) AS kas_bapak_masuk,
  COALESCE((SELECT SUM(jumlah) FROM kas_bulanan WHERE tipe_kas = 'Ibu' AND status_bayar = true), 0) AS kas_ibu_masuk,
  COALESCE((SELECT SUM(jumlah) FROM kas_bulanan WHERE tipe_kas = 'Arisan' AND status_bayar = true), 0) AS arisan_masuk,
  COALESCE((SELECT SUM(nominal) FROM jimpitan_harian WHERE status = 'Diambil'), 0) AS jimpitan_masuk,
  COALESCE((SELECT SUM(jumlah) FROM iuran_insidental_detail WHERE status_bayar = true), 0) AS iuran_insidental_masuk,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas), 0) AS total_pengeluaran,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas WHERE sumber_dana = 'Kas Bapak'), 0) AS pengeluaran_kas_bapak,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas WHERE sumber_dana = 'Kas Ibu'), 0) AS pengeluaran_kas_ibu,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas WHERE sumber_dana = 'Jimpitan'), 0) AS pengeluaran_jimpitan,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas WHERE sumber_dana = 'Arisan'), 0) AS pengeluaran_arisan;
