
let dramaData = {};
let currentUser = null;
let currentRating = 0;
let userHasReviewed = false;
let isToggling = false; 

const urlParams = new URLSearchParams(window.location.search);
const dramaId = parseInt(urlParams.get('id'));

if (!dramaId) {
  alert('Drama ID tidak ditemukan!');
  location.href = 'drama.html';
}

// --- FUNGSI UTAMA PENGAMBIL DATA ---
async function fetchDramaData() {
  const { data: drama, error } = await supabase.from('dramas').select('*, trailer_url').eq('id', dramaId).single();
  if (error || !drama) return alert('Drama tidak ditemukan!'), location.href = 'drama.html';

  const { data: genresData } = await supabase.from('drama_genres').select('genres(name)').eq('drama_id', dramaId);
  const genres = genresData ? genresData.map(g => g.genres.name) : [];

  const { data: castData } = await supabase
    .from('drama_actors')
    .select('actor_id, character_name, is_lead, actors(name, photo_url)')
    .eq('drama_id', dramaId)
    .order('is_lead', { ascending: false });

  const cast = castData ? castData.map(c => ({
    name: c.actors.name,
    role: c.character_name,
    photo: c.actors.photo_url,
  })) : [];

  dramaData = {
    id: drama.id,
    title: drama.title,
    year: drama.year || '?',
    genres,
    synopsis: drama.description || 'Belum ada sinopsis.',
    poster: drama.poster_url,
    trailerUrl: drama.trailer_url, 
    cast
  };

  renderDramaDetail(dramaData);
  setupTrailerFunctionality(dramaData.trailerUrl);
  await initDramaTracker(dramaId);
  fetchReviews();
  checkIfUserHasReviewed();
}

function renderDramaDetail(d) {
  document.title = `${d.title} - K-list`;
  document.getElementById('title').textContent = d.title;
  document.getElementById('year').textContent = d.year;

  const genresEl = document.getElementById('genres');
  if (genresEl) genresEl.innerHTML = d.genres.map(g => `<span class="genre-tag">${g}</span>`).join(' ');

  document.getElementById('synopsis').textContent = d.synopsis;
  const posterImg = document.getElementById('poster-img');
  if (posterImg) posterImg.src = d.poster || 'https://via.placeholder.com/300x450/111/fff?text=No+Poster';

  document.body.style.setProperty('--backdrop-url', `url(${d.poster})`);

  const castGrid = document.getElementById('cast-grid');
  if (castGrid) {
castGrid.innerHTML = d.cast.slice(0, 10).map(actor => `
  <div class="cast-card">
    <img src="${actor.photo || 'https://via.placeholder.com/160x200/222/666?text=No+Photo'}" alt="${actor.name}">
    <div class="cast-info">
        <h4>${actor.name}</h4>
        <p class="role">${actor.role}</p>
    </div>
  </div>
`).join('');
  }
}

async function fetchReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, review_text, created_at, username')
    .eq('drama_id', dramaId)
    .order('created_at', { ascending: false });

  const container = document.getElementById('reviews-list');
  const loadingEl = document.getElementById('reviews-loading');
  const ratingEl = document.getElementById('rating');
  if (!container || !ratingEl) return;

  if (loadingEl) loadingEl.style.display = 'none';

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;padding:3rem;font-style:italic;">Belum ada review. Jadilah yang pertama!</p>';
    ratingEl.innerHTML = `N/A <small>(0 reviews)</small>`;
    return;
  }

  const totalRating = data.reduce((sum, r) => sum + r.rating, 0);
  const reviewCount = data.length;
  const avgRating = (totalRating / reviewCount).toFixed(1);

  ratingEl.innerHTML = `⭐ ${avgRating} <small>(${reviewCount} reviews)</small>`;

  container.innerHTML = data.map(r => `
    <div class="review-item review-card">
      <img src="assets/img/Avatar.jpg" class="review-avatar" alt="Profile Logo">
      <div class="review-content">
        <div class="review-header">
          <strong>${r.username || 'Anonymous'}</strong>
          <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(10 - r.rating)}
          <span class="rating-number">${r.rating}/10</span></div>
        </div>
        <p class="review-text-content">${r.review_text?.replace(/\n/g, '<br>') || '(Tanpa komentar)'}</p>
        <small>${new Date(r.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</small>
      </div>
    </div>
  `).join('');
}

