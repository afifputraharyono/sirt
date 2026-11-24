import { create } from "zustand";
import type { AuthUser, Role } from "@/features/auth/types";
import { supabase } from "@/shared/lib/supabase";

interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  isLoading: boolean;
  initialized: boolean;

  login: (identifier: string, password: string) => Promise<AuthUser>;
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

  login: async (identifier: string, password: string) => {
    set({ isLoading: true });
    try {
      let email = identifier.trim();
      if (!email.includes("@")) {
        const { data: resolved, error: resolveError } = await supabase.rpc(
          "fn_login_email",
          { p_username: email.toLowerCase() }
        );
        if (resolveError) throw resolveError;
        if (!resolved) throw new Error("Username atau password salah");
        email = String(resolved);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.status === 400) {
          throw new Error("Username atau password salah");
        }
        throw error;
      }

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

      return authUser;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null });
  },
}));
