import { format } from "date-fns";
import { id } from "date-fns/locale";

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(date: string | Date): string {
  return format(new Date(date), "d MMMM yyyy", { locale: id });
}

export function formatTanggalPendek(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy", { locale: id });
}

export function hitungUmur(tanggalLahir: string | Date): number {
  const birth = new Date(tanggalLahir);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
