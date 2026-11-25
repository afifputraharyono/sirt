export interface PeriodeHunianRingkas {
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  tunggakan_dialihkan: boolean;
}

export function indeksBulanHunian(tahun: number, bulan: number): number {
  return tahun * 12 + (bulan - 1);
}

function indeksDariTanggal(value: string): number | null {
  const [tahun, bulan] = value.slice(0, 7).split("-").map(Number);
  if (!tahun || !bulan) return null;
  return indeksBulanHunian(tahun, bulan);
}

// Bulan mulai hunian ikut ditagih; bulan tanggal kosong tidak ditagih.
export function periodeMenutupiBulan(
  periode: PeriodeHunianRingkas,
  tahun: number,
  bulan: number
): boolean {
  const indeks = indeksBulanHunian(tahun, bulan);
  const mulai = indeksDariTanggal(periode.tanggal_mulai);
  if (mulai === null || indeks < mulai) return false;
  const selesai = periode.tanggal_selesai
    ? indeksDariTanggal(periode.tanggal_selesai)
    : null;
  return selesai === null || indeks < selesai;
}

export function terhuniPada(
  periodeList: PeriodeHunianRingkas[],
  tahun: number,
  bulan: number
): boolean {
  return periodeList.some((p) => periodeMenutupiBulan(p, tahun, bulan));
}

// Bila periode terbuka terbaru tidak mengalihkan tunggakan, kewajiban
// sebelum bulan mulai hunian itu tidak ditagih lagi.
export function batasBawahTunggakan(
  periodeList: PeriodeHunianRingkas[]
): number | null {
  const terbuka = periodeList.find((p) => p.tanggal_selesai === null);
  if (!terbuka || terbuka.tunggakan_dialihkan) return null;
  return indeksDariTanggal(terbuka.tanggal_mulai);
}
