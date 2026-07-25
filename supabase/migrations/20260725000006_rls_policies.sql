-- ============================================================
-- Migration 006: Row Level Security (RLS)
-- ============================================================

-- ========================
-- Enable RLS pada semua tabel
-- ========================

ALTER TABLE profil_pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE rumah_kk ENABLE ROW LEVEL SECURITY;
ALTER TABLE warga_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE kas_bulanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE iuran_insidental ENABLE ROW LEVEL SECURITY;
ALTER TABLE iuran_insidental_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE jimpitan_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengeluaran_kas ENABLE ROW LEVEL SECURITY;
ALTER TABLE periode_jadwal_ronda ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_ronda ENABLE ROW LEVEL SECURITY;
ALTER TABLE kehadiran_ronda ENABLE ROW LEVEL SECURITY;
ALTER TABLE tukar_jadwal_ronda ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat_pengantar ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE peminjaman_inventaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ========================
-- HELPER: cek role user saat ini
-- ========================

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS role_pengguna AS $$
  SELECT role FROM profil_pengguna WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profil_pengguna WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================
-- POLICIES: profil_pengguna
-- ========================

CREATE POLICY "profil_select_own" ON profil_pengguna
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "profil_update_own" ON profil_pengguna
  FOR UPDATE USING (id = auth.uid() OR is_admin());

CREATE POLICY "profil_admin_all" ON profil_pengguna
  FOR ALL USING (is_admin());

-- ========================
-- POLICIES: rumah_kk
-- ========================

CREATE POLICY "rumah_select_public" ON rumah_kk
  FOR SELECT USING (true);

CREATE POLICY "rumah_admin_modify" ON rumah_kk
  FOR ALL USING (is_admin());

-- ========================
-- POLICIES: warga_detail
-- ========================

CREATE POLICY "warga_select_own_family" ON warga_detail
  FOR SELECT USING (
    rumah_id IN (
      SELECT wd.rumah_id FROM warga_detail wd
      JOIN profil_pengguna pp ON pp.warga_id = wd.id
      WHERE pp.id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "warga_select_names_for_ronda" ON warga_detail
  FOR SELECT USING (
    current_user_role() = 'ronda'
  );

CREATE POLICY "warga_admin_modify" ON warga_detail
  FOR ALL USING (is_admin());

-- ========================
-- POLICIES: kas_bulanan
-- ========================

CREATE POLICY "kas_select_public_summary" ON kas_bulanan
  FOR SELECT USING (true);

CREATE POLICY "kas_admin_modify" ON kas_bulanan
  FOR ALL USING (is_admin());

-- ========================
-- POLICIES: jimpitan_harian
-- ========================

CREATE POLICY "jimpitan_select_public" ON jimpitan_harian
  FOR SELECT USING (true);

CREATE POLICY "jimpitan_insert_ronda" ON jimpitan_harian
  FOR INSERT WITH CHECK (
    current_user_role() IN ('ronda', 'admin')
    AND dicatat_oleh = auth.uid()
  );

CREATE POLICY "jimpitan_admin_modify" ON jimpitan_harian
  FOR UPDATE USING (is_admin());

CREATE POLICY "jimpitan_admin_delete" ON jimpitan_harian
  FOR DELETE USING (is_admin());

-- ========================
-- POLICIES: pengeluaran_kas
-- ========================

CREATE POLICY "pengeluaran_select_public" ON pengeluaran_kas
  FOR SELECT USING (true);

CREATE POLICY "pengeluaran_admin_modify" ON pengeluaran_kas
  FOR ALL USING (is_admin());

-- ========================
-- POLICIES: iuran_insidental & detail
-- ========================

CREATE POLICY "iuran_select_public" ON iuran_insidental
  FOR SELECT USING (true);

CREATE POLICY "iuran_admin_modify" ON iuran_insidental
  FOR ALL USING (is_admin());

CREATE POLICY "iuran_detail_select_public" ON iuran_insidental_detail
  FOR SELECT USING (true);

CREATE POLICY "iuran_detail_admin_modify" ON iuran_insidental_detail
  FOR ALL USING (is_admin());

-- ========================
-- POLICIES: ronda
-- ========================

CREATE POLICY "periode_select_public" ON periode_jadwal_ronda
  FOR SELECT USING (true);

CREATE POLICY "periode_admin_modify" ON periode_jadwal_ronda
  FOR ALL USING (is_admin());

CREATE POLICY "jadwal_select_public" ON jadwal_ronda
  FOR SELECT USING (true);

CREATE POLICY "jadwal_admin_modify" ON jadwal_ronda
  FOR ALL USING (is_admin());

CREATE POLICY "kehadiran_select_public" ON kehadiran_ronda
  FOR SELECT USING (true);

CREATE POLICY "kehadiran_insert_ronda" ON kehadiran_ronda
  FOR INSERT WITH CHECK (
    current_user_role() IN ('ronda', 'admin')
    AND dicatat_oleh = auth.uid()
  );

CREATE POLICY "kehadiran_admin_modify" ON kehadiran_ronda
  FOR ALL USING (is_admin());

CREATE POLICY "tukar_select_own" ON tukar_jadwal_ronda
  FOR SELECT USING (
    pemohon_id IN (
      SELECT warga_id FROM profil_pengguna WHERE id = auth.uid()
    )
    OR pengganti_id IN (
      SELECT warga_id FROM profil_pengguna WHERE id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "tukar_insert_auth" ON tukar_jadwal_ronda
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tukar_admin_modify" ON tukar_jadwal_ronda
  FOR UPDATE USING (is_admin());

-- ========================
-- POLICIES: surat_pengantar
-- ========================

CREATE POLICY "surat_select_own" ON surat_pengantar
  FOR SELECT USING (
    warga_id IN (
      SELECT warga_id FROM profil_pengguna WHERE id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "surat_insert_warga" ON surat_pengantar
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND warga_id IN (
      SELECT warga_id FROM profil_pengguna WHERE id = auth.uid()
    )
  );

CREATE POLICY "surat_admin_modify" ON surat_pengantar
  FOR UPDATE USING (is_admin());

-- ========================
-- POLICIES: pengumuman
-- ========================

CREATE POLICY "pengumuman_select_public" ON pengumuman
  FOR SELECT USING (
    tanggal_mulai <= CURRENT_DATE
    AND (tanggal_berakhir IS NULL OR tanggal_berakhir >= CURRENT_DATE)
  );

CREATE POLICY "pengumuman_select_admin" ON pengumuman
  FOR SELECT USING (is_admin());

CREATE POLICY "pengumuman_admin_modify" ON pengumuman
  FOR ALL USING (is_admin());

-- ========================
-- POLICIES: inventaris & peminjaman
-- ========================

CREATE POLICY "inventaris_select_public" ON inventaris
  FOR SELECT USING (true);

CREATE POLICY "inventaris_admin_modify" ON inventaris
  FOR ALL USING (is_admin());

CREATE POLICY "peminjaman_select_own" ON peminjaman_inventaris
  FOR SELECT USING (
    peminjam_id IN (
      SELECT warga_id FROM profil_pengguna WHERE id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "peminjaman_insert_auth" ON peminjaman_inventaris
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND dicatat_oleh = auth.uid()
  );

CREATE POLICY "peminjaman_admin_modify" ON peminjaman_inventaris
  FOR ALL USING (is_admin());

-- ========================
-- POLICIES: audit_log (read-only admin)
-- ========================

CREATE POLICY "audit_admin_select" ON audit_log
  FOR SELECT USING (is_admin());
