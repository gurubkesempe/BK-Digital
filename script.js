/* ============================================================
   BK DIGITAL — FRONTEND LOGIC
   ============================================================ */

const TYPES = ['siswa','absensi','pelanggaran','konseling','kolaborasi'];
const STATE = { siswa:[], absensi:[], pelanggaran:[], konseling:[], kolaborasi:[] };
let API_URL = localStorage.getItem('bk_api_url') || '';
let currentPage = 'dashboard';
let charts = {};

/* ---------------- ADAPTER: real Apps Script vs offline demo ---------------- */
const RealAdapter = {
  async getAll(type){
    const res = await fetch(`${API_URL}?action=getAll&type=${type}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Gagal mengambil data');
    return json.data;
  },
  async create(type, data){
    const res = await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'create', type, data }) });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Gagal menyimpan data');
    return json.data;
  },
  async update(type, id, data){
    const res = await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'update', type, id, data }) });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Gagal memperbarui data');
    return json.data;
  },
  async delete(type, id){
    const res = await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'delete', type, id }) });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Gagal menghapus data');
    return true;
  }
};

const DemoAdapter = {
  key(type){ return `bk_demo_${type}`; },
  read(type){ return JSON.parse(localStorage.getItem(this.key(type)) || '[]'); },
  write(type, arr){ localStorage.setItem(this.key(type), JSON.stringify(arr)); },
  async getAll(type){ return this.read(type); },
  async create(type, data){
    const arr = this.read(type);
    data.ID = data.ID || (type.substring(0,3).toUpperCase() + '-' + Date.now().toString(36));
    arr.push(data); this.write(type, arr); return data;
  },
  async update(type, id, data){
    const arr = this.read(type);
    const idx = arr.findIndex(o => String(o.ID) === String(id));
    if (idx === -1) throw new Error('Data tidak ditemukan');
    arr[idx] = { ...arr[idx], ...data }; this.write(type, arr); return arr[idx];
  },
  async delete(type, id){
    const arr = this.read(type).filter(o => String(o.ID) !== String(id));
    this.write(type, arr); return true;
  },
  seedIfEmpty(){
    if (this.read('siswa').length) return;
    const siswa = [
      { ID:'SIS-1', NIS:'2201001', Nama:'Ahmad Fadillah', Kelas:'IX-A', JenisKelamin:'L', TempatTglLahir:'Semarang, 12-04-2011', Alamat:'Jl. Merdeka No. 12', NamaOrtu:'Budi Santoso', NoHPOrtu:'081234567801', Catatan:'' },
      { ID:'SIS-2', NIS:'2201002', Nama:'Siti Nurhaliza', Kelas:'IX-A', JenisKelamin:'P', TempatTglLahir:'Purwodadi, 03-08-2011', Alamat:'Jl. Anggrek No. 5', NamaOrtu:'Sri Wahyuni', NoHPOrtu:'081234567802', Catatan:'' },
      { ID:'SIS-3', NIS:'2201003', Nama:'Rizky Maulana', Kelas:'VIII-B', JenisKelamin:'L', TempatTglLahir:'Grobogan, 21-01-2012', Alamat:'Jl. Melati No. 9', NamaOrtu:'Agus Wibowo', NoHPOrtu:'081234567803', Catatan:'Perlu pemantauan kedisiplinan' },
      { ID:'SIS-4', NIS:'2201004', Nama:'Dewi Lestari', Kelas:'VIII-B', JenisKelamin:'P', TempatTglLahir:'Purwodadi, 15-11-2011', Alamat:'Jl. Kenanga No. 2', NamaOrtu:'Hendra Kusuma', NoHPOrtu:'081234567804', Catatan:'' },
      { ID:'SIS-5', NIS:'2201005', Nama:'Muhammad Iqbal', Kelas:'VII-C', JenisKelamin:'L', TempatTglLahir:'Semarang, 30-06-2012', Alamat:'Jl. Mawar No. 18', NamaOrtu:'Joko Prasetyo', NoHPOrtu:'081234567805', Catatan:'' }
    ];
    this.write('siswa', siswa);
    const today = new Date(); const ymd = (d) => d.toISOString().slice(0,10);
    const absensi = [
      { ID:'ABS-1', Tanggal: ymd(today), SiswaID:'SIS-1', Nama:'Ahmad Fadillah', Kelas:'IX-A', Status:'Hadir', Keterangan:'' },
      { ID:'ABS-2', Tanggal: ymd(today), SiswaID:'SIS-3', Nama:'Rizky Maulana', Kelas:'VIII-B', Status:'Alpa', Keterangan:'Tanpa keterangan' },
      { ID:'ABS-3', Tanggal: ymd(today), SiswaID:'SIS-4', Nama:'Dewi Lestari', Kelas:'VIII-B', Status:'Sakit', Keterangan:'Demam' }
    ];
    this.write('absensi', absensi);
    const pelanggaran = [
      { ID:'PEL-1', Tanggal: ymd(today), SiswaID:'SIS-3', Nama:'Rizky Maulana', Kelas:'VIII-B', JenisPelanggaran:'Terlambat masuk sekolah', Poin:5, Keterangan:'Terlambat 20 menit', Penanganan:'Teguran lisan' },
      { ID:'PEL-2', Tanggal: ymd(today), SiswaID:'SIS-3', Nama:'Rizky Maulana', Kelas:'VIII-B', JenisPelanggaran:'Tidak mengerjakan tugas', Poin:5, Keterangan:'3x berturut-turut', Penanganan:'Pemanggilan siswa' }
    ];
    this.write('pelanggaran', pelanggaran);
    const konseling = [
      { ID:'KON-1', Tanggal: ymd(today), SiswaID:'SIS-3', Nama:'Rizky Maulana', Kelas:'VIII-B', Topik:'Kedisiplinan', Masalah:'Sering terlambat dan menunda tugas', HasilKonseling:'Siswa berjanji memperbaiki manajemen waktu', TindakLanjut:'Pemantauan 2 minggu', Konselor:'Bu Ratna, S.Pd' }
    ];
    this.write('konseling', konseling);
    const kolaborasi = [
      { ID:'KOL-1', Tanggal: ymd(today), SiswaID:'SIS-3', Nama:'Rizky Maulana', Kelas:'VIII-B', Jenis:'Pemanggilan Orang Tua', Tujuan:'Membahas kedisiplinan anak', Hasil:'Orang tua berkomitmen mendampingi di rumah', Petugas:'Bu Ratna, S.Pd' }
    ];
    this.write('kolaborasi', kolaborasi);
  }
};

let adapter = RealAdapter;

/* ---------------- UTIL ---------------- */
function $(sel, ctx=document){ return ctx.querySelector(sel); }
function $all(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }
function showLoading(v){ $('#loadingOverlay').classList.toggle('show', v); }
function toast(msg, type=''){
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}
function fmtDate(d){
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}
function initials(name){ return (name||'?').trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase(); }
function colorFromString(str){
  const colors = ['#2F6F63','#E0932F','#3B7DD8','#D9614F','#8A5FC7','#3E9A63'];
  let h = 0; for (let i=0;i<(str||'').length;i++) h = str.charCodeAt(i) + ((h<<5)-h);
  return colors[Math.abs(h) % colors.length];
}
function uniqueClasses(){
  const set = new Set(STATE.siswa.map(s => s.Kelas).filter(Boolean));
  return Array.from(set).sort();
}
function siswaById(id){ return STATE.siswa.find(s => String(s.ID) === String(id)); }
function isThisMonth(dateStr){
  if (!dateStr) return false;
  const d = new Date(dateStr); const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/* ---------------- DATA LOADING ---------------- */
async function loadAll(){
  showLoading(true);
  try{
    const results = await Promise.all(TYPES.map(t => adapter.getAll(t)));
    TYPES.forEach((t,i) => STATE[t] = results[i] || []);
    populateClassFilters();
    renderCurrentPage();
    renderDashboard();
  }catch(err){
    toast('Gagal memuat data: ' + err.message, 'error');
  }finally{
    showLoading(false);
  }
}

function populateClassFilters(){
  const classes = uniqueClasses();
  const selectors = ['#filterKelasSiswa','#filterKelasAbsensi','#filterKelasPelanggaran','#filterKelasKonseling','#reportKelas'];
  selectors.forEach(sel => {
    const el = $(sel); if (!el) return;
    const current = el.value;
    el.innerHTML = '<option value="">Semua Kelas</option>' + classes.map(c => `<option value="${c}">${c}</option>`).join('');
    el.value = current;
  });
}

/* ---------------- NAVIGATION ---------------- */
function goToPage(page){
  currentPage = page;
  $all('.page').forEach(p => p.classList.remove('active'));
  $(`#page-${page}`)?.classList.add('active');
  $all('.nav-item[data-page]').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  $all('.bn-item[data-page]').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  const titles = { dashboard:'Dashboard', siswa:'Data Siswa', absensi:'Absensi', pelanggaran:'Pelanggaran', konseling:'Konseling', kolaborasi:'Kolaborasi', laporan:'Laporan' };
  $('#pageTitle').textContent = titles[page] || page;
  closeMoreSheet();
  renderCurrentPage();
}
function renderCurrentPage(){
  if (currentPage === 'dashboard') renderDashboard();
  if (currentPage === 'siswa') renderSiswa();
  if (currentPage === 'absensi') renderAbsensi();
  if (currentPage === 'pelanggaran') renderPelanggaran();
  if (currentPage === 'konseling') renderKonseling();
  if (currentPage === 'kolaborasi') renderKolaborasi();
}

$all('.nav-item[data-page]').forEach(n => n.addEventListener('click', e => { e.preventDefault(); goToPage(n.dataset.page); }));
$all('.bn-item[data-page]').forEach(n => n.addEventListener('click', e => { e.preventDefault(); goToPage(n.dataset.page); }));

/* mobile more sheet */
function openMoreSheet(){ $('#moreSheet').classList.add('open'); $('#sheetBackdrop').classList.add('open'); }
function closeMoreSheet(){ $('#moreSheet').classList.remove('open'); $('#sheetBackdrop').classList.remove('open'); }
$('#bnMore').addEventListener('click', e => { e.preventDefault(); openMoreSheet(); });
$('#sheetBackdrop').addEventListener('click', closeMoreSheet);
$all('#moreSheet .nav-item[data-page]').forEach(n => n.addEventListener('click', e => { e.preventDefault(); goToPage(n.dataset.page); }));

$('#refreshBtn').addEventListener('click', loadAll);
$('#globalSearch').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) { renderCurrentPage(); return; }
  if (currentPage === 'siswa') renderSiswa(q);
});

