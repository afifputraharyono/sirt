import { ChevronDown, ChevronRight, Pencil, Trash2, UserPlus } from "lucide-react";
import type { WargaDetail } from "@/shared/types/database";
import type { RumahWithWarga } from "@/features/warga/services";
import { hitungUmur } from "@/shared/utils/format";
import { HUNIAN_BADGE } from "../constants";

function IconBtn({ icon: Icon, danger, onClick }: { icon: typeof Pencil; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-transform active:scale-90 ${
        danger ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
    </button>
  );
}

export function RumahCard({
  rumah, kk, isOpen, activeWarga,
  onToggle, onEditRumah, onDeleteRumah, onAddWarga, onEditWarga, onDeleteWarga,
}: {
  rumah: RumahWithWarga;
  kk: WargaDetail | undefined;
  isOpen: boolean;
  activeWarga: WargaDetail[];
  onToggle: () => void;
  onEditRumah: () => void;
  onDeleteRumah: () => void;
  onAddWarga: () => void;
  onEditWarga: (w: WargaDetail) => void;
  onDeleteWarga: (id: string) => void;
}) {
  return (
    <div className="animate-in fade-in rounded-[14px] border border-border/60 bg-card transition-all">
      {/* Header row */}
      <div className="flex w-full items-center gap-2.5 px-1.5 py-1.5">
        <button
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition-colors active:bg-muted/50"
        >
          {isOpen
            ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2.5} />
            : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2.5} />
          }
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold">Rumah {rumah.no_rumah}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${HUNIAN_BADGE[rumah.status_hunian] ?? ""}`}>
                {rumah.status_hunian}
              </span>
              {rumah.ikut_arisan && (
                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10.5px] font-bold text-violet-600 dark:text-violet-400">
                  Arisan
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {kk?.nama_lengkap ?? "Belum ada KK"} · {activeWarga.length} anggota
            </div>
          </div>
        </button>
        <div className="mr-1.5 flex shrink-0 gap-1">
          <IconBtn icon={Pencil} onClick={onEditRumah} />
          <IconBtn icon={Trash2} danger onClick={onDeleteRumah} />
        </div>
      </div>

      {/* Expanded warga list */}
      {isOpen && (
        <div className="border-t border-border/60 px-3.5 py-2.5">
          {activeWarga.length === 0 ? (
            <p className="py-2 text-center text-[12.5px] text-muted-foreground">
              Belum ada anggota
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeWarga.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-2.5 rounded-[10px] bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold">{w.nama_lengkap}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                      <span>{w.hubungan_keluarga}</span>
                      <span>·</span>
                      <span>{w.jenis_kelamin === "L" ? "L" : "P"}, {hitungUmur(w.tanggal_lahir)} thn</span>
                      {w.pekerjaan && <><span>·</span><span>{w.pekerjaan}</span></>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconBtn icon={Pencil} onClick={() => onEditWarga(w)} />
                    <IconBtn icon={Trash2} danger onClick={() => onDeleteWarga(w.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={onAddWarga}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-border/60 py-2 text-[12.5px] font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <UserPlus className="h-3.5 w-3.5" strokeWidth={2.2} />
            Tambah Anggota
          </button>
        </div>
      )}
    </div>
  );
}
