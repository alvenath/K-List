// K-List Custom Profile & Anime-Planet Style Statistics Page

let currentUser = null;
let profileData = null;
let watchlistItems = [];
let activeListFilter = 'all';

async function initProfilePage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    location.href = 'login.html';
    return;
  }
  currentUser = user;

  await loadAllProfileData();
  setupTabs();
  setupModal();
}

async function loadAllProfileData() {
  const [profRes, wl] = await Promise.all([
    db.getUserProfile(currentUser.id),
    db.getWatchlist(currentUser.id)
  ]);

  profileData = profRes;
  watchlistItems = wl;

  renderProfileHeader();
  renderAnimePlanetStats();
  renderFavoritesTab();
  renderDramalistTab();
  renderReviewsTab();
  renderScoreDistributionTab();
}

// 1. RENDER PROFILE HEADER
function renderProfileHeader() {
  const prof = profileData?.profile || {};

  const bannerEl = document.getElementById('profile-banner');
  if (bannerEl) {
    const bannerUrl = prof.banner || 'assets/img/poster/Vincenzo.jpg';
    bannerEl.style.backgroundImage = `url('${bannerUrl}')`;
  }

  const avatarImg = document.getElementById('profile-avatar-img');
  if (avatarImg) {
    avatarImg.src = prof.avatar || 'assets/img/Avatar.jpg';
  }

  const usernameEl = document.getElementById('profile-username');
  if (usernameEl) {
    usernameEl.textContent = prof.username || currentUser.username || 'K-Drama Fan';
  }

  const badgeEl = document.getElementById('profile-badge-pill');
  if (badgeEl) {
    badgeEl.textContent = prof.badge || 'K-Drama Enthusiast';
  }

  const bioEl = document.getElementById('profile-bio');
  if (bioEl) {
    bioEl.textContent = prof.bio || 'K-Drama enthusiast exploring the best stories.';
  }

  const joinedEl = document.getElementById('profile-joined');
  if (joinedEl && prof.created_at) {
    const yr = new Date(prof.created_at).getFullYear();
    joinedEl.textContent = `Bergabung ${yr || 2025}`;
  }
}

// 2. RENDER ANIME-PLANET BREAKDOWN BAR & STATS
function renderAnimePlanetStats() {
  const stats = profileData?.stats || db.getUserStats(currentUser.id);
  const counts = stats.counts || { watching: 0, completed: 0, planning: 0, stalled: 0, dropped: 0 };
  const pcts = stats.percentages || { watching: 0, completed: 0, planning: 0, stalled: 0, dropped: 0 };

  // Update segmented bar
  const setSeg = (cls, pct, title) => {
    const el = document.querySelector(`.ap-bar-segment.${cls}`);
    if (el) {
      el.style.width = `${pct}%`;
      el.title = `${title}: ${pct}%`;
    }
  };

  setSeg('seg-watching', pcts.watching, 'Watching');
  setSeg('seg-completed', pcts.completed, 'Completed');
  setSeg('seg-planning', pcts.planning, 'Want to Watch');
  setSeg('seg-stalled', pcts.stalled, 'Stalled');
  setSeg('seg-dropped', pcts.dropped, 'Dropped');

  // Update Legend
  const setLeg = (idCount, idPct, count, pct) => {
    const elC = document.getElementById(idCount);
    const elP = document.getElementById(idPct);
    if (elC) elC.textContent = count;
    if (elP) elP.textContent = `(${pct}%)`;
  };

  setLeg('stat-count-watching', 'stat-pct-watching', counts.watching, pcts.watching);
  setLeg('stat-count-completed', 'stat-pct-completed', counts.completed, pcts.completed);
  setLeg('stat-count-planning', 'stat-pct-planning', counts.planning, pcts.planning);
  setLeg('stat-count-stalled', 'stat-pct-stalled', counts.stalled, pcts.stalled);
  setLeg('stat-count-dropped', 'stat-pct-dropped', counts.dropped, pcts.dropped);

  // Update quick metrics
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setVal('metric-total-dramas', stats.total || 0);
  setVal('metric-total-eps', stats.episodesWatched || 0);
  setVal('metric-days-spent', stats.daysWatched || '0.0');
  setVal('metric-mean-score', stats.meanScore || '0.0');
}

