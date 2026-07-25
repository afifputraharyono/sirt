-- ============================================================
-- Migration 008: Public views for anonymous access
-- ============================================================
-- Views run with definer (postgres) permissions by default,
-- bypassing RLS on warga_detail for public pages.

-- View: jadwal ronda with warga names (public)
CREATE VIEW v_jadwal_ronda_public AS
SELECT
  jr.id,
  jr.hari,
  jr.urutan,
  jr.periode_id,
  wd.nama_lengkap AS nama_anggota,
  pjr.nama_periode,
  pjr.is_active AS periode_aktif
FROM jadwal_ronda jr
JOIN warga_detail wd ON wd.id = jr.warga_id
JOIN periode_jadwal_ronda pjr ON pjr.id = jr.periode_id
WHERE jr.is_active = true;

-- View: aggregate RT statistics (public)
CREATE VIEW v_statistik_rt AS
SELECT
  (SELECT COUNT(*)::int FROM rumah_kk WHERE is_active = true) AS total_rumah,
  (SELECT COUNT(*)::int FROM warga_detail WHERE is_active = true) AS total_warga,
  (SELECT COUNT(*)::int FROM warga_detail WHERE is_active = true AND jenis_kelamin = 'L') AS total_laki,
  (SELECT COUNT(*)::int FROM warga_detail WHERE is_active = true AND jenis_kelamin = 'P') AS total_perempuan;
