-- ============================================================
-- Migration 015: Tabel arisan_putaran (rotasi pemenang arisan)
-- ============================================================
-- Konteks:
--   Arisan adalah dana bergulir. Iuran bulanan terkumpul lalu
--   langsung disalurkan ke satu rumah, sehingga tidak punya saldo.
--   Yang perlu dicatat adalah GILIRAN: siapa menang di bulan apa.
--
--   Sampai migrasi ini, penyaluran hanya tercatat sebagai
--   pengeluaran_kas dengan sumber_dana = 'Arisan' dan nama pemenang
--   ditulis di keterangan (teks bebas). Tabel ini memisahkan
--   identitas pemenang dan periode putaran dari teks keterangan.
--
-- Isi migrasi:
--   1. Tabel public.arisan_putaran (satu pemenang per bulan).
--   2. Trigger updated_at, audit log, dan validasi sumber dana.
--   3. RLS: publik boleh membaca, hanya admin yang menulis.
--   4. View public.v_arisan_rekap (terkumpul vs tersalurkan).
--   5. Flag peserta public.rumah_kk.ikut_arisan + seed 28 rumah.
--   6. RPC transaksional fn_simpan_arisan_putaran (opsional sekaligus
--      menyalurkan) dan fn_salurkan_arisan_putaran.
--   7. Guard delete: putaran yang sudah disalurkan tidak bisa dihapus.
--
-- Sifat perubahan:
--   DDL + satu DML idempotent (seed flag peserta, hanya saat kolom baru
--   dibuat). Tidak ada baris kas/pengeluaran yang diubah; tabel putaran
--   mulai kosong. Perubahan flag tercatat di audit_log.
--
-- Keamanan eksekusi:
--   Supabase CLI menjalankan file ini dalam satu transaksi. Bila salah
--   satu pernyataan gagal (mis. objek sudah ada dengan definisi lain),
--   seluruh migrasi rollback. Untuk eksekusi manual via SQL Editor,
--   bungkus dengan BEGIN; ... COMMIT;
--
-- Catatan data:
--   Riwayat putaran sebelum migrasi ini tidak bisa direkonstruksi
--   otomatis: pemenang hanya ada di keterangan pengeluaran, dan
--   pengeluaran bersumber 'Arisan' masih 0 baris di production.
--   Isi manual hanya bila putaran berjalan memang sudah diketahui.
--
-- Dependensi:
--   - public.rumah_kk, public.kas_bulanan, public.pengeluaran_kas
--     (migrasi 001/002/013).
--   - public.fn_update_timestamp() (001), public.fn_audit_trigger()
--     (005), public.is_admin() (006).
--   - Nilai enum 'Arisan' pada tipe_kas (013).
-- ============================================================

-- ========================
-- TABEL: arisan_putaran
-- ========================

CREATE TABLE public.arisan_putaran (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulan             INT  NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun             INT  NOT NULL CHECK (tahun >= 2020),
  pemenang_rumah_id UUID NOT NULL REFERENCES public.rumah_kk(id) ON DELETE RESTRICT,
  nominal           NUMERIC(12,2) NOT NULL CHECK (nominal >= 0),
  tanggal_undi      DATE,
  -- Baris pengeluaran_kas (sumber_dana = 'Arisan') yang menyalurkan
  -- pot ke pemenang. UNIQUE: satu pengeluaran hanya boleh membayar
  -- satu putaran. NULL = pemenang sudah ditetapkan tetapi pot belum
  -- disalurkan; ON DELETE SET NULL menjaga riwayat putaran tetap ada
  -- bila pengeluaran dihapus.
  pengeluaran_id    UUID UNIQUE REFERENCES public.pengeluaran_kas(id) ON DELETE SET NULL,
  catatan           TEXT,
  dicatat_oleh      UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Satu putaran per bulan. Jika kelak ada kelompok arisan lain
  -- (mis. Bapak dan Ibu terpisah), tambahkan kolom grup dan perluas
  -- unique key menjadi (grup, tahun, bulan).
  CONSTRAINT arisan_putaran_periode_key UNIQUE (tahun, bulan)
);

-- Pencarian riwayat "rumah ini menang kapan saja".
CREATE INDEX idx_arisan_putaran_pemenang
  ON public.arisan_putaran(pemenang_rumah_id);

-- ========================
-- TRIGGERS
-- ========================

CREATE TRIGGER trg_updated_at_arisan_putaran
  BEFORE UPDATE ON public.arisan_putaran
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();

CREATE TRIGGER trg_audit_arisan_putaran
  AFTER INSERT OR UPDATE OR DELETE ON public.arisan_putaran
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Validasi lintas tabel: pengeluaran yang ditautkan harus benar-benar
-- bersumber dana 'Arisan'. FK saja tidak bisa menegakkan invariant ini.
CREATE OR REPLACE FUNCTION public.fn_validate_arisan_putaran()
RETURNS TRIGGER AS $$
DECLARE
  v_sumber_dana TEXT;
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_arisan_putaran
  BEFORE INSERT OR UPDATE ON public.arisan_putaran
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_arisan_putaran();

