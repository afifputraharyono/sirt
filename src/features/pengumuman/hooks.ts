import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import {
  fetchPengumumanList,
  fetchPengumumanActive,
  createPengumuman,
  updatePengumuman,
  deletePengumuman,
  type CreatePengumumanInput,
} from "./services";
import { toast } from "sonner";

export function usePengumumanList() {
  return useQuery({
    queryKey: queryKeys.pengumuman.all,
    queryFn: fetchPengumumanList,
  });
}

export function usePengumumanActive() {
  return useQuery({
    queryKey: queryKeys.pengumuman.active(),
    queryFn: fetchPengumumanActive,
  });
}

export function useCreatePengumuman() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePengumumanInput) => createPengumuman(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pengumuman.all });
      toast.success("Pengumuman berhasil dibuat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePengumuman() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<CreatePengumumanInput> & { id: string }) =>
      updatePengumuman(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pengumuman.all });
      toast.success("Pengumuman berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePengumuman() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePengumuman(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pengumuman.all });
      toast.success("Pengumuman berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
