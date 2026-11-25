import { describe, expect, it, vi } from "vitest";

// services.ts membuat klien Supabase saat modul dimuat; engine tagihan sendiri
// murni dan tidak menyentuh jaringan, jadi klien cukup di-stub.
vi.mock("@/shared/lib/supabase", () => ({ supabase: {} }));

import { hitungTagihan } from "./services";
import type { KeanggotaanArisan } from "./services";
import type { PeriodeHunianRingkas } from "@/shared/lib/hunian";

type Params = Parameters<typeof hitungTagihan>[0];

function hitung(overrides: Partial<Params> = {}) {
  return hitungTagihan({
    noRumah: "A1",
    statusHunian: "Tetap",
    tahun: 2026,
    bulanSekarang: 11,
    kasRows: [],
    keanggotaanArisan: [],
    mulaiKasIbu: null,
    periodeHunian: [],
    ...overrides,
  });
}

function rincianTipe(
  hasil: ReturnType<typeof hitung>,
  tipe: "Bapak" | "Ibu" | "Arisan"
) {
  return hasil.tahunList
    .flatMap((t) => t.rincian)
    .filter((r) => r.tipe === tipe);
}

const RONDE_SEP3: KeanggotaanArisan = {
  mulaiTahun: 2026,
  mulaiBulan: 9,
  jumlahAnggota: 3,
};

