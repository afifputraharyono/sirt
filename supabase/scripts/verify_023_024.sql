-- ============================================================
-- Verifikasi migrasi 023 (ronde arisan) & 024 (rumah_hunian)
-- READ-ONLY
-- ============================================================
-- Jalankan sebelum dan sesudah apply. Simpan output BAGIAN 1 untuk
-- dibandingkan dengan BAGIAN 2.
--
-- Ekspektasi production per 25 Nov 2026:
--   - arisan_putaran: 2 baris (Sep 2026 A22, Okt 2026 A52), Rp560.000,
--     keduanya sudah disalurkan.
--   - rumah_kk: 53 baris, 28 ikut_arisan, 43 non-Kosong, 10 Kosong.
--   - Setelah migrasi: ronde 1 berjalan sejak 2026-09-01 dengan 28
--     anggota; kedua putaran menempel pada ronde 1 (urutan 1 dan 2);
--     rumah_hunian berisi 43 periode terbuka (10 rumah Kosong tanpa
--     periode).
-- ============================================================


-- ============================================================
-- BAGIAN 1 — SEBELUM MIGRASI
-- ============================================================

-- A1. Riwayat migrasi: 023/024 belum tercatat.
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- A2. Objek baru belum ada.
SELECT to_regclass('public.arisan_ronde')  IS NULL AS ronde_belum_ada,
       to_regclass('public.arisan_anggota') IS NULL AS anggota_belum_ada,
       to_regclass('public.rumah_hunian')  IS NULL AS hunian_belum_ada,
       NOT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'arisan_putaran'
           AND column_name = 'ronde_id'
       ) AS kolom_ronde_belum_ada;

-- A3. Snapshot putaran.
SELECT p.bulan, p.tahun, r.no_rumah, p.nominal,
       (p.pengeluaran_id IS NOT NULL) AS disalurkan,
       r.ikut_arisan
FROM public.arisan_putaran p
JOIN public.rumah_kk r ON r.id = p.pemenang_rumah_id
ORDER BY p.tahun, p.bulan;

-- A4. Snapshot peserta & status hunian.
SELECT count(*)                                    AS total_rumah,
       count(*) FILTER (WHERE ikut_arisan)         AS peserta_arisan,
       count(*) FILTER (WHERE status_hunian <> 'Kosong') AS non_kosong,
       count(*) FILTER (WHERE status_hunian = 'Kosong')  AS kosong
FROM public.rumah_kk;

-- A5. Snapshot jumlah baris tabel sumber. Harus SAMA PERSIS sesudah
--     migrasi (023/024 tidak mengubah data lama).
SELECT 'rumah_kk' AS tabel, count(*) AS baris FROM public.rumah_kk
UNION ALL SELECT 'arisan_putaran',   count(*) FROM public.arisan_putaran
UNION ALL SELECT 'kas_bulanan',      count(*) FROM public.kas_bulanan
UNION ALL SELECT 'pengeluaran_kas',  count(*) FROM public.pengeluaran_kas
UNION ALL SELECT 'audit_log',        count(*) FROM public.audit_log
ORDER BY tabel;


-- ============================================================
-- BAGIAN 2 — SESUDAH MIGRASI
-- ============================================================

-- B1. Tabel & kolom baru.
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('arisan_ronde', 'arisan_anggota', 'rumah_hunian')
ORDER BY table_name, ordinal_position;

SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'arisan_putaran'
  AND column_name IN ('ronde_id', 'urutan')
ORDER BY column_name;
-- harapan: ronde_id NO, urutan NO

-- B2. Constraint kunci.
SELECT conrelid::regclass::text AS tabel, conname, contype,
       pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conrelid IN (
  'public.arisan_ronde'::regclass,
  'public.arisan_anggota'::regclass,
  'public.arisan_putaran'::regclass,
  'public.rumah_hunian'::regclass
)
  AND conname IN (
    'arisan_anggota_unik',
    'arisan_putaran_ronde_urutan_key',
    'arisan_putaran_ronde_pemenang_key',
    'arisan_putaran_urutan_valid',
    'rumah_hunian_tidak_tumpang_tindih',
    'rumah_hunian_periode_valid'
  )
ORDER BY tabel, conname;

-- B2b. Index unik ronde berjalan (bukan constraint, jadi tidak muncul di
--      pg_constraint).
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('arisan_ronde_satu_berjalan', 'idx_rumah_hunian_rumah');

-- B3. Ronde 1 dan komposisinya.
SELECT r.nomor, r.tanggal_mulai, r.tanggal_selesai,
       (SELECT count(*) FROM public.arisan_anggota a
         WHERE a.ronde_id = r.id)                       AS anggota,
       (SELECT count(*) FROM public.arisan_putaran p
         WHERE p.ronde_id = r.id)                       AS putaran
FROM public.arisan_ronde r
ORDER BY r.nomor;
-- harapan: nomor 1, 2026-09-01, NULL (berjalan), 28 anggota, 2 putaran