// 3. RENDER FAVORITES TAB
function renderFavoritesTab() {
  const dramasGrid = document.getElementById('fav-dramas-grid');
  const actorsGrid = document.getElementById('fav-actors-grid');
  const favDramas = profileData?.favoritesData?.dramas || [];
  const favActors = profileData?.favoritesData?.actors || [];

  if (dramasGrid) {
    if (favDramas.length === 0) {
      dramasGrid.innerHTML = `
        <div style="grid-column: 1/-1; color: #777; font-style: italic; padding: 1.5rem 0;">
          Belum ada drama favorit. Buka detail drama dan klik tombol "Favorit" untuk menambahkannya ke sini!
        </div>`;
    } else {
      dramasGrid.innerHTML = favDramas.map(d => `
        <div class="fav-card" onclick="location.href='drama-detail.html?id=${d.id}'">
          <button class="btn-remove-fav" data-fav-type="drama" data-id="${d.id}" title="Hapus dari Favorit">✕</button>
          <img src="${d.poster_url || 'assets/img/no-poster.jpg'}" alt="${d.title}" loading="lazy">
          <div class="fav-card-info">
            <h4 title="${d.title}">${d.title}</h4>
            <p>${d.year || ''} • ⭐ ${d.rating || 'N/A'}</p>
          </div>
        </div>
      `).join('');
    }
  }

  if (actorsGrid) {
    if (favActors.length === 0) {
      actorsGrid.innerHTML = `
        <div style="grid-column: 1/-1; color: #777; font-style: italic; padding: 1.5rem 0;">
          Belum ada aktor favorit yang disematkan.
        </div>`;
    } else {
      actorsGrid.innerHTML = favActors.map(a => `
        <div class="fav-card" onclick="location.href='actor.html'">
          <button class="btn-remove-fav" data-fav-type="actor" data-id="${a.id}" title="Hapus dari Favorit">✕</button>
          <img src="${a.photo_url || 'assets/img/no-photo.jpg'}" alt="${a.name}" loading="lazy">
          <div class="fav-card-info">
            <h4 title="${a.name}">${a.name}</h4>
            <p>${a.gender === 'Female' ? 'Aktris' : 'Aktor'}</p>
          </div>
        </div>
      `).join('');
    }
  }

  // Handle remove from favorites
  document.querySelectorAll('.btn-remove-fav').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const type = btn.dataset.favType;
      const id = parseInt(btn.dataset.id, 10);
      await db.toggleFavorite(currentUser.id, type, id);
      await loadAllProfileData();
    };
  });
}

