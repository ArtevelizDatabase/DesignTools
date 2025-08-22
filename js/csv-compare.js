document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT (Global Variables) ---
    let theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    let datasets = [];
    let titleColumn = '';
    let valueColumn = '';
    let idColumn = '';
    let urlColumn = '';
    let fallbackCategoryColumn = '';
    let activeTab = 'summary';
    let chartOrientation = 'horizontal'; // Chart orientation: 'horizontal' or 'vertical'
    let chartMode = 'stacked'; // Chart mode: 'stacked' or 'grouped' 
    let focusedArtboard = null; // Track which artboard is being focused on
    let editableKeywords = [
        'Admin Dashboard', 'Annual Report', 'Bifold Brochure', 'Trifold Brochure',
        'Brochure', 'Business Card', 'Company Profile', 'Certificate', 'CV Resume',
        'Dashboard', 'Data Sheet', 'Email Newsletter', 'Flyer Set', 'Flyer',
        'Gift Voucher', 'Graphic', 'Hero Header', 'Illustration', 'Instagram Post',
        'Instagram Story', 'Invoice', 'Landing Page', 'Mobile Apps', 'Mockup',
        'Presentation', 'Social Media', 'Text Effect', 'background', 'collection',
        'Font', 'form', 'texture', 'Calendar'
    ];
    let allArtboards = [];
    let selectedArtboards = new Set();
    let sortConfig = { key: 'totalValue', direction: 'descending' };
    let mergeFiles = true;
    let baseFile = 'all';
    let comparisonChart = null; // To hold the Chart.js instance
    
    // Sorting config for comparison table
    let comparisonSortConfig = { 
        sourceIndex: 0, // Index of source to sort by
        column: 'total', // 'total' or 'average' 
        direction: 'desc' // 'asc' or 'desc'
    };

    // --- DOM ELEMENT REFERENCES ---
    const dom = {
        html: document.documentElement,
        fileInput: document.getElementById('file-input'),
        mergeFilesCheckbox: document.getElementById('merge-files-checkbox'),
        contentArea: document.getElementById('content-area'),
        tabsNav: document.getElementById('tabs-nav'),
        summaryTabContent: document.getElementById('summary-tab-content'),
        detailsTabContent: document.getElementById('details-tab-content'),
        unpopularTabContent: document.getElementById('unpopular-tab-content'),
        settingsTabContent: document.getElementById('settings-tab-content'),
        modalContainer: document.getElementById('modal-container'),
        modalTitle: document.getElementById('modal-title'),
        modalList: document.getElementById('modal-list'),
        modalCloseButton: document.getElementById('modal-close-button'),
        uploadHeader: document.getElementById('upload-header'),
        messageArea: document.getElementById('message-area'),
    };

    // --- ICONS (SVG Strings) ---
    const icons = {
        Upload: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 text-indigo-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
        Award: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88"/></svg>`,
        Table: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.37 3.63a2.12 2.12 0 1 1 3 3L12 16l-4 1 1-4Z"/></svg>`,
        TrendingDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`,
        Settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
        BarChart2: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 text-blue-500"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        Filter: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
        Lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-yellow-500"><path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 8A6 6 0 0 0 6 8c0 1 .3 2.2 1.5 3.5.7.7 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
        Info: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 text-blue-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        X: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        Moon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
        Sun: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
        ChevronsUpDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 ml-2"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>`,
        ArrowUp: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
        ArrowDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 ml-2"><path d="M19 12H5"/><path d="m12 19 7-7-7-7"/></svg>`,
    };

    // --- UTILITIES & HELPERS ---
    const displayMessage = (message, type = 'info') => {
        dom.messageArea.textContent = message;
        dom.messageArea.classList.remove('hidden', 'bg-red-100', 'bg-yellow-100', 'text-red-700', 'text-yellow-700', 'border-red-200', 'border-yellow-200');
        dom.messageArea.classList.add('block');
        if (type === 'warning') {
            dom.messageArea.classList.add('bg-yellow-100', 'text-yellow-700', 'border-yellow-200');
        } else if (type === 'error') {
            dom.messageArea.classList.add('bg-red-100', 'text-red-700', 'border-red-200');
        } else {
            // Default to info style if needed, or just use base styling
            dom.messageArea.classList.add('bg-blue-100', 'text-blue-700', 'border-blue-200');
        }
    };

    const hideMessage = () => {
        dom.messageArea.classList.add('hidden');
        dom.messageArea.textContent = '';
    };

    const FALLBACK_MAP = {
        'presentation-templates': 'Presentation',
        'graphic-templates': 'Graphic',
        'fonts': 'Font'
    };
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF80E9', '#A45D5D', '#5DA4A4'];

    const parseCsv = (csvText) => {
        try {
            const lines = csvText.trim().split('\n');
            if (lines.length < 2) return { headers: [], data: [] };
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const data = lines.slice(1).map(line => {
                const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
                const rowObject = {};
                headers.forEach((header, index) => {
                    let value = values[index] ? values[index].trim() : '';
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    rowObject[header] = value;
                });
                return rowObject;
            });
            return { headers, data };
        } catch (error) { console.error("Error parsing CSV:", error); return { headers: [], data: [] }; }
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '$0.00';
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    };

    const extractArtboard = (row, titleCol, fallbackCatCol, keywordsList) => {
        const fallbackCategory = row[fallbackCatCol] || '';
        const lowerFallback = fallbackCategory.toLowerCase();

        if (lowerFallback === 'presentation-templates') return 'Presentation';
        if (lowerFallback === 'fonts') return 'Font';

        const title = row[titleCol] || '';
        const lowerTitle = title.toLowerCase();
        const sortedKeywords = Array.isArray(keywordsList) ? [...keywordsList].sort((a, b) => b.length - a.length) : [];
        for (const keyword of sortedKeywords) {
            if (keyword && lowerTitle.includes(keyword.toLowerCase())) return keyword;
        }

        if (FALLBACK_MAP[lowerFallback]) return FALLBACK_MAP[lowerFallback];
        return 'Lainnya';
    };
    
    // --- DATA PROCESSING LOGIC ---
    const getProcessedDatasets = () => {
        if (mergeFiles && datasets.length > 1) {
            const allData = datasets.flatMap(ds => ds.data);
            const mergedName = 'Gabungan Semua File';
            return [{ name: mergedName, headers: datasets[0]?.headers || [], data: allData }];
        }
        return datasets;
    };

    const calculateSummaryData = () => {
        const processed = getProcessedDatasets();
        if (!titleColumn || !valueColumn || !idColumn || !processed || processed.length === 0) return [];

        const keywords = editableKeywords.sort((a, b) => b.length - a.length);
        const summary = {};
        processed.forEach(ds => {
            if (!ds.data) return;
            ds.data.forEach(row => {
                const artboard = extractArtboard(row, titleColumn, fallbackCategoryColumn, keywords);
                const value = parseFloat(row[valueColumn]);
                if (artboard && !isNaN(value)) {
                    if (!summary[artboard]) summary[artboard] = { totalValue: 0, uniqueIds: new Set(), items: new Set() };
                    summary[artboard].totalValue += value;
                    if (row[idColumn]) summary[artboard].uniqueIds.add(row[idColumn]);
                    if (row[titleColumn]) summary[artboard].items.add({ title: row[titleColumn], url: row[urlColumn] });
                }
            });
        });

        let summaryArray = Object.keys(summary).map(artboard => {
            const itemCount = summary[artboard].uniqueIds.size;
            const totalValue = summary[artboard].totalValue;
            return {
                artboard,
                itemCount: itemCount,
                totalValue: totalValue,
                averageValue: itemCount > 0 ? totalValue / itemCount : 0,
                items: Array.from(summary[artboard].items)
            };
        });

        summaryArray.sort((a, b) => {
            const key = sortConfig.key;
            const direction = sortConfig.direction === 'ascending' ? 1 : -1;
            if (a[key] < b[key]) return -1 * direction;
            if (a[key] > b[key]) return 1 * direction;
            return 0;
        });
        return summaryArray;
    };

    const calculateComparisonData = () => {
        if (!titleColumn || !valueColumn || !idColumn || !datasets || datasets.length === 0) return { results: [], sourceNames: [], totals: {} };

        const keywords = editableKeywords.sort((a, b) => b.length - a.length);
        const aggregated = {};

        let sourcesToCompare = datasets;
        if (baseFile !== 'all' && datasets.length > 1) {
            const baseDataset = datasets.find(ds => ds.name === baseFile);
            const otherDatasets = datasets.filter(ds => ds.name !== baseFile);
            const otherCombinedData = { name: 'Lainnya (Gabungan)', data: otherDatasets.flatMap(ds => ds.data) };
            sourcesToCompare = baseDataset ? [baseDataset, otherCombinedData] : [otherCombinedData];
        }

        sourcesToCompare.forEach(dataset => {
            if (!dataset.data) return;
            dataset.data.forEach(row => {
                const artboard = extractArtboard(row, titleColumn, fallbackCategoryColumn, keywords);
                if (artboard && selectedArtboards.has(artboard)) {
                    const value = parseFloat(row[valueColumn]);
                    const id = row[idColumn];
                    const title = row[titleColumn];
                    const url = row[urlColumn];
                    if (!isNaN(value)) {
                        if (!aggregated[artboard]) aggregated[artboard] = {};
                        if (!aggregated[artboard][dataset.name]) {
                            aggregated[artboard][dataset.name] = { totalValue: 0, uniqueIds: new Set(), items: new Set() };
                        }
                        aggregated[artboard][dataset.name].totalValue += value;
                        if (id) aggregated[artboard][dataset.name].uniqueIds.add(id);
                        if (title) aggregated[artboard][dataset.name].items.add({ title, url });
                    }
                }
            });
        });

        const results = Object.keys(aggregated).map(artboard => {
            const dataBySource = {};
            Object.keys(aggregated[artboard]).forEach(sourceName => {
                const { totalValue, uniqueIds, items } = aggregated[artboard][sourceName];
                const itemCount = uniqueIds.size;
                dataBySource[sourceName] = {
                    total: totalValue,
                    count: itemCount,
                    average: itemCount > 0 ? totalValue / itemCount : 0,
                    items: Array.from(items)
                };
            });
            return { artboard, data: dataBySource };
        });

        const sourceNames = Array.from(new Set(results.flatMap(r => Object.keys(r.data))));
        
        // Apply sorting based on comparisonSortConfig
        if (sourceNames.length > 0) {
            const sortSourceName = sourceNames[comparisonSortConfig.sourceIndex] || sourceNames[0];
            const sortColumn = comparisonSortConfig.column; // 'total' or 'average'
            const sortDirection = comparisonSortConfig.direction; // 'asc' or 'desc'
            
            results.sort((a, b) => {
                const valueA = a.data[sortSourceName]?.[sortColumn] || 0;
                const valueB = b.data[sortSourceName]?.[sortColumn] || 0;
                
                if (sortDirection === 'asc') {
                    return valueA - valueB;
                } else {
                    return valueB - valueA;
                }
            });
        } else {
            results.sort((a, b) => a.artboard.localeCompare(b.artboard));
        }

        const totals = {};
        sourceNames.forEach(name => {
            totals[name] = { total: 0, count: 0 };
        });
        results.forEach(item => {
            sourceNames.forEach(name => {
                if (item.data[name]) {
                    totals[name].total += item.data[name].total;
                    totals[name].count += item.data[name].count;
                }
            });
        });
        sourceNames.forEach(name => {
           totals[name].average = totals[name].count > 0 ? totals[name].total / totals[name].count : 0;
        });

        return { results, sourceNames, totals };
    };
    
    const calculateUnpopularItems = () => {
        if (!idColumn || !valueColumn || !datasets || datasets.length === 0) {
            return { list: [], byCategory: [], byArtboard: [] };
        }

        const allItems = {};

        datasets.forEach(ds => {
            if(!ds.data) return;
            ds.data.forEach(row => {
                const id = row[idColumn];
                const title = row[titleColumn] || 'Tanpa Judul';
                const value = parseFloat(row[valueColumn]) || 0;
                const url = row[urlColumn];
                const category = row[fallbackCategoryColumn] || 'Tidak Diketahui';
                const artboard = extractArtboard(row, titleColumn, fallbackCategoryColumn, editableKeywords);

                if (id) {
                    if (!allItems[id]) {
                        allItems[id] = { title, url, category, artboard, totalEarning: 0 };
                    }
                    allItems[id].totalEarning += value;
                }
            });
        });

        const zeroEarningItems = Object.entries(allItems)
            .filter(([id, data]) => data.totalEarning === 0)
            .map(([id, data]) => ({ id, ...data }));

        const byCategory = {};
        const byArtboard = {};

        zeroEarningItems.forEach(item => {
            byCategory[item.category] = (byCategory[item.category] || 0) + 1;
            byArtboard[item.artboard] = (byArtboard[item.artboard] || 0) + 1;
        });

        return {
            list: zeroEarningItems,
            byCategory: Object.entries(byCategory).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
            byArtboard: Object.entries(byArtboard).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
        };
    };

    const suggestKeywords = () => {
        const summaryData = calculateSummaryData();
        const dataToAnalyze = summaryData.filter(d => d.artboard === 'Lainnya' || d.artboard === 'Graphic');
        if (dataToAnalyze.length === 0) return [];
        const allItemsToAnalyze = dataToAnalyze.flatMap(d => d.items || []);
        if (allItemsToAnalyze.length === 0) return [];
    
        const wordCounts = {};
        const stopWords = new Set(['dan', 'the', 'for', 'a', 'of', 'in', 'with', 'on', 'template', 'effect', 'set', 'pack', 'and', 'or', 'is', 'are', 'to']);
        
        allItemsToAnalyze.forEach(item => {
            if (item.title) {
                item.title.toLowerCase().split(/\s+/).forEach(word => {
                    const cleanWord = word.replace(/[^a-z]/g, '');
                    if (cleanWord && cleanWord.length > 2 && !stopWords.has(cleanWord) && isNaN(cleanWord)) {
                        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
                    }
                });
            }
        });
    
        const existingKeywordParts = new Set(editableKeywords.flatMap(k => k.toLowerCase().split(/\s+/)));
        
        const sortedWords = Object.keys(wordCounts)
            .filter(word => !existingKeywordParts.has(word) && wordCounts[word] > 1)
            .sort((a, b) => wordCounts[b] - wordCounts[a]);
            
        return sortedWords.slice(0, 20);
    };

    // --- RENDER FUNCTIONS ---
    const render = () => {
        renderTabs();
        switch (activeTab) {
            case 'summary':
                renderSummaryTab();
                break;
            case 'details':
                renderDetailsTab();
                break;
            case 'unpopular':
                renderUnpopularTab();
                break;
            case 'settings':
                renderSettingsTab();
                break;
        }
    };

    const renderTabs = () => {
        const tabData = [
            { id: 'summary', label: 'Ringkasan', icon: icons.Award },
            { id: 'details', label: 'Detail Perbandingan', icon: icons.Table },
            { id: 'unpopular', label: 'Item Tidak Populer', icon: icons.TrendingDown },
            { id: 'settings', label: 'Pengaturan', icon: icons.Settings },
        ];
        dom.tabsNav.innerHTML = tabData.map(tab => `
            <button data-tab="${tab.id}" class="tab-button flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}">
                ${tab.icon}${tab.label}
            </button>
        `).join('');

        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`${activeTab}-tab-content`).classList.remove('hidden');
    };
    
    const renderSortableHeader = (label, columnKey) => {
        const isSorted = sortConfig.key === columnKey;
        const icon = isSorted ? (sortConfig.direction === 'ascending' ? icons.ArrowUp : icons.ArrowDown) : icons.ChevronsUpDown;
        return `
            <th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-600 sortable-header" data-key="${columnKey}">
                <div class="flex items-center justify-between">
                    ${label}
                    ${icon}
                </div>
            </th>
        `;
    };

    const renderSummaryTab = () => {
        const summaryData = calculateSummaryData();
        const html = `
            <h3 class="text-xl font-semibold mb-4">Ringkasan Kinerja Artboard</h3>
            <p class="text-sm text-gray-500 mb-4">Klik baris untuk detail, atau baris "Lainnya" untuk melihat daftar item.</p>
            <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
               <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                        <tr>
                            ${renderSortableHeader('Artboard/Keyword', 'artboard')}
                            ${renderSortableHeader('Jumlah Item', 'itemCount')}
                            ${renderSortableHeader('Total Earning', 'totalValue')}
                            ${renderSortableHeader('Rata-rata Earning', 'averageValue')}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        ${summaryData.map(item => `
                            <tr data-artboard='${JSON.stringify(item)}' class="summary-row hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                <td class="px-6 py-4 whitespace-nowrap font-medium ${item.artboard === 'Lainnya' ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-600 dark:text-indigo-400'} flex items-center">
                                    ${item.artboard}
                                    ${icons.Info}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center text-gray-700 dark:text-gray-300">${item.itemCount}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900 dark:text-white">${formatCurrency(item.totalValue)}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right font-semibold text-blue-600 dark:text-blue-400">${formatCurrency(item.averageValue)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        dom.summaryTabContent.innerHTML = html;
    };
    
    const renderDetailsTab = () => {
        const { results, sourceNames, totals } = calculateComparisonData();
        const html = `
            <div class="space-y-8">
                <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h2 class="text-2xl font-semibold flex items-center">${icons.BarChart2}Tabel & Grafik Perbandingan Rinci</h2>
                    <div class="flex items-center gap-2">
                        <label for="base-file-select" class="text-sm font-medium">Bandingkan:</label>
                        <select id="base-file-select" ${mergeFiles ? 'disabled' : ''} class="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50">
                            <option value="all" ${baseFile === 'all' ? 'selected' : ''}>Semua File vs Semua File</option>
                            ${datasets.map(ds => `<option value="${ds.name}" ${baseFile === ds.name ? 'selected' : ''}>${ds.name} vs Lainnya</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="p-4 border dark:border-gray-700 rounded-lg">
                    <h3 class="text-lg font-semibold mb-2 flex items-center">${icons.Filter}Filter Artboard</h3>
                    <div class="flex gap-4 mb-4">
                        <button id="select-all-artboards" class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Pilih Semua</button>
                        <button id="deselect-all-artboards" class="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Hapus Semua</button>
                    </div>
                    <div id="artboard-filter-list" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-48 overflow-y-auto">
                        ${allArtboards.map(board => `
                            <div class="flex items-center">
                                <input type="checkbox" id="filter-detail-${board}" data-board="${board}" class="artboard-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" ${selectedArtboards.has(board) ? 'checked' : ''}>
                                <label for="filter-detail-${board}" class="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate" title="${board}">${board}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <!-- Sorting Controls -->
                <div class="p-4 border dark:border-gray-700 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center">🔄 Urutkan Tabel</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Sort by Source -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urutkan berdasarkan Source:</label>
                            <select id="sort-source-select" class="w-full p-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                                ${sourceNames.map((sourceName, index) => `
                                    <option value="${index}" ${comparisonSortConfig.sourceIndex === index ? 'selected' : ''}>${sourceName}</option>
                                `).join('')}
                            </select>
                        </div>
                        <!-- Sort by Column -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urutkan berdasarkan:</label>
                            <select id="sort-column-select" class="w-full p-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                                <option value="total" ${comparisonSortConfig.column === 'total' ? 'selected' : ''}>💰 Total Earning</option>
                                <option value="average" ${comparisonSortConfig.column === 'average' ? 'selected' : ''}>📊 Rata-rata/Item</option>
                            </select>
                        </div>
                        <!-- Sort Direction -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urutan:</label>
                            <select id="sort-direction-select" class="w-full p-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                                <option value="desc" ${comparisonSortConfig.direction === 'desc' ? 'selected' : ''}>🔽 Tinggi ke Rendah</option>
                                <option value="asc" ${comparisonSortConfig.direction === 'asc' ? 'selected' : ''}>🔼 Rendah ke Tinggi</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-3 flex gap-2">
                        <button id="apply-sort" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            🔄 Terapkan Urutan
                        </button>
                        <button id="reset-sort" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            ↩️ Reset Default
                        </button>
                    </div>
                    <!-- Sort Status -->
                    <div id="sort-status" class="mt-2 text-sm text-blue-600 dark:text-blue-400">
                        📋 Diurutkan berdasarkan: ${sourceNames[comparisonSortConfig.sourceIndex] || 'N/A'} - ${comparisonSortConfig.column === 'total' ? 'Total Earning' : 'Rata-rata/Item'} (${comparisonSortConfig.direction === 'desc' ? 'Tinggi ke Rendah' : 'Rendah ke Tinggi'})
                    </div>
                </div>
                <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                            <tr>
                                <th rowspan="2" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider align-bottom border-b border-r border-gray-300 dark:border-gray-600">Artboard/Keyword</th>
                                ${sourceNames.map(sourceName => `<th colspan="2" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600">${sourceName}</th>`).join('')}
                            </tr>
                            <tr>
                                ${sourceNames.map((sourceName, sourceIndex) => {
                                    const isCurrentSort = comparisonSortConfig.sourceIndex === sourceIndex;
                                    const totalSortIcon = isCurrentSort && comparisonSortConfig.column === 'total' 
                                        ? (comparisonSortConfig.direction === 'desc' ? '🔽' : '🔼')
                                        : '↕️';
                                    const avgSortIcon = isCurrentSort && comparisonSortConfig.column === 'average'
                                        ? (comparisonSortConfig.direction === 'desc' ? '🔽' : '🔼')
                                        : '↕️';
                                    
                                    return `
                                        <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 sort-header" 
                                            data-source-index="${sourceIndex}" data-column="total" title="Klik untuk mengurutkan Total Earning">
                                            Total Earning ${totalSortIcon}
                                        </th>
                                        <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 sort-header" 
                                            data-source-index="${sourceIndex}" data-column="average" title="Klik untuk mengurutkan Rata-rata/Item">
                                            Rata-rata/Item ${avgSortIcon}
                                        </th>
                                    `;
                                }).join('')}
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            ${results.map(item => `
                                <tr class="details-row hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" data-artboard='${JSON.stringify(item)}'>
                                    <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white flex items-center">
                                        ${item.artboard}
                                        ${icons.Info}
                                    </td>
                                    ${sourceNames.map(sourceName => {
                                        const sourceData = item.data[sourceName];
                                        return `
                                            <td class="px-4 py-4 whitespace-nowrap text-right text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">${sourceData ? formatCurrency(sourceData.total) : '$0.00'}</td>
                                            <td class="px-4 py-4 whitespace-nowrap text-right font-semibold text-blue-600 dark:text-blue-400 border-r border-gray-200 dark:border-gray-700">${sourceData ? formatCurrency(sourceData.average) : '$0.00'}</td>
                                        `;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="row" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-t border-r border-gray-300 dark:border-gray-600">Grand Total</th>
                                ${sourceNames.map(sourceName => {
                                    const totalData = totals[sourceName];
                                    return `
                                        <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white border-t border-r border-gray-300 dark:border-gray-600">${totalData ? formatCurrency(totalData.total) : '$0.00'}</td>
                                        <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-500 dark:text-gray-400 border-t border-r border-gray-300 dark:border-gray-600">-</td>
                                    `;
                                }).join('')}
                            </tr>
                             <tr>
                                <th scope="row" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-t border-r border-gray-300 dark:border-gray-600">After Tax (15%)</th>
                                ${sourceNames.map(sourceName => {
                                    const totalData = totals[sourceName];
                                    const afterTaxTotal = totalData ? totalData.total * 0.85 : 0;
                                    return `
                                        <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-green-600 dark:text-green-400 border-t border-r border-gray-300 dark:border-gray-600">${formatCurrency(afterTaxTotal)}</td>
                                        <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-500 dark:text-gray-400 border-t border-r border-gray-300 dark:border-gray-600">-</td>
                                    `;
                                }).join('')}
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div class="chart-wrapper w-full mt-8">
                    <!-- Enhanced Chart Controls -->
                    <div class="chart-controls">
                        <div class="flex items-center gap-4">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                                📊 <span class="ml-2">Visualisasi Data ${chartMode === 'stacked' ? '(Bertumpuk)' : '(Perbandingan)'}</span>
                                ${focusedArtboard ? `<span class="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">Fokus: ${focusedArtboard}</span>` : ''}
                            </h3>
                        </div>
                        <div class="flex items-center gap-6 flex-wrap">
                            <!-- Mode Controls -->
                            <div class="flex items-center gap-2">
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Mode:</label>
                                <button id="chart-stacked-btn" class="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${chartMode === 'stacked' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}">
                                    📚 Bertumpuk
                                </button>
                                <button id="chart-grouped-btn" class="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${chartMode === 'grouped' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}">
                                    📊 Perbandingan
                                </button>
                            </div>
                            <!-- Orientation Controls -->
                            <div class="flex items-center gap-2">
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Orientasi:</label>
                                <button id="chart-horizontal-btn" class="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${chartOrientation === 'horizontal' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}">
                                    ↔️ Horizontal
                                </button>
                                <button id="chart-vertical-btn" class="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${chartOrientation === 'vertical' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}">
                                    ↕️ Vertikal
                                </button>
                            </div>
                            <!-- Reset Focus Button -->
                            ${focusedArtboard ? `
                            <div class="flex items-center gap-2">
                                <button id="chart-reset-focus-btn" class="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 bg-red-500 text-white hover:bg-red-600">
                                    🔄 Reset Fokus
                                </button>
                            </div>
                            ` : ''}
                        </div>
                        ${chartMode === 'grouped' && !focusedArtboard ? `
                        <div class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <p class="text-sm text-blue-700 dark:text-blue-300">
                                💡 <strong>Tip:</strong> Klik pada bar chart untuk fokus ke artboard tertentu dan melihat perbandingan detail antar CSV
                            </p>
                        </div>
                        ` : ''}
                    </div>
                    <div id="chart-container" class="chart-container">
                        <canvas id="comparison-chart-canvas"></canvas>
                    </div>
                </div>
            </div>
        `;
        dom.detailsTabContent.innerHTML = html;
        renderComparisonChart();
        applyZeroValueStyling();
    };

    const renderComparisonChart = () => {
        const { results, sourceNames } = calculateComparisonData();
        
        // Filter data jika ada fokus artboard
        let chartData = results.map(item => {
            const chartItem = { artboard: item.artboard };
            sourceNames.forEach(sourceName => {
                chartItem[sourceName] = item.data[sourceName]?.total || 0;
            });
            return chartItem;
        });
        
        // Jika ada fokus artboard, filter hanya artboard tersebut
        if (focusedArtboard) {
            chartData = chartData.filter(item => item.artboard === focusedArtboard);
        }

        const canvas = document.getElementById('comparison-chart-canvas');
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        // Enhanced calculation for better chart layout
        const numberOfItems = chartData.length;
        const isHorizontal = chartOrientation === 'horizontal';
        const isStacked = chartMode === 'stacked';
        
        // Dynamic sizing based on orientation and mode dengan spacing yang lebih baik
        let chartWidth, chartHeight;
        const baseBarThickness = isHorizontal ? (isStacked ? 16 : 10) : (isStacked ? 12 : 8);
        
        // Sesuaikan thickness berdasarkan jumlah dataset untuk menghindari tumpang tindih
        const datasetCount = sourceNames.length;
        const adjustedThickness = isStacked ? baseBarThickness : Math.max(8, baseBarThickness - (datasetCount - 1) * 2);
        const barThickness = adjustedThickness;
        
        const categorySpacing = isHorizontal ? 50 : 60; // Lebih banyak spacing antar kategori (keyword) agar tidak saling tumpuk
        const paddingVertical = 220; // Lebih banyak padding untuk legend dan labels agar tidak tumpang tindih
        const paddingHorizontal = 200; // Lebih banyak padding untuk labels yang panjang dan ruang visual yang lega
        
        if (isHorizontal) {
            // Horizontal bars - tinggi tergantung jumlah item dengan spacing yang cukup
            const barGroupHeight = isStacked ? barThickness : (barThickness * datasetCount + (datasetCount - 1) * 8); // Lebih banyak ruang antar bar dalam group
            const baseHeight = barGroupHeight + categorySpacing;
            const totalHeight = numberOfItems * baseHeight + paddingVertical;
            chartHeight = Math.max(650, Math.min(1400, totalHeight)); // Min 650, max 1400 untuk ruang yang lebih lega
            chartWidth = 1300; // Lebih lebar untuk horizontal agar tidak cramped
        } else {
            // Vertical bars - lebar tergantung jumlah item dengan spacing yang cukup
            const barGroupWidth = isStacked ? barThickness : (barThickness * datasetCount + (datasetCount - 1) * 8); // Lebih banyak ruang antar bar dalam group
            const baseWidth = barGroupWidth + categorySpacing;
            const totalWidth = numberOfItems * baseWidth + paddingHorizontal;
            chartWidth = Math.max(1100, Math.min(2000, totalWidth)); // Min 1100, max 2000 untuk ruang yang lebih lega
            chartHeight = 800; // Lebih tinggi untuk vertical agar proporsi bagus
        }
        
        // Set canvas dimensions
        canvas.style.width = chartWidth + 'px';
        canvas.style.height = chartHeight + 'px';
        canvas.style.display = 'block';

        // Destroy existing chart
        if (comparisonChart) {
            comparisonChart.destroy();
        }

        // Soft pastel color palette with very distinct differences and better contrast
        const pastelColors = [
            '#FF9AA2',  // Soft Coral Pink
            '#B5EAD7',  // Mint Green  
            '#C7CEEA',  // Lavender
            '#FFD3A5',  // Light Peach
            '#AEC6CF',  // Powder Blue
            '#F8BBD9',  // Soft Rose
            '#A8E6CF',  // Sage Green
            '#E6E6FA',  // Light Lavender
            '#FFE4B5',  // Moccasin
            '#D1C4E9',  // Light Purple
            '#C8E6C9',  // Light Green
            '#FFCCCB',  // Light Pink
            '#B0E0E6',  // Powder Blue Light
            '#F0E68C',  // Khaki
            '#DDA0DD',  // Plum
            '#98FB98'   // Pale Green
        ];

        Chart.register(ChartZoom);
        comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => {
                    // Better label handling - show more context but still truncate if needed
                    const label = d.artboard;
                    return label.length > 18 ? label.substring(0, 15) + '...' : label;
                }),
                datasets: sourceNames.map((name, index) => ({
                    label: name,
                    data: chartData.map(d => d[name]),
                    backgroundColor: pastelColors[index % pastelColors.length],
                    borderColor: pastelColors[index % pastelColors.length],
                    borderWidth: 0, // Clean look without borders for modern appearance
                    borderRadius: 0, // No rounded corners for clean, traditional bar chart look
                    borderSkipped: false,
                    barThickness: barThickness,
                    maxBarThickness: barThickness,
                    categoryPercentage: isStacked ? 0.4 : 0.6, // Lebih banyak ruang antar kategori (keyword) untuk menghindari tumpukan
                    barPercentage: isStacked ? 0.5 : 0.7, // Lebih banyak ruang antar bar dalam kategori yang sama
                }))
            },
            options: {
                indexAxis: isHorizontal ? 'y' : 'x', // Dynamic orientation
                responsive: true,
                maintainAspectRatio: false,
                datasets: {
                    bar: {
                        categoryPercentage: isStacked ? 0.4 : 0.6, // Global setting untuk ruang kategori yang optimal dengan jarak lebih lebar
                        barPercentage: isStacked ? 0.5 : 0.7, // Global setting untuk ruang bar yang optimal dalam kategori
                    }
                },
                interaction: {
                    intersect: true,  // Hanya trigger saat mouse tepat di atas bar
                    mode: 'point',    // Mode point untuk presisi yang lebih baik
                    includeInvisible: false, // Jangan include elemen yang tidak terlihat
                    axis: false       // Jangan include area axis dalam deteksi
                },
                layout: {
                    padding: {
                        left: 80,   // Lebih banyak padding kiri untuk label yang panjang dan tidak tumpang tindih
                        right: 80,  // Lebih banyak padding kanan untuk ruang legend yang lega
                        top: 80,    // Lebih banyak padding atas untuk legend dan title yang tidak cramped
                        bottom: 80  // Lebih banyak padding bawah untuk label dan axis yang rapi
                    }
                },
                onClick: (event, elements) => {
                    // Handle chart click untuk fokus pada artboard tertentu
                    if (elements.length > 0 && chartMode === 'grouped') {
                        const elementIndex = elements[0].index;
                        const clickedArtboard = chartData[elementIndex]?.artboard;
                        if (clickedArtboard && !focusedArtboard) {
                            focusedArtboard = clickedArtboard;
                            renderDetailsTab(); // Re-render dengan fokus baru
                        }
                    }
                },
                onHover: (event, elements) => {
                    // Ubah cursor saat hover di atas bar
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                },
                scales: {
                    [isHorizontal ? 'x' : 'y']: { // Value axis
                        beginAtZero: true,
                        stacked: isStacked, // Dynamic stacking based on mode
                        grid: {
                            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            lineWidth: 1,
                            drawBorder: true
                        },
                        ticks: {
                            callback: (value) => {
                                if (value === 0) return '$0';
                                if (value >= 1000000) return '$' + (value/1000000).toFixed(1) + 'M';
                                if (value >= 1000) return '$' + (value/1000).toFixed(0) + 'K';
                                return '$' + Math.round(value);
                            },
                            color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                            font: {
                                size: 14, // Larger font for better readability
                                weight: '600',
                                family: 'Inter, system-ui, sans-serif'
                            },
                            maxTicksLimit: isHorizontal ? 8 : 10,
                            padding: 40 // Lebih banyak padding untuk ruang visual yang lebih baik dan tidak tumpang tindih
                        },
                        title: {
                            display: true,
                            text: `Total Earnings (USD) - ${isStacked ? 'Bertumpuk' : 'Perbandingan'}${focusedArtboard ? ` (Fokus: ${focusedArtboard})` : ''}`,
                            color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                            font: {
                                size: 15, // Larger title font
                                weight: 'bold',
                                family: 'Inter, system-ui, sans-serif'
                            },
                            padding: 45 // Lebih banyak padding untuk title yang tidak tumpang tindih dengan chart dan legend
                        }
                    },
                    [isHorizontal ? 'y' : 'x']: { // Category axis
                        stacked: isStacked, // Dynamic stacking based on mode
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                            font: {
                                size: 14, // Larger font for better readability
                                weight: '600',
                                family: 'Inter, system-ui, sans-serif'
                            },
                            padding: 45, // Lebih banyak padding untuk category labels agar tidak tumpang tindih antar keyword
                            callback: function(value, index, values) {
                                const originalLabel = chartData[index]?.artboard || this.getLabelForValue(value);
                                // For horizontal charts, we might want to limit the displayed text
                                if (isHorizontal && originalLabel.length > 20) {
                                    return originalLabel.substring(0, 17) + '...';
                                }
                                return originalLabel;
                            }
                        }
                    }
                },
                plugins: {
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy',
                        },
                        pan: {
                            enabled: true,
                            mode: 'xy',
                        }
                    },
                    legend: {
                        position: 'top',
                        align: 'start',
                        labels: {
                            color: theme === 'dark' ? '#e5e7eb' : '#374151',
                            font: {
                                size: 14, // Larger legend font
                                weight: 'bold',
                                family: 'Inter, system-ui, sans-serif'
                            },
                            padding: 45, // Lebih banyak padding untuk legend yang tidak tumpang tindih dengan spacing yang optimal
                            usePointStyle: true,
                            pointStyle: 'rectRounded',
                            boxWidth: 14, // Larger legend boxes
                            boxHeight: 14,
                            generateLabels: function(chart) {
                                const original = Chart.defaults.plugins.legend.labels.generateLabels;
                                const labels = original.call(this, chart);
                                
                                // Add dataset totals to legend with better formatting
                                labels.forEach((label, index) => {
                                    const dataset = chart.data.datasets[index];
                                    const total = dataset.data.reduce((sum, value) => sum + value, 0);
                                    const formattedTotal = new Intl.NumberFormat('en-US', { 
                                        style: 'currency', 
                                        currency: 'USD',
                                        notation: 'compact',
                                        maximumFractionDigits: 1
                                    }).format(total);
                                    label.text += ` (${formattedTotal})`;
                                });
                                
                                return labels;
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        titleColor: theme === 'dark' ? '#f9fafb' : '#111827',
                        bodyColor: theme === 'dark' ? '#d1d5db' : '#4b5563',
                        borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db',
                        borderWidth: 1,
                        cornerRadius: 14, // More rounded corners
                        padding: 16, // More padding
                        titleFont: {
                            size: 15, // Larger title
                            weight: 'bold',
                            family: 'Inter, system-ui, sans-serif'
                        },
                        bodyFont: {
                            size: 14, // Larger body text
                            weight: '500',
                            family: 'Inter, system-ui, sans-serif'
                        },
                        displayColors: true,
                        usePointStyle: true,
                        animationDuration: 0, // No animation for more precise tooltip
                        filter: function(tooltipItem) {
                            // Hanya tampilkan tooltip jika mouse tepat di atas bar
                            return true;
                        },
                        callbacks: {
                            title: (context) => {
                                // Show full artboard name in tooltip
                                const index = context[0].dataIndex;
                                return chartData[index]?.artboard || context[0].label;
                            },
                            label: (context) => {
                                const value = formatCurrency(context.raw);
                                return `${context.dataset.label}: ${value}`;
                            },
                            footer: (context) => {
                                // Show total untuk stacked, individual values untuk grouped
                                if (isStacked) {
                                    const total = context.reduce((sum, item) => sum + item.raw, 0);
                                    return `Total: ${formatCurrency(total)}`;
                                } else {
                                    // Untuk mode grouped, tampilkan tip untuk klik
                                    return !focusedArtboard ? 'Klik untuk fokus perbandingan' : '';
                                }
                            }
                        }
                    }
                },
                animation: {
                    duration: 1400, // Slightly longer animation
                    easing: 'easeInOutQuart',
                    delay: (context) => {
                        // Staggered animation for better visual effect
                        return context.dataIndex * 80;
                    }
                },
                elements: {
                    bar: {
                        borderWidth: 0, // Clean look without borders
                        borderSkipped: false,
                        borderRadius: 0, // Completely flat bars for traditional chart appearance
                    }
                }
            }
        });
    };
    
    const renderUnpopularTab = () => {
        const unpopular = calculateUnpopularItems();
        const html = `
            <div>
                <h3 class="text-xl font-semibold mb-6">Analisis Item Tidak Populer (Earning $0)</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h4 class="font-semibold mb-2">Berdasarkan Kategori</h4>
                        <div class="overflow-x-auto max-h-48 border dark:border-gray-700 rounded-lg">
                            <table class="w-full text-sm text-left">
                                <thead class="text-xs text-white uppercase bg-gray-700 dark:bg-gray-600 sticky top-0"><tr><th class="px-4 py-2">Kategori</th><th class="px-4 py-2 text-right">Jumlah</th></tr></thead>
                                <tbody>${unpopular.byCategory.map(c => `<tr class="border-b dark:border-gray-700"><td class="px-4 py-2">${c.name}</td><td class="px-4 py-2 text-right">${c.count}</td></tr>`).join('')}</tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Berdasarkan Artboard/Keyword</h4>
                        <div class="overflow-x-auto max-h-48 border dark:border-gray-700 rounded-lg">
                            <table class="w-full text-sm text-left">
                                <thead class="text-xs text-white uppercase bg-gray-700 dark:bg-gray-600 sticky top-0"><tr><th class="px-4 py-2">Artboard/Keyword</th><th class="px-4 py-2 text-right">Jumlah</th></tr></thead>
                                <tbody>${unpopular.byArtboard.map(a => `<tr class="border-b dark:border-gray-700"><td class="px-4 py-2">${a.name}</td><td class="px-4 py-2 text-right">${a.count}</td></tr>`).join('')}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <h4 class="font-semibold mb-2">Daftar Lengkap Item Tidak Populer</h4>
                <div class="overflow-x-auto max-h-[40vh]">
                   <table class="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                        <thead class="text-xs text-white uppercase bg-gray-700 dark:bg-gray-600 sticky top-0">
                            <tr>
                                <th class="px-6 py-3">ID Item</th>
                                <th class="px-6 py-3">Nama Item</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800">
                            ${unpopular.list.length > 0 ? unpopular.list.map(item => `
                                <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">${item.id}</td>
                                    <td class="px-6 py-4 font-medium">
                                        ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">${item.title}</a>` : `<span>${item.title}</span>`}
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="2" class="text-center py-10 text-gray-500">Tidak ada item tidak populer yang ditemukan.</td></tr>`}
                        </tbody>
                         <tfoot class="bg-gray-700 dark:bg-gray-600 text-white font-bold">
                            <tr>
                                <td class="px-6 py-3" colspan="2">Total Item Tidak Populer: ${unpopular.list.length}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        dom.unpopularTabContent.innerHTML = html;
    };

    const renderSettingsTab = () => {
        const suggested = suggestKeywords();
        const html = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 class="text-xl font-semibold mb-4 flex items-center">${icons.Settings}Manajemen Keyword</h3>
                    <div class="flex mb-2">
                        <input type="text" id="new-keyword-input" placeholder="Tambah keyword baru..." class="flex-grow p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md text-sm"/>
                        <button id="add-keyword-button" class="p-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700">Tambah</button>
                    </div>
                    <div id="keyword-list" class="flex flex-wrap gap-2 p-2 border dark:border-gray-600 rounded-md min-h-[100px] bg-gray-50 dark:bg-gray-900/50">
                        ${editableKeywords.map(k => `
                            <span class="flex items-center bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                ${k}
                                <button data-keyword="${k}" class="remove-keyword-button ml-2 text-indigo-400 hover:text-indigo-600">${icons.X.replace('width="24" height="24"', 'width="14" height="14"')}</button>
                            </span>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h3 class="text-xl font-semibold mb-4 flex items-center">${icons.Lightbulb}Saran Keyword</h3>
                    <p class="text-sm text-gray-500 mb-2">Berdasarkan item di 'Graphics' & 'Lainnya'. Klik untuk menambah.</p>
                    <div class="flex flex-wrap gap-2">
                        ${suggested.length > 0 ? suggested.map(k => `
                            <button data-keyword="${k}" class="suggested-keyword-button bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium px-2.5 py-0.5 rounded-full hover:bg-green-200 dark:hover:bg-green-800">
                                + ${k}
                            </button>
                        `).join('') : `<p class="text-sm text-gray-400">Tidak ada saran saat ini.</p>`}
                    </div>
                </div>
            </div>
        `;
        dom.settingsTabContent.innerHTML = html;
    };

    // --- EVENT HANDLERS ---
    const handleFileChange = (event) => {
        hideMessage(); // Clear any previous messages
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        let processedCount = 0;
        const newDatasets = [];
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const { headers, data } = parseCsv(text);
                newDatasets.push({ name: file.name, headers, data });
                processedCount++;
                if (processedCount === files.length) {
                    datasets = newDatasets;
                    if (newDatasets[0]?.headers) {
                        const h = newDatasets[0].headers;
                        const hLower = h.map(x => x.toLowerCase());
                        titleColumn = h[hLower.findIndex(x => x.includes('title') || x.includes('name') || x.includes('product'))] || '';
                        valueColumn = h[hLower.findIndex(x => x.includes('earning') || x.includes('sales') || x.includes('revenue'))] || '';
                        idColumn = h[hLower.findIndex(x => x.includes('id') || x.includes('item') || x.includes('sku'))] || '';
                        urlColumn = h[hLower.findIndex(x => x.includes('url') || x.includes('link') || x.includes('page'))] || '';
                        fallbackCategoryColumn = h[hLower.findIndex(x => x.includes('category') || x.includes('type'))] || '';

                        // Provide user feedback if critical columns are missing
                        const missingColumns = [];
                        if (!titleColumn) missingColumns.push('Title/Name/Product');
                        if (!valueColumn) missingColumns.push('Earning/Sales/Revenue');
                        if (!idColumn) missingColumns.push('ID/Item/SKU');

                        if (missingColumns.length > 0) {
                            displayMessage(`Peringatan: Kolom penting berikut tidak ditemukan di file CSV Anda: ${missingColumns.join(', ')}. Analisis mungkin tidak lengkap.`, 'warning');
                            dom.contentArea.classList.add('hidden'); // Hide content area if critical columns are missing
                            return; // Stop further processing
                        }
                    } else {
                        displayMessage('Peringatan: File CSV kosong atau tidak memiliki header yang valid.', 'warning');
                        dom.contentArea.classList.add('hidden');
                        return;
                    }
                    updateAllArtboards();
                    dom.contentArea.classList.remove('hidden');
                    render();
                }
            };
            reader.readAsText(file);
        });
    };
    
    const updateAllArtboards = () => {
        const processed = getProcessedDatasets();
        if (!titleColumn || !processed || processed.length === 0) return;
        const keywords = editableKeywords.sort((a, b) => b.length - a.length);
        const uniqueArtboards = new Set();
        processed.forEach(ds => {
            if(ds.data) {
                ds.data.forEach(row => uniqueArtboards.add(extractArtboard(row, titleColumn, fallbackCategoryColumn, keywords)))
            }
        });
        allArtboards = Array.from(uniqueArtboards).sort();
        selectedArtboards = new Set(allArtboards);
    };

    const handleTabClick = (e) => {
        const button = e.target.closest('.tab-button');
        if (button) {
            activeTab = button.dataset.tab;
            render();
        }
    };
    
    const handleSortRequest = (e) => {
        const header = e.target.closest('.sortable-header');
        if (header) {
            const key = header.dataset.key;
            let direction = 'ascending';
            if (sortConfig.key === key && sortConfig.direction === 'ascending') {
                direction = 'descending';
            }
            sortConfig = { key, direction };
            renderSummaryTab();
        }
    };
    
    const handleRowClick = (e) => {
        const row = e.target.closest('.summary-row, .details-row');
        if (!row) return;
        
        const itemData = JSON.parse(row.dataset.artboard);
        let items = [];
        if (itemData.items) {
            items = itemData.items;
        } else if (itemData.data) {
            items = Object.values(itemData.data).flatMap(sourceData => sourceData.items || []);
        }
        
        // Menampilkan semua item tanpa deduplikasi berdasarkan judul
        const itemsToShow = items;

        dom.modalTitle.textContent = `Item dalam Kategori "${itemData.artboard}"`;
        dom.modalList.innerHTML = itemsToShow.map(item => `
            <li class="text-gray-700 dark:text-gray-300">
                ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">${item.title}</a>` : `<span>${item.title} (URL tidak tersedia)</span>`}
            </li>
        `).join('');
        dom.modalContainer.classList.remove('hidden');
    };
    
    const handleSettingsClick = (e) => {
        // Add keyword
        if (e.target.id === 'add-keyword-button') {
            const input = document.getElementById('new-keyword-input');
            const newKeyword = input.value.trim();
            if (newKeyword && !editableKeywords.includes(newKeyword)) {
                editableKeywords.push(newKeyword);
                updateAllArtboards();
                renderSettingsTab();
            }
            input.value = '';
        }
        // Remove keyword
        const removeBtn = e.target.closest('.remove-keyword-button');
        if (removeBtn) {
            const keywordToRemove = removeBtn.dataset.keyword;
            editableKeywords = editableKeywords.filter(k => k !== keywordToRemove);
            updateAllArtboards();
            renderSettingsTab();
        }
        // Add suggested keyword
        const suggestBtn = e.target.closest('.suggested-keyword-button');
        if (suggestBtn) {
            const keywordToAdd = suggestBtn.dataset.keyword;
            if (keywordToAdd && !editableKeywords.includes(keywordToAdd)) {
                editableKeywords.push(keywordToAdd);
                updateAllArtboards();
                renderSettingsTab();
            }
        }
    };
    
    const handleDetailsTabClick = (e) => {
        // Chart mode controls
        if (e.target.id === 'chart-stacked-btn') {
            chartMode = 'stacked';
            focusedArtboard = null; // Reset focus when changing to stacked
            renderDetailsTab();
        }
        if (e.target.id === 'chart-grouped-btn') {
            chartMode = 'grouped';
            focusedArtboard = null; // Reset focus when changing to grouped
            renderDetailsTab();
        }
        // Chart orientation controls
        if (e.target.id === 'chart-horizontal-btn') {
            chartOrientation = 'horizontal';
            renderDetailsTab();
        }
        if (e.target.id === 'chart-vertical-btn') {
            chartOrientation = 'vertical';
            renderDetailsTab();
        }
        // Reset focus button
        if (e.target.id === 'chart-reset-focus-btn') {
            focusedArtboard = null;
            renderDetailsTab();
        }
        // Select/Deselect all
        if (e.target.id === 'select-all-artboards') {
            selectedArtboards = new Set(allArtboards);
            renderDetailsTab();
        }
        if (e.target.id === 'deselect-all-artboards') {
            selectedArtboards = new Set();
            renderDetailsTab();
        }
        // Checkbox change
        const checkbox = e.target.closest('.artboard-checkbox');
        if (checkbox) {
            const board = checkbox.dataset.board;
            if (checkbox.checked) {
                selectedArtboards.add(board);
            } else {
                selectedArtboards.delete(board);
            }
            renderDetailsTab();
        }
    };


    // --- INITIALIZATION ---
    const init = () => {
        // Set initial icons
        dom.modalCloseButton.innerHTML = icons.X;
        dom.uploadHeader.insertAdjacentHTML('afterbegin', icons.Upload);

        // Attach event listeners
        dom.fileInput.addEventListener('change', handleFileChange);
        dom.mergeFilesCheckbox.addEventListener('change', (e) => {
            mergeFiles = e.target.checked;
            if (datasets.length > 0) {
                updateAllArtboards();
                render();
            }
        });
        dom.tabsNav.addEventListener('click', handleTabClick);
        dom.modalCloseButton.addEventListener('click', () => dom.modalContainer.classList.add('hidden'));
        dom.modalContainer.addEventListener('click', (e) => {
            if (e.target === dom.modalContainer) {
                dom.modalContainer.classList.add('hidden');
            }
        });
        
        // Use event delegation for dynamically created elements
        dom.summaryTabContent.addEventListener('click', (e) => {
            handleSortRequest(e);
            handleRowClick(e);
        });
        dom.detailsTabContent.addEventListener('click', (e) => {
            // Handle table header sorting
            if (e.target.classList.contains('sort-header') || e.target.closest('.sort-header')) {
                const header = e.target.classList.contains('sort-header') ? e.target : e.target.closest('.sort-header');
                const sourceIndex = parseInt(header.dataset.sourceIndex);
                const column = header.dataset.column;
                
                // Toggle direction if same column, otherwise set to desc
                let direction = 'desc';
                if (comparisonSortConfig.sourceIndex === sourceIndex && comparisonSortConfig.column === column) {
                    direction = comparisonSortConfig.direction === 'desc' ? 'asc' : 'desc';
                }
                
                comparisonSortConfig = {
                    sourceIndex,
                    column,
                    direction
                };
                
                renderDetailsTab();
                return;
            }
            
            // Handle sorting buttons
            if (e.target.id === 'apply-sort') {
                const sourceSelect = document.getElementById('sort-source-select');
                const columnSelect = document.getElementById('sort-column-select');
                const directionSelect = document.getElementById('sort-direction-select');
                
                if (sourceSelect && columnSelect && directionSelect) {
                    comparisonSortConfig = {
                        sourceIndex: parseInt(sourceSelect.value),
                        column: columnSelect.value,
                        direction: directionSelect.value
                    };
                    
                    // Update status display
                    const statusEl = document.getElementById('sort-status');
                    if (statusEl) {
                        const { results, sourceNames } = calculateComparisonData();
                        const sourceName = sourceNames[comparisonSortConfig.sourceIndex] || 'N/A';
                        const columnName = comparisonSortConfig.column === 'total' ? 'Total Earning' : 'Rata-rata/Item';
                        const directionName = comparisonSortConfig.direction === 'desc' ? 'Tinggi ke Rendah' : 'Rendah ke Tinggi';
                        statusEl.textContent = `📋 Diurutkan berdasarkan: ${sourceName} - ${columnName} (${directionName})`;
                    }
                    
                    renderDetailsTab();
                }
            } else if (e.target.id === 'reset-sort') {
                // Reset to default sorting (first source, total, descending)
                comparisonSortConfig = {
                    sourceIndex: 0,
                    column: 'total',
                    direction: 'desc'
                };
                renderDetailsTab();
            } else {
                handleDetailsTabClick(e);
                handleRowClick(e);
            }
        });
        dom.detailsTabContent.addEventListener('change', (e) => {
            const select = e.target.closest('#base-file-select');
            if (select) {
                baseFile = select.value;
                focusedArtboard = null; // Reset focus when changing base file
                renderDetailsTab();
            }
        });
        dom.settingsTabContent.addEventListener('click', handleSettingsClick);
    };

    init();
});