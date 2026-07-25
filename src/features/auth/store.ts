import { create } from "zustand";
import type { AuthUser, Role } from "@/features/auth/types";
import { supabase } from "@/shared/lib/supabase";

interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  isLoading: boolean;
  initialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profil_pengguna")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const authUser: AuthUser = {
            id: profile.id,
            email: session.user.email ?? "",
            nama_tampilan: profile.nama_tampilan,
            role: profile.role,
            warga_id: profile.warga_id,
            avatar_url: profile.avatar_url,
            no_hp: profile.no_hp,
          };
          set({ user: authUser, role: profile.role });
        }
      }
    } finally {
      set({ isLoading: false, initialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from("profil_pengguna")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (!profile) throw new Error("Profil pengguna tidak ditemukan");

      const authUser: AuthUser = {
        id: profile.id,
        email: data.user.email ?? "",
        nama_tampilan: profile.nama_tampilan,
        role: profile.role,
        warga_id: profile.warga_id,
        avatar_url: profile.avatar_url,
        no_hp: profile.no_hp,
      };

      set({ user: authUser, role: profile.role });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null });
  },
}));
