# Fitur Kalender Perjalanan Dinas

## Deskripsi
Fitur kalender perjalanan dinas adalah tambahan baru pada sistem HPI Workload yang menampilkan data perjalanan dinas dalam tampilan kalender interaktif. Fitur ini memungkinkan pengguna untuk melihat jadwal perjalanan dinas dengan lebih visual dan intuitif.

## Fitur Utama

### 1. Tampilan Kalender Interaktif
- Menggunakan library FullCalendar.js untuk menampilkan perjalanan dinas dalam format kalender
- Mendukung tampilan bulan dan daftar (list view)
- Navigasi antar bulan yang mudah
- Tombol "Hari Ini" untuk kembali ke tanggal saat ini

### 2. Informasi Perjalanan Dinas
- Setiap perjalanan ditampilkan sebagai event di kalender
- Menampilkan nama pegawai dan tujuan perjalanan
- Warna berbeda berdasarkan status perjalanan:
  - Hijau: Disetujui
  - Biru: Diajukan
  - Merah: Ditolak
  - Kuning: Selesai

### 3. Filter dan Pencarian
- Filter berdasarkan nama pegawai
- Filter berdasarkan status perjalanan
- Filter berdasarkan bulan
- Tombol "Terapkan Filter" untuk menerapkan filter yang dipilih

### 4. Statistik Ringkasan
- Total perjalanan
- Sedang berlangsung
- Akan datang
- Selesai

### 5. Detail Perjalanan
- Klik pada event untuk melihat detail lengkap
- Menampilkan informasi lengkap perjalanan
- Tombol edit untuk mengubah data (jika memiliki izin)

## Integrasi dengan Sistem

### API Endpoints
Fitur kalender menggunakan endpoint yang sudah ada:
- `GET /api/perjalanan-dinas/table-data` - Mengambil data perjalanan dinas
- `GET /api/perjalanan-dinas/data` - Mengambil data dropdown

### Autentikasi
Menggunakan sistem autentikasi yang sama dengan fitur lainnya:
- Token JWT disimpan di localStorage
- Verifikasi token saat halaman dimuat
- Redirect ke halaman login jika tidak terautentikasi

### Peran Pengguna
- **Admin**: Dapat melihat dan mengedit semua perjalanan dinas
- **User**: Hanya dapat melihat dan mengedit perjalanan dinas miliknya sendiri

## File yang Dibuat/Diubah

### File Baru
1. `public/kalender-perjalanan-dinas.html` - Halaman utama kalender
2. `public/js/kalender-perjalanan-dinas.js` - Logika JavaScript untuk kalender

### File yang Diubah
1. `public/perjalanan-dinas.html` - Menambahkan link ke halaman kalender
2. `public/dashboard.html` - Menambahkan link ke halaman kalender
3. `public/input.html` - Menambahkan link ke halaman kalender

## Cara Mengakses
1. Login ke sistem HPI Workload
2. Klik menu dropdown di kanan atas
3. Pilih "Kalender Perjalanan"
4. Atau langsung akses `/kalender-perjalanan-dinas.html`

## Dependensi
- Bootstrap 5.3.2
- FullCalendar.js 5.11.5
- Bootstrap Icons 1.11.1

## Kompatibilitas
- Browser modern (Chrome, Firefox, Safari, Edge)
- Responsif untuk mobile dan desktop
- Mendukung bahasa Indonesia

## Troubleshooting

### Masalah Umum
1. **Kalender tidak muncul**: Pastikan FullCalendar.js berhasil dimuat
2. **Data tidak muncul**: Periksa koneksi API dan token autentikasi
3. **Filter tidak berfungsi**: Pastikan data berhasil dimuat sebelum menerapkan filter

### Debugging
- Buka console browser untuk melihat error JavaScript
- Periksa tab Network untuk memastikan API request berhasil
- Verifikasi token autentikasi di localStorage

## Pengembangan Selanjutnya
1. Export/Import kalender ke format iCal
2. Notifikasi perjalanan mendatang
3. Integrasi dengan Google Calendar
4. Laporan bulanan/tahunan dari kalender