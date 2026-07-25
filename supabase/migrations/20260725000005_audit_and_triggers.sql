-- ============================================================
-- Migration 005: Audit Log & Trigger
-- ============================================================

-- ========================
-- TABEL: audit_log (immutable)
-- ========================

CREATE TABLE audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabel       VARCHAR(50) NOT NULL,
  record_id   UUID NOT NULL,
  tipe_aksi   tipe_audit NOT NULL,
  data_lama   JSONB,
  data_baru   JSONB,
  diubah_oleh UUID REFERENCES auth.users(id),
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_tabel ON audit_log(tabel, created_at DESC);
CREATE INDEX idx_audit_record ON audit_log(record_id);

-- ========================
-- FUNCTION: audit trigger
-- ========================

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (tabel, record_id, tipe_aksi, data_lama, data_baru, diubah_oleh)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP::tipe_audit,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit pada tabel keuangan
CREATE TRIGGER trg_audit_kas_bulanan
  AFTER INSERT OR UPDATE OR DELETE ON kas_bulanan
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_jimpitan_harian
  AFTER INSERT OR UPDATE OR DELETE ON jimpitan_harian
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_pengeluaran_kas
  AFTER INSERT OR UPDATE OR DELETE ON pengeluaran_kas
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_iuran_insidental
  AFTER INSERT OR UPDATE OR DELETE ON iuran_insidental
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_iuran_insidental_detail
  AFTER INSERT OR UPDATE OR DELETE ON iuran_insidental_detail
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- Audit pada tabel kependudukan
CREATE TRIGGER trg_audit_warga_detail
  AFTER INSERT OR UPDATE OR DELETE ON warga_detail
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_rumah_kk
  AFTER INSERT OR UPDATE OR DELETE ON rumah_kk
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- Audit pada surat
CREATE TRIGGER trg_audit_surat_pengantar
  AFTER INSERT OR UPDATE OR DELETE ON surat_pengantar
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- ========================
-- FUNCTION: auto-create profil on signup
-- ========================

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profil_pengguna (id, nama_tampilan, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_tampilan', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::role_pengguna, 'warga')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();
