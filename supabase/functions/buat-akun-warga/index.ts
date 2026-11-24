// Edge Function: buat-akun-warga
// Admin-only. Membuat akun login untuk anggota warga yang sudah terdaftar.
// Service role key hanya hidup di sisi server; client memanggil dengan JWT admin.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,29}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ITEMS = 25;

type ItemInput = { warga_id?: unknown; username?: unknown };

type HasilAkun = {
  warga_id: string;
  username: string;
  ok: boolean;
  password?: string;
  error?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Password awal wajib >= 8 karakter agar lolos validasi form login.
function passwordAwal(noRumah: string): string {
  return `sirt-rt-${slug(noRumah)}`;
}

// supabase-js tanpa tipe Database yang di-generate.
// deno-lint-ignore no-explicit-any
type AdminClient = ReturnType<typeof createClient<any, "public", any>>;

async function buatSatu(
  admin: AdminClient,
  wargaId: string,
  username: string
): Promise<HasilAkun> {
  const fail = (error: string): HasilAkun => ({ warga_id: wargaId, username, ok: false, error });

  const { data: warga, error: wargaError } = await admin
    .from("warga_detail")
    .select("id, nama_lengkap, no_hp, is_active, rumah_kk(no_rumah)")
    .eq("id", wargaId)
    .maybeSingle();

  if (wargaError) return fail("Gagal membaca data warga.");
  if (!warga || !warga.is_active) return fail("Anggota warga tidak ditemukan atau nonaktif.");

  const rumah = Array.isArray(warga.rumah_kk) ? warga.rumah_kk[0] : warga.rumah_kk;
  if (!rumah?.no_rumah) return fail("Rumah anggota tidak ditemukan.");

  const { data: existing, error: existingError } = await admin
    .from("profil_pengguna")
    .select("id")
    .eq("warga_id", wargaId)
    .maybeSingle();
  if (existingError) return fail("Gagal memeriksa akun yang ada.");
  if (existing) return fail("Anggota ini sudah punya akun.");

  const { data: usernameTaken, error: usernameError } = await admin
    .from("profil_pengguna")
    .select("id")
    .ilike("username", username)
    .maybeSingle();
  if (usernameError) return fail("Gagal memeriksa username.");
  if (usernameTaken) return fail("Username sudah dipakai akun lain.");

  const password = passwordAwal(rumah.no_rumah);
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: `${username}@sirt.local`,
    password,
    email_confirm: true,
    user_metadata: { nama_tampilan: warga.nama_lengkap },
  });

  if (createError || !created.user) {
    const bentrok = /already|exists/i.test(createError?.message ?? "");
    return fail(bentrok ? "Email akun sudah terdaftar." : "Gagal membuat akun auth.");
  }

  const { error: linkError } = await admin
    .from("profil_pengguna")
    .update({
      username,
      warga_id: wargaId,
      nama_tampilan: warga.nama_lengkap,
      no_hp: warga.no_hp ?? null,
      must_change_password: true,
    })
    .eq("id", created.user.id);

  if (linkError) {
    // Jangan tinggalkan auth user tanpa tautan profil.
    await admin.auth.admin.deleteUser(created.user.id);
    return fail(
      linkError.code === "23505"
        ? "Username sudah dipakai akun lain."
        : "Gagal menautkan profil akun."
    );
  }

  return { warga_id: wargaId, username, ok: true, password };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Metode tidak didukung." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Konfigurasi server tidak lengkap." }, 500);
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Tidak terautentikasi." }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Sesi tidak valid." }, 401);

  const { data: profil, error: profilError } = await admin
    .from("profil_pengguna")
    .select("role, is_active")
    .eq("id", userData.user.id)
    .single();

  if (profilError || !profil) return json({ error: "Profil tidak ditemukan." }, 403);
  if (profil.role !== "admin" || !profil.is_active) {
    return json({ error: "Hanya admin yang boleh membuat akun." }, 403);
  }

  let body: { items?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body bukan JSON." }, 400);
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return json({ error: "items wajib berisi minimal satu akun." }, 400);
  }
  if (body.items.length > MAX_ITEMS) {
    return json({ error: `Maksimal ${MAX_ITEMS} akun per permintaan.` }, 400);
  }

  const results: HasilAkun[] = [];
  for (const raw of body.items as ItemInput[]) {
    const wargaId = typeof raw?.warga_id === "string" ? raw.warga_id.trim() : "";
    const username = typeof raw?.username === "string" ? raw.username.trim().toLowerCase() : "";

    if (!UUID_RE.test(wargaId) || !USERNAME_RE.test(username)) {
      results.push({ warga_id: wargaId, username, ok: false, error: "Data akun tidak valid." });
      continue;
    }

    results.push(await buatSatu(admin, wargaId, username));
  }

  return json({ results });
});
