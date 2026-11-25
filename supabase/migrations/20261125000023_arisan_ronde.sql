-- ============================================================
-- Migration 023: Ronde & keanggotaan arisan
-- ============================================================
-- Konteks:
--   Sampai 015, arisan hanya punya putaran bulanan dan flag boolean
--   rumah_kk.ikut_arisan. Tidak ada konsep siklus, sehingga:
--     - pemenang yang sama bisa menang berkali-kali,
--     - anggota baru bisa masuk di tengah siklus tanpa ada dasar
--       periode kewajiban,
--     - tidak ada cara menutup siklus setelah semua anggota menang.
--
--   Migrasi ini memperkenalkan ronde (siklus) dan keanggotaan per
--   ronde. Aturan yang ditegakkan di database:
--     1. Hanya satu ronde berjalan (tanggal_selesai IS NULL).
--     2. Keanggotaan dibekukan setelah ronde dibuat; perubahan hanya
--        lewat fn_mulai_arisan_ronde (atau akses maintenance tanpa JWT).
--     3. Pemenang wajib anggota ronde dan tidak boleh menang dua kali
--        dalam ronde yang sama.
--     4. Urutan putaran diturunkan dari bulan ronde, bukan diketik bebas.
--     5. Ronde hanya bisa ditutup setelah semua anggota menang dan
--        seluruh pot disalurkan.
--     6. Putaran tidak bisa ditambah/diubah pada ronde yang sudah ditutup.
--
-- Sifat perubahan:
--   DDL + DML backfill idempotent:
--     - dua tabel baru (arisan_ronde, arisan_anggota),
--     - dua kolom baru di arisan_putaran (ronde_id, urutan),
--     - ronde 1 diisi dari putaran yang ada + 28 peserta ikut_arisan,
--     - tidak ada baris kas_bulanan/pengeluaran_kas yang diubah.
--
-- Pre-check read-only (production 2026-11-25):
--   SELECT bulan, tahun, nominal, pengeluaran_id IS NOT NULL AS disalurkan
--   FROM public.arisan_putaran ORDER BY tahun, bulan;
--   -- 2 baris: (9, 2026, 560000, true) A22, (10, 2026, 560000, true) A52
--
--   SELECT count(*) FROM public.rumah_kk WHERE ikut_arisan; -- 28
--   SELECT count(*) FROM public.rumah_kk;                   -- 53
--
--   Kedua pemenang harus ikut_arisan = true. Jika tidak, backfill
--   anggota gagal pada validasi pemenang saat putaran diubah.
--
-- Dependensi:
--   - public.arisan_putaran, public.rumah_kk (001/013/015)
--   - public.fn_update_timestamp() (001), public.fn_audit_trigger() (005),
--     public.is_admin() (006)
-- ============================================================


-- ========================
-- TABEL: arisan_ronde
-- ========================
-- Satu ronde = satu siklus penuh. tanggal_selesai NULL berarti ronde
-- masih berjalan. Nomor urut ronde dipakai UI untuk label "Ronde 2".

CREATE TABLE public.arisan_ronde (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor            INT  NOT NULL UNIQUE CHECK (nomor >= 1),
  tanggal_mulai    DATE NOT NULL,
  tanggal_selesai  DATE,
  catatan          TEXT,
  dicatat_oleh     UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT arisan_ronde_awal_bulan
    CHECK (tanggal_mulai = date_trunc('month', tanggal_mulai::timestamp)::date),
  CONSTRAINT arisan_ronde_periode_valid
    CHECK (tanggal_selesai IS NULL OR tanggal_selesai >= tanggal_mulai)
);

-- Maksimal satu ronde berjalan, pola sama dengan periode ronda (019).
CREATE UNIQUE INDEX arisan_ronde_satu_berjalan
  ON public.arisan_ronde ((true))
  WHERE tanggal_selesai IS NULL;

