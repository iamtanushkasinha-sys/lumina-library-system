/**
 * Web Authentication & Role-Based Access Control (RBAC) Manager
 */

const AUTH_USER_KEY = 'lumina_current_user_v1';

class AuthManager {
  constructor(storageService) {
    this.storage = storageService;
    this.currentUser = this.loadSavedUser();
    this.listeners = [];
  }

  loadSavedUser() {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load saved user session:", e);
    }
    // Return null so initial load presents the dedicated first login interface!
    return null;
  }

  saveSession(user) {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save auth session:", e);
    }
    this.currentUser = user;
    this.notifyListeners();
  }

  login(username, password) {
    if (!username || !password) {
      throw new Error("Username and password are required.");
    }
    const user = this.storage.getUserByUsername(username);
    if (!user) {
      throw new Error("Invalid credentials: user '" + username + "' not found.");
    }
    if (user.password !== password) {
      throw new Error("Incorrect password for account '" + username + "'.");
    }

    this.saveSession(user);
    return user;
  }

  logout() {
    localStorage.removeItem(AUTH_USER_KEY);
    this.currentUser = null;
    this.notifyListeners();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'ADMIN';
  }

  isStaff() {
    return this.currentUser && this.currentUser.role === 'STAFF';
  }

  isStudent() {
    return this.currentUser && this.currentUser.role === 'STUDENT';
  }

  canManageCatalog() {
    return this.isAdmin();
  }

  canManageCirculation() {
    return this.isAdmin() || this.isStaff();
  }

  canManageSettings() {
    return this.isAdmin();
  }

  onAuthChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(this.currentUser); } catch (e) { console.error(e); }
    });
  }
}

window.authManager = new AuthManager(window.storageService);