/* ---------------- DASHBOARD ---------------- */
function renderDashboard(){
  $('#statSiswa').textContent = STATE.siswa.length;
  $('#statAlpa').textContent = STATE.absensi.filter(a => a.Status === 'Alpa' && isThisMonth(a.Tanggal)).length;
  $('#statPelanggaran').textContent = STATE.pelanggaran.filter(p => isThisMonth(p.Tanggal)).length;
  $('#statKonseling').textContent = STATE.konseling.filter(k => isThisMonth(k.Tanggal)).length;

  renderTrendChart();
  renderPelanggaranChart();
  renderAbsensiChart('chartAbsensi', STATE.absensi);
  renderActivityList();
}

function last6Months(){
  const out = [];
  const now = new Date();
  for (let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    out.push({ label: d.toLocaleDateString('id-ID',{month:'short',year:'2-digit'}), y:d.getFullYear(), m:d.getMonth() });
  }
  return out;
}
function destroyChart(id){ if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

function renderTrendChart(){
  const months = last6Months();
  const pelData = months.map(mo => STATE.pelanggaran.filter(p => { const d=new Date(p.Tanggal); return d.getFullYear()===mo.y && d.getMonth()===mo.m; }).length);
  const alpaData = months.map(mo => STATE.absensi.filter(a => a.Status==='Alpa' && (()=>{ const d=new Date(a.Tanggal); return d.getFullYear()===mo.y && d.getMonth()===mo.m; })()).length);
  destroyChart('trend');
  charts.trend = new Chart($('#chartTrend'), {
    type:'line',
    data:{ labels: months.map(m=>m.label), datasets:[
      { label:'Pelanggaran', data:pelData, borderColor:'#D9614F', backgroundColor:'rgba(217,97,79,.12)', tension:.35, fill:true },
      { label:'Alpa', data:alpaData, borderColor:'#2F6F63', backgroundColor:'rgba(47,111,99,.12)', tension:.35, fill:true }
    ]},
    options:{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{ size:11 } } } }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } }
  });
}