describe("hitungTagihan", () => {
  it("menghitung Kas Ibu lintas tahun dan memisahkan tunggakan tahun lalu", () => {
    const hasil = hitung({ tahun: 2027, bulanSekarang: 3 });

    expect(hasil.wajibBayar).toBe(true);
    expect(hasil.tahun).toBe(2027);
    // 2026 hanya program mulai Agustus; 2027 Jan–Mar.
    expect(hasil.tahunList.map((t) => t.tahun)).toEqual([2027, 2026]);

    const [tahunIni, tahunLalu] = hasil.tahunList;
    expect(tahunIni?.totalKurang).toBe(3);
    expect(tahunIni?.totalNominalKurang).toBe(60_000);
    expect(tahunLalu?.totalKurang).toBe(5);
    expect(tahunLalu?.totalNominalKurang).toBe(100_000);
    expect(tahunIni?.detailPerBulan).toHaveLength(3);

    expect(hasil.totalKurang).toBe(8);
    expect(hasil.totalNominalKurang).toBe(160_000);
    expect(hasil.adaTunggakanTahunLalu).toBe(true);
    expect(hasil.nominalTunggakanTahunLalu).toBe(100_000);

    // Kas Bapak belum berjalan (mulai_program null) → tidak pernah ditagih.
    expect(rincianTipe(hasil, "Bapak")).toHaveLength(0);
  });

  it("mengurangi tagihan berdasarkan setoran lunas dan mengabaikan setoran batal", () => {
    const hasil = hitung({
      kasRows: [
        { tipe_kas: "Ibu", tahun: 2026, bulan: 8, status_bayar: true },
        { tipe_kas: "Ibu", tahun: 2026, bulan: 9, status_bayar: false },
        { tipe_kas: "Arisan", tahun: 2026, bulan: 9, status_bayar: true },
      ],
      keanggotaanArisan: [RONDE_SEP3],
    });

    const ibu = hasil.tahunList[0]?.rincian.find((r) => r.tipe === "Ibu");
    expect(ibu).toMatchObject({
      bulanWajib: 4,
      jumlahLunas: 1,
      jumlahKurang: 3,
      nominalKurang: 60_000,
    });

    const arisan = hasil.tahunList[0]?.rincian.find((r) => r.tipe === "Arisan");
    expect(arisan).toMatchObject({
      bulanWajib: 3,
      jumlahLunas: 1,
      jumlahKurang: 2,
      nominalKurang: 40_000,
    });

    expect(hasil.totalNominalKurang).toBe(100_000);
  });

  it("menggabungkan jendela ronde tanpa menghitung bulan dobel", () => {
    const hasil = hitung({
      tahun: 2027,
      bulanSekarang: 1,
      keanggotaanArisan: [
        { mulaiTahun: 2026, mulaiBulan: 9, jumlahAnggota: 2 }, // Sep–Okt
        { mulaiTahun: 2026, mulaiBulan: 10, jumlahAnggota: 2 }, // Okt–Nov (tumpang tindih)
        { mulaiTahun: 2026, mulaiBulan: 11, jumlahAnggota: 3 }, // Nov–Jan
      ],
    });

    // Union: Sep, Okt, Nov, Des 2026 + Jan 2027 = 5 bulan.
    expect(
      rincianTipe(hasil, "Arisan").reduce((s, r) => s + r.bulanWajib, 0)
    ).toBe(5);
    expect(
      rincianTipe(hasil, "Arisan").reduce((s, r) => s + r.nominalKurang, 0)
    ).toBe(100_000);
  });

  it("menggeser awal ronde ke mulai program arisan", () => {
    const hasil = hitung({
      keanggotaanArisan: [
        { mulaiTahun: 2026, mulaiBulan: 1, jumlahAnggota: 2 },
      ],
    });

    // Program arisan mulai Sep 2026, jadi jendela menjadi Sep–Okt.
    const arisan = hasil.tahunList[0]?.rincian.find((r) => r.tipe === "Arisan");
    expect(arisan?.bulanWajib).toBe(2);
    expect(arisan?.nominalKurang).toBe(40_000);
  });

  it("mengabaikan keanggotaan ronde tanpa anggota", () => {
    const hasil = hitung({
      keanggotaanArisan: [
        { mulaiTahun: 2026, mulaiBulan: 9, jumlahAnggota: 0 },
      ],
    });

    expect(rincianTipe(hasil, "Arisan")).toHaveLength(0);
    expect(hasil.tahunList[0]?.rincian.map((r) => r.tipe)).toEqual(["Ibu"]);
  });

  it("berhenti menagih bulan saat rumah kosong tanpa menghapus tunggakan lama", () => {
    const periodeHunian: PeriodeHunianRingkas[] = [
      {
        tanggal_mulai: "2026-08-01",
        tanggal_selesai: "2026-10-15",
        tunggakan_dialihkan: true,
      },
    ];

    const hasil = hitung({
      statusHunian: "Kosong",
      keanggotaanArisan: [RONDE_SEP3],
      periodeHunian,
    });

    expect(hasil.wajibBayar).toBe(true);
    // Agustus & September masih dihuni; Oktober (tanggal kosong) tidak ditagih.
    const ibu = hasil.tahunList[0]?.rincian.find((r) => r.tipe === "Ibu");
    expect(ibu?.bulanWajib).toBe(2);
    expect(ibu?.nominalKurang).toBe(40_000);

    const arisan = hasil.tahunList[0]?.rincian.find((r) => r.tipe === "Arisan");
    expect(arisan?.bulanWajib).toBe(1);
    expect(arisan?.nominalKurang).toBe(20_000);

    expect(hasil.tahunList[0]?.detailPerBulan.map((d) => d.bulan)).toEqual([
      8, 9,
    ]);
  });

  it("tidak menagih rumah kosong yang belum punya riwayat hunian", () => {
    const hasil = hitung({ statusHunian: "Kosong" });

    expect(hasil.found).toBe(true);
    expect(hasil.wajibBayar).toBe(false);
    expect(hasil.tahunList).toHaveLength(0);
    expect(hasil.totalNominalKurang).toBe(0);
  });

  it("tidak mengalihkan tunggakan saat huni ulang tanpa pengalihan", () => {
    const periodeHunian: PeriodeHunianRingkas[] = [
      {
        tanggal_mulai: "2026-08-01",
        tanggal_selesai: "2026-10-15",
        tunggakan_dialihkan: true,
      },
      {
        tanggal_mulai: "2027-01-01",
        tanggal_selesai: null,
        tunggakan_dialihkan: false,
      },
    ];

    const hasil = hitung({
      tahun: 2027,
      bulanSekarang: 2,
      periodeHunian,
    });

    expect(hasil.tahunList.map((t) => t.tahun)).toEqual([2027]);
    expect(hasil.totalKurang).toBe(2);
    expect(hasil.totalNominalKurang).toBe(40_000);
    expect(hasil.adaTunggakanTahunLalu).toBe(false);
  });

  it("menggeser awal Kas Ibu per rumah tetapi tidak memundurkannya", () => {
    const terlambat = hitung({ mulaiKasIbu: "2026-10" });
    expect(terlambat.tahunList[0]?.totalKurang).toBe(2);
    expect(terlambat.totalNominalKurang).toBe(40_000);

    const lebihAwal = hitung({ mulaiKasIbu: "2026-01" });
    expect(lebihAwal.tahunList[0]?.totalKurang).toBe(4);
    expect(lebihAwal.totalNominalKurang).toBe(80_000);
  });

  it("tidak menagih bulan setelah bulan berjalan di tahun berjalan", () => {
    const hasil = hitung({ tahun: 2026, bulanSekarang: 9 });
    expect(hasil.tahunList[0]?.detailPerBulan.map((d) => d.bulan)).toEqual([
      8, 9,
    ]);
    expect(hasil.totalKurang).toBe(2);
  });
});
