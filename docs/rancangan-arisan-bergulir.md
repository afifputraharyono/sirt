# Rancangan: Arisan Bergulir (Putaran & Penyaluran)

Status: kode + migrasi 015 sudah live di production (2026-11-23); 013/014
sudah tercatat sebelumnya. Backfill Sep/Okt belum dijalankan.
Konteks: SIRT Wonoyoso, admin + publik mobile-only, Supabase production aktif.

## 1. Keputusan inti

Arisan adalah dana bergulir: iuran masuk lalu langsung disalurkan ke satu rumah,
sehingga saldo arisan selalu mendekati 0 dan bukan metrik yang berguna.

Yang dicatat dan ditampilkan:

| Metrik | Sumber |
| --- | --- |
| Pot terkumpul per bulan | `SUM(kas_bulanan.jumlah)` tipe `Arisan` |
| Pemenang per bulan | `arisan_putaran.pemenang_rumah_id` |
| Status penyaluran | `arisan_putaran.pengeluaran_id IS NOT NULL` |
| Sisa belum disalurkan | `terkumpul − tersalurkan` per bulan |
| Progres giliran | jumlah pemenang unik / jumlah peserta (pernah setor) |

Konsekuensi UI:

- Admin: tab baru **Putaran** di halaman `/admin/keuangan/ibu`.
- Publik: kartu **Arus Arisan**; arisan dikeluarkan dari saldo utama.
- Tidak ada istilah "Saldo Arisan" di UI.

### 1.1 Snapshot data production (2026-11-23, read-only)

- 53 rumah, semuanya `is_active`; 43 non-kosong, 10 kosong.
- Baris `kas_bulanan` tipe `Arisan`: 30 baris, **28 rumah unik**, total Rp600.000.
- Periode: Sep 2026 = 2 rumah (A30, A35), Okt 2026 = 28 rumah.
- **Nov 2026 = 0 setoran** → belum ada pot November.
- Pengeluaran `sumber_dana = 'Arisan'`: **0 baris** → belum pernah ada
  penyaluran yang tercatat.
- 15 rumah aktif non-kosong belum punya catatan arisan:
  A2, A4, A5, A8, A11, A14, A20, A26, A27, A29, A32, A39, A41, A42, A47.

Catatan pengurus: setoran Sep 2026 sebenarnya sudah dibayar semua, hanya belum
dicatat admin. Karena itu **seluruh 28 peserta dianggap wajib sejak
September** (`mulai_kewajiban.arisan = 9` tetap dipakai). Setoran Sep yang
hilang di-backfill lewat skrip terpisah di bagian 3.4 (bukan bagian dari
migrasi 015).

A12 dan A12a adalah **dua rumah berbeda** (dikonfirmasi pengurus), keduanya
peserta.

Keanggotaan arisan **tidak lagi diinferensi dari setoran**. Kolom eksplisit
`rumah_kk.ikut_arisan` menjadi sumber kebenaran:

- 28 rumah lama di-seed `true` (A30/A35 mulai Sep, sisanya Okt — tetap wajib
  sejak Sep sesuai catatan pengurus);
- 15 rumah lainnya `false`;
- rumah baru hanya di-flag saat ronde berjalan selesai.

Definisi flag ini dipakai untuk opsi pemenang, penyebut progres giliran, dan
perhitungan tagihan arisan. Peserta tidak perlu pernah setor untuk bisa
dipilih sebagai pemenang atau ditagih.

## 2. Model data

```text
rumah_kk (ikut_arisan) 1 ──< arisan_putaran >── 0..1 pengeluaran_kas
                                │ (bulan, tahun) UNIQUE
                                └──< kas_bulanan (tipe_kas = 'Arisan', periode sama)
```

- Satu putaran per bulan (`UNIQUE (tahun, bulan)`). Satu kelompok arisan.
- `pengeluaran_id` menandai pot sudah disalurkan. `NULL` = pemenang sudah
  ditetapkan tetapi uang belum keluar.
- Riwayat sebelum migrasi tidak di-backfill (pemenang lama hanya ada di teks
  `keterangan`).
- Siklus/ronde berikutnya belum dimodelkan. UI menandai rumah yang pernah
  menang dan tidak memblokir; flag `ikut_arisan` dikelola manual saat ronde
  baru dimulai. Jika kelak perlu, tambah kolom `siklus` dan ubah unique key
  menjadi `(siklus, tahun, bulan)`.

## 3. Migrasi database

### 3.1 File yang sudah ada

`supabase/migrations/20261123000015_arisan_putaran.sql` sudah berisi:

- tabel `public.arisan_putaran` + index pemenang,
- trigger `updated_at`, audit, dan validasi `pengeluaran_id` harus `sumber_dana = 'Arisan'`,
- RLS (publik SELECT, admin ALL),
- view `public.v_arisan_rekap`,
- blok rollback komentar.

### 3.2 Tambahan yang harus masuk ke migrasi 015 (belum diterapkan, aman diubah)

Penulisan data tidak boleh dua langkah dari client (pengeluaran lalu putaran)
karena bisa menyisakan pengeluaran yatim. Semua penulisan lewat RPC
transaksional.

#### a. Flag peserta arisan (`rumah_kk.ikut_arisan`)

```sql
ALTER TABLE public.rumah_kk
  ADD COLUMN ikut_arisan BOOLEAN NOT NULL DEFAULT false;

-- Seed 28 peserta dari setoran yang sudah ada (idempotent).
UPDATE public.rumah_kk r
   SET ikut_arisan = true
 WHERE EXISTS (
   SELECT 1
   FROM public.kas_bulanan kb
   WHERE kb.rumah_id = r.id
     AND kb.tipe_kas = 'Arisan'
 );
```

