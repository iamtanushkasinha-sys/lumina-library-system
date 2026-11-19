# 📚 Lumina Library Management System

A modern, fast, accessible, and responsive web application designed for comprehensive library circulation, cataloging, patron management, and inventory analytics.

---

## 🌟 Key Features

### 1. 📊 Interactive Dashboard & Analytics
- **Live Circulation Metrics**: Total titles, copies in stock, active checkouts, overdue items, and enrolled patrons.
- **Visual Analytics with Chart.js**:
  - **Category Mix**: Doughnut chart of book inventory distribution across genres.
  - **Lending Trends**: 6-month comparative bar chart tracking borrowing and return volumes.
- **Overdue Attention Deck**: Real-time tracking of overdue loans with automated day-count calculations and fine assessments ($0.50/day).
- **Recent Circulation Audit Log**: Chronological feed of loans, returns, hold reservations, and system alerts.

### 2. 📖 Catalog & Inventory Management
- **Search & Filter Suite**: Instant search by Title, Author, ISBN, or Shelf Location with category and stock availability filters.
- **Dual View Modes**: Switch seamlessly between a visual **Cover Card Grid** and a compact **Inventory Table**.
- **Book Details Modal**: Full book synopsis, publication year, shelf rack, lifetime borrow count, and active loan borrowers list.
- **Book Management (CRUD)**: Add new books, edit existing catalog data, and track real-time stock availability.

### 3. 👥 Patron & Member Registry
- **Patron Categories**: Student, Faculty, Researcher, and General memberships with customizable borrowing quotas (e.g., 5 for students, 10 for faculty).
- **Patron Profile**: Inspect active books on loan, borrow history, account status (`Active` or `Suspended`), and contact details.
- **Patron Management**: Add, update, and manage member credentials.

### 4. 🔄 Circulation Desk (Loans, Returns & Fines)
- **Check Out / Issue Desk**: Issue books to active members with validation rules (prevents exceeding member quotas, double-borrowing same book, or checking out reserved copies).
- **Return Processing**: 1-click return with automatic overdue fine calculation, fine waiver option for librarian override, and inventory replenishment.
- **Loan Renewals**: Extend due dates by 14 days with quota limits (max 2 renewals) and hold conflict detection.
- **Printable Circulation Slips**: Instant printable receipts with transaction ID, patron details, due date, and fine status.

### 5. ⏳ Holds & Reservations Queue
- **Reserve Checked-Out Titles**: Patrons can place holds on unavailable books.
- **Automated Reallocation**: When an overdue or borrowed book is returned, the reservation queue immediately transitions the title to `Ready for Pickup`.

### 6. 💾 Backup & Data Portability
- **JSON Backup & Restore**: One-click download of the complete database (books, members, loans, activity log) and instant JSON restore.
- **CSV Catalog Export**: Export catalog table directly to CSV format.
- **Reset to Sample Demo Dataset**: One-click restore to sample seed data.

### 7. 🎨 UI / UX & Accessibility (WCAG 2.1 AA)
- **Dark Mode / Light Mode**: Persistent theme toggle with high-contrast accessibility palette.
- **Keyboard Navigation & Shortcuts**:
  - `Escape`: Close any open modal dialog.
  - `Ctrl + K` or `/`: Jump directly to Catalog search.
- **Responsive Design**: Optimized for desktops, tablets, and mobile screens.

---

## 🚀 How to Run

### Option 1: Direct File Launch (No dependencies needed)
Double-click `start.bat` or open `index.html` directly in **Google Chrome** or any modern web browser:
```bash
# file:///C:/Users/User/.gemini/antigravity/scratch/library-management-system/index.html
```

### Option 2: Local Web Server (PowerShell)
To run on a local HTTP server (`http://localhost:8080`):
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
```

---

## 🛠 Chrome DevTools Inspection Guide

Use Google Chrome DevTools (`F12` or `Ctrl + Shift + I`):
1. **Lighthouse / Performance Audit**:
   - Run Lighthouse audit in DevTools: Achieves 95+ across Performance, Accessibility, and Best Practices due to lightweight vanilla DOM and minimal render blocking.
2. **Accessibility (a11y) Inspection**:
   - Inspect semantic `<header>`, `<main>`, `<aside>`, `<nav>`, `<section>` landmarks, ARIA dialog roles (`role="dialog"`), accessible buttons, and color contrast.
3. **Application & Storage**:
   - Inspect `Local Storage -> lumina_library_data_v1` to view live JSON storage states, test imports/exports, or modify seed data.
4. **Device Emulation**:
   - Toggle Device Toolbar (`Ctrl + Shift + M`) to test responsive behavior on mobile (iPhone, Pixel) and desktop viewports.

---

## 📂 Project Structure

```
library-management-system/
├── index.html          # Main application shell with semantic UI & modals
├── css/
│   └── styles.css      # Custom styling, badges, transitions, print stylesheets
├── js/
│   ├── data.js         # Realistic seed catalog (16 books, 8 patrons, 10 loans)
│   ├── storage.js      # LocalStorage persistence, integrity checks, export/import
│   ├── models.js       # Business logic (circulation, fines, limits, holds)
│   ├── charts.js       # Chart.js analytics integration
│   ├── ui.js           # View rendering, search/filters, toasts, modals
│   └── app.js          # Controller, shortcuts, theme toggle, form wiring
├── server.ps1          # Lightweight local HTTP server in PowerShell
├── start.bat           # 1-click launcher for Windows
└── README.md           # Documentation & DevTools guide
```
