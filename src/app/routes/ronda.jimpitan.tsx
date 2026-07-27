import { useState, useMemo } from "react";
import { Check, X, Home, Coins, Lock, LockOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRumahList } from "@/features/warga/hooks";
import {
  useJimpitanByDate,
  useUpdateJimpitan,
  useUpsertJimpitanBatch,
  useLockJimpitan,
  useUnlockJimpitan,
} from "@/features/keuangan/hooks";
import type { JimpitanWithRumah } from "@/features/keuangan/services";
import type { StatusJimpitan } from "@/shared/types/database";
import { RT_CONFIG } from "@/shared/lib/constants";
import { queryKeys } from "@/shared/lib/query-keys";
import { useAuthStore } from "@/features/auth/store";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { useOfflineStore } from "@/shared/stores/offline-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/shared/utils/format";

const TAPPABLE_STATUSES = ["Diambil", "Kosong"] as const;
type TappableStatus = (typeof TAPPABLE_STATUSES)[number];

const STATUS_CONFIG: Record<
  TappableStatus,
  { label: string; icon: typeof Check; color: string; bg: string }
> = {
  Diambil: {
    label: "Diambil",
    icon: Check,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/40",
  },
  Kosong: {
    label: "Kosong",
    icon: X,
    color: "text-red-400",
    bg: "bg-red-500/20 border-red-500/40",
  },
};

function getTodayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RondaJimpitan() {
  const [tanggal, setTanggal] = useState(getTodayDate);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const userId = useAuthStore((s) => s.user?.id);
  const userRole = useAuthStore((s) => s.role);
  const isOnline = useOnlineStatus();
  const qc = useQueryClient();
  const updateActionVariables = useOfflineStore(
    (s) => s.updateActionVariables
  );

  const { data: rumahList, isLoading: loadingRumah } = useRumahList();
  const { data: jimpitanList, isLoading: loadingJimpitan } =
    useJimpitanByDate(tanggal);
  const updateJimpitan = useUpdateJimpitan();
  const upsertBatch = useUpsertJimpitanBatch();
  const lockJimpitan = useLockJimpitan();
  const unlockJimpitan = useUnlockJimpitan();

  const activeRumah = useMemo(
    () =>
      rumahList?.filter(
        (r) =>
          r.is_active &&
          r.status_hunian !== "Kosong" &&
          r.mode_jimpitan === "Harian" &&
          r.warga_detail.some((w) => w.is_active),
      ) ?? [],
    [rumahList],
  );

  const jimpitanMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; status: StatusJimpitan; nominal: number }
    >();
    jimpitanList?.forEach((j) => {
      map.set(j.rumah_id, {
        id: j.id,
        status: j.status,
        nominal: Number(j.nominal),
      });
    });
    return map;
  }, [jimpitanList]);

  const isGenerated = jimpitanList && jimpitanList.length > 0;
  const isLocked = jimpitanList?.some((j) => j.is_locked) ?? false;
  const isAdmin = userRole === "admin";

  const stats = useMemo(() => {
    let diambil = 0;
    let kosong = 0;
    let belum = 0;
    let totalNominal = 0;
    jimpitanList?.forEach((j) => {
      if (j.status === "Diambil") {
        diambil++;
        totalNominal += Number(j.nominal);
      } else if (j.status === "Kosong") kosong++;
      else belum++;
    });
    const checked = diambil + kosong;
    const total = jimpitanList?.length ?? 0;
    return { diambil, kosong, belum, checked, total, totalNominal };
  }, [jimpitanList]);

  const handleGenerate = () => {
    if (!userId) return;
    const items = activeRumah.map((r) => ({
      rumah_id: r.id,
      tanggal,
      nominal: RT_CONFIG.nominal_jimpitan_default,
      status: "Belum" as StatusJimpitan,
      tipe: "harian" as const,
      catatan: null,
      dicatat_oleh: userId,
    }));
    upsertBatch.mutate(items);

    if (!isOnline) {
      const now = new Date().toISOString();
      const optimistic: JimpitanWithRumah[] = items.map((item) => ({
        ...item,
        id: `optimistic:${item.rumah_id}`,
        is_locked: false,
        dikunci_oleh: null,
        dikunci_at: null,
        created_at: now,
        updated_at: now,
        rumah_kk: {
          no_rumah:
            activeRumah.find((r) => r.id === item.rumah_id)?.no_rumah ?? "",
          mode_jimpitan: "Harian",
        },
      }));
      qc.setQueryData(queryKeys.jimpitan.byDate(tanggal), optimistic);
    }
  };

  const handleStatusTap = (rumahId: string, newStatus: TappableStatus) => {
    if (isLocked) return;
    const existing = jimpitanMap.get(rumahId);
    if (!existing) return;

    const isOptimisticItem = existing.id.startsWith("optimistic:");

    if (!isOnline && isOptimisticItem) {
      updateActionVariables(
        "jimpitan:upsert-batch",
        (variables) =>
          (variables as Record<string, unknown>[]).map((item) =>
            (item as { rumah_id: string }).rumah_id === rumahId
              ? { ...item, status: newStatus }
              : item
          )
      );
      qc.setQueryData<JimpitanWithRumah[]>(
        queryKeys.jimpitan.byDate(tanggal),
        (old) =>
          old?.map((j) =>
            j.rumah_id === rumahId ? { ...j, status: newStatus } : j
          )
      );
      return;
    }

    updateJimpitan.mutate({ id: existing.id, status: newStatus });

    if (!isOnline) {
      qc.setQueryData<JimpitanWithRumah[]>(
        queryKeys.jimpitan.byDate(tanggal),
        (old) =>
          old?.map((j) =>
            j.id === existing.id ? { ...j, status: newStatus } : j
          )
      );
    }
  };

  const handleLock = () => {
    if (!userId) return;
    lockJimpitan.mutate({ tanggal, userId });
    setShowConfirmLock(false);
  };

  const handleUnlock = () => {
    unlockJimpitan.mutate(tanggal);
  };

  const isLoading = loadingRumah || loadingJimpitan;

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Jimpitan Malam</h1>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="rounded-md border bg-card px-3 py-1.5 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !isGenerated ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-8 text-center">
          <Coins className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Belum ada data jimpitan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate data untuk {activeRumah.length} rumah aktif
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={upsertBatch.isPending}
            className="w-full max-w-xs"
            size="lg"
          >
            {upsertBatch.isPending ? "Generating..." : "Generate Jimpitan"}
          </Button>
        </div>
      ) : (
        <>
          {isLocked && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
              <Lock className="h-4 w-4 shrink-0 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-500">
                  Sesi Dikunci
                </p>
                <p className="text-xs text-muted-foreground">
                  Data tidak bisa diubah. Hubungi pengurus untuk membuka.
                </p>
              </div>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnlock}
                  disabled={unlockJimpitan.isPending}
                  className="shrink-0"
                >
                  <LockOpen className="mr-1.5 h-3.5 w-3.5" />
                  Buka
                </Button>
              )}
            </div>
          )}

          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-card p-2">
              <p className="text-lg font-bold text-emerald-500">
                {stats.diambil}
              </p>
              <p className="text-[10px] text-muted-foreground">Diambil</p>
            </div>
            <div className="rounded-xl bg-card p-2">
              <p className="text-lg font-bold text-red-500">{stats.kosong}</p>
              <p className="text-[10px] text-muted-foreground">Kosong</p>
            </div>
            <div className="rounded-xl bg-card p-2">
              <p className="text-lg font-bold text-primary">
                {stats.total > 0
                  ? Math.round((stats.checked / stats.total) * 100)
                  : 0}
                %
              </p>
              <p className="text-[10px] text-muted-foreground">Progress</p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between rounded-xl bg-primary/10 p-3">
            <span className="text-sm font-medium">Total Terkumpul</span>
            <span className="font-mono text-lg font-bold text-primary">
              {formatRupiah(stats.totalNominal)}
            </span>
          </div>

          <div className="space-y-2">
            {activeRumah.map((rumah) => {
              const entry = jimpitanMap.get(rumah.id);
              const currentStatus = entry?.status ?? "Belum";

              return (
                <div
                  key={rumah.id}
                  className={`rounded-xl border bg-card p-3 transition-all ${isLocked ? "opacity-60" : ""}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{rumah.no_rumah}</span>
                    {entry && currentStatus !== "Belum" && (
                      <span
                        className={`ml-auto text-xs font-medium ${STATUS_CONFIG[currentStatus as TappableStatus].color}`}
                      >
                        {currentStatus === "Diambil"
                          ? formatRupiah(entry.nominal)
                          : STATUS_CONFIG[currentStatus as TappableStatus]
                              .label}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {TAPPABLE_STATUSES.map((status) => {
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      const isActive = currentStatus === status;

                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusTap(rumah.id, status)}
                          disabled={isLocked || updateJimpitan.isPending}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-medium transition-all active:scale-95 ${
                            isActive
                              ? `${config.bg} ${config.color}`
                              : "border-border text-muted-foreground hover:border-foreground/20"
                          } ${isLocked ? "pointer-events-none" : ""}`}
                        >
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!isLocked && (
            <div className="mt-6">
              {showConfirmLock ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                  <p className="mb-3 text-sm font-medium">
                    Yakin ingin mengunci sesi jimpitan tanggal ini?
                  </p>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Setelah dikunci, data tidak bisa diubah lagi. Hanya pengurus
                    (admin) yang bisa membuka kembali.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowConfirmLock(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                      onClick={handleLock}
                      disabled={lockJimpitan.isPending}
                    >
                      <Lock className="mr-1.5 h-3.5 w-3.5" />
                      {lockJimpitan.isPending ? "Mengunci..." : "Kunci Sesi"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => setShowConfirmLock(true)}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Selesai & Kunci Sesi
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