function renderPelanggaranChart(){
  const counts = {};
  STATE.pelanggaran.forEach(p => { counts[p.JenisPelanggaran || 'Lainnya'] = (counts[p.JenisPelanggaran || 'Lainnya']||0)+1; });
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  destroyChart('pel');
  charts.pel = new Chart($('#chartPelanggaran'), {
    type:'bar',
    data:{ labels: entries.map(e=>e[0]), datasets:[{ data: entries.map(e=>e[1]), backgroundColor:'#E0932F', borderRadius:6, maxBarThickness:28 }] },
    options:{ indexAxis:'y', responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ beginAtZero:true, ticks:{ precision:0 } } } }
  });
}

function renderAbsensiChart(canvasId, absensiData){
  const statuses = ['Hadir','Sakit','Izin','Alpa'];
  const colorMap = { Hadir:'#3E9A63', Sakit:'#3B7DD8', Izin:'#E0932F', Alpa:'#D9614F' };
  const counts = statuses.map(s => absensiData.filter(a=>a.Status===s).length);
  destroyChart(canvasId);
  const isDoughnut = canvasId === 'chartAbsensi';
  charts[canvasId] = new Chart($('#'+canvasId), {
    type: isDoughnut ? 'doughnut' : 'bar',
    data:{ labels: statuses, datasets:[{ data: counts, backgroundColor: statuses.map(s=>colorMap[s]), borderRadius: isDoughnut?0:6, borderWidth: isDoughnut?2:0, borderColor:'#fff' }] },
    options:{ responsive:true, plugins:{ legend:{ position: isDoughnut?'bottom':'display', labels:{ boxWidth:10, font:{size:11} } } }, scales: isDoughnut? {} : { y:{ beginAtZero:true, ticks:{precision:0} } } }
  });
}

