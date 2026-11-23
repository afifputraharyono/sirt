-- ============================================================
-- Verifikasi arisan_putaran — READ-ONLY
-- ============================================================
-- Jalankan di Supabase SQL Editor (role postgres) atau via
--   supabase db query --linked -f supabase/scripts/verify_arisan_putaran.sql
--
-- Cara pakai:
--   1. Jalankan BAGIAN 1 (SEBELUM) dan simpan output-nya.
--   2. Terapkan migrasi 20261123000015_arisan_putaran.sql.
--   3. Jalankan BAGIAN 2 (SESUDAH) dan bandingkan.
--
-- Ekspektasi production per 23 Nov 2026 (acuan, bukan hardcode):
--   - arisan_putaran belum ada.
--   - rumah_kk.ikut_arisan belum ada.
--   - pengeluaran_kas dengan sumber_dana = 'Arisan' = 0 baris.
--   - kas_bulanan tipe_kas = 'Arisan' = 30 baris (Rp600.000).
--   - Setelah migrasi: tabel & view ada, arisan_putaran = 0 baris,
--     ikut_arisan = 28 rumah, jumlah baris tabel lain TIDAK berubah.
-- ============================================================


-- ============================================================
-- BAGIAN 1 — SEBELUM MIGRASI
-- ============================================================

-- A1. Riwayat migrasi: pastikan 013/014 berstatus applied dan 015
--     BELUM tercatat.
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- A2. Tabel, view, dan kolom flag belum ada. Semua harus NULL/false.
SELECT to_regclass('public.arisan_putaran') IS NULL AS tabel_belum_ada,
       to_regclass('public.v_arisan_rekap')  IS NULL AS view_belum_ada,
       NOT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'rumah_kk'
           AND column_name = 'ikut_arisan'
       ) AS kolom_flag_belum_ada;

-- A3. Snapshot jumlah baris tabel sumber. Simpan hasilnya; setelah
--     migrasi harus SAMA PERSIS (bukti tidak ada data berubah).
SELECT 'rumah_kk' AS tabel, count(*) AS baris FROM public.rumah_kk
UNION ALL SELECT 'warga_detail',        count(*) FROM public.warga_detail
UNION ALL SELECT 'kas_bulanan',         count(*) FROM public.kas_bulanan
UNION ALL SELECT 'jimpitan_harian',     count(*) FROM public.jimpitan_harian
UNION ALL SELECT 'pengeluaran_kas',     count(*) FROM public.pengeluaran_kas
UNION ALL SELECT 'grup_pengeluaran',    count(*) FROM public.grup_pengeluaran
UNION ALL SELECT 'audit_log',           count(*) FROM public.audit_log
ORDER BY tabel;

-- A4. Baris yang akan ditautkan ke putaran (pengeluaran arisan).
SELECT count(*) FILTER (WHERE sumber_dana = 'Arisan') AS pengeluaran_arisan,
       count(*)                                       AS total_pengeluaran
FROM public.pengeluaran_kas;


-- ============================================================
-- BAGIAN 2 — SESUDAH MIGRASI
-- ============================================================

-- B1. Kolom tabel harus lengkap (12 kolom).
SELECT ordinal_position, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'arisan_putaran'
ORDER BY ordinal_position;

-- B2. Constraint: PK, unique periode, check bulan/tahun/nominal, FK.
--     Unique key ideal: UNIQUE (tahun, bulan).
--     FK pengeluaran_id wajib UNIQUE dan ON DELETE SET NULL.
SELECT conname, contype, pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conrelid = 'public.arisan_putaran'::regclass
ORDER BY contype, conname;

-- B3. Index wajib ada: unique periode + index pemenang.
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'arisan_putaran'
ORDER BY indexname;

-- B4. RLS aktif dan policy sesuai pola tabel keuangan lain:
--     publik hanya SELECT, penulisan lewat is_admin().
SELECT c.relrowsecurity AS rls_aktif
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'arisan_putaran';

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'arisan_putaran'
ORDER BY policyname;

-- B5. Empat trigger: updated_at, audit, validasi sumber dana, guard delete.
SELECT t.tgname AS trigger_name,
       p.proname AS function_name,
       pg_get_triggerdef(t.oid) AS definisi
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.arisan_putaran'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- B6. Grant. Catatan: default privileges Supabase biasanya sudah
--     memberi grant ke anon/authenticated; yang menentukan akses tulis
--     adalah RLS (lihat B4). Pastikan anon punya SELECT di tabel & view.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'arisan_putaran'
ORDER BY grantee, privilege_type;

SELECT has_table_privilege('anon',          'public.arisan_putaran', 'SELECT') AS anon_select,
       has_table_privilege('authenticated', 'public.arisan_putaran', 'SELECT') AS auth_select,
       has_table_privilege('anon',          'public.v_arisan_rekap', 'SELECT') AS anon_view_select,
       has_table_privilege('authenticated', 'public.v_arisan_rekap', 'SELECT') AS auth_view_select;

