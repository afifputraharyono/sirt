import { useState } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Save } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { supabase } from "@/shared/lib/supabase";
import { toast } from "sonner";

export default function AdminPengaturan() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil admin dan keamanan akun"
      />

      <Tabs defaultValue="profil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profil" className="gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="h-4 w-4" />
            Ubah Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <ProfilForm />
        </TabsContent>

        <TabsContent value="password">
          <PasswordForm />
        </TabsContent>
      </Tabs>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informasi Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={user?.role === "admin" ? "Administrator" : user?.role ?? ""}
              disabled
              className="bg-muted capitalize"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="nama">Nama Tampilan *</Label>
            <Input
              id="nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="no_hp">No. HP</Label>
            <Input
              id="no_hp"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="08xxxxxxxxxx"
              maxLength={15}
            />
          </div>

          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Profil"}
          </Button>
        </form>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ubah Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="new_password">Password Baru *</Label>
            <Input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Konfirmasi Password *</Label>
            <Input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Ulangi password baru"
            />
          </div>

          <Button type="submit" disabled={saving}>
            <Lock className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Ubah Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
