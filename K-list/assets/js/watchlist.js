async function initWatchlistButtons() {
  const buttons = document.querySelectorAll('[data-drama-id]');
  if (buttons.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  
  const updateAllButtons = async () => {
    if (!user) {
      buttons.forEach(btn => {
        btn.innerHTML = '+';
        btn.classList.remove('added');
        btn.title = 'Login untuk menambahkan ke Watchlist';
      });
      return;
    }

    const { data: watchlistItems } = await supabase
      .from('watchlist')
      .select('drama_id')
      .eq('user_id', user.id);

    const watchedDramaIds = new Set(watchlistItems?.map(item => item.drama_id) || []);

    buttons.forEach(btn => {
      const dramaId = btn.dataset.dramaId;
      const isAdded = watchedDramaIds.has(Number(dramaId));

      if (isAdded) {
        btn.innerHTML = '✓';
        btn.classList.add('added');
        btn.title = 'Hapus dari Watchlist';
      } else {
        btn.innerHTML = '+';
        btn.classList.remove('added');
        btn.title = 'Tambah ke Watchlist';
      }
    });
  };

  // Klik tombol
  buttons.forEach(btn => {
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Login dulu ya!');
        location.href = 'login.html';
        return;
      }

      const dramaId = btn.dataset.dramaId;
      const isAdded = btn.classList.contains('added');

      if (isAdded) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('drama_id', dramaId);
      } else {
        await supabase
          .from('watchlist')
          .insert({ user_id: user.id, drama_id: dramaId });
      }

      updateAllButtons();
    };
  });

  updateAllButtons();
}

// Jalankan saat load & saat auth berubah
document.addEventListener('DOMContentLoaded', initWatchlistButtons);
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
    setTimeout(initWatchlistButtons, 300);
  }
});