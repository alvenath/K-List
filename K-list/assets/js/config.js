// K-List Database Configuration
// Supabase has been replaced with the local persistent database (assets/js/db.js)
// Never pauses, never requires restarting!

// If db.js is loaded, it provides window.db and window.supabase
if (typeof window.db === 'undefined') {
  // In case config.js is loaded standalone, load db.js
  const script = document.createElement('script');
  script.src = 'assets/js/db.js';
  document.head.appendChild(script);
}
