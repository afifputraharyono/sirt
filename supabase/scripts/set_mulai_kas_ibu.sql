-- ============================================================
-- Data: mulai kewajiban Kas Ibu untuk rumah yang baru ditempati
-- setelah kas berjalan (Agustus 2026).
--   A29 -> mulai Oktober 2026
--   A2  -> mulai November 2026
-- ============================================================
-- PRE-CHECK (jalankan dulu, read-only, tanpa BEGIN):
--   SELECT no_rumah, status_hunian, is_active, mulai_kas_ibu
--   FROM public.rumah_kk
--   WHERE no_rumah IN ('A2', 'A02', 'A29');
--
-- Butuh migrasi 016 (kolom rumah_kk.mulai_kas_ibu).
-- ============================================================

BEGIN;

UPDATE public.rumah_kk
   SET mulai_kas_ibu = DATE '2026-10-01'
 WHERE no_rumah = 'A29';

UPDATE public.rumah_kk
   SET mulai_kas_ibu = DATE '2026-11-01'
 WHERE no_rumah IN ('A2', 'A02');

-- Verifikasi: harus muncul 2 baris (A29 dan A2).
SELECT no_rumah, status_hunian, is_active, mulai_kas_ibu
FROM public.rumah_kk
WHERE no_rumah IN ('A2', 'A02', 'A29')
ORDER BY no_rumah;

COMMIT;