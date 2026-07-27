// =========================================================
// KONFIGURASI KONEKSI KE BACKEND (Apps Script Web App)
// =========================================================
// 1. Deploy Code.gs (folder backend-appsscript) sebagai Web App di Apps Script.
// 2. Salin URL "...../exec" yang muncul, tempel di bawah ini.
// 3. Samakan API_KEY dengan SECRET_KEY yang ada di Code.gs.
const API_URL = 'PASTE_URL_WEB_APP_APPS_SCRIPT_DI_SINI';
const API_KEY = 'ganti-kunci-rahasia-ini';

function apiGet(params) {
  const query = Object.assign({ key: API_KEY }, params);
  const qs = Object.keys(query).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(query[k] === undefined || query[k] === null ? '' : query[k]);
  }).join('&');
  return fetch(API_URL + '?' + qs)
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res.success) throw new Error(res.error || 'Terjadi kesalahan API');
      return res.data;
    });
}

function apiPost(payload) {
  payload.key = API_KEY;
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // hindari CORS preflight
    body: JSON.stringify(payload)
  })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res.success) throw new Error(res.error || 'Terjadi kesalahan API');
      return res.data;
    });
}

// =========================================================
// KONFIGURASI MODUL (generik untuk render tabel & form)
// =========================================================
const MODULES = {
  siswa: {
    sheet: 'Siswa', title: 'Data Siswa',
    columns: ['NIS', 'Nama', 'Kelas', 'JenisKelamin', 'TanggalLahir', 'NamaOrtu', 'NoHPOrtu'],
    fields: [
      { key: 'NIS', label: 'NIS', type: 'text', required: true },
      { key: 'Nama', label: 'Nama Lengkap', type: 'text', required: true },
      { key: 'Kelas', label: 'Kelas', type: 'text', required: true },
      { key: 'JenisKelamin', label: 'Jenis Kelamin', type: 'select', options: ['L', 'P'] },
      { key: 'TanggalLahir', label: 'Tanggal Lahir', type: 'date' },
      { key: 'Alamat', label: 'Alamat', type: 'textarea' },
      { key: 'NamaOrtu', label: 'Nama Orang Tua/Wali', type: 'text' },
      { key: 'NoHPOrtu', label: 'No. HP Orang Tua', type: 'text' }
    ]
  },
  absensi: {
    sheet: 'Absensi', title: 'Absensi',
    columns: ['Tanggal', 'NIS', 'Nama', 'Kelas', 'Status', 'Keterangan'],
    fields: [
      { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'NIS', label: 'Siswa', type: 'siswa-select', required: true },
      { key: 'Status', label: 'Status Kehadiran', type: 'select', options: ['Hadir', 'Sakit', 'Izin', 'Alpa'], required: true },
      { key: 'Keterangan', label: 'Keterangan', type: 'textarea' }
    ]
  },
  pelanggaran: {
    sheet: 'Pelanggaran', title: 'Pelanggaran',
    columns: ['Tanggal', 'NIS', 'Nama', 'Kelas', 'JenisPelanggaran', 'Poin', 'Penanganan'],
    fields: [
      { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'NIS', label: 'Siswa', type: 'siswa-select', required: true },
      { key: 'JenisPelanggaran', label: 'Jenis Pelanggaran', type: 'text', required: true },
      { key: 'Poin', label: 'Poin Pelanggaran', type: 'number' },
      { key: 'Keterangan', label: 'Keterangan', type: 'textarea' },
      { key: 'Penanganan', label: 'Penanganan / Sanksi', type: 'textarea' }
    ]
  },
  konseling: {
    sheet: 'Konseling', title: 'Konseling',
    columns: ['Tanggal', 'NIS', 'Nama', 'Kelas', 'Jenis', 'Konselor'],
    fields: [
      { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'NIS', label: 'Siswa', type: 'siswa-select', required: true },
      { key: 'Jenis', label: 'Jenis Konseling', type: 'select', options: ['Individu', 'Kelompok'] },
      { key: 'MasalahDibahas', label: 'Masalah yang Dibahas', type: 'textarea' },
      { key: 'HasilKonseling', label: 'Hasil Konseling', type: 'textarea' },
      { key: 'TindakLanjut', label: 'Tindak Lanjut', type: 'textarea' },
      { key: 'Konselor', label: 'Nama Konselor / Guru BK', type: 'text' }
    ]
  },
  kolaborasi: {
    sheet: 'Kolaborasi', title: 'Kolaborasi',
    columns: ['Tanggal', 'NIS', 'Nama', 'Kelas', 'JenisKegiatan', 'PihakTerlibat'],
    fields: [
      { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'NIS', label: 'Siswa', type: 'siswa-select', required: true },
      { key: 'JenisKegiatan', label: 'Jenis Kegiatan', type: 'select', options: ['Panggilan Orang Tua', 'Home Visit'] },
      { key: 'Alasan', label: 'Alasan', type: 'textarea' },
      { key: 'PihakTerlibat', label: 'Pihak yang Terlibat', type: 'text' },
      { key: 'HasilPertemuan', label: 'Hasil Pertemuan', type: 'textarea' },
      { key: 'TindakLanjut', label: 'Tindak Lanjut', type: 'textarea' }
    ]
  }
};

