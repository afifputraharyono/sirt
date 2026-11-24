-- ============================================================
-- Verifikasi v_saldo_kas — READ-ONLY
-- ============================================================
-- CATATAN: skrip ini mengacu pada migrasi 014 (view 10 kolom). Setelah
-- migrasi 018, gunakan supabase/scripts/verify_017_018_019.sql untuk
-- memeriksa state terbaru (view 17 kolom + saldo per sumber).
--
-- Jalankan di Supabase SQL Editor (role postgres) atau via
--   supabase db query --linked -f supabase/scripts/verify_v_saldo_kas.sql
--
-- Cara pakai:
--   1. Jalankan BAGIAN 1 (SEBELUM) dan simpan output-nya.
--   2. Terapkan migrasi 20261123000014_fix_v_saldo_kas_arisan.sql.
--   3. Jalankan BAGIAN 2 (SESUDAH) dan bandingkan.
--
-- Snapshot production per 23 Nov 2026 (acuan, bukan hardcode):
--   kas_bapak_masuk        = 0
--   kas_ibu_masuk          = 1.680.000
--   arisan_masuk           = 600.000   (belum ada sebelum fix)
--   jimpitan_masuk         = 0
--   iuran_insidental_masuk = 0
--   total_pengeluaran      = 750.000
--   pengeluaran_kas_bapak  = 0
--   pengeluaran_kas_ibu    = 750.000
--   pengeluaran_jimpitan   = 0
--   pengeluaran_arisan     = 0         (belum ada sebelum fix)
-- ============================================================


-- ============================================================
-- BAGIAN 1 — SEBELUM PERBAIKAN
-- ============================================================

-- A1. Riwayat migrasi: pastikan status 013 dan 014.
--     Jika 013 belum tercatat, `supabase db push` akan menjalankannya
--     lebih dulu, lalu 014. Keduanya aman berurutan.
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- A2. Kolom view saat ini (diharapkan 8 kolom, tanpa arisan).
SELECT ordinal_position, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_saldo_kas'
ORDER BY ordinal_position;

-- A3. Isi view saat ini.
SELECT * FROM public.v_saldo_kas;

-- A4. Objek yang bergantung pada view. HARUS 0 baris.
--     Jika ada baris, jangan jalankan DROP VIEW (migrasi akan gagal
--     dan rollback; aman, tetapi perlu penanganan manual).
SELECT DISTINCT dependent_ns.nspname AS dependent_schema,
                dependent_view.relname AS dependent_view
FROM pg_depend d
JOIN pg_rewrite r               ON r.oid = d.objid
JOIN pg_class dependent_view    ON dependent_view.oid = r.ev_class
JOIN pg_namespace dependent_ns  ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_class source            ON source.oid = d.refobjid
JOIN pg_namespace source_ns     ON source_ns.oid = source.relnamespace
WHERE source_ns.nspname = 'public'
  AND source.relname = 'v_saldo_kas'
  AND dependent_view.relname <> 'v_saldo_kas';

-- A5. Grant view saat ini (anon/authenticated harus punya SELECT).
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'v_saldo_kas'
ORDER BY grantee, privilege_type;

-- A6. Snapshot jumlah baris tabel. Simpan hasilnya; setelah fix
--     angkanya harus SAMA PERSIS (bukti tidak ada data berubah).
SELECT 'rumah_kk' AS tabel, count(*) AS baris FROM public.rumah_kk
UNION ALL SELECT 'warga_detail',        count(*) FROM public.warga_detail
UNION ALL SELECT 'kas_bulanan',         count(*) FROM public.kas_bulanan
UNION ALL SELECT 'jimpitan_harian',     count(*) FROM public.jimpitan_harian
UNION ALL SELECT 'pengeluaran_kas',     count(*) FROM public.pengeluaran_kas
UNION ALL SELECT 'grup_pengeluaran',    count(*) FROM public.grup_pengeluaran
UNION ALL SELECT 'surat_pengantar',     count(*) FROM public.surat_pengantar
UNION ALL SELECT 'pengumuman',          count(*) FROM public.pengumuman
UNION ALL SELECT 'inventaris',          count(*) FROM public.inventaris
UNION ALL SELECT 'audit_log',           count(*) FROM public.audit_log
ORDER BY tabel;