- Satu-satunya DML di migrasi ini; hanya mengubah kolom baru milik 28 rumah.
- Perubahan flag tercatat oleh `trg_audit_rumah_kk` yang sudah ada.
- Verifikasi sebelum/sesudah: `SELECT count(*) FROM rumah_kk WHERE ikut_arisan;`
  harus `28`; total rumah tetap 53 dan tidak ada kolom lain yang berubah.
- Toggle dilakukan manual saat ronde selesai; tidak ada logika otomatis.

#### b. RPC simpan putaran (insert / ubah / sekaligus salurkan)

```sql
CREATE OR REPLACE FUNCTION public.fn_simpan_arisan_putaran(
  p_bulan             INT,
  p_tahun             INT,
  p_pemenang_rumah_id UUID,
  p_nominal           NUMERIC,
  p_tanggal_undi      DATE    DEFAULT NULL,
  p_catatan           TEXT    DEFAULT NULL,
  p_salurkan          BOOLEAN DEFAULT false,
  p_tanggal_salur     DATE    DEFAULT NULL
)
RETURNS public.arisan_putaran
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_existing       public.arisan_putaran;
  v_ada            BOOLEAN;
  v_no_rumah       TEXT;
  v_status         public.status_hunian;
  v_aktif          BOOLEAN;
  v_pengeluaran_id UUID;
  v_hasil          public.arisan_putaran;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh mencatat putaran arisan'
      USING ERRCODE = '42501';
  END IF;

  IF p_bulan NOT BETWEEN 1 AND 12 THEN
    RAISE EXCEPTION 'Bulan tidak valid: %', p_bulan USING ERRCODE = '22023';
  END IF;
  IF p_nominal IS NULL OR p_nominal <= 0 THEN
    RAISE EXCEPTION 'Nominal pot harus lebih dari 0' USING ERRCODE = '22023';
  END IF;

  SELECT status_hunian, is_active, no_rumah
    INTO v_status, v_aktif, v_no_rumah
  FROM public.rumah_kk
  WHERE id = p_pemenang_rumah_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rumah pemenang tidak ditemukan' USING ERRCODE = '23503';
  END IF;
  IF NOT v_aktif OR v_status = 'Kosong' THEN
    RAISE EXCEPTION 'Rumah % tidak aktif/kosong, tidak bisa menjadi pemenang',
      v_no_rumah USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing
  FROM public.arisan_putaran
  WHERE tahun = p_tahun AND bulan = p_bulan;
  v_ada := FOUND;

  IF v_ada AND v_existing.pengeluaran_id IS NOT NULL THEN
    RAISE EXCEPTION 'Putaran %/% sudah disalurkan dan tidak bisa diubah',
      p_bulan, p_tahun USING ERRCODE = '23505';
  END IF;

  IF p_salurkan THEN
    INSERT INTO public.pengeluaran_kas
      (tanggal, kategori, nominal, keterangan, sumber_dana, dicatat_oleh)
    VALUES (
      COALESCE(p_tanggal_salur, CURRENT_DATE),
      'Lainnya',
      p_nominal,
      format('Penyaluran arisan %s/%s — Rumah %s', p_bulan, p_tahun, v_no_rumah),
      'Arisan',
      auth.uid()
    )
    RETURNING id INTO v_pengeluaran_id;
  END IF;

  IF v_ada THEN
    UPDATE public.arisan_putaran
       SET pemenang_rumah_id = p_pemenang_rumah_id,
           nominal           = p_nominal,
           tanggal_undi      = COALESCE(p_tanggal_undi, tanggal_undi),
           catatan           = p_catatan,
           pengeluaran_id    = COALESCE(v_pengeluaran_id, pengeluaran_id)
     WHERE id = v_existing.id
     RETURNING * INTO v_hasil;
  ELSE
    BEGIN
      INSERT INTO public.arisan_putaran
        (bulan, tahun, pemenang_rumah_id, nominal,
         tanggal_undi, pengeluaran_id, catatan, dicatat_oleh)
      VALUES
        (p_bulan, p_tahun, p_pemenang_rumah_id, p_nominal,
         p_tanggal_undi, v_pengeluaran_id, p_catatan, auth.uid())
      RETURNING * INTO v_hasil;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Putaran %/% sudah ada. Muat ulang data lalu ubah.',
        p_bulan, p_tahun USING ERRCODE = '23505';
    END;
  END IF;

  RETURN v_hasil;
END;
$$;
```

#### c. RPC tandai sudah disalurkan (untuk putaran yang sudah tercatat)

```sql
CREATE OR REPLACE FUNCTION public.fn_salurkan_arisan_putaran(
  p_id      UUID,
  p_tanggal DATE DEFAULT CURRENT_DATE
)
RETURNS public.arisan_putaran
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_putaran        public.arisan_putaran;
  v_no_rumah       TEXT;
  v_pengeluaran_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh menyalurkan arisan'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_putaran
  FROM public.arisan_putaran
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Putaran tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;
  IF v_putaran.pengeluaran_id IS NOT NULL THEN
    RAISE EXCEPTION 'Putaran ini sudah disalurkan' USING ERRCODE = '23505';
  END IF;

  SELECT no_rumah INTO v_no_rumah
  FROM public.rumah_kk
  WHERE id = v_putaran.pemenang_rumah_id;

  INSERT INTO public.pengeluaran_kas
    (tanggal, kategori, nominal, keterangan, sumber_dana, dicatat_oleh)
  VALUES (
    COALESCE(p_tanggal, CURRENT_DATE),
    'Lainnya',
    v_putaran.nominal,
    format('Penyaluran arisan %s/%s — Rumah %s',
           v_putaran.bulan, v_putaran.tahun, v_no_rumah),
    'Arisan',
    auth.uid()
  )
  RETURNING id INTO v_pengeluaran_id;

  UPDATE public.arisan_putaran
     SET pengeluaran_id = v_pengeluaran_id
   WHERE id = p_id
   RETURNING * INTO v_putaran;

  RETURN v_putaran;
END;
$$;
```

