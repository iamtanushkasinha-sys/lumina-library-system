/**
 * Library Models & Business Logic
 * Circulation, rules, fine calculations, constraints & metrics.
 */

class LibraryEngine {
  constructor(storage) {
    this.storage = storage;
  }

  // Format date helper: YYYY-MM-DD
  formatDate(dateObj) {
    const d = new Date(dateObj);
    return d.toISOString().split('T')[0];
  }

  // Add days to date
  addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return this.formatDate(d);
  }

  // Calculate day difference (d2 - d1)
  dayDiff(d1, d2) {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diffTime = date2 - date1;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Sync loan statuses & calculate real-time overdue fines
  refreshCirculationState() {
    const loans = this.storage.getLoans();
    const settings = this.storage.getSettings();
    const today = this.formatDate(new Date());
    let modified = false;

    loans.forEach(loan => {
      if (loan.status === 'Active' || loan.status === 'Overdue') {
        const overdueDays = this.dayDiff(loan.dueDate, today);
        if (overdueDays > 0) {
          loan.status = 'Overdue';
          loan.fineAmount = parseFloat((overdueDays * (settings.dailyFineRate || 0.50)).toFixed(2));
          modified = true;
        } else {
          loan.status = 'Active';
          loan.fineAmount = 0;
        }
      }
    });

    if (modified) {
      const data = this.storage.getData();
      data.loans = loans;
      this.storage.saveData(data);
    }

    return loans;
  }

  // Issue / Checkout a book
  issueBook(bookId, memberId, customDueDays = null) {
    const book = this.storage.getBook(bookId);
    const member = this.storage.getMember(memberId);
    const settings = this.storage.getSettings();

    if (!book) throw new Error("Book not found in catalog.");
    if (!member) throw new Error("Member not found in registry.");

    // RBAC Security Check: A student cannot issue a book in someone else's name
    if (window.authManager && window.authManager.isLoggedIn()) {
      const currentUser = window.authManager.getCurrentUser();
      if (currentUser && currentUser.role === 'STUDENT') {
        const studentMemberId = currentUser.linkedMemberId || currentUser.username.toUpperCase();
        if (memberId.toLowerCase() !== studentMemberId.toLowerCase()) {
          throw new Error("Security Violation: Students can only borrow books for themselves.");
        }
      }
    }

    if (member.status === 'Suspended') {
      throw new Error(`Member ${member.name} is currently Suspended (unresolved fines or violations).`);
    }

    if (book.availableCopies <= 0) {
      throw new Error(`No copies of "${book.title}" are currently available for checkout.`);
    }

    // Check member's active loans
    const allLoans = this.storage.getLoans();
    const activeMemberLoans = allLoans.filter(l => l.memberId === memberId && (l.status === 'Active' || l.status === 'Overdue'));

    if (activeMemberLoans.length >= (member.maxBorrowLimit || 5)) {
      throw new Error(`Borrowing limit reached: ${member.name} already has ${activeMemberLoans.length} books on loan (Max: ${member.maxBorrowLimit}).`);
    }

    // Check if member already has this exact book
    const alreadyHas = activeMemberLoans.some(l => l.bookId === bookId);
    if (alreadyHas) {
      throw new Error(`${member.name} already has a copy of "${book.title}" currently issued.`);
    }

    // Check if book has reservations by someone else
    const reservations = this.storage.getReservations().filter(r => r.bookId === bookId && r.status === 'Waiting');
    if (reservations.length > 0 && reservations[0].memberId !== memberId && book.availableCopies <= 1) {
      const reservedMember = this.storage.getMember(reservations[0].memberId);
      const name = reservedMember ? reservedMember.name : 'another patron';
      throw new Error(`This copy is on hold for reservation queue (${name}).`);
    }

    const today = this.formatDate(new Date());
    const duration = customDueDays ? parseInt(customDueDays) : (settings.loanDurationDays || 14);
    const dueDate = this.addDays(today, duration);

    const newLoan = {
      id: "LON-" + Math.floor(1000 + Math.random() * 9000),
      bookId,
      memberId,
      issueDate: today,
      dueDate,
      returnDate: null,
      renewalCount: 0,
      fineAmount: 0,
      finePaid: false,
      status: "Active"
    };

    // Update book inventory
    book.availableCopies -= 1;
    book.borrowCount = (book.borrowCount || 0) + 1;
    this.storage.saveBook(book);

    // If member was waiting on reservation, fulfill it
    const userRes = reservations.find(r => r.memberId === memberId);
    if (userRes) {
      userRes.status = 'Fulfilled';
      this.storage.saveReservation(userRes);
    }

    // Save loan
    this.storage.saveLoan(newLoan);
    this.storage.logActivity('issue', `${member.name} borrowed "${book.title}" (Due: ${dueDate})`);

    return newLoan;
  }

  // Return a book
  returnBook(loanId, waiveFine = false) {
    this.refreshCirculationState();
    const loan = this.storage.getLoan(loanId);
    if (!loan) throw new Error("Loan record not found.");
    if (loan.status === 'Returned') throw new Error("This book has already been returned.");

    // RBAC Security Check: A student cannot return someone else's book
    if (window.authManager && window.authManager.isLoggedIn()) {
      const currentUser = window.authManager.getCurrentUser();
      if (currentUser && currentUser.role === 'STUDENT') {
        const studentMemberId = currentUser.linkedMemberId || currentUser.username.toUpperCase();
        if (loan.memberId.toLowerCase() !== studentMemberId.toLowerCase()) {
          throw new Error("Security Violation: You can only return your own borrowed books.");
        }
      }
    }

    const book = this.storage.getBook(loan.bookId);
    const member = this.storage.getMember(loan.memberId);
    const today = this.formatDate(new Date());

    loan.returnDate = today;
    loan.status = 'Returned';

    if (waiveFine) {
      loan.finePaid = true;
      loan.fineWaived = true;
    } else if (loan.fineAmount > 0) {
      loan.finePaid = true; // marked paid on return desk collection
    }

    this.storage.saveLoan(loan);

    // Increment available copies
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      this.storage.saveBook(book);

      // Check if reservation queue exists for this book
      const reservations = this.storage.getReservations().filter(r => r.bookId === book.id && r.status === 'Waiting');
      if (reservations.length > 0) {
        reservations[0].status = 'Ready for Pickup';
        this.storage.saveReservation(reservations[0]);
        const patron = this.storage.getMember(reservations[0].memberId);
        this.storage.logActivity('reserve_ready', `Copy of "${book.title}" is now Ready for Pickup by ${patron ? patron.name : 'patron'}`);
      }
    }

    const fineNote = loan.fineAmount > 0 ? ` with ${waiveFine ? 'waived' : 'collected'} fine of $${loan.fineAmount.toFixed(2)}` : '';
    this.storage.logActivity('return', `${member ? member.name : 'Member'} returned "${book ? book.title : 'Book'}"${fineNote}`);

    return loan;
  }

  // Renew a loan
  renewLoan(loanId) {
    this.refreshCirculationState();
    const loan = this.storage.getLoan(loanId);
    if (!loan) throw new Error("Loan not found.");
    if (loan.status === 'Returned') throw new Error("Cannot renew a returned loan.");

    // RBAC Security Check: A student cannot renew someone else's book
    if (window.authManager && window.authManager.isLoggedIn()) {
      const currentUser = window.authManager.getCurrentUser();
      if (currentUser && currentUser.role === 'STUDENT') {
        const studentMemberId = currentUser.linkedMemberId || currentUser.username.toUpperCase();
        if (loan.memberId.toLowerCase() !== studentMemberId.toLowerCase()) {
          throw new Error("Security Violation: You can only renew your own borrowed books.");
        }
      }
    }
    if (loan.status === 'Overdue') {
      throw new Error("Overdue loans cannot be renewed. Please return the book or settle the fine first.");
    }

    const settings = this.storage.getSettings();
    const maxRenewals = settings.maxRenewalCount || 2;
    if (loan.renewalCount >= maxRenewals) {
      throw new Error(`Maximum renewal limit (${maxRenewals}) reached for this loan.`);
    }

    // Check if anyone else has reserved it
    const reservations = this.storage.getReservations().filter(r => r.bookId === loan.bookId && r.status === 'Waiting');
    if (reservations.length > 0) {
      throw new Error("Cannot renew: another patron is currently in the reservation queue for this book.");
    }

    const duration = settings.loanDurationDays || 14;
    loan.dueDate = this.addDays(loan.dueDate, duration);
    loan.renewalCount = (loan.renewalCount || 0) + 1;
    this.storage.saveLoan(loan);

    const book = this.storage.getBook(loan.bookId);
    const member = this.storage.getMember(loan.memberId);
    this.storage.logActivity('renew', `Renewed loan for "${book ? book.title : 'Book'}" to ${loan.dueDate} for ${member ? member.name : 'patron'}`);

    return loan;
  }

  // Place Reservation / Hold
  placeReservation(bookId, memberId, notes = "") {
    const book = this.storage.getBook(bookId);
    const member = this.storage.getMember(memberId);

    if (!book) throw new Error("Book not found.");
    if (!member) throw new Error("Member not found.");

    if (window.authManager) {
      const currentUser = window.authManager.getCurrentUser();
      if (currentUser && currentUser.role === 'STUDENT') {
        const studentMemberId = currentUser.linkedMemberId || currentUser.username.toUpperCase();
        if (memberId.toLowerCase() !== studentMemberId.toLowerCase()) {
          throw new Error("Security Violation: Students can only place reservations for themselves.");
        }
      }
    }

    const existing = this.storage.getReservations().find(r => r.bookId === bookId && r.memberId === memberId && (r.status === 'Waiting' || r.status === 'Ready for Pickup'));
    if (existing) {
      throw new Error(`${member.name} already has an active reservation for "${book.title}".`);
    }

    const newRes = {
      id: "RES-" + Math.floor(100 + Math.random() * 900),
      bookId,
      memberId,
      reservedDate: this.formatDate(new Date()),
      status: "Waiting",
      notes: notes || "Requested hold"
    };

    this.storage.saveReservation(newRes);
    this.storage.logActivity('reserve', `${member.name} placed a reservation on "${book.title}"`);
    return newRes;
  }

  // Pay or Waive pending fine on loan
  settleFine(loanId, waive = false) {
    const loan = this.storage.getLoan(loanId);
    if (!loan) throw new Error("Loan not found.");
    loan.finePaid = true;
    if (waive) loan.fineWaived = true;
    this.storage.saveLoan(loan);
    this.storage.logActivity('fine_settled', `${waive ? 'Waived' : 'Paid'} fine of $${loan.fineAmount.toFixed(2)} on loan ${loan.id}`);
    return loan;
  }

  // Get full metrics dashboard summary
  getDashboardStats() {
    this.refreshCirculationState();

    const books = this.storage.getBooks();
    const members = this.storage.getMembers();
    const loans = this.storage.getLoans();
    const reservations = this.storage.getReservations();
    const settings = this.storage.getSettings();

    const totalTitles = books.length;
    const totalCopies = books.reduce((acc, b) => acc + (parseInt(b.totalCopies) || 0), 0);
    const availableCopies = books.reduce((acc, b) => acc + (parseInt(b.availableCopies) || 0), 0);
    const borrowedCopies = totalCopies - availableCopies;

    const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
    const overdueLoans = loans.filter(l => l.status === 'Overdue');
    const activeMembers = members.filter(m => m.status === 'Active');

    const totalFinesPending = overdueLoans.reduce((sum, l) => sum + (l.finePaid ? 0 : (l.fineAmount || 0)), 0);
    const totalFinesCollected = loans.filter(l => l.finePaid && !l.fineWaived).reduce((sum, l) => sum + (l.fineAmount || 0), 0);

    const pendingReservations = reservations.filter(r => r.status === 'Waiting' || r.status === 'Ready for Pickup');

    // Category distribution
    const categoryCounts = {};
    const categoryBorrows = {};
    books.forEach(b => {
      const cat = b.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + (parseInt(b.totalCopies) || 1);
      categoryBorrows[cat] = (categoryBorrows[cat] || 0) + (b.borrowCount || 0);
    });

    // Top borrowed books
    const topBooks = [...books].sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0)).slice(0, 5);

    return {
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies,
      totalMembers: members.length,
      activeMembersCount: activeMembers.length,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
      totalFinesPending: totalFinesPending.toFixed(2),
      totalFinesCollected: totalFinesCollected.toFixed(2),
      pendingReservationsCount: pendingReservations.length,
      categoryCounts,
      categoryBorrows,
      topBooks,
      currency: settings.currencySymbol || '$'
    };
  }
}

window.libraryEngine = new LibraryEngine(window.storageService);
