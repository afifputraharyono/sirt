import type {
  Agama,
  HubunganKeluarga,
  JenisKelamin,
  ModeJimpitan,
  StatusHunian,
  StatusPerkawinan,
} from "@/shared/types/database";

export const STATUS_HUNIAN: StatusHunian[] = ["Tetap", "Kontrak", "Kosong"];
export const MODE_JIMPITAN: ModeJimpitan[] = ["Harian", "Bulanan", "Bebas"];
export const JENIS_KELAMIN: JenisKelamin[] = ["L", "P"];
export const HUBUNGAN: HubunganKeluarga[] = [
  "Kepala Keluarga",
  "Istri",
  "Anak",
  "Orang Tua",
  "Mertua",
  "Menantu",
  "Cucu",
  "Famili Lain",
  "Lainnya",
];
export const AGAMA: Agama[] = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"];
export const STATUS_KAWIN: StatusPerkawinan[] = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];

export const SELECT_CLASS =
  "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";

export const HUNIAN_BADGE: Record<string, string> = {
  Tetap: "bg-primary/15 text-primary",
  Kontrak: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Kosong: "border border-border/60 text-muted-foreground",
};