CREATE TRIGGER trg_updated_at_arisan_ronde
  BEFORE UPDATE ON public.arisan_ronde
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();

CREATE TRIGGER trg_audit_arisan_ronde
  AFTER INSERT OR UPDATE OR DELETE ON public.arisan_ronde
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();


-- ========================
-- TABEL: arisan_anggota
-- ========================
-- Keanggotaan per ronde direkam saat ronde dimulai. Baris tidak punya
-- updated_at karena tidak boleh berubah setelah ronde berjalan.

CREATE TABLE public.arisan_anggota (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ronde_id   UUID NOT NULL REFERENCES public.arisan_ronde(id) ON DELETE RESTRICT,
  rumah_id   UUID NOT NULL REFERENCES public.rumah_kk(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT arisan_anggota_unik UNIQUE (ronde_id, rumah_id)
);

CREATE INDEX idx_arisan_anggota_rumah ON public.arisan_anggota(rumah_id);

CREATE TRIGGER trg_audit_arisan_anggota
  AFTER INSERT OR UPDATE OR DELETE ON public.arisan_anggota
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Guard perubahan keanggotaan.
-- Admin tidak bisa menambah/menghapus anggota di tengah ronde. Satu-satunya
-- jalur sah adalah fn_mulai_arisan_ronde, yang menandai transaksi lewat
-- GUC sirt.arisan_ronde_baru. Akses maintenance (auth.uid() NULL, mis.
-- SQL Editor/service role) tetap diizinkan untuk perbaikan darurat.
CREATE OR REPLACE FUNCTION public.fn_guard_arisan_anggota()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR current_setting('sirt.arisan_ronde_baru', true) = '1'
  THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  RAISE EXCEPTION 'Keanggotaan arisan terkunci setelah ronde dimulai'
    USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER trg_guard_arisan_anggota
  BEFORE INSERT OR UPDATE OR DELETE ON public.arisan_anggota
  FOR EACH ROW EXECUTE FUNCTION public.fn_guard_arisan_anggota();


-- ========================
-- ARISAN_PUTARAN: ronde & urutan
-- ========================

ALTER TABLE public.arisan_putaran
  ADD COLUMN ronde_id UUID REFERENCES public.arisan_ronde(id) ON DELETE RESTRICT,
  ADD COLUMN urutan   INT;


-- ========================
-- BACKFILL RONDE 1
-- ========================
-- Ronde dimulai pada bulan putaran paling awal yang sudah tercatat
-- (Sep 2026). Seluruh rumah ikut_arisan menjadi anggota ronde itu,
-- termasuk yang belum pernah setor. dicatat_oleh diwarisi dari putaran
-- pertama agar tidak perlu menebak admin.

DO $$
DECLARE
  v_ronde_id    UUID;
  v_dicatat     UUID;
  v_start_tahun INT;
  v_start_bulan INT;
  v_putaran     INT;
  v_anggota     INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.arisan_putaran) THEN
    RAISE NOTICE 'arisan_putaran kosong; ronde 1 dibuat lewat fn_mulai_arisan_ronde';
    RETURN;
  END IF;

  SELECT tahun, bulan, dicatat_oleh
    INTO v_start_tahun, v_start_bulan, v_dicatat
  FROM public.arisan_putaran
  ORDER BY tahun, bulan
  LIMIT 1;

  INSERT INTO public.arisan_ronde (nomor, tanggal_mulai, catatan, dicatat_oleh)
  VALUES (
    1,
    make_date(v_start_tahun, v_start_bulan, 1),
    'Backfill migrasi 023 — ronde berjalan saat migrasi',
    v_dicatat
  )
  RETURNING id INTO v_ronde_id;

  INSERT INTO public.arisan_anggota (ronde_id, rumah_id)
  SELECT v_ronde_id, id
  FROM public.rumah_kk
  WHERE ikut_arisan;

  IF NOT EXISTS (
    SELECT 1 FROM public.arisan_anggota WHERE ronde_id = v_ronde_id
  ) THEN
    RAISE EXCEPTION 'Tidak ada rumah ikut_arisan untuk anggota ronde 1';
  END IF;

  UPDATE public.arisan_putaran
     SET ronde_id = v_ronde_id,
         urutan   = ((tahun * 12 + bulan - 1)
                     - (v_start_tahun * 12 + v_start_bulan - 1)) + 1
   WHERE ronde_id IS NULL;

  SELECT count(*) INTO v_putaran FROM public.arisan_putaran;
  SELECT count(*) INTO v_anggota FROM public.arisan_anggota WHERE ronde_id = v_ronde_id;
  RAISE NOTICE 'Backfill ronde 1: % putaran, % anggota', v_putaran, v_anggota;
