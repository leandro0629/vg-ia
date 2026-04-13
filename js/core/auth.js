// ============================================================
// AUTHENTICATION MODULE
// ============================================================

import { AUTH_KEY, USERS_KEY, PERMISSIONS, SESSION_TIMEOUT_MS, SESSION_WARNING_MS } from '../utils/constants.js';

// Global state
export let currentUser = null;
let _inactivityTimer = null;
let _warningTimer = null;
let _warningToastEl = null;

// ─── Session Management ───
export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

export function setSession(user) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_KEY);
}

// ─── Load/Save Users ───
export function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveUsers(users, syncRemote = true) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  // Sync com Supabase se disponível
  if (syncRemote && typeof window._sbSave === 'function') {
    window._sbSave(USERS_KEY, users);
  }
}

// ─── Initialize Users (setup na primeira carga) ───
export function initializeUsers() {
  let users = loadUsers();

  // Admin account (sempre sincronizado)
  const _adminAccount = {
    id: 'admin',
    email: 'admin@vgai.com',
    password: 'admin123',
    profile: 'admin',
    name: 'Admin Geral',
    memberId: null,
    photo: 'https://api.dicebear.com/7.x/initials/svg?seed=AG&backgroundColor=000000&textColor=ffffff',
  };

  const _adminIdx = users.findIndex((u) => u.id === 'admin');
  if (_adminIdx === -1) {
    users.unshift(_adminAccount);
  } else {
    users[_adminIdx] = _adminAccount;
  }

  // Team members (sempre sincronizados)
  const memberUsers = [
    { id: 'gleydson', email: 'gleydson@vgai.com', password: 'gleydson123', profile: 'socio', name: 'Gleydson', memberId: 1 },
    { id: 'caio', email: 'caio@vgai.com', password: 'caio123', profile: 'advogado', name: 'Caio', memberId: 2 },
    { id: 'izabelle', email: 'izabelle@vgai.com', password: 'izabelle123', profile: 'advogado', name: 'Izabelle', memberId: 3 },
    { id: 'juli', email: 'juli@vgai.com', password: 'juli123', profile: 'estagiario', name: 'Juli', memberId: 4 },
    { id: 'yuripompeu', email: 'yuripompeu@vgai.com', password: 'yuri123', profile: 'advogado', name: 'Yuri Pompeu', memberId: 5 },
    { id: 'nakano', email: 'nakano@vgai.com', password: 'nakano123', profile: 'advogado', name: 'Nakano', memberId: 6 },
    { id: 'larissa', email: 'larissa@vgai.com', password: 'larissa123', profile: 'estagiario', name: 'Larissa', memberId: 7 },
    { id: 'wagner', email: 'wagner@vgai.com', password: 'wagner123', profile: 'socio', name: 'Wagner', memberId: 8 },
    { id: 'yuribeleza', email: 'yuribeleza@vgai.com', password: 'yuri123', profile: 'advogado', name: 'Yuri Beleza', memberId: 9 },
    { id: 'nicole', email: 'nicole@vgai.com', password: 'nicole123', profile: 'advogado', name: 'Nicole', memberId: 10 },
    { id: 'felipe', email: 'felipe@vgai.com', password: 'felipe123', profile: 'advogado', name: 'Felipe', memberId: 11 },
    { id: 'erika', email: 'erika@vgai.com', password: 'erika123', profile: 'advogado', name: 'Erika', memberId: 12 },
    { id: 'leandro', email: 'leandrosmg0629@gmail.com', password: 'leandro123', profile: 'estagiario', name: 'Leandro Andrade', memberId: 13 },
    { id: 'roger', email: 'roger@vgai.com', password: 'roger123', profile: 'estagiario', name: 'Roger Cunha', memberId: 14 },
  ];

  memberUsers.forEach((memberUser) => {
    const idx = users.findIndex((u) => u.id === memberUser.id);
    if (idx === -1) {
      users.push(memberUser);
    } else {
      users[idx] = memberUser;
    }
  });

  // Remove duplicates
  const _emailMap = new Map();
  users.forEach((u) => {
    const existing = _emailMap.get(u.email);
    if (!existing || (!existing.memberId && u.memberId)) {
      _emailMap.set(u.email, u);
    }
  });

  const _idMap = new Map();
  [..._emailMap.values()].forEach((u) => {
    if (!_idMap.has(u.id)) _idMap.set(u.id, u);
  });

  users = [..._idMap.values()];
  saveUsers(users);

  return users;
}