-- A7. Constraint CHECK sumber_dana. Definisi ideal memuat 'Arisan':
--     CHECK (sumber_dana = ANY (ARRAY['Kas Bapak','Kas Ibu','Jimpitan','Arisan']))
--     Bukan bagian dari fix view, tetapi wajib benar agar pengeluaran
--     dana arisan bisa disimpan.
SELECT conname, pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conrelid = 'public.pengeluaran_kas'::regclass
  AND contype = 'c';


-- ============================================================
-- BAGIAN 2 — SESUDAH PERBAIKAN
-- ============================================================

-- B1. Kolom view harus 10 dan memuat arisan_masuk & pengeluaran_arisan.
SELECT ordinal_position, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_saldo_kas'
ORDER BY ordinal_position;

-- B2. Isi view setelah fix.
SELECT * FROM public.v_saldo_kas;

-- B3. Bandingkan view dengan hitungan langsung dari tabel sumber.
--     Semua kolom "cocok_*" harus TRUE.
WITH expected AS (
  SELECT
    (SELECT COALESCE(SUM(jumlah), 0)  FROM public.kas_bulanan WHERE tipe_kas = 'Bapak'  AND status_bayar = true) AS kas_bapak_masuk,
    (SELECT COALESCE(SUM(jumlah), 0)  FROM public.kas_bulanan WHERE tipe_kas = 'Ibu'    AND status_bayar = true) AS kas_ibu_masuk,
    (SELECT COALESCE(SUM(jumlah), 0)  FROM public.kas_bulanan WHERE tipe_kas = 'Arisan' AND status_bayar = true) AS arisan_masuk,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.jimpitan_harian WHERE status = 'Diambil') AS jimpitan_masuk,
    (SELECT COALESCE(SUM(jumlah), 0)  FROM public.iuran_insidental_detail WHERE status_bayar = true) AS iuran_insidental_masuk,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas) AS total_pengeluaran,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas WHERE sumber_dana = 'Kas Bapak') AS pengeluaran_kas_bapak,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas WHERE sumber_dana = 'Kas Ibu')   AS pengeluaran_kas_ibu,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas WHERE sumber_dana = 'Jimpitan')  AS pengeluaran_jimpitan,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas WHERE sumber_dana = 'Arisan')    AS pengeluaran_arisan
)
SELECT
  v.kas_bapak_masuk,
  v.kas_bapak_masuk        = e.kas_bapak_masuk        AS cocok_bapak,
  v.kas_ibu_masuk,
  v.kas_ibu_masuk          = e.kas_ibu_masuk          AS cocok_ibu,
  v.arisan_masuk,
  v.arisan_masuk           = e.arisan_masuk           AS cocok_arisan,
  v.jimpitan_masuk,
  v.jimpitan_masuk         = e.jimpitan_masuk         AS cocok_jimpitan,
  v.iuran_insidental_masuk,
  v.iuran_insidental_masuk = e.iuran_insidental_masuk AS cocok_iuran,
  v.total_pengeluaran,
  v.total_pengeluaran      = e.total_pengeluaran      AS cocok_total_keluar,
  v.pengeluaran_kas_bapak,
  v.pengeluaran_kas_bapak  = e.pengeluaran_kas_bapak  AS cocok_keluar_bapak,
  v.pengeluaran_kas_ibu,
  v.pengeluaran_kas_ibu    = e.pengeluaran_kas_ibu    AS cocok_keluar_ibu,
  v.pengeluaran_jimpitan,
  v.pengeluaran_jimpitan   = e.pengeluaran_jimpitan   AS cocok_keluar_jimpitan,
  v.pengeluaran_arisan,
  v.pengeluaran_arisan     = e.pengeluaran_arisan     AS cocok_keluar_arisan
FROM public.v_saldo_kas v
CROSS JOIN expected e;

-- B4. Snapshot jumlah baris harus identik dengan A6.
SELECT 'rumah_kk' AS tabel, count(*) AS baris FROM public.rumah_kk
UNION ALL SELECT 'warga_detail',        count(*) FROM public.warga_detail
UNION ALL SELECT 'kas_bulanan',         count(*) FROM public.kas_bulanan
UNION ALL SELECT 'jimpitan_harian',     count(*) FROM public.jimpitan_harian
UNION ALL SELECT 'pengeluaran_kas',     count(*) FROM public.pengeluaran_kas
UNION ALL SELECT 'grup_pengeluaran',    count(*) FROM public.grup_pengeluaran
UNION ALL SELECT 'surat_pengantar',     count(*) FROM public.surat_pengantar
UNION ALL SELECT 'pengumuman',          count(*) FROM public.pengumuman
UNION ALL SELECT 'inventaris',          count(*) FROM public.inventaris
UNION ALL SELECT 'audit_log',           count(*) FROM public.audit_log
ORDER BY tabel;

