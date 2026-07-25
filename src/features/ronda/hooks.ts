import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import {
  fetchPeriodeList,
  fetchActivePeriode,
  createPeriode,
  fetchJadwalByPeriode,
  createJadwal,
  createJadwalBatch,
  deleteJadwal,
} from "./services";
import type { JadwalRonda } from "@/shared/types/database";
import { toast } from "sonner";

export function usePeriodeList() {
  return useQuery({
    queryKey: [...queryKeys.ronda.all, "periode-list"],
    queryFn: fetchPeriodeList,
  });
}

export function useActivePeriode() {
  return useQuery({
    queryKey: [...queryKeys.ronda.all, "active-periode"],
    queryFn: fetchActivePeriode,
  });
}

export function useCreatePeriode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPeriode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ronda.all });
      toast.success("Periode ronda berhasil dibuat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useJadwalByPeriode(periodeId: string) {
  return useQuery({
    queryKey: queryKeys.ronda.periode(periodeId),
    queryFn: () => fetchJadwalByPeriode(periodeId),
    enabled: !!periodeId,
  });
}

export function useCreateJadwal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Pick<JadwalRonda, "periode_id" | "hari" | "warga_id" | "urutan">
    ) => createJadwal(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ronda.all });
      toast.success("Jadwal ronda berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateJadwalBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createJadwalBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ronda.all });
      toast.success("Jadwal ronda berhasil dibuat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteJadwal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJadwal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ronda.all });
      toast.success("Jadwal berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
