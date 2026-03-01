document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const suggestionsContainer = document.getElementById('search-suggestions');
  const searchBtn = document.getElementById('search-btn');

  if (!searchInput || !suggestionsContainer) {
    return;
  }

  let currentSuggestions = [];

  const fetchSuggestions = async (query) => {
  if (query.length < 2) {
    suggestionsContainer.classList.remove('show');
    suggestionsContainer.innerHTML = '';
    return;
  }


  const { data: dramas, error } = await supabase
    .from('dramas')
    .select('id, title, year, poster_url')
    .ilike('title', `%${query}%`)
    .limit(10);

  console.log('Error kalau ada:', error);

  if (error || !dramas || dramas.length === 0) {
    console.log('No data or error - render pesan kosong');
    suggestionsContainer.innerHTML = '<div class="no-result">Tidak ditemukan drama</div>';
    suggestionsContainer.classList.add('show');
    return;
  }

  currentSuggestions = dramas;


  const htmlToRender = dramas.map(d => `
    <div class="suggestion-item" data-id="${d.id || 'undefined'}">
      <img src="${d.poster_url || 'https://via.placeholder.com/70x100/222/666?text=No+Poster'}" loading="lazy" alt="${d.title || 'No Title'}">
      <div>
        <div class="suggestion-title">${d.title || 'Untitled'}</div>
        <div class="suggestion-year">${d.year || '−'}</div>
      </div>
    </div>
  `).join('');

  suggestionsContainer.innerHTML = htmlToRender;
  suggestionsContainer.classList.add('show');
};

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    fetchSuggestions(query);
  });

  suggestionsContainer.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (item) window.location.href = `drama-detail.html?id=${item.dataset.id}`;
  });

  const goFirst = () => {
    if (currentSuggestions.length > 0) {
      window.location.href = `drama-detail.html?id=${currentSuggestions[0].id}`;
    }
  };

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goFirst();
    }
  });

  if (searchBtn) searchBtn.addEventListener('click', goFirst);

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= 2 && currentSuggestions.length > 0) {
      suggestionsContainer.classList.add('show');
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.classList.remove('show');
    }
  });
});

// ==================== CEK APAKAH INI HOMEPAGE ====================
const isHomePage = document.body.classList.contains('page-transition') && 
                   (location.pathname.includes('index.html') || 
                    location.pathname === '/' || 
                    document.getElementById('hero-title'));