#### d. Guard hapus

Putaran yang sudah disalurkan tidak boleh dihapus karena akan menghilangkan
konteks uang yang sudah keluar.

```sql
CREATE OR REPLACE FUNCTION public.fn_guard_arisan_putaran_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.pengeluaran_id IS NOT NULL THEN
    RAISE EXCEPTION 'Putaran yang sudah disalurkan tidak boleh dihapus'
      USING ERRCODE = '23503';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_guard_delete_arisan_putaran
  BEFORE DELETE ON public.arisan_putaran
  FOR EACH ROW EXECUTE FUNCTION public.fn_guard_arisan_putaran_delete();
```

#### e. Grants fungsi

Default PostgreSQL memberi `EXECUTE` ke `PUBLIC`; cabut dari anon.

```sql
REVOKE EXECUTE ON FUNCTION public.fn_simpan_arisan_putaran(
  INT, INT, UUID, NUMERIC, DATE, TEXT, BOOLEAN, DATE) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_salurkan_arisan_putaran(UUID, DATE)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fn_simpan_arisan_putaran(
  INT, INT, UUID, NUMERIC, DATE, TEXT, BOOLEAN, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_salurkan_arisan_putaran(UUID, DATE)
  TO authenticated;
```

#### f. Rollback tambahan

```sql
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_guard_delete_arisan_putaran ON public.arisan_putaran;
-- DROP FUNCTION IF EXISTS public.fn_guard_arisan_putaran_delete();
-- DROP FUNCTION IF EXISTS public.fn_salurkan_arisan_putaran(UUID, DATE);
-- DROP FUNCTION IF EXISTS public.fn_simpan_arisan_putaran(
--   INT, INT, UUID, NUMERIC, DATE, TEXT, BOOLEAN, DATE);
-- DROP VIEW IF EXISTS public.v_arisan_rekap;
-- DROP TABLE IF EXISTS public.arisan_putaran;
-- DROP FUNCTION IF EXISTS public.fn_validate_arisan_putaran();
-- ALTER TABLE public.rumah_kk DROP COLUMN IF EXISTS ikut_arisan;
-- COMMIT;
```

### 3.3 Sifat perubahan & urutan apply

- DDL + satu DML idempotent: `UPDATE rumah_kk` menandai 28 peserta.
  Tidak ada baris kas/pengeluaran yang diubah; tabel putaran mulai kosong.
- Urutan production:
  1. **013 → 014 → 015** (skema, flag, RPC, view).
  2. `verify_arisan_putaran.sql` bagian A/B/C0/C1/C7.
  3. **Deploy frontend** (kode baru memakai `ikut_arisan`).
  4. Dry-run + apply backfill Sep/Okt (bagian 3.4) dengan persetujuan.
  5. Verify backfill (bagian 9.2).
- Mengapa frontend sebelum backfill: frontend baru mengeluarkan arisan dari
  headline saldo. Jika backfill dijalankan saat frontend lama masih live,
  saldo publik akan turun Rp600.000 karena pengeluaran arisan tiba-tiba
  terhitung tanpa pemasukan yang dulu juga sudah terhitung.
- Migrasi 013 dan 014 ternyata sudah tercatat dan diterapkan di production
  (diverifikasi 2026-11-23); saat rollout hanya 015 yang tertunda.
- Sebelum apply: hitung `rumah_kk.ikut_arisan` (harus 0 sebelum, 28 sesudah)
  dan bandingkan jumlah baris tabel lain (harus identik).
- Migrasi 015 diterapkan 2026-11-23 dalam satu transaksi dan tercatat di
  `supabase_migrations.schema_migrations`.

### 3.4 Backfill histori Sep & Okt 2026 (skrip terpisah)

Keputusan pengurus:

- Setoran Sep 2026 sebenarnya sudah dibayar semua; 26 rumah belum tercatat.
- Tanggal bayar backfill: **2026-09-30**, metode **Cash**.
- Pemenang Sep: **A22**, Okt: **A31**.
- Pot sudah benar-benar diserahkan → buat `pengeluaran_kas` dan tautkan.
- Tanggal undi & salur: akhir bulan (**2026-09-30** / **2026-10-31**).
- `dicatat_oleh`: user `role = 'admin'` pertama di `profil_pengguna`
  (skrip menampilkan nama + UUID lewat `RAISE NOTICE`; jika admin lebih dari
  satu, filter `nama_tampilan`/`id` sesuai yang berwenang).

Data existing yang tidak diubah: A30 (2026-09-11) dan A35 (2026-10-12)
tetap seperti semula; `ON CONFLICT DO NOTHING` hanya menambah 26 baris.

Dry-run (read-only):

