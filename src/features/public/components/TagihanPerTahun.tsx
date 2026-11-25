import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TagihanTahun, TipeTagihan } from "@/features/tagihan/tagihan";
import { formatRupiah } from "@/shared/utils/format";

const BULAN_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function labelRincian(tipe: TipeTagihan) {
  if (tipe === "Bapak") return "Kas Bapak";
  if (tipe === "Ibu") return "Kas Ibu";
  return "Arisan";
}

function labelPill(tipe: TipeTagihan) {
  if (tipe === "Bapak") return "Bapak";
  if (tipe === "Ibu") return "Ibu";
  return "Arisan";
}

function bulanKurang(tahun: TagihanTahun) {
  const map = new Map<TipeTagihan, number[]>();
  tahun.detailPerBulan.forEach((b) => {
    b.items
      .filter((i) => !i.lunas)
      .forEach((i) => {
        const list = map.get(i.tipe) ?? [];
        list.push(b.bulan);
        map.set(i.tipe, list);
      });
  });
  return map;
}

export function TagihanPerTahun({
  tahunList,
  tahunSekarang,
}: {
  tahunList: TagihanTahun[];
  tahunSekarang: number;
}) {
  const [terbuka, setTerbuka] = useState<Set<number>>(() => {
    const awal = tahunList.some((t) => t.tahun === tahunSekarang)
      ? tahunSekarang
      : tahunList[0]?.tahun;
    return new Set(awal ? [awal] : []);
  });

  const toggle = (tahun: number) => {
    setTerbuka((prev) => {
      const next = new Set(prev);
      if (next.has(tahun)) next.delete(tahun);
      else next.add(tahun);
      return next;
    });
  };

  if (tahunList.length === 0) return null;

  return (
    <div className="rounded-[18px] border border-border/60 bg-card p-4">
      <p className="text-[15px] font-bold">Rincian per Tahun</p>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
        {tahunList.length > 1
          ? `${tahunList.length} tahun tagihan — total semua tahun sudah digabung di atas.`
          : "Buka tahun untuk melihat rincian bulanan."}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {tahunList.map((t) => {
          const isOpen = terbuka.has(t.tahun);
          const lunas = t.totalNominalKurang === 0;
          const perTipe = isOpen ? bulanKurang(t) : null;
          return (
            <div key={t.tahun} className="rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => toggle(t.tahun)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              >
                <span className="text-[13px] font-bold">Tahun {t.tahun}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {lunas ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Lunas
                    </span>
                  ) : (
                    <span className="font-mono text-[12px] font-extrabold text-amber-600 dark:text-amber-400">
                      {formatRupiah(t.totalNominalKurang)}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-border/40 px-3 pb-3 pt-2.5">
                  <div className="flex flex-col gap-2">
                    {t.rincian.map((r) => {
                      const daftarBulan = (perTipe?.get(r.tipe) ?? [])
                        .map((b) => BULAN_NAMES[b]?.slice(0, 3))
                        .join(", ");
                      return (
                        <div
                          key={r.tipe}
                          className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-[13px] font-bold">
                              {labelRincian(r.tipe)}
                            </p>
                            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                              {formatRupiah(r.nominal)}/bulan · {r.jumlahLunas}{" "}
                              dari {r.bulanWajib} bulan lunas
                            </p>
                          </div>
                          {r.jumlahKurang === 0 ? (
                            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                              Lunas
                            </span>
                          ) : (
                            <div className="shrink-0 text-right">
                              <p className="font-mono text-[12.5px] font-extrabold text-amber-600 dark:text-amber-400">
                                {formatRupiah(r.nominalKurang)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Belum {daftarBulan}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    {[...t.detailPerBulan].reverse().map((b) => (
                      <div
                        key={b.bulan}
                        className="flex items-start justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2.5"
                      >
                        <p className="text-[12.5px] font-bold">
                          {BULAN_NAMES[b.bulan] ?? ""}
                        </p>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {b.items.map((item) => (
                            <span
                              key={`${b.bulan}-${item.tipe}`}
                              className={
                                item.lunas
                                  ? "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary"
                                  : "rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400"
                              }
                            >
                              {labelPill(item.tipe)}{" "}
                              {item.lunas ? "Lunas" : "Belum"}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
