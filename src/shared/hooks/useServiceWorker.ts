import { useState, useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

export function useServiceWorker() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSW = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    updateSW.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        toast.success("Aplikasi siap digunakan offline");
      },
    });
  }, []);

  const applyUpdate = async () => {
    if (updateSW.current) await updateSW.current();
    setNeedRefresh(false);
  };

  const dismissUpdate = () => setNeedRefresh(false);

  return { needRefresh, applyUpdate, dismissUpdate };
}
