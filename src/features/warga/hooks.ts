import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";
import {
  fetchRumahList,
  fetchRumahDetail,
  createRumah,
  updateRumah,
  deleteRumah,
  createWarga,
  bulkCreateWarga,
  updateWarga,
  deleteWarga,
  fetchKonteksWarga,
  fetchKasSaya,
  updateProfilSaya,
  fetchAkunWarga,
  updateAkunWarga,
  buatAkunWarga,
  ubahPasswordSaya,
  type AkunWargaUpdate,
  type BuatAkunItem,
  type CreateRumahInput,
  type CreateWargaInput,
} from "./services";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "sonner";

export function useRumahList() {
  return useQuery({
    queryKey: queryKeys.warga.lists(),
    queryFn: fetchRumahList,
  });
}

export function useRumahDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.warga.detail(id),
    queryFn: () => fetchRumahDetail(id),
    enabled: !!id,
  });
}

export function useCreateRumah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRumahInput) => createRumah(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Rumah berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateRumah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<CreateRumahInput> & { id: string }) =>
      updateRumah(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Data rumah berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteRumah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRumah(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Rumah berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateWarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWargaInput) => createWarga(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Warga berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useImportWarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inputs: CreateWargaInput[]) => bulkCreateWarga(inputs),
    onSuccess: (inserted) => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success(`${inserted.length} anggota warga berhasil diimpor`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateWarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<CreateWargaInput> & { id: string }) =>
      updateWarga(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Data warga berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteWarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWarga(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Warga berhasil dinonaktifkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ==================== PORTAL WARGA ====================

export function useKonteksWarga() {
  const userId = useAuthStore((s) => s.user?.id ?? "anon");
  return useQuery({
    queryKey: [...queryKeys.warga.me(), userId],
    queryFn: fetchKonteksWarga,
    staleTime: 30_000,
  });
}

export function useKasSaya(
  rumahId: string | null | undefined,
  tahun: number
) {
  return useQuery({
    queryKey: queryKeys.warga.myKas(rumahId ?? "none", tahun),
    queryFn: () => fetchKasSaya(rumahId as string, tahun),
    enabled: !!rumahId,
  });
}

export function useUpdateProfilSaya() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      nama_tampilan: string;
      no_hp: string | null;
    }) => updateProfilSaya(id, input),
    onSuccess: (data) => {
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.setState({
          user: {
            ...user,
            nama_tampilan: data.nama_tampilan,
            no_hp: data.no_hp,
          },
        });
      }
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Profil berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUbahPasswordSaya() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      password,
    }: {
      userId: string;
      password: string;
    }) => ubahPasswordSaya(userId, password),
    onSuccess: () => {
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.setState({ user: { ...user, must_change_password: false } });
      }
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Password berhasil diganti");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ==================== ADMIN: AKUN WARGA ====================

export function useAkunWarga() {
  return useQuery({
    queryKey: queryKeys.warga.accounts(),
    queryFn: fetchAkunWarga,
  });
}

export function useBuatAkunWarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: BuatAkunItem[]) => buatAkunWarga(items),
    onSuccess: (results) => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      const gagal = results.filter((r) => !r.ok).length;
      if (gagal > 0) {
        toast.warning(
          `${results.length - gagal} akun dibuat, ${gagal} gagal. Periksa daftar hasil.`
        );
      } else {
        toast.success(`${results.length} akun warga dibuat`);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSetAkunWargaAnggota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      akunId,
      ...input
    }: { akunId: string } & AkunWargaUpdate) => updateAkunWarga(akunId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warga.all });
      toast.success("Akun warga berhasil diperbarui");
    },
    onError: (err: Error) => {
      const pesan = err.message.includes("profil_pengguna_warga_unik")
        ? "Anggota ini sudah ditautkan ke akun lain"
        : err.message.includes("duplicate key") ||
            err.message.includes("profil_pengguna_username_unik")
          ? "Username sudah dipakai akun lain"
          : err.message;
      toast.error(pesan);
    },
  });
}
