# Design System & Arsitektur Teknis: Sistem Informasi RT (SIRT) Wonoyoso v2

Dokumentasi ini adalah sumber kebenaran tunggal (_Single Source of Truth_) untuk pengembangan aplikasi SIRT. Sistem ini menggabungkan manajemen keuangan warga (Kas & Jimpitan), pendataan kependudukan, surat pengantar, jadwal ronda, pengumuman, dan pengelolaan inventaris RT.

---

## 1. Arsitektur Teknologi (Tech Stack)

### 1.1. Core

| Layer                  | Teknologi                                          | Alasan                                                                                                                |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | React 18+ dengan TypeScript (Strict Mode)          | Ekosistem luas, type-safety                                                                                           |
| **Build Tool**         | Vite 5+                                            | HMR cepat, optimasi build (code-splitting, tree-shaking)                                                              |
| **Styling**            | Tailwind CSS 3+                                    | Utility-first, konsisten dengan design token                                                                          |
| **UI Components**      | shadcn/ui (Radix UI + Tailwind)                    | Accessible, composable, fully customizable — bukan library, tapi _copy-paste_ komponen ke `src/shared/components/ui/` |
| **Routing**            | React Router v6 (Data API / `createBrowserRouter`) | Nested routes, loader/action pattern                                                                                  |
| **Server State**       | TanStack Query (React Query) v5                    | Caching, revalidation, optimistic updates, offline queue                                                              |
| **Client State**       | Zustand                                            | Ringan, modular, devtools support                                                                                     |
| **Form & Validasi**    | React Hook Form + Zod                              | Performa tinggi, schema-based validation                                                                              |
| **Data Visualization** | Recharts                                           | Dasbor demografi & keuangan                                                                                           |
| **Icons**              | Lucide React                                       | Konsisten, tree-shakable                                                                                              |
| **Date Utility**       | date-fns                                           | Lightweight, immutable, locale ID support                                                                             |
| **Export/Cetak**       | jsPDF + @tanstack/react-table                      | Laporan keuangan PDF & tabel cetak                                                                                    |

### 1.2. Backend & Infrastruktur

| Layer                  | Teknologi                         | Alasan                                        |
| ---------------------- | --------------------------------- | --------------------------------------------- |
| **Backend & Database** | Supabase (PostgreSQL 15+)         | Auth, RLS, Realtime, Storage, Edge Functions  |
| **Authentication**     | Supabase Auth (Email & Password)  | JWT-based, row-level security integration     |
| **File Storage**       | Supabase Storage                  | Foto KTP, lampiran surat, bukti pengeluaran   |
| **Edge Functions**     | Supabase Edge Functions (Deno)    | PDF generation, scheduled jobs, webhook       |
| **PWA**                | Vite PWA Plugin (vite-plugin-pwa) | Offline support, installable, background sync |
| **Hosting**            | Vercel / Netlify                  | Auto deploy dari Git, preview per PR          |

### 1.3. Development & Quality

| Layer          | Teknologi                  | Alasan                      |
| -------------- | -------------------------- | --------------------------- |
| **Linting**    | ESLint + typescript-eslint | Konsistensi kode            |
| **Formatting** | Prettier                   | Format otomatis             |
| **Unit Test**  | Vitest + Testing Library   | Cepat, kompatibel Vite      |
| **E2E Test**   | Playwright                 | Cross-browser, reliable     |
| **CI/CD**      | GitHub Actions             | Otomasi test, build, deploy |

---

## 2. Struktur Folder Proyek

```
src/
├── app/
│   ├── routes/                  # Route definitions (React Router)
│   │   ├── _layout.tsx          # Root layout (navbar, sidebar, auth guard)
│   │   ├── _layout.public.tsx   # Layout halaman publik
│   │   ├── _layout.admin.tsx    # Layout halaman admin (sidebar)
│   │   ├── index.tsx            # / — Beranda publik
│   │   ├── login.tsx            # /login
│   │   ├── ronda.tsx            # /ronda — Input jimpitan
│   │   ├── jadwal.tsx           # /jadwal — Jadwal ronda hari ini
│   │   ├── admin.dashboard.tsx  # /admin — Dashboard
│   │   ├── admin.warga.tsx      # /admin/warga
│   │   ├── admin.keuangan.tsx   # /admin/keuangan
│   │   ├── admin.ronda.tsx      # /admin/ronda
│   │   ├── admin.surat.tsx      # /admin/surat
│   │   ├── admin.pengumuman.tsx # /admin/pengumuman
│   │   ├── admin.inventaris.tsx # /admin/inventaris
│   │   └── admin.pengaturan.tsx # /admin/pengaturan
│   ├── router.tsx               # createBrowserRouter config
│   └── App.tsx                  # Provider tree (QueryClient, Auth, etc.)
│
├── features/                    # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── components/          # LoginForm, AuthGuard, RoleGate
│   │   ├── hooks/               # useAuth, useRequireRole
│   │   ├── store.ts             # useAuthStore (Zustand)
│   │   ├── api.ts               # Supabase auth calls
│   │   └── types.ts             # AuthUser, Role, Session
│   ├── warga/
│   │   ├── components/          # WargaTable, WargaForm, RumahCard
│   │   ├── hooks/               # useWargaList, useWargaDetail
│   │   ├── api.ts               # CRUD warga & rumah
│   │   ├── schema.ts            # Zod schemas untuk validasi
│   │   └── types.ts
│   ├── keuangan/
│   │   ├── components/          # KasTable, JimpitanInput, PengeluaranForm
│   │   ├── hooks/               # useKasBulanan, useSaldoKas, useJimpitan
│   │   ├── api.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── ronda/
│   │   ├── components/          # JadwalRondaList, InputJimpitanSheet
│   │   ├── hooks/               # useJadwalHariIni, useRondaStore
│   │   ├── api.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── surat/
│   │   ├── components/          # SuratForm, SuratList, SuratPreview
│   │   ├── hooks/
│   │   ├── api.ts
│   │   ├── schema.ts
│   │   ├── templates/           # Template surat (pengantar, domisili, dll)
│   │   └── types.ts
│   ├── pengumuman/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   └── types.ts
│   └── inventaris/
│       ├── components/
│       ├── hooks/
│       ├── api.ts
│       └── types.ts
│
├── components/
│   └── ui/                      # shadcn/ui primitives (auto-generated via CLI)
│       ├── button.tsx           # npx shadcn@latest add button
│       ├── input.tsx
│       ├── label.tsx
│       ├── dialog.tsx           # Modal / confirm dialog
│       ├── sheet.tsx            # Bottom sheet (mobile) / side panel
│       ├── dropdown-menu.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       ├── calendar.tsx
│       ├── popover.tsx
│       ├── command.tsx          # Command palette / search
│       ├── toast.tsx            # via sonner
│       ├── skeleton.tsx
│       ├── separator.tsx
│       ├── avatar.tsx
│       ├── alert.tsx
│       ├── alert-dialog.tsx     # Confirm destructive actions
│       ├── tooltip.tsx
│       ├── form.tsx             # React Hook Form integration
│       ├── data-table.tsx       # Custom: @tanstack/react-table + shadcn
│       └── stat-card.tsx        # Custom: card statistik keuangan
│
├── shared/
│   ├── components/              # Komponen komposit (gabungan shadcn primitives)
│   │   ├── layout/              # Navbar, Sidebar, PageHeader, Container
│   │   ├── data-display/        # DataTable wrapper, EmptyState, charts
│   │   ├── feedback/            # ErrorBoundary, ConfirmDialog (pakai AlertDialog)
│   │   └── forms/               # FormField wrapper, SearchInput, DatePicker
│   ├── hooks/                   # useDebounce, useMediaQuery, useOnlineStatus
│   ├── lib/                     # supabaseClient, queryClient, constants, utils.ts (cn())
│   ├── types/                   # Global types, database.types.ts (Supabase gen)
│   └── utils/                   # formatCurrency, formatDate
│
├── styles/
│   └── globals.css              # Tailwind directives, custom fonts
│
└── main.tsx                     # Entry point
```

---

## 3. Token Desain & UI/UX

### 3.1. Palet Warna

Setiap modul memiliki warna identitas agar pengguna bisa langsung mengenali konteks.

| Modul                 | Warna         | Tailwind Range               | Kesan                       |
| --------------------- | ------------- | ---------------------------- | --------------------------- |
| **Warga & Kas**       | Hijau         | `emerald-50` → `emerald-700` | Transparan, aman            |
| **Ronda & Jadwal**    | Kuning/Jingga | `amber-50` → `amber-600`     | Waspada, aktif              |
| **Pengurus & Admin**  | Biru          | `blue-50` → `blue-800`       | Administratif, formal       |
| **Surat & Dokumen**   | Ungu          | `violet-50` → `violet-600`   | Resmi, dokumen              |
| **Pengumuman**        | Cyan          | `cyan-50` → `cyan-600`       | Informasi, broadcast        |
| **Inventaris**        | Slate         | `slate-50` → `slate-600`     | Netral, aset                |
| **Peringatan/Bahaya** | Merah         | `rose-50` → `rose-600`       | Jimpitan kosong, hapus data |
| **Sukses**            | Green         | `green-50` → `green-600`     | Konfirmasi berhasil         |
| **Netral/Surface**    | Gray          | `gray-50` → `gray-900`       | Background, border, teks    |

