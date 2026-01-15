console.log("auth.js dimuat");

let isAdminChecked = false;

// FUNGSI UTAMA: UPDATE UI
async function updateUI(user) {
  if (user) {

    document.querySelectorAll('a[href*="login.html"], a[href*="register.html"]')
      .forEach(el => el.style.display = "none");

    const logoutBtn = document.getElementById("logout-link");
    if (logoutBtn) logoutBtn.style.display = "block";

    document.querySelectorAll(".watchlist-btn").forEach(btn => {
      btn.href = "watchlist.html";
      btn.classList.remove("need-login");
    });

  // JIKA USER LOGOUT / BELUM LOGIN
  } else {
    document.querySelectorAll('a[href*="login.html"], a[href*="register.html"]')
      .forEach(el => el.style.display = "block");

    const logoutBtn = document.getElementById("logout-link");
    if (logoutBtn) logoutBtn.style.display = "none";

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
