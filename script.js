// script.js – FINAL & 100% BERJALAN

let transaksi = JSON.parse(localStorage.getItem('tura_transaksi') || '[]');
let tabunganUsaha = parseInt(localStorage.getItem('tura_tabungan') || '0');
let riwayatTabungan = JSON.parse(localStorage.getItem('tura_riwayat_tabungan') || '[]');

const kategoriIncome  = ['Penjualan', 'Jasa', 'Piutang', 'Lain-lain'];
const kategoriExpense = ['Bahan Baku', 'Operasional', 'Gaji', 'Listrik/Air', 'Sewa', 'Lain-lain'];

function simpanSemua() {
  localStorage.setItem('tura_transaksi', JSON.stringify(transaksi));
  localStorage.setItem('tura_tabungan', tabunganUsaha);
  localStorage.setItem('tura_riwayat_tabungan', JSON.stringify(riwayatTabungan));
}

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function updateAll() {
  const now = new Date();
  const bulanIni = now.getMonth();
  const tahunIni = now.getFullYear();

  let incomeBulan = 0, expenseBulan = 0, saldoOperasional = 0;
  const dailySaldo = Array(30).fill(0);
  let kumulatif = 0;

  transaksi.forEach(t => {
    const tgl = new Date(t.tanggal);
    const hariKe = Math.floor((now - tgl) / (1000 * 60 * 60 * 24));

    // Saldo operasional
    saldoOperasional += t.tipe === 'income' ? t.jumlah : -t.jumlah;

    // Bulan ini
    if (tgl.getMonth() === bulanIni && tgl.getFullYear() === tahunIni) {
      if (t.tipe === 'income') incomeBulan += t.jumlah;
      else expenseBulan += t.jumlah;
    }

    // Grafik 30 hari
    if (hariKe >= 0 && hariKe < 30) {
      const nilai = t.tipe === 'income' ? t.jumlah : -t.jumlah;
      kumulatif += nilai;
      dailySaldo[29 - hariKe] = kumulatif;
    }
  });

  // Update dashboard
  document.getElementById('incomeMonth').textContent = formatRupiah(incomeBulan);
  document.getElementById('expenseMonth').textContent = formatRupiah(expenseBulan);
  document.getElementById('tabunganUsaha').textContent = formatRupiah(tabunganUsaha);
  document.getElementById('saldoOperasional').textContent = formatRupiah(saldoOperasional);
  document.getElementById('saldoTabunganBesar').textContent = formatRupiah(tabunganUsaha);

  // Grafik
  const chart = document.getElementById('chartBars');
  chart.innerHTML = '';
  dailySaldo.forEach(val => {
    const bar = document.createElement('div');
    bar.className = 'bar ' + (val >= 0 ? 'income' : 'expense');
    const tinggi = Math.abs(val) / 50000 * 180 + 10;
    bar.style.height = (tinggi > 200 ? 200 : tinggi) + 'px';
    chart.appendChild(bar);
  });

  renderLaporan();
  renderRiwayatTabungan();
}

// Kategori otomatis
document.getElementById('tipe').addEventListener('change', function () {
  const kat = document.getElementById('kategori');
  kat.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
  const list = this.value === 'income' ? kategoriIncome : kategoriExpense;
  list.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k; opt.textContent = k;
    kat.appendChild(opt);
  });
});

// Transaksi harian
document.getElementById('formTransaksi').onsubmit = function (e) {
  e.preventDefault();
  const data = {
    tipe: document.getElementById('tipe').value,
    tanggal: document.getElementById('tanggal').value,
    kategori: document.getElementById('kategori').value,
    keterangan: document.getElementById('keterangan').value.trim(),
    jumlah: parseInt(document.getElementById('jumlah').value)
  };
  transaksi.push(data);
  simpanSemua();
  this.reset();
  updateAll();
  alert('Transaksi berhasil disimpan!');
};

