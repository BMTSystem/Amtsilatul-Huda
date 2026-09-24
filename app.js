/* =====================================================================
   BMT INTEGRATED SYSTEM — app.js (bagian 1: inti, data, auth, branding)
   Offline-first: IndexedDB (lokal) + Firebase RTDB (cloud) + antrean
   sinkronisasi otomatis setiap APP_CONFIG.syncIntervalSec detik.
   ===================================================================== */
'use strict';

/* ---------------- DB ADAPTER (Firebase) ---------------- */
if (!firebase.apps.length) firebase.initializeApp(APP_CONFIG.firebase);
const db = firebase.database();
const DB_ROOT = 'bmt_data_v5';

/* ---------------- STRUKTUR DATA ---------------- */
const STORES = ['users','nasabah','tabungan','dana','aruskas','sarpras','surat','presensi','instruksi','chat','profitFlow','marketingReq','simpananwajib'];
const COLL_LABEL = {users:'Akun Pengguna',nasabah:'Nasabah / Pembiayaan',tabungan:'Tabungan',dana:'Distribusi Modal',aruskas:'Arus Kas',sarpras:'Sarpras',surat:'Surat',presensi:'Presensi',instruksi:'Instruksi / Verifikasi',chat:'Live Chat',profitFlow:'Alur SHU',marketingReq:'Req Marketing',simpananwajib:'Simpanan Wajib'};

const DEFAULT_SETTINGS = {
  nama: APP_CONFIG.seedIdentity.nama, izin: APP_CONFIG.seedIdentity.izin,
  alamat: APP_CONFIG.seedIdentity.alamat, wa: APP_CONFIG.seedIdentity.wa,
  email: APP_CONFIG.seedIdentity.email, logo: '', wallpaper: '',
  loginTitle: APP_CONFIG.seedIdentity.loginTitle, loginDesc: 'Sistem Keuangan Syariah Terpadu',
  struktur: { ketua:'', sekretaris:'', bendahara:'' },
  visi:'', misi:'',
  unit_leads:{sps:'',kms:'',gadai:''},
  shu:{profit:0,p_tetap:50,p_nasabah:20},
  codes:{sps:'SPS',kms:'KMS',gadai:'GS',haji:'HJ'},
  margins:{sps:10,kms:20,gadai:5,haji:0},
  margins_weekly:{sps:3,kms:5,gadai:2,haji:0},
  limits:{sps:100,kms:100,gadai:100,haji:100},
  templates:{sps:'Pasal 1: Akad Mudharabah.\nPasal 2: Nisbah sesuai kesepakatan.',kms:'Pasal 1: Murabahah.\nPasal 2: Jual beli dengan margin jelas.',gadai:'Pasal 1: Rahn.\nPasal 2: Biaya titip sesuai kesepakatan.',haji:'Pasal 1: Wadiah Yad Dhamanah.'},
  pesanTagih:"Assalamu'alaikum {sapaan} {nama}, kami dari BMT mengingatkan tagihan sebesar {tagihan} jatuh tempo pada {tanggal}. Mohon segera dibayar.",
  pesanBayar:"Terima kasih {sapaan} {nama}, pembayaran sebesar {tagihan} telah kami terima. (Kwitansi Digital)",
  pesanIuran:"Assalamu'alaikum {sapaan} {nama}, Iuran Wajib Anggota bulan ini sebesar {tagihan} belum terbayar. Mohon segera dilunasi.",
  simpananWajib:150000,
  recoveryCode: APP_CONFIG.recoveryCode,
  role_permissions: null
};

const DEFAULT_ACCESS = {
  KETUA:['approval_pusat','approval','manajemen_anggota','iuran_ketua','laporan_eksekutif','kirim_instruksi','rapat_online','acc_profit_ketua','inbox_ketua','users','identitas','manage_access','data_manager','profil'],
  ADMIN:['approval_pusat','approval','manajemen_anggota','iuran_ketua','laporan_eksekutif','kirim_instruksi','rapat_online','acc_profit_ketua','inbox_ketua','kas_pusat','simpanan_wajib','distribusi_modal','distribusi_profit','arus_kas','dana_unit','verifikasi_bayar','distribusi_insentif','chat_tamu','id_card_maker','surat_induk','sarpras_approval','laporan_pusat','monitoring_pegawai','kelayakan_marketing','cetak','input','input_tabungan','billing','laporan_tunggakan','laporan_detail','req_sarpras','setting_margin','monitoring_kinerja','terima_profit_manager','laporan_laba_unit','users','identitas','manage_access','data_manager','profil'],
  SEKRETARIS:['inbox_ketua','chat_tamu','id_card_maker','surat_induk','sarpras_approval','laporan_pusat','monitoring_pegawai','kelayakan_marketing','cetak','identitas','profil'],
  BENDAHARA:['inbox_ketua','kas_pusat','simpanan_wajib','distribusi_modal','distribusi_profit','iuran_ketua','kelayakan_marketing','profil'],
  MANAGER:['approval','laporan_tunggakan','laporan_detail','req_sarpras','setting_margin','monitoring_kinerja','terima_profit_manager','laporan_laba_unit','cetak','dana_unit','arus_kas','profil'],
  MARKETING:['input','input_tabungan','cetak','billing','dompet_marketing','profil'],
  ACCOUNTING:['arus_kas','dana_unit','verifikasi_bayar','distribusi_insentif','profil'],
  ANGGOTA:['ajukan_pinjaman','rapat_online_anggota','profil'],
  NASABAH:['dashboard_nasabah','profil']
};

const ALL_MENUS = [
  {id:'approval_pusat',name:'ACC Pusat',icon:'fa-check-circle',group:'Pimpinan'},
  {id:'manajemen_anggota',name:'Anggota',icon:'fa-users',group:'Pimpinan'},
  {id:'iuran_ketua',name:'Iuran',icon:'fa-wallet',group:'Pimpinan'},
  {id:'laporan_eksekutif',name:'Lap. Eksekutif',icon:'fa-chart-pie',group:'Pimpinan'},
  {id:'kirim_instruksi',name:'Instruksi',icon:'fa-bullhorn',group:'Pimpinan'},
  {id:'rapat_online',name:'Rapat Online',icon:'fa-video',group:'Pimpinan'},
  {id:'acc_profit_ketua',name:'ACC SHU',icon:'fa-hand-holding-usd',group:'Pimpinan'},
  {id:'approval',name:'ACC Unit',icon:'fa-gavel',group:'Unit Usaha'},
  {id:'laporan_tunggakan',name:'Tunggakan',icon:'fa-exclamation-triangle',group:'Unit Usaha'},
  {id:'laporan_detail',name:'Arsip Nasabah',icon:'fa-folder-open',group:'Unit Usaha'},
  {id:'req_sarpras',name:'Req Sarpras',icon:'fa-box',group:'Unit Usaha'},
  {id:'setting_margin',name:'Margin',icon:'fa-sliders-h',group:'Unit Usaha'},
  {id:'monitoring_kinerja',name:'Kinerja',icon:'fa-chart-line',group:'Unit Usaha'},
  {id:'terima_profit_manager',name:'Dana SHU',icon:'fa-download',group:'Unit Usaha'},
  {id:'laporan_laba_unit',name:'Laba Unit',icon:'fa-file-invoice',group:'Unit Usaha'},
  {id:'input',name:'Input Nasabah',icon:'fa-user-plus',group:'Marketing'},
  {id:'input_tabungan',name:'Tabungan',icon:'fa-piggy-bank',group:'Marketing'},
  {id:'billing',name:'Tagihan',icon:'fa-file-invoice-dollar',group:'Marketing'},
  {id:'dompet_marketing',name:'Insentif',icon:'fa-wallet',group:'Marketing'},
  {id:'cetak',name:'Cetak Akad',icon:'fa-print',group:'Marketing'},
  {id:'kas_pusat',name:'Kas Pusat',icon:'fa-university',group:'Keuangan'},
  {id:'simpanan_wajib',name:'Simp. Wajib',icon:'fa-money-bill-wave',group:'Keuangan'},
  {id:'distribusi_modal',name:'Dist. Modal',icon:'fa-hand-holding-usd',group:'Keuangan'},
  {id:'distribusi_profit',name:'Bagi Hasil',icon:'fa-coins',group:'Keuangan'},
  {id:'kelayakan_marketing',name:'Cek Marketing',icon:'fa-user-check',group:'Keuangan'},
  {id:'arus_kas',name:'Buku Kas',icon:'fa-book',group:'Keuangan'},
  {id:'dana_unit',name:'Dana Unit',icon:'fa-balance-scale',group:'Keuangan'},
  {id:'distribusi_insentif',name:'Bagi Bonus',icon:'fa-gift',group:'Keuangan'},
  {id:'verifikasi_bayar',name:'Verif Bayar',icon:'fa-check-double',group:'Keuangan'},
  {id:'chat_tamu',name:'Live Chat',icon:'fa-comments',group:'Sekretariat'},
  {id:'id_card_maker',name:'ID Card',icon:'fa-id-badge',group:'Sekretariat'},
  {id:'surat_induk',name:'Surat',icon:'fa-envelope',group:'Sekretariat'},
  {id:'sarpras_approval',name:'ACC Sarpras',icon:'fa-tasks',group:'Sekretariat'},
  {id:'laporan_pusat',name:'Lap. Pusat',icon:'fa-file-alt',group:'Sekretariat'},
  {id:'monitoring_pegawai',name:'Presensi',icon:'fa-clock',group:'Sekretariat'},
  {id:'inbox_ketua',name:'Pesan Masuk',icon:'fa-inbox',group:'Umum'},
  {id:'ajukan_pinjaman',name:'Ajukan Pinjaman',icon:'fa-hand-holding',group:'Umum'},
  {id:'rapat_online_anggota',name:'Rapat',icon:'fa-video',group:'Umum'},
  {id:'dashboard_nasabah',name:'Status Saya',icon:'fa-info-circle',group:'Umum'},
  {id:'users',name:'User & Akun',icon:'fa-users-cog',group:'Sistem'},
  {id:'identitas',name:'Pengaturan',icon:'fa-cog',group:'Sistem'},
  {id:'manage_access',name:'Hak Akses',icon:'fa-lock',group:'Sistem'},
  {id:'data_manager',name:'Kelola Data',icon:'fa-database',group:'Sistem'},
  {id:'profil',name:'Profil Saya',icon:'fa-user-circle',group:'Sistem'}
];

/* ---------------- STATE GLOBAL ---------------- */
let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
let DB = {}; STORES.forEach(s => DB[s] = []);
let activeUser = null, activeApp = '';
let tempFoto = '', tempKTPPhoto = '', tempUserPhoto = '', idCardPhoto = '', idCardBg = '';
let dataBayarTemp = {};
let _dirty = false, _syncTimer = null, _lastPulled = 0, _pullTimer = null;
let deferredInstallPrompt = null;

const rp = n => 'Rp ' + (parseInt(n||0)).toLocaleString('id-ID');
const tgl = ts => new Date(ts).toLocaleDateString('id-ID');
const esc = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const uid = () => Date.now().toString(36) + Math.floor(Math.random()*1e4).toString(36);
const DEFAULT_LOGO = 'icons/icon-192.png';
const getLogo = () => (settings.logo && settings.logo.length > 20) ? settings.logo : DEFAULT_LOGO;

/* ---------------- INDEXEDDB (penyimpanan lokal offline) ---------------- */
let _idb = null;
function idbOpen(){ return new Promise((res,rej)=>{ const r = indexedDB.open('bmt_offline_v5',1);
  r.onupgradeneeded = e => { const d = e.target.result; if(!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); };
  r.onsuccess = e => { _idb = e.target.result; res(); }; r.onerror = rej; }); }
function idbSet(k,v){ return new Promise((res,rej)=>{ if(!_idb) return res(); const t=_idb.transaction('kv','readwrite'); t.objectStore('kv').put(v,k); t.oncomplete=res; t.onerror=rej; }); }
function idbGet(k){ return new Promise((res,rej)=>{ if(!_idb) return res(null); const t=_idb.transaction('kv','readonly'); const q=t.objectStore('kv').get(k); q.onsuccess=()=>res(q.result??null); q.onerror=rej; }); }
function idbClear(){ return new Promise((res)=>{ if(!_idb) return res(); const t=_idb.transaction('kv','readwrite'); t.objectStore('kv').clear(); t.oncomplete=res; }); }

function persistLocal(){
  let tomb; try{ tomb = JSON.parse(localStorage.getItem('bmt_tombstones')||'{}'); }catch(e){ tomb={}; }
  return idbSet('state', JSON.stringify({settings, DB})).then(()=>idbSet('tomb', JSON.stringify(tomb)));
}

/* ---------------- SINKRONISASI (OFFLINE → ONLINE) ---------------- */
function setSync(msg, spin){
  const el = document.getElementById('sync-status'); if(!el) return;
  el.classList.add('active');
  el.innerHTML = (spin?'<i class="fas fa-sync fa-spin"></i> ':'<i class="fas fa-check"></i> ') + msg;
  if(!spin) setTimeout(()=>el.classList.remove('active'), 2200);
}
function updateNetUI(){
  const bar = document.getElementById('net-indicator'); if(!bar) return;
  if(navigator.onLine){
    bar.classList.remove('offline'); bar.classList.add('online');
    bar.querySelector('span').textContent = 'Kembali Online — menyinkronkan data...';
    bar.style.display='block';
    setTimeout(()=>{ bar.classList.remove('online'); bar.style.display='none'; }, 2600);
  } else {
    bar.classList.remove('online'); bar.classList.add('offline');
    bar.querySelector('span').textContent = 'Mode Offline — data aman di perangkat & otomatis dikirim saat online';
    bar.style.display='block';
  }
}

/* Panggil SETELAH setiap mutasi data. Menandai dirty → auto-sync. */
function queueCommit(){
  _dirty = true;
  persistLocal();
  scheduleSync(600); // debounce singkat agar UI terasa instan
}
function scheduleSync(delay){
  if(_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(trySync, delay ?? (APP_CONFIG.syncIntervalSec*1000));
}

function collectPayload(){
  const p = {config: settings};
  STORES.forEach(s => p[s] = DB[s]);
  return p;
}
function collectTomb(){ try{ return JSON.parse(localStorage.getItem('bmt_tombstones')||'{}'); }catch(e){ return {}; } }

async function trySync(){
  if(!_dirty) return;
  if(!navigator.onLine){ setSync('Offline — menunggu koneksi', true); return; }
  setSync('Mengirim ke server...', true);
  try{
    await db.ref(DB_ROOT).set({data: collectPayload(), tombstones: collectTomb()});
    _dirty = false; _lastPulled = Date.now();
    setSync('Tersinkron ke cloud');
  }catch(e){ console.warn('sync gagal', e); setSync('Gagal kirim — dicoba lagi', true); scheduleSync(15000); }
}

/* Tarik data server → lokal (hormati tombstone agar data terhapus tidak bangkit lagi) */
function applyTombstones(remote, tomb){
  const out = {};
  STORES.forEach(s => {
    const arr = Array.isArray(remote[s]) ? remote[s] : [];
    out[s] = arr.filter(it => it && it.id && !(tomb[s] && tomb[s][it.id]));
  });
  return out;
}
async function pullFromCloud(silent){
  if(!navigator.onLine) return false;
  try{
    const snap = await db.ref(DB_ROOT).once('value');
    const val = snap.val();
    if(!val || !val.data){
      // database kosong → bootstrap pertama kali
      if(!silent) bootstrapFirstData();
      queueCommit();
      return true;
    }
    const tomb = Object.assign({}, val.tombstones||{}, collectTomb());
    localStorage.setItem('bmt_tombstones', JSON.stringify(tomb));
    const remoteData = applyTombstones(val.data, tomb);
    if(val.data.config) settings = Object.assign({}, DEFAULT_SETTINGS, val.data.config);
    if(!settings.role_permissions) settings.role_permissions = JSON.parse(JSON.stringify(DEFAULT_ACCESS));
    if(!settings.recoveryCode) settings.recoveryCode = APP_CONFIG.recoveryCode;
    STORES.forEach(s => DB[s] = remoteData[s]);
    _lastPulled = Date.now();
    persistLocal();
    return true;
  }catch(e){ console.warn('pull gagal', e); return false; }
}
function startAutoSync(){
  scheduleSync(APP_CONFIG.syncIntervalSec*1000);
  _pullTimer = setInterval(()=>{ if(!_dirty) pullFromCloud(true).then(ok=>{ if(ok) softRefresh(); }); }, 30000);
  window.addEventListener('online', ()=>{ updateNetUI(); pullFromCloud(true).then(()=>trySync()); });
  window.addEventListener('offline', updateNetUI);
}
function softRefresh(){
  renderIdentitas(); startSliderTexts();
  if(activeUser){ renderMenu(); renderMobileNav(); const lp = localStorage.getItem('bmt_last_page'); if(lp) page(lp); }
}

/* Bootstrap data awal saat database benar-benar kosong */
function bootstrapFirstData(){
  if(DB.users.length === 0){
    DB.users.push({id:uid(), user:APP_CONFIG.bootstrapAdmin.user, password:APP_CONFIG.bootstrapAdmin.password, role:'admin', app:'induk', photo:'', namaLengkap:'Administrator', createdAt:Date.now()});
    console.info('Akun admin pertama dibuat:', APP_CONFIG.bootstrapAdmin.user);
  }
}

/* ---------------- SESI LOGIN ---------------- */
function saveSession(){ if(activeUser){ localStorage.setItem('bmt_session_user', JSON.stringify(activeUser)); localStorage.setItem('bmt_session_app', activeApp); } }
function loadSession(){ const u=localStorage.getItem('bmt_session_user'); const a=localStorage.getItem('bmt_session_app'); if(u&&a){ try{ activeUser=JSON.parse(u); activeApp=a; }catch(e){} } }
function clearSession(){ localStorage.removeItem('bmt_session_user'); localStorage.removeItem('bmt_session_app'); localStorage.removeItem('bmt_last_page'); }

/* ---------------- PWA ---------------- */
function registerSW(){ if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(e=>console.warn('SW gagal', e)); } }

/* Manifest dinamis: nama & icon PWA mengikuti identitas + logo instansi
   yang di-upload lewat menu Pengaturan (bukan file statis). */