async function checkIfUserHasReviewed() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from('reviews')
    .select('rating, review_text')
    .eq('drama_id', dramaId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (data) {
    userHasReviewed = true;
    currentRating = data.rating;
    document.getElementById('selected-rating').textContent = currentRating;
    document.getElementById('review-text').value = data.review_text || '';
    document.querySelectorAll('#imdb-rating-input span').forEach((s, i) => {
      s.classList.toggle('active', i + 1 <= currentRating);
    });
    document.getElementById('submit-review').textContent = 'Update Review';
  } else {
    userHasReviewed = false;
    document.getElementById('submit-review').textContent = 'Kirim Review';
  }
}

let currentTrackerItem = null;

async function initDramaTracker(id) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  const trackerCard = document.getElementById('drama-tracker-card');
  const favBtn = document.getElementById('btn-fav-toggle');
  const statusSel = document.getElementById('detail-tracker-status');
  const extendedFields = document.getElementById('tracker-extended-fields');
  const epCurrentEl = document.getElementById('detail-ep-current');
  const epTotalEl = document.getElementById('detail-ep-total');
  const progressBar = document.getElementById('detail-progress-bar');
  const scoreSel = document.getElementById('detail-tracker-score');
  const removeBtn = document.getElementById('btn-detail-remove');
  const incBtn = document.getElementById('btn-detail-ep-inc');
  const decBtn = document.getElementById('btn-detail-ep-dec');

  if (!trackerCard) return;

  if (!user) {
    if (statusSel) {
      statusSel.onchange = () => {
        alert('Silakan login terlebih dahulu untuk menambah ke watchlist!');
        location.href = 'login.html';
      };
    }
    if (favBtn) {
      favBtn.onclick = () => {
        alert('Silakan login terlebih dahulu!');
        location.href = 'login.html';
      };
    }
    return;
  }

  // Check favorite status
  const profileRes = await db.getUserProfile(user.id);
  const favDramas = profileRes?.profile?.favorites?.dramas || [];
  const isFav = favDramas.includes(id);
  if (favBtn) {
    favBtn.classList.toggle('favorited', isFav);
    const favText = document.getElementById('fav-text');
    if (favText) favText.textContent = isFav ? 'Favorit ★' : 'Favorit';
  }

  // Fetch watchlist item
  currentTrackerItem = await db.getWatchlistItem(id, user.id);

  const statusColors = {
    watching: '#2ecc71',
    completed: '#3498db',
    planning: '#9b59b6',
    stalled: '#e67e22',
    dropped: '#e74c3c'
  };

  const updateUI = () => {
    if (statusSel) {
      statusSel.className = 'tracker-select';
      if (currentTrackerItem && currentTrackerItem.status) {
        statusSel.value = currentTrackerItem.status;
        statusSel.classList.add(`status-${currentTrackerItem.status}`);
      } else {
        statusSel.value = 'none';
      }
    }

    if (currentTrackerItem) {
      if (extendedFields) extendedFields.style.display = 'block';
      const curEp = parseInt(currentTrackerItem.progress || 0, 10);
      const totalEp = parseInt(currentTrackerItem.total_episodes || 16, 10);
      if (epCurrentEl) epCurrentEl.textContent = curEp;
      if (epTotalEl) epTotalEl.textContent = totalEp;
      if (progressBar) {
        const pct = Math.min(100, Math.round((curEp / totalEp) * 100));
        progressBar.style.width = pct + '%';
        progressBar.style.background = statusColors[currentTrackerItem.status] || '#2ecc71';
      }
      if (scoreSel) scoreSel.value = String(currentTrackerItem.score || 0);
    } else {
      if (extendedFields) extendedFields.style.display = 'none';
    }
  };

  updateUI();

  // Favorite toggle
  if (favBtn) {
    favBtn.onclick = async () => {
      const res = await db.toggleFavorite(user.id, 'drama', id);
      const nowFav = !!res?.isFavorited;
      favBtn.classList.toggle('favorited', nowFav);
      const favText = document.getElementById('fav-text');
      if (favText) favText.textContent = nowFav ? 'Favorit ★' : 'Favorit';
    };
  }

  // Status select change
  if (statusSel) {
    statusSel.onchange = async () => {
      const newStatus = statusSel.value;
      if (newStatus === 'none') {
        if (confirm('Hapus drama ini dari daftar tontonan?')) {
          await db.removeFromWatchlist(id, user.id);
          currentTrackerItem = null;
          updateUI();
        } else {
          updateUI();
        }
        return;
      }

      currentTrackerItem = await db.setWatchlistStatus({
        dramaId: id,
        userId: user.id,
        status: newStatus,
        progress: currentTrackerItem ? currentTrackerItem.progress : 0,
        total_episodes: currentTrackerItem ? currentTrackerItem.total_episodes : 16,
        score: currentTrackerItem ? currentTrackerItem.score : 0
      });
      updateUI();
    };
  }

  // Ep Inc
  if (incBtn) {
    incBtn.onclick = async () => {
      if (!currentTrackerItem) return;
      currentTrackerItem = await db.updateWatchlistProgress(id, user.id, 1);
      updateUI();
    };
  }

  // Ep Dec
  if (decBtn) {
    decBtn.onclick = async () => {
      if (!currentTrackerItem) return;
      currentTrackerItem = await db.updateWatchlistProgress(id, user.id, -1);
      updateUI();
    };
  }

  // Score change
  if (scoreSel) {
    scoreSel.onchange = async () => {
      if (!currentTrackerItem) return;
      const score = parseInt(scoreSel.value, 10);
      currentTrackerItem = await db.setWatchlistStatus({
        dramaId: id,
        userId: user.id,
        status: currentTrackerItem.status,
        progress: currentTrackerItem.progress,
        total_episodes: currentTrackerItem.total_episodes,
        score
      });
      updateUI();
    };
  }

  // Remove
  if (removeBtn) {
    removeBtn.onclick = async () => {
      if (!confirm('Hapus drama ini dari daftar tontonanmu?')) return;
      await db.removeFromWatchlist(id, user.id);
      currentTrackerItem = null;
      updateUI();
    };
  }
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) initDramaTracker(dramaId);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') initDramaTracker(dramaId);
});