END $$;

ALTER TABLE public.arisan_putaran
  ALTER COLUMN ronde_id SET NOT NULL,
  ALTER COLUMN urutan   SET NOT NULL;

ALTER TABLE public.arisan_putaran
  DROP CONSTRAINT IF EXISTS arisan_putaran_urutan_valid;
ALTER TABLE public.arisan_putaran
  ADD CONSTRAINT arisan_putaran_urutan_valid CHECK (urutan >= 1);

ALTER TABLE public.arisan_putaran
  DROP CONSTRAINT IF EXISTS arisan_putaran_ronde_urutan_key;
ALTER TABLE public.arisan_putaran
  ADD CONSTRAINT arisan_putaran_ronde_urutan_key UNIQUE (ronde_id, urutan);

ALTER TABLE public.arisan_putaran
  DROP CONSTRAINT IF EXISTS arisan_putaran_ronde_pemenang_key;
ALTER TABLE public.arisan_putaran
  ADD CONSTRAINT arisan_putaran_ronde_pemenang_key
  UNIQUE (ronde_id, pemenang_rumah_id);


-- ========================
-- VALIDASI PUTARAN (diperluas)
-- ========================
-- Menggantikan fungsi 015. Validasi lama (pengeluaran harus bersumber
-- 'Arisan') dipertahankan; ditambah konsistensi ronde.

CREATE OR REPLACE FUNCTION public.fn_validate_arisan_putaran()
RETURNS TRIGGER AS $$
DECLARE
  v_sumber_dana TEXT;
  v_ronde       public.arisan_ronde;
  v_urutan      INT;
BEGIN
  IF NEW.pengeluaran_id IS NOT NULL THEN
    SELECT sumber_dana INTO v_sumber_dana
    FROM public.pengeluaran_kas
    WHERE id = NEW.pengeluaran_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'pengeluaran_id % tidak ditemukan', NEW.pengeluaran_id;
    END IF;

    IF v_sumber_dana <> 'Arisan' THEN
      RAISE EXCEPTION 'pengeluaran_id % bersumber_dana %, harus Arisan',
        NEW.pengeluaran_id, v_sumber_dana;
    END IF;
  END IF;

  IF NEW.ronde_id IS NULL OR NEW.urutan IS NULL THEN
    RAISE EXCEPTION 'ronde_id dan urutan wajib diisi' USING ERRCODE = '23502';
  END IF;

  SELECT * INTO v_ronde FROM public.arisan_ronde WHERE id = NEW.ronde_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ronde % tidak ditemukan', NEW.ronde_id USING ERRCODE = '23503';
  END IF;

  IF v_ronde.tanggal_selesai IS NOT NULL THEN
    RAISE EXCEPTION 'Ronde % sudah ditutup; putaran tidak bisa diubah',
      v_ronde.nomor USING ERRCODE = '23514';
  END IF;

  v_urutan := ((NEW.tahun * 12 + NEW.bulan - 1)
               - (extract(year FROM v_ronde.tanggal_mulai)::int * 12
                  + extract(month FROM v_ronde.tanggal_mulai)::int - 1)) + 1;

  IF v_urutan <> NEW.urutan THEN
    RAISE EXCEPTION 'Urutan % tidak sesuai periode %/% pada ronde % (seharusnya %)',
      NEW.urutan, NEW.bulan, NEW.tahun, v_ronde.nomor, v_urutan
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.arisan_anggota
    WHERE ronde_id = NEW.ronde_id
      AND rumah_id = NEW.pemenang_rumah_id
  ) THEN
    RAISE EXCEPTION 'Rumah % bukan anggota ronde %',
      NEW.pemenang_rumah_id, v_ronde.nomor USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- ========================
