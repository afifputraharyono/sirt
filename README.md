# SIRT Wonoyoso

Sistem Informasi RT 001 RW 009 Kelurahan Wonoyoso, Kecamatan Pringapus, Kabupaten Semarang. Aplikasi web PWA untuk digitalisasi administrasi RT meliputi pengelolaan warga, keuangan, ronda malam, surat pengantar, pengumuman, dan inventaris.

## Fitur

- **Data Warga** — Kelola data rumah (KK) dan warga per rumah
- **Keuangan** — Kas bulanan (bapak/ibu), jimpitan harian, pengeluaran, dan laporan saldo
- **Ronda Malam** — Jadwal ronda, input jimpitan malam dengan mode tap cepat
- **Surat Pengantar** — Pengajuan dan cetak surat pengantar warga
- **Pengumuman** — Buat dan publikasikan pengumuman RT
- **Inventaris** — Catat aset dan inventaris RT
- **Offline-First** — Data jimpitan bisa diinput saat offline, otomatis sync saat online
- **PWA** — Installable, bisa digunakan seperti aplikasi native

## Tech Stack

| Layer     | Teknologi                                       |
| --------- | ----------------------------------------------- |
| Framework | React 19, TypeScript 7                          |
| Routing   | React Router v7                                 |
| Styling   | Tailwind CSS v4, shadcn/ui (Radix UI)           |
| State     | TanStack Query v5 (server), Zustand v5 (client) |
| Backend   | Supabase (PostgreSQL, Auth, RLS)                |
| PWA       | vite-plugin-pwa, Workbox                        |
| Offline   | IndexedDB (idb-keyval), custom sync queue       |
| Build     | Vite 8                                          |
| CI/CD     | GitHub Actions → Netlify                        |

## Prasyarat

- Node.js >= 20
- npm >= 10
- Supabase project (untuk backend)

## Setup Lokal

```bash
# Clone repo
git clone https://github.com/<username>/sirt.git
cd sirt

# Install dependencies
npm install --legacy-peer-deps

# Konfigurasi environment
cp .env.local.example .env.local
# Edit .env.local dan isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY

# Jalankan development server
npm run dev
```

## Environment Variables

| Variable                 | Keterangan               |
| ------------------------ | ------------------------ |
| `VITE_SUPABASE_URL`      | URL project Supabase     |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key Supabase |

## Scripts

| Command           | Keterangan                     |
| ----------------- | ------------------------------ |
| `npm run dev`     | Jalankan dev server            |
| `npm run build`   | Type check + production build  |
| `npm run preview` | Preview production build lokal |
| `npm run lint`    | Jalankan ESLint                |

## Struktur Folder

```
src/
├── app/
│   ├── routes/          # Halaman (lazy-loaded)
│   ├── router.tsx       # Konfigurasi routing
│   └── App.tsx          # Root component + providers
├── features/
│   ├── auth/            # Autentikasi (store, guard, hooks)
│   ├── keuangan/        # Kas, jimpitan, pengeluaran
│   ├── warga/           # Data rumah dan warga
│   ├── ronda/           # Jadwal dan periode ronda
│   ├── surat/           # Surat pengantar
│   ├── pengumuman/      # Pengumuman RT
│   ├── inventaris/      # Inventaris aset
│   └── public/          # Halaman publik (tanpa login)
├── shared/
│   ├── lib/             # Supabase client, query client, utilities
│   ├── hooks/           # Shared hooks (online status, theme, SW)
│   ├── stores/          # Zustand stores (offline queue)
│   ├── components/      # Shared UI components
│   ├── types/           # TypeScript interfaces (database schema)
│   └── utils/           # Format helpers (rupiah, tanggal)
├── components/ui/       # shadcn/ui primitives
└── styles/              # Global CSS + Tailwind
```

## Role & Akses

| Role       | Akses                                      |
| ---------- | ------------------------------------------ |
| **Public** | Beranda, jadwal ronda, pengumuman          |
| **Ronda**  | Input jimpitan malam, lihat jadwal         |
| **Admin**  | Semua fitur + dashboard + pengelolaan data |

## Deploy

CI/CD menggunakan GitHub Actions. Setiap push ke `main` otomatis:

1. Type check (`tsc --noEmit`)
2. Build (`vite build`)
3. Deploy ke Netlify

Pull request mendapat preview deploy tersendiri.

## Supabase

Migrations tersedia di `supabase/migrations/`. Untuk menjalankan migrasi lokal:

```bash
npx supabase db push
```

## Lisensi

Private — Hak cipta RT 001 RW 009 Wonoyoso.
