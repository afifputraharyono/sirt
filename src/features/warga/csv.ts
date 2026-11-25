import type {
  Agama,
  HubunganKeluarga,
  JenisKelamin,
  StatusPerkawinan,
  WargaDetail,
} from "@/shared/types/database";
import { todayISO } from "@/shared/lib/date";
import type { RumahWithWarga } from "./services";

export type ImportRowStatus = "ok" | "skip" | "error";

export interface ImportRow {
  line: number;
  nama: string;
  noRumah: string;
  status: ImportRowStatus;
  messages: string[];
  payload?: Omit<WargaDetail, "id" | "is_active" | "alasan_nonaktif" | "tanggal_nonaktif" | "keterangan_nonaktif" | "created_at" | "updated_at">;
}

export interface ImportPreview {
  fatal?: string;
  rows: ImportRow[];
  total: number;
  okCount: number;
  skipCount: number;
  errorCount: number;
}

export const TEMPLATE_HEADERS = [
  "no_rumah",
  "nama_lengkap",
  "nik",
  "jenis_kelamin",
  "tempat_lahir",
  "tanggal_lahir",
  "agama",
  "status_perkawinan",
  "hubungan_keluarga",
  "pendidikan_terakhir",
  "pekerjaan",
  "no_hp",
  "golongan_darah",
] as const;

export const CSV_TEMPLATE = [
  TEMPLATE_HEADERS.join(","),
  "A1,Budi Santoso,,L,Semarang,1985-04-12,Islam,Kawin,Kepala Keluarga,SMA,Karyawan Swasta,081234567890,O",
  "A1,Siti Aminah,,P,Semarang,1988-09-03,Islam,Kawin,Istri,SMA,Ibu Rumah Tangga,081234567891,B",
].join("\r\n");

const HEADER_ALIASES: Record<string, (typeof TEMPLATE_HEADERS)[number]> = {
  "no_rumah": "no_rumah",
  "no rumah": "no_rumah",
  "rumah": "no_rumah",
  "nama_lengkap": "nama_lengkap",
  "nama lengkap": "nama_lengkap",
  "nama": "nama_lengkap",
  "nik": "nik",
  "jenis_kelamin": "jenis_kelamin",
  "jenis kelamin": "jenis_kelamin",
  "jk": "jenis_kelamin",
  "tempat_lahir": "tempat_lahir",
  "tempat lahir": "tempat_lahir",
  "tanggal_lahir": "tanggal_lahir",
  "tanggal lahir": "tanggal_lahir",
  "tgl_lahir": "tanggal_lahir",
  "tgl lahir": "tanggal_lahir",
  "agama": "agama",
  "status_perkawinan": "status_perkawinan",
  "status perkawinan": "status_perkawinan",
  "status_kawin": "status_perkawinan",
  "status kawin": "status_perkawinan",
  "hubungan_keluarga": "hubungan_keluarga",
  "hubungan keluarga": "hubungan_keluarga",
  "hubungan": "hubungan_keluarga",
  "pendidikan_terakhir": "pendidikan_terakhir",
  "pendidikan terakhir": "pendidikan_terakhir",
  "pendidikan": "pendidikan_terakhir",
  "pekerjaan": "pekerjaan",
  "no_hp": "no_hp",
  "no hp": "no_hp",
  "hp": "no_hp",
  "telepon": "no_hp",
  "golongan_darah": "golongan_darah",
  "golongan darah": "golongan_darah",
  "gol_darah": "golongan_darah",
  "gol darah": "golongan_darah",
};

const REQUIRED_HEADERS = [
  "no_rumah",
  "nama_lengkap",
  "jenis_kelamin",
  "tanggal_lahir",
  "agama",
  "status_perkawinan",
  "hubungan_keluarga",
] as const;

