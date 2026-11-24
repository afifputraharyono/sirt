-- ============================================================
-- Migration 019: Invarian periode ronda & mulai_kas_ibu
-- ============================================================
-- Dipisah dari 017 agar kegagalan validasi data tidak memblokir patch
-- keamanan. Migrasi ini hanya metadata (index + CHECK constraint) dan
-- tidak mengubah baris data.
--
-- PRE-CHECK (read-only, jalankan dulu bila ingin memastikan):
--   SELECT id, nama_periode, tanggal_mulai, tanggal_selesai
--   FROM public.periode_jadwal_ronda
--   WHERE is_active;
--
--   SELECT no_rumah, mulai_kas_ibu
--   FROM public.rumah_kk
--   WHERE mulai_kas_ibu IS NOT NULL
--     AND mulai_kas_ibu <> date_trunc('month', mulai_kas_ibu::timestamp)::date;
--
-- Jika ada lebih dari satu periode aktif, nonaktifkan sisanya dulu.
-- Jika ada mulai_kas_ibu bukan tanggal 1, perbaiki dulu.
--
-- Dependensi:
--   - public.periode_jadwal_ronda (003)
--   - public.rumah_kk.mulai_kas_ibu (016)
-- ============================================================


-- ========================
-- 1. Maksimal satu periode ronda aktif
-- ========================
-- fetchActivePeriode() memakai maybeSingle(); lebih dari satu baris aktif
-- membuat halaman ronda error.

DO $$
DECLARE
  v_aktif INT;
BEGIN
  SELECT count(*) INTO v_aktif
  FROM public.periode_jadwal_ronda
  WHERE is_active;

  IF v_aktif > 1 THEN
    RAISE EXCEPTION
      'Ditemukan % periode ronda aktif. Nonaktifkan hingga tersisa satu sebelum migrasi ini dijalankan.',
      v_aktif
      USING ERRCODE = '23505';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS periode_satu_aktif
  ON public.periode_jadwal_ronda ((true))
  WHERE is_active;


-- ========================
-- 2. mulai_kas_ibu harus awal bulan
-- ========================
-- Aplikasi hanya membaca bulan & tahun dari kolom ini.

DO $$
DECLARE
  v_bad INT;
BEGIN
  SELECT count(*) INTO v_bad
  FROM public.rumah_kk
  WHERE mulai_kas_ibu IS NOT NULL
    AND mulai_kas_ibu <> date_trunc('month', mulai_kas_ibu::timestamp)::date;

  IF v_bad > 0 THEN
    RAISE EXCEPTION
      'Ada % baris rumah_kk.mulai_kas_ibu yang bukan tanggal 1. Perbaiki dulu sebelum constraint ditambahkan.',
      v_bad
      USING ERRCODE = '23514';
  END IF;
END $$;

ALTER TABLE public.rumah_kk
  DROP CONSTRAINT IF EXISTS rumah_kk_mulai_kas_ibu_awal_bulan;
ALTER TABLE public.rumah_kk
  ADD CONSTRAINT rumah_kk_mulai_kas_ibu_awal_bulan
  CHECK (
    mulai_kas_ibu IS NULL
    OR mulai_kas_ibu = date_trunc('month', mulai_kas_ibu::timestamp)::date
  );


-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- BEGIN;
-- ALTER TABLE public.rumah_kk
--   DROP CONSTRAINT IF EXISTS rumah_kk_mulai_kas_ibu_awal_bulan;
-- DROP INDEX IF EXISTS public.periode_satu_aktif;
-- COMMIT;
-- ============================================================
