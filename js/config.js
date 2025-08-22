// Konfigurasi Supabase untuk Keyword Bank
// PENTING: Ganti URL dan API Key dengan nilai yang sebenarnya dari project Supabase Anda

const SUPABASE_CONFIG = {
  // URL project Supabase Anda (format: https://[project-id].supabase.co)
  url: 'https://tyrqvrypckfpgzeyarde.supabase.co',
  
  // Anon/Public API Key dari Settings > API di dashboard Supabase
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cnF2cnlwY2tmcGd6ZXlhcmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTc2NTAsImV4cCI6MjA3MTQzMzY1MH0.drmwAmDPFIj_1FQKeFNHqru-JISrdytEvarCJn09e1Y',
  
  // Pengaturan tambahan
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'keyword-bank-app'
      }
    }
  }
};

// Export konfigurasi ke global scope agar bisa diakses dari file lain
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

// Log untuk debugging (hapus di production)
if (SUPABASE_CONFIG.url.includes('YOUR_PROJECT_ID')) {
  console.warn('⚠️ SUPABASE CONFIG: Silakan ganti URL dan API Key dengan nilai yang sebenarnya!');
  console.warn('📖 Lihat file SUPABASE_SETUP_GUIDE.md untuk panduan lengkap');
}

// Utility function untuk validasi konfigurasi
window.validateSupabaseConfig = function() {
  const config = window.SUPABASE_CONFIG;
  
  if (!config) {
    return { valid: false, error: 'Konfigurasi Supabase tidak ditemukan' };
  }
  
  if (!config.url || config.url.includes('YOUR_PROJECT_ID')) {
    return { valid: false, error: 'URL Supabase belum dikonfigurasi' };
  }
  
  if (!config.anonKey || config.anonKey.includes('YOUR_ANON_KEY_HERE')) {
    return { valid: false, error: 'API Key Supabase belum dikonfigurasi' };
  }
  
  if (!config.url.startsWith('https://') || !config.url.includes('.supabase.co')) {
    return { valid: false, error: 'Format URL Supabase tidak valid' };
  }
  
  return { valid: true, error: null };
};