// --- DEBUG: tampilkan error apa pun secara visual di layar ---
function showFatalError(msg){
  let el = document.getElementById('fatalErrorBanner');
  if(!el){
    el = document.createElement('div');
    el.id = 'fatalErrorBanner';
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#E8604C;color:#fff;padding:10px 14px;font-size:12px;z-index:999;white-space:pre-wrap;';
    document.body.prepend(el);
  }
  el.textContent += (el.textContent?'\n':'') + msg;
}
window.onerror = function(msg, url, line, col){ showFatalError('JS Error: ' + msg + ' (baris ' + line + ')'); };

// --- Toggle mode gelap / terang ---
function currentTheme(){ return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
const ICON_MOON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
const ICON_SUN = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const ICON_BOX = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>';
const ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';
const ICON_NOTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/></svg>';
const ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
const ICON_USER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
function updateThemeIcon(){
  const btn = document.getElementById('themeToggle');
  btn.innerHTML = currentTheme() === 'light' ? ICON_MOON : ICON_SUN;
}
function toggleTheme(){
  const next = currentTheme() === 'light' ? 'dark' : 'light';
  if(next === 'light') document.documentElement.setAttribute('data-theme','light');
  else document.documentElement.removeAttribute('data-theme');
  try{ localStorage.setItem('cetok_theme', next); }catch(e){}
  updateThemeIcon();
}
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
updateThemeIcon();

// --- Tab switching: didaftarkan paling awal, tidak bergantung apa pun ---
// Dijadikan fungsi terpisah (bukan cuma di dalam listener klik tab) supaya
// bisa dipanggil dari tempat lain juga, mis. saat kartu "Stok Kosong" diklik.
function switchTab(tabName){
  document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.toggle('active', b.dataset.tab===tabName));
  document.querySelectorAll('main > section').forEach(s=>s.style.display='none');
  document.getElementById('tab-'+tabName).style.display='block';
}
try{
  document.querySelectorAll('nav.tabs button').forEach(btn=>{
    btn.addEventListener('click', ()=>switchTab(btn.dataset.tab));
  });
}catch(e){ showFatalError('Gagal pasang tab: ' + e.message); }

// --- Daftar unit model: hardcode di sisi client, tidak perlu tunggu server ---
const UNIT_MODELS = [
  {cat:'Excavator', code:'PC2000-11R'},
  {cat:'Excavator', code:'PC1250SP-11'},
  {cat:'Excavator', code:'CAT395'},
  {cat:'Excavator', code:'PC500LC-10R'},
  {cat:'Excavator', code:'PC210-10MO'},
  {cat:'Bulldozer', code:'D375A-6R'},
  {cat:'Bulldozer', code:'D155A-6R'},
  {cat:'Bulldozer', code:'D85ESS-2'}
];

// --- Koneksi Supabase (backend/database baru, pengganti Apps Script + Google Sheets) ---
// SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY diambil dari:
// Supabase Dashboard > Project Settings > API Keys.
// - Project URL: tab mana saja, bagian atas halaman.
// - Publishable key (diawali sb_publishable_...): tab "Publishable and secret API keys".
//   (Ini pengganti "anon key" versi lama. Kalau project kamu masih pakai sistem lama,
//   key "anon" di tab "Legacy API Keys", diawali eyJ..., juga tetap bisa dipakai di sini.)
// Key ini MEMANG untuk dipasang di frontend/publik — bukan rahasia seperti password.
// Yang menjaga keamanan adalah aturan RLS + fungsi database (lihat schema.sql).
// JANGAN pernah pasang "Secret key" (sb_secret_...) atau "service_role" di sini.
const SUPABASE_URL = 'https://zdmlydqxvtvuktcfijzx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbWx5ZHF4dnR2dWt0Y2Zpanp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjE2NTksImV4cCI6MjEwMjY5NzY1OX0.HbZY03oiDZ9J7RkakbtVR3S3Dze89ttd2NbLQkqGYPY';
// Dinamai "sb" (bukan "supabase") karena library supabase-js versi CDN ini
// sudah otomatis membuat variabel global bernama "supabase" -- pakai nama sama
// akan bentrok dan bikin SELURUH javascript di halaman berhenti jalan.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// 2 website sama-sama connect ke database ini (stock-spareparts.vercel.app
// untuk operasional harian, cetok-online.vercel.app untuk demo/presentasi).
// Dibedakan cuma dari domainnya sendiri -- bukan toggle manual di database
// lagi -- supaya tidak ada lagi risiko lupa "kembalikan" setelah presentasi.
const SHOW_HIDDEN = window.location.hostname.includes('stock-spareparts');

// --- Login Admin (satu akun bersama, dibuat manual di Supabase Dashboard >
// Authentication > Users). Emailnya tidak rahasia (bukan password), jadi aman
// ditulis di sini -- yang menjaga keamanan tetap password + aturan RLS di database.
// GANTI email ini sesuai akun admin yang kamu buat di Supabase Dashboard.
const ADMIN_EMAIL = 'admin@cetok.local';
let isAdmin = false;

// Animasi pop-up: 'display' diubah dulu, baru class 'open' ditambahkan
// sesaat setelahnya (2x requestAnimationFrame) supaya browser sempat
// "melihat" state awal (kecil & transparan) sebelum transisi ke state
// akhir -- tanpa jeda ini, perubahan style dianggap terjadi bersamaan
// dan modal akan langsung muncul tanpa animasi sama sekali.
function openModal(id){
  const el = document.getElementById(id);
  el.style.display = 'flex';
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{ el.classList.add('open'); });
  });
}
function closeModal(id){
  const el = document.getElementById(id);
  el.classList.remove('open');
  setTimeout(()=>{ el.style.display = 'none'; }, 200); // samakan dgn durasi transisi opacity overlay
  const errEl = document.getElementById(id.replace('Modal','Error'));
  if(errEl) errEl.textContent = '';
}

function updateAdminUI(){
  const btn = document.getElementById('adminToggle');
  btn.textContent = isAdmin ? 'Logout' : 'Login';
  btn.classList.toggle('on', isAdmin);
  btn.title = isAdmin ? 'Keluar dari mode admin' : 'Login admin';
  if(typeof paState !== 'undefined' && paState.open && paState.view === 'detail') paRender();
  renderStokSheet();
  renderRiwayat();
}

document.getElementById('adminToggle').addEventListener('click', ()=>{
  if(isAdmin){
    openModal('logoutConfirmModal');
  } else {
    document.getElementById('login_password').value = '';
    document.getElementById('loginError').textContent = '';
    openModal('loginModal');
  }
});
document.getElementById('login_password').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){ e.preventDefault(); doAdminLogin(); }
});

async function doAdminLogin(){
  const password = document.getElementById('login_password').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('btnDoLogin');
  if(!password){ errEl.textContent = 'Password wajib diisi.'; return; }
  btn.disabled = true; btn.textContent = 'Login...';
  try{
    const { error } = await sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
    if(error) throw error;
    closeModal('loginModal');
    toast('Login admin berhasil');
  }catch(e){
    errEl.textContent = 'Password salah atau akun admin belum dibuat di Supabase.';
  }finally{
    btn.disabled = false; btn.textContent = 'Login';
  }
}

// Pantau status login -- dipanggil otomatis oleh supabase-js saat sesi
// berubah (login, logout, atau sesi lama dari localStorage ditemukan saat
// halaman baru dibuka).
sb.auth.onAuthStateChange((event, session)=>{
  isAdmin = !!session;
  updateAdminUI();
  if(event === 'SIGNED_OUT') toast('Sudah keluar dari mode admin');
});

let parts = [];
let transactions = [];
let riwayatTotal = 0;
let riwayatShown = 0;
let currentSheet = 'ALL';
let ambilSelectedPartId = null;
let tfSelectedPartId = null;
// Toggle "tampilkan stok kosong saja" di tab Stok -- bisa dinyalakan lewat
// tombol ⚠️ Kosong saja, ATAU otomatis dinyalakan saat kartu statistik
// "Stok Kosong" di header diklik.
let stokKosongOnly = false;

// --- Pagination: Stok (dihitung di sisi browser karena semua data stok
// sudah kepanggil sekali lewat getAllData) ---
const STOK_PAGE_SIZE = 20;
let stokPage = 1;

// --- Pagination: Riwayat (diambil per-halaman langsung dari tabel Supabase,
// jadi HP tidak perlu load SEMUA riwayat sekaligus -- cuma 50 baris per halaman) ---
const RIWAYAT_PAGE_SIZE = 20;
let riwayatPage = 1;
let riwayatPageCount = 1;

// runScript sekarang manggil fungsi database (RPC) di Supabase langsung dari HP,
// bukan lewat Apps Script/proxy Vercel lagi. Nama fungsi (inputBarang, ambilBarang,
// getAllData) sengaja dipertahankan sama supaya kode di bawah (inputBarang(), dst)
// tidak perlu diubah sama sekali.
const RIWAYAT_LIMIT_DEFAULT = 20;

