-- ============================================================
-- Verifikasi migrasi 017, 018, 019 — READ-ONLY
-- ============================================================
-- Jalankan di Supabase SQL Editor (role postgres) atau via
--   supabase db query --linked -f supabase/scripts/verify_017_018_019.sql
--
-- Migrasi:
--   017 — RLS hardening + search_path
--   018 — v_saldo_kas satu pass + kolom saldo
--   019 — invarian periode aktif & mulai_kas_ibu
--
-- Semua query di bawah tidak mengubah data.
-- ============================================================


-- ============================================================
-- A. RIWAYAT MIGRASI
-- ============================================================
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;


-- ============================================================
-- B. 017 — RLS & search_path
-- ============================================================

-- B1. Fungsi SECURITY DEFINER harus punya search_path tetap.
SELECT p.proname, p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'fn_audit_trigger',
    'current_user_role',
    'is_admin',
    'current_user_rumah_id',
    'fn_handle_new_user',
    'fn_guard_profil_kolom_istimewa'
  )
ORDER BY p.proname;
-- Harapan: proconfig memuat search_path=public untuk semua.

-- B2. fn_handle_new_user tidak boleh lagi membaca role dari metadata.
SELECT position('''role''' IN pg_get_functiondef('public.fn_handle_new_user()'::regprocedure)) = 0
       AS tidak_memakai_role_metadata;

-- B3. Trigger guard profil terpasang.
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.profil_pengguna'::regclass
  AND NOT tgisinternal
ORDER BY tgname;

-- B4. Policy yang relevan.
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profil_pengguna', 'surat_pengantar', 'grup_pengeluaran')
ORDER BY tablename, policyname;
-- Harapan: ada surat_admin_insert (INSERT, is_admin),
--          grup_pengeluaran_admin_insert/update/delete (is_admin).

-- B5. Smoke test guard (opsional, jalankan sebagai user non-admin di
--     console terpisah; di SQL Editor auth.uid() NULL sehingga guard
--     sengaja dilewati):
--   UPDATE public.profil_pengguna SET role = 'admin' WHERE id = auth.uid();
--   Harapan: ERROR 42501 "Hanya admin ...".


-- ============================================================
-- C. 018 — v_saldo_kas
-- ============================================================

-- C1. Kolom view harus 17 (10 lama + 7 baru).
SELECT ordinal_position, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_saldo_kas'
ORDER BY ordinal_position;

-- C2. Isi view.
SELECT * FROM public.v_saldo_kas;

-- C3. Bandingkan dengan hitungan langsung dari tabel sumber.
WITH expected AS (
  SELECT
    (SELECT COALESCE(SUM(jumlah), 0)  FROM public.kas_bulanan WHERE tipe_kas = 'Bapak'  AND status_bayar) AS kas_bapak_masuk,
    (SELECT COALESCE(SUM(jumlah), 0)  FROM public.kas_bulanan WHERE tipe_kas = 'Ibu'    AND status_bayar) AS kas_ibu_masuk,
    (SELECT COALESCE(SUM(jumlah), 0)  FROM public.kas_bulanan WHERE tipe_kas = 'Arisan' AND status_bayar) AS arisan_masuk,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.jimpitan_harian WHERE status = 'Diambil') AS jimpitan_masuk,
    (SELECT COALESCE(SUM(jumlah), 0)  FROM public.iuran_insidental_detail WHERE status_bayar) AS iuran_insidental_masuk,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas) AS total_pengeluaran,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas WHERE sumber_dana = 'Kas Bapak') AS pengeluaran_kas_bapak,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas WHERE sumber_dana = 'Kas Ibu')   AS pengeluaran_kas_ibu,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas WHERE sumber_dana = 'Jimpitan')  AS pengeluaran_jimpitan,
    (SELECT COALESCE(SUM(nominal), 0) FROM public.pengeluaran_kas WHERE sumber_dana = 'Arisan')    AS pengeluaran_arisan
)
SELECT
  v.kas_bapak_masuk        = e.kas_bapak_masuk            AS cocok_bapak,
  v.kas_ibu_masuk          = e.kas_ibu_masuk              AS cocok_ibu,
  v.arisan_masuk           = e.arisan_masuk               AS cocok_arisan,
  v.jimpitan_masuk         = e.jimpitan_masuk             AS cocok_jimpitan,
  v.iuran_insidental_masuk = e.iuran_insidental_masuk     AS cocok_iuran,
  v.total_pengeluaran      = e.total_pengeluaran          AS cocok_total_keluar,
  v.pengeluaran_kas_bapak  = e.pengeluaran_kas_bapak      AS cocok_keluar_bapak,
  v.pengeluaran_kas_ibu    = e.pengeluaran_kas_ibu        AS cocok_keluar_ibu,
  v.pengeluaran_jimpitan   = e.pengeluaran_jimpitan       AS cocok_keluar_jimpitan,
  v.pengeluaran_arisan     = e.pengeluaran_arisan         AS cocok_keluar_arisan,
  v.total_masuk            = e.kas_bapak_masuk + e.kas_ibu_masuk
                             + e.jimpitan_masuk + e.iuran_insidental_masuk
                                                          AS cocok_total_masuk,
  v.total_pengeluaran_utama = e.total_pengeluaran - e.pengeluaran_arisan
                                                          AS cocok_total_keluar_utama,
  v.saldo_utama            = (e.kas_bapak_masuk + e.kas_ibu_masuk
                             + e.jimpitan_masuk + e.iuran_insidental_masuk)
                             - (e.total_pengeluaran - e.pengeluaran_arisan)
                                                          AS cocok_saldo_utama,
  v.saldo_kas_bapak        = e.kas_bapak_masuk - e.pengeluaran_kas_bapak
                                                          AS cocok_saldo_bapak,
  v.saldo_kas_ibu          = e.kas_ibu_masuk - e.pengeluaran_kas_ibu
                                                          AS cocok_saldo_ibu,
  v.saldo_jimpitan         = e.jimpitan_masuk - e.pengeluaran_jimpitan
                                                          AS cocok_saldo_jimpitan,
  v.arisan_belum_disalurkan = e.arisan_masuk - e.pengeluaran_arisan
                                                          AS cocok_arisan_belum
