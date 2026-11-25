import { Check } from "lucide-react";
import type { RumahKK } from "@/shared/types/database";
import type { KasWithRumah } from "@/features/keuangan/services";
import { CHIP_MUTED, CHIP_PAID_ARISAN, CHIP_PAID_KAS, CHIP_UNPAID } from "@/features/keuangan/constants";
import { formatTanggalPendek } from "@/shared/utils/format";

export function IbuRumahRow({
  rumah, kas, arisan, onCatat, onHapus,
}: {
  rumah: RumahKK;
  kas: KasWithRumah | undefined;
  arisan: KasWithRumah | undefined;
  onCatat: () => void;
  onHapus: (target: { id: string; label: string }) => void;
}) {
  const isPeserta = rumah.ikut_arisan;
  const lengkap = !!kas && (!isPeserta || !!arisan);

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${lengkap ? "border-border/60" : "border-amber-500/25 bg-amber-500/[0.03]"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-bold">Rumah {rumah.no_rumah}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {kas ? (
              <button
                type="button"
                onClick={() => onHapus({ id: kas.id, label: `Kas Ibu Rumah ${rumah.no_rumah}` })}
                className={CHIP_PAID_KAS}
              >
                <Check className="h-3 w-3" strokeWidth={2.5} />
                Kas
              </button>
            ) : (
              <button type="button" onClick={onCatat} className={CHIP_UNPAID}>
                Kas belum
              </button>
            )}
            {isPeserta ? (
              arisan ? (
                <button
                  type="button"
                  onClick={() => onHapus({ id: arisan.id, label: `Arisan Rumah ${rumah.no_rumah}` })}
                  className={CHIP_PAID_ARISAN}
                >
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  Arisan
                </button>
              ) : (
                <button type="button" onClick={onCatat} className={CHIP_UNPAID}>
                  Arisan belum
                </button>
              )
            ) : (
              <span className={CHIP_MUTED}>Non-peserta</span>
            )}
          </div>
          {(kas || arisan) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10.5px] text-muted-foreground">
              {kas && <span>Kas {kas.tanggal_bayar ? formatTanggalPendek(kas.tanggal_bayar) : "-"}</span>}
              {kas && arisan && <span>·</span>}
              {arisan && <span>Arisan {arisan.tanggal_bayar ? formatTanggalPendek(arisan.tanggal_bayar) : "-"}</span>}
            </div>
          )}
        </div>
        {lengkap ? (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            Lengkap
          </span>
        ) : (
          <button
            onClick={onCatat}
            className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground transition-transform active:scale-95"
          >
            Catat
          </button>
        )}
      </div>
    </div>
  );
}
