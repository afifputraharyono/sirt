import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import { useOfflineMutation } from "@/shared/lib/offline-mutation";
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
  updateJimpitan,
  upsertJimpitanBatch,
  lockJimpitanByDate,
  unlockJimpitanByDate,
  fetchPengeluaran,
  fetchPengeluaranByRange,
  createPengeluaran,
  updatePengeluaran,
  deletePengeluaran,
  fetchGrupPengeluaran,
  createGrupPengeluaran,
  updateGrupPengeluaran,
  deleteGrupPengeluaran,
  fetchKasByRange,
  fetchJimpitanByRange,
  fetchSaldoKas,
  type CreateKasInput,
  type CreateJimpitanInput,
  type CreatePengeluaranInput,
  type UpdateJimpitanInput,
  type CreateGrupInput,
} from "./services";
import { toast } from "sonner";

export function useKasByMonth(tipe: TipeKas, bulan: number, tahun: number) {
  return useQuery({
    queryKey: queryKeys.kas.byMonth(tipe, bulan, tahun),
    queryFn: () => fetchKasByMonth(tipe, bulan, tahun),
  });
}

export function useCreateKas() {
  return useOfflineMutation({
    offlineKey: "kas:create",
    mutationFn: (input: CreateKasInput) => createKas(input),
    queryKeyToInvalidate: queryKeys.kas.all,
    onSuccess: () => {
      toast.success("Pembayaran kas berhasil dicatat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateKas() {
  return useOfflineMutation({
    offlineKey: "kas:update",
    mutationFn: ({ id, ...input }: Partial<CreateKasInput> & { id: string }) =>
      updateKas(id, input),
    queryKeyToInvalidate: queryKeys.kas.all,
    onSuccess: () => {
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
  return useOfflineMutation({
    offlineKey: "jimpitan:create",
    mutationFn: (input: CreateJimpitanInput) => createJimpitan(input),
    queryKeyToInvalidate: queryKeys.jimpitan.all,
    onSuccess: () => {
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

export function useUpdateJimpitan() {
  return useOfflineMutation({
    offlineKey: "jimpitan:update",
    mutationFn: ({ id, ...input }: UpdateJimpitanInput & { id: string }) =>
      updateJimpitan(id, input),
    queryKeyToInvalidate: queryKeys.jimpitan.all,
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpsertJimpitanBatch() {
  return useOfflineMutation({
    offlineKey: "jimpitan:upsert-batch",
    mutationFn: (items: CreateJimpitanInput[]) => upsertJimpitanBatch(items),
    queryKeyToInvalidate: queryKeys.jimpitan.all,
    onSuccess: () => {
      toast.success("Jimpitan berhasil digenerate");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useLockJimpitan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tanggal, userId }: { tanggal: string; userId: string }) =>
      lockJimpitanByDate(tanggal, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jimpitan.all });
      toast.success("Sesi jimpitan dikunci");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUnlockJimpitan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tanggal: string) => unlockJimpitanByDate(tanggal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jimpitan.all });
      toast.success("Sesi jimpitan dibuka kembali");
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

export function usePengeluaranByRange(from: string, to: string) {
  return useQuery({
    queryKey: [...queryKeys.kas.all, "pengeluaran-range", from, to],
    queryFn: () => fetchPengeluaranByRange(from, to),
    enabled: !!from && !!to,
  });
}

export function useCreatePengeluaran() {
  return useOfflineMutation({
    offlineKey: "pengeluaran:create",
    mutationFn: (input: CreatePengeluaranInput) => createPengeluaran(input),
    queryKeyToInvalidate: queryKeys.kas.all,
    onSuccess: () => {
      toast.success("Pengeluaran berhasil dicatat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePengeluaran() {
  return useOfflineMutation({
    offlineKey: "pengeluaran:update",
    mutationFn: ({
      id,
      ...input
    }: Partial<CreatePengeluaranInput> & { id: string }) =>
      updatePengeluaran(id, input),
    queryKeyToInvalidate: queryKeys.kas.all,
    onSuccess: () => {
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

// ==================== GRUP PENGELUARAN ====================

export function useGrupPengeluaran() {
  return useQuery({
    queryKey: [...queryKeys.kas.all, "grup-pengeluaran"],
    queryFn: fetchGrupPengeluaran,
  });
}

export function useCreateGrupPengeluaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGrupInput) => createGrupPengeluaran(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Grup pengeluaran berhasil dibuat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateGrupPengeluaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; nama?: string; tanggal?: string; catatan?: string }) =>
      updateGrupPengeluaran(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Grup pengeluaran berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteGrupPengeluaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGrupPengeluaran(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kas.all });
      toast.success("Grup pengeluaran berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ==================== DATE RANGE QUERIES ====================

export function useKasByRange(tipe: TipeKas, from: string, to: string) {
  return useQuery({
    queryKey: [...queryKeys.kas.all, "range", tipe, from, to],
    queryFn: () => fetchKasByRange(tipe, from, to),
    enabled: !!from && !!to,
  });
}

export function useJimpitanByRange(from: string, to: string) {
  return useQuery({
    queryKey: [...queryKeys.jimpitan.all, "range", from, to],
    queryFn: () => fetchJimpitanByRange(from, to),
    enabled: !!from && !!to,
  });
}
