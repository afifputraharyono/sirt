-- ============================================================
-- Verifikasi migrasi 026 (ronde menentukan keanggotaan)
-- READ-ONLY — aman dijalankan di production.
-- ============================================================
-- Ekspektasi production per 25 Nov 2026 (sebelum ada ronde baru):
--   - ronde 1 berjalan, 28 anggota, flag ikut_arisan 28 rumah.
--   - fungsi memakai validasi aktif/non-Kosong (tanpa ikut_arisan)
--     dan menyinkronkan rumah_kk.ikut_arisan.
-- ============================================================


-- 1. Definisi fungsi memuat sinkronisasi flag dan tidak lagi menyaring
--    ikut_arisan pada validasi anggota.
SELECT p.proname,
       pg_get_functiondef(p.oid) ILIKE '%ANY (p_anggota)%'      AS sinkron_flag,
       pg_get_functiondef(p.oid) ILIKE '%NOT r.ikut_arisan%'    AS masih_syarat_flag,
       pg_get_functiondef(p.oid) ILIKE '%tidak aktif atau kosong%' AS pesan_baru
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'fn_mulai_arisan_ronde';
-- harapan: sinkron_flag t, masih_syarat_flag f, pesan_baru t


-- 2. Komentar kolom.
SELECT col_description('public.rumah_kk'::regclass,
         (SELECT attnum FROM pg_attribute
           WHERE attrelid = 'public.rumah_kk'::regclass
             AND attname = 'ikut_arisan')) AS komentar;
-- harapan: menyebut cermin keanggotaan ronde / fn_mulai_arisan_ronde


-- 3. Flag ikut_arisan selaras dengan roster ronde berjalan.
WITH ronde AS (
  SELECT id FROM public.arisan_ronde WHERE tanggal_selesai IS NULL
)
SELECT (SELECT count(*) FROM public.arisan_anggota a
         WHERE a.ronde_id = (SELECT id FROM ronde))           AS anggota_ronde,
       (SELECT count(*) FROM public.rumah_kk WHERE ikut_arisan) AS flag_ikut,
       (SELECT count(*)
          FROM public.rumah_kk r
          JOIN public.arisan_anggota a
            ON a.rumah_id = r.id AND a.ronde_id = (SELECT id FROM ronde)
         WHERE NOT r.ikut_arisan)                             AS anggota_tanpa_flag,
       (SELECT count(*)
          FROM public.rumah_kk r
         WHERE r.ikut_arisan
           AND NOT EXISTS (
             SELECT 1 FROM public.arisan_anggota a
             WHERE a.rumah_id = r.id AND a.ronde_id = (SELECT id FROM ronde)
           ))                                                 AS flag_tanpa_anggota;
-- harapan: anggota_ronde = flag_ikut (28), dua kolom terakhir 0.
-- Catatan: setelah ronde baru dimulai, angka 28 akan berubah mengikuti roster.


-- 4. Signature & hak eksekusi tidak berubah (GRANT 023 tetap berlaku).
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       COALESCE(array_to_string(p.proacl, ' | '), '(default)') AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'fn_mulai_arisan_ronde';


-- 5. Jumlah data tidak berubah oleh migrasi.
SELECT 'arisan_ronde'   AS tabel, count(*) AS baris FROM public.arisan_ronde
UNION ALL SELECT 'arisan_anggota',  count(*) FROM public.arisan_anggota
UNION ALL SELECT 'arisan_putaran',  count(*) FROM public.arisan_putaran
UNION ALL SELECT 'rumah_kk',        count(*) FROM public.rumah_kk
ORDER BY tabel;
