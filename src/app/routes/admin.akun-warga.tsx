import { useMemo, useState } from "react";
import { CheckCircle2, Search, Users, X } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { BottomDrawer } from "@/shared/components/ui/BottomDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAkunWarga,
  useRumahList,
  useSetAkunWargaAnggota,
} from "@/features/warga/hooks";
import type { AkunWarga } from "@/features/warga/services";
import { saranUsername } from "@/features/warga/services";
import { formatTanggalPendek } from "@/shared/utils/format";

const SELECT_CLASS =
  "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px]";

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,29}$/;

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-bold">{label}</label>
      {children}
    </div>
  );
}

function inisial(nama: string) {
  return nama
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminAkunWarga() {
  const { data: akunList, isLoading } = useAkunWarga();
  const { data: rumahList } = useRumahList();
  const setAnggota = useSetAkunWargaAnggota();

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [target, setTarget] = useState<AkunWarga | null>(null);
  const [rumahId, setRumahId] = useState("");
  const [wargaId, setWargaId] = useState("");
  const [username, setUsername] = useState("");
  const usernameValid = USERNAME_PATTERN.test(username);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return akunList ?? [];
    return (akunList ?? []).filter((a) => {
      const noRumah = a.warga_detail?.rumah_kk?.no_rumah ?? "";
      const namaAnggota = a.warga_detail?.nama_lengkap ?? "";
      return [a.nama_tampilan, a.username ?? "", namaAnggota, noRumah]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [akunList, search]);

  const anggotaRumah = useMemo(() => {
    const rumah = rumahList?.find((r) => r.id === rumahId);
    return (rumah?.warga_detail ?? []).filter((w) => w.is_active);
  }, [rumahList, rumahId]);

  const openDrawer = (akun: AkunWarga) => {
    setTarget(akun);
    setWargaId(akun.warga_id ?? "");
    setUsername(akun.username ?? "");
    const rumah = rumahList?.find(
      (r) => r.no_rumah === akun.warga_detail?.rumah_kk?.no_rumah,
    );
    setRumahId(rumah?.id ?? "");
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!target || !wargaId || !usernameValid) return;
    setAnggota.mutate(
      {
        akunId: target.id,
        warga_id: wargaId,
        username: username.trim().toLowerCase(),
      },
      { onSuccess: () => setDrawerOpen(false) },
    );
  };

  const handleUnlink = () => {
    if (!target) return;
    setAnggota.mutate(
      { akunId: target.id, warga_id: null },
      { onSuccess: () => setDrawerOpen(false) },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Akun Warga"
        description="Tautkan akun login warga ke anggota rumah"
      />

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2.2}
        />
        <input
          placeholder="Cari nama akun, anggota, atau no. rumah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[11px] border border-border/60 bg-card py-2.75 pl-9 pr-3 text-[13.5px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <p className="text-[11.5px] leading-relaxed text-muted-foreground">
        Buat akun di Supabase Auth dengan email{" "}
        <span className="font-semibold">username@sirt.local</span>, lalu atur
        username di sini. Warga masuk memakai username; email tidak ditampilkan.
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[14px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-border/60 py-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-[13.5px] font-medium text-muted-foreground">
            {akunList?.length === 0
              ? "Belum ada akun dengan role warga"
              : "Tidak ada akun yang cocok"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((akun) => {
            const tertaut = !!akun.warga_detail;
            const rumah = akun.warga_detail?.rumah_kk?.no_rumah;
            return (
              <button
                key={akun.id}
                onClick={() => openDrawer(akun)}
                className="flex w-full items-center gap-3 rounded-[14px] border border-border/60 bg-card px-3.5 py-3 text-left transition-colors active:bg-muted/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {inisial(akun.nama_tampilan)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14px] font-bold">
                      {akun.nama_tampilan}
                    </span>
                    {tertaut ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                        Tertaut
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        Belum tertaut
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {akun.username
                      ? `@${akun.username}`
                      : "Username belum diatur"}
                    {tertaut
                      ? ` · Rumah ${rumah ?? "?"} · ${akun.warga_detail?.nama_lengkap}`
                      : akun.no_hp
                        ? ` · No. HP ${akun.no_hp}`
                        : ` · Dibuat ${formatTanggalPendek(akun.created_at)}`}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-bold text-primary">
                  {tertaut ? "Ubah" : "Tautkan"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <BottomDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={`Tautkan: ${target?.nama_tampilan ?? ""}`}
      >
        <div className="flex flex-col gap-3.5">
          <FormField label="Rumah">
            <select
              value={rumahId}
              onChange={(e) => {
                setRumahId(e.target.value);
                setWargaId("");
                setUsername("");
              }}
              className={SELECT_CLASS}
            >
              <option value="">Pilih rumah</option>
              {(rumahList ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  Rumah {r.no_rumah}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Anggota Keluarga">
            <select
              value={wargaId}
              onChange={(e) => {
                const id = e.target.value;
                setWargaId(id);
                const anggota = anggotaRumah.find((w) => w.id === id);
                const noRumah =
                  rumahList?.find((r) => r.id === rumahId)?.no_rumah ?? "";
                setUsername(
                  anggota ? saranUsername(noRumah, anggota.nama_lengkap) : "",
                );
              }}
              disabled={!rumahId}
              className={SELECT_CLASS + " disabled:opacity-60"}
            >
              <option value="">Pilih anggota</option>
              {anggotaRumah.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nama_lengkap} · {w.hubungan_keluarga}
                </option>
              ))}
            </select>
            {rumahId && anggotaRumah.length === 0 && (
              <p className="text-[11.5px] text-muted-foreground">
                Rumah ini belum punya anggota aktif. Tambahkan lewat menu Data
                Warga.
              </p>
            )}
          </FormField>

          <FormField label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="a30-nama"
              maxLength={30}
              autoCapitalize="none"
              spellCheck={false}
              className={SELECT_CLASS}
            />
            <p className="text-[11.5px] text-muted-foreground">
              Dipakai untuk login. Huruf kecil, angka, dan tanda hubung.
            </p>
            {username.length > 0 && !usernameValid && (
              <p className="text-[11.5px] text-destructive">
                Format username tidak valid (2–30 karakter, contoh axx-nama).
              </p>
            )}
          </FormField>

          <button
            type="button"
            onClick={handleSave}
            disabled={!wargaId || !usernameValid || setAnggota.isPending}
            className="mt-1 w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {setAnggota.isPending ? "Menyimpan..." : "Simpan Tautan"}
          </button>

          {target?.warga_id && (
            <button
              type="button"
              onClick={handleUnlink}
              disabled={setAnggota.isPending}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/40 py-2.75 text-[13px] font-bold text-destructive transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
              Lepas Tautan
            </button>
          )}
        </div>
      </BottomDrawer>
    </div>
  );
}