```sql
SELECT count(*) FILTER (WHERE ikut_arisan) AS peserta,
       count(*) AS total_rumah
FROM public.rumah_kk;                                   -- 28 / 53

SELECT count(*) AS sep_sekarang
FROM public.kas_bulanan
WHERE tipe_kas = 'Arisan' AND tahun = 2026 AND bulan = 9;  -- 2

SELECT count(*) AS sep_akan_ditambah
FROM public.rumah_kk r
WHERE r.ikut_arisan
  AND NOT EXISTS (
    SELECT 1 FROM public.kas_bulanan kb
    WHERE kb.rumah_id = r.id AND kb.tipe_kas = 'Arisan'
      AND kb.tahun = 2026 AND kb.bulan = 9
  );                                                    -- 26

SELECT count(*) AS putaran_sekarang
FROM public.arisan_putaran;                             -- 0

-- Prasyarat pot: baris Sep/Okt yang ada harus lunas dan semuanya peserta.
-- Jika ada baris status_bayar = false, pot < 560.000 dan verify 9.2 gagal.
SELECT count(*) AS sep_lunas
FROM public.kas_bulanan
WHERE tipe_kas = 'Arisan' AND tahun = 2026 AND bulan = 9
  AND status_bayar;                                     -- 2

SELECT count(*) AS sep_nonpeserta
FROM public.kas_bulanan kb
JOIN public.rumah_kk r ON r.id = kb.rumah_id
WHERE kb.tipe_kas = 'Arisan' AND kb.tahun = 2026 AND kb.bulan = 9
  AND NOT r.ikut_arisan;                                -- 0

SELECT count(*) AS okt_lunas,
       COALESCE(SUM(jumlah), 0) AS okt_pot
FROM public.kas_bulanan
WHERE tipe_kas = 'Arisan' AND tahun = 2026 AND bulan = 10
  AND status_bayar;                                     -- 28 / 560000
```

Skrip apply (satu transaksi, idempotent):

```sql
BEGIN;

DO $$
DECLARE
  v_admin_id   UUID;
  v_admin_nama TEXT;
  v_pot        NUMERIC;
  v_rumah_id   UUID;
  v_jml        INT;
  v_peng_id    UUID;
  v_periode    RECORD;
BEGIN
  SELECT id, nama_tampilan
    INTO v_admin_id, v_admin_nama
  FROM public.profil_pengguna
  WHERE role = 'admin'
  ORDER BY created_at
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Tidak ada user admin untuk kolom dicatat_oleh';
  END IF;
  RAISE NOTICE 'dicatat_oleh = % (%)', v_admin_nama, v_admin_id;

  -- 1. Backfill setoran September (26 baris)
  INSERT INTO public.kas_bulanan
    (rumah_id, tipe_kas, bulan, tahun, jumlah, status_bayar,
     tanggal_bayar, metode_bayar, dicatat_oleh, keterangan)
  SELECT r.id, 'Arisan', 9, 2026, 20000, true,
         DATE '2026-09-30', 'Cash', v_admin_id,
         'Backfill setoran September 2026'
  FROM public.rumah_kk r
  WHERE r.ikut_arisan
  ON CONFLICT (rumah_id, tipe_kas, bulan, tahun) DO NOTHING;

  -- 2. Putaran + penyaluran Sep (A22) dan Okt (A31)
  FOR v_periode IN
    SELECT * FROM (VALUES
      (9::INT,  DATE '2026-09-30', 'A22'),
      (10::INT, DATE '2026-10-31', 'A31')
    ) AS t(bulan, tanggal, no_rumah)
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.arisan_putaran
      WHERE tahun = 2026 AND bulan = v_periode.bulan
    ) THEN
      RAISE NOTICE 'Putaran %/2026 sudah ada, dilewati', v_periode.bulan;
      CONTINUE;
    END IF;

    SELECT count(*), min(id) INTO v_jml, v_rumah_id
    FROM public.rumah_kk
    WHERE no_rumah = v_periode.no_rumah
      AND ikut_arisan
      AND is_active;

    IF v_jml = 0 THEN
      RAISE EXCEPTION 'Rumah % bukan peserta arisan aktif',
        v_periode.no_rumah;
    ELSIF v_jml > 1 THEN
      RAISE EXCEPTION 'No. rumah % duplikat (% rumah aktif)',
        v_periode.no_rumah, v_jml;
    END IF;

    SELECT COALESCE(SUM(jumlah), 0) INTO v_pot
    FROM public.kas_bulanan
    WHERE tipe_kas = 'Arisan' AND tahun = 2026
      AND bulan = v_periode.bulan AND status_bayar;

    IF v_pot <= 0 THEN
      RAISE EXCEPTION 'Pot % 2026 kosong', v_periode.bulan;
    END IF;

    INSERT INTO public.pengeluaran_kas
      (tanggal, kategori, nominal, keterangan, sumber_dana, dicatat_oleh)
    VALUES (
      v_periode.tanggal, 'Lainnya', v_pot,
      format('Penyaluran arisan %s/2026 — Rumah %s',
             v_periode.bulan, v_periode.no_rumah),
      'Arisan', v_admin_id
    )
    RETURNING id INTO v_peng_id;

    INSERT INTO public.arisan_putaran
      (bulan, tahun, pemenang_rumah_id, nominal, tanggal_undi,
       pengeluaran_id, catatan, dicatat_oleh)
    VALUES (
      v_periode.bulan, 2026, v_rumah_id, v_pot, v_periode.tanggal,
      v_peng_id, 'Backfill histori', v_admin_id
    );
  END LOOP;
END $$;

COMMIT;
```

Dampak data:

| Metrik | Sebelum | Sesudah |
| --- | --- | --- |
| `arisan_masuk` | Rp600.000 | Rp1.120.000 |
| Pot Sep 2026 | Rp40.000 | Rp560.000 |
| Pot Okt 2026 | Rp560.000 | Rp560.000 |
| `pengeluaran_arisan` | Rp0 | Rp1.120.000 |
| Saldo arisan | Rp600.000 | Rp0 |
| Putaran | 0 | 2 (Sep A22, Okt A31) |
| Status penyaluran | — | dua-duanya sudah disalurkan |

Rollback (manual, setelah persetujuan):