function renderActivityList(){
  const items = [];
  STATE.pelanggaran.forEach(p => items.push({ t:p.Tanggal, html:`<b>${p.Nama||'-'}</b> — pelanggaran: ${p.JenisPelanggaran||'-'}`, color:'#D9614F' }));
  STATE.konseling.forEach(k => items.push({ t:k.Tanggal, html:`<b>${k.Nama||'-'}</b> — sesi konseling: ${k.Topik||'-'}`, color:'#3E9A63' }));
  STATE.kolaborasi.forEach(k => items.push({ t:k.Tanggal, html:`<b>${k.Nama||'-'}</b> — ${k.Jenis||'-'}`, color:'#3B7DD8' }));
  STATE.absensi.filter(a=>a.Status==='Alpa').forEach(a => items.push({ t:a.Tanggal, html:`<b>${a.Nama||'-'}</b> — tidak hadir tanpa keterangan`, color:'#E0932F' }));
  items.sort((a,b) => new Date(b.t) - new Date(a.t));
  const list = $('#activityList');
  if (!items.length){ list.innerHTML = '<li class="muted" style="border:none;padding:20px 4px;text-align:center">Belum ada aktivitas.</li>'; return; }
  list.innerHTML = items.slice(0,8).map(it => `<li><span class="activity-dot" style="background:${it.color}"></span><div><div>${it.html}</div><div class="a-time">${fmtDate(it.t)}</div></div></li>`).join('');
}

/* ---------------- DATA SISWA ---------------- */
function renderSiswa(searchQuery){
  const kelas = $('#filterKelasSiswa').value;
  let rows = STATE.siswa.filter(s => !kelas || s.Kelas === kelas);
  if (searchQuery) rows = rows.filter(s => (s.Nama||'').toLowerCase().includes(searchQuery));
  const tbody = $('#tableSiswa tbody');
  const emptyState = $('#page-siswa .empty-state');
  if (!rows.length){ tbody.innerHTML=''; emptyState.style.display='block'; return; }
  emptyState.style.display='none';
  tbody.innerHTML = rows.map(s => {
    const pelanggaranCount = STATE.pelanggaran.filter(p => String(p.SiswaID)===String(s.ID)).length;
    const status = pelanggaranCount >= 3 ? { txt:'Perlu Perhatian', cls:'danger' } : pelanggaranCount >= 1 ? { txt:'Pemantauan', cls:'amber' } : { txt:'Baik', cls:'success' };
    return `<tr>
      <td>${s.NIS||'-'}</td>
      <td><div style="display:flex;align-items:center;gap:10px">
            <span class="avatar-ring" style="width:30px;height:30px;font-size:11px;background:${colorFromString(s.Nama)}">${initials(s.Nama)}</span>
            ${s.Nama||'-'}
          </div></td>
      <td>${s.Kelas||'-'}</td>
      <td>${s.JenisKelamin||'-'}</td>
      <td>${s.NamaOrtu||'-'}</td>
      <td>${s.NoHPOrtu||'-'}</td>
      <td><span class="badge badge--${status.cls}"><span class="badge-dot" style="background:currentColor"></span>${status.txt}</span></td>
      <td><div class="row-actions">
            <button class="icon-btn-sm" data-edit="siswa" data-id="${s.ID}"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn-sm danger" data-del="siswa" data-id="${s.ID}"><i class="fa-solid fa-trash"></i></button>
          </div></td>
    </tr>`;
  }).join('');
}
$('#filterKelasSiswa').addEventListener('change', () => renderSiswa());

/* ---------------- ABSENSI ---------------- */
function renderAbsensi(){
  const tgl = $('#filterTglAbsensi').value;
  const kelas = $('#filterKelasAbsensi').value;
  const status = $('#filterStatusAbsensi').value;
  let rows = STATE.absensi.filter(a => (!tgl || a.Tanggal===tgl) && (!kelas || a.Kelas===kelas) && (!status || a.Status===status));
  rows.sort((a,b)=> new Date(b.Tanggal)-new Date(a.Tanggal));
  renderAbsensiChart('chartAbsensiPage', rows);
  const tbody = $('#tableAbsensi tbody');
  const emptyState = $('#page-absensi .empty-state');
  if (!rows.length){ tbody.innerHTML=''; emptyState.style.display='block'; return; }
  emptyState.style.display='none';
  const badgeCls = { Hadir:'success', Sakit:'info', Izin:'amber', Alpa:'danger' };
  tbody.innerHTML = rows.map(a => `<tr>
      <td>${fmtDate(a.Tanggal)}</td><td>${a.Nama||'-'}</td><td>${a.Kelas||'-'}</td>
      <td><span class="badge badge--${badgeCls[a.Status]||'muted'}">${a.Status||'-'}</span></td>
      <td>${a.Keterangan||'-'}</td>
      <td><div class="row-actions">
        <button class="icon-btn-sm" data-edit="absensi" data-id="${a.ID}"><i class="fa-solid fa-pen"></i></button>
        <button class="icon-btn-sm danger" data-del="absensi" data-id="${a.ID}"><i class="fa-solid fa-trash"></i></button>
      </div></td></tr>`).join('');
}
['#filterTglAbsensi','#filterKelasAbsensi','#filterStatusAbsensi'].forEach(sel => $(sel).addEventListener('change', renderAbsensi));

