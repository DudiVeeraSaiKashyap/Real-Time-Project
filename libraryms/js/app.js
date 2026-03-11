/* ── app.js — main application logic ─────────────────── */

/* ── NAVIGATION ───────────────────────────────────────── */
const PAGE_TITLES = {
  'student-dashboard': 'Student Dashboard',
  'catalog':           'Book Catalog',
  'mybooks':           'My Books',
  'admin-dashboard':   'Admin Dashboard',
  'manage-books':      'Manage Books',
  'borrowed':          'Borrowed Books',
  'qr':                'QR Scanner',
};

function goTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  /* topbar */
  const topbar = document.getElementById('topbar');
  const isAuth = !['home','student-login','admin-login'].includes(pageId);
  topbar.style.display = isAuth ? 'flex' : 'none';
  document.getElementById('topbar-title').textContent = PAGE_TITLES[pageId] || 'LibraryMS';
  document.getElementById('topbar-date').textContent  = new Date().toLocaleDateString('en-IN', { weekday:'short', year:'numeric', month:'short', day:'numeric' });

  /* sidebar active */
  document.querySelectorAll('.sb-item').forEach(el => {
    el.classList.remove('active','admin-active');
    if (el.dataset.page === pageId) {
      el.classList.add(Auth.isAdmin() ? 'admin-active' : 'active');
    }
  });

  /* render page content */
  switch (pageId) {
    case 'student-dashboard': renderStudentDashboard(); break;
    case 'catalog':           renderCatalog();           break;
    case 'mybooks':           renderMyBooks();           break;
    case 'admin-dashboard':   renderAdminDashboard();    break;
    case 'manage-books':      renderManageBooks();       break;
    case 'borrowed':          renderBorrowed();          break;
    case 'qr':                renderQRPage();            break;
  }
}

/* ── SIDEBAR / APP SHELL ──────────────────────────────── */
function initApp() {
  const session = Auth.getSession();
  const sidebar = document.getElementById('sidebar');
  const main    = document.getElementById('main-content');

  if (!session) {
    sidebar.classList.add('hidden');
    main.classList.add('no-sidebar');
    document.getElementById('sb-nav').innerHTML  = '';
    document.getElementById('sb-user').innerHTML = '';
    return;
  }

  sidebar.classList.remove('hidden');
  main.classList.remove('no-sidebar');

  /* nav items */
  const isAdmin = session.type === 'admin';
  const navItems = isAdmin
    ? [
        { page:'admin-dashboard', icon:'📊', label:'Dashboard' },
        { page:'manage-books',    icon:'📚', label:'Manage Books' },
        { page:'borrowed',        icon:'🔖', label:'Borrowed Books', badge: true },
        { page:'qr',              icon:'📷', label:'QR Scanner' },
      ]
    : [
        { page:'student-dashboard', icon:'📊', label:'Dashboard' },
        { page:'catalog',           icon:'📚', label:'Book Catalog' },
        { page:'mybooks',           icon:'📖', label:'My Books' },
      ];

  const pendingCount = DB.getIssued().filter(i => i.extRequest?.status === 'pending').length;

  document.getElementById('sb-nav').innerHTML = `
    <div class="sb-section">${isAdmin ? 'Admin Panel' : 'Student Panel'}</div>
    ${navItems.map(item => `
      <button class="sb-item" data-page="${item.page}" onclick="goTo('${item.page}')">
        <span>${item.icon}</span>
        <span>${item.label}</span>
        ${item.badge && pendingCount > 0 ? `<span class="sb-badge">${pendingCount}</span>` : ''}
      </button>
    `).join('')}
  `;

  /* user strip */
  document.getElementById('sb-user').innerHTML = `
    <div class="sb-avatar">${session.name[0].toUpperCase()}</div>
    <div>
      <div class="sb-uname">${session.name}</div>
      <div class="sb-urole">${isAdmin ? 'Librarian' : session.id}</div>
    </div>
    <button class="logout-btn" title="Logout" onclick="logout()">⏻</button>
  `;
}

/* ── BADGE HELPERS ────────────────────────────────────── */
function badge(type, text) {
  return `<span class="badge badge-${type}">${text}</span>`;
}

