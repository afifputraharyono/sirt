import { WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { useOfflineStore } from "@/shared/stores/offline-store";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const pendingCount = useOfflineStore((s) => s.pendingActions.length);
  const isSyncing = useOfflineStore((s) => s.isSyncing);
  const syncAll = useOfflineStore((s) => s.syncAll);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium">
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-b-lg bg-amber-500 px-4 py-1.5 text-white shadow-lg">
          <WifiOff className="h-4 w-4" />
          <span>Anda sedang offline</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {pendingCount} pending
            </span>
          )}
        </div>
      )}
      {isOnline && pendingCount > 0 && (
        <button
          onClick={() => syncAll()}
          disabled={isSyncing}
          className="flex items-center gap-2 rounded-b-lg bg-emerald-600 px-4 py-1.5 text-white shadow-lg transition-colors hover:bg-emerald-700 disabled:opacity-70"
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>
            {isSyncing
              ? "Menyinkronkan..."
              : `Sinkronkan ${pendingCount} data`}
          </span>
        </button>
      )}
    </div>
  );
}