/* ---------------- PELANGGARAN ---------------- */
function renderPelanggaran(){
  const kelas = $('#filterKelasPelanggaran').value;
  const bulan = $('#filterBulanPelanggaran').value; // yyyy-mm
  let rows = STATE.pelanggaran.filter(p => (!kelas || p.Kelas===kelas) && (!bulan || (p.Tanggal||'').startsWith(bulan)));
  rows.sort((a,b)=> new Date(b.Tanggal)-new Date(a.Tanggal));
  const tbody = $('#tablePelanggaran tbody');
  const emptyState = $('#page-pelanggaran .empty-state');
  if (!rows.length){ tbody.innerHTML=''; emptyState.style.display='block'; return; }
  emptyState.style.display='none';
  tbody.innerHTML = rows.map(p => `<tr>
      <td>${fmtDate(p.Tanggal)}</td><td>${p.Nama||'-'}</td><td>${p.Kelas||'-'}</td>
      <td>${p.JenisPelanggaran||'-'}</td>
      <td><span class="badge badge--danger">${p.Poin||0} poin</span></td>
      <td>${p.Penanganan||'-'}</td>
      <td><div class="row-actions">
        <button class="icon-btn-sm" data-edit="pelanggaran" data-id="${p.ID}"><i class="fa-solid fa-pen"></i></button>
        <button class="icon-btn-sm danger" data-del="pelanggaran" data-id="${p.ID}"><i class="fa-solid fa-trash"></i></button>
      </div></td></tr>`).join('');
}
['#filterKelasPelanggaran','#filterBulanPelanggaran'].forEach(sel => $(sel).addEventListener('change', renderPelanggaran));

/* ---------------- KONSELING (card list) ---------------- */
function renderKonseling(){
  const kelas = $('#filterKelasKonseling').value;
  let rows = STATE.konseling.filter(k => !kelas || k.Kelas===kelas);
  rows.sort((a,b)=> new Date(b.Tanggal)-new Date(a.Tanggal));
  const list = $('#listKonseling');
  $('#emptyKonseling').style.display = rows.length ? 'none' : 'block';
  list.innerHTML = rows.map(k => `
    <div class="entry-card">
      <div class="entry-card-head">
        <div class="entry-avatar-row">
          <span class="avatar-ring" style="background:${colorFromString(k.Nama)}">${initials(k.Nama)}</span>
          <div><div class="entry-name">${k.Nama||'-'}</div><div class="entry-sub">${k.Kelas||'-'} · ${k.Topik||'Konseling'}</div></div>
        </div>
        <div class="row-actions">
          <button class="icon-btn-sm" data-edit="konseling" data-id="${k.ID}"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn-sm danger" data-del="konseling" data-id="${k.ID}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="entry-body">
        <p><b>Masalah:</b> ${k.Masalah||'-'}</p>
        <p><b>Hasil:</b> ${k.HasilKonseling||'-'}</p>
        <p><b>Tindak lanjut:</b> ${k.TindakLanjut||'-'}</p>
      </div>
      <div class="entry-foot"><span class="entry-date">${fmtDate(k.Tanggal)}</span><span class="entry-sub">${k.Konselor||''}</span></div>
    </div>`).join('');
}
$('#filterKelasKonseling').addEventListener('change', renderKonseling);

/* ---------------- KOLABORASI (card list) ---------------- */
function renderKolaborasi(){
  const jenis = $('#filterJenisKolaborasi').value;
  let rows = STATE.kolaborasi.filter(k => !jenis || k.Jenis===jenis);
  rows.sort((a,b)=> new Date(b.Tanggal)-new Date(a.Tanggal));
  const list = $('#listKolaborasi');
  $('#emptyKolaborasi').style.display = rows.length ? 'none' : 'block';
  list.innerHTML = rows.map(k => `
    <div class="entry-card">
      <div class="entry-card-head">
        <div class="entry-avatar-row">
          <span class="avatar-ring" style="background:${colorFromString(k.Nama)}">${initials(k.Nama)}</span>
          <div><div class="entry-name">${k.Nama||'-'}</div><div class="entry-sub">${k.Kelas||'-'}</div></div>
        </div>
        <div class="row-actions">
          <button class="icon-btn-sm" data-edit="kolaborasi" data-id="${k.ID}"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn-sm danger" data-del="kolaborasi" data-id="${k.ID}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="entry-body">
        <p><span class="badge badge--info">${k.Jenis||'-'}</span></p>
        <p style="margin-top:8px"><b>Tujuan:</b> ${k.Tujuan||'-'}</p>
        <p><b>Hasil:</b> ${k.Hasil||'-'}</p>
      </div>
      <div class="entry-foot"><span class="entry-date">${fmtDate(k.Tanggal)}</span><span class="entry-sub">${k.Petugas||''}</span></div>
    </div>`).join('');
}
$('#filterJenisKolaborasi').addEventListener('change', renderKolaborasi);