async function runScript(fnName, ...args){
  if (fnName === 'getAllData') {
    const limit = Number(args[0]) || RIWAYAT_LIMIT_DEFAULT;
    const { data, error } = await sb.rpc('get_all_data', { p_riwayat_limit: limit, p_show_hidden: SHOW_HIDDEN });
    if (error) throw new Error(error.message || 'Gagal mengambil data');
    return data;
  }

  if (fnName === 'inputBarang') {
    const [unit, pn, desc, loc, qty, nama, status, remarks] = args;
    const { error } = await sb.rpc('input_barang', {
      p_unit: unit, p_pn: pn, p_desc: desc, p_loc: loc, p_qty: qty, p_nama: nama, p_status: status, p_remarks: remarks
    });
    if (error) throw new Error(error.message || 'Gagal menyimpan input barang');
    return runScript('getAllData');
  }

  if (fnName === 'ambilBarang') {
    // Pakai ID baris yang persis (bukan lagi unit+pn saja) -- karena sekarang
    // satu parts number + unit model yang sama bisa punya BEBERAPA baris stok
    // terpisah kalau lokasi atau status RFU/NOT RFU-nya beda. ID memastikan
    // yang dikurangi stoknya benar-benar baris yang dipilih user.
    const [id, qty, note, nama] = args;
    const { error } = await sb.rpc('ambil_barang', {
      p_id: id, p_qty: qty, p_note: note, p_nama: nama
    });
    if (error) throw new Error(error.message || 'Gagal menyimpan ambil barang');
    return runScript('getAllData');
  }

  if (fnName === 'transferStok') {
    const [id, qty, destLoc, destStatus, note, nama] = args;
    const { error } = await sb.rpc('transfer_stok', {
      p_source_id: id, p_qty: qty, p_dest_loc: destLoc, p_dest_status: destStatus, p_note: note, p_nama: nama
    });
    if (error) throw new Error(error.message || 'Gagal menyimpan transfer');
    return runScript('getAllData');
  }

  // --- Fungsi khusus admin (butuh login, dicek lewat RLS di database) ---
  if (fnName === 'updatePart') {
    const [id, unit, pn, desc, loc, qty, status, remarks] = args;
    const { error } = await sb.rpc('update_part', {
      p_id: id, p_unit: unit, p_pn: pn, p_desc: desc, p_loc: loc, p_qty: qty, p_status: status, p_remarks: remarks
    });
    if (error) throw new Error(error.message || 'Gagal menyimpan perubahan stok');
    return runScript('getAllData');
  }

  if (fnName === 'deletePart') {
    const [id] = args;
    const { error } = await sb.rpc('delete_part', { p_id: id });
    if (error) throw new Error(error.message || 'Gagal menghapus part');
    return runScript('getAllData');
  }

  if (fnName === 'updateRiwayat') {
    const [id, unit, pn, desc, note, nama] = args;
    const { error } = await sb.rpc('update_riwayat', {
      p_id: id, p_unit_model: unit, p_parts_number: pn, p_parts_description: desc,
      p_keterangan: note, p_nama: nama
    });
    if (error) throw new Error(error.message || 'Gagal menyimpan perubahan riwayat');
    return true;
  }

  throw new Error('Aksi tidak dikenal: ' + fnName);
}

// Toast biasa dianimasikan pop-in/pop-out. Kalau pesannya mengandung kata
// "berhasil/tersimpan/dipindah" (pola yang sudah dipakai di semua transaksi
// sukses di file ini), otomatis dianggap sukses -> border hijau + centang +
// getar HP sebentar (kalau browser/perangkatnya dukung getar).
function toast(msg, type){
  if(!type){ type = /berhasil|tersimpan|dipindah/i.test(msg) ? 'success' : 'info'; }
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.innerHTML = (type === 'success' ? `<span class="toast-check">${ICON_CHECK}</span>` : '') + esc(msg);
  document.getElementById('toastRoot').appendChild(el);
  if(type === 'success' && navigator.vibrate){
    try{ navigator.vibrate(60); }catch(e){}
  }
  setTimeout(()=>{
    el.classList.add('toast-out');
    setTimeout(()=>el.remove(), 180);
  }, 2800);
}
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// Badge kecil buat status RFU/NOT RFU. Status boleh KOSONG (null) --
// misalnya otomatis dikosongkan saat qty habis -- ditampilkan beda,
// bukan dipaksa jadi RFU maupun NOT RFU.
function statusBadge(status){
  const s = (status || '').toUpperCase();
  if(s === 'RFU') return `<span class="status-badge rfu">RFU</span>`;
  if(s === 'NOT RFU') return `<span class="status-badge not-rfu">NOT RFU</span>`;
  return `<span class="status-badge empty">-</span>`;
}

function init(){
  try{
    buildSelectors();
  }catch(e){ showFatalError('Gagal buildSelectors: ' + e.message); }
  try{
    const savedNama = localStorage.getItem('stok_nama_terakhir');
    if(savedNama){
      document.getElementById('in_nama').value = savedNama;
      document.getElementById('ax_nama').value = savedNama;
      document.getElementById('tf_nama').value = savedNama;
    }
  }catch(e){ /* localStorage tidak tersedia, abaikan */ }
  loadData();
}

async function loadData(){
  try{
    const data = await runScript('getAllData');
    parts = data.parts;
    stokPage = 1;
    populateLocationFilter();
    renderStats(); renderStokSheet();
  }catch(e){
    showFatalError('Gagal memuat data stok dari Supabase: ' + (e.message||e));
    renderStats(); renderStokSheet();
  }
  await loadRiwayatPage(1);
}

// Ambil satu halaman riwayat lewat RPC get_riwayat_page (bukan query
// langsung ke tabel lagi) -- supaya filter "disembunyikan" (dan SHOW_HIDDEN
// per-domain di atas) ikut berlaku di sini juga, bukan cuma di getAllData.
async function loadRiwayatPage(page){
  const typeF = document.getElementById('filterType').value;
  const unitF = document.getElementById('filterUnit').value;
  const searchF = document.getElementById('riwayat_search').value.trim();

  try{
    const { data, error } = await sb.rpc('get_riwayat_page', {
      p_page: page,
      p_page_size: RIWAYAT_PAGE_SIZE,
      p_jenis: typeF || null,
      p_unit: unitF || null,
      p_search: searchF || null,
      p_show_hidden: SHOW_HIDDEN
    });
    if (error) throw error;
    transactions = (data.rows || []).map(r => ({
      id: r.id,
      ts: r.ts,
      type: r.type,
      unit: r.unit,
      pn: r.pn,
      desc: r.desc,
      qty: r.qty,
      note: r.note,
      nama: r.nama,
      status: r.status,
      loc: r.loc
    }));
    riwayatTotal = data.total || 0;
    riwayatPageCount = Math.max(1, Math.ceil(riwayatTotal / RIWAYAT_PAGE_SIZE));
    riwayatPage = page;
    renderRiwayat();
  }catch(e){
    showFatalError('Gagal memuat riwayat dari Supabase: ' + (e.message||e));
  }
}

function buildSelectors(){
  populateUnitSelectGrouped('in_unit');
  populateUnitSelectGrouped('er_unit');

  const filterUnit = document.getElementById('filterUnit');
  UNIT_MODELS.forEach(u=>{
    const opt = document.createElement('option'); opt.value=u.code; opt.textContent=u.code;
    filterUnit.appendChild(opt);
  });

  const pillsSemua = document.getElementById('pillsSemua');
  const btnSemua = document.createElement('button');
  btnSemua.textContent = 'Semua Unit'; btnSemua.dataset.code = 'ALL';
  if(currentSheet==='ALL') btnSemua.classList.add('active');
  btnSemua.onclick = ()=>{ currentSheet = 'ALL'; stokKosongOnly = false; stokPage = 1; renderStokSheet(); };
  pillsSemua.appendChild(btnSemua);

  const pillsExc = document.getElementById('pillsExcavator');
  const pillsBull = document.getElementById('pillsBulldozer');
  UNIT_MODELS.forEach(u=>{
    const btn = document.createElement('button');
    btn.textContent = u.code; btn.dataset.code = u.code;
    if(u.code===currentSheet) btn.classList.add('active');
    btn.onclick = ()=>{ currentSheet = u.code; stokKosongOnly = false; stokPage = 1; renderStokSheet(); };
    (u.cat==='Excavator'?pillsExc:pillsBull).appendChild(btn);
  });
}
// Dipakai buat isi <select id="in_unit">, dan dipakai ulang buat dropdown unit
// di modal Edit Riwayat (er_unit).
function populateUnitSelectGrouped(selectId){
  const sel = document.getElementById(selectId);
  const excGroup = document.createElement('optgroup'); excGroup.label='Excavator';
  const bullGroup = document.createElement('optgroup'); bullGroup.label='Bulldozer';
  UNIT_MODELS.forEach(u=>{
    const opt = document.createElement('option'); opt.value=u.code; opt.textContent=u.code;
    (u.cat==='Excavator'?excGroup:bullGroup).appendChild(opt);
  });
  sel.appendChild(excGroup); sel.appendChild(bullGroup);
}

function render(){
  renderStats(); renderStokSheet();
  loadRiwayatPage(1); // transaksi baru saja tersimpan -> balik ke halaman 1 riwayat
}
function renderStats(){
  document.getElementById('statRfu').textContent = parts.filter(p=>(p.status||'').toUpperCase()==='RFU').length;
  document.getElementById('statNotRfu').textContent = parts.filter(p=>(p.status||'').toUpperCase()==='NOT RFU').length;
}
function getUniqueLocations(){
  // Kumpulkan lokasi unik, tanpa peduli besar-kecil huruf.
  // Key pakai versi lowercase (buat pembanding), tapi yang ditampilkan
  // tetap pakai penulisan asli yang pertama kali ketemu di data.
  // Dipakai bareng oleh filter lokasi di tab Stok DAN saran datalist
  // di kolom "Lokasi Penyimpanan" pada form Input Barang.
  const map = new Map();
  parts.forEach(p=>{
    const raw = (p.loc || '').trim();
    if(!raw) return;
    const key = raw.toLowerCase();
    if(!map.has(key)) map.set(key, raw);
  });
  const sortedKeys = [...map.keys()].sort((a,b)=>map.get(a).localeCompare(map.get(b), 'id'));
  return sortedKeys.map(k=>map.get(k));
}
function populateLocationFilter(){
  const sel = document.getElementById('stok_loc_filter');
  const prevValue = sel.value;

  const locations = getUniqueLocations();
  sel.innerHTML = '<option value="">Semua Lokasi</option>' +
    locations.map(loc=>`<option value="${esc(loc.toLowerCase())}">${esc(loc)}</option>`).join('');

  // Pertahankan pilihan lokasi sebelumnya kalau masih ada di data terbaru
  if(locations.some(loc=>loc.toLowerCase()===prevValue)) sel.value = prevValue;

  // Isi ulang saran datalist buat kolom "Lokasi Penyimpanan" di form Input Barang
  document.getElementById('loc_datalist').innerHTML =
    locations.map(loc=>`<option value="${esc(loc)}">`).join('');
}
document.getElementById('stok_loc_filter').addEventListener('change', ()=>{ stokPage = 1; renderStokSheet(); });
document.getElementById('stok_status_filter').addEventListener('change', ()=>{ stokPage = 1; renderStokSheet(); });

