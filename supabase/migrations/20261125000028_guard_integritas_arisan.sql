-- ============================================================
-- Migration 028: Integritas arisan di lapisan database
-- ============================================================
-- Konteks:
--   023/026 sudah menutup jalur utama (RPC simpan putaran memvalidasi
--   pemenang sebagai anggota ronde, form rumah tidak lagi mengatur
--   ikut_arisan). Dua lubang masih terbuka bagi admin yang menulis
--   langsung lewat REST/SQL:
--     1. Menghapus baris pengeluaran_kas yang menyalurkan pot arisan.
--        FK arisan_putaran.pengeluaran_id memakai ON DELETE SET NULL,
--        sehingga putaran kembali tampak "belum disalurkan" padahal uang
--        sudah keluar. Sumber dana juga masih bisa diubah menjadi bukan
--        'Arisan' sehingga saldo arisan dan buku kas berbeda.
--     2. Mencatat setoran kas_bulanan tipe 'Arisan' untuk rumah yang
--        bukan peserta, sehingga pot terkumpul dari rumah yang tidak
--        berhak menerima undian.
--
-- Perubahan:
--   1. fn_guard_pengeluaran_arisan + trg_guard_pengeluaran_arisan:
--      tolak DELETE dan perubahan sumber_dana dari 'Arisan' untuk
--      pengeluaran yang tertaut ke arisan_putaran.
--   2. fn_guard_kas_arisan + trg_guard_kas_arisan:
--      tolak INSERT/UPDATE setoran Arisan untuk rumah yang bukan
--      anggota ronde yang mencakup bulan setoran. Bila belum ada ronde
--      yang mencakup bulan itu (mis. bulan sebelum ronde pertama),
--      peserta ditentukan dari rumah_kk.ikut_arisan.
--
-- Catatan keanggotaan:
--   Ronde dicari dengan aturan yang sama seperti fn_simpan_arisan_putaran
--   dan engine tagihan (bulan yang tumpang tindih memakai ronde terbaru).
--   UPDATE rumah/tipe pada baris lama tidak divalidasi ulang agar koreksi
--   historis (mis. membatalkan status bayar) tetap bisa dilakukan.
--
-- Bypass maintenance:
--   Sama seperti fn_guard_arisan_anggota (023), auth.uid() NULL (SQL
--   Editor/service role) diizinkan untuk perbaikan darurat.
--
-- Sifat perubahan:
--   Hanya CREATE OR REPLACE FUNCTION + CREATE TRIGGER. Tidak ada baris
--   data yang diubah.
--
-- Dependensi:
--   - public.arisan_ronde, public.arisan_anggota (023)
--   - public.arisan_putaran, public.pengeluaran_kas (015)
--   - public.kas_bulanan, public.rumah_kk (002)
-- ============================================================


-- ========================
-- GUARD: pengeluaran pot arisan
-- ========================

CREATE OR REPLACE FUNCTION public.fn_guard_pengeluaran_arisan()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_putaran  public.arisan_putaran;
  v_no_rumah TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT *
    INTO v_putaran
  FROM public.arisan_putaran
  WHERE pengeluaran_id = OLD.id;

  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT no_rumah
    INTO v_no_rumah
  FROM public.rumah_kk
  WHERE id = v_putaran.pemenang_rumah_id;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION
      'Pengeluaran ini menyalurkan pot arisan %/% (Rumah %). Putaran tidak boleh ditinggalkan tanpa penyaluran.',
      v_putaran.bulan, v_putaran.tahun, COALESCE(v_no_rumah, '?')
      USING ERRCODE = '23503';
  END IF;

  IF NEW.sumber_dana <> 'Arisan' THEN
    RAISE EXCEPTION
      'Pengeluaran ini menyalurkan pot arisan %/% (Rumah %) sehingga sumber dana harus tetap Arisan.',
      v_putaran.bulan, v_putaran.tahun, COALESCE(v_no_rumah, '?')
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_guard_pengeluaran_arisan() IS
  'Menolak hapus/perubahan sumber dana pengeluaran yang menyalurkan pot arisan; auth.uid() NULL (maintenance) dikecualikan.';

CREATE TRIGGER trg_guard_pengeluaran_arisan
  BEFORE UPDATE OR DELETE ON public.pengeluaran_kas
  FOR EACH ROW EXECUTE FUNCTION public.fn_guard_pengeluaran_arisan();


-- ========================
-- GUARD: setoran arisan non-peserta
-- ========================

CREATE OR REPLACE FUNCTION public.fn_guard_kas_arisan()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_ronde_id UUID;
  v_peserta  BOOLEAN;
  v_no_rumah TEXT;
BEGIN
  IF NEW.tipe_kas <> 'Arisan' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Koreksi baris lama (rumah & tipe tidak berubah) tetap diizinkan.
  IF TG_OP = 'UPDATE'
     AND OLD.tipe_kas = 'Arisan'
     AND OLD.rumah_id = NEW.rumah_id
  THEN
    RETURN NEW;
  END IF;

  SELECT r.id
    INTO v_ronde_id
  FROM public.arisan_ronde r
  WHERE date_trunc('month', r.tanggal_mulai::timestamp)::date
          <= make_date(NEW.tahun, NEW.bulan, 1)
    AND (
      r.tanggal_selesai IS NULL
      OR make_date(NEW.tahun, NEW.bulan, 1)
         <= date_trunc('month', r.tanggal_selesai::timestamp)::date
    )
  ORDER BY r.tanggal_mulai DESC
  LIMIT 1;

  IF v_ronde_id IS NOT NULL THEN
    v_peserta := EXISTS (
      SELECT 1
      FROM public.arisan_anggota a
      WHERE a.ronde_id = v_ronde_id
        AND a.rumah_id = NEW.rumah_id
    );
  ELSE
    -- Bulan di luar cakupan ronde (mis. sebelum ronde pertama): pakai
    -- cermin keanggotaan terakhir.
    SELECT COALESCE(ikut_arisan, false)
      INTO v_peserta
    FROM public.rumah_kk
    WHERE id = NEW.rumah_id;
    v_peserta := COALESCE(v_peserta, false);
  END IF;

  IF NOT v_peserta THEN
    SELECT no_rumah
      INTO v_no_rumah
    FROM public.rumah_kk
    WHERE id = NEW.rumah_id;

    RAISE EXCEPTION
      'Rumah % bukan peserta arisan pada %/%; setoran Arisan tidak boleh dicatat.',
      COALESCE(v_no_rumah, NEW.rumah_id::text), NEW.bulan, NEW.tahun
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_guard_kas_arisan() IS
  'Menolak setoran kas Arisan untuk rumah yang bukan anggota ronde pada bulan setoran (fallback ikut_arisan bila belum ada ronde).';

CREATE TRIGGER trg_guard_kas_arisan
  BEFORE INSERT OR UPDATE ON public.kas_bulanan
  FOR EACH ROW EXECUTE FUNCTION public.fn_guard_kas_arisan();


-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_guard_kas_arisan ON public.kas_bulanan;
-- DROP TRIGGER IF EXISTS trg_guard_pengeluaran_arisan ON public.pengeluaran_kas;
-- DROP FUNCTION IF EXISTS public.fn_guard_kas_arisan();
-- DROP FUNCTION IF EXISTS public.fn_guard_pengeluaran_arisan();
-- COMMIT;
-- ============================================================
