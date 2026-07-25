import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Pin } from "lucide-react";
import { usePengumumanActive } from "@/features/pengumuman/hooks";
import { formatTanggal } from "@/shared/utils/format";

export default function PengumumanPublik() {
  const { data: pengumuman, isLoading } = usePengumumanActive();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-cyan-600" />
          Pengumuman
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Informasi dan pengumuman warga RT
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : pengumuman?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Tidak ada pengumuman aktif saat ini.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pengumuman?.map((p) => (
            <Card
              key={p.id}
              className={
                p.is_pinned
                  ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/10"
                  : ""
              }
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-2">
                  {p.is_pinned && (
                    <Pin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium leading-tight">{p.judul}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTanggal(p.tanggal_mulai)}</span>
                      {p.tanggal_berakhir && (
                        <span>s/d {formatTanggal(p.tanggal_berakhir)}</span>
                      )}
                      {p.kategori && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {p.kategori}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-line">
                  {p.isi}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
