// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { MutationInput } from "@/shared/lib/mutation-registry";
import { useOfflineStore } from "@/shared/stores/offline-store";
import { useOfflineMutation } from "./offline-mutation";

const mocks = vi.hoisted(() => {
  const storage = new Map<string, string>();
  return {
    storage,
    memoryStorage: {
      getItem: (name: string) => storage.get(name) ?? null,
      setItem: (name: string, value: string) => {
        storage.set(name, value);
      },
      removeItem: (name: string) => {
        storage.delete(name);
      },
    },
    toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
    queryClient: { invalidateQueries: vi.fn() },
  };
});

vi.mock("@/shared/lib/idb-storage", () => ({
  idbStorage: mocks.memoryStorage,
}));
vi.mock("@/shared/lib/query-client", () => ({
  queryClient: mocks.queryClient,
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/shared/lib/mutation-registry", () => ({
  mutationRegistry: {},
  runMutation: vi.fn(),
}));

const kasVariables = {
  rumah_id: "rumah-1",
  tipe_kas: "Bapak",
  bulan: 1,
  tahun: 2030,
  jumlah: 10000,
  status_bayar: true,
  tanggal_bayar: "2026-11-26",
  metode_bayar: null,
  keterangan: null,
  dicatat_oleh: "admin-1",
} as unknown as MutationInput<"kas:create">;

function setConnection(isOnline: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => isOnline,
  });
  onlineManager.setOnline(isOnline);
}

function renderOfflineMutation(options: {
  mutationFn: (variables: MutationInput<"kas:create">) => Promise<unknown>;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    () =>
      useOfflineMutation({
        offlineKey: "kas:create",
        queryKeyToInvalidate: ["kas"],
        ...options,
      }),
    { wrapper }
  );
  return { ...hook, invalidateSpy };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.storage.clear();
  useOfflineStore.setState({ pendingActions: [], isSyncing: false });
  setConnection(true);
});

describe("useOfflineMutation", () => {
  it("mengantrekan mutation saat offline tanpa memanggil server", async () => {
    setConnection(false);
    const serverCreate = vi.fn(async () => ({ id: "kas-1" }));
    const { result } = renderOfflineMutation({ mutationFn: serverCreate });

    await act(async () => {
      result.current.mutate(kasVariables);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isPaused).toBe(false);
    expect(serverCreate).not.toHaveBeenCalled();
    expect(useOfflineStore.getState().pendingActions).toHaveLength(1);

    const [action] = useOfflineStore.getState().pendingActions;
    expect(action!.mutationKey).toBe("kas:create");
    expect(action!.variables).toEqual(kasVariables);
    expect(action!.queryKeyToInvalidate).toEqual(["kas"]);
    expect(mocks.toast.info).toHaveBeenCalledWith(
      "Data disimpan offline, akan disinkronkan saat online"
    );
  });

  it("mengirim langsung dan invalidasi query saat online", async () => {
    const serverCreate = vi.fn(async () => ({ id: "kas-1" }));
    const onSuccess = vi.fn();
    const { result, invalidateSpy } = renderOfflineMutation({
      mutationFn: serverCreate,
      onSuccess,
    });

    await act(async () => {
      result.current.mutate(kasVariables);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(serverCreate).toHaveBeenCalledWith(kasVariables);
    expect(useOfflineStore.getState().pendingActions).toHaveLength(0);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["kas"] });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mocks.toast.info).not.toHaveBeenCalled();
  });

  it("tetap memanggil onSuccess per-panggilan saat offline, tanpa onSuccess hook", async () => {
    setConnection(false);
    const serverCreate = vi.fn(async () => ({ id: "kas-1" }));
    const hookOnSuccess = vi.fn();
    const mutateOnSuccess = vi.fn();
    const { result } = renderOfflineMutation({
      mutationFn: serverCreate,
      onSuccess: hookOnSuccess,
    });

    await act(async () => {
      result.current.mutate(kasVariables, { onSuccess: mutateOnSuccess });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mutateOnSuccess).toHaveBeenCalledTimes(1);
    expect(hookOnSuccess).not.toHaveBeenCalled();
  });

  it("meneruskan error server tanpa mengantrekan", async () => {
    const serverCreate = vi.fn(async () => {
      throw new Error("server menolak");
    });
    const onError = vi.fn();
    const { result, invalidateSpy } = renderOfflineMutation({
      mutationFn: serverCreate,
      onError,
    });

    await act(async () => {
      result.current.mutate(kasVariables);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(useOfflineStore.getState().pendingActions).toHaveLength(0);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
