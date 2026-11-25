import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download } from "lucide-react";
import type { BuatAkunResult } from "@/features/warga/services";

function unduhAkunCsv(hasil: BuatAkunResult[]) {
  const berhasil = hasil.filter((r) => r.ok);
  if (berhasil.length === 0) return;
  const lines = ["username,password"];
  berhasil.forEach((r) => lines.push(`${r.username},${r.password ?? ""}`));
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "akun-warga-baru.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function AkunHasilDialog({
  hasil,
  onClose,
}: {
  hasil: BuatAkunResult[] | null;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={!!hasil} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Akun Login Dibuat</AlertDialogTitle>
          <AlertDialogDescription>
            {(hasil ?? []).filter((r) => r.ok).length} akun berhasil,{" "}
            {(hasil ?? []).filter((r) => !r.ok).length} gagal. Sampaikan
            password awal ke warga; password wajib diganti saat login pertama.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
          {(hasil ?? []).map((r) => (
            <div
              key={`${r.warga_id}-${r.username}`}
              className="flex items-center justify-between gap-2 rounded-[10px] bg-muted/40 px-2.5 py-2 text-[12px]"
            >
              <span className="font-mono font-bold">{r.username}</span>
              {r.ok ? (
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {r.password}
                </span>
              ) : (
                <span className="text-right text-[11px] text-destructive">
                  {r.error}
                </span>
              )}
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          {(hasil ?? []).some((r) => r.ok) && (
            <button
              type="button"
              onClick={() => unduhAkunCsv(hasil ?? [])}
              className="flex items-center justify-center gap-1.5 rounded-[10px] border border-border/60 px-3 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.96]"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
              Unduh CSV
            </button>
          )}
          <AlertDialogAction>Tutup</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
