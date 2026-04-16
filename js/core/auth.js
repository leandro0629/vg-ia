// ============================================================
// AUTHENTICATION MODULE — Multi-Tenant SaaS
// ============================================================

import { AUTH_KEY, USERS_KEY, PERMISSIONS, SESSION_TIMEOUT_MS, SESSION_WARNING_MS } from '../utils/constants.js';

// UUID fixo do escritório VG (corresponde ao registro na tabela offices do Supabase)
export const VG_OFFICE_ID = '00000000-0000-0000-0000-000000000001';

// Global state
export let currentUser = null;

export function setCurrentUser(user) {
  currentUser = user;
}
let _inactivityTimer = null;
let _warningTimer = null;
let _warningToastEl = null;

// ─── BroadcastChannel — Logout em todas as abas ───
const _authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('kausas-auth') : null;

if (_authChannel) {
  _authChannel.onmessage = (e) => {
    if (e.data === 'logout') {
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

// ─── Session Management ───
export function getSession() {
  try {
    const fromSession = sessionStorage.getItem(AUTH_KEY);
    if (fromSession) return JSON.parse(fromSession);

    const fromLocal = localStorage.getItem(AUTH_KEY);
    if (fromLocal) {
      const parsed = JSON.parse(fromLocal);
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

// ─── Load/Save Users (legado — VG durante transição) ───
export function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Initialize Users (mantém VG funcionando durante transição) ───
export async function initializeUsers() {
  let users = loadUsers();

  const _adminAccount = {
    id: 'admin',
    email: 'kausasvgadmin@gmail.com',
    password: '971f1b3eb49623397a2c21f57d909e482f08877e03790e66dd8782c9e5030ec6',
    _hashed: true,
    profile: 'admin',
    name: 'Admin Geral',
    memberId: null,
    officeId: VG_OFFICE_ID,
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
    { id: 'gleydson',   email: 'gleydson@vgai.com',        password: '27e3082999e97f6ca2afe32e18e24c3bb18839ae11a2f2a45452751a054d2f5a', profile: 'socio',      name: 'Gleydson',        memberId: 1  },
    { id: 'caio',       email: 'caio@vgai.com',            password: '3ccab5b3522a3bd25cb3cc20f26de86081ed8d81dcc9c4fbe541cfee1182cc35', profile: 'advogado',   name: 'Caio',            memberId: 2  },
    { id: 'izabelle',   email: 'izabelle@vgai.com',        password: 'f036f44740043840fbd447d03ac1d2f24117df3cfdae2f3538a92cac510b9428', profile: 'advogado',   name: 'Izabelle',        memberId: 3  },
    { id: 'juli',       email: 'juli@vgai.com',            password: 'd3a9ea88e70136c4f951750ea44760f48dcac1aacd04223adcb87417bb2e80f6', profile: 'estagiario', name: 'Juli',            memberId: 4  },
    { id: 'yuripompeu', email: 'yuripompeu@vgai.com',      password: 'd62c202205af3dd980a9555fa230c9c298c4993a1c007c275454cd29eaaa1761', profile: 'advogado',   name: 'Yuri Pompeu',     memberId: 5  },
    { id: 'nakano',     email: 'nakano@vgai.com',          password: '68ced2b8e6f9c29e8dc58601937a664b034c34234511d27822e8e4f8dd991d96', profile: 'advogado',   name: 'Nakano',          memberId: 6  },
    { id: 'larissa',    email: 'larissa@vgai.com',         password: '0e81e19dad096661ac2dd725e699592e564cc725d01071507ec8960354fb8830', profile: 'estagiario', name: 'Larissa',         memberId: 7  },
    { id: 'wagner',     email: 'wagner@vgai.com',          password: '1df9739cd4ca15d1ec4b799edbcb3dc5a846d670831454f30868e4e1fa000a67', profile: 'socio',      name: 'Wagner',          memberId: 8  },
    { id: 'yuribeleza', email: 'yuribeleza@vgai.com',      password: 'b7f0631a6394b863d55b14807b34d81292399e43c72312100d7d7202b8afbfbb', profile: 'advogado',   name: 'Yuri Beleza',     memberId: 9  },
    { id: 'nicole',     email: 'nicole@vgai.com',          password: '79906bc346e530574f412177c83e3aca89eccd40893225ce509b58ef238fdb53', profile: 'advogado',   name: 'Nicole',          memberId: 10 },
    { id: 'felipe',     email: 'felipe@vgai.com',          password: '679c19f3bb1b3911e3935966d758cd0e83bfae482ea388e8fa9917ce475660e6', profile: 'advogado',   name: 'Felipe',          memberId: 11 },
    { id: 'erika',      email: 'erika@vgai.com',           password: '60dd496ccc0fa76fd5b0fce169206dd71811905a7e9cb26e486087642322f57a', profile: 'advogado',   name: 'Erika',           memberId: 12 },
    { id: 'leandro',    email: 'leandrosmg0629@gmail.com', password: '971f1b3eb49623397a2c21f57d909e482f08877e03790e66dd8782c9e5030ec6', profile: 'estagiario', name: 'Leandro Andrade', memberId: 13 },
    { id: 'roger',      email: 'roger@vgai.com',           password: '19501e35e10dd79a59f4e3f2e173c4955f0903911146a82cf0d1d0b6be75c117', profile: 'estagiario', name: 'Roger Cunha',     memberId: 14 },
  ];

  for (const memberUser of memberUsersPlain) {
    const hashedUser = { ...memberUser, _hashed: true, officeId: VG_OFFICE_ID };
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

// ─── Password Overrides ───
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
  if (typeof window._sbSave === 'function') window._sbSave(_OVERRIDES_KEY, overrides);
}

// ─── Quick Login — Multi-Tenant ───
export async function quickLogin(email, pass, rememberMe = false) {
  const hashed = await hashPassword(pass);
  const emailLower = email.toLowerCase().trim();

  // 1. Tentar login via Supabase (tabela office_users — novos escritórios)
  if (window._sb) {
    try {
      const { data: sbUser, error } = await window._sb
        .from('office_users')
        .select('*')
        .eq('email', emailLower)
        .single();

      if (!error && sbUser && sbUser.password_hash !== 'pending_sync') {
        if (sbUser.password_hash === hashed) {
          const sessionUser = {
            id: sbUser.id,
            email: sbUser.email,
            profile: sbUser.role,
            name: sbUser.name,
            memberId: sbUser.member_id,
            photo: sbUser.photo || null,
            officeId: sbUser.office_id,
          };
          setSession(sessionUser, rememberMe);
          currentUser = sessionUser;
          return { user: sessionUser };
        }
        // Hash não bate no Supabase — cai no fallback local
        // (senha pode ter sido trocada localmente mas Supabase não atualizou ainda)
      }
    } catch {
      // Tabela ainda não existe — usa fallback local
    }
  }

  // 2. Fallback: login local (VG Advocacia durante transição)
  const users = loadUsers();
  const user = users.find((u) => u.email === emailLower || u.email === email);
  if (!user) return { error: 'Email ou senha incorretos' };

  const overrides = _loadOverrides();
  const override = overrides.find((o) => o.userId === user.id);
  const activeHash = override ? override.hash : user.password;

  const match = user._hashed || override
    ? activeHash === hashed
    : user.password === pass;

  if (!match) return { error: 'Email ou senha incorretos' };

  const sessionUser = {
    id: user.id,
    email: user.email,
    profile: user.profile,
    name: user.name,
    memberId: user.memberId,
    photo: user.photo || null,
    officeId: user.officeId || VG_OFFICE_ID,
  };

  setSession(sessionUser, rememberMe);
  currentUser = sessionUser;

  // Sincronizar senha para Supabase (silencioso)
  _syncVGPasswordToSupabase(user.id, activeHash).catch(() => {});

  return { user: sessionUser };
}

// Sincroniza senha do VG para Supabase após login
async function _syncVGPasswordToSupabase(userId, hash) {
  if (!window._sb) return;
  try {
    await window._sb
      .from('office_users')
      .update({ password_hash: hash })
      .eq('id', userId);
  } catch {
    // Silencioso
  }
}

// ─── Validar Invite Code ───
async function validateAndUseInviteCode(inviteCode) {
  if (!window._sb) return { error: 'Sistema offline. Tente novamente.' };
  if (!inviteCode || inviteCode.trim().length === 0) return { error: 'Código de convite obrigatório' };

  const code = inviteCode.trim().toUpperCase();

  try {
    // Buscar invite code
    const { data, error } = await window._sb
      .from('invite_codes')
      .select('id, is_used, expires_at')
      .eq('code', code)
      .single();

    if (error || !data) return { error: 'Código de convite inválido ou expirado' };

    // Verificar se já foi usado
    if (data.is_used) return { error: 'Este código de convite já foi utilizado' };

    // Verificar expiração
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at).getTime();
      if (Date.now() > expiresAt) return { error: 'Código de convite expirado' };
    }

    return { success: true, inviteCodeId: data.id };
  } catch (e) {
    console.error('Erro ao validar invite code:', e);
    return { error: 'Erro ao validar código. Tente novamente.' };
  }
}

// ─── Signup de Novo Escritório (SaaS) ───
export async function signupOffice({ inviteCode, officeName, cnpj, adminEmail, adminPassword }) {
  if (!window._sb) return { error: 'Sistema offline. Tente novamente.' };
  if (!inviteCode || !officeName || !adminEmail || !adminPassword) return { error: 'Preencha todos os campos obrigatórios' };
  if (adminPassword.length < 6) return { error: 'Senha deve ter no mínimo 6 caracteres' };

  // Validar invite code
  const codeValidation = await validateAndUseInviteCode(inviteCode);
  if (codeValidation.error) return codeValidation;

  const emailLower = adminEmail.toLowerCase().trim();
  const officeId = 'office_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const adminId  = 'user_'   + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const passwordHash = await hashPassword(adminPassword);

  // Verificar se email já existe
  try {
    const { data: existing } = await window._sb
      .from('office_users')
      .select('id')
      .eq('email', emailLower)
      .single();
    if (existing) return { error: 'Este email já está cadastrado' };
  } catch {
    // Email não existe — pode continuar
  }

  // Criar escritório
  const { error: officeError } = await window._sb
    .from('offices')
    .insert({ id: officeId, name: officeName, cnpj: cnpj || '', email: emailLower });

  if (officeError) return { error: 'Erro ao criar escritório. Tente novamente.' };

  // Criar admin do escritório
  const { error: userError } = await window._sb
    .from('office_users')
    .insert({
      id: adminId,
      office_id: officeId,
      email: emailLower,
      password_hash: passwordHash,
      role: 'admin',
      name: 'Administrador',
    });

  if (userError) {
    await window._sb.from('offices').delete().eq('id', officeId);
    return { error: 'Erro ao criar usuário. Tente novamente.' };
  }

  // Marcar invite code como usado
  try {
    await window._sb
      .from('invite_codes')
      .update({ is_used: true, used_by: officeId })
      .eq('id', codeValidation.inviteCodeId);
  } catch (e) {
    console.error('Erro ao marcar invite code como usado:', e);
    // Não falha a criação da conta se isso der erro
  }

  // Login automático após signup
  return await quickLogin(adminEmail, adminPassword);
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

// ─── Recuperação de Senha ───
const _RESET_KEY = 'lex_reset_requests';

export function requestPasswordReset(email) {
  const users = loadUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return { error: 'Email não encontrado no sistema' };

  const requests = _loadResetRequests();
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

  if (typeof window._sbSave === 'function') window._sbSave(_RESET_KEY, requests);

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
  if (!userId || !newPassword) return { error: 'Parâmetros inválidos' };
  if (!window.currentUser) return { error: 'Não autenticado' };
  if (window.currentUser.profile !== 'admin' && window.currentUser.profile !== 'socio') {
    return { error: 'Sem permissão' };
  }

  const hash = await hashPassword(newPassword);
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    users[idx].password = hash;
    users[idx]._hashed = true;
    users[idx]._passwordChanged = true;
    saveUsers(users);
  }

  _saveOverride(userId, hash);

  const requests = _loadResetRequests();
  requests.forEach((r) => { if (r.userId === userId) r.status = 'resolved'; });
  localStorage.setItem(_RESET_KEY, JSON.stringify(requests));
  if (typeof window._sbSave === 'function') window._sbSave(_RESET_KEY, requests);

  if (window._sb) {
    try { await window._sb.from('office_users').update({ password_hash: hash }).eq('id', userId); } catch {}
  }

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

  _saveOverride(currentUser.id, newHash);

  if (window._sb) {
    try { await window._sb.from('office_users').update({ password_hash: newHash }).eq('id', currentUser.id); } catch {}
  }

  return { success: true };
}