window.addEventListener('popstate', () => {
  initDramaTracker(dramaId);
});

document.querySelectorAll('#imdb-rating-input span').forEach(span => {
  span.addEventListener('click', () => {
    currentRating = parseInt(span.dataset.value);
    document.getElementById('selected-rating').textContent = currentRating;
    document.querySelectorAll('#imdb-rating-input span').forEach((s, i) => {
      s.classList.toggle('active', i + 1 <= currentRating);
    });
  });
});

document.getElementById('submit-review')?.addEventListener('click', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert('Login dulu ya!'), location.href = 'login.html';
  if (currentRating === 0) return alert('Kasih rating dulu dong!');
  const text = document.getElementById('review-text').value.trim();
  if (!text) return alert('Tulis sesuatu lah masa kosong!');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return alert('Gagal ambil username: ' + (profileError?.message || 'Tidak ditemukan'));

  const username = profile.username || 'Anonymous';

  if (userHasReviewed) {
    const { error } = await supabase
      .from('reviews')
      .update({ rating: currentRating, review_text: text, username })
      .eq('drama_id', dramaId)
      .eq('user_id', user.id);

    if (error) return alert('Gagal update review: ' + error.message);
    alert('Review berhasil diupdate! ⭐');
  } else {
    const { error } = await supabase
      .from('reviews')
      .insert({ drama_id: dramaId, user_id: user.id, rating: currentRating, review_text: text, username });

    if (error) return alert('Gagal submit review: ' + error.message);
    userHasReviewed = true;
    document.getElementById('submit-review').textContent = 'Update Review';
    alert('Review berhasil dikirim! Terima kasih ⭐');
  }

  fetchReviews();
  checkIfUserHasReviewed();
});

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  if (user) document.getElementById('review-form').style.display = 'block';

  const ratingEl = document.getElementById('rating');
  if (ratingEl) ratingEl.innerHTML = '⭐ Loading...';

  fetchDramaData();
});

// ===========================================
// Fungsionalitas Play Trailer (MENGGUNAKAN REDIRECT)
// ===========================================
function setupTrailerFunctionality(trailerUrl) {
 
    const playLink = document.getElementById('play-trailer-link'); 
    
    if (!trailerUrl || !playLink) {
        if (playLink) playLink.style.display = 'none'; 
        return;
    }
    
    let redirectUrl = trailerUrl;
    
    if (trailerUrl.includes('/embed/')) {
        redirectUrl = trailerUrl.replace('/embed/', '/watch?v=');
    }

    playLink.href = redirectUrl;
    playLink.style.display = 'block'; 

}