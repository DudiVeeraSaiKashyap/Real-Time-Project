/* ── auth.js — session management ────────────────────── */

const SESSION_KEY = 'lms_session';

const Auth = {
  getSession()  { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); },
  setSession(s) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); },
  clearSession(){ sessionStorage.removeItem(SESSION_KEY); },
  isLoggedIn()  { return !!this.getSession(); },
  isAdmin()     { const s = this.getSession(); return s && s.type === 'admin'; },
  isStudent()   { const s = this.getSession(); return s && s.type === 'student'; },
};

window.Auth = Auth;

/* ── Student Login ────────────────────────────────────── */
function studentLogin() {
  const id = document.getElementById('sl-id').value.trim();
  const pw = document.getElementById('sl-pw').value;
  const err = document.getElementById('student-login-err');

  if (!id || !pw) {
    err.textContent = '⚠️ Please enter a Student ID and Password.';
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
  // Find existing student or create a guest session with entered ID
  const student = DB.getStudents().find(s => s.id === id) || { id, name: id, branch: 'General', year: 1 };
  Auth.setSession({ type:'student', id: student.id, name: student.name, branch: student.branch, year: student.year });
  document.getElementById('sl-id').value = '';
  document.getElementById('sl-pw').value = '';
  initApp();
  goTo('student-dashboard');
}

/* ── Admin Login ──────────────────────────────────────── */
function adminLogin() {
  const id = document.getElementById('al-id').value.trim();
  const pw = document.getElementById('al-pw').value;
  const err = document.getElementById('admin-login-err');

  if (!id || !pw) {
    err.textContent = '⚠️ Please enter a username and password.';
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
  Auth.setSession({ type:'admin', name: id });
  document.getElementById('al-id').value = '';
  document.getElementById('al-pw').value = '';
  initApp();
  goTo('admin-dashboard');
}

/* ── Logout ───────────────────────────────────────────── */
function logout() {
  Auth.clearSession();
  initApp();
  goTo('home');
}
