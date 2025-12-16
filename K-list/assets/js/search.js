const resultsGrid = document.getElementById('results-grid');
const searchTitleEl = document.getElementById('search-title');
const loadingMessageEl = document.getElementById('loading-message');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (query) {
        const decodedQuery = decodeURIComponent(query);
        searchTitleEl.textContent = `Hasil Pencarian untuk: "${decodedQuery}"`;
        fetchSearchResults(decodedQuery.toLowerCase());
    } else {
        searchTitleEl.textContent = 'Tidak ada kata kunci pencarian.';
        if (loadingMessageEl) loadingMessageEl.style.display = 'none';
        if (resultsGrid) resultsGrid.innerHTML = '<p style="text-align:center;padding:3rem;">Silakan masukkan kata kunci di kolom pencarian.</p>';
    }
});

async function fetchSearchResults(query) {
    if (loadingMessageEl) loadingMessageEl.textContent = 'Mencari...';
    if (resultsGrid) resultsGrid.innerHTML = ''; 
    
    if (!supabase) {
        console.error("Supabase client not initialized.");
        if (loadingMessageEl) loadingMessageEl.textContent = 'Kesalahan: Koneksi ke database gagal.';
        return;
    }

    const { data: dramas, error } = await supabase
        .from('dramas')
        .select(`
            id, 
            title, 
            year, 
            poster_url,
            description
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`) 
        .limit(50);

    
    if (loadingMessageEl) loadingMessageEl.style.display = 'none';

    if (error) {
        console.error('Error fetching search results:', error);
        if (resultsGrid) resultsGrid.innerHTML = '<p style="text-align:center;color:red;padding:3rem;">Terjadi kesalahan saat mengambil data dari database.</p>';
        return;
    }

    if (!dramas || dramas.length === 0) {
        if (resultsGrid) resultsGrid.innerHTML = `<p style="text-align:center;padding:3rem;">Tidak ditemukan hasil untuk "${query}".</p>`;
        return;
    }

    renderResults(dramas);
}

function renderResults(dramas) {
    if (!resultsGrid) return;
    
    resultsGrid.innerHTML = dramas.map(drama => `
        <div class="drama-card" onclick="location.href='drama-detail.html?id=${drama.id}'">
            <img 
                src="${drama.poster_url || 'https://via.placeholder.com/300x450/111/fff?text=No+Poster'}" 
                alt="${drama.title}"
                onerror="this.onerror=null;this.src='https://via.placeholder.com/300x450/111/fff?text=No+Poster';"
            >
            <div class="drama-info">
                <h3>${drama.title}</h3>
                <p class="drama-year">(${drama.year || '?'})</p>
                <p class="drama-snippet">${(drama.description || 'Tidak ada sinopsis.').substring(0, 100)}...</p>
                <a href="drama-detail.html?id=${drama.id}" class="detail-link">Lihat Detail &rarr;</a>
            </div>
        </div>
    `).join('');
}