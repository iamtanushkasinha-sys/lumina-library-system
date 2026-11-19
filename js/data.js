/**
 * Athenaeum / Lumina Library Management System
 * Initial Seed Data
 */

const SEED_DATA = {
  settings: {
    libraryName: "Lumina Central Library",
    loanDurationDays: 14,
    dailyFineRate: 0.50,
    maxRenewalCount: 2,
    currencySymbol: "$",
    allowReservations: true
  },

  categories: [
    "Computer Science",
    "Science Fiction",
    "Classic Literature",
    "Psychology & Self-Help",
    "History & Society",
    "Art & Design",
    "Mathematics & Physics",
    "Philosophy"
  ],

  books: [
    {
      id: "BOK-1001",
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      isbn: "978-1449373320",
      category: "Computer Science",
      publishedYear: 2017,
      totalCopies: 5,
      availableCopies: 3,
      shelfLocation: "Tech Wing - Rack 4A",
      rating: 4.9,
      borrowCount: 68,
      description: "The definitive guide to the architecture, principles, and trade-offs of modern data systems and distributed databases.",
      coverGradient: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9781449373320-M.jpg"
    },
    {
      id: "BOK-1002",
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin",
      isbn: "978-0132350884",
      category: "Computer Science",
      publishedYear: 2008,
      totalCopies: 4,
      availableCopies: 1,
      shelfLocation: "Tech Wing - Rack 3B",
      rating: 4.7,
      borrowCount: 94,
      description: "A legendary handbook on software craftsmanship, meaningful naming, refactoring, and principles of elegant programming.",
      coverGradient: "linear-gradient(135deg, #065f46, #10b981)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg"
    },
    {
      id: "BOK-1003",
      title: "The Pragmatic Programmer: Your Journey To Mastery",
      author: "David Thomas & Andrew Hunt",
      isbn: "978-0135957059",
      category: "Computer Science",
      publishedYear: 2019,
      totalCopies: 3,
      availableCopies: 2,
      shelfLocation: "Tech Wing - Rack 3A",
      rating: 4.8,
      borrowCount: 77,
      description: "Essential advice spanning career development, technical execution, orthogonality, tracer bullets, and pragmatic philosophy.",
      coverGradient: "linear-gradient(135deg, #831843, #ec4899)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780135957059-M.jpg"
    },
    {
      id: "BOK-1004",
      title: "Dune",
      author: "Frank Herbert",
      isbn: "978-0441013593",
      category: "Science Fiction",
      publishedYear: 1965,
      totalCopies: 6,
      availableCopies: 4,
      shelfLocation: "Fiction Hall - Rack 12C",
      rating: 4.9,
      borrowCount: 112,
      description: "Set on the desert planet Arrakis, Dune is a monumental triumph of imagination, ecology, religion, politics, and destiny.",
      coverGradient: "linear-gradient(135deg, #78350f, #d97706)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780441013593-M.jpg"
    },
    {
      id: "BOK-1005",
      title: "Project Hail Mary",
      author: "Andy Weir",
      isbn: "978-0593135204",
      category: "Science Fiction",
      publishedYear: 2021,
      totalCopies: 4,
      availableCopies: 0,
      shelfLocation: "Fiction Hall - Rack 12A",
      rating: 4.9,
      borrowCount: 88,
      description: "Ryland Grace is the sole survivor on a desperate interstellar mission to save humanity from an extinction-level solar crisis.",
      coverGradient: "linear-gradient(135deg, #1e1b4b, #6366f1)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780593135204-M.jpg"
    },
    {
      id: "BOK-1006",
      title: "Atomic Habits",
      author: "James Clear",
      isbn: "978-0735211292",
      category: "Psychology & Self-Help",
      publishedYear: 2018,
      totalCopies: 6,
      availableCopies: 3,
      shelfLocation: "Wellness Bay - Shelf 2",
      rating: 4.8,
      borrowCount: 140,
      description: "An easy and proven way to build good habits, break bad ones, and harness compounding 1% gains every day.",
      coverGradient: "linear-gradient(135deg, #991b1b, #ef4444)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg"
    },
    {
      id: "BOK-1007",
      title: "Thinking, Fast and Slow",
      author: "Daniel Kahneman",
      isbn: "978-0374533557",
      category: "Psychology & Self-Help",
      publishedYear: 2011,
      totalCopies: 4,
      availableCopies: 2,
      shelfLocation: "Wellness Bay - Shelf 3",
      rating: 4.6,
      borrowCount: 65,
      description: "Nobel laureate Daniel Kahneman explains the two cognitive systems that drive the way we think, decide, and judge risk.",
      coverGradient: "linear-gradient(135deg, #14532d, #22c55e)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780374533557-M.jpg"
    },
    {
      id: "BOK-1008",
      title: "Sapiens: A Brief History of Humankind",
      author: "Yuval Noah Harari",
      isbn: "978-0062316097",
      category: "History & Society",
      publishedYear: 2014,
      totalCopies: 5,
      availableCopies: 3,
      shelfLocation: "Humanities - Rack 7B",
      rating: 4.7,
      borrowCount: 105,
      description: "From foraging apes to rulers of the planet: exploring how biology and history have defined us and enhanced our understanding of what it means to be human.",
      coverGradient: "linear-gradient(135deg, #451a03, #b45309)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg"
    },
    {
      id: "BOK-1009",
      title: "The Design of Everyday Things",
      author: "Don Norman",
      isbn: "978-0465050659",
      category: "Art & Design",
      publishedYear: 2013,
      totalCopies: 3,
      availableCopies: 1,
      shelfLocation: "Creative Studio - Shelf 1",
      rating: 4.7,
      borrowCount: 52,
      description: "The ultimate primer on cognitive ergonomics, affordances, signifiers, and why human-centered design matters.",
      coverGradient: "linear-gradient(135deg, #701a75, #d946ef)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780465050659-M.jpg"
    },
    {
      id: "BOK-1010",
      title: "Structure and Interpretation of Computer Programs (SICP)",
      author: "Harold Abelson & Gerald Jay Sussman",
      isbn: "978-0262510875",
      category: "Computer Science",
      publishedYear: 1996,
      totalCopies: 2,
      availableCopies: 1,
      shelfLocation: "Tech Wing - Rack 1A",
      rating: 4.8,
      borrowCount: 39,
      description: "A foundational text on procedural abstraction, data modeling, metalinguistic abstraction, and computing paradigms with Scheme.",
      coverGradient: "linear-gradient(135deg, #312e81, #4f46e5)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780262510875-M.jpg"
    },
    {
      id: "BOK-1011",
      title: "Gödel, Escher, Bach: An Eternal Golden Braid",
      author: "Douglas Hofstadter",
      isbn: "978-0465026562",
      category: "Philosophy",
      publishedYear: 1979,
      totalCopies: 3,
      availableCopies: 2,
      shelfLocation: "Philosophy Loft - Rack 2",
      rating: 4.9,
      borrowCount: 44,
      description: "Pulitzer prize-winning exploration of strange loops, consciousness, formal logic, recursion, and the beauty of human cognition.",
      coverGradient: "linear-gradient(135deg, #0f172a, #475569)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780465026562-M.jpg"
    },
    {
      id: "BOK-1012",
      title: "Introduction to Algorithms (CLRS, 4th Edition)",
      author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
      isbn: "978-0262046305",
      category: "Computer Science",
      publishedYear: 2022,
      totalCopies: 4,
      availableCopies: 2,
      shelfLocation: "Tech Wing - Reference Desk",
      rating: 4.8,
      borrowCount: 82,
      description: "Comprehensive coverage of algorithms, dynamic programming, graph algorithms, NP-completeness, and modern data structures.",
      coverGradient: "linear-gradient(135deg, #134e4a, #14b8a6)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780262046305-M.jpg"
    },
    {
      id: "BOK-1013",
      title: "1984",
      author: "George Orwell",
      isbn: "978-0451524935",
      category: "Classic Literature",
      publishedYear: 1949,
      totalCopies: 5,
      availableCopies: 4,
      shelfLocation: "Classics - Shelf 9",
      rating: 4.7,
      borrowCount: 135,
      description: "A chilling, prophetic masterpiece depicting a totalitarian dystopia under the omniscient gaze of Big Brother.",
      coverGradient: "linear-gradient(135deg, #3f3f46, #71717a)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
    },
    {
      id: "BOK-1014",
      title: "Deep Learning",
      author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
      isbn: "978-0262035613",
      category: "Computer Science",
      publishedYear: 2016,
      totalCopies: 3,
      availableCopies: 2,
      shelfLocation: "Tech Wing - AI Section",
      rating: 4.7,
      borrowCount: 58,
      description: "A comprehensive resource on linear algebra, probability, deep feedforward networks, regularization, and generative models.",
      coverGradient: "linear-gradient(135deg, #3730a3, #818cf8)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780262035613-M.jpg"
    },
    {
      id: "BOK-1015",
      title: "Meditations",
      author: "Marcus Aurelius",
      isbn: "978-0140449334",
      category: "Philosophy",
      publishedYear: 180,
      totalCopies: 4,
      availableCopies: 3,
      shelfLocation: "Philosophy Loft - Rack 1",
      rating: 4.8,
      borrowCount: 97,
      description: "Personal writings of the Roman Emperor offering profound stoic insights into resilience, duty, ethics, and serenity.",
      coverGradient: "linear-gradient(135deg, #581c87, #a855f7)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780140449334-M.jpg"
    },
    {
      id: "BOK-1016",
      title: "The Feynman Lectures on Physics",
      author: "Richard P. Feynman",
      isbn: "978-0465023820",
      category: "Mathematics & Physics",
      publishedYear: 1964,
      totalCopies: 3,
      availableCopies: 2,
      shelfLocation: "Science Annex - Shelf 4",
      rating: 4.9,
      borrowCount: 47,
      description: "Legendary physics lectures delivered with clarity, intuition, humor, and unparalleled pedagogical brilliance.",
      coverGradient: "linear-gradient(135deg, #b91c1c, #f87171)",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780465023820-M.jpg"
    }
  ],

  members: [
    {
      id: "MEM-201",
      name: "Eleanor Vance",
      email: "eleanor.vance@campus.edu",
      phone: "+1 (555) 392-8810",
      membershipType: "Student",
      maxBorrowLimit: 5,
      joinedDate: "2023-09-15",
      status: "Active",
      avatarColor: "#4f46e5"
    },
    {
      id: "MEM-202",
      name: "Dr. Marcus Chen",
      email: "marcus.chen@faculty.org",
      phone: "+1 (555) 741-9923",
      membershipType: "Faculty",
      maxBorrowLimit: 10,
      joinedDate: "2022-01-10",
      status: "Active",
      avatarColor: "#059669"
    },
    {
      id: "MEM-203",
      name: "Sophia Rodriguez",
      email: "s.rodriguez@domain.com",
      phone: "+1 (555) 882-1940",
      membershipType: "General",
      maxBorrowLimit: 4,
      joinedDate: "2024-02-18",
      status: "Active",
      avatarColor: "#d97706"
    },
    {
      id: "MEM-204",
      name: "Liam O'Connor",
      email: "liam.oc@research.ac.uk",
      phone: "+1 (555) 129-4560",
      membershipType: "Researcher",
      maxBorrowLimit: 8,
      joinedDate: "2023-11-04",
      status: "Active",
      avatarColor: "#7c3aed"
    },
    {
      id: "MEM-205",
      name: "Amina Patel",
      email: "amina.p@campus.edu",
      phone: "+1 (555) 663-7182",
      membershipType: "Student",
      maxBorrowLimit: 5,
      joinedDate: "2024-08-20",
      status: "Active",
      avatarColor: "#db2777"
    },
    {
      id: "MEM-206",
      name: "Julian Thorne",
      email: "thorne.j@librarypatrons.net",
      phone: "+1 (555) 902-3341",
      membershipType: "General",
      maxBorrowLimit: 4,
      joinedDate: "2023-04-12",
      status: "Suspended",
      avatarColor: "#475569"
    },
    {
      id: "MEM-207",
      name: "Hannah Lindqvist",
      email: "hannah.l@designlabs.io",
      phone: "+1 (555) 430-8871",
      membershipType: "General",
      maxBorrowLimit: 4,
      joinedDate: "2024-05-30",
      status: "Active",
      avatarColor: "#0891b2"
    },
    {
      id: "MEM-208",
      name: "Tariq Al-Mansoor",
      email: "tariq.mansoor@techinst.edu",
      phone: "+1 (555) 819-0024",
      membershipType: "Student",
      maxBorrowLimit: 5,
      joinedDate: "2023-10-01",
      status: "Active",
      avatarColor: "#ea580c"
    }
  ],

  loans: [
    {
      id: "LON-5001",
      bookId: "BOK-1001",
      memberId: "MEM-201",
      issueDate: "2026-11-10",
      dueDate: "2026-11-24",
      returnDate: null,
      renewalCount: 0,
      fineAmount: 0,
      finePaid: false,
      status: "Active"
    },
    {
      id: "LON-5002",
      bookId: "BOK-1002",
      memberId: "MEM-202",
      issueDate: "2026-11-01",
      dueDate: "2026-11-15",
      returnDate: null,
      renewalCount: 0,
      fineAmount: 2.00, // 4 days overdue as of 2026-11-19
      finePaid: false,
      status: "Overdue"
    },
    {
      id: "LON-5003",
      bookId: "BOK-1005",
      memberId: "MEM-203",
      issueDate: "2026-10-25",
      dueDate: "2026-11-08",
      returnDate: null,
      renewalCount: 0,
      fineAmount: 5.50, // 11 days overdue
      finePaid: false,
      status: "Overdue"
    },
    {
      id: "LON-5004",
      bookId: "BOK-1005",
      memberId: "MEM-204",
      issueDate: "2026-11-12",
      dueDate: "2026-11-26",
      returnDate: null,
      renewalCount: 0,
      fineAmount: 0,
      finePaid: false,
      status: "Active"
    },
    {
      id: "LON-5005",
      bookId: "BOK-1005",
      memberId: "MEM-205",
      issueDate: "2026-11-14",
      dueDate: "2026-11-28",
      returnDate: null,
      renewalCount: 0,
      fineAmount: 0,
      finePaid: false,
      status: "Active"
    },
    {
      id: "LON-5006",
      bookId: "BOK-1005",
      memberId: "MEM-208",
      issueDate: "2026-11-16",
      dueDate: "2026-11-30",
      returnDate: null,
      renewalCount: 0,
      fineAmount: 0,
      finePaid: false,
      status: "Active"
    },
    {
      id: "LON-5007",
      bookId: "BOK-1009",
      memberId: "MEM-207",
      issueDate: "2026-11-08",
      dueDate: "2026-11-22",
      returnDate: null,
      renewalCount: 1,
      fineAmount: 0,
      finePaid: false,
      status: "Active"
    },
    {
      id: "LON-5008",
      bookId: "BOK-1006",
      memberId: "MEM-201",
      issueDate: "2026-10-01",
      dueDate: "2026-10-15",
      returnDate: "2026-10-14",
      renewalCount: 0,
      fineAmount: 0,
      finePaid: true,
      status: "Returned"
    },
    {
      id: "LON-5009",
      bookId: "BOK-1008",
      memberId: "MEM-202",
      issueDate: "2026-09-10",
      dueDate: "2026-09-24",
      returnDate: "2026-09-28",
      renewalCount: 0,
      fineAmount: 2.00,
      finePaid: true,
      status: "Returned"
    },
    {
      id: "LON-5010",
      bookId: "BOK-1004",
      memberId: "MEM-203",
      issueDate: "2026-11-15",
      dueDate: "2026-11-29",
      returnDate: null,
      renewalCount: 0,
      fineAmount: 0,
      finePaid: false,
      status: "Active"
    }
  ],

  reservations: [
    {
      id: "RES-901",
      bookId: "BOK-1005",
      memberId: "MEM-201",
      reservedDate: "2026-11-15",
      status: "Waiting",
      notes: "First in queue for Project Hail Mary once a copy is returned"
    },
    {
      id: "RES-902",
      bookId: "BOK-1002",
      memberId: "MEM-207",
      reservedDate: "2026-11-18",
      status: "Waiting",
      notes: "Hold requested for Software Architecture study group"
    }
  ],

  activityLog: [
    {
      id: "ACT-001",
      type: "issue",
      text: "Eleanor Vance borrowed 'Designing Data-Intensive Applications'",
      timestamp: "2026-11-10T14:22:00Z"
    },
    {
      id: "ACT-002",
      type: "reserve",
      text: "Eleanor Vance placed a reservation on 'Project Hail Mary'",
      timestamp: "2026-11-15T11:05:00Z"
    },
    {
      id: "ACT-003",
      type: "issue",
      text: "Tariq Al-Mansoor borrowed 'Project Hail Mary'",
      timestamp: "2026-11-16T16:40:00Z"
    },
    {
      id: "ACT-004",
      type: "overdue_alert",
      text: "System flagged loan LON-5002 as Overdue (4 days)",
      timestamp: "2026-11-16T00:00:00Z"
    },
    {
      id: "ACT-005",
      type: "reserve",
      text: "Hannah Lindqvist requested reservation on 'Clean Code'",
      timestamp: "2026-11-18T09:12:00Z"
    }
  ],

  users: [
    {
      id: "USR-001",
      username: "admin",
      password: "admin123",
      fullName: "System Administrator",
      role: "ADMIN",
      linkedMemberId: null,
      avatarColor: "#4f46e5"
    },
    {
      id: "USR-002",
      username: "staff",
      password: "staff123",
      fullName: "Dr. Marcus Chen",
      role: "STAFF",
      linkedMemberId: "MEM-202",
      avatarColor: "#059669"
    },
    {
      id: "USR-003",
      username: "student1",
      password: "student123",
      fullName: "Eleanor Vance",
      role: "STUDENT",
      linkedMemberId: "MEM-201",
      avatarColor: "#2563eb"
    },
    {
      id: "USR-004",
      username: "student2",
      password: "student123",
      fullName: "Sophia Rodriguez",
      role: "STUDENT",
      linkedMemberId: "MEM-203",
      avatarColor: "#d97706"
    },
    {
      id: "USR-005",
      username: "student3",
      password: "student123",
      fullName: "Liam O'Connor",
      role: "STUDENT",
      linkedMemberId: "MEM-204",
      avatarColor: "#7c3aed"
    },
    {
      id: "USR-006",
      username: "student4",
      password: "student123",
      fullName: "Amina Patel",
      role: "STUDENT",
      linkedMemberId: "MEM-205",
      avatarColor: "#db2777"
    },
    {
      id: "USR-007",
      username: "student5",
      password: "student123",
      fullName: "Julian Thorne",
      role: "STUDENT",
      linkedMemberId: "MEM-206",
      avatarColor: "#0891b2"
    },
    {
      id: "USR-008",
      username: "student",
      password: "student123",
      fullName: "Eleanor Vance",
      role: "STUDENT",
      linkedMemberId: "MEM-201",
      avatarColor: "#2563eb"
    }
  ]
};
