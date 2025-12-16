let allDramas = []; 
const itemsPerPage = 5;
let currentPage = 1;
let filteredDramas = [];

async function fetchDramas() {
  const { data: dramas } = await supabase
    .from('dramas')
    .select(`
      id, title, year, description, poster_url,
      drama_genres(genres(name))
    `);

  const { data: allReviews } = await supabase
    .from('reviews')
    .select('drama_id, rating');

  const ratingMap = {};
  allReviews?.forEach(r => {
    if (!ratingMap[r.drama_id]) ratingMap[r.drama_id] = { sum: 0, count: 0 };
    ratingMap[r.drama_id].sum += r.rating;
    ratingMap[r.drama_id].count += 1;
  });

  allDramas = (dramas || []).map(d => {
    const stats = ratingMap[d.id];
    const avg = stats?.count > 0 ? (stats.sum / stats.count).toFixed(1) : 'N/A';
    return {
      id: d.id,
      title: d.title,
      year: parseInt(d.year) || 0,
      rating: avg,
      img: d.poster_url,
      desc: d.description,
      genre: d.drama_genres?.map(g => g.genres.name) || []
    };
  });

  filteredDramas = [...allDramas];
  renderDramas();
  initWatchlistButtons();
}

function renderCard(d) {
  const dramaGenres = Array.isArray(d.genre) ? d.genre : [];
  const genreTags = dramaGenres.map(g => `<span class="genre-tag">${g}</span>`).join('');

  return `
    <div class="drama-card-big" onclick="location.href='drama-detail.html?id=${d.id}'" style="cursor: pointer;">
      <img src="${d.img || 'https://via.placeholder.com/280x340/222/fff?text=No+Poster'}" 
           alt="${d.title}" 
           onerror="this.src='https://via.placeholder.com/280x340/222/fff?text=${encodeURIComponent(d.title)}'">
      <button class="watchlist-btn-big" data-drama-id="${d.id}" title="Add to Watchlist">+</button>

      <div class="card-content">
        <h3>${d.title}</h3>
        <div class="year-line">${d.year}</div> 
        <div class="rating">★★★★★ ${d.rating}</div>
        <div class="genre-tags">${genreTags}</div>
        <div class="desc">${d.desc || 'Belum ada deskripsi.'}</div>
      </div>
    </div>
  `;
}

function renderDramas() {
  const grid = document.getElementById("drama-grid");
  if (!grid) return;
    
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  
  if (filteredDramas.length === 0) {
    grid.innerHTML = '<p style="color:#aaa; text-align:center; padding:4rem;">Tidak ada drama yang sesuai filter.</p>';
    document.getElementById("pagination").innerHTML = '';
    return;
  }
    
  grid.innerHTML = filteredDramas.slice(start, end).map(renderCard).join('');
  renderPagination();
  initWatchlistButtons();
  
}

function renderPagination() {
  const totalPages = Math.ceil(filteredDramas.length / itemsPerPage);
  const pagination = document.getElementById("pagination");
  if (!pagination) return;
    
  pagination.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = i;
      renderDramas();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    pagination.appendChild(btn);
  }
  
  if (totalPages > 1) {
    const next = document.createElement("button");
    next.textContent = "→";
    next.onclick = () => currentPage < totalPages && (currentPage++, renderDramas(), window.scrollTo({top:0, behavior:'smooth'}));
    pagination.appendChild(next);
  }
}

function applyFilters() {
  const years = Array.from(document.querySelectorAll('.year-list input:checked')).map(c => c.value);
  const genres = Array.from(document.querySelectorAll('.genre-list input:checked')).map(c => c.value);

  filteredDramas = allDramas.filter(d => {
    const yearOk = years.length === 0 || years.includes(String(d.year));
    const dramaGenres = Array.isArray(d.genre) ? d.genre : [];
    const genreOk = genres.length === 0 || genres.some(g => dramaGenres.includes(g));
    return yearOk && genreOk;
  });

  currentPage = 1;
  renderDramas();
}

function resetFilters() {
  document.querySelectorAll('.year-list input, .genre-list input').forEach(cb => {
    cb.checked = false;
  });
  applyFilters(); 
}

document.addEventListener("DOMContentLoaded", () => {
  fetchDramas(); 
  document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
  document.getElementById('reset-filters')?.addEventListener('click', resetFilters);
});