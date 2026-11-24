-- ============================================================
-- Migration 016: Mulai kewajiban Kas Ibu per rumah
-- ============================================================
-- Konteks:
--   Kas Ibu mulai berjalan Agustus 2026 untuk seluruh rumah yang sudah
--   ditempati. Rumah yang baru ditempati setelah Agustus tetap dianggap
--   menunggak Agustus–Oktober oleh halaman "Cek Tagihan" karena bulan
--   mulai kewajiban hanya diatur global di RT_CONFIG.
--
--   Kolom ini menyimpan bulan mulai kewajiban per rumah. NULL berarti
--   rumah mengikuti aturan global (wajib sejak Agustus). Bila diisi,
--   kewajiban dimulai dari bulan tanggal tersebut, tetapi tidak pernah
--   lebih awal dari Agustus.
--
-- Sifat perubahan:
--   DDL saja (tambah kolom nullable). Tidak ada baris kas/pengeluaran
--   yang diubah. Perubahan nilai kolom tercatat di audit_log lewat
--   trg_audit_rumah_kk yang sudah ada.
--
-- Contoh pengisian:
--   A29 baru ditempati Oktober 2026 -> mulai_kas_ibu = DATE '2026-10-01'
--   A2  baru ditempati November 2026 -> mulai_kas_ibu = DATE '2026-11-01'
-- ============================================================

ALTER TABLE public.rumah_kk
  ADD COLUMN IF NOT EXISTS mulai_kas_ibu DATE;

COMMENT ON COLUMN public.rumah_kk.mulai_kas_ibu IS
  'Bulan mulai kewajiban Kas Ibu untuk rumah ini. NULL = ikut aturan global (Agustus). Hanya bulan & tahun yang dipakai.';

-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- ALTER TABLE public.rumah_kk DROP COLUMN IF EXISTS mulai_kas_ibu;
-- ============================================================