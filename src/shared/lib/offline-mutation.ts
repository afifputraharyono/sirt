import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { useOfflineStore } from "@/shared/stores/offline-store";
import type { MutationInput, MutationKey } from "@/shared/lib/mutation-registry";

interface OfflineMutationOptions<K extends MutationKey, TData> {
  mutationFn: (variables: MutationInput<K>) => Promise<TData>;
  offlineKey: K;
  queryKeyToInvalidate: readonly unknown[];
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

const OFFLINE_MARKER = Symbol("offline-queued");

export function useOfflineMutation<K extends MutationKey, TData>(
  options: OfflineMutationOptions<K, TData>
) {
  const isOnline = useOnlineStatus();
  const addAction = useOfflineStore((s) => s.addAction);
  const qc = useQueryClient();

  const { offlineKey, queryKeyToInvalidate, onSuccess, onError } = options;

  return useMutation<TData, Error, MutationInput<K>>({
    mutationFn: async (variables: MutationInput<K>) => {
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