#### Warna Semantik (CSS Custom Properties)

```css
:root {
  /* Surface */
  --color-bg-primary: theme("colors.white");
  --color-bg-secondary: theme("colors.gray.50");
  --color-bg-tertiary: theme("colors.gray.100");

  /* Text */
  --color-text-primary: theme("colors.gray.900");
  --color-text-secondary: theme("colors.gray.600");
  --color-text-tertiary: theme("colors.gray.400");
  --color-text-inverse: theme("colors.white");

  /* Border */
  --color-border-default: theme("colors.gray.200");
  --color-border-strong: theme("colors.gray.300");

  /* Status */
  --color-success: theme("colors.green.600");
  --color-warning: theme("colors.amber.500");
  --color-error: theme("colors.rose.600");
  --color-info: theme("colors.blue.600");
}
```

### 3.2. Tipografi

| Token              | Value                               | Penggunaan            |
| ------------------ | ----------------------------------- | --------------------- |
| **Font Family**    | `Inter, system-ui, sans-serif`      | Seluruh aplikasi      |
| **Font Mono**      | `JetBrains Mono, monospace`         | Angka keuangan, kode  |
| **Heading 1**      | `text-2xl font-bold` (24px/700)     | Judul halaman         |
| **Heading 2**      | `text-xl font-semibold` (20px/600)  | Judul section         |
| **Heading 3**      | `text-lg font-semibold` (18px/600)  | Judul card/subsection |
| **Body**           | `text-sm` (14px/400)                | Teks utama            |
| **Body Large**     | `text-base` (16px/400)              | Teks form, input      |
| **Caption**        | `text-xs text-gray-500` (12px/400)  | Label, keterangan     |
| **Angka Keuangan** | `font-mono tabular-nums text-right` | Semua nominal Rupiah  |

> **Catatan aksesibilitas:** Ukuran font minimum `14px` untuk body text, `16px` untuk input field (mencegah zoom otomatis di iOS). Kontras minimum WCAG AA (4.5:1 untuk teks, 3:1 untuk elemen besar).

### 3.3. Spacing & Sizing

| Token                  | Value                     | Penggunaan                |
| ---------------------- | ------------------------- | ------------------------- |
| **Page Padding**       | `px-4 py-6` (16px / 24px) | Padding halaman mobile    |
| **Card Padding**       | `p-4` (16px)              | Padding dalam card        |
| **Section Gap**        | `space-y-6` (24px)        | Jarak antar section       |
| **Form Gap**           | `space-y-4` (16px)        | Jarak antar field form    |
| **Inline Gap**         | `gap-2` (8px)             | Jarak antar elemen inline |
| **Border Radius**      | `rounded-xl` (12px)       | Card, modal               |
| **Border Radius SM**   | `rounded-lg` (8px)        | Button, input             |
| **Border Radius Full** | `rounded-full`            | Avatar, badge, FAB        |

### 3.4. Shadow & Elevation

| Token          | Value       | Penggunaan             |
| -------------- | ----------- | ---------------------- |
| **Card**       | `shadow-sm` | Card biasa             |
| **Card Hover** | `shadow-md` | Card saat di-hover     |
| **Dropdown**   | `shadow-lg` | Dropdown menu, popover |
| **Modal**      | `shadow-xl` | Modal, bottom sheet    |
| **FAB**        | `shadow-lg` | Floating Action Button |

### 3.5. Transisi & Animasi

```
transition-all duration-200 ease-in-out    → Default (hover, focus)
transition-all duration-300 ease-in-out    → Modal open/close
transition-transform duration-300          → Bottom sheet slide
```

### 3.6. Breakpoint & Responsive

| Breakpoint  | Value      | Target                             |
| ----------- | ---------- | ---------------------------------- |
| **Default** | `< 640px`  | HP warga & petugas ronda (primary) |
| **sm**      | `≥ 640px`  | HP landscape                       |
| **md**      | `≥ 768px`  | Tablet                             |
| **lg**      | `≥ 1024px` | Laptop admin/pengurus              |
| **xl**      | `≥ 1280px` | Desktop admin                      |

> **Prinsip:** Mobile-first. Semua halaman publik & ronda harus 100% fungsional di layar < 640px. Layout admin boleh lebih kompleks (sidebar) mulai breakpoint `lg`.

### 3.7. Komponen UI Pattern

#### Container Layout

```
Mobile (publik/ronda): max-w-md mx-auto px-4
Admin desktop:         flex → sidebar w-64 + main flex-1 max-w-6xl
```

#### Bottom Sheet Modal

Digunakan untuk input jimpitan oleh petugas ronda. Ergonomis untuk satu tangan.

```
- Slide up dari bawah (translateY animation)
- Handle bar di atas untuk drag-to-dismiss
- Backdrop overlay (bg-black/50)
- Snap points: 50% dan 90% tinggi layar
- Safe area padding untuk notch/home indicator
```

#### Floating Action Button (FAB)

```
- Posisi: fixed bottom-6 right-6
- Ukuran: w-14 h-14 rounded-full
- Shadow: shadow-lg
- Muncul jika: role === 'ronda' || role === 'admin'
- Aksi: Buka bottom sheet input jimpitan (ronda) / quick menu (admin)
```

#### Empty State Pattern

```
- Ilustrasi/icon (opsional, max 120px)
- Heading: "Belum ada data [nama]"
- Deskripsi: "Tekan tombol [aksi] untuk menambahkan [item] pertama"
- CTA Button (jika user punya izin)
```

#### Skeleton Loading Pattern

```
- Gunakan animated pulse (bg-gray-200 animate-pulse rounded)
- Match layout dengan konten sebenarnya (1:1)
- Tampilkan minimal 200ms untuk menghindari flicker
```

#### Error State Pattern

```
- Icon: AlertCircle (rose-500)
- Pesan: deskriptif, hindari jargon teknis
- Aksi: tombol "Coba Lagi" atau "Kembali"
- Jangan tampilkan stack trace ke user
```

---

## 4. Struktur Database (Schema PostgreSQL)

Relasi dioptimalkan menggunakan pendekatan _Soft-Delete_ (`is_active = false`) agar riwayat keuangan masa lalu tidak hilang ketika warga pindah. Semua tabel memiliki `created_at` dan `updated_at` untuk audit trail.

### 4.0. Tipe Enum

```sql
CREATE TYPE status_hunian AS ENUM ('Tetap', 'Kontrak', 'Kosong');
CREATE TYPE jenis_kelamin AS ENUM ('L', 'P');
CREATE TYPE hubungan_keluarga AS ENUM ('Kepala Keluarga', 'Istri', 'Anak', 'Orang Tua', 'Mertua', 'Menantu', 'Cucu', 'Famili Lain', 'Lainnya');
CREATE TYPE status_perkawinan AS ENUM ('Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati');
CREATE TYPE agama AS ENUM ('Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya');
CREATE TYPE status_jimpitan AS ENUM ('Diambil', 'Kosong', 'Tidak Ada Orang');
CREATE TYPE jenis_surat AS ENUM ('Pengantar KTP', 'Pengantar KK', 'Domisili', 'Keterangan Usaha', 'Keterangan Tidak Mampu', 'Pengantar SKCK', 'Keterangan Kematian', 'Keterangan Pindah', 'Lainnya');
CREATE TYPE status_surat AS ENUM ('Diajukan', 'Diproses', 'Selesai', 'Ditolak');
CREATE TYPE role_pengguna AS ENUM ('admin', 'ronda', 'warga');
CREATE TYPE status_peminjaman AS ENUM ('Dipinjam', 'Dikembalikan', 'Rusak', 'Hilang');
CREATE TYPE kondisi_barang AS ENUM ('Baik', 'Rusak Ringan', 'Rusak Berat', 'Hilang');
CREATE TYPE alasan_nonaktif AS ENUM ('Pindah', 'Wafat', 'Lainnya');
CREATE TYPE tipe_kas AS ENUM ('Bapak', 'Ibu');
CREATE TYPE kategori_pengeluaran AS ENUM ('Operasional', 'Keamanan', 'Kebersihan', 'Sosial', 'Pembangunan', 'Kegiatan', 'Lainnya');
CREATE TYPE tipe_audit AS ENUM ('INSERT', 'UPDATE', 'DELETE');
```

### 4.1. Modul Pengguna & Autentikasi

**Tabel `profil_pengguna`** (Ekstensi dari `auth.users` Supabase)

| Kolom           | Tipe          | Constraint                     | Keterangan                          |
| --------------- | ------------- | ------------------------------ | ----------------------------------- |
| `id`            | UUID          | PK, FK → auth.users.id         | Sama dengan Supabase user ID        |
| `nama_tampilan` | VARCHAR(100)  | NOT NULL                       | Nama yang ditampilkan di UI         |
| `role`          | role_pengguna | NOT NULL, Default: 'warga'     | admin / ronda / warga               |
| `warga_id`      | UUID          | FK → warga_detail.id, NULLABLE | Link ke data warga (jika ada)       |
| `avatar_url`    | TEXT          | NULLABLE                       | URL foto profil di Supabase Storage |
| `no_hp`         | VARCHAR(15)   | NULLABLE                       | Nomor HP untuk kontak               |
| `pin_ronda`     | VARCHAR(6)    | NULLABLE                       | PIN unik petugas ronda (hashed)     |
| `is_active`     | BOOLEAN       | Default: true                  |                                     |
| `last_login_at` | TIMESTAMPTZ   | NULLABLE                       | Waktu login terakhir                |
| `created_at`    | TIMESTAMPTZ   | Default: now()                 |                                     |
| `updated_at`    | TIMESTAMPTZ   | Default: now()                 | Auto-update via trigger             |

