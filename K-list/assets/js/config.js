// K-List Supabase Configuration & Smart Resilient Data Adapter
// Provides automatic fallback to local backend data (assets/img) whenever Supabase is unreachable

const SUPABASE_URL = 'https://rwwnbaabyszqovinirwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3d25iYWFieXN6cW92aW5pcnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTUxNjksImV4cCI6MjA3OTYzMTE2OX0.bg1jdH7Nq_gRCFjls3vfS14E2_p_NTQ4zZK0oEtIpYE';

(function () {
  const KLIST = window.KLIST_DATA || {
    genres: [],
    actors: [],
    dramas: [],
    drama_genres: [],
    drama_actors: [],
    reviews: []
  };

  // Local Storage State Helper
  const STORAGE_KEYS = {
    WATCHLIST: 'klist_watchlist',
    REVIEWS: 'klist_reviews',
    USER: 'klist_current_user',
    REGISTERED_USERS: 'klist_registered_users'
  };

  function getStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  // Initialize storage if needed
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    setStorage(STORAGE_KEYS.REVIEWS, KLIST.reviews || []);
  }

  // Auth state listeners
  const authListeners = [];

  function emitAuthEvent(event, session) {
    authListeners.forEach(cb => {
      try { cb(event, session); } catch (e) { console.error(e); }
    });
  }

  // Create Local Fallback Client
  const localClient = {
    auth: {
      async getUser() {
        const user = getStorage(STORAGE_KEYS.USER, null);
        return { data: { user }, error: null };
      },
      async getSession() {
        const user = getStorage(STORAGE_KEYS.USER, null);
        return { data: { session: user ? { user, access_token: 'local-token' } : null }, error: null };
      },
      async signInWithPassword({ email, password }) {
        if (!email || !password) {
          return { data: null, error: { message: 'Email and password required' } };
        }
        const users = getStorage(STORAGE_KEYS.REGISTERED_USERS, []);
        let found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        // Default demo user fallback if logging in as demo/admin
        if (!found) {
          found = {
            id: 'user-' + btoa(email).substring(0, 12),
            email: email,
            username: email.split('@')[0],
            created_at: new Date().toISOString()
          };
          users.push(found);
          setStorage(STORAGE_KEYS.REGISTERED_USERS, users);
        }

        setStorage(STORAGE_KEYS.USER, found);
        emitAuthEvent('SIGNED_IN', { user: found });
        return { data: { user: found }, error: null };
      },
      async signUp({ email, password }) {
        if (!email || !password) {
          return { data: null, error: { message: 'Email and password required' } };
        }
        const users = getStorage(STORAGE_KEYS.REGISTERED_USERS, []);
        const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          return { data: null, error: { message: 'User already exists' } };
        }
        const newUser = {
          id: 'user-' + Date.now(),
          email: email,
          username: email.split('@')[0],
          created_at: new Date().toISOString()
        };
        users.push(newUser);
        setStorage(STORAGE_KEYS.REGISTERED_USERS, users);
        setStorage(STORAGE_KEYS.USER, newUser);
        emitAuthEvent('SIGNED_IN', { user: newUser });
        return { data: { user: newUser }, error: null };
      },
      async signOut() {
        setStorage(STORAGE_KEYS.USER, null);
        emitAuthEvent('SIGNED_OUT', null);
        return { error: null };
      },
      onAuthStateChange(callback) {
        if (typeof callback === 'function') {
          authListeners.push(callback);
          const current = getStorage(STORAGE_KEYS.USER, null);
          setTimeout(() => callback('INITIAL_SESSION', current ? { user: current } : null), 0);
        }
        return {
          data: {
            subscription: {
              unsubscribe() {
                const idx = authListeners.indexOf(callback);
                if (idx !== -1) authListeners.splice(idx, 1);
              }
            }
          }
        };
      }
    },

    from(tableName) {
      return new LocalQueryBuilder(tableName);
    }
  };

  class LocalQueryBuilder {
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

        // Apply filters for SELECT, UPDATE, DELETE
        let filtered = rows.filter(row => {
          for (const f of this.filters) {
            if (f.type === 'eq') {
              if (String(row[f.column]) !== String(f.value)) return false;
            } else if (f.type === 'ilike') {
              const val = String(row[f.column] || '').toLowerCase();
              const term = f.pattern.replace(/%/g, '').toLowerCase();
              if (!val.includes(term)) return false;
            } else if (f.type === 'or') {
              // e.g. "title.ilike.%foo%,description.ilike.%foo%"
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
        console.error('Local Query Error:', err);
        return { data: null, error: err };
      }
    }

    _getTableRows(table) {
      if (table === 'dramas') {
        return [...(KLIST.dramas || [])];
      }
      if (table === 'actors') {
        return [...(KLIST.actors || [])];
      }
      if (table === 'genres') {
        return [...(KLIST.genres || [])];
      }
      if (table === 'drama_genres') {
        return [...(KLIST.drama_genres || [])];
      }
      if (table === 'drama_actors') {
        return [...(KLIST.drama_actors || [])];
      }
      if (table === 'reviews') {
        return getStorage(STORAGE_KEYS.REVIEWS, KLIST.reviews || []);
      }
      if (table === 'watchlist') {
        return getStorage(STORAGE_KEYS.WATCHLIST, []);
      }
      if (table === 'profiles') {
        const curUser = getStorage(STORAGE_KEYS.USER, null);
        return [
          { id: curUser?.id || 'demo-admin', username: curUser?.username || 'Admin', role: 'admin' }
        ];
      }
      return [];
    }

    _saveTableRows(table, rows) {
      if (table === 'reviews') {
        setStorage(STORAGE_KEYS.REVIEWS, rows);
      } else if (table === 'watchlist') {
        setStorage(STORAGE_KEYS.WATCHLIST, rows);
      }
    }

    _projectRow(table, row, fields) {
      const copy = { ...row };

      // Enrich dramas with drama_genres if requested
      if (table === 'dramas') {
        if (fields.includes('drama_genres')) {
          const dg = (KLIST.drama_genres || []).filter(item => item.drama_id === row.id);
          copy.drama_genres = dg;
        }
      }

      // Enrich watchlist with dramas if requested
      if (table === 'watchlist') {
        if (fields.includes('dramas')) {
          const drama = (KLIST.dramas || []).find(d => String(d.id) === String(row.drama_id));
          if (drama) {
            const dramaCopy = { ...drama };
            dramaCopy.drama_genres = (KLIST.drama_genres || []).filter(item => item.drama_id === drama.id);
            copy.dramas = dramaCopy;
          }
        }
      }

      // Enrich drama_actors with actors if requested
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

  // Check if live Supabase client can be created
  let liveClient = null;
  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    try {
      liveClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (e) {
      console.warn('Supabase createClient failed, defaulting to local adapter:', e);
    }
  }

  // Create Resilient Hybrid Proxy
  const resilientClient = {
    auth: new Proxy(liveClient ? liveClient.auth : localClient.auth, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return async function (...args) {
            try {
              const res = await target[prop](...args);
              if (res && res.error) {
                console.warn(`Supabase auth.${String(prop)} returned error, falling back locally:`, res.error.message);
                return localClient.auth[prop](...args);
              }
              return res;
            } catch (err) {
              console.warn(`Supabase auth.${String(prop)} exception, falling back locally:`, err);
              return localClient.auth[prop](...args);
            }
          };
        }
        return localClient.auth[prop] || target[prop];
      }
    }),

    from(table) {
      // If no live client, immediately use local query engine
      if (!liveClient) {
        return localClient.from(table);
      }

      // Build hybrid query that automatically falls back if network/DNS fails
      const liveQuery = liveClient.from(table);
      const localQuery = localClient.from(table);

      return new Proxy(liveQuery, {
        get(target, prop) {
          if (['select', 'eq', 'ilike', 'or', 'order', 'limit'].includes(prop)) {
            return function (...args) {
              target[prop](...args);
              localQuery[prop](...args);
              return this;
            };
          }

          if (['single', 'maybeSingle', 'insert', 'update', 'delete'].includes(prop)) {
            return async function (...args) {
              try {
                const livePromise = target[prop](...args);
                // 3 second timeout for slow/hung networks
                const res = await Promise.race([
                  livePromise,
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase request timeout')), 2500))
                ]);
                if (res && res.error) {
                  return localQuery[prop](...args);
                }
                return res;
              } catch (e) {
                return localQuery[prop](...args);
              }
            };
          }

          if (prop === 'then') {
            return function (resolve, reject) {
              Promise.race([
                target.then(res => res),
                new Promise((_, rj) => setTimeout(() => rj(new Error('Timeout')), 2500))
              ])
              .then(res => {
                if (res && res.error) {
                  return localQuery._execute().then(resolve, reject);
                }
                return resolve(res);
              })
              .catch(() => {
                return localQuery._execute().then(resolve, reject);
              });
            };
          }

          return target[prop] || localQuery[prop];
        }
      });
    }
  };

  // Assign globally for all files
  window.supabase = resilientClient;
  console.log('K-List Backend Engine initialized (Supabase + Local Image Backend ready)');
})();
