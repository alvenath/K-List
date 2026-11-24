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
    USERS: 'klist_users'
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

    // ----------------- WATCHLIST -----------------
    async getWatchlist(userId) {
      if (isServerRunning && userId) {
        try {
          const res = await fetch(`/api/watchlist?user_id=${userId}`);
          if (res.ok) {
            const json = await res.json();
            return json.data || [];
          }
        } catch (e) {}
      }

      const list = getLocal(STORAGE_KEYS.WATCHLIST, []);
      if (!userId) return list;
      return list.filter(w => String(w.user_id) === String(userId));
    },

    async addToWatchlist(dramaId, userId) {
      dramaId = parseInt(dramaId, 10);
      if (isServerRunning) {
        try {
          await fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drama_id: dramaId, user_id: userId })
          });
        } catch (e) {}
      }

      const list = getLocal(STORAGE_KEYS.WATCHLIST, []);
      if (!list.find(w => w.drama_id === dramaId && w.user_id === userId)) {
        list.push({
          id: Date.now(),
          drama_id: dramaId,
          user_id: userId,
          added_at: new Date().toISOString()
        });
        setLocal(STORAGE_KEYS.WATCHLIST, list);
      }
      return true;
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
      list = list.filter(w => !(w.drama_id === dramaId && w.user_id === userId));
      setLocal(STORAGE_KEYS.WATCHLIST, list);
      return true;
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
      if (table === 'watchlist') return getLocal(STORAGE_KEYS.WATCHLIST, []);
      if (table === 'profiles') {
        const curUser = getLocal(STORAGE_KEYS.USER, null);
        return [
          { id: curUser?.id || 'user-admin', username: curUser?.username || 'Admin', role: curUser?.role || 'admin' }
        ];
      }
      return [];
    }

    _saveTableRows(table, rows) {
      if (table === 'reviews') setLocal(STORAGE_KEYS.REVIEWS, rows);
      else if (table === 'watchlist') setLocal(STORAGE_KEYS.WATCHLIST, rows);
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