let siswaOptions = [];
let moduleDataCache = {};
let editingModule = null;
let editingId = null;
let charts = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
  setupNav();
  setupHamburger();
  document.getElementById('topbarDate').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  loadSiswaOptions(function () {
    populateKelasFilters();
    loadAllModules();
    attachFilterListeners();
  });
  loadDashboard();
}

// ---------------- Navigasi ----------------
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const view = btn.dataset.view;
      document.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(function (v) { v.classList.add('hidden'); });
      document.getElementById('view-' + view).classList.remove('hidden');
      document.getElementById('pageTitle').textContent = btn.textContent.trim();
      closeSidebar();
      if (view === 'dashboard') loadDashboard();
    });
  });
}

function setupHamburger() {
  document.getElementById('hamburger').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('show');
  });
  document.getElementById('overlay').addEventListener('click', closeSidebar);
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ---------------- Loader & Toast ----------------
function showLoader() { document.getElementById('loader').classList.remove('hidden'); }
function hideLoader() { document.getElementById('loader').classList.add('hidden'); }
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type || '');
  setTimeout(function () { t.classList.add('hidden'); }, 2600);
}
function handleError(err) {
  hideLoader();
  showToast('Terjadi kesalahan: ' + (err && err.message ? err.message : err), 'error');
  console.error(err);
}

// ---------------- Data Siswa (untuk dropdown & filter) ----------------
function loadSiswaOptions(cb) {
  apiGet({ action: 'siswaOptions' }).then(function (list) {
    siswaOptions = list || [];
    if (cb) cb();
  }).catch(handleError);
}

function populateKelasFilters() {
  const kelasSet = Array.from(new Set(siswaOptions.map(function (s) { return s.kelas; }).filter(Boolean))).sort();
  document.querySelectorAll('.filter-select, #reportKelas').forEach(function (sel) {
    const first = sel.options[0];
    sel.innerHTML = '';
    sel.appendChild(first);
    kelasSet.forEach(function (k) {
      const opt = document.createElement('option');
      opt.value = k; opt.textContent = k;
      sel.appendChild(opt);
    });
  });
}

// ---------------- Load & Render Tabel ----------------
function loadAllModules() {
  Object.keys(MODULES).forEach(function (m) { loadModuleData(m); });
}

function loadModuleData(moduleKey) {
  const cfg = MODULES[moduleKey];
  apiGet({ action: 'list', sheet: cfg.sheet }).then(function (data) {
    moduleDataCache[moduleKey] = data;
    renderTable(moduleKey);
  }).catch(handleError);
}

function attachFilterListeners() {
  Object.keys(MODULES).forEach(function (m) {
    const s = document.getElementById('search-' + m);
    if (s) s.addEventListener('input', function () { renderTable(m); });
    const k = document.getElementById('filterKelas-' + m);
    if (k) k.addEventListener('change', function () { renderTable(m); });
  });
}

