/**
 * Storage Service
 * Handles persistence in localStorage, data integrity, import & export,
 * and live multi-device real-time cloud synchronization.
 */

const STORAGE_KEY = 'lumina_library_data_v1';
const BACKUP_MEMBERS_KEY = 'lumina_custom_registered_members_v1';
const BACKUP_USERS_KEY = 'lumina_custom_registered_users_v1';
const BACKUP_BOOKS_KEY = 'lumina_custom_registered_books_v1';
const BACKUP_LOANS_KEY = 'lumina_custom_registered_loans_v1';
const CLOUD_DB_KEY = 'lumina_cloud_db_url_v1';

class StorageService {
  constructor() {
    this.cloudDbUrl = null;
    this.isCloudConnected = false;
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.eventSource = null;
    this._pendingCloudData = null;
    this._pushDebounceTimer = null;

    this.checkCloudUrlFromQuery();
    this.init();
    this.initCloudSync();
  }

  // Detect and auto-configure cloud URL from URL query parameter e.g. ?cloud=https://...
  checkCloudUrlFromQuery() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const cloudParam = params.get('cloud');
        if (cloudParam) {
          let clean = cloudParam.trim().replace(/\/+$/, '');
          if (clean.endsWith('.json')) clean = clean.slice(0, -5);
          if (clean.endsWith('/lumina_data')) clean = clean.slice(0, -12);
          if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
            clean = 'https://' + clean;
          }
          localStorage.setItem(CLOUD_DB_KEY, clean);

