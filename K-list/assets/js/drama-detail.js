
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
  await checkWatchlistStatus(dramaId); 
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

async function checkWatchlistStatus(id) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  
  const btn = document.getElementById('watchlist-toggle');

  if (!user || !btn) {
    if (btn) btn.style.display = 'none';
    return;
  }
  btn.style.display = 'block';

  console.log('1. [checkWatchlistStatus] Mulai cek status untuk drama ID:', id, 'dengan User ID:', user.id); 

  const { data, error } = await supabase
    .from('watchlist')
    .select('drama_id') 
    .eq('user_id', user.id) 
    .eq('drama_id', id)
    .maybeSingle();

  if (error) {
    console.error('!!! ERROR SUPABASE (STATUS 400/Lainnya):', error.message, error);
    return; 
  }
  
  console.log('2. [checkWatchlistStatus] Hasil DB (Data):', data);

  btn.textContent = data ? '✓ In Watchlist' : '+ Add to Watchlist';
  btn.classList.toggle('added', !!data);
}

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        checkWatchlistStatus(dramaId);
    }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkWatchlistStatus(dramaId);
  }
});

window.addEventListener('popstate', () => {
  checkWatchlistStatus(dramaId);
});


document.getElementById('watchlist-toggle')?.addEventListener('click', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return location.href = 'login.html';

  const btn = document.getElementById('watchlist-toggle');
  
  if (isToggling) return;
  isToggling = true;
  btn.disabled = true;
  
  let operationError = null; 

  if (btn.classList.contains('added')) {
    const { error } = await supabase.from('watchlist').delete().match({ user_id: user.id, drama_id: dramaId });
    operationError = error;

    if (!error) {
      btn.textContent = '+ Add to Watchlist';
      btn.classList.remove('added');
    }

  } else {
    const { error } = await supabase.from('watchlist').insert({ user_id: user.id, drama_id: dramaId });
    operationError = error;

    if (!error) {
      btn.textContent = '✓ In Watchlist';
      btn.classList.add('added');
    }
  }

  if (operationError) {
    console.error('Terdeteksi Error pada Supabase:', operationError.message);
    await checkWatchlistStatus(dramaId);
  }
  
  isToggling = false;
  btn.disabled = false;
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