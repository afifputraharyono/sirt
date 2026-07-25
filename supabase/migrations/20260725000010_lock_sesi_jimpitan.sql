-- ============================================================
-- Migration 010: Lock Sesi Jimpitan
-- ============================================================

-- Kolom lock pada jimpitan_harian
ALTER TABLE jimpitan_harian
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dikunci_oleh UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS dikunci_at TIMESTAMPTZ;

-- Ronda hanya bisa update jika belum dikunci
DROP POLICY IF EXISTS jimpitan_ronda_modify ON jimpitan_harian;
CREATE POLICY jimpitan_ronda_modify ON jimpitan_harian
  FOR UPDATE USING (
    current_user_role() IN ('ronda'::role_pengguna, 'admin'::role_pengguna)
    AND NOT is_locked
  );

-- Admin bisa update kapan saja (termasuk unlock)
CREATE POLICY jimpitan_admin_unlock ON jimpitan_harian
  FOR UPDATE USING (is_admin()) WITH CHECK (true);