> **Catatan:** Setiap petugas ronda memiliki akun sendiri (bukan akun bersama) untuk memastikan akuntabilitas individu. `pin_ronda` digunakan sebagai alternatif login cepat di lapangan.

### 4.2. Modul Kependudukan

**Tabel `rumah_kk`** (Master Bangunan / KK)

| Kolom            | Tipe          | Constraint                     | Keterangan                        |
| ---------------- | ------------- | ------------------------------ | --------------------------------- |
| `id`             | UUID          | PK, Default: gen_random_uuid() |                                   |
| `no_rumah`       | VARCHAR(10)   | UNIQUE, NOT NULL               | Contoh: "04", "12A"               |
| `no_kk`          | VARCHAR(16)   | NULLABLE                       | Nomor Kartu Keluarga              |
| `alamat_lengkap` | TEXT          | NULLABLE                       | Alamat lengkap (jalan, gang, dll) |
| `rt`             | VARCHAR(3)    | NOT NULL, Default: '005'       | Nomor RT                          |
| `rw`             | VARCHAR(3)    | NOT NULL, Default: '003'       | Nomor RW                          |
| `kelurahan`      | VARCHAR(50)   | Default: 'Wonoyoso'            |                                   |
| `kecamatan`      | VARCHAR(50)   | Default: 'Pringapus'           |                                   |
| `status_hunian`  | status_hunian | NOT NULL, Default: 'Tetap'     | Tetap/Kontrak/Kosong              |
| `catatan`        | TEXT          | NULLABLE                       | Catatan tambahan                  |
| `is_active`      | BOOLEAN       | Default: true                  |                                   |
| `created_at`     | TIMESTAMPTZ   | Default: now()                 |                                   |
| `updated_at`     | TIMESTAMPTZ   | Default: now()                 |                                   |

**Tabel `warga_detail`** (Individu Warga)

| Kolom                 | Tipe              | Constraint                     | Keterangan                   |
| --------------------- | ----------------- | ------------------------------ | ---------------------------- |
| `id`                  | UUID              | PK, Default: gen_random_uuid() |                              |
| `rumah_id`            | UUID              | FK → rumah_kk.id, NOT NULL     |                              |
| `nik`                 | VARCHAR(16)       | UNIQUE, NULLABLE               | Nullable untuk balita        |
| `nama_lengkap`        | VARCHAR(100)      | NOT NULL                       |                              |
| `jenis_kelamin`       | jenis_kelamin     | NOT NULL                       | L / P                        |
| `tempat_lahir`        | VARCHAR(50)       | NULLABLE                       |                              |
| `tanggal_lahir`       | DATE              | NOT NULL                       |                              |
| `agama`               | agama             | Default: 'Islam'               |                              |
| `status_perkawinan`   | status_perkawinan | Default: 'Belum Kawin'         |                              |
| `hubungan_keluarga`   | hubungan_keluarga | NOT NULL                       |                              |
| `pendidikan_terakhir` | VARCHAR(30)       | NULLABLE                       | SD/SMP/SMA/D3/S1/S2/S3       |
| `pekerjaan`           | VARCHAR(50)       | NULLABLE                       |                              |
| `no_hp`               | VARCHAR(15)       | NULLABLE                       |                              |
| `golongan_darah`      | VARCHAR(3)        | NULLABLE                       | A/B/AB/O                     |
| `is_active`           | BOOLEAN           | Default: true                  | false jika pindah/wafat      |
| `alasan_nonaktif`     | alasan_nonaktif   | NULLABLE                       | Diisi saat is_active = false |
| `tanggal_nonaktif`    | DATE              | NULLABLE                       | Tanggal pindah/wafat         |
| `keterangan_nonaktif` | TEXT              | NULLABLE                       | Detail tambahan              |
| `created_at`          | TIMESTAMPTZ       | Default: now()                 |                              |
| `updated_at`          | TIMESTAMPTZ       | Default: now()                 |                              |

### 4.3. Modul Keuangan

**Tabel `kas_bulanan`** (Iuran Wajib Bulanan per Rumah — Bapak & Ibu)

Satu tabel digunakan untuk kas bapak-bapak maupun ibu-ibu. Dibedakan oleh kolom `tipe_kas`. Ini menghindari duplikasi schema dan mempermudah pelaporan gabungan.

| Kolom             | Tipe          | Constraint                     | Keterangan                 |
| ----------------- | ------------- | ------------------------------ | -------------------------- |
| `id`              | UUID          | PK, Default: gen_random_uuid() |                            |
| `rumah_id`        | UUID          | FK → rumah_kk.id, NOT NULL     |                            |
| `tipe_kas`        | tipe_kas      | NOT NULL, Default: 'Bapak'     | **'Bapak'** atau **'Ibu'** |
| `bulan`           | INT           | NOT NULL, CHECK (1-12)         |                            |
| `tahun`           | INT           | NOT NULL, CHECK (>= 2020)      |                            |
| `jumlah`          | NUMERIC(12,2) | NOT NULL                       | Nominal iuran              |
| `status_bayar`    | BOOLEAN       | Default: false                 |                            |
| `tanggal_bayar`   | DATE          | NULLABLE                       | Diisi saat sudah bayar     |
| `metode_bayar`    | VARCHAR(20)   | NULLABLE                       | Tunai / Transfer           |
| `bukti_bayar_url` | TEXT          | NULLABLE                       | URL bukti transfer         |
| `dicatat_oleh`    | UUID          | FK → auth.users, NOT NULL      | Admin yang mencatat        |
| `keterangan`      | TEXT          | NULLABLE                       |                            |
| `created_at`      | TIMESTAMPTZ   | Default: now()                 |                            |
| `updated_at`      | TIMESTAMPTZ   | Default: now()                 |                            |

> **Constraint:** UNIQUE(rumah_id, tipe_kas, bulan, tahun) — mencegah duplikasi data per rumah per tipe kas per bulan.

**Tabel `iuran_insidental`** (Iuran Tidak Rutin)

| Kolom             | Tipe          | Constraint                     | Keterangan                      |
| ----------------- | ------------- | ------------------------------ | ------------------------------- |
| `id`              | UUID          | PK, Default: gen_random_uuid() |                                 |
| `nama_iuran`      | VARCHAR(100)  | NOT NULL                       | Contoh: "Iuran 17 Agustus 2026" |
| `deskripsi`       | TEXT          | NULLABLE                       |                                 |
| `nominal_target`  | NUMERIC(12,2) | NULLABLE                       | Target per rumah (jika ada)     |
| `tanggal_mulai`   | DATE          | NOT NULL                       |                                 |
| `tanggal_selesai` | DATE          | NULLABLE                       |                                 |
| `is_active`       | BOOLEAN       | Default: true                  |                                 |
| `dibuat_oleh`     | UUID          | FK → auth.users, NOT NULL      |                                 |
| `created_at`      | TIMESTAMPTZ   | Default: now()                 |                                 |
| `updated_at`      | TIMESTAMPTZ   | Default: now()                 |                                 |

**Tabel `iuran_insidental_detail`** (Pembayaran per Rumah)

| Kolom           | Tipe          | Constraint                         | Keterangan |
| --------------- | ------------- | ---------------------------------- | ---------- |
| `id`            | UUID          | PK, Default: gen_random_uuid()     |            |
| `iuran_id`      | UUID          | FK → iuran_insidental.id, NOT NULL |            |
| `rumah_id`      | UUID          | FK → rumah_kk.id, NOT NULL         |            |
| `jumlah`        | NUMERIC(12,2) | NOT NULL                           |            |
| `status_bayar`  | BOOLEAN       | Default: false                     |            |
| `tanggal_bayar` | DATE          | NULLABLE                           |            |
| `dicatat_oleh`  | UUID          | FK → auth.users, NOT NULL          |            |
| `created_at`    | TIMESTAMPTZ   | Default: now()                     |            |
| `updated_at`    | TIMESTAMPTZ   | Default: now()                     |            |

> **Constraint:** UNIQUE(iuran_id, rumah_id)

**Tabel `jimpitan_harian`** (Pengumpulan Jimpitan oleh Petugas Ronda)

| Kolom          | Tipe            | Constraint                     | Keterangan                         |
| -------------- | --------------- | ------------------------------ | ---------------------------------- |
| `id`           | UUID            | PK, Default: gen_random_uuid() |                                    |
| `rumah_id`     | UUID            | FK → rumah_kk.id, NOT NULL     |                                    |
| `tanggal`      | DATE            | NOT NULL                       |                                    |
| `nominal`      | NUMERIC(12,2)   | Default: 0                     |                                    |
| `status`       | status_jimpitan | NOT NULL                       | Diambil / Kosong / Tidak Ada Orang |
| `catatan`      | TEXT            | NULLABLE                       | Catatan petugas                    |
| `dicatat_oleh` | UUID            | FK → auth.users, NOT NULL      | Petugas yang input                 |
| `created_at`   | TIMESTAMPTZ     | Default: now()                 |                                    |
| `updated_at`   | TIMESTAMPTZ     | Default: now()                 |                                    |