/* ---------------- ROW ACTION DELEGATION (edit/delete) ---------------- */
document.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-del]');
  if (editBtn) openForm(editBtn.dataset.edit, editBtn.dataset.id);
  if (delBtn){
    const type = delBtn.dataset.del, id = delBtn.dataset.id;
    if (!confirm('Yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.')) return;
    showLoading(true);
    try{
      await adapter.delete(type, id);
      STATE[type] = STATE[type].filter(o => String(o.ID) !== String(id));
      renderCurrentPage(); renderDashboard(); populateClassFilters();
      toast('Data berhasil dihapus.', 'success');
    }catch(err){ toast(err.message, 'error'); }
    finally{ showLoading(false); }
  }
});

/* ---------------- FORM CONFIG ---------------- */
function siswaSelectOptions(selectedId){
  return STATE.siswa.map(s => `<option value="${s.ID}" ${String(s.ID)===String(selectedId)?'selected':''}>${s.Nama} — ${s.Kelas}</option>`).join('');
}

const FORM_CONFIG = {
  siswa: {
    title: 'Data Siswa',
    fields: [
      { key:'NIS', label:'NIS', type:'text', required:true },
      { key:'Nama', label:'Nama Lengkap', type:'text', required:true },
      { key:'Kelas', label:'Kelas', type:'text', required:true, placeholder:'contoh: VIII-A' },
      { key:'JenisKelamin', label:'Jenis Kelamin', type:'select', options:['L','P'] },
      { key:'TempatTglLahir', label:'Tempat, Tgl Lahir', type:'text' },
      { key:'NamaOrtu', label:'Nama Orang Tua/Wali', type:'text' },
      { key:'NoHPOrtu', label:'No. HP Orang Tua', type:'text' },
      { key:'Alamat', label:'Alamat', type:'textarea', full:true },
      { key:'Catatan', label:'Catatan Khusus', type:'textarea', full:true }
    ]
  },
  absensi: {
    title: 'Absensi Siswa',
    fields: [
      { key:'Tanggal', label:'Tanggal', type:'date', required:true, default: () => new Date().toISOString().slice(0,10) },
      { key:'SiswaID', label:'Siswa', type:'select-siswa', required:true },
      { key:'Status', label:'Status', type:'select', options:['Hadir','Sakit','Izin','Alpa'], required:true },
      { key:'Keterangan', label:'Keterangan', type:'textarea', full:true }
    ]
  },
  pelanggaran: {
    title: 'Pelanggaran Siswa',
    fields: [
      { key:'Tanggal', label:'Tanggal', type:'date', required:true, default: () => new Date().toISOString().slice(0,10) },
      { key:'SiswaID', label:'Siswa', type:'select-siswa', required:true },
      { key:'JenisPelanggaran', label:'Jenis Pelanggaran', type:'text', required:true },
      { key:'Poin', label:'Poin Pelanggaran', type:'number' },
      { key:'Keterangan', label:'Keterangan', type:'textarea', full:true },
      { key:'Penanganan', label:'Penanganan', type:'textarea', full:true }
    ]
  },
  konseling: {
    title: 'Sesi Konseling',
    fields: [
      { key:'Tanggal', label:'Tanggal', type:'date', required:true, default: () => new Date().toISOString().slice(0,10) },
      { key:'SiswaID', label:'Siswa', type:'select-siswa', required:true },
      { key:'Topik', label:'Topik', type:'text', required:true },
      { key:'Konselor', label:'Konselor / Guru BK', type:'text' },
      { key:'Masalah', label:'Uraian Masalah', type:'textarea', full:true },
      { key:'HasilKonseling', label:'Hasil Konseling', type:'textarea', full:true },
      { key:'TindakLanjut', label:'Rencana Tindak Lanjut', type:'textarea', full:true }
    ]
  },
  kolaborasi: {
    title: 'Kolaborasi (Panggilan Ortu / Home Visit)',
    fields: [
      { key:'Tanggal', label:'Tanggal', type:'date', required:true, default: () => new Date().toISOString().slice(0,10) },
      { key:'SiswaID', label:'Siswa', type:'select-siswa', required:true },
      { key:'Jenis', label:'Jenis Kegiatan', type:'select', options:['Pemanggilan Orang Tua','Home Visit'], required:true },
      { key:'Petugas', label:'Petugas BK', type:'text' },
      { key:'Tujuan', label:'Tujuan Kegiatan', type:'textarea', full:true },
      { key:'Hasil', label:'Hasil / Kesepakatan', type:'textarea', full:true }
    ]
  }
};

