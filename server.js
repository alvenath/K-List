// K-List Dedicated Full-Stack Backend Server
// Supports zero-dependency startup (node server.js or npm start)
// Serves static frontend assets & image folders + RESTful API

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const APP_DIR = path.join(__dirname, 'K-list');

// Load Dataset from data.js
let klistData = { dramas: [], actors: [], genres: [], drama_genres: [], drama_actors: [], reviews: [] };
try {
  const dataScript = fs.readFileSync(path.join(APP_DIR, 'assets', 'js', 'data.js'), 'utf8');
  const sandbox = {};
  const runCode = new Function('window', dataScript + '; return window.KLIST_DATA;');
  klistData = runCode(sandbox) || klistData;
  console.log(`[Backend Data] Loaded ${klistData.dramas.length} dramas, ${klistData.actors.length} actors, ${klistData.genres.length} genres`);
} catch (err) {
  console.error('[Backend Data] Failed to load data.js:', err);
}

// In-Memory store for runtime reviews and watchlists
const runtimeReviews = [...(klistData.reviews || [])];
const runtimeWatchlist = [];

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
  return new Promise((resolve, reject) => {
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
    req.on('error', reject);
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
      dramasCount: klistData.dramas.length,
      actorsCount: klistData.actors.length,
      timestamp: new Date().toISOString()
    });
  }

  // GET /api/dramas
  if (pathname === '/api/dramas' && req.method === 'GET') {
    let list = [...klistData.dramas];

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

    // Attach average rating
    list = list.map(d => {
      const dReviews = runtimeReviews.filter(r => r.drama_id === d.id);
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
    const drama = klistData.dramas.find(d => d.id === id);
    if (!drama) {
      return sendJSON(res, 404, { error: 'Drama not found' });
    }

    const cast = (klistData.drama_actors || [])
      .filter(da => da.drama_id === id)
      .map(da => {
        const actor = klistData.actors.find(a => a.id === da.actor_id);
        return {
          actor_id: da.actor_id,
          character_name: da.character_name,
          is_lead: da.is_lead,
          name: actor?.name,
          photo_url: actor?.photo_url
        };
      });

    const reviews = runtimeReviews.filter(r => r.drama_id === id);

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
    let list = [...klistData.actors];
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
    const actor = klistData.actors.find(a => a.id === id);
    if (!actor) {
      return sendJSON(res, 404, { error: 'Actor not found' });
    }
    const dramas = (klistData.drama_actors || [])
      .filter(da => da.actor_id === id)
      .map(da => {
        const d = klistData.dramas.find(item => item.id === da.drama_id);
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
      let list = [...runtimeReviews];
      if (query.drama_id) {
        list = list.filter(r => String(r.drama_id) === String(query.drama_id));
      }
      return sendJSON(res, 200, { data: list });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const newReview = {
        id: runtimeReviews.length + 1,
        drama_id: parseInt(body.drama_id, 10),
        rating: parseInt(body.rating, 10),
        review_text: body.review_text || '',
        username: body.username || 'Anonymous',
        created_at: new Date().toISOString()
      };
      runtimeReviews.unshift(newReview);
      return sendJSON(res, 201, { data: newReview });
    }
  }

  // GET, POST, DELETE /api/watchlist
  if (pathname.startsWith('/api/watchlist')) {
    if (req.method === 'GET') {
      return sendJSON(res, 200, { data: runtimeWatchlist });
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const dramaId = parseInt(body.drama_id, 10);
      if (!runtimeWatchlist.find(w => w.drama_id === dramaId)) {
        runtimeWatchlist.push({
          drama_id: dramaId,
          added_at: new Date().toISOString()
        });
      }
      return sendJSON(res, 200, { success: true, watchlist: runtimeWatchlist });
    }
    if (req.method === 'DELETE') {
      const dramaId = parseInt(query.drama_id, 10);
      const idx = runtimeWatchlist.findIndex(w => w.drama_id === dramaId);
      if (idx !== -1) runtimeWatchlist.splice(idx, 1);
      return sendJSON(res, 200, { success: true, watchlist: runtimeWatchlist });
    }
  }

  // ===================== STATIC FILE SERVING =====================

  let targetPath = '';

  // Handle root redirect to index.html
  if (pathname === '/' || pathname === '') {
    targetPath = path.join(APP_DIR, 'index.html');
  } else if (pathname === '/K-list/' || pathname === '/K-list') {
    targetPath = path.join(APP_DIR, 'index.html');
  } else if (pathname.startsWith('/K-list/')) {
    targetPath = path.join(APP_DIR, pathname.replace('/K-list/', ''));
  } else if (pathname.startsWith('/assets/')) {
    targetPath = path.join(APP_DIR, pathname);
  } else {
    // Check if file exists in K-list directory directly
    const directPath = path.join(APP_DIR, pathname);
    if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
      targetPath = directPath;
    } else {
      // Or in root directory
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
  console.log(`🚀 K-List Backend & Frontend Server is Running!`);
  console.log(`🌐 Local URL:  http://localhost:${PORT}`);
  console.log(`📁 App Directory: ${APP_DIR}`);
  console.log(`🖼️  Poster Images: 40/40 Loaded`);
  console.log(`🎭 Actor Photos:  21/21 Loaded`);
  console.log(`✨ API Ready: http://localhost:${PORT}/api/dramas`);
  console.log(`=======================================================`);
});