```sql
BEGIN;
CREATE TEMP TABLE tmp_backfill_pid ON COMMIT DROP AS
SELECT pengeluaran_id AS id
FROM public.arisan_putaran
WHERE tahun = 2026 AND bulan IN (9, 10)
  AND catatan = 'Backfill histori'
  AND pengeluaran_id IS NOT NULL;

UPDATE public.arisan_putaran
SET pengeluaran_id = NULL
WHERE tahun = 2026 AND bulan IN (9, 10)
  AND catatan = 'Backfill histori';

DELETE FROM public.arisan_putaran
WHERE tahun = 2026 AND bulan IN (9, 10)
  AND catatan = 'Backfill histori';

DELETE FROM public.pengeluaran_kas
WHERE id IN (SELECT id FROM tmp_backfill_pid)
  AND sumber_dana = 'Arisan'
  AND keterangan LIKE 'Penyaluran arisan %';

DELETE FROM public.kas_bulanan
WHERE tipe_kas = 'Arisan' AND tahun = 2026 AND bulan = 9
  AND keterangan = 'Backfill setoran September 2026';
COMMIT;
```

Catatan rollback: `audit_log` bersifat immutable, jadi jejak insert/delete
tetap ada. Urutan `UPDATE ... SET pengeluaran_id = NULL` wajib sebelum
`DELETE` putaran agar guard delete tidak memblokir. Filter `sumber_dana` +
`keterangan` pada `DELETE pengeluaran_kas` sengaja dipasang: bila baris
backfill sudah diedit manual setelah apply, baris itu tidak ikut terhapus
(mencegah penghapusan data yang sudah diubah) dan harus dibereskan manual.

## 4. TypeScript

### 4.1 `src/shared/types/database.ts`

```ts
// RumahKK — tambahan
ikut_arisan: boolean;

export interface ArisanPutaran {
  id: string;
  bulan: number;
  tahun: number;
  pemenang_rumah_id: string;
  nominal: number;
  tanggal_undi: string | null;
  pengeluaran_id: string | null;
  catatan: string | null;
  dicatat_oleh: string;
  created_at: string;
  updated_at: string;
}

export interface ArisanRekap {
  tahun: number;
  bulan: number;
  putaran_id: string | null;
  pemenang_rumah_id: string | null;
  pemenang_no_rumah: string | null;
  nominal_terkumpul: number;
  jumlah_pembayar: number;
  nominal_putaran: number | null;
  sudah_disalurkan: boolean;
  tanggal_undi: string | null;
  pengeluaran_id: string | null;
  catatan: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

### 4.2 `src/shared/lib/query-keys.ts`

Arisan diletakkan di bawah prefix `["kas"]` agar invalidasi `queryKeys.kas.all`
ikut menyegarkan rekap dan saldo.

```ts
arisan: {
  all: ["kas", "arisan"] as const,
  rekap: (tahun?: number) =>
    ["kas", "arisan", "rekap", tahun ?? "all"] as const,
},
```

## 5. Services & hooks

### 5.1 `src/features/keuangan/services.ts`

```ts
export async function fetchArisanRekap(tahun?: number) {
  let query = supabase
    .from("v_arisan_rekap")
    .select("*")
    .order("tahun", { ascending: false })
    .order("bulan", { ascending: false });

  if (tahun) query = query.eq("tahun", tahun);

  const { data, error } = await query;
  if (error) throw error;
  return data as ArisanRekap[];
}

export interface SimpanArisanPutaranInput {
  bulan: number;
  tahun: number;
  pemenang_rumah_id: string;
  nominal: number;
  tanggal_undi: string | null;
  catatan: string | null;
  salurkan: boolean;
  tanggal_salur: string | null;
}

export async function simpanArisanPutaran(input: SimpanArisanPutaranInput) {
  const { data, error } = await supabase.rpc("fn_simpan_arisan_putaran", {
    p_bulan: input.bulan,
    p_tahun: input.tahun,
    p_pemenang_rumah_id: input.pemenang_rumah_id,
    p_nominal: input.nominal,
    p_tanggal_undi: input.tanggal_undi,
    p_catatan: input.catatan,
    p_salurkan: input.salurkan,
    p_tanggal_salur: input.tanggal_salur,
  });
  if (error) throw error;
  return data as ArisanPutaran;
}

export async function salurkanArisanPutaran(id: string, tanggal: string) {
  const { data, error } = await supabase.rpc("fn_salurkan_arisan_putaran", {
    p_id: id,
    p_tanggal: tanggal,
  });
  if (error) throw error;
  return data as ArisanPutaran;
}

export async function deleteArisanPutaran(id: string) {
  const { error } = await supabase.from("arisan_putaran").delete().eq("id", id);
  if (error) throw error;
}
```

### 5.2 `src/features/keuangan/hooks.ts`

```ts
export function useArisanRekap(tahun?: number) {
  return useQuery({
    queryKey: queryKeys.arisan.rekap(tahun),
    queryFn: () => fetchArisanRekap(tahun),
  });
}