-- RPC: MULAI RONDE
-- ========================
-- Satu-satunya jalur sah untuk membuat ronde beserta anggotanya.
-- Dicatat dalam satu transaksi; bila satu anggota tidak valid, ronde
-- dan seluruh keanggotaannya ikut dibatalkan.

CREATE OR REPLACE FUNCTION public.fn_mulai_arisan_ronde(
  p_tanggal_mulai DATE,
  p_anggota       UUID[],
  p_catatan       TEXT DEFAULT NULL
)
RETURNS public.arisan_ronde
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ronde    public.arisan_ronde;
  v_nomor    INT;
  v_invalid  TEXT;
  v_dobel    INT;
  v_jml      INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh memulai ronde arisan'
      USING ERRCODE = '42501';
  END IF;

  IF p_tanggal_mulai IS NULL
     OR p_tanggal_mulai <> date_trunc('month', p_tanggal_mulai::timestamp)::date
  THEN
    RAISE EXCEPTION 'Tanggal mulai ronde harus tanggal 1' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.arisan_ronde WHERE tanggal_selesai IS NULL) THEN
    RAISE EXCEPTION 'Masih ada ronde berjalan; tutup dulu sebelum memulai ronde baru'
      USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.arisan_ronde WHERE tanggal_mulai >= p_tanggal_mulai
  ) THEN
    RAISE EXCEPTION 'Tanggal mulai harus setelah ronde sebelumnya' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.arisan_ronde
    WHERE tanggal_selesai IS NOT NULL
      AND p_tanggal_mulai <= date_trunc('month', tanggal_selesai::timestamp)::date
  ) THEN
    RAISE EXCEPTION 'Ronde baru harus mulai setelah bulan ronde sebelumnya ditutup'
      USING ERRCODE = '22023';
  END IF;

  IF p_anggota IS NULL OR cardinality(p_anggota) = 0 THEN
    RAISE EXCEPTION 'Ronde harus punya minimal satu anggota' USING ERRCODE = '22023';
  END IF;

  SELECT count(DISTINCT x.rumah_id) INTO v_dobel
  FROM unnest(p_anggota) AS x(rumah_id);

  IF v_dobel <> cardinality(p_anggota) THEN
    RAISE EXCEPTION 'Daftar anggota ronde memuat rumah duplikat' USING ERRCODE = '22023';
  END IF;

  SELECT string_agg(x.rumah_id::text, ', ') INTO v_invalid
  FROM unnest(p_anggota) AS x(rumah_id)
  LEFT JOIN public.rumah_kk r ON r.id = x.rumah_id
  WHERE r.id IS NULL
     OR NOT r.is_active
     OR r.status_hunian = 'Kosong'
     OR NOT r.ikut_arisan;

  IF v_invalid IS NOT NULL THEN
    RAISE EXCEPTION 'Rumah tidak valid sebagai anggota ronde (tidak aktif/kosong/bukan peserta): %',
      v_invalid USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(max(nomor), 0) + 1 INTO v_nomor FROM public.arisan_ronde;

  INSERT INTO public.arisan_ronde (nomor, tanggal_mulai, catatan, dicatat_oleh)
  VALUES (v_nomor, p_tanggal_mulai, p_catatan, auth.uid())
  RETURNING * INTO v_ronde;

  -- Membuka kunci keanggotaan hanya untuk transaksi ini.
  PERFORM set_config('sirt.arisan_ronde_baru', '1', true);

  INSERT INTO public.arisan_anggota (ronde_id, rumah_id)
  SELECT v_ronde.id, x.rumah_id
  FROM unnest(p_anggota) AS x(rumah_id);

  GET DIAGNOSTICS v_jml = ROW_COUNT;

  PERFORM set_config('sirt.arisan_ronde_baru', '0', true);

  RAISE NOTICE 'Ronde % dimulai dengan % anggota', v_ronde.nomor, v_jml;

  RETURN v_ronde;
