import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/shared/lib/query-client";
import { useAuthStore } from "@/features/auth/store";
import { router } from "@/app/router";
import { UpdatePrompt } from "@/shared/components/feedback/UpdatePrompt";
import { OfflineIndicator } from "@/shared/components/feedback/OfflineIndicator";
import { useOfflineStore } from "@/shared/stores/offline-store";

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleOnline = () => {
      useOfflineStore.getState().syncAll();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
      <UpdatePrompt />
      <OfflineIndicator />
    </QueryClientProvider>
  );
}
