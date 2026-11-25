-- ============================================================
-- Verifikasi migrasi 025 — READ-ONLY
-- ============================================================

-- 1. View ada dan kolomnya lengkap.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'v_arisan_anggota_publik'
ORDER BY ordinal_position;
-- harapan: rumah_id, ronde_id, ronde_nomor, tanggal_mulai,
--          tanggal_selesai, jumlah_anggota

-- 2. Isi view konsisten dengan arisan_anggota.
SELECT (SELECT count(*) FROM public.arisan_anggota) AS baris_tabel,
       (SELECT count(*) FROM public.v_arisan_anggota_publik) AS baris_view;
-- harapan: sama (28)

-- 3. Durasi ronde 1 = 28 bulan, mulai 2026-09-01.
SELECT ronde_nomor, tanggal_mulai::text AS mulai,
       tanggal_selesai::text AS selesai, jumlah_anggota,
       count(*) AS baris
FROM public.v_arisan_anggota_publik
GROUP BY 1, 2, 3, 4
ORDER BY 1;

-- 4. Anon bisa membaca view; tidak bisa membaca tabel sumber.
--    Uji lewat REST: GET /rest/v1/v_arisan_anggota_publik (200)
--    dan GET /rest/v1/arisan_anggota (kosong/denied).
