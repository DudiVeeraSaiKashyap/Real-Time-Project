/* ── db.js — localStorage "database" ──────────────────── */

const DB_KEYS = { books: 'lms_books', students: 'lms_students', issued: 'lms_issued' };

const SEED_BOOKS = [
  { id:"B001", title:"Introduction to Algorithms",   author:"Cormen et al.",       subject:"Programming",  branch:"CSE",       qty:5, available:3 },
  { id:"B002", title:"Digital Electronics",           author:"Morris Mano",         subject:"Electronics",  branch:"ECE",       qty:4, available:2 },
  { id:"B003", title:"Engineering Mathematics",       author:"B.S. Grewal",         subject:"Mathematics",  branch:"CSE",       qty:6, available:4 },
  { id:"B004", title:"Data Structures in C",          author:"Yedidyah Langsam",    subject:"Programming",  branch:"CSE",       qty:3, available:1 },
  { id:"B005", title:"Signals and Systems",           author:"Alan V. Oppenheim",   subject:"Electronics",  branch:"ECE",       qty:4, available:3 },
  { id:"B006", title:"Thermodynamics",                author:"P.K. Nag",            subject:"Mechanical",   branch:"Mechanical",qty:5, available:5 },
  { id:"B007", title:"Electric Circuits",             author:"James W. Nilsson",    subject:"Electronics",  branch:"EEE",       qty:3, available:0 },
  { id:"B008", title:"Computer Networks",             author:"Andrew Tanenbaum",    subject:"Programming",  branch:"CSE",       qty:4, available:2 },
  { id:"B009", title:"Fluid Mechanics",               author:"Frank White",         subject:"Mechanical",   branch:"Mechanical",qty:3, available:3 },
  { id:"B010", title:"Operating Systems",             author:"Silberschatz",        subject:"Programming",  branch:"CSE",       qty:5, available:4 },
  { id:"B011", title:"Discrete Mathematics",          author:"Kenneth Rosen",       subject:"Mathematics",  branch:"CSE",       qty:4, available:2 },
  { id:"B012", title:"VLSI Design",                   author:"Neil Weste",          subject:"Electronics",  branch:"ECE",       qty:2, available:1 },
];

const SEED_STUDENTS = [
  { id:"S2023001", name:"Aarav Sharma",  branch:"CSE",       year:2, password:"pass123" },
  { id:"S2023002", name:"Priya Reddy",   branch:"ECE",       year:2, password:"pass123" },
  { id:"S2023003", name:"Rahul Mehta",   branch:"CSE",       year:2, password:"pass123" },
  { id:"S2023004", name:"Sneha Nair",    branch:"EEE",       year:3, password:"pass123" },
];

function today()        { return new Date(); }
function fmt(d)         { return new Date(d).toISOString().split('T')[0]; }
function addDays(d, n)  { const r = new Date(d); r.setDate(r.getDate()+n); return r; }
function isOverdue(due) { return new Date(due) < new Date(fmt(today())); }

const SEED_ISSUED = [
  { id:"I001", bookId:"B001", studentId:"S2023001", issueDate: fmt(addDays(today(),-10)), dueDate: fmt(addDays(today(), 4)), extRequest:null },
  { id:"I002", bookId:"B004", studentId:"S2023001", issueDate: fmt(addDays(today(),-18)), dueDate: fmt(addDays(today(),-4)), extRequest:null },
  { id:"I003", bookId:"B002", studentId:"S2023002", issueDate: fmt(addDays(today(), -7)), dueDate: fmt(addDays(today(), 7)), extRequest:null },
  { id:"I004", bookId:"B008", studentId:"S2023003", issueDate: fmt(addDays(today(), -3)), dueDate: fmt(addDays(today(),11)), extRequest:{ status:"pending", days:7, reason:"Exam preparation" } },
];

/* ── CRUD helpers ─────────────────────────────────────── */
const DB = {
  _get(key)       { return JSON.parse(localStorage.getItem(key) || 'null'); },
  _set(key, val)  { localStorage.setItem(key, JSON.stringify(val)); },

  /* Books */
  getBooks()      { return this._get(DB_KEYS.books) || []; },
  setBooks(arr)   { this._set(DB_KEYS.books, arr); },
  addBook(b)      { const a = this.getBooks(); a.push(b); this.setBooks(a); },
  updateBook(id, patch) {
    this.setBooks(this.getBooks().map(b => b.id===id ? {...b,...patch} : b));
  },
  deleteBook(id)  { this.setBooks(this.getBooks().filter(b => b.id!==id)); },
  findBook(id)    { return this.getBooks().find(b => b.id===id); },

  /* Students */
  getStudents()   { return this._get(DB_KEYS.students) || []; },
  findStudent(id) { return this.getStudents().find(s => s.id===id); },

  /* Issued */
  getIssued()     { return this._get(DB_KEYS.issued) || []; },
  setIssued(arr)  { this._set(DB_KEYS.issued, arr); },
  addIssued(rec)  { const a = this.getIssued(); a.push(rec); this.setIssued(a); },
  updateIssued(id, patch) {
    this.setIssued(this.getIssued().map(i => i.id===id ? {...i,...patch} : i));
  },
  removeIssued(id){ this.setIssued(this.getIssued().filter(i => i.id!==id)); },
  issuedForStudent(sid){ return this.getIssued().filter(i => i.studentId===sid); },

  /* Seed */
  seed() {
    if (!this._get(DB_KEYS.books))    this.setBooks(SEED_BOOKS);
    if (!this._get(DB_KEYS.students)) this._set(DB_KEYS.students, SEED_STUDENTS);
    if (!this._get(DB_KEYS.issued))   this.setIssued(SEED_ISSUED);
  },

  reset() {
    localStorage.removeItem(DB_KEYS.books);
    localStorage.removeItem(DB_KEYS.students);
    localStorage.removeItem(DB_KEYS.issued);
    this.seed();
  }
};

/* Seed on first load */
DB.seed();

/* Expose helpers globally */
window.DB        = DB;
window.fmt       = fmt;
window.addDays   = addDays;
window.isOverdue = isOverdue;