> **Constraint:** UNIQUE(rumah_id, tanggal) — satu rumah hanya bisa diinput sekali per hari.

**Tabel `pengeluaran_kas`** (Pencatatan Pengeluaran)

| Kolom            | Tipe                 | Constraint                     | Keterangan            |
| ---------------- | -------------------- | ------------------------------ | --------------------- |
| `id`             | UUID                 | PK, Default: gen_random_uuid() |                       |
| `tanggal`        | DATE                 | NOT NULL                       |                       |
| `kategori`       | kategori_pengeluaran | NOT NULL                       |                       |
| `nominal`        | NUMERIC(12,2)        | NOT NULL                       |                       |
| `keterangan`     | TEXT                 | NOT NULL                       |                       |
| `bukti_url`      | TEXT                 | NULLABLE                       | Foto nota/kwitansi    |
| `disetujui_oleh` | UUID                 | FK → auth.users, NULLABLE      | Admin yang menyetujui |
| `dicatat_oleh`   | UUID                 | FK → auth.users, NOT NULL      |                       |
| `created_at`     | TIMESTAMPTZ          | Default: now()                 |                       |
| `updated_at`     | TIMESTAMPTZ          | Default: now()                 |                       |

**View `v_saldo_kas`** (Materialized View — Saldo Terkini)

```sql
CREATE MATERIALIZED VIEW v_saldo_kas AS
SELECT
  'kas_bapak_masuk' AS tipe,
  SUM(jumlah) FILTER (WHERE status_bayar = true) AS total
FROM kas_bulanan WHERE tipe_kas = 'Bapak'
UNION ALL
SELECT
  'kas_ibu_masuk' AS tipe,
  SUM(jumlah) FILTER (WHERE status_bayar = true) AS total
FROM kas_bulanan WHERE tipe_kas = 'Ibu'
UNION ALL
SELECT
  'jimpitan_masuk' AS tipe,
  SUM(nominal) FILTER (WHERE status = 'Diambil') AS total
FROM jimpitan_harian
UNION ALL
SELECT
  'iuran_insidental_masuk' AS tipe,
  SUM(jumlah) FILTER (WHERE status_bayar = true) AS total
FROM iuran_insidental_detail
UNION ALL
SELECT
  'pengeluaran' AS tipe,
  SUM(nominal) AS total
FROM pengeluaran_kas;

-- Refresh via trigger atau cron (setiap jam)
-- Saldo total = SUM(semua *_masuk) - SUM(pengeluaran)
-- Saldo per kas bisa difilter berdasarkan tipe
```

### 4.4. Modul Operasional (Ronda)

**Tabel `periode_jadwal_ronda`** (Periode Jadwal)

| Kolom             | Tipe        | Constraint                     | Keterangan                     |
| ----------------- | ----------- | ------------------------------ | ------------------------------ |
| `id`              | UUID        | PK, Default: gen_random_uuid() |                                |
| `nama_periode`    | VARCHAR(50) | NOT NULL                       | Contoh: "Juli 2026", "Q3 2026" |
| `tanggal_mulai`   | DATE        | NOT NULL                       |                                |
| `tanggal_selesai` | DATE        | NOT NULL                       |                                |
| `is_active`       | BOOLEAN     | Default: true                  | Hanya satu periode aktif       |
| `dibuat_oleh`     | UUID        | FK → auth.users, NOT NULL      |                                |
| `created_at`      | TIMESTAMPTZ | Default: now()                 |                                |
| `updated_at`      | TIMESTAMPTZ | Default: now()                 |                                |

**Tabel `jadwal_ronda`** (Jadwal per Hari dalam Periode)

| Kolom        | Tipe        | Constraint                             | Keterangan             |
| ------------ | ----------- | -------------------------------------- | ---------------------- |
| `id`         | UUID        | PK, Default: gen_random_uuid()         |                        |
| `periode_id` | UUID        | FK → periode_jadwal_ronda.id, NOT NULL |                        |
| `hari`       | VARCHAR(10) | NOT NULL                               | 'Senin' – 'Minggu'     |
| `warga_id`   | UUID        | FK → warga_detail.id, NOT NULL         |                        |
| `urutan`     | INT         | Default: 0                             | Urutan dalam satu hari |
| `is_active`  | BOOLEAN     | Default: true                          |                        |
| `created_at` | TIMESTAMPTZ | Default: now()                         |                        |
| `updated_at` | TIMESTAMPTZ | Default: now()                         |                        |

**Tabel `kehadiran_ronda`** (Log Kehadiran)

| Kolom            | Tipe        | Constraint                     | Keterangan                   |
| ---------------- | ----------- | ------------------------------ | ---------------------------- |
| `id`             | UUID        | PK, Default: gen_random_uuid() |                              |
| `jadwal_id`      | UUID        | FK → jadwal_ronda.id, NOT NULL |                              |
| `tanggal`        | DATE        | NOT NULL                       | Tanggal aktual ronda         |
| `warga_id`       | UUID        | FK → warga_detail.id, NOT NULL | Warga yang hadir             |
| `pengganti_dari` | UUID        | FK → warga_detail.id, NULLABLE | Jika menggantikan orang lain |
| `jam_mulai`      | TIME        | NULLABLE                       |                              |
| `jam_selesai`    | TIME        | NULLABLE                       |                              |
| `catatan`        | TEXT        | NULLABLE                       |                              |
| `dicatat_oleh`   | UUID        | FK → auth.users, NOT NULL      |                              |
| `created_at`     | TIMESTAMPTZ | Default: now()                 |                              |

**Tabel `tukar_jadwal_ronda`** (Permintaan Tukar Jadwal)

| Kolom            | Tipe        | Constraint                     | Keterangan             |
| ---------------- | ----------- | ------------------------------ | ---------------------- |
| `id`             | UUID        | PK, Default: gen_random_uuid() |                        |
| `jadwal_asal_id` | UUID        | FK → jadwal_ronda.id, NOT NULL |                        |
| `pemohon_id`     | UUID        | FK → warga_detail.id, NOT NULL | Warga yang minta tukar |
| `pengganti_id`   | UUID        | FK → warga_detail.id, NOT NULL | Warga pengganti        |
| `tanggal_tukar`  | DATE        | NOT NULL                       | Tanggal yang ditukar   |
| `alasan`         | TEXT        | NULLABLE                       |                        |
| `disetujui`      | BOOLEAN     | NULLABLE                       | null = pending         |
| `disetujui_oleh` | UUID        | FK → auth.users, NULLABLE      |                        |
| `created_at`     | TIMESTAMPTZ | Default: now()                 |                        |
| `updated_at`     | TIMESTAMPTZ | Default: now()                 |                        |

### 4.5. Modul Surat Pengantar

**Tabel `surat_pengantar`**

| Kolom              | Tipe         | Constraint                     | Keterangan          |
| ------------------ | ------------ | ------------------------------ | ------------------- |
| `id`               | UUID         | PK, Default: gen_random_uuid() |                     |
| `nomor_surat`      | VARCHAR(50)  | UNIQUE, NOT NULL               | Auto-generated      |
| `jenis_surat`      | jenis_surat  | NOT NULL                       |                     |
| `warga_id`         | UUID         | FK → warga_detail.id, NOT NULL | Pemohon             |
| `keperluan`        | TEXT         | NOT NULL                       | Deskripsi keperluan |
| `tujuan`           | VARCHAR(100) | NULLABLE                       | Instansi tujuan     |
| `status`           | status_surat | Default: 'Diajukan'            |                     |
| `catatan_admin`    | TEXT         | NULLABLE                       | Catatan dari admin  |
| `lampiran_url`     | TEXT[]       | NULLABLE                       | Array URL lampiran  |
| `tanggal_diajukan` | DATE         | Default: CURRENT_DATE          |                     |
| `tanggal_selesai`  | DATE         | NULLABLE                       |                     |
| `diproses_oleh`    | UUID         | FK → auth.users, NULLABLE      |                     |
| `created_at`       | TIMESTAMPTZ  | Default: now()                 |                     |
| `updated_at`       | TIMESTAMPTZ  | Default: now()                 |                     |

### 4.6. Modul Pengumuman

**Tabel `pengumuman`**

| Kolom              | Tipe         | Constraint                     | Keterangan              |
| ------------------ | ------------ | ------------------------------ | ----------------------- |
| `id`               | UUID         | PK, Default: gen_random_uuid() |                         |
| `judul`            | VARCHAR(200) | NOT NULL                       |                         |
| `isi`              | TEXT         | NOT NULL                       | Markdown supported      |
| `kategori`         | VARCHAR(30)  | NULLABLE                       | Info/Kegiatan/Penting   |
| `is_pinned`        | BOOLEAN      | Default: false                 | Ditampilkan paling atas |
| `tanggal_mulai`    | DATE         | Default: CURRENT_DATE          | Mulai ditampilkan       |
| `tanggal_berakhir` | DATE         | NULLABLE                       | Otomatis sembunyikan    |
| `lampiran_url`     | TEXT[]       | NULLABLE                       |                         |
| `dibuat_oleh`      | UUID         | FK → auth.users, NOT NULL      |                         |
| `created_at`       | TIMESTAMPTZ  | Default: now()                 |                         |
| `updated_at`       | TIMESTAMPTZ  | Default: now()                 |                         |

