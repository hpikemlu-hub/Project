# 🚀 Panduan Lengkap Deployment HPI Workload ke Coolify PC Kantor

## 📋 Status Deployment: SIAP UNTUK DEPLOYMENT

---

## 🎯 Ringkasan
Aplikasi HPI Workload telah disiapkan untuk deployment ke Coolify di PC Kantor dengan URL: `https://e94a60bd2c2f.ngrok-free.app`

## 📁 File yang Telah Disiapkan

### ✅ Konfigurasi Docker yang Dioptimasi
- **Dockerfile**: Menggunakan Node.js 18 Alpine dengan optimasi
- **docker-compose.yml**: Konfigurasi produksi dengan resource limits dan health checks
- **.env.production**: Environment variables untuk produksi

### 📦 Package Deployment Lengkap
Folder `deployment-package/` berisi semua file yang diperlukan:
```
deployment-package/
├── Dockerfile
├── docker-compose.yml
├── .env.production
├── package.json
├── server.js
├── config/
├── middleware/
├── routes/
├── public/
└── .dockerignore
```

## 🔧 Langkah-langkah Deployment

### 1. Akses Coolify Dashboard
- **URL**: https://e94a60bd2c2f.ngrok-free.app
- **Login**: Gunakan kredensial Coolify Anda

### 2. Buat Aplikasi Baru
1. Klik "Create New Application"
2. **Application Name**: `hpi-workload`
3. **Description**: `HPI Workload Management System`

### 3. Konfigurasi Build Settings
- **Build Method**: Docker
- **Dockerfile**: Gunakan Dockerfile yang disediakan
- **Build Context**: Root directory
- **Port**: 3000

### 4. Upload Source Code
**Opsi 1: Upload Manual**
1. Pilih "Upload Files"
2. Upload semua file dari folder `deployment-package/`

**Opsi 2: Git Repository**
1. Pilih "Git Repository"
2. Connect ke repository yang sudah dikonfigurasi

### 5. Konfigurasi Environment Variables
Copy dari file `.env.production`:
```bash
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://iktfmgvwecadqrhbkgbd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=9UBQU0M8zWp2w8aUq2bMRspZN0Ltl9gQ2aQ4Mn6e75acde3b
LOG_LEVEL=info
CORS_ORIGIN=https://e94a60bd2c2f.ngrok-free.app
SESSION_TIMEOUT=24h
NODE_OPTIONS=--max-old-space-size=2048
UV_THREADPOOL_SIZE=16
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### 6. Konfigurasi Resources
**Optimal untuk PC Kantor (i3 Gen 8, 12GB RAM):**
- **Memory**: 1-2 GB (limit 3 GB)
- **CPU**: 1.0-1.5 cores (limit 2.0)
- **Storage**: 2 GB

### 7. Konfigurasi Health Check
- **Endpoint**: `http://localhost:3000/`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3
- **Start Period**: 40 seconds

### 8. Deployment
1. Klik tombol "Deploy"
2. Monitor progress deployment
3. Periksa logs jika ada masalah

## 🧪 Verifikasi Deployment

Setelah deployment selesai, jalankan script verifikasi:
```bash
cd hpi-workload
./verify-deployment.sh <your-deployed-url>
```

### Manual Verification Checklist
- [ ] Aplikasi dapat diakses via browser
- [ ] Login berfungsi dengan benar
- [ ] Dashboard menampilkan data
- [ ] CRUD perjalanan dinas berfungsi
- [ ] Kalender perjalanan dinas berfungsi
- [ ] Koneksi ke Supabase stabil
- [ ] Tidak ada error di console browser

## 📊 Fitur yang Tersedia

### 1. **Perjalanan Dinas CRUD**
- Input data perjalanan dinas
- Edit data yang ada
- Hapus data
- Filter dan pencarian
- Pagination

### 2. **Kalender Perjalanan Dinas**
- Tampilan kalender interaktif
- Event berdasarkan status (Disetujui, Diajukan, Ditolak, Selesai)
- Filter berdasarkan nama dan status
- Statistik ringkasan

### 3. **Dashboard**
- Statistik lengkap
- Grafik visualisasi
- Summary cards

### 4. **Manajemen User**
- Input data pegawai
- Manajemen role

## 🔍 Troubleshooting

### Common Issues

#### 1. **Deployment Failed**
- **Cause**: Environment variables salah
- **Solution**: Periksa kembali .env.production
- **Check**: Supabase URL dan keys

#### 2. **Application Not Starting**
- **Cause**: Port conflict atau resource kurang
- **Solution**: 
  - Check port 3000 tidak digunakan
  - Tambah memory allocation
  - Periksa Docker logs

#### 3. **Database Connection Error**
- **Cause**: Supabase credentials salah
- **Solution**:
  - Verify SUPABASE_URL
  - Check ANON_KEY dan SERVICE_KEY
  - Pastikan Supabase project aktif

#### 4. **CORS Issues**
- **Cause**: CORS_ORIGIN tidak sesuai
- **Solution**: Update CORS_ORIGIN ke URL aplikasi

### Log Locations
- **Coolify Logs**: Dashboard Coolify → Application → Logs
- **Application Logs**: Coolify Dashboard → Container Logs
- **Database Logs**: Supabase Dashboard → Logs

## 📈 Monitoring & Maintenance

### Daily Checks
- Monitor resource usage di Coolify dashboard
- Check application responsiveness
- Review error logs

### Weekly Maintenance
- Restart container untuk cleanup memory
- Backup konfigurasi
- Update dependencies jika ada security patches

### Monthly Reviews
- Analisis performance metrics
- Review resource allocation
- Update security configurations

## 🚨 Emergency Procedures

### If Application Down
1. **Quick Check**:
   - Coolify dashboard status
   - Container status
   - Recent deployments

2. **Restart**:
   - Stop container via Coolify
   - Start container kembali
   - Monitor startup logs

3. **Rollback**:
   - Jika masih bermasalah, revert ke versi sebelumnya
   - Periksa perubahan terakhir yang menyebabkan masalah

### Contact Support
- **Coolify**: https://coolify.io/docs
- **Supabase**: https://app.supabase.com
- **Internal IT**: Support PC Kantor

## 📋 Final Deployment Checklist

### Pre-Deployment ✅
- [x] Docker configuration optimized
- [x] Environment variables prepared
- [x] All required files ready
- [x] Coolify connection tested
- [x] Deployment package created

### Post-Deployment 🔄
- [ ] Application accessible
- [ ] All features working
- [ ] Performance acceptable
- [ ] Monitoring configured
- [ ] Backup procedures ready

---

## 📞 Kontak & Support

**Deployment Information:**
- **Target**: Coolify PC Kantor
- **URL**: https://e94a60bd2c2f.ngrok-free.app
- **Application**: HPI Workload Management System
- **Environment**: Production

**Quick Links:**
- [Coolify Dashboard](https://e94a60bd2c2f.ngrok-free.app)
- [Supabase Dashboard](https://app.supabase.com)
- [Repository](https://github.com/your-repo/hpi-workload)

---

*Prepared: $(date)*
*Status: Ready for Deployment*