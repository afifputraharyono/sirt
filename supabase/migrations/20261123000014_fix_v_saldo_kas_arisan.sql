-- ============================================================
-- Migration 014: Sinkronkan v_saldo_kas dengan skema Arisan
-- ============================================================
-- Konteks:
--   Di production, v_saldo_kas masih versi migrasi 012 (8 kolom),
--   sehingga arisan_masuk & pengeluaran_arisan tidak tersedia dan
--   UI menampilkan saldo Arisan Rp0.
--
--   Di production, migrasi 013 juga tidak tercatat di schema_migrations
--   meskipun enum 'Arisan' sudah ada dan datanya sudah terisi. Akibatnya
--   CHECK sumber_dana masih versi 012 (tanpa 'Arisan'), sehingga
--   pengeluaran dana arisan tidak bisa disimpan. Migrasi ini sekaligus
--   memperbaiki constraint tersebut agar self-contained.
--
-- Sifat perubahan:
--   DDL view + constraint (metadata). Tidak ada DML dan tidak ada baris
--   data yang diubah atau dihapus. v_saldo_kas adalah view biasa (bukan
--   materialized), sehingga tidak perlu refresh.
--
-- Keamanan eksekusi:
--   - DROP tanpa CASCADE: jika ada objek yang bergantung pada view,
--     migrasi gagal dan seluruh transaksi rollback (fail-safe).
--   - Definisi di bawah identik dengan migrasi 013, sehingga aman
--     dijalankan baik pada view 8 kolom (production saat ini) maupun
--     pada database baru yang sudah menjalankan 013.
--   - Supabase CLI menjalankan tiap file migrasi dalam satu transaksi.
--     Untuk eksekusi manual via SQL Editor, bungkus isi file ini
--     dengan BEGIN; ... COMMIT;
-- ============================================================

DROP VIEW IF EXISTS public.v_saldo_kas;

CREATE VIEW public.v_saldo_kas AS
SELECT
  COALESCE((SELECT SUM(jumlah) FROM public.kas_bulanan WHERE tipe_kas = 'Bapak' AND status_bayar = true), 0) AS kas_bapak_masuk,
  COALESCE((SELECT SUM(jumlah) FROM public.kas_bulanan WHERE tipe_kas = 'Ibu' AND status_bayar = true), 0) AS kas_ibu_masuk,
  COALESCE((SELECT SUM(jumlah) FROM public.kas_bulanan WHERE tipe_kas = 'Arisan' AND status_bayar = true), 0) AS arisan_masuk,
  COALESCE((SELECT SUM(nominal) FROM public.jimpitan_harian WHERE status = 'Diambil'), 0) AS jimpitan_masuk,
  COALESCE((SELECT SUM(jumlah) FROM public.iuran_insidental_detail WHERE status_bayar = true), 0) AS iuran_insidental_masuk,
  COALESCE((SELECT SUM(nominal) FROM public.pengeluaran_kas), 0) AS total_pengeluaran,
  COALESCE((SELECT SUM(nominal) FROM public.pengeluaran_kas WHERE sumber_dana = 'Kas Bapak'), 0) AS pengeluaran_kas_bapak,
  COALESCE((SELECT SUM(nominal) FROM public.pengeluaran_kas WHERE sumber_dana = 'Kas Ibu'), 0) AS pengeluaran_kas_ibu,
  COALESCE((SELECT SUM(nominal) FROM public.pengeluaran_kas WHERE sumber_dana = 'Jimpitan'), 0) AS pengeluaran_jimpitan,
  COALESCE((SELECT SUM(nominal) FROM public.pengeluaran_kas WHERE sumber_dana = 'Arisan'), 0) AS pengeluaran_arisan;

-- Grant tetap dipertahankan untuk akses anon/authenticated seperti
-- sebelumnya. Default privileges Supabase biasanya sudah menggrant ini;
-- pernyataan eksplisit membuat hasil deterministik setelah DROP/CREATE.
GRANT SELECT ON public.v_saldo_kas TO anon, authenticated;

-- Perbaiki CHECK sumber_dana yang tertinggal di versi 012.
-- Validasi memindai 5 baris yang ada (semuanya 'Kas Ibu'); jika ada nilai
-- di luar daftar, pernyataan gagal dan seluruh transaksi rollback.
ALTER TABLE public.pengeluaran_kas
  DROP CONSTRAINT IF EXISTS pengeluaran_kas_sumber_dana_check;
ALTER TABLE public.pengeluaran_kas
  ADD CONSTRAINT pengeluaran_kas_sumber_dana_check
  CHECK (sumber_dana IN ('Kas Bapak', 'Kas Ibu', 'Jimpitan', 'Arisan'));
