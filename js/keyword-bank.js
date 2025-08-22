(() => {
  // ==========================================================================
  // STATE & ELEMENTS
  // ==========================================================================
  let themes = [];
  let editingId = null;
  let currentPage = 1;
  const ITEMS_PER_PAGE = 30;
  const STORAGE_KEY = 'keywordBankThemes';
  let searchDebounceTimer = null;
  let webWorker = null;
  let supabaseService = null;
  let isLoading = false;

  const DOMElements = {
    themeInput: document.getElementById("themeInput"),
    categorySelect: document.getElementById("categorySelect"),
    customCategoryInput: document.getElementById("customCategoryInput"),
    keywordInput: document.getElementById("keywordInput"),
    searchTheme: document.getElementById("searchTheme"),
    searchKeyword: document.getElementById("searchKeyword"),
    sortSelect: document.getElementById("sortSelect"),
    themeTableBody: document.getElementById("themeTableBody"),
    pagination: document.getElementById("pagination"),
    toast: document.getElementById("toast"),
    totalThemesCounter: document.getElementById("totalThemes"),
    batchJsonInput: document.getElementById('batchJsonInput'),
    bulkDeleteBtn: document.getElementById('bulkDeleteBtn'),
    bulkDeleteCount: document.getElementById('bulkDeleteCount'),
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),
    fileInput: document.getElementById('fileInput'),
  };

  // ==========================================================================
  // CORE FUNCTIONS
  // ==========================================================================
  const saveThemes = async () => {
    // This function is now handled by SupabaseService
    // Individual operations call the service directly
    return true;
  };
  
  const loadThemes = async () => {
    if (!supabaseService) {
      console.error('SupabaseService not initialized');
      return;
    }

    try {
      showSkeletonScreen();
      isLoading = true;
      
      themes = await supabaseService.getAllThemes();
      
      // Ensure compatibility with existing code structure
      themes = themes.map(t => ({
        ...t, 
        id: t.id || Date.now() + Math.random(), 
        category: t.category || 'Lainnya'
      }));
      
      hideSkeletonScreen();
      isLoading = false;
      
    } catch (error) {
      console.error('Error loading themes:', error);
      hideSkeletonScreen();
      isLoading = false;
      showToast("Gagal memuat data: " + error.message);
      
      // Fallback: try to load from localStorage if Supabase fails
      try {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        themes = savedData.map(t => ({...t, id: t.id || Date.now() + Math.random(), category: t.category || 'Lainnya' }));
      } catch {
        themes = [];
      }
    }
  };
  
  const showToast = (msg, type = 'info') => {
    DOMElements.toast.textContent = msg;
    DOMElements.toast.className = `toast show ${type}`;
    setTimeout(() => DOMElements.toast.classList.remove("show"), 2500);
  };

  const setLoadingState = (loading, element = null) => {
    isLoading = loading;
    
    if (element) {
      element.disabled = loading;
      if (loading) {
        element.style.opacity = '0.6';
        element.style.cursor = 'not-allowed';
      } else {
        element.style.opacity = '1';
        element.style.cursor = 'pointer';
      }
    }
    
    // Disable all buttons during loading
    if (loading) {
      document.querySelectorAll('button').forEach(btn => {
        if (!btn.classList.contains('loading-exempt')) {
          btn.disabled = true;
          btn.style.opacity = '0.6';
        }
      });
    } else {
      document.querySelectorAll('button').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
      });
    }
  };

  const showConnectionStatus = () => {
    if (supabaseService) {
      const status = supabaseService.getConnectionStatus();
      const statusMsg = status.isConnected 
        ? '🟢 Terhubung ke Supabase' 
        : '🟡 Menggunakan penyimpanan lokal';
      
      console.log(statusMsg, status);
      
      // Show status in UI (optional)
      if (!status.isConnected) {
        showToast('Mode offline: data disimpan di browser', 'warning');
      }
    }
  };

  const showSkeletonScreen = () => {
    const skeletonHTML = Array(5).fill().map((_, i) => `
      <tr class="skeleton-row">
        <td><div class="skeleton skeleton-checkbox"></div></td>
        <td><div class="skeleton skeleton-number"></div></td>
        <td><div class="skeleton skeleton-title"></div></td>
        <td><div class="skeleton skeleton-category"></div></td>
        <td><div class="skeleton skeleton-keywords"></div></td>
        <td><div class="skeleton skeleton-count"></div></td>
        <td><div class="skeleton skeleton-actions"></div></td>
      </tr>
    `).join('');
    
    DOMElements.themeTableBody.innerHTML = skeletonHTML;
  };

  const hideSkeletonScreen = () => {
    const skeletonRows = DOMElements.themeTableBody.querySelectorAll('.skeleton-row');
    skeletonRows.forEach(row => row.remove());
  };

  const parseKeywords = (input) => [...new Set(input.split(/[\n,]+/).map(k => k.trim().toLowerCase()).filter(Boolean))];

  const updateCategoryDropdown = () => {
    const { sortSelect } = DOMElements;
    const uniqueCategories = [...new Set(themes.map(t => t.category))].sort();
    const currentValue = sortSelect.value;
    
    // Reset dropdown dengan opsi default
    sortSelect.innerHTML = `
      <option value="all">Filter: Semua Kategori</option>
      <option value="latest">Filter: Terbaru</option>
    `;
    
    // Tambahkan kategori unik
    uniqueCategories.forEach(category => {
      if (category && category.trim()) {
        sortSelect.innerHTML += `<option value="${category}">Filter: ${category}</option>`;
      }
    });
    
    // Pertahankan nilai yang dipilih sebelumnya jika masih valid
    if ([...sortSelect.options].some(opt => opt.value === currentValue)) {
      sortSelect.value = currentValue;
    } else {
      sortSelect.value = "all"; // Default ke "all" jika nilai sebelumnya tidak valid
    }
  };

  const updateBulkActionUI = () => {
    const selectedCount = document.querySelectorAll('.theme-checkbox:checked').length;
    DOMElements.bulkDeleteBtn.classList.toggle('hidden', selectedCount === 0);
    if (selectedCount > 0) {
      DOMElements.bulkDeleteCount.textContent = `Hapus (${selectedCount})`;
    }
    const allCheckboxes = document.querySelectorAll('.theme-checkbox');
    DOMElements.selectAllCheckbox.checked = allCheckboxes.length > 0 && selectedCount === allCheckboxes.length;
  };

  const debouncedRenderThemes = () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      clearSelectionsAndFilters();
    }, 300);
  };

  const updateRowNumbers = () => {
    const rows = DOMElements.themeTableBody.querySelectorAll('tr:not(.editing-row):not(.skeleton-row)');
    rows.forEach((row, index) => {
      const numberCell = row.cells[1];
      if (numberCell && !numberCell.querySelector('.skeleton')) {
        numberCell.textContent = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
      }
    });
  };

  const expandKeywords = (button) => {
    const themeId = Number(button.dataset.id);
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const keywordsContainer = button.parentNode;
    const { searchKeyword } = DOMElements;
    const createHighlight = (text, filter) => filter ? text.replace(new RegExp(`(${filter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'), `<mark>$1</mark>`) : text;
    
    // Render all keywords
    const allKeywordHTML = theme.keywords.map(k => 
      `<span class="keyword-chip" data-keyword="${k}" title="Klik untuk salin">${createHighlight(k, searchKeyword.value)}</span>`
    ).join("");
    
    // Add collapse button
    const collapseHTML = `<button class="show-less-keywords" data-id="${themeId}" title="Sembunyikan keyword tambahan">
      Sembunyikan
    </button>`;
    
    keywordsContainer.innerHTML = allKeywordHTML + collapseHTML;
  };

  const collapseKeywords = (button) => {
    const themeId = Number(button.dataset.id);
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const keywordsContainer = button.parentNode;
    const { searchKeyword } = DOMElements;
    const createHighlight = (text, filter) => filter ? text.replace(new RegExp(`(${filter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'), `<mark>$1</mark>`) : text;
    
    // Lazy loading keywords - tampilkan max 10 keywords
    const KEYWORDS_LIMIT = 10;
    const visibleKeywords = theme.keywords.slice(0, KEYWORDS_LIMIT);
    const hiddenKeywords = theme.keywords.slice(KEYWORDS_LIMIT);
    
    let keywordHTML = visibleKeywords.map(k => 
      `<span class="keyword-chip" data-keyword="${k}" title="Klik untuk salin">${createHighlight(k, searchKeyword.value)}</span>`
    ).join("");
    
    if (hiddenKeywords.length > 0) {
      keywordHTML += `<button class="show-more-keywords" data-id="${themeId}" title="Tampilkan ${hiddenKeywords.length} keyword lainnya">
        +${hiddenKeywords.length} lagi
      </button>`;
    }
    
    keywordsContainer.innerHTML = keywordHTML;
  };

  const getKeywordCountClass = (count) => {
    if (count === 15) return 'optimal';
    if (count < 15) return 'low';
    return 'high';
  };
  
  // ==========================================================================
  // RENDER FUNCTIONS
  // ==========================================================================
  function renderThemes() {
    const { searchTheme, searchKeyword, sortSelect, themeTableBody, totalThemesCounter } = DOMElements;
    
    // Use Web Worker for heavy filtering if available
    if (webWorker && themes.length > 100) {
      webWorker.postMessage({
        themes: themes,
        searchTheme: searchTheme.value,
        searchKeyword: searchKeyword.value,
        sortValue: sortSelect.value
      });
      return;
    }
    
    // Fallback to synchronous processing
    renderThemesSync();
  }

  function renderThemesSync() {
    const { searchTheme, searchKeyword, sortSelect, themeTableBody, totalThemesCounter } = DOMElements;
    let filteredThemes = themes.filter(item => 
      item.theme.toLowerCase().includes(searchTheme.value.toLowerCase().trim()) &&
      (!searchKeyword.value.trim() || item.keywords.some(k => k.toLowerCase().includes(searchKeyword.value.toLowerCase().trim()))) &&
      (sortSelect.value === "all" || sortSelect.value === "latest" || item.category === sortSelect.value)
    );

    if (sortSelect.value === 'latest') filteredThemes.sort((a, b) => b.id - a.id);
    else filteredThemes.sort((a, b) => a.theme.toLowerCase().localeCompare(b.theme.toLowerCase()));

    renderFilteredThemes(filteredThemes);
  }

  function renderFilteredThemes(filteredThemes) {
    const { themeTableBody, totalThemesCounter } = DOMElements;
    const totalPages = Math.ceil(filteredThemes.length / ITEMS_PER_PAGE) || 1;
    currentPage = Math.min(currentPage, totalPages);
    const pagedThemes = filteredThemes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    themeTableBody.innerHTML = pagedThemes.map(renderRow).join('') || `<tr><td colspan="7" class="no-data-cell">Tidak ada data.</td></tr>`;
    totalThemesCounter.textContent = themes.length;
    renderPagination(totalPages);
    updateBulkActionUI();
  }

  function renderRow(item, index) {
    const { searchTheme, searchKeyword } = DOMElements;
    if (editingId === item.id) return renderEditRow(item, index);
    
    const createHighlight = (text, filter) => filter ? text.replace(new RegExp(`(${filter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'), `<mark>$1</mark>`) : text;

    // Lazy loading keywords - tampilkan max 10 keywords
    const KEYWORDS_LIMIT = 10;
    const visibleKeywords = item.keywords.slice(0, KEYWORDS_LIMIT);
    const hiddenKeywords = item.keywords.slice(KEYWORDS_LIMIT);
    
    let keywordHTML = visibleKeywords.map(k => 
      `<span class="keyword-chip" data-keyword="${k}" title="Klik untuk salin">${createHighlight(k, searchKeyword.value)}</span>`
    ).join("");
    
    if (hiddenKeywords.length > 0) {
      keywordHTML += `<button class="show-more-keywords" data-id="${item.id}" title="Tampilkan ${hiddenKeywords.length} keyword lainnya">
        +${hiddenKeywords.length} lagi
      </button>`;
    }
    
    // Calculate correct row number
    const rowNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
    const keywordCountClass = getKeywordCountClass(item.keywords.length);
    
    return `<tr data-row-id="${item.id}">
        <td><input type="checkbox" class="theme-checkbox" data-id="${item.id}"></td>
        <td>${rowNumber}</td>
        <td class="theme-title-cell">${createHighlight(item.theme, searchTheme.value)}</td>
        <td><span class="category-badge">${item.category}</span></td>
        <td><div class="keywords" data-theme-id="${item.id}">${keywordHTML}</div></td>
        <td class="keyword-count ${keywordCountClass}" title="Jumlah keywords: ${item.keywords.length}">${item.keywords.length}</td>
        <td class="actions-cell">
          <div class="main-actions-group">
            <button class="icon-btn" data-action="copy-all" data-id="${item.id}" title="Copy Semua Keywords"><span class="material-symbols-outlined">content_copy</span></button>
            <div class="actions-container">
              <button class="kebab-btn" data-action="toggle-menu" aria-label="Aksi lainnya"><span class="material-symbols-outlined">more_vert</span></button>
              <div class="dropdown-menu">
                <button class="dropdown-item edit" data-action="edit" data-id="${item.id}"><span class="material-symbols-outlined">edit</span>Edit</button>
                <button class="dropdown-item delete" data-action="delete" data-id="${item.id}"><span class="material-symbols-outlined">delete</span>Hapus</button>
              </div>
            </div>
          </div>
        </td>
      </tr>`;
  }

  function renderEditRow(item, index) {
    const uniqueCategories = [...new Set(themes.map(t => t.category))].sort();
    const categoryOptions = uniqueCategories.map(cat => 
      `<option value="${cat}" ${cat === item.category ? 'selected' : ''}>${cat}</option>`
    ).join('');
    
    const rowNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
    
    return `<tr class="editing-row">
        <td></td><td>${rowNumber}</td>
        <td><input type="text" class="edit-theme-title" value="${item.theme}"></td>
        <td>
          <select class="edit-category-select">
            ${categoryOptions}
            <option value="Graphic Template" ${item.category === 'Graphic Template' ? 'selected' : ''}>Graphic Template</option>
            <option value="Presentation" ${item.category === 'Presentation' ? 'selected' : ''}>Presentation</option>
            <option value="Social Media" ${item.category === 'Social Media' ? 'selected' : ''}>Social Media</option>
            <option value="custom">-- Kategori Baru --</option>
          </select>
          <input type="text" class="edit-custom-category hidden" placeholder="Kategori baru..." value="">
        </td>
        <td colspan="2"><textarea class="edit-textarea">${item.keywords.join(", ")}</textarea></td>
        <td class="actions-cell">
            <div class="edit-actions-group">
                <button class="btn-cancel" data-action="cancel">Batal</button>
                <button class="btn-save" data-action="save" data-id="${item.id}">Simpan</button>
            </div>
        </td>
    </tr>`;
  }

  function renderPagination(totalPages) {
    let html = "";
    if (totalPages > 1) {
      const createBtn = (label, page, disabled, current) => `<button aria-label="${label}" ${disabled||current?'disabled':''} class="${current?'current':''}" data-page="${page}">${label.replace(/Halaman /g,'')}</button>`;
      
      // First and Previous buttons
      html += createBtn('« Awal', 1, currentPage === 1);
      html += createBtn('‹ Prev', currentPage - 1, currentPage === 1);
      
      // Page numbers with ellipsis logic
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);
      
      if (startPage > 1) {
        html += createBtn('1', 1, false, false);
        if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
      }
      
      for (let i = startPage; i <= endPage; i++) {
        html += createBtn(`${i}`, i, false, i === currentPage);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
        html += createBtn(`${totalPages}`, totalPages, false, false);
      }
      
      // Next and Last buttons
      html += createBtn('Next ›', currentPage + 1, currentPage === totalPages);
      html += createBtn('Akhir »', totalPages, currentPage === totalPages);
    }
    DOMElements.pagination.innerHTML = html;
  }
  
  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================
  async function addTheme() {
    const { themeInput, categorySelect, customCategoryInput, keywordInput } = DOMElements;
    let category = categorySelect.value === 'custom' ? customCategoryInput.value.trim() : categorySelect.value;
    
    if (!themeInput.value.trim() || !category || !keywordInput.value.trim()) {
      return showToast("Judul, Kategori, dan Keyword harus diisi.", 'error');
    }
    
    if (isLoading) {
      return showToast("Sedang memproses, mohon tunggu...", 'warning');
    }

    try {
      setLoadingState(true);
      
      const themeData = {
        theme: themeInput.value.trim(),
        category,
        keywords: parseKeywords(keywordInput.value)
      };
      
      const newTheme = await supabaseService.createTheme(themeData);
      
      // Add to local array for immediate UI update
      themes.unshift(newTheme);
      
      // Clear form
      themeInput.value = keywordInput.value = customCategoryInput.value = "";
      categorySelect.value = ""; 
      customCategoryInput.classList.add('hidden');
      
      // Update UI
      currentPage = 1;
      renderThemes();
      updateCategoryDropdown();
      showToast("Tema baru berhasil ditambahkan!", 'success');
      
    } catch (error) {
      console.error('Error adding theme:', error);
      showToast("Gagal menambah tema: " + error.message, 'error');
    } finally {
      setLoadingState(false);
    }
  }

  async function addBatchThemes() {
    const { batchJsonInput } = DOMElements;
    
    if (isLoading) {
      return showToast("Sedang memproses, mohon tunggu...", 'warning');
    }
    
    try {
      setLoadingState(true);
      
      const data = JSON.parse(batchJsonInput.value);
      if (!Array.isArray(data)) throw new Error("Input harus berupa array JSON.");
      
      const validItems = data.filter(i => i.theme && i.category && i.keywords);
      if (validItems.length === 0) {
        return showToast("Tidak ada item valid dalam JSON.", 'warning');
      }
      
      const itemsToAdd = validItems.map(t => ({
        theme: t.theme,
        category: t.category,
        keywords: parseKeywords(Array.isArray(t.keywords) ? t.keywords.join(',') : t.keywords || '')
      }));
      
      const newItems = await supabaseService.createMultipleThemes(itemsToAdd);
      
      // Add to local array
      themes.unshift(...newItems);
      
      batchJsonInput.value = ""; 
      currentPage = 1; 
      renderThemes(); 
      updateCategoryDropdown();
      showToast(`${newItems.length} item berhasil diimpor dari JSON!`, 'success');
      
    } catch(error) {
      console.error('Error adding batch themes:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setLoadingState(false);
    }
  }
  
  async function resetAllData() {
    if (themes.length === 0) {
      return showToast("Data sudah kosong.", 'info');
    }
    
    if (isLoading) {
      return showToast("Sedang memproses, mohon tunggu...", 'warning');
    }
    
    if (!confirm("PERINGATAN! Anda akan menghapus SEMUA data. Aksi ini tidak dapat dibatalkan. Lanjutkan?")) {
      return;
    }
    
    try {
      setLoadingState(true);
      
      await supabaseService.deleteAllThemes();
      
      themes = [];
      currentPage = 1;
      renderThemes();
      updateCategoryDropdown();
      showToast('Semua data berhasil dihapus!', 'success');
      
    } catch (error) {
      console.error('Error resetting data:', error);
      showToast('Gagal menghapus data: ' + error.message, 'error');
    } finally {
      setLoadingState(false);
    }
  }

  function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      DOMElements.batchJsonInput.value = e.target.result;
      addBatchThemes();
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset file input
  }

  function downloadData() {
    if(themes.length === 0) return showToast("Tidak ada data untuk diunduh.");
    const blob = new Blob([JSON.stringify(themes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `keyword_bank_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast("File JSON berhasil diunduh!");
  }

  function clearSelectionsAndFilters() {
    DOMElements.selectAllCheckbox.checked = false;
    document.querySelectorAll('.theme-checkbox:checked').forEach(cb => cb.checked = false);
    currentPage = 1;
    renderThemes();
  }

  // ==========================================================================
  // EVENT LISTENERS SETUP
  // ==========================================================================
  function setupEventListeners() {
    document.getElementById("addThemeBtn").addEventListener("click", addTheme);
    document.getElementById("addBatchBtn").addEventListener("click", addBatchThemes);
    document.getElementById("resetButton").addEventListener("click", resetAllData);
    document.getElementById("downloadBtn").addEventListener("click", downloadData);
    document.getElementById("importBtn").addEventListener("click", () => DOMElements.fileInput.click());
    document.getElementById("clearSearchBtn").addEventListener("click", () => {
      DOMElements.searchTheme.value = ""; 
      DOMElements.searchKeyword.value = "";
      DOMElements.sortSelect.value = "all"; // Reset filter kategori
      clearSelectionsAndFilters();
    });
    
    DOMElements.fileInput.addEventListener("change", importFromFile);

    DOMElements.categorySelect.addEventListener("change", () => {
      DOMElements.customCategoryInput.classList.toggle('hidden', DOMElements.categorySelect.value !== 'custom');
      if (DOMElements.categorySelect.value === 'custom') DOMElements.customCategoryInput.focus();
    });

    DOMElements.themeTableBody.addEventListener("click", handleTableClick);
    DOMElements.themeTableBody.addEventListener('change', e => {
      if (e.target.classList.contains('theme-checkbox')) {
        updateBulkActionUI();
      } else if (e.target.classList.contains('edit-category-select')) {
        const customInput = e.target.parentNode.querySelector('.edit-custom-category');
        customInput.classList.toggle('hidden', e.target.value !== 'custom');
        if (e.target.value === 'custom') customInput.focus();
      }
    });
    
    // Event listener untuk copy keyword individual dan show more/less
    DOMElements.themeTableBody.addEventListener('click', e => {
      if (e.target.classList.contains('keyword-chip') && e.target.dataset.keyword) {
        e.stopPropagation();
        e.preventDefault();
        const keyword = e.target.dataset.keyword;
        
        copyToClipboard(keyword, `Keyword "${keyword}" disalin!`, `Gagal menyalin keyword "${keyword}"`);
        
      } else if (e.target.classList.contains('show-more-keywords')) {
        e.stopPropagation();
        expandKeywords(e.target);
      } else if (e.target.classList.contains('show-less-keywords')) {
        e.stopPropagation();
        collapseKeywords(e.target);
      }
    });
    DOMElements.selectAllCheckbox.addEventListener('change', e => {
      document.querySelectorAll('.theme-checkbox').forEach(cb => cb.checked = e.target.checked);
      updateBulkActionUI();
    });

    DOMElements.bulkDeleteBtn.addEventListener('click', async () => {
        const selectedIds = [...document.querySelectorAll('.theme-checkbox:checked')].map(cb => Number(cb.dataset.id));
        if (selectedIds.length === 0 || !confirm(`Anda yakin ingin menghapus ${selectedIds.length} tema yang dipilih?`)) return;
        
        if (isLoading) {
          return showToast("Sedang memproses, mohon tunggu...", 'warning');
        }
        
        try {
          setLoadingState(true);
          
          // Optimasi: Animate out selected rows
          const selectedRows = selectedIds.map(id => document.querySelector(`tr[data-row-id="${id}"]`)).filter(Boolean);
          
          selectedRows.forEach((row, index) => {
            setTimeout(() => {
              row.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
              row.style.opacity = '0';
              row.style.transform = 'translateX(-20px)';
            }, index * 50); // Stagger animation
          });
          
          // Delete from database
          await supabaseService.deleteMultipleThemes(selectedIds);
          
          setTimeout(() => {
            themes = themes.filter(theme => !selectedIds.includes(theme.id));
            renderThemes(); 
            updateCategoryDropdown();
            showToast(`${selectedIds.length} tema berhasil dihapus.`, 'success');
          }, selectedRows.length * 50 + 300);
          
        } catch (error) {
          console.error('Error deleting themes:', error);
          showToast('Gagal menghapus tema: ' + error.message, 'error');
        } finally {
          setLoadingState(false);
        }
    });
    
    ['input'].forEach(evt => {
      [DOMElements.searchTheme, DOMElements.searchKeyword].forEach(el => el.addEventListener(evt, debouncedRenderThemes));
    });
    
    ['change'].forEach(evt => {
      [DOMElements.sortSelect].forEach(el => el.addEventListener(evt, clearSelectionsAndFilters));
    });
    
    DOMElements.pagination.addEventListener("click", e => {
        if(e.target.tagName === 'BUTTON' && !e.target.disabled) {
            clearSelectionsAndFilters();
            currentPage = Number(e.target.dataset.page);
            renderThemes();
        }
    });

    document.querySelector(".fab").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    window.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.active').forEach(d => {
            d.classList.remove('active', 'show-above');
        });
    });
  }

  function handleTableClick(e) {
    const actionTarget = e.target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    const id = Number(actionTarget.dataset.id);
    
    e.stopPropagation(); // Stop propagation to prevent window click from closing menu immediately

    // Handle cancel action first (no need to validate theme)
    if (action === "cancel") {
        editingId = null;
        const cancelRow = actionTarget.closest('tr');
        // Simply re-render the entire table to exit edit mode
        renderThemes();
        return;
    }

    // For other actions, validate theme exists
    const themeIndex = themes.findIndex(t => t.id === id);
    if (themeIndex === -1 && ['edit', 'save', 'delete'].includes(action)) {
        showToast("Data tema tidak ditemukan!");
        return;
    }

    switch(action) {
        case "toggle-menu":
            document.querySelectorAll('.dropdown-menu.active').forEach(d => d !== actionTarget.nextElementSibling && d.classList.remove('active'));
            const dropdownMenu = actionTarget.nextElementSibling;
            dropdownMenu.classList.toggle('active');
            
            // Position dropdown using fixed positioning for maximum visibility
            if (dropdownMenu.classList.contains('active')) {
                const buttonRect = actionTarget.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;
                const dropdownHeight = 120; // Estimated dropdown height
                const dropdownWidth = 180; // Dropdown width from CSS
                
                // Calculate optimal position
                let top = buttonRect.bottom + 8;
                let left = buttonRect.right - dropdownWidth;
                
                // Adjust if dropdown would go below viewport
                if (top + dropdownHeight > viewportHeight) {
                    top = buttonRect.top - dropdownHeight - 8;
                }
                
                // Adjust if dropdown would go beyond left edge
                if (left < 8) {
                    left = buttonRect.left;
                }
                
                // Adjust if dropdown would go beyond right edge
                if (left + dropdownWidth > viewportWidth - 8) {
                    left = viewportWidth - dropdownWidth - 8;
                }
                
                // Apply fixed positioning
                dropdownMenu.style.position = 'fixed';
                dropdownMenu.style.top = `${top}px`;
                dropdownMenu.style.left = `${left}px`;
                dropdownMenu.style.right = 'auto';
                dropdownMenu.style.bottom = 'auto';
            }
            break;
        case "copy-all": 
            if (themeIndex !== -1 && themes[themeIndex] && themes[themeIndex].keywords && themes[themeIndex].keywords.length > 0) {
                const keywordsText = themes[themeIndex].keywords.join(", ");
                copyToClipboard(keywordsText, "Semua keywords disalin!", "Gagal menyalin keywords!");
            } else {
                showToast("Tidak ada keywords untuk disalin!");
            }
            break;
        case "edit": 
            editingId = id; 
            // Optimasi: Re-render hanya row yang sedang diedit
            const editRow = actionTarget.closest('tr');
            if (themeIndex !== -1) {
                const editRowIndex = Array.from(editRow.parentNode.children).indexOf(editRow);
                const editRowHTML = renderEditRow(themes[themeIndex], editRowIndex);
                editRow.outerHTML = editRowHTML;
            }
            break;
        case "delete":
            if (confirm(`Hapus tema "${themes[themeIndex].theme}"?`)) {
                if (isLoading) {
                  return showToast("Sedang memproses, mohon tunggu...", 'warning');
                }
                
                // Optimasi: Hapus dari DOM langsung tanpa re-render
                const row = actionTarget.closest('tr');
                row.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                row.style.opacity = '0';
                row.style.transform = 'translateX(-20px)';
                
                setTimeout(async () => {
                    try {
                        setLoadingState(true);
                        
                        await supabaseService.deleteTheme(id);
                        
                        themes.splice(themeIndex, 1);
                        
                        // Update counter dan pagination tanpa full re-render
                        DOMElements.totalThemesCounter.textContent = themes.length;
                        updateCategoryDropdown();
                        
                        // Hanya re-render jika halaman current menjadi kosong
                        const remainingItems = document.querySelectorAll('#themeTableBody tr:not(.editing-row):not(.skeleton-row)').length - 1;
                        if (remainingItems === 0 && currentPage > 1) {
                            currentPage--;
                            renderThemes();
                        } else {
                            row.remove();
                            updateRowNumbers(); // Update nomor urut setelah hapus
                            updateBulkActionUI();
                        }
                        
                        showToast("Tema berhasil dihapus!", 'success');
                        
                    } catch (error) {
                        console.error('Error deleting theme:', error);
                        showToast('Gagal menghapus tema: ' + error.message, 'error');
                        // Restore row visibility on error
                        row.style.opacity = '1';
                        row.style.transform = 'translateX(0)';
                    } finally {
                        setLoadingState(false);
                    }
                }, 300);
            }
            break;
        case "save":
            if (isLoading) {
              return showToast("Sedang memproses, mohon tunggu...", 'warning');
            }
            
            const row = actionTarget.closest('tr');
            const newTitle = row.querySelector('.edit-theme-title').value.trim();
            const newKeywords = parseKeywords(row.querySelector('.edit-textarea').value);
            const categorySelect = row.querySelector('.edit-category-select');
            const customCategoryInput = row.querySelector('.edit-custom-category');
            let newCategory = categorySelect.value === 'custom' ? customCategoryInput.value.trim() : categorySelect.value;
            
            if (!newTitle || newKeywords.length === 0 || !newCategory) {
              return showToast("Judul, Kategori, dan Keywords tidak boleh kosong.", 'error');
            }
            
            // Animasi: fade out row lama
            row.style.transition = 'opacity 0.2s ease-out';
            row.style.opacity = '0';
            
            setTimeout(async () => {
                try {
                    setLoadingState(true);
                    
                    const themeData = {
                        theme: newTitle,
                        category: newCategory,
                        keywords: newKeywords
                    };
                    
                    const updatedTheme = await supabaseService.updateTheme(id, themeData);
                    
                    // Update tema dalam array lokal
                    const updatedThemeWithOrder = { ...updatedTheme };
                    
                    // Hapus tema dari posisi lama
                    themes.splice(themeIndex, 1);
                    
                    // Tambahkan tema yang sudah diedit ke posisi teratas
                    themes.unshift(updatedThemeWithOrder);
                    
                    editingId = null;
                    updateCategoryDropdown();
                    
                    // Reset ke halaman pertama untuk menunjukkan data yang baru diedit
                    currentPage = 1;
                    renderThemes();
                    showToast("Tema berhasil diperbarui dan dipindah ke atas!", 'success');
                    
                } catch (error) {
                    console.error('Error updating theme:', error);
                    showToast('Gagal memperbarui tema: ' + error.message, 'error');
                    
                    // Restore row visibility on error
                    row.style.opacity = '1';
                } finally {
                    setLoadingState(false);
                }
            }, 200);
            break;
    }
  }
  
  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================
  
  // Fungsi helper untuk copy to clipboard dengan fallback
  const copyToClipboard = (text, successMessage, errorMessage) => {
    if (!text || text.trim() === '') {
      showToast(errorMessage || "Tidak ada teks untuk disalin!");
      return Promise.reject(new Error("Empty text"));
    }
    
    if (navigator.clipboard && window.isSecureContext) {
      // Metode modern untuk HTTPS/localhost
      return navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage || "Teks berhasil disalin!");
      }).catch((err) => {
        console.error('Modern clipboard failed:', err);
        return fallbackCopyToClipboard(text, successMessage, errorMessage);
      });
    } else {
      // Fallback untuk browser lama atau non-HTTPS
      return fallbackCopyToClipboard(text, successMessage, errorMessage);
    }
  };
  
  const fallbackCopyToClipboard = (text, successMessage, errorMessage) => {
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          showToast(successMessage || "Teks berhasil disalin!");
          resolve();
        } else {
          showToast(errorMessage || "Gagal menyalin teks!");
          reject(new Error('Copy command failed'));
        }
      } catch (err) {
        document.body.removeChild(textArea);
        showToast(errorMessage || "Gagal menyalin teks!");
        reject(err);
      }
    });
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  // Show skeleton screen immediately
  showSkeletonScreen();
  
  // Initialize Supabase Service
  async function initializeApp() {
    try {
      supabaseService = new SupabaseService();
      await supabaseService.init();
      
      showConnectionStatus();
      
      // Check for local data that needs migration
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData && supabaseService.isConnected) {
        const shouldMigrate = confirm(
          'Ditemukan data lokal. Apakah Anda ingin memindahkan data ke Supabase? '
          + 'Data lokal akan tetap ada sebagai backup.'
        );
        
        if (shouldMigrate) {
          const migrationResult = await supabaseService.migrateFromLocalStorage();
          if (migrationResult.success) {
            showToast(`Migrasi berhasil: ${migrationResult.migrated} tema dipindahkan`, 'success');
          } else {
            showToast(`Migrasi gagal: ${migrationResult.message}`, 'error');
          }
        }
      }
      
      // Load themes
      await loadThemes();
      updateCategoryDropdown();
      renderThemes();
      setupEventListeners();
      
    } catch (error) {
      console.error('App initialization error:', error);
      showToast('Gagal inisialisasi aplikasi: ' + error.message, 'error');
      hideSkeletonScreen();
    }
  }
  
  // Initialize Web Worker
  try {
    webWorker = new Worker('js/worker.js');
    webWorker.onmessage = function(e) {
      const { success, filteredThemes, error } = e.data;
      if (success) {
        hideSkeletonScreen();
        renderFilteredThemes(filteredThemes);
      } else {
        console.error('Web Worker error:', error);
        hideSkeletonScreen();
        renderThemesSync(); // Fallback
      }
    };
  } catch (error) {
    console.warn('Web Worker not supported or failed to load:', error);
    webWorker = null;
  }

  // Start app initialization
  initializeApp();
})();