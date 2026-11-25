import type { ArisanRondeWithAnggota } from "@/features/keuangan/services";

export function RondePicker({
  rounds, selectedId, menangPerRonde, onPick,
}: {
  rounds: ArisanRondeWithAnggota[];
  selectedId: string | undefined;
  menangPerRonde: Map<string, number>;
  onPick: (id: string) => void;
}) {
  return (
    <div className="-mx-4 mb-3 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-1.5">
        {rounds.map((ronde) => {
          const dipilih = selectedId === ronde.id;
          const jumlah = ronde.arisan_anggota.length;
          const menang = menangPerRonde.get(ronde.id) ?? 0;
          return (
            <button
              key={ronde.id}
              onClick={() => onPick(ronde.id)}
              className={`shrink-0 rounded-[11px] border px-3 py-2 text-left transition-colors ${
                dipilih
                  ? "border-primary bg-primary/10"
                  : "border-border/60 bg-card"
              }`}
            >
              <div className="text-[12px] font-bold">Ronde {ronde.nomor}</div>
              <div className="text-[10.5px] text-muted-foreground">
                {ronde.tanggal_selesai ? "ditutup" : "berjalan"} · {menang}/{jumlah}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
