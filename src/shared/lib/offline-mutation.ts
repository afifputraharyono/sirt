import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { useOfflineStore } from "@/shared/stores/offline-store";

interface OfflineMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  offlineKey: string;
  queryKeyToInvalidate: readonly unknown[];
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

const OFFLINE_MARKER = Symbol("offline-queued");

export function useOfflineMutation<TData, TVariables>(
  options: OfflineMutationOptions<TData, TVariables>
) {
  const isOnline = useOnlineStatus();
  const addAction = useOfflineStore((s) => s.addAction);
  const qc = useQueryClient();

  const { offlineKey, queryKeyToInvalidate, onSuccess, onError } = options;

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      if (!isOnline) {
        addAction({
          mutationKey: offlineKey,
          variables,
          queryKeyToInvalidate,
        });
        return { [OFFLINE_MARKER]: true } as unknown as TData;
      }
      return options.mutationFn(variables);
    },
    onSuccess: (data) => {
      if (
        data &&
        typeof data === "object" &&
        OFFLINE_MARKER in (data as object)
      ) {
        toast.info("Data disimpan offline, akan disinkronkan saat online");
        return;
      }
      qc.invalidateQueries({ queryKey: queryKeyToInvalidate });
      onSuccess?.();
    },
    onError,
  });
}
