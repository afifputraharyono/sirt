import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Clock, Repeat } from "lucide-react";
import { useArisanRekap } from "@/features/keuangan/hooks";
import { useRondeArisanAktif } from "@/features/public/hooks";
import type { ArisanRekap } from "@/shared/types/database";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";

const BULAN_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

type StatusKind = "belum-diundi" | "belum-disalurkan" | "sudah-disalurkan";

function statusOf(row: ArisanRekap): StatusKind {
  if (!row.putaran_id) return "belum-diundi";
  if (!row.pengeluaran_id) return "belum-disalurkan";
  return "sudah-disalurkan";
}

const STATUS_UI: Record<StatusKind, { label: string; className: string; Icon: typeof Circle }> = {
  "belum-diundi": { label: "Belum diundi", className: "bg-muted text-muted-foreground", Icon: Circle },
  "belum-disalurkan": { label: "Belum disalurkan", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400", Icon: Clock },
  "sudah-disalurkan": { label: "Sudah disalurkan", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", Icon: CheckCircle2 },
};

export function ArisanFlowCard({ bulan, tahun }: { bulan: number; tahun: number }) {
  const { data, isLoading, isError } = useArisanRekap();
  const { data: ronde, isLoading: rondeLoading } = useRondeArisanAktif();

  const rows = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => b.tahun - a.tahun || b.bulan - a.bulan,
      ),
    [data],
  );
  const current = rows.find((r) => r.bulan === bulan && r.tahun === tahun);
  const timeline = rows.slice(0, 3);

  const pemenangRonde = useMemo(() => {
    if (!ronde) return 0;
    const sudah = new Set<string>();
    for (const r of rows) {
      if (r.ronde_id !== ronde.id || !r.pemenang_rumah_id) continue;
      sudah.add(r.putaran_id ?? `${r.tahun}-${r.bulan}`);
    }
    return sudah.size;
  }, [rows, ronde]);

  if (isError) return null;

  const persenRonde =
    ronde && ronde.jumlahAnggota > 0
      ? Math.min(100, Math.round((pemenangRonde / ronde.jumlahAnggota) * 100))
      : 0;

  return (
    <div className="rounded-[18px] border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2">
        <Repeat className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2.2} />
        <span className="text-[15px] font-bold">Arisan Bergulir</span>
      </div>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
        Dana bergulir — terkumpul lalu langsung disalurkan ke pemenang.
      </p>

      {rondeLoading ? (
        <Skeleton className="mt-3 h-16 w-full rounded-[14px]" />
      ) : ronde ? (
        <div className="mt-3 rounded-[14px] border border-violet-500/20 bg-violet-500/[0.06] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12.5px] font-bold">
              Ronde {ronde.nomor} · berjalan
            </span>
            <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
              {pemenangRonde}/{ronde.jumlahAnggota} pemenang
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Mulai {formatTanggalPendek(ronde.tanggal_mulai)}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-500/15">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${persenRonde}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-[14px] border border-dashed border-border/60 px-3 py-2.5 text-center text-[11.5px] text-muted-foreground">
          Tidak ada ronde berjalan saat ini.
        </p>
      )}

      {isLoading ? (
        <Skeleton className="mt-3 h-32 w-full rounded-xl" />
      ) : (
        <>
          {!current ? (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">
              Belum ada data arisan untuk {BULAN_NAMES[bulan]} {tahun}.
            </p>
          ) : (() => {
            const kind = statusOf(current);
            const ui = STATUS_UI[kind];
            const sisa = Math.max(0, current.nominal_terkumpul - (current.nominal_putaran ?? 0));
            return (
              <>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-bold">{BULAN_NAMES[current.bulan]} {current.tahun}</span>
                  <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${ui.className}`}>
                    <ui.Icon className="h-3 w-3" strokeWidth={2.5} />
                    {ui.label}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Pemenang:{" "}
                  <span className="font-bold text-foreground">
                    {current.pemenang_no_rumah ? `Rumah ${current.pemenang_no_rumah}` : "Belum diundi"}
                  </span>
                  {current.tanggal_undi && <> · undi {formatTanggalPendek(current.tanggal_undi)}</>}
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-emerald-500/10 p-2">
                    <div className="font-mono text-[12px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(current.nominal_terkumpul)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Terkumpul</div>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-2">
                    <div className="font-mono text-[12px] font-extrabold text-primary">
                      {formatRupiah(current.nominal_putaran ?? 0)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Tersalurkan</div>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 p-2">
                    <div className="font-mono text-[12px] font-extrabold text-amber-600 dark:text-amber-400">
                      {formatRupiah(sisa)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Sisa</div>
                  </div>
                </div>
              </>
            );
          })()}

          {timeline.length > 0 && (
            <div className="mt-3 border-t border-border/40 pt-2.5">
              <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">Riwayat terakhir lintas tahun</p>
              <div className="flex flex-col gap-1.5">
                {timeline.map((r) => {
                  const ui = STATUS_UI[statusOf(r)];
                  return (
                    <div key={`${r.tahun}-${r.bulan}`} className="flex items-center justify-between gap-2">
                      <span className="text-[11.5px] font-medium">
                        {BULAN_NAMES[r.bulan]?.slice(0, 3)} {r.tahun}
                      </span>
                      <span className="text-[11.5px]">
                        {r.pemenang_no_rumah ? `Rumah ${r.pemenang_no_rumah}` : "—"}
                      </span>
                      <span className={`flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${ui.className}`}>
                        <ui.Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
                        {ui.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <p className="mt-3 text-[10.5px] text-muted-foreground">
        Hanya nomor rumah dan nominal yang ditampilkan.
      </p>
    </div>
  );
}
