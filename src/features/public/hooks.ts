import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import { fetchJadwalRondaPublic, fetchStatistikRT, fetchTagihanRumah } from "./services";

export function useJadwalRondaPublic(periodeId?: string) {
  return useQuery({
    queryKey: [...queryKeys.ronda.all, "public", periodeId ?? "active"],
    queryFn: () => fetchJadwalRondaPublic(periodeId),
  });
}

export function useStatistikRT() {
  return useQuery({
    queryKey: ["statistik-rt"],
    queryFn: fetchStatistikRT,
  });
}

export function useTagihanRumah(noRumah: string) {
  const tahun = new Date().getFullYear();
  const trimmed = noRumah.trim();
  return useQuery({
    queryKey: queryKeys.public.tagihan(trimmed, tahun),
    queryFn: () => fetchTagihanRumah(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 60_000,
  });
}