-- B5. Grant harus tetap ada untuk anon & authenticated.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'v_saldo_kas'
ORDER BY grantee, privilege_type;

SELECT has_table_privilege('anon',          'public.v_saldo_kas', 'SELECT') AS anon_select,
       has_table_privilege('authenticated', 'public.v_saldo_kas', 'SELECT') AS authenticated_select;

-- B6. Tidak boleh ada objek dependen yang rusak.
SELECT DISTINCT dependent_ns.nspname AS dependent_schema,
                dependent_view.relname AS dependent_view
FROM pg_depend d
JOIN pg_rewrite r               ON r.oid = d.objid
JOIN pg_class dependent_view    ON dependent_view.oid = r.ev_class
JOIN pg_namespace dependent_ns  ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_class source            ON source.oid = d.refobjid
JOIN pg_namespace source_ns     ON source_ns.oid = source.relnamespace
WHERE source_ns.nspname = 'public'
  AND source.relname = 'v_saldo_kas'
  AND dependent_view.relname <> 'v_saldo_kas';

-- B7. Smoke test manual di aplikasi:
--     - /admin/keuangan/ibu  -> kartu "Arisan" menampilkan Rp600.000
--     - /keuangan (publik)   -> kartu "Arisan" Rp600.000, total saldo naik
--     - /admin (dashboard)   -> tidak berubah (memang tidak memakai arisan)

-- B8. Constraint CHECK sumber_dana harus sudah memuat 'Arisan'.
SELECT conname, pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conrelid = 'public.pengeluaran_kas'::regclass
  AND contype = 'c';


-- ============================================================
-- ROLLBACK (metadata-only, jalankan hanya bila diperlukan)
-- ============================================================
-- BEGIN;
-- DROP VIEW IF EXISTS public.v_saldo_kas;
-- CREATE VIEW public.v_saldo_kas AS
-- SELECT
--   COALESCE((SELECT SUM(jumlah) FROM public.kas_bulanan WHERE tipe_kas = 'Bapak' AND status_bayar = true), 0) AS kas_bapak_masuk,
--   COALESCE((SELECT SUM(jumlah) FROM public.kas_bulanan WHERE tipe_kas = 'Ibu' AND status_bayar = true), 0) AS kas_ibu_masuk,
--   COALESCE((SELECT SUM(nominal) FROM public.jimpitan_harian WHERE status = 'Diambil'), 0) AS jimpitan_masuk,
--   COALESCE((SELECT SUM(jumlah) FROM public.iuran_insidental_detail WHERE status_bayar = true), 0) AS iuran_insidental_masuk,
--   COALESCE((SELECT SUM(nominal) FROM public.pengeluaran_kas), 0) AS total_pengeluaran,
--   COALESCE((SELECT SUM(nominal) FROM public.pengeluaran_kas WHERE sumber_dana = 'Kas Bapak'), 0) AS pengeluaran_kas_bapak,
--   COALESCE((SELECT SUM(nominal) FROM public.pengeluaran_kas WHERE sumber_dana = 'Kas Ibu'), 0) AS pengeluaran_kas_ibu,
--   COALESCE((SELECT SUM(nominal) FROM public.pengeluaran_kas WHERE sumber_dana = 'Jimpitan'), 0) AS pengeluaran_jimpitan;
-- GRANT SELECT ON public.v_saldo_kas TO anon, authenticated;
-- -- Opsional: kembalikan CHECK versi 012 (tanpa 'Arisan').
-- -- Hanya aman jika belum ada pengeluaran bersumber 'Arisan'.
-- -- ALTER TABLE public.pengeluaran_kas
-- --   DROP CONSTRAINT IF EXISTS pengeluaran_kas_sumber_dana_check;
-- -- ALTER TABLE public.pengeluaran_kas
-- --   ADD CONSTRAINT pengeluaran_kas_sumber_dana_check
-- --   CHECK (sumber_dana IN ('Kas Bapak', 'Kas Ibu', 'Jimpitan'));
-- COMMIT;


-- ============================================================
-- CATATAN
-- Perbaikan CHECK sumber_dana sudah menjadi bagian dari migrasi
-- 20261123000014 (setelah terbukti A7 masih versi 012). Cek hasilnya
-- di B8.
-- ============================================================
