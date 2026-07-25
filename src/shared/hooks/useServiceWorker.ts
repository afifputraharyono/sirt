import { useState, useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

export function useServiceWorker() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {},
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