### 4.7. Modul Inventaris

**Tabel `inventaris`** (Aset Milik RT)

| Kolom                | Tipe           | Constraint                     | Keterangan                     |
| -------------------- | -------------- | ------------------------------ | ------------------------------ |
| `id`                 | UUID           | PK, Default: gen_random_uuid() |                                |
| `nama_barang`        | VARCHAR(100)   | NOT NULL                       |                                |
| `kategori`           | VARCHAR(50)    | NULLABLE                       | Peralatan/Elektronik/Perabotan |
| `jumlah`             | INT            | NOT NULL, Default: 1           |                                |
| `kondisi`            | kondisi_barang | Default: 'Baik'                |                                |
| `lokasi_penyimpanan` | VARCHAR(100)   | NULLABLE                       |                                |
| `tanggal_pengadaan`  | DATE           | NULLABLE                       |                                |
| `nilai_perolehan`    | NUMERIC(12,2)  | NULLABLE                       | Harga beli                     |
| `foto_url`           | TEXT           | NULLABLE                       |                                |
| `catatan`            | TEXT           | NULLABLE                       |                                |
| `is_active`          | BOOLEAN        | Default: true                  |                                |
| `created_at`         | TIMESTAMPTZ    | Default: now()                 |                                |
| `updated_at`         | TIMESTAMPTZ    | Default: now()                 |                                |

**Tabel `peminjaman_inventaris`**

| Kolom                     | Tipe              | Constraint                     | Keterangan |
| ------------------------- | ----------------- | ------------------------------ | ---------- |
| `id`                      | UUID              | PK, Default: gen_random_uuid() |            |
| `inventaris_id`           | UUID              | FK → inventaris.id, NOT NULL   |            |
| `peminjam_id`             | UUID              | FK → warga_detail.id, NOT NULL |            |
| `jumlah_pinjam`           | INT               | NOT NULL, Default: 1           |            |
| `tanggal_pinjam`          | DATE              | NOT NULL                       |            |
| `tanggal_kembali_rencana` | DATE              | NOT NULL                       |            |
| `tanggal_kembali_aktual`  | DATE              | NULLABLE                       |            |
| `status`                  | status_peminjaman | Default: 'Dipinjam'            |            |
| `kondisi_kembali`         | kondisi_barang    | NULLABLE                       |            |
| `catatan`                 | TEXT              | NULLABLE                       |            |
| `dicatat_oleh`            | UUID              | FK → auth.users, NOT NULL      |            |
| `created_at`              | TIMESTAMPTZ       | Default: now()                 |            |
| `updated_at`              | TIMESTAMPTZ       | Default: now()                 |            |

### 4.8. Modul Audit & Logging

**Tabel `audit_log`** (Immutable — Tidak Bisa Diedit/Dihapus)

| Kolom         | Tipe        | Constraint                       | Keterangan                 |
| ------------- | ----------- | -------------------------------- | -------------------------- |
| `id`          | BIGINT      | PK, GENERATED ALWAYS AS IDENTITY | Auto-increment             |
| `tabel`       | VARCHAR(50) | NOT NULL                         | Nama tabel yang berubah    |
| `record_id`   | UUID        | NOT NULL                         | ID record yang berubah     |
| `tipe_aksi`   | tipe_audit  | NOT NULL                         | INSERT / UPDATE / DELETE   |
| `data_lama`   | JSONB       | NULLABLE                         | Snapshot sebelum perubahan |
| `data_baru`   | JSONB       | NULLABLE                         | Snapshot setelah perubahan |
| `diubah_oleh` | UUID        | FK → auth.users                  |                            |
| `ip_address`  | INET        | NULLABLE                         |                            |
| `user_agent`  | TEXT        | NULLABLE                         |                            |
| `created_at`  | TIMESTAMPTZ | Default: now()                   | Immutable                  |

```sql
-- Trigger function untuk audit otomatis
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

-- Pasang trigger di semua tabel yang perlu audit
CREATE TRIGGER trg_audit_kas_bulanan
  AFTER INSERT OR UPDATE OR DELETE ON kas_bulanan
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_pengeluaran_kas
  AFTER INSERT OR UPDATE OR DELETE ON pengeluaran_kas
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- (Ulangi untuk tabel lain yang butuh audit)
```

### 4.9. Trigger `updated_at` Otomatis

```sql
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang di semua tabel yang punya kolom updated_at
CREATE TRIGGER trg_updated_at_rumah_kk
  BEFORE UPDATE ON rumah_kk
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- (Ulangi untuk semua tabel)
```

### 4.10. Diagram Relasi (ERD Tekstual)

```
profil_pengguna ──┐
                  │ warga_id
                  ▼
rumah_kk ◄──── warga_detail ───► jadwal_ronda ───► periode_jadwal_ronda
   │               │                   │
   │               │                   ├──► kehadiran_ronda
   │               │                   └──► tukar_jadwal_ronda
   │               │
   │               ├──► surat_pengantar
   │               └──► peminjaman_inventaris ◄─── inventaris
   │
   ├──► kas_bulanan
   ├──► jimpitan_harian
   └──► iuran_insidental_detail ◄─── iuran_insidental

pengeluaran_kas (standalone, FK ke auth.users)
pengumuman (standalone, FK ke auth.users)
audit_log (standalone, immutable)
```

---

## 5. Keamanan Akses & Row Level Security (RLS)

### 5.1. Prinsip Keamanan

1. **Individual accounts:** Setiap pengguna (termasuk petugas ronda) memiliki akun sendiri — tidak ada akun bersama.
2. **Defense in depth:** Validasi di 3 lapis — frontend (UX), API (Edge Function), database (RLS).
3. **Principle of least privilege:** Setiap role hanya mendapat akses minimum yang dibutuhkan.
4. **Audit everything:** Semua perubahan data keuangan dicatat di `audit_log`.

### 5.2. Role Definitions

#### Role: Publik (Anon / Tanpa Login)

- **Target:** Warga umum yang mengakses via browser tanpa login.
- **Izin:**
  - `SELECT` pada ringkasan keuangan (aggregated view, bukan detail per rumah).
  - `SELECT` pada `pengumuman` yang aktif.
  - `SELECT` pada `jadwal_ronda` hari ini (nama & hari, tanpa detail kontak).
  - **BLOKIR:** Seluruh tabel `warga_detail`, `surat_pengantar`, `audit_log`.
  - **BLOKIR:** Detail keuangan per rumah (hanya lihat total/ringkasan).

#### Role: Warga (Login, role = 'warga')

- **Target:** Warga terdaftar yang login dengan akun pribadi.
- **Izin:**
  - Mewarisi semua izin Publik.
  - `SELECT` data diri sendiri di `warga_detail` (WHERE warga_id = profil_pengguna.warga_id).
  - `SELECT` status kas & jimpitan rumah sendiri.
  - `INSERT` pada `surat_pengantar` (mengajukan surat untuk diri sendiri).
  - `SELECT` pada `surat_pengantar` milik sendiri.
  - `SELECT` pada `inventaris` dan `INSERT` pada `peminjaman_inventaris`.
  - **BLOKIR:** Melihat data warga lain, mengubah data apapun.

#### Role: Petugas Ronda (Login, role = 'ronda')

- **Target:** Warga yang bertugas ronda (akun pribadi, bukan bersama).
- **Izin:**
  - Mewarisi semua izin Warga.
  - `INSERT` pada `jimpitan_harian` (input pengumpulan jimpitan).
  - `INSERT` pada `kehadiran_ronda` (catat kehadiran diri sendiri).
  - **BLOKIR:** `UPDATE` dan `DELETE` data jimpitan. Koreksi harus melalui admin.
  - **BLOKIR:** Akses ke `warga_detail` warga lain (hanya lihat nama & no rumah).

#### Role: Admin / Pengurus (Login, role = 'admin')

- **Target:** Ketua RT, Sekretaris, Bendahara (akun pribadi).
- **Izin:**
  - CRUD penuh pada semua tabel.
  - Akses dashboard demografi dan keuangan lengkap.
  - Mengelola `profil_pengguna` (assign role).
  - Melihat `audit_log` (read-only, tidak bisa hapus/edit).
  - Export data dan generate laporan.

### 5.3. Contoh RLS Policy

```sql
-- Contoh: Warga hanya bisa melihat data keluarga sendiri
CREATE POLICY "warga_select_own"
  ON warga_detail FOR SELECT
  USING (
    rumah_id IN (
      SELECT wd.rumah_id FROM warga_detail wd
      JOIN profil_pengguna pp ON pp.warga_id = wd.id
      WHERE pp.id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM profil_pengguna WHERE id = auth.uid() AND role = 'admin')
  );

-- Contoh: Petugas ronda hanya bisa INSERT jimpitan
CREATE POLICY "ronda_insert_jimpitan"
  ON jimpitan_harian FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profil_pengguna
      WHERE id = auth.uid() AND role IN ('ronda', 'admin')
    )
    AND dicatat_oleh = auth.uid()
  );

-- Contoh: Audit log read-only untuk admin, no delete/update
CREATE POLICY "admin_read_audit"
  ON audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profil_pengguna WHERE id = auth.uid() AND role = 'admin')
  );
-- Tidak ada policy untuk INSERT/UPDATE/DELETE pada audit_log dari user
-- INSERT hanya via trigger function (SECURITY DEFINER)
```

