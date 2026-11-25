-- ============================================================
-- Verifikasi migrasi 028 (guard integritas arisan)
-- READ-ONLY — aman dijalankan sebelum/sesudah apply.
-- ============================================================
-- Ekspektasi production 25 Nov 2026:
--   - Dua fungsi guard INVOKER + dua trigger aktif.
--   - Tidak ada pengeluaran tertaut yang bersumber bukan 'Arisan'.
--   - Tidak ada setoran Arisan untuk rumah non-peserta.
-- ============================================================


-- 1. Fungsi guard terpasang dengan security INVOKER.
SELECT p.proname,
       CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security,
       p.proconfig AS set_config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('fn_guard_pengeluaran_arisan', 'fn_guard_kas_arisan')
ORDER BY p.proname;
-- harapan: 2 baris INVOKER, proconfig memuat search_path=public


-- 2. Trigger aktif di tabel yang benar.
SELECT c.relname AS tabel,
       t.tgname AS trigger,
       p.proname AS fungsi,
       t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND t.tgname IN ('trg_guard_pengeluaran_arisan', 'trg_guard_kas_arisan')
ORDER BY c.relname, t.tgname;
-- harapan: pengeluaran_kas/trg_guard_pengeluaran_arisan (O = origin)
--          kas_bulanan/trg_guard_kas_arisan (O = origin)


-- 3. Pengeluaran tertaut yang sumber dananya bukan 'Arisan'.
SELECT ap.tahun,
       ap.bulan,
       r.no_rumah,
       pk.sumber_dana,
       pk.nominal
FROM public.arisan_putaran ap
JOIN public.pengeluaran_kas pk ON pk.id = ap.pengeluaran_id
LEFT JOIN public.rumah_kk r ON r.id = ap.pemenang_rumah_id
WHERE pk.sumber_dana <> 'Arisan'
ORDER BY ap.tahun, ap.bulan;
-- harapan: 0 baris


-- 4. Setoran Arisan untuk rumah non-peserta (aturan guard 028).
WITH kandidat AS (
  SELECT kb.id,
         kb.tahun,
         kb.bulan,
         kb.rumah_id,
         r.no_rumah,
         r.ikut_arisan,
         (
           SELECT a.id
           FROM public.arisan_ronde a
           WHERE date_trunc('month', a.tanggal_mulai::timestamp)::date
                   <= make_date(kb.tahun, kb.bulan, 1)
             AND (
               a.tanggal_selesai IS NULL
               OR make_date(kb.tahun, kb.bulan, 1)
                  <= date_trunc('month', a.tanggal_selesai::timestamp)::date
             )
           ORDER BY a.tanggal_mulai DESC
           LIMIT 1
         ) AS ronde_id
  FROM public.kas_bulanan kb
  JOIN public.rumah_kk r ON r.id = kb.rumah_id
  WHERE kb.tipe_kas = 'Arisan'
)
SELECT k.tahun,
       k.bulan,
       k.no_rumah,
       k.ronde_id,
       k.ikut_arisan
FROM kandidat k
WHERE (
        k.ronde_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.arisan_anggota a
          WHERE a.ronde_id = k.ronde_id
            AND a.rumah_id = k.rumah_id
        )
      )
   OR (k.ronde_id IS NULL AND NOT k.ikut_arisan)
ORDER BY k.tahun, k.bulan, k.no_rumah;
-- harapan: 0 baris


-- 5. Ringkasan data arisan (tidak berubah oleh migrasi).
SELECT 'arisan_ronde'     AS tabel, count(*) AS baris FROM public.arisan_ronde
UNION ALL SELECT 'arisan_anggota', count(*) FROM public.arisan_anggota
UNION ALL SELECT 'arisan_putaran', count(*) FROM public.arisan_putaran
UNION ALL SELECT 'putaran_disalurkan', count(*) FROM public.arisan_putaran
          WHERE pengeluaran_id IS NOT NULL
UNION ALL SELECT 'kas_arisan', count(*) FROM public.kas_bulanan
          WHERE tipe_kas = 'Arisan'
ORDER BY tabel;
