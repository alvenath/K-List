console.log("auth.js dimuat");

let isAdminChecked = false;

// FUNGSI UTAMA: UPDATE UI
async function updateUI(user) {
  const userDropdown = document.getElementById("user-dropdown");

  if (user) {
    document.querySelectorAll('a[href*="login.html"], a[href*="register.html"]')
      .forEach(el => el.style.display = "none");

    const logoutBtn = document.getElementById("logout-link");
    if (logoutBtn) logoutBtn.style.display = "block";

    document.querySelectorAll(".watchlist-btn").forEach(btn => {
      btn.href = "watchlist.html";
      btn.classList.remove("need-login");
    });

    if (userDropdown) {
      let profileLink = document.getElementById("profile-link");
      if (!profileLink) {
        profileLink = document.createElement("a");
        profileLink.id = "profile-link";
        profileLink.href = "profile.html";
        profileLink.innerHTML = "👤 Profil Saya";
        userDropdown.insertBefore(profileLink, logoutBtn || userDropdown.firstChild);
      }
      profileLink.style.display = "block";

      let watchlistLink = document.getElementById("dropdown-watchlist-link");
      if (!watchlistLink) {
        watchlistLink = document.createElement("a");
        watchlistLink.id = "dropdown-watchlist-link";
        watchlistLink.href = "watchlist.html";
        watchlistLink.innerHTML = "📋 Watchlist";
        userDropdown.insertBefore(watchlistLink, logoutBtn || userDropdown.firstChild);
      }
      watchlistLink.style.display = "block";
    }

    const userBtn = document.getElementById("user-btn");
    if (userBtn && user.avatar) {
      userBtn.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1px solid #E50914;" />`;
    }

  // JIKA USER LOGOUT / BELUM LOGIN
  } else {
    document.querySelectorAll('a[href*="login.html"], a[href*="register.html"]')
      .forEach(el => el.style.display = "block");

    const logoutBtn = document.getElementById("logout-link");
    if (logoutBtn) logoutBtn.style.display = "none";

    const profileLink = document.getElementById("profile-link");
    if (profileLink) profileLink.style.display = "none";

    const watchlistLink = document.getElementById("dropdown-watchlist-link");
    if (watchlistLink) watchlistLink.style.display = "none";

    const adminLink = document.getElementById("admin-link");
    if (adminLink) adminLink.remove();
  }
}


supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth Event:", event);
  updateUI(session?.user || null);
});


(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  updateUI(session?.user || null);
})();

// LOGOUT
document.addEventListener("click", async (e) => {
  if (e.target && e.target.id === "logout-link") {
    e.preventDefault();
    const { error } = await supabase.auth.signOut();
    if (!error) location.href = "login.html";
  }
});
