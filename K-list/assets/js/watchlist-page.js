// K-List Anime-Planet Style Watchlist Page Logic

let currentWatchlist = [];
let activeStatusFilter = 'all';
let searchQuery = '';
let currentSort = 'added_desc';
let activeUser = null;

async function initWatchlistPage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    location.href = 'login.html';
    return;
  }
  activeUser = user;

  await fetchWatchlistData();
  setupEventListeners();
}

async function fetchWatchlistData() {
  const list = await db.getWatchlist(activeUser.id);
  currentWatchlist = list;
  updateStatusBadges();
  renderFilteredList();
}

function updateStatusBadges() {
  const counts = {
    all: currentWatchlist.length,
    watching: 0,
    completed: 0,
    planning: 0,
    stalled: 0,
    dropped: 0
  };

  currentWatchlist.forEach(item => {
    const st = (item.status || 'watching').toLowerCase();
    if (counts[st] !== undefined) counts[st]++;
    else counts.watching++;
  });

  const setBadge = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setBadge('badge-all', counts.all);
  setBadge('badge-watching', counts.watching);
  setBadge('badge-completed', counts.completed);
  setBadge('badge-planning', counts.planning);
  setBadge('badge-stalled', counts.stalled);
  setBadge('badge-dropped', counts.dropped);

  const countSubtitle = document.getElementById('watchlist-count');
  if (countSubtitle) {
    countSubtitle.textContent = `Kamu punya ${counts.all} drama di daftarmu (${counts.watching} sedang ditonton, ${counts.completed} selesai).`;
  }
}

function getFilteredAndSortedList() {
  let list = [...currentWatchlist];

  // 1. Status Filter
  if (activeStatusFilter !== 'all') {
    list = list.filter(item => (item.status || 'watching').toLowerCase() === activeStatusFilter.toLowerCase());
  }

  // 2. Search Query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(item => {
      const title = (item.drama?.title || '').toLowerCase();
      const desc = (item.drama?.description || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }

  // 3. Sorting
  list.sort((a, b) => {
    if (currentSort === 'added_desc') {
      return new Date(b.added_at || 0) - new Date(a.added_at || 0);
    }
    if (currentSort === 'added_asc') {
      return new Date(a.added_at || 0) - new Date(b.added_at || 0);
    }
    if (currentSort === 'score_desc') {
      return (b.score || 0) - (a.score || 0);
    }
    if (currentSort === 'progress_desc') {
      const aPct = (a.progress || 0) / (a.total_episodes || 16);
      const bPct = (b.progress || 0) / (b.total_episodes || 16);
      return bPct - aPct;
    }
    if (currentSort === 'title_asc') {
      return (a.drama?.title || '').localeCompare(b.drama?.title || '');
    }
    if (currentSort === 'year_desc') {
      return (b.drama?.year || 0) - (a.drama?.year || 0);
    }
    return 0;
  });

  return list;
}

