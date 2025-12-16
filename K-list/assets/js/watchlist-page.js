async function loadWatchlist() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return location.href = 'login.html';

  const { data: watchlistData, error } = await supabase
    .from('watchlist')
    .select(`
      added_at,
      drama_id,
      dramas (
        id,
        title,
        year,
        poster_url,
        description,
        drama_genres(genres(name))
      )
    `)
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error load watchlist:', error);
    document.getElementById('watchlist-grid').innerHTML = `
      <p style="color:#f66;text-align:center;padding:4rem 0;">
        Gagal memuat watchlist!<br>
        <small>${error.message}</small>
      </p>`;
    return;
  }

  if (!watchlistData || watchlistData.length === 0) {
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('watchlist-grid').innerHTML = '';
    document.getElementById('count').textContent = '0';
    return;
  }

  const { data: allReviews } = await supabase
    .from('reviews')
    .select('drama_id, rating');

  const ratingMap = {};
  allReviews?.forEach(r => {
    if (!ratingMap[r.drama_id]) ratingMap[r.drama_id] = { sum: 0, count: 0 };
    ratingMap[r.drama_id].sum += r.rating;
    ratingMap[r.drama_id].count += 1;
  });

  const dramas = watchlistData
    .filter(item => item.dramas)
    .map(item => {
      const d = item.dramas;
      const stats = ratingMap[d.id];
      const avgRating = stats?.count > 0 ? (stats.sum / stats.count).toFixed(1) : 'N/A';

      return {
        id: d.id,
        title: d.title || 'Unknown Drama',
        year: d.year ?? '?',
        poster: d.poster_url || 'https://via.placeholder.com/280x380/222/fff?text=No+Poster',
        rating: avgRating,
        desc: d.description || 'Belum ada sinopsis.'
      };
    });

  const grid = document.getElementById('watchlist-grid');
  const count = document.getElementById('count');
  const empty = document.getElementById('empty-state');

  empty.style.display = 'none';
  count.textContent = dramas.length;

  grid.innerHTML = dramas.map(d => `
    <div class="watchlist-card" onclick="location.href='drama-detail.html?id=${d.id}'">
      <img src="${d.poster}" alt="${d.title}" loading="lazy">
      <button class="remove-btn" data-drama-id="${d.id}">−</button>
      <div class="info">
        <h3>${d.title}</h3>
        <div class="year">${d.year}</div>
        <div class="rating">⭐ ${d.rating}</div>
        <p class="desc">${d.desc}</p>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Hapus dari watchlist?')) return;

      const { error: delError } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('drama_id', btn.dataset.dramaId);

      if (delError) {
        alert('Gagal hapus: ' + delError.message);
      } else {
        loadWatchlist();
        if (typeof initWatchlistButtons === 'function') initWatchlistButtons();
      }
    };
  });
}

document.addEventListener('DOMContentLoaded', loadWatchlist);
supabase.auth.onAuthStateChange(() => setTimeout(loadWatchlist, 300));