### 5.4. Keamanan Tambahan

```sql
-- Rate limiting via Supabase Edge Function
-- Maksimal 100 request per menit per user

-- Password policy (diterapkan di frontend + Supabase Auth config)
-- Minimum 8 karakter, kombinasi huruf dan angka

-- Session management
-- JWT expiry: 1 jam
-- Refresh token: 7 hari
-- Auto-logout setelah 30 menit tidak aktif (frontend)

-- Data sensitif
-- NIK: masked di tampilan publik (tampilkan 4 digit terakhir)
-- Tanggal lahir: hanya tampilkan umur untuk non-admin
-- No HP: hanya terlihat oleh admin dan pemilik akun
```

---

## 6. State Management

### 6.1. Pembagian Tanggung Jawab

| Concern                         | Pengelola                   | Alasan                                                       |
| ------------------------------- | --------------------------- | ------------------------------------------------------------ |
| **Server State** (data dari DB) | TanStack Query              | Caching, stale-while-revalidate, background refetch, offline |
| **Client State** (UI state)     | Zustand                     | Ringan, tidak boilerplate, devtools                          |
| **Form State**                  | React Hook Form             | Performa, uncontrolled input, validasi Zod                   |
| **URL State**                   | React Router (searchParams) | Filter, sort, pagination — shareable via URL                 |

### 6.2. Zustand Stores

```typescript
// useAuthStore — Session & Role
interface AuthStore {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>; // Quick login petugas ronda
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// useUIStore — Global UI State
interface UIStore {
  sidebarOpen: boolean;
  bottomSheetOpen: boolean;
  bottomSheetContent: React.ReactNode | null;
  activeModul: string; // Highlight modul aktif di navbar
  toggleSidebar: () => void;
  openBottomSheet: (content: React.ReactNode) => void;
  closeBottomSheet: () => void;
}

// useOfflineStore — Offline Queue (PWA)
interface OfflineStore {
  pendingActions: OfflineAction[];
  isOnline: boolean;
  addAction: (action: OfflineAction) => void;
  syncAll: () => Promise<void>;
  clearSynced: () => void;
}
```

### 6.3. TanStack Query Keys Convention

```typescript
// Query key factory pattern
export const queryKeys = {
  warga: {
    all: ["warga"] as const,
    lists: () => [...queryKeys.warga.all, "list"] as const,
    list: (filters: WargaFilters) =>
      [...queryKeys.warga.lists(), filters] as const,
    details: () => [...queryKeys.warga.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.warga.details(), id] as const,
  },
  kas: {
    all: ["kas"] as const,
    byType: (tipe: "Bapak" | "Ibu") => [...queryKeys.kas.all, tipe] as const,
    byMonth: (tipe: "Bapak" | "Ibu", bulan: number, tahun: number) =>
      [...queryKeys.kas.byType(tipe), bulan, tahun] as const,
    saldo: () => [...queryKeys.kas.all, "saldo"] as const,
    saldoByType: (tipe: "Bapak" | "Ibu") =>
      [...queryKeys.kas.all, "saldo", tipe] as const,
  },
  jimpitan: {
    all: ["jimpitan"] as const,
    byDate: (tanggal: string) => [...queryKeys.jimpitan.all, tanggal] as const,
    summary: (bulan: number, tahun: number) =>
      [...queryKeys.jimpitan.all, "summary", bulan, tahun] as const,
  },
  ronda: {
    all: ["ronda"] as const,
    jadwalHariIni: () => [...queryKeys.ronda.all, "hari-ini"] as const,
    periode: (periodeId: string) =>
      [...queryKeys.ronda.all, "periode", periodeId] as const,
  },
  surat: {
    all: ["surat"] as const,
    list: (filters: SuratFilters) =>
      [...queryKeys.surat.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.surat.all, id] as const,
  },
  pengumuman: {
    all: ["pengumuman"] as const,
    active: () => [...queryKeys.pengumuman.all, "active"] as const,
  },
  inventaris: {
    all: ["inventaris"] as const,
    available: () => [...queryKeys.inventaris.all, "available"] as const,
  },
} as const;
```

---

## 7. Routing & Navigasi

### 7.1. Route Map

```
Route                          Komponen                  Role Minimum    Deskripsi
─────────────────────────────────────────────────────────────────────────────────────────
/                              BerandaPublik             anon            Ringkasan keuangan, pengumuman, jadwal ronda
/login                         LoginPage                 anon            Form login email/password + PIN
/jadwal                        JadwalRondaPublik         anon            Jadwal ronda minggu ini
/pengumuman                    PengumumanList            anon            Daftar pengumuman aktif
/pengumuman/:id                PengumumanDetail          anon            Detail pengumuman

/warga                         WargaDashboard            warga           Dashboard pribadi warga
/warga/surat                   SuratSaya                 warga           Daftar surat yang diajukan
/warga/surat/baru              AjukanSurat               warga           Form pengajuan surat
/warga/keuangan                KeuanganSaya              warga           Status iuran rumah sendiri
/warga/inventaris              InventarisList            warga           Lihat & pinjam inventaris

/ronda                         RondaDashboard            ronda           Beranda petugas ronda
/ronda/input                   InputJimpitan             ronda           Input jimpitan (bottom sheet)
/ronda/kehadiran               InputKehadiran            ronda           Catat kehadiran ronda

/admin                         AdminDashboard            admin           Dashboard statistik & ringkasan
/admin/warga                   AdminWarga                admin           CRUD warga & rumah
/admin/warga/:id               AdminWargaDetail          admin           Detail warga
/admin/keuangan                AdminKeuangan             admin           Laporan keuangan lengkap
/admin/keuangan/kas-bapak      AdminKasBapak             admin           Kelola kas bulanan bapak-bapak
/admin/keuangan/kas-ibu        AdminKasIbu               admin           Kelola kas bulanan ibu-ibu
/admin/keuangan/jimpitan       AdminJimpitan             admin           Kelola jimpitan
/admin/keuangan/pengeluaran    AdminPengeluaran          admin           Kelola pengeluaran
/admin/keuangan/iuran          AdminIuranInsidental       admin           Kelola iuran insidental
/admin/ronda                   AdminRonda                admin           Kelola jadwal & periode ronda
/admin/surat                   AdminSurat                admin           Proses surat pengantar
/admin/pengumuman              AdminPengumuman           admin           CRUD pengumuman
/admin/inventaris              AdminInventaris           admin           Kelola inventaris & peminjaman
/admin/audit                   AdminAuditLog             admin           Lihat audit log
/admin/pengaturan              AdminPengaturan           admin           Kelola user, role, konfigurasi

/*                             NotFound                  anon            Halaman 404
```

### 7.2. Auth Guard & Route Protection

```typescript
// Komponen wrapper untuk proteksi route
function RequireAuth({ minRole, children }: { minRole: Role; children: ReactNode }) {
  const { user, role } = useAuthStore()
  const location = useLocation()

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!hasMinRole(role, minRole)) return <Navigate to="/" replace />
  return <>{children}</>
}

// Hierarki role: admin > ronda > warga > anon
function hasMinRole(userRole: Role | null, required: Role): boolean {
  const hierarchy: Record<Role, number> = { anon: 0, warga: 1, ronda: 2, admin: 3 }
  return hierarchy[userRole ?? 'anon'] >= hierarchy[required]
}
```

---

## 8. Form & Validasi

### 8.1. Zod Schema Contoh

```typescript
// schema/warga.ts
import { z } from "zod";

export const wargaSchema = z.object({
  rumah_id: z.string().uuid("Pilih rumah/KK"),
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^\d+$/, "NIK hanya angka")
    .nullable(),
  nama_lengkap: z.string().min(3, "Minimal 3 karakter").max(100),
  jenis_kelamin: z.enum(["L", "P"], { required_error: "Pilih jenis kelamin" }),
  tempat_lahir: z.string().min(2).nullable(),
  tanggal_lahir: z.coerce.date({ required_error: "Tanggal lahir wajib diisi" }),
  agama: z.enum([
    "Islam",
    "Kristen",
    "Katolik",
    "Hindu",
    "Buddha",
    "Konghucu",
    "Lainnya",
  ]),
  status_perkawinan: z.enum([
    "Belum Kawin",
    "Kawin",
    "Cerai Hidup",
    "Cerai Mati",
  ]),
  hubungan_keluarga: z.enum([
    "Kepala Keluarga",
    "Istri",
    "Anak",
    "Orang Tua",
    "Mertua",
    "Menantu",
    "Cucu",
    "Famili Lain",
    "Lainnya",
  ]),
  pendidikan_terakhir: z.string().nullable(),
  pekerjaan: z.string().max(50).nullable(),
  no_hp: z
    .string()
    .regex(/^08\d{8,12}$/, "Format: 08xxxxxxxxxx")
    .nullable(),
});

export type WargaFormData = z.infer<typeof wargaSchema>;

// schema/jimpitan.ts
export const jimpitanSchema = z.object({
  rumah_id: z.string().uuid(),
  tanggal: z.coerce.date(),
  nominal: z.number().min(0, "Nominal tidak boleh negatif").max(1_000_000),
  status: z.enum(["Diambil", "Kosong", "Tidak Ada Orang"]),
  catatan: z.string().max(200).nullable(),
});

// schema/surat.ts
export const suratSchema = z.object({
  jenis_surat: z.enum([
    "Pengantar KTP",
    "Pengantar KK",
    "Domisili",
    "Keterangan Usaha",
    "Keterangan Tidak Mampu",
    "Pengantar SKCK",
    "Keterangan Kematian",
    "Keterangan Pindah",
    "Lainnya",
  ]),
  keperluan: z
    .string()
    .min(10, "Jelaskan keperluan minimal 10 karakter")
    .max(500),
  tujuan: z.string().max(100).nullable(),
});
```

