-- ============================================================
-- Migration 020: Login dengan username
-- ============================================================
-- Konteks:
--   Warga masuk memakai username nomor rumah + nama (mis. a30-siti),
--   admin memakai username "admin". Supabase Auth tetap memakai email
--   sebagai identifier internal; email dibuat sintetis
--   (<username>@sirt.local) sehingga tidak ditampilkan ke warga.
--
-- Sifat perubahan:
--   DDL metadata + satu kolom baru. Backfill hanya baris admin
--   (username 'admin'); username warga diatur admin lewat UI Akun Warga.
--   Tidak ada baris data lain yang diubah.
-- ============================================================

ALTER TABLE public.profil_pengguna
  ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE public.profil_pengguna
  ADD CONSTRAINT profil_pengguna_username_format
  CHECK (username IS NULL OR username ~ '^[a-z0-9][a-z0-9-]{1,29}$');

CREATE UNIQUE INDEX profil_pengguna_username_unik
  ON public.profil_pengguna (lower(username))
  WHERE username IS NOT NULL;

COMMENT ON COLUMN public.profil_pengguna.username IS
  'Username login (huruf kecil, angka, tanda hubung). Email auth bersifat internal/sintetis.';

-- Backfill akun admin yang sudah ada.
UPDATE public.profil_pengguna
SET username = 'admin'
WHERE role = 'admin'
  AND username IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profil_pengguna p2
    WHERE lower(p2.username) = 'admin'
  );

-- Guard 017 diperluas: username juga hanya boleh diubah admin.
CREATE OR REPLACE FUNCTION public.fn_guard_profil_kolom_istimewa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_admin()
     AND (
          NEW.role      IS DISTINCT FROM OLD.role
       OR NEW.warga_id  IS DISTINCT FROM OLD.warga_id
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.username  IS DISTINCT FROM OLD.username
     )
  THEN
    RAISE EXCEPTION 'Hanya admin yang boleh mengubah role, warga_id, username, atau is_active'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Resolusi username -> email internal, dipanggil anonim saat login.
-- Hanya akun aktif; mengembalikan NULL bila tidak ditemukan.
CREATE OR REPLACE FUNCTION public.fn_login_email(p_username TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u.email::text
  FROM public.profil_pengguna p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(p.username) = lower(btrim(p_username))
    AND p.is_active
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.fn_login_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_login_email(TEXT) TO anon, authenticated;

-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- BEGIN;
-- REVOKE ALL ON FUNCTION public.fn_login_email(TEXT) FROM anon, authenticated;
-- DROP FUNCTION IF EXISTS public.fn_login_email(TEXT);
-- DROP TRIGGER IF EXISTS trg_guard_profil_kolom_istimewa ON public.profil_pengguna;
-- CREATE OR REPLACE FUNCTION public.fn_guard_profil_kolom_istimewa() ... (versi 017);
-- CREATE TRIGGER trg_guard_profil_kolom_istimewa
--   BEFORE UPDATE ON public.profil_pengguna
--   FOR EACH ROW EXECUTE FUNCTION public.fn_guard_profil_kolom_istimewa();
-- DROP INDEX IF EXISTS public.profil_pengguna_username_unik;
-- ALTER TABLE public.profil_pengguna DROP CONSTRAINT profil_pengguna_username_format;
-- ALTER TABLE public.profil_pengguna DROP COLUMN username;
-- COMMIT;
-- ============================================================
