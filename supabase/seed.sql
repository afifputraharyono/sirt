-- ============================================================
-- Seed Data: Data Contoh untuk Development
-- ============================================================
-- CATATAN: File ini dijalankan setelah migration.
-- User auth harus dibuat via Supabase Dashboard atau API.
-- Seed ini mengisi data referensi saja.

-- ========================
-- Rumah KK (10 rumah contoh)
-- ========================

INSERT INTO rumah_kk (id, no_rumah, no_kk, status_hunian) VALUES
  ('a0000000-0000-0000-0000-000000000001', '01', '3322010101000001', 'Tetap'),
  ('a0000000-0000-0000-0000-000000000002', '02', '3322010101000002', 'Tetap'),
  ('a0000000-0000-0000-0000-000000000003', '03', '3322010101000003', 'Tetap'),
  ('a0000000-0000-0000-0000-000000000004', '04', '3322010101000004', 'Tetap'),
  ('a0000000-0000-0000-0000-000000000005', '05', '3322010101000005', 'Tetap'),
  ('a0000000-0000-0000-0000-000000000006', '06', '3322010101000006', 'Kontrak'),
  ('a0000000-0000-0000-0000-000000000007', '07', '3322010101000007', 'Tetap'),
  ('a0000000-0000-0000-0000-000000000008', '08', '3322010101000008', 'Tetap'),
  ('a0000000-0000-0000-0000-000000000009', '09', NULL, 'Kosong'),
  ('a0000000-0000-0000-0000-000000000010', '10', '3322010101000010', 'Tetap');

-- ========================
-- Warga Detail (beberapa contoh per rumah)
-- ========================

INSERT INTO warga_detail (id, rumah_id, nik, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, hubungan_keluarga, pekerjaan, status_perkawinan) VALUES
  -- Rumah 01
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '3322010101800001', 'Ahmad Sudrajat', 'L', 'Semarang', '1980-03-15', 'Kepala Keluarga', 'Wiraswasta', 'Kawin'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '3322010101850002', 'Siti Aminah', 'P', 'Semarang', '1985-07-22', 'Istri', 'Ibu Rumah Tangga', 'Kawin'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '3322010101100003', 'Rizky Pratama', 'L', 'Semarang', '2010-01-10', 'Anak', 'Pelajar', 'Belum Kawin'),
  -- Rumah 02
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', '3322010101750004', 'Budi Santoso', 'L', 'Kendal', '1975-11-05', 'Kepala Keluarga', 'PNS', 'Kawin'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', '3322010101800005', 'Dewi Lestari', 'P', 'Ungaran', '1980-04-18', 'Istri', 'Guru', 'Kawin'),
  -- Rumah 03
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', '3322010101780006', 'Cahyo Wibowo', 'L', 'Solo', '1978-09-30', 'Kepala Keluarga', 'Pedagang', 'Kawin'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', '3322010101820007', 'Retno Wulandari', 'P', 'Semarang', '1982-12-03', 'Istri', 'Ibu Rumah Tangga', 'Kawin'),
  -- Rumah 04
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', '3322010101700008', 'Djoko Purnomo', 'L', 'Demak', '1970-06-14', 'Kepala Keluarga', 'Pensiunan', 'Kawin'),
  -- Rumah 05
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000005', '3322010101850009', 'Eko Prasetyo', 'L', 'Semarang', '1985-02-28', 'Kepala Keluarga', 'Karyawan Swasta', 'Kawin'),
  -- Rumah 06
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000006', '3322010101900010', 'Fajar Nugroho', 'L', 'Salatiga', '1990-08-20', 'Kepala Keluarga', 'Programmer', 'Belum Kawin'),
  -- Rumah 07
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000007', '3322010101720011', 'Gunawan Hadi', 'L', 'Semarang', '1972-05-11', 'Kepala Keluarga', 'Sopir', 'Kawin'),
  -- Rumah 08
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000008', '3322010101830012', 'Hendra Wijaya', 'L', 'Pekalongan', '1983-10-07', 'Kepala Keluarga', 'Tukang', 'Kawin'),
  -- Rumah 10
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000010', '3322010101680013', 'Ibrahim Malik', 'L', 'Semarang', '1968-01-25', 'Kepala Keluarga', 'Pensiunan', 'Kawin');

-- ========================
-- Periode Jadwal Ronda & Pengumuman
-- ========================
-- Diinsert setelah ada user admin di auth.users
-- Gunakan SQL di Supabase Dashboard setelah membuat user pertama:
--
-- INSERT INTO periode_jadwal_ronda (id, nama_periode, tanggal_mulai, tanggal_selesai, is_active, dibuat_oleh)
-- VALUES ('c0000000-0000-0000-0000-000000000001', 'Juli 2026', '2026-07-01', '2026-07-31', true, auth.uid());

-- ========================
-- Inventaris
-- ========================

INSERT INTO inventaris (nama_barang, kategori, jumlah, kondisi, lokasi_penyimpanan) VALUES
  ('Tenda Pesta 4x6m', 'Peralatan', 2, 'Baik', 'Gudang RT'),
  ('Kursi Lipat Plastik', 'Perabotan', 50, 'Baik', 'Gudang RT'),
  ('Meja Lipat', 'Perabotan', 10, 'Baik', 'Gudang RT'),
  ('Sound System', 'Elektronik', 1, 'Baik', 'Rumah Ketua RT'),
  ('Gerobak Sampah', 'Peralatan', 2, 'Rusak Ringan', 'Pos Ronda'),
  ('Lampu Sorot', 'Elektronik', 3, 'Baik', 'Pos Ronda'),
  ('HT (Handy Talky)', 'Elektronik', 4, 'Baik', 'Pos Ronda'),
  ('Taplak Meja', 'Perabotan', 20, 'Baik', 'Gudang RT');
