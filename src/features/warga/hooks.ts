import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import {
  fetchRumahList,
  fetchRumahDetail,
  createRumah,
  updateRumah,
  deleteRumah,
  createWarga,
  updateWarga,
  deleteWarga,
  type CreateRumahInput,
  type CreateWargaInput,
} from "./services";
import { toast } from "sonner";

export function useRumahList() {
  return useQuery({
    queryKey: queryKeys.warga.lists(),
    queryFn: fetchRumahList,
  });
}

export function useRumahDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.warga.detail(id),
    queryFn: () => fetchRumahDetail(id),
    enabled: !!id,
  });
}

export function useCreateRumah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRumahInput) => createRumah(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Rumah berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateRumah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<CreateRumahInput> & { id: string }) =>
      updateRumah(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Data rumah berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteRumah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRumah(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Rumah berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateWarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWargaInput) => createWarga(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Warga berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateWarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<CreateWargaInput> & { id: string }) =>
      updateWarga(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Data warga berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteWarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWarga(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Warga berhasil dinonaktifkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
