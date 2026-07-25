import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import {
  fetchSuratList,
  createSurat,
  updateSuratStatus,
  deleteSurat,
  type CreateSuratInput,
} from "./services";
import { toast } from "sonner";

export function useSuratList(status?: string) {
  return useQuery({
    queryKey: queryKeys.surat.list({ status }),
    queryFn: () => fetchSuratList(status),
  });
}

export function useCreateSurat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSuratInput) => createSurat(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.surat.all });
      toast.success("Surat pengantar berhasil dibuat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSuratStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      status: string;
      catatan_admin?: string;
      diproses_oleh?: string;
    }) => updateSuratStatus(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.surat.all });
      toast.success("Status surat berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSurat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSurat(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.surat.all });
      toast.success("Surat berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
