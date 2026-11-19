/**
 * Lumina Library Management System
 * Main Application Controller & Event Wiring
 */

document.addEventListener('DOMContentLoaded', () => {
  // Update Cloud Sync Status Indicator
  if (window.storageService) {
    window.storageService.updateSyncUI();
  }

  // Initialize Storage and Circulation state
  window.libraryEngine.refreshCirculationState();

  // Initialize Dark Mode from preference or system
  initTheme();

  // Initialize dedicated Attendify-style first login interface
  window.uiRenderer.initHeroLogin();

  // Check login state: show Login Screen as first interface if not logged in
  if (!window.authManager.isLoggedIn()) {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainAppShell');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
  } else {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainAppShell');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');

    // Initialize Role & User UI state
    window.uiRenderer.updateUserUI();

    // Initial render: Dashboard or Student Portal
    if (window.authManager.isStudent()) {
      window.uiRenderer.switchView('student-portal');
    } else {
      window.uiRenderer.switchView('dashboard');
    }
  }

  // Wire up all event listeners
  setupNavigation();
  setupSearchAndFilters();
  setupForms();
  setupAuthEvents();
  setupDataManagement();
  setupKeyboardShortcuts();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('lumina_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('lumina_theme', isDark ? 'dark' : 'light');
      // Re-render charts with updated theme colors
      if (window.uiRenderer.currentView === 'dashboard') {
        window.uiRenderer.renderDashboard();
      }
    });
  }
}

// Navigation Wiring
function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      if (targetView) {
        window.uiRenderer.switchView(targetView);
      }
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
    });
  }
}

// Search & Filter event handlers with debounce
function debounce(func, wait = 250) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function setupSearchAndFilters() {
  // Book Search & Filters
  const bookSearchInput = document.getElementById('bookSearchInput');
  if (bookSearchInput) {
    bookSearchInput.addEventListener('input', debounce((e) => {
      window.uiRenderer.bookSearchQuery = e.target.value.trim();
      window.uiRenderer.renderBooks();
    }, 200));
  }

  const bookCatSelect = document.getElementById('bookCategorySelect');
  if (bookCatSelect) {
    bookCatSelect.addEventListener('change', (e) => {
      window.uiRenderer.bookCategoryFilter = e.target.value;
      window.uiRenderer.renderBooks();
    });
  }

  const bookAvailSelect = document.getElementById('bookAvailabilitySelect');
  if (bookAvailSelect) {
    bookAvailSelect.addEventListener('change', (e) => {
      window.uiRenderer.bookAvailabilityFilter = e.target.value;
      window.uiRenderer.renderBooks();
    });
  }

  const bookSortSelect = document.getElementById('bookSortSelect');
  if (bookSortSelect) {
    bookSortSelect.addEventListener('change', (e) => {
      window.uiRenderer.bookSortBy = e.target.value;
      window.uiRenderer.renderBooks();
    });
  }

  // Book View Toggle (Grid vs Table)
  const viewGridBtn = document.getElementById('viewGridBtn');
  const viewTableBtn = document.getElementById('viewTableBtn');
  if (viewGridBtn && viewTableBtn) {
    viewGridBtn.addEventListener('click', () => {
      window.uiRenderer.bookViewMode = 'grid';
      viewGridBtn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600');
      viewTableBtn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600');
      window.uiRenderer.renderBooks();
    });

    viewTableBtn.addEventListener('click', () => {
      window.uiRenderer.bookViewMode = 'table';
      viewTableBtn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600');
      viewGridBtn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600');
      window.uiRenderer.renderBooks();
    });
  }

  // Member Search & Filters
  const memberSearchInput = document.getElementById('memberSearchInput');
  if (memberSearchInput) {
    memberSearchInput.addEventListener('input', debounce((e) => {
      window.uiRenderer.memberSearchQuery = e.target.value.trim();
      window.uiRenderer.renderMembers();
    }, 200));
  }

  const memberTypeSelect = document.getElementById('memberTypeSelect');
  if (memberTypeSelect) {
    memberTypeSelect.addEventListener('change', (e) => {
      window.uiRenderer.memberTypeFilter = e.target.value;
      window.uiRenderer.renderMembers();
    });
  }

  const memberStatusSelect = document.getElementById('memberStatusSelect');
  if (memberStatusSelect) {
    memberStatusSelect.addEventListener('change', (e) => {
      window.uiRenderer.memberStatusFilter = e.target.value;
      window.uiRenderer.renderMembers();
    });
  }

  // Circulation Search & Tab Filters
  const circSearchInput = document.getElementById('circulationSearchInput');
  if (circSearchInput) {
    circSearchInput.addEventListener('input', debounce((e) => {
      window.uiRenderer.circulationSearchQuery = e.target.value.trim();
      window.uiRenderer.renderCirculation();
    }, 200));
  }

  document.querySelectorAll('.circ-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.circ-tab-btn').forEach(b => {
        b.classList.remove('border-indigo-600', 'text-indigo-600', 'dark:border-indigo-400', 'dark:text-indigo-400');
        b.classList.add('border-transparent', 'text-slate-500');
      });
      btn.classList.add('border-indigo-600', 'text-indigo-600', 'dark:border-indigo-400', 'dark:text-indigo-400');
      btn.classList.remove('border-transparent', 'text-slate-500');

      window.uiRenderer.circulationFilter = btn.getAttribute('data-status');
      window.uiRenderer.renderCirculation();
    });
  });
}

