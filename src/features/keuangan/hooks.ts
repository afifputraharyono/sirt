import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import type { TipeKas } from "@/shared/types/database";
import {
  fetchKasByMonth,
  createKas,
  updateKas,
  deleteKas,
  fetchJimpitanByDate,
  fetchJimpitanSummary,
  createJimpitan,
  deleteJimpitan,
  fetchPengeluaran,
  createPengeluaran,
  updatePengeluaran,
  deletePengeluaran,
  fetchSaldoKas,
  type CreateKasInput,
  type CreateJimpitanInput,
  type CreatePengeluaranInput,
} from "./services";
import { toast } from "sonner";

export function useKasByMonth(tipe: TipeKas, bulan: number, tahun: number) {
  return useQuery({
    queryKey: queryKeys.kas.byMonth(tipe, bulan, tahun),
    queryFn: () => fetchKasByMonth(tipe, bulan, tahun),
  });
}

export function useCreateKas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKasInput) => createKas(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Pembayaran kas berhasil dicatat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateKas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<CreateKasInput> & { id: string }) =>
      updateKas(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Data kas berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteKas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteKas(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Data kas berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useJimpitanByDate(tanggal: string) {
  return useQuery({
    queryKey: queryKeys.jimpitan.byDate(tanggal),
    queryFn: () => fetchJimpitanByDate(tanggal),
    enabled: !!tanggal,
  });
}

export function useJimpitanSummary(bulan: number, tahun: number) {
  return useQuery({
    queryKey: queryKeys.jimpitan.summary(bulan, tahun),
    queryFn: () => fetchJimpitanSummary(bulan, tahun),
  });
}

export function useCreateJimpitan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJimpitanInput) => createJimpitan(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jimpitan.all });
      toast.success("Jimpitan berhasil dicatat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteJimpitan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJimpitan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jimpitan.all });
      toast.success("Data jimpitan berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePengeluaran(bulan: number, tahun: number) {
  return useQuery({
    queryKey: [...queryKeys.kas.all, "pengeluaran", bulan, tahun],
    queryFn: () => fetchPengeluaran(bulan, tahun),
  });
}

export function useCreatePengeluaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePengeluaranInput) => createPengeluaran(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Pengeluaran berhasil dicatat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePengeluaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<CreatePengeluaranInput> & { id: string }) =>
      updatePengeluaran(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Pengeluaran berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePengeluaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePengeluaran(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Pengeluaran berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSaldoKas() {
  return useQuery({
    queryKey: queryKeys.kas.saldo(),
    queryFn: fetchSaldoKas,
  });
}
