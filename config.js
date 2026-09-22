/* =====================================================================
 *  BMT INTEGRATED SYSTEM - FILE KONFIGURASI (config.js)
 *  -------------------------------------------------------------------
 *  CUKUP EDIT FILE INI SAJA sebelum hosting.
 *  Semua kredensial database & pengaturan awal ada di sini.
 *  Setelah aplikasi jalan, nama BMT / alamat / logo / wallpaper /
 *  password / kode pemulihan SEMUANYA diubah dari DALAM APLIKASI
 *  (menu Pengaturan), tersimpan di database - bukan di kode.
 * ===================================================================== */
const APP_CONFIG = {

  /* --- 1. KONEKSI DATABASE FIREBASE (Realtime Database) -------------
   * Buat project di https://console.firebase.google.com
   * Project Settings > Your Apps > Web App > copy config ke sini.
   * Struktur ini juga kompatibel jika nanti migrasi (tinggal ganti
   * blok ini & sesuaikan adapter di app.js bagian "DB ADAPTER").     */
  firebase: {
    apiKey:            "AIzaSyBRUW85urB6uuAyslzX12mIcRpVlu4g9sA",
    authDomain:        "bmt-system.firebaseapp.com",
    databaseURL:       "https://bmt-system-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "bmt-system",
    storageBucket:     "bmt-system.firebasestorage.app",
    messagingSenderId: "623210817818",
    appId:             "1:623210817818:web:63e94ba9ba69a0a98c64a3"
  },

  /* --- 2. IDENTITAS AWAL (hanya dipakai saat database masih kosong) --
   * Setelah itu, semua diubah lewat menu "Pengaturan Instansi".       */
  seedIdentity: {
    nama:   "BMT ANDA",                 // nama default sebelum diatur
    izin:   "-",
    alamat: "-",
    wa:     "-",
    email:  "-",
    loginTitle: ""                      // kosong = ikuti nama
  },

  /* --- 3. AKUN ADMIN PERTAMA (bootstrap) -----------------------------
   * Dipakai HANYA saat database masih kosong untuk membuat akun admin
   * pertama. SEGERA ganti password-nya dari dalam aplikasi
   * (menu Profil > Ganti Password). Password yang sudah diganti
   * tersimpan di database, tidak terlihat di kode.                    */
  bootstrapAdmin: { user: "admin", password: "admin123" },

  /* --- 4. KODE PEMULIHAN LUPA PASSWORD (seed awal) --------------------
   * Kode rahasia untuk reset password di halaman login.
   * Bisa diganti dari dalam aplikasi oleh admin (Pengaturan > Keamanan).*/
  recoveryCode: "BMT-RESET-2026",

  /* --- 5. SINKRONISASI ------------------------------------------------
   * Aplikasi bekerja penuh secara OFFLINE (data tersimpan di perangkat).
   * Saat internet tersambung, data otomatis dikirim ke database setiap
   * interval berikut, dan langsung saat koneksi kembali online.        */
  syncIntervalSec: 10,

  /* --- 6. INFO PWA ---------------------------------------------------- */
  pwaName:  "BMT Integrated System",
  pwaShort: "BMT",
  version:  "5.0.0"
};