export function useSimpanArisanPutaran() {
  return useOfflineMutation({
    offlineKey: "arisan:simpan",
    mutationFn: (input: SimpanArisanPutaranInput) => simpanArisanPutaran(input),
    queryKeyToInvalidate: queryKeys.kas.all,
    onSuccess: () => toast.success("Putaran arisan tersimpan"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSalurkanArisanPutaran() {
  return useOfflineMutation({
    offlineKey: "arisan:salurkan",
    mutationFn: ({ id, tanggal }: { id: string; tanggal: string }) =>
      salurkanArisanPutaran(id, tanggal),
    queryKeyToInvalidate: queryKeys.kas.all,
    onSuccess: () => toast.success("Pot arisan ditandai tersalurkan"),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteArisanPutaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteArisanPutaran(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Putaran arisan dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
```

### 5.3 `src/shared/lib/mutation-registry.ts`

```ts
"arisan:simpan": (vars: SimpanArisanPutaranInput) => simpanArisanPutaran(vars),
"arisan:salurkan": ({ id, tanggal }: { id: string; tanggal: string }) =>
  salurkanArisanPutaran(id, tanggal),
```

Catatan offline: RPC memakai `auth.uid()` saat replay, dan unique
`(tahun, bulan)` mencegah duplikasi. Error duplikat akan muncul sebagai toast
saat sinkronisasi.

## 6. Admin UI

### 6.1 Perubahan `src/app/routes/admin.keuangan.tsx`

- `MODE_CONFIGS.ibu.saldoCards`: ganti label `Arisan` menjadi
  **`Arisan belum disalurkan`**; nilainya tetap
  `arisan_masuk − pengeluaran_arisan`.
- Tab untuk mode `ibu`: `Kas Ibu → Arisan → Putaran → Pengeluaran`
  (4 tab, sudah scrollable). Mode `bapak` tidak berubah.
- Render `{tab === "putaran" && <ArisanPutaranTab bulan={bulan} tahun={tahun} />}`.

Perubahan pendukung di halaman Warga (`admin.warga.tsx`):

- Tambah checkbox di drawer rumah: **"Ikut Arisan"**
  (`defaultChecked={editRumah?.ikut_arisan ?? false}`), ikut ke payload
  `handleRumahSubmit`.
- Tambah badge kecil `Arisan` pada kartu rumah yang flag-nya aktif.
- `CreateRumahInput` di `src/features/warga/services.ts` menambah `"ikut_arisan"`.
- Flag hanya diubah admin; perubahan tercatat di `audit_log`.

### 6.2 Komponen baru `src/features/keuangan/components/ArisanPutaranTab.tsx`

Mengikuti pola `SectionCard`, `AddButton`, `BottomDrawer`, `AlertDialog`,
`Skeleton`, dan badge yang sudah ada.

Struktur:

```text
SectionCard
├─ Stat scroll (3 kartu w-35 shrink-0, mono tabular)
│   1. Pot belum disalurkan   Σ nominal_terkumpul (belum_disalurkan)
│   2. Sudah disalurkan       Σ nominal_putaran (sudah_disalurkan)
│   3. Giliran                n/28 + progress bar (penyebut = ikut_arisan)
├─ Banner amber (jika bulan terpilih punya setoran tapi belum diundi)
│   "Pot <Bulan> Rp600.000 belum diundi"   [Catat putaran]
├─ Header aksi: "Putaran <tahun>" + AddButton "Catat putaran"
├─ List card per bulan (desc)
│   ├─ Bulan Tahun        [badge status: ikon + teks]
│   ├─ Pemenang: Rumah 07 / "Belum diundi"
│   ├─ Terkumpul · Tersalurkan · Sisa   (mono)
│   └─ Aksi: Ubah | Salurkan | Hapus (sesuai status)
└─ Empty state: "Belum ada putaran. Mulai dari pot bulan ini."
```

Aturan status (wajib ikon + teks, bukan warna saja):

| Kondisi | Badge | Aksi |
| --- | --- | --- |
| `putaran_id == null` | abu, `Circle` — Belum diundi | Catat |
| `pengeluaran_id == null` | amber, `Clock` — Belum disalurkan | Ubah, Salurkan, Hapus |
| `pengeluaran_id != null` | emerald, `CheckCircle2` — Sudah disalurkan | tidak ada |

Bottom sheet `Catat/Ubah putaran`:

| Field | Perilaku |
| --- | --- |
| Bulan, Tahun | disabled saat ubah; default dari filter halaman |
| Pemenang | select `rumah_kk.ikut_arisan = true` dan aktif, diambil dari `useRumahList()`; opsi diberi label `(pernah menang Okt 2026)` jika ada di rekap, tetap boleh dipilih |
| Nominal pot | default `nominal_terkumpul` bulan itu; `min 1`; helper "Pot = setoran arisan yang sudah masuk" |
| Tanggal undi | date, default hari ini |
| Catatan | opsional |
| Checkbox `Sekaligus catat penyaluran` | default checked untuk putaran baru; menampilkan tanggal salur + preview keterangan `Penyaluran arisan 11/2026 — Rumah 07` |
| Footer | `Batal` + `Simpan putaran` (disabled saat pending; label `Menyimpan...`) |

Validasi klien: pemenang wajib, nominal > 0. Error server ditampilkan lewat
toast (mis. `Putaran 11/2026 sudah ada`).

Jika `nominal_terkumpul` bulan tersebut = 0 dan belum ada putaran, CTA
`Catat putaran` dinonaktifkan dengan helper "Catat setoran Arisan bulan ini
dulu" — mencegah pot kosong tercatat sebagai tersalurkan.

Konfirmasi hapus: `AlertDialog` — "Hapus putaran? Hanya putaran yang belum
disalurkan yang bisa dihapus."

### 6.3 Mobile/UX checklist

- Target sentuh minimum 40–44px; jarak antar-aksi ≥ 8px.
- Sheet maksimum `85dvh`, footer sticky, `safe-area-pb`.
- Angka uang `font-mono` (tabular) agar tidak bergeser.
- Skeleton saat loading; empty state informatif.
- Dark mode memakai token yang sama (`emerald-600 dark:emerald-400`, amber,
  `text-destructive`).
- Satu CTA utama per layar: `Catat putaran`.

## 7. Publik UI

### 7.1 Perubahan `src/app/routes/keuangan.public.tsx`

Saldo utama menjadi kas operasional saja:

```ts
const totalMasuk =
  (saldo?.kas_bapak_masuk ?? 0) +
  (saldo?.kas_ibu_masuk ?? 0) +
  (saldo?.jimpitan_masuk ?? 0) +
  (saldo?.iuran_insidental_masuk ?? 0);

const totalKeluar =
  (saldo?.total_pengeluaran ?? 0) - (saldo?.pengeluaran_arisan ?? 0);

const saldoAkhir = totalMasuk - totalKeluar;
```

- Grid `sumberDana` menghapus kartu `Arisan` (tersisa 3 kartu).
- Daftar & total **Pengeluaran** bulanan juga mengecualikan
  `sumber_dana = 'Arisan'`, agar konsisten dengan headline. Penyaluran
  arisan tetap terlihat di kartu Arus Arisan.
- Tambah catatan: "Saldo tidak termasuk arisan — dana bergulir, langsung
  disalurkan ke pemenang."
- Tambah kartu `ArusArisanCard` di bawah grid sumber dana.

### 7.2 Komponen baru `src/features/public/components/ArisanFlowCard.tsx`

Props: `bulan`, `tahun` (mengikuti filter halaman).

```text
Card rounded-[18px]
├─ Header: "Arus Arisan" + subjudul "Dana bergulir — tidak disimpan"
├─ Baris status bulan terpilih (3 state)
│   Belum diundi / Belum disalurkan / Sudah disalurkan  (ikon + teks)
├─ Pemenang: Rumah 07 · undi 5 Nov 2026
├─ 3 angka: Terkumpul · Tersalurkan · Sisa
├─ Timeline 3 bulan terakhir (bulan, pemenang, badge)
└─ Footnote privasi: hanya nomor rumah & nominal yang ditampilkan
```

Data dari `useArisanRekap(tahun)` (hook yang sama dengan admin, cache
terpisah per tahun). Tidak ada data pribadi warga.

Empty state: jika view belum ada (mis. frontend ter-deploy sebelum migrasi
karena alasan lain), kartu disembunyikan dan halaman tetap normal
(`isError` → `return null`), sehingga tidak memecahkan halaman.

### 7.3 Tagihan warga (`src/features/public/services.ts`)

Ganti inferensi peserta dengan flag:

```ts
// sebelum: peserta = punya minimal satu baris Arisan
const pesertaArisan = (arisanRows?.length ?? 0) > 0;

// sesudah: peserta = flag eksplisit
const pesertaArisan = rumah.ikut_arisan;
```

- `select` rumah menjadi `id, no_rumah, status_hunian, is_active, ikut_arisan`.
- Query kedua (`kas_bulanan` Arisan untuk inferensi) dihapus.
- `MULAI_KEWAJIBAN.arisan = 9` tetap; seluruh peserta dianggap wajib sejak
  September sesuai catatan pengurus, terlepas dari setoran yang tercatat.
- Konsekuensi: 26 peserta yang belum punya baris Sep akan tampil menunggak
  Sep sampai backfill bagian 3.4 dijalankan (atau admin mencatat manual).
  Backfill hanya dijalankan dengan persetujuan karena menulis data keuangan.

## 8. File yang berubah / baru

| File | Aksi |
| --- | --- |
| `supabase/migrations/20261123000015_arisan_putaran.sql` | flag `ikut_arisan` + seed 28, 2 RPC, guard delete, grants, rollback |
| `supabase/scripts/verify_arisan_putaran.sql` | tambah pengujian flag & RPC (bagian C) |
| `src/shared/types/database.ts` | `RumahKK.ikut_arisan`, `ArisanPutaran`, `ArisanRekap` |
| `src/features/warga/services.ts` | `CreateRumahInput` + `"ikut_arisan"` |
| `src/app/routes/admin.warga.tsx` | checkbox "Ikut Arisan" + badge kartu |
| `src/shared/lib/query-keys.ts` | `queryKeys.arisan` |
| `src/features/keuangan/services.ts` | fetch + 3 mutasi |
| `src/features/keuangan/hooks.ts` | 4 hook |
| `src/shared/lib/mutation-registry.ts` | 2 entri offline |
| `src/app/routes/admin.keuangan.tsx` | label kartu, tab Putaran, render komponen |
| `src/features/keuangan/components/ArisanPutaranTab.tsx` | baru |
| `src/app/routes/keuangan.public.tsx` | saldo operasional, hapus kartu arisan, render kartu |
| `src/features/public/services.ts` | tagihan memakai flag `ikut_arisan` |
| `src/features/public/components/ArisanFlowCard.tsx` | baru |

Tidak ada perubahan router.

## 9. Verifikasi

### 9.1 SQL (read-only + uji RPC di staging)

Tambahan pada `verify_arisan_putaran.sql`:

- C0: `rumah_kk.ikut_arisan` ada; jumlah `true` = 28; total rumah tetap 53;
  daftar rumah `true` sama dengan 28 rumah yang punya setoran arisan.
- C1: kedua fungsi ada dan `EXECUTE` hanya untuk `authenticated`.
- C2: panggil `fn_simpan_arisan_putaran` sebagai admin → baris putaran dibuat.
- C3: panggil bulan yang sama → error `sudah ada`.
- C4: `p_salurkan = true` → `pengeluaran_kas` bertambah dengan
  `sumber_dana = 'Arisan'`, nominal sama, `pengeluaran_id` terisi.
- C5: panggil `fn_salurkan_arisan_putaran` pada putaran yang sudah
  disalurkan → error.
- C6: `DELETE` putaran yang sudah disalurkan → error guard.
- C7: `v_arisan_rekap` per bulan: `nominal_terkumpul` = sum kas arisan,
  `sudah_disalurkan` konsisten dengan `pengeluaran_id`.
- Uji negatif: pengeluaran non-Arisan tidak bisa ditautkan (trigger lama).

Catatan: pengujian RPC yang menulis data **hanya di staging**, bukan
production. Di production cukup C1 + C7 + hitung baris sebelum/sesudah.

### 9.2 Verifikasi backfill (setelah bagian 3.4)

Jalankan dalam satu transaksi read-only:

```sql
-- setoran
SELECT count(*) AS sep_rows,
       count(*) FILTER (WHERE status_bayar) AS sep_lunas,
       COALESCE(SUM(jumlah), 0) AS sep_total
FROM public.kas_bulanan
WHERE tipe_kas = 'Arisan' AND tahun = 2026 AND bulan = 9;
-- harapan: 28 baris, 28 lunas, 560000

SELECT count(*) AS dobel
FROM (
  SELECT rumah_id, tipe_kas, bulan, tahun, count(*)
  FROM public.kas_bulanan
  WHERE tipe_kas = 'Arisan' AND tahun = 2026 AND bulan = 9
  GROUP BY 1,2,3,4 HAVING count(*) > 1
) t;
-- harapan: 0

-- putaran & penyaluran
SELECT p.bulan, r.no_rumah, p.nominal, p.tanggal_undi,
       (p.pengeluaran_id IS NOT NULL) AS disalurkan
FROM public.arisan_putaran p
JOIN public.rumah_kk r ON r.id = p.pemenang_rumah_id
WHERE p.tahun = 2026 AND p.bulan IN (9,10)
ORDER BY p.bulan;
-- harapan: (9, A22, 560000, 2026-09-30, true)
--          (10, A31, 560000, 2026-10-31, true)

SELECT count(*) AS pengeluaran_arisan,
       COALESCE(SUM(nominal),0) AS total
FROM public.pengeluaran_kas
WHERE sumber_dana = 'Arisan';
-- harapan: 2 baris, 1120000

-- konsistensi view & saldo
SELECT * FROM public.v_arisan_rekap
WHERE tahun = 2026 AND bulan IN (9,10) ORDER BY bulan;

SELECT arisan_masuk, pengeluaran_arisan,
       arisan_masuk - pengeluaran_arisan AS saldo_arisan
FROM public.v_saldo_kas;
-- harapan: 1120000, 1120000, 0

-- atribusi
SELECT DISTINCT dicatat_oleh FROM public.kas_bulanan
WHERE keterangan = 'Backfill setoran September 2026';
-- harapan: satu UUID admin yang di-notice saat apply
```

### 9.3 Aplikasi

- `npm run build` (tsc + vite).
- `npm run lint`.
- Manual (mobile viewport):
  1. Admin → Keuangan Ibu → Putaran → catat putaran tanpa penyaluran.
  2. Cek badge amber, kartu stat, dan tab Pengeluaran belum bertambah.
  3. Salurkan → pengeluaran baru `Arisan` muncul; badge emerald; saldo
     "Arisan belum disalurkan" turun.
  4. Coba ubah/hapus putaran tersalurkan → ditolak dengan pesan jelas.
  5. Publik → Laporan: saldo tidak terpengaruh arisan; kartu Arus Arisan
     menampilkan status, pemenang, dan timeline.
  6. Dark mode + safe-area + keyboard pada sheet.

## 10. Rollout & risiko

Urutan:

1. Pre-check: jumlah rumah (53), peserta setelah seed (28), Sep rows (2).
2. Apply 015 (013/014 sudah terpasang dan tercatat).
3. Jalankan verify 015 (read-only).
4. Deploy frontend.
5. Dry-run backfill; setujui lalu apply bagian 3.4.
6. Verify backfill (9.2).
7. Smoke test admin + publik dengan data histori Sep/Okt.

Jangan menjalankan backfill sebelum frontend baru live: frontend lama
menghitung arisan di headline, sehingga saldo publik akan turun Rp600.000
saat pengeluaran arisan muncul.

Risiko dan mitigasi:

| Risiko | Mitigasi |
| --- | --- |
| Frontend live sebelum migrasi | kartu publik `isError → null`; tab admin menampilkan error + retry |
| Dua admin mencatat bulan sama | unique key + pesan "sudah ada, muat ulang" |
| Pemenang dobel dalam satu ronde | UI menandai riwayat menang; tidak diblokir DB (ronde berikutnya) |
| Pengeluaran dihapus manual | `ON DELETE SET NULL`; putaran berubah jadi "belum disalurkan", terdeteksi verify C4 |
| Offline replay ganda | unique key mencegah duplikasi; toast error saat sync |
| Kategori pengeluaran | `Lainnya` (diputuskan) |
| Flag peserta salah set | hanya admin; perubahan tercatat di `audit_log`; seed migrasi idempotent dan diverifikasi 28 baris |

## 11. Keputusan final (2026-11-23)

1. Kategori pengeluaran penyaluran: **`Lainnya`**.
2. Arisan dikeluarkan dari saldo publik: **ya** (pemasukan dan pengeluaran
   arisan tidak masuk headline; tetap tampil di kartu Arus Arisan).
3. Penyaluran otomatis membuat baris `pengeluaran_kas` via RPC: **ya**.
4. Label tab: **`Putaran`**.
5. Keanggotaan arisan: **flag boolean `rumah_kk.ikut_arisan`** (bukan tabel
   peserta). 28 rumah di-seed `true`; rumah lain menunggu ronde selesai.
6. Setoran Sep 2026 dianggap sudah dibayar semua meski belum tercatat;
   tidak ada backfill otomatis.

Data: migrasi 015 sudah diterapkan 2026-11-23 (DDL + seed flag 28 rumah).
Backfill Sep/Okt belum dijalankan; pembacaan data sebelum apply memakai
anon key read-only sesuai RLS publik, tanpa mencetak kredensial.