/* ── STUDENT DASHBOARD ────────────────────────────────── */
function renderStudentDashboard() {
  const session    = Auth.getSession();
  const myIssued   = DB.issuedForStudent(session.id);
  const books      = DB.getBooks();
  const totalAvail = books.reduce((a,b) => a + b.available, 0);
  const overdueN   = myIssued.filter(i => isOverdue(i.dueDate)).length;

  document.getElementById('s-dash-greeting').textContent = `Welcome back, ${session.name.split(' ')[0]}! 👋`;
  document.getElementById('s-dash-sub').textContent      = `${session.branch} · Year ${session.year} · ${session.id}`;

  document.getElementById('s-stat-grid').innerHTML = `
    <div class="stat-card c1"><div class="stat-icon">📖</div><div class="stat-val">${myIssued.length}</div><div class="stat-label">Books Borrowed</div></div>
    <div class="stat-card c2"><div class="stat-icon">📚</div><div class="stat-val">${totalAvail}</div><div class="stat-label">Books Available</div></div>
    <div class="stat-card c3"><div class="stat-icon">📋</div><div class="stat-val">${books.length}</div><div class="stat-label">Total Catalog</div></div>
    <div class="stat-card c5"><div class="stat-icon">⚠️</div><div class="stat-val">${overdueN}</div><div class="stat-label">Overdue</div></div>
  `;

  const tbody = document.getElementById('s-borrowed-tbody');
  if (myIssued.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--muted)">No books borrowed yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = myIssued.map(i => {
    const book = DB.findBook(i.bookId);
    const over = isOverdue(i.dueDate);
    return `<tr class="${over ? 'overdue-row' : ''}">
      <td><div style="font-weight:700">${book?.title || i.bookId}</div><div style="font-size:11px;color:var(--muted)">${i.bookId}</div></td>
      <td style="font-family:var(--mono);font-size:12px">${i.issueDate}</td>
      <td style="font-family:var(--mono);font-size:12px;color:${over ? 'var(--red)' : 'inherit'}">${i.dueDate}</td>
      <td>${over ? badge('red','⚠ Overdue') : badge('green','✓ Active')}</td>
    </tr>`;
  }).join('');
}

/* ── CATALOG ──────────────────────────────────────────── */
function renderCatalog() {
  const search  = (document.getElementById('catalog-search')?.value || '').toLowerCase();
  const subject = document.getElementById('catalog-subject')?.value || '';
  const branch  = document.getElementById('catalog-branch')?.value  || '';
  const books   = DB.getBooks().filter(b =>
    (!subject || b.subject === subject) &&
    (!branch  || b.branch  === branch) &&
    (!search  || b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search))
  );

  document.getElementById('catalog-count').textContent = `${books.length} books found`;
  document.getElementById('catalog-grid').innerHTML = books.length === 0
    ? `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📭</div><div class="empty-state-text">No books match your filters.</div></div>`
    : books.map(b => `
      <div class="book-card">
        <div class="book-card-id">${b.id}</div>
        <div class="book-card-title">${b.title}</div>
        <div class="book-card-author">by ${b.author}</div>
        <div class="book-card-meta">
          ${badge('purple', b.subject)}
          ${badge('blue', b.branch)}
        </div>
        <div class="book-card-footer">
          <span style="font-size:12px;color:var(--muted)">${b.available}/${b.qty} left</span>
          <div class="flex-gap">
            ${b.available > 0 ? badge('green','Available') : badge('red','Unavailable')}
            <button class="btn btn-ghost btn-sm" onclick="showQRModal('${b.id}')">QR</button>
          </div>
        </div>
      </div>
    `).join('');
}

/* ── MY BOOKS ─────────────────────────────────────────── */
let _extTargetId = null;