// 4. RENDER DRAMALIST TAB (ANIME-PLANET TABLE)
function renderDramalistTab() {
  const tbody = document.getElementById('profile-dramalist-body');
  if (!tbody) return;

  let list = [...watchlistItems];
  if (activeListFilter !== 'all') {
    list = list.filter(item => (item.status || 'watching').toLowerCase() === activeListFilter.toLowerCase());
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:#777; padding: 3rem 0; font-style:italic;">
          Tidak ada drama dengan kategori ini di daftarmu.
        </td>
      </tr>`;
    return;
  }

  const statusColors = {
    watching: '#2ecc71',
    completed: '#3498db',
    planning: '#9b59b6',
    stalled: '#e67e22',
    dropped: '#e74c3c'
  };

  tbody.innerHTML = list.map(item => {
    const drama = item.drama || {};
    const st = (item.status || 'watching').toLowerCase();
    const curEp = parseInt(item.progress || 0, 10);
    const totalEp = parseInt(item.total_episodes || 16, 10);
    const score = parseInt(item.score || 0, 10);

    return `
      <tr>
        <td>
          <img src="${drama.poster_url || 'assets/img/no-poster.jpg'}" class="table-poster" alt="${drama.title}" />
        </td>
        <td>
          <a href="drama-detail.html?id=${item.drama_id}" class="table-title">${drama.title || 'Unknown'}</a>
          <div style="font-size:0.8rem; color:#777; margin-top:2px;">${drama.year || ''} • Komunitas: ⭐ ${drama.rating || 'N/A'}</div>
        </td>
        <td>
          <select class="card-status-select table-status-select" data-id="${item.drama_id}">
            <option value="watching" ${st === 'watching' ? 'selected' : ''}>Watching</option>
            <option value="completed" ${st === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="planning" ${st === 'planning' ? 'selected' : ''}>Want to Watch</option>
            <option value="stalled" ${st === 'stalled' ? 'selected' : ''}>Stalled</option>
            <option value="dropped" ${st === 'dropped' ? 'selected' : ''}>Dropped</option>
          </select>
        </td>
        <td>
          <div class="ep-controls">
            <button class="btn-ep btn-table-ep-dec" data-id="${item.drama_id}">−</button>
            <span class="ep-display"><strong>${curEp}</strong>/${totalEp}</span>
            <button class="btn-ep btn-table-ep-inc" data-id="${item.drama_id}">+</button>
          </div>
        </td>
        <td>
          <select class="card-score-select table-score-select" data-id="${item.drama_id}">
            <option value="0" ${score === 0 ? 'selected' : ''}>− Skor −</option>
            <option value="10" ${score === 10 ? 'selected' : ''}>★ 10</option>
            <option value="9" ${score === 9 ? 'selected' : ''}>★ 9</option>
            <option value="8" ${score === 8 ? 'selected' : ''}>★ 8</option>
            <option value="7" ${score === 7 ? 'selected' : ''}>★ 7</option>
            <option value="6" ${score === 6 ? 'selected' : ''}>★ 6</option>
            <option value="5" ${score === 5 ? 'selected' : ''}>★ 5</option>
            <option value="4" ${score === 4 ? 'selected' : ''}>★ 4</option>
            <option value="3" ${score === 3 ? 'selected' : ''}>★ 3</option>
            <option value="2" ${score === 2 ? 'selected' : ''}>★ 2</option>
            <option value="1" ${score === 1 ? 'selected' : ''}>★ 1</option>
          </select>
        </td>
        <td>
          <button class="btn-text-danger btn-table-remove" data-id="${item.drama_id}">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');

  attachTableEvents();
}

function attachTableEvents() {
  document.querySelectorAll('.btn-table-ep-inc').forEach(btn => {
    btn.onclick = async () => {
      const dramaId = parseInt(btn.dataset.id, 10);
      await db.updateWatchlistProgress(dramaId, currentUser.id, 1);
      await loadAllProfileData();
    };
  });

  document.querySelectorAll('.btn-table-ep-dec').forEach(btn => {
    btn.onclick = async () => {
      const dramaId = parseInt(btn.dataset.id, 10);
      await db.updateWatchlistProgress(dramaId, currentUser.id, -1);
      await loadAllProfileData();
    };
  });

  document.querySelectorAll('.table-status-select').forEach(sel => {
    sel.onchange = async () => {
      const dramaId = parseInt(sel.dataset.id, 10);
      const cur = watchlistItems.find(w => w.drama_id === dramaId) || {};
      await db.setWatchlistStatus({
        dramaId,
        userId: currentUser.id,
        status: sel.value,
        progress: cur.progress || 0,
        total_episodes: cur.total_episodes || 16,
        score: cur.score || 0
      });
      await loadAllProfileData();
    };
  });

  document.querySelectorAll('.table-score-select').forEach(sel => {
    sel.onchange = async () => {
      const dramaId = parseInt(sel.dataset.id, 10);
      const cur = watchlistItems.find(w => w.drama_id === dramaId) || {};
      await db.setWatchlistStatus({
        dramaId,
        userId: currentUser.id,
        status: cur.status || 'watching',
        progress: cur.progress || 0,
        total_episodes: cur.total_episodes || 16,
        score: parseInt(sel.value, 10)
      });
      await loadAllProfileData();
    };
  });

  document.querySelectorAll('.btn-table-remove').forEach(btn => {
    btn.onclick = async () => {
      const dramaId = parseInt(btn.dataset.id, 10);
      if (!confirm('Hapus drama ini dari watchlist?')) return;
      await db.removeFromWatchlist(dramaId, currentUser.id);
      await loadAllProfileData();
    };
  });
}

// 5. RENDER REVIEWS TAB
function renderReviewsTab() {
  const container = document.getElementById('profile-reviews-list');
  if (!container) return;

  const reviews = profileData?.reviews || [];

  if (reviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #777; padding: 3rem 0; font-style: italic;">
        Kamu belum pernah menulis review. Tonton drama dan bagikan pendapatmu!
      </div>`;
    return;
  }

  const allDramas = window.KLIST_DATA?.dramas || [];

  container.innerHTML = reviews.map(r => {
    const drama = allDramas.find(d => d.id === r.drama_id) || {};
    const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

    return `
      <div class="user-review-card">
        <div class="review-card-head">
          <a href="drama-detail.html?id=${r.drama_id}" class="review-drama-name">${drama.title || 'Drama #' + r.drama_id}</a>
          <span class="review-score-stars">★ ${r.rating} / 10</span>
        </div>
        <p class="review-body-text">${r.review_text || '(Tidak ada komentar tertulis)'}</p>
        <span class="review-date">${dateStr}</span>
      </div>
    `;
  }).join('');
}

// 6. RENDER SCORE DISTRIBUTION TAB
function renderScoreDistributionTab() {
  const container = document.getElementById('score-bars-container');
  if (!container) return;

  const stats = profileData?.stats || db.getUserStats(currentUser.id);
  const dist = stats.scoreDistribution || {};
  const ratedCount = Object.values(dist).reduce((sum, n) => sum + n, 0);

  const scores = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  container.innerHTML = scores.map(score => {
    const count = dist[score] || 0;
    const pct = ratedCount > 0 ? Math.round((count / ratedCount) * 100) : 0;

    return `
      <div class="score-row">
        <span class="score-label">★ ${score}</span>
        <div class="score-track">
          <div class="score-fill" style="width: ${pct}%"></div>
        </div>
        <span class="score-count">${count}</span>
      </div>
    `;
  }).join('');
}

// 7. SETUP TABS INTERACTION
function setupTabs() {
  const tabBtns = document.querySelectorAll('.profile-tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    };
  });

  // Dramalist status pills
  const pills = document.querySelectorAll('#profile-list-filter .pill-btn');
  pills.forEach(p => {
    p.onclick = () => {
      pills.forEach(b => b.classList.remove('active'));
      p.classList.add('active');
      activeListFilter = p.dataset.filter;
      renderDramalistTab();
    };
  });
}

// 8. SETUP EDIT PROFILE MODAL
function setupModal() {
  const modal = document.getElementById('edit-profile-modal');
  const openBtn1 = document.getElementById('btn-open-edit-profile');
  const openBtn2 = document.getElementById('btn-edit-profile-trigger');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('btn-cancel-edit');
  const saveBtn = document.getElementById('btn-save-profile');

  const inputUsername = document.getElementById('input-edit-username');
  const inputBio = document.getElementById('input-edit-bio');
  const inputBadge = document.getElementById('input-edit-badge');
  const inputAvatarUrl = document.getElementById('input-edit-avatar-url');
  const inputBannerUrl = document.getElementById('input-edit-banner-url');

  const openModal = () => {
    const prof = profileData?.profile || {};
    if (inputUsername) inputUsername.value = prof.username || currentUser.username || '';
    if (inputBio) inputBio.value = prof.bio || '';
    if (inputBadge) inputBadge.value = prof.badge || 'K-Drama Enthusiast';
    if (inputAvatarUrl) inputAvatarUrl.value = prof.avatar || '';
    if (inputBannerUrl) inputBannerUrl.value = prof.banner || '';

    // Mark active preset avatar
    document.querySelectorAll('.preset-avatar').forEach(img => {
      img.classList.toggle('selected', img.dataset.url === prof.avatar);
    });

    // Mark active preset banner
    document.querySelectorAll('.preset-banner').forEach(b => {
      b.classList.toggle('selected', b.dataset.url === prof.banner);
    });

    if (modal) modal.style.display = 'flex';
  };

  const closeModal = () => {
    if (modal) modal.style.display = 'none';
  };

  if (openBtn1) openBtn1.onclick = openModal;
  if (openBtn2) openBtn2.onclick = openModal;
  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  // Preset avatar click
  document.querySelectorAll('.preset-avatar').forEach(img => {
    img.onclick = () => {
      document.querySelectorAll('.preset-avatar').forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      if (inputAvatarUrl) inputAvatarUrl.value = img.dataset.url;
    };
  });

  // Preset banner click
  document.querySelectorAll('.preset-banner').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.preset-banner').forEach(i => i.classList.remove('selected'));
      b.classList.add('selected');
      if (inputBannerUrl) inputBannerUrl.value = b.dataset.url;
    };
  });

  // Save changes
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const newUsername = inputUsername ? inputUsername.value.trim() : '';
      const newBio = inputBio ? inputBio.value.trim() : '';
      const newBadge = inputBadge ? inputBadge.value : 'K-Drama Enthusiast';
      const newAvatar = inputAvatarUrl ? inputAvatarUrl.value.trim() : '';
      const newBanner = inputBannerUrl ? inputBannerUrl.value.trim() : '';

      saveBtn.disabled = true;
      saveBtn.textContent = 'Menyimpan...';

      await db.updateUserProfile(currentUser.id, {
        username: newUsername || currentUser.username,
        bio: newBio,
        badge: newBadge,
        avatar: newAvatar || 'assets/img/Avatar.jpg',
        banner: newBanner || 'assets/img/poster/Vincenzo.jpg'
      });

      saveBtn.disabled = false;
      saveBtn.textContent = 'Simpan Perubahan';
      closeModal();
      await loadAllProfileData();
    };
  }
}

document.addEventListener('DOMContentLoaded', initProfilePage);