### 8.2. Pola Form Reusable

```typescript
// Pattern: React Hook Form + Zod + Supabase mutation
function WargaForm({ defaultValues, onSuccess }: WargaFormProps) {
  const form = useForm<WargaFormData>({
    resolver: zodResolver(wargaSchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: (data: WargaFormData) => supabase.from('warga_detail').upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warga.all })
      toast.success('Data warga berhasil disimpan')
      onSuccess?.()
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
      {/* FormField components */}
    </form>
  )
}
```

---

## 9. Error Handling & Feedback

### 9.1. Error Boundary

```typescript
// Setiap route level dibungkus ErrorBoundary
// React Router v6 sudah support errorElement per route
{
  path: '/admin',
  element: <AdminLayout />,
  errorElement: <RouteErrorPage />,  // Menangkap error di level route
  children: [...]
}
```

### 9.2. Toast Notification Pattern

| Aksi                  | Tipe Toast | Pesan                                                   |
| --------------------- | ---------- | ------------------------------------------------------- |
| Simpan berhasil       | `success`  | "Data [item] berhasil disimpan"                         |
| Hapus berhasil        | `success`  | "[Item] berhasil dihapus"                               |
| Validasi gagal        | `error`    | Pesan spesifik dari Zod schema                          |
| Network error         | `error`    | "Koneksi terputus. Coba lagi nanti."                    |
| Offline action queued | `info`     | "Data disimpan offline. Akan disinkronkan saat online." |
| Sinkronisasi selesai  | `success`  | "X data berhasil disinkronkan"                          |

### 9.3. Confirm Dialog

Wajib ditampilkan sebelum:

- Menghapus data warga / rumah
- Menghapus transaksi keuangan
- Menonaktifkan warga (pindah/wafat)
- Mengubah role pengguna

Pattern:

```
Judul: "Hapus data [item]?"
Deskripsi: "Tindakan ini tidak dapat dibatalkan. Data terkait [detail] juga akan terpengaruh."
Tombol: [Batal] [Hapus] (merah)
```

---

## 10. PWA & Offline Support

### 10.1. Strategi Caching

| Resource                                       | Strategi               | Alasan                                    |
| ---------------------------------------------- | ---------------------- | ----------------------------------------- |
| **App Shell** (HTML, CSS, JS)                  | Cache First            | Aplikasi bisa dibuka tanpa internet       |
| **API: Data referensi** (daftar rumah, jadwal) | Stale While Revalidate | Data jarang berubah, tampilkan cache dulu |
| **API: Data keuangan**                         | Network First          | Perlu data terbaru, fallback ke cache     |
| **Gambar**                                     | Cache First            | Foto profil, lampiran                     |

### 10.2. Offline Queue (Kritis untuk Petugas Ronda)

```
Alur input jimpitan saat offline:
1. Petugas buka app (dari cache / installed PWA)
2. Input nominal jimpitan per rumah
3. Data disimpan ke IndexedDB via useOfflineStore
4. UI menampilkan badge "X data belum tersinkronkan"
5. Saat online terdeteksi (navigator.onLine + fetch check):
   a. Background sync mengirim data ke Supabase
   b. Jika ada konflik (sudah diinput orang lain), tampilkan notifikasi
   c. Clear queue setelah berhasil
6. Toast: "5 data jimpitan berhasil disinkronkan"
```

### 10.3. Manifest (PWA)

```json
{
  "name": "SIRT Wonoyoso",
  "short_name": "SIRT",
  "description": "Sistem Informasi RT Wonoyoso",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#059669",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 11. Export & Laporan

### 11.1. Jenis Laporan

| Laporan                            | Format          | Frekuensi        | Pengguna             |
| ---------------------------------- | --------------- | ---------------- | -------------------- |
| **Rekapitulasi Kas Bulanan Bapak** | PDF, Print      | Bulanan          | Bendahara → Rapat RT |
| **Rekapitulasi Kas Bulanan Ibu**   | PDF, Print      | Bulanan          | Bendahara → Rapat RT |
| **Laporan Jimpitan**               | PDF, Print      | Bulanan          | Bendahara            |
| **Neraca Keuangan**                | PDF, Excel      | Tahunan          | Pengurus RT          |
| **Data Kependudukan**              | Excel           | Sesuai kebutuhan | Sekretaris           |
| **Rekap Kehadiran Ronda**          | PDF             | Bulanan          | Ketua RT             |
| **Surat Pengantar**                | PDF (per surat) | Per permintaan   | Warga                |
| **Laporan Inventaris**             | Excel           | Tahunan          | Sekretaris           |

### 11.2. Template Cetak

```
Layout cetak (print-friendly):
- Ukuran kertas: A4 portrait
- Header: Logo RT + Nama RT + Alamat
- Kop surat: untuk surat pengantar
- Footer: halaman, tanggal cetak
- CSS: @media print { ... }
- Tabel keuangan: border penuh, font mono untuk angka
```

### 11.3. Nomor Surat Otomatis

```
Format: [Nomor]/[Jenis]/[Romawi Bulan]/[Tahun]
Contoh: 001/SKD/VII/2026

Jenis kode:
- SKD: Surat Keterangan Domisili
- SKU: Surat Keterangan Usaha
- SKCK: Surat Pengantar SKCK
- SPK: Surat Pengantar KTP
- SKP: Surat Keterangan Pindah
- dll.

Counter auto-increment per tahun, reset setiap 1 Januari.
```

---

## 12. Testing Strategy

### 12.1. Piramida Testing

```
              ┌───────────┐
              │    E2E    │  ← Playwright (critical paths)
              │  (sedikit) │
            ┌─┴───────────┴─┐
            │  Integration   │  ← Vitest + MSW (API mocking)
            │   (sedang)     │
          ┌─┴───────────────┴─┐
          │     Unit Tests     │  ← Vitest + Testing Library
          │    (banyak)        │
          └────────────────────┘
```

### 12.2. Yang Wajib Ditest

| Area                                | Tipe Test   | Contoh                                                  |
| ----------------------------------- | ----------- | ------------------------------------------------------- |
| **Zod schemas**                     | Unit        | Validasi NIK 16 digit, nominal non-negatif              |
| **Utility functions**               | Unit        | formatRupiah, hitungUmur, generateNomorSurat            |
| **Hooks (query)**                   | Integration | useKasBulanan mengembalikan data yang benar             |
| **Form submission**                 | Integration | Submit jimpitan → mutation terpanggil dengan data benar |
| **Auth guard**                      | Integration | Role ronda tidak bisa akses /admin                      |
| **Login → input jimpitan → logout** | E2E         | Critical path petugas ronda                             |
| **Admin CRUD warga**                | E2E         | Tambah, edit, nonaktifkan warga                         |
| **Laporan keuangan**                | E2E         | Generate PDF, verifikasi angka                          |

---

## 13. Deployment & CI/CD

### 13.1. Environment

| Env             | URL                        | Database                    | Kegunaan          |
| --------------- | -------------------------- | --------------------------- | ----------------- |
| **Development** | `localhost:5173`           | Supabase local (Docker)     | Development lokal |
| **Staging**     | `staging.sirt-wonoyoso.id` | Supabase project staging    | Review & testing  |
| **Production**  | `sirt-wonoyoso.id`         | Supabase project production | Live              |

### 13.2. CI/CD Pipeline (GitHub Actions)

```
Push ke branch ──► Lint + Type Check ──► Unit Test ──► Build
                                                        │
Pull Request ──► Preview Deploy (Vercel) ──────────────►│
                                                        │
Merge ke main ──► E2E Test (Playwright) ──► Deploy Production
```

### 13.3. Database Migration

```
Migrasi schema menggunakan Supabase CLI:
  supabase db diff        → Generate migration SQL
  supabase db push        → Apply ke remote
  supabase db reset       → Reset local (development only)

