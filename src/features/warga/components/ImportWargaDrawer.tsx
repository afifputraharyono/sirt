import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  XCircle,
} from "lucide-react";
import type { ImportPreview, ImportRow } from "@/features/warga/csv";
import { saranUsername } from "@/features/warga/services";

export function ImportWargaDrawer({
  open,
  onOpenChange,
  preview,
  fileName,
  readingFile,
  akunLines,
  onFileChange,
  onToggleAkun,
  onDownloadTemplate,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: ImportPreview | null;
  fileName: string;
  readingFile: boolean;
  akunLines: Set<number>;
  onFileChange: (file: File | null) => void;
  onToggleAkun: (line: number) => void;
  onDownloadTemplate: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <BottomDrawer open={open} onOpenChange={onOpenChange} title="Impor Data Warga">
      <div className="flex flex-col gap-3.5">
        <div className="rounded-[14px] border border-border/60 bg-muted/30 p-3.5">
          <div className="text-[12.5px] font-bold">1. Siapkan file CSV</div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Satu baris = satu anggota keluarga. Nomor rumah harus sudah terdaftar;
            impor hanya menambah anggota baru, bukan membuat rumah baru.
          </p>
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="mt-2.5 flex items-center gap-1.5 rounded-[10px] bg-card px-2.5 py-2 text-[12px] font-bold shadow-sm transition-transform active:scale-[0.96]"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
            Unduh template
          </button>
        </div>

        <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[14px] border border-dashed border-border/70 px-3 py-6 text-center">
          <FileSpreadsheet className="h-7 w-7 text-muted-foreground/60" strokeWidth={1.8} />
          <span className="text-[12.5px] font-bold">
            {readingFile ? "Membaca file..." : fileName || "Pilih file .csv"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Maksimal 2 MB · pemisah koma atau titik koma
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </label>

        {preview?.fatal && (
          <div className="rounded-[12px] bg-destructive/10 px-3 py-2.5 text-[12px] font-medium leading-relaxed text-destructive">
            {preview.fatal}
          </div>
        )}

        {preview && !preview.fatal && (
          <>
            <div className="flex flex-wrap gap-1.5">
              <SummaryChip tone="ok">{preview.okCount} siap diimpor</SummaryChip>
              <SummaryChip tone="skip">{preview.skipCount} dilewati</SummaryChip>
              <SummaryChip tone="error">{preview.errorCount} error</SummaryChip>
            </div>

            {akunLines.size > 0 && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {akunLines.size} anggota akan dibuatkan akun login. Password awal{" "}
                <span className="font-mono">sirt-rt-&lt;no rumah&gt;</span> dan wajib
                diganti saat login pertama.
              </p>
            )}

            {preview.rows.length === 0 ? (
              <p className="rounded-[12px] border border-dashed border-border/60 px-3 py-4 text-center text-[12px] text-muted-foreground">
                Tidak ada baris data di file.
              </p>
            ) : (
              <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-0.5">
                {preview.rows.slice(0, 200).map((row) => (
                  <ImportRowItem
                    key={row.line}
                    row={row}
                    akunDipilih={akunLines.has(row.line)}
                    onToggleAkun={() => onToggleAkun(row.line)}
                  />
                ))}
              </div>
            )}

            {preview.rows.length > 200 && (
              <p className="text-[11px] text-muted-foreground">
                Menampilkan 200 baris pertama dari {preview.total} baris.
              </p>
            )}

            <button
              type="button"
              onClick={onSubmit}
              disabled={preview.okCount === 0 || submitting}
              className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {submitting
                ? "Memproses..."
                : preview.okCount === 0
                  ? "Tidak ada baris yang bisa diimpor"
                  : `Impor ${preview.okCount} anggota`}
            </button>
          </>
        )}
      </div>
    </BottomDrawer>
  );
}

function SummaryChip({ tone, children }: { tone: ImportRow["status"]; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : tone === "skip"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-destructive/10 text-destructive";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{children}</span>
  );
}

function ImportRowItem({
  row,
  akunDipilih,
  onToggleAkun,
}: {
  row: ImportRow;
  akunDipilih: boolean;
  onToggleAkun: () => void;
}) {
  const Icon = row.status === "ok" ? CheckCircle2 : row.status === "skip" ? AlertTriangle : XCircle;
  const tone =
    row.status === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : row.status === "skip"
        ? "text-amber-600 dark:text-amber-400"
        : "text-destructive";
  return (
    <div className="flex items-start gap-2 rounded-[10px] bg-muted/40 px-2.5 py-2">
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone}`} strokeWidth={2.2} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="max-w-full truncate text-[12px] font-bold">{row.nama || "(tanpa nama)"}</span>
          <span className="text-[10.5px] font-medium text-muted-foreground">
            Rumah {row.noRumah || "-"} · baris {row.line}
          </span>
        </div>
        {row.messages.length > 0 && (
          <div className={`mt-0.5 text-[11px] leading-snug ${tone}`}>{row.messages.join(" ")}</div>
        )}
        {row.status === "ok" && (
          <label className="mt-1 flex items-center gap-1.5 text-[11px] font-medium">
            <input
              type="checkbox"
              checked={akunDipilih}
              onChange={onToggleAkun}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            Buat akun
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {saranUsername(row.noRumah, row.nama)}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
