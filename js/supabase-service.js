// SupabaseService.js - Service class untuk operasi database Supabase
// Menangani semua operasi CRUD untuk tabel themes

class SupabaseService {
  constructor() {
    this.supabase = null;
    this.isConnected = false;
    this.fallbackToLocalStorage = false;
    this.localStorageKey = 'keywordBankThemes';
    
    this.init();
  }

  // Inisialisasi koneksi Supabase
  async init() {
    try {
      // Validasi konfigurasi
      const validation = window.validateSupabaseConfig();
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const config = window.SUPABASE_CONFIG;
      
      // Inisialisasi client Supabase
      this.supabase = window.supabase.createClient(config.url, config.anonKey, config.options);
      
      // Test koneksi dengan query sederhana
      await this.testConnection();
      
      this.isConnected = true;
      console.log('✅ Supabase connected successfully');
      
      return true;
    } catch (error) {
      console.warn('⚠️ Supabase connection failed:', error.message);
      console.warn('🔄 Falling back to localStorage');
      this.fallbackToLocalStorage = true;
      this.isConnected = false;
      return false;
    }
  }

  // Test koneksi ke database
  async testConnection() {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.supabase
      .from('themes')
      .select('count', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Database connection test failed: ${error.message}`);
    }

    return true;
  }

  // Mendapatkan status koneksi
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      fallbackMode: this.fallbackToLocalStorage,
      client: this.isConnected ? 'Supabase' : 'localStorage'
    };
  }

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================

  // CREATE - Menambah tema baru
  async createTheme(themeData) {
    try {
      if (this.fallbackToLocalStorage) {
        return await this.createThemeLocalStorage(themeData);
      }

      const { theme, category, keywords } = themeData;
      
      const { data, error } = await this.supabase
        .from('themes')
        .insert([{
          theme: theme.trim(),
          category: category.trim(),
          keywords: keywords
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create theme: ${error.message}`);
      }

