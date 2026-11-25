-- ============================================================
-- Migration 027: Hunian menentukan tagihan (kasus rumah kosong)
-- ============================================================
-- Konteks:
--   024 sudah menyimpan riwayat masa hunian di rumah_hunian, tetapi
--   belum dipakai kode mana pun. Akibatnya:
--     - engine tagihan berhenti total saat rumah berstatus Kosong,
--       sehingga tunggakan bulan-bulan saat masih dihuni ikut hilang;
--     - kas berjalan tanpa tanggal berhenti, padahal rumah kosong tidak
--       boleh ditagih Kas Ibu maupun iuran Arisan mulai bulan kosong;
--     - saat rumah dihuni lagi, tidak ada cara menentukan apakah
--       tunggakan periode lama ikut ditagihkan.
--
--   "Tanggal kosong" disimpan sebagai tanggal_selesai periode terbuka
--   (sesuai komentar 024, tanpa kolom terpisah).
--
-- Perubahan:
--   1. View anon/authenticated v_rumah_hunian_publik (tanpa catatan)
--      agar engine tagihan publik bisa tahu bulan mana rumah dihuni.
--   2. fn_kosongkan_rumah: menutup periode terbuka + status Kosong.
--   3. fn_huni_rumah: membuka periode baru + status hunian + mulai kas.
--      Menghormati tunggakan_dialihkan untuk engine tagihan.
--
-- Aturan bulan (dipakai engine, bukan DB):
--   - Bulan mulai hunian ditagih penuh.
--   - Bulan tanggal kosong TIDAK ditagih; tagihan berhenti di bulan
--     sebelumnya, berapa pun tanggal kosongnya.
--
-- Sifat perubahan:
--   View + dua fungsi baru. Tidak ada baris data yang diubah.
--
-- Dependensi:
--   - public.rumah_hunian, public.rumah_kk (024)
--   - public.is_admin() (006)
-- ============================================================

CREATE OR REPLACE VIEW public.v_rumah_hunian_publik AS
SELECT rumah_id,
       tanggal_mulai,
       tanggal_selesai,
       tunggakan_dialihkan
FROM public.rumah_hunian;

COMMENT ON VIEW public.v_rumah_hunian_publik IS
  'Periode hunian untuk perhitungan tagihan publik. Diturunkan dari rumah_hunian yang admin-only; catatan tidak diekspos.';

REVOKE ALL ON public.v_rumah_hunian_publik FROM anon, authenticated;
GRANT SELECT ON public.v_rumah_hunian_publik TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.fn_kosongkan_rumah(
  p_rumah_id       UUID,
  p_tanggal_kosong DATE,
  p_catatan        TEXT DEFAULT NULL
)
RETURNS public.rumah_hunian
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_rumah   public.rumah_kk;
  v_periode public.rumah_hunian;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh mengosongkan rumah'
      USING ERRCODE = '42501';
  END IF;

  IF p_tanggal_kosong IS NULL THEN
    RAISE EXCEPTION 'Tanggal kosong wajib diisi' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_rumah
  FROM public.rumah_kk
  WHERE id = p_rumah_id AND is_active;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rumah tidak ditemukan atau tidak aktif'
      USING ERRCODE = '22023';
  END IF;

  IF v_rumah.status_hunian = 'Kosong' THEN
    RAISE EXCEPTION 'Rumah % sudah berstatus Kosong', v_rumah.no_rumah
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_periode
  FROM public.rumah_hunian
  WHERE rumah_id = p_rumah_id AND tanggal_selesai IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rumah % belum punya periode hunian aktif', v_rumah.no_rumah
      USING ERRCODE = '22023';
  END IF;

  IF p_tanggal_kosong <= v_periode.tanggal_mulai THEN
    RAISE EXCEPTION 'Tanggal kosong harus setelah tanggal mulai hunian %',
      v_periode.tanggal_mulai USING ERRCODE = '22023';
  END IF;

  UPDATE public.rumah_hunian
     SET tanggal_selesai = p_tanggal_kosong,
         catatan = COALESCE(p_catatan, catatan)
   WHERE id = v_periode.id
   RETURNING * INTO v_periode;

  UPDATE public.rumah_kk
     SET status_hunian = 'Kosong'
   WHERE id = p_rumah_id;

  RETURN v_periode;
