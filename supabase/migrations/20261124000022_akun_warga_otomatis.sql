-- ============================================================
-- Migration 022: Akun warga otomatis
-- ============================================================
-- Konteks:
--   Admin dapat sekaligus membuat akun login untuk anggota warga
--   (opt-in per baris) saat input manual maupun impor CSV. Pembuatan
--   akun dijalankan Edge Function buat-akun-warga dengan service role.
--   Akun memakai password awal "sirt-rt-<no rumah>" dan wajib diganti
--   saat login pertama.
--
-- Sifat perubahan:
--   DDL metadata: satu kolom baru + satu unique index parsial.
--   Tidak ada baris data yang diubah.
--
-- Pre-check sebelum apply (harus kosong):
--   SELECT warga_id, count(*) FROM public.profil_pengguna
--   WHERE warga_id IS NOT NULL GROUP BY 1 HAVING count(*) > 1;
-- ============================================================

ALTER TABLE public.profil_pengguna
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profil_pengguna.must_change_password IS
  'True bila akun masih memakai password awal buatan admin dan wajib diganti saat login.';

-- Satu akun per anggota warga; akun tanpa tautan tetap boleh banyak.
CREATE UNIQUE INDEX profil_pengguna_warga_unik
  ON public.profil_pengguna (warga_id)
  WHERE warga_id IS NOT NULL;

-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- DROP INDEX IF EXISTS public.profil_pengguna_warga_unik;
-- ALTER TABLE public.profil_pengguna DROP COLUMN IF EXISTS must_change_password;
-- ============================================================
