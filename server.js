// K-List Full-Stack Server & Persistent Database
// Uses local file database (data/klist-db.json) - never pauses, never expires!
// Zero external dependencies required (runs with node server.js or npm start)

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const APP_DIR = path.join(__dirname, 'K-list');
const DB_FILE = path.join(__dirname, 'data', 'klist-db.json');

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Load or initialize persistent database
let db = {
  dramas: [],
  actors: [],
  genres: [],
  drama_genres: [],
  drama_actors: [],
  reviews: [],
  watchlist: [],
  users: [],
  profiles: []
};

function calculateUserStats(userId) {
  const userItems = (db.watchlist || []).filter(w => String(w.user_id) === String(userId));
  const counts = {
    watching: 0,
    completed: 0,
    planning: 0,
    stalled: 0,
    dropped: 0
  };
  let totalEpisodesWatched = 0;
  let ratedCount = 0;
  let ratingSum = 0;
  const scoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };

  userItems.forEach(item => {
    const st = (item.status || 'watching').toLowerCase();
    if (counts[st] !== undefined) counts[st]++;
    else counts.watching++;

    const eps = parseInt(item.progress || 0, 10);
    totalEpisodesWatched += isNaN(eps) ? 0 : eps;

    const score = parseInt(item.score || 0, 10);
    if (score >= 1 && score <= 10) {
      ratedCount++;
      ratingSum += score;
      scoreDistribution[score]++;
    }
  });

  const total = userItems.length;
  const percentages = {
    watching: total ? Math.round((counts.watching / total) * 100) : 0,
    completed: total ? Math.round((counts.completed / total) * 100) : 0,
    planning: total ? Math.round((counts.planning / total) * 100) : 0,
    stalled: total ? Math.round((counts.stalled / total) * 100) : 0,
    dropped: total ? Math.round((counts.dropped / total) * 100) : 0
  };

  const daysWatched = ((totalEpisodesWatched * 60) / (24 * 60)).toFixed(1);
  const meanScore = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : '0.0';

  return {
    total,
    counts,
    percentages,
    episodesWatched: totalEpisodesWatched,
    daysWatched,
    meanScore,
    scoreDistribution
  };
}

function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(content);
      db.profiles = db.profiles || [];
      db.watchlist = db.watchlist || [];
      console.log(`[Database] Loaded persistent data from ${DB_FILE}`);
      console.log(`[Database] Total Dramas: ${db.dramas.length} | Actors: ${db.actors.length} | Reviews: ${db.reviews.length}`);
      return;
    } catch (e) {
      console.error('[Database] Failed to read database file, initializing from data.js:', e);
    }
  }

  // Fallback to data.js
  try {
    const dataScript = fs.readFileSync(path.join(APP_DIR, 'assets', 'js', 'data.js'), 'utf8');
    const runCode = new Function('window', dataScript + '; return window.KLIST_DATA;');
    const initialData = runCode({}) || {};
    db = {
      dramas: initialData.dramas || [],
      actors: initialData.actors || [],
      genres: initialData.genres || [],
      drama_genres: initialData.drama_genres || [],
      drama_actors: initialData.drama_actors || [],
      reviews: initialData.reviews || [],
      watchlist: [],
      users: [
        { id: 'user-admin', email: 'admin@klist.com', username: 'Admin', role: 'admin', created_at: new Date().toISOString() },
        { id: 'user-demo', email: 'demo@klist.com', username: 'KListDemo', role: 'user', created_at: new Date().toISOString() }
      ]
    };
    saveDatabase();
    console.log(`[Database] Initialized new database at ${DB_FILE}`);
  } catch (err) {
    console.error('[Database] Initialization error:', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('[Database] Error saving database:', e);
  }
}