function formatDate(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return v;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function renderTable(moduleKey) {
  const cfg = MODULES[moduleKey];
  const data = moduleDataCache[moduleKey] || [];
  const searchEl = document.getElementById('search-' + moduleKey);
  const kelasEl = document.getElementById('filterKelas-' + moduleKey);
  const searchVal = searchEl ? searchEl.value.toLowerCase() : '';
  const kelasVal = kelasEl ? kelasEl.value : '';

  const filtered = data.filter(function (row) {
    const matchSearch = !searchVal ||
      String(row.Nama || '').toLowerCase().indexOf(searchVal) > -1 ||
      String(row.NIS || '').toLowerCase().indexOf(searchVal) > -1;
    const matchKelas = !kelasVal || row.Kelas === kelasVal;
    return matchSearch && matchKelas;
  }).sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });

  const table = document.getElementById('table-' + moduleKey);
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  thead.innerHTML = '<tr>' + cfg.columns.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '<th>Aksi</th></tr>';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="' + (cfg.columns.length + 1) + '" style="text-align:center;color:#94a3b8;padding:26px;">Belum ada data</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function (row) {
    const cells = cfg.columns.map(function (c) {
      let v = row[c];
      if (c === 'Tanggal' || c === 'TanggalLahir') v = v ? formatDate(v) : '';
      if (c === 'Status') v = '<span class="badge ' + v + '">' + v + '</span>';
      return '<td>' + (v !== undefined && v !== null ? v : '') + '</td>';
    }).join('');
    return '<tr>' + cells +
      '<td><button class="btn btn-small btn-secondary" onclick="openForm(\'' + moduleKey + '\',\'' + row.ID + '\')">✏️</button>' +
      '<button class="btn btn-small btn-danger" onclick="removeRow(\'' + moduleKey + '\',\'' + row.ID + '\')">🗑️</button></td></tr>';
  }).join('');
}

// ---------------- Form Modal (generik) ----------------
function openForm(moduleKey, id) {
  editingModule = moduleKey;
  editingId = id || null;
  const cfg = MODULES[moduleKey];
  document.getElementById('modalTitle').textContent = (id ? 'Edit ' : 'Tambah ') + cfg.title;
  const record = id ? (moduleDataCache[moduleKey] || []).find(function (r) { return r.ID === id; }) || {} : {};
  const body = document.getElementById('modalBody');
  body.innerHTML = '';

  cfg.fields.forEach(function (f) {
    const wrapper = document.createElement('label');
    wrapper.textContent = f.label + (f.required ? ' *' : '');
    let input;
    if (f.type === 'select') {
      input = document.createElement('select');
      input.id = 'field-' + f.key;
      f.options.forEach(function (o) {
        const opt = document.createElement('option'); opt.value = o; opt.textContent = o;
        input.appendChild(opt);
      });
      if (record[f.key]) input.value = record[f.key];
    } else if (f.type === 'textarea') {
      input = document.createElement('textarea');
      input.id = 'field-' + f.key;
      input.value = record[f.key] || '';
    } else if (f.type === 'siswa-select') {
      input = document.createElement('select');
      input.id = 'field-' + f.key;
      input.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
        siswaOptions.map(function (s) { return '<option value="' + s.nis + '">' + s.nis + ' - ' + s.nama + ' (' + s.kelas + ')</option>'; }).join('');
      if (record[f.key]) input.value = record[f.key];
    } else if (f.type === 'date') {
      input = document.createElement('input');
      input.type = 'date';
      input.id = 'field-' + f.key;
      if (record[f.key]) {
        const d = new Date(record[f.key]);
        if (!isNaN(d)) input.value = d.toISOString().slice(0, 10);
      } else if (f.key === 'Tanggal' && !id) {
        input.value = new Date().toISOString().slice(0, 10);
      }
    } else if (f.type === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.id = 'field-' + f.key;
      input.value = record[f.key] !== undefined ? record[f.key] : '';
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.id = 'field-' + f.key;
      input.value = record[f.key] || '';
    }
    wrapper.appendChild(input);
    body.appendChild(wrapper);
  });

  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeForm() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingModule = null;
  editingId = null;
}

