import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { idbStorage } from "@/shared/lib/idb-storage";
import {
  mutationRegistry,
  runMutation,
  type MutationInput,
  type MutationKey,
} from "@/shared/lib/mutation-registry";
import { queryClient } from "@/shared/lib/query-client";

export type OfflineActionStatus = "pending" | "syncing" | "error";

export interface OfflineAction<K extends MutationKey = MutationKey> {
  id: string;
  mutationKey: K;
  variables: MutationInput<K>;
  queryKeyToInvalidate: readonly unknown[];
  timestamp: number;
  status: OfflineActionStatus;
  errorMessage?: string;
}

interface OfflineState {
  pendingActions: OfflineAction[];
  isSyncing: boolean;
  addAction: <K extends MutationKey>(
    action: Omit<OfflineAction<K>, "id" | "timestamp" | "status">
  ) => void;
  removeAction: (id: string) => void;
  updateActionVariables: <K extends MutationKey>(
    mutationKey: K,
    updater: (variables: MutationInput<K>) => MutationInput<K>
  ) => void;
  syncAll: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      pendingActions: [],
      isSyncing: false,

      addAction: (action) => {
        const newAction: OfflineAction = {
          ...action,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          status: "pending",
        };
        set((state) => ({
          pendingActions: [...state.pendingActions, newAction],
        }));
      },

      removeAction: (id) => {
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== id),
        }));
      },

      updateActionVariables: (mutationKey, updater) => {
        set((state) => ({
          pendingActions: state.pendingActions.map((a) =>
            a.mutationKey === mutationKey && a.status === "pending"
              ? {
                  ...a,
                  variables: updater(
                    a.variables as MutationInput<typeof mutationKey>
                  ),
                }
              : a
          ),
        }));
      },

      syncAll: async () => {
        const { pendingActions, isSyncing } = get();
        if (isSyncing || pendingActions.length === 0) return;

        set({ isSyncing: true });

        let syncedCount = 0;
        let failedCount = 0;
        const keysToInvalidate = new Set<string>();

        for (const action of pendingActions) {
          if (!(action.mutationKey in mutationRegistry)) {
            set((state) => ({
              pendingActions: state.pendingActions.map((a) =>
                a.id === action.id
                  ? {
                      ...a,
                      status: "error" as const,
                      errorMessage: `Handler tidak ditemukan: ${action.mutationKey}`,
                    }
                  : a
              ),
            }));
            failedCount++;
            continue;
          }

          set((state) => ({
            pendingActions: state.pendingActions.map((a) =>
              a.id === action.id ? { ...a, status: "syncing" as const } : a
            ),
          }));

          try {
            await runMutation(action.mutationKey, action.variables);
            set((state) => ({
              pendingActions: state.pendingActions.filter(
                (a) => a.id !== action.id
              ),
            }));
            keysToInvalidate.add(
              JSON.stringify(action.queryKeyToInvalidate)
            );
            syncedCount++;
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Gagal sinkronisasi";
            set((state) => ({
              pendingActions: state.pendingActions.map((a) =>
                a.id === action.id
                  ? { ...a, status: "error" as const, errorMessage: message }
                  : a
              ),
            }));
            failedCount++;
          }
        }

        for (const keyStr of keysToInvalidate) {
          const queryKey = JSON.parse(keyStr) as unknown[];
          queryClient.invalidateQueries({ queryKey });
        }

        set({ isSyncing: false });

        if (syncedCount > 0) {
          toast.success(
            `${syncedCount} data berhasil disinkronkan`
          );
        }
        if (failedCount > 0) {
          toast.error(
            `${failedCount} data gagal disinkronkan`
          );
        }
      },
    }),
    {
      name: "sirt-offline-queue",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        pendingActions: state.pendingActions,
      }),
    }
  )
);
