# Panduan Setup Supabase untuk Keyword Bank

## Langkah 1: Membuat Akun dan Project Supabase

1. **Buka website Supabase**
   - Kunjungi https://supabase.com
   - Klik "Start your project" atau "Sign Up"

2. **Daftar akun baru atau login**
   - Gunakan GitHub, Google, atau email
   - Ikuti proses verifikasi jika diperlukan

3. **Buat project baru**
   - Klik "New Project"
   - Pilih Organization (atau buat baru jika belum ada)
   - Isi detail project:
     - **Name**: `keyword-bank-db` (atau nama yang Anda inginkan)
     - **Database Password**: Buat password yang kuat (SIMPAN password ini!)
     - **Region**: Pilih yang terdekat dengan lokasi Anda (misalnya: Southeast Asia)
   - Klik "Create new project"
   - Tunggu beberapa menit hingga database siap

## Langkah 2: Setup Database Schema

1. **Buka Database Editor**
   - Dari dashboard project, pilih "SQL Editor" di sidebar kiri
   - Atau buka tab "Database" → "SQL Editor"

2. **Buat tabel themes**
   Jalankan SQL query berikut:

```sql
-- Membuat tabel themes untuk menyimpan data keyword bank
CREATE TABLE themes (
  id BIGSERIAL PRIMARY KEY,
  theme TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Lainnya',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Membuat index untuk pencarian yang lebih cepat
CREATE INDEX idx_themes_theme ON themes(theme);
CREATE INDEX idx_themes_category ON themes(category);
CREATE INDEX idx_themes_created_at ON themes(created_at DESC);

-- Membuat function untuk auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Membuat trigger untuk auto-update updated_at
CREATE TRIGGER update_themes_updated_at 
    BEFORE UPDATE ON themes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Menambahkan Row Level Security (RLS)
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Membuat policy untuk mengizinkan semua operasi (untuk testing)
-- CATATAN: Untuk production, sebaiknya buat policy yang lebih ketat
CREATE POLICY "Allow all operations on themes" 
ON themes FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);
```

3. **Verifikasi tabel berhasil dibuat**
   - Pilih tab "Database" → "Tables"
   - Pastikan tabel `themes` muncul dalam daftar

## Langkah 3: Mendapatkan API Keys

1. **Buka Settings**
   - Dari dashboard project, pilik "Settings" → "API"

2. **Catat informasi penting**
   Anda akan membutuhkan dua informasi ini:
   
   - **Project URL**: 
     ```
     https://[your-project-id].supabase.co
     ```
   
   - **API Key (anon/public)**:
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

   **PENTING**: Jangan membagikan Service Role Key ke publik!

## Langkah 4: Setup Environment Variables

Buat file `config.js` di folder `js/` dengan isi:

```javascript
// js/config.js
const SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_ANON_KEY_HERE'
};

// Export untuk digunakan di file lain
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
```

**GANTI** `YOUR_PROJECT_ID` dan `YOUR_ANON_KEY_HERE` dengan nilai yang sebenarnya dari langkah 3.

## Langkah 5: Testing Koneksi

1. **Buka browser console** (F12)
2. **Jalankan test query** di SQL Editor Supabase:

```sql
-- Test insert data
INSERT INTO themes (theme, category, keywords) 
VALUES ('Test Theme', 'Test Category', ARRAY['keyword1', 'keyword2', 'keyword3']);

-- Test select data
SELECT * FROM themes;
```

## Langkah 6: Security Settings (Opsional tapi Disarankan)

1. **Setup Authentication (jika diperlukan)**
   - Untuk aplikasi publik sederhana, bisa menggunakan anonymous access
   - Untuk aplikasi yang lebih aman, setup authentication di "Authentication" → "Settings"

2. **Review RLS Policies**
   - Saat ini policy mengizinkan semua operasi
   - Untuk production, pertimbangkan untuk membuat policy yang lebih restrictive

## Langkah 7: Backup dan Recovery

1. **Automatic Backups**
   - Supabase otomatis membuat backup harian
   - Untuk project berbayar, backup disimpan lebih lama

2. **Manual Export**
   - Bisa export data via SQL Editor atau API
   - Gunakan `pg_dump` untuk backup lengkap

## Troubleshooting Umum

### Error: "relation 'themes' does not exist"
- Pastikan tabel sudah dibuat dengan benar
- Cek di "Database" → "Tables" apakah tabel `themes` ada

### Error: "Row Level Security policy violation"
- Pastikan RLS policy sudah dibuat dengan benar
- Untuk testing, bisa disable RLS sementara: `ALTER TABLE themes DISABLE ROW LEVEL SECURITY;`

### Error: "Invalid API key"
- Pastikan menggunakan anon key, bukan service_role key
- Cek kembali konfigurasi di `config.js`

### Connection timeout
- Cek koneksi internet
- Pastikan URL project benar
- Coba refresh project di dashboard Supabase

## Tips & Best Practices

1. **Development vs Production**
   - Gunakan project terpisah untuk development dan production
   - Setup environment variables yang berbeda

2. **Monitoring**
   - Monitor usage di dashboard Supabase
   - Set alert untuk quota limits

3. **Performance**
   - Gunakan index untuk query yang sering dijalankan
   - Limit jumlah data yang di-fetch sekaligus

4. **Security**
   - Jangan commit API keys ke repository publik
   - Gunakan environment variables atau config file yang tidak di-commit
   - Review dan test RLS policies secara teratur

## Langkah Selanjutnya

Setelah setup selesai, aplikasi Keyword Bank akan:
1. Otomatis terhubung ke Supabase database
2. Menyimpan semua data themes dan keywords di cloud
3. Memiliki fallback ke localStorage jika Supabase tidak tersedia
4. Mendukung migrasi data dari localStorage ke Supabase

## Support dan Dokumentasi

- **Supabase Docs**: https://supabase.com/docs
- **JavaScript Client**: https://supabase.com/docs/reference/javascript
- **SQL Reference**: https://supabase.com/docs/guides/database/sql
- **Community**: https://github.com/supabase/supabase/discussions