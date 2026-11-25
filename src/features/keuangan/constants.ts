import type { KategoriPengeluaran } from "@/shared/types/database";

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

export const CHIP_PAID_KAS =
  "flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10.5px] font-bold text-emerald-600 transition-transform active:scale-95 dark:text-emerald-400";
export const CHIP_PAID_ARISAN =
  "flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-1 text-[10.5px] font-bold text-violet-600 transition-transform active:scale-95 dark:text-violet-400";
export const CHIP_UNPAID =
  "flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/5 px-2 py-1 text-[10.5px] font-bold text-amber-600 transition-transform active:scale-95 dark:text-amber-400";
export const CHIP_MUTED =
  "flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10.5px] font-semibold text-muted-foreground";
