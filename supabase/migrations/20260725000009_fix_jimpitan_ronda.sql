-- ============================================================
-- Migration 009: Fix Jimpitan for Ronda Role
-- ============================================================

-- Add "Belum" status for unselected jimpitan records
ALTER TYPE status_jimpitan ADD VALUE IF NOT EXISTS 'Belum' BEFORE 'Diambil';

-- Allow ronda users to UPDATE jimpitan records
CREATE POLICY jimpitan_ronda_modify ON jimpitan_harian
  FOR UPDATE USING (
    current_user_role() IN ('ronda'::role_pengguna, 'admin'::role_pengguna)
  );

-- Allow ronda users to DELETE jimpitan records
CREATE POLICY jimpitan_ronda_delete ON jimpitan_harian
  FOR DELETE USING (
    current_user_role() IN ('ronda'::role_pengguna, 'admin'::role_pengguna)
  );