/* ---------------- MODAL FORM ---------------- */
function openForm(type, id){
  const cfg = FORM_CONFIG[type];
  const existing = id ? STATE[type].find(o => String(o.ID)===String(id)) : null;
  $('#modalTitle').textContent = (existing ? 'Edit ' : 'Tambah ') + cfg.title;

  const fieldsHtml = cfg.fields.map(f => {
    const val = existing ? (existing[f.key] ?? '') : (typeof f.default==='function' ? f.default() : '');
    const wrapClass = 'field' + (f.full ? ' full' : '');
    if (f.type === 'select'){
      return `<div class="${wrapClass}"><label>${f.label}</label>
        <select name="${f.key}" ${f.required?'required':''}>
          <option value="">Pilih...</option>
          ${f.options.map(o=>`<option value="${o}" ${o===val?'selected':''}>${o}</option>`).join('')}
        </select></div>`;
    }
    if (f.type === 'select-siswa'){
      return `<div class="${wrapClass}"><label>${f.label}</label>
        <select name="${f.key}" ${f.required?'required':''}>
          <option value="">Pilih siswa...</option>
          ${siswaSelectOptions(val)}
        </select></div>`;
    }
    if (f.type === 'textarea'){
      return `<div class="${wrapClass}"><label>${f.label}</label><textarea name="${f.key}">${val||''}</textarea></div>`;
    }
    return `<div class="${wrapClass}"><label>${f.label}</label><input type="${f.type}" name="${f.key}" value="${val||''}" ${f.placeholder?`placeholder="${f.placeholder}"`:''} ${f.required?'required':''} /></div>`;
  }).join('');

  $('#modalBody').innerHTML = `
    <form id="entityForm">
      <div class="form-grid">${fieldsHtml}</div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="formCancel">Batal</button>
        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Simpan</button>
      </div>
    </form>`;

  $('#formCancel').addEventListener('click', closeModal);
  $('#entityForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {};
    cfg.fields.forEach(f => data[f.key] = fd.get(f.key) || '');
    if (data.SiswaID !== undefined){
      const s = siswaById(data.SiswaID);
      if (s){ data.Nama = s.Nama; data.Kelas = s.Kelas; }
    }
    showLoading(true);
    try{
      if (existing){
        const updated = await adapter.update(type, existing.ID, data);
        const idx = STATE[type].findIndex(o=>String(o.ID)===String(existing.ID));
        STATE[type][idx] = { ...existing, ...updated, ...data, ID: existing.ID };
        toast('Data berhasil diperbarui.', 'success');
      }else{
        const created = await adapter.create(type, data);
        STATE[type].push({ ...data, ...created });
        toast('Data berhasil disimpan.', 'success');
      }
      closeModal();
      populateClassFilters();
      renderCurrentPage();
      renderDashboard();
    }catch(err){
      toast(err.message, 'error');
    }finally{
      showLoading(false);
    }
  });

  openModal();
}

function openModal(){ $('#modalBackdrop').classList.add('open'); }
function closeModal(){ $('#modalBackdrop').classList.remove('open'); }
$('#modalClose').addEventListener('click', closeModal);
$('#modalBackdrop').addEventListener('click', e => { if (e.target.id==='modalBackdrop') closeModal(); });

$('#btnAddSiswa').addEventListener('click', () => openForm('siswa'));
$('#btnAddAbsensi').addEventListener('click', () => openForm('absensi'));
$('#btnAddPelanggaran').addEventListener('click', () => openForm('pelanggaran'));
$('#btnAddKonseling').addEventListener('click', () => openForm('konseling'));
$('#btnAddKolaborasi').addEventListener('click', () => openForm('kolaborasi'));

/* ---------------- LAPORAN / CETAK PDF ---------------- */
const REPORT_COLUMNS = {
  siswa: ['NIS','Nama','Kelas','JenisKelamin','NamaOrtu','NoHPOrtu'],
  absensi: ['Tanggal','Nama','Kelas','Status','Keterangan'],
  pelanggaran: ['Tanggal','Nama','Kelas','JenisPelanggaran','Poin','Penanganan'],
  konseling: ['Tanggal','Nama','Kelas','Topik','HasilKonseling','TindakLanjut'],
  kolaborasi: ['Tanggal','Nama','Kelas','Jenis','Tujuan','Hasil']
};
const REPORT_TITLES = {
  siswa:'Data Siswa', absensi:'Rekap Absensi Siswa', pelanggaran:'Rekap Pelanggaran Siswa',
  konseling:'Rekap Sesi Konseling', kolaborasi:'Rekap Kolaborasi (Panggilan Ortu / Home Visit)'
};

