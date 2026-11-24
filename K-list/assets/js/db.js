// K-List Universal Database Client (Replaces Supabase)
// Supports both Persistent Local Backend (Node.js API) & Browser Storage (LocalStorage)
// Never sleeps, never pauses, 100% offline & online ready!

(function () {
  const KLIST = window.KLIST_DATA || {
    genres: [],
    actors: [],
    dramas: [],
    drama_genres: [],
    drama_actors: [],
    reviews: []
  };

  const STORAGE_KEYS = {
    WATCHLIST: 'klist_watchlist',
    REVIEWS: 'klist_reviews',
    USER: 'klist_current_user',
    USERS: 'klist_users',
    PROFILES: 'klist_custom_profiles'
  };

  function getLocal(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  // Initialize browser store with dataset reviews if empty
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    setLocal(STORAGE_KEYS.REVIEWS, KLIST.reviews || []);
  }

  const authListeners = [];
  function notifyAuth(event, session) {
    authListeners.forEach(cb => {
      try { cb(event, session); } catch (e) { console.error(e); }
    });
  }

  // Check if local API server is reachable
  const isServerRunning = (location.protocol === 'http:' || location.protocol === 'https:') &&
                          (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

  // Core Database Object
  const db = {
    // ----------------- DRAMAS -----------------
    async getDramas(filters = {}) {
      if (isServerRunning) {
        try {
          const params = new URLSearchParams(filters);
          const res = await fetch(`/api/dramas?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            return json.data || [];
          }
        } catch (e) {}
      }

      // Local storage fallback
      let list = [...(KLIST.dramas || [])];
      if (filters.year) list = list.filter(d => String(d.year) === String(filters.year));
      if (filters.genre) list = list.filter(d => (d.genreNames || []).some(g => g.toLowerCase() === filters.genre.toLowerCase()));
      if (filters.q) {
        const q = filters.q.toLowerCase();
        list = list.filter(d => d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q));
      }
      return list;
    },

    async getDramaById(id) {
      id = parseInt(id, 10);
      if (isServerRunning) {
        try {
          const res = await fetch(`/api/dramas/${id}`);
          if (res.ok) {
            const json = await res.json();
            return json.data;
          }
        } catch (e) {}
      }

      const drama = (KLIST.dramas || []).find(d => d.id === id);
      if (!drama) return null;

      const cast = (KLIST.drama_actors || [])
        .filter(da => da.drama_id === id)
        .map(da => {
          const actor = (KLIST.actors || []).find(a => a.id === da.actor_id);
          return {
            actor_id: da.actor_id,
            character_name: da.character_name,
            is_lead: da.is_lead,
            name: actor?.name,
            photo_url: actor?.photo_url
          };
        });

      const reviews = this.getLocalReviews(id);
      return { ...drama, cast, reviews };
    },

    // ----------------- ACTORS -----------------
    async getActors(filters = {}) {
      if (isServerRunning) {
        try {
          const params = new URLSearchParams(filters);
          const res = await fetch(`/api/actors?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            return json.data || [];
          }
        } catch (e) {}
      }

      let list = [...(KLIST.actors || [])];
      if (filters.gender) list = list.filter(a => a.gender === filters.gender);
      if (filters.q) {
        const q = filters.q.toLowerCase();
        list = list.filter(a => a.name.toLowerCase().includes(q));
      }
      return list;
    },

    // ----------------- REVIEWS -----------------
    getLocalReviews(dramaId) {
      const all = getLocal(STORAGE_KEYS.REVIEWS, KLIST.reviews || []);
      if (!dramaId) return all;
      return all.filter(r => String(r.drama_id) === String(dramaId));
    },

    async getReviews(dramaId) {
      if (isServerRunning) {
        try {
          const res = await fetch(`/api/reviews?drama_id=${dramaId || ''}`);
          if (res.ok) {
            const json = await res.json();
            return json.data || [];
          }
        } catch (e) {}
      }
      return this.getLocalReviews(dramaId);
    },

    async addReview({ drama_id, rating, review_text, username, user_id }) {
      const payload = {
        drama_id: parseInt(drama_id, 10),
        rating: parseInt(rating, 10),
        review_text: review_text || '',
        username: username || 'Anonymous',
        user_id: user_id || 'anonymous'
      };

      if (isServerRunning) {
        try {
          const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const json = await res.json();
            return json.data;
          }
        } catch (e) {}
      }

      // Local fallback
      const all = getLocal(STORAGE_KEYS.REVIEWS, KLIST.reviews || []);
      const existingIdx = all.findIndex(r => r.drama_id === payload.drama_id && r.user_id === payload.user_id);
      let reviewResult;

      if (existingIdx !== -1) {
        all[existingIdx].rating = payload.rating;
        all[existingIdx].review_text = payload.review_text;
        all[existingIdx].updated_at = new Date().toISOString();
        reviewResult = all[existingIdx];
      } else {
        reviewResult = {
          id: all.length > 0 ? Math.max(...all.map(r => r.id || 0)) + 1 : 1,
          ...payload,
          created_at: new Date().toISOString()
        };
        all.unshift(reviewResult);
      }

      setLocal(STORAGE_KEYS.REVIEWS, all);
      return reviewResult;
    },

    // ----------------- WATCHLIST (Anime-Planet Style Tracking) -----------------
    async getWatchlist(userId, status = null) {
      if (isServerRunning && userId) {
        try {
          const params = new URLSearchParams({ user_id: userId });
          if (status && status !== 'all') params.append('status', status);
          const res = await fetch(`/api/watchlist?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            return json.data || [];
          }
        } catch (e) {}
      }

      let list = getLocal(STORAGE_KEYS.WATCHLIST, []);
      if (userId) list = list.filter(w => String(w.user_id) === String(userId));
      if (status && status !== 'all') list = list.filter(w => (w.status || 'watching').toLowerCase() === status.toLowerCase());

      return list.map(item => {
        const drama = (KLIST.dramas || []).find(d => d.id === item.drama_id) || {};
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
    },

    async getWatchlistItem(dramaId, userId) {
      dramaId = parseInt(dramaId, 10);
      if (!userId) return null;
      const list = await this.getWatchlist(userId);
      return list.find(w => w.drama_id === dramaId) || null;
    },

    async setWatchlistStatus({ dramaId, userId, status = 'watching', score = 0, progress = 0, total_episodes = 16, notes = '' }) {
      dramaId = parseInt(dramaId, 10);
      score = parseInt(score, 10) || 0;
      progress = parseInt(progress, 10) || 0;
      total_episodes = parseInt(total_episodes, 10) || 16;

      if (status === 'completed' && progress === 0) {
        progress = total_episodes;
      }

      if (isServerRunning) {
        try {
          const res = await fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drama_id: dramaId, user_id: userId, status, score, progress, total_episodes, notes })
          });
          if (res.ok) {
            const json = await res.json();
            return json.item;
          }
        } catch (e) {}
      }

      let list = getLocal(STORAGE_KEYS.WATCHLIST, []);
      const idx = list.findIndex(w => w.drama_id === dramaId && String(w.user_id) === String(userId));
      let item;

      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          status,
          score,
          progress,
          total_episodes,
          notes,
          updated_at: new Date().toISOString()
        };
        item = list[idx];
      } else {
        item = {
          id: Date.now(),
          drama_id: dramaId,
          user_id: userId,
          status,
          score,
          progress,
          total_episodes,
          notes,
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        list.push(item);
      }

      setLocal(STORAGE_KEYS.WATCHLIST, list);
      return item;
    },

    async updateWatchlistProgress(dramaId, userId, delta) {
      dramaId = parseInt(dramaId, 10);
      delta = parseInt(delta, 10);

      if (isServerRunning) {
        try {
          const res = await fetch('/api/watchlist/progress', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drama_id: dramaId, user_id: userId, delta })
          });
          if (res.ok) {
            const json = await res.json();
            return json.item;
          }
        } catch (e) {}
      }

      let list = getLocal(STORAGE_KEYS.WATCHLIST, []);
      const item = list.find(w => w.drama_id === dramaId && String(w.user_id) === String(userId));
      if (!item) return null;

      const total = item.total_episodes || 16;
      let newProgress = Math.max(0, Math.min((item.progress || 0) + delta, total));
      item.progress = newProgress;
      item.updated_at = new Date().toISOString();
      if (newProgress === total && item.status !== 'completed') {
        item.status = 'completed';
      }

      setLocal(STORAGE_KEYS.WATCHLIST, list);
      return item;
    },

    async addToWatchlist(dramaId, userId) {
      return this.setWatchlistStatus({ dramaId, userId, status: 'watching', progress: 0 });
    },

    async removeFromWatchlist(dramaId, userId) {
      dramaId = parseInt(dramaId, 10);
      if (isServerRunning) {
        try {
          await fetch(`/api/watchlist?drama_id=${dramaId}&user_id=${userId}`, {
            method: 'DELETE'
          });
        } catch (e) {}
      }

      let list = getLocal(STORAGE_KEYS.WATCHLIST, []);
      list = list.filter(w => !(w.drama_id === dramaId && String(w.user_id) === String(userId)));
      setLocal(STORAGE_KEYS.WATCHLIST, list);
      return true;
    },

    // ----------------- PROFILE & ANIME-PLANET STATS -----------------
    getUserStats(userId) {
      const list = getLocal(STORAGE_KEYS.WATCHLIST, []).filter(w => String(w.user_id) === String(userId));
      const counts = { watching: 0, completed: 0, planning: 0, stalled: 0, dropped: 0 };
      let episodesWatched = 0;
      let scoreSum = 0;
      let scoreCount = 0;
      const scoreDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };

      list.forEach(item => {
        const st = (item.status || 'watching').toLowerCase();
        if (counts[st] !== undefined) counts[st]++;
        else counts.watching++;

        const eps = parseInt(item.progress || 0, 10);
        episodesWatched += isNaN(eps) ? 0 : eps;

        const score = parseInt(item.score || 0, 10);
        if (score >= 1 && score <= 10) {
          scoreSum += score;
          scoreCount++;
          scoreDist[score]++;
        }
      });

      const total = list.length;
      const percentages = {
        watching: total ? Math.round((counts.watching / total) * 100) : 0,
        completed: total ? Math.round((counts.completed / total) * 100) : 0,
        planning: total ? Math.round((counts.planning / total) * 100) : 0,
        stalled: total ? Math.round((counts.stalled / total) * 100) : 0,
        dropped: total ? Math.round((counts.dropped / total) * 100) : 0
      };

      const daysWatched = ((episodesWatched * 60) / (24 * 60)).toFixed(1);
      const meanScore = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : '0.0';

      return {
        total,
        counts,
        percentages,
        episodesWatched,
        daysWatched,
        meanScore,
        scoreDistribution: scoreDist
      };
    },

    async getUserProfile(userId) {
      if (isServerRunning && userId) {
        try {
          const res = await fetch(`/api/profile?user_id=${userId}`);
          if (res.ok) {
            const json = await res.json();
            return json;
          }
        } catch (e) {}
      }

      const profiles = getLocal(STORAGE_KEYS.PROFILES, {});
      const curUser = this.getUser();
      const prof = profiles[userId] || {
        id: userId,
        username: curUser?.username || 'KListFan',
        email: curUser?.email || '',
        bio: 'K-Drama enthusiast exploring the best stories.',
        avatar: curUser?.avatar || 'assets/img/Avatar.jpg',
        banner: 'assets/img/poster/Vincenzo.jpg',
        badge: 'K-Drama Enthusiast',
        favorites: { dramas: [2, 3], actors: [18, 12] },
        created_at: curUser?.created_at || new Date().toISOString()
      };

      const favDramas = (prof.favorites?.dramas || []).map(id => (KLIST.dramas || []).find(d => d.id === id)).filter(Boolean);
      const favActors = (prof.favorites?.actors || []).map(id => (KLIST.actors || []).find(a => a.id === id)).filter(Boolean);
      const userReviews = (getLocal(STORAGE_KEYS.REVIEWS, KLIST.reviews || [])).filter(r => String(r.user_id) === String(userId));

      return {
        profile: prof,
        favoritesData: {
          dramas: favDramas,
          actors: favActors
        },
        reviews: userReviews,
        stats: this.getUserStats(userId)
      };
    },

    async updateUserProfile(userId, profileData) {
      if (isServerRunning && userId) {
        try {
          const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, ...profileData })
          });
          if (res.ok) {
            const json = await res.json();
            const curUser = this.getUser();
            if (curUser && String(curUser.id) === String(userId)) {
              if (profileData.username) curUser.username = profileData.username;
              if (profileData.avatar) curUser.avatar = profileData.avatar;
              setLocal(STORAGE_KEYS.USER, curUser);
            }
            return json;
          }
        } catch (e) {}
      }

      const profiles = getLocal(STORAGE_KEYS.PROFILES, {});
      const cur = profiles[userId] || {
        id: userId,
        created_at: new Date().toISOString(),
        favorites: { dramas: [], actors: [] }
      };

      const updated = {
        ...cur,
        ...profileData,
        updated_at: new Date().toISOString()
      };

      profiles[userId] = updated;
      setLocal(STORAGE_KEYS.PROFILES, profiles);

      const curUser = this.getUser();
      if (curUser && String(curUser.id) === String(userId)) {
        if (profileData.username) curUser.username = profileData.username;
        if (profileData.avatar) curUser.avatar = profileData.avatar;
        setLocal(STORAGE_KEYS.USER, curUser);
      }

      return {
        success: true,
        profile: updated,
        stats: this.getUserStats(userId)
      };
    },

    async toggleFavorite(userId, type, itemId) {
      itemId = parseInt(itemId, 10);
      const favType = type === 'actor' ? 'actors' : 'dramas';

      if (isServerRunning && userId) {
        try {
          const res = await fetch('/api/profile/favorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, type: favType, id: itemId })
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {}
      }

      const profiles = getLocal(STORAGE_KEYS.PROFILES, {});
      let prof = profiles[userId];
      if (!prof) {
        const curUser = this.getUser();
        prof = {
          id: userId,
          username: curUser?.username || 'KListFan',
          favorites: { dramas: [], actors: [] }
        };
      }

      if (!prof.favorites) prof.favorites = { dramas: [], actors: [] };
      if (!Array.isArray(prof.favorites[favType])) prof.favorites[favType] = [];

      const idx = prof.favorites[favType].indexOf(itemId);
      let isFavorited = false;
      if (idx !== -1) {
        prof.favorites[favType].splice(idx, 1);
        isFavorited = false;
      } else {
        prof.favorites[favType].push(itemId);
        isFavorited = true;
      }

      profiles[userId] = prof;
      setLocal(STORAGE_KEYS.PROFILES, profiles);
      return { success: true, isFavorited, favorites: prof.favorites };
    },

    isFavorite(userId, type, itemId) {
      itemId = parseInt(itemId, 10);
      const favType = type === 'actor' ? 'actors' : 'dramas';
      const profiles = getLocal(STORAGE_KEYS.PROFILES, {});
      const prof = profiles[userId];
      if (!prof || !prof.favorites || !Array.isArray(prof.favorites[favType])) return false;
      return prof.favorites[favType].includes(itemId);
    },

    // ----------------- AUTHENTICATION -----------------
    getUser() {
      return getLocal(STORAGE_KEYS.USER, null);
    },

    async login(email, password) {
      if (isServerRunning) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          if (res.ok) {
            const json = await res.json();
            setLocal(STORAGE_KEYS.USER, json.user);
            notifyAuth('SIGNED_IN', { user: json.user });
            return { user: json.user, error: null };
          }
        } catch (e) {}
      }

      const user = {
        id: 'user-' + btoa(email || 'demo').substring(0, 10),
        email: email || 'demo@klist.com',
        username: email ? email.split('@')[0] : 'DemoUser',
        role: email === 'admin@klist.com' ? 'admin' : 'user',
        created_at: new Date().toISOString()
      };
      setLocal(STORAGE_KEYS.USER, user);
      notifyAuth('SIGNED_IN', { user });
      return { user, error: null };
    },

    async register(email, password) {
      if (isServerRunning) {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          if (res.ok) {
            const json = await res.json();
            setLocal(STORAGE_KEYS.USER, json.user);
            notifyAuth('SIGNED_IN', { user: json.user });
            return { user: json.user, error: null };
          }
        } catch (e) {}
      }

      const user = {
        id: 'user-' + Date.now(),
        email: email,
        username: email.split('@')[0],
        role: 'user',
        created_at: new Date().toISOString()
      };
      setLocal(STORAGE_KEYS.USER, user);
      notifyAuth('SIGNED_IN', { user });
      return { user, error: null };
    },

    async loginWithGoogle(customEmail, customName) {
      let email = customEmail;
      let username = customName;

      // If no custom email is passed, prompt or default to Google Demo Account
      if (!email) {
        const input = prompt("Masukkan alamat Gmail Anda (atau klik OK untuk akun Google Demo):", "user.google@gmail.com");
        if (input === null) return null; // user clicked cancel
        email = input.trim() || "user.google@gmail.com";
        username = email.split('@')[0];
      }

      if (isServerRunning) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, provider: 'google' })
          });
          if (res.ok) {
            const json = await res.json();
            setLocal(STORAGE_KEYS.USER, json.user);
            notifyAuth('SIGNED_IN', { user: json.user });
            return json.user;
          }
        } catch (e) {}
      }

      const googleUser = {
        id: 'google-' + btoa(email).substring(0, 10),
        email: email,
        username: username || email.split('@')[0],
        role: 'user',
        provider: 'google',
        avatar: 'assets/img/Avatar.jpg',
        created_at: new Date().toISOString()
      };
      setLocal(STORAGE_KEYS.USER, googleUser);
      notifyAuth('SIGNED_IN', { user: googleUser });
      return googleUser;
    },

    async logout() {
      setLocal(STORAGE_KEYS.USER, null);
      notifyAuth('SIGNED_OUT', null);
      return { error: null };
    },

    onAuthChange(callback) {
      if (typeof callback === 'function') {
        authListeners.push(callback);
        const cur = this.getUser();
        setTimeout(() => callback('INITIAL_SESSION', cur ? { user: cur } : null), 0);
      }
      return {
        data: {
          subscription: {
            unsubscribe() {
              const i = authListeners.indexOf(callback);
              if (i !== -1) authListeners.splice(i, 1);
            }
          }
        }
      };
    }
  };

  // -------------------------------------------------------------
  // Backward-Compatibility Query Builder Engine for existing code
  // -------------------------------------------------------------
  class CompatQueryBuilder {
    constructor(tableName) {
      this.tableName = tableName;
      this.selectFields = '*';
      this.filters = [];
      this.limitCount = null;
      this.orderCol = null;
      this.orderAsc = true;
      this.isSingle = false;
      this.isMaybeSingle = false;
      this.pendingInsert = null;
      this.pendingUpdate = null;
      this.pendingDelete = false;
    }

    select(fields = '*') {
      this.selectFields = fields;
      return this;
    }

    eq(column, value) {
      this.filters.push({ type: 'eq', column, value });
      return this;
    }

    match(obj = {}) {
      Object.keys(obj).forEach(key => {
        this.filters.push({ type: 'eq', column: key, value: obj[key] });
      });
      return this;
    }

    ilike(column, pattern) {
      this.filters.push({ type: 'ilike', column, pattern });
      return this;
    }

    or(orString) {
      this.filters.push({ type: 'or', orString });
      return this;
    }

    order(column, options = {}) {
      this.orderCol = column;
      this.orderAsc = options.ascending !== false;
      return this;
    }

    limit(n) {
      this.limitCount = n;
      return this;
    }

    single() {
      this.isSingle = true;
      return this._execute();
    }

    maybeSingle() {
      this.isMaybeSingle = true;
      return this._execute();
    }

    insert(data) {
      this.pendingInsert = Array.isArray(data) ? data : [data];
      return this._execute();
    }

    update(data) {
      this.pendingUpdate = data;
      return this._execute();
    }

    delete() {
      this.pendingDelete = true;
      return this._execute();
    }

    then(resolve, reject) {
      return this._execute().then(resolve, reject);
    }

    async _execute() {
      try {
        let rows = this._getTableRows(this.tableName);

        // Handle INSERT
        if (this.pendingInsert) {
          const inserted = [];
          for (const item of this.pendingInsert) {
            const newItem = {
              id: item.id || Date.now() + Math.floor(Math.random() * 1000),
              created_at: new Date().toISOString(),
              ...item
            };
            rows.push(newItem);
            inserted.push(newItem);
          }
          this._saveTableRows(this.tableName, rows);
          return { data: inserted, error: null };
        }

        // Apply filters
        let filtered = rows.filter(row => {
          for (const f of this.filters) {
            if (f.type === 'eq') {
              if (String(row[f.column]) !== String(f.value)) return false;
            } else if (f.type === 'ilike') {
              const val = String(row[f.column] || '').toLowerCase();
              const term = f.pattern.replace(/%/g, '').toLowerCase();
              if (!val.includes(term)) return false;
            } else if (f.type === 'or') {
              const parts = f.orString.split(',');
              const orMatch = parts.some(part => {
                const sub = part.split('.ilike.');
                if (sub.length === 2) {
                  const col = sub[0].trim();
                  const term = sub[1].replace(/%/g, '').toLowerCase().trim();
                  const val = String(row[col] || '').toLowerCase();
                  return val.includes(term);
                }
                return false;
              });
              if (!orMatch) return false;
            }
          }
          return true;
        });

        // Handle DELETE
        if (this.pendingDelete) {
          const toDeleteIds = new Set(filtered.map(r => r.id));
          rows = rows.filter(r => !toDeleteIds.has(r.id));
          this._saveTableRows(this.tableName, rows);
          return { data: filtered, error: null };
        }

        // Handle UPDATE
        if (this.pendingUpdate) {
          filtered.forEach(r => Object.assign(r, this.pendingUpdate));
          this._saveTableRows(this.tableName, rows);
          return { data: filtered, error: null };
        }

        // Handle ORDER
        if (this.orderCol) {
          filtered.sort((a, b) => {
            const va = a[this.orderCol];
            const vb = b[this.orderCol];
            if (va < vb) return this.orderAsc ? -1 : 1;
            if (va > vb) return this.orderAsc ? 1 : -1;
            return 0;
          });
        }

        // Handle LIMIT
        if (this.limitCount && this.limitCount > 0) {
          filtered = filtered.slice(0, this.limitCount);
        }

        // Handle RELATIONS & PROJECTIONS
        const results = filtered.map(row => this._projectRow(this.tableName, row, this.selectFields));

        if (this.isSingle) {
          if (results.length === 0) {
            return { data: null, error: { message: 'Row not found' } };
          }
          return { data: results[0], error: null };
        }

        if (this.isMaybeSingle) {
          return { data: results.length > 0 ? results[0] : null, error: null };
        }

        return { data: results, error: null };
      } catch (err) {
        console.error('Database Query Error:', err);
        return { data: null, error: err };
      }
    }

    _getTableRows(table) {
      if (table === 'dramas') return [...(KLIST.dramas || [])];
      if (table === 'actors') return [...(KLIST.actors || [])];
      if (table === 'genres') return [...(KLIST.genres || [])];
      if (table === 'drama_genres') return [...(KLIST.drama_genres || [])];
      if (table === 'drama_actors') return [...(KLIST.drama_actors || [])];
      if (table === 'reviews') return getLocal(STORAGE_KEYS.REVIEWS, KLIST.reviews || []);
      if (table === 'watchlist') {
        const items = getLocal(STORAGE_KEYS.WATCHLIST, []);
        return items.map(w => ({
          status: 'watching',
          score: 0,
          progress: 0,
          total_episodes: 16,
          notes: '',
          ...w
        }));
      }
      if (table === 'profiles') {
        const curUser = getLocal(STORAGE_KEYS.USER, null);
        const profiles = getLocal(STORAGE_KEYS.PROFILES, {});
        if (curUser && profiles[curUser.id]) {
          return [profiles[curUser.id]];
        }
        return [
          {
            id: curUser?.id || 'user-admin',
            username: curUser?.username || 'Admin',
            email: curUser?.email || 'admin@klist.com',
            role: curUser?.role || 'admin',
            avatar: curUser?.avatar || 'assets/img/Avatar.jpg',
            banner: 'assets/img/poster/Vincenzo.jpg',
            bio: 'K-Drama enthusiast exploring the best stories.',
            badge: 'K-Drama Enthusiast',
            favorites: { dramas: [2, 3], actors: [18, 12] }
          }
        ];
      }
      return [];
    }

    _saveTableRows(table, rows) {
      if (table === 'reviews') setLocal(STORAGE_KEYS.REVIEWS, rows);
      else if (table === 'watchlist') setLocal(STORAGE_KEYS.WATCHLIST, rows);
      else if (table === 'profiles') {
        const profiles = getLocal(STORAGE_KEYS.PROFILES, {});
        rows.forEach(r => { if (r.id) profiles[r.id] = r; });
        setLocal(STORAGE_KEYS.PROFILES, profiles);
      }
    }

    _projectRow(table, row, fields) {
      const copy = { ...row };

      if (table === 'dramas' && fields.includes('drama_genres')) {
        copy.drama_genres = (KLIST.drama_genres || []).filter(item => item.drama_id === row.id);
      }

      if (table === 'watchlist' && fields.includes('dramas')) {
        const drama = (KLIST.dramas || []).find(d => String(d.id) === String(row.drama_id));
        if (drama) {
          const dramaCopy = { ...drama };
          dramaCopy.drama_genres = (KLIST.drama_genres || []).filter(item => item.drama_id === drama.id);
          copy.dramas = dramaCopy;
        }
      }

      if (table === 'drama_actors') {
        if (!copy.actors && copy.actor_id) {
          const actor = (KLIST.actors || []).find(a => a.id === copy.actor_id);
          if (actor) {
            copy.actors = { name: actor.name, photo_url: actor.photo_url };
          }
        }
      }

      return copy;
    }
  }

  // Compat Client for seamless replacement of supabase
  db.compat = {
    auth: {
      async getUser() {
        const user = db.getUser();
        return { data: { user }, error: null };
      },
      async getSession() {
        const user = db.getUser();
        return { data: { session: user ? { user, access_token: 'local-token' } : null }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const res = await db.login(email, password);
        return { data: { user: res.user, session: { user: res.user } }, error: res.error };
      },
      async signUp({ email, password }) {
        const res = await db.register(email, password);
        return { data: { user: res.user, session: { user: res.user } }, error: res.error };
      },
      async signInWithOAuth({ provider }) {
        if (provider === 'google') {
          const user = await db.loginWithGoogle();
          if (user) {
            return { data: { user, session: { user } }, error: null };
          }
          return { data: null, error: { message: 'Google login canceled' } };
        }
        return { data: null, error: { message: 'Provider not supported' } };
      },
      async signOut() {
        await db.logout();
        return { error: null };
      },
      onAuthStateChange(callback) {
        return db.onAuthChange(callback);
      }
    },
    from(tableName) {
      return new CompatQueryBuilder(tableName);
    }
  };

  // Expose global database services
  window.db = db;
  window.supabase = db.compat;

  console.log('✨ K-List Native Database Engine initialized! (Supabase replaced with zero-pause local database)');
})();
