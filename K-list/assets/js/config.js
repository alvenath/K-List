
const SUPABASE_URL = 'https://rwwnbaabyszqovinirwy.supabase.co';        
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3d25iYWFieXN6cW92aW5pcnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTUxNjksImV4cCI6MjA3OTYzMTE2OX0.bg1jdH7Nq_gRCFjls3vfS14E2_p_NTQ4zZK0oEtIpYE';  // GANTI DENGAN ANON KEY KAMU

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Biar semua file lain tetap bisa pakai "supabase"
window.supabase = supabaseClient;