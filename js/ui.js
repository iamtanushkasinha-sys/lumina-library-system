/**
 * UI Renderer & DOM Controllers
 * Athenaeum / Lumina Library Management System
 */

class UIRenderer {
  constructor() {
    this.currentView = 'dashboard';
    this.bookViewMode = 'grid'; // 'grid' | 'table'
    this.bookSearchQuery = '';
    this.bookCategoryFilter = 'ALL';
    this.bookAvailabilityFilter = 'ALL';
    this.bookSortBy = 'popularity';

    this.memberSearchQuery = '';
    this.memberTypeFilter = 'ALL';
    this.memberStatusFilter = 'ALL';

    this.circulationFilter = 'ACTIVE'; // 'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED'
    this.circulationSearchQuery = '';
  }

  // Toast Notification helper
  toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item ${
      type === 'success' ? 'bg-emerald-600 text-white' :
      type === 'error' ? 'bg-rose-600 text-white' :
      type === 'warning' ? 'bg-amber-600 text-white' :
      'bg-slate-900 text-white dark:bg-slate-800'
    }`;

    const iconMap = {
      success: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      error: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
      warning: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
      info: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    toast.innerHTML = `
      ${iconMap[type] || iconMap.info}
      <span class="flex-1 text-sm leading-tight">${message}</span>
      <button class="opacity-75 hover:opacity-100 p-1" onclick="this.parentElement.remove()" aria-label="Close">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // Switch Active View
  switchView(viewName) {
    const user = window.authManager.getCurrentUser();
    const isStudent = user && user.role === 'STUDENT';

    // RBAC Security Gate: Block students from staff/admin views
    if (isStudent && (viewName === 'dashboard' || viewName === 'members' || viewName === 'circulation' || viewName === 'reservations')) {
      this.toast(`🔒 Access Restricted: The ${viewName.toUpperCase()} area is reserved for Library Staff.`, "warning");
      viewName = 'student-portal';
    }

    this.currentView = viewName;

    // Update navigation active states
    document.querySelectorAll('.nav-link').forEach(link => {
      const target = link.getAttribute('data-view');
      if (target === viewName) {
        link.classList.add('bg-indigo-50', 'text-indigo-600', 'dark:bg-slate-800', 'dark:text-indigo-400');
        link.classList.remove('text-slate-600', 'dark:text-slate-400');
      } else {
        link.classList.remove('bg-indigo-50', 'text-indigo-600', 'dark:bg-slate-800', 'dark:text-indigo-400');
        link.classList.add('text-slate-600', 'dark:text-slate-400');
      }
    });

    // Hide all view containers, show targeted view
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.add('hidden');
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
      activeSec.classList.remove('hidden');
    }

    // Render the view's data
    if (viewName === 'dashboard') this.renderDashboard();
    else if (viewName === 'books') this.renderBooks();
    else if (viewName === 'members') this.renderMembers();
    else if (viewName === 'circulation') this.renderCirculation();
    else if (viewName === 'reservations') this.renderReservations();
    else if (viewName === 'student-portal') this.renderStudentPortal();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Render Dashboard
  renderDashboard() {
    const stats = window.libraryEngine.getDashboardStats();
    const data = window.storageService.getData();

    // KPI Cards
    const statCardsContainer = document.getElementById('dashboardStatCards');
    if (statCardsContainer) {
      statCardsContainer.innerHTML = `
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow transition-smooth">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Catalog</span>
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">${stats.totalTitles}</div>
            <span class="text-xs text-slate-500 dark:text-slate-400">titles (${stats.totalCopies} copies)</span>
          </div>
          <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>${stats.availableCopies} available on shelf</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow transition-smooth">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Currently On Loan</span>
            <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">${stats.activeLoansCount}</div>
            <span class="text-xs text-slate-500 dark:text-slate-400">active loans</span>
          </div>
          <div class="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
            <span>${((stats.borrowedCopies / (stats.totalCopies || 1)) * 100).toFixed(0)}% utilization rate</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 border ${stats.overdueLoansCount > 0 ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700/80'} rounded-2xl p-5 shadow-sm hover:shadow transition-smooth">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider ${stats.overdueLoansCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}">Overdue Loans</span>
            <div class="w-10 h-10 rounded-xl ${stats.overdueLoansCount > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'} flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <div class="text-2xl font-bold ${stats.overdueLoansCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}">${stats.overdueLoansCount}</div>
            <span class="text-xs text-slate-500 dark:text-slate-400">need action</span>
          </div>
          <div class="mt-3 flex items-center gap-2 text-xs ${stats.overdueLoansCount > 0 ? 'text-rose-600 font-medium' : 'text-slate-500'}">
            <span>Fines accrued: ${stats.currency}${stats.totalFinesPending}</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:shadow transition-smooth">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Registered Patrons</span>
            <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <div class="text-2xl font-bold text-slate-900 dark:text-white">${stats.totalMembers}</div>
            <span class="text-xs text-slate-500 dark:text-slate-400">members</span>
          </div>
          <div class="mt-3 flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
            <span>${stats.pendingReservationsCount} active reservations</span>
          </div>
        </div>
      `;
    }

    // Render Charts
    setTimeout(() => {
      window.analyticsManager.renderCategoryChart('chartCategoryCanvas', stats.categoryCounts);
      window.analyticsManager.renderTrendChart('chartTrendCanvas');
    }, 50);

    // Overdue Alert Section
    const overdueSection = document.getElementById('dashboardOverdueAlerts');
    const overdueLoans = window.storageService.getLoans().filter(l => l.status === 'Overdue');
    if (overdueSection) {
      if (overdueLoans.length === 0) {
        overdueSection.innerHTML = `
          <div class="p-6 text-center text-slate-400 dark:text-slate-500">
            <svg class="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="font-medium text-sm text-slate-600 dark:text-slate-300">All clear! No overdue items.</p>
            <p class="text-xs text-slate-400 mt-1">Every book borrowed is currently within its return window.</p>
          </div>
        `;
      } else {
        overdueSection.innerHTML = `
          <div class="divide-y divide-slate-100 dark:divide-slate-700/60">
            ${overdueLoans.map(loan => {
              const book = window.storageService.getBook(loan.bookId) || { title: 'Unknown Book', isbn: 'N/A' };
              const member = window.storageService.getMember(loan.memberId) || { name: 'Unknown Patron', email: '' };
              const days = window.libraryEngine.dayDiff(loan.dueDate, window.libraryEngine.formatDate(new Date()));
              return `
                <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                      <h4 class="text-sm font-semibold text-slate-900 dark:text-white">${book.title}</h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Borrowed by <span class="font-medium text-slate-700 dark:text-slate-300">${member.name}</span> &bull; Due date was <span class="text-rose-600 dark:text-rose-400 font-semibold">${loan.dueDate}</span> (${days} days overdue)
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 self-end sm:self-center">
                    <span class="badge badge-danger text-xs font-bold">₹${(loan.fineAmount || 0).toFixed(2)} Fine</span>
                    <button class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-smooth" onclick="window.uiRenderer.openReturnModal('${loan.id}')">
                      Process Return
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    // Recent Activity Feed
    const activityContainer = document.getElementById('dashboardActivityFeed');
    if (activityContainer) {
      const activities = data.activityLog || [];
      if (activities.length === 0) {
        activityContainer.innerHTML = `<p class="p-6 text-sm text-center text-slate-400">No recent activity logged.</p>`;
      } else {
        activityContainer.innerHTML = `
          <div class="divide-y divide-slate-100 dark:divide-slate-700/60">
            ${activities.slice(0, 7).map(act => {
              const time = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return `
                <div class="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <div class="flex items-center gap-2.5">
                    <span class="w-2 h-2 rounded-full ${
                      act.type === 'issue' ? 'bg-blue-500' :
                      act.type === 'return' ? 'bg-emerald-500' :
                      act.type === 'reserve' ? 'bg-purple-500' :
                      act.type === 'overdue_alert' ? 'bg-rose-500' : 'bg-slate-400'
                    }"></span>
                    <span class="font-medium text-slate-800 dark:text-slate-200">${act.text}</span>
                  </div>
                  <span class="text-slate-400 dark:text-slate-500 whitespace-nowrap ml-3">${time}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }
  }

  // Render Books Catalog View
  renderBooks() {
    const books = window.storageService.getBooks();
    const categories = window.storageService.getData().categories || [];

    // Populate Category Filter dropdown if empty
    const catSelect = document.getElementById('bookCategorySelect');
    if (catSelect && catSelect.children.length <= 1) {
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      });
    }

    // Filter books
    let filtered = books.filter(book => {
      const q = this.bookSearchQuery.toLowerCase();
      const matchesSearch = !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.isbn && book.isbn.toLowerCase().includes(q)) ||
        (book.shelfLocation && book.shelfLocation.toLowerCase().includes(q));

      const matchesCat = this.bookCategoryFilter === 'ALL' || book.category === this.bookCategoryFilter;

      let matchesAvail = true;
      if (this.bookAvailabilityFilter === 'AVAILABLE') {
        matchesAvail = book.availableCopies > 0;
      } else if (this.bookAvailabilityFilter === 'CHECKED_OUT') {
        matchesAvail = book.availableCopies === 0;
      } else if (this.bookAvailabilityFilter === 'LOW_STOCK') {
        matchesAvail = book.availableCopies > 0 && book.availableCopies <= 1;
      }

      return matchesSearch && matchesCat && matchesAvail;
    });

