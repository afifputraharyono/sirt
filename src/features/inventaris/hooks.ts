import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import {
  fetchInventarisList,
  createInventaris,
  updateInventaris,
  deleteInventaris,
  type CreateInventarisInput,
} from "./services";
import { toast } from "sonner";

export function useInventarisList() {
  return useQuery({
    queryKey: queryKeys.inventaris.all,
    queryFn: fetchInventarisList,
  });
}

export function useCreateInventaris() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInventarisInput) => createInventaris(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventaris.all });
      toast.success("Barang berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateInventaris() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<CreateInventarisInput> & { id: string }) =>
      updateInventaris(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventaris.all });
      toast.success("Data barang berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteInventaris() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInventaris(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventaris.all });
      toast.success("Barang berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