// ---------- Bottom-sheet filter (tampilan HP) ----------
// <select> asli tetap jadi sumber nilai (dipakai semua logika filter & export);
// di HP select disembunyikan dan diganti tombol + sheet yang lebih ringkas.
function syncFilterButtons(){
  [['stok_loc_filter','locBtn'],['stok_status_filter','statusBtn']].forEach(([selId,btnId])=>{
    const sel = document.getElementById(selId), btn = document.getElementById(btnId);
    if(!sel || !btn) return;
    const opt = sel.selectedOptions[0];
    btn.querySelector('.fb-label').textContent = opt ? opt.textContent : '';
    btn.classList.toggle('active', !!sel.value);
  });
}
let filterSheetSel = null, filterSheetBtn = null;
const isDesktopFilter = ()=>window.matchMedia('(min-width:681px)').matches;
function openFilterSheet(btn){
  const selId = btn.dataset.for, title = btn.dataset.title;
  const sel = document.getElementById(selId);
  const isLoc = selId === 'stok_loc_filter';
  filterSheetSel = sel;
  filterSheetBtn = btn;
  // Jumlah part per opsi, mengikuti filter lain yang sedang aktif
  const rows = getFilteredStokRows(isLoc ? {loc:true} : {status:true});
  const counts = new Map();
  rows.forEach(p=>{
    const k = isLoc ? (p.loc||'').trim().toLowerCase() : (p.status ? String(p.status).toUpperCase() : 'EMPTY');
    counts.set(k, (counts.get(k)||0) + 1);
  });
  document.getElementById('filterSheetTitle').textContent = title;
  document.getElementById('filterSheetList').innerHTML = [...sel.options].map(o=>{
    const n = o.value === '' ? rows.length : (counts.get(o.value)||0);
    const label = (!isLoc && (o.value==='RFU' || o.value==='NOT RFU')) ? statusBadge(o.value) : esc(o.textContent);
    const cls = 'sheet-item' + (o.value===sel.value ? ' active' : '') + (n===0 && o.value!=='' ? ' zero' : '');
    return `<div class="${cls}" role="option" data-val="${esc(o.value)}"><span>${label}</span><span class="cnt">${n}</span></div>`;
  }).join('');
  const ov = document.getElementById('filterSheet');
  const sheet = ov.querySelector('.sheet');
  if(isDesktopFilter()){
    // Desktop: popover tepat di bawah tombol
    const r = btn.getBoundingClientRect();
    const w = Math.max(r.width, 280);
    const top = r.bottom + 6;
    sheet.style.width = w + 'px';
    sheet.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
    sheet.style.top = top + 'px';
    sheet.style.maxHeight = Math.max(160, Math.min(window.innerHeight * 0.6, window.innerHeight - top - 12)) + 'px';
  } else {
    ['width','left','top','maxHeight'].forEach(k=>sheet.style[k]='');
  }
  btn.setAttribute('aria-expanded','true');
  ov.style.display = 'flex';
  ov.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>ov.classList.add('open'));
}
function closeFilterSheet(){
  const ov = document.getElementById('filterSheet');
  if(!ov.classList.contains('open')) return;
  ov.classList.remove('open');
  ov.setAttribute('aria-hidden','true');
  if(filterSheetBtn) filterSheetBtn.setAttribute('aria-expanded','false');
  setTimeout(()=>{ if(!ov.classList.contains('open')) ov.style.display = 'none'; }, 240);
}
['locBtn','statusBtn'].forEach(id=>{
  const btn = document.getElementById(id);
  btn.setAttribute('aria-expanded','false');
  btn.addEventListener('click', ()=>{
    const ov = document.getElementById('filterSheet');
    // klik tombol yang sama saat popover terbuka = tutup
    if(ov.classList.contains('open') && filterSheetBtn === btn){ closeFilterSheet(); return; }
    openFilterSheet(btn);
  });
});
// Popover desktop ikut tertutup kalau halaman di-scroll atau jendela diubah ukurannya
window.addEventListener('scroll', (e)=>{
  if(!isDesktopFilter()) return;
  if(e.target && e.target.nodeType===1 && e.target.closest('#filterSheetList')) return;
  closeFilterSheet();
}, true);
window.addEventListener('resize', ()=>{ if(isDesktopFilter()) closeFilterSheet(); });
document.getElementById('filterSheetList').addEventListener('click', (e)=>{
  const item = e.target.closest('.sheet-item');
  if(!item || !filterSheetSel) return;
  filterSheetSel.value = item.dataset.val;
  filterSheetSel.dispatchEvent(new Event('change'));
  closeFilterSheet();
});
document.getElementById('filterSheetClose').addEventListener('click', closeFilterSheet);
document.getElementById('filterSheet').addEventListener('click', (e)=>{ if(e.target.id==='filterSheet') closeFilterSheet(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeFilterSheet(); });

function getFilteredStokRows(skip){
  skip = skip || {};
  const q = document.getElementById('stok_search').value.trim().toLowerCase();
  let rows = currentSheet==='ALL' ? [...parts] : parts.filter(p=>p.unit===currentSheet);
  if(q){
    rows = rows.filter(p=>p.pn.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  }
  if(stokKosongOnly){
    rows = rows.filter(p=>Number(p.qty)<=0);
  }
  const locFilter = document.getElementById('stok_loc_filter').value;
  if(locFilter && !skip.loc){
    rows = rows.filter(p => (p.loc || '').trim().toLowerCase() === locFilter);
  }
  const statusFilter = document.getElementById('stok_status_filter').value;
  if(skip.status){
    // dilewati: dipakai untuk menghitung jumlah per status di bottom-sheet
  } else if(statusFilter === 'EMPTY'){
    rows = rows.filter(p => !p.status);
  } else if(statusFilter){
    rows = rows.filter(p => (p.status || '').toUpperCase() === statusFilter);
  }
  return rows;
}
// Stabilo kuning: bungkus bagian teks yang cocok dengan kata kunci pencarian
// (tidak peduli huruf besar/kecil). Teks tetap di-escape supaya aman.
function hl(text, q){
  const t = String(text == null ? '' : text);
  if(!q) return esc(t);
  const low = t.toLowerCase(); let out = '', i = 0, k;
  while((k = low.indexOf(q, i)) !== -1){
    out += esc(t.slice(i, k)) + '<mark class="hl">' + esc(t.slice(k, k + q.length)) + '</mark>';
    i = k + q.length;
  }
  return out + esc(t.slice(i));
}
// Satu part bisa dapat beberapa parts number sekaligus (mis. beberapa oring
// jadi satu baris stok). Kalau di-input dipisah koma/titik-koma, tampilkan
// satu nomor per baris (bukan satu baris panjang) supaya kolom PN tidak ikut
// melebar dan mendorong kolom lain (Lokasi dst.) keluar layar.
function fmtPN(pn, q){
  const parts = String(pn || '').split(/[,;]+/).map(x=>x.trim()).filter(Boolean);
  if(parts.length <= 1) return hl(pn, q);
  return parts.map((p,i)=> hl(p, q) + (i < parts.length - 1 ? ';' : '')).join('<br>');
}
function renderStokSheet(){
  syncFilterButtons();
  document.querySelectorAll('.sheet-pills button').forEach(b=>b.classList.toggle('active', b.dataset.code===currentSheet));
  const q = document.getElementById('stok_search').value.trim().toLowerCase();
  const tbody = document.getElementById('stokTableBody');
  const emptyEl = document.getElementById('stokEmpty');

  let rows = getFilteredStokRows();
  const locFilter = document.getElementById('stok_loc_filter').value;

  if(rows.length===0){
    tbody.innerHTML='';
    const locLabel = locFilter ? ` di lokasi "<strong>${esc(document.getElementById('stok_loc_filter').selectedOptions[0].textContent)}</strong>"` : '';
    const kosongLabel = stokKosongOnly ? ' (stok kosong)' : '';
    let msg;
    if(q){
      msg = `Tidak ada parts number/nama yang cocok dengan "<strong>${esc(q)}</strong>"${locLabel}${kosongLabel}.`;
    } else if(stokKosongOnly){
      msg = `Tidak ada stok kosong untuk <strong>${esc(currentSheet)}</strong>${locLabel}. Semua part masih tersedia.`;
    } else {
      msg = `Belum ada data sparepart untuk <strong>${esc(currentSheet)}</strong>${locLabel}.`;
    }
    emptyEl.innerHTML = `<div class="empty"><div class="big">${ICON_BOX}</div>${msg}</div>`;
    document.getElementById('stokPagination').innerHTML = '';
    return;
  }
  emptyEl.innerHTML='';

  // Pagination 50 item/halaman: kalau ada 126 parts -> hal.1 = 50, hal.2 = 50, hal.3 = 26
  const totalPages = Math.max(1, Math.ceil(rows.length / STOK_PAGE_SIZE));
  if(stokPage > totalPages) stokPage = totalPages;
  if(stokPage < 1) stokPage = 1;
  const startIdx = (stokPage - 1) * STOK_PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx + STOK_PAGE_SIZE);

  tbody.innerHTML = pageRows.map((p,i)=>`<tr data-id="${esc(p.id)}" tabindex="0"><td>${startIdx+i+1}</td><td class="pn">${fmtPN(p.pn, q)}</td><td><span class="m-pn">${fmtPN(p.pn, q)}</span><span class="m-name">${hl(p.desc, q)}</span>${p.remarks?`<span class="m-note"><b>NOTE:</b> ${esc(p.remarks)}</span>`:''}</td><td class="unit-col">${esc(p.unit)}</td><td>${statusBadge(p.status)}</td><td class="loc"><span class="hl-loc">${esc(p.loc||'-')}</span></td><td class="qty ${p.qty<=0?'low':''}">${p.qty}</td><td class="${p.remarks?'has-remarks':''}" style="color:var(--text-muted);font-size:12.5px;">${esc(p.remarks||'-')}</td></tr>`).join('');
  markSelectedRow();

  renderPaginationControls('stokPagination', stokPage, totalPages, rows.length, 'item', (newPage)=>{
    stokPage = newPage;
    renderStokSheet();
  });
}
document.getElementById('stok_search').addEventListener('input', ()=>{ stokPage = 1; renderStokSheet(); });

function exportStokExcel(){
  const rows = getFilteredStokRows()
    .slice()
    .sort((a,b) => a.unit.localeCompare(b.unit, 'id', {numeric:true}) || a.pn.localeCompare(b.pn, 'id', {numeric:true}));
  if(rows.length===0){ toast('Tidak ada data untuk diexport'); return; }

  const dataForSheet = rows.map((p,i)=>({
    'No': i+1,
    'Parts Number': p.pn,
    'Parts Description': p.desc,
    'Unit': p.unit,
    'Status': p.status || '-',
    'Lokasi': p.loc || '-',
    'Qty': Number(p.qty),
    'Keterangan': p.remarks || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(dataForSheet);
  ws['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 34 }, { wch: 12 },
    { wch: 10 }, { wch: 26 }, { wch: 8 }, { wch: 22 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stok');

  const unitLabel = currentSheet === 'ALL' ? 'semua-unit' : currentSheet.toLowerCase().replace(/\s+/g, '-');
  const tanggal = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `stok-${unitLabel}-${tanggal}.xlsx`);
}
document.getElementById('btnExportStok').addEventListener('click', exportStokExcel);

// Kartu statistik RFU / NOT RFU di header -- diklik langsung pindah ke tab
// Stok dan menyalakan filter status yang sesuai, supaya user langsung lihat
// daftar part-nya tanpa perlu buka dropdown filter manual.
function filterByStatus(status){
  stokKosongOnly = false;
  currentSheet = 'ALL';
  document.getElementById('stok_search').value = '';
  document.getElementById('stok_loc_filter').value = '';
  document.getElementById('stok_status_filter').value = status;
  stokPage = 1;
  switchTab('stok');
  renderStokSheet();
}
const statRfuCard = document.getElementById('statRfuCard');
statRfuCard.addEventListener('click', ()=>filterByStatus('RFU'));
statRfuCard.addEventListener('keydown', (e)=>{
  if(e.key==='Enter' || e.key===' '){ e.preventDefault(); filterByStatus('RFU'); }
});
const statNotRfuCard = document.getElementById('statNotRfuCard');
statNotRfuCard.addEventListener('click', ()=>filterByStatus('NOT RFU'));
statNotRfuCard.addEventListener('keydown', (e)=>{
  if(e.key==='Enter' || e.key===' '){ e.preventDefault(); filterByStatus('NOT RFU'); }
});

// Kontrol Prev/Next generik, dipakai untuk tab Stok maupun tab Riwayat
function renderPaginationControls(containerId, page, totalPages, totalCount, unitLabel, onChange){
  const el = document.getElementById(containerId);
  if(totalPages <= 1 && totalCount <= 0){ el.innerHTML=''; return; }
  el.innerHTML = `
    <div class="pg-info">Halaman ${page} dari ${totalPages} &middot; total ${totalCount} ${unitLabel}</div>
    <div class="pg-btns">
      <button type="button" id="${containerId}_prev" ${page<=1?'disabled':''}>‹ Prev</button>
      <button type="button" id="${containerId}_next" ${page>=totalPages?'disabled':''}>Next ›</button>
    </div>`;
  const prevBtn = document.getElementById(containerId+'_prev');
  const nextBtn = document.getElementById(containerId+'_next');
  if(prevBtn) prevBtn.onclick = ()=>{ if(page>1) onChange(page-1); };
  if(nextBtn) nextBtn.onclick = ()=>{ if(page<totalPages) onChange(page+1); };
}
function renderRiwayat(){
  // transactions di sini SUDAH berupa satu halaman (maks 50 baris) hasil
  // query ke Supabase di loadRiwayatPage() -- tidak difilter/diurutkan lagi
  // di sini, itu sudah dikerjakan oleh server.
  const el = document.getElementById('riwayatList');
  if(transactions.length===0){
    const q = document.getElementById('riwayat_search').value.trim();
    const msg = q
      ? `Tidak ada riwayat parts number/nama yang cocok dengan "<strong>${esc(q)}</strong>".`
      : `Belum ada riwayat transaksi.`;
    el.innerHTML = `<div class="empty"><div class="big">${ICON_CLOCK}</div>${msg}</div>`;
    document.getElementById('riwayatPagination').innerHTML = '';
    return;
  }
  el.innerHTML = transactions.map(t=>`
    <div class="tx-row">
      <div>
        <div style="font-weight:600;font-size:13.5px;">${esc(t.desc)}</div>
        <div class="tx-meta mono">${esc(t.pn)}</div>
        <div class="tx-unit">${esc(t.unit)} &nbsp;${statusBadge(t.status)}</div>
        <div class="tx-meta">${ICON_PIN} ${esc(t.loc || '-')}</div>
        ${t.note ? `<div class="tx-meta">${ICON_NOTE} ${esc(t.note)}</div>` : ''}
        ${t.nama ? `<div class="tx-meta">${ICON_USER} ${esc(t.nama)}</div>` : ''}
        <div class="tx-meta">${new Date(t.ts).toLocaleString('id-ID')}</div>
        ${isAdmin ? `<button type="button" class="edit-btn tx-edit" onclick="openEditRiwayat('${t.id}')">Edit</button>` : ''}
      </div>
      <div style="text-align:right;">
        <div class="tx-qty ${t.type}">${t.type==='masuk'?'INPUT':'AMBIL'} : ${t.type==='masuk'?'':'-'}${t.qty}</div>
      </div>
    </div>`).join('');

  renderPaginationControls('riwayatPagination', riwayatPage, riwayatPageCount, riwayatTotal, 'transaksi', (newPage)=>{
    loadRiwayatPage(newPage);
  });
}
document.getElementById('filterType').addEventListener('change', ()=>loadRiwayatPage(1));
document.getElementById('filterUnit').addEventListener('change', ()=>loadRiwayatPage(1));

// Debounce kecil (300ms) khusus search riwayat -- beda dari search stok yang
// filter langsung di browser, search riwayat ini nge-query ke Supabase tiap
// kali dipanggil, jadi kalau tanpa jeda bisa nembak banyak request tiap ketik.
let riwayatSearchDebounce = null;
document.getElementById('riwayat_search').addEventListener('input', ()=>{
  clearTimeout(riwayatSearchDebounce);
  riwayatSearchDebounce = setTimeout(()=>loadRiwayatPage(1), 300);
});

async function inputBarang(){
  const unit = document.getElementById('in_unit').value;
  const pn = document.getElementById('in_pn').value.trim();
  const desc = document.getElementById('in_desc').value.trim();
  const loc = document.getElementById('in_loc').value.trim();
  const status = document.getElementById('in_status').value;
  const qty = Number(document.getElementById('in_qty').value);
  const remarks = document.getElementById('in_remarks').value.trim();
  const nama = document.getElementById('in_nama').value.trim();
  if(!pn || !desc){ toast('Parts Number dan Description wajib diisi'); return; }
  if(!qty || qty<=0){ toast('Quantity harus lebih dari 0'); return; }
  if(!nama){ toast('Nama penginput wajib diisi'); return; }

  const btn = document.getElementById('btnInput'); btn.disabled = true; btn.textContent='Menyimpan...';
  try{
    const data = await runScript('inputBarang', unit, pn, desc, loc, qty, nama, status, remarks);
    parts = data.parts; transactions = data.transactions;
    toast(`Input tersimpan untuk ${pn} di ${unit} (${status})`);
    document.getElementById('in_pn').value=''; document.getElementById('in_desc').value=''; document.getElementById('in_loc').value=''; document.getElementById('in_qty').value=''; document.getElementById('in_status').value='RFU'; document.getElementById('in_remarks').value='';
    try{ localStorage.setItem('stok_nama_terakhir', nama); }catch(e){}
    currentSheet = unit; render();
  }catch(e){ toast('Gagal: ' + (e.message||e)); }
  btn.textContent='Simpan Input Barang';
  updateInputButtonState();
}

// --- Bantuan cari part (dipakai bareng tab Input & Ambil): cocokkan
// ketikan user ke parts number ATAU parts description, biar ketik nama
// part juga bisa memunculkan saran, bukan cuma ketik nomor. ---
function partMatchesQuery(p, q){
  return p.pn.toLowerCase().includes(q) || (p.desc && p.desc.toLowerCase().includes(q));
}

// --- Tab Input: sambil ketik parts number, tampilkan daftar part yang
// mirip (dari nomor ATAU nama part) supaya tidak salah ketik/dobel input.
// Klik salah satu saran untuk isi otomatis parts number + description sekaligus.
document.getElementById('in_pn').addEventListener('input', function(e){
  const q = e.target.value.trim().toLowerCase();
  const box = document.getElementById('in_matches');
  if(!q){ box.innerHTML=''; return; }

  const partial = parts.filter(p=>partMatchesQuery(p,q));
  if(partial.length===0){ box.innerHTML=''; return; }
  box.innerHTML = `<div class="suggest-scroll">` + partial.map(p=>`
    <button type="button" class="btn btn-outline" style="display:block;width:100%;text-align:left;margin-bottom:6px;font-size:12.5px;" onclick="pickInputSuggestion('${p.id}')">
      <span class="mono">${esc(p.pn)}</span> — ${esc(p.desc)} <span style="color:var(--amber);">(${esc(p.unit)})</span>
    </button>`).join('') + `</div>`;
});
function pickInputSuggestion(id){
  const p = parts.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('in_pn').value = p.pn;
  document.getElementById('in_desc').value = p.desc;
  // Ikut isikan lokasi & status dari part yang dipilih -- kalau user memang
  // maksudnya menambah qty ke baris stok yang PERSIS sama (unit+pn+lokasi+status),
  // ini membantu supaya tidak keliru bikin baris baru yang terpisah.
  // User tetap bebas mengubahnya kalau memang mau bikin baris terpisah.
  document.getElementById('in_loc').value = p.loc || '';
  document.getElementById('in_status').value = (p.status || 'RFU').toUpperCase();
  document.getElementById('in_matches').innerHTML='';
  updateInputButtonState();
}

document.getElementById('ax_pn').addEventListener('input', function(e){
  const q = e.target.value.trim().toLowerCase();
  ambilSelectedPartId = null;
  document.getElementById('ax_found').innerHTML='';
  updateAmbilButtonState();
  const matchesEl = document.getElementById('ax_matches');
  if(!q){ matchesEl.innerHTML=''; return; }
  const matches = parts.filter(p=>partMatchesQuery(p,q));
  if(matches.length===0){ matchesEl.innerHTML = `<div style="color:var(--red);font-size:12.5px;margin:4px 0 10px;">Parts number / nama part tidak ditemukan.</div>`; return; }
  if(matches.length===1 && matches[0].pn.toLowerCase()===q){ selectAmbilPart(matches[0].id); matchesEl.innerHTML=''; return; }
  matchesEl.innerHTML = `<div class="suggest-scroll">` + matches.map(p=>`
    <button type="button" class="btn btn-outline" style="display:block;width:100%;text-align:left;margin-bottom:6px;font-size:12.5px;" onclick="selectAmbilPart('${p.id}')">
      <span class="mono">${esc(p.pn)}</span> — ${esc(p.desc)} <span style="color:var(--amber);">(${esc(p.unit)}, ${esc(p.loc||'-')}, stok ${p.qty})</span> ${statusBadge(p.status)}
    </button>`).join('') + `</div>`;
});
function selectAmbilPart(id){
  ambilSelectedPartId = id;
  const p = parts.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('ax_matches').innerHTML='';
  document.getElementById('ax_pn').value = p.pn;
  document.getElementById('ax_found').innerHTML = `<div class="found-card"><div class="pn mono">${esc(p.pn)}</div><div class="nm">${esc(p.desc)}</div><div class="stok">Stok saat ini: <strong>${p.qty}</strong>${p.loc ? ' · Lokasi: '+esc(p.loc) : ''} &nbsp;${statusBadge(p.status)}</div><span class="unit">${esc(p.unit)}</span></div>`;
  updateAmbilButtonState();
}
async function ambilBarang(){
  if(!ambilSelectedPartId){ toast('Pilih parts number yang valid dari daftar stok'); return; }
  const part = parts.find(p=>p.id===ambilSelectedPartId);
  if(!part){ toast('Data part tidak ditemukan'); return; }
  const qty = Number(document.getElementById('ax_qty').value);
  const note = document.getElementById('ax_note').value.trim();
  const nama = document.getElementById('ax_nama').value.trim();
  if(!qty || qty<=0){ toast('Quantity harus lebih dari 0'); return; }
  if(!note){ toast('Keterangan keperluan wajib diisi'); return; }
  if(!nama){ toast('Nama pengambil wajib diisi'); return; }

  const btn = document.getElementById('btnAmbil'); btn.disabled=true; btn.textContent='Menyimpan...';
  try{
    const data = await runScript('ambilBarang', part.id, qty, note, nama);
    parts = data.parts; transactions = data.transactions;
    toast(`Ambil barang tersimpan untuk ${part.pn}`);
    document.getElementById('ax_pn').value=''; document.getElementById('ax_qty').value=''; document.getElementById('ax_note').value='';
    document.getElementById('ax_found').innerHTML=''; ambilSelectedPartId=null;
    try{ localStorage.setItem('stok_nama_terakhir', nama); }catch(e){}
    currentSheet = part.unit; render();
  }catch(e){ toast('Gagal: ' + (e.message||e)); }
  btn.textContent='Simpan Ambil Barang';
  updateAmbilButtonState();
}

// --- Tab Transfer: pindahkan sebagian/seluruh qty sebuah part ke lokasi
// (dan/atau status) lain. Kalau kombinasi tujuan sudah ada barisnya,
// qty tinggal digabung; kalau belum, dibuatkan baris baru otomatis --
// logika ini ditangani di RPC transfer_stok, bukan di sini.
document.getElementById('tf_pn').addEventListener('input', function(e){
  const q = e.target.value.trim().toLowerCase();
  tfSelectedPartId = null;
  document.getElementById('tf_found').innerHTML='';
  updateTransferButtonState();
  const matchesEl = document.getElementById('tf_matches');
  if(!q){ matchesEl.innerHTML=''; return; }
  const matches = parts.filter(p=>partMatchesQuery(p,q));
  if(matches.length===0){ matchesEl.innerHTML = `<div style="color:var(--red);font-size:12.5px;margin:4px 0 10px;">Parts number / nama part tidak ditemukan.</div>`; return; }
  if(matches.length===1 && matches[0].pn.toLowerCase()===q){ selectTransferPart(matches[0].id); matchesEl.innerHTML=''; return; }
  matchesEl.innerHTML = `<div class="suggest-scroll">` + matches.map(p=>`
    <button type="button" class="btn btn-outline" style="display:block;width:100%;text-align:left;margin-bottom:6px;font-size:12.5px;" onclick="selectTransferPart('${p.id}')">
      <span class="mono">${esc(p.pn)}</span> — ${esc(p.desc)} <span style="color:var(--amber);">(${esc(p.unit)}, ${esc(p.loc||'-')}, stok ${p.qty})</span> ${statusBadge(p.status)}
    </button>`).join('') + `</div>`;
});
function selectTransferPart(id){
  tfSelectedPartId = id;
  const p = parts.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('tf_matches').innerHTML='';
  document.getElementById('tf_pn').value = p.pn;
  document.getElementById('tf_found').innerHTML = `<div class="found-card"><div class="pn mono">${esc(p.pn)}</div><div class="nm">${esc(p.desc)}</div><div class="stok">Stok saat ini: <strong>${p.qty}</strong>${p.loc ? ' · Lokasi: '+esc(p.loc) : ''} &nbsp;${statusBadge(p.status)}</div><span class="unit">${esc(p.unit)}</span></div>`;
  // Status tujuan default disamakan dengan status asal -- user tinggal
  // ubah kalau memang mau sekalian ganti status saat transfer.
  document.getElementById('tf_status').value = (p.status || 'RFU').toUpperCase();
  updateTransferButtonState();
}
async function transferBarang(){
  if(!tfSelectedPartId){ toast('Pilih parts number yang valid dari daftar stok'); return; }
  const part = parts.find(p=>p.id===tfSelectedPartId);
  if(!part){ toast('Data part tidak ditemukan'); return; }
  const qty = Number(document.getElementById('tf_qty').value);
  const destLoc = document.getElementById('tf_loc').value.trim();
  const destStatus = document.getElementById('tf_status').value;
  const note = document.getElementById('tf_note').value.trim();
  const nama = document.getElementById('tf_nama').value.trim();
  if(!qty || qty<=0){ toast('Quantity harus lebih dari 0'); return; }
  if(qty > part.qty){ toast(`Stok tidak cukup. Stok tersedia: ${part.qty}`); return; }
  if(!destLoc){ toast('Lokasi tujuan wajib diisi'); return; }
  if(!nama){ toast('Nama wajib diisi'); return; }
  if(destLoc.toLowerCase() === (part.loc||'').trim().toLowerCase() && destStatus === (part.status||'').toUpperCase()){
    toast('Lokasi & status tujuan sama dengan asal -- tidak ada yang perlu dipindah'); return;
  }

  const btn = document.getElementById('btnTransfer'); btn.disabled=true; btn.textContent='Menyimpan...';
  try{
    const data = await runScript('transferStok', part.id, qty, destLoc, destStatus, note, nama);
    parts = data.parts; transactions = data.transactions;
    toast(`${qty} pcs ${part.pn} dipindah ke ${destLoc} (${destStatus})`);
    document.getElementById('tf_pn').value=''; document.getElementById('tf_qty').value=''; document.getElementById('tf_loc').value=''; document.getElementById('tf_note').value='';
    document.getElementById('tf_found').innerHTML=''; tfSelectedPartId=null;
    try{ localStorage.setItem('stok_nama_terakhir', nama); }catch(e){}
    currentSheet = part.unit; render();
  }catch(e){ toast('Gagal: ' + (e.message||e)); }
  btn.textContent='Simpan Transfer';
  updateTransferButtonState();
}

// --- Kolom tab Input & Ambil diurutkan sesuai urutan isian di layar.
// Enter di kolom mana pun akan PINDAH ke kolom berikutnya (seperti Tab),
// jadi tidak perlu menggerakkan kursor tiap ganti kolom. Enter di kolom
// TERAKHIR baru akan menyimpan data -- itu pun hanya kalau semua kolom
// wajib sudah terisi.
function isInputFormReady(){
  const pn = document.getElementById('in_pn').value.trim();
  const desc = document.getElementById('in_desc').value.trim();
  const qty = Number(document.getElementById('in_qty').value);
  const nama = document.getElementById('in_nama').value.trim();
  return !!pn && !!desc && qty > 0 && !!nama;
}
function isAmbilFormReady(){
  const qty = Number(document.getElementById('ax_qty').value);
  const note = document.getElementById('ax_note').value.trim();
  const nama = document.getElementById('ax_nama').value.trim();
  return !!ambilSelectedPartId && qty > 0 && !!note && !!nama;
}
function isTransferFormReady(){
  const qty = Number(document.getElementById('tf_qty').value);
  const destLoc = document.getElementById('tf_loc').value.trim();
  const nama = document.getElementById('tf_nama').value.trim();
  return !!tfSelectedPartId && qty > 0 && !!destLoc && !!nama;
}
const INPUT_FIELD_ORDER = ['in_unit','in_pn','in_desc','in_loc','in_qty','in_remarks','in_nama'];
const AMBIL_FIELD_ORDER = ['ax_pn','ax_qty','ax_note','ax_nama'];
const TRANSFER_FIELD_ORDER = ['tf_pn','tf_qty','tf_loc','tf_status','tf_note','tf_nama'];

function setupEnterNavigation(order, isReadyFn, submitFn){
  order.forEach((id, idx)=>{
    const el = document.getElementById(id);
    el.addEventListener('keydown', (e)=>{
      if(e.key !== 'Enter') return;
      e.preventDefault(); // supaya Enter tidak reload halaman/submit form browser
      const nextId = order[idx+1];
      if(nextId){
        const nextEl = document.getElementById(nextId);
        nextEl.focus();
        if(typeof nextEl.select === 'function') nextEl.select();
      } else if(isReadyFn()){
        submitFn();
      }
      // kalau di kolom terakhir tapi belum lengkap, Enter diabaikan --
      // user tetap harus melengkapi kolom yang kosong dulu.
    });
  });
}
setupEnterNavigation(INPUT_FIELD_ORDER, isInputFormReady, inputBarang);
setupEnterNavigation(AMBIL_FIELD_ORDER, isAmbilFormReady, ambilBarang);
setupEnterNavigation(TRANSFER_FIELD_ORDER, isTransferFormReady, transferBarang);

// --- Tombol Simpan hidup (jelas & bisa diklik) hanya kalau semua kolom
// wajib sudah terisi -- dicek ulang tiap kali ada perubahan di kolom mana pun.
function updateInputButtonState(){
  document.getElementById('btnInput').disabled = !isInputFormReady();
}
function updateAmbilButtonState(){
  document.getElementById('btnAmbil').disabled = !isAmbilFormReady();
}
function updateTransferButtonState(){
  document.getElementById('btnTransfer').disabled = !isTransferFormReady();
}
function bindLiveButtonState(order, updateFn){
  order.forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', updateFn);
    el.addEventListener('change', updateFn);
  });
}
bindLiveButtonState(INPUT_FIELD_ORDER, updateInputButtonState);
bindLiveButtonState(AMBIL_FIELD_ORDER, updateAmbilButtonState);
bindLiveButtonState(TRANSFER_FIELD_ORDER, updateTransferButtonState);
// Kondisi awal saat halaman baru dibuka: kolom masih kosong -> tombol nonaktif dulu
updateInputButtonState();
updateAmbilButtonState();
updateTransferButtonState();

// --- Edit Riwayat (admin) -- cuma field non-stok (unit/pn/desc/keterangan/nama).
// Jenis & Qty transaksi sengaja tidak bisa diedit supaya stok saat ini
// tidak jadi tidak sinkron dengan catatan riwayatnya.
function openEditRiwayat(id){
  const t = transactions.find(x=>String(x.id)===String(id));
  if(!t) return;
  document.getElementById('er_unit').value = t.unit;
  document.getElementById('er_pn').value = t.pn;
  document.getElementById('er_desc').value = t.desc;
  document.getElementById('er_note').value = t.note || '';
  document.getElementById('er_nama').value = t.nama || '';
  document.getElementById('editRiwayatModal').dataset.editId = id;
  document.getElementById('editRiwayatError').textContent = '';
  openModal('editRiwayatModal');
}
async function saveEditRiwayat(){
  const id = document.getElementById('editRiwayatModal').dataset.editId;
  const unit = document.getElementById('er_unit').value;
  const pn = document.getElementById('er_pn').value.trim();
  const desc = document.getElementById('er_desc').value.trim();
  const note = document.getElementById('er_note').value.trim();
  const nama = document.getElementById('er_nama').value.trim();
  const errEl = document.getElementById('editRiwayatError');
  if(!pn || !desc){ errEl.textContent = 'Parts Number dan Description wajib diisi.'; return; }
  const btn = document.getElementById('btnSaveEditRiwayat');
  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try{
    await runScript('updateRiwayat', id, unit, pn, desc, note, nama);
    closeModal('editRiwayatModal');
    toast('Riwayat berhasil diperbarui');
    loadRiwayatPage(riwayatPage);
  }catch(e){
    errEl.textContent = e.message || 'Gagal menyimpan.';
  }finally{
    btn.disabled = false; btn.textContent = 'Simpan';
  }
}

// --- Live update tanpa refresh ---
// Kalau ada HP lain yang ambil/input/transfer barang, tabel stok & riwayat
// di layar ini otomatis ikut ter-update sendiri (tanpa perlu tekan refresh),
// lewat fitur Realtime Supabase. Sengaja TIDAK reset halaman/filter yang
// sedang dilihat user -- cuma tarik data baru & render ulang di tempat.
let realtimeDebounce = null;
function scheduleRealtimeRefresh(fn){
  clearTimeout(realtimeDebounce);
  realtimeDebounce = setTimeout(fn, 400);
}
async function refreshPartsRealtime(){
  try{
    const data = await runScript('getAllData');
    parts = data.parts;
    populateLocationFilter();
    renderStats();
    renderStokSheet();
    paOnDataChanged();
  }catch(e){ /* diamkan -- jangan ganggu user kalau refresh background gagal */ }
}
function refreshRiwayatRealtime(){
  loadRiwayatPage(riwayatPage).catch(()=>{});
}
try{
  sb.channel('stok-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stok' }, ()=>{
      scheduleRealtimeRefresh(refreshPartsRealtime);
    })
    .subscribe();
  sb.channel('riwayat-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'riwayat' }, ()=>{
      scheduleRealtimeRefresh(refreshRiwayatRealtime);
    })
    .subscribe();
}catch(e){ /* kalau Realtime gagal aktif, web tetap jalan normal -- cuma butuh refresh manual */ }

// =====================================================================
// Aksi cepat: klik/ketuk baris di tab Stok -> panel detail part.
// Dari panel yang SAMA user bisa Ambil / Transfer (semua orang) atau
// Edit / Hapus (khusus admin). Isi panel berganti, tidak menumpuk modal.
// Tombol Back HP & tombol Esc menutup panel. Semua simpan tetap lewat
// RPC yang sudah ada (ambil_barang, transfer_stok, update_part, delete_part).
// =====================================================================
const paState = { open:false, id:null, view:'detail', busy:false, returnId:null };
const PA_ICON = {
  x:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  take: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v10"/><path d="m8 7 4-4 4 4"/><path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/></svg>',
  move: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>'
};

function paPart(){ return parts.find(p=>String(p.id)===String(paState.id)); }
function paSavedName(){ try{ return localStorage.getItem('stok_nama_terakhir') || ''; }catch(e){ return ''; } }
function paSaveName(n){ try{ localStorage.setItem('stok_nama_terakhir', n); }catch(e){} }
function paStatusClass(st){ const s=(st||'').toUpperCase(); return s==='RFU' ? 's-rfu' : s==='NOT RFU' ? 's-not' : ''; }

function markSelectedRow(){
  document.querySelectorAll('#stokTableBody tr[data-id]').forEach(tr=>{
    tr.classList.toggle('pa-selected', paState.open && tr.dataset.id === String(paState.id));
  });
}

// ---------- Buka / tutup ----------
function openPartSheet(id){
  if(!parts.find(p=>String(p.id)===String(id))) return;
  paState.id = id; paState.view = 'detail'; paState.returnId = id;
  if(!paState.open){
    paState.open = true;
    try{ history.pushState({ paSheet:true }, ''); }catch(e){}
    const ov = document.getElementById('partSheet');
    ov.style.display = 'flex';
    ov.setAttribute('aria-hidden','false');
    document.body.classList.add('pa-lock');
    requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('open')));
  }
  paRender();
  markSelectedRow();
}
function paHide(){
  if(!paState.open) return;
  paState.open = false; paState.busy = false;
  const ov = document.getElementById('partSheet');
  ov.classList.remove('open');
  ov.setAttribute('aria-hidden','true');
  document.body.classList.remove('pa-lock');
  setTimeout(()=>{ if(!paState.open) ov.style.display = 'none'; }, 260);
  markSelectedRow();
  // kembalikan fokus keyboard ke baris yang tadi dibuka (kalau masih ada)
  const rid = paState.returnId; paState.id = null;
  const tr = rid ? document.querySelector(`#stokTableBody tr[data-id="${CSS.escape(String(rid))}"]`) : null;
  if(tr) tr.focus({ preventScroll:true });
}
// Tutup lewat UI -> mundurkan history juga, supaya tombol Back HP tetap konsisten
function closePartSheet(){
  if(!paState.open) return;
  if(history.state && history.state.paSheet){ history.back(); } else { paHide(); }
}
window.addEventListener('popstate', ()=>{ if(paState.open) paHide(); });
document.getElementById('partSheet').addEventListener('click', (e)=>{ if(e.target.id === 'partSheet') closePartSheet(); });
document.addEventListener('keydown', (e)=>{
  if(!paState.open) return;
  if(e.key === 'Escape'){ e.preventDefault(); closePartSheet(); return; }
  if(e.key === 'Tab'){ // jaga fokus tetap di dalam panel
    const f = [...document.querySelectorAll('#paBody button:not(:disabled), #paBody input, #paBody select, #paBody [tabindex="0"]')]
      .filter(el=>el.offsetParent !== null);
    if(!f.length) return;
    const first = f[0], last = f[f.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
});

// Klik / Enter di baris tabel
const stokTbodyEl = document.getElementById('stokTableBody');
stokTbodyEl.addEventListener('click', (e)=>{
  const tr = e.target.closest('tr[data-id]');
  if(!tr) return;
  // kalau user sedang blok/copy teks parts number, jangan buka panel
  const sel = window.getSelection ? String(window.getSelection()) : '';
  if(sel.length > 0) return;
  openPartSheet(tr.dataset.id);
});
stokTbodyEl.addEventListener('keydown', (e)=>{
  if((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-id]')){
    e.preventDefault(); openPartSheet(e.target.dataset.id);
  }
});

function paGo(view){ paState.view = view; paRender(); }

// ---------- Render ----------
function paHeadHtml(p, withBack){
  return `<div class="pa-head">
    ${withBack ? `<button type="button" class="pa-icon-btn" data-pa="back" aria-label="Kembali ke detail part">${PA_ICON.back}</button>` : ''}
    <div class="pa-id"><div class="pa-pn">${esc(p.pn)}</div><h3 id="paTitle" tabindex="-1">${esc(p.desc)}</h3></div>
    <button type="button" class="pa-icon-btn" data-pa="close" aria-label="Tutup">${PA_ICON.x}</button>
  </div>`;
}
function paContextHtml(p){
  return `<div class="pa-context">Stok <strong>${p.qty} pcs</strong> di <strong>${esc(p.loc||'-')}</strong> ${statusBadge(p.status)}</div>`;
}
function paDetailHtml(p){
  const empty = Number(p.qty) <= 0;
  return `
    <div class="pa-plate ${paStatusClass(p.status)}">
      <div class="pa-qty ${empty?'zero':''}"><span class="n">${p.qty}</span><span class="l">${empty?'stok habis':'pcs tersedia'}</span></div>
      <dl class="pa-spec">
        <div><dt>Unit</dt><dd>${esc(p.unit)}</dd></div>
        <div><dt>Lokasi</dt><dd>${esc(p.loc||'-')}</dd></div>
        <div><dt>Status</dt><dd>${statusBadge(p.status)}</dd></div>
      </dl>
    </div>
    ${p.remarks ? `<div class="pa-note"><span>Catatan</span>${esc(p.remarks)}</div>` : ''}
    <div class="pa-actions">
      <button type="button" class="pa-act take" data-pa="go-ambil" ${empty?'disabled':''}><span class="ic">${PA_ICON.take}</span><span><b>Ambil</b><small>Keluarkan untuk dipakai</small></span></button>
      <button type="button" class="pa-act move" data-pa="go-transfer" ${empty?'disabled':''}><span class="ic">${PA_ICON.move}</span><span><b>Transfer</b><small>Pindah lokasi / status</small></span></button>
    </div>
    ${empty ? `<div class="pa-empty">Stok part ini habis. <button type="button" data-pa="to-input">Tambah stok lewat Input</button></div>` : ''}
    ${isAdmin ? `<div class="pa-admin">
      <span class="pa-admin-label">Admin</span>
      <button type="button" class="pa-link" data-pa="go-edit">Edit data</button>
      <button type="button" class="pa-link danger" data-pa="go-hapus">Hapus baris</button>
    </div>` : ''}`;
}
function paStepperHtml(max){
  return `<div class="field"><label for="pa_qty">Jumlah</label>
    <div class="pa-stepper">
      <button type="button" data-pa="minus" aria-label="Kurangi jumlah">&minus;</button>
      <input id="pa_qty" type="number" inputmode="numeric" min="1" max="${max}" value="1">
      <button type="button" data-pa="plus" aria-label="Tambah jumlah">+</button>
    </div>
    <div class="pa-avail"><span id="pa_avail">Tersedia ${max} pcs</span>
      <button type="button" class="pa-chip" data-pa="all">Semua (${max})</button></div>
  </div>`;
}
function paAmbilHtml(p){
  return paContextHtml(p) + paStepperHtml(p.qty) + `
    <div class="field"><label for="pa_note">Keperluan</label><input id="pa_note" class="mono" placeholder="cth: Perbaikan unit E5138" autocomplete="off"></div>
    <div class="field"><label for="pa_nama">Nama pengambil</label><input id="pa_nama" class="mono" placeholder="Nama kamu" value="${esc(paSavedName())}"></div>
    <div class="pa-err" id="pa_err" role="alert"></div>
    <button type="button" class="btn btn-amber pa-submit" id="pa_submit" data-pa="submit-ambil" disabled>Ambil</button>`;
}
function paTransferHtml(p){
  // saran lokasi cepat: lokasi yang paling sering dipakai, selain lokasi asal
  const count = new Map();
  parts.forEach(x=>{ const l=(x.loc||'').trim(); if(l) count.set(l.toUpperCase(), (count.get(l.toUpperCase())||0)+1); });
  const here = (p.loc||'').trim().toUpperCase();
  const chips = [...count.entries()].filter(([l])=>l!==here).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([l])=>l);
  const st = (p.status||'RFU').toUpperCase();
  return paContextHtml(p) + paStepperHtml(p.qty) + `
    <div class="field"><label for="pa_loc">Lokasi tujuan</label>
      <input id="pa_loc" class="mono" list="loc_datalist" autocomplete="off" placeholder="cth: Laydown, Lemari hijau">
      ${chips.length ? `<div class="pa-chips">${chips.map(l=>`<button type="button" class="pa-chip" data-pa="loc" data-loc="${esc(l)}">${esc(l)}</button>`).join('')}</div>` : ''}
    </div>
    <div class="field"><label>Status di tujuan</label>
      <div class="pa-seg" role="radiogroup">
        <label class="rfu ${st==='RFU'?'on':''}"><input type="radio" name="pa_status" value="RFU" ${st==='RFU'?'checked':''}>RFU</label>
        <label class="not ${st==='NOT RFU'?'on':''}"><input type="radio" name="pa_status" value="NOT RFU" ${st==='NOT RFU'?'checked':''}>NOT RFU</label>
      </div>
    </div>
    <div class="field"><label for="pa_note">Keterangan <span class="pa-opt">(opsional)</span></label><input id="pa_note" class="mono" placeholder="cth: Kirim ke vendor untuk perbaikan" autocomplete="off"></div>
    <div class="field"><label for="pa_nama">Nama</label><input id="pa_nama" class="mono" placeholder="Nama kamu" value="${esc(paSavedName())}"></div>
    <div class="pa-err" id="pa_err" role="alert"></div>
    <button type="button" class="btn btn-amber pa-submit" id="pa_submit" data-pa="submit-transfer" disabled>Pindahkan</button>`;
}
function paEditHtml(p){
  const unitOpts = ['Excavator','Bulldozer'].map(cat=>`<optgroup label="${cat}">` +
    UNIT_MODELS.filter(u=>u.cat===cat).map(u=>`<option value="${esc(u.code)}" ${u.code===p.unit?'selected':''}>${esc(u.code)}</option>`).join('') + '</optgroup>').join('');
  const st = (p.status||'').toUpperCase();
  return `
    <div class="field"><label for="pa_unit">Unit model</label><select id="pa_unit">${unitOpts}</select></div>
    <div class="field"><label for="pa_pn">Parts number</label><input id="pa_pn" class="mono" value="${esc(p.pn)}"></div>
    <div class="field"><label for="pa_desc">Parts description</label><input id="pa_desc" class="mono" value="${esc(p.desc)}"></div>
    <div class="pa-row2">
      <div class="field"><label for="pa_loc">Lokasi</label><input id="pa_loc" class="mono" list="loc_datalist" autocomplete="off" value="${esc(p.loc||'')}"></div>
      <div class="field"><label for="pa_status_sel">Status</label>
        <select id="pa_status_sel">
          <option value="" ${!st?'selected':''}>Tanpa status</option>
          <option value="RFU" ${st==='RFU'?'selected':''}>RFU</option>
          <option value="NOT RFU" ${st==='NOT RFU'?'selected':''}>NOT RFU</option>
        </select></div>
    </div>
    <div class="field"><label for="pa_eqty">Qty</label><input id="pa_eqty" type="number" min="0" inputmode="numeric" class="mono" value="${p.qty}">
      <div class="pa-help">Koreksi qty di sini tidak tercatat di Riwayat. Untuk barang masuk/keluar, pakai Input atau Ambil.</div></div>
    <div class="field"><label for="pa_remarks">Remarks <span class="pa-opt">(opsional)</span></label><input id="pa_remarks" class="mono" value="${esc(p.remarks||'')}"></div>
    <div class="pa-err" id="pa_err" role="alert"></div>
    <button type="button" class="btn btn-amber pa-submit" id="pa_submit" data-pa="submit-edit">Simpan perubahan</button>`;
}
function paHapusHtml(p){
  return `
    <div class="pa-plate ${paStatusClass(p.status)}" style="margin-bottom:14px;">
      <div class="pa-qty ${Number(p.qty)<=0?'zero':''}"><span class="n">${p.qty}</span><span class="l">pcs</span></div>
      <dl class="pa-spec">
        <div><dt>Unit</dt><dd>${esc(p.unit)}</dd></div>
        <div><dt>Lokasi</dt><dd>${esc(p.loc||'-')}</dd></div>
      </dl>
    </div>
    <div class="pa-warn">Baris ini akan hilang dari tab Stok. Riwayat transaksinya <strong>tetap tersimpan</strong>. Tindakan ini tidak bisa dibatalkan.</div>
    <div class="pa-err" id="pa_err" role="alert"></div>
    <div class="pa-row2">
      <button type="button" class="btn btn-outline pa-submit" data-pa="back">Batal</button>
      <button type="button" class="btn btn-red pa-submit" id="pa_submit" data-pa="submit-hapus">Hapus baris</button>
    </div>`;
}

function paRender(){
  const p = paPart();
  const body = document.getElementById('paBody');
  if(!p){ closePartSheet(); return; }
  const v = paState.view;
  const views = { detail:paDetailHtml, ambil:paAmbilHtml, transfer:paTransferHtml, edit:paEditHtml, hapus:paHapusHtml };
  body.innerHTML = paHeadHtml(p, v !== 'detail') + (views[v] || paDetailHtml)(p);
  body.scrollTop = 0;
  paBind(p);
  // fokus ke judul (tidak memunculkan keyboard HP), pembaca layar tetap tahu konteksnya
  const t = document.getElementById('paTitle'); if(t) t.focus({ preventScroll:true });
}

// ---------- Interaksi ----------
function paQty(){ const n = parseInt(document.getElementById('pa_qty')?.value, 10); return isNaN(n) ? 0 : n; }
function paUpdate(){
  const p = paPart(); if(!p) return;
  const btn = document.getElementById('pa_submit'); if(!btn) return;
  const v = paState.view;
  const val = id => (document.getElementById(id)?.value || '').trim();
  if(v === 'ambil' || v === 'transfer'){
    const q = paQty(), max = Number(p.qty);
    document.querySelector('[data-pa="minus"]').disabled = q <= 1;
    document.querySelector('[data-pa="plus"]').disabled = q >= max;
    document.querySelector('[data-pa="all"]').classList.toggle('on', q === max);
    const qOk = q >= 1 && q <= max;
    if(v === 'ambil'){
      btn.disabled = paState.busy || !qOk || !val('pa_note') || !val('pa_nama');
      btn.textContent = paState.busy ? 'Menyimpan...' : (qOk ? `Ambil ${q} pcs` : 'Ambil');
    } else {
      const loc = val('pa_loc').toUpperCase();
      const st = document.querySelector('input[name="pa_status"]:checked')?.value || 'RFU';
      const same = loc && loc === (p.loc||'').trim().toUpperCase() && st === (p.status||'').toUpperCase();
      document.querySelectorAll('[data-pa="loc"]').forEach(c=>c.classList.toggle('on', c.dataset.loc === loc));
      document.querySelectorAll('.pa-seg label').forEach(l=>l.classList.toggle('on', l.querySelector('input').checked));
      document.getElementById('pa_err').textContent = same ? 'Lokasi dan status tujuan sama dengan asal. Ganti salah satunya.' : '';
      btn.disabled = paState.busy || !qOk || !loc || same || !val('pa_nama');
      btn.textContent = paState.busy ? 'Menyimpan...' : ('Pindahkan' + (qOk ? ` ${q} pcs` : '') + (loc ? ` ke ${loc}` : ''));
    }
  }
}
function paSetQty(n){
  const p = paPart(); const inp = document.getElementById('pa_qty'); if(!p || !inp) return;
  inp.value = Math.max(1, Math.min(Number(p.qty), n));
  paUpdate();
}
function paBind(p){
  const body = document.getElementById('paBody');
  body.onclick = (e)=>{
    const b = e.target.closest('[data-pa]'); if(!b || b.disabled) return;
    const a = b.dataset.pa;
    if(a === 'close') closePartSheet();
    else if(a === 'back') paGo('detail');
    else if(a === 'go-ambil') paGo('ambil');
    else if(a === 'go-transfer') paGo('transfer');
    else if(a === 'go-edit') paGo('edit');
    else if(a === 'go-hapus') paGo('hapus');
    else if(a === 'minus') paSetQty(paQty() - 1);
    else if(a === 'plus') paSetQty(paQty() + 1);
    else if(a === 'all') paSetQty(Number(paPart().qty));
    else if(a === 'loc'){ document.getElementById('pa_loc').value = b.dataset.loc; paUpdate(); }
    else if(a === 'to-input'){ const id = p.id; closePartSheet(); switchTab('input'); pickInputSuggestion(id); document.getElementById('in_qty').focus(); }
    else if(a.startsWith('submit-')) paSubmit(a.slice(7));
  };
  body.oninput = (e)=>{
    if(e.target.id === 'pa_qty'){
      const max = Number(paPart().qty), n = parseInt(e.target.value,10);
      if(!isNaN(n) && n > max) e.target.value = max;
    }
    paUpdate();
  };
  body.onchange = paUpdate;
  // Enter = pindah ke kolom berikutnya; di kolom terakhir = simpan (kalau lengkap)
  const order = [...body.querySelectorAll('input:not([type=radio]), select')];
  order.forEach((el, i)=>el.addEventListener('keydown', (e)=>{
    if(e.key !== 'Enter') return;
    e.preventDefault();
    if(order[i+1]){ order[i+1].focus(); if(order[i+1].select) order[i+1].select(); }
    else { const s = document.getElementById('pa_submit'); if(s && !s.disabled) s.click(); }
  }));
  paUpdate();
}

async function paSubmit(kind){
  const p = paPart(); if(!p || paState.busy) return;
  const errEl = document.getElementById('pa_err');
  const btn = document.getElementById('pa_submit');
  const val = id => (document.getElementById(id)?.value || '').trim();
  const idleText = btn.textContent;
  paState.busy = true; btn.disabled = true; btn.textContent = kind === 'hapus' ? 'Menghapus...' : 'Menyimpan...';
  errEl.textContent = '';
  try{
    let data, msg;
    if(kind === 'ambil'){
      const q = paQty(), nama = val('pa_nama');
      data = await runScript('ambilBarang', p.id, q, val('pa_note'), nama);
      paSaveName(nama);
      msg = `Ambil ${q} pcs ${p.pn} tersimpan`;
    } else if(kind === 'transfer'){
      const q = paQty(), nama = val('pa_nama'), loc = val('pa_loc');
      const st = document.querySelector('input[name="pa_status"]:checked')?.value || 'RFU';
      data = await runScript('transferStok', p.id, q, loc, st, val('pa_note'), nama);
      paSaveName(nama);
      msg = `${q} pcs ${p.pn} dipindah ke ${loc.toUpperCase()} (${st})`;
    } else if(kind === 'edit'){
      const pn = val('pa_pn'), desc = val('pa_desc'), qty = Number(val('pa_eqty'));
      if(!pn || !desc) throw new Error('Parts number dan description wajib diisi.');
      if(!Number.isInteger(qty) || qty < 0) throw new Error('Qty harus angka bulat 0 atau lebih.');
      data = await runScript('updatePart', p.id, val('pa_unit'), pn, desc, val('pa_loc'), qty, val('pa_status_sel'), val('pa_remarks'));
      msg = 'Perubahan data stok tersimpan';
    } else if(kind === 'hapus'){
      data = await runScript('deletePart', p.id);
      msg = `Berhasil menghapus ${p.pn}`;
    }
    parts = data.parts;
    paState.busy = false;
    closePartSheet();
    toast(msg);
    populateLocationFilter();
    render();
  }catch(e){
    paState.busy = false;
    errEl.textContent = e.message || 'Gagal menyimpan. Cek koneksi lalu coba lagi.';
    btn.textContent = idleText;
    btn.disabled = false;
    paUpdate();
  }
}

// ---------- Geser ke bawah untuk menutup (khusus HP) ----------
// Bisa digeser dari pegangan/judul kapan saja, atau dari isi panel kalau
// isinya sedang di posisi paling atas (supaya tidak bentrok dengan scroll).
(function(){
  const ov = document.getElementById('partSheet');
  const panel = ov.querySelector('.pa-panel');
  const body = document.getElementById('paBody');
  const isMobile = ()=>!window.matchMedia('(min-width:681px)').matches;
  let armed = false, dragging = false, startY = 0, dy = 0, t0 = 0;
  function reset(){
    panel.style.transition = ''; panel.style.transform = '';
    ov.style.transition = ''; ov.style.opacity = '';
  }
  panel.addEventListener('touchstart', (e)=>{
    if(!isMobile() || !paState.open || e.touches.length !== 1) return;
    const onHandle = !!e.target.closest('.pa-grip-zone, .pa-head');
    if(!onHandle && (body.scrollTop > 0 || e.target.closest('input, select, textarea, .pa-stepper'))) return;
    armed = true; dragging = false; dy = 0;
    startY = e.touches[0].clientY; t0 = performance.now();
  }, { passive:true });
  panel.addEventListener('touchmove', (e)=>{
    if(!armed) return;
    dy = e.touches[0].clientY - startY;
    if(!dragging){
      if(dy > 8){ dragging = true; panel.style.transition = 'none'; ov.style.transition = 'none'; }
      else if(dy < -8){ armed = false; return; }
      else return;
    }
    e.preventDefault();
    const d = Math.max(0, dy);
    panel.style.transform = `translateY(${d}px)`;
    ov.style.opacity = String(Math.max(0.35, 1 - d / (panel.offsetHeight * 1.4)));
  }, { passive:false });
  function end(){
    if(!armed) return;
    armed = false;
    if(!dragging) return;
    dragging = false;
    const speed = dy / Math.max(1, performance.now() - t0); // px per ms
    panel.style.transition = ''; ov.style.transition = '';
    if(dy > panel.offsetHeight * 0.3 || (dy > 50 && speed > 0.5)){
      panel.style.transform = 'translateY(100%)';
      ov.style.opacity = '';
      closePartSheet();
      setTimeout(reset, 300);
    } else {
      reset();
    }
  }
  panel.addEventListener('touchend', end);
  panel.addEventListener('touchcancel', end);
})();

// Data berubah dari HP lain (Realtime) saat panel terbuka
function paOnDataChanged(){
  if(!paState.open || paState.busy) return;
  const p = paPart();
  if(!p){ closePartSheet(); toast('Baris ini baru saja dihapus dari perangkat lain'); return; }
  if(paState.view === 'detail'){ paRender(); return; }
  if(paState.view === 'ambil' || paState.view === 'transfer'){
    if(Number(p.qty) <= 0){ paGo('detail'); toast('Stok part ini baru saja habis'); return; }
    // jangan hapus isian user -- cukup perbarui batas maksimal
    document.getElementById('pa_avail').textContent = `Tersedia ${p.qty} pcs`;
    const all = document.querySelector('[data-pa="all"]'); if(all) all.textContent = `Semua (${p.qty})`;
    const inp = document.getElementById('pa_qty'); inp.max = p.qty;
    if(paQty() > p.qty) inp.value = p.qty;
    const ctx = document.querySelector('.pa-context strong'); if(ctx) ctx.textContent = `${p.qty} pcs`;
    paUpdate();
  }
}

init();