    // Sort books
    if (this.bookSortBy === 'title_asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.bookSortBy === 'title_desc') {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (this.bookSortBy === 'year_desc') {
      filtered.sort((a, b) => (b.publishedYear || 0) - (a.publishedYear || 0));
    } else if (this.bookSortBy === 'popularity') {
      filtered.sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0));
    }

    // Render count
    const countEl = document.getElementById('booksCountLabel');
    if (countEl) countEl.textContent = `Showing ${filtered.length} of ${books.length} titles`;

    const container = document.getElementById('booksContainer');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <svg class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          <h3 class="text-base font-semibold text-slate-700 dark:text-slate-200">No books found</h3>
          <p class="text-sm text-slate-400 mt-1">Try adjusting your search terms or filter selections.</p>
          <button class="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-smooth" onclick="window.uiRenderer.resetBookFilters()">Clear All Filters</button>
        </div>
      `;
      return;
    }

    const isStudent = window.authManager.isStudent();
    const isAdmin = window.authManager.isAdmin();

    if (this.bookViewMode === 'grid') {
      container.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
      container.innerHTML = filtered.map(book => {
        const isAvailable = book.availableCopies > 0;
        return `
          <div class="book-card bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-smooth">
            <div>
              <div class="book-cover-container relative w-full h-52 rounded-xl mb-3 flex items-end p-3 cursor-pointer" 
                   style="background: ${book.coverGradient || 'linear-gradient(135deg, #1e293b, #334155)'};"
                   onclick="window.uiRenderer.openBookDetailsModal('${book.id}')">
                ${book.coverUrl ? `
                  <img src="${book.coverUrl}" alt="${book.title}" class="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90 hover:opacity-100 transition-opacity" onerror="this.style.display='none'">
                ` : ''}
                <div class="relative z-10 w-full backdrop-blur-md bg-slate-900/60 p-2.5 rounded-lg border border-white/10 text-white">
                  <div class="text-[10px] font-mono tracking-wider uppercase text-slate-300">${book.category}</div>
                  <div class="text-xs font-bold truncate">${book.title}</div>
                </div>
                <div class="absolute top-2.5 right-2.5 z-10">
                  <span class="badge ${isAvailable ? 'badge-success' : 'badge-danger'} shadow-sm">
                    ${isAvailable ? `${book.availableCopies} in stock` : 'Checked Out'}
                  </span>
                </div>
              </div>

              <div class="space-y-1">
                <h3 class="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600 cursor-pointer" onclick="window.uiRenderer.openBookDetailsModal('${book.id}')" title="${book.title}">
                  ${book.title}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">${book.author}</p>
                <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>${book.publishedYear || 'N/A'}</span>
                  <span>⭐ ${book.rating || '4.5'}</span>
                  <span class="truncate max-w-[100px] text-right">${book.shelfLocation || 'Main'}</span>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
              ${isStudent ? (
                isAvailable ? `
                  <button class="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-smooth shadow-sm" onclick="window.uiRenderer.studentBorrowBook('${book.id}')">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    Borrow
                  </button>
                ` : `
                  <button class="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-smooth shadow-sm" onclick="window.uiRenderer.studentReserveBook('${book.id}')">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Hold / Reserve
                  </button>
                `
              ) : (
                isAvailable ? `
                  <button class="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-smooth" onclick="window.uiRenderer.openCheckoutModalForBook('${book.id}')">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Issue
                  </button>
                ` : `
                  <button class="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-smooth" onclick="window.uiRenderer.openReservationModal('${book.id}')">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Reserve
                  </button>
                `
              )}
              <button class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-smooth" title="Book Details" onclick="window.uiRenderer.openBookDetailsModal('${book.id}')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
              ${isAdmin ? `
                <button class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-smooth" title="Edit Book" onclick="window.uiRenderer.openEditBookModal('${book.id}')">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    } else {
      // Table view
      container.className = "w-full overflow-x-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm";
      container.innerHTML = `
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="py-3.5 px-4">Title & Author</th>
              <th class="py-3.5 px-4">Category</th>
              <th class="py-3.5 px-4">ISBN</th>
              <th class="py-3.5 px-4">Location</th>
              <th class="py-3.5 px-4">Stock</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            ${filtered.map(book => {
              const isAvailable = book.availableCopies > 0;
              return `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td class="py-3.5 px-4">
                    <div class="font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600" onclick="window.uiRenderer.openBookDetailsModal('${book.id}')">
                      ${book.title}
                    </div>
                    <div class="text-xs text-slate-400">${book.author} &bull; ${book.publishedYear || 'N/A'}</div>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="badge badge-info text-xs">${book.category}</span>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">${book.isbn}</td>
                  <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">${book.shelfLocation || 'Main'}</td>
                  <td class="py-3.5 px-4">
                    <span class="badge ${isAvailable ? 'badge-success' : 'badge-danger'}">
                      ${book.availableCopies} / ${book.totalCopies}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      ${isStudent ? (
                        isAvailable ? `
                          <button class="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onclick="window.uiRenderer.studentBorrowBook('${book.id}')">
                            Borrow
                          </button>
                        ` : `
                          <button class="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-600 text-white shadow-sm" onclick="window.uiRenderer.studentReserveBook('${book.id}')">
                            Reserve
                          </button>
                        `
                      ) : (
                        isAvailable ? `
                          <button class="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white" onclick="window.uiRenderer.openCheckoutModalForBook('${book.id}')">
                            Issue
                          </button>
                        ` : `
                          <button class="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-600 text-white" onclick="window.uiRenderer.openReservationModal('${book.id}')">
                            Reserve
                          </button>
                        `
                      )}
                      ${isAdmin ? `
                        <button class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white" onclick="window.uiRenderer.openEditBookModal('${book.id}')">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }

  // Reset book filters
  resetBookFilters() {
    this.bookSearchQuery = '';
    this.bookCategoryFilter = 'ALL';
    this.bookAvailabilityFilter = 'ALL';
    this.bookSortBy = 'popularity';

    const searchInput = document.getElementById('bookSearchInput');
    if (searchInput) searchInput.value = '';
    const catSelect = document.getElementById('bookCategorySelect');
    if (catSelect) catSelect.value = 'ALL';
    const availSelect = document.getElementById('bookAvailabilitySelect');
    if (availSelect) availSelect.value = 'ALL';
    const sortSelect = document.getElementById('bookSortSelect');
    if (sortSelect) sortSelect.value = 'popularity';

    this.renderBooks();
  }

  // Render Members View
  renderMembers() {
    const members = window.storageService.getMembers();
    const loans = window.storageService.getLoans();

    let filtered = members.filter(m => {
      const q = this.memberSearchQuery.toLowerCase();
      const matchesSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        m.id.toLowerCase().includes(q);

      const matchesType = this.memberTypeFilter === 'ALL' || m.membershipType === this.memberTypeFilter;
      const matchesStatus = this.memberStatusFilter === 'ALL' || m.status === this.memberStatusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });

    const countEl = document.getElementById('membersCountLabel');
    if (countEl) countEl.textContent = `Showing ${filtered.length} of ${members.length} patrons`;

    const container = document.getElementById('membersContainer');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p class="text-sm text-slate-500">No patrons found matching the filter criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${filtered.map(member => {
          const activeLoans = loans.filter(l => l.memberId === member.id && (l.status === 'Active' || l.status === 'Overdue'));
          const hasOverdue = activeLoans.some(l => l.status === 'Overdue');
          const isAtLimit = activeLoans.length >= member.maxBorrowLimit;

          return `
            <div class="bg-white dark:bg-slate-800 border ${hasOverdue ? 'border-rose-200 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-700/80'} rounded-2xl p-5 shadow-sm hover:shadow transition-smooth flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-3 mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl text-white font-bold flex items-center justify-center text-lg flex-shrink-0 shadow-sm" style="background-color: ${member.avatarColor || '#6366f1'}">
                      ${member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h3 class="font-bold text-slate-900 dark:text-white hover:text-indigo-600 cursor-pointer text-base" onclick="window.uiRenderer.openMemberProfileModal('${member.id}')">
                        ${member.name}
                      </h3>
                      <p class="text-xs font-mono text-slate-400">${member.id}</p>
                    </div>
                  </div>
                  <span class="badge ${member.status === 'Active' ? 'badge-success' : 'badge-danger'}">
                    ${member.status}
                  </span>
                </div>

                <div class="space-y-2 text-xs text-slate-600 dark:text-slate-300 py-2 border-t border-b border-slate-100 dark:border-slate-700/60">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Patron Type</span>
                    <span class="font-semibold text-slate-700 dark:text-slate-200">${member.membershipType}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Email</span>
                    <span class="truncate max-w-[180px] font-mono text-[11px]">${member.email}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Borrow Limit</span>
                    <span class="font-semibold ${isAtLimit ? 'text-amber-600 font-bold' : ''}">${activeLoans.length} of ${member.maxBorrowLimit} books checked out</span>
                  </div>
                  ${hasOverdue ? `
                    <div class="flex justify-between text-rose-600 font-semibold">
                      <span>Notice</span>
                      <span>Has Overdue Loans!</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="mt-4 pt-2 flex items-center gap-2">
                <button class="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-smooth" onclick="window.uiRenderer.openCheckoutModalForMember('${member.id}')">
                  Issue Book
                </button>
                <button class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-smooth" onclick="window.uiRenderer.openMemberProfileModal('${member.id}')">
                  Profile
                </button>
                <button class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-smooth" title="Edit Member" onclick="window.uiRenderer.openEditMemberModal('${member.id}')">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Render Circulation Desk (Loans & Returns)
  renderCirculation() {
    window.libraryEngine.refreshCirculationState();
    const loans = window.storageService.getLoans();

    let filtered = loans.filter(l => {
      if (this.circulationFilter === 'ACTIVE') return l.status === 'Active' || l.status === 'Overdue';
      if (this.circulationFilter === 'OVERDUE') return l.status === 'Overdue';
      if (this.circulationFilter === 'RETURNED') return l.status === 'Returned';
      return true;
    });

    if (this.circulationSearchQuery) {
      const q = this.circulationSearchQuery.toLowerCase();
      filtered = filtered.filter(l => {
        const book = window.storageService.getBook(l.bookId);
        const member = window.storageService.getMember(l.memberId);
        return (
          l.id.toLowerCase().includes(q) ||
          (book && book.title.toLowerCase().includes(q)) ||
          (member && member.name.toLowerCase().includes(q)) ||
          (member && member.id.toLowerCase().includes(q))
        );
      });
    }

    const container = document.getElementById('circulationTableBody');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-400">
            No loan records found for this view.
          </td>
        </tr>
      `;
      return;
    }

    const today = window.libraryEngine.formatDate(new Date());

    container.innerHTML = filtered.map(loan => {
      const book = window.storageService.getBook(loan.bookId) || { title: 'Unknown Title', isbn: 'N/A' };
      const member = window.storageService.getMember(loan.memberId) || { name: 'Unknown Patron', email: '' };
      const isOverdue = loan.status === 'Overdue';
      const isReturned = loan.status === 'Returned';

      return `
        <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
          <td class="py-3 px-4 font-mono text-xs font-semibold text-slate-500">${loan.id}</td>
          <td class="py-3 px-4">
            <div class="font-semibold text-slate-900 dark:text-white line-clamp-1">${book.title}</div>
            <div class="text-xs font-mono text-slate-400">${book.isbn}</div>
          </td>
          <td class="py-3 px-4">
            <div class="font-medium text-slate-800 dark:text-slate-200">${member.name}</div>
            <div class="text-xs text-slate-400">${member.id}</div>
          </td>
          <td class="py-3 px-4 text-xs font-mono">
            <div>Issued: ${loan.issueDate}</div>
            <div class="${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}">Due: ${loan.dueDate}</div>
          </td>
          <td class="py-3 px-4">
            ${isReturned ? `
              <span class="badge badge-info">Returned</span>
              <div class="text-[10px] text-slate-400 mt-0.5">on ${loan.returnDate}</div>
            ` : isOverdue ? `
              <span class="badge badge-danger">Overdue</span>
              <div class="text-[10px] text-rose-600 font-bold mt-0.5">₹${(loan.fineAmount || 0).toFixed(2)} fine</div>
            ` : `
              <span class="badge badge-success">Active</span>
              <div class="text-[10px] text-slate-400 mt-0.5">${loan.renewalCount || 0} renewals</div>
            `}
          </td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              ${!isReturned ? `
                <button class="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-smooth" onclick="window.uiRenderer.openReturnModal('${loan.id}')">
                  Return
                </button>
                <button class="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-smooth" title="Extend by 14 days" onclick="window.uiRenderer.handleRenewLoan('${loan.id}')">
                  Renew
                </button>
              ` : ''}
              <button class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-smooth" title="Print Slip" onclick="window.uiRenderer.printReceipt('${loan.id}')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Reservations View
  renderReservations() {
    const reservations = window.storageService.getReservations();
    const container = document.getElementById('reservationsContainer');
    if (!container) return;

    if (reservations.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p class="text-sm text-slate-500">No active book reservations or hold requests in queue.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="py-3 px-4">Hold ID</th>
              <th class="py-3 px-4">Book</th>
              <th class="py-3 px-4">Requested By</th>
              <th class="py-3 px-4">Request Date</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            ${reservations.map(res => {
              const book = window.storageService.getBook(res.bookId) || { title: 'Unknown Title' };
              const member = window.storageService.getMember(res.memberId) || { name: 'Unknown Patron' };
              const isReady = res.status === 'Ready for Pickup';

              return `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td class="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">${res.id}</td>
                  <td class="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">${book.title}</td>
                  <td class="py-3.5 px-4 text-slate-700 dark:text-slate-300">${member.name}</td>
                  <td class="py-3.5 px-4 text-xs font-mono text-slate-500">${res.reservedDate}</td>
                  <td class="py-3.5 px-4">
                    <span class="badge ${isReady ? 'badge-success' : 'badge-purple'}">
                      ${res.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      ${isReady ? `
                        <button class="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white" onclick="window.uiRenderer.fulfillReservation('${res.id}')">
                          Issue to Patron
                        </button>
                      ` : ''}
                      <button class="px-2.5 py-1 text-xs font-semibold rounded border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50" onclick="window.uiRenderer.cancelReservation('${res.id}')">
                        Cancel Hold
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Fulfill reservation helper
  fulfillReservation(resId) {
    const res = window.storageService.getReservations().find(r => r.id === resId);
    if (!res) return;
    try {
      window.libraryEngine.issueBook(res.bookId, res.memberId);
      this.toast(`Reserved copy successfully issued!`, 'success');
      this.renderReservations();
      this.renderDashboard();
    } catch (err) {
      this.toast(err.message, 'error');
    }
  }

  // Cancel reservation helper
  cancelReservation(resId) {
    if (confirm("Are you sure you want to cancel this hold reservation?")) {
      window.storageService.deleteReservation(resId);
      this.toast("Reservation removed from queue.", 'info');
      this.renderReservations();
      this.renderDashboard();
    }
  }

  // Handle Quick Renew
  handleRenewLoan(loanId) {
    try {
      const updated = window.libraryEngine.renewLoan(loanId);
      this.toast(`Loan renewed successfully! New due date: ${updated.dueDate}`, 'success');
      this.renderCirculation();
      this.renderDashboard();
    } catch (err) {
      this.toast(err.message, 'warning');
    }
  }

  // Modal Open/Close System
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('overflow-hidden');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('overflow-hidden');
    }
  }

  // Checkout Modal
  openCheckoutModal(preselectedBookId = null, preselectedMemberId = null) {
    const user = window.authManager.getCurrentUser();
    if (user && user.role === 'STUDENT') {
      this.toast("Access Restricted: Students cannot use the staff manual checkout desk. Use 'Borrow for Myself' in the Book Catalog instead.", "warning");
      return;
    }

    const books = window.storageService.getBooks().filter(b => b.availableCopies > 0);
    const members = window.storageService.getMembers().filter(m => m.status === 'Active');

    const bookSelect = document.getElementById('checkoutBookSelect');
    const memberSelect = document.getElementById('checkoutMemberSelect');

    if (bookSelect) {
      bookSelect.innerHTML = `<option value="">-- Choose an Available Title --</option>` +
        books.map(b => `<option value="${b.id}" ${b.id === preselectedBookId ? 'selected' : ''}>${b.title} (${b.availableCopies} avail)</option>`).join('');
    }

    if (memberSelect) {
      memberSelect.innerHTML = `<option value="">-- Choose an Active Patron --</option>` +
        members.map(m => `<option value="${m.id}" ${m.id === preselectedMemberId ? 'selected' : ''}>${m.name} (${m.id} - ${m.membershipType})</option>`).join('');
    }

    const durationInput = document.getElementById('checkoutDurationInput');
    if (durationInput) {
      durationInput.value = window.storageService.getSettings().loanDurationDays || 14;
    }

    this.openModal('modalCheckout');
  }

  openCheckoutModalForBook(bookId) {
    this.openCheckoutModal(bookId, null);
  }

  openCheckoutModalForMember(memberId) {
    this.openCheckoutModal(null, memberId);
  }

  // Return Modal
  openReturnModal(loanId) {
    const user = window.authManager.getCurrentUser();
    if (user && user.role === 'STUDENT') {
      this.toast("Access Restricted: Please return books from 'My Student Portal'.", "warning");
      return;
    }

    window.libraryEngine.refreshCirculationState();
    const loan = window.storageService.getLoan(loanId);
    if (!loan) return;

    const book = window.storageService.getBook(loan.bookId) || { title: 'Unknown' };
    const member = window.storageService.getMember(loan.memberId) || { name: 'Unknown' };

    document.getElementById('returnLoanIdInput').value = loan.id;
    document.getElementById('returnBookTitle').textContent = book.title;
    document.getElementById('returnMemberName').textContent = member.name;
    document.getElementById('returnDueDate').textContent = loan.dueDate;

    const fineContainer = document.getElementById('returnFineSection');
    const fineAmountEl = document.getElementById('returnFineAmount');
    if (loan.fineAmount > 0) {
      fineContainer.classList.remove('hidden');
      fineAmountEl.textContent = `₹${loan.fineAmount.toFixed(2)}`;
    } else {
      fineContainer.classList.add('hidden');
    }

    this.openModal('modalReturn');
  }

  // Reservation Modal
  openReservationModal(bookId) {
    const book = window.storageService.getBook(bookId);
    if (!book) return;

    const members = window.storageService.getMembers().filter(m => m.status === 'Active');
    document.getElementById('reserveBookIdInput').value = book.id;
    document.getElementById('reserveBookTitle').textContent = book.title;

    const memberSelect = document.getElementById('reserveMemberSelect');
    if (memberSelect) {
      memberSelect.innerHTML = `<option value="">-- Select Member to Place Hold --</option>` +
        members.map(m => `<option value="${m.id}">${m.name} (${m.id})</option>`).join('');
    }

    this.openModal('modalReservation');
  }

  // Book Details Modal
  openBookDetailsModal(bookId) {
    const book = window.storageService.getBook(bookId);
    if (!book) return;

    const loans = window.storageService.getLoans().filter(l => l.bookId === book.id);
    const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
    const reservations = window.storageService.getReservations().filter(r => r.bookId === book.id);

    const modalBody = document.getElementById('bookDetailsModalBody');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6">
          <div class="w-full md:w-48 flex-shrink-0">
            <div class="w-full h-64 rounded-xl shadow-md overflow-hidden relative flex items-end p-3" style="background: ${book.coverGradient || 'linear-gradient(135deg, #1e293b, #334155)'}">
              ${book.coverUrl ? `<img src="${book.coverUrl}" alt="${book.title}" class="absolute inset-0 w-full h-full object-cover">` : ''}
              <div class="relative z-10 w-full backdrop-blur-md bg-slate-900/60 p-2 rounded text-white text-xs font-bold truncate">
                ${book.title}
              </div>
            </div>
            <div class="mt-3 text-center">
              <span class="badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'} text-xs font-bold">
                ${book.availableCopies > 0 ? `${book.availableCopies} Available on Shelf` : 'All Copies Borrowed'}
              </span>
            </div>
          </div>

          <div class="flex-1 space-y-4">
            <div>
              <span class="badge badge-info text-xs mb-1.5">${book.category}</span>
              <h2 class="text-xl font-bold text-slate-900 dark:text-white">${book.title}</h2>
              <p class="text-sm text-slate-500 font-medium">By ${book.author} &bull; Published ${book.publishedYear || 'N/A'}</p>
            </div>

            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
              ${book.description || 'No description entered for this title.'}
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div class="bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <span class="text-slate-400 block mb-0.5">ISBN</span>
                <span class="font-mono font-semibold">${book.isbn}</span>
              </div>
              <div class="bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <span class="text-slate-400 block mb-0.5">Rack Location</span>
                <span class="font-semibold">${book.shelfLocation || 'Main Wing'}</span>
              </div>
              <div class="bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <span class="text-slate-400 block mb-0.5">Lifetime Borrows</span>
                <span class="font-semibold">${book.borrowCount || 0} times</span>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-700">
              ${window.authManager.isStudent() ? `
                <div class="p-3.5 rounded-xl ${book.availableCopies > 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800'} flex items-center justify-between">
                  <div>
                    <span class="text-xs font-bold ${book.availableCopies > 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}">
                      ${book.availableCopies > 0 ? `✅ ${book.availableCopies} copy(s) available on shelf` : '⏳ All copies currently checked out'}
                    </span>
                    <p class="text-[11px] text-slate-500 mt-0.5">Campus borrowing policy: 14 days per loan</p>
                  </div>
                  ${book.availableCopies > 0 ? `
                    <button onclick="window.uiRenderer.closeModal('modalBookDetails'); window.uiRenderer.studentBorrowBook('${book.id}');" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-smooth flex items-center gap-1">
                      📖 Borrow for Myself
                    </button>
                  ` : `
                    <button onclick="window.uiRenderer.closeModal('modalBookDetails'); window.uiRenderer.studentReserveBook('${book.id}');" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-smooth flex items-center gap-1">
                      📌 Place Hold
                    </button>
                  `}
                </div>
              ` : `
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Active Borrowers (${activeLoans.length})</h4>
                ${activeLoans.length === 0 ? `
                  <p class="text-xs text-slate-400 italic">No copies are currently checked out.</p>
                ` : `
                  <div class="space-y-1.5 max-h-32 overflow-y-auto">
                    ${activeLoans.map(l => {
                      const m = window.storageService.getMember(l.memberId);
                      return `
                        <div class="flex items-center justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-700/30">
                          <span class="font-semibold text-slate-700 dark:text-slate-200">${m ? m.name : 'Unknown'}</span>
                          <span class="${l.status === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-400'}">Due: ${l.dueDate}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              `}
            </div>
          </div>
        </div>
      `;
    }

    this.openModal('modalBookDetails');
  }

  // Member Profile Modal
  openMemberProfileModal(memberId) {
    const member = window.storageService.getMember(memberId);
    if (!member) return;

    const allLoans = window.storageService.getLoans().filter(l => l.memberId === member.id);
    const activeLoans = allLoans.filter(l => l.status === 'Active' || l.status === 'Overdue');
    const pastLoans = allLoans.filter(l => l.status === 'Returned');

    const modalBody = document.getElementById('memberProfileModalBody');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="flex items-start gap-4 mb-6">
          <div class="w-16 h-16 rounded-2xl text-white font-bold flex items-center justify-center text-2xl flex-shrink-0 shadow" style="background-color: ${member.avatarColor || '#6366f1'}">
            ${member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">${member.name}</h3>
              <span class="badge ${member.status === 'Active' ? 'badge-success' : 'badge-danger'}">${member.status}</span>
            </div>
            <p class="text-xs font-mono text-slate-400 mt-0.5">ID: ${member.id} &bull; Member since ${member.joinedDate}</p>
            <div class="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
              <span>📧 ${member.email}</span>
              <span>📞 ${member.phone || 'N/A'}</span>
              <span>🎓 Type: <strong>${member.membershipType}</strong></span>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Active Loans (${activeLoans.length} of max ${member.maxBorrowLimit})
            </h4>
            ${activeLoans.length === 0 ? `
              <p class="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">No active loans outstanding.</p>
            ` : `
              <div class="space-y-2">
                ${activeLoans.map(l => {
                  const b = window.storageService.getBook(l.bookId) || { title: 'Unknown' };
                  return `
                    <div class="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div class="font-semibold text-slate-800 dark:text-white">${b.title}</div>
                        <div class="text-[11px] text-slate-400">Issued: ${l.issueDate} &bull; <span class="${l.status === 'Overdue' ? 'text-rose-600 font-bold' : ''}">Due: ${l.dueDate}</span></div>
                      </div>
                      <button class="px-2.5 py-1 rounded bg-indigo-600 text-white font-semibold text-xs" onclick="window.uiRenderer.closeModal('modalMemberProfile'); window.uiRenderer.openReturnModal('${l.id}')">
                        Return
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Borrowing History (${pastLoans.length} past returns)
            </h4>
            <div class="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-700/60">
              ${pastLoans.length === 0 ? `
                <p class="text-xs text-slate-400 italic">No past returns recorded yet.</p>
              ` : pastLoans.map(l => {
                const b = window.storageService.getBook(l.bookId) || { title: 'Unknown' };
                return `
                  <div class="pt-2 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span class="truncate max-w-[240px]">${b.title}</span>
                    <span class="text-slate-400 text-[11px]">Returned ${l.returnDate}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }

    this.openModal('modalMemberProfile');
  }

  // Add / Edit Book Modal
  openAddBookModal() {
    if (!window.authManager.isAdmin()) {
      this.toast("Access Restricted: Only Administrators are permitted to add new titles to the catalog.", "warning");
      return;
    }
    document.getElementById('bookFormTitle').textContent = 'Add New Book';
    document.getElementById('bookFormId').value = '';
    document.getElementById('bookFormTitleInput').value = '';
    document.getElementById('bookFormAuthorInput').value = '';
    document.getElementById('bookFormIsbnInput').value = '';
    document.getElementById('bookFormCategorySelect').value = 'Computer Science';
    document.getElementById('bookFormYearInput').value = new Date().getFullYear();
    document.getElementById('bookFormCopiesInput').value = '3';
    document.getElementById('bookFormShelfInput').value = 'Main Wing';
    document.getElementById('bookFormDescInput').value = '';
    document.getElementById('bookFormCoverInput').value = '';

    this.openModal('modalBookForm');
  }

  openEditBookModal(bookId) {
    if (!window.authManager.isAdmin()) {
      this.toast("Access Restricted: Only Administrators are permitted to edit book details.", "warning");
      return;
    }
    const book = window.storageService.getBook(bookId);
    if (!book) return;

    document.getElementById('bookFormTitle').textContent = 'Edit Book Details';
    document.getElementById('bookFormId').value = book.id;
    document.getElementById('bookFormTitleInput').value = book.title;
    document.getElementById('bookFormAuthorInput').value = book.author;
    document.getElementById('bookFormIsbnInput').value = book.isbn;
    document.getElementById('bookFormCategorySelect').value = book.category;
    document.getElementById('bookFormYearInput').value = book.publishedYear || '';
    document.getElementById('bookFormCopiesInput').value = book.totalCopies;
    document.getElementById('bookFormShelfInput').value = book.shelfLocation || '';
    document.getElementById('bookFormDescInput').value = book.description || '';
    document.getElementById('bookFormCoverInput').value = book.coverUrl || '';

    this.openModal('modalBookForm');
  }

  // Add / Edit Member Modal
  openAddMemberModal() {
    document.getElementById('memberFormTitle').textContent = 'Add New Patron';
    document.getElementById('memberFormId').value = '';
    document.getElementById('memberFormNameInput').value = '';
    document.getElementById('memberFormEmailInput').value = '';
    document.getElementById('memberFormPhoneInput').value = '';
    document.getElementById('memberFormTypeSelect').value = 'Student';
    document.getElementById('memberFormLimitInput').value = '5';
    document.getElementById('memberFormStatusSelect').value = 'Active';

    this.openModal('modalMemberForm');
  }

  // Student Self-Registration Modal
  openStudentSelfRegisterModal() {
    const nameEl = document.getElementById('selfRegName');
    const emailEl = document.getElementById('selfRegEmail');
    const majorEl = document.getElementById('selfRegMajor');
    const yearEl = document.getElementById('selfRegYear');
    const userEl = document.getElementById('selfRegUsername');
    const passEl = document.getElementById('selfRegPassword');

    if (nameEl) nameEl.value = '';
    if (emailEl) emailEl.value = '';
    if (majorEl) majorEl.value = 'Computer Science';
    if (yearEl) yearEl.value = '1';
    if (userEl) userEl.value = '';
    if (passEl) passEl.value = 'student123';

    this.openModal('modalStudentSelfRegister');
  }

  openEditMemberModal(memberId) {
    const member = window.storageService.getMember(memberId);
    if (!member) return;

    document.getElementById('memberFormTitle').textContent = 'Edit Patron Info';
    document.getElementById('memberFormId').value = member.id;
    document.getElementById('memberFormNameInput').value = member.name;
    document.getElementById('memberFormEmailInput').value = member.email;
    document.getElementById('memberFormPhoneInput').value = member.phone || '';
    document.getElementById('memberFormTypeSelect').value = member.membershipType;
    document.getElementById('memberFormLimitInput').value = member.maxBorrowLimit || 5;
    document.getElementById('memberFormStatusSelect').value = member.status || 'Active';

    this.openModal('modalMemberForm');
  }

  // Print Loan Slip / Receipt
  // User & RBAC UI Management
  updateUserUI() {
    const user = window.authManager.getCurrentUser();
    if (!user) return;

    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userFullName');
    const badgeEl = document.getElementById('userRoleBadge');

    if (avatarEl) {
      avatarEl.textContent = user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2);
      avatarEl.style.backgroundColor = user.avatarColor || '#4f46e5';
    }
    if (nameEl) nameEl.textContent = user.fullName;
    if (badgeEl) {
      badgeEl.textContent = user.role;
      badgeEl.className = `text-[10px] font-bold uppercase leading-none mt-1 px-1.5 py-0.5 rounded ${
        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300' :
        user.role === 'STAFF' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' :
        'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
      }`;
    }

    // Role-based element visibility
    const isStudent = user.role === 'STUDENT';
    const isStaff = user.role === 'STAFF';
    const isAdmin = user.role === 'ADMIN';

    // Toggle admin/staff controls
    document.querySelectorAll('.admin-staff-only').forEach(el => {
      if (isStudent) el.classList.add('hidden');
      else el.classList.remove('hidden');
    });

    document.querySelectorAll('.admin-only').forEach(el => {
      if (isAdmin) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    // Toggle Student Portal nav link
    const studentNav = document.getElementById('navStudentPortal');
    const generalNav = document.getElementById('navDashboard');
    if (studentNav) {
      if (isStudent) {
        studentNav.classList.remove('hidden');
        studentNav.classList.add('flex');
      } else {
        studentNav.classList.add('hidden');
        studentNav.classList.remove('flex');
      }
    }

    // Default route adjustment based on role
    if (isStudent && (this.currentView === 'dashboard' || this.currentView === 'members' || this.currentView === 'circulation')) {
      this.switchView('student-portal');
    } else if (!isStudent && this.currentView === 'student-portal') {
      this.switchView('dashboard');
    }
  }

  renderStudentPortal() {
    const user = window.authManager.getCurrentUser();
    const container = document.getElementById('studentPortalContent');
    if (!container || !user) return;

    let memberId = user.linkedMemberId;
    if (!memberId) {
      const match = window.storageService.getMembers().find(m => 
        (m.id && m.id.toLowerCase() === user.username.toLowerCase()) ||
        (m.email && m.email.toLowerCase() === user.username.toLowerCase())
      );
      memberId = match ? match.id : user.username;
    }
    const member = window.storageService.getMember(memberId) || {
      name: user.fullName, id: memberId, membershipType: 'Student', maxBorrowLimit: 5, status: 'Active'
    };

    const allLoans = window.storageService.getLoans();
    // Strictly only loans belonging to this authenticated student
    const studentLoans = allLoans.filter(l => l.memberId && l.memberId.toLowerCase() === memberId.toLowerCase() && (l.status === 'Active' || l.status === 'Overdue'));
    const overdueLoans = studentLoans.filter(l => l.status === 'Overdue');
    const totalFines = overdueLoans.reduce((sum, l) => sum + (l.fineAmount || 0), 0);

    const reservations = window.storageService.getReservations().filter(r => r.memberId && r.memberId.toLowerCase() === memberId.toLowerCase());

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Student Header Card -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-2xl border border-white/20">
                ${user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div>
                <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/25 tracking-wider mb-1">Student Portal</span>
                <h2 class="text-xl font-bold">${user.fullName}</h2>
                <p class="text-xs text-blue-100 font-mono mt-0.5">Patron ID: ${member.id} &bull; ${member.major || 'Computer Science'} &bull; Year ${member.academicYear || 1}</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button onclick="window.uiRenderer.switchView('books')" class="px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-blue-50 transition-smooth shadow-sm flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                Browse Catalog
              </button>
            </div>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Borrow Quota</span>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900 dark:text-white">${studentLoans.length}</span>
              <span class="text-xs text-slate-500">of max ${member.maxBorrowLimit || 5} books checked out</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
              <div class="h-full bg-indigo-600 rounded-full" style="width: ${(studentLoans.length / (member.maxBorrowLimit || 5)) * 100}%"></div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border ${totalFines > 0 ? 'border-rose-200 dark:border-rose-900 bg-rose-50/20' : 'border-slate-200 dark:border-slate-700'} shadow-sm">
            <span class="text-xs font-semibold ${totalFines > 0 ? 'text-rose-600' : 'text-slate-400'} uppercase tracking-wider block mb-1">Overdue Fines</span>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold ${totalFines > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}">₹${totalFines.toFixed(2)}</span>
              <span class="text-xs text-slate-500">${overdueLoans.length > 0 ? `${overdueLoans.length} overdue items` : 'All clear! No fines'}</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-2">${totalFines > 0 ? 'Please return book and settle fees with librarian.' : 'Standard 14-day loan period applies.'}</p>
          </div>

          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Active Holds</span>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900 dark:text-white">${reservations.length}</span>
              <span class="text-xs text-slate-500">titles on reservation</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-2">You will be notified once reserved copies arrive at the desk.</p>
          </div>
        </div>

        <!-- My Borrowed Books Section -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Books Currently in Your Possession</h3>
            <span class="text-xs text-slate-400 font-mono">${studentLoans.length} books</span>
          </div>

          <div class="divide-y divide-slate-100 dark:divide-slate-700/60">
            ${studentLoans.length === 0 ? `
              <div class="p-8 text-center text-slate-400">
                <svg class="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                <p class="text-sm font-medium">You do not have any books checked out right now.</p>
                <button onclick="window.uiRenderer.switchView('books')" class="mt-3 px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100">Browse Catalog</button>
              </div>
            ` : studentLoans.map(loan => {
              const book = window.storageService.getBook(loan.bookId) || { title: 'Unknown Title', author: 'Unknown', shelfLocation: 'Main' };
              const isOverdue = loan.status === 'Overdue';
              return `
                <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      📖
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-slate-900 dark:text-white">${book.title}</h4>
                      <p class="text-xs text-slate-400">${book.author} &bull; Shelf: ${book.shelfLocation}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="text-right text-xs font-mono">
                      <div class="text-slate-400 text-[10px]">Issued: ${loan.issueDate}</div>
                      <div class="${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-200'}">Due: ${loan.dueDate}</div>
                      <span class="badge ${isOverdue ? 'badge-danger' : 'badge-success'} text-[10px] mt-0.5 inline-block">${isOverdue ? 'Overdue' : 'Active'}</span>
                    </div>

                    <div class="flex items-center gap-1.5 ml-2">
                      <button onclick="window.uiRenderer.studentReturnBook('${loan.id}')" class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-smooth flex items-center gap-1 shadow-sm" title="Return this book">
                        ↩️ Return
                      </button>
                      <button onclick="window.uiRenderer.studentRenewBook('${loan.id}')" class="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-600 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-smooth flex items-center gap-1 border border-indigo-200 dark:border-slate-600" title="Renew for 14 more days">
                        🔄 Renew (${loan.renewalCount || 0}/2)
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Student Self-Service: Borrow for Myself
  studentBorrowBook(bookId) {
    const user = window.authManager.getCurrentUser();
    if (!user) {
      this.toast("Please sign in first.", "warning");
      return;
    }

    let memberId = user.linkedMemberId;
    if (!memberId) {
      const match = window.storageService.getMembers().find(m => 
        (m.id && m.id.toLowerCase() === user.username.toLowerCase()) ||
        (m.email && m.email.toLowerCase() === user.username.toLowerCase())
      );
      memberId = match ? match.id : user.username;
    }

    const book = window.storageService.getBook(bookId);
    if (!book) {
      this.toast("Book not found.", "error");
      return;
    }

    if (book.availableCopies <= 0) {
      this.toast(`"${book.title}" is currently out of stock. Please place a Hold reservation instead.`, "warning");
      return;
    }

    try {
      const loan = window.libraryEngine.issueBook(bookId, memberId, 14);
      this.toast(`🎉 You borrowed "${book.title}"! Due date: ${loan.dueDate}. View it in My Student Portal.`, "success");
      this.renderBooks();
      if (this.currentView === 'student-portal') this.renderStudentPortal();
    } catch (err) {
      this.toast(err.message, "error");
    }
  }

  // Student Self-Service: Place Hold / Reserve
  studentReserveBook(bookId) {
    const user = window.authManager.getCurrentUser();
    if (!user) {
      this.toast("Please sign in first.", "warning");
      return;
    }

    let memberId = user.linkedMemberId;
    if (!memberId) {
      const match = window.storageService.getMembers().find(m => 
        (m.id && m.id.toLowerCase() === user.username.toLowerCase()) ||
        (m.email && m.email.toLowerCase() === user.username.toLowerCase())
      );
      memberId = match ? match.id : user.username;
    }

    const book = window.storageService.getBook(bookId);
    if (!book) return;

    try {
      window.libraryEngine.placeReservation(bookId, memberId, "Student Portal Self-Hold");
      this.toast(`📌 Reserved "${book.title}". You will be notified when a copy arrives!`, "success");
      this.renderBooks();
      if (this.currentView === 'student-portal') this.renderStudentPortal();
    } catch (err) {
      this.toast(err.message, "error");
    }
  }

  // Student Self-Service: Return My Own Book
  studentReturnBook(loanId) {
    const user = window.authManager.getCurrentUser();
    if (!user) return;

    const loan = window.storageService.getLoan(loanId);
    if (!loan) {
      this.toast("Loan record not found.", "error");
      return;
    }

    let myMemberId = user.linkedMemberId;
    if (!myMemberId) {
      const match = window.storageService.getMembers().find(m => 
        (m.id && m.id.toLowerCase() === user.username.toLowerCase())
      );
      myMemberId = match ? match.id : user.username;
    }

    // Strict Security Guard: Only the borrowing student can return their own book
    if (loan.memberId.toLowerCase() !== myMemberId.toLowerCase()) {
      this.toast("Security Violation: You can only return your own borrowed books!", "error");
      return;
    }

    const book = window.storageService.getBook(loan.bookId) || { title: 'Book' };
    if (confirm(`Return "${book.title}" to the library inventory now?`)) {
      try {
        window.libraryEngine.returnBook(loanId, false);
        this.toast(`✅ Successfully returned "${book.title}". Thank you!`, "success");
        this.renderStudentPortal();
        if (this.currentView === 'books') this.renderBooks();
      } catch (err) {
        this.toast(err.message, "error");
      }
    }
  }

  // Student Self-Service: Renew My Own Book
  studentRenewBook(loanId) {
    const user = window.authManager.getCurrentUser();
    if (!user) return;

    const loan = window.storageService.getLoan(loanId);
    if (!loan) {
      this.toast("Loan record not found.", "error");
      return;
    }

    let myMemberId = user.linkedMemberId;
    if (!myMemberId) {
      const match = window.storageService.getMembers().find(m => 
        (m.id && m.id.toLowerCase() === user.username.toLowerCase())
      );
      myMemberId = match ? match.id : user.username;
    }

    // Strict Security Guard: Only the borrowing student can renew their own book
    if (loan.memberId.toLowerCase() !== myMemberId.toLowerCase()) {
      this.toast("Security Violation: You can only renew your own borrowed books!", "error");
      return;
    }

    const book = window.storageService.getBook(loan.bookId) || { title: 'Book' };
    try {
      const updated = window.libraryEngine.renewLoan(loanId);
      this.toast(`📅 Renewed "${book.title}"! New due date: ${updated.dueDate} (Renewal #${updated.renewalCount}/2)`, "success");
      this.renderStudentPortal();
    } catch (err) {
      this.toast(err.message, "error");
    }
  }

  handleTopRightBadgeClick() {
    if (window.authManager && window.authManager.isStudent()) {
      this.switchView('student-portal');
      this.toast("Viewing your personal Student Portal & Quota.", "info");
      return;
    }
    this.openLoginModal();
  }

  openLoginModal() {
    this.openModal('modalLogin');
  }

  handleQuickLogin(role) {
    if (role === 'ADMIN' || role === 'STAFF') {
      this.toast("Security Restriction: 1-Click login for Admin and Staff is strictly disabled. Please enter your credentials below.", "error");
      return;
    }
    let username = 'student1';
    let pword = 'student123';
    if (role === 'STUDENT2') {
      username = 'student2';
    } else if (role === 'STUDENT3') {
      username = 'student3';
    }

    try {
      const user = window.authManager.login(username, pword);
      this.closeModal('modalLogin');
      this.transitionToDashboard(user);
    } catch (e) {
      this.toast(e.message, 'error');
    }
  }

  // Attendify-style Dedicated First Interface Login Handler
  initHeroLogin() {
    const roleTabs = [
      { id: 'tabRoleAdmin', role: 'ADMIN', defaultUser: 'admin', pword: 'admin123' },
      { id: 'tabRoleStaff', role: 'STAFF', defaultUser: 'staff', pword: 'staff123' },
      { id: 'tabRoleStudent', role: 'STUDENT', defaultUser: 'student1', pword: 'student123' }
    ];

    const updateTabs = (selectedRole) => {
      roleTabs.forEach(t => {
        const btn = document.getElementById(t.id);
        if (!btn) return;
        if (t.role === selectedRole) {
          btn.className = 'hero-role-tab flex-1 py-2 px-3 rounded-full text-center transition-all bg-blue-600 text-white shadow-md font-semibold';
          const emailInput = document.getElementById('heroLoginEmail');
          if (emailInput) {
            emailInput.value = t.defaultUser;
          }
          const pwordInput = document.getElementById('heroLoginPassword');
          if (pwordInput) {
            pwordInput.value = t.pword;
          }
        } else {
          btn.className = 'hero-role-tab flex-1 py-2 px-3 rounded-full text-center transition-all text-slate-400 hover:text-white font-medium';
        }
      });
    };

    roleTabs.forEach(t => {
      const btn = document.getElementById(t.id);
      if (btn) {
        btn.addEventListener('click', () => updateTabs(t.role));
      }
    });

    // Default to Admin tab initially
    updateTabs('ADMIN');

    // Toggle Password Visibility
    const togglePassBtn = document.getElementById('heroTogglePasswordBtn');
    const passInput = document.getElementById('heroLoginPassword');
    if (togglePassBtn && passInput) {
      togglePassBtn.addEventListener('click', () => {
        const isPassword = passInput.getAttribute('type') === 'password';
        passInput.setAttribute('type', isPassword ? 'text' : 'password');
        const eyeIcon = document.getElementById('heroEyeIcon');
        if (eyeIcon) {
          eyeIcon.innerHTML = isPassword
            ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>`
            : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>`;
        }
      });
    }

    // Forgot password hint
    const forgotBtn = document.getElementById('heroForgotPasswordBtn');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        alert("Demo System Account Credentials:\n\n• Administrator: admin / admin123\n• Staff / Faculty: staff / staff123\n• Students: student1, student2, student3 / student123");
      });
    }

    // Handle Form Submit
    const heroForm = document.getElementById('heroLoginForm');
    if (heroForm) {
      heroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawIdentifier = document.getElementById('heroLoginEmail').value.trim();
        const pword = document.getElementById('heroLoginPassword').value;

        try {
          const user = window.authManager.login(rawIdentifier, pword);
          this.transitionToDashboard(user);
        } catch (err) {
          this.toast(err.message, 'error');
        }
      });
    }

    this.renderHeroQuickLogins();
  }

  renderHeroQuickLogins() {
    const container = document.getElementById('heroQuickLogins');
    if (!container) return;

    const members = window.storageService.getMembers().filter(m => m.membershipType && m.membershipType.toLowerCase().includes('student'));

    let html = `
      <button type="button" onclick="window.uiRenderer.quickLoginFromHero('student1')" class="px-2.5 py-1 rounded-lg bg-[#242630] hover:bg-slate-700 text-amber-400 font-mono text-[11px] border border-slate-700 transition-all">🎓 Student 1</button>
      <button type="button" onclick="window.uiRenderer.quickLoginFromHero('student2')" class="px-2.5 py-1 rounded-lg bg-[#242630] hover:bg-slate-700 text-purple-400 font-mono text-[11px] border border-slate-700 transition-all">🎓 Student 2</button>
      <button type="button" onclick="window.uiRenderer.quickLoginFromHero('student3')" class="px-2.5 py-1 rounded-lg bg-[#242630] hover:bg-slate-700 text-cyan-400 font-mono text-[11px] border border-slate-700 transition-all">🎓 Student 3</button>
    `;

    // Add any custom enrolled students (e.g. STU-2024-006)
    const customStudents = members.filter(m => m.id && (m.id.startsWith('STU-') || m.id.startsWith('MEM-209') || m.id.startsWith('MEM-210')));
    customStudents.forEach(cs => {
      const shortName = cs.name.split(' ')[0];
      html += `
        <button type="button" onclick="window.uiRenderer.quickLoginFromHero('${cs.id}')" title="1-Click login as enrolled student: ${cs.name} (${cs.id})" class="px-2.5 py-1 rounded-lg bg-blue-950/70 hover:bg-blue-900 text-blue-300 font-mono text-[11px] border border-blue-500/60 shadow-sm transition-all flex items-center gap-1 font-semibold">🎓 ${shortName} (${cs.id})</button>
      `;
    });

    container.innerHTML = html;
  }

  quickLoginFromHero(username) {
    if (username === 'admin' || username === 'staff') {
      this.toast("Security Restriction: 1-Click login for Admin & Staff is disabled. Please enter your credentials in the form above.", "warning");
      return;
    }
    const user = window.storageService.getUserByUsername(username);
    let pword = 'admin123';
    if (user && user.password) {
      pword = user.password;
    } else if (username === 'staff') {
      pword = 'staff123';
    } else if (username.startsWith('student') || username.startsWith('STU') || username.startsWith('MEM')) {
      pword = 'student123';
    }

    try {
      const loggedUser = window.authManager.login(username, pword);
      this.transitionToDashboard(loggedUser);
    } catch (err) {
      this.toast(err.message, 'error');
    }
  }

  transitionToDashboard(user) {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainAppShell');

    if (loginScreen) {
      loginScreen.classList.add('transition-opacity', 'duration-300', 'opacity-0');
      setTimeout(() => {
        loginScreen.classList.add('hidden');
        loginScreen.classList.remove('opacity-0');
      }, 300);
    }

    if (mainApp) {
      mainApp.classList.remove('hidden');
    }

    this.updateUserUI();
    if (user.role === 'STUDENT') {
      this.switchView('student-portal');
    } else {
      this.switchView('dashboard');
    }

    this.toast(`Welcome back, ${user.fullName}! [${user.role}]`, 'success');
  }

  handleLogout() {
    window.authManager.logout();
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainAppShell');

    if (mainApp) mainApp.classList.add('hidden');
    if (loginScreen) {
      loginScreen.classList.remove('hidden');
      const pass = document.getElementById('heroLoginPassword');
      if (pass) pass.value = '';
    }

    this.closeModal('modalLogin');
    this.toast("You have logged out. Please sign in to continue.", "info");
  }

  printReceipt(loanId) {
    const loan = window.storageService.getLoan(loanId);
    if (!loan) return;

    const book = window.storageService.getBook(loan.bookId) || { title: 'Unknown', isbn: 'N/A' };
    const member = window.storageService.getMember(loan.memberId) || { name: 'Unknown', id: 'N/A' };
    const settings = window.storageService.getSettings();

    const receiptEl = document.getElementById('printableReceipt');
    if (!receiptEl) return;

    receiptEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h2 style="font-size: 16px; font-weight: bold; margin: 0;">${settings.libraryName.toUpperCase()}</h2>
        <p style="font-size: 11px; margin: 2px 0;">Official Circulation Desk Slip</p>
        <p style="font-size: 11px; margin: 0;">Date: ${new Date().toLocaleString()}</p>
      </div>
      <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 12px; font-size: 12px; line-height: 1.5;">
        <div><strong>Transaction ID:</strong> ${loan.id}</div>
        <div><strong>Status:</strong> ${loan.status.toUpperCase()}</div>
        <div><strong>Patron:</strong> ${member.name} (${member.id})</div>
        <div><strong>Title:</strong> ${book.title}</div>
        <div><strong>ISBN:</strong> ${book.isbn}</div>
        <div><strong>Issued:</strong> ${loan.issueDate}</div>
        <div><strong>Due Date:</strong> ${loan.dueDate}</div>
        ${loan.returnDate ? `<div><strong>Returned On:</strong> ${loan.returnDate}</div>` : ''}
        ${loan.fineAmount > 0 ? `<div><strong>Fine Assessed:</strong> ₹${loan.fineAmount.toFixed(2)} (${loan.finePaid ? 'PAID' : 'PENDING'})</div>` : ''}
      </div>
      <div style="font-size: 10px; text-align: center; color: #444;">
        Please return all borrowed materials by due date to avoid fines (₹${settings.dailyFineRate || 5.00}/day).
        <br><br>
        * * * Thank you for using Lumina Library * * *
      </div>
    `;

    window.print();
  }

  // ================= CLOUD SYNC UI CONTROLLERS =================

  openCloudSyncModal() {
    this.openModal('modalCloudSync');
    if (window.storageService) {
      const input = document.getElementById('cloudDbUrlInput');
      if (input && window.storageService.cloudDbUrl) {
        input.value = window.storageService.cloudDbUrl;
      }
      window.storageService.updateSyncUI();
    }
  }

  async saveCloudSyncUrl() {
    const input = document.getElementById('cloudDbUrlInput');
    const url = input ? input.value.trim() : '';
    if (!url) {
      this.toast("Please enter a Firebase Realtime Database URL.", "warning");
      return;
    }

    try {
      this.toast("Connecting to Cloud Database...", "info");
      await window.storageService.setCloudDbUrl(url);
      this.toast("Connected to Cloud Database! Real-time sync is now active.", "success");
      this.closeModal('modalCloudSync');
      this.refreshCurrentView();
    } catch (err) {
      this.toast("Connection failed: " + err.message, "error");
    }
  }

  disconnectCloudSync() {
    if (confirm("Disconnect from cloud database and switch back to local browser storage?")) {
      window.storageService.disconnectCloud();
      const input = document.getElementById('cloudDbUrlInput');
      if (input) input.value = '';
      this.toast("Switched to Local Browser Storage.", "info");
      this.closeModal('modalCloudSync');
    }
  }

  async syncCloudNow() {
    if (!window.storageService.cloudDbUrl) {
      this.toast("No cloud database connected. Enter your Firebase URL first.", "warning");
      return;
    }
    this.toast("Synchronizing data with Cloud...", "info");
    const data = await window.storageService.pullFromCloud();
    if (data) {
      this.toast("Sync complete! Latest catalog and patron records updated.", "success");
    } else {
      this.toast("Sync failed. Check your Firebase database connection.", "error");
    }
  }

  copyShareableCloudLink() {
    const link = window.storageService.getShareableLink();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        this.toast("🔗 Shareable link copied! Send it to any laptop or phone.", "success");
      }).catch(() => {
        prompt("Copy this link to connect other devices:", link);
      });
    } else {
      prompt("Copy this link to connect other devices:", link);
    }
  }

  refreshCurrentView() {
    try {
      window.libraryEngine.refreshCirculationState();
      if (this.currentView === 'dashboard') this.renderDashboard();
      else if (this.currentView === 'books') this.renderBooks();
      else if (this.currentView === 'members') this.renderMembers();
      else if (this.currentView === 'circulation') this.renderCirculation();
      else if (this.currentView === 'reservations') this.renderReservations();
      else if (this.currentView === 'student-portal') this.renderStudentPortal();
      if (typeof this.renderHeroQuickLogins === 'function') {
        this.renderHeroQuickLogins();
      }
    } catch (e) {
      console.warn("View refresh error:", e);
    }
  }
}

window.uiRenderer = new UIRenderer();
