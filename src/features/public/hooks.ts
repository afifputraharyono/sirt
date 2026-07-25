import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import { fetchJadwalRondaPublic, fetchStatistikRT } from "./services";

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