      // Convert Supabase format to app format
      return this.convertSupabaseToAppFormat(data);
    } catch (error) {
      console.error('Error creating theme:', error);
      throw error;
    }
  }

  // READ - Mendapatkan semua tema
  async getAllThemes() {
    try {
      if (this.fallbackToLocalStorage) {
        return await this.getAllThemesLocalStorage();
      }

      const { data, error } = await this.supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch themes: ${error.message}`);
      }

      // Convert Supabase format to app format
      return data.map(item => this.convertSupabaseToAppFormat(item));
    } catch (error) {
      console.error('Error fetching themes:', error);
      throw error;
    }
  }

  // READ - Mendapatkan tema berdasarkan ID
  async getThemeById(id) {
    try {
      if (this.fallbackToLocalStorage) {
        return await this.getThemeByIdLocalStorage(id);
      }

      const { data, error } = await this.supabase
        .from('themes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Theme not found
        }
        throw new Error(`Failed to fetch theme: ${error.message}`);
      }

      return this.convertSupabaseToAppFormat(data);
    } catch (error) {
      console.error('Error fetching theme by ID:', error);
      throw error;
    }
  }

  // UPDATE - Memperbarui tema
  async updateTheme(id, themeData) {
    try {
      if (this.fallbackToLocalStorage) {
        return await this.updateThemeLocalStorage(id, themeData);
      }

      const { theme, category, keywords } = themeData;

      const { data, error } = await this.supabase
        .from('themes')
        .update({
          theme: theme.trim(),
          category: category.trim(),
          keywords: keywords,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update theme: ${error.message}`);
      }

      return this.convertSupabaseToAppFormat(data);
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  }

  // DELETE - Menghapus tema
  async deleteTheme(id) {
    try {
      if (this.fallbackToLocalStorage) {
        return await this.deleteThemeLocalStorage(id);
      }

      const { error } = await this.supabase
        .from('themes')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete theme: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting theme:', error);
      throw error;
    }
  }

  // DELETE - Menghapus beberapa tema sekaligus
  async deleteMultipleThemes(ids) {
    try {
      if (this.fallbackToLocalStorage) {
        return await this.deleteMultipleThemesLocalStorage(ids);
      }

      const { error } = await this.supabase
        .from('themes')
        .delete()
        .in('id', ids);

      if (error) {
        throw new Error(`Failed to delete themes: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting multiple themes:', error);
      throw error;
    }
  }

  // CREATE - Menambah beberapa tema sekaligus (batch insert)
  async createMultipleThemes(themesData) {
    try {
      if (this.fallbackToLocalStorage) {
        return await this.createMultipleThemesLocalStorage(themesData);
      }

      const formattedData = themesData.map(item => ({
        theme: item.theme.trim(),
        category: item.category.trim(),
        keywords: item.keywords
      }));

      const { data, error } = await this.supabase
        .from('themes')
        .insert(formattedData)
        .select();

      if (error) {
        throw new Error(`Failed to create themes: ${error.message}`);
      }

      return data.map(item => this.convertSupabaseToAppFormat(item));
    } catch (error) {
      console.error('Error creating multiple themes:', error);
      throw error;
    }
  }

  // DELETE - Menghapus semua tema
  async deleteAllThemes() {
    try {
      if (this.fallbackToLocalStorage) {
        return await this.deleteAllThemesLocalStorage();
      }

      const { error } = await this.supabase
        .from('themes')
        .delete()
        .neq('id', 0); // Delete all records

      if (error) {
        throw new Error(`Failed to delete all themes: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting all themes:', error);
      throw error;
    }
  }

  // ==========================================================================
  // FORMAT CONVERTERS
  // ==========================================================================

  // Konversi format Supabase ke format aplikasi
  convertSupabaseToAppFormat(supabaseData) {
    return {
      id: supabaseData.id,
      theme: supabaseData.theme,
      category: supabaseData.category || 'Lainnya',
      keywords: supabaseData.keywords || [],
      created_at: supabaseData.created_at,
      updated_at: supabaseData.updated_at
    };
  }

  // Konversi format aplikasi ke format Supabase
  convertAppToSupabaseFormat(appData) {
    return {
      theme: appData.theme,
      category: appData.category || 'Lainnya',
      keywords: appData.keywords || []
    };
  }

  // ==========================================================================
  // FALLBACK LOCALSTORAGE METHODS
  // ==========================================================================

  async createThemeLocalStorage(themeData) {
    const themes = this.getLocalStorageThemes();
    const newTheme = {
      id: Date.now(),
      theme: themeData.theme,
      category: themeData.category,
      keywords: themeData.keywords,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    themes.unshift(newTheme);
    this.saveLocalStorageThemes(themes);
    return newTheme;
  }

  async getAllThemesLocalStorage() {
    return this.getLocalStorageThemes();
  }

  async getThemeByIdLocalStorage(id) {
    const themes = this.getLocalStorageThemes();
    return themes.find(theme => theme.id === id) || null;
  }

  async updateThemeLocalStorage(id, themeData) {
    const themes = this.getLocalStorageThemes();
    const index = themes.findIndex(theme => theme.id === id);
    
    if (index === -1) {
      throw new Error('Theme not found');
    }

    themes[index] = {
      ...themes[index],
      theme: themeData.theme,
      category: themeData.category,
      keywords: themeData.keywords,
      updated_at: new Date().toISOString()
    };

    this.saveLocalStorageThemes(themes);
    return themes[index];
  }

  async deleteThemeLocalStorage(id) {
    const themes = this.getLocalStorageThemes();
    const filteredThemes = themes.filter(theme => theme.id !== id);
    this.saveLocalStorageThemes(filteredThemes);
    return true;
  }

  async deleteMultipleThemesLocalStorage(ids) {
    const themes = this.getLocalStorageThemes();
    const filteredThemes = themes.filter(theme => !ids.includes(theme.id));
    this.saveLocalStorageThemes(filteredThemes);
    return true;
  }

  async createMultipleThemesLocalStorage(themesData) {
    const existingThemes = this.getLocalStorageThemes();
    const newThemes = themesData.map(item => ({
      id: Date.now() + Math.random(),
      theme: item.theme,
      category: item.category,
      keywords: item.keywords,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const allThemes = [...newThemes, ...existingThemes];
    this.saveLocalStorageThemes(allThemes);
    return newThemes;
  }

  async deleteAllThemesLocalStorage() {
    localStorage.removeItem(this.localStorageKey);
    return true;
  }

  // Helper methods untuk localStorage
  getLocalStorageThemes() {
    try {
      const savedData = localStorage.getItem(this.localStorageKey);
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  saveLocalStorageThemes(themes) {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(themes));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw new Error('Failed to save data to localStorage');
    }
  }

  // ==========================================================================
  // MIGRATION METHODS
  // ==========================================================================

  // Migrasi data dari localStorage ke Supabase
  async migrateFromLocalStorage() {
    try {
      if (this.fallbackToLocalStorage) {
        throw new Error('Cannot migrate: Supabase connection not available');
      }

      const localThemes = this.getLocalStorageThemes();
      
      if (localThemes.length === 0) {
        return { success: true, migrated: 0, message: 'No data to migrate' };
      }

      // Cek apakah sudah ada data di Supabase
      const existingThemes = await this.getAllThemes();
      if (existingThemes.length > 0) {
        throw new Error('Supabase already contains data. Migration cancelled to prevent duplicates.');
      }

      // Migrasi data
      const migratedThemes = await this.createMultipleThemes(localThemes);

      return {
        success: true,
        migrated: migratedThemes.length,
        message: `Successfully migrated ${migratedThemes.length} themes to Supabase`
      };
    } catch (error) {
      console.error('Migration error:', error);
      return {
        success: false,
        migrated: 0,
        message: error.message
      };
    }
  }

  // Backup data Supabase ke localStorage
  async backupToLocalStorage() {
    try {
      if (this.fallbackToLocalStorage) {
        return { success: false, message: 'Supabase connection not available' };
      }

      const supabaseThemes = await this.getAllThemes();
      this.saveLocalStorageThemes(supabaseThemes);

      return {
        success: true,
        backed_up: supabaseThemes.length,
        message: `Successfully backed up ${supabaseThemes.length} themes to localStorage`
      };
    } catch (error) {
      console.error('Backup error:', error);
      return {
        success: false,
        backed_up: 0,
        message: error.message
      };
    }
  }
}

// Export ke global scope
window.SupabaseService = SupabaseService;