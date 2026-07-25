-- ============================================================
-- Migration 003: Tabel Ronda (Operasional)
-- ============================================================

-- ========================
-- TABEL: periode_jadwal_ronda
-- ========================

CREATE TABLE periode_jadwal_ronda (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_periode    VARCHAR(50) NOT NULL,
  tanggal_mulai   DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  dibuat_oleh     UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (tanggal_selesai > tanggal_mulai)
);

CREATE TRIGGER trg_updated_at_periode_jadwal_ronda
  BEFORE UPDATE ON periode_jadwal_ronda
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: jadwal_ronda
-- ========================

CREATE TABLE jadwal_ronda (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_id  UUID NOT NULL REFERENCES periode_jadwal_ronda(id) ON DELETE CASCADE,
  hari        VARCHAR(10) NOT NULL CHECK (hari IN ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')),
  warga_id    UUID NOT NULL REFERENCES warga_detail(id) ON DELETE RESTRICT,
  urutan      INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jadwal_periode ON jadwal_ronda(periode_id);
CREATE INDEX idx_jadwal_hari ON jadwal_ronda(hari);

CREATE TRIGGER trg_updated_at_jadwal_ronda
  BEFORE UPDATE ON jadwal_ronda
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ========================
-- TABEL: kehadiran_ronda
-- ========================

CREATE TABLE kehadiran_ronda (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jadwal_id       UUID NOT NULL REFERENCES jadwal_ronda(id) ON DELETE RESTRICT,
  tanggal         DATE NOT NULL,
  warga_id        UUID NOT NULL REFERENCES warga_detail(id) ON DELETE RESTRICT,
  pengganti_dari  UUID REFERENCES warga_detail(id),
  jam_mulai       TIME,
  jam_selesai     TIME,
  catatan         TEXT,
  dicatat_oleh    UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kehadiran_tanggal ON kehadiran_ronda(tanggal);

-- ========================
-- TABEL: tukar_jadwal_ronda
-- ========================

CREATE TABLE tukar_jadwal_ronda (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jadwal_asal_id  UUID NOT NULL REFERENCES jadwal_ronda(id) ON DELETE RESTRICT,
  pemohon_id      UUID NOT NULL REFERENCES warga_detail(id) ON DELETE RESTRICT,
  pengganti_id    UUID NOT NULL REFERENCES warga_detail(id) ON DELETE RESTRICT,
  tanggal_tukar   DATE NOT NULL,
  alasan          TEXT,
  disetujui       BOOLEAN,
  disetujui_oleh  UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_updated_at_tukar_jadwal_ronda
  BEFORE UPDATE ON tukar_jadwal_ronda
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