function submitForm() {
  const cfg = MODULES[editingModule];
  const dataObj = {};
  let valid = true;
  cfg.fields.forEach(function (f) {
    const el = document.getElementById('field-' + f.key);
    const val = el.value.trim();
    if (f.required && !val) valid = false;
    dataObj[f.key] = val;
  });
  if (!valid) { showToast('Mohon lengkapi field wajib (*)', 'error'); return; }

  if (dataObj.NIS) {
    const s = siswaOptions.find(function (x) { return String(x.nis) === String(dataObj.NIS); });
    if (s) { dataObj.Nama = s.nama; dataObj.Kelas = s.kelas; }
  }

  showLoader();
  const moduleKey = editingModule;
  const request = editingId
    ? apiPost({ action: 'update', sheet: cfg.sheet, id: editingId, data: dataObj })
    : apiPost({ action: 'add', sheet: cfg.sheet, data: dataObj });

  request.then(function () {
    hideLoader(); closeForm();
    showToast(editingId ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan', 'success');
    loadModuleData(moduleKey);
    if (moduleKey === 'siswa') loadSiswaOptions(populateKelasFilters);
    if (!editingId) loadDashboard();
  }).catch(handleError);
}

function removeRow(moduleKey, id) {
  if (!confirm('Yakin ingin menghapus data ini?')) return;
  showLoader();
  apiPost({ action: 'delete', sheet: MODULES[moduleKey].sheet, id: id }).then(function () {
    hideLoader();
    showToast('Data dihapus', 'success');
    loadModuleData(moduleKey);
    loadDashboard();
    if (moduleKey === 'siswa') loadSiswaOptions(populateKelasFilters);
  }).catch(handleError);
}

// ---------------- Dashboard ----------------
function loadDashboard() {
  apiGet({ action: 'dashboard' }).then(function (stats) {
    document.getElementById('statSiswa').textContent = stats.totalSiswa;
    document.getElementById('statPelanggaran').textContent = stats.totalPelanggaranBulanIni;
    document.getElementById('statKonseling').textContent = stats.totalKonselingBulanIni;
    document.getElementById('statKolaborasi').textContent = stats.totalKolaborasiBulanIni;

    renderChart('chartPerKelas', 'bar', Object.keys(stats.perKelas), Object.values(stats.perKelas), ['#3b82f6']);
    renderChart('chartAbsensi', 'doughnut', Object.keys(stats.statusAbsensi), Object.values(stats.statusAbsensi), ['#16a34a', '#eab308', '#3b82f6', '#ef4444']);
    renderChart('chartTrend', 'line', stats.trendOrder, stats.trendOrder.map(function (k) { return stats.trendKonseling[k]; }), ['#8b5cf6']);

    const list = document.getElementById('topSiswaList');
    list.innerHTML = stats.topSiswaPoin.length
      ? stats.topSiswaPoin.map(function (s) { return '<li>' + s.nama + ' — <b>' + s.poin + ' poin</b></li>'; }).join('')
      : '<li>Belum ada data pelanggaran</li>';

    hideLoader();
  }).catch(handleError);
}

function renderChart(canvasId, type, labels, data, colors) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: '',
        data: data,
        backgroundColor: type === 'line' ? 'rgba(139,92,246,.15)' : (colors.length > 1 ? colors : labels.map(function (_, i) { return colors[i % colors.length]; })),
        borderColor: type === 'line' ? '#8b5cf6' : colors[0],
        borderWidth: type === 'line' ? 2 : 1,
        tension: 0.35,
        fill: type === 'line'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: type === 'doughnut' } },
      scales: type === 'doughnut' ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

// ---------------- Cetak Laporan PDF ----------------
function downloadReport() {
  const moduleSelect = document.getElementById('reportModule').value;
  const filters = {
    action: 'exportPDF',
    sheet: moduleSelect,
    kelas: document.getElementById('reportKelas').value,
    startDate: document.getElementById('reportStart').value,
    endDate: document.getElementById('reportEnd').value
  };
  showLoader();
  apiGet(filters).then(function (res) {
    hideLoader();
    const link = document.createElement('a');
    link.href = 'data:application/pdf;base64,' + res.base64;
    link.download = res.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan berhasil dibuat (' + res.total + ' data)', 'success');
  }).catch(handleError);
}
