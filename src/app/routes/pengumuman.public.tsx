import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Pin, FileText } from "lucide-react";
import { usePengumumanActive } from "@/features/pengumuman/hooks";
import { formatTanggal } from "@/shared/utils/format";

export default function PengumumanPublik() {
  const { data: pengumuman, isLoading } = usePengumumanActive();

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[9px] bg-blue-100 dark:bg-blue-950/40">
          <Megaphone className="h-3.75 w-3.75 text-blue-600 dark:text-blue-400" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-[17px] font-extrabold tracking-[-0.2px]">
            Pengumuman
          </h1>
          <p className="text-[12px] font-medium text-muted-foreground">
            Informasi dan pengumuman warga RT
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[20px]" />
          ))}
        </div>
      ) : pengumuman?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border/60 py-10 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            Tidak ada pengumuman aktif saat ini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pengumuman?.map((p, idx) => (
            <div
              key={p.id}
              className={`animate-in fade-in slide-in-from-bottom-1 rounded-[20px] border p-4 transition-all ${
                p.is_pinned
                  ? "border-amber-400/60 bg-amber-50/50 shadow-sm shadow-amber-200/20 dark:border-amber-500/30 dark:bg-amber-950/15 dark:shadow-amber-900/10"
                  : "border-border/60 bg-card"
              }`}
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex gap-2.5">
                {p.is_pinned && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Pin className="h-3 w-3 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14.5px] font-bold leading-tight">
                    {p.judul}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-[11.5px] font-medium text-muted-foreground">
                      {formatTanggal(p.tanggal_mulai)}
                    </span>
                    {p.tanggal_berakhir && (
                      <span className="text-[11.5px] font-medium text-muted-foreground">
                        s/d {formatTanggal(p.tanggal_berakhir)}
                      </span>
                    )}
                    {p.kategori && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10.5px] font-bold text-primary">
                        {p.kategori}
                      </span>
                    )}
                  </div>
                  <p className="mt-2.5 whitespace-pre-line text-[13px] leading-relaxed text-foreground/75">
                    {p.isi}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