-- B7. Struktur view rekap (14 kolom) dan isi awal.
SELECT ordinal_position, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_arisan_rekap'
ORDER BY ordinal_position;

SELECT * FROM public.v_arisan_rekap ORDER BY tahun, bulan;

-- B8. Cek integritas. Hasil yang diharapkan:
--     B8.1 = 0 baris (trigger validasi bekerja)
--     B8.2 = informasi, bukan error: pemenang yang menang > 1 kali.
--            Wajar bila putaran lintas siklus; periksa bila mencurigakan.
--     B8.3 = iuran arisan terkumpul yang belum punya putaran (pot
--            belum disalurkan / belum diundi).
--     B8.4 = putaran yang pemenangnya sudah ada tetapi pot belum
--            dibayarkan (pengeluaran_id masih NULL).

-- B8.1 Pengeluaran tertaut yang bukan bersumber 'Arisan'. HARUS 0.
SELECT p.id, p.tahun, p.bulan, p.pengeluaran_id, pk.sumber_dana
FROM public.arisan_putaran p
JOIN public.pengeluaran_kas pk ON pk.id = p.pengeluaran_id
WHERE pk.sumber_dana <> 'Arisan';

-- B8.2 Pemenang ganda (informasi).
SELECT p.pemenang_rumah_id, r.no_rumah, count(*) AS jumlah_menang,
       string_agg(format('%s-%s', p.bulan, p.tahun), ', ' ORDER BY p.tahun, p.bulan) AS periode
FROM public.arisan_putaran p
JOIN public.rumah_kk r ON r.id = p.pemenang_rumah_id
GROUP BY p.pemenang_rumah_id, r.no_rumah
HAVING count(*) > 1
ORDER BY jumlah_menang DESC, r.no_rumah;

-- B8.3 Bulan dengan iuran arisan terkumpul tetapi belum ada putaran.
SELECT kb.tahun, kb.bulan,
       sum(kb.jumlah) AS nominal_terkumpul,
       count(*)       AS jumlah_pembayar
FROM public.kas_bulanan kb
LEFT JOIN public.arisan_putaran p
  ON p.tahun = kb.tahun AND p.bulan = kb.bulan
WHERE kb.tipe_kas = 'Arisan'
  AND kb.status_bayar = true
  AND p.id IS NULL
GROUP BY kb.tahun, kb.bulan
ORDER BY kb.tahun, kb.bulan;

-- B8.4 Putaran yang belum disalurkan.
SELECT id, tahun, bulan, pemenang_rumah_id, nominal, tanggal_undi
FROM public.arisan_putaran
WHERE pengeluaran_id IS NULL
ORDER BY tahun, bulan;

-- B9. Snapshot jumlah baris harus identik dengan A3,
--     ditambah arisan_putaran = 0.
SELECT 'rumah_kk' AS tabel, count(*) AS baris FROM public.rumah_kk
UNION ALL SELECT 'warga_detail',        count(*) FROM public.warga_detail
UNION ALL SELECT 'kas_bulanan',         count(*) FROM public.kas_bulanan
UNION ALL SELECT 'jimpitan_harian',     count(*) FROM public.jimpitan_harian
UNION ALL SELECT 'pengeluaran_kas',     count(*) FROM public.pengeluaran_kas
UNION ALL SELECT 'grup_pengeluaran',    count(*) FROM public.grup_pengeluaran
UNION ALL SELECT 'arisan_putaran',      count(*) FROM public.arisan_putaran
UNION ALL SELECT 'audit_log',           count(*) FROM public.audit_log
ORDER BY tabel;

-- B10. Smoke test manual setelah migrasi (bukan bagian script):
--      a. Admin membuka /admin/keuangan/ibu (tab Arisan): tetap normal,
--         belum ada perubahan UI karena form putaran belum dibuat.
--      b. Setelah UI putaran dirilis: catat satu putaran bulan berjalan,
--         lalu pastikan B8.3/B8.4 berubah sesuai dan audit_log mendapat
--         baris INSERT untuk tabel 'arisan_putaran'.


-- ============================================================
-- BAGIAN 3 — FLAG PESERTA, FUNGSI, DAN REKAP (READ-ONLY)
-- ============================================================

-- C0. Flag peserta. Harapan: 28 peserta dari 53 rumah; tidak ada
--     setoran Arisan milik rumah yang flag-nya false.
SELECT count(*) FILTER (WHERE ikut_arisan) AS peserta,
       count(*)                            AS total_rumah
FROM public.rumah_kk;

SELECT count(*) AS setoran_nonpeserta
FROM public.kas_bulanan kb
JOIN public.rumah_kk r ON r.id = kb.rumah_id
WHERE kb.tipe_kas = 'Arisan'
  AND NOT r.ikut_arisan;

