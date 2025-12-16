let currentUser = null;

// Cek admin saat load
supabase.auth.getUser().then(async ({data}) => {
  if (!data.user) return location.href = '../login.html';
  currentUser = data.user;

  const {data: profile} = await supabase.from('profiles').select('role,username').eq('id', currentUser.id).single();
  if (profile.role !== 'admin') {
    alert('Access denied!');
    location.href = '../index.html';
  }

  document.querySelector('h1.page-title').insertAdjacentHTML('afterend', `<p style="text-align:center;color:#aaa;">Halo, <strong>${profile.username || currentUser.email}</strong> 👑</p>`);
  
  loadTab('drama');
});
// Cek admin saat load
supabase.auth.getUser().then(async ({data}) => {
  if (!data.user) return location.href = '../login.html';
  currentUser = data.user;

  const {data: profile} = await supabase.from('profiles').select('role,username').eq('id', currentUser.id).single();
  if (profile.role !== 'admin') {
    alert('Access denied!');
    location.href = '../index.html';
    return;
  }
  
  document.body.style.visibility = 'visible'; 
 
  document.querySelector('h1.page-title').insertAdjacentHTML('afterend', `<p style="text-align:center;color:#aaa;">Halo, <strong>${profile.username || currentUser.email}</strong> 👑</p>`);
  
  loadTab('drama');
});

// Ganti tab
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadTab(btn.dataset.tab);
  });
});

async function loadTab(tab) {
  const content = document.getElementById('tab-content');
  const res = await fetch(`partials/${tab}-tab.html`);
  content.innerHTML = await res.text();

  // Load data sesuai tab
  if (tab === 'drama') initDramaTab();
  if (tab === 'actor') initActorTab();
  if (tab === 'cast') initCastTab();
  if (tab === 'users') initUsersTab();
  if (tab === 'reviews') initReviewsTab();
}
