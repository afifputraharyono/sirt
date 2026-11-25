export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      arisan_anggota: {
        Row: {
          created_at: string
          id: string
          ronde_id: string
          rumah_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ronde_id: string
          rumah_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ronde_id?: string
          rumah_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arisan_anggota_ronde_id_fkey"
            columns: ["ronde_id"]
            isOneToOne: false
            referencedRelation: "arisan_ronde"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arisan_anggota_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
        ]
      }
      arisan_putaran: {
        Row: {
          bulan: number
          catatan: string | null
          created_at: string
          dicatat_oleh: string
          id: string
          nominal: number
          pemenang_rumah_id: string
          pengeluaran_id: string | null
          ronde_id: string
          tahun: number
          tanggal_undi: string | null
          updated_at: string
          urutan: number
        }
        Insert: {
          bulan: number
          catatan?: string | null
          created_at?: string
          dicatat_oleh: string
          id?: string
          nominal: number
          pemenang_rumah_id: string
          pengeluaran_id?: string | null
          ronde_id: string
          tahun: number
          tanggal_undi?: string | null
          updated_at?: string
          urutan: number
        }
        Update: {
          bulan?: number
          catatan?: string | null
          created_at?: string
          dicatat_oleh?: string
          id?: string
          nominal?: number
          pemenang_rumah_id?: string
          pengeluaran_id?: string | null
          ronde_id?: string
          tahun?: number
          tanggal_undi?: string | null
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "arisan_putaran_pemenang_rumah_id_fkey"
            columns: ["pemenang_rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arisan_putaran_pengeluaran_id_fkey"
            columns: ["pengeluaran_id"]
            isOneToOne: true
            referencedRelation: "pengeluaran_kas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arisan_putaran_ronde_id_fkey"
            columns: ["ronde_id"]
            isOneToOne: false
            referencedRelation: "arisan_ronde"
            referencedColumns: ["id"]
          },
        ]
      }
      arisan_ronde: {
        Row: {
          catatan: string | null
          created_at: string
          dicatat_oleh: string
          id: string
          nomor: number
          tanggal_mulai: string
          tanggal_selesai: string | null
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh: string
          id?: string
          nomor: number
          tanggal_mulai: string
          tanggal_selesai?: string | null
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh?: string
          id?: string
          nomor?: number
          tanggal_mulai?: string
          tanggal_selesai?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          created_at: string
          data_baru: Json | null
          data_lama: Json | null
          diubah_oleh: string | null
          id: number
          ip_address: unknown
          record_id: string
          tabel: string
          tipe_aksi: Database["public"]["Enums"]["tipe_audit"]
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          data_baru?: Json | null
          data_lama?: Json | null
          diubah_oleh?: string | null
          id?: never
          ip_address?: unknown
          record_id: string
          tabel: string
          tipe_aksi: Database["public"]["Enums"]["tipe_audit"]
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          data_baru?: Json | null
          data_lama?: Json | null
          diubah_oleh?: string | null
          id?: never
          ip_address?: unknown
          record_id?: string
          tabel?: string
          tipe_aksi?: Database["public"]["Enums"]["tipe_audit"]
          user_agent?: string | null
        }
        Relationships: []
      }
      grup_pengeluaran: {
        Row: {
          catatan: string | null
          created_at: string
          dibuat_oleh: string
          id: string
          nama: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dibuat_oleh: string
          id?: string
          nama: string
          tanggal?: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dibuat_oleh?: string
          id?: string
          nama?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventaris: {
        Row: {
          catatan: string | null
          created_at: string
          foto_url: string | null
          id: string
          is_active: boolean
          jumlah: number
          kategori: string | null
          kondisi: Database["public"]["Enums"]["kondisi_barang"]
          lokasi_penyimpanan: string | null
          nama_barang: string
          nilai_perolehan: number | null
          tanggal_pengadaan: string | null
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          is_active?: boolean
          jumlah?: number
          kategori?: string | null
          kondisi?: Database["public"]["Enums"]["kondisi_barang"]
          lokasi_penyimpanan?: string | null
          nama_barang: string
          nilai_perolehan?: number | null
          tanggal_pengadaan?: string | null
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          is_active?: boolean
          jumlah?: number
          kategori?: string | null
          kondisi?: Database["public"]["Enums"]["kondisi_barang"]
          lokasi_penyimpanan?: string | null
          nama_barang?: string
          nilai_perolehan?: number | null
          tanggal_pengadaan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      iuran_insidental: {
        Row: {
          created_at: string
          deskripsi: string | null
          dibuat_oleh: string
          id: string
          is_active: boolean
          nama_iuran: string
          nominal_target: number | null
          tanggal_mulai: string
          tanggal_selesai: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          dibuat_oleh: string
          id?: string
          is_active?: boolean
          nama_iuran: string
          nominal_target?: number | null
          tanggal_mulai: string
          tanggal_selesai?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          dibuat_oleh?: string
          id?: string
          is_active?: boolean
          nama_iuran?: string
          nominal_target?: number | null
          tanggal_mulai?: string
          tanggal_selesai?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      iuran_insidental_detail: {
        Row: {
          created_at: string
          dicatat_oleh: string
          id: string
          iuran_id: string
          jumlah: number
          rumah_id: string
          status_bayar: boolean
          tanggal_bayar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dicatat_oleh: string
          id?: string
          iuran_id: string
          jumlah: number
          rumah_id: string
          status_bayar?: boolean
          tanggal_bayar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dicatat_oleh?: string
          id?: string
          iuran_id?: string
          jumlah?: number
          rumah_id?: string
          status_bayar?: boolean
          tanggal_bayar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iuran_insidental_detail_iuran_id_fkey"
            columns: ["iuran_id"]
            isOneToOne: false
            referencedRelation: "iuran_insidental"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iuran_insidental_detail_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
        ]
      }
      jadwal_ronda: {
        Row: {
          created_at: string
          hari: string
          id: string
          is_active: boolean
          periode_id: string
          updated_at: string
          urutan: number
          warga_id: string
        }
        Insert: {
          created_at?: string
          hari: string
          id?: string
          is_active?: boolean
          periode_id: string
          updated_at?: string
          urutan?: number
          warga_id: string
        }
        Update: {
          created_at?: string
          hari?: string
          id?: string
          is_active?: boolean
          periode_id?: string
          updated_at?: string
          urutan?: number
          warga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jadwal_ronda_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periode_jadwal_ronda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_ronda_warga_id_fkey"
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      jimpitan_harian: {
        Row: {
          catatan: string | null
          created_at: string
          dicatat_oleh: string
          dikunci_at: string | null
          dikunci_oleh: string | null
          id: string
          is_locked: boolean
          nominal: number
          rumah_id: string
          status: Database["public"]["Enums"]["status_jimpitan"]
          tanggal: string
          tipe: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh: string
          dikunci_at?: string | null
          dikunci_oleh?: string | null
          id?: string
          is_locked?: boolean
          nominal?: number
          rumah_id: string
          status: Database["public"]["Enums"]["status_jimpitan"]
          tanggal: string
          tipe?: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh?: string
          dikunci_at?: string | null
          dikunci_oleh?: string | null
          id?: string
          is_locked?: boolean
          nominal?: number
          rumah_id?: string
          status?: Database["public"]["Enums"]["status_jimpitan"]
          tanggal?: string
          tipe?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jimpitan_harian_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
        ]
      }
      kas_bulanan: {
        Row: {
          bukti_bayar_url: string | null
          bulan: number
          created_at: string
          dicatat_oleh: string
          id: string
          jumlah: number
          keterangan: string | null
          metode_bayar: string | null
          rumah_id: string
          status_bayar: boolean
          tahun: number
          tanggal_bayar: string | null
          tipe_kas: Database["public"]["Enums"]["tipe_kas"]
          updated_at: string
        }
        Insert: {
          bukti_bayar_url?: string | null
          bulan: number
          created_at?: string
          dicatat_oleh: string
          id?: string
          jumlah: number
          keterangan?: string | null
          metode_bayar?: string | null
          rumah_id: string
          status_bayar?: boolean
          tahun: number
          tanggal_bayar?: string | null
          tipe_kas?: Database["public"]["Enums"]["tipe_kas"]
          updated_at?: string
        }
        Update: {
          bukti_bayar_url?: string | null
          bulan?: number
          created_at?: string
          dicatat_oleh?: string
          id?: string
          jumlah?: number
          keterangan?: string | null
          metode_bayar?: string | null
          rumah_id?: string
          status_bayar?: boolean
          tahun?: number
          tanggal_bayar?: string | null
          tipe_kas?: Database["public"]["Enums"]["tipe_kas"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kas_bulanan_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
        ]
      }
      kehadiran_ronda: {
        Row: {
          catatan: string | null
          created_at: string
          dicatat_oleh: string
          id: string
          jadwal_id: string
          jam_mulai: string | null
          jam_selesai: string | null
          pengganti_dari: string | null
          tanggal: string
          warga_id: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh: string
          id?: string
          jadwal_id: string
          jam_mulai?: string | null
          jam_selesai?: string | null
          pengganti_dari?: string | null
          tanggal: string
          warga_id: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh?: string
          id?: string
          jadwal_id?: string
          jam_mulai?: string | null
          jam_selesai?: string | null
          pengganti_dari?: string | null
          tanggal?: string
          warga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kehadiran_ronda_jadwal_id_fkey"
            columns: ["jadwal_id"]
            isOneToOne: false
            referencedRelation: "jadwal_ronda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kehadiran_ronda_jadwal_id_fkey"
            columns: ["jadwal_id"]
            isOneToOne: false
            referencedRelation: "v_jadwal_ronda_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kehadiran_ronda_pengganti_dari_fkey"
            columns: ["pengganti_dari"]
            isOneToOne: false
            referencedRelation: "warga_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kehadiran_ronda_warga_id_fkey"
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      peminjaman_inventaris: {
        Row: {
          catatan: string | null
          created_at: string
          dicatat_oleh: string
          id: string
          inventaris_id: string
          jumlah_pinjam: number
          kondisi_kembali: Database["public"]["Enums"]["kondisi_barang"] | null
          peminjam_id: string
          status: Database["public"]["Enums"]["status_peminjaman"]
          tanggal_kembali_aktual: string | null
          tanggal_kembali_rencana: string
          tanggal_pinjam: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh: string
          id?: string
          inventaris_id: string
          jumlah_pinjam?: number
          kondisi_kembali?: Database["public"]["Enums"]["kondisi_barang"] | null
          peminjam_id: string
          status?: Database["public"]["Enums"]["status_peminjaman"]
          tanggal_kembali_aktual?: string | null
          tanggal_kembali_rencana: string
          tanggal_pinjam: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dicatat_oleh?: string
          id?: string
          inventaris_id?: string
          jumlah_pinjam?: number
          kondisi_kembali?: Database["public"]["Enums"]["kondisi_barang"] | null
          peminjam_id?: string
          status?: Database["public"]["Enums"]["status_peminjaman"]
          tanggal_kembali_aktual?: string | null
          tanggal_kembali_rencana?: string
          tanggal_pinjam?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peminjaman_inventaris_inventaris_id_fkey"
            columns: ["inventaris_id"]
            isOneToOne: false
            referencedRelation: "inventaris"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peminjaman_inventaris_peminjam_id_fkey"
            columns: ["peminjam_id"]
            isOneToOne: false
            referencedRelation: "warga_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      pengeluaran_kas: {
        Row: {
          bukti_url: string | null
          created_at: string
          dicatat_oleh: string
          disetujui_oleh: string | null
          grup_id: string | null
          id: string
          kategori: Database["public"]["Enums"]["kategori_pengeluaran"]
          keterangan: string
          nominal: number
          sumber_dana: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          bukti_url?: string | null
          created_at?: string
          dicatat_oleh: string
          disetujui_oleh?: string | null
          grup_id?: string | null
          id?: string
          kategori: Database["public"]["Enums"]["kategori_pengeluaran"]
          keterangan: string
          nominal: number
          sumber_dana?: string
          tanggal: string
          updated_at?: string
        }
        Update: {
          bukti_url?: string | null
          created_at?: string
          dicatat_oleh?: string
          disetujui_oleh?: string | null
          grup_id?: string | null
          id?: string
          kategori?: Database["public"]["Enums"]["kategori_pengeluaran"]
          keterangan?: string
          nominal?: number
          sumber_dana?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengeluaran_kas_grup_id_fkey"
            columns: ["grup_id"]
            isOneToOne: false
            referencedRelation: "grup_pengeluaran"
            referencedColumns: ["id"]
          },
        ]
      }
      pengumuman: {
        Row: {
          created_at: string
          dibuat_oleh: string
          id: string
          is_pinned: boolean
          isi: string
          judul: string
          kategori: string | null
          lampiran_url: string[] | null
          tanggal_berakhir: string | null
          tanggal_mulai: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dibuat_oleh: string
          id?: string
          is_pinned?: boolean
          isi: string
          judul: string
          kategori?: string | null
          lampiran_url?: string[] | null
          tanggal_berakhir?: string | null
          tanggal_mulai?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dibuat_oleh?: string
          id?: string
          is_pinned?: boolean
          isi?: string
          judul?: string
          kategori?: string | null
          lampiran_url?: string[] | null
          tanggal_berakhir?: string | null
          tanggal_mulai?: string
          updated_at?: string
        }
        Relationships: []
      }
      periode_jadwal_ronda: {
        Row: {
          created_at: string
          dibuat_oleh: string
          id: string
          is_active: boolean
          nama_periode: string
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dibuat_oleh: string
          id?: string
          is_active?: boolean
          nama_periode: string
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dibuat_oleh?: string
          id?: string
          is_active?: boolean
          nama_periode?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
          updated_at?: string
        }
        Relationships: []
      }
      profil_pengguna: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean
          last_login_at: string | null
          must_change_password: boolean
          nama_tampilan: string
          no_hp: string | null
          pin_ronda: string | null
          role: Database["public"]["Enums"]["role_pengguna"]
          updated_at: string
          username: string | null
          warga_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          nama_tampilan: string
          no_hp?: string | null
          pin_ronda?: string | null
          role?: Database["public"]["Enums"]["role_pengguna"]
          updated_at?: string
          username?: string | null
          warga_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          nama_tampilan?: string
          no_hp?: string | null
          pin_ronda?: string | null
          role?: Database["public"]["Enums"]["role_pengguna"]
          updated_at?: string
          username?: string | null
          warga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profil_warga"
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      rumah_hunian: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          rumah_id: string
          tanggal_mulai: string
          tanggal_selesai: string | null
          tunggakan_dialihkan: boolean
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          rumah_id: string
          tanggal_mulai: string
          tanggal_selesai?: string | null
          tunggakan_dialihkan?: boolean
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          rumah_id?: string
          tanggal_mulai?: string
          tanggal_selesai?: string | null
          tunggakan_dialihkan?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rumah_hunian_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
        ]
      }
      rumah_kk: {
        Row: {
          alamat_lengkap: string | null
          catatan: string | null
          created_at: string
          id: string
          ikut_arisan: boolean
          is_active: boolean
          kecamatan: string
          kelurahan: string
          mode_jimpitan: string
          mulai_kas_ibu: string | null
          no_kk: string | null
          no_rumah: string
          rt: string
          rw: string
          status_hunian: Database["public"]["Enums"]["status_hunian"]
          updated_at: string
        }
        Insert: {
          alamat_lengkap?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          ikut_arisan?: boolean
          is_active?: boolean
          kecamatan?: string
          kelurahan?: string
          mode_jimpitan?: string
          mulai_kas_ibu?: string | null
          no_kk?: string | null
          no_rumah: string
          rt?: string
          rw?: string
          status_hunian?: Database["public"]["Enums"]["status_hunian"]
          updated_at?: string
        }
        Update: {
          alamat_lengkap?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          ikut_arisan?: boolean
          is_active?: boolean
          kecamatan?: string
          kelurahan?: string
          mode_jimpitan?: string
          mulai_kas_ibu?: string | null
          no_kk?: string | null
          no_rumah?: string
          rt?: string
          rw?: string
          status_hunian?: Database["public"]["Enums"]["status_hunian"]
          updated_at?: string
        }
        Relationships: []
      }
      surat_pengantar: {
        Row: {
          catatan_admin: string | null
          created_at: string
          diproses_oleh: string | null
          id: string
          jenis_surat: Database["public"]["Enums"]["jenis_surat"]
          keperluan: string
          lampiran_url: string[] | null
          nomor_surat: string
          status: Database["public"]["Enums"]["status_surat"]
          tanggal_diajukan: string
          tanggal_selesai: string | null
          tujuan: string | null
          updated_at: string
          warga_id: string
        }
        Insert: {
          catatan_admin?: string | null
          created_at?: string
          diproses_oleh?: string | null
          id?: string
          jenis_surat: Database["public"]["Enums"]["jenis_surat"]
          keperluan: string
          lampiran_url?: string[] | null
          nomor_surat: string
          status?: Database["public"]["Enums"]["status_surat"]
          tanggal_diajukan?: string
          tanggal_selesai?: string | null
          tujuan?: string | null
          updated_at?: string
          warga_id: string
        }
        Update: {
          catatan_admin?: string | null
          created_at?: string
          diproses_oleh?: string | null
          id?: string
          jenis_surat?: Database["public"]["Enums"]["jenis_surat"]
          keperluan?: string
          lampiran_url?: string[] | null
          nomor_surat?: string
          status?: Database["public"]["Enums"]["status_surat"]
          tanggal_diajukan?: string
          tanggal_selesai?: string | null
          tujuan?: string | null
          updated_at?: string
          warga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "surat_pengantar_warga_id_fkey"
            columns: ["warga_id"]
            isOneToOne: false
            referencedRelation: "warga_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      tukar_jadwal_ronda: {
        Row: {
          alasan: string | null
          created_at: string
          disetujui: boolean | null
          disetujui_oleh: string | null
          id: string
          jadwal_asal_id: string
          pemohon_id: string
          pengganti_id: string
          tanggal_tukar: string
          updated_at: string
        }
        Insert: {
          alasan?: string | null
          created_at?: string
          disetujui?: boolean | null
          disetujui_oleh?: string | null
          id?: string
          jadwal_asal_id: string
          pemohon_id: string
          pengganti_id: string
          tanggal_tukar: string
          updated_at?: string
        }
        Update: {
          alasan?: string | null
          created_at?: string
          disetujui?: boolean | null
          disetujui_oleh?: string | null
          id?: string
          jadwal_asal_id?: string
          pemohon_id?: string
          pengganti_id?: string
          tanggal_tukar?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tukar_jadwal_ronda_jadwal_asal_id_fkey"
            columns: ["jadwal_asal_id"]
            isOneToOne: false
            referencedRelation: "jadwal_ronda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tukar_jadwal_ronda_jadwal_asal_id_fkey"
            columns: ["jadwal_asal_id"]
            isOneToOne: false
            referencedRelation: "v_jadwal_ronda_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tukar_jadwal_ronda_pemohon_id_fkey"
            columns: ["pemohon_id"]
            isOneToOne: false
            referencedRelation: "warga_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tukar_jadwal_ronda_pengganti_id_fkey"
            columns: ["pengganti_id"]
            isOneToOne: false
            referencedRelation: "warga_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      warga_detail: {
        Row: {
          agama: Database["public"]["Enums"]["agama"]
          alasan_nonaktif: Database["public"]["Enums"]["alasan_nonaktif"] | null
          created_at: string
          golongan_darah: string | null
          hubungan_keluarga: Database["public"]["Enums"]["hubungan_keluarga"]
          id: string
          is_active: boolean
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"]
          keterangan_nonaktif: string | null
          nama_lengkap: string
          nik: string | null
          no_hp: string | null
          pekerjaan: string | null
          pendidikan_terakhir: string | null
          rumah_id: string
          status_perkawinan: Database["public"]["Enums"]["status_perkawinan"]
          tanggal_lahir: string
          tanggal_nonaktif: string | null
          tempat_lahir: string | null
          updated_at: string
        }
        Insert: {
          agama?: Database["public"]["Enums"]["agama"]
          alasan_nonaktif?:
            | Database["public"]["Enums"]["alasan_nonaktif"]
            | null
          created_at?: string
          golongan_darah?: string | null
          hubungan_keluarga: Database["public"]["Enums"]["hubungan_keluarga"]
          id?: string
          is_active?: boolean
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"]
          keterangan_nonaktif?: string | null
          nama_lengkap: string
          nik?: string | null
          no_hp?: string | null
          pekerjaan?: string | null
          pendidikan_terakhir?: string | null
          rumah_id: string
          status_perkawinan?: Database["public"]["Enums"]["status_perkawinan"]
          tanggal_lahir: string
          tanggal_nonaktif?: string | null
          tempat_lahir?: string | null
          updated_at?: string
        }
        Update: {
          agama?: Database["public"]["Enums"]["agama"]
          alasan_nonaktif?:
            | Database["public"]["Enums"]["alasan_nonaktif"]
            | null
          created_at?: string
          golongan_darah?: string | null
          hubungan_keluarga?: Database["public"]["Enums"]["hubungan_keluarga"]
          id?: string
          is_active?: boolean
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"]
          keterangan_nonaktif?: string | null
          nama_lengkap?: string
          nik?: string | null
          no_hp?: string | null
          pekerjaan?: string | null
          pendidikan_terakhir?: string | null
          rumah_id?: string
          status_perkawinan?: Database["public"]["Enums"]["status_perkawinan"]
          tanggal_lahir?: string
          tanggal_nonaktif?: string | null
          tempat_lahir?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warga_detail_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_arisan_anggota_publik: {
        Row: {
          jumlah_anggota: number | null
          ronde_id: string | null
          ronde_nomor: number | null
          rumah_id: string | null
          tanggal_mulai: string | null
          tanggal_selesai: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arisan_anggota_ronde_id_fkey"
            columns: ["ronde_id"]
            isOneToOne: false
            referencedRelation: "arisan_ronde"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arisan_anggota_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
        ]
      }
      v_arisan_rekap: {
        Row: {
          bulan: number | null
          catatan: string | null
          created_at: string | null
          jumlah_pembayar: number | null
          nominal_putaran: number | null
          nominal_terkumpul: number | null
          pemenang_no_rumah: string | null
          pemenang_rumah_id: string | null
          pengeluaran_id: string | null
          putaran_id: string | null
          ronde_id: string | null
          ronde_nomor: number | null
          sudah_disalurkan: boolean | null
          tahun: number | null
          tanggal_undi: string | null
          updated_at: string | null
          urutan: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arisan_putaran_pemenang_rumah_id_fkey"
            columns: ["pemenang_rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arisan_putaran_pengeluaran_id_fkey"
            columns: ["pengeluaran_id"]
            isOneToOne: true
            referencedRelation: "pengeluaran_kas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arisan_putaran_ronde_id_fkey"
            columns: ["ronde_id"]
            isOneToOne: false
            referencedRelation: "arisan_ronde"
            referencedColumns: ["id"]
          },
        ]
      }
      v_jadwal_ronda_public: {
        Row: {
          hari: string | null
          id: string | null
          nama_anggota: string | null
          nama_periode: string | null
          periode_aktif: boolean | null
          periode_id: string | null
          urutan: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jadwal_ronda_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periode_jadwal_ronda"
            referencedColumns: ["id"]
          },
        ]
      }
      v_rumah_hunian_publik: {
        Row: {
          rumah_id: string | null
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          tunggakan_dialihkan: boolean | null
        }
        Insert: {
          rumah_id?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          tunggakan_dialihkan?: boolean | null
        }
        Update: {
          rumah_id?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          tunggakan_dialihkan?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rumah_hunian_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah_kk"
            referencedColumns: ["id"]
          },
        ]
      }
      v_saldo_kas: {
        Row: {
          arisan_belum_disalurkan: number | null
          arisan_masuk: number | null
          iuran_insidental_masuk: number | null
          jimpitan_masuk: number | null
          kas_bapak_masuk: number | null
          kas_ibu_masuk: number | null
          pengeluaran_arisan: number | null
          pengeluaran_jimpitan: number | null
          pengeluaran_kas_bapak: number | null
          pengeluaran_kas_ibu: number | null
          saldo_jimpitan: number | null
          saldo_kas_bapak: number | null
          saldo_kas_ibu: number | null
          saldo_utama: number | null
          total_masuk: number | null
          total_pengeluaran: number | null
          total_pengeluaran_utama: number | null
        }
        Relationships: []
      }
      v_statistik_rt: {
        Row: {
          total_laki: number | null
          total_perempuan: number | null
          total_rumah: number | null
          total_warga: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["role_pengguna"]
      }
      current_user_rumah_id: { Args: never; Returns: string }
      fn_huni_rumah: {
        Args: {
          p_catatan?: string
          p_mulai_kas_ibu?: string
          p_rumah_id: string
          p_status_hunian: Database["public"]["Enums"]["status_hunian"]
          p_tanggal_mulai: string
          p_tunggakan_dialihkan?: boolean
        }
        Returns: {
          catatan: string | null
          created_at: string
          id: string
          rumah_id: string
          tanggal_mulai: string
          tanggal_selesai: string | null
          tunggakan_dialihkan: boolean
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rumah_hunian"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_kosongkan_rumah: {
        Args: {
          p_catatan?: string
          p_rumah_id: string
          p_tanggal_kosong: string
        }
        Returns: {
          catatan: string | null
          created_at: string
          id: string
          rumah_id: string
          tanggal_mulai: string
          tanggal_selesai: string | null
          tunggakan_dialihkan: boolean
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rumah_hunian"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_login_email: { Args: { p_username: string }; Returns: string }
      fn_mulai_arisan_ronde: {
        Args: {
          p_anggota: string[]
          p_catatan?: string
          p_tanggal_mulai: string
        }
        Returns: {
          catatan: string | null
          created_at: string
          dicatat_oleh: string
          id: string
          nomor: number
          tanggal_mulai: string
          tanggal_selesai: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "arisan_ronde"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_salurkan_arisan_putaran: {
        Args: { p_id: string; p_tanggal?: string }
        Returns: {
          bulan: number
          catatan: string | null
          created_at: string
          dicatat_oleh: string
          id: string
          nominal: number
          pemenang_rumah_id: string
          pengeluaran_id: string | null
          ronde_id: string
          tahun: number
          tanggal_undi: string | null
          updated_at: string
          urutan: number
        }
        SetofOptions: {
          from: "*"
          to: "arisan_putaran"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_simpan_arisan_putaran: {
        Args: {
          p_bulan: number
          p_catatan?: string
          p_nominal: number
          p_pemenang_rumah_id: string
          p_salurkan?: boolean
          p_tahun: number
          p_tanggal_salur?: string
          p_tanggal_undi?: string
        }
        Returns: {
          bulan: number
          catatan: string | null
          created_at: string
          dicatat_oleh: string
          id: string
          nominal: number
          pemenang_rumah_id: string
          pengeluaran_id: string | null
          ronde_id: string
          tahun: number
          tanggal_undi: string | null
          updated_at: string
          urutan: number
        }
        SetofOptions: {
          from: "*"
          to: "arisan_putaran"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_tutup_arisan_ronde: {
        Args: { p_ronde_id: string; p_tanggal_selesai?: string }
        Returns: {
          catatan: string | null
          created_at: string
          dicatat_oleh: string
          id: string
          nomor: number
          tanggal_mulai: string
          tanggal_selesai: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "arisan_ronde"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      agama:
        | "Islam"
        | "Kristen"
        | "Katolik"
        | "Hindu"
        | "Buddha"
        | "Konghucu"
        | "Lainnya"
      alasan_nonaktif: "Pindah" | "Wafat" | "Lainnya"
      hubungan_keluarga:
        | "Kepala Keluarga"
        | "Istri"
        | "Anak"
        | "Orang Tua"
        | "Mertua"
        | "Menantu"
        | "Cucu"
        | "Famili Lain"
        | "Lainnya"
      jenis_kelamin: "L" | "P"
      jenis_surat:
        | "Pengantar KTP"
        | "Pengantar KK"
        | "Domisili"
        | "Keterangan Usaha"
        | "Keterangan Tidak Mampu"
        | "Pengantar SKCK"
        | "Keterangan Kematian"
        | "Keterangan Pindah"
        | "Lainnya"
      kategori_pengeluaran:
        | "Operasional"
        | "Keamanan"
        | "Kebersihan"
        | "Sosial"
        | "Pembangunan"
        | "Kegiatan"
        | "Lainnya"
      kondisi_barang: "Baik" | "Rusak Ringan" | "Rusak Berat" | "Hilang"
      role_pengguna: "admin" | "ronda" | "warga"
      status_hunian: "Tetap" | "Kontrak" | "Kosong"
      status_jimpitan: "Belum" | "Diambil" | "Kosong"
      status_peminjaman: "Dipinjam" | "Dikembalikan" | "Rusak" | "Hilang"
      status_perkawinan: "Belum Kawin" | "Kawin" | "Cerai Hidup" | "Cerai Mati"
      status_surat: "Diajukan" | "Diproses" | "Selesai" | "Ditolak"
      tipe_audit: "INSERT" | "UPDATE" | "DELETE"
      tipe_kas: "Bapak" | "Ibu" | "Arisan"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agama: [
        "Islam",
        "Kristen",
        "Katolik",
        "Hindu",
        "Buddha",
        "Konghucu",
        "Lainnya",
      ],
      alasan_nonaktif: ["Pindah", "Wafat", "Lainnya"],
      hubungan_keluarga: [
        "Kepala Keluarga",
        "Istri",
        "Anak",
        "Orang Tua",
        "Mertua",
        "Menantu",
        "Cucu",
        "Famili Lain",
        "Lainnya",
      ],
      jenis_kelamin: ["L", "P"],
      jenis_surat: [
        "Pengantar KTP",
        "Pengantar KK",
        "Domisili",
        "Keterangan Usaha",
        "Keterangan Tidak Mampu",
        "Pengantar SKCK",
        "Keterangan Kematian",
        "Keterangan Pindah",
        "Lainnya",
      ],
      kategori_pengeluaran: [
        "Operasional",
        "Keamanan",
        "Kebersihan",
        "Sosial",
        "Pembangunan",
        "Kegiatan",
        "Lainnya",
      ],
      kondisi_barang: ["Baik", "Rusak Ringan", "Rusak Berat", "Hilang"],
      role_pengguna: ["admin", "ronda", "warga"],
      status_hunian: ["Tetap", "Kontrak", "Kosong"],
      status_jimpitan: ["Belum", "Diambil", "Kosong"],
      status_peminjaman: ["Dipinjam", "Dikembalikan", "Rusak", "Hilang"],
      status_perkawinan: ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"],
      status_surat: ["Diajukan", "Diproses", "Selesai", "Ditolak"],
      tipe_audit: ["INSERT", "UPDATE", "DELETE"],
      tipe_kas: ["Bapak", "Ibu", "Arisan"],
    },
  },
} as const