END;
$$;


-- ========================
-- RPC: TUTUP RONDE
-- ========================
-- Ronde baru boleh ditutup bila seluruh anggota sudah menang tepat satu
-- kali dan semua pot sudah disalurkan. Ini mencegah uang menggantung
-- saat siklus berikutnya dibuka.

CREATE OR REPLACE FUNCTION public.fn_tutup_arisan_ronde(
  p_ronde_id         UUID,
  p_tanggal_selesai  DATE DEFAULT CURRENT_DATE
)
RETURNS public.arisan_ronde
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ronde   public.arisan_ronde;
  v_anggota INT;
  v_putaran INT;
  v_belum   INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh menutup ronde arisan'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_ronde FROM public.arisan_ronde WHERE id = p_ronde_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ronde tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;
  IF v_ronde.tanggal_selesai IS NOT NULL THEN
    RAISE EXCEPTION 'Ronde % sudah ditutup', v_ronde.nomor USING ERRCODE = '23505';
  END IF;
  IF p_tanggal_selesai < v_ronde.tanggal_mulai THEN
    RAISE EXCEPTION 'Tanggal tutup tidak boleh sebelum ronde dimulai'
      USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO v_anggota
  FROM public.arisan_anggota WHERE ronde_id = p_ronde_id;

  IF v_anggota = 0 THEN
    RAISE EXCEPTION 'Ronde % tidak punya anggota', v_ronde.nomor USING ERRCODE = '23514';
  END IF;

  SELECT count(*), count(*) FILTER (WHERE pengeluaran_id IS NULL)
    INTO v_putaran, v_belum
  FROM public.arisan_putaran WHERE ronde_id = p_ronde_id;

  IF v_putaran <> v_anggota THEN
    RAISE EXCEPTION 'Ronde % belum selesai: % putaran untuk % anggota',
      v_ronde.nomor, v_putaran, v_anggota USING ERRCODE = '23514';
  END IF;

  IF v_belum > 0 THEN
    RAISE EXCEPTION 'Masih ada % pot ronde % yang belum disalurkan',
      v_belum, v_ronde.nomor USING ERRCODE = '23514';
  END IF;

  UPDATE public.arisan_ronde
     SET tanggal_selesai = p_tanggal_selesai
   WHERE id = p_ronde_id
   RETURNING * INTO v_ronde;

  RETURN v_ronde;
END;
$$;


