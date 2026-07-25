import { useServiceWorker } from "@/shared/hooks/useServiceWorker";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

export function UpdatePrompt() {
  const { needRefresh, applyUpdate, dismissUpdate } = useServiceWorker();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border bg-card p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Versi baru tersedia</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Perbarui aplikasi untuk mendapatkan fitur terbaru.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={applyUpdate}>
              Perbarui
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissUpdate}>
              Nanti
            </Button>
          </div>
        </div>
        <button onClick={dismissUpdate} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
