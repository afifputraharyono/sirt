export type Role = "admin" | "ronda" | "warga";

export interface AuthUser {
  id: string;
  email: string;
  nama_tampilan: string;
  role: Role;
  warga_id: string | null;
  avatar_url: string | null;
  no_hp: string | null;
  must_change_password: boolean;
}

export interface Session {
  user: AuthUser;
  accessToken: string;
}