Setiap perubahan schema HARUS melalui migration file,
TIDAK boleh edit langsung via Supabase Dashboard di production.
```

---

## 14. Performa & Optimasi

### 14.1. Target Performa

| Metrik                             | Target             | Pengukuran |
| ---------------------------------- | ------------------ | ---------- |
| **LCP** (Largest Contentful Paint) | < 2.5 detik        | Lighthouse |
| **FID** (First Input Delay)        | < 100 ms           | Lighthouse |
| **CLS** (Cumulative Layout Shift)  | < 0.1              | Lighthouse |
| **TTI** (Time to Interactive)      | < 3 detik (3G)     | Lighthouse |
| **Bundle size (initial)**          | < 150 KB (gzipped) | Vite build |

### 14.2. Strategi Optimasi

- **Code splitting:** Lazy load route per modul (`React.lazy` + `Suspense`)
- **Image optimization:** WebP format, lazy loading, responsive sizes
- **Query optimization:** Pagination server-side (limit 20 per page), select hanya kolom yang dibutuhkan
- **Virtualization:** Gunakan `@tanstack/react-virtual` untuk daftar panjang (> 50 item)
- **Debounce search:** 300ms debounce pada input pencarian
- **Prefetch:** Prefetch route admin saat hover di sidebar

---

## 15. Accessibility (a11y)

### 15.1. Standar Minimum

- **WCAG 2.1 Level AA** compliance
- Kontras warna minimum **4.5:1** (teks normal) dan **3:1** (teks besar)
- Semua form input memiliki `<label>` yang terhubung
- Semua gambar memiliki `alt` text
- Keyboard navigable (tab order, focus visible, Enter/Space untuk aksi)
- `aria-label` pada icon-only button (FAB, close button)
- Skip-to-content link untuk screen reader
- Role dan aria attributes pada komponen custom (modal, dropdown, tab)

### 15.2. Pertimbangan Khusus

- **Lansia:** Font minimum 14px, tombol minimum 44x44px (touch target), spacing longgar
- **Low-bandwidth:** App tetap fungsional di 3G (PWA, small bundle)
- **Low-literacy:** Gunakan icon + teks (bukan teks saja) untuk navigasi utama

---

## 16. UI Architecture — shadcn/ui

### 16.1. Mengapa shadcn/ui

shadcn/ui bukan library yang di-install sebagai dependency — melainkan koleksi komponen yang di-_copy_ langsung ke project. Ini memberikan:

- **Full ownership:** Kode komponen ada di repo, bisa dimodifikasi bebas tanpa fork library.
- **Radix UI primitives:** Aksesibilitas bawaan (keyboard nav, screen reader, focus management) — sesuai kebutuhan warga lansia.
- **Tailwind native:** Styling konsisten dengan design token yang sudah didefinisikan.
- **Tree-shakable:** Hanya komponen yang dipakai yang masuk bundle.

### 16.2. Setup & Inisialisasi

```bash
# Inisialisasi shadcn/ui (satu kali)
npx shadcn@latest init

# Pilih konfigurasi:
# ✔ Style:             Default
# ✔ Base color:        Slate
# ✔ CSS variables:     Yes (untuk dark mode & theming)
# ✔ Tailwind config:   tailwind.config.ts
# ✔ Components path:   src/components/ui
# ✔ Utils path:        src/shared/lib/utils.ts

# Install komponen yang dibutuhkan
npx shadcn@latest add button input label card table badge     \
  dialog alert-dialog sheet dropdown-menu select tabs         \
  calendar popover command toast skeleton separator avatar     \
  tooltip form alert
```

### 16.3. Konfigurasi Warna (components.json)

shadcn/ui menggunakan CSS variables yang di-map ke tema modul SIRT:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/shared/lib/utils"
  }
}
```

### 16.4. CSS Variables Override (globals.css)

```css
@layer base {
  :root {
    /* shadcn default yang di-override untuk SIRT */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --primary: 160 84% 39.4%; /* emerald-600 — warna utama SIRT */
    --primary-foreground: 0 0% 100%;

    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --destructive: 347 77% 50%; /* rose-600 — hapus/bahaya */
    --destructive-foreground: 0 0% 100%;

    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 160 84% 39.4%; /* emerald-600 — focus ring */

    --radius: 0.75rem; /* rounded-xl default */
  }
}
```

### 16.5. Pemetaan Komponen shadcn → Fitur SIRT

| shadcn Component       | Penggunaan di SIRT                                                      |
| ---------------------- | ----------------------------------------------------------------------- |
| **Button**             | Semua CTA: Simpan, Bayar, Ajukan Surat, Hapus                           |
| **Input + Label**      | Form warga, keuangan, pencarian                                         |
| **Card**               | Stat card (saldo, ringkasan), rumah card, pengumuman                    |
| **Table**              | Data warga, rekap kas, jimpitan, audit log                              |
| **Dialog**             | Form edit dalam modal (desktop)                                         |
| **AlertDialog**        | Konfirmasi hapus, nonaktifkan warga                                     |
| **Sheet**              | Bottom sheet input jimpitan (mobile), side panel filter (desktop)       |
| **Select**             | Pilih bulan/tahun, status hunian, jenis surat, **tipe kas (Bapak/Ibu)** |
| **Tabs**               | Tab "Kas Bapak" / "Kas Ibu" di halaman keuangan, tab per modul          |
| **Badge**              | Status: Lunas/Belum, Diajukan/Diproses/Selesai, Diambil/Kosong          |
| **Calendar + Popover** | Date picker tanggal lahir, tanggal bayar                                |
| **Command**            | Quick search warga/rumah (Ctrl+K)                                       |
| **Toast** (Sonner)     | Notifikasi berhasil/gagal, offline sync                                 |
| **Skeleton**           | Loading state semua halaman                                             |
| **Avatar**             | Foto/inisial warga di tabel dan card                                    |
| **Tooltip**            | Tooltip icon-only button di toolbar admin                               |
| **Form**               | Integrasi React Hook Form — validasi & error message                    |
| **DropdownMenu**       | Menu aksi per baris tabel (Edit, Hapus, Lihat Detail)                   |
| **Separator**          | Pemisah section dalam form/card                                         |
| **Alert**              | Info banner: periode ronda aktif, pengumuman penting                    |

### 16.6. Komponen Komposit (Custom)

Komponen yang dibangun dari gabungan shadcn primitives, disimpan di `src/shared/components/`:

```typescript
// DataTable — gabungan Table + pagination + sort + filter
// Digunakan di semua halaman admin
<DataTable
  columns={kasColumns}
  data={kasBulanan}
  filterColumn="no_rumah"
  filterPlaceholder="Cari no rumah..."
/>

// StatCard — gabungan Card + icon + angka
<StatCard
  title="Saldo Kas Bapak"
  value={formatRupiah(saldoBapak)}
  icon={Wallet}
  trend="+12% dari bulan lalu"
  color="emerald"
/>

// PageHeader — judul halaman + breadcrumb + aksi
<PageHeader
  title="Kas Bulanan Ibu-Ibu"
  breadcrumb={['Admin', 'Keuangan', 'Kas Ibu']}
  actions={<Button>Tambah Pembayaran</Button>}
/>

// EmptyState — ilustrasi + teks + CTA
<EmptyState
  icon={FileX}
  title="Belum ada data kas ibu-ibu"
  description="Tambahkan pembayaran pertama untuk bulan ini"
  action={<Button>Tambah Kas</Button>}
/>

// KasTabView — Tabs Bapak/Ibu yang membungkus DataTable kas
<Tabs defaultValue="bapak">
  <TabsList>
    <TabsTrigger value="bapak">Kas Bapak</TabsTrigger>
    <TabsTrigger value="ibu">Kas Ibu</TabsTrigger>
  </TabsList>
  <TabsContent value="bapak"><KasTable tipeKas="Bapak" /></TabsContent>
  <TabsContent value="ibu"><KasTable tipeKas="Ibu" /></TabsContent>
</Tabs>
```

### 16.7. Aturan Penggunaan

1. **Jangan edit file di `components/ui/` secara langsung** kecuali untuk override warna/variant. Ini memudahkan update shadcn di masa depan (`npx shadcn@latest diff`).
2. **Buat komponen komposit di `shared/components/`** jika menggabungkan 2+ shadcn primitives.
3. **Variant warna per modul** — tambahkan variant custom di `button.tsx` jika perlu:
   ```typescript
   // Contoh: variant untuk modul keuangan
   const buttonVariants = cva("...", {
     variants: {
       variant: {
         default: "bg-primary ...",
         kas: "bg-emerald-600 hover:bg-emerald-700 text-white",
         ronda: "bg-amber-500 hover:bg-amber-600 text-white",
         surat: "bg-violet-600 hover:bg-violet-700 text-white",
       },
     },
   });
   ```
4. **Gunakan `<Sheet>` di mobile, `<Dialog>` di desktop** — deteksi via `useMediaQuery`:
   ```typescript
   const isMobile = useMediaQuery("(max-width: 768px)");
   const FormWrapper = isMobile ? Sheet : Dialog;
   ```

---

## 17. Konfigurasi Lingkungan

### 17.1. Environment Variables

```env
# .env.local (TIDAK di-commit ke git)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# .env.staging
VITE_SUPABASE_URL=https://staging-xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_ENABLE_DEV_TOOLS=true

# .env.production
VITE_SUPABASE_URL=https://prod-xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_ENABLE_DEV_TOOLS=false
```

### 17.2. Konfigurasi RT (Bisa Diubah via Admin Panel)

```typescript
// Disimpan di tabel `konfigurasi_rt` atau hardcode di constants
const RT_CONFIG = {
  nama_rt: "RT 001 RW 009",
  nama_desa: "Wonoyoso",
  kecamatan: "Pringapus",
  kabupaten: "Semarang",
  provinsi: "Jawa Tengah",
  nama_ketua_rt: "Bapak ...",
  nominal_kas_bulanan_bapak: 10_000, // Rp 10.000 per bulan
  nominal_kas_bulanan_ibu: 5_000, // Rp 5.000 per bulan
  nominal_jimpitan_default: 500, // Rp 500 default
  jam_ronda_mulai: "22:00",
  jam_ronda_selesai: "05:00",
  max_anggota_ronda_per_hari: 4,
};
```
