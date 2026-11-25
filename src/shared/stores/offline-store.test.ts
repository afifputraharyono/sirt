import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  MutationInput,
  MutationKey,
} from "@/shared/lib/mutation-registry";
import { useOfflineStore } from "./offline-store";

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
    okHandler: vi.fn(async () => ({ id: "kas-1" })),
    failHandler: vi.fn(async () => {
      throw new Error("server menolak");
    }),
    queryClient: { invalidateQueries: vi.fn() },
    toast: { success: vi.fn(), error: vi.fn() },
  };
});

vi.mock("@/shared/lib/idb-storage", () => ({
  idbStorage: mocks.memoryStorage,
}));
vi.mock("@/shared/lib/query-client", () => ({
  queryClient: mocks.queryClient,
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/shared/lib/mutation-registry", () => {
  const mutationRegistry: Record<
    string,
    (variables: unknown) => Promise<unknown>
  > = {
    "kas:create": mocks.okHandler,
    "jimpitan:create": mocks.failHandler,
  };
  return {
    mutationRegistry,
    runMutation: (key: string, variables: unknown) =>
      mutationRegistry[key]!(variables),
  };
});

const kasVariables = {
  rumah_id: "rumah-1",
  tipe_kas: "Bapak",
  bulan: 11,
  tahun: 2026,
  jumlah: 10000,
  status_bayar: "Lunas",
  tanggal_bayar: "2026-11-26",
} as unknown as MutationInput<"kas:create">;

function addKasAction() {
  useOfflineStore.getState().addAction({
    mutationKey: "kas:create",
    variables: { ...kasVariables },
    queryKeyToInvalidate: ["kas", "Bapak", 11, 2026],
  });
  const actions = useOfflineStore.getState().pendingActions;
  return actions[actions.length - 1]!;
}

function unknownKeyAction() {
  return {
    id: "tidak-dikenal-1",
    mutationKey: "tidak:dikenal" as unknown as MutationKey,
    variables: {} as never,
    queryKeyToInvalidate: [],
    timestamp: Date.now(),
    status: "pending" as const,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.storage.clear();
  useOfflineStore.setState({ pendingActions: [], isSyncing: false });
});

describe("addAction", () => {
  it("menambahkan aksi pending dengan id dan timestamp", () => {
    const action = addKasAction();

    expect(action.mutationKey).toBe("kas:create");
    expect(action.status).toBe("pending");
    expect(action.variables).toEqual(kasVariables);
    expect(action.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(action.timestamp).toBeGreaterThan(0);
    expect(useOfflineStore.getState().pendingActions).toHaveLength(1);
  });

  it("menyimpan antrian ke storage persist", () => {
    addKasAction();

    const raw = mocks.storage.get("sirt-offline-queue");
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw!) as {
      state: { pendingActions: { mutationKey: string }[] };
    };
    expect(persisted.state.pendingActions).toHaveLength(1);
    expect(persisted.state.pendingActions[0]!.mutationKey).toBe("kas:create");
  });
});

describe("updateActionVariables", () => {
  it("memperbarui variabel aksi pending pada key yang sama", () => {
    addKasAction();

    useOfflineStore.getState().updateActionVariables("kas:create", (items) => ({
      ...items,
      jumlah: 20000,
    }));

    const [action] = useOfflineStore.getState().pendingActions;
    expect(action!.variables).toMatchObject({ jumlah: 20000 });
  });

  it("melewati aksi yang sudah berstatus error", () => {
    addKasAction();
    useOfflineStore.setState((state) => ({
      pendingActions: state.pendingActions.map((action) => ({
        ...action,
        status: "error" as const,
        errorMessage: "gagal",
      })),
    }));

    useOfflineStore.getState().updateActionVariables("kas:create", (items) => ({
      ...items,
      jumlah: 20000,
    }));

    const [action] = useOfflineStore.getState().pendingActions;
    expect(action!.variables).toMatchObject({ jumlah: 10000 });
  });
});

describe("removeAction", () => {
  it("menghapus aksi berdasarkan id", () => {
    const action = addKasAction();

    useOfflineStore.getState().removeAction(action.id);

    expect(useOfflineStore.getState().pendingActions).toHaveLength(0);
  });
});

describe("syncAll", () => {
  it("menjalankan handler dan membersihkan antrian setelah sukses", async () => {
    addKasAction();
    addKasAction();

    await useOfflineStore.getState().syncAll();

    expect(mocks.okHandler).toHaveBeenCalledTimes(2);
    expect(mocks.okHandler).toHaveBeenCalledWith(kasVariables);
    expect(useOfflineStore.getState().pendingActions).toHaveLength(0);
    expect(useOfflineStore.getState().isSyncing).toBe(false);
    expect(mocks.queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["kas", "Bapak", 11, 2026],
    });
    expect(mocks.toast.success).toHaveBeenCalledWith(
      "2 data berhasil disinkronkan"
    );
    expect(mocks.toast.error).not.toHaveBeenCalled();
  });

  it("menandai aksi gagal dan mempertahankannya di antrian", async () => {
    useOfflineStore.getState().addAction({
      mutationKey: "jimpitan:create",
      variables: {} as unknown as MutationInput<"jimpitan:create">,
      queryKeyToInvalidate: ["jimpitan"],
    });

    await useOfflineStore.getState().syncAll();

    const [action] = useOfflineStore.getState().pendingActions;
    expect(mocks.failHandler).toHaveBeenCalledTimes(1);
    expect(action!.status).toBe("error");
    expect(action!.errorMessage).toBe("server menolak");
    expect(mocks.queryClient.invalidateQueries).not.toHaveBeenCalled();
    expect(mocks.toast.error).toHaveBeenCalledWith(
      "1 data gagal disinkronkan"
    );
  });

  it("menolak key tanpa handler terdaftar", async () => {
    useOfflineStore.setState({ pendingActions: [unknownKeyAction()] });

    await useOfflineStore.getState().syncAll();

    const [action] = useOfflineStore.getState().pendingActions;
    expect(action!.status).toBe("error");
    expect(action!.errorMessage).toBe(
      "Handler tidak ditemukan: tidak:dikenal"
    );
    expect(mocks.okHandler).not.toHaveBeenCalled();
    expect(mocks.failHandler).not.toHaveBeenCalled();
  });

  it("tidak melakukan apa pun saat antrian kosong", async () => {
    await useOfflineStore.getState().syncAll();

    expect(mocks.okHandler).not.toHaveBeenCalled();
    expect(mocks.queryClient.invalidateQueries).not.toHaveBeenCalled();
    expect(useOfflineStore.getState().isSyncing).toBe(false);
  });

  it("tidak berjalan ganda saat sinkronisasi sedang berlangsung", async () => {
    addKasAction();
    useOfflineStore.setState({ isSyncing: true });

    await useOfflineStore.getState().syncAll();

    expect(mocks.okHandler).not.toHaveBeenCalled();
    expect(useOfflineStore.getState().pendingActions).toHaveLength(1);
  });
});