function updateDynamicManifest(){
  try{
    const logoSrc = getLogo();
    const man = {
      name: settings.nama || APP_CONFIG.pwaName,
      short_name: (settings.nama || APP_CONFIG.pwaShort).split(' ').slice(0,2).join(' '),
      description: 'Sistem Informasi ' + (settings.nama || 'BMT') + ' - Offline First',
      start_url: './index.html', scope: './', display: 'standalone', orientation: 'portrait',
      background_color: '#0f3d3e', theme_color: '#0f3d3e',
      icons: [
        { src: logoSrc, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: logoSrc, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: logoSrc, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    };
    const blob = new Blob([JSON.stringify(man)], {type:'application/json'});
    let link = document.querySelector('link[rel="manifest"]');
    if(!link){ link = document.createElement('link'); link.rel='manifest'; document.head.appendChild(link); }
    if(window._manURL) URL.revokeObjectURL(window._manURL);
    window._manURL = URL.createObjectURL(blob);
    link.href = window._manURL;
    // favicon ikut logo instansi
    let fav = document.querySelector('link[rel="icon"]');
    if(fav) fav.href = logoSrc;
    let apple = document.querySelector('link[rel="apple-touch-icon"]');
    if(apple) apple.href = logoSrc;
  }catch(e){ console.warn('manifest dinamis gagal', e); }
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt = e; const b=document.getElementById('btn-install-pwa'); if(b) b.classList.add('show'); });
function installPWA(){
  if(deferredInstallPrompt){ deferredInstallPrompt.prompt(); deferredInstallPrompt.userChoice.then(()=>{ deferredInstallPrompt=null; document.getElementById('btn-install-pwa').classList.remove('show'); }); }
  else alert('INSTALL APLIKASI:\n\n• Android (Chrome): ketuk menu ⋮ di kanan atas → "Install app" / "Tambahkan ke layar utama".\n• iPhone (Safari): tombol Share → "Add to Home Screen".\n• Laptop (Chrome): ikon install di kanan kolom alamat.\n\nCatatan: tombol install otomatis hanya muncul jika situs sudah HTTPS & manifest terbaca. Coba muat ulang halaman lalu tunggu 3 detik.');
}

/* ---------------- BRANDING / WALLPAPER / SLIDER ---------------- */
function renderIdentitas(){
  const logo = getLogo();
  const sbL = document.getElementById('sb-logo'); if(sbL) sbL.src = logo;
  const sbN = document.getElementById('sb-nama'); if(sbN) sbN.innerText = settings.nama;
  const gwL = document.getElementById('gw-logo-main'); if(gwL) gwL.src = logo;
  document.title = settings.nama + ' — Integrated System';
}
function startSliderTexts(){
  const t=document.getElementById('slider-title'), d=document.getElementById('slider-desc');
  if(t) t.innerText = settings.loginTitle || settings.nama;
  if(d) d.innerText = settings.loginDesc || 'Sistem Keuangan Syariah Terpadu';
}
let _slideIdx = 0, _slideTimer = null;
function startSlider(){
  const bg = document.getElementById('bg-slider'); if(!bg) return;
  const slides = (settings.loginSlides && settings.loginSlides.length) ? settings.loginSlides : [];
  const dots = document.getElementById('slider-dots');
  const applySlide = () => {
    // PRIORITAS: wallpaper custom dari Pengaturan selalu menang
    let img = (settings.wallpaper && settings.wallpaper.length > 20) ? settings.wallpaper
      : (slides.length ? slides[_slideIdx % slides.length].img : '');
    if(img){ const L=new Image(); L.onload=()=>{ bg.style.backgroundImage=`url('${img}')`; }; L.src=img; }
    startSliderTexts();
    if(dots){ dots.innerHTML = slides.length>1 ? slides.map((_,i)=>`<span style="${i===(_slideIdx%slides.length)?'background:#fff;transform:scale(1.3)':''}"></span>`).join('') : ''; }
    _slideIdx++;
  };
  applySlide();
  if(_slideTimer) clearInterval(_slideTimer);
  if(slides.length > 1 && !(settings.wallpaper && settings.wallpaper.length > 20)) _slideTimer = setInterval(applySlide, 6000);
}

/* ---------------- LOGIN & LUPA PASSWORD ---------------- */
function openLoginPopup(){
  document.getElementById('login-overlay').style.display='block';
  setTimeout(()=>document.getElementById('login-popup').classList.add('open'),10);
}
function closeLoginPopup(){
  document.getElementById('login-popup').classList.remove('open');
  setTimeout(()=>document.getElementById('login-overlay').style.display='none',280);
}
function openForgot(){ document.getElementById('forgot-modal').style.display='flex'; }

function prosesForgot(){
  const u = document.getElementById('fp-user').value.trim();
  const code = document.getElementById('fp-code').value.trim();
  const np = document.getElementById('fp-new').value;
  if(!u || !code || !np) return alert('Lengkapi semua kolom!');
  if(np.length < 4) return alert('Password baru minimal 4 karakter.');
  if(code !== (settings.recoveryCode || APP_CONFIG.recoveryCode)) return alert('Kode pemulihan salah! Minta kode ke Admin/Ketua.');
  const idx = DB.users.findIndex(x => x.user.toLowerCase() === u.toLowerCase());
  if(idx === -1) return alert('Username tidak ditemukan.');
  DB.users[idx].password = np;
  queueCommit();
  alert('Password berhasil direset! Silakan login dengan password baru.');
  document.getElementById('forgot-modal').style.display='none';
  document.getElementById('fp-user').value=''; document.getElementById('fp-code').value=''; document.getElementById('fp-new').value='';
  openLoginPopup();
}

function prosesLogin(){
  const uIn = document.getElementById('username').value.trim();
  const pIn = document.getElementById('password').value;
  const appSel = document.getElementById('login-app-select').value;
  if(!uIn || !pIn) return alert('Isi username & password!');
  const user = DB.users.find(x => x.user.toLowerCase() === uIn.toLowerCase() && x.password === pIn);
  if(!user) return alert('Username atau password salah!');
  const role = user.role.toUpperCase();
  if(role === 'KETUA' || role === 'ADMIN') activeApp = 'induk';
  else if(user.app === 'unit' && user.unitScope){
    if(appSel !== 'induk' && appSel !== user.unitScope && appSel !== 'nasabah')
      return alert('Login gagal. Akun Anda khusus unit: ' + user.unitScope.toUpperCase());
    activeApp = user.unitScope;
  }
  else activeApp = appSel;
  activeUser = {user:user.user, role:role, photo:user.photo||'', isEligible:user.isEligible, app:user.app, unitScope:user.unitScope||null};
  loginSuccess();
}
function loginSuccess(){
  saveSession(); closeLoginPopup();
  setSync('Memuat...', true);
  setTimeout(()=>location.reload(), 400);
}
function logoutManual(){
  clearSession(); activeUser = null;
  document.getElementById('app').style.display='none';
  const gw = document.getElementById('gateway'); gw.style.display='flex';
  document.getElementById('username').value=''; document.getElementById('password').value='';
  renderIdentitas(); startSlider();
}

/* ---------------- AKSES & MENU ---------------- */
function checkAccess(role, menuId){
  if(!role) return false;
  const r = role.toUpperCase();
  if(r === 'ADMIN') return true;
  const perms = settings.role_permissions || DEFAULT_ACCESS;
  return (perms[r] || []).includes(menuId);
}
function myMenus(){ return ALL_MENUS.filter(m => checkAccess(activeUser.role, m.id)); }

function renderMenu(){
  try{
    if(!activeUser) return;
    const mu=document.getElementById('mob-user-display'); if(mu) mu.innerText=activeUser.user;
    const mp=document.getElementById('mob-profile-pic'); if(mp) mp.src=activeUser.photo||DEFAULT_LOGO;
    const du=document.getElementById('user-name-display'); if(du) du.innerText=activeUser.user;
    const dr=document.getElementById('user-role-display'); if(dr) dr.innerText=activeUser.role;
    const dp=document.getElementById('header-profile-pic'); if(dp) dp.src=activeUser.photo||DEFAULT_LOGO;
    // sidebar desktop dengan pengelompokan
    const box = document.getElementById('menu-container'); if(!box) return;
    const menus = myMenus(); const groups = {};
    menus.forEach(m => { (groups[m.group] = groups[m.group]||[]).push(m); });
    const cur = localStorage.getItem('bmt_last_page') || 'home';
    let html = `<div class="menu-link ${cur==='home'?'active':''}" onclick="page('home')"><i class="fas fa-home"></i><span>Dashboard</span></div>`;
    Object.keys(groups).forEach(g => {
      html += `<div class="menu-group-title">${g}</div>`;
      groups[g].forEach(m => { html += `<div class="menu-link ${cur===m.id?'active':''}" onclick="page('${m.id}')"><i class="fas ${m.icon}"></i><span>${m.name}</span></div>`; });
    });
    box.innerHTML = html;
  }catch(e){ console.error(e); }
}

function renderMobileNav(){
  if(!activeUser) return;
  const role = activeUser.role;
  const btn=(icon,label,action,active)=>`<div class="nav-item ${active?'active':''}" onclick="${action}"><i class="fas ${icon}"></i><span>${label}</span></div>`;
  const cur = localStorage.getItem('bmt_last_page')||'home';
  let h = btn('fa-home','Home',"page('home')", cur==='home');
  if(role==='KETUA'||role==='ADMIN'){ h+=btn('fa-check-circle','ACC',"page('approval_pusat')",cur==='approval_pusat'); h+=btn('fa-cog','Setting',"page('identitas')",cur==='identitas'); }
  else if(role==='SEKRETARIS'){ h+=btn('fa-envelope','Surat',"page('surat_induk')",cur==='surat_induk'); h+=btn('fa-clock','Presensi',"page('monitoring_pegawai')",cur==='monitoring_pegawai'); }
  else if(role==='BENDAHARA'){ h+=btn('fa-university','Kas',"page('kas_pusat')",cur==='kas_pusat'); h+=btn('fa-hand-holding-usd','Modal',"page('distribusi_modal')",cur==='distribusi_modal'); }
  else if(role==='MANAGER'){ h+=btn('fa-gavel','Approval',"page('approval')",cur==='approval'); h+=btn('fa-chart-line','Kinerja',"page('monitoring_kinerja')",cur==='monitoring_kinerja'); }
  else if(role==='ACCOUNTING'){ h+=btn('fa-book','Kas',"page('arus_kas')",cur==='arus_kas'); h+=btn('fa-check-double','Verif',"page('verifikasi_bayar')",cur==='verifikasi_bayar'); }
  else if(role==='MARKETING'){ h+=btn('fa-user-plus','Input',"page('input')",cur==='input'); h+=btn('fa-file-invoice-dollar','Tagih',"page('billing')",cur==='billing'); }
  else if(role==='ANGGOTA'){ h+=btn('fa-hand-holding','Pinjam',"page('ajukan_pinjaman')",cur==='ajukan_pinjaman'); }
  else if(role==='NASABAH'){ h+=btn('fa-info-circle','Status',"page('dashboard_nasabah')",cur==='dashboard_nasabah'); }
  h += btn('fa-inbox','Pesan',"page('inbox_ketua')",cur==='inbox_ketua');
  h += btn('fa-user-circle','Profil',"page('profil')",cur==='profil');
  const c = document.getElementById('mobile-bottom-nav'); if(c) c.innerHTML = h;
}

/* ---------------- UTIL: GAMBAR & WA ---------------- */
function resizeImage(file, cb, width=300){
  const r=new FileReader(); r.readAsDataURL(file);
  r.onload=e=>{ const img=new Image(); img.src=e.target.result; img.onload=()=>{ const c=document.createElement('canvas'); const s=width/img.width; c.width=width; c.height=img.height*s; c.getContext('2d').drawImage(img,0,0,c.width,c.height); cb(c.toDataURL('image/jpeg',0.82)); }; };
}
function readFoto(inp){ if(inp.files[0]) resizeImage(inp.files[0], r=>{ tempFoto=r; alert('Foto siap!'); },300); }
function readUserPhoto(inp){ if(inp.files[0]) resizeImage(inp.files[0], r=>{ tempUserPhoto=r; alert('Foto pegawai siap!'); },300); }
function readKTPPhoto(inp){
  if(!inp.files[0]) return;
  resizeImage(inp.files[0], r=>{ tempKTPPhoto=r; }, 460);
  document.getElementById('ocr-loading').style.display='flex';
  Tesseract.recognize(inp.files[0],'ind').then(({data:{text}})=>{
    document.getElementById('ocr-loading').style.display='none';
    const nik = text.match(/\d{16}/); if(nik && document.getElementById('i-nik')) document.getElementById('i-nik').value = nik[0];
    text.split('\n').forEach(line=>{
      const low=line.toLowerCase();
      if(low.includes('nama') && document.getElementById('i-nm')){ const v=(line.split(':')[1]||'').replace(/[^a-zA-Z\s]/g,'').trim(); if(v) document.getElementById('i-nm').value=v; }
      if(low.includes('alamat') && document.getElementById('i-al')){ const v=(line.split(':')[1]||'').trim(); if(v) document.getElementById('i-al').value=v; }
    });
    alert('OCR selesai. Periksa kembali hasilnya.');
  }).catch(()=>{ document.getElementById('ocr-loading').style.display='none'; alert('OCR gagal. Isi manual.'); });
}
function formatWA(num){ let n=String(num||'').replace(/\D/g,''); if(n.startsWith('0')) n='62'+n.slice(1); if(n.startsWith('8')) n='62'+n; return n; }
function openWA(phone,text){ const m=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent); const url=m?`https://wa.me/${formatWA(phone)}?text=${encodeURIComponent(text)}`:`https://web.whatsapp.com/send?phone=${formatWA(phone)}&text=${encodeURIComponent(text)}`; window.open(url,'_blank'); }

/* ---------------- PDF & PRINT ---------------- */
function generatePDF(elementId, filename){
  const el=document.getElementById(elementId); if(!el) return alert('Elemen tidak ditemukan!');
  const od=el.style.display; el.style.display='block'; el.style.background='#fff';
  const opt={margin:10,filename:filename+'.pdf',image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true,windowWidth:1200},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}};
  html2pdf().set(opt).from(el).save().then(()=>{ el.style.display=od||'none'; }).catch(()=>{ el.style.display=od||'none'; alert('Gagal membuat PDF'); });
}
/* =====================================================================
   app.js bagian 2a — Mesin hapus (tombstone), Kelola Data, Profil,
   Pengaturan Identitas/Keamanan, Manajemen User, Hak Akses.
   ===================================================================== */

/* ---------------- TOMBSTONE DELETE ENGINE ----------------
   Penghapusan dicatat dulu di daftar tombstone lalu di-push ke
   Firebase. Saat perangkat lain menarik data, item bertombstone
   dibuang — data BENAR-BENAR hilang di semua perangkat. */
function addTombstone(store, id){
  const tomb = collectTomb();
  if(!tomb[store]) tomb[store] = {};
  tomb[store][id] = Date.now();
  localStorage.setItem('bmt_tombstones', JSON.stringify(tomb));
}
function deleteRecord(store, id, opts){
  opts = opts || {};
  const label = COLL_LABEL[store] || store;
  if(!opts.skipConfirm && !confirm('Hapus data ' + label + ' ini secara PERMANEN?\nData akan hilang juga di server Firebase.')) return false;
  const idx = DB[store].findIndex(x => String(x.id) === String(id));
  if(idx === -1){ alert('Data tidak ditemukan.'); return false; }
  DB[store].splice(idx, 1);
  addTombstone(store, id);
  queueCommit();
  if(!opts.silent) alert('Data ' + label + ' terhapus permanen.');
  if(opts.backTo) page(opts.backTo);
  return true;
}
function deleteUserById(id){
  const u = DB.users.find(x => String(x.id) === String(id));
  if(!u) return;
  if(activeUser && u.user === activeUser.user) return alert('Tidak bisa menghapus akun sendiri!');
  deleteRecord('users', id, {backTo:'users'});
}
function deleteLunas(id){ deleteRecord('nasabah', id, {backTo:'laporan_detail'}); }
function deleteModalAwal(id){ deleteRecord('dana', id, {backTo:'distribusi_modal'}); }

/* Factory reset / bersih koleksi — seluruh anggota koleksi ditombstone */
function wipeCollection(store){
  if(!STORES.includes(store)) return;
  if(!confirm('YAKIN hapus SEMUA data "' + COLL_LABEL[store] + '"?\nTindakan ini menghapus di semua perangkat & server.')) return;
  DB[store].forEach(it => addTombstone(store, it.id));
  DB[store] = [];
  queueCommit();
  alert('Koleksi "' + COLL_LABEL[store] + '" sudah dikosongkan.');
  page('data_manager');
}
function factoryReset(){
  const code = prompt('Ketik kode pemulihan untuk konfirmasi RESET TOTAL:');
  if(code !== (settings.recoveryCode || APP_CONFIG.recoveryCode)) return alert('Kode salah. Reset dibatalkan.');
  if(!confirm('TAHAP TERAKHIR: Semua data (kecuali akun admin) akan DIHAPUS PERMANEN. Lanjutkan?')) return;
  STORES.forEach(s => { if(s !== 'users'){ DB[s].forEach(it => addTombstone(s, it.id)); DB[s] = []; } });
  // sisakan hanya admin
  DB.users.filter(u => u.role.toUpperCase() !== 'ADMIN').forEach(u => addTombstone('users', u.id));
  DB.users = DB.users.filter(u => u.role.toUpperCase() === 'ADMIN');
  queueCommit();
  alert('Reset total selesai.');
  location.reload();
}