function renderMyBooks() {
  const session  = Auth.getSession();
  const myIssued = DB.issuedForStudent(session.id);
  const container = document.getElementById('mybooks-list');

  if (myIssued.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">You haven't borrowed any books yet.</div></div>`;
    return;
  }

  container.innerHTML = myIssued.map(i => {
    const book = DB.findBook(i.bookId);
    const over = isOverdue(i.dueDate);
    const ext  = i.extRequest;
    let extHtml = '';
    if (!ext) {
      extHtml = `<button class="btn btn-ghost btn-sm" onclick="openExtModal('${i.id}')">📅 Request Extension</button>`;
    } else if (ext.status === 'pending') {
      extHtml = badge('yellow', `⏳ Pending (+${ext.days} days)`);
    } else if (ext.status === 'approved') {
      extHtml = badge('green', `✓ Approved (+${ext.days} days)`);
    } else {
      extHtml = badge('red', '✗ Rejected');
    }

    return `
      <div class="mybook-card ${over ? 'overdue-card' : 'active-card'}">
        <div class="mybook-top">
          <div>
            <div style="font-weight:800;font-size:15px;margin-bottom:4px">${book?.title || i.bookId}</div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:10px">by ${book?.author || '—'}</div>
            <div class="flex-gap">
              ${badge('purple', book?.subject || '')}
              ${badge('blue', book?.branch || '')}
              ${over ? badge('red','⚠ Overdue') : badge('green','✓ Active')}
            </div>
          </div>
          <div class="mybook-dates">
            <div class="lbl">Issued</div>
            <div class="val">${i.issueDate}</div>
            <div class="lbl">Due Date</div>
            <div class="val" style="color:${over ? 'var(--red)' : 'inherit'}">${i.dueDate}</div>
          </div>
        </div>
        <hr class="divider"/>
        <div class="flex-gap" style="justify-content:space-between">
          <div>${extHtml}</div>
        </div>
      </div>
    `;
  }).join('');
}

function openExtModal(issueId) {
  _extTargetId = issueId;
  document.getElementById('ext-days').value   = '7';
  document.getElementById('ext-reason').value = '';
  openModal('ext-modal');
}

function submitExtension() {
  if (!_extTargetId) return;
  const days   = parseInt(document.getElementById('ext-days').value);
  const reason = document.getElementById('ext-reason').value.trim();
  DB.updateIssued(_extTargetId, { extRequest: { status:'pending', days, reason } });
  closeAllModals();
  refreshSidebarBadge();
  renderMyBooks();
}

/* ── ADMIN DASHBOARD ──────────────────────────────────── */
function renderAdminDashboard() {
  const books    = DB.getBooks();
  const students = DB.getStudents();
  const issued   = DB.getIssued();
  const totalQty = books.reduce((a,b) => a + b.qty, 0);
  const totalAv  = books.reduce((a,b) => a + b.available, 0);
  const overdue  = issued.filter(i => isOverdue(i.dueDate)).length;
  const pending  = issued.filter(i => i.extRequest?.status === 'pending').length;

  document.getElementById('a-stat-grid').innerHTML = `
    <div class="stat-card c1"><div class="stat-icon">📚</div><div class="stat-val">${totalQty}</div><div class="stat-label">Total Books</div></div>
    <div class="stat-card c2"><div class="stat-icon">✅</div><div class="stat-val">${totalAv}</div><div class="stat-label">Available</div></div>
    <div class="stat-card c3"><div class="stat-icon">🔖</div><div class="stat-val">${issued.length}</div><div class="stat-label">Issued Books</div></div>
    <div class="stat-card c4"><div class="stat-icon">🎓</div><div class="stat-val">${students.length}</div><div class="stat-label">Students</div></div>
    <div class="stat-card c5"><div class="stat-icon">⚠️</div><div class="stat-val">${overdue}</div><div class="stat-label">Overdue</div></div>
  `;

  document.getElementById('a-pending-alert').innerHTML = pending > 0
    ? `<div class="alert alert-warn" style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
        <span style="font-size:26px">🔔</span>
        <div><strong>${pending} Extension Request${pending>1?'s':''} Pending</strong><br>
        <span style="font-size:12px">Go to Borrowed Books to approve or reject.</span></div>
       </div>`
    : '';

  /* charts */
  const subjects = ['Programming','Mathematics','Electronics','Mechanical','Other'];
  const branches = ['CSE','ECE','EEE','Mechanical','Civil'];
  const maxS = Math.max(...subjects.map(s => books.filter(b=>b.subject===s).reduce((a,x)=>a+x.qty,0)));
  const maxB = Math.max(...branches.map(br=> books.filter(b=>b.branch===br).reduce((a,x)=>a+x.qty,0)));
  const colors = ['var(--accent)','var(--green)','var(--yellow)','var(--admin)','#9b72ff'];

  document.getElementById('chart-subject').innerHTML = subjects.map((s,i) => {
    const count = books.filter(b=>b.subject===s).reduce((a,x)=>a+x.qty,0);
    const pct   = maxS ? Math.round(count/maxS*100) : 0;
    return `<div class="chart-bar-row">
      <div class="chart-bar-label">${s}</div>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${colors[i]}"></div></div>
      <div class="chart-bar-val">${count}</div>
    </div>`;
  }).join('');

  document.getElementById('chart-branch').innerHTML = branches.map((br,i) => {
    const count = books.filter(b=>b.branch===br).reduce((a,x)=>a+x.qty,0);
    const pct   = maxB ? Math.round(count/maxB*100) : 0;
    return `<div class="chart-bar-row">
      <div class="chart-bar-label">${br}</div>
      <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${colors[i]}"></div></div>
      <div class="chart-bar-val">${count}</div>
    </div>`;
  }).join('');
}

