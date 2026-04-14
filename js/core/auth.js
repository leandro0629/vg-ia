// ============================================================
// AUTHENTICATION MODULE
// ============================================================

import { AUTH_KEY, USERS_KEY, PERMISSIONS, SESSION_TIMEOUT_MS, SESSION_WARNING_MS } from '../utils/constants.js';

// Global state
export let currentUser = null;

export function setCurrentUser(user) {
  currentUser = user;
}
let _inactivityTimer = null;
let _warningTimer = null;
let _warningToastEl = null;

// ─── Feature #6: BroadcastChannel — Logout em todas as abas ───
const _authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('kausas-auth') : null;

if (_authChannel) {
  _authChannel.onmessage = (e) => {
    if (e.data === 'logout') {
      // Outra aba fez logout — limpar sessão e mostrar tela de login
      clearSession();
      currentUser = null;
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        const emailEl = document.getElementById('loginEmail');
        const passEl = document.getElementById('loginPass');
        if (emailEl) emailEl.value = '';
        if (passEl) passEl.value = '';
      }
    }
  };
}

// ─── Password Hashing (SHA-256 via Web Crypto API) ───
const _SALT = 'kausas_vg_salt_2024';

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + _SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Feature #4: Session Management com "Lembrar de mim" ───
export function getSession() {
  try {
    // Verifica sessionStorage primeiro (aba atual), depois localStorage (lembrar de mim)
    const fromSession = sessionStorage.getItem(AUTH_KEY);
    if (fromSession) return JSON.parse(fromSession);

    const fromLocal = localStorage.getItem(AUTH_KEY);
    if (fromLocal) {
      const parsed = JSON.parse(fromLocal);
      // Verificar se não expirou (7 dias)
      if (parsed._rememberExpiry && Date.now() > parsed._rememberExpiry) {
        localStorage.removeItem(AUTH_KEY);
        return null;
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setSession(user, rememberMe = false) {
  if (rememberMe) {
    // Salva em localStorage com expiração de 7 dias
    const userWithExpiry = { ...user, _rememberExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000 };
    localStorage.setItem(AUTH_KEY, JSON.stringify(userWithExpiry));
  } else {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_KEY);
}

// ─── Load/Save Users ───
export function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  // Nunca sincronizar usuários com Supabase (senhas não devem sair do device)
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Initialize Users ───
export async function initializeUsers() {
  let users = loadUsers();

  const adminHash = await hashPassword('legal0629');
  const _adminAccount = {
    id: 'admin',
    email: 'kausasvgadmin@gmail.com',
    password: adminHash,
    _hashed: true,
    profile: 'admin',
    name: 'Admin Geral',
    memberId: null,
    photo: 'https://api.dicebear.com/7.x/initials/svg?seed=AG&backgroundColor=000000&textColor=ffffff',
  };

  const _adminIdx = users.findIndex((u) => u.id === 'admin');
  if (_adminIdx === -1) {
    users.unshift(_adminAccount);
  } else {
    const existing = users[_adminIdx];
    if (existing._passwordChanged) {
      users[_adminIdx] = { ..._adminAccount, password: existing.password, _passwordChanged: true };
    } else {
      users[_adminIdx] = _adminAccount;
    }
  }

  const memberUsersPlain = [
    { id: 'gleydson',   email: 'gleydson@vgai.com',        password: 'gleydson123',   profile: 'socio',      name: 'Gleydson',        memberId: 1 },
    { id: 'caio',       email: 'caio@vgai.com',            password: 'caio123',       profile: 'advogado',   name: 'Caio',            memberId: 2 },
    { id: 'izabelle',   email: 'izabelle@vgai.com',        password: 'izabelle123',   profile: 'advogado',   name: 'Izabelle',        memberId: 3 },
    { id: 'juli',       email: 'juli@vgai.com',            password: 'juli123',       profile: 'estagiario', name: 'Juli',            memberId: 4 },
    { id: 'yuripompeu', email: 'yuripompeu@vgai.com',      password: 'yuripompeu123', profile: 'advogado',   name: 'Yuri Pompeu',     memberId: 5 },
    { id: 'nakano',     email: 'nakano@vgai.com',          password: 'nakano123',     profile: 'advogado',   name: 'Nakano',          memberId: 6 },
    { id: 'larissa',    email: 'larissa@vgai.com',         password: 'larissa123',    profile: 'estagiario', name: 'Larissa',         memberId: 7 },
    { id: 'wagner',     email: 'wagner@vgai.com',          password: 'wagner123',     profile: 'socio',      name: 'Wagner',          memberId: 8 },
    { id: 'yuribeleza', email: 'yuribeleza@vgai.com',      password: 'yuribeleza123', profile: 'advogado',   name: 'Yuri Beleza',     memberId: 9 },
    { id: 'nicole',     email: 'nicole@vgai.com',          password: 'nicole123',     profile: 'advogado',   name: 'Nicole',          memberId: 10 },
    { id: 'felipe',     email: 'felipe@vgai.com',          password: 'felipe123',     profile: 'advogado',   name: 'Felipe',          memberId: 11 },
    { id: 'erika',      email: 'erika@vgai.com',           password: 'erika123',      profile: 'advogado',   name: 'Erika',           memberId: 12 },
    { id: 'leandro',    email: 'leandrosmg0629@gmail.com', password: 'legal0629',     profile: 'estagiario', name: 'Leandro Andrade', memberId: 13 },
    { id: 'roger',      email: 'roger@vgai.com',           password: 'roger123',      profile: 'estagiario', name: 'Roger Cunha',     memberId: 14 },
  ];

  for (const memberUser of memberUsersPlain) {
    const hashed = await hashPassword(memberUser.password);
    const hashedUser = { ...memberUser, password: hashed, _hashed: true };
    const idx = users.findIndex((u) => u.id === memberUser.id);
    if (idx === -1) {
      users.push(hashedUser);
    } else {
      const existing = users[idx];
      if (existing._passwordChanged) {
        users[idx] = { ...hashedUser, password: existing.password, _passwordChanged: true };
      } else {
        users[idx] = hashedUser;
      }
    }
  }

  // Remove duplicates
  const _emailMap = new Map();
  users.forEach((u) => {
    const existing = _emailMap.get(u.email);
    if (!existing || (!existing.memberId && u.memberId)) _emailMap.set(u.email, u);
  });
  const _idMap = new Map();
  [..._emailMap.values()].forEach((u) => { if (!_idMap.has(u.id)) _idMap.set(u.id, u); });
  users = [..._idMap.values()];
  saveUsers(users);
  return users;
}

// ─── Password Overrides (sincroniza senhas alteradas via Supabase) ───
const _OVERRIDES_KEY = 'lex_password_overrides';

function _loadOverrides() {
  try { return JSON.parse(localStorage.getItem(_OVERRIDES_KEY)) || []; } catch { return []; }
}

function _saveOverride(userId, hash) {
  const overrides = _loadOverrides();
  const idx = overrides.findIndex((o) => o.userId === userId);
  if (idx === -1) overrides.push({ userId, hash });
  else overrides[idx].hash = hash;
  localStorage.setItem(_OVERRIDES_KEY, JSON.stringify(overrides));
  // Sincronizar com Supabase
  if (typeof window._sbSave === 'function') window._sbSave(_OVERRIDES_KEY, overrides);
}

// ─── Quick Login ───
export async function quickLogin(email, pass, rememberMe = false) {
  const users = loadUsers();
  const hashed = await hashPassword(pass);

  const user = users.find((u) => u.email === email);
  if (!user) return { error: 'Email ou senha incorretos' };

  // Checar override de senha (reset pelo admin ou troca pelo usuário)
  const overrides = _loadOverrides();
  const override = overrides.find((o) => o.userId === user.id);
  const activeHash = override ? override.hash : user.password;

  const match = user._hashed || override
    ? activeHash === hashed
    : user.password === pass; // legado

  if (!match) return { error: 'Email ou senha incorretos' };

  const sessionUser = {
    id: user.id,
    email: user.email,
    profile: user.profile,
    name: user.name,
    memberId: user.memberId,
    photo: user.photo,
  };

  setSession(sessionUser, rememberMe);
  currentUser = sessionUser;
  return { user: sessionUser };
}

// ─── Logout ───
export async function doLogout() {
  clearTimeout(_inactivityTimer);
  clearTimeout(_warningTimer);
  if (_warningToastEl) { _warningToastEl.remove(); _warningToastEl = null; }

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((evt) =>
    document.removeEventListener(evt, _resetInactivityTimer)
  );

  clearSession();
  currentUser = null;

  // Feature #6: notificar outras abas
  _authChannel?.postMessage('logout');

  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) {
    loginScreen.classList.remove('hidden');
    const emailEl = document.getElementById('loginEmail');
    const passEl = document.getElementById('loginPass');
    if (emailEl) emailEl.value = '';
    if (passEl) passEl.value = '';
  }
}

// ─── Feature #2: Recuperação de Senha ───
const _RESET_KEY = 'lex_reset_requests';

export function requestPasswordReset(email) {
  const users = loadUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return { error: 'Email não encontrado no sistema' };

  const requests = _loadResetRequests();
  // Evitar spam: só 1 pedido por usuário a cada 5 minutos
  const recent = requests.find((r) => r.userId === user.id && Date.now() - r.createdAt < 5 * 60 * 1000);
  if (recent) return { error: 'Pedido já enviado. Aguarde 5 minutos.' };

  const request = {
    id: `reset_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    createdAt: Date.now(),
    status: 'pending',
  };

  requests.unshift(request);
  localStorage.setItem(_RESET_KEY, JSON.stringify(requests));

  // Salvar no Supabase para admin ver
  if (typeof window._sbSave === 'function') {
    window._sbSave(_RESET_KEY, requests);
  }

  return { success: true };
}

export function _loadResetRequests() {
  try {
    return JSON.parse(localStorage.getItem(_RESET_KEY)) || [];
  } catch {
    return [];
  }
}

export function getPendingResetRequests() {
  return _loadResetRequests().filter((r) => r.status === 'pending');
}

export async function adminResetPassword(userId, newPassword) {
  if (window.currentUser?.profile !== 'admin' && window.currentUser?.profile !== 'socio') {
    return { error: 'Sem permissão' };
  }
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { error: 'Usuário não encontrado' };

  const hash = await hashPassword(newPassword);

  // Salvar localmente
  users[idx].password = hash;
  users[idx]._hashed = true;
  users[idx]._passwordChanged = true;
  saveUsers(users);

  // Sincronizar via override (propaga para todos os dispositivos)
  _saveOverride(userId, hash);

  // Marcar pedido como resolvido
  const requests = _loadResetRequests();
  requests.forEach((r) => { if (r.userId === userId) r.status = 'resolved'; });
  localStorage.setItem(_RESET_KEY, JSON.stringify(requests));
  if (typeof window._sbSave === 'function') window._sbSave(_RESET_KEY, requests);

  return { success: true };
}

// ─── Inactivity Timer ───
function _resetInactivityTimer() {
  if (!currentUser) return;
  clearTimeout(_inactivityTimer);
  clearTimeout(_warningTimer);
  if (_warningToastEl) { _warningToastEl.remove(); _warningToastEl = null; }

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
    _warningToastEl.querySelector('button').onclick = () => _resetInactivityTimer();
    document.body.appendChild(_warningToastEl);
  }, SESSION_TIMEOUT_MS - SESSION_WARNING_MS);

  _inactivityTimer = setTimeout(() => {
    if (_warningToastEl) { _warningToastEl.remove(); _warningToastEl = null; }
    doLogout();
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
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((evt) =>
    document.addEventListener(evt, _resetInactivityTimer, { passive: true })
  );
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
export async function changePassword(oldPassword, newPassword) {
  if (!currentUser) return { error: 'Usuário não autenticado' };

  const users = loadUsers();
  const userIdx = users.findIndex((u) => u.id === currentUser.id);
  if (userIdx === -1) return { error: 'Usuário não encontrado' };

  const existingUser = users[userIdx];
  const oldHash = await hashPassword(oldPassword);
  const passwordMatch = existingUser._hashed
    ? existingUser.password === oldHash
    : existingUser.password === oldPassword;

  if (!passwordMatch) return { error: 'Senha atual incorreta' };

  const newHash = await hashPassword(newPassword);
  users[userIdx].password = newHash;
  users[userIdx]._hashed = true;
  users[userIdx]._passwordChanged = true;
  saveUsers(users);

  // Sincronizar via override (propaga para todos os dispositivos)
  _saveOverride(currentUser.id, newHash);

  return { success: true };
}