/* ---------------- HALAMAN: KELOLA DATA ---------------- */
function pageDataManager(b, t){
  t.innerText = 'Kelola Data & Penghapusan';
  const cards = STORES.map(s => {
    return `<tr>
      <td data-label="Koleksi"><b>${COLL_LABEL[s]}</b></td>
      <td data-label="Jumlah">${DB[s].length} data</td>
      <td data-label="Aksi" style="display:flex;gap:6px;justify-content:flex-end;">
        <button class="btn btn-danger btn-sm" onclick="wipeCollection('${s}')"><i class="fas fa-trash"></i> Kosongkan</button>
      </td></tr>`;
  }).join('');
  b.innerHTML = `
  <div class="card" style="border-left:5px solid var(--danger);">
    <h4><i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Zona Berbahaya</h4>
    <p style="font-size:.85rem;color:#777;">Penghapusan di sini bersifat permanen dan ikut menghapus data di server Firebase (metode tombstone). Gunakan dengan hati-hati.</p>
    <button class="btn btn-danger" style="margin-top:10px;" onclick="factoryReset()"><i class="fas fa-radiation"></i> FACTORY RESET TOTAL</button>
  </div>
  <div class="card">
    <h4>Status Sinkronisasi</h4>
    <p style="font-size:.85rem;">Status jaringan: <b id="dm-net">${navigator.onLine ? 'ONLINE' : 'OFFLINE'}</b> • Perubahan belum terkirim: <b>${(_dirty || Object.keys(collectTomb()).length) ? 'ADA' : 'Tidak ada'}</b></p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
      <button class="btn btn-primary btn-sm" onclick="trySync();pullFromCloud().then(()=>softRefresh())"><i class="fas fa-sync"></i> Sinkron Sekarang</button>
      <button class="btn btn-warning btn-sm" onclick="backupData()"><i class="fas fa-download"></i> Backup JSON</button>
      <button class="btn btn-ghost btn-sm" onclick="document.getElementById('restore-file').click()"><i class="fas fa-upload"></i> Restore JSON</button>
      <input type="file" id="restore-file" accept=".json" style="display:none" onchange="restoreData(this)">
    </div>
  </div>
  <div class="card">
    <h4>Koleksi Data</h4>
    <div class="table-responsive"><table><thead><tr><th>Koleksi</th><th>Jumlah</th><th>Aksi</th></tr></thead><tbody>${cards}</tbody></table></div>
  </div>`;
}
function backupData(){
  const blob = new Blob([JSON.stringify(collectPayload(), null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'backup_bmt_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
}
function restoreData(inp){
  if(!inp.files[0]) return;
  const r = new FileReader();
  r.onload = e => {
    try{
      const data = JSON.parse(e.target.result);
      if(!data.users) throw new Error('format salah');
      if(!confirm('Restore akan MENIMPA seluruh data saat ini. Lanjutkan?')) return;
      if(data.config) settings = Object.assign({}, DEFAULT_SETTINGS, data.config);
      STORES.forEach(s => DB[s] = Array.isArray(data[s]) ? data[s] : []);
      queueCommit();
      alert('Restore berhasil. Aplikasi akan dimuat ulang.');
      location.reload();
    }catch(err){ alert('File backup tidak valid.'); }
  };
  r.readAsText(inp.files[0]);
}

/* ---------------- HALAMAN: PROFIL & GANTI PASSWORD ---------------- */
function pageProfil(b, t){
  t.innerText = 'Profil Saya';
  const me = DB.users.find(x => x.user === activeUser.user) || {};
  const pengurus = DB.users.filter(u => ['admin','ketua','bendahara','sekretaris'].includes((u.role||'').toLowerCase()) && u.user !== activeUser.user);
  const waBtns = pengurus.length ? pengurus.map(u => `<button class="btn btn-sm" style="background:#25d366;color:#fff;margin:3px;" onclick="chatPengurus('${esc(u.user)}')"><i class="fab fa-whatsapp"></i> ${esc(u.namaLengkap||u.user)} <small>(${esc(u.role)})</small></button>`).join('') : '<small style="color:#999;">Belum ada akun pengurus. Minta Admin membuat akun Ketua/Bendahara/Sekretaris.</small>';
  b.innerHTML = `
  <div class="card" style="max-width:520px;text-align:center;">
    <img src="${me.photo || DEFAULT_LOGO}" onclick="document.getElementById('pf-foto').click()" title="Klik untuk ganti foto" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid var(--accent);cursor:pointer;">
    <h3 style="margin-top:10px;">${esc(me.namaLengkap || me.user)}</h3>
    <p style="color:#888;">@${esc(me.user)} • ${activeUser.role}${activeUser.unitScope ? ' • Unit ' + activeUser.unitScope.toUpperCase() : ''}</p>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:6px;">${waBtns}</div>
    <hr style="margin:16px 0;border:none;border-top:1px solid #eee;">
    <div style="text-align:left;">
      <label>Foto Profil (atau klik foto di atas)</label>
      <input type="file" id="pf-foto" class="form-control" accept="image/*" onchange="updateMyPhoto(this)">
      <label>Ganti Username</label>
      <div style="display:flex;gap:8px;">
        <input id="pf-user" class="form-control" value="${esc(me.user)}" style="margin-bottom:0;">
        <button class="btn btn-warning" onclick="changeMyUsername()"><i class="fas fa-check"></i></button>
      </div>
      <hr style="margin:16px 0;border:none;border-top:1px solid #eee;">
      <label>Password Lama</label>
      <input type="password" id="pf-old" class="form-control" placeholder="Password saat ini">
      <label>Password Baru</label>
      <input type="password" id="pf-new" class="form-control" placeholder="Minimal 4 karakter">
      <button class="btn btn-primary" style="width:100%;" onclick="changeMyPassword()"><i class="fas fa-key"></i> GANTI PASSWORD</button>
      <p style="font-size:.72rem;color:#999;margin-top:10px;">Password tersimpan di database dan tidak tertulis di kode aplikasi.</p>
    </div>
  </div>`;
}
function updateMyPhoto(inp){
  if(!inp.files[0]) return;
  resizeImage(inp.files[0], res => {
    const idx = DB.users.findIndex(x => x.user === activeUser.user);
    if(idx > -1){ DB.users[idx].photo = res; activeUser.photo = res; saveSession(); queueCommit(); renderMenu(); page('profil'); }
  }, 300);
}
function changeMyPassword(){
  const oldP = document.getElementById('pf-old').value;
  const newP = document.getElementById('pf-new').value;
  const idx = DB.users.findIndex(x => x.user === activeUser.user);
  if(idx === -1) return alert('Akun tidak ditemukan.');
  if(DB.users[idx].password !== oldP) return alert('Password lama salah!');
  if(newP.length < 4) return alert('Password baru minimal 4 karakter.');
  DB.users[idx].password = newP;
  queueCommit();
  alert('Password berhasil diganti!');
  page('profil');
}
function changeMyUsername(){
  const nu = (document.getElementById('pf-user').value||'').trim();
  if(!nu || nu.length < 3) return alert('Username minimal 3 karakter.');
  if(nu === activeUser.user) return alert('Username tidak berubah.');
  if(DB.users.find(x => x.user.toLowerCase() === nu.toLowerCase())) return alert('Username sudah dipakai orang lain!');
  if(!confirm('Ganti username menjadi "' + nu + '"? Anda akan login dengan username baru ini.')) return;
  const idx = DB.users.findIndex(x => x.user === activeUser.user);
  if(idx === -1) return alert('Akun tidak ditemukan.');
  DB.users[idx].user = nu;
  activeUser.user = nu;
  saveSession(); queueCommit(); renderMenu();
  alert('Username berhasil diganti!');
  page('profil');
}
function chatPengurus(targetUser){
  const u = DB.users.find(x => x.user === targetUser);
  let wa = u ? (u.noHP||'') : '';
  if(!wa) wa = prompt('Nomor WA ' + targetUser + ' belum terdaftar. Masukkan nomor (08...):');
  if(!wa) return;
  openWA(wa, "Assalamu'alaikum, saya " + activeUser.user + ' (' + activeUser.role + ') ingin bertanya terkait BMT.');
}

/* ---------------- HALAMAN: PENGATURAN (IDENTITAS) ---------------- */
function pageIdentitas(b, t){
  t.innerText = 'Pengaturan Instansi';
  const canSecurity = ['ADMIN','KETUA'].includes(activeUser.role);
  b.innerHTML = `
  <div class="card">
    <h4><i class="fas fa-image"></i> Tampilan Halaman Login</h4>
    <div style="background:#f0f8ff;padding:16px;border-radius:10px;border:1px solid #cce5ff;">
      <label><b>1. Wallpaper Login</b></label>
      <input type="file" class="form-control" accept="image/*" onchange="updateWall(this)">
      <small style="color:#667;">Gambar langsung terpasang & tersimpan. Kosongkan wallpaper lewat tombol reset.</small>
      <div id="wall-preview" style="margin-top:10px;">${settings.wallpaper && settings.wallpaper.length>20 ? `<img src="${settings.wallpaper}" style="width:100%;max-width:280px;border-radius:10px;border:1px solid #ddd;"> <button class="btn btn-danger btn-sm" style="margin-top:8px;" onclick="resetWallpaper()"><i class="fas fa-trash"></i> Hapus Wallpaper</button>` : '<i style="color:#999;font-size:.8rem;">Belum ada wallpaper custom.</i>'}</div>
      <hr>
      <label><b>2. Judul Besar</b></label>
      <input id="s-judul-login" class="form-control" value="${esc(settings.loginTitle || settings.nama)}">
      <label><b>3. Slogan</b></label>
      <input id="s-desc-login" class="form-control" value="${esc(settings.loginDesc || '')}">
    </div>
  </div>
  <div class="card">
    <h4><i class="fas fa-building"></i> Identitas Lembaga (Kop Surat)</h4>
    <label>Nama BMT</label><input id="s-nm" class="form-control" value="${esc(settings.nama)}">
    <label>Nomor Izin</label><input id="s-iz" class="form-control" value="${esc(settings.izin)}">
    <label>Alamat Lengkap</label><input id="s-al" class="form-control" value="${esc(settings.alamat)}">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div><label>Email</label><input id="s-em" class="form-control" value="${esc(settings.email)}"></div>
      <div><label>WA Admin</label><input id="s-wa" class="form-control" value="${esc(settings.wa)}"></div>
    </div>
    <label><b>Logo Aplikasi</b> (dipakai untuk icon PWA, kop surat & kartu)</label>
    <input type="file" class="form-control" accept="image/*" onchange="updateLogo(this)">
    <div style="margin-top:8px;"><img src="${getLogo()}" style="width:64px;height:64px;border-radius:50%;border:2px solid var(--accent);object-fit:contain;background:#fff;"></div>
    <hr>
    <label>Nominal Simpanan Wajib (Rp)</label>
    <input id="s-sw" type="number" class="form-control" value="${settings.simpananWajib}">
    <button class="btn btn-primary" style="width:100%;padding:14px;font-weight:700;" onclick="saveID()"><i class="fas fa-save"></i> SIMPAN SEMUA PENGATURAN</button>
  </div>
  ${canSecurity ? `
  <div class="card" style="border-left:5px solid var(--accent);">
    <h4><i class="fas fa-shield-alt"></i> Keamanan</h4>
    <label>Kode Pemulihan "Lupa Password"</label>
    <input id="s-rec" class="form-control" value="${esc(settings.recoveryCode || '')}" placeholder="Kode rahasia reset password">
    <button class="btn btn-warning" style="width:100%;" onclick="saveRecoveryCode()"><i class="fas fa-save"></i> SIMPAN KODE PEMULIHAN</button>
    <p style="font-size:.72rem;color:#999;margin-top:8px;">Kode ini dipakai anggota untuk mereset password di halaman login. Jaga kerahasiaannya.</p>
  </div>` : ''}`;
}
function updateWall(inp){
  if(!inp.files[0]) return;
  resizeImage(inp.files[0], res => {
    settings.wallpaper = res;
    queueCommit();          // langsung tersimpan & tersinkron
    startSlider();          // langsung terpasang di halaman login
    page('identitas');      // refresh preview
    alert('Wallpaper login berhasil diganti!');
  }, 1280);
}
function resetWallpaper(){
  if(!confirm('Hapus wallpaper custom dan kembali ke tampilan default?')) return;
  settings.wallpaper = '';
  queueCommit(); startSlider(); page('identitas');
}
function updateLogo(inp){
  if(!inp.files[0]) return;
  resizeImage(inp.files[0], res => {
    settings.logo = res;
    queueCommit(); renderIdentitas(); updateDynamicManifest(); page('identitas');
    alert('Logo diperbarui! Icon aplikasi PWA juga ikut berubah (install ulang PWA agar icon di layar utama ikut berganti).');
  }, 300);
}
function saveID(){
  settings.nama = document.getElementById('s-nm').value.trim() || settings.nama;
  settings.izin = document.getElementById('s-iz').value;
  settings.alamat = document.getElementById('s-al').value;
  settings.email = document.getElementById('s-em').value;
  settings.wa = document.getElementById('s-wa').value;
  settings.loginTitle = document.getElementById('s-judul-login').value;
  settings.loginDesc = document.getElementById('s-desc-login').value;
  settings.simpananWajib = parseInt(document.getElementById('s-sw').value) || 0;
  queueCommit(); renderIdentitas(); startSlider();
  alert('Pengaturan berhasil disimpan & disinkronkan!');
}
function saveRecoveryCode(){
  const v = document.getElementById('s-rec').value.trim();
  if(v.length < 4) return alert('Kode minimal 4 karakter.');
  settings.recoveryCode = v;
  queueCommit();
  alert('Kode pemulihan tersimpan.');
}

/* ---------------- HALAMAN: MANAJEMEN USER ---------------- */
function toggleUnitSelect(val){
  const sel = document.getElementById('n-unit'); if(!sel) return;
  if(['marketing','manager','accounting'].includes(val)) sel.classList.remove('hidden'); else sel.classList.add('hidden');
}
function pageUsers(b, t){
  t.innerText = 'Manajemen Pengguna';
  const rows = DB.users.map(u => `<tr>
    <td data-label="Foto"><img src="${u.photo || DEFAULT_LOGO}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;"></td>
    <td data-label="User"><b>${esc(u.user)}</b><br><small>${esc(u.namaLengkap || '')}</small></td>
    <td data-label="Role">${esc(u.role)}</td>
    <td data-label="Unit">${u.unitScope ? u.unitScope.toUpperCase() : (u.app || 'induk').toUpperCase()}</td>
    <td data-label="Aksi"><button class="btn btn-danger btn-sm" onclick="deleteUserById('${u.id}')"><i class="fas fa-trash"></i></button></td>
  </tr>`).join('');
  b.innerHTML = `
  <div class="card" style="max-width:640px;">
    <h4><i class="fas fa-user-plus"></i> Buat Akun Baru</h4>
    <p style="font-size:.8rem;color:#888;">Hanya Admin/Ketua yang bisa membuat akun. Bagikan username & password ke petugas/nasabah.</p>
    <label>Nama Lengkap</label><input id="n-nama" class="form-control">
    <label>No. HP / WA</label><input id="n-hp" class="form-control">
    <label>Alamat</label><textarea id="n-al" class="form-control"></textarea>
    <hr>
    <label>Username</label><input id="n-u" class="form-control">
    <label>Role / Jabatan</label>
    <select id="n-r" class="form-control" onchange="toggleUnitSelect(this.value)">
      <option value="anggota">Anggota</option><option value="nasabah">Nasabah</option>
      <option value="ketua">Ketua (Pusat)</option><option value="admin">Admin</option>
      <option value="bendahara">Bendahara</option><option value="sekretaris">Sekretaris</option>
      <option value="marketing">Marketing (Unit)</option><option value="manager">Manager (Unit)</option>
      <option value="accounting">Accounting (Unit)</option>
    </select>
    <select id="n-unit" class="form-control hidden">
      <option value="sps">Unit Simpan Pinjam (SPS)</option>
      <option value="kms">Unit Kredit Motor (KMS)</option>
      <option value="gadai">Unit Gadai Syariah</option>
    </select>
    <label>Password Awal</label><input id="n-p" type="text" class="form-control" placeholder="Wajib diganti user di menu Profil">
    <label>Foto</label><input type="file" class="form-control" accept="image/*" onchange="readUserPhoto(this)">
    <button class="btn btn-primary" style="width:100%;" onclick="addUser()"><i class="fas fa-save"></i> SIMPAN AKUN</button>
  </div>
  <div class="card">
    <h4>Daftar Akun (${DB.users.length})</h4>
    <div class="table-responsive"><table><thead><tr><th>Foto</th><th>User</th><th>Role</th><th>Unit</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div>
  </div>`;
}
function addUser(){
  const g = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
  const u = g('n-u'), r = g('n-r'), p = g('n-p');
  if(!u || !p) return alert('Username & Password wajib diisi!');
  if(DB.users.find(x => x.user.toLowerCase() === u.toLowerCase())) return alert('Username sudah dipakai!');
  const isUnit = ['marketing','manager','accounting'].includes(r);
  DB.users.push({
    id: uid(), user: u, role: r, password: p,
    app: isUnit ? 'unit' : 'induk', unitScope: isUnit ? g('n-unit') : null,
    photo: tempUserPhoto, namaLengkap: g('n-nama'), noHP: g('n-hp'), alamat: g('n-al'),
    createdAt: Date.now(), createdBy: activeUser.user
  });
  tempUserPhoto = '';
  queueCommit();
  alert('Akun "' + u + '" berhasil dibuat & bisa langsung login.');
  page('users');
}

/* ---------------- HALAMAN: HAK AKSES ---------------- */
function pageManageAccess(b, t){
  t.innerText = 'Atur Hak Akses Menu';
  const roles = ['KETUA','SEKRETARIS','BENDAHARA','MANAGER','MARKETING','ACCOUNTING','ANGGOTA','NASABAH'];
  const th = roles.map(r => `<th>${r}</th>`).join('');
  const trs = ALL_MENUS.map(m => {
    const tds = roles.map(r => `<td><input type="checkbox" class="perm-check" data-role="${r}" data-mid="${m.id}" ${checkAccess(r, m.id) ? 'checked' : ''}></td>`).join('');
    return `<tr><td data-label="Menu" style="text-align:left;">${m.name}</td>${tds}</tr>`;
  }).join('');
  b.innerHTML = `
  <div class="card">
    <div style="background:#e3f2fd;padding:12px;border-radius:8px;margin-bottom:14px;font-size:.85rem;">
      <i class="fas fa-info-circle"></i> Centang = beri akses. Perubahan aktif setelah user login ulang. Role <b>ADMIN</b> selalu akses penuh.
    </div>
    <button class="btn btn-success" style="width:100%;font-weight:700;margin-bottom:14px;" onclick="updateRoleAccess()"><i class="fas fa-save"></i> SIMPAN HAK AKSES</button>
    <div class="table-responsive"><table style="font-size:.78rem;text-align:center;"><thead><tr><th style="text-align:left;">Menu</th>${th}</tr></thead><tbody>${trs}</tbody></table></div>
  </div>`;
}
function updateRoleAccess(){
  if(!settings.role_permissions) settings.role_permissions = JSON.parse(JSON.stringify(DEFAULT_ACCESS));
  document.querySelectorAll('.perm-check').forEach(cb => {
    const role = cb.dataset.role, mid = cb.dataset.mid;
    if(!settings.role_permissions[role]) settings.role_permissions[role] = [];
    if(cb.checked){ if(!settings.role_permissions[role].includes(mid)) settings.role_permissions[role].push(mid); }
    else settings.role_permissions[role] = settings.role_permissions[role].filter(x => x !== mid);
  });
  queueCommit();
  alert('Hak akses tersimpan. User target logout & login ulang agar aktif.');
}
/* =====================================================================
   app.js bagian 2b — Logika bisnis: nasabah, kas, dana, SHU, tabungan,
   surat, sarpras, presensi, chat, AI score, marketing/verifikasi.
   ===================================================================== */

function subNas(){
  const g=(id,d='')=>{const e=document.getElementById(id);return e?e.value:d;};
  try{
    const type=g('i-tenor-type','Bulan');
    const firstDue=new Date();
    if(type==='Minggu') firstDue.setDate(firstDue.getDate()+7); else firstDue.setMonth(firstDue.getMonth()+1);
    if(!g('i-nm')||!g('i-pl')) return alert('Nama & Plafond wajib diisi!');
    DB.nasabah.push({
      id:uid(), unit:activeApp||'umum',
      nama:g('i-nm'), gender:g('i-jk','L'), nik:g('i-nik','-'), alamat:g('i-al','-'),
      wa:g('i-wa','-'), email:g('i-em','-'),
      plafond:g('i-pl','0'), tenor:g('i-tn','0'), tenorType:type,
      dp:g('i-dp','0'), jaminan:g('i-jam','-'),
      status:'Pending', payStatus:'Belum', noSurat:'-',
      foto:tempFoto, ktp:tempKTPPhoto, inputBy:activeUser?activeUser.user:'-',
      nextDueDate:firstDue.getTime(), createdAt:Date.now()
    });
    tempFoto=''; tempKTPPhoto='';
    queueCommit(); alert('Data nasabah tersimpan (akan tersinkron otomatis).'); page('input');
  }catch(e){ alert('Error: '+e.message); }
}
function approve(id){
  const i=DB.nasabah.findIndex(x=>String(x.id)===String(id)); if(i===-1) return alert('Data tidak ditemukan.');
  const d=DB.nasabah[i];
  const admIn=prompt('Biaya Administrasi (masuk Kas Unit):','0'); if(admIn===null) return;
  const biayaAdmin=parseInt(admIn)||0;
  const masuk=DB.dana.filter(x=>x.unit===activeApp&&x.status==='Approved').reduce((a,b)=>a+parseInt(b.amount),0);
  const keluar=DB.nasabah.filter(x=>x.unit===activeApp&&x.status==='Approved'&&x.payStatus!=='Lunas').reduce((a,b)=>a+parseInt(b.plafond),0);
  const limitPersen=settings.limits[activeApp]||100;
  if(keluar+parseInt(d.plafond)>masuk*(limitPersen/100)) return alert(`GAGAL: Limit kredit unit ${limitPersen}% penuh!\nTerpakai: ${rp(keluar)}`);
  d.status='Approved';
  d.noSurat=`${(settings.nama||'BMT').split(' ').map(w=>w[0]).join('').toUpperCase()}/${(settings.codes[activeApp]||'UNT')}/${Math.floor(Math.random()*900+100)}/${new Date().getFullYear()}`;
  const nUser=d.nama.replace(/\s/g,'').toLowerCase();
  if(!DB.users.find(u=>u.user===nUser)) DB.users.push({id:uid(),user:nUser,password:'123',role:'nasabah',app:'induk',photo:d.foto||'',createdAt:Date.now()});
  DB.aruskas.push({id:uid(),date:Date.now(),unit:activeApp,type:'Keluar',amount:parseInt(d.plafond),desc:'Pencairan Pembiayaan a.n '+d.nama});
  if(biayaAdmin>0) DB.aruskas.push({id:uid(),date:Date.now(),unit:activeApp,type:'Masuk',amount:biayaAdmin,desc:'Pendapatan Admin Akad a.n '+d.nama});
  queueCommit(); page('approval');
  alert(`BERHASIL ACC!\nPlafond: ${rp(d.plafond)}\nAdmin: ${rp(biayaAdmin)}\nDiterima: ${rp(parseInt(d.plafond)-biayaAdmin)}\n\nAkun nasabah: ${nUser} / 123`);
}
function reject(id){ deleteRecord('nasabah', id, {backTo:'approval'}); }
function bayar(id, angsuran){
  const i=DB.nasabah.findIndex(x=>String(x.id)===String(id)); if(i===-1) return;
  const d=DB.nasabah[i];
  if(!confirm(`Terima angsuran ${d.nama} sebesar ${rp(angsuran)}?`)) return;
  DB.aruskas.push({id:uid(),date:Date.now(),unit:activeApp,type:'Masuk',amount:angsuran,desc:'Angsuran a.n '+d.nama});
  let due=d.nextDueDate?new Date(d.nextDueDate):new Date();
  if(d.tenorType==='Minggu') due.setDate(due.getDate()+7); else due.setMonth(due.getMonth()+1);
  DB.nasabah[i].nextDueDate=due.getTime();
  queueCommit();
  const sapaan=d.gender==='L'?'Bapak':'Ibu';
  const msg=(settings.pesanBayar||'').replace('{sapaan}',sapaan).replace('{nama}',d.nama).replace('{tagihan}',rp(angsuran))+'\n\nJatuh tempo berikutnya: '+due.toLocaleDateString('id-ID');
  if(d.wa && d.wa!=='-') openWA(d.wa,msg);
  alert('Angsuran diterima. Jadwal diperbarui.'); page('billing');
}
function prosesPelunasan(id){
  const i=DB.nasabah.findIndex(x=>String(x.id)===String(id)); if(i===-1) return;
  const d=DB.nasabah[i];
  const inp=prompt(`PELUNASAN a.n ${d.nama}\nNominal pelunasan:`,'0');
  if(!inp||parseInt(inp)<=0) return;
  if(!confirm(`Proses pelunasan ${rp(inp)}? Status menjadi LUNAS.`)) return;
  DB.aruskas.push({id:uid(),date:Date.now(),unit:activeApp,type:'Masuk',amount:parseInt(inp),desc:'Pelunasan a.n '+d.nama});
  DB.nasabah[i].payStatus='Lunas'; DB.nasabah[i].nextDueDate=null;
  queueCommit();
  if(d.wa && d.wa!=='-') openWA(d.wa,`Alhamdulillah, pembiayaan a.n ${d.nama} telah LUNAS (${rp(inp)}). Terima kasih.`);
  alert('Pelunasan berhasil.'); page('billing');
}
function getStatusPeriode(x){
  if(x.payStatus==='Lunas') return '<span class="badge" style="background:#d4edda;color:green">LUNAS</span>';
  const due=x.nextDueDate?new Date(x.nextDueDate):new Date(x.createdAt||Date.now());
  const diff=Math.ceil((due-new Date())/86400000);
  const batas=x.tenorType==='Minggu'?2:10;
  if(diff<0) return `<span class="badge" style="background:#f8d7da;color:#721c24">Terlambat ${Math.abs(diff)} hari</span>`;
  if(diff<=batas) return `<span class="badge" style="background:#fff3cd;color:#856404">H-${diff} Jatuh Tempo</span>`;
  return `<span class="badge" style="background:#e8f5e9;color:#2e7d32">Aman (tempo ${due.toLocaleDateString('id-ID')})</span>`;
}
function kirimWA(id, angsuran){
  const d=DB.nasabah.find(x=>String(x.id)===String(id)); if(!d) return;
  const sapaan=d.gender==='L'?'Bapak':'Ibu';
  const edit=prompt('Nominal tagihan:',angsuran); if(!edit) return;
  const tglJt=d.nextDueDate?new Date(d.nextDueDate).toLocaleDateString('id-ID'):'-';
  const msg=(settings.pesanTagih||'').replace('{sapaan}',sapaan).replace('{nama}',d.nama).replace('{tagihan}',rp(edit)).replace('{tanggal}',tglJt);
  openWA(d.wa,msg);
}
function waMarketing(mkt,nm){ const u=DB.users.find(x=>x.user===mkt); let wa=u?u.noHP:''; if(!wa) wa=prompt('Nomor WA '+mkt+':'); if(wa) openWA(wa,`Assalamu'alaikum ${mkt}, segera follow-up nasabah ${nm} karena menunggak.`); }

function saveKas(){
  const type=document.getElementById('k-type').value, amt=document.getElementById('k-amt').value, desc=document.getElementById('k-desc').value;
  if(!amt||!desc) return alert('Lengkapi data!');
  DB.aruskas.push({id:uid(),date:Date.now(),unit:activeApp,type,amount:parseInt(amt),desc});
  queueCommit(); alert('Transaksi dicatat!'); page('arus_kas');
}
function saveKasInduk(){
  const amt=document.getElementById('k-induk-amt').value, desc=document.getElementById('k-induk-desc').value;
  if(!amt||!desc) return alert('Lengkapi data!');
  DB.aruskas.push({id:uid(),date:Date.now(),unit:'induk',type:'Keluar',amount:parseInt(amt),desc});
  queueCommit(); alert('Pengeluaran dicatat!'); page('kas_pusat');
}
function setorModalPusat(){
  const a=document.getElementById('modal-in-amt').value; if(!a) return;
  DB.aruskas.push({id:uid(),date:Date.now(),unit:'induk',type:'Masuk',amount:parseInt(a),desc:'Suntikan Modal'});
  queueCommit(); page('kas_pusat');
}
function saveSimpananWajib(){
  const u=document.getElementById('sw-user').value;
  DB.simpananwajib.push({id:uid(),date:Date.now(),user:u,amount:settings.simpananWajib});
  queueCommit(); alert('Iuran diterima!'); page('simpanan_wajib');
}
function bayarIuranKetua(user){
  DB.simpananwajib.push({id:uid(),date:Date.now(),user,amount:settings.simpananWajib});
  queueCommit(); alert('Pembayaran diterima.'); page('iuran_ketua');
}
function tagihIuranWA(user){
  const t=DB.users.find(x=>x.user===user); let wa=t?t.noHP:'';
  if(!wa) wa=prompt('Nomor WA '+user+' (628...):');
  const amt=prompt('Nominal tagihan:',settings.simpananWajib); if(!amt) return;
  const msg=(settings.pesanIuran||'').replace('{sapaan}','Bapak/Ibu').replace('{nama}',user).replace('{tagihan}',rp(amt));
  if(wa) openWA(wa,msg);
}

function saveModal(){
  const u=document.getElementById('m-unit').value, a=document.getElementById('m-amount').value;
  if(!a) return alert('Isi nominal!');
  const st=activeUser.role==='KETUA'?'Approved':'Pending Ketua';
  DB.dana.push({id:uid(),date:Date.now(),unit:u,amount:parseInt(a),status:st,desc:document.getElementById('m-desc').value||'-'});
  queueCommit(); alert(st==='Approved'?'Tersimpan & aktif':'Terkirim ke Ketua'); page('distribusi_modal');
}
function addModalAwal(){
  const u=document.getElementById('bm-unit').value, a=document.getElementById('bm-amt').value;
  if(!a||parseInt(a)<=0) return alert('Isi nominal yang benar!');
  DB.dana.push({id:uid(),date:Date.now(),unit:u,amount:parseInt(a),status:'Approved',desc:'Modal Awal BMT'});
  DB.aruskas.push({id:uid(),date:Date.now(),unit:'induk',type:'Masuk',amount:parseInt(a),desc:'Suntikan Modal Awal unit '+u.toUpperCase()});
  queueCommit(); alert('Modal awal ditambahkan!'); page('distribusi_modal');
}
function accDana(id){
  const i=DB.dana.findIndex(d=>String(d.id)===String(id)); if(i===-1) return;
  if(activeUser.role==='KETUA'||activeUser.role==='ADMIN'){
    DB.dana[i].status='Approved';
    DB.aruskas.push({id:uid(),date:Date.now(),unit:'induk',type:'Keluar',amount:DB.dana[i].amount,desc:'Penyaluran Modal ke '+DB.dana[i].unit.toUpperCase()});
    DB.aruskas.push({id:uid(),date:Date.now(),unit:DB.dana[i].unit,type:'Masuk',amount:DB.dana[i].amount,desc:'Terima Modal dari Pusat'});
    alert('Dana disalurkan dari Pusat ke Unit.');
  } else { DB.dana[i].status='Pending Ketua'; alert('Disetujui Bendahara. Menunggu ACC Ketua.'); }
  queueCommit(); page(activeUser.role==='BENDAHARA'?'distribusi_modal':'approval_pusat');
}
function rejectDana(id){
  const i=DB.dana.findIndex(d=>String(d.id)===String(id)); if(i===-1) return;
  DB.dana[i].status='Rejected'; queueCommit(); page('approval_pusat');
}
function reqDana(){
  const a=document.getElementById('req-amt').value; if(!a) return alert('Isi nominal!');
  DB.dana.push({id:uid(),date:Date.now(),unit:activeApp,amount:parseInt(a),status:'Pending',desc:document.getElementById('req-desc').value||'-'});
  queueCommit(); alert('Pengajuan terkirim ke Pusat.'); page('dana_unit');
}
function getAvailableProfit(unit){
  const mp=settings.margins[unit]||0;
  const kotor=DB.nasabah.filter(x=>x.unit===unit&&x.payStatus==='Lunas').reduce((a,n)=>a+parseInt(n.plafond)*(mp/100),0);
  const bagi=DB.profitFlow.filter(p=>p.targetUnit===unit&&p.status!=='Rejected').reduce((a,b)=>a+parseInt(b.amount),0);
  return Math.max(0, kotor-bagi);
}
function updateHitunganProfit(){
  const u=document.getElementById('pd-unit').value, p=document.getElementById('pd-persen').value;
  const max=getAvailableProfit(u);
  const inf=document.getElementById('info-laba-tersedia'); if(inf) inf.innerText=rp(max);
  document.getElementById('pd-amt').value=(p&&p>0)?Math.floor(max*(p/100)):0;
}
function createProfitDistribution(){
  const u=document.getElementById('pd-unit').value, p=document.getElementById('pd-persen').value, a=document.getElementById('pd-amt').value;
  if(!u) return alert('Pilih unit!');
  if(!p||p<=0) return alert('Isi persentase!');
  if(!a||parseInt(a)<=0) return alert('Nominal nol.');
  if(parseInt(a)>getAvailableProfit(u)) return alert('Melebihi laba tersedia!');
  DB.profitFlow.push({id:uid(),date:Date.now(),amount:parseInt(a),persen:parseInt(p),targetUnit:u,status:'Pending Ketua',inputBy:activeUser.user});
  queueCommit(); alert('Pengajuan terkirim ke Ketua.'); page('distribusi_profit');
}
function approveProfitKetua(id){
  const p=DB.profitFlow.find(x=>String(x.id)===String(id)); if(!p) return;
  if(!confirm(`Setujui bagi hasil ${p.targetUnit.toUpperCase()} ${rp(p.amount)}?`)) return;
  p.status='Pending Manager';
  DB.aruskas.push({id:uid(),date:Date.now(),unit:p.targetUnit,type:'Keluar',amount:p.amount,desc:`Bagi Hasil Profit (${p.persen}%)`});
  queueCommit(); alert('Disetujui.'); page('acc_profit_ketua');
}
function acceptProfitManager(id){
  const p=DB.profitFlow.find(x=>String(x.id)===String(id)); if(!p) return;
  p.status='Pending Accounting'; queueCommit(); alert('Diteruskan ke Accounting.'); page('terima_profit_manager');
}
function distributeProfitAccounting(id){
  const p=DB.profitFlow.find(x=>String(x.id)===String(id)); if(!p) return;
  const clients=DB.nasabah.filter(n=>n.unit===p.targetUnit&&n.status==='Approved');
  if(!clients.length) return alert('Belum ada nasabah lolos.');
  const counts={}; clients.forEach(c=>{counts[c.inputBy]=(counts[c.inputBy]||0)+1;});
  const perClient=parseInt(p.amount)/clients.length;
  Object.keys(counts).forEach(m=>{ DB.aruskas.push({id:uid(),date:Date.now(),unit:p.targetUnit,type:'Insentif',recipient:m,amount:Math.floor(perClient*counts[m]),desc:`Bonus SHU (${counts[m]} nasabah)`}); });
  p.status='Complete'; queueCommit(); alert('Distribusi insentif selesai!'); page('distribusi_insentif');
}

function saveTabungan(){
  const nm=document.getElementById('t-nm').value, setor=document.getElementById('t-setoran').value;
  if(!nm||!setor) return alert('Data belum lengkap!');
  const adm=parseInt(document.getElementById('t-adm').value)||0;
  DB.tabungan.push({id:uid(),unit:activeApp,nama:nm,setoranAwal:parseInt(setor),tenorType:document.getElementById('t-tenor-type').value,tenor:document.getElementById('t-tenor').value,saldo:parseInt(setor),inputBy:activeUser.user,date:Date.now()});
  if(adm>0) DB.aruskas.push({id:uid(),date:Date.now(),unit:activeApp,type:'Masuk',amount:adm,desc:'Adm Buka Rek '+nm});
  queueCommit(); alert('Rekening dibuat.'); page('input_tabungan');
}

function sendSarpras(){
  const i=document.getElementById('sp-i').value, a=document.getElementById('sp-a').value;
  if(!i) return alert('Isi nama barang!');
  DB.sarpras.push({id:uid(),unit:activeApp,item:i,alasan:a,status:'Pending'});
  queueCommit(); alert('Pengajuan terkirim.'); page('req_sarpras');
}
function accSarpras(id){
  const s=DB.sarpras.find(x=>String(x.id)===String(id)); if(!s) return;
  if(activeUser.role==='KETUA'||activeUser.role==='ADMIN'){ s.status='Approved'; alert('Sarpras disetujui Ketua.'); }
  else { s.status='Pending Ketua'; alert('Disetujui Sekretaris. Menunggu Ketua.'); }
  queueCommit(); page(activeUser.role==='SEKRETARIS'?'sarpras_approval':'approval_pusat');
}
function saveSurat(j){
  const kode=(settings.nama||'BMT').split(' ').map(w=>w[0]).join('').toUpperCase();
  const no=j==='Keluar'?`${kode}/SK/${Math.floor(Math.random()*900+100)}/${new Date().getFullYear()}`:'-';
  DB.surat.push({id:uid(),no,jenis:j,tujuan:document.getElementById('s-tuj').value,perihal:document.getElementById('s-per').value,isi:document.getElementById('s-isi').value,date:Date.now()});
  queueCommit(); alert('Surat tersimpan: '+no); page('surat_induk');
}
function kirimInstruksiInternal(){
  const tuj=document.getElementById('ins-tuj').value, pesan=document.getElementById('ins-pesan').value;
  if(!pesan) return alert('Pesan kosong!');
  DB.instruksi.push({id:uid(),toRole:tuj,message:pesan,date:Date.now(),read:false,sender:activeUser.user});
  queueCommit(); alert('Instruksi terkirim.'); page('kirim_instruksi');
}
function toggleChat(){ const box=document.getElementById('chat-box'); box.style.display=box.style.display==='flex'?'none':'flex'; if(box.style.display==='flex') renderChat(); }
function sendChat(sender){
  const inp=sender==='Guest'?document.getElementById('chat-input'):document.getElementById('sek-chat-input');
  const txt=inp.value.trim(); if(!txt) return;
  DB.chat.push({id:uid(),sender,msg:txt,time:Date.now()});
  queueCommit(); inp.value='';
  if(sender==='Guest') renderChat(); else renderChatSekretaris();
}
function renderChat(){
  const b=document.getElementById('chat-body'); if(!b) return;
  b.innerHTML=DB.chat.map(c=>`<div style="padding:8px 12px;border-radius:10px;font-size:.88rem;max-width:85%;${c.sender==='Guest'?'align-self:flex-end;background:#dcf8c6;':'align-self:flex-start;background:#fff;border:1px solid #e2e8e8;'}"><b>${esc(c.sender)}</b>: ${esc(c.msg)}</div>`).join('');
  b.scrollTop=b.scrollHeight;
}
function renderChatSekretaris(){
  const b=document.getElementById('sek-chat-body'); if(!b) return;
  b.innerHTML=DB.chat.map(c=>`<div style="padding:8px 12px;border-radius:10px;font-size:.88rem;max-width:85%;${c.sender==='Sekretaris'?'align-self:flex-end;background:#dcf8c6;':'align-self:flex-start;background:#fff;border:1px solid #e2e8e8;'}"><b>${esc(c.sender)}</b>: ${esc(c.msg)}</div>`).join('');
  b.scrollTop=b.scrollHeight;
}
function openMeeting(){
  new JitsiMeetExternalAPI('meet.jit.si',{roomName:'BMT_Rapat_'+Math.floor(Math.random()*1000),width:'100%',height:'100%',parentNode:document.querySelector('#jitsi-container'),lang:'id'});
}

function ajukanStatusMarketing(user,isEligible){
  if(!confirm(`Ajukan status ${isEligible?'LAYAK':'TIDAK LAYAK'} untuk ${user}?`)) return;
  DB.marketingReq.push({id:uid(),target:user,type:isEligible,status:'Pending Ketua',reqBy:activeUser.user,date:Date.now()});
  queueCommit(); alert('Terkirim ke Ketua.'); page('kelayakan_marketing');
}
function accMarketingReq(id){
  const r=DB.marketingReq.find(m=>String(m.id)===String(id)); if(!r) return;
  const u=DB.users.find(x=>x.user===r.target); if(!u) return alert('User tidak ditemukan.');
  u.isEligible=r.type; r.status='Approved';
  queueCommit(); alert('Status '+r.target+' diubah.'); page('approval_pusat');
}
function bukaFormBayar(id,nominal,tipe){
  document.getElementById('form-bayar-nasabah').classList.remove('hidden');
  document.getElementById('nom-bayar-nasabah').value=nominal;
  document.getElementById('judul-bayar').innerText='Kirim Bukti '+tipe;
  dataBayarTemp={nasabahId:id,nominal,tipe};
  document.getElementById('form-bayar-nasabah').scrollIntoView({behavior:'smooth'});
}
function previewBukti(inp){ if(inp.files[0]) resizeImage(inp.files[0],res=>{ dataBayarTemp.foto=res; document.getElementById('preview-container').innerHTML=`<img src="${res}" style="width:150px;border-radius:6px;border:1px solid #ddd;">`; },500); }
function kirimBuktiKeAccounting(){
  if(!dataBayarTemp.foto) return alert('Pilih foto bukti dulu!');
  DB.instruksi.push({id:uid(),toRole:'ACCOUNTING',sender:activeUser.user,message:`KONFIRMASI BAYAR: ${activeUser.user} mengirim bukti ${dataBayarTemp.tipe} sebesar ${rp(dataBayarTemp.nominal)}`,buktiFoto:dataBayarTemp.foto,metaData:dataBayarTemp,date:Date.now(),read:false});
  queueCommit(); alert('Bukti terkirim ke Accounting!'); page('dashboard_nasabah');
}
function terimaBayarNasabah(iid){
  const idx=DB.instruksi.findIndex(v=>String(v.id)===String(iid)); if(idx===-1) return;
  const ins=DB.instruksi[idx], meta=ins.metaData;
  if(!confirm(`Konfirmasi pembayaran ${rp(meta.nominal)}?`)) return;
  DB.aruskas.push({id:uid(),date:Date.now(),unit:activeApp,type:'Masuk',amount:meta.nominal,desc:`${meta.tipe} a.n ${ins.sender}`});
  const nIdx=DB.nasabah.findIndex(n=>String(n.id)===String(meta.nasabahId));
  if(meta.tipe==='Pelunasan'&&nIdx>-1) DB.nasabah[nIdx].payStatus='Lunas';
  const nas=DB.nasabah[nIdx];
  deleteRecord('instruksi', iid, {skipConfirm:true, silent:true});
  queueCommit(); alert('Pembayaran terverifikasi!');
  if(nas && nas.wa && nas.wa!=='-') openWA(nas.wa,`*KONFIRMASI PEMBAYARAN - ${settings.nama}*\nPembayaran ${meta.tipe} sebesar ${rp(meta.nominal)} telah diverifikasi. Terima kasih.`);
  page('verifikasi_bayar');
}
function runAIScore(id){
  const n=DB.nasabah.find(x=>String(x.id)===String(id)); if(!n) return;
  document.getElementById('ai-modal').style.display='flex';
  document.getElementById('ai-result').style.display='none';
  setTimeout(()=>{
    document.getElementById('ai-result').style.display='block';
    let s=65;
    if(n.ktp&&n.ktp.length>5)s+=10; if(n.foto&&n.foto.length>5)s+=10; if(n.nik&&n.nik.length>10)s+=5;
    if(parseInt(n.plafond)<5000000)s+=5; if(parseInt(n.plafond)>10000000&&parseInt(n.tenor)<5)s-=10;
    s=Math.min(100,Math.max(0,s+Math.floor(Math.random()*15)-5));
    const v=s>=80?['SANGAT LAYAK','#27ae60','linear-gradient(90deg,#2ecc71,#27ae60)']:s>=60?['CUKUP LAYAK','#f39c12','linear-gradient(90deg,#f1c40f,#f39c12)']:['BERISIKO','#c0392b','linear-gradient(90deg,#e74c3c,#c0392b)'];
    document.getElementById('ai-score').innerText=s+'/100'; document.getElementById('ai-score').style.color=v[1];
    document.getElementById('ai-verdict').innerText=v[0]; document.getElementById('ai-verdict').style.color=v[1];
    const bar=document.getElementById('ai-bar'); bar.style.width=s+'%'; bar.style.background=v[2];
    document.getElementById('ai-desc').innerText=`Analisa: ${n.nama} mengajukan ${rp(n.plafond)}. Periksa fisik jaminan bila ada.`;
  },1500);
}
/* =====================================================================
   app.js bagian 2c — ROUTER halaman, halaman-halaman fungsional, cetak,
   ID card, dan BOOT aplikasi.
   ===================================================================== */

function page(id){
  if(!activeUser){ document.getElementById('gateway').style.display='flex'; return; }
  const publik = ['home','profil','inbox_ketua'];
  if(!publik.includes(id) && !checkAccess(activeUser.role, id)){
    alert('Anda tidak memiliki akses ke menu ini.'); id = 'home';
  }
  localStorage.setItem('bmt_last_page', id);
  const back = document.getElementById('mob-back-btn'); if(back) back.style.display = (id==='home')?'none':'block';
  const b = document.getElementById('content-body'); const t = document.getElementById('page-title');
  if(!b || !t) return;
  b.innerHTML = ''; t.innerText = 'Dashboard';
  renderMobileNav();

  if(id === 'home'){
    if(window.innerWidth <= 900 && !document.body.classList.contains('force-desktop')) return renderMobileHome(b, t);
    return renderDesktopHome(b, t);
  }
  if(id === 'identitas') return pageIdentitas(b, t);
  if(id === 'users') return pageUsers(b, t);
  if(id === 'manage_access') return pageManageAccess(b, t);
  if(id === 'data_manager') return pageDataManager(b, t);
  if(id === 'profil') return pageProfil(b, t);
  if(id === 'approval_pusat') return pageApprovalPusat(b, t);
  if(id === 'manajemen_anggota') return pageAnggota(b, t);
  if(id === 'iuran_ketua') return pageIuran(b, t);
  if(id === 'laporan_eksekutif') return pageLaporanEksekutif(b, t);
  if(id === 'kirim_instruksi') return pageKirimInstruksi(b, t);
  if(id === 'rapat_online' || id === 'rapat_online_anggota') return pageRapat(b, t);
  if(id === 'acc_profit_ketua') return pageACCProfitKetua(b, t);
  if(id === 'inbox_ketua') return pageInbox(b, t);
  if(id === 'kas_pusat') return pageKasPusat(b, t);
  if(id === 'simpanan_wajib') return pageSimpananWajib(b, t);
  if(id === 'distribusi_modal') return pageDistribusiModal(b, t);
  if(id === 'distribusi_profit') return pageDistribusiProfit(b, t);
  if(id === 'kelayakan_marketing') return pageKelayakanMarketing(b, t);
  if(id === 'arus_kas') return pageArusKas(b, t);
  if(id === 'dana_unit') return pageDanaUnit(b, t);
  if(id === 'distribusi_insentif') return pageDistribusiInsentif(b, t);
  if(id === 'verifikasi_bayar') return pageVerifikasiBayar(b, t);
  if(id === 'terima_profit_manager') return pageTerimaProfitManager(b, t);
  if(id === 'approval') return pageApprovalUnit(b, t);
  if(id === 'laporan_tunggakan') return pageTunggakan(b, t);
  if(id === 'laporan_detail') return pageLaporanDetail(b, t);
  if(id === 'setting_margin') return pageSettingMargin(b, t);
  if(id === 'monitoring_kinerja') return pageMonitoringKinerja(b, t);
  if(id === 'laporan_laba_unit') return pageLabaUnit(b, t);
  if(id === 'req_sarpras') return pageReqSarpras(b, t);
  if(id === 'input') return pageInputNasabah(b, t);
  if(id === 'input_tabungan') return pageInputTabungan(b, t);
  if(id === 'billing') return pageBilling(b, t);
  if(id === 'dompet_marketing') return pageDompetMarketing(b, t);
  if(id === 'cetak') return pageCetakAkad(b, t);
  if(id === 'chat_tamu') return pageChatSekretaris(b, t);
  if(id === 'id_card_maker') return pageIDCardMaker(b, t);
  if(id === 'surat_induk') return pageSurat(b, t);
  if(id === 'sarpras_approval') return pageSarprasApproval(b, t);
  if(id === 'laporan_pusat') return pageLaporanPusat(b, t);
  if(id === 'monitoring_pegawai') return pageMonitoringPegawai(b, t);
  if(id === 'ajukan_pinjaman') return pageAjukanPinjaman(b, t);
  if(id === 'dashboard_nasabah') return pageDashboardNasabah(b, t);
  b.innerHTML = '<div class="card">Fitur belum tersedia atau tidak dikenali.</div>';
}

function renderMobileHome(b, t){
  t.innerText = 'Beranda';
  const menus = myMenus().filter(m => !['profil','inbox_ketua'].includes(m.id));
  let saldo = 0;
  if(activeApp==='induk'){
    const iuran=DB.simpananwajib.reduce((a,b)=>a+parseInt(b.amount),0);
    const arus=DB.aruskas.filter(k=>k.unit==='induk').reduce((a,b)=>b.type==='Masuk'?a+parseInt(b.amount):a-parseInt(b.amount),0);
    saldo = iuran + parseInt(settings.shu.profit||0) + arus;
  } else {
    saldo = DB.aruskas.filter(k=>k.unit===activeApp).reduce((a,b)=>b.type==='Masuk'?a+parseInt(b.amount):a-parseInt(b.amount),0);
  }
  const cards = menus.map(m => `<div class="menu-item" onclick="page('${m.id}')"><div class="menu-icon"><i class="fas ${m.icon}"></i></div><div class="menu-label">${m.name}</div></div>`).join('');
  b.innerHTML = `
  <div class="card" style="background:var(--mob-primary-grad);color:#fff;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div><small style="opacity:.85;">Saldo ${activeApp.toUpperCase()}</small><h2 style="margin:6px 0 0;">${rp(saldo)}</h2></div>
      <i class="fas fa-wallet fa-2x" style="opacity:.35;"></i>
    </div>
  </div>
  <h4 style="margin:6px 4px 10px;color:#556;font-size:.95rem;">Menu Layanan</h4>
  <div class="menu-grid">${cards}</div>
  <div class="card" style="margin-top:16px;background:#eef7ff;">
    <small><i class="fas fa-info-circle" style="color:var(--mob-primary)"></i> Aplikasi bekerja offline. Data akan otomatis tersinkron saat online.</small>
  </div>`;
}
function renderDesktopHome(b, t){
  t.innerText = 'Dashboard';
  const prof = parseInt(settings.shu.profit||0);
  const totalAset = DB.dana.reduce((a,b)=>a+parseInt(b.amount||0),0);
  const jmlNasabah = DB.nasabah.filter(x=>x.status==='Approved').length;
  const iuranBulan = DB.simpananwajib.filter(s => new Date(s.date).getMonth()===new Date().getMonth()).reduce((a,b)=>a+parseInt(b.amount),0);
  b.innerHTML = `
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-bottom:22px;">
    <div class="card" style="background:var(--primary-gradient);color:#fff;"><small>Selamat Datang</small><h2 style="margin:6px 0 0;">${esc(activeUser.user)}</h2><small style="opacity:.8;">${activeUser.role} • ${activeApp.toUpperCase()}</small></div>
    <div class="card"><small>SHU Berjalan</small><h2 style="color:var(--primary);margin-top:4px;">${rp(prof)}</h2></div>
    <div class="card"><small>Total Aset Modal</small><h2 style="color:var(--primary);margin-top:4px;">${rp(totalAset)}</h2></div>
    <div class="card"><small>Iuran Bulan Ini</small><h2 style="color:var(--ok);margin-top:4px;">${rp(iuranBulan)}</h2></div>
    <div class="card"><small>Nasabah Aktif</small><h2 style="color:var(--primary);margin-top:4px;">${jmlNasabah}</h2></div>
  </div>
  <div class="card"><h4><i class="fas fa-info-circle"></i> Ringkasan</h4><p>Gunakan menu di sidebar untuk mengakses fitur sesuai jabatan Anda. Aplikasi ini bekerja offline dan otomatis menyinkron data setiap ${APP_CONFIG.syncIntervalSec} detik saat terhubung internet.</p></div>`;
}

function pageApprovalPusat(b, t){
  t.innerText='Persetujuan Pusat';
  const dana=DB.dana.filter(d=>d.status==='Pending Ketua').map(d=>`<tr><td data-label="Tipe">MODAL</td><td data-label="Ket">${esc(d.desc)} (${d.unit.toUpperCase()})</td><td data-label="Nom">${rp(d.amount)}</td><td data-label="Aksi"><button class="btn btn-success btn-sm" onclick="accDana('${d.id}')">ACC</button> <button class="btn btn-danger btn-sm" onclick="rejectDana('${d.id}')">Tolak</button></td></tr>`).join('');
  const sarp=DB.sarpras.filter(s=>s.status==='Pending Ketua').map(s=>`<tr><td data-label="Tipe">SARPRAS</td><td data-label="Ket">${esc(s.item)} — ${esc(s.alasan)}</td><td>-</td><td data-label="Aksi"><button class="btn btn-success btn-sm" onclick="accSarpras('${s.id}')">ACC</button></td></tr>`).join('');
  const mkt=DB.marketingReq.filter(m=>m.status==='Pending Ketua').map(m=>`<tr><td data-label="Tipe">MARKETING</td><td data-label="Ket">Set <b>${esc(m.target)}</b> jadi <b>${m.type?'LAYAK':'TIDAK LAYAK'}</b></td><td>-</td><td data-label="Aksi"><button class="btn btn-success btn-sm" onclick="accMarketingReq('${m.id}')">ACC</button></td></tr>`).join('');
  const rows=dana+sarp+mkt||'<tr><td colspan="4" style="text-align:center;">Tidak ada permintaan tertunda.</td></tr>';
  b.innerHTML=`<div class="card"><h4>Permintaan Menunggu Persetujuan</h4><div class="table-responsive"><table><thead><tr><th>Tipe</th><th>Ket</th><th>Nominal</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function pageAnggota(b, t){
  t.innerText='Manajemen Anggota';
  const allowed=['ketua','sekretaris','bendahara','anggota'];
  const rows=DB.users.filter(u=>allowed.includes(u.role.toLowerCase())).map(u=>`<tr><td data-label="Foto"><img src="${u.photo||DEFAULT_LOGO}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;"></td><td data-label="Nama">${esc(u.namaLengkap||u.user)}</td><td data-label="Role">${esc(u.role)}</td><td data-label="Status"><span class="badge" style="background:#e8f5e9;color:#2e7d32;">Aktif</span></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Daftar Anggota Inti</h4><div class="table-responsive"><table><thead><tr><th>Foto</th><th>Nama</th><th>Jabatan</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Belum ada anggota.</td></tr>'}</tbody></table></div></div>`;
}
function pageIuran(b, t){
  t.innerText='Monitoring Iuran Wajib';
  const allowed=['ketua','sekretaris','bendahara','anggota'];
  const users=DB.users.filter(u=>allowed.includes(u.role.toLowerCase()));
  const rows=users.map(u=>{
    const paid=DB.simpananwajib.some(s=>s.user===u.user&&new Date(s.date).getMonth()===new Date().getMonth());
    const st=paid?'<span class="badge" style="background:#d4edda;color:#155724;">Lunas</span>':'<span class="badge" style="background:#f8d7da;color:#721c24;">Belum</span>';
    let aksi='-';
    if(!paid){ aksi=`<button class="btn btn-warning btn-sm" onclick="tagihIuranWA('${u.user}')">Tagih</button>`;
      if(['BENDAHARA','KETUA','ADMIN'].includes(activeUser.role)) aksi+=` <button class="btn btn-primary btn-sm" onclick="bayarIuranKetua('${u.user}')">Terima</button>`; }
    return `<tr><td data-label="Nama">${esc(u.user)}</td><td data-label="Role">${esc(u.role)}</td><td data-label="Status">${st}</td><td data-label="Aksi">${aksi}</td></tr>`;
  }).join('');
  b.innerHTML=`<div class="card"><h4>Iuran Bulan Ini (${rp(settings.simpananWajib)})</h4><div class="table-responsive"><table><thead><tr><th>Nama</th><th>Jabatan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function pageLaporanEksekutif(b, t){
  t.innerText='Laporan Eksekutif';
  const kas=DB.aruskas.filter(x=>x.unit==='induk');
  const saldo=DB.simpananwajib.reduce((a,b)=>a+parseInt(b.amount),0)+parseInt(settings.shu.profit||0)+kas.reduce((a,b)=>b.type==='Masuk'?a+parseInt(b.amount):a-parseInt(b.amount),0);
  b.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;"><div class="card" style="background:var(--primary-gradient);color:#fff;"><h4>Saldo Kas Pusat</h4><h2>${rp(saldo)}</h2></div><div class="card" style="background:var(--accent-gradient);color:#0f3d3e;"><h4>Total Nasabah</h4><h2>${DB.nasabah.length}</h2></div><div class="card"><h4>Surat Keluar</h4><h2>${DB.surat.filter(s=>s.jenis==='Keluar').length}</h2></div></div>`;
}
function pageKirimInstruksi(b, t){
  t.innerText='Kirim Instruksi';
  b.innerHTML=`<div class="card" style="max-width:520px;"><h4>Instruksi Internal</h4><label>Tujuan</label><select id="ins-tuj" class="form-control"><option value="SEKRETARIS">Sekretaris</option><option value="BENDAHARA">Bendahara</option><option value="MANAGER">Manager</option><option value="ACCOUNTING">Accounting</option><option value="MARKETING">Marketing</option></select><label>Isi</label><textarea id="ins-pesan" class="form-control" style="height:110px;"></textarea><button class="btn btn-primary" onclick="kirimInstruksiInternal()"><i class="fas fa-paper-plane"></i> Kirim</button></div>`;
}
function pageRapat(b, t){ t.innerText='Rapat Online'; b.innerHTML=`<div class="card" style="height:78vh;"><div id="jitsi-container" style="width:100%;height:100%;"></div></div>`; openMeeting(); }
function pageInbox(b, t){
  t.innerText='Pesan & Instruksi';
  DB.instruksi.forEach(x=>{ if(x.toRole&&x.toRole.toUpperCase()===activeUser.role) x.read=true; });
  const msgs=DB.instruksi.filter(x=>x.toRole&&x.toRole.toUpperCase()===activeUser.role).sort((a,b)=>b.date-a.date);
  const rows=msgs.map(m=>`<tr><td data-label="Tgl">${new Date(m.date).toLocaleString('id-ID')}</td><td data-label="Isi" style="white-space:pre-wrap;">${esc(m.message)}</td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Kotak Masuk</h4><div class="table-responsive"><table><thead><tr><th>Waktu</th><th>Instruksi</th></tr></thead><tbody>${rows||'<tr><td colspan="2">Belum ada pesan.</td></tr>'}</tbody></table></div></div>`;
}
function pageACCProfitKetua(b, t){
  t.innerText='ACC Distribusi SHU';
  const rows=DB.profitFlow.filter(p=>p.status==='Pending Ketua').map(p=>`<tr><td>${p.targetUnit.toUpperCase()}</td><td>${rp(p.amount)}</td><td><button class="btn btn-success btn-sm" onclick="approveProfitKetua('${p.id}')">ACC</button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Menunggu Persetujuan</h4><div class="table-responsive"><table><thead><tr><th>Unit</th><th>Nominal</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="3">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageKasPusat(b, t){
  t.innerText='Kas Induk BMT (Pusat)';
  const iuran=DB.simpananwajib.reduce((a,b)=>a+parseInt(b.amount),0);
  const prof=parseInt(settings.shu.profit||0);
  const keluar=DB.aruskas.filter(x=>x.unit==='induk'&&x.type==='Keluar').reduce((a,b)=>a+parseInt(b.amount),0);
  const masuk=DB.aruskas.filter(x=>x.unit==='induk'&&x.type==='Masuk').reduce((a,b)=>a+parseInt(b.amount),0);
  const saldo=iuran+prof+masuk-keluar;
  const rowsK=DB.aruskas.filter(x=>x.unit==='induk').sort((a,b)=>b.date-a.date).map(x=>`<tr><td data-label="Tgl">${tgl(x.date)}</td><td data-label="Tipe"><span class="badge" style="background:${x.type==='Masuk'?'#d4edda':'#f8d7da'};color:${x.type==='Masuk'?'#155724':'#721c24'};">${x.type}</span></td><td data-label="Ket">${esc(x.desc)}</td><td data-label="Jml">${rp(x.amount)}</td><td data-label="#"><button class="btn btn-danger btn-sm" onclick="deleteRecord('aruskas','${x.id}',{backTo:'kas_pusat'})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
  b.innerHTML=`
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:18px;">
    <div class="card" style="background:var(--accent-gradient);color:#0f3d3e;"><small>Saldo Kas</small><h2>${rp(saldo)}</h2></div>
    <div class="card"><small>Iuran Wajib</small><h3 style="color:var(--primary)">+ ${rp(iuran)}</h3></div>
    <div class="card"><small>Modal Masuk</small><h3 style="color:var(--ok)">+ ${rp(masuk)}</h3></div>
    <div class="card"><small>Pengeluaran</small><h3 style="color:#c0392b">- ${rp(keluar)}</h3></div>
  </div>
  <div class="card"><h4>Setor Modal Pusat</h4><div style="display:flex;gap:10px;"><input id="modal-in-amt" type="number" class="form-control" placeholder="Nominal"><button class="btn btn-success" onclick="setorModalPusat()">Setor</button></div></div>
  <div class="card"><h4>Catat Pengeluaran Pusat</h4><div style="display:grid;grid-template-columns:1fr 2fr auto;gap:10px;"><input id="k-induk-amt" type="number" class="form-control" placeholder="Nominal"><input id="k-induk-desc" class="form-control" placeholder="Keterangan"><button class="btn btn-danger" onclick="saveKasInduk()">Simpan</button></div></div>
  <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;"><h4>Riwayat Transaksi Pusat</h4><button class="btn btn-primary btn-sm" onclick="printLaporanKas('induk')"><i class="fas fa-print"></i> PDF</button></div><div class="table-responsive"><table><thead><tr><th>Tgl</th><th>Tipe</th><th>Ket</th><th>Nominal</th><th></th></tr></thead><tbody>${rowsK||'<tr><td colspan="5">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageSimpananWajib(b, t){
  t.innerText='Iuran Wajib Anggota';
  const opts=DB.users.filter(u=>u.role.toLowerCase()!=='nasabah').map(u=>`<option value="${esc(u.user)}">${esc(u.user)} (${esc(u.role)})</option>`).join('');
  const rows=DB.simpananwajib.sort((a,b)=>b.date-a.date).map(s=>`<tr><td>${tgl(s.date)}</td><td>${esc(s.user)}</td><td>${rp(s.amount)}</td><td><button class="btn btn-danger btn-sm" onclick="deleteRecord('simpananwajib','${s.id}',{backTo:'simpanan_wajib'})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Terima Iuran</h4><div style="display:flex;gap:10px;flex-wrap:wrap;"><select id="sw-user" class="form-control" style="flex:1;">${opts}</select><input class="form-control" value="${rp(settings.simpananWajib)}" readonly style="width:130px;"><button class="btn btn-primary" onclick="saveSimpananWajib()">Terima</button></div></div><div class="card"><h4>Riwayat</h4><div class="table-responsive"><table><thead><tr><th>Tgl</th><th>Nama</th><th>Nominal</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="4">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageDistribusiModal(b, t){
  t.innerText='Distribusi Modal';
  const totalDist=DB.dana.filter(d=>d.status==='Approved').reduce((a,b)=>a+parseInt(b.amount),0);
  const pend=DB.dana.filter(d=>d.status==='Pending').map(d=>`<tr><td>${tgl(d.date)}</td><td>${d.unit.toUpperCase()}</td><td>${rp(d.amount)}</td><td><button class="btn btn-success btn-sm" onclick="accDana('${d.id}')">PROSES</button></td></tr>`).join('');
  const hist=DB.dana.filter(d=>['Approved','Pending Ketua'].includes(d.status)).map(d=>`<tr><td>${tgl(d.date)}</td><td>${d.unit.toUpperCase()}</td><td>${rp(d.amount)}</td><td>${esc(d.desc)}</td><td><span class="badge" style="background:${d.status==='Approved'?'#e8f5e9;color:#2e7d32':'#fff3cd;color:#856404'}">${d.status}</span></td><td>${d.desc.includes('Modal Awal')?`<button class="btn btn-danger btn-sm" onclick="deleteModalAwal('${d.id}')"><i class="fas fa-trash"></i></button>`:''}</td></tr>`).join('');
  const isBend=['BENDAHARA','ADMIN','KETUA'].includes(activeUser.role);
  b.innerHTML=`${isBend?`<div class="card" style="background:var(--primary-gradient);color:#fff;"><small>Total Modal Terdistribusi</small><h2>${rp(totalDist)}</h2></div><div class="card" style="background:#e8f5e9;"><h4>Tambah Modal Awal BMT</h4><select id="bm-unit" class="form-control"><option value="sps">SPS</option><option value="kms">KMS</option><option value="gadai">Gadai</option></select><input id="bm-amt" type="number" class="form-control" placeholder="Nominal"><button class="btn btn-success" onclick="addModalAwal()">Tambah Modal</button></div>`:''}
  <div class="card"><h4>Batas Penggunaan Dana</h4><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"><div><label>SPS (%)</label><input id="lim-sps" type="number" class="form-control" value="${settings.limits.sps}"></div><div><label>KMS (%)</label><input id="lim-kms" type="number" class="form-control" value="${settings.limits.kms}"></div><div><label>Gadai (%)</label><input id="lim-gadai" type="number" class="form-control" value="${settings.limits.gadai}"></div></div><button class="btn btn-warning" onclick="settings.limits.sps=+document.getElementById('lim-sps').value;settings.limits.kms=+document.getElementById('lim-kms').value;settings.limits.gadai=+document.getElementById('lim-gadai').value;queueCommit();alert('Limit tersimpan');">Simpan Limit</button></div>
  <div class="card"><h4>Ajuan Unit</h4><div class="table-responsive"><table><thead><tr><th>Tgl</th><th>Unit</th><th>Nominal</th><th>Aksi</th></tr></thead><tbody>${pend||'<tr><td colspan="4">Kosong</td></tr>'}</tbody></table></div><br><h4>Input Manual (Bendahara)</h4><select id="m-unit" class="form-control"><option value="sps">SPS</option><option value="kms">KMS</option><option value="gadai">Gadai</option></select><input id="m-amount" type="number" class="form-control" placeholder="Nominal"><input id="m-desc" class="form-control" placeholder="Keterangan"><button class="btn btn-primary" onclick="saveModal()">Ajukan</button></div>
  <div class="card"><h4>Riwayat Distribusi</h4><div class="table-responsive"><table><thead><tr><th>Tgl</th><th>Unit</th><th>Nom</th><th>Ket</th><th>Status</th><th></th></tr></thead><tbody>${hist||'<tr><td colspan="6">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageDistribusiProfit(b, t){
  t.innerText='Distribusi SHU';
  const rows=DB.profitFlow.map(p=>`<tr><td>${tgl(p.date)}</td><td>${p.targetUnit.toUpperCase()}</td><td>${p.persen||'-'}%</td><td>${rp(p.amount)}</td><td><span class="badge" style="background:#eef">${p.status}</span></td></tr>`).join('');
  b.innerHTML=`<div class="card" style="background:var(--primary-gradient);color:#fff;"><small>Laba Tersedia (pilih unit)</small><h2 id="info-laba-tersedia">Rp 0</h2></div><div class="card"><h4>Input Bagi Hasil</h4><label>Unit</label><select id="pd-unit" class="form-control" onchange="updateHitunganProfit()"><option value="" disabled selected>-- Pilih --</option><option value="sps">SPS</option><option value="kms">KMS</option><option value="gadai">Gadai</option></select><label>Persentase (%)</label><input id="pd-persen" type="number" class="form-control" onkeyup="updateHitunganProfit()"><label>Nominal (otomatis)</label><input id="pd-amt" type="number" class="form-control" readonly><button class="btn btn-primary" onclick="createProfitDistribution()">Ajukan Distribusi</button></div><div class="card"><h4>Riwayat</h4><div class="table-responsive"><table><thead><tr><th>Tgl</th><th>Unit</th><th>%</th><th>Nom</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageKelayakanMarketing(b, t){
  t.innerText='Kelayakan Marketing';
  const mkt=DB.users.filter(u=>u.role.toLowerCase()==='marketing');
  const rows=mkt.map(u=>{ const st=u.isEligible===false?'<span style="color:red">Dibekukan</span>':'<span style="color:green">Layak</span>'; const pend=DB.marketingReq.find(r=>r.target===u.user&&r.status==='Pending Ketua'); let btn=pend?'<span class="badge" style="background:orange;color:#fff">Menunggu Ketua</span>':(u.isEligible===false?`<button class="btn btn-success btn-sm" onclick="ajukanStatusMarketing('${u.user}',true)">Ajukan Layak</button>`:`<button class="btn btn-danger btn-sm" onclick="ajukanStatusMarketing('${u.user}',false)">Ajukan Tidak Layak</button>`); return `<tr><td>${esc(u.user)}</td><td>${st}</td><td>${btn}</td></tr>`; }).join('');
  b.innerHTML=`<div class="card"><div class="table-responsive"><table><thead><tr><th>Marketing</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="3">Belum ada marketing.</td></tr>'}</tbody></table></div></div>`;
}
function pageArusKas(b, t){
  t.innerText='Buku Kas '+activeApp.toUpperCase();
  const rows=DB.aruskas.filter(x=>x.unit===activeApp).sort((a,b)=>b.date-a.date).map(x=>`<tr><td>${tgl(x.date)}</td><td><span class="badge" style="background:${x.type==='Masuk'?'#d4edda':'#f8d7da'}">${x.type}</span></td><td>${rp(x.amount)}</td><td>${esc(x.desc)}</td><td><button class="btn btn-danger btn-sm" onclick="deleteRecord('aruskas','${x.id}',{backTo:'arus_kas'})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Input Transaksi</h4><select id="k-type" class="form-control"><option value="Masuk">Uang Masuk</option><option value="Keluar">Uang Keluar</option></select><input id="k-amt" type="number" class="form-control" placeholder="Nominal"><input id="k-desc" class="form-control" placeholder="Keterangan"><button class="btn btn-primary" onclick="saveKas()">Simpan</button></div><div class="card"><div style="display:flex;justify-content:space-between;"><h4>Buku Kas</h4><button class="btn btn-primary btn-sm" onclick="printLaporanKas('${activeApp}')"><i class="fas fa-print"></i> PDF</button></div><div class="table-responsive"><table><thead><tr><th>Tgl</th><th>Tipe</th><th>Nom</th><th>Ket</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageDanaUnit(b, t){
  t.innerText='Manajemen Dana Unit '+activeApp.toUpperCase();
  const modal=DB.dana.filter(x=>x.unit===activeApp&&x.status==='Approved').reduce((a,b)=>a+parseInt(b.amount),0);
  const balik=DB.aruskas.filter(x=>x.unit===activeApp&&x.type==='Masuk').reduce((a,b)=>a+parseInt(b.amount),0);
  const keluarN=DB.nasabah.filter(x=>x.unit===activeApp&&x.status==='Approved').reduce((a,b)=>a+parseInt(b.plafond),0);
  const keluarO=DB.aruskas.filter(x=>x.unit===activeApp&&x.type==='Keluar').reduce((a,b)=>a+parseInt(b.amount),0);
  const sisa=(modal+balik)-(keluarN+keluarO);
  b.innerHTML=`<div class="card" style="background:${sisa<0?'#ffebee':'#e8f5e9'};"><small>Dana Tersedia</small><h1 style="color:${sisa<0?'red':'green'}">${rp(sisa)}</h1><small><i class="fas fa-info-circle"></i> (Modal + Angsuran Masuk) - (Pinjaman Cair + Ops)</small></div><div class="card"><h4>Ajukan Tambahan Dana</h4><input id="req-amt" type="number" class="form-control" placeholder="Nominal"><input id="req-desc" class="form-control" placeholder="Keperluan"><button class="btn btn-primary" onclick="reqDana()">Kirim ke Pusat</button></div>`;
}
function pageDistribusiInsentif(b, t){
  t.innerText='Distribusi Insentif';
  const list=DB.aruskas.filter(x=>x.type==='Insentif');
  const rows=list.map(x=>`<tr><td>${tgl(x.date)}</td><td><b>${esc(x.recipient)}</b></td><td>${x.unit.toUpperCase()}</td><td>${esc(x.desc)}</td><td style="color:green;font-weight:700;">${rp(x.amount)}</td></tr>`).join('');
  b.innerHTML=`<div class="card" style="background:var(--primary-gradient);color:#fff;"><small>Total Insentif</small><h1>${rp(list.reduce((a,b)=>a+parseInt(b.amount),0))}</h1></div><div class="card"><h4>Riwayat Insentif</h4><div class="table-responsive"><table><thead><tr><th>Tgl</th><th>Marketing</th><th>Unit</th><th>Ket</th><th>Nom</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageVerifikasiBayar(b, t){
  t.innerText='Verifikasi Pembayaran Nasabah';
  const list=DB.instruksi.filter(i=>i.toRole==='ACCOUNTING'&&i.message&&i.message.includes('KONFIRMASI BAYAR'));
  const cards=list.map(v=>`<div class="card" style="display:flex;gap:14px;align-items:center;border-left:5px solid var(--accent);"><img src="${v.buktiFoto}" style="width:76px;height:76px;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="window.open(this.src)"><div style="flex:1;"><b style="color:var(--primary)">${esc(v.sender)}</b><br><small>${esc(v.message)}</small><br><small style="color:#888">${new Date(v.date).toLocaleString('id-ID')}</small></div><button class="btn btn-success btn-sm" onclick="terimaBayarNasabah('${v.id}')"><i class="fas fa-check"></i> TERIMA</button></div>`).join('');
  b.innerHTML=cards||'<div class="card" style="text-align:center;color:#999;"><i class="fas fa-check-circle fa-2x"></i><br>Tidak ada pengajuan pembayaran.</div>';
}
function pageTerimaProfitManager(b, t){
  t.innerText='Terima Dana SHU';
  const rows=DB.profitFlow.filter(p=>p.status==='Pending Manager'&&p.targetUnit===activeApp).map(p=>`<tr><td>${rp(p.amount)}</td><td><button class="btn btn-primary btn-sm" onclick="acceptProfitManager('${p.id}')">Terima</button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Dana Masuk</h4><div class="table-responsive"><table><thead><tr><th>Nominal</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="2">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageApprovalUnit(b, t){
  t.innerText='Approval Pengajuan Unit';
  const rows=DB.nasabah.filter(x=>x.status==='Pending').map(x=>{
    const match=(x.unit===activeApp)||(activeApp==='induk');
    return `<tr style="${match?'':'background:#fff5f5'}"><td>${x.unit.toUpperCase()}</td><td>${esc(x.nama)}</td><td>${rp(x.plafond)}</td><td>${esc(x.inputBy||'-')}</td><td style="display:flex;gap:5px;flex-wrap:wrap;"><button class="btn btn-sm" style="background:#6f42c1;color:#fff;" onclick="runAIScore('${x.id}')"><i class="fas fa-robot"></i></button><button class="btn btn-success btn-sm" onclick="approve('${x.id}')">ACC</button><button class="btn btn-danger btn-sm" onclick="reject('${x.id}')">Tolak</button></td></tr>`;
  }).join('');
  b.innerHTML=`<div class="card"><h4>Pengajuan Masuk</h4><div class="table-responsive"><table><thead><tr><th>Unit</th><th>Nama</th><th>Plafond</th><th>Marketing</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="5" style="text-align:center;">Tidak ada pengajuan baru.</td></tr>'}</tbody></table></div></div>`;
}
function pageTunggakan(b, t){
  t.innerText='Monitoring Tunggakan';
  const rows=DB.nasabah.filter(x=>x.unit===activeApp&&x.status==='Approved'&&x.payStatus!=='Lunas').map(x=>`<tr><td>${esc(x.nama)}</td><td>${esc(x.inputBy||'-')}</td><td>${getStatusPeriode(x)}</td><td><button class="btn btn-danger btn-sm" onclick="waMarketing('${esc(x.inputBy)}','${esc(x.nama)}')"><i class="fab fa-whatsapp"></i> Tegur</button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Status Pembayaran</h4><div class="table-responsive"><table><thead><tr><th>Nama</th><th>Marketing</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Semua aman.</td></tr>'}</tbody></table></div></div>`;
}
function pageLaporanDetail(b, t){
  t.innerText='Arsip Nasabah';
  const act=DB.nasabah.filter(x=>x.unit===activeApp&&x.status==='Approved'&&x.payStatus!=='Lunas');
  const lun=DB.nasabah.filter(x=>x.unit===activeApp&&x.payStatus==='Lunas');
  const ra=act.map(x=>`<tr><td>${esc(x.nama)}</td><td>${rp(x.plafond)}</td><td><span class="badge" style="background:#f8d7da;color:#721c24;">Berjalan</span></td></tr>`).join('');
  const rl=lun.map(x=>`<tr><td>${esc(x.nama)}</td><td>${rp(x.plafond)}</td><td><button class="btn btn-danger btn-sm" onclick="deleteLunas('${x.id}')"><i class="fas fa-trash"></i> Hapus</button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Nasabah Berjalan</h4><div class="table-responsive"><table><thead><tr><th>Nama</th><th>Plafond</th><th>Status</th></tr></thead><tbody>${ra||'<tr><td colspan="3">Kosong</td></tr>'}</tbody></table></div></div><div class="card"><div style="display:flex;justify-content:space-between;"><h4>Arsip Lunas</h4><button class="btn btn-success btn-sm" onclick="printArsipLunas()"><i class="fas fa-file-pdf"></i> PDF</button></div><div class="table-responsive"><table><thead><tr><th>Nama</th><th>Plafond</th><th>Aksi</th></tr></thead><tbody>${rl||'<tr><td colspan="3">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageSettingMargin(b, t){
  t.innerText='Setting Margin';
  b.innerHTML=`${['sps','kms','gadai'].map(u=>`<div class="card"><h4>${u.toUpperCase()}</h4><label>Bunga Bulanan (%)</label><input id="set-${u}-mo" type="number" class="form-control" value="${settings.margins[u]||0}"><label>Bunga Mingguan (%)</label><input id="set-${u}-wk" type="number" class="form-control" value="${settings.margins_weekly[u]||0}"></div>`).join('')}<button class="btn btn-primary" style="width:100%;padding:14px;font-weight:700;" onclick="saveRealMargins()"><i class="fas fa-save"></i> SIMPAN</button>`;
}
function saveRealMargins(){
  ['sps','kms','gadai'].forEach(u=>{ settings.margins[u]=+document.getElementById('set-'+u+'-mo').value||0; settings.margins_weekly[u]=+document.getElementById('set-'+u+'-wk').value||0; });
  queueCommit(); alert('Margin tersimpan!');
}
function pageMonitoringKinerja(b, t){
  t.innerText='Monitoring Kinerja Marketing';
  const stats={};
  DB.nasabah.filter(n=>n.unit===activeApp).forEach(n=>{ if(!stats[n.inputBy]) stats[n.inputBy]={t:0,a:0,n:0}; stats[n.inputBy].t++; if(n.status==='Approved'){ stats[n.inputBy].a++; stats[n.inputBy].n+=parseInt(n.plafond); } });
  const rows=Object.keys(stats).map(m=>`<tr><td>${esc(m)}</td><td>${stats[m].t}</td><td>${stats[m].a}</td><td style="color:green;font-weight:700;">${rp(stats[m].n)}</td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Performa Marketing</h4><div class="table-responsive"><table><thead><tr><th>Marketing</th><th>Total</th><th>Lolos</th><th>Pencairan</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageLabaUnit(b, t){
  t.innerText='Laporan Laba Unit '+activeApp.toUpperCase();
  const mp=settings.margins[activeApp]||0;
  let tp=0,pl=0,lc=0;
  const rows=DB.nasabah.filter(x=>x.unit===activeApp&&x.status==='Approved').map((n,i)=>{ const p=parseInt(n.plafond),pr=p*(mp/100); tp+=p; pl+=pr; const st=n.payStatus==='Lunas'?(lc+=pr,'<span class="badge" style="background:#d4edda;color:green">Lunas</span>'):'<span class="badge" style="background:#fff3cd;color:#856404">Berjalan</span>'; return `<tr><td>${i+1}</td><td>${esc(n.nama)}</td><td>${rp(p)}</td><td style="color:green">${rp(pr)}</td><td>${st}</td></tr>`; }).join('');
  b.innerHTML=`<div class="card"><h4>Margin ${mp}%</h4><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;"><div class="card" style="background:var(--primary);color:#fff;"><small>Plafond</small><h3>${rp(tp)}</h3></div><div class="card" style="border:1px solid orange;"><small>Potensi Laba</small><h3 style="color:orange">${rp(pl)}</h3></div><div class="card" style="background:#e8f5e9;"><small>Terealisasi</small><h3 style="color:green">${rp(lc)}</h3></div></div><div class="table-responsive"><table><thead><tr><th>#</th><th>Nama</th><th>Plafond</th><th>Laba</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function pageReqSarpras(b, t){ t.innerText='Ajukan Sarpras'; b.innerHTML=`<div class="card"><input id="sp-i" class="form-control" placeholder="Nama Barang"><input id="sp-a" class="form-control" placeholder="Alasan"><button class="btn btn-primary" onclick="sendSarpras()">Kirim</button></div>`; }
function pageInputNasabah(b, t){
  if(activeUser.isEligible===false){ b.innerHTML=`<div class="card" style="border-left:5px solid red"><h4>Akses Ditangguhkan</h4><p>Hubungi Sekretaris/Manager.</p></div>`; return; }
  t.innerText='Input Nasabah';
  const tenorOpt=activeApp==='sps'?`<select id="i-tenor-type" class="form-control"><option value="Bulan">Bulanan</option><option value="Minggu">Mingguan</option></select>`:`<input type="hidden" id="i-tenor-type" value="Bulan"><input class="form-control" value="Bulanan" readonly>`;
  const ex=activeApp==='kms'?`<input id="i-dp" class="form-control" placeholder="DP (Rp)">`:(activeApp==='gadai'?`<input id="i-jam" class="form-control" placeholder="Barang Jaminan">`:'');
  b.innerHTML=`<div class="card" style="max-width:640px;"><label>Data Diri</label><input id="i-nm" class="form-control" placeholder="Nama Lengkap"><select id="i-jk" class="form-control"><option value="L">Laki-laki</option><option value="P">Perempuan</option></select><input id="i-nik" class="form-control" placeholder="NIK"><input id="i-al" class="form-control" placeholder="Alamat"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><input id="i-wa" class="form-control" placeholder="No. WA"><input id="i-em" class="form-control" placeholder="Email"></div><label>Pengajuan</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><input id="i-pl" class="form-control" placeholder="Plafond"><input id="i-tn" class="form-control" placeholder="Tenor"></div><label>Tipe Tenor</label>${tenorOpt}${ex}<label>Foto KTP</label><div class="ktp-frame"><input type="file" accept="image/*" onchange="readKTPPhoto(this)"></div><label>Foto Wajah</label><input type="file" class="form-control" accept="image/*" onchange="readFoto(this)"><button class="btn btn-primary" onclick="subNas()"><i class="fas fa-save"></i> Simpan</button></div>`;
}
function pageInputTabungan(b, t){
  t.innerText='Input Tabungan';
  const rows=DB.tabungan.map(t=>`<tr><td>${esc(t.nama)}</td><td>${rp(t.saldo)}</td><td><button class="btn btn-primary btn-sm" onclick="printBukuTabungan('${t.id}')">PDF Buku</button></td></tr>`).join('');
  b.innerHTML=`<div class="card" style="max-width:600px;"><h4>Buka Rekening</h4><input id="t-nm" class="form-control" placeholder="Nama"><input id="t-setoran" type="number" class="form-control" placeholder="Setoran Awal"><label>Periode</label><select id="t-tenor-type" class="form-control"><option value="Harian">Harian</option><option value="Minggu">Mingguan</option><option value="Bulan">Bulanan</option></select><input id="t-tenor" class="form-control" placeholder="Lama menabung"><label style="color:green;font-weight:700;">Biaya Admin</label><input id="t-adm" type="number" class="form-control" value="5000"><button class="btn btn-success" onclick="saveTabungan()">Buka Rekening</button></div><div class="card"><h4>Daftar Rekening</h4><div class="table-responsive"><table><thead><tr><th>Nama</th><th>Saldo</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="3">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageBilling(b, t){
  t.innerText='Tagihan & Pembayaran';
  const myC=DB.nasabah.filter(x=>x.unit===activeApp&&x.status==='Approved'&&(activeUser.role==='MARKETING'?x.inputBy===activeUser.user:true));
  const rows=myC.map(x=>{ const p=parseInt(x.plafond),tn=parseInt(x.tenor)||1,mp=(settings.margins[activeApp]||0),tot=p+p*(mp/100),ang=Math.round(tot/tn); return `<tr><td><b>${esc(x.nama)}</b><br><small>${esc(x.wa)}</small></td><td>${getStatusPeriode(x)}</td><td>${rp(ang)}</td><td><div style="display:flex;gap:4px;flex-wrap:wrap;"><button class="btn btn-warning btn-sm" onclick="kirimWA('${x.id}',${ang})"><i class="fab fa-whatsapp"></i></button><button class="btn btn-success btn-sm" onclick="bayar('${x.id}',${ang})">Bayar</button><button class="btn btn-sm" style="background:#6f42c1;color:#fff;" onclick="prosesPelunasan('${x.id}')">Lunas</button></div></td></tr>`; }).join('');
  b.innerHTML=`<div class="card"><h4>Daftar Tagihan</h4><div class="table-responsive"><table><thead><tr><th>Nasabah</th><th>Status</th><th>Angsuran</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageDompetMarketing(b, t){
  t.innerText='Dompet Insentif';
  const my=DB.aruskas.filter(x=>x.type==='Insentif'&&x.recipient===activeUser.user);
  const total=my.reduce((a,b)=>a+parseInt(b.amount),0);
  const rows=my.map(x=>`<tr><td>${tgl(x.date)}</td><td>${esc(x.desc)}</td><td style="color:green;font-weight:700;">+ ${rp(x.amount)}</td></tr>`).join('');
  b.innerHTML=`<div class="card" style="background:linear-gradient(135deg,#11998e,#38ef7d);color:#fff;"><small>Total Bonus</small><h1>${rp(total)}</h1></div><div class="card"><div class="table-responsive"><table><thead><tr><th>Tgl</th><th>Ket</th><th>Nom</th></tr></thead><tbody>${rows||'<tr><td colspan="3">Belum ada</td></tr>'}</tbody></table></div></div>`;
}
function pageCetakAkad(b, t){
  t.innerText='Cetak Akad';
  const rows=DB.nasabah.filter(x=>x.unit===activeApp&&x.status==='Approved').map(x=>`<tr><td><b>${esc(x.nama)}</b><br><small>${esc(x.noSurat)}</small></td><td>${rp(x.plafond)}</td><td>${tgl(x.createdAt||x.id)}</td><td><button class="btn btn-primary btn-sm" onclick="printAkad('${x.id}')"><i class="fas fa-print"></i> PDF</button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Siap Cetak (${activeApp.toUpperCase()})</h4><div class="table-responsive"><table><thead><tr><th>Nama</th><th>Plafond</th><th>Tgl</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageChatSekretaris(b, t){ t.innerText='Live Chat Tamu'; b.innerHTML=`<div class="card" style="height:70vh;display:flex;flex-direction:column;"><div id="sek-chat-body" style="flex:1;overflow-y:auto;background:#f9f9f9;padding:14px;border-radius:8px;margin-bottom:12px;"></div><div style="display:flex;gap:8px;"><input id="sek-chat-input" class="form-control" placeholder="Balas tamu..." style="margin:0;"><button class="btn btn-primary" onclick="sendChat('Sekretaris')">Kirim</button></div></div>`; renderChatSekretaris(); }
function pageSurat(b, t){
  t.innerText='Surat Menyurat';
  const rows=DB.surat.map(s=>`<tr><td>${esc(s.no)}</td><td>${esc(s.tujuan)}</td><td><button class="btn btn-primary btn-sm" onclick="printSurat('${s.id}')"><i class="fas fa-print"></i></button> <button class="btn btn-danger btn-sm" onclick="deleteRecord('surat','${s.id}',{backTo:'surat_induk'})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Buat Surat</h4><input id="s-tuj" class="form-control" placeholder="Tujuan"><input id="s-per" class="form-control" placeholder="Perihal"><textarea id="s-isi" class="form-control" placeholder="Isi surat..."></textarea><div style="display:flex;gap:10px;"><button class="btn btn-success" onclick="saveSurat('Keluar')">Surat Keluar</button><button class="btn btn-warning" onclick="saveSurat('Masuk')">Log Masuk</button></div></div><div class="card"><h4>Arsip</h4><div class="table-responsive"><table><thead><tr><th>No</th><th>Tujuan</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="3">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageSarprasApproval(b, t){
  t.innerText='Approval Sarpras';
  const rows=DB.sarpras.map(s=>`<tr><td>${s.unit.toUpperCase()}</td><td>${esc(s.item)}</td><td>${esc(s.alasan)}</td><td><span class="badge" style="background:${s.status==='Pending'?'#fff3cd':'#d4edda'};">${s.status}</span></td><td>${s.status==='Pending'?`<button class="btn btn-success btn-sm" onclick="accSarpras('${s.id}')">ACC</button>`:''} <button class="btn btn-danger btn-sm" onclick="deleteRecord('sarpras','${s.id}',{backTo:'sarpras_approval'})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><div class="table-responsive"><table><thead><tr><th>Unit</th><th>Item</th><th>Alasan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Kosong</td></tr>'}</tbody></table></div></div>`;
}
function pageLaporanPusat(b, t){
  t.innerText='Pusat Laporan';
  b.innerHTML=`<div class="card"><div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="btn btn-success" onclick="printLaporanSarpras()"><i class="fas fa-file-pdf"></i> Sarpras</button><button class="btn btn-primary" onclick="printDatabaseNasabah()"><i class="fas fa-file-pdf"></i> Database Nasabah</button><button class="btn btn-warning" onclick="printLaporanKas('induk')"><i class="fas fa-file-pdf"></i> Kas Pusat</button></div></div>`;
}
function pageMonitoringPegawai(b, t){
  t.innerText='Monitoring Pegawai';
  const logs=DB.presensi.map(p=>`<tr><td>${new Date(p.time).toLocaleString('id-ID')}</td><td>${esc(p.user)}</td><td>${esc(p.type)}</td></tr>`).join('');
  const users=DB.users.filter(u=>['manager','marketing','accounting','sekretaris','bendahara'].includes(u.role.toLowerCase())).map(u=>`<tr><td>${esc(u.user)}</td><td>${esc(u.role)}</td><td><button class="btn btn-primary btn-sm" onclick="printIDCardUser('${u.id}')"><i class="fas fa-id-badge"></i> ID Card</button></td></tr>`).join('');
  b.innerHTML=`<div class="card"><h4>Presensi</h4><button class="btn btn-success btn-sm" onclick="printLaporanPresensi()">Cetak PDF</button><div class="table-responsive"><table><thead><tr><th>Waktu</th><th>User</th><th>Status</th></tr></thead><tbody>${logs||'<tr><td colspan="3">Kosong</td></tr>'}</tbody></table></div></div><div class="card"><h4>Cetak ID Pegawai</h4><div class="table-responsive"><table><thead><tr><th>Nama</th><th>Jabatan</th><th>Aksi</th></tr></thead><tbody>${users}</tbody></table></div></div>`;
}
function pageAjukanPinjaman(b, t){
  t.innerText='Ajukan Pinjaman';
  b.innerHTML=`<div class="card"><input id="ang-amt" type="number" class="form-control" placeholder="Nominal"><div style="display:flex;gap:10px;"><input id="ang-ten" type="number" class="form-control" placeholder="Tenor"><select id="ang-type" class="form-control"><option>Bulan</option><option>Minggu</option></select></div><textarea class="form-control" placeholder="Keperluan"></textarea><button class="btn btn-primary" onclick="DB.nasabah.push({id:uid(),unit:'sps',nama:activeUser.user,plafond:document.getElementById('ang-amt').value,tenor:document.getElementById('ang-ten').value,tenorType:document.getElementById('ang-type').value,status:'Pending',payStatus:'Belum',inputBy:'Self-Service',noSurat:'-',createdAt:Date.now(),nextDueDate:Date.now()+30*86400000});queueCommit();alert('Terkirim ke Manager');page('home');">Kirim</button></div>`;
}
function pageDashboardNasabah(b, t){
  t.innerText='Dashboard Nasabah';
  const my=DB.nasabah.filter(n=>n.nama.replace(/\s/g,'').toLowerCase()===activeUser.user.toLowerCase()&&n.status==='Approved');
  if(!my.length){ b.innerHTML='<div class="card">Anda belum memiliki pembiayaan aktif.</div>'; return; }
  b.innerHTML=my.map(d=>{
    const mp=settings.margins[d.unit]||0;
    const total=parseInt(d.plafond)+parseInt(d.plafond)*mp/100;
    const ang=total/parseInt(d.tenor||1);
    const pay=DB.aruskas.filter(k=>k.desc&&k.desc.includes(d.nama)&&k.type==='Masuk').reduce((a,b)=>a+parseInt(b.amount),0);
    const sisa=total-pay;
    return `<div class="card" style="background:var(--primary-gradient);color:#fff;"><small>Sisa Hutang (${d.unit.toUpperCase()})</small><h1>${rp(sisa)}</h1><small>Angsuran: ${rp(Math.round(ang))} • ${d.tenorType}</small></div><div class="card"><h4>Bayar</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><button class="btn btn-primary" onclick="bukaFormBayar('${d.id}',${Math.round(ang)},'Angsuran')">Bayar Angsuran</button><button class="btn btn-success" onclick="bukaFormBayar('${d.id}',${Math.round(sisa)},'Pelunasan')">Pelunasan</button></div></div><div id="form-bayar-nasabah" class="card hidden" style="border:2px dashed var(--accent);"><h4 id="judul-bayar">Upload Bukti</h4><input type="number" id="nom-bayar-nasabah" class="form-control" readonly><input type="file" class="form-control" accept="image/*" onchange="previewBukti(this)"><div id="preview-container"></div><button class="btn btn-warning" onclick="kirimBuktiKeAccounting()">Kirim Bukti</button></div>`;
  }).join('');
}

function pageIDCardMaker(b, t){
  t.innerText='Pembuat Kartu Pegawai';
  const opts=DB.users.map(u=>`<option value="${u.id}">${esc(u.user)} — ${esc(u.role)}</option>`).join('');
  b.innerHTML=`<div class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;"><div><h4>Editor</h4><label>Pilih Pegawai</label><select class="form-control" onchange="autoFillIDCard(this.value)"><option value="">-- Pilih --</option>${opts}</select><label>Nama</label><input id="idc-name" class="form-control" onkeyup="updateIDPreview()"><label>Jabatan</label><input id="idc-role" class="form-control" onkeyup="updateIDPreview()"><label>NIP</label><input id="idc-nip" class="form-control" onkeyup="updateIDPreview()"><label>Foto</label><input type="file" class="form-control" accept="image/*" onchange="updateIDPhoto(this)"><label>Background (opsional)</label><input type="file" class="form-control" accept="image/*" onchange="updateIDBg(this)"><button class="btn btn-primary" style="width:100%;margin-top:10px;" onclick="printIDCardPreview()"><i class="fas fa-print"></i> CETAK PDF</button></div><div><h4>Preview Kartu (CR80)</h4><div class="idcard-sheet" id="idc-sheet">${idCardHTML('NAMA PEGAWAI','JABATAN','000000',DEFAULT_LOGO)}</div></div></div></div>`;
}
function idCardHTML(nm, role, nip, photo, bg){
  const logo = getLogo();
  const bgStyle = (bg&&bg.length>20) ? `background-image:url('${bg}');background-size:cover;background-position:center;` : '';
  return `<div class="id-card" style="${bgStyle}">
    <div class="id-head"><img src="${logo}"><div><b>${esc(settings.nama)}</b><small>${esc(settings.alamat||'')}</small></div></div>
    <div class="id-bodyc"><div class="id-photoc"><img src="${photo||DEFAULT_LOGO}"></div><div class="id-infoc"><div class="rl">${esc(role||'')}</div><div class="nm">${esc(nm||'')}</div>NIP: ${esc(nip||'-')}<br>Berlaku: s/d ${new Date().getFullYear()+2}</div></div>
    <div class="id-foot">KARTU IDENTITAS PEGAWAI • ${esc(settings.nama)}</div>
  </div>
  <div class="id-card back"><img src="${logo}" style="width:44px;height:44px;margin-bottom:8px;"><b style="font-size:.72rem;">${esc(settings.nama)}</b><br><small style="font-size:.55rem;">Apabila kartu ini ditemukan, mohon dikembalikan ke:</small><br><span style="font-size:.6rem;">${esc(settings.alamat)}<br>WA: ${esc(settings.wa)}</span></div>`;
}
function autoFillIDCard(id){
  const u = DB.users.find(x=>String(x.id)===String(id)); if(!u) return;
  document.getElementById('idc-name').value=u.namaLengkap||u.user;
  document.getElementById('idc-role').value=u.role.toUpperCase();
  document.getElementById('idc-nip').value=(u.id||'').slice(0,8).toUpperCase();
  idCardPhoto = u.photo||DEFAULT_LOGO;
  updateIDPreview();
}
function updateIDPreview(){ document.getElementById('idc-sheet').innerHTML = idCardHTML(document.getElementById('idc-name').value, document.getElementById('idc-role').value, document.getElementById('idc-nip').value, idCardPhoto, idCardBg); }
function updateIDPhoto(inp){ if(inp.files[0]) resizeImage(inp.files[0], r=>{ idCardPhoto=r; updateIDPreview(); },300); }
function updateIDBg(inp){ if(inp.files[0]) resizeImage(inp.files[0], r=>{ idCardBg=r; updateIDPreview(); },400); }
function printIDCardPreview(){
  const area=document.getElementById('printable-area');
  area.innerHTML = `<div class="paper" style="padding:24px;">${document.getElementById('idc-sheet').outerHTML}</div>`;
  area.style.display='block';
  generatePDF('printable-area','ID_Card_'+(document.getElementById('idc-name').value||'user'));
}
function printIDCardUser(id){
  const u=DB.users.find(x=>String(x.id)===String(id)); if(!u) return;
  const html = idCardHTML(u.namaLengkap||u.user, u.role.toUpperCase(), u.id.slice(0,8).toUpperCase(), u.photo||DEFAULT_LOGO);
  document.getElementById('printable-area').innerHTML = `<div class="paper" style="padding:24px;"><div class="idcard-sheet">${html}</div></div>`;
  generatePDF('printable-area','ID_Card_'+u.user);
}

function printLaporanKas(unit){
  const list=DB.aruskas.filter(x=>x.unit===unit);
  const rows=list.map(x=>`<tr><td>${tgl(x.date)}</td><td>${x.type}</td><td>${esc(x.desc)}</td><td>${rp(x.amount)}</td></tr>`).join('');
  document.getElementById('printable-area').innerHTML = `<div class="paper"><div class="bank-header"><img src="${getLogo()}" class="bank-logo"><div class="bank-info"><h1>${esc(settings.nama)}</h1><p>${esc(settings.alamat)}<br>${unit==='induk'?'LAPORAN KAS PUSAT':'LAPORAN KAS UNIT '+unit.toUpperCase()}</p></div></div><table class="fin-table"><thead><tr><th>Tgl</th><th>Tipe</th><th>Keterangan</th><th>Nominal</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Kosong</td></tr>'}</tbody></table><br><div style="display:flex;justify-content:space-between;margin-top:36px;"><div style="text-align:center;">Mengetahui,<br>Pimpinan<br><br><br>(________________)</div><div style="text-align:center;">Dibuat oleh,<br>${esc(activeUser.role)}<br><br><br>(${esc(activeUser.user)})</div></div><div class="doc-footer">Dicetak dari ${esc(settings.nama)} • ${new Date().toLocaleString('id-ID')}</div></div>`;
  generatePDF('printable-area','Laporan_Kas_'+unit);
}
function printLaporanSarpras(){
  const rows=DB.sarpras.map((s,i)=>`<tr><td>${i+1}</td><td>${s.unit.toUpperCase()}</td><td>${esc(s.item)}</td><td>${esc(s.alasan)}</td><td>${s.status}</td></tr>`).join('');
  document.getElementById('printable-area').innerHTML = `<div class="paper"><div class="bank-header"><img src="${getLogo()}" class="bank-logo"><div class="bank-info"><h1>${esc(settings.nama)}</h1><p>LAPORAN SARPRAS</p></div></div><table class="fin-table"><thead><tr><th>#</th><th>Unit</th><th>Barang</th><th>Alasan</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  generatePDF('printable-area','Laporan_Sarpras');
}
function printLaporanPresensi(){
  const rows=DB.presensi.map(p=>`<tr><td>${new Date(p.time).toLocaleString('id-ID')}</td><td>${esc(p.user)}</td><td>${esc(p.type)}</td></tr>`).join('');
  document.getElementById('printable-area').innerHTML = `<div class="paper"><div class="bank-header"><img src="${getLogo()}" class="bank-logo"><div class="bank-info"><h1>${esc(settings.nama)}</h1><p>LAPORAN PRESENSI</p></div></div><table class="fin-table"><thead><tr><th>Waktu</th><th>Nama</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  generatePDF('printable-area','Laporan_Presensi');
}
function printDatabaseNasabah(){
  const rows=DB.nasabah.map((d,i)=>`<tr><td>${i+1}</td><td>${d.unit.toUpperCase()}</td><td>${esc(d.nama)}</td><td>${esc(d.nik)}</td><td>${esc(d.wa)}</td><td>${rp(d.plafond)}</td></tr>`).join('');
  document.getElementById('printable-area').innerHTML = `<div class="paper"><div class="bank-header"><img src="${getLogo()}" class="bank-logo"><div class="bank-info"><h1>${esc(settings.nama)}</h1><p>DATABASE NASABAH</p></div></div><table class="fin-table"><thead><tr><th>#</th><th>Unit</th><th>Nama</th><th>NIK</th><th>WA</th><th>Plafond</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  generatePDF('printable-area','Database_Nasabah');
}
function printSurat(id){
  const s = DB.surat.find(x=>String(x.id)===String(id)); if(!s) return;
  document.getElementById('printable-area').innerHTML = `<div class="paper"><div class="bank-header"><img src="${getLogo()}" class="bank-logo"><div class="bank-info"><h1>${esc(settings.nama)}</h1><p>${esc(settings.alamat)}<br>Izin: ${esc(settings.izin)} • Email: ${esc(settings.email)}</p></div></div><div style="text-align:right;">${new Date(s.date).toLocaleDateString('id-ID')}</div><p>Nomor: ${esc(s.no)}</p><p>Kepada Yth,<br><b>${esc(s.tujuan)}</b></p><br><div style="text-align:justify;">${esc(s.isi).replace(/\n/g,'<br>')}</div><br><br><div style="text-align:right;margin-top:60px;">Hormat Kami,<br><br><br><b>${esc(activeUser.user)}</b><br>${esc(activeUser.role)}</div></div>`;
  generatePDF('printable-area','Surat_'+s.no.replace(/[\/\s]/g,'_'));
}
function printArsipLunas(){
  const list = DB.nasabah.filter(x=>x.unit===activeApp&&x.payStatus==='Lunas');
  const rows = list.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.nama)}</td><td>${x.unit.toUpperCase()}</td><td>${rp(x.plafond)}</td></tr>`).join('');
  document.getElementById('printable-area').innerHTML = `<div class="paper"><div class="bank-header"><img src="${getLogo()}" class="bank-logo"><div class="bank-info"><h1>${esc(settings.nama)}</h1><p>ARSIP NASABAH LUNAS</p></div></div><table class="fin-table"><thead><tr><th>#</th><th>Nama</th><th>Unit</th><th>Plafond</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  generatePDF('printable-area','Arsip_Lunas');
}
function printBukuTabungan(id){
  const d = DB.tabungan.find(x=>String(x.id)===String(id)); if(!d) return;
  document.getElementById('printable-area').innerHTML = `<div class="paper"><div class="bank-header"><img src="${getLogo()}" class="bank-logo"><div class="bank-info"><h1>${esc(settings.nama)}</h1><p>BUKU TABUNGAN</p></div></div><table class="fin-table"><tr><td>No. Rekening</td><td>${d.id}</td></tr><tr><td>Nama</td><td>${esc(d.nama.toUpperCase())}</td></tr><tr><td>Tgl Buka</td><td>${tgl(d.date)}</td></tr></table><table class="fin-table"><thead><tr><th>Tgl</th><th>Keterangan</th><th>Debet</th><th>Kredit</th><th>Saldo</th></tr></thead><tbody><tr><td>${tgl(d.date)}</td><td>Setoran Awal</td><td>-</td><td>${rp(d.setoranAwal)}</td><td>${rp(d.saldo)}</td></tr></tbody></table></div>`;
  generatePDF('printable-area','Tabungan_'+d.nama);
}
function printAkad(id){
  const d=DB.nasabah.find(x=>String(x.id)===String(id)); if(!d) return;
  const uName=d.unit==='sps'?'MUDHARABAH':(d.unit==='kms'?'MURABAHAH':'RAHN');
  const tpl=settings.templates[d.unit]||'';
  const mp=settings.margins[d.unit]||0;
  const margin=parseInt(d.plafond)*(mp/100);
  const total=parseInt(d.plafond)+margin;
  const ang=Math.round(total/(parseInt(d.tenor)||1));
  const tglN=new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const photo=(d.foto&&d.foto.length>50)?d.foto:DEFAULT_LOGO;
  document.getElementById('printable-area').innerHTML = `<div class="paper" id="akad-print" style="width:750px;">
    <div class="bank-header"><img src="${getLogo()}" class="bank-logo"><div class="bank-info"><h1>${esc(settings.nama)}</h1><p>${esc(settings.alamat)} • Izin: ${esc(settings.izin)}</p></div></div>
    <div style="text-align:center;"><b style="font-size:14pt;text-decoration:underline;">PERJANJIAN PEMBIAYAAN ${uName}</b><br>Nomor: ${esc(d.noSurat)}</div>
    <p style="margin-top:14px;">Pada hari ini <b>${tglN}</b>, telah disepakati perjanjian antara:</p>
    <table class="fin-table"><tr><td style="width:110px;" rowspan="4" align="center"><img src="${photo}" style="width:3cm;height:4cm;object-fit:cover;border:1px solid #333;"><br><small>PIHAK PERTAMA</small></td><td width="130">Nama</td><td>: <b>${esc(d.nama.toUpperCase())}</b></td></tr><tr><td>NIK</td><td>: ${esc(d.nik)}</td></tr><tr><td>Alamat</td><td>: ${esc(d.alamat)}</td></tr><tr><td>No. HP/WA</td><td>: ${esc(d.wa)}</td></tr></table>
    <p>Serta Manager Unit mewakili <b>${esc(settings.nama)}</b> selaku <b>PIHAK KEDUA</b>.</p>
    <table class="fin-table" style="text-align:center;"><tr style="background:#eee;"><th>PLAFOND</th><th>TENOR</th><th>MARGIN</th><th>ANGSURAN</th></tr><tr><td>${rp(d.plafond)}</td><td>${d.tenor} ${d.tenorType}</td><td>${rp(margin)}</td><td><b>${rp(ang)}</b></td></tr></table>
    <div style="border:1px solid #000;padding:12px;font-size:11pt;text-align:justify;">
      <b>KETENTUAN AKAD:</b><br>${esc(tpl).replace(/\n/g,'<br>')}<br>1. Nasabah wajib membayar angsuran tepat waktu.<br>2. Perselisihan diselesaikan secara musyawarah.
    </div>
    <table style="width:100%;text-align:center;margin-top:40px;font-size:11pt;"><tr><td>PIHAK PERTAMA<br><div style="border:1px dashed #bbb;width:60px;height:60px;margin:8px auto;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#aaa;">METERAI</div><u><b>${esc(d.nama.toUpperCase())}</b></u></td><td>SAKSI<br><br><br><br><br><u>${esc(d.inputBy||'..............')}</u></td><td>PIHAK KEDUA<br><br><br><br><br><u>Manager Unit</u></td></tr></table>
    <div class="doc-footer">Dicetak: ${new Date().toLocaleString('id-ID')}</div></div>`;
  generatePDF('printable-area','Akad_'+d.nama.replace(/\s/g,'_'));
}

async function boot(){
  document.getElementById('app').style.display='none';
  document.getElementById('gateway').style.display='flex';
  updateNetUI();
  registerSW();
  updateDynamicManifest();
  const _bp = document.getElementById('btn-install-pwa'); if(_bp) _bp.classList.add('show');
  loadSession();

  await idbOpen();
  const local = await idbGet('state');
  if(local){
    try{
      const parsed = JSON.parse(local);
      settings = Object.assign({}, DEFAULT_SETTINGS, parsed.settings||{});
      if(!settings.role_permissions) settings.role_permissions = JSON.parse(JSON.stringify(DEFAULT_ACCESS));
      STORES.forEach(s => DB[s] = Array.isArray(parsed.DB[s]) ? parsed.DB[s] : []);
    }catch(e){}
  }

  await pullFromCloud();
  if(DB.users.length === 0){ bootstrapFirstData(); queueCommit(); }

  renderIdentitas(); startSlider();
  if(activeUser){
    document.getElementById('gateway').style.display='none';
    document.getElementById('app').style.display='flex';
    renderMenu(); renderMobileNav();
    const lp = localStorage.getItem('bmt_last_page');
    page(lp || 'home');
  }

  startAutoSync();
  setInterval(()=>{ if(!activeUser) renderChat(); else{ const cb=document.getElementById('sek-chat-body'); if(cb && cb.offsetParent!==null) renderChatSekretaris(); } }, 5000);
}
document.addEventListener('DOMContentLoaded', boot);
