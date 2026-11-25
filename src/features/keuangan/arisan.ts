import { CheckCircle2, Circle, Clock, type LucideIcon } from "lucide-react";
import type { ArisanRekap } from "@/shared/types/database";
import { BULAN_NAMES } from "./constants";

export type StatusKind = "belum-diundi" | "belum-disalurkan" | "sudah-disalurkan";

export function statusOf(row: ArisanRekap): StatusKind {
  if (!row.putaran_id) return "belum-diundi";
  if (!row.pengeluaran_id) return "belum-disalurkan";
  return "sudah-disalurkan";
}

export const STATUS_BADGE: Record<StatusKind, { label: string; className: string; Icon: LucideIcon }> = {
  "belum-diundi": { label: "Belum diundi", className: "bg-muted text-muted-foreground", Icon: Circle },
  "belum-disalurkan": { label: "Belum disalurkan", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400", Icon: Clock },
  "sudah-disalurkan": { label: "Sudah disalurkan", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", Icon: CheckCircle2 },
};

export interface PeriodeRonde {
  urutan: number;
  tahun: number;
  bulan: number;
  key: string;
  rekap: ArisanRekap | null;
}

export function kunciPeriode(tahun: number, bulan: number) {
  return `${tahun}-${String(bulan).padStart(2, "0")}`;
}

export function labelPeriode(tahun: number, bulan: number) {
  return `${BULAN_NAMES[bulan] ?? ""} ${tahun}`;
}

export function indeksPeriode(tahun: number, bulan: number) {
  return tahun * 12 + (bulan - 1);
}

export function parsePeriodeKey(key: string) {
  const [tahun = 0, bulan = 1] = key.split("-").map(Number);
  return { tahun, bulan };
}

export function buatPeriode(
  tanggalMulai: string,
  jumlahAnggota: number,
  rekapByPeriode: Map<string, ArisanRekap>,
): PeriodeRonde[] {
  if (jumlahAnggota <= 0) return [];
  const { tahun, bulan } = parsePeriodeKey(tanggalMulai.slice(0, 7));
  const awal = indeksPeriode(tahun, bulan);
  return Array.from({ length: jumlahAnggota }, (_, i) => {
    const indeks = awal + i;
    const tahunPeriode = Math.floor(indeks / 12);
    const bulanPeriode = (indeks % 12) + 1;
    const key = kunciPeriode(tahunPeriode, bulanPeriode);
    return {
      urutan: i + 1,
      tahun: tahunPeriode,
      bulan: bulanPeriode,
      key,
      rekap: rekapByPeriode.get(key) ?? null,
    };
  });
}
