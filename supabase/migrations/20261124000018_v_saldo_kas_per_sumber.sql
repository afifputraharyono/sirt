-- ============================================================
-- Migration 018: v_saldo_kas satu pass + saldo per sumber
-- ============================================================
-- Konteks (review skema 2026-11-24):
--   Definisi lama menjalankan 10 scalar subquery: kas_bulanan dipindai
--   3 kali, pengeluaran_kas 5 kali. Selain lambat, aturan "arisan tidak
--   masuk saldo utama" hanya ada di aplikasi dan diulang di 4 tempat.
--
-- Isi migrasi:
--   1. Satu pass agregasi (4 scan: kas_bulanan, jimpitan_harian,
--      iuran_insidental_detail, pengeluaran_kas) dengan FILTER.
--   2. Kolom baru di akhir view:
--        total_masuk              pemasukan kas utama (tanpa arisan)
--        total_pengeluaran_utama  pengeluaran kas utama (tanpa arisan)
--        saldo_utama              total_masuk - total_pengeluaran_utama
--        saldo_kas_bapak          masuk bapak - keluar bapak
--        saldo_kas_ibu            masuk ibu - keluar ibu
--        saldo_jimpitan           masuk jimpitan - keluar jimpitan
--        arisan_belum_disalurkan  arisan_masuk - pengeluaran_arisan
--   3. 10 kolom lama dipertahankan dengan nama, urutan, dan arti yang sama
--      agar klien versi sekarang tetap jalan.
--
-- Sifat perubahan:
--   DDL view (metadata). Tidak ada DML. View biasa, bukan materialized,
--   sehingga tidak perlu refresh. Jika ada objek yang bergantung pada
--   view ini, DROP tanpa CASCADE akan gagal dan seluruh migrasi rollback.
--
-- Dependensi:
--   - public.kas_bulanan, public.jimpitan_harian,
--     public.iuran_insidental_detail, public.pengeluaran_kas
--   - public.v_saldo_kas versi 014
-- ============================================================

DROP VIEW IF EXISTS public.v_saldo_kas;

CREATE VIEW public.v_saldo_kas AS
WITH masuk AS (
  SELECT
    COALESCE(SUM(jumlah) FILTER (WHERE tipe_kas = 'Bapak'),  0) AS kas_bapak,
    COALESCE(SUM(jumlah) FILTER (WHERE tipe_kas = 'Ibu'),    0) AS kas_ibu,
    COALESCE(SUM(jumlah) FILTER (WHERE tipe_kas = 'Arisan'), 0) AS arisan
  FROM public.kas_bulanan
  WHERE status_bayar
),
jimpitan AS (
  SELECT COALESCE(SUM(nominal), 0) AS total
  FROM public.jimpitan_harian
  WHERE status = 'Diambil'
),
insidental AS (
  SELECT COALESCE(SUM(jumlah), 0) AS total
  FROM public.iuran_insidental_detail
  WHERE status_bayar
),
keluar AS (
  SELECT
    COALESCE(SUM(nominal), 0) AS total,
    COALESCE(SUM(nominal) FILTER (WHERE sumber_dana = 'Kas Bapak'), 0) AS kas_bapak,
    COALESCE(SUM(nominal) FILTER (WHERE sumber_dana = 'Kas Ibu'),    0) AS kas_ibu,
    COALESCE(SUM(nominal) FILTER (WHERE sumber_dana = 'Jimpitan'),   0) AS jimpitan,
    COALESCE(SUM(nominal) FILTER (WHERE sumber_dana = 'Arisan'),     0) AS arisan
  FROM public.pengeluaran_kas
)
SELECT
  m.kas_bapak  AS kas_bapak_masuk,
  m.kas_ibu    AS kas_ibu_masuk,
  m.arisan     AS arisan_masuk,
  j.total      AS jimpitan_masuk,
  i.total      AS iuran_insidental_masuk,
  k.total      AS total_pengeluaran,
  k.kas_bapak  AS pengeluaran_kas_bapak,
  k.kas_ibu    AS pengeluaran_kas_ibu,
  k.jimpitan   AS pengeluaran_jimpitan,
  k.arisan     AS pengeluaran_arisan,
  (m.kas_bapak + m.kas_ibu + j.total + i.total)          AS total_masuk,
  (k.total - k.arisan)                                    AS total_pengeluaran_utama,
  (m.kas_bapak + m.kas_ibu + j.total + i.total)
    - (k.total - k.arisan)                                AS saldo_utama,
  m.kas_bapak - k.kas_bapak                               AS saldo_kas_bapak,
  m.kas_ibu   - k.kas_ibu                                 AS saldo_kas_ibu,
  j.total     - k.jimpitan                                AS saldo_jimpitan,
  m.arisan    - k.arisan                                  AS arisan_belum_disalurkan
FROM masuk m
CROSS JOIN jimpitan j
CROSS JOIN insidental i
CROSS JOIN keluar k;

COMMENT ON VIEW public.v_saldo_kas IS
  'Saldo kas RT. Arisan (dana bergulir) dipisahkan: total_masuk, total_pengeluaran_utama, dan saldo_utama tidak memuat arisan.';

-- Default privileges Supabase biasanya sudah menggrant SELECT; pernyataan
-- eksplisit membuat hasil deterministik setelah DROP/CREATE.
GRANT SELECT ON public.v_saldo_kas TO anon, authenticated;
