-- ============================================================
-- Migration 024: Periode hunian rumah
-- ============================================================
-- Konteks:
--   Status hunian saat ini hanya tersimpan sebagai nilai terakhir di
--   rumah_kk.status_hunian. Tidak ada riwayat kapan rumah kosong, kapan
--   dihuni lagi, dan siapa yang menanggung tunggakan saat penghuni
--   berganti. Untuk kas ibu dan arisan, informasi itu dibutuhkan agar:
--     - rumah yang lama kosong tidak menagih penghuni baru sejak lama,
--     - tunggakan dapat mengikuti rumah (penghuni berganti langsung)
--       atau berhenti bersama periode lama (rumah dikontrakkan lama).
--
--   Migrasi ini hanya menyiapkan model periode; belum ada perubahan
--   perilaku tagihan (itu Fase 5). Satu periode = satu masa hunian:
--     - tanggal_selesai NULL  -> masih dihuni (periode terbuka),
--     - tanggal_selesai terisi -> berakhir pada tanggal tersebut,
--     - tunggakan_dialihkan    -> apakah tunggakan periode sebelumnya
--                                 dibebankan ke periode ini.
--
--   Tanggal kosong yang diminta pengurus disimpan sebagai
--   tanggal_selesai periode yang ditutup; tidak ada kolom terpisah.
--
-- Sifat perubahan:
--   DDL + DML backfill:
--     - satu tabel baru (rumah_hunian) dengan exclusion constraint
--       anti-tumpang-tindih per rumah,
--     - backfill satu periode terbuka untuk setiap rumah yang statusnya
--       bukan 'Kosong' (tanggal mulai didekati dari created_at),
--     - tidak ada baris rumah_kk/kas_bulanan yang diubah.
--
-- Pre-check read-only (production 2026-11-25):
--   SELECT status_hunian, count(*) FROM public.rumah_kk GROUP BY 1;
--   -- 43 non-kosong (dapat periode terbuka), 10 Kosong (tanpa periode)
--
-- Dependensi:
--   - public.rumah_kk (001)
--   - ekstensi btree_gist (tersedia di Supabase; dipasang di schema extensions)
--   - public.fn_update_timestamp() (001), public.fn_audit_trigger() (005),
--     public.is_admin() (006)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;


-- ========================
-- TABEL: rumah_hunian
-- ========================

CREATE TABLE public.rumah_hunian (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rumah_id          UUID NOT NULL REFERENCES public.rumah_kk(id) ON DELETE RESTRICT,
  tanggal_mulai     DATE NOT NULL,
  tanggal_selesai   DATE,
  tunggakan_dialihkan BOOLEAN NOT NULL DEFAULT true,
  catatan           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT rumah_hunian_periode_valid
    CHECK (tanggal_selesai IS NULL OR tanggal_selesai > tanggal_mulai),

  -- Dua periode untuk rumah yang sama tidak boleh beririsan.
  -- Periode terbuka dianggap berakhir tak terhingga.
  CONSTRAINT rumah_hunian_tidak_tumpang_tindih EXCLUDE USING gist (
    rumah_id WITH =,
    daterange(tanggal_mulai, tanggal_selesai) WITH &&
  )
);

CREATE INDEX idx_rumah_hunian_rumah ON public.rumah_hunian(rumah_id);

COMMENT ON TABLE public.rumah_hunian IS
  'Riwayat masa hunian per rumah. Periode terbuka (tanggal_selesai NULL) = rumah sedang dihuni.';

COMMENT ON COLUMN public.rumah_hunian.tunggakan_dialihkan IS
  'True: tunggakan periode sebelumnya mengikuti rumah dan menjadi tanggungan periode ini. False: tunggakan tidak dibebankan ke penghuni pada periode ini.';

CREATE TRIGGER trg_updated_at_rumah_hunian
  BEFORE UPDATE ON public.rumah_hunian
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();

CREATE TRIGGER trg_audit_rumah_hunian
  AFTER INSERT OR UPDATE OR DELETE ON public.rumah_hunian
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();


-- ========================
-- BACKFILL PERIODE TERBUKA
-- ========================
-- Tanggal mulai hunian lama tidak tercatat. created_at rumah dipakai
-- sebagai pendekatan paling konservatif (tidak mengarang tanggal lebih
-- awal). Rumah berstatus Kosong tidak diberi periode karena memang tidak
-- ada penghuni; periode baru dibuat saat rumah dihuni lagi (Fase 5).

DO $$
DECLARE
  v_baris INT;
BEGIN
  INSERT INTO public.rumah_hunian (rumah_id, tanggal_mulai, catatan)
  SELECT r.id,
         date_trunc('month', r.created_at AT TIME ZONE 'Asia/Jakarta')::date,
         'Backfill migrasi 024 — tanggal mulai tidak tercatat'
  FROM public.rumah_kk r
  WHERE r.status_hunian <> 'Kosong'
    AND NOT EXISTS (
      SELECT 1 FROM public.rumah_hunian h WHERE h.rumah_id = r.id
    );

  GET DIAGNOSTICS v_baris = ROW_COUNT;
  RAISE NOTICE 'Backfill rumah_hunian: % periode terbuka', v_baris;
END $$;


-- ========================
-- RLS
-- ========================
-- Riwayat hunian hanya untuk admin; tidak dibuka ke anon/warga.

ALTER TABLE public.rumah_hunian ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rumah_hunian_admin_all" ON public.rumah_hunian
  FOR ALL USING (public.is_admin());

REVOKE ALL ON public.rumah_hunian FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rumah_hunian TO authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.rumah_hunian FROM authenticated;


-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS public.rumah_hunian;  -- trigger ikut terhapus
-- -- Ekstensi btree_gist dibiarkan; dipakai objek lain bila ada.
-- COMMIT;
-- ============================================================