// Authentication & Role Management Events
function setupAuthEvents() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('loginUsernameInput').value.trim();
      const p = document.getElementById('loginPasswordInput').value.trim();

      try {
        const user = window.authManager.login(u, p);
        window.uiRenderer.closeModal('modalLogin');
        window.uiRenderer.toast(`Authenticated as ${user.fullName} (${user.role})`, 'success');
        window.uiRenderer.updateUserUI();
      } catch (err) {
        window.uiRenderer.toast(err.message, 'error');
      }
    });
  }

  // Quick Login Buttons in Login Modal
  document.querySelectorAll('.btn-quick-login').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      window.uiRenderer.handleQuickLogin(role);
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.uiRenderer.handleLogout();
    });
  }
}

// Form Handlers
function setupForms() {
  // Checkout / Issue Form
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (window.authManager && window.authManager.isStudent()) {
        window.uiRenderer.toast("Students cannot issue books via the circulation desk. Please use the 'Borrow' button in the catalog or in your Student Portal.", "warning");
        window.uiRenderer.closeModal('modalCheckout');
        return;
      }
      const bookId = document.getElementById('checkoutBookSelect').value;
      const memberId = document.getElementById('checkoutMemberSelect').value;
      const duration = document.getElementById('checkoutDurationInput').value;

      if (!bookId || !memberId) {
        window.uiRenderer.toast("Please select both a book and a patron.", "warning");
        return;
      }

      try {
        const loan = window.libraryEngine.issueBook(bookId, memberId, duration);
        window.uiRenderer.closeModal('modalCheckout');
        window.uiRenderer.toast(`Loan #${loan.id} issued successfully! Due: ${loan.dueDate}`, "success");
        window.uiRenderer.switchView('circulation');
      } catch (err) {
        window.uiRenderer.toast(err.message, "error");
      }
    });
  }

  // Return Book Form
  const returnForm = document.getElementById('returnForm');
  if (returnForm) {
    returnForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const loanId = document.getElementById('returnLoanIdInput').value;
      const waiveFine = document.getElementById('returnWaiveFineCheckbox').checked;

      if (window.authManager && window.authManager.isStudent()) {
        const studentUser = window.authManager.getCurrentUser();
        const studentMemberId = studentUser ? (studentUser.linkedMemberId || studentUser.username.toUpperCase()) : null;
        const targetLoan = window.storageService.getLoans().find(l => l.id === loanId);
        if (targetLoan && studentMemberId && targetLoan.memberId.toLowerCase() !== studentMemberId.toLowerCase()) {
          window.uiRenderer.toast("Access denied: You can only return your own borrowed books.", "error");
          window.uiRenderer.closeModal('modalReturn');
          return;
        }
      }

      try {
        window.libraryEngine.returnBook(loanId, waiveFine);
        window.uiRenderer.closeModal('modalReturn');
        window.uiRenderer.toast("Book returned to inventory successfully!", "success");

        if (window.uiRenderer.currentView === 'dashboard') window.uiRenderer.renderDashboard();
        else if (window.uiRenderer.currentView === 'circulation') window.uiRenderer.renderCirculation();
        else if (window.uiRenderer.currentView === 'books') window.uiRenderer.renderBooks();
        else if (window.uiRenderer.currentView === 'student-portal') window.uiRenderer.renderStudentPortal();
      } catch (err) {
        window.uiRenderer.toast(err.message, "error");
      }
    });
  }

  // Reservation Form
  const reservationForm = document.getElementById('reservationForm');
  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const bookId = document.getElementById('reserveBookIdInput').value;
      let memberId = document.getElementById('reserveMemberSelect').value;
      const notes = document.getElementById('reserveNotesInput').value;

      if (window.authManager && window.authManager.isStudent()) {
        const studentUser = window.authManager.getCurrentUser();
        memberId = studentUser ? (studentUser.linkedMemberId || studentUser.username.toUpperCase()) : memberId;
      }

      if (!memberId) {
        window.uiRenderer.toast("Please select a patron for the reservation.", "warning");
        return;
      }

      try {
        const res = window.libraryEngine.placeReservation(bookId, memberId, notes);
        window.uiRenderer.closeModal('modalReservation');
        window.uiRenderer.toast(`Hold #${res.id} placed on waiting list!`, "success");
        window.uiRenderer.switchView('reservations');
      } catch (err) {
        window.uiRenderer.toast(err.message, "error");
      }
    });
  }

  // Add / Edit Book Form
  const bookForm = document.getElementById('bookForm');
  if (bookForm) {
    bookForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.authManager.isAdmin()) {
        window.uiRenderer.toast("Permission Denied: Only administrators are authorized to add or modify book titles.", "error");
        window.uiRenderer.closeModal('modalBookForm');
        return;
      }
      const id = document.getElementById('bookFormId').value;
      const title = document.getElementById('bookFormTitleInput').value.trim();
      const author = document.getElementById('bookFormAuthorInput').value.trim();
      const isbn = document.getElementById('bookFormIsbnInput').value.trim();
      const category = document.getElementById('bookFormCategorySelect').value;
      const year = parseInt(document.getElementById('bookFormYearInput').value) || new Date().getFullYear();
      const totalCopies = parseInt(document.getElementById('bookFormCopiesInput').value) || 1;
      const shelf = document.getElementById('bookFormShelfInput').value.trim() || 'Main Wing';
      const desc = document.getElementById('bookFormDescInput').value.trim();
      const coverUrl = document.getElementById('bookFormCoverInput').value.trim();

      const existingBook = id ? window.storageService.getBook(id) : null;
      const availableCopies = existingBook
        ? Math.max(0, existingBook.availableCopies + (totalCopies - existingBook.totalCopies))
        : totalCopies;

      const bookObj = {
        id: id || "BOK-" + Math.floor(1000 + Math.random() * 9000),
        title,
        author,
        isbn,
        category,
        publishedYear: year,
        totalCopies,
        availableCopies,
        shelfLocation: shelf,
        description: desc,
        coverUrl: coverUrl || (existingBook ? existingBook.coverUrl : ''),
        rating: existingBook ? existingBook.rating : 4.8,
        borrowCount: existingBook ? existingBook.borrowCount : 0
      };

      try {
        window.storageService.saveBook(bookObj);
        window.uiRenderer.closeModal('modalBookForm');
        window.uiRenderer.toast(`Book "${title}" saved successfully!`, "success");
        window.uiRenderer.renderBooks();
      } catch (err) {
        window.uiRenderer.toast(err.message, "error");
      }
    });
  }

  // Add / Edit Member Form
  const memberForm = document.getElementById('memberForm');
  if (memberForm) {
    memberForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('memberFormId').value;
      const name = document.getElementById('memberFormNameInput').value.trim();
      const email = document.getElementById('memberFormEmailInput').value.trim();
      const phone = document.getElementById('memberFormPhoneInput').value.trim();
      const type = document.getElementById('memberFormTypeSelect').value;
      const limit = parseInt(document.getElementById('memberFormLimitInput').value) || 5;
      const status = document.getElementById('memberFormStatusSelect').value;

      const colors = ['#4f46e5', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const existing = id ? window.storageService.getMember(id) : null;

      const memberObj = {
        id: id || "MEM-" + Math.floor(100 + Math.random() * 900),
        name,
        email,
        phone,
        membershipType: type,
        maxBorrowLimit: limit,
        status,
        joinedDate: existing ? existing.joinedDate : window.libraryEngine.formatDate(new Date()),
        avatarColor: existing ? existing.avatarColor : randomColor
      };

      try {
        window.storageService.saveMember(memberObj);

        // Auto-create user login account for this patron if one doesn't exist
        const isStudent = type.toLowerCase().includes('student');
        const existingUser = window.storageService.getUsers().find(u => u.linkedMemberId === memberObj.id);
        if (!existingUser) {
          const patronUser = {
            id: "USR-" + Math.floor(100 + Math.random() * 900),
            username: memberObj.id.toLowerCase(),
            password: isStudent ? "student123" : "staff123",
            fullName: name,
            role: isStudent ? "STUDENT" : "STAFF",
            linkedMemberId: memberObj.id,
            avatarColor: memberObj.avatarColor
          };
          window.storageService.saveUser(patronUser);
        }

        window.uiRenderer.closeModal('modalMemberForm');
        window.uiRenderer.toast(`Patron "${name}" saved! ID: ${memberObj.id}`, "success");
        window.uiRenderer.renderMembers();
      } catch (err) {
        window.uiRenderer.toast(err.message, "error");
      }
    });
  }

  // Student Self-Registration Form
  const selfRegForm = document.getElementById('studentSelfRegisterForm');
  if (selfRegForm) {
    selfRegForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('selfRegName').value.trim();
      const email = document.getElementById('selfRegEmail').value.trim();
      const major = document.getElementById('selfRegMajor').value.trim();
      const year = parseInt(document.getElementById('selfRegYear').value) || 1;
      const username = document.getElementById('selfRegUsername').value.trim().toLowerCase();
      const password = document.getElementById('selfRegPassword').value.trim();

      if (!name || !email || !username || !password) {
        window.uiRenderer.toast("Please fill in all required fields.", "warning");
        return;
      }

      const nextStudentId = window.storageService.generateNextStudentId();

      const memberObj = {
        id: nextStudentId,
        name,
        email,
        phone: "+1 (555) 0100",
        membershipType: "Student",
        maxBorrowLimit: 5,
        status: "Active",
        joinedDate: window.libraryEngine.formatDate(new Date()),
        avatarColor: "#2563eb",
        major,
        academicYear: year
      };

      const userObj = {
        id: "USR-" + Math.floor(100 + Math.random() * 900),
        username,
        password,
        fullName: name,
        role: "STUDENT",
        linkedMemberId: nextStudentId,
        avatarColor: "#2563eb"
      };

      try {
        window.storageService.saveMember(memberObj);
        window.storageService.saveUser(userObj);
        window.uiRenderer.closeModal('modalStudentSelfRegister');
        if (window.uiRenderer.renderHeroQuickLogins) {
          window.uiRenderer.renderHeroQuickLogins();
        }

        // Automatically log them in with their newly assigned Student ID!
        const emailInput = document.getElementById('heroLoginEmail');
        const passInput = document.getElementById('heroLoginPassword');
        if (emailInput) emailInput.value = nextStudentId;
        if (passInput) passInput.value = password;

        const user = window.authManager.login(nextStudentId, password);
        window.uiRenderer.transitionToDashboard(user);
        window.uiRenderer.toast(`🎉 Registered! Your Student ID is ${nextStudentId}. Welcome, ${name}!`, "success");
      } catch (err) {
        window.uiRenderer.toast(err.message, "error");
      }
    });
  }

  // Settings Form
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const libName = document.getElementById('settingsLibraryNameInput').value.trim();
      const duration = parseInt(document.getElementById('settingsLoanDurationInput').value) || 14;
      const fineRate = parseFloat(document.getElementById('settingsDailyFineInput').value) || 0.50;
      const renewals = parseInt(document.getElementById('settingsMaxRenewalsInput').value) || 2;

      window.storageService.saveSettings({
        libraryName: libName,
        loanDurationDays: duration,
        dailyFineRate: fineRate,
        maxRenewalCount: renewals
      });

      document.getElementById('headerLibraryName').textContent = libName;
      window.uiRenderer.closeModal('modalSettings');
      window.uiRenderer.toast("System settings updated successfully!", "success");
      window.libraryEngine.refreshCirculationState();
      window.uiRenderer.renderDashboard();
    });
  }
}