-- Guard delete: riwayat uang yang sudah keluar tidak boleh hilang.
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

-- ========================
-- FLAG PESERTA ARISAN
-- ========================
-- Keanggotaan eksplisit: sebelumnya diinferensi dari adanya setoran,
-- sehingga rumah yang belum menyetor tidak pernah dianggap peserta.
-- Seed dijalankan sekali saat kolom dibuat, dari setoran Arisan yang ada
-- (28 rumah). Setelah itu flag dikelola admin (mis. saat ronde baru) dan
-- perubahannya tercatat di audit_log lewat trg_audit_rumah_kk.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rumah_kk'
      AND column_name = 'ikut_arisan'
  ) THEN
    ALTER TABLE public.rumah_kk
      ADD COLUMN ikut_arisan BOOLEAN NOT NULL DEFAULT false;

    UPDATE public.rumah_kk r
       SET ikut_arisan = true
     WHERE EXISTS (
       SELECT 1 FROM public.kas_bulanan kb
       WHERE kb.rumah_id = r.id
         AND kb.tipe_kas = 'Arisan'
     );

    RAISE NOTICE 'Seed ikut_arisan: % rumah',
      (SELECT count(*) FROM public.rumah_kk WHERE ikut_arisan);
  ELSE
    RAISE NOTICE 'Kolom rumah_kk.ikut_arisan sudah ada; seed dilewati';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rumah_kk_ikut_arisan
  ON public.rumah_kk(ikut_arisan)
  WHERE ikut_arisan;

-- ========================
-- RLS
-- ========================

ALTER TABLE public.arisan_putaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arisan_putaran_select_public" ON public.arisan_putaran
  FOR SELECT USING (true);

CREATE POLICY "arisan_putaran_admin_modify" ON public.arisan_putaran
  FOR ALL USING (public.is_admin());

-- ========================
-- GRANTS
-- ========================

-- Default privileges Supabase memberi ALL pada relasi baru. RLS sudah
-- menolak tulisan anon, tetapi TRUNCATE tidak tunduk RLS, jadi privilege
-- tulis/administratif dicabut eksplisit.
REVOKE ALL ON public.arisan_putaran FROM anon;
GRANT SELECT ON public.arisan_putaran TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arisan_putaran TO authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.arisan_putaran FROM authenticated;

-- ========================
-- RPC: SIMPAN PUTARAN
-- ========================
-- Penulisan pengeluaran + putaran harus satu transaksi agar tidak ada
-- pengeluaran yatim bila langkah kedua gagal. SECURITY INVOKER dengan
-- pemeriksaan admin eksplisit; RLS tetap berlaku.

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
  v_ikut           BOOLEAN;
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

  SELECT status_hunian, is_active, no_rumah, ikut_arisan
    INTO v_status, v_aktif, v_no_rumah, v_ikut
  FROM public.rumah_kk
  WHERE id = p_pemenang_rumah_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rumah pemenang tidak ditemukan' USING ERRCODE = '23503';
  END IF;
  IF NOT v_aktif OR v_status = 'Kosong' OR NOT v_ikut THEN
    RAISE EXCEPTION 'Rumah % tidak aktif/kosong/bukan peserta arisan',
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

-- ========================
-- RPC: SALURKAN PUTARAN
-- ========================

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

-- Default PostgreSQL memberi EXECUTE ke PUBLIC; cabut dari anon.
REVOKE EXECUTE ON FUNCTION public.fn_simpan_arisan_putaran(
  INT, INT, UUID, NUMERIC, DATE, TEXT, BOOLEAN, DATE) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_salurkan_arisan_putaran(UUID, DATE)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fn_simpan_arisan_putaran(
  INT, INT, UUID, NUMERIC, DATE, TEXT, BOOLEAN, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_salurkan_arisan_putaran(UUID, DATE)
  TO authenticated;

-- ========================
-- VIEW: v_arisan_rekap
-- ========================
-- Satu baris per bulan: iuran arisan yang sudah dibayar (kas_bulanan),
-- pemenang (bila sudah diundi), dan status penyaluran. Bulan yang
-- sudah terkumpul tetapi belum ada putaran tetap muncul (putaran_id
-- NULL) supaya "pot belum disalurkan" terlihat.
--
-- Seperti view publik lain (migrasi 008), view berjalan dengan hak
-- pemilik (postgres) sehingga anon cukup diberi GRANT SELECT di sini.

CREATE VIEW public.v_arisan_rekap AS
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
  p.updated_at
FROM public.arisan_putaran p
FULL OUTER JOIN masuk m
  ON m.tahun = p.tahun
 AND m.bulan = p.bulan
LEFT JOIN public.rumah_kk r
  ON r.id = p.pemenang_rumah_id;

REVOKE ALL ON public.v_arisan_rekap FROM anon, authenticated;
GRANT SELECT ON public.v_arisan_rekap TO anon, authenticated;

-- ============================================================
-- ROLLBACK (komentar; jalankan manual bila perlu)
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