/* ── MANAGE BOOKS ─────────────────────────────────────── */
let _editBookId = null;

function renderManageBooks() {
  const search = (document.getElementById('manage-search')?.value || '').toLowerCase();
  const books  = DB.getBooks().filter(b =>
    !search || b.title.toLowerCase().includes(search) || b.id.toLowerCase().includes(search)
  );
  document.getElementById('manage-count').textContent = `${DB.getBooks().length} books in library`;

  document.getElementById('manage-tbody').innerHTML = books.map(b => `
    <tr>
      <td><span style="font-family:var(--mono);color:var(--accentL)">${b.id}</span></td>
      <td style="font-weight:700">${b.title}</td>
      <td style="color:var(--muted);font-size:12px">${b.author}</td>
      <td>${badge('purple', b.subject)}</td>
      <td>${badge('blue', b.branch)}</td>
      <td>${b.qty}</td>
      <td>${b.available > 0 ? badge('green', b.available) : badge('red','0')}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="showQRModal('${b.id}')">📷</button></td>
      <td>
        <div class="flex-gap">
          <button class="btn btn-ghost btn-sm" onclick="openBookModal('edit','${b.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteBook('${b.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openBookModal(mode, bookId) {
  _editBookId = bookId || null;
  document.getElementById('book-modal-title').textContent = mode === 'add' ? 'Add New Book' : 'Edit Book';
  if (mode === 'edit' && bookId) {
    const b = DB.findBook(bookId);
    document.getElementById('bm-id').value     = b.id;
    document.getElementById('bm-id').disabled  = true;
    document.getElementById('bm-title').value  = b.title;
    document.getElementById('bm-author').value = b.author;
    document.getElementById('bm-subject').value= b.subject;
    document.getElementById('bm-branch').value = b.branch;
    document.getElementById('bm-qty').value    = b.qty;
    document.getElementById('bm-avail').value  = b.available;
  } else {
    document.getElementById('bm-id').value     = '';
    document.getElementById('bm-id').disabled  = false;
    document.getElementById('bm-title').value  = '';
    document.getElementById('bm-author').value = '';
    document.getElementById('bm-subject').value= 'Programming';
    document.getElementById('bm-branch').value = 'CSE';
    document.getElementById('bm-qty').value    = 1;
    document.getElementById('bm-avail').value  = 1;
  }
  openModal('book-modal');
}

function saveBook() {
  const id     = document.getElementById('bm-id').value.trim();
  const title  = document.getElementById('bm-title').value.trim();
  const author = document.getElementById('bm-author').value.trim();
  const subject= document.getElementById('bm-subject').value;
  const branch = document.getElementById('bm-branch').value;
  const qty    = parseInt(document.getElementById('bm-qty').value);
  const avail  = parseInt(document.getElementById('bm-avail').value);

  if (!id || !title || !author) return alert('Please fill in Book ID, Title, and Author.');

  if (_editBookId) {
    DB.updateBook(_editBookId, { title, author, subject, branch, qty, available: avail });
  } else {
    if (DB.findBook(id)) return alert('A book with this ID already exists.');
    DB.addBook({ id, title, author, subject, branch, qty, available: avail });
  }
  closeAllModals();
  renderManageBooks();
  renderAdminDashboard();
}

function deleteBook(id) {
  if (!confirm('Remove this book from the library?')) return;
  DB.deleteBook(id);
  renderManageBooks();
}

/* ── BORROWED BOOKS ───────────────────────────────────── */
let _borrowFilter = 'all';

function setBorrowFilter(f, btn) {
  _borrowFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBorrowed();
}

function renderBorrowed() {
  const issued   = DB.getIssued();
  const pending  = issued.filter(i => i.extRequest?.status === 'pending').length;
  const badge_el = document.getElementById('pending-badge');
  badge_el.textContent    = pending;
  badge_el.style.display  = pending > 0 ? 'inline' : 'none';

  const list = issued.filter(i => {
    if (_borrowFilter === 'overdue') return isOverdue(i.dueDate);
    if (_borrowFilter === 'pending') return i.extRequest?.status === 'pending';
    return true;
  });

  document.getElementById('borrowed-tbody').innerHTML = list.length === 0
    ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted)">No records found.</td></tr>`
    : list.map(i => {
        const book    = DB.findBook(i.bookId);
        const student = DB.getStudents().find(s => s.id === i.studentId);
        const over    = isOverdue(i.dueDate);
        const ext     = i.extRequest;
        let extCell   = '—';
        if (ext) {
          if (ext.status === 'pending') {
            extCell = `<div class="flex-gap">
              <span style="font-size:12px;color:var(--admin)">+${ext.days}d</span>
              <button class="btn btn-success btn-sm" onclick="approveExt('${i.id}')">✓</button>
              <button class="btn btn-danger btn-sm"  onclick="rejectExt('${i.id}')">✗</button>
            </div>`;
          } else if (ext.status === 'approved') {
            extCell = badge('green','Approved');
          } else {
            extCell = badge('red','Rejected');
          }
        }
        return `<tr class="${over ? 'overdue-row':''}">
          <td><div style="font-weight:700">${student?.name||i.studentId}</div><div style="font-size:11px;color:var(--muted)">${student?.id} · ${student?.branch}</div></td>
          <td><div style="font-weight:700">${book?.title||i.bookId}</div><div style="font-size:11px;color:var(--muted)">${i.bookId}</div></td>
          <td style="font-family:var(--mono);font-size:12px">${i.issueDate}</td>
          <td style="font-family:var(--mono);font-size:12px;color:${over?'var(--red)':'inherit'}">${i.dueDate}</td>
          <td>${over ? badge('red','Overdue') : badge('green','Active')}</td>
          <td>${extCell}</td>
        </tr>`;
      }).join('');
}

function approveExt(id) {
  const rec = DB.getIssued().find(i => i.id === id);
  if (!rec) return;
  const newDue = fmt(addDays(new Date(rec.dueDate), rec.extRequest.days));
  DB.updateIssued(id, { dueDate: newDue, extRequest: { ...rec.extRequest, status:'approved' } });
  refreshSidebarBadge();
  renderBorrowed();
}

function rejectExt(id) {
  const rec = DB.getIssued().find(i => i.id === id);
  if (!rec) return;
  DB.updateIssued(id, { extRequest: { ...rec.extRequest, status:'rejected' } });
  refreshSidebarBadge();
  renderBorrowed();
}

function refreshSidebarBadge() { initApp(); }

/* ── QR SCANNER PAGE ──────────────────────────────────── */
let _qrScannedBook = null;

function renderQRPage() {
  _qrScannedBook = null;
  document.getElementById('qr-manual').value = '';
  document.getElementById('qr-result').innerHTML = `
    <div style="text-align:center;padding:40px 0;color:var(--muted)">
      <div style="font-size:40px;margin-bottom:10px">🔍</div>
      Scan or enter a Book ID to see details
    </div>`;
}

function qrLookup() {
  const id = document.getElementById('qr-manual').value.trim().toUpperCase();
  if (!id) return;
  const book = DB.findBook(id) || DB.getBooks().find(b => b.id.toUpperCase() === id);
  if (!book) {
    showQRResult(null, `No book found with ID: <b>${id}</b>`);
  } else {
    _qrScannedBook = book;
    showQRResult(book);
  }
}

function simulateScan() {
  const books = DB.getBooks();
  const book  = books[Math.floor(Math.random() * books.length)];
  document.getElementById('qr-manual').value = book.id;
  const box   = document.getElementById('qr-box');
  box.style.borderColor = 'var(--green)';
  setTimeout(() => { box.style.borderColor = 'var(--accent)'; }, 1500);
  _qrScannedBook = book;
  showQRResult(book);
}

function showQRResult(book, errMsg) {
  const el = document.getElementById('qr-result');
  if (!book) {
    el.innerHTML = `<div class="alert alert-err">⚠️ ${errMsg}</div>`;
    return;
  }
  const students = DB.getStudents();
  el.innerHTML = `
    <div class="qr-book-info">
      <canvas id="qr-result-canvas" width="80" height="80" style="border-radius:8px;flex-shrink:0"></canvas>
      <div>
        <div style="font-weight:800;font-size:15px;margin-bottom:4px">${book.title}</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:10px">by ${book.author}</div>
        <div class="flex-gap">
          ${badge('purple', book.subject)}
          ${badge('blue', book.branch)}
          ${book.available > 0 ? badge('green', book.available + ' available') : badge('red','Unavailable')}
        </div>
      </div>
    </div>
    <div class="form-group">
      <label>Action</label>
      <select id="qr-action">
        <option value="issue">📤 Issue Book</option>
        <option value="return">📥 Return Book</option>
      </select>
    </div>
    <div class="form-group">
      <label>Student ID</label>
      <select id="qr-student">
        <option value="">— Select Student —</option>
        ${students.map(s => `<option value="${s.id}">${s.id} — ${s.name}</option>`).join('')}
      </select>
    </div>
    <button class="btn btn-primary btn-full" style="margin-top:14px" onclick="executeQR()">Execute</button>
    <div id="qr-msg" style="margin-top:12px"></div>
  `;
  drawQR(document.getElementById('qr-result-canvas'), book.id, 80);
}

function executeQR() {
  if (!_qrScannedBook) return;
  const action    = document.getElementById('qr-action').value;
  const studentId = document.getElementById('qr-student').value;
  const msgEl     = document.getElementById('qr-msg');
  if (!studentId) { msgEl.innerHTML = `<div class="alert alert-err">Please select a student.</div>`; return; }

  const student = DB.getStudents().find(s => s.id === studentId);
  const book    = DB.findBook(_qrScannedBook.id);

  if (action === 'issue') {
    if (book.available < 1) { msgEl.innerHTML = `<div class="alert alert-err">No copies available.</div>`; return; }
    const newRec = {
      id:        'I' + Date.now(),
      bookId:    book.id,
      studentId: student.id,
      issueDate: fmt(new Date()),
      dueDate:   fmt(addDays(new Date(), 14)),
      extRequest: null,
    };
    DB.addIssued(newRec);
    DB.updateBook(book.id, { available: book.available - 1 });
    msgEl.innerHTML = `<div class="alert alert-ok">✓ <b>${book.title}</b> issued to <b>${student.name}</b>. Due: ${newRec.dueDate}</div>`;
    _qrScannedBook = null;
  } else {
    const rec = DB.getIssued().find(i => i.bookId === book.id && i.studentId === studentId);
    if (!rec) { msgEl.innerHTML = `<div class="alert alert-err">No active issue found for this student.</div>`; return; }
    DB.removeIssued(rec.id);
    DB.updateBook(book.id, { available: book.available + 1 });
    msgEl.innerHTML = `<div class="alert alert-ok">✓ <b>${book.title}</b> returned by <b>${student.name}</b>.</div>`;
    _qrScannedBook = null;
  }
}

/* ── MODALS ───────────────────────────────────────────── */
function openModal(id) {
  document.getElementById('modal-overlay').classList.add('show');
  document.getElementById(id).classList.add('show');
}
function closeAllModals() {
  document.getElementById('modal-overlay').classList.remove('show');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
}
function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) closeAllModals();
}

/* ── INIT ─────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  initApp();
  goTo('home');
});