const AGAMA: readonly Agama[] = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"];
const STATUS_KAWIN: readonly StatusPerkawinan[] = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];
const HUBUNGAN: readonly HubunganKeluarga[] = [
  "Kepala Keluarga", "Istri", "Anak", "Orang Tua",
  "Mertua", "Menantu", "Cucu", "Famili Lain", "Lainnya",
];
const GOLONGAN_DARAH = ["A", "B", "AB", "O", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

function detectDelimiter(headerLine: string): "," | ";" {
  let inQuotes = false;
  let commas = 0;
  let semicolons = 0;
  for (const ch of headerLine) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch === ",") commas++;
    else if (!inQuotes && ch === ";") semicolons++;
  }
  return semicolons > commas ? ";" : ",";
}

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const headerLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(headerLine);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseDate(value: string): string | null {
  const s = value.trim();
  let y: number, m: number, d: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else if (local) {
    d = Number(local[1]);
    m = Number(local[2]);
    y = Number(local[3]);
  } else {
    return null;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function matchEnum<T extends string>(value: string, options: readonly T[]): T | null {
  const v = norm(value);
  return options.find((option) => norm(option) === v) ?? null;
}

function parseKelamin(value: string): JenisKelamin | null {
  const v = norm(value);
  if (["l", "lk", "laki-laki", "laki laki", "pria", "male"].includes(v)) return "L";
  if (["p", "pr", "perempuan", "wanita", "female"].includes(v)) return "P";
  return null;
}

function parseHubungan(value: string): HubunganKeluarga | null {
  const v = norm(value);
  if (v === "kk") return "Kepala Keluarga";
  return matchEnum(value, HUBUNGAN);
}

function parseStatusKawin(value: string): StatusPerkawinan | null {
  const v = norm(value);
  if (v === "belum menikah" || v === "single") return "Belum Kawin";
  if (v === "menikah") return "Kawin";
  return matchEnum(value, STATUS_KAWIN);
}

function parseNoHp(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  const normalized = digits.startsWith("62") ? `0${digits.slice(2)}` : digits;
  if (!/^0\d{8,13}$/.test(normalized)) return null;
  return normalized;
}

function orNull(value: string): string | null {
  const v = value.trim();
  return v === "" ? null : v;
}

export function buildWargaImportPreview(
  text: string,
  rumahList: RumahWithWarga[]
): ImportPreview {
  const table = parseCsv(text);
  if (table.length === 0) {
    return { fatal: "File kosong.", rows: [], total: 0, okCount: 0, skipCount: 0, errorCount: 0 };
  }

  const rawHeader = (table[0] ?? []).map((h) => norm(h));
  const columns: Partial<Record<(typeof TEMPLATE_HEADERS)[number], number>> = {};
  rawHeader.forEach((header, index) => {
    const canonical = HEADER_ALIASES[header];
    if (canonical && columns[canonical] === undefined) columns[canonical] = index;
  });

  const missing = REQUIRED_HEADERS.filter((h) => columns[h] === undefined);
  if (missing.length > 0) {
    return {
      fatal: `Kolom wajib tidak ditemukan: ${missing.join(", ")}. Unduh template untuk format yang benar.`,
      rows: [],
      total: 0,
      okCount: 0,
      skipCount: 0,
      errorCount: 0,
    };
  }

  const rumahByNo = new Map(rumahList.map((r) => [norm(r.no_rumah), r]));
  const existingNik = new Set(
    rumahList.flatMap((r) =>
      r.warga_detail.filter((w) => w.is_active && w.nik).map((w) => w.nik as string)
    )
  );
  const existingName = new Set(
    rumahList.flatMap((r) =>
      r.warga_detail
        .filter((w) => w.is_active)
        .map((w) => `${r.id}|${norm(w.nama_lengkap)}`)
    )
  );
  const kepalaKeluarga = new Map(
    rumahList.flatMap((r) =>
      r.warga_detail
        .filter((w) => w.is_active && w.hubungan_keluarga === "Kepala Keluarga")
        .map((w) => [r.id, w.nama_lengkap] as const)
    )
  );
  const seenNik = new Map<string, number>();
  const seenName = new Map<string, number>();
  const today = todayISO();

  const rows: ImportRow[] = [];

  for (let r = 1; r < table.length; r++) {
    const cells = table[r] ?? [];
    const line = r + 1;
    const get = (key: (typeof TEMPLATE_HEADERS)[number]) => {
      const idx = columns[key];
      return idx === undefined ? "" : (cells[idx] ?? "").trim();
    };

    if (cells.every((c) => c.trim() === "")) continue;

    const nama = get("nama_lengkap");
    const noRumah = get("no_rumah");
    const messages: string[] = [];
    const state = { status: "ok" as ImportRowStatus };
    const fail = (msg: string) => {
      state.status = "error";
      messages.push(msg);
    };
    const skip = (msg: string) => {
      if (state.status !== "error") state.status = "skip";
      messages.push(msg);
    };

    const rumah = rumahByNo.get(norm(noRumah));
    if (!noRumah) fail("No. rumah wajib diisi.");
    else if (!rumah) fail(`Rumah "${noRumah}" tidak ditemukan.`);

    if (!nama) fail("Nama lengkap wajib diisi.");
    else if (nama.length > 100) fail("Nama lengkap maksimal 100 karakter.");

    const kelamin = parseKelamin(get("jenis_kelamin"));
    if (!kelamin) fail('Jenis kelamin harus L/P (boleh "Laki-laki"/"Perempuan").');

    const tanggalLahir = parseDate(get("tanggal_lahir"));
    if (!tanggalLahir) fail("Tanggal lahir tidak valid (gunakan YYYY-MM-DD atau DD/MM/YYYY).");
    else if (tanggalLahir > today) fail("Tanggal lahir tidak boleh di masa depan.");

    const agama = matchEnum(get("agama"), AGAMA);
    if (!agama) fail(`Agama tidak dikenal. Pilihan: ${AGAMA.join(", ")}.`);

    const statusKawin = parseStatusKawin(get("status_perkawinan"));
    if (!statusKawin) fail(`Status perkawinan tidak dikenal. Pilihan: ${STATUS_KAWIN.join(", ")}.`);

    const hubungan = parseHubungan(get("hubungan_keluarga"));
    if (!hubungan) fail(`Hubungan keluarga tidak dikenal. Pilihan: ${HUBUNGAN.join(", ")}.`);

    const nikRaw = get("nik").replace(/\s/g, "");
    let nik: string | null = null;
    if (nikRaw) {
      if (!/^\d{16}$/.test(nikRaw)) fail("NIK harus 16 digit angka.");
      else nik = nikRaw;
    }

    const hpRaw = get("no_hp");
    const noHp = parseNoHp(hpRaw);
    if (hpRaw && !noHp) fail("No. HP tidak valid (contoh: 081234567890).");

    const golRaw = get("golongan_darah").toUpperCase().replace(/\s/g, "");
    if (golRaw && !GOLONGAN_DARAH.includes(golRaw)) {
      fail(`Golongan darah tidak dikenal. Pilihan: ${GOLONGAN_DARAH.join(", ")}.`);
    }

    const tempatLahir = orNull(get("tempat_lahir"));
    if (tempatLahir && tempatLahir.length > 50) fail("Tempat lahir maksimal 50 karakter.");
    const pendidikan = orNull(get("pendidikan_terakhir"));
    if (pendidikan && pendidikan.length > 30) fail("Pendidikan maksimal 30 karakter.");
    const pekerjaan = orNull(get("pekerjaan"));
    if (pekerjaan && pekerjaan.length > 50) fail("Pekerjaan maksimal 50 karakter.");

    if (state.status !== "error" && rumah && nama) {
      if (nik) {
        const firstLine = seenNik.get(nik);
        if (firstLine !== undefined) {
          skip(`NIK sama dengan baris ${firstLine}.`);
        } else if (existingNik.has(nik)) {
          skip("NIK sudah terdaftar sebagai anggota aktif.");
        }
        seenNik.set(nik, seenNik.get(nik) ?? line);
      }

      const nameKey = `${rumah.id}|${norm(nama)}`;
      const firstLine = seenName.get(nameKey);
      if (firstLine !== undefined) {
        skip(`Nama sama dengan baris ${firstLine} di rumah yang sama.`);
      } else if (existingName.has(nameKey)) {
        skip(`Nama "${nama}" sudah terdaftar di rumah ${rumah.no_rumah}.`);
      }
      seenName.set(nameKey, seenName.get(nameKey) ?? line);

      if (state.status === "ok" && hubungan === "Kepala Keluarga") {
        const kk = kepalaKeluarga.get(rumah.id);
        if (kk) {
          skip(`Rumah ${rumah.no_rumah} sudah punya Kepala Keluarga aktif (${kk}).`);
        } else {
          kepalaKeluarga.set(rumah.id, nama);
        }
      }
    }

    const row: ImportRow = { line, nama, noRumah, status: state.status, messages };
    if (state.status === "ok" && rumah) {
      row.payload = {
        rumah_id: rumah.id,
        nik,
        nama_lengkap: nama,
        jenis_kelamin: kelamin as JenisKelamin,
        tempat_lahir: tempatLahir,
        tanggal_lahir: tanggalLahir as string,
        agama: agama as Agama,
        status_perkawinan: statusKawin as StatusPerkawinan,
        hubungan_keluarga: hubungan as HubunganKeluarga,
        pendidikan_terakhir: pendidikan,
        pekerjaan,
        no_hp: noHp,
        golongan_darah: golRaw || null,
      };
    }
    rows.push(row);
  }

  return {
    rows,
    total: rows.length,
    okCount: rows.filter((r) => r.status === "ok").length,
    skipCount: rows.filter((r) => r.status === "skip").length,
    errorCount: rows.filter((r) => r.status === "error").length,
  };
}
