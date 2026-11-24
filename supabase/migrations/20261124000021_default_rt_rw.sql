-- ============================================================
-- Migration 021: Default RT/RW rumah_kk
-- ============================================================
-- Konteks:
--   Migrasi 001 memasang DEFAULT '005'/'003' pada rumah_kk.rt/rw,
--   sementara aplikasi adalah RT 001 RW 009 Wonoyoso dan form admin
--   tidak mengirim rt/rw. Akibatnya semua rumah baru selalu tercatat
--   005/003.
--
-- Sifat perubahan:
--   DDL metadata (default kolom) saja. Update 53 baris lama dilakukan
--   terpisah sebagai data change, bukan di migrasi ini.
-- ============================================================

ALTER TABLE public.rumah_kk ALTER COLUMN rt SET DEFAULT '001';
ALTER TABLE public.rumah_kk ALTER COLUMN rw SET DEFAULT '009';

COMMENT ON COLUMN public.rumah_kk.rt IS 'Nomor RT (default 001 sesuai wilayah RT 001 RW 009 Wonoyoso).';
COMMENT ON COLUMN public.rumah_kk.rw IS 'Nomor RW (default 009 sesuai wilayah RT 001 RW 009 Wonoyoso).';

-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- ALTER TABLE public.rumah_kk ALTER COLUMN rt SET DEFAULT '005';
-- ALTER TABLE public.rumah_kk ALTER COLUMN rw SET DEFAULT '003';
-- ============================================================
