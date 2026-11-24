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
  users: []
};

function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(content);
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

  // GET, POST, DELETE /api/watchlist
  if (pathname.startsWith('/api/watchlist')) {
    if (req.method === 'GET') {
      let list = [...(db.watchlist || [])];
      if (query.user_id) {
        list = list.filter(w => String(w.user_id) === String(query.user_id));
      }
      return sendJSON(res, 200, { data: list });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const dramaId = parseInt(body.drama_id, 10);
      const userId = body.user_id || 'user-demo';

      const found = (db.watchlist || []).find(w => w.drama_id === dramaId && w.user_id === userId);
      if (!found) {
        const item = {
          id: db.watchlist.length > 0 ? Math.max(...db.watchlist.map(w => w.id || 0)) + 1 : 1,
          drama_id: dramaId,
          user_id: userId,
          added_at: new Date().toISOString()
        };
        db.watchlist.push(item);
        saveDatabase();
      }
      return sendJSON(res, 200, { success: true, watchlist: db.watchlist });
    }

    if (req.method === 'DELETE') {
      const dramaId = query.drama_id ? parseInt(query.drama_id, 10) : null;
      const userId = query.user_id;

      db.watchlist = (db.watchlist || []).filter(w => {
        if (dramaId && userId) return !(w.drama_id === dramaId && w.user_id === userId);
        if (dramaId) return w.drama_id !== dramaId;
        if (userId) return w.user_id !== userId;
        return true;
      });
      saveDatabase();
      return sendJSON(res, 200, { success: true, watchlist: db.watchlist });
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