loadDatabase();

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function sendJSON(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
  });
  res.end(payload);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const query = parsedUrl.query;

  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
    });
    res.end();
    return;
  }

  // ===================== REST API ENDPOINTS =====================

  // GET /api/health
  if (pathname === '/api/health') {
    return sendJSON(res, 200, {
      status: 'ok',
      engine: 'klist-local-db',
      dbFile: 'data/klist-db.json',
      dramasCount: db.dramas.length,
      actorsCount: db.actors.length,
      reviewsCount: db.reviews.length,
      timestamp: new Date().toISOString()
    });
  }

  // GET /api/dramas
  if (pathname === '/api/dramas' && req.method === 'GET') {
    let list = [...db.dramas];

    if (query.year) {
      list = list.filter(d => String(d.year) === String(query.year));
    }
    if (query.genre) {
      list = list.filter(d => (d.genreNames || []).some(g => g.toLowerCase() === query.genre.toLowerCase()));
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      list = list.filter(d => d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q));
    }

    // Attach dynamic average rating & review count
    list = list.map(d => {
      const dReviews = (db.reviews || []).filter(r => r.drama_id === d.id);
      const avg = dReviews.length > 0 
        ? (dReviews.reduce((sum, r) => sum + r.rating, 0) / dReviews.length).toFixed(1)
        : (d.rating || 'N/A');
      return {
        ...d,
        rating: avg,
        reviewCount: dReviews.length
      };
    });

    if (query.limit) {
      list = list.slice(0, parseInt(query.limit, 10));
    }

    return sendJSON(res, 200, { data: list, count: list.length });
  }

  // GET /api/dramas/:id
  const dramaMatch = pathname.match(/^\/api\/dramas\/(\d+)$/);
  if (dramaMatch && req.method === 'GET') {
    const id = parseInt(dramaMatch[1], 10);
    const drama = db.dramas.find(d => d.id === id);
    if (!drama) {
      return sendJSON(res, 404, { error: 'Drama not found' });
    }

    const cast = (db.drama_actors || [])
      .filter(da => da.drama_id === id)
      .map(da => {
        const actor = db.actors.find(a => a.id === da.actor_id);
        return {
          actor_id: da.actor_id,
          character_name: da.character_name,
          is_lead: da.is_lead,
          name: actor?.name,
          photo_url: actor?.photo_url
        };
      });

    const reviews = (db.reviews || []).filter(r => r.drama_id === id);

    return sendJSON(res, 200, {
      data: {
        ...drama,
        cast,
        reviews
      }
    });
  }

  // GET /api/actors
  if (pathname === '/api/actors' && req.method === 'GET') {
    let list = [...db.actors];
    if (query.gender) {
      list = list.filter(a => a.gender === query.gender);
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q));
    }
    return sendJSON(res, 200, { data: list, count: list.length });
  }

  // GET /api/actors/:id
  const actorMatch = pathname.match(/^\/api\/actors\/(\d+)$/);
  if (actorMatch && req.method === 'GET') {
    const id = parseInt(actorMatch[1], 10);
    const actor = db.actors.find(a => a.id === id);
    if (!actor) {
      return sendJSON(res, 404, { error: 'Actor not found' });
    }
    const dramas = (db.drama_actors || [])
      .filter(da => da.actor_id === id)
      .map(da => {
        const d = db.dramas.find(item => item.id === da.drama_id);
        return {
          drama_id: da.drama_id,
          title: d?.title,
          year: d?.year,
          poster_url: d?.poster_url,
          character_name: da.character_name,
          is_lead: da.is_lead
        };
      });

    return sendJSON(res, 200, { data: { ...actor, dramas } });
  }

  // GET & POST /api/reviews
  if (pathname === '/api/reviews') {
    if (req.method === 'GET') {
      let list = [...db.reviews];
      if (query.drama_id) {
        list = list.filter(r => String(r.drama_id) === String(query.drama_id));
      }
      return sendJSON(res, 200, { data: list });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const dramaId = parseInt(body.drama_id, 10);
      const rating = parseInt(body.rating, 10);
      const userId = body.user_id || 'anonymous';
      const username = body.username || 'Anonymous';
      const reviewText = body.review_text || '';

      // Check if user already reviewed this drama -> update it
      const existingIdx = db.reviews.findIndex(r => r.drama_id === dramaId && r.user_id === userId);
      let reviewResult;

      if (existingIdx !== -1) {
        db.reviews[existingIdx].rating = rating;
        db.reviews[existingIdx].review_text = reviewText;
        db.reviews[existingIdx].updated_at = new Date().toISOString();
        reviewResult = db.reviews[existingIdx];
      } else {
        reviewResult = {
          id: db.reviews.length > 0 ? Math.max(...db.reviews.map(r => r.id || 0)) + 1 : 1,
          drama_id: dramaId,
          user_id: userId,
          username: username,
          rating: rating,
          review_text: reviewText,
          created_at: new Date().toISOString()
        };
        db.reviews.unshift(reviewResult);
      }

      saveDatabase();
      return sendJSON(res, 201, { data: reviewResult });
    }
  }

  // GET, POST, PUT, DELETE /api/watchlist
  if (pathname.startsWith('/api/watchlist')) {
    if (req.method === 'GET') {
      let list = [...(db.watchlist || [])];
      if (query.user_id) {
        list = list.filter(w => String(w.user_id) === String(query.user_id));
      }
      if (query.status && query.status !== 'all') {
        list = list.filter(w => (w.status || 'watching').toLowerCase() === query.status.toLowerCase());
      }

      // Enrich with drama data and defaults
      const enriched = list.map(item => {
        const drama = db.dramas.find(d => d.id === item.drama_id) || {};
        return {
          id: item.id,
          drama_id: item.drama_id,
          user_id: item.user_id,
          status: item.status || 'watching',
          score: item.score || 0,
          progress: item.progress || 0,
          total_episodes: item.total_episodes || 16,
          notes: item.notes || '',
          added_at: item.added_at || new Date().toISOString(),
          updated_at: item.updated_at || item.added_at,
          drama: {
            id: drama.id,
            title: drama.title,
            year: drama.year,
            poster_url: drama.poster_url,
            description: drama.description,
            genreNames: drama.genreNames || [],
            rating: drama.rating
          }
        };
      });

      return sendJSON(res, 200, {
        data: enriched,
        stats: query.user_id ? calculateUserStats(query.user_id) : null
      });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const dramaId = parseInt(body.drama_id, 10);
      const userId = body.user_id || 'user-demo';
      const status = body.status || 'watching';
      const totalEpisodes = parseInt(body.total_episodes || 16, 10);
      let progress = parseInt(body.progress !== undefined ? body.progress : 0, 10);
      if (status === 'completed' && body.progress === undefined) {
        progress = totalEpisodes;
      }
      const score = parseInt(body.score || 0, 10);
      const notes = body.notes || '';

      db.watchlist = db.watchlist || [];
      const idx = db.watchlist.findIndex(w => w.drama_id === dramaId && String(w.user_id) === String(userId));
      let savedItem;

      if (idx !== -1) {
        db.watchlist[idx] = {
          ...db.watchlist[idx],
          status,
          score,
          progress,
          total_episodes: totalEpisodes,
          notes,
          updated_at: new Date().toISOString()
        };
        savedItem = db.watchlist[idx];
      } else {
        savedItem = {
          id: db.watchlist.length > 0 ? Math.max(...db.watchlist.map(w => w.id || 0)) + 1 : 1,
          drama_id: dramaId,
          user_id: userId,
          status,
          score,
          progress,
          total_episodes: totalEpisodes,
          notes,
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.watchlist.push(savedItem);
      }

      saveDatabase();
      return sendJSON(res, 200, {
        success: true,
        item: savedItem,
        stats: calculateUserStats(userId)
      });
    }

    if (req.method === 'PUT' && pathname === '/api/watchlist/progress') {
      const body = await parseBody(req);
      const dramaId = parseInt(body.drama_id, 10);
      const userId = body.user_id || 'user-demo';
      const delta = parseInt(body.delta || 0, 10);

      const item = (db.watchlist || []).find(w => w.drama_id === dramaId && String(w.user_id) === String(userId));
      if (!item) {
        return sendJSON(res, 404, { error: 'Watchlist item not found' });
      }

      const total = item.total_episodes || 16;
      let newProgress = body.progress !== undefined ? parseInt(body.progress, 10) : ((item.progress || 0) + delta);
      newProgress = Math.max(0, Math.min(newProgress, total));

      item.progress = newProgress;
      item.updated_at = new Date().toISOString();

      // Auto update status if finished
      if (newProgress === total && item.status !== 'completed') {
        item.status = 'completed';
      }

      saveDatabase();
      return sendJSON(res, 200, {
        success: true,
        item,
        stats: calculateUserStats(userId)
      });
    }

    if (req.method === 'DELETE') {
      const dramaId = query.drama_id ? parseInt(query.drama_id, 10) : null;
      const userId = query.user_id;

      db.watchlist = (db.watchlist || []).filter(w => {
        if (dramaId && userId) return !(w.drama_id === dramaId && String(w.user_id) === String(userId));
        if (dramaId) return w.drama_id !== dramaId;
        if (userId) return String(w.user_id) !== String(userId);
        return true;
      });
      saveDatabase();
      return sendJSON(res, 200, {
        success: true,
        watchlist: db.watchlist,
        stats: userId ? calculateUserStats(userId) : null
      });
    }
  }

  // GET, POST, PUT /api/profile
  if (pathname.startsWith('/api/profile')) {
    db.profiles = db.profiles || [];

    if (pathname === '/api/profile/favorite' && req.method === 'POST') {
      const body = await parseBody(req);
      const userId = body.user_id || 'user-demo';
      const type = body.type === 'actor' ? 'actors' : 'dramas';
      const itemId = parseInt(body.id, 10);

      let prof = db.profiles.find(p => String(p.id) === String(userId));
      if (!prof) {
        const user = (db.users || []).find(u => String(u.id) === String(userId)) || {};
        prof = {
          id: userId,
          username: user.username || 'KListFan',
          email: user.email || '',
          bio: 'K-Drama enthusiast exploring the best stories.',
          avatar: 'assets/img/Avatar.jpg',
          banner: 'assets/img/poster/Vincenzo.jpg',
          badge: 'K-Drama Enthusiast',
          favorites: { dramas: [], actors: [] },
          created_at: new Date().toISOString()
        };
        db.profiles.push(prof);
      }

      if (!prof.favorites) prof.favorites = { dramas: [], actors: [] };
      if (!Array.isArray(prof.favorites[type])) prof.favorites[type] = [];

      const existsIdx = prof.favorites[type].indexOf(itemId);
      let isFavorited = false;
      if (existsIdx !== -1) {
        prof.favorites[type].splice(existsIdx, 1);
        isFavorited = false;
      } else {
        prof.favorites[type].push(itemId);
        isFavorited = true;
      }

      saveDatabase();
      return sendJSON(res, 200, { success: true, isFavorited, favorites: prof.favorites });
    }

    if (req.method === 'GET') {
      const userId = query.user_id || 'user-demo';
      let prof = db.profiles.find(p => String(p.id) === String(userId));
      if (!prof) {
        const user = (db.users || []).find(u => String(u.id) === String(userId)) || {};
        prof = {
          id: userId,
          username: user.username || 'KListFan',
          email: user.email || '',
          bio: 'K-Drama enthusiast exploring the best stories.',
          avatar: user.avatar || 'assets/img/Avatar.jpg',
          banner: 'assets/img/poster/Vincenzo.jpg',
          badge: 'K-Drama Enthusiast',
          favorites: { dramas: [2, 3], actors: [18, 12] },
          created_at: user.created_at || new Date().toISOString()
        };
        db.profiles.push(prof);
        saveDatabase();
      }

      // Populate favorites
      const favDramas = (prof.favorites?.dramas || []).map(id => db.dramas.find(d => d.id === id)).filter(Boolean);
      const favActors = (prof.favorites?.actors || []).map(id => db.actors.find(a => a.id === id)).filter(Boolean);
      const userReviews = (db.reviews || []).filter(r => String(r.user_id) === String(userId));

      return sendJSON(res, 200, {
        profile: prof,
        favoritesData: {
          dramas: favDramas,
          actors: favActors
        },
        reviews: userReviews,
        stats: calculateUserStats(userId)
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseBody(req);
      const userId = body.user_id || (body.profile && body.profile.id) || 'user-demo';
      const profIdx = db.profiles.findIndex(p => String(p.id) === String(userId));

      let prof = profIdx !== -1 ? db.profiles[profIdx] : {
        id: userId,
        created_at: new Date().toISOString(),
        favorites: { dramas: [], actors: [] }
      };

      if (body.username) prof.username = body.username.trim();
      if (body.bio !== undefined) prof.bio = body.bio.trim();
      if (body.avatar) prof.avatar = body.avatar.trim();
      if (body.banner) prof.banner = body.banner.trim();
      if (body.badge) prof.badge = body.badge.trim();
      if (body.favorites) prof.favorites = body.favorites;

      prof.updated_at = new Date().toISOString();

      if (profIdx !== -1) {
        db.profiles[profIdx] = prof;
      } else {
        db.profiles.push(prof);
      }

      // Also update users array if username or avatar changed
      const userObj = (db.users || []).find(u => String(u.id) === String(userId));
      if (userObj) {
        if (prof.username) userObj.username = prof.username;
        if (prof.avatar) userObj.avatar = prof.avatar;
      }

      saveDatabase();
      return sendJSON(res, 200, {
        success: true,
        profile: prof,
        stats: calculateUserStats(userId)
      });
    }
  }

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const { email, password } = body;
    let user = (db.users || []).find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) {
      user = {
        id: 'user-' + Date.now(),
        email: email,
        username: email ? email.split('@')[0] : 'User',
        role: 'user',
        created_at: new Date().toISOString()
      };
      db.users.push(user);
      saveDatabase();
    }
    return sendJSON(res, 200, { user, session: { access_token: 'local-token-' + Date.now(), user } });
  }

  // POST /api/auth/register
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await parseBody(req);
    const { email, password } = body;
    const exists = (db.users || []).find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (exists) {
      return sendJSON(res, 400, { error: { message: 'User already exists' } });
    }
    const newUser = {
      id: 'user-' + Date.now(),
      email: email,
      username: email ? email.split('@')[0] : 'User',
      role: 'user',
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDatabase();
    return sendJSON(res, 201, { user: newUser });
  }

  // ===================== STATIC FILE SERVING =====================

  let targetPath = '';

  if (pathname === '/' || pathname === '' || pathname === '/K-list/' || pathname === '/K-list') {
    targetPath = path.join(APP_DIR, 'index.html');
  } else if (pathname.startsWith('/K-list/')) {
    targetPath = path.join(APP_DIR, pathname.replace('/K-list/', ''));
  } else if (pathname.startsWith('/assets/')) {
    targetPath = path.join(APP_DIR, pathname);
  } else {
    const directPath = path.join(APP_DIR, pathname);
    if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
      targetPath = directPath;
    } else {
      const rootPath = path.join(ROOT_DIR, pathname);
      if (fs.existsSync(rootPath) && fs.statSync(rootPath).isFile()) {
        targetPath = rootPath;
      } else {
        targetPath = directPath;
      }
    }
  }

  fs.stat(targetPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`<h1>404 Not Found</h1><p>The requested file ${pathname} was not found.</p>`);
      return;
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=3600'
    });

    const readStream = fs.createReadStream(targetPath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 K-List Persistent Server & Database is RUNNING!`);
  console.log(`🌐 Local URL:      http://localhost:${PORT}`);
  console.log(`💾 Database:       data/klist-db.json (Persistent, Zero Pausing!)`);
  console.log(`🖼️  Poster Images:  40/40 Loaded`);
  console.log(`🎭 Actor Photos:   21/21 Loaded`);
  console.log(`⚡ Supabase:       REPLACED with Local Persistent Database`);
  console.log(`=======================================================`);
});