// ==================== HERO SLIDES (Hanya di homepage) ====================
if (isHomePage) {
  const heroSlides = [
    { title: "Bon Appétit, Your Majesty", genres: ["Romance", "Comedy", "Historical"], desc: "Lita, a cheerful modern woman, suddenly finds herself in a royal palace and becomes the personal chef for Emperor Raynard.", bg: "assets/img/poster/bon appetit.jpg" },
    { title: "Vincenzo", genres: ["Action", "Crime", "Comedy"], desc: "An Italian-Korean lawyer working for the mafia returns to Seoul to seek revenge, but his mission becomes even more dangerous when he gets entangled with a corrupt law firm.", bg: "assets/img/poster/Vincenzo.jpg" },
    { title: "Crash Landing on You", genres: ["Romance", "Drama"], desc: "A wealthy chaebol heiress accidentally crash-lands in North Korea and unexpectedly falls in love with an army captain who risks everything to protect her.", bg: "assets/img/poster/cloy.jpg" }
  ];

  let currentSlide = 0;

  function renderHero() {
    const slide = heroSlides[currentSlide];
    const titleEl = document.getElementById('hero-title');
    const genresEl = document.getElementById('hero-genres');
    const descEl = document.getElementById('hero-desc');
    const heroImg = document.getElementById('hero-bg-img');

    if (!titleEl || !genresEl || !descEl || !heroImg) return;

    titleEl.textContent = slide.title;
    genresEl.innerHTML = slide.genres.map(g => `<span>${g}</span>`).join('');
    descEl.textContent = slide.desc;

    heroImg.style.opacity = 0;
    heroImg.src = slide.bg;
    heroImg.onload = () => {
      heroImg.classList.add('loaded');
      heroImg.style.opacity = 1;
    };
    heroImg.onerror = () => {
      heroImg.src = "https://via.placeholder.com/1920x1080/333/fff?text=GAMBAR+HILANG";
      heroImg.classList.add('loaded');
      heroImg.style.opacity = 1;
    };

    document.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  function renderDots() {
    const container = document.getElementById('hero-dots');
    if (!container) return;
    container.innerHTML = heroSlides.map((_, i) => 
      `<span class="dot" data-slide="${i}"></span>`
    ).join('');

    container.querySelectorAll('.dot').forEach(dot => {
      dot.addEventListener('click', () => {
        currentSlide = parseInt(dot.dataset.slide);
        renderHero();
      });
    });
  }

  setInterval(() => {
    currentSlide = (currentSlide + 1) % heroSlides.length;
    renderHero();
  }, 6000);

  renderDots();
  renderHero();
}

// ==================== CARD CREATOR (Hanya dipakai di homepage) ====================
function createCard(d) {
  const genreText = Array.isArray(d.genre) ? d.genre.join(', ') : 'No Genre';
  const ratingText = d.rating && d.rating !== '0.0' ? d.rating : 'N/A';

  return `
   <div class="drama-card" onclick="location.href='drama-detail.html?id=${d.id}'" style="cursor:pointer;">
      <img src="${d.img || 'assets/img/no-poster.jpg'}" 
           alt="${d.title}"
           onerror="this.src='assets/img/no-poster.jpg'">
      
      <button class="watchlist-add home-watchlist-btn" data-drama-id="${d.id}">
        +
      </button>

      <div class="card-info">
        <h3>${d.title}</h3>
        <div class="card-genre">${Array.isArray(d.genre) ? d.genre.join(', ') : 'No Genre'}</div>
        <div class="card-rating">★★★★★ ${d.rating && d.rating !== '0.0' ? d.rating : 'N/A'}</div>
      </div>
    </div>
  `;
}

// ==================== FETCH DRAMA UNTUK HOMEPAGE (Hanya di homepage) ====================
let fetchHomeDramas = () => {};
if (isHomePage) {
  fetchHomeDramas = async function() {
    const currentYear = new Date().getFullYear();

    // Ambil semua drama
    const { data: dramasData } = await supabase
      .from('dramas')
      .select('id, title, year, poster_url, drama_genres(genres(name))');

    // Ambil semua review
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('drama_id, rating');

    // Hitung rating
    const ratingMap = {};
    allReviews?.forEach(r => {
      if (!ratingMap[r.drama_id]) ratingMap[r.drama_id] = { sum: 0, count: 0 };
      ratingMap[r.drama_id].sum += r.rating;
      ratingMap[r.drama_id].count += 1;
    });

    const dramasWithRating = (dramasData || []).map(d => {
      const stats = ratingMap[d.id];
      const avg = stats?.count > 0 ? (stats.sum / stats.count).toFixed(1) : 'N/A';
      return {
        id: d.id,
        title: d.title || 'Unknown',
        year: d.year || '?',
        img: d.poster_url || 'https://via.placeholder.com/300x450/222/fff?text=No+Poster',
        rating: avg,
        genre: d.drama_genres?.map(g => g.genres.name) || []
      };
    });
    // Filter & sort per section
    const topAiring = dramasWithRating
      .filter(d => d.year == currentYear)
      .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
      .slice(0, 10);

    const mostPopular = [...dramasWithRating]
      .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
      .slice(0, 10);

    const trending2025 = dramasWithRating
      .filter(d => d.year == 2025)
      .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
      .slice(0, 10);

    const upcoming = dramasWithRating
      .filter(d => d.year > currentYear)
      .sort((a, b) => a.year - b.year)
      .slice(0, 10);

    const dramaSections = {
      "top-airing": topAiring,
      "most-popular": mostPopular,
      "trending-2025": trending2025,
      "upcoming": upcoming
    };

    renderAll(dramaSections);
  }

  document.addEventListener('DOMContentLoaded', fetchHomeDramas);
}

  function renderAll(dramas) {
    const renderGrid = (id, items) => {
      const grid = document.getElementById(id);
      if (!grid) return;
      grid.innerHTML = items.length > 0 
        ? items.map(createCard).join('') 
        : '<p style="color:#aaa;text-align:center;padding:2rem;">Tidak ada data.</p>';
    };

    renderGrid("top-airing", dramas["top-airing"]);
    renderGrid("most-popular", dramas["most-popular"]);
    renderGrid("trending-2025", dramas["trending-2025"]);
    renderGrid("upcoming", dramas["upcoming"]);

    async function updateHomeWatchlistButtons() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    document.querySelectorAll('.home-watchlist-btn').forEach(btn => {
      btn.textContent = '+';
      btn.classList.remove('added');
    });
    return;
  }

  const { data: items } = await supabase
    .from('watchlist')
    .select('drama_id')
    .eq('user_id', user.id);

  const watchedIds = new Set(items?.map(i => i.drama_id) || []);

  document.querySelectorAll('.home-watchlist-btn').forEach(btn => {
    const id = parseInt(btn.dataset.dramaId);
    const isAdded = watchedIds.has(id);

    if (isAdded) {
      btn.textContent = '✓';
      btn.classList.add('added');
      btn.style.background = '#fd0e0eff';
      btn.style.transform = 'scale(1.2)';
    } else {
      btn.textContent = '+';
      btn.classList.remove('added');
      btn.style.background = '';
      btn.style.transform = '';
    }
  });
}