-- ========================
-- RPC SIMPAN PUTARAN (ronde-aware)
-- ========================
-- Signature tetap sama agar frontend yang sudah live tidak berubah.
-- Ronde dan urutan diresolusi dari (tahun, bulan); pemenang divalidasi
-- sebagai anggota ronde, bukan sekadar flag ikut_arisan.

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
  v_ronde          public.arisan_ronde;
  v_urutan         INT;
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

  SELECT * INTO v_ronde
  FROM public.arisan_ronde
  WHERE date_trunc('month', tanggal_mulai::timestamp)::date
          <= make_date(p_tahun, p_bulan, 1)
    AND (
      tanggal_selesai IS NULL
      OR make_date(p_tahun, p_bulan, 1)
         <= date_trunc('month', tanggal_selesai::timestamp)::date
    )
  ORDER BY tanggal_mulai DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Belum ada ronde arisan yang mencakup periode %/%',
      p_bulan, p_tahun USING ERRCODE = '22023';
  END IF;
  IF v_ronde.tanggal_selesai IS NOT NULL THEN
    RAISE EXCEPTION 'Ronde % sudah ditutup', v_ronde.nomor USING ERRCODE = '23514';
  END IF;

  v_urutan := ((p_tahun * 12 + p_bulan - 1)
               - (extract(year FROM v_ronde.tanggal_mulai)::int * 12
                  + extract(month FROM v_ronde.tanggal_mulai)::int - 1)) + 1;

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
  IF NOT EXISTS (
    SELECT 1 FROM public.arisan_anggota
    WHERE ronde_id = v_ronde.id AND rumah_id = p_pemenang_rumah_id
  ) THEN
    RAISE EXCEPTION 'Rumah % bukan anggota ronde %',
      v_no_rumah, v_ronde.nomor USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing
  FROM public.arisan_putaran
  WHERE tahun = p_tahun AND bulan = p_bulan;
  v_ada := FOUND;

  IF v_ada AND v_existing.pengeluaran_id IS NOT NULL THEN
    RAISE EXCEPTION 'Putaran %/% sudah disalurkan dan tidak bisa diubah',
      p_bulan, p_tahun USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.arisan_putaran
    WHERE ronde_id = v_ronde.id
      AND pemenang_rumah_id = p_pemenang_rumah_id
      AND (NOT v_ada OR id <> v_existing.id)
  ) THEN
    RAISE EXCEPTION 'Rumah % sudah pernah menang di ronde %',
      v_no_rumah, v_ronde.nomor USING ERRCODE = '23505';
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
           pengeluaran_id    = COALESCE(v_pengeluaran_id, pengeluaran_id),
           ronde_id          = v_ronde.id,
           urutan            = v_urutan
     WHERE id = v_existing.id
     RETURNING * INTO v_hasil;
  ELSE
    BEGIN
      INSERT INTO public.arisan_putaran
        (bulan, tahun, pemenang_rumah_id, nominal,
         tanggal_undi, pengeluaran_id, catatan, dicatat_oleh,
         ronde_id, urutan)
      VALUES
        (p_bulan, p_tahun, p_pemenang_rumah_id, p_nominal,
         p_tanggal_undi, v_pengeluaran_id, p_catatan, auth.uid(),
         v_ronde.id, v_urutan)
      RETURNING * INTO v_hasil;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Putaran %/% sudah ada. Muat ulang data lalu ubah.',
        p_bulan, p_tahun USING ERRCODE = '23505';
    END;
  END IF;

  RETURN v_hasil;
END;
$$;


-- ========================
-- RLS
-- ========================

ALTER TABLE public.arisan_ronde ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arisan_ronde_select_public" ON public.arisan_ronde
  FOR SELECT USING (true);

CREATE POLICY "arisan_ronde_admin_modify" ON public.arisan_ronde
  FOR ALL USING (public.is_admin());

-- Keanggotaan tidak dibuka ke anon: publik hanya butuh jumlah peserta
-- lewat rekap, dan data hunian per rumah sebaiknya tidak diekspos.
ALTER TABLE public.arisan_anggota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arisan_anggota_admin_all" ON public.arisan_anggota
  FOR ALL USING (public.is_admin());


-- ========================
-- GRANTS
-- ========================

REVOKE ALL ON public.arisan_ronde FROM anon;
GRANT SELECT ON public.arisan_ronde TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arisan_ronde TO authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.arisan_ronde FROM authenticated;

