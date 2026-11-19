/**
 * Storage Service
 * Handles persistence in localStorage, data integrity, import & export.
 */

const STORAGE_KEY = 'lumina_library_data_v1';
const BACKUP_MEMBERS_KEY = 'lumina_custom_registered_members_v1';
const BACKUP_USERS_KEY = 'lumina_custom_registered_users_v1';

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      let parsed;
      if (!existing) {
        parsed = JSON.parse(JSON.stringify(SEED_DATA));
      } else {
        parsed = JSON.parse(existing);
        if (!parsed.books || !parsed.members || !parsed.loans) {
          console.warn("Storage data incomplete, restoring base seed data.");
          parsed = JSON.parse(JSON.stringify(SEED_DATA));
        }
      }

      // 1. Ensure all default seed users exist (admin, staff, student1..5)
      if (!parsed.users) {
        parsed.users = JSON.parse(JSON.stringify(SEED_DATA.users || []));
      } else {
        SEED_DATA.users.forEach(su => {
          if (!parsed.users.some(u => u.username && u.username.toLowerCase() === su.username.toLowerCase())) {
            parsed.users.push(JSON.parse(JSON.stringify(su)));
          }
        });
      }

      // 2. Ensure all custom enrolled members survive any reload/reset
      try {
        const backupRaw = localStorage.getItem(BACKUP_MEMBERS_KEY) || sessionStorage.getItem(BACKUP_MEMBERS_KEY);
        if (backupRaw) {
          const backupMembers = JSON.parse(backupRaw);
          backupMembers.forEach(bm => {
            if (!parsed.members.some(m => m.id === bm.id)) {
              parsed.members.unshift(bm);
            }
          });
        }
      } catch (err) {}

      // 3. Ensure all custom registered user accounts survive any reload/reset
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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
    return this._memoryData || JSON.parse(JSON.stringify(SEED_DATA));
  }

  saveData(data) {
    try {
      const str = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, str);
      sessionStorage.setItem(STORAGE_KEY, str);
      this._memoryData = data;
      return true;
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      this._memoryData = data;
      return false;
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
    return this.getData().books || [];
  }

  getBook(id) {
    return this.getBooks().find(b => b.id === id);
  }

  saveBook(book) {
    if (window.authManager && !window.authManager.isAdmin()) {
      throw new Error("Security Violation: Only administrators have permission to add or modify books.");
    }
    const data = this.getData();
    const idx = data.books.findIndex(b => b.id === book.id);
    if (idx >= 0) {
      data.books[idx] = { ...data.books[idx], ...book };
      this.logActivity('update_book', `Updated book: "${book.title}"`);
    } else {
      data.books.unshift(book);
      this.logActivity('add_book', `Added new book: "${book.title}"`);
    }
    this.saveData(data);
    return book;
  }

  deleteBook(id) {
    if (window.authManager && !window.authManager.isAdmin()) {
      throw new Error("Security Violation: Only administrators have permission to delete books.");
    }
    const data = this.getData();
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
    return true;
  }

  // Members
  getMembers() {
    return this.getData().members || [];
  }

  getMember(id) {
    return this.getMembers().find(m => m.id === id);
  }

  saveMember(member) {
    const data = this.getData();
    const idx = data.members.findIndex(m => m.id === member.id);
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
      const bIdx = backupMembers.findIndex(m => m.id === member.id);
      if (bIdx >= 0) backupMembers[bIdx] = member;
      else backupMembers.unshift(member);
      localStorage.setItem(BACKUP_MEMBERS_KEY, JSON.stringify(backupMembers));
      sessionStorage.setItem(BACKUP_MEMBERS_KEY, JSON.stringify(backupMembers));
    } catch (e) {}

    return member;
  }

  deleteMember(id) {
    const data = this.getData();
    const member = data.members.find(m => m.id === id);
    if (!member) return false;

    const hasActiveLoan = (data.loans || []).some(l => l.memberId === id && l.status === 'Active');
    if (hasActiveLoan) {
      throw new Error(`Cannot delete member ${member.name} with active outstanding loans.`);
    }

    data.members = data.members.filter(m => m.id !== id);
    this.logActivity('delete_member', `Removed member: ${member.name}`);
    this.saveData(data);
    return true;
  }

  // Loans
  getLoans() {
    return this.getData().loans || [];
  }

  getLoan(id) {
    return this.getLoans().find(l => l.id === id);
  }

  saveLoan(loan) {
    const data = this.getData();
    const idx = data.loans.findIndex(l => l.id === loan.id);
    if (idx >= 0) {
      data.loans[idx] = { ...data.loans[idx], ...loan };
    } else {
      data.loans.unshift(loan);
    }
    this.saveData(data);
    return loan;
  }

  // Reservations
  getReservations() {
    return this.getData().reservations || [];
  }

  saveReservation(res) {
    const data = this.getData();
    const idx = (data.reservations || []).findIndex(r => r.id === res.id);
    if (idx >= 0) {
      data.reservations[idx] = { ...data.reservations[idx], ...res };
    } else {
      data.reservations = data.reservations || [];
      data.reservations.push(res);
    }
    this.saveData(data);
    return res;
  }

  deleteReservation(id) {
    const data = this.getData();
    data.reservations = (data.reservations || []).filter(r => r.id !== id);
    this.saveData(data);
  }

  // Users & Authentication
  getUsers() {
    const data = this.getData();
    let users = data.users || [];
    if (!Array.isArray(users)) users = [];

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
        this.saveData(data);
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
    data.users = data.users || [];
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
      const bIdx = backupUsers.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
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
