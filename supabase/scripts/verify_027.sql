-- ============================================================
-- Verifikasi migrasi 027 (hunian menentukan tagihan)
-- READ-ONLY — aman dijalankan sebelum/sesudah apply.
-- ============================================================
-- Ekspektasi production 25 Nov 2026:
--   - 43 rumah non-Kosong dengan 43 periode terbuka.
--   - 10 rumah Kosong tanpa periode.
--   - view publik hanya 4 kolom (tanpa catatan).
-- ============================================================


-- 1. View periode hunian publik.
SELECT c.relname,
       (SELECT count(*) FROM pg_attribute a
         WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) AS kolom,
       has_table_privilege('anon', c.oid, 'SELECT')        AS anon_select,
       has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'v_rumah_hunian_publik';
-- harapan: 4 kolom, anon_select t, auth_select t


-- 2. Definisi kolom view.
SELECT attname
FROM pg_attribute
WHERE attrelid = 'public.v_rumah_hunian_publik'::regclass
  AND attnum > 0 AND NOT attisdropped
ORDER BY attnum;
-- harapan: rumah_id, tanggal_mulai, tanggal_selesai, tunggakan_dialihkan


-- 3. Fungsi transisi hunian.
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security,
       COALESCE(array_to_string(p.proacl, ' | '), '(default)') AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('fn_kosongkan_rumah', 'fn_huni_rumah')
ORDER BY p.proname;
-- harapan: security INVOKER, acl memuat authenticated, tanpa anon


-- 4. Selaras data hunian.
SELECT (SELECT count(*) FROM public.rumah_kk WHERE status_hunian <> 'Kosong') AS rumah_dihuni,
       (SELECT count(*) FROM public.rumah_hunian WHERE tanggal_selesai IS NULL) AS periode_terbuka,
       (SELECT count(*) FROM public.rumah_kk r
         WHERE r.status_hunian = 'Kosong'
           AND EXISTS (SELECT 1 FROM public.rumah_hunian h
                        WHERE h.rumah_id = r.id AND h.tanggal_selesai IS NULL)) AS kosong_terbuka,
       (SELECT count(*) FROM public.rumah_kk r
         WHERE r.status_hunian <> 'Kosong'
           AND NOT EXISTS (SELECT 1 FROM public.rumah_hunian h
                            WHERE h.rumah_id = r.id AND h.tanggal_selesai IS NULL)) AS dihuni_tanpa_periode;
-- harapan: rumah_dihuni = periode_terbuka, dua kolom terakhir 0


-- 5. Jumlah data tidak berubah oleh migrasi.
SELECT 'rumah_kk'      AS tabel, count(*) AS baris FROM public.rumah_kk
UNION ALL SELECT 'rumah_hunian', count(*) FROM public.rumah_hunian
UNION ALL SELECT 'kas_bulanan',  count(*) FROM public.kas_bulanan
ORDER BY tabel;
