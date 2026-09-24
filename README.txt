============================================================
  BMT INTEGRATED SYSTEM v5.0 — Offline-First PWA
============================================================
ISI PAKET:
  index.html    — halaman utama
  app.js        — logika aplikasi lengkap
  style.css     — tampilan (desktop + mobile BRIMO-style)
  sw.js         — service worker (offline mode)
  manifest.json — manifest PWA
  config.js     — SATU-SATUNYA file yang perlu Anda edit
  icons/        — icon PWA 192 & 512
  README.txt    — file ini

============================================================
LANGKAH SETUP (SEKALI SAJA):
============================================================
1. Buka file  config.js  dengan Notepad / editor teks apa saja.

2. Ganti blok "firebase" dengan konfigurasi project Firebase Anda:
     - Buka  https://console.firebase.google.com
     - Buat project baru → aktifkan Realtime Database (mode test)
     - Project Settings → Web App → salin config → tempel di sini

3. Ganti "bootstrapAdmin" (akun admin pertama) —
   password ini WAJIB Anda ubah dari dalam aplikasi setelah
   login pertama (menu Profil → Ganti Password).

4. Ganti "recoveryCode" — kode ini dipakai user untuk reset
   password sendiri di halaman login (Lupa Password).
   Kode juga bisa diubah dari menu Pengaturan → Keamanan.

5. Upload SEMUA isi folder ini ke hosting statis apa saja:
   - GitHub Pages, Netlify, Vercel, Firebase Hosting,
     Cloudflare Pages, atau bahkan XAMPP lokal.
   - Domain HARUS pakai HTTPS agar Service Worker & PWA aktif.

============================================================
LOGIN PERTAMA:
============================================================
Username : admin        (sesuai config.js)
Password : admin123
   ↳ Segera ganti dari menu "Profil Saya".

Sebagai Admin Anda punya akses PENUH: buat akun user lain
lewat menu "User & Akun", atur hak akses menu tiap jabatan
di "Hak Akses", dan atur nama/alamat/wallpaper/logo BMT
di "Pengaturan".

============================================================
FITUR OFFLINE-FIRST:
============================================================
- Aplikasi bisa dipakai TANPA internet. Data disimpan di
  IndexedDB perangkat.
- Saat online, data OTOMATIS dikirim ke Firebase setiap 10
  detik (bisa diubah di config.js).
- Data yang dihapus juga dihapus di server memakai metode
  tombstone — data BENAR-BENAR hilang di semua perangkat.
- Wallpaper / logo / password tersimpan di database, TIDAK
  di dalam kode — pengunjung yang membaca kode Anda tidak
  akan pernah bisa melihat password.

============================================================
INSTALL SEBAGAI APLIKASI (PWA):
============================================================
- Android/Chrome : tombol "INSTALL APLIKASI (PWA)" muncul
  otomatis di halaman login, atau menu ⋮ → "Tambahkan ke
  layar utama".
- iPhone Safari  : tombol Share → "Add to Home Screen".
- Desktop Chrome : ikon install di kanan address bar.

============================================================
