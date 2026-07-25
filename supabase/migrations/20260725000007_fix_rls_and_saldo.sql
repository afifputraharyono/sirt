-- ============================================================
-- Migration 007: Fix RLS recursion & v_saldo_kas
-- ============================================================

-- ========================
-- FIX 1: Helper function to get current user's rumah_id
-- without triggering RLS on warga_detail (avoids recursion)
-- ========================

CREATE OR REPLACE FUNCTION current_user_rumah_id()
RETURNS UUID AS $$
  SELECT wd.rumah_id
  FROM profil_pengguna pp
  JOIN warga_detail wd ON wd.id = pp.warga_id
  WHERE pp.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================
-- FIX 2: Drop recursive policy and replace with safe version
-- ========================

DROP POLICY IF EXISTS "warga_select_own_family" ON warga_detail;

CREATE POLICY "warga_select_own_family" ON warga_detail
  FOR SELECT USING (
    rumah_id = current_user_rumah_id()
    OR is_admin()
  );

-- ========================
-- FIX 3: Same recursion fix for surat_pengantar & tukar_jadwal
-- (these reference warga_detail via profil_pengguna subquery)
-- ========================

DROP POLICY IF EXISTS "surat_select_own" ON surat_pengantar;

CREATE POLICY "surat_select_own" ON surat_pengantar
  FOR SELECT USING (
    warga_id = (SELECT warga_id FROM profil_pengguna WHERE id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "surat_insert_warga" ON surat_pengantar;

CREATE POLICY "surat_insert_warga" ON surat_pengantar
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND warga_id = (SELECT warga_id FROM profil_pengguna WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "tukar_select_own" ON tukar_jadwal_ronda;

CREATE POLICY "tukar_select_own" ON tukar_jadwal_ronda
  FOR SELECT USING (
    pemohon_id = (SELECT warga_id FROM profil_pengguna WHERE id = auth.uid())
    OR pengganti_id = (SELECT warga_id FROM profil_pengguna WHERE id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "peminjaman_select_own" ON peminjaman_inventaris;

CREATE POLICY "peminjaman_select_own" ON peminjaman_inventaris
  FOR SELECT USING (
    peminjam_id = (SELECT warga_id FROM profil_pengguna WHERE id = auth.uid())
    OR is_admin()
  );

-- ========================
-- FIX 4: Replace materialized view with a regular view
-- that returns a single row with named columns
-- ========================

DROP MATERIALIZED VIEW IF EXISTS v_saldo_kas;

CREATE VIEW v_saldo_kas AS
SELECT
  COALESCE((SELECT SUM(jumlah) FROM kas_bulanan WHERE tipe_kas = 'Bapak' AND status_bayar = true), 0) AS kas_bapak_masuk,
  COALESCE((SELECT SUM(jumlah) FROM kas_bulanan WHERE tipe_kas = 'Ibu' AND status_bayar = true), 0) AS kas_ibu_masuk,
  COALESCE((SELECT SUM(nominal) FROM jimpitan_harian WHERE status = 'Diambil'), 0) AS jimpitan_masuk,
  COALESCE((SELECT SUM(jumlah) FROM iuran_insidental_detail WHERE status_bayar = true), 0) AS iuran_insidental_masuk,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_kas), 0) AS total_pengeluaran;
