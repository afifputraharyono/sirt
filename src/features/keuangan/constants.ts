import type { KategoriPengeluaran } from "@/shared/types/database";

export const BULAN_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const KATEGORI_PENGELUARAN: KategoriPengeluaran[] = [
  "Operasional",
  "Keamanan",
  "Kebersihan",
  "Sosial",
  "Pembangunan",
  "Kegiatan",
  "Lainnya",
];

export const METODE_BAYAR = ["Cash", "Transfer"] as const;

export const SELECT_CLASS =
  "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";