$('#btnGenerateReport').addEventListener('click', () => {
  const type = $('#reportType').value;
  const kelas = $('#reportKelas').value;
  let rows = STATE[type] || [];
  if (kelas) rows = rows.filter(r => r.Kelas === kelas);
  if ('Tanggal' in (rows[0]||{}) || REPORT_COLUMNS[type].includes('Tanggal')){
    rows = rows.slice().sort((a,b)=> new Date(a.Tanggal)-new Date(b.Tanggal));
  }
  const cols = REPORT_COLUMNS[type];
  const today = new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});

  const html = `
    <h2>${REPORT_TITLES[type]}</h2>
    <div class="report-head-line"><span>Kelas: ${kelas || 'Semua Kelas'}</span><span>Dicetak: ${today}</span></div>
    <table>
      <thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.length ? rows.map(r => `<tr>${cols.map(c => `<td>${c==='Tanggal'?fmtDate(r[c]):(r[c] ?? '-')}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" style="text-align:center;color:#999">Tidak ada data</td></tr>`}
      </tbody>
    </table>
    <p style="margin-top:24px;font-size:12px;color:#999">Total data: ${rows.length}</p>
  `;
  $('#reportPreview').innerHTML = html;
  $('#reportPreviewCard').style.display = 'block';
  $('#reportPreviewCard').scrollIntoView({ behavior:'smooth' });
  setTimeout(() => window.print(), 400);
});

/* ---------------- SETUP SCREEN / API URL ---------------- */
function enterApp(){
  $('#setupScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  loadAll();
}
$('#apiUrlSave').addEventListener('click', () => {
  const val = $('#apiUrlInput').value.trim();
  if (!val){ toast('Masukkan URL Web App terlebih dahulu.', 'error'); return; }
  API_URL = val;
  adapter = RealAdapter;
  localStorage.setItem('bk_api_url', API_URL);
  localStorage.removeItem('bk_demo_mode');
  enterApp();
});

/* demo mode link (added dynamically under the setup note) */
(function addDemoLink(){
  const note = document.querySelector('.setup-note');
  const a = document.createElement('a');
  a.href = '#'; a.textContent = 'Coba mode demo tanpa Google Sheets →';
  a.style.cssText = 'display:inline-block;margin-top:10px;color:var(--primary);font-weight:600;font-size:12.5px;';
  a.addEventListener('click', (e) => {
    e.preventDefault();
    adapter = DemoAdapter;
    DemoAdapter.seedIfEmpty();
    localStorage.setItem('bk_demo_mode','1');
    enterApp();
  });
  note.after(a);
})();

/* Settings button lets user change/reset API URL */
function openSettings(){
  $('#modalTitle').textContent = 'Pengaturan Koneksi';
  $('#modalBody').innerHTML = `
    <div class="field full" style="margin-bottom:16px">
      <label>URL Web App Google Apps Script</label>
      <input type="url" id="settingsApiUrl" value="${API_URL}" placeholder="https://script.google.com/macros/s/xxxxx/exec" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" id="settingsDemoBtn" type="button">Gunakan Mode Demo</button>
      <button class="btn btn-primary" id="settingsSaveBtn" type="button"><i class="fa-solid fa-check"></i> Simpan &amp; Muat Ulang</button>
    </div>`;
  $('#settingsSaveBtn').addEventListener('click', () => {
    const val = $('#settingsApiUrl').value.trim();
    if (!val){ toast('URL tidak boleh kosong.', 'error'); return; }
    API_URL = val; adapter = RealAdapter;
    localStorage.setItem('bk_api_url', API_URL);
    localStorage.removeItem('bk_demo_mode');
    closeModal(); loadAll(); toast('Pengaturan disimpan.', 'success');
  });
  $('#settingsDemoBtn').addEventListener('click', () => {
    adapter = DemoAdapter; DemoAdapter.seedIfEmpty();
    localStorage.setItem('bk_demo_mode','1');
    closeModal(); loadAll(); toast('Mode demo diaktifkan.', 'success');
  });
  openModal();
}
$('#settingsBtn').addEventListener('click', openSettings);
$('#settingsBtnMobile').addEventListener('click', () => { closeMoreSheet(); openSettings(); });

/* ---------------- MOBILE HAMBURGER (opens sidebar-equivalent: more sheet w/ full nav) ---------------- */
$('#hamburgerBtn').addEventListener('click', openMoreSheet);

/* ---------------- INIT ---------------- */
(function init(){
  if (localStorage.getItem('bk_demo_mode') === '1'){
    adapter = DemoAdapter; DemoAdapter.seedIfEmpty(); enterApp();
  } else if (API_URL){
    $('#apiUrlInput').value = API_URL;
    adapter = RealAdapter; enterApp();
  }
})();
