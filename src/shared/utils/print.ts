import { RT_CONFIG } from "@/shared/lib/constants";

const BULAN_ROMAWI = [
  "", "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII",
];

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function openPrintWindow(title: string, body: string) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Popup diblokir oleh browser. Izinkan popup untuk mencetak.");
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 portrait; margin: 2cm 2.5cm; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
    }
    .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
    .kop h1 { font-size: 14pt; font-weight: bold; letter-spacing: 1px; }
    .kop h2 { font-size: 16pt; font-weight: bold; }
    .kop p { font-size: 10pt; }
    .judul-surat { text-align: center; margin: 20px 0; }
    .judul-surat h3 { font-size: 14pt; text-decoration: underline; font-weight: bold; }
    .judul-surat p { font-size: 11pt; }
    .isi { margin: 20px 0; text-align: justify; }
    .isi p { margin-bottom: 10px; text-indent: 40px; }
    .isi table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .isi table.data-warga td { padding: 3px 0; vertical-align: top; }
    .isi table.data-warga td:first-child { width: 180px; }
    .isi table.data-warga td:nth-child(2) { width: 15px; text-align: center; }
    .ttd { margin-top: 40px; }
    .ttd-container { float: right; width: 250px; text-align: center; }
    .ttd-container .tempat-ttd { margin-top: 80px; }
    .clear { clear: both; }

    table.laporan { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table.laporan th, table.laporan td { border: 1px solid #000; padding: 6px 10px; font-size: 11pt; }
    table.laporan th { background: #f0f0f0; font-weight: bold; text-align: center; }
    table.laporan td.angka { text-align: right; font-family: "Courier New", monospace; }
    table.laporan td.center { text-align: center; }
    table.laporan tfoot td { font-weight: bold; }

    .header-laporan { margin-bottom: 20px; }
    .header-laporan h3 { font-size: 14pt; text-align: center; font-weight: bold; }
    .header-laporan p { text-align: center; font-size: 11pt; }

    .footer-cetak { margin-top: 30px; font-size: 9pt; color: #666; text-align: right; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${body}
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
  win.document.close();
}

function kopSurat() {
  return `
    <div class="kop">
      <h1>RUKUN TETANGGA ${RT_CONFIG.nama_rt}</h1>
      <h2>DESA ${RT_CONFIG.nama_desa.toUpperCase()}</h2>
      <p>Kecamatan ${RT_CONFIG.kecamatan}, Kabupaten ${RT_CONFIG.kabupaten}, Provinsi ${RT_CONFIG.provinsi}</p>
    </div>`;
}

function tanggalIndonesia(date: string | Date) {
  const d = new Date(date);
  return `${d.getDate()} ${BULAN_NAMA[d.getMonth() + 1]} ${d.getFullYear()}`;
}

function formatRupiahPlain(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface SuratPengantarData {
  nomor_surat: string;
  jenis_surat: string;
  nama_lengkap: string;
  nik?: string | null;
  jenis_kelamin?: string;
  tempat_lahir?: string | null;
  tanggal_lahir?: string;
  agama?: string;
  pekerjaan?: string | null;
  alamat?: string;
  keperluan: string;
  tujuan?: string | null;
}

export function cetakSuratPengantar(data: SuratPengantarData) {
  const today = new Date();
  const kodeJenis = getKodeSurat(data.jenis_surat);

  const body = `
    ${kopSurat()}

    <div class="judul-surat">
      <h3>SURAT ${data.jenis_surat.toUpperCase()}</h3>
      <p>Nomor: ${data.nomor_surat || `___/${kodeJenis}/${BULAN_ROMAWI[today.getMonth() + 1]}/${today.getFullYear()}`}</p>
    </div>

    <div class="isi">
      <p>Yang bertanda tangan di bawah ini, Ketua ${RT_CONFIG.nama_rt} Desa ${RT_CONFIG.nama_desa}, Kecamatan ${RT_CONFIG.kecamatan}, Kabupaten ${RT_CONFIG.kabupaten}, dengan ini menerangkan bahwa:</p>

      <table class="data-warga">
        <tr><td>Nama Lengkap</td><td>:</td><td><strong>${data.nama_lengkap}</strong></td></tr>
        ${data.nik ? `<tr><td>NIK</td><td>:</td><td>${data.nik}</td></tr>` : ""}
        ${data.jenis_kelamin ? `<tr><td>Jenis Kelamin</td><td>:</td><td>${data.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</td></tr>` : ""}
        ${data.tempat_lahir && data.tanggal_lahir ? `<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>${data.tempat_lahir}, ${tanggalIndonesia(data.tanggal_lahir)}</td></tr>` : ""}
        ${data.agama ? `<tr><td>Agama</td><td>:</td><td>${data.agama}</td></tr>` : ""}
        ${data.pekerjaan ? `<tr><td>Pekerjaan</td><td>:</td><td>${data.pekerjaan}</td></tr>` : ""}
        <tr><td>Alamat</td><td>:</td><td>${data.alamat || `${RT_CONFIG.nama_rt}, Desa ${RT_CONFIG.nama_desa}, Kec. ${RT_CONFIG.kecamatan}`}</td></tr>
      </table>

      <p>Adalah benar warga kami yang berdomisili di wilayah ${RT_CONFIG.nama_rt} Desa ${RT_CONFIG.nama_desa}.</p>

      <p>Surat ini dibuat untuk keperluan: <strong>${data.keperluan}</strong>${data.tujuan ? `, ditujukan kepada <strong>${data.tujuan}</strong>` : ""}.</p>

      <p>Demikian surat pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
    </div>

    <div class="ttd">
      <div class="ttd-container">
        <p>${RT_CONFIG.nama_desa}, ${tanggalIndonesia(today)}</p>
        <p>Ketua ${RT_CONFIG.nama_rt}</p>
        <p class="tempat-ttd">( ${RT_CONFIG.nama_ketua_rt || "..........................."} )</p>
      </div>
      <div class="clear"></div>
    </div>
  `;

  openPrintWindow(`Surat ${data.jenis_surat} - ${data.nama_lengkap}`, body);
}

function getKodeSurat(jenis: string): string {
  const map: Record<string, string> = {
    "Pengantar KTP": "SPK",
    "Pengantar KK": "SPKK",
    "Domisili": "SKD",
    "Keterangan Usaha": "SKU",
    "Keterangan Tidak Mampu": "SKTM",
    "Pengantar SKCK": "SKCK",
    "Keterangan Kematian": "SKK",
    "Keterangan Pindah": "SKP",
    "Lainnya": "SP",
  };
  return map[jenis] ?? "SP";
}

export interface LaporanKeuanganData {
  bulan: number;
  tahun: number;
  kasBapak: { noRumah: string; jumlah: number; status: boolean }[];
  kasIbu: { noRumah: string; jumlah: number; status: boolean }[];
  pengeluaran: { tanggal: string; kategori: string; keterangan: string; nominal: number }[];
  saldo: {
    kas_bapak_masuk: number;
    kas_ibu_masuk: number;
    jimpitan_masuk: number;
    iuran_insidental_masuk: number;
    total_pengeluaran: number;
  };
}

export function cetakLaporanKeuangan(data: LaporanKeuanganData) {
  const totalMasuk =
    data.saldo.kas_bapak_masuk +
    data.saldo.kas_ibu_masuk +
    data.saldo.jimpitan_masuk +
    data.saldo.iuran_insidental_masuk;
  const saldoAkhir = totalMasuk - data.saldo.total_pengeluaran;

  const kasBapakRows = data.kasBapak
    .map(
      (k, i) =>
        `<tr>
          <td class="center">${i + 1}</td>
          <td>${k.noRumah}</td>
          <td class="angka">${formatRupiahPlain(k.jumlah)}</td>
          <td class="center">${k.status ? "Lunas" : "Belum"}</td>
        </tr>`
    )
    .join("");

  const totalKasBapak = data.kasBapak
    .filter((k) => k.status)
    .reduce((s, k) => s + k.jumlah, 0);

  const kasIbuRows = data.kasIbu
    .map(
      (k, i) =>
        `<tr>
          <td class="center">${i + 1}</td>
          <td>${k.noRumah}</td>
          <td class="angka">${formatRupiahPlain(k.jumlah)}</td>
          <td class="center">${k.status ? "Lunas" : "Belum"}</td>
        </tr>`
    )
    .join("");

  const totalKasIbu = data.kasIbu
    .filter((k) => k.status)
    .reduce((s, k) => s + k.jumlah, 0);

  const pengeluaranRows = data.pengeluaran
    .map(
      (p, i) =>
        `<tr>
          <td class="center">${i + 1}</td>
          <td>${tanggalIndonesia(p.tanggal)}</td>
          <td>${p.kategori}</td>
          <td>${p.keterangan}</td>
          <td class="angka">${formatRupiahPlain(p.nominal)}</td>
        </tr>`
    )
    .join("");

  const body = `
    ${kopSurat()}

    <div class="header-laporan">
      <h3>LAPORAN KEUANGAN</h3>
      <p>Periode: ${BULAN_NAMA[data.bulan]} ${data.tahun}</p>
    </div>

    <h4 style="margin-top:20px;">A. Kas Bulanan Bapak-Bapak</h4>
    <table class="laporan">
      <thead>
        <tr><th>No</th><th>No. Rumah</th><th>Jumlah</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${kasBapakRows || '<tr><td colspan="4" class="center">Belum ada data</td></tr>'}
      </tbody>
      <tfoot>
        <tr><td colspan="2" style="text-align:right"><strong>Total Lunas:</strong></td><td class="angka">${formatRupiahPlain(totalKasBapak)}</td><td></td></tr>
      </tfoot>
    </table>

    <h4 style="margin-top:20px;">B. Kas Bulanan Ibu-Ibu</h4>
    <table class="laporan">
      <thead>
        <tr><th>No</th><th>No. Rumah</th><th>Jumlah</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${kasIbuRows || '<tr><td colspan="4" class="center">Belum ada data</td></tr>'}
      </tbody>
      <tfoot>
        <tr><td colspan="2" style="text-align:right"><strong>Total Lunas:</strong></td><td class="angka">${formatRupiahPlain(totalKasIbu)}</td><td></td></tr>
      </tfoot>
    </table>

    ${
      data.pengeluaran.length > 0
        ? `
    <h4 style="margin-top:20px;">C. Pengeluaran</h4>
    <table class="laporan">
      <thead>
        <tr><th>No</th><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th>Nominal</th></tr>
      </thead>
      <tbody>${pengeluaranRows}</tbody>
      <tfoot>
        <tr><td colspan="4" style="text-align:right"><strong>Total Pengeluaran:</strong></td><td class="angka">${formatRupiahPlain(data.saldo.total_pengeluaran)}</td></tr>
      </tfoot>
    </table>`
        : ""
    }

    <h4 style="margin-top:25px;">Ringkasan</h4>
    <table class="laporan">
      <tbody>
        <tr><td>Kas Bapak Masuk</td><td class="angka">${formatRupiahPlain(data.saldo.kas_bapak_masuk)}</td></tr>
        <tr><td>Kas Ibu Masuk</td><td class="angka">${formatRupiahPlain(data.saldo.kas_ibu_masuk)}</td></tr>
        <tr><td>Jimpitan Masuk</td><td class="angka">${formatRupiahPlain(data.saldo.jimpitan_masuk)}</td></tr>
        <tr><td>Iuran Insidental Masuk</td><td class="angka">${formatRupiahPlain(data.saldo.iuran_insidental_masuk)}</td></tr>
        <tr style="border-top:2px solid #000"><td><strong>Total Pemasukan</strong></td><td class="angka"><strong>${formatRupiahPlain(totalMasuk)}</strong></td></tr>
        <tr><td>Total Pengeluaran</td><td class="angka">${formatRupiahPlain(data.saldo.total_pengeluaran)}</td></tr>
        <tr style="border-top:2px solid #000"><td><strong>Saldo Akhir</strong></td><td class="angka"><strong>${formatRupiahPlain(saldoAkhir)}</strong></td></tr>
      </tbody>
    </table>

    <div class="ttd">
      <div class="ttd-container">
        <p>${RT_CONFIG.nama_desa}, ${tanggalIndonesia(new Date())}</p>
        <p>Bendahara ${RT_CONFIG.nama_rt}</p>
        <p class="tempat-ttd">( ........................... )</p>
      </div>
      <div class="clear"></div>
    </div>

    <div class="footer-cetak">Dicetak pada: ${new Date().toLocaleString("id-ID")}</div>
  `;

  openPrintWindow(
    `Laporan Keuangan ${BULAN_NAMA[data.bulan]} ${data.tahun}`,
    body
  );
}