END;
$$;

COMMENT ON FUNCTION public.fn_kosongkan_rumah(UUID, DATE, TEXT) IS
  'Menutup periode hunian terbuka pada tanggal kosong dan menandai rumah Kosong. Tagihan berhenti sebelum bulan tanggal kosong.';


CREATE OR REPLACE FUNCTION public.fn_huni_rumah(
  p_rumah_id            UUID,
  p_tanggal_mulai       DATE,
  p_status_hunian       public.status_hunian,
  p_tunggakan_dialihkan BOOLEAN DEFAULT TRUE,
  p_mulai_kas_ibu       DATE DEFAULT NULL,
  p_catatan             TEXT DEFAULT NULL
)
RETURNS public.rumah_hunian
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_rumah   public.rumah_kk;
  v_periode public.rumah_hunian;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh mencatat hunian rumah'
      USING ERRCODE = '42501';
  END IF;

  IF p_status_hunian = 'Kosong' THEN
    RAISE EXCEPTION 'Status Kosong memakai fn_kosongkan_rumah'
      USING ERRCODE = '22023';
  END IF;

  IF p_tanggal_mulai IS NULL THEN
    RAISE EXCEPTION 'Tanggal mulai hunian wajib diisi' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_rumah
  FROM public.rumah_kk
  WHERE id = p_rumah_id AND is_active;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rumah tidak ditemukan atau tidak aktif'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.rumah_hunian
    WHERE rumah_id = p_rumah_id AND tanggal_selesai IS NULL
  ) THEN
    RAISE EXCEPTION 'Rumah % masih punya periode hunian terbuka', v_rumah.no_rumah
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.rumah_hunian
    WHERE rumah_id = p_rumah_id
      AND tanggal_selesai IS NOT NULL
      AND tanggal_selesai > p_tanggal_mulai
  ) THEN
    RAISE EXCEPTION 'Tanggal mulai hunian harus setelah periode hunian sebelumnya berakhir'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.rumah_hunian (rumah_id, tanggal_mulai, tunggakan_dialihkan, catatan)
  VALUES (p_rumah_id, p_tanggal_mulai, p_tunggakan_dialihkan, p_catatan)
  RETURNING * INTO v_periode;

  UPDATE public.rumah_kk
     SET status_hunian = p_status_hunian,
         mulai_kas_ibu = COALESCE(
           p_mulai_kas_ibu,
           date_trunc('month', p_tanggal_mulai::timestamp)::date
         )
   WHERE id = p_rumah_id;

  RETURN v_periode;
END;
$$;

COMMENT ON FUNCTION public.fn_huni_rumah(UUID, DATE, public.status_hunian, BOOLEAN, DATE, TEXT) IS
  'Membuka periode hunian baru, mengatur status hunian, dan default mulai_kas_ibu ke awal bulan tanggal mulai.';


REVOKE EXECUTE ON FUNCTION public.fn_kosongkan_rumah(UUID, DATE, TEXT)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_huni_rumah(UUID, DATE, public.status_hunian, BOOLEAN, DATE, TEXT)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fn_kosongkan_rumah(UUID, DATE, TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_huni_rumah(UUID, DATE, public.status_hunian, BOOLEAN, DATE, TEXT)
  TO authenticated;


-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.fn_huni_rumah(UUID, DATE, public.status_hunian, BOOLEAN, DATE, TEXT);
-- DROP FUNCTION IF EXISTS public.fn_kosongkan_rumah(UUID, DATE, TEXT);
-- DROP VIEW IF EXISTS public.v_rumah_hunian_publik;
-- -- Baris rumah_hunian dan status rumah tidak dikembalikan otomatis.
-- COMMIT;
-- ============================================================