function renderFilteredList() {
  const grid = document.getElementById('watchlist-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyDesc = document.getElementById('empty-desc');

  if (!grid) return;

  const list = getFilteredAndSortedList();

  if (list.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';

    if (searchQuery) {
      emptyTitle.textContent = 'Tidak Ditemukan';
      emptyDesc.textContent = `Tidak ada drama yang cocok dengan kata kunci "${searchQuery}".`;
    } else if (activeStatusFilter !== 'all') {
      const labelMap = {
        watching: 'Sedang Ditonton',
        completed: 'Selesai',
        planning: 'Ingin Ditonton',
        stalled: 'Ditunda',
        dropped: 'Didrop'
      };
      emptyTitle.textContent = `Kategori ${labelMap[activeStatusFilter] || ''} Kosong`;
      emptyDesc.textContent = `Kamu belum menandai drama apapun dengan status ini.`;
    } else {
      emptyTitle.textContent = 'Watchlist Masih Kosong';
      emptyDesc.textContent = 'Yuk cari dan tambahkan drama favoritmu ke daftar!';
    }
    return;
  }

  emptyState.style.display = 'none';

  grid.innerHTML = list.map(item => {
    const drama = item.drama || {};
    const status = (item.status || 'watching').toLowerCase();
    const progress = parseInt(item.progress || 0, 10);
    const totalEps = parseInt(item.total_episodes || 16, 10);
    const progressPct = Math.min(100, Math.round((progress / totalEps) * 100));
    const score = parseInt(item.score || 0, 10);

    const statusLabels = {
      watching: 'Watching',
      completed: 'Completed',
      planning: 'Want to Watch',
      stalled: 'Stalled',
      dropped: 'Dropped'
    };

    return `
      <div class="watchlist-card" data-drama-id="${item.drama_id}">
        <div class="card-poster-wrap" onclick="location.href='drama-detail.html?id=${item.drama_id}'">
          <img src="${drama.poster_url || 'assets/img/no-poster.jpg'}" alt="${drama.title || 'Drama'}" loading="lazy">
          <span class="card-status-badge status-${status}">${statusLabels[status] || status}</span>
          <button class="remove-btn" title="Hapus dari Watchlist" data-remove-id="${item.drama_id}">✕</button>
        </div>

        <div class="info">
          <h3 onclick="location.href='drama-detail.html?id=${item.drama_id}'" title="${drama.title || 'Unknown'}">
            ${drama.title || 'Unknown Title'}
          </h3>
          
          <div class="card-meta">
            <span class="year">${drama.year || '?'}</span> • 
            <span class="public-rating">⭐ ${drama.rating || 'N/A'}</span>
          </div>

          <!-- Anime-Planet Control Panel -->
          <div class="card-tracker-box">
            <!-- Status Dropdown -->
            <div class="tracker-row">
              <span class="tracker-label">Status</span>
              <select class="card-status-select" data-id="${item.drama_id}">
                <option value="watching" ${status === 'watching' ? 'selected' : ''}>Watching</option>
                <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="planning" ${status === 'planning' ? 'selected' : ''}>Want to Watch</option>
                <option value="stalled" ${status === 'stalled' ? 'selected' : ''}>Stalled</option>
                <option value="dropped" ${status === 'dropped' ? 'selected' : ''}>Dropped</option>
              </select>
            </div>

            <!-- Episode Progress -->
            <div class="tracker-row">
              <span class="tracker-label">Episodes</span>
              <div class="ep-controls">
                <button class="btn-ep btn-ep-dec" data-id="${item.drama_id}">−</button>
                <span class="ep-display"><strong>${progress}</strong> / ${totalEps}</span>
                <button class="btn-ep btn-ep-inc" data-id="${item.drama_id}">+</button>
              </div>
            </div>

            <!-- Mini Progress Bar -->
            <div class="ep-progress-bar">
              <div class="ep-progress-fill status-${status}" style="width: ${progressPct}%"></div>
            </div>

            <!-- Personal Rating (1-10) -->
            <div class="tracker-row">
              <span class="tracker-label">Skor Pribadi</span>
              <select class="card-score-select" data-id="${item.drama_id}">
                <option value="0" ${score === 0 ? 'selected' : ''}>− Beri Nilai −</option>
                <option value="10" ${score === 10 ? 'selected' : ''}>★ 10 (Masterpiece)</option>
                <option value="9" ${score === 9 ? 'selected' : ''}>★ 9 (Luar Biasa)</option>
                <option value="8" ${score === 8 ? 'selected' : ''}>★ 8 (Sangat Bagus)</option>
                <option value="7" ${score === 7 ? 'selected' : ''}>★ 7 (Bagus)</option>
                <option value="6" ${score === 6 ? 'selected' : ''}>★ 6 (Cukup Bagus)</option>
                <option value="5" ${score === 5 ? 'selected' : ''}>★ 5 (Biasa Aja)</option>
                <option value="4" ${score === 4 ? 'selected' : ''}>★ 4 (Kurang)</option>
                <option value="3" ${score === 3 ? 'selected' : ''}>★ 3 (Jelek)</option>
                <option value="2" ${score === 2 ? 'selected' : ''}>★ 2 (Sangat Jelek)</option>
                <option value="1" ${score === 1 ? 'selected' : ''}>★ 1 (Bencana)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  attachCardEvents();
}

function attachCardEvents() {
  // 1. Episode Increment
  document.querySelectorAll('.btn-ep-inc').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const dramaId = parseInt(btn.dataset.id, 10);
      await db.updateWatchlistProgress(dramaId, activeUser.id, 1);
      await fetchWatchlistData();
    };
  });

  // 2. Episode Decrement
  document.querySelectorAll('.btn-ep-dec').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const dramaId = parseInt(btn.dataset.id, 10);
      await db.updateWatchlistProgress(dramaId, activeUser.id, -1);
      await fetchWatchlistData();
    };
  });

  // 3. Status Select Change
  document.querySelectorAll('.card-status-select').forEach(sel => {
    sel.onchange = async (e) => {
      e.stopPropagation();
      const dramaId = parseInt(sel.dataset.id, 10);
      const newStatus = sel.value;
      const curItem = currentWatchlist.find(w => w.drama_id === dramaId) || {};
      
      await db.setWatchlistStatus({
        dramaId,
        userId: activeUser.id,
        status: newStatus,
        progress: curItem.progress || 0,
        total_episodes: curItem.total_episodes || 16,
        score: curItem.score || 0
      });
      await fetchWatchlistData();
    };
  });

  // 4. Score Select Change
  document.querySelectorAll('.card-score-select').forEach(sel => {
    sel.onchange = async (e) => {
      e.stopPropagation();
      const dramaId = parseInt(sel.dataset.id, 10);
      const newScore = parseInt(sel.value, 10);
      const curItem = currentWatchlist.find(w => w.drama_id === dramaId) || {};

      await db.setWatchlistStatus({
        dramaId,
        userId: activeUser.id,
        status: curItem.status || 'watching',
        progress: curItem.progress || 0,
        total_episodes: curItem.total_episodes || 16,
        score: newScore
      });
      await fetchWatchlistData();
    };
  });

  // 5. Remove Button
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const dramaId = parseInt(btn.dataset.removeId, 10);
      const item = currentWatchlist.find(w => w.drama_id === dramaId);
      const title = item?.drama?.title || 'drama ini';

      if (!confirm(`Hapus "${title}" dari daftar tontonanmu?`)) return;

      await db.removeFromWatchlist(dramaId, activeUser.id);
      await fetchWatchlistData();
    };
  });
}

function setupEventListeners() {
  // Status Tab Clicking
  const tabButtons = document.querySelectorAll('.status-tab');
  tabButtons.forEach(btn => {
    btn.onclick = () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.dataset.status;
      renderFilteredList();
    };
  });

  // Search input
  const searchInput = document.getElementById('watchlist-search');
  if (searchInput) {
    searchInput.oninput = (e) => {
      searchQuery = e.target.value;
      renderFilteredList();
    };
  }

  // Sort dropdown
  const sortSelect = document.getElementById('watchlist-sort');
  if (sortSelect) {
    sortSelect.onchange = (e) => {
      currentSort = e.target.value;
      renderFilteredList();
    };
  }
}

document.addEventListener('DOMContentLoaded', initWatchlistPage);
supabase.auth.onAuthStateChange(() => {
  setTimeout(initWatchlistPage, 300);
});
