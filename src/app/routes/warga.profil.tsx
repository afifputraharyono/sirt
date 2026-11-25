import { useEffect, useState } from "react";
import {
  AlertCircle,
  Home,
  KeyRound,
  Mail,
  RotateCw,
  Save,
  ShieldAlert,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import {
  useKonteksWarga,
  useUbahPasswordSaya,
  useUpdateProfilSaya,
} from "@/features/warga/hooks";
import { AkunBelumTertaut } from "@/features/warga/components/AkunBelumTertaut";
import { useAuthStore } from "@/features/auth/store";

const INPUT_CLASS =
  "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px] outline-none focus:ring-2 focus:ring-primary/30";
const READONLY_CLASS =
  "flex h-10 w-full rounded-[11px] border border-input bg-muted px-3 py-2 text-[13.5px] text-muted-foreground";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-semibold">{label}</label>
      {children}
    </div>
  );
}

export default function WargaProfil() {
  const { data: ctx, isLoading, isError, refetch, isFetching } =
    useKonteksWarga();
  const updateProfil = useUpdateProfilSaya();
  const ubahPassword = useUbahPasswordSaya();
  const user = useAuthStore((s) => s.user);

  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [pwBaru, setPwBaru] = useState("");
  const [pwUlang, setPwUlang] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const profilId = ctx?.profil.id;
  const profilNama = ctx?.profil.nama_tampilan;
  const profilHp = ctx?.profil.no_hp;

  useEffect(() => {
    if (!profilId) return;
    // Form lokal diselaraskan sekali saat profil termuat; akan diganti pola
    // form ber-key saat halaman ini dipecah (lihat rencana refactor route).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNama(profilNama ?? "");
    setNoHp(profilHp ?? "");
  }, [profilId, profilNama, profilHp]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3.5">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full rounded-[18px]" />
      </div>
    );
  }

  if (isError || !ctx) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[20px] border border-destructive/40 bg-destructive/5 py-10 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-[13.5px] font-medium text-muted-foreground">
          Gagal memuat profil.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-[11px] bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-[0.96]"
        >
          <RotateCw className="h-3.5 w-3.5" strokeWidth={2.5} /> Coba lagi
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfil.mutate({
      id: ctx.profil.id,
      nama_tampilan: nama.trim(),
      no_hp: noHp.trim() || null,
    });
  };

  const handleGantiPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (pwBaru.length < 8) {
      setPwError("Password baru minimal 8 karakter.");
      return;
    }
    if (pwBaru !== pwUlang) {
      setPwError("Konfirmasi password tidak sama.");
      return;
    }
    setPwError(null);
    ubahPassword.mutate(
      { userId: user.id, password: pwBaru },
      {
        onSuccess: () => {
          setPwBaru("");
          setPwUlang("");
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-3.5">
      <PageHeader
        title="Profil Saya"
        description="Nama tampilan dan nomor HP akun"
      />

      {user?.must_change_password && (
        <div className="flex items-start gap-2.5 rounded-[14px] border border-amber-500/40 bg-amber-500/10 px-3.5 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-[12px] leading-relaxed">
            <p className="font-bold text-amber-700 dark:text-amber-300">
              Ganti password awal
            </p>
            <p className="text-amber-700/80 dark:text-amber-300/80">
              Akun Anda masih memakai password awal dari pengurus. Ganti password
              untuk membuka menu lain.
            </p>
          </div>
        </div>
      )}

      {!ctx.rumah && (
        <AkunBelumTertaut onRefresh={() => refetch()} refreshing={isFetching} />
      )}

      <div className="rounded-[18px] border border-border/60 bg-card p-4">
        <div className="mb-3.5 flex items-center gap-2">
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] bg-blue-100 dark:bg-blue-950/40">
            <User
              className="h-3.75 w-3.75 text-blue-600 dark:text-blue-400"
              strokeWidth={2.2}
            />
          </div>
          <span className="text-[14.5px] font-bold">Informasi Akun</span>
        </div>

        <div className="flex flex-col gap-3.5">
          <FormField label="Email">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={user?.email ?? ""}
                disabled
                className={READONLY_CLASS}
              />
            </div>
          </FormField>

          <FormField label="Username">
            <input
              value={ctx.profil.username ?? "Belum diatur"}
              disabled
              className={READONLY_CLASS}
            />
          </FormField>

          <FormField label="Role">
            <input value="Warga" disabled className={READONLY_CLASS} />
          </FormField>

          <FormField label="Status Rumah">
            {ctx.rumah && ctx.anggota ? (
              <div className="flex items-center gap-2 rounded-[11px] border border-border/60 bg-muted/40 px-3 py-2.5">
                <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold">
                    Rumah {ctx.rumah.no_rumah}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {ctx.anggota.nama_lengkap} ·{" "}
                    {ctx.anggota.hubungan_keluarga}
                  </p>
                </div>
              </div>
            ) : (
              <input
                value="Belum tertaut"
                disabled
                className={READONLY_CLASS}
              />
            )}
          </FormField>

          <div className="my-0.5 border-t border-border/60" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <FormField label="Nama Tampilan *">
              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField label="No. HP">
              <input
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="08xxxxxxxxxx"
                maxLength={15}
                className={INPUT_CLASS}
              />
            </FormField>

            <button
              type="submit"
              disabled={updateProfil.isPending}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
            >
              <Save className="h-3.75 w-3.75" strokeWidth={2.2} />
              {updateProfil.isPending ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-[18px] border border-border/60 bg-card p-4">
        <div className="mb-3.5 flex items-center gap-2">
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] bg-amber-100 dark:bg-amber-950/40">
            <KeyRound
              className="h-3.75 w-3.75 text-amber-600 dark:text-amber-400"
              strokeWidth={2.2}
            />
          </div>
          <span className="text-[14.5px] font-bold">Ganti Password</span>
        </div>

        <form onSubmit={handleGantiPassword} className="flex flex-col gap-3.5">
          <FormField label="Password Baru *">
            <input
              type="password"
              value={pwBaru}
              onChange={(e) => setPwBaru(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="Ulangi Password Baru *">
            <input
              type="password"
              value={pwUlang}
              onChange={(e) => setPwUlang(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={INPUT_CLASS}
            />
          </FormField>

          {pwError && (
            <p className="text-[11.5px] font-medium text-destructive">{pwError}</p>
          )}

          <button
            type="submit"
            disabled={ubahPassword.isPending}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            <KeyRound className="h-3.75 w-3.75" strokeWidth={2.2} />
            {ubahPassword.isPending ? "Menyimpan..." : "Simpan Password"}
          </button>
        </form>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Setelah disimpan, gunakan password baru saat login berikutnya. Password
          minimal 8 karakter.
        </p>
      </div>

      <p className="text-[11.5px] leading-relaxed text-muted-foreground">
        Perubahan data rumah, role, atau tautan anggota hanya dapat dilakukan
        oleh pengurus RT.
      </p>
    </div>
  );
}
