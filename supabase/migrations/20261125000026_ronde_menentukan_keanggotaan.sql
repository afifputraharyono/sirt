-- ============================================================
-- Migration 026: Ronde menentukan keanggotaan arisan
-- ============================================================
-- Konteks:
--   023 menjadikan arisan_anggota sumber kebenaran keanggotaan ronde,
--   tetapi fn_mulai_arisan_ronde masih menolak rumah dengan
--   rumah_kk.ikut_arisan = false. Artinya centang lama di form rumah
--   tetap menjadi syarat masuk ronde.
--
--   Fase 3 memindahkan pengelolaan peserta ke alur ronde: form rumah
--   tidak lagi punya centang arisan, admin memilih anggota saat
--   memulai ronde. Flag ikut_arisan tetap dipakai tab pembayaran
--   arisan (IbuArisanTab) dan label portal warga, jadi nilainya harus
--   dicerminkan dari roster ronde.
--
-- Perubahan:
--   1. Validasi anggota ronde cukup: rumah ada, aktif, tidak Kosong.
--   2. Setelah anggota ronde disimpan, sinkronkan
--      rumah_kk.ikut_arisan dalam transaksi yang sama:
--      true untuk anggota ronde baru, false untuk rumah lain.
--      Hanya baris yang berubah nilai yang disentuh.
--   3. Komentar kolom ikut_arisan diperbarui.
--
-- Sifat perubahan:
--   CREATE OR REPLACE FUNCTION + COMMENT, tanpa DDL tabel dan tanpa
--   menyentuh baris data saat migrasi diterapkan (sinkronisasi hanya
--   terjadi ketika ronde baru dimulai). Signature fungsi sama dengan
--   023 sehingga GRANT/REVOKE lama tetap berlaku.
--
-- Dependensi:
--   - public.fn_mulai_arisan_ronde (023)
--   - public.rumah_kk, public.arisan_anggota, public.arisan_ronde
-- ============================================================


CREATE OR REPLACE FUNCTION public.fn_mulai_arisan_ronde(
  p_tanggal_mulai DATE,
  p_anggota       UUID[],
  p_catatan       TEXT DEFAULT NULL
)
RETURNS public.arisan_ronde
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ronde    public.arisan_ronde;
  v_nomor    INT;
  v_invalid  TEXT;
  v_dobel    INT;
  v_jml      INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh memulai ronde arisan'
      USING ERRCODE = '42501';
  END IF;

  IF p_tanggal_mulai IS NULL
     OR p_tanggal_mulai <> date_trunc('month', p_tanggal_mulai::timestamp)::date
  THEN
    RAISE EXCEPTION 'Tanggal mulai ronde harus tanggal 1' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.arisan_ronde WHERE tanggal_selesai IS NULL) THEN
    RAISE EXCEPTION 'Masih ada ronde berjalan; tutup dulu sebelum memulai ronde baru'
      USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.arisan_ronde WHERE tanggal_mulai >= p_tanggal_mulai
  ) THEN
    RAISE EXCEPTION 'Tanggal mulai harus setelah ronde sebelumnya' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.arisan_ronde
    WHERE tanggal_selesai IS NOT NULL
      AND p_tanggal_mulai <= date_trunc('month', tanggal_selesai::timestamp)::date
  ) THEN
    RAISE EXCEPTION 'Ronde baru harus mulai setelah bulan ronde sebelumnya ditutup'
      USING ERRCODE = '22023';
  END IF;

  IF p_anggota IS NULL OR cardinality(p_anggota) = 0 THEN
    RAISE EXCEPTION 'Ronde harus punya minimal satu anggota' USING ERRCODE = '22023';
  END IF;

  SELECT count(DISTINCT x.rumah_id) INTO v_dobel
  FROM unnest(p_anggota) AS x(rumah_id);

  IF v_dobel <> cardinality(p_anggota) THEN
    RAISE EXCEPTION 'Daftar anggota ronde memuat rumah duplikat' USING ERRCODE = '22023';
  END IF;

  SELECT string_agg(x.rumah_id::text, ', ') INTO v_invalid
  FROM unnest(p_anggota) AS x(rumah_id)
  LEFT JOIN public.rumah_kk r ON r.id = x.rumah_id
  WHERE r.id IS NULL
     OR NOT r.is_active
     OR r.status_hunian = 'Kosong';

  IF v_invalid IS NOT NULL THEN
    RAISE EXCEPTION 'Rumah tidak valid sebagai anggota ronde (tidak aktif atau kosong): %',
      v_invalid USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(max(nomor), 0) + 1 INTO v_nomor FROM public.arisan_ronde;

  INSERT INTO public.arisan_ronde (nomor, tanggal_mulai, catatan, dicatat_oleh)
  VALUES (v_nomor, p_tanggal_mulai, p_catatan, auth.uid())
  RETURNING * INTO v_ronde;

  -- Membuka kunci keanggotaan hanya untuk transaksi ini.
  PERFORM set_config('sirt.arisan_ronde_baru', '1', true);

  INSERT INTO public.arisan_anggota (ronde_id, rumah_id)
  SELECT v_ronde.id, x.rumah_id
  FROM unnest(p_anggota) AS x(rumah_id);

  GET DIAGNOSTICS v_jml = ROW_COUNT;

  PERFORM set_config('sirt.arisan_ronde_baru', '0', true);

  -- Flag ikut_arisan mengikuti roster ronde terbaru. Dipakai tab
  -- pembayaran arisan dan label portal, bukan lagi input manual.
  UPDATE public.rumah_kk r
     SET ikut_arisan = (r.id = ANY (p_anggota))
   WHERE r.ikut_arisan IS DISTINCT FROM (r.id = ANY (p_anggota));

  RAISE NOTICE 'Ronde % dimulai dengan % anggota', v_ronde.nomor, v_jml;

  RETURN v_ronde;
END;
$$;


COMMENT ON COLUMN public.rumah_kk.ikut_arisan IS
  'Cermin keanggotaan ronde arisan terakhir; disinkronkan oleh fn_mulai_arisan_ronde dan tidak diubah manual dari form rumah.';


-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- CREATE OR REPLACE FUNCTION public.fn_mulai_arisan_ronde(
--   p_tanggal_mulai DATE, p_anggota UUID[], p_catatan TEXT DEFAULT NULL
-- ) ... salin definisi dari 20261125000023_arisan_ronde.sql ...
-- COMMENT ON COLUMN public.rumah_kk.ikut_arisan IS
--   'Calon peserta ronde berikutnya. Perubahan flag tidak memengaruhi ronde berjalan; susunan anggota ronde ada di arisan_anggota.';
-- ============================================================
