-- ============================================================
-- Migration 025: View publik keanggotaan arisan
-- ============================================================
-- Konteks:
--   Tagihan publik/warga dihitung di client dengan anon key. Sejak 023,
--   dasar kewajiban arisan adalah keanggotaan ronde (arisan_anggota),
--   bukan lagi flag boolean rumah_kk.ikut_arisan. Tabel arisan_anggota
--   sengaja admin-only, sehingga anon butuh view terbatas.
--
--   View hanya membuka kolom yang diperlukan untuk menghitung tagihan:
--   rumah mana, di ronde mana, kapan ronde mulai, dan berapa anggotanya
--   (durasi ronde = jumlah anggota). Tidak ada catatan pribadi.
--
-- Sifat perubahan:
--   DDL metadata saja. Tidak ada baris data yang diubah.
--
-- Dependensi:
--   - public.arisan_anggota, public.arisan_ronde (023)
-- ============================================================

CREATE OR REPLACE VIEW public.v_arisan_anggota_publik AS
SELECT
  a.rumah_id,
  a.ronde_id,
  r.nomor AS ronde_nomor,
  r.tanggal_mulai,
  r.tanggal_selesai,
  (
    SELECT count(*)::int
    FROM public.arisan_anggota x
    WHERE x.ronde_id = a.ronde_id
  ) AS jumlah_anggota
FROM public.arisan_anggota a
JOIN public.arisan_ronde r ON r.id = a.ronde_id;

COMMENT ON VIEW public.v_arisan_anggota_publik IS
  'Keanggotaan ronde arisan untuk perhitungan tagihan publik. Diturunkan dari arisan_anggota yang admin-only.';

REVOKE ALL ON public.v_arisan_anggota_publik FROM anon, authenticated;
GRANT SELECT ON public.v_arisan_anggota_publik TO anon, authenticated;


-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- DROP VIEW IF EXISTS public.v_arisan_anggota_publik;
-- ============================================================
