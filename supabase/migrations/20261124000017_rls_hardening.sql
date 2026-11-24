-- ============================================================
-- Migration 017: RLS hardening + search_path
-- ============================================================
-- Konteks (review skema 2026-11-24):
--   1. Policy UPDATE profil_pengguna tidak membatasi kolom, sehingga user
--      yang login bisa mengubah role/warga_id/is_active miliknya sendiri
--      (privilege escalation).
--   2. fn_handle_new_user mempercayai raw_user_meta_data->>'role',
--      sehingga signup bisa memilih role admin.
--   3. Admin tidak bisa INSERT surat_pengantar: hanya ada policy UPDATE
--      untuk admin, sedangkan INSERT mensyaratkan warga_id milik sendiri.
--   4. Policy tulis grup_pengeluaran terbuka untuk semua user login,
--      tidak konsisten dengan pengeluaran_kas yang admin-only.
--   5. Fungsi SECURITY DEFINER tanpa search_path tetap.
--
-- Sifat perubahan:
--   DDL metadata (function, trigger, policy). Tidak ada baris data yang
--   diubah atau dihapus. Invarian berbasis data (unique periode aktif,
--   CHECK mulai_kas_ibu) ada di migrasi 019 agar kegagalan validasi data
--   tidak memblokir patch keamanan ini.
--
-- Dependensi:
--   - public.fn_audit_trigger() (005)
--   - public.current_user_role(), public.is_admin() (006)
--   - public.current_user_rumah_id() (007)
-- ============================================================


-- ========================
-- 1. search_path fungsi SECURITY DEFINER
-- ========================

ALTER FUNCTION public.fn_audit_trigger()      SET search_path = public;
ALTER FUNCTION public.current_user_role()     SET search_path = public;
ALTER FUNCTION public.is_admin()              SET search_path = public;
ALTER FUNCTION public.current_user_rumah_id() SET search_path = public;


-- ========================
-- 2. Signup tidak boleh memilih role
-- ========================
-- Role selalu 'warga'. Promosi admin dilakukan manual (SQL Editor /
-- service role), bukan lewat metadata yang dikirim pendaftar.

CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profil_pengguna (id, nama_tampilan, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_tampilan', split_part(NEW.email, '@', 1)),
    'warga'::public.role_pengguna
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- ========================
-- 3. Guard kolom istimewa profil_pengguna
-- ========================
-- Guard hanya aktif bila request membawa JWT (auth.uid() terisi).
-- Akses maintenance via SQL Editor atau service role (auth.uid() NULL)
-- tetap bisa mengubah role/warga_id/is_active.

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
     )
  THEN
    RAISE EXCEPTION 'Hanya admin yang boleh mengubah role, warga_id, atau is_active'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profil_kolom_istimewa ON public.profil_pengguna;
CREATE TRIGGER trg_guard_profil_kolom_istimewa
  BEFORE UPDATE ON public.profil_pengguna
  FOR EACH ROW EXECUTE FUNCTION public.fn_guard_profil_kolom_istimewa();


-- ========================
-- 4. Admin boleh membuat surat pengantar
-- ========================
-- Policy lama hanya mengizinkan INSERT untuk warga_id milik sendiri,
-- sementara form admin memilih warga mana pun.

DROP POLICY IF EXISTS surat_admin_insert ON public.surat_pengantar;
CREATE POLICY surat_admin_insert ON public.surat_pengantar
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());


-- ========================
-- 5. grup_pengeluaran admin-only untuk tulis
-- ========================
-- SELECT tetap publik; INSERT/UPDATE/DELETE disamakan dengan
-- pengeluaran_kas yang sudah admin-only.

DROP POLICY IF EXISTS grup_pengeluaran_insert ON public.grup_pengeluaran;
DROP POLICY IF EXISTS grup_pengeluaran_update ON public.grup_pengeluaran;
DROP POLICY IF EXISTS grup_pengeluaran_delete ON public.grup_pengeluaran;

CREATE POLICY grup_pengeluaran_admin_insert ON public.grup_pengeluaran
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY grup_pengeluaran_admin_update ON public.grup_pengeluaran
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY grup_pengeluaran_admin_delete ON public.grup_pengeluaran
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- BEGIN;
-- DROP POLICY IF EXISTS grup_pengeluaran_admin_insert ON public.grup_pengeluaran;
-- DROP POLICY IF EXISTS grup_pengeluaran_admin_update ON public.grup_pengeluaran;
-- DROP POLICY IF EXISTS grup_pengeluaran_admin_delete ON public.grup_pengeluaran;
-- CREATE POLICY grup_pengeluaran_insert ON public.grup_pengeluaran
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- CREATE POLICY grup_pengeluaran_update ON public.grup_pengeluaran
--   FOR UPDATE USING (auth.uid() IS NOT NULL);
-- CREATE POLICY grup_pengeluaran_delete ON public.grup_pengeluaran
--   FOR DELETE USING (auth.uid() IS NOT NULL);
-- DROP POLICY IF EXISTS surat_admin_insert ON public.surat_pengantar;
-- DROP TRIGGER IF EXISTS trg_guard_profil_kolom_istimewa ON public.profil_pengguna;
-- DROP FUNCTION IF EXISTS public.fn_guard_profil_kolom_istimewa();
-- -- fn_handle_new_user dan search_path dibiarkan (pengembalian manual).
-- COMMIT;
-- ============================================================
