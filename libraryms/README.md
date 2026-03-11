# 📚 LibraryMS — College Library Management System

A fully functional Library Management System built with pure HTML, CSS, and JavaScript.
Uses `localStorage` as the database — no backend or internet required!

---

## 🚀 How to Run

1. **Extract** the zip file
2. **Open** `index.html` in any modern browser (Chrome, Firefox, Edge)
3. That's it! No installation, no server needed.

---

## 🔐 Demo Login Credentials

| Role    | Username / ID | Password  |
|---------|---------------|-----------|
| Student | S2023001      | pass123   |
| Student | S2023002      | pass123   |
| Admin   | admin         | admin123  |

---

## 📁 Project Structure

```
libraryms/
├── index.html          ← Main HTML (all pages)
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── db.js           ← localStorage database + seed data
│   ├── auth.js         ← Login / logout / session
│   ├── qr.js           ← QR code generator (canvas)
│   └── app.js          ← All page logic & interactions
└── README.md
```

---

## ✅ Features

### Student
- Login with Student ID & Password
- Dashboard with stats
- Book Catalog with Search + Subject/Branch filters
- My Books — view borrowed books with issue & due dates
- Request deadline extension (with reason)

### Admin
- Admin login dashboard
- Statistics: total books, available, issued, overdue, students
- Subject & Branch bar charts
- Add / Edit / Delete books
- View all borrowed books
- Approve or Reject extension requests
- QR Scanner page — simulate scan or enter Book ID to issue/return

### QR Codes
- Every book has a unique QR code (generated on canvas)
- View QR from catalog or manage books page

---

## 💾 Data Storage

All data is saved in your browser's `localStorage`:
- `lms_books` — book catalog
- `lms_students` — student accounts
- `lms_issued` — borrow records

Data **persists** between sessions (until you clear browser data).
To reset to seed data, open the browser console and run: `DB.reset()`

---

## 🛠 Tech Stack

- HTML5
- CSS3 (custom properties, grid, flexbox, animations)
- Vanilla JavaScript (ES6+)
- localStorage (as database)
- Canvas API (QR code generation)
- Google Fonts (Plus Jakarta Sans + JetBrains Mono)