// Jalankan setelah render grid & setiap login/logout
if (typeof renderAll === 'function') {
  const oldRenderAll = renderAll;
  renderAll = function(dramas) {
    oldRenderAll(dramas);
    updateHomeWatchlistButtons();
  };
}

// Jalankan saat auth berubah
supabase.auth.onAuthStateChange(() => {
  setTimeout(updateHomeWatchlistButtons, 300);
});

    // Scroll buttons
    document.querySelectorAll('.scroll-btn').forEach(btn => {
      btn.onclick = () => {
        const grid = btn.closest('section')?.querySelector('.drama-grid-horizontal');
        if (grid) grid.scrollBy({ left: btn.classList.contains('left-btn') ? -400 : 400, behavior: 'smooth' });
      };
    });

    // Watchlist buttons aktif
    if (typeof initWatchlistButtons === 'function') initWatchlistButtons();
  }

  document.addEventListener('DOMContentLoaded', fetchHomeDramas);


document.addEventListener('DOMContentLoaded', () => {
  const currentPath = location.pathname.toLowerCase().split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
    const linkHref = link.getAttribute('href').toLowerCase().split('/').pop() || 'index.html';

    if (linkHref === currentPath ||
        (['index.html', ''].includes(linkHref) && ['index.html', ''].includes(currentPath)) ||
        (linkHref === 'drama.html' && currentPath === 'drama.html')) {
      link.classList.add('active');
    }
  });
});

// Dropdown user
document.addEventListener('DOMContentLoaded', () => {
  const userBtn = document.getElementById('user-btn');
  const dropdown = document.getElementById('user-dropdown');
  if (userBtn && dropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
  }
});

// Page fade-in
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('show');
});

// Watchlist buttons
if (typeof initWatchlistButtons === 'function') {
  document.addEventListener('DOMContentLoaded', initWatchlistButtons);
  supabase.auth.onAuthStateChange(() => setTimeout(initWatchlistButtons, 200));
}