REVOKE ALL ON public.arisan_anggota FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arisan_anggota TO authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.arisan_anggota FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_mulai_arisan_ronde(DATE, UUID[], TEXT)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_tutup_arisan_ronde(UUID, DATE)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_simpan_arisan_putaran(
  INT, INT, UUID, NUMERIC, DATE, TEXT, BOOLEAN, DATE) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fn_mulai_arisan_ronde(DATE, UUID[], TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_tutup_arisan_ronde(UUID, DATE)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_simpan_arisan_putaran(
  INT, INT, UUID, NUMERIC, DATE, TEXT, BOOLEAN, DATE) TO authenticated;


-- ========================
-- VIEW: v_arisan_rekap (kolom ronde ditambahkan di akhir)
-- ========================
-- CREATE OR REPLACE VIEW hanya boleh menambah kolom di posisi terakhir.

CREATE OR REPLACE VIEW public.v_arisan_rekap AS
WITH masuk AS (
  SELECT
    kb.tahun,
    kb.bulan,
    SUM(kb.jumlah) AS nominal_terkumpul,
    COUNT(*)       AS jumlah_pembayar
  FROM public.kas_bulanan kb
  WHERE kb.tipe_kas = 'Arisan'
    AND kb.status_bayar = true
  GROUP BY kb.tahun, kb.bulan
)
SELECT
  COALESCE(p.tahun, m.tahun)       AS tahun,
  COALESCE(p.bulan, m.bulan)       AS bulan,
  p.id                             AS putaran_id,
  p.pemenang_rumah_id,
  r.no_rumah                       AS pemenang_no_rumah,
  COALESCE(m.nominal_terkumpul, 0) AS nominal_terkumpul,
  COALESCE(m.jumlah_pembayar, 0)   AS jumlah_pembayar,
  p.nominal                        AS nominal_putaran,
  (p.pengeluaran_id IS NOT NULL)   AS sudah_disalurkan,
  p.tanggal_undi,
  p.pengeluaran_id,
  p.catatan,
  p.created_at,
  p.updated_at,
  p.ronde_id,
  p.urutan,
  rn.nomor                         AS ronde_nomor
FROM public.arisan_putaran p
FULL OUTER JOIN masuk m
  ON m.tahun = p.tahun
 AND m.bulan = p.bulan
LEFT JOIN public.rumah_kk r
  ON r.id = p.pemenang_rumah_id
LEFT JOIN public.arisan_ronde rn
  ON rn.id = p.ronde_id;

REVOKE ALL ON public.v_arisan_rekap FROM anon, authenticated;
GRANT SELECT ON public.v_arisan_rekap TO anon, authenticated;

COMMENT ON COLUMN public.rumah_kk.ikut_arisan IS
  'Calon peserta ronde berikutnya. Perubahan flag tidak memengaruhi ronde berjalan; susunan anggota ronde ada di arisan_anggota.';


-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
-- ============================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_guard_arisan_anggota ON public.arisan_anggota;
-- DROP FUNCTION IF EXISTS public.fn_guard_arisan_anggota();
-- DROP FUNCTION IF EXISTS public.fn_mulai_arisan_ronde(DATE, UUID[], TEXT);
-- DROP FUNCTION IF EXISTS public.fn_tutup_arisan_ronde(UUID, DATE);
-- -- fn_simpan_arisan_putaran: pulihkan definisi 015.
-- DROP VIEW IF EXISTS public.v_arisan_rekap;
-- -- recreate view 015 (tanpa kolom ronde) bila frontend lama masih dipakai.
-- ALTER TABLE public.arisan_putaran
--   DROP CONSTRAINT IF EXISTS arisan_putaran_ronde_pemenang_key,
--   DROP CONSTRAINT IF EXISTS arisan_putaran_ronde_urutan_key,
--   DROP CONSTRAINT IF EXISTS arisan_putaran_urutan_valid,
--   DROP COLUMN IF EXISTS urutan,
--   DROP COLUMN IF EXISTS ronde_id;
-- DROP TABLE IF EXISTS public.arisan_anggota;
-- DROP TABLE IF EXISTS public.arisan_ronde;
-- -- fn_validate_arisan_putaran: pulihkan definisi 015.
-- COMMIT;
-- ============================================================
