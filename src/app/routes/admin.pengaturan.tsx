import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { User, Lock, Save, Settings } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { supabase } from "@/shared/lib/supabase";
import { toast } from "sonner";

const INPUT_CLASS = "flex h-10 w-full rounded-[11px] border border-input bg-background px-3 py-2 text-[13.5px] outline-none focus:ring-2 focus:ring-primary/30";

export default function AdminPengaturan() {
  const [activeTab, setActiveTab] = useState<"profil" | "password">("profil");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil admin dan keamanan akun"
      />

      {/* Pill tabs */}
      <div className="animate-in fade-in slide-in-from-bottom-1 flex rounded-[14px] bg-muted p-1">
        <button
          onClick={() => setActiveTab("profil")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-[11px] py-2 text-[13px] font-bold transition-colors ${
            activeTab === "profil"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <User className="h-3.75 w-3.75" strokeWidth={2.2} />
          Profil
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-[11px] py-2 text-[13px] font-bold transition-colors ${
            activeTab === "password"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Lock className="h-3.75 w-3.75" strokeWidth={2.2} />
          Password
        </button>
      </div>

      {activeTab === "profil" ? <ProfilForm /> : <PasswordForm />}
    </div>
  );
}

function ProfilForm() {
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);
  const [nama, setNama] = useState(user?.nama_tampilan ?? "");
  const [noHp, setNoHp] = useState(user?.no_hp ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profil_pengguna")
        .update({
          nama_tampilan: nama,
          no_hp: noHp || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      useAuthStore.setState({
        user: { ...user, nama_tampilan: nama, no_hp: noHp || null },
      });

      toast.success("Profil berhasil diperbarui");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-4">
      <div className="mb-3.5 flex items-center gap-2">
        <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] bg-blue-100 dark:bg-blue-950/40">
          <Settings className="h-3.75 w-3.75 text-blue-600 dark:text-blue-400" strokeWidth={2.2} />
        </div>
        <span className="text-[14.5px] font-bold">Informasi Profil</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <FormField label="Email">
          <input value={user?.email ?? ""} disabled className={INPUT_CLASS + " bg-muted text-muted-foreground"} />
        </FormField>

        <FormField label="Role">
          <input
            value={user?.role === "admin" ? "Administrator" : user?.role ?? ""}
            disabled
            className={INPUT_CLASS + " bg-muted capitalize text-muted-foreground"}
          />
        </FormField>

        <div className="my-0.5 border-t border-border/60" />

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
          disabled={saving}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
        >
          <Save className="h-3.75 w-3.75" strokeWidth={2.2} />
          {saving ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </form>
    </div>
  );
}

function PasswordForm() {
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password berhasil diubah");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[18px] border border-border/60 bg-card p-4">
      <div className="mb-3.5 flex items-center gap-2">
        <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[10px] bg-amber-100 dark:bg-amber-950/40">
          <Lock className="h-3.75 w-3.75 text-amber-600 dark:text-amber-400" strokeWidth={2.2} />
        </div>
        <span className="text-[14.5px] font-bold">Ubah Password</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <FormField label="Password Baru *">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Minimal 8 karakter"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Konfirmasi Password *">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Ulangi password baru"
            className={INPUT_CLASS}
          />
        </FormField>

        <button
          type="submit"
          disabled={saving}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-[11px] bg-primary py-2.75 text-[13.5px] font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
        >
          <Lock className="h-3.75 w-3.75" strokeWidth={2.2} />
          {saving ? "Menyimpan..." : "Ubah Password"}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold">{label}</label>
      {children}
    </div>
  );
}
