import { useState, useEffect } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

export function useServiceWorker() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        toast.success("Aplikasi siap digunakan offline");
      },
    });
    setUpdateSW(() => update);
  }, []);

  const applyUpdate = async () => {
    if (updateSW) await updateSW();
    setNeedRefresh(false);
  };

  const dismissUpdate = () => setNeedRefresh(false);

  return { needRefresh, applyUpdate, dismissUpdate };
}
