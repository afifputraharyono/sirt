-- ============================================================
-- Migration 012: Grup Pengeluaran + Sumber Dana + Date Range
-- ============================================================

-- 1. Buat tabel grup_pengeluaran (parent group)
CREATE TABLE IF NOT EXISTS grup_pengeluaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  catatan TEXT,
  dibuat_oleh UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE grup_pengeluaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grup_pengeluaran_select" ON grup_pengeluaran
  FOR SELECT USING (true);
CREATE POLICY "grup_pengeluaran_insert" ON grup_pengeluaran
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "grup_pengeluaran_update" ON grup_pengeluaran
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "grup_pengeluaran_delete" ON grup_pengeluaran
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 2. Tambah sumber_dana & grup_id di pengeluaran_kas
ALTER TABLE pengeluaran_kas
  ADD COLUMN IF NOT EXISTS sumber_dana TEXT NOT NULL DEFAULT 'Kas Bapak'
  CHECK (sumber_dana IN ('Kas Bapak', 'Kas Ibu', 'Jimpitan'));

ALTER TABLE pengeluaran_kas
  ADD COLUMN IF NOT EXISTS grup_id UUID REFERENCES grup_pengeluaran(id) ON DELETE SET NULL;

-- 3. Recreate v_saldo_kas untuk memperhitungkan sumber_dana
DROP VIEW IF EXISTS v_saldo_kas;
CREATE VIEW v_saldo_kas AS
SELECT
  COALESCE((SELECT SUM(jumlah) FROM kas_bulanan WHERE tipe_kas = 'Bapak' AND status_bayar = true), 0) AS kas_bapak_masuk,
  COALESCE((SELECT SUM(jumlah) FROM kas_bulanan WHERE tipe_kas = 'Ibu' AND status_bayar = true), 0) AS kas_ibu_masuk,
  COALESCE((SELECT SUM(nominal) FROM jimpitan_harian WHERE status = 'Diambil'), 0) AS jimpitan_masuk,
  COALESCE((SELECT SUM(jumlah) FROM iuran_insidental_detail WHERE status_bayar = true), 0) AS iuran_insidental_masuk,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas), 0) AS total_pengeluaran,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas WHERE sumber_dana = 'Kas Bapak'), 0) AS pengeluaran_kas_bapak,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas WHERE sumber_dana = 'Kas Ibu'), 0) AS pengeluaran_kas_ibu,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas WHERE sumber_dana = 'Jimpitan'), 0) AS pengeluaran_jimpitan;
