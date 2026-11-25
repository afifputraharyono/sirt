import type { TipeKas } from "@/shared/types/database";

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

export function labelTipeKas(tipe: TipeKas): string {
  if (tipe === "Bapak") return "Kas Bapak";
  if (tipe === "Ibu") return "Kas Ibu";
  return "Arisan";
}
