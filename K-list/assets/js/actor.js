let allActors = [];

async function fetchActors() {
  const { data, error } = await supabase
    .from('actors')
    .select('id, name, birth_year, gender, photo_url, bio')
    .order('name');

  if (error) {
    console.error('Error fetching actors:', error);
    document.getElementById('actor-grid').innerHTML = '<p style="color:#aaa;text-align:center;padding:4rem;">Gagal memuat aktor.</p>';
    return;
  }

  allActors = data || [];
  renderActors(allActors);
}

function renderActors(actors) {
  const grid = document.getElementById('actor-grid');
  if (!grid) return;

  if (actors.length === 0) {
    grid.innerHTML = '<p style="color:#aaa; text-align:center; padding:4rem;">Tidak ada aktor yang sesuai filter.</p>';
    return;
  }

  grid.innerHTML = actors.map(actor => {
    const birthYear = actor.birth_year;
    let yearDisplay = 'Tahun tidak diketahui';
    let yearRange = '';

    if (birthYear) {
      yearDisplay = birthYear;
      if (birthYear >= 1980 && birthYear <= 1989) yearRange = '1980s';
      else if (birthYear >= 1990 && birthYear <= 1999) yearRange = '1990s';
      else if (birthYear >= 2000) yearRange = '2000s';
    }

    return `
      <div class="actor-card"
           data-birth-range="${yearRange}"
           data-gender="${actor.gender || ''}">
        <img src="${actor.photo_url || 'https://via.placeholder.com/280x380/222/666?text=No+Image'}" 
             alt="${actor.name}"
             onerror="this.src='https://via.placeholder.com/280x380/222/666?text=${encodeURIComponent(actor.name)}'">
        <div class="actor-info">
          <h3>${actor.name}</h3>
          <div class="actor-birth">${yearDisplay}</div>
          <p class="description">${actor.bio || 'Belum ada bio.'}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Filter hanya jalan saat klik "Terapkan"
function applyFilters() {
  const checkedYears = Array.from(document.querySelectorAll('.filter-group input[value*="s"]:checked'))
    .map(cb => cb.value);

  const checkedGenders = Array.from(
  document.querySelectorAll('.filter-group input[type="checkbox"]:checked')
)
  .map(cb => cb.value)
  .filter(v => v === "Pria" || v === "Wanita");

  const filtered = allActors.filter(actor => {
    const yearOk = checkedYears.length === 0 || checkedYears.some(range => {
      if (!actor.birth_year) return false;
      if (range === '1980s') return actor.birth_year >= 1980 && actor.birth_year <= 1989;
      if (range === '1990s') return actor.birth_year >= 1990 && actor.birth_year <= 1999;
      if (range === '2000s') return actor.birth_year >= 2000;
    });

    const genderOk = checkedGenders.length === 0 || checkedGenders.includes(actor.gender);

    return yearOk && genderOk;
  });

  renderActors(filtered);
}

function resetFilters() {
  document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
  renderActors(allActors);
}

// Jalankan saat halaman dibuka
document.addEventListener('DOMContentLoaded', () => {
  fetchActors();

  document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
  document.getElementById('reset-filters')?.addEventListener('click', resetFilters);
});