// Data Import / Export / Backup Management
function setupDataManagement() {
  // Export JSON Backup
  const exportBtn = document.getElementById('exportDataBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = window.storageService.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumina_library_backup_${window.libraryEngine.formatDate(new Date())}.json`;
      a.click();
      URL.revokeObjectURL(url);
      window.uiRenderer.toast("Database export downloaded successfully!", "success");
    });
  }

  // Import JSON Backup
  const importInput = document.getElementById('importDataInput');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          window.storageService.importData(event.target.result);
          window.uiRenderer.toast("Database successfully restored from backup!", "success");
          window.uiRenderer.switchView('dashboard');
        } catch (err) {
          window.uiRenderer.toast(err.message, "error");
        }
      };
      reader.readAsText(file);
    });
  }

  // Reset to default seed
  const resetBtn = document.getElementById('resetSeedBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Reset library database to default sample dataset? Any unsaved edits will be replaced.")) {
        window.storageService.resetToDefaults();
        window.uiRenderer.toast("Database restored to default demo state.", "info");
        window.uiRenderer.switchView('dashboard');
      }
    });
  }

  // Export CSV Report
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const books = window.storageService.getBooks();
      let csv = "ID,Title,Author,Category,ISBN,Year,TotalCopies,AvailableCopies,ShelfLocation\n";
      books.forEach(b => {
        csv += `"${b.id}","${(b.title||'').replace(/"/g, '""')}","${(b.author||'').replace(/"/g, '""')}","${b.category}","${b.isbn}","${b.publishedYear}","${b.totalCopies}","${b.availableCopies}","${b.shelfLocation}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library_catalog_${window.libraryEngine.formatDate(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      window.uiRenderer.toast("CSV catalog report exported!", "success");
    });
  }
}

// Global Keyboard Shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape closes any open modal
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(m => {
        m.classList.remove('active');
      });
      document.body.classList.remove('overflow-hidden');
    }

    // Ctrl + K or '/' focuses book search if on books page
    if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      window.uiRenderer.switchView('books');
      const search = document.getElementById('bookSearchInput');
      if (search) search.focus();
    }
  });
}