// Tabungan
document.getElementById('formTabungan').onsubmit = function (e) {
  e.preventDefault();
  const aksi = document.getElementById('aksiTabungan').value;
  const jumlah = parseInt(document.getElementById('jumlahTabungan').value);
  const ket = document.getElementById('ketTabungan').value.trim();

  if (jumlah < 1000) return alert('Minimal Rp 1.000');
  if (aksi === 'tarik' && jumlah > tabunganUsaha) return alert('Saldo tidak cukup!');

  if (aksi === 'setor') tabunganUsaha += jumlah;
  else tabunganUsaha -= jumlah;

  riwayatTabungan.push({ tipe: aksi, jumlah, keterangan: ket || '-', tanggal: new Date().toISOString() });
  simpanSemua();
  document.getElementById('jumlahTabungan').value = '';
  document.getElementById('ketTabungan').value = '';
  updateAll();
  alert(aksi === 'setor' ? 'Setoran berhasil!' : 'Penarikan berhasil!');
};

function renderRiwayatTabungan() {
  const cont = document.getElementById('riwayatTabungan');
  cont.innerHTML = riwayatTabungan.length === 0 
    ? '<p class="empty">Belum ada riwayat tabungan</p>'
    : '';
  riwayatTabungan.slice().reverse().forEach(r => {
    const div = document.createElement('div');
    div.innerHTML = `<div class="info"><strong>${r.tipe === 'setor' ? 'Setor' : 'Tarik'} Tabungan</strong><br>
      <small>${new Date(r.tanggal).toLocaleDateString('id-ID')} • ${r.keterangan}</small></div>
      <div class="amount ${r.tipe === 'setor' ? 'income' : 'expense'}">
        ${r.tipe === 'setor' ? '+' : '-'} ${formatRupiah(r.jumlah)}
      </div>`;
    cont.appendChild(div);
  });
}

// ===================================================================
//                    FUNGSI LAPORAN YANG DIUBAH
// ===================================================================
function renderLaporan() {
  const cont = document.getElementById('listTransaksi');
  cont.innerHTML = transaksi.length === 0 
    ? '<p class="empty">Belum ada transaksi</p>'
    : '';

  // Gunakan forEach dengan index untuk mendapatkan index asli
  transaksi.slice().reverse().forEach((t, i) => {
    const originalIndex = transaksi.length - 1 - i;
    const div = document.createElement('div');
    
    // Ubah struktur HTML untuk menambahkan tombol hapus
    div.innerHTML = `
      <div class="info"><strong>${t.keterangan}</strong><br>
        <small>${new Date(t.tanggal).toLocaleDateString('id-ID')} • ${t.kategori}</small></div>
      <div class="transaction-actions">
        <div class="amount ${t.tipe}">${t.tipe === 'income' ? '+' : '-'} ${formatRupiah(t.jumlah)}</div>
        <button class="delete-btn" data-index="${originalIndex}" title="Hapus Transaksi">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>`;
    cont.appendChild(div);
  });

  // TAMBAHAN: Tambahkan event listener ke tombol hapus yang baru dibuat
  document.querySelectorAll('#listTransaksi .delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const indexToDelete = this.getAttribute('data-index');
      // Tampilkan dialog konfirmasi (bisa diganti dengan custom dialog)
      if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        hapusTransaksi(parseInt(indexToDelete, 10));
      }
    });
  });
}

// TAMBAHAN: Fungsi untuk menghapus transaksi
function hapusTransaksi(index) {
  transaksi.splice(index, 1); // Hapus 1 item dari array pada index tertentu
  simpanSemua(); // Simpan perubahan ke localStorage
  updateAll(); // Perbarui seluruh tampilan
  alert('Transaksi berhasil dihapus!');
}

// Navigasi
document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(n => n.classList.remove('nav-active'));
    document.querySelector(a.getAttribute('href')).classList.add('active');
    a.classList.add('nav-active');
  });
});

// Export CSV
document.getElementById('btnExport').onclick = () => {
  let csv = "Tanggal,Tipe,Kategori,Keterangan,Jumlah\n";
  transaksi.forEach(t => csv += `${t.tanggal},${t.tipe},${t.kategori},"${t.keterangan}",${t.jumlah}\n`);
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Laporan_TURA_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
};

// INIT
document.getElementById('tanggal').valueAsDate = new Date();
updateAll();