FROM public.v_saldo_kas v
CROSS JOIN expected e;
-- Harapan: semua kolom cocok_* TRUE.

-- C4. Grant anon/authenticated tetap ada.
SELECT has_table_privilege('anon',          'public.v_saldo_kas', 'SELECT') AS anon_select,
       has_table_privilege('authenticated', 'public.v_saldo_kas', 'SELECT') AS authenticated_select;

-- C5. Tidak boleh ada objek dependen yang rusak.
SELECT DISTINCT dependent_ns.nspname AS dependent_schema,
                dependent_view.relname AS dependent_view
FROM pg_depend d
JOIN pg_rewrite r              ON r.oid = d.objid
JOIN pg_class dependent_view   ON dependent_view.oid = r.ev_class
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_class source           ON source.oid = d.refobjid
JOIN pg_namespace source_ns    ON source_ns.oid = source.relnamespace
WHERE source_ns.nspname = 'public'
  AND source.relname = 'v_saldo_kas'
  AND dependent_view.relname <> 'v_saldo_kas';


-- ============================================================
-- D. 019 — INGATAN / INVARIAN
-- ============================================================

-- D1. Harus 0 atau 1 periode aktif.
SELECT count(*) AS periode_aktif
FROM public.periode_jadwal_ronda
WHERE is_active;

-- D2. Unique index terpasang.
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname = 'periode_satu_aktif';

-- D3. CHECK mulai_kas_ibu terpasang.
SELECT conname, pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conrelid = 'public.rumah_kk'::regclass
  AND conname = 'rumah_kk_mulai_kas_ibu_awal_bulan';

-- D4. Tidak ada pelanggaran (harus 0).
SELECT count(*) AS mulai_kas_ibu_bukan_awal_bulan
FROM public.rumah_kk
WHERE mulai_kas_ibu IS NOT NULL
  AND mulai_kas_ibu <> date_trunc('month', mulai_kas_ibu::timestamp)::date;


-- ============================================================
-- E. SMOKE TEST MANUAL (aplikasi)
-- ============================================================
-- 1. /                      -> angka saldo, pemasukan, pengeluaran sama
--                              seperti sebelum migrasi 018.
-- 2. /keuangan (publik)     -> kartu Kas Bapak/Ibu/Jimpitan dan saldo
--                              konsisten; arisan tidak masuk saldo.
-- 3. /admin                 -> Saldo Kas Bapak/Ibu dan Total Pengeluaran
--                              (tanpa arisan) konsisten.
-- 4. /admin/keuangan/bapak  -> kartu Kas Bapak & Jimpitan.
-- 5. /admin/keuangan/ibu    -> kartu Kas Ibu & "Arisan belum disalurkan".
-- 6. Login sebagai admin -> /admin/surat -> buat surat untuk warga lain
--                              (sebelumnya ditolak RLS).
-- 7. Login sebagai warga -> simpan profil (nama/no HP) harus tetap bisa.
-- 8. Login sebagai warga -> coba ubah role lewat console browser:
--      await supabase.from('profil_pengguna')
--        .update({ role: 'admin' }).eq('id', user.id)
--    Harapan: error 42501; role di DB tidak berubah.
-- 9. Buka /jadwal (publik) -> daftar ronda tampil (butuh <= 1 periode aktif).
-- ============================================================