// ─── Quick Login (Email + Senha) ───
export async function quickLogin(email, pass) {
  const users = loadUsers();
  const user = users.find((u) => u.email === email && u.password === pass);

  if (!user) {
    return { error: 'Email ou senha incorretos' };
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    profile: user.profile,
    name: user.name,
    memberId: user.memberId,
    photo: user.photo,
  };

  setSession(sessionUser);
  currentUser = sessionUser;
  return { user: sessionUser };
}

// ─── Logout ───
export async function doLogout() {
  clearTimeout(_inactivityTimer);
  clearTimeout(_warningTimer);
  if (_warningToastEl) {
    _warningToastEl.remove();
    _warningToastEl = null;
  }

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((evt) => document.removeEventListener(evt, _resetInactivityTimer));

  clearSession();
  currentUser = null;

  // Voltar para login
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) {
    loginScreen.classList.remove('hidden');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPass').value = '';
  }
}

// ─── Inactivity Timer ───
function _resetInactivityTimer() {
  if (!currentUser) return;

  clearTimeout(_inactivityTimer);
  clearTimeout(_warningTimer);
  if (_warningToastEl) {
    _warningToastEl.remove();
    _warningToastEl = null;
  }

  // Aviso 1 min antes
  _warningTimer = setTimeout(() => {
    _warningToastEl = document.createElement('div');
    _warningToastEl.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:#1a1a2e;border:1px solid var(--primary);color:var(--text-primary);
      padding:14px 24px;border-radius:10px;z-index:99999;
      box-shadow:0 4px 20px rgba(0,0,0,.5);font-size:.88rem;text-align:center;
      display:flex;align-items:center;gap:14px;
    `;
    _warningToastEl.innerHTML = `
      <span>⏱️ Sessão expira em <strong>1 minuto</strong> por inatividade.</span>
      <button style="padding:6px 14px;background:var(--primary);color:#000;border:none;border-radius:6px;font-weight:700;cursor:pointer;">Continuar</button>
    `;
    const btn = _warningToastEl.querySelector('button');
    btn.onclick = () => _resetInactivityTimer();
    document.body.appendChild(_warningToastEl);
  }, SESSION_TIMEOUT_MS - SESSION_WARNING_MS);

  // Logout automático após 2h
  _inactivityTimer = setTimeout(() => {
    if (_warningToastEl) {
      _warningToastEl.remove();
      _warningToastEl = null;
    }
    doLogout();

    // Mensagem de sessão expirada
    setTimeout(() => {
      const msg = document.createElement('div');
      msg.style.cssText = `
        position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:var(--card);border:1px solid var(--border);color:var(--text-primary);
        padding:28px 36px;border-radius:12px;z-index:99999;text-align:center;
        box-shadow:0 8px 32px rgba(0,0,0,.6);
      `;
      msg.innerHTML = `
        <div style="font-size:1.5rem;margin-bottom:8px">🔒</div>
        <div style="font-weight:600;margin-bottom:4px">Sessão expirada</div>
        <div style="font-size:.85rem;color:var(--text-secondary)">2 horas de inatividade. Faça login novamente.</div>
      `;
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 4000);
    }, 100);
  }, SESSION_TIMEOUT_MS);
}

export function startInactivityWatch() {
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((evt) => document.addEventListener(evt, _resetInactivityTimer, { passive: true }));
  _resetInactivityTimer();
}

// ─── Permissions ───
export function canDo(action) {
  if (!currentUser) return false;
  const perms = PERMISSIONS[currentUser.profile];
  if (!perms) return false;
  return perms[action] === true;
}

export function canSeePage(page) {
  if (!currentUser) return false;
  const perms = PERMISSIONS[currentUser.profile];
  if (!perms) return false;
  return perms.pages.includes(page);
}

// ─── Change Password ───
export function changePassword(oldPassword, newPassword) {
  if (!currentUser) {
    return { error: 'Usuário não autenticado' };
  }

  const users = loadUsers();
  const userIdx = users.findIndex((u) => u.id === currentUser.id);

  if (userIdx === -1 || users[userIdx].password !== oldPassword) {
    return { error: 'Senha atual incorreta' };
  }

  users[userIdx].password = newPassword;
  saveUsers(users);
  return { success: true };
}