-- C0b. Kolom wajib NOT NULL DEFAULT false.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'rumah_kk'
  AND column_name = 'ikut_arisan';

-- C1. Kedua RPC ada, dan EXECUTE hanya untuk authenticated (bukan anon).
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('fn_simpan_arisan_putaran', 'fn_salurkan_arisan_putaran')
ORDER BY p.proname;
-- harapan: anon_exec = false, auth_exec = true

-- C1b. Fungsi guard delete ada.
SELECT to_regprocedure('public.fn_guard_arisan_putaran_delete()') IS NOT NULL AS guard_ada;

-- C1c. Privilege tabel/view: anon hanya SELECT, authenticated tanpa TRUNCATE
--      (TRUNCATE tidak tunduk RLS, jadi tidak boleh dipegang role aplikasi).
SELECT
  has_table_privilege('anon', 'public.arisan_putaran', 'SELECT')          AS anon_select,
  has_table_privilege('anon', 'public.arisan_putaran', 'INSERT')          AS anon_insert,
  has_table_privilege('anon', 'public.arisan_putaran', 'UPDATE')          AS anon_update,
  has_table_privilege('anon', 'public.arisan_putaran', 'DELETE')          AS anon_delete,
  has_table_privilege('authenticated', 'public.arisan_putaran', 'TRUNCATE') AS auth_truncate,
  has_table_privilege('anon', 'public.v_arisan_rekap', 'INSERT')          AS anon_view_insert;
-- harapan: anon_select = true; kolom lainnya false

-- C7. Rekap per bulan: nominal terkumpul = SUM setoran Arisan lunas,
--     sisa = terkumpul - putaran. Harapan mismatch = 0.
SELECT count(*) AS mismatch_rekap
FROM public.v_arisan_rekap r
LEFT JOIN (
  SELECT tahun, bulan, SUM(jumlah) AS total
  FROM public.kas_bulanan
  WHERE tipe_kas = 'Arisan' AND status_bayar = true
  GROUP BY tahun, bulan
) k ON k.tahun = r.tahun AND k.bulan = r.bulan
WHERE r.nominal_terkumpul <> COALESCE(k.total, 0);

SELECT tahun, bulan, pemenang_no_rumah, nominal_terkumpul,
       nominal_putaran, sudah_disalurkan,
       nominal_terkumpul - COALESCE(nominal_putaran, 0) AS sisa
FROM public.v_arisan_rekap
ORDER BY tahun, bulan;

-- Catatan uji tulis (C2-C6): jalankan HANYA di staging sebagai admin
-- lewat aplikasi/login, bukan SQL Editor (auth.uid() NULL di SQL Editor):
--   C2 fn_simpan_arisan_putaran tanpa salurkan -> baris putaran dibuat.
--   C3 bulan sama dipanggil lagi -> error "sudah ada" (unique).
--   C4 p_salurkan=true -> pengeluaran_kas bertambah, sumber Arisan,
--      nominal sama, pengeluaran_id terisi.
--   C5 fn_salurkan_arisan_putaran pada putaran tersalurkan -> error.
--   C6 DELETE putaran tersalurkan -> error guard.
--   C6b DELETE pengeluaran bertaut -> pengeluaran_id SET NULL (FK),
--       lalu C6 gagal (pengeluaran_id sudah NULL) jika dihapus setelah.


-- ============================================================
-- ROLLBACK (metadata-only, jalankan hanya bila diperlukan)
-- ============================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_guard_delete_arisan_putaran ON public.arisan_putaran;
-- DROP FUNCTION IF EXISTS public.fn_guard_arisan_putaran_delete();
-- DROP FUNCTION IF EXISTS public.fn_salurkan_arisan_putaran(UUID, DATE);
-- DROP FUNCTION IF EXISTS public.fn_simpan_arisan_putaran(
--   INT, INT, UUID, NUMERIC, DATE, TEXT, BOOLEAN, DATE);
-- DROP VIEW IF EXISTS public.v_arisan_rekap;
-- DROP TABLE IF EXISTS public.arisan_putaran;  -- trigger ikut terhapus
-- DROP FUNCTION IF EXISTS public.fn_validate_arisan_putaran();
-- DROP INDEX IF EXISTS public.idx_rumah_kk_ikut_arisan;
-- ALTER TABLE public.rumah_kk DROP COLUMN IF EXISTS ikut_arisan;
-- COMMIT;


-- ============================================================
-- CATATAN
-- Migrasi ini DDL murni: tidak ada DML dan tidak menyentuh baris
-- lama. Bila ada pengeluaran arisan lama yang ingin ditautkan,
-- lakukan setelah migrasi dengan UPDATE arisan_putaran.pengeluaran_id
-- (pengeluaran tersebut harus bersumber_dana = 'Arisan').
-- ============================================================
