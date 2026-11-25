import type { TipeKas } from "@/shared/types/database";

export const queryKeys = {
  warga: {
    all: ["warga"] as const,
    lists: () => [...queryKeys.warga.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.warga.lists(), filters] as const,
    details: () => [...queryKeys.warga.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.warga.details(), id] as const,
    me: () => [...queryKeys.warga.all, "me"] as const,
    myKas: (rumahId: string, tahun: number) =>
      [...queryKeys.warga.all, "me", "kas", rumahId, tahun] as const,
    accounts: () => [...queryKeys.warga.all, "accounts"] as const,
    hunian: () => [...queryKeys.warga.all, "hunian"] as const,
  },
  kas: {
    all: ["kas"] as const,
    byType: (tipe: TipeKas) => [...queryKeys.kas.all, tipe] as const,
    byMonth: (tipe: TipeKas, bulan: number, tahun: number) =>
      [...queryKeys.kas.byType(tipe), bulan, tahun] as const,
    saldo: () => [...queryKeys.kas.all, "saldo"] as const,
    saldoByType: (tipe: TipeKas) =>
      [...queryKeys.kas.all, "saldo", tipe] as const,
  },
  arisan: {
    all: ["kas", "arisan"] as const,
    rekap: (tahun?: number) =>
      ["kas", "arisan", "rekap", tahun ?? "all"] as const,
    ronde: () => ["kas", "arisan", "ronde"] as const,
    anggota: (rondeId: string) =>
      ["kas", "arisan", "anggota", rondeId] as const,
  },
  jimpitan: {
    all: ["jimpitan"] as const,
    byDate: (tanggal: string) =>
      [...queryKeys.jimpitan.all, tanggal] as const,
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
    list: (filters: Record<string, unknown>) =>
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
  public: {
    all: ["public"] as const,
    rondeAktif: () => [...queryKeys.public.all, "ronde-aktif"] as const,
    tagihan: (noRumah: string, tahun: number) =>
      [...queryKeys.public.all, "tagihan", noRumah, tahun] as const,
  },
} as const;