SELECT p.bulan, p.tahun, r.no_rumah, p.urutan, p.nominal,
       (p.pengeluaran_id IS NOT NULL) AS disalurkan, p.ronde_id IS NOT NULL AS ada_ronde
FROM public.arisan_putaran p
JOIN public.rumah_kk r ON r.id = p.pemenang_rumah_id
ORDER BY p.tahun, p.bulan;
-- harapan: (9, 2026, A22, urutan 1), (10, 2026, A52, urutan 2)

-- B4. Tidak ada anggota ganda / pemenang ganda.
SELECT ronde_id, rumah_id, count(*)
FROM public.arisan_anggota
GROUP BY 1, 2 HAVING count(*) > 1;
-- harapan: 0 baris

SELECT ronde_id, pemenang_rumah_id, count(*)
FROM public.arisan_putaran
GROUP BY 1, 2 HAVING count(*) > 1;
-- harapan: 0 baris

-- B5. View rekap memuat kolom ronde.
SELECT column_name, ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'v_arisan_rekap'
  AND column_name IN ('ronde_id', 'urutan', 'ronde_nomor')
ORDER BY ordinal_position;
-- harapan: tiga baris di posisi terakhir

SELECT tahun, bulan, pemenang_no_rumah, ronde_nomor, urutan, sudah_disalurkan
FROM public.v_arisan_rekap
WHERE tahun = 2026 AND bulan IN (9, 10)
ORDER BY bulan;

-- B6. Hak eksekusi fungsi baru hanya untuk authenticated.
SELECT p.proname,
       pg_get_userbyid(p.proowner) AS owner,
       COALESCE(array_to_string(p.proacl, ' | '), '(default)') AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'fn_mulai_arisan_ronde',
    'fn_tutup_arisan_ronde',
    'fn_simpan_arisan_putaran',
    'fn_guard_arisan_anggota'
  )
ORDER BY p.proname;

-- B7. Periode hunian: jumlah terbuka harus sama dengan rumah non-Kosong.
SELECT count(*) FILTER (WHERE tanggal_selesai IS NULL) AS periode_terbuka,
       count(*)                                        AS total_periode
FROM public.rumah_hunian;

SELECT count(*) AS rumah_non_kosong_tanpa_periode
FROM public.rumah_kk r
WHERE r.status_hunian <> 'Kosong'
  AND NOT EXISTS (
    SELECT 1 FROM public.rumah_hunian h
    WHERE h.rumah_id = r.id AND h.tanggal_selesai IS NULL
  );
-- harapan: 0

-- B8. Tidak ada irisan periode (dua lapis: exclusion constraint sudah
--     mencegah, query ini bukti tambahan).
SELECT a.rumah_id, a.id AS periode_a, b.id AS periode_b
FROM public.rumah_hunian a
JOIN public.rumah_hunian b
  ON a.rumah_id = b.rumah_id AND a.id < b.id
WHERE daterange(a.tanggal_mulai, a.tanggal_selesai)
      && daterange(b.tanggal_mulai, b.tanggal_selesai);
-- harapan: 0 baris

-- B9. RLS aktif pada tiga tabel baru.
SELECT c.relname, c.relrowsecurity,
       (SELECT count(*) FROM pg_policies pol
         WHERE pol.schemaname = 'public' AND pol.tablename = c.relname) AS jumlah_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('arisan_ronde', 'arisan_anggota', 'rumah_hunian')
ORDER BY c.relname;


-- ============================================================
-- BAGIAN 3 — UJI NEGATIF (STAGING SAJA, JANGAN DI PRODUCTION)
-- ============================================================
-- 1. Tambah anggota di tengah ronde:
--    INSERT INTO arisan_anggota (ronde_id, rumah_id)
--    VALUES ((SELECT id FROM arisan_ronde WHERE tanggal_selesai IS NULL),
--            (SELECT id FROM rumah_kk WHERE NOT ikut_arisan LIMIT 1));
--    -- harapan: ERROR 42501 "Keanggotaan arisan terkunci..."
--
-- 2. Pemenang dobel dalam satu ronde:
--    SELECT fn_simpan_arisan_putaran(11, 2026,
--      (SELECT pemenang_rumah_id FROM arisan_putaran WHERE bulan = 9), ...);
--    -- harapan: ERROR 23505 "sudah pernah menang di ronde..."
--
-- 3. Pemenang bukan anggota ronde:
--    panggil fn_simpan_arisan_putaran dengan rumah ikut_arisan = false.
--    -- harapan: ERROR 22023 "bukan anggota ronde..."
--
-- 4. Tutup ronde sebelum semua menang / sebelum disalurkan:
--    SELECT fn_tutup_arisan_ronde((SELECT id FROM arisan_ronde LIMIT 1));
--    -- harapan: ERROR 23514 "belum selesai..." atau "belum disalurkan..."
--
-- 5. Periode hunian tumpang tindih / dua periode terbuka:
--    INSERT INTO rumah_hunian (rumah_id, tanggal_mulai)
--    VALUES (yang sudah punya periode terbuka, CURRENT_DATE);
--    -- harapan: ERROR 23P01 exclusion_violation
-- ============================================================