          // Clean URL parameter from address bar without reloading
          const cleanSearch = new URLSearchParams(window.location.search);
          cleanSearch.delete('cloud');
          const newUrl = window.location.pathname + (cleanSearch.toString() ? '?' + cleanSearch.toString() : '') + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    } catch (e) {
      console.warn("Could not parse cloud query param:", e);
    }
  }

  async initCloudSync() {
    try {
      const saved = localStorage.getItem(CLOUD_DB_KEY);
      if (saved && saved.startsWith('http')) {
        this.cloudDbUrl = saved.trim().replace(/\/+$/, '');
        this.updateSyncUI();
        await this.pullFromCloud();
        this.startRealtimeListener();
      }
    } catch (e) {
      console.warn("Cloud sync initialization failed:", e);
    }
    this.updateSyncUI();
  }

  // Normalize Firebase arrays/objects: Firebase turns arrays with deleted or sparse keys into objects { "0": ... }
  // and drops empty arrays ([]). This guarantees valid JavaScript arrays with zero null holes.
  normalizeArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.filter(item => item !== null && item !== undefined);
    }
    if (typeof val === 'object') {
      return Object.values(val).filter(item => item !== null && item !== undefined);
    }
    return [];
  }

  // Normalizes an entire library dataset ensuring all tables are valid non-null arrays
  normalizeDataset(data) {
    if (!data || typeof data !== 'object') {
      data = JSON.parse(JSON.stringify(SEED_DATA));
    }
    data.books = this.normalizeArray(data.books);
    data.members = this.normalizeArray(data.members);
    data.loans = this.normalizeArray(data.loans);
    data.users = this.normalizeArray(data.users);
    data.reservations = this.normalizeArray(data.reservations);
    data.activityLog = this.normalizeArray(data.activityLog);
    data.categories = this.normalizeArray(data.categories || SEED_DATA.categories);
    data.settings = data.settings || SEED_DATA.settings;
    return data;
  }

  // Two-way non-destructive Smart Merge: combines local and cloud records by unique ID so data is NEVER wiped
  mergeDatasets(local, incoming) {
    if (!local) local = this.getData();
    if (!incoming) return local;

    local = this.normalizeDataset(local);
    incoming = this.normalizeDataset(incoming);

    const merged = { ...local };

    // 1. Merge Books by ID (seed books + local books + cloud books + backup books)
    const bookMap = new Map();
    SEED_DATA.books.forEach(b => bookMap.set(b.id.toLowerCase(), { ...b }));
    local.books.forEach(b => {
      if (b && b.id) bookMap.set(b.id.toLowerCase(), { ...b });
    });
    incoming.books.forEach(b => {
      if (b && b.id) {
        const key = b.id.toLowerCase();
        if (bookMap.has(key)) {
          bookMap.set(key, { ...bookMap.get(key), ...b });
        } else {
          bookMap.set(key, { ...b });
        }
      }
    });
    try {
      const backupBooksRaw = localStorage.getItem(BACKUP_BOOKS_KEY);
      if (backupBooksRaw) {
        const backupBooks = JSON.parse(backupBooksRaw);
        backupBooks.forEach(bb => {
          if (bb && bb.id && !bookMap.has(bb.id.toLowerCase())) {
            bookMap.set(bb.id.toLowerCase(), bb);
          }
        });
      }
    } catch (e) {}
    merged.books = Array.from(bookMap.values());

    // 2. Merge Members by ID (seed members + local members + cloud members + backup members)
    const memberMap = new Map();
    SEED_DATA.members.forEach(m => memberMap.set(m.id.toLowerCase(), { ...m }));
    local.members.forEach(m => {
      if (m && m.id) memberMap.set(m.id.toLowerCase(), { ...m });
    });
    incoming.members.forEach(m => {
      if (m && m.id) {
        const key = m.id.toLowerCase();
        if (memberMap.has(key)) {
          memberMap.set(key, { ...memberMap.get(key), ...m });
        } else {
          memberMap.set(key, { ...m });
        }
      }
    });
    try {
      const backupMembersRaw = localStorage.getItem(BACKUP_MEMBERS_KEY);
      if (backupMembersRaw) {
        const backupMembers = JSON.parse(backupMembersRaw);
        backupMembers.forEach(bm => {
          if (bm && bm.id && !memberMap.has(bm.id.toLowerCase())) {
            memberMap.set(bm.id.toLowerCase(), bm);
          }
        });
      }
    } catch (e) {}
    merged.members = Array.from(memberMap.values());

    // 3. Merge Users by Username & ID
    const userMap = new Map();
    SEED_DATA.users.forEach(u => userMap.set(u.username.toLowerCase(), { ...u }));
    local.users.forEach(u => {
      if (u && u.username) userMap.set(u.username.toLowerCase(), { ...u });
    });
    incoming.users.forEach(u => {
      if (u && u.username) {
        const key = u.username.toLowerCase();
        if (userMap.has(key)) {
          userMap.set(key, { ...userMap.get(key), ...u });
        } else {
          userMap.set(key, { ...u });
        }
      }
    });
    try {
      const backupUsersRaw = localStorage.getItem(BACKUP_USERS_KEY);
      if (backupUsersRaw) {
        const backupUsers = JSON.parse(backupUsersRaw);
        backupUsers.forEach(bu => {
          if (bu && bu.username && !userMap.has(bu.username.toLowerCase())) {
            userMap.set(bu.username.toLowerCase(), bu);
          }
        });
      }
    } catch (e) {}
    merged.users = Array.from(userMap.values());

    // 4. Merge Loans by ID
    const loanMap = new Map();
    local.loans.forEach(l => {
      if (l && l.id) loanMap.set(l.id, { ...l });
    });
    incoming.loans.forEach(l => {
      if (l && l.id) {
        if (loanMap.has(l.id)) {
          const existing = loanMap.get(l.id);
          if (existing.status === 'Returned' || l.status === 'Returned') {
            loanMap.set(l.id, { ...existing, ...l, status: 'Returned' });
          } else {
            loanMap.set(l.id, { ...existing, ...l });
          }
        } else {
          loanMap.set(l.id, { ...l });
        }
      }
    });
    try {
      const backupLoansRaw = localStorage.getItem(BACKUP_LOANS_KEY);
      if (backupLoansRaw) {
        const backupLoans = JSON.parse(backupLoansRaw);
        backupLoans.forEach(bl => {
          if (bl && bl.id && !loanMap.has(bl.id)) {
            loanMap.set(bl.id, bl);
          }
        });
      }
    } catch (e) {}
    merged.loans = Array.from(loanMap.values());

    // 5. Merge Reservations by ID
    const resMap = new Map();
    local.reservations.forEach(r => {
      if (r && r.id) resMap.set(r.id, { ...r });
    });
    incoming.reservations.forEach(r => {
      if (r && r.id) resMap.set(r.id, { ...r });
    });
    merged.reservations = Array.from(resMap.values());

    // 6. Settings & Categories
    merged.settings = { ...SEED_DATA.settings, ...(local.settings || {}), ...(incoming.settings || {}) };
    if (!merged.settings.currencySymbol || merged.settings.currencySymbol === '$') {
      merged.settings.currencySymbol = '₹';
    }
    if (merged.settings.dailyFineRate === 0.5 || !merged.settings.dailyFineRate) {
      merged.settings.dailyFineRate = 5.00;
    }
    const catSet = new Set([...SEED_DATA.categories, ...(local.categories || []), ...(incoming.categories || [])]);
    merged.categories = Array.from(catSet);

    // 7. Activity Log
    const actMap = new Map();
    [...(incoming.activityLog || []), ...(local.activityLog || [])].forEach(a => {
      if (a && a.id) actMap.set(a.id, a);
    });
    merged.activityLog = Array.from(actMap.values()).slice(0, 50);

    return merged;
  }

  init() {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      let parsed;
      if (!existing) {
        parsed = JSON.parse(JSON.stringify(SEED_DATA));
      } else {
        try {
          parsed = JSON.parse(existing);
        } catch (e) {
          parsed = JSON.parse(JSON.stringify(SEED_DATA));
        }
      }

      parsed = this.normalizeDataset(parsed);

      // 1. Ensure all default seed books exist without wiping custom ones
      SEED_DATA.books.forEach(sb => {
        if (!parsed.books.some(b => b.id && b.id.toLowerCase() === sb.id.toLowerCase())) {
          parsed.books.push(JSON.parse(JSON.stringify(sb)));
        }
      });

      // 2. Ensure all default seed members exist without wiping custom ones
      SEED_DATA.members.forEach(sm => {
        if (!parsed.members.some(m => m.id && m.id.toLowerCase() === sm.id.toLowerCase())) {
          parsed.members.push(JSON.parse(JSON.stringify(sm)));
        }
      });

      // 3. Ensure all default seed users exist (admin, staff, student1..5)
      SEED_DATA.users.forEach(su => {
        if (!parsed.users.some(u => u.username && u.username.toLowerCase() === su.username.toLowerCase())) {
          parsed.users.push(JSON.parse(JSON.stringify(su)));
        }
      });

      // 4. Restore custom backup books
      try {
        const backupBooksRaw = localStorage.getItem(BACKUP_BOOKS_KEY);
        if (backupBooksRaw) {
          const backupBooks = JSON.parse(backupBooksRaw);
          backupBooks.forEach(bb => {
            if (!parsed.books.some(b => b.id && b.id.toLowerCase() === bb.id.toLowerCase())) {
              parsed.books.unshift(bb);
            }
          });
        }
      } catch (err) {}

      // 5. Restore custom enrolled members
      try {
        const backupRaw = localStorage.getItem(BACKUP_MEMBERS_KEY) || sessionStorage.getItem(BACKUP_MEMBERS_KEY);
        if (backupRaw) {
          const backupMembers = JSON.parse(backupRaw);
          backupMembers.forEach(bm => {
            if (!parsed.members.some(m => m.id && m.id.toLowerCase() === bm.id.toLowerCase())) {
              parsed.members.unshift(bm);
            }
          });
        }
      } catch (err) {}

      // 6. Restore custom registered user accounts
      try {
        const backupUsersRaw = localStorage.getItem(BACKUP_USERS_KEY) || sessionStorage.getItem(BACKUP_USERS_KEY);
        if (backupUsersRaw) {
          const backupUsers = JSON.parse(backupUsersRaw);
          backupUsers.forEach(bu => {
            if (!parsed.users.some(u => u.username && u.username.toLowerCase() === bu.username.toLowerCase())) {
              parsed.users.push(bu);
            }
          });
        }
      } catch (err) {}

      // 7. Auto-migrate currency symbol and daily fine rate from USD ($ / 0.50) to INR (₹ / 5.00)
      if (!parsed.settings) parsed.settings = { ...SEED_DATA.settings };
      if (!parsed.settings.currencySymbol || parsed.settings.currencySymbol === '$') {
        parsed.settings.currencySymbol = '₹';
      }
      if (parsed.settings.dailyFineRate === 0.5 || !parsed.settings.dailyFineRate) {
        parsed.settings.dailyFineRate = 5.00;
      }

      this._memoryData = parsed;
      this.saveData(parsed);
    } catch (e) {
      console.error("LocalStorage access failed, fallback to memory:", e);
      this._memoryData = JSON.parse(JSON.stringify(SEED_DATA));
    }
  }

  resetToDefaults() {
    const seedCopy = JSON.parse(JSON.stringify(SEED_DATA));
    this.saveData(seedCopy);
    return seedCopy;
  }

  getData() {
    try {
      if (this._memoryData) {
        return this.normalizeDataset(this._memoryData);
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this._memoryData = this.normalizeDataset(parsed);
        return this._memoryData;
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
    this._memoryData = JSON.parse(JSON.stringify(SEED_DATA));
    return this._memoryData;
  }

  saveData(data) {
    try {
      const normalized = this.normalizeDataset(data);
      const str = JSON.stringify(normalized);
      localStorage.setItem(STORAGE_KEY, str);
      sessionStorage.setItem(STORAGE_KEY, str);
      this._memoryData = normalized;
      if (this.cloudDbUrl) {
        this.pushToCloud(normalized);
      }
      return true;
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      this._memoryData = data;
      if (this.cloudDbUrl) {
        this.pushToCloud(data);
      }
      return false;
    }
  }

  // Live Cloud Push (Debounced 300ms for performance and batching)
  pushToCloud(data) {
    if (!this.cloudDbUrl) return;
    if (this._pushDebounceTimer) {
      clearTimeout(this._pushDebounceTimer);
    }
    this._pendingCloudData = this.normalizeDataset(JSON.parse(JSON.stringify(data)));
    this._pushDebounceTimer = setTimeout(async () => {
      const dataToPush = this._pendingCloudData;
      if (!dataToPush || !this.cloudDbUrl) return;
      try {
        this.isSyncing = true;
        this.updateSyncUI();
        const endpoint = `${this.cloudDbUrl}/lumina_data.json`;
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToPush)
        });
        if (!res.ok) {
          throw new Error(`Cloud server returned HTTP ${res.status}`);
        }
        this.isCloudConnected = true;
        this.lastSyncTime = new Date();
      } catch (err) {
        console.warn("Cloud sync push error:", err);
        this.isCloudConnected = false;
      } finally {
        this.isSyncing = false;
        this.updateSyncUI();
      }
    }, 300);
  }

  // Pull latest full dataset from Cloud Database with Non-Destructive Smart Merge
  async pullFromCloud() {
    if (!this.cloudDbUrl) return null;
    try {
      this.isSyncing = true;
      this.updateSyncUI();
      const endpoint = `${this.cloudDbUrl}/lumina_data.json`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`Cloud server returned HTTP ${res.status}`);
      }
      const cloudData = await res.json();
      if (cloudData && typeof cloudData === 'object') {
        const normalizedCloud = this.normalizeDataset(cloudData);
        const currentLocal = this.getData();
        const merged = this.mergeDatasets(currentLocal, normalizedCloud);

        this.isCloudConnected = true;
        this.lastSyncTime = new Date();
        this._memoryData = merged;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        // If local device had custom books/members that weren't in cloud yet, push back the merged dataset!
        const localHasNewBooks = currentLocal.books.some(lb => !normalizedCloud.books.some(cb => cb.id && cb.id.toLowerCase() === lb.id.toLowerCase()));
        const localHasNewMembers = currentLocal.members.some(lm => !normalizedCloud.members.some(cm => cm.id && cm.id.toLowerCase() === lm.id.toLowerCase()));
        if (localHasNewBooks || localHasNewMembers) {
          this.pushToCloud(merged);
        }

        if (window.uiRenderer && typeof window.uiRenderer.refreshCurrentView === 'function') {
          window.uiRenderer.refreshCurrentView();
        }
        return merged;
      } else if (cloudData === null) {
        // Newly created database is empty. Auto-seed with local dataset!
        console.log("Empty cloud database detected. Auto-seeding local library data to cloud...");
        const localData = this.getData();
        await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localData)
        });
        this.isCloudConnected = true;
        this.lastSyncTime = new Date();
        return localData;
      }
    } catch (err) {
      console.warn("Cloud pull error:", err);
      this.isCloudConnected = false;
    } finally {
      this.isSyncing = false;
      this.updateSyncUI();
    }
    return null;
  }

  // Start Server-Sent Events (SSE) Real-Time Listener with Automatic Merge
  startRealtimeListener() {
    if (!this.cloudDbUrl) return;
    if (this.eventSource) {
      try { this.eventSource.close(); } catch (e) {}
      this.eventSource = null;
    }

    try {
      const endpoint = `${this.cloudDbUrl}/lumina_data.json`;
      this.eventSource = new EventSource(endpoint);

      this.eventSource.addEventListener('put', (e) => {
        try {
          if (!e.data) return;
          const payload = JSON.parse(e.data);
          if (payload.path === '/' && payload.data && typeof payload.data === 'object') {
            const normalized = this.normalizeDataset(payload.data);
            const merged = this.mergeDatasets(this.getData(), normalized);
            this._memoryData = merged;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            this.lastSyncTime = new Date();
            this.isCloudConnected = true;
            this.updateSyncUI();
            if (window.uiRenderer && typeof window.uiRenderer.refreshCurrentView === 'function') {
              window.uiRenderer.refreshCurrentView();
            }
          } else if (payload.path && payload.path !== '/') {
            // Incremental sub-path change, pull complete fresh dataset
            this.pullFromCloud();
          }
        } catch (err) {
          console.warn("Realtime sync event parsing error:", err);
        }
      });

      this.eventSource.addEventListener('keep-alive', () => {
        this.isCloudConnected = true;
        this.updateSyncUI();
      });

      this.eventSource.onerror = () => {
        // EventSource will automatically retry connecting
        this.updateSyncUI();
      };
    } catch (e) {
      console.warn("Could not start EventSource realtime listener:", e);
    }
  }

  // Connect new cloud database URL
  async setCloudDbUrl(url) {
    if (!url || !url.trim()) {
      throw new Error("Please enter a valid Firebase Realtime Database URL.");
    }
    let clean = url.trim().replace(/\/+$/, '');
    if (clean.endsWith('.json')) clean = clean.slice(0, -5);
    if (clean.endsWith('/lumina_data')) clean = clean.slice(0, -12);

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }

    localStorage.setItem(CLOUD_DB_KEY, clean);
    this.cloudDbUrl = clean;
    this.startRealtimeListener();
    const res = await this.pullFromCloud();
    this.updateSyncUI();
    return res;
  }

  // Disconnect from cloud and revert to local storage
  disconnectCloud() {
    if (this.eventSource) {
      try { this.eventSource.close(); } catch (e) {}
      this.eventSource = null;
    }
    localStorage.removeItem(CLOUD_DB_KEY);
    this.cloudDbUrl = null;
    this.isCloudConnected = false;
    this.updateSyncUI();
  }

  // Generate 1-click shareable link with ?cloud= parameter
  getShareableLink() {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
      ? window.location.origin
      : 'https://lumina-library-system.vercel.app';
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname)
      ? window.location.pathname
      : '/';
    if (!this.cloudDbUrl) return `${origin}${path}`;
    return `${origin}${path}?cloud=${encodeURIComponent(this.cloudDbUrl)}`;
  }

  // Update cloud badges and modal info across the app
  updateSyncUI() {
    try {
      const dot = document.getElementById('cloudStatusDot');
      const text = document.getElementById('cloudStatusText');
      const loginDot = document.getElementById('loginCloudDot');
      const loginText = document.getElementById('loginCloudText');
      const modalDot = document.getElementById('cloudModalStatusDot');
      const modalStatus = document.getElementById('cloudModalStatusText');
      const modalSub = document.getElementById('cloudModalStatusSub');
      const input = document.getElementById('cloudDbUrlInput');
      const lastSyncEl = document.getElementById('cloudModalLastSync');

      let statusText = 'Local Mode';
      let dotColor = 'bg-amber-400';

      if (this.isSyncing) {
        statusText = 'Syncing...';
        dotColor = 'bg-blue-500 animate-pulse';
      } else if (this.isCloudConnected && this.cloudDbUrl) {
        statusText = 'Cloud Synced';
        dotColor = 'bg-emerald-500';
      } else if (this.cloudDbUrl) {
        statusText = 'Connecting...';
        dotColor = 'bg-amber-500 animate-pulse';
      }

      if (dot) dot.className = `w-2 h-2 rounded-full ${dotColor}`;
      if (text) text.textContent = statusText;
      if (loginDot) loginDot.className = `w-2 h-2 rounded-full ${dotColor}`;
      if (loginText) loginText.textContent = `Sync: ${statusText}`;

      if (modalDot) modalDot.className = `w-3 h-3 rounded-full ${dotColor}`;
      if (modalStatus) {
        modalStatus.textContent = this.isCloudConnected
          ? 'Live Cloud Synchronization Active'
          : (this.cloudDbUrl ? 'Connecting to Cloud Database...' : 'Operating in Local Browser Mode');
      }
      if (modalSub) {
        modalSub.textContent = this.isCloudConnected
          ? 'All student registrations, checkouts, and returns sync across all laptops in real-time.'
          : (this.cloudDbUrl ? 'Establishing handshake with Firebase Realtime Database...' : 'Changes are stored on this device only. Connect Firebase to sync across devices.');
      }
      if (input && !input.value && this.cloudDbUrl) {
        input.value = this.cloudDbUrl;
      }
      if (lastSyncEl) {
        lastSyncEl.textContent = this.lastSyncTime
          ? `Last synced: ${this.lastSyncTime.toLocaleTimeString()}`
          : (this.cloudDbUrl ? 'Connecting...' : 'Not connected');
      }
    } catch (e) {
      // DOM elements might not be loaded yet
    }
  }

  // Activity Log Helper
  logActivity(type, text) {
    const data = this.getData();
    const newAct = {
      id: "ACT-" + Date.now().toString(36).toUpperCase(),
      type,
      text,
      timestamp: new Date().toISOString()
    };
    data.activityLog = [newAct, ...(data.activityLog || [])].slice(0, 50); // keep last 50
    this.saveData(data);
  }

  // Books
  getBooks() {
    return this.normalizeArray(this.getData().books);
  }

  getBook(id) {
    if (!id) return null;
    return this.getBooks().find(b => b.id && b.id.toLowerCase() === id.toLowerCase());
  }

  saveBook(book) {
    const data = this.getData();
    data.books = this.normalizeArray(data.books);
    const idx = data.books.findIndex(b => b.id && b.id.toLowerCase() === (book.id || '').toLowerCase());
    if (idx >= 0) {
      data.books[idx] = { ...data.books[idx], ...book };
      this.logActivity('update_book', `Updated book: "${book.title}"`);
    } else {
      data.books.unshift(book);
      this.logActivity('add_book', `Added new book: "${book.title}"`);
    }
    this.saveData(data);

    // Save to backup keys so newly added books survive any reset or reload
    try {
      const backupRaw = localStorage.getItem(BACKUP_BOOKS_KEY);
      const backupBooks = backupRaw ? JSON.parse(backupRaw) : [];
      const bIdx = backupBooks.findIndex(b => b.id && b.id.toLowerCase() === book.id.toLowerCase());
      if (bIdx >= 0) backupBooks[bIdx] = book;
      else backupBooks.unshift(book);
      localStorage.setItem(BACKUP_BOOKS_KEY, JSON.stringify(backupBooks));
    } catch (e) {}

    return book;
  }

  deleteBook(id) {
    if (window.authManager && !window.authManager.isAdmin()) {
      throw new Error("Security Violation: Only administrators have permission to delete books.");
    }
    const data = this.getData();
    data.books = this.normalizeArray(data.books);
    const book = data.books.find(b => b.id === id);
    if (!book) return false;

    // Check if book has active loans
    const hasActiveLoan = (data.loans || []).some(l => l.bookId === id && l.status === 'Active');
    if (hasActiveLoan) {
      throw new Error(`Cannot delete "${book.title}" because copies are currently on loan.`);
    }

    data.books = data.books.filter(b => b.id !== id);
    // Also remove reservations
    data.reservations = (data.reservations || []).filter(r => r.bookId !== id);
    this.logActivity('delete_book', `Removed book: "${book.title}"`);
    this.saveData(data);

    // Remove from backup books key
    try {
      const backupRaw = localStorage.getItem(BACKUP_BOOKS_KEY);
      if (backupRaw) {
        const backupBooks = JSON.parse(backupRaw).filter(b => b.id && b.id.toLowerCase() !== id.toLowerCase());
        localStorage.setItem(BACKUP_BOOKS_KEY, JSON.stringify(backupBooks));
      }
    } catch (e) {}

    return true;
  }

  // Members
  getMembers() {
    return this.normalizeArray(this.getData().members);
  }

  getMember(id) {
    if (!id) return null;
    return this.getMembers().find(m => m.id && m.id.toLowerCase() === id.toLowerCase());
  }

  saveMember(member) {
    const data = this.getData();
    data.members = this.normalizeArray(data.members);
    const idx = data.members.findIndex(m => m.id && m.id.toLowerCase() === member.id.toLowerCase());
    if (idx >= 0) {
      data.members[idx] = { ...data.members[idx], ...member };
      this.logActivity('update_member', `Updated member: ${member.name}`);
    } else {
      data.members.unshift(member);
      this.logActivity('add_member', `Enrolled new member: ${member.name}`);
    }
    this.saveData(data);

    // Save to backup keys so newly enrolled students survive any reset or reload
    try {
      const backupRaw = localStorage.getItem(BACKUP_MEMBERS_KEY) || sessionStorage.getItem(BACKUP_MEMBERS_KEY);
      const backupMembers = backupRaw ? JSON.parse(backupRaw) : [];
      const bIdx = backupMembers.findIndex(m => m.id && m.id.toLowerCase() === member.id.toLowerCase());
      if (bIdx >= 0) backupMembers[bIdx] = member;
      else backupMembers.unshift(member);
      localStorage.setItem(BACKUP_MEMBERS_KEY, JSON.stringify(backupMembers));
      sessionStorage.setItem(BACKUP_MEMBERS_KEY, JSON.stringify(backupMembers));
    } catch (e) {}

    return member;
  }

  deleteMember(id) {
    const data = this.getData();
    data.members = this.normalizeArray(data.members);
    const member = data.members.find(m => m.id && m.id.toLowerCase() === id.toLowerCase());
    if (!member) return false;

    const hasActiveLoan = (data.loans || []).some(l => l.memberId && l.memberId.toLowerCase() === id.toLowerCase() && l.status === 'Active');
    if (hasActiveLoan) {
      throw new Error(`Cannot delete member ${member.name} with active outstanding loans.`);
    }

    data.members = data.members.filter(m => m.id && m.id.toLowerCase() !== id.toLowerCase());
    this.logActivity('delete_member', `Removed member: ${member.name}`);
    this.saveData(data);

    // Remove from backup members key
    try {
      const backupRaw = localStorage.getItem(BACKUP_MEMBERS_KEY);
      if (backupRaw) {
        const backupMembers = JSON.parse(backupRaw).filter(m => m.id && m.id.toLowerCase() !== id.toLowerCase());
        localStorage.setItem(BACKUP_MEMBERS_KEY, JSON.stringify(backupMembers));
      }
    } catch (e) {}

    return true;
  }

  // Loans
  getLoans() {
    return this.normalizeArray(this.getData().loans);
  }

  getLoan(id) {
    if (!id) return null;
    return this.getLoans().find(l => l.id && l.id.toLowerCase() === id.toLowerCase());
  }

  saveLoan(loan) {
    const data = this.getData();
    data.loans = this.normalizeArray(data.loans);
    const idx = data.loans.findIndex(l => l.id && l.id.toLowerCase() === loan.id.toLowerCase());
    if (idx >= 0) {
      data.loans[idx] = { ...data.loans[idx], ...loan };
    } else {
      data.loans.unshift(loan);
    }
    this.saveData(data);

    // Save to backup loans key
    try {
      const backupRaw = localStorage.getItem(BACKUP_LOANS_KEY);
      const backupLoans = backupRaw ? JSON.parse(backupRaw) : [];
      const bIdx = backupLoans.findIndex(l => l.id && l.id.toLowerCase() === loan.id.toLowerCase());
      if (bIdx >= 0) backupLoans[bIdx] = loan;
      else backupLoans.unshift(loan);
      localStorage.setItem(BACKUP_LOANS_KEY, JSON.stringify(backupLoans));
    } catch (e) {}

    return loan;
  }

  // Reservations
  getReservations() {
    return this.normalizeArray(this.getData().reservations);
  }

  saveReservation(res) {
    const data = this.getData();
    data.reservations = this.normalizeArray(data.reservations);
    const idx = data.reservations.findIndex(r => r.id === res.id);
    if (idx >= 0) {
      data.reservations[idx] = { ...data.reservations[idx], ...res };
    } else {
      data.reservations.push(res);
    }
    this.saveData(data);
    return res;
  }

  deleteReservation(id) {
    const data = this.getData();
    data.reservations = this.normalizeArray(data.reservations).filter(r => r.id !== id);
    this.saveData(data);
  }

  // Users & Authentication
  getUsers() {
    const data = this.getData();
    let users = this.normalizeArray(data.users);

    // Always guarantee core seed users (admin, staff, student1..5, student) exist
    if (typeof SEED_DATA !== 'undefined' && Array.isArray(SEED_DATA.users)) {
      let needsSave = false;
      SEED_DATA.users.forEach(su => {
        if (!users.some(u => u.username && u.username.toLowerCase() === su.username.toLowerCase())) {
          users.push(JSON.parse(JSON.stringify(su)));
          needsSave = true;
        }
      });
      if (needsSave && data) {
        data.users = users;
        this._memoryData = data;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
      }
    }
    return users;
  }

  getUser(id) {
    return this.getUsers().find(u => u.id === id);
  }

  getUserByUsername(identifier) {
    if (!identifier) return null;
    let clean = identifier.trim().toLowerCase();
    if (clean.includes('@')) {
      clean = clean.split('@')[0];
    }
    const rawLower = identifier.trim().toLowerCase();

    // 1. Direct match by username
    let user = this.getUsers().find(u => u.username && (u.username.toLowerCase() === clean || u.username.toLowerCase() === rawLower));
    if (user) return user;

    // 2. Direct match by Student ID / Linked Member ID (e.g. STU-2024-001, MEM-201, STU-2024-002)
    user = this.getUsers().find(u => u.linkedMemberId && u.linkedMemberId.toLowerCase() === rawLower);
    if (user) return user;

    // 3. Match against members list (by Member ID or Email)
    const member = this.getMembers().find(m => 
      (m.id && m.id.toLowerCase() === rawLower) ||
      (m.email && m.email.toLowerCase() === rawLower)
    );
    if (member) {
      // Find if an existing user links to this member
      user = this.getUsers().find(u => u.linkedMemberId && u.linkedMemberId.toLowerCase() === member.id.toLowerCase());
      if (user) return user;

      // Auto-create user login account for this student/member
      const isStudent = !member.membershipType || member.membershipType.toLowerCase().includes('student');
      const newUser = {
        id: "USR-" + Math.floor(100 + Math.random() * 900),
        username: member.id.toLowerCase(),
        password: isStudent ? "student123" : "staff123",
        fullName: member.name,
        role: isStudent ? "STUDENT" : "STAFF",
        linkedMemberId: member.id,
        avatarColor: member.avatarColor || "#2563eb"
      };
      this.saveUser(newUser);
      return newUser;
    }

    return null;
  }

  generateNextStudentId() {
    const students = this.getMembers().filter(m => m.membershipType && m.membershipType.toLowerCase().includes('student'));
    return "STU-2024-" + String(students.length + 1).padStart(3, '0');
  }

  saveUser(user) {
    const data = this.getData();
    data.users = this.normalizeArray(data.users);
    const idx = data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      data.users[idx] = { ...data.users[idx], ...user };
    } else {
      data.users.push(user);
    }
    this.saveData(data);

    // Save to backup keys so user login accounts survive any reset or reload
    try {
      const backupRaw = localStorage.getItem(BACKUP_USERS_KEY) || sessionStorage.getItem(BACKUP_USERS_KEY);
      const backupUsers = backupRaw ? JSON.parse(backupRaw) : [];
      const bIdx = backupUsers.findIndex(u => u.username && u.username.toLowerCase() === user.username.toLowerCase());
      if (bIdx >= 0) backupUsers[bIdx] = user;
      else backupUsers.push(user);
      localStorage.setItem(BACKUP_USERS_KEY, JSON.stringify(backupUsers));
      sessionStorage.setItem(BACKUP_USERS_KEY, JSON.stringify(backupUsers));
    } catch (e) {}

    return user;
  }

  // Settings
  getSettings() {
    return this.getData().settings || SEED_DATA.settings;
  }

  saveSettings(newSettings) {
    const data = this.getData();
    data.settings = { ...data.settings, ...newSettings };
    this.saveData(data);
    this.logActivity('settings_update', 'Library circulation rules updated');
    return data.settings;
  }

  // Export / Import
  exportData() {
    return JSON.stringify(this.getData(), null, 2);
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.books || !parsed.members || !parsed.loans) {
        throw new Error("Invalid library database file format. Missing core tables.");
      }
      this.saveData(parsed);
      this.logActivity('import', 'Database restored from backup file');
      return true;
    } catch (e) {
      throw new Error(`Failed to import data: ${e.message}`);
    }
  }
}

// Global instance
window.storageService = new StorageService();
